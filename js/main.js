/* ===== Main: home screen, tab bar, boot ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
M.screens = M.screens || {};
M.curTab = null;
const built = {};
const HT_IC = {fajr:'sunrise', dhuhr:'sun', asr:'sunlow', maghrib:'sunset', isha:'moon'};

/* ---------------- Home ---------------- */
const AYAT = [[2,255],[94,6],[13,28],[39,53],[2,286],[65,3],[2,152],[3,139],[93,3],[20,46],[9,40],[29,69],[2,186],[40,60],[57,4],[8,46],[16,128],[2,45],[3,159],[17,9],[25,63],[49,13],[51,56],[55,13],[24,35],[2,153],[64,11],[94,5],[12,87],[3,173]];
M.ayahOfDay = function(){ const d = new Date(); const i = (d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % AYAT.length; return AYAT[i]; };

function dateLine(now, hj){
  if(M.cfg.showDate === false) return [];
  const hi = h('span.badge.gold', M.WEEKDAYS[now.getDay()]+' '+M.fmtHijri(hj)), gr = h('span.small.muted', M.n(now.getDate())+' '+M.GMONTHS[now.getMonth()]+' '+M.n(now.getFullYear()));
  const f = M.cfg.dateFmt || 'both';
  return f === 'hijri' ? [hi] : f === 'greg' ? [h('span.badge.gold', M.WEEKDAYS[now.getDay()]+' '+M.n(now.getDate())+' '+M.GMONTHS[now.getMonth()]+' '+M.n(now.getFullYear()))] : [hi, gr];
}
/* greeting under «السلام عليكم»: follows the prayer times of the day, not fixed clock hours */
function greet(){
  try{
    const now = new Date(), t = M.prayerTimes(now), x = now.getTime();
    if(x < t.fajr) return 'ليلة مباركة';
    if(x < t.sunrise) return 'فجر مبارك';
    if(x < t.dhuhr - 20 * 60000) return 'صباح الخير';
    if(x < t.asr) return now.getDay() === 5 ? 'جمعة مباركة' : 'نهارك مبارك';
    if(x < t.maghrib) return 'عصر مبارك';
    if(x < t.isha) return 'مساء الخير';
    return 'ليلة مباركة';
  }catch(e){ const hr = new Date().getHours(); return hr < 5 ? 'ليلة مباركة' : hr < 12 ? 'صباح الخير' : hr < 17 ? 'نهارك مبارك' : hr < 20 ? 'مساء الخير' : 'ليلة مباركة'; }
}

M.screens.home = {
  icon:'s:home', label:'الرئيسية',
  build(el){
    el.innerHTML = '';
    const now = new Date(), hj = M.hijri(now), B = M.cfg.homeBlocks || {};
    el.append(h('div.page-top.home-top',
      h('div', h('div.sub', 'السلام عليكم'+(M.cfg.userName ? ' يا '+M.cfg.userName : '')), h('h1.greet', greet()),
        h('div.date-line', ...dateLine(now, hj))),
      h('div.row-flex.gap-s', h('button.icon-btn.tonal', {'aria-label':'بحث', onclick:()=>M.openSearch()}, M.ic('search')), h('button.icon-btn.tonal', {'aria-label':'الخلفية والمظهر', onclick:()=>M.openSettings('look')}, M.ic('palette')),
        h('button.icon-btn.tonal', {'aria-label':'الإعدادات', onclick:()=>M.openSettings()}, M.ic('settings')))));

    /* short notices that need the user (travel, reminders that may not arrive…) — v2-system.js */
    if(M.homeNotices) try{ M.homeNotices().forEach(n=>el.append(n)); }catch(e){ console.error(e); }

    /* next prayer */
    if(M.SICONS){
      M.SICONS.sunlow = M.SICONS.sunlow || '<path d="M7.5 15.5a4.5 4.5 0 0 1 9 0Z"/><path d="M12 5.4a1 1 0 0 1 1 1v1.6a1 1 0 0 1-2 0V6.4a1 1 0 0 1 1-1Zm6.1 2.4a1 1 0 0 1 0 1.4l-1.1 1.1a1 1 0 1 1-1.4-1.4l1.1-1.1a1 1 0 0 1 1.4 0Zm-12.2 0a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1-1.4 1.4L5.9 9.2a1 1 0 0 1 0-1.4Z"/><path d="M3 17.3h18v1.6H3z"/>';
      M.SICONS.sunset = M.SICONS.sunset || '<path d="M6.3 15a5.7 5.7 0 0 1 11.4 0Z"/><path d="M2.5 16.3h19v1.6h-19z"/><path d="M12 22.2 8.6 19h6.8Z"/><path d="M11.3 4.4h1.4v2.5h-1.4zM18.15 6.66l.99.99-1.77 1.77-.99-.99zM4.86 7.65l.99-.99 1.77 1.77-.99.99z"/>';
    }
    if(B.prayer !== false){
      const info = M.nextPrayer(new Date());
      const nm = h('div.nx-n.title-font'), tm = h('div.nx-t.small'), cd = h('div.cd.num'), bar = h('i'), cap = h('div.small.muted', 'الصلاة القادمة');
      let focus = null, focusT = null; // a prayer picked from the row below: the card shows it for a few seconds
      const hero = h('button.card.accent.prayer-hero.home-prayer', {onclick:()=>M.setTab('prayer')},
        h('div.hero-top', h('div.hero-nm', cap, nm), h('div.cd-wrap', cd)), tm,
        h('div.bar.hero-bar', bar), M.heroImg('home'));
      const tick = ()=>{
        const g = el.querySelector('.greet'); if(g){ const gt = greet(); if(g.textContent !== gt) g.textContent = gt; }
        if(focus){
          const pt = M.prayerTimes(new Date())[focus], d = pt - new Date();
          cap.textContent = d > 0 ? 'باقي على' : 'مضى على';
          nm.textContent = focus === 'dhuhr' && pt.getDay() === 5 ? 'الجمعة' : M.prayerLabel(focus, pt);
          tm.textContent = M.fmt(pt)+' • '+M.location().name;
          cd.textContent = M.n(M.fmtDur(Math.abs(d))); hero.classList.add('focus');
          return;
        }
        hero.classList.remove('focus'); cap.textContent = 'الصلاة القادمة';
        const n = M.nextPrayer(new Date()); const total = n.next.t - n.prev.t;
        nm.textContent = n.next.k === 'sunrise' ? 'الشروق' : n.next.k === 'dhuhr' && n.next.t.getDay() === 5 ? 'الجمعة' : M.prayerLabel(n.next.k, n.next.t);
        tm.textContent = M.fmt(n.next.t)+' • '+M.location().name;
        cd.textContent = M.n(M.fmtDur(n.next.t - new Date())); bar.style.width = Math.max(2, Math.min(100, (1 - (n.next.t - new Date()) / total) * 100))+'%';
      };
      tick(); if(M._homeTick) M._homeTick(); M._homeTick = M.every(()=>{ if(M.curTab !== 'home' || !hero.isConnected){ return; } tick(); });
      el.append(hero);
      const t = info.times; const rowT = h('div.home-times');
      ['fajr','dhuhr','asr','maghrib','isha'].forEach(k=>{
        const lbl = M.prayerLabel(k, new Date()), tm = h('div.small.bold.num', M.fmt(t[k]).replace(/\s?[صم]$/, ''));
        const cell = h('div.ht'+(info.next.k === k ? '.next' : ''), {role:'button', tabindex:0, 'aria-label':lbl+' '+M.fmt(t[k])}, h('div.ht-ic', M.ic('s:'+HT_IC[k])), h('div.tiny.muted', lbl), tm);
        // tap: the big card above shows how long until this prayer (or since it) for a few seconds
        const tap = ()=>{
          clearTimeout(focusT); M.$$('.ht', rowT).forEach(x=>x.classList.remove('sel'));
          if(focus === k){ focus = null; }
          else { focus = k; cell.classList.add('sel'); focusT = setTimeout(()=>{ focus = null; cell.classList.remove('sel'); tick(); }, 8000); }
          tick(); M.haptic && M.haptic(8);
        };
        cell.addEventListener('click', tap); cell.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tap(); } });
        rowT.append(cell);
      });
      el.append(h('div.card.pad.ht-card', rowT));
    }

    /* progress */
    if(B.progress !== false){
      const sc = M.T ? M.T.dayScore(new Date()) : {pct:0};
      const ad = M.adhkarProgressToday ? M.adhkarProgressToday() : {morning:0, evening:0};
      const pr = (M.QD.pagesRead[M.dkey()] || []).length;
      const st = M.T ? M.T.streak() : 0;
      el.append(h('div.card.pad.prog-card', h('div.section-h.in', 'تقدّم اليوم', h('button.link', {onclick:()=>M.openTracker({tab:'day'})}, 'التفاصيل')),
        h('div.grid4.prog-g',
          pg('محاسبة', sc.pct, M.n(Math.round(sc.pct * 100))+'٪', ()=>M.openTracker({tab:'day'})),
          pg('الصباح', ad.morning, M.n(Math.round(ad.morning * 100))+'٪', ()=>M.openAdhkarCategory && M.openAdhkarCategory('morning')),
          pg('المساء', ad.evening, M.n(Math.round(ad.evening * 100))+'٪', ()=>M.openAdhkarCategory && M.openAdhkarCategory('evening')),
          pg('ورد القرآن', Math.min(1, pr / (M.cfg.wird || 4)), M.n(pr)+'/'+M.n(M.cfg.wird || 4), ()=>M.setTab('quran'))),
        h('div.small.muted.streak', M.ic('flame'), ' ', (st ? 'سلسلة '+M.n(st)+' '+(st > 10 ? 'يومًا' : st > 2 ? 'أيام' : 'يوم') : 'ابدأ سلسلتك اليوم'))));
    }

    /* ayah of the day */
    if(B.ayah !== false){
      const [s, a] = M.ayahOfDay(); const box = h('div.card.pad.ayah-card', h('div.small.muted', 'آية اليوم'), h('div.ayah-t.qfont', '…'), h('div.small.muted.ayah-ref', ''));
      const act = h('div.row-flex.gap-s.ayah-act');
      box.append(act); el.append(box);
      M.loadQuran().then(()=>{
        box.querySelector('.ayah-t').textContent = M.ayahText(s, a); box.querySelector('.ayah-ref').textContent = 'سورة '+M.sname(s)+' • آية '+M.arNum(a);
        act.append(h('button.btn.tonal.sm', {onclick:()=>M.openReader({sura:s, ayah:a})}, M.ic('quran'), 'في المصحف'),
          h('button.btn.tonal.sm', {onclick:()=>M.player.play(s, a)}, M.ic('play'), 'استمع'),
          h('button.btn.tonal.sm', {onclick:()=>M.share('﴿'+M.ayahText(s, a)+'﴾ — سورة '+M.sname(s)+' آية '+M.arNum(a))}, M.ic('share')));
      }).catch(()=>{ box.querySelector('.ayah-t').textContent = ''; });
    }

    /* quick actions */
    if(B.quick !== false){
      const last = M.QD.last;
      let q;
      if(M.shortcuts && M.SECTIONS){ q = M.shortcuts().map(id=>{ const x = M.SECTIONS.find(y=>y[0] === id); return [x[2], x[1], ()=>M.sectionOpen(id)]; }); }
      else q = [['quran','تابع القراءة',()=>M.openReader({page:last.page, sura:last.sura, ayah:last.ayah})],['s:counter','المسبحة',()=>M.openTasbih()]];
      const g = h('div.grid4.quick'); q.forEach(([i, t, f])=>g.append(h('button.tile.card', {onclick:f}, h('div.ti', {html:M.icon(i)}), t)));
      if(M.openAllSections) g.append(h('button.tile.card', {onclick:()=>M.openAllSections()}, h('div.ti', {html:M.icon('grid')}), 'الكل'));
      el.append(h('div.section-h', {dataset:{hk:'quick'}}, 'اختصاراتي', h('button.link', {onclick:()=>M.openShortcutsEditor && M.openShortcutsEditor()}, 'تعديل')), g);
    }

    /* dhikr */
    if(B.dhikr !== false && M.dhikrOfTheDay){
      const [t, s] = M.dhikrOfTheDay();
      el.append(h('div.card.pad.dhikr-card', h('div.small.muted', 'ذكر اليوم'), h('div.qfont.dh-text', t), h('div.tiny.muted', s),
        h('div.row-flex.gap-s', h('button.btn.tonal.sm', {onclick:()=>M.openTasbih()}, M.ic('beads'), 'سبّح'), h('button.btn.tonal.sm', {onclick:()=>M.copy(t)}, M.ic('copy')))));
    }
    if(B.hadith !== false && M.hadithOfDay){
      const [t, src] = M.hadithOfDay();
      el.append(h('div.card.pad.dhikr-card', h('div.small.muted', 'حديث اليوم'), h('div.qfont.dh-text', t), h('div.tiny.muted', src),
        h('div.row-flex.gap-s', h('button.btn.tonal.sm', {onclick:()=>M.share(t+' — '+src)}, M.ic('share')), h('button.btn.tonal.sm', {onclick:()=>M.copy(t)}, M.ic('copy')))));
    }
    const occ = M.nextOccasion && M.nextOccasion();
    if(occ) el.append(h('button.card.pad.occ-card', {onclick:()=>M.openCalendar()}, h('div.row-flex', h('span.lead', {html:M.icon('calendar')}), h('div.grow', h('div.small.muted', 'المناسبة القادمة'), h('div.bold', occ.text), h('div.tiny.muted', M.fmtHijri(occ.hj, true))), h('div.badge.num', occ.days === 0 ? 'اليوم' : occ.days === 1 ? 'غدًا' : 'بعد '+M.cnt(occ.days, 'يوم', true)))));
  }
};
function pg(label, pct, txt, fn){
  return h('button.pg', {onclick:fn}, M.ring(pct, 62, 7, h('span.tiny.bold.num', txt)), h('div.tiny', label));
}

/* ---------------- tab bar ---------------- */
const TAB_IDS = ['home','quran','prayer','adhkar','more'];
function buildTabbar(){
  const nav = M.$('#tabbar'); nav.innerHTML = '';
  const bar = h('div.bar'); const lens = h('div.lens'); bar.append(lens);
  /* the items come from the user's customisable list (v2-navbar.js); the five built-in ids are real tabs, anything else opens its section */
  const items = (M.navItems ? M.navItems() : TAB_IDS).map(id=>M.navDescribe ? M.navDescribe(id) : {id, tab:true, label:M.screens[id].label, icon:M.screens[id].icon}).filter(Boolean);
  items.forEach(d=>{
    bar.append(h('button.tab'+(d.tab ? '' : '.sec'), {dataset:{tab:d.id}, 'aria-label':d.label, onclick:()=>{ if(d.tab) M.setTab(d.id); else if(M.sectionOpen) M.sectionOpen(d.id); }}, h('span.ind', {html:M.icon(d.icon)}), h('span.lb', d.label)));
  });
  nav.append(bar);
  M.$$('#tabbar .tab').forEach(t=>t.classList.toggle('on', !!M.curTab && t.dataset.tab === M.curTab));
  M.navbarAfterBuild && M.navbarAfterBuild(nav, bar);
  moveLens(false);
}
M.buildTabbar = buildTabbar;
function moveLens(animate){
  const bar = M.$('#tabbar .bar'), lens = M.$('#tabbar .lens'), t = M.$('#tabbar .tab.on'); if(!bar || !lens) return;
  lens.classList.toggle('none', !t);   // the current tab may not be on the bar at all
  if(!t) return;
  const br = bar.getBoundingClientRect(), tr = t.getBoundingClientRect();
  lens.style.setProperty('--lens-w', tr.width+'px'); lens.style.setProperty('--lens-x', (tr.left - br.left)+'px');
  if(animate){ lens.classList.remove('moving'); void lens.offsetWidth; lens.classList.add('moving'); }
}
M.moveLens = moveLens;
M.setTab = function(id){
  if(!M.screens[id]) return;
  const prev = M.curTab; M.curTab = id;
  TAB_IDS.forEach(t=>{
    let el = M.$('#screen-'+t);
    if(!el){ el = h('section.screen', {id:'screen-'+t}); M.$('#screens').append(el); }
    const on = t === id;
    if(on && (!built[t] || t === 'home' || t === 'prayer')){ try{ M.screens[t].build(el); built[t] = true; }catch(e){ console.error(e); el.textContent = 'خطأ: '+e.message; } }
    el.classList.toggle('active', on);
    if(on && prev !== id) el.scrollTop = 0;
  });
  M.$$('#tabbar .tab').forEach(t=>t.classList.toggle('on', t.dataset.tab === id));
  moveLens(prev != null);
  document.documentElement.dataset.tab = id;
  M.bgScopeApply(); M.haptic(6); M.emit('tab', id);
};
M.refreshScreen = function(id){
  const ids = id ? [id] : Object.keys(built);
  ids.forEach(t=>{ const el = M.$('#screen-'+t); if(el && M.screens[t] && built[t] && (t === M.curTab || !id)){ try{ M.screens[t].build(el); }catch(e){ console.error(e); } } else if(built[t] && t !== M.curTab) built[t] = false; });
};
M.on('settings', k=>{
  if(k === 'digits' || k === 'homeBlocks' || k === 'userName' || k === 'hijriAdj' || k === 'hijriType' || k === 'readMode' || k === 'loc' || k === 'method' || k === 'madhhab' || k === 'adjust') {
    Object.keys(built).forEach(t=>{ if(t !== M.curTab) built[t] = false; });
    if(M.curTab) setTimeout(()=>M.refreshScreen(M.curTab), 0);
  }
});
M.on('viewclose', ()=>{ M.bgScopeApply(); if(M.curTab === 'home') M.refreshScreen('home'); });
M.on('tracker', ()=>{ if(M.curTab === 'home') M.refreshScreen('home'); });
window.addEventListener('resize', M.debounce(()=>moveLens(false), 100));

/* the old «continue reading» FAB is now an entry of the global bubble (v2-navbar.js) */

/* ---------------- native back button ---------------- */
window.onNativeBack = ()=>{
  if(M.bubbleClose && M.bubbleClose()) return true;
  if(M.onBack()) return true;
  if(M.curTab && M.curTab !== 'home'){ M.setTab('home'); return true; }
  return false;
};

/* ---------------- boot ---------------- */
/* the digits setting also covers text that is written without M.h (textContent / innerHTML) */
function watchDigits(){
  const fix = n=>{ const v = n.nodeValue, w = M.dg(v); if(w !== v) n.nodeValue = w; };
  const walk = el=>{ if(el.nodeType === 3){ fix(el); return; } if(el.nodeType !== 1 || el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'TEXTAREA') return; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while((n = tw.nextNode())) fix(n); };
  new MutationObserver(list=>{ for(const m of list){ if(m.type === 'characterData') fix(m.target); else m.addedNodes.forEach(walk); } }).observe(document.getElementById('app'), {subtree:true, childList:true, characterData:true});
}
function boot(){
  watchDigits();
  M.applyTheme();
  buildTabbar();
  M.setTab('home');
  M.bubbleInit && M.bubbleInit();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>moveLens(false));
  setTimeout(()=>moveLens(false), 60);
  setTimeout(()=>{ M.loadQuran && M.loadQuran().then(()=>{ M.syncNative && M.syncNative(); M.loadWidgetTafsir && M.loadWidgetTafsir(); }).catch(()=>{}); }, 1800);
  M.syncNative && M.syncNative();
  M.maybeOnboard && M.maybeOnboard();
  try{ M.autoBackup && M.autoBackup(); M.myDuaReminder && setTimeout(M.myDuaReminder, 1500); if(M.cfg.startRandom && M.openRandom) setTimeout(M.openRandom, 400); }catch(e){}
  if('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.Android){ try{ navigator.serviceWorker.register('sw.js'); }catch(e){} }
  // let the native splash know we're ready
  try{ window.Android && window.Android.ready && window.Android.ready(); }catch(e){}
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
