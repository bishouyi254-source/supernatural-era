import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, act, available, validate } from '../src/engine.js';
import { attachChapter, newChapter, backgroundHints } from '../src/chapter.js';
function advance(s, actions) { for(const a of actions) { assert.ok(available(s).includes(a),a);s=act(s,a); assert.ok(validate(s),a); } return s; }
test('B章开始前街区锁定，普通人没有鬼眼',()=>{
 const s=newGame();assert.equal(s.spirits.length,0);assert.equal(s.chapter.stage,0);
 assert.ok(!available(s).some(a=>a.startsWith('enter:')));assert.equal(act(s,'capture'),s);
});
for(const route of ['inside','perimeter']) test(route+'完整闭环与个人首鬼两路线',()=>{
 let s=advance(newGame(),['chapter:'+route,'chapter:briefing','chapter:advance','chapter:exit','chapter:audio','chapter:avoid','chapter:rescue','chapter:leave','chapter:street','chapter:finish']);
 assert.equal(s.chapter.completed,true);assert.equal(s.chapter.rescued,true);assert.equal(s.energy,2);
 assert.deepEqual(s.chapter.canonInstances,[{id:'canon-yang-eye',owner:'杨间',name:'鬼眼'}]);assert.equal(s.spirits.length,0);
 assert.ok(available(s).includes('enter:shadow'));assert.ok(available(s).includes('enter:echo'));
 assert.equal(act(s,'chapter:finish'),s);assert.equal(act(s,'chapter:rescue'),s);
});
test('现实玩家可无认证避险，但NPC档案不自动建立',()=>{
 const s=advance(newGame(),['chapter:inside','chapter:advance','chapter:avoid']);
 assert.deepEqual(s.chapter.evidence,[]);assert.deepEqual(s.chapter.npcObservations,[]);assert.equal(s.life,100);
});
test('撤离后正史收束但不自动认证杨间能力或重置救援',()=>{
 let s=advance(newGame(),['chapter:perimeter','chapter:advance','chapter:avoid','chapter:rescue','chapter:withdraw','chapter:finish']);
 assert.equal(s.chapter.failed,true);assert.equal(s.chapter.rescued,true);assert.deepEqual(s.chapter.npcObservations,[]);
 assert.equal(s.chapter.worldHistory.filter(x=>x.id==='yang-eye').length,1);
});
test('危险音频失败保留证据，有完整脱离出口',()=>{
 let s=advance(newGame(),['chapter:inside','chapter:briefing','chapter:advance','chapter:audio','chapter:risk','chapter:risk','chapter:risk']);
 assert.equal(s.chapter.failed,true);assert.equal(s.chapter.stage,2);assert.equal(s.life,0);assert.equal(s.systems.death,'pending');
 assert.ok(s.chapter.evidence.includes('audio'));s=advance(s,['reaction:item','chapter:withdraw','chapter:finish']);assert.equal(s.chapter.completed,true);
});
test('零能量不能救援，重复救援不重复扣除',()=>{
 let s=advance(newGame(),['chapter:inside','chapter:advance','chapter:avoid']);s.energy=0;
 assert.equal(act(s,'chapter:rescue'),s);s=act(s,'rest');s=act(s,'chapter:rescue');assert.equal(s.energy,2);assert.equal(act(s,'chapter:rescue'),s);
});
test('有限补给不可无限刷，满袋无补给操作',()=>{
 let s=advance(newGame(),['chapter:perimeter','chapter:advance','chapter:avoid','chapter:leave','chapter:finish']);
 assert.equal(act(s,'chapter:supply'),s);s.bags=0;s=advance(s,['chapter:supply','chapter:supply']);
 assert.equal(s.bags,2);assert.equal(s.chapter.supplyCredits,0);s.bags=0;assert.equal(act(s,'chapter:supply'),s);
});
test('JSON刷新恢复章节阶段，不复制世界事件与补给',()=>{
 let s=advance(newGame(),['chapter:inside','chapter:briefing','chapter:advance','chapter:audio']);
 const restored=JSON.parse(JSON.stringify(s));assert.ok(validate(restored));assert.deepEqual(available(restored),available(s));
 s=advance(restored,['chapter:avoid','chapter:leave','chapter:finish']);assert.equal(s.chapter.worldHistory.length,3);
});
test('背景提示各自独立，未授予属性或灵异',()=>{
 assert.equal(new Set(Object.values(backgroundHints)).size,5);
 for(const b of Object.keys(backgroundHints)) {const s=newGame('甲',b);assert.equal(s.life,100);assert.equal(s.spirits.length,0);}
});
test('旧v2只追加未参与章节，不篡改既有复苏',()=>{
 const s=newGame();delete s.chapter;const original=structuredClone(s), next=attachChapter(s);
 assert.deepEqual(s,original);assert.equal(next.chapter.stage,0);assert.equal(next.seed,s.seed);assert.ok(validate(next));
});
test('保存拒绝伪造章节状态与补给额度',()=>{
 const s=newGame();assert.equal(validate({...s,chapter:{...newChapter(),stage:5}}),false);
 assert.equal(validate({...s,chapter:{...newChapter(),supplyCredits:999}}),false);
});
