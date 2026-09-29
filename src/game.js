import { diseaseSkills, diseases, events, factions, macroRegions, poolEvents, regions, roads, waterways } from './data.js';

export const SAVE_KEY = 'yi-save-v01';
export const SAVE_SCHEMA_VERSION = 2;
export const activeAbilities = [
  {id:'follow_column',diseaseId:'cold_plague',skill:'cold_roads_1',name:'逐队',cost:3,route:'road',text:'选定官道，本旬追随迁徙人流。'},
  {id:'hidden_cold',diseaseId:'cold_plague',skill:'cold_silent_1',name:'匿寒',cost:2,text:'本旬更难被察觉，仍维持本地增长。'},
  {id:'close_streets',diseaseId:'black_blight',skill:'black_city_1',name:'闭街成灶',cost:3,text:'牺牲外溢，强化城中增长并引起察觉。'},
  {id:'drive_crowd',diseaseId:'black_blight',skill:'black_fear_1',name:'驱众',cost:3,text:'惊散人群，破坏秩序并提高外溢。'},
  {id:'follow_river',diseaseId:'water_woe',skill:'water_river_1',name:'顺流',cost:3,route:'water',text:'选定水路，本旬提高该方向外溢机会。'},
  {id:'tainted_well',diseaseId:'water_woe',skill:'water_disaster_1',name:'污井',cost:4,text:'留下两旬水患，助长水殇与水路传播。'},
  {id:'sealed_house',diseaseId:'red_pox',skill:'red_entry_1',name:'闭门成灶',cost:3,text:'封闭之地减少外流，却使共居传播加快。'},
  {id:'show_scars',diseaseId:'red_pox',skill:'red_scar_1',name:'示疮',cost:3,text:'制造惊避迁徙，也更快传入京师耳目。'}
];
const clamp = (n, a=0, b=100) => Math.max(a, Math.min(b, n));
const byId = id => regions.find(r => r.id === id);
const disease = id => diseases.find(d => d.id === id);
const ensureEvolution = state => {
  state.diseaseXP ||= {};
  state.diseaseSkills ||= {};
  state.diseaseBranches ||= {};
  return state;
};
const ensureClock = state => {
  if (!Number.isInteger(state.dayInTurn)) state.dayInTurn=0;
  if (![1,2,4].includes(state.timeSpeed)) state.timeSpeed=1;
  if (typeof state.paused!=='boolean') state.paused=false;
  return state;
};
export const hasDiseaseSkill = (state,diseaseId,skillId) => (ensureEvolution(state).diseaseSkills[diseaseId]||[]).includes(skillId);
export const diseaseProgress = (state,diseaseId) => {
  ensureEvolution(state);
  return {xp:state.diseaseXP[diseaseId]||0,branch:state.diseaseBranches[diseaseId]||null,skills:[...(state.diseaseSkills[diseaseId]||[])]};
};
const skillNode = (diseaseId,skillId) => {
  const tree=diseaseSkills[diseaseId];
  for(const branch of tree?.branches||[]) {
    const node=branch.nodes.find(n=>n.id===skillId);
    if(node) return {branch,node};
  }
  return null;
};
export function canUnlockDiseaseSkill(state,diseaseId,skillId){
  ensureEvolution(state);
  const found=skillNode(diseaseId,skillId); if(!found) return '未找到此疫路';
  const {branch,node}=found, progress=diseaseProgress(state,diseaseId);
  if(progress.skills.includes(skillId)) return '此疫性已掌握';
  if(progress.branch && progress.branch!==branch.id) return '此世此疫已择另一条疫路';
  if(progress.xp<node.xp) return `疫历需达到 ${node.xp}`;
  if(node.tier>1 && !branch.nodes.filter(n=>n.tier<node.tier).every(n=>progress.skills.includes(n.id))) return '需先掌握上一阶疫性';
  return '';
}
export function unlockDiseaseSkill(state,diseaseId,skillId){
  const error=canUnlockDiseaseSkill(state,diseaseId,skillId); if(error) return error;
  ensureEvolution(state);
  const {branch,node}=skillNode(diseaseId,skillId);
  state.diseaseBranches[diseaseId] ||= branch.id;
  state.diseaseSkills[diseaseId] ||= [];
  state.diseaseSkills[diseaseId].push(node.id);
  const d=disease(diseaseId);
  state.log?.unshift({turn:state.turn,category:'epidemic',title:`${d.name} · ${node.name}`,text:`${d.name}在这一世里生出了新的疫性。`,effect:node.desc,regionIds:state.outbreaks.filter(o=>o.diseaseId===diseaseId).map(o=>o.regionId).slice(0,3)});
  return '';
}
const gainDiseaseXP=(state,diseaseId,amount=1)=>{
  ensureEvolution(state);
  state.diseaseXP[diseaseId]=(state.diseaseXP[diseaseId]||0)+amount;
};
const hash = value => { let h=2166136261; for (const c of value) h=Math.imul(h ^ c.charCodeAt(0),16777619); return (h >>> 0) / 4294967295; };
const emptyIntel = () => ({reportedInfected:0,centralKnownInfected:0,reliability:100,delay:1,source:'official',updatedTurn:0,pendingReportedInfected:0});
export function ensureIntel(state) {
  state.intel ||= {};
  for (const r of regions) state.intel[r.id]={...emptyIntel(),...state.intel[r.id]};
  return state.intel;
}
const trueInfected = (state,id) => regionOutbreaks(state,id).reduce((n,o)=>n+o.infected,0);
export function updateIntel(state) {
  const intel=ensureIntel(state), nextTurn=state.turn+1;
  const worst=regions.reduce((best,r)=>trueInfected(state,r.id)>trueInfected(state,best.id)?r:best,regions[0]);
  const chancellorTarget=state.factionActions?.chancellor?.status==='压住奏折'?worst.id:null;
  const suppressEvent=events.find(e=>e.id==='suppress'&&e.turn<=nextTurn&&nextTurn<e.turn+e.duration);
  for (const r of regions) {
    const item=intel[r.id], real=trueInfected(state,r.id), awareness=Math.max(0,...regionOutbreaks(state,r.id).map(o=>o.localAwareness));
    const suppressed=r.id===chancellorTarget||suppressEvent?.regionIds.includes(r.id);
    const stats=regionStats(state,r.id);
    const ratio=clamp(.25+awareness*.006-stats.governance*.001+(stats.order<30?.1:0),.08,.95);
    const jitter=.9+hash(`report|${state.seed}|${nextTurn}|${r.id}`)*.2;
    const previous=item.pendingReportedInfected;
    item.centralKnownInfected=Math.max(0,Math.round((suppressed?previous*.35:previous)||0));
    item.reportedInfected=real?Math.max(1,Math.round(real*ratio*jitter)):0;
    item.pendingReportedInfected=item.reportedInfected;
    item.reliability=real?Math.round(clamp(100-Math.abs(item.reportedInfected-real)/real*100)):100;
    item.source='official'; item.updatedTurn=nextTurn;
    if (real&&(state.activeEffects||[]).some(e=>e.id==='show_scars'&&e.regionId===r.id&&e.expiresTurn>=state.turn)) {
      item.centralKnownInfected=Math.max(item.centralKnownInfected,Math.round(real*.6));item.source='rumor';
    }
  }
  if ((state.poolEvents||[]).some(e=>e.pid==='pool_report'&&e.turn===nextTurn)) {
    const item=intel[worst.id], real=trueInfected(state,worst.id);
    if (real) {item.centralKnownInfected=Math.max(item.centralKnownInfected,Math.round(real*.9));item.source='secret';}
  }
  if (trueInfected(state,worst.id)) {
    const item=intel[worst.id];
    state.log.unshift({turn:nextTurn,category:'politics',title:`${worst.name}疫报`,text:`地方奏：病者${item.reportedInfected}人；京师所知${item.centralKnownInfected}人。`,effect:`疫所见：实约${trueInfected(state,worst.id)}人 · 奏报${item.reliability<35?'严重失真':item.reliability<70?'明显失真':'大致可信'}`,regionIds:[worst.id]});
  }
}
export const periodName = turn => {
  const m=7+Math.floor((turn+2)/3), year=23+Math.floor(m/12), month=m%12+1;
  return `景和${year}年 · ${month}月${['上旬','中旬','下旬'][(turn+2)%3]}`;
};
export const dateName = (turn,dayInTurn=0) => {
  const m=7+Math.floor((turn+2)/3), year=23+Math.floor(m/12), month=m%12+1;
  const day=((turn+2)%3)*10+1+Math.max(0,Math.min(9,dayInTurn));
  return `景和${year}年 · ${month}月${day}日`;
};
export const stageName = scar => scar>=110?'乱世':scar>=75?'蚀国':scar>=45?'大疫':scar>=20?'成势':'初临';
export const alertName = alert => alert>=80?'国难':alert>=60?'严防':alert>=40?'戒备':alert>=20?'察觉':'无知';
export const dropLimit = scar => scar>=75?4:scar>=45?3:scar>=20?2:1;
export const dropCost = state => [0,12,18,24][state.drops] ?? Infinity;
export const activeEvents = (state, regionId) => [...events, ...(state.poolEvents||[])].filter(e => e.turn<=state.turn && state.turn<e.turn+e.duration && (!regionId || e.regionIds.includes(regionId)));
export const regionOutbreaks = (state, regionId) => state.outbreaks.filter(o => o.regionId===regionId);
export const regionStats = (state, regionId) => {
  const r=byId(regionId), active=activeEvents(state,regionId);
  const court=state.factionActions||{}, strict=court.emperor?.status==='圣心震怒', relief=court.crown_prince?.status==='分区赈济';
  const effects=(state.activeEffects||[]).filter(e=>e.regionId===regionId&&e.expiresTurn>=state.turn);
  const extraMobility=(strict?-8:0)+(court.people?.status==='自发避疫'?-9:court.people?.status==='闻风迁徙'?5:0)+(relief&&['nan_he','chang_ping'].includes(regionId)?-12:0)+(court.gentry?.status==='闭庄逐客'&&['lin_he','qing_xi'].includes(regionId)?12:0)+(effects.some(e=>e.id==='drive_crowd')?20:0)+(effects.some(e=>e.id==='show_scars')?12:0);
  const extraGovernance=(relief&&['nan_he','chang_ping'].includes(regionId)?10:0)+(court.chancellor?.status==='保全漕运'&&['chang_ping','xi_du','nan_du'].includes(regionId)?10:0);
  const local=state.outbreaks?.filter(o=>o.regionId===regionId)||[];
  const drift=state.regionDrift?.[regionId]||{};
  let plagueMobility=0, plagueOrder=0, plagueGovernance=0;
  for(const o of local){
    if(o.diseaseId==='livestock_plague'){
      if(hasDiseaseSkill(state,o.diseaseId,'livestock_draft_3')&&o.infected>=180){plagueMobility-=8;plagueGovernance-=4;}
      if(hasDiseaseSkill(state,o.diseaseId,'livestock_herd_2')&&o.infected>=140) plagueOrder-=6;
      if(hasDiseaseSkill(state,o.diseaseId,'livestock_herd_3')&&r.disaster>=60){plagueOrder-=5;plagueGovernance-=4;}
    }
    if(o.diseaseId==='avian_plague'&&hasDiseaseSkill(state,o.diseaseId,'avian_yard_3')&&o.localAwareness>=40){plagueMobility+=5;plagueOrder-=4;}
    if(o.diseaseId==='blood_plague'&&hasDiseaseSkill(state,o.diseaseId,'blood_frenzy_3')&&o.localAwareness>=50) plagueOrder-=5;
    if(o.diseaseId==='corpse_plague'&&hasDiseaseSkill(state,o.diseaseId,'corpse_pile_2')&&o.infected>=300){plagueOrder-=9;plagueGovernance-=7;}
  }
  return { ...r, mobility:clamp(r.mobility+active.reduce((n,e)=>n+(e.mobility||0),0)+extraMobility+plagueMobility), disaster:clamp(r.disaster+active.reduce((n,e)=>n+(e.disaster||0),0)+(effects.some(e=>e.id==='tainted_well')?15:0)), order:clamp(r.order+active.reduce((n,e)=>n+(e.order||0),0)+(court.gentry?.status==='囤粮待价'&&regionId==='lin_he'?-5:0)+plagueOrder+(drift.order||0)), governance:clamp(r.governance+active.reduce((n,e)=>n+(e.governance||0),0)+extraGovernance+plagueGovernance+(drift.governance||0)) };
};
export const macroRegionOutbreaks = (state, macroId) => {
  const macro=macroRegions.find(r=>r.id===macroId);
  return macro ? (state.outbreaks||[]).filter(o=>macro.memberIds.includes(o.regionId)) : [];
};
export const macroRegionEvents = (state, macroId) => {
  const macro=macroRegions.find(r=>r.id===macroId);
  return macro ? activeEvents(state).filter(e=>e.regionIds.some(id=>macro.memberIds.includes(id))) : [];
};
export const macroRegionStats = (state, macroId) => {
  const macro=macroRegions.find(r=>r.id===macroId);
  if(!macro) return null;
  const members=macro.memberIds.map(byId).filter(Boolean),outbreaks=macroRegionOutbreaks(state,macroId);
  const population=members.reduce((n,r)=>n+r.population,0),infected=outbreaks.reduce((n,o)=>n+Number(o.infected||0),0);
  const weighted=key=>Math.round(members.reduce((n,r)=>n+regionStats(state,r.id)[key]*r.population,0)/population);
  const activeDiseases=[...new Set(outbreaks.map(o=>o.diseaseId))].map(id=>({id,name:disease(id)?.name||id,glyph:disease(id)?.glyph||'疫',infected:outbreaks.filter(o=>o.diseaseId===id).reduce((n,o)=>n+Number(o.infected||0),0)})).sort((a,b)=>b.infected-a.infected);
  const infectedNodes=new Set(outbreaks.map(o=>o.regionId)).size,ratio=infected/(population*10000),coverage=members.length>1?infectedNodes/members.length:0;
  const severity=!infected?0:ratio>=.1||coverage>=.8?5:ratio>=.03||coverage>=.6?4:ratio>=.01||coverage>=.4?3:ratio>=.001||(infectedNodes>=2&&coverage>=.2)?2:1;
  const alertLevel=infected?Math.round(outbreaks.reduce((n,o)=>n+Number(o.localAwareness||0)*Number(o.infected||0),0)/infected):0;
  return {population,infected,activeDiseases,outbreakCount:outbreaks.length,infectedNodeCount:infectedNodes,alertLevel,order:weighted('order'),governance:weighted('governance'),disaster:weighted('disaster'),severity};
};
export function newGame(name='长夜') {
  return { version:SAVE_SCHEMA_VERSION, name:name.trim().slice(0,12)||'长夜', seed:Math.floor(Math.random()*2**31), turn:0, dayInTurn:0, timeSpeed:1, paused:false, power:0, scar:0, alert:0, drops:0, outbreaks:[], seenRegions:[], seenProvinces:[], milestones:[], diseaseXP:{}, diseaseSkills:{}, diseaseBranches:{}, activeEffects:[], abilityCooldowns:{}, crisis:null, intel:Object.fromEntries(regions.map(r=>[r.id,emptyIntel()])), log:events.filter(e=>e.turn===0).map(e=>({turn:0,category:e.category,title:e.title,text:e.text,effect:e.effect,regionIds:e.regionIds})), lastReport:null, firstDisease:null, completedTutorial:false, factionActions: Object.fromEntries(factions.map(f=>[f.id,{status:'如常',action:'朝局未动。',impact:'尚无直接影响'}])), birdHops:[] };
}
export function canDrop(state, regionId, diseaseId) {
  const d=disease(diseaseId);
  if (!byId(regionId) || !d) return '请选择疫病与地区';
  if (state.drops===0 && !d.starter) return '初临只能从四种常疫中择一';
  if ((d.unlockScar||0)>state.scar) return `疫痕达到 ${d.unlockScar} 后，${d.name}方会显现`;
  if (d.id==='corpse_plague' && !state.outbreaks.some(o=>o.infected>=500)) return '尸疫需在一处重疫之地（病者估计 500+）方可苏醒';
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
  gainDiseaseXP(state,diseaseId,1);
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
  state.power-=e.cost; o.borrowedTurn=state.turn; o.borrowedEventId=e.id; gainDiseaseXP(state,o.diseaseId,1);
  return '';
}
export const abilityForOutbreak = (state,o) => activeAbilities.find(a=>a.diseaseId===o.diseaseId&&hasDiseaseSkill(state,o.diseaseId,a.skill));
export function abilityTargets(state,o,ability) {
  if(!ability?.route)return [];
  const edges=ability.route==='water'?waterways:roads;
  return edges.filter(edge=>edge.includes(o.regionId)).map(edge=>edge.find(id=>id!==o.regionId)).filter(id=>!state.outbreaks.some(x=>x.regionId===id&&x.diseaseId===o.diseaseId));
}
export function canUseAbility(state,outbreakId,abilityId,targetId) {
  if(state.ending)return '此世已终';
  const o=state.outbreaks.find(x=>x.id===outbreakId), ability=activeAbilities.find(a=>a.id===abilityId);
  if(!o||!ability||abilityForOutbreak(state,o)?.id!==abilityId)return '尚未掌握此行动';
  if((state.abilityCooldowns?.[abilityId]||0)>state.turn)return '此行动尚在冷却';
  if(state.power<ability.cost)return `疫势不足，需 ${ability.cost}`;
  const r=regionStats(state,o.regionId);
  if(!ability.route&&targetId)return '此行动无需选择目标';
  if(ability.route&&!abilityTargets(state,o,ability).includes(targetId))return '请选择可抵达的未染疫邻地';
  if(abilityId==='follow_column'&&!activeEvents(state,o.regionId).some(e=>['population','military'].includes(e.category)))return '此地本旬没有迁徙人流';
  if(abilityId==='close_streets'&&r.population<40)return '需要人口较多的疫区';
  if(abilityId==='drive_crowd'&&o.localAwareness<40)return '地方尚未察觉此疫';
  if(abilityId==='tainted_well'&&r.disaster<60)return '此地灾患尚不够高';
  if(abilityId==='sealed_house'&&!['capital','military'].includes(r.type)&&r.governance<65)return '需要封闭或高治理地区';
  if(abilityId==='show_scars'&&o.localAwareness<50)return '地方察觉需达到 50';
  return '';
}
export function useAbility(state,outbreakId,abilityId,targetId) {
  const error=canUseAbility(state,outbreakId,abilityId,targetId);if(error)return error;
  const o=state.outbreaks.find(x=>x.id===outbreakId),ability=activeAbilities.find(a=>a.id===abilityId);
  state.power-=ability.cost;
  state.abilityCooldowns??={};state.abilityCooldowns[abilityId]=state.turn+2;
  state.activeEffects??=[];
  state.activeEffects.push({id:abilityId,outbreakId,regionId:o.regionId,targetId:targetId||null,expiresTurn:state.turn+(abilityId==='tainted_well'?1:0)});
  if(abilityId==='drive_crowd'||abilityId==='show_scars') {
    const drift=(state.regionDrift??={})[o.regionId]??={order:0,governance:0};
    drift.order=Math.max(-45,drift.order-(abilityId==='drive_crowd'?5:4));
    o.localAwareness=clamp(o.localAwareness+(abilityId==='drive_crowd'?8:5));
    state.alert=clamp(state.alert+(abilityId==='drive_crowd'?2:1));
  }
  state.log.unshift({turn:state.turn,category:'epidemic',title:`${disease(o.diseaseId).name} · ${ability.name}`,text:ability.text,effect:`疫势 -${ability.cost}${targetId?` · 目标 ${byId(targetId).name}`:''}`,regionIds:[o.regionId,...(targetId?[targetId]:[])]});
  return '';
}
const hasEffect=(state,o,id,targetId) => (state.activeEffects||[]).some(e=>e.id===id&&e.outbreakId===o.id&&e.expiresTurn>=state.turn&&(!targetId||e.targetId===targetId));
export function getCourtPerception(state) {
  const intel=ensureIntel(state), known=regions.filter(r=>intel[r.id].centralKnownInfected>0);
  const worst=known.reduce((best,r)=>!best||intel[r.id].centralKnownInfected>intel[best.id].centralKnownInfected?r:best,null);
  return {knownSickRegions:known.length,perceivedInfected:known.reduce((n,r)=>n+intel[r.id].centralKnownInfected,0),capitalKnown:intel.jing.centralKnownInfected>0,worstKnownRegion:worst?.id||null,intelConfidence:known.length?Math.round(known.reduce((n,r)=>n+intel[r.id].reliability,0)/known.length):0};
}
export function factionTurn(state) {
  const perception=getCourtPerception(state),intel=state.intel;
  const capital=perception.capitalKnown,emperorAlarm=capital||perception.perceivedInfected>=(state.crisis?500:1500)||perception.knownSickRegions>=4;
  const chancellorAlarm=perception.perceivedInfected>=500||perception.knownSickRegions>=3;
  const armyAlarm=regions.some(r=>['military','port'].includes(r.type)&&intel[r.id].centralKnownInfected>=(state.crisis?1:20));
  const princeAlarm=state.turn>=3&&regions.some(r=>intel[r.id].reportedInfected>=30||regionStats(state,r.id).disaster>=85);
  const gentryAlarm=['lin_he','qing_xi'].some(id=>intel[id].reportedInfected>=50||regionStats(state,id).order<45);
  const peopleAlarm=state.outbreaks.some(o=>o.localAwareness>=40)||activeEvents(state).some(e=>e.id==='rumor');
  const actions={
    emperor: emperorAlarm ? ['圣心震怒','下诏严查京畿，命诸州禁行。','朝警 +2；外流受阻'] : ['粉饰太平','命地方复核疫报，勿惊动京师。','朝警 -1；地方应对延缓'],
    chancellor: chancellorAlarm ? ['保全漕运','裴桢优先调医守住粮运要道。','粮运节点治理提高'] : ['压住奏折','裴桢将地方疫报留中不发。','朝警 -1；奏报失真'],
    crown_prince: princeAlarm ? ['分区赈济','景聿修命粥棚分区，灾民不再挤作一团。','洛南治理改善，人群流动下降'] : ['请开常平仓','景聿修上疏请赈，等待圣裁。','尚未形成政策'],
    army: armyAlarm ? ['封营查验','霍云令镇朔军分营驻扎，禁止擅离。','军镇对外传播减弱'] : ['照常征发','霍云仍按旧例调动镇朔军换防。','朔北人口流动持续'],
    gentry: gentryAlarm ? ['闭庄逐客','崔氏关庄，佃户沿官道散去。','庄内收紧，周边流动上升'] : ['囤粮待价','崔氏收粮闭库。','地方秩序缓慢下降'],
    people: peopleAlarm ? ['自发避疫','村社拒外人入内，市集渐稀。','人口流动下降'] : ['闻风迁徙','百姓携家投亲，流民沿官道行走。','道路传播机会增加']
  };
  state.factionActions=Object.fromEntries(Object.entries(actions).map(([id,[status,action,impact]])=>[id,{status,action,impact}]));
  state.alert=clamp(state.alert+(emperorAlarm?2:-1)+(chancellorAlarm?0:-1));
  return (emperorAlarm||armyAlarm ? ['皇帝','边军','百姓'] : ['权相','储君','百姓']).map(name=>{
    const f=factions.find(x=>x.name===name); return `${name}：${state.factionActions[f.id].action}`;
  });
}
// 事件池：脚本事件（前 10 旬）结束后，由朝警/疫痕/疫情状态驱动的天下大事，种子保证同局可复现。
function poolEligible(state,p) {
  if (state.poolEvents.some(i=>i.pid===p.id)) return false;
  if (p.minScar && state.scar<p.minScar) return false;
  if (p.minAlert && state.alert<p.minAlert) return false;
  if (p.maxAlert && state.alert>p.maxAlert) return false;
  if (p.needOutbreak && !state.outbreaks.length) return false;
  if (p.id==='pool_burn'&&getCourtPerception(state).perceivedInfected<2000) return false;
  return true;
}
function poolRegions(state,p) {
  const sick=new Set(state.outbreaks.map(o=>o.regionId));
  let cands=regions.filter(r=>{
    if (p.pick==='outbreak'||p.pick==='worst') return sick.has(r.id);
    if (p.pick==='disaster') return regionStats(state,r.id).disaster>=55;
    if (p.pick==='military') return r.type==='military';
    if (p.pick==='capital') return r.type==='capital';
    if (p.pick==='port') return r.type==='port';
    return true;
  });
  if (p.pick==='worst') cands=cands.sort((a,b)=>state.outbreaks.filter(o=>o.regionId===b.id).reduce((n,o)=>n+o.infected,0)-state.outbreaks.filter(o=>o.regionId===a.id).reduce((n,o)=>n+o.infected,0)).slice(0,3);
  return cands.sort((a,b)=>a.id<b.id?-1:1);
}
function firePoolEvents(state,notes) {
  state.poolEvents=(state.poolEvents||[]).filter(i=>i.turn+i.duration>state.turn);
  if (state.turn<9 || state.poolEvents.length>=3) return;
  if (hash(`poolgo|${state.seed}|${state.turn+1}`)>=(state.crisis?.remaining>0 ? .85 : .6)) return;
  const eligible=poolEvents.filter(p=>poolEligible(state,p));
  if (!eligible.length) return;
  const weight=p=>(p.weight||1)*(state.crisis&&['pool_riot','pool_close','pool_burn'].includes(p.id)?3:1);
  const total=eligible.reduce((n,p)=>n+weight(p),0);
  let roll=hash(`pool|${state.seed}|${state.turn+1}`)*total, picked=eligible[eligible.length-1];
  for (const p of eligible) {roll-=weight(p);if(roll<=0){picked=p;break;}}
  const cands=poolRegions(state,picked), chosen=[];
  for (let i=0;i<picked.count&&cands.length;i++) {
    const r=hash(`poolr|${state.seed}|${state.turn+1}|${picked.id}|${i}`);
    chosen.push(cands.splice(Math.floor(r*cands.length)%cands.length,1)[0].id);
  }
  if (!chosen.length) return;
  state.poolEvents.push({...picked,id:`${picked.id}-${state.turn+1}`,pid:picked.id,turn:state.turn+1,regionIds:chosen});
  notes.push(picked.title);
  if (picked.alert) state.alert=clamp(state.alert+picked.alert);
  state.log.unshift({turn:state.turn+1,category:picked.category,title:picked.title,text:picked.text,effect:picked.effect,regionIds:chosen});
}
// 终局判定（GDD §11）：易鼎 > 蚀国 > 大疫；疫源尽灭且再无力降疫 = 疫灭（败北）。
// 除疫灭外，终局最早于第 8 旬结算——病者成势、州郡蚀空都需要时间，散点小疫不算天下之变。
function detectEnding(state) {
  if (!state.outbreaks.length) return (state.drops>=dropLimit(state.scar)||state.power<dropCost(state))?{id:'yi_mie'}:null;
  const capitalOut=state.outbreaks.some(o=>o.regionId==='jing');
  if (capitalOut&&state.alert>=90&&regionStats(state,'jing').order<=30) return {id:'yi_ding'};
  const sickRegions=[...new Set(state.outbreaks.map(o=>o.regionId))].map(byId).filter(Boolean);
  const wavg=key=>sickRegions.reduce((n,r)=>n+regionStats(state,r.id)[key]*r.population,0)/sickRegions.reduce((n,r)=>n+r.population,0);
  if (state.turn>=8&&sickRegions.length>=8&&wavg('order')<=28&&wavg('governance')<=34) return {id:'shi_guo'};
  const totalPop=regions.reduce((n,r)=>n+r.population,0)*10000;
  const totalInfected=state.outbreaks.reduce((n,o)=>n+Number(o.infected||0),0);
  const macros=new Set(state.outbreaks.map(o=>macroRegions.find(m=>m.memberIds.includes(o.regionId))?.id).filter(Boolean));
  if (totalInfected>=totalPop*.06||(state.turn>=8&&sickRegions.length>=18&&macros.size>=5&&totalInfected>=totalPop*.01)) return {id:'da_yi'};
  return null;
}
const endingRank={da_yi:1,shi_guo:2,yi_ding:3};
const endingNames={da_yi:'大疫',shi_guo:'蚀国',yi_ding:'易鼎'};
function progressCrisis(state,candidate) {
  const infected=state.outbreaks.reduce((n,o)=>n+o.infected,0);
  if(!state.crisis) {
    if(!candidate)return null;
    state.crisis={candidate:candidate.id,enteredTurn:state.turn,remaining:3,peakEnding:candidate.id,peakInfected:infected};
    state.lastReport.headlines.unshift('天下入危局，尚有三旬可行事');
    state.log.unshift({turn:state.turn,category:'epidemic',title:'天下危局',text:'胜局条件已现，王朝尚有三旬应对；疫仍可行动。',effect:`候定：${endingNames[candidate.id]} · 余三旬`,regionIds:[]});
    return null;
  }
  const crisis=state.crisis;
  if(candidate&&endingRank[candidate.id]>endingRank[crisis.peakEnding])crisis.peakEnding=candidate.id;
  crisis.peakInfected=Math.max(crisis.peakInfected,infected);
  crisis.remaining--;
  if(crisis.remaining>0){state.lastReport.headlines.unshift(`危局未定 · 余${crisis.remaining}旬`);return null;}
  const peakRank=endingRank[crisis.peakEnding],currentRank=endingRank[candidate?.id]||1;
  const finalRank=infected<crisis.peakInfected*.55?Math.min(peakRank,currentRank):peakRank;
  const id=Object.keys(endingRank).find(key=>endingRank[key]===finalRank);
  state.log.unshift({turn:state.turn,category:'epidemic',title:'危机终卷',text:'三旬危局已定，史官收卷。',effect:`终局：${endingNames[id]}`,regionIds:[]});
  return {id};
}
export function getGrowthContext(state,o) {
  const r=regionStats(state,o.regionId), d=disease(o.diseaseId), active=activeEvents(state,o.regionId);
  const hidden=o.hideUntil>state.turn, borrowed=o.borrowedTurn===state.turn;
  let growthSkill=1, spreadSkill=1, visibilitySkill=1, governanceRelief=0, awarenessRelief=0, roadSkill=1, waterSkill=1, eventSkill=1;
  const has=id=>hasDiseaseSkill(state,d.id,id);
  if(d.id==='cold_plague'){
    if(has('cold_silent_1')&&o.stance==='dormant') growthSkill*=1.15;
    if(has('cold_silent_2')&&o.stance==='dormant') visibilitySkill*=.72;
    if(has('cold_silent_3')&&hidden) growthSkill*=1.12;
    if(has('cold_roads_1')) roadSkill*=1.12;
    if(has('cold_roads_2')&&(r.type==='military'||active.some(e=>e.category==='military'))) spreadSkill*=1.24;
    if(has('cold_roads_3')&&o.stance==='spread') roadSkill*=1.2;
  } else if(d.id==='black_blight'){
    if(has('black_city_1')&&r.population>=40) growthSkill*=1.16;
    if(has('black_city_2')&&['military','granary'].includes(r.type)) growthSkill*=1.22;
    if(has('black_city_3')&&o.stance==='surge') growthSkill*=1.2;
    if(has('black_fear_1')&&o.localAwareness>=40) spreadSkill*=1.15;
    if(has('black_fear_2')&&o.stance==='surge') {spreadSkill*=1.16;visibilitySkill*=1.12;}
    if(has('black_fear_3')&&o.localAwareness>=60) growthSkill*=1.16;
  } else if(d.id==='water_woe'){
    if(has('water_river_1')) waterSkill*=1.18;
    if(has('water_river_2')&&r.type==='port') growthSkill*=1.2;
    if(has('water_river_3')) waterSkill*=1.2;
    if(has('water_disaster_1')) growthSkill*=1+r.disaster/650;
    if(has('water_disaster_2')&&active.some(e=>['disaster','population'].includes(e.category))) eventSkill*=1.2;
    if(has('water_disaster_3')&&r.disaster>=70){growthSkill*=1.16;spreadSkill*=1.16;}
  } else if(d.id==='red_pox'){
    if(has('red_entry_1')&&['capital','military'].includes(r.type)) growthSkill*=1.16;
    if(has('red_entry_2')) governanceRelief=.18;
    if(has('red_entry_3')&&['capital','military'].includes(r.type)){growthSkill*=1.12;spreadSkill*=1.18;}
    if(has('red_scar_1')) awarenessRelief=.35;
    if(has('red_scar_2')&&o.localAwareness>=40) spreadSkill*=1.18;
    if(has('red_scar_3')&&o.localAwareness>=60){spreadSkill*=1.15;governanceRelief=Math.max(governanceRelief,.25);}
  } else if(d.id==='livestock_plague'){
    const farm=r.tags?.some(t=>['农田','粮仓'].includes(t))||r.type==='granary';
    if(has('livestock_draft_1')&&(farm||r.type==='military')) growthSkill*=1.2;
    if(has('livestock_draft_2')&&r.type==='military') spreadSkill*=1.2;
    if(has('livestock_herd_1')&&(farm||r.population>=40)) growthSkill*=1.16;
    if(has('livestock_herd_3')&&r.disaster>=60) growthSkill*=1.18;
  } else if(d.id==='avian_plague'){
    const yard=r.tags?.some(t=>['农田','市集','河网'].includes(t));
    if(has('avian_yard_1')&&(yard||r.population>=45)) growthSkill*=1.18;
    if(has('avian_yard_2')&&r.mobility>=65) roadSkill*=1.2;
    if(has('avian_yard_3')&&o.localAwareness>=40) spreadSkill*=1.12;
    if(has('avian_wing_2')&&(r.type==='port'||r.tags?.includes('河网'))) waterSkill*=1.2;
  } else if(d.id==='blood_plague'){
    if(has('blood_covenant_1')&&(r.type==='capital'||r.governance>=60)){visibilitySkill*=.8;growthSkill*=1.1;}
    if(has('blood_covenant_2')&&active.some(e=>['politics','society'].includes(e.category))) eventSkill*=1.2;
    if(has('blood_covenant_3')&&hidden){growthSkill*=1.18;spreadSkill*=1.12;}
    if(has('blood_frenzy_1')&&(r.type==='military'||active.some(e=>e.category==='military'))) growthSkill*=1.2;
    if(has('blood_frenzy_2')&&o.stance==='surge') spreadSkill*=1.22;
    if(has('blood_frenzy_3')&&o.localAwareness>=50){growthSkill*=1.14;awarenessRelief=.2;}
  } else if(d.id==='corpse_plague'){
    if(has('corpse_pile_1')&&(o.infected>=500||o.localAwareness>=60)) growthSkill*=1.22;
    if(has('corpse_pile_3')&&o.stance==='surge'){growthSkill*=1.2;spreadSkill*=1.2;}
    if(has('corpse_grave_1')&&r.type==='military') growthSkill*=1.2;
    if(has('corpse_grave_2')&&r.disaster>=60) spreadSkill*=1.2;
    if(has('corpse_grave_3')&&o.localAwareness>=60) awarenessRelief=.35;
  }
  if(hasEffect(state,o,'hidden_cold')){growthSkill*=1.12;visibilitySkill*=.4;}
  if(hasEffect(state,o,'close_streets')){growthSkill*=1.3;spreadSkill*=.45;visibilitySkill*=1.35;}
  if(hasEffect(state,o,'drive_crowd'))spreadSkill*=1.3;
  if(hasEffect(state,o,'tainted_well')){growthSkill*=1.15;waterSkill*=1.2;}
  if(hasEffect(state,o,'sealed_house')){growthSkill*=1.25;spreadSkill*=.5;}
  const stanceGrowth={dormant:.8,spread:1,surge:1.4}[o.stance];
  const environment=d.id==='water_woe'? .55+r.disaster/100*d.environment : d.id==='black_blight' ? .7+r.population/100 : 1;
  const gathering=(1+active.reduce((n,e)=>n+(e.spread||0),0)+(borrowed ? .45 : 0))*eventSkill;
  const control=1-(r.governance/220)*(1-governanceRelief)-(Math.max(0,o.localAwareness-40)/350)*(1-awarenessRelief);
  const increase=Math.max(1,Math.round((2+o.infected*.38)*d.growth*stanceGrowth*environment*gathering*control*growthSkill*(hidden?.85:1)));
  const positive=[...(growthSkill>1?['疫路强化或主动行动']:[]),...(environment>1?['环境助长']:[]),...(gathering>1?['大事聚集或借势']:[]),...(o.stance==='surge'?['盛发姿态']:[])];
  const negative=[...(r.governance>=60?['地方治理较高']:[]),...(o.localAwareness>40?['地方已察觉']:[]),...(hidden?['藏疫减缓增长']:[]),...(o.stance==='dormant'?['蛰伏姿态']:[])];
  return {r,d,hidden,borrowed,increase,visibilitySkill,spreadSkill,roadSkill,waterSkill,gathering,positive,negative};
}
export function getSpreadContext(state,o,targetId,routeType,growth=getGrowthContext(state,o)) {
  const {r,d,borrowed,gathering,spreadSkill,roadSkill,waterSkill}=growth;
  const target=regionStats(state,targetId);
  const flow=(r.mobility+target.mobility)/200;
  const stance={dormant:.75,spread:1.3,surge:1.1}[o.stance];
  const armyBrake=state.factionActions?.army?.status==='封营查验'&&(r.type==='military'||target.type==='military') ? .55 : 1;
  const weight=routeType==='water'?1.2:1;
  const routeSkill=routeType==='water'?waterSkill:roadSkill;
  const directed=hasEffect(state,o,routeType==='water'?'follow_river':'follow_column',targetId)?1.8:1;
  const chance=Math.min(.88,(.08+Math.min(.48,o.infected/90))*d.spread*flow*weight*stance*gathering*armyBrake*spreadSkill*routeSkill*(borrowed?1.4:1)*directed);
  const label=chance<.08?'极低':chance<.2?'低':chance<.4?'中':chance<.65?'高':'极高';
  const positive=[...(routeType==='water'?['水路']:[]),...(flow>=.6?['沿路人流']:[]),...(stance>1?['蔓延或盛发姿态']:[]),...(gathering>1?['大事聚集']:[]),...(routeSkill>1||spreadSkill>1?['疫路强化']:[]),...(borrowed?['借势']:[]),...(directed>1?['定向行动']:[])];
  const negative=[...(armyBrake<1?['军镇查验']:[]),...(flow<.4?['沿路人流稀少']:[]),...(stance<1?['蛰伏姿态']:[]),...(spreadSkill<1?['封闭街巷']:[])];
  return {chance,label,positive,negative,armyBrake};
}
export function advanceTurn(state) {
  if (state.ending) return null;
  state.seed??=20260922;
  const before={power:state.power,scar:state.scar,alert:state.alert};
  const factionNotes=factionTurn(state);
  const notes=[], fresh=[], suppressed=new Set(); let surged=0;
  const incoming=[];
  for (const diseaseId of new Set(state.outbreaks.map(o=>o.diseaseId))) gainDiseaseXP(state,diseaseId,1);
  for (const o of [...state.outbreaks]) {
    const growth=getGrowthContext(state,o);
    const {r,d,hidden,visibilitySkill,increase}=growth;
    o.infected=clamp(o.infected+increase,1,r.population*10000);
    o.localAwareness=clamp(o.localAwareness+Math.max(1,Math.round((increase/10+o.infected/160)*d.visibility*visibilitySkill*({dormant:.65,spread:1.1,surge:1.35}[o.stance])*(hidden?.6:1))));
    if (o.stance==='surge') surged++;
    state.regionDrift??={};
    const drift=state.regionDrift[o.regionId]??={order:0,governance:0};
    const popTotal=r.population*10000;
    if (o.infected>=popTotal*.5) {drift.order=Math.max(-45,drift.order-2);drift.governance=Math.max(-30,drift.governance-1);}
    else if (o.infected>=popTotal*.25) drift.order=Math.max(-45,drift.order-1);
    if (!hidden && o.localAwareness>=75 && r.governance>=62) {
      o.infected=Math.round(o.infected*.8);
      suppressed.add(o.regionId);
      if (o.infected<30) {o.__dead=true;continue;}
    }
    const neighbors=[...roads.filter(edge=>edge.includes(r.id)).map(edge=>[edge.find(id=>id!==r.id),1,'road']),...waterways.filter(edge=>edge.includes(r.id)).map(edge=>[edge.find(id=>id!==r.id),1.2,'water'])];
    for (const [targetId,weight,routeType] of neighbors) {
      if (state.outbreaks.some(x=>x.regionId===targetId&&x.diseaseId===o.diseaseId) || incoming.some(x=>x.regionId===targetId&&x.diseaseId===o.diseaseId)) continue;
      const {chance}=getSpreadContext(state,o,targetId,routeType,growth);
      if (hash(`${state.seed}|${state.turn}|${o.id}|${targetId}`)<chance) incoming.push({id:`${targetId}-${o.diseaseId}`,regionId:targetId,diseaseId:o.diseaseId,infected:1,stance:'spread',localAwareness:0,hideUntil:0,switchedTurn:-1,borrowedTurn:-1,borrowedEventId:null});
    }
    if (d.id==='avian_plague' && hasDiseaseSkill(state,d.id,'avian_wing_1')) {
      const adjacent=new Set(neighbors.map(([id])=>id));
      const secondHop=new Set();
      for(const firstId of adjacent){
        for(const edge of [...roads,...waterways]){
          if(!edge.includes(firstId)) continue;
          const candidate=edge.find(id=>id!==firstId);
          if(candidate!==r.id&&!adjacent.has(candidate)) secondHop.add(candidate);
        }
      }
      for(const targetId of secondHop){
        if(state.outbreaks.some(x=>x.regionId===targetId&&x.diseaseId===o.diseaseId)||incoming.some(x=>x.regionId===targetId&&x.diseaseId===o.diseaseId)) continue;
        const target=regionStats(state,targetId);
        let leap=.035*d.spread*((r.mobility+target.mobility)/200);
        if(hasDiseaseSkill(state,d.id,'avian_wing_2')&&(r.type==='port'||target.type==='port'||r.tags?.includes('河网')||target.tags?.includes('河网'))) leap*=1.8;
        if(hasDiseaseSkill(state,d.id,'avian_wing_3')) leap*=1.65;
        if(state.factionActions?.army?.status==='封营查验'&&!hasDiseaseSkill(state,d.id,'avian_wing_3')) leap*=.7;
        if(hash(`bird|${state.seed}|${state.turn}|${o.id}|${targetId}`)<Math.min(.28,leap)) incoming.push({id:`${targetId}-${o.diseaseId}`,regionId:targetId,diseaseId:o.diseaseId,infected:1,stance:'spread',localAwareness:0,hideUntil:0,switchedTurn:-1,borrowedTurn:-1,borrowedEventId:null,longJump:true,__from:r.id});
      }
    }
  }
  const dead=state.outbreaks.filter(o=>o.__dead);
  if (dead.length) {
    state.outbreaks=state.outbreaks.filter(o=>!o.__dead);
    for (const o of dead) notes.push(`${byId(o.regionId).name}的${disease(o.diseaseId).name}被官府扑灭`);
  }
  for (const id of suppressed) if (!dead.some(o=>o.regionId===id)) notes.push(`${byId(id).name}官府强力扑疫`);
  for (const o of incoming) {
    state.outbreaks.push(o); markRegion(state,o.regionId,notes); fresh.push(o);
    if(o.longJump&&o.diseaseId==='avian_plague'){(state.birdHops??=[]).push({turn:state.turn,from:o.__from,to:o.regionId});}
    delete o.__from;
    notes.push(`${disease(o.diseaseId).name}沿路进入${byId(o.regionId).name}`);
  }
  const newEvents=events.filter(e=>e.turn===state.turn+1);
  for (const e of newEvents) {
    notes.push(e.title);
    if (e.alert) state.alert=clamp(state.alert+e.alert);
    state.log.unshift({turn:state.turn+1,category:e.category,title:e.title,text:e.text,effect:e.effect,regionIds:e.regionIds});
  }
  firePoolEvents(state,notes);
  updateIntel(state);
  let alertGain=state.outbreaks.reduce((n,o)=>n+({dormant:0,spread:1,surge:3}[o.stance])*(o.hideUntil>state.turn?.5:1),0);
  if (state.outbreaks.some(o=>o.regionId==='jing'&&o.infected>=10)) alertGain+=2;
  if (!fresh.length && !surged) alertGain-=1;
  state.alert=clamp(state.alert+Math.round(alertGain));
  if (state.alert>=80&&getCourtPerception(state).perceivedInfected>=1000&&!state.milestones.includes('national_order')) {state.milestones.push('national_order');state.scar+=4;notes.push('朝廷颁布全国戒疫诏令');}
  const kinds=new Set(state.outbreaks.map(o=>o.diseaseId)).size;
  if (kinds>=2&&!state.milestones.includes('two_diseases')) {state.milestones.push('two_diseases');state.scar+=4;}
  if (kinds>=3&&!state.milestones.includes('three_diseases')) {state.milestones.push('three_diseases');state.scar+=6;}
  const fearMastery=state.outbreaks.filter(o=>o.stance==='surge'&&hasDiseaseSkill(state,o.diseaseId,'black_fear_3')).length;
  const scarMastery=state.outbreaks.filter(o=>o.stance==='surge'&&hasDiseaseSkill(state,o.diseaseId,'red_scar_3')).length;
  state.power+=Math.min(12,(state.outbreaks.length?1:0)+fresh.length+surged*2+fearMastery+scarMastery+(fresh.some(o=>o.regionId==='jing')?4:0));
  state.turn++;
  state.activeEffects=(state.activeEffects||[]).filter(e=>e.expiresTurn>=state.turn);
  if (!notes.length) notes.push(state.outbreaks.length?`${state.outbreaks.length}处疫区仍在暗中生长`:'天下暂无疫踪，朝野相庆');
  state.lastReport={turn:state.turn,headlines:notes.slice(0,3),factions:factionNotes.slice(0,3),newRegions:fresh.length,power:state.power-before.power,scar:state.scar-before.scar,alert:state.alert-before.alert};
  state.log.unshift({turn:state.turn,category:'epidemic',title:'旬末疫报',text:notes.slice(0,3).join('；')+'。',effect:`新染疫 ${fresh.length} 地 · 疫势 ${state.lastReport.power>=0?'+':''}${state.lastReport.power} · 疫痕 +${state.lastReport.scar} · 朝警 ${state.lastReport.alert>=0?'+':''}${state.lastReport.alert}`,regionIds:fresh.map(o=>o.regionId)});
  state.log=state.log.slice(0,120);
  const ending=detectEnding(state);
  if (ending?.id==='yi_mie') {state.ending={...ending,turn:state.turn};return null;}
  const final=progressCrisis(state,ending);
  if (final) {state.ending={...final,turn:state.turn};return null;}
  return state.lastReport;
}
export function advanceDay(state) {
  ensureClock(state);
  state.dayInTurn++;
  if (state.dayInTurn<10) return null;
  state.dayInTurn=0;
  return advanceTurn(state);
}
export function setTimeSpeed(state,speed) {
  ensureClock(state);
  if (Number(speed)===0) { state.paused=true; return; }
  if ([1,2,4].includes(Number(speed))) { state.timeSpeed=Number(speed); state.paused=false; }
}
export function loadGame() {
  try { const s=JSON.parse(localStorage.getItem(SAVE_KEY)); if(!([1,SAVE_SCHEMA_VERSION].includes(s?.version)&&Array.isArray(s.outbreaks))) return null; ensureEvolution(s); ensureClock(s); s.birdHops??=[]; s.seed??=20260922; s.poolEvents??=[]; s.regionDrift??={}; s.activeEffects??=[]; s.abilityCooldowns??={}; s.crisis??=null; ensureIntel(s); s.version=SAVE_SCHEMA_VERSION; const provinceNames={北境:'朔北',河东州:'河东郡',临河州:'临津州',南河州:'洛南'};s.seenProvinces=[...new Set((s.seenProvinces||[]).map(name=>provinceNames[name]||name))];return s; } catch { return null; }
}
export function saveGame(state) { localStorage.setItem(SAVE_KEY,JSON.stringify(state)); }
