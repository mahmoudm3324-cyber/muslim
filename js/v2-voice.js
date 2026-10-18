/* ===== Voice: counting adhkar by voice, and a speech-recognition wrapper for reciting the Quran =====
   Counting works offline and needs no speech engine: the microphone level is watched and every spoken phrase followed by a short
   pause counts once (the floor follows the room's noise, so a fan or traffic does not count). Nothing is recorded or stored.
   M.speech wraps the Android SpeechRecognizer (window.onSpeech events) or the browser's webkitSpeechRecognition. */
(function(){
'use strict';
const M = window.M, h = M.h;

/* ---------------------------------------------------------------- counting by voice ---------------------------------------------------------------- */
const VC = {on:false};
const SPEEDS = {slow:420, normal:300, fast:190};   // the pause (ms) that ends one phrase
M.voiceSupported = ()=>!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext));

async function vcStart(opts){
  vcStop();
  const stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true}});
  const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
  try{ if(ctx.state === 'suspended') await ctx.resume(); }catch(e){}
  const src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0; src.connect(an);
  const buf = new Float32Array(an.fftSize), DT = 30;
  let floor = -55, speaking = false, above = 0, below = 0, segMs = 0, mute = 0, warm = 600;
  const timer = setInterval(()=>{
    an.getFloatTimeDomainData(buf);
    let s = 0; for(let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    const db = 10 * Math.log10(s / buf.length + 1e-10);
    // the noise floor: follows quiet moments quickly, loud moments very slowly (and not while someone speaks)
    if(db < floor) floor += (db - floor) * 0.25; else if(!speaking) floor += (db - floor) * 0.004;
    floor = Math.max(-85, Math.min(-28, floor));
    const sens = +M.cfg.vcSens || 12, thr = floor + sens, gap = SPEEDS[M.cfg.vcSpeed] || SPEEDS.normal;
    if(opts.onLevel) opts.onLevel(Math.max(0, Math.min(1, (db - floor) / (sens * 2.2))), speaking);
    if(warm > 0){ warm -= DT; return; }             // first moments: learn the room
    if(mute > 0){ mute -= DT; return; }             // ignore the app's own click / beep right after a count
    if(db > thr){ above += DT; below = 0; if(!speaking && above >= 90){ speaking = true; segMs = above; } else if(speaking) segMs += DT; }
    else {
      above = 0;
      if(speaking){ below += DT; segMs += DT;
        if(db < thr - 2 && below >= gap){ speaking = false; const dur = segMs - below; below = 0; if(dur >= 200){ mute = 160; opts.onCount && opts.onCount(); } } }
    }
  }, DT);
  VC.stop = ()=>{ clearInterval(timer); try{ stream.getTracks().forEach(t=>t.stop()); }catch(e){} try{ ctx.close(); }catch(e){} };
  VC.on = true;
}
function vcStop(){ if(VC.stop){ try{ VC.stop(); }catch(e){} } VC.stop = null; VC.on = false; }
M.voiceCountStop = vcStop;

/* how many times a phrase was said in a stretch of recognised words (tolerates a dropped or misheard word in long adhkar) */
M.countPhrase = function(words, phrase){
  const P = M.arWords(phrase).slice(0, 8); if(!P.length) return 0;
  const need = P.length <= 2 ? P.length : Math.ceil(P.length * 0.7);
  let c = 0, i = 0;
  while(i < words.length){
    let k = M.arSame(words[i], P[0]) ? 0 : (P.length > 2 && M.arSame(words[i], P[1]) ? 1 : -1);
    if(k < 0){ i++; continue; }
    let j = i, hit = 0, skips = 0;
    while(j < words.length && k < P.length && skips <= 2){
      if(M.arSame(words[j], P[k])){ hit++; j++; k++; }
      else if(k + 1 < P.length && M.arSame(words[j], P[k + 1])){ k++; skips++; }
      else { j++; skips++; }
    }
    if(hit >= need){ c++; i = j; } else i++;
  }
  return c;
};

/* A bar with a mic switch, a level meter and its settings. onCount() is called once per dhikr.
   o.phrase(): the dhikr being counted. With a speech recogniser the bar counts only that dhikr (other talk and noise are ignored);
   without one (or by choice) it counts every spoken phrase. The element survives redraws; the mic stops once it leaves the page. */
M.voiceBar = function(onCount, o){
  o = o || {};
  const meter = h('i'), lvl = h('div.vc-lvl', meter), st = h('span.vc-st', 'العدّ بصوتك'), sub = h('span.vc-sub');
  const btn = h('button.vc-btn', {'aria-label':'العدّ بالصوت', 'aria-pressed':'false'}, M.ic('mic'));
  const opts = h('div.vc-opts');
  const bar = h('div.vc-bar', h('div.vc-row', btn, h('div.grow', st, sub, lvl), h('button.icon-btn.vc-more', {'aria-label':'إعدادات العدّ بالصوت', onclick:()=>{ opts.classList.toggle('on'); }}, M.ic('settings'))), opts);
  const sysOk = ()=>!!(M.speech && M.speech.available()), appOk = ()=>!!(M.qasr && M.qasr.supported());
  const canSpeech = ()=>!!(o.phrase && (sysOk() || appOk()));
  // which recogniser: the app's own (no system service, no beep) unless the phone's was chosen
  const engine = ()=>M.cfg.vcEng === 'system' && sysOk() ? 'system' : appOk() ? 'app' : 'system';
  const smart = ()=>canSpeech() && M.cfg.vcMode !== 'vad';
  const target = ()=>{ try{ return o.phrase ? String(o.phrase() || '') : ''; }catch(e){ return ''; } };
  const short = t=>{ t = String(t).replace(/[ً-ٰٟ]/g, ''); return t.length > 26 ? t.slice(0, 24)+'…' : t; };
  const drawOpts = ()=>{ opts.replaceChildren(...[
    canSpeech() ? h('div.small.muted', 'طريقة العدّ') : null,
    canSpeech() ? M.seg([['speech', 'الذكر نفسه فقط'], ['vad', 'كل عبارة']], smart() ? 'speech' : 'vad', v=>{ M.save('vcMode', v); drawOpts(); if(on){ stop(); btn.click(); } else hintTxt(); }) : null,
    smart() && appOk() && sysOk() ? h('div.small.muted', 'المعرّف') : null,
    smart() && appOk() && sysOk() ? M.seg([['app', 'داخل التطبيق'], ['system', 'خدمة الهاتف']], engine(), v=>{ M.save('vcEng', v); drawOpts(); if(on){ stop(); btn.click(); } }) : null,
    smart() ? h('div.small.muted', 'دقة المطابقة') : null,
    smart() ? M.seg([['strict', 'صارمة'], ['normal', 'متوازنة'], ['loose', 'متسامحة']], M.cfg.vcTol || 'normal', v=>M.save('vcTol', v)) : null,
    smart() && engine() === 'app' ? h('div.small.muted', 'حساسية الميكروفون') : null,
    smart() && engine() === 'app' ? M.seg([['low', 'منخفضة'], ['normal', 'متوسطة'], ['high', 'عالية']], M.cfg.qaSens || 'normal', v=>M.save('qaSens', v)) : null,
    smart() && engine() === 'system' && window.Android && window.Android.speechSilent ? h('label.row-flex.gap-s.small', {style:'align-items:center'}, h('input', {type:'checkbox', checked:M.cfg.micBeep !== true, onchange:e=>{ M.save('micBeep', !e.target.checked); try{ window.Android.speechSilent(!!e.target.checked); }catch(er){} }}), h('span', 'كتم نغمة الميكروفون')) : null,
    smart() ? null : h('div.small.muted', 'سرعة الذكر'), smart() ? null : M.seg([['slow', 'متأنٍّ'], ['normal', 'عادي'], ['fast', 'سريع']], M.cfg.vcSpeed || 'normal', v=>M.save('vcSpeed', v)),
    smart() ? null : h('div.small.muted', 'الحساسية'), smart() ? null : M.seg([['18', 'منخفضة'], ['12', 'متوسطة'], ['8', 'عالية']], String(M.cfg.vcSens || 12), v=>M.save('vcSens', +v)),
    h('div.tiny.muted', {style:'line-height:1.8'}, smart() ? (engine() === 'app' ? 'يتعرّف على كلماتك بمعرّف داخل التطبيق ويعدّ الذكر المختار فقط بعد كل وقفة قصيرة؛ لا يستخدم خدمة الهاتف ولا يُسجَّل صوتك.' : 'يتعرّف على كلماتك بخدمة الهاتف ويعدّ الذكر المختار فقط؛ يعمل دون إنترنت إذا ثبّتّ العربية فيها.') : 'انطق الذكر ثم اسكت لحظة قصيرة؛ تُعدّ كل عبارة مرة واحدة. لا يُسجَّل صوتك. في مكان صاخب اختر حساسية منخفضة.')].filter(Boolean)); };
  const hintTxt = ()=>{ if(smart()) sub.replaceChildren(h('span', on ? 'يسمع فقط:' : 'يعدّ فقط:'), ' ', h('b', {'data-noi18n':''}, short(target()))); else sub.textContent = on ? 'يعدّ كل عبارة تنطقها' : 'انطق الذكر ويُعدّ وحده'; };
  drawOpts();
  let on = false, watch = null, mode = '', sess = 0, past = [];
  const set = v=>{ on = v; bar.classList.toggle('on', v); btn.setAttribute('aria-pressed', v ? 'true' : 'false'); st.textContent = v ? 'أستمع…' : 'العدّ بصوتك'; hintTxt(); if(!v){ meter.style.width = '0'; } };
  const hit = ()=>{ bar.classList.remove('hit'); void bar.offsetWidth; bar.classList.add('hit'); onCount(); };
  const stop = ()=>{ if(mode === 'speech'){ try{ M.speech.stop(); }catch(e){} } else if(mode === 'app'){ try{ M.qasr.stop(true); }catch(e){} } else vcStop(); mode = ''; set(false); clearInterval(watch); if(M.keepAwake && !M.cfg.keepAwake) M.keepAwake(false); };
  btn.onclick = async()=>{
    if(on){ stop(); return; }
    if(smart() && engine() === 'app'){
      const ok = await M.qasr.prepare({system:sysOk()}); if(!ok) return;
      if(ok === 'system'){ M.save('vcEng', 'system'); drawOpts(); btn.click(); return; }
      mode = 'app'; sess = 0; past = []; set(true); st.textContent = M.qasr.isReady() ? 'جارٍ تشغيل الميكروفون…' : 'جارٍ تجهيز المعرّف…';
      M.qasr.listen(ev=>{
        if(mode !== 'app') return;
        if(ev.type === 'ready'){ st.textContent = 'أستمع…'; return; }
        if(ev.type === 'level'){ meter.style.width = Math.max(0, Math.min(100, (+ev.text) * 9))+'%'; return; }
        if(ev.type === 'busy'){ bar.classList.toggle('busy', !!ev.text); return; }
        if(ev.type === 'error'){ stop(); M.toast(ev.text === 'permission' ? 'لم يُسمح باستخدام الميكروفون' : ev.text === 'model' ? 'تعذّر تجهيز المعرّف — أعد المحاولة' : 'تعذّر التعرّف على الكلام — جرّب «كل عبارة»'); return; }
        if(ev.type !== 'partial' && ev.type !== 'final') return;
        // a dhikr may be split by a breath into two stretches: count over the words heard so far, not stretch by stretch
        const words = past.concat(M.arWords(ev.text || '')), n = M.countPhrase(words, target());
        for(let k = sess; k < n; k++) hit();
        sess = Math.max(sess, n);
        if(ev.type === 'final'){ past = words; if(past.length > 40){ const keep = past.slice(-14); sess = Math.max(0, sess - (M.countPhrase(past, target()) - M.countPhrase(keep, target()))); past = keep; } }
      }, {keepRepeats:true, onProgress:f=>{ if(mode === 'app' && f < 1) st.textContent = 'تنزيل المعرّف… '+M.n(Math.round(f * 100))+'٪'; }});
    } else if(smart()){
      mode = 'speech'; sess = 0; set(true); st.textContent = 'جارٍ تشغيل الميكروفون…';
      try{ window.Android && window.Android.speechSilent && window.Android.speechSilent(M.cfg.micBeep !== true); }catch(e){}
      M.speech.start('ar-SA', ev=>{
        if(mode !== 'speech') return;
        if(ev.type === 'ready'){ st.textContent = 'أستمع…'; return; }
        if(ev.type === 'level'){ meter.style.width = Math.max(0, Math.min(100, (+ev.text + 2) * 9))+'%'; return; }
        if(ev.type === 'error'){ stop(); M.toast(ev.text === 'permission' ? 'لم يُسمح باستخدام الميكروفون' : ev.text === 'network' ? 'خدمة التعرّف تحتاج إنترنت أو حزمة العربية دون اتصال' : 'تعذّر التعرّف على الكلام — جرّب «كل عبارة»'); return; }
        if(ev.type !== 'partial' && ev.type !== 'final') return;
        const n = Math.max(0, ...M.speechReadings(ev).map(t=>M.countPhrase(M.arWords(t), target())));
        for(let k = sess; k < n; k++) hit();
        sess = Math.max(sess, n);
        if(ev.type === 'final') sess = 0;
      });
    } else {
      if(!M.voiceSupported()){ M.toast('العدّ بالصوت غير متاح على هذا الجهاز'); return; }
      st.textContent = 'جارٍ تشغيل الميكروفون…';
      try{
        await vcStart({onCount:hit, onLevel:(l, sp)=>{ meter.style.width = Math.round(l * 100)+'%'; meter.classList.toggle('sp', sp); }});
        mode = 'vad'; set(true);
      }catch(e){ set(false); M.toast(e && e.name === 'NotAllowedError' ? 'لم يُسمح باستخدام الميكروفون' : 'تعذّر تشغيل الميكروفون'); return; }
    }
    if(M.keepAwake) M.keepAwake(true);
    clearInterval(watch); watch = setInterval(()=>{ if(!bar.isConnected){ setTimeout(()=>{ if(!bar.isConnected) stop(); }, 800); } }, 700);
  };
  bar.stop = stop; bar.refresh = ()=>{ hintTxt(); };
  if(o.autostart) setTimeout(()=>btn.click(), 50);
  hintTxt();
  return bar;
};
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && VC.on){ vcStop(); document.querySelectorAll('.vc-bar.on').forEach(b=>b.stop && b.stop()); } });

/* ---------------------------------------------------------------- speech recognition ---------------------------------------------------------------- */
const A = ()=>window.Android;
let handler = null, web = null;
window.onSpeech = ev=>{ try{ if(ev && ev.extra && !ev.alts){ try{ ev.alts = JSON.parse(ev.extra); }catch(e){} } handler && handler(ev); }catch(e){} };
/* every reading the recogniser offered: the best one is chosen by what fits the expected words */
M.speechReadings = ev=>[ev.text || ''].concat(Array.isArray(ev.alts) ? ev.alts : []).filter(Boolean);
M.speech = {
  available(){ try{ if(A() && A().speechAvailable) return !!A().speechAvailable(); }catch(e){} return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
  start(lang, fn){
    handler = fn;
    if(A() && A().speechStart){ A().speechStart(lang || 'ar-SA'); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if(!SR){ fn({type:'error', text:'unavailable'}); return; }
    let alive = true;
    const go = ()=>{
      web = new SR(); web.lang = lang || 'ar-SA'; web.continuous = true; web.interimResults = true; web.maxAlternatives = 3;
      web.onresult = e=>{ let fin = '', part = '', fa = [], pa = [];
        for(let i = e.resultIndex; i < e.results.length; i++){ const R = e.results[i], t = R[0].transcript, alt = []; for(let k = 1; k < R.length && k < 4; k++) alt.push(R[k].transcript); if(R.isFinal){ fin += t + ' '; if(alt.length) fa = alt; } else { part += t + ' '; if(alt.length) pa = alt; } }
        if(fin) fn({type:'final', text:fin.trim(), alts:e.results.length - e.resultIndex === 1 ? fa : []}); if(part) fn({type:'partial', text:part.trim(), alts:e.results.length - e.resultIndex === 1 ? pa : []}); };
      web.onerror = e=>{ if(e.error === 'not-allowed' || e.error === 'service-not-allowed'){ alive = false; fn({type:'error', text:'permission'}); } else if(e.error === 'network'){ alive = false; fn({type:'error', text:'network'}); } };
      web.onend = ()=>{ if(alive && handler === fn) setTimeout(go, 150); else fn({type:'end'}); };
      web.onstart = ()=>fn({type:'ready'});
      try{ web.start(); }catch(e){}
    };
    web = null; go();
    M.speech._stopWeb = ()=>{ alive = false; try{ web && web.stop(); }catch(e){} };
  },
  stop(){ const fn = handler; handler = null; try{ if(A() && A().speechStop) A().speechStop(); }catch(e){} try{ M.speech._stopWeb && M.speech._stopWeb(); }catch(e){} if(fn) setTimeout(()=>fn({type:'end'}), 0); }
};

/* ---------------------------------------------------------------- Arabic text matching ---------------------------------------------------------------- */
const HAR = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
M.arNorm = s=>String(s || '').replace(/ٱ/g, 'ا').replace(HAR, '').replace(/[أإآٲٳ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[^ء-ي\s]/g, ' ').replace(/\s+/g, ' ').trim();
M.arWords = s=>M.arNorm(s).split(' ').filter(Boolean);
function lev(a, b){ const m = a.length, n = b.length; if(!m) return n; if(!n) return m; let p = Array.from({length:n + 1}, (_, j)=>j); for(let i = 1; i <= m; i++){ const c = [i]; for(let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
/* similar enough: tolerates the Uthmani spellings (الصلوة / الصلاة) and small recognition slips */
/* how close is close enough (settings → دقة المطابقة): strict, balanced, lenient */
const TOL = {strict:[0.84, 0.8], normal:[0.7, 0.66], loose:[0.6, 0.55]};
M.arSame = (a, b)=>{ if(a === b) return true; const x = a.replace(/^(و|ف)/, ''), y = b.replace(/^(و|ف)/, ''); if(x === y) return true; const L = Math.max(x.length, y.length); if(L <= 2) return false; const t = TOL[M.cfg && M.cfg.vcTol] || TOL.normal; return 1 - lev(x, y) / L >= (L <= 4 ? t[0] : t[1]); };
})();
