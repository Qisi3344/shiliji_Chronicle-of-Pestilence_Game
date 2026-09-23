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
    <g class="world-context">
      <rect class="world-sea" x="-1800" y="-1800" width="4600" height="4600"/>
      <path class="foreign-land" d="M-1800-1800H640L688-220 728-160 710-90 758-42 742 20 780 90 820 180 780 500 722 604 688 698 729 767 695 847 732 948 701 1070 774 1260 730 2800H-1800Z"/>
      <g class="foreign-relief">
        ${[[-70,150,1.5],[40,-15,1.2],[190,-65,1.5],[370,-50,1.1],[575,-30,1.2],[-35,355,1.4],[0,490,1.1],[130,610,.9],[280,710,1.3],[520,725,1.1],[660,780,1]].map(([x,y,s])=>ridge(x,y,s)).join('')}
        <path d="M-100 340Q-10 295 66 306M180 700Q320 656 455 712T663 703" fill="none" stroke="#a1a69d" stroke-width="2" opacity=".3"/>
      </g>
      <g class="sea-contours">
        <path d="M856 117Q905 232 863 357T831 498 759 673M902 71Q963 229 920 374T879 547 816 741M987 20Q1045 210 1000 399T967 620"/>
      </g>
      <g class="offshore-islands">
        <path d="M881 265q2-8 9-7l4-8q9 1 8 9l6 9-7 7q2 13-9 9l-3-6q-10 3-8-13Z"/>
        <path d="M869 310q3-9 8-6l2 7q12 1 4 8l-10 2Z"/>
        <path d="M914 429q1-13 9-12l7-7q11-3 10 8l11 5-6 8q5 10-6 11l-5 7q-7 2-9-4l-10-2q-6-6-1-14Z"/>
        <path d="M957 477q3-9 10-10l5 7q11 0 5 10l-7 2q0 11-9 5l-6-5Z"/>
        <path d="M850 547q2-10 10-8l3-6 9 3-2 8q12 2 11 13l-9 3-4 12q-10 0-12-8l-7-1Z"/>
        <path d="M832 595q2-11 9-9l2 6q12-1 6 10l-9-1-6 6Z"/>
        <path d="M1018 316q6-4 6-14l7-8 10 5 13-2q8 2 6 12l6 7-8 10q6 12-2 19l-13 1-10 8-7-7q-15 2-12-8l5-10Z"/>
      </g>
      <path class="maritime-boundary" d="M829 220Q867 273 862 348T858 440 811 548L733 604"/>
      <g class="nearshore-islands"><path d="M839 380q8-7 11 1l-4 8q-9 5-12-2Z"/><path d="M821 454q4-11 12-6l-2 8 4 6q-10 8-17-1Z"/></g>
      <g class="world-context-labels"><text x="-35" y="380" transform="rotate(-90 -35 380)">西陲 · 境外</text><text x="350" y="-42">北境之外</text><text x="400" y="740">南疆 · 境外</text><text class="east-sea-label" x="935" y="380">东 海</text><text x="920" y="575">海外诸屿</text></g>
    </g>
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
    <g class="relief-geography"><text x="199" y="180">朔 · 山</text><text x="522" y="345" transform="rotate(24 522 345)">临 江</text><text x="523" y="559">洛 泽</text></g>
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
