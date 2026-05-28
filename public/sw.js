const CACHE_NAME = 'push-one-v1';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// 通知文言セット
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
  minimal: [
    'Push One。',
    '1回。',
    '今日も。',
  ],
};

// インストール — アプリシェルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// アクティベート — 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// フェッチ — キャッシュファーストでオフライン対応
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
      // オフライン時のナビゲーションはindex.htmlを返す
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});

// Push通知（バックエンドからの配信時）
self.addEventListener('push', (event) => {
  const style = 'gentle';
  const msgs = MESSAGES[style];
  const body = event.data?.text() || msgs[Math.floor(Math.random() * msgs.length)];

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

// 通知クリック
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (event.action === 'done') {
        if (clients.length > 0) {
          clients[0].postMessage({ type: 'COMPLETE_TODAY' });
          return clients[0].focus();
        }
        return self.clients.openWindow('/?action=complete');
      }
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('/');
    })
  );
});

// メインスレッドからの通知スケジュール指示
let scheduledTimer = null;

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { time, style } = event.data;
    scheduleLocalNotification(time, style);
  }
  if (event.data?.type === 'CANCEL_NOTIFICATION') {
    if (scheduledTimer) {
      clearTimeout(scheduledTimer);
      scheduledTimer = null;
    }
  }
});

function scheduleLocalNotification(timeStr = '21:00', style = 'gentle') {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // 今日の設定時刻を過ぎていたら明日にセット
  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  scheduledTimer = setTimeout(async () => {
    const msgs = MESSAGES[style] || MESSAGES.gentle;
    const body = msgs[Math.floor(Math.random() * msgs.length)];

    await self.registration.showNotification('Push One', {
      body,
      icon: '/icons/icon-192.svg',
      tag: 'push-one-daily',
      requireInteraction: false,
    });

    // 翌日分を再スケジュール
    scheduleLocalNotification(timeStr, style);
  }, delay);
}
