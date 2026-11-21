/* ===== Kids corner → «أتعلّم ديني»: guides to the pillars, purification, wudu, prayer, fasting, zakat and hajj, read one section at a time ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
if(!M.LEARN) return;
const plain = s=>M.cfg && M.cfg.noTashkeel ? String(s).replace(/[ً-ٰٟۖ-ۭـ]/g, '') : s;

/* ctx: {content, back, go, once} given by the kids corner */
M.kidsLearn = function(ctx, id){
  const {content, back, go, once} = ctx;
  if(!id){
    content.append(back('أتعلّم ديني'), h('div.card.pad.small.muted', 'أدلة مبسّطة تشرح أركان الإسلام والعبادات خطوة بخطوة. اختر موضوعًا وافتح كل جزء لتقرأه، ومن يقرأ دليلًا كاملًا يأخذ نجمة.'));
    const l = h('div.list.card'); content.append(l);
    M.LEARN.forEach(g=>l.append(M.item({icon:'note', title:plain(g[1]), sub:M.n(g[3].length) + ' أجزاء', onClick:()=>{ ctx.S.learn = g[0]; go('learn'); }, trail:M.ic('fwd')})));
    return;
  }
  const g = M.LEARN.find(x=>x[0] === id); if(!g) return;
  const seen = new Set();
  content.append(h('div.kd-top', h('button.chip', {onclick:()=>{ ctx.S.learn = null; go('learn'); }}, M.ic('back'), 'الأدلة'), h('div.bold.title-font.grow', plain(g[1]))));
  g[3].forEach((s, i)=>{
    const box = h('div.card.pad.lrn', {style:'margin-top:2px'}, ...s[1].map(p=>h('p', {style:'margin:.5em 0;line-height:2'}, plain(p))));
    box.hidden = i !== 0; if(i === 0) seen.add(0);
    const head = h('button.card.lrn-h', {'aria-expanded':String(i === 0), style:'width:100%;text-align:start;display:flex;gap:10px;align-items:center;margin-top:8px', onclick:()=>{
      box.hidden = !box.hidden; head.setAttribute('aria-expanded', String(!box.hidden));
      if(!box.hidden){ seen.add(i); if(seen.size === g[3].length) once('learn' + id, 2); }
    }}, h('span.kd-num.num', M.n(i + 1)), h('div.grow.title-font.bold', plain(s[0] || g[1])), M.ic('fwd'));
    content.append(head, box);
  });
};
})();
