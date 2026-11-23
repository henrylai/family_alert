import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';

const registerDeviceInput = z.object({
  memberId: z.string().min(1).max(64),
  groupId: z.string().min(1).max(64),
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(500),
  userAgent: z.string().max(500).optional()
});

const unregisterDeviceInput = z.object({
  endpoint: z.string().min(1).max(2000)
});

export async function registerDevice(req: Request, res: Response): Promise<void> {
  try {
    const parsed = registerDeviceInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid device subscription parameters.' });
      return;
    }
    const { memberId, groupId, endpoint, p256dh, auth, userAgent } = parsed.data;

    // Only real members of a real group can register a device for it;
    // otherwise junk subscriptions accumulate and get pushed to.
    const group = db.getGroupById(groupId);
    const member = db.getMemberById(memberId);
    if (!group || !member || member.groupId !== groupId) {
      res.status(403).json({ error: 'Member is not part of this group.' });
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
  } catch {
    res.status(500).json({ error: 'Could not register the device. Try again.' });
  }
}

export async function unregisterDevice(req: Request, res: Response): Promise<void> {
  try {
    const parsed = unregisterDeviceInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Endpoint required.' });
      return;
    }

    const removed = db.unregisterDevice(parsed.data.endpoint);
    res.status(200).json({ success: removed });
  } catch {
    res.status(500).json({ error: 'Could not unregister the device. Try again.' });
  }
}
