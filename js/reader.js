/* ===== Mushaf reader: page pager (Madani 15-line layout) + vertical scroll mode ===== */
(function(){
'use strict';
const M = window.M, h = M.h, arNum = M.arNum, P = M.player;

const KEY = (s, a)=>s+':'+a;
const FRAMES = ['green', 'blue', 'maroon', 'red', 'gold', 'mint', 'black'];
/* the page frame, the surah-name banner and the page-number medallion share one colour */
const F2B = {gold:'gold', green:'green', mint:'mint', blue:'blue', maroon:'maroon', red:'wine', black:'ink'}, B2F = {gold:'gold', green:'green', mint:'mint', blue:'blue', maroon:'maroon', wine:'red', ink:'black'};
const bannerKey = ()=>{ const f = frameKey(); return f !== 'none' && F2B[f] && M.cfg.qSurahFrame !== 'ink' ? F2B[f] : (M.cfg.qSurahFrame || 'green'); };
const frameKey = ()=>{ const f = M.cfg.qFrame; return f === 'none' ? 'none' : FRAMES.includes(f) ? f : 'gold'; };
const bmSet = ()=>{ const set = new Map(); M.QD.bookmarks.forEach(b=>{ if(b.sura) set.set(KEY(b.sura, b.ayah), b.color || ''); }); return set; };   // key -> separator colour ('' = plain bookmark)

M.openReader = async function(opts){
  opts = opts || {};
  if(M.views.some(v=>v.el.id === 'view-reader')) M.views.filter(v=>v.el.id === 'view-reader').forEach(v=>v.close());
  const R = {mode:opts.mode || M.cfg.readMode, page:1, sel:null, imm:false, sc:null, pager:null, suppress:false, long:null};
  M.readerR = R;     // the iPhone's native page turns through it (v2-native.js)
  document.documentElement.classList.add('in-reader');
  let ro = null;
  const view = M.openView({id:'reader', noHead:true, nopad:true, bg:'transparent', onClose:()=>{ document.documentElement.classList.remove('in-reader'); off.forEach(f=>f()); ro && ro.disconnect(); M.bgScopeApply(); }});
  view.body.style.cssText = 'overflow:hidden;padding:0';
  const off = [];
  const root = h('div.reader', {dataset:{rt:M.cfg.qTheme || 'auto', fr:frameKey(), sf:bannerKey(), taj:M.cfg.mfTaj === false ? 'off' : 'on'}});
  view.body.append(root);
  const main = h('div.rd-main');
  const titleEl = h('div.rd-title'), subEl = h('div.rd-sub');
  const bmBtn = h('button.icon-btn', {'aria-label':'علامة الصفحة', onclick:()=>togglePageBm()}, M.ic('bookmark'));
  const modeBtn = h('button.icon-btn', {'aria-label':'وضع القراءة', onclick:()=>switchMode()});
  const moreBtn = h('button.icon-btn', {'aria-label':'المزيد', onclick:()=>moreSheet()}, M.ic('grid'));
  const top = h('div.rd-top',
    h('button.icon-btn', {'aria-label':'رجوع', onclick:()=>view.close()}, M.ic('back')),
    h('button.rd-tb.grow', {onclick:()=>jumpSheet()}, titleEl, subEl),
    h('button.icon-btn.rd-play', {'aria-label':'تشغيل التلاوة', onclick:()=>startAudio()}, M.ic('play')),
    bmBtn, moreBtn);
  const bar = h('div.rd-bar.hide');
  root.append(main, top, bar);
  function setModeIcon(){ modeBtn.innerHTML = M.icon(R.mode === 'pages' ? 'scroll' : 'pages'); }
  setModeIcon();
  const progress = h('div.rd-prog', h('i')); root.append(progress);
  const setProg = p=>{ progress.firstChild.style.width = (p / 604 * 100).toFixed(2)+'%'; };

  try{ await M.loadQuran(); }catch(e){ M.toast('تعذّر تحميل المصحف'); view.close(); return view; }
  try{ await M.qcf.load(); }catch(e){}
  if(view.closed) return view;   // closed while loading
  const Q = M.Q;
  const EP = p=>M.qcf.edPage(p);          // page structure of the selected mushaf edition
  const PO = (sa, ay)=>M.qcf.pageOf(sa, ay), PS = p=>M.qcf.pageStart(p) || M.Q.pageStart[p], PSU = p=>M.qcf.pageSurahs(p);
  const edKind = ()=>M.qcf.ED[M.qcf.edId()].kind;
  // ---- starting position ----
  const last = M.QD.last;
  let startS = opts.sura, startA = opts.ayah || 1, startPage = opts.page;
  if(!startPage && startS) startPage = PO(startS, startA);
  if(!startPage){ startPage = last.page || 1; startS = last.sura; startA = last.ayah; }
  if(opts.select && startS) R.sel = KEY(startS, startA);

  /* ---- layout vars via ResizeObserver ---- */
  let layout = {W:360, H:640};
  ro = new ResizeObserver(()=>doLayout());
  ro.observe(main);
  function doLayout(){
    const W0 = main.clientWidth, H = main.clientHeight; if(!W0) return;
    /* 4.5: a computer, a tablet, a phone on its side: the page keeps a Mushaf page's proportions in the middle of the screen
       (it used to stretch to the whole width, and the lines piled on each other) */
    const PR = 0.62, PW1 = Math.round(H * PR), wide = W0 > PW1 + 8;
    /* two pages side by side (a computer, a tablet on its side) when both fit at full height; the reading setting can turn it off */
    /* two pages: on a wide screen when both fit at full height, and on any tablet (upright too) where each page is at least
       as wide as a phone screen */
    const full = W0 >= PW1 * 2 + 24, tablet = W0 >= 680;
    const spread = M.cfg.qSpread !== false && (full || tablet);
    const W = spread ? (full ? Math.min(W0 - 16, PW1 * 2) : W0 - 8) : wide ? PW1 : W0;
    main.classList.toggle('pg-wide', wide || spread); main.classList.toggle('pg-spread', spread); main.style.setProperty('--pgw', W + 'px');
    layout = {W, H, PW:spread ? W / 2 : W, spread};
    const bodyW = W - 34;
    const fs = Math.min(bodyW / 16.6, 46);
    const avail = H - 36 - 40 - 12;
    let pitch = Math.min(avail / 15, fs * 3.2); pitch = Math.max(pitch, fs * 1.75);
    root.style.setProperty('--qfs', fs.toFixed(2)+'px');
    root.style.setProperty('--lh', pitch.toFixed(2)+'px');
    root.style.setProperty('--vfs', (M.cfg.qSize * 1.9).toFixed(2)+'rem');
    if(R.pager) R.pager.relayout();
  }

  /* ---- page builder ---- */
  const juzAr = p=>arNum(M.juzOfPage(p));
  const hizbTxt = p=>{ const q = M.hizbQOfPage(p), n = Math.ceil(q/4), f = ['', '¼', '½', '¾'][(q-1) % 4]; return 'الحزب '+arNum(n)+(f ? ' '+f : ''); };
  function qcfReady(p){
    if(!M.qcf.data) return false;
    if(!EP(p)) return false;
    return M.qcf.needs(p).every(n=>M.qcf.has(n));
  }
  function wantQcf(p){
    if(!M.qcf.data) return;
    if(!EP(p)) return;
    const need = M.qcf.needs(p);
    if(need.every(n=>M.qcf.has(n))) return;
    Promise.all(need.map(n=>M.qcf.ensure(n))).then(r=>{ if(r.every(Boolean) && R.pager) R.pager.rebuild(p); else if(!r.every(Boolean)){ R.qfail = true; if(R.pager) R.pager.rebuild(p); } });
  }
  /* surah name drawn on a canvas: scaled by its real ink box and centred exactly in the cartouche */
  const CART = {green:[.4775,.295], mint:[.5,.337], gold:[.4755,.30], maroon:[.479,.299], wine:[.4995,.347], blue:[.494,.345], ink:[.48,.296]};
  const nameMemo = new Map();
  function nameCanvas(ch, W, H){
    const mk = ch+'|'+W.toFixed(1)+'|'+H.toFixed(1)+'|'+bannerKey(), had = nameMemo.get(mk);
    if(had){ const d = h('div.nm'); d.style.cssText = had; return d; }
    const [cx, sw] = CART[bannerKey()] || CART.green;
    const dpr = Math.min(window.devicePixelRatio || 1, 3), cv = document.createElement('canvas');
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.cssText = 'width:'+W+'px;height:'+H+'px;display:block';
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    c.font = '200px QCF4_QBSML'; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = '#000';
    const m = c.measureText(ch), bl = m.actualBoundingBoxLeft, br = m.actualBoundingBoxRight, asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    const iw = bl + br, ih = asc + desc; if(!iw || !ih) return h('div');
    const sc = Math.min(W * sw * .98 / iw, H * .76 / ih);
    c.font = (200 * sc)+'px QCF4_QBSML';
    const x0 = W * cx - (br - bl) / 2 * sc, y0 = H * .487 + (asc - desc) / 2 * sc;
    c.fillText(ch, x0, y0); c.strokeStyle = '#000'; c.lineWidth = Math.max(.5, H * .012); c.lineJoin = 'round'; c.strokeText(ch, x0, y0);
    const d = h('div.nm'); const u = 'url('+cv.toDataURL('image/png')+')'; d.style.cssText = 'width:'+W+'px;height:'+H+'px;-webkit-mask:'+u+' center/100% 100% no-repeat;mask:'+u+' center/100% 100% no-repeat';
    if(nameMemo.size > 40) nameMemo.delete(nameMemo.keys().next().value);
    nameMemo.set(mk, d.style.cssText);
    return d;
  }
  /* 4.6.2 the Basmala line, as printed in the Madinah Mushaf. The page fonts hold it as one glyph about ten letters wide;
     some font engines (Windows) break a glyph that large — squeezed, doubled, crossed by stray strokes — in the page and on a
     canvas alike. So its outline was taken out of the Mushaf font once (data/bismillah.json, the three Basmala glyphs of the
     QCF4 fonts) and is drawn here as a vector shape, a mask in the page's text colour: the Mushaf's own Basmala, the same on
     every device, at the size the font would give it. */
  let bisData = null, bisLoad = null;
  const bisMemo = new Map();
  const bisGet = ()=>bisLoad || (bisLoad = fetch('data/bismillah.json').then(r=>r.json()).then(j=>(bisData = j)).catch(()=>{ bisLoad = null; return null; }));
  function bisUrl(cp){
    if(bisMemo.has(cp)) return bisMemo.get(cp);
    const g = bisData && (bisData[cp] || bisData.F8D6); if(!g) return null;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + g.x + ' ' + g.y + ' ' + g.w + ' ' + g.h + '"><path transform="scale(1,-1)" d="' + g.d + '"/></svg>';
    const m = {u:'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")', w:g.w / g.upm, h:g.h / g.upm};
    bisMemo.set(cp, m);
    return m;
  }
  /* fs: the font size the page would use for the glyph; H: the line's height; t: the glyph text (its code picks the variant) */
  function bisMask(fs, H, t){
    const cp = t ? (String(t).codePointAt(0) || 0).toString(16).toUpperCase() : 'F8D6';
    const d = h('div.qbm', {'aria-label':'بسم الله الرحمن الرحيم', role:'img'});
    const paint = ()=>{
      const m = bisUrl(cp); if(!m) return;
      const w = m.w * fs, hh = Math.min(H, m.h * fs);
      d.style.cssText = 'width:' + w.toFixed(1) + 'px;max-width:100%;height:' + hh.toFixed(1) + 'px;-webkit-mask:' + m.u + ' center/contain no-repeat;mask:' + m.u + ' center/contain no-repeat';
    };
    d.style.cssText = 'width:60%;height:' + H.toFixed(1) + 'px;background:none';
    if(bisData) paint(); else bisGet().then(paint);
    return d;
  }
  function buildQcfPage(p){
    const pg = EP(p), fn = pg[0], lines = pg[1], kind = edKind();
    const fam = M.qcf.fam(fn);
    /* page geometry. With a frame: the corner ornaments are fc px square; the header and footer sit in the clear
       band between the corners, and the text starts below them, so nothing can touch the frame. */
    const framed = frameKey() !== 'none';
    const PW = layout.PW || layout.W;
    const fc = framed ? Math.max(52, Math.min(66, Math.round(PW * .158))) : 0;
    const side = (framed ? 3 + Math.ceil(fc * .25) + 3 : 12) + (M.cfg.qMar || 0);
    const headH = framed ? 3 + Math.ceil(fc * .74) : 28, footH = framed ? 3 + Math.ceil(fc * .74) : 40;
    const bodyW = PW - side * 2 - (p < 3 ? 22 : 0);
    let mx = 0; lines.forEach(l=>{ if(l[0] === 'w' && l[1] > mx) mx = l[1]; });
    /* page geometry (font size, line pitch, margins) always comes from the default edition's page, so every edition has identical spacing */
    let mxg = 0; ((M.qcf.data && M.qcf.data[p-1]) || pg)[1].forEach(l=>{ if(l[0] === 'w' && l[1] > mxg) mxg = l[1]; });
    const avail = layout.H - headH - footH - 4;
    const fs = Math.min(bodyW / Math.max(mxg, p < 3 ? 13.4 : 16.6), (p < 3 ? avail / 9.4 : avail / 15) / 1.9);   // never taller than its line
    const pitch = p < 3 ? Math.min(avail / 9.4, fs * 3.1) : Math.min(avail / 15, fs * 2.05), bh = pitch * .98;
    const body = h('div.mp-body.qb'+(p < 3 ? '.few' : ''), {style:'--lh:'+pitch.toFixed(2)+'px;--qfs:'+fs.toFixed(2)+'px;--bw:'+bodyW.toFixed(1)+'px'});
    lines.forEach(l=>{
      if(l[0] === 'h'){
        body.append(h('div.ml.qh', {dataset:{s:l[1]}, style:'height:'+bh.toFixed(1)+'px'}, h('div.qbn', nameCanvas(l[2], bodyW, bh))));
      } else if(l[0] === 'b'){
        const bt = Array.isArray(l[1]) ? l[1] : [l[1]], bf = l[3] ? M.qcf.fam(l[3]) : fam;
        const bm = bisMask(fs, bh, bt[0]);   // every edition: the Mushaf's Basmala, drawn safely
        body.append(bm ? h('div.ml.qbis.qbis-m', bm) : h('div.ml.qbis'+(kind === 'c' ? '.qcc' : ''), ...bt.map(t=>h('span', {style:'font-family:'+bf}, t))));
      } else {
        const row = h('div.ml.mw.qw'+(kind === 'c' ? '.qcc' : ''), {style:'font-family:'+fam});
        const full = l[1] / mx >= 0.9;
        row.classList.toggle('short', !full);
        l[2].forEach(w=>{
          const k = KEY(w[1], w[2]);
          if(w[3] === 1) row.append(h('span.qe', {dataset:{k, s:w[1], a:w[2]}}, w[0]));
          else if(w[3] === 2) row.append(h('span.qq', w[0]));
          else row.append(h('span.w', {dataset:{k, s:w[1], a:w[2]}}, w[0]));
        });
        body.append(row);
      }
    });
    const surahs = PSU(p);
    const juz = M.juzOfPage(p);
    return h('div.mpage.qcf'+(p % 2 ? '.odd' : '.even')+(framed ? '.framed' : ''), {dataset:{p}, style:'--fc:'+fc+'px;--side:'+side+'px;--hh:'+headH+'px;--fh:'+footH+'px'},
      framed ? h('div.mp-fr') : null,
      h('div.mp-in',
        h('div.mp-head.qhd', h('span.hd-s.title-font', surahs.map(s=>M.sname(s)).join(' • ')), h('span.hd-m', p % 2 ? 'صفحة يمنى' : 'صفحة يسرى'), h('span.hd-j', 'الجزء '+arNum(juz))),
        body,
        h('div.mp-foot.qft', h('span.ft-h', hizbTxt(p)), h('button.pn', {onclick:()=>jumpSheet(), 'aria-label':'رقم الصفحة'}, arNum(p)), h('span.ft-r', ''))));
  }
  function buildPage(p){
    if(qcfReady(p)) return buildQcfPage(p);
    if(R.qfail){
      return h('div.mpage.qwait', {dataset:{p}}, h('div.qw-c', h('div.qw-t', 'تعذّر تحميل خط هذه الصفحة. يلزم اتصال بالإنترنت أول مرة (يمكنك تحميل المصحف كاملًا من الإعدادات للقراءة دون اتصال).'),
        h('button.btn.sm', {onclick:()=>{ R.qfail = false; if(R.pager) R.pager.rebuild(p); }}, M.ic('refresh'), 'إعادة المحاولة'),
        edKind() !== 'p' ? h('button.btn.sm.tonal', {onclick:()=>{ R.qfail = false; M.qcf.setEdition('k41p'); }}, M.ic('quran'), 'استخدام الطبعة الأساسية') : null));
    }
    wantQcf(p);
    return h('div.mpage.qwait', {dataset:{p}}, h('div.qw-t', 'جارٍ تحميل صفحة المصحف…'));
  }
  // after the page is in DOM, centre short lines (end of surah etc.)
  function finishPage(el){
    if(el.classList.contains('qcf')){
      const body = el.querySelector('.qb'); let mxw = 0;
      el.querySelectorAll('.qw').forEach(r=>{ let w = 0; for(const k of r.children){ if(k.classList.contains('hs')) continue; w += k.getBoundingClientRect().width; } if(!r.classList.contains('short') && w > mxw) mxw = w; });
      const bw = parseFloat(body.style.getPropertyValue('--bw')) || 0, fs0 = parseFloat(body.style.getPropertyValue('--qfs'));
      if(mxw && bw && mxw > bw * 1.001){ body.style.setProperty('--qfs', (fs0 * bw / mxw * .997).toFixed(2)+'px'); }
      applyMarks(el); return;
    }
    applyMarks(el);
  }

  /* ---- pager (RTL: drag right = next page) ---- */
  function makePager(host, startAt){
    const track = h('div.pg-track'); host.append(track);
    const cache = new Map();
    let SPm = !!layout.spread;
    const PG = u=>SPm ? 2 * u - 1 : u, UN = p=>SPm ? Math.ceil(p / 2) : p, MAX = ()=>SPm ? 302 : 604;
    const pagesOf = u=>SPm ? [2 * u - 1, 2 * u].filter(x=>x <= 604) : [u];
    const readyU = u=>pagesOf(u).every(qcfReady);
    const buildUnit = u=>{
      if(!SPm) return buildPage(u);
      const a = 2 * u - 1, b = 2 * u;
      return h('div.mspread', {dataset:{p:a}}, h('div.msp-half.r', buildPage(a)), b <= 604 ? h('div.msp-half.l', buildPage(b)) : h('div.msp-half.l.msp-end'));
    };
    const fin = e=>e.classList && e.classList.contains('mspread') ? e.querySelectorAll('.mpage').forEach(finishPage) : finishPage(e);
    let cur = UN(startAt), dx = 0, dy = 0, anim = false, down = null, dragging = false, curl = null;
    const curlOn = ()=>{ try{ return !R.curlBroken && M.cfg.qCurl !== false && !!M.mushafCurl && M.mushafCurl.enabled(); }catch(e){ return false; } };
    const curlFail = e=>{ console.warn('page curl disabled', e); R.curlBroken = true; try{ curl && curl.destroy(); }catch(_){} curl = null; dx = 0; dragging = false; anim = false; setT(false); fill(); };
    const slides = {prev:h('div.pg-slide'), cur:h('div.pg-slide'), next:h('div.pg-slide')};
    /* the warm-up stage: laid out like a slide but never seen */
    const warmEl = h('div.pg-slide.pg-warm', {'aria-hidden':'true', style:'visibility:hidden;pointer-events:none;transform:translate3d(-300%,0,0);z-index:-1;will-change:auto'});
    track.append(slides.prev, slides.cur, slides.next, warmEl);
    const get = p=>{
      if(p < 1 || p > MAX()) return null;
      let e = cache.get(p);
      if(!e){ e = buildUnit(p); cache.set(p, e); trim(); }
      return e;
    };
    /* page-turn rustle, synthesised (no audio file): two short bursts of filtered noise */
    let actx = null, noise = null;
    function paperSound(){
      try{
        if(M.cfg.mute) return;
        const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
        actx = actx || new AC(); if(actx.state === 'suspended') actx.resume();
        if(!noise){ const n = Math.floor(actx.sampleRate * .5); noise = actx.createBuffer(1, n, actx.sampleRate); const d = noise.getChannelData(0); let last = 0; for(let i = 0; i < n; i++){ const w = Math.random() * 2 - 1; last = last * .35 + w * .65; d[i] = last; } }
        const t0 = actx.currentTime, src = actx.createBufferSource(); src.buffer = noise; src.playbackRate.value = .9 + Math.random() * .25;
        const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .8; bp.frequency.setValueAtTime(1500, t0); bp.frequency.exponentialRampToValueAtTime(5200, t0 + .2); bp.frequency.exponentialRampToValueAtTime(2400, t0 + .36);
        const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
        const g = actx.createGain(); const v = .16;
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .035); g.gain.linearRampToValueAtTime(v * .25, t0 + .14); g.gain.linearRampToValueAtTime(v * .8, t0 + .22); g.gain.exponentialRampToValueAtTime(.0008, t0 + .4);
        src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(actx.destination); src.start(t0); src.stop(t0 + .42);
      }catch(e){}
    }
    const pos = (el, base)=>{ el.style.transform = 'translate3d('+(base + dx)+'px,0,0)'; };
    const flipSet = (el, deg, z, shade)=>{ el.style.transformOrigin = '100% 50%'; el.style.zIndex = z; el.style.transform = deg == null ? 'translate3d(0,0,0)' : 'rotateY('+deg+'deg)'; el.style.visibility = deg != null && deg >= 89.5 ? 'hidden' : 'visible'; el.style.setProperty('--sh', shade || 0); };
    function place(){
      const W = layout.W;
      if(curl && curl.active) return;
      if(M.cfg.qFlip === 'cover'){
        // stacked cards: the page on top slides away and the one underneath comes forward
        track.classList.remove('flip'); track.classList.add('cover');
        const t = Math.max(-1, Math.min(1, dx / W)), under = (el, k)=>{ el.style.zIndex = 1; el.style.visibility = 'visible'; el.style.transformOrigin = '50% 50%'; el.style.transform = 'scale('+(.93 + .07 * k)+')'; el.style.setProperty('--sh', (1 - k) * .55); };
        const top = (el, x, k)=>{ el.style.zIndex = 3; el.style.visibility = 'visible'; el.style.transform = 'translate3d('+x+'px,0,0)'; el.style.setProperty('--sh', 0); };
        if(t >= 0){ top(slides.cur, dx); under(slides.next, t); slides.next.style.visibility = t > 0 ? 'visible' : 'hidden'; slides.prev.style.visibility = 'hidden'; }
        else { top(slides.prev, W + dx); under(slides.cur, 1 + t); slides.next.style.visibility = 'hidden'; }
        return;
      }
      track.classList.remove('cover');
      if(!M.cfg.qFlip){ track.classList.remove('flip'); for(const k in slides){ slides[k].style.zIndex = ''; slides[k].style.visibility = ''; } pos(slides.cur, 0); pos(slides.next, -W); pos(slides.prev, W); return; }
      // page-turn: the sheet pivots on the right edge (the spine of a right-to-left book)
      track.classList.add('flip');
      const t = Math.max(-1, Math.min(1, dx / W));
      if(t >= 0){ flipSet(slides.cur, t * 90, 3, t); flipSet(slides.next, null, 1, 0); slides.next.style.visibility = t > 0 ? 'visible' : 'hidden'; flipSet(slides.prev, 90, 2, 0); }
      else { flipSet(slides.prev, (1 + t) * 90, 3, 1 + t); flipSet(slides.cur, null, 1, 0); flipSet(slides.next, null, 0, 0); slides.next.style.visibility = 'hidden'; }
    }
    function fill(){
      const todo = [];
      for(const [role, p] of [['prev', cur-1], ['cur', cur], ['next', cur+1]]){
        const s = slides[role]; const e = get(p);
        if(s.firstChild !== e){ s.innerHTML = ''; if(e) s.appendChild(e); }
        if(e && !e._fin){ e._fin = true; todo.push(e); }
      }
      if(todo.length) requestAnimationFrame(()=>todo.forEach(fin));
      place(); warmSoon();
    }
    let lastDir = 1, warmT = 0;
    const idle = window.requestIdleCallback ? f=>requestIdleCallback(f, {timeout:700}) : f=>setTimeout(f, 160);
    function warmSoon(){ if(warmT) return; warmT = 1; setTimeout(()=>idle(warmStep), 60); }
    /* base: the page that is (or is about to be) current. A plain slide / flip turn is a compositor transition, so pages can be
       prepared while it runs; the curl is drawn on the main thread and is left alone. */
    function warmStep(dl, base){
      warmT = 0;
      if(!host.isConnected) return;
      if((anim && (!base || (curl && curl.active))) || dragging){ warmSoon(); return; }
      base = base || cur;
      const order = base === cur ? [cur + 2 * lastDir, cur - 2 * lastDir, cur + 3 * lastDir] : [base + lastDir, base + 2 * lastDir];
      for(const p of order){
        if(p < 1 || p > MAX() || cache.has(p)) continue;
        if(!readyU(p)){ const ps = pagesOf(p).filter(x=>EP(x)); if(ps.length) Promise.all([].concat(...ps.map(x=>M.qcf.needs(x))).map(n=>M.qcf.ensure(n))).then(()=>warmSoon()); continue; }
        const e = buildUnit(p); e._fin = true;
        warmEl.appendChild(e); fin(e); e.remove();
        cache.set(p, e); trim();
        if(!dl || !dl.timeRemaining || dl.timeRemaining() < 20){ warmSoon(); return; }
      }
      /* the audio context costs a frame on first use: make it now, quietly */
      if(!actx && M.cfg.qFlipSound !== false && !M.cfg.mute){ try{ const AC = window.AudioContext || window.webkitAudioContext; if(AC) actx = new AC(); }catch(e){} }
    }
    function trim(){ if(cache.size > 9){ for(const k of cache.keys()){ if(Math.abs(k - cur) > 3){ cache.delete(k); if(cache.size <= 9) break; } } } }
    function setT(on){ Object.values(slides).forEach(s=>s.style.transition = on ? (M.cfg.qFlip ? 'transform .42s cubic-bezier(.3,.1,.3,1)' : 'transform .26s cubic-bezier(.2,.8,.2,1)') : 'none'); }
    /* 4.5.2 two pages side by side turn like a book: the outer page lifts and turns over the spine in the middle.
       Forward (towards the end of the Mushaf) the left page turns onto the right; back, the right page turns onto the left.
       Under the turning leaf: the half that stays, and the spread being opened. */
    /* presses during a turn are counted and played one after another (at most five ahead) */
    let pend = 0;
    const flushPend = ()=>{ if(!pend) return; const d = Math.sign(pend); pend -= d; setTimeout(()=>api.step(d), 20); };
    /* 4.6.1 two pages side by side turn with the paper curl, like one page does — but only the outer page lifts, and
       its fold travels to the spine and stops there: the sheet ends lying on the other page, as in a printed Mushaf.
       Forward (towards the end) the left page is peeled from its free edge and laid over the right one; back, the right
       page is laid over the left. Layers: the spread being opened (under), the half that stays, the turning page
       (clipped where it is still flat), and the lifted part mirrored across the fold, showing the next page on its back. */
    const book = (()=>{
      let st = null;
      const G = ()=>M.mushafCurl && M.mushafCurl.geo;
      const halfOf = (el, side)=>{ const x = el && el.querySelector('.msp-half.' + side); return x ? x.cloneNode(true) : h('div.msp-half'); };
      const pgBox = (child, left, flip)=>h('div.bk-pg' + (flip ? '.bk-flip' : ''), {style:'left:' + (left ? '0' : '50%')}, child);
      function begin(dir, y){
        const g = G(); if(!g) return null;
        const target = cur + dir; if(target < 1 || target > MAX()) return null;
        const curEl = get(cur), toEl = get(target); if(!curEl || !toEl) return null;
        const to = dir > 0 ? slides.next : slides.prev, other = dir > 0 ? slides.prev : slides.next;
        if(to.firstChild !== toEl){ to.innerHTML = ''; to.appendChild(toEl); }
        if(!toEl._fin){ toEl._fin = true; fin(toEl); }
        setT(false);
        to.style.transform = 'translate3d(0,0,0)'; to.style.zIndex = 1; to.style.visibility = 'visible';
        slides.cur.style.transform = 'translate3d(0,0,0)'; slides.cur.style.zIndex = 2; slides.cur.style.visibility = 'visible';
        slides.cur.style.clipPath = dir > 0 ? 'inset(0 0 0 50%)' : 'inset(0 50% 0 0)';   // the half that does not turn
        other.style.visibility = 'hidden';
        const fwd = dir > 0, W = layout.W, H = layout.H;
        const ov = h('i.bk-ov');
        const front = h('div.bk-front', pgBox(halfOf(curEl, fwd ? 'l' : 'r'), fwd), ov);
        const shU = h('i.bk-shu');
        const fo = h('i.bk-fo');
        const fi = h('div.bk-fi', {style:'width:' + W + 'px;height:' + H + 'px'}, pgBox(halfOf(toEl, fwd ? 'r' : 'l'), fwd, true), fo);
        const fw = h('div.bk-fw', {style:'width:' + W + 'px;height:' + H + 'px'}, fi);
        track.append(front, shU, fw); track.classList.add('bk-on');
        st = {dir, target, front, ov, shU, fw, fi, fo, t:0, a:0, y:y == null ? H * .75 : y};
        return st;
      }
      function render(){
        const g = G(); if(!st || !g) return;
        const W = layout.W, H = layout.H, fwd = st.dir > 0, t = g.clamp(st.t, 0, 1);
        const nx = Math.cos(st.a), ny = Math.sin(st.a);
        const half = fwd ? [[0, 0], [W / 2, 0], [W / 2, H], [0, H]] : [[W / 2, 0], [W, 0], [W, H], [W / 2, H]];
        const dots = half.map(q=>nx * q[0] + ny * q[1]), dMin = Math.min(...dots), dMax = Math.max(...dots);
        const d = fwd ? dMin + t * (dMax - dMin) : dMax - t * (dMax - dMin);
        const lifted = g.clipHalf(half, nx, ny, d, fwd), flat = g.clipHalf(half, nx, ny, d, !fwd);
        const on = lifted.length >= 3 && t > .002;
        st.front.style.clipPath = g.poly(flat);
        st.fw.style.display = st.shU.style.display = on ? '' : 'none';
        st.fw.style.transform = 'matrix(' + (1 - 2 * nx * nx).toFixed(5) + ',' + (-2 * nx * ny).toFixed(5) + ',' + (-2 * nx * ny).toFixed(5) + ',' + (1 - 2 * ny * ny).toFixed(5) + ',' + (2 * d * nx).toFixed(2) + ',' + (2 * d * ny).toFixed(2) + ')';
        st.fi.style.clipPath = g.poly(lifted);
        st.shU.style.clipPath = g.poly(lifted);
        const P0x = nx * d, P0y = ny * d, s = fwd ? 1 : -1, k = Math.min(1, Math.max(.25, 1 - Math.abs(t - .5) * .5));
        st.fo.style.background = g.grad(-s * nx, -s * ny, W, H, P0x, P0y, [[0, 'rgba(0,0,0,.30)'], [10, 'rgba(255,255,255,.22)'], [48, 'rgba(255,255,255,0)'], [W, 'rgba(0,0,0,.08)']]);
        st.ov.style.background = g.grad(s * nx, s * ny, W, H, P0x, P0y, [[0, 'rgba(0,0,0,' + (.34 * k).toFixed(2) + ')'], [22, 'rgba(0,0,0,' + (.12 * k).toFixed(2) + ')'], [84, 'rgba(0,0,0,0)']]);
        st.shU.style.background = g.grad(-s * nx, -s * ny, W, H, P0x, P0y, [[0, 'rgba(0,0,0,.30)'], [40, 'rgba(0,0,0,.1)'], [110, 'rgba(0,0,0,0)']]);
      }
      let raf = 0;
      function set(t, ddy){
        if(!st) return;
        st.t = Math.max(0, Math.min(1, t));
        if(ddy != null) st.a = Math.max(-.4, Math.min(.4, Math.atan2(ddy * .5 * (st.dir > 0 ? 1 : -1), Math.max(Math.abs(dx), 90))));
        if(!raf) raf = requestAnimationFrame(()=>{ raf = 0; render(); });
      }
      function clean(){
        cancelAnimationFrame(raf); raf = 0;
        if(!st) return;
        cancelAnimationFrame(st.anim || 0);
        [st.front, st.shU, st.fw].forEach(e=>e.remove()); track.classList.remove('bk-on'); slides.cur.style.clipPath = '';
        st = null;
      }
      function end(go, ms){
        if(!st) return;
        const s0 = st, t0 = s0.t || 0, t1 = go ? 1 : 0, a0 = s0.a;
        const dur = ms || Math.round(240 + 360 * Math.abs(t1 - t0));
        const ease = x=>1 - Math.pow(1 - x, 3), ts = performance.now();
        const step = now=>{
          if(st !== s0) return;
          const x = Math.min(1, (now - ts) / dur), e = ease(x);
          s0.t = t0 + (t1 - t0) * e; s0.a = a0 * (1 - e); render();
          if(x < 1){ s0.anim = requestAnimationFrame(step); return; }
          clean(); if(go) cur = s0.target; dx = 0; setT(false); fill(); anim = false; if(go) onPage(PG(cur)); flushPend();
        };
        s0.anim = requestAnimationFrame(step);
      }
      /* a turn from the arrows or the keyboard: a gentle diagonal peel from the lower corner */
      function auto(dir){
        if(!begin(dir, layout.H * .8)) return false;
        st.a = (dir > 0 ? 1 : -1) * (.18 + Math.random() * .12); st.t = 0; render(); end(true, 640);
        return true;
      }
      /* cancel (a relayout, a turn the other way): the pager must never stay marked as animating */
      return {begin, set, end, auto, cancel:()=>{ if(st){ clean(); anim = false; } }, get active(){ return !!st; }, get dir(){ return st ? st.dir : 0; }};
    })();
    function commit(delta){
      const np = cur + delta; if(np < 1 || np > MAX()){ snap(); return; }
      lastDir = delta > 0 ? 1 : -1;
      if(SPm){
        if(book.active) book.cancel();
        anim = true; if(M.cfg.qFlipSound !== false) paperSound();
        if(book.auto(delta > 0 ? 1 : -1)) return;
        anim = false;
      }
      if(curlOn() && !SPm){
        try{
          anim = true; if(M.cfg.qFlipSound !== false) paperSound();
          const c = curl || (curl = M.mushafCurl.make(track, slides, ()=>layout));
          c.start(delta > 0 ? 1 : -1, layout.H * (.55 + Math.random() * .35), 0);
          c.finish(true, ()=>{ cur = np; dx = 0; c.stop(); setT(false); fill(); anim = false; onPage(PG(cur)); }, null);
          return;
        }catch(e){ curlFail(e); }
      }
      anim = true; setT(true); dx = delta > 0 ? layout.W : -layout.W; place();
      if(M.cfg.qFlipSound !== false) paperSound();
      setTimeout(()=>{ if(anim) warmStep(null, np); }, 30);
      setTimeout(()=>{ cur = np; dx = 0; setT(false); fill(); anim = false; onPage(PG(cur)); flushPend(); }, M.cfg.qFlip ? 430 : 270);
    }
    function snap(){ setT(true); dx = 0; place(); setTimeout(()=>setT(false), M.cfg.qFlip ? 440 : 280); }
    host.addEventListener('pointerdown', e=>{ if(anim) return; const r = host.getBoundingClientRect(); down = {x:e.clientX, y:e.clientY, t:Date.now(), ry:e.clientY - r.top}; dragging = false; });
    host.addEventListener('pointermove', e=>{
      if(!down || anim) return;
      const ddx = e.clientX - down.x, ddy = e.clientY - down.y;
      if(!dragging){
        if(Math.abs(ddx) > 10 && Math.abs(ddx) > Math.abs(ddy) * 1.3){ dragging = true; try{ host.setPointerCapture(e.pointerId); }catch(_){} cancelLong(); setT(false); }
        else if(Math.abs(ddy) > 12){ down = null; cancelLong(); return; }
      }
      if(dragging){
        dx = ddx; dy = ddy;
        if((cur === MAX() && dx > 0) || (cur === 1 && dx < 0)) dx *= 0.25;
        if(SPm && !(cur === MAX() && dx > 0) && !(cur === 1 && dx < 0)){
          const dir = dx > 0 ? 1 : -1;
          if(book.active && book.dir !== dir) book.cancel();
          if(book.active || book.begin(dir, down.ry)){ book.set(Math.abs(dx) / (layout.W * .9), dy); return; }
        }
        if(!SPm && curlOn() && !(cur === MAX() && dx > 0) && !(cur === 1 && dx < 0)){
          try{
            const dir = dx > 0 ? 1 : -1;
            if(!curl) curl = M.mushafCurl.make(track, slides, ()=>layout);
            if(!curl.active || curl.dir !== dir) curl.start(dir, down.ry, dy);
            curl.drag(dx, dy); return;
          }catch(er){ curlFail(er); }
        }
        place();
      }
    });
    const end = e=>{
      if(!down) return; const d = down; down = null;
      if(!dragging) return;
      dragging = false; api.wasDrag = true; setTimeout(()=>api.wasDrag = false, 80);
      const v = dx / Math.max(1, Date.now() - d.t), W = layout.W;
      if(book.active){
        const dir = book.dir, go = dir > 0 ? (dx > W * .22 || (v > .5 && dx > 30)) : (dx < -W * .22 || (v < -.5 && dx < -30));
        if(go) lastDir = dir;
        anim = true; if(go && M.cfg.qFlipSound !== false) paperSound();
        book.end(go);
        return;
      }
      if(curl && curl.active){
        const dir = curl.dir, go = dir > 0 ? (dx > W * 0.2 || (v > 0.5 && dx > 30)) : (dx < -W * 0.2 || (v < -0.5 && dx < -30));
        const np = cur + (go ? dir : 0);
        if(go) lastDir = dir;
        anim = true; if(go && M.cfg.qFlipSound !== false) paperSound();
        try{ curl.finish(go, ()=>{ cur = np; dx = 0; curl.stop(); setT(false); fill(); anim = false; if(go) onPage(PG(cur)); }, v); }catch(er){ curlFail(er); }
        return;
      }
      if(dx > W * 0.2 || (v > 0.55 && dx > 30)) commit(+1);
      else if(dx < -W * 0.2 || (v < -0.55 && dx < -30)) commit(-1);
      else snap();
    };
    host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end);
    const api = {
      wasDrag:false, get cur(){ return PG(cur); }, get spread(){ return SPm; },
      /* one turn forward or back (a page, or a spread) — the arrows and the keyboard use this */
      step(d){ if(anim){ pend = Math.max(-5, Math.min(5, pend + d)); return; } const u = Math.max(1, Math.min(MAX(), cur + d)); if(u === cur) return; commit(u - cur); },
      destroyCurl(){ try{ curl && curl.destroy(); }catch(e){} curl = null; },
      relayout(){ if(!anim && curl) curl.stop(); book.cancel(); if(!!layout.spread !== SPm){ const pg = PG(cur); SPm = !!layout.spread; cur = UN(pg); } cache.clear(); slides.prev.innerHTML = slides.cur.innerHTML = slides.next.innerHTML = ''; fill(); },
      rebuild(p){ const u = UN(p); if(!cache.has(u)) return; cache.delete(u); if(Math.abs(u - cur) <= 1) fill(); },
      goto(p, animate){
        p = UN(Math.max(1, Math.min(604, p))); if(p === cur) return;
        if(animate && Math.abs(p - cur) === 1 && !anim){ commit(p - cur); return; }
        cur = p; dx = 0; setT(false); fill(); onPage(PG(cur));
      },
      refresh(){ cache.clear(); slides.prev.innerHTML = slides.cur.innerHTML = slides.next.innerHTML = ''; fill(); }
    };
    fill();
    return api;
  }

  /* ---- marks (selection / playing / highlight / bookmark) ---- */
  /* QCF pages: one continuous soft band per ayah segment on each line (not a box around each word) */
  function paintQcfPage(pg){
    pg.querySelectorAll('.hs').forEach(e=>e.remove());
    const hl = M.QD.highlights, bm = bmSet(), pk = P.key();
    pg.querySelectorAll('.qw').forEach(row=>{
      const kids = Array.from(row.children).filter(c=>c.dataset && c.dataset.k);
      let i = 0;
      while(i < kids.length){
        const k = kids[i].dataset.k; let j = i; while(j + 1 < kids.length && kids[j+1].dataset.k === k) j++;
        const isSel = k === R.sel, isPlay = k === pk && P.playing !== undefined, c = hl[k], isBm = bm.has(k);
        if(isSel || isPlay || c || isBm){
          let l = 1e9, r = -1e9; for(let x = i; x <= j; x++){ l = Math.min(l, kids[x].offsetLeft); r = Math.max(r, kids[x].offsetLeft + kids[x].offsetWidth); }
          const d = h('i.hs'+(isSel ? '.sel' : '')+(isPlay ? '.play' : '')+(c ? '.hl' : '')+(isBm ? '.bm' : ''));
          d.style.left = (l - 4)+'px'; d.style.width = (r - l + 8)+'px'; if(c) d.style.setProperty('--hl', c); if(isBm && bm.get(k)) d.style.setProperty('--bc', bm.get(k));
          row.insertBefore(d, row.firstChild);
        }
        i = j + 1;
      }
    });
  }
  function applyKeyEls(els){
    main.querySelectorAll('.qcf').forEach(paintQcfPage);
    els = els.filter(e=>!e.closest('.qcf'));
    const hl = M.QD.highlights, bm = bmSet(), pk = P.key();
    els.forEach(el=>{
      const k = el.dataset.k;
      el.classList.toggle('sel', k === R.sel);
      el.classList.toggle('play', k === pk && P.playing !== undefined);
      const c = hl[k];
      el.classList.toggle('hl', !!c);
      if(c) el.style.setProperty('--hl', c); else el.style.removeProperty('--hl');
      el.classList.toggle('bm', bm.has(k));
      if(el.classList.contains('va')) el.classList.toggle('is-bm', bm.has(k));
    });
  }
  function applyMarks(scope){ applyKeyEls(Array.from((scope || main).querySelectorAll('[data-k]'))); if(scope && scope.classList && scope.classList.contains('qcf')) paintQcfPage(scope); }
  function applyKey(k){ applyKeyEls(Array.from(main.querySelectorAll('[data-k="'+k+'"]'))); }

  /* ---- navigation / state ---- */
  function onPage(p){
    R.page = p; setProg(p);
    const ss = PSU(p);
    titleEl.textContent = 'سورة '+M.sname(ss[0]);
    subEl.textContent = 'الجزء '+juzAr(p)+' • صفحة '+arNum(p);
    const first = PS(p) || [ss[0], 1];
    M.QD.last = {page:p, sura:first[0], ayah:first[1]};
    const pr = M.QD.pagesRead, tk = M.dkey(); const arr = pr[tk] || []; if(!arr.includes(p)){ arr.push(p); pr[tk] = arr; M.QD.pagesRead = pr; }
    bmBtn.classList.toggle('on', M.QD.bookmarks.some(b=>b.page === p && !b.sura));
    if(R.sel){ /* keep selection only when on the same page */ const sp = PO(...R.sel.split(':').map(Number)); if(sp !== p && !(layout.spread && sp === p + 1)) select(null); }
  }
  function togglePageBm(){
    let bms = M.QD.bookmarks; const i = bms.findIndex(b=>b.page === R.page && !b.sura);
    if(i >= 0){ bms.splice(i, 1); M.toast('أُزيلت علامة الصفحة'); } else { bms.push({page:R.page, ts:Date.now()}); M.toast('تمت إضافة علامة للصفحة '+arNum(R.page)); }
    M.QD.bookmarks = bms; bmBtn.classList.toggle('on', i < 0); M.haptic(10);
  }

  /* ---- selection + ayah bar ---- */
  function select(k){
    const old = R.sel; R.sel = k;
    if(old) applyKey(old); if(k) applyKey(k);
    renderBar();
  }
  function renderBar(){
    bar.innerHTML = '';
    if(!R.sel){ bar.classList.add('hide'); return; }
    const [s, a] = R.sel.split(':').map(Number);
    const isBm = M.QD.bookmarks.some(b=>b.sura === s && b.ayah === a);
    const hasNote = !!M.QD.notes[R.sel];
    const hasHl = !!M.QD.highlights[R.sel];
    const sepC = (M.QD.bookmarks.find(b=>b.sura === s && b.ayah === a) || {}).color;
    const act = (ic, lb, fn, on, cls)=>h('button.ab'+(on ? '.on' : '')+(cls || ''), {onclick:fn, 'aria-label':lb}, h('span.ab-i', {html:M.icon(ic)}), h('small', lb));
    const mini = (ic, lb, fn)=>h('button.icon-btn.ab-m', {onclick:fn, 'aria-label':lb}, M.ic(ic));
    bar.append(
      h('div.ab-top', h('div.ab-t', h('b', 'سورة '+M.sname(s)), h('span', 'الآية '+arNum(a))),
        mini('copy', 'نسخ', ()=>M.copy(shareText(s, a))), mini('share', 'مشاركة', ()=>M.share(shareText(s, a))), mini('close', 'إغلاق', ()=>select(null))),
      h('div.ab-row',
        act('play', 'تلاوة', ()=>{ P.play(s, a); }, false, '.pri'),
        act('tafsir', 'تفسير', ()=>ayahSheet(s, a, 'tafsir')),
        act('bookmark', 'علامة', ()=>toggleAyahBm(s, a), isBm && !sepC),
        act('pin', 'فاصل', ()=>sepSheet(s, a), !!sepC),
        act('note', 'ملاحظة', ()=>noteDlg(s, a), hasNote),
        act('highlight', 'تظليل', ()=>hlSheet(s, a), hasHl),
        act('globe', 'ترجمة', ()=>ayahSheet(s, a, 'tr')),
        act('repeat', 'تحفيظ', ()=>hifzSheet(s, a))));
    bar.classList.remove('hide');
  }
  const shareText = (s, a)=>'﴿'+M.ayahText(s, a)+'﴾\n['+('سورة '+M.sname(s))+': '+arNum(a)+']';
  function toggleAyahBm(s, a){
    let bms = M.QD.bookmarks; const i = bms.findIndex(b=>b.sura === s && b.ayah === a);
    if(i >= 0){ bms.splice(i, 1); M.toast('أُزيلت العلامة'); } else { bms.push({sura:s, ayah:a, page:PO(s, a), ts:Date.now()}); M.toast('تمت إضافة علامة'); }
    M.QD.bookmarks = bms; applyKey(KEY(s, a)); renderBar(); M.haptic(10);
  }
  /* «فاصل»: a coloured separator kept in the same store as bookmarks (bookmark + colour), so it shows in the favourites list and the index */
  const SEP = [['#e53935','أحمر'],['#fb8c00','برتقالي'],['#fdd835','أصفر'],['#43a047','أخضر'],['#1e88e5','أزرق'],['#8e24aa','بنفسجي']];
  function sepSheet(s, a){
    const cur = (M.QD.bookmarks.find(b=>b.sura === s && b.ayah === a) || {}).color;
    const set = c=>{ const bms = M.QD.bookmarks.filter(b=>!(b.sura === s && b.ayah === a)); if(c) bms.push({sura:s, ayah:a, page:PO(s, a), ts:Date.now(), color:c}); M.QD.bookmarks = bms; applyKey(KEY(s, a)); renderBar(); sh.close(); M.haptic(8); M.toast(c ? 'تم وضع الفاصل' : 'أُزيل الفاصل'); };
    const row = h('div.hl-row'); SEP.forEach(([c, n])=>row.append(h('button.hl-dot'+(c === cur ? '.on' : ''), {style:'background:'+c, 'aria-label':n, onclick:()=>set(c)})));
    row.append(h('button.hl-dot.none', {'aria-label':'إزالة', onclick:()=>set(null)}, M.ic('close')));
    const sh = M.sheet({title:'فاصل بين المواضع', content:h('div', h('div.muted.small', 'ضع فاصلًا ملوّنًا عند هذه الآية لتعود إليها من الفهرس (مرجعيات).'), row)});
  }
  function hlSheet(s, a){
    const k = KEY(s, a);
    const row = h('div.hl-row');
    M.HL_COLORS.forEach(([c, n])=>row.append(h('button.hl-dot', {style:'background:'+c, 'aria-label':n, onclick:()=>{ const m = M.QD.highlights; m[k] = c; M.QD.highlights = m; applyKey(k); renderBar(); sh.close(); M.haptic(8); }})));
    row.append(h('button.hl-dot.none', {'aria-label':'إزالة', onclick:()=>{ const m = M.QD.highlights; delete m[k]; M.QD.highlights = m; applyKey(k); renderBar(); sh.close(); }}, M.ic('close')));
    const sh = M.sheet({title:'تظليل الآية', content:h('div', h('div.muted.small', 'اختر لونًا للتظليل:'), row)});
  }
  async function noteDlg(s, a){
    const k = KEY(s, a); const m = M.QD.notes;
    const v = await M.prompt('ملاحظتي على الآية '+arNum(a), m[k] || '', 'اكتب خاطرتك أو فائدتك…', true);
    if(v == null) return;
    if(v.trim()) m[k] = v.trim(); else delete m[k];
    M.QD.notes = m; renderBar(); M.toast(v.trim() ? 'تم حفظ الملاحظة' : 'حُذفت الملاحظة');
  }
  function hifzSheet(s, a){
    const n = Q.surahs[s-1].n; let from = a, to = Math.min(n, a + 4), each = 3, loops = 3;
    const sel = (v, set)=>{ const el = h('select.field', {onchange:e=>set(+e.target.value)}); for(let i = 1; i <= n; i++) el.append(h('option', {value:i, selected:i === v}, arNum(i))); return el; };
    const nums = (opts, v, set)=>M.chips(opts.map(x=>[String(x), x === 0 ? '∞' : arNum(x)]), String(v), x=>set(+x));
    const body = h('div.col-flex',
      h('div.muted.small', 'سورة '+M.sname(s)+' — كرّر مقطعًا للحفظ بتلاوة القارئ المختار.'),
      h('div.grid2', h('div', h('div.small.muted', 'من آية'), sel(from, v=>from = v)), h('div', h('div.small.muted', 'إلى آية'), sel(to, v=>to = v))),
      h('div.small.muted', 'تكرار كل آية'), nums([1,2,3,5,10], each, v=>each = v),
      h('div.small.muted', 'تكرار المقطع كاملًا'), nums([1,2,3,5,10,0], loops, v=>loops = v),
      h('button.btn.block', {onclick:()=>{ if(to < from) [from, to] = [to, from]; P.playRange(s, from, to, each, loops); hs.close(); }}, M.ic('play'), 'ابدأ التحفيظ'));
    const hs = M.sheet({title:'وضع التحفيظ', content:body});
    // fix select initial values
    const sels = body.querySelectorAll('select'); sels[0].value = from; sels[1].value = to;
  }

  /* ---- ayah sheet: tafsir + translation ---- */
  function ayahSheet(s, a, tab){
    let cur = tab || 'tafsir', slug = M.cfg.tafsir;
    const out = h('div.taf-out');
    // the ayah exactly as printed in the mushaf (QCF glyphs, with its own end-of-ayah mark); plain text only if the page font is unavailable
    let head; const parts = (()=>{ try{ return M.qcf.data ? ayahQcf(s, a) : []; }catch(e){ return []; } })();
    if(parts.length) head = h('div.taf-ayah.taf-qcf', ...qSpans(parts));
    else head = h('div.qfont.taf-ayah', '\u200B'+M.ayahText(s, a)+' \u06DD'+String(a).replace(/\d/g, d=>'٠١٢٣٤٥٦٧٨٩'[d]));
    const tabs = M.seg([['tafsir','التفسير'],['tr','الترجمة']], cur, v=>{ cur = v; draw(); });
    const edits = M.chips(M.TAFSIRS, slug, v=>{ slug = v; M.save('tafsir', v); draw(); });
    const body = h('div.col-flex', head, tabs, edits, out);
    const sh = M.sheet({title:'سورة '+M.sname(s)+' • آية '+arNum(a), content:body});
    sh.el.style.maxHeight = '92%';
    async function draw(){
      out.innerHTML = '';
      edits.style.display = cur === 'tafsir' ? '' : 'none';
      if(cur === 'tafsir'){
        out.append(h('div.muted.center', 'جارٍ التحميل…'));
        try{ const r = await M.getTafsir(slug, s, a); out.innerHTML = ''; out.append(h('div.taf-text', r.text || 'لا يوجد تفسير لهذه الآية في هذا الكتاب.'), h('div.tiny.muted', (M.TAFSIRS.find(x=>x[0] === slug) || [])[1] + (r.cached ? ' • محفوظ للعمل دون اتصال' : ''))); }
        catch(e){ out.innerHTML = ''; out.append(h('div.card.pad.center', h('div', 'تعذّر تحميل التفسير. يلزم اتصال بالإنترنت لأول مرة (ثم يُحفظ للقراءة دون اتصال).'), h('button.btn.sm.tonal', {style:'margin-top:10px', onclick:draw}, M.ic('refresh'), 'إعادة المحاولة'))); }
      } else {
        const lang = M.cfg.translation === 'off' ? 'en' : M.cfg.translation;
        const langs = M.chips(M.TRANSLATIONS.filter(x=>x[0] !== 'off'), lang, async v=>{ M.save('translation', v); draw(); });
        out.append(langs);
        try{
          const arr = await M.loadTranslation(lang); const tl = await M.loadTranslit();
          out.append(h('div.taf-text'+(lang === 'ur' ? '.rtl-ur' : '.ltr'), {dir:(lang === 'ur' ? 'rtl' : 'ltr')}, arr[M.aid(s, a)]));
          out.append(h('div.sep'), h('div.small.muted', 'النقل الحرفي'), h('div.ltr.small', {dir:'ltr'}, tl[M.aid(s, a)]));
        }catch(e){ out.append(h('div.muted', 'تعذّر تحميل الترجمة')); }
      }
    }
    draw();
  }

  /* ---- jump / settings sheets ---- */
  function jumpSheet(tab0){
    let tab = tab0 || 'surah';
    const go = o=>{ jumpTo(o); sh.close(); };
    const out = h('div.idx-out');
    const seg = M.seg([['surah','سور'],['juz','أجزاء'],['notes','ملاحظات'],['bm','مرجعيات'],['page','صفحات']], tab, v=>{ tab = v; draw(); });
    const inp = h('input.field', {type:'number', inputmode:'numeric', min:1, max:604, placeholder:'اذهب إلى صفحة (١–٦٠٤)', onkeydown:e=>{ if(e.key === 'Enter') ok(); }});
    const ok = ()=>{ const p = +inp.value; if(p >= 1 && p <= 604) go({page:p}); else M.toast('أدخل رقمًا من ١ إلى ٦٠٤'); };
    function draw(){
      out.innerHTML = '';
      if(tab === 'surah'){
        const cur = PSU(R.page)[0];
        Q.surahs.forEach(sr=>{
          const card = h('button.idx-card'+(sr.id === cur ? '.cur' : ''), {onclick:()=>go({sura:sr.id, ayah:1})},
            h('span.idx-n', arNum(sr.id)), h('div.grow', h('div.idx-t.title-font', sr.ar), h('div.idx-s', (sr.mk ? 'مكية' : 'مدنية')+' • '+M.cnt(sr.n, 'آية'))),
            h('span.idx-p', 'ص '+arNum(sr.page)));
          out.append(card);
        });
      } else if(tab === 'juz'){
        const cur = M.juzOfPage(R.page);
        for(let i = 1; i <= 30; i++){
          const [s0, a0] = Q.meta.juz[i-1];
          out.append(h('button.idx-card'+(i === cur ? '.cur' : ''), {onclick:()=>go({sura:s0, ayah:a0})},
            h('span.idx-n', arNum(i)), h('div.grow', h('div.idx-t', 'الجزء '+arNum(i)), h('div.idx-s', 'سورة '+M.sname(s0)+' • آية '+arNum(a0))), h('span.idx-p', 'ص '+arNum(PO(s0, a0)))));
        }
      } else if(tab === 'notes' || tab === 'bm'){
        const rows = [];
        if(tab === 'notes'){
          const nt = M.QD.notes; Object.keys(nt).forEach(k=>{ const [s, a] = k.split(':').map(Number); rows.push({k, s, a, page:PO(s, a), text:nt[k], note:true}); });
          rows.sort((x, y)=>x.page - y.page || x.a - y.a);
        } else {
          M.QD.bookmarks.forEach(b=>{ if(b.sura) rows.push({k:KEY(b.sura, b.ayah), s:b.sura, a:b.ayah, page:PO(b.sura, b.ayah), color:b.color, ts:b.ts}); else rows.push({page:b.page, ts:b.ts, pageBm:true}); });
          rows.sort((x, y)=>(y.ts || 0) - (x.ts || 0));
        }
        if(!rows.length) out.append(h('div.card.pad.center.muted', tab === 'notes' ? 'لا توجد ملاحظات بعد. اضغط على آية ثم «ملاحظة».' : 'لا توجد مرجعيات بعد. اضغط على آية ثم «علامة» أو «فاصل»، أو أضف علامة للصفحة من الشريط العلوي.'));
        rows.forEach(r=>{
          const title = r.pageBm ? 'علامة الصفحة '+arNum(r.page) : 'سورة '+M.sname(r.s)+' • آية '+arNum(r.a);
          const del = h('button.icon-btn.idx-x', {'aria-label':'حذف', onclick:async e=>{ e.stopPropagation(); if(!await M.confirm('حذف هذا العنصر؟', 'حذف')) return;
            if(r.note){ const m = M.QD.notes; delete m[r.k]; M.QD.notes = m; } else { M.QD.bookmarks = M.QD.bookmarks.filter(b=>!(r.pageBm ? (!b.sura && b.page === r.page) : (b.sura === r.s && b.ayah === r.a))); applyMarks(); }
            if(R.sel) renderBar(); draw(); }}, M.ic('trash'));
          out.append(h('div.idx-card.idx-r', {role:'button', tabindex:0, onclick:()=>go(r.pageBm ? {page:r.page} : {sura:r.s, ayah:r.a})},
            h('span.idx-dot', {style:r.color ? 'background:'+r.color : ''}, r.color ? null : M.ic(r.note ? 'note' : 'bookmark')),
            h('div.grow', h('div.idx-t', title), r.text ? h('div.idx-s.idx-note', r.text) : h('div.idx-s', 'صفحة '+arNum(r.page)+(r.color ? ' • فاصل' : ''))), del));
        });
      } else {
        const g = h('div.idx-pages');
        for(let i = 1; i <= 604; i++) g.append(h('button.idx-pg'+(i === R.page ? '.cur' : ''), {onclick:()=>go({page:i})}, arNum(i)));
        out.append(g);
        setTimeout(()=>{ const c = g.querySelector('.cur'); if(c) c.scrollIntoView({block:'center'}); }, 30);
      }
    }
    const body = h('div.col-flex.idx', h('div.row-flex', inp, h('button.btn.sm', {onclick:ok}, 'انتقال')), seg, out);
    const sh = M.sheet({title:'الفهرس', content:body}); sh.el.style.maxHeight = '88%';
    draw();
    setTimeout(()=>{ const c = out.querySelector('.cur'); if(c && tab !== 'page') c.scrollIntoView({block:'center'}); }, 40);
  }
  function jumpTo(o){
    if(R.mode === 'pages'){ R.pager.goto(o.page || PO(o.sura, o.ayah || 1), false); }
    else buildScroll(o.sura || PS(o.page)[0], o.sura ? (o.ayah || 1) : PS(o.page)[1]);
  }
  function moreSheet(){
    const item = (ic, t, sub, fn)=>h('button.item', {onclick:()=>{ ms.close(); setTimeout(fn, 120); }}, h('span.lead', {html:M.icon(ic)}), h('div.grow', h('div.t', t), sub ? h('div.s', sub) : null));
    const list = h('div.list',
      item(R.mode === 'pages' ? 'scroll' : 'pages', R.mode === 'pages' ? 'التمرير الطولي' : 'نظام الصفحات', 'تبديل نظام القراءة', ()=>switchMode()),
      item('search', 'الانتقال السريع', 'صفحة، سورة، جزء', ()=>jumpSheet()),
      item('settings', 'إعدادات القراءة', 'القراءة، المظهر، التلاوة، الترجمة، التنزيل', ()=>readerSettings()),
      item('volume', 'اختيار القارئ', (M.RECITERS.find(r=>r[0] === M.cfg.reciter) || [])[1], ()=>reciterSheet()),
      item('moon', 'الوضع الليلي للصفحة', M.cfg.qTheme === 'dark' ? 'مفعّل' : '', ()=>{ const n = M.cfg.qTheme === 'dark' ? 'auto' : 'dark'; M.save('qTheme', n); root.dataset.rt = n; }));
    const ms = M.sheet({title:'خيارات المصحف', content:list});
  }
  let asT = null;
  function setAutoScroll(){
    clearInterval(asT); asT = null; const sp = M.cfg.autoScroll || 0;
    if(sp && R.mode === 'scroll') asT = setInterval(()=>{ if(!R.sc || !R.sc.isConnected){ clearInterval(asT); return; } R.sc.scrollTop += sp * 0.6; }, 30);
  }
  function readerSettings(tab){
    const THEMES = [['auto','تلقائي','linear-gradient(135deg,#f8f1e0 50%,#1c1f24 50%)','#555'],['paper','ورقي','#f8f1e0','#3b2f1c'],['white','أبيض','#ffffff','#111'],['green','أخضر','#e6f2e4','#173a22'],['sepia','سيبيا','#efdfbf','#4a3418'],['rose','وردي','#fbe9ec','#5a2230'],['blue','أزرق','#e6eff9','#17304f'],['dark','ليلي','#1c1f24','#e8e6e0'],['black','أسود','#000000','#e8e6e0']];
    const FRS = [['gold','ذهبي','#c9a24a'],['green','أخضر','#1f7a4d'],['mint','أخضر فاتح','#7cc7a0'],['blue','أزرق','#2f6fb3'],['maroon','عنابي','#7a2233'],['red','أحمر','#c0392b'],['black','أسود زخرفي','#111111']];
    const BNS = [['green','أخضر غامق','#14532d'],['mint','أخضر فاتح','#7cc7a0'],['gold','ذهبي','#c9a24a'],['maroon','عنابي','#7a2233'],['wine','خمري','#5b1a2e'],['blue','أزرق','#2f6fb3'],['ink','أسود','#222222']];
    const body = h('div.rs');
    const grp = (title, ...kids)=>h('div.rs-g', title ? h('div.rs-h', title) : null, h('div.card.rs-c', ...kids.filter(Boolean)));
    const line = (t, sub, ctl)=>h('div.rs-l', h('div.grow', h('div.rs-t', t), sub ? h('div.small.muted', sub) : null), ctl);
    const block = (t, ctl, sub)=>h('div.rs-b', h('div.rs-t', t), sub ? h('div.small.muted', sub) : null, ctl);
    const sws = (list, cur, fn, cls)=>h('div.rs-sw', ...list.map(([v, n, c, fg])=>h('button'+(v === cur ? '.on' : ''), {'aria-label':n, 'aria-pressed':v === cur, onclick:()=>{ fn(v); draw(); }},
      h('i'+(cls || ''), {style:'background:'+c+(fg ? ';color:'+fg : '')}, fg ? 'ﷲ' : (v === cur ? M.ic('check') : null)), h('small', n))));
    const TABMAP = {view:'read', text:'trans', audio:'audio', data:'data'};
    let cur = TABMAP[tab] || tab || 'read';
    const draw = ()=>{
      const pages = R.mode === 'pages';
      const tabs = h('div.rs-tabs', M.seg([['read','القراءة'],['look','المظهر'],['audio','التلاوة'],['trans','ترجمة وتفسير'],['data','التنزيل']], cur, v=>{ cur = v; draw(); }));
      let kids = [];
      if(cur === 'read'){
        kids = [
          grp('نظام القراءة', h('div.rs-b', M.seg([['pages','صفحات المصحف'],['scroll','تمرير طولي']], R.mode, v=>{ if(v !== R.mode){ switchMode(); setTimeout(draw, 60); } }))),
          pages ? grp('تقليب الصفحات', line('تأثير تقليب الصفحة', 'طيّ الورقة بظلّ ناعم يتبع إصبعك', M.switchEl(M.cfg.qCurl !== false, v=>{ M.save('qCurl', !!v); if(R.pager) R.pager.relayout(); })),
              block('الحركة البديلة (عند إيقاف التأثير)', M.seg([['slide','انزلاق'],['flip','تقليب ورقة'],['cover','بطاقات']], M.cfg.qFlip === 'cover' ? 'cover' : M.cfg.qFlip ? 'flip' : 'slide', v=>{ M.save('qFlip', v === 'flip' ? true : v === 'cover' ? 'cover' : false); if(R.pager) R.pager.relayout(); })),
              line('صوت تقليب الورق', 'صوت خفيف عند الانتقال بين الصفحات', M.switchEl(M.cfg.qFlipSound !== false, v=>M.save('qFlipSound', v))))
            : grp('التمرير التلقائي', h('div.rs-b', M.seg([[0,'إيقاف'],[1,'بطيء'],[2,'متوسط'],[3,'سريع']], M.cfg.autoScroll || 0, v=>{ M.save('autoScroll', +v); setAutoScroll(); })))];
      } else if(cur === 'look'){
        const pv = h('div.rs-pv.qfont', {style:'font-size:'+(M.cfg.qSize * 1.5).toFixed(2)+'rem'}, 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ');
        kids = [
          grp('لون الصفحة', h('div.rs-b', sws(THEMES, M.cfg.qTheme || 'auto', v=>{ M.save('qTheme', v); root.dataset.rt = v; }, '.pg'))),
          pages ? grp('إطار الصفحة',
            line('إظهار الإطار المزخرف', 'إطار المصحف حول الصفحة مع دائرة رقم الصفحة', M.switchEl(frameKey() !== 'none', v=>{ const k = v ? (M.cfg.qFrameLast || 'gold') : 'none'; if(!v) M.save('qFrameLast', frameKey()); M.save('qFrame', k); if(F2B[k]) M.save('qSurahFrame', F2B[k]); root.dataset.fr = k; root.dataset.sf = bannerKey(); if(R.pager) R.pager.relayout(); draw(); })),
            frameKey() !== 'none' ? block('لون الإطار', sws(FRS, frameKey(), v=>{ M.save('qFrame', v); if(F2B[v]) M.save('qSurahFrame', F2B[v]); root.dataset.fr = v; root.dataset.sf = bannerKey(); if(R.pager) R.pager.relayout(); }), 'يتغيّر معه لون إطار اسم السورة') : null,
            block('هوامش الصفحة', M.seg([[0,'ضيّقة'],[14,'عادية'],[30,'واسعة']], M.cfg.qMar == null ? 0 : M.cfg.qMar, v=>{ M.save('qMar', +v); if(R.pager) R.pager.relayout(); })),
            line('صفحتان متجاورتان', 'على الكمبيوتر والتابلت بالعرض', M.switchEl(M.cfg.qSpread !== false, v=>{ M.save('qSpread', v); doLayout(); }))) : null,
          grp('إطار اسم السورة', h('div.rs-b', sws(BNS, bannerKey(), v=>{ M.save('qSurahFrame', v); if(frameKey() !== 'none' && B2F[v]){ M.save('qFrame', B2F[v]); root.dataset.fr = B2F[v]; if(R.pager) R.pager.relayout(); } root.dataset.sf = v; }))),
          pages ? grp('ألوان التجويد',
            line('تلوين أحكام التجويد', M.qcf.edId() === 'k05' ? 'غير متاحة في طبعة ١٤٠٥هـ' : 'في صفحات المصحف (طبعة ١٤٤١هـ الملوّنة)', M.switchEl(M.qcf.edId() === 'k41c' && M.cfg.mfTaj !== false, v=>{
              if(M.qcf.edId() === 'k05'){ M.toast('ألوان التجويد غير متاحة في طبعة ١٤٠٥هـ'); draw(); return; }
              M.save('mfTaj', !!v); M.emit('mf:taj'); if(v && M.qcf.edId() === 'k41p') M.qcf.useEdition('k41c').then(ok=>{ if(!ok) M.toast('تعذّر تحميل بيانات الطبعة الملوّنة — تحقق من الاتصال'); draw(); }); else setTimeout(draw, 60); })),
            h('button.rs-l.rs-btn', {onclick:()=>{ rs.close(); setTimeout(()=>M.mushafTajLegend && M.mushafTajLegend(), 120); }}, h('span.lead', M.ic('sparkle')), h('div.grow', h('div.rs-t', 'دليل ألوان التجويد'), h('div.small.muted', 'معنى كل لون')))) : null,
          grp('حجم الخط في التمرير الطولي', h('div.rs-b', pv,
            h('div.rs-size', h('span.small', 'أ'), h('input', {type:'range', min:0.8, max:1.8, step:0.05, value:M.cfg.qSize, oninput:e=>{ M.save('qSize', +e.target.value); pv.style.fontSize = (M.cfg.qSize * 1.5).toFixed(2)+'rem'; root.style.setProperty('--vfs', (M.cfg.qSize * 1.9).toFixed(2)+'rem'); }}), h('b', {style:'font-size:1.3rem'}, 'أ')),
            pages ? h('div.small.muted', 'صفحات المصحف تُعرض بمقاسها الأصلي وتملأ الشاشة تلقائيًا.') : null))];
      } else if(cur === 'trans'){
        kids = [
          grp('الترجمة', block('لغة الترجمة', M.chips(M.TRANSLATIONS, M.cfg.translation, v=>{ M.save('translation', v); if(R.mode === 'scroll') rebuildScroll(); }), 'تظهر في التمرير الطولي وعند الضغط على الآية'),
            line('إظهار النقل الحرفي', 'كتابة الآية بحروف لاتينية', M.switchEl(M.cfg.translit, v=>{ M.save('translit', v); if(R.mode === 'scroll') rebuildScroll(); }))),
          grp('التفسير', block('كتاب التفسير', M.chips(M.TAFSIRS, M.cfg.tafsir, v=>M.save('tafsir', v)), 'يتطلب الإنترنت أول مرة ثم يُحفظ'))];
      } else if(cur === 'audio'){
        kids = [
          grp('القارئ', h('button.rs-l.rs-btn', {onclick:()=>{ rs.close(); reciterSheet(); }}, h('span.lead', M.ic('volume')), h('div.grow', h('div.rs-t', (M.RECITERS.find(r=>r[0] === M.cfg.reciter) || [])[1] || 'اختر القارئ'), h('div.small.muted', 'اضغط لتغيير القارئ')))),
          grp('التكرار والسرعة', block('تكرار كل آية', M.seg([[1,'مرة'],[2,M.n(2)],[3,M.n(3)],[5,M.n(5)],[10,M.n(10)],[0,'∞']], M.cfg.repeat, v=>M.save('repeat', +v))),
            block('سرعة التلاوة', M.seg([[0.75,'٠٫٧٥×'],[1,'١×'],[1.25,'١٫٢٥×'],[1.5,'١٫٥×'],[2,'٢×']], M.cfg.speed, v=>P.setSpeed(+v)))),
          grp('أثناء التلاوة', line('الانتقال للسورة التالية', 'يكمل التلاوة تلقائيًا بعد نهاية السورة', M.switchEl(M.cfg.autoNext, v=>M.save('autoNext', v))),
            line('تقليب الصفحة مع التلاوة', 'تتبع الصفحة الآية المقروءة', M.switchEl(M.cfg.pageAudioFollow, v=>M.save('pageAudioFollow', v))))];
      } else {
        const dl = h('div.qdl'); drawDl(dl);
        kids = [grp('القراءة دون اتصال', h('div.rs-b', dl)),
          grp('طبعات المصحف', h('button.rs-l.rs-btn', {onclick:()=>{ rs.close(); M.openMushafEditions && M.openMushafEditions(); }}, h('span.lead', M.ic('quran')), h('div.grow', h('div.rs-t', (M.qcf.ED[M.qcf.edId()] || {}).name || 'مصحف المدينة'), h('div.small.muted', 'تغيير الطبعة وتنزيلها — حجم كل طبعة وحالتها')))),
          grp('التلاوات والتفاسير', h('button.rs-l.rs-btn', {onclick:()=>{ rs.close(); M.openDownloads('audio'); }}, h('span.lead', M.ic('download')), h('div.grow', h('div.rs-t', 'تنزيل التلاوات والتفاسير'), h('div.small.muted', 'لسماع القرّاء وقراءة التفسير دون إنترنت'))))];
      }
      body.replaceChildren(tabs, ...kids.filter(Boolean));
    };
    draw();
    const rs = M.sheet({title:'إعدادات القراءة', content:body});
  }
  async function drawDl(box){
    box.innerHTML = '';
    const n = await M.qcf.cachedCount();
    const total = 48;
    const bar = h('div.dl-bar', h('i', {style:'width:'+Math.min(100, Math.round(n / total * 100))+'%'}));
    const lab = h('div.small.muted', n >= total ? 'المصحف كامل محفوظ للقراءة دون اتصال ✓' : 'محفوظ '+arNum(n)+' من '+arNum(total)+' ملفًا (حوالي ٣٦ ميغابايت) — الباقي يُحمَّل تلقائيًا عند التصفح');
    const btn = h('button.btn.tonal.sm', {onclick:async()=>{
      btn.disabled = true; btn.textContent = 'جارٍ التحميل…';
      const r = await M.qcf.downloadAll((d, t, bad)=>{ bar.firstChild.style.width = Math.round(d / t * 100)+'%'; lab.textContent = 'تحميل '+arNum(d)+' / '+arNum(t)+(bad ? ' • تعذّر '+arNum(bad) : ''); });
      M.toast(r.bad ? 'اكتمل مع بعض الإخفاقات — تحقق من الاتصال وأعد المحاولة' : 'تم حفظ المصحف للقراءة دون اتصال'); drawDl(box);
    }}, M.ic('download'), n >= total ? 'إعادة التحقق' : 'تحميل للعمل دون اتصال');
    box.append(lab, bar, btn);
  }
  function reciterSheet(){
    if(M.openReciters) return M.openReciters(()=>{ if(P.s) P.play(P.s, P.ayah, {keepRange:true}); });
    const list = h('div.list');
    M.RECITERS.forEach(([id, n])=>list.append(h('button.item', {onclick:()=>{ M.save('reciter', id); rs.close(); M.toast('القارئ: '+n); if(P.s) P.play(P.s, P.ayah, {keepRange:true}); }}, h('div.grow.t', n), id === M.cfg.reciter ? h('span.badge', 'الحالي') : null)));
    const rs = M.sheet({title:'اختيار القارئ', content:list});
  }

  /* ---- audio ---- */
  function startAudio(){
    if(R.sel){ const [s, a] = R.sel.split(':').map(Number); return P.play(s, a); }
    if(P.s) return P.toggle();
    const f = PS(R.page); P.play(f[0], f[1]);
  }
  let lastKey = null;
  off.push(M.on('player', ()=>{
    const k = P.key();
    if(lastKey) applyKey(lastKey);
    lastKey = k; if(k){ applyKey(k); followAudio(k); }
    top.querySelector('button.rd-play').innerHTML = M.icon(P.playing ? 'pause' : 'play');
  }));
  function followAudio(k){
    if(!M.cfg.pageAudioFollow || !P.playing) return;
    const [s, a] = k.split(':').map(Number);
    if(R.mode === 'pages'){ const p = PO(s, a); if(p !== R.page) R.pager.goto(p, true); }
    else if(R.sc){ const el = R.sc.querySelector('.va[data-k="'+k+'"]'); if(el){ const r = el.getBoundingClientRect(), m = main.getBoundingClientRect(); if(r.top < m.top + 60 || r.bottom > m.bottom - 140) R.sc.scrollTo({top:R.sc.scrollTop + (r.top - m.top) - 110, behavior:'smooth'}); } }
  }

  /* ---- long-press → tafsir ---- */
  function cancelLong(){ if(R.long){ clearTimeout(R.long); R.long = null; } }
  main.addEventListener('pointerdown', e=>{
    const t = e.target.closest('[data-k]'); if(!t) return;
    cancelLong();
    R.long = setTimeout(()=>{ R.long = null; R.suppress = true; const [s, a] = t.dataset.k.split(':').map(Number); select(t.dataset.k); M.haptic(18); ayahSheet(s, a, 'tafsir'); }, 520);
  });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>main.addEventListener(ev, cancelLong));
  main.addEventListener('contextmenu', e=>e.preventDefault());
  main.addEventListener('click', e=>{
    const ab = e.target.closest('.va-act');
    if(ab){
      const [as, aa] = ab.dataset.k.split(':').map(Number), act = ab.dataset.act;
      if(act === 'play') P.play(as, aa); else if(act === 'tafsir') ayahSheet(as, aa, 'tafsir'); else if(act === 'bm'){ toggleAyahBm(as, aa); } else if(act === 'share') M.share(shareText(as, aa));
      M.haptic(8); return;
    }
    if(R.suppress){ R.suppress = false; return; }
    if(R.pager && R.pager.wasDrag) return;
    const t = e.target.closest('[data-k]');
    if(t){ select(R.sel === t.dataset.k ? null : t.dataset.k); M.haptic(6); }
    else if(R.sel) select(null);
    else { R.imm = !R.imm; root.classList.toggle('imm', R.imm); }
  });

  /* ---- mode switching ---- */
  function switchMode(){
    const nm = R.mode === 'pages' ? 'scroll' : 'pages';
    const cur = PS(R.page) || [1, 1];
    let target = cur;
    if(R.sel){ target = R.sel.split(':').map(Number); }
    R.mode = nm; M.save('readMode', nm); setModeIcon(); mount(target[0], target[1]);
  }
  function mount(s, a){
    main.innerHTML = ''; R.pager = null; R.sc = null;
    if(R.mode === 'pages'){
      doLayout();
      R.pager = makePager(main, PO(s, a)); onPage(PO(s, a));
    } else { buildScroll(s, a); }
  }

  /* ---- vertical scroll mode ---- */
  /* ayah text in QCF glyphs (an ayah can span pages = several fonts) */
  let ayMap = null, bisG = null; const nameG = {};
  function ayahQcf(s, a){
    if(!ayMap){
      ayMap = new Map();
      M.qcf.data.forEach(pg=>pg[1].forEach(l=>{
        if(l[0] === 'b' && !bisG) bisG = [l[3] ? 1 : pg[0], l[1]];
        if(l[0] === 'h') nameG[l[1]] = l[2];
        if(l[0] !== 'w') return;
        l[2].forEach(w=>{ if(w[3] === 2) return; const k = w[1] * 1000 + w[2]; let e = ayMap.get(k); if(!e){ e = []; ayMap.set(k, e); } let t = e[e.length - 1]; if(!t || t[0] !== pg[0]){ t = [pg[0], '']; e.push(t); } t[1] += (t[1] ? ' ' : '') + w[0]; });
      }));
    }
    return ayMap.get(s * 1000 + a) || [];
  }
  const qSpans = parts=>parts.map(([fn, t])=>{ M.qcf.ensure(fn); return h('span', {style:'font-family:'+M.qcf.fam(fn)}, t); });
  let scState = null;
  async function rebuildScroll(){ const k = scState && scState.cur; const [s, a] = k ? k.split(':').map(Number) : (R.sel ? R.sel.split(':').map(Number) : [PS(R.page)[0], PS(R.page)[1]]); buildScroll(s, a); }
  async function buildScroll(startS, startA){
    main.innerHTML = ''; R.pager = null;
    const sc = h('div.vscroll'); main.append(sc); R.sc = sc;
    const lang = M.cfg.translation;
    let tr = null, tl = null;
    try{ if(lang !== 'off') tr = await M.loadTranslation(lang); if(M.cfg.translit) tl = await M.loadTranslit(); }catch(e){ M.toast('تعذّر تحميل الترجمة'); }
    scState = {cur:KEY(startS, startA), first:startS, last:startS, tr, tl};
    function block(s){
      const meta = Q.surahs[s-1];
      ayahQcf(1, 1);
      const bw = Math.min(sc.clientWidth - 28, 520), bh = Math.round(bw / 8.4);
      const ban = h('div.ml.qh.vh', {style:'height:'+bh+'px;width:'+bw+'px'}, h('div.qbn'));
      M.qcf.ensure('Q').then(ok=>{ if(ok && nameG[s]) ban.firstChild.append(nameCanvas(nameG[s], bw, bh)); else ban.firstChild.append(h('span.vh-fb.title-font', 'سورة '+meta.ar)); });
      const b = h('section.vs', {dataset:{s}},
        h('div.sh', ban,
          h('div.sh-meta', h('span', meta.mk ? 'مكية' : 'مدنية'), h('i'), h('span', M.cnt(meta.n, 'آية')), h('i'), h('span', 'الصفحة '+arNum(meta.page)))));
      if(s !== 1 && s !== 9){ ayahQcf(1, 1); if(bisG){ const vb = h('div.vbism', {style:'font-family:'+M.qcf.fam(bisG[0])}, bisG[1]); b.append(vb);
        /* the same safe drawing as on the pages, once its font is in */
        M.qcf.ensure(bisG[0]).then(ok=>{ if(!ok || !vb.isConnected) return; const px = parseFloat(getComputedStyle(vb).fontSize) || 28, m = bisMask(px, Math.round(px * 1.7), bisG[1]); if(m){ vb.replaceChildren(m); vb.classList.add('vbism-m'); } }); } }
      for(let a = 1; a <= meta.n; a++){
        const id = Q.starts[s-1] + a - 1, k = KEY(s, a);
        const el = h('article.va', {dataset:{k, s, a}},
          h('div.va-t.qv', {dataset:{k}}, qSpans(ayahQcf(s, a))),
          h('div.va-h',
            h('button.va-act', {dataset:{act:'play', k}, 'aria-label':'تشغيل'}, M.ic('play')),
            h('button.va-act', {dataset:{act:'tafsir', k}, 'aria-label':'تفسير'}, M.ic('tafsir')),
            h('button.va-act', {dataset:{act:'bm', k}, 'aria-label':'علامة'}, M.ic('bookmark')),
            h('button.va-act', {dataset:{act:'share', k}, 'aria-label':'مشاركة'}, M.ic('share'))));
        if(tl) el.append(h('div.va-tl.ltr', {dir:'ltr'}, tl[id]));
        if(tr) el.append(h('div.va-tr', {dir:(lang === 'ur' ? 'rtl' : 'ltr'), class:(lang === 'ur' ? 'rtl-ur' : 'ltr')}, tr[id]));
        b.append(el);
      }
      return b;
    }
    const prevBtn = startS > 1 ? h('button.btn.tonal.sm.vprev', {onclick:()=>{ const s = scState.first - 1; if(s < 1) return; const b = block(s); const oh = sc.scrollHeight; sc.insertBefore(b, prevBtn.nextSibling); sc.scrollTop += sc.scrollHeight - oh; scState.first = s; applyMarks(b); if(s === 1) prevBtn.remove(); }}, M.ic('chevUp'), 'السورة السابقة') : null;
    if(prevBtn) sc.append(prevBtn);
    const b0 = block(startS); sc.append(b0); applyMarks(b0);
    const sentinel = h('div.vsent'); sc.append(sentinel);
    const io = new IntersectionObserver(es=>{
      if(es[0].isIntersecting && scState.last < 114){
        const s = scState.last + 1; scState.last = s; const b = block(s); sc.insertBefore(b, sentinel); applyMarks(b);
      }
    }, {root:sc, rootMargin:'900px'});
    io.observe(sentinel); off.push(()=>io.disconnect());
    // scroll to ayah
    requestAnimationFrame(()=>{
      const el = startA > 1 || R.sel ? sc.querySelector('.va[data-k="'+KEY(startS, startA)+'"]') : null;
      if(el) sc.scrollTop = el.offsetTop - 90;
      trackScroll();
    });
    let tick;
    sc.addEventListener('scroll', ()=>{ clearTimeout(tick); tick = setTimeout(trackScroll, 120); }, {passive:true});
    function trackScroll(){
      const top = sc.getBoundingClientRect().top + 80;
      const blocks = sc.querySelectorAll('.vs'); let bl = null;
      for(const b of blocks){ if(b.getBoundingClientRect().bottom > top){ bl = b; break; } }
      if(!bl) return;
      let found = null;
      for(const a of bl.querySelectorAll('.va')){ if(a.getBoundingClientRect().bottom > top){ found = a; break; } }
      if(!found) return;
      const s = +found.dataset.s, a = +found.dataset.a, p = M.pageOf(s, a);
      scState.cur = KEY(s, a); R.page = p; setProg(p);
      titleEl.textContent = 'سورة '+M.sname(s); subEl.textContent = 'آية '+arNum(a)+' • الجزء '+juzAr(p)+' • صفحة '+arNum(p);
      M.QD.last = {page:p, sura:s, ayah:a};
      const pr = M.QD.pagesRead, tk = M.dkey(); const arr = pr[tk] || []; if(!arr.includes(p)){ arr.push(p); pr[tk] = arr; M.QD.pagesRead = pr; }
      bmBtn.classList.toggle('on', M.QD.bookmarks.some(x=>x.page === p && !x.sura));
    }
  }

  /* ---- mushaf edition changes / keyboard / edge buttons ---- */
  off.push(M.on('mf:edition', ()=>{ R.qfail = false; if(R.mode === 'pages' && R.pager){ const pg = R.page; try{ R.pager.destroyCurl(); }catch(e){} R.pager.refresh(); onPage(pg); } }));
  off.push(M.on('mf:taj', ()=>{ root.dataset.taj = M.cfg.mfTaj === false ? 'off' : 'on'; }));
  const onKey = e=>{
    if(view.closed || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if(M.views[M.views.length - 1] !== view || M.sheetStack.length) return;
    const t = e.target; if(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if(R.mode !== 'pages' || !R.pager) return;
    let d = 0; if(e.key === 'ArrowRight' || e.key === 'PageDown') d = 1; else if(e.key === 'ArrowLeft' || e.key === 'PageUp') d = -1;   // 4.6.2 the same as the arrows on the page: → turns forward
    if(!d) return; e.preventDefault(); (R.pager.step ? R.pager.step(d) : R.pager.goto(R.pager.cur + d, true));
  };
  document.addEventListener('keydown', onKey); off.push(()=>document.removeEventListener('keydown', onKey));
  root.append(h('button.rd-nv.prev', {'aria-label':'الصفحة السابقة', onclick:()=>{ if(R.pager) R.pager.step(-1); }}, M.ic('chevUp')),
              h('button.rd-nv.next', {'aria-label':'الصفحة التالية', onclick:()=>{ if(R.pager) R.pager.step(1); }}, M.ic('chevUp')));

  /* ---- boot ---- */
  doLayout();
  mount(startS || (PS(startPage) || [1])[0], startS ? startA : (PS(startPage) || [1, 1])[1]);
  if(R.mode === 'pages' && startPage && R.pager.cur !== startPage) R.pager.goto(startPage, false);
  if(R.sel) renderBar();
  M.bgScopeApply();
  view.onBack = ()=>{ if(R.sel){ select(null); return true; } return false; };
  return view;
};
})();
