/* ===== Library UI: topics, pager reader, yusr, sick, jami', ruqya, tasabih, random, my duas, loved ones ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const tint = i=>'dua-tint t'+(i % 4);
const norm = s=>M.normAr ? M.normAr(s) : s;
const strip = s=>String(s).replace(/[ً-ٰٟۖ-ۭ]/g, '');
const txt = (t)=>M.cfg.noTashkeel ? strip(t) : t;
const fs = ()=>(M.cfg.duaSize || 1);

/* ---- pager: one dhikr per screen, a big counter with its ring, voice counting, and the items in order ----
   RTL: «السابق» sits on the right with an arrow to the right, «التالي» on the left; a swipe towards the right goes on. */
M.dhikrPager = function(title, items, opts){
  opts = opts || {};
  let i = Math.max(0, Math.min(items.length - 1, opts.start | 0)), vbar = null;
  const counts = items.map(()=>0);
  const favs = ()=>M.store.get('pagerFav', []);
  const keyOf = it=>it[0].slice(0, 40);
  const view = M.openView({id:'pager', title, nopad:true, onClose:()=>{ try{ vbar && vbar.stop(); }catch(e){} }});
  const root = h('div.dp'); view.body.append(root);
  const R = 52, C = 2 * Math.PI * R;
  const sizeOf = t=>(t.length < 45 ? 2 : t.length < 110 ? 1.65 : t.length < 260 ? 1.35 : 1.15) * fs();
  function draw(){
    const it = items[i], n = it[1] || 1, c = counts[i], left = Math.max(0, n - c), done = c >= n;
    const fav = favs().includes(keyOf(it));
    const steps = items.length > 1 ? h('div.dp-steps', h('span.num', M.n(i + 1)+' من '+M.n(items.length)),
      h('div.dp-track', ...items.map((x, k)=>h('i'+(k === i ? '.on' : counts[k] >= (x[1] || 1) ? '.ok' : ''))))) : null;
    const card = h('div.dp-card'+(done ? '.done' : ''), {onclick:()=>count(1)},
      h('div.dp-text.qfont', {style:'font-size:'+sizeOf(it[0]).toFixed(2)+'rem'}, txt(it[0])),
      it[2] ? h('div.dp-src', it[2]) : null);
    const act = (ic, label, fn, on)=>h('button.dp-act'+(on ? '.on' : ''), {'aria-label':label, title:label, onclick:e=>{ e.stopPropagation(); fn(e); }}, M.ic(ic));
    const acts = h('div.dp-acts',
      act('heart', fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة', ()=>{ let f = favs(); f = f.includes(keyOf(it)) ? f.filter(x=>x !== keyOf(it)) : f.concat(keyOf(it)); M.store.set('pagerFav', f); draw(); }, fav),
      act('copy', 'نسخ', ()=>M.copy(it[0]+(it[2] ? '\n['+it[2]+']' : ''))),
      act('share', 'مشاركة', ()=>M.share(it[0]+(it[2] ? '\n['+it[2]+']' : ''))),
      M.voiceBar ? act('mic', vbar ? 'إخفاء العدّ بالصوت' : 'العدّ بالصوت', ()=>{ if(vbar){ try{ vbar.stop(); }catch(e){} vbar = null; } else vbar = M.voiceBar(()=>count(1), {phrase:()=>items[i][0], autostart:true}); draw(); }, !!vbar) : null,
      act('undo', 'تراجع عدّة', ()=>count(-1)),
      act('refresh', 'تصفير هذا الذكر', ()=>{ counts[i] = 0; draw(); }));
    const ring = h('div.dp-ring', {html:'<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="'+R+'" class="dp-rt"/><circle cx="60" cy="60" r="'+R+'" class="dp-rf" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C * (1 - Math.min(1, c / n))).toFixed(1)+'"/></svg>'});
    const counter = h('button.dp-count'+(done ? '.done' : ''), {'aria-label':done ? 'تمّ' : 'عُدّ — بقي '+left, onclick:()=>count(1)}, ring,
      h('span.dp-cin', done ? h('span.dp-ok', M.ic('check')) : h('b.num', M.n(left)), h('small', done ? 'تمّت' : n > 1 ? 'من '+M.n(n) : 'مرة')));
    const nav = (dir)=>h('button.dp-nav', {'aria-label':dir < 0 ? 'السابق' : 'التالي', disabled:dir < 0 ? i === 0 : i === items.length - 1, onclick:()=>go(dir)}, ...(dir < 0 ? [M.ic('back'), h('span', 'السابق')] : [h('span', 'التالي'), M.ic('fwd')]));   // the arrow on the outer side
    const bar = h('div.dp-bar', nav(-1), counter, nav(1));
    root.replaceChildren(...[steps, card, acts, vbar, bar].filter(Boolean));
    if(vbar && vbar.refresh) vbar.refresh();
  }
  function go(d){ const j = i + d; if(j < 0 || j >= items.length) return; i = j; draw(); }
  function count(d){
    const n = items[i][1] || 1;
    if(d < 0){ if(counts[i] > 0){ counts[i]--; draw(); } return; }
    if(counts[i] >= n){ if(i < items.length - 1) go(1); return; }
    counts[i]++;
    const fin = counts[i] === n;
    if(fin){ if(M.cfg.cntVibEnd !== false) M.haptic(30); } else if(M.cfg.cntVib !== false) M.haptic(8);
    if(M.cfg.cntSound) M.beep(fin ? 660 : 880, fin ? .12 : .04, .08);
    draw();
    const c = root.querySelector('.dp-count'); if(c){ c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
    if(fin){
      if(i < items.length - 1 && M.cfg.dhikrNext !== false) setTimeout(()=>{ if(counts[i] >= n) go(1); }, 420);
      else if(items.every((x, k)=>counts[k] >= (x[1] || 1)) && items.length > 1) M.toast('أتممت الأذكار — تقبّل الله منك');
    }
  }
  let sx = null;
  root.addEventListener('touchstart', e=>{ sx = e.touches[0].clientX; }, {passive:true});
  root.addEventListener('touchend', e=>{ if(sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if(Math.abs(dx) > 70) go(dx > 0 ? 1 : -1); });
  draw(); return view;
};

/* ---- scrolling list of cards ---- */
function cardsView(title, list, opts){
  opts = opts || {};
  const view = M.openView({id:opts.id || 'cards', title});
  const b = view.body;
  if(opts.intro) b.append(h('div.card.pad.small.muted', opts.intro));
  const box = h('div.col-flex'); b.append(box);
  list.forEach((it, k)=>{
    if(it.head){ box.append(h('div.section-h', it.head)); return; }
    box.append(h('div.dua-card', h('div.tx.qfont', {style:'font-size:'+(1.2 * fs())+'rem'}, txt(it.t)),
      h('div.row-flex', h('span.src', it.s || ''), h('div.grow'),
        h('button.icon-btn.tonal', {'aria-label':'نسخ', onclick:()=>M.copy(it.t+(it.s ? '\n['+it.s+']' : ''))}, M.ic('copy')),
        h('button.icon-btn.tonal', {'aria-label':'مشاركة', onclick:()=>M.share(it.t+(it.s ? '\n['+it.s+']' : ''))}, M.ic('share')))));
  });
  return view;
}

/* ---- topics (المزيد) ---- */
M.openTopics = function(filterGroup){
  const view = M.openView({id:'topics', title:'أدعية حسب المواضيع', build:b=>{
    const q = h('input.field', {placeholder:'ابحث…', type:'search', oninput:()=>draw()});
    const box = h('div.col-flex'); b.append(q, box);
    function draw(){
      box.innerHTML = ''; const nq = norm(q.value.trim());
      const groups = {};
      M.TOPICS.forEach(tp=>{ if(filterGroup && tp[2] !== filterGroup) return; if(nq && !norm(tp[1]+' '+tp[2]+' '+tp[3].map(x=>x[0]).join(' ')).includes(nq)) return; (groups[tp[2]] = groups[tp[2]] || []).push(tp); });
      const keys = Object.keys(groups);
      if(!keys.length) box.append(h('div.muted.center', {style:'padding:30px'}, 'لا توجد نتائج'));
      keys.forEach(g=>{
        box.append(h('div.section-h', g));
        const grid = h('div.topic-grid');
        groups[g].forEach((tp, i)=>grid.append(h('button.'+tint(i).replace(' ', '.'), {onclick:()=>M.dhikrPager(tp[1], tp[3])}, tp[1])));
        box.append(grid);
      });
    }
    draw();
  }});
};

/* ---- tayseer ---- */
M.openYusr = function(){
  const v = M.openView({id:'yusr', title:'أدعية التيسير', build:b=>{
    b.append(h('div.section-h', 'ما الأمر؟'));
    const l = h('div.col-flex.gap-s');
    M.YUSR.forEach(([id, n, ic, items])=>l.append(h('button.item.card', {onclick:()=>M.dhikrPager(n, items)}, h('span.lead', {html:M.icon(ic)}), h('div.grow.t', n), M.ic('fwd'))));
    b.append(l, h('div.card.pad.small.muted', {style:'margin-top:12px;line-height:1.9'}, 'تنبيه: ما ورد من دعاء مخصّص لهذه المواقف بعينها قليل، وهنا أدعية عامة ثابتة من القرآن والسنة مناسبة لها. ادعُ الله بما تحتاج بلغتك أيضًا.'));
  }});
};

/* ---- sick duas (whom / what) ---- */
M.openSickDua = function(){
  const who = [['me', 'لنفسي'], ['father', 'أبي'], ['mother', 'أمي'], ['son', 'ابني'], ['daughter', 'ابنتي'], ['brother', 'أخي'], ['sister', 'أختي'], ['husband', 'زوجي'], ['wife', 'زوجتي'], ['friend', 'صديقي'], ['other', 'مريض']];
  const kind = [['gen', 'مرض عام'], ['pain', 'ألم أو وجع'], ['hosp', 'في المستشفى'], ['surg', 'قبل أو أثناء العملية'], ['visit', 'زيارة المريض'], ['ruqya', 'الرقية عليه'], ['chronic', 'مرض مزمن']];
  let w = null, k = null;
  const v = M.openView({id:'sickdua', title:'أدعية المريض', build:b=>{
    const box = h('div.col-flex'); b.append(box);
    const res = h('div.col-flex'); 
    function draw(){
      box.innerHTML = '';
      box.append(h('div.section-h', 'لمن تدعو؟'), M.chips(who, w, x=>{ w = x; draw(); }), h('div.section-h', 'ما حالته؟'), M.chips(kind, k, x=>{ k = x; draw(); }));
      if(!w || !k){ box.append(h('div.muted.center', {style:'padding:20px'}, 'اختر الشخص والحالة')); return; }
      const name = who.find(x=>x[0] === w)[1];
      const tgt = w === 'me' ? 'نَفْسِي' : name;
      const L = [];
      const self = w === 'me';
      if(k === 'visit') L.push({t:'لَا بَأْسَ، طَهُورٌ إِنْ شَاءَ اللَّهُ', s:'رواه البخاري'}, {t:'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ (٧ مرات)', s:'رواه أبو داود والترمذي'});
      if(k === 'ruqya'){ L.push({t:'بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ', s:'رواه مسلم'}); }
      L.push({t:'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا', s:'متفق عليه'});
      if(self){ L.push({t:'بِسْمِ اللَّهِ (٣)، أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ (٧) — مع وضع اليد على موضع الألم', s:'رواه مسلم'}); L.push({t:'أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ', s:'الأنبياء: ٨٣'}); }
      else { L.push({t:'اللَّهُمَّ اشْفِ '+name+' شِفَاءً لَا يُغَادِرُ سَقَمًا، وَأَلْبِسْهُ ثَوْبَ الصِّحَّةِ وَالْعَافِيَةِ', s:'دعاء بالمأثور معناه'}); }
      if(k === 'surg') L.push({t:'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', s:'طه: ٢٥–٢٦'}, {t:'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', s:'آل عمران: ١٧٣'});
      if(k === 'chronic') L.push({t:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبَرَصِ وَالْجُنُونِ وَالْجُذَامِ وَمِنْ سَيِّئِ الْأَسْقَامِ', s:'رواه أبو داود'}, {t:'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ', s:'رواه أبو داود'});
      L.push({t:'اللَّهُمَّ اجْعَلْ مَا أَصَابَهُ كَفَّارَةً وَطَهُورًا، وَاكْتُبْ لَهُ أَجْرَ الصَّابِرِينَ', s:'دعاء بالمأثور معناه'});
      const wrap = h('div.col-flex'); L.forEach(it=>wrap.append(h('div.dua-card', h('div.tx.qfont', txt(it.t)), h('div.row-flex', h('span.src', it.s), h('div.grow'), h('button.icon-btn.tonal', {onclick:()=>M.copy(it.t)}, M.ic('copy')), h('button.icon-btn.tonal', {onclick:()=>M.share(it.t)}, M.ic('share'))))));
      box.append(wrap);
    }
    draw();
  }});
};

M.openJami = function(){
  const list = []; M.JAMI.forEach(([g, items])=>{ list.push({head:g}); items.forEach(([t, s])=>list.push({t, s})); });
  return cardsView('أدعية شاملة', list, {id:'jami', intro:'مجموعة جامعة من أدعية القرآن والسنة مرتبة بالموضوع.'});
};
M.openRuqya = function(kind){
  if(kind === 'quran'){
    const v = M.openView({id:'ruqya-q', title:'الرقية بالقرآن', build:b=>{
      b.append(h('div.card.pad.small.muted', {style:'line-height:1.9'}, 'يُستحب أن يقرأ المسلم على نفسه ومن يشاء بآيات الرقية. اضغط على السورة لتفتح في المصحف.'));
      const l = h('div.list.card');
      M.RUQYA.quran.forEach(([n, ref, s, a])=>l.append(M.item({icon:'quran', title:n, sub:ref, onClick:()=>M.openReader({sura:s, ayah:a}), trail:M.ic('fwd')})));
      b.append(l);
    }}); return v;
  }
  return cardsView('الرقية بالسنة', M.RUQYA.sunna.map(([t, s])=>({t, s})), {id:'ruqya-s'});
};
const TCNT = [100, 33, 33, 33, 33, 100, 33, 33, 100, 10]; // from the hadith: سبحان الله وبحمده مئة، لا إله إلا الله مئة، الاستغفار مئة، الصلاة على النبي عشر
/* one screen for the remembrance phrases: tasbih, istighfar and praise (three tabs) */
const ISTG = ()=>M.ISTIGHFAR.map(([t, s], i)=>[t, i === 2 ? 100 : (t.length < 30 ? 100 : 3), s]);
const HAMD = ()=>M.HAMD.map(([t, s])=>[t, 1, s]);
M.openTasabih = function(tab){
  let cur = ['tasbih', 'istighfar', 'hamd'].includes(tab) ? tab : 'tasbih';
  const v = M.openView({id:'tasabih', title:'التسبيح والاستغفار', build:b=>{
    const content = h('div');
    const seg = M.seg([['tasbih', 'التسبيح'], ['istighfar', 'الاستغفار'], ['hamd', 'الحمد والثناء']], cur, x=>{ cur = x; draw(); });
    seg.style.margin = '0 0 12px';
    b.append(seg, content);
    function draw(){
      content.replaceChildren();
      const g = h('div.topic-grid.big');
      if(cur === 'tasbih') M.TASBIH.forEach(([t, f], i)=>g.append(h('button.'+tint(i).replace(' ', '.'), {onclick:()=>M.dhikrPager('تسبيح', [[t, TCNT[i] || 33, f]])}, h('div.qfont', txt(t)), h('div.tiny.muted', {style:'margin-top:6px'}, f))));
      else{ const list = cur === 'istighfar' ? ISTG() : HAMD(), title = cur === 'istighfar' ? 'الاستغفار' : 'الحمد والثناء';
        list.forEach(([t, n, f], i)=>g.append(h('button.'+tint(i).replace(' ', '.'), {onclick:()=>M.dhikrPager(title, list, {start:i})}, h('div.qfont', txt(t.length > 140 ? t.slice(0, 137)+'…' : t)), h('div.tiny.muted', {style:'margin-top:6px'}, f || '')))); }
      content.append(g, h('button.btn.tonal.block', {style:'margin-top:14px', onclick:()=>M.openTasbih()}, M.ic('s:counter'), 'فتح المسبحة الإلكترونية'));
    }
    draw();
  }});
  return v;
};
M.openIstighfar = ()=>M.openTasabih('istighfar');
M.openHamd = ()=>M.openTasabih('hamd');

/* ---- random (المنوعة) ---- */
M.openRandom = function(){
  const pool = [];
  M.TOPICS.forEach(tp=>tp[3].forEach(x=>{ if(x[0].length < 260) pool.push([x[0], x[2]]); }));
  M.JAMI.forEach(([g, it])=>it.forEach(x=>pool.push([x[0], x[1]])));
  M.TASBIH.forEach(x=>pool.push([x[0], x[1]])); M.ISTIGHFAR.forEach(x=>pool.push([x[0], x[1]])); M.HAMD.forEach(x=>pool.push([x[0], x[1]]));
  const mine = M.store.get('myDuas2', []).map(d=>[d, 'دعائي']); mine.forEach(x=>pool.push(x));
  let i = Math.floor(Math.random() * pool.length), timer = null;
  const root = h('div.pager.random'), page = h('div.rand-page', root);
  const paintBg = ()=>M.bgPaint(page, 'randBgX').then(on=>root.classList.toggle('photo', on));
  const view = M.openView({id:'random', title:'الأذكار المنوعة', nopad:true, onClose:()=>clearInterval(timer), actions:[h('button.icon-btn', {'aria-label':'خلفية الصفحة', onclick:()=>M.bgSheet('randBgX', 'خلفية الأذكار المنوعة', paintBg)}, M.ic('image'))]});
  view.body.append(page);
  // first time: carry over the picture chosen in the old settings page
  if(!M.cfg.randBgX && M.cfg.randBg){ const bg = M.cfg.randBg, dim = Math.round((M.cfg.randDim != null ? M.cfg.randDim : .55) * 100);
    if(bg.startsWith('photo:')) M.save('randBgX', {src:'img/bg/bg'+bg.slice(6)+'.jpg', blur:0, dim});
    else if(bg === 'custom' && M.cfg.randBgImg){ M.kv.set('randBgXImg', M.cfg.randBgImg).then(()=>{ M.save('randBgX', {src:'custom', blur:0, dim}); paintBg(); }).catch(()=>{}); } }
  paintBg();
  function draw(){
    const it = pool[i];
    root.innerHTML = '';
    root.append(h('div.pg-body', {onclick:()=>{ i = (i + 1) % pool.length; draw(); }}, h('div.pg-text.qfont', {style:'font-size:'+(1.5 * fs())+'rem'}, txt(it[0])), h('div.pg-src', it[1] || '')),
      h('div.pg-bar', h('button.icon-btn.tonal', {'aria-label':'السابق', onclick:()=>{ i = (i - 1 + pool.length) % pool.length; draw(); }}, M.ic('back')),
        h('button.btn.sm.tonal', {onclick:()=>{ M.share(it[0]+(it[1] ? '\n['+it[1]+']' : '')); }}, M.ic('share'), ' مشاركة'),
        h('button.btn.sm.tonal'+(M.cfg.randAuto !== false ? '.on' : ''), {onclick:e=>{ M.save('randAuto', !(M.cfg.randAuto !== false)); setT(); e.currentTarget.classList.toggle('on'); M.toast(M.cfg.randAuto !== false ? 'يتغيّر الذكر تلقائيًا كل '+M.cnt(15, 'ثانية', true) : 'أُوقف التغيير التلقائي'); }, 'aria-label':'تغيير الذكر تلقائيًا'}, M.ic('repeat'), ' تلقائي'),
        h('button.icon-btn.tonal', {'aria-label':'التالي', onclick:()=>{ i = (i + 1) % pool.length; draw(); }}, M.ic('fwd'))));
  }
  function setT(){ clearInterval(timer); if(M.cfg.randAuto !== false) timer = setInterval(()=>{ i = (i + 1) % pool.length; draw(); }, 15000); }
  draw(); setT();
};

/* ---- my duas (أدعيتي) with daily reminder ---- */
M.openMyDuas = function(){
  const view = M.openView({id:'myduas2', title:'أدعيتي', build:b=>{
    const list = h('div.col-flex');
    const ta = h('textarea.field', {placeholder:'أضف دعاءً أو ذكرًا…', rows:3});
    b.append(h('div.list.card', h('div.item.static', h('div.grow', h('div.t', 'تفعيل التذكير'), h('div.s', 'يظهر لك أحد أدعيتك عند فتح التطبيق مرة في اليوم')), M.switchEl(!!M.cfg.myDuaRemind, v=>M.save('myDuaRemind', v)))),
      h('div.section-h', 'إضافة دعاء'), ta, h('button.btn.block', {style:'margin-top:8px', onclick:()=>{ const v = ta.value.trim(); if(!v) return; const a = M.store.get('myDuas2', []); a.unshift(v); M.store.set('myDuas2', a); ta.value = ''; draw(); }}, M.ic('plus'), 'إضافة'), list);
    function draw(){
      list.innerHTML = ''; const a = M.store.get('myDuas2', []);
      if(!a.length) list.append(h('div.muted.center', {style:'padding:16px'}, 'لا توجد أدعية بعد'));
      a.forEach((d, k)=>list.append(h('div.dua-card', h('div.tx.qfont', {style:'font-size:1.1rem'}, d), h('div.row-flex', h('div.grow'), h('button.icon-btn.tonal', {onclick:()=>M.share(d)}, M.ic('share')), h('button.icon-btn.tonal', {onclick:()=>{ const x = M.store.get('myDuas2', []); x.splice(k, 1); M.store.set('myDuas2', x); draw(); }}, M.ic('trash'))))));
    }
    draw();
  }});
};
M.myDuaReminder = function(){
  if(!M.cfg.myDuaRemind) return;
  const a = M.store.get('myDuas2', []); if(!a.length) return;
  const k = 'myDuaShown'; if(M.store.get(k) === M.dkey()) return; M.store.set(k, M.dkey());
  const d = a[Math.floor(Math.random() * a.length)];
  M.dialog({title:'من أدعيتك', body:h('div.qfont', {style:'font-size:1.2rem;line-height:2'}, d), actions:[{label:'تم', value:true}]});
};

/* ---- loved ones (أذكار الأحبة) ---- */
M.openLoved = function(){
  const view = M.openView({id:'loved', title:'أذكار الأحبة', build:b=>{
    const list = h('div.col-flex'); const inp = h('input.field', {placeholder:'اسم الشخص العزيز'});
    b.append(h('div.card.pad.small.muted', 'أضف أسماء من تحب ليظهر لك دعاء جاهز لكل واحد تشاركه معه.'), inp,
      h('button.btn.block', {style:'margin:8px 0', onclick:()=>{ const v = inp.value.trim(); if(!v) return; const a = M.store.get('loved', []); a.push(v); M.store.set('loved', a); inp.value = ''; draw(); }}, M.ic('plus'), 'إضافة'), list);
    function draw(){
      list.innerHTML = ''; const a = M.store.get('loved', []);
      a.forEach((n, k)=>{
        const t = 'اللَّهُمَّ اغْفِرْ لِـ'+n+' وَارْحَمْهُ/ا، وَاهْدِهِ/ا، وَبَارِكْ لَهُ/ا فِي عُمُرِهِ/ا وَرِزْقِهِ/ا، وَاجْمَعْنَا فِي جَنَّتِكَ';
        list.append(h('div.dua-card', h('div.t.bold', n), h('div.tx.qfont', {style:'font-size:1.05rem'}, t), h('div.row-flex', h('div.grow'), h('button.icon-btn.tonal', {onclick:()=>M.share(t)}, M.ic('share')), h('button.icon-btn.tonal', {onclick:()=>{ const x = M.store.get('loved', []); x.splice(k, 1); M.store.set('loved', x); draw(); }}, M.ic('trash')))));
      });
    }
    draw();
  }});
};
})();
