import test from 'node:test';
import assert from 'node:assert/strict';
import {act,upgrade,available,validate} from '../src/engine.js';
import {hostState} from '../src/spirits.js';
import {beginBattleSettlement,sessionForSavedGame,settlementForSavedGame,advanceBattleSettlement} from '../src/settlement-live-adapter.js';
import {encounter,implant,advance,legal} from './settlement-second-helpers.mjs';

const refresh=l=>{l.state=upgrade(JSON.parse(JSON.stringify(l.state)));l.session=JSON.parse(JSON.stringify(l.session));assert.ok(validate(l.state));assert.ok(sessionForSavedGame(l.session,l.state));};
test('完整合法第二鬼流程：匹配、植入、观察刷新均保留战斗起点，最后仅结算一次',()=>{
 const l=encounter({}, {callAbility:true}),start=structuredClone(l.baseline);
 for(const a of ['second:begin','second:match:mutual']){advance(l,a);assert.equal(l.record,null);refresh(l);}
 advance(l,'second:implant');assert.equal(l.record,null);assert.ok(l.session);assert.equal(l.state.systems.second.stage,'unstable');
 const joined=structuredClone(l.state.spirits[1]);refresh(l);advance(l,'rest');refresh(l);advance(l,'second:stabilize');
 assert.equal(l.record.outcome,'objective');assert.equal(l.record.resultLabel,'观察完成 · 暂时平衡');assert.equal(l.session,null);
 assert.equal(l.record.cost.energy.before,start.energy);assert.equal(l.record.cost.energy.after,l.state.energy);
 assert.equal(l.record.cost.burden.before,hostState(start).effectiveBurden);assert.equal(l.record.cost.burden.after,hostState(l.state).effectiveBurden);
 assert.equal(l.record.cost.ghosts.length,2);assert.equal(l.record.cost.ghosts[0].before,start.spirits[0].revivalProgress);
 assert.equal(l.record.cost.ghosts[1].before,joined.revivalProgress);assert.equal(l.record.cost.ghosts[1].origin,'acquired');
 l.record.cost.ghosts.forEach(g=>assert.equal(g.after,l.state.spirits.find(v=>v.id===g.id).revivalProgress));
 assert.equal(l.record.abilitiesUsed.length,1);assert.equal(l.record.rewards.filter(r=>r.kind==='实际驾驭').length,1);
 const saved=JSON.stringify(l.state),record=JSON.stringify(l.record);
 for(let i=0;i<5;i++){assert.ok(settlementForSavedGame(JSON.parse(record),upgrade(JSON.parse(saved))));assert.equal(act(l.state,'second:stabilize'),l.state);}
 assert.equal(JSON.stringify(l.state),saved);assert.equal(advanceBattleSettlement(null,l.state,l.state,'second:stabilize').record,null);
});
test('合法结合保留两实例和负荷，观察完成才结算实际已结合',()=>{
 const l=implant(encounter(),'combine');assert.equal(l.record,null);refresh(l);advance(l,'second:stabilize');
 assert.equal(l.record.outcome,'objective');assert.equal(l.record.secondResolution.mode,'combine');assert.equal(l.state.outcomes.echo,'已结合');
 assert.ok(l.state.systems.combinations.some(c=>c.disabledId==='player-echo'));assert.equal(l.record.cost.ghosts.length,2);
 assert.equal(l.record.cost.burden.after,52);assert.ok(l.record.target.includes('结合'));assert.ok(l.record.rewards.some(r=>r.name==='已结合'));
});
test('合法受伤导致植入拒绝，同上下文重试仍拒绝，无假驾驭或成功结算',()=>{
 const l=implant(encounter({injured:true}));assert.equal(l.state.systems.second.result,'blocked');assert.equal(l.state.spirits.length,1);assert.equal(l.record,null);
 const decisions=structuredClone(l.state.systems.decisions);refresh(l);
 advance(l,'second:match:mutual');advance(l,'second:implant');assert.deepEqual(l.state.systems.decisions,decisions);assert.equal(l.record,null);
 advance(l,'second:exit');assert.equal(l.record.outcome,'escaped');assert.equal(l.record.missionCompleted,false);
 assert.ok(l.record.log.filter(x=>x.text.includes('植入被拒')).length>=2);assert.ok(!l.record.rewards.some(r=>r.kind==='实际驾驭'));
});
test('合法取消匹配保留代价与证据，未获得第二鬼、不误完成',()=>{
 const l=encounter();advance(l,'second:begin');advance(l,'second:exit');
 assert.equal(l.record.resultLabel,'取消第二鬼方案');assert.equal(l.record.missionCompleted,false);assert.equal(l.state.spirits.length,1);
 assert.equal(l.record.cost.energy.after,l.state.energy);assert.ok(!l.record.rewards.some(r=>r.kind==='实际驾驭'));
});
test('失衡期实际补给和封存退出，记录新鬼离体前值，不伪造驾驭收益',()=>{
 const l=implant(encounter());const last=l.state.spirits[1].revivalProgress;
 refresh(l);advance(l,'chapter:supply');refresh(l);advance(l,'second:remove');
 assert.equal(l.record.outcome,'sealed');assert.equal(l.record.missionCompleted,false);assert.equal(l.record.resultLabel,'放弃驾驭 · 已封存');
 assert.equal(l.record.title,'挑战已结束');
 const g=l.record.cost.ghosts.find(g=>g.id==='player-echo');assert.equal(g.after,last);assert.equal(g.removed,true);
 assert.ok(!l.record.rewards.some(r=>r.kind==='实际驾驭'));assert.equal(l.state.spirits.length,1);
});
test('真实单向压制造成伪平衡，完成观察也不能显示挑战成功',()=>{
 const l=implant(encounter({target:'headless'}));assert.equal(l.state.systems.second.result,'dominated');refresh(l);advance(l,'second:stabilize');
 assert.equal(l.record.outcome,'suppressed');assert.equal(l.record.missionCompleted,false);assert.equal(l.record.resultLabel,'观察完成 · 伪平衡');
 assert.equal(l.record.secondResolution.balance,hostState(l.state).balanceState);
});
test('合法低相容反客为主，完成观察记录失衡而不是成功',()=>{
 let l;for(let seed=0;seed<20;seed++){const candidate=implant(encounter({first:'blood',target:'headless',seed}));if(candidate.state.systems.second.result==='takeover'){l=candidate;break;}}
 assert.ok(l);refresh(l);advance(l,'second:stabilize');assert.equal(l.record.outcome,'suppressed');assert.equal(l.record.missionCompleted,false);assert.ok(l.record.resultLabel.includes('失衡'));
});
test('合法练习增长到临界再植入导致双鬼复苏，危机退出如实保留剩余复苏',()=>{
 const l=implant(encounter({critical:true}));assert.equal(l.state.systems.second.result,'dual');assert.ok(l.state.crisis);assert.equal(l.record,null);refresh(l);
 advance(l,'abandon:player-echo');assert.equal(l.record.outcome,'suppressed');assert.equal(l.record.missionCompleted,false);assert.ok(l.state.crisis);
 assert.ok(l.record.ruleResult.includes('危机未解除'));
 assert.equal(l.record.cost.ghosts.length,2);assert.equal(l.record.cost.ghosts.find(g=>g.id==='player-echo').after,100);assert.equal(l.state.spirits[0].revivalProgress,100);
});
test('观察期间同seed/tick不同存档拒绝账本，非法重复植入不推进',()=>{
 const l=implant(encounter());const saved=JSON.stringify(l.state);assert.equal(act(l.state,'second:implant'),l.state);assert.equal(JSON.stringify(l.state),saved);
 const other=structuredClone(l.state);other.name='另一个角色';assert.equal(sessionForSavedGame(l.session,other),null);
 assert.equal(advanceBattleSettlement(l.session,other,act(other,'second:stabilize'),'second:stabilize').record,null);
 assert.ok(available(l.state).includes('second:stabilize'));
});
test('取消后按引擎资格重新进入已限制现场，新尝试仍可完整结算',()=>{
 const l=encounter();advance(l,'second:begin');advance(l,'second:exit');const previous=l.state;
 assert.equal(settlementForSavedGame(l.record,l.state).actions.retry,true);
 l.state=legal(previous,'enter:echo',l.trace);assert.equal(l.state.phase,'限制');
 l.session=beginBattleSettlement(l.state,{before:previous});l.record=null;
 implant(l);advance(l,'second:stabilize');assert.equal(l.record.outcome,'objective');assert.equal(l.record.cost.energy.before,previous.energy);
 assert.equal(l.record.cost.ghosts.length,2);assert.equal(l.record.coverageLabel,'');
});
test('旧版缺失账本的失衡存档可继续并明确范围，不能伪造已丢失起点',()=>{
 const l=implant(encounter());l.session=beginBattleSettlement(l.state,{resumed:true});
 const before=structuredClone(l.state);advance(l,'second:stabilize');assert.ok(l.record.coverageLabel.includes('本次载入'));
 assert.equal(l.record.cost.energy.before,before.energy);assert.equal(l.record.cost.ghosts.length,2);
 assert.ok(!l.record.rewards.some(r=>r.kind==='实际驾驭'));
});
