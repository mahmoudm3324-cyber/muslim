/* ===== Electronic tasbih ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const PRE = [
 {id:'sub', t:'سبحان الله', goal:33},
 {id:'ham', t:'الحمد لله', goal:33},
 {id:'akb', t:'الله أكبر', goal:33, hint:'في رواية لمسلم: «الله أكبر» أربعًا وثلاثين (٣٤) ليكتمل العدد مئة. يمكنك تغيير العدد من زر «الهدف».'},
 {id:'tah', t:'لا إله إلا الله وحده لا شريك له…', goal:1, hint:'تمام المئة: «لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير» مرة واحدة بعد ٣٣ + ٣٣ + ٣٣ (رواه مسلم).'},
 {id:'tah100', t:'لا إله إلا الله', goal:100},
 {id:'ist', t:'أستغفر الله', goal:100},
 {id:'sal', t:'اللهم صل وسلم على نبينا محمد', goal:100},
 {id:'haw', t:'لا حول ولا قوة إلا بالله', goal:100},
 {id:'sbh', t:'سبحان الله وبحمده', goal:100},
 {id:'cmb', t:'سبحان الله والحمد لله والله أكبر', goal:33}
];
const S = ()=>M.store.get('tasbih', {cur:'sub', counts:{}, goals:{}, custom:[], days:{}, loops:{}});
const W = s=>M.store.set('tasbih', s);
const all = s=>PRE.concat(s.custom || []);

M.openTasbih = function(){
  let s = S(); let auto = null;
  s.goals = s.goals || {}; s.custom = s.custom || []; s.days = s.days || {}; s.loops = s.loops || {}; s.counts = s.counts || {};
  const root = h('div.sb');
  const cur = ()=>all(s).find(x=>x.id === s.cur) || PRE[0];
  const goalOf = it=>(s.goals && s.goals[it.id]) || it.goal || 33;
  const vibOn = ()=>M.cfg.cntVib !== false, sndOn = ()=>M.cfg.tbSound !== undefined ? !!M.cfg.tbSound : (M.cfg.cntSound || M.cfg.cntSound === undefined);
  /* the counting tone: switched right here, for this app only (the phone's volume is not touched) */
  const sndBtn = h('button.icon-btn.sb-snd', {onclick:()=>{ M.save('tbSound', !sndOn()); drawSnd(); M.toast(sndOn() ? 'النغمة مفعّلة' : 'النغمة مكتومة'); if(sndOn()) M.beep(980, .05, .08); }});
  const drawSnd = ()=>{ const on = sndOn(); sndBtn.replaceChildren(M.ic(on ? 'volume' : 'mute')); sndBtn.setAttribute('aria-label', on ? 'كتم نغمة العدّ' : 'تشغيل نغمة العدّ'); sndBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); sndBtn.classList.toggle('off', !on); };
  drawSnd();
  const view = M.openView({title:'المسبحة', id:'tasbih', actions:[
    sndBtn,
    h('button.icon-btn', {'aria-label':'سجل التسبيح', onclick:()=>stats()}, M.ic('history')),
    h('button.icon-btn', {'aria-label':'إعدادات المسبحة', onclick:()=>prefs()}, M.ic('settings'))], onClose:()=>{ stopAuto(); try{ vbar && vbar.stop(); }catch(e){} }});
  view.body.classList.add('sb-body');
  view.body.append(root);
  /* counting by voice: one bar kept across redraws; it listens for the selected dhikr only */
  const vbar = M.voiceBar ? M.voiceBar(()=>tap(1), {phrase:()=>cur().t}) : null;

  function stopAuto(){ if(auto){ clearInterval(auto); auto = null; } }
  function tap(n){
    const it = cur(); const c = ((s.counts[it.id] || 0) + (n || 1));
    if(c < 0) return;
    s.counts[it.id] = c;
    const g = goalOf(it);
    const dk = M.dkey(); s.days[dk] = s.days[dk] || {}; s.days[dk][it.id] = Math.max(0, (s.days[dk][it.id] || 0) + (n || 1));
    let done = false;
    if(n > 0 && c % g === 0){ s.loops[it.id] = (s.loops[it.id] || 0) + 1; done = true; M.haptic(60); if(sndOn()) M.beep(660, .25, .2); M.toast('أتممت '+M.n(g)+' — '+it.t); }
    else if(n > 0){ if(vibOn()) M.haptic(30); if(sndOn()) M.beep(980, .05, .08); }
    W(s); update(n > 0, done);
  }

  /* ---------- layout ---------- */
  let els = {};
  function draw(){
    const it = cur(), g = goalOf(it);
    root.replaceChildren();
    // the adhkar to choose from
    const pick = h('div.sb-pick');
    all(s).forEach(x=>pick.append(h('button.sb-ch'+(x.id === s.cur ? '.on' : ''), {onclick:()=>{ stopAuto(); s.cur = x.id; W(s); draw(); if(vbar && vbar.refresh) vbar.refresh(); }},
      h('span.sb-ch-t', x.t), h('span.sb-ch-g.num', M.cnt(goalOf(x), 'مرة')))));
    pick.append(h('button.sb-ch.sb-add', {onclick:addCustom}, M.ic('plus'), h('span.sb-ch-t', 'ذكر مخصص')));
    root.append(pick);
    setTimeout(()=>{ const on = pick.querySelector('.on'); if(on) try{ on.scrollIntoView({inline:'center', block:'nearest'}); }catch(e){} }, 30);
    // the counter: a ring of beads, the whole circle is the button
    const R = 300, r = 128, cx = R / 2, beads = g <= 100 ? g : 0, NS = 'http://www.w3.org/2000/svg';
    let svg = '<svg viewBox="0 0 '+R+' '+R+'" aria-hidden="true"><circle class="sb-track" cx="'+cx+'" cy="'+cx+'" r="'+r+'"/><circle class="sb-arc" cx="'+cx+'" cy="'+cx+'" r="'+r+'" stroke-dasharray="'+(2 * Math.PI * r).toFixed(1)+'" stroke-dashoffset="'+(2 * Math.PI * r).toFixed(1)+'"/>';
    if(beads){ const br = beads > 50 ? 2.6 : beads > 34 ? 3.6 : 5.2; for(let i = 0; i < beads; i++){ const a = -Math.PI / 2 + i / beads * Math.PI * 2; svg += '<circle class="sb-bead" data-i="'+i+'" cx="'+(cx + Math.cos(a) * r).toFixed(1)+'" cy="'+(cx + Math.sin(a) * r).toFixed(1)+'" r="'+br+'"/>'; } }
    svg += '</svg>';
    const n = h('div.sb-n.num'), of = h('div.sb-of'), loop = h('div.sb-loop');
    const btn = h('button.sb-btn', {'aria-label':'سبّح — '+it.t, onclick:()=>tap(1), html:svg}, h('div.sb-in', n, of, loop));
    root.append(h('div.sb-stage', btn));
    root.append(h('div.sb-text.qfont', it.t));
    if(it.hint) root.append(h('div.sb-hint', it.hint));
    if(vbar) root.append(vbar);
    const tool = (ic, l, fn, cls)=>h('button.sb-tool'+(cls || ''), {onclick:fn}, h('span.sb-tool-i', M.ic(ic)), h('span', l));
    root.append(h('div.sb-tools',
      tool('undo', 'تراجع', ()=>tap(-1)),
      tool(auto ? 'pause' : 'play', auto ? 'إيقاف' : 'تلقائي', toggleAuto, auto ? '.on' : ''),
      tool('target', 'الهدف', setGoal),
      tool('refresh', 'تصفير', async()=>{ if(await M.confirm('تصفير عدّاد «'+it.t+'»؟', 'تصفير')){ s.counts[it.id] = 0; W(s); update(); } })));
    const stToday = h('b.num'), stAll = h('b.num'), stLoops = h('b.num');
    root.append(h('div.sb-stats', h('div', stToday, h('span', 'اليوم')), h('div', stAll, h('span', 'هذا الذكر')), h('div', stLoops, h('span', 'دورات مكتملة'))));
    els = {btn, n, of, loop, stToday, stAll, stLoops, arc:btn.querySelector('.sb-arc'), beads:[...btn.querySelectorAll('.sb-bead')], C:2 * Math.PI * r};
    update();
  }
  function update(bump, done){
    if(!els.btn) return;
    const it = cur(), g = goalOf(it), c = s.counts[it.id] || 0, inLoop = c % g, full = c > 0 && inLoop === 0, k = full ? g : inLoop;
    els.n.textContent = c === 0 ? 'ابدأ' : M.n(k); els.n.classList.toggle('sb-start', c === 0);
    els.of.textContent = c === 0 ? 'اضغط الدائرة أو انطق الذكر' : 'من '+M.n(g);
    const loops = s.loops[it.id] || 0; els.loop.textContent = loops ? 'الدورة '+M.n(loops + (full ? 0 : 1)) : ''; els.loop.hidden = !loops;
    els.arc.setAttribute('stroke-dashoffset', (els.C * (1 - k / g)).toFixed(1));
    els.beads.forEach((b, i)=>b.classList.toggle('on', i < k));
    const dayTotal = Object.values(s.days[M.dkey()] || {}).reduce((a, b)=>a + b, 0);
    els.stToday.textContent = M.n(dayTotal); els.stAll.textContent = M.n(c); els.stLoops.textContent = M.n(loops);
    if(bump){ els.btn.classList.remove('bump', 'done'); void els.btn.offsetWidth; els.btn.classList.add(done ? 'done' : 'bump'); }
  }
  function prefs(){
    M.sheet({title:'إعدادات المسبحة', content:h('div.list.card',
      h('div.item.static', h('div.grow', h('div.t', 'الاهتزاز مع كل عدّة')), M.switchEl(vibOn(), v=>M.save('cntVib', v))),
      h('div.item.static', h('div.grow', h('div.t', 'نغمة مع كل عدّة')), M.switchEl(sndOn(), v=>{ M.save('tbSound', v); drawSnd(); })),
      h('div.item.static', h('div.grow', h('div.t', 'إبقاء الشاشة مضاءة'), h('div.s', 'أثناء المسبحة والأذكار')), M.switchEl(!!M.cfg.keepAwake, v=>{ M.save('keepAwake', v); if(M.keepAwake) M.keepAwake(v); })))});
  }
  async function setGoal(){
    const it = cur(); const v = await M.prompt('هدف «'+it.t+'»', String(goalOf(it)), 'عدد');
    const n = parseInt(String(v || '').replace(/[٠-٩]/g, d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)), 10);
    if(n > 0 && n <= 100000){ s.goals[it.id] = n; W(s); draw(); }
  }
  async function addCustom(){
    const t = await M.prompt('ذكر مخصص', '', 'اكتب الذكر'); if(!t || !t.trim()) return;
    const id = 'c'+Date.now(); s.custom.push({id, t:t.trim(), goal:33, custom:true}); s.cur = id; W(s); draw();
  }
  function toggleAuto(){
    if(auto){ stopAuto(); draw(); return; }
    auto = setInterval(()=>tap(1), 1400); draw();
  }
  function stats(){
    const c = h('div');
    const days = Object.keys(s.days).sort().reverse().slice(0, 14);
    if(!days.length) c.append(h('div.empty', 'لا توجد سجلات بعد'));
    days.forEach(d=>{
      const tot = Object.values(s.days[d]).reduce((a, b)=>a + b, 0);
      const parts = Object.keys(s.days[d]).map(id=>{ const it = all(s).find(x=>x.id === id); return it ? it.t+' '+M.n(s.days[d][id]) : ''; }).filter(Boolean).join(' • ');
      c.append(h('div.card.pad', {style:'margin-bottom:8px'}, h('div.row-flex', h('div.grow.bold', d), h('span.badge', M.n(tot))), h('div.tiny.muted', parts)));
    });
    M.sheet({title:'سجل التسبيح', content:c});
  }
  draw();
};
})();
