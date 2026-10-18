/* ===== Hijri calendar, occasions, converter ===== */
(function(){
'use strict';
const M = window.M, h = M.h;

const fmts = {};
const CALS = {umalqura:'islamic-umalqura', civil:'islamic-civil', tbla:'islamic-tbla'};
function core(date, type){
  const cal = CALS[type] || CALS.umalqura;
  const f = fmts[cal] = fmts[cal] || new Intl.DateTimeFormat('en-u-ca-'+cal+'-nu-latn', {year:'numeric', month:'numeric', day:'numeric', timeZone:'UTC'});
  const parts = f.formatToParts(date); const o = {};
  parts.forEach(p=>{ if(p.type !== 'literal') o[p.type] = parseInt(p.value, 10); });
  return {y:o.year, m:o.month, d:o.day};
}

/* ---- Hijri by country: [code, name, type, default offset in days, lat, lng, tz list]
   Offsets are deliberately conservative: 0 unless the country's official/community calendar is well known to lag the Umm al-Qura calendar. */
M.HIJRI_COUNTRIES = [
  ['SA', 'السعودية (أم القرى)', 'umalqura', 0, 24.7, 46.7, ['Asia/Riyadh']],
  ['EG', 'مصر (دار الإفتاء)', 'umalqura', 0, 30.0, 31.2, ['Africa/Cairo']],
  ['AE', 'الإمارات', 'umalqura', 0, 24.5, 54.4, ['Asia/Dubai']],
  ['QA', 'قطر', 'umalqura', 0, 25.3, 51.5, ['Asia/Qatar']],
  ['KW', 'الكويت', 'umalqura', 0, 29.4, 48.0, ['Asia/Kuwait']],
  ['BH', 'البحرين', 'umalqura', 0, 26.2, 50.6, ['Asia/Bahrain']],
  ['OM', 'عُمان', 'umalqura', 0, 23.6, 58.4, ['Asia/Muscat']],
  ['JO', 'الأردن', 'umalqura', 0, 31.9, 35.9, ['Asia/Amman']],
  ['PS', 'فلسطين', 'umalqura', 0, 31.9, 35.2, ['Asia/Gaza', 'Asia/Hebron', 'Asia/Jerusalem']],
  ['LB', 'لبنان', 'umalqura', 0, 33.9, 35.5, ['Asia/Beirut']],
  ['SY', 'سوريا', 'umalqura', 0, 33.5, 36.3, ['Asia/Damascus']],
  ['IQ', 'العراق', 'umalqura', 0, 33.3, 44.4, ['Asia/Baghdad']],
  ['YE', 'اليمن', 'umalqura', 0, 15.4, 44.2, ['Asia/Aden']],
  ['SD', 'السودان', 'umalqura', 0, 15.6, 32.5, ['Africa/Khartoum']],
  ['LY', 'ليبيا', 'umalqura', 0, 32.9, 13.2, ['Africa/Tripoli']],
  ['TN', 'تونس', 'umalqura', 0, 36.8, 10.2, ['Africa/Tunis']],
  ['DZ', 'الجزائر', 'umalqura', 0, 36.8, 3.1, ['Africa/Algiers']],
  ['MA', 'المغرب', 'umalqura', 0, 34.0, -6.8, ['Africa/Casablanca']],
  ['MR', 'موريتانيا', 'umalqura', 0, 18.1, -15.9, ['Africa/Nouakchott']],
  ['TR', 'تركيا (ديانت)', 'umalqura', 0, 39.9, 32.9, ['Europe/Istanbul', 'Asia/Istanbul']],
  ['ID', 'إندونيسيا', 'umalqura', 0, -6.2, 106.8, ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Pontianak']],
  ['MY', 'ماليزيا', 'umalqura', 0, 3.1, 101.7, ['Asia/Kuala_Lumpur', 'Asia/Kuching']],
  ['PK', 'باكستان', 'umalqura', -1, 33.7, 73.1, ['Asia/Karachi']],
  ['IN', 'الهند', 'umalqura', -1, 28.6, 77.2, ['Asia/Kolkata', 'Asia/Calcutta']],
  ['BD', 'بنغلاديش', 'umalqura', -1, 23.8, 90.4, ['Asia/Dhaka']],
  ['IR', 'إيران', 'umalqura', 0, 35.7, 51.4, ['Asia/Tehran']],
  ['GB', 'المملكة المتحدة', 'umalqura', 0, 51.5, -0.1, ['Europe/London']],
  ['US', 'الولايات المتحدة', 'umalqura', 0, 38.9, -77.0, ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles']],
  ['CA', 'كندا', 'umalqura', 0, 45.4, -75.7, ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Montreal']]
];
const CBY = {}; M.HIJRI_COUNTRIES.forEach(c=>CBY[c[0]] = c);
const TYPES = {umalqura:'أم القرى', civil:'مدني حسابي', tbla:'فلكي جدولي'};
function detectCountry(){
  const loc = M.cfg.loc; if(!loc) return null;
  if(loc.tz){ const c = M.HIJRI_COUNTRIES.find(c=>c[6].includes(loc.tz)); if(c) return c[0]; }
  if(typeof loc.lat === 'number' && typeof loc.lng === 'number'){
    let best = null, bd = 1e9; const r = Math.PI / 180;
    M.HIJRI_COUNTRIES.forEach(c=>{ const a = Math.sin((c[4] - loc.lat) * r / 2) ** 2 + Math.cos(loc.lat * r) * Math.cos(c[4] * r) * Math.sin((c[5] - loc.lng) * r / 2) ** 2; const km = 12742 * Math.asin(Math.sqrt(a)); if(km < bd){ bd = km; best = c[0]; } });
    if(bd < 1200) return best;
  }
  return null;
}
let memo = null;
// effective settings: {code, name, auto, type, base (country offset), adj (manual), shift (base+adj), ov (per-month overrides)}
M.hijriInfo = function(){
  if(memo) return memo;
  const cfg = M.cfg; let code = cfg.hijriCountry, auto = false;
  if(!code || code === 'auto'){
    auto = true; code = cfg.hijriCountry ? detectCountry() : (cfg.hijriType === 'civil' ? 'custom' : detectCountry());
  }
  let c = CBY[code], type = c ? c[2] : (code === 'custom' ? 'civil' : 'umalqura'), base = c ? c[3] : 0;
  const tov = cfg.hijriTypeOv; if(tov && CALS[tov]) type = tov;
  const adj = Math.max(-3, Math.min(3, +cfg.hijriAdj || 0));
  const ov = cfg.hijriMonthOv && typeof cfg.hijriMonthOv === 'object' ? cfg.hijriMonthOv : {};
  return memo = {code: c ? code : 'SA', name: c ? c[1] : (code === 'custom' ? 'مدني حسابي (إعداد سابق)' : 'السعودية (أم القرى)'), auto, type, typeName: TYPES[type], base, adj, shift: base + adj, ov, hasOv: Object.keys(ov).length > 0};
};
M.on('settings', ()=>{ memo = null; });
const okey = x=>x.y + '-' + x.m;
// date → Hijri {y,m,d}; works on local calendar day (noon-UTC trick avoids tz shifts)
M.hijri = function(date, noAdj){
  date = date || new Date();
  const I = M.hijriInfo();
  const at = n=>new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + n + (noAdj ? 0 : I.shift), 12));
  try{
    const c = n=>core(at(n), I.type), r0 = c(0);
    if(noAdj || !I.hasOv) return r0;
    // per-month overrides: «this month started k days later/earlier than calculated»
    const cs = -(r0.d - 1);
    const len = (()=>{ const t = c(cs + 29); return (t.m === r0.m && t.d >= 30) ? 30 : 29; })();
    const pm = c(cs - 1), ns = cs + len, nm = c(ns);
    const cand = [[cs - pm.d, pm], [cs, r0], [ns, nm]].map(([s, x])=>({s: s + (+I.ov[okey(x)] || 0), x})).filter(o=>o.s <= 0);
    if(!cand.length) return r0;
    const best = cand.reduce((a, b)=>b.s >= a.s ? b : a);
    return {y:best.x.y, m:best.x.m, d:1 - best.s};
  }catch(e){ return {y:1447, m:1, d:1}; }
};
const ord = x=>x.y * 400 + x.m * 31 + x.d;
// Hijri → local Gregorian Date
M.hijriToGreg = function(y, m, d){
  const days = (y - 1) * 354.3667 + (m - 1) * 29.53 + (d - 1);
  const est = new Date(Date.UTC(622, 6, 16) + days * 864e5);
  let g = new Date(est.getUTCFullYear(), est.getUTCMonth(), est.getUTCDate(), 12), guard = 0;
  const target = {y, m, d};
  while(guard++ < 80){
    const c = M.hijri(g); const diff = ord(c) - ord(target);
    if(c.y === y && c.m === m && c.d === d) break;
    g = M.addDays(g, diff < 0 ? 1 : -1);
  }
  return g;
};
M.hijriMonthLen = function(y, m){
  const a = M.hijriToGreg(y, m, 1); const nm = m === 12 ? [y + 1, 1] : [y, m + 1];
  const b = M.hijriToGreg(nm[0], nm[1], 1);
  return Math.round((b - a) / 864e5);
};
M.fmtHijri = (hj, short)=>M.n(hj.d)+' '+M.HMONTHS[hj.m - 1]+(short ? '' : ' '+M.n(hj.y)+' هـ');

// occasions for a given date
M.occasionsOn = function(date, hj){
  hj = hj || M.hijri(date); const out = [];
  M.OCCASIONS.forEach(o=>{ if(o[0] === hj.m && o[1] === hj.d) out.push({t:o[2], k:o[3]}); });
  if([13, 14, 15].includes(hj.d) && hj.m !== 12 && !(hj.m === 9 && false)) out.push({t:'من الأيام البيض (يُستحب صيامها)', k:'fast'});
  if(hj.m === 10 && hj.d === 1) { /* Eid: fasting is forbidden — remove white-day hint if any */ }
  if(date.getDay() === 1 || date.getDay() === 4) out.push({t:'يوم '+(date.getDay() === 1 ? 'الاثنين' : 'الخميس')+' (يُستحب صيامه)', k:'fast', minor:true});
  if(date.getDay() === 5) out.push({t:'يوم الجمعة', k:'star', minor:true});
  if(hj.m === 10 && hj.d >= 2 && hj.d <= 30) { /* six days of Shawwal */ out.push({t:'يُستحب صيام ستٍّ من شوال', k:'fast', minor:true}); }
  // Eid days: no fasting
  if((hj.m === 10 && hj.d === 1) || (hj.m === 12 && [10, 11, 12, 13].includes(hj.d))){ return out.filter(o=>o.k !== 'fast' || /عاشوراء|عرفة/.test(o.t)); }
  return out;
};
M.nextOccasion = function(){
  const today = new Date(); today.setHours(12);
  for(let i = 0; i < 400; i++){
    const d = M.addDays(today, i), hj = M.hijri(d);
    const o = M.OCCASIONS.find(o=>o[0] === hj.m && o[1] === hj.d && o[3] !== 'night' || (o[0] === hj.m && o[1] === hj.d && o[2].includes('القدر')));
    if(o) return {days:i, text:o[2], date:d, hj};
  }
  return null;
};

/* ---- notes ---- */
const notes = ()=>M.store.get('dnotes', {});

/* ---- view ---- */
M.openCalendar = function(){
  const today = new Date(); today.setHours(12);
  const th = M.hijri(today);
  const S = {y:th.y, m:th.m, tab:'cal'};
  const content = h('div');
  const view = M.openView({title:'التقويم الهجري', id:'calendar', build:b=>{ b.append(content); }});

  function paint(){
    content.innerHTML = '';
    content.append(h('div.row-flex.gap-s', {style:'margin:4px 0 12px'}, h('div.grow', M.seg([['cal','التقويم'],['conv','المحوّل'],['occ','المناسبات']], S.tab, v=>{ S.tab = v; paint(); })), h('button.icon-btn.tonal', {'aria-label':'القمر', onclick:()=>M.openMoon()}, M.ic('moon'))));
    content.append(banner());
    (S.tab === 'cal' ? month : S.tab === 'conv' ? conv : occ)(content);
  }
  function month(el){
    const len = M.hijriMonthLen(S.y, S.m), first = M.hijriToGreg(S.y, S.m, 1);
    const last = M.addDays(first, len - 1);
    const isCur = S.y === th.y && S.m === th.m;
    if(!S.sel || S.selM !== S.y+'-'+S.m){ S.selM = S.y+'-'+S.m; S.sel = isCur ? th.d : 1; }
    const nav = (ic, fn, lbl)=>h('button.cal-nav', {'aria-label':lbl, onclick:fn}, M.ic(ic));
    el.append(h('div.cal-hero',
      nav('back', ()=>{ if(S.m === 1){ S.m = 12; S.y--; } else S.m--; paint(); }, 'الشهر السابق'),
      h('div.cal-title', h('div.cal-mn.title-font', M.HMONTHS[S.m - 1]), h('div.cal-yr', h('bdi', M.n(S.y)+' هـ'), h('i'), M.GMONTHS[first.getMonth()]+(first.getMonth() !== last.getMonth() ? ' – '+M.GMONTHS[last.getMonth()] : '')+' '+M.n(last.getFullYear()))),
      nav('fwd', ()=>{ if(S.m === 12){ S.m = 1; S.y++; } else S.m++; paint(); }, 'الشهر التالي')));
    const grid = h('div.cal-grid');
    const ws = M.cfg.weekStart == null ? 6 : M.cfg.weekStart;
    const DN = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    for(let i = 0; i < 7; i++) grid.append(h('div.cal-dow'+((ws + i) % 7 === 5 ? '.fri' : ''), DN[(ws + i) % 7].replace(/^ال/, '')));
    const off = (first.getDay() - ws + 7) % 7; for(let i = 0; i < off; i++) grid.append(h('div.cal-c.empty'));
    const nts = notes(); const cells = {};
    const detail = h('div.cal-detail');
    function showDetail(){
      detail.innerHTML = '';
      const g = M.addDays(first, S.sel - 1), hj = {y:S.y, m:S.m, d:S.sel}, occ = M.occasionsOn(g, hj), k = M.dkey(g), nt = notes()[k];
      const diff = Math.round((new Date(g.getFullYear(), g.getMonth(), g.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 864e5);
      const rel = diff === 0 ? 'اليوم' : diff === 1 ? 'غدًا' : diff === -1 ? 'أمس' : diff > 0 ? 'بعد '+M.cnt(diff, 'يوم', true, 'يومًا') : 'منذ '+M.cnt(-diff, 'يوم', true, 'يومًا');
      detail.append(h('div.cd-top', h('div.cd-num.title-font', M.n(S.sel)), h('div.grow', h('div.cd-d.bold', M.WEEKDAYS[g.getDay()]+' • '+M.HMONTHS[S.m - 1]+' '+M.n(S.y)+' هـ'), h('div.small.muted', M.n(g.getDate())+' '+M.GMONTHS[g.getMonth()]+' '+M.n(g.getFullYear())+' م')), h('span.cd-rel', rel)));
      if(occ.length){ const l = h('div.cd-occ'); occ.forEach(o=>l.append(h('div.occ-row', h('span.badge'+(o.k === 'eid' ? '.gold' : ''), o.minor ? 'سنة' : 'مناسبة'), h('span', o.t)))); detail.append(l); }
      else detail.append(h('div.small.muted', {style:'margin-top:8px'}, 'لا توجد مناسبات في هذا اليوم.'));
      if(nt) detail.append(h('div.cd-note', M.ic('note'), h('span', nt)));
      detail.append(h('div.row-flex.gap-s', {style:'margin-top:12px'}, h('button.btn.tonal.sm.grow', {onclick:()=>dayInfo(g, hj)}, M.ic('note'), nt ? 'تعديل الملاحظة' : 'إضافة ملاحظة'),
        h('button.btn.tonal.sm', {onclick:()=>M.share(M.WEEKDAYS[g.getDay()]+' '+M.fmtHijri(hj)+' الموافق '+M.n(g.getDate())+' '+M.GMONTHS[g.getMonth()]+' '+M.n(g.getFullYear()))}, M.ic('share'), 'مشاركة')));
    }
    for(let d = 1; d <= len; d++){
      const g = M.addDays(first, d - 1), hj = {y:S.y, m:S.m, d}, occ = M.occasionsOn(g, hj).filter(o=>!o.minor);
      const isT = M.dkey(g) === M.dkey(today);
      const kind = occ.some(o=>o.k === 'eid') ? 'eid' : occ.some(o=>o.k === 'fast') ? 'fast' : occ.length ? 'star' : '';
      const dots = h('span.cal-dots');
      if(occ.some(o=>o.k === 'eid')) dots.append(h('i.cal-dot.k-eid')); if(occ.some(o=>o.k === 'fast')) dots.append(h('i.cal-dot.k-fast')); if(occ.some(o=>o.k !== 'fast' && o.k !== 'eid')) dots.append(h('i.cal-dot')); if(nts[M.dkey(g)]) dots.append(h('i.cal-dot.k-note'));
      const c = h('button.cal-c'+(isT ? '.today' : '')+(kind ? '.k-'+kind : '')+(g.getDay() === 5 ? '.fri' : '')+(d === S.sel ? '.sel' : ''), {onclick:()=>{ cells[S.sel] && cells[S.sel].classList.remove('sel'); S.sel = d; c.classList.add('sel'); showDetail(); M.haptic(6); }},
        h('span.cal-h.num', M.n(d)), h('span.cal-g.num', M.n(g.getDate())), dots);
      cells[d] = c; grid.append(c);
    }
    el.append(h('div.card.cal-card', grid));
    el.append(h('div.row-flex.cal-leg', h('span.tiny', h('i.cal-dot.k-eid'), ' عيد'), h('span.tiny', h('i.cal-dot.k-fast'), ' صيام'), h('span.tiny', h('i.cal-dot'), ' مناسبة'), h('span.tiny', h('i.cal-dot.k-note'), ' ملاحظة')));
    showDetail(); el.append(h('div.card.pad.cal-dcard', detail)); el.append(monthOv(S.y, S.m));
    el.append(h('div.row-flex.gap-s', {style:'margin-top:12px;flex-wrap:wrap'}, h('button.btn.tonal.sm', {onclick:()=>{ S.y = th.y; S.m = th.m; S.selM = null; paint(); }}, M.ic('calendar'), 'اليوم'),
      h('button.btn.tonal.sm', {onclick:adjSheet}, M.ic('settings'), 'ضبط التاريخ')));
  }
  function dayInfo(g, hj){
    const occ = M.occasionsOn(g, hj), k = M.dkey(g), n = notes();
    const c = h('div', h('div.title-font.bold', M.WEEKDAYS[g.getDay()]+' '+M.fmtHijri(hj)), h('div.small.muted', M.n(g.getDate())+' '+M.GMONTHS[g.getMonth()]+' '+M.n(g.getFullYear())));
    occ.forEach(o=>c.append(h('div.occ-row', h('span.badge'+(o.k === 'eid' ? '.gold' : ''), o.minor ? 'سنة' : 'مناسبة'), h('span', o.t))));
    const ta = h('textarea.field', {value:n[k] || '', placeholder:'ملاحظة لهذا اليوم…', style:'margin-top:12px;min-height:80px'});
    c.append(ta, h('div.row-flex.gap-s', {style:'margin-top:10px'}, h('button.btn.block', {onclick:()=>{ const all = notes(); if(ta.value.trim()) all[k] = ta.value.trim(); else delete all[k]; M.store.set('dnotes', all); sh.close(); paint(); }}, 'حفظ'),
      h('button.btn.tonal', {onclick:()=>{ M.share(M.WEEKDAYS[g.getDay()]+' '+M.fmtHijri(hj)+' الموافق '+M.n(g.getDate())+' '+M.GMONTHS[g.getMonth()]+' '+M.n(g.getFullYear())); }}, M.ic('share'))));
    const sh = M.sheet({title:'تفاصيل اليوم', content:c});
  }
  const signed = n=>'\u2066'+(n > 0 ? '+' : n < 0 ? '−' : '')+M.n(Math.abs(n))+'\u2069';
  const fire = ()=>{ M.emit('settings', 'hijriAdj'); }; // refreshes home header + native widgets (they listen to hijriAdj)
  function banner(){
    const I = M.hijriInfo(), tot = I.shift;
    return h('div.card.pad.hj-banner', h('div.hj-b-t', M.ic('calendar'), h('div.grow', h('div.bold', I.name), I.auto ? h('div.small.muted', 'تلقائي حسب موقعك') : null, h('div.small.muted', 'الحساب: '+I.typeName+' • '+(tot ? 'الإزاحة: '+signed(tot)+' يوم' : 'بلا إزاحة')+(I.base ? ' (البلد '+signed(I.base)+'، ضبطك '+signed(I.adj)+')' : '')))),
      h('button.btn.tonal.sm', {onclick:adjSheet}, M.ic('settings'), 'تغيير'));
  }
  const CSUB = {}; // method shown only when it differs (offset countries follow moon sighting); names like «السعودية (أم القرى)» already carry theirs
  function countryPicker(onPick){
    const I0 = M.hijriInfo(), cur = I0.auto ? 'auto' : I0.code;
    const q = h('input.field', {type:'search', placeholder:'ابحث عن دولة…', 'aria-label':'بحث'});
    const list = h('div.hjc-list', {role:'listbox'});
    const rows = [['auto', 'تلقائي حسب موقعي', 'يُحدَّد من الدولة المحفوظة مع موقعك']].concat(M.HIJRI_COUNTRIES.map(c=>[c[0], c[1], c[3] ? 'رؤية • '+signed(c[3])+' يوم' : (CSUB[c[0]] || '')]));
    function fill(){
      const t = M.normAr(q.value.trim()); list.replaceChildren();
      rows.filter(r=>!t || M.normAr(r[1]).includes(t)).forEach(r=>{
        const on = cur === r[0];
        list.append(h('button.hjc-row'+(on ? '.on' : ''), {role:'option', 'aria-selected':on ? 'true' : 'false', dataset:{code:r[0]}, onclick:()=>{ sh.close(); onPick(r[0]); }},
          h('span.hjc-t', h('span.hjc-n', r[1]), r[2] ? h('span.hjc-s', r[2]) : null),
          h('span.hjc-ck', on ? M.ic('check') : null)));
      });
      if(!list.children.length) list.append(h('div.empty', 'لا نتائج'));
    }
    q.addEventListener('input', fill); fill();
    const sh = M.sheet({title:'التقويم الهجري حسب الدول', content:h('div.hjc', h('div.hjc-q', q), list)});
    sh.el.classList.add('hjc-sheet');
    setTimeout(()=>{ const on = list.querySelector('.on'); if(on && on.scrollIntoView) on.scrollIntoView({block:'center'}); }, 450);
  }
  function adjSheet(){
    const c = h('div.hj-set');
    const prev = h('div.hj-prev'), cty = h('div.hj-cty'), adjV = h('div.adj-v.num'), noteEl = h('div.small.muted.hj-note');
    const draw = ()=>{
      const I = M.hijriInfo(), t = M.hijri(new Date());
      cty.replaceChildren(h('div.grow', h('div.small.muted', 'الدولة'), h('div.bold', I.name), h('div.small.muted', (I.auto ? 'تلقائي حسب موقعك • ' : '')+I.typeName+(I.base ? ' • إزاحة البلد '+signed(I.base)+' يوم' : ' • بدون إزاحة'))), h('button.btn.tonal.sm', {onclick:()=>countryPicker(code=>{ M.save('hijriCountry', code); fire(); draw(); })}, 'اختيار'));
      adjV.textContent = I.adj ? signed(I.adj)+' يوم' : 'بلا تعديل';
      prev.replaceChildren(h('div.small.muted', 'تاريخ اليوم بعد الضبط'), h('div.title-font.bold.hj-pv', M.WEEKDAYS[new Date().getDay()]+' '+M.fmtHijri(t)));
      th.y = t.y; th.m = t.m; th.d = t.d;
    };
    const step = n=>()=>{ const a = Math.max(-3, Math.min(3, (+M.cfg.hijriAdj || 0) + n)); M.save('hijriAdj', a); draw(); };
    noteEl.textContent = 'تنبيه: الإعلان الرسمي لبداية الأشهر يعتمد غالبًا على رؤية الهلال، وقد يختلف عن الحساب بيوم. اختر بلدك ثم قدِّم التاريخ أو أخِّره يدويًا إن لزم. ويمكنك أيضًا ضبط بداية شهر معيّن (كرمضان والعيد) من شاشة التقويم.';
    c.append(cty, h('div.small.bold', {style:'margin-top:16px'}, 'ضبط يدوي (تقديم / تأخير)'), h('div.small.muted', 'يُضاف إلى إزاحة البلد، ويبقى منفصلًا عنها.'),
      h('div.row-flex', {style:'justify-content:center;gap:16px;margin:12px 0'}, h('button.icon-btn.tonal', {'aria-label':'تأخير يوم', onclick:step(-1)}, M.ic('minus')), adjV, h('button.icon-btn.tonal', {'aria-label':'تقديم يوم', onclick:step(1)}, M.ic('plus'))),
      h('div.hj-lbl.small.muted', h('span', '− تأخير'), h('span', 'تقديم +')), prev,
      h('div.small.bold', {style:'margin-top:16px'}, 'نوع الحساب'), M.seg([['', 'حسب البلد'], ['umalqura', 'أم القرى'], ['civil', 'مدني'], ['tbla', 'فلكي']], M.cfg.hijriTypeOv || '', t=>{ M.save('hijriTypeOv', t || null); fire(); draw(); }),
      noteEl);
    draw();
    M.sheet({title:'ضبط التاريخ الهجري', content:c, onClose:()=>{ fire(); S.y = th.y; S.m = th.m; S.selM = null; paint(); }});
  }
  function monthOv(y, m){
    const k = y+'-'+m, cur = +(M.cfg.hijriMonthOv || {})[k] || 0;
    const set = v=>{ const o = Object.assign({}, M.cfg.hijriMonthOv || {}); v = Math.max(-3, Math.min(3, v)); if(v) o[k] = v; else delete o[k]; M.save('hijriMonthOv', o); fire(); const t = M.hijri(today); th.y = t.y; th.m = t.m; th.d = t.d; paint(); };
    return h('div.card.pad.hj-mov', h('div.bold', 'بداية هذا الشهر (حسب الرؤية)'), h('div.small.muted', 'إن أُعلن أن '+M.HMONTHS[m - 1]+' بدأ في يوم غير المحسوب، قدِّم بدايته أو أخِّرها. يؤثر على هذا الشهر فقط.'),
      h('div.row-flex', {style:'justify-content:center;gap:16px;margin-top:10px'}, h('button.icon-btn.tonal', {'aria-label':'بداية أبكر', onclick:()=>set(cur - 1)}, M.ic('minus')), h('div.adj-v.num', cur ? signed(cur)+' يوم' : 'بلا تعديل'), h('button.icon-btn.tonal', {'aria-label':'بداية أبعد', onclick:()=>set(cur + 1)}, M.ic('plus'))),
      cur ? h('button.btn.tonal.sm', {style:'margin-top:10px', onclick:()=>set(0)}, 'إعادة للحساب') : null);
  }

  function conv(el){
    const out = h('div.conv-out');
    // three pickers per date (day / month / year) instead of the system date field: same look and same digits everywhere
    const now0 = new Date(); now0.setHours(12);
    const opt = (v, label, sel)=>h('option', {value:v, selected:sel}, label);
    const range = (a, b)=>{ const r = []; for(let i = a; i <= b; i++) r.push(i); return r; };
    const gd = h('select.field', {'aria-label':'اليوم'}, ...range(1, 31).map(i=>opt(i, M.n(i), i === now0.getDate())));
    const gm = h('select.field', {'aria-label':'الشهر'}, ...M.GMONTHS.map((n, i)=>opt(i, n, i === now0.getMonth())));
    const gy = h('select.field', {'aria-label':'السنة'}, ...range(1900, 2100).map(i=>opt(i, M.n(i), i === now0.getFullYear())));
    const hd = h('select.field', {'aria-label':'اليوم'}, ...range(1, 30).map(i=>opt(i, M.n(i), i === th.d)));
    const hm = h('select.field', {'aria-label':'الشهر'}, ...M.HMONTHS.map((n, i)=>opt(i + 1, n, i + 1 === th.m)));
    const hy = h('select.field', {'aria-label':'السنة'}, ...range(1318, 1524).map(i=>opt(i, M.n(i), i === th.y)));
    const gOut = h('div.cv-out'), hOut = h('div.cv-out');
    function g2h(){
      const y = +gy.value, m = +gm.value, last = new Date(y, m + 1, 0).getDate(), dd = Math.min(+gd.value, last);
      if(dd !== +gd.value) gd.value = dd;
      const d = new Date(y, m, dd, 12), hj = M.hijri(d);
      gOut.replaceChildren(h('div.small.muted', 'يوافق بالهجري'), h('div.title-font.bold.cv-res', M.WEEKDAYS[d.getDay()]+' '+M.fmtHijri(hj)));
    }
    function h2g(){
      const g = M.hijriToGreg(+hy.value, +hm.value, +hd.value);
      hOut.replaceChildren(h('div.small.muted', 'يوافق بالميلادي'), h('div.title-font.bold.cv-res', M.WEEKDAYS[g.getDay()]+' '+M.n(g.getDate())+' '+M.GMONTHS[g.getMonth()]+' '+M.n(g.getFullYear())));
    }
    [gd, gm, gy].forEach(x=>x.addEventListener('change', g2h)); [hd, hm, hy].forEach(x=>x.addEventListener('change', h2g));
    const lab = (t, f)=>h('label.cv-f', h('span.small.muted', t), f);
    el.append(
      h('div.card.pad.cv-card', h('div.bold', 'من ميلادي إلى هجري'), h('div.cv-grid', lab('اليوم', gd), lab('الشهر', gm), lab('السنة', gy)), gOut),
      h('div.card.pad.cv-card', h('div.bold', 'من هجري إلى ميلادي'), h('div.cv-grid', lab('اليوم', hd), lab('الشهر', hm), lab('السنة', hy)), hOut),
      h('div.small.muted', {style:'margin:10px 4px;line-height:1.8'}, 'التحويل يتبع إعدادات بلدك وضبطك اليدوي، وقد يختلف يومًا عن إعلان رؤية الهلال الرسمي.'));
    h2g();
    g2h();
  }
  function occ(el){
    const rows = []; const t0 = new Date(today);
    for(let i = 0; i < 380; i++){
      const d = M.addDays(t0, i), hj = M.hijri(d);
      M.occasionsOn(d, hj).filter(o=>!o.minor && !/الأيام البيض/.test(o.t)).forEach(o=>rows.push({d, hj, t:o.t, i}));
    }
    if(!rows.length) el.append(h('div.empty', 'لا مناسبات'));
    const list = h('div.occ-list');
    rows.slice(0, 40).forEach(r=>{
      const rel = r.i === 0 ? 'اليوم' : r.i === 1 ? 'غدًا' : M.cnt(r.i, 'يوم'), can = M.occasionKey && M.occasionKey(r.t);
      list.append(h(can ? 'button.occ-it' : 'div.occ-it', can ? {onclick:()=>M.openOccasion(r)} : null,
        h('span.occ-ic', M.ic(M.occasionIcon ? M.occasionIcon(r.t) : 's:calendar')),
        h('div.occ-tx', h('div.occ-t', r.t), h('div.occ-s', M.fmtHijri(r.hj)+' • '+M.n(r.d.getDate())+' '+M.GMONTHS[r.d.getMonth()]+' '+M.n(r.d.getFullYear()))),
        h('div.occ-d.num', rel), can ? h('span.occ-go', M.ic('back')) : null));
    });
    el.append(list);
  }
  paint();
  return view;
};
})();
