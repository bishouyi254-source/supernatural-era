import test from 'node:test';import assert from 'node:assert/strict';
import {fixture,replay,step,cycle,target} from './g1c-helpers.mjs';
import {act,available,validate,upgrade,newGame} from '../src/engine.js';
import {hostState,growthFor} from '../src/spirits.js';
import {buildRealCombatData} from '../src/combat-stage4-adapter.js';
import {relationship,makeSpirit} from '../src/progression.js';
import {newG1C} from '../src/g1c-production.js';
import {fixture as bFixture} from './g1b-helpers.mjs';
import {integrationFixture,rebind} from './g1a-production-helpers.mjs';
import {currentSettlement} from '../src/settlement-controller.js';
const has=(s,k,type)=>s.g1c[k].evidence.some(e=>e.type===type);
for(const k of ['fire','wind','press'])test(k+' real engine growth 0→1→2; stage3 locked, no circular gate',()=>{
 let {s,c}=fixture({ownership:[k]});s=cycle(s,c,k);s=step(s,`g1cp:${k}:research:1`,c);
 s=cycle(s,c,k);s=step(s,`g1cp:${k}:research:2`,c);assert.equal(s.g1c[k].stage,2);assert.equal(act(s,`g1cp:${k}:research:3`,c),s);
});
test('fire changes actual source outcome; resistance and domain evidence only on actual initiative',()=>{
 let {s,c}=fixture();s=replay(s,c);s=step(s,'g1cp:fire:ignite',c);assert.equal(has(s,'fire','burned'),false);s=step(s,'combat:observe',c);assert.equal(s.life,100);assert.ok(has(s,'fire','burned'));assert.equal(s.restricted.shadow,undefined);
 let q=fixture({targets:[target({ruleWeight:9,domainWeight:9})]});q.s=replay(q.s,q.c);q.s=step(q.s,'g1cp:fire:ignite',q.c);q.s=step(q.s,'combat:observe',q.c);assert.equal(q.s.life,92);assert.ok(has(q.s,'fire','burn-resisted'));assert.ok(q.s.spirits[0].revivalProgress>0);
});
test('equal-weight fire partially suppresses actual damage',()=>{let {s,c}=fixture({targets:[target({domainWeight:3})]});s=replay(s,c);s=step(s,'g1cp:fire:ignite',c);s=step(s,'combat:observe',c);assert.equal(s.life,96);});
test('wind refuses body action, safe position and mismatched domain target; real domain is intercepted',()=>{
 for(const opts of [{action:{type:'body',targetRegion:'exposed',damage:8}},{action:{type:'domain',targetRegion:'safe',damage:8}},{region:'safe'},{}]){
 let {s,c}=fixture({ownership:['wind'],targets:[target(opts)]});s=replay(s,c);s=step(s,'g1cp:wind:raise',c);s=step(s,'combat:observe',c);const matched=!Object.keys(opts).length;assert.equal(has(s,'wind','domain-contest'),matched);if(matched)assert.equal(s.life,100);
 }
});
test('pressure selects taller ally, suppresses ally initiative, never enemy; leave invalidates',()=>{
 let {s,c}=fixture({ownership:['press'],targets:[target(),target({id:'test:ally',faction:'ally',heightCm:195})]});s=replay(s,c);s=step(s,'g1cp:press:fall',c);assert.equal(s.g1c.press.targetId,'test:ally');s=step(s,'combat:observe',c);assert.ok(s.g1c.press.evidence.some(e=>e.type==='action-suppressed'&&e.data.targetId==='test:ally'));assert.equal(s.life,90);
 c={...c,targets:c.targets.map(t=>t.id==='test:ally'?{...t,region:'safe'}:t)};s=step(s,'combat:observe',c);assert.equal(s.g1c.press.state,'CLOSED');
});
test('player can be tallest; body actions blocked, paid time struggle fails, lift available',()=>{
 let {s,c}=fixture({ownership:['press'],playerHeightCm:200});s=replay(s,c);s=step(s,'g1cp:press:fall',c);assert.equal(s.g1c.press.targetId,'player-body');assert.equal(act(s,'combat:avoid',c),s);assert.equal(act(s,'combat:retreat',c),s);assert.ok(available(s,c).includes('g1cp:press:lift'));s=step(s,'combat:force',c);assert.ok(has(s,'press','action-suppressed'));assert.ok(s.tick>1);s=step(s,'g1cp:press:lift',c);assert.ok(available(s,c).includes('combat:avoid'));
});
test('enemy can break pressure with actual stronger initiative',()=>{
 let {s,c}=fixture({ownership:['press']});s=replay(s,c);s=step(s,'g1cp:press:fall',c);c={...c,targets:[target({ruleWeight:9})]};s=step(s,'combat:observe',c);assert.ok(has(s,'press','escaped'));assert.equal(s.g1c.press.state,'CLOSED');
});
test('unknown/tied height gives zero cost rejection; no guessed target',()=>{
 for(const heightCm of [null,175]){let {s,c}=fixture({ownership:['press']});s=replay(s,c);c={...c,targets:[target({heightCm})]};assert.equal(act(s,'g1cp:press:fall',c),s);}
});
test('costs, persistent burden, Build and directional suppression use shared settlement',()=>{
 for(const build of [null,'stable','suppression','mind','rule','domain']){
 let {s,c}=fixture({ownership:['fire','wind'],build});s=replay(s,c);const p=structuredClone(s);p.g1c.load+=2;const expected=growthFor(p,p.spirits[0],true,1,3);s=step(s,'g1cp:fire:ignite',c);assert.equal(s.spirits[0].revivalProgress,expected);assert.equal(s.spirits[1].revivalProgress,0);assert.equal(hostState(s).totalBurden,2);
 }
});
test('idempotency, ordinary import rejection, corrupted stage and missing ownership',()=>{
 let {s,c}=fixture();s=replay(s,c);c={...c,requestId:'one'};s=step(s,'g1cp:fire:ignite',c);assert.equal(act(s,'combat:observe',c),s);assert.equal(validate(s),false);
 for(const edit of [v=>v.g1c.fire.stage=2,v=>v.g1c.fire.actorId=null,v=>v.g1c.completed=null,v=>v.g1c={},v=>v.spirits=[]]){const q=structuredClone(s);edit(q);assert.equal(validate(q,c),false);assert.doesNotThrow(()=>assert.equal(act(q,'combat:observe',c),q));}
 assert.ok(validate(upgrade(newGame())));assert.equal(newGame().spirits.length,0);
});
test('maintained effect ceases on inactive slot; natural revival of all holders persists',()=>{
 let {s,c}=fixture({ownership:['fire','wind','press']});s=replay(s,c);s=step(s,'g1cp:fire:ignite',c);s=step(s,'combat:retreat',c);assert.equal(s.g1c.fire.state,'UNCONTROLLED');s=step(s,'v1:active:remove:player-ghost-fire',c);s=replay(s,c);assert.equal(available(s,c).includes('g1cp:press:fall'),false);
});
test('skill cards expose G1-C actions and actual per-ghost costs',()=>{let {s,c}=fixture();s=replay(s,c);const v=buildRealCombatData(s,c),a=v.skills.find(x=>x.id==='g1cp:fire:ignite');assert.ok(a);assert.equal(a.name,'燃起鬼火');assert.equal(a.burden,2);assert.equal(a.revivalByGhost['player-ghost-fire'],4);});
for(const k of ['fire','wind','press'])test(k+' advanced action changes next real contest and pays normal costs',()=>{
 let {s,c}=fixture({ownership:[k]});for(const stage of [1,2]){s=cycle(s,c,k);s=step(s,`g1cp:${k}:research:${stage}`,c);}
 s=replay(s,c);s=step(s,`g1cp:${k}:${{fire:'ignite',wind:'raise',press:'fall'}[k]}`,c);
 const a=`g1cp:${k}:`+({fire:'concentrate:source:shadow',wind:'invade:source:shadow',press:'intensify'}[k]),before=s.energy;
 s=step(s,a,c);assert.equal(s.energy,before-1);assert.ok(s.g1c[k].evidence.some(e=>e.type===(k==='press'?'pressure-contest':'focused')));
});
test('pressure stops actual ally movement, while the same unpressed ally moves out',()=>{
 const ally=target({id:'test:ally',heightCm:195,faction:'ally',action:{type:'body',targetRegion:'exposed',damage:0,moveTo:'safe'}});
 for(const pressed of [false,true]){let {s,c}=fixture({ownership:['press'],targets:[target(),ally]});s=replay(s,c);s=step(s,pressed?'g1cp:press:fall':'combat:observe',c);s=step(s,'combat:observe',c);const v=s.g1c.participantActions['test:ally'];assert.equal(v.blocked,pressed?1:0);assert.equal(s.g1c.positions['test:ally'],pressed?undefined:'safe');}
});
test('over-capacity uses shared multiplier and per-ghost directional suppression',()=>{
 let {s,c}=fixture({ownership:['fire','wind'],build:'domain'});for(const g of s.spirits){g.burden=50;g.naturalRevivalRate=1;}s.relations=[relationship(...s.spirits)];Object.assign(s.relations[0],{suppressionAtoB:0,suppressionBtoA:.6,conflictAtoB:0,conflictBtoA:0});s=replay(s,c);
 const p=structuredClone(s);p.g1c.load+=2;const expected=growthFor(p,p.spirits[0],true,1,3);s=step(s,'g1cp:fire:ignite',c);assert.ok(hostState(s).burdenRatio>1);assert.equal(s.spirits[0].revivalProgress,Math.round(expected*10000)/10000);assert.equal(s.spirits[1].revivalProgress,1.25);
});
test('maintenance reaches independent revival crisis; high fire risk backlash persists after quench',()=>{
 let {s,c}=fixture();s.spirits[0].revivalProgress=94;s=replay(s,c);s=step(s,'g1cp:fire:ignite',c);assert.equal(s.life,98);s=step(s,'combat:observe',c);s=step(s,'combat:observe',c);assert.equal(s.spirits[0].revivalProgress,100);assert.equal(s.crisis,true);assert.equal(s.g1c.fire.state,'UNCONTROLLED');assert.ok(available(s,c).includes('suppress'));assert.equal(act(s,'g1cp:fire:ignite',c),s);
});
test('G1-A blood/rope coexist through real engine without replacing their rules',()=>{
 let {s,c}=integrationFixture({combat:false,shroud:false});s.spirits.push(makeSpirit('ghost-fire'));c={...c,g1cIntegration:'G1C-PRODUCTION',g1cOwnership:['fire'],ownerId:s.settlement.ownerId,targets:[target()],playerHeightCm:175,playerRuleWeight:1};s.g1c=newG1C(s,c);s=rebind(s);assert.ok(validate(s,c));s=step(s,'v1:active:remove:player-g1a-rope-candidate',c);s=step(s,'v1:active:add:player-ghost-fire',c);s=replay(s,c);s=step(s,'g1cp:fire:ignite',c);assert.ok(s.spirits.find(g=>g.sourceId==='blood'));assert.ok(s.g1a.production.rope.actorId);assert.equal(validate(s),false);
});
test('G1-B smoke and G1-C fire retain separate ownership, loads and upkeep',()=>{
 let {s,c}=bFixture({ownership:['smoke'],actors:[]});s.spirits.push(makeSpirit('ghost-fire'));c={...c,g1cIntegration:'G1C-PRODUCTION',g1cOwnership:['fire'],targets:[target()],playerHeightCm:175,playerRuleWeight:1};s.g1c=newG1C(s,c);delete s.settlement;s=upgrade(s);assert.ok(validate(s,c));s=replay(s,c);s=step(s,'g1bp:smoke:release',c);s=step(s,'g1cp:fire:ignite',c);assert.equal(s.g1b.load,2);assert.equal(s.g1c.load,2);assert.ok(s.spirits.every(g=>g.revivalProgress>0));
});
test('real G1-C battle settlement records exact skills, resources and independent revival',()=>{
 let {s,c}=fixture();s=replay(s,c);for(const a of ['g1cp:fire:ignite','combat:observe','g1cp:fire:quench','combat:retreat'])s=step(s,a,c);
 const r=currentSettlement(s);assert.ok(r);assert.deepEqual(r.abilitiesUsed,['燃起鬼火','收敛鬼火']);assert.equal(r.cost.energy.before,3);assert.equal(r.cost.energy.after,1);assert.equal(r.cost.ghosts[0].after,s.spirits[0].revivalProgress);assert.match(r.encounter,/隔离/);assert.equal(s.settlement.records.length,1);
});
test('forged three active slots cannot execute G1-C actions',()=>{let {s,c}=fixture({ownership:['fire','wind','press']});s=replay(s,c);s.v1.active=s.spirits.map(g=>g.id);assert.equal(validate(s,c),false);assert.deepEqual(available(s,c),[]);assert.equal(act(s,'g1cp:press:fall',c),s);});
