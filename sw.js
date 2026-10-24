const V='muslim-3.0.0-1025-5';
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

// ---- notifications (web build). The push carries no data: it only wakes us at a reminder time; the reminder itself
// comes from the schedule the app saved in the 'msched-v1' cache (so the server never sees the text)
const SCHED='msched-v1';
async function sj(n,d){try{const c=await caches.open(SCHED);const r=await c.match(n);return r?await r.json():d;}catch(e){return d;}}
async function sjw(n,v){try{const c=await caches.open(SCHED);await c.put(n,new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json'}}));}catch(e){}}
self.addEventListener('push',e=>{e.waitUntil((async()=>{
  const now=Date.now(),items=await sj('sched.json',[]),shown=await sj('shown.json',{});
  let extra=null;try{extra=e.data?e.data.json():null;}catch(err){}
  let due=items.filter(x=>x.ts<=now+120e3&&x.ts>now-20*60e3&&!shown[x.id]);
  if(!due.length){ // nothing matched (old schedule): never stay silent, iOS requires a visible notification for each push
    const nx=items.filter(x=>Math.abs(x.ts-now)<20*60e3).sort((a,b)=>Math.abs(a.ts-now)-Math.abs(b.ts-now))[0];
    due=[nx||{id:'p'+now,title:(extra&&extra.title)||'المسلم',body:(extra&&extra.body)||'حان موعد تذكير — افتح التطبيق',open:''}];
  }
  for(const x of due.slice(-3)){
    await self.registration.showNotification(x.title,{body:x.body||'',tag:x.id,icon:'img/icon-192.png',badge:'img/icon-192.png',data:{open:x.open||''},lang:'ar',dir:'rtl'});
    shown[x.id]=now;
  }
  for(const k in shown)if(now-shown[k]>2*86400e3)delete shown[k];
  await sjw('shown.json',shown);
})());});
self.addEventListener('notificationclick',e=>{e.notification.close();const open=(e.notification.data&&e.notification.data.open)||'';e.waitUntil((async()=>{
  const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of all){try{await c.focus();if(open)c.postMessage({type:'open',open});return;}catch(err){}}
  await self.clients.openWindow(self.registration.scope+'index.html'+(open?'?open='+encodeURIComponent(open):''));
})());});
