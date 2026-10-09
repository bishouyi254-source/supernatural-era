// World truth is deliberately separate from character research. No HP / XP ghosts.
export const stageRules=n=>['VISUAL',...(n>=2?['CONTACT']:[]),...(n>=3?['SOUND']:[])];
export function triggerRules(entity,behavior){return stageRules(entity.currentStage).filter(r=>r==='VISUAL'?behavior.visible:r==='CONTACT'?behavior.contact:behavior.sound);}
export function routeTruth(s,from,to){const n=s.hungry.world.chapter;return n>=235&&((from==='center'&&to==='north')||(from==='north'&&to==='center'))?'DISTORTED':'CONNECTED';}
export function currentHungryRoute(s,to){const x=s.hungry,r=x.routes.find(r=>r.from===x.zone&&r.to===to);return !!r&&r.validity==='CURRENT'&&s.tick-r.tick<=3&&r.observed==='CONNECTED'&&routeTruth(s,x.zone,to)==='CONNECTED';}
export function protectionFor(s,triggers,entity){const x=s.hungry,c=x.candle;if(x.protection==='SPIRIT'&&entity.currentStage<=2)return 'LIMITED';if(x.protection==='AVOID'&&!triggers.length)return 'AVOIDED';if(x.zone==='center'&&x.protection==='SHELTER'&&x.shelter.access==='AUTHORIZED'&&x.shelter.resources>0&&x.shelter.integrity>0&&triggers.every(r=>x.shelter.isolationRules.includes(r)))return 'PROTECTED';if(c.active&&c.resource>0&&entity.currentStage<=3&&!triggers.includes('SOUND'))return 'PROTECTED';return triggers.length?'EXPOSED':'AVOIDED';}
export function resolveHungryRules(s,behavior){const x=s.hungry,entities=x.manifestations.filter(m=>m.zone===x.zone&&m.state==='ACTIVE'),results=entities.map(m=>({tick:s.tick,entity:m.id,triggers:triggerRules(m,behavior),stage:m.currentStage}));const c=x.candle;
 // One physical loan, one burn per world slice; pressure follows applicable rule combinations.
 if(c.active&&c.lastSlice!==s.tick){const signatures=new Set(results.flatMap(r=>r.triggers));const amount=Math.min(c.resource,1+(signatures.has('CONTACT')?2:0)+(signatures.has('VISUAL')&&signatures.has('SOUND')?4:0));c.resource-=amount;c.consumed+=amount;c.lastSlice=s.tick;c.history.push({tick:s.tick,amount,reason:signatures.size>1?'并发触发条件叠加':'维持外围保护'});c.history=c.history.slice(-80);if(!c.resource){c.active=false;c.coverage=[];c.effectiveness='EXHAUSTED';}}
 for(const r of results){const m=entities.find(m=>m.id===r.entity);r.result=protectionFor(s,r.triggers,m);delete r.stage;if(r.result==='EXPOSED')s.life=Math.max(0,s.life-12);}
 const exposed=results.some(r=>r.result==='EXPOSED');if(c.active){c.effectiveness=exposed?'OUT_OF_SCOPE':'APPLICABLE';c.coverage=exposed?[]:['player'];}else{c.coverage=[];c.effectiveness=c.resource?'INACTIVE':'EXHAUSTED';}
 x.shelter.threatAssessment=x.protection==='SHELTER'?(exposed?'OUT_OF_SCOPE':'CONDITIONAL'):'UNKNOWN';
 x.ruleResults.push(...results);x.ruleResults=x.ruleResults.slice(-80);x.protection=null;
 if(!s.life&&s.systems.death==='alive')s.systems.death='pending';return results;
}
