/* v2 module: qibla — compass + heading-up street map in one screen with a segmented switch */
(function(){
const M = window.M, h = M.h;
if(!M || !h) return;
const K = {lat:21.4225, lng:39.8262}, R = Math.PI / 180;
const oldQibla = M.openQibla, oldMap = M.openQiblaMap;

/* ---------- maths ---------- */
const norm = a=>((a % 360) + 360) % 360;
const delta = (a, b)=>((b - a) % 360 + 540) % 360 - 180;           // shortest signed path a -> b
const bearing = (la, ln, lb, lc)=>{ const p1 = la * R, p2 = lb * R, dl = (lc - ln) * R; return norm(Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) / R); };
const distKm = (la, ln, lb, lc)=>{ const dl = (lb - la) * R, dn = (lc - ln) * R, x = Math.sin(dl / 2) ** 2 + Math.cos(la * R) * Math.cos(lb * R) * Math.sin(dn / 2) ** 2; return 12742 * Math.asin(Math.min(1, Math.sqrt(x))); };
const fmtInt = n=>M.fmtInt ? M.fmtInt(n) : M.n(Math.round(n));
const deg = n=>M.n(Math.round(n)) + '°';
const CARD = ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'];
const cardinal = a=>CARD[Math.round(norm(a) / 45) % 8];
const greatCircle = (la, ln)=>{
  const a = [la * R, ln * R], b = [K.lat * R, K.lng * R];
  const d = Math.acos(Math.max(-1, Math.min(1, Math.sin(a[0]) * Math.sin(b[0]) + Math.cos(a[0]) * Math.cos(b[0]) * Math.cos(b[1] - a[1]))));
  const pts = []; let prev = ln;
  for(let i = 0; i <= 80; i++){
    const f = i / 80; let lat, lng;
    if(d < 1e-6){ lat = K.lat; lng = K.lng; } else {
      const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(a[0]) * Math.cos(a[1]) + B * Math.cos(b[0]) * Math.cos(b[1]), y = A * Math.cos(a[0]) * Math.sin(a[1]) + B * Math.cos(b[0]) * Math.sin(b[1]), z = A * Math.sin(a[0]) + B * Math.sin(b[0]);
      lat = Math.atan2(z, Math.hypot(x, y)) / R; lng = Math.atan2(y, x) / R;
    }
    while(lng - prev > 180) lng -= 360; while(lng - prev < -180) lng += 360; prev = lng; pts.push([lat, lng]);
  }
  return pts;
};
const ICONS = {
  locate:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  headup:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M12 3l6 16-6-4-6 4z"/></svg>',
  northup:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 6v6M9.5 8.5L12 6l2.5 2.5"/></svg>',
  fit:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  warn:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>',
  route:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v13M4 7l3-3 3 3M17 20V7M14 17l3 3 3-3"/></svg>'
};
const ico = k=>h('span.qb-i', {html:ICONS[k]});

/* ---------- compass sensor (shared by both panes) ---------- */
function makeSensor(onData){
  let hasAbs = false, sx = 0, sy = 0, n = 0, jit = 0, last = null, on = false;
  const handler = e=>{
    let hd = null, acc = null;
    if(e.webkitCompassHeading != null && !isNaN(e.webkitCompassHeading)){ hd = e.webkitCompassHeading; if(e.webkitCompassAccuracy != null) acc = e.webkitCompassAccuracy; }
    else if((e.type === 'deviceorientationabsolute' || e.absolute === true) && e.alpha != null){
      hasAbs = true;
      // tilt-compensated heading: blend of the device's top edge (phone flat) and its back (phone upright)
      const a = e.alpha * R, b = (e.beta || 0) * R, g = (e.gamma || 0) * R, sg = b < 0 ? -1 : 1;
      const rA = sg * (-Math.cos(a) * Math.sin(g) - Math.sin(a) * Math.sin(b) * Math.cos(g));
      const rB = sg * (-Math.sin(a) * Math.sin(g) + Math.cos(a) * Math.sin(b) * Math.cos(g));
      hd = norm(Math.atan2(-Math.cos(b) * Math.sin(a) + rA, Math.cos(a) * Math.cos(b) + rB) / R);
    } else if(e.type === 'deviceorientation' && !hasAbs && e.alpha != null && e.absolute !== false && !('webkitCompassHeading' in e)){
      // some WebViews report the absolute frame through the plain event
      if(e.absolute === true){ hd = norm(360 - e.alpha); }
    }
    if(hd == null || isNaN(hd)) return;
    // low-pass on the unit circle (no 359 -> 0 glitch)
    if(!n){ sx = Math.sin(hd * R); sy = Math.cos(hd * R); } else { sx += .3 * (Math.sin(hd * R) - sx); sy += .3 * (Math.cos(hd * R) - sy); }
    n++;
    const f = norm(Math.atan2(sx, sy) / R);
    if(last != null) jit = jit * .9 + Math.abs(delta(last, hd)) * .1;
    last = hd;
    onData({heading:f, jitter:jit, acc, beta:e.beta, gamma:e.gamma});
  };
  const api = {
    got:()=>n > 0,
    async start(){
      try{ if(typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission){ const r = await DeviceOrientationEvent.requestPermission(); if(r !== 'granted') return 'denied'; } }catch(e){}
      if(on) return 'ok'; on = true;
      window.addEventListener('deviceorientationabsolute', handler, true); window.addEventListener('deviceorientation', handler, true);
      return 'ok';
    },
    stop(){ on = false; window.removeEventListener('deviceorientationabsolute', handler, true); window.removeEventListener('deviceorientation', handler, true); }
  };
  return api;
}

/* ---------- Leaflet (same vendored copy as the old screen) ---------- */
let leafletP = null;
function loadLeaflet(){
  if(window.L && window.L.map) return Promise.resolve();
  return leafletP = leafletP || new Promise((res, rej)=>{
    if(!document.querySelector('link[href="css/leaflet.css"]')){ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/leaflet.css'; document.head.appendChild(l); }
    const sc = document.createElement('script'); sc.src = 'js/vendor/leaflet.min.js'; sc.onload = res; sc.onerror = ()=>{ leafletP = null; rej(new Error('leaflet')); }; document.head.appendChild(sc);
  });
}
const isDark = ()=>{ const t = document.documentElement.dataset.theme || ''; return /dark|amoled/.test(t) || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches); };

/* ---------- screen ---------- */
function openV2(startTab){
  const loc0 = M.location();
  const st = {lat:loc0.lat, lng:loc0.lng, acc:null, live:false, name:loc0.name};
  let qd = bearing(st.lat, st.lng, K.lat, K.lng), dist = distKm(st.lat, st.lng, K.lat, K.lng);
  let tab = startTab === 'map' ? 'map' : 'compass';
  let target = null, cum = 0, disp = null, aligned = false, hasSensor = false, noSensor = false, jitter = 0, accBad = false, tilted = false, gone = false, raf = 0, headUp = true;
  let decl = +M.store.get('qibla2:decl', 0) || 0;
  const subs = [];

  const sensor = makeSensor(d=>{
    target = norm(d.heading + decl); jitter = d.jitter; accBad = d.acc != null && (d.acc < 0 || d.acc > 25);
    tilted = d.beta != null && (Math.abs(d.beta) > 65 || Math.abs(d.gamma || 0) > 50);
    if(!hasSensor){ hasSensor = true; noSensor = false; paintMode(); }
  });

  /* --- elements --- */
  const root = h('div.qb');
  const segEl = M.seg([['compass', 'بوصلة'], ['map', 'خريطة']], tab, v=>show(v));
  segEl.classList.add('qb-seg');
  const cPane = h('div.qb-pane.qb-c'), mPane = h('div.qb-pane.qb-m');
  root.append(h('div.qb-top', segEl), cPane, mPane);

  /* compass pane */
  const ticks = Array.from({length:72}, (_, i)=>{ const big = i % 6 === 0, l = big ? 16 : 8; return '<line x1="160" y1="12" x2="160" y2="'+(12 + l)+'" stroke="currentColor" stroke-opacity="'+(big ? .7 : .28)+'" stroke-width="'+(big ? 2.4 : 1.2)+'" transform="rotate('+(i * 5)+' 160 160)"/>'; }).join('');
  const dialSvg = h('div.qb-dial', {html:'<svg viewBox="0 0 320 320"><circle cx="160" cy="160" r="152" class="qb-ring"/><circle cx="160" cy="160" r="104" fill="none" stroke="currentColor" stroke-opacity=".1"/>'+ticks+
    '<text x="160" y="58" text-anchor="middle" class="qb-n">ش</text><text x="160" y="276" text-anchor="middle" class="qb-l">ج</text><text x="268" y="166" text-anchor="middle" class="qb-l">ق</text><text x="52" y="166" text-anchor="middle" class="qb-l">غ</text>'+
    '<g class="qb-kg"><defs><linearGradient id="qbBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e6c35c" stop-opacity="0"/><stop offset="1" stop-color="#e6c35c" stop-opacity=".75"/></linearGradient></defs><path d="M160 160 135.7 22A140 140 0 0 1 184.3 22Z" fill="url(#qbBeam)" class="qb-beam"/><circle cx="160" cy="42" r="26" class="qb-kdisc"/><g transform="translate(160 42)"><rect x="-13" y="-14" width="26" height="28" rx="3" fill="#15130f" stroke="#e6c35c" stroke-width="2"/><rect x="-13" y="-8" width="26" height="5" fill="#e6c35c"/><rect x="-3" y="3" width="6" height="11" rx="1.5" fill="#e6c35c" opacity=".85"/></g></g></svg>'});
  const kg = dialSvg.querySelector('.qb-kg');
  const cardG = dialSvg.querySelector('svg');
  const headTxt = h('div.qb-h', '—'), headSub = h('div.qb-hs', 'اتجاه جهازك');
  const dialBox = h('div.qb-dbox', dialSvg, h('div.qb-pt', {html:'<svg viewBox="0 0 28 34"><path d="M14 2L26 28 14 22 2 28z"/></svg>'}), h('div.qb-center', headTxt, headSub));
  const status = h('div.qb-status', 'حرّك الجهاز لقراءة الاتجاه…');
  const hint = h('div.qb-hint.hide');
  const bearN = h('div.qb-v'), distN = h('div.qb-v'), locN = h('div.qb-loc');
  const enableBtn = h('button.btn.tonal.sm.hide', {onclick:()=>{ sensor.start().then(r=>{ if(r === 'denied') M.toast('لم يُمنح إذن مستشعر الاتجاه'); }); }}, 'تفعيل البوصلة');
  const declStep = h('div.qb-decl');
  const drawDecl = ()=>{ declStep.replaceChildren(
    h('div.qb-dl', 'تصحيح يدوي للشمال المغناطيسي'),
    h('div.qb-ds', h('button.qb-b.sq', {'aria-label':'إنقاص', onclick:()=>setDecl(decl - 1)}, '−'), h('b.num', (decl > 0 ? '+' : '') + M.n(decl) + '°'), h('button.qb-b.sq', {'aria-label':'زيادة', onclick:()=>setDecl(decl + 1)}, '+'))); };
  const setDecl = v=>{ decl = Math.max(-30, Math.min(30, v)); M.store.set('qibla2:decl', decl); drawDecl(); if(hasSensor) target = norm(target - 0); M.haptic(6); };
  drawDecl();
  cPane.append(dialBox, status, hint, enableBtn,
    h('div.card.pad.qb-info', h('div.qb-grid', h('div.center', h('div.small.muted', 'اتجاه القبلة'), bearN), h('div.center', h('div.small.muted', 'المسافة إلى الكعبة'), distN)), locN),
    h('details.card.pad.qb-note', h('summary', M.ic('info'), h('span', 'لقراءة أدق')), h('div.small.muted', {style:'margin-top:8px;line-height:1.9'}, 'البوصلة تقرأ الشمال المغناطيسي وقد يختلف عن الشمال الحقيقي بدرجات قليلة بحسب مدينتك؛ يمكنك تعديل الفرق يدويًا. ابتعد عن المعادن والمغناطيس وضع الجهاز أفقيًا.'), declStep));

  /* map pane (built lazily) */
  let map = null, mapBuilt = false, rot = null, mapBox = null, ctr = null, userMk = null, lineA = null, lineB = null, kMk = null, tileErr = 0, tileOk = 0, mapErr = null, lastDispMap = null, ro = null;
  const banner = h('div.qb-banner', ico('route'), h('span', 'طابق الخط الذهبي مع الشوارع والمباني حولك'));
  const mInfo = h('div.qb-minfo');
  const mHint = h('div.qb-mhint.hide');
  const mStatus = h('div.qb-ms');
  const btns = h('div.qb-ctl');
  mPane.append(h('div.qb-mapwrap', banner, mHint, btns), mInfo);
  mapBox = mPane.querySelector('.qb-mapwrap');

  /* --- painting --- */
  const paintInfo = ()=>{
    bearN.replaceChildren(h('b', deg(qd)), h('div.small.muted', cardinal(qd))); distN.textContent = fmtInt(dist) + ' كم';
    locN.textContent = (st.live ? 'موقعك الحالي' : st.name || 'الموقع المحفوظ') + (st.acc ? ' • دقة ±' + M.n(Math.round(st.acc)) + ' م' : '');
    mInfo.replaceChildren(h('div.qb-mi', h('div.qb-mb', deg(qd)), h('div.qb-mt', 'اتجاه القبلة')), h('div.qb-md'), h('div.qb-mi', h('div.qb-mb', fmtInt(dist)), h('div.qb-mt', 'كم إلى الكعبة')), h('div.qb-md'), h('div.qb-mi', h('div.qb-mb.qb-hd', hasSensor && disp != null ? deg(disp) : '—'), h('div.qb-mt', 'اتجاهك الآن')), mStatus);
    kg.setAttribute('transform', 'rotate(' + qd.toFixed(2) + ' 160 160)');
  };
  const paintMode = ()=>{
    enableBtn.classList.toggle('hide', hasSensor || !noSensor);
    root.classList.toggle('qb-nosensor', noSensor);
    if(noSensor){
      status.replaceChildren(h('div', 'لا توجد بوصلة في هذا الجهاز'), h('div.qb-ss', 'وجّه الجهاز نحو ' + deg(qd) + ' من الشمال (' + cardinal(qd) + ')'));
      status.classList.remove('ok');
      headTxt.textContent = deg(qd); headSub.textContent = 'زاوية القبلة';
      cPane.classList.add('qb-static');
      mStatus.textContent = 'لا توجد بوصلة: الخريطة موجّهة نحو الشمال والخط الذهبي يبيّن اتجاه القبلة.';
      if(map) applyRot(0);
    } else cPane.classList.remove('qb-static');
    paintBtns();
  };
  const hints = ()=>{
    const msgs = [];
    if(hasSensor && tilted) msgs.push('ضع الجهاز أفقيًا لقراءة أدق');
    if(hasSensor && (accBad || jitter > 4)) msgs.push('حرّك الجهاز على شكل ٨ لمعايرة البوصلة');
    const t = msgs.join(' • ');
    hint.replaceChildren(...(t ? [ico('warn'), h('span', t)] : [])); hint.classList.toggle('hide', !t);
    mHint.replaceChildren(...(t ? [ico('warn'), h('span', t)] : [])); mHint.classList.toggle('hide', !t);
  };
  let hintT = 0;
  function frame(){
    if(gone) return; raf = requestAnimationFrame(frame);
    if(target == null) return;
    if(disp == null){ disp = target; cum = target; render(); }
    const d = delta(disp, target);
    if(Math.abs(d) > .02){ disp = norm(disp + d * .2); cum += d * .2; render(); }
    const now = performance.now(); if(now - hintT > 600){ hintT = now; hints(); }
  }
  function render(){
    if(tab === 'compass' || !noSensor){
      dialSvg.style.transform = 'rotate(' + (-cum).toFixed(2) + 'deg)';
      headTxt.textContent = deg(disp); headSub.textContent = cardinal(disp);
    }
    const diff = delta(disp, qd), ok = Math.abs(diff) <= (aligned ? 5 : 3);
    if(ok && !aligned) M.haptic(40);
    aligned = ok; root.classList.toggle('aligned', ok);
    status.classList.toggle('ok', ok);
    status.textContent = ok ? 'أنت تتجه نحو القبلة' : (diff > 0 ? 'استدر يمينًا ' : 'استدر يسارًا ') + M.cnt(Math.round(Math.abs(diff)), 'درجة', true);
    mStatus.textContent = ok ? 'أنت تتجه نحو القبلة' : (diff > 0 ? 'استدر يمينًا ' : 'استدر يسارًا ') + M.n(Math.round(Math.abs(diff))) + '°';
    mStatus.classList.toggle('ok', ok);
    const mh = mInfo.querySelector('.qb-hd'); if(mh) mh.textContent = deg(disp);
    if(map) applyRot(disp);
  }

  /* --- map --- */
  function applyRot(hd){
    if(!rot) return;
    const r = headUp && hasSensor ? hd : 0;
    rot.style.transform = 'rotate(' + (-r).toFixed(2) + 'deg)';
    rot.style.setProperty('--hd', r.toFixed(2));
    if(userMk){ const e = userMk.getElement(); if(e) { const s = e.querySelector('.qb-cone'); if(s) s.style.transform = 'rotate(' + (hasSensor ? hd : 0).toFixed(1) + 'deg)'; e.classList.toggle('nosens', !hasSensor); } }
  }
  function sizeRot(){
    if(!rot || !mapBox) return; const w = mapBox.clientWidth, hh = mapBox.clientHeight; if(!w) return;
    const s = Math.ceil(Math.hypot(w, hh)) + 40;
    rot.style.width = rot.style.height = s + 'px'; rot.style.left = ((w - s) / 2) + 'px'; rot.style.top = ((hh - s) / 2) + 'px';
    if(map && map._loaded){ map.invalidateSize(false); if(headUp && hasSensor) map.setView([st.lat, st.lng], map.getZoom(), {animate:false}); }
  }
  function paintBtns(){
    if(!btns.isConnected && !mapBuilt) return;
    const mk = (ic, label, f, cls)=>h('button.qb-b.sq' + (cls || ''), {'aria-label':label, title:label, onclick:()=>{ M.haptic(6); f(); }}, ico(ic));
    const z = h('div.qb-z', h('button.qb-b.sq', {'aria-label':'تكبير', onclick:()=>map && map.zoomIn()}, '+'), h('button.qb-b.sq', {'aria-label':'تصغير', onclick:()=>map && map.zoomOut()}, '−'));
    btns.replaceChildren(z, h('div.qb-r',
      hasSensor ? mk(headUp ? 'headup' : 'northup', headUp ? 'التوجيه نحو الشمال' : 'التوجيه حسب اتجاهي', ()=>{ headUp = !headUp; if(map){ headUp ? map.dragging.disable() : map.dragging.enable(); } applyRot(disp == null ? 0 : disp); sizeRot(); paintBtns(); }, headUp ? '.on' : '') : null,
      mk('fit', 'المسار كاملًا', fitAll), mk('locate', 'موقعي', locate, '.loc')));
  }
  function fitAll(){ if(!map) return; headUp = false; map.dragging.enable(); applyRot(0); sizeRot(); try{ map.fitBounds(window.L.latLngBounds(greatCircle(st.lat, st.lng)), {padding:[50, 50], maxZoom:8}); }catch(e){} paintBtns(); }
  function locate(){
    if(!navigator.geolocation){ M.toast('تحديد الموقع غير متاح على هذا الجهاز'); return; }
    M.toast('جارٍ تحديد موقعك…');
    navigator.geolocation.getCurrentPosition(p=>{
      if(gone) return;
      st.lat = p.coords.latitude; st.lng = p.coords.longitude; st.acc = p.coords.accuracy; st.live = true;
      qd = bearing(st.lat, st.lng, K.lat, K.lng); dist = distKm(st.lat, st.lng, K.lat, K.lng); paintInfo(); redrawLine();
      if(map){ headUp = hasSensor; headUp ? map.dragging.disable() : map.dragging.enable(); map.setView([st.lat, st.lng], Math.max(map.getZoom(), 16), {animate:true}); paintBtns(); }
    }, ()=>M.toast('تعذّر تحديد موقعك. فعّل الموقع وامنح التطبيق الإذن.'), {enableHighAccuracy:true, timeout:15000, maximumAge:30000});
  }
  function redrawLine(){
    if(!map) return; const pts = greatCircle(st.lat, st.lng);
    lineA.setLatLngs(pts); lineB.setLatLngs(pts); userMk.setLatLng([st.lat, st.lng]); kMk.setLatLng([K.lat, pts[pts.length - 1][1]]);
  }
  function buildMap(){
    if(mapBuilt) return; mapBuilt = true;
    mapBox.classList.add('loading');
    loadLeaflet().then(()=>{
      if(gone) return;
      const L = window.L;
      rot = h('div.qb-rot'); mapBox.prepend(rot);
      const el = h('div.qb-leaf'); rot.append(el);
      mapBox.classList.toggle('dark', isDark());
      map = L.map(el, {zoomControl:false, attributionControl:true, zoomSnap:.5, minZoom:2, maxZoom:19, dragging:!(headUp && hasSensor), rotate:false});
      map.attributionControl.setPrefix(false); sizeRot();
      const tl = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap', referrerPolicy:'origin', crossOrigin:false});
      tl.on('tileload', ()=>{ tileOk++; mapBox.classList.add('tiles'); mapErr && mapErr.remove(); mapErr = null; });
      tl.on('tileerror', ()=>{ if(++tileErr >= 4 && !tileOk && !mapErr){ mapErr = h('div.qb-err.low', h('b', 'تعذّر تحميل الخريطة — الخط الذهبي ما زال صحيحًا'), h('button.btn.tonal.sm', {onclick:()=>{ tileErr = 0; mapErr && mapErr.remove(); mapErr = null; tl.redraw(); }}, 'إعادة المحاولة')); mapBox.append(mapErr); } });
      tl.addTo(map);
      const pts = greatCircle(st.lat, st.lng);
      lineA = L.polyline(pts, {color:'#ffffff', weight:8, opacity:.9, lineCap:'round'}).addTo(map);
      lineB = L.polyline(pts, {color:'#e0a800', weight:4.5, opacity:1, lineCap:'round'}).addTo(map);
      userMk = L.marker([st.lat, st.lng], {interactive:false, zIndexOffset:900, icon:L.divIcon({className:'qb-um', iconSize:[110, 110], iconAnchor:[55, 55], html:'<svg class="qb-cone" viewBox="-55 -55 110 110"><defs><radialGradient id="qbcg" r="1"><stop offset="0" stop-color="currentColor" stop-opacity=".6"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs><path d="M0 0L-34 -52A62 62 0 0 1 34 -52Z" fill="url(#qbcg)"/></svg><i></i>'})}).addTo(map);
      kMk = L.marker([K.lat, pts[pts.length - 1][1]], {interactive:false, zIndexOffset:800, icon:L.divIcon({className:'qb-km', iconSize:[60, 74], iconAnchor:[30, 54], html:'<div class="qb-kc"><u></u><b>الكعبة</b></div>'})}).addTo(map);
      sizeRot(); map.setView([st.lat, st.lng], 17, {animate:false}); if(headUp && hasSensor) map.dragging.disable();
      applyRot(disp == null ? 0 : disp); paintBtns(); paintMode();
      mapBox.classList.remove('loading');
      ro = new ResizeObserver(()=>{ sizeRot(); }); ro.observe(mapBox);
      setTimeout(sizeRot, 150); setTimeout(sizeRot, 500);
    }).catch(()=>{ mapBuilt = false; mapBox.classList.remove('loading'); mapBox.append(h('div.qb-err', h('b', 'تعذّر تحميل الخريطة'), h('button.btn.tonal.sm', {onclick:()=>{ mapBox.querySelectorAll('.qb-err').forEach(x=>x.remove()); buildMap(); }}, 'إعادة المحاولة'))); });
  }

  function show(v){
    tab = v; cPane.classList.toggle('on', v === 'compass'); mPane.classList.toggle('on', v === 'map');
    if(v === 'map'){ buildMap(); setTimeout(sizeRot, 60); }
    M.haptic(6);
  }

  const view = M.openView({id:'qibla', title:'اتجاه القبلة', nopad:true, onClose:()=>{ gone = true; cancelAnimationFrame(raf); sensor.stop(); subs.forEach(f=>{ try{ f(); }catch(e){} }); try{ ro && ro.disconnect(); }catch(e){} if(map) setTimeout(()=>{ try{ map.stop(); map.remove(); }catch(e){} }, 400); }});
  view.body.append(root);
  paintInfo(); paintBtns(); show(tab);
  paintMode();
  raf = requestAnimationFrame(frame);
  sensor.start().then(r=>{ if(r === 'denied'){ noSensor = true; paintMode(); M.toast('لم يُمنح إذن مستشعر الاتجاه'); } });
  setTimeout(()=>{ if(!gone && !sensor.got()){ noSensor = true; paintMode(); } }, 2500);
  subs.push(M.on('viewclose', ()=>{}) || (()=>{}));
  return view;
}


/* ---------- live mini compass on the prayer/home card ---------- */
M.qiblaMini = function(card){
  const box = card && card.querySelector('.mini-compass'); if(!box) return;
  const qd = norm(+M.qiblaDeg()), decl = +M.store.get('qibla2:decl', 0) || 0;
  box.innerHTML = '<svg viewBox="0 0 80 80"><g class="qm-dial"><circle cx="40" cy="40" r="37" class="qm-ring"/><text x="40" y="12" font-size="9" text-anchor="middle" fill="currentColor" opacity=".6">ش</text><g class="qm-need" style="transform:rotate(' + qd + 'deg);transform-origin:40px 40px"><path d="M40 10 L47 42 L40 38 L33 42Z"/></g></g></svg>';
  const dial = box.querySelector('.qm-dial'); dial.style.transformOrigin = '40px 40px';
  const lab = h('div.tiny.qm-ok.hide', 'أنت على اتجاه القبلة ✓'); const grow = card.querySelector('.grow'); if(grow) grow.append(lab);
  const ios = typeof DeviceOrientationEvent !== 'undefined' && !!DeviceOrientationEvent.requestPermission;
  let target = null, disp = null, ok = false, raf = 0, on = false, perm = !ios || M.store.get('qibla2:perm', '') === 'granted';
  const sensor = makeSensor(d=>{ target = norm(d.heading + decl); if(!raf) raf = requestAnimationFrame(tick); });
  function tick(){
    raf = 0; if(!on || target == null) return;
    if(disp == null) disp = target;
    const d = delta(disp, target); disp = norm(disp + d * .25);
    dial.style.transform = 'rotate(' + (-disp).toFixed(2) + 'deg)';
    const a = Math.abs(delta(disp, qd)) <= (ok ? 5 : 3);
    if(a !== ok){ ok = a; card.classList.toggle('qm-aligned', ok); lab.classList.toggle('hide', !ok); }
    if(Math.abs(d) > .05) raf = requestAnimationFrame(tick);
  }
  const stop = ()=>{ if(!on) return; on = false; sensor.stop(); cancelAnimationFrame(raf); raf = 0; };
  const start = ()=>{ if(on || !perm) return; on = true; sensor.start(); };
  const check = ()=>{
    if(!card.isConnected){ stop(); clearInterval(iv); document.removeEventListener('visibilitychange', check); return; }
    const vis = !document.hidden && card.offsetParent !== null && !(M.views && M.views.length) && !document.querySelector('#sheet-root .sheet, #sheet-root .dialog');
    vis ? start() : stop();
  };
  const iv = setInterval(check, 700); document.addEventListener('visibilitychange', check); check();
  card.addEventListener('click', ()=>{ if(ios && !perm){ perm = true; M.store.set('qibla2:perm', 'granted'); sensor.start().then(r=>{ if(r === 'denied'){ perm = false; M.store.set('qibla2:perm', ''); } }); } }, true);
};

/* ---------- registration (falls back to the old screens if anything throws) ---------- */
const safe = tab=>()=>{ try{ return openV2(tab); }catch(e){ console.error(e); const f = tab === 'map' ? oldMap : oldQibla; if(f) return f(); } };
M.openQibla = safe('compass'); M.openQiblaMap = safe('map'); M.openQiblaV2 = openV2;
try{ M.addSection({id:'qibla', title:'القبلة', icon:'s:qibla', group:'الصلاة والمواسم', fn:safe('compass')}); }catch(e){ console.error(e); }
})();
