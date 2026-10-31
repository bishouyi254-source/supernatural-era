import assert from 'node:assert/strict';
import {legalBlood} from './g1a-helpers.mjs';
import {newCandidate} from '../src/g1a-candidate.js';
import {makeSpirit} from '../src/progression.js';
import {newCombat} from '../src/combat.js';
import {upgrade,available,act,validate} from '../src/engine.js';
export const fixtureContext=()=>({simulation:'G1-A-SIMULATION',eventId:'SIM-G1A-1',ropeWeight:4,bloodWeight:4,enemyActionType:'body-strike',targets:[{id:'source:blood',ruleId:'rule:blood',location:'SIM-room',ropeContact:true,bindableActions:['body-strike'],bloodContact:true,bloodSuppressible:['body-strike'],recover:true,weight:3}],shroudIdentityVerified:true,shroudIsolationVerified:true,shroudContainerVerified:true,shroudCoverage:['body-strike'],shroudWeight:4});
export function candidateFixture({combat=false}={}){let s=legalBlood();s.name='G1-A明确模拟夹具';s.spirits.push(makeSpirit('g1a-rope-candidate'));s.g1a.candidate=newCandidate();const x=s.g1a.candidate;x.rope.actorId='player-g1a-rope-candidate';x.rope.control='CONTROLLED';x.blood.actorId='player-blood';Object.assign(x.shroud,{sourceId:'SIM-shroud-source',garmentId:'SIM-shroud-garment',custodian:'player',location:'SIM-safehouse'});if(combat){s.scene='blood';s.combat=newCombat('blood',s);}delete s.settlement;s=upgrade(s);const c=fixtureContext();assert.ok(validate(s,c),'candidate fixture valid');return {s,c};}
export function candidateStep(s,a,c){assert.ok(available(s,c).includes(a),'candidate legal '+a);const n=act(s,a,c);assert.ok(validate(n,c),'candidate valid '+a);return n;}
export function fixtureBattle(s){s=structuredClone(s);s.scene='blood';s.combat=newCombat('blood',s);delete s.settlement;return upgrade(s);}
