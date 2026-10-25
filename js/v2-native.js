/* ===== iPhone native shell (ios/Muslim/NativeShell.swift) =====
   On the iPhone the bottom bar and the prayer screen are drawn natively (SwiftUI), over this page's own background.
   This file is their data source: the theme's colours, the bar's items, the prayer screen's content and the app's own icons
   (rendered to images so they look exactly the same). Everything they do comes back here through M.native.act(), so the
   logic, the settings and the sheets stay the app's own. Inactive everywhere else (window.__nativeShell is set by the iPhone app). */
(function(){
'use strict';
const M = window.M, h = M.h, root = document.documentElement;
if(!window.__nativeShell || !window.Android || !Android.setNativeModel) return;
root.setAttribute('data-native', '');

/* ---------------- icons: the app's own icons as PNG data (black, the native side tints them) ---------------- */
const iconCache = {}, sent = new Set(), pending = {};
function iconKey(name){ return String(name || '').replace(/[^a-zA-Z0-9:_-]/g, ''); }
function rasterize(name){
  const k = iconKey(name);
  if(iconCache[k] || pending[k]) return;
  let html = '';
  try{ html = M.icon(name); }catch(e){ return; }
  const box = document.createElement('div'); box.innerHTML = html;
  const el = box.firstElementChild; if(!el) return;
  // pictures used as masks (some emblems are PNGs): the native side loads the same file from the bundle
  const mask = /url\((?:&quot;|")?([^)"&]+)(?:&quot;|")?\)/.exec(el.getAttribute('style') || '');
  if(el.classList.contains('imgic') && mask){ iconCache[k] = 'file:'+mask[1]; send(); return; }
  if(el.tagName.toLowerCase() !== 'svg') return;
  el.querySelectorAll('.du').forEach(n=>n.remove());              // the duotone layer is a style, not part of the outline
  el.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); el.setAttribute('width', '96'); el.setAttribute('height', '96');
  el.setAttribute('style', 'color:#000'); el.removeAttribute('class');
  const img = new Image(); pending[k] = true;
  img.onload = ()=>{ try{ const c = document.createElement('canvas'); c.width = c.height = 96; c.getContext('2d').drawImage(img, 0, 0, 96, 96); iconCache[k] = c.toDataURL('image/png'); }catch(e){} delete pending[k]; send(); };
  img.onerror = ()=>{ delete pending[k]; };
  img.src = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(el.outerHTML);
}
function icon(name){ rasterize(name); return iconKey(name); }

/* ---------------- colours: whatever CSS computes (color-mix, oklab…) read back as plain sRGB ---------------- */
const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', {willReadFrequently:true});
function rgb(css){
  try{ cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], +(d[3] / 255).toFixed(3)]; }catch(e){ return [0, 0, 0, 1]; }
}
const probe = h('div', {style:'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'});
function token(v){ probe.style.color = 'var('+v+')'; return rgb(getComputedStyle(probe).color); }
function mix(expr){ probe.style.color = expr; return rgb(getComputedStyle(probe).color); }
function theme(){
  if(!probe.isConnected) document.body.append(probe);
  const dark = root.dataset.theme !== 'light';
  return {dark, amoled:root.dataset.theme === 'amoled', skin:root.dataset.skin || 'glass', solid:root.hasAttribute('data-solid'), contrast:root.hasAttribute('data-contrast'),
    fs:+(getComputedStyle(root).getPropertyValue('--fs') || 1) || 1,
    p:token('--p'), onP:token('--on-p'), pc:token('--pc'), onPc:token('--on-pc'), s0:token('--s0'), s1:token('--s1'), onS:token('--on-s'), onSV:token('--on-sv'),
    gold:token('--gold'), outlineV:token('--outline-v'), ok:token('--ok'),
    // the accent card: the same two colours the CSS gradient uses
    heroA:mix(dark ? 'color-mix(in oklab, var(--p) 42%, #06161b)' : 'color-mix(in oklab, var(--p) 86%, #fff)'),
    heroB:mix(dark ? 'color-mix(in oklab, var(--p) 18%, #04090b)' : 'color-mix(in oklab, var(--p) 60%, #000)'),
    tabOn:dark ? mix('color-mix(in oklab, var(--p) 55%, #fff)') : token('--p')};
}

/* ---------------- the bottom bar ---------------- */
function nav(){
  const items = (M.navItems ? M.navItems() : ['home', 'quran', 'prayer', 'adhkar', 'more']).map(id=>M.navDescribe ? M.navDescribe(id) : {id, tab:true, label:M.screens[id].label, icon:M.screens[id].icon}).filter(Boolean);
  return items.map(d=>({id:d.id, label:d.label, tab:!!d.tab, icon:icon(d.icon)}));
}

/* ---------------- the prayer screen ---------------- */
const TIME_IC = {fajr:'p:fajr', sunrise:'p:sunrise', dhuhr:'p:dhuhr', asr:'p:asr', maghrib:'p:maghrib', isha:'p:isha'};
function hero(where){
  const c = M.cfg; if(!c.heroImg) return null;
  const on = c.heroImgOn || 'both'; if(on !== 'both' && on !== where) return null;
  const fit = c.heroFit === 'contain';
  let x = c.heroPX, y = c.heroPY;
  if(x == null){ x = 50; y = c.heroImgPos === 'top' ? 0 : c.heroImgPos === 'bottom' ? 100 : 50; }
  return {src:String(c.heroImg), fit, x:fit ? 50 : x, y:fit ? 50 : y, zoom:fit ? 1 : (c.heroZoom || 1), op:c.heroImgOp != null ? c.heroImgOp : .45};
}
function prayer(){
  const U = M.prayerUI; if(!U) return null;
  const day = U.ps.date, isToday = M.dkey(day) === M.dkey();
  const t = M.prayerTimes(day), info = M.nextPrayer(new Date()), hj = M.hijri ? M.hijri(day) : null;
  const hjText = hj ? M.n(hj.d)+' '+M.HMONTHS[hj.m - 1]+' '+M.n(hj.y)+' هـ' : '';
  const out = {loc:M.location().name, isToday, hero:hero('prayer'),
    dayTitle:M.WEEKDAYS[day.getDay()]+'، '+M.n(day.getDate())+' '+M.GMONTHS[day.getMonth()]+' '+M.n(day.getFullYear()), hijri:hjText,
    icons:M.cfg.prIcons !== false, grid:M.cfg.ppView === 'grid', simple:!!M.cfg.ppSimple,
    ic:{cal:icon('calendar'), set:icon('settings'), pin:icon('pin'), down:icon('chevDown'), back:icon('back'), fwd:icon('fwd'), bell:icon('bell'), qibla:icon('s:qibla')}};
  if(isToday){
    out.next = {name:info.next.k === 'sunrise' ? 'الشروق' : 'صلاة '+M.prayerLabel(info.next.k), time:M.fmt(info.next.t), at:+info.next.t, prev:+info.prev.t};
  } else out.summary = {title:M.WEEKDAYS[day.getDay()], sub:hjText};
  out.times = M.PRAYERS.map(([k, name, ic])=>{
    const lbl = k === 'dhuhr' && day.getDay() === 5 ? 'الجمعة' : name;
    const iq = M.cfg.iqamaOn !== false && (M.cfg.iqama || {})[k] ? new Date(+t[k] + M.cfg.iqama[k] * 60000) : null;
    return {k, label:lbl, icon:icon(ic), time:M.fmt(t[k]), iqama:iq ? 'الإقامة '+M.fmt(iq)+' (بعد '+M.n(M.cfg.iqama[k])+' د)' : '',
      next:isToday && info.next.k === k, now:isToday && !!info.prev && info.prev.k === k, bell:!!(M.cfg.notifyIn || {})[k], canBell:k !== 'sunrise' || true};
  });
  if(M.plogDay && M.cfg.plogCard !== false && M.dkey(day) <= M.dkey()){
    const d = M.plogDay(day);
    out.plog = {title:d.today ? 'صلوات اليوم' : 'سجل صلوات هذا اليوم', count:M.n(d.count)+'/'+M.n(5), dk:d.dk,
      items:d.items.map(x=>({k:x.k, label:x.label, st:x.st, sub:x.sub, future:x.future, icon:icon(x.ic)})), allIcon:icon('calendar')};
  }
  if(!out.simple || M.cfg.ppSun) out.extra = [['الضحى (تقريبًا)', M.fmt(t.duha)], ['منتصف الليل', M.fmt(t.midnight)], ['الثلث الأخير من الليل', M.fmt(t.lastThird)]];
  if(!out.simple && M.cfg.showForbid !== false){
    const ms = x=>new Date(+x);
    out.forbid = {rows:[['بعد الشروق (ترتفع الشمس)', M.fmt(t.sunrise)+' – '+M.fmt(ms(+t.sunrise + 15 * 60000))],
      ['عند الاستواء (قبيل الظهر)', M.fmt(ms(+t.dhuhr - 10 * 60000))+' – '+M.fmt(t.dhuhr)], ['قبيل الغروب', M.fmt(ms(+t.maghrib - 15 * 60000))+' – '+M.fmt(t.maghrib)]],
      note:'تقديرية؛ يُحتاط بنحو ١٥ دقيقة بعد الشروق وقبل الغروب و١٠ قبل الظهر.'};
  }
  if(!out.simple){ const q = Math.round(M.qiblaDeg()); out.qibla = {deg:q, sub:M.n(q)+'° من الشمال الحقيقي • '+M.n(Math.round(M.distKaaba()).toLocaleString('en'))+' كم إلى الكعبة'}; }
  const meth = (M.METHODS.find(m=>m[0] === M.cfg.method) || [, ''])[1];
  out.method = 'طريقة الحساب: '+meth+(M.cfg.method === 'auto' && M.methodKey ? ' ('+((M.METHODS.find(m=>m[0] === M.methodKey()) || [, ''])[1])+')' : '')+' • '+(M.cfg.madhhab === 'hanafi' ? 'العصر حنفي' : 'العصر شافعي/جمهور');
  return out;
}

/* ---------------- what is in front: a page, a sheet, a dialog or the welcome hides the native layer ---------------- */
function modal(){
  if(root.hasAttribute('data-views')) return true;
  const sr = document.getElementById('sheet-root'); if(sr && sr.children.length) return true;
  return !!document.querySelector('.pop-root, .ob, .dialog-root, .scrim, #lock-screen, .lockscr');
}
const NATIVE_TABS = ['prayer'];

/* ---------------- sending ---------------- */
let last = '', timer = 0;
function send(){
  clearTimeout(timer);
  timer = setTimeout(()=>{
    try{
      const tab = M.curTab || 'home', mdl = modal();
      const showNative = NATIVE_TABS.includes(tab) && !mdl;
      root.toggleAttribute('data-native-show', showNative);
      const model = {tab, modal:mdl, theme:theme(), nav:nav(), prayer:tab === 'prayer' ? prayer() : null};
      // icons go once each (the native side keeps them)
      const icons = {}; Object.keys(iconCache).forEach(k=>{ if(!sent.has(k)){ icons[k] = iconCache[k]; sent.add(k); } });
      model.icons = icons;
      const j = JSON.stringify(model);
      if(j === last && !Object.keys(icons).length) return;
      last = j; Android.setNativeModel(j);
    }catch(e){ console.error(e); }
  }, 40);
}

/* ---------------- what the native side asks for ---------------- */
M.native = {
  send,
  resend(){ sent.clear(); last = ''; send(); },
  act(name, arg){
    const U = M.prayerUI || {};
    try{
      switch(name){
        case 'tab': M.setTab(arg); break;
        case 'section': M.sectionOpen && M.sectionOpen(arg); break;
        case 'loc': M.locationSheet && M.locationSheet(); break;
        case 'sched': U.openSchedule && U.openSchedule(); break;
        case 'psettings': M.prayerSettings && M.prayerSettings(); break;
        case 'day': U.shift && U.shift(+arg || 0); break;
        case 'prayer': { const d = U.ps ? U.ps.date : new Date(), t = M.prayerTimes(d); const row = M.PRAYERS.find(p=>p[0] === arg); const lbl = arg === 'dhuhr' && d.getDay() === 5 ? 'الجمعة' : (row ? row[1] : arg); U.prayerSheet && U.prayerSheet(arg, lbl, t); break; }
        case 'bell': { const n = Object.assign({}, M.cfg.notifyIn); n[arg] = !n[arg]; M.save('notifyIn', n); if(n[arg] && window.Android && Android.requestNotifPerm) try{ Android.requestNotifPerm(); }catch(e){} M.haptic && M.haptic(8); break; }
        case 'plog': { const d = M.plogDay ? M.plogDay(U.ps ? U.ps.date : new Date()) : null; if(d && M.plogPick) M.plogPick(d.dk, arg, ()=>send()); break; }
        case 'plogAll': M.openTracker && M.openTracker({tab:'prayers'}); break;
        case 'forbid': M.openNawafil ? M.openNawafil('forbidden') : M.sectionOpen && M.sectionOpen('forbidden'); break;
        case 'qibla': M.openQibla && M.openQibla(); break;
        case 'hero': M.setTab('prayer'); break;
      }
    }catch(e){ console.error(e); }
    send();
  }
};

/* ---------------- when to send ---------------- */
const setTab0 = M.setTab;
M.setTab = function(){ const r = setTab0.apply(this, arguments); send(); return r; };
if(M.prayerUI && M.prayerUI.refresh){ const r0 = M.prayerUI.refresh; M.prayerUI.refresh = function(){ const r = r0.apply(this, arguments); send(); return r; }; }
M.on && M.on('settings', ()=>{ send(); setTimeout(send, 400); });
M.on && M.on('plog', send);
new MutationObserver(send).observe(root, {attributes:true, attributeFilter:['data-views', 'data-theme', 'data-skin', 'data-solid', 'data-contrast']});
const app = document.getElementById('app') || document.body;
new MutationObserver(send).observe(document.body, {childList:true});
new MutationObserver(send).observe(app, {childList:true});
const sr = document.getElementById('sheet-root'); if(sr) new MutationObserver(send).observe(sr, {childList:true});
setInterval(send, 30000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) send(); });
if(document.readyState === 'complete') send(); else addEventListener('load', ()=>setTimeout(send, 50));
setTimeout(send, 600);
})();
