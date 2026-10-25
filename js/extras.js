/* ===== Extras: reminders, onboarding, zakat, qada, daily wird, hadith, global search ===== */
(function(){
'use strict';
const M = window.M, h = M.h;

/* ---------------- settings defaults ---------------- */
M.defaults.wird = 4;
if(!M.cfg.wird) M.cfg.wird = 4;

/* One scheduler for the native layer. Calls are coalesced (several settings listeners may fire together),
   the horizon is two weeks, and the list is capped below Android's 500-alarm limit. */
/* Everything the home-screen widgets show, prepared for the coming weeks so they stay right while the app is closed. */
const W_AYAT = [[2,152],[2,186],[2,201],[2,286],[3,8],[3,159],[3,173],[11,88],[13,28],[14,7],[18,10],[20,114],[21,87],[23,118],[25,74],[29,69],[33,56],[39,53],[40,60],[49,13],[57,4],[64,11],[65,2],[65,3],[93,5],[94,5],[94,6],[112,1],[2,255],[59,22]];
M.widgetData = function(){
  const now = new Date(), times = [], days = [], months = [];
  for(let d = 0; d < 14; d++){ const day = M.addDays(now, d); day.setHours(12); const t = M.prayerTimes(day);
    ['fajr','sunrise','dhuhr','asr','maghrib','isha'].forEach(k=>times.push([k, k === 'sunrise' ? 'الشروق' : M.prayerLabel(k, day), t[k].getTime(), M.fmt(t[k])])); }
  const key = d=>d.getFullYear()+'-'+M.pad(d.getMonth() + 1)+'-'+M.pad(d.getDate());
  for(let d = 0; d < 70; d++){ const day = M.addDays(now, d); day.setHours(12); const hj = M.hijri(day);
    days.push([key(day), M.WEEKDAYS[day.getDay()], M.n(hj.d), M.HMONTHS[hj.m - 1], M.n(hj.y), M.n(day.getDate())+' '+M.GMONTHS[day.getMonth()]+' '+M.n(day.getFullYear()), hj.m]);
    if(hj.d === 1 || d === 0){ // start of a Hijri month (or the current one): its length and the weekday column of day 1 (0 = Saturday)
      const first = M.addDays(day, -(hj.d - 1)); let len = 29; { const x = M.hijri(M.addDays(first, 29)); if(x.m === hj.m) len = 30; }
      if(!months.some(m=>m[4] === key(first))) months.push([M.HMONTHS[hj.m - 1], hj.y, len, (first.getDay() + 1) % 7, key(first)]);
    } }
  const adhkar = [];
  try{ (M.TASBIH || []).forEach(x=>adhkar.push([x[0], String(x[1] || '').slice(0, 90)])); (M.ADHKAR && M.ADHKAR.DUAS || []).forEach(x=>adhkar.push([x.title, x.src || ''])); (M.ISTIGHFAR || []).forEach(x=>{ if(Array.isArray(x) && x[0]) adhkar.push([x[0], String(x[1] || '').slice(0, 90)]); }); }catch(e){}
  const ayat = [], wtaf = M.store.get('wtaf', {}) || {};
  try{ if(M.Q && M.Q.ayahs) W_AYAT.forEach(([s, a])=>{ const t = M.ayahText(s, a); if(t && t.length < 230) ayat.push([t, 'سورة '+M.sname(s)+' • الآية '+M.n(a), wtaf[s+':'+a] || '']); }); }catch(e){}
  // extra content for the quote widgets: hadith, and adhkar by category
  const hadith = (M.HADITH || []).map(x=>[String(x[0]).replace(/[«»]/g, ''), x[1] || '']).filter(x=>x[0].length < 240);
  const txt = (it, k)=>{ const t = it && it.t; return typeof t === 'string' ? t : t && (t[k] || t.m || t.e) || ''; };
  const pick = (list, k)=>(list || []).map(it=>txt(it, k)).filter(t=>t && t.length < 230).slice(0, 14);
  let cats = [];
  try{ const A = M.ADHKAR || {}; cats = [['أذكار الصباح', pick(A.MORNING_EVENING, 'm')], ['أذكار المساء', pick(A.MORNING_EVENING, 'e')], ['أذكار الصلاة', pick(A.AFTER_PRAYER)], ['أذكار النوم', pick(A.SLEEP)], ['تسابيح', (M.TASBIH || []).map(x=>x[0]).filter(Boolean).slice(0, 14)]].filter(c=>c[1].length); }catch(e){}
  return {city:M.location().name, hijri:M.fmtHijri(M.hijri(now)), hindi:M.cfg.digits !== 'latin', icons:M.cfg.prIcons !== false, times, days, months, adhkar:adhkar.filter(x=>x[0] && x[0].length < 230), ayat, hadith, cats, h24:!!M.cfg.h24};
};
/* short tafsir (الميسّر) for the ayah widget: fetched once when online, then kept on the device */
M.loadWidgetTafsir = async function(){
  if(!window.Android || !navigator.onLine) return;
  const have = M.store.get('wtaf', {}) || {}; let added = 0;
  for(const [s, a] of W_AYAT){
    if(have[s+':'+a]) continue;
    try{
      const r = await M.getTafsir('ar-tafsir-muyassar', s, a);
      const txt = String(r.text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if(txt){ have[s+':'+a] = txt.length > 330 ? txt.slice(0, 327).replace(/\s+\S*$/, '')+'…' : txt; added++; }
    }catch(e){ break; }
  }
  if(added){ M.store.set('wtaf', have); M.syncNative(); }
};
let syncT = null;
function syncNow(){
  syncT = null;
  try{
    if(!(window.Android && window.Android.scheduleAdhan)) return;
    let items = M.buildReminders(14).filter(x=>x && x.ts > Date.now()).sort((a, b)=>a.ts - b.ts);
    if(items.length > 380) items = items.slice(0, 380);
    if(items.length){
      const real = items.filter(x=>!x.act);
      const last = (real.length ? real[real.length - 1] : items[items.length - 1]).ts;
      items.push({id:'renew', ts:last + 5 * 60000, title:'افتح تطبيق مسلم', body:'لتجديد مواعيد الأذان والتذكيرات للأيام القادمة', tone:false, ch:'nf_renew_q', chn:'تجديد المواعيد', open:'home', kind:'renew'});
    }
    try{ window.Android.setKeyStop && window.Android.setKeyStop(M.cfg.keyStop !== false); }catch(e){}
    window.Android.scheduleAdhan(JSON.stringify(items));
    if(window.Android.setWidgetData) window.Android.setWidgetData(JSON.stringify(M.widgetData()));
    M.store.set('lastSync', Date.now());
  }catch(e){}
}
M.syncNative = function(now){ clearTimeout(syncT); if(now === true) return syncNow(); syncT = setTimeout(syncNow, 200); };
// refresh the schedule whenever the app comes back to the foreground after a while
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && Date.now() - (M.store.get('lastSync', 0) || 0) > 6 * 3600e3) M.syncNative(); });
M.on('settings', k=>{ if(['nf','voice','adhan','wird','loc','method','madhhab','adjust','notifyIn','adhanTone','hijriAdj','iqama','iqamaNotif','digits','h24'].includes(k) || typeof k === 'object') M.syncNative(); });

/* ---------------- hadith of the day ---------------- */
M.HADITH = [
 ['«إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى»', 'متفق عليه'],
 ['«الدِّينُ النَّصِيحَةُ»', 'رواه مسلم'],
 ['«لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ»', 'متفق عليه'],
 ['«مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ»', 'متفق عليه'],
 ['«الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ»', 'متفق عليه'],
 ['«الطُّهُورُ شَطْرُ الْإِيمَانِ»', 'رواه مسلم'],
 ['«كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ»', 'متفق عليه'],
 ['«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»', 'رواه البخاري'],
 ['«أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ»', 'متفق عليه'],
 ['«إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الْأَمْرِ كُلِّهِ»', 'متفق عليه'],
 ['«الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ»', 'متفق عليه'],
 ['«مَنْ لَا يَرْحَمْ لَا يُرْحَمْ»', 'متفق عليه'],
 ['«لَا تَغْضَبْ»', 'رواه البخاري'],
 ['«مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ»', 'رواه مسلم'],
 ['«لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ»', 'متفق عليه'],
 ['«مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ»', 'رواه مسلم'],
 ['«تَهَادَوْا تَحَابُّوا»', 'رواه البخاري في الأدب المفرد وحسّنه الألباني'],
 ['«مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ»', 'رواه مسلم'],
 ['«الدُّعَاءُ هُوَ الْعِبَادَةُ»', 'رواه أبو داود والترمذي وصححه الألباني'],
 ['«مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا»', 'رواه مسلم']
];
M.hadithOfDay = ()=>{ const d = new Date(); return M.HADITH[(Math.floor(d.getTime() / 864e5) + 7) % M.HADITH.length]; };

/* ---------------- Zakat ---------------- */
M.openZakat = function(){
  const S = Object.assign({gold:0, gold21:0, gold18:0, silver:0, cash:0, trade:0, owed:0, debt:0, gprice:0, sprice:0, basis:'gold', year:'h', persons:4, sa:0}, M.store.get('zakat', {}) || {});
  const save = ()=>M.store.set('zakat', S);
  // accepts Arabic or Latin digits, either decimal mark, and thousands separators
  const parse = v=>{ const t = String(v || '').replace(/[٠-٩]/g, d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g, '').replace(/٫/g, '.'); const n = parseFloat(t); return isFinite(n) && n > 0 ? n : 0; };
  const money = x=>M.fmtInt ? M.fmtInt(x) : M.n(Math.round(x));
  const out = h('div.card.accent.pad.zk-out');
  const field = (k, label, hint)=>h('label.zk-f', h('span.zk-l', label), h('input.field', {type:'text', inputmode:'decimal', autocomplete:'off', dir:'ltr', value:S[k] ? String(S[k]) : '', placeholder:'0', oninput:e=>{ S[k] = parse(e.target.value); save(); calc(); }}), hint ? h('span.tiny.muted', hint) : null);
  const line = (a, b, strong)=>h('div.zk-line'+(strong ? '.strong' : ''), h('span', a), h('b.num', b));
  function calc(){
    out.innerHTML = '';
    const goldVal = (S.gold + S.gold21 * 21 / 24 + S.gold18 * 18 / 24) * S.gprice, silverVal = S.silver * S.sprice;
    const wealth = S.cash + S.trade + S.owed + goldVal + silverVal, net = Math.max(0, wealth - S.debt);
    const nisab = S.basis === 'gold' ? 85 * S.gprice : 595 * S.sprice;
    const rate = S.year === 'g' ? 0.02577 : 0.025;
    const needPrice = (S.basis === 'gold' && !S.gprice) || (S.basis === 'silver' && !S.sprice);
    if((S.gold || S.gold21 || S.gold18) && !S.gprice) out.append(h('div.zk-warn', 'أدخل سعر جرام الذهب لتُحسب قيمة ذهبك.'));
    if(S.silver && !S.sprice) out.append(h('div.zk-warn', 'أدخل سعر جرام الفضة لتُحسب قيمة فضتك.'));
    out.append(h('div.small.muted', 'صافي المال الذي تجب فيه الزكاة'), h('div.title-font.zk-n', money(net)));
    const det = h('div.zk-det');
    if(S.cash) det.append(line('النقد والأرصدة', money(S.cash)));
    if(goldVal) det.append(line('قيمة الذهب', money(goldVal)));
    if(silverVal) det.append(line('قيمة الفضة', money(silverVal)));
    if(S.trade) det.append(line('عروض التجارة', money(S.trade)));
    if(S.owed) det.append(line('ديون لك مرجوّة', money(S.owed)));
    if(S.debt) det.append(line('ديون عليك حالّة', '− '+money(Math.min(S.debt, wealth))));
    if(det.children.length) out.append(det);
    if(needPrice){ out.append(h('div.small', {style:'margin-top:10px'}, 'أدخل سعر جرام '+(S.basis === 'gold' ? 'الذهب' : 'الفضة')+' لمعرفة النصاب.')); return; }
    out.append(line('النصاب ('+(S.basis === 'gold' ? '٨٥ جرام ذهب' : '٥٩٥ جرام فضة')+')', money(nisab)));
    if(net >= nisab && net > 0) out.append(h('div.zk-res', h('div.small', 'بلغ مالك النصاب. الزكاة الواجبة إذا حال عليه الحول:'), h('div.zk-n.num', money(net * rate)), h('div.tiny.muted', S.year === 'g' ? 'بنسبة ٢٫٥٧٧٪ للسنة الميلادية' : 'بنسبة ٢٫٥٪ للسنة الهجرية')));
    else out.append(h('div.zk-res', h('div.small', net > 0 ? 'لم يبلغ مالك النصاب، فلا زكاة عليك الآن. ينقصك '+money(nisab - net)+'.' : 'أدخل ما تملكه لحساب الزكاة.')));
  }
  M.openView({title:'حاسبة الزكاة', id:'zakat', build:b=>{
    b.append(h('div.small.muted', {style:'margin-bottom:10px;line-height:1.8'}, 'الزكاة ربع العشر (٢٫٥٪) من صافي المال الذي بلغ النصاب وحال عليه الحول. أدخل المبالغ بعملتك.'));
    b.append(h('div.section-h', 'أسعار اليوم'), h('div.card.pad.zk-form', field('gprice', 'سعر جرام الذهب عيار ٢٤'), field('sprice', 'سعر جرام الفضة')));
    b.append(h('div.section-h', 'ما تملكه'), h('div.card.pad.zk-form', field('cash', 'النقد والأرصدة'), field('trade', 'عروض التجارة', 'قيمة البضاعة بسعر البيع'), field('gold', 'ذهب عيار ٢٤ (جرام)'), field('gold21', 'ذهب عيار ٢١ (جرام)'), field('gold18', 'ذهب عيار ١٨ (جرام)'), field('silver', 'الفضة (جرام)'), field('owed', 'ديون لك مرجوّة السداد'), field('debt', 'ديون عليك حالّة')));
    b.append(h('div.section-h', 'طريقة الحساب'), h('div.card.pad.col-flex',
      h('div.small.muted', 'النصاب'), M.seg([['gold', 'بالذهب'], ['silver', 'بالفضة']], S.basis, v=>{ S.basis = v; save(); calc(); }),
      h('div.small.muted', 'الحول'), M.seg([['h', 'سنة هجرية'], ['g', 'سنة ميلادية']], S.year, v=>{ S.year = v; save(); calc(); })));
    b.append(h('div.section-h', 'النتيجة'), out,
      h('button.btn.tonal.sm', {style:'margin-top:10px', onclick:()=>{ ['gold','gold21','gold18','silver','cash','trade','owed','debt'].forEach(k=>S[k] = 0); save(); M.views[M.views.length - 1].close(); M.openZakat(); }}, M.ic('refresh'), 'مسح المبالغ'),
      h('div.tiny.muted', {style:'margin-top:10px;line-height:1.8'}, 'حُليّ المرأة المعدّ للاستعمال فيه خلاف بين العلماء؛ أدخله إن كنت تأخذ بوجوب زكاته. النصاب بالفضة أحوط للفقير، وبالذهب قول كثير من المعاصرين — راجع أهل العلم في حالتك.'));
    b.append(h('div.card.pad', {style:'margin-top:14px'}, h('div.bold', 'زكاة الفطر'), h('div.small.muted', 'صاع من طعام عن كل فرد (نحو ٢٫٥ كجم)، أو قيمته عند من أجازه.'),
      (()=>{ const r = h('div.bold', {style:'margin-top:8px'});
        const upd = ()=>{ save(); r.textContent = S.sa && S.persons ? 'الإجمالي: '+money(S.persons * S.sa) : ''; };
        const pn = h('input.field', {type:'text', inputmode:'numeric', dir:'ltr', value:S.persons || '', oninput:e=>{ S.persons = Math.round(parse(e.target.value)); upd(); }}), pr = h('input.field', {type:'text', inputmode:'decimal', dir:'ltr', placeholder:'0', value:S.sa || '', oninput:e=>{ S.sa = parse(e.target.value); upd(); }});
        upd(); return h('div', {style:'margin-top:8px'}, h('div.row-flex.gap-s', h('label.grow', h('span.tiny.muted', 'عدد الأفراد'), pn), h('label.grow', h('span.tiny.muted', 'قيمة الصاع'), pr)), r); })()));
    calc();
  }});
};

/* ---------------- Qada tracker ---------------- */
M.openQada = function(){
  const K = [['fajr','الفجر'],['dhuhr','الظهر'],['asr','العصر'],['maghrib','المغرب'],['isha','العشاء'],['witr','الوتر'],['fast','أيام صيام']];
  const S = M.store.get('qada', {}); const content = h('div');
  const save = ()=>M.store.set('qada', S);
  M.openView({title:'تتبّع القضاء', id:'qada', build:b=>{ b.append(content); draw(); }});
  function draw(){
    content.innerHTML = '';
    const total = K.reduce((a, [k])=>a + (S[k] || 0), 0);
    content.append(h('div.card.accent.pad', h('div.small.muted', 'المتبقي عليك'), h('div.title-font.zk-n.num', M.n(total)), h('div.tiny.muted', 'سجّل ما عليك ثم اضغط «قضيت» كلما أدّيت واحدة. «من تذكّر صلاة فليصلّها»')));
    const l = h('div.card.list', {style:'margin-top:12px'});
    K.forEach(([k, n])=>{
      l.append(h('div.item.static', h('div.grow', h('div.t', n), h('div.s.num', 'المتبقي: '+M.n(S[k] || 0))),
        h('button.btn.sm.tonal', {onclick:()=>{ S[k] = Math.max(0, (S[k] || 0) - 1); save(); M.haptic(14); draw(); }}, M.ic('check'), 'قضيت'),
        h('button.icon-btn.tonal', {onclick:()=>{ S[k] = (S[k] || 0) + 1; save(); draw(); }}, M.ic('plus'))));
    });
    content.append(l);
    content.append(h('button.btn.tonal.block', {style:'margin-top:12px', onclick:wiz}, M.ic('calendar'), 'احسب من مدة الفوات'));
  }
  async function wiz(){
    const v = await M.prompt('كم سنة فاتتك فيها الصلوات؟', '', 'مثال: ٢');
    const y = parseFloat(v); if(!y || y <= 0) return;
    const d = Math.round(y * 354);
    ['fajr','dhuhr','asr','maghrib','isha','witr'].forEach(k=>{ S[k] = (S[k] || 0) + d; }); save(); draw(); M.toast('أُضيف '+M.cnt(d, 'يوم', false, 'يومًا')+' لكل صلاة');
  }
};

/* ---------------- Quran daily wird ---------------- */
M.wirdToday = function(){ const goal = M.cfg.wird || 4, read = (M.QD.pagesRead[M.dkey()] || []).length; return {goal, read, pct:Math.min(1, read / goal)}; };
M.openQuranStats = function(){
  const pr = M.QD.pagesRead, days = Object.keys(pr).sort(); const tot = new Set(); days.forEach(d=>pr[d].forEach(p=>tot.add(p)));
  let streak = 0, cur = new Date(); cur.setHours(12); const w = M.wirdToday(); if(!(pr[M.dkey(cur)] || []).length) cur = M.addDays(cur, -1);
  while((pr[M.dkey(cur)] || []).length){ streak++; cur = M.addDays(cur, -1); }
  const c = h('div', h('div.grid3', ...[[M.n(w.read)+'/'+M.n(w.goal), 'ورد اليوم'], [M.n(streak), 'أيام متتالية'], [M.n(tot.size), 'صفحة مختلفة']].map(([a, b])=>h('div.card.pad.stat', h('div.stat-n.num', a), h('div.tiny.muted', b)))),
    h('div.card.pad', {style:'margin-top:12px'}, h('div.small.muted', 'تقدّم المصحف'), h('div.bar', {style:'margin:8px 0'}, h('i', {style:'width:'+(tot.size / 604 * 100)+'%'})), h('div.tiny.muted', M.n((tot.size / 604 * 100).toFixed(1))+'٪ من صفحات المصحف')),
    h('div.section-h', 'الورد اليومي (صفحات)'), M.chips([[1, '١'], [2, '٢'], [4, '٤'], [5, '٥'], [10, '١٠'], [20, '٢٠']], M.cfg.wird, v=>{ M.save('wird', +v); }));
  M.sheet({title:'إحصاءات القراءة', content:c});
};

/* ---------------- global search ---------------- */
M.openSearch = function(pre){
  const q = h('input.field', {type:'search', placeholder:'ابحث عن سورة أو آية أو ذكر…', enterkeyhint:'search'});
  if(typeof pre === 'string') q.value = pre.slice(0, 200);   // Siri: «ابحث في المسلم عن …»
  const out = h('div');
  const FEATS = [['جدول المحاسبة','check',()=>M.openTracker()],['المسبحة','s:counter',()=>M.openTasbih()],['التقويم الهجري','calendar',()=>M.openCalendar()],['أسماء الله الحسنى','sparkle',()=>M.openNames()],['يوم الجمعة','mosque',()=>M.openFriday()],['رمضان','moon',()=>M.openRamadan()],['الحج والعمرة','kaaba',()=>M.openHajj()],['ركن الأطفال','kids',()=>M.openKids()],['إذاعة القرآن','radio',()=>M.openRadio()],['البث المباشر','tv',()=>M.openTV()],['القبلة','compass',()=>M.openQibla()],['حاسبة الزكاة','trophy',()=>M.openZakat()],['تتبّع القضاء','history',()=>M.openQada()],['التذكيرات','bell',()=>M.openReminders()],['الإعدادات','settings',()=>M.openSettings()],['الخلفية والمظهر','palette',()=>M.openSettings('look')]];
  function draw(){
    const t = q.value.trim(); out.innerHTML = ''; if(t.length < 2){ out.append(h('div.empty', 'اكتب كلمتين على الأقل')); return; }
    const k = M.normAr(t);
    const feats = FEATS.filter(f=>M.normAr(f[0]).includes(k));
    if(feats.length){ out.append(h('div.section-h', 'الأقسام')); const l = h('div.card.list'); feats.forEach(([n, i, fn])=>l.append(M.item({icon:i, title:n, onClick:fn}))); out.append(l); }
    if(M.Q && M.Q.ready){
      const ss = M.Q.surahs.filter(s=>M.normAr(s.ar).includes(k) || s.tr.toLowerCase().includes(t.toLowerCase())).slice(0, 5);
      if(ss.length){ out.append(h('div.section-h', 'السور')); const l = h('div.card.list'); ss.forEach(s=>l.append(M.item({icon:'quran', title:'سورة '+s.ar, sub:M.cnt(s.n, 'آية'), onClick:()=>M.openReader({sura:s.id, ayah:1})}))); out.append(l); }
    }
    const nm = M.NAMES.map((n, i)=>[n, i]).filter(([n])=>M.normAr(n[0]).includes(k) || M.normAr(n[1]).includes(k)).slice(0, 4);
    if(nm.length){ out.append(h('div.section-h', 'الأسماء الحسنى')); const l = h('div.card.list'); nm.forEach(([n, i])=>l.append(M.item({icon:'sparkle', title:n[0], sub:n[1], onClick:()=>M.openNames()}))); out.append(l); }
    const ad = []; Object.values(M.ADHKAR || {}).forEach(g=>(Array.isArray(g) ? g : []).forEach(it=>{ const tx = typeof it.t === 'string' ? it.t : it.t && it.t.m; if(tx && M.normAr(tx).includes(k)) ad.push([tx, it]); }));
    if(ad.length){ out.append(h('div.section-h', 'الأذكار')); const l = h('div.card.list'); ad.slice(0, 5).forEach(([tx, it])=>l.append(M.item({icon:'beads', title:tx.slice(0, 70)+'…', sub:it.src, onClick:()=>M.sheet({title:'ذكر', content:h('div', h('div.qfont.dua-t', tx), h('div.tiny.muted', it.src+(it.g ? ' — '+it.g : '')), h('button.btn.tonal.sm', {onclick:()=>M.copy(tx)}, M.ic('copy'), 'نسخ'))})}))); out.append(l); }
    if(M.Q && M.Q.ready && t.length >= 3){
      const ids = M.searchQuran(t, 15);
      if(ids.length){ out.append(h('div.section-h', 'الآيات', h('small', M.arNum(ids.length)))); const l = h('div.card.list'); ids.forEach(id=>{ const [s, a] = M.fromAid(id); l.append(h('button.item.res', {onclick:()=>M.openReader({sura:s, ayah:a, select:true})}, h('div.grow', h('div.qfont.res-t', M.Q.ayahs[id]), h('div.s', 'سورة '+M.sname(s)+' • آية '+M.arNum(a))))); }); out.append(l); }
    }
    if(!out.children.length) out.append(h('div.empty', 'لا توجد نتائج'));
  }
  q.addEventListener('input', M.debounce(draw, 200));
  M.openView({title:'بحث', id:'search', build:b=>{ b.append(q, h('div', {style:'height:8px'}), out); draw(); M.loadQuran().then(draw).catch(()=>{}); setTimeout(()=>q.focus(), 350); }});
};

/* ---------------- onboarding ---------------- */
M.openOnboarding = function(mode){
  const S = {step:0}, upd = mode === 'update', LAST = 4; const body = h('div.onb');
  const view = M.openView({title:'', id:'onboarding', noHead:true, nopad:true, build:b=>{ b.append(body); }});
  view.onBack = ()=>true; // can't dismiss with back
  const dots = ()=>h('div.onb-dots', ...[0, 1, 2, 3, 4].map(i=>h('i'+(i === S.step ? '.on' : ''))));
  const skip = ()=>h('button.btn.ghost.block.onb-skip', {onclick:finish}, 'تخطَّ وابدأ الآن');
  const upd2 = ()=>{ S.step = 1; draw(); };
  const next = (label, fn)=>h('button.btn.block', {onclick:()=>{ if(fn) fn(); S.step++; draw(); }}, label || 'التالي');
  function draw(){
    body.innerHTML = '';
    body.classList.toggle('brand', S.step === 0);
    if(S.step === 0){
      const icon = M.cfg.appIcon || 10, hj = M.hijri(new Date());
      let np = null; try{ const t = M.prayerTimes(new Date()), now = Date.now(); for(const [k] of M.PRAYERS){ if(k !== 'sunrise' && t[k].getTime() > now){ np = [M.prayerLabel(k, new Date()), M.fmt(t[k])]; break; } } }catch(e){}
      const hr = new Date().getHours(), gr = hr < 12 ? 'صباح الخير' : hr < 17 ? 'طاب يومك' : 'مساء الخير';
      const feat = (ic, t, d)=>h('div.onb-f', h('span.onb-fi', {html:M.icon(ic)}), h('div', h('b', t), h('small', d)));
      body.append(
        h('div.onb-top', h('span.onb-date', M.fmtHijri(hj)), np ? h('span.onb-date', np[0]+' '+np[1]) : null),
        h('div.onb-scroll', h('div.onb-hero',
          h('div.onb-ring', h('img.onb-logo', {src:'img/icons/'+icon+'.jpg', alt:''})),
          h('div.onb-greet', 'السلام عليكم • '+gr),
          h('h1.title-font.onb-title', 'المسلم'),
          h('p.onb-lead', upd ? 'تم تحديث التطبيق إلى الإصدار '+M.n(M.VERSION)+'. هذا أبرز ما أضفناه لك.' : 'رفيقك اليومي للقرآن والصلاة والذكر — نجهّزه على ذوقك في خطوات قصيرة.')),
        upd ? h('div.onb-new', h('b', 'الجديد في هذا الإصدار'), h('ul', ...M.whatsNew().map(t=>h('li', t)))) : null,
        h('div.onb-feats',
          feat('s:mushaf', 'مصحف المدينة', 'تفسير وتلاوة وتنزيل للعمل بلا إنترنت'),
          feat('s:mosque', 'المواقيت والقبلة', 'أذان وتنبيهات وخريطة للقبلة'),
          feat('s:beads', 'الأذكار والمسبحة', 'صباحًا ومساءً وتذكير بالصلاة على النبي ﷺ'),
          feat('s:tracker', 'متابعة العبادات', 'ختمة وقضاء وجدول محاسبة'),
          feat('s:calendar', 'التقويم الهجري', 'المناسبات وتحويل التاريخ'),
          feat('s:radio', 'الإذاعة والبث', 'إذاعات القرآن وبث الحرمين'),
          feat('grid', 'ودجت الشاشة الرئيسية', M.n(27)+' شكلًا بمقاسات متعددة'),
          feat('s:names', 'أسماء الله والمسابقات', 'ومكتبة أدعية وأسئلة دينية'))),
        h('div.onb-foot', dots(), h('button.btn.block.onb-go', {onclick:()=>{ if(upd) return finish(); S.step++; draw(); }}, upd ? 'متابعة' : 'ابدأ التخصيص'),
          upd ? h('button.btn.ghost.block.onb-skip', {onclick:()=>{ upd2(); }}, 'إعادة تخصيص التطبيق') : skip()));
    }
    if(S.step === 1){
      const name = h('input.field', {type:'text', maxlength:24, placeholder:'اسمك (اختياري) لنحيّيك به', value:M.cfg.userName || '', oninput:e=>{ M.save('userName', e.target.value.trim().slice(0, 24)); }});
      const ig = h('div.onb-icons');
      const cur = M.cfg.appIcon || 10;
      for(const i of [10, 9, 1, 2, 3, 4, 5, 6, 7, 8]) ig.append(h('button.icon-opt'+(i === cur ? '.on' : ''), {dataset:{i}, 'aria-label':'أيقونة '+i, onclick:()=>{ M.setIconAccent(i); M.$$('.icon-opt', ig).forEach(x=>x.classList.toggle('on', +x.dataset.i === i)); M.$$('.swatch', sw).forEach(x=>x.classList.remove('on')); M.haptic && M.haptic(8); }}, h('img', {src:'img/icons/'+i+'.jpg', alt:''})));
      const g = h('div.grid2.skin-grid'); const sc = (id, l, d)=>{ const c = h('button.skin-card'+(M.resolveSkin() === id ? '.on' : ''), {onclick:()=>{ M.save('skin', id); M.$$('.skin-card', g).forEach(x=>x.classList.toggle('on', x === c)); }}, h('div.skin-prev.sp-'+id, h('i.sp-card'), h('i.sp-card.s'), h('div.sp-bar', h('i'), h('i'), h('i'))), h('div.bold', l), h('div.tiny.muted', d)); return c; };
      g.append(sc('glass', 'Liquid Glass', 'زجاج شفاف وسلس'), sc('material', 'Material You', 'ألوان متكيّفة'));
      const sw = h('div.swatches'); M.ACCENTS.forEach(([c])=>sw.append(h('button.swatch'+(M.cfg.accentSrc === 'user' && M.cfg.accent === c ? '.on' : ''), {style:'--c:'+c, onclick:function(){ M.save('accentSrc', 'user'); M.save('accent', c); M.$$('.swatch', sw).forEach(x=>x.classList.remove('on')); this.classList.add('on'); }})));
      body.append(h('h2.title-font', 'اجعله تطبيقك'), name,
        h('div.small.muted.onb-l', 'لون التطبيق — اختر الشكل الذي يعجبك'), ig,
        h('div.small.muted.onb-l', 'الشكل'), g,
        h('div', {style:'margin:4px 0'}, M.seg([['auto','تلقائي'],['light','فاتح'],['dark','داكن'],['amoled','AMOLED']], M.cfg.theme, v=>M.save('theme', v))),
        h('div.small.muted.onb-l', 'أو اختر لونًا آخر'), sw, h('div.grow'), dots(), next());
    }
    if(S.step === 2){
      const loc = h('div.muted.onb-loc', M.location().name); const list = h('div.chips.onb-cities');
      M.CITIES.slice(0, 24).forEach(c=>list.append(h('button.chip', {onclick:()=>{ M.save('loc', {name:c[0], lat:c[1], lng:c[2], tz:c[3], auto:false}); loc.textContent = c[0]; M.toast('تم اختيار '+c[0]); }}, c[0])));
      body.append(h('h2.title-font', 'موقعك لحساب المواقيت'), h('div.card.pad.center', h('div.small.muted', 'الموقع الحالي'), h('div.title-font.bold', loc),
        h('button.btn.tonal.sm', {style:'margin-top:10px', onclick:async()=>{ try{ const l = await M.detectLocation(); M.save('loc', l); loc.textContent = l.name; M.toast('تم تحديد موقعك'); }catch(e){ M.toast('تعذّر تحديد الموقع — اختر مدينتك'); } }}, M.ic('pin'), 'تحديد موقعي تلقائيًا')),
        h('div.small.muted', {style:'margin:12px 4px 6px'}, 'أو اختر مدينتك:'), list, h('div.grow'), dots(), next());
    }
    if(S.step === 3){
      const meth = h('select.field', {'aria-label':'طريقة الحساب', onchange:e=>M.save('method', e.target.value)}, M.METHODS.map(([v, n])=>h('option', {value:v, selected:v === M.cfg.method}, n)));
      const t = M.prayerTimes(new Date()), prev = h('div.onb-times');
      const paint = ()=>{ const tt = M.prayerTimes(new Date()); prev.replaceChildren(...['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(k=>h('div', h('small', M.prayerLabel(k, new Date())), h('b', M.fmt(tt[k]))))); };
      const again = fn=>v=>{ fn(v); setTimeout(paint, 30); };
      meth.addEventListener('change', ()=>setTimeout(paint, 30)); paint();
      body.append(h('h2.title-font', 'حساب المواقيت وطريقة العرض'), h('div.card.pad.col-flex', {style:'gap:10px'}, h('div.small.muted', 'مواقيت اليوم في '+M.location().name), prev),
        h('div.small.muted.onb-l', 'طريقة الحساب (اتركها «تلقائي» إن لم تكن متأكدًا)'), meth,
        h('div.small.muted.onb-l', 'وقت العصر'), M.seg([['shafi', 'الجمهور'], ['hanafi', 'الحنفي']], M.cfg.madhhab === 'hanafi' ? 'hanafi' : 'shafi', again(v=>M.save('madhhab', v))),
        h('div.small.muted.onb-l', 'نظام الساعة'), M.seg([['12', M.n(12)+' ساعة (ص / م)'], ['24', M.n(24)+' ساعة']], M.cfg.h24 ? '24' : '12', again(v=>M.save('h24', v === '24'))),
        h('div.small.muted.onb-l', 'شكل الأرقام'), M.seg([['hindi', '\u200Bعربية ١٢٣'], ['latin', '\u200BEnglish 123']], M.cfg.digits === 'latin' ? 'latin' : 'hindi', again(v=>M.save('digits', v))),
        h('div.grow'), dots(), next());
    }
    if(S.step === LAST) body.append(h('div.onb-hero', h('div.onb-logo', {html:M.icon('bell')}), h('h1.title-font', M.cfg.userName ? 'جاهز يا '+M.cfg.userName : 'خطوة أخيرة'), h('p.muted', 'فعّل تنبيهات الأذان والأذكار. يمكنك ضبطها لاحقًا من الإعدادات ← التذكيرات.')),
      h('div.onb-tips', h('div', h('span.onb-fi', {html:M.icon('grid')}), h('div', h('b', 'أضف ودجت للشاشة الرئيسية'), h('small', 'اضغط مطولًا على الشاشة الرئيسية ← الأدوات ← «المسلم».'))),
        h('div', h('span.onb-fi', {html:M.icon('download')}), h('div', h('b', 'استمع بلا إنترنت'), h('small', 'نزّل السور والتفسير من قسم «التنزيلات».'))),
        window.Android && window.Android.openBatterySettings ? h('button.onb-tipbtn', {onclick:()=>window.Android.openBatterySettings('battery')}, h('span.onb-fi', {html:M.icon('t:battery-charging')}), h('div', h('b', 'اضمن وصول الأذان في وقته'), h('small', 'اسمح للتطبيق بالعمل في الخلفية دون قيود — اضغط هنا.'))) : null),
      dots(), h('button.btn.block', {onclick:()=>{ try{ window.Android && window.Android.requestNotifPerm && window.Android.requestNotifPerm(); window.Notification && Notification.permission === 'default' && Notification.requestPermission(); }catch(e){} finish(); }}, 'تفعيل التنبيهات وبدء الاستخدام'), h('button.btn.ghost.block', {style:'margin-top:8px', onclick:finish}, 'لاحقًا'));
  }
  function finish(){ M.store.set('onboarded', 1); M.store.set('seenVersion', M.VERSION); M.syncNative(); view.close(); M.refreshScreen && M.refreshScreen(); }
  draw(); return view;
};
/* what changed, shown once after an update (edit together with the version) */
// what's new: plain text for everyone, or [text, capability, text where that capability is missing (optional)]
M.WHATS_NEW = [
  'نسخة الأندرويد موقّعة بمفتاح التطبيق الأصلي: تُحدَّث فوق النسخة المثبّتة دون حذفها ودون فقد بياناتك',
  ['على الآيفون: المصحف أصلي بخطه نفسه (خطوط مصحف المدينة)، مع تقليب الصفحات والتفسير بالضغط المطوّل، والبث والزكاة والمظهر وتصميم البطاقات أصلية كذلك', 'siri', ''],
  ['على الآيفون: المصحف وكل صفحات الأقسام والنوافذ صارت أصلية بنفس التصميم، مع السحب للرجوع', 'siri', ''],
  ['على الآيفون: الرئيسية والأذكار والمزيد صارت أصلية أيضًا، بكل بطاقاتها وأزرارها وبنفس التصميم', 'siri', ''],
  ['على الآيفون: الشريط السفلي وصفحة الصلاة صارا أصليين بلغة تصميم التطبيق نفسها — أسرع وأنعم', 'siri', ''],
  'صفحة «المزيد» أبسط: كل مجموعة في بطاقة واحدة، دون تكرار أو شروح زائدة',
  'منبّه الصلاة: مستوى الصوت، والبدء الهادئ، وأنماط الاهتزاز أو إيقافه، ومدة الرنين، والغفوة',
  'واجهة أسرع وتنقّل وسحب للرجوع أكثر سلاسة، وتباين أوضح في الوضع الزجاجي',
  ['على الآيفون: مواقيت الصلاة في الجزيرة الديناميكية وشاشة القفل، وأزرار مركز التحكم، وسيري يفتح أي سورة ويخبرك بوقت أي صلاة', 'siri', ''],
  ['على الآيفون: لم يعد التطبيق يفتح على شاشة بيضاء', 'siri', '']
];
M.whatsNew = ()=>M.WHATS_NEW.map(x=>typeof x === 'string' ? x : (M.can(x[1]) ? x[0] : x[2])).filter(Boolean);
/* the welcome opens at once on a first run (before the splash lifts), and once more after each update to say what is new */
M.maybeOnboard = ()=>{
  const first = !M.store.get('onboarded', 0), seen = M.store.get('seenVersion', '');
  if(!first && seen === M.VERSION) return;
  try{ const v = M.openOnboarding(first ? '' : 'update'); if(v && v.el){ v.el.style.animation = 'none'; v.el.classList.add('onb-now'); } }catch(e){ M.store.set('seenVersion', M.VERSION); }
};
/* background audio: tell the native side to hold a foreground service while the Quran plays */
let _pl = false;
M.on('player', P=>{
  const on = !!(P && P.playing);
  if(on === _pl) return; _pl = on;
  try{ window.Android && window.Android.setPlaying && window.Android.setPlaying(on, on ? 'سورة '+M.sname(P.s) : ''); }catch(e){}
});
})();
