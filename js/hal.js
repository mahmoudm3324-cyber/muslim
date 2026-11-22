/* ===== أدعية لكل حال: travel, distress, worry and grief, illness, food, prayer, home, rain, hajj, people, remembrance…
   Each supplication with who narrated it and its ruling. Plus «دعاء اليوم» on the home screen. Data: hal-data.js (M.HAL). ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
if(!M.HAL) return;
const ICON = {travel:'s:kaaba', grief:'heart', sick:'s:shield', shaitan:'s:shield', food:'note', salah:'s:mosque', home:'home', nature:'s:moon', hajj:'s:kaaba', people:'s:mine', dhikr:'s:beads', other:'s:star8'};
const HUE = {travel:1, grief:4, sick:5, shaitan:3, food:2, salah:0, home:6, nature:1, hajj:2, people:3, dhikr:0, other:6};
const strip = s=>String(s || '').replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const plain = s=>M.cfg && M.cfg.noTashkeel ? String(s).replace(/[ً-ٰٟۖ-ۭـ]/g, '') : s;
const ok = g=>/^(صحيح|حسن)/.test(g || '');

function itemCard(topic, it, all){
  const [t, n, src, g] = it;
  const copy = plain(t) + '\n[' + src + (g ? ' — ' + g : '') + ']';
  return h('article.card.hal-it',
    h('div.hal-txt', plain(t)),
    h('div.hal-meta', h('span.badge.gold', src), g ? h('span.badge' + (ok(g) ? '.ok' : ''), g) : null, n > 1 ? h('span.badge', 'التكرار: ' + M.n(n)) : null),
    h('div.dh-actions',
      h('button.icon-btn', {'aria-label':'نسخ', onclick:()=>M.copy(copy)}, M.ic('copy')),
      h('button.icon-btn', {'aria-label':'مشاركة', onclick:()=>M.share(copy)}, M.ic('share')),
      h('span.grow'),
      M.dhikrPager ? h('button.btn.tonal.sm', {onclick:()=>M.dhikrPager(topic, all.map(x=>[x[0], x[1] || 1, x[2]]), {start:all.indexOf(it)})}, M.ic('beads'), 'اقرأ وعُدّ') : null));
}
function openTopic(name, items){
  M.openView({id:'hal-t', title:name, build:b=>{ items.forEach(it=>b.append(itemCard(name, it, items))); }});
}
M.openHal = function(start){
  M.openView({id:'hal', title:'أدعية لكل حال', build:b=>{
    let grp = start || '';
    const q = h('input.field', {type:'search', placeholder:'ابحث: السفر، الكرب، المطر، المريض…', 'aria-label':'بحث في الأدعية'});
    const chips = h('div.hal-chips');
    const box = h('div.hal-box');
    const total = M.HAL.reduce((a, g)=>a + g[2].reduce((x, t)=>x + t[1].length, 0), 0);
    function draw(){
      const k = strip(q.value.trim());
      chips.replaceChildren(h('button.chip' + (!grp ? '.on' : ''), {onclick:()=>{ grp = ''; draw(); }}, 'الكل'),
        ...M.HAL.map(([key, name])=>h('button.chip' + (grp === key ? '.on' : ''), {onclick:()=>{ grp = key; draw(); }}, name)));
      box.replaceChildren();
      if(k){
        const res = [];
        M.HAL.forEach(([, , tops])=>tops.forEach(([tn, items])=>items.forEach(it=>{ if(strip(tn + ' ' + it[0]).includes(k)) res.push([tn, it, items]); })));
        if(!res.length) box.append(h('div.empty', 'لا نتائج'));
        res.slice(0, 60).forEach(([tn, it, items])=>box.append(h('div.small.muted.hal-from', tn), itemCard(tn, it, items)));
        return;
      }
      M.HAL.filter(g=>!grp || g[0] === grp).forEach(([key, name, tops])=>{
        const l = h('div.list.card');
        tops.forEach(([tn, items])=>l.append(M.item({icon:ICON[key] || 'note', title:tn, sub:items.length > 1 ? M.n(items.length) + ' أدعية وأذكار' : (items[0][2] || ''), onClick:()=>openTopic(tn, items), trail:M.ic('fwd')})));
        box.append(h('div.hal-gh.mr-c' + (HUE[key] || 0), h('span.mr-gi', {html:M.icon(ICON[key] || 'note')}), h('b', name), h('span.mr-gn.num', M.n(tops.length))), l);
      });
    }
    q.addEventListener('input', M.debounce(draw, 160));
    b.append(h('div.card.pad.small.muted', M.n(total) + ' دعاءً وذكرًا لكل أحوال اليوم: السفر، والكرب والهم والحزن، والمرض، والطعام، والصلاة، والمطر وغيرها، مع من رواه ودرجته.'), q, chips, box);
    draw();
  }});
};

/* ---- دعاء اليوم: a different supplication each day, from the duas that are prayers (not narrations) ---- */
const POOL = [];
M.HAL.forEach(([key, , tops])=>tops.forEach(([tn, items])=>items.forEach(it=>{
  const t = it[0];
  if(t.length > 24 && t.length < 330 && ok(it[3]) && /اللهم|اللّهم|ربنا|رب |رَبِّ|اللَّهُمَّ|أعوذ|أَعُوذُ|يا حي|لا إله إلا/.test(t) && !/^(قال|كان|عن|وقال)/.test(t)) POOL.push([tn, it]);
})));
M.duaOfDay = function(d){
  if(!POOL.length) return null;
  const day = Math.floor(((d || new Date()) - new Date(2020, 0, 1)) / 864e5);
  return POOL[((day * 37) % POOL.length + POOL.length) % POOL.length];
};
/* for the «دعاء عشوائي» notification: [topic, text, source] — plain text, short enough for a notification */
M.duaPick = function(seed){ if(!POOL.length) return null; const x = POOL[((seed | 0) % POOL.length + POOL.length) % POOL.length]; return [x[0], String(x[1][0]).replace(/[ً-ٰٟۖ-ۭـ]/g, '').slice(0, 220), x[1][2]]; };
M.duaDayCard = function(){
  const x = M.duaOfDay(); if(!x) return null;
  const [tn, it] = x;
  const copy = plain(it[0]) + '\n[' + it[2] + (it[3] ? ' — ' + it[3] : '') + ']';
  return h('section.card.pad.dd-card', {dataset:{hk:'duaday'}},
    h('div.dd-h', h('span.dd-ic', {html:M.icon('heart')}), h('div.grow', h('b.title-font', 'دعاء اليوم'), h('small', tn)),
      h('button.icon-btn', {'aria-label':'مشاركة', onclick:e=>{ e.stopPropagation(); M.share(copy); }}, M.ic('share'))),
    h('div.dd-t.qfont', plain(it[0])),
    h('div.dd-f', h('span.badge.gold', it[2]), it[3] ? h('span.badge.ok', it[3]) : null, h('span.grow'),
      h('button.btn.tonal.sm', {onclick:()=>M.openHal()}, 'أدعية لكل حال')));
};

if(M.addSection) M.addSection({id:'hal', title:'أدعية لكل حال', icon:'heart', group:'الأذكار والأدعية', fn:()=>M.openHal(), noMore:true});
const place = ()=>{ if(!M.SECTION_ORG) return; const g = M.SECTION_ORG.find(x=>x[0] === 'الأذكار والأدعية'); if(g && !g[1].includes('hal')) g[1].splice(Math.min(g[1].length, 6), 0, 'hal'); };
place(); setTimeout(place, 300); setTimeout(place, 1500);
M.SECTION_KW = M.SECTION_KW || {};
M.SECTION_KW.hal = 'دعاء السفر الكرب الهم الحزن الدين المرض المطر الريح الطعام الصيام المسجد الوسوسة الحج أدعية حصن المسلم';
})();
