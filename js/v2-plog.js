/* ===== prayer log: the five daily prayers, one state each (congregation / on time / made up / missed / excused) =====
   Data: store "plog" = {"YYYY-MM-DD": {fajr:"j"|"o"|"q"|"m"|"x", …}}
   Ties into the rest of the app:
   • the "✓ صلّيت" button on adhan notifications (Android) logs natively; the log is merged here when the app opens
   • "in congregation" ticks the tracker's «الجماعة الأولى» item, "missed" adds one to the qada counter (and undoes it)
   • on time / congregation for fajr ticks «صلاة الفجر في وقتها» in the home checklist */
(function(){
'use strict';
const M = window.M, h = M.h;
const P = [['fajr', 'الفجر'], ['dhuhr', 'الظهر'], ['asr', 'العصر'], ['maghrib', 'المغرب'], ['isha', 'العشاء']];
const NAME = {}; P.forEach(([k, n])=>NAME[k] = n);
const ST = {
  j:{t:'في جماعة', s:'جماعة', ic:'mosque', c:'pl-j'},
  o:{t:'في وقتها', s:'في وقتها', ic:'check', c:'pl-o'},
  q:{t:'قضاء (بعد خروج وقتها)', s:'قضاء', ic:'clock', c:'pl-q'},
  m:{t:'فاتتني', s:'فاتتني', ic:'close', c:'pl-m'},
  x:{t:'عذر شرعي', s:'عذر', ic:'heart', c:'pl-x'}
};
const ORDER = ['j', 'o', 'q', 'm', 'x'];
const load = ()=>{ const v = M.store.get('plog', {}); return v && typeof v === 'object' ? v : {}; };
const keyOf = d=>typeof d === 'string' ? d : M.dkey(d);

function lbl(k, date){ return k === 'dhuhr' && date && (typeof date === 'string' ? M.parseKey(date) : date).getDay() === 5 ? 'الجمعة' : NAME[k]; }

/* start of a prayer and the end of its time (next prayer; sunrise for fajr; next fajr for isha) */
function windowOf(dateKey, k){
  const d = M.parseKey(dateKey); d.setHours(12, 0, 0, 0);
  const t = M.prayerTimes(d);
  const end = k === 'fajr' ? t.sunrise : k === 'dhuhr' ? t.asr : k === 'asr' ? t.maghrib : k === 'maghrib' ? t.isha : M.prayerTimes(M.addDays(d, 1)).fajr;
  return [t[k], end];
}

const PL = M.PL = {};
PL.get = (date, k)=>(load()[keyOf(date)] || {})[k] || '';
PL.day = date=>Object.assign({}, load()[keyOf(date)] || {});
PL.set = function(date, k, st, opts){
  opts = opts || {};
  if(!NAME[k] || (st && !ST[st])) return;
  const all = load(), dk = keyOf(date), day = all[dk] = all[dk] || {};
  const old = day[k] || '';
  if(old === st) return;
  if(st) day[k] = st; else delete day[k];
  if(!Object.keys(day).length) delete all[dk];
  M.store.set('plog', all);
  // qada counter: "missed" adds one, leaving "missed" takes it back
  const delta = (st === 'm' ? 1 : 0) - (old === 'm' ? 1 : 0);
  if(delta){ try{ const q = M.store.get('qada', {}) || {}; q[k] = Math.max(0, (q[k] || 0) + delta); M.store.set('qada', q); }catch(e){} }
  // tracker «الجماعة الأولى»
  try{ if(M.T && M.T.check && (st === 'j') !== (old === 'j')) M.T.check(dk, k+'_jamaa', st === 'j'); }catch(e){}
  // home checklist: fajr on time
  if(k === 'fajr' && !opts.fromChk){ try{ const ck = 'chk:'+dk, x = M.store.get(ck, {}) || {}; const want = st === 'o' || st === 'j'; if(!!x.fajr !== want){ x.fajr = want; M.store.set(ck, x); } }catch(e){} }
  M.emit && M.emit('plog', dk, k, st);
};
PL.dayCount = function(date){ const d = PL.day(date); return P.filter(([k])=>d[k] && d[k] !== 'm').length; };
/* consecutive days, ending today (or yesterday while today is still open), with all five prayers logged and none missed */
PL.streak = function(){
  const all = load(); let n = 0, cur = new Date(); cur.setHours(12, 0, 0, 0);
  const full = d=>{ const x = all[M.dkey(d)] || {}; return P.every(([k])=>x[k] && x[k] !== 'm'); };
  if(!full(cur)) cur = M.addDays(cur, -1);
  while(full(cur) && n < 3650){ n++; cur = M.addDays(cur, -1); }
  return n;
};
PL.stats = function(days){
  const all = load(), now = new Date(); now.setHours(12, 0, 0, 0);
  const r = {j:0, o:0, q:0, m:0, x:0, logged:0, days:days};
  for(let i = 0; i < days; i++){ const x = all[M.dkey(M.addDays(now, -i))] || {}; P.forEach(([k])=>{ const s = x[k]; if(s && r[s] != null){ r[s]++; r.logged++; } }); }
  const counted = r.logged - r.x;
  r.onTime = counted ? (r.j + r.o) / counted : 0;
  return r;
};

/* ---- native log from the notification button ---- */
function mergeNative(){
  if(!(window.Android && window.Android.takePrayed)) return;
  let a = [];
  try{ a = JSON.parse(window.Android.takePrayed() || '[]'); }catch(e){ a = []; }
  if(!Array.isArray(a) || !a.length) return;
  const names = [];
  a.forEach(it=>{
    const m = /^(\d{4}-\d{2}-\d{2})\|(fajr|dhuhr|asr|maghrib|isha)$/.exec(String(it && it.pk || '')); if(!m) return;
    const dk = m[1], k = m[2], ts = +it.ts || Date.now();
    let st = 'o';
    try{ const [, end] = windowOf(dk, k); if(ts > end.getTime() + 30 * 60000) st = 'q'; }catch(e){}   // a tap soon after is still the prayer of its time
    const cur = PL.get(dk, k);
    if(cur === 'j' || cur === 'o' || cur === 'x') return;       // a richer answer is kept
    PL.set(dk, k, st); names.push(NAME[k]);
  });
  if(names.length) setTimeout(()=>{ try{ M.toast('سُجّلت من الإشعار: '+names.join('، ')); }catch(e){} }, 900);
}
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) mergeNative(); });
M.plogMerge = mergeNative;   // iPhone: called when a «✓ صلّيت» tap arrives while the page is open
setTimeout(mergeNative, 1200);

/* the home checklist's «صلاة الفجر في وقتها» goes the other way */
M.on && M.on('chk', (k, val, dk)=>{ if(k !== 'fajr') return; const cur = PL.get(dk || M.dkey(), 'fajr'); if(val && !cur) PL.set(dk || M.dkey(), 'fajr', 'o', {fromChk:true}); else if(!val && (cur === 'o')) PL.set(dk || M.dkey(), 'fajr', '', {fromChk:true}); });

/* ---- choosing a state ---- */
function pick(dk, k, done){
  const cur = PL.get(dk, k);
  let sh = null;
  const b = h('div');
  {
    const day = M.parseKey(dk);
    b.append(h('div.small.muted', {style:'margin:-4px 0 10px'}, M.WEEKDAYS[day.getDay()]+' '+M.n(day.getDate())+' '+M.GMONTHS[day.getMonth()]));
    const l = h('div.list.card.pl-pick');
    ORDER.forEach(s=>l.append(h('button.item'+(cur === s ? '.on' : ''), {onclick:()=>{ PL.set(dk, k, s); M.haptic && M.haptic(12); sh.close(); done && done(); if(s === 'm') M.toast('أُضيفت إلى صلوات القضاء'); }},
      h('span.lead.pl-dot.'+ST[s].c, {html:M.icon(ST[s].ic)}), h('div.grow', h('div.t', ST[s].t)), cur === s ? h('span.trail', {html:M.icon('check')}) : null)));
    if(cur) l.append(h('button.item', {onclick:()=>{ PL.set(dk, k, ''); sh.close(); done && done(); }}, h('span.lead', {html:M.icon('trash')}), h('div.grow', h('div.t', 'مسح'))));
    b.append(l);
  }
  sh = M.sheet({title:'صلاة '+lbl(k, dk), content:b});
}

/* ---- the five chips of one day (used in the section and on the prayer tab) ---- */
function dayRow(dk, opts){
  opts = opts || {};
  const row = h('div.pl-row');
  const now = Date.now(), d = M.parseKey(dk); d.setHours(12, 0, 0, 0);
  let t = null; try{ t = M.prayerTimes(d); }catch(e){}
  const draw = ()=>{
    row.replaceChildren();
    const day = PL.day(dk);
    P.forEach(([k])=>{
      const st = day[k] || '', future = t && t[k] && t[k].getTime() > now;
      const b = h('button.pl-chip'+(st ? '.'+ST[st].c : '')+(future ? '.future' : ''), {'aria-label':'صلاة '+lbl(k, dk)+': '+(st ? ST[st].t : future ? 'لم يحن وقتها' : 'لم تُسجّل'), disabled:future && !st,
        onclick:()=>pick(dk, k, ()=>{ draw(); opts.onChange && opts.onChange(); })},
        h('span.pl-ic', {html:M.icon(st ? ST[st].ic : future ? 'clock' : 'plus')}),
        h('span.pl-n', lbl(k, dk)),
        h('span.pl-s', st ? ST[st].s : future && t ? M.fmt(t[k]) : 'سجّل'));
      row.append(b);
    });
  };
  draw();
  row.redraw = draw;
  return row;
}

/* card on the prayer tab for the day being shown there */
M.plogCard = function(date){
  const dk = keyOf(date || new Date());
  const isToday = dk === M.dkey();
  const head = h('div.pl-head', h('div.bold', isToday ? 'صلوات اليوم' : 'سجل صلوات هذا اليوم'), h('span.small.muted.num'));
  const card = h('div.card.pad.pl-card', head);
  const count = ()=>{ head.lastChild.textContent = M.n(PL.dayCount(dk))+'/'+M.n(5); };
  const row = dayRow(dk, {onChange:count});
  card.append(row, h('button.btn.ghost.sm.pl-all', {onclick:()=>M.openTracker({tab:'prayers'})}, M.ic('calendar'), 'السجل والإحصاءات'));
  count();
  return card;
};

/* ---- the «الصلوات» tab of «متابعة العبادات» (one place for tracking worship) ---- */
M.plogPanel = function(el, repaint){
  const top = h('div'), week = h('div'), stats = h('div'), opts = h('div');
  el.append(top, stats, week, opts);
  function drawAll(){
    top.replaceChildren(); stats.replaceChildren(); week.replaceChildren(); opts.replaceChildren();
    const today = M.dkey(), hj = M.hijri ? M.hijri(new Date()) : null;
    top.append(h('div.card.pad.pl-card.pl-today',
      h('div.pl-head', h('div', h('div.bold', 'صلوات اليوم'), h('div.tiny.muted', M.WEEKDAYS[new Date().getDay()]+(hj ? ' • '+M.n(hj.d)+' '+M.HMONTHS[hj.m - 1] : ''))), h('span.small.muted.num', M.n(PL.dayCount(today))+'/'+M.n(5))),
      dayRow(today, {onChange:drawAll})));
    const s30 = PL.stats(30), streak = PL.streak();
    stats.append(h('div.pl-stats',
      h('div.card.pad.pl-stat', h('b.num', M.n(streak)), h('span.tiny', 'أيام متتالية'), h('span.tiny.muted', 'دون فوائت')),
      h('div.card.pad.pl-stat', h('b.num', s30.logged ? M.n(Math.round(s30.onTime * 100))+'٪' : '—'), h('span.tiny', 'في الوقت'), h('span.tiny.muted', 'آخر '+M.cnt(30, 'يوم'))),
      h('div.card.pad.pl-stat', h('b.num', M.n(s30.j)), h('span.tiny', 'في جماعة'), h('span.tiny.muted', 'آخر '+M.cnt(30, 'يوم')))));
    if(s30.m) stats.append(h('button.card.pad.pl-qada', {onclick:()=>M.sectionOpen('qada')}, h('span.lead', {html:M.icon('clock')}), h('div.grow', h('div.bold', M.n(s30.m)+' صلوات فائتة في آخر ٣٠ يومًا'), h('div.tiny.muted', 'أُضيفت إلى «قضاء الصلوات» — اختر «قضاء» هنا عند أدائها')), M.ic('fwd')));
    const g = h('div.card.pad.pl-week');
    g.append(h('div.pl-wh', h('span'), ...P.map(([k, n])=>h('span.tiny.muted', n))));
    for(let i = 0; i < 7; i++){
      const d = M.addDays(new Date(), -i), dk = M.dkey(d), day = PL.day(dk);
      let t = null; try{ t = M.prayerTimes(d); }catch(e){}
      g.append(h('div.pl-wr', h('span.small', i === 0 ? 'اليوم' : i === 1 ? 'أمس' : M.WEEKDAYS[d.getDay()]),
        ...P.map(([k])=>{ const st = day[k] || '', future = i === 0 && t && t[k] > new Date();
          return h('button.pl-cell'+(st ? '.'+ST[st].c : '')+(future ? '.future' : ''), {disabled:future && !st, 'aria-label':(i === 0 ? 'اليوم' : M.WEEKDAYS[d.getDay()])+' — '+lbl(k, d)+': '+(st ? ST[st].t : 'لم تُسجّل'), onclick:()=>pick(dk, k, drawAll)}, st ? h('span', {html:M.icon(ST[st].ic)}) : null); })));
    }
    week.append(h('h3.section-h', 'آخر سبعة أيام'), g, h('div.pl-legend', ...ORDER.map(s=>h('span.tiny', h('i.pl-dot.'+ST[s].c), ST[s].s))));
    if(M.can('notifAction')) opts.append(h('div.list.card', {style:'margin-top:14px'},
      h('div.item.static', h('div.grow', h('div.t', 'زر «✓ صلّيت» في إشعار الأذان'), h('div.s', 'سجّل صلاتك من الإشعار دون فتح التطبيق')),
        M.switchEl(M.cfg.plogNotif !== false, v=>{ M.save('plogNotif', v); M.syncNative && M.syncNative(); }))));
    opts.append(h('div.tiny.muted', {style:'margin:10px 4px 0;line-height:1.9'}, 'يبقى السجل على جهازك فقط. «فاتتني» تضيف الصلاة إلى «قضاء الصلوات» تلقائيًا، و«في جماعة» تُعلِّم «الجماعة الأولى» في تبويب «اليوم».'));
  }
  drawAll();
};
/* one entry point for deep links («plog»); the menus list «متابعة العبادات» only */
M.addSection({id:'plog', title:'سجل الصلوات', icon:'check', group:'عباداتي', noMore:true, fn:()=>M.openTracker({tab:'prayers'})});
})();
