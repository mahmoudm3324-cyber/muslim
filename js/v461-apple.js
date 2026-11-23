/* 4.6.1 motion in the manner of iOS (the «Liquid Glass» look):
   1. Zoom: a page opens out of the tile, row or card that was tapped — it starts at that item's size and place and grows to
      fill the screen — and closes back into it. Used with the glass look («الأساسية») or the «أبل» page style.
   2. The tab bar's pill moves like liquid: it stretches while it travels and settles with a small spring; it swells under
      the finger while a tab is held.
   3. The tab bar shrinks while a page is scrolled down and comes back on scrolling up (or on a tap). */
(function(){
  'use strict';
  const root = document.documentElement;
  const EASE = 'cubic-bezier(.32,.72,0,1)';          // the curve iOS uses for its navigation and sheets
  const calm = ()=>M.cfg.anim === false || matchMedia('(prefers-reduced-motion: reduce)').matches;   // transforms only: kept in the battery-saver look too
  const appleOn = ()=>!calm() && (root.dataset.astyle === 'apple' || ((root.dataset.astyle || 'default') === 'default' && root.dataset.skin === 'glass'));

  /* ---- 1. zoom ---- */
  const SRC = '.tile,.item,.card,.mr-chip,.rel-it,.dl-card,.ch-card,.qx-tools button,.qx-wird,.chip,button,[role=button]';
  let src = null, srcT = 0;
  document.addEventListener('click', e=>{
    const t = e.target && e.target.closest && e.target.closest(SRC);
    if(t && !t.closest('#tabbar,.view-head,.sheet,.pop-root')){ src = t; srcT = performance.now(); }
  }, true);
  const visible = r=>r.width > 12 && r.height > 12 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  const radius = el=>parseFloat(getComputedStyle(el).borderTopLeftRadius) || 14;
  /* where a box sits inside the page, as a transform of the page (uniform scale to the box's width, clipped to its height) */
  function fit(r, vr){
    const s = Math.max(.05, r.width / vr.width);
    return {s, tx:r.left - vr.left, ty:r.top - vr.top, cut:Math.max(0, vr.height - r.height / s)};
  }
  function zoomIn(v){
    if(!appleOn() || !src || performance.now() - srcT > 900 || !src.isConnected) return;
    const s0 = src; src = null;
    const r = s0.getBoundingClientRect(), el = v.el, vr = el.getBoundingClientRect();
    if(!visible(r) || !vr.width || !vr.height) return;
    const f = fit(r, vr), rad = radius(s0);
    el.classList.add('v-zoom');
    el.animate([
      {transformOrigin:'0 0', transform:'translate(' + f.tx + 'px,' + f.ty + 'px) scale(' + f.s.toFixed(4) + ')', clipPath:'inset(0px 0px ' + f.cut.toFixed(1) + 'px 0px round ' + (rad / f.s).toFixed(1) + 'px)', opacity:0},
      {offset:.22, opacity:1},
      {transformOrigin:'0 0', transform:'translate(0px,0px) scale(1)', clipPath:'inset(0px 0px 0px 0px round 0px)', opacity:1}
    ], {duration:480, easing:EASE});
    /* the item it grew from steps back while its page is open */
    const under = document.getElementById('screens');
    if(under && !M.views.some(x=>x !== v && !x.closed)) under.animate([{transform:'scale(1)', filter:'brightness(1)'}, {transform:'scale(.96)', filter:'brightness(.92)'}], {duration:480, easing:EASE, fill:'forwards'}).id = 'apple-under';
    v._zsrc = s0;
    const close0 = v.close;
    v.close = function(){
      if(!v.closed) zoomOut(v);
      return close0.apply(this, arguments);
    };
  }
  function restoreUnder(){
    const under = document.getElementById('screens'); if(!under) return;
    under.getAnimations().filter(a=>a.id === 'apple-under').forEach(a=>{
      const back = under.animate([{transform:'scale(.96)', filter:'brightness(.92)'}, {transform:'scale(1)', filter:'brightness(1)'}], {duration:300, easing:EASE});
      a.cancel(); back.id = 'apple-back';
    });
  }
  function zoomOut(v){
    const el = v.el, s0 = v._zsrc;
    if(!s0 || !s0.isConnected || calm()) return;
    const r = s0.getBoundingClientRect(), vr = el.getBoundingClientRect();
    if(!visible(r) || !vr.width) return;
    const f = fit(r, vr), rad = radius(s0);
    el.animate([
      {transformOrigin:'0 0', transform:'translate(0px,0px) scale(1)', clipPath:'inset(0px 0px 0px 0px round 0px)', opacity:1},
      {offset:.8, opacity:1},
      {transformOrigin:'0 0', transform:'translate(' + f.tx + 'px,' + f.ty + 'px) scale(' + f.s.toFixed(4) + ')', clipPath:'inset(0px 0px ' + f.cut.toFixed(1) + 'px 0px round ' + (rad / f.s).toFixed(1) + 'px)', opacity:0}
    ], {duration:320, easing:EASE, fill:'forwards'});
  }
  /* the screen behind comes forward again once the last page is closed, whichever way it was closed */
  M.on && M.on('viewclose', ()=>{ if(!M.views.length) restoreUnder(); });
  const open1 = M.openView;
  M.openView = function(){
    const v = open1.apply(this, arguments);
    try{ zoomIn(v); }catch(e){ console.warn(e); }
    return v;
  };

  /* ---- 2. the liquid pill ---- */
  const move0 = M.moveLens;
  if(move0){
    M.moveLens = function(animate){
      const lens = document.querySelector('#tabbar .lens');
      const x0 = lens ? parseFloat(lens.style.getPropertyValue('--lens-x')) : NaN, w0 = lens ? parseFloat(lens.style.getPropertyValue('--lens-w')) : NaN;
      move0.apply(this, arguments);
      if(!animate || !lens || calm() || isNaN(x0)) return;
      const x1 = parseFloat(lens.style.getPropertyValue('--lens-x')), w1 = parseFloat(lens.style.getPropertyValue('--lens-w'));
      if(isNaN(x1) || Math.abs(x1 - x0) < 2) return;
      const d = Math.abs(x1 - x0), stretch = Math.min(1.5, 1 + d / 260);
      lens.animate([
        {transform:'translateX(' + x0 + 'px) scale(1,1)', width:w0 + 'px'},
        {offset:.42, transform:'translateX(' + ((x0 + x1) / 2 + (w0 - w1) / 4) + 'px) scale(' + stretch.toFixed(3) + ',' + (2 - stretch * .9).toFixed(3) + ')', width:((w0 + w1) / 2) + 'px'},
        {offset:.78, transform:'translateX(' + (x1 + (x1 > x0 ? 3 : -3)) + 'px) scale(.97,1.03)', width:w1 + 'px'},
        {transform:'translateX(' + x1 + 'px) scale(1,1)', width:w1 + 'px'}
      ], {duration:520, easing:'cubic-bezier(.25,.9,.3,1)'});
    };
  }
  /* held: the pill swells like a drop of glass under the finger */
  document.addEventListener('pointerdown', e=>{
    const t = e.target.closest && e.target.closest('#tabbar .tab.on'); if(!t || calm()) return;
    const lens = document.querySelector('#tabbar .lens'); if(!lens) return;
    lens.classList.add('held');
    const up = ()=>{ lens.classList.remove('held'); removeEventListener('pointerup', up, true); removeEventListener('pointercancel', up, true); };
    addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
  }, true);

  /* ---- 3. the bar shrinks while scrolling down ---- */
  let lastY = 0, acc = 0, mini = false;
  const setMini = on=>{ if(on === mini) return; mini = on; root.classList.toggle('nb-mini', on); };
  document.addEventListener('scroll', e=>{
    const sc = e.target; if(!sc || !sc.classList || !sc.classList.contains('screen')) return;
    if(M.cfg.nbShrink === false || root.dataset.nbmode === 'dock') { setMini(false); return; }
    const y = sc.scrollTop, dy = y - lastY; lastY = y;
    if(y < 60){ acc = 0; setMini(false); return; }
    acc = (dy > 0) === (acc > 0) ? acc + dy : dy;
    if(acc > 36) setMini(true); else if(acc < -24) setMini(false);
  }, true);
  document.addEventListener('click', e=>{ if(mini && e.target.closest && e.target.closest('#tabbar')) setMini(false); }, true);
  M.on && M.on('tab', ()=>{ lastY = 0; acc = 0; setMini(false); });
})();
