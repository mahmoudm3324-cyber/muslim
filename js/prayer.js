/* ===== Prayer times, Qibla, schedule tables, in-app reminders ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const A = window.adhan;
M.screens = M.screens || {};

M.CITIES = [
 ['القاهرة',30.0444,31.2357,'Africa/Cairo'],['الإسكندرية',31.2001,29.9187,'Africa/Cairo'],['الجيزة',30.0131,31.2089,'Africa/Cairo'],['المنصورة',31.0409,31.3785,'Africa/Cairo'],['طنطا',30.7865,31.0004,'Africa/Cairo'],
 ['بورسعيد',31.2653,32.3019,'Africa/Cairo'],['السويس',29.9668,32.5498,'Africa/Cairo'],['أسيوط',27.1809,31.1837,'Africa/Cairo'],['الأقصر',25.6872,32.6396,'Africa/Cairo'],['أسوان',24.0889,32.8998,'Africa/Cairo'],['شرم الشيخ',27.9158,34.33,'Africa/Cairo'],
 ['مكة المكرمة',21.3891,39.8579,'Asia/Riyadh'],['المدينة المنورة',24.5247,39.5692,'Asia/Riyadh'],['الرياض',24.7136,46.6753,'Asia/Riyadh'],['جدة',21.4858,39.1925,'Asia/Riyadh'],['الدمام',26.4207,50.0888,'Asia/Riyadh'],['أبها',18.2164,42.5053,'Asia/Riyadh'],
 ['القدس',31.7683,35.2137,'Asia/Jerusalem'],['غزة',31.5018,34.4668,'Asia/Gaza'],['نابلس',32.2211,35.2544,'Asia/Hebron'],['عمّان',31.9454,35.9284,'Asia/Amman'],['دمشق',33.5138,36.2765,'Asia/Damascus'],['بيروت',33.8938,35.5018,'Asia/Beirut'],
 ['بغداد',33.3152,44.3661,'Asia/Baghdad'],['الكويت',29.3759,47.9774,'Asia/Kuwait'],['المنامة',26.2285,50.586,'Asia/Bahrain'],['الدوحة',25.2854,51.531,'Asia/Qatar'],['دبي',25.2048,55.2708,'Asia/Dubai'],['أبوظبي',24.4539,54.3773,'Asia/Dubai'],['الشارقة',25.3463,55.4209,'Asia/Dubai'],['مسقط',23.588,58.3829,'Asia/Muscat'],['صنعاء',15.3694,44.191,'Asia/Aden'],
 ['الخرطوم',15.5007,32.5599,'Africa/Khartoum'],['طرابلس',32.8872,13.1913,'Africa/Tripoli'],['تونس',36.8065,10.1815,'Africa/Tunis'],['الجزائر',36.7538,3.0588,'Africa/Algiers'],['الرباط',34.0209,-6.8416,'Africa/Casablanca'],['الدار البيضاء',33.5731,-7.5898,'Africa/Casablanca'],['نواكشوط',18.0735,-15.9582,'Africa/Nouakchott'],
 ['إسطنبول',41.0082,28.9784,'Europe/Istanbul'],['أنقرة',39.9334,32.8597,'Europe/Istanbul'],['لندن',51.5074,-0.1278,'Europe/London'],['باريس',48.8566,2.3522,'Europe/Paris'],['برلين',52.52,13.405,'Europe/Berlin'],['مدريد',40.4168,-3.7038,'Europe/Madrid'],
 ['نيويورك',40.7128,-74.006,'America/New_York'],['تورنتو',43.6532,-79.3832,'America/Toronto'],['لوس أنجلوس',34.0522,-118.2437,'America/Los_Angeles'],['كراتشي',24.8607,67.0011,'Asia/Karachi'],['إسلام آباد',33.6844,73.0479,'Asia/Karachi'],['دكا',23.8103,90.4125,'Asia/Dhaka'],
 ['جاكرتا',-6.2088,106.8456,'Asia/Jakarta'],['كوالالمبور',3.139,101.6869,'Asia/Kuala_Lumpur'],['سنغافورة',1.3521,103.8198,'Asia/Singapore'],['سيدني',-33.8688,151.2093,'Australia/Sydney'],['جوهانسبرغ',-26.2041,28.0473,'Africa/Johannesburg']
];
M.METHODS = [
 ['auto','تلقائي حسب الموقع'],['Egyptian','الهيئة المصرية العامة للمساحة'],['UmmAlQura','أم القرى (مكة المكرمة)'],['MuslimWorldLeague','رابطة العالم الإسلامي'],
 ['Karachi','جامعة العلوم الإسلامية – كراتشي'],['NorthAmerica','أمريكا الشمالية (ISNA)'],['Dubai','دبي'],['Kuwait','الكويت'],['Qatar','قطر'],['Singapore','سنغافورة'],['Turkey','رئاسة الشؤون الدينية – تركيا'],['Tehran','معهد الجيوفيزياء – طهران'],['MoonsightingCommittee','لجنة رؤية الهلال']
];
M.PRAYERS = [['fajr','الفجر','p:fajr'],['sunrise','الشروق','p:sunrise'],['dhuhr','الظهر','p:dhuhr'],['asr','العصر','p:asr'],['maghrib','المغرب','p:maghrib'],['isha','العشاء','p:isha']];

M.location = function(){ return M.cfg.loc || {name:'القاهرة', lat:30.0444, lng:31.2357, tz:'Africa/Cairo', auto:false}; };
function autoMethod(loc){
  const tz = loc.tz || '';
  if(/Cairo/.test(tz)) return 'Egyptian';
  if(/Riyadh|Kuwait|Qatar|Bahrain|Dubai|Muscat|Aden/.test(tz)) return /Dubai/.test(tz) ? 'Dubai' : /Kuwait/.test(tz) ? 'Kuwait' : /Qatar/.test(tz) ? 'Qatar' : 'UmmAlQura';
  if(/America\//.test(tz)) return 'NorthAmerica';
  if(/Istanbul/.test(tz)) return 'Turkey';
  if(/Karachi|Dhaka|Kolkata/.test(tz)) return 'Karachi';
  if(/Singapore|Kuala|Jakarta/.test(tz)) return 'Singapore';
  if(/Tehran/.test(tz)) return 'Tehran';
  return 'MuslimWorldLeague';
}
M.methodKey = ()=>M.cfg.method === 'auto' ? autoMethod(M.location()) : M.cfg.method;
M.calcParams = function(){
  const key = M.methodKey();
  const p = A.CalculationMethod[key] ? A.CalculationMethod[key]() : A.CalculationMethod.MuslimWorldLeague();
  p.madhab = M.cfg.madhhab === 'hanafi' ? A.Madhab.Hanafi : A.Madhab.Shafi;
  const ad = M.cfg.adjust || {};
  p.adjustments = Object.assign(p.adjustments || {}, {fajr:ad.fajr || 0, sunrise:ad.sunrise || 0, dhuhr:ad.dhuhr || 0, asr:ad.asr || 0, maghrib:ad.maghrib || 0, isha:ad.isha || 0});
  return p;
};
M.prayerTimes = function(date){
  const loc = M.location(); const c = new A.Coordinates(loc.lat, loc.lng);
  const p = M.calcParams(); try{ p.highLatitudeRule = A.HighLatitudeRule.recommended(c); }catch(e){}
  const pt = new A.PrayerTimes(c, date || new Date(), p);
  const st = new A.SunnahTimes(pt);
  return {fajr:pt.fajr, sunrise:pt.sunrise, dhuhr:pt.dhuhr, asr:pt.asr, maghrib:pt.maghrib, isha:pt.isha,
    duha:new Date(pt.sunrise.getTime() + 20*60000), midnight:st.middleOfTheNight, lastThird:st.lastThirdOfTheNight};
};
M.fmt = d=>M.fmtTime(d, M.location().tz);
// current / next prayer
M.nextPrayer = function(now){
  now = now || new Date();
  const t = M.prayerTimes(now);
  const order = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
  let next = null, prev = null;
  for(const k of order){ if(t[k] > now){ next = {k, t:t[k]}; break; } prev = {k, t:t[k]}; }
  if(!next){ const tm = M.prayerTimes(M.addDays(now, 1)); next = {k:'fajr', t:tm.fajr}; }
  if(!prev){ const y = M.prayerTimes(M.addDays(now, -1)); prev = {k:'isha', t:y.isha}; }
  return {next, prev, times:t};
};
M.prayerLabel = function(k, date){
  if(k === 'dhuhr' && (date || new Date()).getDay() === 5) return 'الجمعة';
  return (M.PRAYERS.find(p=>p[0] === k) || [])[1] || k;
};

/* ---- location detect ---- */
M.detectLocation = function(){
  return new Promise((res, rej)=>{
    if(!navigator.geolocation){ rej(new Error('unsupported')); return; }
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      let tz = 'UTC'; try{ tz = Intl.DateTimeFormat().resolvedOptions().timeZone; }catch(e){}
      let best = null, bd = 1e9; M.CITIES.forEach(c=>{ const d = dist(lat, lng, c[1], c[2]); if(d < bd){ bd = d; best = c; } });
      const name = bd < 60 ? best[0] : 'موقعي الحالي';
      res({name, lat, lng, tz, auto:true});
    }, err=>rej(err), {enableHighAccuracy:false, timeout:12000, maximumAge:600000});
  });
};
function dist(a, b, c, d){ const R = 6371, r = Math.PI/180, dl = (c-a)*r, dn = (d-b)*r; const x = Math.sin(dl/2)**2 + Math.cos(a*r)*Math.cos(c*r)*Math.sin(dn/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
M.distKaaba = ()=>{ const l = M.location(); return dist(l.lat, l.lng, 21.4225, 39.8262); };
M.qiblaDeg = ()=>{ const l = M.location(); return A.Qibla(new A.Coordinates(l.lat, l.lng)); };

/* ---- 1s ticker (shared) ---- */
const tickers = new Set();
M.every = fn=>{ tickers.add(fn); return ()=>tickers.delete(fn); };
setInterval(()=>{ tickers.forEach(f=>{ try{ f(); }catch(e){} }); }, 1000);

/* ---- in-app reminder when a prayer time arrives ---- */
let lastFired = M.store.get('lastFired', '');
M.every(()=>{
  if(!M.cfg.adhanTone && !Object.values(M.cfg.notifyIn || {}).some(Boolean)) return;
  const now = new Date(); const t = M.prayerTimes(now);
  for(const [k] of M.PRAYERS){
    const diff = now - t[k];
    if(diff >= 0 && diff < 3000 && (M.cfg.notifyIn || {})[k]){
      const id = M.dkey(now)+k; if(lastFired === id) continue;
      lastFired = id; M.store.set('lastFired', id);
      M.toast('حان الآن موعد '+(k === 'sunrise' ? 'الشروق' : 'صلاة '+M.prayerLabel(k, now)), 6000);
      M.haptic(200);
      if(k !== 'sunrise' && !window.Android && M.cfg.adhanTone && M.cfg.adhanInApp !== false && M.playSound) M.playSound(M.adhanFor(k));
      else if(!window.Android){ M.beep(660, .5, .2); setTimeout(()=>M.beep(880, .5, .2), 600); }
    }
  }
});
/* =================== Prayer screen =================== */
const ps = {date:new Date()};
M.screens.prayer = {
  icon:'s:mosque', label:'الصلاة',
  build(el){
    el.innerHTML = '';
    const loc = M.location();
    const isToday = M.dkey(ps.date) === M.dkey();
    const t = M.prayerTimes(ps.date);
    const info = M.nextPrayer(new Date());
    const hj = M.hijri ? M.hijri(ps.date) : null;
    el.append(h('div.page-top',
      h('div', h('h1', 'مواقيت الصلاة'), h('button.loc-btn', {onclick:()=>locationSheet()}, M.ic('pin'), h('span', loc.name), M.ic('chevDown'))),
      h('div.row-flex.gap-s',
        h('button.icon-btn.tonal.pr-sched', {'aria-label':'الجدول', onclick:()=>openSchedule()}, M.ic('calendar')),
        h('button.icon-btn.tonal', {'aria-label':'الإعدادات', onclick:()=>prayerSettings()}, M.ic('settings')))));

    // hero
    const cd = h('div.cd.num'), pbar = h('i'), nxName = h('div.nx-n.title-font'), nxTime = h('div.nx-t.num');
    const hero = h('div.card.accent.pad.hero.prayer-hero',
      h('div.small.muted', isToday ? 'الصلاة القادمة' : 'ملخص اليوم'),
      isToday ? h('div', nxName, nxTime) : h('div', h('div.nx-n.title-font', M.WEEKDAYS[ps.date.getDay()]), h('div.nx-t', hj ? M.n(hj.d)+' '+M.HMONTHS[hj.m-1]+' '+M.n(hj.y)+' هـ' : '')),
      isToday ? h('div.cd-wrap', h('span.small.muted', 'بعد'), cd) : null,
      isToday ? h('div.bar.hero-bar', pbar) : null,
      M.heroImg('prayer'));
    el.append(hero);
    function tickHero(){
      if(!isToday) return;
      const i = M.nextPrayer(new Date());
      nxName.textContent = i.next.k === 'sunrise' ? 'الشروق' : 'صلاة '+M.prayerLabel(i.next.k);
      nxTime.textContent = M.fmt(i.next.t);
      cd.textContent = M.n(M.fmtDur(i.next.t - new Date()));
      const span = i.next.t - i.prev.t; pbar.style.width = Math.max(2, Math.min(100, (Date.now() - i.prev.t) / span * 100))+'%';
    }
    tickHero();
    if(M._prayerTick) M._prayerTick(); M._prayerTick = M.every(()=>{ if(M.curTab !== 'prayer' || !el.isConnected){ return; } tickHero(); });

    // date navigator
    const gd = ps.date;
    el.append(h('div.card.pad.datenav', h('div.row-flex',
      h('button.icon-btn', {onclick:()=>{ ps.date = M.addDays(ps.date, -1); M.screens.prayer.build(el); }}, M.ic('back')),
      h('div.grow.center', h('div.bold', M.WEEKDAYS[gd.getDay()]+'، '+M.n(gd.getDate())+' '+M.GMONTHS[gd.getMonth()]+' '+M.n(gd.getFullYear())),
        h('div.small.muted', hj ? M.n(hj.d)+' '+M.HMONTHS[hj.m-1]+' '+M.n(hj.y)+' هـ' : '')),
      h('button.icon-btn', {onclick:()=>{ ps.date = M.addDays(ps.date, 1); M.screens.prayer.build(el); }}, M.ic('fwd')))));

    // times list
    const grid = M.cfg.ppView === 'grid';
    const card = h(grid ? 'div.ptimes-grid' : 'div.card.list.ptimes');
    M.PRAYERS.forEach(([k, name, icon])=>{
      const isNext = isToday && info.next.k === k;
      const lbl = k === 'dhuhr' && ps.date.getDay() === 5 ? 'الجمعة' : name;
      const on = (M.cfg.notifyIn || {})[k];
      const bell = h('button.icon-btn.bell'+(on ? '.on' : ''), {'aria-label':'تنبيه', onclick:e=>{ e.stopPropagation(); const n = Object.assign({}, M.cfg.notifyIn); n[k] = !n[k]; M.save('notifyIn', n); bell.classList.toggle('on', n[k]); bell.innerHTML = M.icon('bell'); M.toast(n[k] ? 'تم تفعيل التنبيه: '+lbl : 'تم إيقاف التنبيه'); M.haptic(8); if(n[k]) requestNotifyPermission(); }}, M.ic('bell'));
      const iq = M.cfg.iqamaOn !== false && (M.cfg.iqama || {})[k] ? new Date(+t[k] + M.cfg.iqama[k] * 60000) : null;
      if(grid){ card.append(h('button.card.pcard'+(isNext ? '.next' : '')+(isToday && info.prev && info.prev.k === k ? '.now' : ''), {onclick:()=>prayerSheet(k, lbl, t)}, (M.cfg.prIcons === false ? null : h('span.lead', {html:M.icon(icon)})), h('div.bold', lbl), h('div.num.pt-time', M.fmt(t[k])), iq ? h('div.tiny.muted', 'الإقامة '+M.fmt(iq)) : null, isNext ? h('span.badge', 'القادمة') : null, bell)); return; }
      card.append(h('div.item.ptime'+(isNext ? '.next' : '')+(isToday && info.prev && info.prev.k === k ? '.now' : ''), {onclick:()=>prayerSheet(k, lbl, t)}, (M.cfg.prIcons === false ? null : h('span.lead', {html:M.icon(icon)})), h('div.grow', h('div.t', lbl, isToday && info.prev && info.prev.k === k ? h('span.badge', {style:'margin-inline-start:8px'}, 'الآن') : null), iq ? h('div.s.small.muted', 'الإقامة '+M.fmt(iq)+' (بعد '+M.n(M.cfg.iqama[k])+' د)') : null), h('div.pt-time.num', M.fmt(t[k])), bell));
    });
    el.append(card);
    // the prayers of this day in the prayer log (v2-plog.js)
    if(M.plogCard && M.cfg.plogCard !== false && M.dkey(ps.date) <= M.dkey()) try{ el.append(M.plogCard(ps.date)); }catch(e){ console.error(e); }
    // extra times
    const simple = !!M.cfg.ppSimple;
    const ex = h('div.card.pad.extra-times',
      h('div.extra', h('span.muted.small', 'الضحى (تقريبًا)'), h('b.num', M.fmt(t.duha))),
      h('div.extra', h('span.muted.small', 'منتصف الليل'), h('b.num', M.fmt(t.midnight))),
      h('div.extra', h('span.muted.small', 'الثلث الأخير من الليل'), h('b.num', M.fmt(t.lastThird))));
    if(!simple || M.cfg.ppSun) el.append(ex);

    // prohibited times
    const pm = (a, b, lbl)=>h('div.extra', h('span.muted.small', lbl), h('b.num', M.fmt(a)+' – '+M.fmt(b)));
    const ms = x=>new Date(+x);
    if(!simple && M.cfg.showForbid!==false) el.append(h('div.card.pad.extra-times.forbid', {role:'button', tabindex:0, 'aria-label':'أوقات النهي عن الصلاة — التفاصيل', onclick:()=>M.openNawafil ? M.openNawafil('forbidden') : M.sectionOpen('forbidden')},
      h('div.bold', 'أوقات النهي عن الصلاة'),
      pm(t.sunrise, ms(+t.sunrise + 15*60000), 'بعد الشروق (ترتفع الشمس)'),
      pm(ms(+t.dhuhr - 10*60000), t.dhuhr, 'عند الاستواء (قبيل الظهر)'),
      pm(ms(+t.maghrib - 15*60000), t.maghrib, 'قبيل الغروب'),
      h('div.tiny.muted', 'تقديرية؛ يُحتاط بنحو ١٥ دقيقة بعد الشروق وقبل الغروب و١٠ قبل الظهر.')));
    // qibla card
    const q = Math.round(M.qiblaDeg());
    if(!simple) el.append(h('button.card.pad.qibla-card', {onclick:()=>openQibla()},
      h('div.row-flex',
        h('div.mini-compass', {html:`<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="37" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/><g style="transform:rotate(${q}deg);transform-origin:40px 40px"><path d="M40 10 L47 42 L40 38 L33 42Z" fill="var(--p)"/></g><text x="40" y="12" font-size="9" text-anchor="middle" fill="currentColor" opacity=".6">ش</text></svg>`}),
        h('div.grow', h('div.bold', 'اتجاه القبلة'), h('div.small.muted', M.n(q)+'° من الشمال الحقيقي • '+M.n(Math.round(M.distKaaba()).toLocaleString('en'))+' كم إلى الكعبة')),
        h('span.chev', {html:M.icon('fwd')}))));
    if(!simple && M.qiblaMini) try{ M.qiblaMini(el.lastChild); }catch(e){}
    el.append(h('div.tiny.muted.center', {style:'margin:14px 0 4px'}, 'طريقة الحساب: '+(M.METHODS.find(m=>m[0] === M.cfg.method) || [,''])[1]+(M.cfg.method === 'auto' ? ' ('+(M.METHODS.find(m=>m[0] === M.methodKey()) || [,''])[1]+')' : '')+' • '+(M.cfg.madhhab === 'hanafi' ? 'العصر حنفي' : 'العصر شافعي/جمهور')));
  }
};
async function requestNotifyPermission(){
  try{ if(window.Android && window.Android.requestNotifications) window.Android.requestNotifications(); }catch(e){}
}

function locationSheet(){
  const loc = M.location();
  const list = h('div.list');
  const sh = M.sheet({title:'اختيار الموقع', content:h('div.col-flex',
    h('button.btn.block', {onclick:async()=>{
      try{ M.toast('جارٍ تحديد الموقع…'); const l = await M.detectLocation(); M.save('loc', l); sh.close(); M.toast('الموقع: '+l.name); refresh(); }
      catch(e){ M.toast('تعذّر تحديد الموقع. تأكد من تفعيل خدمة الموقع ومنح الصلاحية أو اختر مدينتك.'); }
    }}, M.ic('pin'), 'تحديد موقعي تلقائيًا'),
    h('input.field', {placeholder:'ابحث عن مدينة…', oninput:e=>drawList(e.target.value)}), list)});
  function drawList(q){
    list.innerHTML = ''; const nq = M.normAr(q || '');
    M.CITIES.filter(c=>!nq || M.normAr(c[0]).includes(nq)).forEach(c=>{
      list.append(h('button.item', {onclick:()=>{ M.save('loc', {name:c[0], lat:c[1], lng:c[2], tz:c[3], auto:false}); sh.close(); refresh(); }}, h('div.grow.t', c[0]), loc.name === c[0] ? h('span.badge', 'الحالي') : null));
    });
  }
  drawList('');
}
function refresh(){ M.screens.prayer.build(M.$('#screen-prayer')); if(M.curTab === 'home') M.refreshScreen('home'); }

function prayerSettings(){
  const body = h('div.col-flex',
    h('div.small.muted', 'طريقة الحساب (الجهة المعتمدة)'),
    h('select.field', {onchange:e=>{ M.save('method', e.target.value); refresh(); }}, M.METHODS.map(([v, n])=>h('option', {value:v, selected:v === M.cfg.method}, n))),
    h('div.small.muted', 'المذهب الفقهي (وقت العصر)'),
    (()=>{ const note = h('div.tiny.muted', {style:'line-height:1.8'});
      const say = v=>{ note.textContent = v === 'hanafi' ? 'الحنفي: يدخل العصر حين يصير ظل الشيء مِثلَيه (بعد ظل الزوال) — فيتأخر عن بقية المذاهب.' : 'الشافعي والمالكي والحنبلي (الجمهور): يدخل العصر حين يصير ظل الشيء مثله (بعد ظل الزوال).'; };
      say(M.cfg.madhhab);
      return h('div.col-flex', {style:'gap:6px'}, M.seg([['shafi','الشافعي والمالكي والحنبلي'],['hanafi','الحنفي']], M.cfg.madhhab === 'hanafi' ? 'hanafi' : 'shafi', v=>{ M.save('madhhab', v); say(v); refresh(); }), note); })(),
    h('div.row-flex', h('div.grow', h('div', 'إظهار وقت الإقامة'), h('div.small.muted', 'بعد الأذان بعدد دقائق تحدده')), M.switchEl(M.cfg.iqamaOn !== false, v=>{ M.save('iqamaOn', v); refresh(); })),
    iqamaRows(),
    h('div.small.muted', 'تعديل يدوي للدقائق (± دقيقة)'),
    adjustRows(),
    h('div.small.muted', 'صيغة الساعة (١٢/٢٤) من «الخط والأرقام»، وصوت الأذان والتنبيه من «الإشعارات والأصوات».'));
  M.sheet({title:'إعدادات المواقيت', content:body});
}
function iqamaRows(){
  const wrap = h('div.col-flex.gap-s');
  ['fajr','dhuhr','asr','maghrib','isha'].forEach(k=>{
    const name = M.PRAYERS.find(p=>p[0] === k)[1];
    const val = h('b.num', M.n((M.cfg.iqama || {})[k] || 0));
    const set = d=>{ const a = Object.assign({}, M.cfg.iqama); a[k] = Math.max(0, Math.min(60, (a[k] || 0) + d)); M.save('iqama', a); val.textContent = M.n(a[k]); refresh(); };
    wrap.append(h('div.row-flex', h('div.grow', 'الإقامة بعد '+name+' (دقيقة)'), h('button.icon-btn.tonal', {onclick:()=>set(-1)}, M.ic('minus')), h('div.adj-v', val), h('button.icon-btn.tonal', {onclick:()=>set(1)}, M.ic('plus'))));
  });
  return wrap;
}
function adjustRows(){
  const wrap = h('div.col-flex.gap-s');
  M.PRAYERS.forEach(([k, name])=>{
    const val = h('b.num', M.n((M.cfg.adjust || {})[k] || 0));
    const set = d=>{ const a = Object.assign({}, M.cfg.adjust); a[k] = Math.max(-30, Math.min(30, (a[k] || 0) + d)); M.save('adjust', a); val.textContent = M.n(a[k]); refresh(); };
    wrap.append(h('div.row-flex', h('div.grow', name), h('button.icon-btn.tonal', {onclick:()=>set(-1)}, M.ic('minus')), h('div.adj-v', val), h('button.icon-btn.tonal', {onclick:()=>set(1)}, M.ic('plus'))));
  });
  return wrap;
}

/* ---- schedule tables ---- */
function openSchedule(){
  let range = 'month', base = new Date();
  const view = M.openView({id:'schedule', title:'جدول المواقيت', actions:[
    h('button.icon-btn', {'aria-label':'تصدير', onclick:()=>exportCSV()}, M.ic('share')),
    h('button.icon-btn', {'aria-label':'طباعة', onclick:()=>{ try{ if(window.Android && window.Android.print) window.Android.print(); else window.print(); }catch(e){ M.toast('الطباعة غير متاحة'); } }}, M.ic('download'))]});
  const host = h('div'); const seg = M.seg([['week','أسبوع'],['month','شهر'],['year','سنة']], range, v=>{ range = v; draw(); });
  view.body.append(seg, h('div', {style:'height:10px'}), host);
  function rows(){
    const out = []; let start, n;
    if(range === 'week'){ start = new Date(base); start.setDate(start.getDate() - ((start.getDay() + 1) % 7)); n = 7; }
    else if(range === 'month'){ start = new Date(base.getFullYear(), base.getMonth(), 1); n = new Date(base.getFullYear(), base.getMonth()+1, 0).getDate(); }
    else { start = new Date(base.getFullYear(), 0, 1); n = (new Date(base.getFullYear(), 11, 31) - start)/86400000 + 1; }
    for(let i = 0; i < n; i++){ const d = M.addDays(start, i); out.push([d, M.prayerTimes(d)]); }
    return out;
  }
  function draw(){
    host.innerHTML = '';
    const title = range === 'year' ? 'عام '+M.n(base.getFullYear()) : M.GMONTHS[base.getMonth()]+' '+M.n(base.getFullYear());
    host.append(h('div.row-flex', h('button.icon-btn', {onclick:()=>{ shift(-1); }}, M.ic('back')), h('div.grow.center.bold', range === 'week' ? 'الأسبوع' : title), h('button.icon-btn', {onclick:()=>{ shift(1); }}, M.ic('fwd'))));
    const tbl = h('table.ptbl'); tbl.append(h('thead', h('tr', h('th', 'التاريخ'), ...M.PRAYERS.map(p=>h('th', p[1])))));
    const tb = h('tbody'); const today = M.dkey();
    rows().forEach(([d, t])=>{
      tb.append(h('tr'+(M.dkey(d) === today ? '.today' : ''), h('td', h('div.bold.num', M.n(d.getDate())+'/'+M.n(d.getMonth()+1)), h('div.tiny.muted', M.WEEKDAYS[d.getDay()])), ...M.PRAYERS.map(p=>h('td.num', M.fmt(t[p[0]]).replace(' ص','ص').replace(' م','م')))));
    });
    tbl.append(tb); host.append(h('div.card.tbl-wrap', tbl));
  }
  function shift(dir){ if(range === 'week') base = M.addDays(base, 7*dir); else if(range === 'month') base = new Date(base.getFullYear(), base.getMonth()+dir, 1); else base = new Date(base.getFullYear()+dir, 0, 1); draw(); }
  function exportCSV(){
    const l = M.location();
    const lines = ['التاريخ,'+M.PRAYERS.map(p=>p[1]).join(',')];
    rows().forEach(([d, t])=>lines.push(M.dkey(d)+','+M.PRAYERS.map(p=>M.fmtTime(t[p[0]], l.tz).replace(/[٠-٩]/g, c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c))).join(',')));
    M.share('مواقيت الصلاة — '+l.name+'\n'+lines.join('\n'));
  }
  draw();
}


function prayerSheet(k, lbl, t){
  if(k === 'sunrise'){ if(M.openNotifItem) M.openNotifItem('sunrise'); return; }
  const c = h('div.ps');
  const row = (a, b, tr)=>h('div.ps-row', h('div.ps-t', h('div.bold', a), b ? h('div.small.muted', b) : null), h('div.ps-c', tr));
  const iqv = h('b.num.ps-v', M.n((M.cfg.iqama || {})[k] || 0));
  const setIq = d=>{ const q = Object.assign({}, M.cfg.iqama); q[k] = Math.max(0, Math.min(90, (q[k] || 0) + d)); M.save('iqama', q); iqv.textContent = M.n(q[k]); M.haptic && M.haptic(8); };
  const stepper = h('div.ps-step', h('button.ps-sb', {'aria-label':'إنقاص', onclick:()=>setIq(-1)}, M.ic('minus')), iqv, h('button.ps-sb', {'aria-label':'زيادة', onclick:()=>setIq(1)}, M.ic('plus')));
  c.append(h('div.ps-head', h('div.num.ps-time', M.fmt(t[k]))),
    h('div.list.card.ps-list',
      row('إشعار الأذان', 'نغمة وصوت خاص بهذه الصلاة', h('button.btn.tonal.sm', {onclick:()=>{ M.openNotifItem(k); }}, 'ضبط')),
      row('تنبيه قبل الصلاة', 'رسالة تذكير قبل الوقت', h('button.btn.tonal.sm', {onclick:()=>{ M.openNotifItem('pre_'+k); }}, 'ضبط')),
      row('الإقامة بعد', 'بالدقائق بعد الأذان', stepper),
      row('إشعار الإقامة', 'ينبّهك عند وقت الإقامة', M.switchEl(!!(M.cfg.iqamaNotif || {})[k], v=>{ const x = Object.assign({}, M.cfg.iqamaNotif); x[k] = v; M.save('iqamaNotif', x); M.syncNative && M.syncNative(); }))));
  M.sheet({title:'صلاة '+lbl, content:c});
}


let leafletP = null;
function loadLeaflet(){
  if(window.L && window.L.map) return Promise.resolve();
  return leafletP = leafletP || new Promise((res, rej)=>{
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/leaflet.css'; document.head.appendChild(l);
    const sc = document.createElement('script'); sc.src = 'js/vendor/leaflet.min.js'; sc.onload = res; sc.onerror = ()=>{ leafletP = null; rej(new Error('leaflet')); }; document.head.appendChild(sc);
  });
}
const fmtInt = n=>{ const s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, M.cfg.digits === 'hindi' ? '٬' : ','); return M.n(s); };
const fmtDec = (n, d)=>M.n(n.toFixed(d)).replace('.', M.cfg.digits === 'hindi' ? '٫' : '.');
M.fmtInt = fmtInt; M.fmtDec = fmtDec;

/* Google Maps JavaScript API (key supplied by the app owner; restrict it to this app's origin in Google Cloud) */
const GMAPS_KEY = 'AQ.Ab8RN6LwsGdoeaE2etCg1x8wWmAqC1UJUKk8gfcj9qA9TKQ7SA';
let gP = null, gFail = false;
function loadGoogle(){
  return gP = gP || new Promise((res, rej)=>{
    if(window.google && google.maps && google.maps.Map) return res();
    const key = M.cfg.gmapsKey || GMAPS_KEY; if(!key || gFail || !navigator.onLine) return rej(new Error('nokey'));
    window.__gmReady = ()=>res();
    window.gm_authFailure = ()=>{ gFail = true; M.emit('gmfail'); };
    const sc = document.createElement('script'); sc.async = true;
    sc.src = 'https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key)+'&language=ar&v=weekly&callback=__gmReady';
    sc.onerror = ()=>{ gP = null; rej(new Error('load')); };
    document.head.appendChild(sc);
    setTimeout(()=>{ if(!(window.google && google.maps && google.maps.Map)){ gP = null; rej(new Error('timeout')); } }, 9000);
  });
}
const G_DARK = [{elementType:'geometry', stylers:[{color:'#1f2a30'}]}, {elementType:'labels.text.stroke', stylers:[{color:'#1f2a30'}]}, {elementType:'labels.text.fill', stylers:[{color:'#9fb3bd'}]},
  {featureType:'water', elementType:'geometry', stylers:[{color:'#0f171b'}]}, {featureType:'road', elementType:'geometry', stylers:[{color:'#2d3b43'}]}, {featureType:'poi', stylers:[{visibility:'off'}]},
  {featureType:'administrative', elementType:'geometry.stroke', stylers:[{color:'#42545e'}]}];
M.loadGoogleMaps = loadGoogle; M.loadLeaflet = loadLeaflet; M.G_DARK = G_DARK; M.googleFailed = ()=>gFail;
M.openLink = function(u){ try{ if(window.Android) location.href = u; else window.open(u, '_blank', 'noopener'); }catch(e){} };
function qiblaMap(){
  const Lc = M.location(), K = {lat:21.4225, lng:39.8262}, qd = M.qiblaDeg();
  /* live compass: a beam at "my location" turns with the phone and goes green when it lines up with the qibla */
  let heading = null, onHead = null, wasOk = false, killed = false, killMap = null;
  const orientM = e=>{
    let hd = null;
    if(e.webkitCompassHeading != null) hd = e.webkitCompassHeading;
    else if((e.absolute || e.type === 'deviceorientationabsolute') && e.alpha != null) hd = 360 - e.alpha;
    if(hd == null || isNaN(hd)) return;
    hd = (hd + 360) % 360;
    if(heading == null) heading = hd; else { const dl = ((hd - heading) % 360 + 540) % 360 - 180; heading = (heading + dl * .3 + 360) % 360; }
    const diff = ((qd - heading) % 360 + 540) % 360 - 180, ok = Math.abs(diff) <= (wasOk ? 7 : 4);
    if(ok && !wasOk) M.haptic && M.haptic([20, 40, 20]);
    wasOk = ok;
    live.classList.toggle('ok', ok);
    live.textContent = ok ? 'أنت الآن متجه نحو القبلة' : 'أدِر الهاتف '+(diff > 0 ? 'يمينًا' : 'يسارًا')+' '+M.n(Math.round(Math.abs(diff)))+'° لتواجه القبلة';
    if(onHead) onHead(heading, ok);
  };
  const startH = async()=>{
    try{ if(typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission){ const r = await DeviceOrientationEvent.requestPermission(); if(r !== 'granted') return; } }catch(e){}
    if(killed) return;
    window.addEventListener('deviceorientationabsolute', orientM, true); window.addEventListener('deviceorientation', orientM, true);
    setTimeout(()=>{ if(heading == null) live.textContent = 'بوصلة الهاتف غير متاحة؛ السهم الأخضر يبيّن اتجاه القبلة من موقعك.'; }, 3000);
  };
  const stopH = ()=>{ window.removeEventListener('deviceorientationabsolute', orientM, true); window.removeEventListener('deviceorientation', orientM, true); };
  const live = h('div.qm-live', 'حرّك الهاتف وهو أفقي ليظهر اتجاهك على الخريطة');
  const view = M.openView({id:'qmap', title:'القبلة على الخريطة', nopad:true, onClose:()=>{ killed = true; stopH(); try{ killMap && killMap(); }catch(e){} }});
  startH();
  view.body.style.overflow = 'hidden';
  const mapEl = h('div.qm-map'), ctl = h('div.qm-ctl');
  const dist = M.distKaaba();
  const dirs = ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'];
  const src = h('div.tiny.muted', 'جارٍ تحميل الخريطة…');
  const dark = /dark|amoled/.test(document.documentElement.dataset.theme || '') || (matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme === 'auto');
  const info = h('div.card.pad.qm-info',
    h('div.bold', 'أقصر مسار إلى الكعبة'),
    h('div.small.muted', {html:fmtInt(dist)+' كم • اتجاه القبلة <bdi dir="ltr">'+fmtDec(qd, 1)+'°</bdi> نحو '+dirs[Math.round(qd / 45) % 8]}),
    live,
    h('button.btn.tonal.sm.qm-g', {onclick:()=>M.openLink('https://www.google.com/maps/dir/?api=1&origin='+Lc.lat+','+Lc.lng+'&destination='+K.lat+','+K.lng)}, M.ic('globe'), 'فتح المسار في خرائط جوجل'),
    src);
  view.body.append(h('div.qm', mapEl, info));
  mapEl.append(ctl);
  const box = h('div.qm-err.hide', 'تعذّر تحميل الخريطة. تحقق من الاتصال بالإنترنت ثم أعد فتح الشاشة.'); mapEl.append(box);
  const useLeaflet = ()=>loadLeaflet().then(()=>{
    src.textContent = 'الخريطة من © OpenStreetMap وتحتاج اتصالًا بالإنترنت.';
    const L = window.L;
    const map = L.map(mapEl, {zoomControl:false, attributionControl:true, worldCopyJump:true, minZoom:2, maxZoom:18, zoomSnap:.5});
    map.attributionControl.setPrefix(false);
    // OpenStreetMap tiles need no key; a second server takes over if the first fails
    const opt = {maxZoom:19, attribution:'© OpenStreetMap', referrerPolicy:'origin', crossOrigin:false};
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', opt);
    const alt = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', Object.assign({subdomains:'abc'}, opt));
    mapEl.classList.toggle('dark', !!dark);
    let errs = 0, cur = osm; osm.addTo(map);
    osm.on('tileerror', ()=>{ if(++errs === 6 && cur === osm){ map.removeLayer(osm); alt.addTo(map); cur = alt; alt.on('tileerror', ()=>{ box.classList.remove('hide'); }); } });
    // great circle (unwrapped so it never jumps across the map)
    const r = Math.PI / 180, a = [Lc.lat * r, Lc.lng * r], b = [K.lat * r, K.lng * r];
    const d = Math.acos(Math.max(-1, Math.min(1, Math.sin(a[0]) * Math.sin(b[0]) + Math.cos(a[0]) * Math.cos(b[0]) * Math.cos(b[1] - a[1]))));
    const pts = []; let prev = Lc.lng;
    for(let i = 0; i <= 80; i++){
      const f = i / 80; let lat, lng;
      if(d < 1e-6){ lat = K.lat; lng = K.lng; } else {
        const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
        const x = A * Math.cos(a[0]) * Math.cos(a[1]) + B * Math.cos(b[0]) * Math.cos(b[1]), y = A * Math.cos(a[0]) * Math.sin(a[1]) + B * Math.cos(b[0]) * Math.sin(b[1]), z = A * Math.sin(a[0]) + B * Math.sin(b[0]);
        lat = Math.atan2(z, Math.hypot(x, y)) / r; lng = Math.atan2(y, x) / r;
      }
      while(lng - prev > 180) lng -= 360; while(lng - prev < -180) lng += 360; prev = lng; pts.push([lat, lng]);
    }
    L.polyline(pts, {color:'#fff', weight:7, opacity:.85, lineCap:'round'}).addTo(map);
    L.polyline(pts, {color:'#0F8A6D', weight:3.5, dashArray:'2 9', lineCap:'round'}).addTo(map);
    const kLng = pts[pts.length - 1][1];
    const arrow = L.divIcon({className:'qm-arrow', iconSize:[84, 84], iconAnchor:[42, 42], html:'<svg viewBox="-42 -42 84 84" style="transform:rotate('+qd+'deg)"><circle r="40" fill="rgba(15,138,109,.16)"/><path d="M0 -34 L13 -6 L4 -9 L4 16 L-4 16 L-4 -9 L-13 -6 Z" fill="#0F8A6D" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cy="22" r="6.5" fill="#2563EB" stroke="#fff" stroke-width="3"/></svg>'});
    L.marker([Lc.lat, Lc.lng], {icon:arrow, interactive:false, zIndexOffset:900}).addTo(map);
    const beam = L.divIcon({className:'qm-beam', iconSize:[150, 150], iconAnchor:[75, 75], html:'<svg viewBox="-75 -75 150 150"><defs><radialGradient id="qmbg" r="1"><stop offset="0" stop-color="currentColor" stop-opacity=".55"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs><path d="M0 0 L-30 -66 A72 72 0 0 1 30 -66 Z" fill="url(#qmbg)"/></svg>'});
    const bm = L.marker([Lc.lat, Lc.lng], {icon:beam, interactive:false, zIndexOffset:850}).addTo(map);
    onHead = (hd, ok)=>{ const e = bm.getElement(); if(!e) return; e.classList.add('on'); e.classList.toggle('ok', ok); const sv = e.firstChild; if(sv) sv.style.transform = 'rotate('+hd+'deg)'; };
    const kaaba = L.divIcon({className:'qm-kaaba', iconSize:[46, 54], iconAnchor:[23, 40], html:'<i></i><b>الكعبة</b>'});
    L.marker([K.lat, kLng], {icon:kaaba, interactive:false, zIndexOffset:800}).addTo(map);
    const fitAll = ()=>map.fitBounds(L.latLngBounds(pts), {padding:[56, 56], maxZoom:8});
    const toMe = ()=>map.setView([Lc.lat, Lc.lng], Math.max(map.getZoom(), 5), {animate:true});
    const toK = ()=>map.setView([K.lat, kLng], 10, {animate:true});
    if(dist < 4500) fitAll(); else map.setView([Lc.lat, Lc.lng], 4);
    ctl.append(h('div.qm-z', h('button.qm-b.sq', {'aria-label':'تكبير', onclick:()=>map.zoomIn()}, '+'), h('button.qm-b.sq', {'aria-label':'تصغير', onclick:()=>map.zoomOut()}, '−')),
      h('div.qm-r', btn('موقعي', toMe), btn('الكعبة', toK), btn('المسار كاملًا', fitAll)));
    let gone = false; const fix = ()=>{ if(!gone) try{ map.invalidateSize(); }catch(e){} }; setTimeout(fix, 120); setTimeout(fix, 450);
    const ro = new ResizeObserver(fix); ro.observe(mapEl);
    killMap = ()=>{ if(gone) return; gone = true; ro.disconnect(); setTimeout(()=>{ try{ map.stop(); map.remove(); }catch(e){} }, 400); };   // after the closing animation and Leaflet's own timers
    if(killed) killMap();
  }).catch(()=>{ box.classList.remove('hide'); });
  const btn = (t, f)=>h('button.qm-b', {onclick:()=>{ f(); M.haptic(6); }}, t);
  /* Google Maps first (needs a valid key for this app); OpenStreetMap takes over on any failure */
  const useGoogle = ()=>loadGoogle().then(()=>{
    const g = google.maps, me = {lat:Lc.lat, lng:Lc.lng}, kb = {lat:K.lat, lng:K.lng};
    const gEl = h('div.qm-gmap'); mapEl.prepend(gEl);
    let dead = false;
    const fallback = ()=>{ if(dead) return; dead = true; offFail(); gEl.remove(); ctl.innerHTML = ''; useLeaflet(); };
    const offFail = M.on('gmfail', fallback) || (()=>{});
    const map = new g.Map(gEl, {center:me, zoom:4, minZoom:2, disableDefaultUI:true, gestureHandling:'greedy', clickableIcons:false, keyboardShortcuts:false, styles:dark ? G_DARK : null, backgroundColor:dark ? '#1b2428' : '#e9eef0'});
    new g.Polyline({map, path:[me, kb], geodesic:true, strokeColor:'#ffffff', strokeOpacity:.85, strokeWeight:7, clickable:false});
    new g.Polyline({map, path:[me, kb], geodesic:true, strokeOpacity:0, clickable:false, icons:[{icon:{path:g.SymbolPath.CIRCLE, fillColor:'#0F8A6D', fillOpacity:1, strokeOpacity:0, scale:2.4}, offset:'0', repeat:'11px'}]});
    new g.Marker({map, position:me, clickable:false, zIndex:8, icon:{path:g.SymbolPath.CIRCLE, scale:38, fillColor:'#0F8A6D', fillOpacity:.16, strokeOpacity:0}});
    new g.Marker({map, position:me, clickable:false, zIndex:9, icon:{path:'M0 -56 L13 -28 L4 -31 L4 -6 L-4 -6 L-4 -31 L-13 -28 Z', rotation:qd, fillColor:'#0F8A6D', fillOpacity:1, strokeColor:'#ffffff', strokeWeight:2.5, scale:1}});
    new g.Marker({map, position:me, clickable:false, zIndex:10, icon:{path:g.SymbolPath.CIRCLE, scale:6.5, fillColor:'#2563EB', fillOpacity:1, strokeColor:'#ffffff', strokeWeight:3}});
    new g.Marker({map, position:kb, clickable:false, zIndex:7, label:{text:'الكعبة', color:dark ? '#ffffff' : '#111111', fontWeight:'700', fontSize:'13px'}, icon:{path:'M-10 -10 H10 V10 H-10 Z', fillColor:'#111111', fillOpacity:1, strokeColor:'#d4a017', strokeWeight:2.5, scale:1, labelOrigin:new g.Point(0, 24)}});
    const gBeam = new g.Marker({map, position:me, clickable:false, zIndex:6, visible:false});
    onHead = (hd, ok)=>{ if(dead) return; gBeam.setIcon({path:'M0 0 L-30 -66 A72 72 0 0 1 30 -66 Z', rotation:hd, fillColor:ok ? '#16a34a' : '#2563EB', fillOpacity:.32, strokeOpacity:0, scale:1}); gBeam.setVisible(true); };
    const fitAll = ()=>{ const bb = new g.LatLngBounds(); bb.extend(me); bb.extend(kb); map.fitBounds(bb, 56); };
    const toMe = ()=>{ map.panTo(me); if(map.getZoom() < 5) map.setZoom(5); };
    const toK = ()=>{ map.setCenter(kb); map.setZoom(16); };
    if(dist < 4500) fitAll();
    ctl.append(h('div.qm-z', h('button.qm-b.sq', {'aria-label':'تكبير', onclick:()=>map.setZoom(map.getZoom() + 1)}, '+'), h('button.qm-b.sq', {'aria-label':'تصغير', onclick:()=>map.setZoom(map.getZoom() - 1)}, '−')),
      h('div.qm-r', btn('موقعي', toMe), btn('الكعبة', toK), btn('المسار كاملًا', fitAll), btn('قمر صناعي', ()=>map.setMapTypeId(map.getMapTypeId() === 'hybrid' ? 'roadmap' : 'hybrid'))));
    src.textContent = 'الخريطة من Google وتحتاج اتصالًا بالإنترنت.';
    // tiles never arriving (blocked key / no network) also falls back
    let ok = false; g.event.addListenerOnce(map, 'tilesloaded', ()=>{ ok = true; });
    setTimeout(()=>{ if(!ok && !dead) fallback(); }, 9000);
  });
  if(gFail) useLeaflet(); else useGoogle().catch(()=>useLeaflet());
}

/* ---- Qibla compass / AR ---- */
function openQibla(){
  const qd = M.qiblaDeg();
  let heading = null, hist = [], arOn = false, stream = null, aligned = false;
  const view = M.openView({id:'qibla', title:'اتجاه القبلة', onClose:()=>{ stop(); }, actions:[
    h('button.icon-btn', {'aria-label':'الخريطة', onclick:()=>qiblaMap()}, M.ic('globe')),
    h('button.icon-btn', {'aria-label':'الواقع المعزز', onclick:()=>toggleAR()}, M.ic('camera'))]});
  const dial = h('div.dial', {html:`<svg viewBox="0 0 300 300" class="dial-svg"><circle cx="150" cy="150" r="142" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width="2"/><circle cx="150" cy="150" r="118" fill="none" stroke="currentColor" stroke-opacity=".1"/>${Array.from({length:72}, (_, i)=>{ const a = i*5, l = i%6 === 0 ? 14 : 7; return `<line x1="150" y1="8" x2="150" y2="${8+l}" stroke="currentColor" stroke-opacity="${i%6 === 0 ? .6 : .25}" stroke-width="${i%6 === 0 ? 2 : 1}" transform="rotate(${a} 150 150)"/>`; }).join('')}<text x="150" y="42" text-anchor="middle" font-size="18" font-weight="700" fill="var(--danger)">ش</text><text x="150" y="272" text-anchor="middle" font-size="16" fill="currentColor" opacity=".7">ج</text><text x="268" y="156" text-anchor="middle" font-size="16" fill="currentColor" opacity=".7">ق</text><text x="32" y="156" text-anchor="middle" font-size="16" fill="currentColor" opacity=".7">غ</text></svg><div class="kaaba-mark" style="transform:rotate(${qd}deg)"><span>${M.icon('kaaba')}</span></div>`});
  const pointer = h('div.dial-pointer', {html:'<svg viewBox="0 0 24 40"><path d="M12 0 24 28 12 22 0 28Z" fill="var(--p)"/></svg>'});
  const status = h('div.q-status', 'حرّك الجهاز لقراءة الاتجاه…');
  const acc = h('div.small.muted.center', '');
  const video = h('video.ar-video.hide', {autoplay:true, playsinline:true, muted:true});
  const arMark = h('div.ar-mark.hide', {html:M.icon('kaaba')});
  const body = view.body;
  body.append(h('div.q-wrap', video, arMark, h('div.dial-box', dial, pointer), status,
    h('div.card.pad.q-info', h('div.grid2', h('div.center', h('div.small.muted', 'زاوية القبلة'), h('div.bold.num', M.fmtDec(qd, 1)+'°')), h('div.center', h('div.small.muted', 'المسافة إلى الكعبة'), h('div.bold.num', M.fmtInt(M.distKaaba())+' كم'))), acc),
    h('div.tiny.muted.center', 'للحصول على أدق قراءة: ابتعد عن المعادن والمغناطيس، وضع الجهاز أفقيًا، وحرّكه على شكل ٨ للمعايرة.')));
  const orient = e=>{
    let hd = null;
    if(e.webkitCompassHeading != null) hd = e.webkitCompassHeading;
    else if(e.absolute && e.alpha != null) hd = 360 - e.alpha;
    else if(e.alpha != null && e.type === 'deviceorientationabsolute') hd = 360 - e.alpha;
    if(hd == null || isNaN(hd)) return;
    hd = (hd + 360) % 360;
    // low-pass on the circle so the needle and the "aligned" state do not jitter
    if(heading == null) heading = hd; else { let dl = ((hd - heading) % 360 + 540) % 360 - 180; heading = (heading + dl * .25 + 360) % 360; }
    hist.push(hd); if(hist.length > 12) hist.shift();
    update();
  };
  function update(){
    if(heading == null) return;
    dial.style.transform = 'rotate('+(-heading)+'deg)';
    let diff = ((qd - heading) % 360 + 540) % 360 - 180;
    const ok = Math.abs(diff) < (aligned ? 8 : 4); // hysteresis: stays aligned until clearly off
    if(ok && !aligned){ M.haptic(40); }
    aligned = ok; view.el.classList.toggle('aligned', ok);
    status.textContent = ok ? 'أنت تتجه نحو القبلة ✓' : (diff > 0 ? 'استدر يمينًا ' : 'استدر يسارًا ')+M.cnt(Math.round(Math.abs(diff)), 'درجة', true);
    // sensor stability
    if(hist.length > 6){ let m = 0; for(let i = 1; i < hist.length; i++){ let d = Math.abs(hist[i] - hist[i-1]); if(d > 180) d = 360 - d; m += d; } m /= hist.length - 1;
      acc.textContent = 'دقة المستشعر: '+(m < 1.5 ? 'جيدة' : m < 4 ? 'متوسطة' : 'ضعيفة — قم بمعايرة الجهاز'); }
    if(arOn){ const fov = 60; const x = Math.max(-1, Math.min(1, diff / fov)); arMark.style.left = (50 + x * 45)+'%'; arMark.classList.toggle('edge', Math.abs(diff) > fov); arMark.classList.toggle('ok', ok); }
  }
  async function start(){
    try{
      if(typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission){ const r = await DeviceOrientationEvent.requestPermission(); if(r !== 'granted'){ status.textContent = 'لم يُمنح إذن المستشعر'; return; } }
    }catch(e){}
    window.addEventListener('deviceorientationabsolute', orient, true);
    window.addEventListener('deviceorientation', orient, true);
    setTimeout(()=>{ if(heading == null) status.textContent = 'المستشعر غير متاح على هذا الجهاز. اتجه نحو '+M.n(Math.round(qd))+'° من الشمال.'; }, 2500);
  }
  function stop(){
    window.removeEventListener('deviceorientationabsolute', orient, true);
    window.removeEventListener('deviceorientation', orient, true);
    if(stream){ stream.getTracks().forEach(t=>t.stop()); stream = null; }
  }
  async function toggleAR(){
    if(arOn){ arOn = false; video.classList.add('hide'); arMark.classList.add('hide'); view.el.classList.remove('ar'); if(stream){ stream.getTracks().forEach(t=>t.stop()); stream = null; } return; }
    try{
      stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}, audio:false});
      if(view.closed){ stream.getTracks().forEach(t=>t.stop()); stream = null; return; }   // closed while the camera was opening
      video.srcObject = stream; video.classList.remove('hide'); arMark.classList.remove('hide'); arOn = true; view.el.classList.add('ar'); update();
    }catch(e){ M.toast('تعذّر فتح الكاميرا. امنح التطبيق إذن الكاميرا.'); }
  }
  start();
}
M.openQiblaMap = qiblaMap; M.openQibla = openQibla; M.prayerSettings = prayerSettings; M.locationSheet = locationSheet;
})();
