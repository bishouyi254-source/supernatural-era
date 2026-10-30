// G1-C candidate production mechanics; no ordinary acquisition or simulated story grant.
// Holder creation requires explicit isolated integration ownership, not a playable save.
// Novel claims are limited to ghost fire, ghost wind and tallest-body pressure motifs.
import {activeIds,v1Ward} from './v1.js';
import {growthFor,revivalCrisisFor} from './spirits.js';
import {ruleBlocked} from './evolution-model.js';
import {ruleContest} from './rules.js';

export const G1C_SOURCES=Object.freeze({fire:'ghost-fire',wind:'ghost-wind',press:'ghost-press'});
export const G1C_COSTS=Object.freeze({
 ignite:[1,3,2],concentrate:[1,4,2],quench:[1,2,1],
 raise:[1,3,2],invade:[1,5,3],calm:[1,2,1],
 fall:[1,4,2],intensify:[1,5,3],lift:[1,2,1]});
const contexts=new WeakMap();
const own=(s,k)=>s.spirits.find(g=>g.id===s.g1c?.[k]?.actorId&&g.sourceId===G1C_SOURCES[k]);
const has=(v,type)=>v.evidence.some(e=>e.type===type);
const battle=s=>s.combat?.g1cBattleId||null;
const region=s=>s.combat?.position||null;
const integer=(v,max=1e9)=>Number.isInteger(v)&&v>=0&&v<=max;
const number=(v,max=1e9)=>Number.isFinite(v)&&v>=0&&v<=max;
const distinct=a=>Array.isArray(a)&&new Set(a).size===a.length;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function seal(x){let h=2166136261;const {seal:unused,...data}=x;for(const ch of JSON.stringify(data))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h.toString(16);}
const sealState=s=>{s.g1c.seal=seal(s.g1c);};
export const g1cAllowed=(s,c)=>!s.g1c||s.g1c.testOnly===true&&c?.g1cIntegration==='G1C-PRODUCTION'&&c.ownerId===s.settlement?.ownerId&&c.ownerId===s.g1c.ownerId;
export function newG1C(s,c){
 if(c?.g1cIntegration!=='G1C-PRODUCTION'||c?.ownerId!==s.settlement?.ownerId||!Array.isArray((c.g1cOwnership??c.ownership)))throw Error('G1-C requires typed isolated integration');
 const record=k=>({actorId:(c.g1cOwnership??c.ownership).includes(k)?'player-'+G1C_SOURCES[k]:null,stage:0,load:0,evidence:[],state:'CLOSED',battleId:null,region:null,targetId:null});
 const x={format:1,testOnly:true,ownerId:c.ownerId,load:0,sequence:0,events:[],completed:[],positions:{},participantActions:{},
 fire:record('fire'),wind:record('wind'),press:record('press')};
 x.seal=seal(x);return x;
}
function fact(s,k,type,data={}){
 const x=s.g1c,e={seq:++x.sequence,tick:s.tick,battleId:battle(s),kind:k,type,data:structuredClone(data)};
 x.events.push(e);x[k].evidence.push(structuredClone(e));return e;
}
function enabled(s,k){
 const g=own(s,k);return !!g&&activeIds(s).includes(g.id)&&!revivalCrisisFor(s,g)&&!ruleBlocked(s,g.id)&&!s.systems.combinations.some(v=>v.disabledId===g.id);
}
function weight(s,k){const g=own(s,k);return g?Math.min(10,v1Ward(s,g,s.combat?.eventId||'blood')):0;}
function affordable(s,k,verb){
 if(!enabled(s,k)||s.energy<G1C_COSTS[verb][0])return false;
 const p=structuredClone(s),g=own(p,k);p.g1c.load+=G1C_COSTS[verb][2];
 return g.revivalProgress+growthFor(p,g,true,0,G1C_COSTS[verb][1])<100;
}
const targets=(s,c)=>c?.targets?.map(t=>({...t,region:s.g1c?.positions?.[t.id]??t.region})).filter(t=>t.region===region(s))||[];
const sourceTarget=(s,c)=>targets(s,c).find(t=>t.id===s.combat?.sourceId);
function tallest(s,c){
 if(!number(c?.playerHeightCm,260))return null;
 const list=[{id:'player-body',heightCm:c.playerHeightCm},...targets(s,c).filter(t=>t.body===true&&number(t.heightCm,260)).map(t=>({id:t.id,heightCm:t.heightCm}))];
 // Do not infer heights of untyped bodies; missing values block the candidate.
 if(targets(s,c).some(t=>t.body===true&&!number(t.heightCm,260)))return null;
 const max=Math.max(...list.map(t=>t.heightCm)),high=list.filter(t=>t.heightCm===max);
 return high.length===1?high[0]:null;
}
export function prepareG1C(s,c){
 if(!s.g1c||!g1cAllowed(s,c))return;
 contexts.set(s,c);
 if(s.combat&&!s.combat.g1cBattleId)s.combat.g1cBattleId=`${s.settlement.ownerId}:g1c:${s.settlement.nextEncounter}:${s.tick}`;
 sealState(s);
}
export function g1cFilter(s,actions){
 if(!s.g1c)return actions;
 const ids=Object.keys(G1C_SOURCES).map(k=>s.g1c[k].actorId).filter(Boolean);
 return actions.filter(a=>!a.startsWith('abandon')&&!a.startsWith('combat:aid:')&&!['combat:restrict','restrict','capture','ability','practice'].includes(a)&&!ids.some(id=>['combat:ability:','practice:','study:'].some(p=>a===p+id))
  &&!(ids.includes(s.spirits[0]?.id)&&['ability','practice'].includes(a))&&a!=='combat:combo');
}
const inBattle=(s,v)=>s.combat&&v.battleId===battle(s)&&v.state==='CONTROLLED';
const live=(s,k)=>inBattle(s,s.g1c[k])&&enabled(s,k);
const pressureValid=(s,c)=>live(s,'press')&&s.g1c.press.region===region(s)&&tallest(s,c)?.id===s.g1c.press.targetId;
export const g1cBodyBlocked=(s,c)=>!!s.g1c&&pressureValid(s,c)&&s.g1c.press.targetId==='player-body'&&ruleContest(weight(s,'press')+(s.g1c.press.amplified?1:0),c.playerRuleWeight)==='blocked';
export function g1cStruggle(s,action,c){
 if(action!=='combat:force'||!g1cBodyBlocked(s,c))return;
 const v=s.g1c.press,result=ruleContest(c.playerRuleWeight,weight(s,'press')+(v.amplified?1:0));
 fact(s,'press',result==='blocked'?'escaped':'action-suppressed',{targetId:'player-body',result,actionType:'body'});
 if(result==='blocked'){v.state='CLOSED';v.battleId=null;v.region=null;v.targetId=null;v.amplified=false;}
}
// Read-only explanation of the zero-energy branch. It neither grants energy nor
// weakens an active ghost. Only valid integration holders can see this detail.
export function g1cEnergyWarning(s,c,legal=[]){
 if(!s?.g1c||!s.combat||s.energy!==0||!g1cAllowed(s,c))return '';
 const manifest=Object.keys(G1C_SOURCES).filter(k=>inBattle(s,s.g1c[k]));
 if(!manifest.length)return '';
 const names={fire:'鬼火',wind:'鬼风',press:'鬼压人'};
 const remaining=manifest.map(k=>names[k]).join('、');
 if(g1cBodyBlocked(s,c))return `能量已耗尽：${remaining}仍在作用，且身体被鬼压人压制。不能免费解除或撤离；仅可按现有合法清单尝试普通力量挣脱／观察，失败仍推进敌方危险与复苏。不是测试通过状态。`;
 if(legal.includes('combat:retreat'))return `能量已耗尽：${remaining}仍在作用，无法免费收束。可选择现有撤离行动，但离开时失去控制的灵异后果仍保留；不能计作安全完成本场。`;
 return `能量已耗尽：${remaining}仍在作用，当前没有合法免费收束或撤离。只允许执行引擎实际提供的行动并承担后果；不得注入额外资源。`;
}
export function g1cAvailable(s,c){
 if(!s.g1c||!g1cAllowed(s,c)||!validG1C(s,c)||s.systems.death!=='alive'||s.crisis)return [];
 const x=s.g1c,out=[];
 if(s.combat&&!s.combat.eyeV6?.pending){
  const t=sourceTarget(s,c);
  if(g1cBodyBlocked(s,c))return affordable(s,'press','lift')?['g1cp:press:lift']:[];
  if(x.fire.state==='CLOSED'&&affordable(s,'fire','ignite'))out.push('g1cp:fire:ignite');
  if(inBattle(s,x.fire)){
   if(t?.spirit===true&&t.action&&x.fire.region===region(s)&&x.fire.stage>=1&&affordable(s,'fire','concentrate'))out.push('g1cp:fire:concentrate:'+t.id);
   if(affordable(s,'fire','quench'))out.push('g1cp:fire:quench');
  }
  if(x.wind.state==='CLOSED'&&affordable(s,'wind','raise'))out.push('g1cp:wind:raise');
  if(inBattle(s,x.wind)){
   if(t?.action?.type==='domain'&&t.domainWeight>0&&x.wind.region===region(s)&&x.wind.stage>=2&&affordable(s,'wind','invade'))out.push('g1cp:wind:invade:'+t.id);
   if(affordable(s,'wind','calm'))out.push('g1cp:wind:calm');
  }
  if(x.press.state==='CLOSED'&&tallest(s,c)&&affordable(s,'press','fall'))out.push('g1cp:press:fall');
  if(inBattle(s,x.press)){
   if(x.press.stage>=2&&x.press.region===region(s)&&tallest(s,c)?.id===x.press.targetId&&affordable(s,'press','intensify'))out.push('g1cp:press:intensify');
   if(affordable(s,'press','lift'))out.push('g1cp:press:lift');
  }
 }
 if(!s.combat&&s.scene==='hub'){
  const requirements={fire:[['burned','burn-resisted'],['domain-contest']],wind:[['interfered','interference-resisted'],['domain-contest']],press:[['tallest-verified'],['action-suppressed']]};
  for(const k of Object.keys(G1C_SOURCES)){
   const v=x[k];if(!enabled(s,k)||v.stage>=2)continue;
   const r=requirements[k][v.stage];
   if(v.stage===0?r.some(t=>has(v,t)):r.every(t=>has(v,t)))out.push(`g1cp:${k}:research:${v.stage+1}`);
  }
 }
 return out;
}
function pay(s,k,verb){
 const v=s.g1c[k],cost=G1C_COSTS[verb];s.energy-=cost[0];v.load+=cost[2];s.g1c.load+=cost[2];
 fact(s,k,'paid',{verb,cost});return {used:v.actorId,usage:cost[1]};
}
export function applyG1C(s,action,c){
 const [,k,verb,...tail]=action.split(':'),v=s.g1c[k],id=tail.join(':');
 if(verb==='research'){v.stage++;fact(s,k,'researched',{stage:v.stage});s.journal.push(g1cLabel(action)+'：只确认已记录的真实规律，高阶拼图仍锁定。');return {used:null,usage:0};}
 const cost=pay(s,k,verb),t=sourceTarget(s,c);
 if(verb==='ignite'||verb==='raise'){
  v.state='CONTROLLED';v.battleId=battle(s);v.region=region(s);fact(s,k,'manifested',{region:v.region});
 }
 if(verb==='quench'||verb==='calm'||verb==='lift'){
  fact(s,k,'ceased',{previousTarget:v.targetId});v.state='CLOSED';v.battleId=null;v.region=null;v.targetId=null;if(k==='press')v.amplified=false;
 }
 if(k==='fire'&&verb==='concentrate'){
  v.targetId=id;fact(s,k,'focused',{targetId:id});
 }
 if(k==='wind'&&verb==='invade'){
  v.targetId=id;fact(s,k,'focused',{targetId:id});
 }
 if(k==='press'&&verb==='fall'){
  v.amplified=false;
  const chosen=tallest(s,c);
  fact(s,k,'tallest-verified',{targetId:chosen.id,heightCm:chosen.heightCm});
  const opponent=chosen.id==='player-body'?c.playerRuleWeight:targets(s,c).find(t=>t.id===chosen.id)?.ruleWeight;
  const contest=ruleContest(weight(s,k),opponent);
  fact(s,k,'pressure-contest',{targetId:chosen.id,result:contest});
  if(contest!=='failed'){v.state='CONTROLLED';v.battleId=battle(s);v.targetId=chosen.id;v.region=region(s);}
 }
 if(k==='press'&&verb==='intensify'){
  const opponent=v.targetId==='player-body'?c.playerRuleWeight:targets(s,c).find(t=>t.id===v.targetId)?.ruleWeight;
  const contest=ruleContest(weight(s,k),opponent);
  v.amplified=contest!=='failed';fact(s,k,'pressure-contest',{targetId:v.targetId,result:contest,amplified:true});
 }
 s.journal.push(g1cLabel(action)+'：实际行动已付费；未获得额外厉鬼或剧情资格。');return cost;
}
// Only explicit isolated source actions can supply the missing body/domain intent model.
// A domainWeight alone never turns an ordinary body/audio action into a domain action.
export function g1cIntent(s,r,intent){
 const c=contexts.get(s),t=sourceTarget(s,c);
 if(!s.g1c||!g1cAllowed(s,c)||!t?.action||t.id!==r.instanceId||intent?.cancelled||intent?.simulation||intent&&intent.kind!=='ordinary')return intent;
 return {...intent,kind:'ordinary',g1cTyped:true,sourceId:t.id,actionType:t.action.type,targetRegion:t.action.targetRegion,
  weight:t.action.type==='domain'?t.domainWeight:t.ruleWeight,damage:t.action.damage};
}
export function g1cEnemy(s,r,intent,log){
 const c=contexts.get(s),x=s.g1c,t=sourceTarget(s,c);
 if(!x||!g1cAllowed(s,c)||!s.combat||!intent?.g1cTyped||intent.cancelled||intent.simulation||!t||t.id!==r.instanceId||intent.sourceId!==t.id)return false;
 const recordAction=(a,blocked)=>{const v=x.participantActions[a.id]??={attempts:0,blocked:0,completed:0};v.attempts++;v[blocked?'blocked':'completed']++;if(!blocked&&a.action.moveTo)x.positions[a.id]=a.action.moveTo;};
 // Typed allies have their own initiative and movement. Pressure prevents the actual move.
 for(const a of targets(s,c).filter(a=>a.faction==='ally'&&a.action)){
  let blocked=false;
  if(pressureValid(s,c)&&x.press.targetId===a.id){const result=ruleContest(weight(s,'press')+(x.press.amplified?1:0),a.ruleWeight);
   fact(s,'press',result==='blocked'?'action-suppressed':'pressure-resisted',{targetId:a.id,result,actionType:a.action.type});
   blocked=result==='blocked';
   if(result==='failed'){x.press.state='CLOSED';x.press.battleId=null;x.press.region=null;x.press.targetId=null;x.press.amplified=false;fact(s,'press','escaped',{targetId:a.id});}
  }
  recordAction(a,blocked);
 }
 if(region(s)!=='exposed'||t.region!==region(s)||intent.targetRegion!==region(s))return false;
 let intercepted=false,damage=intent.damage;
 for(const k of ['fire','wind','press']){
  const v=x[k];if(!live(s,k)||v.region!==region(s))continue;
  if(k==='fire'&&!t.spirit||k==='wind'&&(intent.actionType!=='domain'||!(t.domainWeight>0))||k==='press'&&(!pressureValid(s,c)||v.targetId!==t.id))continue;
  const defense=k==='wind'?t.domainWeight:k==='press'?t.ruleWeight:intent.weight;
  const attack=weight(s,k)+(v.targetId===t.id&&k!=='press'?1:0)+(k==='press'&&v.amplified?1:0);
  const result=ruleContest(attack,defense);
  fact(s,k,k==='fire'?(result==='failed'?'burn-resisted':'burned'):k==='wind'?(result==='failed'?'interference-resisted':'interfered'):(result==='blocked'?'action-suppressed':'pressure-resisted'),
   {targetId:t.id,result,actionType:intent.actionType,attack,defense});
  if(intent.actionType==='domain'&&k!=='press')fact(s,k,'domain-contest',{targetId:t.id,result,attack,defense});
  if(result==='blocked'){intercepted=true;log('对抗',g1cLabel('g1cp:'+k+':'+({fire:'ignite',wind:'raise',press:'fall'}[k]))+'阻断匹配行动；源头仍存在。');}
  else if(result==='partial')damage=Math.min(damage,Math.ceil(intent.damage/2));
  if(k==='press'&&result==='failed'){v.state='CLOSED';v.battleId=null;v.region=null;v.targetId=null;v.amplified=false;fact(s,k,'escaped',{targetId:t.id});}
 }
 recordAction(t,intercepted);intent.damage=damage;return intercepted;
}
export function g1cMaintenance(s){
 const out={};if(!s.g1c||!s.combat)return out;
 for(const k of Object.keys(G1C_SOURCES))if(live(s,k))out[own(s,k).id]=1;
 return out;
}
export function advanceG1C(before,s,action,c){
 if(!s.g1c||!g1cAllowed(s,c))return;
 if(c?.requestId&&!s.g1c.completed.includes(c.requestId))s.g1c.completed.push(c.requestId);
 if(s.tick===before.tick){sealState(s);return;}
 for(const k of Object.keys(G1C_SOURCES)){
  const v=s.g1c[k];if(v.state!=='CONTROLLED')continue;
  if(!s.combat||v.battleId!==battle(s)||!own(s,k)||revivalCrisisFor(s,own(s,k))||!enabled(s,k)){
   v.state='UNCONTROLLED';fact(s,k,'lost-control',{lastTarget:v.targetId});continue;
  }
  if(k==='press'&&(!pressureValid(s,c))){v.state='CLOSED';v.battleId=null;v.region=null;v.targetId=null;v.amplified=false;fact(s,k,'scope-ended');continue;}
  if(k==='fire'&&own(s,k).revivalProgress>=70){s.life=Math.max(0,s.life-2);fact(s,k,'backlash',{damage:2});}
  if(k==='press'){s.life=Math.max(0,s.life-1);fact(s,k,'host-burden',{damage:1,targetId:v.targetId});}
 }
 if(s.life===0)s.systems.death='pending';
 sealState(s);
}
export function g1cLabel(a){
 const [,k,v,n]=a.split(':');
 if(v==='research')return `${{fire:'鬼火',wind:'鬼风',press:'鬼压人'}[k]}实证研究 ${n}`;
 return ({ignite:'燃起鬼火',concentrate:'集中焚烧',quench:'收敛鬼火',raise:'唤起鬼风',invade:'侵入鬼域',calm:'平息鬼风',fall:'鬼压人·落压',intensify:'鬼压人·加压',lift:'解除鬼压人'}[v]||'专属行动');
}
export function g1cCost(a){const v=G1C_COSTS[a.split(':')[2]];return v?`能量${v[0]}；本鬼基础复苏+${v[1]}pp；持续负荷+${v[2]}。当前受控鬼火／风／压制每有效行动再计本鬼+1pp；合法抵抗不退费。`:'只复核真实证据，推进一行动；不重置累计代价。';}
export function validG1C(s,c){
 const x=s?.g1c,keys=Object.keys(G1C_SOURCES),holders=Array.isArray(s?.spirits)&&s.spirits.some(g=>g&&Object.values(G1C_SOURCES).includes(g.sourceId));
 if(x===undefined)return !holders&&!Object.values(G1C_SOURCES).some(id=>s?.systems?.sealed?.includes(id)||Object.hasOwn(s?.systems?.aids||{},id)||Object.hasOwn(s?.knowledge||{},id)||Object.hasOwn(s?.outcomes||{},id)||s?.scene===id);
 try{
  if(!g1cAllowed(s,c)||x.testOnly!==true||x.format!==1||x.seal!==seal(x)||x.ownerId!==c.ownerId||!integer(x.sequence)||!number(x.load)||!Array.isArray(x.events)||x.events.length!==x.sequence||x.events.length>4000||!distinct(x.completed)||x.completed.some(v=>typeof v!=='string'))return false;
  if(!s||!Array.isArray(s.spirits)||!distinct((c.g1cOwnership??c.ownership))||(c.g1cOwnership??c.ownership).some(k=>!keys.includes(k))||!Array.isArray(c.targets)||!distinct(c.targets.map(t=>t.id))||!number(c.playerHeightCm,260)||!number(c.playerRuleWeight,10))return false;
  const configured=s.v1?.active;if(configured!==null&&(!distinct(configured)||configured.length>(s.evolution?.third?.stage===5?3:2)||configured.some(id=>!s.spirits.some(g=>g?.id===id))))return false;
  if(!x.positions||!x.participantActions||typeof x.positions!=='object'||typeof x.participantActions!=='object'||Array.isArray(x.positions)||Array.isArray(x.participantActions))return false;
  for(const [id,p] of Object.entries(x.positions))if(!c.targets.some(t=>t.id===id)||!['safe','exposed'].includes(p))return false;
  for(const [id,v] of Object.entries(x.participantActions))if(!c.targets.some(t=>t.id===id)||!v||!integer(v.attempts)||!integer(v.blocked)||!integer(v.completed)||v.attempts!==v.blocked+v.completed)return false;
  for(const t of c.targets)if(!t.id?.startsWith('source:')&&!t.id?.startsWith('test:')||!['enemy','ally'].includes(t.faction)||!['safe','exposed'].includes(t.region)||typeof t.body!=='boolean'||typeof t.spirit!=='boolean'||!number(t.heightCm,260)||!number(t.ruleWeight,10)||!number(t.domainWeight,10))return false;
  for(const t of c.targets)if(t.action&&(!['body','domain'].includes(t.action.type)||!['safe','exposed'].includes(t.action.targetRegion)||!integer(t.action.damage,100)||t.action.type==='domain'&&t.domainWeight===0||t.action.moveTo!==undefined&&!['safe','exposed'].includes(t.action.moveTo)))return false;
  if(s.combat&&c.targets.filter(t=>t.id===s.combat.sourceId).length>1)return false;
  let lastTick=0;
  const legalTypes=['paid','researched','manifested','ceased','burned','burn-resisted','domain-contest','interfered','interference-resisted','tallest-verified','pressure-contest','action-suppressed','lost-control','backlash','host-burden','focused','pressure-resisted','scope-ended','escaped'];
  for(const [i,e] of x.events.entries()){
   if(e.seq!==i+1||!integer(e.tick,s.tick)||e.tick<lastTick||!keys.includes(e.kind)||!legalTypes.includes(e.type)||!e.data||typeof e.data!=='object')return false;
   lastTick=e.tick;
   if(e.type==='paid'&&!same(e.data.cost,G1C_COSTS[e.data.verb]))return false;
  }
  let load=0;
  const requirements={fire:[['burned','burn-resisted'],['domain-contest']],wind:[['interfered','interference-resisted'],['domain-contest']],press:[['tallest-verified'],['action-suppressed']]};
  for(const k of keys){
   const v=x[k],g=own(s,k),records=x.events.filter(e=>e.kind===k);
   if(v.actorId!==((c.g1cOwnership??c.ownership).includes(k)?'player-'+G1C_SOURCES[k]:null)||v.actorId&&!g||!integer(v.stage,2)||!number(v.load)||!same(v.evidence,records)||!['CLOSED','CONTROLLED','UNCONTROLLED'].includes(v.state)||v.amplified!==undefined&&typeof v.amplified!=='boolean')return false;
   const paid=records.filter(e=>e.type==='paid'),spent=paid.reduce((a,e)=>a+e.data.cost[2],0);if(spent!==v.load)return false;load+=spent;
   const learned=records.filter(e=>e.type==='researched');if(learned.length!==v.stage||learned.some((e,i)=>e.data.stage!==i+1))return false;
   for(const e of learned){const observed=records.filter(r=>r.seq<e.seq).map(r=>r.type),needed=requirements[k][e.data.stage-1];if(e.data.stage===1?!needed.some(t=>observed.includes(t)):!needed.every(t=>observed.includes(t)))return false;}
   if(v.state==='CLOSED'&&(v.battleId!==null||v.region!==null||v.targetId!==null))return false;
   if(v.state==='CONTROLLED'&&(!v.actorId||typeof v.battleId!=='string'||!['safe','exposed'].includes(v.region)||k==='press'&&!v.targetId))return false;
  }
  if(load!==x.load||holders&&s.spirits.some(g=>Object.values(G1C_SOURCES).includes(g.sourceId)&&!keys.some(k=>own(s,k)?.id===g.id)))return false;
  return true;
 }catch{return false;}
}
