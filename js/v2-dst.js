/* التوقيت الصيفي والشتوي: حالة كل دولة الآن، موعد التغيير القادم، وضبط يدوي لعرض أوقات الصلاة */
(function(){
const h = M.h;
const NAMES = {'Africa/Cairo':'مصر', 'Asia/Riyadh':'السعودية', 'Asia/Jerusalem':'القدس (فلسطين)', 'Asia/Gaza':'غزة', 'Asia/Hebron':'الضفة الغربية', 'Asia/Amman':'الأردن', 'Asia/Damascus':'سوريا', 'Asia/Beirut':'لبنان', 'Asia/Baghdad':'العراق', 'Asia/Kuwait':'الكويت', 'Asia/Bahrain':'البحرين', 'Asia/Qatar':'قطر', 'Asia/Dubai':'الإمارات', 'Asia/Muscat':'عُمان', 'Asia/Aden':'اليمن', 'Africa/Khartoum':'السودان', 'Africa/Tripoli':'ليبيا', 'Africa/Tunis':'تونس', 'Africa/Algiers':'الجزائر', 'Africa/Casablanca':'المملكة المغربية', 'Africa/Nouakchott':'موريتانيا', 'Europe/Istanbul':'تركيا', 'Europe/London':'بريطانيا', 'Europe/Paris':'فرنسا', 'Europe/Berlin':'ألمانيا', 'Europe/Madrid':'إسبانيا', 'Europe/Rome':'إيطاليا', 'Europe/Brussels':'بلجيكا', 'Europe/Amsterdam':'هولندا', 'Europe/Stockholm':'السويد', 'Europe/Moscow':'روسيا', 'America/New_York':'أمريكا (الشرق)', 'America/Toronto':'كندا (تورنتو)', 'America/Los_Angeles':'أمريكا (الغرب)', 'America/Chicago':'أمريكا (الوسط)', 'Asia/Karachi':'باكستان', 'Asia/Dhaka':'بنغلاديش', 'Asia/Kolkata':'الهند', 'Asia/Jakarta':'إندونيسيا', 'Asia/Kuala_Lumpur':'ماليزيا', 'Asia/Singapore':'سنغافورة', 'Asia/Tehran':'إيران', 'Australia/Sydney':'أستراليا (سيدني)', 'Australia/Melbourne':'أستراليا (ملبورن)'};
const offs = new Map();
function off(tz, d){   // UTC offset of tz at instant d, in minutes
  const k = tz+'|'+Math.floor(d.getTime() / 600000);
  if(offs.has(k)) return offs.get(k);
  let v = 0;
  try{
    const p = new Intl.DateTimeFormat('en-US', {timeZone:tz, hourCycle:'h23', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit'}).formatToParts(d).reduce((o, x)=>(o[x.type] = +x.value, o), {});
    v = Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  }catch(e){}
  if(offs.size > 4000) offs.clear();
  offs.set(k, v); return v;
}
const info = {};
function zone(tz){
  if(info[tz]) return info[tz];
  const now = new Date(), y = now.getFullYear();
  const a = off(tz, new Date(Date.UTC(y, 0, 15, 12))), b = off(tz, new Date(Date.UTC(y, 6, 15, 12)));
  const std = Math.min(a, b), uses = a !== b;
  // next transition within ~13 months
  let next = null;
  if(uses){
    let prev = off(tz, now);
    for(let i = 1; i <= 400 && !next; i++){
      const d = new Date(now.getTime() + i * 864e5), o = off(tz, d);
      if(o !== prev){
        let lo = new Date(d.getTime() - 864e5), hi = d;
        for(let k = 0; k < 14; k++){ const mid = new Date((lo.getTime() + hi.getTime()) / 2); if(off(tz, mid) === prev) lo = mid; else hi = mid; }
        next = {at:hi, to:o, delta:o - prev};
      }
      prev = o;
    }
  }
  return info[tz] = {tz, uses, std, now:off(tz, now), next};
}
const isDst = (tz, d)=>off(tz, d) > zone(tz).std;
M.dstZone = zone;
function adjust(d, tz){
  const mode = M.cfg.dstMode;
  if(!mode || mode === 'auto' || !(d instanceof Date)) return d;
  const loc = M.location && M.location(); if(!loc || (tz && tz !== loc.tz)) return d;
  const z = zone(loc.tz); if(!z.uses) return d;
  const dst = isDst(loc.tz, d);
  if(mode === 'summer' && !dst) return new Date(d.getTime() + 36e5);
  if(mode === 'winter' && dst) return new Date(d.getTime() - 36e5);
  return d;
}
const baseFmt = M.fmtTime;
M.fmtTime = function(d, tz){ return baseFmt(adjust(d, tz), tz); };

const fmtDate = d=>{ try{ return d.toLocaleDateString('ar-EG', {day:'numeric', month:'long', year:'numeric'}); }catch(e){ return d.toDateString(); } };
const gmt = m=>'GMT'+(m < 0 ? '−' : '+')+M.n(Math.floor(Math.abs(m) / 60))+(Math.abs(m) % 60 ? ':'+M.n(M.pad(Math.abs(m) % 60)) : '');

function open(){
  M.openView({id:'dst', title:'التوقيت الصيفي والشتوي', build:(body)=>{
    const loc = M.location(), zc = zone(loc.tz);
    const cur = h('div'), list = h('div.dst-list');
    function drawCur(){
      cur.replaceChildren();
      const mode = M.cfg.dstMode || 'auto', z = zone(loc.tz);
      cur.append(h('div.card.pad.dst-now',
        h('div.small.muted', 'موقعك الحالي'), h('div.bold.dst-city', loc.name+' — '+(NAMES[loc.tz] || loc.tz)),
        h('div.dst-st', z.uses ? (isDst(loc.tz, new Date()) ? 'التوقيت الصيفي مطبّق الآن' : 'التوقيت الشتوي (القياسي) مطبّق الآن') : 'لا تطبّق هذه المنطقة تغيير التوقيت الصيفي'),
        h('div.small.muted', z.uses && z.next ? 'التغيير القادم: '+fmtDate(z.next.at)+' ('+(z.next.delta > 0 ? 'تقديم الساعة' : 'تأخير الساعة')+' ساعة)' : '')));
      if(z.uses){
        const seg = h('div.dst-seg');
        [['auto', 'تلقائي'], ['summer', 'صيفي'], ['winter', 'شتوي']].forEach(([k, t])=>seg.append(h('button.chip'+(mode === k ? '.on' : ''), {onclick:()=>{ M.save('dstMode', k); drawCur(); M.emit && M.emit('dstchange'); try{ M.toast(k === 'auto' ? 'تلقائي: حسب توقيت جهازك' : 'تم ضبط عرض الأوقات'); }catch(e){} }}, t)));
        cur.append(h('div.small.bold', {style:'margin:14px 0 6px'}, 'عرض أوقات الصلاة'), seg,
          h('div.small.muted', {style:'margin-top:8px'}, 'التلقائي هو الأفضل ويتبع توقيت جهازك. اختر «صيفي» أو «شتوي» فقط إذا كانت ساعة جهازك لا توافق بلدك. يؤثر ذلك على الأوقات المعروضة داخل التطبيق، أما التنبيهات فتعمل في وقتها الفعلي.'));
      }
    }
    drawCur();
    const seen = new Map();
    (M.CITIES || []).forEach(c=>{ if(!seen.has(c[3])) seen.set(c[3], c[0]); });
    const rows = [...seen.keys()].map(tz=>({tz, z:zone(tz), nm:NAMES[tz] || tz.split('/').pop().replace(/_/g, ' ')}));
    rows.sort((a, b)=>(b.z.uses - a.z.uses) || a.nm.localeCompare(b.nm, 'ar'));
    rows.forEach(r=>{
      const z = r.z, dst = z.uses && isDst(r.tz, new Date());
      list.append(h('div.dst-it',
        h('div.grow', h('div.bold', r.nm), h('div.tiny.muted', z.uses ? (z.next ? 'التغيير القادم: '+fmtDate(z.next.at) : 'يطبّق التوقيت الصيفي') : 'توقيت ثابت طوال العام')),
        h('div.dst-b', h('span.badge', gmt(z.now)), h('span.dst-tag'+(z.uses ? (dst ? '.sum' : '.win') : '.fix'), z.uses ? (dst ? 'صيفي' : 'شتوي') : 'ثابت'))));
    });
    body.append(cur, h('h3.pr-h', {style:'margin:18px 0 8px'}, 'الدول والمناطق'), list,
      h('div.tiny.muted', {style:'margin-top:10px'}, 'تُحسب الحالة ومواعيد التغيير من قاعدة بيانات المناطق الزمنية في جهازك، وقد تتغير قرارات الدول، فتأكد من إعلان بلدك الرسمي.'));
  }});
}
M.openDst = open;
try{ M.addSection({id:'dst', title:'التوقيت الصيفي والشتوي', icon:'clock', group:'الصلاة والمواسم', fn:open}); }catch(e){ console.error(e); }
})();
