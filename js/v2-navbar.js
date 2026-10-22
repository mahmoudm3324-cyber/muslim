/* ===== v2 navbar: customisable bottom bar, global floating bubble (fan menu), floater coordination, settings screen ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const BUILTIN = ['home', 'quran', 'prayer', 'adhkar', 'more'];
const MIN = 4, MAX = 7;
const EXTRA_FILL = ['tasbih', 'qibla', 'tracker', 'khatma', 'morning', 'evening', 'duas', 'friday'];
const SELF = 'navbar_cfg';
const root = document.documentElement;
const secOf = id=>(M.SECTIONS || []).find(s=>s[0] === id);
const clamp = (v, a, b)=>Math.max(a, Math.min(b, v));
const num = (v, d)=>{ const x = parseFloat(v); return isFinite(x) ? x : (d || 0); };
const rtl = ()=>getComputedStyle(root).direction === 'rtl';

/* ---------------------------------------------------------------- items ---------------------------------------------------------------- */
function describe(id){
  if(BUILTIN.includes(id) && M.screens && M.screens[id]) return {id, tab:true, label:M.screens[id].label, icon:M.screens[id].icon};
  const s = secOf(id); if(s && id !== SELF) return {id, tab:false, label:s[1], icon:s[2]};
  return null;
}
M.navDescribe = describe;
M.navItems = function(){
  const a = Array.isArray(M.cfg.navItems) ? M.cfg.navItems : [];
  let v = a.filter((x, i)=>a.indexOf(x) === i && describe(x));
  if(v.length < MIN) v = BUILTIN.slice();
  return v.slice(0, MAX);
};
const navMode = ()=>M.cfg.navMode === 'dock' ? 'dock' : 'float';

/* ---------------------------------------------------------------- geometry shared by the floating things ---------------------------------------------------------------- */
let probe = null;
function safe(){
  if(!probe){ probe = h('div', {style:'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:var(--sat,0px) 0 var(--sab,0px) 0'}); document.body.append(probe); }
  const cs = getComputedStyle(probe); return {t:num(cs.paddingTop), b:num(cs.paddingBottom)};
}
/* the app area and the limits an element of `size` px may occupy; the bottom limit sits above the tab bar while the bar is showing */
/* the top edge of a bar pinned to the bottom of the open view (player bar, page controls…), if one sits under the given points */
function barTop(r, xs, y, H){
  let top = Infinity;
  if(!document.elementsFromPoint) return top;
  xs.forEach(x=>{
    for(const e of document.elementsFromPoint(r.left + x, r.top + y)){
      if(e.closest('.nb-bub, .nb-layer, #tabbar')) continue;
      for(let a = e; a && a !== document.body; a = a.parentElement){
        const cs = getComputedStyle(a), p = cs.position, rr = a.getBoundingClientRect();
        const pinned = a.matches('.pg-bar, .sn-nav-bar, .lib-now') || ((p === 'fixed' || p === 'absolute' || p === 'sticky') && rr.width >= r.width * 0.5 && rr.bottom >= r.top + H - 90);
        if(pinned && rr.height < H * 0.35){ top = Math.min(top, rr.top - r.top); break; }
        if(rr.height >= H * 0.6) break;   // reached the page itself
      }
      break;   // only the topmost element counts
    }
  });
  return top;
}
M.nbLimits = function(size){
  const app = M.$('#app'), r = app.getBoundingClientRect(), sf = safe(), cs = getComputedStyle(root);
  const el = num(cs.getPropertyValue('--edge-l')), er = num(cs.getPropertyValue('--edge-r'));
  const W = r.width, H = r.height;
  const viewOpen = !!(M.views && M.views.some(v=>!v.closed));
  let bottom = H - sf.b - 12;
  const nav = M.$('#tabbar'), bar = nav && nav.querySelector('.bar');
  if(!viewOpen && bar && nav.offsetHeight) bottom = Math.min(bottom, nav.offsetTop + bar.offsetTop - 10);
  const pad = 8;
  if(viewOpen) bottom = Math.min(bottom, barTop(r, [el + pad + size / 2, W - er - pad - size / 2], bottom - 8, H) - 10);   // stay above a view's own bottom bar
  return {W, H, pad, minX:el + pad, maxX:W - er - pad - size, minY:sf.t + 10, maxY:Math.max(sf.t + 10, bottom - size), barOn:!viewOpen};
};

/* floaters (bubble, now-playing circle) register here so they never sit on top of each other */
const floaters = M.floaters = {list:{}};
floaters.register = (key, api)=>{ floaters.list[key] = api; };
floaters.resolve = function(moved){
  const a = floaters.list.bub, b = floaters.list.np;
  if(!a || !b || !a.visible() || !b.visible()) return;
  if(a.side() !== b.side()) return;
  const ra = a.rect(), rb = b.rect(), gap = 10;
  if(ra.bottom + gap <= rb.top || rb.bottom + gap <= ra.top) return;
  const mover = moved === 'np' ? a : b, still = mover === a ? b : a;
  const rs = still.rect(), rm = mover.rect(), L = M.nbLimits(rm.height);
  const above = rs.top - gap - rm.height, below = rs.bottom + gap;
  let y = (below <= L.maxY) ? below : above;
  if(y < L.minY) y = (above >= L.minY) ? above : L.minY;
  mover.setY(clamp(y, L.minY, L.maxY));
};
setInterval(()=>{ Object.keys(floaters.list).forEach(k=>{ try{ floaters.list[k].reflow(); }catch(e){} }); floaters.resolve(); }, 600);
window.addEventListener('resize', M.debounce(()=>{ Object.keys(floaters.list).forEach(k=>{ try{ floaters.list[k].reflow(); }catch(e){} }); floaters.resolve(); }, 120));

/* ---------------------------------------------------------------- tab bar: density / mode / long-press ---------------------------------------------------------------- */
function applyMode(){
  const dock = navMode() === 'dock';
  root.dataset.nbmode = dock ? 'dock' : 'float';
  root.style.setProperty('--tabbar-h', dock ? '70px' : '84px');
}
const SHORT = {'متابعة القراءة':'تابع', 'التنزيلات':'تنزيلات', 'المكتبة الصوتية':'المكتبة', 'إحصاءات القراءة':'إحصاءات', 'جميع الأقسام':'الأقسام', 'متابعة العبادات':'عباداتي', 'أذكار الصباح':'الصباح', 'أذكار المساء':'المساء', 'أذكار الصلاة':'بعد الصلاة', 'أذكار النوم':'النوم', 'أذكار الاستيقاظ':'الاستيقاظ',
  'تيجان الذكر السبعة':'التيجان', 'الحمد والثناء':'الحمد', 'أسماء الله الحسنى':'الأسماء', 'مكتبة الأدعية':'الأدعية', 'أدعية من القرآن':'أدعية القرآن', 'أدعية شاملة':'أدعية', 'أدعية حسب المواضيع':'المواضيع', 'أدعية التيسير':'التيسير', 'أدعية المريض':'المريض', 'أذكار الأحبة':'الأحبة', 'أذكاري وأدعيتي':'أدعيتي',
  'الرقية بالسنة':'رقية السنة', 'الرقية بالقرآن':'رقية القرآن', 'السنن الرواتب':'الرواتب', 'صلاة الضحى':'الضحى', 'قيام الليل والوتر':'القيام', 'أوقات النهي':'النهي', 'قضاء الصلوات والصيام':'القضاء', 'وقت الإفطار':'الإفطار', 'قضاء رمضان':'القضاء', 'صيام الاثنين والخميس':'الاثنين', 'صيام الأيام البيض':'الأيام البيض', 'يوم عاشوراء':'عاشوراء',
  'التقويم الهجري والقمر':'التقويم', 'إذاعات القرآن':'الإذاعة', 'البث المباشر':'البث', 'المسابقات الدينية':'مسابقات', 'حاسبة الزكاة':'الزكاة', 'ركن الأطفال':'الأطفال', 'الإشعارات':'إشعارات', 'كتب السنة':'السنة', 'قصص الأنبياء':'الأنبياء', 'أحكام التجويد':'التجويد', 'حصن المسلم الموسّع':'حصن المسلم', 'حاسبة الزكاة المتقدمة':'الزكاة', 'بطاقات ومنشورات':'بطاقات',
  'مساعد الحفظ':'الحفظ', 'الرقية الشرعية الموسّعة':'الرقية', 'تخصيص الشريط والدائرة':'تخصيص', 'طبعات المصحف':'الطبعات', 'مؤقت النوم':'المؤقت', 'الأمان وأدوات إضافية':'الأمان', 'جدول المحاسبة':'المحاسبة'};
/* the layout is decided from what really fits: full labels -> smaller font -> first word -> (7 slots) icons only except the selected one */
function layout(){
  const nav = M.$('#tabbar'), bar = nav && nav.querySelector('.bar'); if(!bar) return;
  const tabs = Array.from(bar.querySelectorAll('.tab')), n = tabs.length || 1;
  const lbs = tabs.map(t=>t.querySelector('.lb'));
  lbs.forEach(l=>{ if(!l.dataset.full) l.dataset.full = l.textContent; l.textContent = SHORT[l.dataset.full] || l.dataset.full; });
  const set = (d, k)=>{ nav.dataset.nbd = d; nav.style.setProperty('--nb-k', k); };
  const fits = ()=>lbs.every(l=>l.scrollWidth <= l.clientWidth + 1);
  nav.style.setProperty('--nb-n', n);
  let ok = false;
  for(const k of [1, .9, .8]){ set(k === 1 ? 'full' : 'compact', k); if(fits()){ ok = true; break; } }
  if(!ok){
    lbs.forEach(l=>{ const t = l.textContent.trim(); const w = t.split(/\s+/)[0]; if(w && w.length >= 3) l.textContent = w; });
    ok = fits();
  }
  if(!ok && n >= 7) set('icons', 1);
  M.moveLens && M.moveLens(false);
}
const relayout = M.debounce(()=>{ requestAnimationFrame(layout); }, 60);
window.addEventListener('resize', relayout);
if(document.fonts){ if(document.fonts.ready) document.fonts.ready.then(()=>relayout()); try{ document.fonts.addEventListener('loadingdone', relayout); }catch(e){} }

M.navbarAfterBuild = function(nav, bar){
  applyMode();
  nav.classList.add('nb');
  /* long-press anywhere on the bar opens the customiser (the click that follows is swallowed) */
  let timer = null, sx = 0, sy = 0, fired = false;
  const stop = ()=>{ clearTimeout(timer); timer = null; };
  bar.addEventListener('pointerdown', e=>{ fired = false; sx = e.clientX; sy = e.clientY; stop(); timer = setTimeout(()=>{ fired = true; timer = null; M.haptic(18); M.openNavbarCfg(); }, 650); });
  bar.addEventListener('pointermove', e=>{ if(timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 9) stop(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t=>bar.addEventListener(t, stop));
  bar.addEventListener('click', e=>{ if(fired){ e.stopPropagation(); e.preventDefault(); fired = false; } }, true);
  bar.addEventListener('contextmenu', e=>e.preventDefault());
  requestAnimationFrame(layout); setTimeout(layout, 700); setTimeout(layout, 2000);
};
M.on('settings', k=>{
  if(k === 'navItems' || k === 'navMode' || typeof k === 'object'){ applyMode(); M.buildTabbar && M.buildTabbar(); }
  if(k === 'fontScale' || typeof k === 'object') setTimeout(layout, 80);
  if(k === 'lang' || k === 'digits') setTimeout(()=>{ M.buildTabbar && M.buildTabbar(); }, 0);
});
applyMode();

/* ---------------------------------------------------------------- the global bubble ---------------------------------------------------------------- */
const BS = 52;
const bub = {el:null, btn:null, layer:null, open:false, side:'r', y:.6, dim:false, hidden:true, drag:false, reasons:new Set(), dimT:null};
const bubOn = ()=>M.cfg.bubbleOn !== false;
function loadBubPos(){
  const p = M.store.get('nbPos', null);
  const dflt = M.cfg.bubbleSide === 'r' ? 'r' : 'l';   // default: the end corner (left in Arabic), clear of titles and icons
  bub.side = p && (p.s === 'l' || p.s === 'r') ? p.s : dflt;
  bub.y = p && isFinite(p.y) ? clamp(p.y, 0, 1) : null;
}
function savePos(){ M.store.set('nbPos', {s:bub.side, y:bub.y}); }
function bubXY(){
  const L = M.nbLimits(BS);
  let y = (bub.y == null ? 1 : bub.y) * L.H;           // default: just above the navigation bar, where a floating button belongs
  return {x:bub.side === 'l' ? L.minX : L.maxX, y:clamp(y, L.minY, L.maxY), L};
}
function placeBub(animate){
  if(!bub.el) return;
  const p = bubXY();
  bub.el.classList.toggle('nb-anim', !!animate);
  bub.el.style.transform = 'translate('+Math.round(p.x)+'px,'+Math.round(p.y)+'px)';
  bub.el.dataset.side = bub.side;
  bub.cur = p;
}
function bubVisible(){
  if(!bubOn()) return false;
  if(bub.reasons.size) return false;
  if(M.$('#view-onboarding')) return false;
  if(M.$('.reader.imm')) return false;
  // a counting screen keeps its whole bottom row for the counter and its arrows
  const top = M.views && M.views.length ? M.views[M.views.length - 1] : null;
  if(top && top.el && top.el.id === 'view-pager') return false;
  return true;
}
function syncVis(){
  if(!bub.el) return;
  const v = bubVisible();
  if(v === !bub.hidden) return;
  bub.hidden = !v; bub.el.classList.toggle('nb-off', !v);
  if(!v) closeFan(true); else { placeBub(false); wake(); }
}
function applyOp(){
  const f = k=>clamp(num(M.cfg[k], 1) || 1, .3, 1);
  root.style.setProperty('--nb-bub-op', f('bubbleOp')); root.style.setProperty('--nb-np-op', f('npOp')); root.style.setProperty('--nb-bar-a', f('barOp'));
}
applyOp();
M.on('settings', k=>{ if(k === 'bubbleOp' || k === 'npOp' || k === 'barOp' || typeof k === 'object') applyOp(); });
M.bubble = {
  wake(){ wake(); },
  hide(reason){ bub.reasons.add(reason || 'x'); syncVis(); },
  show(reason){ bub.reasons.delete(reason || 'x'); syncVis(); },
  close(){ return closeFan(); },
  toggle(){ bub.open ? closeFan() : openFan(); },
  reset(){ M.store.set('nbPos', null); loadBubPos(); placeBub(true); floaters.resolve('bub'); }
};
M.bubbleClose = ()=>{ if(!bub.open) return false; closeFan(); return true; };

function wake(){
  if(!bub.el) return;
  bub.el.classList.remove('dim'); bub.dim = false;
  clearTimeout(bub.dimT);
  if(M.cfg.bubbleDim === false) return;
  bub.dimT = setTimeout(()=>{ if(!bub.open && !bub.drag){ bub.el.classList.add('dim'); bub.dim = true; } }, 3600);
}

function entries(){
  const out = [];
  const last = M.QD && M.QD.last;
  if(last && !M.cfg.hideFab) out.push({id:'__continue', label:'تابع القراءة', icon:'s:mushaf', fn:()=>M.openReader({page:last.page, sura:last.sura, ayah:last.ayah})});
  (M.shortcuts ? M.shortcuts() : []).slice(0, 12).forEach(id=>{ const s = secOf(id); if(s) out.push({id, label:s[1], icon:s[2], fn:()=>s[4]()}); });
  out.push({id:'__edit', label:'تعديل الاختصارات', icon:'note', fn:()=>(M.openShortcutsEditor ? M.openShortcutsEditor() : M.openNavbarCfg('bub')), edit:true});
  return out;
}
/* fan layout: concentric arcs opening towards the middle of the screen; each ring is clipped to the app area */
function fanLayout(n, cx, cy, dir, L){
  // an item's box runs from 36px either side and 22px above its centre to ~50px below (circle + a two-line label): keep it all on screen
  const sf = safe(), bx = 40;
  const x0 = L.minX - L.pad + bx, x1 = L.maxX + BS + L.pad - bx;
  const y0 = sf.t + 26, y1 = L.H - sf.b - 54 - Math.round((Math.max(1, +M.cfg.fontScale || 1) - 1) * 36);
  // larger text (settings → font size) makes two-line labels taller: the rings move apart to match
  const gap = Math.round(76 + (Math.max(1, +M.cfg.fontScale || 1) - 1) * 40), radii = [96, 96 + gap, 96 + 2 * gap, 96 + 3 * gap], pitch = gap, pos = [];
  let left = n;
  for(const R of radii){
    if(left <= 0) break;
    const ok = [];
    for(let a = -90; a <= 90; a += 2){
      const t = a * Math.PI / 180, x = cx + dir * R * Math.cos(t), y = cy + R * Math.sin(t);
      if(x >= x0 && x <= x1 && y >= y0 && y <= y1) ok.push(a);
    }
    if(!ok.length) continue;
    // neighbours are spaced by the straight distance between them (the chord), never less than one item
    const a0 = ok[0], a1 = ok[ok.length - 1], minStep = 2 * Math.asin(Math.min(1, pitch / 2 / R)) * 180 / Math.PI;
    const cap = Math.max(1, Math.floor((a1 - a0) / minStep + 1e-9) + 1);
    const k = Math.min(cap, left), mid = (a0 + a1) / 2;
    const step = k > 1 ? Math.min((a1 - a0) / (k - 1), minStep * 1.25) : 0;
    for(let i = 0; i < k; i++){
      const a = (mid + (i - (k - 1) / 2) * step) * Math.PI / 180;
      pos.push([cx + dir * R * Math.cos(a), cy + R * Math.sin(a)]);
    }
    left -= k;
  }
  if(left > 0) return null;
  /* reading order: top to bottom, then nearest ring first for ties */
  return pos;
}
function openFan(){
  if(bub.open || bub.hidden) return;
  const list = entries(), p = bubXY(), L = p.L;
  const cx = p.x + BS / 2, cy = p.y + BS / 2, dir = bub.side === 'l' ? 1 : -1;
  let pos = fanLayout(list.length, cx, cy, dir, L);
  bub.open = true; root.classList.add('nb-fan-open'); clearTimeout(bub.dimT);
  bub.el.classList.remove('dim'); bub.el.classList.add('open'); bub.btn.setAttribute('aria-expanded', 'true');
  const layer = bub.layer; layer.innerHTML = ''; layer.classList.add('on');
  const scrim = h('div.nb-scrim', {onclick:()=>closeFan()}); layer.append(scrim);
  if(pos){
    /* order top->bottom so the visual order matches the list order */
    const idx = pos.map((q, i)=>i).sort((a, b)=>pos[a][1] - pos[b][1]);
    const sorted = idx.map(i=>pos[i]);
    list.forEach((it, i)=>{
      const [x, y] = sorted[i];
      const b = h('button.nb-fi'+(it.edit ? '.edit' : ''), {'aria-label':it.label, style:'left:'+Math.round(x)+'px;top:'+Math.round(y)+'px;--fx:'+Math.round(cx - x)+'px;--fy:'+Math.round(cy - y)+'px;transition-delay:'+(i * 16)+'ms',
        onclick:()=>{ closeFan(); M.haptic(8); setTimeout(()=>{ try{ it.fn(); }catch(e){ console.error(e); } }, 120); }},
        h('span.nb-fc', {html:M.icon(it.icon)}), h('span.nb-fl', it.label));
      layer.append(b);
    });
  } else {
    /* too cramped for a fan (tiny window): a plain grid card */
    const g = h('div.nb-grid');
    list.forEach(it=>g.append(h('button.nb-fi.flat', {onclick:()=>{ closeFan(); setTimeout(()=>{ try{ it.fn(); }catch(e){ console.error(e); } }, 120); }}, h('span.nb-fc', {html:M.icon(it.icon)}), h('span.nb-fl', it.label))));
    layer.append(g);
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>layer.classList.add('go')));
  M.haptic(6);
}
function closeFan(instant){
  if(!bub.open) return false;
  bub.open = false; root.classList.remove('nb-fan-open');
  bub.el.classList.remove('open'); bub.btn.setAttribute('aria-expanded', 'false');
  const layer = bub.layer; layer.classList.remove('go');
  const done = ()=>{ if(!bub.open){ layer.classList.remove('on'); layer.innerHTML = ''; } };
  if(instant) done(); else setTimeout(done, 260);
  wake();
  return true;
}
function bubMenu(){
  const c = h('div.col-flex', {style:'padding:4px 4px 12px'},
    h('button.btn.tonal.block', {onclick:()=>{ s.close(); M.openShortcutsEditor && M.openShortcutsEditor(); }}, M.ic('star'), 'اختصاراتي'),
    h('button.btn.tonal.block', {onclick:()=>{ s.close(); M.openNavbarCfg('bub'); }}, M.ic('settings'), 'تخصيص الشريط والدائرة'),
    h('button.btn.tonal.block', {onclick:()=>{ s.close(); M.save('bubbleOn', false); M.toast('أُخفيت الدائرة — فعّلها من الإعدادات ← تخصيص الشريط والدائرة'); }}, M.ic('eye'), 'إخفاء الدائرة'));
  const s = M.sheet({title:'الدائرة العائمة', content:c});
}
function buildBubble(){
  loadBubPos();
  bub.layer = h('div.nb-layer');
  bub.btn = h('button.nb-btn', {'aria-label':'القائمة السريعة — اسحب لتحريك الدائرة', 'aria-haspopup':'true', 'aria-expanded':'false'}, h('span.nb-glyph', h('span.nb-ico', {html:'<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(45 12 12)"/></g><g fill="currentColor"><circle cx="10.2" cy="10.2" r="1.15"/><circle cx="13.8" cy="10.2" r="1.15"/><circle cx="10.2" cy="13.8" r="1.15"/><circle cx="13.8" cy="13.8" r="1.15"/></g></svg>'}), h('span.nb-x', {html:M.icon('close')})));
  bub.el = h('div.nb-bub.nb-off', {dataset:{side:bub.side}}, bub.btn);
  const app = M.$('#app'); app.append(bub.layer, bub.el);
  /* pointer: tap = toggle, drag = move, long-press = menu, fling outwards = dismiss */
  let d0 = null, moved = false, lp = null;
  bub.btn.addEventListener('pointerdown', e=>{
    if(e.button) return;
    bub.drag = false; moved = false; wake();
    d0 = {x:e.clientX, y:e.clientY, p:bubXY()};
    try{ bub.btn.setPointerCapture(e.pointerId); }catch(_){}
    clearTimeout(lp); lp = setTimeout(()=>{ if(d0 && !moved){ d0 = null; M.haptic(20); closeFan(true); bubMenu(); } }, 650);
  });
  bub.btn.addEventListener('pointermove', e=>{
    if(!d0) return;
    const dx = e.clientX - d0.x, dy = e.clientY - d0.y;
    if(!moved && Math.hypot(dx, dy) < 8) return;
    if(!moved){ moved = true; bub.drag = true; clearTimeout(lp); closeFan(true); bub.el.classList.remove('nb-anim'); bub.el.classList.add('drag'); }
    const L = d0.p.L;
    const x = clamp(d0.p.x + dx, L.minX - 90, L.maxX + 90), y = clamp(d0.p.y + dy, L.minY, L.maxY);
    bub.el.style.transform = 'translate('+Math.round(x)+'px,'+Math.round(y)+'px)';
    bub.cur = {x, y, L};
    bub.el.classList.toggle('away', x < L.minX - 45 || x > L.maxX + 45);
  });
  const end = e=>{
    clearTimeout(lp);
    if(!d0) return;
    const wasMoved = moved, c = bub.cur; d0 = null; moved = false; bub.drag = false;
    bub.el.classList.remove('drag', 'away');
    if(!wasMoved){ if(e && e.type === 'pointerup') M.bubble.toggle(); return; }
    const L = c.L;
    if(c.x < L.minX - 45 || c.x > L.maxX + 45){ bub.el.classList.add('nb-anim'); M.save('bubbleOn', false); M.toast('أُخفيت الدائرة — فعّلها من الإعدادات ← تخصيص الشريط والدائرة', 3200); return; }
    bub.side = c.x + BS / 2 < L.W / 2 ? 'l' : 'r';
    bub.y = c.y / L.H; savePos(); placeBub(true); floaters.resolve('bub'); wake();
  };
  bub.btn.addEventListener('pointerup', end); bub.btn.addEventListener('pointercancel', end);
  bub.btn.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeFan(); });
  /* typing: step aside while a text field has focus */
  document.addEventListener('focusin', e=>{ const t = e.target; if(t && /^(INPUT|TEXTAREA)$/.test(t.tagName) && !/^(checkbox|radio|range|button)$/.test(t.type || '')) M.bubble.hide('typing'); });
  document.addEventListener('focusout', ()=>setTimeout(()=>{ const t = document.activeElement; if(!(t && /^(INPUT|TEXTAREA)$/.test(t.tagName))) M.bubble.show('typing'); }, 60));
  document.addEventListener('pointerdown', e=>{ if(!bub.el.contains(e.target)) wake(); }, true);
  document.addEventListener('scroll', ()=>{ if(bub.dim) return; }, true);
  floaters.register('bub', {
    visible:()=>!bub.hidden,
    side:()=>bub.side,
    rect:()=>bub.el.getBoundingClientRect(),
    setY(y){ const L = M.nbLimits(BS); bub.y = y / L.H; savePos(); placeBub(true); },
    reflow(){ if(!bub.hidden && !bub.drag && !bub.open) placeBub(true); }
  });
  M.on('viewclose', ()=>{ closeFan(true); setTimeout(()=>{ placeBub(true); syncVis(); floaters.resolve(); }, 380); });
  M.on('tab', ()=>{ closeFan(true); setTimeout(()=>{ placeBub(true); syncVis(); }, 60); });
  M.on('settings', k=>{
    if(k === 'bubbleOn' || typeof k === 'object') syncVis();
    if(k === 'bubbleSide'){ M.store.set('nbPos', {s:M.cfg.bubbleSide === 'r' ? 'r' : 'l', y:bub.y}); loadBubPos(); placeBub(true); floaters.resolve('bub'); }
    if(k === 'bubbleDim') wake();
  });
  setInterval(()=>{ syncVis(); }, 450);
  window.addEventListener('resize', M.debounce(()=>{ closeFan(true); placeBub(false); }, 100));
  syncVis(); placeBub(false); wake();
}
M.bubbleInit = function(){ if(!bub.el) buildBubble(); };

/* ---------------------------------------------------------------- customiser screen ---------------------------------------------------------------- */
const GRIP = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><g fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></g></svg>';
const sw = (v, f)=>M.switchEl(v, f);
const row = (title, sub, ctl)=>h('div.item.static', h('div.grow', h('div.t', title), sub ? h('div.s', sub) : null), ctl);
const rowSeg = (title, sub, ctl)=>h('div.item.static', {style:'flex-direction:column;align-items:stretch;gap:8px'}, h('div', h('div.t', title), sub ? h('div.s', sub) : null), ctl);

function slider(key, label){
  const v = Math.round(clamp(num(M.cfg[key], 1) || 1, .3, 1) * 100);
  const out = h('span.nbc-val', M.n(v)+'٪');
  const inp = h('input.nbc-range', {type:'range', min:30, max:100, step:5, value:v, 'aria-label':label, oninput:e=>{ const x = +e.target.value; out.textContent = M.n(x)+'٪'; M.save(key, x / 100); if(key === 'bubbleOp') M.bubble.wake(); }});
  return h('div.item.static', {style:'flex-direction:column;align-items:stretch;gap:6px'}, h('div.row-flex', h('div.grow.t', label), out), inp);
}
function saveItems(a){ M.save('navItems', a.slice(0, MAX)); }
function pickerGroups(){
  const groups = [['التبويبات الرئيسية', BUILTIN.slice()]];
  const seen = new Set(BUILTIN);
  (M.SECTION_GROUPS || []).forEach(([g, ids])=>{
    const l = ids.filter(id=>!seen.has(id) && id !== SELF && secOf(id));
    l.forEach(id=>seen.add(id));
    if(l.length) groups.push([g, l]);
  });
  const rest = (M.SECTIONS || []).map(s=>s[0]).filter(id=>!seen.has(id) && id !== SELF);
  if(rest.length) groups.push(['أخرى', rest]);
  return groups;
}

M.openNavbarCfg = function(tabName){
  if(M.views && M.views.some(v=>!v.closed && v.el.id === 'view-'+SELF)) return;
  let tab = tabName || 'bar', q = '';
  const view = M.openView({id:SELF, title:'تخصيص الشريط والدائرة', build:b=>{
    const seg = M.seg([['bar', 'الشريط السفلي'], ['bub', 'الدائرة العائمة'], ['np', 'المشغّل']], tab, v=>{ tab = v; draw(); });
    const box = h('div.col-flex.nbc');
    b.append(seg, box);
    draw();

    function draw(){
      box.innerHTML = '';
      if(tab === 'bar') drawBar(); else if(tab === 'bub') drawBub(); else drawNp();
    }

    /* ----- bottom bar ----- */
    function drawBar(){
      const pv = h('div.nbc-pv'), listBox = h('div'), pickBox = h('div'), cnt = h('div');
      box.append(h('div.card.pad.small.muted', 'اختر عناصر الشريط السفلي من أي قسم في التطبيق، ورتّبها بالسحب أو بالأسهم. اضغط مطولًا على الشريط نفسه لفتح هذه الشاشة في أي وقت.'),
        h('div.section-h', 'معاينة'), pv,
        h('div.section-h', 'شكل الشريط'),
        h('div.list.card', slider('barOp', 'شفافية خلفية الشريط')),
        h('div.card.pad', M.seg([['float', 'شريط عائم'], ['dock', 'شريط ملتصق']], navMode(), v=>M.save('navMode', v))),
        h('div.section-h', 'عدد الخانات'), cnt,
        h('div.section-h', 'عناصر الشريط'), listBox,
        h('button.btn.tonal.block', {style:'margin-top:4px', onclick:()=>{ M.save('navItems', BUILTIN.slice()); redraw(); M.toast('أُعيد الشريط إلى الوضع الافتراضي'); }}, M.ic('refresh'), 'استعادة الافتراضي'),
        h('div.section-h', 'إضافة عنصر'), pickBox);
      const search = h('input.field', {type:'search', placeholder:'ابحث عن قسم…', value:q, 'aria-label':'بحث', oninput:e=>{ q = e.target.value; drawPick(); }});
      pickBox.append(search); const pl = h('div.col-flex'); pickBox.append(pl);

      function redraw(){ drawPreview(); drawCount(); drawList(); drawPick(); }
      function drawPreview(){
        pv.innerHTML = '';
        M.navItems().forEach((id, i)=>{ const d = describe(id); pv.append(h('div.nbc-pi'+(i === 0 ? '.on' : ''), h('span.ind', {html:M.icon(d.icon)}), h('span.lb', SHORT[d.label] || d.label))); });
      }
      function drawCount(){
        cnt.innerHTML = '';
        cnt.append(h('div.card.pad', M.seg([4, 5, 6, 7].map(n=>[n, M.n(n)]), M.navItems().length, v=>{
          let a = M.navItems(); v = +v;
          if(a.length > v) a = a.slice(0, v);
          else for(const id of EXTRA_FILL.concat((M.SECTIONS || []).map(s=>s[0]))){ if(a.length >= v) break; if(!a.includes(id) && describe(id) && id !== SELF) a.push(id); }
          saveItems(a); redraw();
        })));
      }
      function drawList(){
        listBox.innerHTML = '';
        const items = M.navItems(), l = h('div.list.card.nbc-list');
        items.forEach((id, i)=>{
          const d = describe(id);
          const mv = dd=>{ const a = M.navItems(), j = i + dd; if(j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; saveItems(a); redraw(); };
          const grip = h('button.nbc-grip', {'aria-label':'اسحب لإعادة الترتيب', html:GRIP});
          const r = h('div.item.static.nbc-row', {dataset:{id}}, grip, h('span.lead', {html:M.icon(d.icon)}), h('div.grow.t', d.label),
            M.reorder(i, items.length, mv),
            M.removeBtn(()=>{ const a = M.navItems(); if(a.length <= MIN) return M.toast('الحد الأدنى '+M.n(MIN)+' عناصر'); saveItems(a.filter(x=>x !== id)); redraw(); }));
          dragRow(grip, r, l, i);
          l.append(r);
        });
        listBox.append(l);
      }
      function dragRow(grip, r, l, i){
        let st = null;
        grip.addEventListener('pointerdown', e=>{
          e.preventDefault(); try{ grip.setPointerCapture(e.pointerId); }catch(_){}
          const rows = Array.from(l.children), rects = rows.map(x=>x.getBoundingClientRect());
          st = {y:e.clientY, rows, rects, H:rects[i].height, t:i};
          r.classList.add('drag'); l.classList.add('dragging');
        });
        grip.addEventListener('pointermove', e=>{
          if(!st) return;
          const dy = clamp(e.clientY - st.y, -st.rects[i].top + st.rects[0].top, st.rects[st.rects.length - 1].top - st.rects[i].top);
          r.style.transform = 'translateY('+dy+'px)';
          const t = clamp(Math.round((st.rects[i].top + dy - st.rects[0].top) / st.H), 0, st.rows.length - 1);
          st.t = t;
          st.rows.forEach((x, j)=>{ if(j === i) return; let s = 0; if(i < t && j > i && j <= t) s = -st.H; if(t < i && j >= t && j < i) s = st.H; x.style.transform = s ? 'translateY('+s+'px)' : ''; });
        });
        const fin = ()=>{
          if(!st) return; const s = st; st = null;
          r.classList.remove('drag'); l.classList.remove('dragging');
          if(s.t !== i){ const a = M.navItems(); const [m] = a.splice(i, 1); a.splice(s.t, 0, m); saveItems(a); M.haptic(8); }
          redraw();
        };
        grip.addEventListener('pointerup', fin); grip.addEventListener('pointercancel', fin);
        grip.addEventListener('keydown', e=>{ if(e.key === 'ArrowUp' || e.key === 'ArrowDown'){ e.preventDefault(); const a = M.navItems(), j = i + (e.key === 'ArrowUp' ? -1 : 1); if(j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; saveItems(a); redraw(); } });
      }
      function drawPick(){
        pl.innerHTML = '';
        const nq = M.normAr ? M.normAr(q.trim()) : q.trim(), cur = M.navItems();
        pickerGroups().forEach(([g, ids])=>{
          const list = ids.map(describe).filter(d=>d && (!nq || (M.normAr ? M.normAr(d.label) : d.label).includes(nq)));
          if(!list.length) return;
          const card = h('div.list.card');
          list.forEach(d=>{
            const on = cur.includes(d.id);
            card.append(h('button.item.nbc-pick'+(on ? '.on' : ''), {'aria-pressed':on ? 'true' : 'false', onclick:()=>{
              const a = M.navItems();
              if(a.includes(d.id)){ if(a.length <= MIN) return M.toast('الحد الأدنى '+M.n(MIN)+' عناصر'); saveItems(a.filter(x=>x !== d.id)); }
              else { if(a.length >= MAX) return M.toast('الحد الأقصى '+M.n(MAX)+' عناصر — أزل عنصرًا أولًا'); a.push(d.id); saveItems(a); }
              const top = b.scrollTop; redraw(); b.scrollTop = top;
            }}, h('span.lead', {html:M.icon(d.icon)}), h('div.grow.t', d.label), on ? h('span.nbc-chk', M.ic('check')) : M.ic('plus')));
          });
          pl.append(h('div.section-h', g), card);
        });
        if(!pl.children.length) pl.append(h('div.card.pad.small.muted', 'لا نتائج'));
      }
      redraw();
    }

    /* ----- bubble ----- */
    function drawBub(){
      const sc = (M.shortcuts ? M.shortcuts() : []);
      box.append(h('div.card.pad.small.muted', 'دائرة صغيرة تظهر فوق كل الشاشات؛ اضغطها لتفتح قائمة اختصاراتك. اسحبها لتحريكها فتلتصق بأقرب حافة، واضغط عليها مطولًا لخيارات الإخفاء، أو اسحبها خارج الشاشة لإخفائها.'),
        h('div.list.card', slider('bubbleOp', 'الشفافية')),
        h('div.list.card',
          row('إظهار الدائرة العائمة', '', sw(bubOn(), v=>M.save('bubbleOn', v))),
          rowSeg('الحافة الافتراضية', '', M.seg([['r', 'يمين'], ['l', 'يسار']], M.cfg.bubbleSide === 'r' ? 'r' : 'l', v=>M.save('bubbleSide', v))),
          row('تخافت تلقائيًا عند عدم الاستخدام', '', sw(M.cfg.bubbleDim !== false, v=>M.save('bubbleDim', v))),
          row('إظهار «تابع القراءة» في القائمة', 'يحلّ محل الزر العائم القديم', sw(!M.cfg.hideFab, v=>M.save('hideFab', !v)))),
        h('div.section-h', 'اختصاراتي ('+M.n(sc.length)+' من '+M.n(12)+')'),
        h('div.card.pad', h('div.nbc-chips', ...sc.map(id=>{ const s = secOf(id); return h('span.nbc-chip', h('span.ind', {html:M.icon(s[2])}), s[1]); }))),
        h('button.btn.block', {onclick:()=>M.openShortcutsEditor && M.openShortcutsEditor()}, M.ic('star'), 'تعديل اختصاراتي'),
        h('button.btn.tonal.block', {onclick:()=>{ M.bubble.reset(); M.toast('أُعيدت الدائرة إلى موضعها'); }}, M.ic('refresh'), 'إعادة الدائرة إلى موضعها'));
    }

    /* ----- now playing ----- */
    function drawNp(){
      box.append(h('div.card.pad.small.muted', 'دائرة التشغيل تظهر أثناء التلاوة أو الإذاعة أو الأصوات. اضغطها لعرض أزرار التحكم، واسحبها لتحريكها فتلتصق بأقرب حافة.'),
        h('div.list.card', slider('npOp', 'الشفافية'), h('div.item.static', {style:'justify-content:center'}, h('div.nbnp-demo', h('i'), M.ic('s:mushaf')))),
        h('div.list.card',
          rowSeg('حافة الدائرة', 'تبقى على الجهة الفعلية (يسار أو يمين الشاشة)', M.seg([['l', 'يسار'], ['r', 'يمين']], M.cfg.npSide === 'r' ? 'r' : 'l', v=>M.save('npSide', v))),
          row('إغلاق أزرار التحكم تلقائيًا', 'بعد ٥ ثوانٍ دون لمس', sw(M.cfg.npAuto !== false, v=>M.save('npAuto', v)))),
        h('button.btn.tonal.block', {onclick:()=>{ M.npReset && M.npReset(); M.toast('أُعيدت دائرة التشغيل إلى موضعها'); }}, M.ic('refresh'), 'إعادة الدائرة إلى موضعها'));
    }
  }});
  return view;
};

M.addSection({id:SELF, title:'تخصيص الشريط والدائرة', icon:'s:grid', group:'الإعدادات', fn:()=>M.openNavbarCfg()});
})();
