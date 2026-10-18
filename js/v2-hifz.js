/* ===== v2 hifz: memorization planner & reviewer (plans, SM-2 style spaced repetition, test mode, listen-and-repeat, streak) ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const KEY = 'hifz2';
const DAILY = [1, 2, 3, 5, 7, 10, 15, 20];
const LEVELS = [0, 25, 50, 75, 100];
const GRADES = [['نسيت', 1, 'bad'], ['صعبة', 3, 'hard'], ['جيدة', 4, 'good'], ['سهلة', 5, 'easy']];
const load = ()=>{ const d = M.store.get(KEY, null); return d && typeof d === 'object' ? Object.assign({plans:[], items:{}, log:{}}, d) : {plans:[], items:{}, log:{}}; };
const persist = D=>{ if(M.store.set(KEY, D) === false) M.toast('تعذّر الحفظ — مساحة التخزين ممتلئة'); };
const today = ()=>M.dkey();
const plusDays = n=>M.dkey(M.addDays(new Date(), n));
const dayDiff = k=>Math.round((M.parseKey(k) - M.parseKey(today())) / 864e5);
const rel = k=>{ const d = dayDiff(k); return d <= 0 ? 'اليوم' : d === 1 ? 'غدًا' : 'بعد ' + M.cnt(d, 'يوم', true, 'يومًا'); };
const rangeLbl = (a, b)=>a === b ? 'الآية ' + M.n(a) : 'الآيات ' + M.n(a) + '–' + M.n(b);
const itemKey = (pid, a, b)=>pid + ':' + a + '-' + b;
/* SM-2: q = 1..5 (below 3 = forgotten) */
function sm2(it, q){
  let {ef = 2.5, n = 0, int = 0} = it;
  if(q < 3){ n = 0; int = 1; }
  else { n++; int = n === 1 ? 1 : n === 2 ? 4 : Math.round(int * ef); if(q === 3) int = Math.max(1, Math.round(int * 0.7)); }
  ef = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Object.assign(it, {ef, n, int, due:plusDays(int), last:today()});
}
function streak(D){
  let s = 0, d = new Date(); const done = k=>{ const l = D.log[k]; return l && (l.n + l.r) > 0; };
  if(!done(M.dkey(d))) d = M.addDays(d, -1);
  while(done(M.dkey(d))){ s++; d = M.addDays(d, -1); if(s > 3650) break; }
  return s;
}
function bump(D, field){ const k = today(); D.log[k] = D.log[k] || {n:0, r:0}; D.log[k][field]++; }

/* ---------- pickers ---------- */
function surahSel(v, on){
  const el = h('select.field', {'aria-label':'السورة', onchange:e=>on(+e.target.value)});
  M.Q.surahs.forEach((s, i)=>el.append(h('option', {value:i + 1}, M.n(i + 1) + '. ' + s.ar))); el.value = v; return el;
}
function numSel(n, v, on, lbl){ const el = h('select.field', {'aria-label':lbl, onchange:e=>on(+e.target.value)}); for(let i = 1; i <= n; i++) el.append(h('option', {value:i}, M.n(i))); el.value = v; return el; }
const chipsNum = (opts, v, on, inf)=>M.chips(opts.map(x=>[String(x), x === 0 ? '∞' : M.n(x)]), String(v), x=>on(+x));

/* ---------- test panel: hides words (progressive 25/50/75/100%), tap a word to reveal ---------- */
function testPanel(s, a, b, o){
  o = o || {};
  const st = {pct:o.pct == null ? 50 : o.pct, seed:1 + Math.floor(Math.random() * 9999)};
  const box = h('div.hz-test'), text = h('div.qfont.hz-text', {dir:'rtl'}), lv = h('div.hz-levels');
  let revAll = false;
  function rng(seed){ let x = seed >>> 0; return ()=>{ x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
  function draw(){
    text.replaceChildren(); const toks = [];
    for(let i = a; i <= b; i++){ M.ayahText(s, i).split(/\s+/).filter(Boolean).forEach(w=>toks.push({i, w})); }
    const idx = toks.map((_, k)=>k), r = rng(st.seed); for(let k = idx.length - 1; k > 0; k--){ const j = Math.floor(r() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; }
    const hide = new Set(idx.slice(0, Math.round(toks.length * st.pct / 100)));
    const wordsOf = {}; let cur = a;
    toks.forEach((t, k)=>{
      if(t.i !== cur){ marker(cur, wordsOf[cur]); cur = t.i; }
      const sp = h('span.hz-w' + (hide.has(k) && !revAll ? '.hid' : ''), {onclick:()=>{ sp.classList.toggle('hid'); M.haptic(5); }}, t.w);
      (wordsOf[t.i] = wordsOf[t.i] || []).push(sp); text.append(sp, ' ');
    });
    marker(cur, wordsOf[cur]);
    cnt.textContent = M.n(Math.round(toks.length * st.pct / 100)) + ' من ' + M.n(toks.length) + ' كلمة مخفية';
  }
  function marker(ay, spans){ text.append(h('button.hz-no', {'aria-label':'إظهار الآية ' + ay, onclick:()=>{ const hid = spans.some(x=>x.classList.contains('hid')); spans.forEach(x=>x.classList.toggle('hid', !hid)); }}, '۝' + M.n(ay)), ' '); }
  const cnt = h('div.tiny.muted.center');
  function drawLv(){ lv.replaceChildren(...LEVELS.map(p=>h('button.chip'+(st.pct === p ? '.on' : ''), {onclick:()=>{ st.pct = p; revAll = false; drawLv(); draw(); }}, M.n(p) + '٪'))); }
  box.append(h('div.small.muted', 'مستوى الإخفاء'), lv, h('div.card.pad.hz-card', text), cnt,
    h('div.row-flex.gap-s.hz-tools',
      h('button.btn.tonal.sm', {onclick:()=>{ st.seed = 1 + Math.floor(Math.random() * 9999); revAll = false; draw(); }}, M.ic('refresh'), 'إخفاء جديد'),
      h('button.btn.tonal.sm', {onclick:()=>{ revAll = true; draw(); }}, M.ic('eye'), 'إظهار الكل'),
      h('button.btn.tonal.sm', {onclick:()=>{ if(M.player) M.player.playRange(s, a, b, 1, 1); if(o.onPlay) o.onPlay(); }}, M.ic('play'), 'استمع')),
    h('div.tiny.muted.center', 'اضغط الكلمة المخفية لتظهر، ورقم الآية لإظهار الآية كلها.'));
  drawLv(); draw(); return box;
}

/* ---------- session: learn a new chunk / review an old one ---------- */
function openSession(D, task, done){
  const {s, a, b} = task; let played = false, each = 3;
  const view = M.openView({id:'hifz-s', title:task.kind === 'new' ? 'حفظ جديد' : 'مراجعة', onClose:()=>{ if(played && M.player && M.player.range) M.player.stop(); },
    build:bd=>{
      bd.append(h('div.card.pad.hz-sess', h('div.title-font.bold', 'سورة ' + M.sname(s)), h('div.small.muted', rangeLbl(a, b))));
      bd.append(testPanel(s, a, b, {pct:task.kind === 'new' ? 0 : 50, onPlay:()=>{ played = true; }}));
      bd.append(h('div.card.pad.col-flex', {style:'gap:8px'}, h('div.small.muted', 'استمع وكرّر — تكرار كل آية'), chipsNum([1, 3, 5, 10], each, v=>{ each = v; }),
        h('button.btn.tonal.block', {onclick:()=>{ played = true; M.player.playRange(s, a, b, each, 1); }}, M.ic('repeat'), 'استمع وكرّر')));
      if(task.kind === 'new'){
        bd.append(h('button.btn.block.hz-fin', {onclick:()=>{
          const D2 = load(), pl = D2.plans.find(x=>x.id === task.pid); if(!pl) return;
          pl.pos = Math.max(pl.pos, b + 1); pl.newDay = today();
          D2.items[itemKey(pl.id, a, b)] = {p:pl.id, s, a, b, ef:2.5, n:0, int:1, due:plusDays(1), last:today()};
          bump(D2, 'n'); persist(D2); M.toast('بارك الله فيك — موعد المراجعة غدًا'); view.close(); done();
        }}, M.ic('check'), 'حفظتُها'));
      } else {
        bd.append(h('div.card.pad.col-flex', {style:'gap:8px'}, h('div.small.muted', 'كيف كان استرجاعك؟'),
          h('div.hz-grades', ...GRADES.map(([l, q, c])=>h('button.btn.hz-g.' + c, {onclick:()=>{
            const D2 = load(), it = D2.items[task.key]; if(!it) return; sm2(it, q); bump(D2, 'r'); persist(D2);
            M.toast(q < 3 ? 'تُعاد المراجعة غدًا' : 'المراجعة القادمة ' + rel(it.due)); view.close(); done();
          }}, l)))));
      }
    }});
}

/* ---------- main screen ---------- */
M.openHifz = function(){
  const S = {tab:'today', t:{s:1, a:1, b:7}, ls:{s:1, a:1, b:7, each:3, loops:1}};
  let off = null, view = null, loadErr = false;
  const content = h('div.hz-content'), tabs = h('div.chips.hz-tabs');
  const TABS = [['today', 'اليوم', 'target'], ['plan', 'خطتي', 'list'], ['test', 'اختبار', 'eye'], ['listen', 'استماع', 'headphones']];
  function drawTabs(){ tabs.className = 'tabs2'; tabs.style.setProperty('--n', TABS.length); tabs.replaceChildren(...TABS.map(([k, l, ic])=>h('button.tabs2-b'+(S.tab === k ? '.on' : ''), {onclick:()=>{ S.tab = k; paint(); }}, M.ic(ic === 'headphones' ? 'volume' : ic), h('span', l)))); }
  function paint(){
    drawTabs(); content.replaceChildren();
    if(!M.Q.ready){ content.append(h('div.card.pad.center', loadErr ? h('div', 'تعذّر تحميل المصحف.', h('br'), h('button.btn.tonal.sm', {onclick:init}, M.ic('refresh'), 'إعادة المحاولة')) : 'جارٍ التحميل…')); return; }
    ({today:tToday, plan:tPlan, test:tTest, listen:tListen})[S.tab](content);
  }
  view = M.openView({id:'hifz', title:'مساعد الحفظ', onClose:()=>{ if(off) off(); }, build:b=>{ b.append(tabs, content); }});
  function init(){ loadErr = false; paint(); M.loadQuran().then(()=>{ if(!view.closed) paint(); }).catch(()=>{ loadErr = true; if(!view.closed) paint(); }); }

  /* ---- today ---- */
  function tasksOf(D){
    const t = [], k = today();
    D.plans.forEach(p=>{ if(p.pos <= p.to && p.newDay !== k){ t.push({kind:'new', pid:p.id, s:p.s, a:p.pos, b:Math.min(p.to, p.pos + p.daily - 1)}); } });
    Object.keys(D.items).forEach(key=>{ const it = D.items[key]; if(it.due <= k) t.push({kind:'rev', key, pid:it.p, s:it.s, a:it.a, b:it.b, due:it.due}); });
    t.sort((x, y)=>(x.kind === y.kind ? (x.due || '').localeCompare(y.due || '') : x.kind === 'rev' ? -1 : 1));
    return t;
  }
  function tToday(el){
    const D = load(), tasks = tasksOf(D), lg = D.log[today()] || {n:0, r:0}, doneN = lg.n + lg.r, total = doneN + tasks.length, st = streak(D);
    const memN = Object.values(D.items || {}).reduce((x, it)=>x + (it.b - it.a + 1), 0);
    el.append(M.hero({icon:'repeat', kicker:'مساعد الحفظ', title:total && doneN === total ? 'أتممت مهام اليوم' : tasks.length ? 'متبقٍّ '+M.cnt(tasks.length, 'مهمة', false, 'مهام') : 'لا مهام الآن',
      sub:total && doneN === total ? 'تقبّل الله منك، والمراجعة القادمة في «خطتي»' : 'الحفظ الجديد والمراجعة بالتكرار المتباعد', side:M.ring(total ? doneN / total : 0, 76, 7, h('b.num', M.n(doneN)+'/'+M.n(total))),
      stats:[[M.n(st), 'أيام متتالية'], [M.n(memN), 'آية محفوظة'], [M.n(D.plans.length), 'خطة']]}));
    if(!D.plans.length){ el.append(h('div.card.pad.center.hz-empty', h('div', 'ابدأ بإنشاء خطة حفظ: اختر السورة والمقدار اليومي، وسيجدول لك التطبيق الحفظ الجديد والمراجعة بالتكرار المتباعد.'), h('button.btn.block', {onclick:()=>{ S.tab = 'plan'; paint(); newPlan(); }}, M.ic('plus'), 'إنشاء خطة'))); return; }
    if(!tasks.length){ el.append(h('div.card.pad.center', h('div', M.ic('check'), ' لا شيء مستحق الآن.'), h('div.small.muted', 'المراجعة القادمة تظهر في «خطتي».'))); return; }
    const l = h('div.list.card');
    tasks.forEach(t=>l.append(M.item({icon:t.kind === 'new' ? 'sparkle' : 'refresh', title:(t.kind === 'new' ? 'حفظ جديد — ' : 'مراجعة — ') + 'سورة ' + M.sname(t.s), sub:rangeLbl(t.a, t.b) + (t.kind === 'rev' && dayDiff(t.due) < 0 ? ' • متأخرة ' + M.cnt(-dayDiff(t.due), 'يوم', false, 'يومًا') : ''), onClick:()=>openSession(D, t, paint), trail:M.openTasmee ? h('button.hz-ts', {'aria-label':'سمّع هذا المقطع', onclick:e=>{ e.stopPropagation(); M.openTasmee({s:t.s, a:t.a, b:t.b}); }}, M.ic('mic'), h('span', 'سمّع')) : M.ic('fwd')})));
    el.append(l);
  }

  /* ---- plans ---- */
  function newPlan(){
    const f = {s:1, from:1, to:M.Q.surahs[0].n, daily:3};
    const body = h('div.col-flex'), draw = ()=>{
      const n = M.Q.surahs[f.s - 1].n; f.to = Math.min(Math.max(f.to, f.from), n);
      body.replaceChildren(h('div.small.muted', 'السورة'), surahSel(f.s, v=>{ f.s = v; f.from = 1; f.to = M.Q.surahs[v - 1].n; draw(); }),
        h('div.grid2', h('div', h('div.small.muted', 'من آية'), numSel(n, f.from, v=>{ f.from = v; draw(); }, 'من آية')), h('div', h('div.small.muted', 'إلى آية'), numSel(n, f.to, v=>{ f.to = Math.max(v, f.from); draw(); }, 'إلى آية'))),
        h('div.small.muted', 'الحفظ اليومي (عدد الآيات)'), chipsNum(DAILY, f.daily, v=>{ f.daily = v; info(); }), inf,
        h('button.btn.block', {onclick:()=>{ const D = load(); D.plans.push({id:'p' + Date.now().toString(36), s:f.s, from:f.from, to:f.to, daily:f.daily, pos:f.from, newDay:'', created:today()}); persist(D); sh.close(); paint(); M.toast('تمت إضافة الخطة'); }}, M.ic('check'), 'إنشاء الخطة'));
      info();
    };
    const inf = h('div.card.pad.small.muted'), info = ()=>{ const tot = f.to - f.from + 1, days = Math.ceil(tot / f.daily); inf.textContent = M.cnt(tot, 'آية') + ' — تنتهي بإذن الله في نحو ' + M.cnt(days, 'يوم', true, 'يومًا') + ' بمعدل ' + M.cnt(f.daily, 'آية', true, 'آيات') + ' يوميًا'; };
    const sh = M.sheet({title:'خطة حفظ جديدة', content:body}); if(sh.el) sh.el.style.maxHeight = '90%'; draw();
  }
  function tPlan(el){
    const D = load();
    el.append(h('button.btn.block', {onclick:newPlan}, M.ic('plus'), 'خطة جديدة'));
    if(!D.plans.length) el.append(h('div.card.pad.center.muted', 'لا خطط بعد.'));
    D.plans.forEach(p=>{
      const tot = p.to - p.from + 1, mem = Math.max(0, Math.min(tot, p.pos - p.from)), pct = Math.round(mem / tot * 100), fin = p.pos > p.to;
      el.append(h('div.card.pad.hz-plan', h('div.row-flex', h('div.grow', h('div.title-font.bold', 'سورة ' + M.sname(p.s)), h('div.small.muted', rangeLbl(p.from, p.to) + ' • ' + M.n(p.daily) + ' يوميًا')),
        h('button.icon-btn', {'aria-label':'حذف الخطة', onclick:async ()=>{ if(!await M.confirm('حذف هذه الخطة وجدول مراجعتها؟', 'حذف')) return; const D2 = load(); D2.plans = D2.plans.filter(x=>x.id !== p.id); Object.keys(D2.items).forEach(k=>{ if(D2.items[k].p === p.id) delete D2.items[k]; }); persist(D2); paint(); }}, M.ic('trash'))),
        h('div.hz-bar', h('i', {style:'width:' + pct + '%'})), h('div.small', fin ? 'اكتمل الحفظ — أتمّ الله عليك النعمة' : 'حُفظ ' + M.n(mem) + ' من ' + M.n(tot) + ' آية (' + M.n(pct) + '٪)')));
    });
    const its = Object.values(D.items).sort((x, y)=>x.due.localeCompare(y.due));
    if(its.length){
      el.append(h('div.section-h', 'جدول المراجعة'));
      const l = h('div.list.card');
      its.slice(0, 40).forEach(it=>l.append(M.item({icon:'history', title:'سورة ' + M.sname(it.s) + ' — ' + rangeLbl(it.a, it.b), sub:'المراجعة ' + rel(it.due) + ' • كل ' + M.cnt(it.int, 'يوم', true), onClick:()=>openSession(D, {kind:'rev', key:itemKey(it.p, it.a, it.b), pid:it.p, s:it.s, a:it.a, b:it.b, due:it.due}, paint), trail:M.ic('fwd')})));
      el.append(l);
    }
  }

  /* ---- free test ---- */
  function tTest(el){
    const D = load(), t = S.t, p = D.plans[0];
    if(!S.tInit){ S.tInit = 1; if(p){ t.s = p.s; t.a = p.from; t.b = Math.min(p.to, p.from + 6); } }
    const out = h('div'), n = M.Q.surahs[t.s - 1].n; t.a = Math.min(t.a, n); t.b = Math.max(t.a, Math.min(t.b, n, t.a + 29));
    const redo = ()=>{ out.replaceChildren(testPanel(t.s, t.a, t.b, {pct:50})); };
    el.append(h('div.card.pad.col-flex', {style:'gap:8px'}, surahSel(t.s, v=>{ t.s = v; t.a = 1; t.b = Math.min(7, M.Q.surahs[v - 1].n); paint(); }),
      h('div.grid2', numSel(n, t.a, v=>{ t.a = v; if(t.b < v) t.b = v; paint(); }, 'من آية'), numSel(n, t.b, v=>{ t.b = Math.max(v, t.a); paint(); }, 'إلى آية')),
      h('div.tiny.muted', 'حتى ٣٠ آية في الاختبار الواحد.')), out); redo();
  }

  /* ---- listen & repeat ---- */
  function tListen(el){
    const l = S.ls, n = M.Q.surahs[l.s - 1].n; l.a = Math.min(l.a, n); l.b = Math.max(l.a, Math.min(l.b, n));
    const now = h('div.small.center.muted.hz-now'), upd = ()=>{ const P = M.player; now.textContent = P && P.s && P.range ? 'يُشغَّل: ' + M.player.label() : 'اختر المقطع ثم اضغط ابدأ'; };
    if(off) off(); off = M.on('player', ()=>{ if(now.isConnected) upd(); }); upd();
    el.append(h('div.card.pad.col-flex', {style:'gap:10px'}, surahSel(l.s, v=>{ l.s = v; l.a = 1; l.b = Math.min(5, M.Q.surahs[v - 1].n); paint(); }),
      h('div.grid2', h('div', h('div.small.muted', 'من آية'), numSel(n, l.a, v=>{ l.a = v; if(l.b < v) l.b = v; paint(); }, 'من آية')), h('div', h('div.small.muted', 'إلى آية'), numSel(n, l.b, v=>{ l.b = Math.max(v, l.a); paint(); }, 'إلى آية'))),
      h('div.small.muted', 'تكرار كل آية'), chipsNum([1, 2, 3, 5, 10], l.each, v=>{ l.each = v; }),
      h('div.small.muted', 'تكرار المقطع كاملًا'), chipsNum([1, 2, 3, 5, 10, 0], l.loops, v=>{ l.loops = v; }),
      h('div.row-flex.gap-s', h('button.btn.grow', {onclick:()=>{ if(l.b < l.a) return; M.player.playRange(l.s, l.a, l.b, l.each, l.loops); }}, M.ic('play'), 'ابدأ'), h('button.btn.tonal', {onclick:()=>{ M.player.stop(); }}, M.ic('stop'), 'إيقاف')), now),
      h('div.card.pad.small.muted', {style:'line-height:1.9'}, 'يستخدم المشغّل القارئ المختار في الإعدادات، ويلزم اتصال بالإنترنت ما لم تكن التلاوة محمّلة على الجهاز.'));
  }
  init();
  return view;
};
M.addSection({id:'hifz', title:'مساعد الحفظ', icon:'s:mushaf', group:'القرآن الكريم', fn:()=>M.openHifz()});
})();
