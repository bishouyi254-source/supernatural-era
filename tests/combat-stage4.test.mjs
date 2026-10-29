import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,available,validate,upgrade} from '../src/engine.js';
import {newCombat} from '../src/combat.js';
import {makeSpirit} from '../src/progression.js';
import {buildRealCombatData} from '../src/combat-stage4-adapter.js';
const legalStep=(s,a)=>{assert.ok(available(s).includes(a),a);const next=act(s,a);assert.ok(validate(next));return next;};
const battle=(withSpirit=false)=>{
 const s=newGame('集成测试');s.scene='echo';s.combat=newCombat('echo',s);
 if(withSpirit){s.spirits=[makeSpirit('echo')];s.spirits[0].development=50;}
 assert.ok(validate(s));return s;
};
test('接线严格只读，引擎合法动作可用；普通人没有厉鬼技能',()=>{
 const s=battle(),before=JSON.stringify(s),ui=buildRealCombatData(s);
 assert.equal(JSON.stringify(s),before);
 assert.equal(ui.player.hp,s.life);
 assert.equal(ui.player.energy,s.energy);
 assert.equal(ui.player.spirits.length,0);
 assert.equal(ui.enemy.displayName,'未识别异常');
 assert.ok(ui.skills.some(x=>x.id==='combat:observe'&&x.status==='available'));
 assert.equal(ui.skills.some(x=>x.id.startsWith('combat:ability:')),false);
 assert.equal(ui.skills.some(x=>x.id==='combat:restrict'&&x.status==='available'),false);
 assert.ok(!ui.skills.some(x=>x.name.includes('敲门鬼')));
});
test('已启用鬼的开发技能来自引擎，复苏按各鬼分别列出',()=>{
 let s=battle(true);const ui=buildRealCombatData(s);
 const focus=ui.skills.find(x=>x.id==='combat:focus:player-echo');
 assert.equal(focus.status,'available');assert.ok(focus.revivalByGhost['player-echo']>0);
 const energy=s.energy,revival=s.spirits[0].revivalProgress;
 s=legalStep(s,focus.id);
 assert.equal(s.energy,energy-1);assert.ok(s.spirits[0].revivalProgress>revival);
 const after=buildRealCombatData(s);
 assert.notEqual(after.player.energy,energy);
 assert.equal(after.skills.find(x=>x.id===focus.id).status,'cooldown');
 assert.equal(after.player.spirits[0].revival,s.spirits[0].revivalProgress);
 assert.equal(act(s,focus.id),s);
});
test('逐鬼复苏不与总体负荷混淆、组合取代的二鬼调用保持禁用',()=>{
 let s=battle(true);s.spirits.push(makeSpirit('watch'));
 s.systems.combinations=[{ids:['player-echo','player-watch'],name:'嵌套媒介',disabledId:'player-watch'}];
 assert.ok(validate(s));const d=buildRealCombatData(s);
 assert.equal(d.skills.find(x=>x.id==='combat:ability:player-watch').status,'locked');
 assert.ok(!available(s).includes('combat:ability:player-watch'));
 assert.equal(act(s,'combat:ability:player-watch'),s);
 const combo=d.skills.find(x=>x.id==='combat:combo');assert.ok(combo);
 assert.equal(combo.status,'available');
 assert.ok(Object.keys(combo.revivalByGhost).includes('player-watch'));
 const pre=s.spirits.map(g=>g.revivalProgress);s=legalStep(s,'combat:combo');
 s.spirits.forEach((g,i)=>assert.ok(g.revivalProgress>pre[i]));
 assert.equal(buildRealCombatData(s).player.burden,s.spirits.reduce((n,g)=>n+g.burden,0));
});
test('真实行动、存档往返、限制结算与撤离均遵从原引擎',()=>{
 let s=battle();s=legalStep(s,'combat:observe');
 assert.equal(buildRealCombatData(s).round,s.combat.turn+1);
 s=upgrade(JSON.parse(JSON.stringify(s)));assert.ok(validate(s));
 s=legalStep(s,'combat:observe');s=legalStep(s,'combat:observe');
 const d=buildRealCombatData(s);assert.ok(d.skills.find(x=>x.id==='combat:restrict')?.status==='available');
 s=legalStep(s,'combat:restrict');assert.equal(s.combat,null);assert.ok(s.restricted.echo);
 let t=battle();t=legalStep(t,'combat:retreat');assert.equal(t.combat,null);assert.equal(t.scene,'hub');
});
