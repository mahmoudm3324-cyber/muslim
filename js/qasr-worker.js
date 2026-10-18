/* ===== The app's own Quran recogniser (runs in this worker, never on the system's speech service) =====
   Model: Tarteel's Whisper-tiny fine-tuned on Quran recitation (tarteel-ai/whisper-tiny-ar-quran, Apache-2.0),
   in the sherpa-onnx int8 export; run with ONNX Runtime Web (WebAssembly, one thread).
   In: 16 kHz mono samples of one stretch of recitation. Out: the recognised text (with diacritics). */
'use strict';
let enc = null, dec = null, vocab = null;
const SOT = 50258, AR = 50272, TRANSCRIBE = 50359, NO_TS = 50363, EOT = 50257, NO_SPEECH = 50362;
const N_FFT = 400, HOP = 160, FRAMES = 3000, NMEL = 80;

/* the 80 Slaney mel filters of Whisper, built once */
let FB = null, WIN = null;
function setupMel(){
  const hz2mel = f=>f >= 1000 ? 15 + Math.log(f / 1000) / (Math.log(6.4) / 27) : 3 * f / 200;
  const mel2hz = m=>m >= 15 ? 1000 * Math.exp((Math.log(6.4) / 27) * (m - 15)) : 200 * m / 3;
  const nb = N_FFT / 2 + 1, top = hz2mel(8000), pts = [];
  for(let i = 0; i < NMEL + 2; i++) pts.push(mel2hz(top * i / (NMEL + 1)));
  FB = [];
  for(let m = 0; m < NMEL; m++){
    const row = new Float32Array(nb), lo = pts[m], c = pts[m + 1], hi = pts[m + 2], norm = 2 / (hi - lo);
    for(let k = 0; k < nb; k++){ const f = k * 8000 / (nb - 1); const v = Math.max(0, Math.min((f - lo) / (c - lo), (hi - f) / (hi - c))); row[k] = v * norm; }
    let a = 0; while(a < nb && !row[a]) a++; let b = nb - 1; while(b > a && !row[b]) b--;
    FB.push({row, a, b});
  }
  WIN = new Float32Array(N_FFT); for(let n = 0; n < N_FFT; n++) WIN[n] = 0.5 - 0.5 * Math.cos(2 * Math.PI * n / N_FFT);
}
/* the 400-point spectrum as 16 × 25 (Cooley–Tukey in two small DFT stages): about 4× fewer multiplications than the direct sum */
const A1 = 16, A2 = 25;
let C25 = null, S25 = null, TWC = null, TWS = null, C16 = null, S16 = null;
const YR = new Float32Array(A1 * A2), YI = new Float32Array(A1 * A2);
function power(fr, pw){
  if(!C25){
    C25 = new Float32Array(A2 * A2); S25 = new Float32Array(A2 * A2); for(let k = 0; k < A2; k++) for(let n = 0; n < A2; n++){ const t = 2 * Math.PI * k * n / A2; C25[k * A2 + n] = Math.cos(t); S25[k * A2 + n] = Math.sin(t); }
    TWC = new Float32Array(A1 * A2); TWS = new Float32Array(A1 * A2); for(let a = 0; a < A1; a++) for(let k = 0; k < A2; k++){ const t = 2 * Math.PI * a * k / N_FFT; TWC[a * A2 + k] = Math.cos(t); TWS[a * A2 + k] = Math.sin(t); }
    C16 = new Float32Array(A1 * A1); S16 = new Float32Array(A1 * A1); for(let k = 0; k < A1; k++) for(let n = 0; n < A1; n++){ const t = 2 * Math.PI * k * n / A1; C16[k * A1 + n] = Math.cos(t); S16[k * A1 + n] = Math.sin(t); }
  }
  for(let a = 0; a < A1; a++){
    for(let k = 0; k < A2; k++){
      let re = 0, im = 0; const o = k * A2;
      for(let n = 0; n < A2; n++){ const v = fr[a + A1 * n]; re += v * C25[o + n]; im -= v * S25[o + n]; }
      const c = TWC[a * A2 + k], s = TWS[a * A2 + k];   // × e^{-i t}
      YR[a * A2 + k] = re * c + im * s; YI[a * A2 + k] = im * c - re * s;
    }
  }
  const nb = N_FFT / 2 + 1;
  for(let k2 = 0; k2 < A2; k2++){
    for(let k1 = 0; k2 + A2 * k1 < nb; k1++){
      let re = 0, im = 0; const o = k1 * A1;
      for(let a = 0; a < A1; a++){ const yr = YR[a * A2 + k2], yi = YI[a * A2 + k2], c = C16[o + a], s = S16[o + a]; re += yr * c + yi * s; im += yi * c - yr * s; }
      pw[k2 + A2 * k1] = re * re + im * im;
    }
  }
}
/* log-mel exactly as Whisper computes it: the clip padded with silence to 30 s, reflect-padded STFT, log10, clamp to max-8, scale */
function logMel(x, F){
  F = F || FRAMES;
  if(!FB) setupMel();
  const nb = N_FFT / 2 + 1, L = x.length, out = new Float32Array(NMEL * F);
  const at = i=>{ // the padded signal: reflect at the start, the clip, then zeros
    if(i < 0) i = -i;
    return i < L ? x[i] : 0;
  };
  const live = Math.min(F, Math.ceil((L + N_FFT / 2) / HOP) + 1), fr = new Float32Array(N_FFT), pw = new Float32Array(nb);
  let mx = -Infinity;
  for(let t = 0; t < live; t++){
    const s0 = t * HOP - N_FFT / 2;
    for(let n = 0; n < N_FFT; n++) fr[n] = at(s0 + n) * WIN[n];
    power(fr, pw);
    for(let m = 0; m < NMEL; m++){ const f = FB[m]; let s = 0; for(let k = f.a; k <= f.b; k++) s += f.row[k] * pw[k]; const v = Math.log10(Math.max(s, 1e-10)); out[m * F + t] = v; if(v > mx) mx = v; }
  }
  if(live < F && mx < -10) mx = -10;
  const floor = mx - 8;
  for(let m = 0; m < NMEL; m++) for(let t = 0; t < F; t++){ let v = t < live ? out[m * F + t] : -10; if(v < floor) v = floor; out[m * F + t] = (v + 4) / 4; }
  return out;
}

/* the vocabulary: the bundled model keeps only the Arabic pieces (the logits are then ~600 wide instead of 51,865) */
let V = 0, MAP = null, CAND = null, BLANK = -1;
const toBytes = b64=>{ let bin; try{ bin = atob(b64); }catch(e){ return null; } const u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
function setVocab(d){
  vocab = []; MAP = new Map();
  if(d.vocab){   // {ids:[original ids], bytes:[base64]}
    const v = JSON.parse(d.vocab); v.ids.forEach((id, i)=>{ MAP.set(id, i); vocab[i] = toBytes(v.bytes[i]); }); V = v.ids.length;
  } else {       // the full list: "base64 id" per line
    d.tokens.split('\n').forEach(l=>{ l = l.trim(); const sp = l.lastIndexOf(' '); if(sp < 0) return; const id = +l.slice(sp + 1); vocab[id] = toBytes(l.slice(0, sp)); MAP.set(id, id); }); V = 51865;
    for(let id = EOT; id < V; id++) if(!MAP.has(id)) MAP.set(id, id);   // the special tokens are not in the list
  }
  const sup = new Set(d.nonSpeech || []), c = [];
  MAP.forEach((i, id)=>{ if(id <= EOT && !sup.has(id) && (id === EOT || vocab[i])) c.push(i); });
  CAND = Int32Array.from(c); BLANK = MAP.has(220) ? MAP.get(220) : -1;
}
function decodeText(ids){
  const parts = []; let n = 0;
  ids.forEach(id=>{ const b = vocab[id]; if(b){ parts.push(b); n += b.length; } });
  const all = new Uint8Array(n); let o = 0; parts.forEach(p=>{ all.set(p, o); o += p.length; });
  return new TextDecoder('utf-8').decode(all).trim();
}

/* the expected words (the verses being recited) as the model's own tokens, by longest match over its vocabulary: it reproduces the model's spelling of Arabic almost exactly */
let BYSTR = null, MAXL = 0, PATCHED = false, cancelId = 0;
function tokenise(text){
  if(!BYSTR){ BYSTR = new Map(); vocab.forEach((b, i)=>{ if(b && b.length && i < V - 13) { const k = String.fromCharCode.apply(null, b); if(!BYSTR.has(k)) BYSTR.set(k, i); if(k.length > MAXL) MAXL = k.length; } }); }
  text = String(text || '').replace(/[ۖ-ۜ۟-۪ۤۧۨ-ۭـ࣓-ࣿ۞۩]/g, '').replace(/ٱ/g, 'ا').replace(/ۡ/g, 'ْ').replace(/\s+/g, ' ').trim();
  const bytes = Array.from(new TextEncoder().encode(text)), s = String.fromCharCode.apply(null, bytes), out = [];
  let p = 0; while(p < s.length){ let f = false; for(let L = Math.min(MAXL, s.length - p); L > 0; L--){ const id = BYSTR.get(s.substr(p, L)); if(id != null){ out.push(id); p += L; f = true; break; } } if(!f) return out; }  // an unknown byte ends the draft
  return out;
}

/* full: the model's whole 30 s window (most exact); otherwise the window is the clip plus 2 s, several times faster.
   hint: the words expected next. They are tried as a draft several tokens at a time (the model checks them in one pass and keeps the ones it agrees with),
   so correct recitation costs a few decoder passes instead of one per token. The result is what the model itself would have written. */
async function run(pcm, full, keepRepeats, hint, rid){
  const t0 = Date.now();
  const F = full ? FRAMES : Math.min(FRAMES, Math.max(500, Math.ceil((pcm.length / 16000 + 1) * 10) * 10));   // clip + 1 s (≥ 5 s): ~1.5× faster than + 2 s, same words in tests
  const mel = new ort.Tensor('float32', logMel(pcm, F), [1, NMEL, F]);
  const tm = Date.now();
  const e = await enc.run({mel});
  const ck = e.n_layer_cross_k, cv = e.n_layer_cross_v;
  const t1 = Date.now();
  const maxT = Math.min(220, 10 + Math.ceil(pcm.length / 16000 * 8)), K = 12;
  const draft = (PATCHED && hint) ? tokenise(hint) : [];
  const C = PATCHED ? Math.min(448, Math.ceil((4 + maxT + K + 2) / 32) * 32) : 448, sz = 4 * C * 384, eot = MAP.get(EOT), nsp = MAP.get(NO_SPEECH);
  let sk = new ort.Tensor('float32', new Float32Array(sz), [4, 1, C, 384]), sv = new ort.Tensor('float32', new Float32Array(sz), [4, 1, C, 384]);
  let pend = [SOT, AR, TRANSCRIBE, NO_TS].map(t=>MAP.get(t)), off = 0, out = [], noSpeech = 0, lp = 0, passes = 0, accepted = 0;
  let p = draft.length ? 0 : -1, misses = 0, stop = false, cancelled = false;
  const loopCut = keepRepeats ? 6 : 3;   // counting a dhikr: a phrase said many times is not a loop
  const resync = (prev, b)=>{ // find the last two tokens in the draft again
    if(!draft.length) return -1;
    for(let i = 0; i + 1 < draft.length; i++) if(draft[i] === prev && draft[i + 1] === b) return i + 2;
    return -1;
  };
  while(out.length < maxT && !stop){
    if(cancelId === rid){ cancelled = true; break; }
    const d = (p >= 0 && p < draft.length && misses < 3) ? draft.slice(p, p + K) : [];
    const inp = pend.concat(d);
    const r = await dec.run({tokens:new ort.Tensor('int64', BigInt64Array.from(inp.map(BigInt)), [1, inp.length]), in_n_layer_self_k_cache:sk, in_n_layer_self_v_cache:sv,
      n_layer_cross_k:ck, n_layer_cross_v:cv, offset:new ort.Tensor('int64', BigInt64Array.from([BigInt(off)]), [1])});
    passes++;
    const lg = r.logits.data;
    if(off === 0 && nsp != null){ // the chance that this stretch holds no speech, read right after the start token
      const row0 = (pend.length - 1) * V; let m = -Infinity; for(let i = 0; i < V; i++) if(lg[row0 + i] > m) m = lg[row0 + i];
      let s = 0; for(let i = 0; i < V; i++) s += Math.exp(lg[row0 + i] - m); noSpeech = Math.exp(lg[row0 + nsp] - m) / s;
    }
    sk = r.out_n_layer_self_k_cache; sv = r.out_n_layer_self_v_cache;
    let j = 0, lastTok = -1;
    for(;;){
      const row = (pend.length - 1 + j) * V; let best = -1, bv = -Infinity, m = -Infinity;
      for(let q = 0; q < CAND.length; q++){ const i = CAND[q], v = lg[row + i]; if(v > m) m = v; if(!out.length && !j && (i === BLANK || i === eot)) continue; if(!out.length && j && (i === BLANK || i === eot)) { /* a blank first token cannot follow a draft */ } if(v > bv){ bv = v; best = i; } }
      if(best === eot || best < 0){ stop = true; break; }
      { let s = 0; for(let q = 0; q < CAND.length; q++) s += Math.exp(lg[row + CAND[q]] - m); lp += bv - m - Math.log(s); }
      out.push(best); lastTok = best;
      const n = out.length;
      for(const k of [2, 3, 4, 5, 6]) if(n >= k * (loopCut + 1)){ let rep = true; for(let q = 0; q < k * loopCut && rep; q++) if(out[n - 1 - q] !== out[n - 1 - q - k]) rep = false; if(rep){ out.length = n - k * loopCut; stop = true; break; } }
      if(stop || out.length >= maxT) break;
      if(j < d.length && best === d[j]){ j++; accepted++; continue; }
      break;
    }
    if(stop) break;
    // the cache holds the pending tokens and the accepted draft tokens; the last token written is fed next
    off += pend.length + j; pend = [lastTok];
    if(d.length){
      if(j === 0) misses++; else misses = 0;
      if(j === d.length && p + j < draft.length && draft[p + j] === lastTok){ p += j + 1; }
      else { const prev = out.length > 1 ? out[out.length - 2] : -1; p = resync(prev, lastTok); }
    } else if(draft.length){ const prev = out.length > 1 ? out[out.length - 2] : -1; const q = resync(prev, lastTok); if(q >= 0){ p = q; misses = 0; } }
  }
  return {ids:out, text:decodeText(out), noSpeech, avgLp:out.length ? lp / out.length : 0, mel:tm - t0, enc:t1 - tm, frames:F, dec:Date.now() - t1, n:out.length, passes, accepted, cancelled};
}

self.onmessage = async ev=>{
  const d = ev.data || {};
  try{
    if(d.cmd === 'init'){
      if(!self.ort) importScripts(d.ortUrl);
      ort.env.wasm.numThreads = 1; ort.env.wasm.simd = true; ort.env.wasm.wasmPaths = d.ortBase;
      const opt = {executionProviders:['wasm'], graphOptimizationLevel:'all'};
      enc = await ort.InferenceSession.create(new Uint8Array(d.enc), opt);
      dec = await ort.InferenceSession.create(new Uint8Array(d.dec), opt);
      PATCHED = !!d.patched; setVocab(d); setupMel();
      self.postMessage({id:d.id, ok:true});
    } else if(d.cmd === 'cancel'){ cancelId = d.target;
    } else if(d.cmd === 'run'){
      const r = await run(d.pcm, d.full, d.keepRepeats, d.hint, d.id);
      self.postMessage(Object.assign({id:d.id, ok:true}, r));
    }
  }catch(e){ self.postMessage({id:d.id, ok:false, error:String(e && e.message || e)}); }
};
