// V6.1 candidate configuration. Values require balance acceptance before release.
import {activeIds,v1Ward} from './v1.js';
import {growthFor,suppressionFor} from './spirits.js';
import {ruleContest} from './rules.js';
/** @typedef {'position'|'propagation'|'preparation'|'ordinary'} IntentKind */
/** @typedef {{id:string,kind:IntentKind,observable:boolean,reactable:boolean,interruptible:boolean,stoppable:boolean,weight:number,damage:number,delayed:boolean,simulation:boolean}} EnemyIntent */
export const EYE_V6=Object.freeze([
 null,...[
 ['鬼域展开',1,1,1,0,'active'],['鬼域转移',1,2,1,1,'both'],
 ['鬼域隔绝',1,3,2,2,'both'],['鬼域叠压',1,4,2,2,'reaction'],
 ['现实干涉',2,6,4,3,'active'],['灵异停滞',2,12,6,0,'active'],
 ['自身重启',0,25,10,0,'both'],['范围重启',2,35,15,0,'active']
 ].map(([name,energy,revival,burden,cooldown,timing],i)=>Object.freeze({layer:i+1,name,energy,revival,burden,cooldown,timing}))
]);
const thresholds=[1,5,10,20,35,50,70,90];
export const newEyeV6=()=>({format:1,unlocks:{},persistentLoad:0,sequence:0,energySpent:0,energyRestored:0,events:[]});
export const eyeGhost=s=>s.spirits.find(g=>g.sourceId==='eye');
export function attachEyeV6(s){
 if(s.ghostEyeV6)return s;
 const v=newEyeV6();
 for(const g of s.spirits.filter(g=>g.sourceId==='eye')){
  // One-time migration reads independent awakening, never revivalProgress.
  const max=thresholds.filter(t=>t<=g.awakeningProgress).length;
  v.unlocks[g.id]=Array.from({length:max},(_,i)=>({layer:i+1,origin:'legacy-permission',evidence:'awakening:'+g.awakeningProgress}));
 }
 const migrated={...s,ghostEyeV6:v};
 if(s.combat&&eyeGhost(s)&&!s.combat.eyeV6){migrated.combat={...s.combat,eyeV6:newEyeCombat(s)};migrated.combat.eyeV6.snapshot.life=s.combat.snapshot?.life??s.life;migrated.combat.eyeV6.snapshot.cooldowns=structuredClone(s.combat.snapshot?.combat?.cooldowns??s.combat.cooldowns);}
 return migrated;
}
export function syncEyeUnlocks(s,action){
 const g=eyeGhost(s);if(!g)return;
 const v=s.ghostEyeV6;v.unlocks[g.id]??=[{layer:1,origin:'acquisition',evidence:'v1:eye:capture'}];
 if(action.startsWith('v1:eye:research:')){
  const evidence=action.slice(16),max=thresholds.filter(t=>t<=g.awakeningProgress&&g.awakeningProgress<100).length;
  if(s.v1.insights.includes(evidence))for(let layer=2;layer<=max;layer++)if(!v.unlocks[g.id].some(e=>e.layer===layer))v.unlocks[g.id].push({layer,origin:'development',evidence});
 }
}
export function newEyeCombat(s){return {round:0,completedRound:0,domain:null,cooldowns:{},reactionUsed:false,restartUsed:false,stasisUsed:false,pending:null,deferred:null,stasis:false,effects:[],scenario:null,snapshot:{life:s.life,energy:s.energy,cooldowns:{},effects:[]}};}
export function beginEyeRound(s){const v=s.combat?.eyeV6;if(!v)return;v.round++;v.reactionUsed=false;for(const id of Object.keys(v.cooldowns))v.cooldowns[id]=Math.max(0,v.cooldowns[id]-1);if(v.domain&&--v.domain.remaining<=0)v.domain=null;for(const e of v.effects){if(e.suspendedUntil<=v.round)e.suspendedUntil=0;} }
export function completeEyeEffects(s){
 const v=s.combat?.eyeV6;if(!v||v.completedRound===v.round)return;v.completedRound=v.round;
 for(const e of v.effects)if(e.kind==='periodic-damage'&&e.target==='self'&&!e.suspendedUntil){s.life=Math.max(0,s.life-e.value);s.journal.push('已生效持续灵异 '+e.id+'：本轮身体损伤'+e.value+'。');}
 if(s.life===0)s.systems.death='pending';
}
export function eyeCost(s,layer,reaction=false){
 const g=eyeGhost(s),a=EYE_V6[layer];if(!g||!a)return null;
 const projected=structuredClone(s);projected.ghostEyeV6.persistentLoad+=a.burden;
 const base=growthFor(projected,g,true,0,a.revival,!reaction),natural=growthFor(projected,g,false,0,null,!reaction);
 const suppression=suppressionFor(projected,g),build={suppression:2,mind:1,rule:4,domain:3}[s.v1.build]||0;
 return {base:a.revival,build,suppression,suppressionReduction:(a.revival+build)*suppression,usage:Math.max(0,base-natural),natural,total:base};
}
const held=s=>{const g=eyeGhost(s);return g&&g.awakeningProgress<100&&activeIds(s).includes(g.id)&&!s.systems.combinations.some(x=>x.disabledId===g.id)&&s.systems.death!=='committed'&&!s.crisis?g:null;};
const reversible=(s,target,beneficial)=>s.combat.eyeV6.effects.filter(e=>e.target===target&&e.reversible&&e.beneficial===beneficial&&!e.suspendedUntil);
function parse(action){const m=/^eye6:(cast|react):([1-8])(?::(self|enemy))?$/.exec(action);return m?{reaction:m[1]==='react',layer:Number(m[2]),target:m[3]??'self'}:null;}
export function eyeAvailable(s){
 const c=s.combat,v=c?.eyeV6,g=held(s);if(!v||!g)return [];
 const reaction=!!v.pending||s.systems.death==='pending',out=[];
 if(v.pending)out.push('eye6:pass');
 for(const a of EYE_V6.slice(1)){
  if(c.nativeSchool&&a.layer===2)continue; // No legal domain relocation contract for school zones in this batch.
  if(!s.ghostEyeV6.unlocks[g.id]?.some(e=>e.layer===a.layer)||s.energy<a.energy||v.cooldowns[a.layer]>(reaction?0:1)||a.layer>1&&(!v.domain||!reaction&&v.domain.remaining<=1))continue;
  if(reaction&&(v.reactionUsed||a.timing==='active')||!reaction&&(a.timing==='reaction'||s.systems.death!=='alive'))continue;
  if(a.layer===6&&v.stasisUsed||a.layer>=7&&v.restartUsed)continue;
  const cost=eyeCost(s,a.layer,reaction);if(Math.round((g.revivalProgress+cost.total)*10000)/10000>=100)continue;
  const p=v.pending;
  if(reaction&&a.layer!==7&&(!p?.observable||!p.reactable))continue;
  if(a.layer===2&&reaction&&p.kind!=='position'||a.layer===3&&(!p||p.kind!=='propagation')||a.layer===4&&(!p||p.kind!=='preparation'||!p.interruptible||p.delayed))continue;
  if(a.layer===6&&!(v.scenario?.stoppable===true))continue;
  if(a.layer===5&&!reversible(s,'self',false).length&&!reversible(s,'enemy',false).length)continue;
  if(a.layer===8&&!reversible(s,'enemy',true).length&&s.life>=v.snapshot.life&&s.energy>=v.snapshot.energy)continue;
  const prefix=`eye6:${reaction?'react':'cast'}:${a.layer}`;
  if(a.layer===5){for(const t of ['self','enemy'])if(reversible(s,t,false).length)out.push(prefix+':'+t);}
  else if(a.layer===8){if(s.life<v.snapshot.life||s.energy<v.snapshot.energy)out.push(prefix+':self');if(reversible(s,'enemy',true).length)out.push(prefix+':enemy');}
  else out.push(prefix);
 }
 return out;
}
export function applyEye(s,action){
 if(action==='eye6:pass')return {reaction:true,used:null};
 const p=parse(action),a=EYE_V6[p.layer],g=eyeGhost(s),v=s.combat.eyeV6,cost=eyeCost(s,p.layer,p.reaction);
 s.energy-=a.energy;s.ghostEyeV6.energySpent+=a.energy;s.ghostEyeV6.persistentLoad+=a.burden;
 v.cooldowns[p.layer]=a.cooldown? a.cooldown+1:0;if(p.reaction)v.reactionUsed=true;
 if(p.layer===6)v.stasisUsed=true;if(p.layer>=7)v.restartUsed=true;
 const weight=Math.min(10,v1Ward(s,g,s.scene)+(s.v1.build==='domain'?1:0)),intent=v.pending;
 let success=true,restored=0;
 if(p.layer===1)v.domain={remaining:v.scenario?.simulation===true?(s.ghostEyeV6.testDomainRounds??3):3,owner:g.id};
 if(p.layer===2){success=!p.reaction||ruleContest(weight,intent.weight)==='blocked';if(success){s.combat.position='safe';if(intent)intent.cancelled=true;}}
 if(p.layer===3||p.layer===4){success=ruleContest(weight,intent.weight)==='blocked';if(success){if(p.layer===4){intent.delayed=true;v.deferred={...intent};}intent.cancelled=true;}}
 if(p.layer===5){success=ruleContest(weight,v.scenario?.weight??2)==='blocked';if(success)for(const e of reversible(s,p.target,false))e.suspendedUntil=v.round+1;}
 if(p.layer===6){success=ruleContest(weight,v.scenario.weight)==='blocked';if(success)v.stasis=true;}
 if(p.layer>=7){
  if(p.layer===7||p.target==='self'){
   s.life=v.snapshot.life;s.systems.death='alive';restored=Math.max(0,v.snapshot.energy-s.energy);s.energy+=restored;
   // Only ordinary cooldowns and explicitly reversible effects can restart.
   s.combat.cooldowns=structuredClone(v.snapshot.cooldowns);
   for(const layer of [1,2,3,4,5])v.cooldowns[layer]=0;
   v.effects=v.effects.filter(e=>e.target!=='self'||!e.reversible);
  }else v.effects=v.effects.filter(e=>e.target!=='enemy'||!e.reversible||!e.beneficial);
  s.ghostEyeV6.energyRestored+=restored;
 }
 const event={id:++s.ghostEyeV6.sequence,round:v.round,layer:p.layer,ghostId:g.id,action,success,energySpent:a.energy,energyRestored:restored,burden:a.burden,...cost,revivalBefore:g.revivalProgress,revivalAfter:null};
 s.ghostEyeV6.events.push(event);s.ghostEyeV6.events=s.ghostEyeV6.events.slice(-200);
 s.journal.push(`鬼眼V6 ${a.name}：${success?'合法施放':'合法对抗失败'}；能量消费${a.energy}、恢复${restored}、持久负荷+${a.burden}；基础复苏${cost.base}，构筑${cost.build}，压制减免${cost.suppressionReduction.toFixed(2)}。`);
 return {reaction:p.reaction,used:g.id,usage:a.revival,event};
}
export function finishEyeCost(s){const e=s.ghostEyeV6?.events.at(-1);if(e&&e.revivalAfter===null)e.revivalAfter=s.spirits.find(g=>g.id===e.ghostId)?.revivalProgress??e.revivalBefore;}
export function enemyIntent(s,r){
 const v=s.combat.eyeV6,fixture=v?.scenario;
 // Existing rule records do not declare observable/interruptible attacks.
 // Explicit scenarios remain labelled simulations until canon rules are authored.
 const source=fixture?.simulation===true?fixture:null;
 const bonus=v?.effects.filter(e=>e.target==='enemy'&&e.kind==='empowerment'&&!e.suspendedUntil).reduce((n,e)=>n+e.value,0)||0;
 const intent={id:`${s.combat.sourceId}:${s.combat.clock}`,kind:source?.kind??'ordinary',observable:!!source?.observable&&!!v.domain,reactable:!!source?.reactable,interruptible:!!source?.interruptible,stoppable:!!source?.stoppable,weight:(source?.weight??r.weight)+bonus,damage:source?.damage??r.damage,delayed:false,simulation:!!source};
 if(v.stasis&&intent.stoppable){v.stasis=false;intent.cancelled=true;}
 return intent;
}
export function validEyeV6(s){
 const v=s.ghostEyeV6;if(v===undefined)return true;const n=x=>Number.isFinite(x)&&x>=0,record=x=>x&&typeof x==='object'&&!Array.isArray(x);
 if(!record(v)||v.format!==1||!record(v.unlocks)||![v.persistentLoad,v.sequence,v.energySpent,v.energyRestored].every(n)||!Number.isInteger(v.sequence)||v.testDomainRounds!==undefined&&![2,3].includes(v.testDomainRounds)||!Array.isArray(v.events)||v.events.length>200)return false;
 if(Object.entries(v.unlocks).some(([id,es])=>id!=='player-eye'||!Array.isArray(es)||es.length>8||new Set(es.map(e=>e.layer)).size!==es.length||es.some(e=>!Number.isInteger(e.layer)||e.layer<1||e.layer>8||!['legacy-permission','acquisition','development'].includes(e.origin)||typeof e.evidence!=='string')))return false;
 if(v.events.some(e=>!record(e)||!Number.isInteger(e.id)||e.id<1||e.id>v.sequence||!EYE_V6[e.layer]||typeof e.success!=='boolean'||!['base','build','suppression','suppressionReduction','usage','natural','total','energySpent','energyRestored','burden','revivalBefore'].every(k=>n(e[k]))||e.revivalAfter!==null&&!n(e.revivalAfter)))return false;
 const c=s.combat?.eyeV6;if(!c)return true;
 if(!record(c)||!Number.isInteger(c.round)||c.round<0||c.completedRound!==undefined&&(!Number.isInteger(c.completedRound)||c.completedRound<0||c.completedRound>c.round)||!['reactionUsed','restartUsed','stasisUsed','stasis'].every(k=>typeof c[k]==='boolean')||!record(c.cooldowns)||Object.entries(c.cooldowns).some(([k,x])=>!EYE_V6[k]||!Number.isInteger(x)||x<0||x>4)||!record(c.snapshot)||!n(c.snapshot.life)||c.snapshot.life>100||!n(c.snapshot.energy)||c.snapshot.energy>3||!Array.isArray(c.effects))return false;
 if(c.domain&&(!Number.isInteger(c.domain.remaining)||c.domain.remaining<1||c.domain.remaining>3||c.domain.owner!=='player-eye'))return false;
 const validIntent=i=>record(i)&&typeof i.id==='string'&&['position','propagation','preparation','ordinary'].includes(i.kind)&&['observable','reactable','interruptible','stoppable','delayed','simulation'].every(k=>typeof i[k]==='boolean')&&n(i.weight)&&n(i.damage);
 if(c.pending&&!validIntent(c.pending)||c.deferred&&!validIntent(c.deferred))return false;
 for(const i of [c.pending,c.deferred].filter(Boolean))if(i.nativeSchool&&(!s.combat.nativeSchool||i.simulation||i.kind!=='propagation'||i.damage!==20||i.weight!==2||i.interruptible||i.stoppable||i.scope!=='external-audio-medium'))return false;
 if(c.scenario&&(!record(c.scenario)||c.scenario.simulation!==true||!['position','propagation','preparation','ordinary'].includes(c.scenario.kind)||!n(c.scenario.weight)||!n(c.scenario.damage)))return false;
 return c.effects.every(e=>record(e)&&typeof e.id==='string'&&['self','enemy'].includes(e.target)&&typeof e.reversible==='boolean'&&typeof e.beneficial==='boolean'&&n(e.suspendedUntil)&&(e.kind===undefined||['periodic-damage','empowerment'].includes(e.kind)&&n(e.value)&&e.value<=100));
}
