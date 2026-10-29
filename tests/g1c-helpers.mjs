import assert from 'node:assert/strict';
import {newGame,upgrade,validate,available,act} from '../src/engine.js';
import {makeSpirit} from '../src/progression.js';
import {newCombat} from '../src/combat.js';
import {newG1C} from '../src/g1c-production.js';
export const target=(data={})=>({id:'source:shadow',heightCm:185,faction:'enemy',region:'exposed',body:true,spirit:true,ruleWeight:2,domainWeight:2,action:{type:'domain',targetRegion:'exposed',damage:8},...data});
export function fixture({ownership=['fire'],extra=[],targets=[target()],build=null,playerHeightCm=175,playerRuleWeight=1}={}){
 let s=newGame('G1-C ISOLATED ONLY','学生',3);s.spirits=[...ownership.map(k=>makeSpirit('ghost-'+k)),...extra.map(makeSpirit)];s.v1.build=build;
 s.v1.active=s.spirits.slice(0,2).map(g=>g.id);
 const c={g1cIntegration:'G1C-PRODUCTION',ownerId:s.settlement.ownerId,ownership,targets,playerHeightCm,playerRuleWeight};
 s.g1c=newG1C(s,c);delete s.settlement;s=upgrade(s);assert.ok(validate(s,c),'initial holder valid');return {s,c};
}
export function replay(s,c){s=structuredClone(s);s.scene='shadow';s.combat=newCombat('shadow',s);s.combat.position='exposed';delete s.restricted.shadow;delete s.settlement;s=upgrade(s);assert.ok(validate(s,c),'isolated replay valid');return s;}
export function step(s,a,c){assert.ok(available(s,c).includes(a),'available '+a+' : '+available(s,c));const n=act(s,a,c);assert.notEqual(n,s,'committed '+a);assert.ok(validate(n,c),'valid '+a);assert.ok(validate(upgrade(JSON.parse(JSON.stringify(n))),c),'roundtrip '+a);return n;}
export function cycle(s,c,k){s=replay(s,c);s=step(s,`g1cp:${k}:${{fire:'ignite',wind:'raise',press:'fall'}[k]}`,c);s=step(s,'combat:observe',c);s=step(s,`g1cp:${k}:${{fire:'quench',wind:'calm',press:'lift'}[k]}`,c);s=step(s,'combat:retreat',c);return step(s,'rest',c);}
