/* ===== Settings: extra sub-pages (grouped like a modern iOS/Android settings sheet) ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const row = (title, sub, control)=>h('div.item.static'+(control && control.classList && control.classList.contains('seg') ? '.stack' : ''), h('div.grow', h('div.t', title), sub ? h('div.s', sub) : null), control);
const sec = t=>h('div.section-h', t);
const sw = (key, def)=>M.switchEl(M.cfg[key] === undefined ? !!def : !!M.cfg[key], v=>M.save(key, v));
const note = t=>h('div.tiny.muted', {style:'margin:6px 4px 12px;line-height:1.9'}, t);
const rg = (min, max, step, val, fn)=>h('input', {type:'range', min, max, step, value:val, oninput:e=>fn(+e.target.value)});
const PR = [['fajr', 'الفجر', 'p:fajr'], ['dhuhr', 'الظهر', 'p:dhuhr'], ['asr', 'العصر', 'p:asr'], ['maghrib', 'المغرب', 'p:maghrib'], ['isha', 'العشاء', 'p:isha']];
const S = M.SETSUB = M.SETSUB || {};

/* ---- date ---- */
S.date = {title:'ضبط التاريخ', build(b){
  b.append(h('div.list.card',
    row('إظهار التاريخ', 'في الواجهة الرئيسية', sw('showDate', true)),
    row('بداية الأسبوع', 'يُطبَّق على التقويم', M.seg([['6', 'السبت'], ['0', 'الأحد'], ['1', 'الاثنين']], String(M.cfg.weekStart == null ? 6 : M.cfg.weekStart), v=>M.save('weekStart', +v)))));
  b.append(h('div.list.card', {style:'margin-top:12px'}, M.item({icon:'t:calendar-month', title:'ضبط التاريخ الهجري', sub:'البلد، تقديم أو تأخير يوم، نوع الحساب — من التقويم', onClick:()=>M.openCalendar(), trail:M.ic('fwd')})));
  b.append(sec('شكل التاريخ'));
  b.append(M.seg([['both', 'هجري وميلادي'], ['hijri', 'هجري أولًا'], ['greg', 'ميلادي أولًا']], M.cfg.dateFmt || 'both', x=>M.save('dateFmt', x)));
  b.append(note('يظهر الشكل المختار في الواجهة الرئيسية والودجت.'));
}};

/* ---- alarm ---- */
S.alarm = {title:'منبّه الصلاة', build(b){
  const android = M.platform === 'android';
  b.append(note(android
    ? 'المنبّه يختلف عن إشعار الأذان: يرنّ ويستمر حتى توقفه أو تنتهي مدته، حتى لو كان الجهاز صامتًا، ويظهر على شاشة القفل كمنبّه الساعة. مناسب للفجر خاصة.'
    : 'المنبّه يرنّ كمنبّه الساعة في الآيفون (iOS 26 وما بعده) حتى توقفه، حتى في الوضع الصامت وأوضاع التركيز.'));
  const vv = h('b.num', M.n(M.cfg.alarmPre || 0));
  const l = h('div.list.card');
  PR.forEach(([k, n, ic])=>l.append(h('div.item.static', h('span.lead', {html:M.icon(ic)}), h('div.grow', h('div.t', 'منبّه '+n), h('div.s', 'يرنّ وقت الصلاة')), M.switchEl(!!(M.cfg.alarm || {})[k], v=>{ const a = Object.assign({}, M.cfg.alarm); a[k] = v; M.save('alarm', a); if(v && window.Android && Android.requestNotifPerm) Android.requestNotifPerm(); }))));
  b.append(l);
  b.append(h('div.list.card', {style:'margin-top:12px'}, row('المدة قبل الصلاة', 'يرنّ قبل الوقت بعدد الدقائق', h('div.row-flex.gap-s', h('button.icon-btn.tonal', {onclick:()=>{ M.save('alarmPre', Math.max(0, (M.cfg.alarmPre || 0) - 5)); vv.textContent = M.n(M.cfg.alarmPre || 0); }}, M.ic('minus')), vv, h('button.icon-btn.tonal', {onclick:()=>{ M.save('alarmPre', Math.min(60, (M.cfg.alarmPre || 0) + 5)); vv.textContent = M.n(M.cfg.alarmPre || 0); }}, M.ic('plus'))))));

  /* the sound: chosen in the sound library (adhans, takbeer, downloaded adhans), previewed here */
  b.append(sec('الصوت'));
  const sndName = ()=>(M.nfSoundName ? M.nfSoundName(M.cfg.alarmSnd || 'ad_makkah') : (M.cfg.alarmSnd || 'ad_makkah'));
  const sndSub = h('div.s', sndName());
  const sndCard = h('div.list.card',
    h('button.item', {onclick:()=>M.openSounds && M.openSounds({target:{type:'alarm'}, onDone:()=>{ sndSub.textContent = sndName(); }})},
      h('span.lead', {html:M.icon('volume')}), h('div.grow', h('div.t', 'صوت المنبّه'), sndSub), M.ic('fwd')),
    h('button.item', {onclick:()=>M.playSound && M.playSound(M.cfg.alarmSnd || 'ad_makkah')},
      h('span.lead', {html:M.icon('play')}), h('div.grow', h('div.t', 'استماع للصوت'), h('div.s', 'اضغط مرة أخرى للإيقاف'))));
  b.append(sndCard);

  if(android){
    /* how it rings: volume, a gradual start, vibration, how long, snooze */
    b.append(sec('طريقة الرنين'));
    const volV = h('b.num', M.n(M.cfg.alarmVol || 100)+'٪');
    const c = h('div.list.card');
    c.append(h('div.item.static.stack', h('div.row-flex', h('div.grow', h('div.t', 'مستوى الصوت'), h('div.s', 'نسبة من صوت المنبّهات في الهاتف')), volV),
      Object.assign(rg(10, 100, 10, M.cfg.alarmVol || 100, v=>{ M.save('alarmVol', v); volV.textContent = M.n(v)+'٪'; }), {style:'width:100%;margin-top:10px'})));
    c.append(row('يبدأ بهدوء ثم يرتفع', 'يزداد الصوت تدريجيًا خلال ٣٠ ثانية', sw('alarmRamp', false)));
    c.append(row('الاهتزاز', '', M.seg([['off', 'بدون'], ['normal', 'عادي'], ['pulse', 'نبضات'], ['strong', 'قوي']], M.cfg.alarmVib || 'normal', x=>M.save('alarmVib', x))));
    c.append(row('مدة الرنين', 'يتوقف وحده بعدها إن لم توقفه', M.seg([[60, 'دقيقة'], [90, '١٫٥ د'], [180, '٣ د'], [300, '٥ د'], [600, '١٠ د']], M.cfg.alarmDur || 90, x=>M.save('alarmDur', +x))));
    c.append(row('الغفوة', 'زر «غفوة» في إشعار المنبّه يعيده بعد', M.seg([[0, 'بدون'], [5, '٥ د'], [10, '١٠ د'], [15, '١٥ د']], M.cfg.alarmSnooze || 0, x=>M.save('alarmSnooze', +x))));
    b.append(c);

    /* the real thing in a few seconds: lock the phone and listen */
    const test = delay=>{
      const it = {title:'تجربة المنبّه', body:'هكذا سيرنّ منبّه الصلاة', tone:true, snd:M.cfg.alarmSnd || 'ad_makkah', loop:Math.min(M.cfg.alarmDur || 90, 60),
        vol:M.cfg.alarmVol || 100, ramp:!!M.cfg.alarmRamp, vib:M.cfg.alarmVib || 'normal', snooze:M.cfg.alarmSnooze || 0, ch:'nf_alarm_t', chn:'منبّه الصلاة', kind:'alarm', delay};
      try{ window.Android.testNotify(JSON.stringify(it)); M.toast(delay ? 'سيرنّ المنبّه بعد ١٠ ثوانٍ — اقفل الشاشة لتجربته' : 'يرنّ الآن — أوقفه من الإشعار'); }catch(e){ M.toast('تعذّرت التجربة'); }
    };
    if(window.Android && Android.testNotify) b.append(h('div.row-flex.gap-s', {style:'margin-top:12px'},
      h('button.btn.tonal.grow', {onclick:()=>test(0)}, M.ic('bell'), 'تجربة الآن'),
      h('button.btn.tonal.grow', {onclick:()=>test(10000)}, M.ic('clock'), 'بعد ١٠ ثوانٍ')));
  }
  b.append(h('button.btn.tonal.block', {style:'margin-top:12px', onclick:()=>M.openUpcoming && M.openUpcoming()}, M.ic('bell'), 'الإشعارات والمنبّهات القادمة'));
}};

/* ---- focus ---- */
S.focus = {title:'وضع الهدوء وقت الصلاة', build(b){
  b.append(note('عند دخول وقت الصلاة يحوّل التطبيق هاتفك إلى وضع الاهتزاز تلقائيًا ثم يُعيده بعد المدة المحددة. يعمل على أندرويد، ولا يمنع التطبيقات الأخرى من العمل.'));
  const f = M.cfg.focus || {};
  b.append(h('div.list.card', row('تفعيل', '', M.switchEl(!!f.on, v=>M.save('focus', Object.assign({}, M.cfg.focus, {on:v}))))));
  b.append(sec('الصلوات'));
  const l = h('div.list.card');
  PR.forEach(([k, n])=>l.append(row(n, '', M.switchEl((f.pr || {})[k] !== false, v=>{ const x = Object.assign({}, M.cfg.focus); x.pr = Object.assign({}, x.pr, {[k]:v}); M.save('focus', x); }))));
  b.append(l);
  const mv = h('b.num', M.n(f.mins || 20));
  b.append(h('div.list.card', {style:'margin-top:12px'}, row('مدة الهدوء بعد الأذان', 'من ٥ إلى ٦٠ دقيقة', h('div.row-flex.gap-s', h('button.icon-btn.tonal', {onclick:()=>{ const x = Object.assign({}, M.cfg.focus); x.mins = Math.max(5, (x.mins || 20) - 5); M.save('focus', x); mv.textContent = M.n(x.mins); }}, M.ic('minus')), mv, h('button.icon-btn.tonal', {onclick:()=>{ const x = Object.assign({}, M.cfg.focus); x.mins = Math.min(60, (x.mins || 20) + 5); M.save('focus', x); mv.textContent = M.n(x.mins); }}, M.ic('plus'))))));
}};

/* ---- live (ongoing notification) ---- */
S.live = {title:'الصلاة القادمة في الإشعارات', build(b){
  b.append(note('نشاط حي في شريط الإشعارات وشاشة القفل: الصلاة القادمة مع عدّاد تنازلي وشريط تقدّم، ويتحدّث وحده عند كل صلاة. على أندرويد ١٦ يُطلب عرضه كـ«تحديث حي» (Live Update)، وعلى سامسونج One UI يُطلب عرضه في Now Bar.'));
  b.append(h('div.list.card',
    row('الإشعار الدائم', 'يبقى ظاهرًا ويتحدّث تلقائيًا', M.switchEl(!!M.cfg.liveNotif, v=>{ M.save('liveNotif', v); if(v && window.Android && Android.requestNotifPerm) Android.requestNotifPerm(); })),
    row('إظهار الإقامة', 'بجانب وقت الصلاة', sw('liveIqama', true))));
  b.append(h('div.card.pad.live-prev', h('div.small.muted', 'معاينة'), h('div.row-flex', h('div.grow', h('div.bold', 'العصر بعد 0:20'), h('div.small.muted', 'عند 4:06 م • الإقامة 4:21 م')), h('span.lead', {html:M.icon('mosque')}))));
  if(window.Android && Android.liveStatus){
    let st = {}; try{ st = JSON.parse(Android.liveStatus()) || {}; }catch(e){}
    const msg = st.promoted === true ? 'التحديثات الحية مسموحة للتطبيق، وستظهر الصلاة القادمة في شريط الحالة وشاشة القفل' + (st.samsung ? ' وفي Now Bar' : '') + '.'
      : st.promoted === false ? 'التحديثات الحية غير مسموحة للتطبيق حاليًا. اضغط الزر أدناه وفعّلها من إعدادات إشعارات التطبيق.'
      : (st.sdk && st.sdk < 36) ? 'هاتفك يعمل بأندرويد أقدم من ١٦، فيظهر إشعار دائم عادي بعدّاد تنازلي. ' + (st.samsung ? 'قد يعرضه Now Bar في هواتف سامسونج الأحدث إن كان التطبيق ضمن قائمة المسموح لها، ولا أستطيع ضمان ذلك.' : '')
      : 'تعذّر معرفة حالة التحديثات الحية على هذا الهاتف.';
    b.append(h('div.card.pad', {style:'margin-top:12px'}, h('div.bold', st.samsung ? 'سامسونج Now Bar والتحديثات الحية' : 'التحديثات الحية (أندرويد ١٦)'),
      h('div.small.muted', {style:'margin:4px 0 10px;line-height:1.9'}, msg),
      h('button.btn.tonal.sm', {onclick:()=>Android.openLiveSettings && Android.openLiveSettings()}, 'فتح إعدادات التحديثات الحية'),
      st.samsung ? h('div.tiny.muted', {style:'margin-top:8px;line-height:1.9'}, 'في هواتف سامسونج: الإعدادات ← الإشعارات ← الإشعارات الحية (Now Bar)، ثم فعّل التطبيق إن ظهر في القائمة.') : null));
  }
  if(window.Android && Android.openBatterySettings) b.append(h('div.card.pad', {style:'margin-top:12px'}, h('div.bold', 'لضمان وصول الأذان والتحديثات في وقتها'), h('div.small.muted', {style:'margin:4px 0 10px'}, 'بعض الهواتف (سامسونج، شاومي، أوبو، ريلمي، فيفو، هواوي، ون بلس) توقف التطبيقات في الخلفية. اسمح للتطبيق بالعمل دون قيود وبالتشغيل التلقائي.'),
    h('div.row-flex.gap-s', {style:'flex-wrap:wrap'}, h('button.btn.sm', {onclick:()=>Android.openBatterySettings('battery')}, 'استثناء من توفير البطارية'), h('button.btn.tonal.sm', {onclick:()=>Android.openBatterySettings('autostart')}, 'التشغيل التلقائي'), h('button.btn.tonal.sm', {onclick:()=>Android.openBatterySettings('notif')}, 'إعدادات الإشعارات'))));
  if(!window.Android) b.append(note('هذه الميزة متاحة في تطبيق الأندرويد فقط.'));
}};

/* ---- audio ---- */
S.audio = {title:'الملفات الصوتية', build(b){
  b.append(sec('المشغّل'));
  b.append(h('div.list.card', M.item({icon:'t:apps', title:'دائرة التشغيل والمشغّل', sub:'التصغير التلقائي، الحافة، الشفافية', onClick:()=>M.openNavbarCfg && M.openNavbarCfg('np'), trail:M.ic('fwd')})));
  b.append(sec('الوضع الصامت'));
  b.append(h('div.list.card', row('كتم الملفات الصوتية', 'لا تُشغَّل تسجيلات الأذكار والتذكيرات داخل التطبيق', sw('audioMute', false))));
  b.append(sec('تكرار الأدعية'));
  b.append(h('div.list.card', row('تكرار الأدعية', 'في أذكار الصباح والمساء يُحتسب عدّ بعض الأدعية (١٠٠) بملف صوتي واحد', sw('audioRepeat', true))));
  b.append(sec('سرعة التشغيل'));
  b.append(M.chips([[0.75, '٠٫٧٥×'], [1, '١×'], [1.25, '١٫٢٥×'], [1.5, '١٫٥×']], M.cfg.audioSpeed || 1, v=>M.save('audioSpeed', +v)));
  b.append(note('تُطبَّق السرعة على تسجيلات الأذكار والمكتبة الصوتية.'));
}};

/* ---- language ---- */
S.lang = {title:'تغيير اللغة', build(b){
  const l = h('div.list.card');
  M.LANGS.forEach(([id, n, e])=>l.append(h('button.item.nf-opt'+(M.lang === id ? '.on' : ''), {dataset:{noi18n:1}, onclick:async()=>{ if(id === M.lang) return; if(await M.confirm('تغيير لغة الواجهة إلى «'+n+'»؟ سيُعاد فتح التطبيق.', 'تغيير')) M.setLang(id); }}, h('span.nf-radio'), h('div.grow', h('div.t', n), h('div.s', e)))));
  b.append(l, note('تُترجَم واجهة التطبيق (القوائم والأزرار والإعدادات). القرآن والأذكار والأدعية تبقى بنصها العربي، وترجمة معاني القرآن تُختار من إعدادات المصحف. الودجت والإشعارات تبقى بالعربية حاليًا.'));
  b.append(h('div.list.card', M.item({icon:'quran', title:'ترجمة القرآن', sub:'اختر لغة الترجمة', onClick:()=>M.openSettings('quran'), trail:M.ic('fwd')})));
}};

/* ---- fonts & numbers ---- */
S.fonts = {title:'الخط والأرقام', build(b){
  const prev = h('div.card.pad.qfont', {style:'text-align:center;line-height:2.2;font-size:'+(1.3 * (M.cfg.fontScale || 1))+'rem'}, 'اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ');
  b.append(prev);
  b.append(sec('حجم الخط'));
  b.append(M.chips([[0.9, 'صغير'], [1, 'متوسط'], [1.12, 'كبير'], [1.28, 'كبير جدًا']], M.cfg.fontScale || 1, v=>{ M.save('fontScale', +v); prev.style.fontSize = (1.3 * +v)+'rem'; }));
  b.append(h('div.list.card', {style:'margin-top:14px'},
    M.lang !== 'ar' ? null : row('الأرقام', 'تُطبَّق على كل شاشات التطبيق', M.seg([['hindi', '\u200Bعربية ١٢٣'], ['latin', '\u200BEnglish 123']], M.cfg.digits, v=>{ M.save('digits', v); M.refreshScreen && M.refreshScreen(); })),
    row('نظام الوقت', '١٢ ساعة أو ٢٤ ساعة', M.seg([['0', '١٢ ساعة'], ['1', '٢٤ ساعة']], M.cfg.h24 ? '1' : '0', v=>{ M.save('h24', v === '1'); pv(); M.refreshScreen && M.refreshScreen(); }))));
  const pvEl = h('b.num', {style:'font-size:1.6rem'});
  function pv(){ pvEl.textContent = M.fmt(new Date(2026, 0, 1, 16, 54)); }
  b.append(h('div.list.card', {style:'margin-top:12px'}, row('شكل وقت الصلاة', '', M.seg([['trad', 'تقليدي'], ['plain', 'متصل']], M.cfg.timeStyle || 'trad', v=>{ M.save('timeStyle', v); pv(); M.refreshScreen && M.refreshScreen(); })), row('معاينة', '', pvEl)));
  pv();
}};

/* ---- backups ---- */
const SNAP = 'snapshots';
M.makeSnapshot = function(tag){
  try{
    const NOSNAP = [SNAP, 'rbList', 'mqRadios', 'wtaf', 'radioOk', 'lastSync', 'lastFired'];   // caches that rebuild themselves are not worth five copies
    const o = {}; M.store.keys().forEach(k=>{ if(!NOSNAP.includes(k)) o[k] = M.store.get(k); });
    if(o.settings){ o.settings = Object.assign({}, o.settings); delete o.settings.bgImage; delete o.settings.heroImg; delete o.settings.wdgBgData; }
    const a = M.store.get(SNAP, []); a.unshift({t:Date.now(), tag:tag || 'auto', size:JSON.stringify(o).length, data:o}); while(a.length > 5) a.pop();
    while(M.store.set(SNAP, a) === false && a.length > 1) a.pop();
    return true;
  }catch(e){ return false; }
};
M.autoBackup = function(){ const k = 'lastAutoBackup'; if(M.store.get(k) === M.dkey()) return; M.store.set(k, M.dkey()); M.makeSnapshot('auto'); };
S.backup = {title:'النسخ الاحتياطية', build(b){
  const box = h('div.col-flex'); b.append(box);
  function draw(){
    box.innerHTML = '';
    box.append(note('يحفظ التطبيق نسخة تلقائية مرة في اليوم داخل الجهاز (آخر ٥ نسخ) تشمل الإعدادات والعلامات والعدّاد والمفضلة والأدعية والمتابعة.'));
    box.append(h('button.btn.block', {onclick:()=>{ M.makeSnapshot('manual'); M.toast('تم إنشاء نسخة'); draw(); }}, M.ic('download'), 'إنشاء نسخة احتياطية الآن'));
    box.append(sec('النسخ على هذا الجهاز'));
    const a = M.store.get(SNAP, []);
    if(!a.length) box.append(h('div.muted.small', 'لا توجد نسخ بعد'));
    a.forEach((s, i)=>box.append(h('div.item.card.static', h('div.grow', h('div.t', new Date(s.t).toLocaleString('ar-EG')), h('div.s', (s.tag === 'auto' ? 'تلقائية' : 'يدوية')+' • '+M.n(Math.round(s.size / 1024))+' ك.ب')),
      h('button.btn.sm.tonal', {onclick:async()=>{ if(await M.confirm('سيتم استبدال بياناتك الحالية بهذه النسخة.', 'استعادة', 'استعادة النسخة؟')){ { const keep = M.cfg; Object.entries(s.data).forEach(([k, v])=>{ if(k === 'settings' && v) v = Object.assign({}, v, {bgImage:keep.bgImage, heroImg:keep.heroImg, wdgBgData:keep.wdgBgData}); M.store.set(k, v); }); } M.toast('تمت الاستعادة'); setTimeout(()=>location.reload(), 900); } }}, 'استعادة'))));
    box.append(sec('نسخ خاصة'));
    const cp = (title, keys)=>h('div.item.card.static', h('div.grow', h('div.t', title)), h('button.btn.sm.tonal', {onclick:()=>{ const o = {}; keys.forEach(k=>o[k] = M.store.get(k)); M.share(JSON.stringify({app:'muslim', part:title, data:o})); }}, 'مشاركة'));
    box.append(cp('العدّاد (المسبحة)', ['tasbih']), cp('المفضلة', ['adhkarFavs', 'pagerFav', 'duaFav', 'namesFav']), cp('أدعيتي', ['myDuas', 'myDuas2', 'loved']));
  }
  draw();
}};

/* ---- cards (home) ---- */
S.cards = {title:'إعدادات البطاقات', build(b){
  const box = h('div.col-flex'); b.append(box);
  function draw(){
    box.innerHTML = '';
    const order = M.homeOrder(), B = M.cfg.homeBlocks || {};
    const l = h('div.list.card');
    order.forEach((k, i)=>{
      const def = M.HOME_ORDER.find(x=>x[0] === k); if(!def) return;
      const mv = d=>{ const a = M.homeOrder(); const j = i + d; if(j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; M.save('homeOrder', a); draw(); };
      l.append(h('div.item.static', h('div.grow', h('div.t', def[1]), def[2] ? h('div.s', def[2]) : null),
        M.reorder(i, order.length, mv),
        M.switchEl(M.homeOn(k), v=>{ const x = Object.assign({}, M.cfg.homeBlocks); x[k] = v; M.save('homeBlocks', x); })));
    });
    box.append(l);
    box.append(sec('بطاقاتي'));
    const cc = M.cfg.customCards || [];
    cc.forEach((c, i)=>box.append(h('div.item.card.static', h('div.grow', h('div.t', c.title), h('div.s', c.text)), h('button.icon-btn.tonal', {onclick:()=>{ const x = (M.cfg.customCards || []).filter((_, j)=>j !== i); M.save('customCards', x); draw(); }}, M.ic('trash')))));
    box.append(h('button.btn.tonal.block', {onclick:()=>{
      const t = h('input.field', {placeholder:'عنوان البطاقة'}), x = h('textarea.field', {placeholder:'النص (دعاء، ذكر، تذكير…)', rows:4});
      const sh = M.sheet({title:'بطاقة جديدة', content:h('div.col-flex', t, x, h('button.btn.block', {onclick:()=>{ if(!x.value.trim()) return; M.save('customCards', (M.cfg.customCards || []).concat({title:t.value.trim() || 'بطاقتي', text:x.value.trim()})); sh.close(); draw(); }}, 'إضافة'))});
    }}, M.ic('plus'), 'إضافة بطاقة'));
    box.append(h('button.btn.ghost.block', {style:'margin-top:8px', onclick:()=>{ M.save({homeOrder:[], homeBlocks:{prayer:true, ayah:true, progress:true, quick:true, dhikr:true}}); draw(); }}, 'استعادة الترتيب الافتراضي'));
  }
  draw();
}};

/* ---- adhkar pages ---- */
S.adhkarset = {title:'صفحات الأذكار', build(b){
  const items = [
   ['adhResume', 'ابدأ الأذكار من حيث انتهيت', 'يتذكر آخر ذكر وصلت إليه', false],
   ['noTashkeel', 'إخفاء تشكيل الحروف', 'في كل الأدعية والأذكار', false],
   ['hideFadl', 'إخفاء شرح الذكر', 'إخفاء الفضل والتفصيل أسفل الذكر', false],
   ['hideCountText', 'إخفاء نص العدّاد', 'إخفاء كلمة «المتبقي» ونحوها', false],
   ['showNextBar', 'إظهار عدّاد الصلاة القادمة', 'شريط أعلى القائمة بالوقت المتبقي', false],
   ['eveBaqara', 'آخر آيتين من البقرة في أذكار المساء', 'تُضاف آية ٢٨٥–٢٨٦', false],
   ['eveIstighfar', 'الاستغفار في أذكار المساء', 'يُضاف «أستغفر الله وأتوب إليه»', false],
   ['dua100', 'دعاء لا إله إلا الله (١٠٠ مرة)', 'اجعل عدّ التهليل ١٠٠ بدل ١٠ في الصباح والمساء', false],
   ['keepAwake', 'تعطيل الإغلاق التلقائي للشاشة', 'تبقى الشاشة مضاءة أثناء الأذكار', false],
   ['pageNumRight', 'رقم الصفحة يمين الشاشة', 'ترقيم الأذكار على اليمين', false]];
  const l = h('div.list.card'); items.forEach(([k, t, s, d])=>l.append(row(t, s, sw(k, d)))); b.append(l);
}};

/* ---- prayer page ---- */
S.prayerpage = {title:'صفحة الصلاة', build(b){
  b.append(sec('الواجهة البسيطة'));
  b.append(h('div.list.card', row('تفعيل الواجهة البسيطة', 'تعرض الصلوات الخمس فقط دون البطاقات الإضافية', sw('ppSimple', false)), row('إظهار الشروق والثلث الأخير', 'مع الواجهة البسيطة', sw('ppSun', true))));
  b.append(sec('الإقامة'));
  b.append(h('div.list.card', M.item({icon:'settings', title:'ضبط مواقيت الإقامة', sub:'إظهار وقت الإقامة والدقائق بعد الأذان', onClick:()=>M.prayerSettings(), trail:M.ic('fwd')})));
  b.append(sec('أوقات النهي'));
  b.append(h('div.list.card', row('عرض أوقات النهي', 'سيظهر تنبيه في أوقات النهي عن الصلاة', sw('showForbid', true))));
  b.append(sec('عرض الأوقات'));
  b.append(h('div.list.card', {style:'margin-bottom:10px'}, row('إظهار أيقونات الصلوات', 'أوقفه لعرض الأسماء والمواعيد فقط (في الصفحة وفي الودجت)', M.switchEl(M.cfg.prIcons !== false, v=>{ M.save('prIcons', v); M.syncNative && M.syncNative(); }))));
  b.append(M.seg([['list', 'قائمة'], ['grid', 'بطاقات']], M.cfg.ppView || 'list', v=>M.save('ppView', v)));
}};

/* ---- random adhkar ---- */
/* ---- online backgrounds: free-licensed photos from Wikimedia Commons, downloaded once and kept on the device ---- */
function urlToDataURL(url, maxSide, q){
  return new Promise((res, rej)=>{
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onerror = ()=>rej(new Error('img'));
    im.onload = ()=>{ try{
      const k = Math.min(1, (maxSide || 1100) / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q || .8));
    }catch(e){ rej(e); } };
    im.src = url;
  });
}
/* onPick(dataURL, credit) */
M.openOnlineBg = function(onPick, title){
  /* one reviewed list of mosque pictures (js/mosque-bgs.js) — no search, no categories */
  let busy = false, view; const grid = h('div.obg-grid'), state = h('div.empty.hide', '');
  const T = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/', url = (p, w)=>T+p+'/'+w+'px-'+p.split('/').pop();
  const fill = ()=>{
    if(!navigator.onLine){ state.textContent = 'لا يوجد اتصال بالإنترنت — الصور تُحمَّل من الشبكة.'; state.classList.remove('hide'); }
    (M.MOSQUE_BGS || []).forEach(([p, w, hh, credit])=>{
      const t = h('button.obg-t', {'aria-label':'تنزيل هذه الخلفية', onclick:async()=>{
        if(busy) return; busy = true; t.classList.add('busy');
        try{
          // the image server only serves a few fixed widths (500 / 960 / 1280 …)
          let data = null; for(const u of [w >= 1280 ? url(p, 1280) : '', url(p, 960), url(p, 500)].filter(Boolean)){ try{ data = await urlToDataURL(u, 1280, .82); break; }catch(e){} }
          if(!data) throw 0;
          onPick(data, credit); M.toast('تم تنزيل الخلفية وتعيينها'); view && view.close();
        }catch(e){ M.toast('تعذّر تنزيل هذه الصورة — تحقق من الاتصال أو جرّب صورة أخرى'); }
        busy = false; t.classList.remove('busy');
      }}, h('img', {src:url(p, 500), loading:'lazy', decoding:'async', alt:'', onerror:function(){ t.remove(); }}), credit ? h('span', credit) : null);
      grid.append(t);
    });
  };
  view = M.openView({title:title || 'تنزيل خلفيات', id:'onlinebg', build:b=>{
    b.append(h('div.small.muted', {style:'line-height:1.9;margin:0 4px 10px'}, M.n((M.MOSQUE_BGS || []).length)+' صورة مساجد مختارة واحدة واحدة (الحرمان، الأقصى، ومساجد من أنحاء العالم) برخص حرة من «ويكيميديا كومنز». اضغط صورة لتنزيلها وتعيينها؛ تُحفظ على جهازك وتعمل بعدها دون اتصال.'), state, grid);
    fill();
  }});
  return view;
};

S.randset = {title:'الأذكار المنوعة', build(b){
  const pvText = h('div.qfont.rs2-t', 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ'), pv = h('div.card.rs2-pv', {style:'position:relative;isolation:isolate;overflow:hidden'}, pvText, h('div.small.rs2-s', 'متفق عليه'));
  const draw = ()=>{ pvText.style.fontSize = (1.25 * (M.cfg.duaSize || 1))+'rem'; M.bgPaint(pv, 'randBgX').then(on=>pv.classList.toggle('photo', on)); };
  b.append(pv, sec('الخلفية'),
    h('button.btn.block', {onclick:()=>M.bgSheet('randBgX', 'خلفية الأذكار المنوعة', draw)}, M.ic('image'), 'اختيار الخلفية والتمويه'),
    h('div.small.muted', {style:'margin:6px 2px 0'}, 'من الصور الموجودة، أو من جهازك، أو بتنزيل خلفيات إسلامية — مع تمويه وتعتيم.'),
    sec('النص'),
    h('div.card.pad', h('div.small.muted', 'حجم النص'), rg(0.8, 1.8, 0.1, M.cfg.duaSize || 1, v=>{ M.save('duaSize', v); draw(); })),
    h('div.list.card', {style:'margin-top:12px'},
      row('تغيير تلقائي', 'يتبدل الذكر كل ١٥ ثانية دون لمس الشاشة', M.switchEl(M.cfg.randAuto !== false, v=>M.save('randAuto', v))),
      row('ابدأ التطبيق من الأذكار المنوعة', 'يفتح التطبيق على ذكر عشوائي مباشرة', sw('startRandom', false))),
    h('button.btn.block', {style:'margin-top:14px', onclick:()=>M.openRandom()}, M.ic('sparkle'), 'فتح الأذكار المنوعة'));
  draw();
}};

/* ---- counter ---- */
S.counterset = {title:'إعدادات العدّاد', build(b){
  b.append(h('div.list.card',
    row('العدّ بصوتك (الميكروفون)', 'يظهر زر الميكروفون في صفحات الأذكار: انطق الذكر فيُعدّ وحده، دون إنترنت', sw('voiceCount', false)),
    row('نغمة مع كل عدّة', 'صوت قصير عند كل عدّة', sw('cntSound', false)),
    row('العدّ بالاهتزاز', 'اهتزاز خفيف مع كل عدّة', sw('cntVib', true)),
    row('اهتزاز عند نهاية العدّ', 'تنبيه عند اكتمال العدد', sw('cntVibEnd', true)),
    row('أظهر العدّاد عند اللزوم', 'يظهر زر العدّ فقط عندما يلزم عدد', sw('cntOnlyNeeded', false)),
    row('اذهب إلى الدعاء التالي بعد الانتهاء', 'ينتقل تلقائيًا عند اكتمال العدد', M.switchEl(M.cfg.dhikrNext !== false, v=>M.save('dhikrNext', v))),
    row('حلقة العدّاد باللون الأخضر', '', sw('cntGreen', false))));
  b.append(h('div.card.pad', {style:'margin-top:12px'}, h('div.small.muted', 'حجم العدّاد في صفحات الأذكار'), rg(0.8, 1.6, 0.1, M.cfg.cntSize || 1, v=>M.save('cntSize', v))));
  b.append(h('div.list.card', {style:'margin-top:12px'}, M.item({icon:'beads', title:'فتح المسبحة', onClick:()=>M.openTasbih(), trail:M.ic('fwd')})));
  b.append(h('div.list.card', {style:'margin-top:12px'}, M.item({icon:'trash', title:'تصفير عدّاد الأذكار', sub:'يصفّر تقدّم اليوم في الأذكار', onClick:async()=>{ if(await M.confirm('سيتم تصفير تقدّم الأذكار لليوم.', 'تصفير')){ const p = M.store.get('adhkarProg', {}); delete p[M.dkey()]; M.store.set('adhkarProg', p); M.toast('تم'); } }})));
}};

/* ---- icon ---- */
S.icon = {title:'أيقونة التطبيق', build(b){
  if(!(window.Android && Android.setAppIcon)){ b.append(note('تغيير الأيقونة متاح في تطبيق الأندرويد.')); return; }
  const ig = h('div.icon-grid'); let cur = 10; try{ cur = Android.getAppIcon(); }catch(e){}
  for(let i = 1; i <= 10; i++) ig.append(h('button.icon-opt'+(i === cur ? '.on' : ''), {dataset:{i}, onclick:()=>{ try{ Android.setAppIcon(i); }catch(e){} M.setIconAccent(i); M.$$('.icon-opt', ig).forEach(x=>x.classList.toggle('on', +x.dataset.i === i)); if(!window.isIOSApp) M.toast('تغيّر لون التطبيق الآن، والأيقونة تتغيّر بعد خروجك من التطبيق', 3600); }}, h('img', {src:'img/icons/'+i+'.jpg', alt:''})));
  b.append(h('div.section-h', 'اختر أيقونة جديدة للتطبيق'), ig, window.isIOSApp ? null : note('ستتغيّر أيقونة التطبيق بعد خروجك منه. بعض الشاشات الرئيسية تحذف الاختصار القديم عند التغيير؛ ستجد التطبيق بأيقونته الجديدة في قائمة التطبيقات، وبياناتك لا تتأثر.'));
}};

/* ---- hero image (bundled gallery or user supplied) ---- */
if(M.cfg.heroImg === undefined){ M.cfg.heroImg = 'img/hero/4.webp'; if(M.cfg.heroImgOp == null) M.cfg.heroImgOp = .5; }
M.heroPhotoEl = function(){
  const c = M.cfg, fit = c.heroFit === 'contain';
  let x = c.heroPX, y = c.heroPY;
  if(x == null){ x = 50; y = c.heroImgPos === 'top' ? 0 : c.heroImgPos === 'bottom' ? 100 : 50; }
  const z = fit ? 1 : (c.heroZoom || 1);
  if(fit){ x = 50; y = 50; }
  return h('div.hero-photo'+(fit ? '.fit' : ''), {style:'opacity:'+(c.heroImgOp != null ? c.heroImgOp : .45)},
    fit ? h('div.hero-photo-b', {style:'background-image:url("'+c.heroImg+'")'}) : null,
    h('div.hero-photo-i', {style:'background-image:url("'+c.heroImg+'");background-size:'+(fit ? 'contain' : 'cover')+';background-position:'+x+'% '+y+'%;transform:scale('+z+');transform-origin:'+x+'% '+y+'%'}));
};
M.heroImg = function(where){
  const c = M.cfg; if(!c.heroImg) return null;
  const on = c.heroImgOn || 'both'; if(on !== 'both' && on !== where) return null;
  return M.heroPhotoEl();
};
S.heroimg = {title:'صورة بطاقة الصلاة', build(b){
  const prev = h('div.card.accent.pad.hero-prev', h('div.small.muted', 'الصلاة القادمة'), h('div.nx-n.title-font', 'المغرب'), h('div.nx-t', '٦:٣٧ م'));
  const draw = ()=>{
    prev.querySelectorAll('.hero-photo').forEach(x=>x.remove());
    if(M.cfg.heroImg) prev.prepend(M.heroPhotoEl());
    prev.classList.toggle('drag', !!M.cfg.heroImg && M.cfg.heroFit !== 'contain');
    const hn = b.querySelector('.hero-hint'); if(hn) hn.textContent = M.cfg.heroFit === 'contain' ? 'الصورة تظهر كاملة داخل البطاقة.' : 'اسحب الصورة داخل البطاقة لتحريكها إلى الموضع الذي يعجبك.';
  };
  /* drag the photo inside the card to choose what part shows */
  let dg = null;
  prev.addEventListener('pointerdown', e=>{
    if(!M.cfg.heroImg || M.cfg.heroFit === 'contain') return;
    const c = M.cfg; dg = {x:e.clientX, y:e.clientY, px:c.heroPX != null ? c.heroPX : 50, py:c.heroPY != null ? c.heroPY : (c.heroImgPos === 'top' ? 0 : c.heroImgPos === 'bottom' ? 100 : 50)};
    try{ prev.setPointerCapture(e.pointerId); }catch(_){}
  });
  prev.addEventListener('pointermove', e=>{
    if(!dg) return; e.preventDefault();
    const r = prev.getBoundingClientRect(), cl = v=>Math.max(0, Math.min(100, Math.round(v)));
    M.cfg.heroPX = cl(dg.px - (e.clientX - dg.x) / r.width * 100);
    M.cfg.heroPY = cl(dg.py - (e.clientY - dg.y) / r.height * 100);
    const i = prev.querySelector('.hero-photo-i');
    if(i){ i.style.backgroundPosition = i.style.transformOrigin = M.cfg.heroPX+'% '+M.cfg.heroPY+'%'; }
  });
  const endDrag = ()=>{ if(!dg) return; dg = null; M.save({heroPX:M.cfg.heroPX, heroPY:M.cfg.heroPY}); };
  prev.addEventListener('pointerup', endDrag); prev.addEventListener('pointercancel', endDrag);
  const file = h('input', {type:'file', accept:'image/*', class:'hide', onchange:async e=>{
    const f = e.target.files[0]; if(!f) return;
    try{ const url = await M.imageToDataURL(f, 900, .8); M.save({heroImg:url, heroPX:50, heroPY:50, heroZoom:1}); draw(); syncCtl(); M.toast('تم تعيين الصورة'); }catch(err){ M.toast('تعذّر قراءة الصورة'); }
  }});
  const zoom = h('input', {type:'range', min:1, max:3, step:.05, value:M.cfg.heroZoom || 1, oninput:e=>{ M.save('heroZoom', +e.target.value); draw(); }});
  const fitSeg = h('div');
  const syncCtl = ()=>{
    zoom.value = M.cfg.heroZoom || 1; zoom.disabled = M.cfg.heroFit === 'contain';
    fitSeg.replaceChildren(M.seg([['cover', 'ملء البطاقة'], ['contain', 'ملائمة (الصورة كاملة)']], M.cfg.heroFit || 'cover', v=>{ M.save('heroFit', v); draw(); syncCtl(); }));
  };
  syncCtl();
  b.append(note('اختر صورة جاهزة أو صورة من جهازك لتظهر خلف بطاقة الصلاة القادمة. صور جهازك تبقى عليه ولا تُرسل إلى أي مكان.'), prev,
    h('div.small.muted.hero-hint', 'اسحب الصورة داخل البطاقة لتحريكها إلى الموضع الذي يعجبك.'), fitSeg,
    h('button.btn.ghost.sm', {style:'margin-top:8px', onclick:()=>{ M.save({heroPX:50, heroPY:50, heroZoom:1}); draw(); syncCtl(); }}, M.ic('refresh'), 'إعادة التوسيط'), file,
    h('div.row-flex.gap-s', {style:'margin-top:12px;flex-wrap:wrap'},
      h('button.btn.sm', {onclick:()=>file.click()}, M.ic('image'), 'اختيار صورة من الجهاز'),
      h('button.btn.tonal.sm', {onclick:()=>M.openOnlineBg(url=>{ M.save({heroImg:url, heroPX:50, heroPY:50, heroZoom:1}); draw(); syncCtl(); mark(); })}, M.ic('download'), 'تنزيل خلفيات'),
      h('button.btn.tonal.sm', {onclick:async()=>{ const u = await M.prompt('رابط صورة مباشر (https)', 'https://'); if(u && /^https:\/\/[^\s"'()]+$/.test(u.trim())){ M.save({heroImg:u.trim(), heroPX:50, heroPY:50, heroZoom:1}); draw(); syncCtl(); } else if(u) M.toast('الرابط يجب أن يبدأ بـ https://'); }}, M.ic('globe'), 'من رابط'),
      h('button.btn.ghost.sm', {onclick:()=>{ M.save({heroImg:null}); draw(); mark(); M.toast('تمت إزالة الصورة'); }}, M.ic('trash'), 'إزالة')));
  const gal = h('div.hero-gal');
  const mark = ()=>M.$$('.hero-th', gal).forEach(x=>x.classList.toggle('on', M.cfg.heroImg === 'img/hero/'+x.dataset.i+'.webp'));
  for(let i = 1; i <= 13; i++) gal.append(h('button.hero-th', {dataset:{i}, 'aria-label':'صورة '+i, style:'background-image:url("img/hero/t'+i+'.webp")', onclick:()=>{ M.save({heroImg:'img/hero/'+i+'.webp', heroPX:50, heroPY:50, heroZoom:1}); draw(); syncCtl(); mark(); M.haptic && M.haptic(8); }}));
  b.append(h('div.section-h', 'صور جاهزة'), gal); mark();
  b.append(h('div.list.card', {style:'margin-top:12px'},
    row('وضوح الصورة', '', h('input', {type:'range', min:.1, max:1, step:.05, value:M.cfg.heroImgOp != null ? M.cfg.heroImgOp : .45, oninput:e=>{ M.save('heroImgOp', +e.target.value); draw(); }})),
    row('تكبير الصورة', '', zoom)),
    h('div.card.pad', {style:'margin-top:12px'}, h('div.bold', 'مكان الظهور'), h('div', {style:'margin-top:8px'}, M.seg([['both', 'الاثنان'], ['prayer', 'صفحة الصلاة'], ['home', 'الرئيسية']], M.cfg.heroImgOn || 'both', v=>M.save('heroImgOn', v)))));
  draw();
}};

/* ---- performance / effects ---- */
S.perf = {title:'الأداء والشاشة', build(b){
  b.append(note('يتكيّف التطبيق تلقائيًا مع قدرة جهازك. اختر «موفّر» لأقصى سلاسة وأقل استهلاك للبطارية، أو «كامل» لتأثيرات الزجاج الأعمق على الأجهزة القوية.'));
  b.append(M.seg([['auto', 'تلقائي'], ['low', 'موفّر'], ['high', 'كامل']], M.cfg.fx || 'auto', v=>M.save('fx', v)));
  b.append(h('div.list.card', {style:'margin-top:12px'},
    row('الحركات والانتقالات', 'إيقافها يوفّر الطاقة', M.switchEl(M.cfg.anim !== false, v=>M.save('anim', v)))));
  b.append(h('div.section-h', 'شكل حركة فتح الصفحات'));
  b.append(M.seg([['default', 'الأساسية'], ['zoom', 'تكبير'], ['rise', 'صعود'], ['fade', 'تلاشٍ']], M.cfg.animStyle || 'default', v=>{ M.save('animStyle', v); document.documentElement.dataset.astyle = v; }));
  b.append(note('«موفّر»: يُلغي تمويه الخلفية خلف الأشرطة ويوقف حركة الخلفية. «كامل»: يضيف تمويهًا زجاجيًا للبطاقات (أثقل على الأجهزة الضعيفة).'));
  b.append(h('div.list.card', {style:'margin-top:12px'}, row('معدّل تحديث الشاشة', 'يعمل التطبيق بأعلى معدّل تدعمه شاشتك (٩٠ / ١٢٠ هرتز)', h('b.num', M.n(M.hz || 60)+' Hz'))));
  if(M.store.get('fxSlow', false)) b.append(h('div.card.pad', {style:'margin-top:12px'}, h('div.small', 'لاحظ التطبيق تقطّعًا على هذا الجهاز فخفّف المؤثرات تلقائيًا.'), h('button.btn.tonal.sm', {style:'margin-top:8px', onclick:()=>{ M.store.set('fxSlow', false); M.applyFx(); M.toast('أُعيدت المؤثرات — سيُعاد القياس'); }}, 'إعادة المؤثرات')));
  b.append(h('div.section-h', 'الشاشة المنحنية الحواف'));
  b.append(M.seg([['auto', 'تلقائي'], [0, 'بدون'], [8, 'خفيف'], [14, 'متوسط'], [22, 'واسع']], M.cfg.edge == null ? 'auto' : M.cfg.edge, v=>M.save('edge', v)));
  b.append(note('يُبعد المحتوى (والمصحف) عن الجانبين المنحنيين حتى لا يُقصّ النص أو تُلمس الحافة بالخطأ. «تلقائي» يأخذ القياس من الهاتف إن أعلنه، وإن لم يتغيّر شيء فاختر عرضًا يدويًا.'));
}};

/* ---- widgets: gallery of every widget by category (real preview + pin button) and an appearance tab (colours, background) ---- */
S.widgets = {title:'الودجت (الأدوات)', build(b){
  const PRE = [['ليلي ذهبي','#20261F','#FFFFFF','#D9B863'],['فحمي','#23262B','#FFFFFF','#FFFFFF'],['زمردي','#0F5A47','#FFFFFF','#CCE9DD'],['كحلي','#0f172a','#FFFFFF','#93c5fd'],['أبيض','#FFFFFF','#14342b','#0F8A6D'],['أسود','#000000','#FFFFFF','#D9B863']];
  const SW = {bg:['#20261F','#23262B','#000000','#0F5A47','#0f172a','#3b1d2a','#4a3423','#FFFFFF'], tx:['#FFFFFF','#F5EFE0','#CFE6CF','#14342b','#111111'], ac:['#D9B863','#FFFFFF','#CCE9DD','#93c5fd','#f0abfc','#fca5a5','#0F8A6D']};
  let st = Object.assign({bg:'#20261F', tx:'#FFFFFF', ac:'#D9B863', alpha:100}, M.cfg.wdg || {});
  const bgSrc = ()=>M.cfg.wdgBg || '';
  const same = (a, c)=>String(a).toLowerCase() === String(c).toLowerCase();
  const lum = c=>{ const n = parseInt(c.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000; };
  const prev = h('div.wg-car');
  const sv = (name, cls)=>h('span.wg-ic'+(cls || ''), {html:M.icon(name)});
  const card = (title, cls, ...kids)=>{
    const img = bgSrc(), src = img === 'custom' ? (M.cfg.wdgBgData || '') : img;
    const tx = img ? '#FFFFFF' : st.tx;
    const w = h('div.wg'+cls, {style:img ? 'background:linear-gradient(rgba(0,0,0,'+(M.cfg.wdgFade ? .25 : .5)+'),rgba(0,0,0,'+(M.cfg.wdgFade ? .25 : .5)+')),url("'+src+'") center/cover' : 'background:'+st.bg+';opacity:'+Math.max(.3, st.alpha / 100)}, ...kids);
    if(img && M.cfg.wdgFade) w.prepend(h('div.wg-fade', {dataset:{d:M.cfg.wdgFade}}));
    w.style.color = tx; w.style.setProperty('--ac', st.ac); w.style.setProperty('--wbg', img ? 'rgba(0,0,0,.45)' : st.bg); w.style.setProperty('--mint', lum(tx) > 150 ? '#CFE6CF' : st.ac);
    return h('div.wg-slide', w, h('div.small.muted.center', title));
  };
  /* live sample cards that follow the colours / background chosen below */
  const draw = ()=>{
    const keep = prev.scrollLeft; prev.innerHTML = '';
    const now = new Date(), t = M.prayerTimes(now), info = M.nextPrayer ? M.nextPrayer() : null;
    const P6 = ['fajr','sunrise','dhuhr','asr','maghrib','isha'], P5 = ['fajr','dhuhr','asr','maghrib','isha'];
    const IC = {fajr:'p:fajr', sunrise:'p:sunrise', dhuhr:'p:dhuhr', asr:'p:asr', maghrib:'p:maghrib', isha:'p:isha'};
    const nk = info && info.next && P5.includes(info.next.k) ? info.next.k : 'fajr';
    const lab = k=>k === 'sunrise' ? 'الشروق' : M.prayerLabel(k, now);
    const wd = M.WEEKDAYS[now.getDay()];
    const row = (ks, gold, icons)=>h('div.wg-row', ...ks.map(k=>h('div'+(k === nk ? (gold ? '.on.gold' : '.on') : ''), icons ? sv(IC[k]) : null, h('b', lab(k)), h('small', M.fmt(t[k])))));
    const moon = cls=>sv('moon', '.wg-moon'+(cls || ''));
    const refresh = ()=>sv('refresh', '.wg-ref');
    prev.append(card('الصلاة القادمة', '',
      h('div.wg-head', h('b.grow', 'أوقات الصلاة'), h('b.ac', wd), moon('.ac')),
      h('div.wg-mid', h('div.grow', h('div.ac.wg-s', 'الصلاة القادمة'), h('b.wg-big', lab(nk))), h('b.wg-time.ac', M.fmt(t[nk]))),
      h('div.wg-div'), row(P6, true, true)));
    prev.append(card('ذكر اليوم', '.wg-txt', h('div.wg-s.dim.end', 'ذكر اليوم'), h('div.wg-dhikr', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا'), h('div.wg-foot', refresh())));
    { const PH = ['سُبْحَانَ اللَّهِ', 'الْحَمْدُ لِلَّهِ', 'اللَّهُ أَكْبَرُ', 'لَا إِلَهَ إِلَّا اللَّهُ', 'أَسْتَغْفِرُ اللَّهَ'];
      prev.append(card('السبحة الإلكترونية', '.wg-tas',
        h('div.wg-tc', h('div.wg-s.dim', 'سبحة إلكترونية'), h('b.wg-cnt', M.n(786)), h('div.wg-s', 'تسبيح'), h('div.wg-btn', 'تسبيح')),
        h('div.wg-pl', ...PH.map((x, i)=>h('div'+(i ? '' : '.on'), i ? null : sv('check'), x))),
        h('div.wg-tr', h('div.wg-btn.soft', 'إعادة ضبط')))); }
    prev.scrollLeft = keep;
  };
  const apply = ()=>{
    M.cfg.wdg = st; M.save();
    try{ if(window.Android && Android.setWidgetStyle) Android.setWidgetStyle(st.bg, st.tx, st.ac, st.alpha); }catch(e){}
    draw(); paint();
  };
  const setBg = (src, data)=>{
    M.cfg.wdgBg = src; if(src === 'custom') M.cfg.wdgBgData = data; else delete M.cfg.wdgBgData; M.save();
    try{ if(window.Android && Android.setWidgetBg) Android.setWidgetBg(src === 'custom' ? data : src ? 'asset:'+src : ''); }catch(e){}
    draw(); mark(); fadeUi();
  };
  const fadeBox = h('div');
  const fadeUi = ()=>{
    fadeBox.replaceChildren();
    if(!bgSrc()) return;
    fadeBox.append(h('div.section-h', 'تمويه جانب من الصورة'),
      M.seg([['', 'بدون'], ['right', 'من اليمين'], ['left', 'من اليسار'], ['top', 'من أعلى'], ['bottom', 'من أسفل']], M.cfg.wdgFade || '', v=>{
        M.save('wdgFade', v); try{ if(window.Android && Android.setWidgetFade) Android.setWidgetFade(v); }catch(e){} draw(); }),
      h('div.small.muted', {style:'margin-top:6px'}, 'يُموَّه الجانب المختار ويُعتَّم قليلًا ليبقى النص واضحًا وتظهر بقية الصورة كما هي.'));
  };
  const gal = h('div.hero-gal');
  const mark = ()=>M.$$('.hero-th', gal).forEach(x=>x.classList.toggle('on', bgSrc() === x.dataset.src));
  gal.append(h('button.hero-th.none', {dataset:{src:''}, onclick:()=>setBg('')}, 'لون فقط'));
  for(let i = 1; i <= 13; i++) gal.append(h('button.hero-th', {dataset:{src:'img/hero/'+i+'.webp'}, 'aria-label':'صورة '+i, style:'background-image:url("img/hero/t'+i+'.webp")', onclick:()=>setBg('img/hero/'+i+'.webp')}));
  const file = h('input', {type:'file', accept:'image/*', class:'hide', onchange:async e=>{ const f = e.target.files[0]; if(!f) return; try{ const url = await M.imageToDataURL(f, 720, .82); setBg('custom', url); M.toast('تم تعيين الصورة'); }catch(err){ M.toast('تعذّر قراءة الصورة'); } }});
  /* colours: ready-made themes as small cards, then one row of swatches per colour */
  const themes = h('div.cp-themes'), custom = h('div.card.pad.cp-box');
  const paint = ()=>{
    themes.replaceChildren(...PRE.map(p=>h('button.cp-theme'+(same(p[1], st.bg) && same(p[2], st.tx) && same(p[3], st.ac) ? '.on' : ''), {onclick:()=>{ st = Object.assign({}, st, {bg:p[1], tx:p[2], ac:p[3]}); apply(); }},
      h('span.cp-mini', {style:'background:'+p[1]+';color:'+p[2]}, h('b', {style:'color:'+p[3]}, M.n(12)), h('i', {style:'background:'+p[2]})), h('span.small', p[0]))));
    const line = (lbl, key)=>{
      const inList = SW[key].some(c=>same(c, st[key]));
      return h('div.cp-line', h('div.cp-lbl', h('span', lbl), h('span.cp-hex', '​'+String(st[key]).toUpperCase())),
        h('div.cp-row', ...SW[key].map(c=>h('button.cp-sw'+(same(c, st[key]) ? '.on' : ''), {style:'--c:'+c, 'aria-label':lbl+' '+c, onclick:()=>{ st[key] = c; apply(); }})),
          h('label.cp-sw.cp-any'+(inList ? '' : '.on'), {style:inList ? '' : '--c:'+st[key], 'aria-label':'لون آخر'}, inList ? M.ic('plus') : null, h('input', {type:'color', value:st[key], onchange:e=>{ st[key] = e.target.value; apply(); }}))));
    };
    const pct = h('b.num', M.n(st.alpha)+'٪');
    custom.replaceChildren(line('الخلفية', 'bg'), line('النص', 'tx'), line('التمييز (المدينة والتاريخ)', 'ac'),
      h('div.cp-line', h('div.cp-lbl', h('span', 'الشفافية'), pct),
        h('input.cp-range', {type:'range', min:25, max:100, step:5, value:st.alpha, oninput:e=>{ st.alpha = +e.target.value; pct.textContent = M.n(st.alpha)+'٪'; M.cfg.wdg = st; draw(); }, onchange:()=>apply()})));
  };

  /* ---------- the catalogue: [key (= native provider), category, title, cells, other cells (preview *_b.png), description] ---------- */
  const CATS = [['all', 'الكل'], ['prayer', 'الصلاة'], ['quran', 'الأذكار والقرآن'], ['cal', 'التقويم والقمر'], ['tools', 'أدوات']];
  const ALT = {'4×2':'2×2', '2×2':'4×2', '4×3':'4×2', '4×4':'4×2', '4×1':'4×2'};
  const WG = [
    ['prayer','prayer','الصلاة القادمة والعدّ التنازلي','4×2',0,'الصلاة القادمة مع عدٍّ تنازلي حيّ وصفّ أوقات اليوم، ويتحوّل إلى شريط عند تقصيره'],
    ['list','prayer','أوقات الصلاة','4×2',0,'الصلوات الست مع التاريخ واليوم، والصلاة القادمة مُبرَزة'],
    ['simple','prayer','الصلاة القادمة (بسيط)','2×2',1,'الصلاة القادمة ووقتها والمتبقي والمدينة'],
    ['countdown','prayer','العدّ التنازلي للصلاة','2×2',1,'حلقة تقدّم واسم الصلاة بالخط العربي'],
    ['table','prayer','جدول الصلوات','2×2',1,'كل أوقات اليوم مع إبراز الصلاة القادمة'],
    ['next2','prayer','الصلاة القادمة بالخط','4×2',1,'اسم الصلاة بالخط العربي وأوقات اليوم وشريط التقدّم'],
    ['pair','prayer','السابقة والقادمة','4×2',1,'الوقت الماضي منذ الصلاة السابقة والمتبقي للقادمة'],
    ['progress','prayer','تقدّم اليوم','4×2',1,'التاريخ والصلاة القادمة ونقاط الأوقات'],
    ['pcal','prayer','التقويم والصلاة','4×2',1,'التاريخ الهجري والميلادي بالخط مع أوقات اليوم'],
    ['strip','prayer','شريط الصلوات','4×1',1,'الصلوات الخمس في صفّ واحد'],
    ['day','prayer','يوم الصلاة','4×3',1,'التاريخ والعدّ التنازلي وخط الأوقات والشروق والمدينة'],
    ['grid','prayer','شبكة الصلوات','4×4',1,'ستّ بطاقات للأوقات مع التاريخ والمدينة'],
    ['rows','prayer','الصلاة القادمة (كبير)','4×4',1,'أيقونة واسم ووقت كبير وصفّ الأوقات'],
    ['dhikr','quran','ذكر اليوم','4×2',0,'ذكر أو دعاء يتغيّر كل يوم، وزر لتبديله فورًا'],
    ['ayah','quran','آية اليوم مع التفسير','4×2',0,'آية كريمة مع تفسيرها الميسّر، تتغيّر كل يوم'],
    ['qazkar','quran','اقتباس: ذكر','4×2',1,'ذكر أو دعاء يتغيّر كل يوم أو باللمس'],
    ['qhadith','quran','اقتباس: حديث','4×2',1,'حديث شريف يتغيّر كل يوم أو باللمس'],
    ['khatma','quran','ورد الختمة','4×2',1,'آياتك من حيث توقفت مع «قرأتها» والاستماع — كبّره أو صغّره كما تحب'],
    ['qayah','quran','اقتباس: آية','4×2',1,'آية بالرسم العثماني تتغيّر كل يوم أو باللمس'],
    ['hq','quran','حديث وقرآن','4×2',1,'تبديل بين الحديث الشريف والقرآن الكريم'],
    ['azkarpro','quran','الأذكار بالأقسام','4×3',1,'أذكار الصباح والمساء والصلاة والنوم والتسابيح'],
    ['date','cal','التاريخ الهجري','2×2',0,'اليوم الهجري بخط كبير مع اسم الشهر والسنة'],
    ['cal','cal','التقويم الهجري','4×3',0,'شهر هجري كامل مع إبراز اليوم الحالي'],
    ['month','cal','الشهر الهجري بالخط','4×2',1,'اسم الشهر الهجري بخط عربي ومعه رقم اليوم'],
    ['moon','cal','طور القمر','2×2',1,'قرص القمر بطوره الحالي ونسبة الإضاءة، ومعه التاريخ الهجري والميلادي عند التكبير'],
    ['tasbih','tools','السبحة الإلكترونية','4×2',0,'سبحة بخمس صيغ وعدّاد كبير وزر إعادة ضبط'],
    ['ring','tools','عدّاد التسبيح الدائري','2×2',0,'حلقة تُظهر تقدّم كل ٣٣ تسبيحة مع رقم الدورة'],
    ['counter2','tools','العدّاد','2×2',1,'عدّاد تسبيح بزر واحد، ومعه إحصاء الأسبوع عند تكبيره'],
    ['all','tools','لوحة المسلم (الكل في واحد)','4×4',0,'التاريخ والصلاة القادمة وأوقات اليوم والسبحة والذكر في لوحة واحدة']];
  let cat = 'all';
  const list = h('div.wgc-list'), tabs = h('div.wgc-tabs', {role:'tablist'});
  const native = ()=>!!(window.Android && Android.pinWidget);
  const pin = key=>{
    let r = '';
    if(native()){ try{ r = String(Android.pinWidget(key)); }catch(e){ r = 'error'; } }
    else r = window.Android ? 'old' : 'web';
    M.haptic && M.haptic(10);
    if(r === 'ok') M.toast('اختر مكان الودجت من النافذة التي ظهرت', 3200);
    else if(r === 'web') M.toast('إضافة الودجت متاحة في تطبيق الأندرويد', 3200);
    else M.toast('اضغط مطولًا على الشاشة الرئيسية ← الأدوات ← «المسلم» ثم اختر الودجت', 4800);
  };
  const wcard = (w, i)=>{
    const [key, , title, sz, hasAlt, desc] = w, alt = ALT[sz];
    let showAlt = false;
    const img = h('img.wgc-img', {alt:title, decoding:'async', loading:i < 4 ? 'eager' : 'lazy'});
    const cells = s=>+String(s).split('×')[0];
    const chips = h('div.wgc-sz', {role:'group', 'aria-label':'الحجم'});
    const setAlt = v=>{
      showAlt = v; const cur = v ? alt : sz;
      img.src = 'img/wprev/'+key+(v ? '_b' : '')+'.png';
      img.className = 'wgc-img c'+cells(cur)+' r'+String(cur).split('×')[1];
      M.$$('button', chips).forEach((x, j)=>x.classList.toggle('on', (j === 1) === v));
    };
    chips.append(h('button.wgc-chip', {type:'button', onclick:()=>setAlt(false), 'aria-label':'الحجم '+sz}, M.n(sz)));
    if(hasAlt) chips.append(h('button.wgc-chip', {type:'button', onclick:()=>setAlt(true), 'aria-label':'الحجم '+alt}, M.n(alt)));
    chips.append(h('span.wgc-rt', 'يقبل تغيير الحجم'));
    setAlt(false);
    return h('article.wgc', {style:'--i:'+i, dataset:{k:key}},
      h('div.wgc-pv', img),
      h('div.wgc-b', h('h3.wgc-t', title), h('p.wgc-d', desc), chips,
        h('button.btn.wgc-add', {type:'button', onclick:()=>pin(key)}, M.ic('plus'), 'أضف إلى الشاشة الرئيسية')));
  };
  const count = c=>c === 'all' ? WG.length : WG.filter(w=>w[1] === c).length;
  const drawList = ()=>{
    let i = 0; list.replaceChildren();
    CATS.filter(c=>c[0] !== 'all' && (cat === 'all' || cat === c[0])).forEach(([id, name])=>{
      const items = WG.filter(w=>w[1] === id); if(!items.length) return;
      list.append(h('div.wgc-sec', h('b', name), h('span.wgc-n', M.n(items.length))));
      items.forEach(w=>list.append(wcard(w, i++)));
    });
    M.$$('.wgc-tab', tabs).forEach(x=>{ const on = x.dataset.c === cat; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
  };
  CATS.forEach(([id, name])=>tabs.append(h('button.wgc-tab', {type:'button', role:'tab', dataset:{c:id}, onclick:e=>{ cat = id; drawList(); e.currentTarget.scrollIntoView && e.currentTarget.scrollIntoView({inline:'center', block:'nearest'}); }}, name, h('span.wgc-n', M.n(count(id))))));

  /* ---------- the two panes ---------- */
  const gallery = h('div.wgc-pane',
    h('div.wgc-hero', h('div.grow', h('b', M.n(WG.length)+' ودجت'), h('div.small.muted', 'اختر التصنيف ثم اضغط «أضف إلى الشاشة الرئيسية»')), h('span.wgc-badge', {html:M.icon('t:apps')})),
    tabs, list,
    h('div.card.pad.wgc-how', h('div.bold', 'طريقة الإضافة اليدوية'), h('ol.small', {style:'line-height:2;margin:6px 0 0;padding-inline-start:20px'}, h('li', 'اضغط مطولًا على الشاشة الرئيسية'), h('li', 'اختر «الأدوات / Widgets»'), h('li', 'ابحث عن «المسلم» واختر الشكل الذي تريده'), h('li', 'اضغط مطولًا على الودجت واسحب حوافه لتغيير حجمه؛ يعيد ترتيب محتواه حسب المساحة'))),
    note(window.Android ? 'كل شكل يأخذ ألوانك وخلفيتك المختارة من تبويب «المظهر والألوان».' : 'الودجت متاح في تطبيق الأندرويد فقط؛ الصور أعلاه معاينة حقيقية للشكل.'));
  const look = h('div.wgc-pane', {hidden:true},
    h('div.section-h', 'معاينة فورية — اسحب لتتصفحها'), prev,
    h('div.section-h', 'ألوان جاهزة'), themes,
    h('div.section-h', 'ألوان مخصصة'), custom,
    h('div.section-h', 'خلفية الودجت'), gal, file,
    h('div.row-flex.gap-s', {style:'margin-top:10px;flex-wrap:wrap'}, h('button.btn.sm', {onclick:()=>M.openOnlineBg(async url=>{ let small = url; try{ const bl = await (await fetch(url)).blob(); small = await M.imageToDataURL(bl, 720, .82); }catch(e){} setBg('custom', small); })}, M.ic('download'), 'تنزيل خلفيات'),
      h('button.btn.tonal.sm', {onclick:()=>file.click()}, M.ic('image'), 'صورة من جهازي')), fadeBox,
    note(window.Android ? 'تُطبَّق الخلفية والألوان فورًا على كل ودجت مضاف. عند اختيار صورة يصير النص أبيض. تفسير آية اليوم يُحمَّل مرة واحدة عند توفر الإنترنت.' : 'الودجت متاح في تطبيق الأندرويد فقط؛ المعاينة أعلاه تقريبية.'));
  const main = h('div.wgc-main', {role:'tablist'});
  const showPane = id=>{ gallery.hidden = id !== 'g'; look.hidden = id !== 'l'; M.$$('button', main).forEach(x=>{ const on = x.dataset.p === id; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); }); if(id === 'g') drawList(); };
  [['g', 'الأشكال'], ['l', 'المظهر والألوان']].forEach(([id, name])=>main.append(h('button.wgc-mt', {type:'button', role:'tab', dataset:{p:id}, onclick:()=>showPane(id)}, name)));
  b.append(main, gallery, look);
  if(window.Android && !M.cfg.wdg) apply(); else { draw(); paint(); }
  mark(); fadeUi(); showPane('g');
}};

/* ---- help ---- */
S.help = {title:'مساعدة', build(b){
  const Q = [
   ['الإشعارات لا تصل في موعدها', 'فعّل إذن الإشعارات من إعدادات النظام، واسمح للتطبيق بالتنبيهات الدقيقة (Alarms & reminders)، واستثنِه من توفير البطارية. بعض الأجهزة (شاومي، هواوي، سامسونج) تغلق التطبيقات في الخلفية فيلزم تفعيل «التشغيل التلقائي».'],
   ['كيف أغيّر صوت إشعار معيّن؟', 'من مركز الإشعارات اضغط على الإشعار ثم اختر الصوت. تظهر لكل إشعار قناة خاصة في إعدادات الهاتف أيضًا.'],
   ['مواقيت الصلاة غير مطابقة لبلدي', 'من «مواقيت الصلاة» اختر الجهة المعتمدة في بلدك، وعدّل الدقائق يدويًا لكل صلاة عند الحاجة.'],
   ['كيف أضيف الودجت؟', 'اضغط مطولًا على الشاشة الرئيسية ← الأدوات (Widgets) ← «المسلم» ← اختر التصميم. يمكن تخصيص ألوانه من الإعدادات ← الودجت.'],
   ['هل يعمل التطبيق دون إنترنت؟', 'نعم: المصحف والأذكار والمواقيت والقبلة والأصوات. تحتاج الإنترنت للتلاوة والتفسير والإذاعات والبث.']];
  Q.forEach(([q, a])=>{ const c = h('div.card.gd-step', h('div.gd-head', {onclick:()=>c.classList.toggle('open')}, h('div.grow.bold', q), M.ic('chevDown')), h('div.gd-body', h('div.gd-b', h('span', a)))); b.append(c); });
}};

M.openSub = function(name, focus){
  const d = M.SETSUB[name]; if(!d) return null;
  const top = M.views[M.views.length - 1]; if(top && !top.closed && top.el.id === 'view-settings-'+name) return top;   // double tap
  const v = M.openView({id:'settings-'+name, title:d.title, build:b=>d.build(b)});
  if(focus) setTimeout(()=>M.settingsFocus && M.settingsFocus(focus), 420);
  return v;
};
})();
