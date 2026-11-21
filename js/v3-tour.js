/* ===== Guided tour: a spotlight walks through the app's parts, one at a time, with a short note on each.
   M.startTour() — from the end of the first-run setup, the More page («جولة») and settings. Steps whose part is not on
   screen (a tab hidden from the bar, the floating circle turned off) are skipped. ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const wait = ms=>new Promise(r=>setTimeout(r, ms));
const vis = el=>{ if(!el) return false; const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight; };
const inView = el=>{ const r = el.getBoundingClientRect(); return r.top >= 60 && r.bottom <= innerHeight - 100; };
const tabBtn = id=>document.querySelector('.bar .tab[data-tab="' + id + '"]');

/* [icon, title, text, tab to show first, target finder] */
const STEPS = [
  ['s:crescent', 'أهلًا بك في المسلم', 'جولة قصيرة تعرّفك بأقسام التطبيق في أقل من دقيقة. يمكنك تخطّيها في أي وقت.', null, null],
  ['s:mosque', 'الصلاة القادمة', 'الوقت المتبقي على الصلاة التالية ومدينتك. اضغط عليها لتفتح جدول المواقيت كاملًا.', 'home', ()=>document.querySelector('#screen-home .home-prayer')],
  ['s:clock', 'وقت العبادة', 'يتغيّر خلال اليوم: يقترح عليك الذكر أو العبادة المناسبة للوقت الحالي، مع عدّ تنازلي.', 'home', ()=>document.querySelector('#screen-home .wn')],
  ['s:tracker', 'عبادات اليوم', 'علّم ما أتممته من صلوات وأوراد، ويحفظ التطبيق إنجازك وأيامك المتتالية.', 'home', ()=>document.querySelector('#screen-home .chk-card')],
  ['search', 'البحث والتخصيص', 'ابحث في الآيات والأذكار والأقسام، وغيّر الألوان والمظهر، وافتح الإعدادات من هنا.', 'home', ()=>document.querySelector('#screen-home .home-top')],
  ['s:mushaf', 'المصحف', 'المصحف الشريف بالرسم العثماني، مع التفسير والاستماع لعدة قرّاء والعلامات.', null, ()=>tabBtn('quran')],
  ['s:rug', 'الصلاة', 'المواقيت والأذان، والقبلة، وأقرب المساجد، والتنبيه قبل كل صلاة.', null, ()=>tabBtn('prayer')],
  ['s:beads', 'الأذكار', 'أذكار الصباح والمساء والنوم وبعد الصلاة، بعدّاد لكل ذكر، والمسبحة.', null, ()=>tabBtn('adhkar')],
  ['s:grid', 'المزيد', 'كل الأقسام الأخرى: الختمة، تفسير الأحلام، ركن الأطفال، الإذاعة، الزكاة وغيرها. اضغط مطولًا على أي قسم لتثبيته.', null, ()=>tabBtn('more')],
  ['star', 'الدائرة العائمة', 'اختصاراتك في كل شاشة: اضغطها لتفتح أقسامك المفضلة، واسحبها لتغيّر مكانها، واضغط مطولًا لتعديلها.', null, ()=>document.querySelector('.nb-bub:not(.nb-off) .nb-btn')],
  ['check', 'أنت جاهز!', 'تقبّل الله منك. يمكنك إعادة الجولة متى شئت من «المزيد» ← «جولة».', null, null]
];

let running = false;
M.startTour = async function(){
  if(running) return; running = true;
  try{ M.views && M.views.slice().forEach(v=>v.close && v.close()); }catch(e){}
  try{ M.bubbleClose && M.bubbleClose(); M.popupClose && M.popupClose('tour'); }catch(e){}
  await wait(300);
  const root = h('div.tr-root', {role:'dialog', 'aria-modal':'true', 'aria-label':'جولة في التطبيق'});
  const hole = h('div.tr-hole');
  const tip = h('div.tr-tip');
  root.append(h('div.tr-block'), hole, tip);
  document.body.append(root);
  requestAnimationFrame(()=>root.classList.add('in'));
  const list = STEPS.slice();
  let i = 0, done = false;
  const key = e=>{ if(e.key === 'Escape') finish(); else if(e.key === 'ArrowLeft') next(); else if(e.key === 'ArrowRight') prev(); };
  document.addEventListener('keydown', key);
  function finish(){
    if(done) return; done = true; running = false;
    M.store.set('tourDone', 1);
    root.classList.remove('in'); document.removeEventListener('keydown', key); removeEventListener('resize', onRs);
    setTimeout(()=>root.remove(), 260);
    try{ M.setTab && M.setTab('home'); }catch(e){}
  }
  const next = ()=>{ if(i < list.length - 1){ i++; show(1); } else finish(); };
  const prev = ()=>{ if(i > 0){ i--; show(-1); } };
  async function show(dir){
    const [ic, t, d, tab, find] = list[i];
    if(tab && M.curTab !== tab && M.setTab){ M.setTab(tab); await wait(380); }
    let el = find ? find() : null;
    if(find && el && el.getBoundingClientRect().width && !el.closest('.bar') && !el.closest('.nb-bub') && !inView(el)){ try{ el.scrollIntoView({block:el.offsetHeight > innerHeight * .45 ? 'start' : 'center'}); }catch(e){} await wait(360); }
    if(find && !vis(el)){ list.splice(i, 1); if(i >= list.length) i = list.length - 1; return show(dir); }   // not on screen here: skip it
    const last = i === list.length - 1;
    tip.replaceChildren(
      h('div.tr-head', h('span.tr-ic', {html:M.icon(ic)}), h('div.grow', h('small', M.n(i + 1) + ' من ' + M.n(list.length)), h('b.title-font', t)),
        last ? null : h('button.tr-skip', {onclick:finish}, 'تخطَّ')),
      h('p', d),
      h('div.tr-foot',
        h('div.tr-dots', ...list.map((_, k)=>h('i' + (k === i ? '.on' : k < i ? '.done' : '')))),
        i > 0 ? h('button.btn.tonal.sm', {onclick:prev}, 'السابق') : null,
        h('button.btn.sm.tr-next', {onclick:next}, last ? 'ابدأ' : i === 0 ? 'هيا بنا' : 'التالي')));
    place(el);
    tip.classList.remove('tr-anim'); void tip.offsetWidth; tip.classList.add('tr-anim');
    M.haptic && M.haptic(6);
    setTimeout(()=>{ const b = tip.querySelector('.tr-next'); b && b.focus({preventScroll:true}); }, 50);
  }
  function place(el){
    const W = innerWidth, H = innerHeight, pad = 8;
    if(!el){
      hole.className = 'tr-hole tr-none'; hole.style.cssText = 'left:' + (W / 2) + 'px;top:' + (H / 2) + 'px;width:0;height:0';
      tip.className = 'tr-tip tr-center'; tip.style.cssText = ''; return;
    }
    const r = el.getBoundingClientRect();
    const x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad), w = Math.min(W - 8, r.width + pad * 2), hh = Math.min(H - 8, r.height + pad * 2);
    const rad = Math.min(28, Math.max(14, Math.min(w, hh) / 2));
    hole.className = 'tr-hole'; hole.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + hh + 'px;border-radius:' + (el.matches('.nb-btn') ? '50%' : rad + 'px');
    tip.className = 'tr-tip';
    const below = y + hh + 14, tipH = tip.offsetHeight || 190;
    if(below + tipH < H - 10) tip.style.cssText = 'top:' + below + 'px';
    else if(y - 14 - tipH > 10) tip.style.cssText = 'top:' + (y - 14 - tipH) + 'px';
    else tip.style.cssText = 'top:' + Math.max(10, H - tipH - 110) + 'px';   // a tall part: the note sits over its lower half
  }
  const onRs = M.debounce(()=>{ if(!done) show(0); }, 150);
  addEventListener('resize', onRs);
  root.querySelector('.tr-block').addEventListener('click', e=>{ e.stopPropagation(); });
  hole.addEventListener('click', next);
  show(1);
};

/* settings → «جولة في التطبيق» */
M.SECTION_KW = M.SECTION_KW || {};
if(M.addSection) M.addSection({id:'tour', title:'جولة في التطبيق', icon:'t:hand-click', group:'أدوات', fn:()=>M.startTour(), noMore:true});
const place = ()=>{ if(!M.SECTION_ORG) return; const g = M.SECTION_ORG.find(x=>x[0] === 'أدوات'); if(g && !g[1].includes('tour')) g[1].push('tour'); };
place(); setTimeout(place, 300); setTimeout(place, 1500);
M.SECTION_KW.tour = 'جولة شرح تعريف ديمو مساعدة كيف استخدم التطبيق';
})();
