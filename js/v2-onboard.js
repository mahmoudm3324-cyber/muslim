/* v2 onboarding (2.3.1 redesign): «المحراب» look — an arch emblem per step, a quiet star lattice, segmented progress.
   Same steps and keys as before (ms:onboarded gating, 'update' mode, onbResume after a language reload), plus a features summary
   and a voice-adhkar step (الصلاة على النبي ﷺ، ذكر الله، الصباح والمساء) with a listen button. */
(function(){
const M = window.M, h = M.h;
const LEGACY = M.openOnboarding;
const reduced = ()=>{ try{ return matchMedia('(prefers-reduced-motion:reduce)').matches || document.documentElement.dataset.fx === 'low' || document.documentElement.dataset.anim === 'off'; }catch(e){ return false; } };
const wait = ms=>new Promise(r=>setTimeout(r, ms));
const svgNS = 'http://www.w3.org/2000/svg';
const sv = (tag, a, ...kids)=>{ const e = document.createElementNS(svgNS, tag); for(const k in (a || {})) e.setAttribute(k, a[k]); kids.forEach(c=>c && e.append(c)); return e; };
const askPerm = ()=>{ try{ window.Android && window.Android.requestNotifPerm && window.Android.requestNotifPerm(); if(window.Notification && Notification.permission === 'default') Notification.requestPermission(); }catch(e){} };
const PR5 = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const DK = ['salawat', 'dhikr', 'morning', 'evening'];
/* ask for the permission when anything is on, tell the native side about the live notification and re-schedule everything */
function notifApply(){
  try{
    const any = PR5.some(k=>(M.cfg.notifyIn || {})[k]) || PR5.some(k=>M.nfOn('pre_'+k)) || DK.some(k=>M.nfOn(k)) || M.cfg.liveNotif;
    if(any) askPerm();
    window.Android && window.Android.setLive && window.Android.setLive(!!M.cfg.liveNotif);
    M.syncNative(true);
  }catch(e){ console.error(e); }
}
const voiceName = id=>{ for(const [, items] of (M.VOICES || [])) for(const [i, n] of items) if(i === id) return n; return ''; };

/* the arch (mihrab) emblem: an SVG frame with an icon or an image inside */
let gid = 0;
function arch(inner, big){
  const id = 'obg'+(++gid);
  const s = sv('svg', {viewBox:'0 0 100 120', 'aria-hidden':'true', class:'ob-arch-svg'},
    sv('defs', {}, sv('linearGradient', {id, x1:'0', y1:'0', x2:'0', y2:'1'}, sv('stop', {offset:'0', 'stop-color':'var(--ob-a1)'}), sv('stop', {offset:'1', 'stop-color':'var(--ob-a2)'}))),
    sv('path', {d:'M4 118V52C4 30 22 13 50 3C78 13 96 30 96 52V118Z', fill:'url(#'+id+')'}),
    sv('path', {d:'M4 118V52C4 30 22 13 50 3C78 13 96 30 96 52V118Z', fill:'none', stroke:'var(--ob-gold)', 'stroke-width':'2.2', 'stroke-linejoin':'round'}),
    sv('path', {d:'M13 118V54C13 37 27 23 50 14C73 23 87 37 87 54V118', fill:'none', stroke:'var(--ob-gold)', 'stroke-width':'1', opacity:'.55'}));
  return h('div.ob-arch'+(big ? '.big' : ''), s, h('div.ob-arch-in', inner));
}
const archIc = (ic, big)=>arch(h('span.ob-arch-ic', {html:M.icon(ic)}), big);

M.openOnboarding = function(mode){
  try{ return build(mode); }catch(e){ console.error(e); return LEGACY ? LEGACY(mode) : null; }
};

function build(mode){
  const upd = mode === 'update';
  let step = 0, dir = 1, busy = false, off = [], pageOff = [];
  const pages = [];
  const root = h('div.ob');
  const barW = h('div.ob-bar', {role:'progressbar', 'aria-valuemin':0, 'aria-valuemax':100});
  const back = h('button.ob-back', {'aria-label':'رجوع', onclick:()=>go(step - 1)}, M.ic('back'));
  const skipB = h('button.ob-skip', {onclick:()=>go(step + 1)}, 'تخطَّ');
  const stage = h('div.ob-stage'); const foot = h('div.ob-foot');
  root.append(h('div.ob-bgx', h('i.ob-lattice'), h('i.ob-glow')), h('div.ob-top', back, barW, skipB), stage, foot);
  const view = M.openView({title:'', id:'onboarding', noHead:true, nopad:true, build:b=>b.append(root), onClose:()=>{ try{ M.stopSound && M.stopSound(); }catch(e){} pageOff.forEach(f=>f()); off.forEach(f=>f()); }});
  view.onBack = ()=>{ if(step > 0 && !busy){ go(step - 1); } return true; };

  function finish(){ try{ M.stopSound && M.stopSound(); }catch(e){} M.store.set('onboarded', 1); M.store.set('seenVersion', M.VERSION); M.store.set('nfDefaults2', 1); M.store.set('nfDefaults3', 1); M.store.del && M.store.del('onbResume'); notifApply(); view.close(); M.refreshScreen && M.refreshScreen(); }
  function go(n){
    if(busy || n < 0) return; if(n >= pages.length) return finish();
    dir = n >= step ? 1 : -1; step = n; draw(true);
  }
  const card = (...k)=>h('div.ob-card.ob-st', ...k);
  const lab = t=>h('div.ob-lab.ob-st', t);
  /* page header: small arch emblem beside the title */
  const head = (ic, t, d)=>[h('div.ob-hd.ob-st', archIc(ic), h('div.ob-hd-t', h('h1.ob-h.title-font', t), d ? h('p.ob-p', d) : null))];

  /* 1 welcome */
  pages.push(()=>{
    const icon = M.cfg.appIcon || 10;
    const star = (r, n, k)=>{ let d = ''; for(let i = 0; i < n * 2; i++){ const a = Math.PI * i / n - Math.PI / 2, rr = i % 2 ? r * k : r; d += (i ? 'L' : 'M') + (100 + rr * Math.cos(a)).toFixed(1) + ' ' + (100 + rr * Math.sin(a)).toFixed(1); } return d + 'Z'; };
    const rings = h('div.ob-rings', {'aria-hidden':'true'},
      sv('svg', {viewBox:'0 0 200 200', class:'ob-ring r1'}, sv('path', {d:star(96, 8, .78), fill:'none', stroke:'var(--ob-gold)', 'stroke-width':'.9'}), sv('circle', {cx:100, cy:100, r:99, fill:'none', stroke:'var(--ob-gold)', 'stroke-width':'.5', 'stroke-dasharray':'2 5'})),
      sv('svg', {viewBox:'0 0 200 200', class:'ob-ring r2'}, sv('path', {d:star(80, 12, .84), fill:'none', stroke:'var(--ob-gold)', 'stroke-width':'.7'})),
      h('i.ob-glow'));
    const sparks = h('div.ob-sparks', {'aria-hidden':'true'}, ...Array.from({length:16}, (_, i)=>h('i', {style:'--x:'+((i * 37 + 11) % 100)+'%;--y:'+((i * 53 + 7) % 92)+'%;--d:'+((i % 7) * 0.45).toFixed(2)+'s;--s:'+(5 + (i % 4) * 3)+'px;--t:'+(2.6 + (i % 5) * 0.7).toFixed(1)+'s'})));
    const el = h('div.ob-page.ob-wel', sparks,
      h('div.ob-st.ob-wel-em', rings, arch(h('img', {src:'img/icons/'+icon+'.jpg', alt:''}), true)),
      h('h1.ob-h.ob-big.title-font.ob-st.ob-shine', 'المسلم'), h('div.ob-rule', {'aria-hidden':'true'}, h('i'), h('b'), h('i')),
      h('p.ob-p.ob-st', upd ? 'تم تحديث التطبيق إلى الإصدار '+M.n(M.VERSION)+'. هذا أبرز ما أضفناه لك.' : 'رفيقك اليومي للقرآن والصلاة والذكر. نجهّزه على ذوقك في خطوات قصيرة.'),
      upd ? card(h('b.ob-ul-h', 'الجديد في هذا الإصدار'), h('ul.ob-ul', ...(M.whatsNew ? M.whatsNew() : M.WHATS_NEW).map(t=>h('li', t)))) : null,
      !upd ? h('div.ob-promise.ob-st', ...[['s:shield', 'بلا إعلانات'], ['lock', 'بلا حسابات'], ['download', 'يعمل دون إنترنت']].map(([ic, t])=>h('span', {html:M.icon(ic)}, t))) : null);
    return {el, primary: upd ? 'متابعة' : 'ابدأ', onPrimary: upd ? finish : null, second: upd ? 'إعادة تخصيص التطبيق' : null, onSecond: ()=>go(1), noSkip: true};
  });

  /* 2 features summary: a bento of what is inside, with today's next prayer live */
  pages.push(()=>{
    let nx = null; try{ nx = M.nextPrayer(); }catch(e){}
    const tile = (cls, ic, t, d, extra)=>h('div.ob-tile.ob-st'+cls, h('span.ob-ti', {html:M.icon(ic)}), h('b', t), h('small', d), extra || null);
    const grid = h('div.ob-bento',
      tile('.w.hero', 's:mushaf', 'المصحف الشريف', 'قراءة وتفسير وتلاوة بأصوات عدة قرّاء، مع تنزيل للاستماع دون إنترنت.', h('div.ob-tnum', h('span', h('b', M.n(114)), ' سورة'), h('span', h('b', M.n(30)), ' جزءًا'), h('span', h('b', M.n(604)), ' صفحة'))),
      tile('', 's:mosque', 'المواقيت والأذان', nx ? 'التالية: '+M.prayerLabel(nx.next.k)+' '+M.n(M.fmt(nx.next.t)) : 'أذان وتنبيه قبل كل صلاة'),
      tile('', 's:qibla', 'القبلة', 'بوصلة وخريطة لاتجاه الكعبة'),
      tile('', 's:beads', 'الأذكار والمسبحة', 'صباحًا ومساءً ومسبحة بالعدّ'),
      tile('', 'mic', 'التسميع بالصوت', 'يسمع تلاوتك ويتابعك آية آية'),
      tile('', 's:khatma', 'الختمة والتحفيظ', 'ورد يومي وخطة حفظ ومراجعة'),
      tile('', 's:calendar', 'التقويم الهجري', 'المناسبات والأيام البيض'),
      tile('.w.soft', 'image', 'بطاقات للمشاركة', 'صمّم آية أو ذكرًا بخلفيات وخطوط جميلة وشاركه.'));
    return {el: h('div.ob-page', ...head('s:star8', 'كل ما تحتاجه في مكان واحد', 'هذه أبرز أقسام التطبيق، وتجد الباقي في «المزيد».'), grid), primary:'متابعة'};
  });

  /* 3 language + numerals */
  pages.push(()=>{
    const langs = h('div.ob-langs.ob-st');
    M.LANGS.forEach(([id, n, e])=>langs.append(h('button.ob-opt'+(M.lang === id ? '.on' : ''), {dataset:{noi18n:1}, onclick:()=>{
      if(id === M.lang) return; M.store.set('onbResume', 3); M.setLang(id);
    }}, h('b', n), h('small', e), h('span.ob-ck', {html:M.icon('check')}))));
    const dg = M.seg([['hindi', '​١٢٣ عربية'], ['latin', '​123 English']], M.cfg.digits === 'latin' ? 'latin' : 'hindi', v=>{ M.save('digits', v); });
    return {el: h('div.ob-page', ...head('globe', 'اللغة والأرقام', 'اختر لغة الواجهة وشكل الأرقام.'), langs, ...((M.lang || 'ar') === 'ar' ? [lab('شكل الأرقام'), h('div.ob-st', dg)] : [])), primary:'متابعة'};
  });

  /* 4 location */
  pages.push(()=>{
    const nm = h('div.ob-loc.title-font', M.cfg.loc ? M.location().name : 'لم يُحدَّد بعد');
    const btn = h('button.btn.tonal.block', {onclick:async function(){
      this.disabled = true; try{ const l = await M.detectLocation(); M.save('loc', l); nm.textContent = l.name; M.toast('تم تحديد موقعك'); }catch(e){ M.toast('تعذّر تحديد الموقع — اختر مدينتك من القائمة'); } this.disabled = false;
    }}, M.ic('pin'), 'السماح وتحديد موقعي');
    const cities = h('div.ob-cities.ob-st');
    M.CITIES.slice(0, 18).forEach(c=>cities.append(h('button.ob-chip', {onclick:function(){ M.save('loc', {name:c[0], lat:c[1], lng:c[2], tz:c[3], auto:false}); nm.textContent = c[0]; cities.querySelectorAll('.on').forEach(x=>x.classList.remove('on')); this.classList.add('on'); }}, c[0])));
    return {el: h('div.ob-page', ...head('pin', 'موقعك لحساب المواقيت', 'نحتاج موقعك التقريبي لحساب مواقيت الصلاة واتجاه القبلة.'),
      card(h('div.ob-mut', 'الموقع الحالي'), nm, btn),
      h('div.ob-card.ob-priv.ob-st', h('span.ob-fi', {html:M.icon('s:shield')}), h('div', h('b', 'خصوصيتك'), h('small', 'تُحسب المواقيت على جهازك، ويُحفظ الموقع في إعدادات التطبيق على جهازك فقط. التطبيق بلا حسابات وبلا إعلانات.'))),
      lab('أو اختر مدينتك'), cities), primary:'متابعة'};
  });

  /* 5 calculation */
  pages.push(()=>{
    const prev = h('div.ob-times');
    const paint = ()=>{ try{ const tt = M.prayerTimes(new Date()); let nk = null; try{ nk = M.nextPrayer().next.k; }catch(e){} prev.replaceChildren(...PR5.map(k=>h('div'+(k === nk ? '.on' : ''), h('small', M.prayerLabel(k, new Date())), h('b', M.n(M.fmt(tt[k])))))); }catch(e){} };
    const sel = h('select.field', {'aria-label':'طريقة الحساب', onchange:e=>{ M.save('method', e.target.value); paint(); }}, M.METHODS.map(([v, n])=>h('option', {value:v, selected:v === M.cfg.method}, n)));
    paint();
    return {el: h('div.ob-page', ...head('clock', 'حساب المواقيت', 'اتركها «تلقائي» إن لم تكن متأكدًا، ويمكنك تغييرها لاحقًا.'),
      card(h('div.ob-mut', 'مواقيت اليوم في '+M.location().name), prev),
      lab('طريقة الحساب'), h('div.ob-st', sel),
      lab('وقت العصر'), h('div.ob-st', M.seg([['shafi', 'الجمهور'], ['hanafi', 'الحنفي']], M.cfg.madhhab === 'hanafi' ? 'hanafi' : 'shafi', v=>{ M.save('madhhab', v); paint(); })),
      lab('نظام الساعة'), h('div.ob-st', M.seg([['12', M.n(12)+' ساعة'], ['24', M.n(24)+' ساعة']], M.cfg.h24 ? '24' : '12', v=>{ M.save('h24', v === '24'); paint(); }))), primary:'متابعة'};
  });

  /* 6 notifications: writes the real keys (notifyIn, adhanTone, nf.pre_*, liveNotif) */
  pages.push(()=>{
    const allOn = ()=>PR5.every(k=>(M.cfg.notifyIn || {})[k]);
    const preOn = ()=>PR5.some(k=>M.nfOn('pre_'+k));
    const preOff = ()=>{ const o = M.nfGet('pre_fajr').off; return o != null ? o : 10; };
    const row = (ic, t, d, sw)=>h('div.ob-row.ob-st', h('span.ob-fi', {html:M.icon(ic)}), h('div.grow', h('b', t), h('small', d)), sw);
    const mins = M.seg([['5', M.n(5)+' د'], ['10', M.n(10)+' د'], ['15', M.n(15)+' د'], ['20', M.n(20)+' د']], String(preOff()), v=>PR5.forEach(k=>M.nfSet('pre_'+k, {off:+v})));
    const minsBox = h('div.ob-mins', h('div.ob-lab', 'قبل الصلاة بـ'), mins); minsBox.hidden = !preOn();
    return {el: h('div.ob-page', ...head('s:bell', 'التنبيهات والأذان', 'كلها متوقفة حتى تفعّل ما تريده الآن أو لاحقًا من «الإشعارات». يطلب النظام إذنك عند تفعيل أول تنبيه.'),
      h('div.ob-group.ob-st',
        row('s:mosque', 'الأذان عند دخول الوقت', 'تنبيه وأذان لكل صلاة', M.switchEl(allOn(), v=>{ const o = Object.assign({}, M.cfg.notifyIn); PR5.forEach(k=>o[k] = v); M.save('notifyIn', o); if(v) M.save('adhanTone', true); })),
        row('bell', 'ينبّه باقتراب الصلاة', 'تذكير قبل دخول وقت كل صلاة', M.switchEl(preOn(), v=>{ PR5.forEach(k=>M.nfSet('pre_'+k, {on:v})); minsBox.hidden = !v; })),
        minsBox,
        row('t:notification', 'الصلاة القادمة في الإشعارات', 'إشعار دائم بالعدّ التنازلي', M.switchEl(!!M.cfg.liveNotif, v=>M.save('liveNotif', v)))),
      h('p.ob-note.ob-st', 'تجد بعدها اختيار المؤذن والأصوات وأوقات كل تنبيه في صفحة «الإشعارات».')),
      primary:'متابعة', onPrimary:()=>{ notifApply(); go(step + 1); }, second:null};
  });

  /* 7 voice adhkar: turn on a recorded reminder and listen to it first (writes nf.salawat / nf.dhikr / nf.morning / nf.evening) */
  pages.push(()=>{
    const FREQ = {
      once: id=>({on:true, ui:'a', mode:'times', times:[M.NF.find(d=>d.id === id).clock], clock:M.NF.find(d=>d.id === id).clock}),
      h2: ()=>({on:true, ui:'b', mode:'every', from:'08:00', clock:'08:00', to:'22:00', every:120, snd:'rotate'}),
      h1: ()=>({on:true, ui:'b', mode:'every', from:'08:00', clock:'08:00', to:'22:00', every:60, snd:'rotate'})
    };
    const freqOf = id=>{ const c = M.nfGet(id); if(c.mode === 'every') return (c.every || 60) <= 60 ? 'h1' : 'h2'; return 'once'; };
    const ITEMS = [
      {id:'salawat', ic:'s:muhammad', t:'الصلاة على النبي ﷺ', d:'«اللهم صلِّ وسلِّم على نبينا محمد» بصوت مسجّل', voices:['r_salawat6', 'r_salawat1', 'r_salawat3', 'r_salawat5', 'r_salawat2', 'r_salawat4'], freq:true},
      {id:'dhikr', ic:'s:beads', t:'ذكر الله', d:'تسبيح وتهليل واستغفار يتجدّد كل مرة', voices:['r_ahabb', 'r_dhikr1', 'r_tasbih1', 'r_hasbuna', 'r_tahlil', 'r_tawakkul'], freq:true},
      {id:'morning', ic:'sunrise', t:'أذكار الصباح', d:'بعد الشروق بقليل', voices:['r_morning']},
      {id:'evening', ic:'moon', t:'أذكار المساء', d:'بعد العصر', voices:['r_evening']}
    ];
    let playing = null; const btns = {};
    const paintPlay = ()=>Object.entries(btns).forEach(([id, o])=>{ const on = playing && o.it.voices.includes(playing); o.b.classList.toggle('on', !!on); o.b.replaceChildren(M.ic(on ? 'pause' : 'play')); o.b.setAttribute('aria-label', (on ? 'إيقاف ' : 'استمع إلى ')+o.it.t); if(on) o.v.textContent = voiceName(playing); });
    pageOff.push(M.on('sound', s=>{ playing = s || null; paintPlay(); }));
    pageOff.push(()=>{ if(playing){ try{ M.stopSound(); }catch(e){} } });
    const cards = ITEMS.map(it=>{
      let vi = 0;
      const v = h('span.ob-dk-v');
      const pb = h('button.ob-play', {'aria-label':'استمع إلى '+it.t, onclick:()=>{
        if(playing && it.voices.includes(playing)){ M.stopSound(); return; }
        const id = it.voices[vi % it.voices.length]; vi++; v.textContent = voiceName(id); M.playSound(id);
      }}, M.ic('play'));
      btns[it.id] = {b:pb, v, it};
      const fq = it.freq ? M.seg([['once', 'مرة يوميًا'], ['h2', 'كل ساعتين'], ['h1', 'كل ساعة']], freqOf(it.id), val=>M.nfSet(it.id, FREQ[val](it.id))) : null;
      const fqBox = fq ? h('div.ob-dk-f', fq) : null; if(fqBox) fqBox.hidden = !M.nfOn(it.id);
      const c = h('div.ob-dk.ob-st'+(M.nfOn(it.id) ? '.on' : ''),
        h('div.ob-dk-r', h('span.ob-fi', {html:M.icon(it.ic)}), h('div.grow', h('b', it.t), h('small', it.d), v), pb,
          M.switchEl(M.nfOn(it.id), val=>{ c.classList.toggle('on', val); if(fqBox) fqBox.hidden = !val;
            if(!val) return M.nfSet(it.id, {on:false});
            M.nfSet(it.id, it.freq ? FREQ[freqOf(it.id)](it.id) : {on:true}); })),
        fqBox);
      return c;
    });
    return {el: h('div.ob-page', ...head('volume', 'أذكار بصوت جميل', 'اختر ما يذكّرك به التطبيق بصوت مسجّل خلال اليوم، واستمع إليه قبل التفعيل.'),
      ...cards, h('p.ob-note.ob-st', 'التكرار من ٨ صباحًا إلى ١٠ مساءً، ويمكنك تغيير الأوقات والأصوات لاحقًا من «الإشعارات».')),
      primary:'متابعة', onPrimary:()=>{ notifApply(); go(step + 1); }};
  });

  /* 8 theme / skin with live preview */
  pages.push(()=>{
    const pv = h('div.ob-pv.ob-st');
    const paintPv = ()=>{ let nx = null; try{ nx = M.nextPrayer(); }catch(e){}
      pv.replaceChildren(h('div.ob-pv-h', h('span', M.fmtHijri ? M.fmtHijri(M.hijri(new Date())) : ''), h('i')),
        h('div.ob-pv-card', h('small', nx ? 'الصلاة القادمة: '+M.prayerLabel(nx.next.k) : ''), h('b.title-font', nx ? M.n(M.fmt(nx.next.t)) : ''), h('div.ob-pv-bar', h('i'))),
        h('div.ob-pv-row', h('i'), h('i'), h('i'), h('i'))); };
    paintPv(); const un = M.on('settings', paintPv); pageOff.push(un);
    const g = h('div.ob-skins.ob-st'); const sk = (id, l)=>{ const c = h('button.ob-opt'+(M.resolveSkin() === id ? '.on' : ''), {onclick:()=>{ M.save('skin', id); g.querySelectorAll('.ob-opt').forEach(x=>x.classList.toggle('on', x === c)); }}, h('b', l), h('span.ob-ck', {html:M.icon('check')})); return c; };
    g.append(sk('glass', 'Liquid Glass'), sk('material', 'Material You'));
    const sw = h('div.swatches.ob-st'); M.ACCENTS.forEach(([c, n])=>sw.append(h('button.swatch'+(M.cfg.accentSrc === 'user' && M.cfg.accent === c ? '.on' : ''), {'aria-label':n, style:'--c:'+c, onclick:function(){ M.save('accentSrc', 'user'); M.save('accent', c); sw.querySelectorAll('.swatch').forEach(x=>x.classList.remove('on')); this.classList.add('on'); }})));
    return {el: h('div.ob-page', ...head('palette', 'اجعله تطبيقك', 'اختر المظهر واللون، ويظهر التغيير فورًا.'), pv,
      lab('السمة'), h('div.ob-st', M.seg([['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن'], ['amoled', 'AMOLED']], M.cfg.theme, v=>M.save('theme', v))),
      lab('الشكل'), g, lab('اللون'), sw), primary:'متابعة'};
  });

  /* 9 almost ready: real light work */
  pages.push(()=>{
    const tasks = [
      ['تهيئة المواقيت', async()=>{ const d = new Date(); for(let i = 0; i < 30; i++) M.prayerTimes(M.addDays(d, i)); }],
      ['تجهيز القرآن', async()=>{ await M.loadQuran(); }],
      ['تجهيز الأذكار', async()=>{ Object.values(M.ADHKAR || {}).forEach(g=>Array.isArray(g) && g.length); }],
      ['حفظ تفضيلاتك', async()=>{ M.syncNative(true); }]
    ];
    const rows = tasks.map(([t])=>h('div.ob-prog.ob-st', h('span.ob-spin'), h('b', t)));
    const el = h('div.ob-page', ...head('sparkle', 'أوشكنا على الانتهاء', 'نجهّز التطبيق على اختياراتك.'), h('div.ob-card.ob-st.ob-progs', ...rows));
    return {el, primary:'متابعة', lockUntilDone:true, run: async(setDone)=>{
      let alive = true; pageOff.push(()=>alive = false);
      const t0 = Date.now(), fast = reduced();
      for(let i = 0; i < tasks.length && alive; i++){
        const r = rows[i]; r.classList.add('run');
        try{ await Promise.race([tasks[i][1](), wait(900)]); }catch(e){ console.error(e); }
        if(!fast) await wait(380); if(!alive) return;
        r.classList.remove('run'); r.classList.add('done'); r.querySelector('.ob-spin').replaceChildren(M.ic('check'));
        if(Date.now() - t0 > 2500) { for(let j = i + 1; j < tasks.length; j++){ rows[j].classList.add('done'); rows[j].querySelector('.ob-spin').replaceChildren(M.ic('check')); } break; }
      }
      if(alive) setDone();
    }};
  });

  /* 10 widgets + live notification: the real widget preview pictures and a faithful mock of the real notification (Android only) */
  if(M.can('widgets')) pages.push(()=>{
    let t = null; try{ t = M.prayerTimes(new Date()); }catch(e){}
    const wimg = (k, cls)=>h('img.ob-wi'+(cls || ''), {src:'img/wprev/'+k+'.png', alt:'', decoding:'async'});
    const nm = h('b'), tm = h('span.ob-nt-time'), pct = h('i'), rest = h('div.ob-nt-rest');
    const where = M.location().name+' • '+(M.fmtHijri ? M.fmtHijri(M.hijri(new Date())) : '');
    const tick = ()=>{ try{ const i = M.nextPrayer(); nm.textContent = M.prayerLabel(i.next.k)+' • '+M.n(M.fmt(i.next.t)); tm.textContent = M.n(M.fmtDur(i.next.t - new Date())); const tot = i.next.t - i.prev.t; pct.style.width = Math.max(2, Math.min(100, (1 - (i.next.t - Date.now())/tot)*100))+'%'; }catch(e){} };
    tick(); pageOff.push(M.every(tick));
    if(t) rest.textContent = PR5.map(k=>M.prayerLabel(k, new Date())+' '+M.n(M.fmt(t[k]))).join('   ');
    const el = h('div.ob-page', ...head('grid', 'الودجت وإشعار الصلاة', 'هكذا تظهر الصلاة القادمة على شاشتك الرئيسية وفي شريط الإشعارات.'),
      h('div.ob-nt.ob-st',
        h('div.ob-nt-h', h('span.ob-nt-ic', {html:M.icon('s:mushaf')}), h('span', 'المسلم'), h('i', '•'), h('span', 'الصلاة القادمة'), h('i', '•'), tm),
        h('div.ob-nt-t', nm), h('div.ob-nt-s', where), h('div.ob-nt-bar', pct), rest),
      h('div.ob-st', wimg('next2')),
      h('div.ob-wrow.ob-st', wimg('countdown'), wimg('azkarpro')),
      h('div.ob-st', wimg('qayah')),
      h('p.ob-note.ob-st', 'لإضافة ودجت: اضغط مطولًا على الشاشة الرئيسية ← الأدوات ← «المسلم».'));
    return {el, primary:'تفعيل الإشعار الدائم', onPrimary:()=>{ M.save('liveNotif', true); notifApply(); finish(); }, second:'لاحقًا', onSecond:finish, noSkip:true};
  });

  function draw(animate){
    pageOff.forEach(f=>f()); pageOff = [];
    const P = pages[step]();
    const pg = P.el; pg.classList.add('ob-page-in'); pg.dataset.dir = dir;
    if(!animate || reduced()) pg.classList.add('ob-noanim');
    stage.replaceChildren(pg); stage.scrollTop = 0; pg.scrollTop = 0;
    const pctV = Math.round((step + 1) / pages.length * 100);
    barW.replaceChildren(...pages.map((_, i)=>h('i'+(i < step ? '.done' : i === step ? '.cur' : ''))));
    barW.setAttribute('aria-valuenow', pctV); barW.setAttribute('aria-label', 'الخطوة '+M.n(step + 1)+' من '+M.n(pages.length));
    back.style.visibility = step > 0 ? 'visible' : 'hidden';
    skipB.style.visibility = (P.noSkip || P.lockUntilDone) ? 'hidden' : 'visible';
    pg.querySelectorAll('.ob-st').forEach((e, i)=>e.style.setProperty('--i', Math.min(i, 9)));
    foot.replaceChildren();
    const pb = h('button.btn.block.ob-go', {onclick:()=>{ if(pb.disabled) return; if(P.onPrimary) P.onPrimary(); else go(step + 1); }}, P.primary || 'التالي');
    foot.append(pb);
    if(P.second) foot.append(h('button.btn.ghost.block.ob-sec', {onclick:P.onSecond}, P.second));
    foot.append(h('div.ob-legal', h('a', {role:'button', tabindex:0, onclick:()=>M.openSub('about')}, 'الشروط'), ' • ', h('a', {role:'button', tabindex:0, onclick:()=>M.openSub('about')}, 'الخصوصية')));
    if(P.lockUntilDone){ pb.disabled = true; busy = true; P.run(()=>{ pb.disabled = false; busy = false; }).catch(e=>{ console.error(e); pb.disabled = false; busy = false; }); pageOff.push(()=>{ busy = false; }); }
  }
  let resume = 0; try{ resume = +M.store.get('onbResume', 0) || 0; }catch(e){}
  if(resume > 0 && resume < pages.length && !upd){ step = resume; M.store.del && M.store.del('onbResume'); }
  draw(false);
  return view;
}
})();
