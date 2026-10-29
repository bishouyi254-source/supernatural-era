import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,available,validate,upgrade} from '../src/engine.js';
import {newCombat} from '../src/combat.js';
import {makeSpirit} from '../src/progression.js';
import {hostState} from '../src/spirits.js';
import {taskGuide} from '../src/gameplay-guide.js';
import {beginBattleSettlement,advanceBattleSettlement,sessionForSavedGame,settlementForSavedGame} from '../src/settlement-live-adapter.js';

const fixture=(ids=[])=>{const s=newGame('结算测试',undefined,1234);s.scene='echo';s.spirits=ids.map(makeSpirit);s.combat=newCombat('echo',s);assert.ok(validate(s));return s;};
function step(s,session,a){assert.ok(available(s).includes(a),'legal '+a);const next=act(s,a);assert.ok(validate(next));return {state:next,...advanceBattleSettlement(session,s,next,a)};}
function sequence(s,actions){let session=beginBattleSettlement(s),record=null;for(const a of actions){const r=step(s,session,a);s=r.state;session=r.session;record=r.record;}return {state:s,session,record};}
const observations=['combat:observe','combat:observe','combat:observe'];

test('临时防护与合法限制不冒充通关结算',()=>{
 let s=fixture(['watch']),session=beginBattleSettlement(s);
 let r=step(s,session,'combat:ability:player-watch');assert.equal(r.record,null);assert.ok(r.state.combat);
 s=r.state;session=r.session;
 for(const a of observations){r=step(s,session,a);s=r.state;session=r.session;assert.equal(r.record,null);}
 r=step(s,session,'combat:restrict');assert.equal(r.record,null);assert.ok(r.session);assert.equal(r.state.phase,'限制');
});
test('合法封存记录实际收益、线索与原引擎结果，界面不写奖',()=>{
 const r=sequence(fixture(),[...observations,'combat:restrict','seal']);assert.equal(r.record.outcome,'sealed');assert.equal(r.record.missionCompleted,true);
 assert.equal(r.state.outcomes.echo,'已封存');assert.deepEqual(r.state.systems.sealed,['echo']);assert.ok(r.record.rewards.some(x=>x.icon==='archive'));
 assert.ok(r.record.rewards.some(x=>x.icon==='clue'));assert.ok(!r.record.rewards.some(x=>x.name.includes('碎片')));
 const before=JSON.stringify(r.state);for(let i=0;i<20;i++)assert.ok(settlementForSavedGame(r.record,r.state));assert.equal(JSON.stringify(r.state),before);
 assert.equal(act(r.state,'seal'),r.state);assert.equal(settlementForSavedGame(r.record,r.state).actions.retry,false);
});
test('两只厉鬼独立复苏、能量、负荷和实际开发成长严格对账',()=>{
 const start=fixture(['watch','shadow']);const r=sequence(start,['combat:ability:player-watch',...observations,'combat:restrict','seal']);
 assert.equal(r.record.cost.energy.before,start.energy);assert.equal(r.record.cost.energy.after,r.state.energy);
 assert.equal(r.record.cost.burden.before,hostState(start).effectiveBurden);assert.equal(r.record.cost.burden.after,hostState(r.state).effectiveBurden);
 assert.equal(r.record.cost.ghosts.length,2);r.record.cost.ghosts.forEach((g,i)=>{assert.equal(g.before,start.spirits[i].revivalProgress);assert.equal(g.after,r.state.spirits[i].revivalProgress);});
 assert.notEqual(r.record.cost.ghosts[0].after-r.record.cost.ghosts[0].before,r.record.cost.ghosts[1].after-r.record.cost.ghosts[1].before);
 assert.equal(r.record.abilitiesUsed.length,1);assert.ok(r.record.rewards.some(x=>x.name==='值班鬼开发度'||x.quantity==='+3'));
});
test('重复能力调用保留实际次数，援助不是玩家驾驭技能',()=>{
 let start=fixture(['watch']);start.systems.aids.shadow={remaining:2,used:0};
 const r=sequence(start,['combat:ability:player-watch','combat:observe','combat:ability:player-watch','combat:aid:shadow','combat:retreat']);
 assert.equal(r.record.abilitiesUsed.length,2);assert.equal(new Set(r.record.abilitiesUsed).size,1);assert.equal(r.record.rewards.filter(x=>x.icon==='growth').length,1);
 assert.equal(r.state.spirits.length,1);assert.ok(r.record.log.some(x=>x.text.includes('援助')));
});
test('撤离空收益、空逐鬼列表、普通人无伪技能',()=>{
 const r=sequence(fixture(),['combat:retreat']);assert.equal(r.record.outcome,'escaped');assert.equal(r.record.missionCompleted,false);
 assert.deepEqual(r.record.rewards,[]);assert.deepEqual(r.record.cost.ghosts,[]);assert.deepEqual(r.record.abilitiesUsed,[]);
});
test('失败仅在死亡提交后结算，死亡待定保留真实反应窗口',()=>{
 let start=fixture();start.life=1;start.combat.snapshot.life=1;start.systems.items.barrier=0;
 let r={state:start,session:beginBattleSettlement(start)};for(let i=0;i<8&&r.state.systems.death==='alive';i++)r=step(r.state,r.session,'combat:risk');assert.equal(r.state.systems.death,'pending');assert.equal(r.record,null);assert.ok(r.session);
 r=step(r.state,r.session,'death:commit');assert.equal(r.record.outcome,'failed');assert.equal(r.state.systems.death,'committed');assert.equal(r.record.missionCompleted,false);assert.equal(settlementForSavedGame(r.record,r.state).actions.retry,false);
});
test('已有反应资源成功拦截致死后，结果是紧急撤离',()=>{
 let s=fixture();s.life=1;s.combat.snapshot.life=1;let r={state:s,session:beginBattleSettlement(s)};for(let i=0;i<8&&r.state.systems.death==='alive';i++)r=step(r.state,r.session,'combat:risk');r=step(r.state,r.session,'reaction:item');
 assert.equal(r.record.outcome,'escaped');assert.equal(r.state.systems.death,'alive');assert.equal(r.state.systems.items.barrier,1);
});
test('战斗中及限制后刷新保持整个会话起点和代价',()=>{
 let s=fixture(['watch']),session=beginBattleSettlement(s);let r=step(s,session,'combat:ability:player-watch');
 s=upgrade(JSON.parse(JSON.stringify(r.state)));session=JSON.parse(JSON.stringify(r.session));assert.ok(sessionForSavedGame(session,s));
 for(const a of [...observations,'combat:restrict']){r=step(s,session,a);s=r.state;session=r.session;}
 s=upgrade(JSON.parse(JSON.stringify(s)));session=JSON.parse(JSON.stringify(session));assert.ok(sessionForSavedGame(session,s));r=step(s,session,'seal');
 assert.equal(r.record.cost.energy.before,3);assert.equal(r.record.abilitiesUsed.length,1);assert.ok(settlementForSavedGame(JSON.parse(JSON.stringify(r.record)),upgrade(JSON.parse(JSON.stringify(r.state)))));
});
test('同seed同tick不同存档与回滚会话拒绝串档',()=>{
 const start=fixture(),r=sequence(start,['combat:retreat']);const other=structuredClone(r.state);other.name='另一角色';assert.equal(settlementForSavedGame(r.record,other),null);
 const altered=structuredClone(start);altered.energy=2;assert.equal(sessionForSavedGame(beginBattleSettlement(start),altered),null);
 assert.equal(advanceBattleSettlement(beginBattleSettlement(start),altered,act(altered,'combat:retreat'),'combat:retreat').record,null);
 assert.equal(settlementForSavedGame({...r.record,sourceAction:'seal'},r.state),null);
});
test('旧存档缺少UI字段照常升级，载入中途战斗明确标记记录范围',()=>{
 const s=upgrade(JSON.parse(JSON.stringify(fixture())));assert.ok(validate(s));const session=beginBattleSettlement(s,{resumed:true});const r=step(s,session,'combat:retreat');
 assert.ok(r.record.log.some(x=>x.stage==='记录范围'));assert.equal(r.record.cost.energy.before,s.energy);
});
test('重试资格由当前引擎重新计算，资格变化使旧结算失效',()=>{
 const locked=sequence(fixture(),['combat:retreat']);assert.equal(settlementForSavedGame(locked.record,locked.state).actions.retry,false);
 let s=newGame('真实资格');for(let i=0;i<25&&!s.investigation.resolution;i++)s=act(s,taskGuide(s).recommended);
 assert.ok(available(s).includes('enter:echo'));s=act(s,'enter:echo');s=act(s,'combat:start');const r=sequence(s,['combat:retreat']);
 assert.equal(settlementForSavedGame(r.record,r.state).actions.retry,true);
 assert.equal(settlementForSavedGame(r.record,act(r.state,'rest')),null);
});
test('不合法行动不累积计数、不推进、不写结算',()=>{
 const s=fixture(),session=beginBattleSettlement(s),n=act(s,'combat:ability:player-watch');assert.equal(n,s);
 const r=advanceBattleSettlement(session,s,n,'combat:ability:player-watch');assert.equal(r.session,session);assert.equal(r.record,null);
});
test('自愿驾驭与有限援助是目标处置，不冒充合法关押',()=>{
 for(const action of ['capture','aid']){
  const r=sequence(fixture(),[...observations,'combat:restrict',action]);assert.equal(r.record.outcome,'objective');assert.equal(r.record.missionCompleted,true);
  assert.equal(r.record.sourceAction,action);assert.equal(r.state.systems.sealed.includes('echo'),false);
  if(action==='capture'){assert.equal(r.state.spirits.length,1);assert.ok(r.record.rewards.some(x=>x.kind==='实际驾驭'));assert.equal(r.record.cost.burden.after,hostState(r.state).effectiveBurden);}
  else{assert.equal(r.state.spirits.length,0);assert.equal(r.state.systems.aids.echo.remaining,2);assert.equal(r.record.rewards.some(x=>x.kind==='实际驾驭'),false);}
 }
});
test('开始战斗的自然复苏结算也包含在原始起点对账内',()=>{
 const before=fixture(['watch']);before.combat=null;const started=act(before,'combat:start');const session=beginBattleSettlement(started,{before});
 assert.equal(session.baseline.ghosts[0].revival,before.spirits[0].revivalProgress);assert.equal(session.startedAt,before.tick);
 const r=step(started,session,'combat:retreat');assert.equal(r.record.cost.ghosts[0].after,r.state.spirits[0].revivalProgress);
});
