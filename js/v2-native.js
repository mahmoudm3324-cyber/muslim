/* ===== iPhone native shell (ios/Muslim/NativeShell.swift) =====
   On the iPhone the bottom bar and the prayer screen are drawn natively (SwiftUI), over this page's own background.
   This file is their data source: the theme's colours, the bar's items, the prayer screen's content and the app's own icons
   (rendered to images so they look exactly the same). Everything they do comes back here through M.native.act(), so the
   logic, the settings and the sheets stay the app's own. Inactive everywhere else (window.__nativeShell is set by the iPhone app). */
(function(){
'use strict';
const M = window.M, h = M.h, root = document.documentElement;
if(!window.__nativeShell || !window.Android || !Android.setNativeModel) return;
root.setAttribute('data-native', '');

/* ---------------- icons: the app's own icons as PNG data (black, the native side tints them) ---------------- */
const iconCache = {}, sent = new Set(), pending = {};
function iconKey(name){ return String(name || '').replace(/[^a-zA-Z0-9:_-]/g, ''); }
function rasterize(name){
  const k = iconKey(name);
  if(iconCache[k] || pending[k]) return;
  let html = '';
  try{ html = M.icon(name); }catch(e){ return; }
  const box = document.createElement('div'); box.innerHTML = html;
  const el = box.firstElementChild; if(!el) return;
  // pictures used as masks (some emblems are PNGs): the native side loads the same file from the bundle
  const mask = /url\((?:&quot;|")?([^)"&]+)(?:&quot;|")?\)/.exec(el.getAttribute('style') || '');
  if(el.classList.contains('imgic') && mask){ iconCache[k] = 'file:'+mask[1]; send(); return; }
  if(el.tagName.toLowerCase() !== 'svg') return;
  el.querySelectorAll('.du').forEach(n=>n.remove());              // the duotone layer is a style, not part of the outline
  el.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); el.setAttribute('width', '96'); el.setAttribute('height', '96');
  el.setAttribute('style', 'color:#000'); el.removeAttribute('class');
  const img = new Image(); pending[k] = true;
  img.onload = ()=>{ try{ const c = document.createElement('canvas'); c.width = c.height = 96; c.getContext('2d').drawImage(img, 0, 0, 96, 96); iconCache[k] = c.toDataURL('image/png'); }catch(e){} delete pending[k]; send(); };
  img.onerror = ()=>{ delete pending[k]; };
  img.src = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(el.outerHTML);
}
function icon(name){ rasterize(name); return iconKey(name); }

/* ---------------- colours: whatever CSS computes (color-mix, oklab…) read back as plain sRGB ---------------- */
const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', {willReadFrequently:true});
function rgb(css){
  try{ cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], +(d[3] / 255).toFixed(3)]; }catch(e){ return [0, 0, 0, 1]; }
}
const probe = h('div', {style:'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'});
function token(v){ probe.style.color = 'var('+v+')'; return rgb(getComputedStyle(probe).color); }
function mix(expr){ probe.style.color = expr; return rgb(getComputedStyle(probe).color); }
function theme(){
  if(!probe.isConnected) document.body.append(probe);
  const dark = root.dataset.theme !== 'light';
  return {dark, hindi:M.cfg.digits === 'hindi', amoled:root.dataset.theme === 'amoled', skin:root.dataset.skin || 'glass', solid:root.hasAttribute('data-solid'), contrast:root.hasAttribute('data-contrast'),
    fs:+(getComputedStyle(root).getPropertyValue('--fs') || 1) || 1,
    p:token('--p'), onP:token('--on-p'), pc:token('--pc'), onPc:token('--on-pc'), s0:token('--s0'), s1:token('--s1'), onS:token('--on-s'), onSV:token('--on-sv'),
    gold:token('--gold'), outlineV:token('--outline-v'), ok:token('--ok'),
    // the accent card: the same two colours the CSS gradient uses
    heroA:mix(dark ? 'color-mix(in oklab, var(--p) 42%, #06161b)' : 'color-mix(in oklab, var(--p) 86%, #fff)'),
    heroB:mix(dark ? 'color-mix(in oklab, var(--p) 18%, #04090b)' : 'color-mix(in oklab, var(--p) 60%, #000)'),
    tabOn:dark ? mix('color-mix(in oklab, var(--p) 55%, #fff)') : token('--p')};
}

/* ---------------- the bottom bar ---------------- */
function nav(){
  const items = (M.navItems ? M.navItems() : ['home', 'quran', 'prayer', 'adhkar', 'more']).map(id=>M.navDescribe ? M.navDescribe(id) : {id, tab:true, label:M.screens[id].label, icon:M.screens[id].icon}).filter(Boolean);
  return items.map(d=>({id:d.id, label:d.label, tab:!!d.tab, icon:icon(d.icon)}));
}

/* ---------------- the prayer screen ---------------- */
const TIME_IC = {fajr:'p:fajr', sunrise:'p:sunrise', dhuhr:'p:dhuhr', asr:'p:asr', maghrib:'p:maghrib', isha:'p:isha'};
function hero(where){
  const c = M.cfg; if(!c.heroImg) return null;
  const on = c.heroImgOn || 'both'; if(on !== 'both' && on !== where) return null;
  const fit = c.heroFit === 'contain';
  let x = c.heroPX, y = c.heroPY;
  if(x == null){ x = 50; y = c.heroImgPos === 'top' ? 0 : c.heroImgPos === 'bottom' ? 100 : 50; }
  return {src:String(c.heroImg), fit, x:fit ? 50 : x, y:fit ? 50 : y, zoom:fit ? 1 : (c.heroZoom || 1), op:c.heroImgOp != null ? c.heroImgOp : .45};
}
function prayer(){
  const U = M.prayerUI; if(!U) return null;
  const day = U.ps.date, isToday = M.dkey(day) === M.dkey();
  const t = M.prayerTimes(day), info = M.nextPrayer(new Date()), hj = M.hijri ? M.hijri(day) : null;
  const hjText = hj ? M.n(hj.d)+' '+M.HMONTHS[hj.m - 1]+' '+M.n(hj.y)+' هـ' : '';
  const out = {loc:M.location().name, isToday, hero:hero('prayer'),
    dayTitle:M.WEEKDAYS[day.getDay()]+'، '+M.n(day.getDate())+' '+M.GMONTHS[day.getMonth()]+' '+M.n(day.getFullYear()), hijri:hjText,
    icons:M.cfg.prIcons !== false, grid:M.cfg.ppView === 'grid', simple:!!M.cfg.ppSimple,
    ic:{cal:icon('calendar'), set:icon('settings'), pin:icon('pin'), down:icon('chevDown'), back:icon('back'), fwd:icon('fwd'), bell:icon('bell'), qibla:icon('s:qibla')}};
  if(isToday){
    out.next = {name:info.next.k === 'sunrise' ? 'الشروق' : 'صلاة '+M.prayerLabel(info.next.k), time:M.fmt(info.next.t), at:+info.next.t, prev:+info.prev.t};
  } else out.summary = {title:M.WEEKDAYS[day.getDay()], sub:hjText};
  out.times = M.PRAYERS.map(([k, name, ic])=>{
    const lbl = k === 'dhuhr' && day.getDay() === 5 ? 'الجمعة' : name;
    const iq = M.cfg.iqamaOn !== false && (M.cfg.iqama || {})[k] ? new Date(+t[k] + M.cfg.iqama[k] * 60000) : null;
    return {k, label:lbl, icon:icon(ic), time:M.fmt(t[k]), iqama:iq ? 'الإقامة '+M.fmt(iq)+' (بعد '+M.n(M.cfg.iqama[k])+' د)' : '',
      next:isToday && info.next.k === k, now:isToday && !!info.prev && info.prev.k === k, bell:!!(M.cfg.notifyIn || {})[k], canBell:k !== 'sunrise' || true};
  });
  if(M.plogDay && M.cfg.plogCard !== false && M.dkey(day) <= M.dkey()){
    const d = M.plogDay(day);
    out.plog = {title:d.today ? 'صلوات اليوم' : 'سجل صلوات هذا اليوم', count:M.n(d.count)+'/'+M.n(5), dk:d.dk,
      items:d.items.map(x=>({k:x.k, label:x.label, st:x.st, sub:x.sub, future:x.future, icon:icon(x.ic)})), allIcon:icon('calendar')};
  }
  if(!out.simple || M.cfg.ppSun) out.extra = [['الضحى (تقريبًا)', M.fmt(t.duha)], ['منتصف الليل', M.fmt(t.midnight)], ['الثلث الأخير من الليل', M.fmt(t.lastThird)]];
  if(!out.simple && M.cfg.showForbid !== false){
    const ms = x=>new Date(+x);
    out.forbid = {rows:[['بعد الشروق (ترتفع الشمس)', M.fmt(t.sunrise)+' – '+M.fmt(ms(+t.sunrise + 15 * 60000))],
      ['عند الاستواء (قبيل الظهر)', M.fmt(ms(+t.dhuhr - 10 * 60000))+' – '+M.fmt(t.dhuhr)], ['قبيل الغروب', M.fmt(ms(+t.maghrib - 15 * 60000))+' – '+M.fmt(t.maghrib)]],
      note:'تقديرية؛ يُحتاط بنحو ١٥ دقيقة بعد الشروق وقبل الغروب و١٠ قبل الظهر.'};
  }
  if(!out.simple){ const q = Math.round(M.qiblaDeg()); out.qibla = {deg:q, sub:M.n(q)+'° من الشمال الحقيقي • '+M.n(Math.round(M.distKaaba()).toLocaleString('en'))+' كم إلى الكعبة'}; }
  const meth = (M.METHODS.find(m=>m[0] === M.cfg.method) || [, ''])[1];
  out.method = 'طريقة الحساب: '+meth+(M.cfg.method === 'auto' && M.methodKey ? ' ('+((M.METHODS.find(m=>m[0] === M.methodKey()) || [, ''])[1])+')' : '')+' • '+(M.cfg.madhhab === 'hanafi' ? 'العصر حنفي' : 'العصر شافعي/جمهور');
  return out;
}

/* ---------------- any screen of the app, read off the page and redrawn natively ----------------
   The page keeps building its screens (all their logic, data and settings); this walks what it built and describes it to the
   native side: stacks, grids, cards, texts with their real computed size/weight/colour/font, bars, icons and pictures (SVG drawn
   to images with their own colours). Whatever can be tapped gets an id; a native tap clicks the very same element here. */
let taps = new Map(), tapSeq = 0;
const svgCache = new WeakMap();
function svgKey(el, w, hgt){
  // the drawing with the colours CSS gave it (fill/stroke resolved per element), cached per element and look
  const parts = [];
  const sig = el.outerHTML.length+':'+w+'x'+hgt+':'+getComputedStyle(el).color;
  const old = svgCache.get(el); if(old && old.sig === sig) return old.key;
  const clone = el.cloneNode(true), src = [el, ...el.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
  src.forEach((s, i)=>{ const c = getComputedStyle(s), d = dst[i]; if(!d || !d.setAttribute) return;
    if(c.display === 'none'){ d.setAttribute('display', 'none'); return; }
    ['fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'transform', 'transform-origin'].forEach(p=>{
      const v = c.getPropertyValue(p); if(v && v !== 'none' || p === 'fill' || p === 'stroke') d.setAttribute(p === 'transform' ? 'style' : p, p === 'transform' ? (v && v !== 'none' ? 'transform:'+v+';transform-origin:'+c.getPropertyValue('transform-origin')+';transform-box:'+c.getPropertyValue('transform-box') : '') : v); });
    d.removeAttribute('class'); });
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', w * 3); clone.setAttribute('height', hgt * 3);
  if(!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', '0 0 '+w+' '+hgt);
  clone.setAttribute('style', 'color:'+getComputedStyle(el).color);
  const xml = clone.outerHTML; let hsh = 0; for(let i = 0; i < xml.length; i++) hsh = (hsh * 31 + xml.charCodeAt(i)) | 0;
  const key = 'svg'+(hsh >>> 0).toString(36)+'_'+w+'x'+hgt;
  svgCache.set(el, {sig, key});
  if(!iconCache[key] && !pending[key]){
    pending[key] = true; const img = new Image();
    img.onload = ()=>{ try{ const c = document.createElement('canvas'); c.width = w * 3; c.height = hgt * 3; c.getContext('2d').drawImage(img, 0, 0, w * 3, hgt * 3); iconCache[key] = c.toDataURL('image/png'); }catch(e){} delete pending[key]; send(); };
    img.onerror = ()=>{ delete pending[key]; };
    img.src = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml);
  }
  return key;
}
const fam = f=>/QCF/i.test(f) ? 'qcf' : /Messiri|Rakkas|Reem|Ruqaa/i.test(f) ? 'title' : /Amiri|QParen|Quran|Uthman|KFGQPC|Naskh/i.test(f) ? 'quran' : 'text';
function textStyle(cs){
  const ta = cs.textAlign;
  const f = fam(cs.fontFamily);
  return {fs:+parseFloat(cs.fontSize).toFixed(1), fw:+cs.fontWeight || 400, col:rgb(cs.color), fam:f, ff:f === 'qcf' ? cs.fontFamily.split(',')[0].replace(/["']/g, '').trim() : undefined,
    al:ta === 'center' ? 'c' : (ta === 'left' || ta === 'end') ? 'e' : 's', lh:+(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) || 1.5).toFixed(2)};
}
function clickable(el){
  if(el.disabled) return false;
  const t = el.tagName;
  return t === 'BUTTON' || t === 'A' || t === 'LABEL' || el.getAttribute('role') === 'button' || typeof el.onclick === 'function' || el.hasAttribute('data-tap') || (el.hasAttribute('data-k') && !!el.closest('.mpage, .va-act, .q-list'));
}
function boxStyle(el, cs){
  const b = {};
  const bg = rgb(cs.backgroundColor); if(bg[3] > 0.02) b.bg = bg;
  if(el.classList.contains('card') || el.classList.contains('tile') || el.classList.contains('pg-tile')) b.glass = 1;
  if(el.classList.contains('accent')) b.accent = 1;
  if(cs.backgroundImage && cs.backgroundImage.startsWith('linear-gradient') && !b.glass){ const m = cs.backgroundImage.match(/(rgba?\([^)]+\)|oklab\([^)]+\)|color\([^)]+\)|#[0-9a-f]+)/gi); if(m && m.length >= 2){ b.grad = [rgb(m[0]), rgb(m[m.length - 1])]; } }
  const r = parseFloat(cs.borderTopLeftRadius) || 0; if(r) b.rad = Math.min(r, 400);
  const p = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(x=>Math.round(parseFloat(x) || 0)); if(p.some(Boolean)) b.pad = p;
  const bw = parseFloat(cs.borderTopWidth) || 0; if(bw && cs.borderTopStyle !== 'none'){ const bc = rgb(cs.borderTopColor); if(bc[3] > 0.05) b.bor = {w:bw, c:bc}; }
  const sh = cs.boxShadow; if(sh && sh.indexOf('inset') >= 0 && !b.bor){ const m = /(rgba?\([^)]+\))\s+0px\s+0px\s+0px\s+([\d.]+)px\s+inset/.exec(sh) || /inset\s+0px\s+0px\s+0px\s+([\d.]+)px\s+(rgba?\([^)]+\))/.exec(sh); if(m){ const c = m[1].startsWith('rgb') ? m[1] : m[2], w = m[1].startsWith('rgb') ? m[2] : m[1]; const bc = rgb(c); if(bc[3] > 0.05) b.bor = {w:+w, c:bc}; } }
  // an entrance animation in progress is not the element's look
  const op = +cs.opacity; if(op < 0.99 && !(el.getAnimations && el.getAnimations().length) && cs.animationName === 'none') b.op = +op.toFixed(2);
  return b;
}
function showsInside(el, d){
  for(const c of el.children){ const r = c.getBoundingClientRect(); if(r.width && r.right > 1 && r.left < innerWidth - 1) return true; if(d < 4 && showsInside(c, d + 1)) return true; }
  return false;
}
function inScroller(el){
  for(let p = el.parentElement, i = 0; p && i < 8; p = p.parentElement, i++){ const o = getComputedStyle(p).overflowX; if(o === 'auto' || o === 'scroll') return true; }
  return false;
}
function convert(el, depth){
  if(depth > 40) return null;
  const cs = getComputedStyle(el);
  if(cs.display === 'none' || cs.visibility === 'hidden' || el.hidden) return null;
  if(el.hasAttribute('data-native-skip')) return null;
  const tag = el.tagName;
  const r = el.getBoundingClientRect();
  if(!r.width && !r.height && cs.position !== 'fixed') return null;
  if((r.right <= 1 || r.left >= innerWidth - 1) && cs.position !== 'fixed' && !inScroller(el) && !showsInside(el, 0)) return null;
  let n;
  if(tag === 'svg' || tag === 'SVG' || el instanceof SVGElement){
    const w = Math.max(1, Math.round(r.width)), hh = Math.max(1, Math.round(r.height));
    n = {k:'img', ic:svgKey(el, w, hh), w, h:hh};
  } else if(tag === 'IMG'){
    n = {k:'pic', src:el.getAttribute('src') || '', w:Math.round(r.width), h:Math.round(r.height), fit:cs.objectFit === 'contain' ? 1 : 0};
  } else if(tag === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')){
    const id = 't'+(++tapSeq); taps.set(id, el);
    n = {k:'check', on:el.checked ? 1 : 0, radio:el.type === 'radio' ? 1 : 0, tap:id, col:token('--p')};
    return n;
  } else if(tag === 'CANVAS'){
    let src = ''; try{ src = el.toDataURL('image/jpeg', 0.88); }catch(e){}
    const id = 't'+(++tapSeq); taps.set(id, el);
    n = {k:'cimg', src, w:Math.round(r.width), h:Math.round(r.height), tap:id};
    return n;
  } else if(tag === 'VIDEO'){
    n = {k:'video', src:el.currentSrc || el.src || '', poster:el.poster || '', w:Math.round(r.width), h:Math.round(r.height)};
    return n;
  } else if(tag === 'INPUT' && /^(date|time|datetime-local|month)$/.test(el.type)){
    const id = 'f'+(++tapSeq); taps.set(id, el);
    n = {k:'date', id, val:el.value || '', type:el.type, min:el.min || '', max:el.max || '', ...textStyle(cs)};
    return n;
  } else if(tag === 'INPUT' && el.type === 'color'){
    const id = 'f'+(++tapSeq); taps.set(id, el);
    n = {k:'color', id, val:el.value || '#000000', w:Math.round(r.width) || 36, h:Math.round(r.height) || 36};
    return n;
  } else if(tag === 'INPUT' && el.type === 'range'){
    const id = 'f'+(++tapSeq); taps.set(id, el);
    n = {k:'range', id, min:+el.min || 0, max:el.max === '' ? 100 : +el.max, step:+el.step || 1, val:+el.value};
  } else if(tag === 'INPUT' || tag === 'TEXTAREA'){
    const id = 'f'+(++tapSeq); taps.set(id, el);
    n = {k:'field', id, val:el.value || '', ph:el.placeholder || '', type:el.type || 'text', ...textStyle(cs)};
  } else if(tag === 'SELECT'){
    const id = 'f'+(++tapSeq); taps.set(id, el);
    n = {k:'select', id, val:el.value, opts:[...el.options].map(o=>[o.value, o.textContent]), ...textStyle(cs)};
  } else if(el.classList.contains('bar') && el.firstElementChild && el.firstElementChild.tagName === 'I'){
    const i = el.firstElementChild, ir = i.getBoundingClientRect();
    n = {k:'bar', frac:r.width ? +(ir.width / r.width).toFixed(3) : 0, col:rgb(getComputedStyle(i).backgroundColor), track:rgb(cs.backgroundColor), h:Math.max(3, Math.round(r.height))};
  } else if(!el.children.length && !el.textContent.trim() && /url\(/.test(cs.webkitMaskImage || cs.maskImage || '')){
    // a picture used as a mask, coloured by its background (the Mushaf's surah frames, emblems)
    const m = /url\(["']?([^"')]+)["']?\)/.exec(cs.webkitMaskImage || cs.maskImage);
    n = {k:'mask', src:m ? m[1] : '', col:rgb(cs.backgroundColor), w:Math.round(r.width), h:Math.round(r.height)};
  } else if(el.classList.contains('switch')){
    n = {k:'switch', on:el.classList.contains('on') ? 1 : 0, col:rgb(cs.backgroundColor)};
  } else {
    const kids = [];
    let mixedText = '';
    const inlineOnly = [...el.childNodes].every(c=>c.nodeType === 3 || (c.nodeType === 1 && /^(B|I|EM|STRONG|SMALL|SPAN|BR|SUP|SUB)$/.test(c.tagName) && !c.children.length && getComputedStyle(c).display.startsWith('inline') && !c.classList.length));
    if(inlineOnly){
      mixedText = el.innerText.replace(/[ \t]+/g, ' ').trim();
      if(mixedText) kids.push({k:'t', tx:mixedText, ...textStyle(cs)});
    } else {
      el.childNodes.forEach(c=>{
        if(c.nodeType === 3){ const t = c.textContent.replace(/\s+/g, ' ').trim(); if(t) kids.push({k:'t', tx:t, ...textStyle(cs)}); }
        else if(c.nodeType === 1){ const x = convert(c, depth + 1); if(x) kids.push(x); }
      });
    }
    const disp = cs.display;
    let k = 'v';
    if(disp.indexOf('flex') >= 0) k = cs.flexDirection.startsWith('row') ? 'h' : 'v';
    else if(disp.indexOf('grid') >= 0){ const cols = cs.gridTemplateColumns.split(/\s+(?![^(]*\))/).filter(Boolean).length; k = cols > 1 ? 'g' : 'v'; if(k === 'g') n = {cols}; }
    n = Object.assign(n || {}, {k, c:kids});
    if(k === 'h' && (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 2) n.k = 'hs';   // a strip that scrolls sideways
    const gap = parseFloat(cs.columnGap) || parseFloat(cs.gap) || 0, rgap = parseFloat(cs.rowGap) || 0;
    if(gap) n.gap = Math.round(gap); if(rgap && k !== 'h') n.rgap = Math.round(rgap);
    const ai = cs.alignItems; if(ai === 'center') n.ai = 'c'; else if(ai === 'flex-end' || ai === 'end') n.ai = 'e'; else if(ai === 'baseline') n.ai = 'b';
    const jc = cs.justifyContent; if(jc === 'space-between') n.jc = 'b'; else if(jc === 'center') n.jc = 'c'; else if(jc === 'flex-end' || jc === 'end') n.jc = 'e'; else if(jc === 'space-around' || jc === 'space-evenly') n.jc = 'a';
    if(cs.textAlign === 'center' && k === 'v') n.ai = n.ai || 'c';
    Object.assign(n, boxStyle(el, cs));
    if(!kids.length && !n.bg && !n.glass && !n.bor && !n.grad) return null;
  }
  // sizes the layout depends on: grow in a row, fixed width boxes
  const pcs = el.parentElement ? getComputedStyle(el.parentElement) : null;
  if(pcs && pcs.display.indexOf('flex') >= 0 && +cs.flexGrow >= 1) n.grow = 1;
  if(n.k !== 'img' && n.k !== 'pic' && cs.display.startsWith('block') && pcs && pcs.display === 'block') n.full = 1;
  if((n.k === 'v' || n.k === 'h' || n.k === 'g') && (n.bg || n.glass || n.grad) && /px$/.test(el.style.width || '')) n.w = Math.round(r.width);
  if((n.bg || n.glass || n.grad || n.bor) && r.height && (el.style.height || cs.aspectRatio !== 'auto')) n.h = Math.round(r.height);
  // small boxes keep their size (round icon buttons, chips with an icon, badges)
  if((n.k === 'v' || n.k === 'h') && (n.bg || n.glass || n.bor || clickable(el)) && r.width && r.width <= 72 && r.height <= 72){ n.w = Math.round(r.width); n.h = Math.round(r.height); if(!n.ai) n.ai = 'c'; if(n.k === 'h' && !n.jc) n.jc = 'c'; }
  const mt = parseFloat(cs.marginTop) || 0; if(mt > 0) n.mt = Math.round(mt);
  if(clickable(el)){ const id = 't'+(++tapSeq); taps.set(id, el); n.tap = id; if(el.getAttribute('aria-label')) n.lbl = el.getAttribute('aria-label'); if(el.hasAttribute('data-k') && el.closest('.mpage')) n.lp = 1; }
  // laid over its parent (frames, toolbars, badges): drawn at the same place
  if((cs.position === 'absolute' || cs.position === 'fixed') && el.parentElement){
    const pr = el.parentElement.getBoundingClientRect();
    n.abs = [Math.round(r.left - pr.left), Math.round(r.top - pr.top), Math.round(r.width), Math.round(r.height)];
    if(+cs.zIndex < 0 || el.classList.contains('mp-fr')) n.under = 1;
  }
  // a box whose content is all laid over it keeps its own size
  if(n.c && n.c.length && n.c.every(x=>x.abs)){ n.w = Math.round(r.width); n.h = Math.round(r.height); }
  // a plain wrapper around one thing adds nothing
  if((n.k === 'v' || n.k === 'h') && n.c && n.c.length === 1 && !n.bg && !n.glass && !n.grad && !n.bor && !n.pad && !n.tap && !n.op && !n.w && !n.h && !n.abs && !n.c[0].abs){ const one = n.c[0]; if(n.mt) one.mt = (one.mt || 0) + n.mt; if(n.grow) one.grow = 1; if(n.full) one.full = 1; return one; }
  return n;
}
function screenTree(sel, skip){
  const el = document.querySelector(sel); if(!el) return null;
  const kids = [];
  [...el.children].forEach(c=>{ if(skip && c.matches(skip)) return; const x = convert(c, 0); if(x){ x.full = 1; kids.push(x); } });
  const cs = getComputedStyle(el);
  return {k:'v', c:kids, gap:parseFloat(cs.rowGap) || 0};
}

/* ---------------- home: the next-prayer card natively (live countdown), every other block read off the page ---------------- */
function home(){
  const n = M.nextPrayer(new Date()), loc = M.location();
  const name = n.next.k === 'sunrise' ? 'الشروق' : n.next.k === 'dhuhr' && n.next.t.getDay() === 5 ? 'الجمعة' : M.prayerLabel(n.next.k, n.next.t);
  const B = M.cfg.homeBlocks || {};
  const hk = document.querySelector('#screen-home .home-prayer');
  return {hero:B.prayer !== false && hk ? {name, time:M.fmt(n.next.t)+' • '+loc.name, at:+n.next.t, prev:+n.prev.t, img:hero('home')} : null,
    heroAfter:hk ? [...hk.parentElement.children].indexOf(hk) : 0,
    tree:screenTree('#screen-home', '.home-prayer')};
}

/* ---------------- what is in front: a page, a sheet, a dialog or the welcome hides the native layer ---------------- */
/* things only the page can draw (the Mushaf's pages with their own fonts, the compass and maps, video, date pickers):
   a page or sheet holding one of them stays the page's own */
const UNSUP = 'iframe, .leaflet-container, [contenteditable=""], [contenteditable="true"], .mf-ln, [data-native-skip]';
function unsupported(el){
  if(!el) return true;
  if(el.matches && el.matches(UNSUP)) return true;
  if(el.querySelector(UNSUP)) return true;
  // a video the phone's player cannot open (a stream assembled by the page itself)
  const v = el.querySelector('video'); if(v && /^blob:/.test(v.currentSrc || v.src || '')) return true;
  // fonts the page downloaded itself (other Mushaf editions) are not in the app
  const f = [...el.querySelectorAll('[style*="QCF"]')].some(x=>!/QCF4_(Hafs_\d\d|QBSML)/.test(x.style.fontFamily));
  return f;
}
const liveViews = ()=>(M.views || []).filter(v=>!v.closed && v.el && v.el.isConnected && !v.el.classList.contains('leaving'));
const liveSheets = ()=>[...document.querySelectorAll('#sheet-root .sheet')].filter(s=>!s.classList.contains('leaving') && s.isConnected);
/* the page's view on top (title, the buttons in its header, its body) and the sheet over it, when they can be drawn natively */
function layers(){
  const out = {view:null, sheet:null, web:false};
  if(document.querySelector('.pop-root, .ob, .dialog-root, #sheet-root .dialog, #lock-screen, .lockscr')) { out.web = true; return out; }
  const vs = liveViews(), top = vs[vs.length - 1];
  if(top){
    if(unsupported(top.body)) { out.web = true; return out; }
    const head = top.head && top.head.isConnected ? top.head : null;
    const acts = head ? [...head.children].slice(2).map(c=>convert(c, 0)).filter(Boolean) : [];
    const vbg = top.el.style.background ? rgb(getComputedStyle(top.el).backgroundColor) : null;
    out.view = {id:top.el.id || '', title:(top.title && top.title.textContent) || '', actions:acts, body:tree(top.body), depth:vs.length, bg:vbg, nohead:!head};
  }
  const ss = liveSheets(), sh = ss[ss.length - 1];
  if(sh){
    const b = sh.querySelector('.sheet-b');
    if(unsupported(b)) { out.web = true; out.view = null; return out; }
    const t = sh.querySelector('.sheet-h');
    out.sheet = {title:t ? t.textContent.trim() : '', body:tree(b), n:ss.length};
  }
  return out;
}
function tree(el){
  const cs = getComputedStyle(el), kids = [];
  [...el.children].forEach(c=>{ const x = convert(c, 0); if(x){ x.full = 1; kids.push(x); } });
  const out = {k:'v', c:kids, gap:parseFloat(cs.rowGap) || 0, pad:[cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(x=>Math.round(parseFloat(x) || 0))};
  if(kids.length && kids.every(x=>x.abs)){ const r = el.getBoundingClientRect(); out.w = Math.round(r.width); out.h = Math.round(r.height); out.full = 1; }
  return out;
}
function modal(L){ return !!(L && L.web); }
const NATIVE_TABS = ['prayer', 'home', 'adhkar', 'more', 'quran'];
const TREE_TABS = ['adhkar', 'more', 'quran'];          // drawn entirely from what the page built

/* ---------------- sending ---------------- */
let last = '', timer = 0;
function send(){
  clearTimeout(timer);
  timer = setTimeout(()=>{
    try{
      taps = new Map(); tapSeq = 0;
      const tab = M.curTab || 'home', L = layers(), mdl = modal(L);
      const tabWeb = TREE_TABS.includes(tab) && unsupported(document.querySelector('#screen-'+tab));   // a tab holding something only the page draws stays the page's
      const showNative = NATIVE_TABS.includes(tab) && !mdl && !tabWeb && !L.view;
      root.toggleAttribute('data-native-show', showNative);
      root.toggleAttribute('data-native-view', !mdl && !!L.view);
      root.toggleAttribute('data-native-sheet', !mdl && !!L.sheet);
      const model = {tab, modal:mdl, tabWeb, theme:theme(), nav:nav(), prayer:tab === 'prayer' ? prayer() : null, home:tab === 'home' ? home() : null,
        screen:TREE_TABS.includes(tab) && !tabWeb ? screenTree('#screen-'+tab) : null, view:mdl ? null : L.view, sheet:mdl ? null : L.sheet};
      // icons go once each (the native side keeps them)
      const icons = {}; Object.keys(iconCache).forEach(k=>{ if(!sent.has(k)){ icons[k] = iconCache[k]; sent.add(k); } });
      model.icons = icons;
      const j = JSON.stringify(model);
      if(j === last && !Object.keys(icons).length) return;
      last = j; Android.setNativeModel(j);
    }catch(e){ console.error(e); }
  }, 40);
}

/* ---------------- what the native side asks for ---------------- */
M.native = {
  send,
  resend(){ sent.clear(); last = ''; send(); },
  act(name, arg){
    const U = M.prayerUI || {};
    try{
      switch(name){
        case 'tab': M.setTab(arg); break;
        case 'section': M.sectionOpen && M.sectionOpen(arg); break;
        case 'loc': M.locationSheet && M.locationSheet(); break;
        case 'sched': U.openSchedule && U.openSchedule(); break;
        case 'psettings': M.prayerSettings && M.prayerSettings(); break;
        case 'day': U.shift && U.shift(+arg || 0); break;
        case 'prayer': { const d = U.ps ? U.ps.date : new Date(), t = M.prayerTimes(d); const row = M.PRAYERS.find(p=>p[0] === arg); const lbl = arg === 'dhuhr' && d.getDay() === 5 ? 'الجمعة' : (row ? row[1] : arg); U.prayerSheet && U.prayerSheet(arg, lbl, t); break; }
        case 'bell': { const n = Object.assign({}, M.cfg.notifyIn); n[arg] = !n[arg]; M.save('notifyIn', n); if(n[arg] && window.Android && Android.requestNotifPerm) try{ Android.requestNotifPerm(); }catch(e){} M.haptic && M.haptic(8); break; }
        case 'plog': { const d = M.plogDay ? M.plogDay(U.ps ? U.ps.date : new Date()) : null; if(d && M.plogPick) M.plogPick(d.dk, arg, ()=>send()); break; }
        case 'plogAll': M.openTracker && M.openTracker({tab:'prayers'}); break;
        case 'forbid': M.openNawafil ? M.openNawafil('forbidden') : M.sectionOpen && M.sectionOpen('forbidden'); break;
        case 'qibla': M.openQibla && M.openQibla(); break;
        case 'hero': M.setTab('prayer'); break;
        case 'back': M.onBack && M.onBack(); break;
        case 'page': { const R = M.readerR; if(R && R.pager){ R.pager.goto(R.pager.cur + (+arg || 0), false); } else if(R && R.sc){ const sc = R.sc; sc.scrollBy && sc.scrollBy(0, (+arg || 0) * innerHeight * .8); } break; }
        case 'long': { const el = taps.get(arg); if(el){ const o = {bubbles:true, pointerId:1, isPrimary:true}; el.dispatchEvent(new PointerEvent('pointerdown', o)); setTimeout(()=>el.dispatchEvent(new PointerEvent('pointerup', o)), 620); } break; }
        case 'submit': { const el = taps.get(arg); if(el){ el.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); el.dispatchEvent(new KeyboardEvent('keyup', {key:'Enter', bubbles:true})); } break; }
        case 'tap': { const el = taps.get(arg); if(el && el.isConnected){ el.click(); if(el.getAttribute('role') === 'button' && typeof el.onclick !== 'function') el.dispatchEvent(new MouseEvent('click', {bubbles:true})); } break; }
        case 'field': { const i = arg.indexOf(''), id = arg.slice(0, i), v = arg.slice(i + 1), el = taps.get(id); if(el){ el.value = v; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); } break; }
      }
    }catch(e){ console.error(e); }
    send();
  }
};

/* ---------------- when to send ---------------- */
const setTab0 = M.setTab;
M.setTab = function(){ const r = setTab0.apply(this, arguments); send(); return r; };
if(M.prayerUI && M.prayerUI.refresh){ const r0 = M.prayerUI.refresh; M.prayerUI.refresh = function(){ const r = r0.apply(this, arguments); send(); return r; }; }
M.on && M.on('settings', ()=>{ send(); setTimeout(send, 400); });
M.on && M.on('plog', send);
// the screen being redrawn changes (ticks, ticks off, a card rebuilt): send again, at most every 300 ms
let mt = 0; const soon = ()=>{ if(mt) return; mt = setTimeout(()=>{ mt = 0; send(); }, 300); };
['#screen-home', '#screen-adhkar', '#screen-more', '#screen-quran', '#views', '#sheet-root'].forEach(sel=>{ const el = document.querySelector(sel) || null; const inHero = n=>{ const e = n && (n.nodeType === 1 ? n : n.parentElement); return !!(e && e.closest && e.closest('.home-prayer')); };
  const watch = x=>new MutationObserver(list=>{ if(list.every(m=>inHero(m.target))) return; soon(); }).observe(x, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class', 'style', 'aria-pressed']});
  if(el) watch(el); else { const s0 = document.getElementById('screens'); if(s0) new MutationObserver(()=>{ const e = document.querySelector(sel); if(e && !e._nw){ e._nw = 1; watch(e); } }).observe(s0, {childList:true}); } });
new MutationObserver(send).observe(root, {attributes:true, attributeFilter:['data-views', 'data-theme', 'data-skin', 'data-solid', 'data-contrast']});
const app = document.getElementById('app') || document.body;
new MutationObserver(send).observe(document.body, {childList:true});
new MutationObserver(send).observe(app, {childList:true});
const sr = document.getElementById('sheet-root'); if(sr) new MutationObserver(send).observe(sr, {childList:true});
setInterval(send, 30000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) send(); });
if(document.readyState === 'complete') send(); else addEventListener('load', ()=>setTimeout(send, 50));
setTimeout(send, 600);
})();
