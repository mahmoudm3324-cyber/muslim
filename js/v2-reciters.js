/* ===== Reciters recorded one file per surah (no verse-by-verse files): Islam Sobhi =====
   The app plays verse by verse. For these reciters a verse is a slice of the surah file, cut with a media fragment
   (…/002.mp3#t=12.37,17.80) from verse timings made by QUD-Technologies/quranic-universal-audio v3.2.0 (CC BY 4.0;
   the recordings belong to the reciter and mp3quran.net). Browsers stop at the fragment's end but do not fire
   «ended», so M.segArm() turns that stop into an «ended» event for whichever <audio> plays it.
   Surahs the source does not have play in the fallback voice (Alafasy). */
(function(){
'use strict';
const M = window.M;
const p3 = n=>String(n).padStart(3, '0');
const SEG = {
  islam_sobhi:{name:'إسلام صبحي', file:'data/rec_islam_sobhi.json'}
};
const FALLBACK = 'Alafasy_128kbps';
if(M.RECITERS && !M.RECITERS.some(r=>r[0] === 'islam_sobhi')) M.RECITERS.splice(2, 0, ['islam_sobhi', 'إسلام صبحي']);
const cache = {}, loading = {};
M.isSegReciter = rec=>!!SEG[rec || (M.cfg && M.cfg.reciter)];
/* load a reciter's timings before its first verse is asked for (cheap: ~65 KB once) */
M.recReady = function(rec){
  rec = rec || (M.cfg && M.cfg.reciter);
  if(!SEG[rec] || cache[rec]) return Promise.resolve(true);
  if(!loading[rec]) loading[rec] = fetch(SEG[rec].file).then(r=>r.json()).then(j=>{ cache[rec] = j; return true; }).catch(()=>{ delete loading[rec]; return false; });
  return loading[rec];
};
/* the [start, end] of a verse in seconds, or null */
M.segOf = function(s, a, rec){
  const d = cache[rec]; if(!d) return null;
  const t = d.t[s]; if(!t || 2 * a > t.length) return null;
  const k = d.unit === 'cs' ? 100 : 1000, st = t[2 * a - 2], en = t[2 * a - 1];
  return en > st ? [st / k, en / k] : null;
};
M.segFileURL = (s, rec)=>{ const d = cache[rec]; return d ? d.u + p3(s) + '.mp3' : ''; };
const missed = {};
const prev = M.audioURL;
M.audioURL = function(s, a, rec){
  rec = rec || (M.cfg && M.cfg.reciter);
  if(!SEG[rec]) return prev(s, a, rec);
  const t = M.segOf(s, a, rec);
  if(!t){
    if(cache[rec] && !missed[s] && M.toast && M.sname){ missed[s] = 1; setTimeout(()=>M.toast('سورة '+M.sname(s)+' غير متوفرة بصوت '+SEG[rec].name+' — تُتلى بصوت مشاري العفاسي'), 300); }
    else if(!cache[rec]) M.recReady(rec);
    return prev(s, a, FALLBACK);
  }
  return M.segFileURL(s, rec) + '#t=' + t[0].toFixed(2) + ',' + t[1].toFixed(2);
};
M.segReciters = Object.keys(SEG);

/* an <audio> that plays verse slices: stop at the slice's end and say «ended» (once per load) */
const RX = /#t=([\d.]+),([\d.]+)$/;
M.segArm = function(el){
  if(!el || el.__segArmed) return el; el.__segArmed = true;
  let done = false;
  const chk = ()=>{
    const m = RX.exec(el.currentSrc || el.src || ''); if(!m || done) return;
    if(el.currentTime >= +m[2] - 0.05){ done = true; try{ if(!el.paused) el.pause(); }catch(e){} el.dispatchEvent(new Event('ended')); }
  };
  el.addEventListener('loadstart', ()=>{ done = false; });
  el.addEventListener('timeupdate', chk);
  el.addEventListener('pause', chk);
  return el;
};
/* repeat the current verse: back to the slice's start, not the file's */
M.audioPos = function(el){
  const m = RX.exec(el.currentSrc || el.src || '');
  if(m){ const a = +m[1], b = +m[2]; return {t:Math.max(0, Math.min(b - a, el.currentTime - a)), d:b - a}; }
  return {t:el.currentTime, d:el.duration};
};
M.segRestart = function(el){
  const m = RX.exec(el.currentSrc || el.src || '');
  if(m){ const src = el.src; el.src = src; } else el.currentTime = 0;   // reloading re-applies the fragment (and clears «done»)
};
if(M.cfg && SEG[M.cfg.reciter]) setTimeout(()=>M.recReady(), 1500);
try{ M.on && M.on('settings', ()=>{ if(SEG[M.cfg.reciter]) M.recReady(); }); }catch(e){}
})();
