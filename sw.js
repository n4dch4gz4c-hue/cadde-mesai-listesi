self.addEventListener("install",function(e){self.skipWaiting();});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.map(function(x){return caches.delete(x);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener("fetch",function(e){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(function(){return caches.match(e.request);}));});
