/* ===== 4.9: the living sky behind the app =====
   The background follows the real day of the place: the colours of the sky change with fajr, sunrise, noon, asr, maghrib and isha;
   the sun crosses the sky from sunrise to maghrib, the moon (in its real phase) from maghrib to fajr, stars come out at night,
   and clouds drift by. It answers the hand: the layers move a little with scrolling and with the tilt of the phone (or the mouse).
   The words on top never change colour: the sky stays pale in the light theme and deep in the dark one, whatever the hour.
   It rests (no motion) with «reduce motion», with the light-effects mode, and whenever the app is hidden or a page covers it. */
(function(){
'use strict';
const M = window.M, h = M && M.h; if(!M || !h) return;

/* sky colours: [top, middle, bottom] for each moment, in a light and a dark version */
const SKY = {
  night:   {l:['#dfe3f3', '#e8e9f4', '#f1f0f4'], d:['#050a1c', '#0b1430', '#13203d']},
  dawn:    {l:['#dfe2f2', '#efe3ea', '#f8e9df'], d:['#0d1433', '#2a2a52', '#4a3550']},
  sunrise: {l:['#dbeaf6', '#f4e6dc', '#fbe7d0'], d:['#1b2b52', '#4a3d5c', '#7a4c44']},
  day:     {l:['#d6ecfa', '#e6f3fb', '#f3f8fb'], d:['#0b2740', '#0f3150', '#163b58']},
  asr:     {l:['#dbeaf5', '#ecf1f2', '#f7f1e6'], d:['#0f2a44', '#1a3550', '#2d3a4c']},
  sunset:  {l:['#e3ddf0', '#f5e1dc', '#fbe3cd'], d:['#1d1d45', '#4b2a4e', '#7a3a3a']},
  dusk:    {l:['#dcdcf0', '#e6e2f0', '#efe9f1'], d:['#0b1030', '#1b1b45', '#2b2450']}
};
const PHASE_AR = {night:'ليل', dawn:'فجر', sunrise:'شروق', day:'نهار', asr:'عصر', sunset:'غروب', dusk:'عشاء'};
const H = 3600000;

const on = ()=>(M.cfg.bg || 'aurora') === 'sky';
let root = null, sun, moon, stars, clouds, tilt = {x:0, y:0}, scrollY = 0, raf = 0, timer = 0;

function phaseOf(now){
  let t; try{ t = M.prayerTimes(now); }catch(e){ t = null; }
  const d = new Date(now), at = (hh, mm)=>{ const x = new Date(d); x.setHours(hh, mm, 0, 0); return +x; };
  const T = t ? {fajr:+t.fajr, sunrise:+t.sunrise, dhuhr:+t.dhuhr, asr:+t.asr, maghrib:+t.maghrib, isha:+t.isha}
    : {fajr:at(4, 45), sunrise:at(6, 10), dhuhr:at(12, 0), asr:at(15, 20), maghrib:at(17, 50), isha:at(19, 15)};
  const x = +now; let ph;
  if(x < T.fajr || x >= T.isha) ph = 'night';
  else if(x < T.sunrise) ph = 'dawn';
  else if(x < T.sunrise + 1.2 * H) ph = 'sunrise';
  else if(x < T.asr) ph = 'day';
  else if(x < T.maghrib - .6 * H) ph = 'asr';
  else if(x < T.maghrib + .4 * H) ph = 'sunset';
  else ph = 'dusk';
  return {ph, T, x};
}

/* where on the arc: 0 at the rising edge, 1 at the setting edge */
/* the arc runs through the band above the first card (most of the screen below is covered by cards): low at the edges, high at noon */
function arc(p){ const k = Math.max(0, Math.min(1, p)); return {x:88 - 76 * k, y:30 - 22 * Math.sin(Math.PI * k)}; }

function cloud(depth, i){
  // a soft cumulus made of a few circles: no pictures, so it costs nothing to load
  const w = 150 + depth * 70, blobs = [[.22, .62, .2], [.42, .45, .28], [.64, .52, .23], [.82, .66, .16], [.5, .7, .3]];
  const svg = '<svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">' + blobs.map(([cx, cy, r])=>'<circle cx="' + cx * 100 + '" cy="' + cy * 50 + '" r="' + r * 50 + '"/>').join('') + '<rect x="18" y="33" width="66" height="17" rx="8"/></svg>';
  const el = h('i.sky-cloud.d' + depth, {html:svg});
  el.style.width = w + 'px'; el.style.top = (8 + (i * 17 + depth * 9) % 46) + '%';
  el.style.animationDuration = (150 - depth * 35 + i * 13) + 's'; el.style.animationDelay = (-i * 37 - depth * 11) + 's';
  return el;
}

function build(){
  root = h('div#sky', {'aria-hidden':'true'});
  stars = h('div.sky-stars');
  for(let i = 0; i < 46; i++){ const s = h('i'); s.style.left = ((i * 53.7) % 100) + '%'; s.style.top = ((i * 29.3) % 58) + '%'; s.style.animationDelay = (-(i % 7) * .9) + 's'; if(i % 5 === 0) s.className = 'big'; stars.append(s); }
  sun = h('div.sky-sun', h('i.sky-sun-core'));
  moon = h('div.sky-moon');
  clouds = h('div.sky-clouds');
  for(let d = 0; d < 3; d++) for(let i = 0; i < 2 + (d === 2 ? 0 : 1); i++) clouds.append(cloud(d, i + d * 2));
  root.append(stars, sun, moon, clouds);
  const bg = document.getElementById('bg'); if(bg) bg.insertBefore(root, bg.firstChild);
}

function paint(at){
  if(!root) return;
  const dark = M.resolveTheme && M.resolveTheme() !== 'light';
  const now = at instanceof Date ? at : new Date(), {ph, T, x} = phaseOf(now), c = SKY[ph][dark ? 'd' : 'l'];
  const de = document.documentElement.style; de.setProperty('--sky1', c[0]); de.setProperty('--sky2', c[1]); de.setProperty('--sky3', c[2]);   // on the page: the header halo uses them too
  root.dataset.ph = ph; root.dataset.dark = dark ? '1' : '';
  // the sun: from sunrise to maghrib
  const sp = (x - T.sunrise) / (T.maghrib - T.sunrise), sunUp = sp > -.04 && sp < 1.04;
  const a = arc(sp); sun.style.left = a.x + '%'; sun.style.top = a.y + '%'; sun.style.opacity = sunUp ? '1' : '0';
  sun.classList.toggle('low', sp < .14 || sp > .86);
  // the moon: from maghrib to the next fajr, drawn in tonight's phase
  let mp; const day = 24 * H;
  if(x >= T.maghrib) mp = (x - T.maghrib) / (T.fajr + day - T.maghrib); else if(x < T.fajr) mp = (x - (T.maghrib - day)) / (T.fajr - (T.maghrib - day)); else mp = -1;
  const moonUp = mp >= 0 && mp <= 1;
  if(moonUp){ const m = arc(mp); moon.style.left = m.x + '%'; moon.style.top = m.y + '%';
    const age = M.moonAge ? M.moonAge(now) : 14, key = Math.round(age * 2) + (dark ? 'd' : 'l');
    if(moon.dataset.k !== key && M.moonSVG){ moon.innerHTML = M.moonSVG(age, 46); moon.dataset.k = key; } }
  moon.style.opacity = moonUp ? '1' : '0';
  stars.style.opacity = ph === 'night' ? '1' : ph === 'dusk' || ph === 'dawn' ? '.45' : '0';
  root.title = PHASE_AR[ph];
}

/* the hand: scrolling and tilting move the layers by a few pixels (deeper layers less) */
function move(){
  raf = 0; if(!root) return;
  const sy = Math.min(220, scrollY);
  root.style.setProperty('--px', (tilt.x * 14).toFixed(1) + 'px'); root.style.setProperty('--py', (tilt.y * 10 - sy * .12).toFixed(1) + 'px');
}
const ask = ()=>{ if(!raf) raf = requestAnimationFrame(move); };
function listen(){
  document.addEventListener('scroll', e=>{ const t = e.target; if(t && t.classList && t.classList.contains('screen') && t.classList.contains('active')){ scrollY = t.scrollTop; ask(); } }, {capture:true, passive:true});
  window.addEventListener('pointermove', e=>{ if(e.pointerType !== 'mouse') return; tilt.x = (e.clientX / innerWidth - .5) * 2; tilt.y = (e.clientY / innerHeight - .5) * 2; ask(); }, {passive:true});
  window.addEventListener('deviceorientation', e=>{ if(e.gamma == null) return; tilt.x = Math.max(-1, Math.min(1, e.gamma / 30)); tilt.y = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30)); ask(); }, {passive:true});
  M.on && M.on('tab', ()=>{ scrollY = 0; ask(); rest(); });
  M.on && M.on('viewclose', ()=>setTimeout(rest, 60));
  M.on && M.on('settings', k=>{ if(k === 'theme' || k === 'loc' || k === 'method' || k === 'bg') setTimeout(()=>{ apply(); }, 30); });
  document.addEventListener('visibilitychange', rest);
  new MutationObserver(rest).observe(document.getElementById('views') || document.body, {childList:true});
}
/* motion only while someone can see it */
function rest(){ if(!root) return; const hidden = document.hidden || (M.views && M.views.length > 0); root.classList.toggle('still', !!hidden); if(!hidden) paint(); }

function apply(){
  const want = on();
  document.documentElement.toggleAttribute('data-sky', want);
  if(!want){ if(root) root.style.display = 'none'; clearInterval(timer); timer = 0; return; }
  if(!root){ build(); listen(); }
  root.style.display = ''; paint(); rest();
  if(!timer) timer = setInterval(paint, 60000);
}
M.skyApply = apply;
M.skyPhase = ()=>phaseOf(new Date()).ph;
M.skyAt = d=>paint(d);   // shows the sky of another hour (for the preview and for tests)

/* the background picker knows the sky; the background code leaves the picture layer empty for it */
const at = M.applyTheme; if(at) M.applyTheme = function(){ const r = at.apply(this, arguments); try{ if(root && on()) paint(); }catch(e){} return r; };   // light ↔ dark (also «auto» at the system's switch) repaints the sky at once
const ab = M.applyBg; if(ab) M.applyBg = function(){ const r = ab.apply(this, arguments); try{ apply(); }catch(e){} return r; };
/* 4.9 the new default: who never picked a background (still the old «aurora» default) gets the sky once */
try{ if(!M.store.get('skyDefault', 0)){ M.store.set('skyDefault', 1); if((M.cfg.bg || 'aurora') === 'aurora') M.save('bg', 'sky'); } }catch(e){}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(apply, 0)); else setTimeout(apply, 0);
})();
