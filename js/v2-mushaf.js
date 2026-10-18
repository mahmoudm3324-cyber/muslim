/* ===== v2 mushaf: page-curl engine, mushaf editions screen, tajweed colour legend ===== */
(function(){
'use strict';
const M = window.M, h = M.h;

/* ------------------------------------------------------------------ */
/* 1) PAGE CURL (paper peeled from the free edge, backside visible)    */
/*    geometry: the fold is a straight line n·p = d. The lifted part   */
/*    (n·p < d) is mirrored across it (flap, shows the back of the     */
/*    sheet faintly), the rest keeps its place. The page underneath    */
/*    shows through where the sheet was lifted. All CSS (clip-path +   */
/*    matrix + gradients): no canvas, no per-frame layout.             */
/* ------------------------------------------------------------------ */
const reduced = ()=>{ try{ const d = document.documentElement.dataset; return matchMedia('(prefers-reduced-motion:reduce)').matches || d.fx === 'low' || d.anim === 'off'; }catch(e){ return false; } };
const clamp = (v, a, b)=>Math.max(a, Math.min(b, v));
const px = n=>(Math.round(n * 10) / 10)+'px';
const EMPTY = 'polygon(0 0,0 0,0 0)';
const poly = pts=>pts.length < 3 ? EMPTY : 'polygon('+pts.map(p=>px(p[0])+' '+px(p[1])).join(',')+')';
/* Sutherland–Hodgman against the half-plane  n·p < d  (less) or  n·p >= d */
function clipHalf(pts, nx, ny, d, less){
  const out = [], n = pts.length, sd = p=>(less ? d - (nx * p[0] + ny * p[1]) : (nx * p[0] + ny * p[1]) - d);
  for(let i = 0; i < n; i++){
    const a = pts[i], b = pts[(i + 1) % n], da = sd(a), db = sd(b);
    if(da >= 0) out.push(a);
    if((da >= 0) !== (db >= 0)){ const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
/* css linear-gradient along direction v whose zero is the fold line; stops are [px-from-fold, colour] */
function grad(vx, vy, W, H, P0x, P0y, stops){
  const th = Math.atan2(vx, -vy), Lg = Math.abs(W * Math.sin(th)) + Math.abs(H * Math.cos(th));
  const s0 = Lg / 2 + ((P0x - W / 2) * vx + (P0y - H / 2) * vy);
  return 'linear-gradient('+(th * 180 / Math.PI).toFixed(2)+'deg,'+stops.map(([o, c])=>c+' '+px(s0 + o)).join(',')+')';
}

function make(track, slides, getL){
  let dir = 1, t = 0, alpha = 0, yA = 0, raf = 0, pend = null, anim = 0;
  let top = null, under = null, fw = null, fi = null, fc = null, fo = null, shU = null, ov = null;
  const api = {active:false, get dir(){ return dir; }};
  const L = ()=>getL() || {W:360, H:640};

  function cleanup(){
    cancelAnimationFrame(raf); raf = 0; pend = null; cancelAnimationFrame(anim); anim = 0;
    [fw, shU, ov].forEach(e=>{ if(e && e.parentNode) e.parentNode.removeChild(e); });
    if(top){ top.style.clipPath = ''; top.style.background = ''; top.style.zIndex = ''; }
    if(under){ under.style.zIndex = ''; under.style.background = ''; }
    Object.values(slides).forEach(s=>{ s.style.visibility = ''; s.style.transition = 'none'; });
    top = under = fw = fi = fc = fo = shU = ov = null; api.active = false;
  }
  api.start = function(d, y, dy0){
    cleanup(); const {W, H} = L();
    dir = d; yA = clamp(y == null ? H * .7 : y, H * .12, H * .94); api.active = true;
    top = d > 0 ? slides.cur : slides.prev; under = d > 0 ? slides.next : slides.cur;
    Object.values(slides).forEach(s=>{ s.style.transition = 'none'; s.style.transform = 'translate3d(0,0,0)'; s.style.visibility = 'hidden'; s.style.zIndex = 0; });
    under.style.visibility = 'visible'; under.style.zIndex = 1; under.style.background = 'var(--rt-bg)';
    top.style.visibility = 'visible'; top.style.zIndex = 3; top.style.background = 'var(--rt-bg)';
    shU = h('div.mfc-sh'); ov = h('div.mfc-ov'); top.append(ov);
    fo = h('div.mfc-fo');
    fc = h('div.mfc-fc'); const pg = top.firstChild; if(pg && pg.cloneNode){ const cl = pg.cloneNode(true); cl.removeAttribute('id'); cl.setAttribute('aria-hidden', 'true'); fc.append(cl); }
    fi = h('div.mfc-fi', {style:'width:'+W+'px;height:'+H+'px'}, fc, fo);
    fw = h('div.mfc-fw', {style:'width:'+W+'px;height:'+H+'px'}, fi);
    track.append(shU, fw);
    alpha = clamp(Math.atan2((dy0 || 0) * .6, 90), -.45, .45);
    t = d > 0 ? 0 : 1;
    render();
    return api;
  };
  function render(){
    if(!api.active) return;
    const {W, H} = L();
    const nx = Math.cos(alpha), ny = Math.sin(alpha);
    const dots = [0, W * nx, W * nx + H * ny, H * ny], dMin = Math.min(...dots), dMax = Math.max(...dots);
    const d = dMin + clamp(t, 0, 1) * (dMax - dMin);
    const box = [[0, 0], [W, 0], [W, H], [0, H]];
    const Lp = clipHalf(box, nx, ny, d, true), Fp = clipHalf(box, nx, ny, d, false);
    top.style.clipPath = poly(Fp);
    const has = Lp.length >= 3 && t > .002 && t < .998 || (Lp.length >= 3 && t >= .998);
    fw.style.display = Lp.length >= 3 && t > .002 ? '' : 'none';
    shU.style.display = fw.style.display;
    // reflection across the fold (CSS matrix(a,b,c,d,e,f), origin 0 0)
    fw.style.transform = 'matrix('+(1 - 2 * nx * nx).toFixed(5)+','+(-2 * nx * ny).toFixed(5)+','+(-2 * nx * ny).toFixed(5)+','+(1 - 2 * ny * ny).toFixed(5)+','+(2 * d * nx).toFixed(2)+','+(2 * d * ny).toFixed(2)+')';
    fi.style.clipPath = poly(Lp);
    const P0x = nx * d, P0y = ny * d;
    const k = Math.min(1, Math.max(.25, 1 - Math.abs(t - .5) * .5));
    fo.style.background = grad(-nx, -ny, W, H, P0x, P0y, [[0, 'rgba(0,0,0,.34)'], [9, 'rgba(255,255,255,.26)'], [46, 'rgba(255,255,255,0)'], [W * 2, 'rgba(0,0,0,.1)']]);
    ov.style.background = grad(nx, ny, W, H, P0x, P0y, [[0, 'rgba(0,0,0,'+(.36 * k).toFixed(2)+')'], [22, 'rgba(0,0,0,'+(.13 * k).toFixed(2)+')'], [84, 'rgba(0,0,0,0)']]);
    shU.style.clipPath = poly(Lp);
    shU.style.background = grad(-nx, -ny, W, H, P0x, P0y, [[0, 'rgba(0,0,0,.32)'], [40, 'rgba(0,0,0,.1)'], [110, 'rgba(0,0,0,0)']]);
  }
  const sched = ()=>{ if(raf) return; raf = requestAnimationFrame(()=>{ raf = 0; render(); }); };
  api.drag = function(dx, dy){
    if(!api.active) return;
    const {W} = L();
    t = dir > 0 ? clamp(dx / (1.7 * W), 0, 1) : clamp(1 - (-dx) / W, 0, 1);
    alpha = clamp(Math.atan2(dy * .6, Math.max(Math.abs(dx), 80)), -.45, .45);
    sched();
  };
  /* settle: go = complete the turn, else spring back */
  api.finish = function(go, cb, vel){
    if(!api.active){ cb && cb(); return; }
    cancelAnimationFrame(raf); raf = 0;
    const t0 = t, t1 = go ? (dir > 0 ? 1 : 0) : (dir > 0 ? 0 : 1), a0 = alpha;
    const dist = Math.abs(t1 - t0), dur = clamp(160 + dist * 360 - Math.min(160, Math.abs(vel || 0) * 70), 150, 520);
    const ts = performance.now(); const ease = x=>1 - Math.pow(1 - x, 3);
    const step = now=>{
      const x = clamp((now - ts) / dur, 0, 1), e = ease(x);
      t = t0 + (t1 - t0) * e; alpha = a0 * (1 - .7 * e); render();
      if(x < 1) anim = requestAnimationFrame(step); else { anim = 0; cb && cb(); }
    };
    anim = requestAnimationFrame(step);
  };
  /* programmatic turn (buttons / keys): a gentle diagonal peel */
  api.auto = function(d, cb){ api.start(d, L().H * (.6 + Math.random() * .3), (Math.random() - .5) * 140); api.finish(true, cb, 0); };
  api.stop = cleanup;
  api.destroy = cleanup;
  return api;
}
M.mushafCurl = {make, enabled:()=>!reduced()};

/* ------------------------------------------------------------------ */
/* 2) MUSHAF EDITIONS SCREEN                                           */
/* ------------------------------------------------------------------ */
const fmtMB = b=>b >= 1048576 ? M.n((b / 1048576).toFixed(b >= 10485760 ? 0 : 1).replace('.', '٫'))+' م.ب' : b > 0 ? M.n(Math.max(1, Math.round(b / 1024)))+' ك.ب' : '٠';
const EDS = [
  {id:'k41c', name:'مصحف المدينة ١٤٤١هـ بالتلوين', desc:'طبعة مجمّع الملك فهد (الخط العثماني للخطاط عثمان طه) بألوان أحكام التجويد، وتتكيّف ألوانها مع المظهر الليلي.', cover:['#1f7a4d', '#0f3d2a'], ring:'#e0c070'},
  {id:'k41p', name:'مصحف المدينة ١٤٤١هـ بدون تلوين', desc:'الطبعة نفسها بحبر واحد هادئ، وهي الطبعة الافتراضية للتطبيق.', cover:['#b08a35', '#6e5518'], ring:'#fff3cf'},
  {id:'k05', name:'مصحف المدينة ١٤٠٥هـ', desc:'الطبعة التاريخية لمجمّع الملك فهد بخط QCF الإصدار الأول؛ توزيع الأسطر فيها يختلف قليلًا عن طبعة ١٤٤١هـ.', cover:['#7a2233', '#3d0f1a'], ring:'#e8c9a0'},
  {id:'text', name:'النص العثماني (تمرير طولي)', desc:'آيات المصحف بالرسم العثماني برواية حفص عن عاصم في قائمة تمرير طويلة مع الترجمة والنقل الحرفي. لا يحتاج تنزيلًا إضافيًا.', cover:['#33475b', '#16202b'], ring:'#cfd8e3'}
];
const modeOf = ()=>M.cfg.readMode === 'scroll' ? 'text' : (M.qcf.ED[M.cfg.mfEd] ? M.cfg.mfEd : 'k41p');

function thumb(ed){
  const box = h('div.mf-th', {style:'--c1:'+ed.cover[0]+';--c2:'+ed.cover[1]+';--rg:'+ed.ring}, h('div.mf-pg', h('span.mf-orn', M.ic('s:mushaf'))));
  if(ed.id === 'text'){ box.firstChild.replaceChildren(h('div.mf-tx.qfont', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')); return box; }
  (async()=>{
    try{
      await M.qcf.load(); if(ed.id !== 'k41p') await M.qcf.loadEd();
      const pg = M.qcf.edPage(1, ed.id), key = pg[0];
      if(!await M.qcf.ensure(key)) return;
      const rows = pg[1].filter(l=>l[0] === 'w'); let mx = 1; rows.forEach(l=>{ if(l[1] > mx) mx = l[1]; });
      const fs = 56 / Math.max(mx, 8), p = box.firstChild; p.replaceChildren();
      rows.forEach(l=>{ const r = h('div.mf-ln'+(ed.id === 'k41c' ? '.qcc' : ''), {style:'font-family:'+M.qcf.fam(key)+';font-size:'+fs.toFixed(2)+'px'}); l[2].forEach(w=>r.append(h('span', w[0]))); p.append(r); });
    }catch(e){}
  })();
  return box;
}

M.openMushafEditions = function(){
  let busy = null, stop = null;
  const root = h('div.mf');
  const view = M.openView({title:'طبعات المصحف', id:'mushaf_editions', onClose:()=>{ if(stop) stop.stop = true; off(); }, build:b=>{ b.append(root); }});
  const off = M.on('mf:edition', ()=>{ if(!view.closed) draw(); });
  const stats = {};
  async function refreshStats(){
    for(const e of ['k41c', 'k41p', 'k05']){ if(M.qcf.flags[e] === false) continue; stats[e] = await M.qcf.cacheBytes(e); }
  }
  async function pick(ed){
    try{
      if(ed.id === 'text'){ M.save('readMode', 'scroll'); M.toast('تم اختيار النص العثماني'); }
      else {
        if(ed.id !== 'k41p'){ try{ await M.qcf.loadEd(); }catch(e){ M.toast('تعذّر تحميل بيانات هذه الطبعة — تحقق من الاتصال'); return; } }
        M.qcf.setEdition(ed.id); M.save('readMode', 'pages'); if(ed.id === 'k41c') M.save('mfTaj', true); M.emit('mf:taj');
        M.toast('تم اختيار: '+ed.name);
      }
      draw();
    }catch(e){ M.toast('تعذّر تغيير الطبعة'); }
  }
  async function download(ed, bar, lab, btn){
    if(busy) return; busy = ed.id; stop = {stop:false}; try{ await M.qcf.loadEd(); }catch(e){}
    btn.disabled = true;
    const r = await M.qcf.downloadEd(ed.id, (d, t, bad)=>{ bar.style.width = Math.round(d / t * 100)+'%'; lab.textContent = 'تحميل '+M.n(d)+' / '+M.n(t)+(bad ? ' • تعذّر '+M.n(bad) : ''); }, stop);
    busy = null; stop = null;
    if(view.closed) return;
    M.toast(r.bad ? 'اكتمل مع بعض الإخفاقات — تحقق من الاتصال وأعد المحاولة' : stop && stop.stop ? 'أُوقف التنزيل' : 'تم حفظ الطبعة للقراءة دون اتصال');
    await refreshStats(); draw();
  }
  function card(ed){
    const cur = modeOf() === ed.id, real = ed.id !== 'text', S = stats[ed.id], def = real ? M.qcf.ED[ed.id] : null;
    const full = real && S && S.count >= def.fonts;
    const bar = h('i'), lab = h('div.small.muted.mf-st');
    let status = 'جارٍ الفحص…';
    if(!real) status = 'مضمّن في التطبيق';
    else if(S) status = S.count ? (full ? 'محمّلة بالكامل ✓' : 'محمّل '+M.n(S.count)+' من '+M.n(def.fonts)+' ملفًا') : 'غير محمّلة — تُجلب الصفحات عند التصفح';
    lab.textContent = status;
    if(S && real) bar.style.width = Math.min(100, Math.round(S.count / def.fonts * 100))+'%';
    const selBtn = h('button.btn.sm'+(cur ? '.tonal' : ''), {disabled:cur, onclick:()=>pick(ed)}, cur ? M.ic('check') : null, cur ? 'محدّدة' : 'اختيار');
    const dl = real ? h('button.btn.tonal.sm', {onclick:function(){ download(ed, bar, lab, this); }}, M.ic('download'), full ? 'إعادة التحقق' : 'تنزيل الكل') : null;
    const del = real && S && S.count > 0 ? h('button.btn.ghost.sm', {'aria-label':'حذف الملفات المحمّلة', onclick:async()=>{ if(await M.confirm('حذف ملفات هذه الطبعة المحمّلة؟ ستُجلب الصفحات مجددًا عند الحاجة.', 'حذف')){ await M.qcf.clearEd(ed.id); await refreshStats(); draw(); } }}, M.ic('trash')) : null;
    return h('div.card.mf-c'+(cur ? '.cur' : ''), thumb(ed),
      h('div.mf-b', h('div.mf-n', ed.name), h('div.mf-d', ed.desc),
        h('div.mf-m', h('span.chip', real ? 'الحجم الكامل ≈ '+M.n(def.mb)+' م.ب' : 'بدون تنزيل'), real && S && S.bytes ? h('span.chip', 'المخزّن: '+fmtMB(S.bytes)) : null, cur ? h('span.chip.mf-on', 'مستخدمة الآن') : null),
        real ? h('div.dl-bar', bar) : null, lab,
        h('div.mf-a', selBtn, dl, del)));
  }
  function draw(){
    const list = EDS.filter(e=>e.id !== 'k05' || M.qcf.flags.k05 !== false);
    root.replaceChildren(
      h('div.card.pad.mf-intro', h('div.small', 'اختر طبعة المصحف التي تُعرض بها الصفحات. تُحمَّل خطوط الصفحات عند التصفح (بحجم صغير لكل صفحة) ويمكنك تنزيل الطبعة كاملة للقراءة دون اتصال. الخطوط © مجمّع الملك فهد لطباعة المصحف الشريف.')),
      ...list.map(card),
      h('div.row-flex.gap-s', M.sectionOpen ? h('button.btn.tonal.sm.grow', {onclick:()=>M.mushafTajLegend()}, M.ic('sparkle'), 'دليل ألوان التجويد') : null,
        h('button.btn.tonal.sm.grow', {onclick:()=>M.openReader({})}, M.ic('quran'), 'فتح المصحف')));
  }
  draw(); refreshStats().then(()=>{ if(!view.closed) draw(); });
  return view;
};
M.addSection({id:'mushaf_editions', title:'طبعات المصحف', icon:'s:mushaf', group:'القرآن الكريم', fn:()=>M.openMushafEditions()});

/* ------------------------------------------------------------------ */
/* 3) TAJWEED COLOUR LEGEND                                            */
/* ------------------------------------------------------------------ */
/* colour -> rule, read off the palette of the QCF4 colour fonts and checked against sample words (the font ships no legend) */
M.mushafTajColours = [
  ['#a5a5a5', 'رمادي', 'حرف لا يُنطق: همزة الوصل، ولام «أل» الشمسية، والألف بعد واو الجماعة.'],
  ['#b50000', 'أحمر داكن', 'المدّ اللازم (ست حركات)، مثل: الضَّالِّين، وفواتح السور كـ «الٓمٓ».'],
  ['#f40000', 'أحمر', 'المدّ الواجب المتصل والجائز المنفصل (أربع أو خمس حركات).'],
  ['#ff7b00', 'برتقالي', 'المدّ الطبيعي (حركتان) في الغالب.'],
  ['#09b000', 'أخضر', 'الغنّة: النون والميم المشدّدتان والإخفاء والإدغام بغنّة.'],
  ['#2fadff', 'أزرق سماوي', 'القلقلة: حروف (قطب جد) إذا سكنت.'],
  ['#ce9e00', 'ألوان أخرى', 'درجات الذهبي والأزرق تشير إلى أحكام أخرى من المدّ والإخفاء والإدغام؛ تفصيلها في باب أحكام التجويد.']
];
M.mushafTajLegend = function(){
  const LG = M.mushafTajColours || [];
  const body = h('div.col-flex', h('div.small.muted', 'تظهر هذه الألوان في طبعة «مصحف المدينة ١٤٤١هـ بالتلوين». هذا ملخّص مختصر؛ التفصيل في باب أحكام التجويد.'),
    h('div.mf-lg', ...LG.map(([c, n, d])=>h('div.mf-lr', h('i', {style:'background:'+c}), h('div', h('b', n), h('div.small.muted', d))))),
    M.sectionOpen ? h('button.btn.tonal.block', {onclick:()=>{ sh.close(); M.sectionOpen('tajweed'); }}, M.ic('s:tafsir'), 'أحكام التجويد') : null);
  const sh = M.sheet({title:'ألوان التجويد', content:body}); sh.el.style.maxHeight = '88%';
};
})();
