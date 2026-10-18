/* ===== one entry per feature: the old simple versions stay reachable by id, but the menus show the newer, fuller one ===== */
(function(){
'use strict';
const M = window.M;
M.SECTION_HIDE = ['zakat2', 'sunna_ruqya', 'quran_ruqya', 'plog'];
function fix(){
  const find = id=>(M.SECTIONS || []).find(s=>s[0] === id);
  const z = find('zakat'), z2 = find('zakat2'); if(z && z2){ z[4] = z2[4]; z[1] = 'حاسبة الزكاة'; }
  const r = find('ruqya2'); if(r) r[1] = 'الرقية الشرعية';
  M.SECTION_KW = M.SECTION_KW || {};
  M.SECTION_KW.zakat = 'زكاة مال ذهب فضة نصاب زروع أنعام فطر'; M.SECTION_KW.ruqya2 = 'رقية شرعية آيات سنة قرآن عين حسد سحر';
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fix); else fix();
setTimeout(fix, 300);
})();
