/* Global floating "now playing" circle: progress ring + glyph + equalizer. Tap = mini controls, drag = move (snaps to the left/right edge). Shows for Quran recitation, radio and library sounds on every screen. */
(function(){
'use strict';
const M = window.M, h = M.h;
const SZ = 56, RING = 2 * Math.PI * 26.5;
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
  pill = h('div.nowplaying.hide',
    h('button.np-art', {'aria-label':'تصغير المشغّل', onclick:()=>setOpen(false)}, eq()),
    h('div.np-tx', h('div.np-t'), h('div.np-s')),
    h('div.np-ctl',
      h('button.icon-btn.np-prev', {'aria-label':'السابق', onclick:()=>cur && cur.prev && cur.prev()}, M.ic('prev')),
      h('button.np-pp', {'aria-label':'تشغيل / إيقاف', onclick:()=>{ cur && cur.toggle && cur.toggle(); setTimeout(render, 60); }}, M.ic('pause')),
      h('button.icon-btn.np-next', {'aria-label':'التالي', onclick:()=>cur && cur.next && cur.next()}, M.ic('next'))),
    h('button.icon-btn.np-x', {'aria-label':'إيقاف وإغلاق المشغّل', onclick:()=>{ const c = cur; setOpen(false); c && c.stop && c.stop(); setTimeout(render, 60); }}, M.ic('close')),
    h('div.np-tmr', h('button.np-chip', {'aria-label':'إيقاف تلقائي', onclick:timerSheet}, M.ic('clock'), h('span.np-chip-t', 'إيقاف تلقائي')),
      h('button.np-chip-x.hide', {'aria-label':'إلغاء الإيقاف التلقائي', onclick:cancelStop}, M.ic('close'))));
  pill.addEventListener('pointerdown', ()=>armAuto(), true);
  /* the collapsed circle */
  el = h('div.nbnp.hide', {dataset:{side:S.s}},
    h('div.nbnp-bg'),
    h('span.nbnp-rw', {html:'<svg class="nbnp-ring" viewBox="0 0 56 56" aria-hidden="true"><circle class="nbnp-trk" cx="28" cy="28" r="26.5"/><circle class="nbnp-prog" cx="28" cy="28" r="26.5"/></svg>'}),
    h('button.nbnp-disc', {'aria-label':'فتح المشغّل — اسحب لتحريكه', 'aria-expanded':'false'}, h('span.nbnp-gl'), eq()));
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
  pill.querySelector('.np-pp').innerHTML = M.icon(cur.playing ? 'pause' : 'play');
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
