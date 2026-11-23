// Family Alert Service Worker for High-Urgency Push Notifications (pattern replicated from self_push_notifications)

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  const rawPayload = event.data ? event.data.text() : '';
  try {
    data = rawPayload ? JSON.parse(rawPayload) : {};
  } catch {
    data = { title: '🚨 EMERGENCY ALERT', body: rawPayload };
  }

  const payload = data.data || {};
  const targetUrl = payload.url || (payload.incidentId ? `/?alert=${payload.incidentId}&autoplay=true` : '/');

  const options = {
    body: data.body || 'Immediate response requested! Tap to open alarm.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [500, 200, 500, 200, 500, 200, 800],
    tag: payload.incidentId || 'family-emergency-alert',
    renotify: true,
    requireInteraction: true,
    data: {
      url: targetUrl,
      incidentId: payload.incidentId
    },
    actions: [
      { action: 'open', title: '🚨 OPEN ALARM NOW' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🚨 EMERGENCY ALERT', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});
