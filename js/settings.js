/* ===== Settings: main page (grouped + searchable registry) and the sub-screens that live here ===== */
(function(){
'use strict';
const M = window.M, h = M.h;

const row = (title, sub, control)=>h('div.item.static'+(control && control.classList && control.classList.contains('seg') ? '.stack' : ''), h('div.grow', h('div.t', title), sub ? h('div.s', sub) : null), control);
const sec = (t)=>h('div.section-h', t);
const nav = (icon, title, sub, fn)=>M.item({icon, title, sub, onClick:fn, trail:M.ic('fwd')});
const S = M.SETSUB = M.SETSUB || {};
const sel = (opts, val, fn)=>h('select.field', {onchange:e=>fn(e.target.value)}, ...opts.map(([v, l])=>h('option', {value:v, selected:v === val}, l)));
const rg = (min, max, step, val, fn)=>h('input', {type:'range', min, max, step, value:val, oninput:e=>fn(+e.target.value)});

/* ---------------------------------------------------------------------------------------------
   Registry: one entry per row/screen: {title, sub, kw, open()}. The main page is built from the
   group rows; the search box filters group rows AND the deeper entries (single settings).
   Canonical home of every key (each setting appears once; other places only link to it):
     anim -> perf · digits/h24/fontScale/timeStyle -> fonts · hideFab/npAuto/bubble* -> navbar customizer
     iqamaOn/iqama/method/madhhab/adjust -> prayer sheet · adhanTone/keyStop/voice -> notifications
     hijriAdj/hijriType -> calendar sheet · homeBlocks.* -> cards · appIcon -> icon · dhikrNext -> adhkar pages
   --------------------------------------------------------------------------------------------- */
const OPEN = {
  look:()=>M.openSub('look'), perf:()=>M.openSub('perf'), heroimg:()=>M.openSub('heroimg'), icon:()=>M.openSub('icon'), widgets:()=>M.openSub('widgets'),
  prayer:()=>M.openSub('prayer'), prayerpage:()=>M.openSub('prayerpage'), notifs:()=>M.openNotifs(), sounds:()=>M.openSounds && M.openSounds(),
  alarm:()=>M.openSub('alarm'), focus:()=>M.openSub('focus'), live:()=>M.openSub('live'), psheet:()=>M.prayerSettings && M.prayerSettings(),
  quran:()=>M.openSub('quran'), downloads:()=>M.openDownloads(),
  adhkarset:()=>M.openSub('adhkarset'), randset:()=>M.openSub('randset'), counterset:()=>M.openSub('counterset'), duas:()=>M.openMyDuas(), audio:()=>M.openSub('audio'),
  date:()=>M.openSub('date'), calendar:()=>M.openCalendar(),
  home:()=>M.openSub('home'), cards:()=>M.openSub('cards'), navbar:tab=>M.openNavbarCfg && M.openNavbarCfg(tab), shortcuts:()=>M.openShortcutsEditor && M.openShortcutsEditor(),
  security:()=>M.openSecuritySettings && M.openSecuritySettings(), sleep:()=>M.openSleepTimer && M.openSleepTimer(),
  backup:()=>M.openSub('backup'), data:()=>M.openSub('data'),
  lang:()=>M.openSub('lang'), fonts:()=>M.openSub('fonts'), general:()=>M.openSub('general'),
  about:()=>M.openSub('about'), help:()=>M.openSub('help'), share:()=>M.share('تطبيق «المسلم»: مصحف، مواقيت، أذكار، قبلة وأكثر — بدون إعلانات.')
};
const method = ()=>(M.METHODS.find(m=>m[0] === M.cfg.method) || [, 'تلقائي'])[1] || '';
const onoff = v=>v ? 'مفعّل' : 'غير مفعّل';
const langName = ()=>((M.LANGS || []).find(l=>l[0] === M.lang) || [0, 'العربية'])[1];

/* [id, icon, title, sub (string | fn), screen, keywords] */
const GROUPS = [
  ['look', 't:palette', 'المظهر', [
    ['look', 't:palette', 'المظهر والخلفية', 'الواجهة، السمة، اللون، الخلفية', 'look', 'theme skin glass material dark light amoled accent color background wallpaper transparency solid contrast شفافية تباين ثيم داكن فاتح ليلي زجاج ماتيريال لون خلفية خلفيات'],
    ['perf', 't:bolt', 'الأداء والحركة', 'الحركات، السلاسة، الحواف المنحنية', 'perf', 'animation motion performance fps 120hz edge curved حركات انتقالات اداء بطارية'],
    ['heroimg', 't:photo', 'صورة بطاقة الصلاة', 'من جهازك أو صور جاهزة', 'heroimg', 'hero image prayer card picture photo صورة بطاقة'],
    ['icon', 't:app-window', 'أيقونة التطبيق', 'تغيير الأيقونة ولونها', 'icon', 'app icon launcher ايقونة'],
    ['widgets', 't:apps', 'الودجت (الأدوات)', 'تصاميم وألوان الودجت', 'widgets', 'widget home screen ودجت أدوات']]],
  ['prayer', 't:pray', 'الصلاة والإشعارات', [
    ['prayer', 't:pray', 'مواقيت الصلاة', ()=>M.location().name+' • '+method(), 'prayer', 'prayer times location city method gps mawaqit مواقيت موقع مدينة طريقة الحساب'],
    ['prayerpage', 't:clock-hour-4', 'صفحة الصلاة', 'الواجهة، الإقامة، أوقات النهي', 'prayerpage', 'prayer page simple iqama forbidden times صفحة صلاة نهي'],
    ['notifs', 't:bell-ringing', 'الإشعارات والأصوات', 'الأذان والتنبيهات والأذكار: لكل واحد صوته ووقته', 'notifs', 'notifications adhan azan sound reminders اشعارات اذان تنبيه صوت'],
    ['sounds', 't:volume', 'المكتبة الصوتية', 'استمع لكل أصوات الأذان والتنبيه', 'sounds', 'sounds library adhan muezzin اصوات مكتبة مؤذن'],
    ['alarm', 't:alarm', 'منبّه الصلاة', 'يرنّ حتى توقفه', 'alarm', 'alarm wake fajr منبه ايقاظ فجر'],
    ['focus', 't:moon-stars', 'وضع الهدوء وقت الصلاة', ()=>onoff(M.cfg.focus && M.cfg.focus.on), 'focus', 'silent vibrate focus quiet هدوء صامت اهتزاز'],
    ['live', 't:notification', 'الصلاة القادمة في الإشعارات', ()=>onoff(M.cfg.liveNotif), 'live', 'ongoing live notification now bar samsung live update countdown اشعار دائم حي شريط']]],
  ['quran', 't:book-2', 'القرآن', [
    ['quran', 't:book-2', 'المصحف', 'القراءة، الترجمة، التفسير، القارئ', 'quran', 'quran mushaf reading translation tafsir reciter recitation مصحف قراءة ترجمة تفسير قارئ تلاوة'],
    ['downloads', 't:cloud-download', 'التنزيلات', 'التلاوات والتفاسير وصفحات المصحف للعمل دون اتصال', 'downloads', 'downloads offline recitation tafsir pages تنزيل تحميل دون اتصال']]],
  ['adhkar', 't:circles-relation', 'الأذكار والأدعية', [
    ['adhkarset', 't:circles-relation', 'صفحات الأذكار', 'التشكيل، الشرح، الإغلاق التلقائي', 'adhkarset', 'adhkar azkar tashkeel diacritics morning evening اذكار تشكيل صباح مساء'],
    ['randset', 't:sparkles', 'الأذكار المنوعة', 'الخلفية، النص، التغيير التلقائي', 'randset', 'random dhikr background text auto change اذكار منوعة'],
    ['counterset', 's:counter', 'العدّاد', 'الصوت والاهتزاز والحجم', 'counterset', 'counter tasbih vibration sound size عداد مسبحة'],
    ['duas', 't:heart-handshake', 'أدعيتي', 'تذكير يومي بأدعيتك', 'duas', 'my duas personal supplications ادعيتي دعاء'],
    ['audio', 't:volume', 'الملفات الصوتية', 'الكتم، التكرار، السرعة', 'audio', 'audio mute repeat speed playback صوت كتم تكرار سرعة']]],
  ['cal', 't:calendar-month', 'التقويم والتاريخ', [
    ['date', 't:calendar-month', 'ضبط التاريخ', 'بداية الأسبوع، شكل العرض', 'date', 'date week start format hijri gregorian تاريخ بداية الاسبوع هجري ميلادي'],
    ['calendar', 't:calendar', 'التقويم الهجري', 'البلد، تعديل الشهر، نوع الحساب', 'calendar', 'hijri calendar adjust umm al qura country تقويم هجري ام القرى تعديل']]],
  ['nav', 't:home-2', 'الرئيسية والشريط', [
    ['home', 't:home-2', 'الواجهة الرئيسية', 'الاسم، الأوقات، الاختصارات', 'home', 'home screen name shortcuts رئيسية اسم اختصارات'],
    ['cards', 't:layout-dashboard', 'بطاقات الواجهة الرئيسية', 'إظهار وترتيب وإضافة', 'cards', 'cards order show hide بطاقات ترتيب اخفاء'],
    ['navbar', 't:apps', 'تخصيص الشريط والدائرة', 'الشريط السفلي، الدائرة العائمة، دائرة التشغيل', 'navbar', 'navigation bar bottom floating bubble now playing شريط سفلي دائرة عائمة']]],
  ['sec', 't:lock', 'الأمان والخصوصية', [
    ['security', 't:lock', 'الأمان وأدوات إضافية', 'قفل التطبيق، وضع كبار السن، مؤقت النوم', 'security', 'security app lock fingerprint senior large sleep timer privacy قفل بصمة كبار السن مؤقت نوم خصوصية']]],
  ['data', 't:cloud-upload', 'النسخ الاحتياطي والبيانات', [
    ['backup', 't:cloud-upload', 'نسخ احتياطية', 'تلقائية يوميًا واستعادة', 'backup', 'backup restore snapshot نسخ احتياطي استعادة'],
    ['data', 't:file-export', 'تصدير واستيراد البيانات', 'ملف واحد، وإعادة الضبط', 'data', 'export import reset data file تصدير استيراد اعادة ضبط']]],
  ['lang', 't:language', 'اللغة والأرقام', [
    ['lang', 't:language', 'اللغة', langName, 'lang', 'language english french turkish german spanish لغة'],
    ['fonts', 't:typography', 'الخط والأرقام', 'الحجم، الأرقام، نظام الوقت', 'fonts', 'font size digits numbers 12 24 hour time format خط حجم ارقام ساعة'],
    ['general', 't:settings-cog', 'الاهتزاز والصوت', 'مؤثرات التطبيق', 'general', 'haptics vibration sound effects اهتزاز صوت مؤثرات']]],
  ['about', 't:info-circle', 'حول التطبيق', [
    ['about', 't:info-circle', 'مزايا التطبيق', ()=>'الإصدار '+(M.VERSION || '1.0'), 'about', 'about features version licenses sources حول مزايا اصدار تراخيص مصادر'],
    ['help', 't:lifebuoy', 'مساعدة', 'أسئلة شائعة', 'help', 'help faq support مساعدة اسئلة'],
    ['share', 't:share-3', 'انشر التطبيق', 'ساهم في الأجر بمشاركته', 'share', 'share app نشر مشاركة']]]
];

/* single settings (deeper than a screen): [screen, title, keywords, tab?] — the screen opens and the row flashes */
const DEEP = [
  ['look', 'الواجهة', 'skin glass material liquid زجاج'], ['look', 'السمة', 'theme dark light amoled night داكن فاتح'], ['look', 'اللون الرئيسي', 'accent color لون'],
  ['look', 'خلفية الشاشة الرئيسية', 'wallpaper background خلفية صورة'], ['look', 'إلغاء الشفافية', 'transparency solid opaque blur glass شفافية معتم تمويه زجاج'], ['look', 'تباين عالٍ', 'high contrast accessibility readability border تباين وضوح حدود'], ['look', 'تعتيم الخلفية', 'dim'], ['look', 'تمويه الخلفية', 'blur'], ['look', 'نطاق الخلفية', 'background scope'],
  ['perf', 'الحركات والانتقالات', 'animations motion'], ['perf', 'الشاشة المنحنية الحواف', 'edge curved screen'], ['perf', 'شكل حركة فتح الصفحات', 'page transition'], ['perf', 'معدّل تحديث الشاشة', 'refresh rate hz'],
  ['fonts', 'حجم الخط', 'font size scale'], ['fonts', 'الأرقام', 'digits hindi arabic latin numerals'], ['fonts', 'نظام الوقت', '12 24 hour clock'], ['fonts', 'شكل وقت الصلاة', 'time style'],
  ['prayer', 'مواقيت معتمدة', 'official method auto'], ['prayer', 'تحديد الموقع الجغرافي', 'gps location'], ['prayer', 'تعديل اسم المدينة', 'city name'], ['prayer', 'جدول المواقيت', 'timetable monthly yearly csv print'],
  ['psheet', 'طريقة الحساب والمذهب والإقامة', 'calculation method madhhab hanafi iqama adjust minutes طريقة الحساب مذهب حنفي اقامة دقائق تعديل'],
  ['prayerpage', 'تفعيل الواجهة البسيطة', 'simple'], ['prayerpage', 'عرض وقت الإقامة', 'iqama'], ['prayerpage', 'عرض أوقات النهي', 'forbidden'], ['prayerpage', 'إظهار أيقونات الصلوات', 'icons'],
  ['notifs', 'الأذان الافتراضي', 'default adhan muezzin'], ['notifs', 'صوت الأذان مع إشعار الصلاة', 'adhan tone'], ['notifs', 'إيقاف الأذان بزر الصوت', 'volume key stop'], ['notifs', 'تنبيه قبل الصلاة', 'before prayer pre reminder'], ['notifs', 'إشعارات الأذكار', 'adhkar reminders morning evening'], ['notifs', 'الإشعارات القادمة', 'upcoming'],
  ['alarm', 'المدة قبل الصلاة', 'alarm before minutes'], ['focus', 'مدة الهدوء بعد الأذان', 'quiet duration'], ['live', 'الإشعار الدائم', 'ongoing notification'], ['live', 'إظهار الإقامة', 'iqama'],
  ['quran', 'نظام القراءة', 'pages scroll reading mode'], ['quran', 'الترجمة', 'translation'], ['quran', 'النقل الحرفي (Transliteration)', 'transliteration'], ['quran', 'التفسير', 'tafsir'], ['quran', 'القارئ', 'reciter'], ['quran', 'الانتقال للسورة التالية', 'auto next surah'], ['quran', 'حجم الخط في المصحف', 'mushaf font size'],
  ['adhkarset', 'إخفاء تشكيل الحروف', 'tashkeel diacritics'], ['adhkarset', 'تعطيل الإغلاق التلقائي للشاشة', 'keep awake screen'], ['adhkarset', 'إخفاء شرح الذكر', 'hide fadl'], ['adhkarset', 'ابدأ الأذكار من حيث انتهيت', 'resume'],
  ['randset', 'تغيير تلقائي', 'auto change'], ['randset', 'ابدأ التطبيق من الأذكار المنوعة', 'start random'], ['counterset', 'العدّ بالصوت', 'count sound'], ['counterset', 'العدّ بالاهتزاز', 'count vibration'], ['counterset', 'اذهب إلى الدعاء التالي بعد الانتهاء', 'auto next dua'],
  ['audio', 'تصغير المشغّل تلقائيًا', 'minimize player'], ['audio', 'كتم الملفات الصوتية', 'mute audio'], ['audio', 'تكرار الأدعية', 'repeat'], ['audio', 'سرعة التشغيل', 'speed'],
  ['date', 'إظهار التاريخ', 'show date'], ['date', 'بداية الأسبوع', 'week start saturday sunday monday'], ['date', 'شكل التاريخ', 'date format'],
  ['calendar', 'تعديل التاريخ الهجري', 'hijri adjust offset'],
  ['home', 'الاسم', 'user name greeting'], ['home', 'مع الشروق ومنتصف الليل والثلث الأخير', 'sunrise midnight last third'], ['home', 'متابعة العبادات أعلى الواجهة', 'worship top'], ['shortcuts', 'اختصاراتي', 'shortcuts'],
  ['navbar', 'الشريط السفلي', 'bottom bar nav', 'bar'], ['navbar', 'الدائرة العائمة', 'floating bubble', 'bub'], ['navbar', 'إظهار «تابع القراءة» في القائمة', 'continue reading fab', 'bub'], ['navbar', 'دائرة التشغيل', 'now playing player circle', 'np'],
  ['security', 'قفل التطبيق', 'app lock fingerprint'], ['security', 'وضع كبار السن', 'senior mode large text'], ['sleep', 'مؤقت النوم', 'sleep timer'],
  ['data', 'تصدير البيانات', 'export'], ['data', 'استيراد', 'import'], ['data', 'إعادة الضبط', 'reset factory'], ['backup', 'إنشاء نسخة احتياطية الآن', 'create backup'],
  ['general', 'الاهتزاز', 'haptics vibration'], ['general', 'الصوت', 'sound effects']
];
/* screens and single settings that only one platform supports (M.can in core.js): left out elsewhere */
const NEED = {icon:'appIcon', widgets:'widgets', alarm:'alarmRing', focus:'focusMode', live:'liveNotif'};
const NEED_DEEP = {'إيقاف الأذان بزر الصوت':'keyStop', 'قفل التطبيق':'appLock'};
GROUPS.forEach(g=>{ g[3] = g[3].filter(r=>!NEED[r[4]] || M.can(NEED[r[4]])); });
for(let i = DEEP.length - 1; i >= 0; i--){ const d = DEEP[i]; if((NEED[d[0]] && !M.can(NEED[d[0]])) || (NEED_DEEP[d[1]] && !M.can(NEED_DEEP[d[1]]))) DEEP.splice(i, 1); }
const SCREEN_TITLE = {}; GROUPS.forEach(g=>g[3].forEach(r=>{ SCREEN_TITLE[r[4]] = r[2]; }));
SCREEN_TITLE.psheet = 'مواقيت الصلاة'; SCREEN_TITLE.shortcuts = 'الواجهة الرئيسية'; SCREEN_TITLE.sleep = 'الأمان وأدوات إضافية';

const nrm = s=>String(M.normAr ? M.normAr(s) : s).toLowerCase();
function groupOf(screen){ for(const g of GROUPS) if(g[3].some(r=>r[4] === screen)) return g[2]; return ''; }
function entries(){
  const out = [];
  GROUPS.forEach(g=>g[3].forEach(r=>out.push({icon:r[1], title:r[2], sub:typeof r[3] === 'function' ? r[3]() : r[3], where:g[2], hay:nrm(r[2]+' '+g[2]+' '+r[5]), open:()=>OPEN[r[4]](), top:true})));
  DEEP.forEach(([scr, title, kw, tab])=>{
    if(scr === 'fonts' && title === 'الأرقام' && M.lang !== 'ar') return;   // digits are Latin in a Latin-script interface (choosing Arabic digits there makes the two digit observers fight)
    const g = groupOf(scr) || groupOf(scr === 'psheet' ? 'prayer' : scr === 'shortcuts' ? 'home' : scr === 'sleep' ? 'security' : scr);
    out.push({icon:'t:settings-cog', title, sub:(g ? g+' • ' : '')+(SCREEN_TITLE[scr] || ''), where:g, hay:nrm(title+' '+(SCREEN_TITLE[scr] || '')+' '+g+' '+(kw || '')), open:()=>{ OPEN[scr](tab); if(scr !== 'psheet' && scr !== 'shortcuts') setTimeout(()=>M.settingsFocus(title), 420); }});
  });
  return out;
}
/* scroll to a row by its title in the top-most settings view and flash it */
M.settingsFocus = function(title){
  try{
    const v = M.views[M.views.length - 1]; if(!v) return;
    const want = nrm(title); let hit = null;
    v.body.querySelectorAll('.item .t, .section-h, .bold, .rs-t, .small.bold').forEach(e=>{ if(!hit && nrm(e.textContent).includes(want)) hit = e; });
    if(!hit) return;
    const t = hit.closest('.item, .card, .section-h') || hit;
    t.scrollIntoView({block:'center', behavior:'smooth'}); t.classList.add('st-flash'); setTimeout(()=>t.classList.remove('st-flash'), 1900);
  }catch(e){}
};

const COLLAPSE = 'setCollapsed';
M.openSettings = function(section){
  let q = '', box, host, input, view, off = ()=>{};
  view = M.openView({title:'الإعدادات', id:'settings', build:b=>{
    input = h('input.field.st-in', {type:'search', placeholder:'ابحث في الإعدادات…', 'aria-label':'بحث في الإعدادات', enterkeyhint:'search', autocomplete:'off', oninput:e=>{ q = e.target.value; draw(); }});
    const clear = h('button.icon-btn.st-x.hide', {'aria-label':'مسح', onclick:()=>{ q = ''; input.value = ''; draw(); input.focus(); }}, M.ic('close'));
    b.append(h('div.st-search', h('div.st-sbox', M.ic('search'), input, clear)));
    host = h('div.st-host'); b.append(host);
    box = {clear};
    draw();
  }, onClose:()=>{ off(); }});
  off = M.on('viewclose', ()=>{ setTimeout(()=>{ if(!view.closed && M.views[M.views.length - 1] === view) draw(); }, 360); });
  function collapsed(){ const a = M.store.get(COLLAPSE, []); return Array.isArray(a) ? a : []; }
  function toggle(id, el, hd){
    const a = collapsed(), i = a.indexOf(id); if(i >= 0) a.splice(i, 1); else a.push(id); M.store.set(COLLAPSE, a);
    const shut = a.includes(id); el.classList.toggle('shut', shut); hd.setAttribute('aria-expanded', String(!shut));
  }
  function cn(icon, title, sub, fn){ return h('button.item', {onclick:fn}, h('span.lead', {html:M.icon(icon)}), h('div.grow', h('div.t', title), sub ? h('div.s', sub) : null), M.ic('fwd')); }
  function draw(){
    if(view && view.closed) return;
    host.innerHTML = '';
    const term = nrm(q.trim());
    box.clear.classList.toggle('hide', !term);
    if(term){
      const words = term.split(/\s+/).filter(Boolean);
      const seen = new Set(), res = [];
      entries().forEach(e=>{ if(words.every(w=>e.hay.includes(w))){ const k = e.title+'|'+e.where; if(!seen.has(k) || e.top){ seen.add(k); res.push(e); } } });
      res.sort((a, b)=>(b.top ? 1 : 0) - (a.top ? 1 : 0));
      if(!res.length){ host.append(h('div.empty', 'لا نتائج لهذا البحث')); return; }
      host.append(h('div.list.card', ...res.slice(0, 40).map(e=>cn(e.icon, e.title, e.sub, ()=>e.open()))));
      return;
    }
    const shut = collapsed();
    GROUPS.forEach(([id, icon, title, rows])=>{
      const list = h('div.list.card.st-list'+(shut.includes(id) ? '.shut' : ''), ...rows.map(r=>cn(r[1], r[2], typeof r[3] === 'function' ? r[3]() : r[3], ()=>OPEN[r[4]]())));
      const hd = h('button.st-gh', {'aria-expanded':String(!shut.includes(id)), onclick:()=>toggle(id, list, hd)}, h('span.st-gi', {html:M.icon(icon)}), h('span.grow', title), h('span.st-gn.small.muted', M.n(rows.length)), h('span.st-gc', M.ic('chevDown')));
      host.append(hd, list);
    });
  }
  if(section) M.openSub(section);
  return view;
};
M.settingsEntries = entries;   // used by the test-suite

  /* ---- look ---- */
  function skinCard(id, label, desc){
    const on = M.cfg.skin === id;
    const c = h('button.skin-card'+(on ? '.on' : ''), {'data-skin-p':id, onclick:()=>{ M.save('skin', id); M.$$('.skin-card').forEach(x=>x.classList.toggle('on', x.dataset.skinP === id)); M.haptic(14); }},
      h('div.skin-prev.sp-'+id, h('i.sp-card'), h('i.sp-card.s'), h('div.sp-bar', h('i'), h('i'), h('i'))),
      h('div.bold', label), h('div.tiny.muted', desc));
    return c;
  }
  function look(b){
    /* a live preview of the current look, then the choices in order of how often they change */
    const prev = h('div.lk-prev', h('div.lk-phone', h('div.lk-bar'), h('div.lk-hero', h('i'), h('i.s')), h('div.lk-row', h('i'), h('i'), h('i')), h('div.lk-card'), h('div.lk-nav', h('i.on'), h('i'), h('i'), h('i'))),
      h('div.grow', h('div.lk-k', 'المظهر الحالي'), h('div.lk-t.title-font', (M.cfg.skin === 'material' ? 'Material You' : 'Liquid Glass')), h('div.lk-s', ({auto:'تلقائي حسب الجهاز', light:'فاتح', dark:'داكن', amoled:'أسود AMOLED'})[M.cfg.theme] || '')));
    b.append(prev);
    b.append(sec('السمة'));
    const TH = [['auto', 'تلقائي', 's:clock'], ['light', 'فاتح', 's:sun'], ['dark', 'داكن', 's:moon'], ['amoled', 'أسود', 's:crescent']];
    const tg = h('div.lk-themes', ...TH.map(([k, l, ic])=>h('button.lk-th'+(M.cfg.theme === k ? '.on' : ''), {'data-k':k, onclick:()=>{ M.save('theme', k); M.$$('.lk-th', tg).forEach(x=>x.classList.toggle('on', x.dataset.k === k)); prev.querySelector('.lk-s').textContent = l; }}, h('span', {html:M.icon(ic)}), h('b', l))));
    b.append(tg);
    b.append(sec('اللون الرئيسي'));
    const sw = h('div.swatches');
    M.ACCENTS.forEach(([c, n])=>sw.append(h('button.swatch'+(M.cfg.accent === c ? '.on' : ''), {style:'--c:'+c, 'aria-label':n, onclick:function(){ M.save('accentSrc', 'user'); M.save('accent', c); M.$$('.swatch', sw).forEach(x=>x.classList.remove('on')); this.classList.add('on'); M.haptic(8); }})));
    const pick = h('input', {type:'color', value:M.cfg.accent, class:'swatch-pick', oninput:e=>{ M.save('accentSrc', 'user'); M.save('accent', e.target.value); M.$$('.swatch', sw).forEach(x=>x.classList.remove('on')); }});
    sw.append(h('label.swatch.custom', {'aria-label':'لون مخصص'}, M.ic('plus'), pick));
    b.append(sw);
    b.append(h('div.list.card', {style:'margin-top:12px'}, M.item({icon:'sparkle', title:'مطابقة لون أيقونة التطبيق', sub:M.cfg.accentSrc === 'user' ? 'اضغط للعودة إلى لون الأيقونة المختارة' : 'مفعّل — يتغيّر اللون مع الأيقونة', onClick:()=>{ let i = M.cfg.appIcon || 10; try{ if(window.Android && Android.getAppIcon) i = Android.getAppIcon() || i; }catch(e){} M.setIconAccent(i); M.$$('.swatch', sw).forEach(x=>x.classList.remove('on')); M.toast('لون التطبيق يطابق الأيقونة الآن'); }})));
    if(window.Android && window.Android.getSystemAccent){
      let sa = ''; try{ sa = window.Android.getSystemAccent(); }catch(e){}
      if(/^#[0-9a-f]{6}$/i.test(sa)) b.append(h('div.list.card', {style:'margin-top:12px'}, M.item({icon:'palette', title:'ألوان من خلفية الجهاز', sub:'Material You الديناميكي (أندرويد ١٢+)', onClick:()=>{ M.save('accentSrc', 'user'); M.save('accent', sa); M.toast('تم تطبيق ألوان النظام'); }})));
    }
    b.append(sec('الواجهة'));
    const g = h('div.grid2.skin-grid');
    g.append(skinCard('glass', 'Liquid Glass', 'زجاج شفاف وسلس'), skinCard('material', 'Material You', 'ألوان متكيّفة وأشكال ناعمة'));
    b.append(g);
    b.append(h('div.card.pad', {style:'margin-top:10px'}, h('div.row-flex', h('div.grow', h('div.bold', 'الواجهة التلقائية'), h('div.small.muted', 'Liquid Glass على iOS وMaterial You على Android')), M.switchEl(M.cfg.skin === 'auto', v=>{ M.save('skin', v ? 'auto' : M.resolveSkin()); M.$$('.skin-card').forEach(x=>x.classList.toggle('on', !v && x.dataset.skinP === M.resolveSkin())); })),
      h('div.tiny.muted', {style:'margin-top:6px'}, 'يمكنك اختيار أي واجهة على أي نظام تشغيل.')));
    b.append(sec('الشفافية والتباين'));
    b.append(h('div.list.card',
      row('إلغاء الشفافية', 'بطاقات وقوائم وشريط سفلي ودائرة عائمة معتمة دون تمويه', M.switchEl(!!M.cfg.solid, v=>M.save('solid', v))),
      row('تباين عالٍ', 'نص أغمق وحدود أوضح، وخلفيات أقل شفافية عند تفعيل الشفافية', M.switchEl(!!M.cfg.contrast, v=>M.save('contrast', v)))));
    b.append(sec('خلفية الشاشة الرئيسية'));
    bgPicker(b);
    b.append(h('div.list.card', {style:'margin-top:12px'}, nav('t:bolt', 'الأداء والحركة', 'الحركات والانتقالات والتأثيرات', ()=>M.openSub('perf'))));
  }
  function bgPicker(b){
    const grid = h('div.bg-grid');
    const cur = ()=>M.cfg.bg;
    function tile(id, label, style, extra){
      const t = h('button.bg-t'+(cur() === id ? '.on' : ''), {style, onclick:()=>{ if(id === 'image' && !M.cfg.bgImage){ pickImg(); return; } if(id.startsWith('photo:') || id === 'video'){ M.save({bg:id, bgDim:Math.max(M.cfg.bgDim || 0, 0.3)}); } else M.save('bg', id); mark(); M.haptic(8); }}, extra, h('span', label));
      t.dataset.id = id; return t;
    }
    function mark(){ M.$$('.bg-t', grid).forEach(x=>x.classList.toggle('on', x.dataset.id === cur())); }
    grid.append(tile('aurora', 'أورورا', 'background:linear-gradient(135deg,var(--pc),var(--s2))'), tile('none', 'سادة', 'background:var(--s1)'));
    M.PHOTOS.forEach(([n, l])=>grid.append(tile('photo:'+n, l, 'background:url(img/bg/t'+n+'.jpg) center/cover')));
    grid.append(tile('video', 'متحركة', 'background:url(img/bg/t9.jpg) center/cover', M.ic('play')));
    Object.entries(M.GRADIENTS).forEach(([k, [n, css]])=>grid.append(tile('gradient:'+k, n, 'background:'+css)));
    Object.entries(M.SCENES).forEach(([k, [n, fn]])=>grid.append(tile('scene:'+k, n, 'background:url("data:image/svg+xml;utf8,'+encodeURIComponent(fn())+'") center/cover')));
    const imgT = tile('image', 'صورتي', M.cfg.bgImage ? 'background:url('+M.cfg.bgImage+') center/cover' : 'background:var(--s2)', M.cfg.bgImage ? null : M.ic('plus'));
    grid.append(imgT);
    b.append(grid);
    const file = h('input', {type:'file', accept:'image/*', class:'hide', onchange:async e=>{
      const f = e.target.files[0]; if(!f) return;
      try{ const url = await M.imageToDataURL(f, 1400, .82); M.save({bgImage:url, bg:'image'}); imgT.style.background = 'url('+url+') center/cover'; imgT.firstChild && imgT.querySelector('svg') && imgT.querySelector('svg').remove(); mark(); M.toast('تم تعيين الخلفية'); }
      catch(err){ M.toast('تعذّر قراءة الصورة'); }
    }});
    function pickImg(){ file.click(); }
    b.append(file, h('div.row-flex.gap-s', {style:'margin-top:10px;flex-wrap:wrap'},
      h('button.btn.sm', {onclick:()=>M.openOnlineBg(url=>{ M.save({bgImage:url, bg:'image', bgDim:Math.max(M.cfg.bgDim || 0, 0.3)}); imgT.style.background = 'url('+url+') center/cover'; mark(); })}, M.ic('download'), 'تنزيل خلفيات'),
      h('button.btn.tonal.sm', {onclick:pickImg}, M.ic('image'), 'اختيار صورة من المعرض'),
      M.cfg.bgImage ? h('button.btn.ghost.sm', {onclick:()=>{ M.save({bgImage:null, bg:'aurora'}); mark(); M.toast('تمت إزالة الصورة'); }}, M.ic('trash'), 'إزالة صورتي') : null));
    const rg = (min, max, step, val, fn)=>h('input', {type:'range', min, max, step, value:val, oninput:e=>fn(+e.target.value)});
    b.append(h('div.list.card', {style:'margin-top:12px'},
      row('تعتيم الخلفية', 'لتحسين وضوح النصوص', rg(0, .8, .05, M.cfg.bgDim, v=>M.save('bgDim', v))),
      row('تمويه الخلفية', '', rg(0, 24, 1, M.cfg.bgBlur, v=>M.save('bgBlur', v)))));
    b.append(h('div.card.pad', {style:'margin-top:10px'}, h('div.bold', 'نطاق الخلفية'), h('div', {style:'margin-top:8px'}, M.seg([['home','الرئيسية فقط'],['all','كل الشاشات']], M.cfg.bgScope, v=>M.save('bgScope', v)))));
  }


/* ---------------------------------------------------------------------------------------------
   Sub-screens that live in this file (the others are in settings2.js)
   --------------------------------------------------------------------------------------------- */
S.look = {title:'المظهر والخلفية', build(b){ look(b); }};
S.quran = {title:'المصحف', build(b){ quran(b); }};
S.prayer = {title:'مواقيت الصلاة', build(b){ prayer(b); }};
S.home = {title:'الواجهة الرئيسية', build(b){ homeCfg(b); }};
S.general = {title:'الاهتزاز والصوت', build(b){ general(b); }};
S.data = {title:'تصدير واستيراد', build(b){ data(b); }};
S.about = {title:'مزايا التطبيق', build(b){ about(b); }};

/* ---- quran ---- */
function quran(b){
  b.append(sec('نظام القراءة'));
  b.append(M.seg([['pages','نظام الصفحات'],['scroll','التمرير الطولي']], M.cfg.readMode, v=>{ M.save('readMode', v); }));
  b.append(h('div.tiny.muted', {style:'margin:6px 2px'}, 'يمكنك التبديل بينهما في أي وقت من داخل المصحف أيضًا. وفي المصحف زر الإعدادات للمظهر والإطار والتقليب والتنزيل.'));
  b.append(sec('الترجمة والتفسير'));
  b.append(h('div.list.card',
    row('الترجمة', 'تظهر تحت الآيات في التمرير الطولي وعند اللمس المطوّل', sel(M.TRANSLATIONS, M.cfg.translation, v=>M.save('translation', v))),
    row('النقل الحرفي (Transliteration)', '', M.switchEl(M.cfg.translit, v=>M.save('translit', v))),
    row('التفسير', 'يتطلب الإنترنت أول مرة ثم يُحفظ', sel(M.TAFSIRS, M.cfg.tafsir, v=>M.save('tafsir', v)))));
  b.append(sec('التلاوة'));
  b.append(h('div.list.card',
    row('القارئ', '', sel(M.RECITERS.map(r=>[r[0], r[1]]), M.cfg.reciter, v=>M.save('reciter', v))),
    row('الانتقال للسورة التالية', 'يكمل التلاوة تلقائيًا بعد نهاية السورة', M.switchEl(M.cfg.autoNext !== false, v=>M.save('autoNext', v))),
    row('تتبّع الصفحة مع التلاوة', '', M.switchEl(M.cfg.pageAudioFollow !== false, v=>M.save('pageAudioFollow', v)))));
  b.append(sec('الخط'));
  b.append(h('div.card.pad', h('div.small.muted', 'حجم الخط في المصحف'), rg(.8, 1.4, .05, M.cfg.qSize || 1, v=>M.save('qSize', v))));
  b.append(h('div.list.card', {style:'margin-top:12px'}, nav('t:cloud-download', 'التنزيلات', 'التلاوات والتفاسير وصفحات المصحف', ()=>M.openDownloads())));
}

/* ---- prayer ---- */
function prayer(b){
  const loc = M.location();
  b.append(sec('الموقع الجغرافي الحالي'));
  b.append(h('div.list.card', h('button.item', {onclick:()=>M.locationSheet && M.locationSheet()}, h('span.lead', {html:M.icon('pin')}), h('div.grow', h('div.t', 'تحديد الموقع الجغرافي'), h('div.s', loc.name), h('div.s.num', 'خط العرض '+M.n((+loc.lat).toFixed(4))+' • الطول '+M.n((+loc.lng).toFixed(4)))), M.ic('fwd')),
    nav('note', 'تعديل اسم المدينة', loc.name, async()=>{ const n = await M.prompt('اسم المدينة', loc.name, 'المدينة'); if(n){ M.save('loc', Object.assign({}, M.location(), {name:n})); M.toast('تم'); } })));
  b.append(sec('طريقة الحساب'));
  b.append(h('div.list.card',
    row('مواقيت معتمدة', 'يستخدم الجهة الرسمية المناسبة لموقعك تلقائيًا (يمكنك إيقافه لاختيار الطريقة يدويًا)', M.switchEl(M.cfg.method === 'auto', v=>{ M.save('method', v ? 'auto' : (M.methodKey ? M.methodKey() : 'egypt')); })),
    nav('clock', 'ضبط مواقيت الصلاة', 'طريقة الحساب، المذهب، الإقامة، التعديل بالدقائق', ()=>M.prayerSettings && M.prayerSettings())));
  b.append(sec('جداول'));
  b.append(h('div.list.card', nav('calendar', 'جدول المواقيت', 'شهري وسنوي — تصدير CSV وطباعة', ()=>{ M.views.slice().forEach(v=>v.close()); M.setTab('prayer'); setTimeout(()=>{ const x = document.querySelector('#screen-prayer .pr-sched'); x && x.click(); }, 300); })));
  b.append(h('div.tiny.muted', {style:'margin:8px 2px'}, window.Android ? 'التنبيهات مجدولة على مستوى النظام وتعمل والتطبيق مغلق. وضبطها من «الإشعارات والأصوات».' : 'في المتصفح تعمل التنبيهات والتطبيق مفتوح فقط. وضبطها من «الإشعارات والأصوات».'));
}

/* ---- home ---- */
function homeCfg(b){
  b.append(sec('الاسم'));
  b.append(h('input.field', {value:M.cfg.userName || '', placeholder:'اسمك (اختياري) لتحيتك في الرئيسية', oninput:e=>M.save('userName', e.target.value)}));
  b.append(sec('مواقيت الصلاة في الرئيسية'));
  b.append(h('div.list.card',
    row('مع الشروق ومنتصف الليل والثلث الأخير', '', M.switchEl(!!M.cfg.homeSun, v=>M.save('homeSun', v))),
    row('مع أيقونات الصلوات', '', M.switchEl(!!M.cfg.homeIcons, v=>M.save('homeIcons', v)))));
  b.append(sec('أعلى الواجهة'));
  b.append(h('div.list.card', row('متابعة العبادات أعلى الواجهة', '', M.switchEl(!!M.cfg.worshipTop, v=>M.save('worshipTop', v)))));
  b.append(sec('الاختصارات والبطاقات'));
  b.append(h('div.list.card',
    nav('star', 'اختصاراتي', 'اختر الأقسام التي تظهر في الرئيسية', ()=>M.openShortcutsEditor()),
    nav('grid', 'بطاقات الواجهة الرئيسية', 'إظهار وترتيب وإضافة (ومنها مواقيت الصلاة)', ()=>M.openSub('cards')),
    nav('t:apps', 'تخصيص الشريط والدائرة', 'الشريط السفلي والدائرة العائمة و«تابع القراءة»', ()=>M.openNavbarCfg && M.openNavbarCfg())));
  b.append(h('div.tiny.muted', {style:'margin-top:14px'}, 'والوصول لكل الأقسام من «المزيد ← جميع الأقسام».'));
}

/* ---- haptics / sound ---- */
function general(b){
  b.append(h('div.list.card',
    row('الاهتزاز', 'اهتزاز خفيف عند اللمس والعدّ', M.switchEl(M.cfg.haptics, v=>M.save('haptics', v))),
    row('الصوت', 'أصوات المسبحة والتنبيهات', M.switchEl(M.cfg.sound, v=>M.save('sound', v)))));
  b.append(h('div.list.card', {style:'margin-top:12px'}, nav('volume', 'الملفات الصوتية', 'الكتم، التكرار، السرعة', ()=>M.openSub('audio')), nav('s:counter', 'العدّاد', 'الصوت والاهتزاز والحجم', ()=>M.openSub('counterset'))));
}

  /* ---- data ---- */
  function data(b){
    b.append(h('div.card.pad', h('div.bold', 'تصدير البيانات'), h('div.small.muted', 'العلامات والملاحظات والجدول والإعدادات في ملف واحد.'),
      h('button.btn.sm', {style:'margin-top:8px', onclick:()=>{
        const o = {}; M.store.keys().forEach(k=>{ if(!['snapshots', 'rbList', 'mqRadios', 'wtaf'].includes(k)) o[k] = M.store.get(k); }); if(o.settings) delete o.settings.bgImage;
        const txt = JSON.stringify({app:'muslim', v:1, data:o}), name = 'muslim-backup-'+M.dkey()+'.json';
        if(window.Android && window.Android.saveText){ window.Android.saveText(name, txt); return; }
        const blob = new Blob([txt], {type:'application/json'});
        const a = h('a', {href:URL.createObjectURL(blob), download:name}); document.body.append(a); a.click(); a.remove();
      }}, M.ic('download'), 'تصدير')));
    const file = h('input', {type:'file', accept:'application/json,.json', class:'hide', onchange:async e=>{
      try{ const f = e.target.files[0]; if(!f || f.size > 12 * 1024 * 1024) throw 0; const j = JSON.parse(await f.text()); if(!j || j.app !== 'muslim' || !j.data || typeof j.data !== 'object' || Array.isArray(j.data)) throw 0; { const d = j.data; if(d.settings && (typeof d.settings !== 'object' || Array.isArray(d.settings))) delete d.settings; if(d.settings && d.settings.reciter != null && !M.RECITERS.some(r=>r[0] === d.settings.reciter)) delete d.settings.reciter; if(d.tvCustom && !Array.isArray(d.tvCustom)) delete d.tvCustom; }
        Object.entries(j.data).forEach(([k, v])=>{ if(/^[\w:.\-]{1,64}$/.test(k) && k !== '__proto__' && typeof v !== 'function') M.store.set(k, v); }); M.toast('تم الاستيراد — أعد تشغيل التطبيق'); setTimeout(()=>location.reload(), 900); }catch(x){ M.toast('ملف غير صالح'); }
    }});
    b.append(h('div.card.pad', {style:'margin-top:12px'}, h('div.bold', 'استيراد'), h('button.btn.tonal.sm', {style:'margin-top:8px', onclick:()=>file.click()}, 'اختيار ملف'), file));
    b.append(h('div.card.pad', {style:'margin-top:12px'}, h('div.bold', 'إعادة الضبط'), h('div.small.muted', 'يعيد الإعدادات للافتراضي دون حذف بياناتك.'),
      h('button.btn.danger.sm', {style:'margin-top:8px', onclick:async()=>{ if(await M.confirm('إعادة جميع الإعدادات للافتراضي؟', 'إعادة')){ M.store.del('settings'); location.reload(); } }}, 'إعادة الضبط')));
  }
  function about(b){
    const F = [
      ['s:mushaf', 'المصحف الشريف', ['مصحف المدينة بصفحاته الحقيقية (٦٠٤ صفحات) برواية حفص', 'قراءة بالصفحات أو بالتمرير، وسبعة أطر لأسماء السور وألوان للصفحة', 'تلاوة لعدد من القرّاء مع تكرار الآية وتحديد مدى للحفظ', 'تفاسير وترجمات، وبحث في الآيات، وعلامات وتظليل وملاحظات', 'ختمات بخطة يومية وإحصاءات للقراءة، وتحميل المصحف للقراءة دون اتصال']],
      ['s:mosque', 'الصلاة والقبلة', ['مواقيت دقيقة بعدة طرق حساب والمذاهب الأربعة لوقت العصر', 'أذان بأصوات متعددة وتنبيه قبل الصلاة ووقت الإقامة لكل صلاة', 'منبّه للصلاة ووضع الهدوء (اهتزاز تلقائي وقت الصلاة)', 'بوصلة القبلة وخريطة توضّح الاتجاه والمسافة إلى الكعبة', 'ودجت للشاشة الرئيسية بمواقيت اليوم']],
      ['s:beads', 'الأذكار والأدعية', ['أذكار الصباح والمساء والنوم وبعد الصلاة بعدّاد لكل ذكر', 'مكتبة أدعية مبوّبة، والرقية الشرعية، وأسماء الله الحسنى', 'مسبحة إلكترونية بأهداف وإحصاءات', 'أذكارك وأدعيتك الخاصة والمفضلة', 'تذكيرات صوتية بالذكر والصلاة على النبي ﷺ في أوقات تختارها']],
      ['s:tracker', 'متابعة العبادات', ['جدول محاسبة يومي وأسبوعي بالنقاط والأوسمة', 'قضاء الصلوات والصيام', 'سلاسل الأيام المتتالية وإنجازات الأسابيع', 'طباعة الجدول ومشاركته']],
      ['s:crescent', 'المواسم والمناسبات', ['تقويم هجري بالمناسبات وأيام الصيام ومحوّل للتاريخ وأطوار القمر', 'رمضان والسحور والإفطار، ويوم الجمعة، والحج والعمرة خطوة بخطوة', 'ركن للأطفال: الوضوء والصلاة وقصص ومسابقة']],
      ['s:radio', 'الصوتيات والبث', ['إذاعة القرآن الكريم من القاهرة وإذاعات مقسّمة إلى أقسام', 'بث مباشر من الحرمين', 'مشغّل واحد يستمر في الخلفية']],
      ['s:look', 'التخصيص', ['شكلان للواجهة: زجاجي وماتيريال، مع الوضع الداكن', 'لون التطبيق يتبع الأيقونة التي تختارها، أو لون من اختيارك', 'خلفيات وصور لبطاقة الصلاة، وحجم الخط وشكل الأرقام', 'ترتيب بطاقات الرئيسية واختصاراتك']],
      ['s:shield', 'الخصوصية والأمان', ['بياناتك محفوظة على جهازك، دون حسابات ودون إعلانات', 'يعمل دون إنترنت في معظم أقسامه', 'اتصال مشفّر فقط عند الحاجة للإنترنت', 'نسخ احتياطي واستعادة بملف تحتفظ به أنت']]
    ];
    b.append(h('div.card.pad.center.ab-hero', h('img.ab-logo', {src:'img/icons/'+(M.cfg.appIcon || 10)+'.jpg', alt:''}), h('div.title-font.bold', {style:'font-size:1.5rem'}, 'المسلم'), h('div.small.muted', 'الإصدار '+(M.VERSION || '1.0.0'))));
    F.forEach(([ic, t, items])=>b.append(h('div.card.pad.ab-f', h('div.ab-h', h('span.lead', {html:M.icon(ic)}), h('div.bold', t)), h('ul.ab-l', ...items.map(x=>h('li', x))))));
    const lic = h('div.tiny.muted.hide', {style:'line-height:1.9;padding:0 16px 14px'}, 'صفحات المصحف: خطوط QCF4 لمصحف المدينة (مجمع الملك فهد، نسخة ١٤٤١) عبر مشروع quran-qcf4، تُحمَّل عند الحاجة ولا تُضمَّن في التطبيق. المواقيت: مكتبة adhan. التلاوات: everyayah.com. التفاسير: tafsir_api. الإذاعات: mp3quran.net. الخرائط: Google Maps وOpenStreetMap. الأيقونات: Hugeicons (MIT). الخطوط: Readex Pro وEl Messiri وAmiri Quran (OFL). مشغّل البث: hls.js (Apache-2.0). الخرائط البديلة: Leaflet (BSD). الأذكار من حصن المسلم وكتب السنة مع ذكر المصدر ودرجة الحديث.');
    b.append(h('div.list.card', {style:'margin-top:12px'}, M.item({icon:'info', title:'المصادر والتراخيص', onClick:()=>lic.classList.toggle('hide'), trail:M.ic('chevDown')}), lic),
      h('div.tiny.muted.center', {style:'margin:14px 8px'}, 'هذا التطبيق وسيلة مساعدة وليس بديلًا عن الرجوع إلى أهل العلم في المسائل الشرعية.'));
  }


})();
