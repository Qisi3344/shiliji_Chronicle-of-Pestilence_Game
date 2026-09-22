import { diseaseSkills, diseases, events, factions, regions, roads, waterways } from './data.js';
import { SAVE_KEY, activeEvents, advanceDay, alertName, borrowEvent, canDrop, canUnlockDiseaseSkill, changeStance, dateName, diseaseProgress, dropCost, dropDisease, dropLimit, hideDisease, loadGame, newGame, periodName, regionOutbreaks, regionStats, saveGame, setTimeSpeed, stageName, unlockDiseaseSkill } from './game.js';

const app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const one=(list,id)=>list.find(item=>item.id===id);
const knownRoutes=new Set(['/','/new','/name','/prologue','/disease-select','/game','/archive','/settings']);
const routeFromLocation=()=>{
 const hash=location.hash.replace(/^#/,'');
 if(hash) return knownRoutes.has(hash)?hash:'/';
 return knownRoutes.has(location.pathname)?location.pathname:'/';
};
const appBase=location.pathname.endsWith('/')?location.pathname:location.pathname.replace(/\/[^/]*$/,'/')||'/';
const stateUI={route:routeFromLocation(),returnRoute:'/',tab:'world',selected:null,detailOpen:false,modal:null,toast:'',filter:'all',prologue:0,map:{x:0,y:0,w:900,h:680},nameSuggestion:'长夜',activeOutbreak:null,dropChoice:null,logOpen:null,briefTurn:null};
const defaultMap=()=>window.innerWidth<768?{x:230,y:0,w:440,h:680}:{x:0,y:0,w:900,h:680};
stateUI.map=defaultMap();
let narrowMap=window.innerWidth<768;
let game=loadGame();
let settings=JSON.parse(localStorage.getItem('yi-settings-v01')||'{"largeText":false,"lessMotion":false}');
let pointer=null, suppressClick=false;
let clockLast=Date.now(), clockBank=0;
const GAME_DAY_MS=3000;
const prologue=['景和二十三年。','北地三年无雪，洛南决堤。','国库亏空四百万两。','京中却新建离宫三座。','皇帝二月选秀，四月大宴群臣。','六月，河东饥民易子而食。','七月，御史奏报灾情，被廷杖而死。','八月。','疫至。'];
const randomNames=['长夜','无归','赤岁','白祸','归寂','玄疠','无灯','荒岁','哭川','尽春','空城','寒烬','十三灾','天漏','不归年'];
const typeLabel={capital:'京城',prefecture:'府城',military:'军镇',port:'水运',granary:'粮仓'};
const stanceLabel={dormant:'蛰伏',spread:'蔓延',surge:'盛发'};
const navs=[['world','天下','◈'],['codex','疫册','册'],['news','诏闻','闻'],['court','王朝','玺']];
const number=n=>Number(n||0).toLocaleString('zh-CN');
const pill=(text,cls='')=>`<span class="pill ${cls}">${esc(text)}</span>`;
const button=(action,label,cls='',extra='')=>`<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
const save=()=>{if(game)saveGame(game);render();};
function go(route){
 const next=knownRoutes.has(route)?route:'/';
 history.pushState({},'',`${appBase}#${next}`);
 stateUI.route=next;
 stateUI.modal=null;
 window.scrollTo(0,0);
 render();
}
function toast(message){stateUI.toast=message;render();setTimeout(()=>{if(stateUI.toast===message){stateUI.toast='';document.querySelector('.toast')?.remove();}},3000);}
function pageFrame(title,subtitle,body,back='/'){
 return `<div class="page-shell"><header class="page-top"><button class="plain back" data-route="${back}">← 返回</button><span class="brand-mini">时疠纪 <em>CHRONICLE</em></span></header><main class="page-content"><div class="section-heading"><span class="eyebrow">景和二十三年 / 靖朝</span><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div>${body}</main></div>`;
}
function home(){
 const saved=game?.outbreaks?.length;
 return `<div class="home"><div class="home-map" aria-hidden="true">${mapArt(false)}</div><div class="home-vignette"></div><header class="home-top"><span class="eyebrow">靖朝 · 景和二十三年</span><span class="edition">卷一 / 疫至</span></header><main class="home-main"><div class="seal">疫</div><div class="game-title">时疠纪 <small>CHRONICLE OF PESTILENCE</small></div><p class="home-kicker">人世有隙，疫便由此而生</p><h1>天下已有病，<br><i>你只是让它显形。</i></h1><p class="home-copy">架空王朝 · 一旬一变 · 以疫观天下</p><div class="home-actions">${button('new','新局 · 以疫入世','primary large')}${button('continue','续局','secondary large',game?'':'disabled')}${button('archive','档案','ghost')}${button('settings','设置','ghost')}</div>${saved?`<div class="save-hint">上次：${esc(game.name)}之疫 · ${periodName(game.turn)} · ${game.outbreaks.length}处疫区</div>`:''}</main><footer class="home-foot">一局只设一世之疫　·　医者之路尚未开放</footer></div>`;
}
function identity(){return pageFrame('你要从何处看见这个王朝？','同一人间，两种命途。此世先以疫入局。',`<div class="identity-grid"><article class="identity-card chosen"><div class="card-symbol">疫</div><span class="eyebrow">当前开放 / THE PLAGUE</span><h2>疫</h2><p class="verse">无名，无形，无所归。<br>人世有隙，疫便由此而生。</p><p>俯瞰天下，择疫而降。借人流、灾荒、战争与腐败，让王朝自身的裂缝成为疫路。</p>${button('choose-yi','以疫入世 →','primary')}</article><article class="identity-card locked"><div class="card-symbol">医</div><span class="eyebrow">后续开放 / THE HEALER</span><h2>医</h2><p class="verse">人命有数，医者偏要争上一争。</p><p>身在疫中，以有限的消息、药材、人力与权势，对抗疾病与混乱。</p><button disabled>尚未开放</button></article></div>`);}
function namePage(){return pageFrame('赐此世之疫一个名。','它不会改变疫的能力。它只是后世史书对这场灾厄的称呼。',`<form id="name-form" class="name-form"><label for="plague-name">史书所记</label><div class="name-row"><input id="plague-name" name="name" maxlength="12" autocomplete="off" placeholder="例如：长夜、无归、赤岁" value="${esc(stateUI.nameSuggestion)}" /><button type="button" class="secondary" data-action="random-name">换一个</button></div><div class="name-preview">民间后来称它为—— <strong>「<span id="name-live">${esc(stateUI.nameSuggestion)}</span>之疫」</strong></div><button type="submit" class="primary wide">此名既定 →</button></form>`,'/new');}
function prologuePage(){const index=stateUI.prologue;return `<div class="prologue"><div class="prologue-top"><span>靖 / 景和二十三年</span><span>${String(index+1).padStart(2,'0')} / 09</span></div><div class="prologue-body"><span class="prologue-mark">史录 · 卷一</span><p class="${index===8?'arrival':''}">${esc(prologue[index])}</p><div class="prologue-line"></div>${button('prologue-next',index===8?'择一疫，降于人间 →':'继续阅卷 →','plain continue-line')}</div><div class="prologue-dots">${prologue.map((_,i)=>`<span class="${i<=index?'lit':''}"></span>`).join('')}</div></div>`;}
function diseasePage(){const starters=diseases.filter(d=>d.starter);return pageFrame('择一疫，降于人间。','初临只能从四种常疫中择一；更异样的疫，会随着王朝腐坏而显现。',`<div class="disease-grid">${starters.map((d,i)=>`<article class="disease-card disease-${i}"><span class="eyebrow">常疫 / ${String(i+1).padStart(2,'0')}</span><div class="disease-glyph">${d.glyph}</div><h2>${d.name}</h2><p class="verse">${d.line}</p><p>${d.desc}</p><div class="tag-row">${d.tags.map(t=>pill(t)).join('')}</div><button class="primary" data-action="first-disease" data-id="${d.id}">降此疫 →</button></article>`).join('')}</div><div class="future-plagues"><span>后世疫册尚有残页</span>　牲疫 · 禽疫 · 血疫 · 尸疫</div>`,'/prologue');}
function mapArt(interactive=true){
 const box=stateUI.map;
 const line=(edges,cls)=>edges.map(([a,b])=>{const p=one(regions,a),q=one(regions,b);return `<path class="${cls}" d="M${p.x} ${p.y} Q${(p.x+q.x)/2+8} ${(p.y+q.y)/2-6} ${q.x} ${q.y}"/>`;}).join('');
 const node=r=>{const outbreaks=game?regionOutbreaks(game,r.id):[],selected=stateUI.selected===r.id,important=activeEvents(game||{turn:0},r.id).length>0;
   const plagueMarks=[...new Set(outbreaks.map(o=>one(diseases,o.diseaseId)?.glyph||one(diseases,o.diseaseId)?.name?.[0]||'疫'))];
   const plagueText=plagueMarks.slice(0,2).join('·')+(plagueMarks.length>2?` +${plagueMarks.length-2}`:'');
   const plagueNames=[...new Set(outbreaks.map(o=>one(diseases,o.diseaseId)?.name).filter(Boolean))].join('、');
   return `<g class="map-node ${selected?'selected':''} ${outbreaks.length?'infected':''} ${r.type}" ${interactive?`data-region="${r.id}" tabindex="0" role="button" aria-label="查看${r.name}${outbreaks.length?`，已有${plagueNames}`:''}"`:''} transform="translate(${r.x} ${r.y})"><circle class="hit" r="29"/><circle class="pulse" r="19"/><circle class="node-ring" r="11"/><circle class="node-core" r="4"/>${important?'<path class="event-mark" d="M-3 -20h6l-3 -6z"/>':''}<text y="-18">${r.name}</text>${outbreaks.length?`<text class="sick-count disease-marks" y="29">${plagueText}</text>`:''}</g>`;};
 return `<svg class="world-svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" role="img" aria-label="靖朝天下节点图"><defs><pattern id="grain" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".4" fill="#a99275" opacity=".25"/></pattern><filter id="map-glow"><feGaussianBlur stdDeviation="6"/></filter></defs><path class="land-shadow" d="M90 85 Q155 18 250 48 L380 20 L515 30 Q635 14 790 78 L842 152 L848 305 Q830 392 815 475 L728 615 L614 650 L514 637 L415 651 L285 600 L149 564 L79 448 L44 304 Z"/><path class="land" d="M95 88 Q153 35 250 58 L380 32 L515 44 Q636 30 780 90 L830 158 L836 301 Q817 391 801 466 L722 604 L610 640 L514 628 L415 639 L289 588 L157 553 L90 440 L55 306 Z"/><path class="land-grain" d="M95 88 Q153 35 250 58 L380 32 L515 44 Q636 30 780 90 L830 158 L836 301 Q817 391 801 466 L722 604 L610 640 L514 628 L415 639 L289 588 L157 553 L90 440 L55 306 Z"/>${line(roads,'road')}${line(waterways,'water')}${regions.map(node).join('')}<text class="map-label" x="92" y="78">朔北</text><text class="map-label" x="107" y="430">河东</text><text class="map-label" x="658" y="618">东海</text><text class="map-water-label" x="472" y="520">洛南水道</text></svg>`;
}
function hud(){return `<div class="hud"><div class="hud-date"><span class="eyebrow">${esc(game.name)}之疫 · ${stageName(game.scar)}</span><strong>${dateName(game.turn,game.dayInTurn||0)}</strong></div><div class="hud-stats"><div><span>疫势</span><strong>${game.power}</strong></div><div><span>疫痕</span><strong>${game.scar}<small> / ${[20,45,75,110].find(x=>x>game.scar)||'终'}</small></strong></div><div class="alert"><span>朝警 · ${alertName(game.alert)}</span><strong>${game.alert}<small> / 100</small></strong></div></div><div class="time-controls" aria-label="时间流速"><button data-action="speed" data-value="0" class="${game.paused?'active':''}" title="暂停">Ⅱ</button>${[1,2,4].map(n=>`<button data-action="speed" data-value="${n}" class="${!game.paused&&game.timeSpeed===n?'active':''}">${n}×</button>`).join('')}</div><button class="plain hud-menu" data-action="pause" aria-label="暂停与设置">☰</button></div>`;}
function nav(){return `<nav class="game-nav" aria-label="主导航">${navs.map(([id,label,icon])=>`<button data-tab="${id}" class="${stateUI.tab===id?'active':''}" aria-current="${stateUI.tab===id?'page':'false'}"><span class="nav-icon">${icon}</span><span>${label}</span></button>`).join('')}</nav>`;}
function mapPanel(){return `<section class="map-panel"><div class="map-heading"><div><span class="eyebrow">天下舆图 / THE REALM</span><h2>${game.drops===0?'择一处，让疫从这里开始。':'靖朝天下'}</h2></div><div class="map-tools"><button data-action="zoom-out" aria-label="缩小地图">−</button><button data-action="zoom-in" aria-label="放大地图">＋</button><button data-action="zoom-reset" aria-label="重置地图">⌖</button></div></div><div class="map-stage" id="map-stage">${mapArt()}</div><div class="map-foot"><span><i class="legend-dot sick"></i>疫区 ${new Set(game.outbreaks.map(o=>o.regionId)).size}</span><span><i class="legend-dot event"></i>大事 ${activeEvents(game).length}</span><span>拖动舆图 · 点选州府</span></div></section>`;}
function outbreakCard(o){const d=one(diseases,o.diseaseId),hide=o.hideUntil>game.turn,available=activeEvents(game,o.regionId).filter(e=>e.borrowable);
 return `<div class="outbreak-card"><div class="outbreak-head"><strong>${d.name}</strong>${pill(stanceLabel[o.stance],o.stance==='surge'?'red':'')} ${hide?pill('藏疫中'):''}</div><div class="outbreak-meta"><span>病者估计 <b>${number(o.infected)}</b></span><span>地方察觉 <b>${o.localAwareness} · ${o.localAwareness>=80?'封控':o.localAwareness>=60?'控疫':o.localAwareness>=40?'查疫':o.localAwareness>=20?'疑疫':'未觉'}</b></span></div><div class="stance-controls" role="group" aria-label="驭疫姿态">${Object.entries(stanceLabel).map(([id,label])=>`<button data-action="stance" data-id="${o.id}" data-value="${id}" class="${o.stance===id?'active':''}" ${o.stance===id?'aria-pressed="true"':''}>${label}</button>`).join('')}</div><div class="action-note">切换姿态需疫势 2 · 每旬一次</div><div class="sub-actions">${button('hide','藏疫 · 4','secondary',`data-id="${o.id}" ${hide?'disabled':''}`)}${available.length?`<select data-borrow-select="${o.id}" aria-label="选择可借之势">${available.map(e=>`<option value="${e.id}">${e.title} · ${e.cost}</option>`).join('')}</select>${button('borrow','借势','secondary',`data-id="${o.id}" ${o.borrowedTurn===game.turn?'disabled':''}`)}`:''}</div></div>`;}
function detail(){const r=one(regions,stateUI.selected);
 if(!r) return `<aside class="detail-panel empty-detail"><div class="detail-empty"><div class="empty-sigil">◈</div><span class="eyebrow">州府卷宗</span><h3>点选舆图一处</h3><p>查看人口、流动、灾患与疫情。王朝所见，未必是你所见。</p></div></aside>`;
 const s=regionStats(game,r.id),outbreaks=regionOutbreaks(game,r.id),eventList=activeEvents(game,r.id),mayDrop=game.drops<dropLimit(game.scar),selectedDisease=stateUI.dropChoice||game.firstDisease||diseases[0].id,dropError=canDrop(game,r.id,selectedDisease);
 return `<aside class="detail-panel ${stateUI.detailOpen?'open':''}"><div class="detail-handle" data-action="close-detail"></div><div class="detail-scroll"><div class="detail-top"><div><span class="eyebrow">${esc(r.province)} / ${typeLabel[r.type]}</span><h2>${r.name}</h2></div><button class="plain detail-close" data-action="close-detail" aria-label="关闭地区详情">×</button></div><div class="detail-tags">${r.tags.map(t=>pill(t)).join('')}</div><div class="stat-grid"><div><span>人口</span><strong>${r.population}万</strong></div><div><span>流动</span><strong>${s.mobility} <small>${s.mobility>=70?'高':s.mobility>=40?'中':'低'}</small></strong></div><div><span>秩序</span><strong>${s.order}</strong></div><div><span>灾患</span><strong>${s.disaster} <small>${s.disaster>=75?'极高':s.disaster>=50?'高':''}</small></strong></div></div><div class="detail-section"><div class="subhead"><h3>此地疫况</h3><span>${outbreaks.length} 种活跃</span></div>${outbreaks.length?outbreaks.map(outbreakCard).join(''):'<p class="muted">此地尚无疫踪。</p>'}</div><div class="detail-section"><div class="subhead"><h3>降疫</h3><span>${game.drops===0?'首次免费':`已降 ${game.drops}/${dropLimit(game.scar)}`}</span></div><div class="drop-row"><select id="drop-disease" aria-label="选择降临疫病">${diseases.filter(d=>(d.unlockScar||0)<=game.scar).map(d=>`<option value="${d.id}" ${d.id===selectedDisease?'selected':''}>${d.name}${d.special?' · 灾厄':''}</option>`).join('')}</select><button class="primary" data-action="drop" ${mayDrop&&!dropError?'':'disabled'}>降于此地${game.drops?` · ${dropCost(game) + (game.outbreaks.some(o=>o.diseaseId===selectedDisease) ? Math.ceil(dropCost(game)*.25) : 0)}`:''}</button></div>${dropError?`<p class="action-note">${esc(dropError)}</p>`:`<p class="action-note">${esc(one(diseases,selectedDisease).line)}</p>`}</div><div class="detail-section"><div class="subhead"><h3>当前大事</h3><span>${eventList.length} 件</span></div>${eventList.length?eventList.map(e=>`<div class="local-event"><b>${e.title}</b><p>${e.text}</p><small>${e.effect}</small></div>`).join(''):'<p class="muted">本旬无大事。</p>'}</div></div></aside>`;
}
function world(){return `<div class="world-layout">${mapPanel()}${detail()}</div>`;}
function codex(){
 const trees=diseases.map((d,index)=>{
   const matching=game.outbreaks.filter(o=>o.diseaseId===d.id), unique=new Set(matching.map(o=>o.regionId)).size, progress=diseaseProgress(game,d.id), tree=diseaseSkills[d.id], locked=(d.unlockScar||0)>game.scar;
   const xpPct=Math.min(100,Math.round(progress.xp/12*100));
   const branchMarkup=tree.branches.map(branch=>{
     const chosen=progress.branch===branch.id, excluded=progress.branch&&progress.branch!==branch.id;
     return `<section class="skill-branch ${chosen?'chosen':''} ${excluded?'excluded':''}">
       <div class="skill-branch-head"><div><span class="eyebrow">${chosen?'已择疫路':'疫路'}</span><h4>${branch.name}</h4></div><span class="branch-mark">${branch.name[0]}</span></div>
       <p class="branch-line">${branch.line}</p>
       <div class="skill-nodes">${branch.nodes.map(node=>{
         const unlocked=progress.skills.includes(node.id), reason=canUnlockDiseaseSkill(game,d.id,node.id), available=!reason;
         return `<div class="skill-node ${unlocked?'unlocked':available?'available':excluded?'excluded':'waiting'}">
           <div class="skill-tier">第${node.tier}阶 <span>疫历 ${node.xp}</span></div>
           <div class="skill-copy"><strong>${node.name}</strong><p>${node.desc}</p></div>
           ${unlocked?'<span class="skill-state">已生此性</span>':available?`<button class="skill-unlock" data-action="unlock-skill" data-id="${node.id}" data-value="${d.id}">择此疫性</button>`:`<span class="skill-lock">${reason}</span>`}
         </div>`;
       }).join('')}</div>
     </section>`;
   }).join('');
   return `<article class="evolution-card disease-tone-${index} ${locked?'plague-locked':''} ${d.special?'special-plague':''}">
     <header class="evolution-hero"><div class="evo-glyph">${d.name[0]}</div><div class="evo-title"><span class="eyebrow">疫册 · ${String(index+1).padStart(2,'0')}</span><h3>${d.name}</h3><p class="verse">${d.line}</p></div><div class="evo-numbers"><span>疫区<strong>${unique}</strong></span><span>病者<strong>${number(matching.reduce((n,o)=>n+o.infected,0))}</strong></span></div></header>
     <div class="evolution-progress"><div><span>疫历</span><strong>${progress.xp}</strong><small>经历存续、借势与岁月而生变</small></div><div class="xp-track"><i style="width:${xpPct}%"></i><b>3</b><b>7</b><b>12</b></div></div>
     <div class="tag-row evo-tags">${d.tags.map(t=>pill(t)).join('')}${locked?pill(`疫痕 ${d.unlockScar} 解锁`,'locked-pill'):d.special?pill('特殊灾厄','red'):''}</div>
     <div class="skill-branches">${locked?`<div class="plague-lock-panel"><strong>${d.name}尚未显现</strong><span>疫痕达到 ${d.unlockScar} 后，此页才会展开真正的疫路。</span></div>`:branchMarkup}</div>
     ${matching.length?`<div class="codex-locations"><span>现世疫踪</span>${matching.map(o=>`<button data-action="jump-region" data-id="${o.regionId}">${one(regions,o.regionId).name} ↗</button>`).join('')}</div>`:''}
   </article>`;
 }).join('');
 return `<div class="content-page codex-page"><div class="content-heading codex-heading"><span class="eyebrow">疫册 / THE BOOK OF PESTILENCE</span><h2>疫会记住自己走过的人间。</h2><p>疫历不是货币。每一种疫在存续与借势中积累经历，并沿一条疫路生出新的行为。</p></div><div class="evolution-grid">${trees}</div><div class="unlock-strip"><strong>再降疫</strong><span>疫痕 20 / 45 / 75 解锁新的独立疫源；疫历只决定单种疫的成长。</span></div></div>`;
}
function news(){const categories=[['all','全部'],['politics','朝廷'],['disaster','灾异'],['population','流民'],['military','军事'],['society','民间'],['epidemic','疫报']];const items=game.log.filter(e=>stateUI.filter==='all'||e.category===stateUI.filter);
 return `<div class="content-page news-page"><div class="content-heading"><span class="eyebrow">诏闻 / IMPERIAL RECORD</span><h2>奏上来的，未必是真相。</h2><p>每条诏闻都留下了它对天下的真实影响。</p></div><div class="filter-row">${categories.map(([id,label])=>`<button data-filter="${id}" class="${stateUI.filter===id?'active':''}">${label}</button>`).join('')}</div><div class="timeline">${items.length?items.map((e,i)=>`<article class="news-item"><div class="time-mark">${periodName(e.turn)}</div><div class="news-body"><span class="eyebrow">${esc(e.regionIds.map(id=>one(regions,id)?.name).filter(Boolean).slice(0,2).join(' · ')||'天下')}</span><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><button class="impact-toggle" data-action="toggle-log" data-id="${i}">${stateUI.logOpen===i?'收起真实影响 −':'查看真实影响 ＋'}</button>${stateUI.logOpen===i?`<div class="impact"><span>疫所见</span> ${esc(e.effect)}</div>`:''}</div></article>`).join(''):'<p class="muted">此类诏闻尚无记录。</p>'}</div></div>`;}
function court(){return `<div class="content-page"><div class="content-heading"><span class="eyebrow">靖朝 / THE SIX PILLARS</span><h2>腐朽的梁柱，仍在支撑天下。</h2><p>六方各有所求。每一旬，他们都会自行行动；你无法命令任何一方。</p></div><div class="court-grid">${factions.map(f=>{const a=game.factionActions[f.id];return `<article class="faction-card"><div class="faction-top"><span class="faction-glyph">${f.symbol}</span><div><span class="eyebrow">${f.name}</span><h3>${f.person}</h3></div>${pill(a.status)}</div><p class="action-copy">${a.action}</p><div class="faction-impact"><span>本旬影响</span><strong>${a.impact}</strong></div></article>`}).join('')}</div></div>`;}
function turnBrief(){const r=game?.lastReport;if(!r||stateUI.briefTurn!==r.turn)return '';return `<aside class="turn-brief"><div><span class="eyebrow">旬报 · ${periodName(r.turn)}</span><strong>天下又变了。</strong><p>${r.headlines.slice(0,2).map(esc).join(' · ')}</p></div><div class="turn-brief-stats"><span>新疫地 <b>${r.newRegions}</b></span><span>疫势 <b>${r.power>=0?'+':''}${r.power}</b></span><span>疫痕 <b>+${r.scar}</b></span><span>朝警 <b>${r.alert>=0?'+':''}${r.alert}</b></span></div><button data-tab="news">阅诏闻 →</button></aside>`;}
function gamePage(){if(!game) return home();return `<div class="game-shell ${stateUI.tab==='world'?'on-world':''}"><aside class="left-rail"><div class="rail-logo">时疠纪 <small>CHRONICLE OF PESTILENCE</small></div>${nav()}<div class="rail-hud">${hud()}</div><div class="rail-recent"><span class="eyebrow">近日诏闻</span>${game.log.slice(0,3).map(e=>`<button data-tab="news">${esc(e.title)}<small>${periodName(e.turn)}</small></button>`).join('')}</div><button class="rail-settings" data-action="pause">卷宗 / 设置</button></aside><div class="main-area"><div class="mobile-hud">${hud()}</div>${stateUI.tab==='world'?world():stateUI.tab==='codex'?codex():stateUI.tab==='news'?news():court()}</div><div class="mobile-nav">${nav()}</div>${turnBrief()}${stateUI.tab==='world'&&stateUI.detailOpen?'<div class="sheet-shade" data-action="close-detail"></div>':''}</div>`;}
function archive(){return pageFrame('档案','只有这一世的记录。新局会覆写当前存档。',game?`<div class="archive-card"><span class="eyebrow">一世 / ${stageName(game.scar)}</span><h2>${esc(game.name)}之疫</h2><p>${periodName(game.turn)}</p><div class="archive-stats"><span>活跃疫病 ${new Set(game.outbreaks.map(o=>o.diseaseId)).size}</span><span>疫痕 ${game.scar}</span><span>朝警 ${alertName(game.alert)}</span><span>染疫地区 ${new Set(game.outbreaks.map(o=>o.regionId)).size}</span></div><blockquote>${esc(game.log[0]?.text||'史书尚未记下此疫。')}</blockquote>${button('continue','继续此世 →','primary')}</div>`:'<div class="empty-card">尚无一世之疫。<button class="primary" data-action="new">开新局 →</button></div>',stateUI.returnRoute);}
function settingsPage(){return pageFrame('设置','这卷史书的阅读方式。',`<div class="settings-list"><label><span><strong>较大文字</strong><small>放大正文与操作文字</small></span><input type="checkbox" data-setting="largeText" ${settings.largeText?'checked':''}></label><label><span><strong>减少动效</strong><small>减弱地图与界面过渡</small></span><input type="checkbox" data-setting="lessMotion" ${settings.lessMotion?'checked':''}></label><div class="settings-danger"><strong>当前存档</strong><p>清除后无法恢复。</p>${button('reset','清除存档','danger',game?'':'disabled')}</div></div>`,stateUI.returnRoute);}
function overlay(){if(!stateUI.modal)return '';
 if(stateUI.modal==='tutorial')return `<div class="overlay"><div class="modal tutorial" role="dialog" aria-modal="true"><span class="eyebrow">初入人间</span><h2>疫不会自己听命于你。</h2><p>你能让它蛰伏、蔓延，或盛发。王朝并不知道你看见的一切：地方会瞒报，朝廷会误判，百姓会逃亡。</p><p>真正有用的，是疫让这个王朝改变了什么。</p>${button('close-modal','明白 →','primary wide')}</div></div>`;
 if(stateUI.modal==='pause')return `<div class="overlay"><div class="modal compact" role="dialog" aria-modal="true"><span class="eyebrow">暂停 / 卷宗</span><h2>${esc(game.name)}之疫</h2><p>${dateName(game.turn,game.dayInTurn||0)} · 时间在界面关闭时暂停 · 自动存档中</p>${button('close-modal','继续观天下','primary wide')}${button('settings','设置','secondary wide')}${button('archive','档案','secondary wide')}${button('home','返回卷首','ghost wide')}</div></div>`;
 if(stateUI.modal==='confirm-new'||stateUI.modal==='confirm-reset'){const fresh=stateUI.modal==='confirm-new';return `<div class="overlay"><div class="modal compact" role="dialog" aria-modal="true"><span class="eyebrow">请确认</span><h2>${fresh?'重开一世？':'清除这一世？'}</h2><p>当前存档会被覆写，无法恢复。</p>${button(fresh?'confirm-new':'confirm-reset',fresh?'重开一世':'清除存档','danger wide')}${button('close-modal','返回','secondary wide')}</div></div>`;}
 return '';
}
function render(){document.documentElement.classList.toggle('large-text',!!settings.largeText);document.documentElement.classList.toggle('less-motion',!!settings.lessMotion);
 let route=stateUI.route;
 if(route==='/game'&&!game)route='/';
 if(route==='/game'&&game&&!game.firstDisease)route='/disease-select';
 const body=route==='/new'?identity():route==='/name'?namePage():route==='/prologue'?prologuePage():route==='/disease-select'?diseasePage():route==='/game'?gamePage():route==='/archive'?archive():route==='/settings'?settingsPage():home();
 app.innerHTML=body+overlay()+(stateUI.toast?`<div class="toast" role="status">${esc(stateUI.toast)}</div>`:'');
 document.title=`${route==='/game'&&game?`${game.name}之疫 · `:''}时疠纪 · Chronicle of Pestilence`;
 window.render_game_to_text=()=>JSON.stringify({coordinateSystem:'SVG origin top-left, x right, y down; 900x680 map',route:stateUI.route,tab:stateUI.tab,selectedRegion:stateUI.selected,modal:stateUI.modal,turn:game?.turn,power:game?.power,scar:game?.scar,alert:game?.alert,drops:game?.drops,outbreaks:game?.outbreaks?.map(o=>({region:o.regionId,disease:o.diseaseId,infected:o.infected,stance:o.stance})),activeEvents:game?activeEvents(game).map(e=>e.id):[]});
 window.advanceTime=()=>{if(game){const report=advanceDay(game);saveGame(game);if(report){stateUI.briefTurn=report.turn;}render();}};
}
function zoom(factor){const box=stateUI.map,cx=box.x+box.w/2,cy=box.y+box.h/2,w=Math.max(280,Math.min(900,box.w*factor)),h=Math.max(260,Math.min(680,box.h*factor));stateUI.map={x:Math.max(0,Math.min(900-w,cx-w/2)),y:Math.max(0,Math.min(680-h,cy-h/2)),w,h};render();}
app.addEventListener('submit',e=>{if(e.target.id!=='name-form')return;e.preventDefault();const name=e.target.elements.name.value.trim();if(!name)return toast('请为此世之疫命名');game=newGame(name);saveGame(game);stateUI.prologue=0;go('/prologue');});
app.addEventListener('input',e=>{if(e.target.id==='plague-name')document.querySelector('#name-live').textContent=e.target.value.trim()||'无名';});
app.addEventListener('change',e=>{if(e.target.dataset.setting){settings[e.target.dataset.setting]=e.target.checked;localStorage.setItem('yi-settings-v01',JSON.stringify(settings));render();}if(e.target.id==='drop-disease'){stateUI.dropChoice=e.target.value;render();}});
app.addEventListener('click',e=>{
 const region=e.target.closest('[data-region]');if(region&&!suppressClick){stateUI.selected=region.dataset.region;stateUI.detailOpen=true;render();return;}
 if(suppressClick){suppressClick=false;return;}
 const tab=e.target.closest('[data-tab]');if(tab){stateUI.tab=tab.dataset.tab;stateUI.detailOpen=false;render();return;}
 const filter=e.target.closest('[data-filter]');if(filter){stateUI.filter=filter.dataset.filter;stateUI.logOpen=null;render();return;}
 const route=e.target.closest('[data-route]');if(route){go(route.dataset.route);return;}
 const target=e.target.closest('[data-action]');if(!target)return;
 const {action,id,value}=target.dataset;
 if(action==='new'){if(game){stateUI.modal='confirm-new';render();}else go('/new');}
 else if(action==='confirm-new'){game=null;localStorage.removeItem(SAVE_KEY);stateUI.selected=null;stateUI.tab='world';go('/new');}
 else if(action==='continue'){if(!game)return;go(game.firstDisease?'/game':'/disease-select');}
 else if(action==='archive'||action==='settings'||action==='home'){if(action!=='home')stateUI.returnRoute=stateUI.route;go('/'+(action==='home'?'':action));}
 else if(action==='choose-yi')go('/name');
 else if(action==='random-name'){stateUI.nameSuggestion=randomNames[Math.floor(Math.random()*randomNames.length)];const input=document.querySelector('#plague-name');input.value=stateUI.nameSuggestion;document.querySelector('#name-live').textContent=stateUI.nameSuggestion;}
 else if(action==='prologue-next'){if(stateUI.prologue<8){stateUI.prologue++;render();}else go('/disease-select');}
 else if(action==='first-disease'){if(!game)game=newGame();game.firstDisease=id;saveGame(game);stateUI.dropChoice=id;stateUI.tab='world';go('/game');}
 else if(action==='close-detail'){stateUI.detailOpen=false;render();}
 else if(action==='drop'){const err=dropDisease(game,stateUI.selected,document.querySelector('#drop-disease').value);if(err)return toast(err);const first=game.drops===1;save();if(first){stateUI.modal='tutorial';render();}}
 else if(action==='stance'){const err=changeStance(game,id,value);err?toast(err):save();}
 else if(action==='hide'){const err=hideDisease(game,id);err?toast(err):save();}
 else if(action==='borrow'){const err=borrowEvent(game,id,document.querySelector(`[data-borrow-select="${id}"]`)?.value);err?toast(err):save();}
 else if(action==='unlock-skill'){const err=unlockDiseaseSkill(game,value,id);if(err)toast(err);else{saveGame(game);toast(`${one(diseases,value)?.name||'此疫'}已有所变 · 已掌握新疫性`);}}
 else if(action==='speed'){setTimeSpeed(game,Number(value));clockBank=0;saveGame(game);render();}
 else if(action==='close-modal'){stateUI.modal=null;if(game&&!game.completedTutorial){game.completedTutorial=true;saveGame(game);}render();}
 else if(action==='pause'){stateUI.modal='pause';render();}
 else if(action==='reset'){stateUI.modal='confirm-reset';render();}
 else if(action==='confirm-reset'){localStorage.removeItem(SAVE_KEY);game=null;stateUI.modal=null;go('/');}
 else if(action==='zoom-in')zoom(.72);else if(action==='zoom-out')zoom(1/.72);else if(action==='zoom-reset'){stateUI.map=defaultMap();render();}
 else if(action==='jump-region'){stateUI.selected=id;stateUI.tab='world';stateUI.detailOpen=true;render();}
 else if(action==='toggle-log'){stateUI.logOpen=stateUI.logOpen===Number(id)?null:Number(id);render();}
});
function tickClock(){
 const now=Date.now(),elapsed=Math.min(1000,now-clockLast);clockLast=now;
 if(!game||stateUI.route!=='/game'||game.drops===0||game.paused||stateUI.modal)return;
 clockBank=Math.min(GAME_DAY_MS*2,clockBank+elapsed*(game.timeSpeed||1));
 if(clockBank<GAME_DAY_MS)return;
 clockBank-=GAME_DAY_MS;
 const report=advanceDay(game);
 saveGame(game);
 if(report){
   stateUI.briefTurn=report.turn;
   setTimeout(()=>{if(stateUI.briefTurn===report.turn){stateUI.briefTurn=null;render();}},6500);
 }
 render();
}
setInterval(tickClock,250);

app.addEventListener('keydown',e=>{const region=e.target.closest('[data-region]');if(region&&(e.key==='Enter'||e.key===' ')){e.preventDefault();stateUI.selected=region.dataset.region;stateUI.detailOpen=true;render();}});
app.addEventListener('pointerdown',e=>{if(!e.target.closest('#map-stage')||e.target.closest('[data-region]'))return;pointer={x:e.clientX,y:e.clientY,box:{...stateUI.map}};});
window.addEventListener('pointerup',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dx)+Math.abs(dy)>8){const stage=document.querySelector('#map-stage');if(stage){const scale=pointer.box.w/stage.clientWidth;stateUI.map.x=Math.max(0,Math.min(900-stateUI.map.w,pointer.box.x-dx*scale));stateUI.map.y=Math.max(0,Math.min(680-stateUI.map.h,pointer.box.y-dy*scale));document.querySelector('.world-svg')?.setAttribute('viewBox',`${stateUI.map.x} ${stateUI.map.y} ${stateUI.map.w} ${stateUI.map.h}`);suppressClick=true;setTimeout(()=>suppressClick=false,100);}}pointer=null;});
const syncRoute=()=>{stateUI.route=routeFromLocation();stateUI.modal=null;render();};
window.addEventListener('popstate',syncRoute);
window.addEventListener('hashchange',syncRoute);
window.addEventListener('resize',()=>{const next=window.innerWidth<768;if(next!==narrowMap){narrowMap=next;stateUI.map=defaultMap();render();}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(stateUI.modal)stateUI.modal=null;else stateUI.detailOpen=false;render();}});
render();
