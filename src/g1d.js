// G1-D mechanics candidate. No formal source binding or ordinary acquisition.
// The explicit adapter is an isolated engineering contract, never novel evidence.
import {activeIds,v1Ward} from './v1.js';
import {growthFor,revivalCrisisFor} from './spirits.js';
import {ruleBlocked} from './evolution-model.js';
import {ruleContest} from './rules.js';
import {mentalRuleBonus} from './character-potential.js';

export const G1D_IDS=Object.freeze({hand:'g1d-hand',paper:'g1d-paper',child:'g1d-child'});
export const G1D_COSTS=Object.freeze({lock:[1,3,2],suppress:[1,5,3],release:[1,2,1],face:[1,3,2],rewrite:[1,6,3],recover:[1,2,1],command:[1,4,2],swallow:[1,6,4],recall:[1,2,1]});
export const G1D_FORMAL_BINDINGS=Object.freeze([]);
const keys=Object.keys(G1D_IDS),contexts=new WeakMap();
const verbs={hand:['lock','suppress','release'],paper:['face','rewrite','recover'],child:['command','swallow','recall']};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const num=(n,max=1e9)=>Number.isFinite(n)&&n>=0&&n<=max;
const int=(n,max=1e9)=>Number.isInteger(n)&&num(n,max);
const distinct=a=>Array.isArray(a)&&new Set(a).size===a.length;
function digest(value){let h=2166136261;for(const ch of JSON.stringify(value))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h.toString(16);}
function seal(x){const {seal:unused,...v}=x;return digest(v);}
const sign=s=>{s.g1d.seal=seal(s.g1d);};
const manifest=c=>({ownership:c.g1dOwnership,targets:c.g1dTargets,certificates:c.g1dCertificates||[]});
const battle=s=>s.combat?.g1dBattleId??null;
const own=(s,k)=>s.spirits.find(g=>g.id===s.g1d?.[k].actorId&&g.sourceId===G1D_IDS[k]);
const enabled=(s,k)=>k==='child'?s.g1d.child.owned&&s.g1d.child.revival<100:!!own(s,k)&&activeIds(s).includes(own(s,k).id)&&!revivalCrisisFor(s,own(s,k))&&!ruleBlocked(s,own(s,k).id)&&!s.systems.combinations.some(v=>v.disabledId===own(s,k).id);
const target=(s,c)=>c?.g1dTargets?.find(t=>t.id===s.combat?.sourceId);
const live=(s,k)=>s.g1d[k].state==='CONTROLLED'&&s.g1d[k].battleId===battle(s)&&enabled(s,k);
function fact(s,kind,type,data={}){const e={seq:++s.g1d.sequence,tick:s.tick,battleId:battle(s),kind,type,data:structuredClone(data)};s.g1d.events.push(e);return e;}
const records=(s,k)=>s.g1d.events.filter(e=>e.kind===k);
function evidence(s,k){const r=records(s,k),used=new Set(r.filter(e=>e.type==='researched').map(e=>e.data.actionId));return r.find(e=>(k==='paper'?s.g1d.paper.stage===0?['face-removed']:['rewritten']:k==='hand'?['held']:s.g1d.child.stage===0?['commanded']:['swallowed']).includes(e.type)&&e.data.result==='blocked'&&!used.has(e.data.actionId));}
export const g1dAllowed=(s,c)=>!s?.g1d||s.g1d.testOnly===true&&c?.g1dIntegration==='G1D-ISOLATED'&&c.ownerId===s.settlement?.ownerId&&c.ownerId===s.g1d.ownerId;
export function newG1D(s,c){
 if(c?.g1dIntegration!=='G1D-ISOLATED'||c.ownerId!==s.settlement.ownerId||!distinct(c.g1dOwnership)||c.g1dOwnership.some(k=>!keys.includes(k)))throw Error('G1-D requires explicit isolated ownership');
 const record=k=>({owned:c.g1dOwnership.includes(k),actorId:k==='child'?null:c.g1dOwnership.includes(k)?'player-'+G1D_IDS[k]:null,stage:0,load:0,state:'CLOSED',targetId:null,battleId:null,token:null});
 const x={format:1,testOnly:true,ownerId:c.ownerId,manifest:digest(manifest(c)),sequence:0,events:[],completed:[],resolved:{},contacts:{},restrictions:{},consumed:[],hand:record('hand'),paper:record('paper'),child:{...record('child'),entityId:'g1d-independent-child',revival:0,puzzle:null},load:0};
 x.seal=seal(x);return x;
}
export function prepareG1D(s,c){if(!s.g1d||!g1dAllowed(s,c))return;contexts.set(s,c);if(s.combat&&!s.combat.g1dBattleId)s.combat.g1dBattleId=`${s.settlement.ownerId}:g1d:${s.settlement.nextEncounter}:${s.tick}`;}
function weight(s,k,bonus=0){return Math.min(10,(k==='child'?3:v1Ward(s,own(s,k),s.combat?.eventId||'shadow'))+mentalRuleBonus(s)+bonus);}
function affordable(s,k,v){
 if(!enabled(s,k)||s.energy<G1D_COSTS[v][0])return false;
 if(k==='child')return s.g1d.child.revival+G1D_COSTS[v][1]+(live(s,k)?1:0)<100;
 const p=structuredClone(s);p.g1d.load+=G1D_COSTS[v][2];return own(p,k).revivalProgress+growthFor(p,own(p,k),true,live(s,k)?1:0,G1D_COSTS[v][1])<100;
}
const contact=(s,t)=>{const e=s.g1d.contacts[t?.id];return e&&e.battleId===battle(s)&&e.tick>=s.tick-1&&t.spirit&&t.action.type==='contact'&&t.action.contactTarget==='player';};
const matching=(s,k,t)=>live(s,k)&&s.g1d[k].targetId===t?.id;
// A paid lock preserves its existing contact; blocking another attack creates no new one.
const handContact=(s,t)=>contact(s,t)||matching(s,'hand',t)&&t.spirit&&t.action.type==='contact'&&t.action.contactTarget==='player';
const faceValid=t=>t?.face&&t.face.targetId===t.id&&t.face.kind==='removable-face'&&t.memory===true;
const restricted=(s,t)=>s.g1d.restrictions[t.id]?.battleId===battle(s)&&s.g1d.restrictions[t.id].until>=s.tick;
const certificate=(s,c,t)=>(c.g1dCertificates||[]).find(p=>p.targetId===t.id&&p.review==='ISOLATED-REVIEW'&&p.capability==='contact-ward'&&!s.g1d.consumed.includes(p.id));
export function g1dAvailable(s,c){
 if(!s.g1d||!g1dAllowed(s,c)||!validG1D(s,c)||s.systems.death!=='alive'||s.crisis)return [];
 const out=[],t=target(s,c),x=s.g1d;
 if(!s.combat&&s.scene==='hub'){for(const k of keys)if(enabled(s,k)&&x[k].stage<2&&evidence(s,k))out.push(`g1dp:${k}:research:${x[k].stage+1}`);return out;}
 if(!s.combat||s.combat.eyeV6?.pending)return out;
 if(s.combat.position!=='exposed'||!t){for(const k of keys)if(live(s,k)&&affordable(s,k,verbs[k][2]))out.push(`g1dp:${k}:${verbs[k][2]}`);return out;}
 for(const k of keys){const v=x[k];if(v.state==='UNCONTROLLED')continue;
  const add=verb=>{if(affordable(s,k,verb))out.push(`g1dp:${k}:${verb}`);};
  if(live(s,k))add(verbs[k][2]);
  if(k==='hand'){
   if(v.state==='CLOSED'&&contact(s,t))add('lock');
   if(matching(s,k,t)&&handContact(s,t)&&v.stage>=1)add('suppress');
  }
  if(k==='paper'){
   if(v.state==='CLOSED'&&contact(s,t)&&faceValid(t))add('face');
   if(matching(s,k,t)&&v.stage>=1&&faceValid(t)&&v.token===t.face.id)add('rewrite');
  }
  if(k==='child'){
   if(t.spirit&&(v.state==='CLOSED'||matching(s,k,t)))add('command');
   if(matching(s,k,t)&&v.stage>=1&&t.spirit&&restricted(s,t)&&!v.puzzle&&certificate(s,c,t))add('swallow');
  }
 }
 return out;
}
export function g1dFilter(s,actions){
 if(!s.g1d)return actions;
 const ids=[s.g1d.hand.actorId,s.g1d.paper.actorId].filter(Boolean),unresolved=s.g1d.events.some(e=>e.type==='lost-control');
 return actions.filter(a=>!['capture','ability','practice','restrict','combat:restrict','combat:combo','abandon'].includes(a)&&!a.startsWith('combat:aid:')&&!ids.some(id=>['practice:','study:','combat:ability:','abandon:'].some(p=>a===p+id))&&!(unresolved&&(a==='combat:start'||a.startsWith('enter:'))));
}
function close(v){v.state='CLOSED';v.battleId=null;v.targetId=null;v.token=null;}
export function applyG1D(s,a,c){
 const [,k,verb]=a.split(':'),v=s.g1d[k],t=target(s,c);
 if(verb==='research'){const e=evidence(s,k);v.stage++;fact(s,k,'researched',{stage:v.stage,evidenceSeq:e.seq,actionId:e.data.actionId});return {used:null,usage:0};}
 const cost=G1D_COSTS[verb];s.energy-=cost[0];v.load+=cost[2];s.g1d.load+=cost[2];fact(s,k,'paid',{verb,cost});
 if(k==='child')v.revival=Math.min(100,v.revival+cost[1]);
 if(['release','recover','recall'].includes(verb)){fact(s,k,'ceased',{targetId:v.targetId});close(v);return {used:v.actorId,usage:cost[1]};}
 const actionId=`${battle(s)}:player:${s.tick}`;
 if(verb==='face'){
  const attack=weight(s,k),result=ruleContest(attack,t.weight);
  fact(s,k,'face-contest',{targetId:t.id,attack,defense:t.weight,result,actionId});
  if(result==='blocked'){
   v.state='CONTROLLED';v.battleId=battle(s);v.targetId=t.id;v.token=t.face.id;
   fact(s,k,'face-removed',{targetId:t.id,mediumId:v.token,contactSeq:s.g1d.contacts[t.id].seq,actionId,result});
  }
 }else if(verb==='rewrite'){
  // Only the current encounter intent is affected; never assign history/save/NPC fields.
  fact(s,k,'face-written',{targetId:t.id,mediumId:v.token,scope:'CURRENT-INTENT',actionId});
  fact(s,k,'face-reattached',{targetId:t.id,mediumId:v.token,actionId});
  const attack=weight(s,k,1+(v.stage>=2?1:0)),result=ruleContest(attack,t.weight);
  fact(s,k,'rewritten',{targetId:t.id,attack,defense:t.weight,result,actionId});
  if(result!=='failed')s.g1d.restrictions[t.id]={battleId:battle(s),until:s.tick+(v.stage>=2?2:1),kind:k};
 }else if(verb==='swallow'){
  const cert=certificate(s,c,t),attack=weight(s,k,v.stage>=2?1:0),result=ruleContest(attack,t.weight);
  fact(s,k,'swallowed',{targetId:t.id,certificateId:cert.id,attack,defense:t.weight,result,actionId});
  if(result==='blocked'){v.puzzle=structuredClone(cert);s.g1d.consumed.push(cert.id);}
 }else{
  const attack=weight(s,k,(v.stage>=1?1:0)+(verb==='suppress'&&v.stage>=2?1:0)),result=ruleContest(attack,t.weight);
  fact(s,k,verb==='command'?'commanded':'held',{targetId:t.id,attack,defense:t.weight,result,actionId,contactSeq:k==='hand'?s.g1d.contacts[t.id].seq:null});
  if(result!=='failed'){
   v.state='CONTROLLED';v.targetId=t.id;v.battleId=battle(s);
   if(result==='blocked')s.g1d.restrictions[t.id]={battleId:battle(s),until:s.tick+(v.stage>=2?2:1),kind:k};
  }
 }
 s.journal.push(g1dLabel(a)+'：候选隔离对抗；已付代价，不授予正式来源或获取资格。');
 return {used:v.actorId,usage:cost[1]};
}
export function g1dIntent(s,r,intent){
 const c=contexts.get(s),t=target(s,c);
 if(!s.g1d||!g1dAllowed(s,c)||!t||r.instanceId!==t.id||intent?.cancelled||intent?.simulation||intent&&intent.kind!=='ordinary')return intent;
 return {...intent,kind:'ordinary',g1dTyped:true,sourceId:t.id,actionType:t.action.type,weight:t.weight,damage:t.action.damage};
}
export function g1dEnemy(s,r,intent,log){
 const c=contexts.get(s),t=target(s,c),x=s.g1d;
 if(!x||!intent?.g1dTyped||intent.sourceId!==t?.id||r.instanceId!==t.id||s.combat.position!=='exposed')return false;
 const actionId=`${battle(s)}:enemy:${s.combat.clock}:${t.id}`,prior=x.resolved[actionId];
 if(prior){intent.damage=prior.damage;intent.g1dOriginalDamage=prior.original;return prior.blocked;}
 const original=intent.damage;let damage=original,blocked=false;
 // A dispatched contact intent is not proof that it survived later defences.
 for(const k of keys){
  if(!matching(s,k,t))continue;
  if(k==='hand'&&!handContact(s,t)||k==='paper'&&(!faceValid(t)||x.paper.token!==t.face.id||!restricted(s,t)))continue;
  let bonus=x[k].stage>=1?1:0;if(x[k].stage>=2)bonus++;
  if(k==='child'&&x.child.stage>=2&&x.child.puzzle?.capability==='contact-ward'&&t.action.type==='contact')bonus++;
  const attack=weight(s,k,bonus),result=ruleContest(attack,t.weight);
  fact(s,k,'intercepted',{targetId:t.id,actionId,attack,defense:t.weight,result});
  if(result==='blocked'){blocked=true;log('对抗',g1dLabel(`g1dp:${k}:${verbs[k][0]}`)+'阻断一次匹配行动；不击杀或复制目标。');break;}
  if(result==='partial')damage=Math.min(damage,Math.ceil(original/2));
 }
 x.resolved[actionId]={original,damage,blocked};intent.damage=damage;intent.g1dOriginalDamage=original;return blocked;
}
export function finishG1DContact(s,r,intent,reached){
 const c=contexts.get(s),t=target(s,c),x=s.g1d;
 if(!x||!g1dAllowed(s,c)||!s.combat||!intent?.g1dTyped||intent.cancelled||intent.simulation||intent.sourceId!==t?.id||r.instanceId!==t.id)return;
 const actionId=`${battle(s)}:enemy:${s.combat.clock}:${t.id}`,receipt=x.resolved[actionId];
 if(!receipt||receipt.contactResolved!==undefined)return;
 receipt.contactResolved=!!reached;
 if(!reached||s.combat.position!=='exposed'||intent.actionType!=='contact'||t.action.type!=='contact'||t.action.contactTarget!=='player'||!t.spirit)return;
 const e=fact(s,'hand','contact',{targetId:t.id,actionId});x.contacts[t.id]={seq:e.seq,tick:s.tick,battleId:battle(s)};
}
export function g1dMaintenance(s){const out={};if(s.g1d)for(const k of ['hand','paper'])if(live(s,k))out[s.g1d[k].actorId]=1;return out;}
export function advanceG1D(before,s,a,c){
 if(!s.g1d||!g1dAllowed(s,c))return;
 const x=s.g1d;
 if(c.requestId&&!x.completed.some(v=>v.id===c.requestId))x.completed.push({id:c.requestId,action:a});
 if(s.tick!==before.tick){
  if(x.child.state==='CONTROLLED')x.child.revival=Math.min(100,x.child.revival+1);
  for(const k of keys){const v=x[k];if(v.state!=='CONTROLLED')continue;
   if(before.crisis||!s.combat||v.battleId!==battle(s)||!enabled(s,k)||s.systems.death!=='alive'){
    v.state='UNCONTROLLED';fact(s,k,'lost-control',{targetId:v.targetId,encounterId:v.battleId,eventId:before.combat?.eventId??null,reason:!s.combat?'ENCOUNTER_ENDED':'CONTROL_LOST',resolution:'UNRESOLVED'});
   }else if(k!=='child'&&(own(s,k).revivalProgress>=70||x.load>30)){
    s.life=Math.max(0,s.life-1);fact(s,k,'host-risk',{damage:1});
   }
  }
  if(x.child.state==='CONTROLLED'&&(x.child.revival>=70||x.child.load>30)){
   s.life=Math.max(0,s.life-2);fact(s,'child','constraint-risk',{damage:2});
  }
 }
 if(s.life===0&&s.systems.death==='alive')s.systems.death='pending';
 sign(s);
}
export function g1dDuplicate(s,a,c){return !!s.g1d&&g1dAllowed(s,c)&&validG1D(s,c)&&s.g1d.completed.some(v=>v.id===c?.requestId);}
export function g1dLabel(a){const [,k,v,n]=a.split(':');return v==='research'?`${{hand:'鬼手 H',paper:'鬼报纸 N',child:'鬼童 T'}[k]}${n} 实证研究`:({lock:'鬼手·接触锁定',suppress:'鬼手·灵异压制',release:'解除接触',face:'鬼报纸·面容媒介接触',rewrite:'鬼报纸·有限记忆改写',recover:'回收媒介',command:'鬼童·指令行动',swallow:'鬼童·限制吞噬',recall:'召回约束'}[v]||'G1-D候选行动');}
export function g1dCost(a){const cost=G1D_COSTS[a.split(':')[2]];return cost?`候选：能量${cost[0]} / 本体基础复苏+${cost[1]}pp / 累计负荷+${cost[2]}；有效维持每行动+1pp；失败不退费。`:'消耗独立行动证据，不回滚历史或代价。';}
export function validG1D(s,c){
 const x=s?.g1d,holders=Array.isArray(s?.spirits)?s.spirits.filter(g=>g&&Object.values(G1D_IDS).includes(g.sourceId)):[];
 if(x===undefined)return holders.length===0&&!Object.values(G1D_IDS).some(id=>s?.systems?.sealed?.includes(id)||s?.systems?.aids?.[id]||s?.knowledge?.[id]||s?.outcomes?.[id]||s?.scene===id);
 try{
  if(!g1dAllowed(s,c)||x.format!==1||x.seal!==seal(x)||x.manifest!==digest(manifest(c))||!distinct(c.g1dOwnership)||c.g1dOwnership.some(k=>!keys.includes(k))||!Array.isArray(c.g1dTargets)||!distinct(c.g1dTargets.map(t=>t.id))||!int(x.sequence,10000)||x.events.length!==x.sequence||!num(x.load)||!distinct(x.completed.map(v=>v.id))||x.completed.some(v=>typeof v.id!=='string'||typeof v.action!=='string')||!distinct(x.consumed))return false;
  for(const t of c.g1dTargets)if(!/^source:|^test:/.test(t.id)||!num(t.weight,10)||typeof t.spirit!=='boolean'||typeof t.memory!=='boolean'||!['body','contact','audio','domain'].includes(t.action.type)||!int(t.action.damage,100)||t.action.type==='contact'&&t.action.contactTarget!=='player'||t.face&&(!faceValid(t)||typeof t.face.id!=='string'))return false;
  if(!distinct((c.g1dCertificates||[]).map(p=>p.id))||(c.g1dCertificates||[]).some(p=>p.review!=='ISOLATED-REVIEW'||p.capability!=='contact-ward'||!c.g1dTargets.some(t=>t.id===p.targetId)||typeof p.id!=='string'))return false;
  let load=0,last=0;
  const types=['contact','paid','held','face-contest','face-removed','face-written','face-reattached','rewritten','commanded','swallowed','ceased','intercepted','researched','lost-control','host-risk','constraint-risk'];
  for(const [i,e] of x.events.entries()){
   if(e.seq!==i+1||!int(e.tick,s.tick)||e.tick<last||!keys.includes(e.kind)||!types.includes(e.type)||!e.data)return false;last=e.tick;
   if(e.type==='paid'&&(!verbs[e.kind].includes(e.data.verb)||!same(e.data.cost,G1D_COSTS[e.data.verb])))return false;
   if(e.data.attack!==undefined&&(!num(e.data.attack,10)||!num(e.data.defense,10)||e.data.result!==ruleContest(e.data.attack,e.data.defense)))return false;
  }
  for(const k of keys){const v=x[k],r=records(s,k),paid=r.filter(e=>e.type==='paid'),learned=r.filter(e=>e.type==='researched');
   if(v.owned!==c.g1dOwnership.includes(k)||v.actorId!==(k==='child'?null:v.owned?'player-'+G1D_IDS[k]:null)||k!=='child'&&v.owned&&!own(s,k)||!int(v.stage,2)||learned.length!==v.stage||!num(v.load)||paid.reduce((n,e)=>n+e.data.cost[2],0)!==v.load||!['CLOSED','CONTROLLED','UNCONTROLLED'].includes(v.state))return false;
   load+=v.load;const used=new Set();
   for(const [i,e] of learned.entries()){const proof=r.find(p=>p.seq===e.data.evidenceSeq&&p.seq<e.seq&&(k==='hand'?['held']:k==='paper'?(i===0?['face-removed']:['rewritten']):(i===0?['commanded']:['swallowed'])).includes(p.type)&&p.data.result==='blocked'&&p.data.actionId===e.data.actionId);if(e.data.stage!==i+1||!proof||used.has(e.data.actionId))return false;used.add(e.data.actionId);}
   if(v.state==='CLOSED'&&(v.targetId!==null||v.battleId!==null||v.token!==null)||v.state!=='CLOSED'&&(!v.owned||typeof v.battleId!=='string'||!c.g1dTargets.some(t=>t.id===v.targetId)))return false;
  }
  if(load!==x.load||holders.some(g=>!['hand','paper'].some(k=>own(s,k)===g))||!num(x.child.revival,100)||x.child.actorId!==null||x.child.entityId!=='g1d-independent-child')return false;
  if(x.child.puzzle&&(!(c.g1dCertificates||[]).some(p=>same(p,x.child.puzzle))||!x.consumed.includes(x.child.puzzle.id)||!records(s,'child').some(e=>e.type==='swallowed'&&e.data.result==='blocked'&&e.data.certificateId===x.child.puzzle.id)))return false;
  return true;
 }catch{return false;}
}
