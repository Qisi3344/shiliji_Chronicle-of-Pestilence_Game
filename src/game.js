import { diseases, events, factions, regions, roads, waterways } from './data.js';

export const SAVE_KEY = 'yi-save-v01';
const clamp = (n, a=0, b=100) => Math.max(a, Math.min(b, n));
const byId = id => regions.find(r => r.id === id);
const disease = id => diseases.find(d => d.id === id);
const hash = value => { let h=2166136261; for (const c of value) h=Math.imul(h ^ c.charCodeAt(0),16777619); return (h >>> 0) / 4294967295; };
export const periodName = turn => {
  const m=7+Math.floor((turn+2)/3), year=23+Math.floor(m/12), month=m%12+1;
  return `景和${year}年 · ${month}月${['上旬','中旬','下旬'][(turn+2)%3]}`;
};
export const stageName = scar => scar>=110?'乱世':scar>=75?'蚀国':scar>=45?'大疫':scar>=20?'成势':'初临';
export const alertName = alert => alert>=80?'国难':alert>=60?'严防':alert>=40?'戒备':alert>=20?'察觉':'无知';
export const dropLimit = scar => scar>=75?4:scar>=45?3:scar>=20?2:1;
export const dropCost = state => [0,12,18,24][state.drops] ?? Infinity;
export const activeEvents = (state, regionId) => events.filter(e => e.turn<=state.turn && state.turn<e.turn+e.duration && (!regionId || e.regionIds.includes(regionId)));
export const regionOutbreaks = (state, regionId) => state.outbreaks.filter(o => o.regionId===regionId);
export const regionStats = (state, regionId) => {
  const r=byId(regionId), active=activeEvents(state,regionId);
  const court=state.factionActions||{}, strict=court.emperor?.status==='圣心震怒', relief=court.crown_prince?.status==='分区赈济';
  const extraMobility=(strict?-8:0)+(court.people?.status==='自发避疫'?-9:court.people?.status==='闻风迁徙'?5:0)+(relief&&['nan_he','chang_ping'].includes(regionId)?-12:0)+(court.gentry?.status==='闭庄逐客'&&['lin_he','qing_xi'].includes(regionId)?12:0);
  const extraGovernance=(relief&&['nan_he','chang_ping'].includes(regionId)?10:0)+(court.chancellor?.status==='保全漕运'&&['chang_ping','xi_du','nan_du'].includes(regionId)?10:0);
  return { ...r, mobility:clamp(r.mobility+active.reduce((n,e)=>n+(e.mobility||0),0)+extraMobility), disaster:clamp(r.disaster+active.reduce((n,e)=>n+(e.disaster||0),0)), order:clamp(r.order+active.reduce((n,e)=>n+(e.order||0),0)+(court.gentry?.status==='囤粮待价'&&regionId==='lin_he'?-5:0)), governance:clamp(r.governance+active.reduce((n,e)=>n+(e.governance||0),0)+extraGovernance) };
};
export function newGame(name='长夜') {
  return { version:1, name:name.trim().slice(0,12)||'长夜', turn:0, power:0, scar:0, alert:0, drops:0, outbreaks:[], seenRegions:[], seenProvinces:[], milestones:[], log:events.filter(e=>e.turn===0).map(e=>({turn:0,category:e.category,title:e.title,text:e.text,effect:e.effect,regionIds:e.regionIds})), lastReport:null, firstDisease:null, completedTutorial:false, factionActions: Object.fromEntries(factions.map(f=>[f.id,{status:'如常',action:'朝局未动。',impact:'尚无直接影响'}])) };
}
export function canDrop(state, regionId, diseaseId) {
  if (!byId(regionId) || !disease(diseaseId)) return '请选择疫病与地区';
  if (state.drops>=4) return '一世最多降下四处疫源';
  if (state.drops>=dropLimit(state.scar)) return `疫痕达到${[0,20,45,75][state.drops]}后方可再降疫`;
  const cost=dropCost(state) + (state.outbreaks.some(o=>o.diseaseId===diseaseId) ? Math.ceil(dropCost(state)*.25) : 0);
  if (state.power<cost) return `需疫势 ${cost}`;
  if (state.outbreaks.some(o=>o.regionId===regionId && o.diseaseId===diseaseId)) return '此地已有同种疫病';
  return '';
}
function markRegion(state, regionId, notes) {
  const r=byId(regionId);
  if (!state.seenRegions.includes(regionId)) {
    state.seenRegions.push(regionId); state.scar+=1;
    if (!state.seenProvinces.includes(r.province)) { state.seenProvinces.push(r.province); state.scar+=3; notes.push(`${r.province}首次染疫`); }
    if (r.type==='capital') { state.scar+=5; state.alert=clamp(state.alert+6); notes.push('京畿首次染疫'); }
    if (r.type==='military') { state.scar+=3; state.alert=clamp(state.alert+4); notes.push('军镇首次染疫'); }
    notes.push(`${r.name}出现疫踪`);
  }
}
export function dropDisease(state, regionId, diseaseId) {
  const error=canDrop(state,regionId,diseaseId); if (error) return error;
  const cost=dropCost(state) + (state.outbreaks.some(o=>o.diseaseId===diseaseId) ? Math.ceil(dropCost(state)*.25) : 0);
  state.power-=cost; state.drops++;
  state.outbreaks.push({id:`${regionId}-${diseaseId}`,regionId,diseaseId,infected:1,stance:'dormant',localAwareness:0,hideUntil:0,switchedTurn:-1,borrowedTurn:-1,borrowedEventId:null});
  const notes=[]; markRegion(state,regionId,notes);
  const r=byId(regionId), d=disease(diseaseId);
  state.log.unshift({turn:state.turn,category:'epidemic',title:`${d.name}降于${r.name}`,text:`${r.name} · 病者 1。${d.line}`,effect:cost?`疫势 -${cost}`:'首次降疫免费',regionIds:[regionId]});
  return '';
}
export function changeStance(state, outbreakId, stance) {
  const o=state.outbreaks.find(x=>x.id===outbreakId);
  if (!o || !['dormant','spread','surge'].includes(stance)) return '未找到疫区';
  if (o.stance===stance) return '已是当前姿态';
  if (o.switchedTurn===state.turn) return '本旬已驭疫一次';
  if (state.power<2) return '疫势不足，需 2';
  state.power-=2; o.stance=stance; o.switchedTurn=state.turn;
  return '';
}
export function hideDisease(state, outbreakId) {
  const o=state.outbreaks.find(x=>x.id===outbreakId); if (!o) return '未找到疫区';
  if (o.hideUntil>state.turn) return '藏疫仍在生效';
  if (state.power<4) return '疫势不足，需 4';
  state.power-=4; o.hideUntil=state.turn+2; o.localAwareness=clamp(o.localAwareness-12); state.alert=clamp(state.alert-3);
  return '';
}
export function borrowEvent(state, outbreakId, eventId) {
  const o=state.outbreaks.find(x=>x.id===outbreakId), e=activeEvents(state,o?.regionId).find(x=>x.id===eventId && x.borrowable);
  if (!o || !e) return '此地没有可借之势';
  if (o.borrowedTurn===state.turn) return '本旬已借势';
  if (state.power<e.cost) return `疫势不足，需 ${e.cost}`;
  state.power-=e.cost; o.borrowedTurn=state.turn; o.borrowedEventId=e.id;
  return '';
}
function factionTurn(state) {
  const alert=state.alert, sick=state.outbreaks.length, capital=regionOutbreaks(state,'jing').length>0;
  const actions={
    emperor: capital||alert>=60 ? ['圣心震怒','下诏严查京畿，命诸州禁行。','朝警 +2；外流受阻'] : ['粉饰太平','命地方复核疫报，勿惊动京师。','朝警 -1；地方应对延缓'],
    chancellor: alert>=45 ? ['保全漕运','裴桢优先调医守住粮运要道。','粮运节点治理提高'] : ['压住奏折','裴桢将地方疫报留中不发。','朝警 -1；奏报失真'],
    crown_prince: state.turn>=3 ? ['分区赈济','景聿修命粥棚分区，灾民不再挤作一团。','洛南治理改善，人群流动下降'] : ['请开常平仓','景聿修上疏请赈，等待圣裁。','尚未形成政策'],
    army: alert>=40 ? ['封营查验','霍云令镇朔军分营驻扎，禁止擅离。','军镇对外传播减弱'] : ['照常征发','霍云仍按旧例调动镇朔军换防。','朔北人口流动持续'],
    gentry: sick>=4 ? ['闭庄逐客','崔氏关庄，佃户沿官道散去。','庄内收紧，周边流动上升'] : ['囤粮待价','崔氏收粮闭库。','地方秩序缓慢下降'],
    people: alert>=40 ? ['自发避疫','村社拒外人入内，市集渐稀。','人口流动下降'] : ['闻风迁徙','百姓携家投亲，流民沿官道行走。','道路传播机会增加']
  };
  state.factionActions=Object.fromEntries(Object.entries(actions).map(([id,[status,action,impact]])=>[id,{status,action,impact}]));
  state.alert=clamp(state.alert+(capital||alert>=60?2:-1)+(alert>=45?0:-1));
  return (capital||alert>=40 ? ['皇帝','边军','百姓'] : ['权相','储君','百姓']).map(name=>{
    const f=factions.find(x=>x.name===name); return `${name}：${state.factionActions[f.id].action}`;
  });
}
export function advanceTurn(state) {
  const before={power:state.power,scar:state.scar,alert:state.alert};
  const factionNotes=factionTurn(state);
  const notes=[], fresh=[]; let surged=0;
  const incoming=[];
  for (const o of [...state.outbreaks]) {
    const r=regionStats(state,o.regionId), d=disease(o.diseaseId), active=activeEvents(state,o.regionId);
    const hidden=o.hideUntil>state.turn, borrowed=o.borrowedTurn===state.turn;
    const stanceGrowth={dormant:.8,spread:1,surge:1.4}[o.stance];
    const environment=d.id==='water_woe'? .55+r.disaster/100*d.environment : d.id==='black_blight' ? .7+r.population/100 : 1;
    const gathering=1+active.reduce((n,e)=>n+(e.spread||0),0)+(borrowed ? .45 : 0);
    const control=1-r.governance/220-Math.max(0,o.localAwareness-40)/350;
    const increase=Math.max(1,Math.round((2+o.infected*.38)*d.growth*stanceGrowth*environment*gathering*control*(hidden?.85:1)));
    o.infected=clamp(o.infected+increase,1,r.population*10000);
    o.localAwareness=clamp(o.localAwareness+Math.max(1,Math.round((increase/10+o.infected/160)*d.visibility*({dormant:.65,spread:1.1,surge:1.35}[o.stance])*(hidden?.6:1))));
    if (o.stance==='surge') surged++;
    const neighbors=[...roads.filter(edge=>edge.includes(r.id)).map(edge=>[edge.find(id=>id!==r.id),1]),...waterways.filter(edge=>edge.includes(r.id)).map(edge=>[edge.find(id=>id!==r.id),1.2])];
    for (const [targetId,weight] of neighbors) {
      if (state.outbreaks.some(x=>x.regionId===targetId&&x.diseaseId===o.diseaseId) || incoming.some(x=>x.regionId===targetId&&x.diseaseId===o.diseaseId)) continue;
      const target=regionStats(state,targetId);
      const flow=(r.mobility+target.mobility)/200;
      const stance={dormant:.75,spread:1.3,surge:1.1}[o.stance];
      const armyBrake=state.alert>=40&&(r.type==='military'||target.type==='military') ? .55 : 1;
      const chance=Math.min(.82,(.08+Math.min(.48,o.infected/90))*d.spread*flow*weight*stance*gathering*armyBrake*(borrowed?1.4:1));
      if (hash(`${state.turn}|${o.id}|${targetId}`)<chance) incoming.push({id:`${targetId}-${o.diseaseId}`,regionId:targetId,diseaseId:o.diseaseId,infected:1,stance:'spread',localAwareness:0,hideUntil:0,switchedTurn:-1,borrowedTurn:-1,borrowedEventId:null});
    }
  }
  for (const o of incoming) {
    state.outbreaks.push(o); markRegion(state,o.regionId,notes); fresh.push(o);
    notes.push(`${disease(o.diseaseId).name}沿路进入${byId(o.regionId).name}`);
  }
  const newEvents=events.filter(e=>e.turn===state.turn+1);
  for (const e of newEvents) {
    notes.push(e.title);
    if (e.alert) state.alert=clamp(state.alert+e.alert);
    state.log.unshift({turn:state.turn+1,category:e.category,title:e.title,text:e.text,effect:e.effect,regionIds:e.regionIds});
  }
  let alertGain=state.outbreaks.reduce((n,o)=>n+({dormant:0,spread:1,surge:3}[o.stance])*(o.hideUntil>state.turn?.5:1),0);
  if (state.outbreaks.some(o=>o.regionId==='jing'&&o.infected>=10)) alertGain+=2;
  if (!fresh.length && !surged) alertGain-=1;
  state.alert=clamp(state.alert+Math.round(alertGain));
  if (state.alert>=80&&!state.milestones.includes('national_order')) {state.milestones.push('national_order');state.scar+=4;notes.push('朝廷颁布全国戒疫诏令');}
  const kinds=new Set(state.outbreaks.map(o=>o.diseaseId)).size;
  if (kinds>=2&&!state.milestones.includes('two_diseases')) {state.milestones.push('two_diseases');state.scar+=4;}
  if (kinds>=3&&!state.milestones.includes('three_diseases')) {state.milestones.push('three_diseases');state.scar+=6;}
  state.power+=Math.min(12,(state.outbreaks.length?1:0)+fresh.length+surged*2+(fresh.some(o=>o.regionId==='jing')?4:0));
  state.turn++;
  if (!notes.length) notes.push(`${state.outbreaks.length}处疫区仍在暗中生长`);
  state.lastReport={turn:state.turn,headlines:notes.slice(0,3),factions:factionNotes.slice(0,3),newRegions:fresh.length,power:state.power-before.power,scar:state.scar-before.scar,alert:state.alert-before.alert};
  state.log.unshift({turn:state.turn,category:'epidemic',title:'旬末疫报',text:notes.slice(0,3).join('；')+'。',effect:`新染疫 ${fresh.length} 地 · 疫势 ${state.lastReport.power>=0?'+':''}${state.lastReport.power} · 疫痕 +${state.lastReport.scar} · 朝警 ${state.lastReport.alert>=0?'+':''}${state.lastReport.alert}`,regionIds:fresh.map(o=>o.regionId)});
  state.log=state.log.slice(0,120);
  return state.lastReport;
}
export function loadGame() {
  try { const s=JSON.parse(localStorage.getItem(SAVE_KEY)); return s?.version===1&&Array.isArray(s.outbreaks)?s:null; } catch { return null; }
}
export function saveGame(state) { localStorage.setItem(SAVE_KEY,JSON.stringify(state)); }
