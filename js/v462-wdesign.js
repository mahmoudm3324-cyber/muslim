/* 4.6.2 «صمّم ودجتك» — the user's own widgets.
   A design is a column of blocks (the next prayer, the count-down, the day's times, the dates, a dhikr, an ayah…) with
   its colours, alignment and text size. The same layout rules are drawn three times, kept in step by hand:
     · here, for the live preview,
     · on Android by WDraw.custom (android/src/…/WDraw.java) — the designs are handed over with Android.setCustomDesigns,
       and each placed widget remembers its design;
     · on the iPhone by MuslimHomeWidget/Custom.swift — a free Apple ID gives the widget no shared storage with the app,
       so the design travels as a short code the user pastes in «Edit Widget».
   Block heights (in dp / pt, times the text size): next 46, count 30, times 38, bar 10, hijri 24, greg 19, city 19,
   dhikr 40+, ayah 46+. Padding 16 (12 when the widget is under 130 on a side), 6 between blocks. */
(function(){
'use strict';
const h = M.h;
const BLOCKS = [
  ['next', 'الصلاة القادمة', 'clock', 'n'], ['count', 'العدّ التنازلي', 't:alarm', 'c'], ['times', 'أوقات اليوم', 'list', 't'],
  ['bar', 'شريط التقدّم', 't:hourglass', 'p'], ['hijri', 'التاريخ الهجري', 'moon', 'h'], ['greg', 'اليوم والتاريخ الميلادي', 'calendar', 'g'],
  ['city', 'المدينة', 'pin', 'y'], ['dhikr', 'ذكر اليوم', 'beads', 'd'], ['ayah', 'آية اليوم', 'quran', 'a']];
const BN = Object.fromEntries(BLOCKS.map(b=>[b[0], b]));
const SIZES = [['s', 'صغير', '٢×٢', 'صغير', 160, 160], ['m', 'متوسط', '٤×٢', 'متوسط', 340, 160], ['l', 'كبير', '٤×٤', 'كبير', 340, 340], ['w', 'شريط', '٤×١', '', 340, 80]];
const SZ = Object.fromEntries(SIZES.map(s=>[s[0], s]));
const TEMPLATES = [
  {n:'الصلاة القادمة', bg:'#20261F', tx:'#FFFFFF', ac:'#D9B863', op:100, al:'c', fs:100, b:['greg', 'next', 'count', 'bar', 'times']},
  {n:'هجري وذكر', bg:'#0F5A47', tx:'#FFFFFF', ac:'#CCE9DD', op:100, al:'c', fs:100, b:['hijri', 'greg', 'dhikr']},
  {n:'آية اليوم', bg:'#0F172A', tx:'#F5EFE0', ac:'#93C5FD', op:100, al:'c', fs:100, b:['hijri', 'ayah']},
  {n:'بسيط فاتح', bg:'#FFFFFF', tx:'#14342B', ac:'#0F8A6D', op:92, al:'s', fs:100, b:['next', 'count', 'city']},
  {n:'شريط الصلاة', bg:'#000000', tx:'#FFFFFF', ac:'#D9B863', op:85, al:'s', fs:100, b:['next', 'count']}];
const PAL = {bg:['#20261F', '#0F5A47', '#0F172A', '#3B1D2A', '#4A3423', '#23262B', '#000000', '#FFFFFF', '#F4EFE6'],
  tx:['#FFFFFF', '#F5EFE0', '#CFE6CF', '#14342B', '#111111'], ac:['#D9B863', '#CCE9DD', '#93C5FD', '#F0ABFC', '#FCA5A5', '#0F8A6D', '#FFFFFF', '#21778C']};
const uid = ()=>'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const clean = d=>({id:d.id || uid(), n:String(d.n || 'تصميمي').slice(0, 30), bg:d.bg || '#20261F', tx:d.tx || '#FFFFFF', ac:d.ac || '#D9B863',
  op:Math.max(20, Math.min(100, +d.op || 100)), al:d.al === 's' ? 's' : 'c', fs:Math.max(80, Math.min(130, +d.fs || 100)), b:(d.b || []).filter(x=>BN[x]).slice(0, 9)});

/* ---- storage, and the hand-over to Android ---- */
const list = ()=>(M.cfg.cwList || []).map(clean);
function saveList(l){ M.cfg.cwList = l.map(clean); M.save(); sync(); }
function sync(){
  try{ if(window.Android && Android.setCustomDesigns){ const o = {}; list().forEach(d=>o[d.id] = d); Android.setCustomDesigns(JSON.stringify(o)); } }catch(e){}
}
M.wDesigns = {list, save:saveList, sync, TEMPLATES, clean};
setTimeout(sync, 2500);   // after an update or a restore the widgets get the designs again

/* ---- the code for the iPhone: M1.<blocks>.<bg tx ac>.<opacity>.<align><size>  e.g. M1.gncpt.20261FFFFFFFD9B863.100.c100 ---- */
const hex = c=>String(c || '').replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6);
function code(d){ d = clean(d); return 'M1.' + d.b.map(b=>BN[b][3]).join('') + '.' + hex(d.bg) + hex(d.tx) + hex(d.ac) + '.' + d.op + '.' + d.al + d.fs; }
function fromCode(s){
  const m = /^M1\.([a-z]*)\.([0-9A-F]{18})\.(\d{1,3})\.([cs])(\d{2,3})$/i.exec(String(s || '').trim()); if(!m) return null;
  const by = Object.fromEntries(BLOCKS.map(b=>[b[3], b[0]]));
  return clean({b:[...m[1]].map(c=>by[c]).filter(Boolean), bg:'#' + m[2].slice(0, 6), tx:'#' + m[2].slice(6, 12), ac:'#' + m[2].slice(12), op:+m[3], al:m[4], fs:+m[5]});
}
M.wDesigns.code = code; M.wDesigns.fromCode = fromCode;

/* ---- what the widget will show today: the same numbers the native widgets get (M.widgetData) ---- */
let cache = null, cacheAt = 0;
function data(){
  if(cache && Date.now() - cacheAt < 30000) return cache;
  const w = M.widgetData ? M.widgetData() : {times:[], days:[], adhkar:[], ayat:[], city:''};
  const now = Date.now(), all = w.times || [];
  let ni = all.findIndex(r=>r[2] > now && r[0] !== 'sunrise');
  const out = {city:w.city || '', day:(w.days || [])[0] || null, six:[], ni:-1, prev:null, dhikr:'', ayah:''};
  if(ni >= 0){ const start = ni - (ni % 6); out.six = all.slice(start, start + 6); out.ni = ni - start; out.prev = ni > 0 ? all[ni - 1] : null; }
  const t = new Date(), doy = Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 864e5), dn = t.getFullYear() * 400 + doy;   // = PrayerWidget.dayNumber()
  if(w.adhkar && w.adhkar.length) out.dhikr = w.adhkar[dn % w.adhkar.length][0];
  if(w.ayat && w.ayat.length) out.ayah = w.ayat[dn % w.ayat.length][0];
  cache = out; cacheAt = Date.now();
  return out;
}

/* ---- the preview: the same rules as WDraw.custom, in CSS pixels at 1 dp = 1 px, scaled to fit its frame ---- */
const cv = document.createElement('canvas').getContext('2d');
const FONT = {r:'400 X "Readex Pro","Readex",system-ui,sans-serif', b:'700 X "Readex Pro","Readex",system-ui,sans-serif', q:'400 X "Amiri Quran",serif'};
const tw = (s, px, f)=>{ cv.font = FONT[f].replace('X', px + 'px'); return cv.measureText(s).width; };
const fit = (s, maxW, px, f)=>{ const w = tw(s, px, f); return w > maxW && w > 0 ? px * maxW / w : px; };
const alpha = (c, a)=>{ const n = parseInt(hex(c), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
const H_ = {next:46, count:30, times:38, bar:10, hijri:24, greg:19, city:19, dhikr:40, ayah:46};
const flexB = b=>b === 'dhikr' || b === 'ayah';
const pad2 = n=>(n < 10 ? '0' : '') + n;
const left = at=>{ let s = Math.max(0, Math.round((at - Date.now()) / 1000)); const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return (hh ? hh + ':' + pad2(mm) : mm) + ':' + pad2(ss); };

function render(d0, sizeKey){
  const d = clean(d0), [, , , , W, H] = SZ[sizeKey] || SZ.m, D = data();
  const P = Math.min(W, H) < 130 ? 12 : 16, x0 = P, x1 = W - P, iw = x1 - x0, ih = H - 2 * P, gap = 6, st = d.al === 's';
  const box = h('div.wd-w', {style:'width:' + W + 'px;height:' + H + 'px;background:' + alpha(d.bg, d.op / 100) + ';color:' + d.tx});
  const sub = alpha(d.tx, .72), nx = D.ni >= 0 ? D.six[D.ni] : null;
  const txt = (s, cy, px, f, col, opt)=>{   // one line, centred on cy, shrunk to the width
    const w = (opt && opt.w) || iw, sz = fit(s, w, px, f), x = opt && opt.x != null ? opt.x : null;
    const el = h('div.wd-t.' + f, {style:'top:' + (cy - sz * .75).toFixed(1) + 'px;height:' + (sz * 1.5).toFixed(1) + 'px;font-size:' + sz.toFixed(2) + 'px;color:' + col + ';'
      + (x != null ? 'left:' + (x - w / 2) + 'px;width:' + w + 'px;text-align:center' : st ? 'right:' + P + 'px;width:' + w + 'px;text-align:right' : 'left:' + x0 + 'px;width:' + iw + 'px;text-align:center')}, s);
    box.append(el); return el;
  };
  const para = (s, y, hb, px, f)=>{
    const el = h('div.wd-p.' + f, {style:'top:' + y + 'px;height:' + hb + 'px;left:' + x0 + 'px;width:' + iw + 'px;text-align:' + (st ? 'right' : 'center') + ';font-size:' + px + 'px;line-height:' + (f === 'q' ? 1.7 : 1.6)}, h('span', s));
    box.append(el);
    requestAnimationFrame(()=>{ const sp = el.firstChild; let k = px; while(sp.offsetHeight > hb && k > (f === 'q' ? 11 : 10)){ k *= .93; el.style.fontSize = k + 'px'; } });
  };
  if(H < 100){ strip(); return box; }
  let k = d.fs / 100;
  for(let pass = 0; pass < 8; pass++){
    let all = 0, n = 0; d.b.forEach(b=>{ const hb = b === 'bar' ? 10 : H_[b] * k; all += hb + (n ? gap : 0); n++; });
    if(all <= ih || k <= d.fs / 100 * .8) break; k = Math.max(d.fs / 100 * .8, k * .96);
  }
  const hOf = b=>b === 'bar' ? 10 : H_[b] * k;
  const bl = []; let used = 0;
  for(const b of d.b){ const add = hOf(b) + (bl.length ? gap : 0); if(used + add > ih + .5 && bl.length) break; bl.push(b); used += add; }
  const flex = bl.filter(flexB).length, extra = Math.max(0, ih - used);
  let y = P + (flex ? 0 : extra / 2);
  for(const b of bl){
    const hb = hOf(b) + (flexB(b) ? extra / flex : 0), cy = y + hb / 2;
    if(b === 'next'){
      if(!nx) txt('افتح التطبيق لتحديث الأوقات', cy, 13 * k, 'r', sub);
      else { txt('الصلاة القادمة • ' + nx[3], y + 8 * k, 12 * k, 'r', d.ac); txt(nx[1], y + 31 * k, 24 * k, 'b', d.tx); }
    } else if(b === 'count'){
      if(nx){ const el = txt(left(nx[2]), cy, 20 * k, 'b', d.tx, st ? null : {x:W / 2}); el.classList.add('wd-cd'); el.dataset.at = nx[2]; el.style.direction = 'ltr'; if(st){ el.style.textAlign = 'right'; } }
    } else if(b === 'times'){
      const f = D.six.filter(r=>r[0] !== 'sunrise'), wide = iw >= 210, n = wide ? f.length : Math.min(3, f.length);
      const i0 = wide ? 0 : Math.max(0, f.indexOf(nx)), cw = iw / Math.max(1, n), sn = 10.5 * k, stt = (wide ? 12 : 11.5) * k, c2 = wide ? cy + 2 : cy;
      for(let i = 0; i < n; i++){
        const r = f[(i0 + i) % f.length], on = r === nx, cx = x1 - (i + .5) * cw;
        if(on && wide) box.append(h('i.wd-pill', {style:'left:' + (cx - cw / 2 + 2) + 'px;width:' + (cw - 4) + 'px;top:' + (c2 - sn * 1.55) + 'px;height:' + (sn * 1.5 + stt * 1.6) + 'px;background:' + alpha(d.ac, .2)}));
        txt(r[1], wide ? c2 - sn * .65 : cy - 7 * k, sn, on ? 'b' : 'r', on ? d.tx : alpha(d.tx, .6), {x:cx, w:cw - 6});
        txt(r[3], wide ? c2 + stt * .75 : cy + 9 * k, stt, on ? 'b' : 'r', on ? d.ac : alpha(d.tx, .5), {x:cx, w:cw - 6});
      }
    } else if(b === 'bar'){
      if(nx){ const p = D.prev ? Math.max(.03, Math.min(1, (Date.now() - D.prev[2]) / (nx[2] - D.prev[2]))) : .03;
        box.append(h('i.wd-bar', {style:'left:' + x0 + 'px;width:' + iw + 'px;top:' + (cy - 2) + 'px;background:' + alpha(d.tx, .2)}, h('i', {style:'width:' + (p * 100).toFixed(1) + '%;background:' + d.ac}))); }
    } else if(b === 'hijri'){
      if(D.day) txt(D.day[2] + ' ' + D.day[3] + ' ' + D.day[4] + ' هـ', cy, 16 * k, 'b', d.tx);
    } else if(b === 'greg'){
      if(D.day) txt(D.day[1] + ' • ' + D.day[5], cy, 12.5 * k, 'r', sub);
    } else if(b === 'city'){
      if(D.city) txt(D.city, cy, 12.5 * k, 'b', d.ac);
    } else if(b === 'dhikr'){
      para(D.dhikr || 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ', y, hb, 17 * k * (hb > 120 ? 1.35 : 1), 'r');
    } else if(b === 'ayah'){
      para('﴿' + (D.ayah || 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ') + '﴾', y, hb, 20 * k * (hb > 120 ? 1.35 : 1), 'q');
    }
    y += hb + gap;
  }
  return box;
  function strip(){
    const k = d.fs / 100, cy = H / 2, pr = d.b.some(b=>b === 'next' || b === 'times' || b === 'bar' || b === 'count'), cd = d.b.includes('count');
    if(pr && nx){
      const half = iw * (W < 200 ? .62 : .55), rest = iw - half - 8;
      const t1 = txt(nx[1], cy - ih * .2, Math.min(20 * k, ih * .46), 'b', d.tx, {w:half}); t1.style.right = P + 'px'; t1.style.left = ''; t1.style.textAlign = 'right';
      const t2 = txt('الصلاة القادمة • ' + nx[3], cy + ih * .26, Math.min(11.5 * k, ih * .27), 'r', d.ac, {w:half}); t2.style.right = P + 'px'; t2.style.left = ''; t2.style.textAlign = 'right';
      if(rest > 40){
        if(cd){ const el = txt(left(nx[2]), cy, Math.min(Math.min(18 * k, ih * .42), rest / 3.6), 'b', d.tx, {x:x0 + rest / 2, w:rest}); el.classList.add('wd-cd'); el.dataset.at = nx[2]; el.style.direction = 'ltr'; }
        else if(D.day){ const el = txt(D.day[2] + ' ' + D.day[3], cy, Math.min(13 * k, ih * .3), 'b', sub, {x:x0 + rest / 2, w:rest}); el.style.textAlign = 'left'; }
      }
      return;
    }
    let s = '';
    for(const b of d.b){
      if(b === 'hijri' && D.day){ s = D.day[2] + ' ' + D.day[3] + ' ' + D.day[4] + ' هـ'; break; }
      if(b === 'greg' && D.day){ s = D.day[1] + ' • ' + D.day[5]; break; }
      if(b === 'city' && D.city){ s = D.city; break; }
      if(b === 'dhikr'){ s = D.dhikr; break; }
      if(b === 'ayah'){ s = '﴿' + D.ayah + '﴾'; break; }
    }
    if(!s) s = nx ? nx[1] + ' • ' + nx[3] : 'افتح التطبيق مرة لتحديث البيانات';
    para(s, P, ih, Math.min(16 * k, ih * .45), s.startsWith('﴿') ? 'q' : 'b');
  }
}
/* the count-downs in every preview on screen tick once a second */
setInterval(()=>{ document.querySelectorAll('.wd-cd').forEach(el=>{ el.textContent = left(+el.dataset.at); }); }, 1000);
/* a preview scaled into a frame of the given width */
function framed(d, sizeKey, maxW){
  const [, , , , W, H] = SZ[sizeKey] || SZ.m, s = Math.min(1.25, maxW / W);
  const w = render(d, sizeKey); w.style.transform = 'scale(' + s.toFixed(3) + ')';
  return h('div.wd-frame', {style:'width:' + Math.round(W * s) + 'px;height:' + Math.round(H * s) + 'px'}, w);
}
M.wDesigns.render = render; M.wDesigns.framed = framed;

/* ---- the designer page ---- */
const isAndroid = ()=>!!(window.Android && Android.pinCustom);
const isIOS = ()=>!!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.native) || (M.isIOS && !window.Android);

function pinDesign(d){
  let r = 'web';
  if(isAndroid()){ try{ r = String(Android.pinCustom(d.id)); }catch(e){ r = 'error'; } }
  M.haptic && M.haptic(10);
  if(r === 'ok') M.toast('اختر مكان الودجت من النافذة التي ظهرت', 3200);
  else if(r === 'web') M.toast(isIOS() ? 'على الآيفون: انسخ رمز التصميم وألصقه في إعدادات الودجت' : 'الإضافة إلى الشاشة الرئيسية متاحة في تطبيق الأندرويد', 3600);
  else M.toast('اضغط مطولًا على الشاشة الرئيسية ← الأدوات ← «المسلم» ← «ودجت من تصميمك»', 5200);
}
function iosSheet(d){
  const c = code(d);
  const b = h('div.wd-ios');
  b.append(h('div.wd-code', {dir:'ltr'}, c),
      h('button.btn.block', {onclick:()=>M.copy(c)}, M.ic('copy'), 'انسخ الرمز'),
      h('ol.wd-steps', h('li', 'اضغط مطولًا على الشاشة الرئيسية ثم «+» وابحث عن «المسلم».'), h('li', 'اختر «ودجت من تصميمك» بالحجم الذي تريده وأضفه.'),
        h('li', 'اضغط مطولًا على الودجت ← «تعديل الأداة».'), h('li', 'ألصق الرمز في خانة «رمز التصميم» — يظهر تصميمك فورًا.')),
      h('div.small.muted', 'الودجت على الآيفون لا يقرأ إعدادات التطبيق مباشرة، لذلك ينتقل التصميم بهذا الرمز. يمكنك اختيار المدينة من نفس الشاشة.'));
  M.sheet({title:'ضعه على الآيفون', content:b});
}

function editor(d0, onDone){
  let d = clean(d0), size = 'm';
  M.openView({id:'wd-edit', title:d0.id && list().some(x=>x.id === d0.id) ? 'تعديل التصميم' : 'تصميم جديد', build:(b, v)=>{
    const pv = h('div.wd-stage'), szs = h('div.seg.wd-szs'), body = h('div.wd-ed');
    const repaint = ()=>{ pv.replaceChildren(framed(d, size, Math.min(360, (b.clientWidth || 360) - 40))); };
    const sizeBtns = ()=>szs.replaceChildren(...SIZES.filter(s=>!(isIOS() && s[0] === 'w')).map(s=>h('button' + (s[0] === size ? '.on' : ''), {onclick:()=>{ size = s[0]; sizeBtns(); repaint(); }}, s[1], h('small', isIOS() ? '' : ' ' + s[2]))));
    const set = (k, val)=>{ d[k] = val; repaint(); draw(); };
    const swatches = (key, lbl)=>h('div.cp-line', h('div.cp-lbl', h('span', lbl), h('span.cp-hex', '​' + d[key].toUpperCase())),
      h('div.cp-row', ...PAL[key].map(c=>h('button.cp-sw' + (c.toLowerCase() === d[key].toLowerCase() ? '.on' : ''), {style:'--c:' + c, 'aria-label':lbl + ' ' + c, onclick:()=>set(key, c)})),
        h('label.cp-sw.cp-any', {'aria-label':'لون آخر'}, M.ic('plus'), h('input', {type:'color', value:d[key], onchange:e=>set(key, e.target.value)}))));
    function draw(){
      const chosen = h('div.wd-blocks');
      d.b.forEach((id, i)=>chosen.append(h('div.wd-blk', h('span.wd-bi', {html:M.icon(BN[id][2])}), h('b.grow', BN[id][1]),
        h('button.icon-btn.sm', {'aria-label':'أعلى', disabled:i === 0, onclick:()=>{ const a = d.b.slice(); [a[i - 1], a[i]] = [a[i], a[i - 1]]; set('b', a); }}, M.ic('chevUp')),
        h('button.icon-btn.sm.wd-dn', {'aria-label':'أسفل', disabled:i === d.b.length - 1, onclick:()=>{ const a = d.b.slice(); [a[i + 1], a[i]] = [a[i], a[i + 1]]; set('b', a); }}, M.ic('chevUp')),
        h('button.icon-btn.sm', {'aria-label':'إزالة', onclick:()=>set('b', d.b.filter((_, j)=>j !== i))}, M.ic('close')))));
      if(!d.b.length) chosen.append(h('div.small.muted.center', {style:'padding:10px'}, 'أضف عنصرًا واحدًا على الأقل من الأسفل'));
      const avail = h('div.wd-add', ...BLOCKS.filter(x=>!d.b.includes(x[0])).map(x=>h('button.chip', {onclick:()=>set('b', d.b.concat(x[0]))}, M.ic('plus'), x[1])));
      const pct = h('b.num', M.n(d.op) + '٪');
      body.replaceChildren(
        h('div.section-h', 'اسم التصميم'), h('input.field', {value:d.n, maxlength:30, oninput:e=>{ d.n = e.target.value; }}),
        h('div.section-h', 'المحتوى بالترتيب'), chosen, avail,
        h('div.small.muted', {style:'margin:6px 2px 0'}, 'إن لم تتسع المساحة يصغر النص قليلًا ثم تُترك العناصر الأخيرة.'),
        h('div.section-h', 'قوالب جاهزة'), h('div.wd-tpl', ...TEMPLATES.map(t=>h('button.wd-tplb', {onclick:()=>{ d = clean(Object.assign({}, t, {id:d.id, n:d.n})); repaint(); draw(); }},
          h('i', {style:'background:' + t.bg + ';border-color:' + t.ac}), t.n))),
        h('div.section-h', 'الألوان'), h('div.card.pad.cp-box', swatches('bg', 'الخلفية'), swatches('tx', 'النص'), swatches('ac', 'التمييز'),
          h('div.cp-line', h('div.cp-lbl', h('span', 'وضوح الخلفية'), pct), h('input.cp-range', {type:'range', min:20, max:100, step:5, value:d.op, oninput:e=>{ d.op = +e.target.value; pct.textContent = M.n(d.op) + '٪'; repaint(); }}))),
        h('div.section-h', 'المحاذاة'), M.seg([['c', 'في الوسط'], ['s', 'إلى اليمين']], d.al, v=>set('al', v)),
        h('div.section-h', 'حجم النص'), M.seg([[85, 'صغير'], [100, 'عادي'], [115, 'كبير'], [130, 'أكبر']], d.fs, v=>set('fs', +v)));
    }
    const save = ()=>{
      if(!d.b.length){ M.toast('أضف عنصرًا واحدًا على الأقل'); return; }
      const l = list(), i = l.findIndex(x=>x.id === d.id); d = clean(d);
      if(i >= 0) l[i] = d; else l.push(d);
      saveList(l); M.toast('حُفظ التصميم' + (isAndroid() ? ' — وتغيّر في كل ودجت يستخدمه' : '')); v.close(); onDone && onDone(d);
    };
    b.append(h('div.wd-top', pv, szs), body, h('div.wd-actions', h('button.btn.block', {onclick:save}, M.ic('check'), 'حفظ التصميم')));
    sizeBtns(); draw(); requestAnimationFrame(repaint);
  }});
}

/* the «صمّم ودجتك» pane of the widgets page */
M.wDesignPane = function(){
  const root = h('div.wd-pane');
  const draw = ()=>{
    const l = list();
    root.replaceChildren(
      h('div.wd-hero', h('div.grow', h('b', 'صمّم ودجتك'), h('div.small', 'اختر ما يظهر فيه وألوانه وحجمه' + (isIOS() ? '، ثم ضعه على الآيفون برمز قصير.' : '، ثم أضفه إلى الشاشة الرئيسية.'))),
        h('button.btn.sm', {onclick:()=>editor(Object.assign({}, TEMPLATES[0], {id:'', n:'تصميم ' + M.n(l.length + 1)}), draw)}, M.ic('plus'), 'تصميم جديد')));
    if(!l.length){
      root.append(h('div.section-h', 'ابدأ من قالب'), h('div.wd-grid', ...TEMPLATES.map(t=>h('button.wd-card.tpl', {onclick:()=>editor(Object.assign({}, t, {id:''}), draw)},
        framed(t, t.b.length > 3 ? 'm' : 's', 150), h('b', t.n)))));
      return;
    }
    root.append(h('div.section-h', 'تصاميمك', h('span.wgc-n', M.n(l.length))));
    l.forEach(d=>root.append(h('div.card.wd-item',
      h('div.wd-item-pv', framed(d, 'm', 300)),
      h('div.wd-item-b', h('b', d.n), h('div.small.muted', d.b.map(x=>BN[x][1]).join(' • ')),
        h('div.row-flex.gap-s.wd-item-act',
          isIOS() ? h('button.btn.sm', {onclick:()=>iosSheet(d)}, M.ic('copy'), 'ضعه على الآيفون') : h('button.btn.sm', {onclick:()=>pinDesign(d)}, M.ic('plus'), 'أضف إلى الشاشة'),
          h('button.btn.tonal.sm', {onclick:()=>editor(d, draw)}, M.ic('palette'), 'تعديل'),
          h('button.icon-btn.sm', {'aria-label':'نسخة', onclick:()=>{ const c = clean(Object.assign({}, d, {id:uid(), n:d.n + ' (نسخة)'})); saveList(list().concat(c)); draw(); }}, M.ic('copy')),
          h('button.icon-btn.sm', {'aria-label':'حذف', onclick:async()=>{ if(await M.confirm('حذف التصميم «' + d.n + '»؟', 'حذف')){ saveList(list().filter(x=>x.id !== d.id)); draw(); } }}, M.ic('trash')))))));
    /* Android: the custom widgets already on the home screen, and which design each one shows */
    if(isAndroid() && Android.customWidgets){
      let placed = []; try{ placed = JSON.parse(Android.customWidgets()) || []; }catch(e){}
      if(placed.length){
        root.append(h('div.section-h', 'على شاشتك الرئيسية', h('span.wgc-n', M.n(placed.length))));
        root.append(h('div.list.card', ...placed.map(([wid, did], i)=>h('div.item.static.stack', h('div.grow', h('div.t', 'ودجت ' + M.n(i + 1)), h('div.s', 'يعرض: ' + ((l.find(x=>x.id === did) || l[0] || {}).n || '—'))),
          M.seg(l.slice(0, 4).map(x=>[x.id, x.n]), did || (l[0] && l[0].id), v=>{ try{ Android.assignCustom(wid, v); }catch(e){} M.toast('تغيّر الودجت'); draw(); })))));
      }
    }
    if(isIOS()) root.append(h('div.card.pad.wd-note', h('b', 'على الآيفون'), h('div.small', 'أضف «ودجت من تصميمك» من قائمة أدوات «المسلم»، ثم اضغط عليه مطولًا ← «تعديل الأداة» وألصق رمز التصميم.')));
  };
  draw();
  return root;
};
M.wDesignEditor = editor;
})();
