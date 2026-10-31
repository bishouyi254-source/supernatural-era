import assert from 'node:assert/strict';
import {newGame,act,available,validate} from '../src/engine.js';
import {beginBattleSettlement,advanceBattleSettlement} from '../src/settlement-live-adapter.js';

// Every fixture is reached through engine actions. Never patch life, unlocks,
// revival, capacity, seed, instances or second-spirit decisions after newGame.
export function legal(s,a,trace=[]){
 assert.ok(available(s).includes(a),'legal '+a);
 const next=act(s,a);assert.notEqual(next,s);assert.ok(validate(next),'valid '+a);
 trace.push({action:a,tick:next.tick,life:next.life,energy:next.energy,scene:next.scene,second:next.systems.second?.stage||null});return next;
}
function journey(s,id,trace){
 s=legal(s,'journey:'+id,trace);
 for(let i=0;s.journey.active&&i<30;i++){
  const a=available(s);s=legal(s,a.includes('journey:intel')?'journey:intel':a.includes('journey:observe')?'journey:observe':a.includes('journey:finish')?'journey:finish':a.includes('journey:avoid')?'journey:avoid':'journey:advance',trace);
 }
 assert.equal(s.journey.active,null);return s;
}
export function secondEntry({first='shadow',target='echo',seed=1,injured=false,critical=false}={}){
 const trace=[];let s=newGame('合法第二鬼回归','安保',seed);
 for(const a of ['chapter:perimeter','chapter:advance','chapter:avoid','chapter:leave','chapter:finish'])s=legal(s,a,trace);
 if(first==='blood')s=journey(s,'mall',trace);
 for(const a of ['enter:'+first,'clue:witness','clue:power','theory:true','restrict','capture'])s=legal(s,a,trace);
 if(!s.journey.chapters.mall.completed)s=journey(s,'mall',trace);
 s=journey(s,'club',trace);
 if(target==='headless')s=journey(s,'village',trace);
 if(s.bags===0)s=legal(s,'chapter:supply',trace);
 if(critical){for(let i=0;i<5;i++){if(s.energy===0)s=legal(s,'rest',trace);s=legal(s,'practice:'+s.spirits[0].id,trace);}assert.ok(s.spirits[0].revivalProgress>=95&&!s.crisis);}
 const hubState=structuredClone(s);
 s=legal(s,'enter:'+target,trace);
 if(injured){s=legal(s,'risk',trace);s=legal(s,'risk',trace);assert.ok(s.life>0&&s.life<40);}
 return {state:s,hubState,trace};
}
export function encounter(options={}, {callAbility=false}={}){
 const entry=secondEntry(options),before=entry.state;
 let state=legal(before,'combat:start',entry.trace),session=beginBattleSettlement(state,{before});
 const ledger={state,session,record:null,baseline:before,trace:entry.trace};
 if(callAbility)advance(ledger,'combat:ability:'+before.spirits[0].id);
 for(const a of ['combat:observe','combat:observe','combat:observe','combat:restrict'])advance(ledger,a);
 return ledger;
}
export function advance(ledger,a){
 const next=legal(ledger.state,a,ledger.trace),r=advanceBattleSettlement(ledger.session,ledger.state,next,a);
 Object.assign(ledger,{state:next,session:r.session,record:r.record});return ledger;
}
export function implant(ledger,mode='implant'){
 for(const a of ['second:begin','second:match:mutual','second:'+mode])advance(ledger,a);return ledger;
}
