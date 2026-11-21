/* ===== تفسير الأحلام: five classical books (النابلسي، ابن سيرين، ابن شاهين، الإحسائي، جعفر الصادق), searchable by title or by first letter.
   The data (dreams-data.js, M.DREAMS = [[title, [[book, text], …]], …]) is loaded the first time the section opens. ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const strip = s=>String(s || '').replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const plain = s=>M.cfg && M.cfg.noTashkeel ? String(s).replace(/[ً-ٰٟۖ-ۭـ]/g, '') : s;
const LETTERS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');
let loading = null;
const load = ()=>{
  if(M.DREAMS) return Promise.resolve();
  if(loading) return loading;
  return loading = new Promise((ok, no)=>{ const s = document.createElement('script'); s.src = 'js/dreams-data.js'; s.onload = ()=>{ M.DREAMS.forEach(d=>d.push(strip(d[0]))); ok(); }; s.onerror = ()=>{ loading = null; no(); }; document.head.append(s); });
};

function entry(d){
  M.openView({id:'dream', title:plain(d[0]), build:b=>{
    d[1].forEach(([book, text])=>{
      const t = plain(text);
      b.append(h('article.card.pad', {style:'margin-bottom:10px'}, h('div.badge.gold', {style:'margin-bottom:8px;display:inline-block'}, plain(book)), h('div.qfont', {style:'line-height:2.1;white-space:pre-line'}, t),
        h('div.dh-actions', h('button.icon-btn', {'aria-label':'نسخ', onclick:()=>M.copy(d[0] + '\n' + t + '\n[' + book + ']')}, M.ic('copy')), h('button.icon-btn', {'aria-label':'مشاركة', onclick:()=>M.share(d[0] + '\n' + t + '\n[' + book + ']')}, M.ic('share')))));
    });
    b.append(h('div.small.muted', {style:'padding:6px 4px'}, 'تفسير الرؤى اجتهاد من العلماء وليس يقينًا، والرؤيا الصالحة بشرى من الله، وما يكرهه الرائي فلينفث عن يساره ثلاثًا ويستعذ بالله من الشيطان ولا يحدّث به أحدًا.'));
  }});
}

M.openDreams = function(){
  M.openView({id:'dreams', title:'تفسير الأحلام', build:b=>{
    const q = h('input.field', {type:'search', placeholder:'ابحث عن رؤيا: ماء، ثعبان، طيران…', 'aria-label':'بحث'});
    const chips = h('div', {style:'display:flex;gap:6px;overflow-x:auto;padding:6px 0 10px'});
    const box = h('div.list.card'), status = h('div.small.muted', {style:'padding:6px 4px'});
    let letter = '', shown = 60, list = [];
    LETTERS.forEach(l=>chips.append(h('button.chip', {'data-l':l, onclick:function(){ letter = letter === l ? '' : l; q.value = ''; shown = 60; draw(); }}, l)));
    const draw = ()=>{
      const k = strip(q.value.trim());
      chips.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on', c.dataset.l === letter && !k));
      list = !M.DREAMS ? [] : k ? M.DREAMS.filter(d=>d[2].includes(k)) : letter ? M.DREAMS.filter(d=>d[2][0] === letter || (letter === 'ا' && d[2][0] === 'ا')) : [];
      box.replaceChildren();
      if(!M.DREAMS) { status.textContent = 'جارٍ التحميل…'; return; }
      status.textContent = (k || letter) ? (list.length ? M.n(list.length) + ' نتيجة' : 'لا توجد نتائج') : 'اختر حرفًا أو ابحث عن ما رأيت في منامك';
      list.slice(0, shown).forEach(d=>box.append(M.item({icon:'note', title:plain(d[0]), sub:M.n(d[1].length) + (d[1].length > 1 ? ' تفاسير' : ' تفسير'), onClick:()=>entry(d), trail:M.ic('fwd')})));
      if(list.length > shown) box.append(h('button.btn.tonal', {style:'margin:10px auto;display:block', onclick:()=>{ shown += 60; draw(); }}, 'عرض المزيد'));
    };
    q.oninput = ()=>{ shown = 60; draw(); };
    b.append(h('div.card.pad.small.muted', 'تفسير الأحلام من كتب العلماء: النابلسي وابن سيرين وابن شاهين والإحسائي وجعفر الصادق، كل رؤيا بتفاسير الكتب التي ذكرتها.'), q, chips, status, box);
    draw(); load().then(draw).catch(()=>{ status.textContent = 'تعذّر تحميل البيانات'; });
  }});
};

if(M.addSection) M.addSection({id:'dreams', title:'تفسير الأحلام', icon:'moon', group:'تعلّم وكتب', fn:()=>M.openDreams(), noMore:true});
const place = ()=>{ if(!M.SECTION_ORG) return; const g = M.SECTION_ORG.find(x=>x[0] === 'تعلّم وكتب') || M.SECTION_ORG[M.SECTION_ORG.length - 1]; if(g && !g[1].includes('dreams')) g[1].push('dreams'); };
place(); if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place); setTimeout(place, 300); setTimeout(place, 1500);
M.SECTION_KW = M.SECTION_KW || {};
M.SECTION_KW.dreams = 'تفسير الأحلام الرؤيا المنام ابن سيرين النابلسي حلم رأيت';
})();
