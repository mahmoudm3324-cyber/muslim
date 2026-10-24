/* ===== error log + boot watchdog (loaded first, depends on nothing) =====
   Keeps the last 30 distinct script errors on the device (localStorage "ms:errlog") so the health check can show them
   and the user can send them with a report. Nothing is ever sent anywhere automatically. */
(function(){
'use strict';
var KEY = 'ms:errlog', MAX = 30, mem = [];
var NOISE = /ResizeObserver loop|Script error\.?$|navigator\.vibrate|The play\(\) request was interrupted|NotAllowedError: play\(\)|AbortError/i;
function load(){ try{ var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return mem; } }
function save(a){ mem = a; try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }
function short(s, n){ s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '…' : s; }
function where(src){ src = String(src || ''); var i = src.indexOf('/js/'); return i >= 0 ? src.slice(i + 1) : short(src.replace(/^https?:\/\/[^/]+\//, ''), 80); }
function add(kind, msg, src, line, col, stack){
  msg = short(msg, 300);
  if(!msg || NOISE.test(msg)) return;
  var a = load(), now = Date.now(), id = kind + '|' + msg + '|' + where(src) + ':' + (line || 0);
  for(var i = 0; i < a.length; i++){ if(a[i].id === id){ a[i].n = (a[i].n || 1) + 1; a[i].t = now; save(a); return; } }
  a.push({id:id, kind:kind, t:now, msg:msg, src:where(src), line:line || 0, col:col || 0, stack:short(stack, 600), v:(window.M && window.M.VERSION) || '', n:1});
  while(a.length > MAX) a.shift();
  save(a);
}
window.addEventListener('error', function(e){
  if(!e) return;
  if(e.target && e.target !== window && (e.target.tagName === 'IMG' || e.target.tagName === 'AUDIO' || e.target.tagName === 'VIDEO' || e.target.tagName === 'SOURCE')) return; // missing media is handled by the screens
  if(e.target && e.target !== window && e.target.tagName === 'SCRIPT'){ add('load', 'تعذّر تحميل ملف: ' + where(e.target.src), e.target.src, 0, 0, ''); return; }
  add('error', e.message || (e.error && e.error.message), e.filename, e.lineno, e.colno, e.error && e.error.stack);
}, true);
window.addEventListener('unhandledrejection', function(e){
  var r = e && e.reason; if(!r) return;
  var m = r && r.message ? r.message : String(r);
  if(/aborted|AbortError|Failed to fetch|NetworkError|Load failed|timeout/i.test(m)) return;   // offline requests are expected
  add('promise', m, r && r.fileName, 0, 0, r && r.stack);
});
window.__errlog = {
  list: function(){ return load().slice().reverse(); },
  clear: function(){ save([]); },
  add: function(msg, where_){ add('app', msg, where_ || '', 0, 0, ''); }
};

/* boot watchdog: if the app has not drawn its first screen after 9 s, show a way out instead of a blank page */
setTimeout(function(){
  try{
    if(window.M && window.M.curTab) return;
    var errs = load().slice(-3).map(function(x){ return '• ' + x.msg + (x.src ? ' (' + x.src + ':' + x.line + ')' : ''); }).join('\n');
    var box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:#0f1f1a;color:#fff;font:16px/1.7 system-ui,sans-serif;direction:rtl;text-align:center';
    var inner = document.createElement('div'); inner.style.maxWidth = '420px';
    var t = document.createElement('div'); t.style.cssText = 'font-size:20px;font-weight:700;margin-bottom:8px'; t.textContent = 'تعذّر تشغيل التطبيق';
    var p = document.createElement('div'); p.style.cssText = 'opacity:.85;margin-bottom:16px'; p.textContent = 'بياناتك محفوظة. جرّب إعادة التشغيل، وإن تكرر ذلك أرسل التفاصيل أدناه.';
    var pre = document.createElement('pre'); pre.style.cssText = 'white-space:pre-wrap;text-align:start;font-size:12px;background:#ffffff14;border-radius:12px;padding:10px;max-height:30vh;overflow:auto;direction:ltr'; pre.textContent = errs || 'لا توجد تفاصيل.';
    var b = document.createElement('button'); b.textContent = 'إعادة التشغيل'; b.style.cssText = 'margin-top:14px;padding:12px 26px;border-radius:999px;border:0;background:#2e8b74;color:#fff;font:inherit;font-weight:700';
    b.onclick = function(){ location.reload(); };
    inner.appendChild(t); inner.appendChild(p); inner.appendChild(pre); inner.appendChild(b); box.appendChild(inner);
    document.body.appendChild(box);
    // a slow first load (many files on a slow connection) is not a failure: take the screen away once the app draws
    var iv = setInterval(function(){ if(window.M && window.M.curTab){ clearInterval(iv); if(box.parentNode) box.parentNode.removeChild(box); } }, 500);
    try{ window.Android && window.Android.ready && window.Android.ready(); }catch(e){}
  }catch(e){}
}, 9000);
})();
