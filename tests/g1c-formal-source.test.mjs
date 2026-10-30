import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validate,available} from '../src/engine.js';
import {newCombat} from '../src/combat.js';
import {events} from '../src/content.js';
import {inspectG1CFormalSource,formalG1CReady,G1C_FORMAL_REQUIRED} from '../src/g1c-formal-source.js';

const createEncounter=(id='shadow')=>{const s=newGame('formal-source-provenance');s.scene=id;s.combat=newCombat(id,s);s.combat.position='exposed';return s;};
test('ordinary newGame cannot conjure any G1-C formal source or ghost ownership',()=>{
 const s=newGame();const v=inspectG1CFormalSource(s);
 assert.equal(v.kind,'NO_ENCOUNTER');
 assert.deepEqual(v.eligible,{fire:false,wind:false,press:false});
 assert.equal(s.spirits.length,0);
 assert.ok(validate(s));
 assert.equal(available(s).some(a=>a.startsWith('g1cp:')),false);
});
test('all currently authored events lack a G1-C formal domain/height/burn qualification',()=>{
 const covered=[];
 for(const id of Object.keys(events)){
  const s=createEncounter(id);const v=inspectG1CFormalSource(s);
  assert.deepEqual(v.eligible,{fire:false,wind:false,press:false},id);
  for(const k of ['fire','wind','press'])assert.equal(formalG1CReady(s,k),false,id+':'+k);
  covered.push(id);
 }
 assert.ok(covered.includes('shadow'));
 assert.ok(covered.includes('knocker'));
});
test('real school audio declaration remains audio, NOT a domain/body/ghost-fire grant',()=>{
 const s=createEncounter('knocker');s.combat.nativeSchool=true;
 s.school.started=true;s.school.participated=true;
 const v=inspectG1CFormalSource(s);
 assert.equal(v.kind,'FORMAL_AUDIO_PROPAGATION');
 assert.match(v.origin,/KNOCKER_DECLARATION/);
 assert.match(v.reason,/音频/);
 assert.deepEqual(v.eligible,{fire:false,wind:false,press:false});
});
test('forged domain/height saved in combat state cannot be upgraded to formal source',()=>{
 const s=createEncounter('shadow');
 s.combat.domainWeight=10;s.combat.action={type:'domain',targetRegion:'exposed',sourceId:'source:shadow',damage:9};
 s.combat.heightCm=199;s.combat.body=true;
 const v=inspectG1CFormalSource(s);
 assert.equal(v.kind,'UNTYPED_EVENT');
 assert.deepEqual(v.eligible,{fire:false,wind:false,press:false});
 s.combat.sourceId='source:wrong';
 assert.equal(inspectG1CFormalSource(s).kind,'INVALID_SOURCE');
});
test('a simulated ghost-eye domain never counts as formal opponent action',()=>{
 const s=createEncounter('shadow');
 s.combat.eyeV6={scenario:{simulation:true,kind:'domain',domainWeight:9}};
 assert.equal(inspectG1CFormalSource(s).kind,'SIMULATED_INTENT');
 assert.equal(formalG1CReady(s,'wind'),false);
});
test('G1-C formal prerequisites remain explicit and must not be inferred from source names',()=>{
 for(const k of ['fire','wind','press']){
  assert.ok(G1C_FORMAL_REQUIRED[k].length>=4);
  assert.equal(Object.isFrozen(G1C_FORMAL_REQUIRED[k]),true);
 }
});
