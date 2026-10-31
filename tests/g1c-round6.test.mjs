import test from 'node:test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fixture,replay,step,cycle,target} from './g1c-helpers.mjs';
import {available,act,validate,upgrade} from '../src/engine.js';
import {prepareG1C,g1cIntent,g1cEnemy} from '../src/g1c-production.js';

function trained(k,stage){let {s,c}=fixture({ownership:[k]});for(let i=1;i<=stage;i++){s=cycle(s,c,k);s=step(s,`g1cp:${k}:research:${i}`,c);}return {s,c};}
function contest(k,stage,{domain=true,spirit=true,defense=5,focus=false,cap=false}={}){
 let {s,c}=trained(k,stage);
 if(cap){s.spirits[0].development=100;s.v1.build='suppression';s.traits.mentalBase=150;s.lineage.potential.mentalBase=150;s.traits.mentalCharges=4;}
 c={...c,targets:[target({spirit,ruleWeight:k==='press'?2:defense,domainWeight:defense,action:{type:domain?'domain':'body',targetRegion:'exposed',damage:9}})]};
 s=replay(s,c);const startSeq=s.g1c.sequence;s=step(s,`g1cp:${k}:${{fire:'ignite',wind:'raise',press:'fall'}[k]}`,c);
 if(k==='press')c={...c,targets:[{...c.targets[0],ruleWeight:defense}]};
 if(focus)s=step(s,`g1cp:${k}:${{fire:'concentrate:source:shadow',wind:'invade:source:shadow',press:'intensify'}[k]}`,c);
 else s=step(s,'combat:observe',c);
 const e=s.g1c[k].evidence.findLast(e=>e.seq>startSeq&&e.data.attack!==undefined);
 return {s,c,e};
}

for(const [k,stage,focus,attack] of [['fire',0,false,3],['fire',1,true,4],['fire',2,false,4],['fire',2,true,5],['wind',0,false,3],['wind',1,false,4],['wind',2,false,4],['wind',2,true,5],['press',0,false,3],['press',1,false,4],['press',2,false,4],['press',2,true,5]])test(`v1.0 ${k} stage${stage} focus=${focus}: effective weight ${attack}`,()=>{
 const {e}=contest(k,stage,{focus});assert.equal(e.data.attack,attack);assert.equal(e.data.result,attack===5?'partial':'failed');
});

test('F2 domain buff requires burnable spirit; body gets only the legal F1 focus',()=>{
 assert.equal(contest('fire',2,{domain:false}).e.data.attack,3);
 assert.equal(contest('fire',2,{domain:false,focus:true}).e.data.attack,4);
 assert.equal(contest('fire',2,{spirit:false}).e,undefined);
});
test('W1/W2 never turn a body attack with domainWeight into a domain action',()=>{
 const {s,c,e}=contest('wind',2,{domain:false});assert.equal(e,undefined);
 assert.equal(available(s,c).some(a=>a.includes(':invade:')),false);
});
for(const k of ['fire','wind','press'])test(`${k}: stage and focus additions cap at10, equality stays partial`,()=>{
 const {e,s}=contest(k,2,{cap:true,focus:true,defense:10});assert.equal(e.data.attack,10);assert.equal(e.data.result,'partial');assert.equal(validate(s),false);
});


test('two partial interceptions apply ceil(original damage/2) only once',()=>{
 let {s,c}=fixture({ownership:['fire','wind'],targets:[target({domainWeight:3,action:{type:'domain',targetRegion:'exposed',damage:9}})]});s=replay(s,c);
 s=step(s,'g1cp:fire:ignite',c);s=step(s,'g1cp:wind:raise',c);const beforeLife=s.life,beforeAttempts=s.g1c.participantActions['source:shadow']?.attempts||0;s=step(s,'combat:observe',c);
 assert.equal(s.life,beforeLife-5);assert.equal(s.g1c.participantActions['source:shadow'].attempts,beforeAttempts+1);
 for(const k of ['fire','wind'])assert.equal(s.g1c[k].evidence.find(e=>e.data.attack!==undefined).data.result,'partial');
});
test('first full block stops later ghosts from earning duplicate success/research',()=>{
 let {s,c}=fixture({ownership:['fire','wind']});s=replay(s,c);s=step(s,'g1cp:fire:ignite',c);s=step(s,'g1cp:wind:raise',c);const beforeAttempts=s.g1c.participantActions['source:shadow']?.attempts||0;s=step(s,'combat:observe',c);
 assert.equal(s.life,100);assert.equal(s.g1c.participantActions['source:shadow'].attempts,beforeAttempts+1);
 assert.equal(s.g1c.wind.evidence.some(e=>['interfered','domain-contest'].includes(e.type)),false);
 assert.ok(s.spirits.every(g=>g.revivalProgress>0));assert.equal(s.g1c.load,4);
});
test('failed fire retains its failure evidence when a later wind fully blocks',()=>{
 let {s,c}=fixture({ownership:['fire','wind'],build:'suppression',targets:[target({domainWeight:4})]});s.spirits[1].development=50;s=replay(s,c);
 // Fire base4 ties, wind6 blocks; failure uses defense5.
 c={...c,targets:[target({domainWeight:5})]};s=step(s,'g1cp:fire:ignite',c);s=step(s,'g1cp:wind:raise',c);const beforeAttempts=s.g1c.participantActions['source:shadow']?.attempts||0;s=step(s,'combat:observe',c);
 assert.equal(s.life,100);assert.ok(s.g1c.fire.evidence.some(e=>e.type==='burn-resisted'));assert.ok(s.g1c.wind.evidence.some(e=>e.type==='interfered'));assert.equal(s.g1c.participantActions['source:shadow'].attempts,beforeAttempts+1);
});
test('re-entering the same resolved engine action cannot create more evidence or movement',()=>{
 let {s,c}=fixture({ownership:['fire','wind']});s=replay(s,c);s=step(s,'g1cp:fire:ignite',c);s=step(s,'g1cp:wind:raise',c);prepareG1C(s,c);
 const r={instanceId:'source:shadow'},intent=g1cIntent(s,r,{kind:'ordinary'});assert.equal(g1cEnemy(s,r,intent,()=>{}),true);
 const before=JSON.stringify(s);assert.equal(g1cEnemy(s,r,intent,()=>{}),true);assert.equal(JSON.stringify(s),before);
});
test('one source action cannot buy two research stages through burn/domain projections',()=>{
 let {s,c}=fixture();s=replay(s,c);for(const a of ['g1cp:fire:ignite','combat:observe','g1cp:fire:quench','combat:retreat'])s=step(s,a,c);
 s=step(s,'g1cp:fire:research:1',c);assert.equal(act(s,'g1cp:fire:research:2',c),s);
 s=step(s,'rest',c);s=cycle(s,c,'fire');s=step(s,'g1cp:fire:research:2',c);
 const used=s.g1c.fire.evidence.filter(e=>e.type==='researched').map(e=>e.data.evidenceSeq);assert.equal(new Set(used).size,2);
});
test('P1/P2 cease on tie, moved target or invalid body; no retargeting or free intensify',()=>{
 for(const edit of [t=>({...t,heightCm:175}),t=>({...t,region:'safe'}),t=>({...t,body:false})]){
  let {s,c}=trained('press',2);s=replay(s,c);s=step(s,'g1cp:press:fall',c);c={...c,targets:c.targets.map(edit)};
  assert.equal(act(s,'g1cp:press:intensify',c),s);s=step(s,'combat:observe',c);assert.equal(s.g1c.press.state,'CLOSED');
 }
});
test('F1/W2 target lock never transfers to a different current source',()=>{
 for(const k of ['fire','wind']){
  let {s,c}=trained(k,2);s=replay(s,c);s=step(s,`g1cp:${k}:${k==='fire'?'ignite':'raise'}`,c);s=step(s,`g1cp:${k}:${k==='fire'?'concentrate':'invade'}:source:shadow`,c);
  c={...c,targets:[target({region:'safe'}),target({id:'source:other'})]};const seq=s.g1c.sequence;s=step(s,'combat:observe',c);assert.equal(s.g1c.events.slice(seq).some(e=>e.data.attack!==undefined),false);
 }
});

test('legacy format2 stage2 shared-action research stays valid and byte-preserved',()=>{
 const {s,c}=JSON.parse(fs.readFileSync(new URL('../docs/g1c-round6/legacy-shared-evidence.json',import.meta.url),'utf8'));
 const ledger=JSON.stringify(s.g1c);assert.ok(validate(s,c));const n=upgrade(JSON.parse(JSON.stringify(s)));assert.ok(validate(n,c));assert.equal(JSON.stringify(n.g1c),ledger);assert.equal(act(n,'g1cp:fire:research:3',c),n);
});
