import assert from 'node:assert/strict';
import {newGame,upgrade,act,available,validate} from '../src/engine.js';
import {newG1B,prepareG1B} from '../src/g1b-production.js';
import {makeSpirit} from '../src/progression.js';
import {newCombat} from '../src/combat.js';
export function participant(overrides={}){return {id:'test:actor:1',faction:'enemy',identity:'测试参与者甲',disclosed:true,region:'exposed',facing:'away-from-player',hearing:true,behavior:'turn',body:true,bodyResistance:1,domainWeight:2,ruleWeight:2,damage:1,attackTarget:'body',resetFacing:true,route:[],bodyDamage:0,ruleStrikes:0,...overrides};}
export function fixture({ownership=['tablet'],actors=[participant()],tablet={},build=null}={}){
 let s=newGame('G1-B隔离构造（非获取）','学生',3);s.spirits=ownership.map(makeSpirit);s.v1.build=build;
 const c={g1bIntegration:'G1B-PRODUCTION',ownerId:s.settlement.ownerId,ownership,regions:['safe','exposed'],links:[['safe','exposed']],participants:actors,playerBodyResistance:0,
  tablet:{sourceId:'test:tablet:006',ownerId:s.settlement.ownerId,exists:true,bodyId:'test:player:original-body',returnQualification:'TEST_ONLY_RETURN_CONTEST',returnReachable:true,returnWeight:3,opposition:2,...tablet}};
 s.g1b=newG1B(s,c);delete s.settlement;s=upgrade(s);return {s,c};
}
export function replay(input,c){let s=structuredClone(input);s.scene='blood';s.combat=newCombat('blood',s);delete s.restricted.blood;delete s.settlement;s=upgrade(s);prepareG1B(s,c);delete s.settlement;s=upgrade(s);assert.ok(validate(s,c),'replay fixture valid');return s;}
export function step(s,a,c){assert.ok(available(s,c).includes(a),'available '+a+' in '+JSON.stringify(available(s,c)));const n=act(s,a,c);assert.notEqual(n,s,'commits '+a);assert.ok(validate(n,c),'valid after '+a);assert.ok(validate(upgrade(JSON.parse(JSON.stringify(n))),c),'roundtrip '+a);return n;}
export function rest(s,c){if(s.combat)s=step(s,'combat:retreat',c);return step(s,'rest',c);}
export function tabletL1(){let {s,c}=fixture();s=replay(s,c);for(const a of ['g1bp:tablet:inspect','g1bp:tablet:shift','g1bp:tablet:return'])s=step(s,a,c);s=rest(s,c);s=step(s,'g1bp:tablet:research:1',c);return {s,c};}
export function callerH1(){let {s,c}=fixture({ownership:['caller'],actors:[participant(),participant({id:'test:actor:2',identity:'测试参与者乙'})]});s=replay(s,c);s=step(s,'combat:observe',c);s=step(s,'g1bp:caller:call:test:actor:1',c);s=rest(s,c);s=step(s,'g1bp:caller:research:1',c);return {s,c};}
export function smokeY1(){let {s,c}=fixture({ownership:['smoke'],actors:[participant({region:'safe',route:['safe','safe','exposed','safe']})]});s=replay(s,c);for(const a of ['g1bp:smoke:release','combat:observe','combat:observe','combat:observe','g1bp:smoke:gather'])s=step(s,a,c);s=rest(s,c);s=step(s,'g1bp:smoke:research:1',c);return {s,c};}
