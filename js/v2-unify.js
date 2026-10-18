/* ===== one place per feature =====
   Pages that did the same job, or that were small parts of one subject, are now tabs of a single screen.
   Their old ids keep working everywhere (shortcuts, pins, deep links, notifications, search) and open the right tab.
     صلوات النوافل   ← السنن الرواتب، الضحى، قيام الليل والوتر، أوقات النهي
     صيام التطوع     ← الاثنين والخميس، الأيام البيض، يوم عرفة، يوم عاشوراء
     رمضان           ← السحور، وقت الإفطار، قضاء رمضان (تبويب «أحكام الصيام»)
     التسبيح والاستغفار ← تسابيح، الاستغفار، الحمد والثناء
     مكتبة الأدعية    ← أدعية من القرآن، شاملة، التيسير، المريض، حسب المواضيع، أذكار الأحبة
     الإذاعة والبث    ← البث المباشر
     الإعدادات        ← الأمان وأدوات إضافية
   The favourites screen gathers the favourites of every part of the app. */
(function(){
'use strict';
const M = window.M, h = M.h;
const SEC = id=>(M.SECTIONS || []).find(s=>s[0] === id);

/* ---- a screen made of several guides, one per tab ---- */
function guides(id, title, tabs, tab, extra){
  let cur = tabs.some(t=>t[0] === tab) ? tab : tabs[0][0];
  return M.openView({id, title, build:b=>{
    const content = h('div');
    const seg = M.seg(tabs, cur, v=>{ cur = v; draw(); b.scrollTop = 0; });
    seg.classList.add('uf-seg');
    b.append(seg, content);
    function draw(){ content.replaceChildren(); if(extra) try{ const x = extra(cur); if(x) content.append(x); }catch(e){} M.guideInto(content, cur); }
    draw();
  }});
}

/* prohibited times of today (the same figures as on the prayer screen) */
function forbiddenToday(){
  const t = M.prayerTimes(new Date()), ms = x=>new Date(+x), row = (a, b, l)=>h('div.extra', h('span.muted.small', l), h('b.num', M.fmt(a)+' – '+M.fmt(b)));
  return h('div.card.pad.extra-times.forbid', {style:'margin-bottom:12px'}, h('div.bold', 'أوقات النهي اليوم في '+M.location().name),
    row(t.fajr, t.sunrise, 'بعد صلاة الفجر حتى الشروق'), row(t.sunrise, ms(+t.sunrise + 15 * 60000), 'بعد الشروق (ترتفع الشمس)'),
    row(ms(+t.dhuhr - 10 * 60000), t.dhuhr, 'عند الاستواء (قبيل الظهر)'), row(t.asr, t.maghrib, 'بعد صلاة العصر حتى الغروب'),
    h('div.tiny.muted', 'تقديرية؛ يُحتاط بنحو ١٥ دقيقة بعد الشروق وقبل الغروب و١٠ قبل الظهر.'));
}
/* the next date of a voluntary fast */
function nextFast(kind){
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const fmt = d=>M.WEEKDAYS[d.getDay()]+' '+M.n(d.getDate())+' '+M.GMONTHS[d.getMonth()];
  try{
    if(kind === 'fast_week'){
      const days = []; for(let i = 1; i <= 7 && days.length < 2; i++){ const d = M.addDays(today, i); if(d.getDay() === 1 || d.getDay() === 4) days.push(d); }
      return 'القادم: '+days.map(fmt).join(' و');
    }
    const hj = M.hijri(today);
    const find = (m, dd)=>{ for(let y = hj.y; y <= hj.y + 1; y++){ const d = M.hijriToGreg(y, m, dd); d.setHours(12, 0, 0, 0); if(d > today) return d; } return null; };
    if(kind === 'fast_white'){
      for(let k = 0; k < 2; k++){ const m = ((hj.m - 1 + k) % 12) + 1, y = hj.y + (hj.m - 1 + k >= 12 ? 1 : 0);
        const d13 = M.hijriToGreg(y, m, 13); d13.setHours(12, 0, 0, 0); const d15 = M.addDays(d13, 2);
        if(d15 > today){ if(m === 9) continue; return 'القادمة: '+fmt(d13 > today ? d13 : M.addDays(today, 1))+' – '+fmt(d15); } }
    }
    if(kind === 'arafa'){ const d = find(12, 9); return d ? 'يوم عرفة القادم: '+fmt(d)+' (تقريبي)' : ''; }
    if(kind === 'ashura'){ const d = find(1, 10); return d ? 'عاشوراء القادم: '+fmt(d)+' (تقريبي)' : ''; }
  }catch(e){}
  return '';
}

M.openNawafil = tab=>guides('nawafil', 'صلوات النوافل', [['sunan', 'الرواتب'], ['duha', 'الضحى'], ['qiyam', 'قيام الليل'], ['forbidden', 'أوقات النهي']], tab,
  k=>k === 'forbidden' ? forbiddenToday() : null);
M.openTatawwu = tab=>guides('tatawwu', 'صيام التطوع', [['fast_week', 'الاثنين والخميس'], ['fast_white', 'الأيام البيض'], ['arafa', 'عرفة'], ['ashura', 'عاشوراء']], tab,
  k=>{ const t = nextFast(k); return t ? h('div.card.pad.accent.uf-next', h('span.lead', {html:M.icon('calendar')}), h('div.grow.bold', t)) : null; });

/* ---- favourites of every part of the app, in one screen ---- */
function favCount(k){ const v = M.store.get(k, []); return Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0; }
function otherFavs(){
  const rows = [
    ['duaFav', 'الأدعية', 's:dua', ()=>M.openDuas({fav:true})],
    ['pagerFav', 'من التسابيح والمجموعات', 's:beads', ()=>pagerFavs()],
    ['namesFav', 'أسماء الله الحسنى', 's:allah', ()=>M.sectionOpen('names')],
    ['prophetFav', 'قصص الأنبياء', 's:kaaba', ()=>M.sectionOpen('prophets')],
    ['radioFav', 'الإذاعات', 's:radio', ()=>M.sectionOpen('radio')]
  ].filter(r=>favCount(r[0]) > 0);
  if(!rows.length) return null;
  const l = h('div.list.card');
  rows.forEach(([k, t, ic, fn])=>l.append(M.item({icon:ic, title:t, sub:M.n(favCount(k))+' في المفضلة', onClick:fn, trail:M.ic('fwd')})));
  return h('div', {style:'margin-top:16px'}, h('h3.section-h', 'مفضلاتك في بقية التطبيق'), l);
}
/* the dhikr pager keeps the first words of each saved phrase: find the full phrase again */
function pagerFavs(){
  const keys = M.store.get('pagerFav', []) || [], pool = [];
  const add = (t, s)=>{ if(t) pool.push([String(t), s || '']); };
  try{ (M.TASBIH || []).forEach(x=>add(x[0], x[1])); (M.ISTIGHFAR || []).forEach(x=>add(x[0], x[1])); (M.HAMD || []).forEach(x=>add(x[0], x[1]));
    (M.TOPICS || []).forEach(tp=>(tp[3] || []).forEach(x=>add(x[0], x[2]))); (M.YUSR || []).forEach(y=>(y[3] || []).forEach(x=>add(x[0], x[2])));
    (M.JAMI || []).forEach(([g, it])=>(it || []).forEach(x=>add(x[0], x[1]))); }catch(e){}
  const items = keys.map(k=>pool.find(p=>p[0].slice(0, 40) === k)).filter(Boolean);
  if(!items.length) return M.toast('لا توجد عناصر محفوظة');
  M.dhikrPager('المفضلة من التسابيح', items.map(([t, s])=>[t, 1, s]));
}
function openFavs(){
  M.openAdhkarCategory('favs');
  const v = M.views[M.views.length - 1], o = v ? otherFavs() : null;
  if(o) v.body.append(o);
}

/* ---- which page lives where ---- */
M.SECTION_INNER = {
  sunan:'nawafil', duha:'nawafil', qiyam:'nawafil', forbidden:'nawafil',
  fast_week:'tatawwu', fast_white:'tatawwu', arafa:'tatawwu', ashura:'tatawwu',
  suhoor:'ramadan', iftar:'ramadan', qada_ram:'ramadan',
  istighfar:'tasabih', hamd:'tasabih',
  quranduas:'duas', jami:'duas', yusr:'duas', sick:'duas', topics:'duas', loved:'duas',
  tv:'radio', v2_security:'settings'
};
function route(){
  const set = (id, fn, title)=>{ const s = SEC(id); if(s){ s[4] = fn; if(title) s[1] = title; } };
  ['sunan', 'duha', 'qiyam', 'forbidden'].forEach(id=>set(id, ()=>M.openNawafil(id)));
  ['fast_week', 'fast_white', 'arafa', 'ashura'].forEach(id=>set(id, ()=>M.openTatawwu(id)));
  ['suhoor', 'iftar', 'qada_ram'].forEach(id=>set(id, ()=>M.openRamadan({tab:'ahkam'})));
  set('istighfar', ()=>M.openTasabih('istighfar')); set('hamd', ()=>M.openTasabih('hamd'));
  set('tasabih', ()=>M.openTasabih(), 'التسبيح والاستغفار');
  set('radio', SEC('radio') && SEC('radio')[4], 'الإذاعة والبث المباشر');
  set('favs', openFavs);
  if(!SEC('nawafil')) M.addSection({id:'nawafil', title:'صلوات النوافل', icon:'s:crescentdome', group:'الصلاة والمواسم', fn:()=>M.openNawafil()});
  if(!SEC('tatawwu')) M.addSection({id:'tatawwu', title:'صيام التطوع', icon:'s:calendar', group:'الصلاة والمواسم', fn:()=>M.openTatawwu()});
  M.SECTION_ORG = [
    ['عباداتي', ['tracker', 'khatma', 'tasbih', 'tijan', 'qada', 'favs', 'mine']],
    ['القرآن والتلاوة', ['quran', 'qplayer', 'hifz', 'mushaf_editions', 'tajweed', 'stats']],
    ['الأذكار والأدعية', ['morning', 'evening', 'after', 'sleep', 'wake', 'adhkar2_hisn', 'tasabih', 'duas', 'ruqya2', 'random']],
    ['الصلاة والمواسم', ['prayer', 'qibla', 'mosques', 'friday', 'nawafil', 'ramadan', 'tatawwu', 'hajj', 'calendar', 'dst']],
    ['تعلّم وكتب', ['sunnah', 'prophets', 'names', 'kids', 'quiz']],
    ['الصوتيات والبث', ['radio', 'sounds', 'downloads', 'sleep_timer']],
    ['أدوات', ['zakat', 'search', 'cards']],
    ['الإعدادات والأمان', ['notifs', 'health', 'look', 'navbar_cfg', 'settings']]
  ];
  const KW = M.SECTION_KW = M.SECTION_KW || {};
  KW.nawafil = 'نوافل سنن رواتب ضحى قيام ليل وتر تهجد أوقات النهي كراهة';
  KW.tatawwu = 'صيام تطوع اثنين خميس أيام بيض عرفة عاشوراء محرم';
  KW.tasabih = 'تسبيح تسابيح استغفار حمد ثناء سبحان الله';
  KW.radio = (KW.radio || '')+' إذاعة راديو بث مباشر تلفزيون قنوات مكة المدينة';
  KW.duas = (KW.duas || '')+' أدعية القرآن شاملة جوامع تيسير مريض شفاء مواضيع أحبة';
  KW.ramadan = (KW.ramadan || '')+' سحور إفطار قضاء رمضان إمساكية';
  KW.favs = (KW.favs || '')+' مفضلة محفوظات';
}
route();
// modules registered later (and v2-dedupe's own fix-ups) run on DOMContentLoaded: route again after them
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(route, 0)); else setTimeout(route, 0);
setTimeout(route, 350);
})();
