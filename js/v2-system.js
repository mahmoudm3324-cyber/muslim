/* ===== system glue: deep links (shortcuts, Quick Settings tiles, widgets, notifications), low-memory hook ===== */
(function(){
'use strict';
const M = window.M;
const TABS = ['home', 'quran', 'prayer', 'adhkar', 'more'];

/* which adhkar fit the time of day: morning from fajr until dhuhr, evening from asr until midnight */
function adhkarNow(){
  try{
    const now = new Date(), t = M.prayerTimes(now);
    if(now >= t.fajr && now < t.dhuhr) return 'morning';
    if(now >= t.asr) return 'evening';
  }catch(e){}
  return 'adhkar';
}

function closeAll(){
  try{ (M.sheetStack || []).slice().reverse().forEach(s=>{ try{ s.close(); }catch(e){} }); }catch(e){}
  try{ M.views.slice().reverse().forEach(v=>{ try{ v.close(); }catch(e){} }); }catch(e){}
}

/* open one screen of the app by id; returns true when it knew the id */
M.openDeep = function(id){
  id = String(id || '').toLowerCase();
  if(!/^[a-z0-9_]{1,40}$/.test(id)) return false;
  if(!M.store.get('onboarded', 0)) return false;          // the welcome pages come first
  if(id === 'adhkar_now') id = adhkarNow();
  let m = /^surah_(\d{1,3})$/.exec(id);
  if(m){ const s = +m[1]; if(s >= 1 && s <= 114 && M.openReader){ closeAll(); M.openReader({sura:s, ayah:1}); return true; } return false; }
  if(TABS.includes(id)){ closeAll(); M.setTab(id); return true; }
  const known = (M.SECTIONS || []).some(s=>s[0] === id);
  if(!known) return false;
  closeAll();
  if(id === 'quran' || id === 'prayer'){ M.setTab(id); return true; }
  try{ M.sectionOpen(id); }catch(e){ console.error(e); return false; }
  return true;
};

/* notices at the top of the home screen: each provider returns an element or null */
const providers = [];
M.addHomeNotice = fn=>{ providers.push(fn); };
M.homeNotices = ()=>providers.map(fn=>{ try{ return fn(); }catch(e){ console.error(e); return null; } }).filter(Boolean).slice(0, 2);
/* a notice the user closed stays closed for `days` */
M.noticeSnoozed = (id, days)=>{ const t = (M.store.get('notice', {}) || {})[id]; return !!t && Date.now() - t < (days || 3) * 864e5; };
M.noticeSnooze = id=>{ const o = M.store.get('notice', {}) || {}; o[id] = Date.now(); M.store.set('notice', o); };

/* the system is short of memory: drop what can be rebuilt */
window.onLowMemory = function(level){
  try{ M.emit && M.emit('lowmemory', level); }catch(e){}
};
})();
