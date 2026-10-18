/* ===== Quran player: a full player for downloaded (or streamed) recitations — library, queue, loops, speed, sleep timer ===== */
(function(){
'use strict';
const M = window.M, h = M.h, P = M.player;
const native = ()=>!!(window.Android && window.Android.downloadFiles);
const dlMap = ()=>M.store.get('dlAudio', {}) || {};
const recName = id=>(M.RECITERS.find(r=>r[0] === id) || [])[1] || id;
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const LOOPS = [['off', 'بدون تكرار', 'refresh'], ['ayah', 'تكرار الآية', 'refresh'], ['surah', 'تكرار السورة', 'refresh'], ['all', 'تكرار القائمة', 'refresh']];
const fmt = s=>{ s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60), x = s % 60; return M.n(m)+':'+M.n(String(x).padStart(2, '0')); };
let loopMode = 0, showText = true, countLeft = 0;       // countLeft: stop after N more surahs (0 = off)

function applyLoop(){
  const k = LOOPS[loopMode][0];
  P.loopAyah = k === 'ayah'; P.loopSurah = k === 'surah'; P.queueLoop = k === 'all';
}
M.on('surahend', ()=>{
  if(countLeft > 0){ countLeft--; if(countLeft === 0){ try{ P.stop(); }catch(e){} M.toast('تم إيقاف التلاوة بعد العدد الذي اخترته'); M.emit('sleep', null); } }
});

function surahList(tab, rec, q){
  const have = dlMap()[rec] || {}, k = q ? M.normAr(q) : '';
  const out = [];
  M.Q.surahs.forEach(s=>{
    if(tab === 'dl' && !have[s.id]) return;
    if(k && !M.normAr(s.ar).includes(k) && !String(s.id).includes(k) && !(s.en || '').toLowerCase().includes(k.toLowerCase())) return;
    out.push(s);
  });
  return out;
}

M.openQuranPlayer = function(opts){
  opts = opts || {};
  return M.openView({title:'مشغّل القرآن', id:'qplayer', nopad:true, build:(b, view)=>{
    b.classList.add('qp');
    M.loadQuran().then(()=>build(b, view));
  }});
};

function build(b, view){
  const have0 = dlMap()[M.cfg.reciter] || {};
  let tab = native() && Object.keys(have0).length ? 'dl' : 'all', q = '';
  const hero = h('div.qp-hero'), lib = h('div.qp-lib');
  b.append(h('div.qp-aurora', h('i'), h('i'), h('i')), hero, lib);
  const unsubs = [];

  /* ---------------- hero (now playing) ---------------- */
  const rec = ()=>M.cfg.reciter;
  const cur = ()=>{ if(P.s) return {s:P.s, a:P.ayah}; const l = M.store.get('lastAudio'); return l && l.s ? {s:l.s, a:l.a || 1} : null; };
  let seek, tCur, tTot, ayEl, nameEl, subEl, playBtn, loopBtn, spdBtn, timerBtn, artEl;
  function stepSurah(d){
    const list = P.queue || M.Q.surahs.map(s=>s.id), c = cur(); if(!c) return;
    const i = list.indexOf(c.s), nx = list[i + d];
    if(nx) P.play(nx, 1); else M.toast(d > 0 ? 'هذه آخر سورة في القائمة' : 'هذه أول سورة في القائمة');
  }
  function stepAyah(d){ if(!P.s) return; if(d > 0) P.next(); else P.prev(); }
  function togglePlay(){
    if(P.s) return P.toggle();
    const c = cur(); if(c){ if(!P.queue) P.queue = surahList(tab, rec(), '').map(s=>s.id); P.play(c.s, c.a || 1); }
    else { const l = surahList(tab, rec(), ''); if(l.length) startQueue(l, l[0].id); else M.toast('اختر سورة من القائمة'); }
  }
  function startQueue(list, s, shuffle){
    let ids = list.map(x=>x.id);
    if(shuffle){ ids = ids.slice().sort(()=>Math.random() - .5); s = ids[0]; }
    P.queue = ids; applyLoop();
    P.play(s, 1);
  }
  const tbtn = (icon, label, fn, cls)=>h('button.qp-tool'+(cls ? '.'+cls : ''), {onclick:fn, 'aria-label':label}, icon ? M.ic(icon) : h('b.qp-sp', '×١'), h('span', label));
  function paintHero(){
    const c = cur(), sd = c ? M.Q.surahs[c.s - 1] : null;
    nameEl.textContent = sd ? sd.ar : (M.tr ? M.tr('اختر سورة') : 'اختر سورة'); nameEl.classList.toggle('qp-none', !sd);
    artEl.classList.toggle('on', !!P.playing); hero.dataset.playing = P.playing ? '1' : '0';
    subEl.textContent = sd ? (sd.mk ? 'مكية' : 'مدنية')+' • '+M.cnt(sd.n, 'آية')+' • '+recName(rec()) : (native() ? 'من التلاوات المحمّلة على جهازك' : 'تُبَثّ التلاوة عبر الإنترنت');
    playBtn.replaceChildren(M.ic(P.playing ? 'pause' : 'play')); playBtn.classList.remove('pop'); void playBtn.offsetWidth; playBtn.classList.add('pop');
    playBtn.setAttribute('aria-label', P.playing ? 'إيقاف مؤقت' : 'تشغيل');
    if(sd){
      seek.max = sd.n; seek.value = c.a; seek.disabled = false;
      tCur.textContent = 'آية '+M.n(c.a); tTot.textContent = M.n(sd.n);
      artEl.querySelector('.qp-pv').setAttribute('stroke-dasharray', (c.a / sd.n * 100).toFixed(1)+' 100');
      const nt = showText ? M.ayahText(c.s, c.a) : '';
      if(ayEl.textContent !== nt){ ayEl.textContent = nt; ayEl.classList.remove('swap'); void ayEl.offsetWidth; ayEl.classList.add('swap'); }
      seek.style.setProperty('--pct', (sd.n > 1 ? (c.a - 1) / (sd.n - 1) * 100 : 100).toFixed(1)+'%');
    } else { seek.disabled = true; seek.value = 0; artEl.querySelector('.qp-pv').setAttribute('stroke-dasharray', '0 100'); tCur.textContent = ''; tTot.textContent = ''; ayEl.textContent = ''; }
    ayEl.classList.toggle('hide', !showText || !sd);
    const sp = M.cfg.speed || 1; spdBtn.querySelector('.qp-sp').textContent = '×'+M.n(sp); spdBtn.classList.toggle('on', sp !== 1);
    loopBtn.querySelector('span').textContent = ['تكرار', 'الآية', 'السورة', 'القائمة'][loopMode]; loopBtn.setAttribute('aria-label', LOOPS[loopMode][1]); loopBtn.classList.toggle('on', loopMode > 0);
    paintTimer();
    lib.querySelectorAll('.qp-row').forEach(r=>r.classList.toggle('now', +r.dataset.s === P.s));
  }
  function paintTimer(){
    let txt = 'المؤقت', on = false;
    const st = M.sleepTimer;
    if(countLeft > 0){ txt = 'بعد '+M.n(countLeft)+' سور'; on = true; }
    else if(st && st.active){ const left = st.end - Date.now(); txt = left > 0 ? fmt(left / 1000) : 'نهاية السورة'; on = true; }
    timerBtn.querySelector('span').textContent = txt; timerBtn.classList.toggle('on', on);
  }
  function timerSheet(){
    const body = h('div.qp-timer'); let sh;
    const done = msg=>{ M.toast(msg); sh && sh.close && sh.close(); paintHero(); };
    const chip = (label, fn)=>h('button.chip', {onclick:fn}, label);
    const mins = [[10, '١٠ دقائق'], [15, '١٥ دقيقة'], [30, '٣٠ دقيقة'], [45, '٤٥ دقيقة'], [60, 'ساعة'], [90, 'ساعة ونصف']];
    body.append(
      h('div.small.muted.qp-tn', 'يوقف التلاوة تلقائيًا مع خفض تدريجي للصوت في آخر ٢٠ ثانية من المؤقت الزمني.'),
      h('div.section-h', 'بعد مدة'),
      h('div.chips.qp-chs', ...mins.map(([m, l])=>chip(l, ()=>{ countLeft = 0; M.sleepTimer.start(m); done('سيتوقف التشغيل بعد '+l); }))),
      h('div.section-h', 'عند الانتهاء'),
      h('div.chips.qp-chs',
        chip('نهاية السورة الحالية', ()=>{ countLeft = 0; M.sleepTimer.start(0, 'surah'); done('سيتوقف التشغيل عند نهاية السورة'); }),
        ...[2, 3, 5, 10].map(n=>chip('بعد '+M.n(n)+' سور', ()=>{ M.sleepTimer.stop(); countLeft = n; if(!P.queue && P.s){ P.queue = M.Q.surahs.map(s=>s.id).filter(id=>id >= P.s); } done('سيتوقف التشغيل بعد '+M.n(n)+' سور'); }))),
      h('button.btn.ghost.block', {style:'margin-top:12px', onclick:()=>{ countLeft = 0; M.sleepTimer.stop(); done('أُلغي المؤقت'); }}, 'إلغاء المؤقت'));
    sh = M.sheet({title:'مؤقت النوم والإيقاف التلقائي', content:body});
  }
  function reciterSheet(){
    const body = h('div.list'); let sh;
    M.RECITERS.forEach(([id, name])=>{
      const n = Object.keys(dlMap()[id] || {}).length;
      body.append(h('button.item'+(id === rec() ? '.on' : ''), {onclick:()=>{ M.save('reciter', id); sh.close(); const c = P.s ? {s:P.s, a:P.ayah} : null; if(c && P.playing) P.play(c.s, c.a, {keepRange:true}); drawLib(); paintHero(); }},
        h('div.grow', h('div.t', name), n ? h('div.s', 'محمّل: '+M.cnt(n, 'سورة')) : null), id === rec() ? M.ic('check') : null));
    });
    sh = M.sheet({title:'القارئ', content:body});
  }

  const prevS = h('button.icon-btn.qp-sm', {'aria-label':'السورة السابقة', onclick:()=>stepSurah(-1)}, M.ic('prev'));
  const nextS = h('button.icon-btn.qp-sm', {'aria-label':'السورة التالية', onclick:()=>stepSurah(1)}, M.ic('next'));
  const prevA = h('button.icon-btn.qp-md', {'aria-label':'الآية السابقة', onclick:()=>stepAyah(-1)}, M.ic('back'));
  const nextA = h('button.icon-btn.qp-md', {'aria-label':'الآية التالية', onclick:()=>stepAyah(1)}, M.ic('fwd'));
  playBtn = h('button.qp-play', {onclick:togglePlay}, M.ic('play'));
  nameEl = h('div.qp-name.qfont'); subEl = h('div.qp-sub.small');
  const NS = 'http://www.w3.org/2000/svg'; const ring = document.createElementNS(NS, 'svg'); ring.setAttribute('viewBox', '0 0 100 100'); ring.setAttribute('class', 'qp-prog');
  ring.innerHTML = '<circle cx="50" cy="50" r="47" class="qp-pt"/><circle cx="50" cy="50" r="47" class="qp-pv" pathLength="100" stroke-dasharray="0 100"/>';
  artEl = h('div.qp-art', h('div.qp-glow'), ring, h('div.qp-in', h('div.qp-sn', 'سورة'), nameEl, h('div.qp-eq', h('i'), h('i'), h('i'), h('i'), h('i'))));
  ayEl = h('div.qp-ayah.qfont');
  seek = h('input.qp-seek', {type:'range', min:1, max:7, step:1, value:1, 'aria-label':'الانتقال إلى آية', oninput:()=>{ tCur.textContent = 'آية '+M.n(+seek.value); seek.style.setProperty('--pct', ((+seek.value - 1) / Math.max(1, +seek.max - 1) * 100)+'%'); }, onchange:()=>{ const c = cur(); if(c) P.play(c.s, +seek.value, {keepRange:true}); }});
  tCur = h('span.small.muted'); tTot = h('span.small.muted');
  spdBtn = tbtn(null, 'السرعة', ()=>{ const i = SPEEDS.indexOf(M.cfg.speed || 1); P.setSpeed(SPEEDS[(i + 1) % SPEEDS.length]); paintHero(); });
  loopBtn = tbtn('refresh', 'تكرار', ()=>{ loopMode = (loopMode + 1) % LOOPS.length; applyLoop(); paintHero(); M.toast(LOOPS[loopMode][1]); });
  timerBtn = tbtn('moon', 'المؤقت', timerSheet);
  const recBtn = tbtn('mic', 'القارئ', reciterSheet);
  const mushBtn = tbtn('pages', 'المصحف', ()=>{ const c = cur(); if(c) M.openReader({sura:c.s, ayah:c.a, select:true}); });
  const txtBtn = tbtn('text', 'النص', ()=>{ showText = !showText; txtBtn.classList.toggle('on', showText); paintHero(); });
  txtBtn.classList.toggle('on', showText);
  hero.append(artEl, subEl,
    ayEl,
    h('div.qp-seekrow', tCur, seek, tTot),
    h('div.qp-ctrl', prevS, prevA, playBtn, nextA, nextS),
    h('div.qp-tools', recBtn, spdBtn, loopBtn, timerBtn, txtBtn, mushBtn));

  /* ---------------- library ---------------- */
  function drawLib(){
    lib.replaceChildren();
    const have = dlMap()[rec()] || {}, nHave = Object.keys(have).length;
    const search = h('input.field', {type:'search', placeholder:'ابحث عن سورة…', 'aria-label':'بحث عن سورة', value:q, oninput:M.debounce(e=>{ q = e.target.value; drawRows(); }, 120)});
    const head = h('div.qp-libh');
    if(native()) head.append(M.seg([['dl', 'المحمّلة ('+M.n(nHave)+')'], ['all', 'كل السور']], tab, v=>{ tab = v; drawRows(); }));
    const rows = h('div.qp-rows'), bar = h('div.qp-bar');
    lib.append(h('div.section-h', 'مكتبة التلاوات', h('small', recName(rec()))), head, search, bar, rows);
    function drawRows(){
      const list = surahList(tab, rec(), q);
      bar.replaceChildren();
      if(list.length){
        bar.append(h('button.btn.sm', {onclick:()=>startQueue(list, list[0].id)}, M.ic('play'), 'تشغيل الكل'),
          h('button.btn.tonal.sm', {onclick:()=>startQueue(list, 0, true)}, M.ic('refresh'), 'عشوائي'),
          h('span.grow'), h('span.small.muted', M.cnt(list.length, 'سورة')));
      }
      rows.replaceChildren();
      if(!list.length){
        rows.append(h('div.card.pad.empty', tab === 'dl' && !q
          ? h('div', h('div', 'لا توجد سور محمّلة لهذا القارئ بعد.'), h('button.btn.tonal.sm', {style:'margin-top:10px', onclick:()=>M.openDownloads('audio')}, M.ic('download'), 'تنزيل تلاوات'), h('button.btn.ghost.sm', {style:'margin:10px 0 0 6px', onclick:()=>{ tab = 'all'; drawLib(); }}, 'عرض كل السور'))
          : 'لا نتائج'));
        return;
      }
      list.forEach(s=>{
        rows.append(h('div.qp-row'+(P.s === s.id ? '.now' : ''), {'data-s':s.id},
          h('button.qp-rb', {onclick:()=>{ if(P.s === s.id && !P.queue) return P.toggle(); startQueue(list, s.id); }},
            h('span.qp-no', h('b.num', M.n(s.id))),
            h('span.grow', h('div.qp-rn', s.ar), h('div.small.muted', (s.mk ? 'مكية' : 'مدنية')+' • '+M.cnt(s.n, 'آية'))),
            have[s.id] ? h('span.qp-ok', {title:'محمّلة', html:M.icon('check')}) : null),
          h('button.icon-btn.tonal.qp-rp', {'aria-label':'تشغيل سورة '+s.ar, onclick:()=>{ if(P.s === s.id && !P.queue) return P.toggle(); startQueue(list, s.id); }}, M.ic('play'))));
      });
    }
    drawRows();
  }
  drawLib(); paintHero();

  unsubs.push(M.on('player', ()=>{ if(!b.isConnected) return; paintHero(); }));
  unsubs.push(M.on('sleep', ()=>{ if(b.isConnected) paintTimer(); }));
  const tick = setInterval(()=>{ if(!b.isConnected){ clearInterval(tick); unsubs.forEach(f=>f()); return; } paintTimer(); }, 1000);
  const old = view.close; view.close = function(){ clearInterval(tick); unsubs.forEach(f=>f()); old.apply(this, arguments); };
}

M.addSection({id:'qplayer', title:'مشغّل القرآن', icon:'play', group:'القرآن والتلاوة', fn:()=>M.openQuranPlayer()});
})();
