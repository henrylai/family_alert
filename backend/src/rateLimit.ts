import type { Request, Response, NextFunction } from 'express';

// Small in-memory fixed-window rate limiter, in the same spirit as the
// login throttle in auth.ts: no new dependency, per-IP counters that
// reset when the window passes. Good enough to stop casual brute force
// and spam against a single-instance family deployment.
export function rateLimit(options: { windowMs: number; limit: number; message: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const ip = req.ip ?? 'unknown';
    const entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + options.windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > options.limit) {
      res.status(429).json({ error: options.message });
      return;
    }
    return next();
  };
}
