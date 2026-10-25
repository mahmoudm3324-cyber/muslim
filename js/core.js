/* ===== core: helpers, store, settings, icons, UI primitives ===== */
(function(){
'use strict';
const M = window.M = window.M || {};
/* iOS home-screen mode: make the shell as tall as the real screen (the window can report a few points less, leaving a white band) */
(function(){ try{
  var sa = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  if(!sa || !/iPhone|iPad|iPod/.test(navigator.userAgent)) return;
  var de = document.documentElement; de.classList.add('ios-sa');
  var fit = function(){ var h = Math.max(window.innerHeight || 0, screen.height || 0, (window.visualViewport && visualViewport.height) || 0); if(window.innerWidth > window.innerHeight) h = window.innerHeight; de.style.setProperty('--app-h', h + 'px'); };
  fit(); addEventListener('resize', fit); addEventListener('scroll', function(){ if(window.scrollY || window.scrollX) window.scrollTo(0, 0); }, {passive:true}); addEventListener('orientationchange', function(){ setTimeout(fit, 250); }); addEventListener('pageshow', fit);
}catch(e){} })();
/* iPhone app: the document itself never scrolls (the screens do); undo any shift iOS leaves after the keyboard */
(function(){ try{
  if(!window.isIOSApp) return;
  var back = function(){ if(window.scrollY || window.scrollX) window.scrollTo(0, 0); };
  addEventListener('scroll', back, {passive:true});
  if(window.visualViewport) visualViewport.addEventListener('resize', function(){ setTimeout(back, 60); });
  document.addEventListener('focusout', function(){ setTimeout(back, 120); });
}catch(e){} })();
M.VERSION = '3.1.0';
M.$ = (s,r)=>(r||document).querySelector(s);
M.$$ = (s,r)=>Array.from((r||document).querySelectorAll(s));

/* ---------- tiny DOM builder ---------- */
M.h = function(sel, props, ...kids){
  const parts = String(sel).split(/(?=[.#])/);
  let tag = 'div';
  if(parts.length && !/^[.#]/.test(parts[0])) tag = parts.shift();
  const el = document.createElement(tag);
  for(const p of parts){ if(p[0]==='.') el.classList.add(p.slice(1)); else if(p[0]==='#') el.id = p.slice(1); }
  if(props != null && (typeof props !== 'object' || props.nodeType || Array.isArray(props))){ kids.unshift(props); props = null; }
  if(props){
    for(const k in props){
      const v = props[k];
      if(v == null || v === false) continue;
      if(k === 'class'){ String(v).split(/\s+/).filter(Boolean).forEach(c=>el.classList.add(c)); }
      else if(k === 'style'){ if(typeof v === 'string') el.style.cssText += v; else Object.assign(el.style, v); }
      else if(k === 'html'){ el.innerHTML = v; }
      else if(k === 'dataset'){ Object.assign(el.dataset, v); }
      else if(k.startsWith('on') && typeof v === 'function'){ el.addEventListener(k.slice(2).toLowerCase(), v); }
      else if(k === 'value' || k === 'checked' || k === 'disabled'){ el[k] = v; }
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  (function add(list){
    for(const c of list){
      if(c == null || c === false) continue;
      if(Array.isArray(c)) add(c);
      else if(c.nodeType) el.appendChild(c);
      else el.appendChild(document.createTextNode(M.dg(String(c))));
    }
  })(kids);
  return el;
};
/* One digits setting for the whole app: every text node passes through here.
   A leading zero-width space (\u200B) marks a string that must be shown as written. */
const HI = '٠١٢٣٤٥٦٧٨٩';
M.dg = function(s){
  if(s.length < 1 || s.charCodeAt(0) === 0x200B) return s;
  const hindi = !M.cfg || M.cfg.digits !== 'latin';
  if(hindi) return /[0-9]/.test(s) && !/[A-Za-z]/.test(s) ? s.replace(/[0-9]/g, d=>HI[d]) : s;
  return /[٠-٩٫٬]/.test(s) ? s.replace(/[٠-٩]/g, d=>HI.indexOf(d)).replace(/٫/g, '.').replace(/٬/g, ',') : s;
};
const h = M.h;

/* ---------- storage ---------- */
const mem = {};
M.store = {
  get(k, d){ try{ const v = localStorage.getItem('ms:'+k); return v == null ? (k in mem ? mem[k] : d) : JSON.parse(v); }catch(e){ return k in mem ? mem[k] : d; } },
  set(k, v){
    mem[k] = v;
    let txt; try{ txt = JSON.stringify(v); }catch(e){ return false; }
    try{ localStorage.setItem('ms:'+k, txt); return true; }catch(e){}
    // storage full: make room from what can be rebuilt (older automatic copies first, then caches), then try once more
    if(k !== 'snapshots') try{
      const sn = JSON.parse(localStorage.getItem('ms:snapshots') || '[]');
      while(Array.isArray(sn) && sn.length > 1){ sn.pop(); try{ localStorage.setItem('ms:snapshots', JSON.stringify(sn)); }catch(x){} try{ localStorage.setItem('ms:'+k, txt); return true; }catch(x){} }
    }catch(e){}
    if(txt.length > 1500000) return false;     // one oversized value is not worth losing the backups for
    ['rbList', 'mqRadios', 'radioOk', 'wtaf', 'snapshots'].forEach(c=>{ if(c !== k) try{ localStorage.removeItem('ms:'+c); }catch(e){} });
    try{ localStorage.setItem('ms:'+k, txt); return true; }catch(e){ return false; }
  },
  del(k){ delete mem[k]; try{ localStorage.removeItem('ms:'+k); }catch(e){} },
  keys(){ try{ return Object.keys(localStorage).filter(k=>k.startsWith('ms:')).map(k=>k.slice(3)); }catch(e){ return Object.keys(mem); } }
};

/* ---------- platform: which shell runs the page, and what it can do ----------
   android = the Android app (window.Android from MainActivity), ios = the iPhone app (window.isIOSApp, a smaller bridge), web = a browser.
   Screens ask M.can(feature) and simply leave out what this platform cannot do, instead of showing switches that do nothing. */
M.platform = window.isIOSApp ? 'ios' : (window.Android && typeof window.Android.scheduleAdhan === 'function') ? 'android' : 'web';
M.CAPS = {
  android:['widgets', 'appIcon', 'liveNotif', 'alarmRing', 'focusMode', 'keyStop', 'flipStop', 'volKeys', 'appLock', 'battery', 'exactAlarm', 'nativeHealth', 'quickTiles',
           'nativeVideo', 'notifAction', 'downloads', 'bgAudio', 'longAdhan', 'speech', 'micTone', 'popupUnlock'],
  ios:['downloads', 'bgAudio', 'notifAction', 'speech', 'appIcon', 'appLock', 'siri'].concat(window.__iosCaps || []),   // + liveNotif, and alarmRing on iOS 26 (from the app)
  web:['speech']
};
M.can = f=>(M.CAPS[M.platform] || []).includes(f);
try{ document.documentElement.dataset.platform = M.platform; }catch(e){}

/* ---------- events ---------- */
const subs = {};
M.on = (ev, fn)=>{ (subs[ev] = subs[ev] || []).push(fn); return ()=>{ subs[ev] = subs[ev].filter(f=>f!==fn); }; };
M.emit = (ev, ...a)=>{ (subs[ev] || []).slice().forEach(f=>{ try{ f(...a); }catch(e){ console.error(e); } }); };

/* ---------- settings ---------- */
M.defaults = {
  h24:false, iqama:{fajr:20,dhuhr:15,asr:15,maghrib:8,isha:15}, iqamaOn:true,
  skin:'auto', theme:'auto', accent:'#0f8a6d',
  bg:'aurora', bgImage:null, bgDim:0.25, bgBlur:0, bgScope:'home',
  anim:true, digits:'hindi', fontScale:1, haptics:true, sound:true,
  readMode:'pages', qSize:1, qTheme:'auto', userName:'', translation:'off', translit:false, tafsir:'ar-tafsir-muyassar',
  reciter:'Alafasy_128kbps', repeat:1, speed:1, autoNext:true, pageAudioFollow:true,
  method:'auto', madhhab:'shafi', adjust:{fajr:0,sunrise:0,dhuhr:0,asr:0,maghrib:0,isha:0},
  loc:null, notifyIn:{fajr:false,dhuhr:false,asr:false,maghrib:false,isha:false,sunrise:false}, adhanTone:true, liveNotif:false,
  hijriAdj:0, hijriType:'umalqura', tabs:['home','quran','prayer','adhkar','more'],
  homeBlocks:{prayer:true,ayah:true,progress:true,quick:true,dhikr:true}
};
M.cfg = Object.assign({}, M.defaults, M.store.get('settings', {}) || {});
M.save = function(key, val){
  if(typeof key === 'object'){ Object.assign(M.cfg, key); } else M.cfg[key] = val;
  if(M.store.set('settings', M.cfg) === false && !M._quotaWarned){ M._quotaWarned = true; setTimeout(()=>M.toast && M.toast('تعذّر حفظ الإعدادات — مساحة التخزين ممتلئة'), 0); }
  M.emit('settings', key);
};

/* ---------- numerals / dates ---------- */
const HINDI = '٠١٢٣٤٥٦٧٨٩';
M.n = function(x){
  const s = String(x);
  return M.cfg.digits === 'hindi' ? s.replace(/[0-9]/g, d=>HINDI[d]) : s;
};
/* a counted noun in correct Arabic: M.cnt(3,'يوم') → «٣ أيام», M.cnt(11,'يوم') → «١١ يومًا», M.cnt(2,'يوم',true) → «يومين» (after a preposition).
   forms: [singular, dual (nominative), dual (genitive), plural 3–10, singular accusative 11–99] */
const CNT = {
  'يوم':['يوم','يومان','يومين','أيام','يومًا'], 'صفحة':['صفحة','صفحتان','صفحتين','صفحات','صفحة'], 'دقيقة':['دقيقة','دقيقتان','دقيقتين','دقائق','دقيقة'],
  'سؤال':['سؤال','سؤالان','سؤالين','أسئلة','سؤالًا'], 'آية':['آية','آيتان','آيتين','آيات','آية'], 'سورة':['سورة','سورتان','سورتين','سور','سورة'],
  'حديث':['حديث','حديثان','حديثين','أحاديث','حديثًا'], 'باب':['باب','بابان','بابين','أبواب','بابًا'], 'مرة':['مرة','مرتان','مرتين','مرات','مرة'],
  'درجة':['درجة','درجتان','درجتين','درجات','درجة'], 'ملف':['ملف','ملفان','ملفين','ملفات','ملفًا'], 'جولة':['جولة','جولتان','جولتين','جولات','جولة'],
  'اسم':['اسم','اسمان','اسمين','أسماء','اسمًا'], 'ساعة':['ساعة','ساعتان','ساعتين','ساعات','ساعة'], 'أسبوع':['أسبوع','أسبوعان','أسبوعين','أسابيع','أسبوعًا'],
  'دعاء':['دعاء','دعاءان','دعاءين','أدعية','دعاءً'], 'ذكر':['ذكر','ذكران','ذكرين','أذكار','ذكرًا'], 'قسم':['قسم','قسمان','قسمين','أقسام','قسمًا'],
  'ركعة':['ركعة','ركعتان','ركعتين','ركعات','ركعة'], 'عنصر':['عنصر','عنصران','عنصرين','عناصر','عنصرًا'], 'قصة':['قصة','قصتان','قصتين','قصص','قصة'],
  'إشعار':['إشعار','إشعاران','إشعارين','إشعارات','إشعارًا'], 'ثانية':['ثانية','ثانيتان','ثانيتين','ثوانٍ','ثانية'], 'تلاوة':['تلاوة','تلاوتان','تلاوتين','تلاوات','تلاوة'],
  'صوت':['صوت','صوتان','صوتين','أصوات','صوتًا'], 'إذاعة':['إذاعة','إذاعتان','إذاعتين','إذاعات','إذاعة'], 'كتاب':['كتاب','كتابان','كتابين','كتب','كتابًا'],
  'كلمة':['كلمة','كلمتان','كلمتين','كلمات','كلمة'], 'مهمة':['مهمة','مهمتان','مهمتين','مهام','مهمة'], 'تلميح':['تلميح','تلميحان','تلميحين','تلميحات','تلميحًا']
};
M.cnt = function(n, w, gen, legacy){
  const f = CNT[w] || [w, w, w, w, w], a = Math.abs(n), r = a % 100;
  if(M.lang && M.lang !== 'ar') return M.n(n)+' '+(legacy || f[0]);   // another language: the phrase its dictionary already knows ("{0} …")
  if(a === 1) return f[0];
  if(a === 2) return gen ? f[2] : f[1];
  return M.n(n)+' '+(r >= 3 && r <= 10 ? f[3] : r >= 11 ? f[4] : f[0]);
};
M.pad = n=>String(n).padStart(2,'0');
M.dkey = function(d){ d = d || new Date(); return d.getFullYear()+'-'+M.pad(d.getMonth()+1)+'-'+M.pad(d.getDate()); };
M.parseKey = k=>{ const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); };
M.addDays = (d,n)=>{ const x = new Date(d); x.setDate(x.getDate()+n); return x; };
M.WEEKDAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
M.GMONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
M.HMONTHS = ['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
M.fmtTime = function(d, tz){
  try{
    const s = new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:tz||undefined}).format(d);
    let [hh,mm] = s.split(':').map(Number); const pm = hh>=12; hh = hh%12 || 12;
    if(M.cfg.h24) return M.n(M.pad(s.split(':')[0])+':'+M.pad(mm));
    if(M.cfg.timeStyle === 'plain') return M.n(M.pad(hh)+':'+M.pad(mm));
    return M.n(hh+':'+M.pad(mm))+' '+(pm?'م':'ص');
  }catch(e){ return M.n(M.pad(d.getHours())+':'+M.pad(d.getMinutes())); }
};
M.fmtDur = function(ms){
  ms = Math.max(0, ms); const s = Math.floor(ms/1000);
  return M.pad(Math.floor(s/3600))+':'+M.pad(Math.floor(s%3600/60))+':'+M.pad(s%60);
};
M.escape = s=>String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- icons ---------- */
const P = {
home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.2V20h13v-9.8"/><path d="M10 20v-5.5h4V20"/>',
quran:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="m12 6.5 1.1 2.2 2.4.4-1.8 1.7.4 2.4-2.1-1.1-2.1 1.1.4-2.4-1.8-1.7 2.4-.4z"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
beads:'<circle cx="12" cy="4.5" r="2"/><circle cx="18.5" cy="8.2" r="2"/><circle cx="18.5" cy="15.8" r="2"/><circle cx="12" cy="19.5" r="2"/><circle cx="5.5" cy="15.8" r="2"/><circle cx="5.5" cy="8.2" r="2"/>',
grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
bookmark:'<path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4.3L5.5 21V4.5a1 1 0 0 1 1-1z"/>',
coin:'<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.7.8-2.7 2 0 2.8 5.6 1.4 5.6 4.200 0 1.200-1.200 2-2.900 2-1.300 0-2.400-.6-2.900-1.600M12 6.500v1.300M12 16.200v1.300"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.6-4.6"/>',
play:'<path d="M8 5.2v13.6a1 1 0 0 0 1.5.9l11-6.8a1 1 0 0 0 0-1.8l-11-6.8A1 1 0 0 0 8 5.2z"/>',
pause:'<rect x="6" y="4.5" width="4.2" height="15" rx="1.4"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.4"/>',
stop:'<rect x="5.5" y="5.5" width="13" height="13" rx="2.2"/>',
next:'<path d="M5 5.6v12.8a.8.8 0 0 0 1.2.7l9.600-6.400a.8.8 0 0 0 0-1.400L6.200 4.900A.8.8 0 0 0 5 5.600z"/><rect x="17.5" y="5" width="2.2" height="14" rx="1"/>',
prev:'<path d="M19 5.6v12.8a.8.8 0 0 1-1.200.7l-9.600-6.400a.8.8 0 0 1 0-1.400l9.600-6.400A.8.8 0 0 1 19 5.600z"/><rect x="4.300" y="5" width="2.200" height="14" rx="1"/>',
settings:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
back:'<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
fwd:'<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
check:'<path d="m5 12.5 4.5 4.5L19 7.500"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
minus:'<path d="M5 12h14"/>',
shrink:'<path d="M14 10l6.5-6.5M10 14l-6.5 6.5M14 4.5V10h5.5M10 19.5V14H4.5"/>',
enlarge:'<path d="M14.5 9.5 20 4M9.5 14.5 4 20M14 4h6v6M10 20H4v-6"/>',
close:'<path d="M6 6l12 12M18 6 6 18"/>',
compass:'<circle cx="12" cy="12" r="9"/><path d="m15.800 8.200-2 5.600-5.600 2 2-5.600z"/>',
calendar:'<rect x="3.5" y="5" width="17" height="15.500" rx="3"/><path d="M8 3v4M16 3v4M3.500 10h17"/>',
star:'<path d="m12 3 2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100-4.400-4.300 6.100-.9z"/>',
moon:'<path d="M20 14.500A8.500 8.500 0 1 1 9.500 4a7 7 0 0 0 10.500 10.500z"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.500V5M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800"/>',
sunrise:'<path d="M3 18.500h18M7 18.500a5 5 0 0 1 10 0M12 5v4M5.600 9.600l1.500 1.500M18.400 9.600l-1.500 1.500M2.500 14h2M19.500 14h2"/>',
share:'<circle cx="18" cy="5.500" r="2.500"/><circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="18.500" r="2.500"/><path d="m8.200 10.800 7.600-4M8.200 13.200l7.600 4"/>',
copy:'<rect x="8.500" y="8.500" width="12" height="12" rx="2.500"/><path d="M15.500 8.500V6A2.500 2.500 0 0 0 13 3.500H6A2.500 2.500 0 0 0 3.500 6v7A2.500 2.500 0 0 0 6 15.500h2.500"/>',
note:'<path d="M4 20h4L19.200 8.800a2.800 2.800 0 0 0-4-4L4 16z"/><path d="m13.500 6.500 4 4"/>',
highlight:'<path d="m4.500 19.500 1-4 9.500-9.500 3 3-9.500 9.500z"/><path d="m13 8 3 3M13.500 20.500h7"/>',
tafsir:'<path d="M12 6.500C10.500 5 8 4.500 3.500 4.500v13c4.500 0 7 .5 8.500 2 1.500-1.500 4-2 8.500-2v-13c-4.500 0-7 .5-8.500 2z"/><path d="M12 6.500v13"/>',
repeat:'<path d="m17 2 3.500 3.500L17 9"/><path d="M4 11V9.500a4 4 0 0 1 4-4h12.500"/><path d="m7 22-3.500-3.500L7 15"/><path d="M20 13v1.500a4 4 0 0 1-4 4H3.500"/>',
trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.500H4.500V7A3.500 3.500 0 0 0 8 10.500M16 5.500h3.500V7a3.500 3.500 0 0 1-3.500 3.500"/><path d="M12 13v4M8.500 20.500h7M9.500 17h5"/>',
heart:'<path d="M12 20.500s-8-4.800-8-11A4.600 4.600 0 0 1 8.500 5C10 5 11.300 5.800 12 7c.7-1.200 2-2 3.500-2A4.600 4.600 0 0 1 20 9.500c0 6.200-8 11-8 11z"/>',
pin:'<path d="M12 21s-6.500-5.600-6.500-11a6.500 6.500 0 0 1 13 0c0 5.400-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.400"/>',
bell:'<path d="M6 16.500V11a6 6 0 0 1 12 0v5.500l1.500 2h-15z"/><path d="M10 21a2.200 2.200 0 0 0 4 0"/>',
image:'<rect x="3.500" y="4.500" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.600"/><path d="m4 17 5-4.500 4 3.500 3-2.500 4 3.500"/>',
palette:'<path d="M12 3.500a8.500 8.500 0 1 0 0 17c1.300 0 2-1 1.600-2.100-.4-1.100.4-2.200 1.600-2.200H17a3.500 3.500 0 0 0 3.500-3.500C20.500 7.500 16.700 3.500 12 3.500z"/><circle cx="7.500" cy="11" r="1"/><circle cx="10" cy="7.500" r="1"/><circle cx="14.500" cy="7.500" r="1"/>',
type:'<path d="M3.500 19 8 6l4.500 13M5 14.500h6"/><path d="m14.500 19 3-8 3 8M15.500 16.500h4"/>',
volume:'<path d="M4 9.500v5h3.500l5 4v-13l-5 4z"/><path d="M16 9a4 4 0 0 1 0 6M18.500 6.500a7.500 7.500 0 0 1 0 11"/>',
mute:'<path d="M4 9.500v5h3.500l5 4v-13l-5 4z"/><path d="M16.500 9.500l5 5M21.500 9.500l-5 5"/>',
download:'<path d="M12 4v11"/><path d="m7.500 11 4.500 4.500 4.500-4.500"/><path d="M4.500 19.500h15"/>',
trash:'<path d="M4.500 7h15M9.500 7V4.500h5V7M6.500 7l.8 12.500h9.400L17.500 7M10 11v5M14 11v5"/>',
refresh:'<path d="M20 11a8 8 0 0 0-14-4.500L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14 4.500L20 15"/><path d="M20 20v-5h-5"/>',
flame:'<path d="M12 21a6.500 6.500 0 0 0 6.500-6.500c0-3-2-5-3.200-6.600-.6 1.400-1.300 2-2.300 2.400C13.400 7 12.600 4.500 10.500 3c.2 3-1.400 4.400-3 6.200-1.300 1.400-2 3.300-2 5.300A6.500 6.500 0 0 0 12 21z"/>',
target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.200"/>',
list:'<path d="M8.500 6.500h12M8.500 12h12M8.500 17.500h12"/><circle cx="4.500" cy="6.500" r=".8"/><circle cx="4.500" cy="12" r=".8"/><circle cx="4.500" cy="17.500" r=".8"/>',
pages:'<rect x="4" y="4" width="16" height="16" rx="2.500"/><path d="M12 4v16"/>',
scroll:'<rect x="6" y="3.500" width="12" height="17" rx="2.500"/><path d="M9.500 8h5M9.500 12h5M9.500 16h3"/>',
radio:'<rect x="3.500" y="8.500" width="17" height="11.500" rx="2.500"/><path d="m7 8.500 10-5"/><circle cx="9" cy="14" r="2.200"/><path d="M14.500 12.500H18M14.500 15.500H18"/>',
tv:'<rect x="3" y="5.500" width="18" height="12.500" rx="2.500"/><path d="M8.500 21h7M12 18v3"/>',
kids:'<circle cx="12" cy="12" r="9"/><path d="M8.500 14a4 4 0 0 0 7 0M9 9.500h.01M15 9.500h.01"/>',
kaaba:'<path d="M4.500 8.500 12 5l7.500 3.500v10.500L12 22.500 4.500 19z"/><path d="M4.500 8.500 12 12l7.500-3.500M12 12v10.500"/>',
mosque:'<path d="M12 3c-.8 1.400-2.500 2-2.500 4a2.500 2.500 0 0 0 5 0C14.500 5 12.800 4.400 12 3z"/><path d="M5 21v-7a7 7 0 0 1 14 0v7"/><path d="M3 21h18M10 21v-3.500a2 2 0 0 1 4 0V21"/>',
shield:'<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6z"/>',
  alarm:'<circle cx="12" cy="13" r="7"/><path d="M12 9v4l2 2M5 4 2 7M19 4l3 3"/>',
  text:'<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
  hash:'<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>',
  chevDown:'<path d="m5.5 9 6.5 6.5L18.5 9"/>',
chevUp:'<path d="m5.5 15 6.5-6.5 6.5 6.5"/>',
eye:'<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="2.800"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.800 2.800 2.800 15.200 0 18M12 3c-2.800 2.800-2.800 15.200 0 18"/>',
mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3"/>',
camera:'<path d="M4 8.500h3l1.500-2.500h7L17 8.500h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.500a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.500" r="3.500"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.500M12 7.800v.01"/>',
history:'<path d="M3.500 12a8.500 8.500 0 1 0 2.500-6"/><path d="M3.500 4.500V9H8M12 8v4.500l3 2"/>',
layers:'<path d="m12 3.500 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
arrowUp:'<path d="M12 19V5M6 11l6-6 6 6"/>',
arrowDown:'<path d="M12 5v14M6 13l6 6 6-6"/>',
sparkle:'<path d="M12 3.500c.8 4.200 2.300 5.700 6.500 6.500-4.200.8-5.700 2.300-6.500 6.500-.8-4.200-2.300-5.700-6.500-6.500 4.200-.8 5.700-2.300 6.500-6.500zM18.500 16.500c.3 1.500.9 2.100 2.500 2.500-1.600.4-2.200 1-2.500 2.500-.3-1.500-.9-2.100-2.500-2.500 1.600-.4 2.200-1 2.500-2.500z"/>',
lock:'<rect x="5" y="10.500" width="14" height="10" rx="2.500"/><path d="M8 10.500V8a4 4 0 0 1 8 0v2.500"/>',
dot:'<circle cx="12" cy="12" r="3"/>',
more:'<circle cx="5.500" cy="12" r="1.600"/><circle cx="12" cy="12" r="1.600"/><circle cx="18.500" cy="12" r="1.600"/>',
undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.500a5.500 5.500 0 0 1 0 11H11"/>',
fullscreen:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'
};
const FILL = {play:1,pause:1,stop:1,next:1,prev:1};
const CHEV = {back:1, fwd:1, chevUp:1, chevDown:1, arrowUp:1, arrowDown:1};
M.icon = function(name, cls){
  const f = FILL[name] ? ' fill' : CHEV[name] ? ' chev' : '';
  return '<svg class="ic'+f+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(P[name]||P.dot)+'</svg>';
};
M.ic = function(name, cls){ const w = document.createElement('span'); w.style.display = 'contents'; w.innerHTML = M.icon(name, cls); return w.firstChild; };

/* ---------- haptics & sound ---------- */
M.haptic = function(ms){
  if(!M.cfg.haptics) return;
  try{
    if(window.Android && window.Android.vibrate) window.Android.vibrate(ms || 12);
    else if(navigator.vibrate) navigator.vibrate(Math.max(20, ms || 12));
  }catch(e){}
};
let actx;
M.beep = function(freq, dur, vol){
  if(!M.cfg.sound) return;
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if(actx.state === 'suspended') actx.resume();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = freq || 880;
    g.gain.value = 0.0001; o.connect(g); g.connect(actx.destination);
    const t = actx.currentTime;
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.12));
    o.start(t); o.stop(t + (dur || 0.12) + 0.02);
  }catch(e){}
};

/* ---------- ripple ---------- */
document.addEventListener('pointerdown', e=>{
  const t = e.target.closest && e.target.closest('.btn,.icon-btn,.chip,.item,.tab,.tile');
  if(!t || t.classList.contains('no-rp')) return;
  const r = t.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
  const rp = document.createElement('span'); rp.className = 'rp';
  rp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s/2}px;top:${e.clientY - r.top - s/2}px`;
  if(getComputedStyle(t).position === 'static') t.style.position = 'relative';
  const ov = getComputedStyle(t).overflow; if(ov === 'visible') t.style.overflow = 'hidden';
  t.appendChild(rp); setTimeout(()=>rp.remove(), 650);
}, {passive:true});

/* ---------- toast ---------- */
M.toast = function(msg, ms){
  const root = M.$('#toast-root'); if(!root) return;
  const t = h('div.toast', msg); root.appendChild(t);
  setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(), 320); }, ms || 2200);
};

/* ---------- sheet / dialog ---------- */
M.sheet = function(opts){
  const root = M.$('#sheet-root');
  const scrim = h('div.scrim');
  const body = h('div.sheet-b');
  const sheet = h('div.sheet', h('div.grab'),
    opts.title ? h('div.sheet-h', opts.title, h('span.grow')) : null, body);
  if(opts.content) body.appendChild(opts.content);
  root.append(scrim, sheet);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ scrim.classList.add('in'); sheet.classList.add('in'); }));
  let closed = false;
  const api = {el:sheet, body, close(){
    if(closed) return; closed = true;
    scrim.classList.remove('in'); sheet.classList.remove('in');
    setTimeout(()=>{ scrim.remove(); sheet.remove(); }, 400);
    M.sheetStack = M.sheetStack.filter(s=>s!==api);
    if(opts.onClose) opts.onClose();
  }};
  scrim.addEventListener('click', ()=>api.close());
  // drag to dismiss
  let sy = null, dy = 0;
  const grab = sheet.querySelector('.grab');
  const hd = sheet.querySelector('.sheet-h');
  [grab, hd].forEach(el=>{ if(!el) return;
    el.addEventListener('touchstart', e=>{ sy = e.touches[0].clientY; dy = 0; sheet.style.transition = 'none'; }, {passive:true});
    el.addEventListener('touchmove', e=>{ if(sy==null) return; dy = Math.max(0, e.touches[0].clientY - sy); sheet.style.transform = `translateY(${dy}px)`; }, {passive:true});
    el.addEventListener('touchend', ()=>{ sheet.style.transition = ''; sheet.style.transform = ''; if(dy > 90) api.close(); sy = null; });
  });
  M.sheetStack.push(api);
  return api;
};
M.sheetStack = [];
M.dialog = function(opts){
  return new Promise(res=>{
    const root = M.$('#sheet-root');
    const scrim = h('div.scrim');
    const acts = h('div.acts');
    const box = h('div.box', opts.title ? h('h3', opts.title) : null, opts.body ? (typeof opts.body === 'string' ? h('div.muted', opts.body) : opts.body) : null, acts);
    const dlg = h('div.dialog', box);
    root.append(scrim, dlg);
    requestAnimationFrame(()=>{ scrim.classList.add('in'); dlg.classList.add('in'); });
    const close = v=>{ scrim.classList.remove('in'); dlg.classList.remove('in'); setTimeout(()=>{ scrim.remove(); dlg.remove(); }, 350); res(v); };
    (opts.actions || [{label:'حسنًا', value:true, cls:''}]).forEach(a=>{
      acts.appendChild(h('button.btn.sm'+(a.cls ? '.'+a.cls : '.tonal'), {onclick:()=>close(typeof a.value === 'function' ? a.value() : a.value)}, a.label));
    });
    dlg.addEventListener('click', e=>{ if(e.target === dlg) close(null); });
  });
};
M.confirm = (msg, yes, title)=>M.dialog({title:title || 'تأكيد', body:msg, actions:[{label:'إلغاء', value:false, cls:'ghost'},{label:yes || 'نعم', value:true, cls:''}]});
M.prompt = function(title, value, placeholder, multiline){
  const inp = multiline ? h('textarea.field', {value:value || '', placeholder:placeholder || ''}) : h('input.field', {value:value || '', placeholder:placeholder || ''});
  return M.dialog({title, body:inp, actions:[{label:'إلغاء', value:null, cls:'ghost'},{label:'حفظ', value:()=>inp.value, cls:''}]});
};

/* ---------- widgets ---------- */
M.switchEl = function(val, onChange){
  const el = h('button.switch'+(val ? '.on' : ''), {role:'switch', 'aria-checked':String(!!val)});
  el.addEventListener('click', ()=>{ const v = !el.classList.contains('on'); el.classList.toggle('on', v); el.setAttribute('aria-checked', String(v)); M.haptic(8); onChange(v); });
  return el;
};
/* reorder control used by every editable list: one quiet pill with "up" over "down" */
M.reorder = function(i, len, mv){
  const b = (d, ic, lb)=>h('button.rord-b', {'aria-label':lb, disabled:d < 0 ? i === 0 : i === len - 1, onclick:e=>{ e.stopPropagation(); M.haptic(6); mv(d); }}, M.ic(ic));
  return h('div.rord', b(-1, 'chevUp', 'تحريك لأعلى'), h('i.rord-sep'), b(1, 'chevDown', 'تحريك لأسفل'));
};
M.removeBtn = function(fn, label){ return h('button.rord-x', {'aria-label':label || 'إزالة', onclick:e=>{ e.stopPropagation(); fn(); }}, M.ic('trash')); };
M.seg = function(options, value, onChange){
  const wrap = h('div.seg');
  options.forEach(([v, label])=>{
    const b = h('button'+(v === value ? '.on' : ''), {onclick:()=>{ M.$$('button', wrap).forEach(x=>x.classList.remove('on')); b.classList.add('on'); M.haptic(6); onChange(v); }}, label);
    wrap.appendChild(b);
  });
  // a word that cannot fit even when the tabs share the width: scroll instead, keeping the chosen tab in view
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ if(!wrap.isConnected) return;
    if([...wrap.children].some(b=>b.scrollWidth > b.clientWidth + 1)){ wrap.classList.add('seg-scroll'); const on = wrap.querySelector('.on'); if(on) wrap.scrollLeft = on.offsetLeft - (wrap.clientWidth - on.offsetWidth) / 2; } }));
  return wrap;
};
M.chips = function(options, value, onChange, multi){
  const wrap = h('div.chips');
  options.forEach(([v, label])=>{
    const b = h('button.chip'+((multi ? (value || []).includes(v) : v === value) ? '.on' : ''), {onclick:()=>{
      if(multi){ b.classList.toggle('on'); onChange(M.$$('.chip.on', wrap).map(x=>x.dataset.v)); }
      else { M.$$('.chip', wrap).forEach(x=>x.classList.remove('on')); b.classList.add('on'); onChange(v); }
      M.haptic(6);
    }, dataset:{v}}, label);
    wrap.appendChild(b);
  });
  return wrap;
};
M.ring = function(pct, size, stroke, content){
  size = size || 96; stroke = stroke || 9;
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const wrap = h('div.ring', {style:`width:${size}px;height:${size}px`});
  wrap.innerHTML = `<svg width="${size}" height="${size}"><circle class="bgc" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"/><circle class="fgc" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${c}" stroke-dashoffset="${c}"/></svg>`;
  const t = h('div.rt'); if(content) t.append(content); wrap.appendChild(t);
  const fg = wrap.querySelector('.fgc');
  wrap.set = p=>{ fg.style.strokeDashoffset = c * (1 - Math.max(0, Math.min(1, p))); };
  requestAnimationFrame(()=>requestAnimationFrame(()=>wrap.set(pct)));
  return wrap;
};
M.item = function(o){
  const el = h('button.item', {onclick:o.onClick},
    o.icon ? h('span.lead', {html:M.icon(o.icon)}) : null,
    h('div.grow', h('div.t', o.title), o.sub ? h('div.s', o.sub) : null),
    o.trail ? h('div.trail', o.trail) : null);
  return el;
};

/* ---------- view stack ---------- */
M.views = [];
M.openView = function(o){
  const root = M.$('#views');
  const body = h('div.view-body'+(o.nopad ? '.nopad' : ''));
  const title = h('h2', o.title || '');
  const head = h('div.view-head',
    h('button.icon-btn', {'aria-label':'رجوع', onclick:()=>view.close()}, M.ic('back')),
    title, ...(o.actions || []));
  const el = h('div.view', {id:o.id ? 'view-'+o.id : null}, o.noHead ? null : head, body);
  if(o.bg) el.style.background = o.bg;
  root.appendChild(el);
  const view = {el, body, head, title, close(){
    if(view.closed) return; view.closed = true;
    M.views = M.views.filter(v=>v!==view);
    if(o.onClose){ try{ o.onClose(); }catch(e){ console.error(e); } }   // a failing clean-up must never leave the view on screen
    el.classList.add('leaving'); setTimeout(()=>el.remove(), 330);
    M.emit('viewclose', o.id);
  }, setTitle(t){ title.textContent = t; }};
  M.views.push(view);
  if(o.build) o.build(body, view);
  return view;
};
// Android hardware back
M.onBack = function(){
  if(M.sheetStack.length){ M.sheetStack[M.sheetStack.length-1].close(); return true; }
  const dlg = M.$('#sheet-root .dialog'); if(dlg){ dlg.click(); return true; }
  if(M.views.length){ const v = M.views[M.views.length-1]; if(v.onBack && v.onBack()) return true; v.close(); return true; }
  return false;
};
window.onNativeBack = ()=>M.onBack();

/* ---------- misc ---------- */
M.debounce = (fn, ms)=>{ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), ms); }; };
M.copy = async function(text){
  try{ if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(text); M.toast('تم النسخ'); return; } }catch(e){}
  try{ const ta = h('textarea', {style:'position:fixed;opacity:0'}); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); M.toast('تم النسخ'); }catch(e){ M.toast('تعذّر النسخ'); }
};
M.share = async function(text){
  try{
    if(window.Android && window.Android.share){ window.Android.share(text); return; }
    if(navigator.share){ await navigator.share({text}); return; }
  }catch(e){ if(e && e.name === 'AbortError') return; }
  M.copy(text);
};
M.isIOS = !!window.isIOSApp || /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
})();
