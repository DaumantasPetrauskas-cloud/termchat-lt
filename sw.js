const CACHE_NAME = 'termos-v1.0.0';
const urlsToCache = [
  '/termchat-lt/',
  '/termchat-lt/index.html',
  '/termchat-lt/manifest.json',
  '/termchat-lt/paho-mqtt.min.js',
  '/termchat-lt/icon-192.svg',
  '/termchat-lt/icon-512.svg'
];\n\n// Install event - cache resources\nself.addEventListener('install', function(event) {\n  event.waitUntil(\n    caches.open(CACHE_NAME)\n      .then(function(cache) {\n        console.log('Opened cache');\n        return cache.addAll(urlsToCache);\n      })\n  );\n});\n\n// Fetch event - serve from cache when offline\nself.addEventListener('fetch', function(event) {\n  event.respondWith(\n    caches.match(event.request)\n      .then(function(response) {\n        // Return cached version or fetch from network\n        if (response) {\n          return response;\n        }\n        return fetch(event.request);\n      }\n    )\n  );\n});\n\n// Activate event - clean up old caches\nself.addEventListener('activate', function(event) {\n  event.waitUntil(\n    caches.keys().then(function(cacheNames) {\n      return Promise.all(\n        cacheNames.map(function(cacheName) {\n          if (cacheName !== CACHE_NAME) {\n            return caches.delete(cacheName);\n          }\n        })\n      );\n    })\n  );\n});