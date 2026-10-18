/* ===== v2 ruqya2: expanded sharia ruqya — ayat & duas with sources, guidance, playlist player ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const SUNNA = 'ثابت في السنة', ULAMA = 'مما ذكره أهل العلم';
/* ayat: [id, title, sura, from, to, grade, note] — texts come from the Quran data by reference */
const AYAT = [
 ['fatiha', 'سورة الفاتحة', 1, 1, 7, SUNNA, 'رقى بها الصحابي لدغة سيد الحي فبرأ، وأقرّه النبي ﷺ وقال: «وَمَا أَدْرَاكَ أَنَّهَا رُقْيَةٌ؟» — متفق عليه (البخاري ٥٠٠٧، مسلم ٢٢٠١).'],
 ['baqara1', 'أول سورة البقرة', 2, 1, 5, ULAMA, 'ثبت أن الشيطان ينفر من البيت الذي تُقرأ فيه سورة البقرة — رواه مسلم (٧٨٠). وذكر أهل العلم قراءة أولها في الرقية.'],
 ['kursi', 'آية الكرسي', 2, 255, 255, SUNNA, 'من قرأها إذا أوى إلى فراشه لم يزل عليه من الله حافظ ولا يقربه شيطان حتى يصبح — رواه البخاري (٢٣١١).'],
 ['khawatim', 'خواتيم سورة البقرة', 2, 285, 286, SUNNA, '«مَنْ قَرَأَ بِالْآيَتَيْنِ مِنْ آخِرِ سُورَةِ الْبَقَرَةِ فِي لَيْلَةٍ كَفَتَاهُ» — متفق عليه (البخاري ٥٠٠٩، مسلم ٨٠٧).'],
 ['ikhlas', 'سورة الإخلاص', 112, 1, 4, SUNNA, 'كان النبي ﷺ إذا أوى إلى فراشه نفث في كفيه وقرأ الإخلاص والمعوذتين ثم مسح بهما جسده — رواه البخاري (٥٠١٧).'],
 ['falaq', 'سورة الفلق', 113, 1, 5, SUNNA, 'من المعوذات التي كان يرقي بها النبي ﷺ نفسه — رواه البخاري (٥٧٣٥)، ومسلم (٢١٩٢).'],
 ['nas', 'سورة الناس', 114, 1, 6, SUNNA, 'من المعوذات التي كان يرقي بها النبي ﷺ نفسه — رواه البخاري (٥٧٣٥)، ومسلم (٢١٩٢).'],
 ['araf', 'من سورة الأعراف', 7, 117, 122, ULAMA, 'ذكرها كثير من أهل العلم في الرقية من السحر (كابن القيم وابن كثير)، وليس فيها حديث مرفوع بتخصيصها.'],
 ['yunus', 'من سورة يونس', 10, 81, 82, ULAMA, 'ذكرها أهل العلم في الرقية من السحر، ولا يثبت فيها حديث مرفوع بتخصيصها.'],
 ['taha', 'من سورة طه', 20, 69, 69, ULAMA, 'ذكرها أهل العلم مع آيات إبطال السحر، ولا يثبت فيها حديث مرفوع بتخصيصها.'],
 ['isra', 'آية الشفاء من سورة الإسراء', 17, 82, 82, ULAMA, 'القرآن شفاء ورحمة للمؤمنين، وهي من آيات الاستشفاء التي يذكرها العلماء (ومنها يونس ٥٧، فصلت ٤٤).'],
 ['ayyub', 'دعاء أيوب عليه السلام', 21, 83, 84, ULAMA, 'دعاء نبي الله أيوب في مرضه، وقد ذكره العلماء في الدعاء بالشفاء.']
];
/* duas: [title, text, source, grading note] — written from memory, sources named */
const DUAS = [
 ['رقية جبريل للنبي ﷺ', 'بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ', 'رواه مسلم (٢١٨٦)', ''],
 ['دعاء النبي ﷺ للمريض', 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا', 'متفق عليه (البخاري ٥٧٤٣، مسلم ٢١٩١)', ''],
 ['رقية الألم بوضع اليد', 'يضع يده على موضع الألم من جسده ويقول: «بِسْمِ اللَّهِ» ثلاثًا، ثم يقول سبع مرات: «أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ»', 'رواه مسلم (٢٢٠٢)', ''],
 ['عيادة المريض', 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ — سبع مرات', 'رواه أبو داود والترمذي وصححه الألباني', 'لمن لم يحضر أجله'],
 ['رقية أخرى ثابتة', 'بِاسْمِ اللَّهِ يُبْرِيكَ، وَمِنْ كُلِّ دَاءٍ يَشْفِيكَ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ، وَمِنْ شَرِّ كُلِّ ذِي عَيْنٍ', 'رواه مسلم (٢١٨٥)', ''],
 ['التعوّذ من شر ما خلق', 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', 'رواه مسلم (٢٧٠٨)', 'لمن نزل منزلًا فلم يضرّه شيء حتى يرتحل'],
 ['تعويذ الأبناء', 'أُعِيذُكُمَا بِكَلِمَاتِ اللَّهِ التَّامَّةِ، مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ', 'رواه البخاري (٣٣٧١)', 'كان النبي ﷺ يعوّذ بها الحسن والحسين'],
 ['حفظ من الضرر', 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ — ثلاث مرات صباحًا ومساءً', 'رواه أبو داود والترمذي وصححه الألباني', ''],
 ['عند الفزع والأرق', 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ غَضَبِهِ وَعِقَابِهِ، وَشَرِّ عِبَادِهِ، وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ', 'رواه أبو داود والترمذي وحسّنه الألباني', ''],
 ['كفاية المعوذات', 'قراءة سورة الإخلاص والمعوذتين ثلاث مرات حين يصبح وحين يمسي تكفيه من كل شيء', 'رواه أبو داود والترمذي وحسّنه الألباني', 'ورد في الحديث: «تَكْفِيكَ مِنْ كُلِّ شَيْءٍ»']
];
const GUIDE = [
 ['ما الرقية الشرعية؟', ['الرقية قراءة القرآن والأدعية الثابتة في السنة طلبًا للشفاء بإذن الله، وهي سبب من الأسباب؛ والشافي هو الله وحده: ﴿وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ﴾ (الشعراء: ٨٠).', 'قال النبي ﷺ: «اعْرِضُوا عَلَيَّ رُقَاكُمْ، لَا بَأْسَ بِالرُّقَى مَا لَمْ يَكُنْ فِيهِ شِرْكٌ» — رواه مسلم (٢٢٠٠).']],
 ['ضوابط الرقية', ['ذكر العلماء (منهم ابن حجر في «فتح الباري») أن الرقية جائزة بثلاثة ضوابط: أن تكون بكلام الله أو بأسمائه وصفاته أو بالمأثور من الدعاء، وأن تكون بلسان يُفهم معناه، وأن يعتقد الراقي والمرقي أن الرقية لا تنفع بذاتها وإنما بتقدير الله.', 'يقرأ المسلم على نفسه فيرجو الله ويتوكل عليه، ولا يشترط في ذلك راقٍ خاص ولا ثمن ولا طقوس.']],
 ['التداوي بالأسباب المباحة', ['لا تعارض بين الرقية والعلاج الطبي، بل يُجمع بينهما: قال النبي ﷺ: «مَا أَنْزَلَ اللَّهُ دَاءً إِلَّا أَنْزَلَ لَهُ شِفَاءً» — رواه البخاري (٥٦٧٨)، وقال: «تَدَاوَوْا عِبَادَ اللَّهِ» — رواه أبو داود والترمذي وصححه الألباني.', 'أكثر الأمراض البدنية والنفسية (كالقلق والاكتئاب والصرع واضطرابات النوم) لها أسباب طبية تُعالج عند المختصين، فلا يُنسب كل ألم أو ضيق إلى عين أو سحر أو مسّ.', 'إن استمرت الأعراض أو اشتدت فراجع الطبيب دون تأخير، وإن خطرت لك أفكار إيذاء النفس فاطلب المساعدة الطبية العاجلة وتحدّث مع من تثق به.']],
 ['ما ينبغي الحذر منه', ['إتيان السحرة والعرّافين وتصديقهم: قال النبي ﷺ: «مَنْ أَتَى عَرَّافًا فَسَأَلَهُ عَنْ شَيْءٍ لَمْ تُقْبَلْ لَهُ صَلَاةٌ أَرْبَعِينَ لَيْلَةً» — رواه مسلم (٢٢٣٠).', 'التمائم والخيوط والأحجبة: قال النبي ﷺ: «مَنْ عَلَّقَ تَمِيمَةً فَقَدْ أَشْرَكَ» — رواه أحمد وصححه الألباني.', 'ادعاء معرفة الغيب أو تحديد «من سحرك» أو «من حسدك»، وطلب الأموال الطائلة، والضرب والإيذاء، والخلوة بالنساء؛ فكل ذلك مخالف للشرع ولا أصل له في الرقية الشرعية.']],
 ['الوقاية اليومية', ['المحافظة على الصلوات، وأذكار الصباح والمساء والنوم، وقراءة آية الكرسي قبل النوم، والمعوذات ثلاثًا صباحًا ومساءً، وقراءة سورة البقرة في البيت.', 'التوكل على الله، وإحسان الظن به، والصدقة، والاستغفار، والدعاء، فهي من أعظم أسباب الحفظ والطمأنينة.']],
 ['للمريض ولأهله', ['الصبر والاحتساب: قال النبي ﷺ: «مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلَا وَصَبٍ… إِلَّا كَفَّرَ اللَّهُ بِهَا مِنْ خَطَايَاهُ» — متفق عليه (البخاري ٥٦٤١، مسلم ٢٥٧٣).', 'يُستحب للمريض أن يرقي نفسه وأن يدعو بدعاء أيوب عليه السلام، وأن يأخذ بأسباب العلاج مع حسن الظن بالله.']]
];
const toAr = n=>M.n(n);

function ayahsText(s, a, b){ const out = []; for(let i = a; i <= b; i++) out.push(M.ayahText(s, i) + (b > a ? ' ۝' + toAr(i) : '')); return out.join(' '); }
function refLbl(s, a, b){ return M.sname(s) + (a === b ? ' ' + toAr(a) : ' ' + toAr(a) + '–' + toAr(b)); }

M.openRuqya2 = function(){
  const S = {tab:'ayat'}; let ready = false, loadErr = false, off = null, view = null;
  const content = h('div.rq-content'), tabs = h('div.chips.rq-tabs');
  const TABS = [['ayat', 'آيات الرقية', 'quran'], ['duas', 'أدعية وأذكار', 'heart'], ['guide', 'إرشادات', 'info'], ['play', 'قائمة التشغيل', 'volume']];
  function drawTabs(){ tabs.replaceChildren(...TABS.map(([k, l, ic])=>h('button.chip'+(S.tab === k ? '.on' : ''), {onclick:()=>{ S.tab = k; paint(); }}, M.ic(ic), l))); }
  function paint(){
    drawTabs(); content.replaceChildren();
    if(S.tab === 'guide'){ tGuide(content); return; }
    if(S.tab === 'duas'){ tDuas(content); return; }
    if(!ready){ content.append(h('div.card.pad.center', loadErr ? h('div', 'تعذّر تحميل المصحف.', h('br'), h('button.btn.tonal.sm', {onclick:init}, M.ic('refresh'), 'إعادة المحاولة')) : 'جارٍ التحميل…')); return; }
    (S.tab === 'ayat' ? tAyat : tPlay)(content);
  }
  const note = h('div.card.pad.rq-note', h('div.row-flex', M.ic('shield'), h('b', 'الشفاء بيد الله')), h('div.small', 'الرقية دعاء وقراءة للقرآن وهي سبب، ولا تُغني عن مراجعة الطبيب عند المرض؛ فاجمع بين الرقية والعلاج.'));
  view = M.openView({id:'ruqya2', title:'الرقية الشرعية الموسّعة', onClose:()=>{ if(off) off(); if(queue.active){ queue.active = false; try{ if(M.player && M.player.range) M.player.stop(); }catch(e){} } }, build:b=>{ b.append(note, tabs, content); }});
  function init(){ loadErr = false; paint(); M.loadQuran().then(()=>{ ready = true; if(!view.closed) paint(); }).catch(()=>{ loadErr = true; if(!view.closed) paint(); }); }

  const gradeBadge = g=>h('span.rq-badge' + (g === SUNNA ? '.s' : '.u'), g);
  const actions = (text, src)=>h('div.row-flex.gap-s.rq-acts', h('button.btn.tonal.sm', {onclick:()=>M.copy(text + '\n' + src)}, M.ic('copy'), 'نسخ'), h('button.btn.tonal.sm', {onclick:()=>M.share(text + '\n— ' + src)}, M.ic('share'), 'مشاركة'));

  /* ---- ayat ---- */
  function tAyat(el){
    AYAT.forEach(([id, title, s, a, b, g, nt], i)=>{
      const text = '﴿ ' + ayahsText(s, a, b) + ' ﴾', ref = 'سورة ' + refLbl(s, a, b);
      el.append(h('details.card.rq-det', i === 0 ? {open:true} : null,
        h('summary', h('div.grow', h('div.t.bold', title), h('div.s.small.muted', ref)), gradeBadge(g), M.ic('chevDown')),
        h('div.rq-body', h('div.qfont.rq-ayah', {dir:'rtl'}, text), h('div.small.rq-src', nt),
          h('div.row-flex.gap-s.rq-acts', h('button.btn.sm', {onclick:()=>M.player.playRange(s, a, b, 1, 1)}, M.ic('play'), 'استمع'), h('button.btn.tonal.sm', {onclick:()=>M.openReader({sura:s, ayah:a})}, M.ic('quran'), 'المصحف'),
            h('button.btn.tonal.sm', {onclick:()=>M.copy(text + '\n' + ref)}, M.ic('copy'), 'نسخ'), h('button.btn.tonal.sm', {onclick:()=>M.share(text + '\n— ' + ref)}, M.ic('share'), 'مشاركة')))));
    });
    el.append(h('div.tiny.muted.rq-foot', 'التصنيف: «ثابت في السنة» أي ورد في الحديث ما يدل على الرقية أو الحفظ بها، و«مما ذكره أهل العلم» أي مما درج عليه العلماء في الرقية دون حديث مرفوع بتخصيصه.'));
  }
  /* ---- duas ---- */
  function tDuas(el){
    DUAS.forEach(([title, text, src, nt])=>el.append(h('div.card.pad.rq-dua', h('div.bold', title), h('div.qfont.rq-ayah', {dir:'rtl'}, '«' + text + '»'), nt ? h('div.small.muted', nt) : null, h('div.small.rq-src', src), actions(text, src))));
    el.append(h('div.tiny.muted.rq-foot', 'نصوص الأحاديث مكتوبة بالمعنى المشهور والمراجعة مطلوبة؛ للتحقق راجع الصحيحين وسنن أبي داود والترمذي.'));
    if(M.sectionOpen) el.append(h('div.row-flex.gap-s', h('button.btn.tonal.sm.grow', {onclick:()=>M.sectionOpen('sunna_ruqya')}, M.ic('shield'), 'الرقية بالسنة'), h('button.btn.tonal.sm.grow', {onclick:()=>M.sectionOpen('quran_ruqya')}, M.ic('quran'), 'الرقية بالقرآن')));
  }
  /* ---- guidance ---- */
  function tGuide(el){
    GUIDE.forEach(([t, ps], i)=>el.append(h('details.card.rq-det', i === 0 ? {open:true} : null, h('summary', h('div.grow.bold', t), M.ic('chevDown')), h('div.rq-body', ...ps.map(p=>h('p.rq-p', p))))));
  }

  /* ---- playlist ---- */
  const queue = {active:false, i:0, each:1, loop:false, busy:false};
  const TRACKS = AYAT.filter(x=>x[0] !== 'ayyub');
  function playTrack(i){
    if(i < 0 || i >= TRACKS.length){ if(queue.loop && i >= TRACKS.length) i = 0; else { stopQ(); return; } }
    queue.i = i; queue.active = true; queue.busy = true; const [, , s, a, b] = TRACKS[i];
    M.player.playRange(s, a, b, queue.each, 1); setTimeout(()=>{ queue.busy = false; }, 600); mark();
  }
  function stopQ(){ queue.active = false; try{ if(M.player.range) M.player.stop(); }catch(e){} mark(); }
  let rows = [], nowEl = null, ppBtn = null;
  function mark(){
    rows.forEach((r, i)=>r.classList.toggle('on', queue.active && i === queue.i));
    if(ppBtn){ const P = M.player, run = queue.active && P.playing; ppBtn.replaceChildren(M.ic(run ? 'pause' : 'play')); ppBtn.setAttribute('aria-label', run ? 'إيقاف مؤقت' : 'تشغيل'); }
    if(nowEl) nowEl.textContent = queue.active ? 'الآن: ' + TRACKS[queue.i][1] + ' (' + toAr(queue.i + 1) + '/' + toAr(TRACKS.length) + ')' : 'اضغط تشغيل لسماع قائمة الرقية متتابعة';
  }
  function tPlay(el){
    rows = [];
    if(off) off();
    off = M.on('player', P=>{
      if(!queue.active || !el.isConnected) { return; }
      if(!P.s && !P.playing && !queue.busy){   // the range ended on its own -> next track; a manual stop leaves the audio element mid-way
        if(P.a.ended) playTrack(queue.i + 1); else { queue.active = false; mark(); }
      } else mark();
    });
    ppBtn = h('button.icon-btn.rq-pp', {onclick:()=>{ const P = M.player; if(!queue.active) playTrack(queue.i); else P.toggle(); setTimeout(mark, 80); }}, M.ic('play'));
    nowEl = h('div.small.center.muted.rq-now');
    el.append(h('div.card.pad.col-flex.rq-player', {style:'gap:10px'},
      h('div.row-flex.rq-ctl', h('button.icon-btn', {'aria-label':'السابق', onclick:()=>playTrack(Math.max(0, queue.i - 1))}, M.ic('prev')), ppBtn, h('button.icon-btn', {'aria-label':'التالي', onclick:()=>playTrack(queue.i + 1)}, M.ic('next')), h('button.icon-btn', {'aria-label':'إيقاف', onclick:()=>stopQ()}, M.ic('stop'))),
      nowEl, h('div.small.muted', 'تكرار كل مقطع'), M.chips([['1', M.n(1)], ['3', M.n(3)], ['7', M.n(7)]], String(queue.each), v=>{ queue.each = +v; }),
      h('div.row-flex.rq-between', h('span', 'إعادة القائمة عند نهايتها'), M.switchEl(queue.loop, v=>{ queue.loop = v; }))));
    const l = h('div.list.card');
    TRACKS.forEach(([id, title, s, a, b], i)=>{ const r = h('button.item.rq-tr', {onclick:()=>playTrack(i)}, h('span.rq-n.num', M.n(i + 1)), h('div.grow', h('div.t', title), h('div.s', 'سورة ' + refLbl(s, a, b))), M.ic('play')); rows.push(r); l.append(r); });
    el.append(l, h('div.card.pad.small.muted', {style:'line-height:1.9'}, 'يُستعمل القارئ المختار في الإعدادات، ويلزم اتصال بالإنترنت ما لم تكن التلاوة محمّلة. الاستماع وحده لا يغني عن التلاوة والدعاء بتدبّر.'));
    mark();
  }
  init();
  return view;
};
M.addSection({id:'ruqya2', title:'الرقية الشرعية الموسّعة', icon:'s:ruqya', group:'الأذكار والأدعية', fn:()=>M.openRuqya2()});
})();
