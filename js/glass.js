/* Liquid-glass behaviours: press glow, view-open state, edge-swipe back, performance tier. Cheap by design. */
(function(){
const M = window.M, root = document.documentElement;

/* performance tier: auto → low on weak devices; user can force with cfg.fx = 'low' | 'high' */
M.applyFx = function(){
  let t = M.cfg.fx || 'auto';
  if(t === 'auto' && M.isIOS){
    // iPhones/iPads: the glass dock, bars and sheets (mid). A blur behind every card (high) made WKWebView scroll and open pages slowly,
    // so it is now only for those who pick it in Settings. If pages still drop frames, it steps down to the light tier (fxSlow, below).
    t = M.store.get('fxSlow', false) ? 'low' : 'mid';
  } else if(t === 'auto'){
    const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
    const weak = mem <= 4 || cores <= 6;
    t = weak || M.store.get('fxSlow', false) ? 'low' : 'mid';
  }
  root.dataset.fx = t;
};
M.applyFx(); M.on('settings', k=>{ if(k === 'fx' || typeof k === 'object') M.applyFx(); });

/* the real frame pace, measured: (1) which refresh rate the screen runs at (60 / 90 / 120 Hz), (2) whether page transitions keep up.
   If they keep dropping frames while the setting is on "auto", the app quietly moves to the light effects and remembers it. */
(function(){
  let n = 0, last = 0; const ds = [];
  const probe = t=>{ if(last){ ds.push(t - last); } last = t; if(++n < 50) requestAnimationFrame(probe); else {
    ds.sort((a, b)=>a - b); const med = ds[ds.length >> 1] || 16.7, hz = med < 9.5 ? 120 : med < 12.6 ? 90 : 60; root.dataset.hz = hz; M.hz = hz; M.frameMs = 1000 / hz; } };
  setTimeout(()=>requestAnimationFrame(probe), 2500);
  let bad = 0, runs = 0, busy = false;
  const watch = ()=>{
    if(busy || (M.cfg.fx || 'auto') !== 'auto' || root.dataset.fx === 'low' || document.hidden) return; busy = true;
    const f = M.frameMs || 16.7; let prev = 0, drop = 0, cnt = 0; const end = performance.now() + 420;
    const step = t=>{ if(prev){ cnt++; if(t - prev > f * 1.9) drop += Math.round((t - prev) / f) - 1; } prev = t;
      if(t < end) requestAnimationFrame(step); else { busy = false; runs++; if(cnt && drop / (cnt + drop) > .3) bad++; if(runs >= 6){ if(bad >= 4){ M.store.set('fxSlow', true); M.applyFx(); } runs = bad = 0; } } };
    requestAnimationFrame(step);
  };
  const vr = document.getElementById('views'); if(vr) new MutationObserver(watch).observe(vr, {childList:true});
})();

/* press glow position (sets two custom properties only on press) */
let hot = null;
document.addEventListener('pointerdown', e=>{
  if(root.dataset.skin !== 'glass' || root.dataset.fx === 'low') return;
  const el = e.target.closest && e.target.closest('.card,.tile'); if(!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--px', (e.clientX - r.left)+'px'); el.style.setProperty('--py', (e.clientY - r.top)+'px');
  el.classList.add('pressing'); hot = el;
}, {passive:true});
const up = ()=>{ if(hot){ hot.classList.remove('pressing'); hot = null; } };
['pointerup', 'pointercancel', 'pointerleave'].forEach(t=>document.addEventListener(t, up, {passive:true}));

/* data-views: a view is open (parent screen recedes, tab bar tucks away) */
const vroot = document.getElementById('views');
if(vroot){
  const sync = ()=>{ const open = M.views && M.views.some(v=>!v.closed && !v.el.classList.contains('leaving')); root.toggleAttribute('data-views', !!open); };
  new MutationObserver(sync).observe(vroot, {childList:true, subtree:false, attributes:true, attributeFilter:['class']});
  vroot.addEventListener('animationend', sync);
}

/* interactive edge-swipe back (RTL: from the right edge toward the left) */
let sw = null;
document.addEventListener('touchstart', e=>{
  if(root.dataset.skin !== 'glass' || !M.views || !M.views.length || e.touches.length !== 1) return;
  const t = e.touches[0], W = innerWidth, rtl = getComputedStyle(root).direction === 'rtl';
  if(rtl ? t.clientX < W - 24 : t.clientX > 24) return;
  const v = M.views[M.views.length - 1]; if(!v || v.closed || v.onBack) return;
  sw = {v, x0:t.clientX, y0:t.clientY, dx:0, on:false, rtl, t0:Date.now()};
}, {passive:true});
document.addEventListener('touchmove', e=>{
  if(!sw) return; const t = e.touches[0], dx = t.clientX - sw.x0, dy = t.clientY - sw.y0;
  if(!sw.on){ if(Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)){ sw = null; return; } if(Math.abs(dx) < 10) return; sw.on = true; sw.v.el.style.animation = 'none'; sw.v.el.style.transition = 'none'; }
  window.__jsSwipeAt = Date.now();   // the iPhone's own edge gesture leaves this swipe alone
  const k = sw.rtl ? Math.min(0, dx) : Math.max(0, dx); sw.dx = k;
  sw.v.el.style.transform = 'translateX('+k+'px)';
  if(e.cancelable) e.preventDefault();
}, {passive:false});
const end = ()=>{
  if(!sw) return; const s = sw; sw = null; if(!s.on) return;
  const W = innerWidth, el = s.v.el, fast = Math.abs(s.dx) / Math.max(1, Date.now() - s.t0) > .6;
  window.__jsSwipeAt = Date.now();
  el.style.transition = 'transform .24s cubic-bezier(.2,.8,.2,1)';
  if(Math.abs(s.dx) > W * .38 || fast){ el.style.transform = 'translateX('+(s.rtl ? -W : W)+'px)'; setTimeout(()=>{ el.style.visibility = 'hidden'; s.v.close(); }, 230); M.haptic && M.haptic(8); }
  else { el.style.transform = 'none'; setTimeout(()=>{ el.style.transition = ''; el.style.animation = ''; el.style.transform = ''; }, 260); }
};
document.addEventListener('touchend', end, {passive:true}); document.addEventListener('touchcancel', end, {passive:true});
})();
