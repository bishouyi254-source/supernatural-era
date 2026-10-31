import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,replay,step} from './g1c-helpers.mjs';
import {available,act,newGame} from '../src/engine.js';
import {buildRealCombatData} from '../src/combat-stage4-adapter.js';
import {g1cEnergyWarning} from '../src/g1c-production.js';

test('two manifested ghosts: zero-energy calm is illegal, but costly retreat remains available',()=>{
 let {s,c}=fixture({ownership:['fire','wind']});s=replay(s,c);
 for(const action of ['g1cp:fire:ignite','g1cp:wind:raise','combat:observe','g1cp:fire:quench'])s=step(s,action,c);
 assert.equal(s.energy,0);
 assert.equal(s.g1c.wind.state,'CONTROLLED');
 const legal=available(s,c);
 assert.equal(legal.includes('g1cp:wind:calm'),false);
 assert.equal(act(s,'g1cp:wind:calm',c),s,'invalid free calm must not mutate or advance');
 assert.equal(legal.includes('combat:retreat'),true);
 const hint=g1cEnergyWarning(s,c,legal);
 assert.match(hint,/能量已耗尽/);
 assert.match(hint,/撤离/);
 assert.match(hint,/后果/);
 const ui=buildRealCombatData(s,c);
 assert.match(ui.stageRisk,/能量已耗尽/);
 const loadBefore=s.g1c.load,revivalBefore=s.spirits.find(g=>g.sourceId==='ghost-wind').revivalProgress;
 s=step(s,'combat:retreat',c);
 assert.equal(s.g1c.wind.state,'UNCONTROLLED');
 assert.ok(s.g1c.load>=loadBefore,'retreat must not erase durable burden');
 assert.ok(s.spirits.find(g=>g.sourceId==='ghost-wind').revivalProgress>=revivalBefore);
 assert.equal(g1cEnergyWarning(s,c,available(s,c)),'');
});

test('a player pinned by tallest-body pressure cannot leave or cancel for free at zero energy',()=>{
 let {s,c}=fixture({ownership:['fire','press'],playerHeightCm:200});
 s=replay(s,c);
 // All three energy units are spent by legal production actions; none are injected.
 for(const action of ['g1cp:fire:ignite','g1cp:fire:quench','g1cp:press:fall'])s=step(s,action,c);
 assert.equal(s.energy,0);
 assert.equal(s.g1c.press.targetId,'player-body');
 const legal=available(s,c);
 assert.equal(legal.includes('g1cp:press:lift'),false);
 assert.equal(act(s,'g1cp:press:lift',c),s,'invalid free lift must not mutate or advance');
 assert.equal(legal.includes('combat:retreat'),false);
 assert.equal(act(s,'combat:retreat',c),s,'body pressure must deny free retreat');
 assert.equal(legal.includes('combat:force'),true);
 assert.match(g1cEnergyWarning(s,c,legal),/身体被鬼压人压制/);
 assert.match(buildRealCombatData(s,c).stageRisk,/不能免费解除或撤离/);
 const old=s;
 s=step(s,'combat:force',c);
 assert.notEqual(s,old);
 assert.ok(s.tick>old.tick,'a failed struggle must still take a real action');
 assert.ok(s.g1c.press.evidence.some(e=>e.type==='action-suppressed'));
});

test('no exhausted-G1C warning for ordinary new games or combat with no manifested ghost',()=>{
 const ordinary=newGame();
 assert.equal(g1cEnergyWarning(ordinary,null,[]),'');
 let {s,c}=fixture();s=replay(s,c);s.energy=0;
 assert.equal(g1cEnergyWarning(s,c,[]),'');
});
