import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, act, migrateLegacy, validate } from '../src/engine.js';
import { revivalStage, carryingStage, hostState, growthFor, settleSpirits } from '../src/spirits.js';
function pair() {
  const s = newGame();
  s.spirits = [
    { id: 'player-shadow', sourceId:'shadow', name:'背影', burden:45, revivalProgress:78, naturalRevivalRate:0, usageRevivalRate:16, suppressionRemaining:0, suppressionReceived:0, activityLevel:'正常', development:0, stability:'稳定' },
    { id: 'player-echo', sourceId:'echo', name:'回声', burden:40, revivalProgress:18, naturalRevivalRate:0, usageRevivalRate:16, suppressionRemaining:0, suppressionReceived:0, activityLevel:'正常', development:0, stability:'稳定' }
  ]; return s;
}
test('正式分段覆盖全部整数与小数，63为高风险', () => {
  const table = [[0,'沉寂'],[19,'沉寂'],[20,'轻微躁动'],[39,'轻微躁动'],[40,'活跃'],[59,'活跃'],[60,'高风险'],[63,'高风险'],[79,'高风险'],[80,'严重复苏'],[94,'严重复苏'],[95,'临界'],[99,'临界'],[100,'厉鬼复苏']];
  for (const [n,label] of table) assert.equal(revivalStage(n),label);
  assert.equal(revivalStage(19.9),'沉寂'); assert.equal(revivalStage(99.9),'临界');
  assert.throws(() => revivalStage(101)); assert.throws(() => revivalStage(NaN));
});
test('承载连续边界无空档', () => {
  for (const [n,label] of [[.5,'轻度负担'],[.505,'中度负担'],[.75,'中度负担'],[.755,'高负担'],[1,'高负担'],[1.005,'超载'],[1.25,'超载'],[1.251,'承载崩溃']]) assert.equal(carryingStage(n),label);
});
test('45+40负荷85，独立78/18复苏，不存在公共总复苏', () => {
  const s=pair(), h=hostState(s); assert.equal(h.totalBurden,85); assert.equal(h.effectiveBurden,85); assert.equal(h.carryingState,'高负担');
  assert.equal(h.hostRisk,'高'); assert.equal(s.pressure,undefined); assert.equal(h.totalRevival,undefined); assert.ok(validate(s));
});
test('使用A只增加A；休息保留全部累计进度', () => {
  const s=pair(); const used=act(s,'practice'); assert.equal(used.spirits[0].revivalProgress,94); assert.equal(used.spirits[1].revivalProgress,18);
  const rested=act(used,'rest'); assert.equal(rested.spirits[0].revivalProgress,94); assert.equal(rested.spirits[1].revivalProgress,18);
});
test('双向关系压制增长，不回退78或降低负荷', () => {
  const s=pair(); s.relations=[{spiritA:s.spirits[0].id,spiritB:s.spirits[1].id,compatibility:1,suppressionAtoB:.35,suppressionBtoA:.65,conflictAtoB:0,conflictBtoA:0,burdenSynergy:0,specialInteraction:null}];
  settleSpirits(s); assert.equal(s.spirits[0].revivalProgress,78); assert.equal(s.spirits[1].revivalProgress,18); assert.equal(hostState(s).effectiveBurden,85);
  assert.equal(growthFor(s,s.spirits[0],true),5.6); assert.ok(validate(s));
});
test('超载仅通过自然增长修正，不封顶负荷100', () => {
  const s=pair(); s.spirits[1].burden=70; s.spirits[0].naturalRevivalRate=4;
  assert.equal(hostState(s).totalBurden,115); assert.equal(growthFor(s,s.spirits[0]),5);
  s.hostCapacity=125; assert.equal(growthFor(s,s.spirits[0]),4);
});
test('紧急压制保留100，过期危机返回', () => {
  let s=pair(); s.spirits[0].revivalProgress=100; s.crisis=true;
  s=act(s,'suppress'); assert.equal(s.spirits[0].revivalProgress,100); assert.equal(s.crisis,false);
  for(let i=0;i<3;i++) s=act(s,'rest'); assert.equal(s.crisis,true); assert.ok(validate(s));
});
test('高危单鬼不会被另一个低复苏平均掩盖', () => {
  const s=pair(); s.spirits[0].revivalProgress=99; s.spirits[1].revivalProgress=1;
  assert.equal(hostState(s).hostRisk,'临界'); s.spirits[0].revivalProgress=100; settleSpirits(s); assert.equal(s.crisis,true);
});
test('旧混合字段保留记录，负荷取内容，复苏明确重建；输入不变', () => {
  const old={version:1,name:'旧档',background:'学生',seed:1,tick:0,revision:0,life:100,pressure:82,energy:3,bags:2,ward:0,scene:'hub',phase:'异常',crisis:false,ghost:{instanceId:'player-shadow',sourceId:'shadow',name:'背影'},knowledge:{},restricted:{},outcomes:{},fate:{},journal:[]};
  const copy=structuredClone(old), s=migrateLegacy(old); assert.deepEqual(old,copy); assert.equal(s.spirits[0].burden,24); assert.equal(s.spirits[0].revivalProgress,18);
  assert.equal(s.compatibility.legacyMixedPressure,82); assert.equal(s.pressure,undefined); assert.ok(validate(s));
});
test('存档拒绝无效承载、复苏和自指关系', () => {
  const s=pair(); assert.equal(validate({...s,hostCapacity:0}),false);
  s.spirits[0].revivalProgress=101; assert.equal(validate(s),false);
  s.spirits[0].revivalProgress=20; s.relations=[{spiritA:s.spirits[0].id,spiritB:s.spirits[0].id}]; assert.equal(validate(s),false);
});
