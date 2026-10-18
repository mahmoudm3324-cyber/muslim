/* ===== القمر: a real, textured moon you drag to move through the phases + facts, next phases and the month's "manazil" ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const SYN = 29.530588853, TAU = Math.PI * 2;
const jdOf = d=>d.getTime() / 864e5 + 2440587.5;
const dayName = (d)=>M.n(d.getDate())+' '+M.GMONTHS[d.getMonth()];

/* distance (km), Meeus ch.47 main terms */
function moonDist(d){
  const T = (jdOf(d) - 2451545) / 36525, r = Math.PI / 180;
  const D = (297.8501921 + 445267.1114034 * T) * r, Mp = (134.9633964 + 477198.8675055 * T) * r;
  return 385000.56 - 20905.355 * Math.cos(Mp) - 3699.111 * Math.cos(2 * D - Mp) - 2955.968 * Math.cos(2 * D) - 569.925 * Math.cos(2 * Mp);
}
/* next dates of the four principal phases, soonest first */
function nextPhases(from){
  const a = M.moonAge(from), out = [];
  [[0.25, 'تربيع أول', 0.25], [0.5, 'بدر', 0.5], [0.75, 'تربيع ثانٍ', 0.75], [0, 'مُحاق', 0.0]].forEach(([t, n, ph])=>{
    let dd = ((t - a) % 1 + 1) % 1; if(dd < 0.004) dd += 1;
    out.push({n, ph, at:new Date(from.getTime() + dd * SYN * 864e5), dd});
  });
  return out.sort((x, y)=>x.dd - y.dd);
}
/* the days of the current hijri month with the moon's phase on each */
function monthDays(now, hj){
  const out = [], noon = x=>{ const d = new Date(x); d.setHours(22, 0, 0, 0); return d; };
  const start = new Date(now); start.setDate(start.getDate() - (hj.d - 1));
  for(let i = 0; i < 31; i++){
    const d = new Date(start); d.setDate(start.getDate() + i);
    const hh = M.hijri(d); if(hh.m !== hj.m) break;
    out.push({d:hh.d, a:M.moonAge(noon(d))});
  }
  return out;
}

/* ---- the textured sphere ---- */
let TEX = null, TEXP = null;
function loadTex(){
  if(TEXP) return TEXP;
  TEXP = new Promise(res=>{
    const im = new Image(); im.onload = ()=>{ try{ const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0); TEX = {w:c.width, h:c.height, d:x.getImageData(0, 0, c.width, c.height).data}; }catch(e){ TEX = null; } res(); };
    im.onerror = ()=>res(); im.src = 'img/moon.jpg';
  });
  return TEXP;
}
function makeSphere(cv, size){
  const dpr = Math.min(2, window.devicePixelRatio || 1), S = Math.round(size * dpr);
  cv.width = S; cv.height = S; cv.style.width = size+'px'; cv.style.height = size+'px';
  const ctx = cv.getContext('2d'), img = ctx.createImageData(S, S), R = S / 2 - 1;
  const n = S * S, nx = new Float32Array(n), nz = new Float32Array(n), lum = new Float32Array(n), cr = new Float32Array(n), cg = new Float32Array(n), cb = new Float32Array(n), inside = new Uint8Array(n), edge = new Float32Array(n);
  for(let y = 0; y < S; y++) for(let x = 0; x < S; x++){
    const i = y * S + x, px = (x + 0.5 - S / 2) / R, py = -(y + 0.5 - S / 2) / R, rr = px * px + py * py;
    if(rr > 1) continue; inside[i] = 1; const pz = Math.sqrt(1 - rr);
    nx[i] = px; nz[i] = pz; edge[i] = Math.min(1, (1 - Math.sqrt(rr)) * R / 1.6); // antialiased rim
    let r = 0.62, g = 0.62, b = 0.6;
    if(TEX){
      const lon = Math.atan2(px, pz), lat = Math.asin(py), u = 0.5 + lon / TAU, v = 0.5 - lat / Math.PI;
      const tx = Math.min(TEX.w - 1, Math.max(0, Math.floor(u * TEX.w))), ty = Math.min(TEX.h - 1, Math.max(0, Math.floor(v * TEX.h))), k = (ty * TEX.w + tx) * 4;
      r = TEX.d[k] / 255; g = TEX.d[k + 1] / 255; b = TEX.d[k + 2] / 255;
    }
    cr[i] = r; cg[i] = g; cb[i] = b;
  }
  return {
    draw(age, full){
      const sx = Math.sin(age * TAU), sz = -Math.cos(age * TAU), D = img.data;
      for(let i = 0; i < n; i++){
        const o = i * 4; if(!inside[i]){ D[o + 3] = 0; continue; }
        let k;
        if(full) k = 0.92 + 0.08 * nz[i];
        else { const d = nx[i] * sx + nz[i] * sz; k = d <= -0.03 ? 0.035 : d >= 0.1 ? 1 : 0.035 + 0.965 * ((d + 0.03) / 0.13) * ((d + 0.03) / 0.13) * (3 - 2 * (d + 0.03) / 0.13) * 0 + 0.965 * (() => { const t = (d + 0.03) / 0.13; return t * t * (3 - 2 * t); })(); if(d > 0) k *= 0.55 + 0.45 * Math.min(1, d * 1.6 + 0.2); }
        const limb = 0.62 + 0.38 * nz[i], f = k * limb * 1.25;
        D[o] = Math.min(255, cr[i] * 255 * f); D[o + 1] = Math.min(255, cg[i] * 255 * f * 0.99); D[o + 2] = Math.min(255, cb[i] * 255 * f * 0.96); D[o + 3] = Math.round(255 * edge[i]);
      }
      ctx.putImageData(img, 0, 0);
    }
  };
}

function miniMoon(a, size){ return h('span.mn-mini', {html:M.moonSVG(a, size)}); }
const tile = (ic, label, val)=>h('div.mn-tile', h('div.mn-ti', M.ic(ic)), h('div.mn-tt', h('div.mn-tl', label), h('div.mn-tv.num', val)));

M.openMoon = function(){
  const now = new Date(), hj = M.hijri(now), a0 = M.moonAge(now);
  return M.openView({id:'moon', title:'القمر', build:(b, view)=>{
    view.el.classList.add('mn'); b.classList.add('mn-body');
    const stage = h('div.mn-stage'), cv = h('canvas.mn-cv', {'aria-label':'القمر — اسحب لتغيير الطور'}), hint = h('div.mn-hint', M.ic('s:moon'), ' اسحب للدوران ٣٦٠° · انقر مرتين للعودة لليلة');
    stage.append(cv); b.append(stage, hint);
    let age = a0, full = false, sph = null, raf = 0;
    const size = Math.min(300, Math.max(220, Math.round((b.clientWidth || 360) - 60)));
    const paint = ()=>{ raf = 0; if(sph) sph.draw(age, full); };
    const ask = ()=>{ if(!raf) raf = requestAnimationFrame(paint); };
    stage.style.height = (size + 16)+'px'; stage.style.minHeight = '0';
    loadTex().then(()=>{ if(view.closed) return; sph = makeSphere(cv, size); paint(); });
    // drag: one full width of the moon = a quarter turn through the phases
    let px = null, moved = false, lastTap = 0;
    cv.addEventListener('pointerdown', e=>{ px = e.clientX; moved = false; try{ cv.setPointerCapture(e.pointerId); }catch(_){} });
    cv.addEventListener('pointermove', e=>{ if(px == null) return; const dx = e.clientX - px; px = e.clientX; if(Math.abs(dx) > 0) moved = true; age = ((age + dx / (size * 1.6)) % 1 + 1) % 1; ask(); });
    const end = ()=>{ if(px != null && !moved){ const t = Date.now(); if(t - lastTap < 350){ age = a0; ask(); } lastTap = t; } px = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', ()=>{ px = null; });
    cv.style.touchAction = 'none';

    const illum = (1 - Math.cos(a0 * TAU)) / 2;
    b.append(h('div.mn-name.title-font', M.moonName(a0)), h('div.mn-sub', 'الليلة '+M.n(hj.d)+' من '+M.HMONTHS[hj.m - 1]+' '+M.n(hj.y)+' هـ'));
    b.append(M.seg([['night', 'كما يبدو الليلة'], ['full', 'مضاء بالكامل']], 'night', v=>{ full = v === 'full'; ask(); }));
    b.append(h('div.mn-grid',
      tile('s:sun', 'الإضاءة', M.n(Math.round(illum * 100))+'٪'),
      tile('s:clock', 'عمر القمر', M.n((a0 * SYN).toFixed(1))+' يوم'),
      tile('s:ruler' in (M.SICONS || {}) ? 's:ruler' : 's:stats', 'البعد عن الأرض', M.n(Math.round(moonDist(now)).toLocaleString('en'))+' كم'),
      tile('s:moon', 'الاتجاه', a0 < 0.5 ? 'يزداد نورًا' : 'يتناقص نورًا')));

    const nx = nextPhases(now), up = h('div.mn-up');
    nx.forEach(p=>up.append(h('div.mn-ph', miniMoon(p.ph, 44), h('div.mn-pn', p.n), h('div.mn-pd', dayName(p.at)))));
    b.append(h('div.mn-card', h('div.mn-h', 'الأطوار القادمة'), up));

    const days = monthDays(now, hj), row = h('div.mn-days');
    days.forEach(x=>{ const c = h('div.mn-day'+(x.d === hj.d ? '.now' : '')+(x.d >= 13 && x.d <= 15 ? '.white' : ''), miniMoon(x.a, 34), h('div.num', M.n(x.d))); row.append(c); });
    b.append(h('div.mn-card', h('div.mn-h', 'منازل '+M.HMONTHS[hj.m - 1], h('span.mn-leg', h('i'), 'الأيام البيض')), row));
    setTimeout(()=>{ const n = row.querySelector('.now'); if(n) row.scrollLeft = n.offsetLeft - row.clientWidth / 2 + n.clientWidth / 2; }, 60);

    b.append(h('div.mn-card.mn-verse', h('div.mn-v.qfont', 'وَالْقَمَرَ قَدَّرْنَاهُ مَنَازِلَ حَتَّىٰ عَادَ كَالْعُرْجُونِ الْقَدِيمِ'), h('div.mn-vr', 'يس ٣٩'),
      h('div.mn-vt', 'يدور القمر حول الأرض كل ٢٩٫٥ يومًا تقريبًا، وعليه تُبنى الشهور الهجرية: يبدأ الشهر برؤية الهلال، ويكتمل بدرًا قرب ليلة الرابع عشر، ويُسنّ صيام الأيام البيض ١٣ و١٤ و١٥.')));
    b.append(h('div.row-flex.gap-s', {style:'margin:6px 0 4px'}, h('button.btn.tonal.sm.grow', {onclick:()=>M.openSub('widgets')}, 'ودجت طور القمر'), h('button.btn.tonal.sm.grow', {onclick:()=>M.openCalendar ? M.openCalendar() : 0}, 'التقويم الهجري')));
    b.append(h('div.tiny.mn-note', 'الحساب فلكي تقريبي؛ رؤية الهلال الشرعية هي المعتمدة في بدء الشهور. صورة القمر: ناسا.'));
  }});
};
})();
