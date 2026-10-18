/* ===== More: Names of Allah, Friday, Ramadan, Hajj & Umrah, Kids, Radio & TV ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
M.screens = M.screens || {};
const T = ()=>M.T;

/* ---------------- tab screen ---------------- */
M.screens.more = {
  icon:'s:grid', label:'المزيد',
  build(el){
    el.innerHTML = '';
    el.append(h('div.page-top', h('div', h('h1', 'المزيد'), h('div.sub', 'كل ما تحتاجه في مكان واحد')),
      h('button.icon-btn.tonal', {'aria-label':'الإعدادات', onclick:()=>M.openSettings()}, M.ic('settings'))));
    /* sticky search over every section (title + keywords) and a button to the full, grouped list */
    const q = h('input.field.more-q', {type:'search', placeholder:'ابحث في كل الأقسام…', 'aria-label':'بحث في الأقسام', autocomplete:'off', oninput:()=>draw()});
    el.append(h('div.sec-sticky.more-bar', h('div.more-qw', h('span.more-qi', {html:M.icon('search')}), q), h('button.icon-btn.tonal', {'aria-label':'جميع الأقسام', onclick:()=>M.openAllSections()}, M.ic('grid'))));
    const box = h('div.more-box'); el.append(box);
    const SEC = id=>(M.SECTIONS || []).find(x=>x[0] === id);
    const grid = secs=>h('div.grid3.more-grid', ...secs.map(s=>M.secTile(s)));
    const row = (title, secs, cls)=>[h('div.section-h', title, h('span.small.muted.num', M.n(secs.length))), (()=>{ const g = grid(secs); if(cls) g.classList.add(cls); return g; })()];
    /* the groups fold: tap a heading to hide or show its sections (remembered). The first group, your own worship, always stays open */
    const FOLD = 'moreFold';
    const folded = ()=>new Set(M.store.get(FOLD, null) || []);
    const fold = (title, secs, fixed)=>{
      const shut = !fixed && folded().has(title);
      const g = grid(secs); g.hidden = shut;
      const peek = h('span.more-peek', {'aria-hidden':'true'}, ...secs.slice(0, 5).map(s=>h('i', {html:M.icon(s[2])})));
      const head = fixed ? h('div.section-h.more-gh.fixed', h('span.grow', title), h('span.small.muted.num', M.n(secs.length)))
        : h('button.section-h.more-gh'+(shut ? '.shut' : ''), {'aria-expanded':shut ? 'false' : 'true', onclick:()=>{
            const f = folded(); const now = !f.has(title); now ? f.add(title) : f.delete(title); M.store.set(FOLD, [...f]);
            g.hidden = now; head.classList.toggle('shut', now); head.setAttribute('aria-expanded', now ? 'false' : 'true'); allBtn.refresh(); }},
          h('span.grow', title), peek, h('span.small.muted.num', M.n(secs.length)), h('span.more-chev', M.ic('fwd')));
      return [head, g];
    };
    const allBtn = h('button.more-all', {onclick:()=>{ const groups = M.orgGroups().slice(1).map(x=>x[0]); const anyOpen = groups.some(t=>!folded().has(t)); M.store.set(FOLD, anyOpen ? groups : []); draw(); }});
    allBtn.refresh = ()=>{ const groups = M.orgGroups().slice(1).map(x=>x[0]); allBtn.textContent = groups.some(t=>!folded().has(t)) ? 'طيّ كل الأقسام' : 'فتح كل الأقسام'; };
    function draw(){
      box.replaceChildren(); const v = q.value.trim();
      if(v){
        const r = M.secFind(v);
        if(!r.length) box.append(h('div.empty', 'لا نتائج'), h('button.btn.tonal.block', {onclick:()=>M.openSearch()}, M.ic('search'), 'ابحث في الآيات والأذكار'));
        else box.append(h('div.section-h', 'النتائج', h('span.small.muted.num', M.n(r.length))), grid(r));
        return;
      }
      const pins = M.secPins().map(SEC).filter(Boolean);
      const rec = M.secRecent().map(SEC).filter(Boolean);
      if(pins.length) box.append(...row('المثبّتة', pins));
      if(rec.length) box.append(...row('استخدمتها مؤخرًا', rec));
      if(!pins.length) box.append(h('div.small.muted.more-tip', M.ic('star'), 'اضغط مطولًا على أي قسم لتثبيته هنا'));
      const org = M.orgGroups();
      allBtn.refresh(); box.append(h('div.more-allrow', h('span.small.muted', 'اضغط عنوان أي مجموعة لإخفائها أو إظهارها'), allBtn));
      org.forEach(([g, secs], k)=>box.append(...fold(g, secs, k === 0)));
    }
    draw();
    if(el._moreUn) el._moreUn.forEach(f=>f());
    el._moreUn = [M.on('secpins', ()=>{ if(el.isConnected && !q.value.trim()) draw(); }), M.on('viewclose', ()=>{ if(el.isConnected && M.curTab === 'more' && !q.value.trim()){ const y = el.scrollTop; draw(); el.scrollTop = y; } })];
  }
};

/* ---------------- Names of Allah ---------------- */
M.nameOfDay = ()=>{ const d = new Date(); const i = (Math.floor(d.getTime() / 864e5) + 3) % M.NAMES.length; return [i + 1, ...M.NAMES[i]]; };
M.openNames = function(){
  const q = h('input.field', {placeholder:'ابحث باسم أو معنى…', type:'search', 'aria-label':'بحث في الأسماء'});
  const grid = h('div.nm-grid'), tabs = h('div.chips.nm-tabs'), count = h('div.small.muted.nm-count');
  let fav = M.store.get('namesFav', []), only = false, shown = [];
  const norm = t=>M.normAr ? M.normAr(t) : t;
  const badge = i=>h('span.nm-no', h('b.num', M.n(i + 1)));
  function draw(){
    const k = norm(q.value.trim()); shown = [];
    M.NAMES.forEach((n, i)=>{ if(only && !fav.includes(i)) return; if(k && !norm(n[0]).includes(k) && !norm(n[1]).includes(k)) return; shown.push(i); });
    grid.replaceChildren(...shown.map(i=>{ const n = M.NAMES[i];
      return h('button.nm-card'+(fav.includes(i) ? '.fav' : ''), {onclick:()=>info(i)}, badge(i), fav.includes(i) ? h('span.nm-heart', {html:M.icon('heart')}) : null, h('span.nm-name', n[0]), h('span.nm-mean', n[1])); }));
    if(!shown.length) grid.append(h('div.empty', only && !k ? 'لم تضف أسماء للمفضلة بعد — افتح اسمًا واضغط القلب' : 'لا نتائج'));
    tabs.replaceChildren(h('button.chip'+(only ? '' : '.on'), {onclick:()=>{ only = false; draw(); }}, 'كل الأسماء'), h('button.chip'+(only ? '.on' : ''), {onclick:()=>{ only = true; draw(); }}, 'المفضلة'+(fav.length ? ' ('+M.n(fav.length)+')' : '')));
    count.textContent = k || only ? M.cnt(shown.length, 'اسم', false, 'اسمًا') : '';
  }
  function info(i){
    const body = h('div.nm-info'); let sh;
    const fill = ()=>{
      const n = M.NAMES[i], pos = shown.indexOf(i), isFav = fav.includes(i);
      const go = d=>{ const list = shown.length ? shown : M.NAMES.map((_, x)=>x); const p2 = list.indexOf(i); i = list[(p2 + d + list.length) % list.length]; fill(); M.haptic && M.haptic(6); };
      body.replaceChildren(
        h('div.nm-medal', h('div.nm-big', n[0])),
        h('div.nm-meaning', n[1]),
        h('div.nm-nav', h('button.icon-btn.tonal', {'aria-label':'الاسم السابق', onclick:()=>go(-1)}, M.ic('back')), h('span.small.muted', 'الاسم '+M.n(i + 1)+' من '+M.n(M.NAMES.length)), h('button.icon-btn.tonal', {'aria-label':'الاسم التالي', onclick:()=>go(1)}, M.ic('fwd'))),
        h('div.nm-acts',
          h('button.btn.sm', {onclick:()=>{ sh.close(); M.openDuaName(n[0]); }}, 'ادعُ به'),
          h('button.btn.tonal.sm'+(isFav ? '.on' : ''), {'aria-pressed':isFav, onclick:()=>{ const j = fav.indexOf(i); if(j < 0) fav.push(i); else fav.splice(j, 1); M.store.set('namesFav', fav); M.haptic && M.haptic(10); fill(); draw(); }}, M.ic('heart'), isFav ? 'في المفضلة' : 'أضف للمفضلة'),
          h('button.btn.tonal.sm', {onclick:()=>M.share('يا '+n[0]+' — '+n[1])}, M.ic('share'), 'مشاركة')),
        h('div.tiny.muted.nm-src', 'على رواية الترمذي. قال ﷺ: «إن لله تسعة وتسعين اسمًا من أحصاها دخل الجنة» متفق عليه.'));
    };
    fill(); sh = M.sheet({title:'أسماء الله الحسنى', content:body});
  }
  q.addEventListener('input', M.debounce(draw, 150));
  const od = M.nameOfDay();
  /* «name of the day» card: plain, with an optional picture behind it (bundled, from the phone, or downloaded) that can be blurred */
  const hero = h('div.card.accent.nm-hero', {role:'button', tabIndex:0, onclick:()=>info(od[0] - 1)},
    h('div.nm-hero-top', h('span.small', 'اسم اليوم'), h('button.icon-btn.nm-bgbtn', {'aria-label':'خلفية البطاقة', onclick:e=>{ e.stopPropagation(); M.bgSheet('namesBg', 'خلفية بطاقة اسم اليوم', ()=>M.bgPaint(hero, 'namesBg')); }}, M.ic('image'))),
    h('div.nm-medal', h('div.nm-big', od[1])), h('div.nm-hero-mean', od[2]));
  M.bgPaint(hero, 'namesBg');
  M.openView({title:'أسماء الله الحسنى', id:'names', build:b=>{
    b.append(
      hero,
      h('div.nm-tools', q), h('div.nm-bar', tabs, count), grid);
    draw();
  }});
};
M.openDuaName = function(name){
  M.sheet({title:'ادعُ الله بأسمائه', content:h('div', h('div.muted', 'قال تعالى: ﴿وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا﴾ [الأعراف: 180]'),
    h('div.qfont.name-big', {style:'margin-top:12px'}, 'يَا '+name+'، أَسْأَلُكَ بِاسْمِكَ هَذَا أَنْ تَغْفِرَ لِي وَتَرْحَمَنِي وَتُصْلِحَ شَأْنِي كُلَّهُ.'),
    h('div.tiny.muted', 'صيغة دعاء عامة للتوسّل بالاسم، وليست حديثًا مأثورًا بعينه.'))});
};

/* ---------------- Ramadan ---------------- */
M.openRamadan = function(){
  const today = new Date(); today.setHours(12);
  let hj = M.hijri(today); let y = hj.y;
  const r1 = M.hijriToGreg(y, 9, 1), len = M.hijriMonthLen(y, 9);
  const endR = M.addDays(r1, len - 1);
  if(today > endR) y++;
  const start = M.hijriToGreg(y, 9, 1), mlen = M.hijriMonthLen(y, 9);
  const S = {tab:'imsak'};
  const content = h('div');
  M.openView({title:'رمضان', id:'ramadan', build:b=>{ b.append(content); }});
  function paint(){
    content.innerHTML = '';
    const diff = Math.round((start - today) / 864e5);
    const inR = diff <= 0 && today <= M.addDays(start, mlen - 1);
    content.append(h('div.card.accent.pad.ram-hero', h('div.title-font.bold', 'رمضان '+M.n(y)+' هـ'),
      h('div.small', inR ? 'اليوم '+M.n(-diff + 1)+' من رمضان' : 'يبدأ تقريبًا '+M.WEEKDAYS[start.getDay()]+' '+M.n(start.getDate())+' '+M.GMONTHS[start.getMonth()]+' — بعد '+M.cnt(diff, 'يوم', true, 'يومًا')),
      h('div.tiny.muted', 'التواريخ فلكية تقريبية؛ يُعمل برؤية الهلال في بلدك.')));
    content.append(h('div', {style:'margin:12px 0'}, M.seg([['imsak','الإمساكية'],['khatma','ختمة القرآن'],['dua','أدعية وأعمال']], S.tab, v=>{ S.tab = v; paint(); })));
    (S.tab === 'imsak' ? imsak : S.tab === 'khatma' ? khatma : duas)(content, inR ? -diff : -1);
  }
  function imsak(el, todayIdx){
    const rows = h('div.tbl-wrap'); const t = h('table.ptbl');
    t.append(h('thead', h('tr', ...['رمضان','اليوم','إمساك','الفجر','الظهر','العصر','المغرب','العشاء'].map(x=>h('th', x)))));
    const tb = h('tbody');
    for(let i = 0; i < mlen; i++){
      const d = M.addDays(start, i), p = M.prayerTimes(d);
      tb.append(h('tr'+(i === todayIdx ? '.today' : ''), h('td.num', M.n(i + 1)), h('td', M.WEEKDAYS[d.getDay()].replace('ال', '')+' '+M.n(d.getDate())+'/'+M.n(d.getMonth() + 1)),
        h('td.num', M.fmt(new Date(p.fajr.getTime() - 10 * 60000))), h('td.num', M.fmt(p.fajr)), h('td.num', M.fmt(p.dhuhr)), h('td.num', M.fmt(p.asr)), h('td.num', M.fmt(p.maghrib)), h('td.num', M.fmt(p.isha))));
    }
    t.append(tb); rows.append(t); el.append(rows);
    el.append(h('div.small.muted', {style:'margin-top:8px'}, 'المغرب هو وقت الإفطار. الإمساك قبل الفجر بعشر دقائق احتياطًا (وليس واجبًا شرعًا؛ الواجب الإمساك عند طلوع الفجر الصادق). موقعك: '+M.location().name));
  }
  function khatma(el, todayIdx){
    const K = M.store.get('khatma', null);
    if(!K){
      const inp = h('input.field', {type:'number', value:30, min:1, max:365, style:'width:100px'});
      el.append(h('div.card.pad', h('div.bold', 'خطة ختم القرآن'), h('div.small.muted', 'اختر عدد الأيام وسنوزّع المصحف (٦٠٤ صفحة) عليها.'),
        h('div.row-flex.gap-s', {style:'margin:12px 0'}, inp, h('span', 'يومًا')),
        h('div.chips', ...[[7, 'أسبوع'], [15, '١٥ يومًا'], [30, 'شهر'], [60, 'شهران']].map(([n, l])=>h('button.chip', {onclick:()=>{ inp.value = n; }}, l))),
        h('button.btn.block', {style:'margin-top:14px', onclick:()=>{ const n = Math.max(1, Math.min(365, +inp.value || 30)); M.store.set('khatma', {start:M.dkey(), days:n, done:{}}); paint(); }}, 'ابدأ الخطة')));
      return;
    }
    const doneN = Object.keys(K.done).length;
    const dayIdx = Math.max(0, Math.min(K.days - 1, Math.round((new Date().setHours(12, 0, 0, 0) - M.parseKey(K.start).setHours(12)) / 864e5)));
    const range = i=>[Math.floor(i * 604 / K.days) + 1, Math.floor((i + 1) * 604 / K.days)];
    const [a, bb] = range(dayIdx);
    el.append(h('div.card.pad', h('div.row-flex', h('div.grow', h('div.bold', 'ورد اليوم (اليوم '+M.n(dayIdx + 1)+')'), h('div.small.muted', 'من صفحة '+M.n(a)+' إلى '+M.n(bb)+' — '+M.cnt(bb - a + 1, 'صفحة'))),
      h('button.btn.sm', {onclick:()=>M.openReader({page:a})}, 'اقرأ')), h('div.bar', {style:'margin-top:12px'}, h('i', {style:'width:'+(doneN / K.days * 100)+'%'})), h('div.tiny.muted', 'أنجزت '+M.n(doneN)+' من '+M.cnt(K.days, 'يوم', true))));
    const list = h('div.card');
    for(let i = 0; i < K.days; i++){
      const [x, y2] = range(i);
      const row = h('div.trk-row'+(i === dayIdx ? '.now' : ''), h('div.grow', h('div', 'اليوم '+M.n(i + 1)), h('div.tiny.muted', 'صفحة '+M.n(x)+' – '+M.n(y2))),
        h('button.cb'+(K.done[i] ? '.on' : ''), {onclick:function(){ const v = !this.classList.contains('on'); this.classList.toggle('on', v); if(v) K.done[i] = 1; else delete K.done[i]; M.store.set('khatma', K); M.haptic(12); }}, M.ic('check')));
      list.append(row);
    }
    el.append(list, h('button.btn.danger.sm', {style:'margin-top:12px', onclick:async()=>{ if(await M.confirm('حذف الخطة الحالية؟', 'حذف')){ M.store.del('khatma'); paint(); } }}, M.ic('trash'), 'حذف الخطة'));
  }
  function duas(el){
    const D = [
      ['دعاء الإفطار','«ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ»','رواه أبو داود وحسّنه الألباني'],
      ['دعاء ليلة القدر','«اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي»','رواه الترمذي وصححه الألباني (عن عائشة رضي الله عنها)'],
      ['عند الفطر','«لِلصَّائِمِ عِنْدَ فِطْرِهِ دَعْوَةٌ مَا تُرَدُّ»','رواه ابن ماجه وضعّفه الألباني — فيُستحب الدعاء بما تيسّر عند الفطر'],
      ['دعاء إذا أفطر عند قوم','«أَفْطَرَ عِنْدَكُمُ الصَّائِمُونَ وَأَكَلَ طَعَامَكُمُ الْأَبْرَارُ وَصَلَّتْ عَلَيْكُمُ الْمَلَائِكَةُ»','رواه أبو داود وصححه الألباني']
    ];
    D.forEach(([t, d, s])=>el.append(h('div.card.pad', h('div.bold', t), h('div.qfont.dua-t', d), h('div.tiny.muted', s), h('button.btn.tonal.sm', {onclick:()=>M.copy(d.replace(/[«»]/g, ''))}, M.ic('copy'), 'نسخ'))));
    const tips = [['السحور','«تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً» — متفق عليه'],['تعجيل الفطر','«لَا يَزَالُ النَّاسُ بِخَيْرٍ مَا عَجَّلُوا الْفِطْرَ» — متفق عليه'],['قيام رمضان','«مَنْ قَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ» — متفق عليه'],['العشر الأواخر','كان النبي ﷺ «إِذَا دَخَلَ الْعَشْرُ أَحْيَا اللَّيْلَ وَأَيْقَظَ أَهْلَهُ وَشَدَّ الْمِئْزَرَ» — متفق عليه'],['ليلة القدر','«تَحَرَّوْا لَيْلَةَ الْقَدْرِ فِي الْوِتْرِ مِنَ الْعَشْرِ الْأَوَاخِرِ مِنْ رَمَضَانَ» — رواه البخاري']];
    el.append(h('div.section-h', 'أعمال مباركة'));
    const l = h('div.card'); tips.forEach(([t, s])=>l.append(h('div.trk-row', h('div.grow', h('div.bold', t), h('div.small.muted', s))))); el.append(l);
  }
  paint();
};

/* ---------------- Hajj & Umrah ---------------- */
M.openHajj = function(){
  const S = {tab:'umrah'}; const content = h('div');
  M.openView({title:'الحج والعمرة', id:'hajj', build:b=>{ b.append(content); }});
  const steps = (arr, el)=>{ const card = h('div.card'); arr.forEach((x, i)=>card.append(h('div.hj-step', h('span.hj-n.num', M.n(i + 1)), h('div.grow', h('div.bold', x[0]), h('div.small.muted.hj-d', x[1]))))); el.append(card); };
  function counter(kind, label){
    const key = 'hajjc_'+kind; let n = M.store.get(key, 0);
    // before the first round the Arabic zero (a small dot) looks like nothing: say «ابدأ» instead, as the tasbih does
    const num = h('div.tb-n.num'), sub = h('div.small.muted');
    const show = ()=>{ num.textContent = n ? M.n(n) : 'ابدأ'; num.classList.toggle('tb-start', !n); sub.textContent = n >= 7 ? 'أتممت سبعة أشواط ✓' : 'الشوط '+M.n(Math.min(n + 1, 7))+' من ٧'; };
    const btn = h('button.tb-btn.hj-btn', {'aria-label':label, onclick:()=>{ if(n >= 7) return; n++; M.store.set(key, n); show(); M.haptic(n >= 7 ? 60 : 14); }}, num, sub);
    show();
    return h('div.card.pad.center', h('div.bold', label), h('div', {style:'margin:12px 0'}, btn),
      h('button.btn.tonal.sm', {onclick:()=>{ n = 0; M.store.set(key, 0); show(); }}, M.ic('refresh'), 'إعادة'));
  }
  function paint(){
    content.innerHTML = '';
    content.append(h('div', {style:'margin:4px 0 12px'}, M.seg([['umrah','العمرة'],['hajj','الحج'],['count','العدّاد'],['mist','أخطاء شائعة'],['dua','أدعية']], S.tab, v=>{ S.tab = v; paint(); })));
    if(S.tab === 'umrah') steps(M.HAJJ.umrah, content);
    else if(S.tab === 'hajj') steps(M.HAJJ.hajj, content);
    else if(S.tab === 'count'){ content.append(counter('tawaf', 'عدّاد الطواف'), h('div', {style:'height:12px'}), counter('sai', 'عدّاد السعي'),
      h('div.small.muted', {style:'margin-top:10px'}, 'الطواف يبدأ من الحجر الأسود وينتهي إليه (٧ أشواط)، والسعي من الصفا إلى المروة شوط ومن المروة إلى الصفا شوط (٧ أشواط). لا يوجد دعاء مخصوص لكل شوط.'))}
    else if(S.tab === 'mist'){ const c = h('div.card'); M.HAJJ.mistakes.forEach(m=>c.append(h('div.trk-row', h('span.badge.warn', '!'), h('div.grow.small', m)))); content.append(c); }
    else { content.append(h('div.small.muted', {style:'margin-bottom:8px'}, 'لم يثبت دعاء مخصوص لكل شوط؛ هذه أدعية عامة مأثورة يُدعى بها في الطواف والسعي وغيرهما، وللمسلم أن يدعو بما شاء.'));
      M.HAJJ.duas.forEach(d=>content.append(h('div.card.pad', h('div.qfont.dua-t', d), h('button.btn.tonal.sm', {onclick:()=>M.copy(d)}, M.ic('copy'), 'نسخ')))); }
  }
  paint();
};

/* ---------------- Kids ---------------- */
M.openKids = function(){
  const S = {tab:'wudu'}; const content = h('div');
  const stars = ()=>M.store.get('kidStars', 0);
  const starEl = h('span.badge.gold', '★ '+M.n(stars()));
  const view = M.openView({title:'ركن الأطفال', id:'kids', actions:[starEl], build:b=>{ b.append(content); }});
  const addStar = n=>{ M.store.set('kidStars', stars() + n); starEl.textContent = '★ '+M.n(stars()); };
  function steps(arr, el){
    arr.forEach(([e, t, d], i)=>{ const c = h('button.card.pad.kid-step', {onclick:()=>{ c.classList.toggle('open'); M.haptic(8); }}, h('span.kid-e.num', M.n(i + 1)), h('div.grow', h('div.bold', t), h('div.small.muted.kid-d', d))); el.append(c); });
  }
  const QUIZ = [
    ['ماذا نقول قبل الأكل؟', ['بسم الله', 'الحمد لله', 'سبحان الله'], 0],
    ['كم عدد الصلوات المفروضة في اليوم؟', ['٣', '٥', '٧'], 1],
    ['ماذا نقول عند الركوع؟', ['سبحان ربي العظيم', 'سبحان ربي الأعلى', 'الله أكبر'], 0],
    ['كم مرة يُسنّ غسل اليدين في الوضوء؟', ['مرة', 'ثلاث مرات', 'عشر مرات'], 1],
    ['ما اسم نبينا؟', ['موسى', 'عيسى', 'محمد ﷺ'], 2],
    ['إلى أين نتجه عند الصلاة؟', ['الشمال', 'الكعبة المشرفة', 'الشرق'], 1],
    ['أي الأنبياء نجّاه الله من النار فصارت بردًا وسلامًا؟', ['إبراهيم', 'يونس', 'نوح'], 0],
    ['ماذا نقول عند الاستيقاظ؟', ['الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور', 'بسم الله', 'لا شيء'], 0]
  ];
  function quiz(el){
    let i = 0, score = 0; const box = h('div');
    function q(){
      box.innerHTML = '';
      if(i >= QUIZ.length){ addStar(score); box.append(h('div.card.pad.center', h('div.kid-e.big', {html:M.icon(score >= 6 ? 's:star8' : 's:heart')}), h('div.title-font.bold', 'أحسنت! '+M.n(score)+' من '+M.n(QUIZ.length)), h('div.small.muted', 'حصلت على '+M.n(score)+' نجوم'), h('button.btn', {style:'margin-top:12px', onclick:()=>{ i = 0; score = 0; q(); }}, 'العب مرة أخرى'))); return; }
      const [t, opts, ans] = QUIZ[i];
      box.append(h('div.card.pad', h('div.small.muted', 'سؤال '+M.n(i + 1)+' من '+M.n(QUIZ.length)), h('div.bold.title-font', {style:'margin:8px 0 14px'}, t),
        ...opts.map((o, k)=>h('button.btn.tonal.block.kid-opt', {onclick:function(){ const ok = k === ans; this.classList.add(ok ? 'right' : 'wrong'); if(ok) score++; M.haptic(ok ? 20 : 40); setTimeout(()=>{ i++; q(); }, 700); }}, o))));
    }
    q(); el.append(box);
  }
  function paint(){
    content.innerHTML = '';
    content.append(h('div', {style:'margin:4px 0 12px'}, M.seg([['wudu','الوضوء'],['salah','الصلاة'],['stories','قصص'],['adhkar','أذكار'],['quiz','مسابقة']], S.tab, v=>{ S.tab = v; paint(); })));
    if(S.tab === 'wudu') steps(M.KIDS.wudu, content);
    else if(S.tab === 'salah') steps(M.KIDS.salah, content);
    else if(S.tab === 'stories') M.KIDS.stories.forEach(([t, d])=>content.append(h('div.card.pad', h('div.bold.title-font', t), h('div.small', {style:'margin-top:6px;line-height:1.9'}, d))));
    else if(S.tab === 'adhkar') M.KIDS.adhkar.forEach(([t, d])=>content.append(h('div.card.pad', h('div.small.muted', t), h('div.bold', d))));
    else quiz(content);
  }
  paint();
};

/* ---------------- Radio & TV ---------------- */
/* Radio stations bundled with the app. Every entry was played successfully on 2026-10-05; the digit says which mp3quran host answered
   (1 = qurango.net, 2 = backup.qurango.net, 3 = both). The player tries the working host first and falls back to the other one. */
const RADIO_RAW = "أحمد الحواشي|ahmad_alhawashi|1;أحمد العجمي|ahmad_alajmy|3;أبو بكر الشاطري|shaik_abu_bakr_al_shatri|3;إبراهيم الأخضر|ibrahim_alakdar|3;أحمد صابر|ahmad_saber|3;أحمد نعينع|ahmad_nauina|3;أكرم العلاقمي|akram_alalaqmi|3;إدريس أبكر|idrees_abkr|3;الزين محمد أحمد|alzain_mohammad_ahmad|3;القارئ ياسين|alqaria_yassen|3;العيون الكوشي|aloyoon_alkoshi|3;توفيق الصايغ|tawfeeq_assayegh|3;جمال شاكر عبدالله|jamal_shaker_abdullah|3;خالد القحطاني|khaled_alqahtani|3;خالد عبدالكافي|khalid_abdulkafi|3;خليفة الطنيجي|khalifa_altunaiji|3;سعد الغامدي|saad_alghamdi|2;زكي داغستاني|zaki_daghistani|1;سيد رمضان|sayeed_ramadan|1;سعود الشريم|saud_alshuraim|3;شيرزاد عبدالرحمن طاهر|shirazad_taher|1;سهل ياسين|sahl_yassin|3;صابر عبدالحكم|saber_abdulhakm|3;صلاح البدير|salah_albudair|3;صلاح الهاشم|salah_alhashim|3;صلاح بو خاطر|slaah_bukhatir|3;عبدالبارئ محمد|abdulbari_mohammad|1;عادل ريان|adel_ryyan|3;عبدالبارئ الثبيتي|abdelbari_altoubayti|3;عبدالباسط عبدالصمد (ورش)|abdulbasit_abdulsamad_warsh|1;عبدالباسط عبدالصمد (مجوّد)|abdulbasit_abdulsamad_mojawwad|3;عبدالعزيز الأحمد|abdul_aziz_alahmad|1;عبدالباسط عبدالصمد (مرتّل)|abdulbasit_abdulsamad|3;عبدالرحمن السديس|abdulrahman_alsudaes|3;عبدالله المطرود|abdullah_almattrod|3;عبدالله بصفر|abdullah_basfer|3;عبدالله خياط|abdullah_khayyat|3;عبدالله عواد الجهني|abdullah_aljohany|3;عبدالمحسن الحارثي|abdulmohsin_alharthy|1;عبدالرشيد صوفي (خلف)|abdulrasheed_soufi_khalaf|3;عبدالمحسن القاسم|abdulmohsen_alqasim|1;عبدالرشيد صوفي (السوسي)|abdulrasheed_soufi_assosi|3;عبدالمحسن العبيكان|abdulmohsin_alobaikan|1;عبدالهادي أحمد كناكري|abdulhadi_kanakeri|1;علي الحذيفي|ali_alhuthaifi|1;عبدالودود حنيف|abdulwadood_haneef|3;علي جابر|ali_jaber|1;علي الحذيفي (قالون)|ali_alhuthaifi_qalon|3;عمر القزابري|omar_alqazabri|1;علي حجاج السويسي|ali_hajjaj_alsouasi|3;فارس عباد|fares_abbad|1;عماد زهير حافظ|emad_hafez|3;ناصر القطامي|nasser_alqatami|1;نبيل الرفاعي|nabil_al_rifay|3;نعمة الحسان|neamah_alhassan|3;هاني الرفاعي|hani_arrifai|3;وليد النائحي|waleed_alnaehi|3;ياسر الدوسري|yasser_aldosari|3;ياسر القرشي|yasser_alqurashi|3;ياسر المزروعي|yasser_almazroyee|3;محمد الطبلاوي|mohammad_altablaway|1;يحيى حوا|yahya_hawwa|3;يوسف الشويعي|yousef_alshoaey|3;ماهر المعيقلي|maher|3;محمد اللحيدان|mohammed_allohaidan|1;محمد أيوب|mohammed_ayyub|3;محمد صالح عالم شاه|mohammad_saleh_alim_shah|3;محمد جبريل|mohammed_jibreel|3;محمد صديق المنشاوي (مجوّد)|mohammed_siddiq_alminshawi_mojawwad|1;محمد عبدالحكيم العبدالله (البزي)|mohammad_alabdullah_albizi|1;محمد صديق المنشاوي (مرتّل)|mohammed_siddiq_alminshawi|3;محمد عبدالحكيم العبدالله (الدوري)|mohammad_alabdullah_aldorai|1;محمد عبدالكريم|mohammad_abdullkarem|3;محمود خليل الحصري (مرتّل)|mahmoud_khalil_alhussary|3;محمود خليل الحصري (مجوّد)|mahmoud_khalil_alhussary_mojawwad|3;محمود خليل الحصري (ورش)|mahmoud_khalil_alhussary_warsh|3;مشاري العفاسي|mishary_alafasi|1;محمود علي البنا (مرتّل)|mahmoud_ali__albanna|3;مصطفى إسماعيل|mustafa_ismail|1;محمود علي البنا (مجوّد)|mahmoud_ali__albanna_mojawwad|3;مصطفى رعد العزاوي|mustafa_raad_alazawy|1;مفتاح السلطني (الدوري عن أبي عمرو)|muftah_alsaltany_aldori_an_abi_amr|1;مصطفى اللاهوني|mustafa_allahoni|3;ماهر شخاشيرو|maher_shakhashero|3;محمود الشيمي|mahmood_alsheimy|3;خالد المهنا|khalid_almohana|3;عادل الكلباني|adel_alkhalbany|3;محمود الرفاعي|mahmood_al_rifai|1;موسى بلال|mousa_bilal|3;حاتم فريد الواعر|hatem_fareed_alwaer|3;إبراهيم الدوسري|ibrahim_aldosari|3;مفتاح السلطني (الدوري)|muftah_alsaltany_aldorai|3;جمعان العصيمي|jamaan_alosaimi|3;محمد رشاد الشريف|mohammad_rashad_alshareef|1;يوسف بن نوح أحمد|yousef_bin_noah_ahmad|3;مفتاح السلطني (ابن ذكوان)|muftah_alsaltany_ibn_thakwan_an_ibn_amr|3;معيض الحارثي|moeedh_alharthi|3;عبدالله الكندري|abdullah_alkandari|1;أحمد خضر الطرابلسي|ahmad_khader_altarabulsi|3;أحمد عامر|ahmed_amer|1;أحمد الطرابلسي|ahmed_altrabulsi|3;الدوكالي محمد العالم|addokali_mohammad_alalim|1;محمد عبدالكريم (الأصبهاني)|mohammad_abdullkarem_alasbahani|1;محمد عثمان خان|mohammed_osman_khan|3;طارق عبدالغني دعوب|tareq_abdulgani_daawob|1;الفاتح محمد الزبير|alfateh_alzubair|3;تلاوات متنوعة لمختلف القرّاء|mix|3;تلاوات خاشعة|salma|3;تكبيرات العيد|eid|2;عبدالرحمن الماجد|abdulrahman_almajed|3;الفتاوى العامة|fatwa|3;الرقية الشرعية|roqiah|3;سورة البقرة لعدد من القرّاء|albaqarah|3;تفسير القرآن الكريم|tafseer|3;خالد الجليل|khalid_aljileel|3;ناصر الماجد|nasser_almajed|3;أحمد خليل شاهين|ahmad_shaheen|1;عبدالله الموسى|abdullah_almousa|1;هيثم الجدعاني|hitham_aljadani|3;تراتيل قصيرة متميزة|tarateel|1;ماجد الزامل|majed_alzamel|1;عبدالله الخلف|abdullah_alkhalaf|3;بندر بليلة|bandar_balilah|3;ناصر العصفور|nasser_alosfor|3;إذاعة محمد أبو سنينة|sneineh|1;محمد أيوب (قراءة مميزة)|ayyoub2|3;عبدالرحمن الشحات|a_alshahhat|1;أحمد ديبان|ahmad_deban|3;محمد الأمين قنيوة|qeniwa|3;عبدالعزيز سحيم|a_sheim|3;آيات السكينة|sakeenah|3;صور من حياة الصحابة والتابعين|sahabah|3;أذكار الصباح|athkar_sabah|3;المختصر في تفسير القرآن الكريم|mukhtasartafsir|3;أذكار المساء|athkar_masa|3;في ظلال السيرة النبوية|fi_zilal_alsiyra|3;المختصر في السيرة النبوية|almukhtasar_fi_alsiyra|3;صالح الهبدان|saleh_alhabdan|1;الاختيارات الفقهية — دروس وأحكام|alaikhtiarat_alfiqhayh_bin_baz|3;تفسير القرآن — الخلاصة من تفسير الطبري|tabri|3;ترجمة معاني القرآن — الأوردية (عبدالباسط)|translation_quran_urdu_basit|3;ترجمة معاني القرآن — الإسبانية|translation_quran_spanish_afs|3;ترجمة معاني القرآن — الألبانية|translation_quran_albanian|3;ترجمة معاني القرآن — الألمانية|translation_quran_german|1;ترجمة معاني القرآن — الأوردية (المنشاوي)|translation_quran_urdu_minsh|1;ترجمة معاني القرآن — الإنجليزية (عبدالباسط)|translation_quran_english_basit|1;ترجمة معاني القرآن — الأمازيغية|translation_quran_tamazight|3;ترجمة معاني القرآن — الأوردية (السديس والشريم)|translation_quran_urdu_sds_shur|3;ترجمة معاني القرآن — الإنجليزية (بصفر)|translation_quran_english_bsfr|3;ترجمة معاني القرآن — البوسنية|translation_quran_bosnia|1;ترجمة معاني القرآن — الإنجليزية (ترجمة والك)|translation_quran_english_walk_basit|3;ترجمة معاني القرآن — التركية|translation_quran_turkish|1;ترجمة معاني القرآن — البرتغالية|translation_quran_portuguese|3;ترجمة معاني القرآن — الروسية|translation_quran_Russia|1;ترجمة معاني القرآن — الفرنسية|translation_quran_french|1;ترجمة معاني القرآن — الصينية|translation_quran_chinese|3;ترجمة معاني القرآن — الفارسية|translation_quran_farsi|3;ترجمة معاني القرآن — الكردية|translation_quran_kurdish|1;ترجمة معاني القرآن — اليونانية|translation_quran_greek|1;ترجمة معاني القرآن — الكورية|translation_quran_Korean|1;ترجمة معاني القرآن — المجرية|translation_quran_hungarian|3;سورة الملك|Surah_Al-Mulk|3;فضل شهر رمضان — دروس|ramadan|3;ترجمة معاني القرآن — الهوسا|Translation_Quran_Hausa|3;قصص الأنبياء|alanbiya|1;صحيح مسلم — حديث|saheh-muslim|3;رياض الصالحين — حديث|riyad|1;صحيح البخاري — حديث|saheh-bokharee|3;عبدالله البعيجان|buajan|1;تفسير غريب القرآن|gareeb-quran|1;أحمد طالب بن حميد|a_binhameed|3;بدر التركي|bader|3;الشمائل المحمدية — سيرة|shmaeel|1;هزاع البلوشي|hazza|3";
/* extra sources, every one played from an Egyptian connection on 2026-10-05 (found through radio-browser.info) */
const MI = x=>'https://radio.mp3islam.com/listen/'+x+'/radio.mp3', XC = x=>'https://radio.xecod.com/station/'+x, RJ = id=>['stream', 'n0a', 'n09', 'n12', 'n05'].map(n=>'https://'+n+'.radiojar.com/'+id);
const RADIO_ALT = {saud_alshuraim:[MI('alshuraim')], abdulbasit_abdulsamad:[MI('abdulbasit'), XC('abdulbasit')], abdulbasit_abdulsamad_mojawwad:[XC('abdulbasit'), MI('abdulbasit')], abdulrahman_alsudaes:[MI('sudais')],
  ali_alhuthaifi:[MI('alhuthaifi')], yasser_aldosari:[MI('yaser')], maher:[MI('maher')], mohammed_siddiq_alminshawi:[MI('minshawi'), XC('alminshawi')], mohammed_siddiq_alminshawi_mojawwad:[XC('alminshawi'), MI('minshawi')],
  mahmoud_khalil_alhussary:[XC('alhussary')], mahmoud_khalil_alhussary_mojawwad:[XC('alhussary')], mishary_alafasi:[MI('mishary'), XC('alafasi')], mahmoud_ali__albanna:[XC('albanna')], mahmoud_ali__albanna_mojawwad:[XC('albanna')], bandar_balilah:[XC('bandar-balila')]};
const OFF = (name, urls, q, qre)=>({name, url:urls[0], urls, q, qre, cat:'official'});
const RADIO_OFFICIAL = [
  OFF('إذاعة القرآن الكريم — السعودية', RJ('0tpy1h0kxtzuv'), 'القرآن الكريم', /سعود|Saudi|الرياض/i),
  OFF('إذاعة القرآن الكريم — مكة المكرمة', ['https://edge.mixlr.com/channel/rwumx'].concat(RJ('4wqre23fytzuv')), 'مكة المكرمة', /قر[آا]ن/),
  OFF('إذاعة القرآن الكريم — الكويت', [MI('quran_radio')], 'Quran Radio Kuwait'),
  OFF('إذاعة القرآن الكريم — الشارقة', ['https://l3.itworkscdn.net/smcquranlive/quranradiolive/icecast.audio'], 'Quran Radio Sharjah'),
  OFF('إذاعة القرآن الكريم — صنعاء', ['https://halo.streamerr.co/listen/quran_kareem/radio.mp3'], 'صنعاء', /قر[آا]ن/),
  OFF('إذاعة القرآن الكريم — الأردن', ['https://jrtv-live.ercdn.net/jrradio/quranradio.m3u8'], 'Quran Radio (JO)'),
  OFF('إذاعة القرآن الكريم — سلطنة عُمان', ['https://partwota.cdn.mgmlcdn.com/quranrdoorg/quranrdo.stream_aac/chunklist.m3u8'], 'Quran Program Oman'),
  OFF('إذاعة المنير للقرآن — طرابلس', ['https://live.munir.ly/proxy/almunirtip/stream', 'https://live.munir.ly/proxy/almunir/stream'], 'Almunir Radio'),
  OFF('صوت القرآن — إسلام آباد', ['https://whmsonic.radio.gov.pk:7002/stream?type=http&nocache=12'], 'SOUTUL QURAN'),
  OFF('إذاعة الحسنى للقرآن', ['https://stream.zeno.fm/pyc8kax6f2zuv'], 'Al Husnaa Quran'),
  OFF('القرآن للروح (Quran for the Soul)', ['https://islamicbulletin.site:8102/stream'], 'Quran for the Soul'),
  OFF('إذاعة سايانغ قرآن — إندونيسيا', ['https://radio.sayangquran.com/listen/radiosq/radio.mp3'], 'Radio Sayang Quran')];
const RADIO_FALLBACK = RADIO_OFFICIAL.concat(
  ['أحمد تميم المراغي|ahmad-tamim', 'عمار الملا|ammar-almulla', 'عادل ريان|AdelRayan'].map(x=>{ const [name, id] = x.split('|'); return {name, url:XC(id), urls:[XC(id)], q:name}; }),
  RADIO_RAW.split(';').map(r=>{
  const [name, slug, m] = r.split('|'), a = 'https://qurango.net/radio/'+slug, b = 'https://backup.qurango.net/radio/'+slug;
  const urls = (m === '2' ? [b, a] : [a, b]).concat(RADIO_ALT[slug] || []);
  return {name, slug, url:urls[0], urls};
}));
/* mp3quran publishes the current address of each of its stations; when online we add it as one more source (kept for a day) */
M.radioRefresh = async function(){
  try{
    let c = M.store.get('mqRadios', null);
    if(!c || Date.now() - c.at > 864e5){ const r = await fetch('https://mp3quran.net/api/v3/radios?language=ar'); if(!r.ok) return; const j = await r.json(); const map = {}; (j.radios || []).forEach(x=>{ const m = /\/radio\/([^/?#]+)/.exec(x.url || ''); if(m) map[m[1]] = x.url; }); c = {at:Date.now(), map}; M.store.set('mqRadios', c); }
    RADIO_FALLBACK.forEach(st=>{ const u = st.slug && c.map[st.slug]; if(u && /^https:/.test(u) && !st.urls.includes(u)) st.urls.splice(1, 0, u); });
  }catch(e){}
};
const TV_CHANNELS = [
  {name:'البث المباشر للحرم المكي', urls:['https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8','https://media2.streambrothers.com:1936/8122/8122/playlist.m3u8']},
  {name:'قناة السنة النبوية (المدينة)', urls:['https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8']},
  {name:'قناة مكة', urls:['https://media2.streambrothers.com:1936/8122/8122/playlist.m3u8']},
  {name:'قناة اقرأ', urls:['https://playlist.fasttvcdn.com/pl/dlkqw1ftuvuuzkcb4pxdcg/Iqraafasttv3/playlist.m3u8','https://playlist.fasttvcdn.com/pl/dlkqw1ftuvuuzkcb4pxdcg/Iqraafasttv1/playlist.m3u8']},
  {name:'قناة اقرأ للقرآن الكريم', urls:['https://playlist.fasttvcdn.com/pl/dlkqw1ftuvuuzkcb4pxdcg/Iqraafasttv2/playlist.m3u8']},
  {name:'تلفزيون قطر — القرآن الكريم', urls:['https://qatartv.akamaized.net/hls/live/20000612/qtvquran/master.m3u8']},
  {name:'قناة البحرين للقرآن الكريم', urls:['https://5c7b683162943.streamlock.net/live/ngrp:bahrainquran_all/playlist.m3u8']},
  {name:'قناة القرآن الكريم (العراق)', urls:['https://ktvlive.online/stream/hls/ch1.m3u8']},
  {name:'قناة الهدى (بالإنجليزية)', urls:['https://cdn.bestream.io:19360/elfaro1/elfaro1.m3u8']}
].map(c=>Object.assign(c, {url:c.urls[0]}));
const TV_FALLBACK = TV_CHANNELS;
async function getList(kind){ return kind === 'radio' ? RADIO_FALLBACK : TV_FALLBACK; }
/* the app only talks https: plain-http stream links are upgraded */
const secure = u=>String(u || '').trim().replace(/^http:\/\//i, 'https://');
const okUrl = u=>/^https:\/\/[^\s/]+\.[^\s]+$/i.test(u);
const liveSeg = cur=>h('div', {style:'margin-bottom:12px'}, M.seg([['r', 'الإذاعة'], ['t', 'البث المرئي']], cur, v=>{ if(v === cur) return; const vw = M.views[M.views.length - 1]; if(vw) vw.close(); setTimeout(()=>{ v === 'r' ? M.openRadio() : M.openTV(); }, 80); }));
const radio = M.radio = {el:null, cur:null, msg:'', hls:null, tok:0};
/* Every station has a list of sources. The player walks through them (error, or 10 s without audio → next one), remembers which one
   worked, and as a last resort asks the community directory radio-browser.info for fresh links to the same station. */
const srcOf = st=>(st.urls || [st.url].concat(st.alt ? [st.alt] : [])).map(secure).filter((u, i, a)=>okUrl(u) && a.indexOf(u) === i);
const RB_HOSTS = ['de1', 'de2', 'fi1', 'all'].map(x=>'https://'+x+'.api.radio-browser.info');
async function rbGet(path){
  for(const host of RB_HOSTS){
    try{
      const ctl = new AbortController(), t = setTimeout(()=>ctl.abort(), 9000);
      const r = await fetch(host+path, {signal:ctl.signal}); clearTimeout(t);
      if(r.ok) return await r.json();
    }catch(e){}
  }
  throw new Error('rb');
}
const rbOk = x=>x && x.lastcheckok == 1 && /^https:/i.test(x.url_resolved || x.url || '');
async function rbRescue(st){
  const arr = await rbGet('/json/stations/search?hidebroken=true&limit=40&name='+encodeURIComponent(st.q));
  const out = []; arr.filter(rbOk).filter(x=>!st.qre || st.qre.test(x.name)).forEach(x=>{ [x.url_resolved, x.url].forEach(u=>{ u = secure(u); if(okUrl(u) && !out.includes(u)) out.push(u); }); });
  return out;
}
M.radioWorld = async function(force){
  const c = M.store.get('rbList', null);
  if(!force && c && c.list && c.list.length && Date.now() - c.at < 864e5) return c.list;
  const q = '/json/stations/search?hidebroken=true&is_https=true&order=votes&reverse=true&limit=250&';
  const parts = await Promise.all(['tag=quran', 'name='+encodeURIComponent('قرآن'), 'name='+encodeURIComponent('قران'), 'name=quran'].map(p=>rbGet(q+p).catch(()=>[])));
  const seen = {}, list = [];
  [].concat(...parts).filter(rbOk).forEach(x=>{
    const u = secure(x.url_resolved || x.url), name = String(x.name || '').replace(/\s+/g, ' ').trim().slice(0, 70);
    if(!okUrl(u) || seen[u] || !name || /qurango\.net/i.test(u)) return; seen[u] = 1;
    const u2 = secure(x.url); list.push({name, url:u, urls:u2 !== u && okUrl(u2) ? [u, u2] : [u], cat:'world', sub:[x.country, x.codec, x.bitrate ? x.bitrate+'k' : ''].filter(Boolean).join(' • ')});
  });
  if(!list.length){ if(c && c.list) return c.list; throw new Error('empty'); }
  M.store.set('rbList', {at:Date.now(), list}); return list;
};
function radioState(msg){ radio.msg = msg || ''; if(radio.onState) try{ radio.onState(); }catch(e){} }
function playRadio(st){
  if(M.player && M.player.stop) M.player.stop();
  const my = ++radio.tok, el = radio.el = radio.el || Object.assign(new Audio(), {preload:'none'});
  if(!el._st){ el._st = 1; ['playing', 'pause'].forEach(e=>el.addEventListener(e, ()=>radio.onState && radio.onState())); }
  const kill = ()=>{ clearTimeout(radio.wd); if(radio.hls){ try{ radio.hls.destroy(); }catch(e){} radio.hls = null; } };
  const okMap = M.store.get('radioOk', {}); let list = srcOf(st), tried = 0, rescued = false;
  const first = list.indexOf(okMap[st.url]); if(first > 0){ list.unshift(list.splice(first, 1)[0]); } else if(first < 0 && okUrl(okMap[st.url] || '')) list.unshift(okMap[st.url]); // the source that worked last time goes first
  kill(); radio.cur = st;
  el.onerror = ()=>{ if(my === radio.tok && !radio.hls) next(); };
  el.onplaying = ()=>{ if(my !== radio.tok) return; clearTimeout(radio.wd); radioState(''); const m = M.store.get('radioOk', {}); if(m[st.url] !== list[tried]){ m[st.url] = list[tried]; M.store.set('radioOk', m); } };
  function give(){ kill(); el.pause(); radioState('تعذّر تشغيل هذه الإذاعة الآن — جرّب إذاعة أخرى'); M.toast('تعذّر تشغيل هذه الإذاعة الآن'); M.emit('radio'); }
  function next(){
    if(my !== radio.tok) return;
    tried++;
    if(tried < list.length) return attempt();
    if(st.q && !rescued){
      rescued = true; radioState('جارٍ البحث عن مصدر آخر للإذاعة…');
      rbRescue(st).then(more=>{ if(my !== radio.tok) return; more = more.filter(u=>!list.includes(u)); if(!more.length) return give(); list = list.concat(more); attempt(); }).catch(()=>{ if(my === radio.tok) give(); });
      return;
    }
    give();
  }
  function attempt(){
    kill(); const u = list[tried];
    radioState(tried ? 'جارٍ تجربة مصدر بديل ('+M.n(tried + 1)+')…' : 'جارٍ الاتصال…');
    radio.wd = setTimeout(()=>{ if(my === radio.tok && el.readyState < 3) next(); }, 10000);
    if(/\.m3u8(\?|$)/i.test(u) && !el.canPlayType('application/vnd.apple.mpegurl')){
      loadHls().then(()=>{
        if(my !== radio.tok) return;
        if(!(window.Hls && Hls.isSupported())) return next();
        const hl = radio.hls = new Hls({maxBufferLength:20});
        hl.on(Hls.Events.ERROR, (e, d)=>{ if(d && d.fatal && my === radio.tok && radio.hls === hl) next(); });
        hl.on(Hls.Events.MANIFEST_PARSED, ()=>{ el.play().catch(()=>{}); });
        hl.loadSource(u); hl.attachMedia(el);
      }).catch(()=>{ if(my === radio.tok) next(); });
    } else { el.src = u; el.play().catch(()=>{}); }
  }
  if(!list.length) return give();
  attempt();
  if('mediaSession' in navigator){ try{ navigator.mediaSession.metadata = new MediaMetadata({title:st.name, artist:'إذاعة القرآن'}); }catch(e){} }
  M.emit('radio');
}
M.radioStop = function(){ radio.tok++; clearTimeout(radio.wd); if(radio.hls){ try{ radio.hls.destroy(); }catch(e){} radio.hls = null; } if(radio.el){ radio.el.pause(); } radio.cur = null; radio.msg = ''; M.emit('radio'); };
const CAIRO = {name:'إذاعة القرآن الكريم من القاهرة', url:'https://stream.radiojar.com/8s5u5tpdtwzuv', urls:RJ('8s5u5tpdtwzuv').concat([XC('quran-cairo')]), q:'القاهرة', qre:/قر[آا]ن/, main:true};
const RSEC = [['main','الرئيسية'],['reciters','القرّاء'],['tafsir','تفسير ودروس وأذكار'],['intl','ترجمات'],['world','إذاعات العالم'],['fav','المفضلة']];
function radioCat(n, st){
  if(st && st.cat) return st.cat;
  if(/ترجمة معاني/.test(n)) return 'intl';
  if(/تفسير|فتاو|سيرة|حديث|دروس|قصص|أحكام|الصحابة|الرقية|أذكار|الشمائل|السكينة/.test(n)) return 'tafsir';
  if(/^إذاعة القرآن/.test(n)) return 'official';
  return 'reciters';
}
M.openRadio = function(){
  const list = h('div.list.card'); const q = h('input.field', {placeholder:'ابحث عن إذاعة…', type:'search'});
  let data = [], sec = 'main', world = null, wErr = false;
  const loadWorld = force=>{ wErr = false; if(force) world = null; M.radioWorld(force).then(l=>{ world = l; draw(); }).catch(()=>{ wErr = true; draw(); }); };
  const nowSt = h('div.rn-k', 'الإذاعة الأساسية'), nowName = h('div.rn-t.title-font', '—'), nowBtn = h('button.rn-play', {'aria-label':'تشغيل'}), eq = h('div.rn-eq', h('i'), h('i'), h('i'), h('i'));
  const now = h('div.radio-now2', h('span.rn-ic', {html:M.icon('s:radio')}), h('div.grow', nowSt, nowName, eq), nowBtn);
  const tabs = h('div.chips.radio-tabs', {style:'overflow-x:auto;flex-wrap:nowrap;margin:12px 0;padding-bottom:2px'});
  function drawTabs(){
    tabs.innerHTML = '';
    RSEC.forEach(([k, l])=>tabs.append(h('button.chip'+(sec === k ? '.on' : ''), {style:'white-space:nowrap;flex:none', onclick:()=>{ sec = k; if(k === 'world' && !world) loadWorld(); drawTabs(); draw(); }}, l)));
  }
  function draw(){
    list.innerHTML = ''; const k = q.value.trim();
    const fav = M.store.get('radioFav', []);
    const rowOf = (st, big)=>{
      const isFav = fav.includes(st.url);
      const heart = h('span.icon-btn.fav-btn'+(isFav ? '.on' : ''), {role:'button', 'aria-label':isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة', onclick:e=>{ e.stopPropagation(); const f = M.store.get('radioFav', []); const i = f.indexOf(st.url); if(i < 0) f.push(st.url); else f.splice(i, 1); M.store.set('radioFav', f); M.haptic(10); draw(); }}, M.ic('heart'));
      const playing = radio.cur && radio.cur.url === st.url && radio.el && !radio.el.paused;
      return M.item({icon:'radio', title:st.name, sub:big ? 'البث المباشر • الإذاعة الأساسية' : (st.sub || null), onClick:()=>{ playRadio(st); sync(); }, trail:h('span.row-flex.gap-s', playing ? M.ic('volume') : null, heart)});
    };
    let arr;
    const all = ()=>[CAIRO].concat(data, world || []);
    if(k){ const kk = k.toLowerCase(); arr = all().filter(x=>x.name.toLowerCase().includes(kk)); }
    else if(sec === 'main'){
      list.append(rowOf(CAIRO, true));
      const f = data.filter(x=>fav.includes(x.url));
      if(f.length){ list.append(h('div.hz-h.title-font', 'المفضلة')); f.forEach(x=>list.append(rowOf(x))); }
      const off = data.filter(x=>radioCat(x.name, x) === 'official');
      if(off.length){ list.append(h('div.hz-h.title-font', 'إذاعات رسمية')); off.forEach(x=>list.append(rowOf(x))); }
      const cnt = {}; data.forEach(x=>{ const c = radioCat(x.name, x); cnt[c] = (cnt[c] || 0) + 1; });
      list.append(h('div.small.muted', {style:'padding:12px'}, 'تصفّح الأقسام من الأعلى: قرّاء ('+M.n(cnt.reciters || 0)+')، تفسير ودروس وأذكار ('+M.n(cnt.tafsir || 0)+')، ترجمات ('+M.n(cnt.intl || 0)+').'));
      return;
    }
    else if(sec === 'fav') arr = all().filter(x=>fav.includes(x.url));
    else if(sec === 'world'){
      if(!world && !wErr){ list.append(h('div.empty', 'جارٍ تحميل قائمة الإذاعات…')); return; }
      if(wErr && !world){ list.append(h('div.empty', 'تعذّر تحميل القائمة — تحقق من الاتصال', h('div', {style:'margin-top:10px'}, h('button.btn.sm', {onclick:()=>{ loadWorld(true); draw(); }}, M.ic('refresh'), 'إعادة المحاولة')))); return; }
      arr = world;
    }
    else arr = data.filter(x=>radioCat(x.name, x) === sec);
    if(!arr.length){ list.append(h('div.empty', sec === 'fav' && !k ? 'لم تضف إذاعات للمفضلة بعد' : 'لا نتائج')); return; }
    arr.slice(0, 300).forEach(st=>list.append(rowOf(st, st === CAIRO)));
  }
  function sync(){
    const playing = !!(radio.cur && radio.el && !radio.el.paused);
    nowName.textContent = radio.cur ? radio.cur.name : CAIRO.name;
    nowSt.textContent = radio.cur ? (radio.msg || (playing && radio.el.readyState > 2 ? 'جارٍ التشغيل الآن' : playing ? 'جارٍ الاتصال…' : 'متوقفة مؤقتًا')) : 'الإذاعة الأساسية';
    now.classList.toggle('on', playing);
    nowBtn.replaceChildren(M.ic(playing ? 'pause' : 'play')); nowBtn.setAttribute('aria-label', playing ? 'إيقاف مؤقت' : 'تشغيل');
    nowBtn.onclick = ()=>{ if(!radio.cur) playRadio(CAIRO); else if(/^تعذّر/.test(radio.msg)) playRadio(radio.cur); else if(radio.el.paused) radio.el.play().catch(()=>{}); else radio.el.pause(); sync(); };
    draw();
  }
  M.openView({title:'الإذاعة والبث المباشر', id:'radio', build:b=>{
    b.append(liveSeg('r'), now, h('div', {style:'margin:12px 0 0'}, q), tabs, list, h('div.tiny.muted', {style:'margin-top:8px'}, 'يتطلب البث اتصالًا بالإنترنت. لأغلب الإذاعات أكثر من مصدر (mp3quran.net و radiojar و mp3islam و OmniRadio ودليل radio-browser.info)، وإن تعطّل مصدر ينتقل التطبيق إلى التالي تلقائيًا.'));
    drawTabs(); draw();
    getList('radio').then(d=>{ data = d.filter(x=>!/القاهرة/.test(x.name)); sync(); });
    M.radioRefresh();
    radio.onState = sync; const c = M.store.get('rbList', null); if(c && c.list) world = c.list;
    q.addEventListener('input', M.debounce(draw, 150));
  }, onClose:()=>{ radio.onState = null; }});
};
let hlsLoading = null;
function loadHls(){ return hlsLoading = hlsLoading || new Promise((res, rej)=>{ if(window.Hls) return res(); const sc = document.createElement('script'); sc.src = 'js/vendor/hls.min.js'; sc.onload = res; sc.onerror = ()=>{ hlsLoading = null; rej(); }; document.head.appendChild(sc); }); }
M.openTV = function(){
  if(radio.el) radio.el.pause();
  if(M.player && M.player.stop) M.player.stop();
  const vid = h('video.tv-video', {controls:true, playsinline:true, preload:'auto'}); vid.setAttribute('webkit-playsinline', '');
  let hls = null, token = 0, cur = null, timer = null, curIdx = 0;
  const status = h('div.tv-status.small.muted', 'اختر قناة للبدء');
  const list = h('div.list.card'); const nm = h('div.bold', '—');
  const actions = h('div.row-flex.gap-s', {style:'flex-wrap:wrap;margin:8px 0'});
  const custom = ()=>M.store.get('tvCustom', []);
  const setStatus = (t, err)=>{ status.textContent = t; status.classList.toggle('err', !!err); };
  const teardown = ()=>{ clearTimeout(timer); if(hls){ try{ hls.destroy(); }catch(e){} hls = null; } };
  function fail(msg){
    if(cur && cur.urls && curIdx + 1 < cur.urls.length){ play(cur, curIdx + 1); return; }
    teardown(); setStatus(msg || 'تعذّر تشغيل هذه القناة', true); actions.innerHTML = '';
    if(cur) actions.append(
      h('button.btn.sm', {onclick:()=>play(cur)}, M.ic('refresh'), 'إعادة المحاولة'),
      h('button.btn.tonal.sm', {onclick:()=>{ try{ const u = secure((cur.urls || [cur.url])[curIdx]); if(okUrl(u)) window.open(u, '_blank', 'noopener'); }catch(e){} }}, M.ic('globe'), 'فتح في تطبيق آخر'),
      h('button.btn.ghost.sm', {onclick:()=>{ M.copy ? M.copy(cur.url) : navigator.clipboard && navigator.clipboard.writeText(cur.url); M.toast('تم نسخ الرابط'); }}, M.ic('copy'), 'نسخ الرابط'));
  }
  function viaHls(u, my){
    return loadHls().then(()=>{
      if(my !== token) return;
      if(!(window.Hls && Hls.isSupported())) return fail('هذا الجهاز لا يدعم تشغيل البث المباشر');
      hls = new Hls({maxBufferLength:20, liveSyncDurationCount:3, enableWorker:true});
      hls.on(Hls.Events.ERROR, (e, d)=>{ if(d && d.fatal){ if(d.type === Hls.ErrorTypes.NETWORK_ERROR && !hls._retried){ hls._retried = 1; hls.startLoad(); } else fail('انقطع البث أو أن القناة لا تعمل حاليًا'); } });
      hls.on(Hls.Events.MANIFEST_PARSED, ()=>{ vid.play().catch(()=>{}); });
      hls.loadSource(u); hls.attachMedia(vid);
    }).catch(()=>{ if(my === token) fail('تعذّر تحميل مشغّل البث'); });
  }
  function play(ch, idx){
    idx = idx || 0; curIdx = idx;
    const my = ++token; cur = ch; teardown(); actions.innerHTML = '';
    nm.textContent = ch.name; setStatus(idx ? 'جارٍ تجربة مصدر بديل ('+M.n(idx + 1)+')…' : 'جارٍ الاتصال بالقناة…');
    vid.pause(); vid.removeAttribute('src'); vid.load();
    const u = secure((ch.urls || [ch.url])[idx]), isHls = /\.m3u8(\?|$)/i.test(u);
    const native = isHls ? vid.canPlayType('application/vnd.apple.mpegurl') : 'maybe';
    let started = false;
    const ok = ()=>{ started = true; clearTimeout(timer); setStatus('يعمل الآن'); };
    vid.onplaying = ok; vid.onerror = ()=>{ if(my !== token || started) return; if(isHls && !hls){ setStatus('جارٍ تجربة مشغّل بديل…'); viaHls(u, my); } else fail(); };
    vid.onwaiting = ()=>{ if(started) setStatus('جارٍ التحميل…'); };
    if(native){ vid.src = u; vid.play().catch(()=>{}); timer = setTimeout(()=>{ if(my === token && !started){ if(isHls && !hls){ vid.removeAttribute('src'); vid.load(); viaHls(u, my); } else fail('لا يستجيب البث. تحقق من الاتصال بالإنترنت.'); } }, 9000); }
    else if(isHls){ viaHls(u, my); timer = setTimeout(()=>{ if(my === token && !started) fail('لا يستجيب البث. تحقق من الاتصال بالإنترنت.'); }, 15000); }
  }
  function draw(d){
    list.innerHTML = '';
    d.concat(custom()).forEach(ch=>{
      const own = custom().some(x=>x.url === ch.url);
      list.append(M.item({icon:'tv', title:ch.name, sub:own ? 'قناة أضفتها' : null, onClick:()=>play(ch), trail:own ? h('span.icon-btn', {role:'button', 'aria-label':'حذف', onclick:e=>{ e.stopPropagation(); M.store.set('tvCustom', custom().filter(x=>x.url !== ch.url)); draw(chans); }}, M.ic('trash')) : null}));
    });
  }
  let chans = [];
  M.openView({title:'الإذاعة والبث المباشر', id:'tv', onClose:()=>{ token++; teardown(); vid.pause(); vid.removeAttribute('src'); try{ vid.load(); }catch(e){} }, build:b=>{
    const card = h('div.card.tv-card', vid, h('button.icon-btn.tv-fsx', {'aria-label':'إغلاق ملء الشاشة', onclick:()=>card.classList.remove('fs')}, M.ic('close')));
    // fill the screen: the real fullscreen API first (the Android shell turns the screen sideways), a full-window layout if it is refused
    const goFs = ()=>{
      try{
        const r = vid.requestFullscreen ? vid.requestFullscreen() : vid.webkitRequestFullscreen ? vid.webkitRequestFullscreen() : vid.webkitEnterFullscreen ? vid.webkitEnterFullscreen() : null;
        if(r && r.catch) r.catch(()=>card.classList.add('fs')); else if(r === null) card.classList.add('fs');
      }catch(e){ card.classList.add('fs'); }
    };
    b.append(liveSeg('t'), card, h('div.row-flex.pad-s', h('div.grow', nm, status), h('button.btn.tonal.sm', {onclick:goFs}, M.ic('fullscreen'), 'ملء الشاشة')), actions, list,
      h('button.btn.tonal.sm', {style:'margin-top:12px', onclick:async()=>{
        const u = await M.prompt('رابط البث (m3u8 أو mp4)', 'https://'); if(!u) return; const su = secure(u); if(!okUrl(su)){ M.toast('الرابط غير صالح — يجب أن يبدأ بـ https://'); return; }
        const n = await M.prompt('اسم القناة', 'قناتي'); const c = custom(); c.push({name:String(n || 'قناتي').slice(0, 60), url:su}); M.store.set('tvCustom', c); draw(chans);
      }}, M.ic('plus'), 'إضافة قناة بالرابط'),
      h('div.tiny.muted', {style:'margin-top:8px;line-height:1.8'}, 'يتطلب البث اتصالًا بالإنترنت. قد تتوقف القناة من مصدرها؛ جرّب إعادة المحاولة أو افتحها في تطبيق آخر.'));
    list.append(h('div.empty', 'جارٍ تحميل القنوات…'));
    chans = TV_CHANNELS; draw(chans); play(chans[0]);
  }});
};
})();
