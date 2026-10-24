/* ===== Quran extras: khatma, go-to-page, reciter picker ===== */
(function(){
'use strict';
const M = window.M, h = M.h;

/* ---- reciters ---- */
const COLORS = ['#0f8a6d', '#c0873a', '#3b6fb6', '#8e4fa8', '#b5473f', '#2f7f8a', '#6b7f2f', '#a05a2c'];
M.openReciters = function(done){
  const view = M.openView({id:'reciters', title:'تغيير القارئ', build:b=>{
    const q = h('input.field', {placeholder:'ابحث عن قارئ…', type:'search', oninput:()=>draw()});
    const l = h('div.list.card'); b.append(q, l);
    function draw(){
      l.innerHTML = ''; const nq = M.normAr(q.value.trim());
      M.RECITERS.forEach(([id, n], i)=>{
        if(nq && !M.normAr(n).includes(nq)) return;
        const on = M.cfg.reciter === id;
        const initials = n.replace(/^(الشيخ|محمد|محمود|عبد|أحمد|ال)\s*/, '').trim().slice(0, 1) || n.slice(0, 1);
        l.append(h('button.item.reciter'+(on ? '.on' : ''), {onclick:()=>{ M.save('reciter', id); M.toast('القارئ: '+n); draw(); done && done(); }},
          h('span.nf-radio'), h('div.grow.t', n), h('span.avatar', {style:'background:'+COLORS[i % COLORS.length]}, initials)));
      });
    }
    draw();
  }});
};

/* ---- go to page ---- */
M.goToPageSheet = function(){
  const inp = h('input.field', {type:'number', min:1, max:604, inputmode:'numeric', placeholder:'رقم الصفحة (١–٦٠٤)', style:'text-align:center;font-size:1.3rem'});
  const sh = M.sheet({title:'الانتقال إلى صفحة', content:h('div.col-flex',
    inp,
    h('button.btn.block', {onclick:()=>{ const p = Math.max(1, Math.min(604, +inp.value || 0)); if(!p) return; sh.close(); M.openReader({page:p}); }}, 'اذهب إلى الصفحة'),
    h('button.btn.tonal.block', {onclick:()=>{ const p = Math.max(1, Math.min(604, +inp.value || 0)); if(!p) return; const bms = M.QD.bookmarks; if(!bms.some(x=>x.page === p && !x.sura)){ bms.push({page:p, t:Date.now()}); M.QD.bookmarks = bms; } M.toast('تم حفظ الصفحة '+M.arNum(p)); }}, 'احفظ رقم الصفحة'),
    h('div.tiny.muted', {style:'line-height:1.8'}, 'يمكنك حفظ رقم الصفحة لتعود إليها لاحقًا من تبويب «العلامات» أو «الصفحات».'))});
  setTimeout(()=>inp.focus(), 300);
};

/* ---- khatma ---- */
const KEY = 'khatmas';
const list = ()=>M.store.get(KEY, []);
const save = a=>M.store.set(KEY, a);
function pagesReadSince(iso){
  const set = new Set(), pr = M.QD.pagesRead || {};
  Object.keys(pr).forEach(d=>{ if(d >= iso) (pr[d] || []).forEach(p=>set.add(p)); });
  return set.size;
}
M.openKhatma = function(){
  const view = M.openView({id:'khatma', title:'الختمة', build:b=>{
    const box = h('div.col-flex'); b.append(box);
    function draw(){
      box.innerHTML = '';
      const a = list(); const active = a.filter(k=>!k.done), done = a.filter(k=>k.done);
      if(!active.length){
        box.append(M.hero({icon:'s:khatma', kicker:'ختم القرآن الكريم', title:'ابدأ ختمة جديدة', sub:'اختر المدة ويحسب لك التطبيق وردك اليومي ويتابع تقدّمك من صفحات قراءتك.'}));
        box.append(h('div.kh-plans', ...[[7, 'أسبوع'], [15, 'نصف شهر'], [30, 'شهر'], [60, 'شهران'], [90, '٣ أشهر'], [365, 'سنة']].map(([d, l])=>h('button.kh-plan', {onclick:()=>{ const a2 = list(); a2.push({id:Date.now(), name:'', start:M.dkey(), days:d}); save(a2); draw(); M.toast('بدأت ختمتك — بارك الله فيك'); }},
          h('b', l), h('span.num', '≈ '+M.cnt(Math.ceil(604 / d), 'صفحة', false, 'صفحات')+' يوميًا')))),
          h('button.btn.tonal.block', {onclick:()=>newOne()}, M.ic('plus'), 'ختمة باسم ومدة أخرى'));
      }
      active.forEach(k=>{
        const n = Math.min(604, pagesReadSince(k.start)), pct = n / 604;
        const daysPassed = Math.max(1, Math.round((Date.now() - new Date(k.start).getTime()) / 864e5) + 1);
        const left = Math.max(1, k.days - daysPassed + 1), perDay = Math.ceil((604 - n) / left), todayRead = ((M.QD.pagesRead || {})[M.dkey()] || []).length;
        box.append(M.hero({icon:'s:khatma', kicker:'بدأت '+k.start+' • الهدف '+M.cnt(k.days, 'يوم', false, 'يومًا'), title:k.name || 'ختمتي', sub:'قرأت '+M.n(n)+' من ٦٠٤ صفحة', side:M.ring(pct, 76, 7, M.n(Math.round(pct * 100))+'٪'),
          stats:[[M.n(perDay), 'ورد اليوم (صفحات)'], [M.n(Math.min(todayRead, perDay))+'/'+M.n(perDay), 'قرأت اليوم'], [M.n(left), 'يوم متبقٍّ']],
          foot:h('div.kh-acts', h('button.btn.kh-go', {onclick:()=>{ const l = M.QD.last; M.openReader({page:l.page, sura:l.sura, ayah:l.ayah}); }}, M.ic('quran'), 'تابع القراءة'),
            h('button.btn.tonal.kh-sec', {onclick:async()=>{ if(await M.confirm('سيتم إنهاء هذه الختمة وتسجيلها.', 'إنهاء', 'إنهاء الختمة؟')){ const x = list(); const f2 = x.find(y=>y.id === k.id); f2.done = M.dkey(); save(x); draw(); M.toast('تقبّل الله منك'); } }}, M.ic('check'), 'أتممتها'),
            h('button.icon-btn.kh-del', {'aria-label':'حذف الختمة', onclick:async()=>{ if(await M.confirm('سيتم حذف الختمة.', 'حذف', 'حذف الختمة؟')){ save(list().filter(y=>y.id !== k.id)); draw(); } }}, M.ic('trash')))}));
        box.append(h('div.kh-bar', h('i', {style:'width:'+pct * 100+'%'}), h('span.num', M.n(604 - n)+' صفحة متبقية')));
      });
      if(active.length) box.append(h('button.btn.tonal.block', {onclick:()=>newOne()}, M.ic('plus'), 'ختمة أخرى'));
      if(M.khatmaExtra) try{ box.append(h('div.section-h', 'ورد الآيات اليومي'), M.khatmaExtra(draw)); }catch(e){}   // the verse-by-verse khatma (pop-up card + widget)
      if(M.khatmaStats) try{ box.append(M.khatmaStats()); }catch(e){}   // statistics right here, in the khatma screen
      box.append(h('div.section-h', 'ختماتي المكتملة', h('small', M.n(done.length))));
      if(!done.length) box.append(h('div.muted.small', {style:'margin:0 4px'}, 'لا توجد ختمات مكتملة بعد.'));
      done.forEach(k=>box.append(h('div.item.card.static.kh-done', h('span.lead', {html:M.icon('trophy')}), h('div.grow', h('div.t', k.name || 'ختمة'), h('div.s', k.start+' ← '+k.done)))));
    }
    function newOne(){
      const name = h('input.field', {placeholder:'اسم الختمة (اختياري)'});
      let days = 30;
      const sh = M.sheet({title:'ختمة جديدة', content:h('div.col-flex', name, h('div.small.muted', 'خلال كم يومًا؟'), M.chips([[7,'٧ أيام'],[15,'١٥ يومًا'],[30,'٣٠ يومًا'],[60,'٦٠ يومًا'],[90,'٩٠ يومًا'],[365,'سنة']], days, v=>{ days = +v; }),
        h('button.btn.block', {onclick:()=>{ const a = list(); a.push({id:Date.now(), name:name.value.trim(), start:M.dkey(), days}); save(a); sh.close(); draw(); }}, 'ابدأ'))});
    }
    draw();
  }});
};
})();
