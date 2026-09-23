// Static cartography, shared by both zoom levels. Geometry is built once;
// gameplay remains in data.js/game.js and all labels stay in the interaction layer.
export const reliefDefs = `
<linearGradient id="relief-earth" x2=".75" y2="1"><stop stop-color="#666754"/><stop offset=".48" stop-color="#454e42"/><stop offset="1" stop-color="#283e39"/></linearGradient>
<linearGradient id="relief-ridge" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#a7a184"/><stop offset=".4" stop-color="#747763"/><stop offset="1" stop-color="#465449"/></linearGradient>
<linearGradient id="relief-shade" x2=".8" y2="1"><stop stop-color="#3e4b43"/><stop offset="1" stop-color="#253732" stop-opacity=".1"/></linearGradient>
<linearGradient id="relief-water" x2="1" y2="1"><stop stop-color="#79958e"/><stop offset="1" stop-color="#3c6666"/></linearGradient>
<pattern id="relief-paper" width="7" height="9" patternUnits="userSpaceOnUse"><path d="M1 2h.7M4 6h1" stroke="#e2d5ad" stroke-width=".5" opacity=".16"/><path d="M2 8h1" stroke="#172a25" opacity=".22"/></pattern>
<filter id="relief-contact" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="2" dy="4" stdDeviation="2" flood-color="#071816" flood-opacity=".5"/></filter>`;

function ridge(x,y,s=1,flip=1) {
  return `<g transform="translate(${x} ${y}) scale(${s*flip} ${s})">
    <path fill="url(#relief-shade)" d="M-61 27Q-40 20-25 6L-8-26 2-42 17-26Q28-2 42 8L65 30Q27 47-7 36Z"/>
    <path fill="url(#relief-ridge)" d="M-61 27Q-43 19-31 1L-20-10-8-26 2-42-1-19-13-5-10 3-31 16Z"/>
    <path fill="#c0b89a" opacity=".22" d="M2-42-1-19-13-5-10 3-31 16-15 1-19-5-5-22Z"/>
    <path fill="none" stroke="#273e36" stroke-width=".65" opacity=".5" d="M7-26L14-9 33 15M-17 6l-19 20M1-7L-2 9 11 22M20 13l8 15"/>
    <path fill="none" stroke="#bbb699" stroke-width=".6" opacity=".3" d="M-45 30q19-4 28-10M-50 34q29-2 42-10"/>
  </g>`;
}

const ridges = [
  [145,104,.9],[200,86,1.15],[258,90,.8],[302,72,.7],
  [133,148,.9],[184,137,.95],[232,129,.7],[278,122,.63],
  [609,99,.78],[659,108,1.05],[717,132,.85],[752,163,.62],
  [115,215,.85],[139,252,.7],[104,294,.6],[132,329,.6],
  [373,322,.67],[368,360,.57],[332,391,.48],
  [209,498,.5],[245,527,.68],[286,552,.65],[330,567,.4],
  [643,548,.6],[677,577,.47]
];
const river='M546 177C519 215 571 231 561 270S471 303 479 339 548 374 571 401 566 451 609 469 684 462 716 495 755 516 780 496';
const tributaries='M353 193C334 239 370 266 415 273S443 310 479 339M698 223C647 233 658 299 625 328S576 352 555 383M401 464C449 449 467 475 498 491S571 500 609 469';
const lake='M487 501C506 488 524 501 538 498S560 509 551 521 527 521 516 532 478 536 480 522 465 513 487 501Z';

export function reliefGround(land) {
  const fields=Array.from({length:6},(_,i)=>`<path d="M${174+i*20} ${310+i%3*5}l-8 24 17 6 8-24ZM${219+i*20} ${389+i%2*6}l-5 18 16 5 6-18Z"/>`).join('');
  const orchards=Array.from({length:28},(_,i)=>{const x=402+(i%7)*14+Math.sin(i*4)*7,y=548+Math.floor(i/7)*12+Math.cos(i*7)*5;return `<path d="M${x-3} ${y+4}q-3-5 3-10 6 5 3 10Z"/>`;}).join('');
  return `<g class="relief-ground" aria-hidden="true">
    <defs><clipPath id="relief-land-clip"><path d="${land}"/></clipPath></defs>
    <path class="relief-shelf" d="${land}"/>
    <path class="relief-coast-shadow" d="${land}" transform="translate(0 8)"/>
    <path class="relief-land" d="${land}"/>
    <g clip-path="url(#relief-land-clip)">
      <path fill="#899075" opacity=".13" d="M72 223Q267 157 395 266T768 367L717 449Q448 321 93 450Z"/>
      <g class="relief-fields">${fields}</g>
      <g class="relief-forest">${orchards}</g>
      ${ridges.map(([x,y,s],i)=>ridge(x,y,s,i%3===0?-1:1)).join('')}
      <path class="relief-river-bank" d="${river}"/><path class="relief-river" d="${river}"/>
      <path class="relief-stream" d="${tributaries}"/>
      <path class="relief-lake" d="${lake}"/>
      <path fill="url(#relief-paper)" d="${land}"/>
    </g>
    <path class="relief-coast-edge" d="${land}"/>
    <g class="relief-geography"><text x="199" y="180">朔 · 山</text><text x="522" y="345" transform="rotate(24 522 345)">临 江</text><text x="523" y="559">洛 泽</text><text x="811" y="358" transform="rotate(90 811 358)">东 海</text></g>
  </g>`;
}

const house=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path fill="#a69776" d="M-5-1 1-4 6-1v6L0 8-5 5Z"/><path fill="#615e4c" d="M0 2 6-1v6L0 8Z"/><path fill="#414e45" stroke="#b6a789" stroke-width=".45" d="M-8-2Q-4-2-1-7L4-5Q5-2 9-2L1 3Z"/><path fill="none" stroke="#8e9479" stroke-width=".35" d="M-4-1 0-4 5-1M-2 0 1-3 6-1"/><path stroke="#333d34" stroke-width="1" d="M-2 3v2M3 3v2"/></g>`;
export function settlement(type) {
  const military=type==='military',port=type==='port',capital=type==='capital';
  const houses=capital?`${house(-8,-6,.9)}${house(5,-10,1.1)}${house(10,2,.75)}`:type==='granary'?`${house(-7,-3,1)}${house(7,1,1)}`:`${house(-7,-4,.65)}${house(6,-5,.7)}${house(1,2,.85)}`;
  return `<g class="relief-settlement">
    <ellipse cy="9" rx="23" ry="8" fill="#102620" opacity=".25"/>
    ${port?'<path fill="none" stroke="#789f9b" stroke-width="1" d="M-22 7q12 6 24 0M-21 13q12 6 24 0"/><path fill="#837657" d="M3 5 23 13 21 15 1 7ZM12 9v10h-2V8"/>':'<path fill="#6d745b" stroke="#a59a77" stroke-width=".5" d="M-21-1 1-11 22 0 1 13Z"/><path fill="#4e5946" d="M-21-1v3L1 15 22 3V0L1 13Z"/><path fill="none" stroke="#b0a07c" stroke-width="1.6" d="M-20-2 1 9 21-1M-20-2 1-12 21-1"/>'}
    ${houses}
    ${military?'<path stroke="#b9a58a" stroke-width=".8" d="M13-2v-17"/><path fill="#997252" d="M13-19 22-16 13-12Z"/>':''}
    ${capital?house(-1,-2,1.3):''}
    ${port?'<path fill="#ae9b76" d="M-22 12q6 4 13 0l-3 5h-8Z"/><path fill="#c9c0a1" d="M-16 0v11h-7Z"/>':house(1,7,.6)}
  </g>`;
}
