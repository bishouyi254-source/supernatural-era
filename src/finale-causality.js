const allowed=['sourcePosition','attemptState','localThreat'];
// Explicit source-specific whitelist. Never restores an entire game or any inventory/history.
export function exceptionalReversion(input,authorization){
 const x=input.finale;if(x.transactions.some(t=>t.id==='H20-TEMPORAL-01'))return input;
 if(authorization?.sourceId!=='H19-SOURCE'||authorization.id!=='H20-TEMPORAL-01'||authorization.scope!=='SCHOOL_CONTACT'||authorization.referenceId!=='H20-FIRST-CONTACT'||x.chapter!==272||x.current.attemptState!=='FAILED'||JSON.stringify(authorization.fields)!==JSON.stringify(allowed))throw Error('时间规则授权不匹配');
 const s=structuredClone(input),f=s.finale,before=structuredClone(f.current);
 f.current={sourcePosition:'SCHOOL_APPROACH',attemptState:'FAILED',localThreat:'ACTIVE'};
 f.transactions.push({id:authorization.id,sourceId:authorization.sourceId,referenceId:authorization.referenceId,scope:authorization.scope,allowedFields:allowed.slice(),status:'COMMITTED',before,after:structuredClone(f.current),tick:s.tick,retained:['历史复苏','玩家物品消耗','其他区域救援','命运','资产归属','因果纪事']});
 f.causal.push({id:'H20-REVERSION',chapter:272,tick:s.tick,kind:'EXCEPTIONAL_REVERSION',transaction:authorization.id});
 f.awareness.yang.push(authorization.id);
 // Player awareness is earned by local observation. Wang learns later through actual Yang communication.
 if(f.strategy.role==='PERIPHERY'&&f.strategy.checkedAt!==null&&s.tick-f.strategy.checkedAt<=6)f.awareness.player.push(authorization.id);
 return s;
}
export function sourceConstraint(x){return {assetValid:x.artifact.valid&&x.artifact.holder==='CANON-YANG'&&x.artifact.authorizedUser==='CANON-YANG',applicable:x.source.id==='H19-SOURCE',interferenceHandled:x.transactions.length===1&&x.current.attemptState==='REVISED',stableWindow:x.chapter>=272&&x.current.sourcePosition==='CONTACT_POINT'};}
// Returns a whole new state; callers install it only after all preconditions succeed.
export function commitContainment(input){const x=input.finale;if(x.resolution)return input;const c=sourceConstraint(x);if(!Object.values(c).every(Boolean))throw Error('关押规则未满足');
 const s=structuredClone(input),f=s.finale;
 f.source.state='CONTAINED';f.source.restriction='VERIFIED';f.current.attemptState='CONTAINED';f.incident='RESOLVING';f.city='RECOVERING';f.ambient='RECEDING';
 f.custody.holder='CANON-YANG';f.custody.transfers.push({id:'H20-CAPTURE',from:null,to:'CANON-YANG',tick:s.tick});
 f.entities=s.hungry.manifestations.map(m=>({id:m.id,state:m.state==='LIMITED'?'LIMITED':m.kind==='MANIFESTATION'?'REASSESS':'UNVERIFIED',tick:s.tick}));
 for(const z of Object.values(f.recovery.zones)){z.environment='RECEDING';z.social='RECOVERING';z.supernatural='REASSESS';z.transport='UNKNOWN';z.checkedAt=null;}
 f.recovery.tasks=['核验各区道路','复查残余异常','追查失联人员','维护幸存者联系'];
 f.resolution={id:'H20-CONTAINMENT-01',sourceId:'H19-SOURCE',tick:s.tick,actor:'CANON-YANG',constraints:c,contributions:f.contributions.map(c=>c.id)};
 f.causal.push({id:'H20-CONTAINMENT',chapter:272,tick:s.tick,kind:'CONTAINMENT'});return s;
}
