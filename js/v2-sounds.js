/* ===== Sounds v2: more adhan voices, fajr adhans, takbeer-only (verified, downloadable) =====
   Sources (see SRCS): Kiwifu/adhan-mp3 (no licence declared), 0xzer0x/athany (MIT; has "(Takbeer_only)" clips per muezzin), agnanp/praydo (Apache-2.0),
   DBChoco/Muezzin (MIT), zubir2k/HomeAssistantAdzan (Unlicense), HouariZegai/PrayerTimes (MIT). The repository licences cover the repos; none of them states the origin of the recordings.
   Names come from the files' own labels (Arabic spelling added only for well-known muezzins); unlabelled recordings say so. Fajr files are labelled as such by the source (not checked by ear).
   Hosts a native download needs: raw.githubusercontent.com (first URL) and cdn.jsdelivr.net (mirror).
   Contract with the Android side (same as js/adhan-dl.js):
     file    : files/dl/adhan/<key>.mp3  (written by Android.downloadFiles(id, [[url, 'adhan/<key>.mp3']]), played at /dl/adhan/<key>.mp3)
     id      : 'dla_'+key  -> SoundService maps it to that file (falls back to the bundled Makkah adhan if the file is gone)
     cfg     : adhan (any adhan id), fajrAdhan ('' = automatic, or an adhan id: used for the Fajr prayer only), takbeerOnly ('' or an id: the takbeer sound)
     store   : dlAdhans {key:1}  (downloaded keys, shared with adhan-dl.js); on the web the file is a Blob in IndexedDB key 'dla:'+key */
(function(){
'use strict';
const M = window.M, h = M.h;
/* sources: all pinned to a commit and fetched/decoded on 2026-10-10 (HTTP 200, audio/mpeg, size = git size, ffprobe ok); duplicates removed by md5 */
const SRCS = [
  {repo:'Kiwifu/adhan-mp3', ref:'b9180a2bb769f74cff8e378ef2cc7aaf8db5cd5b', lic:'غير محدد في المستودع'},
  {repo:'0xzer0x/athany', ref:'593ea1c1604050d1dabbde0d160d9336a1ab1fbe', lic:'MIT (للمستودع)'},
  {repo:'agnanp/praydo', ref:'635ce09fdb1c063f0143bb2a3e472080c7221b69', lic:'Apache-2.0 (للمستودع)'},
  {repo:'DBChoco/Muezzin', ref:'8c1bd109ffee5a06067e97383d7866bdca159849', lic:'MIT (للمستودع)'},
  {repo:'zubir2k/HomeAssistantAdzan', ref:'6093296007af112f09b3661b6606d268712b7ac1', lic:'Unlicense / ملك عام (للمستودع)'},
  {repo:'HouariZegai/PrayerTimes', ref:'e0fea2d8fc42884b6db2e415adc83cd5d41af0b9', lic:'MIT (للمستودع)'}
];
/* row: [key, name, kind a|f|t, path in repo, bytes, seconds, source index (default 0)] */
const ROWS = [
["adhan_aqsa_jerusalem", "أذان المسجد الأقصى — القدس", "a", "Adhan_Al_Aqsa_-_Jerusalem_(أذان_المسجد_الأقصى_-_القدس).mp3", 307298, 152],
["adhan_haram_madani_madinah_1", "أذان الحرم المدني — المدينة المنورة (١)", "a", "Adhan_Al_Haram_Al_Madani_-_Al_Madinah_1_(أذان_الحرم_المدني_-_المدينة_المنورة).mp3", 379784, 190],
["adhan_haram_madani_madinah_2", "أذان الحرم المدني — المدينة المنورة (٢)", "a", "Adhan_Al_Haram_Al_Madani_-_Al_Madinah_2_(أذان_الحرم_المدني_-_المدينة_المنورة).mp3", 475556, 236],
["ali_ibn_ahmad_mala_1_haram_maki", "علي بن أحمد ملا — الحرم المكي (١)", "a", "Ali_Ibn_Ahmad_Mala_1_-_Al_Haram_Al_Maki_(علي_بن_أحمد_ملا_-_الحرم_المكي).mp3", 492824, 246],
["ali_ibn_ahmad_mala_hq", "علي بن أحمد ملا (جودة عالية)", "a", "Ali_Ibn_Ahmad_Mala_-_HQ_(علي_بن_أحمد_ملا).mp3", 3914232, 244],
["muhammad_khaleel_raml_haram_maki", "محمد خليل رمل — الحرم المكي", "a", "Muhammad_Khaleel_Raml_-_Al_Haram_Al_Maki_(محمد_خليل_رمل_-_الحرم_المكي).mp3", 383744, 192],
["faruq_abdul_rahman_hadrawe_haram_m", "فاروق عبدالرحمن حضراوي — الحرم المكي", "a", "Faruq_Abdul_Rahman_Hadrawe_-_Al_Haram_Al_Maki_(فاروق_عبدالرحمن_حضراوي_-_الحرم_المكي).mp3", 559496, 280],
["nayf_fedah_haram_maki", "نايف فداح — الحرم المكي", "a", "Nayf_Fedah_-_Al_Haram_Al_Maki_(نايف_فداح_-_الحرم_المكي).mp3", 421256, 211],
["assem_bukhrare_haram_maki", "عاصم بخراري — الحرم المكي", "a", "Assem_Bukhrare_-_Al_Haram_Al_Maki_(عاصم_بخراري_-_الحرم_المكي).mp3", 563672, 282],
["muhammad_ramadan_saad_haram_maki", "محمد رمضان سعد — الحرم المكي", "a", "Muhammad_Ramadan_Saad_-_Al_Haram_Al_Maki_(محمد_رمضان_سعد_-_الحرم_المكي).mp3", 3515711, 219],
["nasser_qatami_hq", "ناصر القطامي (جودة عالية)", "a", "Nasser_Al_Qatami_-_HQ_(ناصر_القطامي).mp3", 530748, 132],
["mishary_afasy_hq", "مشاري العفاسي (جودة عالية)", "a", "Mishary_Al_Afasy_-_HQ_(مشاري_العفاسي).mp3", 621967, 154],
["mansur_zahrane_hq", "منصور الزهراني (جودة عالية)", "a", "Mansur_Al_Zahrane_-_HQ_(منصور_الزهراني).mp3", 763133, 190],
["hamad_daghriri_hq", "حمد الدغريري (جودة عالية)", "a", "Hamad_Al_Daghriri_-_HQ_(حمد_الدغريري).mp3", 619042, 154],
["yasser_dosari_saudi_arabia", "ياسر الدوسري — المملكة العربية السعودية", "a", "Yasser_Al-Dosari_-_Saudi_Arabia_(ياسر_الدوسري_-_المملكة_العربية_السعودية).mp3", 1462921, 182],
["mahmoud_khalil_hussary_cairo", "محمود خليل الحصري — القاهرة", "a", "Mahmoud_Khalil_Al_Hussary_-_Cairo_(محمود_خليل_الحصري_-_القاهرة).mp3", 258926, 128],
["mahmoud_ali_banna_cairo", "محمود علي البنا — القاهرة", "a", "Mahmoud_Ali_Al_Banna_-_Cairo_(محمود_علي_البنا_-_القاهرة).mp3", 335954, 166],
["mustafa_ismail_egypt", "مصطفى إسماعيل — مصر", "a", "Mustafa_Ismail_-_Egypt_(مصطفى_إسماعيل_-_مصر).mp3", 739896, 184],
["najee_qazaz_aqsa_jerusalem", "ناجي قزاز — المسجد الأقصى القدس", "a", "Najee_Qazaz_-_Al_Aqsa_Jerusalem_(ناجي_قزاز_-_المسجد_الأقصى_القدس).mp3", 452864, 226],
["nurdin_hamza_maghriby_aqsa_jerusal", "نور الدين حمزة المغربي — المسجد الأقصى القدس", "a", "NurDin_Hamza_Al_Maghriby_-_Al_Aqsa_Jerusalem_(نور_الدين_حمزة_المغربي_-_المسجد_الأقصى_القدس).mp3", 370280, 185],
["ahmad_nafees", "أحمد النفيس", "a", "Ahmad_Al_Nafees_(أحمد_النفيس).mp3", 3409337, 213],
["adhan_turkey_1", "أذان تركيا (١)", "a", "Adhan_Turkey_1_(أذان_تركيا).mp3", 360584, 178],
["adhan_dubai_uae", "أذان دبي الإمارات", "a", "Adhan_Dubai_UAE_(أذان_دبي_الإمارات).mp3", 475184, 236],
["adhan_kuwait", "أذان الكويت", "a", "Adhan_Kuwait_(أذان_الكويت).mp3", 288590, 142],
["adhan_muscat_oman", "أذان مسقط عُمان", "a", "Adhan_Muscat_Oman_(أذان_مسقط_عُمان).mp3", 307190, 152],
["adhan_syria", "أذان سوريا", "a", "Adhan_Syria_(أذان_سوريا).mp3", 446624, 221],
["adhan_tunisia", "أذان تونس", "a", "Adhan_Tunisia_(أذان_تونس).mp3", 291746, 144],
["adhan_masjid_rajehe_saudi_arabia_1", "أذان مسجد الراجحي السعودية (١)", "a", "Adhan_Masjid_Al_Rajehe_Saudi_Arabia_1_(أذان_مسجد_الراجحي_السعودية).mp3", 494336, 247],
["adhan_malaysia_1", "أذان ماليزيا (١)", "a", "Adhan_Malaysia_1_(أذان_ماليزيا).mp3", 400340, 198],
["adhan_indonesia", "أذان إندونيسيا", "a", "Adhan_Indonesia_(أذان_إندونيسيا).mp3", 399128, 198],
["adhan_pakistan", "أذان باكستان", "a", "Adhan_Pakistan_(أذان_باكستان).mp3", 369236, 183],
["omar_omayr", "عمر العمير", "a", "Omar_Al_Omayr_(عمر_العمير).mp3", 611101, 152],
["hamza_halabea", "حمزة الحلبي", "a", "Hamza_Al_Halabea_(حمزة_الحلبي).mp3", 969110, 241],
["abdel_moneim_abdel_mobdi", "عبد المنعم عبد المبدي", "a", "Abdel_Moneim_Abdel_Mobdi_(عبد_المنعم_عبد_المبدي).mp3", 712147, 142],
["abul_ainain_shuaisha_cairo", "أبو العينين شعيشع — القاهرة", "a", "Abul_Ainain_Shuaisha_-_Cairo_(أبو_العينين_شعيشع_-_القاهرة).mp3", 477002, 237],
["azan_nakshabandi", "أذان النقشبندي", "a", "Azan_nakshabandi.mp3", 2305043, 144],
["ahmed_nuinaa_2_cairo", "أحمد نعينع — القاهرة (٢)", "a", "Ahmed_Nuinaa_2_-_Cairo_(أحمد_نعينع_-_القاهرة).mp3", 424140, 210],
["ali_ibn_ahmad_mala_2_haram_maki", "علي بن أحمد ملا — الحرم المكي (٢)", "a", "Ali_Ibn_Ahmad_Mala_2_-_Al_Haram_Al_Maki_(علي_بن_أحمد_ملا_-_الحرم_المكي).mp3", 429968, 215],
["adhan_fajr_haram_maki", "أذان الفجر الحرم المكي", "f", "Adhan_Fajr_Al_Haram_Al_Maki_(أذان_الفجر_الحرم_المكي).mp3", 450002, 223],
["adhan_fajr_haram_madani", "أذان الفجر الحرم المدني", "f", "Adhan_Fajr_Al_Haram_Al_Madani_(أذان_الفجر_الحرم_المدني).mp3", 561776, 279],
["adhan_fajr_cairo_egypt", "أذان الفجر القاهرة مصر", "f", "Adhan_Fajr_Cairo_Egypt_(أذان_الفجر_القاهرة_مصر).mp3", 495158, 246],
["adhan_fajr_kuwait_1", "أذان الفجر الكويت (١)", "f", "Adhan_Fajr_Kuwait_1_(أذان_الفجر_الكويت).mp3", 423698, 210],
["adhan_fajr_kuwait_2", "أذان الفجر الكويت (٢)", "f", "Adhan_Fajr_Kuwait_2_(أذان_الفجر_الكويت).mp3", 379202, 188],
["adhan_fajr_algeria", "أذان الفجر الجزائر", "f", "Adhan_Fajr_Algeria_(أذان_الفجر_الجزائر).mp3", 358472, 177],
["adhan_fajr_umm_quwain", "أذان الفجر أم القيوين", "f", "Adhan_Fajr_Umm_Al_Quwain_(أذان_الفجر_أم_القيوين).mp3", 384686, 190],
["ahmad_nawaf_mejlad_2_fajr", "أحمد نواف المجلد — الفجر (٢)", "f", "Ahmad_Nawaf_Al_Mejlad_2_-_Fajr_(أحمد_نواف_المجلد_-_الفجر).mp3", 1557417, 222],
["ibraheem_jabr_abu_raheq_fajr", "إبراهيم جبر أبو رحيق — الفجر", "f", "Ibraheem_Jabr_Abu_Raheq_-_Fajr_(إبراهيم_جبر_أبو_رحيق_-_الفجر).mp3", 2341317, 292],
["yaseen_aassaf_2_fajr_iraq", "ياسين الأسف — فجر العراق (٢)", "f", "Yaseen_Al_Aassaf_2_-_Fajr_Iraq_(ياسين_الأسف_-_فجر_العراق).mp3", 5165716, 215],
["fajr_adhan_by_nasreddine_toubar", "أذان الفجر بصوت نصر الدين طوبار", "f", "Fajr_Adhan_by_Nasreddine_Toubar_(اذان_الفجر_بصوت_نصر_الدين_طوبار).mp3", 4653465, 288],
["mishary_rashid_alafasy_3_fajr_kuwa", "مشاري راشد العفاسي — فجر الكويت (٣)", "f", "Mishary_Rashid_Alafasy_3_-_Fajr_Kuwait_(مشاري_راشد_العفاسي_-_فجر_الكويت).mp3", 1503337, 187],
["mishary_rashid_alafasy_4_fajr_kuwa", "مشاري راشد العفاسي — فجر الكويت (٤)", "f", "Mishary_Rashid_Alafasy_4_-_Fajr_Kuwait_(مشاري_راشد_العفاسي_-_فجر_الكويت).mp3", 2312715, 289],
["abdulbasit_abdusamad_7_fajr_egypt", "عبد الباسط عبد الصمد — فجر مصر (٧)", "f", "Abdulbasit_Abdusamad_7_-_Fajr_Egypt_(عبد_الباسط_عبد_الصمد_-_فجر_مصر).mp3", 3095800, 193],
["ahmd_at_trablsy_fajr_kuwait", "أحمد الطرابلسي — فجر الكويت", "f", "Ahmd_At-Trablsy_-_Fajr_Kuwait_(أحمد_الطرابلسي_-_فجر_الكويت).mp3", 1038532, 229],
["ath_abdul_basit", "عبد الباسط عبد الصمد", "a", "src/Data/Athans/Abdul-Basit.mp3", 207723, 206, 1],
["ath_abdul_basit_tk", "تكبير — عبد الباسط عبد الصمد", "t", "src/Data/Athans/Abdul-Basit_(Takbeer_only).mp3", 74390, 28, 1],
["ath_abdul_hakam", "عبد الحكم", "a", "src/Data/Athans/Abdul-Hakam.mp3", 192363, 190, 1],
["ath_abdul_hakam_tk", "تكبير — عبد الحكم", "t", "src/Data/Athans/Abdul-Hakam_(Takbeer_only).mp3", 84461, 26, 1],
["ath_abdul_majeed_al_suraihi", "عبد المجيد السريحي", "a", "src/Data/Athans/Abdul-Majeed_Al-Suraihi.mp3", 2327448, 210, 1],
["ath_abdul_majeed_al_suraihi_tk", "تكبير — عبد المجيد السريحي", "t", "src/Data/Athans/Abdul-Majeed_Al-Suraihi_(Takbeer_only).mp3", 390168, 35, 1],
["ath_abdul_nasser_harak", "Abdul-Nasser Harak", "a", "src/Data/Athans/Abdul-Nasser_Harak.mp3", 2981592, 220, 1],
["ath_abdul_nasser_harak_tk", "تكبير — Abdul-Nasser Harak", "t", "src/Data/Athans/Abdul-Nasser_Harak_(Takbeer_only).mp3", 445041, 33, 1],
["ath_adhan_madina", "أذان المدينة المنورة", "a", "src/Data/Athans/Adhan_Madina.mp3", 98062, 96, 1],
["ath_adhan_madina_tk", "تكبير — أذان المدينة المنورة", "t", "src/Data/Athans/Adhan_Madina_(Takbeer_only).mp3", 50838, 17, 1],
["ath_adhan_makkah", "أذان مكة المكرمة", "a", "src/Data/Athans/Adhan_Makkah.mp3", 203440, 201, 1],
["ath_adhan_makkah_tk", "تكبير — أذان مكة المكرمة", "t", "src/Data/Athans/Adhan_Makkah_(Takbeer_only).mp3", 80675, 29, 1],
["ath_ahmad_al_kourdi", "أحمد الكردي", "a", "src/Data/Athans/Ahmad_Al-Kourdi.mp3", 2107217, 197, 1],
["ath_ahmad_al_kourdi_tk", "تكبير — أحمد الكردي", "t", "src/Data/Athans/Ahmad_Al-Kourdi_(Takbeer_only).mp3", 375321, 35, 1],
["ath_ahmad_al_nufais", "أحمد النفيس", "a", "src/Data/Athans/Ahmad_Al-Nufais.mp3", 2947457, 205, 1],
["ath_ahmad_al_nufais_tk", "تكبير — أحمد النفيس", "t", "src/Data/Athans/Ahmad_Al-Nufais_(Takbeer_only).mp3", 570101, 38, 1],
["ath_al_hossaini", "الحسيني", "a", "src/Data/Athans/Al-Hossaini.mp3", 593907, 195, 1],
["ath_al_hossaini_tk", "تكبير — الحسيني", "t", "src/Data/Athans/Al-Hossaini_(Takbeer_only).mp3", 63741, 21, 1],
["ath_al_hussary", "محمود خليل الحصري", "a", "src/Data/Athans/Al-Hussary.mp3", 2629008, 180, 1],
["ath_al_hussary_tk", "تكبير — محمود خليل الحصري", "t", "src/Data/Athans/Al-Hussary_(Takbeer_only).mp3", 271056, 20, 1],
["ath_al_menshawi", "محمد صديق المنشاوي", "a", "src/Data/Athans/Al-Menshawi.mp3", 3025080, 188, 1],
["ath_al_menshawi_tk", "تكبير — محمد صديق المنشاوي", "t", "src/Data/Athans/Al-Menshawi_(Takbeer_only).mp3", 495744, 30, 1],
["ath_alaqsa", "أذان المسجد الأقصى", "a", "src/Data/Athans/Alaqsa.mp3", 227263, 225, 1],
["ath_alaqsa_tk", "تكبير — أذان المسجد الأقصى", "t", "src/Data/Athans/Alaqsa_(Takbeer_only).mp3", 75686, 27, 1],
["ath_alaqsa_2", "أذان المسجد الأقصى (٢)", "a", "src/Data/Athans/Alaqsa_2.mp3", 731501, 185, 1],
["ath_alaqsa_2_tk", "تكبير — أذان المسجد الأقصى (٢)", "t", "src/Data/Athans/Alaqsa_2_(Takbeer_only).mp3", 130505, 33, 1],
["ath_azzam_dweik", "Azzam Dweik", "a", "src/Data/Athans/Azzam_Dweik.mp3", 2582880, 245, 1],
["ath_azzam_dweik_tk", "تكبير — Azzam Dweik", "t", "src/Data/Athans/Azzam_Dweik_(Takbeer_only).mp3", 245136, 23, 1],
["ath_islam_sobhy", "Islam Sobhy", "a", "src/Data/Athans/Islam_Sobhy.mp3", 2677802, 170, 1],
["ath_islam_sobhy_tk", "تكبير — Islam Sobhy", "t", "src/Data/Athans/Islam_Sobhy_(Takbeer_only).mp3", 543465, 35, 1],
["ath_mahmoud_mohammad_ramadan", "Mahmoud Mohammad Ramadan", "a", "src/Data/Athans/Mahmoud_Mohammad_Ramadan.mp3", 3444960, 216, 1],
["ath_mansoor_al_zahrani", "منصور الزهراني", "a", "src/Data/Athans/Mansoor_Al-Zahrani.mp3", 3180387, 195, 1],
["ath_mansoor_al_zahrani_tk", "تكبير — منصور الزهراني", "t", "src/Data/Athans/Mansoor_Al-Zahrani_(Takbeer_only).mp3", 396957, 24, 1],
["ath_mishary_alafasy", "مشاري راشد العفاسي", "a", "src/Data/Athans/Mishary_Alafasy.mp3", 2994178, 184, 1],
["ath_mishary_alafasy_tk", "تكبير — مشاري راشد العفاسي", "t", "src/Data/Athans/Mishary_Alafasy_(Takbeer_only).mp3", 382479, 23, 1],
["ath_mishary_alafasy_2", "مشاري راشد العفاسي (٢)", "a", "src/Data/Athans/Mishary_Alafasy_2.mp3", 3174925, 232, 1],
["ath_mishary_alafasy_2_tk", "تكبير — مشاري راشد العفاسي (٢)", "t", "src/Data/Athans/Mishary_Alafasy_2_(Takbeer_only).mp3", 552394, 40, 1],
["ath_mishary_alafasy_3", "مشاري راشد العفاسي (٣)", "a", "src/Data/Athans/Mishary_Alafasy_3.mp3", 1058428, 183, 1],
["ath_mishary_alafasy_3_tk", "تكبير — مشاري راشد العفاسي (٣)", "t", "src/Data/Athans/Mishary_Alafasy_3_(Takbeer_only).mp3", 116692, 20, 1],
["ath_muhammad_refaat", "محمد رفعت", "a", "src/Data/Athans/Muhammad_Refaat.mp3", 957464, 204, 1],
["ath_muhammad_refaat_tk", "تكبير — محمد رفعت", "t", "src/Data/Athans/Muhammad_Refaat_(Takbeer_only).mp3", 117029, 25, 1],
["ath_mustafa_ismail", "مصطفى إسماعيل", "a", "src/Data/Athans/Mustafa_Ismail.mp3", 965677, 184, 1],
["ath_mustafa_ismail_tk", "تكبير — مصطفى إسماعيل", "t", "src/Data/Athans/Mustafa_Ismail_(Takbeer_only).mp3", 113115, 22, 1],
["ath_nasser_al_qatami", "ناصر القطامي", "a", "src/Data/Athans/Nasser_Al-Qatami.mp3", 1766884, 132, 1],
["ath_nasser_al_qatami_tk", "تكبير — ناصر القطامي", "t", "src/Data/Athans/Nasser_Al-Qatami_(Takbeer_only).mp3", 351621, 27, 1],
["ath_sayed_al_naqshbandi", "سيد النقشبندي", "a", "src/Data/Athans/Sayed_Al-Naqshbandi.mp3", 3215136, 171, 1],
["ath_sayed_al_naqshbandi_tk", "تكبير — سيد النقشبندي", "t", "src/Data/Athans/Sayed_Al-Naqshbandi_(Takbeer_only).mp3", 393408, 21, 1],
["praydo_fajr", "أذان الفجر (تسجيل بلا اسم — مستودع praydo)", "f", "src-tauri/assets/adhan-fajr.mp3", 2996349, 187, 2],
["muz_nufais", "أحمد النفيس (٢)", "a", "ressources/audio/Adhan - Ahmed Al-Nufais.mp3", 3091595, 193, 3],
["muz_mecca", "أذان مكة المكرمة (٢)", "a", "ressources/audio/Adhan - Mecca.mp3", 3274796, 205, 3],
["muz_aqsa", "أذان المسجد الأقصى (٣)", "a", "ressources/audio/Adhan - al-Aqsa.mp3", 4020613, 252, 3],
["muz_allahuakbar", "تكبير — الله أكبر (مستودع Muezzin)", "t", "ressources/audio/AllahuAkbar.mp3", 129895, 6, 3],
["ha_azan", "أذان (تسجيل بلا اسم — HomeAssistantAdzan)", "a", "audio/azan.mp3", 3692883, 164, 4],
["ha_azansubuh", "أذان الفجر (تسجيل بلا اسم — HomeAssistantAdzan)", "f", "audio/azansubuh.mp3", 4226962, 264, 4],
["pt_adan1", "أذان — تسجيل بلا اسم (١) — مستودع PrayerTimes", "a", "src/main/resources/adhan/adan1.mp3", 3229194, 197, 5],
["pt_adan2", "أذان — تسجيل بلا اسم (٢) — مستودع PrayerTimes", "a", "src/main/resources/adhan/adan2.mp3", 4171024, 174, 5],
["pt_adan4", "أذان — تسجيل بلا اسم (٤) — مستودع PrayerTimes", "a", "src/main/resources/adhan/adan4.mp3", 2181966, 132, 5],
["pt_adan5", "أذان — تسجيل بلا اسم (٥) — مستودع PrayerTimes", "a", "src/main/resources/adhan/adan5.mp3", 1527648, 182, 5]
];
const KIND = {a:'adhan', f:'fajr', t:'takbeer'};
const enc = p=>p.split('/').map(encodeURIComponent).join('/');
const CAT = ROWS.map(([key, name, k, path, size, dur, si])=>{ const S = SRCS[si || 0]; return {
  id:'dla_'+key, key, name, muezzin:name.replace(/^تكبير — /, '').split(' — ')[0].replace(/ \(.*\)$/, '').replace(/ \([^)]*$/, ''), kind:KIND[k], size, dur,
  urls:['https://raw.githubusercontent.com/'+S.repo+'/'+S.ref+'/'+enc(path), 'https://cdn.jsdelivr.net/gh/'+S.repo+'@'+S.ref+'/'+enc(path)],
  source:'github.com/'+S.repo, licence:S.lic }; });
M.V2_SOUNDS = CAT;
/* recordings that now ship inside the app (ad_qatami / tk_qatami) are not offered again as downloads — unless already downloaded */
const BUNDLED_DUP = ['ath_nasser_al_qatami', 'ath_nasser_al_qatami_tk', 'nasser_qatami_hq'];
const byId = id=>CAT.find(c=>c.id === id);
const native = ()=>!!(window.Android && window.Android.downloadFiles);
const have = ()=>M.store.get('dlAdhans', {}) || {};
const got = c=>!!have()[c.key];
const kb = b=>b >= 1048576 ? M.n((b / 1048576).toFixed(1))+' م.ب' : M.n(Math.round(b / 1024))+' ك.ب';
const fmtD = s=>{ s = Math.round(s); return M.n(Math.floor(s / 60)+':'+String(s % 60).padStart(2, '0')); };

/* downloaded plain adhans join the normal pickers (notifications centre, alarms…); fajr/takbeer ones are only named for sndName() */
function syncLists(){
  const d = have();
  CAT.forEach(c=>{
    if(!d[c.key]) return;
    if(c.kind === 'adhan' && !M.ADHANS.some(x=>x[0] === c.id)) M.ADHANS.push([c.id, c.name]);
    if(c.kind === 'fajr') M.FAJR_ADHAN['v2:'+c.key] = c.id;
  });
}
syncLists();
/* the Fajr prayer can have its own adhan (cfg.fajrAdhan); otherwise the old rule applies (Abdul Basit / Mishary fajr variants) */
const prevFor = M.adhanFor;
const usable = id=>!!id && (!String(id).startsWith('dla_') || !!(byId(id) ? got(byId(id)) : have()[String(id).slice(4)]));
M.adhanFor = k=>{ if(k === 'fajr'){ const f = M.cfg.fajrAdhan; if(f && usable(f)) return f; } return prevFor(k); };
M.takbeerSnd = ()=>{ const t = M.cfg.takbeerOnly; return t && usable(t) ? t : ''; };

/* ---- playback: stream from the first working mirror, or play the downloaded copy ---- */
const A = new Audio(); A.preload = 'none'; (M._audios = M._audios || []).push(A); let cur = null, blobUrl = null;
const prevPlay = M.playSound, prevStop = M.stopSound;
function stopMine(){ if(cur){ A.pause(); cur = null; M.emit('sound', null); } if(blobUrl){ URL.revokeObjectURL(blobUrl); blobUrl = null; } }
A.addEventListener('ended', ()=>{ cur = null; M.emit('sound', null); });
async function playC(c){
  if(M.cfg.audioMute){ M.toast('الملفات الصوتية مكتومة من الإعدادات'); return; }
  if(cur === c.id && !A.paused){ stopMine(); return; }
  prevStop(); stopMine(); try{ if(M.player && M.player.a) M.player.a.pause(); }catch(e){}
  cur = c.id; M.emit('sound', c.id);
  const srcs = [];
  if(got(c)){ if(native()) srcs.push('/dl/adhan/'+c.key+'.mp3'); else { try{ const bl = await M.kv.get('dla:'+c.key); if(bl){ blobUrl = URL.createObjectURL(bl); srcs.push(blobUrl); } }catch(e){} } }
  c.urls.forEach(u=>srcs.push(u));
  if(!got(c) && !navigator.onLine){ cur = null; M.emit('sound', null); M.toast('لا يوجد اتصال بالإنترنت — نزّل الصوت أولًا'); return; }
  for(const u of srcs){
    if(cur !== c.id) return;
    try{ A.src = u; A.playbackRate = M.cfg.audioSpeed || 1; await A.play(); if(cur !== c.id){ A.pause(); } return; }catch(e){ if(cur !== c.id) return; }
  }
  if(cur === c.id){ cur = null; M.emit('sound', null); M.toast('تعذّر تشغيل الصوت — تحقق من الاتصال'); }
}
M.playSound = function(id){ const c = byId(id); if(c) return playC(c); stopMine(); return prevPlay(id); };
M.stopSound = function(){ stopMine(); prevStop(); };

/* ---- download / delete ---- */
const jobs = {}, prevOnDl = window.onDl;
window.onDl = function(id, d, t, bad, fin){ const f = jobs[id]; if(f){ if(fin){ delete jobs[id]; f(bad === 0 && d >= t); } return; } prevOnDl && prevOnDl(id, d, t, bad, fin); };
const busy = {};   // key -> 0..1 (or -1 = unknown) while downloading
async function webFetch(c, onP){
  let lastErr = null;
  for(const u of c.urls){
    try{
      const r = await fetch(u); if(!r.ok) throw new Error('http '+r.status);
      const tot = +r.headers.get('content-length') || c.size; let bl;
      if(r.body && r.body.getReader){ const rd = r.body.getReader(), parts = []; let n = 0; for(;;){ const x = await rd.read(); if(x.done) break; parts.push(x.value); n += x.value.length; onP(Math.min(1, n / tot)); } bl = new Blob(parts, {type:'audio/mpeg'}); }
      else bl = await r.blob();
      if(bl.size < 30000 || (c.size && Math.abs(bl.size - c.size) > c.size * 0.02)) throw new Error('bad file');
      if(!(await M.kv.set('dla:'+c.key, bl))) throw new Error('storage');
      return true;
    }catch(e){ lastErr = e; if(e && e.message === 'storage') break; }
  }
  throw lastErr || new Error('failed');
}
function nativeDl(c, onP, urlIdx){
  return new Promise(res=>{
    const id = 'v2s_'+c.key+'_'+Date.now().toString(36), rel = 'adhan/'+c.key+'.mp3'; let poll = 0, tmo = 0;
    const end = ok=>{ clearInterval(poll); clearTimeout(tmo); delete jobs[id]; res(ok); };
    jobs[id] = ok=>end(ok);
    try{ window.Android.downloadFiles(id, JSON.stringify([[c.urls[urlIdx], rel]])); }catch(e){ return end(false); }
    poll = setInterval(()=>{ try{ const b = +window.Android.dlSize(rel); if(b > 0) onP(Math.min(0.99, b / c.size)); }catch(e){} }, 600);
    tmo = setTimeout(()=>end(false), 180000);
  });
}
async function download(c){
  busy[c.key] = -1; M.emit('v2s', c.key);
  const onP = f=>{ busy[c.key] = f; M.emit('v2s', c.key); };
  let ok = false;
  try{
    if(native()){ for(let i = 0; i < c.urls.length && !ok; i++) ok = await nativeDl(c, onP, i); }
    else ok = await webFetch(c, onP);
  }catch(e){ ok = false; }
  delete busy[c.key];
  if(ok){ const d = have(); d[c.key] = 1; M.store.set('dlAdhans', d); syncLists(); }
  M.emit('v2s', c.key); return ok;
}
async function remove(c){
  try{ if(native()) window.Android.dlDelete('adhan/'+c.key+'.mp3'); else await M.kv.del('dla:'+c.key); }catch(e){}
  const d = have(); delete d[c.key]; M.store.set('dlAdhans', d);
  const i = M.ADHANS.findIndex(x=>x[0] === c.id); if(i >= 0) M.ADHANS.splice(i, 1);
  delete M.FAJR_ADHAN['v2:'+c.key];
  if(M.cfg.adhan === c.id) M.save('adhan', 'ad_makkah'); if(M.cfg.alarmSnd === c.id) M.save('alarmSnd', 'ad_makkah');
  if(M.cfg.fajrAdhan === c.id) M.save('fajrAdhan', ''); if(M.cfg.takbeerOnly === c.id) M.save('takbeerOnly', '');
  const nf = M.cfg.nf; if(nf && typeof nf === 'object'){ let ch = false; Object.keys(nf).forEach(k=>{ if(nf[k] && nf[k].snd === c.id){ nf[k].snd = 'auto'; ch = true; } }); if(ch) M.save('nf', nf); }
  M.syncNative && M.syncNative();
}

/* ---- UI: one panel per kind, mounted by js/sounds.js ---- */
const CFG = {adhan:['adhan', 'اجعله الأذان', 'هو الأذان الآن'], fajr:['fajrAdhan', 'اجعله أذان الفجر', 'هو أذان الفجر الآن'], takbeer:['takbeerOnly', 'اجعله التكبير', 'هو التكبير الآن']};
const selOf = kind=>kind === 'adhan' ? (M.cfg.adhan || 'ad_makkah') : (M.cfg[CFG[kind][0]] || '');
M.v2Sounds = {
  list:kind=>CAT.filter(c=>c.kind === kind && (!BUNDLED_DUP.includes(c.key) || got(c))),
  panel(kind, host, onChange){
    const items = CAT.filter(c=>c.kind === kind && (!BUNDLED_DUP.includes(c.key) || got(c))).sort((x, y)=>x.muezzin.localeCompare(y.muezzin, 'ar')), box = h('div.v2s'), q = {t:''}; let lim = 24;
    const draw = ()=>{
      const nq = M.normAr(q.t), sel = selOf(kind), all = items.filter(c=>!nq || M.normAr(c.name+' '+c.muezzin+' '+c.key.replace(/_/g, ' ')).includes(nq)), rows = all.slice(0, lim);
      const list = h('div.list.card'); let lastG = null;
      rows.forEach(c=>{
        if(c.muezzin !== lastG){ lastG = c.muezzin; list.append(h('div.v2s-g', c.muezzin, h('span.v2s-gn', M.n(all.filter(x=>x.muezzin === c.muezzin).length)))); }
        const isBusy = busy[c.key] != null, has = got(c), on = sel === c.id;
        const play = h('button.icon-btn.tonal'+(cur === c.id && !A.paused ? '.on' : ''), {'aria-label':'استماع إلى '+c.name, dataset:{pid:c.id}, onclick:()=>M.playSound(c.id)}, M.ic(cur === c.id && !A.paused ? 'pause' : 'play'));
        let act;
        if(isBusy) act = h('span.chip.adl-busy', busy[c.key] >= 0 ? 'جارٍ التنزيل '+M.n(Math.round(busy[c.key] * 100))+'٪' : 'جارٍ التنزيل…');
        else if(!has) act = h('button.chip', {onclick:async()=>{
          if(!navigator.onLine) return M.toast('لا يوجد اتصال بالإنترنت');
          const ok = await download(c); M.toast(ok ? 'تم تنزيل «'+c.name+'»' : 'تعذّر التنزيل — حاول مرة أخرى'); draw(); onChange && onChange();
        }}, M.ic('download'), 'تنزيل');
        else act = h('span.row-flex.gap-s', h('button.chip.ad-pick'+(on ? '.on' : ''), {onclick:()=>{ M.save(CFG[kind][0], c.id); M.syncNative && M.syncNative(); M.toast(on ? 'تم' : 'تم اختيار: '+c.name); draw(); onChange && onChange(); }}, on ? CFG[kind][2] : CFG[kind][1]),
          h('button.icon-btn', {'aria-label':'حذف '+c.name, onclick:async()=>{ if(!(await M.confirm('حذف «'+c.name+'» من الجهاز؟', 'حذف'))) return; stopMine(); await remove(c); draw(); onChange && onChange(); }}, M.ic('trash')));
        list.append(h('div.item.snd.adl', h('div.grow', h('div.t', c.name), h('div.s', fmtD(c.dur)+' • '+kb(c.size)+(has ? ' • على الجهاز' : '')),
          isBusy && busy[c.key] >= 0 ? h('div.v2s-bar', h('i', {style:'width:'+Math.round(busy[c.key] * 100)+'%'})) : isBusy ? h('div.v2s-bar.ind', h('i')) : null), play, act));
      });
      const kids = [];
      if(items.length > 8) kids.push(h('input.field.v2s-q', {type:'search', placeholder:'ابحث عن شيخ أو بلد…', value:q.t, 'aria-label':'بحث', oninput:e=>{ q.t = e.target.value; lim = 24; const pos = e.target.selectionStart; draw(); const i = box.querySelector('.v2s-q'); if(i){ i.focus(); try{ i.setSelectionRange(pos, pos); }catch(_){} } }}));
      kids.push(rows.length ? list : h('div.empty', 'لا نتائج'));
      if(all.length > lim) kids.push(h('button.btn.tonal.block', {style:'margin-top:10px', onclick:()=>{ lim += 30; draw(); }}, 'عرض المزيد ('+M.n(all.length - lim)+')'));
      box.replaceChildren(...kids);
    };
    if(!items.length){
      box.append(h('div.card.pad.v2s-none', h('div.t.bold', 'لا توجد تسجيلات متاحة بعد'), h('div.small.muted', {style:'line-height:1.9;margin-top:6px'}, 'لم نجد بعد مصدرًا موثوقًا ومسموحًا بتحميله لتسجيلات «الله أكبر» وحدها. ستظهر هنا القوائم بمجرد إضافتها.')));
      return box;
    }
    const upd = ()=>host.isConnected && box.querySelectorAll('[data-pid]').forEach(b=>{ const on = cur === b.dataset.pid && !A.paused; b.classList.toggle('on', on); b.replaceChildren(M.ic(on ? 'pause' : 'play')); });
    const un = [M.on('sound', upd), M.on('v2s', ()=>{ if(host.isConnected) draw(); })];
    ['play', 'pause', 'ended'].forEach(ev=>A.addEventListener(ev, upd));
    box._off = ()=>{ un.forEach(f=>typeof f === 'function' && f()); ['play', 'pause', 'ended'].forEach(ev=>A.removeEventListener(ev, upd)); };
    draw(); return box;
  },
  stop:stopMine, selected:selOf
};

M.v2Sounds.api = {CAT, got, busy, download, remove, kb, CFG, selOf, byId};

const st = document.createElement('style');
st.textContent = '.v2s-bar{flex-basis:100%;height:4px;border-radius:2px;background:color-mix(in oklab,var(--p) 18%,transparent);overflow:hidden;margin-top:6px}.v2s-bar i{display:block;height:100%;background:var(--p);transition:width .3s}.v2s-bar.ind i{width:35%;animation:v2sInd 1.1s ease-in-out infinite alternate}@keyframes v2sInd{from{margin-inline-start:0}to{margin-inline-start:65%}}.v2s-q{width:100%;margin-bottom:10px}.v2s-none{text-align:center}.v2s-g{display:flex;justify-content:space-between;align-items:center;padding:10px 14px 4px;font-weight:700;font-size:.82rem;color:var(--on-sv)}.v2s-gn{font-weight:500;opacity:.7}.v2s .item.snd .grow{min-width:0}';
document.head.appendChild(st);
})();
