/* «المسلم» — free push server for the web / iPhone home-screen version.
   Cloudflare Worker (free plan) + one KV namespace bound as `KV` + a Cron Trigger "* * * * *".
   It stores, for each phone, only its push address and the times of its reminders; every minute it wakes the
   phones whose reminder time has come. The reminder text never leaves the phone (the push carries no data).
   No setup of keys is needed: the VAPID key pair is created on first use and kept in KV. */

const MAX_SUBS = 50, MAX_TIMES = 300;
const CORS = {'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type'};
const json = (o, s = 200)=>new Response(JSON.stringify(o), {status:s, headers:{'Content-Type':'application/json', ...CORS}});

const b64u = buf=>{ let s = ''; new Uint8Array(buf).forEach(b=>s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const b64uStr = str=>b64u(new TextEncoder().encode(str));

async function vapid(env){
  let k = await env.KV.get('vapid', 'json');
  if(!k){
    const pair = await crypto.subtle.generateKey({name:'ECDSA', namedCurve:'P-256'}, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    const raw = await crypto.subtle.exportKey('raw', pair.publicKey);
    k = {jwk, pub:b64u(raw)};
    await env.KV.put('vapid', JSON.stringify(k));
  }
  return k;
}
async function jwtFor(endpoint, k, contact){
  const aud = new URL(endpoint).origin;
  const head = b64uStr(JSON.stringify({typ:'JWT', alg:'ES256'}));
  const body = b64uStr(JSON.stringify({aud, exp:Math.floor(Date.now() / 1000) + 12 * 3600, sub:contact}));
  const key = await crypto.subtle.importKey('jwk', k.jwk, {name:'ECDSA', namedCurve:'P-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign({name:'ECDSA', hash:'SHA-256'}, key, new TextEncoder().encode(head+'.'+body));
  return head+'.'+body+'.'+b64u(sig);
}
/* an empty push: no payload encryption needed, the service worker shows the reminder it already has */
async function push(endpoint, k, contact){
  const t = await jwtFor(endpoint, k, contact);
  const r = await fetch(endpoint, {method:'POST', headers:{'TTL':'600', 'Urgency':'high', 'Content-Length':'0', 'Authorization':'vapid t='+t+', k='+k.pub}});
  return r.status;
}

const loadSubs = async env=>(await env.KV.get('subs', 'json')) || {};
const saveSubs = (env, s)=>env.KV.put('subs', JSON.stringify(s));
const okEndpoint = e=>typeof e === 'string' && /^https:\/\/[a-z0-9.-]+(:\d+)?\//i.test(e) && e.length < 1000;
const contactOf = env=>env.CONTACT || 'mailto:muslim-app@example.com';

export default {
  async fetch(req, env){
    if(req.method === 'OPTIONS') return new Response(null, {headers:CORS});
    if(!env.KV) return json({error:'KV binding missing: add a KV namespace binding named KV'}, 500);
    const path = new URL(req.url).pathname.replace(/\/+$/, '') || '/';
    try{
      if(path === '/' ) return json({ok:true, app:'muslim-push', subs:Object.keys(await loadSubs(env)).length});
      if(path === '/key') return json({key:(await vapid(env)).pub});
      if(req.method !== 'POST') return json({error:'not found'}, 404);
      const b = await req.json().catch(()=>({}));
      if(path === '/sub'){
        const e = b.sub && b.sub.endpoint;
        if(!okEndpoint(e)) return json({error:'bad subscription'}, 400);
        const now = Date.now();
        const times = (Array.isArray(b.times) ? b.times : []).map(Number).filter(t=>t > now - 60e3 && t < now + 40 * 86400e3).sort((a, b)=>a - b).slice(0, MAX_TIMES);
        const subs = await loadSubs(env);
        if(!subs[e] && Object.keys(subs).length >= MAX_SUBS) return json({error:'full'}, 429);
        subs[e] = {times, last:(subs[e] && subs[e].last) || 0, at:now};
        await saveSubs(env, subs);
        return json({ok:true, count:times.length, next:times[0] || null});
      }
      if(path === '/unsub'){
        const subs = await loadSubs(env);
        if(b.endpoint && subs[b.endpoint]){ delete subs[b.endpoint]; await saveSubs(env, subs); }
        return json({ok:true});
      }
      if(path === '/test'){
        const e = b.endpoint; if(!okEndpoint(e)) return json({error:'bad endpoint'}, 400);
        const subs = await loadSubs(env); if(!subs[e]) return json({error:'unknown'}, 404);
        return json({status:await push(e, await vapid(env), contactOf(env))});
      }
      return json({error:'not found'}, 404);
    }catch(err){ return json({error:String(err && err.message || err)}, 500); }
  },
  /* every minute: wake each phone whose next reminder time has come */
  async scheduled(ev, env){
    if(!env.KV) return;
    const subs = await loadSubs(env); const now = Date.now(); let changed = false;
    const k = await vapid(env), contact = contactOf(env);
    for(const [e, s] of Object.entries(subs)){
      const due = (s.times || []).filter(t=>t > (s.last || 0) && t <= now + 30e3);
      if(due.length){
        let st = 0; try{ st = await push(e, k, contact); }catch(err){ st = 0; }
        if(st === 404 || st === 410){ delete subs[e]; changed = true; continue; }
        s.last = Math.max(...due); changed = true;
      }
      const left = (s.times || []).filter(t=>t > now - 30 * 60e3);
      if(left.length !== (s.times || []).length){ s.times = left; changed = true; }
      if(!s.times.length && now - (s.at || 0) > 30 * 86400e3){ delete subs[e]; changed = true; }   // abandoned
    }
    if(changed) await saveSubs(env, subs);
  }
};
