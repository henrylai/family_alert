import webpush from 'web-push';
import { GroupMember, EmergencyIncident } from '../types/index.js';

let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@familyalert.local';

// Generate fallback VAPID keys if not set in environment
if (!vapidPublicKey || !vapidPrivateKey) {
  const generated = webpush.generateVAPIDKeys();
  vapidPublicKey = generated.publicKey;
  vapidPrivateKey = generated.privateKey;
  console.log('[PushService] Generated temporary in-memory VAPID keys.');
  console.log(`[PushService] Public Key: ${vapidPublicKey}`);
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

export function getVapidPublicKey(): string {
  return vapidPublicKey!;
}

export async function sendEmergencyPushToMembers(
  members: GroupMember[],
  incident: EmergencyIncident
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  const payload = JSON.stringify({
    title: `🚨 EMERGENCY ALERT: ${incident.senderName}`,
    body: `Immediate attention requested! Tap to open alarm.`,
    incidentId: incident.id,
    groupId: incident.groupId,
    senderName: incident.senderName,
    startedAt: incident.startedAt,
    urgency: 'high',
    url: '/'
  });

  const pushPromises = members
    .filter(m => m.id !== incident.senderId && m.pushSubscription)
    .map(async member => {
      try {
        await webpush.sendNotification(member.pushSubscription as any, payload, {
          urgency: 'high',
          TTL: 60 * 60 // 1 hour TTL
        });
        success++;
      } catch (err: any) {
        console.error(`[PushService] Failed to send push to member ${member.displayName}:`, err.message);
        failed++;
      }
    });

  await Promise.allSettled(pushPromises);
  return { success, failed };
}
