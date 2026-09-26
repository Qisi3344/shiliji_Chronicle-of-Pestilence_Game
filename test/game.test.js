import assert from 'node:assert/strict';
import { diseases, events, macroRegions, regions } from '../src/data.js';
import { SAVE_KEY, advanceDay, advanceTurn, borrowEvent, canDrop, canUnlockDiseaseSkill, changeStance, dateName, diseaseProgress, dropDisease, dropLimit, hasDiseaseSkill, hideDisease, loadGame, macroRegionEvents, macroRegionOutbreaks, macroRegionStats, newGame, periodName, setTimeSpeed, unlockDiseaseSkill } from '../src/game.js';

assert.equal(diseases.length,8);
assert.deepEqual(macroRegions.map(r=>r.name),['京畿','朔北','河东郡','临津州','洛南','东海州']);
const assigned=macroRegions.flatMap(r=>r.memberIds);
assert.equal(assigned.length,25);
assert.equal(new Set(assigned).size,25);
assert.deepEqual([...assigned].sort(),regions.map(r=>r.id).sort());
globalThis.localStorage={getItem:key=>key===SAVE_KEY?JSON.stringify({...newGame('旧档'),seenProvinces:['北境','河东州','临河州','南河州']}):null};
assert.deepEqual(loadGame().seenProvinces,['朔北','河东郡','临津州','洛南']);
delete globalThis.localStorage;

const game=newGame('长夜');
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
