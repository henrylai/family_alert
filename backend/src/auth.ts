import { createHmac, timingSafeEqual } from 'crypto';
import express from 'express';
import type { Express, Request } from 'express';

// Optional single-password gate for the whole app, using the same pattern
// and conventions as Little LaiBrary's server/auth.ts. It is enabled only
// when APP_PASSWORD is set in the server environment; with no password set
// the app behaves exactly as before, which keeps local development open.
// A correct password sets a signed cookie, so each device signs in once
// and the browser remembers it after that. The token is an issued-at
// timestamp plus an HMAC of it keyed by the password itself, so changing
// the password in the environment signs every device out, and no session
// store is needed. The timestamp also drives sliding renewal: whenever a
// device shows up with a token more than a day old, the response quietly
// includes a fresh cookie, restarting the 400-day clock. The sign-in
// therefore lasts indefinitely in practice; it only lapses after 400
// days without opening the app at all.

const COOKIE_NAME = 'family_alert_session';
// 400 days is the longest cookie lifetime browsers accept (Chrome caps
// Max-Age there, others clamp similar values), so this is as close to
// "remember forever" as a cookie gets.
export const SESSION_COOKIE_MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000;
const REFRESH_AFTER_SECONDS = 24 * 60 * 60;
const TOKEN_MESSAGE = 'family-alert-session-v1';
const FAILURE_WINDOW_MS = 5 * 60 * 1000;
const FAILURE_LIMIT = 10;

export function appPassword(): string {
  return (process.env.APP_PASSWORD ?? '').trim();
}

export function authEnabled(): boolean {
  return appPassword().length > 0;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function passwordMatches(candidate: string): boolean {
  const password = appPassword();
  return password.length > 0 && safeEqual(candidate, password);
}

export function issueSessionToken(now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000);
  const signature = createHmac('sha256', appPassword()).update(`${TOKEN_MESSAGE}:${issuedAt}`).digest('hex');
  return `${issuedAt}.${signature}`;
}

// The token's age in seconds when its signature is genuine, or null when
// the token is missing, malformed, or forged.
export function sessionTokenAge(token: string | undefined, now = Date.now()): number | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const issuedAt = Number(token.slice(0, dot));
  const signature = token.slice(dot + 1);
  if (!Number.isInteger(issuedAt) || issuedAt <= 0) return null;
  const expected = createHmac('sha256', appPassword()).update(`${TOKEN_MESSAGE}:${issuedAt}`).digest('hex');
  if (!safeEqual(signature, expected)) return null;
  return Math.max(0, Math.floor(now / 1000) - issuedAt);
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    const name = part.slice(0, eq).trim();
    if (!name) continue;
    try { cookies[name] = decodeURIComponent(part.slice(eq + 1).trim()); }
    catch { cookies[name] = part.slice(eq + 1).trim(); }
  }
  return cookies;
}

export function isAuthenticated(req: Request): boolean {
  if (!authEnabled()) return true;
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  return sessionTokenAge(token) !== null;
}

// Same check for a raw Cookie header, used by the Socket.IO handshake,
// which does not pass through Express.
export function isAuthenticatedCookie(cookieHeader: string | undefined): boolean {
  if (!authEnabled()) return true;
  const token = parseCookies(cookieHeader)[COOKIE_NAME];
  return sessionTokenAge(token) !== null;
}

// Small in-memory throttle so a guessed URL cannot be brute-forced at
// full speed: after FAILURE_LIMIT wrong passwords from one address,
// further attempts wait out the rest of the window.
const failures = new Map<string, { count: number; resetAt: number }>();

function loginBlocked(ip: string): boolean {
  const entry = failures.get(ip);
  return Boolean(entry && entry.resetAt > Date.now() && entry.count >= FAILURE_LIMIT);
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = failures.get(ip);
  if (!entry || entry.resetAt <= now) failures.set(ip, { count: 1, resetAt: now + FAILURE_WINDOW_MS });
  else entry.count += 1;
}

function loginPage(error: boolean, blocked = false): string {
  const message = blocked
    ? '<p class="error">Too many tries. Wait a few minutes, then try again.</p>'
    : error ? '<p class="error">That password did not match. Try again.</p>' : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="theme-color" content="#020617"/><title>Sign in · Family Alert</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#020617;color:#f1f5f9;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;padding:20px}
.card{width:min(340px,100%);background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:28px 24px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.badge{width:52px;height:52px;margin:0 0 14px;border-radius:14px;background:#dc2626;display:grid;place-items:center;font-size:26px}
h1{font-size:20px;margin:0 0 6px;letter-spacing:-.4px}
p{margin:0 0 16px;color:#94a3b8;font-size:13px;line-height:1.55}
.error{color:#fca5a5;background:#450a0a;border:1px solid #7f1d1d;border-radius:7px;padding:9px 11px;font-size:12px}
label{display:block;font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:7px;text-transform:uppercase;letter-spacing:.05em}
input{width:100%;height:42px;border:1px solid #334155;border-radius:7px;padding:0 12px;font:inherit;font-size:14px;color:#f1f5f9;background:#020617}
input:focus{outline:3px solid #dc2626;outline-offset:2px}
button{width:100%;height:42px;margin-top:14px;border:0;border-radius:7px;background:#dc2626;color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
button:hover{background:#b91c1c}
</style>
</head><body><main class="card"><div class="badge">🚨</div><h1>Family Alert</h1><p>This family emergency alert app is password protected. Enter the password once on this device; opening the app renews the sign-in, so it effectively never expires.</p>${message}<form method="post" action="/login"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus/><button type="submit">Unlock Family Alert</button></form></main></body></html>`;
}

export function mountAuth(app: Express): void {
  app.get('/login', (req, res) => {
    if (!authEnabled() || isAuthenticated(req)) return res.redirect('/');
    return res.type('html').send(loginPage(req.query.error === '1'));
  });
  app.post('/login', express.urlencoded({ extended: false }), (req, res) => {
    if (!authEnabled()) return res.redirect('/');
    const ip = req.ip ?? 'unknown';
    if (loginBlocked(ip)) return res.status(429).type('html').send(loginPage(false, true));
    const candidate = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!passwordMatches(candidate)) {
      recordFailure(ip);
      return res.redirect('/login?error=1');
    }
    failures.delete(ip);
    res.cookie(COOKIE_NAME, issueSessionToken(), {
      httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/', maxAge: SESSION_COOKIE_MAX_AGE_MS,
    });
    return res.redirect('/');
  });
  app.use((req, res, next) => {
    if (!authEnabled()) return next();
    const age = sessionTokenAge(parseCookies(req.headers.cookie)[COOKIE_NAME]);
    if (age === null) {
      if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
        return res.status(401).json({ error: 'Password required. Reload the page to sign in.' });
      }
      return res.redirect('/login');
    }
    // Sliding renewal: a token more than a day old is replaced with a
    // fresh 400-day cookie on whatever response comes next, so opening
    // the app keeps the sign-in alive indefinitely.
    if (age > REFRESH_AFTER_SECONDS) {
      res.cookie(COOKIE_NAME, issueSessionToken(), {
        httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/', maxAge: SESSION_COOKIE_MAX_AGE_MS,
      });
    }
    return next();
  });
}
