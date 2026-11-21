/* ===== موسوعة الأذكار: the adhkar the daily lists lacked, =====
   islambook-data.js holds the texts. Here: (1) the missing items join the morning / evening / sleep / after-prayer lists
   (with their own counters, progress and favourites), (2) a section that opens every other category of the encyclopedia. */
(function(){
'use strict';
const M = window.M, h = M.h, D = M.ADHKAR;
if(!M.IBOOK || !M.IBOOK_DAILY || !D) return;

/* ---- 1. the daily lists ---- */
(function(){
  const add = (arr, list)=>{ if(!arr) return; const have = new Set(arr.map(x=>x.id)); list.forEach(it=>{ if(!have.has(it.id)) arr.push(Object.assign({}, it)); }); };
  // «أعوذ بكلمات الله التامات» is said morning and evening
  const kal = (D.MORNING_EVENING || []).find(x=>x.id === 'kalimat'); if(kal){ delete kal.only; delete kal.e; }
  add(D.MORNING_EVENING, M.IBOOK_DAILY.both);
  add(D.SLEEP, M.IBOOK_DAILY.sleep);
  add(D.AFTER_PRAYER, M.IBOOK_DAILY.after);
})();

/* ---- 2. the encyclopedia ---- */
const fs = ()=>(M.cfg && M.cfg.fontScale) || 1;
const strip = s=>String(s || '').replace(/[ً-ٰٟۖ-ۭـ]/g, '');
const plain = s=>M.cfg.noTashkeel ? strip(s) : s;
const total = ()=>M.IBOOK.reduce((a, c)=>a + c[3].length, 0);

function card(cat, it, box){
  const [title, body, n, src, fadl, g] = it;
  const lines = String(body).split('\n').filter(Boolean);
  const text = (title ? title + '\n' : '') + lines.join('\n');
  const copyText = text + '\n[' + src + (g ? ' — ' + g : '') + ']';
  const c = h('article.card.dhikr.ib',
    title ? h('div.dh-title.title-font', plain(title)) : null,
    h('div.dh-text.qfont', {style:'white-space:pre-line'}, plain(lines.join('\n'))),
    h('div.dh-meta', h('span.badge.gold', src), g ? h('span.badge' + (/^(صحيح|حسن)/.test(g) ? '.ok' : ''), g) : null, n > 1 ? h('span.badge', 'التكرار: ' + M.n(n)) : null),
    fadl && !M.cfg.hideFadl ? h('div.dh-fadl.small.muted', fadl) : null,
    h('div.dh-actions',
      h('button.icon-btn', {'aria-label':'نسخ', onclick:e=>{ e.stopPropagation(); M.copy(copyText); }}, M.ic('copy')),
      h('button.icon-btn', {'aria-label':'مشاركة', onclick:e=>{ e.stopPropagation(); M.share(copyText); }}, M.ic('share')),
      h('span.grow'),
      h('button.btn.tonal.sm', {onclick:e=>{ e.stopPropagation(); M.dhikrPager(cat[1], cat[3].map(x=>[(x[0] ? x[0] + '\n' : '') + String(x[1]).split('\n').join('\n'), x[2] || 1, x[3] + (x[5] ? ' — ' + x[5] : '')]), {start:cat[3].indexOf(it)}); }}, M.ic('beads'), 'سبّح وعُدّ')));
  box.append(c);
}

M.openIslambookCat = function(i){
  const cat = M.IBOOK[i]; if(!cat) return;
  M.openView({id:'ibook-' + cat[0], title:cat[1], build:b=>{
    const q = h('input.field', {type:'search', placeholder:'ابحث في هذا القسم…', 'aria-label':'بحث', oninput:()=>draw()});
    const box = h('div.col-flex'); b.append(q, box);
    function draw(){
      box.replaceChildren(); const k = strip(q.value.trim());
      const list = cat[3].filter(it=>!k || strip(it[0] + ' ' + it[1]).includes(k));
      if(!list.length) box.append(h('div.muted.center', {style:'padding:30px'}, 'لا توجد نتائج'));
      list.forEach(it=>card(cat, it, box));
    }
    draw();
  }});
};

M.openIslambook = function(){
  M.openView({id:'ibook', title:'موسوعة الأذكار', build:b=>{
    b.append(h('div.card.pad.small.muted', 'تتمة الأذكار والأدعية بمصادرها ودرجة كل حديث: ' + M.n(total()) + ' ذكرًا ودعاءً في ' + M.n(M.IBOOK.length) + ' قسمًا. أذكار الصباح والمساء والنوم وبعد الصلاة أُضيفت إلى قوائمها في تبويب «الأذكار».'));
    const l = h('div.list.card');
    M.IBOOK.forEach((c, i)=>l.append(M.item({icon:c[2], title:c[1], sub:M.cnt ? M.cnt(c[3].length, 'ذكر', false, 'ذكرًا') : M.n(c[3].length), onClick:()=>M.openIslambookCat(i), trail:M.ic('fwd')})));
    b.append(l);
  }});
};

/* the section, in the المزيد page with the other adhkar and supplications */
if(M.addSection) M.addSection({id:'ibook', title:'موسوعة الأذكار', icon:'note', group:'الأذكار والأدعية', fn:()=>M.openIslambook(), noMore:true});
// the group list is rebuilt by a later module (v2-unify.js): place the section after it, in the adhkar group
const place = ()=>{ if(!M.SECTION_ORG) return; const g = M.SECTION_ORG.find(x=>x[0] === 'الأذكار والأدعية') || M.SECTION_ORG.find(x=>x[0] === 'الأدعية والرقية'); if(g && !g[1].includes('ibook')) g[1].push('ibook'); };
place(); if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place); setTimeout(place, 300); setTimeout(place, 1500);
M.SECTION_KW = M.SECTION_KW || {};
M.SECTION_KW.ibook = 'موسوعة أذكار دعاء أدعية جوامع الدعاء أذكار الصلاة الأذان المسجد الوضوء المنزل الخلاء الطعام الحج الميت الرقية فضائل السور';
})();
