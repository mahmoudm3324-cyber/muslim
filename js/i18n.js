/* ===== Interface languages =====
   The app is written in Arabic. For another language a dictionary (lang/<id>.json, Arabic → translation) is loaded once and a
   single observer rewrites interface text as it appears. Quran, adhkar and other recited texts are never touched.
   Numbers are lifted out before the lookup ("اليوم 5 من رمضان" → key "اليوم {0} من رمضان") and put back afterwards. */
(function(){
const M = window.M;
M.LANGS = [['ar', 'العربية', 'Arabic'], ['en', 'English', 'English'], ['fr', 'Français', 'French'], ['tr', 'Türkçe', 'Turkish'], ['de', 'Deutsch', 'German'], ['es', 'Español', 'Spanish']];
/* the user's choice in the app, else the app language set in the phone's settings (iPhone: window.__iosLang; Android 13+: Android.getAppLang), else Arabic */
const sysLang = window.__iosLang || (()=>{ try{ return window.Android && Android.getAppLang ? Android.getAppLang() : ''; }catch(e){ return ''; } })();
const lang = M.lang = (M.LANGS.some(l=>l[0] === M.cfg.lang) ? M.cfg.lang : M.LANGS.some(l=>l[0] === sysLang) ? sysLang : 'ar');
M.setLang = function(id){ if(id === M.lang) return; M.save('lang', id); try{ M.syncNative && M.syncNative(true); }catch(e){} setTimeout(()=>location.reload(), 120); };
if(lang === 'ar') return;

const root = document.documentElement; root.lang = lang; root.dir = 'ltr'; root.dataset.lang = lang;
/* Latin digits with a Latin-script interface. The user's own choice for Arabic is kept: it is put back whenever the settings are stored. */
{ const mine = M.cfg.digits; M.cfg.digits = 'latin'; const set = M.store.set.bind(M.store);
  M.store.set = function(k, v){ if(k === 'settings' && v && typeof v === 'object') v = Object.assign({}, v, {digits:mine}); return set(k, v); }; }
/* arrows follow the reading direction: "back" points to the start edge, "forward" to the end edge */
{ const SWAP = {back:'fwd', fwd:'back', next:'prev', prev:'next'};
  const wrap = ()=>{ const old = M.icon; if(old.__ltr) return; M.icon = function(name, cls){ return SWAP[name] ? old(SWAP[name], (cls ? cls+' ' : '')+'dirx') : old(name, cls); }; M.icon.__ltr = true; };
  wrap(); document.addEventListener('DOMContentLoaded', wrap); M.i18nIcons = wrap; }
const AR = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/, AR_NOT_HON = /[\u0621-\u064A\u066E-\u06D3\uFB50-\uFDF9\uFDFB-\uFDFF\uFE70-\uFEFF]/; // AR: anything Arabic incl. digits; AR_NOT_HON: Arabic letters (the honorific sign excepted)
const SKIP = '.qfont,.qcf,.qpage,.ayah,.dua-t,.pg-text,.nm-name,.nm-big,.name-big,.ram-tipt,.gd-hadith,.kd-dht,.shr-canvas,.mushaf,script,style,[data-noi18n]';
const NUM = /[0-9٠-٩]+(?:[:.,٫\/][0-9٠-٩]+)*/g, lat = s=>s.replace(/[٠-٩]/g, c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c));
const PREFIX = {en:'Surah', fr:'Sourate', tr:'Sure', de:'Sure', es:'Sura'}[lang];
const COMPASS = (c=>({'ش':c[0], 'ج':c[1], 'ق':c[2], 'غ':c[3]}))({en:'NSEW', fr:'NSEO', tr:'KGDB', de:'NSOW', es:'NSEO'}[lang]);
let D = null, SUR = null; const cache = new Map();

function one(src){                                        // one phrase: exact dictionary entry after lifting the numbers out
  const nums = []; const key = src.replace(NUM, m=>{ nums.push(lat(m)); return '{'+(nums.length - 1)+'}'; });
  const t = D[key]; if(t != null) return t.replace(/\{(\d+)\}/g, (_, i)=>nums[+i] != null ? nums[+i] : '');
  if(!AR_NOT_HON.test(src)) return lat(src);
  const m = /^سورة (.+)$/.exec(src); if(m && SUR && SUR[m[1]]) return PREFIX+' '+SUR[m[1]];
  if(SUR && SUR[src]) return SUR[src];
  return null;
}
function words(src){                                      // longest known word-groups, left to right; fails if any Arabic is left over
  const w = src.split(' '); let out = [], i = 0;
  while(i < w.length){
    let hit = null, n = Math.min(9, w.length - i);
    for(; n >= 1; n--){ const part = w.slice(i, i + n).join(' '); const t = one(part); if(t != null){ hit = t; break; } }
    if(hit == null){ // punctuation glued to a word: try without it
      const mm = /^([«"(\[]*)(.*?)([»".،,:؛!؟?)\]]*)$/.exec(w[i]); const t = mm && mm[2] && (mm[1] || mm[3]) ? one(mm[2]) : null;
      if(t == null) return null; hit = mm[1]+t+mm[3].replace(/،/g, ',').replace(/؛/g, ';').replace(/؟/g, '?'); n = 1;
    }
    out.push(hit); i += n;
  }
  return out.join(' ');
}
function tr(text){
  if(text.length > 480) return null;
  const hit = cache.get(text); if(hit !== undefined) return hit;
  let res = null;
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text), core = m[2].replace(/\s+/g, ' ');
  if(core && core.length <= 460 && AR.test(core)){
    let t = one(core);
    if(t == null){                                        // "A • B — C": translate the parts between separators
      const parts = core.split(/(\s*[•—–|\n]\s*|\s*[:،]\s+|\s+[()]\s*|\s*\/\s*)/); let ok = parts.length > 1;
      if(ok){ const out = parts.map((p, i)=>{ if(i % 2) return p.replace('،', ','); if(!p) return p; if(!AR_NOT_HON.test(p)) return lat(p); const x = one(p) || words(p); if(x == null) ok = false; return x; }); if(ok) t = out.join(''); }
    }
    if(t == null) t = words(core);
    if(t != null && !AR_NOT_HON.test(t)) res = m[1]+t+m[3];
  }
  if(cache.size > 2500) cache.clear();
  cache.set(text, res); return res;
}
M.tr = s=>(D && tr(String(s))) || s;

const done = new WeakMap(), ATTRS = ['aria-label', 'placeholder', 'title'];
function textNode(n){
  const v = n.nodeValue; if(!v || done.get(n) === v || !AR.test(v)) return;
  const pe = n.parentElement; if(!pe || pe.closest(SKIP)) return;
  if(v.length <= 3 && pe.namespaceURI === 'http://www.w3.org/2000/svg'){ const c = COMPASS[v.trim()]; if(c){ done.set(n, c); n.nodeValue = c; return; } }   // compass points, not weekday initials
  const t = tr(v); if(t != null && t !== v){ done.set(n, t); n.nodeValue = t; if(pe.childNodes.length === 1 && !pe.hasAttribute('dir') && pe.closest('.reader')) pe.setAttribute('dir', 'ltr'); } else { done.set(n, v); if(AR_NOT_HON.test(v) && pe.childNodes.length === 1 && !pe.hasAttribute('dir')) pe.setAttribute('dir', 'auto'); }
}
function element(e){
  for(const a of ATTRS){ const v = e.getAttribute && e.getAttribute(a); if(v && AR.test(v) && !e.closest(SKIP)){ const t = tr(v); if(t != null && t !== v) e.setAttribute(a, t); } }
}
function walk(node){
  if(node.nodeType === 3) return textNode(node);
  if(node.nodeType !== 1 || node.matches(SKIP)) return;
  element(node);
  const tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {acceptNode:n=>n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
  let n; while((n = tw.nextNode())){ if(n.nodeType === 3) textNode(n); else element(n); }
}
let queue = [], scheduled = false;
const flush = ()=>{ scheduled = false; const q = queue; queue = []; for(const n of q) if(n.isConnected) walk(n); };
function start(){
  walk(document.body);
  new MutationObserver(list=>{
    for(const m of list){ if(m.type === 'characterData') queue.push(m.target); else if(m.type === 'attributes') queue.push(m.target); else m.addedNodes.forEach(n=>queue.push(n)); }
    if(!scheduled){ scheduled = true; Promise.resolve().then(flush); }   // same task, before the next paint: no flash of untranslated text
  }).observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRS});
  if(document.title && AR.test(document.title)){ const t = tr(document.title); if(t) document.title = t; }
}
M.i18nReady = fetch('lang/'+lang+'.json').then(r=>{ if(!r.ok) throw 0; return r.json(); }).then(d=>{
  D = d;
  // surah names: the transliteration that ships with the Quran index
  const fill = ()=>{ try{ if(M.Q && M.Q.surahs){ SUR = {}; M.Q.surahs.forEach(s=>{ if(s.ar && s.tr) SUR[s.ar] = s.tr; }); cache.clear(); walk(document.body); return true; } }catch(e){} return false; };
  if(!fill()){ let n = 0; const iv = setInterval(()=>{ if(fill() || ++n > 40) clearInterval(iv); }, 500); }
  if(document.body) start(); else document.addEventListener('DOMContentLoaded', start);
}).catch(()=>{ root.dir = 'rtl'; root.lang = 'ar'; delete root.dataset.lang; });   // dictionary missing: stay in Arabic rather than half-translated
})();
