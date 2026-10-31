import assert from 'node:assert/strict';
import {newGame,act,available,validate,upgrade} from '../src/engine.js';
import {ready,supported} from './v1-helpers.mjs';
export function step(s,a,trace=[]){assert.ok(available(s).includes(a),'legal '+a+' '+available(s).join(','));const next=act(s,a);assert.ok(validate(next),'valid '+a);trace.push({action:a,tick:next.tick,revival:next.spirits.find(g=>g.sourceId==='eye')?.revivalProgress,energy:next.energy});return next;}
export function legalEye(){
 // Explicit regression fixture qualification; not a normal newGame acquisition claim.
 const trace=[];let s=supported(ready(3,true));
 s.traits.constitution=3;s.lineage.potential.constitution=3;
 for(const a of ['advanced:body','v1:contact:official','v1:mission:school','v1:mission:mall','v1:mission:village','v1:mission:city','v1:buy:record','v1:certify:shadow','v1:buy:record','v1:certify:echo','v1:eye:seek','v1:eye:observe','v1:eye:verify','v1:eye:restrict','chapter:supply','v1:eye:capture','v1:facility:intel','v1:certify:eye','study:player-eye','v1:resonance:eye'])s=step(s,a,trace);
 for(let n=0;n<7;n++)s=step(s,available(s).find(a=>a.startsWith('v1:eye:research:')),trace);
 s=step(s,'v1:active:remove:player-echo',trace);s=step(s,'v1:active:add:player-eye',trace);s=step(s,'rest',trace);
 return {state:s,trace};
}
export function battle(s){return step(step(s,'enter:blood'),'combat:start');}
export function simulation(s,{kind='position',weight=2,damage=45,life,energy,revival,effects=[],rounds=3}={}){
 // Explicit rule test fixture. It is NOT a lawful player progression claim.
 s=structuredClone(s);s.combat.eyeV6.scenario={simulation:true,kind,weight,damage,observable:true,reactable:true,interruptible:kind==='preparation',stoppable:true};
 s.combat.eyeV6.effects=effects;s.ghostEyeV6.testDomainRounds=rounds;
 if(life!==undefined)s.life=life;if(energy!==undefined)s.energy=energy;if(revival!==undefined)s.spirits.find(g=>g.sourceId==='eye').revivalProgress=revival;
 // Test-only synthetic state must begin a fresh portable ledger, never spoof an existing token.
 delete s.settlement;s=upgrade(s);assert.ok(validate(s),'simulation valid');return s;
}
export {newGame,act,available,validate,upgrade};
