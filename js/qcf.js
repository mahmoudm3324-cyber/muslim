/* ===== Madinah Mushaf — real glyph pages, several editions =====
   k41p  King Fahd Complex 1441, plain      fonts: MohamadHajjRabee/quran-qcf4 (47 files, one per ~13 pages)
   k41c  King Fahd Complex 1441, tajweed    fonts: quran.com QCF V4 COLRv1 (604 per-page files, colour palettes)
   k05   Madinah mushaf 1405 (QCF V1)       fonts: quran.com QCF V1 (604 per-page files) + layout in data/qcf-ed.json
   Fonts are © King Fahd Complex: not bundled, fetched on demand, cached in Cache Storage, can be pre-downloaded. */
(function(){
'use strict';
const M = window.M;
const REPO = 'MohamadHajjRabee/quran-qcf4@main/fonts-woff2/';
const QC = 'quran/quran.com-frontend-next';
/* the Android and iPhone apps carry the default Mushaf edition (QCF4, 36 MB, www/qcf) inside them: it opens with no internet and nothing to download.
   (the iPhone app also defines window.Android, so an iPhone build without the folder is found by the probe below instead of being assumed) */
let BUNDLED = !!window.Android && !window.isIOSApp && !(window.Android.noBundledQcf);
/* web build: if the optional 'qcf/' folder was uploaded next to index.html, use it (works offline) */
const PROBE = BUNDLED ? Promise.resolve() : fetch('qcf/QCF4_Hafs_01_W.woff2', {method:'HEAD', cache:'no-store'}).then(r=>{ if(r.ok && !/text\/html/.test(r.headers.get('content-type') || '')) BUNDLED = true; }).catch(()=>{});
const kindOf = n=>(n === 'Q' || typeof n === 'number') ? 'p' : n[0];
const pgOf = n=>String(n).slice(1);
const SRC = n=>{
  const k = kindOf(n);
  if(k === 'p'){ const f = n === 'Q' ? 'QCF4_QBSML.woff2' : 'QCF4_Hafs_'+String(n).padStart(2, '0')+'_W.woff2';
    return [...(BUNDLED ? ['qcf/'+f] : []), 'https://cdn.jsdelivr.net/gh/'+REPO+f, 'https://fastly.jsdelivr.net/gh/'+REPO+f, 'https://raw.githubusercontent.com/MohamadHajjRabee/quran-qcf4/main/fonts-woff2/'+f]; }
  const sub = k === 'c' ? 'v4/colrv1' : 'v1', f = 'public/fonts/quran/hafs/'+sub+'/woff2/p'+pgOf(n)+'.woff2';
  const tail = 'fonts/quran/hafs/'+sub+'/woff2/p'+pgOf(n)+'.woff2';
  return ['https://cdn.jsdelivr.net/gh/'+QC+'@master/'+f, 'https://verses.quran.foundation/'+tail, 'https://raw.githubusercontent.com/'+QC+'/master/'+f];
};
const CACHES = {p:'qcf4-fonts-v1', c:'qcf4c-fonts-v1', v:'qcf1-fonts-v1'};
const state = {ok:{}, pend:{}, fail:{}};
const fam = n=>n === 'Q' ? 'QCF4_QBSML' : typeof n === 'number' ? 'QCF4_Hafs_'+String(n).padStart(2, '0') : (n[0] === 'c' ? 'QCF4C_p' : 'QCF1_p')+pgOf(n);

/* sizes of cached files (bytes), remembered so the editions screen is instant */
let szMap = {}; try{ szMap = JSON.parse(localStorage.getItem('mf:sz') || '{}') || {}; }catch(e){}
let szT = null;
const recSize = (k, key, b)=>{ szMap[k+':'+key] = b; clearTimeout(szT); szT = setTimeout(()=>{ try{ localStorage.setItem('mf:sz', JSON.stringify(szMap)); }catch(e){} }, 800); };

async function getBuf(n){
  const k = kindOf(n), srcs = SRC(n);
  let c = null; try{ c = await caches.open(CACHES[k]); }catch(e){}
  for(const u of srcs){ try{ if(c){ const hit = await c.match(u); if(hit) return await hit.arrayBuffer(); } }catch(e){} }
  let last;
  for(const u of srcs){
    try{
      const r = await fetch(u, {mode:'cors'}); if(!r.ok) throw new Error(r.status);
      const copy = r.clone(); const buf = await r.arrayBuffer();
      if(buf.byteLength < (k === 'p' ? 20000 : 3000)) throw new Error('short');
      if(u.indexOf('qcf/') === 0){ recSize(k, n, buf.byteLength); return buf; }
      try{ if(c) await c.put(u, copy); recSize(k, n, buf.byteLength); }catch(e){}
      return buf;
    }catch(e){ last = e; }
  }
  throw last || new Error('font');
}

/* @font-palette-values for the colour (COLRv1) fonts: palette 0 light, 1 dark, 3 plain light, 4 plain dark */
let palSheet = null;
function addPalettes(family){
  try{
    if(!palSheet){ const st = document.createElement('style'); st.id = 'mf-pal'; document.head.append(st); palSheet = st.sheet; }
    [['--ql', 0], ['--qd', 1], ['--qpl', 3], ['--qpd', 4]].forEach(([nm, bp])=>{ try{ palSheet.insertRule('@font-palette-values '+nm+'{font-family:"'+family+'";base-palette:'+bp+'}', palSheet.cssRules.length); }catch(e){} });
  }catch(e){}
}

/* ---- editions ---- */
const ED = {
  k41c:{id:'k41c', kind:'c', name:'مصحف المدينة ١٤٤١هـ بالتلوين', fonts:604, mb:51},
  k41p:{id:'k41p', kind:'p', name:'مصحف المدينة ١٤٤١هـ بدون تلوين', fonts:48, mb:38},
  k05:{id:'k05', kind:'v', name:'مصحف المدينة ١٤٠٥هـ', fonts:604, mb:48}
};
let edData = null, edP = null;
const SEQ1 = i=>i < 97 ? 0xFB51 + i : 0xFBD3 + (i - 97);      // QCF v1 glyph code of the i-th glyph of a page
const pageCache = {};

M.qcf = {
  data:null, fam, state, ED,
  load(){ return this._p || (this._p = PROBE.then(()=>M.loadJSON('qcf')).then(d=>{ this.data = d; return d; }).then(async d=>{ if(this.edKind() !== 'p') await this.loadEd().catch(()=>{}); return d; })); },
  loadEd(){ return edP || (edP = M.loadJSON('qcf-ed').then(d=>{ edData = d; return d; }).catch(e=>{ edP = null; throw e; })); },
  /* feature flag: the 1405 edition is shown in the editions screen only while true (its fonts and layout were verified) */
  flags:{k05:true},
  /* the pages edition in use */
  edId(){ let e = M.cfg.mfEd; if(!ED[e] || (e === 'k05' && !this.flags.k05)) e = 'k41p'; if(e !== 'k41p' && !edData) e = 'k41p'; return e; },
  async useEdition(id){ try{ if(id !== 'k41p') await this.loadEd(); }catch(e){ return false; } return this.setEdition(id); },
  edKind(){ const e = M.cfg.mfEd; return ED[e] ? ED[e].kind : 'p'; },
  setEdition(id){ if(!ED[id]) return false; M.save('mfEd', id); pageCache.k = null; Object.keys(pageCache).forEach(k=>delete pageCache[k]); M.emit('mf:edition', id); return true; },
  has(n){ return !!state.ok[n]; },
  ensure(n){
    if(state.ok[n]) return Promise.resolve(true);
    if(state.pend[n]) return state.pend[n];
    return state.pend[n] = (async()=>{
      try{
        const buf = await getBuf(n);
        const ff = new FontFace(fam(n), buf, {display:'block'}); await ff.load(); document.fonts.add(ff);
        if(kindOf(n) === 'c') addPalettes(fam(n));
        state.ok[n] = true; delete state.fail[n]; return true;
      }catch(e){ state.fail[n] = true; return false; }
      finally{ delete state.pend[n]; }
    })();
  },
  /* ---- page structure of the current edition: [fontKey, lines] — same shape as data/qcf.json ---- */
  edPage(p, ed){
    ed = ed || this.edId();
    if(ed === 'k41p' || !edData) return this.data[p-1];
    const key = ed+p; if(pageCache[key]) return pageCache[key];
    let r; try{ r = ed === 'k41c' ? buildC(p) : buildV(p); }catch(e){ console.error(e); r = this.data[p-1]; }
    return pageCache[key] = r;
  },
  /* the font files a page needs */
  needs(p){
    const pg = this.edPage(p), n = [pg[0], 'Q'];
    pg[1].forEach(l=>{ if(l[0] === 'b' && l[3] && !n.includes(l[3])) n.push(l[3]); });
    return n;
  },
  /* edition-aware pagination (the 1405 print breaks 57 ayahs differently from the 1441 one) */
  pageOf(s, a){
    if(this.edId() !== 'k05') return M.pageOf(s, a);
    const id = M.aid(s, a), st = edData.v.st; let lo = 0, hi = 603;
    while(lo < hi){ const mid = (lo + hi + 1) >> 1; if(st[mid] <= id) lo = mid; else hi = mid - 1; }
    return lo + 1;
  },
  pageStart(p){
    if(this.edId() !== 'k05') return M.Q.pageStart[p];
    return M.fromAid(edData.v.st[p-1]);
  },
  pageSurahs(p){
    if(this.edId() !== 'k05') return M.pageSurahs(p);
    const st = edData.v.st, a = st[p-1], b = p < 604 ? st[p] - 1 : M.Q.total - 1, out = [];
    for(let id = a; id <= b; id++){ const s = M.fromAid(id)[0]; if(!out.includes(s)) out.push(s); }
    return out;
  },
  /* ---- offline storage ---- */
  keysFor(ed){ const o = ['Q']; if(ed === 'k41p'){ for(let i = 1; i <= 47; i++) o.push(i); } else for(let i = 1; i <= 604; i++) o.push((ED[ed].kind)+i); return o; },
  async cachedCount(ed){
    if(BUNDLED && (ed ? ED[ed].kind : 'p') === 'p') return 48;   // inside the app
    try{ const c = await caches.open(CACHES[ed ? ED[ed].kind : 'p']); return (await c.keys()).length; }catch(e){ return 0; }
  },
  /* bytes stored for an edition (reads sizes lazily and remembers them) */
  async cacheBytes(ed){
    const k = ED[ed].kind; let tot = 0, n = 0;
    if(BUNDLED && k === 'p') return {count:48, bytes:37.6e6};
    try{
      const c = await caches.open(CACHES[k]);
      for(const rq of await c.keys()){
        n++; const name = rq.url.split('/').pop(); let key = null;
        if(k === 'p'){ key = /QBSML/.test(name) ? 'Q' : (name.match(/Hafs_(\d+)/) || [])[1]; if(key && key !== 'Q') key = +key; } else key = k+(name.match(/p(\d+)/) || [])[1];
        const id = k+':'+key; let b = szMap[id];
        if(b == null){ try{ const r = await c.match(rq); b = (await r.blob()).size; recSize(k, key, b); }catch(e){ b = 0; } }
        tot += b;
      }
    }catch(e){}
    return {count:n, bytes:tot};
  },
  async downloadEd(ed, onp, signal){
    const list = this.keysFor(ed), conc = ED[ed].kind === 'p' ? 3 : 6;
    let done = 0, bad = 0, i = 0;
    const work = async()=>{
      while(i < list.length){
        if(signal && signal.stop) return;
        const n = list[i++]; const ok = await this.ensure(n); if(!ok) bad++; done++; onp && onp(done, list.length, bad);
      }
    };
    await Promise.all(Array.from({length:conc}, work));
    return {done, bad, total:list.length};
  },
  async downloadAll(onp, signal){ return this.downloadEd('k41p', onp, signal); },
  async clearEd(ed){ const k = ED[ed].kind; try{ await caches.delete(CACHES[k]); }catch(e){} Object.keys(szMap).forEach(x=>{ if(x[0] === k && x[1] === ':') delete szMap[x]; }); try{ localStorage.setItem('mf:sz', JSON.stringify(szMap)); }catch(e){}
    this.keysFor(ed).forEach(n=>{ if(n !== 'Q'){ delete state.ok[n]; } }); },
  async clear(){ return this.clearEd('k41p'); }
};
M.qcf.on = ()=>true;

/* ---- k41c: the 1441 layout (identical line widths) with the glyph codes of the V4 colour fonts ---- */
function bisC(kind, n){ const o = []; for(let i = 0; i < 4; i++) o.push(String.fromCodePoint(kind === 'c' ? 0xFC41 + i : SEQ1(i))); return o; }
function buildC(p){
  const pg = M.qcf.data[p-1], ex = new Set(edData.c[p-1]); let g = 0;
  const take = ()=>{ let s = String.fromCodePoint(0xFC41 + g++); while(ex.has(g)){ s += String.fromCodePoint(0xFC41 + g++); } return s; };
  let lead = ''; while(ex.has(g)) lead += String.fromCodePoint(0xFC41 + g++);
  const lines = pg[1].map(l=>{
    if(l[0] === 'h') return l;
    if(l[0] === 'b') return ['b', bisC('c'), l[2], 'c1'];
    return ['w', l[1], l[2].map(w=>{ const s = lead + take(); lead = ''; return [s, w[1], w[2], w[3]]; })];
  });
  return ['c'+p, lines];
}
/* ---- k05: 1405 layout from data/qcf-ed.json (glyph counts per line / per ayah, small marks) ---- */
let nameG = null;
function buildV(p){
  const V = edData.v;
  if(!nameG){ nameG = {}; M.qcf.data.forEach(pg=>pg[1].forEach(l=>{ if(l[0] === 'h') nameG[l[1]] = l; })); }
  const a0 = V.st[p-1], a1 = p < 604 ? V.st[p] : M.Q.total, ex = new Set(V.ex[p-1]);
  /* glyph -> ayah, and which glyph ends an ayah */
  const gAy = [], endG = new Set();
  for(let id = a0; id < a1; id++){
    const n = V.g[id], s0 = gAy.length; for(let i = 0; i < n; i++) gAy.push(id);
    for(let i = s0 + n - 1; i >= s0; i--){ if(!ex.has(i)){ endG.add(i); break; } }
  }
  const lines = []; let g = 0;
  V.ln[p-1].forEach((cnt, li)=>{
    const words = []; let cur = null, lead = '';
    for(let i = g; i < g + cnt; i++){
      const ch = String.fromCodePoint(SEQ1(i));
      if(ex.has(i)){ if(cur) cur[0] += ch; else lead += ch; continue; }
      const [s, a] = M.fromAid(gAy[i]);
      cur = [lead + ch, s, a, endG.has(i) ? 1 : 0]; lead = ''; words.push(cur);
    }
    const first = words[0];
    if(first && first[2] === 1 && gAy[g] !== undefined && (g === 0 || gAy[g-1] !== gAy[g])){
      const hl = nameG[first[1]]; if(hl) lines.push(hl);
      if(first[1] !== 1 && first[1] !== 9) lines.push(['b', bisC('v'), 6.4, 'v1']);
    }
    lines.push(['w', (V.wd[p-1][li] || 140) / 10, words]);
    g += cnt;
  });
  return ['v'+p, lines];
}
})();
