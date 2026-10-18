const V='muslim-2.3.1-1019';
// install: keep the page and everything it loads (read from index.html itself, so the list never goes stale) for offline use
self.addEventListener('install',e=>{e.waitUntil((async()=>{
  try{
    const c=await caches.open(V), r=await fetch('index.html',{cache:'no-cache'}); if(!r.ok) return;
    const html=await r.clone().text(); await c.put('index.html',r);
    const urls=[...html.matchAll(/(?:src|href)="((?:js|css)\/[^"?#]+)"/g)].map(m=>m[1]);
    await Promise.all(urls.map(u=>c.add(u).catch(()=>{})));
  }catch(err){}
  await self.skipWaiting();
})());});
// activate: fonts, pictures and sounds of the previous version are carried over (they rarely change), then the old cache goes
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  const old=(await caches.keys()).filter(k=>k.startsWith('muslim-')&&k!==V);
  if(old.length){
    const cur=await caches.open(V);
    for(const k of old){
      try{
        const prev=await caches.open(k);
        for(const req of await prev.keys()){
          if(/\/(fonts|img|audio)\//.test(new URL(req.url).pathname)&&!(await cur.match(req))){ const res=await prev.match(req); if(res) await cur.put(req,res); }
        }
      }catch(err){}
      await caches.delete(k);
    }
  }
  await self.clients.claim();
})());});
// fetch: cached copy first, refreshed in the background. Partial requests (audio seeking) and downloaded recitations (/dl/) go straight to the network
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(u.pathname.includes('/dl/')||e.request.headers.has('range'))return;
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(e.request);
    const net=fetch(e.request).then(r=>{if(r.status===200&&r.type==='basic')c.put(e.request,r.clone()).catch(()=>{});return r;}).catch(()=>hit||Response.error());
    /* code and pages: the fresh copy wins (so an update shows up on the next launch); heavy files (audio, fonts, images, data) come from the cache first */
    if(/\.(?:js|css|html|webmanifest)$/.test(u.pathname)||u.pathname.endsWith('/'))return net.then(r=>r&&r.ok?r:(hit||r),()=>hit||Response.error());
    return hit||net;
  }));
});
