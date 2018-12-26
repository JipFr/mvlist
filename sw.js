const CACHE_NAME = 'mvlist-v1.0.0';
const urlsToCache= [
	"assets/poster.png",
	"",
	"apple-touch-icon.png",
	"icon-big.png",
	"icon-big-red.png",
	"index.html",
	"main.js",
	"manifest.json",
	"posters.png",
	"style.css",
	"tabs.js"
]

self.addEventListener('install', e => {
	e.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
			return cache.addAll(urlsToCache);
		})
	)
});

self.addEventListener('fetch', e => {
	e.respondWith(
		caches.match(e.request).then(response => {
			return response ? response : fetch(e.request);
		})
	)
});