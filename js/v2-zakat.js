/* v2 module: zakat — «حاسبة الزكاة المتقدمة» (id: zakat2).
   Improves on the older M.openZakat: gold/silver by karat, trade goods, receivables, debts, nisab by gold or silver with an
   explanation, hawl date + reminder, crops, a livestock helper, zakat al-fitr by family, saved history and a share card.
   Rulings are phrased cautiously; differences are mentioned briefly; the user is told to consult a scholar. */
(function(){
'use strict';
const M = window.M, h = M.h;
const KEY = 'zk2:state', HKEY = 'zk2:hist';
const DEF = {cur:'', gp:0, sp:0, basis:'silver', year:'h', cash:0, trade:0, inv:0, owed:0, debt:0, g24:0, g21:0, g18:0, silver:0, jewel:false, jewelInc:true, hawl:'', remind:false,
  crop:0, cprice:0, irr:'rain', lsType:'sheep', lsN:0, fp:4, fw:2.5, fpr:0};
let S = Object.assign({}, DEF, M.store.get(KEY, {}) || {});
const save = ()=>M.store.set(KEY, S);
const hist = ()=>{ const a = M.store.get(HKEY, []); return Array.isArray(a) ? a : []; };
const saveHist = a=>M.store.set(HKEY, a.slice(0, 60));

/* accepts Arabic or Latin digits, either decimal mark and thousands separators */
const parse = v=>{ const t = String(v || '').replace(/[٠-٩]/g, d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,\s]/g, '').replace(/٫/g, '.'); const n = parseFloat(t); return isFinite(n) && n > 0 ? n : 0; };
const num = x=>M.fmtInt ? M.fmtInt(x) : M.n(Math.round(x));
const dec = (x, d)=>M.fmtDec ? M.fmtDec(x, d) : M.n(x.toFixed(d));
const money = x=>(x >= 1000 ? num(x) : dec(x, 2)) + (S.cur ? ' '+S.cur : '');
const NISAB_G = 85, NISAB_S = 595, CROP_NISAB = 653;
const pad2 = n=>(n < 10 ? '0' : '')+n;
const dstr = d=>d.getFullYear()+'-'+pad2(d.getMonth() + 1)+'-'+pad2(d.getDate());
const fdate = d=>{ try{ return M.fmtHijri(M.hijri(d)) + ' — ' + d.toLocaleDateString(M.lang && M.lang !== 'ar' ? M.lang : 'ar', {day:'numeric', month:'long', year:'numeric'}); }catch(e){ return dstr(d); } };

/* ---------- calculation ---------- */
function calc(){
  const gold24 = S.g24 + S.g21 * 21 / 24 + S.g18 * 18 / 24;
  const metalOn = !(S.jewel && !S.jewelInc);
  const goldVal = metalOn ? gold24 * S.gp : 0, silverVal = metalOn ? S.silver * S.sp : 0;
  const wealth = S.cash + S.trade + S.inv + S.owed + goldVal + silverVal;
  const ded = Math.min(S.debt, wealth), net = Math.max(0, wealth - S.debt);
  const nisab = S.basis === 'gold' ? NISAB_G * S.gp : NISAB_S * S.sp;
  const rate = S.year === 'g' ? 0.025775 : 0.025;
  const needPrice = nisab <= 0;
  const reached = !needPrice && net >= nisab && net > 0;
  const miss = [];
  if((S.g24 || S.g21 || S.g18) && !S.gp && metalOn) miss.push('أدخل سعر جرام الذهب (عيار ٢٤) ليُحسب ذهبك.');
  if(S.silver && !S.sp && metalOn) miss.push('أدخل سعر جرام الفضة ليُحسب ما عندك من فضة.');
  return {gold24, goldVal, silverVal, wealth, ded, net, nisab, rate, needPrice, reached, zakat:reached ? net * rate : 0, miss, metalOn};
}
function hawlInfo(){
  if(!S.hawl) return null;
  const d = new Date(S.hawl + 'T12:00:00'); if(isNaN(d)) return null;
  let due; try{ const hj = M.hijri(d); due = M.hijriToGreg(hj.y + 1, hj.m, hj.d); }catch(e){ due = new Date(d.getTime() + 354 * 864e5); }
  const days = Math.ceil((due.getTime() - Date.now()) / 864e5);
  return {start:d, due, days};
}
function malText(r){
  const L = ['حساب زكاة المال'];
  L.push('صافي المال الخاضع للزكاة: '+money(r.net));
  L.push('النصاب ('+(S.basis === 'gold' ? '٨٥ جرام ذهب' : '٥٩٥ جرام فضة')+'): '+money(r.nisab));
  L.push(r.reached ? 'الزكاة الواجبة إذا حال الحول (٪'+(S.year === 'g' ? '٢٫٥٧٧٥' : '٢٫٥')+'): '+money(r.zakat) : 'لم يبلغ المال النصاب فلا زكاة فيه الآن.');
  const hi = hawlInfo(); if(hi) L.push('تاريخ تمام الحول: '+fdate(hi.due));
  L.push('— حساب تقريبي؛ يُرجع إلى أهل العلم في الحالات الخاصة.');
  return L.join('\n');
}

/* ---------- small UI helpers ---------- */
const field = (key, label, o)=>{
  o = o || {};
  const inp = h('input.field.zk2-in', {type:'text', inputmode:'decimal', autocomplete:'off', dir:'ltr', placeholder:'0', 'aria-label':label, value:S[key] ? String(S[key]) : '',
    oninput:e=>{ S[key] = parse(e.target.value); save(); if(o.on) o.on(); }});
  return h('label.zk2-f', h('span.zk2-l', label), inp, o.hint ? h('span.tiny.muted', o.hint) : null);
};
const note = (txt, cls)=>h('div.zk2-note.small'+(cls || ''), M.ic('sparkle'), h('span', txt));
const details = (title, ...kids)=>{ const d = h('details.zk2-det', h('summary', title), h('div.zk2-detb', ...kids)); return d; };
const sw = (label, key, on)=>h('div.zk2-sw', h('span.grow', label), M.switchEl(!!S[key], v=>{ S[key] = v; save(); if(on) on(v); }));

/* ---------- tabs ---------- */
function tabMal(box){
  const resCard = h('div.card.accent.pad.zk2-res'), mini = h('div.zk2-mini');
  const jewelSub = h('div');
  const hawlBox = h('div.zk2-hawl');
  const refresh = ()=>{ paintRes(); paintHawl(); };
  function paintRes(){
    const r = calc(); resCard.innerHTML = ''; mini.innerHTML = '';
    mini.append(h('span.small.muted', 'الزكاة المتوقعة'), h('b.num', r.reached ? money(r.zakat) : (r.needPrice ? '—' : money(0))));
    r.miss.forEach(m=>resCard.append(h('div.zk2-warn', m)));
    resCard.append(h('div.small.zk2-cap', 'صافي المال الخاضع للزكاة'), h('div.title-font.zk2-big.num', money(r.net)));
    const rows = [['النقد والأرصدة', S.cash], ['عروض التجارة', S.trade], ['أسهم واستثمارات للتجارة', S.inv], ['ديون لك مرجوّة', S.owed], ['قيمة الذهب', r.goldVal], ['قيمة الفضة', r.silverVal]].filter(x=>x[1] > 0);
    if(rows.length || r.ded){
      const d = h('div.zk2-rows'); rows.forEach(x=>d.append(h('div.zk2-row', h('span', x[0]), h('b.num', money(x[1])))));
      if(r.ded) d.append(h('div.zk2-row', h('span', 'ديون عليك حالّة'), h('b.num', '− '+money(r.ded))));
      resCard.append(d);
    }
    if(S.jewel && !S.jewelInc && (S.g24 || S.g21 || S.g18 || S.silver)) resCard.append(h('div.small.zk2-cap', 'لم يُدخل الحُليّ المعدّ للاستعمال في الحساب بحسب اختيارك.'));
    if(r.needPrice){ resCard.append(h('div.zk2-st', 'أدخل سعر جرام '+(S.basis === 'gold' ? 'الذهب' : 'الفضة')+' لمعرفة النصاب.')); }
    else {
      resCard.append(h('div.zk2-row', h('span', 'النصاب ('+(S.basis === 'gold' ? '٨٥ جرام ذهب' : '٥٩٥ جرام فضة')+')'), h('b.num', money(r.nisab))));
      if(r.reached) resCard.append(h('div.zk2-fin', h('div.small', 'بلغ مالك النصاب. الزكاة الواجبة إذا تمّ الحول:'), h('div.zk2-big.num', money(r.zakat)), h('div.tiny.zk2-cap', S.year === 'g' ? 'بنسبة ٢٫٥٧٧٥٪ (السنة الميلادية)' : 'بنسبة ٢٫٥٪ (ربع العشر — السنة الهجرية)')));
      else resCard.append(h('div.zk2-fin', h('div.small', r.net > 0 ? 'لم يبلغ مالك النصاب، فلا زكاة فيه الآن عند جمهور العلماء. ينقصك '+money(r.nisab - r.net)+'.' : 'أدخل ما تملكه ليُحسب لك المقدار.')));
    }
    resCard.append(h('div.zk2-btns',
      h('button.btn.sm', {onclick:()=>{ const rr = calc(); if(rr.net <= 0){ M.toast('أدخل مبلغًا أولًا'); return; } const a = hist(); a.unshift({id:Date.now(), ts:Date.now(), type:'mal', title:'زكاة المال', amount:rr.zakat, net:rr.net, cur:S.cur, reached:rr.reached, snap:Object.assign({}, S)}); saveHist(a); M.toast('حُفظ في السجل'); M.haptic(10); }}, M.ic('check'), 'حفظ في السجل'),
      h('button.btn.sm.tonal', {onclick:()=>M.share(malText(calc()))}, M.ic('share'), 'مشاركة'),
      h('button.btn.sm.tonal', {onclick:()=>M.copy(malText(calc()))}, M.ic('copy'), 'نسخ')));
  }
  function paintHawl(){
    hawlBox.innerHTML = '';
    const hi = hawlInfo(); if(!hi) return;
    const txt = hi.days > 0 ? 'يتمّ الحول بعد '+M.cnt(hi.days, 'يوم', true, 'يومًا')+' — '+fdate(hi.due) : 'تمّ الحول (بتاريخ '+fdate(hi.due)+'). إن بقي المال بالغًا للنصاب طوال الحول فقد وجبت زكاته.';
    hawlBox.append(h('div.zk2-st'+(hi.days <= 0 ? '.ok' : ''), txt));
  }
  const gForm = h('div.zk2-grid');
  box.append(
    h('div.zk2-intro.small', 'الزكاة ربع العشر (٢٫٥٪) من المال الذي بلغ النصاب وحال عليه الحول، بعد خصم الديون الحالّة. أدخل المبالغ بعملتك.'),
    mini,
    h('div.section-h', 'الأسعار والنصاب'),
    h('div.card.pad.col-flex',
      h('div.zk2-grid', field('gp', 'سعر جرام الذهب عيار ٢٤', {on:refresh}), field('sp', 'سعر جرام الفضة', {on:refresh})),
      h('label.zk2-f', h('span.zk2-l', 'العملة (اختياري)'), h('input.field.zk2-in', {type:'text', value:S.cur, maxlength:12, placeholder:'مثال: ر.س', 'aria-label':'العملة', oninput:e=>{ S.cur = e.target.value.trim(); save(); refresh(); }})),
      h('div.small.muted', 'يُحسب النصاب على'),
      M.seg([['silver', 'الفضة ٥٩٥ جم'], ['gold', 'الذهب ٨٥ جم']], S.basis, v=>{ S.basis = v; save(); refresh(); }),
      details('لماذا يختلف النصاب بين الذهب والفضة؟',
        h('p', 'ثبت في السنة أن نصاب الذهب عشرون مثقالًا (نحو ٨٥ جرامًا) ونصاب الفضة مئتا درهم (نحو ٥٩٥ جرامًا). وكانت قيمتاهما متقاربتين في زمن النبوة، أما اليوم فقيمة نصاب الفضة أقل بكثير من قيمة نصاب الذهب.'),
        h('p', 'لذلك اختلف المعاصرون في النقود الورقية: يرى بعضهم اعتبار نصاب الفضة لأنه الأحظّ للفقراء والأقرب لتحقيق مقصد الزكاة، ويرى آخرون اعتبار الذهب لأنه أثبت قيمةً. فالمعتمد أن تعمل بما تفتي به جهة الفتوى في بلدك. ما يملكه الشخص من ذهب أو فضة فنصابه بوزنه.')),
      h('div.small.muted', 'نوع السنة (يرى جمهور العلماء الأخذ بالهجرية)'),
      M.seg([['h', 'هجرية ٢٫٥٪'], ['g', 'ميلادية ٢٫٥٧٧٥٪']], S.year, v=>{ S.year = v; save(); refresh(); })),
    h('div.section-h', 'ما تملكه'),
    h('div.card.pad.col-flex',
      h('div.zk2-grid', field('cash', 'النقد والأرصدة والودائع', {on:refresh}), field('trade', 'عروض التجارة', {on:refresh, hint:'قيمة البضاعة بسعر البيع الحالي'}),
        field('inv', 'أسهم واستثمارات بنيّة التجارة', {on:refresh}), field('owed', 'ديون لك على مليء مرجوّة', {on:refresh}))),
    h('div.section-h', 'الذهب والفضة (بالجرام)'),
    h('div.card.pad.col-flex',
      h('div.zk2-grid', field('g24', 'ذهب عيار ٢٤', {on:refresh}), field('g21', 'ذهب عيار ٢١', {on:refresh}), field('g18', 'ذهب عيار ١٨', {on:refresh}), field('silver', 'فضة', {on:refresh})),
      sw('هذا الذهب والفضة حُليّ للاستعمال والزينة', 'jewel', v=>{ jewelSub.style.display = v ? '' : 'none'; refresh(); }),
      (()=>{ jewelSub.style.display = S.jewel ? '' : 'none'; jewelSub.append(sw('أُدخله في حساب الزكاة', 'jewelInc', refresh), note('في زكاة الحُليّ المباح المعدّ للاستعمال خلاف: يرى جمهور العلماء (المالكية والشافعية والحنابلة) أنه لا زكاة فيه، ويرى الحنفية وبعض العلماء المعاصرين وجوبها. والذهب المدّخر أو المعدّ للتجارة تجب زكاته باتفاق. اختر ما تطمئن إليه من فتوى أهل العلم.')); return jewelSub; })()),
    h('div.section-h', 'الديون عليك'),
    h('div.card.pad.col-flex', field('debt', 'ديون حالّة عليك', {on:refresh, hint:'الأقساط المستحقة الآن'}),
      note('يرى جمهور العلماء أن الدَّين الحالّ يُخصم من المال قبل حساب الزكاة، وبعضهم يخصم ما كان في السنة الحالية من الأقساط فقط. والدين الذي لم يحلّ أجله فيه اختلاف.')),
    h('div.section-h', 'الحول والتذكير'),
    h('div.card.pad.col-flex',
      h('label.zk2-f', h('span.zk2-l', 'تاريخ بلوغ المال النصاب'), h('input.field.zk2-in', {type:'date', value:S.hawl, 'aria-label':'تاريخ بلوغ النصاب', oninput:e=>{ S.hawl = e.target.value; save(); paintHawl(); }})),
      hawlBox,
      sw('نبّهني عند فتح الحاسبة قبل تمام الحول بـ٣٠ يومًا', 'remind'),
      note('الحول سنة هجرية كاملة (نحو ٣٥٤ يومًا) يبقى فيها المال بالغًا للنصاب. وإذا نقص المال عن النصاب في أثناء الحول فقد انقطع الحول عند بعض الفقهاء، وعند آخرين يكفي بلوغه النصاب في طرفي الحول. وربح التجارة يُضمّ إلى الأصل في حوله.')),
    h('div.section-h', 'النتيجة'), resCard,
    h('div.tiny.muted.zk2-foot', 'هذه الحاسبة للتقدير والتذكير وليست فتوى. في حالتك الخاصة (شركات، أسهم، عقارات مؤجَّرة، ديون مؤجّلة…) راجع عالمًا ثقةً أو جهة إفتاء في بلدك.'));
  paintRes(); paintHawl();
}

function tabCrop(box){
  const out = h('div.card.accent.pad.zk2-res'), ls = h('div.card.pad.zk2-ls');
  function paint(){
    out.innerHTML = '';
    const rate = S.irr === 'rain' ? 0.1 : S.irr === 'effort' ? 0.05 : 0.075;
    const lab = S.irr === 'rain' ? 'العُشر (١٠٪)' : S.irr === 'effort' ? 'نصف العُشر (٥٪)' : 'ثلاثة أرباع العُشر (٧٫٥٪)';
    out.append(h('div.small.zk2-cap', 'مقدار الواجب — '+lab));
    if(!S.crop){ out.append(h('div.zk2-fin', h('div.small', 'أدخل وزن المحصول بالكيلوجرام.'))); return; }
    if(S.crop < CROP_NISAB){ out.append(h('div.zk2-fin', h('div.small', 'لم يبلغ المحصول النصاب (نحو '+M.n(CROP_NISAB)+' كجم) فلا زكاة فيه عند جمهور العلماء. ينقصه '+dec(CROP_NISAB - S.crop, 1)+' كجم.'))); return; }
    const kg = S.crop * rate;
    out.append(h('div.zk2-big.num', dec(kg, kg < 100 ? 2 : 1)+' كجم'));
    if(S.cprice) out.append(h('div.small.zk2-cap', 'قيمتها التقريبية: '+money(kg * S.cprice)));
    out.append(h('div.zk2-btns',
      h('button.btn.sm', {onclick:()=>{ const a = hist(); a.unshift({id:Date.now(), ts:Date.now(), type:'crop', title:'زكاة الزروع', amount:S.cprice ? kg * S.cprice : 0, text:dec(kg, 2)+' كجم ('+lab+')', cur:S.cur}); saveHist(a); M.toast('حُفظ في السجل'); }}, M.ic('check'), 'حفظ في السجل'),
      h('button.btn.sm.tonal', {onclick:()=>M.share('زكاة الزروع\nالمحصول: '+dec(S.crop, 1)+' كجم\nالواجب ('+lab+'): '+dec(kg, 2)+' كجم'+(S.cprice ? '\nالقيمة التقريبية: '+money(kg * S.cprice) : '')+'\n— تقدير؛ راجع أهل العلم.')}, M.ic('share'), 'مشاركة')));
  }
  function lsPaint(){
    ls.innerHTML = '';
    ls.append(h('div.bold', 'مساعد نصاب الأنعام'), M.seg([['sheep', 'الغنم'], ['cow', 'البقر'], ['camel', 'الإبل']], S.lsType, v=>{ S.lsType = v; save(); lsPaint(); }),
      field('lsN', 'عدد الرؤوس السائمة', {on:lsRes}));
    ls.append(h('div.zk2-st', {id:'zk2-lsr'}));
    ls.append(note('تجب الزكاة في الأنعام السائمة (التي ترعى أكثر العام) إذا بلغت النصاب وحال عليها الحول. ونصابها: الإبل ٥، والبقر ٣٠، والغنم ٤٠. أما المعلوفة فلا زكاة عين فيها عند جمهور العلماء إلا إن كانت للتجارة فتُقوَّم كعروض التجارة. والتفصيل فوق الأعداد المذكورة يُراجَع فيه أهل العلم أو جهة الزكاة.'));
    lsRes();
  }
  function lsRes(){
    const el = ls.querySelector('.zk2-st'); if(!el) return; const n = Math.floor(S.lsN || 0); let t = 'أدخل العدد.';
    if(n > 0){
      if(S.lsType === 'sheep') t = n < 40 ? 'لم تبلغ النصاب (٤٠).' : n <= 120 ? 'الواجب: شاة واحدة.' : n <= 200 ? 'الواجب: شاتان.' : n <= 300 ? 'الواجب: ثلاث شياه.' : 'الواجب: شاة عن كل مئة، أي '+M.n(Math.floor(n / 100))+' شياه.';
      else if(S.lsType === 'cow') t = n < 30 ? 'لم تبلغ النصاب (٣٠).' : n < 40 ? 'الواجب: تبيع (ما له سنة).' : n < 60 ? 'الواجب: مسنّة (ما لها سنتان).' : 'راجع جدول زكاة البقر أو أهل العلم لهذا العدد (في كل ثلاثين تبيع، وفي كل أربعين مسنّة).';
      else t = n < 5 ? 'لم تبلغ النصاب (٥).' : n < 10 ? 'الواجب: شاة واحدة.' : n < 15 ? 'الواجب: شاتان.' : n < 20 ? 'الواجب: ثلاث شياه.' : n < 25 ? 'الواجب: أربع شياه.' : 'راجع جدول زكاة الإبل أو أهل العلم لهذا العدد (من ٢٥ فصاعدًا يكون الواجب من الإبل نفسها).';
    }
    el.textContent = t;
  }
  box.append(
    h('div.zk2-intro.small', 'زكاة الزروع والثمار تجب عند الحصاد ولا يشترط لها حولٌ. نصابها خمسة أوسق (نحو '+M.n(CROP_NISAB)+' كجم تقريبًا، ويختلف بحسب نوع الحبّ وتقدير الصاع).'),
    h('div.section-h', 'الزروع والثمار'),
    h('div.card.pad.col-flex',
      h('div.zk2-grid', field('crop', 'وزن المحصول (كجم)', {on:paint}), field('cprice', 'سعر الكيلو (اختياري)', {on:paint})),
      h('div.small.muted', 'طريقة السقي'),
      M.seg([['rain', 'بلا كلفة (مطر/نهر)'], ['effort', 'بكلفة (آلة/ريّ)'], ['mix', 'مختلط']], S.irr, v=>{ S.irr = v; save(); paint(); }),
      note('الواجب العُشر فيما سُقي بلا كلفة كالمطر والأنهار، ونصف العُشر فيما سُقي بكلفة (رواه البخاري)، وثلاثة أرباع العُشر إذا اشترك الأمران بالتساوي عند الفقهاء. واختلف العلماء في خصم تكاليف الزراعة من المحصول.')),
    h('div.section-h', 'النتيجة'), out,
    h('div.section-h', 'الأنعام'), ls,
    h('div.tiny.muted.zk2-foot', 'تقدير تقريبي وليس فتوى؛ راجع أهل العلم.'));
  paint(); lsPaint();
}

function tabFitr(box){
  const out = h('div.card.accent.pad.zk2-res');
  function paint(){
    out.innerHTML = '';
    const kg = S.fp * S.fw, tot = kg * S.fpr;
    out.append(h('div.small.zk2-cap', 'إجمالي زكاة الفطر عن الأسرة'), h('div.zk2-big.num', S.fpr ? money(tot) : '— '), h('div.small.zk2-cap', 'الكمية: '+dec(kg, 2)+' كجم من الطعام ('+M.n(Math.round(S.fp))+' × '+dec(S.fw, 2)+' كجم)'));
    out.append(h('div.zk2-btns',
      h('button.btn.sm', {onclick:()=>{ if(!S.fp){ M.toast('أدخل عدد الأفراد'); return; } const a = hist(); a.unshift({id:Date.now(), ts:Date.now(), type:'fitr', title:'زكاة الفطر', amount:tot, text:M.n(Math.round(S.fp))+' أفراد — '+dec(kg, 2)+' كجم', cur:S.cur}); saveHist(a); M.toast('حُفظ في السجل'); }}, M.ic('check'), 'حفظ في السجل'),
      h('button.btn.sm.tonal', {onclick:()=>M.share('زكاة الفطر\nعدد الأفراد: '+M.n(Math.round(S.fp))+'\nالكمية: '+dec(kg, 2)+' كجم من الطعام'+(S.fpr ? '\nالقيمة: '+money(tot) : '')+'\n— تقبّل الله منا ومنكم.')}, M.ic('share'), 'مشاركة')));
  }
  const cnt = h('input.field.zk2-in', {type:'text', inputmode:'numeric', dir:'ltr', value:String(Math.round(S.fp)), 'aria-label':'عدد الأفراد', oninput:e=>{ S.fp = Math.round(parse(e.target.value)); save(); paint(); }});
  const step = d=>{ S.fp = Math.max(0, Math.round(S.fp) + d); cnt.value = String(S.fp); save(); paint(); M.haptic(6); };
  box.append(
    h('div.zk2-intro.small', 'زكاة الفطر صاعٌ من طعام عن كل مسلم: صغيرٍ وكبير، ذكرٍ وأنثى، حرٍّ وعبد (متفق عليه). يُخرجها المسلم عمّن تلزمه نفقتهم.'),
    h('div.section-h', 'أفراد الأسرة'),
    h('div.card.pad.col-flex',
      h('div.zk2-step', h('button.icon-btn', {'aria-label':'إنقاص', onclick:()=>step(-1)}, M.ic('minus') || '−'), cnt, h('button.icon-btn', {'aria-label':'زيادة', onclick:()=>step(1)}, M.ic('plus') || '+')),
      h('div.zk2-grid', field('fw', 'وزن الصاع (كجم)', {on:paint, hint:'نحو ٢٫٥ كجم تقريبًا'}), field('fpr', 'سعر الكيلو من قوت بلدك', {on:paint}))),
    h('div.section-h', 'النتيجة'), out,
    note('وقتها من غروب شمس آخر يوم من رمضان، والأفضل إخراجها قبل صلاة العيد، وتجوز قبله بيوم أو يومين، فإن أخّرها عن الصلاة بلا عذر فقد فاتها فضلها. ويرى جمهور العلماء إخراجها طعامًا من قوت البلد، ويجيز الحنفية وبعض العلماء إخراج القيمة. تأكّد من فتوى بلدك.'),
    h('div.tiny.muted.zk2-foot', 'مقدار الصاع تقريبي ويختلف بحسب نوع الحب؛ راجع جهة الفتوى المعتمدة عندك.'));
  paint();
}

function tabHist(box, rerender){
  const a = hist();
  if(!a.length){ box.append(h('div.card.pad.zk2-empty', M.ic('history'), h('div.bold', 'لا توجد حسابات محفوظة'), h('div.small.muted', 'احفظ نتيجة حسابك لتجدها هنا لاحقًا.'))); return; }
  box.append(h('div.section-h', M.n(a.length)+' حساب', h('button.btn.sm.danger', {onclick:()=>M.confirm('حذف كل السجل؟', ()=>{ saveHist([]); rerender(); }, 'مسح السجل')}, M.ic('trash'), 'مسح الكل')));
  a.forEach(e=>{
    const d = new Date(e.ts); const cur = e.cur ? ' '+e.cur : '';
    const amt = e.amount ? (e.amount >= 1000 ? num(e.amount) : dec(e.amount, 2))+cur : '';
    const sub = e.type === 'mal' ? (e.reached ? 'صافي المال '+(e.net >= 1000 ? num(e.net) : dec(e.net, 2))+cur : 'لم يبلغ النصاب') : e.text;
    box.append(h('div.card.pad.zk2-h',
      h('div.row-flex', h('div.grow', h('div.bold', e.title), h('div.tiny.muted', fdate(d))), amt ? h('b.num.zk2-ha', amt) : null),
      sub ? h('div.small.muted', sub) : null,
      h('div.zk2-btns',
        e.type === 'mal' && e.snap ? h('button.btn.sm.tonal', {onclick:()=>{ S = Object.assign({}, DEF, e.snap); save(); M.toast('استُعيدت المدخلات'); go('mal'); }}, M.ic('refresh'), 'استعادة') : null,
        h('button.btn.sm.tonal', {onclick:()=>M.share(e.title+' — '+fdate(d)+'\n'+(amt ? 'المبلغ: '+amt+'\n' : '')+(sub || ''))}, M.ic('share'), 'مشاركة'),
        h('button.btn.sm.danger', {onclick:()=>{ saveHist(hist().filter(x=>x.id !== e.id)); rerender(); }}, M.ic('trash'), 'حذف'))));
  });
}

let go = ()=>{};
M.openZakat2 = function(){
  let tab = 'mal';
  const TABS = [['mal', 'زكاة المال'], ['crop', 'الزروع والأنعام'], ['fitr', 'زكاة الفطر'], ['hist', 'السجل']];
  const view = M.openView({title:'حاسبة الزكاة المتقدمة', id:'zakat2', build:b=>{
    const tabs = h('div.zk2-tabs'), box = h('div.zk2-body');
    b.append(tabs, box);
    const render = ()=>{
      tabs.innerHTML = '';
      TABS.forEach(([k, l])=>tabs.append(h('button.chip'+(k === tab ? '.on' : ''), {onclick:()=>{ tab = k; render(); M.haptic(6); }}, l)));
      box.innerHTML = '';
      ({mal:tabMal, crop:tabCrop, fitr:tabFitr, hist:(bx)=>tabHist(bx, render)})[tab](box);
    };
    go = t=>{ tab = t; if(!view.closed) render(); };
    render();
    const hi = S.remind ? hawlInfo() : null;
    if(hi && hi.days > 0 && hi.days <= 30) setTimeout(()=>M.toast('اقترب تمام حولك: بعد '+M.cnt(hi.days, 'يوم', true, 'يومًا'), 4200), 500);
    else if(hi && hi.days <= 0 && S.remind) setTimeout(()=>M.toast('تمّ حول مالك — راجع حساب زكاتك', 4200), 500);
  }});
};

M.addSection({id:'zakat2', title:'حاسبة الزكاة المتقدمة', icon:'s:zakat', group:'أدوات', fn:()=>M.openZakat2()});
})();
