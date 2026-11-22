/* المساجد القريبة — خريطة + قائمة.
   المصدر الأول: خرائط جوجل (Places) إن كان مفتاح الخرائط مفعّلًا له — اسم المسجد وعنوانه وتقييمه وصورته ورابطه في خرائط جوجل.
   وإن لم يتوفر: OpenStreetMap عبر Overpass. تُحفظ النتيجة على الجهاز أسبوعًا، وأزرار ١ / ٢ / ٥ كم تصفّي محليًا. */
(function(){
const h = M.h;
const EPS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const any = Promise.any ? ps=>Promise.any(ps) : ps=>new Promise((res, rej)=>{ let n = ps.length, e; ps.forEach(p=>p.then(res, x=>{ e = x; if(--n === 0) rej(e); })); });
const MAXR = 5000, TTL = 7 * 864e5, CK = 'mosques:cache2';
const R = Math.PI / 180;
const dist = (a, b, c, d)=>{ const dl = (c - a) * R, dn = (d - b) * R, x = Math.sin(dl / 2) ** 2 + Math.cos(a * R) * Math.cos(c * R) * Math.sin(dn / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const fmt = km=>km < 1 ? M.n(Math.round(km * 100) * 10) + ' متر' : M.n(Math.round(km * 10) / 10) + ' كم';
const walk = km=>{ const m = Math.max(1, Math.round(km / 5 * 60)); return m < 60 ? M.n(m) + ' د مشيًا' : M.n(Math.floor(m / 60)) + ' س ' + M.n(m % 60) + ' د مشيًا'; };
const gUrl = m=>'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((m.name || 'مسجد') + ' ') + m.lat + ',' + m.lng + (m.pid ? '&query_place_id=' + encodeURIComponent(m.pid) : '');
const dirUrl = m=>'https://www.google.com/maps/dir/?api=1&destination=' + m.lat + ',' + m.lng + (m.pid ? '&destination_place_id=' + encodeURIComponent(m.pid) : '') + '&travelmode=walking';

/* ---------- data: Google Places, else OpenStreetMap ---------- */
async function queryGoogle(lat, lng){
  await M.loadGoogleMaps();
  const lib = await google.maps.importLibrary('places'), Place = lib.Place;
  const res = await Place.searchNearby({
    fields:['id', 'displayName', 'location', 'formattedAddress', 'rating', 'userRatingCount', 'regularOpeningHours', 'googleMapsURI', 'photos', 'businessStatus'],
    locationRestriction:{center:{lat, lng}, radius:MAXR}, includedPrimaryTypes:['mosque'], maxResultCount:20, rankPreference:'DISTANCE', language:'ar'
  });
  const day = (new Date().getDay() + 6) % 7;   // Google lists Monday first
  const out = (res.places || []).map(p=>{
    let photo = ''; try{ photo = p.photos && p.photos[0] ? p.photos[0].getURI({maxWidth:480}) : ''; }catch(e){}
    let hours = ''; try{ hours = (p.regularOpeningHours && p.regularOpeningHours.weekdayDescriptions || [])[day] || ''; }catch(e){}
    return {id:'g' + p.id, pid:p.id, name:p.displayName || '', lat:p.location.lat(), lng:p.location.lng(), kind:'مسجد', addr:p.formattedAddress || '', rating:p.rating || 0, votes:p.userRatingCount || 0, hours:hours.replace(/^[^:]+:\s*/, ''), photo, uri:p.googleMapsURI || '', closed:/CLOSED/.test(p.businessStatus || '')};
  }).filter(x=>!x.closed);
  if(!out.length) throw new Error('empty');
  return out;
}
function queryOsm(lat, lng, rad){
  const A = '(around:' + (rad || MAXR) + ',' + lat.toFixed(5) + ',' + lng.toFixed(5) + ')';
  const q = '[out:json][timeout:12];(nwr["amenity"="place_of_worship"]["religion"="muslim"]' + A + ';nwr["building"="mosque"]' + A + ';);out center tags qt 160;';
  const ctrls = EPS.map(()=>new AbortController());
  const one = (u, i)=>new Promise((res, rej)=>{
    const t = setTimeout(()=>{ ctrls[i].abort(); rej(new Error('timeout')); }, 11000);
    fetch(u + '?data=' + encodeURIComponent(q), {signal:ctrls[i].signal}).then(r=>{ if(!r.ok) throw new Error('http' + r.status); return r.json(); })
      .then(j=>{ clearTimeout(t); if(!j || !Array.isArray(j.elements)) throw new Error('bad'); res(j.elements); }).catch(e=>{ clearTimeout(t); rej(e); });
  });
  const tries = EPS.map((u, i)=>new Promise(r=>setTimeout(r, i * 700)).then(()=>one(u, i)));
  return any(tries).then(els=>{ ctrls.forEach(c=>{ try{ c.abort(); }catch(e){} }); return Promise.resolve(els.map(e=>{
    const la = e.lat != null ? e.lat : e.center && e.center.lat, lo = e.lon != null ? e.lon : e.center && e.center.lon;
    if(la == null) return null;
    const tg = e.tags || {};
    return {id:e.type + e.id, name:tg['name:ar'] || tg.name || tg['name:en'] || '', lat:la, lng:lo, kind:tg.building === 'mosque' || /mosque|مسجد|جامع/i.test(tg.name || '') ? 'مسجد' : 'مصلّى', addr:[tg['addr:street'], tg['addr:city']].filter(Boolean).join('، '), rating:0, votes:0, hours:tg.opening_hours || '', photo:'', uri:''};
  }).filter(Boolean)).then(merge); });
}
/* one mosque found twice (its building and the prayer place on it, or from both sources): the same OSM object, closer than
   25 m, or closer than 45 m with the same name (or none) */
function merge(list){
  const out = [];
  list.forEach(m=>{
    const o = out.find(x=>x.id === m.id || (()=>{ const d = dist(x.lat, x.lng, m.lat, m.lng); return d < 0.025 || (d < 0.045 && (!x.name || !m.name || x.name === m.name)); })());
    if(!o){ out.push(m); return; }
    if(!o.name && m.name){ o.name = m.name; o.kind = m.kind; }
    if(!o.addr && m.addr) o.addr = m.addr;
  });
  return out;
}
const PT = {N:'node', W:'way', R:'relation'};
function queryPhoton(lat, lng){
  const one = q=>fetch('https://photon.komoot.io/api/?q=' + encodeURIComponent(q) + '&lat=' + lat.toFixed(5) + '&lon=' + lng.toFixed(5) + '&limit=50&lang=default&location_bias_scale=0.2&zoom=15&osm_tag=amenity:place_of_worship', {signal:AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined})
    .then(r=>{ if(!r.ok) throw new Error('http' + r.status); return r.json(); }).then(j=>(j && j.features) || []);
  return Promise.allSettled(['مسجد', 'جامع', 'mosque', 'masjid'].map(one)).then(rs=>{
    const fs = [].concat(...rs.filter(r=>r.status === 'fulfilled').map(r=>r.value));
    if(!fs.length && rs.every(r=>r.status === 'rejected')) throw new Error('photon');
    return merge(fs.map(f=>{
      const pr = f.properties || {}, c = f.geometry && f.geometry.coordinates; if(!c) return null;
      const name = /^(mosque|masjid|مسجد|جامع|مصلى|مصلّى)$/i.test((pr.name || '').trim()) ? '' : (pr.name || '');
      if(/church|كنيس|cathedral|دير |synagogue|temple/i.test(name)) return null;
      return {id:(PT[pr.osm_type] || pr.osm_type) + pr.osm_id, name, lat:c[1], lng:c[0], kind:/جامع/.test(name) ? 'جامع' : 'مسجد', addr:[pr.street, pr.district || pr.city].filter(Boolean).join('، '), rating:0, votes:0};
    }).filter(m=>m && dist(lat, lng, m.lat, m.lng) <= MAXR / 1000));
  });
}
async function query(lat, lng, rad){
  if(navigator.onLine && !M.googleFailed()){ try{ return {src:'google', items:await queryGoogle(lat, lng)}; }catch(e){ try{ console.warn('places', e && e.message || e); }catch(_){} } }
  return {src:'osm', items:await queryOsm(lat, lng, rad), rad:rad || MAXR};
}
const cacheGet = (lat, lng)=>{ const c = M.store.get(CK, null); if(!c || Date.now() - c.at > TTL || dist(lat, lng, c.lat, c.lng) > 0.4) return null; return c; };
const cacheSet = (lat, lng, src, items)=>{ try{ M.store.set(CK, {lat, lng, at:Date.now(), src, items:items.map(x=>Object.assign({}, x, {photo:''}))}); }catch(e){} };
/* where the user stands, as precisely as the phone can tell within a few seconds (the GPS, not the saved city) */
const quickFix = ()=>new Promise((res, rej)=>{
  if(!navigator.geolocation) return rej(new Error('unsupported'));
  let best = null, done = false, id = null;
  const end = ()=>{ if(done) return; done = true; try{ navigator.geolocation.clearWatch(id); }catch(e){} clearTimeout(t1); clearTimeout(t2); best ? res(best) : rej(new Error('nofix')); };
  const t1 = setTimeout(()=>{ if(best) end(); }, 6000), t2 = setTimeout(end, 12000);
  id = navigator.geolocation.watchPosition(p=>{
    const c = p.coords, f = {lat:c.latitude, lng:c.longitude, acc:c.accuracy || 999};
    if(!best || f.acc < best.acc) best = f;
    if(best.acc <= 40) end();
  }, e=>{ if(!best){ done = true; clearTimeout(t1); clearTimeout(t2); try{ navigator.geolocation.clearWatch(id); }catch(_){} rej(e); } }, {enableHighAccuracy:true, timeout:12000, maximumAge:30000});
});

/* ---------- pins ---------- */
const pinSvg = (on)=>'<svg xmlns="http://www.w3.org/2000/svg" width="' + (on ? 46 : 38) + '" height="' + (on ? 56 : 46) + '" viewBox="0 0 38 46"><defs><filter id="s" x="-30%" y="-20%" width="160%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".35"/></filter></defs><path filter="url(#s)" d="M19 2C10 2 3.5 8.6 3.5 17c0 11 15.5 26 15.5 26S34.5 28 34.5 17C34.5 8.6 28 2 19 2Z" fill="' + (on ? '#d9b45a' : '#1f7a8c') + '" stroke="#fff" stroke-width="2"/><g fill="#fff"><path d="M19 8.5c-.4 2-2 3-3.8 4.4-1.7 1.3-2.8 2.7-2.8 4.6 0 .7.1 1.3.4 1.9h12.4c.3-.6.4-1.2.4-1.9 0-1.9-1.1-3.3-2.8-4.6-1.8-1.400-3.400-2.400-3.800-4.400Z"/><rect x="11.4" y="20.2" width="15.2" height="2.4" rx="1"/></g></svg>';
const pinUrl = on=>'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvg(on));
const meSvg = '<span class="mq-me"><i></i></span>';

function open(){
  M.openView({id:'mosques', title:'المساجد القريبة', nopad:true, build:(body, view)=>{ view.el.classList.add('mq-v');
    body.classList.add('mq-body');
    let rad = M.store.get('mosques:rad', 2000), pos = null, all = null, src = '', token = 0, sel = null, mapApi = null, shown = [];
    const mapEl = h('div.mq-map'), card = h('div.mq-sel'), list = h('div.mq-list'), info = h('div.tiny.muted.mq-info'), chips = h('div.mq-chips'), locBtn = h('button.mq-loc', {'aria-label':'موقعي', onclick:()=>{ if(mapApi && pos) mapApi.center(pos); }}, M.ic('s:qibla'));
    const stage = h('div.mq-stage', mapEl, h('div.mq-over', chips, locBtn), card);
    const drawChips = ()=>{
      chips.replaceChildren();
      [[1000, M.n(1) + ' كم'], [2000, M.n(2) + ' كم'], [5000, M.n(5) + ' كم']].forEach(([v, l])=>chips.append(h('button.mq-chip' + (v === rad ? '.on' : ''), {onclick:()=>{ rad = v; M.store.set('mosques:rad', v); drawChips(); paint(true); }}, l)));
    };
    const loading = t=>list.replaceChildren(h('div.mq-load', h('div.spinner'), h('div', t)));

    /* the map: Google when it loads, otherwise Leaflet over OpenStreetMap tiles */
    let initP = null;
    const initMap = ()=>initP = initP || _initMap();
    async function _initMap(){
      if(mapApi || !pos){ initP = null; return; }
      const dark = document.documentElement.dataset.theme === 'dark' || document.documentElement.classList.contains('dark');
      try{
        if(M.googleFailed() || !navigator.onLine) throw new Error('nogoogle');
        await M.loadGoogleMaps(); const g = google.maps;
        const map = new g.Map(mapEl, {center:pos, zoom:15, disableDefaultUI:true, zoomControl:false, gestureHandling:'greedy', clickableIcons:false, styles:dark ? M.G_DARK : [{featureType:'poi', stylers:[{visibility:'off'}]}, {featureType:'transit', stylers:[{visibility:'off'}]}]});
        let me = null, marks = new Map();
        mapApi = {
          kind:'google', center(p){ map.panTo(p); map.setZoom(Math.max(map.getZoom(), 15)); },
          draw(items, selId, onPick){
            marks.forEach(m=>m.setMap(null)); marks.clear();
            items.forEach(m=>{ const on = m.id === selId; const mk = new g.Marker({map, position:{lat:m.lat, lng:m.lng}, icon:{url:pinUrl(on), scaledSize:new g.Size(on ? 46 : 38, on ? 56 : 46), anchor:new g.Point(on ? 23 : 19, on ? 56 : 46)}, zIndex:on ? 999 : 1, title:m.name}); mk.addListener('click', ()=>onPick(m)); marks.set(m.id, mk); });
            if(!me) me = new g.Marker({map, position:pos, icon:{path:g.SymbolPath.CIRCLE, scale:8, fillColor:'#2a7fff', fillOpacity:1, strokeColor:'#fff', strokeWeight:3}, zIndex:2000, clickable:false}); else me.setPosition(pos);
          },
          focus(m){ map.panTo({lat:m.lat, lng:m.lng}); },
          fit(items){ if(!items.length){ map.setCenter(pos); map.setZoom(15); return; } const b = new g.LatLngBounds(pos); items.slice(0, 8).forEach(m=>b.extend({lat:m.lat, lng:m.lng})); map.fitBounds(b, {top:60, bottom:150, left:30, right:30}); }
        };
      }catch(e){
        try{
          await M.loadLeaflet();
          const map = L.map(mapEl, {zoomControl:false, attributionControl:true, minZoom:3, maxZoom:19}).setView([pos.lat, pos.lng], 15);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);
          let me = null, marks = new Map(), layer = L.layerGroup().addTo(map);
          const ic = on=>L.divIcon({className:'mq-pin', html:pinSvg(on), iconSize:on ? [46, 56] : [38, 46], iconAnchor:on ? [23, 56] : [19, 46]});
          mapApi = {
            kind:'osm', center(p){ map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15)); },
            draw(items, selId, onPick){
              layer.clearLayers(); marks.clear();
              items.forEach(m=>{ const mk = L.marker([m.lat, m.lng], {icon:ic(m.id === selId), zIndexOffset:m.id === selId ? 1000 : 0}).on('click', ()=>onPick(m)); layer.addLayer(mk); marks.set(m.id, mk); });
              if(me) me.setLatLng([pos.lat, pos.lng]); else me = L.marker([pos.lat, pos.lng], {icon:L.divIcon({className:'mq-mep', html:meSvg, iconSize:[22, 22]}), interactive:false, zIndexOffset:2000}).addTo(map);
            },
            focus(m){ map.panTo([m.lat, m.lng]); },
            fit(items){ if(!items.length){ map.setView([pos.lat, pos.lng], 15); return; } const b = L.latLngBounds([[pos.lat, pos.lng]]); items.slice(0, 8).forEach(m=>b.extend([m.lat, m.lng])); map.fitBounds(b, {paddingTopLeft:[30, 60], paddingBottomRight:[30, 150], maxZoom:17}); }
          };
          setTimeout(()=>map.invalidateSize(), 250);
        }catch(e2){ try{ console.warn('map', e2 && e2.message || e2); }catch(_){} mapEl.classList.add('off'); mapEl.replaceChildren(h('div.mq-nomap', M.ic('mosque'), h('div', 'الخريطة تحتاج اتصالًا بالإنترنت'))); }
      }
    }

    /* the selected mosque: a card over the map */
    function pick(m, fromList){
      sel = m; drawCard(); if(mapApi) mapApi.draw(shown, m.id, pick); if(mapApi) mapApi.focus(m);
      list.querySelectorAll('.mq-it').forEach(x=>x.classList.toggle('on', x.dataset.id === m.id));
      if(!fromList){ const el = list.querySelector('.mq-it[data-id="' + CSS.escape(m.id) + '"]'); if(el) try{ el.scrollIntoView({block:'nearest', behavior:'smooth'}); }catch(e){} }
      else try{ stage.scrollIntoView({block:'nearest', behavior:'smooth'}); }catch(e){}
    }
    const stars = r=>{ const f = Math.round(r * 2) / 2; return h('span.mq-stars', {'aria-label':'التقييم ' + M.n(r.toFixed(1))}, ...[1, 2, 3, 4, 5].map(i=>h('i' + (f >= i ? '.f' : f >= i - 0.5 ? '.h' : ''), '★'))); };
    function drawCard(){
      if(!sel){ card.classList.remove('on'); card.replaceChildren(); return; }
      const m = sel, d = m.d != null ? m.d : dist(pos.lat, pos.lng, m.lat, m.lng);
      card.classList.add('on');
      card.replaceChildren(...[
        m.photo ? h('img.mq-ph', {src:m.photo, alt:'', loading:'lazy', referrerpolicy:'no-referrer', onerror:e=>e.target.remove()}) : null,
        h('div.mq-sc',
          h('div.mq-st', h('div.mq-sn', m.name || m.kind + ' (بلا اسم مسجّل)'), h('button.mq-x', {'aria-label':'إغلاق', onclick:()=>{ sel = null; drawCard(); mapApi && mapApi.draw(shown, null, pick); list.querySelectorAll('.mq-it.on').forEach(x=>x.classList.remove('on')); }}, M.ic('close'))),
          h('div.mq-sm', h('span', fmt(d)), h('span.dot'), h('span', walk(d)), m.rating ? [h('span.dot'), stars(m.rating), h('span.num', M.n(m.rating.toFixed(1)) + (m.votes ? ' (' + M.n(m.votes) + ')' : ''))] : null),
          m.addr ? h('div.mq-sa', m.addr) : null,
          m.hours ? h('div.mq-sa', M.ic('clock'), ' ' + m.hours) : null,
          h('div.mq-sb', h('button.btn.grow', {onclick:()=>M.openLink(dirUrl(m))}, M.ic('s:qibla'), 'اتجاهات'),
            h('button.btn.tonal.grow', {onclick:()=>M.openLink(m.uri || gUrl(m))}, M.ic('globe'), 'في خرائط جوجل')))].filter(Boolean));
    }

    function paint(refit){
      if(!all || !pos) return;
      const r = all.map(m=>Object.assign({}, m, {d:dist(pos.lat, pos.lng, m.lat, m.lng)})).filter(m=>m.d * 1000 <= rad).sort((a, b)=>a.d - b.d).slice(0, 60);
      shown = r;
      info.textContent = src === 'google' ? 'المصدر: خرائط جوجل — الأسماء والتقييمات من جوجل، وقد تتغير مواعيد العمل.' : 'المصدر: OpenStreetMap — قد تكون القائمة غير مكتملة في بعض المناطق.';
      if(sel && !r.some(x=>x.id === sel.id)) sel = null;
      if(!r.length){ list.replaceChildren(h('div.card.pad.mq-err', rad < MAXR ? 'لا توجد مساجد مسجّلة ضمن ' + (rad / 1000 === 1 ? 'كيلومتر' : M.n(rad / 1000) + ' كم') + '. جرّب نطاقًا أوسع.' : 'لم نجد مساجد مسجّلة ضمن هذا النطاق.', h('button.btn.tonal.sm', {onclick:()=>M.openLink('https://www.google.com/maps/search/' + encodeURIComponent('مسجد') + '/@' + pos.lat + ',' + pos.lng + ',15z')}, 'ابحث في خرائط جوجل'))); }
      else list.replaceChildren(...r.map((m, i)=>h('button.mq-it' + (sel && sel.id === m.id ? '.on' : ''), {dataset:{id:m.id}, onclick:()=>pick(m, true)},
        h('div.mq-ic', M.ic('mosque') || ''),
        h('div.grow.mq-tx', h('div.bold.mq-nm', m.name || m.kind + ' (بلا اسم مسجّل)'),
          h('div.tiny.muted.mq-mt', fmt(m.d) + ' • ' + walk(m.d), m.rating ? ' • ★ ' + M.n(m.rating.toFixed(1)) : '')),
        h('span.mq-go', M.ic('back')))));
      drawCard();
      if(mapApi){ mapApi.draw(r, sel && sel.id, pick); if(refit) mapApi.fit(r); }
    }
    async function fetchFor(p){
      const my = ++token;
      const c = cacheGet(p.lat, p.lng);
      if(c){ all = c.items; src = c.src; await initMap(); paint(true); if(Date.now() - c.at < 864e5) return; }
      else loading('جارٍ البحث عن المساجد…');
      const slow = setTimeout(()=>{ if(my === token && !all) loading('الشبكة بطيئة… ما زلنا نحاول'); }, 6000);
      try{
        let g = null;
        if(navigator.onLine && !M.googleFailed()){ try{ g = await queryGoogle(p.lat, p.lng); }catch(e){ try{ console.warn('places', e && e.message || e); }catch(_){} } }
        if(my !== token) return;
        if(g){ clearTimeout(slow); all = g; src = 'google'; cacheSet(p.lat, p.lng, src, all); await initMap(); paint(true); return; }
        let first = true;
        const show = items=>{ if(my !== token || !items) return; all = merge((all && src === 'osm' ? all : []).concat(items)); src = 'osm'; cacheSet(p.lat, p.lng, src, all); clearTimeout(slow); initMap().then(()=>{ if(my === token) paint(first); first = false; }); };
        const fast = queryPhoton(p.lat, p.lng).then(show);
        const full = queryOsm(p.lat, p.lng, 2000).then(show).then(()=>queryOsm(p.lat, p.lng, MAXR)).then(show);
        await any([fast, full]);
        full.catch(()=>{});
      }catch(e){
        clearTimeout(slow); if(my !== token || all) return;
        list.replaceChildren(h('div.card.pad.mq-err', navigator.onLine ? 'تعذّر جلب القائمة الآن. حاول لاحقًا.' : 'يلزم اتصال بالإنترنت للبحث عن المساجد.', h('button.btn.tonal.sm', {onclick:()=>fetchFor(p)}, 'إعادة المحاولة')));
      }
    }
    async function start(){
      const sv = M.cfg.loc;
      if(sv && isFinite(sv.lat)){ pos = {lat:sv.lat, lng:sv.lng}; initMap(); fetchFor(pos); }
      else loading('جارٍ تحديد موقعك…');
      try{
        const g = await quickFix();
        if(!pos || dist(pos.lat, pos.lng, g.lat, g.lng) > 0.15){ pos = g; all = null; sel = null; if(mapApi) mapApi.center(pos); initMap(); fetchFor(pos); }
        else { pos = g; paint(); }
      }catch(e){
        if(!pos) list.replaceChildren(h('div.card.pad.mq-err', 'تعذّر تحديد موقعك. فعّل الموقع أو حدّده من إعدادات الصلاة.', h('button.btn.tonal.sm', {onclick:start}, 'إعادة المحاولة')));
      }
    }
    drawChips();
    body.append(stage, h('div.mq-sheet', h('div.mq-grab'), h('div.mq-h', h('b', 'الأقرب إليك'), h('button.mq-gm', {onclick:()=>{ const p = pos || M.location(); M.openLink('https://www.google.com/maps/search/' + encodeURIComponent('مسجد') + '/@' + p.lat + ',' + p.lng + ',15z'); }}, M.ic('globe'), 'خرائط جوجل')), info, list));
    start();
  }});
}
M.openMosques = open;
try{ M.addSection({id:'mosques', title:'المساجد القريبة', icon:'mosque', group:'الصلاة والمواسم', fn:open}); }catch(e){ console.error(e); }
})();
