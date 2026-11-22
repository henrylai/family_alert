// Family Alert Service Worker for High-Urgency Push Notifications

self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 EMERGENCY FAMILY ALERT',
    body: 'Immediate response requested! Tap to open alarm.',
    url: '/'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [500, 200, 500, 200, 500, 200, 800],
    tag: 'family-emergency-alert',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
      incidentId: data.incidentId
    },
    actions: [
      { action: 'open', title: '🚨 Open Alarm Now' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the PWA window or focus if already open
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
