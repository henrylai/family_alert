import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initSocketServer } from './socket/index.js';
import { createGroup, joinGroup, getGroupDetails } from './controllers/groupController.js';
import {
  triggerEmergency,
  acknowledgeIncident,
  resolveIncident,
  getActiveIncident
} from './controllers/incidentController.js';
import { registerDevice, unregisterDevice } from './controllers/deviceController.js';
import { getVapidPublicKey } from './services/pushService.js';
import { mountAuth } from './auth.js';
import { ICON_180_PNG, ICON_192_PNG, ICON_32_PNG, ICON_512_PNG, FAVICON_ICO } from './icon-data.js';
import { rateLimit } from './rateLimit.js';
import { db } from './db/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Middleware. In production the frontend is served from this same
// origin, so CORS only needs to cover local development (Vite).
app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use((_req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Initialize WebSockets (handshake is password-gated inside, see socket/index.ts)
initSocketServer(server);

// Health Check for Railway / Cloud Monitoring. Stays public, above the
// password gate, exactly as in Little LaiBrary.
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// App icons stay public, like /health: the service worker and the
// browser's push/notification UI fetch them without a session, and
// they carry no private information. Served from base64 data (the
// Little LaiBrary pattern) at the paths manifest/index.html/sw.js use.
const serveIcon = (base64: string, type: string) => (_req: Request, res: Response) => {
  res.type(type).set('Cache-Control', 'public, max-age=604800').send(Buffer.from(base64, 'base64'));
};
app.get('/icon-192.png', serveIcon(ICON_192_PNG, 'image/png'));
app.get('/icon-512.png', serveIcon(ICON_512_PNG, 'image/png'));
app.get('/apple-touch-icon.png', serveIcon(ICON_180_PNG, 'image/png'));
app.get('/favicon-32.png', serveIcon(ICON_32_PNG, 'image/png'));
app.get('/favicon.ico', serveIcon(FAVICON_ICO, 'image/x-icon'));

// Password gate (active only when APP_PASSWORD is set): everything below
// this line, API, sockets' HTTP fallback and the web app itself, requires
// the cookie that a successful /login sets.
mountAuth(app);

// Group Routes
app.post('/api/groups', rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, message: 'Too many groups created. Try again later.' }), createGroup);
app.post('/api/groups/join', rateLimit({ windowMs: 10 * 60 * 1000, limit: 30, message: 'Too many join attempts. Wait a few minutes, then try again.' }), joinGroup);
app.get('/api/groups/:id', getGroupDetails);

// Incident Routes
app.post('/api/incidents/trigger', rateLimit({ windowMs: 10 * 60 * 1000, limit: 60, message: 'Too many alert attempts. Wait a few minutes, then try again.' }), triggerEmergency);
app.post('/api/incidents/:id/acknowledge', acknowledgeIncident);
app.post('/api/incidents/:id/resolve', resolveIncident);
app.get('/api/incidents/active/:groupId', getActiveIncident);

// Device Push Subscriptions (self_push_notifications pattern)
app.get('/api/push/public-key', (_req: Request, res: Response) => {
  res.status(200).json({ publicKey: getVapidPublicKey() });
});

app.post('/api/devices', registerDevice);
app.post('/api/devices/unregister', unregisterDevice);

// Serve frontend static assets in production
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// Fallback to index.html for SPA client-side routing
app.get('*', (req: Request, res: Response, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(200).send('Family Alert API Running. Connect frontend to /');
    }
  });
});

server.listen(PORT, () => {
  console.log(`[FamilyAlert Backend] Server listening on port ${PORT}`);
  console.log(`[FamilyAlert Backend] Health check available at /health`);
});
