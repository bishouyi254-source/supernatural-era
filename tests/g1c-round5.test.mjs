import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,replay,step} from './g1c-helpers.mjs';
import {act,available,upgrade,validate,newGame} from '../src/engine.js';
import {g1cSceneConsequences} from '../src/g1c-consequences.js';
import {g1cConsequenceView} from '../src/g1c-view.js';
import {g1cFilter} from '../src/g1c-production.js';
import {auditG1CSourceAction,registerG1CEvidence,G1C_APPROVED_SOURCES} from '../src/g1c-formal-source.js';

const body=(id,h)=>({id,body:true,effectiveHeightCm:h,region:'exposed',tick:0,resistance:2,provenanceRef:'review-pending',postureRef:'snapshot-pending'});
const proposal=()=>({eventId:'knocker',encounterId:'encounter-1',sourceInstanceId:'source:knocker',actionId:'action-1',tick:0,cancelled:false,provenance:'FORMAL',medium:'body',region:'exposed',targetId:'source:knocker',resistance:2,bodyRegistryComplete:true,bodies:[body('player-body',175),body('source:knocker',185)]});
// Deliberately synthetic contract input, NOT a reachable authorized encounter.
const state=()=>({tick:0,combat:{eventId:'knocker',g1cBattleId:'encounter-1',sourceId:'source:knocker',position:'exposed'}});
test('well-shaped source still has no approved GDD/action binding; caller approval cannot unlock',()=>{
 const a=proposal();a.approved=true;a.authorization='user';
 const r=auditG1CSourceAction(state(),a,'press');assert.equal(r.eligible,false);
 assert.deepEqual(r.reasons,['NO_APPROVED_GDD_SOURCE_BINDING']);assert.equal(G1C_APPROVED_SOURCES.length,0);
});
for(const [name,edit,reason] of [
 ['wrong encounter',a=>a.encounterId='other','ENCOUNTER_MISMATCH'],
 ['wrong source',a=>a.sourceInstanceId='source:other','SOURCE_INSTANCE_MISMATCH'],
 ['missing action',a=>delete a.actionId,'INVALID_ACTION_MOMENT'],
 ['stale trigger',a=>a.tick=1,'INVALID_ACTION_MOMENT'],
 ['cancelled',a=>a.cancelled=true,'INVALID_ACTION_MOMENT'],
 ['unknown medium',a=>a.medium='audio','INVALID_MEDIUM_SCOPE'],
 ['wrong region',a=>a.region='safe','INVALID_MEDIUM_SCOPE'],
 ['unknown action resistance',a=>delete a.resistance,'UNKNOWN_ACTION_RESISTANCE'],
 ['incomplete bodies',a=>a.bodyRegistryComplete=false,'INCOMPLETE_BODY_REGISTRY'],
 ['missing player',a=>a.bodies.shift(),'INCOMPLETE_BODY_REGISTRY'],
 ['duplicate body',a=>a.bodies.push(a.bodies[0]),'INCOMPLETE_BODY_REGISTRY'],
 ['unknown height',a=>delete a.bodies[0].effectiveHeightCm,'UNKNOWN_BODY_AT_TRIGGER'],
 ['stale body snapshot',a=>a.bodies[0].tick=1,'UNKNOWN_BODY_AT_TRIGGER'],
 ['missing posture source',a=>delete a.bodies[0].postureRef,'UNKNOWN_BODY_AT_TRIGGER'],
 ['unknown body resistance',a=>delete a.bodies[0].resistance,'UNKNOWN_BODY_AT_TRIGGER'],
 ['tied tallest',a=>a.bodies[0].effectiveHeightCm=185,'TIED_HIGHEST_BODY'],
 ['wrong target',a=>a.targetId='player-body','TARGET_MISMATCH'],
 ['simulation',a=>a.simulation=true,'NON_FORMAL_SOURCE']
])test('formal adapter rejects '+name+' without mutating state',()=>{
 const s=state(),a=proposal();edit(a);const before=JSON.stringify({s,a});
 const r=auditG1CSourceAction(s,a,'press');assert.equal(r.eligible,false);assert.ok(r.reasons.includes(reason));
 assert.equal(JSON.stringify({s,a}),before);assert.equal(r.recoverableByFallback,false);
});
test('fire and wind require the actual medium, never a domain weight or name alone',()=>{
 for(const k of ['fire','wind']){const a=proposal();a.domainWeight=10;a.burnable=true;const r=auditG1CSourceAction(state(),a,k);assert.ok(r.reasons.includes(k==='fire'?'UNVERIFIED_BURNABLE_MEDIUM':'UNVERIFIED_DOMAIN_ACTION'));}
});
test('shadow, isolated holder and ghost-eye simulation stay non-formal',()=>{
 for(const alter of [s=>s.combat.eventId='shadow',s=>s.g1c={testOnly:true},s=>s.combat.eyeV6={scenario:{simulation:true}}]){
  const s=state();alter(s);assert.ok(auditG1CSourceAction(s,proposal(),'press').reasons.includes('NON_FORMAL_SOURCE'));
 }
});
test('malformed proposals fail closed',()=>{
 for(const a of [null,{},[],{...proposal(),bodies:[null]}])assert.equal(auditG1CSourceAction(state(),a,'press').eligible,false);
});
test('evidence intake projects traceable pending records and drops caller approval',()=>{
 for(const classification of ['NOVEL_LEAD','CANDIDATE_PARAMETER','UNKNOWN_SOURCE']){
  const r=registerG1CEvidence({id:'review-1',ghost:'press',classification,locator:'docs/g1c-acceptance/rules-boundary-candidate.md',claim:'Pending scope review',revision:'9b2f68bb',reviewer:'round5-audit',approved:true,event:{grant:true}});
  assert.equal(r.ok,true);assert.equal(r.formal,false);assert.equal(r.status,'PENDING_REVIEW');assert.equal(r.record.approved,undefined);assert.equal(r.record.event,undefined);
 }
 assert.equal(registerG1CEvidence({classification:'APPROVED'}).ok,false);
});
function escaped(){let {s,c}=fixture({ownership:['fire','wind']});s=replay(s,c);for(const a of ['g1cp:fire:ignite','g1cp:wind:raise','combat:observe','g1cp:fire:quench','combat:retreat'])s=step(s,a,c);return {s,c};}
test('zero energy retreat binds unresolved ledger to original encounter, source and region',()=>{
 const {s,c}=escaped();const rows=g1cSceneConsequences(s);assert.equal(rows.length,1);
 const r=rows[0];assert.equal(r.eventId,'shadow');assert.equal(r.sourceInstanceId,'source:shadow');assert.equal(r.region,'exposed');assert.equal(r.state,'UNRESOLVED');assert.match(r.encounterId,/:g1c:/);
 assert.equal(s.energy,0);assert.equal(s.g1c.wind.state,'UNCONTROLLED');
 assert.deepEqual(g1cSceneConsequences(upgrade(JSON.parse(JSON.stringify(s)))),rows);assert.ok(validate(s,c));
 assert.match(g1cConsequenceView(s),/未解决的失控后果/);
});
test('rest, reload, duplicate requests and scene restart cannot resolve lost control',()=>{
 let {s,c}=escaped();const rows=g1cSceneConsequences(s),before=structuredClone(s);
 assert.deepEqual(g1cFilter(s,['enter:shadow','enter:blood','rest']),['enter:blood','rest']);
 assert.deepEqual(g1cFilter({...s,scene:'shadow'},['combat:start','retreat']),['retreat']);
 assert.equal(act(s,'g1cp:wind:resolve',c),s);
 c={...c,requestId:'rest-with-consequence'};s=step(s,'rest',c);
 assert.equal(act(s,'rest',c),s);assert.deepEqual(g1cSceneConsequences(s),rows);
 assert.equal(s.g1c.wind.state,'UNCONTROLLED');assert.ok(s.g1c.load>=before.g1c.load);
});
test('tampering with sealed consequence fails validation and cannot mutate on action',()=>{
 const {s,c}=escaped();s.g1c.events.find(e=>e.type==='lost-control').data.consequence.eventId='blood';
 assert.equal(validate(s,c),false);assert.deepEqual(available(s,c),[]);assert.equal(act(s,'rest',c),s);
});
test('old lost-control ledger remains byte-compatible and unknown location blocks optimistic re-entry',()=>{
 const s={g1c:{ownerId:'legacy',events:[{seq:1,tick:5,battleId:null,kind:'wind',type:'lost-control',data:{lastTarget:null}}]}};
 const before=JSON.stringify(s);const r=g1cSceneConsequences(s)[0];assert.equal(r.reason,'LEGACY_UNKNOWN');
 assert.equal(r.state,'UNRESOLVED');assert.equal(r.eventId,null);assert.equal(g1cSceneConsequences(s,'blood').length,1);assert.equal(JSON.stringify(s),before);
});
test('ordinary v0.24.7 has no candidate consequences or new state fields',()=>{
 const s=newGame();assert.deepEqual(g1cSceneConsequences(s),[]);assert.equal(g1cConsequenceView(s),'');assert.ok(validate(s));
});
