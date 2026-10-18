/* ===== Ideas: duas library, daily worship checklist, occasion countdown ===== */
(function(){
'use strict';
const M = window.M, h = M.h;

/* ---- duas ---- */
const CATS = [
  ['quran', 'أدعية قرآنية', 'quran'], ['karb', 'الكرب والهمّ', 'moon'], ['shifa', 'المريض والشفاء', 'sparkle'], ['yusr', 'التيسير والتوفيق', 'sunrise'],
  ['rizq', 'الرزق والبركة', 'coin'], ['thabat', 'الثبات والهداية', 'star'], ['family', 'الوالدان والذرية', 'kids'], ['daily', 'أدعية اليوم والليلة', 'clock'],
  ['nabawi', 'أدعية نبوية جامعة', 's:muhammad'], ['tawba', 'التوبة والاستغفار', 's:dua'], ['akhira', 'الجنة والنجاة من النار', 's:crescentdome'], ['ilm', 'العلم والفهم', 's:tafsir']
];
const D = [
  ['quran', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'البقرة: ٢٠١'],
  ['quran', 'رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا', 'البقرة: ٢٨٦'],
  ['quran', 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا', 'البقرة: ٢٥٠'],
  ['quran', 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ', 'إبراهيم: ٤١'],
  ['quran', 'رَبِّ زِدْنِي عِلْمًا', 'طه: ١١٤'],
  ['quran', 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ', 'إبراهيم: ٤٠'],
  ['quran', 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', 'التوبة: ١٢٩'],
  ['karb', 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', 'الأنبياء: ٨٧'],
  ['karb', 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', 'آل عمران: ١٧٣'],
  ['karb', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ', 'رواه البخاري'],
  ['karb', 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ', 'متفق عليه'],
  ['karb', 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لَا إِلَهَ إِلَّا أَنْتَ', 'رواه أبو داود'],
  ['karb', 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ', 'رواه الترمذي'],
  ['karb', 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا', 'رواه مسلم'],
  ['shifa', 'أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ', 'الأنبياء: ٨٣'],
  ['shifa', 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا', 'متفق عليه'],
  ['shifa', 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ — تُقال سبع مرات عند المريض', 'رواه أبو داود والترمذي'],
  ['shifa', 'ضَعْ يَدَكَ عَلَى الَّذِي تَأَلَّمَ مِنْ جَسَدِكَ وَقُلْ: بِسْمِ اللَّهِ (٣)، ثُمَّ قُلْ (٧): أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ', 'رواه مسلم'],
  ['yusr', 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي', 'طه: ٢٥–٢٨'],
  ['yusr', 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا', 'رواه ابن حبان'],
  ['yusr', 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', 'رواه أبو داود والنسائي'],
  ['rizq', 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ', 'القصص: ٢٤'],
  ['rizq', 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ', 'رواه الترمذي'],
  ['rizq', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا', 'رواه ابن ماجه'],
  ['thabat', 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ', 'آل عمران: ٨'],
  ['thabat', 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ', 'رواه الترمذي'],
  ['thabat', 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', 'رواه الترمذي'],
  ['family', 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', 'الإسراء: ٢٤'],
  ['family', 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا', 'الفرقان: ٧٤'],
  ['family', 'رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً إِنَّكَ سَمِيعُ الدُّعَاءِ', 'آل عمران: ٣٨'],
  ['daily', 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ — عند الخروج من المنزل', 'رواه أبو داود والترمذي'],
  ['daily', 'بِسْمِ اللَّهِ — قبل الطعام. وإن نسيت: بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ', 'رواه أبو داود والترمذي'],
  ['daily', 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ — بعد الطعام', 'رواه أبو داود والترمذي'],
  ['daily', 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ — دعاء الركوب والسفر', 'الزخرف: ١٣–١٤ ومسلم'],
  ['nabawi', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى', 'رواه مسلم'],
  ['nabawi', 'اللَّهُمَّ أَصْلِحْ لِي دِينِيَ الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ الْمَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ', 'رواه مسلم'],
  ['nabawi', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ زَوَالِ نِعْمَتِكَ، وَتَحَوُّلِ عَافِيَتِكَ، وَفُجَاءَةِ نِقْمَتِكَ، وَجَمِيعِ سَخَطِكَ', 'رواه مسلم'],
  ['nabawi', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', 'رواه أبو داود وابن ماجه'],
  ['nabawi', 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', 'رواه أبو داود والنسائي'],
  ['nabawi', 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ', 'رواه الترمذي'],
  ['nabawi', 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', 'رواه الترمذي'],
  ['nabawi', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لَا يَنْفَعُ، وَمِنْ قَلْبٍ لَا يَخْشَعُ، وَمِنْ نَفْسٍ لَا تَشْبَعُ، وَمِنْ دَعْوَةٍ لَا يُسْتَجَابُ لَهَا', 'رواه مسلم'],
  ['nabawi', 'اللَّهُمَّ آتِ نَفْسِي تَقْوَاهَا، وَزَكِّهَا أَنْتَ خَيْرُ مَنْ زَكَّاهَا، أَنْتَ وَلِيُّهَا وَمَوْلَاهَا', 'رواه مسلم'],
  ['nabawi', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ جَهْدِ الْبَلَاءِ، وَدَرَكِ الشَّقَاءِ، وَسُوءِ الْقَضَاءِ، وَشَمَاتَةِ الْأَعْدَاءِ', 'من قوله ﷺ: «تَعَوَّذُوا بِاللَّهِ مِنْ جَهْدِ الْبَلَاءِ…» — متفق عليه'],
  ['nabawi', 'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ، دِقَّهُ وَجِلَّهُ، وَأَوَّلَهُ وَآخِرَهُ، وَعَلَانِيَتَهُ وَسِرَّهُ', 'رواه مسلم'],
  ['nabawi', 'اللَّهُمَّ مُصَرِّفَ الْقُلُوبِ صَرِّفْ قُلُوبَنَا عَلَى طَاعَتِكَ', 'رواه مسلم'],
  ['tawba', 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ', 'سيد الاستغفار — رواه البخاري'],
  ['tawba', 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ', 'رواه أبو داود والترمذي'],
  ['tawba', 'أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ', 'رواه أبو داود والترمذي'],
  ['tawba', 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ', 'الأعراف: ٢٣'],
  ['tawba', 'اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا، وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ', 'متفق عليه'],
  ['akhira', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ', 'رواه أبو داود وابن ماجه'],
  ['akhira', 'رَبَّنَا اصْرِفْ عَنَّا عَذَابَ جَهَنَّمَ إِنَّ عَذَابَهَا كَانَ غَرَامًا', 'الفرقان: ٦٥'],
  ['akhira', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ', 'رواه مسلم'],
  ['akhira', 'رَبَّنَا وَآتِنَا مَا وَعَدتَّنَا عَلَىٰ رُسُلِكَ وَلَا تُخْزِنَا يَوْمَ الْقِيَامَةِ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ', 'آل عمران: ١٩٤'],
  ['akhira', 'اللَّهُمَّ حَاسِبْنِي حِسَابًا يَسِيرًا', 'رواه أحمد'],
  ['ilm', 'رَبِّ زِدْنِي عِلْمًا', 'طه: ١١٤'],
  ['ilm', 'اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي، وَعَلِّمْنِي مَا يَنْفَعُنِي، وَزِدْنِي عِلْمًا', 'رواه الترمذي وابن ماجه'],
  ['ilm', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا', 'رواه ابن ماجه'],
  ['ilm', 'رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي، يَفْقَهُوا قَوْلِي', 'طه: ٢٥–٢٨'],
  ['family', 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', 'الإسراء: ٢٤'],
  ['shifa', 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا', 'متفق عليه']
];
const favs = ()=>M.store.get('duaFav', []);
const share = t=>M.share ? M.share(t) : null;

/* the other dua screens, reached from the library (one place for duas) */
const COLLECTIONS = [['quranduas', 'أدعية من القرآن', 's:tafsir', 'من آيات القرآن الكريم'], ['jami', 'أدعية شاملة', 's:names', 'جوامع الدعاء من السنة'], ['yusr', 'أدعية التيسير', 's:dua', 'عند الهم وتعسّر الأمور'], ['sick', 'أدعية المريض', 's:heart', 'للمريض ولمن يعوده'],
  ['topics', 'أدعية حسب المواضيع', 's:list', 'مرتّبة حسب الحاجة'], ['loved', 'أذكار الأحبة', 'kids', 'للوالدين والأهل والأحبة'], ['mine', 'أدعيتي', 's:mine', 'أدعية تكتبها بنفسك'], ['ruqya2', 'الرقية الشرعية', 's:ruqya', 'آيات وأدعية الرقية']];
M.openDuas = function(opts){
  opts = opts || {};
  const view = M.openView({id:'duas', title:'مكتبة الأدعية', build:b=>{
    let cat = null, q = '', onlyFav = !!opts.fav;
    const search = h('input.field', {placeholder:'ابحث في الأدعية…', oninput:e=>{ q = e.target.value; draw(); }});
    const box = h('div.col-flex');
    b.append(search, box);
    function card(d, i){
      const key = String(D.indexOf(d)), f = favs();
      const heart = h('button.icon-btn.tonal'+(f.includes(key) ? '.on' : ''), {'aria-label':'مفضلة', onclick:()=>{ let a = favs(); a = a.includes(key) ? a.filter(x=>x !== key) : a.concat(key); M.store.set('duaFav', a); heart.classList.toggle('on', a.includes(key)); M.haptic && M.haptic(8); }}, M.ic('heart'));
      return h('div.dua-card', h('div.tx.qfont', d[1]), h('div.row-flex', h('span.src', d[2]), h('div.grow'),
        h('button.icon-btn.tonal', {'aria-label':'نسخ', onclick:()=>{ try{ navigator.clipboard.writeText(d[1]+'\n— '+d[2]); }catch(e){} M.toast('تم النسخ'); }}, M.ic('copy')),
        h('button.icon-btn.tonal', {'aria-label':'مشاركة', onclick:()=>share(d[1]+'\n— '+d[2])}, M.ic('share')), heart));
    }
    function draw(){
      box.innerHTML = '';
      const nq = M.normAr ? M.normAr(q) : q;
      if(!cat && !nq && !onlyFav){
        box.append(h('button.item', {onclick:()=>{ onlyFav = true; draw(); }}, h('span.lead', {html:M.icon('heart')}), h('div.grow', h('div.t', 'مفضلتي'), h('div.s', favs().length ? M.cnt(favs().length, 'دعاء') : 'لم تحفظ أي دعاء بعد')), M.ic('fwd')));
        const cg = h('div.dua-grid.dua-coll');
        COLLECTIONS.forEach(([id, n, ic, sub])=>{ if(!(M.SECTIONS || []).some(s=>s[0] === id)) return; cg.append(h('button.dua-cat.coll', {onclick:()=>M.sectionOpen(id)}, h('span.nf-ic', {html:M.icon(ic)}), h('div.nf-t', n), h('div.nf-s', sub))); });
        box.append(h('div.section-h', 'مجموعات الأدعية'), cg, h('div.section-h', 'الأدعية حسب الحاجة'));
        const g = h('div.dua-grid');
        CATS.forEach(([id, n, ic])=>g.append(h('button.dua-cat', {onclick:()=>{ cat = id; draw(); }}, h('span.nf-ic', {html:M.icon(ic)}), h('div.nf-t', n), h('div.nf-s', M.cnt(D.filter(d=>d[0] === id).length, 'دعاء')))));
        box.append(g, h('div.tiny.muted', {style:'margin-top:6px;line-height:1.8'}, 'الأدعية من القرآن الكريم والسنة الصحيحة مع ذكر المصدر. الدعاء عبادة؛ ادعُ بما شئت بلغتك أيضًا.'));
        return;
      }
      let list = D;
      if(onlyFav){ const f = favs(); list = D.filter((d, i)=>f.includes(String(i))); }
      else if(cat) list = D.filter(d=>d[0] === cat);
      if(nq) list = list.filter(d=>(M.normAr ? M.normAr(d[1]+' '+d[2]) : d[1]).includes(nq));
      box.append(h('button.chip', {onclick:()=>{ cat = null; onlyFav = false; q = ''; search.value = ''; draw(); }}, M.ic('back'), ' كل الأقسام'));
      if(!list.length) box.append(h('div.muted.center', {style:'padding:30px'}, 'لا توجد نتائج'));
      list.forEach((d, i)=>box.append(card(d, i)));
    }
    draw();
  }});
  return view;
};

/* ---- keep screen awake ---- */
let wl = null;
M.keepAwake = async function(on){
  try{ if(window.Android && Android.keepScreenOn) Android.keepScreenOn(!!on); }catch(e){}
  try{
    if(on && navigator.wakeLock){ wl = await navigator.wakeLock.request('screen'); }
    else if(!on && wl){ await wl.release(); wl = null; }
  }catch(e){}
};

/* ---- daily worship checklist ---- */
const CHK = [['fajr', 'صلاة الفجر في وقتها'], ['morning', 'أذكار الصباح'], ['duha', 'صلاة الضحى'], ['wird', 'ورد القرآن'], ['rawatib', 'السنن الرواتب'], ['evening', 'أذكار المساء'], ['witr', 'الوتر'], ['sleep', 'أذكار النوم']];
const chkKey = ()=>'chk:'+M.dkey();
/* the home checklist is a short view of «متابعة العبادات» (and of «سجل الصلوات» for fajr): one tick, everywhere */
const CHK_LINK = {morning:['adhkar_morning'], duha:['duha'], wird:['qira'], evening:['adhkar_evening'], witr:['witr'], sleep:['misc_sleep'], kahf:['fri_kahf'],
  rawatib:['fajr_sunnah', 'dhuhr_pre', 'dhuhr_post', 'maghrib_post', 'isha_post']};
function chkState(){
  const s = Object.assign({}, M.store.get(chkKey(), {})), dk = M.dkey(), dow = new Date().getDay();
  try{
    if(M.T) Object.keys(CHK_LINK).forEach(k=>{ const ids = CHK_LINK[k].filter(id=>!(id === 'dhuhr_pre' && dow === 5)); s[k] = ids.every(id=>M.T.get(dk, id)); });
    if(M.PL){ const f = M.PL.get(dk, 'fajr'); s.fajr = f === 'o' || f === 'j'; }
  }catch(e){}
  return s;
}
function chkToggle(k){
  const dk = M.dkey(), dow = new Date().getDay(), v = !chkState()[k];
  const x = M.store.get(chkKey(), {}); x[k] = v; M.store.set(chkKey(), x);
  try{
    if(CHK_LINK[k] && M.T) CHK_LINK[k].filter(id=>!(id === 'dhuhr_pre' && dow === 5)).forEach(id=>M.T.check(dk, id, v));
    if(k === 'fajr') M.emit('chk', 'fajr', v, dk);
  }catch(e){}
}
const CHK_UI = {day:'', shown:null, all:false};
function checklistCard(){
  const items = CHK.slice(); if(new Date().getDay() === 5) items.splice(3, 0, ['kahf', 'سورة الكهف']);
  const card = h('div.card.pad.chk-card');
  let all = CHK_UI.all;                  // compact by default: the first three things still to do (they stay on screen while being ticked,
  function draw(){                      //  also when the home screen is rebuilt because the tracker changed)
    const s = chkState(); const done = items.filter(i=>s[i[0]]).length;
    if(CHK_UI.day !== M.dkey() || !CHK_UI.shown){ CHK_UI.day = M.dkey(); CHK_UI.shown = items.filter(i=>!s[i[0]]).slice(0, 3).map(i=>i[0]); }
    const shown = CHK_UI.shown;
    const list = all ? items : items.filter(i=>shown.includes(i[0]));
    card.innerHTML = '';
    card.append(h('div.section-h.in', 'عبادات اليوم', h('span.small.muted.num', M.n(done)+'/'+M.n(items.length))), h('div.bar', {style:'margin-bottom:6px'}, h('i', {style:'width:'+(done / items.length * 100)+'%'})));
    if(!list.length) card.append(h('div.small.muted', {style:'padding:8px 2px'}, 'أتممت عبادات اليوم، تقبّل الله منك'));
    list.forEach(([k, n])=>card.append(h('button.chk-row'+(s[k] ? '.done' : ''), {'aria-pressed':String(!!s[k]), onclick:()=>{ chkToggle(k); M.haptic && M.haptic(10); draw(); }}, h('span.chk-box', {html:s[k] ? M.icon('check') : ''}), h('div.t.grow', n))));
    if(items.length > list.length || all) card.append(h('button.btn.tonal.sm.chk-more', {onclick:()=>{ all = CHK_UI.all = !all; draw(); }}, all ? 'إخفاء' : 'عرض الكل'));
  }
  draw(); return card;
}

/* ---- occasion countdown (Ramadan / Eids) ---- */
function daysTo(m, d){
  const now = new Date(); now.setHours(12, 0, 0, 0);
  for(let i = 0; i < 400; i++){ const x = M.addDays(now, i), hj = M.hijri(x); if(hj.m === m && hj.d === d) return i; }
  return null;
}
function occasionCard(){
  const items = [['رمضان', daysTo(9, 1)], ['عيد الفطر', daysTo(10, 1)], ['عيد الأضحى', daysTo(12, 10)]].filter(x=>x[1] != null);
  if(!items.length) return null;
  const nxt = nextOccasion();
  const cells = items.map(([n, d])=>h('div.occ-c', h('div.small.muted', n), h('b.num.occ-n', M.n(d)), h('div.tiny.muted', d === 0 ? 'اليوم' : d === 1 ? 'يوم' : d <= 10 ? 'أيام' : 'يومًا')));
  return h('button.card.pad.occ-card.tri', {onclick:()=>M.openCalendar && M.openCalendar()}, h('div.occ-row', ...cells), nxt && nxt.days <= 30 && !['رمضان', 'عيد الفطر', 'عيد الأضحى'].includes(nxt.name) ? h('div.small.muted', {style:'margin-top:8px;text-align:center'}, nxt.name+(nxt.days === 0 ? ' اليوم' : nxt.days === 1 ? ' غدًا' : ' بعد '+M.cnt(nxt.days, 'يوم', true))) : null);
}
const OCC = [[1, 1, 'رأس السنة الهجرية'], [1, 10, 'يوم عاشوراء'], [9, 1, 'شهر رمضان'], [10, 1, 'عيد الفطر'], [12, 9, 'يوم عرفة'], [12, 10, 'عيد الأضحى']];
function nextOccasion(){
  const now = new Date(); now.setHours(12, 0, 0, 0);
  for(let i = 0; i < 400; i++){ const d = M.addDays(now, i), hj = M.hijri(d); const o = OCC.find(x=>x[0] === hj.m && x[1] === hj.d); if(o) return {name:o[2], days:i, date:d}; }
  return null;
}

/* ---- more home cards ---- */
function dateCard(){
  const now = new Date(), hj = M.hijri(now);
  return h('div.card.pad.date-card', h('div.row-flex', h('div.grow', h('div.title-font', {style:'font-size:2.6rem;font-weight:800;line-height:1'}, M.n(hj.d)), h('div.bold', M.HMONTHS[hj.m - 1]+' '+M.n(hj.y)+' هـ'), h('div.small.muted', M.WEEKDAYS[now.getDay()]+' '+M.n(now.getDate())+' '+M.GMONTHS[now.getMonth()]+' '+M.n(now.getFullYear()))),
    h('button.icon-btn.tonal', {onclick:()=>M.share(M.WEEKDAYS[now.getDay()]+' '+M.fmtHijri(hj)+' الموافق '+M.n(now.getDate())+' '+M.GMONTHS[now.getMonth()]+' '+M.n(now.getFullYear()))}, M.ic('share'))));
}
function stateCard(){
  const now = new Date(), hj = M.hijri(now), dow = now.getDay(); let t = null, s = '', fn = null;
  if(hj.m === 9){ t = 'شهر رمضان'; s = 'اليوم '+M.n(hj.d)+' — أكثر من القرآن والدعاء'; fn = ()=>M.openRamadan(); }
  else if(dow === 5){ t = 'يوم الجمعة'; s = 'الكهف والصلاة على النبي ﷺ وساعة الإجابة'; fn = ()=>M.openFriday(); }
  else if([13, 14, 15].includes(hj.d)){ t = 'الأيام البيض'; s = 'يُستحب صيامها'; fn = ()=>M.openGuide('fast_white'); }
  else if(dow === 1 || dow === 4){ t = dow === 1 ? 'يوم الاثنين' : 'يوم الخميس'; s = 'يُستحب صيامه'; fn = ()=>M.openGuide('fast_week'); }
  else if(hj.m === 12 && hj.d === 9){ t = 'يوم عرفة'; s = 'صيامه يكفّر سنتين لغير الحاج'; fn = ()=>M.openGuide('arafa'); }
  else { t = 'ذكّر نفسك'; s = 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ'; fn = ()=>M.openTasbih(); }
  return h('button.card.pad.state-card', {onclick:fn}, h('div.small.muted', 'الحالة'), h('div.bold.title-font', t), h('div.small.muted', s));
}
function timeCard(){
  if(M.worshipCard) return M.worshipCard();
  const hr = new Date().getHours(), i = M.nextPrayer(new Date());
  let t, s, fn;
  if(hr >= 3 && hr < 11){ t = 'أذكار الصباح'; s = 'ابدأ يومك بذكر الله'; fn = ()=>M.openAdhkarCategory('morning'); }
  else if(hr >= 11 && hr < 15){ t = 'صلاة الضحى والذكر'; s = 'سبّح واستغفر'; fn = ()=>M.openTasabih(); }
  else if(hr >= 15 && hr < 20){ t = 'أذكار المساء'; s = 'اختم نهارك بذكر الله'; fn = ()=>M.openAdhkarCategory('evening'); }
  else { t = 'أذكار النوم'; s = 'قبل أن تنام'; fn = ()=>M.openAdhkarCategory('sleep'); }
  return h('button.card.pad.state-card', {onclick:fn}, h('div.small.muted', 'الوقت — '+(hr < 12 ? 'صباحًا' : 'مساءً')), h('div.bold.title-font', t), h('div.small.muted', s));
}
function audioCard(){
  const hr = new Date().getHours(), mor = hr < 14, id = mor ? 'r_morning' : 'r_evening';
  const btn = h('button.icon-btn.tonal', {onclick:()=>M.playSound(id)}, M.ic('play'));
  return h('div.card.pad.state-card', h('div.row-flex', h('div.grow', h('div.small.muted', 'أذكار سمعية'), h('div.bold.title-font', mor ? 'أذكار الصباح' : 'أذكار المساء'), h('div.small.muted', 'استمع من موضع توقفك')), btn));
}
function prayerGridCard(){
  const t = M.prayerTimes(new Date()), info = M.nextPrayer(new Date());
  const g = h('div.pgrid');
  [['fajr', 'الفجر'], ['sunrise', 'الشروق'], ['dhuhr', 'الظهر'], ['asr', 'العصر'], ['maghrib', 'المغرب'], ['isha', 'العشاء']].forEach(([k, n])=>{
    const iq = k !== 'sunrise' && M.cfg.iqamaOn !== false && (M.cfg.iqama || {})[k] ? new Date(+t[k] + M.cfg.iqama[k] * 60000) : null;
    g.append(h('div.pg-tile'+(info.next.k === k ? '.next' : ''), h('div.small.bold', n), h('div.num.pg-t', M.fmt(t[k])), iq ? h('div.tiny.muted', 'الإقامة '+M.fmt(iq)) : null));
  });
  return h('button.card.pad.pgrid-card', {onclick:()=>M.setTab('prayer')}, h('div.section-h.in', 'مواقيت الصلاة'), g);
}
function quranCard(){
  const l = M.QD.last, fresh = !l.page || (l.page <= 1 && !Object.keys(M.QD.pagesRead || {}).length);
  return h('button.card.pad.state-card', {onclick:()=>M.openReader(fresh ? {page:1} : {page:l.page, sura:l.sura, ayah:l.ayah})}, h('div.row-flex', h('div.grow', h('div.small.muted', fresh ? 'ابدأ القراءة' : 'تابع القراءة'), h('div.bold.title-font', fresh ? 'سورة الفاتحة' : 'صفحة '+M.n(l.page)), fresh ? null : h('div.small.muted', M.n(Math.round(l.page / 6.04))+'٪ من المصحف')), h('span.lead', {html:M.icon('quran')})));
}
function statsCard(){
  const days = []; let sum = 0;
  for(let i = 6; i >= 0; i--){ const d = M.addDays(new Date(), -i); const p = M.T ? M.T.dayScore(d).pct : 0; days.push(p); sum += p; }
  const today = days[6];
  return h('button.card.pad.stats-card', {onclick:()=>M.openTracker({tab:'day'})}, h('div.row-flex', h('div.grow', h('div.small.muted', 'إنجاز اليوم'), h('b.num', {style:'font-size:1.8rem'}, M.n(Math.round(today * 100))+'٪')), h('div.grow', h('div.small.muted', 'معدل آخر سبعة أيام'), h('b.num', {style:'font-size:1.8rem'}, M.n(Math.round(sum / 7 * 100))+'٪'))),
    h('div.week-bars', ...days.map(p=>h('i', {style:'height:'+Math.max(6, p * 44)+'px'}))));
}
function calStripCard(){
  const now = new Date(), start = M.addDays(now, -((now.getDay() + 1) % 7));
  const strip = h('div.cal-strip');
  for(let i = 0; i < 7; i++){ const d = M.addDays(start, i), hj = M.hijri(d); strip.append(h('div.cs-d'+(M.dkey(d) === M.dkey(now) ? '.today' : ''), h('div.tiny.muted', M.WEEKDAYS[d.getDay()].slice(0, 3)), h('b.num', M.n(d.getDate())), h('div.tiny.muted.num', M.n(hj.d)))); }
  return h('button.card.pad.cal-card', {onclick:()=>M.openCalendar && M.openCalendar()}, h('div.section-h.in', 'التقويم'), strip);
}
function counterCard(){
  const k = 'quickCount'; const n = h('b.num', {style:'font-size:2.4rem'}, M.n(M.store.get(k, 0)));
  const reset = h('button.icon-btn.tonal', {onclick:e=>{ e.stopPropagation(); M.store.set(k, 0); n.textContent = M.n(0); }}, M.ic('history'));
  return h('div.card.pad.counter-card', {onclick:()=>{ const v = M.store.get(k, 0) + 1; M.store.set(k, v); n.textContent = M.n(v); if(M.cfg.cntVib !== false) M.haptic(8); }}, h('div.row-flex', h('div.grow', h('div.small.muted', 'العدّاد — اضغط للعدّ'), n), reset));
}
function myDuasCard(){
  const a = M.store.get('myDuas2', []);
  return h('button.card.pad.state-card', {onclick:()=>M.openMyDuas()}, h('div.small.muted', 'أدعيتي'), a.length ? h('div.qfont', {style:'line-height:2'}, a[new Date().getDate() % a.length]) : h('div.small.muted', 'أضف أدعيتك لتظهر هنا'));
}
function lovedCard(){
  const a = M.store.get('loved', []);
  return h('button.card.pad.state-card', {onclick:()=>M.openLoved()}, h('div.small.muted', 'أذكار الأحبة'), h('div.bold.title-font', a.length ? 'ادعُ لـ'+a[new Date().getDate() % a.length] : 'أضف من تحب'), h('div.small.muted', 'دعاء جاهز تشاركه معهم'));
}
function trackWeekCard(){
  const strip = h('div.cal-strip');
  for(let i = 6; i >= 0; i--){ const d = M.addDays(new Date(), -i); const p = M.T ? M.T.dayScore(d).pct : 0; strip.append(h('div.cs-d', h('div.tiny.muted', M.WEEKDAYS[d.getDay()].slice(0, 3)), h('span.dot-c', {style:'--p:'+Math.round(p * 100)+'%'}))); }
  return h('button.card.pad.cal-card', {onclick:()=>M.openTracker({tab:'day'})}, h('div.section-h.in', 'متابعة العبادات'), strip);
}
function customCards(){
  return (M.cfg.customCards || []).map(c=>h('div.card.pad.state-card', h('div.small.muted', c.title), h('div.qfont', {style:'line-height:2'}, c.text)));
}
M.HOME_ORDER = [
 ['prayer', 'الصلاة القادمة', 'الصلاة القادمة والمواقيت'], ['time', 'وقت العبادة', 'أذكار وعبادات الوقت الحالي'], ['worship', 'عبادات اليوم', 'قائمة تُعلَّم'], ['quranc', 'تابع القراءة', 'آخر صفحة قرأتها'], ['quick', 'اختصاراتي', ''],
 ['progress', 'تقدّم اليوم', 'محاسبة وأذكار وورد'], ['occasion', 'المناسبات', 'رمضان والعيدان'], ['ayah', 'آية اليوم', ''],
 ['dhikr', 'ذكر اليوم', ''], ['hadith', 'حديث اليوم', ''], ['state', 'الحالة', 'مناسبة اليوم'],
 ['date', 'التاريخ', 'هجري وميلادي'], ['prayergrid', 'مواقيت الصلاة', 'بطاقات مع الإقامة'], ['audio', 'أذكار سمعية', 'استمع للأذكار'],
 ['calstrip', 'التقويم', 'شريط الأسبوع'], ['stats', 'إحصائيات المتابعة', 'اليوم وآخر ٧ أيام'],
 ['trackweek', 'متابعة الأسبوع', 'دوائر الإنجاز'], ['counter', 'العدّاد', 'عدّ سريع'], ['myduas', 'أدعيتي', ''], ['loved', 'أذكار الأحبة', ''],
 ['custom', 'بطاقاتي', 'البطاقات التي أضفتها']
];
const OFF = ['state', 'date', 'prayergrid', 'audio', 'calstrip', 'stats', 'trackweek', 'counter', 'myduas', 'loved'];
M.homeOn = k=>{ const B = M.cfg.homeBlocks || {}; return B[k] === undefined ? !OFF.includes(k) : B[k] !== false; };
const BUILD = {occasion:occasionCard, worship:checklistCard, time:timeCard, state:stateCard, date:dateCard, prayergrid:prayerGridCard, audio:audioCard, quranc:quranCard, calstrip:calStripCard, stats:statsCard, trackweek:trackWeekCard, counter:counterCard, myduas:myDuasCard, loved:lovedCard};

/* ---- home ordering ---- */
M.homeOrder = ()=>{ const o = (M.cfg.homeOrder || []).filter(k=>M.HOME_ORDER.some(x=>x[0] === k)); M.HOME_ORDER.forEach(([k])=>{ if(!o.includes(k)) o.push(k); }); return o; };
function reorder(el){
  const kids = Array.from(el.children), g = {};
  const put = (k, n)=>{ (g[k] = g[k] || []).push(n); };
  kids.forEach(n=>{
    const c = n.classList; if(c.contains('page-top')) return;
    if(n.dataset.hk) put(n.dataset.hk, n);
    else if(c.contains('home-prayer') || c.contains('ht-card')) put('prayer', n);
    else if(c.contains('prog-card')) put('progress', n);
    else if(n.dataset.hk) put(n.dataset.hk, n);
    else if(c.contains('ayah-card')) put('ayah', n);
    else if(c.contains('quick') || (c.contains('section-h') && n.textContent.trim() === 'اختصارات')) put('quick', n);
    else if(c.contains('dhikr-card')) put(n.textContent.indexOf('حديث اليوم') >= 0 ? 'hadith' : 'dhikr', n);
  });
  const anchor = el.querySelector('.page-top'); let ref = anchor;
  M.homeOrder().forEach(k=>(g[k] || []).forEach(n=>{ ref.after(n); ref = n; }));
}
M.homeOrderUI = function(box){
  box.innerHTML = '';
  const o = M.homeOrder();
  o.forEach((k, i)=>{
    const mv = d=>{ const a = M.homeOrder(); const j = i + d; if(j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; M.save('homeOrder', a); M.homeOrderUI(box); };
    box.append(h('div.item.static', h('div.grow.t', M.HOME_ORDER.find(x=>x[0] === k)[1]),
      h('button.icon-btn.tonal', {'aria-label':'أعلى', onclick:()=>mv(-1), disabled:i === 0}, h('span', {style:'display:inline-block;transform:rotate(90deg)'}, M.ic('back'))),
      h('button.icon-btn.tonal', {'aria-label':'أسفل', onclick:()=>mv(1), disabled:i === o.length - 1}, h('span', {style:'display:inline-block;transform:rotate(-90deg)'}, M.ic('back')))));
  });
};

/* ---- inject into home ---- */
const orig = M.screens.home.build;
M.screens.home.build = function(el){
  orig.call(this, el);
  // remove duplicate occasion card from the legacy builder
  el.querySelectorAll('.occ-card').forEach(n=>n.remove());
  const anchor = el.querySelector('.prog-card') || el.querySelector('.ht-card') || el.querySelector('.page-top');
  let ref = anchor;
  const add = (n, key)=>{ if(!n) return; n.dataset.hk = key; ref.after(n); ref = n; };
  Object.keys(BUILD).forEach(k=>{ if(M.homeOn(k)) add(BUILD[k](), k); });
  if(M.homeOn('custom')) customCards().forEach(n=>add(n, 'custom'));
  // hide legacy blocks turned off
  const B = M.cfg.homeBlocks || {};
  if(M.cfg.homeSun){ const hc = el.querySelector('.ht-card'); if(hc){ const t = M.prayerTimes(new Date()); hc.append(h('div.home-times.ht-extra', ...[['sunrise', 'الشروق', t.sunrise], ['midnight', 'منتصف الليل', t.midnight], ['lastThird', 'الثلث الأخير', t.lastThird]].map(([k, n, d])=>h('div.ht', h('div.tiny.muted', n), h('div.small.bold.num', M.fmt(d)))))); } }
  reorder(el);
};

/* ---- تيجان الذكر السبعة: a popular name for seven well-known adhkar; the texts themselves are from the Quran and the authentic Sunnah ---- */
M.TIJAN = [
  ['تاج التسبيح', 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ', 'رواه مسلم', 3, 'قالها النبي ﷺ ثلاث مرات فوزنت ما قالته أم المؤمنين جويرية منذ الصباح.'],
  ['تاج راحة البال', 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', 'متفق عليه', 10, 'كنز من كنوز الجنة.'],
  ['تاج التحصين', 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', 'رواه أبو داود والترمذي', 3, 'من قالها ثلاثًا صباحًا ومساءً لم يضرّه شيء.'],
  ['تاج الاستغفار', 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ', 'سيد الاستغفار — رواه البخاري', 1, 'من قالها موقنًا بها نهارًا فمات من يومه، أو ليلًا فمات قبل أن يصبح، فهو من أهل الجنة.'],
  ['تاج الدعاء', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'البقرة: ٢٠١', 3, 'كان أكثر دعاء النبي ﷺ. (متفق عليه)'],
  ['تاج تفريج الكرب', 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', 'دعاء يونس عليه السلام — الأنبياء: ٨٧', 3, 'لم يدعُ بها مسلم في شيء قط إلا استجاب الله له. (رواه الترمذي)'],
  ['تاج التهليل', 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', 'متفق عليه', 100, 'من قالها مئة مرة في يوم كانت له عدل عشر رقاب، وكُتبت له مئة حسنة، ومُحيت عنه مئة سيئة، وكانت له حرزًا من الشيطان يومه ذلك.']
];
M.openTijan = function(){
  const key = 'tijan:'+M.dkey(new Date()), done = M.store.get(key, {}) || {};
  M.openView({title:'تيجان الذكر السبعة', id:'tijan', build:b=>{
    b.append(h('div.small.muted', {style:'line-height:1.9;margin:0 4px 12px'}, 'سبعة أذكار عظيمة الأجر تُعرف بين الناس بـ«تيجان الذكر». التسمية متداولة وليست اصطلاحًا شرعيًا، أما الأذكار نفسها فثابتة في القرآن والسنة.'));
    M.TIJAN.forEach(([name, text, src, n, fadl], i)=>{
      let c = Math.min(n, done[i] || 0);
      const cnt = h('b.num', M.n(c)+' / '+M.n(n));
      const btn = h('button.tj-btn'+(c >= n ? '.ok' : ''), {'aria-label':'عدّ', onclick:()=>{
        if(c >= n){ c = 0; } else { c++; M.haptic && M.haptic(c >= n ? [20, 40, 20] : 8); }
        done[i] = c; M.store.set(key, done); cnt.textContent = M.n(c)+' / '+M.n(n); btn.classList.toggle('ok', c >= n); card.classList.toggle('done', c >= n);
      }}, cnt, h('small', 'اضغط للعدّ'));
      const card = h('article.card.pad.tj'+(c >= n ? '.done' : ''),
        h('div.tj-h', h('span.tj-n', M.n(i + 1)), h('b.title-font.grow', name), h('button.icon-btn', {'aria-label':'نسخ', onclick:()=>M.copy(text+'\n('+src+')')}, M.ic('copy')), h('button.icon-btn', {'aria-label':'مشاركة', onclick:()=>M.share(name+'\n'+text+'\n('+src+')')}, M.ic('share'))),
        h('div.tj-t.qfont', text), h('div.small.muted', src), h('div.tj-f', fadl), btn);
      b.append(card);
    });
  }});
};
})();
