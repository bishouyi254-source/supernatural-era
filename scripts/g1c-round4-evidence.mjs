import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fixture,replay} from '../tests/g1c-helpers.mjs';
import {newGame,act,available,validate} from '../src/engine.js';
import {inspectG1CFormalSource} from '../src/g1c-formal-source.js';
import {newCombat} from '../src/combat.js';
import {events} from '../src/content.js';
const out=process.env.G1C_OUTPUT||'docs/g1c-round4';
await fs.mkdir(out,{recursive:true});
const fixtures=JSON.parse(await fs.readFile('scripts/g1c-states.json','utf8'));
const scenarios=[];
function run(name,opts,setup,actions,rejections,finish){
 let {s,c}=fixture(opts);setup?.(s);s=replay(s,c);
 fixtures[name]={state:structuredClone(s),context:structuredClone(c)};
 const row={name,boundary:'EXPLICIT ISOLATED HOLDER / STATIC HEIGHT ONLY',initial:structuredClone(s),context:c,trace:[]};
 for(const a of actions){const before=structuredClone(s),legal=available(s,c);assert.ok(legal.includes(a),a);const n=act(s,a,c);assert.notStrictEqual(n,s,a);assert.ok(validate(n,c),a);s=n;row.trace.push({action:a,legal,before,after:structuredClone(s)});}
 for(const a of rejections){const token=JSON.stringify(s);assert.strictEqual(act(s,a,c),s);assert.equal(JSON.stringify(s),token);}
 finish(s,c);row.rejected=rejections;row.final=s;scenarios.push(row);
}
run('round4-zero-pair',{ownership:['fire','wind']},null,
 ['g1cp:fire:ignite','g1cp:wind:raise','combat:observe','g1cp:fire:quench'],['g1cp:wind:calm'],(s,c)=>{
 assert.equal(s.energy,0);fixtures['round4-zero-pair-before-retreat']={state:structuredClone(s),context:c};
 const n=act(s,'combat:retreat',c);assert.ok(validate(n,c));assert.equal(n.g1c.wind.state,'UNCONTROLLED');
 scenarios.push({name:'round4-zero-retreat',outcome:'LEGAL FAILURE: retreat with uncontrolled wind',before:s,after:n});
 });
run('round4-zero-pinned',{ownership:['fire','press'],playerHeightCm:200},null,
 ['g1cp:fire:ignite','g1cp:fire:quench','g1cp:press:fall','combat:force'],['g1cp:press:lift','combat:retreat'],s=>{
 assert.equal(s.energy,0);assert.ok(s.g1c.press.evidence.some(e=>e.type==='action-suppressed'));assert.ok(s.tick>0);
 });
run('round4-mental-crisis',{ownership:['fire']},s=>{s.spirits[0].revivalProgress=94;s.traits.mentalBase=150;s.lineage.potential.mentalBase=150;s.traits.mentalCharges=4;},
 ['g1cp:fire:ignite','combat:observe','combat:observe'],['g1cp:fire:ignite'],s=>{
 assert.equal(s.crisis,true);assert.equal(s.g1c.fire.state,'UNCONTROLLED');assert.ok(s.life<100);
 });
const formal=Object.keys(events).map(id=>{const s=newGame();s.scene=id;s.combat=newCombat(id,s);const r=inspectG1CFormalSource(s);assert.deepEqual(r.eligible,{fire:false,wind:false,press:false});return {event:id,...r};});
await fs.writeFile('scripts/g1c-states.json',JSON.stringify(fixtures));
await fs.writeFile(out+'/edge-scenarios.json',JSON.stringify(scenarios,null,2));
await fs.writeFile(out+'/formal-gate-matrix.json',JSON.stringify(formal,null,2));
console.log(JSON.stringify({scenarios:scenarios.length,formalEvents:formal.length,eligible:0,ordinaryAcquisition:'LOCKED'}));
