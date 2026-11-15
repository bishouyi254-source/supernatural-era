// Review intake only. Caller-supplied documents/flags never authorize production.
// No approved G1-C source/action mapping has been supplied for this candidate.
export const G1C_APPROVED_SOURCES=Object.freeze([]);
const text=v=>typeof v==='string'&&v.trim().length>0;
const kinds=['fire','wind','press'];
const claims=['NOVEL_LEAD','CANDIDATE_PARAMETER','UNKNOWN_SOURCE'];
export function registerG1CEvidence(input){
 try{
  if(!input||!text(input.id)||!kinds.includes(input.ghost)||!claims.includes(input.classification)
   ||!text(input.locator)||!text(input.claim)||!text(input.revision)||!text(input.reviewer))
   return {ok:false,reason:'INVALID_EVIDENCE_RECORD'};
  // Explicit projection drops approval, executable events, and other injected fields.
  return {ok:true,record:Object.freeze(Object.fromEntries(
   ['id','ghost','classification','locator','claim','revision','reviewer'].map(k=>[k,input[k]]))),status:'PENDING_REVIEW',formal:false};
 }catch{return {ok:false,reason:'INVALID_EVIDENCE_RECORD'};}
}
export function auditG1CSourceAction(s,input,ghost){
 const reasons=[];
 const reject=r=>{if(!reasons.includes(r))reasons.push(r);};
 try{
  const c=s?.combat,a=input||{};
  if(!kinds.includes(ghost))reject('UNKNOWN_GHOST');
  if(!c||!text(c.g1cBattleId)||a.encounterId!==c.g1cBattleId)reject('ENCOUNTER_MISMATCH');
  if(!c||a.eventId!==c.eventId||a.sourceInstanceId!==c.sourceId)reject('SOURCE_INSTANCE_MISMATCH');
  if(a.provenance!=='FORMAL'||a.simulation===true||s?.g1c?.testOnly||c?.eventId==='shadow'||c?.eyeV6?.scenario?.simulation)reject('NON_FORMAL_SOURCE');
  if(!text(a.actionId)||a.tick!==s?.tick||a.cancelled!==false)reject('INVALID_ACTION_MOMENT');
  if(!['domain','body','spirit'].includes(a.medium)||!text(a.region)||a.region!==c?.position||!text(a.targetId))reject('INVALID_MEDIUM_SCOPE');
  if(!Number.isFinite(a.resistance)||a.resistance<0||a.resistance>10)reject('UNKNOWN_ACTION_RESISTANCE');
  if(ghost==='fire'&&(a.medium!=='spirit'||a.burnable!==true))reject('UNVERIFIED_BURNABLE_MEDIUM');
  if(ghost==='wind'&&(a.medium!=='domain'||!Number.isFinite(a.domainWeight)||a.domainWeight<=0||a.domainWeight>10))reject('UNVERIFIED_DOMAIN_ACTION');
  let targetId=null;
  if(ghost==='press'){
   const b=a.bodies;
   if(a.medium!=='body'||a.bodyRegistryComplete!==true||!Array.isArray(b)||!b.length)reject('INCOMPLETE_BODY_REGISTRY');
   else{
    if(new Set(b.map(v=>v?.id)).size!==b.length||!b.some(v=>v.id==='player-body')||!b.some(v=>v.id===a.sourceInstanceId))reject('INCOMPLETE_BODY_REGISTRY');
    for(const v of b)if(!text(v?.id)||v.body!==true||v.region!==a.region||v.tick!==a.tick||!text(v.provenanceRef)||!text(v.postureRef)||!Number.isFinite(v.effectiveHeightCm)||v.effectiveHeightCm<=0||v.effectiveHeightCm>260||!Number.isFinite(v.resistance)||v.resistance<0||v.resistance>10)reject('UNKNOWN_BODY_AT_TRIGGER');
    if(!reasons.includes('UNKNOWN_BODY_AT_TRIGGER')){
     const highest=Math.max(...b.map(v=>v.effectiveHeightCm)),top=b.filter(v=>v.effectiveHeightCm===highest);
     if(top.length!==1)reject('TIED_HIGHEST_BODY');
     else if(top[0].id!==a.targetId)reject('TARGET_MISMATCH');else targetId=top[0].id;
    }
   }
  }
  // Approval is a code-reviewed source/action binding, never a save field.
  reject('NO_APPROVED_GDD_SOURCE_BINDING');
  return {eligible:false,ghost,reasons,targetId,recoverableByFallback:false};
 }catch{return {eligible:false,ghost,reasons:['MALFORMED_SOURCE_ACTION'],targetId:null,recoverableByFallback:false};}
}
