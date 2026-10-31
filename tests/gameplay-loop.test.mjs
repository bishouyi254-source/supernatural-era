import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,available,validate,upgrade} from '../src/engine.js';
import {taskGuide,actionCost} from '../src/gameplay-guide.js';
import {guideView,encounterView,feedbackView,newcomerView,investigationSummary} from '../src/views-gameplay.js';
import {investigationLabel} from '../src/views-investigation.js';
import {makeSpirit} from '../src/progression.js';
import {newCombat} from '../src/combat.js';
const label=a=>investigationLabel(a)||a;
const step=(s,a)=>{assert.ok(available(s).includes(a),a);const n=act(s,a);assert.ok(validate(n),'invalid '+a);return n;};
const guided=(s=newGame())=>{const visited=[];for(let i=0;i<25&&!s.investigation.resolution;i++){const g=taskGuide(s);assert.ok(g.recommended);visited.push(g.recommended);s=step(s,g.recommended);}assert.equal(s.investigation.resolution,'Contained');return {s,visited};};

test('全新普通人不用改状态即可完成调查、遭遇、关押、结算与下一主线',()=>{
 const {s,visited}=guided();assert.equal(visited.length,12);assert.ok(visited.includes('inv:compare'));assert.ok(visited.includes('inv:protect'));assert.equal(s.investigation.hypotheses.sound.status,'DISPROVEN');assert.equal(s.investigation.hypotheses.response.status,'CONFIRMED');assert.equal(s.investigation.npcs[0].state,'MARKED');assert.equal(s.spirits.length,0);assert.equal(s.bags,1);
 assert.equal(taskGuide(s).recommended,'school:start');const next=step(s,'school:start');assert.equal(next.school.active,true);assert.equal(next.investigation.active,false);assert.equal(next.outcomes.watch,'已封存');
});
test('初始指引只提供现有入口，不泄露广播触发规律',()=>{
 const s=newGame(),g=taskGuide(s),html=newcomerView(s,label)+guideView(s,label,true);
 assert.equal(g.recommended,'inv:enter');assert.equal(g.clues.length,0);assert.ok(!html.includes('NAMED_RESPONDER'));assert.ok(!html.includes('点名与回应假设已获'));assert.ok(html.includes('school:start'));
});
test('每一步提示都是合法行动，查看指引、代价与渲染均不改变状态',()=>{
 let s=newGame();for(let i=0;i<12;i++){const old=JSON.stringify(s),g=taskGuide(s);assert.ok(g.legal.includes(g.recommended));guideView(s,label,true);feedbackView(s,label);encounterView(s,label);actionCost(s,g.recommended);assert.equal(JSON.stringify(s),old);s=step(s,g.recommended);}
});
test('现场期间不能嵌套开始七中或其他调查',()=>{
 const s=step(newGame(),'inv:enter');assert.ok(available(s).every(a=>a.startsWith('inv:')));assert.equal(act(s,'school:start'),s);assert.equal(act(s,'door:enter'),s);
});
test('行动回执区分本次新增材料与仅有旧线索',()=>{
 let s=step(newGame(),'inv:enter');assert.deepEqual(s.actionReceipt.discoveries,[]);s=step(s,'inv:question');assert.deepEqual(s.actionReceipt.discoveries,['证词']);s=step(s,'inv:hypothesis:sound');assert.deepEqual(s.actionReceipt.discoveries,[]);
});
test('普通人不会获得灵异能力、组合或鬼域按钮',()=>{
 const s=step(newGame(),'inv:enter'),h=encounterView(s,label);assert.ok(h.includes('普通人无可用灵异能力'));assert.ok(!available(s).some(a=>/probe:|ability:|domain:cast/.test(a)));
});
test('灵异调用回执记录能量、被调用鬼复苏，负荷不变化',()=>{
 let s=newGame();s.spirits=[makeSpirit('echo'),makeSpirit('shadow')];s=step(s,'inv:enter');const before=structuredClone(s);s=step(s,'inv:probe:player-echo');
 assert.equal(s.energy,before.energy-1);assert.ok(s.spirits[0].revivalProgress>before.spirits[0].revivalProgress);assert.equal(s.spirits[1].revivalProgress,before.spirits[1].revivalProgress);assert.equal(s.hostCapacity,before.hostCapacity);assert.equal(s.spirits[0].burden,before.spirits[0].burden);
 assert.ok(s.actionReceipt.changes.some(t=>t.startsWith('回声鬼复苏')||t.includes('复苏')));assert.ok(!s.actionReceipt.changes.some(t=>t.includes('负荷：')));assert.match(actionCost(before,'inv:probe:player-echo'),/能量 1/);
});
test('零能量关闭能力，重复不合法请求不扣资源也不推进',()=>{
 let s=newGame();s.spirits=[makeSpirit('echo')];s.energy=0;s=step(s,'inv:enter');const saved=JSON.stringify(s);assert.ok(!available(s).includes('inv:probe:player-echo'));assert.equal(act(s,'inv:probe:player-echo'),s);assert.equal(JSON.stringify(s),saved);
});
test('缺少容器有明确阻碍与撤离选择，不循环推荐关押',()=>{
 let s=newGame();s.bags=0;for(const a of ['inv:enter','inv:move:office','inv:search','inv:cut'])s=step(s,a);
 const g=taskGuide(s);assert.equal(g.recommended,'inv:leave');assert.ok(g.blockers.some(t=>t.includes('隔离袋不足')));s=step(s,g.recommended);assert.equal(s.investigation.resolution,'Escaped');
});
test('普通撤离保留未解决的源头，并允许重返或选择主线',()=>{
 let s=step(step(newGame(),'inv:enter'),'inv:leave');assert.equal(s.investigation.source,'HIDDEN');assert.equal(taskGuide(s).recommended,'inv:enter');assert.ok(available(s).includes('school:start'));assert.ok(investigationSummary(s,label).includes('源头尚未解决'));
});
test('主动回应可致死，指引转到已有反应资源或明确结局',()=>{
 let s=newGame();for(const a of ['inv:enter','inv:wait','inv:respond','inv:wait','inv:wait','inv:wait'])s=step(s,a);
 assert.equal(s.systems.death,'pending');const g=taskGuide(s);assert.equal(g.location,'生存反应窗口');assert.ok(g.legal.includes(g.recommended));assert.ok(!g.legal.includes('inv:enter'));
});
test('教案没有把既有标记保护说成治愈或全员成功撤离',()=>{
 const {s}=guided();assert.equal(s.investigation.npcs[0].state,'MARKED');assert.equal(s.investigation.evacuated,false);const h=investigationSummary(s,label);assert.ok(h.includes('不代表所有人均已安全撤离'));assert.ok(!h.includes('获得经验'));
});
test('人在室内时不伪造走廊黑痕形成的直接观察',()=>{
 let s=newGame();for(const a of ['inv:enter','inv:move:office','inv:search','inv:wait'])s=step(s,a);
 assert.equal(s.investigation.npcs[0].state,'MARKED');assert.ok(!s.investigation.evidence.some(e=>e.id==='mark'));assert.ok(!taskGuide(s).clues.some(e=>e.text.startsWith('广播叫到陆安后')));
});
test('保存恢复中途任务、遭遇、材料与下个建议一致',()=>{
 let s=newGame();for(let i=0;i<7;i++)s=step(s,taskGuide(s).recommended);
 const saved=JSON.parse(JSON.stringify(s)),loaded=upgrade(saved);assert.ok(validate(loaded));assert.deepEqual(taskGuide(loaded),taskGuide(s));assert.deepEqual(loaded.actionReceipt,s.actionReceipt);assert.deepEqual(step(s,'inv:search'),step(loaded,'inv:search'));
});
test('旧合法存档不补造历史回执，未来实际行动才追加',()=>{
 let s=newGame();delete s.actionReceipt;assert.ok(validate(s));s=upgrade(s);assert.equal(s.actionReceipt,undefined);s=step(s,'inv:enter');assert.equal(s.actionReceipt.action,'inv:enter');
});
test('缺少旧调查模块的合法v2存档仍能开始真实行动并生成回执',()=>{
 const s=newGame();delete s.investigation;assert.ok(validate(s));const n=step(s,'inv:enter');assert.equal(n.investigation.active,true);assert.deepEqual(n.actionReceipt.discoveries,[]);
});
test('动作回执是该次引擎事实，日志满100条后仍取得新事实',()=>{
 let s=newGame();s.journal=Array.from({length:100},(_,i)=>'旧记录'+i);s=step(s,'inv:enter');assert.ok(s.actionReceipt.facts.some(t=>t.includes('废弃值班室')));assert.ok(s.actionReceipt.facts.every(t=>!t.startsWith('旧记录')));assert.equal(s.journal.length,100);
});
test('损坏回执拒绝导入，正文必须转义，不允许注入按钮',()=>{
 const s=step(newGame(),'inv:enter');for(const mutate of [r=>r.legal=false,r=>r.tick=s.tick+1,r=>r.facts=null,r=>r.changes=Array(33).fill('假')]){const bad=structuredClone(s);mutate(bad.actionReceipt);assert.equal(validate(bad),false);}
 const escaped=structuredClone(s);escaped.actionReceipt.facts=['<script>bad()</script>'];assert.ok(feedbackView(escaped,label).includes('&lt;script&gt;'));assert.ok(!feedbackView(escaped,label).includes('<script>'));
});
test('封存重复点击不重复消耗、发奖励或改历史',()=>{
 const {s}=guided();assert.equal(act(s,'inv:seal'),s);assert.equal(s.investigation.records.length,1);assert.equal(s.actionReceipt.action,'inv:seal');assert.equal(s.actionReceipt.legal,true);
});
test('副路线提前救人不需要等候标记出现，无软锁',()=>{
 let s=newGame();for(const a of ['inv:enter','inv:evacuate'])s=step(s,a);
 for(let i=0;i<12&&!s.investigation.resolution;i++)s=step(s,taskGuide(s).recommended);
 assert.equal(s.investigation.resolution,'Contained');assert.equal(s.investigation.evidence.some(e=>e.id==='mark'),false);assert.equal(s.investigation.hypotheses.response,undefined);
});
test('常规规则战斗用真实媒介与条件，没有源头HP；冷却关闭能力',()=>{
 let s=newGame();s.scene='blood';s.spirits=[makeSpirit('echo')];s.combat=newCombat('blood',s);assert.ok(validate(s));s=step(s,'combat:ability:player-echo');assert.ok(s.combat.cooldowns['player-echo']>0);assert.ok(!available(s).includes('combat:ability:player-echo'));assert.ok(!Object.hasOwn(s.combat,'hp'));const html=encounterView(s,label);assert.ok(html.includes('观察、避险与限制'));s=step(s,'combat:retreat');assert.equal(s.combat,null);assert.equal(s.scene,'hub');
});
test('七中普通人按指引仍能离场，旧地图不被提示伪造成有效出口',()=>{
 let s=step(newGame(),'school:start');for(let i=0;i<100&&!s.school.playerEscaped;i++){const g=taskGuide(s);assert.ok(g.legal.includes(g.recommended));s=step(s,g.recommended);}
 assert.equal(s.school.playerEscaped,true);assert.equal(s.spirits.length,0);assert.equal(s.life,100);assert.ok(s.school.records.length);
});
test('两种最终处置仍可选，驾驭是真实条件门控而不是教程奖励',()=>{
 let s=newGame();for(const a of ['inv:enter','inv:move:office','inv:search','inv:cut','inv:contain'])s=step(s,a);
 assert.ok(available(s).includes('inv:seal'));assert.ok(available(s).includes('inv:capture'));const before=s.bags;s=step(s,'inv:capture');assert.equal(s.bags,before-1);assert.equal(s.investigation.resolution,'Resolved');assert.equal(s.spirits[0].burden,28);assert.ok(s.actionReceipt.changes.some(t=>t.includes('新增驾驭')));
});
