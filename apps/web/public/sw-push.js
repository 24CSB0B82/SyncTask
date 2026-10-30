// Background Web Push Notification & Action Click Handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'SyncTask Deadline Alert';
    const options = {
      body: payload.body || 'You have an upcoming task deadline.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        url: payload.url || '/',
        taskId: payload.taskId,
      },
      vibrate: [150, 80, 150],
      actions: [
        { action: 'open', title: 'View Task' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    event.waitUntil(
      self.registration.showNotification('SyncTask Alert', {
        body: event.data.text(),
        icon: '/favicon.svg',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

