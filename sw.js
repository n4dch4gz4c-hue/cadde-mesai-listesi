const VER="v16";
self.addEventListener("install",function(e){
  self.skipWaiting();
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener("fetch",function(e){
  var u=e.request.url;
  if(u.indexOf("cadde-data.json")!==-1 || u.indexOf("api.github.com")!==-1){
    e.respondWith(fetch(e.request,{cache:"no-store"}));
    return;
  }
  e.respondWith(fetch(e.request,{cache:"no-store"}).catch(function(){
    return caches.match(e.request);
  }));
});
