/* ===== Accountability tracker (mirrors the weekly sheet) ===== */
(function(){
'use strict';
const M = window.M, h = M.h;

const T = M.T = {};
const load = ()=>M.store.get('trk', {});
const saveAll = d=>M.store.set('trk', d);
const keyOf = d=>typeof d === 'string' ? d : M.dkey(d);
const ALL = ()=>[].concat(...M.TRACKER.map(s=>s.items));
const ITEMS = {}; M.TRACKER.forEach(s=>s.items.forEach(i=>{ ITEMS[i.id] = i; i.sec = s.id; }));

T.get = (date, id)=>!!((load()[keyOf(date)] || {})[id]);
T.check = function(date, id, val){
  const d = load(), k = keyOf(date);
  const day = d[k] = d[k] || {};
  if(val) day[id] = 1; else delete day[id];
  if(!Object.keys(day).length) delete d[k];
  saveAll(d);
  M.emit('tracker', k);
  evalBadges(true);
};
T.dayScore = function(date){
  const dt = typeof date === 'string' ? M.parseKey(date) : date, dow = dt.getDay(), day = load()[keyOf(dt)] || {};
  let pts = 0, max = 0;
  ALL().forEach(it=>{ if(!M.itemEnabled(it, dow)) return; max += it.w; if(day[it.id]) pts += it.w; });
  return {pts, max, pct:max ? pts / max : 0};
};
T.weekStart = d=>{ const x = new Date(d); x.setHours(12,0,0,0); return M.addDays(x, -((x.getDay() + 1) % 7)); };
T.weekScore = function(start){
  const days = M.TRACKER_DAYS.map((_, i)=>M.addDays(start, i));
  let pts = 0, max = 0; days.forEach(d=>{ const s = T.dayScore(d); pts += s.pts; max += s.max; });
  return {pts, max, pct:max ? pts / max : 0};
};
T.streak = function(){
  const d = load(); let n = 0, cur = new Date(); cur.setHours(12);
  if(!d[M.dkey(cur)]) cur = M.addDays(cur, -1);
  while(d[M.dkey(cur)]){ n++; cur = M.addDays(cur, -1); }
  return n;
};

/* ---- badges ---- */
function runLen(d, fn){ // longest run of consecutive days satisfying fn(dayObj)
  const keys = Object.keys(d).sort(); let best = 0, run = 0, prev = null;
  keys.forEach(k=>{
    const ok = fn(d[k]);
    if(!ok){ run = 0; prev = null; return; }
    const dt = M.parseKey(k);
    if(prev && Math.round((dt - prev) / 864e5) === 1) run++; else run = 1;
    prev = dt; best = Math.max(best, run);
  });
  return best;
}
function evalBadges(notify){
  const d = load(), have = M.store.get('badges', {}); const got = [];
  const weeks = {}; Object.keys(d).forEach(k=>{ const ws = M.dkey(T.weekStart(M.parseKey(k))); (weeks[ws] = weeks[ws] || []).push(k); });
  const test = {
    fajr7:()=>runLen(d, x=>x.fajr_jamaa) >= 7,
    jamaa5:()=>Object.values(d).some(x=>x.fajr_jamaa && x.dhuhr_jamaa && x.asr_jamaa && x.maghrib_jamaa && x.isha_jamaa),
    adhkar7:()=>runLen(d, x=>x.adhkar_morning && x.adhkar_evening) >= 7,
    qiyam3:()=>Object.keys(weeks).some(ws=>weeks[ws].filter(k=>d[k].qiyam_rak).length >= 3),
    fast2:()=>Object.keys(weeks).some(ws=>{ const ks = weeks[ws].filter(k=>d[k].fast).map(k=>M.parseKey(k).getDay()); return ks.includes(1) && ks.includes(4); }),
    kahf:()=>Object.values(d).some(x=>x.fri_kahf),
    week80:()=>Object.keys(weeks).some(ws=>{ const s = T.weekScore(M.parseKey(ws)); return s.max && s.pct >= .8; }),
    streak30:()=>runLen(d, x=>Object.keys(x).length) >= 30
  };
  M.TRACKER_BADGES.forEach(b=>{ if(!have[b.id] && test[b.id] && test[b.id]()){ have[b.id] = M.dkey(); got.push(b); } });
  if(got.length){ M.store.set('badges', have); if(notify) got.forEach(b=>{ M.toast('وسام جديد: '+b.t, 3200); M.haptic(30); }); }
  return have;
}
T.badges = ()=>evalBadges(false);

/* ---- shared ---- */
const DOWN = d=>M.WEEKDAYS[d.getDay()];
function fmtDay(d){ return M.n(d.getDate())+' '+M.GMONTHS[d.getMonth()]; }
function checkbox(on, onClick, cls){
  const b = h('button.cb'+(on ? '.on' : '')+(cls ? '.'+cls : ''), {'aria-pressed':String(!!on), onclick:e=>{ const v = !b.classList.contains('on'); b.classList.toggle('on', v); b.setAttribute('aria-pressed', String(v)); M.haptic(v ? 14 : 6); onClick(v, b); }}, M.ic('check'));
  return b;
}

/* ---- main view ---- */
M.openTracker = function(opts){
  opts = opts || {};
  const S = {tab:opts.tab || 'day', date:new Date(), ws:T.weekStart(new Date())};
  S.date.setHours(12,0,0,0);
  const body = h('div.trk');
  const tabs = h('div');
  const content = h('div.trk-content');
  const view = M.openView({title:'متابعة العبادات', id:'tracker', build:b=>{ b.append(tabs, content); }});
  const unsub = M.on('tracker', ()=>{ if(!view.closed) paint(true); });
  const origClose = view.close; view.close = function(){ unsub(); origClose.call(view); M.refreshScreen && M.refreshScreen('home'); };

  function drawTabs(){
    tabs.innerHTML = '';
    tabs.append(M.seg([['day','اليوم'],['prayers','الصلوات'],['week','الأسبوع'],['stats','الإنجازات']], S.tab, v=>{ S.tab = v; paint(); }));
    tabs.style.margin = '4px 0 12px';
  }
  function paint(keepScroll){
    const st = content.scrollTop; drawTabs(); content.innerHTML = '';
    if(S.tab === 'prayers' && M.plogPanel){ M.plogPanel(content, paint); } else (S.tab === 'day' ? dayView : S.tab === 'week' ? weekView : statsView)(content);
    if(keepScroll) view.body.scrollTop = view.body.scrollTop;
  }

  /* day */
  function dayView(el){
    const dow = S.date.getDay(), sc = T.dayScore(S.date), isToday = M.dkey(S.date) === M.dkey();
    const secs = M.TRACKER.map(sec=>sec.items.filter(i=>M.itemEnabled(i, dow))).filter(x=>x.length), full = secs.filter(its=>its.every(i=>T.get(S.date, i.id))).length;
    const ring = M.ring(sc.pct, 84, 8, h('div.bold.num', M.n(Math.round(sc.pct * 100))+'٪'));
    const nav = h('div.trk-nav', h('button', {'aria-label':'اليوم السابق', onclick:e=>{ e.stopPropagation(); S.date = M.addDays(S.date, -1); paint(); }}, M.ic('back')),
      h('button.trk-nav-d', {onclick:e=>{ e.stopPropagation(); if(!isToday){ S.date = new Date(); paint(); } }}, isToday ? 'اليوم' : 'العودة إلى اليوم'),
      h('button', {'aria-label':'اليوم التالي', onclick:e=>{ e.stopPropagation(); S.date = M.addDays(S.date, 1); paint(); }, disabled:isToday}, M.ic('fwd')));
    el.append(M.hero({kicker:(isToday ? 'اليوم — ' : '')+DOWN(S.date)+' '+fmtDay(S.date), title:'درجتك اليوم', sub:M.n(sc.pts)+' من '+M.cnt(sc.max, 'درجة', true, 'درجة'), side:ring,
      stats:[[M.n(T.streak()), 'أيام متتالية'], [M.n(full)+'/'+M.n(secs.length), 'أقسام مكتملة'], [M.n(sc.pts), 'درجة']], foot:nav}));
    M.TRACKER.forEach(sec=>{
      const its = sec.items.filter(i=>M.itemEnabled(i, dow)); if(!its.length) return;
      const done = its.filter(i=>T.get(S.date, i.id)).length;
      const card = h('div.card.trk-sec'+(done === its.length ? '.full' : ''));
      card.append(h('div.trk-sec-h', h('span.trk-sec-ic', {html:M.icon(sec.icon || 'check')}), h('div.grow', h('div.bold', sec.name), h('div.trk-sec-bar', h('i', {style:'width:'+(done / its.length * 100)+'%'}))), h('span.trk-sec-n.num', M.n(done)+'/'+M.n(its.length))));
      its.forEach(i=>{
        const on = T.get(S.date, i.id);
        const row = h('div.trk-row'+(on ? '.on' : ''), h('div.grow', h('div.trk-t', i.t)), h('span.trk-w.num', {title:M.cnt(i.w, 'درجة')}, '\u2066+'+M.n(i.w)+'\u2069'));
        row.append(checkbox(T.get(S.date, i.id), v=>{ T.check(S.date, i.id, v); }));
        row.addEventListener('click', e=>{ if(e.target.closest('.cb')) return; row.querySelector('.cb').click(); });
        card.append(row);
      });
      el.append(card);
    });
  }

  /* week — mirrors the printed sheet: Saturday → Friday, weights, row totals, grand total */
  function weekView(el){
    const days = M.TRACKER_DAYS.map((_, i)=>M.addDays(S.ws, i));
    const ws = T.weekScore(S.ws), todayK = M.dkey();
    const hj = M.hijri ? M.hijri(S.ws) : null;
    el.append(h('div.datenav', h('button.icon-btn', {onclick:()=>{ S.ws = M.addDays(S.ws, -7); paint(); }}, M.ic('back')),
      h('div.dn-c', h('div.bold', 'الأسبوع: '+fmtDay(days[0])+' – '+fmtDay(days[6])), h('div.small.muted', hj ? M.n(hj.d)+' '+M.HMONTHS[hj.m - 1]+' '+M.n(hj.y)+' هـ' : '')),
      h('button.icon-btn', {onclick:()=>{ S.ws = M.addDays(S.ws, 7); paint(); }}, M.ic('fwd'))));
    el.append(h('div.card.pad.accent.trk-sum', M.ring(ws.pct, 80, 8, h('div.bold.num', M.n(Math.round(ws.pct * 100))+'٪')),
      h('div.grow', h('div.title-font.bold', 'مجموع الأسبوع'), h('div.small', M.n(ws.pts)+' من '+M.n(ws.max)+' درجة'), h('div.small.muted', 'اضغط على الخانة لتحديدها'))));
    const tbl = h('table.trk-tbl');
    const head = h('tr', h('th.nm', 'العبادة'));
    days.forEach(d=>head.append(h('th.dy'+(M.dkey(d) === todayK ? '.today' : ''), h('div', DOWN(d).replace(/^ال/, '')), h('div.d2', M.n(d.getDate())+'/'+M.n(d.getMonth() + 1)))));
    head.append(h('th.tt', 'المجموع'));
    tbl.append(h('thead', head));
    const tb = h('tbody');
    const colPts = days.map(()=>0), colMax = days.map(()=>0);
    M.TRACKER.forEach(sec=>{
      tb.append(h('tr.sec', h('th', {colspan:9}, h('span', {html:M.icon(sec.icon || 'check')}), ' '+sec.name)));
      sec.items.forEach(it=>{
        const tr = h('tr'); tr.append(h('th.nm', it.t, h('span.wt', M.n(it.w))));
        let rp = 0, rm = 0;
        days.forEach((d, i)=>{
          const en = M.itemEnabled(it, d.getDay());
          if(!en){ tr.append(h('td.dis')); return; }
          const on = T.get(d, it.id); rm += it.w; colMax[i] += it.w; if(on){ rp += it.w; colPts[i] += it.w; }
          const td = h('td'+(M.dkey(d) === todayK ? '.today' : '')); td.append(checkbox(on, v=>{ T.check(d, it.id, v); }));
          tr.append(td);
        });
        tr.append(h('td.tt.num', M.n(rp)+'/'+M.n(rm)));
        tb.append(tr);
      });
    });
    tbl.append(tb);
    const foot = h('tr.total', h('th.nm', 'المجموع'));
    colPts.forEach((p, i)=>foot.append(h('td.num', M.n(p)+'/'+M.n(colMax[i]))));
    foot.append(h('td.tt.num', M.n(ws.pts)+'/'+M.n(ws.max)));
    const pc = h('tr.total.pc', h('th.nm', 'النسبة'));
    colPts.forEach((p, i)=>pc.append(h('td.num', colMax[i] ? M.n(Math.round(p / colMax[i] * 100))+'٪' : '–')));
    pc.append(h('td.tt.num', M.n(Math.round(ws.pct * 100))+'٪'));
    tbl.append(h('tfoot', foot, pc));
    el.append(h('div.tbl-wrap.trk-wrap', tbl));
    el.append(h('div.row-flex.gap-s', {style:'margin-top:12px;flex-wrap:wrap'},
      h('button.btn.tonal.sm', {onclick:()=>{ S.ws = T.weekStart(new Date()); paint(); }}, 'هذا الأسبوع'),
      h('button.btn.tonal.sm', {onclick:()=>shareWeek(days, ws)}, M.ic('share'), 'مشاركة'),
      h('button.btn.tonal.sm', {onclick:()=>printWeek(days, ws)}, M.ic('download'), 'طباعة / PDF')));
    // scroll the table so today is in view (RTL friendly)
    const w = el.querySelector('.trk-wrap'); requestAnimationFrame(()=>{ const t = w.querySelector('th.today'); if(t){ w.scrollLeft = 0; } });
  }

  function shareWeek(days, ws){
    let s = 'جدول المحاسبة — '+fmtDay(days[0])+' إلى '+fmtDay(days[6])+'\n';
    M.TRACKER.forEach(sec=>{
      s += '\n'+sec.name+'\n';
      sec.items.forEach(it=>{ const n = days.filter(d=>M.itemEnabled(it, d.getDay()) && T.get(d, it.id)).length, m = days.filter(d=>M.itemEnabled(it, d.getDay())).length; if(m) s += '• '+it.t+': '+M.n(n)+'/'+M.n(m)+'\n'; });
    });
    s += '\nالمجموع: '+M.n(ws.pts)+' / '+M.n(ws.max)+' ('+M.n(Math.round(ws.pct * 100))+'٪)';
    M.share(s);
  }
  function printWeek(days, ws){
    const rows = [];
    M.TRACKER.forEach(sec=>{
      rows.push('<tr class="s"><th colspan="9">'+sec.name+'</th></tr>');
      sec.items.forEach(it=>{
        let rp = 0, rm = 0;
        const cells = days.map(d=>{ if(!M.itemEnabled(it, d.getDay())) return '<td class="x"></td>'; rm += it.w; const on = T.get(d, it.id); if(on) rp += it.w; return '<td>'+(on ? '✓' : '')+'</td>'; }).join('');
        rows.push('<tr><th>'+it.t+' <small>('+it.w+')</small></th>'+cells+'<td><b>'+rp+'/'+rm+'</b></td></tr>');
      });
    });
    const html = '<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8"><title>جدول المحاسبة</title><style>body{font-family:system-ui,sans-serif;padding:14px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #888;padding:4px;text-align:center}th:first-child{text-align:start}tr.s th{background:#ddd}td.x{background:repeating-linear-gradient(45deg,#ccc,#ccc 3px,#fff 3px,#fff 6px)}h2{text-align:center}</style><h2>جدول المحاسبة الأسبوعي</h2><table><tr><th>العبادة</th>'+days.map(d=>'<th>'+DOWN(d)+'<br>'+d.getDate()+'/'+(d.getMonth() + 1)+'</th>').join('')+'<th>المجموع</th></tr>'+rows.join('')+'<tr class="s"><th>المجموع الكلي</th><th colspan="8">'+ws.pts+' / '+ws.max+' ('+Math.round(ws.pct * 100)+'٪)</th></tr></table><script>setTimeout(function(){print()},300)<\/script></html>';
    if(window.Android && window.Android.printHtml){ window.Android.printHtml(html.replace(/<script>.*?<\/script>/, '')); return; }
    try{ const w = window.open('', '_blank'); if(w){ w.document.write(html.replace(/<script>.*?<\/script>/, '')); w.document.close(); setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} }, 350); return; } }catch(e){}
    M.toast('تعذّرت الطباعة — استخدم المشاركة');
  }

  /* stats */
  function statsView(el){
    const have = T.badges(), st = T.streak();
    const d = load(), keys = Object.keys(d);
    // last 8 weeks bars
    const wk = []; let w0 = T.weekStart(new Date());
    for(let i = 7; i >= 0; i--){ const s = M.addDays(w0, -7 * i); wk.push([s, T.weekScore(s)]); }
    el.append(h('div.grid2', h('div.card.pad.stat', h('div.stat-n.num.streak', M.ic('flame'), ' ', M.n(st)), h('div.small.muted', 'أيام متتالية')),
      h('div.card.pad.stat', h('div.stat-n.num', M.n(keys.length)), h('div.small.muted', 'أيام مسجّلة'))));
    const chart = h('div.card.pad', h('div.bold', 'آخر ٨ أسابيع'));
    const bars = h('div.wk-bars');
    wk.forEach(([s, sc])=>bars.append(h('div.wk-b', h('div.tiny.num', M.n(Math.round(sc.pct * 100))), h('div.wk-col', h('i', {style:'height:'+Math.max(3, sc.pct * 100)+'%'})), h('div.tiny.muted', M.n(s.getDate())+'/'+M.n(s.getMonth() + 1)))));
    chart.append(bars); el.append(chart);
    // per-section completion this week
    const sec = h('div.card.pad', h('div.bold', {style:'margin-bottom:8px'}, 'أداء الأقسام هذا الأسبوع'));
    const days = M.TRACKER_DAYS.map((_, i)=>M.addDays(T.weekStart(new Date()), i));
    M.TRACKER.forEach(s=>{
      let p = 0, m = 0; s.items.forEach(it=>days.forEach(dd=>{ if(M.itemEnabled(it, dd.getDay())){ m += it.w; if(T.get(dd, it.id)) p += it.w; } }));
      sec.append(h('div.sec-p', h('div.small', s.name, h('b.num', {style:'float:inline-end'}, M.n(m ? Math.round(p / m * 100) : 0)+'٪')), h('div.bar.sm', h('i', {style:'width:'+(m ? p / m * 100 : 0)+'%'}))));
    });
    el.append(sec);
    el.append(h('div.section-h', 'الأوسمة', h('small', M.n(Object.keys(have).length)+'/'+M.n(M.TRACKER_BADGES.length))));
    const g = h('div.grid2');
    M.TRACKER_BADGES.forEach(b=>g.append(h('div.card.pad.badge-c'+(have[b.id] ? '.got' : ''), h('div.bd-ic', {html:M.icon(b.icon)}), h('div.bold.small', b.t), h('div.tiny.muted', b.d), have[b.id] ? h('div.tiny.ok', '✓ تم') : h('div.tiny.muted', 'قيد الإنجاز'))));
    el.append(g);
    el.append(h('div.row-flex.gap-s', {style:'margin-top:14px'}, h('button.btn.danger.sm', {onclick:async()=>{ if(await M.confirm('سيتم حذف جميع بيانات الجدول والأوسمة. هل أنت متأكد؟', 'حذف')){ M.store.del('trk'); M.store.del('badges'); paint(); } }}, M.ic('trash'), 'مسح البيانات')));
  }
  paint();
  return view;
};
evalBadges(false);
})();
