import { diseaseSkills, diseases, events, factions, macroRegions, regions, roads, waterways } from './data.js';
import { SAVE_KEY, activeEvents, advanceDay, alertName, borrowEvent, canDrop, canUnlockDiseaseSkill, changeStance, dateName, diseaseProgress, dropCost, dropDisease, dropLimit, hideDisease, loadGame, macroRegionEvents, macroRegionOutbreaks, macroRegionStats, newGame, periodName, regionOutbreaks, regionStats, saveGame, setTimeSpeed, stageName, unlockDiseaseSkill } from './game.js';

import './game-shell.css';
import { reliefDefs, reliefGround, settlement } from './map-art.js';

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
const macroForRegion=id=>macroRegions.find(m=>m.memberIds.includes(id));
const mapBoxFor=(mode='realm',macroId=null)=>{
 if(mode==='realm')return {x:-100,y:-65,w:1180,h:810};
 if(macroId==='donghai')return {x:650,y:225,w:420,h:410};
 const members=macroRegions.find(m=>m.id===macroId)?.memberIds.map(id=>one(regions,id)).filter(Boolean)||regions;
 const xs=members.map(r=>r.x),ys=members.map(r=>r.y),pad=window.innerWidth<768?70:95;
 const x=Math.max(0,Math.min(...xs)-pad),y=Math.max(0,Math.min(...ys)-pad),right=Math.min(900,Math.max(...xs)+pad),bottom=Math.min(680,Math.max(...ys)+pad);
 return {x,y,w:Math.max(260,right-x),h:Math.max(260,bottom-y)};
};
const stateUI={route:routeFromLocation(),returnRoute:'/',tab:'world',selected:null,detailOpen:false,modal:null,toast:'',filter:'all',prologue:0,mapMode:'realm',activeMacroRegion:null,map:{x:-100,y:-65,w:1180,h:810},nameSuggestion:'长夜',activeOutbreak:null,dropChoice:null,logOpen:null,briefTurn:null,birdHops:[]};
const defaultMap=()=>mapBoxFor(stateUI.mapMode,stateUI.activeMacroRegion);
stateUI.map=defaultMap();
let narrowMap=window.innerWidth<768;
let game=loadGame();
stateUI.codexDisease=game?.firstDisease||diseases[0].id;
stateUI.courtFaction=factions[0].id;
stateUI.disclosures={};
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
 return `<div class="home"><div class="home-map" aria-hidden="true">${realmMapArt(false)}</div><div class="home-vignette"></div><header class="home-top"><span class="eyebrow">靖朝 · 景和二十三年</span><span class="edition">卷一 / 疫至</span></header><main class="home-main"><div class="seal">疫</div><div class="game-title">时疠纪 <small>CHRONICLE OF PESTILENCE</small></div><p class="home-kicker">人世有隙，疫便由此而生</p><h1>天下已有病，<br><i>你只是让它显形。</i></h1><p class="home-copy">架空王朝 · 一旬一变 · 以疫观天下</p><div class="home-actions">${button('new','新局 · 以疫入世','primary large')}${button('continue','续局','secondary large',game?'':'disabled')}${button('archive','档案','ghost')}${button('settings','设置','ghost')}</div>${saved?`<div class="save-hint">上次：${esc(game.name)}之疫 · ${periodName(game.turn)} · ${game.outbreaks.length}处疫区</div>`:''}</main><footer class="home-foot">一局只设一世之疫　·　医者之路尚未开放</footer></div>`;
}
function identity(){return pageFrame('你要从何处看见这个王朝？','同一人间，两种命途。此世先以疫入局。',`<div class="identity-grid"><article class="identity-card chosen"><div class="card-symbol">疫</div><span class="eyebrow">当前开放 / THE PLAGUE</span><h2>疫</h2><p class="verse">无名，无形，无所归。<br>人世有隙，疫便由此而生。</p><p>俯瞰天下，择疫而降。借人流、灾荒、战争与腐败，让王朝自身的裂缝成为疫路。</p>${button('choose-yi','以疫入世 →','primary')}</article><article class="identity-card locked"><div class="card-symbol">医</div><span class="eyebrow">后续开放 / THE HEALER</span><h2>医</h2><p class="verse">人命有数，医者偏要争上一争。</p><p>身在疫中，以有限的消息、药材、人力与权势，对抗疾病与混乱。</p><button disabled>尚未开放</button></article></div>`);}
function namePage(){return pageFrame('赐此世之疫一个名。','它不会改变疫的能力。它只是后世史书对这场灾厄的称呼。',`<form id="name-form" class="name-form"><label for="plague-name">史书所记</label><div class="name-row"><input id="plague-name" name="name" maxlength="12" autocomplete="off" placeholder="例如：长夜、无归、赤岁" value="${esc(stateUI.nameSuggestion)}" /><button type="button" class="secondary" data-action="random-name">换一个</button></div><div class="name-preview">民间后来称它为—— <strong>「<span id="name-live">${esc(stateUI.nameSuggestion)}</span>之疫」</strong></div><button type="submit" class="primary wide">此名既定 →</button></form>`,'/new');}
function prologuePage(){const index=stateUI.prologue;return `<div class="prologue"><div class="prologue-top"><span>靖 / 景和二十三年</span><span>${String(index+1).padStart(2,'0')} / 09</span></div><div class="prologue-body"><span class="prologue-mark">史录 · 卷一</span><p class="${index===8?'arrival':''}">${esc(prologue[index])}</p><div class="prologue-line"></div>${button('prologue-next',index===8?'择一疫，降于人间 →':'继续阅卷 →','plain continue-line')}</div><div class="prologue-dots">${prologue.map((_,i)=>`<span class="${i<=index?'lit':''}"></span>`).join('')}</div></div>`;}
function diseasePage(){const starters=diseases.filter(d=>d.starter);return pageFrame('择一疫，降于人间。','初临只能从四种常疫中择一；更异样的疫，会随着王朝腐坏而显现。',`<div class="disease-grid">${starters.map((d,i)=>`<article class="disease-card disease-${i}"><span class="eyebrow">常疫 / ${String(i+1).padStart(2,'0')}</span><div class="disease-glyph">${d.glyph}</div><h2>${d.name}</h2><p class="verse">${d.line}</p><p>${d.desc}</p><div class="tag-row">${d.tags.map(t=>pill(t)).join('')}</div><button class="primary" data-action="first-disease" data-id="${d.id}">降此疫 →</button></article>`).join('')}</div><div class="future-plagues"><span>后世疫册尚有残页</span>　牲疫 · 禽疫 · 血疫 · 尸疫</div>`,'/prologue');}
// ==== 舆图组件：地标图标 / 地貌底纹 / 道路分级 ====
// 方案对应：《天下舆图视觉改造方案 v1》1~13 节。所有图标为简单 path，16~32px 可辨。
const MAP_W=1280,MAP_H=940,MAP_X=-160,MAP_Y=-100;
const ICON_DEFS={palace:settlement('capital'),cityGate:settlement('prefecture'),watchtower:settlement('military'),harbor:settlement('port'),granary:settlement('granary'),frontierFort:settlement('military'),grandGranary:settlement('granary'),bridgeCity:settlement('prefecture'),ferryPort:settlement('port'),riverPort:settlement('port')};
// 一级节点（王朝级）、三级节点（功能性小节点）
const TIER1=new Set(['jing','lin_he','bei_zhen','chang_ping','xi_du','nan_du','he_dong']);
const TIER3=new Set(['yan_men','shang_yuan','shuang_ling','ning_zhou','yu_jiang','xi_du_ex']);
const ICON_SCALE={capital:1.65,granary:1.3,military:1.35,port:1.3,prefecture:1.2};
const regionIconId=r=>({jing:'palace',bei_zhen:'frontierFort',chang_ping:'grandGranary',xi_du:'ferryPort',nan_du:'riverPort',lin_he:'bridgeCity'}[r.id]||({capital:'palace',prefecture:'cityGate',military:'watchtower',port:'harbor',granary:'granary'}[r.type]));
// 事件类别 → 社会状态符号（方案第 8 节，每节点至多一个，按这些优先级取第一个）
const STATUS_SYMBOLS=[['epidemic','门','锁城'],['military','旗','军事'],['disaster','水','灾患'],['population','徙','流民'],['politics','诏','朝令'],['society','风','民情']];
const statusMark=eventList=>{for(const[cat,glyph,label]of STATUS_SYMBOLS){const hit=eventList.find(e=>e.category===cat);if(hit)return{glyph,cls:`st-${cat}`,title:hit.title};}return null;};
const LAND_PATH='M95 88 Q130 62 161 60 T250 58 Q310 45 380 32 Q448 43 515 44 Q595 35 661 51 T780 90 Q796 109 803 125 L821 136 815 150 830 158 Q820 183 833 204 L824 226 836 245 827 265 836 301 Q815 319 823 342 L812 358 819 374 807 393 Q817 415 805 434 L810 448 801 466 Q778 479 785 494 L766 503 765 528 748 543 750 556 Q730 566 733 581 L722 604 Q693 609 677 625 L649 626 610 640 Q562 622 514 628 T415 639 Q357 623 328 603 T289 588 Q252 574 215 572 T157 553 Q125 513 112 485 T90 440 Q73 411 73 383 T55 306 Q62 252 78 220 T88 166 Q85 128 95 88Z';
const RELIEF_GROUND=reliefGround(LAND_PATH);
const MACRO_PATHS={
 north:'M95 88 Q153 35 250 58 L380 32 L515 44 Q636 30 780 90 L830 158 L760 207 L650 190 L560 205 L470 178 L380 194 L285 180 L190 207 L100 170 Z',
 hedong:'M100 170 L190 207 L285 180 L380 194 L423 252 L401 390 L330 452 L210 430 L90 440 L55 306 Z',
 linjin:'M423 252 L380 194 L470 178 L560 205 L650 190 L760 207 L730 220 L710 320 L700 412 L600 390 L500 412 L401 390 Z',
 luonan:'M90 440 L210 430 L330 452 L401 390 L500 412 L600 390 L700 412 L690 520 L610 640 L514 628 L415 639 L289 588 L157 553 Z',
 donghai:'M760 207 L836 301 L817 391 L801 466 L722 604 L690 520 L700 412 L710 320 L730 220 Z',
 capital_region:'M400 82 L455 58 L515 80 L530 125 L500 164 L445 175 L400 145 Z'
};
const MAIN_LINKS=[['capital_region','north','road'],['capital_region','linjin','road'],['hedong','linjin','road'],['hedong','luonan','road'],['linjin','donghai','water'],['linjin','luonan','road'],['luonan','donghai','water']];
const severityName=['无疫','潜伏','轻疫','中疫','重疫','崩坏'];
function realmMapArt(interactive=true){
 const box=stateUI.mapMode==='realm'?stateUI.map:{x:-100,y:-65,w:1180,h:810},current=game||newGame(),ordered=[...macroRegions.filter(m=>m.id!=='capital_region'),one(macroRegions,'capital_region')];
 const link=([a,b,kind])=>{const p=one(macroRegions,a),q=one(macroRegions,b);return `<path class="macro-${kind}" d="M${p.x} ${p.y} Q${(p.x+q.x)/2+12} ${(p.y+q.y)/2-12} ${q.x} ${q.y}"/>`;};
 const area=m=>{const stats=macroRegionStats(current,m.id),eventList=macroRegionEvents(current,m.id),selected=stateUI.selected===m.id;
  const auras=macroRegionOutbreaks(current,m.id).map(o=>{const r=one(regions,o.regionId),radius=28+stats.severity*9+Math.min(24,Math.log10(Number(o.infected||0)+1)*8);return `<circle class="macro-infection-aura" cx="${r.x}" cy="${r.y}" r="${radius}"/>`;}).join('');
  const diseaseText=stats.activeDiseases.slice(0,2).map(d=>d.glyph).join('·')+(stats.activeDiseases.length>2?` +${stats.activeDiseases.length-2}`:'');
  return `<g class="macro-region severity-${stats.severity} ${selected?'selected':''}" ${interactive?`data-macro="${m.id}" tabindex="0" role="button" aria-label="查看${m.name}，${severityName[stats.severity]}"`:''}>${m.id==='capital_region'?`<circle cx="${m.x}" cy="${m.y}" r="74" fill="transparent"/>`:''}<path class="macro-shape" d="${MACRO_PATHS[m.id]}"/><g clip-path="url(#clip-${m.id})">${stats.severity?`<path class="macro-infection-wash" d="${MACRO_PATHS[m.id]}"/>`:''}${auras}</g><g class="macro-title" transform="translate(${m.x} ${m.y})"><text>${m.name}</text><text class="macro-status" y="24">${severityName[stats.severity]}${stats.infected?` · ${number(stats.infected)}`:''}${diseaseText?` · ${diseaseText}`:''}</text>${eventList.length?`<text class="macro-event" x="48" y="-17">事 ${eventList.length}</text>`:''}</g></g>`;};
 return `<svg class="world-svg realm-svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" role="img" aria-label="靖朝六大区域天下舆图"><defs>${reliefDefs}<filter id="macro-glow"><feGaussianBlur stdDeviation="18"/></filter><path id="mn" d="M-4 4 Q0 -4 4 4" fill="none"/>${macroRegions.map(m=>`<clipPath id="clip-${m.id}"><path d="${MACRO_PATHS[m.id]}"/></clipPath>`).join('')}</defs>${RELIEF_GROUND}<g class="macro-routes">${MAIN_LINKS.map(link).join('')}</g><g clip-path="url(#relief-land-clip)">${ordered.map(area).join('')}</g></svg>`;
}
// 动态路线：流民 / 军队沿事件官道（方案 9.1/9.2），ai 起点取区域列表第一地，终点取下一处相邻官道地
function mapActors(){
 if(!game)return[];
 const edges=[...roads,...waterways];
 const actors=[];
 for(const e of activeEvents(game)){
   if(e.category!=='population'&&e.category!=='military')continue;
   const from=e.regionIds[0];
   const next=e.regionIds.slice(1).find(id=>edges.some(ed=>ed.includes(from)&&ed.includes(id)))||e.regionIds[1];
   if(!from||!next)continue;
   const p=one(regions,from),q=one(regions,next);
   if(!p||!q)continue;
   const curve=`M${p.x} ${p.y} Q${(p.x+q.x)/2+8} ${(p.y+q.y)/2-6} ${q.x} ${q.y}`;
   if(e.category==='population')for(let i=0;i<4;i++)actors.push({cls:'refugee-dot',r:1.5,delay:`${(-i*1.6).toFixed(1)}s`,dur:'7.5s',path:curve,pathId:`ac-${e.id}-${i}`,regionIds:[from,next]});
   else actors.push({cls:'army-flag',flag:true,delay:'0s',dur:'5.5s',path:curve,pathId:`ac-${e.id}-0`,regionIds:[from,next]});
 }
 return actors;
}
function regionMapArt(interactive=true){
 const box=stateUI.map,macro=one(macroRegions,stateUI.activeMacroRegion),members=macro?.memberIds||regions.map(r=>r.id),visible=regions.filter(r=>members.includes(r.id));
 const line=(edges,cls)=>edges.filter(([a,b])=>members.includes(a)&&members.includes(b)).map(([a,b])=>{const p=one(regions,a),q=one(regions,b);return `<path class="${cls}" d="M${p.x} ${p.y} Q${(p.x+q.x)/2+8} ${(p.y+q.y)/2-6} ${q.x} ${q.y}"/>`;}).join('');
 // 军路：与军镇相连的官道（方案 5.3）
 const military=roads.filter(([a,b])=>one(regions,a)?.type==='military'||one(regions,b)?.type==='military');
 const civilRoads=roads.filter(edge=>!military.includes(edge));
 const actors=mapActors().filter(a=>a.regionIds.every(id=>members.includes(id)));
 const node=r=>{const outbreaks=game?regionOutbreaks(game,r.id):[],selected=stateUI.selected===r.id,eventList=game?activeEvents(game,r.id):[],status=statusMark(eventList);
   const totalInfected=outbreaks.reduce((sum,o)=>sum+Number(o.infected||0),0);
   const auraRadius=outbreaks.length?Math.max(15,Math.min(46,14+Math.sqrt(totalInfected)*.65)):0;
   // 疫苗字标：最多两种，三种以上合并（方案 6.2）
   const plagueMarks=[...new Set(outbreaks.map(o=>one(diseases,o.diseaseId)?.glyph||'疫'))];
   const plagueText=plagueMarks.slice(0,2).join('·')+(plagueMarks.length>2?` +${plagueMarks.length-2}`:'');
   const plagueNames=[...new Set(outbreaks.map(o=>one(diseases,o.diseaseId)?.name).filter(Boolean))].join('、');
   const surged=outbreaks.some(o=>o.stance==='surge'),allDormant=outbreaks.length>0&&outbreaks.every(o=>o.stance==='dormant');
   const iconId=regionIconId(r),iconPath=ICON_DEFS[iconId]||ICON_DEFS.cityGate,tier=TIER1.has(r.id)?1:TIER3.has(r.id)?3:2;
   const scale=ICON_SCALE[r.type]*(tier===1?1.12:tier===3?.78:1);
   const labelY=16*scale+9,markY=16*scale+11;
   return `<g class="map-node ${selected?'selected':''} ${outbreaks.length?'infected':''} ${surged?'surging':''} ${allDormant?'dormant':''} ${r.type} tier-${tier}" ${interactive?`data-region="${r.id}" tabindex="0" role="button" aria-label="查看${r.name}${outbreaks.length?`，已有${plagueNames}，病者估计${number(totalInfected)}`:''}"`:''} transform="translate(${r.x} ${r.y})">${outbreaks.length?`<circle class="infection-aura" r="${auraRadius.toFixed(1)}"/>`:''}${surged?`<circle class="surge-ring" r="${(auraRadius+5).toFixed(1)}"/>`:''}<circle class="hit" style="r:${window.innerWidth<768?Math.max(34,22*box.w/window.innerWidth):30}px" r="30"/><ellipse class="node-ring" cy="15" rx="32" ry="16"/><g class="landmark" transform="scale(${scale.toFixed(2)})">${iconPath}</g><text class="node-name" y="-${(13*scale+6).toFixed(0)}">${r.name}</text>${status?`<g class="status-mark ${status.cls}" transform="translate(${(13*scale).toFixed(0)} -${(13*scale).toFixed(0)})" aria-label="${esc(status.title)}"><circle r="6.5"/><text y="3.4">${status.glyph}</text></g>`:''}${outbreaks.length?`<text class="sick-count disease-marks" y="${markY+13}">${plagueText}</text>`:''}</g>`;};
 return `<svg class="world-svg region-svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" role="img" aria-label="${macro?.name||''}区域舆图"><defs>${reliefDefs}<pattern id="grain" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".4" fill="#a99275" opacity=".25"/></pattern><radialGradient id="infection-aura-gradient" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#c7443b" stop-opacity=".3"/><stop offset="52%" stop-color="#b83f38" stop-opacity=".17"/><stop offset="78%" stop-color="#9d342f" stop-opacity=".07"/><stop offset="100%" stop-color="#8d2f2b" stop-opacity="0"/></radialGradient><path id="mn" d="M-4 4 Q0 -4 4 4" fill="none"/></defs>${RELIEF_GROUND}<path class="region-focus" d="${MACRO_PATHS[macro?.id]||LAND_PATH}"/>${line(civilRoads,'road')}${line(military,'road military-road')}${line(waterways,'water')}${actors.map(a=>a.flag?`<g class="actor ${a.cls}"><path d="M0 0V-9M0-9h7l-2.4 2.6L7-4H0"/><animateMotion dur="${a.dur}" repeatCount="indefinite" path="${a.path}"/></g>`:`<circle class="actor ${a.cls}" r="${a.r}"><animateMotion dur="${a.dur}" begin="${a.delay}" repeatCount="indefinite" path="${a.path}"/></circle>`).join('')}${visible.map(node).join('')}</svg>`;
}
const mapArt=(interactive=true)=>stateUI.mapMode==='realm'?realmMapArt(interactive):regionMapArt(interactive);
// 禽疫远跃飞矢：3~4 个剪影，1.2s 到达后消失（方案 9.4）
function birdHops(){if(!stateUI.birdHops?.length)return;
 const svg=document.querySelector('#map-stage .world-svg');if(!svg){stateUI.birdHops=[];return;}
 for(const hop of stateUI.birdHops){
   const p=one(regions,hop.from),q=one(regions,hop.to);if(!p||!q)continue;
   const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','bird-flock');
   const cx=(p.x+q.x)/2+(p.y-q.y)*.16,cy=(p.y+q.y)/2+(q.x-p.x)*.16;
   for(let i=0;i<3;i++){const b=document.createElementNS('http://www.w3.org/2000/svg','use');b.setAttribute('href','#mn');b.setAttribute('class','bird');b.setAttribute('transform',`translate(0 ${(i-1)*4}) scale(${.9+i*.15})`);const m=document.createElementNS('http://www.w3.org/2000/svg','animateMotion');m.setAttribute('dur','1.25s');m.setAttribute('begin',`${i*.12}s`);m.setAttribute('fill','freeze');m.setAttribute('path',`M${p.x} ${p.y} Q${cx} ${cy} ${q.x} ${q.y}`);b.appendChild(m);g.appendChild(b);}
   svg.appendChild(g);
   setTimeout(()=>g.remove(),2100);
 }
 stateUI.birdHops=[];
}
function hud(){return `<div class="hud"><div class="hud-date"><span class="eyebrow">${esc(game.name)}之疫 · ${stageName(game.scar)}</span><strong>${dateName(game.turn,game.dayInTurn||0)}</strong></div><div class="hud-stats"><div><span>疫势</span><strong>${game.power}</strong></div><div><span>疫痕</span><strong>${game.scar}<small> / ${[20,45,75,110].find(x=>x>game.scar)||'终'}</small></strong></div><div class="alert"><span>朝警 · ${alertName(game.alert)}</span><strong>${game.alert}<small> / 100</small></strong></div></div>${stateUI.tab!=='world'?'<span class="reading-note">阅卷中 · 时日暂歇</span>':''}<div class="time-controls" ${stateUI.tab!=='world'?'hidden':''} aria-label="时间流速"><button data-action="speed" data-value="0" class="${game.paused?'active':''}" title="暂停">Ⅱ</button>${[1,2,4].map(n=>`<button data-action="speed" data-value="${n}" class="${!game.paused&&game.timeSpeed===n?'active':''}">${n}×</button>`).join('')}</div><button class="plain hud-menu" data-action="pause" aria-label="暂停与设置">☰</button></div>`;}
function nav(){return `<nav class="game-nav" aria-label="主导航">${navs.map(([id,label,icon])=>`<button data-tab="${id}" class="${stateUI.tab===id?'active':''}" aria-current="${stateUI.tab===id?'page':'false'}"><span class="nav-icon">${icon}</span><span>${label}</span></button>`).join('')}</nav>`;}
function mapPanel(){const macro=one(macroRegions,stateUI.activeMacroRegion),realm=stateUI.mapMode==='realm';return `<section class="map-panel"><div class="map-heading"><div>${realm?'<span class="eyebrow">天下舆图 / THE REALM</span>':`<button class="map-back" data-action="return-realm">← 返回天下</button><span class="map-crumb">天下　›　${macro.name}</span>`}<h2>${realm?(game.drops===0?'先观大势，再择落点。':'靖朝天下'):`${macro.name}区域舆图`}</h2></div><div class="map-tools"><button data-action="zoom-out" aria-label="缩小地图">−</button><button data-action="zoom-in" aria-label="放大地图">＋</button><button data-action="zoom-reset" aria-label="重置地图">⌖</button></div></div><div class="map-stage" id="map-stage">${mapArt()}</div><div class="map-foot"><span><i class="legend-dot sick"></i>${realm?'染疫区域':'疫区'} ${realm?macroRegions.filter(m=>macroRegionStats(game,m.id).infected).length:new Set(game.outbreaks.filter(o=>macro.memberIds.includes(o.regionId)).map(o=>o.regionId)).size}</span><span><i class="legend-dot event"></i>大事 ${realm?activeEvents(game).length:macroRegionEvents(game,macro.id).length}</span><span>${realm?'点选区域 · 查看天下大势':'拖动舆图 · 点选州府'}</span></div></section>`;}
function outbreakCard(o){const d=one(diseases,o.diseaseId),hide=o.hideUntil>game.turn,available=activeEvents(game,o.regionId).filter(e=>e.borrowable);
 return `<div class="outbreak-card"><div class="outbreak-head"><strong>${d.name}</strong>${pill(stanceLabel[o.stance],o.stance==='surge'?'red':'')} ${hide?pill('藏疫中'):''}</div><div class="outbreak-meta"><span>病者估计 <b>${number(o.infected)}</b></span><span>地方察觉 <b>${o.localAwareness} · ${o.localAwareness>=80?'封控':o.localAwareness>=60?'控疫':o.localAwareness>=40?'查疫':o.localAwareness>=20?'疑疫':'未觉'}</b></span></div><div class="stance-controls" role="group" aria-label="驭疫姿态">${Object.entries(stanceLabel).map(([id,label])=>`<button data-action="stance" data-id="${o.id}" data-value="${id}" class="${o.stance===id?'active':''}" ${o.stance===id?'aria-pressed="true"':''}>${label}</button>`).join('')}</div><div class="action-note">切换姿态需疫势 2 · 每旬一次</div><div class="sub-actions">${button('hide','藏疫 · 4','secondary',`data-id="${o.id}" ${hide?'disabled':''}`)}${available.length?`<select data-borrow-select="${o.id}" aria-label="选择可借之势">${available.map(e=>`<option value="${e.id}">${e.title} · ${e.cost}</option>`).join('')}</select>${button('borrow','借势','secondary',`data-id="${o.id}" ${o.borrowedTurn===game.turn?'disabled':''}`)}`:''}</div></div>`;}
function macroDetail(){const macro=one(macroRegions,stateUI.selected);
 if(!macro)return `<aside class="detail-panel empty-detail"><div class="detail-empty"><div class="empty-sigil">◈</div><span class="eyebrow">天下总览</span><h3>点选六区之一</h3><p>先看疫势覆盖与跨区路径，再进入区域选择具体落点。</p></div></aside>`;
 const s=macroRegionStats(game,macro.id),eventList=macroRegionEvents(game,macro.id),outbreaks=macroRegionOutbreaks(game,macro.id),hotspots=macro.memberIds.map(id=>({region:one(regions,id),infected:outbreaks.filter(o=>o.regionId===id).reduce((n,o)=>n+Number(o.infected||0),0)})).filter(x=>x.infected).sort((a,b)=>b.infected-a.infected).slice(0,3);
 const diseaseText=s.activeDiseases.length?s.activeDiseases.slice(0,2).map(d=>d.name).join(' · ')+(s.activeDiseases.length>2?` +${s.activeDiseases.length-2}`:''):'尚无疫踪';
 return `<aside class="detail-panel macro-detail ${stateUI.detailOpen?'open':''}"><div class="detail-handle" data-action="close-detail"></div><div class="detail-scroll"><div class="detail-top"><div><span class="eyebrow">一级区域 / ${severityName[s.severity]}</span><h2>${macro.name}</h2><small class="dossier-date">${dateName(game.turn,game.dayInTurn||0)} · 州府卷宗</small></div><button class="plain detail-close" data-action="close-detail" aria-label="关闭区域详情"><span class="detail-close-symbol">×</span><span class="dossier-close-label">合卷</span></button></div><p class="macro-disease-line">${diseaseText}</p><div class="stat-grid"><div><span>人口</span><strong>${s.population}万</strong></div><div><span>感染</span><strong>${number(s.infected)}</strong></div><div><span>秩序</span><strong>${s.order}</strong></div><div><span>治理 / 灾患</span><strong>${s.governance} / ${s.disaster}</strong></div></div><div class="detail-section"><div class="subhead"><h3>重疫地点</h3><span>${s.infectedNodeCount} 处染疫地点</span></div>${hotspots.length?hotspots.map(x=>`<div class="macro-list-row"><b>${x.region.name}</b><span>${number(x.infected)} 人</span></div>`).join(''):'<p class="muted">此区尚无疫踪。</p>'}</div><div class="detail-section"><div class="subhead"><h3>当前大事</h3><span>${eventList.length} 件</span></div>${eventList.length?eventList.slice(0,3).map(e=>`<div class="macro-list-row"><b>${e.title}</b><span>${e.regionIds.filter(id=>macro.memberIds.includes(id)).length} 地</span></div>`).join(''):'<p class="muted">本旬无大事。</p>'}</div></div><div class="macro-enter">${button('enter-macro',`进入${macro.name} →`,'primary wide',`data-id="${macro.id}"`)}</div></aside>`;
}
function regionDetail(){const r=one(regions,stateUI.selected);
 if(!r) return `<aside class="detail-panel empty-detail"><div class="detail-empty"><div class="empty-sigil">◈</div><span class="eyebrow">州府卷宗</span><h3>点选舆图一处</h3><p>查看人口、流动、灾患与疫情。王朝所见，未必是你所见。</p></div></aside>`;
 const s=regionStats(game,r.id),outbreaks=regionOutbreaks(game,r.id),eventList=activeEvents(game,r.id),mayDrop=game.drops<dropLimit(game.scar),selectedDisease=stateUI.dropChoice||game.firstDisease||diseases[0].id,dropError=canDrop(game,r.id,selectedDisease);
 return `<aside class="detail-panel ${stateUI.detailOpen?'open':''}"><div class="detail-handle" data-action="close-detail"></div><div class="detail-scroll"><div class="detail-top"><div><span class="eyebrow">${esc(r.province)} / ${typeLabel[r.type]}</span><h2>${r.name}</h2><small class="dossier-date">${dateName(game.turn,game.dayInTurn||0)} · 州府卷宗</small></div><button class="plain detail-close" data-action="close-detail" aria-label="关闭地区详情"><span class="detail-close-symbol">×</span><span class="dossier-close-label">合卷</span></button></div><div class="detail-tags">${r.tags.map(t=>pill(t)).join('')}</div><details class="quiet-disclosure" data-disclosure="stats-${r.id}"><summary>地方概况 <span>${r.population}万人 · 灾患 ${s.disaster}</span></summary><div class="stat-grid"><div><span>人口</span><strong>${r.population}万</strong></div><div><span>流动</span><strong>${s.mobility} <small>${s.mobility>=70?'高':s.mobility>=40?'中':'低'}</small></strong></div><div><span>秩序</span><strong>${s.order}</strong></div><div><span>灾患</span><strong>${s.disaster} <small>${s.disaster>=75?'极高':s.disaster>=50?'高':''}</small></strong></div></div></details><div class="detail-section"><div class="subhead"><h3>此地疫况</h3><span>${outbreaks.length} 种活跃</span></div>${outbreaks.length?outbreaks.map(outbreakCard).join(''):'<p class="muted">此地尚无疫踪。</p>'}</div><div class="detail-section"><div class="subhead"><h3>降疫</h3><span>${game.drops===0?'首次免费':`已降 ${game.drops}/${dropLimit(game.scar)}`}</span></div><div class="drop-row"><select id="drop-disease" aria-label="选择降临疫病">${diseases.filter(d=>(d.unlockScar||0)<=game.scar).map(d=>`<option value="${d.id}" ${d.id===selectedDisease?'selected':''}>${d.name}${d.special?' · 灾厄':''}</option>`).join('')}</select><button class="primary" data-action="drop" ${mayDrop&&!dropError?'':'disabled'}>降于此地${game.drops?` · ${dropCost(game) + (game.outbreaks.some(o=>o.diseaseId===selectedDisease) ? Math.ceil(dropCost(game)*.25) : 0)}`:''}</button></div>${dropError?`<p class="action-note">${esc(dropError)}</p>`:`<p class="action-note">${esc(one(diseases,selectedDisease).line)}</p>`}</div><details class="quiet-disclosure" data-disclosure="events-${r.id}"><summary>地方大事 <span>${eventList.length} 件</span></summary><div class="detail-section"><div class="subhead"><h3>当前大事</h3><span>${eventList.length} 件</span></div>${eventList.length?eventList.map(e=>`<div class="local-event"><b>${e.title}</b><p>${e.text}</p><small>${e.effect}</small></div>`).join(''):'<p class="muted">本旬无大事。</p>'}</div></details></div></aside>`;
}
const detail=()=>stateUI.mapMode==='realm'?macroDetail():regionDetail();
function world(){return `<div class="world-layout ${stateUI.detailOpen?'has-detail':''}">${mapPanel()}${stateUI.detailOpen?detail():''}</div>`;}
const regionCount=id=>new Set(game.outbreaks.filter(o=>o.diseaseId===id).map(o=>o.regionId)).size;
function codex(){
 const selector=`<nav class="collection-index" aria-label="选择疫种">${diseases.map(d=>`<button data-action="select-disease" data-id="${d.id}" aria-pressed="${stateUI.codexDisease===d.id}"><span class="index-glyph">${d.glyph}</span><span>${d.name}<small>${game.scar<(d.unlockScar||0)?'疫痕 '+d.unlockScar+' 解锁':regionCount(d.id)+' 处疫源'}</small></span><span class="index-arrow">›</span></button>`).join('')}</nav>`;
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
   return `<article ${stateUI.codexDisease===d.id?'':'hidden'} class="evolution-card disease-tone-${index} ${locked?'plague-locked':''} ${d.special?'special-plague':''}">
     <header class="evolution-hero"><div class="evo-glyph">${d.name[0]}</div><div class="evo-title"><span class="eyebrow">疫册 · ${String(index+1).padStart(2,'0')}</span><h3>${d.name}</h3><p class="verse">${d.line}</p></div><div class="evo-numbers"><span>疫区<strong>${unique}</strong></span><span>病者<strong>${number(matching.reduce((n,o)=>n+o.infected,0))}</strong></span></div></header>
     <div class="evolution-progress"><div><span>疫历</span><strong>${progress.xp}</strong><small>经历存续、借势与岁月而生变</small></div><div class="xp-track"><i style="width:${xpPct}%"></i><b>3</b><b>7</b><b>12</b></div></div>
     <div class="tag-row evo-tags">${d.tags.map(t=>pill(t)).join('')}${locked?pill(`疫痕 ${d.unlockScar} 解锁`,'locked-pill'):d.special?pill('特殊灾厄','red'):''}</div>
     <div class="skill-branches">${locked?`<div class="plague-lock-panel"><strong>${d.name}尚未显现</strong><span>疫痕达到 ${d.unlockScar} 后，此页才会展开真正的疫路。</span></div>`:branchMarkup}</div>
     ${matching.length?`<div class="codex-locations"><span>现世疫踪</span>${matching.map(o=>`<button data-action="jump-region" data-id="${o.regionId}">${one(regions,o.regionId).name} ↗</button>`).join('')}</div>`:''}
   </article>`;
 }).join('');
 return `<div class="content-page codex-page"><div class="content-heading codex-heading"><span class="eyebrow">疫册 / THE BOOK OF PESTILENCE</span><h2>疫册</h2><p>择一疫，观其性，定其路。</p></div><div class="collection-layout">${selector}<div class="evolution-grid">${trees}</div></div><div class="unlock-strip"><strong>再降疫</strong><span>疫痕 20 / 45 / 75 解锁新的独立疫源；疫历只决定单种疫的成长。</span></div></div>`;
}
function news(){const categories=[['all','全部'],['politics','朝廷'],['disaster','灾异'],['population','流民'],['military','军事'],['society','民间'],['epidemic','疫报']];const items=game.log.filter(e=>stateUI.filter==='all'||e.category===stateUI.filter);
 return `<div class="content-page news-page"><div class="content-heading"><span class="eyebrow">诏闻 / IMPERIAL RECORD</span><h2>诏闻</h2><p>奏上来的，未必是真相。</p></div><div class="filter-row">${categories.map(([id,label])=>`<button data-filter="${id}" class="${stateUI.filter===id?'active':''}">${label}</button>`).join('')}</div><div class="timeline">${items.length?items.map((e,i)=>`<article class="news-item"><div class="time-mark">${periodName(e.turn)}</div><div class="news-body"><span class="eyebrow">${esc(e.regionIds.map(id=>one(regions,id)?.name).filter(Boolean).slice(0,2).join(' · ')||'天下')}</span><h3><button class="record-title" data-action="toggle-log" data-id="${i}" aria-expanded="${stateUI.logOpen===i}">${esc(e.title)}<span>${stateUI.logOpen===i?'−':'＋'}</span></button></h3>${stateUI.logOpen===i?`<p>${esc(e.text)}</p><div class="impact"><span>疫所见</span> ${esc(e.effect)}</div>`:''}</div></article>`).join(''):'<p class="muted">此类诏闻尚无记录。</p>'}</div></div>`;}
function court(){return `<div class="content-page court-page"><div class="content-heading"><span class="eyebrow">靖朝 / THE SIX PILLARS</span><h2>王朝</h2><p>六方各有所求，天下由此而动。</p></div><div class="collection-layout"><nav class="collection-index" aria-label="选择势力">${factions.map(f=>`<button data-action="select-faction" data-id="${f.id}" aria-pressed="${stateUI.courtFaction===f.id}"><span class="index-glyph">${f.symbol}</span><span>${f.name}<small>${game.factionActions[f.id].status}</small></span><span class="index-arrow">›</span></button>`).join('')}</nav><div class="court-grid">${factions.map(f=>{const a=game.factionActions[f.id];return `<article class="faction-card" ${stateUI.courtFaction===f.id?'':'hidden'}><div class="faction-top"><span class="faction-glyph">${f.symbol}</span><div><span class="eyebrow">${f.name}</span><h3>${f.person}</h3></div>${pill(a.status)}</div><span class="eyebrow">本旬动向</span><p class="action-copy">${a.action}</p><div class="faction-impact"><span>对天下的影响</span><strong>${a.impact}</strong></div><p class="court-note">六方每旬自行行动。你可观其势，无法号令他们。</p></article>`;}).join('')}</div></div></div>`;}
function turnBrief(){const r=game?.lastReport;if(!r||stateUI.briefTurn!==r.turn)return '';return `<aside class="turn-brief"><div><span class="eyebrow">旬报 · ${periodName(r.turn)}</span><strong>天下又变了。</strong><p>${r.headlines.slice(0,2).map(esc).join(' · ')}</p></div><div class="turn-brief-stats"><span>新疫地 <b>${r.newRegions}</b></span><span>疫势 <b>${r.power>=0?'+':''}${r.power}</b></span><span>疫痕 <b>+${r.scar}</b></span><span>朝警 <b>${r.alert>=0?'+':''}${r.alert}</b></span></div><button data-tab="news">阅诏闻 →</button><button class="brief-close plain" data-action="dismiss-brief" aria-label="收起旬报">×</button></aside>`;}
function gamePage(){if(!game)return home();return `<div class="game-shell ${stateUI.tab==='world'?'on-world':''}"><header class="game-masthead"><div class="masthead-brand">时疠纪<small>CHRONICLE OF PESTILENCE</small></div><div class="desktop-navigation">${nav()}</div><button class="plain journal-button" data-action="pause">卷宗 <kbd>Esc</kbd></button></header><div class="session-bar">${hud()}</div><main class="main-area">${stateUI.tab==='world'?world():stateUI.tab==='codex'?codex():stateUI.tab==='news'?news():court()}</main><div class="mobile-nav">${nav()}</div>${stateUI.tab==='world'?turnBrief():''}${stateUI.tab==='world'&&stateUI.detailOpen?'<div class="sheet-shade" data-action="close-detail"></div>':''}</div>`;}
function archive(){return pageFrame('档案','只有这一世的记录。新局会覆写当前存档。',game?`<div class="archive-card"><span class="eyebrow">一世 / ${stageName(game.scar)}</span><h2>${esc(game.name)}之疫</h2><p>${periodName(game.turn)}</p><div class="archive-stats"><span>活跃疫病 ${new Set(game.outbreaks.map(o=>o.diseaseId)).size}</span><span>疫痕 ${game.scar}</span><span>朝警 ${alertName(game.alert)}</span><span>染疫地区 ${new Set(game.outbreaks.map(o=>o.regionId)).size}</span></div><blockquote>${esc(game.log[0]?.text||'史书尚未记下此疫。')}</blockquote>${button('continue','继续此世 →','primary')}</div>`:'<div class="empty-card">尚无一世之疫。<button class="primary" data-action="new">开新局 →</button></div>',stateUI.returnRoute);}
function settingsPage(){return pageFrame('设置','这卷史书的阅读方式。',`<div class="settings-list"><label><span><strong>较大文字</strong><small>放大正文与操作文字</small></span><input type="checkbox" data-setting="largeText" ${settings.largeText?'checked':''}></label><label><span><strong>减少动效</strong><small>减弱地图与界面过渡</small></span><input type="checkbox" data-setting="lessMotion" ${settings.lessMotion?'checked':''}></label><div class="settings-danger"><strong>当前存档</strong><p>清除后无法恢复。</p>${button('reset','清除存档','danger',game?'':'disabled')}</div></div>`,stateUI.returnRoute);}
function overlay(){if(!stateUI.modal)return '';
 if(stateUI.modal==='tutorial')return `<div class="overlay"><div class="modal tutorial" role="dialog" aria-modal="true"><span class="eyebrow">初入人间</span><h2>疫不会自己听命于你。</h2><p>你能让它蛰伏、蔓延，或盛发。王朝并不知道你看见的一切：地方会瞒报，朝廷会误判，百姓会逃亡。</p><p>真正有用的，是疫让这个王朝改变了什么。</p>${button('close-modal','明白 →','primary wide')}</div></div>`;
 if(stateUI.modal==='pause')return `<div class="overlay"><div class="modal compact" role="dialog" aria-modal="true"><span class="eyebrow">暂停 / 卷宗</span><h2>${esc(game.name)}之疫</h2><p>${dateName(game.turn,game.dayInTurn||0)} · 阅卷时暂停 · 自动存档</p>${button('close-modal','继续观天下','primary wide')}${button('settings','设置','secondary wide')}${button('archive','档案','secondary wide')}${button('home','返回卷首','ghost wide')}</div></div>`;
 if(stateUI.modal==='confirm-new'||stateUI.modal==='confirm-reset'){const fresh=stateUI.modal==='confirm-new';return `<div class="overlay"><div class="modal compact" role="dialog" aria-modal="true"><span class="eyebrow">请确认</span><h2>${fresh?'重开一世？':'清除这一世？'}</h2><p>当前存档会被覆写，无法恢复。</p>${button(fresh?'confirm-new':'confirm-reset',fresh?'重开一世':'清除存档','danger wide')}${button('close-modal','返回','secondary wide')}</div></div>`;}
 return '';
}
function render(){
 const focused=document.activeElement;
 const focusAttrs=focused?.getAttributeNames().filter(a=>a==='id'||a.startsWith('data-'))||[];
 const focusSelector=focusAttrs.map(a=>`[${a}="${CSS.escape(focused.getAttribute(a))}"]`).join('');
 for(const el of app.querySelectorAll('details[data-disclosure]'))stateUI.disclosures[el.dataset.disclosure]=el.open;
 document.documentElement.classList.toggle('large-text',!!settings.largeText);document.documentElement.classList.toggle('less-motion',!!settings.lessMotion);
 let route=stateUI.route;
 if(route==='/game'&&!game)route='/';
 if(route==='/game'&&game&&!game.firstDisease)route='/disease-select';
 const body=route==='/new'?identity():route==='/name'?namePage():route==='/prologue'?prologuePage():route==='/disease-select'?diseasePage():route==='/game'?gamePage():route==='/archive'?archive():route==='/settings'?settingsPage():home();
 app.innerHTML=body+overlay()+(stateUI.toast?`<div class="toast" role="status">${esc(stateUI.toast)}</div>`:'');
 for(const el of app.querySelectorAll('details[data-disclosure]'))el.open=!!stateUI.disclosures[el.dataset.disclosure];
 birdHops();
 const dialog=app.querySelector('[role="dialog"]');
 const restore=focusSelector&&Array.from(app.querySelectorAll(focusSelector)).find(el=>el.getClientRects().length&&(!dialog||dialog.contains(el)));
 (restore||dialog?.querySelector('button'))?.focus({preventScroll:true});
 document.title=`${route==='/game'&&game?`${game.name}之疫 · `:''}时疠纪 · Chronicle of Pestilence`;
 window.render_game_to_text=()=>JSON.stringify({coordinateSystem:'SVG origin top-left, x right, y down; 900x680 map',route:stateUI.route,tab:stateUI.tab,mapMode:stateUI.mapMode,activeMacroRegion:stateUI.activeMacroRegion,selected:stateUI.selected,selectedDisease:stateUI.dropChoice||game?.firstDisease||null,visibleRegions:stateUI.mapMode==='region'?one(macroRegions,stateUI.activeMacroRegion)?.memberIds:macroRegions.map(m=>m.id),modal:stateUI.modal,turn:game?.turn,dayInTurn:game?.dayInTurn,power:game?.power,scar:game?.scar,alert:game?.alert,drops:game?.drops,outbreaks:game?.outbreaks?.map(o=>({region:o.regionId,disease:o.diseaseId,infected:o.infected,stance:o.stance})),activeEvents:game?activeEvents(game).map(e=>e.id):[]});
 window.advanceTime=()=>{if(game){const report=advanceDay(game);saveGame(game);if(report){stateUI.briefTurn=report.turn;}render();}};
}
function zoom(factor){const box=stateUI.map,cx=box.x+box.w/2,cy=box.y+box.h/2,w=Math.max(280,Math.min(MAP_W,box.w*factor)),h=Math.max(260,Math.min(MAP_H,box.h*factor));stateUI.map={x:Math.max(MAP_X,Math.min(MAP_X+MAP_W-w,cx-w/2)),y:Math.max(MAP_Y,Math.min(MAP_Y+MAP_H-h,cy-h/2)),w,h};render();}
app.addEventListener('submit',e=>{if(e.target.id!=='name-form')return;e.preventDefault();const name=e.target.elements.name.value.trim();if(!name)return toast('请为此世之疫命名');game=newGame(name);saveGame(game);stateUI.prologue=0;go('/prologue');});
app.addEventListener('input',e=>{if(e.target.id==='plague-name')document.querySelector('#name-live').textContent=e.target.value.trim()||'无名';});
app.addEventListener('change',e=>{if(e.target.dataset.setting){settings[e.target.dataset.setting]=e.target.checked;localStorage.setItem('yi-settings-v01',JSON.stringify(settings));render();}if(e.target.id==='drop-disease'){stateUI.dropChoice=e.target.value;render();}});
app.addEventListener('click',e=>{
 const region=e.target.closest('[data-region]');if(region&&!suppressClick){stateUI.selected=region.dataset.region;stateUI.detailOpen=true;render();return;}
 const macro=e.target.closest('[data-macro]');if(macro&&!suppressClick){stateUI.selected=macro.dataset.macro;stateUI.detailOpen=true;render();return;}
 if(suppressClick){suppressClick=false;return;}
 const tab=e.target.closest('[data-tab]');if(tab){stateUI.tab=tab.dataset.tab;stateUI.detailOpen=false;render();return;}
 const filter=e.target.closest('[data-filter]');if(filter){stateUI.filter=filter.dataset.filter;stateUI.logOpen=null;render();return;}
 const route=e.target.closest('[data-route]');if(route){go(route.dataset.route);return;}
 const target=e.target.closest('[data-action]');if(!target)return;
 const {action,id,value}=target.dataset;
 if(action==='new'){if(game){stateUI.modal='confirm-new';render();}else go('/new');}
 else if(action==='confirm-new'){game=null;localStorage.removeItem(SAVE_KEY);stateUI.selected=null;stateUI.tab='world';stateUI.mapMode='realm';stateUI.activeMacroRegion=null;stateUI.map=defaultMap();go('/new');}
 else if(action==='select-disease'){stateUI.codexDisease=id;render();}
 else if(action==='select-faction'){stateUI.courtFaction=id;render();}
 else if(action==='dismiss-brief'){stateUI.briefTurn=null;render();}
 else if(action==='continue'){if(!game)return;go(game.firstDisease?'/game':'/disease-select');}
 else if(action==='archive'||action==='settings'||action==='home'){if(action!=='home')stateUI.returnRoute=stateUI.route;go('/'+(action==='home'?'':action));}
 else if(action==='choose-yi')go('/name');
 else if(action==='random-name'){stateUI.nameSuggestion=randomNames[Math.floor(Math.random()*randomNames.length)];const input=document.querySelector('#plague-name');input.value=stateUI.nameSuggestion;document.querySelector('#name-live').textContent=stateUI.nameSuggestion;}
 else if(action==='prologue-next'){if(stateUI.prologue<8){stateUI.prologue++;render();}else go('/disease-select');}
 else if(action==='first-disease'){if(!game)game=newGame();game.firstDisease=id;stateUI.codexDisease=id;saveGame(game);stateUI.dropChoice=id;stateUI.tab='world';stateUI.mapMode='realm';stateUI.activeMacroRegion=null;stateUI.selected=null;stateUI.map=defaultMap();go('/game');}
 else if(action==='close-detail'){stateUI.detailOpen=false;render();}
 else if(action==='enter-macro'){stateUI.mapMode='region';stateUI.activeMacroRegion=id;stateUI.selected=null;stateUI.detailOpen=false;stateUI.map=defaultMap();render();}
 else if(action==='return-realm'){stateUI.mapMode='realm';stateUI.activeMacroRegion=null;stateUI.selected=null;stateUI.detailOpen=false;stateUI.map=defaultMap();render();}
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
 else if(action==='jump-region'){stateUI.activeMacroRegion=macroForRegion(id)?.id||null;stateUI.mapMode=stateUI.activeMacroRegion?'region':'realm';stateUI.map=defaultMap();stateUI.selected=id;stateUI.tab='world';stateUI.detailOpen=true;render();}
 else if(action==='toggle-log'){stateUI.logOpen=stateUI.logOpen===Number(id)?null:Number(id);render();}
});
function collectBirdHops(){if(!game?.birdHops?.length)return;stateUI.seenBirdTurn=game.turn;
   if(fresh.length&&stateUI.route==='/game'&&stateUI.tab==='world')stateUI.birdHops=fresh.map(h=>({from:h.from,to:h.to}));
}
function tickClock(){
 const now=Date.now(),elapsed=Math.min(1000,now-clockLast);clockLast=now;
 if(!game||stateUI.route!=='/game'||game.drops===0||game.paused||stateUI.modal||stateUI.tab!=='world')return;
 clockBank=Math.min(GAME_DAY_MS*2,clockBank+elapsed*(game.timeSpeed||1));
 if(clockBank<GAME_DAY_MS)return;
 clockBank-=GAME_DAY_MS;
 const report=advanceDay(game);
 saveGame(game);
 collectBirdHops();
 if(report){
   stateUI.briefTurn=report.turn;
   setTimeout(()=>{if(stateUI.briefTurn===report.turn){stateUI.briefTurn=null;render();}},6500);
 }
 render();
}
setInterval(tickClock,250);

app.addEventListener('keydown',e=>{const target=e.target.closest('[data-region],[data-macro]');if(target&&(e.key==='Enter'||e.key===' ')){e.preventDefault();stateUI.selected=target.dataset.region||target.dataset.macro;stateUI.detailOpen=true;render();}});
app.addEventListener('pointerdown',e=>{if(!e.target.closest('#map-stage')||e.target.closest('[data-region],[data-macro]'))return;pointer={x:e.clientX,y:e.clientY,box:{...stateUI.map}};});
window.addEventListener('pointerup',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dx)+Math.abs(dy)>8){const stage=document.querySelector('#map-stage');if(stage){const scale=pointer.box.w/stage.clientWidth;stateUI.map.x=Math.max(MAP_X,Math.min(MAP_X+MAP_W-stateUI.map.w,pointer.box.x-dx*scale));stateUI.map.y=Math.max(MAP_Y,Math.min(MAP_Y+MAP_H-stateUI.map.h,pointer.box.y-dy*scale));document.querySelector('.world-svg')?.setAttribute('viewBox',`${stateUI.map.x} ${stateUI.map.y} ${stateUI.map.w} ${stateUI.map.h}`);suppressClick=true;setTimeout(()=>suppressClick=false,100);}}pointer=null;});
const syncRoute=()=>{stateUI.route=routeFromLocation();stateUI.modal=null;render();};
window.addEventListener('popstate',syncRoute);
window.addEventListener('hashchange',syncRoute);
window.addEventListener('resize',()=>{const next=window.innerWidth<768;if(next!==narrowMap){narrowMap=next;stateUI.map=defaultMap();render();}});
window.addEventListener('keydown',e=>{
 const dialog=app.querySelector('[role="dialog"]');
 if(e.key==='Tab'&&dialog){const buttons=[...dialog.querySelectorAll('button:not(:disabled),a[href],input,select,[tabindex="0"]')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}
 if(e.key!=='Escape')return;if(stateUI.modal){stateUI.modal=null;render();return;}if(stateUI.route!=='/game')return;if(stateUI.detailOpen)stateUI.detailOpen=false;else if(stateUI.tab!=='world')stateUI.tab='world';else if(stateUI.mapMode==='region'){stateUI.mapMode='realm';stateUI.activeMacroRegion=null;stateUI.selected=null;stateUI.map=defaultMap();}else stateUI.modal='pause';render();
});
render();
