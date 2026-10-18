/* ===== Extra adhan recordings: listen online, download, then use like the bundled ones (prayer-time adhan, alarms, reminders) ===== */
(function(){
const M = window.M, h = M.h;
const PT = (file, name, dur)=>({key:'pt_'+file.toLowerCase().replace(/[^a-z0-9]+/g, '_'), name, dur, url:'https://praytimes.org/audio/sunni/'+file+'.mp3'});
/* every file was opened from an Egyptian connection on 2026-10-05; names as labelled by the source (praytimes.org) */
const CATALOG = [PT('Adhan-Makkah', 'أذان مكة المكرمة (تسجيل آخر)', 201), PT('Adhan-Madinah', 'أذان المدينة المنورة', 96), PT('Adhan-Alaqsa', 'أذان المسجد الأقصى', 225), PT('Adhan-Egypt', 'أذان مصر', 183), PT('Adhan-Halab', 'أذان حلب', 223),
  PT('Abdul-Basit', 'عبد الباسط عبد الصمد (تسجيل آخر)', 206), PT('Minshawi', 'المنشاوي', 235), PT('Naghshbandi', 'النقشبندي', 162), PT('Abdul-Ghaffar', 'عبد الغفار', 186), PT('Abdul-Hakam', 'عبد الحكم', 190),
  PT('Al-Hussaini', 'الحسيني', 196), PT('Bakir-Bash', 'باكير باش', 347), PT('Hafez', 'حافظ', 167), PT('Hafiz-Murad', 'حافظ مراد', 102), PT('Saber', 'صابر', 149), PT('Sharif-Doman', 'شريف دومان', 281), PT('Yusuf-Islam', 'يوسف إسلام', 99)];
const native = ()=>!!(window.Android && window.Android.downloadFiles);
const have = ()=>M.store.get('dlAdhans', {}) || {};
const idOf = c=>'dla_'+c.key, byId = id=>CATALOG.find(c=>idOf(c) === id);
M.ADHAN_DL = CATALOG;
/* downloaded recordings join the normal list of adhans, so every existing picker shows them */
const BASE = M.ADHANS.slice();
function syncList(){ const d = have(); M.ADHANS.length = 0; BASE.forEach(x=>M.ADHANS.push(x)); CATALOG.forEach(c=>{ if(d[c.key]) M.ADHANS.push([idOf(c), c.name]); }); }
syncList();
/* playback: local copy when downloaded (native file or, on the web, a stored blob); otherwise the bundled sounds as before */
const basePlay = M.playSound, baseStop = M.stopSound, A = new Audio(); A.preload = 'none'; (M._audios = M._audios || []).push(A); let cur = null, blobUrl = null;
const stopMine = ()=>{ if(cur){ A.pause(); cur = null; M.emit('sound', null); } if(blobUrl){ URL.revokeObjectURL(blobUrl); blobUrl = null; } };
A.addEventListener('ended', ()=>{ cur = null; M.emit('sound', null); });
async function playUrl(id, url){ if(M.cfg.audioMute){ M.toast('الملفات الصوتية مكتومة من الإعدادات'); return; } baseStop(); stopMine(); try{ if(M.player && M.player.a) M.player.a.pause(); }catch(e){}
  A.src = url; cur = id; M.emit('sound', id); try{ await A.play(); }catch(e){ if(cur === id){ cur = null; M.emit('sound', null); M.toast('تعذّر تشغيل الصوت — تحقق من الاتصال'); } } }
M.playSound = async function(id){
  const c = String(id).startsWith('dla_') ? byId(id) : null;
  if(!c){ stopMine(); return basePlay(id); }
  if(cur === id && !A.paused){ stopMine(); return; }
  if(!have()[c.key]) return playUrl(id, c.url);                         // not downloaded (any more): stream it
  if(native()) return playUrl(id, '/dl/adhan/'+c.key+'.mp3');
  try{ const bl = await M.kv.get('dla:'+c.key); if(bl){ stopMine(); blobUrl = URL.createObjectURL(bl); return playUrl(id, blobUrl); } }catch(e){}
  return playUrl(id, c.url);
};
M.stopSound = function(){ stopMine(); baseStop(); };
/* download / delete */
const jobs = {}, prevOnDl = window.onDl;
window.onDl = function(id, d, t, bad, fin){ const f = jobs[id]; if(f){ if(fin){ delete jobs[id]; f(bad === 0 && d >= t); } return; } prevOnDl && prevOnDl(id, d, t, bad, fin); };
function download(c){
  return new Promise(async res=>{
    const done = ok=>{ if(ok){ const d = have(); d[c.key] = 1; M.store.set('dlAdhans', d); syncList(); } res(ok); };
    if(native()){ const id = 'adh_'+c.key+'_'+Date.now().toString(36); jobs[id] = done; try{ window.Android.downloadFiles(id, JSON.stringify([[c.url, 'adhan/'+c.key+'.mp3']])); }catch(e){ delete jobs[id]; res(false); } setTimeout(()=>{ if(jobs[id]){ delete jobs[id]; res(false); } }, 90000); return; }
    try{ const r = await fetch(c.url); if(!r.ok) throw 0; const bl = await r.blob(); if(bl.size < 20000) throw 0; await M.kv.set('dla:'+c.key, bl); done(true); }catch(e){ res(false); }
  });
}
async function remove(c){
  try{ if(native()) window.Android.dlDelete('adhan/'+c.key+'.mp3'); else await M.kv.del('dla:'+c.key); }catch(e){}
  const d = have(); delete d[c.key]; M.store.set('dlAdhans', d); syncList();
  const id = idOf(c); if(M.cfg.adhan === id) M.save('adhan', 'ad_makkah'); if(M.cfg.alarmSnd === id) M.save('alarmSnd', 'ad_makkah');
  const nf = M.cfg.nf; if(nf && typeof nf === 'object'){ let ch = false; Object.keys(nf).forEach(k=>{ if(nf[k] && nf[k].snd === id){ nf[k].snd = 'auto'; ch = true; } }); if(ch) M.save('nf', nf); }
}
M.adhanDlApi = {CATALOG, have, idOf, download, remove};
const fmtD = s=>M.n(Math.floor(s / 60)+':'+String(s % 60).padStart(2, '0'));
M.openAdhanDl = function(onChange){
  const list = h('div.list.card'); let busy = null;
  const draw = ()=>{
    const d = have(), sel = M.cfg.adhan || 'ad_makkah';
    list.replaceChildren(...CATALOG.map(c=>{
      const id = idOf(c), got = !!d[c.key], on = sel === id;
      const play = h('button.icon-btn.tonal', {'aria-label':'استماع إلى '+c.name, onclick:()=>M.playSound(id)}, M.ic('play'));
      const act = busy === c.key ? h('span.chip.adl-busy', 'جارٍ التنزيل…')
        : !got ? h('button.chip', {onclick:async()=>{ if(busy) return; if(!navigator.onLine){ M.toast('لا يوجد اتصال بالإنترنت'); return; } busy = c.key; draw(); const ok = await download(c); busy = null; M.toast(ok ? 'تم تنزيل «'+c.name+'»' : 'تعذّر التنزيل — حاول مرة أخرى'); draw(); onChange && onChange(); }}, M.ic('download'), 'تنزيل')
        : h('span.row-flex.gap-s', h('button.chip'+(on ? '.on' : ''), {onclick:()=>{ M.save('adhan', id); M.toast('صار أذان الصلاة: '+c.name); draw(); onChange && onChange(); }}, on ? 'هو الأذان الآن' : 'اجعله الأذان'),
            h('button.icon-btn', {'aria-label':'حذف '+c.name, onclick:async()=>{ if(!(await M.confirm('حذف «'+c.name+'» من الجهاز؟', 'حذف'))) return; M.stopSound(); await remove(c); draw(); onChange && onChange(); }}, M.ic('trash')));
      return h('div.item.snd.adl', h('div.grow', h('div.t', c.name), h('div.s', fmtD(c.dur)+(got ? ' • على الجهاز' : ''))), play, act);
    }));
  };
  const view = M.openView({title:'تنزيل أصوات أذان', id:'adhandl', onClose:()=>M.stopSound(), build:b=>{
    b.append(h('div.small.muted', {style:'line-height:1.9;margin:0 4px 10px'}, 'استمع للتسجيل أولًا، ثم نزّله ليعمل دون إنترنت ويظهر مع أصوات الأذان في كل قوائم الاختيار (أذان الصلاة والمنبّه والتذكيرات).'), list,
      h('div.tiny.muted', {style:'margin:8px 4px;line-height:1.8'}, 'التسجيلات من موقع praytimes.org، وأسماؤها كما وردت فيه. حجم الملف نحو ٢٠٠ ك.ب.'));
    draw();
  }});
  return view;
};
})();
