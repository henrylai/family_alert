import { Request, Response } from 'express';
import { db } from '../db/index.js';

export async function registerDevice(req: Request, res: Response): Promise<void> {
  try {
    const { memberId, groupId, endpoint, p256dh, auth, userAgent } = req.body;
    if (!memberId || !groupId || !endpoint || !p256dh || !auth) {
      res.status(400).json({ error: 'Missing required device subscription parameters.' });
      return;
    }

    const device = db.registerDevice({
      memberId,
      groupId,
      endpoint,
      p256dh,
      auth,
      userAgent: userAgent || req.headers['user-agent'] || 'Unknown'
    });

    res.status(200).json({ success: true, deviceId: device.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function unregisterDevice(req: Request, res: Response): Promise<void> {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint required.' });
      return;
    }

    const removed = db.unregisterDevice(endpoint);
    res.status(200).json({ success: removed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
