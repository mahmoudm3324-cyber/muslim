/* ===== travel: notice when the phone is far from the saved city, offer to update the prayer times,
   and while away from home show the traveller's prayer in brief. Never asks for the location permission itself:
   it only looks when the app already has it. ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const R = Math.PI / 180;
const km = (a, b, c, d)=>{ const dl = (c - a) * R, dn = (d - b) * R, x = Math.sin(dl / 2) ** 2 + Math.cos(a * R) * Math.cos(c * R) * Math.sin(dn / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const MOVE = 25, TRAVEL = 80;      // km: a new city / travelling (most scholars put the qasr distance at about 80 km)
const S = ()=>M.store.get('travel', {}) || {};
const put = o=>M.store.set('travel', Object.assign(S(), o));

function home(){
  const s = S(); if(s.home) return s.home;
  const l = M.cfg.loc; if(!l) return null;
  const hm = {lat:l.lat, lng:l.lng, name:l.name}; put({home:hm}); return hm;
}
/* the first city ever saved is the home city; afterwards it changes only with «هذه مدينتي الآن» */
M.on && M.on('settings', k=>{ if(k === 'loc' && M.cfg.loc){ home(); put({cand:null}); } });

async function permitted(){
  try{
    if(window.Android && window.Android.healthStatus){ const N = JSON.parse(window.Android.healthStatus() || '{}'); return !!(N.locFine || N.locCoarse) && N.locOn !== false; }
    if(navigator.permissions && navigator.permissions.query){ const r = await navigator.permissions.query({name:'geolocation'}); return r.state === 'granted'; }
  }catch(e){}
  return false;
}
let busy = false;
async function check(force){
  if(busy || M.cfg.travelDetect === false || !M.cfg.loc || !navigator.geolocation) return;
  const s = S();
  if(!force && s.lastCheck && Date.now() - s.lastCheck < 3 * 3600e3) return;
  if(!(await permitted())) return;
  busy = true; put({lastCheck:Date.now()});
  try{
    const pos = await M.detectLocation();
    const l = M.cfg.loc, d = km(l.lat, l.lng, pos.lat, pos.lng);
    if(d < MOVE){ put({cand:null}); return; }
    const dis = S().dismiss;
    if(dis && km(dis.lat, dis.lng, pos.lat, pos.lng) < MOVE && Date.now() - dis.t < 24 * 3600e3) return;
    put({cand:{lat:pos.lat, lng:pos.lng, name:pos.name, tz:pos.tz, d:Math.round(d), t:Date.now()}});
    if(M.curTab === 'home' && M.refreshScreen) M.refreshScreen('home');
  }catch(e){ /* no fix: try again later */ }
  finally{ busy = false; }
}
M.travelCheck = check;
setTimeout(()=>check(false), 5000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) setTimeout(()=>check(false), 1500); });

function rules(){
  const tv = (M.ADHKAR && M.ADHKAR.MISC || []).find(g=>g.id === 'm_safar');
  const dua = tv && tv.items && tv.items[0];
  const li = t=>h('li', t);
  const body = h('div.tv-rules',
    h('ul', {style:'line-height:2;margin:0;padding-inline-start:20px'},
      li('يُشرع للمسافر قصر الصلاة الرباعية (الظهر والعصر والعشاء) إلى ركعتين، ولا تُقصر المغرب ولا الفجر.'),
      li('ويجوز له الجمع بين الظهر والعصر، وبين المغرب والعشاء، جمع تقديم أو تأخير.'),
      li('إذا صلّى المسافر خلف إمام مقيم أتمّ الصلاة معه.'),
      li('يرى جمهور العلماء أن مسافة القصر نحو ٨٠ كم، وأن من نوى الإقامة أكثر من أربعة أيام يُتمّ صلاته، وفي المسألة خلاف معروف بين أهل العلم.')),
    dua ? h('div.card.pad', {style:'margin-top:12px'}, h('div.small.muted', dua.lbl), h('div.qfont', {style:'line-height:2.1;margin-top:4px'}, dua.t), dua.src ? h('div.tiny.muted', dua.src) : null) : null,
    h('div.tiny.muted', {style:'margin-top:10px'}, 'للتفصيل في حالتك راجع أهل العلم.'));
  M.sheet({title:'صلاة المسافر', content:body});
}
M.travelRules = rules;

M.addHomeNotice && M.addHomeNotice(()=>{
  if(M.cfg.travelDetect === false) return null;
  const s = S(), l = M.cfg.loc; if(!l) return null;
  // 1) the phone is somewhere else than the saved city
  const c = s.cand;
  if(c && Date.now() - c.t < 12 * 3600e3){
    const el = h('div.card.pad.tv-banner', h('span.lead', {html:M.icon('pin')}),
      h('div.grow', h('div.bold', ...(c.name === 'موقعي الحالي' ? ['يبدو أنك في مكان آخر الآن'] : ['يبدو أنك الآن في ', h('span', c.name)])),
        h('div.small.muted', 'على بعد '+M.n(c.d)+' كم من '+l.name+'. حدّث الموقع لتكون المواقيت والأذان صحيحة.'),
        h('div.tv-act',
          h('button.btn.sm', {onclick:()=>{ M.save('loc', {name:c.name, lat:c.lat, lng:c.lng, tz:c.tz, auto:true}); put({cand:null}); M.toast('حُدّثت المواقيت: '+c.name); M.refreshScreen && M.refreshScreen('home'); }}, 'تحديث المواقيت'),
          h('button.btn.ghost.sm', {onclick:()=>{ put({cand:null, dismiss:{lat:c.lat, lng:c.lng, t:Date.now()}}); el.remove(); }}, 'ليس الآن'))));
    return el;
  }
  // 2) away from home: the traveller's prayer in brief
  const hm = home();
  if(hm && !M.noticeSnoozed('travel', 2)){
    const d = km(hm.lat, hm.lng, l.lat, l.lng);
    if(d >= TRAVEL){
      const el = h('div.card.pad.tv-banner', h('span.lead', {html:M.icon('compass')}),
        h('div.grow', h('div.bold', 'أنت على سفر'), h('div.small.muted', 'على بعد '+M.n(Math.round(d))+' كم من '+hm.name+'. يجوز لك قصر الصلاة وجمعها.'),
          h('div.tv-act',
            h('button.btn.sm', {onclick:rules}, 'صلاة المسافر'),
            h('button.btn.ghost.sm', {onclick:()=>{ put({home:{lat:l.lat, lng:l.lng, name:l.name}}); el.remove(); M.toast('مدينتك الآن: '+l.name); }}, 'هذه مدينتي الآن'),
            h('button.btn.ghost.sm', {onclick:()=>{ M.noticeSnooze('travel'); el.remove(); }}, 'إخفاء'))));
      return el;
    }
  }
  return null;
});
})();
