/* Sharing: every text shared from the app goes out as a picture card on one of the bundled backgrounds (or as plain text, if preferred). */
(function(){
const M = window.M, h = M.h;
const BGS = []; for(let i = 1; i <= 13; i++) BGS.push('img/hero/'+i+'.webp'); for(let i = 1; i <= 13; i++) BGS.push('img/bg/bg'+i+'.jpg');
M.BG_LIST = BGS;
M.bgThumb = s=>s.replace(/hero\/(\d+)\.webp/, 'hero/t$1.webp').replace(/bg\/bg(\d+)\.jpg/, 'bg/t$1.jpg');
const shareText = M.share; M.shareText = shareText;
const loadImg = src=>new Promise((res, rej)=>{ const im = new Image(); im.onload = ()=>res(im); im.onerror = rej; im.src = src; });
function wrap(x, text, maxW){
  const out = [];
  String(text).split(/\n+/).forEach(par=>{ let cur = '';
    par.trim().split(/\s+/).forEach(wd=>{ const t = cur ? cur+' '+wd : wd; if(cur && x.measureText(t).width > maxW){ out.push(cur); cur = wd; } else cur = t; });
    if(cur) out.push(cur); });
  return out;
}
/* draws the card; returns the canvas. src = one of BG_LIST, a data URL, or '' for a plain colour */
M.shareCard = async function(text, src){
  const W = 1080, PAD = 96, quran = /^[«"]?﴿/.test(text.trim());
  const fam = quran ? '"Amiri Quran","Readex Pro",serif' : '"ArDigits","Readex Pro","Noto Sans Arabic",sans-serif', wt = quran ? '400' : '500';
  try{ await Promise.all([document.fonts.load(wt+' 48px '+(quran ? '"Amiri Quran"' : '"Readex Pro"'), text), document.fonts.load('500 48px "ArDigits"', '٠١٢٣'), document.fonts.load('600 32px "Readex Pro"', 'المسلم')]); }catch(e){}
  const c = document.createElement('canvas'), x = c.getContext('2d'); c.width = W; c.height = 1080;
  x.direction = 'rtl';
  let size = 0, lines = [], lh = 0; const MAXH = 1920, CH = 330;
  for(const s of [60, 54, 48, 42, 37, 33, 29, 26]){ size = s; x.font = wt+' '+s+'px '+fam; lh = s * (quran ? 2 : 1.75); lines = wrap(x, text, W - 2 * PAD); if(lines.length * lh + CH <= MAXH) break; }
  const fit = Math.floor((MAXH - CH) / lh); if(lines.length > fit){ lines = lines.slice(0, fit); lines[fit - 1] = lines[fit - 1].replace(/\s*\S*$/, '')+' …'; }
  const H = Math.max(1080, Math.min(MAXH, Math.round(lines.length * lh + CH))); c.height = H; x.direction = 'rtl';
  // background
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0d3b46'); g.addColorStop(1, '#14566b'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  if(src){ try{ const im = await loadImg(src); const sc = Math.max(W / im.naturalWidth, H / im.naturalHeight), dw = im.naturalWidth * sc, dh = im.naturalHeight * sc; x.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    x.fillStyle = 'rgba(6,18,22,.5)'; x.fillRect(0, 0, W, H);
    const v = x.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, H * .75); v.addColorStop(0, 'rgba(0,0,0,.12)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = v; x.fillRect(0, 0, W, H); }catch(e){} }
  // text
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.font = wt+' '+size+'px '+fam;
  x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 18; x.shadowOffsetY = 2;
  const top = (H - 110 - lines.length * lh) / 2 + 10;
  lines.forEach((l, i)=>x.fillText(l, W / 2, top + i * lh + lh / 2));
  // footer
  // footer: the app's logo and name
  x.shadowBlur = 8; x.font = '600 32px "Readex Pro",sans-serif'; x.fillStyle = 'rgba(255,255,255,.95)';
  const label = 'تطبيق المسلم', lw = x.measureText(label).width, L = 64, gap = 18, tot = L + gap + lw, lx = W / 2 + tot / 2 - L, ly = H - 82 - L / 2;
  let logo = null; try{ logo = await loadImg('img/icons/'+(M.cfg.appIcon || 10)+'.jpg'); }catch(e){}
  if(logo){ x.save(); x.shadowBlur = 14; x.beginPath(); const r = 16; x.moveTo(lx + r, ly); x.arcTo(lx + L, ly, lx + L, ly + L, r); x.arcTo(lx + L, ly + L, lx, ly + L, r); x.arcTo(lx, ly + L, lx, ly, r); x.arcTo(lx, ly, lx + L, ly, r); x.closePath(); x.fillStyle = '#fff'; x.fill(); x.shadowColor = 'transparent'; x.clip(); x.drawImage(logo, lx, ly, L, L); x.restore(); }
  x.textAlign = 'right'; x.fillText(label, logo ? lx - gap : W / 2 + lw / 2, H - 80); x.textAlign = 'center';
  return c;
};
async function sendCanvas(c, text){
  const url = c.toDataURL('image/jpeg', .9);
  try{ if(window.Android && window.Android.shareImage){ window.Android.shareImage(url.split(',')[1], text); return; } }catch(e){}
  const bl = await new Promise(r=>c.toBlob(r, 'image/jpeg', .9));
  try{ const f = new File([bl], 'muslim.jpg', {type:'image/jpeg'}); if(navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f], text}); return; } }catch(e){ if(e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'muslim.jpg'; a.click(); M.toast('تم حفظ الصورة');
}
M.share = function(text){
  text = String(text || '').trim(); if(!text) return;
  if(/https?:\/\//.test(text) || text.length > 1400) return shareText(text);   // links stay tappable; very long texts stay text
  const dayPick = BGS[Math.floor(Date.now() / 864e5) % BGS.length];
  let src = M.cfg.shareBg == null ? dayPick : M.cfg.shareBg, canvas = null, token = 0;
  const box = h('div.shr-prev'), strip = h('div.shr-strip');
  const paint = async ()=>{ const my = ++token; box.classList.add('busy'); const c = await M.shareCard(text, src); if(my !== token) return; canvas = c; c.className = 'shr-canvas'; box.replaceChildren(c); box.classList.remove('busy'); };
  const pick = s=>{ src = s; M.save('shareBg', s); mark(); paint(); };
  const mark = ()=>M.$$('.shr-th', strip).forEach(b=>b.classList.toggle('on', b.dataset.src === src));
  strip.append(h('button.shr-th.none', {dataset:{src:''}, 'aria-label':'بدون صورة', onclick:()=>pick('')}, 'لون'),
    ...BGS.map((s, i)=>h('button.shr-th', {dataset:{src:s}, 'aria-label':'خلفية '+(i + 1), style:'background-image:url("'+M.bgThumb(s)+'")', onclick:()=>pick(s)})));
  const body = h('div.col-flex.shr', box, h('div.small.muted', 'اختر الخلفية'), strip,
    h('div.row-flex.gap-s.shr-acts', h('button.btn.grow', {onclick:async ()=>{ if(!canvas) return; await sendCanvas(canvas, text); }}, M.ic('share'), 'مشاركة الصورة'),
      h('button.btn.tonal', {onclick:()=>{ sh.close(); shareText(text); }}, 'نص فقط'), h('button.icon-btn.tonal', {'aria-label':'نسخ النص', onclick:()=>M.copy(text)}, M.ic('copy'))));
  const sh = M.sheet({title:'مشاركة', content:body}); if(sh && sh.el) sh.el.style.maxHeight = '94%';
  mark(); paint();
  setTimeout(()=>{ const on = strip.querySelector('.on'); if(on) try{ on.scrollIntoView({inline:'center', block:'nearest'}); }catch(e){} }, 60);
};

/* ---- a picture behind a card or a page: one stored choice {src, blur, dim} per place, one picker for all of them ---- */
M.bgGet = key=>Object.assign({src:'', blur:0, dim:45}, M.cfg[key] || {});
/* paints the choice into `host` (adds a layer as its first child); returns a promise of whether a picture is shown */
M.bgPaint = async function(host, key){
  const o = M.bgGet(key); let url = o.src;
  if(url === 'custom'){ try{ url = await M.kv.get(key+'Img'); }catch(e){ url = ''; } }
  let layer = host.querySelector(':scope > .bgl');
  if(!layer){ layer = h('span.bgl', h('i')); host.prepend(layer); }
  host.classList.toggle('has-bg', !!url);
  const pic = layer.firstChild; pic.style.backgroundImage = url ? 'url("'+url+'")' : ''; pic.style.filter = url && o.blur ? 'blur('+o.blur+'px)' : ''; pic.style.inset = url && o.blur ? (-o.blur * 2)+'px' : '0';
  layer.style.setProperty('--bgl-dim', (o.dim / 100).toFixed(2)); layer.style.display = url ? '' : 'none';
  return !!url;
};
M.bgSheet = function(key, title, onChange){
  const set = p=>{ M.save(key, Object.assign(M.bgGet(key), p)); mark(); onChange && onChange(); };
  const gal = h('div.hero-gal'), mark = ()=>M.$$('.hero-th', gal).forEach(x=>x.classList.toggle('on', M.bgGet(key).src === x.dataset.src));
  gal.append(h('button.hero-th.none', {dataset:{src:''}, onclick:()=>set({src:''})}, 'بدون صورة'));
  BGS.forEach((src, i)=>gal.append(h('button.hero-th', {dataset:{src}, 'aria-label':'خلفية '+(i + 1), style:'background-image:url("'+M.bgThumb(src)+'")', onclick:()=>set({src})})));
  const custom = async data=>{ try{ await M.kv.set(key+'Img', data); set({src:'custom'}); M.toast('تم تعيين الخلفية'); }catch(e){ M.toast('تعذّر حفظ الصورة'); } };
  const file = h('input', {type:'file', accept:'image/*', class:'hide', onchange:async e=>{ const f = e.target.files[0]; if(!f) return; try{ custom(await M.imageToDataURL(f, 1200, .85)); }catch(err){ M.toast('تعذّر قراءة الصورة'); } }});
  const o = M.bgGet(key), bl = h('b.num', M.n(o.blur)), dm = h('b.num', M.n(o.dim)+'٪');
  const sh = M.sheet({title:title || 'الخلفية', content:h('div.col-flex', {style:'gap:12px'}, gal, file,
    h('div.row-flex.gap-s', {style:'flex-wrap:wrap'}, h('button.btn.tonal.sm', {onclick:()=>file.click()}, M.ic('image'), 'صورة من جهازي'),
      M.openOnlineBg ? h('button.btn.tonal.sm', {onclick:()=>M.openOnlineBg(d=>custom(d), 'تنزيل خلفيات إسلامية')}, M.ic('download'), 'تنزيل خلفيات') : null),
    h('div.card.pad.col-flex', {style:'gap:10px'},
      h('div.cp-lbl', h('span', 'تمويه الخلفية (بلور)'), bl), h('input.cp-range', {type:'range', min:0, max:20, step:1, value:o.blur, 'aria-label':'تمويه الخلفية', oninput:e=>{ bl.textContent = M.n(e.target.value); set({blur:+e.target.value}); }}),
      h('div.cp-lbl', h('span', 'تعتيم الصورة'), dm), h('input.cp-range', {type:'range', min:0, max:80, step:5, value:o.dim, 'aria-label':'تعتيم الصورة', oninput:e=>{ dm.textContent = M.n(e.target.value)+'٪'; set({dim:+e.target.value}); }})))});
  if(sh && sh.el) sh.el.style.maxHeight = '90%';
  mark(); return sh;
};
})();
