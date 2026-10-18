/* ===== Moon phases ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const SYN = 29.530588853;
M.moonAge = function(d){
  const jd = d.getTime() / 864e5 + 2440587.5;
  let a = ((jd - 2451550.1) / SYN) % 1; if(a < 0) a += 1; return a; // 0 new … .5 full
};
const NAMES = [[0.03, 'المحاق'], [0.22, 'هلال متزايد'], [0.28, 'التربيع الأول'], [0.47, 'أحدب متزايد'], [0.53, 'البدر'], [0.72, 'أحدب متناقص'], [0.78, 'التربيع الأخير'], [0.97, 'هلال متناقص'], [1.01, 'المحاق']];
M.moonName = a=>NAMES.find(x=>a < x[0])[1];
M.moonSVG = function(a, size){
  size = size || 160; const r = size / 2 - 4, c = size / 2;
  const illum = (1 - Math.cos(a * 2 * Math.PI)) / 2; // 0..1
  const waxing = a < 0.5;
  // terminator ellipse rx
  const k = Math.cos(a * 2 * Math.PI); // 1 new … -1 full
  const rx = Math.abs(k) * r;
  const lit = '#f6edc8', dark = '#1c2740';
  // path: lit half-circle on the right (waxing, Northern hemisphere view) + ellipse
  const side = waxing ? 1 : -1;
  const sweepOuter = waxing ? 1 : 0;
  const crescent = k > 0; // less than half lit
  const d = `M ${c} ${c - r} A ${r} ${r} 0 0 ${sweepOuter} ${c} ${c + r} A ${rx} ${r} 0 0 ${crescent ? sweepOuter ^ 1 : sweepOuter} ${c} ${c - r} Z`;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${c}" cy="${c}" r="${r}" fill="${dark}" stroke="#34415f" stroke-width="2"/><path d="${d}" fill="${lit}"/></svg>`;
};
M.openMoon = function(){
  const now = new Date(), hj = M.hijri(now), a = M.moonAge(now);
  const sh = M.openView({id:'moon', title:'القمر والتقويم الهجري', build:b=>{
    b.append(h('div.card.pad.moon-card', h('div.row-flex', h('div.grow', h('div.title-font', {style:'font-size:2rem;font-weight:800'}, M.WEEKDAYS[now.getDay()]), h('div.small', M.n(now.getDate())+' '+M.GMONTHS[now.getMonth()]+' '+M.n(now.getFullYear())), h('div.small', M.n(hj.d)+' '+M.HMONTHS[hj.m - 1]+' '+M.n(hj.y))),
      h('div', {html:M.moonSVG(a, 120)})), h('div.title-font', {style:'font-size:1.6rem;margin-top:10px'}, M.moonName(a)), h('div.row-flex', {style:'align-items:center'}, h('div.small.grow', 'مُضاء نحو '+M.n(Math.round((1 - Math.cos(a * 2 * Math.PI)) / 2 * 100))+'٪'), h('button.btn.tonal.sm', {'aria-label':'ودجت طور القمر للشاشة الرئيسية', onclick:()=>M.openSub('widgets')}, 'ودجت'))));
    b.append(h('div.bold', {style:'margin:14px 0 6px'}, 'اليوم '+M.n(hj.d)+' من الشهر الهجري'));
    b.append(h('div.small.muted', {style:'line-height:1.9'}, a < 0.5 ? 'القمر في طور التزايد؛ يزداد الضوء حتى يكتمل بدرًا في منتصف الشهر تقريبًا.' : 'القمر في طور التناقص؛ يقلّ الضوء حتى المحاق في آخر الشهر.'));
    b.append(h('div.section-h', 'أطوار القمر خلال الشهر'), h('div.small.muted', 'أيام تقريبية من الشهر الهجري'));
    const ph = [[0.04, 'الهلال المتزايد', '١–٦'], [0.25, 'التربيع الأول', '٧–٩'], [0.4, 'الأحدب المتزايد', '١٠–١٢'], [0.5, 'البدر', '١٣–١٦'], [0.6, 'الأحدب المتناقص', '١٧–٢١'], [0.75, 'التربيع الأخير', '٢٢–٢٣'], [0.9, 'الهلال المتناقص', '٢٤–٢٨'], [0, 'المحاق', '٢٩–٣٠']];
    const g = h('div.moon-grid'); ph.forEach(([x, n, d])=>g.append(h('div.card.pad.moon-ph', h('div', {html:M.moonSVG(x, 52)}), h('div.small.bold', n), h('div.tiny.muted', d+' أيام'))));
    b.append(g, h('div.tiny.muted', {style:'margin-top:10px;line-height:1.8'}, 'الحساب فلكي تقريبي؛ رؤية الهلال الشرعية هي المعتمدة في بدء الشهور.'));
  }});
};
})();
