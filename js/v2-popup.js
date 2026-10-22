/* ===== Pop-up cards: «ورد الآيات» (a verse-by-verse khatma) and «ذكر» =====
   Shown over the app when it is opened, and on Android each time the phone is unlocked (native PopupService →
   PopupActivity → popup.html, which loads this same file). Confirming a reading moves the khatma on to the next verses.
   State (all in M.store, shared by the app and the Android pop-up page):
     pw     settings + position of the verse khatma {on, n, open, unlock, every, rec, s, a, khatmas, since}
     pwlog  verses and letters read per day {'2026-10-22': [verses, letters]}
     pz     settings of the dhikr card {on, open, unlock, every, i}
     pzlog  dhikr counted per day
     pop:last  when each card was last shown
     popui  how the card looks {sz:'sm'|'md'|'lg', big:last size other than small, dy:where it was moved to in the app} */
(function(){
'use strict';
const M = window.M, h = M.h;
const IS_PAGE = document.documentElement.classList.contains('pop-page');   // the Android pop-up page
const A = ()=>window.Android;
const NATIVE = ()=>!!(A() && typeof A().popupConfig === 'function');
const TOTAL = 6236;
const n = x=>M.n(x);
const now = ()=>Date.now();

/* ---------------- settings ---------------- */
const W_DEF = {on:true, n:1, open:!NATIVE(), unlock:true, every:0, rec:'', s:1, a:1, khatmas:0, since:''};
const Z_DEF = {on:false, open:!NATIVE(), unlock:true, every:120, i:0, morning:false, evening:false, after:false, between:false, offM:20, offE:30, offA:12};
const wcfg = ()=>Object.assign({}, W_DEF, M.store.get('pw', {}) || {});
const zcfg = ()=>Object.assign({}, Z_DEF, M.store.get('pz', {}) || {});
const wset = p=>{ M.store.set('pw', Object.assign(wcfg(), p)); syncNative(); };
const zset = p=>{ M.store.set('pz', Object.assign(zcfg(), p)); syncNative(); if(!IS_PAGE && ['morning', 'evening', 'after', 'between', 'offM', 'offE', 'offA'].some(k=>k in p)){ try{ M.syncNative && M.syncNative(); }catch(e){} try{ M.popupPlan && M.popupPlan(); }catch(e){} } };
const U_DEF = {sz:'md', big:'md', dy:0};
const ucfg = ()=>Object.assign({}, U_DEF, M.store.get('popui', {}) || {});
const uset = p=>M.store.set('popui', Object.assign(ucfg(), p));
const SZ = ()=>{ const s = ucfg().sz; return s === 'sm' || s === 'lg' ? s : 'md'; };
const lastShown = ()=>M.store.get('pop:last', {}) || {};
const markShown = k=>{ const l = lastShown(); l[k] = now(); M.store.set('pop:last', l); try{ A() && A().popupShown && A().popupShown(k); }catch(e){} };

/* tell the Android service what to do on unlock */
function syncNative(extra){
  if(!NATIVE() || IS_PAGE) return;
  const w = wcfg(), z = zcfg();
  let ov = false; try{ ov = !A().canOverlay || !!A().canOverlay(); }catch(e){}
  // the background listener (and its quiet notification) runs only once the card can actually appear
  try{ A().popupConfig(JSON.stringify({wird:{on:!!(ov && w.on && w.unlock), every:+w.every || 0}, dhikr:{on:!!(ov && z.on && z.unlock), every:+z.every || 0}, sched:!!(ov && (z.morning || z.evening || z.after || z.between)), ...(extra || {})})); }catch(e){}
}
M.popupSync = syncNative;

/* ---------------- verse khatma ---------------- */
const letters = t=>String(t || '').replace(/[^ء-يٱ]/g, '').length;   // the letters only: no marks, no spaces
function logRead(verses, lt){
  const L = M.store.get('pwlog', {}) || {}, k = M.dkey(); const c = L[k] || [0, 0];
  L[k] = [c[0] + verses, c[1] + lt]; M.store.set('pwlog', L);
}
function stats(){
  const L = M.store.get('pwlog', {}) || {}, d = new Date(), today = M.dkey(d);
  const ws = new Date(d); ws.setDate(d.getDate() - ((d.getDay() + 1) % 7)); const wk = M.dkey(ws);   // the week starts on Saturday
  const mk = M.dkey(d).slice(0, 7);
  let t = 0, w = 0, m = 0, all = 0, lt = 0;
  Object.keys(L).forEach(k=>{ const [v, l] = L[k]; all += v; lt += l; if(k === today) t += v; if(k >= wk) w += v; if(k.slice(0, 7) === mk) m += v; });
  let streak = 0; for(let i = 0; i < 400; i++){ const x = new Date(d); x.setDate(d.getDate() - i); const v = (L[M.dkey(x)] || [0])[0]; if(v) streak++; else if(i) break; }
  const days7 = []; for(let i = 6; i >= 0; i--){ const x = new Date(d); x.setDate(d.getDate() - i); days7.push([x, (L[M.dkey(x)] || [0])[0]]); }
  return {today:t, week:w, month:m, all, letters:lt, streak, days7};
}
M.wirdStats = stats;
const posLabel = (s, a)=>'سورة '+M.sname(s)+' • الآية '+n(a)+' من '+n(M.Q.surahs[s - 1].n)+' • الجزء '+n(M.juzOfPage(M.pageOf(s, a)));
function batch(c){   // the verses to show now: from the position, at most n, within one surah
  const s = Math.min(114, Math.max(1, c.s | 0)), cnt = M.Q.surahs[s - 1].n, a = Math.min(cnt, Math.max(1, c.a | 0));
  const out = []; for(let i = a; i < a + Math.max(1, c.n | 0) && i <= cnt; i++) out.push([s, i]);
  return out;
}
function step(s, a, by){   // move by whole verses across surahs
  let id = M.aid(s, a) + by; id = Math.max(0, Math.min(TOTAL - 1, id)); return M.fromAid(id);
}

/* ---------------- dhikr list ---------------- */
const DHIKR = [
  {t:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', n:10, f:'«مَن قال: سبحان الله وبحمده في يومٍ مائة مرة حُطَّت خطاياه وإن كانت مثل زبد البحر» — متفق عليه', snd:'r_subhanbi'},
  {t:'لَا إِلَهَ إِلَّا اللَّهُ', n:10, f:'«أفضل الذكر: لا إله إلا الله» — رواه الترمذي وحسّنه', snd:'r_tahlil3'},
  {t:'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', n:10, f:'«مَن صلّى عليَّ واحدةً صلّى الله عليه بها عشرًا» — رواه مسلم', snd:'r_salawat3'},
  {t:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ', n:3, f:'«كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن» — متفق عليه', snd:'r_tasbih1'},
  {t:'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', n:10, f:'«والله إني لأستغفر الله وأتوب إليه في اليوم أكثر من سبعين مرة» — رواه البخاري'},
  {t:'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', n:10, f:'«كنزٌ من كنوز الجنة» — متفق عليه'},
  {t:'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ', n:3, f:'«أحبّ الكلام إلى الله أربع… لا يضرّك بأيّهن بدأت» — رواه مسلم', snd:'r_ahabb'},
  {t:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', n:10, f:'«مَن قالها عشر مرار كان كمن أعتق أربعة أنفس من ولد إسماعيل» — متفق عليه', snd:'r_tahlil'},
  {t:'سُبْحَانَ اللَّهِ', n:33, f:'«سبحان الله والحمد لله تملآن — أو تملأ — ما بين السماوات والأرض» — رواه مسلم', snd:'r_subhan'},
  {t:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', n:7, f:'قالها إبراهيم عليه السلام حين أُلقي في النار، وقالها محمد ﷺ — رواه البخاري', snd:'r_hasbuna'},
  {t:'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', n:3, f:'«لم يدعُ بها رجلٌ مسلمٌ في شيءٍ قطّ إلا استجاب الله له» — رواه الترمذي', snd:'r_karb'},
  {t:'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', n:3, f:'كان أكثر دعاء النبي ﷺ — متفق عليه'}
];
function dhikrLog(c){ const L = M.store.get('pzlog', {}) || {}, k = M.dkey(); L[k] = (L[k] || 0) + c; M.store.set('pzlog', L); }
/* the time of day can suggest something better than a short dhikr: the morning / evening adhkar */
function adhkarNow(){
  try{
    const t = M.prayerTimes(new Date()), x = now();
    if(x > t.fajr.getTime() && x < t.sunrise.getTime() + 3 * 3600e3) return {id:'morning', t:'أذكار الصباح', s:'وقتها الآن — من الفجر حتى الضحى'};
    if(x > t.asr.getTime() && x < t.isha.getTime()) return {id:'evening', t:'أذكار المساء', s:'وقتها الآن — من العصر حتى الليل'};
  }catch(e){}
  return null;
}

/* ---------------- the card ---------------- */
let open = null;   // the card on screen
let audio = null;
function stopAudio(){ try{ if(audio){ audio.pause(); audio.src = ''; } }catch(e){} audio = null; }
function close(why){
  if(!open) return;
  const o = open; open = null; stopAudio();
  o.el.classList.add('out');
  setTimeout(()=>{ o.el.remove(); if(IS_PAGE){ try{ A() && A().closePopup && A().closePopup(); }catch(e){} } }, 230);
  try{ document.removeEventListener('keydown', o.key); }catch(e){}
  o.onClose && o.onClose(why);
}
M.popupClose = close;
function goApp(sec){
  if(IS_PAGE){ try{ A().openApp(sec); }catch(e){} close('app'); return; }
  close('app'); setTimeout(()=>{ if(sec === 'popups') M.openPopups('wird'); else if(sec === 'wirdstats') M.openWirdStats(); else if(M.openDeep) M.openDeep(sec); }, 260);
}
/* size and place: three sizes, and the card can be moved up or down by its little bar (and its title).
   Over other apps on Android the window itself is moved by PopupService (it owns the strip at the top of the card). */
const FLOAT = ()=>document.documentElement.classList.contains('pop-float');
function grab(){ return h('div.pop-grab', {title:'اسحب لأعلى أو لأسفل'}, h('i')); }
function dyRange(root, card){
  const cs = getComputedStyle(root), cur = parseFloat(card.style.top) || 0;
  const top0 = card.offsetTop - cur, bot0 = top0 + card.offsetHeight;
  return [(parseFloat(cs.paddingTop) || 8) - top0, root.clientHeight - (parseFloat(cs.paddingBottom) || 8) - bot0];
}
function fitDy(root, card){
  if(FLOAT() || !root || !card || !card.isConnected) return;
  const [mn, mx] = dyRange(root, card), want = ucfg().dy | 0;
  const d = mn > mx ? 0 : Math.round(Math.max(mn, Math.min(mx, want)));
  card.style.top = d ? d+'px' : '';
}
function setSize(sz){
  uset(sz === 'sm' ? {sz} : {sz, big:sz});
  if(open && open.el){ open.el.classList.remove('pz-sm', 'pz-md', 'pz-lg'); open.el.classList.add('pz-'+SZ()); open.redraw && open.redraw(); requestAnimationFrame(()=>open && fitDy(open.el, open.card)); }
}
function sizeBtn(){
  const small = SZ() === 'sm';
  return h('button.icon-btn.pop-x.pop-sz', {'aria-label':small ? 'تكبير النافذة' : 'تصغير النافذة', onclick:()=>setSize(small ? (ucfg().big === 'lg' ? 'lg' : 'md') : 'sm')}, M.ic(small ? 'enlarge' : 'shrink'));
}
function shell(kind){
  const root = h('div.pop-root.popk-'+kind+'.pz-'+SZ(), {role:'dialog', 'aria-modal':'true'});
  const scrim = h('div.pop-scrim', {onclick:()=>close('scrim')});
  const card = h('div.pop-card');
  root.append(scrim, card);
  (document.getElementById('app') || document.body).append(root);
  requestAnimationFrame(()=>{ root.classList.add('in'); fitDy(root, card); });
  try{ new ResizeObserver(()=>fitDy(root, card)).observe(card); }catch(e){}
  /* drag the card up / down (in the app, and in the full-screen pop-up page) */
  root.addEventListener('pointerdown', e=>{
    if(FLOAT() || e.button > 0) return;
    const g = e.target.closest && e.target.closest('.pop-grab, .pop-head .grow');
    if(!g) return;
    const [mn, mx] = dyRange(root, card); if(mn > mx) return;
    e.preventDefault();
    const y0 = e.clientY, d0 = parseFloat(card.style.top) || 0; let d = d0, moved = false;
    card.classList.add('dragging');
    try{ g.setPointerCapture(e.pointerId); }catch(_){}
    const tm = ev=>ev.preventDefault();
    const mv = ev=>{ d = Math.max(mn, Math.min(mx, d0 + ev.clientY - y0)); if(Math.abs(d - d0) > 2) moved = true; card.style.top = d+'px'; };
    const up = ()=>{ g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up); g.removeEventListener('touchmove', tm);
      card.classList.remove('dragging'); if(moved) uset({dy:Math.round(d)}); };
    g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    g.addEventListener('touchmove', tm, {passive:false});
  });
  const key = e=>{ if(e.key === 'Escape') close('esc'); };
  document.addEventListener('keydown', key);
  return {root, card, key};
}

/* ---- verse khatma card ---- */
async function showWird(o){
  o = o || {};
  try{ await M.loadQuran(); }catch(e){ if(IS_PAGE) close('err'); return false; }
  if(open) close('replace');
  const {root, card, key} = shell('wird');
  open = {el:root, card, kind:'wird', key, onClose:o.onClose, redraw:()=>draw()};
  markShown('wird');
  let tafsirOn = false, statsOn = false, playing = false, added = 0;
  function draw(dir){
    const c = wcfg(), list = batch(c), [s, a] = list[0], id = M.aid(s, a), pct = id / TOTAL;
    const st = stats();
    const sz = SZ();
    card.replaceChildren(grab());
    /* head: what this is, where we are, and a way out */
    card.append(h('div.pop-head',
      h('div.pop-badge', M.ring(pct, sz === 'sm' ? 34 : sz === 'md' ? 40 : 44, sz === 'sm' ? 3 : 4, h('span.num', n(Math.floor(pct * 100))+'٪'))),
      h('div.grow', h('div.pop-kicker', 'ورد الختمة'+(c.khatmas ? ' • الختمة '+n(c.khatmas + 1) : '')), h('div.pop-pos', posLabel(s, a))),
      sizeBtn(),
      h('button.icon-btn.pop-x', {'aria-label':'إغلاق', onclick:()=>close('x')}, M.ic('close'))));
    if(statsOn){ card.append(statsPanel(st)); card.append(h('div.pop-acts', h('button.btn.tonal.grow', {onclick:()=>{ statsOn = false; draw(); }}, M.ic('back'), 'رجوع إلى الآيات'), h('button.btn.tonal', {onclick:()=>goApp('khatma')}, M.ic('settings')))); return; }
    /* the verses */
    const text = h('div.pop-ayat.qfont'+(dir ? '.slide-'+dir : ''));
    if(a === 1 && s !== 1 && s !== 9) text.append(h('div.pop-basm', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'));
    list.forEach(([s2, a2])=>{ text.append(h('span.pop-v', M.ayahText(s2, a2)), ' ', h('span.pop-n', n(a2)), ' '); });
    card.append(h('div.pop-sura', h('span', 'سورة '+M.sname(s)), h('i')), text);
    /* a long verse scrolls inside the card: fade its bottom edge until it is read to the end */
    const fade = ()=>text.classList.toggle('more', text.scrollHeight - text.scrollTop - text.clientHeight > 6);
    text.addEventListener('scroll', fade, {passive:true}); requestAnimationFrame(fade); setTimeout(fade, 400);
    if(tafsirOn){
      const tf = h('div.pop-tafsir', h('div.small.muted', 'التفسير الميسّر'), h('div.pop-tf-t', 'جارٍ التحميل…'));
      card.append(tf);
      Promise.all(list.map(([s2, a2])=>M.getTafsir ? M.getTafsir('ar-tafsir-muyassar', s2, a2).then(r=>String(r && r.text || '').replace(/<[^>]*>/g, ' ').trim()).catch(()=>'') : Promise.resolve('')))
        .then(ts=>{ const t = ts.filter(Boolean).join('\n\n'); tf.lastChild.textContent = t || 'التفسير يحتاج اتصالًا بالإنترنت أول مرة.'; });
    }
    /* tools */
    const tool = (ic, lb, fn, on)=>h('button.pop-tool'+(on ? '.on' : ''), {onclick:fn, 'aria-label':lb}, M.ic(ic), h('span', lb));
    card.append(h('div.pop-tools',
      tool(playing ? 'pause' : 'play', playing ? 'إيقاف' : 'استمع', ()=>play(list)),
      tool('tafsir', 'التفسير', ()=>{ tafsirOn = !tafsirOn; draw(); }, tafsirOn),
      tool('share', 'مشاركة', ()=>{ const t = '﴿'+list.map(([s2, a2])=>M.ayahText(s2, a2)+' ('+n(a2)+')').join(' ')+'﴾\n[سورة '+M.sname(s)+']'; if(IS_PAGE && A() && A().share) A().share(t); else M.share(t); }),
      tool('quran', 'المصحف', ()=>goApp('surah_'+s))));
    /* the main action: confirm, and move to the next verses */
    const ok = h('button.btn.pop-ok', {onclick:()=>{
      let lt = 0; list.forEach(([s2, a2])=>{ lt += letters(M.ayahText(s2, a2)); });
      logRead(list.length, lt); added += list.length;
      const [ls, la] = list[list.length - 1];
      if(ls === 114 && la === 6){ wset({s:1, a:1, khatmas:(c.khatmas | 0) + 1}); celebrate(); return; }
      const [ns, na] = step(ls, la, 1); wset({s:ns, a:na});
      M.haptic && M.haptic(12); stopAudio(); playing = false; tafsirOn = false;
      draw('next'); flash('+'+n(added)+(added === 1 ? ' آية' : ' آيات'));
    }}, M.ic('check'), sz === 'sm' ? 'قرأتها' : list.length > 1 || sz === 'md' ? 'قرأتها — التالي' : 'قرأتها — الآية التالية');
    card.append(h('div.pop-acts',
      h('button.icon-btn.tonal.pop-nav', {'aria-label':'الآية السابقة', onclick:()=>{ const [ps, pa] = step(s, a, -1); wset({s:ps, a:pa}); stopAudio(); playing = false; draw('prev'); }}, M.ic('back')),
      ok,
      h('button.icon-btn.tonal.pop-nav', {'aria-label':'تخطَّ إلى الآية التالية', onclick:()=>{ const [ns, na] = step(s, a, list.length); wset({s:ns, a:na}); stopAudio(); playing = false; draw('next'); }}, M.ic('fwd'))));
    /* footer: the khatma bar + today's numbers; tap for the full statistics */
    card.append(h('button.pop-foot', {onclick:()=>{ statsOn = true; draw(); }},
      h('div.pop-bar', h('i', {style:'width:'+(pct * 100).toFixed(2)+'%'})),
      h('div.pop-mini', h('span', 'اليوم ', h('b.num', n(st.today))), h('span', 'الأسبوع ', h('b.num', n(st.week))), h('span', 'الشهر ', h('b.num', n(st.month))), h('span.pop-more', 'الإحصائيات', M.ic('fwd')))),
      h('button.pop-later', {onclick:()=>close('later')}, M.ic('clock'), 'لاحقًا'));
  }
  function play(list){
    if(playing){ stopAudio(); playing = false; draw(); return; }
    const c = wcfg(), rec = c.rec || M.cfg.reciter || 'Alafasy_128kbps';
    let i = 0; stopAudio(); audio = new Audio(); playing = true; draw();
    const next = ()=>{ if(!audio || i >= list.length){ playing = false; stopAudio(); if(open && open.kind === 'wird') draw(); return; } const [s2, a2] = list[i++]; audio.src = M.audioURL(s2, a2, rec); audio.play().catch(()=>{ playing = false; stopAudio(); M.toast && M.toast('تعذّر تشغيل التلاوة — تحتاج اتصالًا بالإنترنت'); if(open) draw(); }); };
    audio.onended = next; audio.onerror = ()=>{ playing = false; stopAudio(); M.toast && M.toast('تعذّر تشغيل التلاوة'); if(open) draw(); };
    next();
  }
  function flash(t){ const f = h('div.pop-flash', t); card.append(f); setTimeout(()=>f.remove(), 1300); }
  function celebrate(){
    card.replaceChildren(grab(), h('div.pop-done', h('div.pop-done-ic', M.ic('trophy')), h('b.title-font', 'ختمتَ القرآن الكريم'), h('div.muted', 'تقبّل الله منك. تبدأ الختمة التالية من سورة الفاتحة.'),
      h('div.small.muted.pop-dua', 'اللهم ارحمني بالقرآن، واجعله لي إمامًا ونورًا وهدًى ورحمة.'),
      h('button.btn.block', {onclick:()=>draw()}, 'ابدأ الختمة التالية')));
  }
  draw();
  return true;
}
function statsPanel(st){
  const c = wcfg(), max = Math.max(1, ...st.days7.map(d=>d[1]));
  const tile = (v, l, cls)=>h('div.pop-st'+(cls || ''), h('b.num', n(v)), h('span', l));
  const DN = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  return h('div.pop-stats',
    h('div.pop-st-grid', tile(st.today, 'آية اليوم', '.hot'), tile(st.week, 'هذا الأسبوع'), tile(st.month, 'هذا الشهر'), tile(st.all, 'منذ البداية')),
    h('div.pop-week', ...st.days7.map(([d, v])=>h('div.pop-wd', h('b.num', v ? n(v) : ''), h('i', {style:'height:'+Math.max(4, Math.round(v / max * 48))+'px'}), h('span', DN[d.getDay()])))),
    h('div.pop-st-list',
      h('div', h('span', 'الحروف التي قرأتها'), h('b.num', n(st.letters))),
      h('div', h('span', 'الحسنات بإذن الله (الحرف بعشر)'), h('b.num', n(st.letters * 10))),
      h('div', h('span', 'أيام متتالية'), h('b.num', n(st.streak))),
      h('div', h('span', 'ختمات مكتملة'), h('b.num', n(c.khatmas | 0)))),
    h('div.tiny.muted', {style:'line-height:1.8'}, '«مَن قرأ حرفًا من كتاب الله فله به حسنة، والحسنة بعشر أمثالها» — رواه الترمذي. العدد تقريبي ويُحسب من الآيات التي أكّدت قراءتها.'));
}

/* ---- dhikr card: one short dhikr, or a whole set (morning / evening / after the prayer) walked through one by one ---- */
const SETS = {
  morning:{t:'أذكار الصباح', ic:'sunrise', trk:'adhkar_morning'},
  evening:{t:'أذكار المساء', ic:'moon', trk:'adhkar_evening'},
  after:{t:'أذكار بعد الصلاة', ic:'mosque'},
  between:{t:'ذكرٌ بين الصلاتين', ic:'s:beads'}
};
const PR_AR = {fajr:'الفجر', dhuhr:'الظهر', asr:'العصر', maghrib:'المغرب', isha:'العشاء'};
function lastPrayer(){
  try{ const t = M.prayerTimes(new Date()), x = now(); let k = 'isha';
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(p=>{ if(t[p].getTime() <= x) k = p; }); return k; }catch(e){ return ''; }
}
function setItems(set){
  const D = M.ADHKAR; if(!D) return null;
  const txt = (it, v)=>it.ref ? it.ref.map(r=>{ const [s, a] = r.split(':').map(Number); return M.ayahText(s, a); }).join(' ') : (typeof it.t === 'object' ? it.t[v] : it.t);
  if(set === 'morning' || set === 'evening'){
    const v = set === 'morning' ? 'm' : 'e';
    return D.MORNING_EVENING.filter(i=>(!i.only || i.only === v) && !(v === 'm' && i.e === true) && !(v === 'e' && i.m === true))
      .map(i=>({t:txt(i, v), n:i.n || 1, f:i.fadl || '', src:i.src || '', q:!!i.ref}));
  }
  if(set === 'after') return D.AFTER_PRAYER.map(i=>({t:txt(i, 'm'), n:i.n || 1, f:i.fadl || '', src:i.src || '', q:!!i.ref}));
  return null;
}
async function showDhikr(o){
  o = o || {};
  const set = SETS[o.set] && o.set !== 'between' ? o.set : '';
  let items = null;
  if(set){ try{ await M.loadQuran(); }catch(e){} items = setItems(set); }
  if(open) close('replace');
  const {root, card, key} = shell('dhikr');
  open = {el:root, card, kind:'dhikr', key, onClose:o.onClose, redraw:()=>draw()};
  markShown('dhikr');
  let i = 0, cnt = 0, finished = false;
  if(!items){   // a short dhikr, a different one each time
    const c0 = zcfg(); i = (c0.i | 0) % DHIKR.length; zset({i:(i + 1) % DHIKR.length});
    items = DHIKR.map(d=>({t:d.t, n:d.n, f:d.f, snd:d.snd}));
  }
  const multi = !!set, meta = SETS[set || 'between'];
  const pr = set === 'after' ? (o.pr || lastPrayer()) : '';
  const sug = multi ? null : adhkarNow();
  function draw(dir){
    const sz = SZ();
    card.replaceChildren(grab());
    const sub = multi ? (finished ? 'تمّت' : n(i + 1)+' من '+n(items.length)+(pr ? ' • صلاة '+(PR_AR[pr] || '') : '')) : 'اضغط الدائرة مع كل مرة';
    card.append(h('div.pop-head', h('div.pop-badge.z', M.ic(meta.ic)),
      h('div.grow', h('div.pop-kicker', multi ? meta.t : (o.set === 'between' ? meta.t : 'ذكرٌ لك الآن')), h('div.pop-pos', sub)),
      sizeBtn(),
      h('button.icon-btn.pop-x', {'aria-label':'إغلاق', onclick:()=>close('x')}, M.ic('close'))));
    if(multi) card.append(h('div.pop-bar.pop-setbar', h('i', {style:'width:'+((finished ? items.length : i) / items.length * 100).toFixed(1)+'%'})));
    if(finished){
      card.append(h('div.pop-done', h('div.pop-done-ic', M.ic('check')), h('b.title-font', 'أتممتَ '+meta.t), h('div.muted', 'تقبّل الله منك، وجعلها حصنًا لك.'),
        h('button.btn.block', {onclick:()=>close('done')}, 'تقبّل الله')));
      return;
    }
    const d = items[i], done = cnt >= d.n, pct = Math.min(1, cnt / d.n);
    card.append(h('div.pop-dhikr'+(d.q ? '.q' : '')+(dir ? '.slide-'+dir : ''), d.t));
    if(d.f || d.src) card.append(h('div.pop-fadl', d.f || d.src));
    const tap = h('button.pop-tap'+(done ? '.done' : ''), {'aria-label':'عدّ', onclick:()=>{
      if(cnt >= d.n) return; cnt++; dhikrLog(1); M.haptic && M.haptic(cnt === d.n ? 30 : 8);
      if(cnt >= d.n && multi){ draw(); setTimeout(()=>{ if(open && open.kind === 'dhikr') next(); }, 450); return; }
      draw(); }},
      M.ring(pct, Math.round((d.n > 1 ? 116 : 96) * (sz === 'sm' ? .7 : sz === 'md' ? .86 : 1)), sz === 'sm' ? 5 : 7, h('div.pop-tap-in', done ? M.ic('check') : h('b.num', n(cnt)), h('span', done ? 'تمّ' : (d.n > 1 ? 'من '+n(d.n) : 'اضغط')))));
    card.append(h('div.pop-tapwrap', tap));
    const tools = [];
    if(d.snd) tools.push(h('button.pop-tool', {onclick:()=>{ if(audio){ stopAudio(); draw(); return; } stopAudio(); audio = new Audio('audio/'+d.snd+'.mp3'); audio.onended = ()=>{ audio = null; if(open) draw(); }; audio.play().catch(()=>{ audio = null; }); draw(); }}, M.ic(audio ? 'pause' : 'volume'), h('span', audio ? 'إيقاف' : 'استمع')));
    if(!multi) tools.push(h('button.pop-tool', {onclick:()=>{ stopAudio(); i = (i + 1) % items.length; cnt = 0; draw('next'); }}, M.ic('refresh'), h('span', 'ذكر آخر')));
    tools.push(h('button.pop-tool', {onclick:()=>goApp(multi ? (set === 'after' ? 'adhkar' : set) : 'tasbih')}, M.ic(multi ? 'list' : 'beads'), h('span', multi ? 'في التطبيق' : 'السبحة')));
    card.append(h('div.pop-tools', ...tools));
    if(sug) card.append(h('button.pop-sug', {onclick:()=>{ close('set'); setTimeout(()=>showDhikr({set:sug.id}), 260); }}, M.ic(sug.id === 'morning' ? 'sunrise' : 'moon'), h('div.grow', h('b', sug.t), h('small', sug.s)), M.ic('fwd')));
    if(multi) card.append(h('div.pop-acts',
      h('button.icon-btn.tonal.pop-nav', {'aria-label':'السابق', disabled:i === 0, onclick:()=>{ if(i > 0){ i--; cnt = 0; draw('prev'); } }}, M.ic('back')),
      h('button.btn.grow'+(done ? '' : '.tonal'), {onclick:()=>next()}, i === items.length - 1 ? 'إنهاء' : (done ? 'التالي' : 'تخطَّ')),
      h('button.icon-btn.tonal.pop-nav', {'aria-label':'إغلاق', onclick:()=>close('later')}, M.ic('clock'))));
    else card.append(h('div.pop-acts', h('button.btn.grow'+(done ? '' : '.tonal'), {onclick:()=>close('done')}, done ? 'تقبّل الله' : 'لاحقًا')));
  }
  function next(){
    stopAudio();
    if(i >= items.length - 1){ finished = true; markTracker(meta.trk || (pr ? pr+'_adhkar' : '')); draw(); return; }
    i++; cnt = 0; draw('next');
  }
  draw();
  return true;
}
/* finishing a set counts in the daily tracker (from the pop-up page it is applied when the app next opens) */
function markTracker(id){
  if(!id) return;
  if(M.T && M.T.check){ try{ M.T.check(M.dkey(), id, true); }catch(e){} return; }
  const q = M.store.get('pop:trk', []) || []; q.push([M.dkey(), id]); M.store.set('pop:trk', q.slice(-30));
}
if(!IS_PAGE) setTimeout(()=>{ const q = M.store.get('pop:trk', []) || []; if(q.length && M.T && M.T.check){ q.forEach(([d, id])=>{ try{ M.T.check(d, id, true); }catch(e){} }); M.store.set('pop:trk', []); } }, 3500);

M.popup = {showWird, showDhikr, close, stats, DHIKR};

/* ---------------- scheduled adhkar cards ---------------- */
function popItems(days){
  const z = zcfg(), out = [];
  if(!(z.morning || z.evening || z.after || z.between) || !M.prayerTimes) return out;
  const x0 = now(), min = 60e3;
  for(let dd = 0; dd < (days || 5); dd++){
    const day = new Date(); day.setDate(day.getDate() + dd); day.setHours(12, 0, 0, 0);
    let t; try{ t = M.prayerTimes(day); }catch(e){ return out; }
    const k = M.dkey(day), add = (id, ts, set, title, body, pr)=>{ if(ts > x0) out.push({id:'pop_'+id+'_'+k, ts:Math.round(ts), title, body, tone:false, snd:'', ch:'nf_popadhkar_q', chn:'الأذكار المنبثقة', kind:'pop_'+set, open:set === 'after' ? 'adhkar' : set, pop:set + (pr ? ':'+pr : '')}); };
    if(z.morning) add('morning', t.fajr.getTime() + (z.offM | 0) * min, 'morning', 'أذكار الصباح', 'حان وقت أذكار الصباح — حصّن يومك');
    if(z.evening) add('evening', t.asr.getTime() + (z.offE | 0) * min, 'evening', 'أذكار المساء', 'حان وقت أذكار المساء');
    if(z.after) ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(p=>add('after_'+p, t[p].getTime() + (z.offA | 0) * min, 'after', 'أذكار بعد صلاة '+PR_AR[p], 'أستغفر الله… اللهم أنت السلام', p));
    if(z.between) [['sunrise', 'dhuhr'], ['dhuhr', 'asr'], ['maghrib', 'isha']].forEach(([a, b], j)=>add('between'+j, (t[a].getTime() + t[b].getTime()) / 2, 'between', 'ذكرٌ بين الصلاتين', 'دقيقة لذكر الله'));
  }
  return out;
}
M.popupItems = popItems;
if(!IS_PAGE && typeof M.buildReminders === 'function' && !M.buildReminders.__pop){
  const prev = M.buildReminders;
  M.buildReminders = function(days){ const a = prev.apply(this, arguments) || []; let b = []; try{ b = popItems(days); }catch(e){} return b.length ? a.concat(b).sort((x, y)=>x.ts - y.ts) : a; };
  M.buildReminders.__pop = true;
}
/* while the app is open, a scheduled card is shown at its time */
if(!IS_PAGE){
  let tm = [];
  const plan = ()=>{ tm.forEach(clearTimeout); tm = []; popItems(2).filter(x=>x.ts - now() < 6 * 3600e3).forEach(x=>tm.push(setTimeout(()=>{ if(!document.hidden && !open){ const [set, pr] = x.pop.split(':'); showDhikr({set, pr}); } }, x.ts - now()))); };
  setTimeout(plan, 3000); setInterval(plan, 30 * 60e3); document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) plan(); });
  M.on && M.on('settings', ()=>setTimeout(plan, 300));
  M.popupPlan = plan;
}

/* ---------------- when to show (inside the app) ---------------- */
function due(kind){
  const c = kind === 'wird' ? wcfg() : zcfg();
  if(!c.on || !c.open) return false;
  const l = lastShown()[kind] || 0;
  return now() - l >= Math.max(2, +c.every || 0) * 60e3;   // never twice within two minutes
}
function blocked(){
  if(!M.store.get('onboarded', 0)) return true;
  if(document.querySelector('.lock-screen, .app-lock, #lock, .applock')) return true;    // the app lock is on screen
  if(document.querySelector('.ob-root, .onboard, .tasmee-on')) return true;
  if(document.querySelector('.sheet.in')) return true;
  return false;
}
function maybeShow(){
  if(IS_PAGE || open || (navigator.webdriver && !window.__popTest)) return;   // not during automated checks of other screens
  if(blocked()){ setTimeout(maybeShow, 4000); return; }
  if(due('wird')) showWird(); else if(due('dhikr')) showDhikr();
}
if(!IS_PAGE){
  setTimeout(maybeShow, 2200);
  let hidAt = 0;
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden){ hidAt = now(); return; } if(hidAt && now() - hidAt > 60e3) setTimeout(maybeShow, 600); });
  setTimeout(syncNative, 3000);
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) setTimeout(syncNative, 500); });   // back from the permission page
  /* Android: the unlock card needs "display over other apps" — ask once, kindly */
  setTimeout(()=>{
    try{
      if(!NATIVE() || !A().canOverlay || A().canOverlay()) return;
      const w = wcfg(); if(!(w.on && w.unlock) || M.store.get('pop:asked', 0) || !M.store.get('onboarded', 0) || !M.sheet) return;
      M.store.set('pop:asked', 1);
      const sh = M.sheet({title:'ورد الختمة عند فتح الهاتف', content:h('div.col-flex',
        h('div.small', {style:'line-height:1.9'}, 'ليظهر لك وردك من القرآن كل مرة تفتح فيها قفل الهاتف، يحتاج أندرويد إذن «الظهور فوق التطبيقات». في الصفحة التالية فعّل الخيار لتطبيق «المسلم» ثم ارجع.'),
        h('button.btn.block', {onclick:()=>{ sh.close(); try{ A().requestOverlay(); }catch(e){} }}, 'السماح'),
        h('button.btn.tonal.block', {onclick:()=>{ sh.close(); }}, 'لاحقًا'),
        h('div.tiny.muted', 'يمكنك تغيير ذلك من شاشة «الختمة» في أي وقت.'))});
    }catch(e){}
  }, 6000);
}

/* ---------------- settings screen ---------------- */
/* the card's size and place (one setting for both cards) */
function sizeBlock(){
  return h('div.col-flex.pops-szb',
    h('div.nf-lbl', 'حجم النافذة'),
    M.seg([['sm', 'صغيرة'], ['md', 'متوسطة'], ['lg', 'كبيرة']], SZ(), v=>setSize(v)),
    h('div.pops-move', M.ic('chevUp'), h('div.grow.small.muted', 'لرفع النافذة أو إنزالها اسحب الشريط الصغير الذي أعلاها، وستظهر بعد ذلك في نفس المكان.'),
      h('button.btn.tonal.sm', {onclick:()=>{ uset({dy:0}); syncNative({posReset:true}); M.toast && M.toast('رجعت النافذة لمكانها الأصلي'); }}, 'المكان الأصلي')));
}
M.openPopups = function(part){
  if(!M.openView) return;
  const only = part === 'wird' || part === 'dhikr' ? part : '';
  M.openView({id:'popups', title:only === 'wird' ? 'ورد الختمة المنبثق' : only === 'dhikr' ? 'الأذكار المنبثقة' : 'النوافذ المنبثقة', build:b=>{
    const root = h('div.col-flex.pops'); b.append(root);
    async function draw(){
      try{ await M.loadQuran(); }catch(e){}
      const w = wcfg(), z = zcfg(), nat = NATIVE();
      let canOv = true; try{ canOv = nat && A().canOverlay ? !!A().canOverlay() : true; }catch(e){}
      root.replaceChildren();
      root.append(h('div.small.muted', {style:'line-height:1.9;margin:0 4px'}, only === 'dhikr'
        ? (nat ? 'تظهر الأذكار فوق الشاشة في مواعيدها، أو أول ما تفتح الهاتف بعد موعدها، فتمرّ بها ذكرًا ذكرًا بعدّاد.' : 'تظهر الأذكار في مواعيدها والتطبيق مفتوح، وتصلك إشعارًا إن كان مغلقًا.')
        : nat ? 'تظهر النافذة كل مرة تفتح فيها قفل الهاتف، فتقرأ الآيات التالية من ختمتك وتؤكد قراءتها لتنتقل إلى ما بعدها.'
        : 'تظهر النافذة عند فتح التطبيق، فتقرأ الآيات التالية من ختمتك وتؤكد قراءتها لتنتقل إلى ما بعدها.'));
      if(nat && !canOv && ((w.on && w.unlock) || (z.on && z.unlock))) root.append(h('div.card.pad.pops-warn',
        h('div.row-flex', M.ic('info'), h('div.grow', h('b', 'اسمح بالظهور فوق التطبيقات'), h('div.small.muted', 'بدون هذا الإذن لا يستطيع أندرويد إظهار النافذة عند فتح القفل، فيصلك إشعار بدلًا منها.'))),
        h('button.btn.block', {onclick:()=>{ try{ A().requestOverlay(); }catch(e){} setTimeout(draw, 1500); }}, 'منح الإذن')));
      const row = (t, s, el)=>h('div.item.static', h('div.grow', h('div.t', t), s ? h('div.s', s) : null), el);
      /* Android: is the unlock card actually ready? (service running, permission, battery) + a live test over the screen */
      if(nat && A().popupStatus && ((w.on && w.unlock) || (z.on && z.unlock) || z.morning || z.evening || z.after || z.between)){
        let stx = {}; try{ stx = JSON.parse(A().popupStatus() || '{}'); }catch(e){}
        const ok = (b, y, no)=>h('div.pops-chk'+(b ? '.ok' : '.no'), M.ic(b ? 'check' : 'info'), h('span', b ? y : no));
        const EV = {'service started':'الخدمة بدأت', 'unlock: nothing due':'آخر فتح: لم يحن موعد النافذة بعد', 'unlock: no overlay permission':'آخر فتح: لا يوجد إذن الظهور'};
        const ev = stx.event ? (EV[stx.event] || (/^overlay (wird|dhikr)/.test(stx.event) ? 'آخر فتح: ظهرت النافذة ✓' : /failed/.test(stx.event) ? 'تعذّر الإظهار: '+stx.event : stx.event)) : '';
        root.append(h('div.card.pad.col-flex.pops-status',
          h('b', 'حالة النافذة على هذا الهاتف'),
          ok(canOv, 'إذن الظهور فوق التطبيقات ممنوح', 'إذن الظهور فوق التطبيقات غير ممنوح'),
          ok(!!stx.running, 'خدمة فتح القفل تعمل (تجد إشعار «نافذة الورد تعمل»)', 'خدمة فتح القفل لا تعمل'),
          ok(stx.battery !== false, 'التطبيق مستثنى من توفير البطارية', 'توفير البطارية قد يوقف الخدمة'),
          ev ? h('div.tiny.muted', ev+(stx.eventAt ? ' — '+M.fmt(new Date(stx.eventAt)) : '')) : null,
          h('div.row-flex.pops-btns',
            h('button.btn.grow', {onclick:()=>{ try{ A().popupTest('wird'); }catch(e){} }}, M.ic('eye'), 'جرّب فوق الشاشة الآن'),
            !canOv ? h('button.btn.tonal.grow', {onclick:()=>{ try{ A().requestOverlay(); }catch(e){} }}, 'منح الإذن') : stx.battery === false ? h('button.btn.tonal.grow', {onclick:()=>{ try{ A().openBatterySettings('battery'); }catch(e){} }}, 'البطارية') : h('button.btn.tonal', {onclick:()=>draw()}, M.ic('refresh')))));
      }
      const sw = (v, fn)=>M.switchEl(v, x=>{ fn(x); draw(); });
      const EV = [['0', 'كل مرة'], ['30', 'كل ٣٠ د'], ['60', 'كل ساعة'], ['180', 'كل ٣ س']];
      /* verse khatma */
      const pos = M.Q.ready ? posLabel(w.s, w.a) : '';
      const wc = h('section.card.pad.col-flex.pops-c',
        h('div.row-flex', h('span.pops-ic', M.ic('s:khatma')), h('div.grow', h('b.title-font', 'ورد الختمة'), h('div.small.muted', 'آية أو أكثر من حيث توقفت')), M.switchEl(w.on, v=>{ wset({on:v}); if(v && nat && !canOv) try{ A().requestOverlay(); }catch(e){} draw(); })));
      if(w.on){
        wc.append(h('div.list',
          nat ? row('عند فتح قفل الهاتف', canOv ? 'تعمل' : 'تحتاج إذن الظهور فوق التطبيقات', sw(w.unlock, v=>wset({unlock:v}))) : null,
          row('عند فتح التطبيق', null, sw(w.open, v=>wset({open:v})))),
          h('div.nf-lbl', 'عدد الآيات في كل مرة'), M.seg([['1', n(1)], ['2', n(2)], ['3', n(3)], ['5', n(5)], ['10', n(10)]], String(w.n), v=>{ wset({n:+v}); }),
          h('div.nf-lbl', 'متى تظهر'), M.seg(EV, String(w.every), v=>{ wset({every:+v}); }),
          h('div.pops-pos', h('div.grow', h('div.small.muted', 'موضعك في الختمة'), h('b', pos)),
            h('button.btn.tonal.sm', {onclick:()=>pickPos(draw)}, 'تغيير')),
          h('div.row-flex.pops-btns',
            h('button.btn.grow', {onclick:()=>showWird()}, M.ic('eye'), 'اعرضها الآن'),
            h('button.btn.tonal.grow', {onclick:()=>M.openWirdStats()}, M.ic('s:stats'), 'الإحصائيات')),
          sizeBlock());
        const recs = (M.RECITERS || []).map(r=>[r[0], r[1]]);
        if(recs.length) wc.append(h('div.nf-lbl', 'القارئ عند الاستماع'), h('select.field', {onchange:e=>wset({rec:e.target.value})}, h('option', {value:''}, 'قارئ التطبيق الافتراضي'), ...recs.map(([v, l])=>h('option', {value:v, selected:v === w.rec}, l))));
      }
      if(only !== 'dhikr') root.append(wc);
      /* dhikr: a short dhikr on unlock / open, and whole sets at their times */
      const zc = h('section.card.pad.col-flex.pops-c',
        h('div.row-flex', h('span.pops-ic', M.ic('s:beads')), h('div.grow', h('b.title-font', 'الأذكار المنبثقة'), h('div.small.muted', 'أذكار الصباح والمساء وبعد الصلاة في مواعيدها، وذكر قصير بين الصلوات'))));
      const timed = (k, t, s2, offK, offs, offLbl)=>{
        const on = !!z[k];
        const r = h('div.pops-timed'+(on ? '.on' : ''), row(t, s2, sw(on, v=>{ zset({[k]:v}); if(v && nat && !canOv) try{ A().requestOverlay(); }catch(e){} })));
        if(on && offK) r.append(h('div.pops-off', h('span.small.muted', offLbl), M.seg(offs.map(m=>[String(m), n(m)+' د']), String(z[offK]), v=>zset({[offK]:+v}))));
        return r;
      };
      zc.append(h('div.list.pops-sets',
        timed('morning', 'أذكار الصباح', 'تظهر بعد صلاة الفجر وتمرّ بها ذكرًا ذكرًا', 'offM', [10, 20, 40, 60, 90], 'بعد الفجر بـ'),
        timed('evening', 'أذكار المساء', 'تظهر بعد صلاة العصر', 'offE', [10, 30, 60, 90], 'بعد العصر بـ'),
        timed('after', 'أذكار بعد الصلاة', 'بعد كل فريضة من الصلوات الخمس', 'offA', [5, 10, 15, 25], 'بعد الأذان بـ'),
        timed('between', 'ذكر بين الصلوات', 'في منتصف الوقت بين الصلاتين، ثلاث مرات في اليوم')));
      if(nat) zc.append(h('div.tiny.muted', {style:'line-height:1.8'}, 'إذا كانت الشاشة مقفولة في موعدها تظهر النافذة أول ما تفتح الهاتف خلال ساعة ونصف.'));
      zc.append(h('div.list', row('ذكر قصير عند الفتح', nat ? 'عند فتح قفل الهاتف أو التطبيق' : 'عند فتح التطبيق', M.switchEl(z.on, v=>{ zset({on:v}); if(v && nat && !canOv) try{ A().requestOverlay(); }catch(e){} draw(); }))));
      if(z.on){
        zc.append(h('div.list',
          nat ? row('عند فتح قفل الهاتف', null, sw(z.unlock, v=>zset({unlock:v}))) : null,
          row('عند فتح التطبيق', null, sw(z.open, v=>zset({open:v})))),
          h('div.nf-lbl', 'متى تظهر'), M.seg([['30', 'كل ٣٠ د'], ['60', 'كل ساعة'], ['120', 'كل ساعتين'], ['240', 'كل ٤ س']], String(z.every), v=>zset({every:+v})));
        if(w.on) zc.append(h('div.tiny.muted', 'إذا حان الاثنان معًا يظهر ورد الختمة أولًا، والذكر في المرة التالية.'));
      }
      zc.append(sizeBlock());
      zc.append(h('div.row-flex.pops-btns', h('button.btn.tonal.grow', {onclick:()=>showDhikr({set:'morning'})}, 'جرّب الصباح'), h('button.btn.tonal.grow', {onclick:()=>showDhikr()}, 'جرّب ذكرًا قصيرًا')));
      if(only !== 'wird') root.append(zc);
      if(nat) root.append(h('div.tiny.muted', {style:'line-height:1.8;margin:0 4px'}, 'يعمل ذلك بخدمة صغيرة يظهر لها إشعار ثابت هادئ (يطلبه أندرويد لأي تطبيق يعمل في الخلفية). يمكنك إخفاء هذا الإشعار من إعدادات إشعارات التطبيق ← «نافذة الورد».'));
      else root.append(h('div.tiny.muted', {style:'line-height:1.8;margin:0 4px'}, 'على آيفون والمتصفح لا يُسمح لأي تطبيق بالظهور عند فتح قفل الهاتف، لذلك تظهر النافذة عند فتح التطبيق.'));
    }
    draw();
    const vis = ()=>{ if(!root.isConnected){ document.removeEventListener('visibilitychange', vis); return; } if(!document.hidden) setTimeout(draw, 400); };
    document.addEventListener('visibilitychange', vis);   // back from the permission / battery pages
  }});
};
function pickPos(after){
  const w = wcfg();
  const sel = h('select.field', ...M.Q.surahs.map((x, i)=>h('option', {value:i + 1, selected:i + 1 === w.s}, n(i + 1)+'. '+x.ar)));
  const ay = h('input.field', {type:'number', min:1, value:w.a, inputMode:'numeric'});
  const sh = M.sheet({title:'موضعك في الختمة', content:h('div.col-flex', h('div.small.muted', 'السورة'), sel, h('div.small.muted', 'الآية'), ay,
    h('button.btn.block', {onclick:()=>{ const s = +sel.value, a = Math.max(1, Math.min(M.Q.surahs[s - 1].n, +ay.value || 1)); wset({s, a}); sh.close(); after && after(); }}, 'حفظ'),
    h('button.btn.tonal.block', {onclick:()=>{ const l = M.QD.last || {}; if(l.sura){ wset({s:l.sura, a:l.ayah || 1}); sh.close(); after && after(); } else M.toast('لم تقرأ في المصحف بعد'); }}, 'من حيث توقفت في المصحف'),
    h('button.btn.tonal.block', {onclick:()=>{ wset({s:1, a:1}); sh.close(); after && after(); }}, 'من أول المصحف'))});
}
M.openWirdStats = function(){
  if(!M.openView) return;
  M.openView({id:'wirdstats', title:'إحصائيات الورد', build:b=>{ M.loadQuran().then(()=>{ const w = wcfg();
    b.append(h('div.card.pad.col-flex', h('div.small.muted', 'موضعك الآن'), h('b', posLabel(w.s, w.a)), h('div.pop-bar', h('i', {style:'width:'+(M.aid(w.s, w.a) / TOTAL * 100).toFixed(2)+'%'}))),
      h('div.card.pad', statsPanel(stats())), h('button.btn.block', {onclick:()=>showWird()}, M.ic('quran'), 'اقرأ وردك الآن')); }); }});
};
/* in the khatma screen: the verse khatma card (position, today, read now, settings, statistics) */
M.khatmaExtra = function(redraw){
  const w = wcfg(); let pos = ''; try{ if(M.Q.ready) pos = posLabel(w.s, w.a); }catch(e){}
  const st = stats();
  return h('section.card.pad.col-flex.pops-kh',
    h('div.row-flex', h('span.pops-ic', M.ic('s:khatma')), h('div.grow', h('b.title-font', 'ورد الآيات المنبثق'), h('div.small.muted', w.on ? (NATIVE() ? 'يظهر عند فتح قفل الهاتف' : 'يظهر عند فتح التطبيق') : 'متوقف')),
      M.switchEl(!!w.on, v=>{ wset({on:v}); if(v && NATIVE() && A().canOverlay && !A().canOverlay()) try{ A().requestOverlay(); }catch(e){} redraw && redraw(); })),
    pos ? h('div.pops-pos', h('div.grow', h('div.small.muted', 'موضعك'), h('b', pos)), h('div.pops-today', h('b.num', n(st.today)), h('small', 'آية اليوم'))) : null,
    h('div.row-flex.pops-btns',
      h('button.btn.grow', {onclick:()=>showWird()}, M.ic('quran'), 'اقرأ الآن'),
      h('button.btn.tonal', {'aria-label':'الإحصائيات', onclick:()=>M.openWirdStats()}, M.ic('s:stats')),
      h('button.btn.tonal', {'aria-label':'الإعدادات', onclick:()=>M.openPopups('wird')}, M.ic('settings'))));
};
/* in the adhkar screen: the adhkar pop-ups */
if(!IS_PAGE && M.screens && M.screens.adhkar && !M.screens.adhkar.__pop){
  const ob = M.screens.adhkar.build;
  M.screens.adhkar.build = function(el){
    const r = ob.apply(this, arguments);
    try{
      const z = zcfg(), on = [z.morning && 'الصباح', z.evening && 'المساء', z.after && 'بعد الصلاة', z.between && 'بين الصلوات'].filter(Boolean);
      const card = h('button.card.pad.pops-adh', {onclick:()=>M.openPopups('dhikr')},
        h('span.pops-ic', M.ic('s:beads')), h('div.grow', h('div.bold.title-font', 'الأذكار المنبثقة'), h('div.small.muted', on.length ? 'تظهر في وقتها: '+on.join('، ') : (z.on ? 'ذكر قصير عند الفتح' : 'تظهر لك الأذكار في مواعيدها — اضغط للتفعيل'))), M.ic('fwd'));
      const promo = el.querySelector('.tasbih-promo'); if(promo) promo.after(card); else el.append(card);
    }catch(e){}
    return r;
  };
  M.screens.adhkar.__pop = true;
}

/* ---------------- the Android pop-up page ---------------- */
if(IS_PAGE){
  try{ M.applyTheme && M.applyTheme(); }catch(e){}
  /* over other apps the card floats in a window just its own size (Android sizes the window from what we report) */
  let floating = false; try{ floating = !!(A() && A().popupFloating && A().popupFloating()); }catch(e){}
  if(floating){
    const de = document.documentElement; de.classList.add('pop-float'); de.style.setProperty('--sh', (screen.height || 800)+'px');
    let last = 0;
    const report = ()=>{ const c = document.querySelector('.pop-card'); if(!c) return; const hh = Math.ceil(c.getBoundingClientRect().height + 16); if(Math.abs(hh - last) > 2){ last = hh; try{ A().popupSize(hh); }catch(e){} } };
    try{ new MutationObserver(()=>requestAnimationFrame(report)).observe(document.body, {childList:true, subtree:true, characterData:true}); }catch(e){}
    try{ new ResizeObserver(()=>report()).observe(document.body); }catch(e){}
    setInterval(report, 600);
  }
  const kind = (new URLSearchParams(location.search).get('kind') || 'wird');
  const q = new URLSearchParams(location.search), set = (q.get('set') || '').split(':');
  const start = async()=>{ const ok = kind === 'dhikr' ? await showDhikr({set:set[0], pr:set[1]}) : await showWird(); if(!ok){ try{ A().closePopup(); }catch(e){} } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}
})();
