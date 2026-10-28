/**
 * Service Worker for TaskPulse
 * Handles Background Notifications, Push Events, and Offline Support
 */

const CACHE_NAME = 'taskpulse-cache-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications from the server
self.addEventListener('push', (event) => {
  let data = {
    title: "TaskPulse Reminder",
    body: "You have an approaching deliverable deadline.",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: "taskpulse-deadline",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: data.tag || 'taskpulse-alert',
    vibrate: [200, 100, 200, 100, 200],
    data: data.data || {},
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Open Task' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Periodic background check / immediate SW notification dispatch
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, options, delayMs } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [150, 80, 150],
        ...options,
      });
    }, delayMs || 0);
  }
});
