/* ===== تفسير الأحلام: five classical books (النابلسي، ابن سيرين، ابن شاهين، الإحسائي، جعفر الصادق).
   Home: a night-sky header with the search, common dreams, the alphabet as a grid of letters and the last dreams opened.
   A dream: one card per book, with tabs to move between the books that mention it.
   The data (dreams-data.js, M.DREAMS = [[title, [[book, text], …]], …]) is loaded the first time the section opens. ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const strip = s=>String(s || '').replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const plain = s=>M.cfg && M.cfg.noTashkeel ? String(s).replace(/[ً-ٰٟۖ-ۭـ]/g, '') : s;
const add = (el, ...k)=>el.append(...k.flat().filter(x=>x != null && x !== false));
const LETTERS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');
const COMMON = ['الماء', 'الثعبان', 'البحر', 'المطر', 'الذهب', 'الطيران', 'الأسنان', 'البيت', 'الكلب', 'القطة', 'الزواج', 'الطفل', 'النار', 'الشعر', 'الموت', 'السمك', 'الحج', 'المسجد', 'القرآن', 'الخبز'];
const BOOKS = ['النابلسي', 'ابن سيرين', 'ابن شاهين', 'الإحسائي', 'جعفر الصادق'];
const bookHue = b=>{ const k = strip(b); return k.includes('نابلس') ? 0 : k.includes('سيرين') ? 1 : k.includes('شاهين') ? 2 : k.includes('احسا') ? 3 : 4; };
let loading = null;
const load = ()=>{
  if(M.DREAMS) return Promise.resolve();
  if(loading) return loading;
  return loading = new Promise((ok, no)=>{ const s = document.createElement('script'); s.src = 'js/dreams-data.js'; s.onload = ()=>{ M.DREAMS.forEach(d=>d.push(strip(d[0]).replace(/^ال(?=..)/, ''), strip(d[0]))); ok(); }; s.onerror = ()=>{ loading = null; no(); }; document.head.append(s); });
};
const recent = ()=>{ const r = M.store.get('dreamsRecent', []); return Array.isArray(r) ? r : []; };
const remember = t=>{ const r = recent().filter(x=>x !== t); r.unshift(t); M.store.set('dreamsRecent', r.slice(0, 10)); };
const find = k=>{ k = strip(k).replace(/^ال(?=..)/, ''); if(!k) return []; const a = [], b = [];
  M.DREAMS.forEach(d=>{ if(d[2].startsWith(k)) a.push(d); else if(d[3].includes(k)) b.push(d); }); return a.concat(b); };

/* ---- one dream: a tab per book ---- */
function entry(d){
  remember(d[0]);
  M.openView({id:'dream', title:'تفسير الرؤيا', build:b=>{
    let cur = 0;
    const body = h('div.dr-body');
    const tabs = d[1].length > 1 ? h('div.dr-tabs', {role:'tablist'}) : null;
    const draw = ()=>{
      const [book, text] = d[1][cur], t = plain(text);
      if(tabs) tabs.querySelectorAll('button').forEach((x, i)=>{ x.classList.toggle('on', i === cur); x.setAttribute('aria-selected', String(i === cur)); });
      const share = d[0] + '\n\n' + t + '\n\n— تفسير ' + book;
      body.replaceChildren(h('article.dr-read.dr-h' + bookHue(book),
        h('div.dr-read-h', h('span.dr-book', {html:M.icon('s:mushaf')}), h('div.grow', h('small', 'تفسير'), h('b.title-font', plain(book)))),
        h('div.dr-text', t),
        h('div.dr-acts',
          h('button.btn.tonal.sm', {onclick:()=>M.copy(share)}, M.ic('copy'), 'نسخ'),
          h('button.btn.tonal.sm', {onclick:()=>M.share(share)}, M.ic('share'), 'مشاركة'),
          d[1].length > 1 ? h('span.grow') : null,
          d[1].length > 1 ? h('button.icon-btn.tonal', {'aria-label':'التفسير التالي', onclick:()=>{ cur = (cur + 1) % d[1].length; draw(); }}, M.ic('back')) : null)));
    };
    if(tabs) d[1].forEach(([book], i)=>tabs.append(h('button.dr-tab.dr-h' + bookHue(book), {role:'tab', onclick:()=>{ cur = i; draw(); M.haptic && M.haptic(6); }}, h('i'), plain(book))));
    add(b,
      h('div.dr-hero.dr-hero-s', h('i.dr-stars'), h('div.dr-moon'), h('small', 'رأيت في منامك'), h('h2.title-font', plain(d[0])),
        h('span.dr-cnt', d[1].length > 1 ? M.n(d[1].length) + ' تفاسير من كتب العلماء' : 'تفسير واحد')),
      tabs, body, adab());
    draw();
  }});
}
const adab = ()=>h('div.dr-adab',
  h('div.dr-adab-h', M.ic('info'), h('b', 'آداب الرؤيا')),
  h('p', 'قال رسول الله ﷺ: «الرؤيا الصالحة من الله، والحلم من الشيطان، فإذا رأى أحدكم شيئًا يكرهه فلينفث عن يساره ثلاثًا، وليتعوذ من الشيطان؛ فإنها لا تضره».'),
  h('small', 'متفق عليه • تفسير الرؤى اجتهاد من أهل العلم وليس يقينًا'));

/* ---- the section ---- */
M.openDreams = function(){
  M.openView({id:'dreams', title:'تفسير الأحلام', build:b=>{
    const q = h('input.dr-q', {type:'search', placeholder:'ماذا رأيت؟ ماء، ثعبان، طيران…', 'aria-label':'ابحث عن رؤيا', enterkeyhint:'search', autocomplete:'off'});
    const clear = h('button.dr-qx', {'aria-label':'مسح', hidden:true, onclick:()=>{ q.value = ''; letter = ''; draw(); q.focus(); }}, M.ic('close'));
    const box = h('div.dr-box');
    let letter = '', shown = 40;
    const row = d=>h('button.dr-row', {onclick:()=>entry(d)},
      h('span.dr-row-ic', {html:M.icon('moon')}),
      h('div.grow', h('b', plain(d[0])), h('div.dr-dots', ...d[1].map(([bk])=>h('i.dr-h' + bookHue(bk), {title:bk})), h('small', d[1].length > 1 ? M.n(d[1].length) + ' تفاسير' : 'تفسير واحد'))),
      M.ic('back'));
    const list = (arr, title)=>{
      const l = h('div.dr-list');
      arr.slice(0, shown).forEach(d=>l.append(row(d)));
      return [h('div.dr-sh', h('b', title), h('small', M.n(arr.length) + ' رؤيا')), arr.length ? l : h('div.dr-empty', h('span', {html:M.icon('moon')}), h('b', 'لم نجد هذه الرؤيا'), h('small', 'جرّب كلمة أقصر أو مرادفًا، مثل «حية» بدل «ثعبان»')),
        arr.length > shown ? h('button.btn.tonal.block', {onclick:()=>{ shown += 40; draw(); }}, 'عرض المزيد') : null];
    };
    function draw(){
      const k = q.value.trim(); clear.hidden = !k && !letter;
      box.replaceChildren();
      if(!M.DREAMS){ box.append(h('div.dr-load', h('i'), h('i'), h('i'), h('span', 'نجهّز كتب التفسير…'))); return; }
      if(k){ add(box, list(find(k), 'نتائج «' + k + '»')); return; }
      if(letter){
        const arr = M.DREAMS.filter(d=>d[3][0] === letter);
        add(box, h('button.chip.dr-back', {onclick:()=>{ letter = ''; shown = 40; draw(); }}, M.ic('fwd'), 'كل الحروف'), list(arr, 'حرف «' + letter + '»'));
        return;
      }
      const rec = recent().map(t=>M.DREAMS.find(d=>d[0] === t)).filter(Boolean);
      add(box,
        h('div.dr-sh', h('b', 'رؤى يكثر السؤال عنها')),
        h('div.dr-common', ...COMMON.map(w=>h('button.dr-pill', {onclick:()=>{ q.value = w.replace(/^ال/, ''); shown = 40; draw(); }}, w))),
        rec.length ? h('div.dr-sh', h('b', 'آخر ما قرأت'), h('button.link.small', {onclick:()=>{ M.store.set('dreamsRecent', []); draw(); }}, 'مسح')) : null,
        rec.length ? h('div.dr-list', ...rec.slice(0, 5).map(row)) : null,
        h('div.dr-sh', h('b', 'تصفّح بالحرف')),
        h('div.dr-abc', ...LETTERS.map(l=>h('button.dr-l', {onclick:()=>{ letter = l; shown = 40; draw(); b.closest('.view-body') && (b.closest('.view-body').scrollTop = 0); }}, l))),
        h('div.dr-sh', h('b', 'الكتب')),
        h('div.dr-books', ...BOOKS.map((bk, i)=>h('div.dr-bk.dr-h' + i, h('i'), h('b', bk), h('small', M.n(M.DREAMS.filter(d=>d[1].some(e=>bookHue(e[0]) === i)).length) + ' رؤيا')))),
        adab());
    }
    q.addEventListener('input', M.debounce(()=>{ shown = 40; draw(); }, 160));
    b.append(h('div.dr-hero', h('i.dr-stars'), h('div.dr-moon'),
      h('h2.title-font', 'تفسير الأحلام'), h('p', 'أكثر من ٤٠٠٠ رؤيا من خمسة كتب لأهل العلم'),
      h('div.dr-qw', h('span.dr-qi', {html:M.icon('search')}), q, clear)), box);
    draw(); load().then(draw).catch(()=>{ box.replaceChildren(h('div.dr-empty', h('b', 'تعذّر تحميل البيانات'), h('button.btn.tonal', {onclick:()=>{ load().then(draw); }}, 'إعادة المحاولة'))); });
  }});
};

if(M.addSection) M.addSection({id:'dreams', title:'تفسير الأحلام', icon:'moon', group:'تعلّم وكتب', fn:()=>M.openDreams(), noMore:true});
const place = ()=>{ if(!M.SECTION_ORG) return; const g = M.SECTION_ORG.find(x=>x[0] === 'تعلّم وكتب') || M.SECTION_ORG[M.SECTION_ORG.length - 1]; if(g && !g[1].includes('dreams')) g[1].push('dreams'); };
place(); if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place); setTimeout(place, 300); setTimeout(place, 1500);
M.SECTION_KW = M.SECTION_KW || {};
M.SECTION_KW.dreams = 'تفسير الأحلام الرؤيا المنام ابن سيرين النابلسي حلم رأيت';
})();
