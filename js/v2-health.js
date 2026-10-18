/* ===== health check: is everything the app needs working on this phone? =====
   Checks notifications, exact alarms, battery limits, what is scheduled, location, time zone, storage, data and errors,
   with a one-tap fix for each problem, a test reminder that goes through the real background path, and a report
   the user can share (no coordinates or personal content in it). */
(function(){
'use strict';
const M = window.M, h = M.h;
const A = ()=>window.Android || null;
const native = ()=>{ try{ return A() && A().healthStatus ? JSON.parse(A().healthStatus() || '{}') : null; }catch(e){ return null; } };
const fmtWhen = ts=>{ if(!ts) return '—'; const d = new Date(ts); return M.n(d.getDate())+' '+M.GMONTHS[d.getMonth()]+' • '+M.fmtTime(d); };
const tzOff = tz=>{ try{ const s = new Intl.DateTimeFormat('en-US', {timeZone:tz || undefined, timeZoneName:'shortOffset'}).formatToParts(new Date()).find(x=>x.type === 'timeZoneName').value; const m = /GMT([+\-−]?\d+(?::\d+)?)?/.exec(s); const o = m && m[1] ? m[1].replace('-', '−') : ''; return M.lang && M.lang !== 'ar' ? 'GMT'+o : 'غرينتش'+(o ? ' \u2066'+M.n(o)+'\u2069' : ''); }catch(e){ return tz || '—'; } };
const ago = ts=>{ const m = Math.round((Date.now() - ts) / 60000); if(m < 1) return 'الآن'; if(m < 60) return 'منذ '+M.n(m)+' د'; const hh = Math.round(m / 60); if(hh < 48) return 'منذ '+M.n(hh)+' س'; return 'منذ '+M.cnt(Math.round(hh / 24), 'يوم', true); };
const mb = b=>M.n((b / 1048576).toFixed(b > 104857600 ? 0 : 1))+' م.ب';

function lsBytes(){ let n = 0; try{ for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); n += (k.length + (localStorage.getItem(k) || '').length) * 2; } }catch(e){} return n; }
function anyReminderOn(){
  try{
    if(M.cfg.nfMaster === false) return false;
    if(Object.values(M.cfg.notifyIn || {}).some(Boolean)) return true;
    if(M.NF && M.nfGet && M.NF.some(d=>{ try{ return M.nfGet(d.id).on; }catch(e){ return false; } })) return true;
    return Object.values(M.cfg.alarm || {}).some(Boolean) || Object.values(M.cfg.iqamaNotif || {}).some(Boolean);
  }catch(e){ return false; }
}
function deviceTz(){ try{ return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }catch(e){ return ''; } }

/* every check returns {g, st:'ok'|'warn'|'bad'|'info', t, s, act:[[label, fn]]} */
function checks(N){
  const out = [], add = (g, st, t, s, act)=>out.push({g, st, t, s, act:act || []});
  const and = !!A();
  // ---- reminders
  const want = anyReminderOn();
  if(N){
    if(N.notif === false) add('rem', want ? 'bad' : 'warn', 'إشعارات التطبيق مقفولة', 'لن يصلك الأذان ولا أي تذكير حتى تسمح بالإشعارات.', [['السماح', ()=>{ try{ A().requestNotifPerm(); }catch(e){} setTimeout(redraw, 1500); }], ['إعدادات الإشعارات', ()=>A().openSystem('notif')]]);
    else add('rem', 'ok', 'الإشعارات مسموحة', '');
    if(N.chOff && N.chOff.length) add('rem', 'warn', 'بعض قنوات الإشعارات مقفولة', 'مقفول من إعدادات الهاتف: '+N.chOff.slice(0, 6).join('، ')+(N.chOff.length > 6 ? '…' : ''), [['فتح الإعدادات', ()=>A().openSystem('notif')]]);
    if(N.exact === false) add('rem', want ? 'bad' : 'warn', 'المنبّهات الدقيقة غير مسموحة', 'قد يتأخر الأذان دقائق. اسمح للتطبيق بـ«المنبّهات والتذكيرات».', [['السماح', ()=>A().openSystem('exact')]]);
    else add('rem', 'ok', 'المنبّهات الدقيقة مسموحة', 'يصل الأذان في وقته حتى والهاتف في وضع السكون.');
    if(N.bgRestricted) add('rem', 'bad', 'الهاتف يقيّد عمل التطبيق في الخلفية', 'ألغِ «تقييد الخلفية» من صفحة التطبيق في الإعدادات.', [['صفحة التطبيق', ()=>A().openSystem('app')]]);
    if(N.batteryFree === false) add('rem', want ? 'warn' : 'info', 'توفير البطارية قد يؤخّر التنبيهات', 'استثنِ «المسلم» من تحسين البطارية، وفي بعض الهواتف فعّل «التشغيل التلقائي».', [['استثناء من التوفير', ()=>A().openBatterySettings && A().openBatterySettings('battery')], ['التشغيل التلقائي', ()=>A().openBatterySettings && A().openBatterySettings('autostart')]]);
    else if(N.batteryFree) add('rem', 'ok', 'التطبيق مستثنى من توفير البطارية', '');
    if(N.powerSave) add('rem', 'info', 'وضع توفير الطاقة مفعّل', 'قد يؤخر الهاتف بعض التحديثات أثناءه.');
    if(N.bucket >= 40) add('rem', 'warn', 'الهاتف يعدّ التطبيق «نادر الاستخدام»', 'افتح التطبيق من حين لآخر أو استثنه من توفير البطارية حتى لا تتأخر التحديثات.');
    const al = N.alarms || {};
    if(want){
      if(!al.count) add('rem', 'bad', 'لا توجد تنبيهات مجدولة الآن', 'فعّلت تنبيهات لكن لا شيء مجدول على الهاتف. أعد الجدولة.', [['إعادة الجدولة', ()=>{ M.syncNative && M.syncNative(true); M.toast('تمت إعادة الجدولة'); setTimeout(redraw, 600); }]]);
      else{
        const daysLeft = (al.last - Date.now()) / 864e5;
        add('rem', daysLeft < 2 ? 'warn' : 'ok', 'مجدول '+M.n(al.count)+' تنبيهًا', 'التالي: '+fmtWhen(al.next)+' • ينتهي الجدول: '+fmtWhen(al.last)+(daysLeft < 2 ? ' — افتح التطبيق ليتجدد' : ''), daysLeft < 2 ? [['تجديد الآن', ()=>{ M.syncNative(true); setTimeout(redraw, 600); }]] : []);
      }
    }else add('rem', 'info', 'لا توجد تنبيهات مفعّلة', 'فعّل ما تريد من «الإشعارات».', [['الإشعارات', ()=>M.sectionOpen('notifs')]]);
    if(N.testAt){
      const due = N.testAt, arrived = N.firedAt && N.firedCode === 9901 && N.firedAt >= due - 2000;
      if(Date.now() < due) add('rem', 'info', 'اختبار التنبيه قيد الانتظار', 'سيصل إشعار تجريبي عند '+M.fmtTime(new Date(due))+'. يمكنك إغلاق التطبيق وإطفاء الشاشة.');
      else if(arrived){ const late = Math.round((N.firedAt - due) / 1000); add('rem', late > 120 ? 'warn' : 'ok', late > 120 ? 'وصل الاختبار متأخرًا '+M.cnt(Math.round(late / 60), 'دقيقة') : 'وصل اختبار التنبيه في وقته', late > 120 ? 'غالبًا بسبب توفير البطارية — راجع البنود أعلاه.' : 'الإشعارات تعمل في الخلفية ('+fmtWhen(N.firedAt)+').'); }
      else if(Date.now() - due > 90000) add('rem', 'bad', 'لم يصل اختبار التنبيه', 'كان موعده '+fmtWhen(due)+'. راجع إذن الإشعارات وتوفير البطارية ثم أعد الاختبار.');
    }
  }else if(M.platform === 'ios'){
    add('rem', 'info', 'إشعارات آيفون', 'تأكد من السماح بإشعارات «المسلم» من إعدادات الآيفون. صوت الأذان في الإشعار ٣٠ ثانية كحدّ أقصى، ويُجدول أقرب ٦٠ تنبيهًا ثم يتجدد عند فتح التطبيق.');
    if(want){ const last = M.store.get('lastSync', 0); add('rem', last && Date.now() - last < 2 * 864e5 ? 'ok' : 'warn', last ? 'آخر جدولة '+ago(last) : 'لم تُجدول التنبيهات بعد', 'افتح التطبيق مرة كل يوم أو يومين ليبقى الجدول ممتدًا.', [['إعادة الجدولة', ()=>{ M.syncNative && M.syncNative(true); setTimeout(redraw, 600); }]]); }
  }else{
    add('rem', 'info', 'في المتصفح', 'تعمل التذكيرات أثناء فتح الصفحة فقط. ثبّت تطبيق الأندرويد أو الآيفون لتصلك في الخلفية.');
  }
  // ---- location & time
  const loc = M.cfg.loc;
  if(!loc) add('time', 'bad', 'لم يُحدَّد موقعك', 'المواقيت تُحسب الآن للقاهرة افتراضيًا.', [['تحديد الموقع', ()=>M.locationSheet && M.locationSheet()]]);
  else add('time', 'ok', 'الموقع: '+loc.name, (loc.auto ? 'محدّد تلقائيًا' : 'مختار من القائمة')+' • التوقيت '+tzOff(loc.tz), [['تغيير', ()=>M.locationSheet && M.locationSheet()]]);
  const dtz = (N && N.tz) || deviceTz();
  if(loc && loc.tz && dtz && loc.tz !== dtz){
    let same = false; try{ const d = new Date(); same = M.dstZone ? M.dstZone(loc.tz).now === M.dstZone(dtz).now : false; }catch(e){}
    add('time', same ? 'info' : 'warn', 'منطقة جهازك الزمنية تختلف عن موقعك', 'الجهاز: '+dtz+' • الموقع: '+loc.tz+(same ? ' (نفس الفرق عن غرينتش الآن)' : ' — إن كنت سافرت فحدّث موقعك.'), [['تحديث الموقع', ()=>M.locationSheet && M.locationSheet()]]);
  }
  if(N && N.autoTime === false) add('time', 'warn', 'ضبط الوقت التلقائي مقفول', 'إن كانت ساعة الهاتف غير دقيقة ستتأخر أو تتقدم التنبيهات.', [['إعدادات الوقت', ()=>A().openSystem('date')]]);
  if(M.cfg.dstMode && M.cfg.dstMode !== 'auto') add('time', 'info', 'التوقيت الصيفي مضبوط يدويًا', 'الأوقات المعروضة '+(M.cfg.dstMode === 'summer' ? 'بالتوقيت الصيفي' : 'بالتوقيت الشتوي')+'.', [['تغيير', ()=>M.sectionOpen('dst')]]);
  try{ const mk = M.methodKey ? M.methodKey() : M.cfg.method, mn = (M.METHODS.find(m=>m[0] === mk) || [, mk])[1]; add('time', 'info', 'طريقة الحساب', (M.cfg.method === 'auto' ? 'تلقائي: ' : '')+mn+' • '+(M.cfg.madhhab === 'hanafi' ? 'العصر الحنفي' : 'العصر الجمهور'), [['الضبط', ()=>M.prayerSettings && M.prayerSettings()]]); }catch(e){}
  // ---- data & storage
  const ayat = M.Q && M.Q.ayahs ? M.Q.ayahs.length : 0;
  if(ayat === 6236) add('data', 'ok', 'نص القرآن كامل', M.n(6236)+' آية');
  else if(ayat) add('data', 'bad', 'نص القرآن ناقص', 'وُجدت '+M.n(ayat)+' آية فقط. أعد تثبيت التطبيق.');
  else add('data', 'info', 'نص القرآن لم يُحمَّل بعد', 'يُحمَّل عند فتح المصحف.', [['تحميل', ()=>{ M.loadQuran && M.loadQuran().then(redraw).catch(redraw); }]]);
  const ls = lsBytes();
  add('data', ls > 4.5 * 1048576 ? 'warn' : 'ok', 'بيانات التطبيق: '+mb(ls), ls > 4.5 * 1048576 ? 'المساحة المخصصة تكاد تمتلئ — احذف خلفية الصورة أو النسخ الاحتياطية القديمة.' : 'الإعدادات والتقدّم والمتابعة');
  if(N){
    if(N.dlBytes) add('data', 'info', 'التنزيلات: '+mb(N.dlBytes), 'تلاوات وأذانات للاستماع دون إنترنت', [['إدارة', ()=>M.sectionOpen('downloads')]]);
    if(N.free != null && N.free < 300 * 1048576) add('data', 'warn', 'المساحة الفارغة قليلة: '+mb(N.free), 'قد يفشل تنزيل التلاوات والتحديثات.', [['التخزين', ()=>A().openSystem('storage')]]);
  }
  const snaps = M.store.get('snapshots', []) || [], lastSnap = snaps.length ? snaps[0].t : 0;
  if(!lastSnap || Date.now() - lastSnap > 8 * 864e5) add('data', 'warn', 'لا توجد نسخة احتياطية حديثة', 'النسخة تُحفظ داخل الجهاز. صدّر ملفًا أيضًا قبل تغيير الهاتف.', [['نسخة الآن', ()=>{ M.makeSnapshot && M.makeSnapshot('manual'); M.toast('تم إنشاء نسخة'); redraw(); }], ['النسخ', ()=>M.openSub && M.openSub('backup')]]);
  else add('data', 'ok', 'آخر نسخة احتياطية '+ago(lastSnap), M.n(snaps.length)+' نسخ محفوظة داخل الجهاز', [['النسخ', ()=>M.openSub && M.openSub('backup')]]);
  // ---- stability
  const errs = (window.__errlog ? window.__errlog.list() : []).filter(e=>Date.now() - e.t < 7 * 864e5);
  if(errs.length) add('stab', errs.length > 5 ? 'warn' : 'info', M.n(errs.length)+' خطأ برمجي في آخر ٧ أيام', 'لا تؤثر غالبًا على بياناتك. أرسل التقرير لنصلحها.', [['عرض', ()=>showErrors(errs)], ['مسح', ()=>{ window.__errlog.clear(); redraw(); }]]);
  else add('stab', 'ok', 'لا أخطاء مسجّلة في آخر ٧ أيام', '');
  if(N){
    if(N.crashCount) add('stab', 'warn', 'توقّف التطبيق '+M.cnt(N.crashCount, 'مرة'), 'آخرها '+fmtWhen(N.crashAt)+'.', [['التفاصيل', ()=>showText('آخر توقف', N.crash || '')], ['مسح', ()=>{ A().clearCrash(); redraw(); }]]);
    if(N.goneCount) add('stab', 'info', 'أُعيد تشغيل عرض الصفحة '+M.cnt(N.goneCount, 'مرة'), 'يحدث عند امتلاء ذاكرة الهاتف أو تحديث WebView، ويعود التطبيق وحده.');
    const wv = parseInt(String(N.webview || '').split('.')[0], 10);
    if(wv && wv < 110) add('stab', 'warn', 'إصدار WebView قديم ('+N.webview+')', 'حدّث «Android System WebView» من المتجر لعرض أسرع وأكثر أمانًا.', [['المتجر', ()=>M.openLink('https://play.google.com/store/apps/details?id=com.google.android.webview')]]);
    else if(wv) add('stab', 'ok', 'WebView '+N.webview, '');
  }
  return out;
}

let host = null, redraw = ()=>{};
function showErrors(list){
  showText('الأخطاء المسجّلة', list.map(e=>'['+new Date(e.t).toISOString().slice(0, 16).replace('T', ' ')+'] '+(e.n > 1 ? '×'+e.n+' ' : '')+e.msg+(e.src ? '  ('+e.src+':'+e.line+')' : '')+(e.stack ? '\n'+e.stack.split('\n').slice(0, 3).join('\n') : '')).join('\n\n'));
}
function showText(title, text){
  M.sheet({title, content:h('div', h('div.hc-err', text || '—'), h('div.hc-actions', h('button.btn.tonal.sm', {onclick:()=>M.copy(text)}, M.ic('copy'), 'نسخ')))});
}

function report(N, list){
  const L = [];
  L.push('تقرير فحص تطبيق «المسلم» — '+new Date().toISOString().slice(0, 16).replace('T', ' '));
  L.push('الإصدار: '+(M.VERSION || '')+(N && N.code ? ' ('+N.code+')' : '')+' • '+(N ? 'أندرويد '+N.release+' (API '+N.sdk+') • '+N.brand+' '+N.model+' • WebView '+(N.webview || '?') : navigator.userAgent.slice(0, 120)));
  L.push('اللغة: '+(M.cfg.lang || 'ar')+' • السمة: '+(M.cfg.skin || '')+'/'+(M.cfg.theme || '')+' • حجم الخط: '+(M.cfg.fontScale || 1));
  L.push('المنطقة الزمنية: الموقع '+((M.cfg.loc || {}).tz || '—')+' / الجهاز '+((N && N.tz) || deviceTz())+' • الطريقة: '+M.cfg.method);
  L.push('');
  list.forEach(c=>L.push((c.st === 'ok' ? '✓' : c.st === 'bad' ? '✗' : c.st === 'warn' ? '!' : '·')+' '+c.t+(c.s ? ' — '+c.s : '')));
  const errs = window.__errlog ? window.__errlog.list().slice(0, 8) : [];
  if(errs.length){ L.push(''); L.push('آخر الأخطاء:'); errs.forEach(e=>L.push('- '+(e.n > 1 ? '×'+e.n+' ' : '')+e.msg+(e.src ? ' ('+e.src+':'+e.line+')' : ''))); }
  if(N && N.crash){ L.push(''); L.push('آخر توقف ('+fmtWhen(N.crashAt)+'):'); L.push(String(N.crash).split('\n').slice(0, 8).join('\n')); }
  return L.join('\n');
}

const GROUPS = [['rem', 'التنبيهات والأذان'], ['time', 'الموقع والوقت'], ['data', 'البيانات والتخزين'], ['stab', 'الاستقرار']];
function open(){
  // permissions change in the system screens: check again when the user comes back
  const back = ()=>{ if(!document.hidden && host && host.isConnected) setTimeout(redraw, 300); };
  document.addEventListener('visibilitychange', back);
  M.openView({id:'health', title:'فحص التطبيق', onClose:()=>document.removeEventListener('visibilitychange', back), build:b=>{
    host = h('div'); b.append(host);
    redraw = ()=>{
      if(!host.isConnected && host.parentNode) return;
      const N = native(), list = checks(N);
      host.replaceChildren();
      const bad = list.filter(c=>c.st === 'bad').length, warn = list.filter(c=>c.st === 'warn').length;
      host.append(h('div.card.pad.hc-sum'+(bad ? '.bad' : warn ? '.warn' : ''),
        h('div.hc-badge', {html:M.icon(bad ? 'close' : warn ? 'bell' : 'check')}),
        h('div.grow', h('div.title-font.bold', bad ? M.n(bad)+' مشكلة تحتاج إصلاحًا' : warn ? M.n(warn)+' تنبيه' : 'كل شيء يعمل جيدًا'),
          h('div.small.muted', bad || warn ? 'اضغط على الزر بجانب كل بند لإصلاحه.' : 'الإشعارات والبيانات والموقع سليمة على هذا الجهاز.'))));
      GROUPS.forEach(([g, name])=>{
        const items = list.filter(c=>c.g === g); if(!items.length) return;
        host.append(h('h3.section-h.hc-group', name));
        const card = h('div.card');
        items.forEach(c=>card.append(h('div.hc-item.'+c.st,
          h('span.hc-dot', {html:M.icon(c.st === 'ok' ? 'check' : c.st === 'bad' ? 'close' : c.st === 'warn' ? 'bell' : 'info')}),
          h('div.grow', h('div.hc-t', c.t), c.s ? h('div.hc-s', c.s) : null,
            c.act.length ? h('div.hc-act', ...c.act.map(([l, fn])=>h('button.btn.tonal.sm', {onclick:()=>{ try{ fn(); }catch(e){ M.toast('تعذّر فتح هذه الصفحة'); } }}, l))) : null))));
        host.append(card);
      });
      const acts = h('div.hc-actions');
      if(A() && A().testAlarm) acts.append(h('button.btn', {onclick:()=>{ const ts = A().testAlarm(60); M.toast(ts ? 'سيصل إشعار تجريبي بعد دقيقة — أطفئ الشاشة لتتأكد' : 'تعذّر جدولة الاختبار'); setTimeout(redraw, 400); }}, M.ic('bell'), 'اختبار تنبيه بعد دقيقة'));
      acts.append(h('button.btn.tonal', {onclick:()=>M.share(report(N, list))}, M.ic('share'), 'مشاركة التقرير'),
        h('button.btn.ghost', {onclick:()=>{ redraw(); M.toast('تم الفحص من جديد'); }}, M.ic('refresh'), 'إعادة الفحص'));
      host.append(acts, h('div.tiny.muted', {style:'margin:12px 4px 0;line-height:1.9'}, 'التقرير لا يحتوي على موقعك الدقيق ولا على محتواك الخاص، ولا يُرسَل إلا إذا شاركته أنت.'));
    };
    redraw();
  }});
}
/* on the home screen: a short warning when reminders are on but cannot arrive */
let nCache = null, nAt = 0;
const nativeCached = ()=>{ if(Date.now() - nAt > 60000){ nCache = native(); nAt = Date.now(); } return nCache; };
M.addHomeNotice && M.addHomeNotice(()=>{
  if(!A() || !A().healthStatus || !anyReminderOn() || M.noticeSnoozed('health', 3)) return null;
  const N = nativeCached(); if(!N) return null;
  const al = N.alarms || {};
  const msg = N.notif === false ? 'الإشعارات مقفولة، فلن يصلك الأذان.'
    : N.exact === false ? 'المنبّهات الدقيقة غير مسموحة، فقد يتأخر الأذان.'
    : N.bgRestricted ? 'الهاتف يقيّد التطبيق في الخلفية، فقد لا يصل الأذان.'
    : (!al.count && M.store.get('lastSync', 0)) ? 'لا توجد تنبيهات مجدولة رغم تفعيلها.' : null;
  if(!msg) return null;
  const el = h('div.card.pad.tv-banner.hc-notice', h('span.lead', {html:M.icon('bell')}),
    h('div.grow', h('div.bold', 'قد لا يصلك الأذان'), h('div.small.muted', msg),
      h('div.tv-act', h('button.btn.sm', {onclick:()=>open()}, 'افحص وأصلح'), h('button.btn.ghost.sm', {onclick:()=>{ M.noticeSnooze('health'); el.remove(); }}, 'لاحقًا'))));
  return el;
});
M.openHealth = open;
M.healthReport = ()=>report(native(), checks(native()));
M.addSection({id:'health', title:'فحص التطبيق', icon:'shield', group:'الإعدادات والأمان', fn:open});
})();
