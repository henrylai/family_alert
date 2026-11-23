// Push notification registration and subscription management (replicated from self_push_notifications)

const CURRENT_DEVICE_ID_KEY = 'family_alert_device_id';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser');
  }

  const registration = await navigator.serviceWorker.register('/sw.js', {
    updateViaCache: 'none',
  });

  // Ensure phone does not run a stale service worker
  await registration.update().catch(() => undefined);
  return navigator.serviceWorker.ready;
}

export async function fetchVapidPublicKey(): Promise<string> {
  const res = await fetch('/api/push/public-key');
  if (!res.ok) throw new Error('Failed to fetch VAPID public key from server');
  const data = await res.json();
  if (!data.publicKey) throw new Error('VAPID public key not found on server');
  return data.publicKey;
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  memberId: string,
  groupId: string,
  replaceExisting = false
): Promise<PushSubscription> {
  const vapidPublicKey = await fetchVapidPublicKey();

  const existingSubscription = await registration.pushManager.getSubscription();
  if (replaceExisting && existingSubscription) {
    await existingSubscription.unsubscribe();
  }

  const subscription = !replaceExisting && existingSubscription
    ? existingSubscription
    : await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

  await registerPushSubscription(subscription, memberId, groupId);
  return subscription;
}

/**
 * Re-registers the current browser's existing subscription with the backend.
 * Repairs server-side records without prompting the user.
 */
export async function syncExistingPushSubscription(
  memberId: string,
  groupId: string
): Promise<boolean> {
  if (getPushPermissionStatus() !== 'granted') return false;

  try {
    const registration = await registerServiceWorker();
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    await registerPushSubscription(subscription, memberId, groupId);
    return true;
  } catch (err) {
    console.warn('[Push] Error syncing existing push subscription:', err);
    return false;
  }
}

export function getCurrentDeviceId(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(CURRENT_DEVICE_ID_KEY);
}

export async function disableCurrentPushSubscription(): Promise<void> {
  if (typeof window === 'undefined') return;

  const registration = 'serviceWorker' in navigator
    ? await navigator.serviceWorker.getRegistration()
    : undefined;
  const subscription = await registration?.pushManager.getSubscription();

  try {
    if (subscription) {
      await fetch('/api/devices/unregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.warn('[Push] Error disabling push subscription:', err);
  }

  localStorage.removeItem(CURRENT_DEVICE_ID_KEY);
}

async function registerPushSubscription(
  subscription: PushSubscription,
  memberId: string,
  groupId: string
): Promise<void> {
  const p256dh = encodeSubscriptionKey(subscription, 'p256dh');
  const auth = encodeSubscriptionKey(subscription, 'auth');

  const res = await fetch('/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      memberId,
      groupId,
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      userAgent: navigator.userAgent,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to register device subscription');
  }

  const data = await res.json();
  if (data.deviceId) {
    localStorage.setItem(CURRENT_DEVICE_ID_KEY, data.deviceId);
  }
}

function encodeSubscriptionKey(subscription: PushSubscription, name: 'p256dh' | 'auth'): string {
  const key = subscription.getKey(name);
  if (!key) throw new Error(`Push subscription is missing its ${name} key`);
  // Base64url, not standard base64: web-push decodes these keys as
  // url-safe base64, and standard encoding breaks whenever the raw
  // bytes happen to produce '+' or '/'.
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(key))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getPushPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}
