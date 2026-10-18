/* ===== Web notifications (browser / iPhone home-screen app) =====
   The web build cannot schedule notifications by itself the way the Android app does:
   1) while the app is open, reminders are shown as real system notifications at their time (with their sound);
   2) for notifications while it is closed (iPhone: Safari kills timers in the background), a tiny free push server
      (Cloudflare Worker, see push-worker.js) wakes the service worker at each reminder time; the service worker then
      shows the matching reminder from the schedule this page saved in the cache. Nothing personal leaves the phone:
      the server only receives the times. */
(function(){
'use strict';
const M = window.M;
if(!M || (window.Android && window.Android.scheduleAdhan) || window.isIOSApp) return;   // native builds schedule natively

const SCHED = 'msched-v1';   // not 'muslim-…': the service worker deletes old 'muslim-' caches on update
const hasSW = 'serviceWorker' in navigator && location.protocol.startsWith('http');
const hasN = 'Notification' in window;
const hasPush = hasSW && 'PushManager' in window;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
const swReg = ()=>hasSW ? navigator.serviceWorker.ready : Promise.reject(new Error('no sw'));
const perm = ()=>hasN ? Notification.permission : 'unsupported';
const pushUrl = ()=>String(M.cfg.pushUrl || window.PUSH_URL || '').trim().replace(/\/+$/, '');

/* ---------- the schedule the service worker reads ---------- */
async function readJSON(name, dflt){ try{ const c = await caches.open(SCHED); const r = await c.match(name); return r ? await r.json() : dflt; }catch(e){ return dflt; } }
async function writeJSON(name, v){ try{ const c = await caches.open(SCHED); await c.put(name, new Response(JSON.stringify(v), {headers:{'Content-Type':'application/json'}})); }catch(e){} }
async function markShown(id){ const s = await readJSON('shown.json', {}); s[id] = Date.now(); const now = Date.now(); for(const k in s) if(now - s[k] > 2 * 86400e3) delete s[k]; await writeJSON('shown.json', s); }

function upcoming(days){
  try{ return M.buildReminders(days || 7).filter(x=>x && x.ts > Date.now() && x.title).sort((a, b)=>a.ts - b.ts).slice(0, 400); }catch(e){ return []; }
}
const slim = x=>({id:x.id, ts:x.ts, title:x.title, body:x.body || '', open:x.open || '', snd:x.snd || '', tone:!!x.tone, kind:x.kind || ''});

/* ---------- 1) while the app is open ---------- */
let timers = [];
async function show(x){
  const shown = await readJSON('shown.json', {}); if(shown[x.id]) return;
  await markShown(x.id);
  if(!document.hidden && x.snd && M.cfg.nfMaster !== false){ try{ M.playSound(x.snd); }catch(e){} }
  if(perm() === 'granted' && hasSW){
    try{ const r = await swReg(); await r.showNotification(x.title, {body:x.body, tag:x.id, icon:'img/icon-192.png', badge:'img/icon-192.png', data:{open:x.open || ''}, lang:'ar', dir:'rtl'}); return; }catch(e){}
  }
  if(!document.hidden) M.toast(x.title+(x.body ? ' — '+x.body.split('\n')[0] : ''), 5000);
}
function planLocal(items){
  timers.forEach(clearTimeout); timers = [];
  const now = Date.now();
  items.filter(x=>x.ts - now < 6 * 3600e3).forEach(x=>{ timers.push(setTimeout(()=>show(x), Math.max(0, x.ts - now))); });
}

/* ---------- 2) push server ---------- */
const b64u = s=>{ const p = '='.repeat((4 - s.length % 4) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c=>c.charCodeAt(0)); };
async function api(path, body){
  const u = pushUrl(); if(!u) throw new Error('no server');
  const r = await fetch(u + path, body ? {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)} : {});
  if(!r.ok) throw new Error('server '+r.status);
  return r.json();
}
async function currentSub(){ try{ const r = await swReg(); return await r.pushManager.getSubscription(); }catch(e){ return null; } }
async function subscribe(){
  if(!hasPush) throw new Error(isIOS && !standalone ? 'add-to-home' : 'no-push');
  if(perm() !== 'granted'){ const p = await Notification.requestPermission(); if(p !== 'granted') throw new Error('denied'); }
  const {key} = await api('/key');
  const r = await swReg();
  let s = await r.pushManager.getSubscription();
  if(s){ // re-subscribe if the server key changed
    const cur = s.options && s.options.applicationServerKey ? new Uint8Array(s.options.applicationServerKey) : null;
    const want = b64u(key);
    if(cur && (cur.length !== want.length || cur.some((v, i)=>v !== want[i]))){ try{ await s.unsubscribe(); }catch(e){} s = null; }
  }
  if(!s) s = await r.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64u(key)});
  return s;
}
let lastSent = '';
async function sendTimes(items, force){
  if(!pushUrl() || M.cfg.webPush !== true) return;
  const s = await currentSub(); if(!s) return;
  const times = items.map(x=>x.ts).slice(0, 300);
  const sig = times.join(',');
  if(!force && sig === lastSent && Date.now() - (M.store.get('pushSentAt', 0) || 0) < 12 * 3600e3) return;
  await api('/sub', {sub:s.toJSON(), times});
  lastSent = sig; M.store.set('pushSentAt', Date.now());
}

/* ---------- sync: whenever reminders change (same hook the Android app uses) ---------- */
let syncT = null;
async function syncWeb(force){
  const items = M.cfg.nfMaster === false ? [] : upcoming(7).map(slim);
  await writeJSON('sched.json', items);
  planLocal(items);
  try{ await sendTimes(items, force); }catch(e){}
}
const prevSync = M.syncNative;
M.syncNative = function(now){ try{ prevSync && prevSync(now); }catch(e){} clearTimeout(syncT); syncT = setTimeout(()=>syncWeb(false), now === true ? 0 : 400); };
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) syncWeb(false); });
setInterval(()=>{ if(!document.hidden) syncWeb(false); }, 30 * 60e3);
setTimeout(()=>syncWeb(false), 2500);

/* tapping a notification opens its screen */
if(hasSW){
  navigator.serviceWorker.addEventListener('message', e=>{ const d = e.data || {}; if(d.type === 'open' && d.open) setTimeout(()=>M.openDeep && M.openDeep(d.open), 50); });
}
try{ const q = new URLSearchParams(location.search).get('open'); if(q) setTimeout(()=>M.openDeep && M.openDeep(q), 1500); }catch(e){}

/* ---------- settings card (shown in the notifications screen) ---------- */
M.webShow = async function(x){   // a test from a reminder's sheet: a real system notification (asks for permission if needed)
  try{ if(hasN && perm() === 'default') await Notification.requestPermission(); }catch(e){}
  return show(Object.assign({}, x, {id:'test_'+Date.now()+'_'+(x.kind || '')}));
};
M.webNotifState = function(){ return {push:M.cfg.webPush === true && !!pushUrl(), perm:perm()}; };
M.webPushCard = function(redraw){
  const h = M.h;
  const st = h('div.small.muted.wp-st');
  const on = M.cfg.webPush === true && !!pushUrl();
  const url = h('input.field', {type:'url', dir:'ltr', placeholder:'https://….workers.dev', value:pushUrl(), autocomplete:'off', spellcheck:false});
  const setSt = (t, bad)=>{ st.textContent = t; st.classList.toggle('bad', !!bad); };
  const why = e=>({'add-to-home':'على آيفون: أضف التطبيق للشاشة الرئيسية من سفاري وافتحه من الأيقونة أولًا.', 'no-push':'هذا المتصفح لا يدعم إشعارات الخلفية.', 'denied':'رُفض إذن الإشعارات. فعّله من الإعدادات ← الإشعارات ← المسلم.', 'no server':'اكتب رابط خادم الإشعارات أولًا.'}[e.message] || ('تعذّر الاتصال بالخادم ('+e.message+'). تأكد من الرابط.'));
  async function enable(){
    const u = url.value.trim().replace(/\/+$/, '');
    if(!/^https:\/\/[^\s]+$/.test(u)){ setSt('اكتب رابط الخادم كاملًا يبدأ بـ https://', true); return; }
    M.save('pushUrl', u); setSt('جارٍ التفعيل…');
    try{ await subscribe(); M.save('webPush', true); await syncWeb(true); setSt('تم ✓ ستصلك الإشعارات والتطبيق مغلق.'); M.haptic && M.haptic(10); redraw && setTimeout(redraw, 600); }
    catch(e){ setSt(why(e), true); }
  }
  async function disable(){
    try{ const s = await currentSub(); if(s){ try{ await api('/unsub', {endpoint:s.endpoint}); }catch(e){} await s.unsubscribe(); } }catch(e){}
    M.save('webPush', false); setSt('أُوقفت إشعارات الخلفية.'); redraw && setTimeout(redraw, 300);
  }
  async function test(delaySec){
    try{
      if(perm() !== 'granted'){ const p = hasN ? await Notification.requestPermission() : 'denied'; if(p !== 'granted') throw new Error('denied'); }
      const x = {id:'test_'+Date.now(), ts:Date.now() + delaySec * 1000, title:'تجربة إشعار المسلم', body:delaySec ? 'وصلك هذا الإشعار من الخادم والتطبيق في الخلفية ✓' : 'الإشعارات تعمل ✓', open:'', snd:'', kind:'test'};
      const items = (await readJSON('sched.json', [])).filter(i=>!/^test_/.test(i.id)).concat(x).sort((a, b)=>a.ts - b.ts);
      await writeJSON('sched.json', items);
      if(!delaySec){ await show(x); setSt('أُرسل إشعار تجريبي الآن.'); return; }
      await sendTimes(items, true);
      setSt('سيصلك إشعار خلال دقيقة إلى دقيقتين — اقفل الشاشة أو اخرج من التطبيق الآن.');
    }catch(e){ setSt(why(e), true); }
  }
  const lines = [];
  if(isIOS && !standalone) lines.push(h('div.wp-warn', 'على آيفون لا تعمل الإشعارات إلا بعد إضافة التطبيق للشاشة الرئيسية (زر المشاركة ← إضافة إلى الشاشة الرئيسية) وفتحه من الأيقونة.'));
  const card = h('div.card.pad.col-flex.wp-card',
    h('div.row-flex', h('span.nf-ic', {html:M.icon(on ? 's:bell' : 'bell')}), h('div.grow', h('b', 'إشعارات والتطبيق مغلق'), h('div.small.muted', on ? 'مفعّلة عبر خادم الإشعارات' : 'نسخة الويب تحتاج خادمًا مجانيًا صغيرًا لتصلك الإشعارات في الخلفية'))),
    ...lines,
    h('div.small.muted', 'رابط خادم الإشعارات (Cloudflare Worker)'), url,
    h('div.row-flex.wp-btns',
      on ? h('button.btn.tonal', {onclick:disable}, 'إيقاف') : h('button.btn', {onclick:enable}, 'تفعيل'),
      h('button.btn.tonal', {onclick:()=>test(0)}, 'تجربة الآن'),
      on ? h('button.btn.tonal', {onclick:()=>test(45)}, 'تجربة والتطبيق مغلق') : null),
    st,
    h('div.tiny.muted', 'بدون الخادم: تصلك الإشعارات وصوتها والتطبيق مفتوح فقط. مع الخادم: تصلك مغلقًا بنغمة النظام (لا يسمح آيفون بصوت الأذان في إشعارات الويب). الخادم لا يستقبل إلا مواعيد التنبيهات.'));
  if(perm() === 'denied') setSt('إذن الإشعارات مرفوض. فعّله من إعدادات الهاتف ← الإشعارات ← المسلم.', true);
  return card;
};
})();
