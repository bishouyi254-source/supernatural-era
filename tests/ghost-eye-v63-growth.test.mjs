import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,available,act,validate} from '../src/engine.js';
import {growthFor,hostState} from '../src/spirits.js';
import {generate,go} from '../scripts/ghost-eye-v63-audit.mjs';
const g=generate(3);
test('V6.3 acquisition audit: eye is acquired after the lawful original pair, never injected as the first spirit',()=>{
 assert.equal(available(newGame()).includes('enter:eye'),false);assert.equal(available(g.states.single).includes('v1:eye:seek'),false);
 assert.deepEqual(g.states.eyeAcquired.spirits.map(x=>x.sourceId),['shadow','echo','eye']);
 assert.deepEqual(g.states.eyeAcquired.ghostEyeV6.unlocks['player-eye'].map(x=>x.layer),[1]);
 assert.ok(g.trace.some(x=>x.a==='second:implant'));assert.ok(g.trace.some(x=>x.a==='v1:eye:capture'));
});
test('V6.3 actual second spirit reduces the existing ghost usage growth without resetting its revival',()=>{
 const a=g.states.beforeSecond,b=g.states.second;assert.equal(a.spirits[0].revivalProgress,b.spirits[0].revivalProgress);
 assert.equal(growthFor(a,a.spirits[0],true),16);assert.equal(growthFor(b,b.spirits[0],true),9.6);
 assert.equal(b.spirits[1].revivalProgress,22);assert.equal(hostState(b).totalBurden,52);
});
test('V6.3 mature network uses three finite residual rewards and pays the existing structural costs',()=>{
 const s=g.states.mature;assert.deepEqual(g.skipped,[]);assert.equal(s.city.resources.fragments,0);
 assert.equal(s.city.residuals.filter(r=>r.stage===2).length,3);assert.equal(s.advanced.mediaStudy,true);
 assert.equal(s.evolution.host.form,3);assert.equal(s.evolution.third.stage,5);assert.equal(hostState(s).hostCapacity,155);
 assert.equal(s.spirits.find(x=>x.sourceId==='eye').revivalProgress,35);assert.ok(validate(s));
});
test('V6.3 lawful eighth route spends three gross energy; restart keeps load and shared allowance',()=>{
 let s=go(go(g.states.eyeEight,'enter:blood'),'combat:start');s=go(s,'eye6:cast:1');assert.equal(s.energy,2);assert.equal(s.combat.eyeV6.domain.remaining,3);
 s=go(s,'eye6:cast:8:self');assert.equal(s.ghostEyeV6.events.at(-1).energySpent,2);assert.equal(s.ghostEyeV6.persistentLoad,16);
 assert.equal(s.combat.eyeV6.restartUsed,true);assert.equal(act(s,'eye6:cast:7'),s);assert.equal(act(s,'eye6:cast:8:self'),s);
});
test('V6.3 no formal stasis intent: a sixth-layer request is rejected without charging',()=>{
 let s=go(go(g.states.eyeEight,'enter:blood'),'combat:start');s=go(s,'eye6:cast:1');assert.equal(s.combat.eyeV6.scenario,null);
 assert.equal(available(s).includes('eye6:cast:6'),false);assert.equal(act(s,'eye6:cast:6'),s);
});
