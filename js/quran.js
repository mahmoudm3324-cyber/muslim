/* ===== Quran screen (index/search/bookmarks) + global audio player ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
M.screens = M.screens || {};
const AR = M.AR_DIGITS;
M.arNum = n=>M.n(n); // follows the digits setting everywhere

/* =================== Global audio player =================== */
const P = M.player = {
  a: new Audio(), s:0, ayah:0, playing:false, loading:false,
  eachLeft:0, range:null, // {s, from, to, each, loops, loopsLeft}
  queue:null, loopAyah:false, loopSurah:false, queueLoop:false, // set by the Quran player (v2-qplayer.js)
  _pre: null
};
P.a.preload = 'auto';
if(M.segArm) M.segArm(P.a);   // reciters recorded by surah: a verse is a slice of the file
function label(){ return P.s ? 'سورة '+M.sname(P.s)+' • آية '+M.arNum(P.ayah) : ''; }
P.label = label;
P.key = ()=>P.s ? P.s+':'+P.ayah : null;
function emitP(){ M.emit('player', P); updateMini(); }
P.play = async function(s, a, opts){
  await M.loadQuran();
  opts = opts || {};
  P.s = s; P.ayah = a; P.playing = true; P.loading = true;
  if(!opts.keepRange) P.range = null;
  P.eachLeft = (P.range ? P.range.each : M.cfg.repeat) - 1;
  if(M.recReady) await M.recReady();
  if(P.s !== s || P.ayah !== a) return;   // moved on while the timings loaded
  P.a.src = M.audioURL(s, a);
  P.a.playbackRate = M.cfg.speed || 1;
  try{ await P.a.play(); }catch(e){ if(e && e.name === 'AbortError') return;   /* stopped or skipped while buffering */
    if(e && e.name === 'NotAllowedError'){ P.playing = false; } else { M.toast('تعذّر تشغيل التلاوة — تحقق من الاتصال بالإنترنت'); P.playing = false; } }
  P.loading = false;
  prefetch();
  setMedia();
  emitP();
  M.store.set('lastAudio', {s, a});
};
function nextAyah(s, a){
  const n = M.Q.surahs[s-1].n;
  if(a < n) return [s, a+1];
  if(s < 114) return [s+1, 1];
  return null;
}
function prefetch(){
  const nx = nextAyah(P.s, P.ayah); if(!nx) return;
  if(M.isSegReciter && M.isSegReciter()) return;   // one file per surah: the next verse is already in it
  try{ if(!P._pre) P._pre = new Audio(); P._pre.preload = 'auto'; P._pre.src = M.audioURL(nx[0], nx[1]); }catch(e){}
}
P.toggle = function(){
  if(!P.s){ const l = M.store.get('lastAudio'); const q = M.QD.last; return P.play((l && l.s) || q.sura, (l && l.a) || q.ayah); }
  if(P.a.paused){ P.a.play().catch(()=>{}); P.playing = true; } else { P.a.pause(); P.playing = false; }
  emitP();
};
P.stop = function(){ P.a.pause(); P.playing = false; P.s = 0; P.ayah = 0; P.range = null; P.queue = null; emitP(); };
/* the last ayah of a surah finished while a queue / surah-loop is active (Quran player) */
P.surahEnded = function(){
  const s = P.s; try{ M.emit('surahend', {s}); }catch(e){}
  if(!P.s) return;                                   // a listener (sleep timer) stopped the player
  if(P.loopSurah) return P.play(s, 1);
  if(P.queue){ const i = P.queue.indexOf(s), nx = P.queue[i + 1]; if(nx) return P.play(nx, 1); if(P.queueLoop && P.queue.length) return P.play(P.queue[0], 1); }
  P.a.pause(); P.playing = false; P.s = 0; P.ayah = 0; P.queue = null; emitP();
};
P.next = function(){
  if(!P.s) return;
  if(P.range){ return advance(true); }
  const nx = nextAyah(P.s, P.ayah); if(nx) P.play(nx[0], nx[1]); else P.stop();
};
P.prev = function(){
  if(!P.s) return;
  if(P.ayah > 1) P.play(P.s, P.ayah - 1, {keepRange:true});
  else if(P.s > 1) P.play(P.s - 1, M.Q.surahs[P.s-2].n);
};
P.setSpeed = function(v){ M.save('speed', v); P.a.playbackRate = v; emitP(); };
P.playRange = function(s, from, to, each, loops){
  P.range = {s, from, to, each: each || 1, loops: loops || 1, loopsLeft: (loops || 1) - 1};
  P.play(s, from, {keepRange:true});
};
function advance(force){
  if(P.range){
    const r = P.range;
    if(!force && P.eachLeft > 0){ P.eachLeft--; (M.segRestart ? M.segRestart(P.a) : (P.a.currentTime = 0)); P.a.play().catch(()=>{}); return; }
    if(P.ayah < r.to){ return P.play(P.s, P.ayah + 1, {keepRange:true}); }
    if(r.loopsLeft > 0 || r.loops === 0){ if(r.loops !== 0) r.loopsLeft--; return P.play(r.s, r.from, {keepRange:true}); }
    P.stop(); return;
  }
  if(P.loopAyah && !force){ (M.segRestart ? M.segRestart(P.a) : (P.a.currentTime = 0)); P.a.play().catch(()=>{}); return; }
  if(!force && P.eachLeft > 0){ P.eachLeft--; (M.segRestart ? M.segRestart(P.a) : (P.a.currentTime = 0)); P.a.play().catch(()=>{}); return; }
  if(M.cfg.repeat === 0 && !force){ (M.segRestart ? M.segRestart(P.a) : (P.a.currentTime = 0)); P.a.play().catch(()=>{}); return; }
  const nx = nextAyah(P.s, P.ayah);
  if((P.queue || P.loopSurah) && (!nx || nx[0] !== P.s)) return P.surahEnded();
  if(!nx || (!M.cfg.autoNext && nx[0] !== P.s)){ P.playing = false; P.s = 0; P.ayah = 0; emitP(); return; }
  P.play(nx[0], nx[1]);
}
P.a.addEventListener('ended', ()=>advance(false));
P.a.addEventListener('error', ()=>{ if(P.s && P.playing){ P.playing = false; M.toast('تعذّر تحميل التلاوة — تحقق من الاتصال'); emitP(); } });
P.a.addEventListener('pause', ()=>{ if(!P.a.ended){ P.playing = !P.a.paused; emitP(); } });
P.a.addEventListener('play', ()=>{ P.playing = true; emitP(); });
function setMedia(){
  try{
    if('mediaSession' in navigator){
      navigator.mediaSession.metadata = new MediaMetadata({title: label(), artist: (M.RECITERS.find(r=>r[0] === M.cfg.reciter) || [])[1] || '', album:'القرآن الكريم'});
      navigator.mediaSession.setActionHandler('play', ()=>P.toggle());
      navigator.mediaSession.setActionHandler('pause', ()=>P.toggle());
      navigator.mediaSession.setActionHandler('nexttrack', ()=>P.next());
      navigator.mediaSession.setActionHandler('previoustrack', ()=>P.prev());
    }
  }catch(e){}
}

/* ---- mini player (floating above the tab bar) ---- */
let mini;
function updateMini(){
  if(!mini){
    mini = h('div.miniplayer.hide',
      h('button.icon-btn.tonal', {'aria-label':'تشغيل/إيقاف', onclick:()=>P.toggle()}, h('span.mp-ico')),
      h('button.mp-info.grow', {onclick:()=>{ if(!P.s) return; if(M.openQuranPlayer){ if(!document.getElementById('view-qplayer')) M.openQuranPlayer(); } else M.openReader({sura:P.s, ayah:P.ayah, select:true}); }}, h('div.mp-t'), h('div.mp-s.small.muted')),
      h('button.icon-btn', {'aria-label':'التالي', onclick:()=>P.next()}, M.ic('next')),
      h('button.icon-btn', {'aria-label':'إيقاف', onclick:()=>P.stop()}, M.ic('close')));
    M.$('#app').appendChild(mini);
  }
  const on = !!P.s;
  mini.classList.toggle('hide', !on);
  document.documentElement.classList.toggle('has-mini', on);
  if(on){
    mini.querySelector('.mp-ico').innerHTML = M.icon(P.playing ? 'pause' : 'play');
    mini.querySelector('.mp-t').textContent = label();
    mini.querySelector('.mp-s').textContent = (M.RECITERS.find(r=>r[0] === M.cfg.reciter) || [])[1] || '';
  }
}
M.on('player', updateMini);
M.updateMini = updateMini;

/* =================== Quran tab =================== */
const st = M.qState = {tab:'surah', q:''};
M.screens.quran = {
  icon:'s:mushaf', label:'المصحف',
  build(el){
    el.innerHTML = '';
    const last = M.QD.last;
    const open = id=>()=>{ if(M.sectionOpen) M.sectionOpen(id); };
    const favN = M.QD.bookmarks.length + Object.keys(M.QD.notes).length + Object.keys(M.QD.highlights).length;
    el.append(h('div.page-top', h('div', h('h1', 'المصحف الشريف'), h('div.sub', 'القرآن الكريم برواية حفص عن عاصم')),
      h('div.row-flex.gap-s',
        h('button.icon-btn.tonal', {'aria-label':'وضع القراءة', onclick:()=>modeSheet()}, M.ic(M.cfg.readMode === 'pages' ? 'pages' : 'scroll')),
        h('button.icon-btn.tonal', {'aria-label':'الإعدادات', onclick:()=>M.openSettings('quran')}, M.ic('settings')))));
    /* --- where you are: continue reading (and listening) + today's portion --- */
    const ready = M.Q.ready;
    const juz = ready && M.juzOfPage ? M.juzOfPage(last.page) : 0;
    const wd = M.wirdToday ? M.wirdToday() : {goal:4, read:0, pct:0};
    const playing = M.player && M.player.playing;
    el.append(h('div.qx-hero',
      h('button.qx-hero-main', {onclick:()=>M.openReader({page:last.page, sura:last.sura, ayah:last.ayah}), 'aria-label':'تابع القراءة'},
        h('div.qx-k', 'تابع القراءة'),
        h('div.qx-t.title-font', 'سورة '+(ready ? M.sname(last.sura) : '…')),
        h('div.qx-m', 'الآية '+M.arNum(last.ayah)+' • صفحة '+M.arNum(last.page)+(juz ? ' • الجزء '+M.arNum(juz) : '')),
        h('div.qx-bar', {'aria-hidden':'true'}, h('i', {style:'width:'+(last.page / 604 * 100).toFixed(1)+'%'}))),
      h('div.qx-hero-acts',
        h('button.btn.sm.qx-read', {onclick:()=>M.openReader({page:last.page, sura:last.sura, ayah:last.ayah})}, M.ic('s:mushaf'), 'اقرأ'),
        h('button.btn.sm.tonal.qx-listen', {onclick:()=>{ if(playing) M.player.toggle(); else if(M.player) M.player.play(last.sura, last.ayah); setTimeout(()=>M.screens.quran.build(el), 300); }}, M.ic(playing ? 'pause' : 'play'), playing ? 'إيقاف' : 'استمع'))));
    el.append(h('button.qx-wird', {onclick:()=>M.openKhatma && M.openKhatma()},
      M.ring(wd.pct, 46, 5, M.n(Math.round(wd.pct * 100))+'٪'),
      h('div.grow', h('div.bold', 'الورد اليومي'), h('div.small.muted', M.n(wd.read)+' من '+M.cnt(wd.goal, 'صفحة', true)+' اليوم')),
      h('span.qx-go', M.ic('fwd'))));
    /* --- the surahs read most: two rows that wrap, never cut at the screen edge --- */
    const QS = [[18,'الكهف'],[36,'يس'],[67,'الملك'],[55,'الرحمن'],[56,'الواقعة'],[2,'البقرة'],[32,'السجدة'],[112,'الإخلاص']];
    el.append(h('div.section-h.qx-h', 'سور تقرأها كثيرًا'), h('div.qx-quick', ...QS.map(([id, n])=>h('button.qx-chip', {onclick:()=>M.openReader({sura:id, ayah:1})}, h('b', n), h('small.num', M.arNum(id))))));
    /* --- every tool of the mushaf in one even grid --- */
    const tile = (ic, t, fn, badge)=>h('button.qx-tile', {onclick:fn}, h('span.qx-ic', {html:M.icon(ic)}), h('span.qx-tt', t), badge ? h('span.fav-n', M.n(badge > 99 ? 99 : badge)) : null);
    const tools = [
      tile('check', 'الختمة', ()=>M.openKhatma && M.openKhatma()),
      M.openHifz ? tile('repeat', 'التحفيظ', open('hifz')) : null,
      M.openTasmee ? tile('mic', 'التسميع', ()=>M.openTasmee()) : null,
      tile('bookmark', 'العلامات', ()=>{ const host = h('div.fav-sheet'); renderMarks(host); M.sheet({title:'العلامات والملاحظات', content:host}); }, favN),
      tile('volume', 'القرّاء', ()=>M.openReciters && M.openReciters(()=>M.screens.quran.build(el))),
      tile('play', 'المشغّل', open('qplayer')),
      tile('s:tafsir', 'التفسير', ()=>transSheet()),
      M.openTajweed ? tile('sparkle', 'التجويد', open('tajweed')) : null,
      M.openMushafEditions ? tile('layers', 'الطبعات', ()=>M.openMushafEditions()) : null,
      tile('download', 'التنزيلات', ()=>M.openDownloads && M.openDownloads()),
      tile('search', 'إلى صفحة', ()=>M.goToPageSheet && M.goToPageSheet()),
      tile(M.cfg.readMode === 'pages' ? 'pages' : 'scroll', 'وضع القراءة', ()=>modeSheet())].filter(Boolean);
    el.append(h('div.section-h.qx-h', 'أدوات المصحف'), h('div.qx-tools', ...tools),
      h('div.section-h.qx-h#qh-index', 'الفهرس والبحث'));
    if(!M.Q.ready){
      M.loadQuran().then(()=>{ if(M.curTab === 'quran') M.screens.quran.build(el); });
      el.append(h('div.empty', 'جارٍ تحميل المصحف…'));
      return;
    }
    if(st.tab === 'marks') st.tab = 'surah';
    const seg = M.seg([['surah','السور'],['juz','الأجزاء'],['hizb','الأحزاب'],['pages','الصفحات']], st.tab, v=>{ st.tab = v; renderList(); });
    const q = h('input.field', {placeholder:'ابحث بالاسم أو في نص الآيات…', value:st.q, type:'search', enterkeyhint:'search', oninput:M.debounce(e=>{ st.q = e.target.value; renderList(); }, 180)});
    const listHost = h('div.q-list');
    el.append(h('div.sec-sticky.qx-idx', seg, q), listHost);
    function renderList(){
      listHost.innerHTML = '';
      if(st.tab === 'surah') renderSurahs(listHost);
      else if(st.tab === 'juz') renderJuz(listHost);
      else if(st.tab === 'pages') renderPages(listHost);
      else renderHizb(listHost);
    }
    renderList();
  }
};
function snum(n){ return h('span.snum', M.arNum(n)); }
function renderSurahs(host){
  const Q = M.Q, q = M.normAr(st.q.trim());
  let list = Q.surahs;
  if(q){ list = list.filter(s=>M.normAr(s.ar).includes(q) || s.tr.toLowerCase().includes(st.q.trim().toLowerCase()) || String(s.id) === q); }
  const card = h('div.card.list');
  list.forEach(s=>{
    card.append(h('button.item', {onclick:()=>M.openReader({sura:s.id, ayah:1})},
      snum(s.id), h('div.grow', h('div.t.title-font', 'سورة '+s.ar), h('div.s', (s.mk ? 'مكية' : 'مدنية')+' • '+M.cnt(s.n, 'آية').replace(' ', '\u00a0')+' • ص\u00a0'+M.arNum(s.page))),
      h('div.trail.small.sur-tr', s.tr)));
  });
  if(list.length) host.append(card);
  // verse text search
  if(q.length >= 2){
    const ids = M.searchQuran(st.q, 60);
    if(ids.length){
      host.append(h('div.section-h', 'نتائج في الآيات', h('small', ids.length >= 60 ? 'أول 60 نتيجة' : M.arNum(ids.length)+' نتيجة')));
      const c2 = h('div.card.list');
      const qw = q.split(/\s+/).filter(Boolean);
      ids.forEach(id=>{
        const [s, a] = M.fromAid(id);
        const words = Q.ayahs[id].split(' ');
        const t = h('div.qfont.res-t');
        words.forEach(w=>{ const nw = M.normAr(w); const hit = qw.some(x=>nw.includes(x)); t.append(hit ? h('mark', w) : document.createTextNode(w), ' '); });
        c2.append(h('button.item.res', {onclick:()=>M.openReader({sura:s, ayah:a, select:true})},
          h('div.grow', t, h('div.s', 'سورة '+M.sname(s)+' • آية '+M.arNum(a)+' • صفحة '+M.arNum(M.pageOf(s, a))))));
      });
      host.append(c2);
    } else if(!list.length) host.append(h('div.empty', 'لا توجد نتائج'));
  } else if(!list.length) host.append(h('div.empty', 'لا توجد نتائج'));
}
function snippet(s, a){ const t = M.ayahText(s, a); return t.split(' ').slice(0, 6).join(' ')+'…'; }
function renderJuz(host){
  const card = h('div.card.list');
  M.Q.meta.juz.forEach(([s, a], i)=>{
    card.append(h('button.item', {onclick:()=>M.openReader({sura:s, ayah:a})},
      snum(i+1), h('div.grow', h('div.t.title-font', 'الجزء '+M.arNum(i+1)), h('div.s.qfont', snippet(s, a))),
      h('div.trail.small', 'ص '+M.arNum(M.pageOf(s, a)))));
  });
  host.append(card);
}
function renderPages(host){
  const last = M.QD.last.page, bm = new Set(M.QD.bookmarks.filter(b=>b.page).map(b=>b.page));
  const g = h('div.pages-grid');
  for(let p = 1; p <= 604; p++) g.append(h('button.pg-cell'+(p === last ? '.cur' : '')+(bm.has(p) ? '.bm' : ''), {onclick:()=>M.openReader({page:p})}, M.arNum(p)));
  host.append(g);
}
function renderHizb(host){
  const hz = M.Q.meta.hizb;
  const names = ['الربع الأول','الربع الثاني','الربع الثالث','الربع الرابع'];
  for(let hI = 0; hI < 60; hI++){
    const c = h('div.card.list', {style:'margin-top:12px'});
    c.append(h('div.hz-h.title-font', 'الحزب '+M.arNum(hI+1)));
    for(let q = 0; q < 4; q++){
      const [s, a] = hz[hI*4 + q];
      c.append(h('button.item', {onclick:()=>M.openReader({sura:s, ayah:a})}, q === 0 ? h('span.qstar', M.arNum(hI+1)) : h('span.qpie', {style:'--p:'+(q * 25)+'%'}), h('div.grow', h('div.t', names[q]), h('div.s.qfont', snippet(s, a))), h('div.trail.small', 'ص '+M.arNum(M.pageOf(s, a)))));
    }
    host.append(c);
  }
}
function renderMarks(host){
  const bms = M.QD.bookmarks, hls = M.QD.highlights, notes = M.QD.notes;
  host.append(h('div.section-h', 'العلامات المرجعية', h('small', M.arNum(bms.length))));
  if(!bms.length) host.append(h('div.card.pad.empty', 'لا توجد علامات بعد. اضغط على آية ثم أيقونة العلامة.'));
  else{
    const c = h('div.card.list');
    bms.slice().reverse().forEach(b=>{
      const title = b.page && !b.sura ? 'صفحة '+M.arNum(b.page) : 'سورة '+M.sname(b.sura)+' • آية '+M.arNum(b.ayah);
      c.append(h('button.item', {onclick:()=>M.openReader(b.sura ? {sura:b.sura, ayah:b.ayah, select:true} : {page:b.page})},
        h('span.lead', {html:M.icon('bookmark')}), h('div.grow', h('div.t', title), b.sura ? h('div.s.qfont', snippet(b.sura, b.ayah)) : null),
        h('span.icon-btn', {onclick:e=>{ e.stopPropagation(); M.QD.bookmarks = M.QD.bookmarks.filter(x=>!(x.sura === b.sura && x.ayah === b.ayah && x.page === b.page)); M.screens.quran.build(M.$('#screen-quran')); }}, M.ic('trash'))));
    });
    host.append(c);
  }
  const nk = Object.keys(notes);
  host.append(h('div.section-h', 'الملاحظات والخواطر', h('small', M.arNum(nk.length)), ));
  if(!nk.length) host.append(h('div.card.pad.empty', 'دوّن خواطرك على الآيات من شريط الآية.'));
  else{
    const c = h('div.card.list');
    nk.forEach(k=>{ const [s, a] = k.split(':').map(Number);
      c.append(h('button.item', {onclick:()=>M.openReader({sura:s, ayah:a, select:true})}, h('div.grow', h('div.t', 'سورة '+M.sname(s)+' • آية '+M.arNum(a)), h('div.s', notes[k].slice(0, 90)))));
    });
    host.append(c);
    host.append(h('div', {style:'margin-top:10px'}, h('button.btn.tonal.block', {onclick:()=>{
      const txt = nk.map(k=>{ const [s, a] = k.split(':').map(Number); return '﴿'+M.ayahText(s, a)+'﴾ ['+M.sname(s)+': '+M.arNum(a)+']\n'+notes[k]; }).join('\n\n');
      M.share('خواطري على القرآن الكريم\n\n'+txt);
    }}, M.ic('share'), 'تصدير الملاحظات')));
  }
  const hk = Object.keys(hls);
  host.append(h('div.section-h', 'الآيات المظلّلة', h('small', M.arNum(hk.length))));
  if(!hk.length) host.append(h('div.card.pad.empty', 'ظلّل الآيات بألوان من شريط الآية.'));
  else{
    const c = h('div.card.list');
    hk.forEach(k=>{ const [s, a] = k.split(':').map(Number);
      c.append(h('button.item', {onclick:()=>M.openReader({sura:s, ayah:a, select:true})}, h('span.dotc', {style:'background:'+hls[k]}), h('div.grow', h('div.t', 'سورة '+M.sname(s)+' • آية '+M.arNum(a)), h('div.s.qfont', snippet(s, a)))));
    });
    host.append(c);
  }
}
function transSheet(){
  const body = h('div.col-flex',
    h('div.bold', 'لغة الترجمة'), M.chips(M.TRANSLATIONS, M.cfg.translation, v=>M.save('translation', v)),
    h('div.bold', 'كتاب التفسير'), M.chips(M.TAFSIRS, M.cfg.tafsir, v=>M.save('tafsir', v)),
    h('div.row-flex', h('div.grow', h('div.bold', 'النقل الحرفي'), h('div.small.muted', 'كتابة الآية بحروف لاتينية')), M.switchEl(M.cfg.translit, v=>M.save('translit', v))),
    h('div.tiny.muted', 'يظهران عند الضغط المطوّل على الآية وفي التمرير الطولي. التفسير يتطلب الإنترنت أول مرة.'));
  M.sheet({title:'التفسير والترجمة', content:body});
}
function modeSheet(){
  const body = h('div.col-flex',
    h('div.muted.small', 'اختر طريقة القراءة المفضّلة (يمكن التبديل أثناء القراءة):'),
    M.seg([['pages','نظام الصفحات'],['scroll','التمرير الطولي']], M.cfg.readMode, v=>{ M.save('readMode', v); M.screens.quran.build(M.$('#screen-quran')); }));
  M.sheet({title:'وضع القراءة', content:body});
}
M.modeSheet = modeSheet;
})();
