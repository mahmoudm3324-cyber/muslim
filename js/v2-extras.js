/* ===== v2 extras: sleep timer, senior (high-contrast) mode, app lock, flip-to-silence, volume-key tasbih ===== */
(function(){
'use strict';
const M = window.M, h = M.h, A = window.Android;
const native = f=>{ try{ return A && typeof A[f] === 'function'; }catch(e){ return false; } };
const call = (f, ...a)=>{ try{ if(native(f)) return A[f](...a); }catch(e){} };

/* ---------- sleep timer ---------- */
let st = null;   // {end, tick, mode, s0}
function stopSleep(){ if(st){ clearInterval(st.tick); try{ M.player.a.volume = 1; }catch(e){} st = null; M.emit('sleep', null); } }
function fireSleep(){
  try{ M.player.stop(); }catch(e){}
  try{ M.stopSound && M.stopSound(); }catch(e){}
  try{ document.querySelectorAll('audio,video').forEach(a=>{ try{ a.pause(); }catch(e){} }); }catch(e){}
  stopSleep(); M.toast('تم إيقاف التشغيل — تصبح على خير');
}
function startSleep(min, mode){
  stopSleep();
  st = {end: Date.now() + (min || 0) * 60000, mode: mode || 'time', s0: M.player.s};
  st.tick = setInterval(()=>{
    if(!st) return;
    if(st.mode === 'surah'){ if(!M.player.playing || (M.player.s && st.s0 && M.player.s !== st.s0)) fireSleep(); return; }
    const left = st.end - Date.now();
    if(left <= 0){ fireSleep(); return; }
    if(left < 20000) try{ M.player.a.volume = Math.max(0.05, left / 20000); }catch(e){}   // gentle fade over the last 20 s
  }, 1000);
  M.emit('sleep', st);
}
M.sleepTimer = {start:startSleep, stop:stopSleep, get active(){ return !!st; }, get end(){ return st ? st.end : 0; }};
M.openSleepTimer = function(){
  const body = h('div.sheet-body');
  const status = h('div.small.muted', {style:'text-align:center;margin:4px 0 10px;min-height:22px'});
  let sh;
  const cancel = h('button.btn.ghost.block', {style:'margin-top:8px', onclick:()=>{ stopSleep(); upd(); M.toast('أُلغي مؤقت النوم'); }}, 'إلغاء المؤقت');
  const upd = ()=>{ cancel.hidden = !st; if(!st) status.textContent = 'لا يوجد مؤقت نشط'; else if(st.mode === 'surah') status.textContent = 'سيتوقف التشغيل عند نهاية السورة'; else status.textContent = 'سيتوقف بعد '+M.cnt(Math.max(1, Math.ceil((st.end - Date.now()) / 60000)), 'دقيقة', true); };
  const t = setInterval(()=>{ if(!status.isConnected){ clearInterval(t); return; } upd(); }, 5000);
  const chip = (min, label)=>h('button.chip', {onclick:()=>{ startSleep(min); upd(); M.toast('سيتوقف التشغيل بعد '+label); if(sh && sh.close) sh.close(); }}, label);
  body.append(h('div.small.muted', {style:'margin-bottom:10px;line-height:1.9'}, 'يوقف التلاوة بعد المدة التي تختارها مع خفض تدريجي للصوت في آخر ٢٠ ثانية.'), status,
    h('div.chips', {style:'justify-content:center;flex-wrap:wrap;gap:8px'}, chip(10, M.cnt(10, 'دقيقة')), chip(15, M.cnt(15, 'دقيقة')), chip(30, M.cnt(30, 'دقيقة')), chip(45, M.cnt(45, 'دقيقة')), chip(60, 'ساعة'), chip(90, 'ساعة ونصف')),
    h('button.btn.tonal.block', {style:'margin-top:12px', onclick:()=>{ startSleep(0, 'surah'); upd(); M.toast('سيتوقف التشغيل عند نهاية السورة'); if(sh && sh.close) sh.close(); }}, 'حتى نهاية السورة'),
    cancel);
  upd();
  sh = M.sheet({title:'مؤقت النوم', body, content:body});
};

/* ---------- senior / high-contrast mode ---------- */
const root = document.documentElement;
function applySenior(){
  const on = !!M.cfg.senior;
  root.dataset.senior = on ? '1' : '0';
  const base = M.baseFontScale ? M.baseFontScale() : (+M.cfg.fontScale || 1);
  root.style.setProperty('--fs', on ? Math.min(1.6, Math.max(base, 1) * 1.25) : base);
}
const ap = M.applyTheme;
if(typeof ap === 'function') M.applyTheme = function(){ const r = ap.apply(this, arguments); applySenior(); return r; };
applySenior();

/* ---------- native sync ---------- */
function sync(){
  call('setFlipStop', !!M.cfg.flipStop);
  call('setAppLock', !!M.cfg.appLock);
}
M.on('settings', k=>{ if(['senior'].includes(k)) applySenior(); if(['flipStop', 'appLock'].includes(k)) sync(); });
setTimeout(sync, 800);

/* ---------- volume keys count the tasbih (Android) ---------- */
window.onVolKey = function(d){
  const ts = document.querySelector('.tasbih'); if(!ts) return;
  if(d > 0){ const b = ts.querySelector('.tb-btn'); b && b.click(); }
  else { const b = ts.querySelector('.tb-act button'); b && b.click(); }
};
setInterval(()=>{ if(native('setVolKeys')) call('setVolKeys', !!M.cfg.volTasbih && !!document.querySelector('.tasbih')); }, 1500);

/* ---------- settings screen ---------- */
function passSheet(){
  const has = !!call('hasLockPass');
  const a = h('input.field', {type:'password', placeholder:'كلمة السر الجديدة (٤ أحرف أو أكثر)', autocomplete:'new-password'}), b = h('input.field', {type:'password', placeholder:'أعد كتابتها'});
  const cur = has ? h('input.field', {type:'password', placeholder:'كلمة السر الحالية'}) : null;
  const err = h('div.small', {style:'color:var(--danger,#c0392b);min-height:1.4em'});
  const sh = M.sheet({title:'كلمة سر التطبيق', content:h('div.col-flex', {style:'gap:10px'},
    h('div.small.muted', {style:'line-height:1.8'}, 'تُحفظ على جهازك مشفّرة ولا تُرسل لأي مكان. إن نسيتها فلن يمكن استعادتها، وتبقى لك طريقة فتح التطبيق بإلغاء تثبيته.'),
    cur, a, b, err,
    h('button.btn.block', {onclick:()=>{
      if(cur && !call('checkLockPass', cur.value)) return err.textContent = 'كلمة السر الحالية غير صحيحة';
      if(a.value.length < 4) return err.textContent = 'كلمة السر قصيرة (٤ أحرف على الأقل)';
      if(a.value !== b.value) return err.textContent = 'الكلمتان غير متطابقتين';
      call('setLockPass', a.value); M.save('appLock', true); sync(); sh.close(); M.toast('تم ضبط كلمة السر وتفعيل القفل');
    }}, has ? 'تغيير كلمة السر' : 'حفظ وتفعيل القفل'),
    has ? h('button.btn.ghost.block', {onclick:()=>{ if(!call('checkLockPass', cur.value)) return err.textContent = 'اكتب كلمة السر الحالية لحذفها'; call('setLockPass', ''); sh.close(); M.toast('أُزيلت كلمة السر'); }}, 'إزالة كلمة السر') : null)});
}
M.openSecuritySettings = function(){
  M.openView({title:'الأمان وأدوات إضافية', id:'v2_extras', build:b=>{
    const sw = (k, t, s, on)=>h('div.item.static', h('div.grow', h('div.t', t), h('div.s', s)), M.switchEl(!!M.cfg[k], v=>{ M.save(k, v); if(on) on(v); }));
    const rows = [
      M.item({icon:'moon', title:'مؤقت النوم', sub:'إيقاف التلاوة والراديو بعد مدة', onClick:()=>M.openSleepTimer(), trail:M.ic('fwd')}),
      sw('senior', 'وضع كبار السن', 'خط أكبر بنسبة ٢٥٪ وألوان عالية التباين وأزرار أوسع', ()=>applySenior())
    ];
    if(native('setAppLock')){
      /* turning the lock on asks the system once (fingerprint / face / screen lock), so it is known to work before it locks anything */
      const lockSw = M.switchEl(!!M.cfg.appLock, v=>{
        const back = msg=>{ M.save('appLock', false); sync(); lockSw.classList.remove('on'); lockSw.setAttribute('aria-checked', 'false'); if(msg) M.toast(msg, 4500); };
        if(!v){ M.save('appLock', false); sync(); return; }
        if(!call('lockAvailable')){ if(native('hasLockPass') && call('hasLockPass')){ M.save('appLock', true); sync(); M.toast('تم تفعيل القفل بكلمة السر'); return; } back('لا يوجد قفل شاشة على الهاتف — فعّل البصمة أو رمز القفل من إعدادات الهاتف، أو اضبط كلمة سر للتطبيق'); passSheet(); return; }
        if(!native('testLock')){ M.save('appLock', true); sync(); return; }
        window.onLockTest = (ok, why)=>{ window.onLockTest = null; if(ok){ M.save('appLock', true); sync(); M.toast('تم تفعيل قفل التطبيق ✓'); } else back(why === 'none' ? 'لا يوجد قفل شاشة على الهاتف' : 'لم يُفعَّل القفل — لم تُؤكَّد البصمة'); };
        call('testLock');
      });
      rows.push(h('div.item.static', h('div.grow', h('div.t', 'قفل التطبيق'), h('div.s', window.isIOSApp ? 'بـ Face ID أو Touch ID أو رمز قفل الآيفون عند فتح التطبيق' : call('bioAvail') ? 'بالبصمة أو رمز قفل الهاتف عند فتح التطبيق' : 'برمز قفل الهاتف أو كلمة سر التطبيق عند فتحه')), lockSw));
      // the iPhone app locks with Face ID / Touch ID / the passcode only; the app password, flipping and the volume keys are Android's
      if(native('setLockPass')) rows.push(M.item({icon:'t:lock', title:'كلمة سر التطبيق', sub:call('hasLockPass') ? 'مفعّلة — تُطلب عند فتح التطبيق مع البصمة' : 'اختيارية — بديل عن رمز قفل الهاتف', onClick:()=>passSheet(), trail:M.ic('fwd')}));
      if(M.can('flipStop')) rows.push(sw('flipStop', 'قلب الهاتف لكتم الأذان', 'ضع الهاتف على وجهه ليتوقف صوت الأذان فورًا'));
      if(M.can('volKeys')) rows.push(sw('volTasbih', 'التسبيح بأزرار الصوت', 'داخل شاشة المسبحة: رفع الصوت يزيد العدّاد وخفضه يتراجع'));
    }
    if(!native('setAppLock') && M.openWebLock) rows.splice(1, 0, M.item({icon:'t:lock', title:'قفل التطبيق', sub:'بصمة الوجه أو الإصبع (Face ID / Touch ID) أو كلمة سر', onClick:()=>M.openWebLock(), trail:M.ic('fwd')}));
    b.append(h('div.list.card', ...rows), h('div.tiny.muted', {style:'margin:10px 4px;line-height:1.9'}, window.isIOSApp ? 'قلب الهاتف لكتم الأذان والتسبيح بأزرار الصوت في تطبيق أندرويد فقط؛ الآيفون لا يسمح للتطبيقات بهما.' : native('setAppLock') ? 'قفل التطبيق وقلب الهاتف وأزرار الصوت تعمل في تطبيق أندرويد فقط.' : 'بعض الخيارات (القفل وقلب الهاتف وأزرار الصوت) تظهر في تطبيق أندرويد فقط.'));
  }});
};
M.addSection({id:'sleep_timer', title:'مؤقت النوم', icon:'moon', group:'أدوات', fn:()=>M.openSleepTimer()});
M.addSection({id:'v2_security', title:'الأمان وأدوات إضافية', icon:'settings', group:'أدوات', fn:()=>M.openSecuritySettings()});
})();
