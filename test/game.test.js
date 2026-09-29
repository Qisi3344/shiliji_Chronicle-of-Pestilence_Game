import assert from 'node:assert/strict';
import { diseases, events, macroRegions, regions } from '../src/data.js';
import { SAVE_KEY, SAVE_SCHEMA_VERSION, advanceDay, advanceTurn, borrowEvent, canDrop, canUnlockDiseaseSkill, changeStance, dateName, diseaseProgress, dropDisease, dropLimit, getGrowthContext, getSpreadContext, hasDiseaseSkill, hideDisease, loadGame, macroRegionEvents, macroRegionOutbreaks, macroRegionStats, newGame, periodName, regionStats, setTimeSpeed, unlockDiseaseSkill, updateIntel } from '../src/game.js';

assert.equal(diseases.length,8);
assert.deepEqual(macroRegions.map(r=>r.name),['京畿','朔北','河东郡','临津州','洛南','东海州']);
const assigned=macroRegions.flatMap(r=>r.memberIds);
assert.equal(assigned.length,25);
assert.equal(new Set(assigned).size,25);
assert.deepEqual([...assigned].sort(),regions.map(r=>r.id).sort());
globalThis.localStorage={getItem:key=>key===SAVE_KEY?JSON.stringify({...newGame('旧档'),seenProvinces:['北境','河东州','临河州','南河州']}):null};
assert.deepEqual(loadGame().seenProvinces,['朔北','河东郡','临津州','洛南']);
delete globalThis.localStorage;

// v0.6：解释层使用结算函数同一份上下文；军镇封控和水路疫性都能反映在原因中。
const feedback=newGame('缘由');
dropDisease(feedback,'lin_he','water_woe');
feedback.outbreaks[0].infected=100;
const waterBase=getSpreadContext(feedback,feedback.outbreaks[0],'qing_xi','water');
feedback.diseaseSkills.water_woe=['water_river_1'];
const waterBoost=getSpreadContext(feedback,feedback.outbreaks[0],'qing_xi','water');
assert.ok(waterBoost.chance>waterBase.chance);
assert.ok(waterBoost.positive.includes('疫路强化'));
assert.ok(getGrowthContext(feedback,feedback.outbreaks[0]).increase>0);
const armyFeedback=newGame('军镇');dropDisease(armyFeedback,'bei_an','cold_plague');
armyFeedback.alert=40;armyFeedback.outbreaks[0].infected=100;
const blocked=getSpreadContext(armyFeedback,armyFeedback.outbreaks[0],'bei_zhen','road');
armyFeedback.alert=39;
assert.ok(blocked.chance<getSpreadContext(armyFeedback,armyFeedback.outbreaks[0],'bei_zhen','road').chance);
assert.ok(blocked.negative.includes('军镇查验'));

const game=newGame('长夜');
game.seed=123;
assert.equal(periodName(0),'景和23年 · 8月下旬');
assert.equal(dropDisease(game,'he_dong','cold_plague'),'');
assert.equal(game.power,0);
assert.equal(game.outbreaks[0].infected,1);
const hedong=macroRegionStats(game,'hedong');
assert.equal(hedong.infected,1);
assert.equal(hedong.population,118);
assert.equal(hedong.activeDiseases[0].name,'寒疫');
assert.equal(hedong.severity,1);
assert.equal(hedong.infectedNodeCount,1);
assert.equal(macroRegionOutbreaks(game,'hedong').length,1);
assert.deepEqual(macroRegionEvents(game,'hedong').map(e=>e.id),['refugees']);
assert.equal(dropDisease(game,'he_dong','black_blight').includes('疫痕'),true);
assert.equal(changeStance(game,game.outbreaks[0].id,'surge').includes('不足'),true);
const firstAlert=game.alert;
const reported=new Set(game.log.map(e=>e.title));
for(let i=0;i<15;i++) {
  const report=advanceTurn(game);
  assert.equal(report.turn,game.turn);
  assert.ok(game.power>=0 && game.scar>=0 && game.alert>=0 && game.alert<=100);
  for (const entry of game.log) reported.add(entry.title);
}
assert.ok(game.outbreaks.length>1,'epidemic should spread from the initial region');
assert.ok(game.alert>=firstAlert,'court alert should respond to a growing epidemic');
for (const e of events) assert.ok(reported.has(e.title),`${e.title} should enter dispatches`);
assert.ok(dropLimit(game.scar)>=1);
assert.equal(canDrop(game,'invalid','cold_plague'),'请选择疫病与地区');
const o=game.outbreaks[0];
game.power=20;
assert.equal(changeStance(game,o.id,'spread'),'');
assert.equal(changeStance(game,o.id,'surge'),'本旬已驭疫一次');
assert.equal(borrowEvent(game,o.id,'missing'),'此地没有可借之势');
const actions=newGame('无归');
assert.equal(dropDisease(actions,'he_dong','cold_plague'),'');
actions.power=10;
const source=actions.outbreaks[0];
assert.equal(borrowEvent(actions,source.id,'refugees'),'');
assert.equal(actions.power,6);
assert.equal(borrowEvent(actions,source.id,'refugees'),'本旬已借势');
assert.equal(hideDisease(actions,source.id),'');
assert.equal(source.hideUntil,2);
assert.equal(actions.power,2);
assert.equal(changeStance(actions,source.id,'spread'),'');
assert.equal(actions.power,0);
actions.scar=20;actions.power=12;
assert.equal(dropDisease(actions,'nan_he','water_woe'),'');
assert.equal(actions.drops,2);
console.log(`PASS: ${game.turn} turns, ${game.outbreaks.length} outbreaks, ${reported.size} dispatch titles, scar ${game.scar}`);


const evolution=newGame('疫历测试');
assert.equal(dropDisease(evolution,'he_dong','cold_plague'),'');
assert.equal(diseaseProgress(evolution,'cold_plague').xp,1);
advanceTurn(evolution);
advanceTurn(evolution);
assert.equal(diseaseProgress(evolution,'cold_plague').xp,3);
assert.equal(canUnlockDiseaseSkill(evolution,'cold_plague','cold_roads_1'),'');
assert.equal(unlockDiseaseSkill(evolution,'cold_plague','cold_roads_1'),'');
assert.equal(hasDiseaseSkill(evolution,'cold_plague','cold_roads_1'),true);
assert.equal(diseaseProgress(evolution,'cold_plague').branch,'roads');
assert.ok(canUnlockDiseaseSkill(evolution,'cold_plague','cold_silent_1').includes('另一条疫路'));

const unlocks=newGame('异疫测试');
assert.equal(canDrop(unlocks,'he_dong','livestock_plague'),'初临只能从四种常疫中择一');
assert.equal(dropDisease(unlocks,'he_dong','cold_plague'),'');
unlocks.scar=20;unlocks.power=12;
assert.equal(canDrop(unlocks,'nan_he','avian_plague'),'');
assert.equal(dropDisease(unlocks,'nan_he','avian_plague'),'');
assert.equal(diseaseProgress(unlocks,'avian_plague').xp,1);
unlocks.scar=45;unlocks.power=30;
assert.equal(canDrop(unlocks,'jing','blood_plague'),'');
unlocks.scar=75;
assert.ok(canDrop(unlocks,'jing','corpse_plague').includes('500+'));

const clock=newGame('流时测试');
assert.equal(dateName(0,0),'景和23年 · 8月21日');
assert.equal(dateName(0,9),'景和23年 · 8月30日');
assert.equal(advanceDay(clock),null);
assert.equal(clock.dayInTurn,1);
for(let i=0;i<9;i++) advanceDay(clock);
assert.equal(clock.turn,1);
assert.equal(clock.dayInTurn,0);
assert.equal(dateName(clock.turn,clock.dayInTurn),'景和23年 · 9月1日');
setTimeSpeed(clock,4);assert.equal(clock.timeSpeed,4);assert.equal(clock.paused,false);
setTimeSpeed(clock,0);assert.equal(clock.paused,true);

// 回归：禽疫远跃 birdHops —— 初始化、远跃记录结构、旧档迁移（曾因 collectBirdHops 引用未定义 fresh 导致 ReferenceError）
{
  const g=newGame('飞羽');
  assert.deepEqual(g.birdHops,[],'newGame should init birdHops');
  g.scar=20;
  assert.equal(dropDisease(g,'he_dong','cold_plague'),'');
  g.power=30;
  assert.equal(dropDisease(g,'dong_gang','avian_plague'),'');
  g.diseaseSkills={avian_plague:['avian_wing_1','avian_wing_2','avian_wing_3']};
  let fired=false;
  for(let i=0;i<60&&!fired;i++){ advanceTurn(g); fired=g.birdHops.length>0; }
  assert.ok(fired,'avian plague should record at least one long-jump hop within 60 turns');
  const hop=g.birdHops[0];
  assert.ok(regions.some(r=>r.id===hop.from)&&regions.some(r=>r.id===hop.to),'hop from/to must be valid region ids');
  assert.equal(typeof hop.turn,'number');
  // 旧档迁移：无 birdHops 字段的存档应被补上空数组
  const oldSave={...newGame('旧档')}; delete oldSave.birdHops;
  globalThis.localStorage={getItem:key=>key===SAVE_KEY?JSON.stringify(oldSave):null};
  assert.deepEqual(loadGame().birdHops,[],'old saves should migrate birdHops to []');
  delete globalThis.localStorage;
}
console.log('birdHops regression: hop recorded, migration ok');

// v0.5：per-run 种子 —— 同种子两局逐旬完全一致，不同种子走出不同轨迹。
const seedA=newGame('甲'),seedB=newGame('乙'),seedC=newGame('丙');
for(const g of [seedA,seedB,seedC]){g.seed=g===seedC?778:777;dropDisease(g,'he_dong','cold_plague');}
for(let i=0;i<8;i++){advanceTurn(seedA);advanceTurn(seedB);advanceTurn(seedC);}
assert.deepEqual(seedA.outbreaks.map(o=>[o.regionId,o.infected,Math.round(o.localAwareness)]),seedB.outbreaks.map(o=>[o.regionId,o.infected,Math.round(o.localAwareness)]));
assert.notDeepEqual(seedA.outbreaks.map(o=>[o.regionId,o.infected]),seedC.outbreaks.map(o=>[o.regionId,o.infected]));

// v0.5：官府扑疫 —— 高察觉 + 高治理之地，疫势被持续压制。
const sup=newGame('扑疫'),ctrl=newGame('对照');
for(const g of [sup,ctrl]){g.seed=42;dropDisease(g,'qing_xi','black_blight');g.outbreaks[0].infected=5000;g.outbreaks[0].stance='surge';}
sup.outbreaks[0].localAwareness=85;
for(let i=0;i<5;i++){advanceTurn(sup);advanceTurn(ctrl);}
assert.ok(sup.outbreaks.length&&ctrl.outbreaks.length,'neither side should be fully extinguished here');
assert.ok(sup.outbreaks[0].infected<ctrl.outbreaks[0].infected,'awareness+governance should suppress growth');

// v0.5：重疫蚀地 —— 过半人口染疫时，当地秩序开始不可逆衰退。
const dr=newGame('蚀地');
dropDisease(dr,'he_dong','cold_plague');
dr.outbreaks[0].infected=180000;
dr.outbreaks[0].stance='spread';
const orderBefore=regionStats(dr,'he_dong').order;
advanceTurn(dr);
assert.ok(regionStats(dr,'he_dong').order<orderBefore,'heavy infection should erode local order');
assert.ok(dr.regionDrift.he_dong.order<0);

// v0.5：疫灭终局 —— 疫源尽灭且再无力降疫，一世就此收卷。
const end=newGame('疫灭测试');
dropDisease(end,'qing_xi','black_blight');
end.outbreaks[0].infected=6;
end.outbreaks[0].localAwareness=85;
end.drops=4;end.scar=80;end.power=0;
assert.equal(advanceTurn(end),null);
assert.equal(end.ending.id,'yi_mie');
assert.equal(end.outbreaks.length,0);
assert.equal(advanceTurn(end),null,'ended games must not keep simulating');

// v0.5：事件池 —— 脚本事件结束后（第 10 旬起），天下大事继续发生。
const poolGame=newGame('事件池');
poolGame.seed=99;
dropDisease(poolGame,'he_dong','cold_plague');
poolGame.turn=9;poolGame.power=50;
let sawPool=false;
for(let i=0;i<14;i++){advanceTurn(poolGame);if(poolGame.poolEvents.length)sawPool=true;}
assert.ok(sawPool,'pool events should fire after scheduled events end');
assert.ok(poolGame.poolEvents.every(i=>i.pid&&i.regionIds.length),'pool instances should be region-bound');
console.log(`PASS v0.5: seed/suppression/drift/ending/pool verified, pool fired ${poolGame.poolEvents.length} active`);

// v0.6：奏报由真实疫情确定性生成；压奏只改变京师认知，密报可以纠偏。
const reportA=newGame('奏报甲'),reportB=newGame('奏报乙');
for(const g of [reportA,reportB]) {g.seed=314;dropDisease(g,'he_dong','cold_plague');g.outbreaks[0].infected=4000;g.outbreaks[0].localAwareness=55;updateIntel(g);}
assert.deepEqual(reportA.intel,reportB.intel);
const unsuppressed=structuredClone(reportA),suppressedReport=structuredClone(reportA);
unsuppressed.turn=suppressedReport.turn=0;
suppressedReport.factionActions.chancellor.status='压住奏折';
updateIntel(unsuppressed);updateIntel(suppressedReport);
assert.equal(suppressedReport.outbreaks[0].infected,unsuppressed.outbreaks[0].infected);
assert.ok(suppressedReport.intel.he_dong.centralKnownInfected<unsuppressed.intel.he_dong.centralKnownInfected);
suppressedReport.poolEvents=[{pid:'pool_report',turn:3,duration:1}];
suppressedReport.turn=2;
updateIntel(suppressedReport);
assert.ok(suppressedReport.intel.he_dong.centralKnownInfected>=3600);
assert.equal(suppressedReport.intel.he_dong.source,'secret');
assert.equal(reportA.intel.jing.centralKnownInfected,0);
const legacy=newGame('旧奏报');legacy.version=1;delete legacy.intel;
globalThis.localStorage={getItem:key=>key===SAVE_KEY?JSON.stringify(legacy):null};
assert.equal(loadGame().version,SAVE_SCHEMA_VERSION);
assert.equal(loadGame().intel.he_dong.reportedInfected,0);
delete globalThis.localStorage;
