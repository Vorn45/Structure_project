// Firebase Cloud Messaging background service worker.
// Runs in an isolated worker context with no webpack processing, so it can't
// import envs/env or call the authenticated /notification/firebase-config
// endpoint. Instead the app passes the public config as query params when it
// registers this worker (see FcmService._init), and we read them from our own
// registration URL here.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const params = new URLSearchParams(self.location.search);

firebase.initializeApp({
    apiKey: params.get('apiKey'),
    authDomain: params.get('authDomain'),
    projectId: params.get('projectId'),
    storageBucket: params.get('storageBucket'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
});

const messaging = firebase.messaging();

// Data-only messages (no top-level `notification` field — see firebase.service.ts on the
// API side): this is the only handler that ever runs for a background push, so title/body
// come from `payload.data` alongside `link`, and `options.data` always carries the link
// through to notificationclick.
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM] onBackgroundMessage payload', payload);
    const title = payload.data?.title || 'Notification';
    const options = {
        body: payload.data?.body,
        data: payload.data,
    };
    self.registration.showNotification(title, options);
});

// User clicked the OS-level notification popup — focus an existing app tab (navigating
// it to the deep link) or open a new one if none is open.
self.addEventListener('notificationclick', (event) => {
    console.log('[FCM] notificationclick', event.notification.data);
    event.notification.close();

    const link = event.notification.data?.link;
    if (!link) return;

    // The app uses hash-based routing (e.g. /#/member/projects/...), so a plain
    // path segment needs to be placed after the `#` to actually land on that route
    // rather than reloading `/` and dropping the deep link.
    const targetUrl = new URL(`/#${link}`, self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            console.log('[FCM] notificationclick matched clients', clients.length, clients.map((c) => c.url));
            for (const client of clients) {
                if ('focus' in client) {
                    console.log('[FCM] notificationclick posting to existing client', client.url);
                    client.postMessage({ type: 'fcm-notification-click', link });
                    return client.focus();
                }
            }
            console.log('[FCM] notificationclick opening new window', targetUrl);
            return self.clients.openWindow(targetUrl);
        }),
    );
});
