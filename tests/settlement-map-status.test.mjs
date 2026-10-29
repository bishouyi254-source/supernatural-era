import test from 'node:test';import assert from 'node:assert/strict';
import {available,validate,upgrade} from '../src/engine.js';
import {normalizeResult,genericResult} from '../src/encounter-outcomes.js';
import {liveRecords,openTarget} from '../src/world-map/live-adapter.js';
import {encounter,advance,implant,legal,secondEntry} from './settlement-second-helpers.mjs';
const row=s=>liveRecords(s).find(r=>r.id==='echo');
test('合法封存映射稳定 sealed，刷新/重载保持且引擎再次挑战仍禁止',()=>{
 const l=encounter();advance(l,'seal');const saved=JSON.stringify(l.state),legal=available(l.state);
 for(const s of [l.state,upgrade(JSON.parse(saved))]){assert.ok(validate(s));assert.equal(row(s).status,'已封存');assert.equal(row(s).resultCode,'sealed');assert.equal(openTarget(s,'echo'),'现场');assert.ok(!available(s).includes('enter:echo'));}
 assert.deepEqual(available(l.state),legal);assert.equal(JSON.stringify(l.state),saved);
});
test('真实限制只显示有效压制，不能标通关或获得驾驭',()=>{
 const l=encounter();assert.equal(row(l.state).status,'有效压制');assert.equal(row(l.state).resultCode,'suppressed');assert.ok(available(l.state).includes('seal'));assert.equal(l.record,null);
});
test('真实第二鬼植入显示观察中，观察后显示驾驭成功，不绕过限制',()=>{
 const l=implant(encounter());assert.equal(row(l.state).status,'失衡观察中');advance(l,'second:stabilize');assert.equal(row(l.state).status,'驾驭成功');assert.equal(row(l.state).resultCode,'controlled');assert.ok(!available(l.state).includes('enter:echo'));
});
test('真实援助目标完成保持独立 objective，有限援助不变为玩家鬼',()=>{
 const l=encounter();advance(l,'aid');assert.equal(row(l.state).status,'事件目标完成');assert.equal(genericResult(l.state,'echo'),'objective');assert.equal(l.state.spirits.length,1);assert.equal(l.state.systems.aids.echo.remaining,2);
});
test('旧字符串只在兼容边界映射，不成为新解锁依据',()=>{
 for(const [raw,code] of [['已封存','sealed'],['封存','sealed'],['紧急封存','sealed'],['已驾驭','controlled'],['已结合','controlled'],['援助联系','objective'],['已撤离','escaped'],['失败','failed']])assert.equal(normalizeResult(raw),code);
 assert.equal(normalizeResult('未知结果'),null);
});
test('取回已封存实例重新处置时显示当前限制，历史封存不冒充当前终局',()=>{
 const l=encounter();advance(l,'seal');const s=legal(l.state,'release:echo');assert.equal(row(s).status,'有效压制');assert.ok(available(s).includes('second:match:mutual'));
});
test('真实撤离不误标完成且资格仍可用；死亡提交显示失败且不能重试',()=>{
 let s=legal(secondEntry().state,'combat:start');s=legal(s,'combat:retreat');assert.ok(available(s).includes('enter:echo'));assert.ok(!['已完成','已封存'].includes(row(s).status));
 let failed=legal(secondEntry({injured:true}).state,'combat:start');while(failed.systems.death==='alive')failed=legal(failed,'combat:risk');failed=legal(failed,'death:commit');
 assert.equal(row(failed).status,'挑战失败');assert.equal(row(failed).resultCode,'failed');assert.ok(!available(failed).includes('enter:echo'));
});
