import assert from 'node:assert/strict';
import {newGame,upgrade,available,act,validate} from '../src/engine.js';
import {newProduction} from '../src/g1a-production.js';
import {makeSpirit,relationship} from '../src/progression.js';
import {newCombat} from '../src/combat.js';

export function step(s,a,c=null){assert.ok(available(s,c).includes(a),'available '+a);const n=act(s,a,c);assert.notEqual(n,s,'action commits '+a);assert.ok(validate(n,c),'valid '+a);assert.ok(validate(upgrade(JSON.parse(JSON.stringify(n))),c),'serialized valid '+a);return n;}
// No injected ownership, chapter, resource or knowledge state on this route.
export function lawfulBlood(trace=[]){let s=newGame('正式鬼血机制验收','学生',3,'g1a-production-legal');
 const go=a=>{const before=s;s=step(s,a);trace.push({action:a,tick:s.tick,energy:s.energy,life:s.life,spirits:s.spirits.map(g=>({id:g.id,R:g.revivalProgress})),beforeTick:before.tick});};
 for(const a of ['chapter:perimeter','chapter:advance','chapter:avoid','chapter:leave','chapter:finish','journey:mall'])go(a);
 for(let n=0;s.journey.active&&n<30;n++){const a=available(s);go(a.includes('journey:observe')?'journey:observe':a.includes('journey:finish')?'journey:finish':a.includes('journey:avoid')?'journey:avoid':'journey:advance');}
 for(const a of ['enter:blood','clue:witness','clue:power','theory:true','restrict','capture','rest'])go(a);return s;
}
let cached;
export function integrationFixture({combat=false,rope=true,shroud=true,blood=true,relations=false,build=null,event='blood'}={}){
 // This is an explicit legal-holder CONSTRUCTION, not a newGame acquisition claim.
 cached??=lawfulBlood();let s=structuredClone(cached);s.g1a.production=newProduction(s,{testOnly:true});
 const x=s.g1a.production;
 if(!blood){s.spirits=[];x.blood.actorId=null;}
 if(rope){s.spirits.push(makeSpirit('g1a-rope-candidate'));x.rope.actorId='player-g1a-rope-candidate';x.rope.control='CONTROLLED';}
 if(shroud)Object.assign(x.shroud,{sourceId:'integration-shroud-source',garmentId:'integration-shroud-garment',custodian:'player',location:'integration-storage'});
 if(relations&&s.spirits.length>1)s.relations=[relationship(s.spirits[0],s.spirits[1])];
 s.v1.build=build;delete s.settlement;s=upgrade(s);
 const c={integration:'G1A-PRODUCTION-INTEGRATION',ownerId:s.settlement.ownerId,ropeSourceId:'g1a-rope-candidate',ropeWeight:4,shroudSourceId:'integration-shroud-source',garmentId:'integration-shroud-garment',identityVerified:true,isolationVerified:true,containerVerified:true,coverage:[{ruleId:'rule:blood',actionType:'body-contact'}],shroudWeight:4};
 if(combat)s=replayBattle(s,event);
 assert.ok(validate(s,c),'constructed holder validates only with explicit test authority');return {s,c};
}
export function replayBattle(input,event='blood'){let s=structuredClone(input);s.scene=event;s.combat=newCombat(event,s);delete s.restricted[event];delete s.settlement;return upgrade(s);}
export function rebind(s){s=structuredClone(s);delete s.settlement;return upgrade(s);}
export const release='g1ap:blood:release:source:blood',contact='g1ap:rope:contact:source:blood';
export function growShroud(s,c){for(const a of ['g1ap:shroud:research:S1','g1ap:shroud:wear:confirm-risk'])s=step(s,a,c);s=replayBattle(s);for(const a of ['combat:risk','combat:observe','combat:retreat','g1ap:shroud:research:S2','g1ap:shroud:isolate','g1ap:shroud:research:S3'])s=step(s,a,c);return s;}
