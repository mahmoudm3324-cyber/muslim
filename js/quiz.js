/* ===== Religious quiz: categories, rounds of multiple-choice questions, scores kept on the device ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const shuffle = a=>{ a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const best = ()=>M.store.get('quizBest', {}) || {};
const stats = ()=>M.store.get('quizStats', {played:0, right:0, total:0}) || {played:0, right:0, total:0};
const catName = id=>id === 'all' ? 'مسابقة شاملة' : (M.QUIZ_CATS.find(c=>c[0] === id) || [])[1] || '';

M.openQuiz = function(){
  let view;
  const body = h('div.qz');
  const cfg = ()=>Object.assign({n:10, timer:false}, M.cfg.quiz || {});
  function home(){
    const st = stats(), b = best(), c = cfg();
    const total = Object.values(M.QUIZ).reduce((n, a)=>n + a.length, 0);
    const card = (id, name, icon, count)=>{
      const bs = b[id];
      return h('button.card.qz-cat', {onclick:()=>start(id)}, h('span.qz-ci', {html:M.icon(icon)}), h('b', name),
        h('small.muted', M.cnt(count, 'سؤال', false, 'سؤالًا')), bs ? h('span.qz-best', 'أفضل نتيجة '+M.n(bs)+'٪') : h('span.qz-best.new', 'جديد'));
    };
    body.replaceChildren(
      h('div.card.accent.pad.qz-hero', h('div.grow', h('div.small.muted', 'اختبر معلوماتك'), h('div.qz-ht.title-font', 'المسابقات الدينية'),
          h('div.small', M.cnt(total, 'سؤال')+' في '+M.cnt(M.QUIZ_CATS.length, 'قسم', true, 'أقسام'))),
        h('div.qz-sc', h('b', M.n(st.total ? Math.round(st.right / st.total * 100) : 0)+'٪'), h('small', 'دقّة إجاباتك'))),
      h('button.btn.block.qz-all', {onclick:()=>start('all')}, M.ic('refresh'), 'مسابقة شاملة من كل الأقسام'),
      h('div.section-h', 'اختر قسمًا'),
      h('div.qz-grid', ...M.QUIZ_CATS.map(([id, name, icon])=>card(id, name, icon, M.QUIZ[id].length))),
      h('div.section-h', 'إعدادات الجولة'),
      h('div.card.pad.col-flex', h('div.small.muted', 'عدد الأسئلة'),
        M.seg([[5, M.n(5)], [10, M.n(10)], [15, M.n(15)], [20, M.n(20)]], c.n, v=>M.save('quiz', Object.assign(cfg(), {n:+v}))),
        h('div.row-flex', h('div.grow', h('div', 'مؤقّت لكل سؤال'), h('div.small.muted', M.n(20)+' ثانية للإجابة')), M.switchEl(!!c.timer, v=>M.save('quiz', Object.assign(cfg(), {timer:v}))))),
      h('div.small.muted', {style:'line-height:1.9;margin-top:10px'}, 'لعبت '+M.cnt(st.played, 'جولة')+' وأجبت صحيحًا عن '+M.n(st.right)+' من '+M.cnt(st.total, 'سؤال', true, 'سؤالًا')+'. إن وجدت خطأ في سؤال فأخبرنا لنصحّحه.'));
  }
  function start(cat){
    const c = cfg();
    let pool = cat === 'all' ? [].concat(...M.QUIZ_CATS.filter(x=>x[0] !== 'kids').map(x=>M.QUIZ[x[0]].map(q=>[q, x[1]]))) : M.QUIZ[cat].map(q=>[q, catName(cat)]);
    const qs = shuffle(pool).slice(0, Math.min(c.n, pool.length));
    let i = 0, right = 0, tm = null; const wrong = [];
    function show(){
      clearInterval(tm);
      const [q, cname] = qs[i], correct = q[1], opts = shuffle(q.slice(1, 5));
      let done = false, left = 20;
      const bar = h('i', {style:'width:'+(i / qs.length * 100)+'%'}), clock = h('span.qz-clock.num', c.timer ? M.n(left) : '');
      const next = h('button.btn.block.hide', {onclick:()=>{ i++; i < qs.length ? show() : finish(); }}, i + 1 < qs.length ? 'السؤال التالي' : 'عرض النتيجة');
      const note = h('div.qz-note.hide');
      const btns = opts.map((o, k)=>h('button.qz-opt', {onclick:()=>pick(o, btns[k])}, h('span.qz-l', 'أبجد'[k]), h('span.grow', o)));
      function pick(o, el){
        if(done) return; done = true; clearInterval(tm);
        const ok = o === correct;
        btns.forEach((x, k)=>{ x.disabled = true; if(opts[k] === correct) x.classList.add('ok'); });
        if(el && !ok) el.classList.add('no');
        if(ok){ right++; M.haptic && M.haptic(10); } else { wrong.push([q[0], correct, q[5] || '']); M.haptic && M.haptic([30, 40, 30]); }
        note.classList.remove('hide'); note.classList.toggle('good', ok);
        note.replaceChildren(...[h('b', ok ? 'إجابة صحيحة، أحسنت' : (o == null ? 'انتهى الوقت' : 'إجابة غير صحيحة')), !ok ? h('div', 'الصواب: '+correct) : null, q[5] ? h('div.small', q[5]) : null].filter(Boolean));
        next.classList.remove('hide'); try{ next.scrollIntoView({block:'nearest', behavior:'smooth'}); }catch(e){}
      }
      body.replaceChildren(
        h('div.qz-top', h('span.chip.on', cname), h('span.grow'), clock, h('span.small.muted.num', M.n(i + 1)+' / '+M.n(qs.length))),
        h('div.qz-bar', bar),
        h('div.card.pad.qz-q', q[0]),
        h('div.qz-opts', ...btns), note, next,
        h('button.btn.ghost.sm.qz-quit', {onclick:()=>{ clearInterval(tm); home(); }}, 'إنهاء الجولة'));
      if(c.timer) tm = setInterval(()=>{ if(!body.isConnected){ clearInterval(tm); return; } left--; clock.textContent = M.n(Math.max(0, left)); clock.classList.toggle('low', left <= 5); if(left <= 0) pick(null, null); }, 1000);
      try{ body.parentElement.scrollTop = 0; }catch(e){}
    }
    function finish(){
      const pct = Math.round(right / qs.length * 100);
      const b = best(); if(!b[cat] || pct > b[cat]){ b[cat] = pct; M.store.set('quizBest', b); }
      const st = stats(); st.played++; st.right += right; st.total += qs.length; M.store.set('quizStats', st);
      const msg = pct === 100 ? 'ما شاء الله، علامة كاملة' : pct >= 80 ? 'ممتاز، بارك الله فيك' : pct >= 50 ? 'جيد، واصل التعلّم' : 'لا بأس، راجع ثم حاول مرة أخرى';
      body.replaceChildren(...[
        h('div.card.accent.pad.qz-res', h('div.qz-ring', {style:'--pg:'+(pct * 3.6)+'deg'}, h('b', M.n(pct)+'٪')), h('div.qz-ht.title-font', msg),
          h('div', M.n(right)+' إجابة صحيحة من '+M.n(qs.length)), h('div.small.muted', catName(cat))),
        h('div.row-flex.gap-s', {style:'margin:12px 0'}, h('button.btn.grow', {onclick:()=>start(cat)}, M.ic('refresh'), 'جولة جديدة'), h('button.btn.tonal.grow', {onclick:home}, 'الأقسام')),
        h('button.btn.ghost.block', {onclick:()=>M.share('حصلت على '+M.n(pct)+'٪ في مسابقة «'+catName(cat)+'» بتطبيق المسلم.')}, M.ic('share'), 'مشاركة النتيجة'),
        wrong.length ? h('div.section-h', 'راجع ما أخطأت فيه') : null,
        wrong.length ? h('div.card.list', ...wrong.map(([q, a, n])=>h('div.item.qz-rev', h('div.grow', h('div.t', q), h('div.s.qz-ans', a), n ? h('div.s', n) : null)))) : null].filter(Boolean));
      try{ body.parentElement.scrollTop = 0; }catch(e){}
    }
    show();
  }
  view = M.openView({title:'المسابقات الدينية', id:'quiz', build:b=>{ b.append(body); home(); }});
};
})();
