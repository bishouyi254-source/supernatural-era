// Production-source eligibility audit for G1-C. Read-only and fail-closed.
// Does NOT grant G1-C ownership, create a new enemy, or inject fictional actions.
import {events} from './content.js';
import {KNOCKER_DECLARATION} from './knocker-intents.js';
export {registerG1CEvidence,auditG1CSourceAction,G1C_APPROVED_SOURCES} from './g1c-source-registry.js';

const REQUIRED=Object.freeze({
 fire:Object.freeze(['real enemy source action','verified spirit medium','real impact region','source-side contest weight']),
 wind:Object.freeze(['real enemy source action','explicit domain-type initiative','verified domain region','source-side domain weight']),
 press:Object.freeze(['real body registry','complete height and posture ordering at the trigger tick','real in-range bodies','action target and physical resistance'])
});
const noAction=Object.freeze({fire:false,wind:false,press:false});
const snapshot=(kind,origin,reason)=>Object.freeze({
 kind,origin,eligible:noAction,reason,
 missing:Object.freeze({
  fire:[...REQUIRED.fire],wind:[...REQUIRED.wind],press:[...REQUIRED.press]
 })
});
export const G1C_FORMAL_REQUIRED=REQUIRED;
export function inspectG1CFormalSource(s){
 const c=s?.combat;
 if(!c)return snapshot('NO_ENCOUNTER',null,'当前没有正在进行的正式敌方主动条；不能创造临时场景');
 const id=c.eventId;
 if(typeof id!=='string'||!Object.hasOwn(events,id)||c.sourceId!=='source:'+id)
  return snapshot('INVALID_SOURCE',null,'敌方sourceId与正式场景身份不一致，全部关闭');
 if(id==='knocker'){
  // The only code-defined canonical direct intent path is the school's audio
  // propagation. Its real damage path does not use ghost-fire/wind/body semantics.
  const actual=!!c.nativeSchool&&!!s.school?.started&&!!s.school?.participated
   &&KNOCKER_DECLARATION.simulation===false
   &&KNOCKER_DECLARATION.scope==='external-audio-medium'
   &&KNOCKER_DECLARATION.kind==='propagation';
  if(actual)return snapshot('FORMAL_AUDIO_PROPAGATION','knocker-intents:KNOCKER_DECLARATION',
   '七中已定义真实音频传播与身体侵蚀；不是已证明的鬼域、可焚烧媒介或已知身高身体对象');
  return snapshot('UNVERIFIED_SCHOOL_SOURCE',null,
   '不满足七中真实音频行动的开始/参与条件，不能依据事件名推断正式意图');
 }
 if(c.nativeSchool)return snapshot('INCONSISTENT_SOURCE',null,
  '非七中战斗不得假扮nativeSchool正式音频意图');
 if(c.eyeV6?.scenario?.simulation===true)return snapshot('SIMULATED_INTENT','ghost-eye-v6:scenario',
  '鬼眼场景是明确simulation，不是正式鬼域行动或身体关系');
 // No ordinary registry entry currently provides a typed, provenance-linked
 // source domain action + body registry + heights in the production resolver.
 return snapshot('UNTYPED_EVENT',events[id].source||'game-event-registry',
  '普通事件只有媒介/默认权重/行动条，不含G1-C所需的正式灵异类型与身体身高证据');
}
export function formalG1CReady(s,k){
 return ['fire','wind','press'].includes(k)&&inspectG1CFormalSource(s).eligible[k]===true;
}
