import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validate} from '../src/engine.js';
import {makeSpirit} from '../src/progression.js';
import {newCombat} from '../src/combat.js';
import {newG1C,g1cAllowed,validG1C,prepareG1C,g1cAvailable,applyG1C,g1cEnemy,g1cIntent,advanceG1C} from '../src/g1c-production.js';

const target=(id,heightCm,faction='enemy')=>({id,heightCm,faction,region:'exposed',body:true,spirit:true,ruleWeight:2,domainWeight:1,action:{type:'domain',targetRegion:'exposed',damage:8}});
function fixture(kind='press',others=[]){
 const s=newGame('隔离测试');const g=makeSpirit('ghost-'+kind);s.spirits.push(g);s.v1.active=[g.id];
 s.scene='shadow';s.combat=newCombat('shadow',s);s.combat.position='exposed';
 const ctx={g1cIntegration:'G1C-PRODUCTION',ownerId:s.settlement.ownerId,ownership:[kind],
  targets:[target('source:shadow',185),...others],playerHeightCm:175,playerRuleWeight:1};
 s.g1c=newG1C(s,ctx);return {s,ctx};
}

test('ordinary new game has no G1-C ownership or specialized actions',()=>{
 const s=newGame();assert.equal(validG1C(s,null),true);
 assert.equal(s.spirits.some(g=>['ghost-fire','ghost-wind','ghost-press'].includes(g.sourceId)),false);
});
test('G1-C holder cannot appear in an ordinary save without isolation',()=>{
 const s=newGame();s.spirits.push(makeSpirit('ghost-fire'));
 assert.equal(validG1C(s,null),false);assert.equal(validate(s),false);
});
test('integration ownership is bound to owner and source',()=>{
 const {s,ctx}=fixture('wind');
 assert.equal(validG1C(s,ctx),true);
 assert.equal(g1cAllowed(s,{...ctx,ownerId:'other'}),false);
 assert.equal(validG1C(s,{...ctx,ownerId:'other'}),false);
 assert.equal(g1cAvailable(s,{...ctx,ownerId:'other'}).length,0);
});
test('fire is paid and learns only through real source interactions',()=>{
 const {s,ctx}=fixture('fire');prepareG1C(s,ctx);
 assert.ok(g1cAvailable(s,ctx).includes('g1cp:fire:ignite'));
 const prior=structuredClone(s);s.tick++;const applied=applyG1C(s,'g1cp:fire:ignite',ctx);
 assert.equal(applied.used,'player-ghost-fire');assert.equal(s.energy,2);
 assert.equal(s.g1c.fire.load,2);
 assert.equal(g1cEnemy(s,{instanceId:'source:shadow',medium:'body'},{simulation:true},()=>{}),false);
 assert.equal(s.g1c.fire.evidence.some(e=>e.type==='burned'),false);
 g1cEnemy(s,{instanceId:'source:shadow',medium:'body'},g1cIntent(s,{instanceId:'source:shadow'},{kind:'ordinary'}),()=>{});
 assert.ok(s.g1c.fire.evidence.some(e=>['burned','burn-resisted'].includes(e.type)));
 advanceG1C(prior,s,'g1cp:fire:ignite',ctx);
 assert.ok(validG1C(s,ctx));assert.ok(g1cAvailable(s,ctx).includes('g1cp:fire:quench'));
});
test('wind contests an explicitly typed domain, never a simulated attack',()=>{
 const {s,ctx}=fixture('wind');prepareG1C(s,ctx);
 const prior=structuredClone(s);s.tick++;applyG1C(s,'g1cp:wind:raise',ctx);
 const before=s.g1c.wind.evidence.length;
 assert.equal(g1cEnemy(s,{instanceId:'source:shadow',medium:'body'},{simulation:true},()=>{}),false);
 assert.equal(s.g1c.wind.evidence.length,before);
 g1cEnemy(s,{instanceId:'source:shadow',medium:'body'},g1cIntent(s,{instanceId:'source:shadow'},{kind:'ordinary'}),()=>{});
 assert.ok(s.g1c.wind.evidence.some(e=>e.type==='domain-contest'));
 advanceG1C(prior,s,'g1cp:wind:raise',ctx);assert.ok(validG1C(s,ctx));
});
test('pressing a taller ally never silently retargets the enemy',()=>{
 const {s,ctx}=fixture('press',[target('test:ally',195,'ally')]);prepareG1C(s,ctx);
 const before=structuredClone(s);s.tick++;applyG1C(s,'g1cp:press:fall',ctx);
 const chosen=s.g1c.press.evidence.find(e=>e.type==='tallest-verified');
 assert.equal(chosen.data.targetId,'test:ally');
 advanceG1C(before,s,'g1cp:press:fall',ctx);assert.ok(validG1C(s,ctx));
});
test('unknown height or tied tallest target blocks pressure',()=>{
 const {s,ctx}=fixture('press',[target('test:ally',185,'ally')]);
 assert.equal(g1cAvailable(s,ctx).some(a=>a==='g1cp:press:fall'),false);
 assert.equal(g1cAvailable(s,{...ctx,targets:[{...ctx.targets[0],heightCm:null}]}).length,0);
});
