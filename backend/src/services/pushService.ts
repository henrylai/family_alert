import webpush from 'web-push';
import { EmergencyIncident } from '../types/index.js';
import { db } from '../db/index.js';

const vapidKeys = db.getOrCreateVapidKeys();
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@familyalert.local';

webpush.setVapidDetails(vapidSubject, vapidKeys.publicKey, vapidKeys.privateKey);

export function getVapidPublicKey(): string {
  return vapidKeys.publicKey;
}

export async function sendEmergencyPushToGroup(
  groupId: string,
  incident: EmergencyIncident
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Retrieve all active device subscriptions in the group (excluding the sender's devices)
  const devices = db.getActiveDevicesByGroupId(groupId).filter(d => d.memberId !== incident.senderId);

  const payload = JSON.stringify({
    title: `🚨 EMERGENCY ALERT: ${incident.senderName}`,
    body: `Immediate attention requested! Tap to open alarm.`,
    data: {
      incidentId: incident.id,
      groupId: incident.groupId,
      senderName: incident.senderName,
      startedAt: incident.startedAt,
      url: `/?alert=${incident.id}&autoplay=true`,
      sound: true
    }
  });

  const pushPromises = devices.map(async device => {
    try {
      const subscription = {
        endpoint: device.endpoint,
        keys: {
          p256dh: device.p256dh,
          auth: device.auth
        }
      };

      await webpush.sendNotification(subscription, payload, {
        urgency: 'high',
        TTL: 60 * 60, // 1 hour TTL
        topic: 'family-emergency'
      });
      success++;
      console.log(`[PushService] Successfully dispatched emergency push to device ${device.id}`);
    } catch (err: any) {
      failed++;
      console.error(`[PushService] Failed push to device ${device.id}: HTTP ${err.statusCode || err.message}`);
      // If subscription expired or was revoked (404 / 410), mark inactive
      if (err.statusCode === 404 || err.statusCode === 410) {
        db.deactivateDevice(device.endpoint);
        console.log(`[PushService] Deactivated expired subscription ${device.id}`);
      }
    }
  });

  await Promise.allSettled(pushPromises);
  return { success, failed };
}
