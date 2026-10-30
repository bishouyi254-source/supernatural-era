import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fixture,replay,step} from '../tests/g1c-helpers.mjs';
import {available,act,validate} from '../src/engine.js';
import {g1cEnergyWarning} from '../src/g1c-production.js';
import {activeIds} from '../src/v1.js';

const snapshot=s=>({tick:s.tick,life:s.life,energy:s.energy,active:activeIds(s),
 revival:Object.fromEntries(s.spirits.map(g=>[g.sourceId,g.revivalProgress])),
 persistentLoad:s.g1c.load,states:Object.fromEntries(['fire','wind','press'].map(k=>[k,s.g1c[k].state])),
 crisis:s.crisis,death:s.systems.death});
const runs=[];
for(const ownership of [['fire','wind'],['fire','press'],['wind','press'],['fire','wind','press']]){
 let {s,c}=fixture({ownership});s=replay(s,c);
 const active=ownership.slice(0,2),trace=[];
 const execute=a=>{const before=snapshot(s);s=step(s,a,c);trace.push({action:a,before,after:snapshot(s)});};
 for(const k of active)execute('g1cp:'+k+':'+({fire:'ignite',wind:'raise',press:'fall'}[k]));
 execute('combat:observe');
 const first=active[0],last=active[1];
 execute('g1cp:'+first+':'+({fire:'quench',wind:'calm',press:'lift'}[first]));
 assert.equal(s.energy,0,'two-ghost opening/first closure must consume 3 energy');
 const lastAction='g1cp:'+last+':'+({fire:'quench',wind:'calm',press:'lift'}[last]);
 const before=snapshot(s);
 assert.equal(available(s,c).includes(lastAction),false,'second closure must be illegal');
 assert.equal(act(s,lastAction,c),s,'illegal second closure is a zero-cost no-op');
 assert.deepEqual(snapshot(s),before);
 assert.ok(available(s,c).includes('combat:retreat'),'unchained player has legal retreat');
 const warning=g1cEnergyWarning(s,c,available(s,c));
 assert.match(warning,/能量已耗尽/);
 const atStop=snapshot(s);
 execute('combat:retreat');
 assert.equal(s.g1c[last].state,'UNCONTROLLED');
 assert.ok(s.g1c.load>=atStop.persistentLoad);
 for(const [k,v] of Object.entries(atStop.revival))assert.ok(s.spirits.find(g=>g.sourceId===k).revivalProgress>=v,'retreat cannot reduce revival');
 assert.ok(validate(s,c));
 runs.push({ownership,active,requested:1,safelyClosed:0,encountersEnded:1,
  classification:'retreat with uncontrolled ghost; not safe completion',atStop,after:snapshot(s),warning,trace});
}
{
 let {s,c}=fixture({ownership:['fire','press'],playerHeightCm:200});s=replay(s,c);
 const trace=[],execute=a=>{const before=snapshot(s);s=step(s,a,c);trace.push({action:a,before,after:snapshot(s)});};
 for(const a of ['g1cp:fire:ignite','g1cp:fire:quench','g1cp:press:fall'])execute(a);
 assert.equal(s.energy,0);assert.equal(s.g1c.press.targetId,'player-body');
 assert.ok(!available(s,c).includes('combat:retreat'));
 assert.ok(!available(s,c).includes('g1cp:press:lift'));
 const before=snapshot(s);
 assert.equal(act(s,'combat:retreat',c),s);assert.equal(act(s,'g1cp:press:lift',c),s);
 assert.deepEqual(snapshot(s),before);
 assert.ok(available(s,c).includes('combat:force'));
 const warning=g1cEnergyWarning(s,c,available(s,c));
 assert.match(warning,/身体被鬼压人压制/);
 execute('combat:force');assert.ok(s.tick>before.tick);
 runs.push({ownership:['fire','press'],playerTallest:true,requested:1,safelyClosed:0,encountersEnded:0,
  classification:'trapped player: legal struggle performed, no guaranteed escape',atStop:before,after:snapshot(s),warning,trace});
}
const result={scope:'isolated G1-C only, production available/act/validate; no normal acquisition or synthetic invulnerability',
 runs,node:process.version,successfulAssertions:true};
const output=process.env.G1C_OUTPUT||'./tmp-g1c-closure';
await fs.mkdir(output,{recursive:true});
await fs.writeFile(output+'/closure-replay.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({runs:runs.map(r=>({ownership:r.ownership,classification:r.classification,energy:r.atStop.energy,states:r.after.states})),output},null,2));
