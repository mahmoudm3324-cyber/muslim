/* 4.6 wide screens and curved edges.
   1. A tablet on its side (or a computer window that is wider than tall) gets a two-column page: the cards of the home and
      prayer screens and the groups of «المزيد» are laid out like a board — each card goes under the shorter column, in order.
      Turning the device animates every card from where it was to where it now sits.
   2. Curved (waterfall) screens: a soft light runs along both bent edges when the app opens and at the adhan — an edge
      light, with its own switch in «الأداء والحركة». */
(function(){
  'use strict';
  const root = document.documentElement;
  const WIDE = matchMedia('(min-width: 980px) and (min-aspect-ratio: 5/4)');
  const ROW = 4;                                   // grid row unit (px): the board is measured in these
  const GAP = 14;                                  // space under a card
  const FULL = '.page-top,.prayer-hero,.home-top';  // across both columns
  const BOARDS = '#screen-home,#screen-prayer,#screen-more .mr-box';
  const calm = ()=>M.cfg.anim === false || matchMedia('(prefers-reduced-motion: reduce)').matches;

  const placed = new WeakMap();                    // element -> {c, r, n} last placement
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(es=>es.forEach(e=>{ const b = e.target.closest(BOARDS); if(b) soon(b); })) : null;
  const mo = typeof MutationObserver === 'function' ? new MutationObserver(ms=>ms.forEach(m=>{ const b = m.target.closest && m.target.closest(BOARDS); if(b) soon(b); })) : null;
  const watched = new WeakSet(), pending = new Set();
  let raf = 0;
  function soon(b){ pending.add(b); if(!raf) raf = requestAnimationFrame(()=>{ raf = 0; const l = [...pending]; pending.clear(); l.forEach(x=>lay(x)); }); }

  const shown = e=>{ const cs = getComputedStyle(e); return cs.display !== 'none' && cs.position !== 'absolute' && cs.position !== 'fixed'; };
  /* a heading travels with what follows it */
  const isHead = e=>e.classList.contains('section-h');

  function lay(b){
    if(!root.hasAttribute('data-wide') || !b.isConnected || !b.offsetWidth) return;
    const kids = [...b.children].filter(shown);
    const colH = [0, 0];
    for(let i = 0; i < kids.length; i++){
      const grp = [kids[i]];
      while(isHead(grp[grp.length - 1]) && i + 1 < kids.length) grp.push(kids[++i]);
      const full = grp.some(e=>e.matches(FULL));
      const c = full ? 0 : (colH[1] < colH[0] - 2 ? 2 : 1);
      let r = full ? Math.max(colH[0], colH[1]) : colH[c - 1];
      grp.forEach((e, k)=>{
        const hgt = e.getBoundingClientRect().height, last = k === grp.length - 1;
        const n = Math.max(1, Math.ceil((hgt + (last ? GAP : 8)) / ROW));
        const p = placed.get(e);
        if(!p || p.c !== c || p.r !== r || p.n !== n){
          e.style.gridColumn = full ? '1 / -1' : String(c);
          e.style.gridRow = (r + 1) + ' / span ' + n;
          placed.set(e, {c, r, n});
        }
        r += n;
      });
      if(full) colH[0] = colH[1] = r; else colH[c - 1] = r;
      grp.forEach(e=>{ if(ro && !watched.has(e)){ watched.add(e); ro.observe(e); } });
    }
  }
  function attach(){
    document.querySelectorAll(BOARDS).forEach(b=>{
      b.classList.add('wb');
      if(!watched.has(b)){ watched.add(b); ro && ro.observe(b); mo && mo.observe(b, {childList:true}); }
      lay(b);
    });
  }
  function detach(){
    document.querySelectorAll('.wb').forEach(b=>{
      b.classList.remove('wb');
      [...b.children].forEach(e=>{ e.style.gridColumn = ''; e.style.gridRow = ''; placed.delete(e); });
    });
  }

  /* FLIP: note where each card is, change the layout, then let each card travel from there */
  function flip(change){
    const sc = document.querySelector('.screen.active');
    const els = sc && !calm() ? [...sc.querySelectorAll(':scope > *, .mr-box > *')].filter(e=>e.offsetParent) : [];
    const before = new Map(els.map(e=>[e, e.getBoundingClientRect()]));
    change();
    els.forEach((e, i)=>{
      const a = before.get(e), z = e.getBoundingClientRect();
      if(!z.width || !a.width) return;
      const dx = a.left - z.left, dy = a.top - z.top, sx = a.width / z.width;
      if(Math.abs(dx) < 2 && Math.abs(dy) < 2 && Math.abs(sx - 1) < .02) return;
      if(z.bottom < -200 || z.top > innerHeight + 200) return;   // off screen: no work
      try{
        e.animate([{transformOrigin:'top right', transform:'translate(' + dx + 'px,' + dy + 'px) scaleX(' + sx.toFixed(3) + ')'},
                   {transformOrigin:'top right', transform:'none'}],
                  {duration:520, delay:Math.min(i, 8) * 18, easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards'});
      }catch(_){}
    });
  }

  function apply(animate){
    const on = WIDE.matches && M.cfg.wideBoard !== false;
    if(on === root.hasAttribute('data-wide')){ if(on) attach(); return; }
    const go = ()=>{ if(on){ root.setAttribute('data-wide', ''); attach(); } else { root.removeAttribute('data-wide'); detach(); } };
    animate ? flip(go) : go();
  }
  M.applyWide = apply;
  (WIDE.addEventListener ? WIDE.addEventListener('change', ()=>apply(true)) : WIDE.addListener(()=>apply(true)));
  M.on && M.on('settings', k=>{ if(k === 'wideBoard') apply(true); if(k === 'edgeLight' || k === 'edge') setTimeout(()=>edge.test(), 400); });
  /* screens are drawn again when data changes: pick the new cards up */
  const again = typeof MutationObserver === 'function' ? new MutationObserver(()=>{ if(root.hasAttribute('data-wide')) attach(); }) : null;
  function watchScreens(){ if(again) document.querySelectorAll('.screen').forEach(s=>again.observe(s, {childList:true})); }
  M.on && M.on('tab', ()=>{ if(root.hasAttribute('data-wide')) requestAnimationFrame(attach); });

  /* ---- 2. the edge light for curved screens ---- */
  const edge = (()=>{
    let last = 0;
    const curved = ()=>{ const cs = getComputedStyle(root); return (parseFloat(cs.getPropertyValue('--edge-l')) || 0) + (parseFloat(cs.getPropertyValue('--edge-r')) || 0) > 0; };
    const allowed = ()=>M.cfg.edgeLight !== false && curved() && !calm() && document.visibilityState === 'visible';
    function play(strong){
      if(!allowed()) return;
      const now = Date.now(); if(now - last < 4000) return; last = now;
      const el = document.createElement('div');
      el.className = 'edge-light' + (strong ? ' strong' : '');
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<i class="el-l"></i><i class="el-r"></i>';
      document.body.appendChild(el);
      setTimeout(()=>el.remove(), strong ? 3400 : 2000);
    }
    return {play, test:()=>{ last = 0; play(true); }};
  })();
  M.edgeLight = edge;
  /* on opening, on coming back after a while, and at the adhan */
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) hiddenAt = Date.now(); else if(hiddenAt && Date.now() - hiddenAt > 60000) setTimeout(()=>edge.play(false), 250); });
  /* the adhan: a stronger light when a prayer time comes in while the app is open */
  let seen = '';
  setInterval(()=>{
    try{
      const n = M.nextPrayer(), pv = n.prev, k = pv.k + '@' + +pv.t;
      if(seen && k !== seen && pv.k !== 'sunrise' && Date.now() - pv.t < 90000) edge.play(true);
      seen = k;
    }catch(_){}
  }, 20000);

  function boot(){ watchScreens(); apply(false); setTimeout(()=>edge.play(false), 900); }
  if(window.M && M.cfg) (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot());
})();
