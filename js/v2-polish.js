/* ===== Polish: clearer section icons, «related sections» under each screen, and the hero header used by the redesigned screens ===== */
(function(){
'use strict';
const M = window.M, h = M.h;

/* one icon per idea: sections that shared a glyph get their own */
const ICON = {hifz:'repeat', mushaf_editions:'layers', prophets:'s:lantern', sunnah:'scroll', sleep_timer:'s:clock', dst:'s:sun', mosques:'pin',
  adhkar2_hisn:'s:shield', yusr:'sparkle', loved:'s:names', friday:'s:skyline', tasmee:'mic', suhoor:'s:crescent', iftar:'s:lantern', fast_white:'s:moon'};
const fix = ()=>{ (M.SECTIONS || []).forEach(s=>{ if(ICON[s[0]]) s[2] = ICON[s[0]]; }); };
fix(); setTimeout(fix, 0); document.addEventListener('DOMContentLoaded', fix);

/* the search section lives in the More screen's own search box */
M.SECTION_INNER = M.SECTION_INNER || {}; M.SECTION_INNER.search = 'more';

/* sections that belong together: shown as a strip at the end of each screen */
const REL = {
  tracker:['plog', 'qada', 'khatma', 'tasbih', 'stats'], plog:['tracker', 'qada', 'prayer'], qada:['tracker', 'plog', 'qada_ram'],
  khatma:['quran', 'stats', 'hifz', 'tasmee', 'tracker'], hifz:['tasmee', 'qplayer', 'khatma', 'tajweed'], tasmee:['hifz', 'qplayer', 'tajweed', 'khatma'],
  qplayer:['downloads', 'radio', 'sleep_timer', 'hifz', 'tasmee'], downloads:['qplayer', 'sounds', 'mushaf_editions', 'radio'], radio:['qplayer', 'sounds', 'downloads', 'sleep_timer'],
  tv:['radio', 'qplayer'], qibla:['prayer', 'mosques', 'calendar'], mosques:['qibla', 'prayer', 'friday'], zakat2:['zakat', 'ramadan', 'calendar'], zakat:['zakat2', 'ramadan'],
  tasbih:['tasabih', 'morning', 'evening', 'tijan', 'tracker'], tasabih:['tasbih', 'tijan', 'morning'], sounds:['notifs', 'qplayer', 'radio', 'downloads'], notifs:['sounds', 'health', 'prayer'],
  calendar:['ramadan', 'tatawwu', 'hajj'], ramadan:['tatawwu', 'qada_ram', 'calendar', 'zakat2'], hajj:['calendar', 'qibla'], stats:['khatma', 'tracker', 'quran'],
  'settings-look':['navbar_cfg', 'cards', 'notifs'], cards:['look', 'random'], tajweed:['tasmee', 'hifz', 'qplayer'], names:['duas', 'tasbih'], duas:['quranduas', 'ruqya2', 'tasbih'], health:['notifs', 'sounds']
};
const secOf = id=>(M.SECTIONS || []).find(s=>s[0] === id);
function strip(viewId){
  const ids = (REL[viewId] || []).filter(id=>secOf(id) && id !== viewId);
  if(!ids.length) return null;
  return h('div.rel', {'data-noprint':''}, h('div.rel-h', 'أقسام مرتبطة'),
    h('div.rel-row', ...ids.map(id=>{ const s = secOf(id); return h('button.rel-it', {onclick:()=>M.sectionOpen(id)}, h('span.rel-ic', {html:M.icon(s[2])}), h('span', s[1])); })));
}
const open0 = M.openView;
M.openView = function(o){
  const v = open0.apply(this, arguments);
  try{
    const id = o && o.id; if(!id || !REL[id] || !v || !v.body) return v;
    const add = ()=>{ if(!v.body.isConnected) return; let r = v.body.querySelector(':scope > .rel'); if(!r){ r = strip(id); if(!r) return; } if(v.body.lastElementChild !== r) v.body.appendChild(r); };
    setTimeout(add, 0); setTimeout(add, 600);
    // screens that redraw their body keep the strip last
    const mo = new MutationObserver(()=>{ const r = v.body.querySelector(':scope > .rel'); if(!r || v.body.lastElementChild !== r){ mo.disconnect(); add(); mo.observe(v.body, {childList:true}); } });
    mo.observe(v.body, {childList:true});
  }catch(e){}
  return v;
};

/* a screen's hero header: icon, title, line, and up to three figures */
M.hero = function(o){
  return h('div.hero2'+(o.tone ? '.'+o.tone : ''), o.onclick ? {onclick:o.onclick, role:'button'} : {},
    h('div.hero2-top', o.icon ? h('span.hero2-ic', {html:M.icon(o.icon)}) : null, h('div.grow', o.kicker ? h('div.hero2-k', o.kicker) : null, h('div.hero2-t.title-font', o.title), o.sub ? h('div.hero2-s', o.sub) : null), o.side || null),
    o.stats && o.stats.length ? h('div.hero2-st', ...o.stats.map(([v, l])=>h('div', h('b.num', v), h('span', l)))) : null,
    o.foot || null);
};
})();
