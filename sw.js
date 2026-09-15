const CACHE = "money-ledger-v2-cache-17";
const ASSETS = [
	"./",
	"./index.html",
	"./style.css?v=20260915-17",
	"./app.js?v=20260915-17",
	"./manifest.json?v=20260915-17",
	"./icon-192.png",
	"./icon-512.png"
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;
	if (event.request.mode === "navigate") {
		event.respondWith(fetch(event.request).catch(() => caches.match("./index.html")));
		return;
	}
	event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
