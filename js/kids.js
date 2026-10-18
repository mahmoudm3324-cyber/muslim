/* ===== Kids corner: activity tiles, one-step-at-a-time lessons, stories, adhkar to memorise, short surahs, daily star chart, quiz ===== */
(function(){
const M = window.M, h = M.h;
/* extra quiz questions for children: [question, correct, wrong, wrong] */
const MORE_Q = [
  ['كم ركعة في صلاة الفجر؟', 'ركعتان', 'ثلاث ركعات', 'أربع ركعات'], ['كم ركعة في صلاة المغرب؟', 'ثلاث ركعات', 'ركعتان', 'أربع ركعات'], ['كم ركعة في صلاة الظهر؟', 'أربع ركعات', 'ركعتان', 'ثلاث ركعات'],
  ['ما أول سورة في المصحف؟', 'الفاتحة', 'البقرة', 'الناس'], ['ما آخر سورة في المصحف؟', 'الناس', 'الفلق', 'الإخلاص'], ['ما أطول سورة في القرآن؟', 'البقرة', 'آل عمران', 'النساء'],
  ['ما أقصر سورة في القرآن؟', 'الكوثر', 'الإخلاص', 'الفاتحة'], ['كم عدد أجزاء القرآن الكريم؟', 'ثلاثون جزءًا', 'عشرون جزءًا', 'أربعون جزءًا'], ['كم عدد سور القرآن الكريم؟', '١١٤ سورة', '١٠٠ سورة', '١٢٠ سورة'],
  ['في أي شهر نصوم؟', 'رمضان', 'شعبان', 'شوال'], ['ما العيد الذي يأتي بعد رمضان؟', 'عيد الفطر', 'عيد الأضحى', 'يوم عرفة'], ['في أي يوم نصلي صلاة الجمعة؟', 'يوم الجمعة', 'يوم السبت', 'يوم الأحد'],
  ['أين وُلد النبي ﷺ؟', 'مكة المكرمة', 'المدينة المنورة', 'القدس'], ['إلى أي مدينة هاجر النبي ﷺ؟', 'المدينة المنورة', 'الطائف', 'القدس'], ['ما اسم أم النبي ﷺ؟', 'آمنة بنت وهب', 'خديجة بنت خويلد', 'فاطمة الزهراء'],
  ['ما اسم والد النبي ﷺ؟', 'عبد الله', 'أبو طالب', 'عبد المطلب'], ['مَن أول الخلفاء الراشدين؟', 'أبو بكر الصديق', 'عمر بن الخطاب', 'علي بن أبي طالب'], ['مَن الصحابي الملقَّب بالفاروق؟', 'عمر بن الخطاب', 'أبو بكر الصديق', 'عثمان بن عفان'],
  ['مَن مؤذّن رسول الله ﷺ؟', 'بلال بن رباح', 'خالد بن الوليد', 'عمر بن الخطاب'], ['كم عدد أركان الإسلام؟', 'خمسة', 'ثلاثة', 'سبعة'], ['كم عدد أركان الإيمان؟', 'ستة', 'خمسة', 'أربعة'],
  ['ماذا نقول إذا عطسنا؟', 'الحمد لله', 'سبحان الله', 'الله أكبر'], ['ماذا نقول لمن عطس فحمد الله؟', 'يرحمك الله', 'شكرًا لك', 'مع السلامة'], ['ما تحية الإسلام؟', 'السلام عليكم ورحمة الله وبركاته', 'صباح الخير', 'مرحبًا'],
  ['بأي يد نأكل ونشرب؟', 'اليد اليمنى', 'اليد اليسرى', 'لا فرق'], ['ماذا نقول بعد الانتهاء من الطعام؟', 'الحمد لله', 'بسم الله', 'الله أكبر'], ['ماذا نقول في السجود؟', 'سبحان ربي الأعلى', 'سبحان ربي العظيم', 'سمع الله لمن حمده'],
  ['مَن النبي الذي صنع السفينة؟', 'نوح عليه السلام', 'موسى عليه السلام', 'إبراهيم عليه السلام'], ['مَن النبي الذي ابتلعه الحوت؟', 'يونس عليه السلام', 'يوسف عليه السلام', 'عيسى عليه السلام'], ['مَن النبي الملقَّب بكليم الله؟', 'موسى عليه السلام', 'نوح عليه السلام', 'آدم عليه السلام'],
  ['مَن أول إنسان خلقه الله؟', 'آدم عليه السلام', 'نوح عليه السلام', 'إبراهيم عليه السلام'], ['مَن الملَك الذي نزل بالوحي على الأنبياء؟', 'جبريل عليه السلام', 'ميكائيل عليه السلام', 'إسرافيل عليه السلام'], ['ما الكتاب الذي أُنزل على نبينا محمد ﷺ؟', 'القرآن الكريم', 'التوراة', 'الإنجيل'],
  ['ما اسم البيت الذي يطوف حوله المسلمون في مكة؟', 'الكعبة المشرفة', 'المسجد النبوي', 'المسجد الأقصى'], ['كم شوطًا نطوف حول الكعبة؟', 'سبعة أشواط', 'ثلاثة أشواط', 'عشرة أشواط'], ['ما اسم الماء المبارك في مكة؟', 'ماء زمزم', 'ماء النيل', 'ماء المطر'],
  ['ما الصلاة التي نصليها بعد غروب الشمس مباشرة؟', 'المغرب', 'العصر', 'الفجر'], ['ما الصلاة التي نصليها قبل شروق الشمس؟', 'الفجر', 'الظهر', 'العشاء'], ['ما القبلة الأولى للمسلمين؟', 'المسجد الأقصى', 'الكعبة المشرفة', 'المسجد النبوي'],
  ['مَن أحقّ الناس بحسن صحبتك؟', 'أمك', 'صديقك', 'جارك'], ['ماذا نفعل إذا أخطأنا في حق أحد؟', 'نعتذر ونستغفر الله', 'نسكت ولا نهتم', 'نضحك عليه'], ['المسلم إذا وعد…', 'وفى بوعده', 'نسي وعده', 'أخلف وعده']];
const OLD_Q = [['ماذا نقول قبل الأكل؟', 'بسم الله', 'الحمد لله', 'سبحان الله'], ['ماذا نقول عند الركوع؟', 'سبحان ربي العظيم', 'سبحان ربي الأعلى', 'الله أكبر'], ['كم مرة يُسنّ غسل اليدين في الوضوء؟', 'ثلاث مرات', 'مرة واحدة', 'عشر مرات'],
  ['إلى أين نتجه عند الصلاة؟', 'الكعبة المشرفة', 'جهة الشمال', 'جهة الشرق'], ['أي الأنبياء نجّاه الله من النار فصارت بردًا وسلامًا؟', 'إبراهيم عليه السلام', 'يونس عليه السلام', 'نوح عليه السلام'], ['ماذا نقول عند الاستيقاظ؟', 'الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور', 'بسم الله', 'لا شيء']];
const SURAHS = [[1, 'الفاتحة'], [112, 'الإخلاص'], [113, 'الفلق'], [114, 'الناس'], [108, 'الكوثر'], [103, 'العصر'], [110, 'النصر'], [111, 'المسد'], [106, 'قريش'], [105, 'الفيل'], [109, 'الكافرون'], [107, 'الماعون']];
const DAILY = [['salah', 'صلّيت صلواتي'], ['quran', 'قرأت شيئًا من القرآن'], ['adhkar', 'قلت أذكاري'], ['parents', 'ساعدت أمي وأبي'], ['truth', 'قلت الصدق'], ['kind', 'عاملت الناس بلطف']];
const LEVELS = [[0, 'مبتدئ نشيط'], [20, 'نجم صغير'], [60, 'صديق المسجد'], [120, 'حافظ الأذكار'], [200, 'بطل الخير'], [350, 'نجم النجوم']];
const shuffle = a=>{ a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

M.openKids = function(){
  const S = {page:'home'}, content = h('div.kd');
  const stars = ()=>M.store.get('kidStars', 0);
  const starEl = h('span.badge.gold.kd-stars', '★ '+M.n(stars()));
  const addStar = n=>{ if(n <= 0) return; M.store.set('kidStars', stars() + n); starEl.textContent = '★ '+M.n(stars()); { const b = content.querySelector('.kd-big b'); if(b) b.textContent = M.n(stars()); } starEl.classList.remove('pop'); void starEl.offsetWidth; starEl.classList.add('pop'); };
  const once = (k, n)=>{ const d = M.store.get('kidOnce', {}), key = M.dkey()+':'+k; if(d[key]) return false; const keep = {}; Object.keys(d).filter(x=>x.startsWith(M.dkey())).forEach(x=>keep[x] = 1); keep[key] = 1; M.store.set('kidOnce', keep); addStar(n); return true; };
  const view = M.openView({title:'ركن الأطفال', id:'kids', actions:[starEl], build:b=>{ b.append(content); }});
  view.onBack = ()=>{ if(S.page !== 'home'){ go('home'); return true; } return false; };
  const go = p=>{ S.page = p; paint(); try{ content.closest('.view-body').scrollTop = 0; }catch(e){} };
  const back = t=>h('div.kd-top', h('button.chip', {onclick:()=>go('home')}, M.ic('back'), 'الركن'), h('div.bold.title-font.grow', t));
  const TILES = [['wudu', 'أتعلّم الوضوء', 'خطوة خطوة', 's:crescent', 1], ['salah', 'أتعلّم الصلاة', 'من التكبير إلى السلام', 's:rug', 2], ['quiz', 'المسابقة', 'أسئلة ونجوم', 's:rosette', 3],
    ['stories', 'قصص الأنبياء', 'حكايات وعِبَر', 's:lantern', 4], ['adhkar', 'أذكاري', 'أحفظها وأقولها', 's:beads', 5], ['surahs', 'سور قصيرة', 'أقرأ وأستمع', 's:mushaf', 6]];

  function paint(){ content.replaceChildren(); ({home, wudu:()=>lesson('wudu', 'أتعلّم الوضوء'), salah:()=>lesson('salah', 'أتعلّم الصلاة'), quiz, stories, adhkar, surahs})[S.page](); }

  function home(){
    const st = stars(), li = LEVELS.filter(l=>st >= l[0]).length - 1, nxt = LEVELS[li + 1];
    const done = M.store.get('kidDay', {}), today = done.k === M.dkey() ? done.v : {};
    const list = h('div.kd-daily');
    DAILY.forEach(([k, l])=>list.append(h('button.kd-chk'+(today[k] ? '.on' : ''), {'aria-pressed':!!today[k], onclick:function(){ const on = !today[k]; if(on) today[k] = 1; else delete today[k]; M.store.set('kidDay', {k:M.dkey(), v:today}); this.classList.toggle('on', on); this.setAttribute('aria-pressed', on); M.haptic && M.haptic(20);
      if(on){ addStar(1); M.toast('أحسنت! نجمة لك ★'); } else { M.store.set('kidStars', Math.max(0, stars() - 1)); starEl.textContent = '★ '+M.n(stars()); const b = content.querySelector('.kd-big b'); if(b) b.textContent = M.n(stars()); } }}, h('span.kd-star', '★'), h('span', l))));
    content.append(
      h('div.card.accent.kd-hero', h('div.kd-hero-t', h('div', h('div.small', 'مرحبًا يا بطل'), h('div.title-font.bold.kd-lvl', LEVELS[li][1])), h('div.kd-big', h('b.num', M.n(st)), h('small', 'نجمة'))),
        h('div.bar.kd-bar', h('i', {style:'width:'+(nxt ? Math.min(100, (st - LEVELS[li][0]) / (nxt[0] - LEVELS[li][0]) * 100) : 100)+'%'})),
        h('div.tiny', nxt ? 'بقي '+M.n(nxt[0] - st)+' نجمة لتصير «'+nxt[1]+'»' : 'وصلت إلى أعلى مستوى، ما شاء الله!')),
      h('div.kd-grid', ...TILES.map(([p, t, s, ic, c])=>h('button.kd-tile.c'+c, {onclick:()=>go(p)}, h('span.kd-ic', {html:M.icon(ic)}), h('b', t), h('small', s)))),
      h('div.section-h', 'نجوم اليوم — اضغط ما فعلته'), list);
  }
  /* one step at a time */
  function lesson(kind, title){
    const arr = M.KIDS[kind]; let i = 0; const box = h('div');
    const draw = ()=>{
      const [, t, d] = arr[i], last = i === arr.length - 1;
      box.replaceChildren(h('div.kd-dots', ...arr.map((_, k)=>h('i'+(k === i ? '.on' : k < i ? '.done' : '')))),
        h('div.card.kd-step', h('span.kd-num.num', M.n(i + 1)), h('div.title-font.bold.kd-st', t), h('div.kd-sd', d)),
        h('div.row-flex.gap-s', h('button.btn.tonal', {disabled:i === 0, onclick:()=>{ i--; draw(); }}, 'السابق'),
          h('button.btn.grow', {onclick:()=>{ M.haptic && M.haptic(12); if(!last){ i++; draw(); return; } const got = once(kind, 3); M.toast(got ? 'أتممت الدرس! ثلاث نجوم لك ★★★' : 'أتممت الدرس، أحسنت!'); go('home'); }}, last ? 'أتممت الدرس' : 'التالي')));
    };
    content.append(back(title), box); draw();
  }
  function stories(){
    content.append(back('قصص الأنبياء'));
    M.KIDS.stories.forEach(([t, d], i)=>{ const c = h('button.card.kd-story', {onclick:()=>{ const open = c.classList.toggle('open'); if(open) once('story'+i, 1); }}, h('span.kd-num.num', M.n(i + 1)), h('div.grow', h('div.title-font.bold', t), h('div.kd-sd', d))); content.append(c); });
  }
  function adhkar(){
    content.append(back('أذكاري'));
    const got = M.store.get('kidDhikr', {});
    M.KIDS.adhkar.forEach(([t, d], i)=>content.append(h('div.card.pad.kd-dh', h('div.small.muted', t), h('div.bold.kd-dht', d),
      h('button.btn.sm'+(got[i] ? '.tonal' : ''), {onclick:function(){ if(got[i]) return; got[i] = 1; M.store.set('kidDhikr', got); this.classList.add('tonal'); this.textContent = 'حفظته ★'; addStar(2); M.haptic && M.haptic(20); }}, got[i] ? 'حفظته ★' : 'حفظته'))));
  }
  function surahs(){
    content.append(back('سور قصيرة'), h('div.small.muted', {style:'margin:0 2px 10px'}, 'اقرأ السورة من المصحف، أو استمع إليها ورددها.'));
    const g = h('div.kd-sur');
    SURAHS.forEach(([n, name])=>g.append(h('div.card.kd-su', h('b.title-font', name), h('div.row-flex.gap-s', h('button.btn.tonal.sm', {onclick:()=>M.openReader({sura:n, ayah:1})}, 'اقرأ'), M.player && M.player.play ? h('button.icon-btn.tonal', {'aria-label':'استمع إلى سورة '+name, onclick:()=>{ M.player.play(n, 1); once('sur'+n, 1); }}, M.ic('play')) : null))));
    content.append(g);
  }
  function quiz(){
    const seen = {}, pool = [];
    OLD_Q.concat(MORE_Q, ((M.QUIZ && M.QUIZ.kids) || []).map(q=>q.slice(0, 4))).forEach(q=>{ if(!seen[q[0]]){ seen[q[0]] = 1; pool.push(q); } });
    const round = shuffle(pool).slice(0, 10); let i = 0, score = 0; const box = h('div'), best = M.store.get('kidBest', 0);
    const q = ()=>{
      if(i >= round.length){ if(score > best) M.store.set('kidBest', score); addStar(score);
        box.replaceChildren(h('div.card.pad.center.kd-res', h('div.kd-resn', h('b.num', M.n(score)), h('span', ' / '+M.n(round.length))), h('div.title-font.bold', score >= 8 ? 'ممتاز يا بطل!' : score >= 5 ? 'أحسنت، واصل!' : 'حاول مرة أخرى وستتقدّم'),
          h('div.small.muted', 'ربحت '+M.n(score)+' نجوم'+(score > best ? ' — رقم قياسي جديد!' : best ? ' • أفضل نتيجة لك '+M.n(best) : '')),
          h('div.row-flex.gap-s', {style:'margin-top:14px;justify-content:center'}, h('button.btn', {onclick:()=>go('quiz')}, 'أسئلة جديدة'), h('button.btn.tonal', {onclick:()=>go('home')}, 'الركن')))); return; }
      const [t, ok, ...wrong] = round[i], opts = shuffle([ok].concat(wrong.filter(Boolean))); let locked = false;
      const fb = h('div.kd-fb', {role:'status', 'aria-live':'polite'});
      box.replaceChildren(h('div.kd-dots', ...round.map((_, k)=>h('i'+(k === i ? '.on' : k < i ? '.done' : '')))),
        h('div.card.pad.kd-q', h('div.small.muted', 'سؤال '+M.n(i + 1)+' من '+M.n(round.length)), h('div.bold.title-font.kd-qt', t),
          ...opts.map(o=>h('button.kid-opt', {dataset:{o}, onclick:function(){ if(locked) return; locked = true; const good = o === ok; this.classList.add(good ? 'right' : 'wrong'); if(good) score++;
            M.$$('.kid-opt', box).forEach(b=>{ b.disabled = true; if(b.dataset.o === ok) b.classList.add('right'); else if(b !== this) b.classList.add('dim'); });
            fb.className = 'kd-fb '+(good ? 'right' : 'wrong'); fb.textContent = good ? 'إجابة صحيحة، أحسنت! ★' : 'إجابة خاطئة — الصحيح: '+ok;
            M.haptic && M.haptic(good ? 20 : 45); setTimeout(()=>{ i++; q(); }, good ? 900 : 2000); }}, h('span.kid-mark'), h('span.grow', o))), fb));
    };
    content.append(back('المسابقة ('+M.cnt(pool.length, 'سؤال', false, 'سؤالًا')+')'), box); q();
  }
  paint();
  return view;
};
})();
