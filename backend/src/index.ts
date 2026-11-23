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
import { db } from './db/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize WebSockets
initSocketServer(server);

// Health Check for Railway / Cloud Monitoring
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Group Routes
app.post('/api/groups', createGroup);
app.post('/api/groups/join', joinGroup);
app.get('/api/groups/:id', getGroupDetails);

// Incident Routes
app.post('/api/incidents/trigger', triggerEmergency);
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
