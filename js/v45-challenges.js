/* ===== 4.5 التحديات: personal challenges with a goal and a deadline, worked out from the app's own records where it can
   (pages read, prayers on time, adhkar ticked) and counted by hand where it cannot (salawat, istighfar, a custom dhikr).
   A daily reminder (notifications → «تذكير التحديات») tells what is left today. Everything stays on the phone. */
(function(){
'use strict';
const M = window.M, h = M.h;
const KEY = 'challenges';
const day0 = d=>{ const x = new Date(d || Date.now()); x.setHours(12, 0, 0, 0); return x; };
const daysBetween = (a, b)=>Math.round((day0(b) - day0(a)) / 864e5);

/* the kinds of challenge: how progress is measured, and how it is described */
const KINDS = {
  khatma:{t:'ختم القرآن', ic:'s:mushaf', c:'#2f7fc1', unit:'صفحة', goal:604, days:30, auto:true, sub:'المصحف كاملًا في مدة تختارها',
    prog:ch=>{ const pr = M.QD.pagesRead || {}, set = new Set(); Object.keys(pr).forEach(k=>{ if(k >= ch.start) (pr[k] || []).forEach(p=>set.add(p)); }); return set.size; },
    today:ch=>{ const pr = M.QD.pagesRead || {}; return ((pr[M.dkey()] || []).length); }, act:['اقرأ الآن', ()=>M.sectionOpen('quran')]},
  prayer:{t:'الصلاة في وقتها', ic:'s:mosque', c:'#1f8a70', unit:'يومًا', goal:40, days:40, auto:true, sub:'الصلوات الخمس في أوقاتها كل يوم',
    prog:ch=>{ if(!M.PL) return 0; let n = 0; for(let i = 0; i <= daysBetween(ch.start, Date.now()); i++){ const d = M.addDays(M.parseKey(ch.start), i), x = M.PL.day(d); if(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].every(k=>x[k] === 'o' || x[k] === 'j')) n++; } return n; },
    today:()=>{ if(!M.PL) return 0; const x = M.PL.day(new Date()); return ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter(k=>x[k] === 'o' || x[k] === 'j').length; }, todayOf:5,
    act:['سجل الصلوات', ()=>M.sectionOpen('tracker')]},
  adhkar:{t:'أذكار الصباح والمساء', ic:'sunrise', c:'#c4840f', unit:'يومًا', goal:30, days:30, auto:true, sub:'كل يوم، صباحًا ومساءً',
    prog:ch=>{ if(!M.T) return 0; let n = 0; for(let i = 0; i <= daysBetween(ch.start, Date.now()); i++){ const k = M.dkey(M.addDays(M.parseKey(ch.start), i)); if(M.T.get(k, 'adhkar_morning') && M.T.get(k, 'adhkar_evening')) n++; } return n; },
    today:()=>M.T ? (M.T.get(M.dkey(), 'adhkar_morning') ? 1 : 0) + (M.T.get(M.dkey(), 'adhkar_evening') ? 1 : 0) : 0, todayOf:2,
    act:['أذكار الآن', ()=>M.openAdhkarCategory && M.openAdhkarCategory(new Date().getHours() < 14 ? 'morning' : 'evening')]},
  salawat:{t:'الصلاة على النبي ﷺ', ic:'s:muhammad', c:'#7a4fb5', unit:'مرة', goal:1000, days:7, sub:'«مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا» — رواه مسلم', dhikr:'اللهم صل وسلم على نبينا محمد'},
  istighfar:{t:'الاستغفار', ic:'sparkle', c:'#0f8f9e', unit:'مرة', goal:1000, days:10, sub:'«وَاللَّهِ إِنِّي لَأَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ فِي الْيَوْمِ أَكْثَرَ مِنْ سَبْعِينَ مَرَّةً» — رواه البخاري', dhikr:'أستغفر الله وأتوب إليه'},
  tasbih:{t:'سبحان الله وبحمده', ic:'s:beads', c:'#cf4b63', unit:'مرة', goal:1000, days:10, sub:'«مَنْ قَالَ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ فِي يَوْمٍ مِائَةَ مَرَّةٍ حُطَّتْ خَطَايَاهُ» — متفق عليه', dhikr:'سبحان الله وبحمده'},
  custom:{t:'تحدٍّ من اختيارك', ic:'star', c:'#5c7a2e', unit:'مرة', goal:100, days:7, sub:'ذكر أو عمل تختاره'}
};
const all = ()=>M.store.get(KEY, []) || [];
const save = l=>{ M.store.set(KEY, l); M.emit && M.emit('settings', 'nf'); };   // the reminder text follows the challenges
const kindOf = ch=>KINDS[ch.kind] || KINDS.custom;
function state(ch){
  const K = kindOf(ch), have = K.prog ? K.prog(ch) : (ch.count || 0), goal = ch.goal || K.goal;
  const passed = Math.max(0, daysBetween(ch.start, Date.now())), left = Math.max(0, ch.days - passed);
  const pct = Math.min(1, have / goal), done = have >= goal, over = !done && passed >= ch.days;
  const perDay = left > 0 ? Math.ceil(Math.max(0, goal - have) / left) : Math.max(0, goal - have);
  const expected = Math.min(1, (passed + 1) / ch.days);   // where one would be at an even pace
  return {K, have, goal, passed, left, pct, done, over, perDay, ahead:pct >= expected - .02};
}
const CHEER = [[0, 'بداية جيدة'], [.25, 'ربع الطريق'], [.5, 'نصف الطريق'], [.75, 'اقتربت'], [.95, 'الخطوة الأخيرة']];
const cheer = s=>s.done ? 'اكتمل التحدي' : s.over ? 'انتهت المدة، ويمكنك تمديدها' : (CHEER.filter(x=>s.pct >= x[0]).pop() || CHEER[0])[1];

/* the reminder for a given day (used by the notifications): what is left today, for each running challenge */
M.challengesNote = function(){
  const run = all().filter(ch=>{ const s = state(ch); return !s.done && !s.over; });
  if(!run.length) return null;
  const parts = run.slice(0, 3).map(ch=>{ const s = state(ch); return (ch.title || s.K.t) + ': ' + (s.K.todayOf ? M.n(s.K.todayOf) + ' اليوم' : 'اليوم ' + M.n(s.perDay) + ' ' + s.K.unit); });
  return {title:run.length === 1 ? 'تحدّيك اليوم' : 'تحدّياتك اليوم (' + M.n(run.length) + ')', body:parts.join('\n')};
};

function celebrate(host){
  const c = h('div.ch-burst', {'aria-hidden':'true'});
  for(let i = 0; i < 26; i++){ const b = h('i'); b.style.setProperty('--a', (i * 360 / 26) + 'deg'); b.style.setProperty('--d', (60 + Math.random() * 70) + 'px'); b.style.background = ['#f2b23a', '#1f8a70', '#cf4b63', '#2f7fc1', '#7a4fb5'][i % 5]; c.append(b); }
  host.append(c); setTimeout(()=>c.remove(), 1300); M.haptic && M.haptic(40);
}

/* ---------------- the screen ---------------- */
M.openChallenges = function(){
  let un = null;
  M.openView({id:'challenges', title:'التحديات', onClose:()=>{ try{ un && un(); }catch(e){} un = null; }, build:(b, view)=>{
    b.classList.add('ch-body');
    function card(ch, i){
      const s = state(ch), K = s.K, ring = M.ring(s.pct, 74, 7, M.n(Math.floor(s.pct * 100)) + '٪');
      const el = h('article.ch-card' + (s.done ? '.done' : s.over ? '.over' : ''), {style:'--cc:' + K.c});
      const head = h('div.ch-h', h('span.ch-ic', {html:M.icon(K.ic)}), h('div.grow', h('b', ch.title || K.t),
        h('small', M.n(s.have) + ' / ' + M.n(s.goal) + ' ' + K.unit + ' • ' + (s.done ? 'مكتمل' : s.over ? 'انتهت المدة' : 'بقي ' + M.cnt(s.left, 'يوم')))), ring);
      const tag = h('div.ch-cheer' + (s.ahead ? '.ok' : ''), s.done || s.over ? cheer(s) : cheer(s) + (s.ahead ? ' · في الموعد' : ' · ' + M.n(s.perDay) + ' ' + K.unit + ' يوميًا'));
      el.append(head, h('div.ch-bar', h('i', {style:'width:' + (s.pct * 100).toFixed(1) + '%'}), h('b', {style:'inset-inline-start:' + Math.min(100, (s.passed + .5) / ch.days * 100).toFixed(1) + '%'})), tag);
      const tools = h('div.ch-tools');
      if(!K.prog && !s.done){
        /* counted by hand: a big tap target and quick additions */
        const add = n=>{ const l = all(), x = l[i]; if(!x) return; x.count = (x.count || 0) + n; save(l); M.haptic && M.haptic(n > 1 ? 14 : 6);
          const was = s.done, st = state(x); paint(); if(!was && st.done){ const c = b.querySelectorAll('.ch-card')[i]; if(c) celebrate(c); M.toast && M.toast('اكتمل التحدي'); } };
        tools.append(h('button.ch-tap', {onclick:()=>add(1)}, h('b', ch.dhikr || K.dhikr || ch.title || K.t), h('small', 'اضغط مع كل مرة')),
          h('div.ch-adds', ...[10, 33, 100].map(n=>h('button', {onclick:()=>add(n)}, '+' + M.n(n)))));
      } else if(K.act && !s.done) tools.append(h('button.ch-go', {onclick:K.act[1]}, M.ic('fwd'), K.act[0], K.todayOf ? h('span.ch-td', M.n(K.today(ch)) + '/' + M.n(K.todayOf) + ' اليوم') : K.today ? h('span.ch-td', M.n(K.today(ch)) + ' ' + K.unit + ' اليوم') : null));
      tools.append(h('div.ch-more',
        s.over ? h('button.btn.sm.tonal', {onclick:()=>{ const l = all(); l[i].days += 7; save(l); paint(); }}, M.ic('plus'), 'مدّد أسبوعًا') : null,
        h('button.btn.sm.tonal', {onclick:()=>M.share('تحدّي ' + (ch.title || K.t) + ': ' + M.n(s.have) + ' من ' + M.n(s.goal) + ' ' + K.unit + '\nتطبيق المسلم')}, M.ic('share'), 'شارك'),
        h('button.btn.sm.tonal.ch-del', {onclick:async()=>{ if(await M.confirm('حذف هذا التحدي؟', 'حذف')){ const l = all(); l.splice(i, 1); save(l); paint(); } }}, M.ic('trash'))));
      el.append(tools);
      return el;
    }
    function picker(){
      const grid = h('div.ch-kinds', ...Object.entries(KINDS).map(([k, K])=>h('button.ch-kind', {style:'--cc:' + K.c, onclick:()=>setup(k)}, h('span.ch-ic', {html:M.icon(K.ic)}), h('b', K.t), h('small', K.sub))));
      const sh = M.sheet({title:'تحدٍّ جديد', content:grid});
      function setup(k){
        const K = KINDS[k]; let goal = K.goal, days = K.days, title = '', dh = '';
        const box = h('div.ch-setup');
        const step = (lbl, get, set, d, min, max, unit)=>{ const v = h('b.num', M.n(get()) + ' ' + unit);
          const ch = n=>{ set(Math.max(min, Math.min(max, get() + n))); v.textContent = M.n(get()) + ' ' + unit; M.haptic && M.haptic(5); };
          return h('div.ch-row', h('span', lbl), h('div.ch-step', h('button', {onclick:()=>ch(-d)}, '−'), v, h('button', {onclick:()=>ch(d)}, '+'))); };
        const presets = (vals, unit, set, show)=>h('div.chips.ch-pre', ...vals.map(x=>h('button.chip', {onclick:()=>{ set(x); show(); }}, M.n(x) + ' ' + unit)));
        const draw = ()=>{
          box.replaceChildren(h('div.ch-sh', h('span.ch-ic', {style:'--cc:' + K.c, html:M.icon(K.ic)}), h('div', h('b', K.t), h('small', K.sub))));
          if(k === 'custom'){
            box.append(h('input.field', {placeholder:'اسم التحدي (مثل: قيام الليل، صدقة يومية)', value:title, maxLength:40, oninput:e=>{ title = e.target.value; }}),
              h('input.field', {placeholder:'الذكر أو العمل الذي يُعدّ (اختياري)', value:dh, maxLength:60, oninput:e=>{ dh = e.target.value; }, style:'margin-top:8px'}));
          }
          if(!K.prog){ box.append(step('العدد المطلوب', ()=>goal, v=>goal = v, goal >= 1000 ? 100 : 10, 10, 100000, K.unit), presets([100, 1000, 3000, 10000], K.unit, v=>goal = v, draw)); }
          if(k === 'prayer' || k === 'adhkar'){ box.append(step('عدد الأيام', ()=>days, v=>{ days = v; goal = v; }, 1, 3, 365, 'يومًا'), presets([7, 21, 30, 40], 'يومًا', v=>{ days = v; goal = v; }, draw)); }
          else box.append(step('خلال', ()=>days, v=>days = v, 1, 1, 365, 'يومًا'), presets(k === 'khatma' ? [7, 15, 30, 60] : [1, 7, 10, 30], 'يومًا', v=>days = v, draw));
          if(k === 'khatma') box.append(h('div.ch-hint', 'نحو ' + M.n(Math.ceil(604 / days)) + ' صفحة يوميًا. تُحسب من قراءتك في المصحف.'));
          if(K.prog && k !== 'khatma') box.append(h('div.ch-hint', 'يُحسب مما تسجّله في التطبيق.'));
          box.append(h('label.ch-row.ch-nf', h('span', 'تذكير يومي بالتحديات'), M.switchEl(M.nfOn ? M.nfOn('challenges') : false, v=>M.nfSet && M.nfSet('challenges', {on:v}))),
            h('button.btn.block', {style:'margin-top:12px', onclick:()=>{
              if(k === 'custom' && !title.trim()){ M.toast && M.toast('اكتب اسم التحدي'); return; }
              const l = all(); l.unshift({id:Date.now(), kind:k, start:M.dkey(), days, goal:k === 'khatma' ? 604 : goal, title:title.trim(), dhikr:dh.trim(), count:0}); save(l);
              if(M.nfSet && M.nfOn && !M.nfOn('challenges') && !M.store.get('ch:nfAsked', false)){ M.store.set('ch:nfAsked', true); M.nfSet('challenges', {on:true}); }
              try{ sh.close(); }catch(e){} paint(); M.toast && M.toast('بدأ التحدي'); }}, M.ic('check'), 'ابدأ التحدي'));
        };
        draw(); grid.replaceWith(box);
      }
    }
    function paint(){
      const l = all(), run = l.filter(ch=>{ const s = state(ch); return !s.done && !s.over; }).length, won = l.filter(ch=>state(ch).done).length;
      b.replaceChildren(
        h('div.ch-hero', h('div.ch-hrow', h('span.ch-hic', {html:M.icon(M.icon('trophy') !== M.icon('zzz-none') ? 'trophy' : 's:star8')}), h('div.grow', h('div.ch-ht.title-font', 'التحديات'), h('div.ch-hs', 'هدف ومدة، وتقدّم تراه كل يوم'))),
          h('div.ch-stats', h('span', h('b.num', M.n(run)), 'قائم'), h('span', h('b.num', M.n(won)), 'مكتمل'), h('span', h('b.num', M.n(l.length)), 'الكل')),
          h('button.ch-new', {onclick:picker}, M.ic('plus'), 'تحدٍّ جديد')));
      if(!l.length) b.append(h('div.ch-empty', h('b', 'لا توجد تحديات'), h('span', 'ابدأ بواحد من هذه:'),
        h('div.ch-sug', ...['khatma', 'prayer', 'salawat'].map(k=>h('button.chip', {onclick:picker}, KINDS[k].t)))));
      l.forEach((ch, i)=>b.append(card(ch, i)));
      b.append(h('div.ch-foot', 'تُحفظ على جهازك. التذكير من الإشعارات.'));
    }
    paint();
    un = M.on('plog', ()=>{ if(b.isConnected) paint(); });
  }});
};
try{ M.addSection({id:'challenges', title:'التحديات', icon:'s:star8', group:'عباداتي', fn:()=>M.openChallenges()}); }catch(e){ console.error(e); }
})();
