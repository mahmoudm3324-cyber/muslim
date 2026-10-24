/* ===== تسميع القرآن: recite from memory, the app listens and reveals each word you say correctly =====
   Recognition: by default the app's own Quran recogniser (M.qasr: a model trained on recitation, run inside the app, no system
   speech service, no beep, offline); the phone's speech service stays available as an option where it exists.
   Matching: words are compared without diacritics and with tolerance for the Uthmani spelling; the disjoined letters
   (الٓمٓ، كٓهيعٓصٓ، حمٓ…) are matched letter by letter as they are pronounced (ألف لام ميم) or as written.
   A word only turns red once the recogniser has settled (final result), never on a passing partial guess.
   Any ayah can be heard from a teacher-style reciter to correct the reading; listening pauses while it plays. */
(function(){
'use strict';
const M = window.M, h = M.h;
const LOG = 'tasmee:log', LAST = 'tasmee:last';

/* the disjoined letters: how each is read, and the forms a recogniser may write for it */
const LETTER = {'ا':['الف','ألف','اليف'], 'ل':['لام'], 'م':['ميم','مييم'], 'ر':['را','راء','رى'], 'ك':['كاف'], 'ه':['ها','هاء','هه'], 'ي':['يا','ياء'], 'ع':['عين','عيين'],
  'ص':['صاد'], 'ط':['طا','طاء'], 'س':['سين','سيين'], 'ح':['حا','حاء'], 'ق':['قاف'], 'ن':['نون']};
const SAY = {'ا':'أَلِفْ', 'ل':'لَامْ', 'م':'مِيمْ', 'ر':'رَا', 'ك':'كَافْ', 'ه':'هَا', 'ي':'يَا', 'ع':'عَيْنْ', 'ص':'صَادْ', 'ط':'طَا', 'س':'سِينْ', 'ح':'حَا', 'ق':'قَافْ', 'ن':'نُونْ'};
/* ayahs that open with them (surah:ayah) */
const MUQ = {'2:1':1, '3:1':1, '7:1':1, '10:1':1, '11:1':1, '12:1':1, '13:1':1, '14:1':1, '15:1':1, '19:1':1, '20:1':1, '26:1':1, '27:1':1, '28:1':1, '29:1':1, '30:1':1, '31:1':1, '32:1':1,
  '36:1':1, '38:1':1, '40:1':1, '41:1':1, '42:1':1, '42:2':1, '43:1':1, '44:1':1, '45:1':1, '46:1':1, '50:1':1, '68:1':1};
const SPEEDS = [[0.75, 'أبطأ'], [1, 'عادية'], [1.25, 'أسرع']];
const TEACHER = 'Husary_128kbps';

function open(init){
  const last = M.store.get(LAST, null) || {};
  const st = Object.assign({s:67, a:1, b:5, mode:'hide', rec:TEACHER, rate:1, eng:'app'}, last, init && init.s ? {s:init.s, a:init.a || 1, b:init.b || init.a || 1} : {}, {on:false});
  let toks = [], groups = [], marks = [], base = 0, hints = 0, ended = false, tentative = null, playing = null, resumeAfter = false, flushing = false, busy = false;
  const sysOk = ()=>!!(M.speech && M.speech.available());
  const appOk = ()=>!!(M.qasr && M.qasr.supported());
  const eng = ()=>st.eng === 'system' && sysOk() ? 'system' : appOk() ? 'app' : sysOk() ? 'system' : '';
  const view = M.openView({id:'tasmee', title:'تسميع القرآن', onClose:()=>{ stop(true); stopAyah(); }, actions:[h('button.icon-btn', {'aria-label':'الإعدادات', onclick:()=>settings()}, M.ic('settings'))]});
  const b = view.body; b.classList.add('ts-body');
  b.classList.add('ts2');
  const hero = h('div.ts-hero'), quick = h('div.ts-quick'), paper = h('div.ts-paper'), live = h('div.ts-live'), result = h('div.ts-result'), hist = h('div.ts-hist'), dock = h('div.ts-dock');
  b.append(hero, paper, live, result, hist, dock);
  const audio = new Audio(); audio.preload = 'none'; if(M.segArm) M.segArm(audio); (M._audios = M._audios || []).push(audio);

  if(!eng()) b.insertBefore(h('div.card.pad.ts-na', h('div.bold', 'التسميع بالصوت غير متاح هنا'),
    h('div.small.muted', {style:'line-height:1.9;margin-top:6px'}, 'يحتاج الميكروفون ومتصفحًا حديثًا يدعم WebAssembly.')), hero);

  const N = ()=>M.Q.surahs[st.s - 1].n;
  const remember = ()=>M.store.set(LAST, {s:st.s, a:st.a, b:st.b, mode:st.mode, rec:st.rec, rate:st.rate, eng:st.eng});
  const rangeTxt = ()=>st.a === st.b ? 'الآية '+M.n(st.a) : 'الآيات '+M.n(st.a)+'–'+M.n(st.b);

  /* ---------------- header: the passage and its progress ---------------- */
  function drawHero(){
    const said = marks.filter(x=>x === 1).length, pct = toks.length ? base / toks.length : 0;
    const MODES = [['hide', 'مخفي', 'lock'], ['faint', 'باهت', 'eye'], ['show', 'ظاهر', 'text']];
    hero.replaceChildren(h('div.ts-stage',
      h('div.ts-st-top',
        h('div.grow',
          h('div.ts-hero-k', 'تسميع من الحفظ'),
          h('div.ts-hero-s.title-font', 'سورة '+M.sname(st.s)),
          h('button.ts-range', {onclick:pick, 'aria-label':'تغيير المقطع'}, h('span', rangeTxt()), M.ic('chevDown'))),
        h('div.ts-ring', M.ring ? M.ring(pct, 68, 6, h('div.ts-ring-in', h('b.num', M.n(Math.round(pct * 100))+'٪'), h('small.num', M.n(said)+'/'+M.n(toks.length)))) : null)),
      h('div.ts-modes', ...MODES.map(([v, l, ic])=>h('button.ts-mode'+(st.mode === v ? '.on' : ''), {onclick:()=>{ st.mode = v; remember(); paint(); }, 'aria-pressed':String(st.mode === v)}, M.ic(ic), h('span', l)))),
      quick));
    const len = st.b - st.a + 1;
    quick.replaceChildren(...[[1, 'آية'], [3, '٣ آيات'], [5, '٥ آيات'], [10, '١٠ آيات'], [0, 'السورة كاملة']].filter(([n])=>!n || n <= N()).map(([n, l])=>h('button.chip'+((n ? len === n : (st.a === 1 && st.b === N())) ? '.on' : ''), {onclick:()=>{ if(n){ st.b = Math.min(N(), st.a + n - 1); } else { st.a = 1; st.b = Math.min(N(), 60); } remember(); build(); }}, l)));
  }
  function pick(){
    const ss = h('select.field', {'aria-label':'السورة'}); M.Q.surahs.forEach((s, i)=>ss.append(h('option', {value:i + 1}, M.n(i + 1)+'. '+s.ar))); ss.value = st.s;
    const fa = h('select.field', {'aria-label':'من آية'}), ta = h('select.field', {'aria-label':'إلى آية'});
    const fill = ()=>{ const n = M.Q.surahs[+ss.value - 1].n; const f = Math.min(+fa.value || st.a, n); fa.replaceChildren(); ta.replaceChildren(); for(let i = 1; i <= n; i++) fa.append(h('option', {value:i}, M.n(i))); fa.value = f; for(let i = f; i <= Math.min(n, f + 59); i++) ta.append(h('option', {value:i}, M.n(i))); ta.value = Math.min(Math.max(+ta.dataset.v || st.b, f), n, f + 59); };
    fa.value = st.a; ta.dataset.v = st.b; fill();
    ss.onchange = ()=>{ fa.value = 1; ta.dataset.v = 5; fill(); }; fa.onchange = ()=>{ ta.dataset.v = ta.value; fill(); }; ta.onchange = ()=>{ ta.dataset.v = ta.value; };
    let sh; sh = M.sheet({title:'اختر المقطع', content:h('div.col-flex.ts-pick', h('label.small.muted', 'السورة'), ss, h('div.ts-row', h('div.ts-f', h('label.small.muted', 'من آية'), fa), h('div.ts-f', h('label.small.muted', 'إلى آية'), ta)),
      h('button.btn.block', {onclick:()=>{ st.s = +ss.value; st.a = +fa.value; st.b = +ta.value; remember(); sh.close(); build(); }}, 'ابدأ هذا المقطع'))});
  }
  function settings(){
    const recSel = h('select.field', {'aria-label':'القارئ', onchange:e=>{ st.rec = e.target.value; remember(); }}); (M.RECITERS || []).forEach(([id, n])=>recSel.append(h('option', {value:id}, n))); recSel.value = st.rec;
    const engBox = h('div.col-flex'), modelNote = h('div.tiny.muted', {style:'line-height:1.9'});
    const drawEng = ()=>{
      engBox.replaceChildren(...[
        appOk() && sysOk() ? h('label.small.muted', 'المعرّف الصوتي') : null,
        appOk() && sysOk() ? M.seg([['app', 'المعرّف القرآني'], ['system', 'خدمة الهاتف']], eng(), v=>{ const was = st.on; if(was) stop(true); st.eng = v; remember(); drawEng(); if(was) start(); }) : null,
        eng() === 'app' ? h('label.small.muted', 'حساسية الميكروفون') : null,
        eng() === 'app' ? M.seg([['low', 'منخفضة'], ['normal', 'متوسطة'], ['high', 'عالية']], M.cfg.qaSens || 'normal', v=>M.save('qaSens', v)) : null,
        eng() === 'app' ? h('label.small.muted', 'مهلة التوقف بين المقاطع') : null,
        eng() === 'app' ? M.seg([['short', 'قصيرة'], ['normal', 'عادية'], ['long', 'طويلة']], M.cfg.qaPause || 'normal', v=>M.save('qaPause', v)) : null,
        h('label.small.muted', 'دقة المطابقة'),
        M.seg([['strict', 'صارمة'], ['normal', 'متوازنة'], ['loose', 'متسامحة']], M.cfg.vcTol || 'normal', v=>M.save('vcTol', v)),
        eng() === 'system' && window.Android && window.Android.speechSilent ? h('label.row-flex.gap-s.small', {style:'align-items:center'}, h('input', {type:'checkbox', checked:M.cfg.micBeep !== true, onchange:e=>{ M.save('micBeep', !e.target.checked); try{ window.Android.speechSilent(!!e.target.checked); }catch(er){} }}), h('span', 'كتم نغمة الميكروفون')) : null].filter(Boolean));
      if(eng() === 'app' && M.qasr) M.qasr.where().then(w=>{ modelNote.replaceChildren(h('span', w === 'app' ? 'المعرّف القرآني مدمج في التطبيق ويعمل دون إنترنت ودون خدمة الهاتف.' : w === 'saved' ? 'المعرّف القرآني محفوظ على الجهاز ويعمل دون إنترنت.' : 'يُنزَّل المعرّف القرآني مرة واحدة (نحو '+M.n(M.qasr.downloadMB)+' م.ب) ثم يعمل دون إنترنت.'), ' ', h('span', 'نموذج مدرَّب على التلاوة (Tarteel). لا يُسجَّل صوتك ولا يغادر جهازك.')); });
      else modelNote.textContent = 'خدمة التعرّف في هاتفك؛ تعمل دون إنترنت إذا ثبّتّ العربية فيها. لا يُسجَّل صوتك.';
    };
    drawEng();
    M.sheet({title:'إعدادات التسميع', content:h('div.col-flex.ts-pick',
      h('label.small.muted', 'عرض النص أثناء التسميع'), M.seg([['hide', 'مخفي حتى تقرأه'], ['faint', 'باهت للمساعدة'], ['show', 'ظاهر']], st.mode, v=>{ st.mode = v; remember(); paint(); }),
      engBox,
      h('label.small.muted', 'القارئ عند «اسمع الآية»'), recSel,
      h('label.small.muted', 'سرعة الاستماع'), M.seg(SPEEDS.map(([v, l])=>[String(v), l]), String(st.rate), v=>{ st.rate = +v; audio.playbackRate = st.rate; remember(); }),
      modelNote)});
  }

  /* ---------------- the expected words ---------------- */
  function build(){
    stop(true); stopAyah();
    toks = []; groups = []; base = 0; hints = 0; ended = false; tentative = null; result.replaceChildren(); live.replaceChildren();
    for(let a = st.a; a <= st.b; a++){
      const raw = String(M.ayahText(st.s, a) || '').replace(/[۞۩]/g, ' ').split(/\s+/).filter(w=>M.arNorm(w));
      raw.forEach((w, i)=>{
        const n = M.arNorm(w), g = {t:w, a, end:i === raw.length - 1, from:toks.length, n:1};
        if(MUQ[st.s+':'+a] && i === 0 && /^[المركهيعصطسحقن]{1,5}$/.test(n) && n.split('').every(c=>LETTER[c])){
          // read letter by letter: one token per letter, the group shows the written word
          g.say = n.split('').map(c=>SAY[c]).join(' '); g.lit = n; g.n = n.length;
          n.split('').forEach(c=>toks.push({n:LETTER[c][0], alts:LETTER[c], g:groups.length}));
        } else toks.push({n, g:groups.length});
        groups.push(g);
      });
    }
    marks = toks.map(()=>0);   // 0 waiting, 1 said, 2 missed, 3 hinted
    drawHero(); paint(); drawDock();
  }
  const gMark = g=>{ const ms = marks.slice(g.from, g.from + g.n); if(ms.every(m=>m === 1)) return 1; if(ms.some(m=>m === 2)) return 2; if(ms.every(m=>m === 1 || m === 3) && ms.includes(3)) return 3; return ms.some(m=>m) ? 4 : 0; };
  function paint(){
    const box = h('div.ts-text.qfont.ts-'+st.mode), cur = toks[base] ? toks[base].g : -1;
    let lastA = 0;
    groups.forEach((g, gi)=>{
      if(g.a !== lastA && g.say){ lastA = g.a; }
      const m = gMark(g), cls = m === 1 ? '.ok' : m === 2 ? '.miss' : m === 3 ? '.hint' : m === 4 ? '.part' : gi === cur ? '.cur' : '';
      box.append(h('span.ts-w'+cls, {dataset:{g:gi}, title:g.say ? 'تُقرأ: '+g.say : ''}, g.t), ' ');
      if(g.end) box.append(h('button.ts-ay.num', {'aria-label':'اسمع الآية '+M.n(g.a), dataset:{a:g.a}, onclick:()=>playAyah(g.a)}, M.n(g.a)), ' ');
    });
    const say = groups.filter(g=>g.say);
    paper.replaceChildren(...[h('div.ts-orn', h('i'), h('span.title-font', 'سورة '+M.sname(st.s)), h('i')), box, say.length ? h('div.ts-say', M.ic('info'), h('span', 'الحروف المقطّعة تُقرأ بأسمائها: ', ...say.map((g, i)=>h('b.qfont', (i ? '، ' : '')+g.t+' = '+g.say)))) : null,
      h('div.ts-prog', h('i', {style:'width:'+(toks.length ? (base / toks.length * 100) : 0)+'%'}))].filter(Boolean));
    const c = box.querySelector('.ts-w.cur'); if(c && st.on) try{ c.scrollIntoView({block:'center', behavior:'smooth'}); }catch(e){}
    drawHero();
  }

  /* ---------------- matching ---------------- */
  const same = (w, t)=>t.alts ? t.alts.some(x=>M.arSame(w, x)) : M.arSame(w, t.n);
  function align(from, said, final){
    const out = {p:from, m:{}};
    let p = from;
    for(let k = 0; k < said.length; k++){
      const w = said[k]; if(p >= toks.length) break;
      const g = groups[toks[p].g];
      if(g.lit && toks[p] === toks[g.from] && M.arSame(w, g.lit)){ for(let j = 0; j < g.n; j++) out.m[p + j] = 1; p += g.n; continue; }   // «الم» written as one word
      if(same(w, toks[p])){ out.m[p] = 1; p++; continue; }
      if(p + 1 < toks.length && !toks[p].alts && M.arSame(w, toks[p].n + toks[p + 1].n)){ out.m[p] = 1; out.m[p + 1] = 1; p += 2; continue; }     // two words heard as one
      if(k + 1 < said.length && M.arSame(w + said[k + 1], toks[p].n)){ out.m[p] = 1; p++; k++; continue; }                                    // one word heard as two
      let hit = -1; for(let j = 1; j <= 4 && p + j < toks.length; j++) if(same(w, toks[p + j])){ hit = j; break; }
      // skipping ahead on a short common word (لا، في، من…) needs the next word to agree too
      if(hit > 0 && toks[p + hit].n.length <= 3 && !(k + 1 < said.length && p + hit + 1 < toks.length && same(said[k + 1], toks[p + hit + 1]))) hit = -1;
      if(hit > 0 && (final || hit === 1)){
        // one short word (يوم، من، في…) the recogniser often swallows into its neighbour: not a sure mistake
        const soft = hit === 1 && !toks[p].alts && toks[p].n.length <= 3 ? ({loose:1, normal:3, strict:2})[M.cfg.vcTol || 'normal'] : 2;
        for(let j = 0; j < hit; j++) out.m[p + j] = soft; out.m[p + hit] = 1; p += hit + 1; }
      // anything else (isti'adha, basmala, a repeated word) is ignored
    }
    out.p = p; return out;
  }
  function onSpeech(ev){
    if(ev.type === 'end'){ if(flushing){ flushing = false; busy = false; live.classList.remove('busy'); paint(); } return; }
    if(ev.type === 'busy'){ busy = !!ev.text && (st.on || flushing); live.classList.toggle('busy', busy); if(busy && !heardEl.textContent) heard('…'); return; }
    if(!st.on && !(flushing && ev.type === 'final')) return;
    if(ev.type === 'level'){ meter(+ev.text); return; }
    if(ev.type === 'ready'){ say('أستمع… ابدأ التلاوة، وتظهر الكلمات أثناء القراءة'); return; }
    if(ev.type === 'error'){
      stop(); say(ev.text === 'permission' ? 'لم يُسمح باستخدام الميكروفون' : ev.text === 'network' ? 'خدمة التعرّف تحتاج إنترنت أو حزمة العربية دون اتصال' : ev.text === 'unavailable' ? 'لا توجد خدمة تعرّف على الكلام في الهاتف' : ev.text === 'model' ? 'تعذّر تجهيز المعرّف القرآني — تحقق من المساحة أو الاتصال ثم أعد المحاولة' : 'توقّف التعرّف على الكلام — اضغط للمتابعة', true); return;
    }
    const fin = ev.type === 'final';
    if(fin && ev.stats && M.qasr && M.qasr.lastMs){ speedEl.textContent = M.n((M.qasr.lastMs / 1000).toFixed(1))+' ث'; speedEl.title = 'زمن التعرّف على آخر مقطع'; }
    // the phone's service may offer several readings: take the one that goes furthest with the fewest misses
    let r = null, best = ev.text || '';
    (M.speechReadings ? M.speechReadings(ev) : [ev.text || '']).forEach(t=>{ const x = align(base, M.arWords(t), fin), ok = Object.values(x.m).filter(v=>v === 1).length, bad = Object.values(x.m).filter(v=>v === 2).length;
      x.score = ok * 2 - bad; if(!r || x.score > r.score){ r = x; best = t; } });
    if(!r) r = align(base, [], fin);
    if(best) heard(best);
    if(tentative) Object.keys(tentative.m).forEach(i=>{ if(marks[i] !== 3) marks[i] = 0; });
    Object.keys(r.m).forEach(i=>{ if(marks[i] !== 3) marks[i] = r.m[i]; });
    if(fin){ base = r.p; tentative = null; } else tentative = r;
    const keep = base; base = fin ? base : r.p; paint(); base = keep;
    if((fin ? base : r.p) >= toks.length) finish();
  }

  /* ---------------- live strip: level bars + what was heard ---------------- */
  const bars = h('div.ts-bars', ...Array.from({length:5}, ()=>h('i'))), heardEl = h('div.ts-heard'), statusEl = h('div.ts-status'), speedEl = h('span.ts-speed');
  function say(t, err){ statusEl.textContent = t; statusEl.classList.toggle('err', !!err); ensureLive(); }
  function heard(t){ heardEl.textContent = t; ensureLive(); }
  function ensureLive(){ if(!live.firstChild) live.append(h('div.ts-live-in', bars, h('div.grow', statusEl, heardEl), speedEl)); live.classList.toggle('on', st.on); }
  let lvT = 0;
  function meter(db){ const v = Math.max(0, Math.min(1, (db + 2) / 12)); dock.style.setProperty('--lv', v.toFixed(2)); [...bars.children].forEach((b2, i)=>{ const k = [0.55, 0.8, 1, 0.8, 0.55][i]; b2.style.transform = 'scaleY('+(0.18 + v * k * (0.75 + Math.random() * 0.25)).toFixed(2)+')'; }); clearTimeout(lvT); lvT = setTimeout(()=>meter(-5), 400); }

  /* ---------------- listening ---------------- */
  async function start(){
    const e = eng();
    if(!e){ M.toast('التعرّف على الكلام غير متاح على هذا الجهاز'); return; }
    if(e === 'app'){ const ok = await M.qasr.prepare({system:sysOk()}); if(!ok) return; if(ok === 'system'){ st.eng = 'system'; remember(); } }
    if(ended) build();
    stopAyah();
    st.on = true; tentative = null; flushing = false; live.classList.add('on');
    say(eng() === 'app' && !M.qasr.isReady() ? 'جارٍ تجهيز المعرّف القرآني…' : 'جارٍ تشغيل الميكروفون…'); heard(''); drawDock();
    if(eng() === 'app'){
      M.qasr.listen(onSpeech, {hint:()=>{ const g0 = toks[base] ? toks[base].g : -1; if(g0 < 0) return ''; return groups.slice(g0, g0 + 28).filter(g=>!g.say).map(g=>g.t).join(' '); }, onProgress:f=>{ if(st.on && f < 1) say('جارٍ تنزيل المعرّف القرآني… '+M.n(Math.round(f * 100))+'٪'); }});
    } else {
      try{ window.Android && window.Android.speechSilent && window.Android.speechSilent(M.cfg.micBeep !== true); }catch(e2){}
      M.speech.start('ar-SA', onSpeech);
      // the web recogniser has no level: animate gently while listening
      if(!(window.Android && window.Android.speechStart)){ const t = setInterval(()=>{ if(!st.on){ clearInterval(t); meter(-5); return; } meter(2 + Math.random() * 6); }, 160); }
    }
    if(M.keepAwake) M.keepAwake(true);
  }
  const quit = flush=>{ if(eng() === 'app'){ if(flush) flushing = true; M.qasr.stop(true, !!flush); } else { try{ M.speech.stop(); }catch(e){} } };
  function stop(silent){
    if(!st.on) return;
    st.on = false; quit(!silent);
    if(tentative){ Object.keys(tentative.m).forEach(i=>{ if(tentative.m[i] === 1) marks[i] = 1; else if(marks[i] !== 3) marks[i] = 0; }); base = Math.max(base, (()=>{ let p = base; while(p < toks.length && marks[p] === 1) p++; return p; })()); tentative = null; }
    if(M.keepAwake && !M.cfg.keepAwake) M.keepAwake(false);
    live.classList.remove('on');
    if(!silent){ say(base ? 'متوقف — اضغط الميكروفون للمتابعة من حيث توقفت' : 'اضغط الميكروفون وابدأ التلاوة'); drawDock(); paint(); }
  }
  function hint(){
    if(base >= toks.length) return;
    const g = groups[toks[base].g];
    for(let j = base; j < g.from + g.n; j++) marks[j] = 3;
    hints++; base = g.from + g.n; tentative = null; paint(); drawDock();
    if(base >= toks.length) finish();
  }
  function finish(){
    if(ended) return; ended = true;
    if(st.on){ st.on = false; quit(false); live.classList.remove('on'); }
    busy = false; live.classList.remove('busy');
    for(let i = 0; i < toks.length; i++) if(!marks[i]) marks[i] = 2;
    paint(); drawDock(); showResult(); say('انتهى التسميع — النتيجة في الأسفل'); heard('');
    M.haptic && M.haptic(40);
  }

  /* ---------------- hearing an ayah ---------------- */
  async function playAyah(a){
    if(playing === a && !audio.paused){ stopAyah(); return; }
    if(M.recReady) await M.recReady(st.rec);
    if(st.on){ resumeAfter = true; stop(true); live.classList.remove('on'); }
    playing = a; audio.src = M.audioURL(st.s, a, st.rec); audio.playbackRate = st.rate;
    say('تُتلى الآية '+M.n(a)+' — '+((M.RECITERS || []).find(r=>r[0] === st.rec) || ['', ''])[1]); heard('');
    audio.play().catch(()=>{ say('تعذّر تشغيل التلاوة — تحقق من الاتصال بالإنترنت أو نزّل السورة', true); playing = null; drawDock(); });
    drawDock(); markPlaying();
  }
  function stopAyah(){ try{ audio.pause(); }catch(e){} playing = null; markPlaying(); }
  function markPlaying(){ paper.querySelectorAll('.ts-ay').forEach(x=>x.classList.toggle('on', playing != null && +x.dataset.a === playing)); }
  audio.addEventListener('ended', ()=>{ const was = playing; playing = null; markPlaying(); drawDock(); if(resumeAfter && !ended){ resumeAfter = false; say('تابع من حيث توقفت'); setTimeout(start, 350); } void was; });
  const curAyah = ()=>toks[base] ? groups[toks[base].g].a : st.b;

  /* ---------------- dock ---------------- */
  function drawDock(){
    const mic = h('button.ts-mic'+(st.on ? '.on' : ''), {'aria-label':st.on ? 'إيقاف' : 'ابدأ التسميع', onclick:()=>st.on ? stop() : start()}, h('i.ts-mic-ring'), h('i.ts-mic-ring.r2'), M.ic(st.on ? 'stop' : 'mic'));
    const dk = (ic, lb, fn, dis, cls)=>h('button.ts-dk'+(cls || ''), {onclick:fn, disabled:!!dis, 'aria-label':lb}, h('span.ts-dk-i', M.ic(ic)), h('span', lb));
    dock.replaceChildren(
      dk('refresh', 'من جديد', ()=>{ build(); say('اضغط الميكروفون وابدأ التلاوة من حفظك'); }, !base && !ended),
      dk(playing ? 'pause' : 'volume', playing ? 'إيقاف' : 'اسمع الآية', ()=>playAyah(curAyah())),
      mic,
      dk('eye', 'تلميح', hint, base >= toks.length),
      dk('settings', 'الإعدادات', ()=>settings()));
    dock.classList.toggle('on', st.on);
  }

  /* ---------------- result and history ---------------- */
  function showResult(){
    const tot = groups.length, ok = groups.filter(g=>gMark(g) === 1).length, miss = groups.filter(g=>gMark(g) === 2), pct = Math.round(ok / Math.max(1, tot) * 100);
    const log = M.store.get(LOG, []) || []; log.unshift({d:Date.now(), s:st.s, a:st.a, b:st.b, pct, h:hints}); M.store.set(LOG, log.slice(0, 30)); drawHist();
    result.replaceChildren(h('div.card.pad.ts-res.'+(pct >= 90 ? 'good' : pct >= 70 ? 'mid' : 'low'),
      h('div.ts-score', M.ring ? M.ring(pct / 100, 76, 7, M.n(pct)+'٪') : h('b', M.n(pct)+'٪'),
        h('div.grow', h('div.bold', pct >= 90 ? 'أحسنت! حفظ متقن' : pct >= 70 ? 'جيد، راجع المواضع المعلَّمة' : 'تحتاج إلى مراجعة'),
          h('div.ts-chips', h('span.ok', M.n(ok)+' صحيحة'), h('span.miss', M.n(miss.length)+' فاتتك'), h('span.hint', M.n(hints)+' تلميح')))),
      miss.length ? h('div.ts-missed', h('div.small.muted', 'اضغط كلمة لتسمع آيتها بالقراءة الصحيحة'),
        h('div.ts-mw', ...miss.slice(0, 30).map(g=>h('button.qfont', {onclick:()=>playAyah(g.a)}, g.t, h('small.num', '﴿'+M.n(g.a)+'﴾'))))) : null,
      h('div.row-flex.gap-s', {style:'margin-top:12px;flex-wrap:wrap'},
        h('button.btn.tonal.grow', {onclick:()=>{ build(); }}, M.ic('refresh'), 'إعادة التسميع'),
        st.b < N() ? h('button.btn.grow', {onclick:()=>{ const len = st.b - st.a; st.a = st.b + 1; st.b = Math.min(N(), st.a + len); remember(); build(); }}, 'المقطع التالي') : null)));
    setTimeout(()=>{ try{ result.scrollIntoView({block:'start', behavior:'smooth'}); }catch(e){} }, 120);
  }
  function drawHist(){
    const log = M.store.get(LOG, []) || [];
    if(!log.length){ hist.replaceChildren(); return; }
    hist.replaceChildren(h('div.section-h', 'آخر التسميعات'), h('div.card.list', ...log.slice(0, 8).map(x=>h('button.item', {onclick:()=>{ st.s = x.s; st.a = x.a; st.b = x.b; remember(); build(); try{ b.scrollTo({top:0, behavior:'smooth'}); }catch(e){} }},
      h('span.lead.num.ts-hp.'+(x.pct >= 90 ? 'good' : x.pct >= 70 ? 'mid' : 'low'), M.n(x.pct)+'٪'),
      h('div.grow', h('div.t', 'سورة '+M.sname(x.s)), h('div.s', (x.a === x.b ? 'الآية '+M.n(x.a) : 'الآيات '+M.n(x.a)+'–'+M.n(x.b))+(x.h ? ' • '+M.cnt(x.h, 'تلميح', false, 'تلميح') : ''))), M.ic('fwd')))));
  }

  paper.append(h('div.small.muted.center', {style:'padding:30px 0'}, 'جارٍ تحميل المصحف…'));
  M.loadQuran().then(()=>{ if(view.closed) return; if(st.b > N()) st.b = N(); if(st.a > st.b) st.a = 1; build(); drawHist(); say('اضغط الميكروفون وابدأ التلاوة من حفظك'); })
    .catch(()=>paper.replaceChildren(h('div.small.muted.center', {style:'padding:30px 0'}, 'تعذّر تحميل المصحف.')));
  return view;
}
M.openTasmee = open;
// the app's own recogniser works wherever the page has a microphone and WebAssembly (Android, iPhone, browsers)
if(M.can('speech') || (M.qasr && M.qasr.supported())) M.addSection({id:'tasmee', title:'تسميع القرآن', icon:'mic', group:'القرآن الكريم', fn:()=>open()});
else M.openTasmee = null;
})();
