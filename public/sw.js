// Belize Alerts - Background Push Notification & Service Worker Handler
// Sendai Framework for Disaster Risk Reduction 2015-2030

const CACHE_NAME = 'belize-alerts-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || '🚨 Belize Emergency Notification';
    const options = {
      body: payload.message || payload.body || 'New official emergency advisory issued.',
      icon: payload.icon || '/assets/aistudio/image_ff7e619e.png',
      badge: '/assets/aistudio/image_ff7e619e.png',
      tag: payload.tag || `notification_${Date.now()}`,
      requireInteraction: payload.priority === 'Critical',
      vibrate: payload.priority === 'Critical' ? [300, 100, 300, 100, 300] : [200, 100, 200],
      data: {
        url: payload.url || '/',
        notificationId: payload.id,
        category: payload.category,
        priority: payload.priority
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const rawText = event.data.text();
    event.waitUntil(
      self.registration.showNotification('🚨 Belize Emergency Alert', {
        body: rawText,
        icon: '/assets/aistudio/image_ff7e619e.png',
        badge: '/assets/aistudio/image_ff7e619e.png'
      })
    );
  }
});

// Handle notification click to open or focus the Belize Alerts app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Or open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
