/* ===== theme: skins, dark modes, accent palette, backgrounds ===== */
(function(){
'use strict';
const M = window.M, root = document.documentElement;

function hexToHsl(hex){
  hex = (hex || '#0f8a6d').replace('#','');
  if(hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
  const r = parseInt(hex.slice(0,2),16)/255, g = parseInt(hex.slice(2,4),16)/255, b = parseInt(hex.slice(4,6),16)/255;
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx - mn; let hh = 0, s = 0; const l = (mx + mn)/2;
  if(d){ s = d / (1 - Math.abs(2*l - 1));
    if(mx === r) hh = ((g - b)/d) % 6; else if(mx === g) hh = (b - r)/d + 2; else hh = (r - g)/d + 4;
    hh = Math.round(hh * 60); if(hh < 0) hh += 360; }
  return [hh, Math.round(s*100), Math.round(l*100)];
}
const C = (h,s,l)=>`hsl(${h} ${Math.max(0,Math.min(100,s))}% ${l}%)`;

M.ACCENTS = [['#0f8a6d','زمردي'],['#1f6feb','أزرق'],['#7c4dff','بنفسجي'],['#c2185b','وردي'],['#e65100','برتقالي'],['#b8860b','ذهبي'],['#00838f','فيروزي'],['#5d4037','بني'],['#455a64','رمادي']];

M.resolveSkin = ()=>M.cfg.skin === 'auto' ? (M.isIOS ? 'glass' : 'material') : M.cfg.skin;
M.resolveTheme = ()=>M.cfg.theme === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : M.cfg.theme;
M.skinName = s=>s === 'glass' ? 'Liquid Glass' : 'Material You';

/* the app colour follows the chosen launcher icon unless the user picked a colour by hand */
M.ICON_ACCENT = {1:'#3f918b', 2:'#3f918b', 3:'#3f918b', 4:'#3f918b', 5:'#3f918b', 6:'#3f918b', 7:'#3f918b', 8:'#3f918b', 9:'#1b3f8a', 10:'#1c6679'};
M.iconAccent = function(i){ return M.ICON_ACCENT[i] || M.ICON_ACCENT[10]; };
M.setIconAccent = function(i){ M.save('appIcon', i); M.save('accentSrc', 'icon'); M.save('accent', M.iconAccent(i)); };
(function(){
  try{
    if(M.cfg.accentSrc === 'user') return;
    // an accent chosen before this feature existed counts as the user's own choice
    if(M.cfg.accentSrc == null && M.cfg.accent && M.cfg.accent.toLowerCase() !== '#0f8a6d'){ M.cfg.accentSrc = 'user'; M.store.set('settings', M.cfg); return; }
    let i = M.cfg.appIcon || 10; try{ if(window.Android && Android.getAppIcon) i = Android.getAppIcon() || i; }catch(e){}
    M.cfg.accent = M.iconAccent(i); M.cfg.appIcon = i; M.cfg.accentSrc = 'icon'; M.store.set('settings', M.cfg);
  }catch(e){}
})();
/* the text scale: the user's own choice, else the phone's text size (window.__sys from the iPhone app) */
M.baseFontScale = function(){
  const own = +M.cfg.fontScale || 1, sys = +(window.__sys || {}).fontScale || 0;
  return own === 1 && sys ? sys : own;
};
M.applyTheme = function(){
  const skin = M.resolveSkin(), theme = M.resolveTheme(), dark = theme !== 'light';
  root.dataset.skin = skin; root.dataset.theme = theme; root.dataset.anim = M.cfg.anim ? 'on' : 'off'; root.dataset.astyle = M.cfg.animStyle || 'default';
  M.applyEdge && M.applyEdge();
  /* the phone's own text size, Reduce Transparency and Increase Contrast (window.__sys from the iPhone app, or the browser's media queries)
     apply while the user has not set these in the app */
  const sys = window.__sys || {};
  const fs = M.baseFontScale();
  root.style.setProperty('--fs', fs);
  if(fs >= 1.25) root.setAttribute('data-fsbig', ''); else root.removeAttribute('data-fsbig');
  let [h, s] = hexToHsl(M.cfg.accent); s = Math.max(28, Math.min(80, s));
  const v = {};
  if(!dark){
    Object.assign(v, {
      '--p':C(h,s,34), '--on-p':'#ffffff', '--pc':C(h,Math.min(s,70),89), '--on-pc':C(h,s+10,13),
      '--sc':C(h,26,86), '--on-sc':C(h,40,14),
      '--s0':C(h,24,97), '--s1':C(h,22,94.5), '--s2':C(h,20,92), '--s3':C(h,18,89),
      '--on-s':C(h,24,9), '--on-sv':C(h,10,34), '--outline':C(h,8,46), '--outline-v':C(h,14,80)
    });
  } else {
    const amoled = theme === 'amoled';
    Object.assign(v, {
      '--p':C(h,Math.min(s+5,75),70), '--on-p':C(h,60,12), '--pc':C(h,Math.min(s,50),25), '--on-pc':C(h,60,90),
      '--sc':C(h,20,27), '--on-sc':C(h,30,90),
      '--s0':amoled ? '#000' : C(h,16,7), '--s1':amoled ? C(h,10,4.5) : C(h,13,10), '--s2':amoled ? C(h,10,8) : C(h,12,13), '--s3':amoled ? C(h,9,12) : C(h,11,17),
      '--on-s':C(h,12,92), '--on-sv':C(h,8,72), '--outline':C(h,6,56), '--outline-v':amoled ? C(h,8,22) : C(h,10,27)
    });
  }
  /* accessibility: «تباين عالٍ» darkens/lightens text, borders and accent tokens; «إلغاء الشفافية» is pure CSS (css/v2-a11y.css) */
  const mq = q=>{ try{ return matchMedia(q).matches; }catch(e){ return false; } };
  const hc = !!M.cfg.contrast || !!sys.contrast || mq('(prefers-contrast: more)');
  const solid = !!M.cfg.solid || !!sys.solid || mq('(prefers-reduced-transparency: reduce)');
  root.toggleAttribute('data-contrast', hc); root.toggleAttribute('data-solid', solid);
  if(hc){
    if(!dark) Object.assign(v, {'--p':C(h,s,25), '--pc':C(h,Math.min(s,70),84), '--on-pc':C(h,s+10,8), '--sc':C(h,26,81), '--on-sc':C(h,40,8), '--on-s':C(h,24,3), '--on-sv':C(h,10,19), '--outline':C(h,8,30), '--outline-v':C(h,10,48)});
    else Object.assign(v, {'--p':C(h,Math.min(s+5,75),78), '--on-p':C(h,60,8), '--pc':C(h,Math.min(s,50),19), '--on-pc':C(h,60,95), '--sc':C(h,20,22), '--on-sc':C(h,30,95), '--on-s':'#ffffff', '--on-sv':C(h,8,88), '--outline':C(h,6,74), '--outline-v':C(h,8,52)});
  }
  for(const k in v) root.style.setProperty(k, v[k]);
  const tc = document.querySelector('meta[name=theme-color]'); if(tc) tc.content = v['--s0'];
  M.applyBg();
  if(window.Android && window.Android.setBars){ try{ window.Android.setBars(dark ? 1 : 0, getComputedStyle(document.body).backgroundColor); }catch(e){} }
  M.emit('theme');
};
matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{ if(M.cfg.theme === 'auto') M.applyTheme(); });
['(prefers-contrast: more)', '(prefers-reduced-transparency: reduce)'].forEach(q=>{ try{ matchMedia(q).addEventListener('change', ()=>M.applyTheme()); }catch(e){} });
/* the iPhone app calls this when the system text size or an accessibility setting changes */
window.__sysChanged = function(s){ window.__sys = s || {}; M.applyTheme(); };

/* ---------- backgrounds ---------- */
const svgURI = s=>"url(\"data:image/svg+xml;utf8,"+encodeURIComponent(s)+"\")";
M.GRADIENTS = {
  emerald:['زمردي','linear-gradient(160deg,#07352c,#0f7a5f 58%,#c9a24b 150%)'],
  night:['ليل','linear-gradient(180deg,#07122b,#14275a 55%,#3a3472)'],
  dawn:['فجر','linear-gradient(180deg,#2b3a67,#8a5a82 55%,#f4a261)'],
  sand:['رمال','linear-gradient(160deg,#f7ead0,#e4bb7e 60%,#b9803b)'],
  ocean:['محيط','linear-gradient(170deg,#06304d,#0a6a8a 60%,#25b5a9)'],
  rose:['ورد','linear-gradient(160deg,#4a1d3a,#9b3f6a 60%,#e8a1a1)']
};
function starTile(c){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84"><g fill="none" stroke="${c}" stroke-opacity=".42" stroke-width="1.2"><rect x="19" y="19" width="46" height="46"/><rect x="19" y="19" width="46" height="46" transform="rotate(45 42 42)"/><circle cx="42" cy="42" r="11"/><path d="M0 0l19 19M84 0 65 19M0 84l19-19M84 84 65 65"/></g></svg>`;
}
function hexTile(c){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="97"><g fill="none" stroke="${c}" stroke-opacity=".4" stroke-width="1.2"><path d="M28 2 54 17v30L28 62 2 47V17z"/><path d="M28 62v35M54 47l-26 15M2 47l26 15" opacity=".6"/><path d="M0 79.5 28 95l28-15.500" opacity=".5"/></g></svg>`;
}
function arabTile(c){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><g fill="none" stroke="${c}" stroke-opacity=".4" stroke-width="1.2"><circle cx="0" cy="0" r="36"/><circle cx="72" cy="0" r="36"/><circle cx="0" cy="72" r="36"/><circle cx="72" cy="72" r="36"/><circle cx="36" cy="36" r="36"/></g></svg>`;
}
M.PATTERNS = {star:['نجمة ثمانية',starTile,84], hex:['خلية',hexTile,56], arab:['أرابيسك',arabTile,72]};
const stars = [[40,60],[90,130],[150,40],[210,100],[260,50],[340,90],[370,190],[60,220],[130,300],[300,260],[220,330],[20,380],[350,400],[170,180],[110,450],[280,430]];
M.SCENES = {
  night:['ليلة هلال', ()=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040a1c"/><stop offset=".55" stop-color="#0e2354"/><stop offset="1" stop-color="#27407f"/></linearGradient><mask id="m"><rect width="400" height="800" fill="#fff"/><circle cx="316" cy="132" r="30" fill="#000"/></mask></defs><rect width="400" height="800" fill="url(#g)"/>${stars.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3?1.1:1.8}" fill="#fff" opacity="${.45+(i%4)*.14}"/>`).join('')}<circle cx="300" cy="140" r="34" fill="#f6e7b4" mask="url(#m)"/><path fill="#030b16" d="M0 800V700h36V650c0-14 7-22 7-22s7 8 7 22v50h28V622c0-18 12-30 12-30s12 12 12 30v78h24c0-44 20-76 62-76s62 32 62 76h24V622c0-18 12-30 12-30s12 12 12 30v78h28V650c0-14 7-22 7-22s7 8 7 22v50h36V800z"/><path stroke="#030b16" stroke-width="3" d="M43 628v-26M200 624v-30M357 628v-26"/></svg>`],
  dunes:['كثبان الغروب', ()=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2c66"/><stop offset=".45" stop-color="#c2576a"/><stop offset=".75" stop-color="#f4a261"/><stop offset="1" stop-color="#f6c97d"/></linearGradient></defs><rect width="400" height="800" fill="url(#g)"/><circle cx="200" cy="470" r="62" fill="#ffe3a3" opacity=".9"/><path fill="#a8553d" d="M0 560C80 520 140 540 220 565S340 560 400 540V800H0z"/><path fill="#8a4330" d="M0 640C90 600 170 640 250 660S350 640 400 625V800H0z"/><path fill="#5d2c24" d="M0 720C110 690 200 730 290 735S370 720 400 712V800H0z"/></svg>`],
  dome:['قبة الفجر', ()=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a4e"/><stop offset=".5" stop-color="#6c5b8c"/><stop offset=".8" stop-color="#f0a690"/><stop offset="1" stop-color="#ffd9a0"/></linearGradient></defs><rect width="400" height="800" fill="url(#g)"/><path fill="#1c1630" d="M0 800V660h60v-40c0-10 8-16 8-16s8 6 8 16v40h30c0-50 30-90 94-90s94 40 94 90h30v-40c0-10 8-16 8-16s8 6 8 16v40h60v140z"/><path fill="#1c1630" d="M196 560c0-14 4-22 4-22s4 8 4 22z"/><circle cx="200" cy="528" r="5" fill="#1c1630"/></svg>`]
};

M.PHOTOS = [[1,'المدينة المنورة'],[2,'غروب المسجد'],[3,'برج الساعة'],[4,'مكة ليلًا'],[5,'الساعة الذهبية'],[6,'القبة الذهبية'],[7,'مسجد الغروب'],[8,'غيوم بيضاء'],[10,'مصلى أزرق'],[11,'المسجد الأبيض'],[12,'الروضة والزهور'],[13,'الروضة ورق']];
M.applyBg = function(){
  if(String(M.cfg.bg || '').startsWith('pattern:')) M.cfg.bg = 'aurora'; // the pattern wallpapers were removed
  const bg = M.$('#bg'); if(!bg) return;
  const img = M.$('#bg-img'), dim = M.$('#bg-dim');
  const type = M.cfg.bg || 'aurora';
  const acc = M.cfg.accent || '#0f8a6d';
  let css = '', size = 'cover', repeat = 'no-repeat';
  if(type === 'image' && M.cfg.bgImage){ css = `url(${M.cfg.bgImage})`; }
  else if(type.startsWith('gradient:')){ const g = M.GRADIENTS[type.slice(9)]; css = g ? g[1] : ''; }
  else if(type.startsWith('pattern:')){
    const p = M.PATTERNS[type.slice(8)];
    if(p){ const c = M.resolveTheme() === 'light' ? acc : '#ffffff'; css = svgURI(p[1](c)) + ',' + 'linear-gradient(160deg,var(--s1),var(--s0))'; size = p[2]+'px, cover'; repeat = 'repeat, no-repeat'; }
  }
  else if(type.startsWith('photo:')){ css = `url(img/bg/bg${type.slice(6)}.jpg)`; }
  else if(type.startsWith('scene:')){ const s = M.SCENES[type.slice(6)]; css = s ? svgURI(s[1]()) : ''; }
  // live video background
  let vid = M.$('#bg-vid');
  if(type === 'video'){
    if(!vid){ vid = M.h('video#bg-vid', {muted:true, loop:true, autoplay:true, playsinline:true, preload:'auto', poster:'img/bg/bg9.jpg', src:'img/bg/bg9.mp4'}); vid.muted = true; bg.insertBefore(vid, img); }
    vid.style.display = ''; vid.play && vid.play().catch(()=>{}); css = 'x';
  } else if(vid){ vid.pause(); vid.style.display = 'none'; }
  img.style.backgroundImage = css && css !== 'x' ? css : 'none';
  img.style.backgroundSize = size; img.style.backgroundRepeat = repeat;
  bg.classList.toggle('has-img', !!css);
  bg.dataset.kind = type.split(':')[0];
  const blur = M.cfg.bgBlur || 0;
  img.style.filter = blur ? `blur(${blur}px)` : ''; if(vid) vid.style.filter = img.style.filter;
  // dim: for light theme dim toward light; dark -> dark
  dim.style.opacity = css ? String(M.cfg.bgDim) : '0';
  M.bgScopeApply();
};
M.bgScopeApply = function(){
  const bg = M.$('#bg'); if(!bg) return;
  const onHome = M.curTab === 'home' && !(M.views && M.views.length);
  const show = M.cfg.bgScope === 'all' || onHome;
  bg.classList.toggle('scoped-off', !show);
  const img = M.$('#bg-img'), dim = M.$('#bg-dim');
  img.style.opacity = show && bg.classList.contains('has-img') ? '1' : '0';
  const vv = M.$('#bg-vid'); if(vv) vv.style.opacity = img.style.opacity;
  if(!show){ dim.style.opacity = '0'; } else { dim.style.opacity = bg.classList.contains('has-img') ? String(M.cfg.bgDim) : '0'; }
};
// material skin: subtle tonal gradient behind aurora
M.on('settings', k=>{ if(['skin','theme','accent','bg','bgImage','bgDim','bgBlur','bgScope','anim','fontScale','solid','contrast'].includes(k) || typeof k === 'object') M.applyTheme(); });

// downscale an image file to a data URL
M.imageToDataURL = function(file, maxSide, q){
  return new Promise((res, rej)=>{
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = ()=>{
      const im = new Image();
      im.onerror = rej;
      im.onload = ()=>{
        const k = Math.min(1, (maxSide || 1400) / Math.max(im.width, im.height));
        const c = document.createElement('canvas'); c.width = Math.round(im.width*k); c.height = Math.round(im.height*k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', q || 0.82));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
};
/* curved-edge screens: keep content away from the bent sides. auto = what the phone reports (waterfall / cutout insets), or a manual width */
M.applyEdge = function(){
  const v = M.cfg.edge, auto = v == null || v === 'auto';
  const l = auto ? (window.__edgeL || 0) : +v || 0, r = auto ? (window.__edgeR || 0) : +v || 0;
  const st = document.documentElement.style; st.setProperty('--edge-l', l+'px'); st.setProperty('--edge-r', r+'px');
};
window.__setEdge = function(l, r){ window.__edgeL = l; window.__edgeR = r; M.applyEdge(); };
M.on && M.on('settings', k=>{ if(k === 'edge' || typeof k === 'object') M.applyEdge(); });
M.applyEdge();
})();