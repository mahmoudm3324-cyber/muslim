/* ===== Ramadan: today's fast (suhoor / iftar countdown, daily deeds), imsakiyah, khatma plan, fasting record, last ten nights, zakat al-fitr ===== */
(function(){
const M = window.M, h = M.h;
const DEEDS = [['fast', 'صيام اليوم'], ['fajr', 'الفجر في وقتها'], ['quran', 'ورد القرآن'], ['taraweeh', 'صلاة التراويح'], ['adhkar', 'أذكار الصباح والمساء'], ['sadaqa', 'صدقة ولو قليلة'], ['iftar', 'تفطير صائم'], ['dua', 'دعاء عند الفطر']];
const DUAS = [
  ['دعاء الإفطار', '«ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ»', 'رواه أبو داود وحسّنه الألباني'],
  ['دعاء ليلة القدر', '«اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي»', 'رواه الترمذي وصححه الألباني (عن عائشة رضي الله عنها)'],
  ['عند الفطر', '«لِلصَّائِمِ عِنْدَ فِطْرِهِ دَعْوَةٌ مَا تُرَدُّ»', 'رواه ابن ماجه وضعّفه الألباني — فيُستحب الدعاء بما تيسّر عند الفطر'],
  ['دعاء إذا أفطر عند قوم', '«أَفْطَرَ عِنْدَكُمُ الصَّائِمُونَ وَأَكَلَ طَعَامَكُمُ الْأَبْرَارُ وَصَلَّتْ عَلَيْكُمُ الْمَلَائِكَةُ»', 'رواه أبو داود وصححه الألباني'],
  ['إذا سابّه أحد وهو صائم', '«إِنِّي صَائِمٌ، إِنِّي صَائِمٌ»', 'متفق عليه']];
const TIPS = [
  ['السحور', '«تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً» — متفق عليه'],
  ['تعجيل الفطر', '«لَا يَزَالُ النَّاسُ بِخَيْرٍ مَا عَجَّلُوا الْفِطْرَ» — متفق عليه'],
  ['قيام رمضان', '«مَنْ قَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ» — متفق عليه'],
  ['صيام رمضان', '«مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ» — متفق عليه'],
  ['تفطير الصائم', '«مَنْ فَطَّرَ صَائِمًا كَانَ لَهُ مِثْلُ أَجْرِهِ» — رواه الترمذي وصححه'],
  ['الجود والقرآن', 'كان النبي ﷺ أجود الناس، وكان أجود ما يكون في رمضان حين يلقاه جبريل فيدارسه القرآن — متفق عليه'],
  ['حفظ اللسان', '«مَنْ لَمْ يَدَعْ قَوْلَ الزُّورِ وَالْعَمَلَ بِهِ فَلَيْسَ لِلَّهِ حَاجَةٌ فِي أَنْ يَدَعَ طَعَامَهُ وَشَرَابَهُ» — رواه البخاري'],
  ['العمرة في رمضان', '«عُمْرَةٌ فِي رَمَضَانَ تَعْدِلُ حَجَّةً» — رواه الترمذي وابن ماجه'],
  ['ليلة القدر', '«تَحَرَّوْا لَيْلَةَ الْقَدْرِ فِي الْوِتْرِ مِنَ الْعَشْرِ الْأَوَاخِرِ مِنْ رَمَضَانَ» — رواه البخاري'],
  ['ست من شوال', '«مَنْ صَامَ رَمَضَانَ ثُمَّ أَتْبَعَهُ سِتًّا مِنْ شَوَّالٍ كَانَ كَصِيَامِ الدَّهْرِ» — رواه مسلم']];

M.openRamadan = function(opts){
  opts = opts || {};
  const today = new Date(); today.setHours(12, 0, 0, 0);
  let y = M.hijri(today).y;
  if(today > M.addDays(M.hijriToGreg(y, 9, 1), M.hijriMonthLen(y, 9) - 1)) y++;
  const start = M.hijriToGreg(y, 9, 1), mlen = M.hijriMonthLen(y, 9); start.setHours(12, 0, 0, 0);
  const diff = Math.round((start - today) / 864e5), inR = diff <= 0 && -diff < mlen, dayNo = inR ? -diff + 1 : 0;
  const S = {tab:opts.tab || (inR ? 'today' : 'imsak')}, content = h('div'), tabs = h('div.chips.ram-tabs');
  const key = k=>'ram'+y+':'+k, get = (k, d)=>M.store.get(key(k), d), set = (k, v)=>M.store.set(key(k), v);
  const TABS = [['today', inR ? 'يومي' : 'استعدادي'], ['imsak', 'الإمساكية'], ['fast', 'صيامي'], ['khatma', 'الختمة'], ['last', 'العشر الأواخر'], ['zakat', 'زكاة الفطر'], ['dua', 'أدعية وأعمال'], ['ahkam', 'أحكام الصيام']];
  let untick = null;
  const view = M.openView({title:'رمضان', id:'ramadan', onClose:()=>{ untick && untick(); }, build:b=>{ b.append(hero(), tabs, content); }});

  function hero(){
    const big = h('div.ram-big.num'), cap = h('div.ram-cap'), sub = h('div.small.ram-sub'), ring = h('div.ram-ring', h('div', big, cap));
    const chips = h('div.ram-times');
    const tick = ()=>{
      const now = new Date();
      if(!inR){ ring.style.setProperty('--pg', Math.max(4, 360 - Math.min(360, diff * 12))+'deg'); big.textContent = M.n(Math.max(0, diff)); cap.textContent = diff === 1 ? 'يوم على رمضان' : 'يومًا على رمضان';
        sub.textContent = 'يبدأ تقريبًا '+M.WEEKDAYS[start.getDay()]+' '+M.n(start.getDate())+' '+M.GMONTHS[start.getMonth()]+' '+M.n(start.getFullYear()); return; }
      const t = M.prayerTimes(now), tm = M.prayerTimes(M.addDays(now, 1));
      let target, label, from;
      if(now < t.fajr){ target = t.fajr; label = 'على انتهاء السحور'; from = M.prayerTimes(M.addDays(now, -1)).maghrib; }
      else if(now < t.maghrib){ target = t.maghrib; label = 'على الإفطار'; from = t.fajr; }
      else { target = tm.fajr; label = 'على سحور الغد'; from = t.maghrib; }
      big.textContent = M.n(M.fmtDur(target - now)); cap.textContent = label;
      ring.style.setProperty('--pg', Math.max(4, Math.min(360, (now - from) / (target - from) * 360))+'deg');
      sub.textContent = 'اليوم '+M.n(dayNo)+' من رمضان '+M.n(y)+' هـ • مدة الصيام '+M.n(M.fmtDur(t.maghrib - t.fajr).replace(/:\d\d$/, ''))+' ساعة';
    };
    { const t = M.prayerTimes(new Date()); chips.append(...[['السحور حتى', t.fajr], ['الإفطار', t.maghrib], ['التراويح بعد', t.isha]].map(([l, d])=>h('div', h('small', l), h('b.num', M.fmt(d))))); }
    tick(); untick = M.every(()=>{ if(!ring.isConnected) return; tick(); });
    return h('div.card.accent.ram-hero2', h('div.title-font.bold.ram-title', 'رمضان '+M.n(y)+' هـ'), ring, sub, chips, h('div.tiny.ram-note', 'التواريخ فلكية تقريبية؛ يُعمل برؤية الهلال في بلدك.'));
  }
  function drawTabs(){ tabs.replaceChildren(...TABS.map(([k, l])=>h('button.chip'+(S.tab === k ? '.on' : ''), {onclick:()=>{ S.tab = k; paint(); }}, l))); }
  function paint(){ drawTabs(); content.replaceChildren(); ({today:tToday, imsak:tImsak, fast:tFast, khatma:tKhatma, last:tLast, zakat:tZakat, dua:tDua, ahkam:tAhkam})[S.tab](content);
    if(S.tab !== 'today') setTimeout(()=>{ const on = tabs.querySelector('.chip.on'); on && on.scrollIntoView && on.scrollIntoView({inline:'center', block:'nearest'}); }, 30); }
  /* ---- rulings: suhoor, iftar, making up missed days (were three separate pages) ---- */
  function tAhkam(el){
    ['suhoor', 'iftar', 'qada_ram'].forEach((k, i)=>M.guideInto && M.guideInto(el, k, {heading:true, closed:i > 0, noNote:i < 2}));
    el.append(h('button.btn.tonal.block', {style:'margin-top:12px', onclick:()=>M.sectionOpen('qada')}, M.ic('check'), 'سجّل ما عليك من أيام في «قضاء الصلوات والصيام»'));
  }

  /* ---- today: deeds checklist + tip of the day ---- */
  function tToday(el){
    const idx = inR ? dayNo : 0, done = get('d'+idx, {});
    const bar = h('i'), cnt = h('span.small.muted');
    const upd = ()=>{ const n = DEEDS.filter(([k])=>done[k]).length; bar.style.width = (n / DEEDS.length * 100)+'%'; cnt.textContent = M.n(n)+' / '+M.n(DEEDS.length); };
    const tip = TIPS[(idx || new Date().getDate()) % TIPS.length];
    el.append(h('div.card.pad.ram-tip', h('div.small.muted', inR ? 'وصية اليوم' : 'تهيئة قبل رمضان'), h('div.bold', tip[0]), h('div.qfont.ram-tipt', tip[1])));
    if(!inR) el.append(h('div.card.pad', h('div.bold', 'استعدّ من الآن'), ...['اقضِ ما عليك من صيام قبل دخول الشهر', 'ابدأ وردًا يوميًا من القرآن ولو صفحات قليلة', 'جهّز خطة الختمة من تبويب «الختمة»', 'تعوّد صيام الاثنين والخميس'].map(x=>h('div.gd-b', h('span.gd-dot'), h('span', x)))));
    const list = h('div.card.ram-deeds');
    /* during Ramadan the deeds that also exist in «متابعة العبادات» / «سجل الصلوات» are one and the same tick */
    const LINK = {fast:['fast'], quran:['qira'], taraweeh:['qiyam_rak'], adhkar:['adhkar_morning', 'adhkar_evening']};
    const tdy = M.dkey();
    if(inR){ try{
      Object.keys(LINK).forEach(k=>{ if(M.T && LINK[k].every(id=>M.T.get(tdy, id))) done[k] = 1; });
      if(M.PL){ const f = M.PL.get(tdy, 'fajr'); if(f === 'o' || f === 'j') done.fajr = 1; }
    }catch(e){} }
    const linkSet = (k, v)=>{ if(!inR) return; try{
      if(LINK[k] && M.T) LINK[k].forEach(id=>M.T.check(tdy, id, v));
      if(k === 'fajr' && M.PL){ const f = M.PL.get(tdy, 'fajr'); if(v && !f) M.PL.set(tdy, 'fajr', 'o'); else if(!v && f === 'o') M.PL.set(tdy, 'fajr', ''); }
    }catch(e){} };
    DEEDS.forEach(([k, l])=>list.append(h('button.ram-deed'+(done[k] ? '.on' : ''), {'aria-pressed':!!done[k], onclick:function(){ done[k] = !done[k]; if(!done[k]) delete done[k]; set('d'+idx, done); linkSet(k, !!done[k]); this.classList.toggle('on', !!done[k]); M.haptic && M.haptic(14); upd();
      if(k === 'fast' && inR){ const f = get('fast', {}); if(done[k]) f[idx] = 1; else if(f[idx] === 1) delete f[idx]; set('fast', f); } }}, h('span.cb', M.ic('check')), h('span.grow', l))));
    el.append(h('div.row-flex', {style:'margin:14px 2px 8px'}, h('div.grow.bold', inR ? 'أعمال اليوم '+M.n(idx) : 'جرّب قائمة أعمال اليوم'), cnt), h('div.bar', {style:'margin-bottom:10px'}, bar), list,
      h('button.btn.tonal.block', {style:'margin-top:12px', onclick:()=>M.share(DUAS[0][1]+'\n['+DUAS[0][2]+']')}, M.ic('share'), 'شارك دعاء الإفطار'));
    upd();
  }
  /* ---- imsakiyah ---- */
  function tImsak(el){
    const t = h('table.ptbl'), tb = h('tbody'); let todayRow = null;
    t.append(h('thead', h('tr', ...['رمضان', 'اليوم', 'إمساك', 'الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'].map(x=>h('th', x)))));
    for(let i = 0; i < mlen; i++){
      const d = M.addDays(start, i), p = M.prayerTimes(d), tr = h('tr'+(i === dayNo - 1 ? '.today' : ''), h('td.num', M.n(i + 1)), h('td', M.WEEKDAYS[d.getDay()].replace('ال', '')+' '+M.n(d.getDate())+'/'+M.n(d.getMonth() + 1)),
        h('td.num', M.fmt(new Date(p.fajr.getTime() - 10 * 60000))), h('td.num', M.fmt(p.fajr)), h('td.num', M.fmt(p.dhuhr)), h('td.num', M.fmt(p.asr)), h('td.num.ram-ift', M.fmt(p.maghrib)), h('td.num', M.fmt(p.isha)));
      if(i === dayNo - 1) todayRow = tr; tb.append(tr);
    }
    t.append(tb);
    const share = ()=>{ const d = inR ? new Date() : start, p = M.prayerTimes(d); M.share('إمساكية '+(inR ? 'اليوم '+M.n(dayNo)+' من رمضان' : 'أول رمضان')+' — '+M.location().name+'\nالإمساك '+M.fmt(new Date(p.fajr.getTime() - 10 * 60000))+' • الفجر '+M.fmt(p.fajr)+'\nالإفطار (المغرب) '+M.fmt(p.maghrib)+' • العشاء '+M.fmt(p.isha)); };
    el.append(h('div.row-flex.gap-s', {style:'margin-bottom:10px;flex-wrap:wrap'}, h('button.btn.tonal.sm', {onclick:share}, M.ic('share'), 'مشاركة إمساكية اليوم'), todayRow ? h('button.btn.tonal.sm', {onclick:()=>todayRow.scrollIntoView({block:'center', behavior:'smooth'})}, 'اذهب إلى اليوم') : null),
      h('div.tbl-wrap', t), h('div.small.muted', {style:'margin-top:8px'}, 'المغرب هو وقت الإفطار. الإمساك قبل الفجر بعشر دقائق احتياطًا (وليس واجبًا شرعًا؛ الواجب الإمساك عند طلوع الفجر الصادق). موقعك: '+M.location().name));
  }
  /* ---- fasting record: 1 = fasted, 2 = missed with an excuse (to make up) ---- */
  function tFast(el){
    const f = get('fast', {}), grid = h('div.ram-grid'), sum = h('div.card.pad.ram-sum');
    const upd = ()=>{ const a = Object.values(f).filter(v=>v === 1).length, m = Object.values(f).filter(v=>v === 2).length;
      sum.replaceChildren(h('div', h('b.num', M.n(a)), h('small', 'صمتها')), h('div', h('b.num', M.n(m)), h('small', 'عليّ قضاؤها')), h('div', h('b.num', M.n(Math.max(0, (inR ? dayNo : 0) - a - m))), h('small', 'لم تُسجَّل'))); };
    for(let i = 1; i <= mlen; i++){
      const c = h('button.ram-day'+(f[i] === 1 ? '.ok' : f[i] === 2 ? '.miss' : '')+(i === dayNo ? '.now' : ''), {'aria-label':'اليوم '+i, onclick:function(){ f[i] = ((f[i] || 0) + 1) % 3; if(!f[i]) delete f[i]; set('fast', f); this.className = 'ram-day'+(f[i] === 1 ? ' ok' : f[i] === 2 ? ' miss' : '')+(i === dayNo ? ' now' : ''); M.haptic && M.haptic(12); upd(); }}, M.n(i));
      grid.append(c);
    }
    el.append(sum, h('div.small.muted', {style:'margin:10px 2px'}, 'اضغط اليوم مرة: صمته — مرتين: أفطرته بعذر وعليّ قضاؤه — ثلاثًا: مسح.'), grid,
      h('div.row-flex.gap-s.ram-legend', h('span', h('i.ok'), 'صمته'), h('span', h('i.miss'), 'قضاء'), h('span', h('i.now'), 'اليوم')));
    upd();
  }
  /* ---- khatma plan (shared with the rest of the app) ---- */
  function tKhatma(el){
    const K = M.store.get('khatma', null);
    if(!K){
      const inp = h('input.field', {type:'number', value:30, min:1, max:365, style:'width:100px', 'aria-label':'عدد الأيام'});
      el.append(h('div.card.pad', h('div.bold', 'خطة ختم القرآن'), h('div.small.muted', 'اختر عدد الأيام وسنوزّع المصحف (٦٠٤ صفحة) عليها.'),
        h('div.row-flex.gap-s', {style:'margin:12px 0'}, inp, h('span', 'يومًا')),
        h('div.chips', ...[[10, 'في العشر الأواخر'], [15, '١٥ يومًا'], [30, 'ختمة في الشهر'], [60, 'ختمتان متأنّيتان']].map(([n, l])=>h('button.chip', {onclick:()=>{ inp.value = n; }}, l))),
        h('button.btn.block', {style:'margin-top:14px', onclick:()=>{ const n = Math.max(1, Math.min(365, +inp.value || 30)); M.store.set('khatma', {start:M.dkey(), days:n, done:{}}); paint(); }}, 'ابدأ الخطة')));
      return;
    }
    const doneN = Object.keys(K.done).length;
    const dayIdx = Math.max(0, Math.min(K.days - 1, Math.round((new Date().setHours(12, 0, 0, 0) - M.parseKey(K.start).setHours(12)) / 864e5)));
    const range = i=>[Math.floor(i * 604 / K.days) + 1, Math.floor((i + 1) * 604 / K.days)], [a, bb] = range(dayIdx);
    el.append(h('div.card.pad', h('div.row-flex', h('div.grow', h('div.bold', 'ورد اليوم (اليوم '+M.n(dayIdx + 1)+')'), h('div.small.muted', 'من صفحة '+M.n(a)+' إلى '+M.n(bb)+' — '+M.cnt(bb - a + 1, 'صفحة'))),
      h('button.btn.sm', {onclick:()=>M.openReader({page:a})}, 'اقرأ')), h('div.bar', {style:'margin-top:12px'}, h('i', {style:'width:'+(doneN / K.days * 100)+'%'})), h('div.tiny.muted', 'أنجزت '+M.n(doneN)+' من '+M.cnt(K.days, 'يوم', true))));
    const list = h('div.card');
    for(let i = 0; i < K.days; i++){ const [x, y2] = range(i);
      list.append(h('div.trk-row'+(i === dayIdx ? '.now' : ''), h('div.grow', h('div', 'اليوم '+M.n(i + 1)), h('div.tiny.muted', 'صفحة '+M.n(x)+' – '+M.n(y2))),
        h('button.cb'+(K.done[i] ? '.on' : ''), {'aria-label':'تم', onclick:function(){ const v = !this.classList.contains('on'); this.classList.toggle('on', v); if(v) K.done[i] = 1; else delete K.done[i]; M.store.set('khatma', K); M.haptic && M.haptic(12); }}, M.ic('check')))); }
    el.append(list, h('button.btn.danger.sm', {style:'margin-top:12px', onclick:async()=>{ if(await M.confirm('حذف الخطة الحالية؟', 'حذف')){ M.store.del('khatma'); paint(); } }}, M.ic('trash'), 'حذف الخطة'));
  }
  /* ---- last ten nights ---- */
  function tLast(el){
    el.append(h('div.card.pad.ram-tip', h('div.bold', 'ليلة القدر خير من ألف شهر'), h('div.qfont.ram-tipt', TIPS[8][1]), h('div.qfont.ram-tipt', DUAS[1][1]), h('div.tiny.muted', DUAS[1][2])));
    const list = h('div.card'), q = get('qadr', {});
    for(let n = 21; n <= mlen; n++){
      const eve = M.addDays(start, n - 2), odd = n % 2 === 1; // the night of day n begins at the sunset of day n-1
      list.append(h('div.trk-row'+(odd ? '.ram-odd' : ''), h('div.grow', h('div'+(odd ? '.bold' : ''), 'ليلة '+M.n(n)+(odd ? ' — وترية' : '')), h('div.tiny.muted', 'تبدأ مغرب '+M.WEEKDAYS[eve.getDay()]+' '+M.n(eve.getDate())+' '+M.GMONTHS[eve.getMonth()])),
        h('button.cb'+(q[n] ? '.on' : ''), {'aria-label':'أحييتها', onclick:function(){ const v = !this.classList.contains('on'); this.classList.toggle('on', v); if(v) q[n] = 1; else delete q[n]; set('qadr', q); M.haptic && M.haptic(12); }}, M.ic('check'))));
    }
    el.append(h('div.section-h', 'ليالي العشر — علّم ما أحييته'), list,
      h('div.card.pad', {style:'margin-top:12px'}, h('div.bold', 'برنامج مقترح لليلة'), ...['صلاة العشاء والتراويح مع الإمام حتى ينصرف', 'ورد من القرآن بتدبّر', 'الإكثار من «اللهم إنك عفو تحب العفو فاعفُ عني»', 'صدقة كل ليلة ولو قليلة', 'الدعاء في السجود وآخر الليل'].map(x=>h('div.gd-b', h('span.gd-dot'), h('span', x)))));
  }
  /* ---- zakat al-fitr ---- */
  function tZakat(el){
    const z = Object.assign({n:1, kg:2.5, price:0}, M.store.get('fitr', {}));
    const out = h('div.ram-zout');
    const num = (k, lbl, step, min)=>h('label.ram-zrow', h('span.grow', lbl), h('input.field', {type:'number', inputMode:'decimal', min, step, value:z[k] || '', placeholder:'٠', oninput:e=>{ z[k] = Math.max(0, +e.target.value || 0); M.store.set('fitr', z); upd(); }}));
    const upd = ()=>{ const kg = z.n * z.kg, money = z.n * z.price;
      out.replaceChildren(...[h('div', h('small', 'المقدار طعامًا'), h('b.num', M.n(kg.toFixed(1).replace(/\.0$/, ''))+' كجم')), z.price ? h('div', h('small', 'قيمته نقدًا (عند من يجيزها)'), h('b.num', M.n(Math.round(money * 100) / 100))) : null].filter(Boolean)); };
    el.append(h('div.card.pad.col-flex', {style:'gap:10px'}, h('div.bold', 'حاسبة زكاة الفطر'),
      num('n', 'عدد الأفراد (أنت ومن تعول)', 1, 1), num('kg', 'مقدار الصاع بالكيلوغرام للفرد', 0.1, 0), num('price', 'قيمة زكاة الفرد نقدًا في بلدك (اختياري)', 1, 0), out),
      h('div.card.pad', {style:'margin-top:12px'}, ...['صاع من غالب قوت البلد عن كل فرد (أرز، قمح، تمر…)، ويقدَّر الصاع بنحو ٢٫٥ إلى ٣ كجم بحسب نوع الطعام.', 'تجب على المسلم عن نفسه وعمن تلزمه نفقته إذا ملك ما يزيد عن قوت يوم العيد وليلته.', 'تُخرج قبل صلاة العيد، ويجوز قبل العيد بيوم أو يومين.', 'إخراجها نقدًا محل خلاف بين الفقهاء؛ فاعمل بما تفتي به دار الإفتاء في بلدك، وهي التي تحدد القيمة كل عام.'].map(x=>h('div.gd-b', h('span.gd-dot'), h('span', x)))),
      h('div.tiny.muted', {style:'margin-top:8px'}, '«فَرَضَ رَسُولُ اللَّهِ ﷺ زَكَاةَ الْفِطْرِ صَاعًا مِنْ تَمْرٍ أَوْ صَاعًا مِنْ شَعِيرٍ» — متفق عليه.'));
    upd();
  }
  /* ---- duas & deeds ---- */
  function tDua(el){
    DUAS.forEach(([t, d, s])=>el.append(h('div.card.pad', h('div.bold', t), h('div.qfont.dua-t', d), h('div.tiny.muted', s),
      h('div.row-flex.gap-s', {style:'margin-top:8px'}, h('button.btn.tonal.sm', {onclick:()=>M.share(d+'\n['+s+']')}, M.ic('share'), 'مشاركة'), h('button.btn.tonal.sm', {onclick:()=>M.copy(d.replace(/[«»]/g, ''))}, M.ic('copy'), 'نسخ')))));
    el.append(h('div.section-h', 'أعمال مباركة'));
    const l = h('div.card'); TIPS.forEach(([t, s])=>l.append(h('div.trk-row', h('div.grow', h('div.bold', t), h('div.small.muted', s))))); el.append(l);
  }
  paint();
  return view;
};
})();
