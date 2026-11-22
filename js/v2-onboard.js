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
  const root = h('div.ob.ob3');
  const barW = h('div.ob-bar', {role:'progressbar', 'aria-valuemin':0, 'aria-valuemax':100});
  const back = h('button.ob-back', {'aria-label':'رجوع', onclick:()=>go(step - 1)}, M.ic('back'));
  const skipB = h('button.ob-skip', {onclick:()=>go(step + 1)}, 'تخطَّ');
  const stage = h('div.ob-stage'); const foot = h('div.ob-foot');
  root.append(h('div.ob-bgx', h('i.ob-lattice'), h('i.ob-glow')), h('div.ob-top', back, barW, skipB), stage, foot);
  const view = M.openView({title:'', id:'onboarding', noHead:true, nopad:true, build:b=>b.append(root), onClose:()=>{ try{ M.stopSound && M.stopSound(); }catch(e){} pageOff.forEach(f=>f()); off.forEach(f=>f()); }});
  view.onBack = ()=>{ if(step > 0 && !busy){ go(step - 1); } return true; };

  function finish(){ if(!upd && !M.store.get('tourDone', 0)) setTimeout(offerTour, 700); try{ M.stopSound && M.stopSound(); }catch(e){} M.store.set('onboarded', 1); M.store.set('seenVersion', M.VERSION); M.store.set('nfDefaults2', 1); M.store.set('nfDefaults3', 1); M.store.del && M.store.del('onbResume'); notifApply(); view.close(); M.refreshScreen && M.refreshScreen(); }
  function go(n){
    if(busy || n < 0) return; if(n >= pages.length) return finish();
    dir = n >= step ? 1 : -1; step = n; draw(true);
  }
  const card = (...k)=>h('div.ob-card.ob-st', ...k);
  /* after an update: a few switches for what is new, so they can be turned on right here */
  function quickSet(){
    const row = (ic, t, d, sw)=>h('div.ob-row', h('span.ob-fi', {html:M.icon(ic)}), h('div.grow', h('b', t), h('small', d)), sw);
    const rows = [];
    if(M.duaDayCard) rows.push(row('heart', 'دعاء اليوم في الرئيسية', 'دعاء جديد كل يوم بمصدره', M.switchEl(M.homeOn('duaday'), v=>{ const x = Object.assign({}, M.cfg.homeBlocks); x.duaday = v; M.save('homeBlocks', x); })));
    if(M.nfOn && M.nfSet && (M.NF || []).some(d=>d.id === 'duarand')) rows.push(row('bell', 'إشعار بدعاء عشوائي', 'مرة يوميًا، وتغيّر الصوت والتكرار من «الإشعارات»', M.switchEl(M.nfOn('duarand'), v=>{ M.nfSet('duarand', {on:v}); notifApply(); })));
    if(M.popupCfg) rows.push(row('s:khatma', 'ورد الختمة العائم', 'آية من ختمتك تقرؤها وتنتقل للتالية', M.switchEl(!!M.popupCfg.w().on, v=>M.popupCfg.wset({on:v}))));
    rows.push(row('palette', 'المظهر', 'فاتح أو داكن أو حسب النظام', M.seg([['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']], M.cfg.theme === 'amoled' ? 'dark' : M.cfg.theme || 'auto', v=>M.save('theme', v))));
    return h('div.ob-group.ob-st.ob-quick', h('div.ob-lab', 'إعدادات سريعة'), ...rows);
  }
  /* «ابدأ مباشرة»: the suggested settings (the location when allowed), then the app */
  async function quick(){
    if(!M.cfg.loc){ try{ const l = await Promise.race([M.detectLocation(), new Promise((_, no)=>setTimeout(no, 6000))]); M.save('loc', l); }catch(e){} }
    finish();
  }
  function offerTour(){
    if(!M.sheet || !M.startTour) return;
    const sh = M.sheet({title:'جولة سريعة؟', content:h('div.col-flex.ob-tour',
      h('div.ob-tour-ic', {html:M.icon('t:hand-click')}),
      h('p', 'نعرّفك بأقسام التطبيق في أقل من دقيقة، خطوة بخطوة على الشاشة.'),
      h('button.btn.block', {onclick:()=>{ sh.close(); setTimeout(()=>M.startTour(), 300); }}, 'ابدأ الجولة'),
      h('button.btn.tonal.block', {onclick:()=>{ M.store.set('tourDone', 1); sh.close(); M.toast('تجد الجولة في «المزيد» متى شئت'); }}, 'لاحقًا'))});
  }
  const lab = t=>h('div.ob-lab.ob-st', t);
  /* page header: small arch emblem beside the title */
  const head = (ic, t, d)=>[h('div.ob-hd.ob-st', archIc(ic), h('div.ob-hd-t', h('h1.ob-h.title-font', t), d ? h('p.ob-p', d) : null))];

  /* 1 welcome */
  pages.push(()=>{
    const icon = M.cfg.appIcon || 10;
    /* 3.10.2: a calm, still welcome — the app icon, its name, what it holds, and its promises (no glow, sparks or rings) */
    const hr = new Date().getHours();
    const hello = hr < 4 ? 'مساء الخير' : hr < 12 ? 'صباح الخير' : hr < 18 ? 'نهارك سعيد' : 'مساء الخير';
    const FEAT = [['s:mushaf', 'المصحف الشريف', 'قراءة وتفسير واستماع لعدة قرّاء'], ['s:mosque', 'المواقيت والقبلة', 'أذان وتنبيه قبل كل صلاة'],
      ['s:beads', 'الأذكار والأدعية', 'الصباح والمساء والنوم بعدّاد'], ['s:khatma', 'الختمة والورد', 'خطة يومية تتابع بها قراءتك']];
    const el = h('div.ob-page.ob-wel.ob-w2'+(upd ? '.upd' : ''),
      h('div.ob-w2-top.ob-st',
        h('img.ob-w2-icon', {src:'img/icons/'+icon+'.jpg', alt:''}),
        h('div.ob-w2-tt', h('small', upd ? 'تحديث جديد' : hello + ' • أهلًا بك'), h('h1.ob-h.title-font', 'المسلم'))),
      h('p.ob-p.ob-st.ob-w2-p', upd ? 'تم تحديث التطبيق إلى الإصدار '+M.n(M.VERSION)+'. هذا أبرز ما أضفناه لك.' : 'رفيقك اليومي للقرآن والصلاة والذكر. نجهّزه على ذوقك في خطوات قصيرة.'),
      upd ? card(h('b.ob-ul-h', 'الجديد في الإصدار ' + M.n(M.VERSION)), h('ul.ob-ul', ...(M.WHATS_LATEST || (M.whatsNew ? M.whatsNew() : M.WHATS_NEW).slice(0, 3)).map(t=>h('li', t)))) : null,
      upd ? quickSet() : null,
      !upd ? h('div.ob-w2-list.ob-st', ...FEAT.map(([ic, t, d])=>h('div.ob-w2-row', h('span.ob-w2-ic', {html:M.icon(ic)}), h('div.grow', h('b', t), h('small', d))))) : null,
      !upd ? h('div.ob-promise.ob-st', ...[['s:shield', 'بلا إعلانات'], ['lock', 'بلا حسابات'], ['download', 'يعمل دون إنترنت']].map(([ic, t])=>h('span', {html:M.icon(ic)}, t))) : null);
    /* a long "what's new" list scrolls: fade the bottom edge while there is more below */
    const more = ()=>el.classList.toggle('more', el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    el.addEventListener('scroll', more, {passive:true}); requestAnimationFrame(()=>requestAnimationFrame(more)); setTimeout(more, 700); setTimeout(more, 1600);
    return {el, primary: upd ? 'متابعة' : 'لنجهّزه على ذوقك', onPrimary: upd ? finish : null, second: upd ? 'إعادة تخصيص التطبيق' : 'ابدأ مباشرة بالإعدادات المقترحة', onSecond: upd ? ()=>go(1) : quick, noSkip: true};
  });

  /* 2 the prayer timeline: the sun rises, crosses the sky and sets, the moon comes at Fajr and Isha; clouds drift by and the sky
     changes colour with every prayer (no dots or rings: only the sun, the moon and the clouds) */
  pages.push(()=>{
    const PR = [['fajr', 0, 1], ['sunrise', .1, 0], ['dhuhr', .5, 0], ['asr', .72, 0], ['maghrib', .9, 0], ['isha', 1, 1]];
    let tt = null; try{ tt = M.prayerTimes(new Date()); }catch(e){}
    const P = (t)=>{ const x = 296 - t * 272, y = 96 - Math.sin(t * Math.PI) * 74; return [x, y]; };   // the day runs from the east (right) to the west
    const arc = h('div.ob3-arc', {html:'<svg viewBox="0 0 320 112"><defs>' +
      '<mask id="ob3cm"><rect x="-24" y="-24" width="48" height="48" fill="#000"/><circle r="11" fill="#fff"/><circle cx="5" cy="-3.8" r="10" fill="#000"/></mask>' +
      '<radialGradient id="ob3sg"><stop offset="0" stop-color="#fff7da"/><stop offset=".6" stop-color="#ffd166"/><stop offset="1" stop-color="#ffb236"/></radialGradient>' +
      '<radialGradient id="ob3sl"><stop offset="0" stop-color="#ffe3a3"/><stop offset=".6" stop-color="#ff9e45"/><stop offset="1" stop-color="#f0642f"/></radialGradient>' +
      '<radialGradient id="ob3glow"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".75"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="ob3hz"><rect x="-40" y="-60" width="400" height="156"/></clipPath></defs>' +
      '<path d="M24 96 Q160 -52 296 96" class="ob3-path"/><line x1="0" y1="96" x2="320" y2="96" class="ob3-hz"/>' +
      '<g clip-path="url(#ob3hz)"><g class="ob3-mk">' +
      '<circle r="30" fill="url(#ob3glow)" class="ob3-glow"/>' +
      '<g class="ob3-sun"><g class="ob3-rays"><line x1="0" y1="-14" x2="0" y2="-18.5" transform="rotate(0)"/><line x1="0" y1="-14" x2="0" y2="-18.5" transform="rotate(45)"/><line x1="0" y1="-14" x2="0" y2="-18.5" transform="rotate(90)"/><line x1="0" y1="-14" x2="0" y2="-18.5" transform="rotate(135)"/><line x1="0" y1="-14" x2="0" y2="-18.5" transform="rotate(180)"/><line x1="0" y1="-14" x2="0" y2="-18.5" transform="rotate(225)"/><line x1="0" y1="-14" x2="0" y2="-18.5" transform="rotate(270)"/><line x1="0" y1="-14" x2="0" y2="-18.5" transform="rotate(315)"/></g><circle r="11" class="ob3-sunb"/></g>' +
      '<g class="ob3-moon"><circle r="11" fill="#f1f3ff" mask="url(#ob3cm)"/><path d="M11 -13l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z" fill="#fff"/><circle cx="14" cy="2" r="1" fill="#fff" opacity=".8"/></g>' +
      '</g></g></svg>'});
    const mk = arc.querySelector('.ob3-mk');
    const cl = (cls, w)=>'<svg class="' + cls + '" viewBox="0 0 80 36" width="' + w + '"><path d="M14 34h52a14 14 0 0 0 0-28 20 20 0 0 0-37-6A15 15 0 0 0 14 34z"/></svg>';
    const clouds = h('div.ob3-clouds', {'aria-hidden':'true', html:cl('c1', 96) + cl('c2', 64) + cl('c3', 120) + cl('c4', 54)});
    const stars = h('div.ob3-stars', {'aria-hidden':'true'});
    const name = h('div.ob3-pn.title-font'), when = h('div.ob3-pt');
    const scene = h('div.ob3-scene', h('div.ob3-kick', 'مواقيت الصلاة'), name, when);
    const city = h('div.ob3-city', {html:'<svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice"><path d="M0 120V92h28v-8h10v8h22V70a26 26 0 0 1 52 0v22h14V40l4-10 4 10v52h20V80a40 40 0 0 1 80 0v12h20V40l4-10 4 10v52h14V74a24 24 0 0 1 48 0v18h30v-6h12v6h34v28z"/></svg>'});
    let i = 0, iv = null;
    const show = ()=>{ const [k, t, night] = PR[i]; name.textContent = M.prayerLabel(k); when.textContent = tt ? M.n(M.fmt(tt[k])) : '';
      const [x, y] = P(t); mk.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + (y + (k === 'sunrise' || k === 'maghrib' ? 4 : night ? -22 : 0)).toFixed(1) + ')');
      el.dataset.sky = k; root.dataset.sky = k;
      mk.classList.toggle('night', !!night); mk.classList.toggle('low', k === 'sunrise' || k === 'maghrib');
      name.classList.remove('in'); void name.offsetWidth; name.classList.add('in'); };
    const el = h('div.ob-page.ob3-tl', stars, clouds, arc, scene, city,
      h('div.ob3-tx.ob-st', h('h1.ob-h.title-font', 'مشاهد حيّة لمواقيتك'), h('p.ob-p', 'تشرق الشمس وتغرب، ويطلع القمر، وتتغيّر ألوان السماء مع كل صلاة من الفجر إلى العشاء.')));
    show();
    el.addEventListener('click', e=>{ if(e.target.closest('button')) return; i = (i + 1) % PR.length; show(); M.haptic && M.haptic(6); });   // a tap moves on too
    if(!reduced()){ iv = setInterval(()=>{ i = (i + 1) % PR.length; show(); }, 1900); pageOff.push(()=>{ clearInterval(iv); delete root.dataset.sky; }); }
    return {el, primary:'متابعة'};
  });

  /* 2b mark every prayer you complete (a little try: tap a prayer) */
  pages.push(()=>{
    const PR = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let tt = null; try{ tt = M.prayerTimes(new Date()); }catch(e){}
    const grid = h('div.ob3-pr.ob-st', ...PR.map(k=>h('button.ob3-pt-t', {onclick:function(){ this.classList.toggle('on'); M.haptic && M.haptic(this.classList.contains('on') ? 14 : 6); }},
      h('span.ob3-ck', {html:M.icon('check')}), h('span.ob3-ic', {html:M.icon('p:' + k)}), h('b', M.prayerLabel(k)), h('small.num', tt ? M.n(M.fmt(tt[k])) : ''))));
    return {el: h('div.ob-page', h('div.ob3-big.ob-st', grid), h('div.ob3-tx.ob-st', h('h1.ob-h.title-font', 'سجّل كل صلاة تؤديها'), h('p.ob-p', 'اجعل الصلاة عادة ثابتة: علّم صلواتك كل يوم وتابع أيامك المتتالية. جرّب الضغط على صلاة.'))), primary:'متابعة'};
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

  /* 3b about you: the name for the greeting + the text size */
  pages.push(()=>{
    const hello = h('div.ob-hello.title-font', 'السلام عليكم' + (M.cfg.userName ? ' يا ' + M.cfg.userName : ''));
    const name = h('input.field', {type:'text', maxlength:24, placeholder:'اسمك (اختياري)', value:M.cfg.userName || '', oninput:e=>{ const v = e.target.value.trim(); M.save('userName', v); hello.textContent = 'السلام عليكم' + (v ? ' يا ' + v : ''); }});
    const sample = h('div.ob-sample.qfont', 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ');
    const sizes = [[0.9, 'صغير'], [1, 'متوسط'], [1.12, 'كبير'], [1.28, 'أكبر']];
    const cur = M.cfg.fontScale || 1;
    const paintS = v=>{ sample.style.fontSize = (1.5 * v) + 'rem'; };
    paintS(cur);
    const near = sizes.reduce((a, b)=>Math.abs(b[0] - cur) < Math.abs(a[0] - cur) ? b : a)[0];
    const seg = M.seg(sizes.map(([v, l])=>[String(v), l]), String(near), v=>{ M.save('fontScale', +v); paintS(+v); });
    return {el: h('div.ob-page', ...head('t:user', 'نتعرّف عليك', 'نحيّيك باسمك في الرئيسية، ونضبط حجم الخط على راحتك.'),
      card(hello, name), lab('حجم الخط في التطبيق'), card(sample), h('div.ob-st', seg)), primary:'متابعة'};
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
    const mode = ()=>!allOn() ? 'off' : M.cfg.adhanTone === false ? 'note' : 'adhan';
    const modes = h('div.ob3-modes.ob-st');
    const voice = h('button.ob3-voice', {onclick:()=>{
      const l = h('div.list');
      (M.ADHANS || []).forEach(([id, nm])=>l.append(h('button.item.ob3-vo' + ((M.cfg.adhan || 'ad_makkah') === id ? '.on' : ''), {onclick:()=>{ M.save('adhan', id); try{ M.playSound(id); }catch(e){} paintModes(); l.querySelectorAll('.ob3-vo').forEach(x=>x.classList.toggle('on', x === l.querySelector('[data-id="' + id + '"]'))); }, dataset:{id}}, h('span.ob3-rd'), h('div.grow.t', nm), M.ic('play'))));
      const sh = M.sheet({title:'صوت الأذان', content:l, onClose:()=>{ try{ M.stopSound(); }catch(e){} paintModes(); }});
    }});
    const MODES = [['off', 's:bell', 'معطّل', 'لا تنبيه عند دخول الوقت'], ['note', 't:notification', 'إشعار فقط', 'إشعار بنغمة الهاتف'], ['adhan', 's:mosque', 'الأذان', 'إشعار مع صوت الأذان']];
    const paintModes = ()=>{ const m = mode();
      modes.replaceChildren(...MODES.map(([k, ic, t, d])=>h('button.ob3-mode' + (m === k ? '.on' : ''), {onclick:()=>{
        const o = Object.assign({}, M.cfg.notifyIn); PR5.forEach(x=>o[x] = k !== 'off'); M.save('notifyIn', o); M.save('adhanTone', k === 'adhan'); paintModes(); M.haptic && M.haptic(8); }},
        h('span.ob-fi', {html:M.icon(ic)}), h('div.grow', h('b', t), h('small', d)), h('span.ob3-rd'))));
      const nm = ((M.ADHANS || []).find(a=>a[0] === (M.cfg.adhan || 'ad_makkah')) || [, 'الأذان'])[1];
      voice.replaceChildren(M.ic('volume'), h('span.grow', 'صوت الأذان'), h('b', nm), M.ic('fwd')); voice.hidden = m !== 'adhan'; };
    paintModes();
    return {el: h('div.ob-page', ...head('s:bell', 'التنبيهات والأذان', 'كلها متوقفة حتى تفعّل ما تريده الآن أو لاحقًا من «الإشعارات». يطلب النظام إذنك عند تفعيل أول تنبيه.'),
      modes, voice,
      h('div.ob-group.ob-st',
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
      {id:'salawat', ic:'s:muhammad', t:'الصلاة على النبي ﷺ', d:'«اللهم صلِّ وسلِّم على نبينا محمد» بصوت مسجّل', voices:['r_salawat6', 'r_salawat1', 'r_salawat3', 'r_salawat5', 'r_salawat2', 'r_salawat4', 'r_salawat7', 'r_salawat8', 'r_salawat9', 'r_salawat10'], freq:true},
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

  /* 7b the home screen: the shortcuts shown there and in the floating circle */
  pages.push(()=>{
    const all = (M.SECTIONS || []).filter(x=>!['settings', 'look', 'navbar_cfg', 'health', 'v2_security', 'notifs', 'tour', 'search'].includes(x[0]));
    const sel = (M.shortcuts ? M.shortcuts() : []).slice();
    const count = h('span.ob-cnt');
    const grid = h('div.ob-pick.ob-st');
    const paint = ()=>{ count.textContent = M.n(sel.length) + ' / ' + M.n(8);
      grid.querySelectorAll('.ob-pk').forEach(b=>{ const on = sel.includes(b.dataset.id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); };
    all.forEach(x=>grid.append(h('button.ob-pk', {dataset:{id:x[0]}, onclick:()=>{
      const i = sel.indexOf(x[0]);
      if(i >= 0) sel.splice(i, 1); else { if(sel.length >= 8){ M.toast('اختر ٨ أقسام على الأكثر'); return; } sel.push(x[0]); }
      M.save('shortcuts', sel.slice()); paint(); M.haptic && M.haptic(6);
    }}, h('span.ob-pk-i', {html:M.icon(x[2])}), h('span.ob-pk-t', x[1]), h('span.ob-ck', {html:M.icon('check')}))));
    paint();
    return {el: h('div.ob-page', ...head('s:grid', 'اختصاراتك', 'اختر الأقسام التي تستخدمها كثيرًا؛ تظهر في الرئيسية وفي الدائرة العائمة.'),
      h('div.ob-lab.ob-st.ob-lab-row', h('span', 'اختياراتك'), count), grid), primary:'متابعة'};
  });

  /* 7b' the home screen's cards */
  if(M.HOME_ORDER) pages.push(()=>{
    const list = h('div.ob3-cards.ob-st');
    const order = (M.homeOrder ? M.homeOrder() : M.HOME_ORDER.map(x=>x[0]));
    order.forEach(k=>{ const d = M.HOME_ORDER.find(x=>x[0] === k); if(!d || k === 'custom') return;
      const b = h('button.ob3-card' + (M.homeOn(k) ? '.on' : ''), {onclick:()=>{ const x = Object.assign({}, M.cfg.homeBlocks); x[k] = !M.homeOn(k); M.save('homeBlocks', x); b.classList.toggle('on', M.homeOn(k)); M.haptic && M.haptic(6); }},
        h('div.grow', h('b', d[1]), d[2] ? h('small', d[2]) : null), h('span.ob3-cc', {html:M.icon('check')}));
      list.append(b); });
    return {el: h('div.ob-page', ...head('t:layout-dashboard', 'بطاقات الرئيسية', 'اختر ما يظهر في الشاشة الرئيسية، وغيّر ترتيبه لاحقًا من الإعدادات ← البطاقات.'), list), primary:'متابعة'};
  });

  /* 7c the floating card (verse khatma): on or off, as a small circle, and the hours it may appear in */
  if(M.popupCfg) pages.push(()=>{
    const P = M.popupCfg, nat = !!(window.Android && window.Android.popupConfig);
    const w = P.w(), u = P.u();
    const row = (ic, t, d, sw)=>h('div.ob-row.ob-st', h('span.ob-fi', {html:M.icon(ic)}), h('div.grow', h('b', t), h('small', d)), sw);
    const winBox = h('div.ob-win');
    const paintWin = ()=>{ const W = P.u().win || {};
      winBox.hidden = !W.on;
      winBox.replaceChildren(h('label', h('small', 'من'), h('input.field', {type:'time', value:W.from || '08:00', onchange:e=>P.uset({win:Object.assign({}, P.u().win, {from:e.target.value || '08:00'})})})),
        h('label', h('small', 'إلى'), h('input.field', {type:'time', value:W.to || '22:00', onchange:e=>P.uset({win:Object.assign({}, P.u().win, {to:e.target.value || '22:00'})})}))); };
    paintWin();
    return {el: h('div.ob-page', ...head('s:khatma', 'النافذة العائمة', nat ? 'تعرض لك آيات من ختمتك عند فتح الهاتف. اجعلها هادئة كما تحب.' : 'تعرض لك آيات من ختمتك عند فتح التطبيق. اجعلها هادئة كما تحب.'),
      h('div.ob-group.ob-st',
        row('s:khatma', 'ورد الآيات العائم', 'آيات من ختمتك تقرؤها وتنتقل إلى ما بعدها', M.switchEl(!!w.on, v=>P.wset({on:v}))),
        row('t:hand-click', 'تظهر كدائرة صغيرة', 'بدل النافذة الكاملة: دائرة تضغطها لتفتح الورد، فلا تقاطعك', M.switchEl(!!u.bubble, v=>P.uset({bubble:v}))),
        row('clock', 'في ساعات محددة فقط', 'لا تظهر خارج الوقت الذي تختاره', M.switchEl(!!(u.win && u.win.on), v=>{ P.uset({win:Object.assign({from:'08:00', to:'22:00'}, P.u().win, {on:v})}); paintWin(); })),
        winBox),
      h('p.ob-note.ob-st', 'تغيّر ذلك لاحقًا من «الختمة» ← إعدادات النافذة.')), primary:'متابعة'};
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
