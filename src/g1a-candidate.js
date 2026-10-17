// G1-A design supplement candidate. No story permission is inferred from a save.
// The explicit simulation context is supplied by the isolated QA harness only.
import {growthFor,settleSpirits,revivalCrisisFor} from './spirits.js';
import {ruleContest} from './rules.js';
import {activeIds} from './v1.js';
import {ruleBlocked} from './evolution-model.js';
const contexts=new WeakMap();
export const candidateEnabled=c=>c?.simulation==='G1-A-SIMULATION';
export const useCandidateContext=(s,c)=>{if(candidateEnabled(c))contexts.set(s,c);};
export const prepareCandidateAction=(s,c)=>{if(s.g1a?.candidate&&candidateEnabled(c)&&s.combat&&!s.combat.g1aNodeId)s.combat.g1aNodeId=s.settlement.active?.encounterId||`simulation:${s.settlement.ownerId}:${s.tick}`;};
export const recordCandidateRequest=(s,c)=>{if(s.g1a?.candidate&&candidateEnabled(c)&&c.requestId&&!s.g1a.candidate.completed.includes(c.requestId))s.g1a.candidate.completed.push(c.requestId);};
export function candidateIntent(s,r,intent){const c=contexts.get(s);return candidateEnabled(c)&&c.targets?.some(t=>t.id===r.instanceId&&t.ruleId===r.id)?{...intent,targetId:r.instanceId,ruleId:r.id,actionType:c.enemyActionType,weight:intent?.weight??r.weight}:intent;}
const context=s=>contexts.get(s);
export const candidateCosts=Object.freeze({contact:[1,2,1],bind:[1,4,2],release:[1,2,1],suppress:[1,5,3],recover:[1,3,1]});
export const newCandidate=()=>({format:1,persistentLoad:0,completed:[],lastNode:null,sequence:0,events:[],
 rope:{actorId:null,control:'SEALED',manifestation:null,stage:0,evidence:[],history:[],necessaryRelation:null,event:null,cooldownUntil:0},
 blood:{actorId:null,stage:0,media:[],evidence:[],sequence:0},
 shroud:{sourceId:null,garmentId:null,custodian:null,location:null,wearer:null,wearerType:null,exempt:false,erosion:0,stage:0,evidence:[],protectionNodes:[],crisis:false}});
const own=(s,id)=>s.spirits.find(g=>g.id===id);
const callable=(s,id)=>own(s,id)&&activeIds(s).includes(id)&&!ruleBlocked(s,id)&&!s.systems.combinations.some(v=>v.disabledId===id);
const target=(s,id)=>context(s)?.targets?.find(t=>t.id===id);
const evidence=(list,eventId,ruleId,result,node)=>{const id=[eventId,ruleId,result].join('|');if(!list.some(e=>e.id===id))list.push({id,eventId,ruleId,result,node});};
const node=s=>s.combat?`combat:${battle(s)}:${s.combat.turn}`:`world:${s.tick}`;
const battle=s=>s.combat?.g1aNodeId||s.settlement.active?.encounterId||`simulation:${s.settlement.ownerId}:${s.tick}`;
const safe=s=>s.scene==='hub'&&!s.combat&&s.systems.death==='alive'&&!s.crisis;
function affordable(s,id,verb){const g=own(s,id),cost=candidateCosts[verb];if(!callable(s,id)||!cost||s.energy<cost[0])return false;const p=structuredClone(s);p.g1a.candidate.persistentLoad+=cost[2];return g.revivalProgress+growthFor(p,g,true,0,cost[1])<100;}
export function candidateAvailable(s,c){
 const x=s.g1a?.candidate;if(!x||!candidateEnabled(c)||s.systems.death!=='alive')return [];
 if(x.shroud.crisis)return c.shroudIsolationVerified&&c.shroudContainerVerified?['g1ac:shroud:isolate']:[];
 if(s.crisis)return [];
 useCandidateContext(s,c);const out=[],r=x.rope,b=x.blood,h=x.shroud,ropeControlled=r.control==='CONTROLLED'&&(!r.necessaryRelation||c.validControlRelations?.includes(r.necessaryRelation))&&!c.releaseRopeSource;
 if(s.combat&&!s.combat.eyeV6?.pending){
  if(ropeControlled&&own(s,r.actorId)&&!r.manifestation&&affordable(s,r.actorId,'contact'))for(const t of c.targets||[])if(t.id===s.combat.sourceId&&t.ropeContact===true)out.push('g1ac:rope:contact:'+t.id);
  if(ropeControlled&&r.stage>=2&&r.manifestation&&r.manifestation.state==='CONTACT'&&s.combat.turn>=r.cooldownUntil&&affordable(s,r.actorId,'bind')){const t=target(s,r.manifestation.targetId);if(t?.bindableActions?.length)out.push('g1ac:rope:bind:'+t.id);}
  if(own(s,b.actorId)&&!b.media.some(m=>['CONTROLLED','AT_RISK'].includes(m.state))&&affordable(s,b.actorId,'release'))for(const t of c.targets||[])if(t.id===s.combat.sourceId&&t.bloodContact===true)out.push('g1ac:blood:release:'+t.id);
  if(own(s,b.actorId))for(const m of b.media.filter(m=>['CONTROLLED','AT_RISK'].includes(m.state))){const t=target(s,m.targetId);if(c.severBloodControl===true||t?.controlReachable===false)continue;if(t?.bloodSuppressible?.length&&affordable(s,b.actorId,'suppress'))out.push('g1ac:blood:suppress:'+m.id);if(t?.recover===true&&!t.isolationBlocksRecovery&&affordable(s,b.actorId,'recover'))out.push('g1ac:blood:recover:'+m.id);}
 }
 if(safe(s)){
  if(r.stage===0&&r.evidence.some(e=>e.result==='contact')&&r.evidence.some(e=>e.result==='ended'))out.push('g1ac:rope:research:R1');
  if(r.stage===1&&r.evidence.some(e=>e.result==='bindable-rule'))out.push('g1ac:rope:research:R2');
  if(b.stage===0&&b.evidence.some(e=>e.result==='released')&&b.evidence.some(e=>['suppressed','boundary'].includes(e.result)))out.push('g1ac:blood:research:B1');
  if(b.stage===1&&b.evidence.some(e=>e.result==='exposed')&&b.evidence.some(e=>e.result==='recovered'))out.push('g1ac:blood:research:B2');
  if(h.sourceId&&h.custodian==='player'&&h.stage===0&&c.shroudIdentityVerified)out.push('g1ac:shroud:research:S1');
  if(h.stage===1&&h.evidence.some(e=>e.result==='protected'))out.push('g1ac:shroud:research:S2');
  if(h.stage===2&&h.evidence.some(e=>e.result==='erosion')&&c.shroudIsolationVerified)out.push('g1ac:shroud:research:S3');
  if(h.sourceId&&h.custodian==='player'&&!h.wearer&&h.erosion<100&&h.stage>=1&&c.shroudIsolationVerified&&c.shroudContainerVerified)out.push('g1ac:shroud:wear:confirm-risk');
  if(h.wearer&&c.shroudIsolationVerified&&c.shroudContainerVerified)out.push('g1ac:shroud:isolate');
 }
 // R3/B3/S4 have no approved story/puzzle event and are never emitted here.
 return out;
}
function pay(s,id,verb){const cost=candidateCosts[verb];s.energy-=cost[0];s.g1a.candidate.persistentLoad+=cost[2];return {used:id,usage:cost[1]};}
export function applyCandidate(s,action,c){
 useCandidateContext(s,c);const x=s.g1a.candidate,[,kind,verb,...parts]=action.split(':'),id=parts.join(':'),r=x.rope,b=x.blood,h=x.shroud;let result={used:null,usage:0};
 if(verb==='research'){
  const g={rope:r,blood:b,shroud:h}[kind];g.stage++;s.journal.push('【模拟候选】完成独立证据研究 '+id+'；不发鬼、不撤销永久后果。');return result;
 }
 if(kind==='rope'){
  const t=target(s,id);result=pay(s,r.actorId,verb);
  if(verb==='contact'){
   const success=ruleContest(c.ropeWeight??0,t.weight)!=='failed';
   if(success){r.manifestation={state:'CONTACT',targetId:id,ruleId:t.ruleId,battleId:battle(s),createdNode:node(s),remaining:2,boundAction:null};evidence(r.evidence,c.eventId,t.ruleId,'contact',node(s));if(t.bindableActions?.length)evidence(r.evidence,c.eventId,t.ruleId,'bindable-rule',node(s));}
   r.history.push({node:node(s),targetId:id,result:success?'contact':'failed',reason:null});
  }else if(verb==='bind'){
   r.cooldownUntil=s.combat.turn+3;const success=ruleContest(c.ropeWeight??0,t.weight)!=='failed';
   if(success){r.manifestation.state='RESTRAINT';r.manifestation.boundAction=t.bindableActions[0];evidence(r.evidence,c.eventId,t.ruleId,'bound',node(s));}
   r.history.push({node:node(s),targetId:id,result:success?'bound':'failed',reason:null});
  }
 }else if(kind==='blood'){
  result=pay(s,b.actorId,verb);
  if(verb==='release'){
   const t=target(s,id),success=ruleContest(c.bloodWeight??0,t.weight)!=='failed';
   if(success){const g=own(s,b.actorId);b.media.push({id:'g1a-blood-medium-'+ ++b.sequence,sourceId:g.sourceId,actorId:g.id,targetId:id,location:t.location||s.scene,eventId:c.eventId,ruleId:t.ruleId,createdNode:node(s),createdTick:s.tick,E:0,W:g.revivalProgress,state:'CONTROLLED',recoverable:true,suppression:null});evidence(b.evidence,c.eventId,t.ruleId,'released',node(s));}
  }else{
   const m=b.media.find(m=>m.id===id),t=target(s,m.targetId);
   if(verb==='suppress'){const success=ruleContest(c.bloodWeight??0,t.weight)!=='failed';if(success)m.suppression=t.bloodSuppressible[0];else evidence(b.evidence,c.eventId,t.ruleId,'boundary',node(s));}
   if(verb==='recover'){const success=ruleContest(c.bloodWeight??0,t.recoveryWeight??0)!=='failed';if(success){m.state='RECOVERED';m.recoverable=false;m.suppression=null;evidence(b.evidence,c.eventId,t.ruleId,'recovered',node(s));}}
  }
 }else if(kind==='shroud'){
  if(verb==='wear'){h.wearer='player';h.wearerType='HUMAN';h.exempt=false;evidence(h.evidence,c.eventId,h.sourceId,'worn',node(s));}
  if(verb==='isolate'&&c.shroudIsolationSucceeds!==false){h.wearer=null;h.wearerType=null;h.location='sealed-container';h.crisis=false;settleSpirits(s,null,null,{},false);evidence(h.evidence,c.eventId,h.sourceId,'isolated',node(s));}
 }
 s.journal.push('【模拟候选】'+action+'；合法失败仍支付发动代价，永久复苏与负荷不回退。');return result;
}
function endRope(s,reason){const r=s.g1a.candidate.rope,m=r.manifestation;if(!m)return;r.history.push({node:node(s),targetId:m.targetId,result:'ended',reason});evidence(r.evidence,context(s)?.eventId||'SIMULATION',m.ruleId,'ended',node(s));r.manifestation=null;}
function uncontrolledRope(s,reason){const r=s.g1a.candidate.rope;if(r.control==='UNCONTROLLED')return;endRope(s,reason);r.control='UNCONTROLLED';r.event={id:'g1a-rope-source-event',sourceId:own(s,r.actorId)?.sourceId||r.actorId,reason,state:'UNRESOLVED'};}
export function candidateEnemy(s,intent){
 const c=context(s),x=s.g1a?.candidate;if(!candidateEnabled(c)||!x||!intent?.actionType||!intent.targetId)return false;
 const t=target(s,intent.targetId);if(!t||t.ruleId!==intent.ruleId)return false;
 const r=x.rope,m=r.manifestation;
 if(r.control==='CONTROLLED'&&m?.state==='RESTRAINT'&&m.targetId===intent.targetId&&m.boundAction===intent.actionType){endRope(s,'eligible-action-consumed');return true;}
 for(const medium of x.blood.media)if(['CONTROLLED','AT_RISK'].includes(medium.state)&&medium.targetId===intent.targetId&&medium.suppression===intent.actionType){medium.suppression=null;evidence(x.blood.evidence,c.eventId,t.ruleId,'suppressed',node(s));return true;}
 const h=x.shroud;
 if(h.wearer==='player'&&c.shroudCoverage?.includes(intent.actionType)){
  const success=ruleContest(c.shroudWeight??0,intent.weight)!=='failed';evidence(h.evidence,c.eventId,t.ruleId,success?'protected':'protection-failed',node(s));
  if(success){const key=node(s);if(!h.exempt&&!h.protectionNodes.includes(key)){h.erosion=Math.min(100,h.erosion+12);h.protectionNodes.push(key);}return true;}
 }
 return false;
}
export function advanceCandidate(before,s,action,c){
 const x=s.g1a?.candidate;if(!x||!candidateEnabled(c))return;useCandidateContext(s,c);
 if(s.combat?.eyeV6?.pending)return;
 const token=before.combat&&s.combat?`battle:${battle(s)}:${s.combat.turn}`:`world:${s.tick}`;
 if(x.lastNode===token)return;x.lastNode=token;const r=x.rope,b=x.blood,h=x.shroud;
 const g=own(s,r.actorId);
 if(r.control==='CONTROLLED'&&(g&&revivalCrisisFor(s,g)||r.necessaryRelation&&c.validControlRelations?.includes(r.necessaryRelation)!==true||c.releaseRopeSource===true))uncontrolledRope(s,g&&revivalCrisisFor(s,g)?'independent-revival':'control-severed');
 if(r.manifestation){if(!s.combat||r.manifestation.battleId!==battle(s))endRope(s,'battle-ended');else if(--r.manifestation.remaining<=0)endRope(s,'expired');}
 for(const m of b.media){
  if(['RECOVERED','UNCONTROLLED_SOURCE'].includes(m.state))continue;
  const actor=own(s,m.actorId),t=target(s,m.targetId);
  if(m.state==='SEVERED'){m.state='UNCONTROLLED_SOURCE';m.recoverable=false;m.suppression=null;m.event={id:m.id+':uncontrolled',sourceId:m.sourceId,actorId:m.actorId,state:'UNRESOLVED'};continue;}
  if(!actor){m.state='SEVERED';m.recoverable=false;m.suppression=null;continue;}
  const R=actor.revivalProgress;if(m.createdTick!==s.tick){m.E++;evidence(b.evidence,m.eventId,m.ruleId,'exposed',token);}
  m.W=Math.max(m.W,R+12*m.E);m.state=m.W>=100?'UNCONTROLLED_SOURCE':m.W>=85?'AT_RISK':'CONTROLLED';if(m.state==='UNCONTROLLED_SOURCE'){m.recoverable=false;m.suppression=null;m.event={id:m.id+':uncontrolled',sourceId:m.sourceId,actorId:m.actorId,state:'UNRESOLVED'};}
  else if(c.severBloodControl===true||t?.controlReachable===false){m.state='SEVERED';m.recoverable=false;m.suppression=null;}
 }
 if(h.wearer&&h.wearerType==='HUMAN'&&!h.exempt){h.erosion=Math.min(100,h.erosion+8);evidence(h.evidence,c.eventId,h.sourceId,'erosion',token);}
 if(h.wearer&&h.erosion>=100){h.crisis=true;s.crisis=true;s.journal.push('【模拟候选】寿衣侵蚀危机：普通穿戴行动停止；需要正式隔离处置规则。');}
 x.sequence++;x.events.push({id:x.sequence,node:token,action,tick:s.tick});if(x.events.length>200)x.events.shift();
}
export function validCandidate(s,c){
 const x=s.g1a?.candidate;if(x===undefined)return true;if(!candidateEnabled(c))return false;
 try{const nonneg=n=>Number.isFinite(n)&&n>=0,unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
 if(x.format!==1||!nonneg(x.persistentLoad)||!Number.isInteger(x.sequence)||!unique(x.completed)||x.completed.some(v=>typeof v!=='string')||!Array.isArray(x.events)||x.events.length>200)return false;
 const r=x.rope,b=x.blood,h=x.shroud,knownBlood=b.actorId==='player-blood'&&(own(s,b.actorId)?.sourceId==='blood'||s.systems.sealed.includes('blood'));if(!['SEALED','CONTROLLED','UNCONTROLLED','RECONTAINED'].includes(r.control)||![0,1,2,3].includes(r.stage)||r.actorId&&own(s,r.actorId)?.sourceId!=='g1a-rope-candidate'||b.actorId&&!knownBlood||r.manifestation&&(!['CONTACT','RESTRAINT'].includes(r.manifestation.state)||![1,2].includes(r.manifestation.remaining)||r.control!=='CONTROLLED'))return false;
 if(![0,1,2,3].includes(b.stage)||!Array.isArray(b.media)||new Set(b.media.map(m=>m.id)).size!==b.media.length||b.media.filter(m=>['CONTROLLED','AT_RISK'].includes(m.state)).length>1)return false;
 for(const m of b.media)if(!['CONTROLLED','AT_RISK','SEVERED','UNCONTROLLED_SOURCE','RECOVERED'].includes(m.state)||!Number.isInteger(m.E)||m.E<0||!nonneg(m.W)||m.W>100&&m.state!=='UNCONTROLLED_SOURCE'||m.state==='UNCONTROLLED_SOURCE'&&m.recoverable||m.actorId!==b.actorId)return false;
 if(![0,1,2,3,4].includes(h.stage)||!nonneg(h.erosion)||h.erosion>100||h.wearer&&!h.sourceId||typeof h.exempt!=='boolean'||h.exempt&&(h.wearerType!=='AUTHORIZED_GHOST'||!c.authorizedGhostWearers?.includes(h.wearer)))return false;
 for(const v of [r,b,h])if(!Array.isArray(v.evidence)||new Set(v.evidence.map(e=>e.id)).size!==v.evidence.length)return false;
 return true;}catch{return false;}
}
