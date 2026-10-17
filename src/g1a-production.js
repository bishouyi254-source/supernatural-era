// Production mechanics. Test ownership is explicitly quarantined; it is never a story grant.
import {growthFor,revivalCrisisFor} from './spirits.js';
import {ruleContest,ruleFor} from './rules.js';
import {events} from './content.js';
import {activeIds,v1Ward} from './v1.js';
import {ruleBlocked,effectiveRelations} from './evolution-model.js';

export const G1A_COSTS=Object.freeze({contact:Object.freeze([1,2,1]),bind:Object.freeze([1,4,2]),release:Object.freeze([1,2,1]),suppress:Object.freeze([1,5,3]),recover:Object.freeze([1,3,1])});
export const BLOOD_EXPOSURE_COEFFICIENT=10;
export const SHROUD_RULES=Object.freeze({revision:'G1A-3-6',time:3,protection:6,warning:40,high:75,crisis:100,isolation:25});
const contexts=new WeakMap();
const own=(s,id)=>s.spirits.find(g=>g.id===id);
export const integrationAllowed=(s,c)=>c?.integration==='G1A-PRODUCTION-INTEGRATION'&&c.ownerId===s.settlement?.ownerId;
export const productionAllowed=(s,c)=>!s.g1a?.production?.testOnly||integrationAllowed(s,c);
export function newProduction(s,{testOnly=false}={}) {return {format:2,testOnly,load:0,lastNode:null,sequence:0,events:[],completed:[],
 rope:{actorId:null,control:'SEALED',relation:null,stage:0,load:0,evidence:[],manifestation:null,history:[],cooldownUntil:0,event:null},
 blood:{actorId:own(s,'player-blood')?.sourceId==='blood'?'player-blood':null,stage:0,load:0,evidence:[],sequence:0,media:[]},
 shroud:{sourceId:null,garmentId:null,custodian:null,location:null,wearer:null,stage:0,erosion:0,peak:0,crisis:false,session:0,effective:0,settledSession:0,evidence:[],protectionNodes:[]}};}
export const productionState=s=>s.g1a?.production||newProduction(s);
export function prepareProduction(s,c,activate=false){
 if(!productionAllowed(s,c)||s.g1a?.candidate)return;
 if(activate&&!s.g1a.production&&own(s,'player-blood'))s.g1a.production=newProduction(s);
 if(s.g1a.production){contexts.set(s,c);if(s.combat&&!s.combat.g1aNodeId)s.combat.g1aNodeId=s.settlement.active?.encounterId||`${s.settlement.ownerId}:${s.settlement.nextEncounter}:${s.tick}`;}
}
const battle=s=>s.combat?.g1aNodeId||s.settlement.active?.encounterId||`${s.settlement.ownerId}:${s.settlement.nextEncounter}`;
const node=s=>s.combat?`${battle(s)}:turn:${s.combat.turn}`:`world:${s.tick}`;
const fact=(v,s,result,ruleId,ref=null)=>{const id=[node(s),result,ruleId,ref].join('|');if(!v.evidence.some(e=>e.id===id))v.evidence.push({id,node:node(s),tick:s.tick,result,ruleId,ref});};
const enabled=(s,id)=>!!own(s,id)&&activeIds(s).includes(id)&&!ruleBlocked(s,id)&&!revivalCrisisFor(s,own(s,id))&&!s.systems.combinations.some(x=>x.disabledId===id);
function sourceControlled(s,r,c){return r.control==='CONTROLLED'&&integrationAllowed(s,c)&&c.ropeSourceId===own(s,r.actorId)?.sourceId&&!revivalCrisisFor(s,own(s,r.actorId))&&(!r.relation||effectiveRelations(s).some(v=>[v.spiritA,v.spiritB].includes(r.actorId)&&[v.spiritA,v.spiritB].includes(r.relation)&&(v.spiritA===r.actorId?v.suppressionBtoA:v.suppressionAtoB)>0));}
const controlled=(s,r,c)=>sourceControlled(s,r,c)&&enabled(s,r.actorId);
// Evidence-backed physical carrier mapping. This does not assert every medium is bindable.
export const carrierRules=Object.freeze({blood:{contact:true,action:'body-contact',bind:true,suppress:true},shadow:{contact:true,action:'visual-tracking',bind:false,suppress:false},echo:{contact:true,action:'audio-response',bind:false,suppress:false},watch:{contact:true,action:'audio-response',bind:false,suppress:false}});
export function productionTarget(s,id=s.combat?.sourceId){
 const eventId=id?.startsWith('source:')?id.slice(7):null,cap=carrierRules[eventId],e=events[eventId];
 if(!e||!cap)return null;const r=ruleFor(eventId,e);
 return {id,ruleId:r.id,eventId,action:cap.action,weight:r.weight,...cap};
}
function affordable(s,x,id,verb){if(!enabled(s,id)||s.energy<G1A_COSTS[verb][0])return false;const p=structuredClone(s);p.g1a.production=structuredClone(x);p.g1a.production.load+=G1A_COSTS[verb][2];return own(s,id).revivalProgress+growthFor(p,own(p,id),true,0,G1A_COSTS[verb][1])<100;}
const safe=s=>s.scene==='hub'&&!s.combat&&s.systems.death==='alive'&&!s.crisis;
function clothingAuthorized(s,c,h){return integrationAllowed(s,c)&&c.shroudSourceId===h.sourceId&&c.garmentId===h.garmentId&&h.sourceId==='integration-shroud-source'&&h.garmentId==='integration-shroud-garment'&&h.custodian==='player';}
const canIsolate=(s,c,h)=>clothingAuthorized(s,c,h)&&c.isolationVerified===true&&c.containerVerified===true;
export function productionAvailable(s,c=null){
 if(s.g1a?.candidate||!productionAllowed(s,c)||s.systems.death!=='alive')return [];
 const x=productionState(s),r=x.rope,b=x.blood,h=x.shroud,out=[];
 // 100 is a permanent crisis for this batch, never an ordinary isolation escape.
 if(s.crisis||h.crisis)return out;
 const t=productionTarget(s),combat=s.combat&&!s.combat.eyeV6?.pending;
 if(combat&&t){
  if(controlled(s,r,c)&&!r.manifestation&&t.bind&&affordable(s,x,r.actorId,'contact'))out.push('g1ap:rope:contact:'+t.id);
  if(controlled(s,r,c)&&r.stage>=2&&r.manifestation?.state==='CONTACT'&&r.manifestation.targetId===t.id&&r.manifestation.battleId===battle(s)&&x.sequence>=r.cooldownUntil&&t.bind&&r.evidence.some(e=>e.result==='observed-bindable'&&e.ruleId===t.ruleId)&&affordable(s,x,r.actorId,'bind'))out.push('g1ap:rope:bind:'+t.id);
  if(b.actorId==='player-blood'&&own(s,b.actorId)?.sourceId==='blood'&&t.contact&&!b.media.some(m=>['CONTROLLED','AT_RISK','SEVERED'].includes(m.state))&&affordable(s,x,b.actorId,'release'))out.push('g1ap:blood:release:'+t.id);
 }
 if(b.actorId==='player-blood'&&own(s,b.actorId)?.sourceId==='blood')for(const m of b.media){
  if(!['CONTROLLED','AT_RISK'].includes(m.state)||!m.recoverable||!enabled(s,b.actorId))continue;
  const mt=productionTarget(s,m.targetId),reachable=s.scene===m.location&&!s.restricted[m.eventId];
  if(!mt||!reachable)continue;
  if(combat&&t?.id===m.targetId&&b.stage>=1&&mt.suppress&&!m.suppression&&(m.applications===0||b.stage>=2)&&affordable(s,x,b.actorId,'suppress'))out.push('g1ap:blood:suppress:'+m.id);
  if(!s.combat?.eyeV6?.pending&&affordable(s,x,b.actorId,'recover'))out.push('g1ap:blood:recover:'+m.id);
 }
 if(safe(s)){
  if(controlled(s,r,c)&&r.stage===0&&r.evidence.some(e=>e.result==='contact')&&r.evidence.some(e=>e.result==='ended'))out.push('g1ap:rope:research:R1');
  if(controlled(s,r,c)&&r.stage===1&&r.evidence.some(e=>e.result==='observed-bindable'))out.push('g1ap:rope:research:R2');
  if(enabled(s,b.actorId)&&b.stage===0&&(s.g1a.blood.contacts.some(e=>e.outcome!=='failed')||b.evidence.some(e=>e.result==='contact-suppressed')))out.push('g1ap:blood:research:B1');
  if(enabled(s,b.actorId)&&b.stage===1&&b.media.some(m=>m.state==='RECOVERED'&&m.E>0))out.push('g1ap:blood:research:B2');
  if(clothingAuthorized(s,c,h)){
   if(h.stage===0&&c.identityVerified===true)out.push('g1ap:shroud:research:S1');
   if(h.stage===1&&h.evidence.some(e=>e.result==='protected'))out.push('g1ap:shroud:research:S2');
   if(h.stage===2&&h.evidence.some(e=>e.result==='erosion')&&h.evidence.some(e=>e.result==='isolated'))out.push('g1ap:shroud:research:S3');
   if(!h.wearer&&h.stage>=1&&h.erosion<100&&canIsolate(s,c,h))out.push('g1ap:shroud:wear:confirm-risk');
   if(h.wearer==='player'&&canIsolate(s,c,h))out.push('g1ap:shroud:isolate');
  }
 }
 return out;
}
function pay(s,x,v,id,verb){const [energy,revival,load]=G1A_COSTS[verb];s.energy-=energy;x.load+=load;v.load+=load;return {used:id,usage:revival};}
const weight=(s,id)=>id===s.g1a.production.rope.actorId?(contexts.get(s)?.ropeWeight??0):v1Ward(s,own(s,id),s.combat?.eventId||'blood');
export function applyProduction(s,action,c){
 prepareProduction(s,c,true);const x=s.g1a.production,[,kind,verb,...parts]=action.split(':'),id=parts.join(':'),v=x[kind];let result={used:null,usage:0};
 if(verb==='research'){v.stage++;fact(v,s,'researched',id);s.journal.push('专属开发：复核真实证据 '+id+'；不授予新本体，不撤销累计代价。');return result;}
 if(kind==='rope'){
  result=pay(s,x,v,v.actorId,verb);const t=productionTarget(s,id),success=ruleContest(weight(s,v.actorId),t.weight)!=='failed';
  if(verb==='contact'&&success){v.manifestation={state:'CONTACT',targetId:id,ruleId:t.ruleId,battleId:battle(s),remaining:2,boundAction:null};fact(v,s,'contact',t.ruleId);}
  if(verb==='bind'){v.cooldownUntil=x.sequence+3;if(success){v.manifestation.state='RESTRAINT';v.manifestation.boundAction=t.action;fact(v,s,'bound',t.ruleId);}}
  v.history.push({node:node(s),targetId:id,result:success?verb:'resisted'});
 }else if(kind==='blood'){
  result=pay(s,x,v,v.actorId,verb);
  if(verb==='release'){
   const t=productionTarget(s,id),g=own(s,v.actorId);
   // Wetting a real carrier is contact, not a successful rule suppression.
   const m={id:'g1ap-medium-'+ ++v.sequence,actorId:g.id,sourceId:g.sourceId,targetId:id,eventId:t.eventId,ruleId:t.ruleId,location:s.scene,battleId:battle(s),createdTick:s.tick,E:0,W:g.revivalProgress,state:'CONTROLLED',recoverable:true,suppression:null,applications:0};v.media.push(m);fact(v,s,'released',t.ruleId,m.id);
  }else{
   const m=v.media.find(m=>m.id===id),t=productionTarget(s,m.targetId);
   if(verb==='suppress'){m.applications++;if(ruleContest(weight(s,v.actorId),t.weight)!=='failed')m.suppression=t.action;else fact(v,s,'suppression-resisted',t.ruleId,m.id);}
   if(verb==='recover'){const success=ruleContest(weight(s,v.actorId),t.weight)!=='failed';if(success){m.state='RECOVERED';m.recoverable=false;m.suppression=null;fact(v,s,'recovered',t.ruleId,m.id);}else fact(v,s,'recovery-resisted',t.ruleId,m.id);}
  }
 }else if(kind==='shroud'){
  if(verb==='wear'){v.wearer='player';v.session++;v.effective=0;fact(v,s,'worn',v.sourceId);}
  if(verb==='isolate'){
   if(c.isolationSucceeds===false){fact(v,s,'isolation-failed',v.sourceId);}else{
    const eligible=v.effective>0&&v.settledSession<v.session;
    if(eligible&&v.stage>=3&&v.peak<100){const floor=v.peak>=75?30:v.peak>=40?10:0;v.erosion=Math.max(floor,v.erosion-SHROUD_RULES.isolation);}
    if(eligible)v.settledSession=v.session;
    v.wearer=null;v.location='verified-isolation';fact(v,s,'isolated',v.sourceId);
   }
  }
 }
 s.journal.push('专属能力：'+productionLabel(action)+'。发动代价已结算；敌方抵抗不退还。');return result;
}
function endRope(s,reason){const r=s.g1a.production.rope;if(!r.manifestation)return;fact(r,s,'ended',r.manifestation.ruleId);r.history.push({node:node(s),targetId:r.manifestation.targetId,result:'ended',reason});r.manifestation=null;}
function severRope(s){const r=s.g1a.production.rope;if(r.control!=='CONTROLLED')return;endRope(s,'control-severed');r.control='UNCONTROLLED';r.event={sourceId:own(s,r.actorId)?.sourceId||r.actorId,state:'UNRESOLVED',tick:s.tick};}
function erode(h,amount){h.erosion=Math.min(100,h.erosion+amount);h.peak=Math.max(h.peak,h.erosion);}
export function productionIntent(s,r,intent){const t=productionTarget(s,r.instanceId);if(!t||intent&&(intent.simulation||intent.kind&&intent.kind!=='ordinary'||intent.actionType&&intent.actionType!==t.action))return intent;return {...intent,targetId:r.instanceId,ruleId:r.id,actionType:t.action,weight:intent?.weight??r.weight};}
export function productionEnemy(s,intent){
 const x=s.g1a?.production,c=contexts.get(s);if(!x||!productionAllowed(s,c)||!intent||intent.cancelled)return false;
 const t=productionTarget(s,intent.targetId);if(!t||t.ruleId!==intent.ruleId||t.action!==intent.actionType)return false;
 const r=x.rope,m=r.manifestation;
 if(r.control==='CONTROLLED'&&!sourceControlled(s,r,c))severRope(s);
 if(controlled(s,r,c)&&m?.targetId===t.id&&m.battleId===battle(s)){
  if(t.bind)fact(r,s,'observed-bindable',t.ruleId);
  if(m.state==='RESTRAINT'&&m.boundAction===intent.actionType){endRope(s,'one-matching-action');return true;}
 }
 for(const medium of x.blood.media)if(enabled(s,medium.actorId)&&['CONTROLLED','AT_RISK'].includes(medium.state)&&medium.targetId===t.id&&medium.location===s.scene&&medium.suppression===intent.actionType){medium.suppression=null;fact(x.blood,s,'contact-suppressed',t.ruleId,medium.id);return true;}
 const h=x.shroud;
 if(h.wearer==='player'&&clothingAuthorized(s,c,h))h.effective++;
 if(h.wearer==='player'&&h.stage>=1&&!h.crisis&&clothingAuthorized(s,c,h)&&canIsolate(s,c,h)&&c.coverage?.some(p=>p.ruleId===t.ruleId&&p.actionType===intent.actionType)){
  const success=ruleContest(c.shroudWeight??0,intent.weight)!=='failed';fact(h,s,success?'protected':'protection-failed',t.ruleId);
  if(success){const key=node(s);if(!h.protectionNodes.includes(key)){erode(h,SHROUD_RULES.protection);h.protectionNodes.push(key);}return true;}
 }
 return false;
}
export function advanceProduction(before,s,action,c){
 const x=s.g1a?.production;if(!x||!productionAllowed(s,c)||s.combat?.eyeV6?.pending)return;
 if(c?.requestId&&!x.completed.includes(c.requestId))x.completed.push(c.requestId);
 const token=node(s);if(x.lastNode===token)return;x.lastNode=token;contexts.set(s,c);
 const r=x.rope,b=x.blood,h=x.shroud;
 if(r.control==='CONTROLLED'&&!sourceControlled(s,r,c))severRope(s);
 if(r.manifestation){if(!s.combat||r.manifestation.battleId!==battle(s))endRope(s,'battle-ended');else if(--r.manifestation.remaining<=0)endRope(s,'expired');}
 for(const m of b.media){
  if(['RECOVERED','UNCONTROLLED_SOURCE'].includes(m.state))continue;
  if(m.state==='SEVERED'){m.state='UNCONTROLLED_SOURCE';m.event={sourceId:m.sourceId,state:'UNRESOLVED',tick:s.tick};continue;}
  const g=own(s,m.actorId);
  if(m.createdTick!==s.tick){m.E++;fact(b,s,'exposed',m.ruleId,m.id);}
  m.W=Math.max(m.W,(g?.revivalProgress??100)+BLOOD_EXPOSURE_COEFFICIENT*m.E);
  if(!g||revivalCrisisFor(s,g)||ruleBlocked(s,g.id)){m.state='SEVERED';m.recoverable=false;m.suppression=null;}
  else if(m.W>=100){m.state='UNCONTROLLED_SOURCE';m.recoverable=false;m.suppression=null;m.event={sourceId:m.sourceId,state:'UNRESOLVED',tick:s.tick};}
  else m.state=m.W>=85?'AT_RISK':'CONTROLLED';
 }
 if(h.wearer==='player'){
  erode(h,SHROUD_RULES.time);fact(h,s,'erosion',h.sourceId);
  if(h.erosion>=100){h.crisis=true;s.crisis=true;s.journal.push('寿衣侵蚀失控：普通隔离不能解除危机，必须停止常规调用。');}
 }
 x.sequence++;x.events.push({sequence:x.sequence,tick:s.tick,node:token,action});if(x.events.length>200)x.events.shift();
}
export function validProduction(s,c=null){
 const x=s.g1a?.production;if(x===undefined)return true;
 try{
  const n=(v,max=1e9)=>Number.isFinite(v)&&v>=0&&v<=max,unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
  if(x.format!==2||typeof x.testOnly!=='boolean'||!productionAllowed(s,c)||s.g1a.candidate||!n(x.load)||!Number.isInteger(x.sequence)||!Array.isArray(x.events)||x.events.length>200||!unique(x.completed)||x.completed.some(id=>typeof id!=='string'))return false;
  const {rope:r,blood:b,shroud:h}=x;
  if(![0,1,2].includes(r.stage)||![0,1,2].includes(b.stage)||![0,1,2,3].includes(h.stage)||!n(r.load)||!n(b.load)||x.load!==r.load+b.load)return false;
  if(!['SEALED','CONTROLLED','UNCONTROLLED','RECONTAINED'].includes(r.control)||r.actorId&&(!x.testOnly||!integrationAllowed(s,c)||c.ropeSourceId!=='g1a-rope-candidate'||r.actorId!=='player-g1a-rope-candidate'||own(s,r.actorId)?.sourceId!==c.ropeSourceId))return false;
  if(r.manifestation&&(!['CONTACT','RESTRAINT'].includes(r.manifestation.state)||![1,2].includes(r.manifestation.remaining)||r.control!=='CONTROLLED'||!productionTarget(s,r.manifestation.targetId)))return false;
  if(b.actorId!==null&&(b.actorId!=='player-blood'||!(own(s,b.actorId)?.sourceId==='blood'||s.systems.sealed.includes('blood'))))return false;
  if(!Array.isArray(b.media)||!unique(b.media.map(m=>m.id))||b.media.filter(m=>['CONTROLLED','AT_RISK'].includes(m.state)).length>1)return false;
  for(const m of b.media){const t=productionTarget(s,m.targetId);if(!t||m.ruleId!==t.ruleId||m.eventId!==t.eventId||m.location!==t.eventId||m.actorId!=='player-blood'||m.sourceId!=='blood'||!['CONTROLLED','AT_RISK','RECOVERED','SEVERED','UNCONTROLLED_SOURCE'].includes(m.state)||!Number.isInteger(m.E)||!n(m.E)||!n(m.W)||!Number.isInteger(m.applications)||!n(m.applications)||m.suppression!==null&&m.suppression!==t.action||['SEVERED','UNCONTROLLED_SOURCE','RECOVERED'].includes(m.state)&&m.recoverable||m.state==='AT_RISK'&&m.W<85||['CONTROLLED','AT_RISK'].includes(m.state)&&m.W>=100)return false;}
  if(!n(h.erosion,100)||!n(h.peak,100)||h.peak<h.erosion||typeof h.crisis!=='boolean'||h.crisis!==(h.erosion===100)||!unique(h.protectionNodes)||![null,'player'].includes(h.wearer)||!Number.isInteger(h.session)||!n(h.session)||!n(h.effective)||!n(h.settledSession,h.session))return false;
  if(h.sourceId!==null&&(!x.testOnly||!clothingAuthorized(s,c,h)))return false;
  if(h.wearer&&(!h.sourceId||h.stage<1||!canIsolate(s,c,h)))return false;
  for(const v of [r,b,h])if(!Array.isArray(v.evidence)||!unique(v.evidence.map(e=>e.id))||v.evidence.some(e=>!Number.isInteger(e.tick)||!n(e.tick,s.tick)||typeof e.ruleId!=='string'))return false;
  const learned=(v,prefix)=>Array.from({length:v.stage},(_,i)=>prefix+(i+1)).every(id=>v.evidence.some(e=>e.result==='researched'&&e.ruleId===id));
  if(!learned(r,'R')||!learned(b,'B')||!learned(h,'S'))return false;
  if(r.stage>=1&&(!r.actorId||!r.evidence.some(e=>e.result==='contact')||!r.evidence.some(e=>e.result==='ended'))||r.stage>=2&&!r.evidence.some(e=>e.result==='observed-bindable'))return false;
  if(b.stage>=1&&!s.g1a.blood.contacts.some(e=>e.outcome!=='failed')&&!b.evidence.some(e=>e.result==='contact-suppressed')||b.stage>=2&&!b.media.some(m=>m.state==='RECOVERED'&&m.E>0))return false;
  if(h.stage>=1&&!h.sourceId||h.stage>=2&&!h.evidence.some(e=>e.result==='protected')||h.stage>=3&&(!h.evidence.some(e=>e.result==='isolated')||!h.evidence.some(e=>e.result==='erosion')))return false;
  return true;
 }catch{return false;}
}
export function productionLabel(action){const [,kind,verb,...id]=action.split(':');if(verb==='research')return '复核'+({rope:'鬼绳',blood:'鬼血',shroud:'寿衣'}[kind])+'实战证据 · '+id.join(':');return ({'rope:contact':'绳影延展','rope:bind':'缠束下一次匹配动作','blood:release':'鬼血沾染','blood:suppress':'鬼血主动压制','blood:recover':'回收受控鬼血','shroud:wear':'确认承担风险后穿戴','shroud:isolate':'使用已验证隔离手段'}[kind+':'+verb]||'专属能力');}
