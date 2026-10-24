/* ===== Sounds: adhan voices, spoken reminders, library & in-app adhan ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const DUR = {"r_salawat3":4.9,"r_salawat4":6.3,"r_salawat5":12.5,"ad_qatami":133.4,"ad_dosari":178.2,"tk_qatami":27.1,"tk_makkah":11.6,"tk_abdulbasit":10.6,"tk_arkani":16.7,"tk_menshawy":12.9,"tk_mishary":22.3,"ad_abdulbasit_fajr":293.5,"ad_mishary_fajr":222.3,"ad_abdulbasit":244.9,"ad_mishary":185.7,"ad_abdulbasit2":200.8,"ad_nuyne":210.1,"ad_malki":266.7,"ad_arkani":240.6,"ad_makkah":202.5,"ad_menshawy":251.6,"ad_refat":203.7,"pre_fajr":2.8,"pre_dhuhr":2.8,"pre_jumua":2.6,"pre_asr":2.8,"pre_maghrib":2.8,"pre_isha":3.1,"r_morning":8.8,"r_evening":8.6,"r_tasbih1":5.5,"r_tasbih2":13.8,"r_salawat1":4.1,"r_salawat2":8.7,"r_mon1":4.2,"r_mon2":3.2,"r_thu1":3.9,"r_thu2":3.2,"r_qiyam1":3.4,"r_qiyam2":14.0,"r_dhikr1":8.9,"r_dhikr2":18.4,"r_istighfar1":28.3,"r_istighfar2":29.3,"r_ahabb":8.2,"r_salawat6":44.2,"r_hasbuna":3.6,"r_karb":6.7,"r_tawakkul":8.4,"r_kaffara":11.2,"r_tahlil":13.2,"pre_hayya1":9.0,"pre_hayya2":10.5,"pre_hayya3":9.8,"pre_fajr2":14.0,"r_salawat7":2.6,"r_salawat8":4.2,"r_salawat9":5.3,"r_salawat10":6.3,"r_tahlil2":11.4,"r_tahlil3":3.1,"r_subhan":2.4,"r_subhanbi":3.0,"r_evening2":6.0,"pre_sallayt_m":1.0,"pre_sallayt_f":1.1,"pre_tansa_m":1.5,"pre_tansa_f":1.8,"t_sada":1.3,"t_adhkar":0.9,"t_safa":1.2};
M.ADHANS = [
  ['ad_makkah', 'أذان مكة المكرمة'], ['ad_abdulbasit', 'الشيخ عبد الباسط عبد الصمد'], ['ad_mishary', 'الشيخ مشاري راشد العفاسي'],
  ['ad_nuyne', 'أحمد النفيس'], ['ad_malki', 'حمدان المالكي'], ['ad_arkani', 'إبراهيم الأركاني'],
  ['ad_menshawy', 'محمد المنشاوي'], ['ad_refat', 'محمد رفعت'], ['ad_qatami', 'الشيخ ناصر القطامي'], ['ad_dosari', 'الشيخ ياسر الدوسري']
];
M.TAKBEER = [['tk_makkah','تكبير مكة المكرمة'],['tk_abdulbasit','تكبير الشيخ عبد الباسط'],['tk_arkani','تكبير إبراهيم الأركاني'],['tk_menshawy','تكبير محمد المنشاوي'],['tk_mishary','تكبير الشيخ مشاري العفاسي'],['tk_qatami','تكبير الشيخ ناصر القطامي']];
M.FAJR_ADHAN = {ad_abdulbasit:'ad_abdulbasit_fajr', ad_mishary:'ad_mishary_fajr'};
M.adhanFor = k=>{ const a = M.cfg.adhan || 'ad_makkah'; return k === 'fajr' && M.FAJR_ADHAN[a] ? M.FAJR_ADHAN[a] : a; };
M.VOICES = [
  ['اقتراب الصلاة', [['pre_fajr', 'اقتربت صلاة الفجر'], ['pre_dhuhr', 'اقتربت صلاة الظهر'], ['pre_jumua', 'اقتربت صلاة الجمعة'], ['pre_asr', 'اقتربت صلاة العصر'], ['pre_maghrib', 'اقتربت صلاة المغرب'], ['pre_isha', 'اقتربت صلاة العشاء'],
    ['pre_hayya1', 'حيّ على الصلاة — مشاري العفاسي'], ['pre_hayya2', 'حيّ على الصلاة — أذان مكة'], ['pre_hayya3', 'حيّ على الصلاة — عبد الباسط'], ['pre_fajr2', 'الصلاة خير من النوم — للفجر'],
    ['pre_tansa_m', 'لا تنسَ الصلاة — صوت رجل'], ['pre_tansa_f', 'لا تنسَي الصلاة — صوت امرأة'], ['pre_sallayt_m', 'صلّيتَ؟ — صوت رجل'], ['pre_sallayt_f', 'صلّيتِ؟ — صوت امرأة']]],
  ['الأذكار', [['r_morning', 'أذكار الصباح'], ['r_evening', 'أذكار المساء'], ['r_istighfar1', 'سيد الاستغفار'], ['r_istighfar2', 'سيد الاستغفار (٢)'], ['r_ahabb', 'أحبّ الكلام إلى الله'], ['r_dhikr1', 'ذكر الله'], ['r_dhikr2', 'ذكر الله (٢)'], ['r_tasbih1', 'التسبيح'], ['r_tasbih2', 'التسبيح (٢)'], ['r_salawat1', 'الصلاة على النبي ﷺ'], ['r_salawat2', 'الصلاة على النبي ﷺ (٢)'], ['r_salawat3', 'اللهم صلّ وسلّم على نبينا محمد'], ['r_salawat4', 'اللهم صلّ وسلّم على نبينا محمد (٢)'], ['r_salawat5', 'الصلاة الإبراهيمية'], ['r_salawat6', 'الصلاة الإبراهيمية — مشاري العفاسي'], ['r_salawat7', 'لا تنسَ الصلاة على النبي ﷺ'], ['r_salawat8', 'اللهم صلّ وسلّم على نبينا محمد (٣)'], ['r_salawat9', 'اللهم صلّ على نبينا محمد'], ['r_salawat10', 'اللهم صلّ وسلّم على نبينا محمد (٤)'],
    ['r_hasbuna', 'حسبنا الله ونعم الوكيل'], ['r_karb', 'دعاء ذي النون'], ['r_tawakkul', 'بسم الله توكلت على الله'], ['r_kaffara', 'كفارة المجلس'], ['r_tahlil', 'لا إله إلا الله وحده لا شريك له'], ['r_tahlil2', 'لا إله إلا الله وحده لا شريك له (٢)'], ['r_tahlil3', 'لا إله إلا الله'], ['r_subhan', 'سبحان الله'], ['r_subhanbi', 'سبحان الله وبحمده'], ['r_evening2', 'أمسينا وأمسى الملك لله']]],
  ['تذكيرات', [['r_qiyam1', 'قيام الليل'], ['r_qiyam2', 'قيام الليل (٢)'], ['r_mon1', 'صيام الاثنين'], ['r_mon2', 'صيام الاثنين (٢)'], ['r_thu1', 'صيام الخميس'], ['r_thu2', 'صيام الخميس (٢)']]],
  ['نغمات قصيرة', [['t_adhkar', 'نغمة أذكار'], ['t_safa', 'صفاء'], ['t_sada', 'صدى']]]
];
const fmtD = s=>{ s = Math.round(s); return M.n(Math.floor(s / 60)+':'+String(s % 60).padStart(2, '0')); };

/* singleton player */
const A = new Audio(); A.preload = 'none'; (M._audios = M._audios || []).push(A);
let cur = null;
M.SND_DUR = DUR;
M.playSound = function(id){
  if(M.cfg.audioMute){ M.toast('الملفات الصوتية مكتومة من الإعدادات'); return; }
  if(cur === id && !A.paused){ M.stopSound(); return; }
  try{ if(M.player && M.player.a) M.player.a.pause(); }catch(e){}
  A.src = 'audio/'+id+'.mp3'; A.playbackRate = M.cfg.audioSpeed || 1; cur = id; A.play().catch(()=>M.toast('تعذّر تشغيل الصوت')); M.emit('sound', id);
};
M.stopSound = function(){ A.pause(); cur = null; M.emit('sound', null); };
A.addEventListener('ended', ()=>{ cur = null; M.emit('sound', null); });

/* library screen */
/* a removed adhan recording: move anyone who had picked it to the main Abdul Basit adhan */
try{
  const OLD = 'ad_abdulbasit2', NEW = 'ad_abdulbasit';
  if(M.cfg.adhan === OLD) M.save('adhan', NEW);
  if(M.cfg.alarmSnd === OLD) M.save('alarmSnd', NEW);
  const nf = M.cfg.nf; if(nf && typeof nf === 'object'){ let ch = false; Object.keys(nf).forEach(k=>{ const o = nf[k]; if(o && o.snd === OLD){ o.snd = NEW; ch = true; } if(o && Array.isArray(o.rot) && o.rot.includes(OLD)){ o.rot = o.rot.filter(x=>x !== OLD); ch = true; } }); if(ch) M.save('nf', nf); }
}catch(e){}
M.openSounds = function(){
  let offSnd = ()=>{};
  const view = M.openView({title:'المكتبة الصوتية', id:'sounds', onClose:()=>{ try{ offSnd(); }catch(e){} M.stopSound(); }, build:b=>{
    const rows = [];
    const row = (id, name, extra)=>{
      const btn = h('button.icon-btn.tonal', {'aria-label':'تشغيل', onclick:()=>M.playSound(id)}, M.ic('play'));
      const r = h('div.item.snd', h('div.grow', h('div.t', name), h('div.s', fmtD(DUR[id] || 0))), extra || null, btn);
      rows.push([id, btn]); return r;
    };
    b.append(h('button.item', {onclick:()=>M.openNotifs && M.openNotifs()}, h('span.lead', {html:M.icon('bell')}), h('div.grow', h('div.t', 'مركز الإشعارات'), h('div.s', 'اربط كل صوت بإشعاره وحدّد وقته')), M.ic('fwd')));
    b.append(h('div.section-h', 'أصوات الأذان'));
    const V = M.v2Sounds, tabHost = h('div'); let tab = M.store.get('sndTab', 'adhan'), panelOff = null;
    const adList = h('div.list.card');
    const mark = ()=>M.$$('.ad-pick', adList).forEach(x=>x.classList.toggle('on', x.dataset.id === (M.cfg.adhan || 'ad_makkah')));
    const fill = ()=>{ adList.replaceChildren(); M.ADHANS.forEach(([id, n])=>{
      const pick = h('button.chip.ad-pick', {dataset:{id}, onclick:()=>{ M.save('adhan', id); mark(); M.toast('تم اختيار: '+n); }}, 'اختيار');
      adList.append(row(id, n, pick));
    }); mark(); };
    const mount = ()=>{
      try{ panelOff && panelOff(); }catch(e){} panelOff = null; M.stopSound();
      const kids = [];
      if(tab === 'adhan'){
        fill(); kids.push(adList);
        if(M.openAdhanDl) kids.push(h('button.btn.tonal.block', {style:'margin-top:10px', onclick:()=>M.openAdhanDl(fill)}, M.ic('download'), 'تنزيل أصوات أذان أخرى'));
        if(V && V.list('adhan').length){ kids.push(h('div.section-h', 'المزيد من الشيوخ والمساجد')); const pn = V.panel('adhan', tabHost, fill); kids.push(pn); panelOff = pn._off; }
        kids.push(h('div.tiny.muted', {style:'margin:6px 2px 4px;line-height:1.8'}, 'مصادر التسجيلات: مستودعات GitHub عامة — Kiwifu/adhan-mp3 (دون ترخيص مُعلَن) وathany وMuezzin وPrayerTimes (MIT) وpraydo (Apache-2.0) وHomeAssistantAdzan (Unlicense)؛ والتراخيص تخص المستودعات لا أصل التسجيلات. يُشغَّل الأذان وقت الصلاة بتطبيق أندرويد، وداخل التطبيق إن كان مفتوحًا.'));
      }else if(tab === 'fajr'){
        const cur = M.cfg.fajrAdhan || '', fl = h('div.list.card');
        const opt = (id, name, sub, playId)=>{
          const on = cur === id;
          fl.append(h('div.item.snd', h('div.grow', h('div.t', name), h('div.s', sub)), playId ? (()=>{ const btn = h('button.icon-btn.tonal', {'aria-label':'تشغيل', onclick:()=>M.playSound(playId)}, M.ic('play')); rows.push([playId, btn]); return btn; })() : null,
            h('button.chip.ad-pick'+(on ? '.on' : ''), {onclick:()=>{ M.save('fajrAdhan', id); M.syncNative && M.syncNative(); M.toast(id ? 'تم اختيار أذان الفجر: '+name : 'أذان الفجر تلقائي'); mount(); }}, on ? 'هو المختار' : 'اختيار')));
        };
        opt('', 'تلقائي', 'نفس أذان الصلاة، ومع عبد الباسط ومشاري العفاسي يُستخدم أذان الفجر الخاص بهما');
        Object.values(M.FAJR_ADHAN).filter((v, i, a)=>a.indexOf(v) === i && !v.startsWith('dla_')).forEach(id=>opt(id, id === 'ad_abdulbasit_fajr' ? 'الشيخ عبد الباسط عبد الصمد — الفجر' : id === 'ad_mishary_fajr' ? 'الشيخ مشاري العفاسي — الفجر' : id, fmtD(DUR[id] || 0), id));
        kids.push(fl);
        if(V){ kids.push(h('div.section-h', 'المزيد من أذان الفجر')); const pn = V.panel('fajr', tabHost, ()=>mount()); kids.push(pn); panelOff = pn._off; }
        kids.push(h('div.tiny.muted', {style:'margin:6px 2px 4px;line-height:1.8'}, 'يُستخدم أذان الفجر المختار لصلاة الفجر فقط، وتبقى بقية الصلوات على الأذان المختار في تبويب «الأذان». الملفات موسومة «فجر» من مصدرها.'));
      }else{
        kids.push(h('div.small.muted', {style:'margin:0 4px 10px;line-height:1.9'}, 'صوت «الله أكبر» وحده بدل الأذان الكامل، مقتطع من أذانات التطبيق. عند اختياره يصير هو صوت تنبيه الأذان لكل الصلوات.'));
        const tl = h('div.list.card');
        M.TAKBEER.forEach(([id, n])=>{
          const on = M.cfg.adhan === id;
          const btn = h('button.icon-btn.tonal', {'aria-label':'تشغيل', onclick:()=>M.playSound(id)}, M.ic('play')); rows.push([id, btn]);
          tl.append(h('div.item.snd', h('div.grow', h('div.t', n), h('div.s', 'تكبير فقط')), btn,
            h('button.chip.ad-pick'+(on ? '.on' : ''), {onclick:()=>{ M.save('adhan', id); M.syncNative && M.syncNative(); M.toast('تم اختيار: '+n); mount(); }}, on ? 'هو المختار' : 'اختيار')));
        });
        kids.push(tl);
        if(M.TAKBEER.some(x=>x[0] === M.cfg.adhan)) kids.push(h('button.btn.ghost.sm', {style:'margin-top:8px', onclick:()=>{ M.save('adhan', 'ad_makkah'); M.syncNative && M.syncNative(); mount(); }}, 'العودة إلى الأذان الكامل'));
        if(V){ const pn = V.panel('takbeer', tabHost, ()=>mount()); kids.push(pn); panelOff = pn._off; }
      }
      tabHost.replaceChildren(...kids);
      for(let i = rows.length - 1; i >= 0; i--) if(!rows[i][1].isConnected) rows.splice(i, 1);
    };
    b.append(M.seg([['adhan', 'الأذان'], ['fajr', 'أذان الفجر'], ['takbeer', 'تكبير فقط']], tab, v=>{ tab = v; M.store.set('sndTab', v); mount(); }), h('div', {style:'height:12px'}), tabHost);
    const prevOff = offSnd; offSnd = ()=>{ try{ prevOff(); }catch(e){} try{ panelOff && panelOff(); }catch(e){} };
    mount();
    b.append(h('div.list.card', {style:'margin-top:10px'},
      h('div.item.static', h('div.grow', h('div.t', 'تشغيل الأذان في نسخة الويب'), h('div.s', 'عند دخول وقت الصلاة والصفحة مفتوحة')), M.switchEl(M.cfg.adhanInApp !== false, v=>M.save('adhanInApp', v)))));
    M.VOICES.forEach(([g, items])=>{
      b.append(h('div.section-h', g));
      const l = h('div.list.card'); items.forEach(([id, n])=>{
        const d = M.nfFor && M.nfFor(id);
        const chip = d ? h('button.chip', {onclick:()=>M.openNotifItem(d.id)}, M.ic('bell'), ' '+d.t) : null;
        l.append(row(id, n, chip));
      }); b.append(l);
    });
    const upd = ()=>rows.forEach(([id, btn])=>{ if(!btn.isConnected) return; const on = !A.paused && cur === id; btn.innerHTML = M.icon(on ? 'pause' : 'play'); btn.classList.toggle('on', on); });
    { const un = M.on('sound', upd); A.addEventListener('pause', upd); A.addEventListener('play', upd); const o2 = offSnd; offSnd = ()=>{ try{ o2(); }catch(e){} typeof un === 'function' && un(); A.removeEventListener('pause', upd); A.removeEventListener('play', upd); }; }
  }});
  return view;
};

})();
