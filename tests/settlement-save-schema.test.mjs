import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validate} from '../src/engine.js';
import {encounter,implant,advance} from './settlement-second-helpers.mjs';
import {initialSettlement,attachSettlement,validSettlement,sealHistoryRecord,appendHistory,historyRecord,settlementCoreToken,SETTLEMENT_LIMITS} from '../src/settlement-save.js';

// This source snapshot comes from the complete, legal second-spirit helper:
// every gameplay action is checked with available() and validate(). Metadata-only
// clones below exercise schema/capacity; they do not claim extra player rewards.
const finished=implant(encounter());advance(finished,'second:stabilize');
assert.ok(validate(finished.state));assert.ok(finished.record);
function fixture(){
 const s=structuredClone(finished.state);s.settlement=initialSettlement(s,{id:'schema-owner'});
 const source={...structuredClone(finished.record),sourceState:settlementCoreToken(s)};
 return {s,source};
}
function stored(){const {s,source}=fixture();const r=sealHistoryRecord(source,s.settlement.ownerId,'schema-owner:1');s.settlement=appendHistory(s.settlement,r);return {s,r};}

test('结算 schema 初始化具有确定性，显式角色 ID 独立且旧存档不补造历史',()=>{
 const s=newGame('schema','学生',17);delete s.settlement;
 assert.deepEqual(initialSettlement(s),initialSettlement(s));
 assert.equal(initialSettlement(s,{id:'browser-uuid'}).ownerId,'browser-uuid');
 assert.equal(initialSettlement(s).legacyHistory,'available');
 const upgraded=attachSettlement(s);assert.equal(upgraded.settlement.legacyHistory,'unavailable');
 assert.equal(upgraded.settlement.records.length,0);assert.ok(validSettlement(s));assert.ok(validSettlement(upgraded));
 const broken={...s,settlement:null};assert.equal(attachSettlement(broken),broken);assert.equal(validSettlement(broken),false);
 const oldEmpty={...s,name:''};assert.ok(validSettlement(attachSettlement(oldEmpty)));
});

test('CoreToken 有界、排序稳定、排除历史并保留角色身份及真实字段变化',()=>{
 const {s}=fixture(),token=settlementCoreToken(s);assert.ok(token.length<60);
 const permuted=Object.fromEntries(Object.entries(s).reverse());assert.equal(settlementCoreToken(permuted),token);
 const changed=structuredClone(s);changed.settlement.records=[{unused:'x'.repeat(500000)}];changed.settlement.latestId='ignored';
 assert.equal(settlementCoreToken(changed),token);
 changed.settlement.ownerId='another-browser';assert.notEqual(settlementCoreToken(changed),token);
 changed.settlement.ownerId=s.settlement.ownerId;changed.energy=s.energy===0?1:0;assert.notEqual(settlementCoreToken(changed),token);
});

test('合法驾驭结算快照随 JSON 导出导入保留逐鬼成本、实际收益与使用次数',()=>{
 const {s,r}=stored(),before=JSON.stringify(s),imported=JSON.parse(before);
 assert.ok(validSettlement(imported));const view=historyRecord(imported,r.id);assert.ok(view);
 assert.deepEqual(view.cost,JSON.parse(JSON.stringify(finished.record.cost)));assert.deepEqual(view.rewards,finished.record.rewards);
 assert.deepEqual(view.abilitiesUsed,finished.record.abilitiesUsed);assert.equal(view.actions.retry,false);
 assert.equal(JSON.stringify(s),before);assert.deepEqual(imported.spirits,s.spirits);
 view.cost.ghosts[0].after=0;assert.equal(JSON.stringify(s),before);assert.deepEqual(imported.settlement.records[0].cost,r.cost);
});

test('重复追加与重复导入幂等，同遭遇冲突拒绝且未发放第二只鬼或奖励',()=>{
 const {s,r}=stored(),before=JSON.stringify(s);
 for(let i=0;i<5;i++){
  s.settlement=appendHistory(JSON.parse(JSON.stringify(s.settlement)),JSON.parse(JSON.stringify(r)));
  assert.ok(validSettlement(JSON.parse(JSON.stringify(s))));assert.equal(s.settlement.records.length,1);
 }
 assert.equal(JSON.stringify(s),before);
 const conflict=sealHistoryRecord({...r,ruleResult:'不同结果'},'schema-owner','schema-owner:1');
 assert.throws(()=>appendHistory(s.settlement,conflict),/冲突/);assert.equal(JSON.stringify(s),before);
});

test('跨角色、跨存档、错误源种子或未来行动记录拒绝读取',()=>{
 const {s,r}=stored();
 for(const change of [x=>x.name='其他角色',x=>x.background='学生',x=>x.seed++,x=>x.settlement.ownerId='other-owner',x=>x.tick=r.sourceTick-1]){
  const other=structuredClone(s);change(other);assert.equal(validSettlement(other),false);assert.equal(historyRecord(other,r.id),null);
 }
 const other=initialSettlement(s,{id:'different-browser'});assert.throws(()=>appendHistory(other,r),/绑定/);
 const badSeed=sealHistoryRecord({...r,sourceSeed:r.sourceSeed+1},'schema-owner','schema-owner:2');assert.throws(()=>appendHistory(s.settlement,badSeed),/绑定/);
});

test('历史结果、收益、逐鬼复苏、次数和日志任一损坏均检出',()=>{
 const {s}=stored();
 for(const change of [r=>r.cost.energy.after++,r=>r.cost.ghosts[0].after+=0.5,r=>r.rewards[0].quantity='虚构',r=>r.abilitiesUsed.push('虚构技能'),r=>r.log[0].text='篡改',r=>r.outcome='failed',r=>r.sourceAction='seal',r=>r.checksum='0000000000000000']){
  const bad=structuredClone(s);change(bad.settlement.records[0]);assert.equal(validSettlement(bad),false);
 }
 const duplicate=structuredClone(s);duplicate.settlement.records.push(structuredClone(duplicate.settlement.records[0]));assert.equal(validSettlement(duplicate),false);
});

test('已进行合法匹配或失衡观察存档仅保存 active，不成为已完成历史',()=>{
 const live=implant(encounter()),s=structuredClone(live.state);s.settlement=initialSettlement(s,{id:'active-owner'});
 s.settlement.nextEncounter=2;
 s.settlement.active={...structuredClone(live.session),id:'active-owner:1',encounterId:'active-owner:1',ownerId:'active-owner'};
 s.settlement.active.binding=settlementCoreToken(s);
 assert.ok(validSettlement(s));const restored=JSON.parse(JSON.stringify(s));assert.ok(validSettlement(restored));
 assert.equal(restored.settlement.records.length,0);assert.equal(historyRecord(restored,'active-owner:1'),null);
 assert.deepEqual(restored.settlement.active.baseline,s.settlement.active.baseline);
 assert.deepEqual(restored.settlement.active.ghostLedger,s.settlement.active.ghostLedger);
 const old=structuredClone(s);old.energy=s.energy===0?1:0;assert.equal(validSettlement(old),false);
 for(const change of [a=>a.ownerId='other',a=>a.encounterId='other:1',a=>a.lastTick--,a=>a.baseline.energy=9,a=>a.ghostLedger[0].revival=101,a=>a.used=null]){
  const bad=structuredClone(s);change(bad.settlement.active);assert.equal(validSettlement(bad),false);
 }
 const huge=structuredClone(s);huge.settlement.active.log=Array.from({length:200},()=>({stage:'行动',text:'甲'.repeat(1900)}));assert.equal(validSettlement(huge),false);
});

test('32 条历史数量上限裁剪最早记录，保留最新和清晰裁剪计数',()=>{
 const {s,source}=fixture();let meta=s.settlement;
 for(let seq=1;seq<=40;seq++)meta=appendHistory(meta,sealHistoryRecord(source,meta.ownerId,meta.ownerId+':'+seq));
 assert.equal(meta.records.length,SETTLEMENT_LIMITS.records);assert.equal(meta.records[0].id,'schema-owner:9');
 assert.equal(meta.latestId,'schema-owner:40');assert.equal(meta.nextEncounter,41);assert.equal(meta.prunedCount,8);
 s.settlement=meta;assert.ok(validSettlement(s));
});

test('256 KiB 历史总容量有限，超大单条和损坏容量拒绝',()=>{
 const {s,source}=fixture();let meta=s.settlement;
 const bulky={...source,log:Array.from({length:60},()=>({stage:'容量测试',text:'甲'.repeat(900)}))};
 for(let seq=1;seq<=8;seq++)meta=appendHistory(meta,sealHistoryRecord(bulky,meta.ownerId,meta.ownerId+':'+seq));
 assert.ok(Buffer.byteLength(JSON.stringify(meta.records))<=SETTLEMENT_LIMITS.historyBytes);
 assert.ok(meta.records.length<8);assert.equal(meta.latestId,'schema-owner:8');assert.ok(meta.prunedCount>0);
 s.settlement=meta;assert.ok(validSettlement(s));
 const oversized=sealHistoryRecord({...source,log:Array.from({length:200},()=>({stage:'容量测试',text:'甲'.repeat(1900)}))},meta.ownerId,meta.ownerId+':9');
 assert.throws(()=>appendHistory(meta,oversized),/容量/);
 const bad=structuredClone(s);bad.settlement.records.push(oversized);bad.settlement.nextEncounter=10;assert.equal(validSettlement(bad),false);
});

test('封存只读记录拒绝 NaN、未知结果、重复厉鬼 ID 与未知核心绑定格式',()=>{
 const {s,source}=fixture();
 for(const change of [r=>r.cost.energy.after=NaN,r=>r.outcome='invented',r=>r.cost.ghosts.push({...r.cost.ghosts[0]}),r=>r.sourceState='raw-full-save',r=>r.sourceTick=-1]){
  const bad=structuredClone(source);change(bad);assert.throws(()=>sealHistoryRecord(bad,s.settlement.ownerId,'schema-owner:1'),/无效/);
 }
 assert.throws(()=>initialSettlement(s,{id:'非法角色'}),/无效/);
});
