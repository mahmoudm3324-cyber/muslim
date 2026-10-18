/* «وقت العبادة» — the home card under the prayer times that follows the day:
   before each prayer (wudu and walking to the mosque), the adhan, between adhan and iqama, the adhkar after the prayer,
   morning and evening adhkar, duha, sleep, the last third of the night, Friday and Ramadan (suhoor / iftar).
   One main item for «now» (open, listen, mark done — the tick is the same one as in «متابعة العبادات»), at most one
   more if two meet, and one line for what comes next. Everything is configurable from the gear (M.cfg.wnow). */
(function(){
const M = window.M, h = M.h;
const PR5 = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const MIN = 60000;
const DEF = {pre:true, after:true, me:true, duha:true, sleep:true, night:true, fri:true, ram:true, next:true, title:true, sub:true, preMin:15, afterMin:30};
const cfg = ()=>Object.assign({}, DEF, M.cfg.wnow || {});
const setCfg = p=>M.save('wnow', Object.assign({}, M.cfg.wnow || {}, p));

const topic = id=>(M.TOPICS || []).find(t=>t[0] === id);
const pager = (title, ids)=>{ const items = [].concat(...ids.map(id=>(topic(id) || [, , , []])[3])); if(items.length) M.dhikrPager(title, items); };
const rel = ms=>{ const m = Math.max(1, Math.round(ms / MIN)); if(m < 60) return M.n(m)+' د'; const hh = Math.floor(m / 60), mm = m % 60; return mm ? M.n(hh)+' س '+M.n(mm)+' د' : M.n(hh)+' س'; };

/* every window that touches day `d` (0 = today) */
function windowsFor(base, d){
  const day = M.addDays(base, d); day.setHours(12, 0, 0, 0);
  const t = M.prayerTimes(day), t1 = M.prayerTimes(M.addDays(day, 1));
  const c = cfg(), dk = M.dkey(day), dow = day.getDay(), hj = M.hijri(day), out = [];
  const add = (o)=>{ if(o.to > o.from) out.push(Object.assign({dk}, o)); };
  const iq = k=>{ const v = (M.cfg.iqama || {})[k]; return M.cfg.iqamaOn !== false && v ? v : (k === 'maghrib' ? 7 : 12); };
  PR5.forEach(k=>{
    const A = +t[k], L = M.prayerLabel(k, day), q = iq(k);
    if(c.pre){
      add({key:'pre_'+k, pr:4, g:'pre', ic:'s:mosque', t:'الاستعداد لصلاة '+L, s:'الوضوء وأذكار الخروج إلى المسجد', from:A - c.preMin * MIN, to:A, trk:['misc_wudu', 'misc_walk'], open:()=>pager('قبل الصلاة', ['wudu', 'tomosque', 'mosque'])});
      add({key:'adhan_'+k, pr:1, g:'pre', ic:'bell', t:'حان وقت '+L, s:'ردّد مع المؤذن، ثم صلِّ على النبي ﷺ وسل له الوسيلة', from:A, to:A + 6 * MIN, open:()=>pager('عند الأذان', ['adhan'])});
      add({key:'iqama_'+k, pr:2, g:'pre', ic:'clock', t:'بين الأذان والإقامة', s:'الدعاء لا يُردّ بين الأذان والإقامة', from:A + 6 * MIN, to:A + q * MIN, open:()=>M.openAdhkarCategory('duas')});
    }
    if(c.after) add({key:'after_'+k, pr:3, g:'after', ic:'s:beads', t:'أذكار بعد صلاة '+L, s:'الاستغفار والتسبيح وآية الكرسي', from:A + (q + 8) * MIN, to:A + (q + 8 + c.afterMin) * MIN, trk:[k+'_adhkar'], open:()=>M.openAdhkarCategory('after', {prayer:k})});
  });
  if(c.me){
    add({key:'morning', pr:7, g:'me', ic:'sunrise', t:'أذكار الصباح', s:'من الفجر إلى الضحى', from:+t.fajr, to:+t.dhuhr - 30 * MIN, trk:['adhkar_morning'], snd:'r_morning', open:()=>M.openAdhkarCategory('morning')});
    add({key:'evening', pr:7, g:'me', ic:'moon', t:'أذكار المساء', s:'من العصر إلى المغرب', from:+t.asr, to:+t.maghrib, trk:['adhkar_evening'], snd:'r_evening', open:()=>M.openAdhkarCategory('evening')});
  }
  if(c.duha) add({key:'duha', pr:9, g:'duha', ic:'sun', t:'صلاة الضحى', s:'ركعتان على الأقل، وأفضلها إذا ارتفعت الشمس', from:+t.sunrise + 20 * MIN, to:+t.dhuhr - 10 * MIN, trk:['duha'], open:()=>M.openGuide('duha')});
  if(c.sleep) add({key:'sleep', pr:8, g:'sleep', ic:'star', t:'أذكار النوم', s:'آية الكرسي والمعوّذات قبل أن تنام', from:+t.isha + 60 * MIN, to:+t.lastThird, trk:['misc_sleep'], open:()=>M.openAdhkarCategory('sleep')});
  if(c.night) add({key:'night', pr:6, g:'night', ic:'s:moon', t:'الثلث الأخير من الليل', s:'وقت القيام والوتر والدعاء', from:+t.lastThird, to:+t1.fajr - 10 * MIN, trk:['qiyam_rak'], open:()=>M.openGuide('qiyam')});
  if(c.fri && dow === 5){
    add({key:'kahf', pr:10, g:'fri', ic:'s:mushaf', t:'سورة الكهف', s:'نورٌ ما بين الجمعتين', from:+t.fajr, to:+t.maghrib, trk:['fri_kahf'], open:()=>M.openReader({sura:18, ayah:1})});
    add({key:'ijaba', pr:5, g:'fri', ic:'s:dua', t:'ساعة الإجابة', s:'آخر ساعة قبل المغرب يوم الجمعة', from:+t.maghrib - 60 * MIN, to:+t.maghrib, open:()=>M.openAdhkarCategory('duas')});
  }
  if(c.ram && hj.m === 9){
    add({key:'suhoor', pr:5, g:'ram', ic:'s:moon', t:'السحور', s:'تسحّروا فإن في السحور بركة', from:+t.fajr - 50 * MIN, to:+t.fajr - 5 * MIN, open:()=>M.openGuide('suhoor')});
    add({key:'iftar', pr:5, g:'ram', ic:'sun', t:'الإفطار', s:'للصائم عند فطره دعوة لا تُردّ', from:+t.maghrib - 15 * MIN, to:+t.maghrib + 20 * MIN, open:()=>pager('دعاء الإفطار', ['iftar'])});
  }
  return out;
}
const isDone = w=>!!(w.trk && w.trk.length && M.T && w.trk.every(id=>M.T.get(w.dk, id)));
/* what is on now (main + one more) and what comes next */
M.worshipNow = function(now){
  now = +(now || new Date());
  let all = [];
  try{ [-1, 0, 1].forEach(d=>{ all = all.concat(windowsFor(new Date(now), d)); }); }catch(e){ console.error(e); return {cur:[], next:null}; }
  const cur = all.filter(w=>w.from <= now && now < w.to);
  /* a prayer's own moments (pre / adhan / iqama / after) outrank everything; then what is not done yet */
  cur.sort((a, b)=>(isDone(a) - isDone(b)) || (a.pr - b.pr));
  const seen = new Set(), uniq = cur.filter(w=>!seen.has(w.g + (w.g === 'pre' ? '' : w.key)) && seen.add(w.g + (w.g === 'pre' ? '' : w.key)));
  const later = all.filter(w=>w.from > now && w.g !== 'fri' && !uniq.some(u=>u.key === w.key)).sort((a, b)=>a.from - b.from);
  return {cur:uniq, next:later[0] || null};
};

/* ---- the card ---- */
M.worshipCard = function(){
  const card = h('section.card.wn', {'aria-label':'وقت العبادة'});
  let lastSig = '', playing = null;
  const unS = M.on('sound', s=>{ playing = s || null; paint(true); });
  function act(ic, label, fn, cls){ return h('button.wn-act'+(cls || ''), {'aria-label':label, title:label, onclick:e=>{ e.stopPropagation(); fn(); }}, M.ic(ic)); }
  function toggleDone(w){ const v = !isDone(w); w.trk.forEach(id=>M.T.check(w.dk, id, v)); M.haptic && M.haptic(v ? 14 : 6); if(v) M.toast('تقبّل الله منك'); paint(true); }
  function mainRow(w, upcoming){
    const now = Date.now(), done = isDone(w);
    const pct = upcoming ? 0 : Math.min(100, Math.max(0, (now - w.from) / (w.to - w.from) * 100));
    const meta = upcoming ? 'يبدأ بعد '+rel(w.from - now)+' • '+M.n(M.fmt(new Date(w.from))) : done ? 'تمّ، تقبّل الله منك' : 'يبقى '+rel(w.to - now);
    const acts = h('div.wn-acts');
    if(w.snd && !upcoming){ const on = playing === w.snd; acts.append(act(on ? 'pause' : 'play', on ? 'إيقاف الاستماع' : 'استمع', ()=>{ on ? M.stopSound() : M.playSound(w.snd); }, on ? '.on' : '')); }
    if(w.trk && w.trk.length && !upcoming) acts.append(act('check', done ? 'إلغاء التعليم' : 'تعليم كمنجز', ()=>toggleDone(w), done ? '.ok' : ''));
    return h('div.wn-main'+(done ? '.done' : '')+(upcoming ? '.soon' : ''), {role:'button', tabindex:0, onclick:()=>w.open(), onkeydown:e=>{ if(e.key === 'Enter') w.open(); }},
      h('span.wn-ic', {html:M.icon(w.ic)}),
      h('div.wn-tx', h('b.title-font', w.t), h('small', w.s), h('div.wn-meta', h('span.wn-bar', h('i', {style:'width:'+pct+'%'})), h('span.num', meta))),
      acts);
  }
  function subRow(w){
    const done = isDone(w);
    return h('div.wn-sub'+(done ? '.done' : ''), {role:'button', tabindex:0, onclick:()=>w.open(), onkeydown:e=>{ if(e.key === 'Enter') w.open(); }},
      h('span.wn-ic.sm', {html:M.icon(w.ic)}), h('div.wn-tx', h('b', w.t), h('small', w.s)),
      w.trk && w.trk.length ? act('check', done ? 'إلغاء التعليم' : 'تعليم كمنجز', ()=>toggleDone(w), done ? '.ok' : '') : null);
  }
  function paint(force){
    if(!card.isConnected && lastSig){ unT(); unS(); return; }
    const c = cfg(), r = M.worshipNow();
    const main = r.cur[0] || null, sub = c.sub ? r.cur[1] || null : null, nx = r.next;
    const sig = [main && main.key, main && isDone(main), sub && sub.key, sub && isDone(sub), nx && nx.key, playing, Math.floor(Date.now() / 30000)].join('|');
    if(!force && sig === lastSig) return; lastSig = sig;
    const gear = h('button.icon-btn.wn-gear', {'aria-label':'تخصيص وقت العبادة', onclick:e=>{ e.stopPropagation(); M.openWorshipCfg(); }}, M.ic('settings'));
    const kids = [];
    kids.push(c.title ? h('div.wn-h', h('span.wn-hl', 'وقت العبادة'), gear) : h('div.wn-h.bare', gear));
    if(main) kids.push(mainRow(main));
    else if(nx) kids.push(mainRow(nx, true));
    else kids.push(h('div.small.muted.wn-empty', 'لا شيء مفعّل — اضغط الترس لاختيار ما يظهر هنا.'));
    if(sub) kids.push(subRow(sub));
    if(c.next && main && nx) kids.push(h('button.wn-next', {onclick:()=>nx.open()}, h('span.wn-nl', 'بعدها'), h('span.wn-ni', {html:M.icon(nx.ic)}), h('span.grow.wn-nt', nx.t), h('span.num.wn-nw', M.n(M.fmt(new Date(nx.from))))));
    card.replaceChildren(...kids);
  }
  let tk = 0; const unT = M.every(()=>{ if(++tk % 15) return; paint(false); });
  paint(true);
  return card;
};

/* the card moved under the prayer times (2.3.1): move it once for people who already ordered their home cards */
try{ if(!M.store.get('wnowMoved')){ const o = (M.cfg.homeOrder || []).slice(); if(o.length){ const i = o.indexOf('time'); if(i >= 0) o.splice(i, 1); const p = o.indexOf('prayer'); o.splice(p >= 0 ? p + 1 : 0, 0, 'time'); M.save('homeOrder', o); } M.store.set('wnowMoved', 1); } }catch(e){}

/* ---- customise ---- */
M.openWorshipCfg = function(){
  const c = cfg();
  const sw = (k, t, s)=>h('div.item.static', h('div.grow', h('div.t', t), s ? h('div.s', s) : null), M.switchEl(!!c[k], v=>{ c[k] = v; setCfg({[k]:v}); M.refreshScreen && M.refreshScreen(); }));
  const seg = (k, vals)=>M.seg(vals.map(v=>[String(v), M.n(v)+' د']), String(c[k]), v=>{ setCfg({[k]:+v}); M.refreshScreen && M.refreshScreen(); });
  const body = h('div.wn-cfg',
    h('div.small.muted', {style:'margin:0 4px 10px;line-height:1.8'}, 'تتغيّر البطاقة مع مواقيت الصلاة في موقعك، والتعليم فيها هو نفسه في «متابعة العبادات».'),
    h('div.section-h', 'ما يظهر'),
    h('div.list.card',
      sw('pre', 'قبل الصلاة وعند الأذان', 'الوضوء، الخروج إلى المسجد، الأذان، وما بين الأذان والإقامة'),
      sw('after', 'أذكار بعد الصلاة'),
      sw('me', 'أذكار الصباح والمساء'),
      sw('duha', 'صلاة الضحى'),
      sw('sleep', 'أذكار النوم'),
      sw('night', 'الثلث الأخير من الليل'),
      sw('fri', 'الجمعة', 'سورة الكهف وساعة الإجابة'),
      sw('ram', 'السحور والإفطار في رمضان')),
    h('div.section-h', 'التوقيت'),
    h('div.list.card',
      h('div.item.static.stack', h('div.grow', h('div.t', 'التذكير قبل الصلاة بـ')), seg('preMin', [10, 15, 20, 30])),
      h('div.item.static.stack', h('div.grow', h('div.t', 'أذكار بعد الصلاة لمدة')), seg('afterMin', [20, 30, 45, 60]))),
    h('div.section-h', 'العرض'),
    h('div.list.card',
      sw('title', 'عنوان البطاقة'),
      sw('sub', 'عبادة ثانية إن اجتمعتا', 'مثل أذكار الصباح بعد صلاة الفجر'),
      sw('next', 'سطر «بعدها»', 'العبادة القادمة ووقتها')),
    h('button.btn.ghost.block', {style:'margin-top:12px', onclick:()=>{ const B = Object.assign({}, M.cfg.homeBlocks); B.time = false; M.save('homeBlocks', B); sh.close(); M.refreshScreen && M.refreshScreen(); M.toast('أُخفيت البطاقة، وتعيدها من «بطاقات الواجهة الرئيسية»'); }}, 'إخفاء البطاقة من الرئيسية'));
  const sh = M.sheet({title:'وقت العبادة', content:body});
  return sh;
};
})();
