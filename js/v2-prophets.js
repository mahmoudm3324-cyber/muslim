/* ===== prophets: SVG scene engine (symbolic art only — never figures) ===== */
(function(){
'use strict';
const M = window.M;
const NS = 'http://www.w3.org/2000/svg';
let UID = 0;
function rnd(seed){ let s = seed >>> 0 || 1; return ()=>{ s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const f1 = n=>Math.round(n * 10) / 10;

/* ---- building blocks (return SVG markup strings) ---- */
const lg = (id, stops, x1, y1, x2, y2)=>'<linearGradient id="'+id+'" x1="'+(x1||0)+'" y1="'+(y1||0)+'" x2="'+(x2||0)+'" y2="'+(y2==null?1:y2)+'">'+stops.map((s, i)=>'<stop offset="'+(s[2]!=null?s[2]:f1(i/(stops.length-1)))+'" stop-color="'+s[0]+'"'+(s[1]!=null&&s[1]<1?' stop-opacity="'+s[1]+'"':'')+'/>').join('')+'</linearGradient>';
const rg = (id, stops, cx, cy, r)=>'<radialGradient id="'+id+'" cx="'+(cx==null?.5:cx)+'" cy="'+(cy==null?.5:cy)+'" r="'+(r||.5)+'">'+stops.map((s, i)=>'<stop offset="'+f1(i/(stops.length-1))+'" stop-color="'+s[0]+'" stop-opacity="'+(s[1]==null?1:s[1])+'"/>').join('')+'</radialGradient>';
function stars(n, seed, y0, y1, o){
  o = o || {}; const R = rnd(seed), out = [];
  for(let i = 0; i < n; i++){
    const x = f1(R() * 400), y = f1(y0 + R() * (y1 - y0)), r = f1(.5 + R() * (o.big || 1.3)), d = f1(R() * 4);
    out.push('<circle class="pz-tw" cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+(o.fill || '#fff')+'" style="animation-delay:-'+d+'s;animation-duration:'+f1(2.5 + R() * 3)+'s"/>');
  }
  return out.join('');
}
const spark = (x, y, s, fill, cls, d)=>'<path class="'+(cls || 'pz-tw')+'" d="M'+x+' '+(y-s)+'Q'+x+' '+y+' '+(x+s)+' '+y+'Q'+x+' '+y+' '+x+' '+(y+s)+'Q'+x+' '+y+' '+(x-s)+' '+y+'Q'+x+' '+y+' '+x+' '+(y-s)+'z" fill="'+(fill || '#fff')+'" style="animation-delay:-'+(d||0)+'s"/>';
const rect = (x, y, w, h2, fill, rx, extra)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h2+'" rx="'+(rx||0)+'" fill="'+fill+'" '+(extra||'')+'/>';
const circ = (x, y, r, fill, extra)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" '+(extra||'')+'/>';
const path = (d, fill, extra)=>'<path d="'+d+'" fill="'+fill+'" '+(extra||'')+'/>';
const line = (d, stroke, w, extra)=>'<path d="'+d+'" fill="none" stroke="'+stroke+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" '+(extra||'')+'/>';
function cloud(x, y, s, fill, op, cls, dly){
  return '<g class="'+(cls || 'pz-drift')+'" style="animation-delay:-'+(dly||0)+'s"><g transform="translate('+x+' '+y+') scale('+s+')" fill="'+fill+'" opacity="'+(op==null?.85:op)+'"><ellipse cx="0" cy="0" rx="34" ry="11"/><circle cx="-12" cy="-8" r="13"/><circle cx="8" cy="-13" r="16"/><circle cx="24" cy="-4" r="10"/></g></g>';
}
function sunAt(x, y, r, core, glow, ray){
  const id = 'sg' + (++UID);
  return '<defs>'+rg(id, [[glow, .9], [glow, .25], [glow, 0]])+'</defs>'+circ(x, y, r*3.2, 'url(#'+id+')', 'class="pz-pulse"')+(ray ? '<g class="pz-spin" style="transform-origin:'+x+'px '+y+'px" stroke="'+glow+'" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round">'+Array.from({length:14}, (_, i)=>{ const a = i*Math.PI/7; return '<path d="M'+f1(x+Math.cos(a)*r*1.5)+' '+f1(y+Math.sin(a)*r*1.5)+'L'+f1(x+Math.cos(a)*r*2.3)+' '+f1(y+Math.sin(a)*r*2.3)+'"/>'; }).join('')+'</g>' : '')+circ(x, y, r, core);
}
function moonAt(x, y, r, fill, glowc){
  const id = 'mg' + (++UID);
  return '<defs>'+rg(id, [[glowc || '#cfe0ff', .55], [glowc || '#cfe0ff', 0]])+'</defs>'+circ(x, y, r*2.6, 'url(#'+id+')')+
    path('M'+x+' '+(y-r)+'A'+r+' '+r+' 0 1 0 '+x+' '+(y+r)+'A'+f1(r*.78)+' '+f1(r*.78)+' 0 1 1 '+x+' '+(y-r)+'z', fill || '#fff7d6');
}
function fullMoon(x, y, r){
  const id = 'mg' + (++UID);
  return '<defs>'+rg(id, [['#fff6cf', .6], ['#fff6cf', 0]])+'</defs>'+circ(x, y, r*2.4, 'url(#'+id+')', 'class="pz-pulse"')+circ(x, y, r, '#fff4cf')+circ(x - r*.3, y - r*.2, r*.22, '#e9dcae', 'opacity=".6"')+circ(x + r*.35, y + r*.3, r*.16, '#e9dcae', 'opacity=".6"')+circ(x + r*.1, y - r*.5, r*.12, '#e9dcae', 'opacity=".5"');
}
function palm(x, y, s, fruit, lean){
  lean = lean == null ? 8 : lean;
  const tx = x + lean*s, ty = y - 78*s;
  let fr = '';
  for(let i = 0; i < 7; i++){
    const a = -Math.PI*0.95 + i*(Math.PI*0.95/3);  // fan
    const ex = tx + Math.cos(a)*34*s, ey = ty + Math.sin(a)*(i%2?20:26)*s + 12*s;
    fr += '<path d="M'+f1(tx)+' '+f1(ty)+'Q'+f1((tx+ex)/2)+' '+f1(ty-18*s)+' '+f1(ex)+' '+f1(ey)+'Q'+f1((tx+ex)/2)+' '+f1(ty-8*s)+' '+f1(tx)+' '+f1(ty+2*s)+'z" fill="#2f8a4a"/>';
  }
  return '<g class="pz-sway" style="transform-origin:'+x+'px '+y+'px"><path d="M'+(x-4*s)+' '+y+'Q'+f1(x+lean*s*.2)+' '+f1(y-40*s)+' '+f1(tx-2.5*s)+' '+f1(ty)+'L'+f1(tx+2.5*s)+' '+f1(ty)+'Q'+f1(x+lean*s*.2+6*s)+' '+f1(y-40*s)+' '+(x+4*s)+' '+y+'z" fill="#7a5530"/>'+
    fr+(fruit ? circ(f1(tx-4*s), f1(ty+6*s), 2.6*s, '#a8541c')+circ(f1(tx+3*s), f1(ty+8*s), 2.6*s, '#c1682a')+circ(f1(tx), f1(ty+12*s), 2.6*s, '#a8541c') : '')+'</g>';
}
function tree(x, y, s, fruit, canopy){
  const R = rnd(Math.round(x*7 + y));
  let fr = '';
  if(fruit) for(let i = 0; i < 9; i++){ const a = R()*6.28, d = R()*28*s; fr += circ(f1(x + Math.cos(a)*d), f1(y - 62*s + Math.sin(a)*d*.8), 3*s, i%3 ? '#e8493f' : '#f4b73c', 'class="pz-tw" style="animation-delay:-'+f1(R()*3)+'s"'); }
  return '<path d="M'+(x-5*s)+' '+y+'Q'+x+' '+(y-30*s)+' '+(x-3*s)+' '+(y-50*s)+'L'+(x+3*s)+' '+(y-50*s)+'Q'+(x+2*s)+' '+(y-28*s)+' '+(x+5*s)+' '+y+'z" fill="#6b4a2c"/>'+
    '<g class="pz-sway" style="transform-origin:'+x+'px '+y+'px"><ellipse cx="'+x+'" cy="'+(y-62*s)+'" rx="'+(36*s)+'" ry="'+(30*s)+'" fill="'+(canopy || '#2f8f4d')+'"/><ellipse cx="'+(x-18*s)+'" cy="'+(y-52*s)+'" rx="'+(22*s)+'" ry="'+(18*s)+'" fill="'+(canopy || '#2f8f4d')+'" opacity=".9"/><ellipse cx="'+(x+20*s)+'" cy="'+(y-54*s)+'" rx="'+(22*s)+'" ry="'+(18*s)+'" fill="#3da35c" opacity=".9"/>'+fr+'</g>';
}
function bird(x, y, s, fill, cls, dly){
  return '<g class="'+(cls || 'pz-fly')+'" style="animation-delay:-'+(dly||0)+'s"><path d="M'+x+' '+y+'q'+(-5*s)+' '+(-6*s)+' '+(-10*s)+' '+(-2*s)+'M'+x+' '+y+'q'+(5*s)+' '+(-6*s)+' '+(10*s)+' '+(-2*s)+'" fill="none" stroke="'+(fill || '#222')+'" stroke-width="'+f1(1.6*s)+'" stroke-linecap="round"/></g>';
}
function camel(x, y, s, fill, flip){
  // single-hump camel silhouette, base line y, facing right
  const d = 'M0 0 L0 -26 L3 -26 L4 -12 L8 -12 L9 -26 L12 -26 L12 -30 Q6 -32 4 -38 Q8 -50 18 -44 Q24 -42 28 -50 Q32 -34 40 -33 Q48 -42 52 -52 L56 -50 Q54 -40 50 -33 L58 -30 L58 -26 L55 -26 L53 0 L50 0 L48 -26 L44 -26 L42 0 L39 0 L38 -24 L32 -24 L30 -18 L28 -26 L24 -26 L22 0 L19 0 L17 -26 L12 -26z';
  return '<g transform="translate('+x+' '+y+') scale('+(flip?-s:s)+' '+s+')" fill="'+fill+'"><path d="M2 -26 L5 -26 L5 0 L2 0z M12 -26 L15 -26 L16 0 L13 0z M40 -26 L43 -26 L43 0 L40 0z M52 -26 L55 -26 L56 0 L53 0z"/><path d="M0 -24 Q2 -34 12 -33 Q20 -52 30 -33 Q44 -32 52 -34 Q58 -40 56 -52 L60 -64 Q62 -68 66 -66 L72 -62 Q74 -58 70 -57 L64 -57 L61 -48 Q58 -36 56 -28 Q50 -22 40 -22 Q16 -20 0 -24z"/><path d="M60 -64 L62 -69 L64 -64z"/></g>';
}
function dunes(y, fillA, fillB){
  return path('M-10 '+(y+30)+'Q70 '+(y-18)+' 150 '+(y+6)+'T330 '+(y-4)+'T420 '+(y+10)+'L420 250 L-10 250z', fillA)+path('M-10 '+(y+44)+'Q90 '+(y+10)+' 200 '+(y+30)+'T420 '+(y+24)+'L420 250 L-10 250z', fillB);
}
function hills(y, c1, c2, c3){
  return path('M-10 '+(y+10)+'Q60 '+(y-34)+' 140 '+(y-8)+'T290 '+(y-14)+'T420 '+(y-4)+'L420 250 L-10 250z', c1)+
    path('M-10 '+(y+34)+'Q80 '+(y-6)+' 170 '+(y+18)+'T330 '+(y+8)+'T420 '+(y+24)+'L420 250 L-10 250z', c2)+(c3 ? path('M-10 '+(y+60)+'Q100 '+(y+30)+' 200 '+(y+48)+'T420 '+(y+44)+'L420 250 L-10 250z', c3) : '');
}
function mountain(pts, fill, snow){
  return path('M'+pts.map(p=>p.join(' ')).join('L')+'z', fill)+(snow || '');
}
function waves(y, fill, op, cls, amp){
  amp = amp || 6;
  let d = 'M-60 '+y;
  for(let i = 0; i < 9; i++) d += 'q40 '+(-amp)+' 80 0';
  d += 'L560 260 L-60 260z';
  return '<g class="'+(cls || 'pz-wave')+'"><path d="'+d+'" fill="'+fill+'" opacity="'+(op==null?1:op)+'"/></g>';
}
function rain(n, seed, col){
  const R = rnd(seed); let o = '';
  for(let i = 0; i < n; i++){ const x = f1(R()*430 - 20), y = f1(R()*240), d = f1(R()); o += '<path class="pz-rain" d="M'+x+' '+y+'l-4 12" stroke="'+(col || '#bcd3ea')+'" stroke-width="1.2" stroke-linecap="round" style="animation-delay:-'+d+'s;animation-duration:'+f1(.55 + R()*.4)+'s"/>'; }
  return o;
}
function flame(x, y, w, h2, c1, c2, dly){
  return '<path class="pz-flick" style="animation-delay:-'+(dly||0)+'s;transform-origin:'+x+'px '+y+'px" d="M'+x+' '+(y-h2)+'Q'+(x+w*.9)+' '+(y-h2*.45)+' '+(x+w*.55)+' '+(y-h2*.1)+'Q'+x+' '+(y+h2*.12)+' '+(x-w*.55)+' '+(y-h2*.1)+'Q'+(x-w*.9)+' '+(y-h2*.45)+' '+x+' '+(y-h2)+'z" fill="url(#'+c1+')"/>';
}
function column(x, y, w, h2, fill, cap){
  return rect(x, y, w, h2, fill)+rect(x - w*.18, y - 5, w*1.36, 7, cap || fill)+rect(x - w*.18, y + h2 - 4, w*1.36, 6, cap || fill)+
    '<path d="M'+(x+w*.3)+' '+(y+4)+'v'+(h2-8)+'M'+(x+w*.7)+' '+(y+4)+'v'+(h2-8)+'" stroke="#000" stroke-opacity=".12" stroke-width="1.3"/>';
}
function torch(x, y, id){
  return rect(x - 2, y, 4, 20, '#5b3a22', 1)+rect(x - 5, y - 3, 10, 5, '#8a6a3a', 1)+flame(x, y - 3, 6, 18, id, id, x%3)+circ(x, y - 12, 22, 'url(#'+id+'g)', 'class="pz-pulse"');
}
function arch(x, y, w, h2){ // arch top opening path (no fill attr)
  const r = w/2; return 'M'+x+' '+(y+h2)+'V'+(y+r)+'A'+r+' '+r+' 0 0 1 '+(x+w)+' '+(y+r)+'V'+(y+h2)+'z';
}
function olive(x, y, s, rot){
  let l = '';
  [[-1, 0], [1, 8], [-1, 16], [1, 24], [-1, 32]].forEach(([sd, k])=>{ l += '<ellipse cx="'+(sd*7)+'" cy="'+(-k - 4)+'" rx="9" ry="3.4" transform="rotate('+(sd*-25)+' '+(sd*7)+' '+(-k - 4)+')" fill="'+(k%16 ? '#7ea34a' : '#98b85a')+'"/>'; });
  return '<g transform="translate('+x+' '+y+') rotate('+(rot||0)+') scale('+s+')"><path d="M0 8Q-2 -14 2 -40" stroke="#6b5532" stroke-width="2.2" fill="none" stroke-linecap="round"/>'+l+'<ellipse cx="3" cy="-42" rx="9" ry="3.4" transform="rotate(-80 3 -42)" fill="#98b85a"/></g>';
}
function dove(x, y, s, fill){
  return '<g class="pz-float" transform="translate('+x+' '+y+') scale('+s+')" fill="'+fill+'"><path d="M-22 4Q-8 -6 8 -2Q16 -10 24 -8Q20 -2 22 2Q14 12 -2 12Q-14 12 -22 4z"/><path d="M-6 -2Q-18 -26 -34 -30Q-26 -14 -18 2z" opacity=".95"/><path d="M-2 0Q4 -22 16 -32Q14 -14 8 0z" opacity=".9"/><path d="M-22 4L-38 10L-24 10z"/><circle cx="23" cy="-6" r="1.1" fill="#444"/><path d="M25 -7l5 2-5 1z" fill="#e0a43a"/></g>';
}
function ant(x, y, s, dly, dur, col){
  return '<g class="pz-ant" style="animation-delay:-'+dly+'s;animation-duration:'+dur+'s"><g transform="translate('+x+' '+y+') scale('+s+')" fill="'+(col || '#2b1c14')+'"><ellipse cx="-6" cy="0" rx="3.4" ry="2.6"/><ellipse cx="0" cy="0" rx="2.4" ry="2"/><ellipse cx="5" cy="0" rx="3" ry="2.4"/><path d="M-6 0l-4 5M-6 0l-3 6M0 0l-1 6M0 0l2 6M5 0l3 5M5 0l5 3M7 -2l4 -3M7 -2l5 0" stroke="'+(col || '#2b1c14')+'" stroke-width=".7" fill="none"/></g></g>';
}
function leaf(x, y, w, rot, c1, c2){
  return '<g transform="translate('+x+' '+y+') rotate('+rot+')"><path d="M0 0Q'+(w*.5)+' '+(-w*.55)+' '+w+' 0Q'+(w*.5)+' '+(w*.55)+' 0 0z" fill="'+c1+'"/><path d="M0 0L'+w+' 0" stroke="'+c2+'" stroke-width="1.2"/></g>';
}
function lampSVG(x, y, id){
  return '<path d="M'+x+' 0V'+y+'" stroke="#8c7340" stroke-width="1.2"/>'+circ(x, y + 14, 38, 'url(#'+id+')', 'class="pz-pulse"')+
    path('M'+(x-9)+' '+y+'h18l4 8h-26z', '#c9a24b')+path('M'+(x-11)+' '+(y+8)+'Q'+(x-14)+' '+(y+26)+' '+x+' '+(y+30)+'Q'+(x+14)+' '+(y+26)+' '+(x+11)+' '+(y+8)+'z', '#f6d98a', 'opacity=".95"')+
    flame(x, y + 24, 3.5, 12, id+'f', id+'f', 0);
}

/* ---- the scenes: each returns inner SVG markup. U(n) is a unique id for this instance ---- */
const S = {};
S.creation = U=>{
  const g = U('bg'), e = U('e'), c = U('c');
  return '<defs>'+rg(g, [['#1b2f6b'], ['#0a1233'], ['#050818']], .5, .55, .75)+rg(e, [['#7fd0ff'], ['#2a79c6'], ['#10346f']], .35, .3, .75)+rg(c, [['#8cd2ff', .6], ['#8cd2ff', 0]])+'<clipPath id="'+U('cl')+'"><circle cx="200" cy="128" r="54"/></clipPath></defs>'+
    rect(0, 0, 400, 240, 'url(#'+g+')')+stars(80, 11, 0, 240)+spark(60, 40, 5, '#fff', 'pz-tw', 1)+spark(340, 60, 6, '#cfe6ff', 'pz-tw', 2)+
    circ(200, 128, 120, 'url(#'+c+')', 'class="pz-pulse"')+
    '<g class="pz-spin-slow" style="transform-origin:200px 128px" stroke="#9bd6ff" stroke-opacity=".28" stroke-width="3" stroke-linecap="round">'+Array.from({length:16}, (_, i)=>{ const a = i*Math.PI/8; return '<path d="M'+f1(200+Math.cos(a)*70)+' '+f1(128+Math.sin(a)*70)+'L'+f1(200+Math.cos(a)*(i%2?100:118))+' '+f1(128+Math.sin(a)*(i%2?100:118))+'"/>'; }).join('')+'</g>'+
    circ(200, 128, 54, 'url(#'+e+')')+'<g clip-path="url(#'+U('cl')+')"><path d="M160 108q14-14 30-6t6 18-22 8-14 20-14-12z" fill="#3f9d5a" opacity=".85"/><path d="M214 140q20-8 30 6t-8 22-20 4z" fill="#3f9d5a" opacity=".85"/><path d="M180 82q20 4 40-2" stroke="#fff" stroke-opacity=".5" stroke-width="4" fill="none"/><circle cx="188" cy="110" r="56" fill="#fff" opacity=".07"/><circle cx="222" cy="150" r="64" fill="#02143a" opacity=".38"/></g>';
};
S.garden = U=>{
  const sk = U('s'), r = U('r');
  return '<defs>'+lg(sk, [['#ffe9a8'], ['#bfe6a0'], ['#8ed08a']])+lg(r, [['#7fd4f0'], ['#3aa7d6']], 0, 0, 1, 0)+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+
    sunAt(300, 60, 20, '#fff5c4', '#ffe08a', true)+cloud(80, 50, .8, '#fff', .7)+
    hills(112, '#7cc47a', '#5fb064', '#46994f')+
    '<path d="M150 250Q190 190 160 160Q140 140 200 128Q250 118 232 108" stroke="url(#'+r+')" stroke-width="22" fill="none" stroke-linecap="round" opacity=".95"/><path class="pz-dash" d="M158 230Q192 188 168 160M196 140Q236 126 226 112" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-dasharray="6 10" stroke-linecap="round"/>'+
    tree(70, 190, 1, true)+tree(330, 176, .8, true)+tree(280, 214, 1.1, true, '#2a8a4a')+tree(115, 140, .55, true)+
    Array.from({length:6}, (_, i)=>spark(40 + i*62, 100 + (i%3)*18, 3, '#fff3b0', 'pz-tw', i)).join('');
};
S.tree = U=>{
  const sk = U('s'), gl = U('g');
  return '<defs>'+lg(sk, [['#10224f'], ['#1d4a63'], ['#2f7a62']])+rg(gl, [['#ffd86b', .65], ['#ffd86b', 0]])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(40, 5, 0, 120)+moonAt(318, 48, 20)+
    hills(160, '#2f7a52', '#256b46', '#1c5a3c')+circ(200, 120, 100, 'url(#'+gl+')', 'class="pz-pulse"')+
    '<path d="M190 214Q196 160 188 126L212 126Q204 160 212 214z" fill="#6b4a2c"/><path d="M200 150Q170 140 160 122M200 140Q230 132 244 114" stroke="#6b4a2c" stroke-width="5" fill="none" stroke-linecap="round"/>'+
    '<g class="pz-sway" style="transform-origin:200px 214px"><ellipse cx="200" cy="96" rx="84" ry="56" fill="#2a8a4d"/><ellipse cx="150" cy="116" rx="46" ry="32" fill="#2f9a55"/><ellipse cx="252" cy="116" rx="46" ry="32" fill="#2a8a4d"/><ellipse cx="200" cy="70" rx="52" ry="30" fill="#38a65f"/>'+
    Array.from({length:12}, (_, i)=>{ const R = rnd(i + 31); return circ(f1(130 + R()*140), f1(70 + R()*70), 4.4, i%2 ? '#f4b73c' : '#ff6a4f', 'class="pz-tw" style="animation-delay:-'+f1(R()*3)+'s"'); }).join('')+'</g>';
};
S.earth_desc = U=>{
  const sk = U('s');
  return '<defs>'+lg(sk, [['#33406f'], ['#c2677a', 1, .45], ['#ffb066', 1, .75], ['#ffe0a0']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(20, 3, 0, 60)+
    sunAt(200, 150, 28, '#fff2c6', '#ffc46b', true)+
    path('M-10 160Q80 140 160 156T320 150T420 158L420 250 L-10 250z', '#7d5a46')+
    path('M-10 190L40 170L74 186L120 164L170 190L230 168L290 192L350 172L420 190L420 250 L-10 250z', '#5c4034')+
    path('M30 250L70 214L120 232L170 206L230 240L290 212L340 238L400 214L400 250z', '#46302a')+
    '<g class="pz-sway" style="transform-origin:200px 214px"><path d="M200 214Q198 196 200 184" stroke="#4aa35a" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+leaf(200, 190, 14, -30, '#5cc06a', '#2f7a3c')+leaf(200, 196, 12, -150, '#4aa35a', '#2f7a3c')+'</g>';
};
S.night_stars = U=>{
  const sk = U('s');
  return '<defs>'+lg(sk, [['#06102e'], ['#14295e'], ['#2a3f78']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(110, 21, 0, 170, {big:1.5})+fullMoon(290, 66, 28)+spark(70, 54, 6, '#fff', 'pz-tw', 1)+spark(160, 90, 4, '#cfe0ff', 'pz-tw', 2)+
    dunes(170, '#1b2347', '#10173a')+path('M0 250L0 214Q60 200 120 214T260 208T400 214L400 250z', '#0a1030');
};
S.ark = U=>{
  const sk = U('s');
  return '<defs>'+lg(sk, [['#3b4658'], ['#566579'], ['#7a8b9d']])+lg(U('h'), [['#9a6a3c'], ['#6e4524']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+
    path('M0 130L50 96L90 118L140 84L190 120L400 120L400 150L0 150z', '#6c7e90', 'opacity=".5"')+
    cloud(60, 38, 1.3, '#38414f', .95)+cloud(200, 28, 1.6, '#2f3744', .95, 'pz-drift', 4)+cloud(340, 44, 1.3, '#38414f', .95, 'pz-drift', 8)+rain(46, 7, '#cfe0f2')+
    waves(150, '#2b5e86', .9, 'pz-wave', 8)+
    '<g class="pz-bob" style="transform-origin:200px 160px"><g transform="translate(0 -12)"><path d="M118 142H282L262 176Q200 190 138 176z" fill="url(#'+U('h')+')"/><path d="M130 160Q200 172 270 160" stroke="#4e2f15" stroke-width="1.5" fill="none"/>'+rect(160, 112, 80, 32, '#a77a47', 3)+path('M154 114L200 92L246 114z', '#7a4f26')+rect(170, 122, 12, 10, '#3a2412', 2)+rect(194, 122, 12, 10, '#3a2412', 2)+rect(218, 122, 12, 10, '#3a2412', 2)+'<path d="M126 148H274" stroke="#4e2f15" stroke-width="2"/></g></g>'+
    waves(170, '#1f4a70', .95, 'pz-wave2', 7)+waves(196, '#173c5c', 1, 'pz-wave', 9)+
    '';
};
S.flood = U=>{
  const sk = U('s');
  return '<defs>'+lg(sk, [['#1b2230'], ['#2f3a4c'], ['#445066']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+
    cloud(70, 36, 1.7, '#111722', 1)+cloud(190, 22, 2, '#0e131d', 1, 'pz-drift', 3)+cloud(320, 40, 1.7, '#141b27', 1, 'pz-drift', 7)+
    '<g class="pz-flash"><path d="M232 52L214 100L232 100L212 148L250 92L232 92L248 52z" fill="#fff6c8"/><rect width="400" height="240" fill="#cfe0ff" opacity=".12"/></g>'+
    path('M20 150Q60 118 110 150z', '#2b3646')+path('M270 140Q320 100 380 140z', '#2b3646')+rain(70, 9, '#a9c2dc')+
    waves(146, '#243f5c', .95, 'pz-wave', 7)+waves(172, '#1a3149', 1, 'pz-wave2', 8)+waves(204, '#102236', 1, 'pz-wave', 9);
};
S.dove = U=>{
  const sk = U('s');
  const arcs = ['#f26b6b', '#f7a85e', '#f6dc6a', '#7ccf8a', '#6cb4f0', '#8e7be6'].map((c, i)=>'<path d="M30 190A170 150 0 0 1 370 190" transform="translate(0 '+(i*-6 + 10)+') scale(1)" stroke="'+c+'" stroke-width="5" fill="none" opacity=".45" style="transform-origin:200px 190px" />').join('');
  return '<defs>'+lg(sk, [['#9fd4f2'], ['#dff1f7'], ['#fff4d8']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(90, 56, 16, '#fff6cc', '#ffe9a0', true)+cloud(300, 44, 1, '#fff', .9)+cloud(180, 70, .7, '#fff', .8, 'pz-drift', 5)+arcs+
    hills(176, '#9fcf8e', '#7fba7c', '#5fa468')+olive(90, 200, 1.5, -20)+olive(330, 206, 1.2, 25)+dove(210, 98, 1.5, '#ffffff')+
    path('M150 130Q170 120 190 120', 'none', 'stroke="#e0a43a" stroke-width="0"');
};
S.dunes_wind = U=>{
  const sk = U('s');
  const cols = [[90, 124], [150, 112], [300, 120]].map(([x, y])=>column(x, y, 18, 70, '#b98552', '#a2713f')).join('');
  let w = '';
  [[20, 70, 130], [60, 100, 160], [120, 150, 140], [10, 140, 110], [200, 88, 150]].forEach(([x, y, l], i)=>{ w += '<path class="pz-wind" style="animation-delay:-'+i*.7+'s" d="M'+x+' '+y+'q'+l*.4+' -16 '+l*.7+' 0t'+l*.3+' -6" stroke="#fff2d6" stroke-opacity=".55" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="60 40"/>'; });
  return '<defs>'+lg(sk, [['#e8a064'], ['#f3c382'], ['#fbe1aa']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(320, 50, 14, '#fff0c0', '#ffd39a')+cols+
    path('M-10 184Q90 150 170 176T330 168T420 178L420 250 L-10 250z', '#d9965a')+path('M-10 206Q110 176 220 202T420 196L420 250 L-10 250z', '#c07a45')+path('M-10 230Q120 210 240 228T420 224L420 250 L-10 250z', '#a8643a')+w+
    '<g class="pz-grain">'+Array.from({length:18}, (_, i)=>{ const R = rnd(i + 77); return circ(f1(R()*400), f1(120 + R()*100), 1.2, '#fbe0b0', 'opacity=".7"'); }).join('')+'</g>';
};
S.rock_camel = U=>{
  const sk = U('s'), wt = U('w');
  let doors = '';
  [[60, 112], [110, 90], [168, 118], [240, 100], [300, 124], [346, 96]].forEach(([x, y])=>{ doors += '<path d="'+arch(x, y, 22, 36)+'" fill="#3d1f1a"/><path d="'+arch(x - 5, y - 6, 32, 42)+'" fill="none" stroke="#a45a40" stroke-width="2.4"/>'; });
  return '<defs>'+lg(sk, [['#f6c58b'], ['#fbe2b8']])+lg(wt, [['#8fe0f4'], ['#3b9bc4']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(60, 40, 12, '#fff2cc', '#ffd7a0')+
    path('M-10 170L-10 70L40 56L90 76L160 50L240 70L300 46L360 62L420 50L420 170z', '#b8603f')+path('M-10 170L-10 100L50 86L110 104L180 80L260 100L330 78L420 96L420 170z', '#cf7550')+
    path('M0 100L30 90L50 100L50 170L0 170z', '#e08b62', 'opacity=".4"')+doors+
    path('M-10 250V176Q100 164 200 178T420 170V250z', '#e3b27a')+'<ellipse cx="248" cy="204" rx="60" ry="12" fill="url(#'+wt+')"/><path class="pz-dash" d="M200 204h96M214 208h60" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" stroke-dasharray="8 8" stroke-linecap="round"/>'+
    camel(150, 214, .9, '#4b2c1e')+path('M250 190q-6-8 0-14q6 6 0 14z M280 192q-5-6 0-12q5 6 0 12z', '#4f9a56');
};
S.fire = U=>{
  const sk = U('s'), f = U('f'), fg = U('fg');
  return '<defs>'+lg(sk, [['#0e1a3a'], ['#243a6b'], ['#3d5d8f']])+lg(f, [['#fff6c4'], ['#ffb637', 1, .45], ['#ff5a1f']], 0, 0, 0, 1)+rg(fg, [['#9fd8ff', .55], ['#ffb637', .25], ['#ffb637', 0]])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(50, 4, 0, 120)+
    path('M-10 190Q100 170 200 186T420 180L420 250 L-10 250z', '#2a5c4a')+circ(200, 150, 100, 'url(#'+fg+')', 'class="pz-pulse"')+
    Array.from({length:9}, (_, i)=>{ const a = Math.PI + i*Math.PI/8; return '<ellipse cx="'+f1(200 + Math.cos(a)*62)+'" cy="'+f1(206 + Math.sin(a)*14)+'" rx="12" ry="7" fill="#5b5f66"/>'; }).join('')+
    flame(200, 204, 46, 120, f, f, 0)+flame(170, 204, 28, 80, f, f, .6)+flame(232, 204, 28, 86, f, f, 1.1)+flame(200, 204, 22, 70, f, f, 1.7)+
    leaf(120, 214, 26, -20, '#5cc06a', '#2f7a3c')+leaf(106, 220, 22, 190, '#4aa35a', '#2f7a3c')+leaf(282, 214, 26, 200, '#5cc06a', '#2f7a3c')+leaf(296, 222, 22, -10, '#4aa35a', '#2f7a3c')+
    circ(150, 224, 4, '#fff', 'opacity=".9"')+circ(150, 224, 2, '#f6d84a')+circ(256, 226, 4, '#ffd0e0')+circ(256, 226, 2, '#f6d84a')+circ(88, 228, 3.4, '#cfe6ff')+circ(318, 228, 3.4, '#fff')+
    '<g>'+Array.from({length:8}, (_, i)=>circ(f1(170 + i*8), 100 - (i%3)*14, 1.6, '#ffd27a', 'class="pz-ember" style="animation-delay:-'+i*.5+'s"')).join('')+'</g>';
};
S.stars_moon_sun = U=>{
  const sk = U('s');
  return '<defs>'+lg(sk, [['#0b1740'], ['#3b3f7d', 1, .45], ['#e9a072', 1, .72], ['#8fd0f0']], 0, 0, 1, 0)+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(40, 8, 0, 80)+
    '<path d="M30 200Q200 -30 370 200" stroke="#fff" stroke-opacity=".4" stroke-width="2" fill="none" stroke-dasharray="3 8" stroke-linecap="round"/>'+
    spark(62, 134, 12, '#fff', 'pz-tw', 0)+circ(62, 134, 5, '#fff')+moonAt(200, 62, 19)+sunAt(338, 134, 18, '#fff3b8', '#ffd35a', true)+
    path('M-10 220Q100 206 200 218T420 212L420 250 L-10 250z', '#1d2a55', 'opacity=".9"');
};
S.kaaba = U=>{
  const sk = U('s');
  return '<defs>'+lg(sk, [['#f9c7a0'], ['#fde5c2'], ['#fff4de']])+lg(U('k'), [['#2b2b2f'], ['#0c0c0e']])+lg(U('kd'), [['#171719'], ['#050506']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(200, 150, 26, '#fff6d6', '#ffd9a0', true)+
    path('M-10 170L-10 120L40 92L90 118L140 84L190 120L240 90L300 126L350 94L420 120L420 170z', '#a98b72', 'opacity=".75"')+path('M-10 170L-10 140L60 118L120 142L200 124L280 146L350 124L420 142L420 170z', '#8c6f5a', 'opacity=".85"')+
    path('M-10 250V176Q200 160 420 176V250z', '#f4efe6')+path('M-10 250V204Q200 192 420 204V250z', '#e6dfd2')+
    '<ellipse cx="200" cy="196" rx="86" ry="9" fill="#000" opacity=".16"/>'+
    path('M142 96H246V192H142z', 'url(#'+U('k')+')')+path('M246 96L278 106V186L246 192z', 'url(#'+U('kd')+')')+
    path('M142 114H246V124H142z', '#e0b64e')+path('M246 124L278 126V116L246 114z', '#b8923a')+
    path('M142 96H246L278 106H178z', '#2f2f33', 'opacity=".6"')+
    '<path d="M196 148h30v44h-30z" fill="#e0b64e"/><path d="M200 152h22v36h-22z" fill="#9a7620"/>'+
    '<path d="M148 124h96M148 132h96M148 140h96" stroke="#e0b64e" stroke-opacity=".2" stroke-width="1"/>';
};
S.ram_mountain = U=>{
  const sk = U('s');
  return '<defs>'+lg(sk, [['#6b5b95'], ['#e98f6a', 1, .5], ['#ffd08a']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(90, 130, 22, '#fff2c4', '#ffc88a', true)+
    path('M-10 170L40 130L90 152L150 110L210 150L280 100L350 140L420 120L420 250L-10 250z', '#8a6a5a', 'opacity=".7"')+
    path('M110 250L170 150Q200 120 240 126Q290 138 330 250z', '#6d5043')+path('M150 250L190 164Q214 148 244 152L300 250z', '#7d5d4d')+
    path('M160 176Q200 150 250 156L262 170Q210 164 168 190z', '#a58068', 'opacity=".5"')+
    rect(198, 140, 34, 10, '#9d8575', 3)+rect(204, 132, 24, 10, '#b09b8c', 3)+rect(209, 125, 14, 9, '#a38f80', 3)+
    '<g fill="#2a1d19"><ellipse cx="270" cy="134" rx="21" ry="11"/><circle cx="289" cy="122" r="7.2"/><path d="M293 118q10-4 8 8"/><rect x="255" y="140" width="4" height="12" rx="1.5"/><rect x="263" y="141" width="4" height="12" rx="1.5"/><rect x="277" y="141" width="4" height="12" rx="1.5"/><rect x="284" y="140" width="4" height="12" rx="1.5"/><path d="M250 129q-8-2-6 6z"/></g><path d="M285 116q-12-12-2-18q8-2 8 6q-2 6-6 4" stroke="#2a1d19" stroke-width="3" fill="none" stroke-linecap="round"/>'+
    path('M-10 250V220Q90 204 200 214T420 208V250z', '#4d352c');
};
S.well = U=>{
  const sk = U('s');
  return '<defs>'+lg(sk, [['#4a3d7a'], ['#c3607a', 1, .5], ['#ffa970']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(24, 14, 0, 60)+sunAt(310, 122, 16, '#ffe5b0', '#ff9c6a')+
    path('M-10 140Q100 126 200 138T420 130L420 250 L-10 250z', '#c88a58')+path('M-10 186Q120 164 230 182T420 176L420 250 L-10 250z', '#b4753f')+
    camel(30, 140, .22, '#3a2b3a')+camel(52, 142, .22, '#3a2b3a')+camel(75, 140, .22, '#3a2b3a')+camel(98, 143, .2, '#3a2b3a')+
    '<ellipse cx="190" cy="214" rx="64" ry="9" fill="#000" opacity=".2"/>'+
    path('M142 150H238L246 214H134z', '#9b8d7e')+'<ellipse cx="190" cy="150" rx="48" ry="11" fill="#6f6256"/><ellipse cx="190" cy="152" rx="38" ry="8" fill="#14131c"/>'+
    '<path d="M138 168h106M136 184h110M134 200h112M160 150v18M196 150v18M226 150v18M178 168v16M214 168v16M156 184v16M200 184v16" stroke="#6f6256" stroke-width="1.6" stroke-opacity=".8"/>'+
    rect(148, 88, 6, 62, '#5b3a22')+rect(226, 88, 6, 62, '#5b3a22')+rect(144, 84, 92, 7, '#6e4527', 2)+
    '<g class="pz-sway" style="transform-origin:190px 90px"><path d="M190 91V138" stroke="#d8c08a" stroke-width="1.6"/><path d="M182 138h16l-2 14h-12z" fill="#7a5530"/></g>'+
    '<g class="pz-sway" style="transform-origin:190px 214px">'+rect(150, 184, 0, 0, 'none')+'</g>';
};
S.dream_stars = U=>{
  const sk = U('s');
  const pts = Array.from({length:11}, (_, i)=>{ const t = i/10; return [f1(70 + t*260), f1(150 - Math.sin(t*Math.PI)*34)]; });
  return '<defs>'+lg(sk, [['#1a1442'], ['#3a2a75'], ['#5a3f8f']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(60, 17, 0, 240, {big:1})+
    sunAt(86, 66, 20, '#ffe9a0', '#ffc66b', true)+moonAt(314, 66, 18)+
    pts.map(([x, y], i)=>spark(x, y, 9, i%2 ? '#fff4c0' : '#ffe08a', 'pz-tw', i*.4)+circ(x, y, 2.2, '#fff')).join('')+
    '<path d="'+pts.map(([x, y], i)=>(i ? 'L' : 'M')+x+' '+y).join('')+'" stroke="#fff" stroke-opacity=".12" stroke-width="1" fill="none"/>'+
    path('M-10 250V220Q120 200 200 214T420 208V250z', '#231a52');
};
S.prison = U=>{
  const mb = U('m');
  let bl = '';
  for(let r2 = 0; r2 < 8; r2++) for(let c = 0; c < 9; c++) bl += rect(c*48 - (r2%2)*24, r2*32, 46, 30, (r2 + c)%3 ? '#3b3d46' : '#34363f', 2);
  return '<defs>'+lg(mb, [['#dbe8ff', .8], ['#dbe8ff', 0]])+lg(U('wl'), [['#2a2c35'], ['#15161c']])+'</defs>'+rect(0, 0, 400, 240, '#2a2c35')+bl+rect(0, 0, 400, 240, 'url(#'+U('wl')+')', 0, 'opacity=".55"')+
    path('M150 80L250 80L330 250L70 250z', 'url(#'+mb+')', 'class="pz-pulse"')+
    path('M168 168V74A32 32 0 0 1 232 74V168z', '#0b1330')+stars(10, 3, 50, 150, {big:.8}).replace(/class="pz-tw"/g, 'class="pz-tw" clip-path="none"')+circ(214, 78, 12, '#fff7da')+circ(219, 74, 10, '#0b1330')+
    '<path d="M168 168V74A32 32 0 0 1 232 74V168z" fill="none" stroke="#4a4d5a" stroke-width="6"/>'+
    '<g stroke="#6c6f7c" stroke-width="3.6">'+[182, 196, 210, 224].map(x=>'<path d="M'+x+' 168V50"/>').join('')+'<path d="M168 112H232" stroke-width="3"/></g>'+
    rect(160, 166, 80, 8, '#4a4d5a', 2)+
    path('M0 240V212Q200 200 400 212V240z', '#1b1c22')+'<g class="pz-dust">'+Array.from({length:14}, (_, i)=>{ const R = rnd(i + 3); return circ(f1(150 + R()*100), f1(120 + R()*100), 1.2, '#fff', 'opacity=".5" style="animation-delay:-'+f1(R()*6)+'s"'); }).join('')+'</g>';
};
S.granary = U=>{
  const sk = U('s'), r = U('r');
  const sheaf = (x, y, s)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><path d="M-10 0L-6 -26M-5 0L-2 -30M0 0L0 -32M5 0L3 -30M10 0L7 -26" stroke="#c9902a" stroke-width="2.4" stroke-linecap="round"/><path d="M-7 -28l-3 -6M-3 -32l-2 -7M0 -34v-8M4 -32l2 -7M8 -28l3 -6" stroke="#e8b84a" stroke-width="2.4" stroke-linecap="round"/><path d="M-9 -12Q0 -8 9 -12" stroke="#8a5a1a" stroke-width="2" fill="none"/></g>';
  const barn = (x, y, w, c)=>rect(x, y, w, 40, c, 2)+path('M'+(x - 6)+' '+y+'L'+(x + w/2)+' '+(y - 26)+'L'+(x + w + 6)+' '+y+'z', '#8a4a2a')+rect(x + w/2 - 9, y + 14, 18, 26, '#4d2c18', 2)+'<path d="M'+(x + w/2 - 9)+' '+(y + 14)+'L'+(x + w/2 + 9)+' '+(y + 40)+'M'+(x + w/2 + 9)+' '+(y + 14)+'L'+(x + w/2 - 9)+' '+(y + 40)+'" stroke="#8a5a30" stroke-width="1.4"/>';
  return '<defs>'+lg(sk, [['#ffd98a'], ['#ffeec0']])+lg(r, [['#86d4ee'], ['#3ea6d2']], 0, 0, 1, 0)+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(70, 52, 18, '#fff6cc', '#ffd27a', true)+cloud(250, 40, .9, '#fff', .8)+
    path('M-10 130Q100 110 200 124T420 118L420 250 L-10 250z', '#e7c162')+path('M-10 160Q120 140 230 156T420 150L420 250 L-10 250z', '#dcae45')+
    barn(120, 98, 56, '#c99a62')+barn(214, 92, 64, '#d3a56c')+barn(300, 104, 48, '#c99a62')+
    '<path d="M-10 214Q100 184 200 206T420 192" stroke="url(#'+r+')" stroke-width="22" fill="none" stroke-linecap="round"/><path class="pz-dash" d="M20 204Q110 184 190 206" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-dasharray="6 10" stroke-linecap="round"/>'+
    sheaf(40, 168, 1.1)+sheaf(80, 176, 1)+sheaf(330, 170, 1.1)+sheaf(366, 180, 1)+sheaf(150, 232, 1.2)+sheaf(280, 236, 1.2)+sheaf(210, 230, .9);
};
S.ruins = U=>{
  const sk = U('s');
  const wall = (x, y, w, h2, j)=>'<path d="M'+x+' 250V'+(y + h2)+'L'+x+' '+(y + j)+'L'+(x + w*.2)+' '+y+'L'+(x + w*.4)+' '+(y + j*1.6)+'L'+(x + w*.6)+' '+(y + 4)+'L'+(x + w*.8)+' '+(y + j)+'L'+(x + w)+' '+(y + j*.5)+'V250z" fill="#4c4a50"/>';
  return '<defs>'+lg(sk, [['#4a1c1c'], ['#a23b2c'], ['#d98050']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+
    cloud(80, 40, 1.8, '#2b1214', .9)+cloud(260, 30, 2, '#2b1214', .9, 'pz-drift', 6)+cloud(360, 60, 1.4, '#3a1a1a', .85, 'pz-drift', 3)+
    path('M-10 190Q100 170 200 186T420 176L420 250 L-10 250z', '#3a3338')+
    wall(20, 118, 90, 80, 24)+wall(150, 130, 60, 70, 18)+wall(250, 108, 120, 100, 30)+
    '<path d="M70 150h14v18H70zM300 140h16v20h-16z" fill="#1a1618"/>'+
    '<g fill="#6a666c">'+[[120, 232, 18], [180, 224, 12], [230, 236, 16], [300, 228, 14], [60, 234, 12]].map(([x, y, w])=>'<path d="M'+x+' '+y+'l'+w*.3+' -'+w*.5+'l'+w*.7+' '+w*.1+'l'+w*.2+' '+w*.4+'z"/>').join('')+'</g>'+
    '<g class="pz-smoke">'+[110, 215, 330].map((x, i)=>circ(x, 140, 12, '#7b7479', 'opacity=".4" style="animation-delay:-'+i*1.6+'s"')).join('')+'</g>';
};
S.spring_healing = U=>{
  const sk = U('s'), w = U('w'), gl = U('g');
  return '<defs>'+lg(sk, [['#dff3df'], ['#f5fbe9']])+lg(w, [['#a6ecff'], ['#4fb4de']])+rg(gl, [['#fff8c8', .9], ['#fff8c8', 0]])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+circ(200, 100, 130, 'url(#'+gl+')', 'class="pz-pulse"')+
    hills(150, '#a8d8a0', '#86c488', '#6bb070')+
    path('M110 220Q130 130 190 124Q260 124 290 220z', '#8a8378')+path('M140 220Q160 150 200 142Q250 144 262 220z', '#9d9689')+
    '<path d="M186 142Q184 170 176 196Q150 214 110 232L90 250H220L270 250Q220 222 214 190Q206 170 206 142z" fill="url(#'+w+')" opacity=".95"/><path class="pz-dash" d="M196 146V190Q190 214 160 236M204 150Q210 200 240 238" stroke="#fff" stroke-opacity=".8" stroke-width="2" fill="none" stroke-dasharray="7 9" stroke-linecap="round"/>'+
    '<ellipse cx="196" cy="226" rx="86" ry="12" fill="url(#'+w+')" opacity=".9"/>'+
    palm(322, 214, 1.1, true, -10)+palm(76, 220, .8, true, 10)+
    Array.from({length:9}, (_, i)=>{ const R = rnd(i + 55); return spark(f1(120 + R()*160), f1(60 + R()*100), 3 + R()*3, '#fff', 'pz-tw', R()*3); }).join('');
};
S.madyan = U=>{
  const sk = U('s');
  const tent = (x, y, w, c1, c2)=>path('M'+x+' '+y+'L'+(x + w/2)+' '+(y - 40)+'L'+(x + w)+' '+y+'z', c1)+path('M'+(x + w/2)+' '+(y - 40)+'L'+(x + w*.7)+' '+y+'L'+(x + w*.3)+' '+y+'z', c2)+path('M'+(x + w/2 - 8)+' '+y+'L'+(x + w/2)+' '+(y - 18)+'L'+(x + w/2 + 8)+' '+y+'z', '#3a2210');
  const sack = (x, y, s, c)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><path d="M-12 0Q-16 -14 -8 -24L-5 -28H5L8 -24Q16 -14 12 0z" fill="'+c+'"/><path d="M-5 -28Q0 -33 5 -28" stroke="#6a4a22" stroke-width="2" fill="none"/><ellipse cx="0" cy="-14" rx="6" ry="4" fill="#fff" opacity=".12"/></g>';
  return '<defs>'+lg(sk, [['#ffcf8a'], ['#ffe8bb']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(330, 50, 16, '#fff3c8', '#ffd68a', true)+
    palm(30, 176, .9, true, 8)+palm(376, 178, 1, true, -8)+tent(60, 170, 90, '#d9704a', '#f2a366')+tent(250, 168, 96, '#3f9aa8', '#7cc5cd')+
    path('M-10 250V176Q200 160 420 176V250z', '#e2b878')+path('M-10 250V210Q200 198 420 210V250z', '#d4a560')+
    '<g transform="translate(200 120)"><path d="M0 -44V84" stroke="#6e4527" stroke-width="5"/><path d="M-60 -26H60" class="pz-tilt" style="transform-origin:0 -26px" stroke="#8a5a30" stroke-width="4" stroke-linecap="round"/><g class="pz-tilt" style="transform-origin:0 -26px"><path d="M-54 -26L-70 6M-54 -26L-38 6M54 -26L38 6M54 -26L70 6" stroke="#caa45a" stroke-width="1.4"/><path d="M-76 6H-32Q-54 24 -76 6z" fill="#d4af37"/><path d="M32 6H76Q54 24 32 6z" fill="#d4af37"/></g><path d="M-18 84H18L12 70H-12z" fill="#6e4527"/><circle cx="0" cy="-46" r="5" fill="#d4af37"/></g>'+
    sack(100, 214, 1.1, '#cfa66a')+sack(130, 218, 1, '#b98a4a')+sack(300, 216, 1.1, '#cfa66a')+sack(330, 220, .95, '#c19a5a')+
    '<path d="M90 200q6-6 12 0M298 204q6-6 12 0" stroke="#7a5320" stroke-width="1.5" fill="none"/>';
};
S.burning_bush = U=>{
  const sk = U('s'), gl = U('g'), fl = U('f');
  return '<defs>'+lg(sk, [['#2b2360'], ['#8b4a7a', 1, .55], ['#ffa86b']])+rg(gl, [['#e8f6ff', .95], ['#7fd0ff', .35], ['#7fd0ff', 0]])+lg(fl, [['#ffffff'], ['#9fe0ff'], ['#4aa8ff']], 0, 0, 0, 1)+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(34, 6, 0, 90)+
    path('M-10 190L30 120L80 150L140 60L200 120L240 96L300 150L350 100L420 160L420 250L-10 250z', '#4a3157')+path('M80 250L150 90L210 140L290 70L380 250z', '#35243f')+path('M148 94L170 130L150 120L134 142z', '#8e7aa0', 'opacity=".5"')+
    path('M-10 250V208Q200 192 420 208V250z', '#2c1f33')+
    circ(200, 164, 90, 'url(#'+gl+')', 'class="pz-pulse"')+
    '<path d="M194 216Q198 180 190 150M206 216Q202 180 210 150M200 180Q170 164 160 140M200 170Q236 156 246 132M200 150Q196 130 188 112" stroke="#4b3626" stroke-width="5" fill="none" stroke-linecap="round"/>'+
    flame(200, 200, 34, 100, fl, fl, 0)+flame(170, 170, 18, 52, fl, fl, .7)+flame(232, 164, 18, 56, fl, fl, 1.2)+flame(190, 128, 12, 38, fl, fl, 1.7)+flame(214, 130, 12, 34, fl, fl, .3)+
    '<g fill="#6d4a2a"><path d="M130 222q-2-14 8-14q8 0 10 8l-2 8z M154 224q-2-14 8-14q8 0 10 8l-2 8z"/></g><path d="M134 214q8 0 12 4M158 216q8 0 12 4" stroke="#caa062" stroke-width="1.6" fill="none"/>';
};
S.staff_sea = U=>{
  const sk = U('s'), wl = U('w');
  const wall = (x, flip)=>'<g transform="'+(flip ? 'translate(400 0) scale(-1 1)' : '')+'"><path d="M0 0H'+x+'Q'+(x + 18)+' 60 '+(x - 6)+' 120T'+(x + 8)+' 250H0z" fill="url(#'+wl+')"/><path class="pz-dash" d="M'+(x - 22)+' 20Q'+(x - 6)+' 80 '+(x - 26)+' 140T'+(x - 20)+' 230M'+(x - 48)+' 10Q'+(x - 38)+' 80 '+(x - 54)+' 150" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-dasharray="10 12"/><path d="M'+(x - 4)+' 0Q'+(x + 10)+' 8 '+x+' 16" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none"/></g>';
  return '<defs>'+lg(sk, [['#8cc8f0'], ['#e9f4fa']])+lg(wl, [['#1f6fae'], ['#2f9ad0', 1, .5], ['#0f4a80']], 0, 0, 1, 0)+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(200, 40, 16, '#fff9d6', '#fff0a8', true)+cloud(60, 36, .9, '#fff', .8)+cloud(340, 50, .9, '#fff', .8, 'pz-drift', 5)+
    wall(120, false)+wall(120, true)+
    path('M120 0H280V250H120z', '#cfe9f5', 'opacity=".0"')+
    path('M118 250Q170 160 180 100Q190 60 200 40Q210 60 220 100Q230 160 282 250z', '#e3c88f')+path('M140 250Q180 190 188 130Q196 90 200 70Q204 90 212 130Q220 190 260 250z', '#d0b078')+
    '<g transform="translate(200 224) rotate(-8)"><path d="M-70 0H66Q80 0 80 -10Q80 -22 66 -22" stroke="#6b4423" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-70 0H66" stroke="#8a5a30" stroke-width="2" stroke-opacity=".8" stroke-linecap="round" transform="translate(0 -2)"/><circle cx="-40" cy="0" r="1.8" fill="#4a2c14"/><circle cx="10" cy="0" r="1.8" fill="#4a2c14"/></g>';
};
S.palace = U=>{
  const f = U('f'), tg = U('fg');
  const cols = [28, 92, 296, 360].map(x=>column(x, 40, 26, 130, '#c2a37a', '#a98a60')).join('');
  return '<defs>'+lg(U('s'), [['#1d1218'], ['#3d2428']])+lg(U('c'), [['#a81f2b'], ['#6b0f1a']])+lg(f, [['#fff6c4'], ['#ffb637', 1, .5], ['#ff6a1f']], 0, 0, 0, 1)+rg(tg, [['#ffcf7a', .6], ['#ffcf7a', 0]])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+U('s')+')')+
    path('M150 40Q200 -10 250 40V170H150z', '#2e1a1e')+path('M162 170V60Q200 20 238 60V170z', '#1a0e12')+
    cols+path('M-10 250V170H420V250z', '#3b2a2a')+
    path('M168 170H232L300 250H100z', 'url(#'+U('c')+')')+'<path d="M180 170L130 250M220 170L270 250" stroke="#d4af37" stroke-width="2" stroke-opacity=".8"/>'+
    '<g transform="translate(200 140)"><path d="M-22 30V-6Q-22 -34 0 -34Q22 -34 22 -6V30z" fill="#b8902f"/><rect x="-26" y="14" width="52" height="14" rx="3" fill="#8a6a1f"/><rect x="-18" y="-4" width="36" height="22" rx="4" fill="#6b0f1a"/><circle cx="0" cy="-30" r="3.4" fill="#ffe08a"/><path d="M-26 28v8M26 28v8" stroke="#8a6a1f" stroke-width="5"/></g>'+
    torch(66, 100, f)+torch(334, 100, f)+torch(130, 124, f)+torch(270, 124, f)+
    '<path d="M60 42h20M320 42h20M120 56h20M260 56h20" stroke="#d4af37" stroke-width="2" stroke-opacity=".6"/>';
};
S.tablets = U=>{
  const sk = U('s'), gl = U('g');
  const tab = (x, rot)=>'<g transform="translate('+x+' 150) rotate('+rot+')"><path d="M-30 50V-20A30 30 0 0 1 30 -20V50z" fill="#cfc8b8"/><path d="M-24 46V-20A24 24 0 0 1 24 -20V46z" fill="#e3ddd0"/><g stroke="#ffd96a" stroke-width="3" stroke-linecap="round" class="pz-tw">'+[-24, -12, 0, 12, 24, 34].map((y, i)=>'<path d="M'+(-14 + (i%2)*2)+' '+y+'H'+(10 - (i%3)*3)+'" />').join('')+'</g></g>';
  return '<defs>'+lg(sk, [['#3a4f95'], ['#e8a8b8', 1, .6], ['#ffe0a8']])+rg(gl, [['#fff2b0', .9], ['#fff2b0', 0]])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(24, 12, 0, 80)+
    cloud(60, 140, 1.2, '#fff', .45)+cloud(340, 120, 1.3, '#fff', .45, 'pz-drift', 4)+
    path('M-10 250L60 150L110 170L170 112L230 150L290 100L360 160L420 140L420 250z', '#6b5876')+path('M60 250L150 160L210 190L290 130L420 250z', '#54425e')+
    path('M110 250Q200 150 290 250z', '#7a6784')+path('M-10 250V222Q200 196 420 222V250z', '#3f3048')+
    circ(200, 150, 100, 'url(#'+gl+')', 'class="pz-pulse"')+tab(168, -4)+tab(234, 4)+
    cloud(120, 214, 1.4, '#fff', .7)+cloud(280, 220, 1.5, '#fff', .7, 'pz-drift', 6);
};
S.mountain_birds = U=>{
  const sk = U('s');
  let birds = '';
  for(let i = 0; i < 14; i++){ const R = rnd(i + 99); birds += bird(f1(40 + R()*320), f1(40 + R()*80), .9 + R()*.7, '#2a3040', 'pz-fly', f1(R()*8)); }
  const ring = (x, y, r, c)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="none" stroke="'+c+'" stroke-width="4"/><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.2"/>';
  return '<defs>'+lg(sk, [['#9bc7e8'], ['#e5f0e8'], ['#fff1d0']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(320, 56, 16, '#fff7d0', '#ffe9a0', true)+
    path('M-10 180L50 100L100 140L170 70L240 140L300 96L360 130L420 90L420 250L-10 250z', '#8aa6b8')+path('M-10 210L40 150L100 190L180 130L250 190L330 140L420 180L420 250L-10 250z', '#5f8a6a')+path('M-10 250V220Q120 200 220 218T420 210V250z', '#3f7a52')+
    birds+
    ring(90, 214, 14, '#8f98a4')+ring(106, 218, 14, '#a6adb8')+ring(122, 214, 14, '#8f98a4')+ring(300, 220, 12, '#8f98a4')+ring(314, 224, 12, '#a6adb8')+
    path('M150 232Q170 210 200 214T250 230L240 240H160z', '#8f98a4', 'opacity=".9"')+'<path d="M166 232h70M174 224h54" stroke="#fff" stroke-opacity=".3" stroke-width="1.4"/>';
};
S.wind_throne = U=>{
  const sk = U('s');
  const dome = (x, y, r, c)=>path('M'+(x - r)+' '+y+'A'+r+' '+r+' 0 0 1 '+(x + r)+' '+y+'z', c)+rect(x - 1.2, y - r - 8, 2.4, 8, '#e0b64e')+circ(x, y - r - 9, 2.4, '#e0b64e');
  let w = '';
  [[20, 60], [50, 100], [260, 50], [300, 90], [180, 36]].forEach(([x, y], i)=>{ w += '<path class="pz-wind" style="animation-delay:-'+i*.8+'s" d="M'+x+' '+y+'q30 -14 56 0t40 -4" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="50 40"/>'; });
  return '<defs>'+lg(sk, [['#7cc4ee'], ['#d8efe8'], ['#ffeebf']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(340, 40, 16, '#fff7cc', '#ffe08a', true)+cloud(90, 36, .9, '#fff', .8)+
    rect(130, 84, 140, 80, '#f0e2c0')+dome(200, 84, 34, '#d4af37')+dome(144, 84, 14, '#e0b64e')+dome(256, 84, 14, '#e0b64e')+rect(114, 100, 16, 64, '#e8d6a8')+dome(122, 100, 9, '#d4af37')+rect(270, 100, 16, 64, '#e8d6a8')+dome(278, 100, 9, '#d4af37')+
    [150, 180, 210, 240].map(x=>'<path d="'+arch(x, 118, 16, 46)+'" fill="#8a6a3a"/>').join('')+
    path('M-10 250V164Q200 150 420 164V250z', '#9cd08e')+path('M-10 250V204Q100 190 200 206T420 200V250z', '#c9a46a')+
    '<path d="M-10 214Q80 200 170 214T330 208T420 216" stroke="#a88050" stroke-width="12" fill="none" opacity=".7"/>'+
    Array.from({length:12}, (_, i)=>ant(30 + i*28, 214 + (i%2)*3, .9, i*.7, 9, '#2b1c14')).join('')+
    w+
    '<g class="pz-float" style="animation-duration:3.4s"><g transform="translate(76 120)"><ellipse cx="0" cy="0" rx="12" ry="7" fill="#d98a4a"/><path d="M-12 -2L-26 4L-12 6z" fill="#3a2a22"/><path d="M-4 -4Q-10 -22 -2 -24M0 -5Q-2 -24 4 -24M4 -4Q8 -22 12 -20" stroke="#d98a4a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M-4 -4Q-10 -22 -2 -24M0 -5Q-2 -24 4 -24M4 -4Q8 -22 12 -20" stroke="#222" stroke-width=".8" stroke-opacity=".0" fill="none"/><circle cx="12" cy="-3" r="5" fill="#d98a4a"/><path d="M16 -4L26 -2L16 -1z" fill="#3a2a22"/><circle cx="14" cy="-4" r="1" fill="#222"/><path d="M-4 0Q4 8 12 2" stroke="#222" stroke-width="2.2" fill="none"/><path d="M-8 -2Q-2 4 6 4" stroke="#fff" stroke-width="1.6" fill="none"/></g></g>';
};
S.ants = U=>{
  const sk = U('s');
  const R = rnd(31);
  let ants = '';
  for(let i = 0; i < 9; i++) ants += ant(60 + i*34, 128 + Math.sin(i*1.3)*10, 1.8, i*.9, 11);
  return '<defs>'+lg(sk, [['#a8d49a'], ['#7fb872']])+lg(U('g'), [['#a5784a'], ['#6e4a2a']])+rg(U('l'), [['#fff6c8', .6], ['#fff6c8', 0]])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+circ(330, 20, 120, 'url(#'+U('l')+')', 'class="pz-pulse"')+
    leaf(-10, 40, 160, 20, '#3f9a52', '#276b36')+leaf(420, 20, 150, 160, '#4aa95d', '#276b36')+leaf(370, 70, 100, 130, '#2f8a47', '#1d5a2a')+leaf(-10, 90, 90, 10, '#2f8a47', '#1d5a2a')+
    path('M-10 250V150Q100 96 200 124T420 110V250z', 'url(#'+U('g')+')')+
    '<path d="M-10 142Q90 100 190 128T420 118" stroke="#c69a68" stroke-width="40" fill="none" stroke-linecap="round" opacity=".55"/>'+
    '<g stroke="#8a5e34" stroke-opacity=".5">'+Array.from({length:14}, (_, i)=>circ(f1(R()*400), f1(170 + R()*70), 1.8 + R()*2.4, '#5a3c20', 'opacity=".5"')).join('')+'</g>'+ants+
    leaf(40, 236, 100, -30, '#3f9a52', '#276b36')+leaf(300, 244, 120, -150, '#4aa95d', '#276b36')+
    '<path d="M186 190q10-30 30-24" stroke="#4aa95d" stroke-width="3" fill="none"/>'+
    '<g transform="translate(250 196)"><ellipse rx="16" ry="10" fill="#6e4a2a"/><ellipse rx="10" ry="5" cy="-2" fill="#8c6a42"/></g>';
};
S.whale = U=>{
  const sk = U('s');
  return '<defs>'+lg(sk, [['#050a1f'], ['#0f1f4a'], ['#16325f']])+lg(U('w'), [['#1c4a75'], ['#0b2340']])+lg(U('b'), [['#36597a'], ['#1b3550']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(60, 13, 0, 110)+fullMoon(320, 50, 22)+
    '<path d="M0 108H400" stroke="#cfe0ff" stroke-opacity=".25" stroke-width="2"/><path d="M262 108Q270 94 280 108" stroke="#9fc4e8" stroke-width="2" fill="none"/>'+
    rect(0, 110, 400, 130, 'url(#'+U('w')+')')+
    '<g class="pz-bob" style="transform-origin:200px 170px"><path d="M60 170Q90 128 170 134Q250 140 292 160Q312 130 346 132Q326 158 340 190Q310 180 292 180Q250 218 160 214Q84 212 60 170z" fill="url(#'+U('b')+')"/><path d="M96 186Q160 208 252 192" stroke="#8fb0cc" stroke-opacity=".5" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M128 190v16M148 192v16M168 194v16M188 194v16M208 194v14M228 192v14" stroke="#0f2236" stroke-opacity=".5" stroke-width="1.4"/><circle cx="96" cy="162" r="3.2" fill="#0b1626"/><path d="M80 176Q100 184 118 178" stroke="#0b1626" stroke-width="1.6" fill="none"/></g>'+
    Array.from({length:10}, (_, i)=>{ const R = rnd(i + 8); return circ(f1(150 + R()*50), 128, f1(1.5 + R()*3), 'none', 'stroke="#bfe3ff" stroke-opacity=".7" stroke-width="1" class="pz-bubble" style="animation-delay:-'+f1(R()*5)+'s"'); }).join('')+
    waves(116, '#0f3158', .55, 'pz-wave2', 4);
};
S.gourd = U=>{
  const sk = U('s');
  const gourd = (x, y, r, rot)=>'<g transform="translate('+x+' '+y+') rotate('+rot+')"><ellipse rx="'+r*1.5+'" ry="'+r+'" fill="#7cc04a"/><ellipse rx="'+r*1.4+'" ry="'+r*.4+'" cy="'+(-r*.4)+'" fill="#a6dc6e" opacity=".55"/><path d="M'+(-r*1.4)+' 0Q0 '+r*.5+' '+r*1.4+' 0" stroke="#4e8a2a" stroke-width="1.2" fill="none" opacity=".6"/></g>';
  return '<defs>'+lg(sk, [['#7da8e8'], ['#f7b2a0', 1, .55], ['#ffe2a8']])+lg(U('sea'), [['#6fb6d8'], ['#3b88b8']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+sunAt(300, 118, 22, '#fff4c8', '#ffd08a', true)+
    rect(0, 118, 400, 40, 'url(#'+U('sea')+')')+waves(150, '#fff', .35, 'pz-wave2', 3)+
    path('M-10 250V164Q100 150 200 164T420 156V250z', '#efd6a0')+path('M-10 250V200Q120 186 240 200T420 194V250z', '#e2c084')+
    '<path d="M120 236Q104 200 140 180Q170 166 160 140Q154 110 190 100" stroke="#4aa24f" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M160 150Q210 170 238 150Q268 130 280 150" stroke="#4aa24f" stroke-width="3" fill="none" stroke-linecap="round"/>'+
    '<g class="pz-sway" style="transform-origin:130px 236px">'+leaf(190, 100, 70, -20, '#3f9a52', '#276b36')+leaf(188, 102, 62, 200, '#56b25f', '#276b36')+leaf(156, 140, 60, 160, '#3f9a52', '#276b36')+leaf(240, 150, 56, -10, '#56b25f', '#276b36')+leaf(120, 214, 56, -150, '#3f9a52', '#276b36')+leaf(126, 214, 52, -30, '#56b25f', '#276b36')+leaf(278, 150, 50, 30, '#3f9a52', '#276b36')+'</g>'+
    gourd(188, 188, 11, -10)+gourd(262, 172, 9, 12)+gourd(150, 214, 8, 20);
};
S.mihrab = U=>{
  const gl = U('g'), l = U('l');
  return '<defs>'+lg(U('s'), [['#1d2a3a'], ['#2f4256']])+rg(gl, [['#ffd98a', .75], ['#ffd98a', 0]])+rg(l, [['#fff2b0', .9], ['#fff2b0', 0]])+lg(U('r'), [['#2d7a6a'], ['#1c5a52']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+U('s')+')')+
    '<g stroke="#000" stroke-opacity=".1">'+[0, 1, 2, 3, 4, 5, 6, 7].map(i=>'<path d="M0 '+i*30+'H400"/>').join('')+'</g>'+
    path('M110 230V90Q110 24 200 24T290 90V230z', '#c9a24b')+path('M122 230V92Q122 38 200 38T278 92V230z', '#0f1822')+
    path('M134 230V94Q134 52 200 52T266 94V230z', '#1a2a38')+circ(200, 120, 100, 'url(#'+gl+')', 'class="pz-pulse"')+
    '<path d="M138 94Q138 56 200 56T262 94" fill="none" stroke="#e0b64e" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>'+
    circ(200, 36, 6, '#e0b64e')+
    '<path d="M110 90H290" stroke="#e0b64e" stroke-width="0"/>'+
    lampSVG(200, 66, l)+
    path('M-10 250V226H420V250z', '#4a3b2a')+
    path('M130 250L150 200H250L270 250z', 'url(#'+U('r')+')')+path('M146 244L160 208H240L254 244z', '#256a60')+
    '<path d="M200 214Q176 222 190 242H210Q224 222 200 214z" fill="#e0b64e" opacity=".8"/><path d="M152 246H248" stroke="#e0b64e" stroke-width="1.6"/>';
};
S.palm_tree = U=>{
  const sk = U('s');
  return '<defs>'+lg(sk, [['#4b5fa8'], ['#e59a98', 1, .55], ['#ffd8a0']])+lg(U('w'), [['#8fd0ee'], ['#4fa6d0']], 0, 0, 1, 0)+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(14, 2, 0, 50)+sunAt(120, 140, 24, '#fff2c0', '#ffc88a', true)+
    path('M-10 176Q100 160 200 172T420 166V250H-10z', '#e2b878')+path('M-10 214Q120 196 240 212T420 204V250H-10z', '#d4a35e')+
    '<path d="M230 250Q250 224 270 214Q310 200 340 212" stroke="url(#'+U('w')+')" stroke-width="22" fill="none" stroke-linecap="round" opacity=".95"/><path class="pz-dash" d="M244 246Q262 226 284 218" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-dasharray="6 9" stroke-linecap="round"/>'+
    palm(206, 212, 2, true, 14)+
    '<path d="M180 188q4-4 8 0M236 214q3-3 6 0" stroke="#4aa35a" stroke-width="2" fill="none"/>';
};
S.cradle = U=>{
  const sk = U('s'), st = U('st');
  return '<defs>'+lg(sk, [['#0a1236'], ['#1f2d68'], ['#3a4a8a']])+rg(st, [['#fff8d0', .9], ['#fff8d0', 0]])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(70, 19, 0, 150)+
    circ(200, 56, 70, 'url(#'+st+')', 'class="pz-pulse"')+spark(200, 56, 30, '#fffbe0', 'pz-tw', 0)+spark(200, 56, 18, '#fff', 'pz-tw', 1)+circ(200, 56, 4, '#fff')+
    path('M-10 250V210Q200 196 420 210V250z', '#1b2450')+path('M-10 250V226Q200 214 420 226V250z', '#121a3e')+
    '<g class="pz-rock" style="transform-origin:200px 214px"><path d="M120 190Q200 244 280 190" stroke="#7a5030" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M128 188H272L254 150H146z" fill="#b0834f"/><path d="M128 188H272" stroke="#7a5030" stroke-width="6"/>'+
    [158, 178, 198, 218, 238].map(x=>'<path d="M'+x+' 152L'+(x - 4)+' 186" stroke="#7a5030" stroke-width="2.6"/>').join('')+
    '<path d="M146 150H254" stroke="#7a5030" stroke-width="5" stroke-linecap="round"/><path d="M150 164H252V186H134z" fill="#f4e6d0" opacity=".95"/><path d="M146 170Q200 178 256 170" stroke="#e0c8a0" stroke-width="2" fill="none"/><path d="M150 164H252" stroke="#fff" stroke-width="2" stroke-opacity=".7"/></g>';
};
S.table_spread = U=>{
  const sk = U('s');
  const loaf = (x, y, r)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+r*1.4+'" ry="'+r+'" fill="#d99b4a"/><ellipse cx="'+x+'" cy="'+(y - r*.3)+'" rx="'+r*1.2+'" ry="'+r*.5+'" fill="#efbb6a"/><path d="M'+(x - r*.6)+' '+(y - r*.5)+'l'+r*.3+' '+r*.5+'M'+x+' '+(y - r*.6)+'l'+r*.3+' '+r*.5+'" stroke="#a8702a" stroke-width="1.2"/>';
  const plate = (x, y, r, c)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+r+'" ry="'+r*.32+'" fill="#f6f2e8"/><ellipse cx="'+x+'" cy="'+(y - 1)+'" rx="'+r*.74+'" ry="'+r*.22+'" fill="'+c+'"/>';
  const bowl = (x, y, r, c)=>'<path d="M'+(x - r)+' '+(y - 8)+'H'+(x + r)+'Q'+(x + r)+' '+(y + 8)+' '+x+' '+(y + 8)+'Q'+(x - r)+' '+(y + 8)+' '+(x - r)+' '+(y - 8)+'z" fill="#f6f2e8"/><ellipse cx="'+x+'" cy="'+(y - 8)+'" rx="'+r+'" ry="'+r*.25+'" fill="'+c+'"/>';
  return '<defs>'+lg(sk, [['#9fd0f4'], ['#e9f4fa'], ['#fff4d0']])+lg(U('r'), [['#fff6c4', .85], ['#fff6c4', 0]], 0, 0, 0, 1)+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+
    '<g class="pz-pulse" style="transform-origin:200px 0">'+[[200, 40, 130], [160, 50, 90], [240, 50, 90], [130, 60, 60], [270, 60, 60]].map(([x, w, l])=>'<path d="M'+(x - 3)+' -10L'+(x - w)+' 170L'+(x + w)+' 170L'+(x + 3)+' -10z" fill="url(#'+U('r')+')" opacity=".6"/>').join('')+'</g>'+
    cloud(80, 34, 1.2, '#fff', .9)+cloud(320, 28, 1.3, '#fff', .9, 'pz-drift', 5)+
    path('M-10 250V190Q200 176 420 190V250z', '#7fb98a')+
    '<g class="pz-float" style="animation-duration:5s"><path d="M70 176H330L352 226H48z" fill="#f4efe6"/><path d="M70 176H330L322 186H78z" fill="#fff"/><path d="M48 226H352V234H48z" fill="#c1a77a"/><path d="M60 206H340" stroke="#d4af37" stroke-width="1.6" stroke-dasharray="3 5"/>'+
    plate(120, 178, 26, '#e8b04a')+bowl(176, 176, 16, '#c9503a')+loaf(226, 174, 13)+loaf(252, 176, 11)+plate(296, 178, 26, '#7ab04a')+
    circ(160, 164, 5, '#d63a2f')+circ(170, 163, 5, '#e85a3a')+circ(204, 164, 5, '#9a4a8a')+'</g>';
};
S.cave_light = U=>{
  const sk = U('s'), bm = U('b');
  return '<defs>'+lg(sk, [['#050a22'], ['#12215a'], ['#243a78']])+lg(bm, [['#fff7c8', .0], ['#fff7c8', .85]], 0, 0, 0, 1)+rg(U('g'), [['#fff3b0', .9], ['#fff3b0', 0]])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(80, 22, 0, 120)+moonAt(60, 44, 14)+
    path('M-10 250V150L50 120L110 150L170 90L230 70L300 110L350 94L420 130V250z', '#1b2142')+path('M70 250L140 130L210 60L290 120L360 250z', '#2a2f56')+path('M210 60L230 96L200 88L186 110L210 60z', '#4a527e', 'opacity=".6"')+
    '<path d="M190 0L180 60L238 60L252 0z" fill="url(#'+bm+')" class="pz-pulse"/><path d="M184 60H236L232 176H196z" fill="url(#'+bm+')" opacity=".7" class="pz-pulse"/>'+
    path('M170 210Q168 160 210 150Q252 160 252 210z', '#080a18')+circ(212, 190, 40, 'url(#'+U('g')+')', 'class="pz-pulse"')+
    path('M190 210Q194 180 212 174Q230 180 234 210z', '#fff4c0', 'opacity=".85"')+
    path('M-10 250V222Q100 206 200 220T420 212V250z', '#10142c');
};
S.night_journey = U=>{
  const sk = U('s'), st = U('st');
  return '<defs>'+lg(sk, [['#0a0f2e'], ['#231f5c'], ['#4a3a7a']])+lg(st, [['#9fd8ff', 0], ['#ffffff', .95]], 0, 0, 1, 0)+lg(U('d'), [['#ffe9a0'], ['#d4a52e']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(80, 25, 0, 150)+
    moonAt(300, 50, 20)+
    '<path class="pz-streak" d="M0 40Q120 40 220 100T360 140" stroke="url(#'+st+')" stroke-width="5" fill="none" stroke-linecap="round" style="stroke-dasharray:420;"/><path d="M0 40Q120 40 220 100T360 140" stroke="#cfe6ff" stroke-opacity=".25" stroke-width="12" fill="none" stroke-linecap="round"/>'+
    path('M-10 250V186Q200 172 420 186V250z', '#1a1840')+
    rect(100, 168, 200, 40, '#2a2556')+rect(90, 196, 220, 14, '#34306a')+
    path('M150 168A50 50 0 0 1 250 168z', 'url(#'+U('d')+')')+rect(198, 108, 4, 10, '#e0b64e')+circ(200, 106, 3.4, '#e0b64e')+
    path('M116 168A18 18 0 0 1 152 168z', '#7a8aaa')+path('M248 168A18 18 0 0 1 284 168z', '#7a8aaa')+
    '<g fill="#ffe08a">'+[118, 146, 174, 214, 242, 270].map(x=>'<path d="'+arch(x, 178, 12, 20)+'"/>').join('')+'</g>'+
    path('M-10 250V216Q200 204 420 216V250z', '#0f0e2a');
};
S.hijra_cave = U=>{
  const sk = U('s');
  let web = '';
  for(let i = 0; i < 8; i++){ const a = Math.PI + i*Math.PI/7; web += '<path d="M200 118L'+f1(200 + Math.cos(a)*46)+' '+f1(118 - Math.sin(a)*-46)+'" />'; }
  return '<defs>'+lg(sk, [['#080e2a'], ['#1b2860'], ['#34407a']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+stars(80, 28, 0, 130)+fullMoon(330, 44, 18)+
    path('M-10 250V168L40 150L100 168L160 100L240 70L320 120L380 108L420 140V250z', '#262c52')+path('M90 250L170 120L240 84L310 140L350 250z', '#323964')+
    path('M150 250Q146 170 200 154Q254 170 252 250z', '#06081a')+
    '<g stroke="#e8f0ff" stroke-opacity=".75" stroke-width=".9" fill="none"><path d="M150 164H252" stroke-opacity="0"/>'+
    [[150, 176, 158, 130, 200, 136], [156, 170]].slice(0, 0).join('')+
    Array.from({length:8}, (_, i)=>{ const a = i*Math.PI/7.4; return '<path d="M153 200L'+f1(153 + Math.sin(a)*100)+' '+f1(200 - Math.cos(a)*50 - 20)+'"/>'; }).join('')+
    [20, 40, 60, 80].map(r2=>'<path d="M'+f1(153 + 0)+' '+f1(200 - r2*.55)+'Q'+f1(190)+' '+f1(200 - r2*.9)+' '+f1(150 + r2*1.7)+' '+f1(200 - r2*.1)+'"/>').join('')+'</g>'+
    '<g transform="translate(190 232)"><ellipse rx="22" ry="7" fill="#6e5236"/><ellipse rx="16" ry="4" cy="-1" fill="#2a1d14"/></g><g class="pz-float" style="animation-duration:5s"><g transform="translate(190 222)" fill="#f4f4f6"><ellipse cx="0" cy="-3" rx="10" ry="6"/><circle cx="9" cy="-8" r="4"/><path d="M12 -8l5 1.5-5 1z" fill="#e0a43a"/><path d="M-10 -2l-9 3 9 1z"/></g></g>'+
    path('M-10 250V226Q100 214 200 232T420 224V250z', '#14162e')+
    '<path d="M116 208q4-6 8 0M290 214q4-6 8 0" stroke="#4a5a3a" stroke-width="1.5" fill="none"/>';
};
S.sky_light = U=>{
  const sk = U('s');
  const rays = Array.from({length:9}, (_, i)=>{ const a = (-70 + i*17.5) * Math.PI/180; return '<path d="M200 -20L'+f1(200 + Math.sin(a)*380)+' '+f1(Math.cos(a)*380)+'L'+f1(200 + Math.sin(a + .06)*380)+' '+f1(Math.cos(a + .06)*380)+'z" fill="#fff6c0" opacity=".28"/>'; }).join('');
  return '<defs>'+lg(sk, [['#ffe9a8'], ['#ffd78a', 1, .5], ['#bfe0e8']])+'</defs>'+rect(0, 0, 400, 240, 'url(#'+sk+')')+'<g class="pz-pulse">'+rays+'</g>'+sunAt(200, 30, 20, '#fffbe0', '#fff0a0', true)+
    cloud(80, 56, 1.4, '#fff', .9)+cloud(320, 70, 1.5, '#fff', .9, 'pz-drift', 6)+cloud(200, 86, 1, '#fff', .8, 'pz-drift', 3)+
    hills(150, '#a8d8a0', '#86c488', '#6bb070')+Array.from({length:8}, (_, i)=>spark(40 + i*45, 120 + (i%3)*26, 3, '#fff9d0', 'pz-tw', i*.5)).join('');
};

M.PROPHET_SCENES = Object.keys(S);
/* unknown key -> a stable, harmless fallback scene (never an empty frame) */
const FALLBACK = ['sky_light', 'night_stars', 'garden', 'dunes_wind', 'palm_tree'];
M.prophetScene = function(key){
  let fn = S[key];
  if(!fn){ let n = 0; String(key || '').split('').forEach(c=>n += c.charCodeAt(0)); fn = S[FALLBACK[n % FALLBACK.length]]; }
  const id = 'pz' + (++UID) + '_';
  const U = n=>id + n;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 400 240');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('class', 'pz-svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  try{ svg.innerHTML = fn(U) + '<defs><radialGradient id="'+U('vg')+'" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient><linearGradient id="'+U('sh')+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="400" height="240" fill="url(#'+U('sh')+')"/><rect width="400" height="240" fill="url(#'+U('vg')+')"/><g class="pz-dust" fill="#fff" opacity=".55">'+Array.from({length:9}, (_, i)=>{ const R = rnd(i * 13 + 5); return '<circle cx="'+f1(R()*400)+'" cy="'+f1(60 + R()*170)+'" r="'+f1(.8 + R()*1.4)+'" style="animation-delay:-'+f1(R()*6)+'s;animation-duration:'+f1(5 + R()*5)+'s"/>'; }).join('')+'</g>'; }catch(e){ console.error('prophetScene', key, e); }
  return svg;
};
})();

/* ===== prophets: UI (read + watch) ===== */
(function(){
'use strict';
const M = window.M, h = M.h;
const stories = ()=>[].concat(M.PROPHETS_A || [], M.PROPHETS_B || []).filter(s=>s && s.id && Array.isArray(s.paras) && s.paras.length);
const favs = ()=>M.store.get('prophetFav', []) || [];
const prog = ()=>M.store.get('prophetProg', null);
const sceneOf = s=>(s.paras[0] && s.paras[0].scene) || 'sky_light';
const CAP = {creation:'بدء الخلق', garden:'جنة وارفة الظلال', tree:'الشجرة في الجنة', earth_desc:'فجر على الأرض', night_stars:'ليل وسماء مرصّعة بالنجوم', ark:'السفينة فوق الأمواج', flood:'السماء والماء والطوفان', dove:'صفاء بعد العاصفة', dunes_wind:'كثبان ورياح عاتية', rock_camel:'صخور منحوتة وعين ماء', fire:'نار صارت بردًا وسلامًا', stars_moon_sun:'كوكب فقمر فشمس', kaaba:'البيت الحرام', ram_mountain:'قمة جبل وفداء', well:'بئر في الصحراء', dream_stars:'أحد عشر كوكبًا والشمس والقمر', prison:'نافذة السجن والقمر', granary:'مخازن الحبوب والخزائن', ruins:'أطلال مدينة مهلَكة', spring_healing:'عين ماء للشفاء', madyan:'سوق ومكيال وميزان', burning_bush:'الطور ونورٌ في الوادي', staff_sea:'عصا وبحر انفلق', palace:'قصر الملك وعرشه', tablets:'الألواح فوق الجبل', mountain_birds:'جبال وطير مسبّحة', wind_throne:'ريح ونمل وهدهد', ants:'وادي النمل', whale:'ظلمات البحر والليل', gourd:'شجرة من يقطين', mihrab:'المحراب والسراج', palm_tree:'نخلة وجدول ماء', cradle:'مهد تحت النجوم', table_spread:'مائدة من السماء', cave_light:'الغار والنور', night_journey:'ليلة الإسراء', hijra_cave:'غار وعنكبوت وحمامة', sky_light:'نور من السماء'};
const COVER = {adam:'tree', idris:'night_stars', nuh:'ark', hud:'dunes_wind', salih:'rock_camel', ibrahim:'fire', lut:'ruins', ismail:'well', yusuf:'prison', ayyub:'spring_healing', shuaib:'madyan', musa:'staff_sea', harun:'tablets', dawud:'mountain_birds', sulayman:'wind_throne', yunus:'whale', zakariyya:'mihrab', isa:'cradle', muhammad:'cave_light'};
const coverOf = s=>{ const c = COVER[s.id]; return c && s.paras.some(p=>p.scene === c) ? c : ((s.paras[1] && s.paras[1].scene) || sceneOf(s)); };
const hue = i=>(i * 47 + 150) % 360;

/* ---------- videos (YouTube, online only) ---------- */
const YT = id=>'https://www.youtube.com/watch?v='+id;
function vthumb(story, v){
  const w = h('span.pr-tf');
  try{ w.appendChild(M.prophetScene(coverOf(story))); }catch(e){}
  const im = h('img', {src:'https://i.ytimg.com/vi/'+v.id+'/mqdefault.jpg', alt:'', loading:'lazy'});
  im.onerror = ()=>im.remove();
  im.onload = ()=>{ if(im.naturalWidth < 100) im.remove(); };
  w.append(im); return w;
}
const NATIVE = ()=>!!(window.Android && window.Android.playVideo);
function openVideo(story, vids, i){
  let cur = i, auto = true;
  try{ if(M.player && M.player.s) M.player.stop(); }catch(e){}
  M.openView({id:'prvideo', title:'فيديو: '+story.name, nopad:true, build:(body, view)=>{
    body.classList.add('pr-vbody');
    const box = h('div.pr-vbox'), ttl = h('div.pr-vt.bold'), note = h('div.small.muted.pr-vn');
    const list = h('div.pr-vlist');
    function load(k){
      cur = k; const v = vids[k];
      box.replaceChildren();
      ttl.textContent = v.t;
      if(!navigator.onLine){ box.append(h('div.pr-voff', M.ic('globe'), h('div', 'يلزم اتصال بالإنترنت لمشاهدة الفيديو'))); }
      else if(NATIVE()){
        /* Android: the player runs in its own screen, outside the app's page (a third-party frame must never share the app's bridge) */
        const play = ()=>{ try{ window.Android.playVideo(v.id, v.t); }catch(e){ M.openLink(YT(v.id)); } };
        box.append(h('button.pr-vposter', {'aria-label':'تشغيل: '+v.t, onclick:play}, vthumb(story, v), h('span.pr-vpl.big', M.ic('play'))));
        if(auto){ auto = false; play(); }
      }
      else{
        const f = h('iframe.pr-vf', {src:'https://www.youtube-nocookie.com/embed/'+v.id+'?autoplay=1&rel=0&playsinline=1&hl=ar&cc_lang_pref=ar', title:v.t, allow:'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen:true, referrerpolicy:'strict-origin-when-cross-origin', loading:'eager'});
        box.append(f);
      }
      list.querySelectorAll('.pr-vi').forEach((e, j)=>e.classList.toggle('on', j === k));
    }
    vids.forEach((v, k)=>list.append(h('button.pr-vi', {onclick:()=>{ auto = true; load(k); }}, vthumb(story, v), h('span.grow', v.t), M.ic('play'))));
    note.textContent = NATIVE() ? 'الفيديوهات من يوتيوب وتُعرض عبر الإنترنت في شاشة مستقلة. إن لم يعمل الفيديو فافتحه في يوتيوب.' : 'الفيديوهات من يوتيوب وتُعرض عبر الإنترنت. إن لم يعمل الفيديو داخل التطبيق فافتحه في يوتيوب.';
    body.append(box, h('div.pr-vmeta', ttl, h('div.row-flex.gap-s', {style:'flex-wrap:wrap;margin-top:8px'},
      h('button.btn.tonal.sm', {onclick:()=>M.openLink(YT(vids[cur].id))}, M.ic('share'), 'فتح في يوتيوب'),
      vids.length > 1 ? h('button.btn.ghost.sm', {onclick:()=>{ auto = true; load((cur + 1) % vids.length); }}, M.ic('next'), 'الفيديو التالي') : null), note), vids.length > 1 ? h('div.pr-vl', h('h3.pr-h', 'فيديوهات أخرى'), list) : null);
    load(cur);
  }, onClose:()=>{}});
}
function videoBlock(story, vids){
  const row = h('div.pr-vrow');
  vids.forEach((v, i)=>row.append(h('button.pr-vc', {'aria-label':'تشغيل: '+v.t, onclick:()=>openVideo(story, vids, i)},
    h('span.pr-vth', vthumb(story, v), h('span.pr-vpl', M.ic('play'))),
    h('span.pr-vtt', v.t))));
  return h('div.pr-vids', h('h3.pr-h', 'شاهد القصة'), row, h('div.tiny.muted', 'فيديوهات من يوتيوب — تحتاج اتصالًا بالإنترنت'));
}

/* ---------- story reader ---------- */
function openStory(story, startAt){
  let unsub = null, io = null, curScene = null, activeI = -1, saveT = 0;
  const paras = story.paras;
  const fsList = [.9, 1, 1.15, 1.3, 1.5];
  let fs = M.store.get('prophetFs', 1);
  const stage = h('div.pr-stage');
  const title = h('div.pr-stage-t', h('b.title-font', story.name), story.era ? h('small', story.era) : null);
  stage.append(h('div.pr-layers'), title);
  const layers = stage.firstChild;
  function setScene(key){
    if(key === curScene) return; curScene = key;
    const L = h('div.pr-layer'); L.appendChild(M.prophetScene(key));
    layers.appendChild(L);
    requestAnimationFrame(()=>requestAnimationFrame(()=>L.classList.add('in')));
    const old = Array.from(layers.children).filter(x=>x !== L);
    setTimeout(()=>old.forEach(x=>x.remove()), 900);
  }
  const pEls = paras.map((p, i)=>h('p.pr-p', {dataset:{i:String(i)}, onclick:()=>setActive(i, false)}, p.t));
  const wrap = h('div.pr-wrap');
  wrap.style.setProperty('--pr-fs', String(fs));
  function setActive(i, scroll){
    if(i < 0) return;
    activeI = i;
    pEls.forEach((e, k)=>e.classList.toggle('on', k === i));
    setScene(paras[i].scene);
    if(scroll) pEls[i].scrollIntoView({block:'start', behavior:'smooth'});
    clearTimeout(saveT); saveT = setTimeout(()=>M.store.set('prophetProg', {id:story.id, i, t:Date.now()}), 400);
  }
  function build(body, view){
    body.classList.add('pr-body');
    const favBtn = h('button.icon-btn', {'aria-label':'المفضلة', onclick:()=>{ let f = favs(); const on = !f.includes(story.id); f = on ? f.concat(story.id) : f.filter(x=>x !== story.id); M.store.set('prophetFav', f); favBtn.classList.toggle('pr-fav', on); favBtn.replaceChildren(M.ic('heart')); M.toast(on ? 'أُضيفت إلى المفضلة' : 'أُزيلت من المفضلة'); }}, M.ic('heart'));
    favBtn.classList.toggle('pr-fav', favs().includes(story.id));
    const fsBtn = h('button.icon-btn', {'aria-label':'حجم الخط', onclick:()=>{
      const c = h('div.col-flex', M.seg(fsList.map((v, i)=>[v, ['صغير جدًا', 'صغير', 'متوسط', 'كبير', 'كبير جدًا'][i]]), fs, v=>{ fs = v; M.store.set('prophetFs', v); wrap.style.setProperty('--pr-fs', String(v)); }));
      M.sheet({title:'حجم الخط', content:c});
    }}, M.ic('type'));
    const shBtn = h('button.icon-btn', {'aria-label':'مشاركة', onclick:()=>M.share(story.name + '\n\n' + (story.summary || '') + (story.lessons && story.lessons.length ? '\n\nمن الدروس:\n' + story.lessons.map(l=>'• ' + l).join('\n') : '') + '\n\n— تطبيق المسلم')}, M.ic('share'));
    view.head.append(favBtn, fsBtn, shBtn);
    body.appendChild(stage);
    if(story.summary) wrap.appendChild(h('div.pr-sum', story.summary));
    const vids = (M.PROPHET_VIDEOS || {})[story.id] || [];
    if(vids.length) wrap.appendChild(videoBlock(story, vids));
    const saved = prog();
    if(saved && saved.id === story.id && saved.i > 0 && startAt == null) wrap.appendChild(h('button.btn.tonal.pr-cont', {onclick:()=>{ pEls[saved.i].scrollIntoView({block:'start', behavior:'smooth'}); }}, 'تابع من الفقرة ' + M.n(saved.i + 1)));
    let prevScene = null;
    pEls.forEach((e, i)=>{
      const sc = paras[i].scene;
      if(sc !== prevScene){ prevScene = sc; wrap.appendChild(h('figure.pr-fig', h('div.pr-figart', M.prophetScene(sc)), h('figcaption', CAP[sc] || 'مشهد رمزي'))); }
      wrap.appendChild(e);
    });
    const after = h('div.pr-after', {dataset:{i:String(paras.length - 1 + .5)}});
    wrap.appendChild(after);
    if(story.ayat && story.ayat.length){
      const box = h('div.pr-ayat', h('h3.pr-h', 'من الآيات في هذه القصة'));
      story.ayat.forEach(([s, a])=>{
        const tx = h('div.qfont.pr-aytx', '…');
        const name = h('div.pr-ayref', '');
        box.appendChild(h('div.card.pad.pr-ay', tx, h('div.pr-ayft', name, h('button.icon-btn.tonal', {'aria-label':'استمع إلى الآية', onclick:()=>{ try{ M.player.play(s, a); }catch(e){ M.toast('تعذّر تشغيل التلاوة'); } }}, M.ic('play')))));
        M.loadQuran().then(()=>{ tx.textContent = M.ayahText(s, a) || ''; name.textContent = 'سورة ' + M.sname(s) + ' • الآية ' + M.n(a); }).catch(()=>{ tx.textContent = ''; name.textContent = 'تعذّر تحميل الآية — ' + M.n(s) + ':' + M.n(a); });
      });
      after.appendChild(box);
    }
    if(story.lessons && story.lessons.length) after.appendChild(h('div.card.pad.pr-less', h('h3.pr-h', 'دروس وعبر'), h('ul', story.lessons.map(l=>h('li', l)))));
    if(story.sources) after.appendChild(h('div.pr-src', 'المصادر: ' + (Array.isArray(story.sources) ? story.sources.join('، ') : story.sources)));
    const uniq = Array.from(new Set(paras.map(p=>p.scene)));
    after.appendChild(h('div.pr-galw', h('h3.pr-h', 'معرض الصور'), h('div.pr-gal', uniq.map(k=>h('button.pr-gi', {'aria-label':CAP[k] || 'صورة', onclick:()=>{ const big = h('figure.pr-fig.pr-big', h('div.pr-figart', M.prophetScene(k)), h('figcaption', CAP[k] || 'مشهد رمزي')); M.sheet({title:story.name, content:big}); }}, h('div.pr-giart', M.prophetScene(k)), h('span', CAP[k] || 'مشهد رمزي'))))));
    after.appendChild(h('div.pr-pad'));
    body.appendChild(wrap);
    /* scene follows the scroll */
    const st = stage.offsetHeight || 234;
    const act = new Map();
    io = new IntersectionObserver(es=>{
      es.forEach(e=>act.set(+e.target.dataset.i, e.isIntersecting));
      let pick = -1; act.forEach((v, k)=>{ if(v && (pick < 0 || k < pick)) pick = k; });
      pick = pick < 0 ? -1 : Math.floor(pick);
      if(pick >= 0 && pick !== activeI){ setActive(pick, false); }
    }, {root:body, rootMargin:'-' + (st + 24) + 'px 0px -45% 0px', threshold:0});
    pEls.forEach(e=>{ e.style.scrollMarginTop = (st + 12) + 'px'; io.observe(e); });
    io.observe(after);
    setActive(startAt != null ? startAt : 0, false);
    if(startAt != null && startAt > 0) setTimeout(()=>pEls[startAt].scrollIntoView({block:'start'}), 120);
  }
  M.openView({id:'prophet', title:'قصص الأنبياء', nopad:true, build, onClose:()=>{ if(io) io.disconnect(); clearTimeout(saveT); if(unsub) unsub(); }});
}

/* ---------- grid ---------- */
M.openProphets = function(){
  let unsub = null;
  M.openView({id:'prophets', title:'قصص الأنبياء', build:(body, view)=>{
    let q = '', only = false;
    const grid = h('div.pr-grid'), top = h('div.pr-top');
    const draw = ()=>{
      const all = stories(), f = favs();
      grid.replaceChildren();
      if(!all.length){ grid.appendChild(h('div.empty', 'القصص قيد الإعداد. عُد بعد قليل.')); return; }
      const nq = M.normAr(q.trim());
      const list = all.map((s, i)=>[s, i]).filter(([s])=>(!only || f.includes(s.id)) && (!nq || M.normAr(s.name + ' ' + (s.era || '')).includes(nq)));
      if(!list.length){ grid.appendChild(h('div.empty', only && !q ? 'لم تضف أي قصة إلى المفضلة بعد.' : 'لا نتائج.')); return; }
      list.forEach(([s, i])=>{
        const hh = hue(i), art = h('div.pr-art'); art.appendChild(M.prophetScene(coverOf(s)));
        grid.appendChild(h('button.pr-card', {style:'--h:' + hh, onclick:()=>openStory(s)}, art,
          h('div.pr-shade'), f.includes(s.id) ? h('span.pr-heart', M.ic('heart')) : null,
          h('div.pr-ct', h('b.title-font', s.name), s.era ? h('small', s.era) : null)));
      });
    };
    const search = h('input.field', {type:'search', placeholder:'ابحث عن نبي…', oninput:e=>{ q = e.target.value; draw(); }});
    const seg = M.seg([['all', 'كل القصص'], ['fav', 'المفضلة']], 'all', v=>{ only = v === 'fav'; draw(); });
    const drawTop = ()=>{
      top.replaceChildren();
      const p = prog(), s = p && stories().find(x=>x.id === p.id);
      if(s) top.appendChild(h('button.card.pad.pr-resume', {onclick:()=>openStory(s, Math.min(p.i, s.paras.length - 1))}, h('span.pr-resi', M.ic('play')), h('div.grow', h('b', 'تابع من حيث توقفت'), h('div.muted', s.name + ' — الفقرة ' + M.n(p.i + 1)))));
    };
    drawTop();
    body.append(top, h('div.pr-tools', search, seg), grid);
    draw();
    unsub = M.on('viewclose', id=>{ if(id === 'prophet'){ drawTop(); draw(); } });
  }, onClose:()=>{ if(unsub) unsub(); }});
};
M.addSection({id:'prophets', title:'قصص الأنبياء', icon:'s:mushaf', group:'الكتب والمكتبة', fn:()=>M.openProphets()});
})();
