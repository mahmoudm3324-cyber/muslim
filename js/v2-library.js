/* ===== Sound library (redesigned): one place for every voice in the app, wired to the notifications =====
   - «ماذا يُؤذَّن الآن»: the sound each prayer actually uses (default adhan, Fajr adhan, a prayer's own choice), tap to change.
   - Categories: الأذان • أذان الفجر • التكبير • التذكيرات الصوتية; bundled, on-device and downloadable recordings in one list,
     each with who uses it («كل الصلوات»، «الفجر»، «الظهر»…), a preview with progress, and «استخدام» to assign it.
   - Pick mode: the notifications centre opens the library for one target (all prayers / Fajr / one prayer / the alarm /
     a voice reminder); choosing applies it there and returns.
   - The other audio sections (Quran player, radio, downloads, sleep timer) are one tap away from the top of the library. */
(function(){
'use strict';
const M = window.M, h = M.h;
const PN = {fajr:'الفجر', dhuhr:'الظهر', asr:'العصر', maghrib:'المغرب', isha:'العشاء'}, P5 = Object.keys(PN);
const SPECIAL = ['auto', 'default', 'silent', 'rotate'];
const V = ()=>M.v2Sounds && M.v2Sounds.api;
const dur = id=>(M.SND_DUR || {})[id] || 0;
const fmtD = s=>{ s = Math.round(s || 0); return s ? M.n(Math.floor(s / 60)+':'+String(s % 60).padStart(2, '0')) : ''; };
const FAJR_NAMES = {ad_abdulbasit_fajr:'الشيخ عبد الباسط عبد الصمد — الفجر', ad_mishary_fajr:'الشيخ مشاري العفاسي — الفجر'};

/* ---------- the catalogue: bundled + downloadable + spoken reminders, one shape ---------- */
function catalogue(){
  const out = [], seen = {};
  const add = o=>{ if(seen[o.id]) return; seen[o.id] = 1; out.push(o); };
  (M.ADHANS || []).forEach(([id, n])=>{ if(!String(id).startsWith('dla_')) add({id, name:n, kind:'adhan', dur:dur(id), bundled:true}); });
  Object.keys(FAJR_NAMES).forEach(id=>add({id, name:FAJR_NAMES[id], kind:'fajr', dur:dur(id), bundled:true}));
  (M.TAKBEER || []).forEach(([id, n])=>add({id, name:n, kind:'takbeer', dur:dur(id), bundled:true}));
  const api = V();
  if(api) ['adhan', 'fajr', 'takbeer'].forEach(k=>M.v2Sounds.list(k).forEach(c=>add({id:c.id, name:c.name, group:c.muezzin, kind:c.kind, dur:c.dur, size:c.size, cat:c})));
  (M.VOICES || []).forEach(([g, items])=>items.forEach(([id, n])=>add({id, name:n, kind:'voice', group:g, dur:dur(id), bundled:true})));
  return out;
}
const onDevice = it=>it.bundled || (it.cat && V() && V().got(it.cat));
const nameOf = id=>{ if(!id) return ''; const it = catalogue().find(x=>x.id === id); return it ? it.name : (M.nfSoundName ? M.nfSoundName(id) : id); };

/* ---------- what each prayer really plays (same rules as the notifications centre) ---------- */
const custom = p=>{ const s = M.nfGet ? (M.nfGet(p) || {}).snd : null; return s && !SPECIAL.includes(s) ? s : ''; };
const playsFor = p=>custom(p) || (M.adhanFor ? M.adhanFor(p) : (M.cfg.adhan || 'ad_makkah'));
function usage(){
  const u = {}, add = (id, label, cls)=>{ if(!id) return; (u[id] = u[id] || []).push([label, cls || '']); };
  add(M.cfg.adhan || 'ad_makkah', 'كل الصلوات', 'all');
  P5.forEach(p=>{ const s = playsFor(p); if(s !== (M.cfg.adhan || 'ad_makkah') || custom(p)) add(s, PN[p], p === 'fajr' ? 'fajr' : ''); });
  if(M.can && M.can('alarmRing') && M.cfg.alarmSnd) add(M.cfg.alarmSnd, 'المنبّه', 'alarm');
  (M.VOICES || []).forEach(([, items])=>items.forEach(([id])=>{ const d = M.nfFor && M.nfFor(id); if(d && M.nfGet && (M.nfGet(d.id) || {}).on) add(id, 'إشعار '+d.t, 'nf'); }));
  return u;
}

/* ---------- assigning ---------- */
const TARGETS = {
  default:{title:'أذان كل الصلوات', kinds:['adhan', 'takbeer'], get:()=>M.cfg.adhan || 'ad_makkah', set:id=>M.save('adhan', id)},
  fajr:{title:'أذان الفجر', kinds:['fajr', 'adhan', 'takbeer'], get:()=>M.cfg.fajrAdhan || '', set:id=>M.save('fajrAdhan', id), auto:'تلقائي (حسب أذان كل الصلوات)'},
  alarm:{title:'صوت منبّه الصلاة', kinds:['adhan', 'takbeer'], get:()=>M.cfg.alarmSnd || 'ad_makkah', set:id=>M.save('alarmSnd', id)}
};
function target(t){
  if(!t) return null;
  if(t.type === 'prayer') return {title:'أذان صلاة '+PN[t.p], kinds:t.p === 'fajr' ? ['fajr', 'adhan', 'takbeer'] : ['adhan', 'takbeer'], get:()=>custom(t.p),
    set:id=>M.nfSet(t.p, {snd:id || 'auto'}), auto:'مثل أذان كل الصلوات'+(t.p === 'fajr' ? ' / أذان الفجر' : '')};
  if(t.type === 'nf'){ const d = M.nfFor ? null : null; return {title:'صوت إشعار '+(t.label || ''), kinds:['voice'], get:()=>(M.nfGet(t.id) || {}).snd || '', set:id=>M.nfSet(t.id, {snd:id || 'auto'}), auto:'التسجيل المخصّص'}; }
  return TARGETS[t.type] || null;
}
function apply(tg, id, name){
  tg.set(id); M.syncNative && M.syncNative();
  M.emit('library', id);
  M.toast(id ? 'تم: «'+name+'» — '+tg.title : 'تم: '+tg.title+' تلقائي');
}

/* the «استخدام» sheet: every place this sound can go */
function useSheet(it, done){
  const list = h('div.list');
  const sh = M.sheet({title:'استخدام «'+it.name+'»', content:list});
  const opt = (label, sub, fn, on)=>list.append(h('button.item.lib-use'+(on ? '.on' : ''), {onclick:()=>{ fn(); sh.close(); done && done(); }},
    h('span.nf-radio'), h('div.grow', h('div.t', label), sub ? h('div.s', sub) : null)));
  if(it.kind === 'voice'){
    const d = M.nfFor && M.nfFor(it.id);
    if(d) opt('إشعار «'+d.t+'»', 'افتح الإشعار لتفعيله وضبط وقته', ()=>{ M.openNotifItem && M.openNotifItem(d.id); });
    else list.append(h('div.small.muted.pad', 'هذا التسجيل يُستخدم تلقائيًا مع تذكيره.'));
    return;
  }
  if(it.kind !== 'fajr') opt('كل الصلوات', 'الأذان الافتراضي لجميع الصلوات', ()=>apply(TARGETS.default, it.id, it.name), (M.cfg.adhan || 'ad_makkah') === it.id);
  opt('صلاة الفجر', 'يُستخدم للفجر فقط', ()=>apply(TARGETS.fajr, it.id, it.name), M.cfg.fajrAdhan === it.id);
  ['dhuhr', 'asr', 'maghrib', 'isha'].forEach(p=>{ if(it.kind !== 'fajr') opt('صلاة '+PN[p] + (p === 'dhuhr' ? ' (والجمعة)' : ''), null, ()=>apply(target({type:'prayer', p}), it.id, it.name), custom(p) === it.id); });
  if(M.can && M.can('alarmRing') && it.kind !== 'fajr') opt('منبّه الصلاة', 'صوت المنبّه الذي يرنّ حتى تُوقفه', ()=>apply(TARGETS.alarm, it.id, it.name), M.cfg.alarmSnd === it.id);
}

/* ---------- avatar: initial on a colour from the name (mosques get a dome) ---------- */
const hue = s=>{ let x = 0; for(const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) % 360; return x; };
function avatar(it){
  const base = String(it.group || it.name).replace(/^(تكبير|أذان) ?(—|-)? ?/, '').replace(/^الشيخ /, '');
  const mosque = /مكة|المكي|المدني|الأقصى|الحرم|المسجد|تركيا|مساجد/.test(it.name) && it.kind !== 'voice';
  const hh = it.kind === 'voice' ? 192 : hue(base);
  const el = h('span.lib-av', {style:'--h:'+hh});
  if(it.kind === 'voice') el.innerHTML = M.icon('mic');
  else if(mosque) el.innerHTML = M.icon('s:mosque');
  else el.textContent = (base.trim()[0] || '؟');
  return el;
}

/* ---------- the shared preview: whichever <audio> is playing ---------- */
const playingAudio = ()=>(M._audios || []).find(a=>!a.paused && a.src) || null;
let nowId = null;
M.on('sound', id=>{ nowId = id || null; });

/* ---------- the screen ---------- */
M.openSounds = function(opts){
  opts = opts || {};
  const tg = target(opts.target);
  let tab = tg ? tg.kinds[0] : M.store.get('libTab', 'adhan'), q = '', lim = {};
  if(opts.tab) tab = opts.tab;
  const offs = [];
  const view = M.openView({id:'sounds', title:tg ? 'اختر: '+tg.title : 'المكتبة الصوتية', onClose:()=>{ offs.forEach(f=>{ try{ f(); }catch(e){} }); M.stopSound(); opts.onDone && opts.onDone(); }, build:(b)=>{
    const top = h('div'), seg = h('div'), search = h('div'), body = h('div.lib-body');
    b.append(top, seg, search, body);

    function drawTop(){
      top.replaceChildren();
      if(tg){
        const cur = tg.get();
        top.append(h('div.lib-pick', h('div.lib-pick-t', 'تختار الآن: ', h('b', tg.title)), h('div.small.muted', cur ? 'الحالي: '+nameOf(cur) : 'الحالي: '+(tg.auto || 'تلقائي')),
          tg.auto ? h('button.chip', {onclick:()=>{ apply(tg, '', ''); view.close(); }}, 'تلقائي') : null));
        return;
      }
      // what each prayer plays now — the link with the notifications
      const card = h('div.lib-plays');
      card.append(h('div.lib-plays-h', h('span', 'ماذا يُؤذَّن لكل صلاة'), h('button.lib-link', {onclick:()=>M.openNotifs && M.openNotifs()}, 'الإشعارات', M.ic('fwd'))));
      const grid = h('div.lib-pgrid');
      const isOn = p=>M.nfGet ? !!(M.nfGet(p) || {}).on : true, allOff = !P5.some(isOn);
      P5.forEach(p=>{
        const s = playsFor(p), own = !!custom(p) || (p === 'fajr' && !!M.cfg.fajrAdhan);
        const on = allOff || isOn(p);   // when every alert is off one note says so, instead of five labels
        grid.append(h('button.lib-p'+(own ? '.own' : '')+(on ? '' : '.off'), {onclick:()=>M.openSounds({target:{type:'prayer', p}, onDone:redraw})},
          h('span.lib-p-ic', {html:M.icon('p:'+p)}), h('span.lib-p-n', PN[p]), h('span.lib-p-s', (nameOf(s) || '—').replace(/^أذان\s+/, '')), on ? null : h('span.lib-p-off', 'متوقف')));
      });
      card.append(grid);
      if(allOff) card.append(h('button.lib-off-note', {onclick:()=>M.openNotifs && M.openNotifs()}, M.ic('bell'), h('span.grow', 'إشعارات الصلاة متوقفة؛ فعّلها ليُسمع الأذان في وقته'), h('b', 'تفعيل')));
      card.append(h('div.lib-plays-f',
        h('button.btn.tonal.sm', {onclick:()=>M.openSounds({target:{type:'default'}, onDone:redraw})}, M.ic('s:mosque'), 'أذان الصلوات'),
        h('button.btn.ghost.sm', {onclick:()=>M.openSounds({target:{type:'fajr'}, onDone:redraw})}, M.ic('p:fajr'), 'أذان الفجر')));
      top.append(card);
      // the other audio sections
      const SECS = [['s:mushaf', 'مشغّل القرآن', 'تلاوات بأصوات القرّاء', 200, ()=>M.openQuranPlayer && M.openQuranPlayer()],
        ['s:radio', 'الإذاعة', 'بث مباشر', 28, ()=>M.openRadio && M.openRadio()],
        ['download', 'التنزيلات', 'للاستماع بدون إنترنت', 152, ()=>M.openDownloads && M.openDownloads()],
        ['s:moon', 'مؤقت النوم', 'إيقاف التشغيل بعد مدة', 262, ()=>M.openSleepTimer && M.openSleepTimer()]];
      const row = h('div.lib-secs');
      SECS.forEach(([ic, t, s, hh, fn])=>row.append(h('button.lib-sec', {style:'--h:'+hh, onclick:fn}, h('span.lib-sec-ic', {html:M.icon(ic)}), h('span.lib-sec-t', t), h('span.lib-sec-s', s))));
      top.append(row);
    }

    const TABS = [['adhan', 'الأذان'], ['fajr', 'أذان الفجر'], ['takbeer', 'التكبير'], ['voice', 'التذكيرات']].filter(([k])=>!tg || tg.kinds.includes(k));
    function drawSeg(){ seg.replaceChildren(TABS.length > 1 ? M.seg(TABS, tab, v=>{ tab = v; if(!tg) M.store.set('libTab', v); q = ''; drawSearch(); draw(); }) : h('span')); }
    function drawSearch(){
      search.replaceChildren(tab === 'voice' ? h('span') : h('div.lib-q', h('span.lib-q-i', {html:M.icon('search')}), h('input.field', {type:'search', placeholder:'ابحث عن شيخ أو مسجد أو بلد…', 'aria-label':'بحث', value:q,
        oninput:e=>{ q = e.target.value; lim[tab] = 0; draw(); }})));
    }

    const playBtns = [];
    function card(it, U){
      const used = U[it.id] || [], here = onDevice(it), api = V(), busy = api && it.cat ? api.busy[it.cat.key] : null;
      const play = h('button.lib-play', {'aria-label':'استماع إلى '+it.name, dataset:{id:it.id}, onclick:()=>M.playSound(it.id)}, M.ic('play'));
      playBtns.push(play);
      let act;
      if(busy != null) act = h('span.lib-busy', busy >= 0 ? M.n(Math.round(busy * 100))+'٪' : '…');
      else if(!here) act = h('button.lib-act.dl', {'aria-label':'تنزيل '+it.name, onclick:async()=>{
        if(!navigator.onLine) return M.toast('لا يوجد اتصال بالإنترنت');
        const ok = await api.download(it.cat); M.toast(ok ? 'تم تنزيل «'+it.name+'»' : 'تعذّر التنزيل — حاول مرة أخرى'); draw();
        if(ok && tg) apply(tg, it.id, it.name), view.close();
      }}, M.ic('download'), 'تنزيل');
      else if(tg){ const on = tg.get() === it.id; act = h('button.lib-act.pick'+(on ? '.on' : ''), {onclick:()=>{ apply(tg, it.id, it.name); view.close(); }}, on ? M.ic('check') : null, on ? 'المختار' : 'اختيار'); }
      else act = h('button.lib-act', {onclick:()=>useSheet(it, redraw)}, 'استخدام');
      const meta = [fmtD(it.dur), it.bundled ? (it.kind === 'voice' ? it.group : 'مضمّن') : here ? 'على جهازك' : (api ? api.kb(it.size)+' • للتنزيل' : 'للتنزيل')].filter(Boolean).join(' • ');
      const el = h('div.lib-card'+(used.length ? '.used' : ''),
        avatar(it),
        h('div.lib-mid', h('div.lib-n', it.name), h('div.lib-m', meta),
          busy != null ? h('div.lib-prog', h('i', {style:'width:'+Math.max(4, Math.round((busy >= 0 ? busy : .3) * 100))+'%'})) : null,
          h('div.lib-foot', h('div.lib-tags', ...used.map(([t, c])=>h('span.lib-tag'+(c ? '.'+c : ''), t))),
            here && it.cat ? h('button.lib-del', {'aria-label':'حذف '+it.name+' من الجهاز', onclick:async()=>{ if(!(await M.confirm('حذف «'+it.name+'» من الجهاز؟', 'حذف'))) return; M.stopSound(); await api.remove(it.cat); redraw(); }}, M.ic('trash')) : null, act)),
        play);
      return el;
    }

    function draw(){
      playBtns.length = 0;
      const all = catalogue().filter(it=>it.kind === tab), U = usage(), nq = M.normAr ? M.normAr(q) : q;
      const hit = it=>!nq || (M.normAr ? M.normAr(it.name+' '+(it.group || '')) : it.name).includes(nq);
      const kids = [];
      if(tab === 'voice'){
        let lastG = null;
        all.forEach(it=>{ if(it.group !== lastG){ lastG = it.group; kids.push(h('div.section-h', it.group)); } kids.push(card(it, U)); });
      }else{
        const mine = all.filter(it=>onDevice(it) && hit(it)), more = all.filter(it=>!onDevice(it) && hit(it));
        if(mine.length){ kids.push(h('div.section-h', 'جاهزة على جهازك', h('span.small.muted.num', M.n(mine.length)))); mine.forEach(it=>kids.push(card(it, U))); }
        if(more.length){
          const n = lim[tab] || 12;
          kids.push(h('div.section-h', 'للتنزيل', h('span.small.muted.num', M.n(more.length))));
          more.slice(0, n).forEach(it=>kids.push(card(it, U)));
          if(more.length > n) kids.push(h('button.btn.tonal.block', {onclick:()=>{ lim[tab] = n + 24; draw(); }}, 'عرض المزيد ('+M.n(more.length - n)+')'));
          kids.push(h('div.tiny.muted.lib-src', 'التسجيلات الإضافية من مستودعات عامة على GitHub (Kiwifu/adhan-mp3، athany، Muezzin، PrayerTimes، praydo، HomeAssistantAdzan)؛ تُنزَّل مرة واحدة وتعمل بعدها بدون إنترنت.'));
        }
        if(!mine.length && !more.length) kids.push(h('div.empty', 'لا نتائج'));
      }
      body.replaceChildren(...kids);
      paint();
    }
    function redraw(){ drawTop(); draw(); }

    /* the play buttons follow whichever preview is playing; the floating player (nowplaying.js) is the only player bar */
    let raf = 0;
    function paint(){
      const a = playingAudio(), id = a ? nowId : null;
      playBtns.forEach(btn=>{ if(!btn.isConnected) return; const on = btn.dataset.id === id; btn.classList.toggle('on', on); btn.replaceChildren(M.ic(on ? 'pause' : 'play'));
        btn.style.setProperty('--pp', on && a.duration ? (a.currentTime / a.duration * 100).toFixed(1) : 0); });
    }
    const tick = ()=>{ paint(); raf = playingAudio() ? setTimeout(tick, 500) : 0; };
    offs.push(M.on('sound', ()=>{ clearTimeout(raf); setTimeout(tick, 120); }), M.on('v2s', ()=>{ if(view.el && view.el.isConnected) draw(); }), M.on('library', ()=>{ if(view.el && view.el.isConnected) redraw(); }), ()=>clearTimeout(raf));

    drawTop(); drawSeg(); drawSearch(); draw();
  }});
  return view;
};

/* the notifications centre's sound choices open the library */
M.libPick = (t, done)=>M.openSounds({target:t, onDone:done});
})();
