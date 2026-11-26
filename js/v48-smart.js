/* ===== 4.8: the app that follows the day =====
   1. a card on the home screen that changes with the time (morning dhikr after fajr, Al-Kahf on Friday, the night prayer after isha…)
   2. the khatma ring: how much of the Mushaf you have read, and one tap to carry on
   3. «remember where I was»: the tab (and, for half an hour, the section) comes back when the app opens
   4. the calm reading mode: warm light and gradual dimming at night in the Mushaf
   5. widgets that follow the time (Android): light by day, dark from maghrib to fajr */
(function(){
'use strict';
const M = window.M, h = M.h;
if(!M || !h) return;
const on = (k, d)=>M.cfg[k] === undefined ? d : !!M.cfg[k];
const SAFE = (f, d)=>{ try{ return f(); }catch(e){ return d; } };

/* ---------- 1. what fits this hour ---------- */
M.smartNow = function(now){
  now = now || new Date();
  const t = M.prayerTimes(now), x = +now, min = 60000, fri = now.getDay() === 5;
  if(x >= t.fajr && x < t.sunrise + 45 * min) return {id:'morning', ic:'s:sunrise', k:'بعد الفجر', t:'أذكار الصباح', s:'ابدأ يومك بذكر الله', go:()=>M.openAdhkarCategory && M.openAdhkarCategory('morning')};
  if(fri && x < t.asr) return {id:'kahf', ic:'s:mushaf', k:'يوم الجمعة', t:'سورة الكهف', s:'نورٌ لك بين الجمعتين', go:()=>M.openReader({sura:18, ayah:1})};
  if(x >= t.sunrise + 45 * min && x < t.dhuhr - 15 * min) return {id:'duha', ic:'s:sun', k:'وقت الضحى', t:'صلاة الضحى', s:'«ويُجزئ من ذلك ركعتان يركعهما من الضحى» — رواه مسلم', go:()=>M.openGuide && M.openGuide('duha')};
  if(now.getDay() === 4 && x >= t.maghrib && x < t.isha) return {id:'salawat', ic:'s:beads', k:'ليلة الجمعة', t:'الصلاة على النبي ﷺ', s:'«أكثروا الصلاة عليّ يوم الجمعة وليلة الجمعة» — البيهقي، حسّنه الألباني', go:()=>M.openTasbih && M.openTasbih()};
  if(x >= t.asr && x < t.isha) return {id:'evening', ic:'s:sunset', k:'قبل الغروب وبعده', t:'أذكار المساء', s:'اختم نهارك بالذكر', go:()=>M.openAdhkarCategory && M.openAdhkarCategory('evening')};
  if(x >= t.isha || x < t.fajr) return {id:'qiyam', ic:'s:moon', k:'الليل', t:'قيام الليل والوتر', s:'ركعات خفيفة قبل النوم أو في آخر الليل', go:()=>M.openGuide && M.openGuide('qiyam')};
  return null;
};
/* the Quran read so far: distinct pages across every day */
M.khatmaProgress = function(){
  const pr = M.QD.pagesRead || {}, s = new Set(); Object.keys(pr).forEach(d=>(pr[d] || []).forEach(p=>s.add(p)));
  return {pages:s.size, pct:Math.min(1, s.size / 604)};
};

const home0 = M.screens.home.build;
M.screens.home.build = function(el){
  home0.call(this, el);
  try{
    const B = M.cfg.homeBlocks || {}, host = el.querySelector('.ht-card') || el.querySelector('.prayer-hero'); if(!host) return;
    const parts = [];
    const n = on('smartHome', true) ? SAFE(()=>M.smartNow(), null) : null;
    if(n) parts.push(h('button.card.pad.smart-card', {onclick:()=>{ M.haptic && M.haptic(8); n.go(); }, dataset:{sn:n.id}},
      h('span.smart-ic', M.ic(n.ic)), h('div.grow', h('div.tiny.muted', n.k), h('div.bold', n.t), h('div.small.muted', n.s)), h('span.smart-go', M.ic('fwd'))));
    if(on('khatmaRing', true) && B.khatma !== false){
      const k = M.khatmaProgress(), l = M.QD.last, pct = Math.round(k.pct * 100);
      parts.push(h('button.card.pad.smart-card.kh-ring', {onclick:()=>{ M.haptic && M.haptic(8); M.openReader({page:l.page, sura:l.sura, ayah:l.ayah}); }},
        M.ring(k.pct, 56, 6, h('span.smart-mush', M.ic('s:mushaf'))),
        h('div.grow', h('div.tiny.muted', 'ختمتك'), h('div.bold', M.n(pct)+'٪ من المصحف'), h('div.small.muted', k.pages ? 'تابع من صفحة '+M.arNum(l.page) : 'ابدأ من الفاتحة')),
        h('span.smart-go', M.ic('fwd'))));
    }
    let a = host; parts.forEach(p=>{ a.after(p); a = p; });
  }catch(e){ console.error(e); }
};
/* the card must follow the clock while the app stays open: the home screen is rebuilt when it comes back to the front, and every 10 minutes */
setInterval(()=>{ if(M.curTab === 'home' && !M.views.length && !document.hidden && on('smartHome', true)){
  const el = document.getElementById('screen-home'), cur = el && el.querySelector('.smart-card[data-sn]'), n = SAFE(()=>M.smartNow(), null);
  if(el && ((cur && cur.dataset.sn) || '') !== ((n && n.id) || '')) M.refreshScreen('home'); } }, 600000);

/* ---------- 3. remember where I was ---------- */
const PL = 'v48place';
const place = ()=>M.store.get(PL, {}) || {};
const setPlace = o=>M.store.set(PL, Object.assign(place(), o, {t:Date.now()}));
const saved = place();   // read before the app boots: its first M.setTab('home') records «home» over it
M.on('tab', id=>{ if(on('rememberPlace', true)) setPlace({tab:id, sec:null}); });
if(M.sectionOpen){ const so = M.sectionOpen; M.sectionOpen = function(id){ if(on('rememberPlace', true)) SAFE(()=>setPlace({sec:id})); return so.apply(this, arguments); }; }
M.on('viewclose', ()=>{ setTimeout(()=>{ if(!M.views.length && on('rememberPlace', true)) setPlace({sec:null}); }, 50); });
let deep = false;
if(M.openDeep){ const od = M.openDeep; M.openDeep = function(){ deep = true; return od.apply(this, arguments); }; }
function restore(){
  // a widget, a notification or a shortcut asked for a place: that wins; so does anything the user already opened
  if(deep || !on('rememberPlace', true) || M.cfg.startRandom || M.curTab !== 'home' || M.views.length) return;
  const p = saved; if(!p.tab || p.tab === 'home' || !M.screens[p.tab]) return;
  M.setTab(p.tab);
  if(p.sec && Date.now() - (p.t || 0) < 30 * 60000 && M.SECTIONS && M.SECTIONS.some(s=>s[0] === p.sec)) setTimeout(()=>{ if(!deep && !M.views.length) SAFE(()=>M.sectionOpen(p.sec)); }, 300);
}
/* right after the app has drawn its first screen (main.js boots on DOMContentLoaded), before a deep link can arrive */
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(restore, 0)); else setTimeout(restore, 0);

/* ---------- 4. calm reading ---------- */
/* how strong the calm is now: 0 by day; from isha it grows to 1 around midnight and stays until fajr */
M.calmLevel = function(now){
  now = now || new Date(); const mode = M.cfg.calmRead || 'night';
  if(mode === 'off') return 0; if(mode === 'on') return 1;
  const t = SAFE(()=>M.prayerTimes(now), null), x = +now; let isha, fajr;
  if(t){ isha = +t.isha; fajr = +t.fajr; } else { const d = new Date(now); d.setHours(20, 0, 0, 0); isha = +d; d.setHours(4, 30, 0, 0); fajr = +d; }
  if(x >= isha){ return Math.min(1, .35 + .65 * (x - isha) / (4 * 3600000)); }
  if(x < fajr){ const r = (fajr - x) / 1800000; return r >= 1 ? 1 : .5 + .5 * r; }   // the last half hour before fajr eases off
  return 0;
};
function paintCalm(root){
  const k = M.calmLevel(), main = root.querySelector('.rd-main') || root;
  let ov = root.querySelector('.rd-calm');
  if(k <= 0){ if(ov) ov.remove(); root.classList.remove('calm'); main.style.filter = ''; M._calm = false; return; }
  if(!ov){ ov = h('div.rd-calm', {'aria-hidden':'true'}); root.append(ov); }
  root.classList.add('calm'); M._calm = true;
  ov.style.opacity = String((.22 + .5 * k).toFixed(2));                       // warm amber, stronger as the night goes on
  main.style.filter = 'brightness('+(1 - .22 * k).toFixed(2)+') sepia('+(.18 * k).toFixed(2)+')';
}
const mo = new MutationObserver(()=>{
  const r = document.querySelector('.reader:not([data-calm])'); if(!r) { if(!document.querySelector('.reader')) M._calm = false; return; }
  r.dataset.calm = '1'; paintCalm(r);
  const iv = setInterval(()=>{ if(!r.isConnected){ clearInterval(iv); M._calm = false; return; } paintCalm(r); }, 60000);
});
mo.observe(document.getElementById('app') || document.body, {childList:true, subtree:true});
/* in the calm mode the app stays quiet while reading: the dhikr and wird pop-ups wait (the small confirmations stay, they answer a tap) */
M.calmQuiet = ()=>!!(M._calm && document.querySelector('.reader'));

/* ---------- 5. widgets that follow the time (Android) ---------- */
M.syncTimedWidget = function(){
  try{
    if(!window.Android || !Android.setWidgetTimed) return;
    const t = M.prayerTimes(new Date()), m = d=>d.getHours() * 60 + d.getMinutes();
    Android.setWidgetTimed(!!M.cfg.wdgTimed, m(t.maghrib), m(t.fajr));
  }catch(e){}
};
M.on('settings', k=>{ if(k === 'wdgTimed' || k === 'loc' || k === 'method') M.syncTimedWidget(); });
setTimeout(M.syncTimedWidget, 2500);

/* ---------- settings ---------- */
const S = M.SETSUB = M.SETSUB || {};
function addToggles(){
  const home = S.home; if(!home || home._v48) return; home._v48 = 1;
  const b0 = home.build, sw = (k, d)=>M.switchEl(on(k, d), v=>M.save(k, v));
  const row = (t, s, ctl)=>h('div.row-flex', {style:'padding:12px 14px;gap:12px'}, h('div.grow', h('div.bold', t), h('div.small.muted', s)), ctl);
  home.build = function(b){
    b0.apply(this, arguments);
    b.append(h('div.section-h', 'تتبّع يومك'),
      h('div.list.card',
        row('بطاقة الوقت', 'تبرز على الرئيسية ما يناسب الساعة: أذكار الصباح، الضحى، الكهف يوم الجمعة، أذكار المساء، قيام الليل', sw('smartHome', true)),
        row('حلقة الختمة', 'نسبة ما قرأته من المصحف، ولمسة واحدة للمتابعة', sw('khatmaRing', true)),
        row('تذكّر آخر مكان', 'يفتح التطبيق على التبويب الذي كنت فيه، والقسم إن كان قبل أقل من نصف ساعة', sw('rememberPlace', true)),
        row('ودجت يتبع الوقت (أندرويد)', 'فاتح بالنهار وداكن من المغرب إلى الفجر', sw('wdgTimed', false))),
      h('div.section-h', 'وضع القراءة الهادئ'),
      h('div.small.muted', {style:'margin:0 4px 8px'}, 'ضوء دافئ وتعتيم تدريجي في المصحف مع الليل، ولا تظهر نوافذ الأذكار المنبثقة داخل التطبيق أثناء القراءة. إشعارات الجهاز نفسها تُضبط من إعدادات الهاتف.'),
      M.seg([['night', 'بالليل'], ['on', 'دائمًا'], ['off', 'متوقف']], M.cfg.calmRead || 'night', v=>M.save('calmRead', v)));
  };
}
addToggles();
})();
