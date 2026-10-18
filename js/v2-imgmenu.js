/* ===== v2 image menu: long-press (>=450ms) on any picture -> save / share / set as app background / copy.
   Opt out with data-nolp on the image or any ancestor. Pointer-based; cancels on move/scroll/release. ===== */
(function(){
'use strict';
const M = window.M, h = M.h, A = window.Android;
const EN = {'الصورة':'Image','حفظ في المعرض':'Save to gallery','مشاركة':'Share','تعيين كخلفية للتطبيق':'Set as app background','نسخ':'Copy',
  'تم حفظ الصورة':'Image saved','تم تعيين الخلفية':'Background set','تم نسخ الصورة':'Image copied','تعذّر تحميل الصورة':'Could not load the image','تعذّر النسخ':'Copy failed'};
// the chosen language's dictionary first; the English table only when that dictionary has no entry
const T = s=>{ const l = document.documentElement.dataset.lang || document.documentElement.lang || 'ar'; if(/^ar/.test(l)) return s; const t = M.tr ? M.tr(s) : s; return t !== s ? t : (EN[s] || s); };
const has = f=>{ try{ return A && typeof A[f] === 'function'; }catch(e){ return false; } };
const HOLD = 450, SLOP = 9, MINSZ = 64;
let tm = 0, sx = 0, sy = 0, tgt = null, swallow = 0, openSheet = null;

function bgUrl(el){
  try{
    const v = getComputedStyle(el).backgroundImage; if(!v || v === 'none') return null;
    const m = v.match(/url\((['"]?)(.*?)\1\)/); return m && !/^data:image\/svg/.test(m[2]) ? m[2] : null;
  }catch(e){ return null; }
}
function find(t, x, y){
  if(!t || !t.closest || t.closest('[data-nolp],input,textarea,.keyboard,.mpage,.vscroll,.pg-slide')) return null;
  const im = t.closest('img');
  if(im){ const r = im.getBoundingClientRect(); if(r.width >= MINSZ && r.height >= MINSZ && im.currentSrc && !/\.svg(\?|$)/i.test(im.currentSrc)) return {url:im.currentSrc || im.src, el:im}; return null; }
  /* pictures sitting under non-interactive overlays (hero photo + scrim) */
  const root = t.closest('.card,.hero,[class*="hero"]');
  if(root && x != null){
    for(const el of root.querySelectorAll('img,div,span,figure,section')){
      if(el.closest('[data-nolp]')) continue;
      const r = el.getBoundingClientRect();
      if(r.width < MINSZ || r.height < MINSZ || x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const i2 = el.tagName === 'IMG' ? el.currentSrc : bgUrl(el);
      if(i2) return {url:i2, el};
    }
  }
  let el = t, n = 0;
  while(el && el !== document.body && n++ < 5){
    if(el.closest && el.matches && el.hasAttribute && el.hasAttribute('data-nolp')) return null;
    const u = bgUrl(el);
    if(u){ const r = el.getBoundingClientRect(); if(r.width >= MINSZ && r.height >= MINSZ) return {url:u, el}; }
    el = el.parentElement;
  }
  return null;
}
async function blobOf(url){
  const r = await fetch(url); if(!r.ok) throw new Error('fetch'); return r.blob();
}
const b64 = blob=>new Promise((res, rej)=>{ const f = new FileReader(); f.onload = ()=>res(String(f.result).split(',')[1]); f.onerror = rej; f.readAsDataURL(blob); });
const ext = b=>/png/.test(b.type) ? 'png' : /webp/.test(b.type) ? 'webp' : 'jpg';
function download(blob, name){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(()=>{ a.remove(); URL.revokeObjectURL(a.href); }, 1500); }

async function act(kind, info, sh){
  try{
    const blob = await blobOf(info.url), name = 'muslim-'+Date.now()+'.'+ext(blob);
    if(kind === 'save'){
      if(has('saveImage')){ A.saveImage(await b64(blob), name); }
      else download(blob, name);
      M.toast(T('تم حفظ الصورة'));
    } else if(kind === 'share'){
      if(has('shareImage')) A.shareImage(await b64(blob), '');
      else {
        const f = new File([blob], name, {type:blob.type || 'image/jpeg'});
        if(navigator.canShare && navigator.canShare({files:[f]})) await navigator.share({files:[f]}); else download(blob, name);
      }
    } else if(kind === 'bg'){
      const url = await M.imageToDataURL(blob, 1400, .82);
      M.save({bgImage:url, bg:'image', bgDim:Math.max(M.cfg.bgDim || 0, 0.3)}); M.toast(T('تم تعيين الخلفية'));
    } else if(kind === 'copy'){
      let png = blob;
      if(blob.type !== 'image/png'){
        const bm = await createImageBitmap(blob), c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0);
        png = await new Promise(r=>c.toBlob(r, 'image/png'));
      }
      await navigator.clipboard.write([new ClipboardItem({'image/png':png})]); M.toast(T('تم نسخ الصورة'));
    }
    sh && sh.close();
  }catch(e){
    if(e && e.name === 'AbortError') return;
    M.toast(T(kind === 'copy' ? 'تعذّر النسخ' : 'تعذّر تحميل الصورة'));
  }
}
function show(info){
  try{ M.haptic && M.haptic(14); }catch(e){}
  const row = (ic, t, kind)=>h('button.item', {onclick:()=>act(kind, info, sh)}, h('span.lead', {html:M.icon(ic)}), h('div.grow.t', T(t)));
  const body = h('div.col-flex.imgm',
    h('div.imgm-pv', h('img', {src:info.url, alt:'', 'data-nolp':'', draggable:false})),
    h('div.card.list', row('download', 'حفظ في المعرض', 'save'), row('share', 'مشاركة', 'share'), row('pages', 'تعيين كخلفية للتطبيق', 'bg'), row('note', 'نسخ', 'copy')));
  const sh = openSheet = M.sheet({title:T('الصورة'), content:body});
}
function cancel(){ clearTimeout(tm); tm = 0; tgt = null; }
document.addEventListener('pointerdown', e=>{
  if(e.pointerType === 'mouse' && e.button !== 0) return;
  cancel(); if(e.isPrimary === false) return;
  const info = find(e.target, e.clientX, e.clientY); if(!info) return;
  tgt = info; sx = e.clientX; sy = e.clientY;
  tm = setTimeout(()=>{ const i = tgt; cancel(); if(!i) return; swallow = Date.now(); show(i); }, HOLD);
}, {passive:true, capture:true});
document.addEventListener('pointermove', e=>{ if(tm && Math.hypot(e.clientX - sx, e.clientY - sy) > SLOP) cancel(); }, {passive:true, capture:true});
['pointerup', 'pointercancel', 'dragstart', 'wheel'].forEach(t=>document.addEventListener(t, cancel, {passive:true, capture:true}));
document.addEventListener('scroll', cancel, {passive:true, capture:true});
/* the click that ends a long-press must not trigger the element's own action */
document.addEventListener('click', e=>{ if(swallow && Date.now() - swallow < 900){ swallow = 0; e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('contextmenu', e=>{ if(find(e.target) && !e.target.closest('input,textarea')) e.preventDefault(); });
M.imageMenu = show;
})();
