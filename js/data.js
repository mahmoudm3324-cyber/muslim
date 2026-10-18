/* ===== data: Quran/meta loading, search, tafsir, reciters, kv cache ===== */
(function(){
'use strict';
const M = window.M;

/* ---- tiny IndexedDB key-value (tafsir cache, offline text) ---- */
let dbp;
function db(){
  if(dbp) return dbp;
  dbp = new Promise((res, rej)=>{
    try{
      const r = indexedDB.open('muslim-kv', 1);
      r.onupgradeneeded = ()=>r.result.createObjectStore('kv');
      r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error);
    }catch(e){ rej(e); }
  });
  return dbp;
}
M.kv = {
  async get(k){ try{ const d = await db(); return await new Promise(res=>{ const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = ()=>res(q.result); q.onerror = ()=>res(undefined); }); }catch(e){ return undefined; } },
  async set(k, v){ try{ const d = await db(); return await new Promise(res=>{ const q = d.transaction('kv','readwrite').objectStore('kv').put(v, k); q.onsuccess = ()=>res(true); q.onerror = ()=>res(false); }); }catch(e){ return false; } },
  async del(k){ try{ const d = await db(); return await new Promise(res=>{ const q = d.transaction('kv','readwrite').objectStore('kv').delete(k); q.onsuccess = ()=>res(true); q.onerror = ()=>res(false); }); }catch(e){ return false; } }
};

/* ---- JSON loader (cached promises) ---- */
const cache = {};
M.loadJSON = function(name){
  if(!cache[name]) cache[name] = fetch('data/'+name+'.json').then(r=>{ if(!r.ok) throw new Error('load '+name); return r.json(); }).catch(e=>{ delete cache[name]; throw e; });
  return cache[name];
};

/* ---- Quran ---- */
M.Q = {ready:false};
M.loadQuran = function(){
  if(M.Q.promise) return M.Q.promise;
  M.Q.promise = Promise.all([M.loadJSON('ayahs'), M.loadJSON('meta'), M.loadJSON('pg')]).then(([ayahs, meta, pg])=>{
    const Q = M.Q;
    Q.ayahs = ayahs; Q.meta = meta; Q.surahs = meta.surahs;
    Q.starts = []; let acc = 0;
    meta.surahs.forEach(s=>{ Q.starts.push(acc); acc += s.n; });
    Q.total = acc;
    Q.ayahPage = Uint16Array.from(pg.ayahPage); Q.pageSurahs = pg.pageSurahs;
    Q.pageStart = [null].concat(pg.pageStart);
    Q.ready = true;
    return Q;
  }).catch(e=>{ M.Q.promise = null; throw e; });   // a failed load may be retried
  return M.Q.promise;
};
M.aid = (s, a)=>M.Q.starts[s-1] + a - 1;
M.fromAid = function(id){
  const st = M.Q.starts; let lo = 0, hi = st.length - 1;
  while(lo < hi){ const mid = (lo + hi + 1) >> 1; if(st[mid] <= id) lo = mid; else hi = mid - 1; }
  return [lo + 1, id - st[lo] + 1];
};
M.sname = s=>M.Q.surahs[s-1].ar;
M.ayahText = (s, a)=>M.Q.ayahs[M.aid(s, a)];
M.pageOf = (s, a)=>M.Q.ayahPage[M.aid(s, a)] || 1;
M.juzOfPage = p=>M.Q.meta.pageInfo[p-1][0];
M.hizbQOfPage = p=>M.Q.meta.pageInfo[p-1][1];
M.pageSurahs = p=>M.Q.pageSurahs[p-1];

M.AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
M.normAr = function(s){
  return s.replace(/[ـً-ٰٟۖ-ۭ࣓-ࣿ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[ﷲ]/g, 'الله');
};
M.searchQuran = function(q, limit){
  const Q = M.Q; if(!Q.ready) return [];
  if(!Q.norm){ Q.norm = Q.ayahs.map(M.normAr); }
  q = M.normAr(q.trim()); if(!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  const out = [];
  for(let i = 0; i < Q.norm.length; i++){
    const t = Q.norm[i];
    let ok = true; for(const w of words){ if(t.indexOf(w) < 0){ ok = false; break; } }
    if(ok){ out.push(i); if(out.length >= (limit || 80)) break; }
  }
  return out;
};

/* ---- translations ---- */
M.TRANSLATIONS = [['off','بدون ترجمة'],['en','English'],['fr','Français'],['es','Español'],['id','Bahasa Indonesia'],['tr','Türkçe'],['ur','اردو'],['ru','Русский'],['zh','中文'],['bn','বাংলা'],['sv','Svenska']];
M.loadTranslation = lang=>M.loadJSON('tr_'+lang);
M.loadTranslit = ()=>M.loadJSON('translit');

/* ---- tafsir (online, cached) ---- */
M.TAFSIRS = [['ar-tafsir-muyassar','التفسير الميسر'],['ar-tafsir-ibn-kathir','تفسير ابن كثير'],['ar-tafseer-al-saddi','تفسير السعدي'],['ar-tafseer-al-qurtubi','تفسير القرطبي'],['ar-tafsir-al-tabari','تفسير الطبري'],['ar-tafsir-al-baghawi','تفسير البغوي'],['ar-tafsir-al-jalalayn','تفسير الجلالين']];
M.getTafsir = async function(slug, s, a){
  const key = `taf:${slug}:${s}:${a}`;
  const c = await M.kv.get(key); if(c) return {text:c, cached:true};
  const r = await fetch(`https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/${slug}/${s}/${a}.json`);
  if(!r.ok) throw new Error('http '+r.status);
  const j = await r.json(); const text = (j.text || '').trim();
  if(text) M.kv.set(key, text);
  return {text};
};

/* ---- recitation ---- */
M.RECITERS = [
  ['Alafasy_128kbps','مشاري راشد العفاسي'],['Nasser_Alqatami_128kbps','ناصر القطامي'],['Husary_128kbps','محمود خليل الحصري (مرتّل)'],['Husary_128kbps_Mujawwad','محمود خليل الحصري (مجوّد)'],
  ['Minshawy_Murattal_128kbps','محمد صديق المنشاوي (مرتّل)'],['Minshawy_Mujawwad_192kbps','محمد صديق المنشاوي (مجوّد)'],
  ['Abdul_Basit_Murattal_192kbps','عبد الباسط عبد الصمد (مرتّل)'],['Abdul_Basit_Mujawwad_128kbps','عبد الباسط عبد الصمد (مجوّد)'],
  ['Abdurrahmaan_As-Sudais_192kbps','عبد الرحمن السديس'],['Saood_ash-Shuraym_128kbps','سعود الشريم'],['MaherAlMuaiqly128kbps','ماهر المعيقلي'],
  ['Ghamadi_40kbps','سعد الغامدي'],['Hudhaify_128kbps','علي الحذيفي'],['Hani_Rifai_192kbps','هاني الرفاعي'],['ahmed_ibn_ali_al_ajamy_128kbps','أحمد بن علي العجمي']
];
const p3 = n=>String(n).padStart(3, '0');
M.audioURL = (s, a, rec)=>`https://everyayah.com/data/${rec || M.cfg.reciter}/${p3(s)}${p3(a)}.mp3`;

/* ---- user Quran data (bookmarks, highlights, notes, progress) ---- */
M.QD = {
  get bookmarks(){ return M.store.get('bookmarks', []); },
  set bookmarks(v){ M.store.set('bookmarks', v); },
  get highlights(){ return M.store.get('highlights', {}); },
  set highlights(v){ M.store.set('highlights', v); },
  get notes(){ return M.store.get('notes', {}); },
  set notes(v){ M.store.set('notes', v); },
  get last(){ return M.store.get('lastRead', {page:1, sura:1, ayah:1}); },
  set last(v){ M.store.set('lastRead', v); },
  get pagesRead(){ return M.store.get('pagesRead', {}); },
  set pagesRead(v){ M.store.set('pagesRead', v); }
};
M.HL_COLORS = [['#ffd54f','أصفر'],['#81c784','أخضر'],['#64b5f6','أزرق'],['#f48fb1','وردي'],['#ffb74d','برتقالي'],['#ba68c8','بنفسجي']];
})();
