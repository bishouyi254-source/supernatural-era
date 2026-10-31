import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {newGame,available,act,validate} from '../src/engine.js';import {settleSpirits,growthFor} from '../src/spirits.js';import {parts,fixture} from '../scripts/ghost-eye-v64-kernel.mjs';
const g=JSON.parse(await fs.readFile(new URL('../docs/fixtures/v64-growth-3.json',import.meta.url),'utf8'));
test('V6.4 each incident eye edge drifts; crossing threshold charges only subsequent timed settlements',()=>{
 const s=fixture(g.states.mature,{bias:54}),before=s.spirits.find(g=>g.sourceId==='eye').revivalProgress;settleSpirits(s,'player-eye',null,{'player-eye':1},true);
 assert.deepEqual(s.relations.filter(r=>r.spiritB==='player-eye').map(r=>r.bias),[-63,-63]);assert.equal(s.spirits.find(g=>g.sourceId==='eye').revivalProgress,before+1);assert.equal(growthFor(s,s.spirits.find(g=>g.sourceId==='eye')),4);
});
test('V6.4 reaction has no timed conflict tick, but still shifts both eye relations',()=>{
 const s=fixture(g.states.mature,{bias:60}),eye=s.spirits.find(g=>g.sourceId==='eye');const before=eye.revivalProgress;settleSpirits(s,'player-eye',null,{'player-eye':3},false);assert.equal(eye.revivalProgress,before+3);assert.equal(s.relations.filter(r=>r.spiritB==='player-eye')[0].bias,-69);
});
test('V6.4 lawful balance spends a real barrier; it preserves all revival and persistent load',()=>{
 let s=structuredClone(g.states.mature);s=act(act(act(s,'enter:blood'),'combat:start'),'eye6:cast:1');s=act(s,'combat:retreat');assert.ok(validate(s));assert.ok(available(s).includes('balance:medium'));const before=structuredClone(s);s=act(s,'balance:medium');assert.ok(validate(s));assert.equal(s.systems.items.barrier,before.systems.items.barrier-1);assert.equal(s.ghostEyeV6.persistentLoad,before.ghostEyeV6.persistentLoad);assert.deepEqual(s.spirits.map(g=>g.revivalProgress),before.spirits.map(g=>g.revivalProgress));assert.ok(s.relations.every(r=>r.bias===0));
});
test('V6.4 proposed node cap changes only drift aggregation; static conflict remains additive',()=>{
 const s=fixture(g.states.mature,{bias:75,staticConflict:1}),eye=s.spirits.find(g=>g.sourceId==='eye');const a=parts(s,eye,{model:'current'}),b=parts(s,eye,{model:'node-cap'});assert.equal(a.staticConflict,2);assert.equal(b.staticConflict,2);assert.equal(a.biasConflict,4);assert.equal(b.biasConflict,2);
});
test('V6.4 ramp candidate preserves threshold warning and reaches the original per-edge maximum at bias100',()=>{
 for(const [bias,expected] of [[59.999,0],[60,0],[60.001,.0001],[75,1.5],[100,4]]){const s=fixture(g.states.mature,{bias}),eye=s.spirits.find(g=>g.sourceId==='eye');assert.ok(Math.abs(parts(s,eye,{model:'ramp'}).biasConflict-expected)<1e-9);}
});
test('V6.4 choosing a network role is not evidence of an implemented passive bonus',()=>{
 const s=structuredClone(g.states.mature),a=parts(s,s.spirits.find(g=>g.sourceId==='eye'),{used:true,base:1});s.evolution.third.role='BRIDGE';const b=parts(s,s.spirits.find(g=>g.sourceId==='eye'),{used:true,base:1});assert.deepEqual(a,b);
});
