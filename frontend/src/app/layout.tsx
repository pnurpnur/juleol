// This app does not use a service worker. A stale/ghost service worker left
// on the origin (e.g. from a previous project on localhost:3000, or an old
// deploy) can intercept navigations and cause a reload loop. This inline
// script runs as early as possible and unregisters any service worker and
// clears its caches, so the origin is always SW-free.
const killServiceWorkers = `
(function () {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) { r.unregister(); });
      });
    }
    if (window.caches && caches.keys) {
      caches.keys().then(function (keys) {
        keys.forEach(function (k) { caches.delete(k); });
      });
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="no">
      <head>
        <script dangerouslySetInnerHTML={{ __html: killServiceWorkers }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
