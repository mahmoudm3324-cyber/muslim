/* Global floating "now playing" circle: progress ring + glyph + equalizer. Tap = mini controls, drag = move (snaps to the left/right edge). Shows for Quran recitation, radio and library sounds on every screen. */
(function(){
'use strict';
const M = window.M, h = M.h;
const SZ = 56, RING = 2 * Math.PI * 26.5;
let lgPaint = ()=>{};
let el, pill, last = null, cur = null, sig = '', open = false, autoT = null, dragging = false, tick = null, chipT = null, ay = null, sl = null;
const S = {s:'l', y:null};   // physical side + vertical position as a fraction of the app height
const radioEl = ()=>M.radio && M.radio.el;
const sndName = id=>{ for(const [i, n] of (M.ADHANS || [])) if(i === id) return n; for(const [, items] of (M.VOICES || [])) for(const [i, n] of items) if(i === id) return n; return 'مقطع صوتي'; };
let sndId = null;
const clamp = (v, a, b)=>Math.max(a, Math.min(b, v));

function state(){
  const P = M.player, r = radioEl();
  const list = [];
  if(P && P.s && (P.playing || P.a && !P.a.ended && P.a.currentSrc)) list.push({k:'quran', playing:!!P.playing && !P.a.paused, title:'سورة '+M.sname(P.s)+' • آية '+M.arNum(P.ayah), sub:((M.RECITERS || []).find(x=>x[0] === M.cfg.reciter) || [])[1] || 'تلاوة', glyph:'s:mushaf', toggle:()=>P.toggle(), stop:()=>P.stop(), prev:()=>P.prev(), next:()=>P.next(),
    prog:()=>{ try{ const n = M.Q.surahs[P.s - 1].n, q = M.audioPos ? M.audioPos(P.a) : {t:P.a.currentTime, d:P.a.duration}, f = q.d > 0 && isFinite(q.d) ? Math.min(1, q.t / q.d) : 0; return ((P.ayah - 1) + f) / n; }catch(e){ return 0; } }});
  if(M.radio && M.radio.cur && r) list.push({k:'radio', playing:!r.paused, title:M.radio.cur.name, sub:'إذاعة مباشرة', glyph:'s:radio', toggle:()=>{ if(r.paused) r.play().catch(()=>{}); else r.pause(); }, stop:()=>M.radioStop(), prog:null});
  if(sndId) list.push({k:'sound', playing:true, title:sndName(sndId), sub:'المكتبة الصوتية', glyph:'s:minaret', stop:()=>M.stopSound(), prog:null});
  if(!list.length) return null;
  return list.find(x=>x.k === last && x.playing) || list.find(x=>x.playing) || list.find(x=>x.k === last) || list[0];
}

/* ---- position ---- */
function loadPos(){
  const p = M.store.get('npPos2', null), dflt = M.cfg.npSide === 'r' ? 'r' : 'l';
  S.s = p && (p.s === 'l' || p.s === 'r') ? p.s : dflt;
  S.y = p && isFinite(p.y) ? clamp(p.y, 0, 1) : null;
}
function limits(){
  return M.nbLimits ? M.nbLimits(SZ) : {W:innerWidth, H:innerHeight, pad:8, minX:8, maxX:innerWidth - SZ - 8, minY:20, maxY:innerHeight - SZ - 90, barOn:true};
}
function xy(){
  const L = limits();
  const y = (S.y == null ? .74 : S.y) * L.H;
  return {x:S.s === 'l' ? L.minX : L.maxX, y:clamp(y, L.minY, L.maxY), L};
}
function place(animate){
  if(!el) return;
  const p = xy();
  el.classList.toggle('nb-anim', !!animate);
  el.style.transform = 'translate('+Math.round(p.x)+'px,'+Math.round(p.y)+'px)';
  el.dataset.side = S.s;
  /* the panel opens towards the middle of the screen and must fit in the space that is left */
  el.style.setProperty('--nbnp-pw', Math.max(160, Math.min(260, p.L.W - SZ - 8 - 2 * p.L.pad - 6))+'px');
}
let dimT = null;
function wake(){
  if(!el) return; el.classList.remove('dim'); clearTimeout(dimT);
  if(M.cfg.bubbleDim === false) return;
  dimT = setTimeout(()=>{ if(el && !open && !dragging) el.classList.add('dim'); }, 3600);
}
function save(){ M.store.set('npPos2', {s:S.s, y:S.y}); }
M.npReset = function(){ M.store.set('npPos2', null); loadPos(); if(el) setOpen(false); place(true); M.floaters && M.floaters.resolve('np'); };

/* ---- open = the classic player pill (as in v1.0.5); closed = the floating circle ---- */
function setOpen(v){
  open = !!v && !!cur; clearTimeout(autoT);
  if(!el) return;
  el.classList.toggle('open', open);
  pill.classList.toggle('hide', !open);
  document.documentElement.classList.toggle('has-np', open);
  document.documentElement.classList.toggle('np-mini', !!cur && !open);
  el.querySelector('.nbnp-disc').setAttribute('aria-expanded', open ? 'true' : 'false');
  if(open){ armAuto(); chip(); } else { clearInterval(chipT); chipT = null; }
  if(open && !chipT) chipT = setInterval(chip, 1000);
  if(!open){ place(false); wake(); } else { el.classList.remove('dim'); clearTimeout(dimT); }
}
/* the open player shrinks to the circle a few seconds after the last touch */
function armAuto(){
  clearTimeout(autoT);
  if(!open || M.cfg.npAuto === false) return;
  autoT = setTimeout(()=>{ if(cur && cur.playing && open && !M.$('#sheet-root .sheet')) setOpen(false); }, 5000);
}

/* ---- stop scheduling: end of ayah (own, via the player's audio element) + M.sleepTimer for time / end of surah ---- */
function cancelAyah(){ if(ay){ clearInterval(ay.t); ay = null; } chip(); }
function startAyah(){
  const P = M.player; if(!P || !P.s) return;
  if(M.sleepTimer) M.sleepTimer.stop();
  cancelAyah();
  ay = {s:P.s, a:P.ayah, t:setInterval(()=>{
    const a = P.a;
    if(!P.s || (P.s !== ay.s || P.ayah !== ay.a)){ finishAyah(); return; }       // already moved on: stop right away
    const q = M.audioPos ? M.audioPos(a) : {t:a.currentTime, d:a.duration};
    if(q.d > 0 && q.d - q.t < 0.18) finishAyah();
  }, 100)};
  chip();
}
function finishAyah(){
  clearInterval(ay.t); ay = null;
  try{ M.player.a.pause(); M.player.playing = false; M.emit('player', M.player); }catch(e){}
  M.toast('تم إيقاف التلاوة عند نهاية الآية'); chip(); render();
}
M.on('sleep', st=>{ sl = st || null; if(st) cancelAyah(); else chip(); });
function chip(){
  if(!pill) return;
  const box = pill.querySelector('.np-tmr'), act = !!ay || !!sl || !!(M.sleepTimer && M.sleepTimer.active);
  box.classList.toggle('on', act);
  const lb = box.querySelector('.np-chip-t');
  let t = 'إيقاف تلقائي';
  if(ay) t = 'يتوقف عند نهاية الآية';
  else if(act){
    const mode = sl ? sl.mode : null, end = sl ? sl.end : (M.sleepTimer ? M.sleepTimer.end : 0);
    if(mode === 'surah') t = 'يتوقف عند نهاية السورة';
    else { const left = Math.max(0, Math.round((end - Date.now()) / 1000)); t = 'يتوقف بعد '+M.n(M.pad(Math.floor(left / 60))+':'+M.pad(left % 60)); }
  }
  if(lb.textContent !== t) lb.textContent = t;
  box.querySelector('.np-chip-x').classList.toggle('hide', !act);
}
function cancelStop(){ cancelAyah(); if(M.sleepTimer) M.sleepTimer.stop(); chip(); }
function timerSheet(){
  const quran = cur && cur.k === 'quran', c = h('div.list.card'), close = ()=>sh.close();
  const add = (icon, title, fn)=>c.append(M.item({icon, title, onClick:()=>{ close(); fn(); chip(); }, trail:M.ic('fwd')}));
  if(quran){
    add('quran', 'عند نهاية الآية الحالية', startAyah);
    add('quran', 'عند نهاية السورة', ()=>{ cancelAyah(); M.sleepTimer && M.sleepTimer.start(0, 'surah'); M.toast('سيتوقف التشغيل عند نهاية السورة'); });
  }
  [10, 15, 30, 45, 60].forEach(m=>add('clock', 'بعد '+M.cnt(m, 'دقيقة', true), ()=>{ cancelAyah(); if(M.sleepTimer){ M.sleepTimer.start(m, 'time'); M.toast('سيتوقف التشغيل بعد '+M.cnt(m, 'دقيقة', true)); } }));
  add('moon', 'مؤقت النوم', ()=>M.openSleepTimer && M.openSleepTimer());
  const sh = M.sheet({title:'إيقاف تلقائي', content:c});
}

function build(){
  loadPos();
  const eq = ()=>h('div.np-eq', h('i'), h('i'), h('i'), h('i'));
  /* the classic expanded pill (v1.0.5 look and behaviour) + the stop-scheduling row */
  /* 3.11 «Liquid Glass»: a frosted pill — the reciter on one side, prev / the glass play button / next in the middle,
     speed and repeat on the other side, and the time with a scrubber under them. A tap anywhere else folds it into the orb. */
  const SV = (d, fill)=>'<svg viewBox="0 0 24 24" aria-hidden="true"' + (fill ? ' fill="currentColor"' : ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"') + '>' + d + '</svg>';
  const ICP = '<path d="M7 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 7 5.5z"/>', ICS = '<rect x="6.5" y="6.5" width="11" height="11" rx="2.4"/>';
  pill = h('div.nowplaying.np2.lg.hide',
    h('div.lg-pop', {role:'dialog', 'aria-label':'اختيار القارئ'}),
    h('div.np2-top',
      h('button.np-art', {'aria-label':'تصغير المشغّل', onclick:()=>setOpen(false)}, h('span.np2-gl'), eq()),
      h('div.np-tx', h('div.np-t'), h('div.np-s')),
      h('div.np-tmr', h('button.np-chip', {'aria-label':'إيقاف تلقائي', onclick:timerSheet}, M.ic('clock'), h('span.np-chip-t', 'إيقاف تلقائي')),
        h('button.np-chip-x.hide', {'aria-label':'إلغاء الإيقاف التلقائي', onclick:cancelStop}, M.ic('close'))),
      h('button.icon-btn.np-x', {'aria-label':'إيقاف وإغلاق المشغّل', onclick:()=>{ const c = cur; setOpen(false); c && c.stop && c.stop(); setTimeout(render, 60); }}, M.ic('close'))),
    h('div.lg-row',
      h('button.lg-rec', {'aria-label':'القارئ', 'aria-expanded':'false', onclick:e=>{ e.stopPropagation(); recPop(); }}, h('span.lg-rec-t')),
      h('div.np-ctl',
        h('button.lg-ib.np-prev', {'aria-label':'السابق', onclick:()=>cur && cur.prev && cur.prev(), html:SV('<path d="M11 18V6l-8.5 6L11 18zm.5-6 8.5 6V6l-8.5 6z"/>', 1)}),
        h('button.lg-glass.np-pp', {'aria-label':'تشغيل / إيقاف', onclick:()=>{ cur && cur.toggle && cur.toggle(); setTimeout(render, 60); }},
          h('span.lg-ic', {html:SV(ICS, 1).replace('<svg', '<svg class="lg-stop"') + SV(ICP, 1).replace('<svg', '<svg class="lg-play"')})),
        h('button.lg-ib.np-next', {'aria-label':'التالي', onclick:()=>cur && cur.next && cur.next(), html:SV('<path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>', 1)})),
      h('div.lg-right',
        h('button.lg-speed', {'aria-label':'سرعة التلاوة', onclick:e=>{ e.stopPropagation(); const L = [0.75, 1, 1.25, 1.5, 2], v = M.cfg.speed || 1; const nx = L[(L.indexOf(v) + 1) % L.length] || 1; M.player.setSpeed(nx); paintLg(); M.haptic && M.haptic(6); }}),
        h('button.lg-ib.lg-rep', {'aria-label':'تكرار الآية', onclick:e=>{ e.stopPropagation(); const L = [1, 2, 3, 5, 0], v = M.cfg.repeat == null ? 1 : M.cfg.repeat; M.save('repeat', L[(L.indexOf(v) + 1) % L.length]); paintLg(); M.haptic && M.haptic(6); },
          html:SV('<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>')}, h('span.lg-badge')))),
    h('div.lg-prog', h('span.lg-t', '00:00'), h('div.np2-prog', h('i', h('b'))), h('span.lg-d', '00:00')));
  const prog = pill.querySelector('.np2-prog');
  /* the scrubber: drag to seek inside the verse (or the track) */
  prog.addEventListener('pointerdown', e=>{
    const P = M.player; if(!cur || cur.k !== 'quran' || !P || !P.a) return;
    e.stopPropagation(); prog.classList.add('drag');
    const seek = ev=>{ const r0 = prog.getBoundingClientRect(), f = Math.max(0, Math.min(1, (ev.clientX - r0.left) / r0.width));
      try{ const q = M.audioPos ? M.audioPos(P.a) : {t:P.a.currentTime, d:P.a.duration}; if(q.d > 0 && isFinite(q.d)){ const base = P.a.currentTime - q.t; P.a.currentTime = base + f * q.d; } }catch(_){}
      prog.firstChild.style.width = (f * 100) + '%'; };
    seek(e); try{ prog.setPointerCapture(e.pointerId); }catch(_){}
    const mv = ev=>seek(ev), up = ()=>{ prog.classList.remove('drag'); prog.removeEventListener('pointermove', mv); prog.removeEventListener('pointerup', up); prog.removeEventListener('pointercancel', up); };
    prog.addEventListener('pointermove', mv); prog.addEventListener('pointerup', up); prog.addEventListener('pointercancel', up);
  });
  function recPop(){
    const pop = pill.querySelector('.lg-pop'), btn = pill.querySelector('.lg-rec'), on = !pop.classList.contains('open');
    btn.setAttribute('aria-expanded', String(on));
    if(!on){ pop.classList.remove('open'); return; }
    pop.replaceChildren(h('div.lg-pop-h', h('b', 'اختر القارئ'), h('button.lg-ib', {'aria-label':'إغلاق', onclick:e=>{ e.stopPropagation(); pop.classList.remove('open'); }}, M.ic('close'))),
      h('div.lg-pop-g', ...(M.RECITERS || []).map(r0=>h('button.lg-opt' + (r0[0] === M.cfg.reciter ? '.on' : ''), {onclick:e=>{ e.stopPropagation();
        M.save('reciter', r0[0]); pop.classList.remove('open'); const P = M.player; if(P && P.s){ P.play(P.s, P.ayah); } paintLg(); render(); M.toast && M.toast('القارئ: ' + r0[1]); }}, r0[1]))));
    pop.classList.toggle('below', pill.getBoundingClientRect().top < innerHeight * .45);
    pop.classList.add('open');
  }
  function paintLg(){
    const q = cur && cur.k === 'quran';
    pill.classList.toggle('lg-live', !q);
    const rc = ((M.RECITERS || []).find(x=>x[0] === M.cfg.reciter) || [])[1] || 'القارئ';
    pill.querySelector('.lg-rec-t').textContent = rc.split(' ').slice(0, 2).join(' ');
    const sp = M.cfg.speed || 1; const sb = pill.querySelector('.lg-speed'); sb.textContent = String(sp).replace(/^0\./, '.') + 'x'; sb.classList.toggle('active', sp !== 1);
    const rp = M.cfg.repeat == null ? 1 : M.cfg.repeat, rb = pill.querySelector('.lg-rep');
    rb.classList.toggle('active', rp !== 1); rb.querySelector('.lg-badge').textContent = rp === 0 ? '∞' : M.n(rp);
  }
  lgPaint = paintLg;
  M.on('settings', k=>{ if(k === 'speed' || k === 'repeat' || k === 'reciter') paintLg(); });
  /* a tap anywhere outside the open player folds it into the orb */
  document.addEventListener('pointerdown', e=>{ if(!open || !pill || pill.contains(e.target) || (el && el.contains(e.target)) || e.target.closest('#sheet-root, .sheet, .nb-layer')) return; setOpen(false); }, true);
  pill.addEventListener('pointerdown', ()=>armAuto(), true);
  /* the collapsed circle */
  el = h('div.nbnp.hide', {dataset:{side:S.s}},
    h('div.nbnp-bg'),
    h('span.nbnp-rw', {html:'<svg class="nbnp-ring" viewBox="0 0 56 56" aria-hidden="true"><circle class="nbnp-trk" cx="28" cy="28" r="26.5"/><circle class="nbnp-prog" cx="28" cy="28" r="26.5"/></svg>'}),
    h('button.nbnp-disc', {'aria-label':'فتح المشغّل — اسحب لتحريكه', 'aria-expanded':'false'}, h('span.nbnp-gl'), eq()),
    h('span.nbnp-time', {hidden:true}));
  M.$('#app').append(pill, el);
  const disc = el.querySelector('.nbnp-disc');

  let d0 = null, moved = false;
  disc.addEventListener('pointerdown', e=>{
    if(e.button) return;
    moved = false; wake(); d0 = {x:e.clientX, y:e.clientY, p:xy()};
    try{ disc.setPointerCapture(e.pointerId); }catch(_){}
  });
  disc.addEventListener('pointermove', e=>{
    if(!d0) return;
    const dx = e.clientX - d0.x, dy = e.clientY - d0.y;
    if(!moved && Math.hypot(dx, dy) < 8) return;
    if(!moved){ moved = true; dragging = true; el.classList.remove('nb-anim'); el.classList.add('drag'); }
    const L = d0.p.L, x = clamp(d0.p.x + dx, L.minX, L.maxX), y = clamp(d0.p.y + dy, L.minY, L.maxY);
    el.style.transform = 'translate('+Math.round(x)+'px,'+Math.round(y)+'px)';
    el._cur = {x, y, L};
  });
  const end = e=>{
    if(!d0) return;
    const wasMoved = moved, c = el._cur; d0 = null; moved = false; dragging = false; el.classList.remove('drag');
    if(!wasMoved){ if(e.type === 'pointerup'){ setOpen(true); M.haptic(6); } return; }
    S.s = c.x + SZ / 2 < c.L.W / 2 ? 'l' : 'r'; S.y = c.y / c.L.H; save(); place(true);
    M.floaters && M.floaters.resolve('np');
  };
  disc.addEventListener('pointerup', end); disc.addEventListener('pointercancel', end);
  window.addEventListener('resize', M.debounce(()=>{ if(!el.classList.contains('hide')) place(false); }, 100));
  M.on('settings', k=>{
    if(k === 'npSide'){ S.s = M.cfg.npSide === 'r' ? 'r' : 'l'; save(); place(true); M.floaters && M.floaters.resolve('np'); }
  });
  M.on('viewclose', ()=>setTimeout(()=>place(true), 380));
  if(M.floaters) M.floaters.register('np', {
    visible:()=>!!cur && !open && !el.classList.contains('hide'),
    side:()=>S.s,
    rect:()=>el.getBoundingClientRect(),
    setY(y){ const L = limits(); S.y = y / L.H; save(); place(true); },
    reflow(){ if(cur && !dragging && !open) place(true); }
  });
  /* a document back-press collapses the player first */
  const prevBack = M.onBack;
  M.onBack = function(){ if(open){ setOpen(false); return true; } return prevBack.apply(this, arguments); };
}

function progress(){
  if(!el || !cur) return;
  const c = el.querySelector('.nbnp-prog'), p = cur.prog ? cur.prog() : null;
  el.classList.toggle('ind', p == null);
  if(pill && open){
    const bar = pill.querySelector('.np2-prog'), fmt = x=>{ x = Math.max(0, Math.floor(x || 0)); return M.n(M.pad(Math.floor(x / 60)) + ':' + M.pad(x % 60)); };
    let t = 0, d = 0; const P = M.player;
    if(cur.k === 'quran' && P && P.a){ try{ const q = M.audioPos ? M.audioPos(P.a) : {t:P.a.currentTime, d:P.a.duration}; t = q.t; d = q.d; }catch(e){} }
    const live = !(d > 0 && isFinite(d));
    bar.classList.toggle('ind', live);
    if(!live && !bar.classList.contains('drag')) bar.firstChild.style.width = (clamp(t / d, 0, 1) * 100).toFixed(1) + '%';
    pill.querySelector('.lg-t').textContent = live ? (cur.k === 'radio' ? 'مباشر' : '') : fmt(t);
    pill.querySelector('.lg-d').textContent = live ? '' : fmt(d);
  }
  { const tp = el.querySelector('.nbnp-time'); if(tp){ const P = M.player; let t = 0; try{ if(cur.k === 'quran'){ const q = M.audioPos ? M.audioPos(P.a) : {t:P.a.currentTime}; t = q.t; } }catch(e){} tp.textContent = cur.k === 'quran' ? M.n(M.pad(Math.floor(t / 60)) + ':' + M.pad(Math.floor(t) % 60)) : cur.k === 'radio' ? 'مباشر' : ''; tp.hidden = !tp.textContent; } }
  if(p == null){ c.style.strokeDashoffset = ''; return; }
  c.style.strokeDashoffset = String(RING * (1 - clamp(p, 0, 1)));
}
function render(){
  if(!el) build();
  cur = state();
  const on = !!cur;
  el.classList.toggle('hide', !on);
  if(!on){ if(open) setOpen(false); pill.classList.add('hide'); sig = ''; el._wasHidden = true; el._wasHidden0 = true; document.documentElement.classList.remove('np-mini', 'has-np'); clearInterval(tick); tick = null; cancelAyah(); return; }
  document.documentElement.classList.toggle('np-mini', !open);
  document.documentElement.classList.toggle('has-np', open);
  if(el._wasHidden !== false){ el._wasHidden = false; place(false); M.floaters && setTimeout(()=>M.floaters.resolve('np'), 0); }
  if(cur.playing && open && !pill.classList.contains('playing')) armAuto();   // playback just started
  el.classList.toggle('playing', cur.playing); pill.classList.toggle('playing', cur.playing);
  el.dataset.k = cur.k;
  if(el._wasHidden0 !== false){ el._wasHidden0 = false; wake(); }
  if(!tick) tick = setInterval(progress, 300);
  progress();
  const s = cur.k+'|'+cur.title+'|'+cur.sub+'|'+cur.playing;
  if(s === sig) return; sig = s;
  pill.querySelector('.np-t').textContent = cur.title;
  pill.querySelector('.np-s').textContent = cur.sub;
  el.querySelector('.nbnp-gl').innerHTML = M.icon(cur.playing ? 'pause' : 'play');
  pill.querySelector('.np2-gl').innerHTML = M.icon(cur.glyph || 's:mushaf');
  pill.querySelector('.np-pp').classList.toggle('paused', !cur.playing); lgPaint();
  pill.querySelector('.np-pp').classList.toggle('hide', !cur.toggle);
  pill.querySelector('.np-prev').classList.toggle('hide', !cur.prev);
  pill.querySelector('.np-next').classList.toggle('hide', !cur.next);
}
function bindRadio(){
  const r = radioEl(); if(!r || r._np) return; r._np = 1;
  ['play', 'pause', 'ended', 'emptied'].forEach(e=>r.addEventListener(e, ()=>{ if(e === 'play') last = 'radio'; render(); }));
}
M.on('player', ()=>{ last = 'quran'; render(); });
M.on('radio', ()=>{ last = 'radio'; bindRadio(); render(); });
M.on('sound', id=>{ sndId = id; if(id) last = 'sound'; render(); });
setTimeout(()=>{ try{ if(M.player && M.player.a){ ['play', 'pause', 'ended'].forEach(e=>M.player.a.addEventListener(e, render)); } }catch(e){} render(); }, 1500);
// the older Quran-only mini player is replaced by this one
const st = document.createElement('style'); st.textContent = '.miniplayer{display:none!important}'; document.head.appendChild(st);
})();
