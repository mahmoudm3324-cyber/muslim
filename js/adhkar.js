/* ===== Adhkar & supplications ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
M.screens = M.screens || {};
const D = M.ADHKAR;

const PROG_KEY = 'adhkarProg';
function prog(){ return M.store.get(PROG_KEY, {}); }
function saveProg(p){
  const keys = Object.keys(p).sort(); while(keys.length > 14){ delete p[keys.shift()]; }
  M.store.set(PROG_KEY, p);
}
const favs = ()=>new Set(M.store.get('adhkarFavs', []));
const saveFavs = s=>M.store.set('adhkarFavs', Array.from(s));

// textual helpers
async function textOf(it, variant){
  const r = await textOf0(it, variant); return M.cfg.noTashkeel ? r.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') : r;
}
async function textOf0(it, variant){
  if(it.ref){
    await M.loadQuran();
    return it.ref.map(r=>{ const [s, a] = r.split(':').map(Number); return M.ayahText(s, a); }).join(' ')+' ';
  }
  if(typeof it.t === 'object') return it.t[variant || 'm'];
  return it.t;
}
function prayerKeyNow(){ try{ const i = M.nextPrayer(); const prev = i.prev.k; return prev === 'sunrise' ? 'fajr' : prev; }catch(e){ return 'fajr'; } }

const CATS = [
 {id:'morning', title:'أذكار الصباح', icon:'sunrise', desc:'من الفجر حتى الضحى', trk:'adhkar_morning'},
 {id:'evening', title:'أذكار المساء', icon:'moon', desc:'من العصر حتى المغرب', trk:'adhkar_evening'},
 {id:'after', title:'أذكار بعد الصلاة', icon:'mosque', desc:'بعد كل فريضة'},
 {id:'sleep', title:'أذكار النوم', icon:'star', desc:'قبل النوم', trk:'misc_sleep'},
 {id:'wake', title:'أذكار الاستيقاظ', icon:'sun', desc:'عند الاستيقاظ من النوم', trk:'fajr_wake'},
 {id:'misc', title:'أذكار متنوعة', icon:'beads', desc:'الخلاء، الوضوء، المنزل، المسجد…'},
 {id:'duas', title:'أدعية من القرآن', icon:'quran', desc:'أدعية الأنبياء والصالحين'},
 {id:'favs', title:'المفضلة', icon:'heart', desc:'أذكارك المحفوظة'},
 {id:'mine', title:'دعواتي', icon:'note', desc:'للوالدين والأحباب والخاصة'}
];

function itemsFor(cat, ctx){
  if(cat === 'morning' || cat === 'evening'){
    const v = cat === 'morning' ? 'm' : 'e';
    const out = D.MORNING_EVENING.filter(i=>!i.only || i.only === v).map(i=>({...i, v, id:cat+'_'+i.id, n:(M.cfg.dua100 && i.id === 'tahlil' && i.n < 100) ? 100 : i.n}));
    if(cat === 'evening' && M.cfg.eveBaqara) out.push({id:'eve_baqara', ref:['2:285','2:286'], n:1, src:'البقرة: ٢٨٥–٢٨٦', g:'صحيح', fadl:'«مَنْ قَرَأَ بِالْآيَتَيْنِ مِنْ آخِرِ سُورَةِ الْبَقَرَةِ فِي لَيْلَةٍ كَفَتَاهُ» — متفق عليه'});
    if(cat === 'evening' && M.cfg.eveIstighfar) out.push({id:'eve_istighfar', t:'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', n:100, src:'رواه البخاري', g:'صحيح', fadl:'كان النبي ﷺ يستغفر الله في اليوم أكثر من سبعين مرة'});
    return out;
  }
  if(cat === 'after'){
    const three = ctx && (ctx.prayer === 'fajr' || ctx.prayer === 'maghrib');
    const out = [];
    D.AFTER_PRAYER.forEach(i=>{
      if(i.id === 'mu3awwi'){
        const n = three ? 3 : 1;
        out.push({...i, n, id:'ap_'+i.id}, {id:'ap_falaq', ref:['113:1','113:2','113:3','113:4','113:5'], n, src:'سورة الفلق', g:'صحيح'}, {id:'ap_nas', ref:['114:1','114:2','114:3','114:4','114:5','114:6'], n, src:'سورة الناس', g:'صحيح'});
      } else out.push({...i, id:'ap_'+i.id});
    });
    return out;
  }
  if(cat === 'sleep') return D.SLEEP; if(cat === 'wake') return D.WAKE; if(cat === 'duas') return D.DUAS.map(d=>({...d, n:1, title:d.title}));
  return [];
}
function allItemsMap(){
  const m = {};
  ['morning','evening','after','sleep','wake','duas'].forEach(c=>itemsFor(c, {prayer:'fajr'}).forEach(i=>m[i.id] = {...i, cat:c}));
  D.MISC.forEach(g=>g.items.forEach((i, k)=>{ m[g.id+'_'+k] = {...i, id:g.id+'_'+k, cat:'misc', title:g.title+' — '+i.lbl}; }));
  return m;
}

/* ---- screen ---- */
M.screens.adhkar = {
  icon:'s:beads', label:'الأذكار',
  build(el){
    el.innerHTML = '';
    const today = prog()[M.dkey()] || {};
    el.append(h('div.page-top', h('div', h('h1', 'الأذكار والأدعية'), h('div.sub', 'حصن المسلم — مع المصدر ودرجة الحديث')),
      h('button.icon-btn.tonal', {'aria-label':'المسبحة', onclick:()=>M.openTasbih()}, M.ic('s:counter'))));
    el.append(h('button.card.accent.pad.tasbih-promo', {onclick:()=>M.openTasbih()}, h('div.row-flex', h('div.grow', h('div.bold.title-font', 'المسبحة الإلكترونية'), h('div.small.muted', 'عدّاد بالاهتزاز والصوت مع أهداف يومية')), h('div.promo-ic', {html:M.icon('beads')}))));
    const grid = h('div.grid2.catgrid');
    CATS.forEach(c=>{
      let pct = null;
      if(c.id === 'morning' || c.id === 'evening'){ const its = itemsFor(c.id); const done = its.filter(i=>(today[i.id] || 0) >= i.n).length; pct = its.length ? done / its.length : 0; }
      grid.append(h('button.card.cat', {onclick:()=>openCategory(c.id)},
        h('div.cat-ic', {html:M.icon(c.icon)}), h('div.bold', c.title), h('div.tiny.muted', c.desc),
        pct != null ? h('div.bar.sm', h('i', {style:'width:'+Math.round(pct*100)+'%'})) : null));
    });
    el.append(grid);
  }
};

function openCategory(cat, ctx){
  const meta = CATS.find(c=>c.id === cat);
  ctx = ctx || {};
  const SND = {morning:'r_morning', evening:'r_evening'};
  const actions = SND[cat] && M.playSound ? [h('button.icon-btn', {'aria-label':'استماع', onclick:function(){ M.playSound(SND[cat]); }}, M.ic('volume'))] : [];
  const view = M.openView({id:'adhkar-'+cat, title:meta.title, actions, onClose:()=>{ if(SND[cat] && M.stopSound) M.stopSound(); if(M.cfg.keepAwake && M.keepAwake) M.keepAwake(false); }});
  const body = view.body;
  if(cat === 'misc') return drawMisc(body, view);
  if(cat === 'favs') return drawFavs(body);
  if(cat === 'mine') return drawMine(body);
  if(cat === 'after'){
    ctx.prayer = ctx.prayer || prayerKeyNow();
    const chips = M.chips([['fajr','الفجر'],['dhuhr','الظهر'],['asr','العصر'],['maghrib','المغرب'],['isha','العشاء']], ctx.prayer, v=>{ ctx.prayer = v; draw(); });
    body.append(chips);
  }
  if(M.cfg.keepAwake && M.keepAwake){ M.keepAwake(true); }
  if(M.cfg.showNextBar){ const nb = h('div.chip.on', {style:'width:100%;justify-content:center;margin-bottom:8px'}); const tk = ()=>{ try{ const i = M.nextPrayer(); nb.textContent = (i.next.k === 'sunrise' ? 'الشروق' : 'صلاة '+M.prayerLabel(i.next.k))+' بعد '+M.n(M.fmtDur(i.next.t - new Date())); }catch(e){} }; tk(); const un = M.every(()=>{ if(!nb.isConnected){ un(); return; } tk(); }); body.append(nb); }
  const list = h('div.dh-list'); const head = h('div.card.pad.dh-head'); body.append(head, list);
  /* counting by voice (Settings → counter): each phrase counts on the first unfinished dhikr */
  if(M.cfg.voiceCount && M.voiceBar){
    const vb = M.voiceBar(()=>{ const c = list.querySelector('.dhikr:not(.done)'); if(!c){ M.toast('أتممت الأذكار'); vb.stop(); return; } c.click(); const n = list.querySelector('.dhikr:not(.done)'); if(n && n !== c) setTimeout(()=>n.scrollIntoView({block:'center', behavior:'smooth'}), 250); else c.scrollIntoView({block:'nearest', behavior:'smooth'}); }, {phrase:()=>{ const c = list.querySelector('.dhikr:not(.done) .dh-text'); return c ? c.textContent : ''; }});
    vb.classList.add('vc-sticky'); body.insertBefore(vb, head);   // it stops the microphone by itself when the page closes
  }
  draw().then(()=>{ if(M.cfg.adhResume){ const f = list.querySelector('.dhikr:not(.done)'); if(f) setTimeout(()=>f.scrollIntoView({block:'center'}), 100); } });
  async function draw(){
    list.innerHTML = ''; head.innerHTML = '';
    const items = itemsFor(cat, ctx), P = prog(), tk = M.dkey(); const day = P[tk] = P[tk] || {};
    const key = i=>cat === 'after' ? i.id+'@'+ctx.prayer : i.id;
    const doneN = ()=>items.filter(i=>(day[key(i)] || 0) >= i.n).length;
    const hdr = h('div.row-flex', h('div.grow', h('div.bold', meta.title), h('div.small.muted', 'تم '+M.n(doneN())+' من '+M.n(items.length))), h('button.btn.sm.tonal', {onclick:()=>{ items.forEach(i=>{ delete day[key(i)]; }); saveProg(P); if(trkId()) M.T && M.T.check(M.dkey(), trkId(), false); draw(); }}, M.ic('refresh'), 'إعادة'));
    const bar = h('div.bar', h('i', {style:'width:'+(items.length ? doneN()/items.length*100 : 0)+'%'}));
    head.append(hdr, h('div', {style:'height:10px'}), bar);
    const favSet = favs();
    for(const it of items){
      const txt = await textOf(it, it.v);
      const k = key(it); const left = ()=>Math.max(0, it.n - (day[k] || 0));
      const countBtn = h('button.dh-count'+(M.cfg.cntGreen ? '.green' : ''), {'aria-label':'عدّ', style:M.cfg.cntSize && M.cfg.cntSize !== 1 ? 'transform:scale('+M.cfg.cntSize+')' : ''});
      const card = h('article.card.dhikr'+(left() === 0 ? '.done' : ''),
        it.title ? h('div.dh-title.title-font', it.title) : null,
        h('div.dh-text.qfont', txt),
        h('div.dh-meta', h('span.badge.gold', it.src), it.g ? h('span.badge.ok', it.g) : null),
        it.fadl && !M.cfg.hideFadl ? h('div.dh-fadl.small.muted', it.fadl) : null,
        h('div.dh-actions',
          h('button.icon-btn', {'aria-label':'مفضلة', onclick:e=>{ e.stopPropagation(); const f = favs(); f.has(it.id) ? f.delete(it.id) : f.add(it.id); saveFavs(f); e.currentTarget.classList.toggle('on', f.has(it.id)); M.haptic(8); }}, M.ic('heart')),
          h('button.icon-btn', {'aria-label':'نسخ', onclick:e=>{ e.stopPropagation(); M.copy(txt.trim()+'\n['+it.src+']'); }}, M.ic('copy')),
          h('button.icon-btn', {'aria-label':'مشاركة', onclick:e=>{ e.stopPropagation(); M.share(txt.trim()+'\n['+it.src+']'); }}, M.ic('share')),
          h('span.grow'), countBtn));
      if(favSet.has(it.id)) card.querySelector('[aria-label="مفضلة"]').classList.add('on');
      const paint = ()=>{ const l = left(); countBtn.innerHTML = l === 0 ? M.icon('check') : '<b class="num">'+M.n(l)+'</b>'; card.classList.toggle('done', l === 0); };
      paint();
      card.addEventListener('click', ()=>{
        if(left() === 0) return;
        day[k] = (day[k] || 0) + 1; saveProg(P); if(left() === 0){ if(M.cfg.cntVibEnd !== false) M.haptic(30); } else if(M.cfg.cntVib !== false) M.haptic(10); if(M.cfg.cntSound) M.beep(880, .04, .08); paint();
        card.classList.remove('bump'); void card.offsetWidth; card.classList.add('bump');
        const d = doneN(); hdr.querySelector('.small').textContent = 'تم '+M.n(d)+' من '+M.n(items.length); bar.firstChild.style.width = (d/items.length*100)+'%';
        if(left() === 0){ M.beep(740, .08, .12); }
        if(d === items.length){
          const id = trkId(); if(id && M.T){ M.T.check(M.dkey(), id, true); }
          M.toast('أتممت '+meta.title+' — تقبّل الله منك', 3200); M.haptic(60);
        }
      });
      list.append(card);
    }
  }
  function trkId(){ if(cat === 'after') return ctx.prayer+'_adhkar'; return meta.trk; }
}
M.openAdhkarCategory = openCategory;

function drawMisc(body, view){
  const P = prog(), tk = M.dkey(); const day = P[tk] = P[tk] || {};
  D.MISC.forEach(g=>{
    const done = !!day[g.id];
    const card = h('article.card.pad.misc-g'+(done ? '.done' : ''),
      h('div.row-flex', h('div.grow.bold.title-font', g.title),
        h('button.btn.sm'+(done ? '' : '.tonal'), {onclick:e=>{
          const d = !day[g.id]; day[g.id] = d ? 1 : 0; saveProg(P); card.classList.toggle('done', d); e.currentTarget.className = 'btn sm'+(d ? '' : ' tonal'); e.currentTarget.innerHTML = (d ? M.icon('check') : '')+(d ? 'تم' : 'تعليم كمقروء');
          if(g.trk && M.T) M.T.check(M.dkey(), g.trk, d); M.haptic(14);
        }}, done ? M.ic('check') : null, done ? 'تم' : 'تعليم كمقروء')));
    if(g.link){ card.append(h('button.btn.tonal.block', {style:'margin-top:10px', onclick:()=>openCategory('sleep')}, 'فتح أذكار النوم')); }
    g.items.forEach(it=>{
      card.append(h('div.misc-i', h('div.small.muted', it.lbl), h('div.dh-text.qfont', it.t), h('div.dh-meta', h('span.badge.gold', it.src), it.g ? h('span.badge.ok', it.g) : null), it.fadl ? h('div.dh-fadl.small.muted', it.fadl) : null));
    });
    body.append(card);
  });
}

async function drawFavs(body){
  const f = favs(); await M.loadQuran(); const map = allItemsMap(); const ids = Array.from(f).filter(i=>map[i]);
  if(!ids.length){ body.append(h('div.empty', 'لا توجد أذكار مفضلة بعد.\nاضغط على القلب في أي ذكر لحفظه هنا.')); return; }
  for(const id of ids){
    const it = map[id]; const txt = await textOf(it, it.v);
    body.append(h('article.card.dhikr', it.title ? h('div.dh-title.title-font', it.title) : null, h('div.dh-text.qfont', txt), h('div.dh-meta', h('span.badge.gold', it.src), it.g ? h('span.badge.ok', it.g) : null),
      h('div.dh-actions', h('button.icon-btn.on', {onclick:e=>{ const s = favs(); s.delete(id); saveFavs(s); e.currentTarget.closest('.dhikr').remove(); }}, M.ic('heart')), h('button.icon-btn', {onclick:()=>M.copy(txt.trim())}, M.ic('copy')), h('button.icon-btn', {onclick:()=>M.share(txt.trim())}, M.ic('share')))));
  }
}

function drawMine(body){
  const GROUPS = ['عامة','للوالدين','للأحباب','للمرضى','للميت','للنفس'];
  let sel = 'الكل';
  const list = h('div');
  const chips = M.chips([['الكل','الكل'], ...GROUPS.map(g=>[g, g])], sel, v=>{ sel = v; draw(); });
  body.append(h('button.btn.block', {onclick:add}, M.ic('plus'), 'إضافة دعاء'), h('div', {style:'height:10px'}), chips, list);
  function data(){ return M.store.get('myDuas', []); }
  async function add(){
    const ta = h('textarea.field', {placeholder:'اكتب الدعاء…'});
    const gs = h('select.field', GROUPS.map(g=>h('option', {value:g}, g)));
    const r = await M.dialog({title:'دعاء جديد', body:h('div.col-flex', gs, ta), actions:[{label:'إلغاء', value:false, cls:'ghost'},{label:'حفظ', value:true, cls:''}]});
    if(r && ta.value.trim()){ const d = data(); d.push({id:Date.now(), g:gs.value, t:ta.value.trim()}); M.store.set('myDuas', d); draw(); }
  }
  function draw(){
    list.innerHTML = ''; const d = data().filter(x=>sel === 'الكل' || x.g === sel);
    if(!d.length){ list.append(h('div.empty', 'لا توجد أدعية هنا بعد.')); return; }
    d.slice().reverse().forEach(x=>list.append(h('article.card.dhikr', h('div.dh-meta', h('span.badge', x.g)), h('div.dh-text.qfont', x.t),
      h('div.dh-actions', h('button.icon-btn', {onclick:()=>M.copy(x.t)}, M.ic('copy')), h('button.icon-btn', {onclick:()=>M.share(x.t)}, M.ic('share')), h('span.grow'),
        h('button.icon-btn', {onclick:()=>{ M.store.set('myDuas', data().filter(y=>y.id !== x.id)); draw(); }}, M.ic('trash'))))));
  }
  draw();
}

M.adhkarProgressToday = function(){
  const day = prog()[M.dkey()] || {};
  const m = itemsFor('morning'), e = itemsFor('evening');
  return {morning:m.filter(i=>(day[i.id] || 0) >= i.n).length / m.length, evening:e.filter(i=>(day[i.id] || 0) >= i.n).length / e.length};
};
// short rotating dhikr for the home screen
M.dhikrOfTheDay = function(){
  const pool = [['سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ','متفق عليه — «كلمتان خفيفتان على اللسان، ثقيلتان في الميزان»'],
    ['لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ','متفق عليه — «كنز من كنوز الجنة»'],
    ['أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ','أبو داود والترمذي'],
    ['اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ','من صلى عليّ صلاة صلى الله عليه بها عشرًا — مسلم'],
    ['لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ','الأنبياء: ٨٧'],
    ['حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ','آل عمران: ١٧٣'],
    ['يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ','رواه الترمذي']];
  const d = new Date(); const i = (d.getFullYear()*366 + d.getMonth()*31 + d.getDate()) % pool.length; return pool[i];
};
})();
