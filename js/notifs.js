/* ===== Notification centre: every notification has its own switch, timing, sound & channel ===== */
(function(){
'use strict';
const M = window.M, h = M.h;

M.defaults.nf = {}; if(!M.cfg.nf) M.cfg.nf = {};
if(M.defaults.nfMaster === undefined) M.defaults.nfMaster = true;

const MON = ['r_mon1', 'r_mon2'], THU = ['r_thu1', 'r_thu2'];
const GROUPS = [['prayer', 'الصلوات', 'اختر الأذان وفعّل ما تحب'], ['pre', 'اقتراب الصلاة', 'تنبيه صوتي قبل كل صلاة'], ['night', 'الليل والضحى', ''], ['adhkar', 'الأذكار', ''], ['worship', 'العبادات والسنن', '']];
const NF = [
  {id:'fajr', g:'prayer', t:'الفجر', ic:'p:fajr', on:false, kind:'adhan'},
  {id:'sunrise', g:'prayer', t:'الشروق', ic:'p:sunrise', on:false, kind:'adhan', plain:true},
  {id:'dhuhr', g:'prayer', t:'الظهر', ic:'p:dhuhr', on:false, kind:'adhan'},
  {id:'asr', g:'prayer', t:'العصر', ic:'p:asr', on:false, kind:'adhan'},
  {id:'maghrib', g:'prayer', t:'المغرب', ic:'p:maghrib', on:false, kind:'adhan'},
  {id:'isha', g:'prayer', t:'العشاء', ic:'p:isha', on:false, kind:'adhan'},
  {id:'pre_fajr', g:'pre', t:'اقتراب الفجر', ic:'bell', on:false, off:10, offLbl:'قبل الصلاة بـ', offMax:60, snd:'pre_fajr', pre:'fajr'},
  {id:'pre_dhuhr', g:'pre', t:'اقتراب الظهر / الجمعة', ic:'bell', on:false, off:10, offLbl:'قبل الصلاة بـ', offMax:60, snd:'pre_dhuhr', pre:'dhuhr'},
  {id:'pre_asr', g:'pre', t:'اقتراب العصر', ic:'bell', on:false, off:10, offLbl:'قبل الصلاة بـ', offMax:60, snd:'pre_asr', pre:'asr'},
  {id:'pre_maghrib', g:'pre', t:'اقتراب المغرب', ic:'bell', on:false, off:10, offLbl:'قبل الصلاة بـ', offMax:60, snd:'pre_maghrib', pre:'maghrib'},
  {id:'pre_isha', g:'pre', t:'اقتراب العشاء', ic:'bell', on:false, off:10, offLbl:'قبل الصلاة بـ', offMax:60, snd:'pre_isha', pre:'isha'},
  {id:'lastthird', g:'night', t:'الثلث الأخير من الليل', ic:'moon', on:false, pool:['r_qiyam1', 'r_qiyam2']},
  {id:'midnight', g:'night', t:'منتصف الليل', ic:'moon', on:false, quiet:true},
  {id:'duha', g:'night', t:'صلاة الضحى', ic:'sun', on:false, off:20, offLbl:'بعد الشروق بـ', offMax:180, quiet:true},
  {id:'morning', custom:true, g:'adhkar', t:'أذكار الصباح', ic:'sunrise', on:false, off:15, offLbl:'بعد الشروق بـ', offMax:180, snd:'r_morning'},
  {id:'evening', custom:true, g:'adhkar', t:'أذكار المساء', ic:'moon', on:false, off:35, offLbl:'بعد العصر بـ', offMax:180, snd:'r_evening'},
  {id:'sleep', custom:true, g:'adhkar', t:'أذكار النوم', ic:'star', on:false, off:75, offLbl:'بعد العشاء بـ', offMax:240, pool:['r_istighfar1', 'r_istighfar2']},
  {id:'dhikr', g:'adhkar', t:'ذكر الله', ic:'beads', on:false, clock:'11:00', multi:true, custom:true, pool:['r_dhikr1', 'r_tasbih1', 'r_ahabb', 'r_dhikr2', 'r_tasbih2', 'r_hasbuna', 'r_karb', 'r_tawakkul', 'r_tahlil', 'r_kaffara']},
  {id:'salawat', g:'adhkar', t:'الصلاة على النبي ﷺ', ic:'s:muhammad', on:false, clock:'17:30', multi:true, custom:true, pool:['r_salawat1', 'r_salawat2', 'r_salawat3', 'r_salawat4', 'r_salawat5', 'r_salawat6', 'r_istighfar1', 'r_istighfar2']},
  {id:'tijan', g:'adhkar', t:'تيجان الذكر السبعة', ic:'s:star8', on:false, clock:'09:00', multi:true, custom:true, pool:['r_dhikr1', 'r_tasbih1', 'r_dhikr2', 'r_tasbih2']},
  {id:'kahf', custom:true, g:'worship', t:'سورة الكهف يوم الجمعة', ic:'mosque', on:false, off:60, offLbl:'بعد الشروق بـ', offMax:300, pool:['r_salawat1', 'r_salawat2']},
  {id:'ijaba', g:'worship', t:'ساعة الإجابة (الجمعة)', ic:'heart', on:false, off:90, offLbl:'بعد العصر بـ', offMax:180, quiet:true},
  {id:'fast_mon', g:'worship', t:'صيام الاثنين', ic:'moon', on:false, off:60, offLbl:'بعد المغرب (ليلة الصيام) بـ', offMax:300, pool:MON},
  {id:'fast_thu', g:'worship', t:'صيام الخميس', ic:'moon', on:false, off:60, offLbl:'بعد المغرب (ليلة الصيام) بـ', offMax:300, pool:THU},
  {id:'fast_white', g:'worship', t:'الأيام البيض', ic:'moon', on:false, off:60, offLbl:'بعد المغرب بـ', offMax:300, quiet:true},
  {id:'fast_special', g:'worship', t:'عرفة وعاشوراء', ic:'calendar', on:false, off:60, offLbl:'بعد المغرب بـ', offMax:300, quiet:true},
  {id:'wird', custom:true, g:'worship', t:'ورد القرآن اليومي', ic:'quran', on:false, off:45, offLbl:'قبل العشاء بـ', offMax:240, quiet:true}
];
M.NF = NF;
M.nfFor = id=>NF.find(d=>d.snd === id || (d.pool && d.pool.includes(id)) || (id === 'pre_jumua' && d.id === 'pre_dhuhr')) || null;
M.openNotifItem = id=>{ const d = BY[id]; if(d) openItem(d); };
const BY = {}; NF.forEach(d=>BY[d.id] = d);
const PRAYER_IDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

/* every notification starts OFF; only what the user turns on (welcome pages or here) is scheduled */
if(!M.store.get('nfDefaults3', 0) && M.store.get('onboarded', 0)) M.store.set('nfDefaults3', 1);

/* one-time migration from the previous reminder settings */
if(!M.store.get('nfMig', 0)){
  const R = M.cfg.rem, nf = Object.assign({}, M.cfg.nf);
  if(R){
    const m = (id, v)=>{ nf[id] = Object.assign({}, nf[id], {on:!!v}); };
    m('morning', R.morning); m('evening', R.evening); m('sleep', R.sleep); m('kahf', R.kahf); m('wird', R.wird); m('lastthird', R.qiyam); m('dhikr', R.dhikr);
    ['fast_mon', 'fast_thu', 'fast_white', 'fast_special'].forEach(i=>m(i, R.fast));
    if(R.pre > 0) ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(p=>{ nf['pre_'+p] = {on:true, off:R.pre}; });
    M.save('nf', nf);
  }
  M.store.set('nfMig', 1);
}

function get(id){
  const d = BY[id], c = (M.cfg.nf || {})[id] || {};
  const o = {on:d.on, off:d.off, clock:d.clock, snd:'auto'};
  Object.assign(o, c);
  if(PRAYER_IDS.includes(id)) o.on = !!(M.cfg.notifyIn || {})[id];
  return o;
}
M.nfGet = get;
M.nfOn = id=>get(id).on;
M.nfSet = function(id, patch){
  const nf = Object.assign({}, M.cfg.nf); nf[id] = Object.assign({}, nf[id], patch);
  if(PRAYER_IDS.includes(id) && 'on' in patch){ const n = Object.assign({}, M.cfg.notifyIn); n[id] = !!patch.on; M.save('notifyIn', n); delete nf[id].on; }
  M.save('nf', nf);
};

/* sound resolution → {snd, tone} */
function dayN(day){ return Math.floor(day.getTime() / 864e5); }
function resolve(d, c, day, key, idx){
  let s = c.snd || 'auto';
  if(s === 'rotate'){ const set = (c.set && c.set.length) ? c.set : (d.pool || []); s = set.length ? set[(dayN(day) + (idx || 0)) % set.length] : 'auto'; }
  if(s === 'silent') return {snd:'', tone:false};
  if(s === 'default') return {snd:'', tone:true};
  if(s === 'auto'){
    if(d.kind === 'adhan'){ if(d.plain || M.cfg.adhanTone === false) return {snd:'', tone:!d.plain && M.cfg.adhanTone !== false}; return {snd:M.adhanFor(d.id), tone:true}; }
    if(d.pre) s = d.pre === 'dhuhr' && key === 'jumua' ? 'pre_jumua' : d.snd;
    else if(d.pool) s = d.pool[dayN(day) % d.pool.length];
    else s = d.snd || '';
    if(!s) return {snd:'', tone:!d.quiet};
  }
  if(M.cfg.voice === false && d.kind !== 'adhan' && !String(s).startsWith('ad_')) return {snd:'', tone:!d.quiet};
  if(d.kind === 'adhan' && d.id === 'fajr' && M.FAJR_ADHAN[s]) s = M.FAJR_ADHAN[s];
  return {snd:s, tone:true};
}
const sndName = id=>{ if(!id) return ''; for(const [i, n] of M.ADHANS) if(i === id) return n; for(const [i, n] of (M.TAKBEER || [])) if(i === id) return n; for(const [, items] of M.VOICES) for(const [i, n] of items) if(i === id) return n; for(const k in M.FAJR_ADHAN) if(M.FAJR_ADHAN[k] === id) return 'أذان الفجر'; return id; };
function labelOf(d){ return d.t; }
function soundLabel(d){
  const c = get(d.id), s = c.snd || 'auto';
  if(s === 'silent') return 'صامت'; if(s === 'default') return 'نغمة النظام';
  if(s === 'rotate') return 'تدوير بين '+M.cnt(((c.set && c.set.length) ? c.set : (d.pool || [])).length, 'صوت', true, 'أصوات');
  if(s === 'auto'){
    if(d.kind === 'adhan'){ if(d.plain) return 'نغمة النظام'; return M.cfg.adhanTone === false ? 'صامت' : sndName(M.adhanFor(d.id)); }
    if(d.pool) return 'تسجيلات متنوعة'; if(d.snd) return sndName(d.snd); return d.quiet ? 'بدون صوت' : 'نغمة النظام';
  }
  return sndName(s);
}

/* a reminder shown with each prayer's notification (Quran / sahih hadith, with the source) */
const PRAYER_DHIKR = {
  fajr:'«مَنْ صَلَّى الصُّبْحَ فَهُوَ فِي ذِمَّةِ اللَّهِ» — رواه مسلم',
  sunrise:'يبدأ وقت صلاة الضحى بعد ارتفاع الشمس قدر رمح (نحو ربع ساعة).',
  dhuhr:'﴿أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ﴾ [الإسراء: 78]',
  jumua:'﴿إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ وَذَرُوا الْبَيْعَ﴾ [الجمعة: 9]',
  asr:'﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾ [البقرة: 238]',
  maghrib:'﴿فَسُبْحَانَ اللَّهِ حِينَ تُمْسُونَ وَحِينَ تُصْبِحُونَ﴾ [الروم: 17]',
  isha:'«مَنْ صَلَّى الْعِشَاءَ فِي جَمَاعَةٍ فَكَأَنَّمَا قَامَ نِصْفَ اللَّيْلِ» — رواه مسلم'
};
M.PRAYER_DHIKR = PRAYER_DHIKR;
/* ---- build the schedule ---- */
/* the screen a reminder opens when tapped (see M.openDeep) */
const OPEN = {lastthird:'qiyam', midnight:'qiyam', duha:'duha', morning:'morning', evening:'evening', sleep:'sleep', dhikr:'tasbih', salawat:'tasbih', tijan:'tijan',
  kahf:'surah_18', ijaba:'duas', wird:'khatma', fast_mon:'fast_week', fast_thu:'fast_week', fast_white:'fast_white', fast_special:'calendar'};
M.buildReminders = function(days){
  if(M.cfg.nfMaster === false) return [];
  const out = [], now = Date.now(), city = M.location().name;
  for(let dd = 0; dd < (days || 5); dd++){
    const day = M.addDays(new Date(), dd); day.setHours(12, 0, 0, 0);
    const t = M.prayerTimes(day), nx = M.prayerTimes(M.addDays(day, 1)), k = M.dkey(day), dow = day.getDay();
    const tmr = M.addDays(day, 1), th = M.hijri(tmr), td = tmr.getDay();
    const clock = s=>{ const [a, b] = String(s).split(':').map(Number); const x = new Date(day); x.setHours(a || 0, b || 0, 0, 0); return x.getTime(); };
    const min = 60000;
    for(const d of NF){
      const c = get(d.id); if(!c.on) continue;
      let ts = null, title = d.t, body = '', key = '';
      const off = (c.off != null ? c.off : d.off || 0) * min;
      if(d.kind === 'adhan'){
        ts = t[d.id].getTime();
        title = d.id === 'sunrise' ? 'الشروق' : 'حان موعد '+(d.id === 'dhuhr' && dow === 5 ? 'صلاة الجمعة' : 'صلاة '+M.prayerLabel(d.id, day));
        body = M.fmt(t[d.id])+' • '+city;
        { const z = PRAYER_DHIKR[d.id === 'dhuhr' && dow === 5 ? 'jumua' : d.id]; if(z && M.cfg.nfDhikr !== false) body += '\n'+z; }
      } else if(d.pre){
        const p = d.pre; ts = t[p].getTime() - off; key = p === 'dhuhr' && dow === 5 ? 'jumua' : '';
        title = 'اقتربت '+(p === 'dhuhr' && dow === 5 ? 'صلاة الجمعة' : 'صلاة '+M.prayerLabel(p, day)); body = 'بعد '+M.cnt(c.off != null ? c.off : d.off, 'دقيقة', true)+' • '+M.fmt(t[p]);
      } else switch(d.id){
        case 'lastthird': ts = t.maghrib.getTime() + (nx.fajr.getTime() - t.maghrib.getTime()) * 2 / 3; title = 'الثلث الأخير من الليل'; body = 'وقت التنزّل الإلهي — قم للصلاة والدعاء'; break;
        case 'midnight': ts = t.maghrib.getTime() + (nx.fajr.getTime() - t.maghrib.getTime()) / 2; title = 'منتصف الليل'; body = 'لا تنسَ وردك ووترك'; break;
        case 'duha': ts = t.sunrise.getTime() + off; title = 'صلاة الضحى'; body = 'أقلّها ركعتان — صدقة عن كل مفاصلك'; break;
        case 'morning': ts = t.sunrise.getTime() + off; title = 'أذكار الصباح'; body = 'ابدأ يومك بذكر الله'; break;
        case 'evening': ts = t.asr.getTime() + off; title = 'أذكار المساء'; body = 'لا تنسَ أذكار المساء'; break;
        case 'sleep': ts = t.isha.getTime() + off; title = 'أذكار النوم'; body = 'اختم يومك بالأذكار وقراءة ما تيسّر'; break;
        case 'dhikr': case 'salawat': case 'tijan': {
          if(Array.isArray(c.days) && c.days.length && !c.days.includes(dow)) continue;
          const TJ = d.id === 'tijan' ? (M.TIJAN || []) : null;
          const dt = TJ ? 'تيجان الذكر' : d.id === 'dhikr' ? 'ذكر الله' : 'صلِّ على النبي ﷺ', db = d.id === 'dhikr' ? 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ' : 'اللهم صلِّ وسلِّم على نبينا محمد';
          const tm = x=>{ const [a, b] = String(x).split(':').map(Number); return (a || 0) * 60 + (b || 0); };
          let list = [];
          if(c.mode === 'every'){ const st = tm(c.from || c.clock || '08:00'); let en = tm(c.to || '22:00'); if(en <= st) en = 23 * 60 + 59; const step = Math.max(10, c.every || 60); for(let m = st; m <= en && list.length < 96; m += step) list.push(m); }
          else if(c.mode === 'times' && Array.isArray(c.times) && c.times.length) list = c.times.map(tm);
          else list = [tm(c.clock || d.clock)];
          const q = c.quiet && c.quiet.on ? [tm(c.quiet.from || '23:00'), tm(c.quiet.to || '06:00')] : null;
          const quiet = m=>!q || q[0] === q[1] ? false : q[0] < q[1] ? (m >= q[0] && m < q[1]) : (m >= q[0] || m < q[1]);   // the window may cross midnight
          list.forEach((m, i)=>{
            if(quiet(m % 1440)) return;
            const x = new Date(day); x.setHours(0, m, 0, 0); const t2 = x.getTime(); if(t2 <= now) return;
            const r2 = resolve(d, c, day, '', i);
            const tj = TJ && TJ.length ? TJ[(day.getDate() + i) % TJ.length] : null;   // a different crown each time
            out.push({id:d.id+'_'+k+'_'+i, ts:t2, title:c.title || (tj ? tj[0] : dt), body:c.body || (tj ? tj[1] : db), tone:r2.tone, snd:r2.snd, ch:'nf_'+d.id+(r2.tone ? '_t' : '_q'), chn:d.t, kind:d.id, open:OPEN[d.id] || ''});
          });
          continue;
        }
        case 'kahf': if(dow !== 5) continue; ts = t.sunrise.getTime() + off; title = 'يوم الجمعة'; body = 'سورة الكهف والإكثار من الصلاة على النبي ﷺ'; break;
        case 'ijaba': if(dow !== 5) continue; ts = t.asr.getTime() + off; title = 'ساعة الإجابة'; body = 'آخر ساعة من يوم الجمعة — أكثر من الدعاء'; break;
        case 'wird': ts = t.isha.getTime() - off; title = 'ورد القرآن'; body = 'ورد اليوم: '+M.cnt(M.cfg.wird || 4, 'صفحة', false, 'صفحات'); break;
        default: {
          const eve = t.maghrib.getTime() + off;
          const noFast = (th.m === 10 && th.d === 1) || (th.m === 12 && [10, 11, 12, 13].includes(th.d));
          if(noFast) continue;
          if(d.id === 'fast_mon' && td === 1){ ts = eve; title = 'غدًا الاثنين'; body = 'يُستحب صيامه — انوِ الصيام من الليل'; }
          else if(d.id === 'fast_thu' && td === 4){ ts = eve; title = 'غدًا الخميس'; body = 'يُستحب صيامه — انوِ الصيام من الليل'; }
          else if(d.id === 'fast_white' && [13, 14, 15].includes(th.d) && th.m !== 9){ ts = eve; title = 'من الأيام البيض غدًا'; body = 'يُستحب صيام ثلاثة أيام من كل شهر'; }
          else if(d.id === 'fast_special' && th.m === 12 && th.d === 9){ ts = eve; title = 'غدًا يوم عرفة'; body = 'صيامه يكفّر سنتين لغير الحاج — رواه مسلم'; }
          else if(d.id === 'fast_special' && th.m === 1 && th.d === 10){ ts = eve; title = 'غدًا يوم عاشوراء'; body = 'يُستحب صيامه مع التاسع أو الحادي عشر'; }
          else continue;
        }
      }
      if(ts == null || ts <= now) continue;
      const r = resolve(d, c, day, key);
      if(d.custom){ if(c.title) title = c.title; if(c.body) body = c.body; }
      const isPr = d.kind === 'adhan' && d.id !== 'sunrise';
      out.push({id:d.id+'_'+k, ts:Math.round(ts), title, body, tone:r.tone, snd:r.snd, ch:'nf_'+d.id+(r.tone ? '_t' : '_q'), chn:d.t, kind:d.id,
        open:d.kind === 'adhan' || d.pre ? 'prayer' : (OPEN[d.id] || ''), pk:isPr && M.cfg.plogNotif !== false ? k+'|'+d.id : ''});
    }
  }
  return out.sort((a, b)=>a.ts - b.ts);
};
M.on('settings', k=>{ if(['nf', 'nfMaster', 'nfDhikr', 'keyStop'].includes(k) || typeof k === 'object') M.syncNative(); });

/* ---- UI helpers ---- */
function pickerOptions(d){
  const opts = [['auto', d.kind === 'adhan' ? (d.plain ? 'تلقائي (نغمة النظام)' : 'تلقائي (الأذان الافتراضي)') : 'تلقائي (التسجيل المخصّص)']];
  if(d.kind === 'adhan'){ if(!d.plain) M.ADHANS.forEach(([i, n])=>opts.push([i, n])); }
  else{
    M.VOICES.forEach(([g, items])=>items.forEach(([i, n])=>{ if(g === 'اقتراب الصلاة' ? !!d.pre : !d.pre) opts.push([i, n]); }));
    if(!d.pre) M.ADHANS.slice(0, 3).forEach(([i, n])=>opts.push([i, 'أذان — '+n]));
  }
  if(d.multi || d.pool) opts.splice(1, 0, ['rotate', 'تدوير بين أصوات أختارها']);
  opts.push(['default', 'نغمة النظام'], ['silent', 'صامت']);
  return opts;
}
function testNotify(d, delay){
  delay = delay || 0;
  const items = M.buildReminders(2).filter(x=>x.kind === d.id);
  const c = get(d.id); const r = resolve(d, c, new Date(), '');
  const it = items[0] ? Object.assign({}, items[0]) : {title:d.t, body:'تجربة الإشعار', kind:d.id, ch:'nf_'+d.id+(r.tone ? '_t' : '_q'), chn:d.t};
  it.ts = Date.now() + (delay || 1500); it.id = 'test_'+d.id; it.snd = r.snd; it.tone = r.tone; it.delay = delay;
  if(window.Android && window.Android.testNotify){
    try{ window.Android.testNotify(JSON.stringify(it)); M.toast(delay ? 'سيصلك الإشعار بعد '+M.cnt(Math.round(delay / 1000), 'ثانية', true)+' — يمكنك قفل الشاشة الآن' : 'سيصلك الإشعار خلال لحظات', 4000); }catch(e){}
    return;
  }
  const fire = ()=>{ if(M.webShow){ M.webShow(it); return; } if(r.snd) M.playSound(r.snd); M.toast(it.title+' — '+it.body, 4500); };
  if(delay){ M.toast('سيظهر التنبيه بعد '+M.cnt(Math.round(delay / 1000), 'ثانية', true)); setTimeout(fire, delay); } else fire();
}
function askPerm(){ try{ window.Android && window.Android.requestNotifPerm && window.Android.requestNotifPerm(); if(window.Notification && Notification.permission === 'default') Notification.requestPermission(); }catch(e){} }
M.nfAskPerm = askPerm;
/* the OS permission is asked only when something goes from "all off" to "on" (never on start-up, never for a fresh install with nothing enabled) */
const anyOn = ()=>NF.some(d=>get(d.id).on) || !!M.cfg.liveNotif || Object.values(M.cfg.alarm || {}).some(Boolean) || Object.values(M.cfg.iqamaNotif || {}).some(Boolean);
let anyPrev = anyOn();
M.on('settings', k=>{ if(['nf', 'notifyIn', 'liveNotif', 'alarm', 'iqamaNotif'].includes(k) || typeof k === 'object'){ const a = anyOn(); if(a && !anyPrev) askPerm(); anyPrev = a; } });

/* time boxes: hour : minute and a ص/م toggle, drawn by the app so they follow the digits setting */
function timeBox(value, onChange, onRemove){
  let [H, Mi] = String(value || '08:00').split(':').map(Number); H = H || 0; Mi = Mi || 0;
  const h24 = !!M.cfg.h24, lat = v=>String(v).replace(/[٠-٩]/g, c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[^0-9]/g, '');
  const emit = ()=>onChange(M.pad(H)+':'+M.pad(Mi));
  const hv = ()=>M.n(h24 ? M.pad(H) : (H % 12 || 12)), mv = ()=>M.n(M.pad(Mi));
  const inp = (lbl, get)=>h('input.field.tb-n', {type:'text', inputMode:'numeric', maxLength:2, 'aria-label':lbl, value:get(), onfocus:e=>e.target.select()});
  const hi = inp('الساعة', hv), mi = inp('الدقيقة', mv);
  const ap = h24 ? null : h('button.tb-ap', {type:'button', 'aria-label':'صباحًا أو مساءً', onclick:()=>{ H = (H + 12) % 24; ap.textContent = H >= 12 ? 'م' : 'ص'; M.haptic && M.haptic(6); emit(); }}, H >= 12 ? 'م' : 'ص');
  hi.addEventListener('change', ()=>{ let v = parseInt(lat(hi.value), 10); if(isNaN(v)){ hi.value = hv(); return; }
    if(h24) H = Math.max(0, Math.min(23, v)); else { v = Math.max(1, Math.min(12, v)); H = (v % 12) + (H >= 12 ? 12 : 0); } hi.value = hv(); emit(); });
  mi.addEventListener('change', ()=>{ const v = parseInt(lat(mi.value), 10); if(!isNaN(v)) Mi = Math.max(0, Math.min(59, v)); mi.value = mv(); emit(); });
  return h('div.tb', h('div.tb-hm', hi, h('span.tb-c', ':'), mi), ap, onRemove ? h('button.icon-btn.tb-x', {type:'button', 'aria-label':'حذف الوقت', onclick:onRemove}, M.ic('close')) : null);
}

/* ---- per-notification settings sheet ---- */
function openItem(d, onChange){
  const body = h('div.col-flex.nf-sheet');
  const sh = M.sheet({title:d.t, content:body, onClose:()=>{ M.stopSound(); onChange && onChange(); }});
  sh.el.style.maxHeight = '92%';
  function draw(){
    const c = get(d.id); body.innerHTML = '';
    body.append(h('div.list.card', h('div.item.static', h('div.grow', h('div.t', 'تفعيل الإشعار')), M.switchEl(c.on, v=>{ M.nfSet(d.id, {on:v}); draw(); }))));
    if(d.off !== undefined){
      const v = c.off != null ? c.off : d.off;
      const step = n=>{ const x = Math.max(0, Math.min(d.offMax || 120, v + n)); M.nfSet(d.id, {off:x}); draw(); };
      body.append(h('div.card.pad', h('div.small.muted', d.offLbl), h('div.row-flex.nf-step', h('button.icon-btn.tonal', {onclick:()=>step(-5), 'aria-label':'أقل'}, M.ic('minus')), h('div.grow.center', h('b.num.nf-big', M.n(v)), h('span.small.muted', ' دقيقة')), h('button.icon-btn.tonal', {onclick:()=>step(5), 'aria-label':'أكثر'}, M.ic('plus')))));
    }
    if(d.clock && !d.multi){
      body.append(h('div.card.pad', h('div.small.muted', 'وقت الإشعار يوميًا'), h('input.field', {type:'time', value:c.clock || d.clock, onchange:e=>{ if(e.target.value) M.nfSet(d.id, {clock:e.target.value}); }})));
    }
    if(d.multi){
      // two ways to set it: chosen times (with an optional repeat), or a from–to window with the repeat in between
      const ui = c.ui || (c.mode === 'every' && c.to && c.to !== '23:59' ? 'b' : 'a');
      const T = c.from || (c.mode === 'times' && c.times && c.times[0]) || c.clock || d.clock, To = c.to && c.to !== '23:59' ? c.to : '22:00';
      const R = c.mode === 'every' ? (c.every || 30) : 0;
      const times = (c.mode === 'times' && Array.isArray(c.times) && c.times.length ? c.times : [T]).slice(0, 12);
      const tm = t=>{ const [x, y] = String(t).split(':').map(Number); return x * 60 + (y || 0); };
      const EV = [10, 15, 20, 30, 45, 60, 90, 120, 180, 240];
      const evLbl = n=>n === 0 ? 'بدون تكرار' : 'كل '+(n < 60 ? M.cnt(n, 'دقيقة', true) : n === 60 ? 'ساعة' : n === 90 ? 'ساعة ونصف' : n === 120 ? 'ساعتين' : M.n(n / 60)+' ساعات');
      const repSel = (list, val, fn)=>h('select.field.nf-rep', {'aria-label':'التكرار', onchange:e=>fn(+e.target.value)}, ...list.map(n=>h('option', {value:n, selected:n === val}, evLbl(n))));
      const days = Array.isArray(c.days) ? c.days : [], all = !days.length || days.length === 7;
      const sum = h('div.small.muted');
      const upd = ()=>{ const cc = get(d.id); let n = 1;
        if(cc.mode === 'every'){ const st = tm(cc.from || T); let en = tm(cc.to || '23:59'); if(en <= st) en = 23 * 60 + 59; n = Math.min(96, Math.floor((en - st) / Math.max(10, cc.every || 30)) + 1); }
        else if(cc.mode === 'times' && cc.times) n = cc.times.length;
        if(cc.quiet && cc.quiet.on){ try{ n = M.buildReminders(2).filter(x=>x.kind === d.id && new Date(x.ts).getDate() === M.addDays(new Date(), 1).getDate()).length || n; }catch(e){} }
        const dd = Array.isArray(cc.days) && cc.days.length && cc.days.length < 7 ? M.cnt(cc.days.length, 'يوم', false, 'أيام')+' في الأسبوع' : 'كل يوم';
        sum.textContent = 'يعمل '+dd+' — '+(n === 1 ? 'تذكير واحد في اليوم.' : M.n(n)+' تذكيرًا في اليوم'+(n > 40 ? ' (عدد كبير، وقد لا يُجدوَل كله على بعض الأجهزة).' : '.')); };
      const saveA = (ts, r)=>{ M.nfSet(d.id, r ? {ui:'a', mode:'every', from:ts[0], clock:ts[0], every:r, to:'23:59', times:ts} : {ui:'a', mode:'times', times:ts, clock:ts[0], from:ts[0]}); upd(); };
      const saveB = p=>{ const cc = get(d.id); M.nfSet(d.id, Object.assign({ui:'b', mode:'every', from:cc.from || T, clock:cc.from || T, to:cc.to && cc.to !== '23:59' ? cc.to : To, every:cc.every || 30}, p)); upd(); };
      const wrap = h('div.card.pad.col-flex.nf-when');
      wrap.append(h('div.nf-lbl', 'متى يصلك التذكير؟'), M.seg([['a', 'أوقات محددة'], ['b', 'فترة متكررة']], ui, v=>{ if(v === 'a') saveA(times, R); else saveB({}); draw(); }));
      if(ui === 'a'){
        wrap.append(h('div.small.muted', R ? 'يبدأ من هذا الوقت ويتكرر حتى نهاية اليوم.' : 'يصلك في كل وقت تضيفه هنا.'));
        (R ? times.slice(0, 1) : times).forEach((t, i)=>wrap.append(timeBox(t, v=>{ times[i] = v; saveA(times, R); }, !R && times.length > 1 ? ()=>{ times.splice(i, 1); saveA(times, R); draw(); } : null)));
        if(!R && times.length < 12) wrap.append(h('button.btn.tonal.sm.nf-add', {onclick:()=>{ const l = tm(times[times.length - 1]) + 60; times.push(M.pad(Math.floor(l / 60) % 24)+':'+M.pad(l % 60)); saveA(times, R); draw(); }}, M.ic('plus'), 'إضافة وقت'));
        wrap.append(h('div.nf-reprow', h('div.nf-lbl.grow', 'التكرار'), repSel([0].concat(EV), R, v=>{ saveA(times, v); draw(); })));
      } else {
        wrap.append(h('div.small.muted', 'يتكرر التذكير بين وقتين تحددهما.'),
          h('div.nf-ft', h('span.nf-ftl', 'من'), timeBox(T, v=>saveB({from:v, clock:v}))),
          h('div.nf-reprow', h('div.nf-lbl.grow', 'يتكرر'), repSel(EV, R || 30, v=>saveB({every:v}))),
          h('div.nf-ft', h('span.nf-ftl', 'إلى'), timeBox(To, v=>saveB({to:v}))));
      }
      const DN = [[6, 'س', 'السبت'], [0, 'ح', 'الأحد'], [1, 'ن', 'الاثنين'], [2, 'ث', 'الثلاثاء'], [3, 'ر', 'الأربعاء'], [4, 'خ', 'الخميس'], [5, 'ج', 'الجمعة']];
      wrap.append(h('div.nf-reprow', h('div.nf-lbl.grow', 'أيام الأسبوع'), h('button.chip.nf-all'+(all ? '.on' : ''), {onclick:()=>{ M.nfSet(d.id, {days:[]}); draw(); }}, 'كل الأيام')),
        h('div.nf-days', ...DN.map(([n, l, full])=>h('button'+((all || days.includes(n)) ? '.on' : ''), {'aria-label':full, 'aria-pressed':all || days.includes(n), onclick:()=>{
          const cur = all ? DN.map(x=>x[0]) : days.slice(); const x = cur.includes(n) ? cur.filter(q=>q !== n) : cur.concat(n);
          M.nfSet(d.id, {days:x.length === 7 || !x.length ? [] : x}); draw(); }}, l))));
      /* quiet hours: no reminder of this kind inside the window (sleep, work…), even when the repeat falls there */
      const Q = c.quiet || {}, qOn = !!Q.on;
      const saveQ = p=>{ M.nfSet(d.id, {quiet:Object.assign({on:qOn, from:Q.from || '23:00', to:Q.to || '06:00'}, p)}); upd(); };
      wrap.append(h('div.nf-quiet'+(qOn ? '.on' : ''),
        h('div.nf-reprow', h('div.grow', h('div.nf-lbl', 'وقت الهدوء (النوم)'), h('div.small.muted', qOn ? 'لا يصلك هذا التذكير بين الوقتين' : 'حدّد وقتًا لا يصلك فيه التذكير')),
          M.switchEl(qOn, v=>{ saveQ({on:v}); draw(); })),
        qOn ? h('div.nf-ft', h('span.nf-ftl', 'من'), timeBox(Q.from || '23:00', v=>saveQ({from:v, on:true}))) : null,
        qOn ? h('div.nf-ft', h('span.nf-ftl', 'إلى'), timeBox(Q.to || '06:00', v=>saveQ({to:v, on:true}))) : null), sum);
      upd();
      body.append(wrap);
    }
    if(d.custom){
      body.append(h('div.card.pad.col-flex', h('div.small.muted', 'نص الإشعار (اتركه فارغًا للنص الافتراضي)'),
        h('input.field', {placeholder:'العنوان', value:c.title || '', maxLength:60, onchange:e=>M.nfSet(d.id, {title:e.target.value.trim()})}),
        h('textarea.field', {placeholder:'النص', rows:2, maxLength:160, onchange:e=>M.nfSet(d.id, {body:e.target.value.trim()})}, c.body || '')));
    }
    body.append(h('div.section-h', 'صوت الإشعار'));
    if(M.libPick && d.kind === 'adhan' && !d.plain) body.append(h('button.btn.tonal.block', {style:'margin-bottom:10px', onclick:()=>{ sh.close(); M.libPick({type:'prayer', p:d.id}, ()=>{ onChange && onChange(); }); }}, M.ic('play'), 'اختر أذانًا من المكتبة الصوتية'));
    else if(M.openSounds && (d.snd || d.pool)) body.append(h('button.btn.ghost.block', {style:'margin-bottom:10px', onclick:()=>{ sh.close(); M.openSounds({tab:'voice', onDone:()=>{ onChange && onChange(); }}); }}, M.ic('play'), 'استمع للتسجيلات في المكتبة الصوتية'));
    const list = h('div.list.card');
    const cur = c.snd || 'auto';
    pickerOptions(d).forEach(([id, n])=>{
      const play = (id !== 'auto' && id !== 'default' && id !== 'silent') ? h('button.icon-btn.tonal', {'aria-label':'استماع', onclick:e=>{ e.stopPropagation(); M.playSound(id); }}, M.ic('play')) : null;
      list.append(h('button.item.nf-opt'+(cur === id ? '.on' : ''), {onclick:()=>{ M.stopSound(); M.nfSet(d.id, {snd:id}); draw(); }}, h('span.nf-radio'), h('div.grow.t', n), play));
    });
    body.append(list);
    if(cur === 'rotate'){
      const set = (c.set && c.set.length) ? c.set.slice() : (d.pool || []).slice();
      const all = []; M.VOICES.forEach(([, items])=>items.forEach(([i, n])=>{ if(!/^pre_/.test(i)) all.push([i, n]); }));
      body.append(h('div.section-h', 'الأصوات المشمولة في التدوير'), h('div.chips', ...all.map(([i, n])=>h('button.chip'+(set.includes(i) ? '.on' : ''), {onclick:()=>{ const x = set.includes(i) ? set.filter(q=>q !== i) : set.concat(i); M.nfSet(d.id, {set:x}); draw(); }}, n))));
    }
    body.append(h('div.nf-test', h('div.small.muted', 'تجربة الإشعار'),
      h('div.row-flex.gap-s', h('button.btn.tonal.grow', {onclick:()=>testNotify(d)}, M.ic('bell'), 'الآن'),
        h('button.btn.tonal.grow', {onclick:()=>testNotify(d, 5000)}, M.ic('clock'), 'بعد '+M.cnt(5, 'ثانية', true)))));
    if(d.pre) body.append(h('div.tiny.muted', {style:'margin-top:8px;line-height:1.8'}, 'يوم الجمعة يُستخدم تسجيل «اقتربت صلاة الجمعة» تلقائيًا مع الظهر.'));
  }
  draw();
}

/* ---- main screen ---- */
M.openNotifs = function(){
  M.openView({title:'الإشعارات والأصوات', id:'notifs', build:(b, view)=>{
    const root = h('div.nfx'); b.append(root);
    const fold = new Set(M.store.get('nfFold2', ['night', 'worship']));
    const saveFold = ()=>M.store.set('nfFold2', [...fold]);
    const P5 = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    /* one row per notification: tap opens its full settings sheet (sound, times, offset, test); the switch turns it on/off in place */
    const clockLbl = v=>{ let [H, Mi] = String(v || '').split(':').map(Number); H = H || 0; Mi = Mi || 0; return M.cfg.h24 ? M.n(M.pad(H)+':'+M.pad(Mi)) : M.n((H % 12 || 12)+':'+M.pad(Mi))+' '+(H >= 12 ? 'م' : 'ص'); };
    function rowOf(d){
      const c = get(d.id);
      const bits = [];
      if(c.on){
        bits.push(soundLabel(d));
        if(d.off !== undefined) bits.push((d.offLbl || '').replace(/ بـ$/, '')+' '+M.n(c.off != null ? c.off : d.off)+' د');
        if(d.clock) bits.push(c.mode === 'every' ? 'كل '+(c.every >= 60 && c.every % 60 === 0 ? (c.every === 60 ? 'ساعة' : M.n(c.every / 60)+' ساعات') : M.n(c.every || 60)+' د') : c.mode === 'times' && (c.times || []).length > 1 ? M.n(c.times.length)+' أوقات' : clockLbl(c.clock || d.clock));
      }
      const sw = M.switchEl(c.on, v=>{ M.nfSet(d.id, {on:v}); draw(); });
      sw.addEventListener('click', e=>e.stopPropagation());
      return h('div.nf-tile.nfr'+(c.on ? '.on' : ''), {role:'button', tabindex:0, onclick:()=>openItem(d, draw), onkeydown:e=>{ if(e.key === 'Enter') openItem(d, draw); }},
        h('span.nf-ic', {html:M.icon(d.ic)}), h('div.nfr-tx', h('div.nf-t', d.t), h('div.nf-s', c.on ? bits.filter(Boolean).join(' • ') : 'متوقف')), sw);
    }
    function draw(){
      const sy = view && view.body ? view.body.scrollTop : 0;
      root.innerHTML = '';
      const master = M.cfg.nfMaster !== false;
      const onCount = NF.filter(d=>get(d.id).on).length + (M.cfg.liveNotif ? 1 : 0);
      let nx = null; try{ nx = M.buildReminders(2).find(x=>x.ts > Date.now() && x.title); }catch(e){}
      /* status: master switch, how many are on, the very next one */
      const msw = M.switchEl(master, v=>{ M.save('nfMaster', v); if(v) askPerm(); draw(); });
      root.append(h('div.card.nfx-hero'+(master && onCount ? '.on' : ''),
        h('div.nfx-hr', h('span.nfx-bell', {html:M.icon(master && onCount ? 's:bell' : 'bell')}),
          h('div.grow', h('b.title-font', !master ? 'الإشعارات متوقفة' : onCount ? M.cnt(onCount, 'تنبيه', true, 'تنبيهات')+' مفعّلة' : 'لا شيء مفعّل بعد'),
            h('small', M.platform !== 'web' || (M.webNotifState && M.webNotifState().push) ? 'تعمل في الخلفية والتطبيق مغلق' : 'تعمل والتطبيق مفتوح — فعّل «إشعارات والتطبيق مغلق» بالأسفل')), msw),
        master && nx ? h('button.nfx-next', {onclick:()=>M.openUpcoming()}, h('span.nfx-nl', 'التالي'), h('span.grow', nx.title), h('b.num', M.n(M.fmt(new Date(nx.ts)))), M.ic('fwd')) : null,
        master && !onCount ? h('div.small.muted.nfx-tip', 'ابدأ بالأذان أو اقتراب الصلاة من الأسفل، ثم اختر الصوت والوقت لكل تنبيه.') : null));
      /* groups: a card each, folded or open, with a count and a switch for the whole group */
      GROUPS.forEach(([g, title, sub])=>{
        const items = NF.filter(d=>d.g === g); if(!items.length) return;
        const n = items.filter(d=>get(d.id).on).length, open = !fold.has(g);
        const gsw = M.switchEl(n === items.length, v=>{ items.forEach(d=>{ if(!d.plain || !v) M.nfSet(d.id, {on:v}); }); draw(); });
        gsw.addEventListener('click', e=>e.stopPropagation());
        gsw.setAttribute('aria-label', (n === items.length ? 'إيقاف ' : 'تفعيل ')+'كل '+title);
        const head = h('button.nfx-gh', {'aria-expanded':String(open), onclick:()=>{ open ? fold.add(g) : fold.delete(g); saveFold(); draw(); }},
          h('div.grow', h('b', title), h('small', n ? M.n(n)+' من '+M.n(items.length)+' مفعّلة' : (sub || 'كلها متوقفة'))), gsw, h('span.nfx-chev', M.ic('fwd')));
        const card = h('section.card.nfx-g'+(open ? '.open' : ''), head);
        const list = h('div.nfx-list');
        if(g === 'prayer'){
          const adn = sndName(M.adhanFor('dhuhr'));
          list.append(h('button.item.nfx-adhan', {onclick:()=>{ M.libPick ? M.libPick({type:'default'}, ()=>draw()) : pickAdhan(()=>draw()); }}, h('span.nf-ic', {html:M.icon('mosque')}), h('div.grow', h('div.nf-t', 'الأذان الافتراضي'), h('div.nf-s', adn)), M.ic('fwd')));
        }
        if(g === 'pre'){
          const pre = P5.filter(k=>get('pre_'+k).on);
          if(pre.length){ const o = get('pre_'+pre[0]).off != null ? get('pre_'+pre[0]).off : 10;
            list.append(h('div.nfx-all', h('div.small.muted', 'قبل كل صلاة بـ (دقيقة)'), M.seg([['5', M.n(5)], ['10', M.n(10)], ['15', M.n(15)], ['20', M.n(20)], ['30', M.n(30)]], String(o), v=>{ P5.forEach(k=>M.nfSet('pre_'+k, {off:+v})); draw(); }))); }
        }
        items.forEach(d=>list.append(rowOf(d)));
        if(open) card.append(list); else card.append(h('div.nfx-peek', ...items.slice(0, 6).map(d=>h('span'+(get(d.id).on ? '.on' : ''), {html:M.icon(d.ic)}))), Object.assign(list, {hidden:true}));
        root.append(card);
      });
      /* sound behaviour */
      root.append(h('div.section-h', 'الصوت'));
      root.append(h('div.list.card',
        h('div.item.static', h('div.grow', h('div.t', 'تسجيلات صوتية للأذكار والتذكيرات'), h('div.s', 'بدل نغمة النظام')), M.switchEl(M.cfg.voice !== false, v=>M.save('voice', v))),
        h('div.item.static', h('div.grow', h('div.t', 'صوت الأذان مع إشعار الصلاة'), h('div.s', 'أوقفه ليصلك إشعار بلا أذان')), M.switchEl(M.cfg.adhanTone !== false, v=>{ M.save('adhanTone', v); draw(); })),
        h('div.item.static', h('div.grow', h('div.t', 'ذكر مع إشعار كل صلاة'), h('div.s', 'آية أو حديث خاص بكل صلاة داخل الإشعار')), M.switchEl(M.cfg.nfDhikr !== false, v=>M.save('nfDhikr', v))),
        M.can('keyStop') ? h('div.item.static', h('div.grow', h('div.t', 'إيقاف الأذان بزر الصوت'), h('div.s', 'يتوقف عند الضغط على زر رفع أو خفض الصوت')), M.switchEl(M.cfg.keyStop !== false, v=>M.save('keyStop', v))) : null));
      if(M.platform === 'web' && M.webPushCard){ root.append(h('div.section-h', 'نسخة الويب')); root.append(M.webPushCard(draw)); }
      if(M.platform === 'ios') root.append(h('div.tiny.muted', {style:'margin:8px 4px 0;line-height:1.8'}, 'على آيفون: صوت الأذان في الإشعار ٣٠ ثانية كحدّ أقصى، ويُجدول أقرب ٦٠ تنبيهًا تقريبًا ثم يتجدد عند فتح التطبيق.'));
      root.append(h('div.section-h', 'المزيد'));
      root.append(h('div.list.card',
        h('button.item', {onclick:()=>M.openUpcoming()}, h('span.lead', {html:M.icon('calendar')}), h('div.grow', h('div.t', 'الإشعارات القادمة'), h('div.s', 'ما سيصلك خلال الأيام القادمة')), M.ic('fwd')),
        h('button.item', {onclick:()=>M.openSounds({onDone:()=>draw()})}, h('span.lead', {html:M.icon('play')}), h('div.grow', h('div.t', 'المكتبة الصوتية'), h('div.s', 'الأذان والتكبير والتذكيرات، وصوت كل صلاة')), M.ic('fwd')),
        /* turning everything off keeps each one's sound, times and offsets for when it is turned on again */
        h('button.item', {onclick:async()=>{ if(await M.confirm('تبقى أصواتك وأوقاتك محفوظة، ويمكنك تفعيلها من جديد في أي وقت.', 'إيقاف', 'إيقاف كل الإشعارات؟')){ const nf = Object.assign({}, M.cfg.nf); NF.forEach(d=>{ nf[d.id] = Object.assign({}, nf[d.id], {on:false}); }); const n = {}; PRAYER_IDS.forEach(p=>n[p] = false); M.save({nf, notifyIn:n}); draw(); M.toast('تم إيقاف كل الإشعارات'); } }}, h('span.lead', {html:M.icon('trash')}), h('div.grow', h('div.t', {style:'color:var(--err,#c0392b)'}, 'إيقاف كل الإشعارات')), M.ic('fwd'))));
      if(view && view.body) view.body.scrollTop = sy;
    }
    draw();
  }});
};
function pickAdhan(done){
  const list = h('div.list');
  const sh = M.sheet({title:'الأذان الافتراضي', content:list, onClose:()=>{ M.stopSound(); done && done(); }});
  sh.el.style.maxHeight = '88%';
  const draw = ()=>{
    list.innerHTML = '';
    M.ADHANS.forEach(([id, n])=>list.append(h('button.item.nf-opt'+((M.cfg.adhan || 'ad_makkah') === id ? '.on' : ''), {onclick:()=>{ M.save('adhan', id); draw(); }}, h('span.nf-radio'), h('div.grow.t', n), h('button.icon-btn.tonal', {'aria-label':'استماع', onclick:e=>{ e.stopPropagation(); M.playSound(id); }}, M.ic('play')))));
    if(M.openAdhanDl) list.append(h('button.btn.tonal.block', {style:'margin-top:10px', onclick:()=>M.openAdhanDl(draw)}, M.ic('download'), 'تنزيل أصوات أذان أخرى'));
  };
  draw();
}
M.openUpcoming = function(){
  M.openView({title:'الإشعارات القادمة', id:'upcoming', build:b=>{
    const items = M.buildReminders(3).slice(0, 60);
    if(!items.length){ b.append(h('div.empty', 'لا توجد إشعارات مجدولة. فعّل بعضها من الشاشة السابقة.')); return; }
    const l = h('div.list.card'); let lastDay = '';
    items.forEach(it=>{
      const d = new Date(it.ts), dk = M.WEEKDAYS[d.getDay()]+' '+M.n(d.getDate())+' '+M.GMONTHS[d.getMonth()];
      if(dk !== lastDay){ lastDay = dk; l.append(h('div.hz-h.title-font', dk)); }
      l.append(h('div.item.static', h('div.grow', h('div.t', it.title), h('div.s', (it.snd ? 'صوت: '+sndName(it.snd) : it.tone ? 'نغمة النظام' : 'صامت'))), h('div.pt-time.num', M.fmt(d))));
    });
    b.append(l);
  }});
};
M.openReminders = M.openNotifs;
M.nfSoundName = sndName;
})();

/* ---- alarm + focus items (native: loop / ringer action) ---- */
(function(){
  const base = M.buildReminders;
  M.buildReminders = function(days){
    const out = base(days);
    try{
      const now = Date.now(), PRL = {fajr:'الفجر', dhuhr:'الظهر', asr:'العصر', maghrib:'المغرب', isha:'العشاء'};
      const al = M.cfg.alarm || {}, f = M.cfg.focus || {};
      for(let dd = 0; dd < (days || 5); dd++){
        const day = M.addDays(new Date(), dd); day.setHours(12, 0, 0, 0);
        const t = M.prayerTimes(day), k = M.dkey(day);
        for(const p in PRL){
          const pt = t[p].getTime();
          if(al[p]){ const ts = pt - (M.cfg.alarmPre || 0) * 60000;
            if(ts > now) out.push({id:'alarm_'+p+'_'+k, ts, title:'منبّه '+PRL[p], body:(M.cfg.alarmPre ? 'بعد '+M.cnt(M.cfg.alarmPre, 'دقيقة', true) : 'حان الوقت'), tone:true, snd:(M.cfg.alarmSnd || 'ad_makkah'), loop:90, ch:'nf_alarm_t', chn:'منبّه الصلاة', kind:'alarm', open:'prayer'}); }
          const iqn = (M.cfg.iqamaNotif || {})[p], iqm = (M.cfg.iqama || {})[p];
          if(iqn && iqm){ const ts = pt + iqm*60000; if(ts > now) out.push({id:'iqama_'+p+'_'+k, ts, title:'إقامة صلاة '+PRL[p], body:'حان وقت الإقامة', tone:true, snd:null, ch:'nf_iqama_t', chn:'الإقامة', kind:'iqama', open:'prayer', pk:M.cfg.plogNotif !== false ? k+'|'+p : ''}); }
          if(f.on && (f.pr || {})[p] !== false){
            const mins = f.mins || 20;
            if(pt > now) out.push({id:'focus_on_'+p+'_'+k, ts:pt, title:'', body:'', tone:false, act:'vib', ch:'nf_focus_q', chn:'وضع الهدوء', kind:'focus'});
            if(pt + mins * 60000 > now) out.push({id:'focus_off_'+p+'_'+k, ts:pt + mins * 60000, title:'', body:'', tone:false, act:'restore', ch:'nf_focus_q', chn:'وضع الهدوء', kind:'focus'});
          }
        }
      }
    }catch(e){}
    return out.sort((a, b)=>a.ts - b.ts);
  };
  M.on('settings', k=>{ if(['alarm', 'alarmPre', 'focus', 'liveNotif'].includes(k)){ M.syncNative(); try{ if(window.Android && Android.setLive) Android.setLive(!!M.cfg.liveNotif); }catch(e){} } });
  setTimeout(()=>{ try{ if(window.Android && Android.setLive) Android.setLive(!!M.cfg.liveNotif); }catch(e){} }, 3000);
})();
