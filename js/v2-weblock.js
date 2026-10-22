/* ===== App lock for the web / iPhone home-screen version =====
   Unlocks with the phone's own Face ID / Touch ID / fingerprint through WebAuthn (a key that never leaves the phone;
   the system shows its own prompt and permission), or with an app password (PBKDF2, salted, stored only on this phone).
   The Android app has its own native lock (BiometricPrompt), so this file does nothing there.
   Loaded right after core.js so the cover is up before anything else is drawn. */
(function(){
'use strict';
const M = window.M, h = M.h;
if(window.Android && typeof window.Android.setAppLock === 'function') return;   // the Android app has its own (native) lock
const K = 'wlock', GRACE = 30e3;
const cfg = ()=>M.store.get(K, {}) || {};
const save = p=>M.store.set(K, Object.assign(cfg(), p));
const isOn = ()=>{ const c = cfg(); return !!(c.on && (c.cred || c.pw)); };
const hasWA = ()=>!!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext);
const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const bioName = iOS ? 'Face ID أو Touch ID' : 'البصمة';
const b64u = buf=>{ let s = ''; new Uint8Array(buf).forEach(b=>s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = s=>{ s = s.replace(/-/g, '+').replace(/_/g, '/'); while(s.length % 4) s += '='; return Uint8Array.from(atob(s), c=>c.charCodeAt(0)); };
const rnd = n=>crypto.getRandomValues(new Uint8Array(n));

async function platformOK(){ try{ return hasWA() && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); }catch(e){ return false; } }
/* a key on this phone, created behind the system's Face ID / fingerprint prompt */
async function register(){
  const c = await navigator.credentials.create({publicKey:{
    rp:{name:'المسلم'}, user:{id:rnd(16), name:'muslim-app', displayName:'المسلم'}, challenge:rnd(32),
    pubKeyCredParams:[{type:'public-key', alg:-7}, {type:'public-key', alg:-257}],
    authenticatorSelection:{authenticatorAttachment:'platform', userVerification:'required', residentKey:'discouraged', requireResidentKey:false},
    timeout:60000, attestation:'none'}});
  if(!c) throw new Error('none');
  return b64u(c.rawId);
}
async function verifyBio(){
  const c = cfg(); if(!c.cred) throw new Error('nocred');
  const a = await navigator.credentials.get({publicKey:{challenge:rnd(32), allowCredentials:[{type:'public-key', id:unb64u(c.cred), transports:['internal', 'hybrid']}], userVerification:'required', timeout:60000}});
  const ad = new Uint8Array(a.response.authenticatorData);
  if(!(ad[32] & 0x04)) throw new Error('not verified');   // the "user verified" flag: the system really checked the face / finger
  return true;
}
async function hashPw(pw, salt){
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:unb64u(salt), iterations:120000}, key, 256);
  return b64u(bits);
}
async function checkPw(pw){ const c = cfg(); if(!c.pw) return false; return (await hashPw(pw, c.pw.salt)) === c.pw.h; }
async function setPw(pw){ if(!pw){ save({pw:null}); return; } const salt = b64u(rnd(16)); save({pw:{salt, h:await hashPw(pw, salt)}}); }

/* ---------------- the cover ---------------- */
let cover = null, hiddenAt = 0, fails = 0, blockedTill = 0;
function lock(){
  if(cover || !isOn()) return;
  const c = cfg();
  const msg = h('div.wl-msg', c.cred ? 'اضغط للفتح بـ'+bioName : 'اكتب كلمة السر لفتح «المسلم»');
  const pw = c.pw ? h('input.field.wl-pw', {type:'password', placeholder:'كلمة السر', autocomplete:'current-password', enterKeyHint:'done', onkeydown:e=>{ if(e.key === 'Enter') tryPw(); }}) : null;
  const tryPw = async()=>{
    if(Date.now() < blockedTill){ msg.textContent = 'حاول بعد '+M.n(Math.ceil((blockedTill - Date.now()) / 1000))+' ثانية'; return; }
    if(await checkPw(pw.value)){ fails = 0; unlock(); return; }
    pw.value = ''; fails++;
    if(fails >= 5){ fails = 0; blockedTill = Date.now() + 30e3; msg.textContent = 'محاولات كثيرة — انتظر ٣٠ ثانية'; } else msg.textContent = 'كلمة السر غير صحيحة';
    cover.classList.remove('shake'); void cover.offsetWidth; cover.classList.add('shake');
  };
  const bio = async()=>{ try{ msg.textContent = 'جارٍ التحقق…'; await verifyBio(); unlock(); }catch(e){ msg.textContent = c.pw ? 'لم يتم التحقق — جرّب مرة أخرى أو اكتب كلمة السر' : 'لم يتم التحقق — اضغط للمحاولة مرة أخرى'; } };
  cover = h('div.app-lock', {role:'dialog', 'aria-modal':'true', 'aria-label':'التطبيق مقفل'},
    h('div.wl-in',
      h('div.wl-logo', M.ic('lock')),
      h('div.wl-t', 'التطبيق مقفل'), msg,
      c.cred ? h('button.btn.wl-bio', {onclick:bio}, M.ic('shield'), 'فتح بـ'+bioName) : null,
      pw, pw ? h('button.btn'+(c.cred ? '.tonal' : '')+'.wl-go', {onclick:tryPw}, 'فتح بكلمة السر') : null));
  document.body.append(cover);
  document.documentElement.classList.add('is-locked');
  if(pw && !c.cred) setTimeout(()=>{ try{ pw.focus(); }catch(e){} }, 300);
}
function unlock(){
  if(!cover) return;
  const c = cover; cover = null; c.classList.add('out');
  document.documentElement.classList.remove('is-locked');
  setTimeout(()=>c.remove(), 260);
}
M.appLocked = ()=>!!cover;
lock();   // at start, before the screens are built
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden){ hiddenAt = Date.now(); return; }
  if(isOn() && hiddenAt && Date.now() - hiddenAt > GRACE) lock();
});

/* ---------------- settings ---------------- */
M.openWebLock = function(){
  if(!M.openView) return;
  M.openView({id:'weblock', title:'قفل التطبيق', build:b=>{
    const box = h('div.col-flex'); b.append(box);
    async function draw(){
      const c = cfg(), bioOK = await platformOK();
      box.replaceChildren();
      box.append(h('div.card.pad.col-flex.wl-hero',
        h('div.row-flex', h('span.wl-hic', M.ic('lock')), h('div.grow', h('b.title-font', isOn() ? 'القفل مفعّل' : 'القفل متوقف'),
          h('div.small.muted', isOn() ? (c.cred ? 'يُطلب '+bioName+(c.pw ? ' أو كلمة السر' : '')+' عند فتح التطبيق' : 'تُطلب كلمة السر عند فتح التطبيق') : 'احمِ أذكارك وسجلّاتك من أي شخص يستخدم هاتفك')))));
      const st = h('div.small.wl-st');
      const list = h('div.list.card');
      /* face / finger */
      list.append(h('div.item.static', h('div.grow', h('div.t', 'القفل بـ'+bioName), h('div.s', bioOK ? (c.cred ? 'مفعّل على هذا الهاتف' : 'سيطلب الهاتف إذنك وبصمتك مرة واحدة للتفعيل') : 'غير متاح هنا'+(iOS ? ' — افتح التطبيق من أيقونته على الشاشة الرئيسية، وفعّل Face ID من إعدادات الهاتف' : ''))),
        M.switchEl(!!c.cred && !!c.on, async v=>{
          if(v){
            if(!bioOK){ st.textContent = 'البصمة غير متاحة في هذا المتصفح أو الهاتف. يمكنك استخدام كلمة سر.'; draw(); return; }
            try{ st.textContent = 'أكّد بـ'+bioName+'…'; const id = await register(); save({cred:id, on:true}); st.textContent = ''; M.toast('تم تفعيل القفل بـ'+bioName+' ✓'); }
            catch(e){ st.textContent = e && e.name === 'NotAllowedError' ? 'أُلغي التأكيد أو رُفض الإذن — لم يُفعَّل القفل.' : 'تعذّر التفعيل ('+(e && e.name || e)+').'; }
          } else { save({cred:null, on:!!c.pw}); }
          draw();
        })));
      /* password */
      list.append(M.item({icon:'lock', title:c.pw ? 'تغيير كلمة السر' : 'كلمة سر التطبيق', sub:c.pw ? 'مفعّلة' : 'بديل أو إضافة للبصمة', onClick:()=>pwSheet(draw), trail:M.ic('fwd')}));
      if(isOn()) list.append(h('div.item.static', h('div.grow', h('div.t', 'تجربة القفل الآن')), h('button.btn.tonal.sm', {onclick:()=>lock()}, 'اقفل')));
      if(isOn()) list.append(h('div.item.static', h('div.grow', h('div.t', 'إيقاف القفل')), h('button.btn.ghost.sm', {onclick:async()=>{
        if(c.cred){ try{ await verifyBio(); }catch(e){ st.textContent = 'أكّد ببصمتك لإيقاف القفل'; return; } }
        else if(c.pw){ const v = prompt('اكتب كلمة السر لإيقاف القفل'); if(!(await checkPw(v || ''))){ st.textContent = 'كلمة السر غير صحيحة'; return; } }
        save({on:false, cred:null, pw:null}); M.toast('أُوقف القفل'); draw(); }}, 'إيقاف')));
      box.append(list, st, h('div.tiny.muted', {style:'line-height:1.9;margin:0 4px'}, 'البصمة تبقى في هاتفك ولا يراها التطبيق: يطلب الهاتف التأكد بنفسه ثم يخبر التطبيق بالنتيجة فقط. يُقفل التطبيق عند فتحه وعند الرجوع إليه بعد نصف دقيقة.'));
    }
    draw();
  }});
};
function pwSheet(after){
  const c = cfg();
  const cur = c.pw ? h('input.field', {type:'password', placeholder:'كلمة السر الحالية', autocomplete:'current-password'}) : null;
  const a = h('input.field', {type:'password', placeholder:'كلمة السر الجديدة (٤ أحرف أو أكثر)', autocomplete:'new-password'}), b = h('input.field', {type:'password', placeholder:'أعد كتابتها', autocomplete:'new-password'});
  const err = h('div.small', {style:'color:var(--danger);min-height:1.4em'});
  const sh = M.sheet({title:'كلمة سر التطبيق', content:h('div.col-flex', h('div.small.muted', {style:'line-height:1.8'}, 'تُحفظ على هاتفك مشفّرة ولا تُرسل لأي مكان. إن نسيتها فامسح بيانات الموقع من إعدادات المتصفح.'), cur, a, b, err,
    h('button.btn.block', {onclick:async()=>{
      if(cur && !(await checkPw(cur.value))) return err.textContent = 'كلمة السر الحالية غير صحيحة';
      if(a.value.length < 4) return err.textContent = 'كلمة السر قصيرة (٤ أحرف على الأقل)';
      if(a.value !== b.value) return err.textContent = 'الكلمتان غير متطابقتين';
      await setPw(a.value); save({on:true}); sh.close(); M.toast('تم ضبط كلمة السر وتفعيل القفل'); after && after(); }}, c.pw ? 'تغيير' : 'حفظ وتفعيل'),
    c.pw ? h('button.btn.ghost.block', {onclick:async()=>{ if(!(await checkPw(cur.value))) return err.textContent = 'اكتب كلمة السر الحالية لحذفها'; await setPw(''); if(!cfg().cred) save({on:false}); sh.close(); M.toast('أُزيلت كلمة السر'); after && after(); }}, 'إزالة كلمة السر') : null)});
}
})();
