const CACHE_NAME = 'push-one-v2';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

const MESSAGES = {
  gentle: [
    '今日の腕立て1回、まだです。',
    '1回だけやろ。',
    '今日も連続記録つなごう。',
    'まあ1回だけ、やってみよ。',
  ],
  stoic: [
    '0回で終わるな。',
    'やれ。',
    '今日のゼロを防げ。',
    'サボるな。1回だけでいい。',
  ],
  minimal: ['Push One。', '1回。', '今日も。'],
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') return caches.match('/');
    })
  );
});

// サーバーからのプッシュ通知
self.addEventListener('push', (event) => {
  let body = '今日の腕立て1回、やってみよ。';
  let style = 'gentle';

  if (event.data) {
    try {
      const data = event.data.json();
      body = data.body || body;
      style = data.style || style;
    } catch {
      body = event.data.text() || body;
    }
  }

  event.waitUntil(
    self.registration.showNotification('Push One', {
      body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: 'push-one-daily',
      requireInteraction: false,
      actions: [
        { action: 'done', title: '1回やった ✓' },
        { action: 'later', title: 'あとで' },
      ],
    })
  );
});

// 通知クリック — 「1回やった」を押したら達成
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (event.action === 'done') {
        // アプリが開いていればメッセージで達成、なければURLで起動
        if (clients.length > 0) {
          clients[0].postMessage({ type: 'COMPLETE_TODAY' });
          return clients[0].focus();
        }
        return self.clients.openWindow('/?action=complete');
      }
      // 通知本体クリック or「あとで」
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('/');
    })
  );
});
