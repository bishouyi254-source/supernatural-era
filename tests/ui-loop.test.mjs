import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,available,validate} from '../src/engine.js';
import {taskGuide} from '../src/gameplay-guide.js';
import {makeSpirit} from '../src/progression.js';
import {newCombat} from '../src/combat.js';
import {investigationBoard,preparationView,questView,battleView,settlementView,buildControls} from '../src/ui-loop.js';
import {workshopView} from '../src/rpg-workshop.js';
const label=a=>a;
function step(s,a){assert.ok(available(s).includes(a),a);const n=act(s,a);assert.ok(validate(n));return n;}
function tutorial(){let s=newGame('UI测试');for(let i=0;i<15&&!s.investigation.resolution;i++)s=step(s,taskGuide(s).recommended);return s;}
function battle(){return step(step(tutorial(),'enter:echo'),'combat:start');}
function actions(html){return [...html.matchAll(/data-action="([^"]+)"/g)].map(m=>m[1]);}
test('新UI完整普通人闭环只展示合法操作，全部视图不更改存档',()=>{
 let s=newGame();for(let i=0;i<15&&!s.investigation.resolution;i++){
  const before=JSON.stringify(s),html=investigationBoard(s,label)+preparationView(s,label)+questView(s,label)+buildControls(s,available(s),label);
  assert.equal(JSON.stringify(s),before);for(const a of actions(html))assert.ok(available(s).includes(a));s=step(s,taskGuide(s).recommended);
 }
 s=step(s,'enter:echo');s=step(s,'combat:start');for(let i=0;i<3;i++)s=step(s,'combat:observe');s=step(s,'combat:restrict');s=step(s,'seal');
 assert.ok(settlementView(s,label).includes('已封存'));const board=investigationBoard(s,label);assert.ok(board.includes('现场材料 · 3'));assert.ok(!board.includes('data-action="combat:'));assert.equal(s.version,2);
});
test('未调查战斗不公开源头身份、触发规律或提供虚假能力',()=>{
 const s=battle(),html=battleView(s,label);assert.ok(html.includes('未识别异常'));assert.ok(!html.includes('回声鬼'));assert.ok(!html.includes('data-action="combat:ability:'));assert.ok(html.includes('不是生命值'));assert.ok(html.includes('5 刻'));
});
test('调查板保留实际假设文本和证据状态，不补充未记录假设',()=>{
 let s=step(newGame(),'inv:enter');s=step(s,'inv:question');assert.ok(!investigationBoard(s,label).includes('听到广播就会被标记'));s=step(s,'inv:hypothesis:sound');assert.ok(investigationBoard(s,label).includes('听到广播就会被标记'));assert.ok(!investigationBoard(s,label).includes('进入值班室就会被标记'));
});
test('技能卡遵循开发、启用、能量与冷却门控，确认预览不结算',()=>{
 let s=battle();s.spirits=[makeSpirit('echo')];s.spirits[0].development=50;s.combat=newCombat('echo',s);
 // Synthetic ability-gating fixture, never evidence of a legal acquisition.
 // Editing an ongoing core invalidates the real ledger. Use the compatible
 // no-history old schema only for this existing UI/preview gate test.
 assert.equal(validate(s),false);delete s.settlement;assert.ok(validate(s));
 assert.ok(actions(battleView(s,label)).includes('combat:cover:player-echo'));const before=JSON.stringify(s);const confirm=battleView(s,label,'combat:cover:player-echo');assert.ok(confirm.includes('data-play-confirm'));assert.equal(JSON.stringify(s),before);
 s=step(s,'combat:cover:player-echo');assert.ok(!actions(battleView(s,label)).includes('combat:cover:player-echo'));s.energy=0;assert.ok(!actions(battleView(s,label)).some(a=>a.startsWith('combat:ability:')));
});
test('构筑槽位反映实际启用顺序，持有与启用不混淆',()=>{
 const s=battle();s.spirits=[makeSpirit('echo'),makeSpirit('watch')];s.v1.active=['player-watch'];const html=workshopView(s,available(s),label);assert.ok(html.includes('核心位 · 点名磁带'));assert.ok(html.includes('持有实例 · 回声'));assert.ok(html.includes('data-select-spirit="player-echo"'));assert.ok(html.includes('data-select-spirit="player-watch"'));assert.ok(html.includes('复苏'));assert.ok(html.includes('负荷'));
});
test('玩家名称和材料以文本转义，不能注入假操作',()=>{
 const s=newGame('<button data-action="capture">');const html=preparationView(s,label);assert.ok(!html.includes('<button data-action="capture">'));assert.ok(html.includes('&lt;button'));
});
