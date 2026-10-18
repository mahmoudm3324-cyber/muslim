/* ===== المعرّف القرآني: the app's own speech recogniser for reciting the Quran =====
   It never uses the phone's speech service: the microphone is read by the page, the recitation is cut at its pauses,
   and each stretch is recognised in a background worker by a model trained on Quran recitation
   (Tarteel's whisper-tiny-ar-quran, Apache-2.0, int8). On Android the model ships inside the app; elsewhere it is
   downloaded once (about 105 MB) and kept for use without internet.
   Events (same shape as M.speech): ready, level (text = dB above the floor), partial, final, busy, error, end. */
(function(){
'use strict';
const M = window.M;
const LOCAL = 'asr/';                                                                   // inside the Android app
const ORT_CDN = window.__qasrOrt || 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';
const GH = window.__qasrModel || 'https://raw.githubusercontent.com/AbedKarmi/imamassistant-models/main/';   // the same model, published for the web (tests point both elsewhere)
const REMOTE = {enc:GH + 'quran-encoder.int8.onnx', dec:GH + 'quran-decoder.int8.onnx', tok:GH + 'quran-tokens.txt'};
const CACHE = 'qasr-v1', REMOTE_MB = 105;
const NON_SPEECH = [1,2,7,8,9,10,14,25,26,27,28,29,31,58,59,60,61,62,63,90,91,92,93,359,503,522,542,873,893,902,918,922,931,1350,1853,1982,2460,2627,3246,3253,3268,3536,3846,3961,4183,4667,6585,6647,7273,9061,9383,10428,10929,11938,12033,12331,12562,13793,14157,14635,15265,15618,16553,16604,18362,18956,20075,21675,22520,26130,26161,26435,28279,29464,31650,32302,32470,36865,42863,47425,49870,50254];

let local = null, worker = null, ready = null, seq = 0;
const waiting = {};
async function hasLocal(){
  if(local !== null) return local;
  try{ const r = await fetch(LOCAL + 'model.json', {cache:'no-store'}); local = r.ok ? await r.json() : false; }catch(e){ local = false; }
  return local;
}
async function cached(url){ try{ if(!window.caches) return null; const c = await caches.open(CACHE); return await c.match(url); }catch(e){ return null; } }
/* fetch with progress. A download to keep is streamed into the cache (to disk) and read back once,
   so a 90 MB file never sits in memory more than once */
async function grab(url, keep, onBytes){
  const hit = keep ? await cached(url) : null;
  if(hit){ const b = await hit.arrayBuffer(); onBytes && onBytes(b.byteLength, true); return b; }
  const r = await fetch(url); if(!r.ok) throw new Error('http ' + r.status);
  const counted = r.body && r.body.getReader && window.ReadableStream ? new Response(new ReadableStream({
    start(ctl){ const rd = r.body.getReader(); (function pump(){ rd.read().then(({done, value})=>{ if(done){ ctl.close(); return; } onBytes && onBytes(value.length); ctl.enqueue(value); pump(); }, e=>ctl.error(e)); })(); }
  }), {headers:{'Content-Type':'application/octet-stream'}}) : r;
  if(keep && window.caches){
    try{ const c = await caches.open(CACHE); await c.put(url, counted); const back = await c.match(url); if(back) return await back.arrayBuffer(); }catch(e){ throw e; }
  }
  return await counted.arrayBuffer();
}
function call(msg, transfer){
  return new Promise((res, rej)=>{ const id = ++seq; waiting[id] = {res, rej}; msg.id = id; worker.postMessage(msg, transfer || []); });
}

const Q = M.qasr = {
  /* where the model is: 'app' (bundled), 'saved' (downloaded before), or 'download' (needs one download) */
  async where(){ if(await hasLocal()) return 'app'; return (await cached(REMOTE.dec)) ? 'saved' : 'download'; },
  downloadMB: REMOTE_MB,
  supported(){ return !!(window.Worker && window.WebAssembly && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext)); },
  isReady(){ return !!(ready && ready.done); },
  /* load the model once per session; onProgress(fraction) while downloading */
  load(onProgress){
    if(ready) return ready;
    ready = (async()=>{
      const loc = await hasLocal();
      const base = loc ? new URL(LOCAL, location.href).href : ORT_CDN;
      const src = loc ? {enc:LOCAL + loc.enc, dec:LOCAL + loc.dec, tok:LOCAL + loc.vocab} : REMOTE;
      const total = loc ? 1 : REMOTE_MB * 1048576; let got = 0;
      const tick = (n, fromCache)=>{ if(fromCache) return; got += n; onProgress && onProgress(Math.min(0.99, got / total)); };
      const [enc, dec, tok] = await Promise.all([grab(src.enc, !loc, tick), grab(src.dec, !loc, tick), grab(src.tok, !loc, tick).then(b=>new TextDecoder().decode(b))]);
      worker = new Worker('js/qasr-worker.js');
      worker.onmessage = ev=>{ const d = ev.data, w = waiting[d.id]; if(!w) return; delete waiting[d.id]; d.ok ? w.res(d) : w.rej(new Error(d.error)); };
      worker.onerror = ev=>{ Object.keys(waiting).forEach(k=>{ waiting[k].rej(new Error(ev.message || 'worker')); delete waiting[k]; }); };
      await call(Object.assign({cmd:'init', ortBase:base, ortUrl:base + 'ort.wasm.min.js', enc, dec, nonSpeech:NON_SPEECH, patched:!!(loc && loc.spec)}, loc ? {vocab:tok} : {tokens:tok}), [enc, dec]);
      onProgress && onProgress(1);
      ready.done = true;
    })();
    ready.catch(()=>{ ready = null; try{ worker && worker.terminate(); }catch(e){} worker = null; });
    return ready;
  },
  /* recognise one stretch of 16 kHz samples */
  recognise(pcm, o){
    let hint = ''; try{ hint = o && o.hint ? (o.hint() || '') : ''; }catch(e){}
    const msg = {cmd:'run', pcm, keepRepeats:!!(o && o.keepRepeats), hint};
    const p = call(msg, []); p.rid = msg.id; return p;
  },
  /* a quick look that is no longer wanted (the reciter paused): stop it between two words */
  cancel(p){ try{ if(p && p.rid && worker) worker.postMessage({cmd:'cancel', target:p.rid}); }catch(e){} },
  listen: null, stop: null
};

/* before first use where the model must be downloaded: ask once. Resolves true to go on, 'system' to use the phone's service instead, false to cancel */
Q.prepare = async function(o){
  o = o || {};
  if(Q.isReady() || await Q.where() !== 'download') return true;
  return new Promise(res=>{ let sh, done = false; const fin = v=>{ if(done) return; done = true; res(v); try{ sh.close(); }catch(e){} };
    sh = M.sheet({title:'المعرّف القرآني', onClose:()=>fin(false), content:M.h('div.col-flex',
      M.h('div.small', {style:'line-height:1.9'}, 'يستمع التطبيق لصوتك بمعرّف خاص بالقرآن والأذكار يعمل داخل التطبيق دون خدمة الهاتف ودون نغمة الميكروفون. يُنزَّل مرة واحدة (نحو '+M.n(REMOTE_MB)+' م.ب) ثم يعمل دون إنترنت.'),
      M.h('button.btn.block', {onclick:()=>fin(true)}, M.ic('download'), 'تنزيل والبدء'),
      o.system ? M.h('button.btn.tonal.block', {onclick:()=>fin('system')}, 'استخدم خدمة الهاتف بدلًا منه') : null)}); });
};

/* ---------------- the microphone and the pauses ---------------- */
// a guess the model itself doubts (breath, a cough, the room) is dropped
const heard = r=>!!(r && r.text && r.avgLp > -1 && !(r.noSpeech > 0.6 && r.avgLp < -0.3));
let L = null;   // the live session
Q.listen = async function(fn, o){
  o = o || {};
  Q.stop(true);
  const sess = L = {fn, on:true};
  const emit = ev=>{ if(L === sess) try{ fn(ev); }catch(e){} };
  if(!Q.supported()){ emit({type:'error', text:'unavailable'}); return; }
  try{ await Q.load(o.onProgress); }catch(e){ try{ console.warn('qasr load', e); }catch(e2){} emit({type:'error', text:'model', detail:String(e && e.message || e)}); return; }
  if(L !== sess) return;
  let stream;
  try{ stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true, channelCount:1}}); }
  catch(e){ emit({type:'error', text:'permission'}); return; }
  if(L !== sess){ stream.getTracks().forEach(t=>t.stop()); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx; try{ ctx = new AC({sampleRate:16000}); }catch(e){ ctx = new AC(); }
  try{ if(ctx.state === 'suspended') await ctx.resume(); }catch(e){}
  const rate = ctx.sampleRate, src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1), sink = ctx.createGain();
  sink.gain.value = 0; src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
  const down = rate === 16000 ? null : rate / 16000;
  // the recitation so far: chunks of 16 kHz samples, 30 ms frames for the level
  const FR = 480; let carry = new Float32Array(0), seg = [], segLen = 0, pre = [], preLen = 0;
  let partialP = null, floor = -60, peak = -90, speaking = false, quiet = 0, voiced = 0, warm = 12, busy = false, pendFinal = [], lastPartial = 0, quietest = {v:1, at:0};
  const sens = ()=>({low:12, normal:9, high:6})[M.cfg.qaSens || 'normal'] || 9;
  // counting a dhikr: short stretches (the model writes a phrase said many times in one breath only once)
  const PAUSE = ()=>o.keepRepeats ? 420 : (({short:450, normal:520, long:950})[M.cfg.qaPause || 'normal'] || 650);
  const MAXS = 16000 * (o.keepRepeats ? 6 : 14), MINCUT = 16000 * (o.keepRepeats ? 3 : 8);
  const cat = (arr, n)=>{ const u = new Float32Array(n); let o = 0; arr.forEach(a=>{ u.set(a, o); o += a.length; }); return u; };
  async function pump(){
    if(busy || L !== sess) return;
    const job = pendFinal.shift();
    if(job){ busy = true; emit({type:'busy', text:'1'});
      try{ const r = await Q.recognise(job, o); if(heard(r)) emit({type:'final', text:r.text, stats:r}); }catch(e){ emit({type:'error', text:'model', detail:String(e.message || e)}); }
      busy = false; emit({type:'busy', text:''}); pump(); return; }
    // while one keeps reciting: a quick look at the stretch so far, so the words light up before the pause
    if(speaking && segLen > 16000 * 1.0 && Date.now() - lastPartial > 1400 && o.partials !== false){
      lastPartial = Date.now(); busy = true;
      try{ const pr = Q.recognise(cat(seg, segLen), o); partialP = pr; const r = await pr; if(L === sess && speaking && !r.cancelled && heard(r)) emit({type:'partial', text:r.text}); }catch(e){}
      partialP = null; busy = false; pump();
    }
  }
  function cut(at){   // end the stretch (at: keep samples after this index for the next one)
    const all = cat(seg, segLen); seg = []; segLen = 0;
    const take = at ? all.subarray(0, at) : all;
    if(at){ const rest = all.slice(at); seg = [rest]; segLen = rest.length; }
    if(take.length > 16000 * 0.45){ pendFinal.push(take.slice(0)); if(partialP) Q.cancel(partialP); }
    pump();
  }
  function frame(f){
    let s = 0; for(let i = 0; i < f.length; i++) s += f[i] * f[i];
    const db = 10 * Math.log10(s / f.length + 1e-10);
    if(warm > 0){ warm--; floor = floor === -60 ? db : floor + (db - floor) * 0.3; pre.push(f); preLen += f.length; if(pre.length > 12){ preLen -= pre.shift().length; } return; }
    if(db < floor) floor += (db - floor) * 0.2; else if(!speaking) floor += (db - floor) * 0.01;
    floor = Math.max(-90, Math.min(-30, floor));
    const thr = floor + sens(); emit({type:'level', text:String(((db - floor) / 3).toFixed(1))});
    if(!speaking){
      pre.push(f); preLen += f.length; if(pre.length > 12) preLen -= pre.shift().length;   // keep ~0.36 s before the voice starts
      if(db > thr){ voiced++; if(voiced >= 3){ speaking = true; quiet = 0; seg = pre.slice(); segLen = preLen; pre = []; preLen = 0; quietest = {v:1e9, at:0}; peak = db; } }
      else voiced = 0;
      return;
    }
    seg.push(f); segLen += f.length;
    if(db > peak) peak = db; else peak -= 0.02;   // the voice's own loudness: a pause is a clear drop from it, even in a silent room
    if(db > Math.max(thr - 2, peak - 30)){ quiet = 0; } else { quiet += 30; }
    if(segLen > MINCUT && db < quietest.v){ quietest = {v:db, at:segLen}; }
    if(quiet >= PAUSE()){ speaking = false; voiced = 0; cut(0); return; }
    if(segLen >= MAXS){ // a long breath without a pause: cut at its quietest moment in the last seconds
      const at = quietest.at > MINCUT ? quietest.at : segLen; quietest = {v:1e9, at:0}; cut(at === segLen ? 0 : at);
    }
  }
  proc.onaudioprocess = e=>{
    if(L !== sess) return;
    let x = e.inputBuffer.getChannelData(0);
    if(down){ const n = Math.floor(x.length / down), y = new Float32Array(n); for(let i = 0; i < n; i++){ const a = i * down, j = Math.floor(a), t = a - j; y[i] = (x[j] || 0) * (1 - t) + (x[j + 1] || 0) * t; } x = y; }
    const all = new Float32Array(carry.length + x.length); all.set(carry); all.set(x, carry.length);
    let i = 0; for(; i + FR <= all.length; i += FR) frame(all.slice(i, i + FR));
    carry = all.slice(i);
    if(!busy) pump();
  };
  sess.close = (flush)=>{
    sess.on = false;
    if(flush && speaking && segLen > 16000 * 0.45){ const last = cat(seg, segLen); seg = []; segLen = 0; speaking = false;
      (async()=>{ while(busy) await new Promise(r=>setTimeout(r, 80)); try{ const r = await Q.recognise(last, o); if(heard(r)) fn({type:'final', text:r.text}); }catch(e){} fn({type:'end'}); })(); }
    try{ proc.disconnect(); src.disconnect(); }catch(e){} try{ stream.getTracks().forEach(t=>t.stop()); }catch(e){} try{ ctx.close(); }catch(e){}
    return !!flush;
  };
  emit({type:'ready'});
};
/* stop listening; with flush, what was said before the stop is still recognised (a final event, then end) */
Q.stop = function(silent, flush){ const s = L; L = null; if(!s) return; let later = false; try{ later = s.close ? s.close(flush) : false; }catch(e){} if(!silent && !later) try{ s.fn({type:'end'}); }catch(e){} };
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && L) Q.stop(); });
})();
