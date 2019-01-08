const CACHE_NAME = "mvlist-v2.1.2";
const urlsToCache= [
	"assets/poster.png",
	"/",
	"style.css",
	"main.js",
	"apple-touch-icon.png",
	"icon-big.png",
	"icon-big-red.png",
	"index.html",
	"manifest.json",
	"posters.png",
	"tabs.js"
];

const changelog = {
	"mvlist-v2.0.1": [
		"Updated service worker to hopefully allow for offline support"
	],
	"mvlist-v2.1.0": [
		"Added rating system for you to rate your own movies!"
	],
	"mvlist-v2.1.1": [
		"Fixed a bug where you couldn't swipe back after rating a movie"
	],
	"mvlist-v2.1.2": [
		"Correct padding-bottom for containers"
	]
}

self.addEventListener('install', e => {
	e.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
			return cache.addAll(urlsToCache);
		})
	)
});

self.addEventListener('fetch', e => {
	// if(!e.request.url.toLowerCase().includes(".png") && !e.request.url.toLowerCase().includes(".jpg") && !e.request.url.toLowerCase().includes("api")) {
	// 	console.log(e.request.url.toLowerCase())
	// 	req = fetch(e.request, {
	// 		cache: "no-cache"
	// 	});

	// 	req.then(onlineResponse => {
	// 		caches.open(CACHE_NAME).then(cache => {
	// 			cache.put(e.request, onlineResponse.clone());
	// 		});
	// 	});	
	// }

	e.respondWith(
		caches.match(e.request).then(response => {
			return response ? response : fetch(e.request);
		})
	)
});