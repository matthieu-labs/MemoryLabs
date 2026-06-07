// Minimal service worker — enables "Add to Home Screen" / installability.
// Network-first; no aggressive caching during the hackathon so you always
// see the latest deploy.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // Pass-through. Add a cache strategy later for offline support.
});
