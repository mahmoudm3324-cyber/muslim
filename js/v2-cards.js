/* ===== v2 cards: designer of shareable image cards (ayah / hadith / dua / free text) ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const W = 1080;
const RATIOS = [['1:1', 'مربع', 1080], ['4:5', 'منشور', 1350], ['9:16', 'قصة', 1920], ['16:9', 'أفقي', 608]];
const FONTS = [['Amiri Quran', 'خط المصحف'], ['Readex Pro', 'عصري'], ['El Messiri', 'المسيري'], ['Reem Kufi', 'كوفي'], ['Rakkas', 'رقعة مرحة'], ['Noto Sans Arabic', 'نسخ واضح']];
const AL = [['right', 'يمين'], ['center', 'وسط'], ['left', 'يسار']];
const SWATCH = ['#ffffff', '#f6e7b4', '#d9a441', '#1b2a2e', '#0f5c4a', '#7a1f3d'];

/* ---------- procedural backgrounds ---------- */
function rng(seed){ let s = seed >>> 0 || 1; return ()=>{ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function lin(x, w, hh, stops, ang){
  const g = ang === 'h' ? x.createLinearGradient(0, 0, w, 0) : x.createLinearGradient(0, 0, 0, hh);
  stops.forEach((c, i)=>g.addColorStop(i / (stops.length - 1), c)); x.fillStyle = g; x.fillRect(0, 0, w, hh);
}
function star8(x, cx, cy, r, rot){
  x.beginPath();
  for(let i = 0; i < 16; i++){ const a = rot + i * Math.PI / 8, rr = i % 2 ? r * 0.62 : r; x[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  x.closePath();
}
function rub(x, cx, cy, r){
  for(const rot of [0, Math.PI / 4]){ x.beginPath(); for(let i = 0; i < 4; i++){ const a = rot + i * Math.PI / 2 + Math.PI / 4; x[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); x.stroke(); }
}
function tile(x, w, hh, step, fn){ for(let j = -1; j * step < hh + step; j++) for(let i = -1; i * step < w + step; i++) fn(i * step + step / 2, j * step + step / 2, i, j); }
function glow(x, cx, cy, r, col){ const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
function waves(x, w, hh, y0, amp, len, col, ph){ x.beginPath(); x.moveTo(0, hh); for(let i = 0; i <= w; i += 8) x.lineTo(i, y0 + Math.sin(i / len + ph) * amp + Math.sin(i / (len * 0.43) + ph * 2) * amp * 0.35); x.lineTo(w, hh); x.closePath(); x.fillStyle = col; x.fill(); }
function mountains(x, w, hh, base, hgt, col, seed){ const r = rng(seed); x.beginPath(); x.moveTo(0, hh); x.lineTo(0, base); let px = 0; while(px < w){ const nx = px + 120 + r() * 160; x.lineTo(px + (nx - px) / 2, base - hgt * (0.4 + r() * 0.6)); x.lineTo(nx, base - hgt * 0.1 * r()); px = nx; } x.lineTo(w, hh); x.closePath(); x.fillStyle = col; x.fill(); }
function moon(x, cx, cy, r, col){ glow(x, cx, cy, r * 3, 'rgba(255,240,180,.25)'); x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip(); x.fillStyle = col; x.beginPath(); x.rect(cx - r * 2, cy - r * 2, r * 4, r * 4); x.arc(cx + r * 0.42, cy - r * 0.18, r * 0.86, 0, 7); x.fill('evenodd'); x.restore(); }
function dome(x, cx, base, r, col){
  x.fillStyle = col; x.beginPath(); x.moveTo(cx - r, base); x.bezierCurveTo(cx - r, base - r * 1.05, cx - r * 0.35, base - r * 1.1, cx, base - r * 1.6);
  x.bezierCurveTo(cx + r * 0.35, base - r * 1.1, cx + r, base - r * 1.05, cx + r, base); x.closePath(); x.fill();
  x.fillRect(cx - 3, base - r * 1.9, 6, r * 0.32); x.beginPath(); x.arc(cx, base - r * 1.9, 9, 0, 7); x.fill();
}
function minaret(x, cx, base, w, hh, col){
  x.fillStyle = col; x.fillRect(cx - w / 2, base - hh, w, hh); x.fillRect(cx - w * 0.8, base - hh * 0.8, w * 1.6, 14);
  x.beginPath(); x.moveTo(cx - w * 0.62, base - hh); x.lineTo(cx, base - hh - w * 2.2); x.lineTo(cx + w * 0.62, base - hh); x.closePath(); x.fill();
  x.beginPath(); x.arc(cx, base - hh - w * 2.4, 6, 0, 7); x.fill();
}
const BGS = [
 {id:'zumurrud', n:'زمرّد', fg:'#ffffff', acc:'#e9d28a', dark:1, draw(x, w, hh){ lin(x, w, hh, ['#053a31', '#0b6a55', '#0e8a6d']); x.strokeStyle = 'rgba(255,255,255,.09)'; x.lineWidth = 2; tile(x, w, hh, 150, (cx, cy)=>rub(x, cx, cy, 52)); glow(x, w * 0.5, hh * 0.1, w * 0.8, 'rgba(255,255,255,.16)'); }},
 {id:'layl', n:'ليل وهلال', fg:'#ffffff', acc:'#f3dc94', dark:1, draw(x, w, hh){ lin(x, w, hh, ['#060a1f', '#142257', '#25388a']); const r = rng(7); for(let i = 0; i < 160; i++){ x.fillStyle = 'rgba(255,255,255,'+(0.25 + r() * 0.7)+')'; x.beginPath(); x.arc(r() * w, r() * hh, 0.8 + r() * 2.4, 0, 7); x.fill(); } moon(x, w * 0.86, hh * 0.085, 52, '#f6e3a1'); }},
 {id:'dhahab', n:'ذهب وأسود', fg:'#f6e7b4', acc:'#d9a441', dark:1, draw(x, w, hh){ lin(x, w, hh, ['#0a0a0c', '#1e1709', '#0a0a0c']); x.strokeStyle = 'rgba(217,164,65,.28)'; x.lineWidth = 2; const R = 80; for(let j = -1; j * R * 1.5 < hh + R * 2; j++) for(let i = -1; i * R * 1.732 < w + R * 2; i++){ const cx = i * R * 1.732 + (j % 2 ? R * 0.866 : 0), cy = j * R * 1.5; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke(); } }},
 {id:'fajr', n:'فجر', fg:'#ffffff', acc:'#fff1c9', dark:1, shadow:1, draw(x, w, hh){ lin(x, w, hh, ['#2f2e6e', '#a35c9d', '#ee8f86', '#f9cd94']); glow(x, w * 0.5, hh * 0.8, w * 0.9, 'rgba(255,240,200,.75)'); x.fillStyle = 'rgba(255,246,214,.92)'; x.beginPath(); x.arc(w * 0.5, hh * 0.8, 120, 0, 7); x.fill(); mountains(x, w, hh, hh * 0.9, 110, 'rgba(70,40,100,.55)', 4); }},
 {id:'kathib', n:'كثبان', fg:'#2b1708', acc:'#7a4a1c', dark:0, draw(x, w, hh){ lin(x, w, hh, ['#fbe6b9', '#f6c77d', '#efa65a']); glow(x, w * 0.78, hh * 0.2, 320, 'rgba(255,255,255,.7)'); x.fillStyle = '#fff6df'; x.beginPath(); x.arc(w * 0.78, hh * 0.2, 62, 0, 7); x.fill(); waves(x, w, hh, hh * 0.84, 38, 150, '#dca05a', 1); waves(x, w, hh, hh * 0.89, 34, 210, '#c4813d', 3); waves(x, w, hh, hh * 0.94, 26, 120, '#a5642a', 5); }},
 {id:'rawda', n:'روضة', fg:'#0d3d2e', acc:'#2f7d5c', dark:0, draw(x, w, hh){ lin(x, w, hh, ['#cdeee0', '#e9f7da', '#fdf7e0']); glow(x, w * 0.2, hh * 0.12, 300, 'rgba(255,255,255,.9)'); waves(x, w, hh, hh * 0.82, 50, 220, '#9ad3ab', 0.4); const r = rng(11); for(let i = 0; i < 6; i++){ const tx = 120 + i * 170 + r() * 40, ty = hh * 0.86 + r() * 20; x.fillStyle = '#5a3d27'; x.fillRect(tx - 6, ty - 50, 12, 70); x.fillStyle = 'rgba(47,125,92,.9)'; x.beginPath(); x.arc(tx, ty - 80, 46 + r() * 14, 0, 7); x.fill(); } waves(x, w, hh, hh * 0.92, 36, 170, '#4ea57a', 2); waves(x, w, hh, hh * 0.97, 22, 130, '#2f7d5c', 4); }},
 {id:'bahr', n:'بحر', fg:'#ffffff', acc:'#d3f6f2', dark:1, draw(x, w, hh){ lin(x, w, hh, ['#073b63', '#0e6b86', '#1aa8a0']); for(let i = 0; i < 7; i++) waves(x, w, hh, hh * (0.45 + i * 0.09), 24 + i * 3, 110 + i * 26, 'rgba(255,255,255,.07)', i * 1.3); }},
 {id:'jibal', n:'جبال وضباب', fg:'#ffffff', acc:'#dbe7f5', dark:1, shadow:1, draw(x, w, hh){ lin(x, w, hh, ['#1e3350', '#52729a', '#b7c9de']); mountains(x, w, hh, hh * 0.72, 330, '#6f8bb0', 2); lin2(x, w, hh, hh * 0.6, hh * 0.78); mountains(x, w, hh, hh * 0.86, 330, '#3e5a80', 9); lin2(x, w, hh, hh * 0.76, hh * 0.9); mountains(x, w, hh, hh, 300, '#1f3552', 5); }},
 {id:'warq', n:'ورق قديم', fg:'#3b2a14', acc:'#8a5a22', dark:0, draw(x, w, hh){ x.fillStyle = '#f7efdc'; x.fillRect(0, 0, w, hh); const r = rng(3); for(let i = 0; i < 1400; i++){ x.fillStyle = 'rgba(120,80,30,'+(r() * 0.06)+')'; x.fillRect(r() * w, r() * hh, 2 + r() * 3, 2 + r() * 3); } const g = x.createRadialGradient(w / 2, hh / 2, hh * 0.3, w / 2, hh / 2, hh * 0.85); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(110,70,20,.32)'); x.fillStyle = g; x.fillRect(0, 0, w, hh); }},
 {id:'ward', n:'وردي هادئ', fg:'#4a1530', acc:'#a23b69', dark:0, draw(x, w, hh){ lin(x, w, hh, ['#fde0e8', '#f1c4e6', '#d9c0f1']); const r = rng(5); for(let i = 0; i < 26; i++){ glow(x, r() * w, r() * hh, 80 + r() * 190, 'rgba(255,255,255,'+(0.2 + r() * 0.35)+')'); } }},
 {id:'sadaf', n:'سداسي', fg:'#f6e7b4', acc:'#d9a441', dark:1, draw(x, w, hh){ lin(x, w, hh, ['#0a2a27', '#14433d']); x.strokeStyle = 'rgba(217,164,65,.3)'; x.lineWidth = 2; const R = 70; for(let j = -1; j * R * 1.5 < hh + R * 2; j++) for(let i = -1; i * R * 1.732 < w + R * 2; i++){ const cx = i * R * 1.732 + (j % 2 ? R * 0.866 : 0), cy = j * R * 1.5; x.beginPath(); for(let k = 0; k < 6; k++){ const a = Math.PI / 6 + k * Math.PI / 3; x[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * R * 0.94, cy + Math.sin(a) * R * 0.94); } x.closePath(); x.stroke(); } }},
 {id:'qubba', n:'قبّة ومآذن', fg:'#ffffff', acc:'#f3dc94', dark:1, draw(x, w, hh){ lin(x, w, hh, ['#081634', '#173e68', '#2c6a8f']); const r = rng(9); for(let i = 0; i < 70; i++){ x.fillStyle = 'rgba(255,255,255,'+(0.2 + r() * 0.6)+')'; x.beginPath(); x.arc(r() * w, r() * hh * 0.6, 0.8 + r() * 1.8, 0, 7); x.fill(); } moon(x, w * 0.2, hh * 0.1, 52, '#f6e3a1'); const b = hh * 0.97, c = '#050d1c'; minaret(x, w * 0.14, b, 26, hh * 0.22, c); minaret(x, w * 0.86, b, 26, hh * 0.22, c); dome(x, w * 0.36, b, 110, c); dome(x, w * 0.64, b, 110, c); dome(x, w * 0.5, b, 170, c); x.fillRect(0, b - 30, w, hh); x.fillStyle = 'rgba(255,214,120,.8)'; [0.42, 0.5, 0.58].forEach(p=>x.fillRect(w * p - 6, b - 60, 12, 26)); }},
 {id:'ghurub', n:'غروب', fg:'#ffffff', acc:'#ffe3a8', dark:1, shadow:1, draw(x, w, hh){ lin(x, w, hh, ['#2b1055', '#8e2a8b', '#e0386a', '#fbb03b']); glow(x, w / 2, hh * 0.78, w * 0.8, 'rgba(255,225,150,.6)'); x.fillStyle = '#ffe9b0'; x.beginPath(); x.arc(w / 2, hh * 0.78, 130, 0, 7); x.fill(); waves(x, w, hh, hh * 0.88, 30, 190, '#3a1548', 1); waves(x, w, hh, hh * 0.94, 22, 140, '#220a30', 3); }},
 {id:'nana', n:'نعناع بسيط', fg:'#12392f', acc:'#2f7d5c', dark:0, draw(x, w, hh){ x.fillStyle = '#e4f0ea'; x.fillRect(0, 0, w, hh); glow(x, w * 0.1, hh * 0.1, 520, 'rgba(120,205,170,.55)'); glow(x, w * 0.95, hh * 0.9, 620, 'rgba(250,224,150,.55)'); glow(x, w * 0.9, hh * 0.15, 380, 'rgba(160,215,235,.5)'); }},
 {id:'najma', n:'نجوم ثمانية', fg:'#f9e7c1', acc:'#e0b45a', dark:1, draw(x, w, hh){ lin(x, w, hh, ['#4d1030', '#2a0817']); x.strokeStyle = 'rgba(224,180,90,.3)'; x.lineWidth = 2; tile(x, w, hh, 120, (cx, cy, i, j)=>{ star8(x, cx, cy, 44, 0); x.stroke(); star8(x, cx + 60, cy + 60, 22, Math.PI / 8); x.stroke(); }); glow(x, w / 2, hh / 2, hh * 0.7, 'rgba(0,0,0,.45)'); }}
];
function lin2(x, w, hh, y0, y1){ const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(200,220,240,.45)'); x.fillStyle = g; x.fillRect(0, y0, w, y1 - y0); }
const BG_BY = {}; BGS.forEach(b=>BG_BY[b.id] = b);
let thumbs = null;
function makeThumbs(){
  if(thumbs) return thumbs; thumbs = {};
  BGS.forEach(b=>{ try{ const c = document.createElement('canvas'); c.width = 135; c.height = 135; const x = c.getContext('2d'); x.scale(0.125, 0.125); x.save(); b.draw(x, 1080, 1080); x.restore(); thumbs[b.id] = c.toDataURL('image/jpeg', .7); }catch(e){ thumbs[b.id] = ''; } });
  return thumbs;
}
const imgCache = {};
const loadImg = src=>{ if(imgCache[src]) return imgCache[src]; const pr = new Promise((res, rej)=>{ const im = new Image(); im.onload = ()=>res(im); im.onerror = ()=>{ delete imgCache[src]; rej(new Error('img')); }; im.src = src; }); if(!/^blob:/.test(src)) imgCache[src] = pr; return pr; };
function wrapText(x, text, maxW){
  const out = [];
  String(text).split(/\n+/).forEach(par=>{ let cur = '';
    par.trim().split(/\s+/).filter(Boolean).forEach(wd=>{ const t = cur ? cur + ' ' + wd : wd; if(cur && x.measureText(t).width > maxW){ out.push(cur); cur = wd; } else cur = t; });
    if(cur) out.push(cur); });
  return out;
}
const toAr = n=>String(n).replace(/\d/g, d=>'٠١٢٣٤٥٦٧٨٩'[d]);


function clampView(st){
  const V = st.view = Object.assign({x:0, y:0, z:1}, st.view), drawn = !!BG_BY[st.bg] ;
  V.z = Math.max(drawn ? 1 : 0.3, Math.min(5, +V.z || 1));
  const mx = drawn ? (V.z - 1) / 2 : 1, my = mx; V.x = Math.max(-mx, Math.min(mx, +V.x || 0)); V.y = Math.max(-my, Math.min(my, +V.y || 0)); return V;
}
/* ---------- render: draws a full card into `c` ---------- */
async function render(c, st, custom){
  const H = st.ratio, bg = BG_BY[st.bg];
  try{ await Promise.all([document.fonts.load('400 48px "'+st.font+'"', st.text || 'ا'), document.fonts.load('500 32px "Readex Pro"', 'المسلم')]); }catch(e){}
  c.width = W; c.height = H;
  const x = c.getContext('2d'); x.clearRect(0, 0, W, H); x.direction = 'rtl';
  let fg = '#ffffff', acc = '#e9d28a', shadow = true;
  const V = clampView(st), cx0 = W / 2 + V.x * W, cy0 = H / 2 + V.y * H;
  if(bg){
    const off = document.createElement('canvas'); off.width = W; off.height = H; const ox = off.getContext('2d'); ox.save(); bg.draw(ox, W, H); ox.restore();
    x.save(); x.translate(cx0, cy0); x.scale(V.z, V.z); x.drawImage(off, -W / 2, -H / 2); x.restore();
    fg = bg.fg; acc = bg.acc; shadow = !!bg.dark; if(bg.shadow) shadow = true;
  } else if(st.bg === 'grad'){
    const a = (st.angle || 0) * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), L = Math.abs(W * dx) + Math.abs(H * dy);
    const g = x.createLinearGradient(W / 2 - dx * L / 2, H / 2 - dy * L / 2, W / 2 + dx * L / 2, H / 2 + dy * L / 2);
    g.addColorStop(0, st.c1); g.addColorStop(1, st.gmode === 'solid' ? st.c1 : st.c2); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const lum = hex=>{ const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
    const l = st.gmode === 'solid' ? lum(st.c1) : (lum(st.c1) + lum(st.c2)) / 2; if(l > 0.6){ fg = '#1b2a2e'; acc = '#6b4a1a'; shadow = false; }
  } else {
    let im = null; try{ im = st.bg === 'custom' ? custom : await loadImg(st.bg); }catch(e){}
    if(!im || !im.naturalWidth){ lin(x, W, H, ['#0d3b46', '#14566b']); }
    else {
      const iw = im.naturalWidth, ih = im.naturalHeight;
      // fill behind the picture (visible with "contain", with zoom-out, or after panning)
      if(st.fillMode === 'color'){ x.fillStyle = st.fillColor; x.fillRect(0, 0, W, H); }
      else { x.save(); try{ x.filter = 'blur(36px)'; }catch(e){} const sc = Math.max(W / iw, H / ih) * 1.15; x.drawImage(im, (W - iw * sc) / 2, (H - ih * sc) / 2, iw * sc, ih * sc); x.restore(); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, W, H); }
      let dw, dh;
      if(st.fit === 'stretch'){ dw = W; dh = H; } else { const sc = st.fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih); dw = iw * sc; dh = ih * sc; }
      dw *= V.z; dh *= V.z; x.drawImage(im, cx0 - dw / 2, cy0 - dh / 2, dw, dh);
    }
    x.fillStyle = 'rgba(6,18,22,'+(st.dim / 100)+')'; x.fillRect(0, 0, W, H);
    const v = x.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
  }
  if(st.color) fg = st.color; else if(st.autoFg) fg = st.autoFg;
  const land = H < W, sc = land ? 0.62 : 1;                       // a landscape card has less height for everything
  const sig = (st.sig || '').trim(), showSrc = st.showSrc !== false && !!st.src.trim();
  const footerH = Math.round(((showSrc ? 150 : 40) + (st.app || sig ? 120 : 0)) * sc), PAD = Math.round((land ? 80 : 110));
  const frame = st.frame || 'none';
  // frames drawn under the text
  if(frame === 'line' || frame === 'orn'){
    const m = Math.round(46 * sc + 10), r = 26;
    x.save(); x.strokeStyle = acc; x.globalAlpha = 0.85; x.lineWidth = 3;
    const rr = (a, b, w, hh, rad)=>{ x.beginPath(); if(x.roundRect) x.roundRect(a, b, w, hh, rad); else x.rect(a, b, w, hh); x.stroke(); };
    rr(m, m, W - 2 * m, H - 2 * m, r); x.lineWidth = 1.5; x.globalAlpha = 0.6; rr(m + 14, m + 14, W - 2 * m - 28, H - 2 * m - 28, r - 8);
    if(frame === 'orn'){ x.globalAlpha = 0.95; x.fillStyle = acc; [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([px, py])=>{ star8(x, px, py, 22 * sc + 6, 0); x.fill(); x.fillStyle = 'rgba(0,0,0,.25)'; star8(x, px, py, 8 * sc + 3, Math.PI / 8); x.fill(); x.fillStyle = acc; });
      x.lineWidth = 2; x.globalAlpha = 0.8; [m + 60, H - m - 60].forEach(py=>{ star8(x, W / 2, py === m + 60 ? m : H - m, 12, 0); x.fill(); }); }
    x.restore();
  }
  // text fit
  const text = st.text.trim() || 'اكتب نصّك هنا';
  const quran = st.font === 'Amiri Quran', lhk = (quran ? 1.95 : 1.75) * (st.lh || 1), inset = frame === 'line' || frame === 'orn' ? 40 : 0;
  const availH = H - PAD - footerH - 40 - inset, maxW = W - 2 * PAD - inset;
  let size = Math.round(st.size * (land ? 0.85 : 1)), lines = [];
  for(; size >= 20; size -= 2){ x.font = '400 '+size+'px "'+st.font+'",serif'; lines = wrapText(x, text, maxW); if(lines.length * size * lhk <= availH) break; }
  const lh = size * lhk, blockH = lines.length * lh, top = PAD / 2 + 20 + inset / 2 + (availH - blockH) / 2 + 20;
  if(frame === 'plate'){
    x.font = '400 '+size+'px "'+st.font+'",serif';
    const bw = Math.min(W - 2 * PAD + 80, Math.max(...lines.map(l=>x.measureText(l).width)) + 120), bh = blockH + 70, bx = (W - bw) / 2, by = top - 35;
    const fl = (h=>{ const n = parseInt(h.slice(1, 7), 16); return isNaN(n) ? 1 : (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; })(fg);
    x.save(); x.fillStyle = fl > 0.55 ? 'rgba(0,0,0,.36)' : 'rgba(255,255,255,.6)';
    x.beginPath(); if(x.roundRect) x.roundRect(bx, by, bw, bh, 34); else x.rect(bx, by, bw, bh); x.fill(); x.restore();
  }
  x.textBaseline = 'middle'; x.textAlign = st.align; x.fillStyle = fg;
  const tx = st.align === 'center' ? W / 2 : st.align === 'right' ? W - PAD - inset / 2 : PAD + inset / 2;
  if(shadow && st.shadow){ x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 16; x.shadowOffsetY = 2; }
  x.font = '400 '+size+'px "'+st.font+'",serif';
  lines.forEach((l, i)=>x.fillText(l, tx, top + i * lh + lh / 2));
  x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
  // source line with a small ornament
  let y = H - footerH - 10 + Math.round(40 * sc) - inset / 2;
  if(showSrc){
    x.save(); x.strokeStyle = acc; x.fillStyle = acc; x.globalAlpha = 0.9; x.lineWidth = 2;
    x.beginPath(); x.moveTo(W / 2 - 150, y); x.lineTo(W / 2 - 34, y); x.moveTo(W / 2 + 34, y); x.lineTo(W / 2 + 150, y); x.stroke(); star8(x, W / 2, y, 15, 0); x.fill(); x.restore();
    x.font = '500 '+Math.round(36 * (land ? 0.85 : 1))+'px "Readex Pro","Noto Sans Arabic",sans-serif'; x.textAlign = 'center'; x.fillStyle = fg; x.globalAlpha = 0.95;
    wrapText(x, st.src.trim(), W - 2 * PAD).slice(0, 2).forEach((l, i)=>x.fillText(l, W / 2, y + 52 * sc + 6 + i * 46)); x.globalAlpha = 1;
  }
  if(st.app || sig){
    const ly = H - Math.round(100 * sc) - (land ? 0 : inset / 2); x.textAlign = 'center'; x.font = '600 '+Math.round(30 * (land ? 0.9 : 1))+'px "Readex Pro",sans-serif'; x.fillStyle = fg; x.globalAlpha = 0.85;
    let logo = null; if(st.app){ try{ logo = await loadImg('img/icons/'+(M.cfg.appIcon || 10)+'.jpg'); }catch(e){} }
    const label = sig || 'تطبيق المسلم', lw = x.measureText(label).width, L = 56, gap = 16, tot = logo ? L + gap + lw : lw, lx = W / 2 - tot / 2;
    if(logo){ x.save(); x.beginPath(); x.roundRect ? x.roundRect(lx, ly - L / 2, L, L, 14) : x.rect(lx, ly - L / 2, L, L); x.clip(); x.drawImage(logo, lx, ly - L / 2, L, L); x.restore(); }
    x.direction = 'rtl'; x.textAlign = 'right'; x.fillText(label, lx + tot, ly + 2); x.globalAlpha = 1;
  }
  return c;
}

/* ---------- send / save ---------- */
const stamp = ()=>{ const d = new Date(); return 'muslim-'+d.getFullYear()+String(d.getMonth() + 1).padStart(2, '0')+String(d.getDate()).padStart(2, '0')+'-'+String(d.getHours()).padStart(2, '0')+String(d.getMinutes()).padStart(2, '0')+String(d.getSeconds()).padStart(2, '0')+'.png'; };
async function sendPng(c, text){
  try{ if(window.Android && window.Android.shareImage){ window.Android.shareImage(c.toDataURL('image/jpeg', .95).split(',')[1], text || ''); return; } }catch(e){}
  const bl = await new Promise(r=>c.toBlob(r, 'image/png'));
  if(!bl){ M.toast('تعذّر إنشاء الصورة'); return; }
  try{ const f = new File([bl], stamp(), {type:'image/png'}); if(navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share(text ? {files:[f], text} : {files:[f]}); return; } }catch(e){ if(e && e.name === 'AbortError') return; }
  download(bl);
}
function saveImg(c){
  try{ if(window.Android && window.Android.saveImage){ window.Android.saveImage(c.toDataURL('image/png').split(',')[1], stamp()); return; } }catch(e){}
  c.toBlob(bl=>{ if(bl) download(bl); else M.toast('تعذّر إنشاء الصورة'); }, 'image/png');
}
function download(bl){ const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = stamp(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000); M.toast('تم حفظ الصورة'); }

/* ready-made looks: background + type + frame in one tap */
const PRESETS = [
  {n:'زمرّد', bg:'zumurrud', font:'Amiri Quran', color:'', frame:'orn'},
  {n:'ليل', bg:'layl', font:'Amiri Quran', color:'', frame:'none'},
  {n:'ذهبي', bg:'dhahab', font:'El Messiri', color:'#f6e7b4', frame:'line'},
  {n:'ورق قديم', bg:'warq', font:'Amiri Quran', color:'', frame:'orn'},
  {n:'فجر', bg:'fajr', font:'Readex Pro', color:'', frame:'plate'},
  {n:'نعناع', bg:'nana', font:'Noto Sans Arabic', color:'', frame:'none'},
  {n:'قبّة', bg:'qubba', font:'Reem Kufi', color:'', frame:'none'},
  {n:'وردي', bg:'ward', font:'El Messiri', color:'', frame:'line'},
  {n:'جبال', bg:'jibal', font:'Amiri Quran', color:'', frame:'plate'},
  {n:'كثبان', bg:'kathib', font:'Rakkas', color:'', frame:'none'}
];
const FRAMES = [['none', 'بدون'], ['plate', 'لوحة خلف النص'], ['line', 'إطار مزدوج'], ['orn', 'زخرفة']];
const DESIGNS = 'cards2:designs';

/* ---------- screen ---------- */
M.openCards = function(init){
  const saved = M.store.get('cards2', {}) || {};
  const st = Object.assign({source:'free', text:'', src:'', bg:'zumurrud', font:'Amiri Quran', size:62, lh:1, align:'center', color:'', dim:45, ratio:1080, app:true, showSrc:true, sig:'', shadow:true, frame:'none', fit:'cover', fillMode:'blur', fillColor:'#101820', c1:'#0f7a5f', c2:'#0b2f4a', angle:160, gmode:'grad', sura:1, from:1, to:1, tab:'text'},
    saved, {text:'', src:'', source:'free', tab:'text', view:{x:0, y:0, z:1}}, init || {});   // the zoom/pan of the background is never carried over
  if(!BG_BY[st.bg] && !/^img\//.test(st.bg) && st.bg !== 'custom' && st.bg !== 'grad') st.bg = 'zumurrud';
  const wasCustom = saved.bg === 'custom';
  if(st.bg === 'custom') st.bg = 'zumurrud';   // restored below from M.kv when a saved picture exists
  let custom = null, token = 0, canvas = null, view = null, loadErr = false;
  const KEEP = ['bg', 'font', 'size', 'lh', 'align', 'color', 'dim', 'ratio', 'app', 'showSrc', 'sig', 'shadow', 'frame', 'fit', 'fillMode', 'fillColor', 'c1', 'c2', 'angle', 'gmode'];
  const remember = ()=>{ const o = {}; KEEP.forEach(k=>o[k] = st[k]); M.store.set('cards2', o); };
  const stage = h('div.cd-stage'), prev = h('div.cd-prev'), sizeTag = h('span.cd-size'), panel = h('div.cd-panel'), tabs = h('div.cd-tabs'), presets = h('div.cd-presets');
  stage.append(prev, h('div.cd-under', sizeTag, h('span.cd-tip', 'اسحب الخلفية لتحريكها • بإصبعين للتقريب')));
  const fitCanvas = c=>{ const r = stage.getBoundingClientRect(), maxW = Math.max(160, r.width - 8), maxH = Math.min(window.innerHeight * 0.46, 460), k = Math.min(maxW / c.width, maxH / c.height); c.style.width = Math.round(c.width * k)+'px'; c.style.height = Math.round(c.height * k)+'px'; };
  const paint = M.debounce(async ()=>{
    const my = ++token, c = document.createElement('canvas');
    try{ st.autoFg = null; await render(c, st, custom); if(my !== token) return; canvas = c; c.className = 'cd-canvas'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'معاينة البطاقة'); fitCanvas(c); prev.replaceChildren(c); prev.classList.remove('busy');
      const r = RATIOS.find(x=>x[2] === st.ratio); sizeTag.textContent = r ? r[1]+' '+M.n(r[0]) : ''; }
    catch(e){ prev.replaceChildren(h('div.small.muted.center', 'تعذّر رسم البطاقة — حاول مرة أخرى')); }
  }, 60);
  const redraw = ()=>{ prev.classList.add('busy'); remember(); paint(); };
  window.addEventListener('resize', ()=>{ if(canvas) fitCanvas(canvas); });
  /* zoom slider (kept in sync with pinch / wheel) */
  const zs = (()=>{ const b = h('b.num', M.n(100) + '٪'), inp = h('input.cp-range', {type:'range', min:30, max:500, step:5, value:100, 'aria-label':'تقريب الخلفية', oninput:e=>{ st.view.z = +e.target.value / 100; clampView(st); b.textContent = M.n(Math.round(st.view.z * 100)) + '٪'; redraw(); }});
    const o = {el:h('div.col-flex', {style:'gap:4px'}, h('div.cp-lbl', h('span', 'تقريب الخلفية'), b), inp), set(z){ z = Math.max(0.3, z); inp.value = Math.round(z * 100); b.textContent = M.n(Math.round(z * 100)) + '٪'; inp.min = BG_BY[st.bg] ? 100 : 30; }}; return o; })();
  const readCustom = f=>new Promise((res, rej)=>{ const u = URL.createObjectURL(f), im = new Image(); im.onload = ()=>{ try{ const sc = Math.min(1, 1800 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); const d = new Image(); d.onload = ()=>{ URL.revokeObjectURL(u); res(d); }; d.onerror = rej; d.src = c.toDataURL('image/jpeg', .86); }catch(e){ rej(e); } }; im.onerror = rej; im.src = u; });
  const saveCustom = im=>{ try{ M.kv.set('cards2img', im.src); }catch(e){} };
  /* gestures on the preview: one finger pans, two fingers pinch, wheel zooms, double tap resets */
  (function(){
    const pts = new Map(); let pd = 0, moved = 0, lastTap = 0;
    const cv = ()=>prev.querySelector('canvas'), dist = ()=>{ const a = [...pts.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; };
    const touch = ()=>{ clampView(st); zs.set(st.view.z); redraw(); };
    prev.addEventListener('pointerdown', e=>{ try{ prev.setPointerCapture(e.pointerId); }catch(err){} pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); if(pts.size === 2) pd = dist(); if(pts.size === 1) moved = 0; });
    prev.addEventListener('pointermove', e=>{
      const p = pts.get(e.pointerId); if(!p) return; const c = cv(); if(!c) return; const r = c.getBoundingClientRect(), dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if(pts.size === 1){ st.view.x += dx / r.width; st.view.y += dy / r.height; touch(); }
      else if(pts.size === 2){ const d = dist(); st.view.z *= d / pd; pd = d; touch(); }
    });
    const up = e=>{ if(!pts.has(e.pointerId)) return; pts.delete(e.pointerId);
      if(e.type === 'pointerup' && pts.size === 0 && moved < 10){ const t = Date.now(); if(t - lastTap < 350){ st.view = {x:0, y:0, z:1}; zs.set(1); redraw(); lastTap = 0; } else lastTap = t; } };
    prev.addEventListener('pointerup', up); prev.addEventListener('pointercancel', up);
    prev.addEventListener('wheel', e=>{ e.preventDefault(); st.view.z *= Math.exp(-e.deltaY * 0.0015); touch(); }, {passive:false});
  })();
  const ayahsText = ()=>{
    if(!M.Q.ready) return '';
    const n = M.Q.surahs[st.sura - 1].n, a = Math.min(st.from, n), b = Math.min(Math.max(st.to, a), n), parts = [];
    for(let i = a; i <= b; i++) parts.push(M.ayahText(st.sura, i) + (b > a ? ' ۝' + toAr(i) : ''));
    return '﴿ ' + parts.join(' ') + ' ﴾';
  };
  function syncAyah(){
    if(st.source !== 'ayah' || !M.Q.ready) return;
    const n = M.Q.surahs[st.sura - 1].n; st.from = Math.min(st.from, n); st.to = Math.max(st.from, Math.min(st.to, n, st.from + 9));
    st.text = ayahsText(); st.src = 'سورة ' + M.sname(st.sura) + ' • ' + (st.to > st.from ? 'الآيات ' + toAr(st.from) + '–' + toAr(st.to) : 'الآية ' + toAr(st.from));
    if(st.text.length > 900){ st.to = st.from; st.text = ayahsText(); }
  }
  /* the texts each source offers (for the list and for «اقتراح») */
  const pool = src=>{
    if(src === 'hadith') return (M.HADITH || []).map(x=>[String(x[0]), x[1] || '']);
    if(src === 'dua'){ const all = []; (M.JAMI || []).forEach(([g, its])=>its.forEach(([t, s2])=>all.push([t, (g ? g + ' — ' : '') + s2]))); return all; }
    if(src === 'dhikr'){ const A = M.ADHKAR || {}, all = []; ['MORNING_EVENING', 'AFTER_PRAYER', 'SLEEP', 'WAKE'].forEach(k=>(A[k] || []).forEach(it=>{ if(typeof it.t === 'string' && it.t.length < 420) all.push([it.t, it.src || '']); })); return all; }
    return [];
  };
  function surprise(){
    if(st.source === 'ayah'){ if(!M.Q.ready) return; st.sura = 1 + Math.floor(Math.random() * 114); const n = M.Q.surahs[st.sura - 1].n; st.from = st.to = 1 + Math.floor(Math.random() * n); syncAyah(); drawPanel(); redraw(); return; }
    const p = pool(st.source); if(!p.length) return; const it = p[Math.floor(Math.random() * p.length)];
    st.text = it[0].replace(/^[«"]|[»"]$/g, '').trim(); st.src = it[1] || ''; drawPanel(); redraw();
  }
  function setSource(s2){ st.source = s2; if(s2 === 'ayah'){ st.font = 'Amiri Quran'; syncAyah(); } else if(s2 === 'free'){ st.text = ''; st.src = ''; } else surprise(); drawPanel(); redraw(); }
  const TABS = [['text', 'النص', 'note'], ['bg', 'الخلفية', 'image'], ['font', 'الخط', 'type'], ['frame', 'الإطار', 'layers'], ['size', 'المقاس', 'fullscreen']];
  function drawTabs(){ tabs.replaceChildren(...TABS.map(([k, l, ic])=>h('button.cd-tab'+(st.tab === k ? '.on' : ''), {'aria-pressed':st.tab === k ? 'true' : 'false', onclick:()=>{ st.tab = k; drawTabs(); drawPanel(); }}, M.ic(ic), h('span', l)))); }
  function drawPresets(){
    const th = makeThumbs();
    presets.replaceChildren(...PRESETS.map(p=>h('button.cd-pre'+(st.bg === p.bg && st.frame === p.frame && st.font === p.font ? '.on' : ''), {style:'background-image:url("'+th[p.bg]+'")', 'aria-label':'نمط '+p.n, onclick:()=>{ Object.assign(st, {bg:p.bg, font:st.source === 'ayah' ? 'Amiri Quran' : p.font, color:p.color, frame:p.frame, view:{x:0, y:0, z:1}}); drawPresets(); if(st.tab !== 'text') drawPanel(); redraw(); }},
      h('span.cd-pre-a', {style:'font-family:"'+p.font+'",serif'}, 'بسم الله'), h('span.cd-pre-n', p.n))));
  }
  const numSel = (n, v, on)=>{ const el = h('select.field', {onchange:e=>on(+e.target.value)}); for(let i = 1; i <= n; i++) el.append(h('option', {value:i}, M.n(i))); el.value = v; return el; };
  const range = (min, max, step, v, lbl, on, fmt)=>{ const b = h('b.num', fmt ? fmt(v) : M.n(v)); return h('div.col-flex', {style:'gap:4px'}, h('div.cp-lbl', h('span', lbl), b), h('input.cp-range', {type:'range', min, max, step, value:v, 'aria-label':lbl, oninput:e=>{ b.textContent = fmt ? fmt(+e.target.value) : M.n(e.target.value); on(+e.target.value); }})); };
  const lbl = t=>h('div.cd-lbl', t);
  function pickList(title, items){
    const list = h('div.list.card.cd-pick'), q = h('input.field', {type:'search', placeholder:'ابحث…'});
    let sh; const draw = ()=>{ const nq = M.normAr ? M.normAr(q.value.trim()) : q.value.trim(); list.replaceChildren(...items.filter(it=>!nq || (M.normAr ? M.normAr(it[0]) : it[0]).includes(nq)).slice(0, 80).map(it=>h('button.item.cd-pi', {onclick:()=>{ st.text = it[0].replace(/^[«"]|[»"]$/g, '').trim(); st.src = it[1] || ''; sh.close(); drawPanel(); redraw(); }}, h('div.grow', h('div.t.qfont', it[0].length > 140 ? it[0].slice(0, 140) + '…' : it[0]), it[1] ? h('div.s', it[1]) : null)))); if(!list.children.length) list.append(h('div.empty', 'لا نتائج')); };
    q.addEventListener('input', draw); sh = M.sheet({title, content:h('div.col-flex', q, list)}); if(sh.el) sh.el.style.maxHeight = '88%'; draw();
  }
  function drawPanel(){
    const p = panel; p.replaceChildren();
    if(st.tab === 'text'){
      p.append(M.seg([['ayah', 'آية'], ['hadith', 'حديث'], ['dua', 'دعاء'], ['dhikr', 'ذكر'], ['free', 'نص حر']], st.source, setSource));
      if(st.source === 'ayah'){
        if(!M.Q.ready){ p.append(h('div.card.pad.center.cd-load', loadErr ? h('div', 'تعذّر تحميل المصحف.', h('br'), h('button.btn.tonal.sm', {onclick:loadQ}, M.ic('refresh'), 'إعادة المحاولة')) : 'جارٍ تحميل المصحف…')); return; }
        const ss = h('select.field', {'aria-label':'السورة', onchange:e=>{ st.sura = +e.target.value; st.from = st.to = 1; syncAyah(); drawPanel(); redraw(); }});
        M.Q.surahs.forEach((s2, i)=>ss.append(h('option', {value:i + 1}, M.n(i + 1) + '. ' + s2.ar))); ss.value = st.sura;
        const n = M.Q.surahs[st.sura - 1].n;
        p.append(h('div.col-flex', {style:'gap:6px'}, lbl('السورة'), ss, h('div.grid2', h('div', lbl('من آية'), numSel(n, st.from, v=>{ st.from = v; if(st.to < v) st.to = v; syncAyah(); drawPanel(); redraw(); })), h('div', lbl('إلى آية'), numSel(n, st.to, v=>{ st.to = Math.max(v, st.from); syncAyah(); drawPanel(); redraw(); }))),
          h('div.tiny.muted', 'حتى ١٠ آيات في بطاقة واحدة؛ يُصغَّر الخط تلقائيًا ليناسب البطاقة.')),
          h('button.btn.tonal.sm', {onclick:surprise}, M.ic('sparkle'), 'آية عشوائية'));
        return;
      }
      if(st.source !== 'free'){
        const names = {hadith:['اختر حديثًا', 'حديث عشوائي'], dua:['اختر دعاءً', 'دعاء عشوائي'], dhikr:['اختر ذكرًا', 'ذكر عشوائي']}[st.source];
        p.append(h('div.row-flex.gap-s', h('button.btn.tonal.grow', {onclick:()=>pickList(names[0], pool(st.source))}, M.ic('list'), names[0]), h('button.btn.tonal', {onclick:surprise}, M.ic('sparkle'), names[1])));
      }
      p.append(h('textarea.field.cd-ta', {rows:4, placeholder:'اكتب النص هنا…', 'aria-label':'نص البطاقة', value:st.text, oninput:e=>{ st.text = e.target.value; redraw(); }}),
        h('input.field', {placeholder:'المصدر (اختياري) مثل: رواه البخاري', 'aria-label':'المصدر', value:st.src, oninput:e=>{ st.src = e.target.value; redraw(); }}));
    } else if(st.tab === 'bg'){
      const th = makeThumbs(), strip = h('div.shr-strip.cd-strip'), photos = h('div.shr-strip.cd-strip'), opts = h('div.col-flex.cd-opts');
      const mark = ()=>{ M.$$('.shr-th', strip).forEach(b=>b.classList.toggle('on', b.dataset.id === st.bg)); M.$$('.shr-th', photos).forEach(b=>b.classList.toggle('on', b.dataset.id === st.bg)); };
      const resetView = ()=>{ st.view = {x:0, y:0, z:1}; };
      const pick = id=>{ st.bg = id; st.color = ''; resetView(); mark(); drawOpts(); drawPresets(); redraw(); };
      strip.append(h('button.shr-th.cd-th.cd-gradth', {dataset:{id:'grad'}, 'aria-label':'لون أو تدرّج', style:'background-image:linear-gradient(135deg,'+st.c1+','+st.c2+')', onclick:()=>pick('grad')}, h('span.cd-thn', 'لون / تدرّج')));
      BGS.forEach(b=>strip.append(h('button.shr-th.cd-th', {dataset:{id:b.id}, 'aria-label':b.n, style:'background-image:url("'+th[b.id]+'")', onclick:()=>pick(b.id)}, h('span.cd-thn', b.n))));
      if(custom) photos.append(h('button.shr-th.cd-th', {dataset:{id:'custom'}, 'aria-label':'صورتي', style:'background-image:url("'+custom.src+'")', onclick:()=>pick('custom')}, h('span.cd-thn', 'صورتي')));
      (M.BG_LIST || []).forEach((src, i)=>photos.append(h('button.shr-th.cd-th', {dataset:{id:src}, 'aria-label':'صورة '+(i + 1), style:'background-image:url("'+(M.bgThumb ? M.bgThumb(src) : src)+'")', onclick:()=>pick(src)})));
      const file = h('input', {type:'file', accept:'image/*', class:'hide', onchange:async e=>{ const f2 = e.target.files[0]; if(!f2) return; try{ const im = await readCustom(f2); custom = im; saveCustom(im); pick('custom'); drawPanel(); }catch(err){ M.toast('تعذّر قراءة الصورة'); } }});
      const col = (v, l, on)=>h('label.cd-col', h('span', l), h('input', {type:'color', value:v, 'aria-label':l, oninput:e=>on(e.target.value)}));
      function drawOpts(){
        const add = (...a)=>opts.append(...a.filter(Boolean));
        opts.replaceChildren(); zs.set(clampView(st).z); const isImg = !BG_BY[st.bg] && st.bg !== 'grad', drawn = !!BG_BY[st.bg];
        if(st.bg === 'grad'){
          add(M.seg([['solid', 'لون واحد'], ['grad', 'تدرّج']], st.gmode, v=>{ st.gmode = v; drawOpts(); redraw(); }),
            h('div.row-flex.gap-s', col(st.c1, 'اللون الأول', v=>{ st.c1 = v; redraw(); }), st.gmode === 'grad' ? col(st.c2, 'اللون الثاني', v=>{ st.c2 = v; redraw(); }) : null),
            st.gmode === 'grad' ? range(0, 360, 5, st.angle, 'زاوية التدرّج', v=>{ st.angle = v; redraw(); }, v=>M.n(v) + '°') : null);
          return;
        }
        if(isImg){
          add(lbl('وضع الملء'), M.seg([['cover', 'ملء'], ['contain', 'احتواء'], ['stretch', 'تمديد']], st.fit, v=>{ st.fit = v; resetView(); zs.set(1); redraw(); }),
            lbl('خلف الصورة'), M.seg([['blur', 'تمويه'], ['color', 'لون']], st.fillMode, v=>{ st.fillMode = v; drawOpts(); redraw(); }),
            st.fillMode === 'color' ? col(st.fillColor, 'لون الحواف', v=>{ st.fillColor = v; redraw(); }) : null,
            range(0, 85, 5, st.dim, 'تعتيم الصورة', v=>{ st.dim = v; redraw(); }, v=>M.n(v) + '٪'));
        }
        add(zs.el, h('button.btn.tonal.sm', {onclick:()=>{ resetView(); zs.set(1); redraw(); }}, M.ic('undo'), 'إعادة ضبط التقريب'),
          h('div.tiny.muted', drawn ? 'قرّب الخلفية ثم اسحبها على المعاينة لتحريكها؛ نقرتان للإعادة.' : 'اسحب الصورة على المعاينة، وبإصبعين للتقريب؛ نقرتان للإعادة.'));
      }
      p.append(lbl('خلفيات مرسومة'), strip, lbl('صور'), photos, file, h('button.btn.tonal.sm', {onclick:()=>file.click()}, M.ic('image'), 'صورة من جهازي'), opts);
      mark(); drawOpts();
      setTimeout(()=>{ const on = strip.querySelector('.on') || photos.querySelector('.on'); if(on) try{ on.scrollIntoView({inline:'center', block:'nearest'}); }catch(e){} }, 60);
    } else if(st.tab === 'font'){
      const g = h('div.cd-fonts');
      FONTS.forEach(([f2, l])=>g.append(h('button.cd-font'+(st.font === f2 ? '.on' : ''), {style:'font-family:"'+f2+'",serif', onclick:()=>{ st.font = f2; M.$$('.cd-font', g).forEach(b=>b.classList.remove('on')); g.children[FONTS.findIndex(x=>x[0] === f2)].classList.add('on'); drawPresets(); redraw(); }}, h('span', 'بسم الله'), h('small', {style:'font-family:var(--font)'}, l))));
      const sw = h('div.cd-sw'), mk = ()=>{ sw.replaceChildren(h('button.cd-swb.auto'+(st.color ? '' : '.on'), {'aria-label':'لون تلقائي', onclick:()=>{ st.color = ''; mk(); redraw(); }}, 'تلقائي'), ...SWATCH.map(c=>h('button.cd-swb'+(st.color === c ? '.on' : ''), {style:'background:'+c, 'aria-label':'اللون '+c, onclick:()=>{ st.color = c; mk(); redraw(); }})),
        h('label.cd-swb.cd-cust', {'aria-label':'لون مخصص', style:st.color && !SWATCH.includes(st.color) ? 'background:'+st.color : ''}, M.ic('palette'), h('input', {type:'color', value:st.color || '#ffffff', oninput:e=>{ st.color = e.target.value; mk(); redraw(); }}))); };
      mk();
      p.append(g, range(24, 110, 2, st.size, 'حجم الخط', v=>{ st.size = v; redraw(); }), range(0.8, 1.5, 0.05, st.lh || 1, 'تباعد الأسطر', v=>{ st.lh = v; redraw(); }, v=>M.n(Math.round(v * 100)) + '٪'),
        lbl('المحاذاة'), M.seg(AL, st.align, v=>{ st.align = v; redraw(); }), lbl('لون النص'), sw,
        h('div.row-flex.cd-between.cd-swrow', h('span', 'ظل خفيف للنص'), M.switchEl(st.shadow, v=>{ st.shadow = v; redraw(); })),
        h('div.tiny.muted', 'إن طال النص صُغّر الخط تلقائيًا ليتسع.'));
    } else if(st.tab === 'frame'){
      p.append(lbl('شكل الإطار'), h('div.cd-frames', ...FRAMES.map(([k, l])=>h('button.cd-frame'+(st.frame === k ? '.on' : ''), {onclick:()=>{ st.frame = k; drawPanel(); drawPresets(); redraw(); }}, h('i.cd-fr-'+k), h('span', l)))),
        h('div.list.card',
          h('div.item.static', h('div.grow', h('div.t', 'إظهار المصدر'), h('div.s', 'تحت النص مع زخرفة صغيرة')), M.switchEl(st.showSrc !== false, v=>{ st.showSrc = v; redraw(); })),
          h('div.item.static', h('div.grow', h('div.t', 'اسم التطبيق وشعاره')), M.switchEl(st.app, v=>{ st.app = v; redraw(); }))),
        lbl('توقيعك (اختياري)'), h('input.field', {placeholder:'اسمك أو حسابك — يظهر أسفل البطاقة', maxLength:40, value:st.sig || '', oninput:e=>{ st.sig = e.target.value; redraw(); }}));
    } else {
      p.append(lbl('مقاس البطاقة'), h('div.cd-ratios', ...RATIOS.map(r=>h('button.cd-ratio'+(st.ratio === r[2] ? '.on' : ''), {onclick:()=>{ st.ratio = r[2]; drawPanel(); redraw(); }},
        h('i', {style:'aspect-ratio:'+r[0].replace(':', '/')}), h('b', r[1]), h('small.num', M.n(r[0]))))),
        h('div.tiny.muted', 'المربع للمنشورات، و«منشور» لإنستغرام، و«قصة» للحالات والقصص، و«أفقي» لفيسبوك وإكس.'));
    }
  }
  function loadQ(){ loadErr = false; drawPanel(); M.loadQuran().then(()=>{ if(view && view.closed) return; if(st.source === 'ayah') syncAyah(); drawPanel(); redraw(); }).catch(()=>{ loadErr = true; if(!(view && view.closed)) drawPanel(); }); }
  const caption = ()=>(st.text + (st.src ? '\n' + st.src : '')).trim();
  /* sharing: as it is, as a story, saved, or just the words */
  async function shareSheet(){
    if(!canvas) return;
    const thumb = h('img.cd-sh-img', {src:canvas.toDataURL('image/jpeg', .7), alt:''});
    let withText = M.store.get('cards2:cap', true);
    const sh = M.sheet({title:'مشاركة البطاقة', content:h('div.col-flex.cd-share', thumb,
      h('div.row-flex.cd-between', h('span', 'إرفاق النص مع الصورة'), M.switchEl(withText, v=>{ withText = v; M.store.set('cards2:cap', v); })),
      h('div.cd-sh-grid',
        h('button.cd-sh', {onclick:async()=>{ sh.close(); await sendPng(canvas, withText ? caption() : ''); }}, M.ic('share'), h('b', 'مشاركة الصورة'), h('small', 'واتساب، فيسبوك، تيليجرام…')),
        h('button.cd-sh', {onclick:async()=>{ sh.close(); const c = document.createElement('canvas'); await render(c, Object.assign({}, st, {ratio:1920}), custom); await sendPng(c, withText ? caption() : ''); }}, M.ic('fullscreen'), h('b', 'مشاركة كقصة'), h('small', 'مقاس ٩:١٦ للحالة')),
        h('button.cd-sh', {onclick:()=>{ sh.close(); saveImg(canvas); }}, M.ic('download'), h('b', 'حفظ في الجهاز'), h('small', 'صورة PNG بجودة كاملة')),
        h('button.cd-sh', {onclick:()=>{ sh.close(); M.copy(caption()); }}, M.ic('copy'), h('b', 'نسخ النص'), h('small', 'النص والمصدر فقط'))),
      h('button.btn.tonal.block', {onclick:()=>{ sh.close(); saveDesign(); }}, M.ic('bookmark'), 'حفظ في «تصاميمي»'))});
  }
  function saveDesign(){
    if(!canvas) return;
    const t = document.createElement('canvas'), k = 200 / Math.max(canvas.width, canvas.height); t.width = Math.round(canvas.width * k); t.height = Math.round(canvas.height * k); t.getContext('2d').drawImage(canvas, 0, 0, t.width, t.height);
    const o = {id:Date.now(), th:t.toDataURL('image/jpeg', .7), source:st.source, text:st.text, src:st.src, sura:st.sura, from:st.from, to:st.to}; KEEP.forEach(k2=>o[k2] = st[k2]); if(o.bg === 'custom') o.bg = 'zumurrud';
    const list = (M.store.get(DESIGNS, []) || []).filter(x=>x.text !== o.text || x.bg !== o.bg); list.unshift(o); M.store.set(DESIGNS, list.slice(0, 16));
    M.toast('حُفظ التصميم في «تصاميمي»');
  }
  function designs(){
    const list = M.store.get(DESIGNS, []) || [];
    const box = h('div.cd-designs');
    let sh;
    const draw = ()=>{ const l = M.store.get(DESIGNS, []) || []; box.replaceChildren(...(l.length ? l.map(d=>h('div.cd-des', h('button.cd-des-im', {style:'background-image:url("'+d.th+'")', 'aria-label':'فتح التصميم', onclick:()=>{ sh.close(); const o = Object.assign({}, d); delete o.id; delete o.th; Object.assign(st, o, {view:{x:0, y:0, z:1}}); drawTabs(); drawPanel(); drawPresets(); redraw(); }}),
      h('button.icon-btn.cd-des-x', {'aria-label':'حذف', onclick:()=>{ M.store.set(DESIGNS, (M.store.get(DESIGNS, []) || []).filter(x=>x.id !== d.id)); draw(); }}, M.ic('trash')))) : [h('div.empty', 'لا توجد تصاميم محفوظة بعد. احفظ بطاقتك من زر المشاركة.')])); };
    draw(); sh = M.sheet({title:'تصاميمي', content:box});
  }
  view = M.openView({id:'cards', title:'بطاقات ومنشورات', onClose:()=>{ token++; }, actions:[h('button.icon-btn', {'aria-label':'تصاميمي', onclick:designs}, M.ic('bookmark'))],
    build:b=>{
      b.classList.add('cd-body');
      const bar = h('div.cd-bar', h('button.btn.grow', {onclick:shareSheet}, M.ic('share'), 'مشاركة'), h('button.btn.tonal', {'aria-label':'حفظ في الجهاز', onclick:()=>{ if(canvas) saveImg(canvas); }}, M.ic('download'), 'حفظ'));
      b.append(stage, h('div.cd-sec', 'أنماط جاهزة'), presets, tabs, panel, bar);
      drawTabs(); drawPresets(); drawPanel(); redraw();
    }});
  loadQ();
  if(wasCustom && !(init && init.bg)) M.kv.get('cards2img').then(d=>{ if(!d || view.closed) return; const im = new Image(); im.onload = ()=>{ custom = im; st.bg = 'custom'; redraw(); if(st.tab === 'bg') drawPanel(); drawPresets(); }; im.src = d; }).catch(()=>{});
  return view;
};
M.addSection({id:'cards', title:'بطاقات ومنشورات', icon:'image', group:'أدوات', fn:()=>M.openCards()});
})();
