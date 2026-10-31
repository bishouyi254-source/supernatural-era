import test from 'node:test';import assert from 'node:assert/strict';
import {act,available,validate,upgrade} from '../src/engine.js';import {encounter,implant,advance,legal} from './settlement-second-helpers.mjs';
import {historyRecord} from '../src/settlement-save.js';
test('真实第二鬼全链自动保存唯一结算，进行中 JSON 载入保留完整起点',()=>{
 const l=implant(encounter({}, {callAbility:true})),s=JSON.parse(JSON.stringify(l.state));assert.ok(validate(s));assert.ok(s.settlement.active);assert.equal(s.settlement.latestId,null);
 const active=s.settlement.active,n=legal(s,'second:stabilize'),r=n.settlement.records.at(-1);assert.equal(r.encounterId,active.encounterId);assert.equal(r.resultCode,'controlled');assert.equal(r.cost.ghosts.length,2);assert.equal(r.abilitiesUsed.length,1);assert.equal(r.cost.energy.before,active.baseline.energy);assert.equal(n.settlement.active,null);
 assert.equal(act(n,'second:stabilize'),n);const copy=JSON.parse(JSON.stringify(n));assert.ok(validate(copy));assert.deepEqual(historyRecord(copy,r.id).cost,r.cost);assert.deepEqual(copy.spirits,n.spirits);assert.equal(copy.settlement.records.filter(v=>v.id===r.id).length,1);
});
test('拒绝匹配重试及取消不补造驾驭，完整账本保留到真实出口',()=>{
 const l=encounter({injured:true});for(const a of ['second:begin','second:match:mutual','second:implant'])advance(l,a);assert.equal(l.state.spirits.length,1);const id=l.state.settlement.active.encounterId,logs=l.state.settlement.active.log.length;
 for(const a of ['second:match:mutual','second:implant'])advance(l,a);assert.equal(l.state.settlement.active.encounterId,id);assert.ok(l.state.settlement.active.log.length>=logs);advance(l,'second:exit');assert.equal(l.state.settlement.active,null);const r=l.state.settlement.records.at(-1);assert.equal(r.outcome,'escaped');assert.equal(r.missionCompleted,false);assert.equal(r.rewards.some(v=>v.kind==='实际驾驭'),false);
});
test('普通封存与撤离只按合法终局归档，临时限制不算通关',()=>{
 const l=encounter();assert.equal(l.state.settlement.latestId,null);assert.ok(l.state.settlement.active);advance(l,'seal');assert.equal(l.state.settlement.records.at(-1).outcome,'sealed');assert.equal(l.state.settlement.active,null);
 let s=encounter().state;s=legal(s,'second:begin');s=legal(s,'second:exit');assert.equal(s.settlement.records.at(-1).outcome,'escaped');assert.ok(validate(s));
});
test('旧核心存档缺历史明确不可恢复，升级不修改权威资源和驾驭',()=>{
 const l=implant(encounter());advance(l,'second:stabilize');const old=structuredClone(l.state);delete old.settlement;assert.ok(validate(old));const n=upgrade(old);assert.equal(n.settlement.legacyHistory,'unavailable');assert.deepEqual(n.settlement.records,[]);assert.deepEqual(n.spirits,old.spirits);assert.equal(n.energy,old.energy);assert.ok(validate(n));
});
