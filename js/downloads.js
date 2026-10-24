/* ===== Offline downloads: recitations (kept by the Android shell), tafsir books (IndexedDB), mushaf pages; translations ship with the app ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const p3 = n=>String(n).padStart(3, '0');
const native = ()=>!!(window.Android && window.Android.downloadFiles);
const dlAudio = ()=>M.store.get('dlAudio', {}) || {};
const mb = b=>{ const v = b / 1048576; return v >= 1024 ? M.n((v / 1024).toFixed(1))+' ج.ب' : M.n(Math.round(v))+' م.ب'; };

/* a recitation plays from the device when its surah was downloaded */
const remoteURL = M.audioURL;
M.audioURL = function(s, a, rec){
  rec = rec || M.cfg.reciter; if(!/^[\w-]+$/.test(rec)) rec = M.RECITERS[0][0];
  // one-file-per-surah reciters (v2-reciters.js) pick their own downloaded file and verse slice
  if(M.isSegReciter && M.isSegReciter(rec)) return remoteURL(s, a, rec);
  try{ if(native() && (dlAudio()[rec] || {})[s]) return '/dl/audio/'+rec+'/'+p3(s)+p3(a)+'.mp3'; }catch(e){}
  return remoteURL(s, a, rec);
};
/* tafsir: a downloaded book answers before the network. Source: spa5k/tafsir_api (one JSON per surah: [{surah, ayah, text}], one per ayah: {text}).
   Books keep their data as {v:2, u:[distinct texts], i:[text index per ayah, -1 = the source has no entry]} (Baghawi/Qurtubi repeat one long text for a whole passage, so this is 2-3x smaller than a text per ayah). The older plain-array format is still read. */
const TAF_REPO = 'spa5k/tafsir_api', TAF_PATH = '/tafsir/';
const tafUrls = (slug, tail)=>['https://cdn.jsdelivr.net/gh/'+TAF_REPO+'@main'+TAF_PATH+slug+'/'+tail, 'https://raw.githubusercontent.com/'+TAF_REPO+'/main'+TAF_PATH+slug+'/'+tail, 'https://fastly.jsdelivr.net/gh/'+TAF_REPO+'@main'+TAF_PATH+slug+'/'+tail];
/* try each mirror in turn (8 s to first byte); a 404 on every mirror = "this file does not exist", anything else = network trouble */
async function fetchJSON(urls, tries){
  let last = null, all404 = true;
  for(let t = 0; t < (tries || 1); t++){
    for(const u of urls){
      const ac = typeof AbortController === 'function' ? new AbortController() : null, tm = ac ? setTimeout(()=>ac.abort(), 20000) : 0;
      try{ const r = await fetch(u, ac ? {signal:ac.signal} : undefined); clearTimeout(tm);
        if(r.ok){ const bytes = +r.headers.get('content-length') || 0; return {json:await r.json(), bytes}; }
        if(r.status !== 404) all404 = false; last = 'http '+r.status;
      }catch(e){ clearTimeout(tm); all404 = false; last = String(e && e.message || e); }
    }
    if(all404) break;
    await new Promise(r=>setTimeout(r, 600 * (t + 1)));
  }
  const err = new Error(last || 'failed'); err.notFound = all404; throw err;
}
function packSurah(rows, n){
  const u = [], idx = new Map(), i = new Array(n).fill(-1);
  rows.forEach(x=>{ const a = (+x.ayah || +x.ayah_number || 0) - 1, t = String(x.text == null ? '' : x.text).trim(); if(a < 0 || a >= n || !t) return; let k = idx.get(t); if(k == null){ k = u.length; u.push(t); idx.set(t, k); } i[a] = k; });
  return {v:2, u, i};
}
function readStored(st, a){ // -> string | undefined (undefined = not stored)
  if(!st) return undefined;
  if(Array.isArray(st)) return st[a - 1] != null ? st[a - 1] : undefined;
  if(st.v === 2){ if(a < 1 || a > st.i.length) return undefined; const k = st.i[a - 1]; return k >= 0 ? st.u[k] : ''; }
  return undefined;
}
M.getTafsir = async function(slug, s, a){
  try{ const t = readStored(await M.kv.get('tafs:'+slug+':'+s), a); if(t != null) return {text:t, cached:true}; }catch(e){}
  const key = 'taf:'+slug+':'+s+':'+a;
  try{ const c = await M.kv.get(key); if(c) return {text:c, cached:true}; }catch(e){}
  let r; try{ r = await fetchJSON(tafUrls(slug, s+'/'+a+'.json'), 2); }catch(e){ if(e.notFound) return {text:''}; throw e; }
  const text = String(r.json && r.json.text || '').trim(); if(text) M.kv.set(key, text);
  return {text};
};

const jobs = {}; // id -> callback(done, total, failed, finished)
window.onDl = function(id, d, t, bad, fin){ const f = jobs[id]; if(f) f(d, t, bad, fin); if(fin) delete jobs[id]; };

/* reciters recorded one file per surah (v2-reciters.js, e.g. Islam Sobhi): the surah's single file from its own server */
function surahFiles(rec, s){ if(M.isSegReciter && M.isSegReciter(rec)){ const u = M.segFileURL(s, rec); return u ? [[u, 'audio/'+rec+'/'+p3(s)+'.mp3']] : []; }
  const n = M.Q.surahs[s - 1].n, out = []; for(let a = 1; a <= n; a++) out.push(['https://everyayah.com/data/'+rec+'/'+p3(s)+p3(a)+'.mp3', 'audio/'+rec+'/'+p3(s)+p3(a)+'.mp3']); if(s !== 1 && s !== 9) out.push(['https://everyayah.com/data/'+rec+'/001001.mp3', 'audio/'+rec+'/001001.mp3']); return out; }
function markAudio(rec, s, on){ const d = dlAudio(); d[rec] = d[rec] || {}; if(on) d[rec][s] = 1; else delete d[rec][s]; M.store.set('dlAudio', d); }

M.dlHas = (rec, s)=>{ try{ return native() && !!(dlAudio()[rec] || {})[s]; }catch(e){ return false; } };
M.downloadSurah = async function(rec, s, onProg){
  if(M.isSegReciter && M.isSegReciter(rec) && M.recReady) await M.recReady(rec);   // the surah file's address comes with the timings
  return new Promise(res=>{
    if(!native()) return res(false);
    if(!surahFiles(rec, s).length) return res(false);
    const id = 'a_'+s+'_'+Date.now().toString(36), files = surahFiles(rec, s);
    jobs[id] = (d, t, bad, fin)=>{ onProg && onProg(d, t, bad); if(fin){ const ok = bad === 0 && d >= t; if(ok) markAudio(rec, s, true); res(ok); } };
    try{ window.Android.downloadFiles(id, JSON.stringify(files)); }catch(e){ delete jobs[id]; res(false); }
    M._dlCur = id;
  });
};

/* approximate sizes (MB) measured on 2026-10: [download from the network, stored on the device]. Used only for the warning before a download. */
const TAF_MB = {'ar-tafsir-muyassar':[3, 2], 'ar-tafseer-al-saddi':[6, 6], 'ar-tafsir-al-jalalayn':[3, 3], 'ar-tafsir-al-baghawi':[39, 15], 'ar-tafsir-ibn-kathir':[90, 25], 'ar-tafseer-al-qurtubi':[78, 32], 'ar-tafsir-al-tabari':[61, 37]};
const tafNA = ()=>M.store.get('dlTafsirNA', {}) || {};          // slug -> reason: the source has no data for this book (online-only)
const tafPart = ()=>M.store.get('dlTafsirPart', {}) || {};      // slug -> surahs already stored (progress that survives a failed run)
let tafStop = false;
async function downloadTafsir(slug, onProg){
  tafStop = false;
  let done = 0, bad = 0, firstErr = null, bytes = 0; const list = []; for(let s = 1; s <= 114; s++) list.push(s);
  // preflight: surah 1 must exist on at least one mirror, otherwise the book is "not available for download"
  if(!(await M.kv.get('tafs:'+slug+':1'))){
    try{ await fetchJSON(tafUrls(slug, '1.json'), 2); }catch(e){ if(e.notFound){ const na = tafNA(); na[slug] = 'لا توجد بيانات لهذا الكتاب في المصدر'; M.store.set('dlTafsirNA', na); return {ok:false, na:true, bad:114}; } return {ok:false, bad:114, err:'net'}; }
  }
  const work = async()=>{ while(list.length && !tafStop){ const s = list.shift();
    try{
      if(!(await M.kv.get('tafs:'+slug+':'+s))){
        const r = await fetchJSON(tafUrls(slug, s+'.json'), 3), j = r.json, n = M.Q.surahs[s - 1].n;
        const rows = Array.isArray(j) ? j : (j && (j.ayahs || j.verses || j.data)) || [];
        if(!Array.isArray(rows) || !rows.length) throw new Error('shape');
        bytes += r.bytes;
        if(!(await M.kv.set('tafs:'+slug+':'+s, packSurah(rows, n)))) throw new Error('storage');
      }
    }catch(e){ bad++; firstErr = firstErr || e; }
    done++; onProg && onProg(done, 114, bad, bytes); } };
  await Promise.all([work(), work(), work()]);
  let have = 0; for(let s = 1; s <= 114; s++) if(await M.kv.get('tafs:'+slug+':'+s)) have++;
  const pt = tafPart(); if(have && have < 114) pt[slug] = have; else delete pt[slug]; M.store.set('dlTafsirPart', pt);
  const ok = have === 114;
  if(ok){ const d = M.store.get('dlTafsir', {}) || {}; d[slug] = 1; M.store.set('dlTafsir', d); }
  return {ok, bad: 114 - have, err: firstErr && (firstErr.message === 'storage' ? 'storage' : 'net'), stopped:tafStop};
}
async function deleteTafsir(slug){ for(let s = 1; s <= 114; s++){ await M.kv.del('tafs:'+slug+':'+s); } const d = M.store.get('dlTafsir', {}) || {}; delete d[slug]; M.store.set('dlTafsir', d); const pt = tafPart(); delete pt[slug]; M.store.set('dlTafsirPart', pt); }

M.openDownloads = function(tab){
  let cur = tab || 'audio', rec = M.isSegReciter && M.isSegReciter(M.cfg.reciter) ? M.RECITERS[0][0] : M.cfg.reciter, busy = false, stop = false;
  const body = h('div.dlv');
  const prog = (lbl)=>{ const i = h('i'), t = h('div.small.muted', lbl || ''); return {el:h('div.dl-prog', t, h('div.dl-bar', i)), set:(d, tot, txt)=>{ i.style.width = Math.round(d / Math.max(1, tot) * 100)+'%'; if(txt != null) t.textContent = txt; }}; };
  function audio(){
    const have = dlAudio()[rec] || {}, n = Object.keys(have).length;
    const recName = (M.RECITERS.find(r=>r[0] === rec) || [])[1] || rec;
    const top = h('div.card.pad.col-flex',
      h('div.small.muted', 'القارئ'),
      h('select.field', {onchange:e=>{ if(busy){ e.target.value = rec; return M.toast('انتظر انتهاء التنزيل الحالي'); } rec = e.target.value; draw(); }}, ...M.RECITERS.filter(([id])=>!(M.isSegReciter && M.isSegReciter(id))).map(([id, nm])=>h('option', {value:id, selected:id === rec}, nm))),   // reciters recorded by surah are not offered per verse
      h('div.small', 'المحفوظ على الجهاز: '+M.n(n)+' من '+M.n(114)+' سورة'+(native() ? ' • '+mb(+window.Android.dlSize('audio/'+rec) || 0) : '')));
    if(M.openQuranPlayer) top.append(h('button.btn.tonal.sm', {onclick:()=>M.openQuranPlayer()}, M.ic('play'), 'فتح مشغّل القرآن'));
    if(!native()){ body.append(top, h('div.card.pad.empty', 'تنزيل التلاوات للعمل دون اتصال متاح في تطبيق الأندرويد. في المتصفح تُشغَّل التلاوة من الإنترنت.')); return; }
    const pg = prog(''); pg.el.classList.add('hide');
    const allBtn = h('button.btn.block', {onclick:async()=>{
      if(busy){ stop = true; try{ window.Android.cancelDownload(M._dlCur); }catch(e){} return; }
      if(!(await M.confirm('تنزيل المصحف كاملًا بصوت «'+recName+'»؟ الحجم كبير (قد يتجاوز ٥٠٠ م.ب إلى ١ ج.ب) ويُفضَّل الاتصال بشبكة واي فاي.'))) return;
      busy = true; stop = false; allBtn.textContent = 'إيقاف التنزيل'; pg.el.classList.remove('hide');
      for(let s = 1; s <= 114 && !stop; s++){
        if((dlAudio()[rec] || {})[s]) continue;
        const ok = await M.downloadSurah(rec, s, (d, t)=>pg.set(s - 1 + d / t, 114, 'سورة '+M.sname(s)+' — '+M.n(s)+' من '+M.n(114)));
        if(!ok && !stop){ M.toast('تعذّر تنزيل سورة '+M.sname(s)+' — تحقق من الاتصال'); break; }
      }
      busy = false; draw();
    }}, M.ic('download'), n >= 114 ? 'إعادة التحقق من الكل' : 'تنزيل المصحف كاملًا لهذا القارئ');
    const delAll = n ? h('button.btn.ghost.sm', {onclick:async()=>{ if(busy) return; if(!(await M.confirm('حذف كل تلاوات «'+recName+'» المحفوظة؟'))) return; try{ window.Android.dlDelete('audio/'+rec); }catch(e){} const d = dlAudio(); delete d[rec]; M.store.set('dlAudio', d); draw(); }}, M.ic('trash'), 'حذف تلاوات هذا القارئ') : null;
    const list = h('div.card.list');
    M.Q.surahs.forEach((su, i)=>{
      const s = i + 1, on = !!have[s];
      const st = h('span.small.muted', on ? 'محفوظة' : M.cnt(su.n, 'آية'));
      const btn = h('button.icon-btn'+(on ? '.on' : ''), {'aria-label':on ? 'حذف' : 'تنزيل', onclick:async e=>{
        e.stopPropagation();
        if(busy) return M.toast('انتظر انتهاء التنزيل الحالي');
        if((dlAudio()[rec] || {})[s]){ surahFiles(rec, s).forEach(f=>{ if(!f[1].endsWith('/001001.mp3')) try{ window.Android.dlDelete(f[1]); }catch(e){} }); markAudio(rec, s, false); draw(); return; }
        busy = true; btn.disabled = true;
        const ok = await M.downloadSurah(rec, s, (d, t)=>{ st.textContent = M.n(Math.round(d / t * 100))+'٪'; });
        busy = false; if(!ok) M.toast('تعذّر التنزيل — تحقق من الاتصال'); draw();
      }}, M.ic(on ? 'trash' : 'download'));
      const pl = h('button.icon-btn.tonal', {'aria-label':'تشغيل السورة', onclick:e=>{
        e.stopPropagation();
        const P = M.player;
        if(P.s === s && P.playing && M.cfg.reciter === rec){ try{ P.toggle ? P.toggle() : P.a.pause(); }catch(x){} return; }
        if(M.cfg.reciter !== rec){ M.save('reciter', rec); M.toast('القارئ: '+recName); }
        try{ const have = dlAudio()[rec] || {}; P.queue = Object.keys(have).map(Number).sort((x, y)=>x - y); if(!P.queue.includes(s)) P.queue.push(s); P.play(s, 1); if(M.openQuranPlayer && !document.getElementById('view-qplayer')) M.openQuranPlayer(); }catch(x){ M.toast('تعذّر التشغيل'); }
      }}, M.ic('play'));
      list.append(h('div.item', h('span.dl-n.num', M.n(s)), h('div.grow', h('div.t', 'سورة '+su.ar), st), pl, btn));
    });
    body.append(...[top, allBtn, pg.el, delAll, h('div.section-h', 'السور'), list].filter(Boolean));
  }
  function tafsir(){
    const have = M.store.get('dlTafsir', {}) || {}, na = tafNA(), part = tafPart();
    const list = h('div.card.list');
    M.TAFSIRS.forEach(([slug, name])=>{
      const on = !!have[slug], gone = !on && !!na[slug], p = part[slug] || 0, sz = TAF_MB[slug];
      const st = h('div.s', on ? 'محفوظ — يعمل دون اتصال' : gone ? 'غير متاح للتنزيل — يعمل عبر الإنترنت فقط' : p ? 'تنزيل ناقص: '+M.n(p)+' من '+M.n(114)+' سورة — اضغط لإكماله' : 'غير محفوظ'+(sz && sz[1] ? ' • الحجم نحو '+M.n(sz[1])+' م.ب' : ''));
      const bar = h('i'), barBox = h('div.dl-bar.hide', bar); const stop = h('button.btn.ghost.sm.hide', {onclick:()=>{ tafStop = true; stop.disabled = true; }}, 'إيقاف');
      const btn = gone ? h('button.icon-btn', {'aria-label':'إعادة التحقق من توفر الكتاب', onclick:()=>{ const n = tafNA(); delete n[slug]; M.store.set('dlTafsirNA', n); draw(); }}, M.ic('refresh'))
        : h('button.icon-btn'+(on ? '.on' : ''), {'aria-label':on ? 'حذف' : 'تنزيل', onclick:async()=>{
        if(busy) return M.toast('انتظر انتهاء التنزيل الحالي');
        if(on){ if(await M.confirm('حذف «'+name+'» من الجهاز؟')){ await deleteTafsir(slug); draw(); } return; }
        if(!navigator.onLine) return M.toast('لا يوجد اتصال بالإنترنت');
        if(sz && sz[0] >= 20 && !p && !(await M.confirm('«'+name+'» كتاب كبير: يُنزَّل نحو '+M.n(sz[0])+' م.ب ويشغل نحو '+M.n(sz[1])+' م.ب على الجهاز. يُفضَّل الاتصال بشبكة واي فاي. المتابعة؟', 'تنزيل'))) return;
        busy = true; btn.disabled = true; barBox.classList.remove('hide'); stop.classList.remove('hide');
        const r = await downloadTafsir(slug, (d, t, bad, by)=>{ bar.style.width = Math.round(d / t * 100)+'%'; st.textContent = 'جارٍ التنزيل '+M.n(Math.round(d / t * 100))+'٪'+(by ? ' • '+mb(by) : '')+(bad ? ' • تعذّر '+M.n(bad)+' (يُعاد لاحقًا)' : ''); });
        busy = false;
        M.toast(r.ok ? 'تم حفظ «'+name+'»' : r.na ? '«'+name+'» غير متاح للتنزيل — يعمل عبر الإنترنت فقط' : r.stopped ? 'أُوقف التنزيل — يمكنك إكماله لاحقًا من حيث توقف' : r.err === 'storage' ? 'لا توجد مساحة كافية على الجهاز' : 'تعذّر إكمال التنزيل — اضغط مجددًا لإكمال الناقص');
        draw();
      }}, M.ic(on ? 'trash' : 'download'));
      list.append(h('div.item.dl-taf', h('span.lead', {html:M.icon('s:tafsir')}), h('div.grow', h('div.t', name), st, barBox), stop, btn));
    });
    body.append(h('div.small.muted', {style:'margin:0 4px 10px;line-height:1.9'}, 'يُحفظ كتاب التفسير كاملًا على جهازك (١١٤ سورة) ليُعرض عند الضغط على أي آية دون إنترنت. الكتب المطوّلة كابن كثير والطبري والقرطبي حجمها أكبر وتحتاج وقتًا أطول. إن انقطع التنزيل فاضغط عليه مجددًا ليكمل السور الناقصة فقط.'), list,
      h('div.tiny.muted', {style:'margin:8px 4px;line-height:1.8'}, 'بعض الآيات لا تحتوي تفسيرًا في كتابي السعدي والجلالين لأن المؤلف فسّرها مع آية مجاورة؛ تظهر عندها رسالة «لا يوجد تفسير لهذه الآية».'));
  }
  function other(){
    const box = h('div.card.pad.col-flex'); const lab = h('div.small.muted', '…'), bar = h('div.dl-bar', h('i'));
    const btn = h('button.btn.tonal.sm', {onclick:async()=>{ btn.disabled = true; const r = await M.qcf.downloadAll((d, t, bad)=>{ bar.firstChild.style.width = Math.round(d / t * 100)+'%'; lab.textContent = 'تحميل '+M.n(d)+' / '+M.n(t)+(bad ? ' • تعذّر '+M.n(bad) : ''); }); M.toast(r.bad ? 'اكتمل مع بعض الإخفاقات — أعد المحاولة' : 'تم حفظ صفحات المصحف'); draw(); }}, M.ic('download'), 'تنزيل صفحات المصحف');
    M.qcf.cachedCount().then(n=>{ lab.textContent = n >= 48 ? 'صفحات المصحف كاملة محفوظة ✓' : 'محفوظ '+M.n(n)+' من '+M.n(48)+' ملفًا (نحو ٣٦ م.ب)'; bar.firstChild.style.width = Math.min(100, Math.round(n / 48 * 100))+'%'; if(n >= 48) btn.lastChild.textContent = 'إعادة التحقق'; });
    box.append(h('div.bold', 'صفحات مصحف المدينة'), lab, bar, btn);
    const tr = h('div.card.list', ...M.TRANSLATIONS.filter(x=>x[0] !== 'off').map(([id, nm])=>h('div.item', h('span.lead', {html:M.icon('globe')}), h('div.grow', h('div.t', nm), h('div.s', 'مضمّنة في التطبيق — تعمل دون اتصال')), M.ic('check'))));
    body.append(box, h('div.section-h', 'الترجمات'), tr,
      h('div.section-h', 'يعمل دون اتصال دائمًا'), h('div.card.pad.small', {style:'line-height:2'}, 'نص القرآن الكريم، الأذكار والأدعية، مواقيت الصلاة والقبلة، التقويم الهجري، السبحة، متابعة العبادات، المسابقات الدينية، وأصوات الأذان المرفقة.'));
  }
  function draw(){
    const recN = Object.values(dlAudio()).reduce((a, x)=>a + Object.keys(x || {}).length, 0), tafN = Object.keys(M.store.get('dlTafsir', {}) || {}).length;
    body.replaceChildren(M.hero ? M.hero({icon:'download', kicker:'للاستماع والقراءة دون إنترنت', title:'التنزيلات', sub:native() ? 'كل ما تنزّله يبقى على جهازك ويعمل دون اتصال' : 'التنزيل الكامل متاح في تطبيق الأندرويد',
        stats:[[M.n(recN), 'سورة مسموعة'], [M.n(tafN), 'تفسير محفوظ'], [M.n(Object.keys(dlAudio()).length), 'قارئ']]}) : null,
      M.seg([['audio', 'التلاوات'], ['tafsir', 'التفاسير'], ['other', 'المصحف والترجمات']], cur, v=>{ if(busy) return M.toast('انتظر انتهاء التنزيل الحالي'); cur = v; draw(); }), h('div', {style:'height:12px'}));
    if(!M.Q || !M.Q.surahs){ body.append(h('div.empty', 'جارٍ التحميل…')); M.loadQuran().then(draw).catch(()=>M.toast('تعذّر التحميل')); return; }
    cur === 'audio' ? audio() : cur === 'tafsir' ? tafsir() : other();
  }
  M.openView({title:'التنزيلات', id:'downloads', build:b=>{ b.append(body); draw(); }});
};
})();
