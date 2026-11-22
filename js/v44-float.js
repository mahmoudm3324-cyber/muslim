/* ===== 4.4 الأزرار العائمة: one place for the three floating buttons (the app's menu circle, the recitation player, the khatma / adhkar circle)
   - a close target at the bottom, like chat heads: drag a circle onto it to dismiss it
   - a size for each, and putting them back where they started
   Each circle keeps its own drag code; this file only gives them the target and the sizes. */
(function(){
'use strict';
const M = window.M, h = M.h;

/* ---------------- the close target ---------------- */
let kz = null, hot = false, want = false;
function ensure(){
  if(kz && kz.isConnected) return kz;
  kz = h('div.kz', {'aria-hidden':'true'}, h('span.kz-c', M.ic('close')), h('small.kz-t', 'اسحب هنا للإغلاق'));
  (document.getElementById('app') || document.body).append(kz);
  return kz;
}
M.killZone = {
  show(){ ensure(); want = true; requestAnimationFrame(()=>{ if(kz && want) kz.classList.add('on'); }); },
  hide(){ want = false; if(kz) kz.classList.remove('on', 'hot'); hot = false; },
  /* is (cx, cy) — a circle's centre — over the target? Returns the target's centre to snap to, or null */
  test(cx, cy){
    ensure();
    const r = kz.querySelector('.kz-c').getBoundingClientRect(), c = {x:r.left + r.width / 2, y:r.top + r.height / 2};
    const near = Math.hypot(cx - c.x, cy - c.y) < 92;
    if(near !== hot){ hot = near; kz.classList.toggle('hot', near); if(near && M.haptic) M.haptic(14); }
    return near ? c : null;
  },
  get hot(){ return hot; }
};

/* ---------------- sizes ---------------- */
const SC = {sm:.82, md:1, lg:1.16};
function applySizes(){
  const r = document.documentElement.style;
  r.setProperty('--fb-nav', SC[M.cfg.fbNav || 'md'] || 1);
  r.setProperty('--fb-np', SC[M.cfg.fbNp || 'md'] || 1);
}
applySizes();
M.on && M.on('settings', k=>{ if(k === 'fbNav' || k === 'fbNp' || typeof k === 'object') applySizes(); });

/* ---------------- the settings page ---------------- */
const S = M.SETSUB = M.SETSUB || {};
S.floaters = {title:'الأزرار العائمة', build(b){
  /* each size control carries a live preview circle */
  const PV = {sm:.82, md:1, lg:1.16};
  const seg3 = (val, fn, ic)=>{
    const dot = h('span.fb-pv', {html:M.icon(ic || 's:grid')}); dot.style.transform = 'scale(' + (PV[val] || 1) + ')';
    const seg = M.seg([['sm', 'صغير'], ['md', 'متوسط'], ['lg', 'كبير']], val, v=>{ dot.style.transform = 'scale(' + (PV[v] || 1) + ')'; fn(v); M.haptic && M.haptic(6); });
    return h('div.fb-size', seg, h('span.fb-pvbox', dot));
  };
  const pc = M.popupCfg ? M.popupCfg.u() : {};
  const card = (ic, t, sub, ...rows)=>h('div.card.fb-card', h('div.fb-h', h('span.fb-ic', {html:M.icon(ic)}), h('div.grow', h('b', t), h('small', sub))), ...rows);
  const row = (l, ctl)=>h('div.fb-row', h('span', l), ctl);
  b.append(
    h('div.fb-intro', 'اسحب الدائرة لأي مكان. لإغلاقها أفلتها على ✕ أسفل الشاشة.'),
    card('s:grid', 'زر التنقّل', 'الدائرة التي تفتح أقسام التطبيق',
      row('الحجم', seg3(M.cfg.fbNav || 'md', v=>M.save('fbNav', v), 's:grid')),
      row('شفاف حين لا تستخدمه', M.switchEl(M.cfg.bubbleDim !== false, v=>M.save('bubbleDim', v)))),
    card('play', 'مشغّل التلاوة', 'يظهر أثناء الاستماع',
      row('الحجم', seg3(M.cfg.fbNp || 'md', v=>M.save('fbNp', v), 'play'))),
    card('s:mushaf', 'دائرة الختمة والأذكار', 'عند تصغير الختمة أو الأذكار',
      row('الحجم', seg3(pc.bsz || 'sm', v=>{ M.popupCfg && M.popupCfg.uset({bsz:v}); M.popupBubbleSize && M.popupBubbleSize(); }, 's:mushaf')),
      row('تبدأ مصغّرة', M.switchEl(!!pc.bubble, v=>M.popupCfg && M.popupCfg.uset({bubble:v})))),
    h('button.btn.tonal.block', {style:'margin-top:6px', onclick:()=>{
      try{ M.bubble && M.bubble.reset ? M.bubble.reset() : M.store.set('nbPos', null); M.npReset && M.npReset(); M.popupCfg && M.popupCfg.uset({by:.62, bs:''}); M.popupBubbleSize && M.popupBubbleSize(); }catch(e){}
      M.toast && M.toast('تمت الإعادة'); }}, M.ic('refresh'), 'إرجاع الأزرار إلى أماكنها'));
}};
})();
