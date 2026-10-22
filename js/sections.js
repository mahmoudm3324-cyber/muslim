/* ===== Sections registry, guides (accordion pages), Friday guide, all-sections list, custom shortcuts ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const B = 'رواه البخاري', MS = 'رواه مسلم', MF = 'متفق عليه', AD = 'رواه أبو داود', TR = 'رواه الترمذي';
const norm = s=>M.normAr ? M.normAr(s) : s;

/* ---- guides ---- */
const GUIDES = {
 sunan: {title:'السنن الرواتب', intro:'«مَنْ صَلَّى اثْنَتَيْ عَشْرَةَ رَكْعَةً فِي يَوْمٍ وَلَيْلَةٍ بُنِيَ لَهُ بِهِنَّ بَيْتٌ فِي الْجَنَّةِ» — رواه مسلم', steps:[
  {t:'قبل الفجر', s:'ركعتان', b:['«رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا» — رواه مسلم', 'يُستحب تخفيفهما، ويقرأ فيهما بـ«الكافرون» و«الإخلاص» غالبًا']},
  {t:'الظهر', s:'أربع قبلها وركعتان بعدها', b:['«مَنْ حَافَظَ عَلَى أَرْبَعِ رَكَعَاتٍ قَبْلَ الظُّهْرِ وَأَرْبَعٍ بَعْدَهَا حَرَّمَهُ اللَّهُ عَلَى النَّارِ» — رواه أبو داود والترمذي']},
  {t:'المغرب', s:'ركعتان بعدها', b:['تُصلّى بعد الفريضة مباشرة']},
  {t:'العشاء', s:'ركعتان بعدها', b:['ثم الوتر قبل النوم أو في آخر الليل']},
  {t:'ملاحظة', s:'سنن غير مؤكدة', b:['ركعتان قبل العصر، وركعتان قبل المغرب، وركعتان قبل العشاء — «بَيْنَ كُلِّ أَذَانَيْنِ صَلَاةٌ» — متفق عليه']}]},
 duha: {title:'صلاة الضحى', intro:'«يُصْبِحُ عَلَى كُلِّ سُلَامَى مِنْ أَحَدِكُمْ صَدَقَةٌ… وَيُجْزِئُ مِنْ ذَلِكَ رَكْعَتَانِ يَرْكَعُهُمَا مِنَ الضُّحَى» — رواه مسلم', steps:[
  {t:'وقتها', s:'من ارتفاع الشمس إلى قبيل الزوال', b:['يبدأ بعد الشروق بنحو ١٥–٢٠ دقيقة (قدر رمح)', 'ويمتد إلى قبل الظهر بنحو ١٠ دقائق', 'الأفضل عند اشتداد الحر: «صَلَاةُ الْأَوَّابِينَ حِينَ تَرْمَضُ الْفِصَالُ» — رواه مسلم']},
  {t:'عدد الركعات', s:'أقلها ركعتان', b:['ثبت عن النبي ﷺ ركعتان وأربع وثمانٍ', 'يُسلّم من كل ركعتين']}]},
 qiyam: {title:'قيام الليل', intro:'«أَفْضَلُ الصَّلَاةِ بَعْدَ الْفَرِيضَةِ صَلَاةُ اللَّيْلِ» — رواه مسلم', steps:[
  {t:'وقته', s:'من بعد العشاء إلى الفجر', b:['أفضله الثلث الأخير من الليل', '«يَنْزِلُ رَبُّنَا تَبَارَكَ وَتَعَالَى كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الْآخِرُ، فَيَقُولُ: مَنْ يَدْعُونِي فَأَسْتَجِيبَ لَهُ…» — متفق عليه']},
  {t:'كيفيته', s:'مثنى مثنى', b:['«صَلَاةُ اللَّيْلِ مَثْنَى مَثْنَى، فَإِذَا خَشِيَ أَحَدُكُمُ الصُّبْحَ صَلَّى رَكْعَةً وَاحِدَةً تُوتِرُ لَهُ مَا قَدْ صَلَّى» — متفق عليه', 'ثبت عنه ﷺ إحدى عشرة ركعة غالبًا']},
  {t:'الوتر', s:'ركعة فأكثر', b:['«الْوِتْرُ حَقٌّ عَلَى كُلِّ مُسْلِمٍ، فَمَنْ أَحَبَّ أَنْ يُوتِرَ بِخَمْسٍ فَلْيَفْعَلْ…» — رواه أبو داود', 'اجعل آخر صلاتك بالليل وترًا']}]},
 suhoor: {title:'السحور', intro:'«تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً» — متفق عليه', steps:[
  {t:'فضله', s:'بركة وعون على الصيام', b:['ولو بشربة ماء أو تمرات: «نِعْمَ سَحُورُ الْمُؤْمِنِ التَّمْرُ» — رواه أبو داود']},
  {t:'وقته', s:'قبيل الفجر', b:['يُستحب تأخيره ما لم يخشَ طلوع الفجر', 'ويُمسك عند أذان الفجر الصادق']}]},
 iftar: {title:'وقت الإفطار', intro:'«لَا يَزَالُ النَّاسُ بِخَيْرٍ مَا عَجَّلُوا الْفِطْرَ» — متفق عليه', steps:[
  {t:'عند الغروب', s:'تعجيل الفطر', b:['يُفطر عند غروب الشمس مباشرة (أذان المغرب)']},
  {t:'ما يُفطر عليه', s:'رطب ثم تمر ثم ماء', b:['«كَانَ يُفْطِرُ قَبْلَ أَنْ يُصَلِّيَ عَلَى رُطَبَاتٍ، فَإِنْ لَمْ تَكُنْ رُطَبَاتٌ فَتُمَيْرَاتٌ، فَإِنْ لَمْ تَكُنْ تُمَيْرَاتٌ حَسَا حَسَوَاتٍ مِنْ مَاءٍ» — رواه أبو داود والترمذي']},
  {t:'الدعاء', s:'عند الإفطار', b:['«ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ» — رواه أبو داود', '«لِلصَّائِمِ عِنْدَ فِطْرِهِ دَعْوَةٌ مَا تُرَدُّ» — رواه ابن ماجه (ضعّفه الألباني)']}]},
 fast_week: {title:'صيام الاثنين والخميس', intro:'«تُعْرَضُ الْأَعْمَالُ يَوْمَ الِاثْنَيْنِ وَالْخَمِيسِ فَأُحِبُّ أَنْ يُعْرَضَ عَمَلِي وَأَنَا صَائِمٌ» — رواه الترمذي', steps:[
  {t:'الاثنين', s:'يوم وُلد فيه النبي ﷺ وأُنزل عليه', b:['«ذَاكَ يَوْمٌ وُلِدْتُ فِيهِ وَيَوْمٌ بُعِثْتُ أَوْ أُنْزِلَ عَلَيَّ فِيهِ» — رواه مسلم']},
  {t:'الخميس', s:'تُعرض فيه الأعمال', b:['يُستحب أن تنوي الصيام من الليل']}]},
 fast_white: {title:'صيام الأيام البيض', intro:'«صِيَامُ ثَلَاثَةِ أَيَّامٍ مِنْ كُلِّ شَهْرٍ صِيَامُ الدَّهْرِ» — رواه النسائي', steps:[
  {t:'أيامها', s:'١٣ و١٤ و١٥ من كل شهر هجري', b:['«إِذَا صُمْتَ مِنَ الشَّهْرِ ثَلَاثَةَ أَيَّامٍ فَصُمْ ثَلَاثَ عَشْرَةَ وَأَرْبَعَ عَشْرَةَ وَخَمْسَ عَشْرَةَ» — رواه الترمذي والنسائي']}]},
 arafa: {title:'يوم عرفة', intro:'«صِيَامُ يَوْمِ عَرَفَةَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ وَالسَّنَةَ الَّتِي بَعْدَهُ» — رواه مسلم', steps:[
  {t:'لغير الحاج', s:'يُستحب صيامه', b:['وهو التاسع من ذي الحجة', 'أما الحاج فلا يصومه بعرفة']},
  {t:'الدعاء', s:'خير الدعاء', b:['«خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ، وَخَيْرُ مَا قُلْتُ أَنَا وَالنَّبِيُّونَ مِنْ قَبْلِي: لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ…» — رواه الترمذي']}]},
 ashura: {title:'يوم عاشوراء', intro:'«صِيَامُ يَوْمِ عَاشُورَاءَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ» — رواه مسلم', steps:[
  {t:'متى؟', s:'العاشر من محرم', b:['يُستحب صيام التاسع معه أو الحادي عشر مخالفةً لأهل الكتاب — رواه مسلم وأحمد']}]},
 forbidden: {title:'أوقات النهي', intro:'أوقات يُنهى فيها عن ابتداء النافلة المطلقة', steps:[
  {t:'بعد الفجر حتى ترتفع الشمس', s:'نحو ١٥ دقيقة بعد الشروق', b:['«لَا صَلَاةَ بَعْدَ الصُّبْحِ حَتَّى تَرْتَفِعَ الشَّمْسُ» — متفق عليه']},
  {t:'وقت الاستواء', s:'قبيل الظهر بنحو ١٠ دقائق', b:['«وَحِينَ يَقُومُ قَائِمُ الظَّهِيرَةِ حَتَّى تَمِيلَ الشَّمْسُ» — رواه مسلم']},
  {t:'بعد العصر حتى الغروب', s:'ويشتد قبيل الغروب', b:['«وَلَا صَلَاةَ بَعْدَ الْعَصْرِ حَتَّى تَغِيبَ الشَّمْسُ» — متفق عليه', 'يجوز فيها ما له سبب كتحية المسجد وقضاء الفوائت عند أكثر العلماء']}]},
 qada_ram: {title:'قضاء رمضان', intro:'﴿فَعِدَّةٌ مِّنْ أَيَّامٍ أُخَرَ﴾ — البقرة: ١٨٤', steps:[
  {t:'متى؟', s:'قبل رمضان القادم', b:['كانت عائشة رضي الله عنها تقضي في شعبان — متفق عليه', 'يجوز التتابع والتفريق']},
  {t:'كيف؟', s:'بعدد الأيام التي أفطرتها', b:['تنوي الصيام من الليل (قضاءً)', 'يمكنك متابعة ما بقي من «قضاء الصلوات والصيام»']}]}
};
M.GUIDES = GUIDES;
/* the body of one guide (also used by the combined screens of v2-unify.js) */
M.guideInto = function(b, id, opts){
  const g = GUIDES[id]; if(!g) return false;
  opts = opts || {};
  if(opts.heading) b.append(h('h3.section-h', g.title));
  if(g.intro) b.append(h('div.card.pad.guide-intro.qfont', g.intro));
  g.steps.forEach((st, i)=>{
    const body = h('div.gd-body', ...st.b.map(x=>h('div.gd-b', h('span.gd-dot'), h('span', x))));
    const card = h('div.card.gd-step'+(i === 0 && !opts.closed ? '.open' : ''), h('button.gd-head', {'aria-expanded':String(i === 0 && !opts.closed), onclick:function(){ const o = card.classList.toggle('open'); this.setAttribute('aria-expanded', String(o)); }}, h('div.grow', h('div.bold', st.t), h('div.small.muted', st.s)), h('span.gd-n.num', M.n(i + 1)), M.ic('chevDown')), body);
    b.append(card);
  });
  if(!opts.noNote) b.append(h('div.tiny.muted', {style:'margin:10px 2px;line-height:1.8'}, 'المصادر من كتب الحديث المعتمدة؛ وللتفصيل الفقهي يُرجع إلى أهل العلم في بلدك.'));
  return true;
};
M.openGuide = function(id){
  const g = GUIDES[id]; if(!g) return;
  return M.openView({id:'guide-'+id, title:g.title, build:b=>{ M.guideInto(b, id); }});
};

/* ---- Friday: accordion + checklist + share ---- */
M.openFriday = function(){
  const isFri = new Date().getDay() === 5;
  const STEPS = [
   {id:'fri_prep', t:'الاستعداد', s:'قبل الخروج إلى المسجد', b:['الاغتسال', 'السواك', 'لبس أحسن الثياب', 'التطيب'], h:['مَنِ اغْتَسَلَ يَوْمَ الْجُمُعَةِ وَلَبِسَ مِنْ أَحْسَنِ ثِيَابِهِ وَمَسَّ مِنْ طِيبٍ إِنْ كَانَ عِنْدَهُ، ثُمَّ أَتَى الْجُمُعَةَ فَلَمْ يَتَخَطَّ أَعْنَاقَ النَّاسِ، ثُمَّ صَلَّى مَا كَتَبَ اللَّهُ لَهُ، ثُمَّ أَنْصَتَ إِذَا خَرَجَ إِمَامُهُ حَتَّى يَفْرُغَ مِنْ صَلَاتِهِ، كَانَتْ كَفَّارَةً لِمَا بَيْنَهَا وَبَيْنَ جُمُعَتِهِ الَّتِي قَبْلَهَا', AD]},
   {id:'fri_early', t:'التبكير إلى المسجد', s:'كلما بكّرت عظُم أجرك', b:['الساعة الأولى: كمن قرّب بدنة', 'الثانية: كمن قرّب بقرة', 'الثالثة: كمن قرّب كبشًا أقرن', 'الرابعة: كمن قرّب دجاجة', 'الخامسة: كمن قرّب بيضة'], h:['إِذَا خَرَجَ الْإِمَامُ حَضَرَتِ الْمَلَائِكَةُ يَسْتَمِعُونَ الذِّكْرَ', MF]},
   {id:'fri_kahf', t:'قراءة سورة الكهف', s:'نورٌ ما بين الجمعتين', b:['وقتها من غروب شمس الخميس إلى غروب شمس الجمعة'], h:['مَنْ قَرَأَ سُورَةَ الْكَهْفِ يَوْمَ الْجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ', 'رواه الحاكم والبيهقي'], act:['quran', 'قراءة سورة الكهف', ()=>M.openReader({sura:18, ayah:1})]},
   {id:'fri_silent', t:'الإنصات للخطبة', s:'من لغا فلا جمعة له', b:['لا تتكلم والإمام يخطب', 'لا تعبث بالحصى ونحوه', 'لا تتخطَّ رقاب الناس'], h:['إِذَا قُلْتَ لِصَاحِبِكَ يَوْمَ الْجُمُعَةِ أَنْصِتْ وَالْإِمَامُ يَخْطُبُ فَقَدْ لَغَوْتَ', MF]},
   {id:'fri_salawat', t:'الصلاة على النبي ﷺ', s:'أكثِر منها في يومك وليلتك', b:['اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ…'], h:['إِنَّ مِنْ أَفْضَلِ أَيَّامِكُمْ يَوْمَ الْجُمُعَةِ… فَأَكْثِرُوا عَلَيَّ مِنَ الصَّلَاةِ فِيهِ، فَإِنَّ صَلَاتَكُمْ مَعْرُوضَةٌ عَلَيَّ', AD], act:['beads', 'العدّاد', ()=>{ const s = M.store.get('tasbih', {}); s.cur = 'sal'; M.store.set('tasbih', s); M.openTasbih(); }]},
   {id:'fri_ijaba', t:'ساعة الإجابة', s:'لا يُسأل الله فيها شيئًا إلا أعطاه', b:['أرجاها: آخر ساعة بعد العصر حتى غروب الشمس', 'وقيل: ما بين جلوس الإمام على المنبر وانقضاء الصلاة'], h:['فِيهِ سَاعَةٌ لَا يُوَافِقُهَا عَبْدٌ مُسْلِمٌ وَهُوَ قَائِمٌ يُصَلِّي يَسْأَلُ اللَّهَ شَيْئًا إِلَّا أَعْطَاهُ إِيَّاهُ', MF], act:['heart', 'الدعاء', ()=>M.openJami()], remind:true}
  ];
  const doneOf = id=>M.T ? M.T.get(new Date(), id) : false;
  const shareFri = ()=>M.share('سنن يوم الجمعة\n'+STEPS.map(x=>'• '+x.t).join('\n')+'\n«خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ» رواه مسلم');
  return M.openView({title:'الجمعة', id:'friday', actions:[h('button.icon-btn', {'aria-label':'مشاركة', onclick:()=>shareFri()}, M.ic('share'))], build:b=>{
    b.append(h('div.card.pad.guide-intro.qfont', '«خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ» — رواه مسلم'));
    const cd = h('div.num.cd', ''), lbl = h('div.small.muted', '');
    b.append(h('div.card.accent.pad.fri-hero', h('div.title-font.bold', isFri ? 'جمعة مباركة' : 'الجمعة القادمة'), lbl, cd));
    function tick(){
      const now = new Date(); let d = new Date(now); d.setHours(12, 0, 0, 0); d = M.addDays(d, (5 - now.getDay() + 7) % 7);
      let t = M.prayerTimes(d).dhuhr; if(t < now){ d = M.addDays(d, 7); t = M.prayerTimes(d).dhuhr; }
      lbl.textContent = 'صلاة الجمعة '+M.fmt(t)+' — '+M.n(d.getDate())+' '+M.GMONTHS[d.getMonth()];
      const ms = t - now, dd = Math.floor(ms / 864e5); cd.textContent = (dd ? M.cnt(dd, 'يوم')+' و ' : '')+M.n(M.fmtDur(ms % 864e5));
    }
    tick(); const un = M.every(()=>{ if(!cd.isConnected){ un(); return; } tick(); });
    b.append(h('div.small.muted', {style:'margin:6px 2px'}, 'سنّ يومك بترتيبها، من الاغتسال إلى ساعة الإجابة'));
    STEPS.forEach((st, i)=>{
      const chk = isFri && M.T ? h('button.cb'+(doneOf(st.id) ? '.on' : ''), {'aria-label':'تم', onclick:function(e){ e.stopPropagation(); const v = !this.classList.contains('on'); this.classList.toggle('on', v); M.T.check(new Date(), st.id, v); M.haptic(12); }}, M.ic('check')) : null;
      const body = h('div.gd-body', ...st.b.map(x=>h('div.gd-b', h('span.gd-dot'), h('span', x))),
        h('div.gd-hadith', h('div.qfont', st.h[0]), h('div.tiny.muted', st.h[1])),
        st.act ? h('button.btn.tonal.sm', {style:'margin-top:8px', onclick:st.act[2]}, M.ic(st.act[0]), st.act[1]) : null,
        st.remind ? h('div.row-flex', {style:'margin-top:8px'}, h('div.grow.small', 'ذكّرني بساعة الإجابة كل جمعة'), M.switchEl(M.nfOn && M.nfOn('ijaba'), v=>M.nfSet('ijaba', {on:v}))) : null);
      const card = h('div.card.gd-step'+(i === 0 ? '.open' : ''), h('div.gd-head', {onclick:()=>card.classList.toggle('open')}, chk, h('div.grow', h('div.bold', st.t), h('div.small.muted', st.s)), h('span.gd-n.num', M.n(i + 1)), M.ic('chevDown')), body);
      b.append(card);
    });
    b.append(h('div.row-flex.gap-s.fri-links', {style:'margin-top:12px;justify-content:center;flex-wrap:wrap'}, h('button.btn.tonal', {onclick:()=>M.openFridayVirtues()}, M.ic('sparkle'), 'فضائل يوم الجمعة'), h('button.btn.tonal', {onclick:()=>shareFri()}, M.ic('share'), 'سنن يوم الجمعة')));
  }});
};
M.openFridayVirtues = function(){
  M.openView({id:'fri-v', title:'فضائل يوم الجمعة', build:b=>{
    [['«خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ؛ فِيهِ خُلِقَ آدَمُ، وَفِيهِ أُدْخِلَ الْجَنَّةَ، وَفِيهِ أُخْرِجَ مِنْهَا، وَلَا تَقُومُ السَّاعَةُ إِلَّا فِي يَوْمِ الْجُمُعَةِ»', MS],
     ['«إِنَّ مِنْ أَفْضَلِ أَيَّامِكُمْ يَوْمَ الْجُمُعَةِ؛ فِيهِ خُلِقَ آدَمُ، وَفِيهِ قُبِضَ، وَفِيهِ النَّفْخَةُ، وَفِيهِ الصَّعْقَةُ، فَأَكْثِرُوا عَلَيَّ مِنَ الصَّلَاةِ فِيهِ…»', AD],
     ['«أَضَلَّ اللَّهُ عَنِ الْجُمُعَةِ مَنْ كَانَ قَبْلَنَا… فَهَدَانَا اللَّهُ لِيَوْمِ الْجُمُعَةِ»', MS]].forEach(([t, s])=>b.append(h('div.dua-card', h('div.tx.qfont', t), h('div.src', s))));
  }});
};

/* ---- registry of every section ---- */
M.SECTIONS = [
 // [id, title, icon, group, fn]
 ['quran', 'المصحف', 'quran', 'القائمة', ()=>{ M.setTab('quran'); }],
 ['prayer', 'الصلاة', 'clock', 'القائمة', ()=>M.setTab('prayer')],
 ['qibla', 'القبلة', 'compass', 'القائمة', ()=>M.openQibla()],
 ['tasbih', 'العدّاد', 's:counter', 'القائمة', ()=>M.openTasbih()],
 ['random', 'المنوعة', 'sparkle', 'القائمة', ()=>M.openRandom()],
 ['tracker', 'متابعة العبادات', 'check', 'القائمة', ()=>M.openTracker({tab:'day'})],
 ['khatma', 'الختمة', 'quran', 'القائمة', ()=>M.openKhatma && M.openKhatma()],
 ['favs', 'المفضلة', 'heart', 'القائمة', ()=>M.openAdhkarCategory('favs')],
 ['mine', 'أذكاري وأدعيتي', 'star', 'الأذكار والأدعية', ()=>M.openMyDuas()],
 ['morning', 'أذكار الصباح', 'sunrise', 'الأذكار والأدعية', ()=>M.openAdhkarCategory('morning')],
 ['evening', 'أذكار المساء', 'moon', 'الأذكار والأدعية', ()=>M.openAdhkarCategory('evening')],
 ['after', 'أذكار الصلاة', 'mosque', 'الأذكار والأدعية', ()=>M.openAdhkarCategory('after')],
 ['sleep', 'أذكار النوم', 'star', 'الأذكار والأدعية', ()=>M.openAdhkarCategory('sleep')],
 ['wake', 'أذكار الاستيقاظ', 'sun', 'الأذكار والأدعية', ()=>M.openAdhkarCategory('wake')],
 ['quranduas', 'أدعية من القرآن', 'quran', 'الأذكار والأدعية', ()=>M.openAdhkarCategory('duas')],
 ['jami', 'أدعية شاملة', 'note', 'الأذكار والأدعية', ()=>M.openJami()],
 ['sunna_ruqya', 'الرقية بالسنة', 'shield', 'الأذكار والأدعية', ()=>M.openRuqya('sunna')],
 ['quran_ruqya', 'الرقية بالقرآن', 'quran', 'الأذكار والأدعية', ()=>M.openRuqya('quran')],
 ['tasabih', 'تسابيح', 'beads', 'الأذكار والأدعية', ()=>M.openTasabih()],
 ['tijan', 'تيجان الذكر السبعة', 's:star8', 'الأذكار والأدعية', ()=>M.openTijan()],
 ['hamd', 'الحمد والثناء', 'heart', 'الأذكار والأدعية', ()=>M.openHamd()],
 ['istighfar', 'الاستغفار', 'sparkle', 'الأذكار والأدعية', ()=>M.openIstighfar()],
 ['topics', 'أدعية حسب المواضيع', 'note', 'الأذكار والأدعية', ()=>M.openTopics()],
 ['sick', 'أدعية المريض', 'heart', 'الأذكار والأدعية', ()=>M.openSickDua()],
 ['yusr', 'أدعية التيسير', 'sunrise', 'الأذكار والأدعية', ()=>M.openYusr()],
 ['duas', 'مكتبة الأدعية', 'heart', 'الأذكار والأدعية', ()=>M.openDuas()],
 ['loved', 'أذكار الأحبة', 'kids', 'الأذكار والأدعية', ()=>M.openLoved()],
 ['names', 'أسماء الله الحسنى', 'mosque', 'صفحات', ()=>M.openNames()],
 ['friday', 'الجمعة', 'mosque', 'صفحات', ()=>M.openFriday()],
 ['sunan', 'السنن الرواتب', 'moon', 'صفحات', ()=>M.openGuide('sunan')],
 ['duha', 'صلاة الضحى', 'sun', 'صفحات', ()=>M.openGuide('duha')],
 ['qiyam', 'قيام الليل والوتر', 'moon', 'صفحات', ()=>M.openGuide('qiyam')],
 ['forbidden', 'أوقات النهي', 'clock', 'صفحات', ()=>M.openGuide('forbidden')],
 ['qada_ram', 'قضاء رمضان', 'check', 'صفحات', ()=>M.openGuide('qada_ram')],
 ['qada', 'قضاء الصلوات والصيام', 'check', 'صفحات', ()=>M.openQada()],
 ['hajj', 'الحج', 'kaaba', 'صفحات', ()=>M.openHajj()],
 ['kids', 'ركن الأطفال', 'kids', 'صفحات', ()=>M.openKids()],
 ['quiz', 'المسابقات الدينية', 's:quiz', 'أدوات', ()=>M.openQuiz()],
 ['downloads', 'التنزيلات', 'download', 'أدوات', ()=>M.openDownloads()],
 ['ramadan', 'رمضان', 'moon', 'رمضان والصيام', ()=>M.openRamadan()],
 ['suhoor', 'السحور', 'moon', 'رمضان والصيام', ()=>M.openGuide('suhoor')],
 ['iftar', 'وقت الإفطار', 'moon', 'رمضان والصيام', ()=>M.openGuide('iftar')],
 ['fast_week', 'صيام الاثنين والخميس', 'moon', 'رمضان والصيام', ()=>M.openGuide('fast_week')],
 ['fast_white', 'صيام الأيام البيض', 'moon', 'رمضان والصيام', ()=>M.openGuide('fast_white')],
 ['arafa', 'يوم عرفة', 'moon', 'رمضان والصيام', ()=>M.openGuide('arafa')],
 ['ashura', 'يوم عاشوراء', 'moon', 'رمضان والصيام', ()=>M.openGuide('ashura')],
 ['calendar', 'التقويم الهجري والقمر', 'calendar', 'أدوات', ()=>M.openCalendar()],
 ['zakat', 'حاسبة الزكاة', 'coin', 'أدوات', ()=>M.openZakat()],
 ['radio', 'إذاعات القرآن', 'radio', 'أدوات', ()=>M.openRadio()],
 ['tv', 'البث المباشر', 'tv', 'أدوات', ()=>M.openTV()],
 ['sounds', 'المكتبة الصوتية', 'play', 'أدوات', ()=>M.openSounds()],
 ['notifs', 'الإشعارات', 'bell', 'أدوات', ()=>M.openNotifs()],
 ['stats', 'إحصاءات القراءة', 'quran', 'أدوات', ()=>M.openQuranStats()],
 ['search', 'البحث', 'search', 'أدوات', ()=>M.openSearch()],
 ['settings', 'الإعدادات', 'settings', 'أدوات', ()=>M.openSettings()]
];
/* groups and their order (one place decides how every list of sections is arranged) */
M.SECTION_GROUPS = [
 ['الأساسية', ['quran','prayer','qibla','tasbih','tracker','khatma','favs','random']],
 ['الأذكار اليومية', ['morning','evening','after','sleep','wake','tijan','tasabih','istighfar','hamd','names']],
 ['الأدعية والرقية', ['duas','quranduas','jami','topics','yusr','sick','loved','mine','sunna_ruqya','quran_ruqya']],
 ['الصلاة والسنن', ['friday','sunan','duha','qiyam','forbidden','qada']],
 ['الصيام والمواسم', ['ramadan','suhoor','iftar','qada_ram','fast_week','fast_white','arafa','ashura','hajj','calendar']],
 ['الصوتيات والبث', ['radio','tv','sounds']],
 ['أدوات', ['quiz','zakat','kids','downloads','stats','search']],
 ['الإعدادات', ['notifs','settings']]
];
/* a meaningful icon for every section */
const SEC_ICON = {tijan:'s:star8', quiz:'s:quiz', downloads:'download', quran:'s:mushaf', prayer:'s:mosque', qibla:'s:qibla', tasbih:'s:counter', tracker:'s:tracker', khatma:'s:khatma', favs:'s:heart', random:'s:rosette',
  morning:'s:sunrise', evening:'s:moon', after:'s:dome', sleep:'s:crescent', wake:'s:sun', tasabih:'s:beads', istighfar:'s:dua', hamd:'s:quatrefoil', names:'s:allah',
  duas:'s:dua', quranduas:'s:tafsir', jami:'s:names', topics:'s:list', yusr:'s:dua', sick:'s:heart', loved:'s:heart', mine:'s:mine', sunna_ruqya:'s:ruqya', quran_ruqya:'s:ruqya',
  friday:'s:skyline', sunan:'s:muhammad', duha:'s:sun', qiyam:'s:crescentdome', forbidden:'s:clock', qada:'s:qada',
  ramadan:'s:crescent', suhoor:'s:lantern', iftar:'s:lantern', qada_ram:'s:calendar', fast_week:'s:calendar', fast_white:'s:moon', arafa:'s:kaaba', ashura:'s:star8', hajj:'s:kaaba', calendar:'s:calendar',
  radio:'s:radio', tv:'s:tv', sounds:'s:minaret', zakat:'s:zakat', kids:'s:kids', stats:'s:stats', search:'s:search', notifs:'s:bell', settings:'s:settings'};
M.SECTIONS.forEach(s=>{ if(SEC_ICON[s[0]]) s[2] = SEC_ICON[s[0]]; });
(function(){
  const pos = {}; let i = 0;
  M.SECTION_GROUPS.forEach(([g, ids])=>ids.forEach(id=>{ pos[id] = [g, i++]; }));
  M.SECTIONS.forEach(s=>{ if(pos[s[0]]) s[3] = pos[s[0]][0]; else s[3] = 'أدوات'; });
  M.SECTIONS.sort((a, b)=>(pos[a[0]] ? pos[a[0]][1] : 999) - (pos[b[0]] ? pos[b[0]][1] : 999));
})();
const SEC = {}; M.SECTIONS.forEach(s=>SEC[s[0]] = s);
M.sectionOpen = id=>{ const s = SEC[id]; if(s) s[4](); };
/* a module registers one of its screens: M.addSection({id, title, icon, group, fn}).
   It then appears in «جميع الأقسام», in the shortcut editor, in the More screen (under its own group) and in the floating menu. */
M.MORE_EXTRA = [];
M.addSection = function(o){
  const g = o.group || 'أدوات';
  let s = SEC[o.id];
  if(!s){ s = [o.id, o.title, o.icon || 'dot', g, o.fn]; M.SECTIONS.push(s); SEC[o.id] = s; }
  else { s[1] = o.title; s[2] = o.icon || s[2]; s[3] = g; s[4] = o.fn; }
  let grp = M.SECTION_GROUPS.find(x=>x[0] === g); if(!grp){ grp = [g, []]; M.SECTION_GROUPS.push(grp); }
  if(!grp[1].includes(o.id)) grp[1].push(o.id);
  if(!o.noMore){ let m = M.MORE_EXTRA.find(x=>x[0] === g); if(!m){ m = [g, []]; M.MORE_EXTRA.push(m); } if(!m[1].includes(o.id)) m[1].push(o.id); }
  return s;
};

M.addSection({id:'look', title:'المظهر والسمات', icon:'s:look', group:'الإعدادات', fn:()=>M.openSettings('look'), noMore:true});

/* ---- one organisation for every list of sections (More tab, «جميع الأقسام», search) ---- */
/* group → ordered ids. A section not named here goes to the group its module asked for (OLD_GROUP) or else to «أدوات»,
   so every section appears in exactly one group. */
M.SECTION_ORG = [
 ['عباداتي', ['tracker', 'khatma', 'tasbih', 'tijan', 'qada', 'favs', 'mine']],
 ['القرآن والتلاوة', ['quran', 'qplayer', 'hifz', 'tasmee', 'mushaf_editions', 'tajweed', 'quranduas', 'stats']],
 ['الأذكار اليومية', ['morning', 'evening', 'after', 'sleep', 'wake', 'adhkar2_hisn', 'tasabih', 'istighfar', 'hamd']],
 ['الأدعية والرقية', ['duas', 'jami', 'topics', 'yusr', 'sick', 'loved', 'ruqya2']],
 ['الصلاة والمواسم', ['prayer', 'qibla', 'mosques', 'friday', 'sunan', 'duha', 'qiyam', 'forbidden', 'hajj', 'calendar', 'dst']],
 ['الصيام ورمضان', ['ramadan', 'suhoor', 'iftar', 'qada_ram', 'fast_week', 'fast_white', 'arafa', 'ashura']],
 ['تعلّم وكتب', ['sunnah', 'prophets', 'names', 'kids', 'quiz']],
 ['الصوتيات والبث', ['radio', 'tv', 'sounds', 'sleep_timer', 'downloads']],
 ['أدوات', ['zakat', 'search', 'random', 'cards']],
 ['الإعدادات والأمان', ['notifs', 'health', 'look', 'navbar_cfg', 'v2_security', 'settings']]
];
const OLD_GROUP = {'القرآن الكريم':'القرآن والتلاوة', 'الكتب والمكتبة':'تعلّم وكتب', 'الأذكار والأدعية':'الأدعية والرقية', 'الإعدادات':'الإعدادات والأمان', 'الأذكار اليومية':'الأذكار اليومية', 'الصيام والمواسم':'الصيام ورمضان', 'الصلاة والسنن':'الصلاة والمواسم'};
/* extra search words per section (matched together with the title and the group name) */
M.SECTION_KW = {
 tracker:'محاسبة يومية عبادات متابعة سجل الصلوات صليت جماعة فائتة', khatma:'ختم القرآن ورد', tasbih:'مسبحة عداد سبحة ذكر', tijan:'تاج ذكر', qada:'قضاء فوائت صلاة صيام', favs:'المفضلة محفوظات', mine:'أدعيتي خاصة',
 quran:'مصحف قرآن قراءة سور', qplayer:'مشغل تلاوة استماع قارئ صوت', hifz:'حفظ مراجعة تكرار', tasmee:'تسميع حفظ ميكروفون صوت تلاوة اختبار', mushaf_editions:'مصحف طبعة رسم', tajweed:'تجويد أحكام تلاوة', quranduas:'أدعية القرآن ربنا', stats:'إحصاءات قراءة',
 morning:'صباح', evening:'مساء', after:'بعد الصلاة تسبيح', sleep:'نوم منام', wake:'استيقاظ', adhkar2_hisn:'حصن المسلم أذكار', tasabih:'تسبيح', istighfar:'استغفار توبة', hamd:'حمد شكر ثناء',
 duas:'دعاء أدعية', jami:'جوامع الدعاء', topics:'أدعية مواضيع', yusr:'تيسير رزق هم فرج', sick:'مرض شفاء', loved:'أحبة أهل', sunna_ruqya:'رقية سنة', quran_ruqya:'رقية قرآن', ruqya2:'رقية عين حسد سحر',
 prayer:'مواقيت أذان صلاة', qibla:'قبلة اتجاه بوصلة', friday:'جمعة كهف', sunan:'سنن رواتب نوافل', duha:'ضحى', qiyam:'قيام تهجد وتر ليل', forbidden:'أوقات النهي كراهة', hajj:'حج عمرة مناسك', calendar:'تقويم هجري قمر تاريخ مناسبات',
 ramadan:'رمضان صيام تراويح', suhoor:'سحور', iftar:'إفطار', qada_ram:'قضاء رمضان', fast_week:'صيام اثنين خميس', fast_white:'أيام بيض صيام', arafa:'عرفة', ashura:'عاشوراء محرم',
 sunnah:'حديث كتب السنة بخاري مسلم', prophets:'قصص أنبياء سيرة', names:'أسماء الله الحسنى', kids:'أطفال تعليم', quiz:'مسابقة اختبار أسئلة',
 radio:'إذاعة بث قرآن', tv:'بث مباشر مكة المدينة الحرمين', sounds:'أذان أصوات تلاوات مكتبة صوتية', sleep_timer:'مؤقت نوم إيقاف', downloads:'تنزيلات تحميل ملفات بدون إنترنت',
 zakat:'زكاة مال ذهب نصاب', zakat2:'زكاة تفصيلية', search:'بحث آية', random:'منوعة عشوائي', cards:'بطاقات منشورات مشاركة صورة',
 notifs:'إشعارات تنبيه تذكير', health:'فحص صحة التطبيق مشكلة الأذان لا يصل لا يعمل إشعارات بطارية تقرير أخطاء تشخيص', mosques:'مساجد قريبة مسجد جامع خريطة', dst:'توقيت صيفي شتوي ساعة منطقة زمنية', plog:'سجل الصلوات صليت فائتة جماعة', look:'مظهر سمة ثيم ألوان خلفية وضع ليلي', navbar_cfg:'شريط سفلي دائرة عائمة تخصيص', v2_security:'أمان قفل كلمة سر نسخ احتياطي', settings:'إعدادات ضبط لغة'
};
M.orgGroups = function(){
  const have = {}; (M.SECTIONS || []).forEach(s=>{ have[s[0]] = s; });
  const placed = new Set((M.SECTION_HIDE || []).filter(id=>have[id])), out = [];   // hidden = superseded by a newer section (still opens by id)
  Object.keys(M.SECTION_INNER || {}).forEach(id=>{ if(have[id]) placed.add(id); });  // inner = shown inside a hub screen (v2-unify.js), still found by search
  M.SECTION_ORG.forEach(([g, ids])=>{ const l = []; ids.forEach(id=>{ if(have[id] && !placed.has(id)){ placed.add(id); l.push(have[id]); } }); out.push([g, l]); });
  (M.SECTIONS || []).forEach(s=>{
    if(placed.has(s[0])) return; placed.add(s[0]);
    let g = OLD_GROUP[s[3]] || s[3]; let grp = out.find(x=>x[0] === g); if(!grp){ g = 'أدوات'; grp = out.find(x=>x[0] === g); }
    grp[1].push(s);
  });
  return out.filter(x=>x[1].length);
};
M.secFind = function(q){
  const nq = norm(String(q || '').trim()); if(!nq) return [];
  const words = nq.split(/\s+/).filter(Boolean), res = [];
  const test = (s, g)=>{
    const hay = norm(s[1]+' '+(M.SECTION_KW[s[0]] || '')+' '+g);
    if(words.every(w=>hay.includes(w))) res.push([s, norm(s[1]).includes(nq) ? 0 : words.every(w=>norm(s[1]).includes(w)) ? 1 : 2]);
  };
  M.orgGroups().forEach(([g, l])=>l.forEach(s=>test(s, g)));
  // pages that now live inside a hub are still found by their own name (they open the hub on the right tab)
  Object.keys(M.SECTION_INNER || {}).forEach(id=>{ const s = SEC[id]; if(s) test(s, ''); });
  return res.sort((a, b)=>a[1] - b[1]).map(x=>x[0]);
};
/* pinned and recently used sections */
const nopin = ()=>[];
M.secPins = ()=>{ const a = M.store.get('secPins', nopin()); return (Array.isArray(a) ? a : []).filter(id=>SEC[id]); };
M.secIsPinned = id=>M.secPins().includes(id);
M.secPin = function(id, on){
  const a = M.secPins(), i = a.indexOf(id), want = on === undefined ? i < 0 : !!on;
  if(want && i < 0) a.push(id); else if(!want && i >= 0) a.splice(i, 1);
  M.store.set('secPins', a); M.emit && M.emit('secpins', id); return want;
};
M.secRecent = ()=>{ const a = M.store.get('secRecent', nopin()); return (Array.isArray(a) ? a : []).filter(id=>SEC[id]).slice(0, 6); };
const NO_RECENT = ['quran', 'prayer'];       // these two are tabs of their own
M.sectionOpen = id=>{
  const s = SEC[id]; if(!s) return;
  if(!NO_RECENT.includes(id)){ try{ const a = M.secRecent().filter(x=>x !== id); a.unshift(id); M.store.set('secRecent', a.slice(0, 6)); M.emit && M.emit('secrecent', id); }catch(e){} }
  return s[4]();
};
/* long press on a tile pins / unpins it */
M.secTile = function(s, opts){
  opts = opts || {};
  const pinned = M.secIsPinned(s[0]);
  const t = h('button.tile.card.sec-tile'+(pinned ? '.pinned' : ''), {dataset:{sec:s[0]}, 'aria-label':s[1]}, h('div.ti', {html:M.icon(s[2])}), h('span.sec-t', s[1]), pinned && !opts.noStar ? h('span.sec-pin', {html:M.icon('star')}) : null);
  let timer = null, fired = false, x0 = 0, y0 = 0;
  const stop = ()=>{ clearTimeout(timer); timer = null; };
  t.addEventListener('pointerdown', e=>{ fired = false; x0 = e.clientX; y0 = e.clientY; stop(); timer = setTimeout(()=>{ fired = true; const on = M.secPin(s[0]); M.haptic && M.haptic(18); M.toast(on ? 'تم تثبيت القسم' : 'أُزيل التثبيت'); }, 520); });
  t.addEventListener('pointermove', e=>{ if(timer && Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 10) stop(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev=>t.addEventListener(ev, stop));
  t.addEventListener('contextmenu', e=>e.preventDefault());
  t.addEventListener('click', e=>{ if(fired){ fired = false; e.preventDefault(); return; } M.sectionOpen(s[0]); });
  return t;
};

M.openAllSections = function(){
  M.openView({id:'allsec', title:'جميع الأقسام', build:b=>{
    const q = h('input.field', {placeholder:'ابحث…', type:'search', 'aria-label':'بحث في الأقسام', oninput:()=>draw()});
    const box = h('div.col-flex'); b.append(h('div.sec-sticky', q), h('div.small.muted.sec-hint', 'اضغط النجمة لتثبيت أي قسم في «المزيد»'), box);
    function row(s){
      const star = h('button.icon-btn.sec-star'+(M.secIsPinned(s[0]) ? '.on' : ''), {'aria-label':'تثبيت', 'aria-pressed':M.secIsPinned(s[0]), onclick:function(e){ e.stopPropagation(); const on = M.secPin(s[0]); this.classList.toggle('on', on); this.setAttribute('aria-pressed', on); M.haptic && M.haptic(10); }}, M.ic('star'));
      return h('div.sec-row', h('button.item.grow', {onclick:()=>M.sectionOpen(s[0])}, h('span.lead', {html:M.icon(s[2])}), h('div.grow', h('div.t', s[1]))), star);
    }
    function draw(){
      box.innerHTML = ''; const v = q.value.trim();
      if(v){
        const r = M.secFind(v);
        if(!r.length){ box.append(h('div.empty', 'لا نتائج')); return; }
        const l = h('div.list.card'); r.forEach(s=>l.append(row(s))); box.append(l); return;
      }
      M.orgGroups().forEach(([g, secs])=>{
        box.append(h('div.section-h', g, h('span.small.muted.num', M.n(secs.length))));
        const l = h('div.list.card'); secs.forEach(s=>l.append(row(s))); box.append(l);
      });
    }
    draw();
  }});
};

/* ---- custom shortcuts ---- */
M.DEFAULT_SHORTCUTS = ['quran', 'tasbih', 'qibla', 'tracker', 'morning', 'evening', 'duas'];
M.shortcuts = ()=>{ const s = (M.cfg.shortcuts && M.cfg.shortcuts.length) ? M.cfg.shortcuts : M.DEFAULT_SHORTCUTS; return s.filter(i=>SEC[i]); };
M.openShortcutsEditor = function(){
  M.openView({id:'shortcuts', title:'اختصاراتي', build:b=>{
    const box = h('div.col-flex'); b.append(h('div.card.pad.small.muted', 'اختر الأقسام التي تريدها في شريط الاختصارات بالرئيسية (حتى ١٢)، ورتّبها بالأسهم.'), box);
    function draw(){
      box.innerHTML = ''; const cur = M.shortcuts();
      box.append(h('div.section-h', 'المحددة'));
      const l = h('div.list.card');
      cur.forEach((id, i)=>{
        const mv = d=>{ const a = M.shortcuts().slice(); const j = i + d; if(j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; M.save('shortcuts', a); draw(); };
        l.append(h('div.item.static', h('span.lead', {html:M.icon(SEC[id][2])}), h('div.grow.t', SEC[id][1]),
          M.reorder(i, cur.length, mv), M.removeBtn(()=>{ M.save('shortcuts', cur.filter(x=>x !== id)); draw(); })));
      });
      box.append(l, h('div.section-h', 'إضافة'));
      const g = h('div.list.card'); M.SECTIONS.filter(s=>!cur.includes(s[0])).forEach(s=>g.append(h('button.item', {onclick:()=>{ if(cur.length >= 12) return M.toast('الحد الأقصى ١٢ اختصارًا'); M.save('shortcuts', cur.concat(s[0])); draw(); }}, h('span.lead', {html:M.icon(s[2])}), h('div.grow.t', s[1]), M.ic('plus'))));
      box.append(g, h('button.btn.tonal.block', {style:'margin-top:10px', onclick:()=>{ M.save('shortcuts', []); draw(); }}, 'استعادة الافتراضي'));
    }
    draw();
  }});
};
})();
