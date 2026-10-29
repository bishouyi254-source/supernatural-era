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
 if(c?.g1cIntegration!=='G1C-PRODUCTION'||c?.ownerId!==s.settlement?.ownerId||!Array.isArray(c.ownership))throw Error('G1-C requires typed isolated integration');
 const record=k=>({actorId:c.ownership.includes(k)?'player-'+G1C_SOURCES[k]:null,stage:0,load:0,evidence:[],state:'CLOSED',battleId:null,region:null,targetId:null});
 const x={format:1,testOnly:true,ownerId:c.ownerId,load:0,sequence:0,events:[],completed:[],
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
const targets=(s,c)=>c?.targets?.filter(t=>t.region===region(s))||[];
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
 return actions.filter(a=>!ids.some(id=>['combat:ability:','practice:','study:'].some(p=>a===p+id))
  &&!(ids.includes(s.spirits[0]?.id)&&['ability','practice'].includes(a))&&a!=='combat:combo');
}
const inBattle=(s,v)=>s.combat&&v.battleId===battle(s)&&v.state==='CONTROLLED';
export function g1cAvailable(s,c){
 if(!s.g1c||!g1cAllowed(s,c)||!validG1C(s,c)||s.systems.death!=='alive'||s.crisis)return [];
 const x=s.g1c,out=[];
 if(s.combat&&!s.combat.eyeV6?.pending){
  const t=sourceTarget(s,c);
  if(x.fire.state==='CLOSED'&&affordable(s,'fire','ignite'))out.push('g1cp:fire:ignite');
  if(inBattle(s,x.fire)){
   if(t?.spirit===true&&x.fire.region===region(s)&&x.fire.stage>=1&&affordable(s,'fire','concentrate'))out.push('g1cp:fire:concentrate:'+t.id);
   if(affordable(s,'fire','quench'))out.push('g1cp:fire:quench');
  }
  if(x.wind.state==='CLOSED'&&affordable(s,'wind','raise'))out.push('g1cp:wind:raise');
  if(inBattle(s,x.wind)){
   if(t&&t.domainWeight>0&&x.wind.stage>=2&&affordable(s,'wind','invade'))out.push('g1cp:wind:invade:'+t.id);
   if(affordable(s,'wind','calm'))out.push('g1cp:wind:calm');
  }
  if(x.press.state==='CLOSED'&&tallest(s,c)&&affordable(s,'press','fall'))out.push('g1cp:press:fall');
  if(inBattle(s,x.press)){
   if(x.press.stage>=2&&affordable(s,'press','intensify'))out.push('g1cp:press:intensify');
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
  fact(s,k,'ceased',{previousTarget:v.targetId});v.state='CLOSED';v.battleId=null;v.region=null;v.targetId=null;
 }
 if(k==='fire'&&verb==='concentrate'){
  const contest=ruleContest(weight(s,k),Math.max(t.ruleWeight,t.domainWeight));
  fact(s,k,contest==='failed'?'burn-resisted':'burned',{targetId:id,result:contest});
  if(t.domainWeight>0)fact(s,k,'domain-contest',{targetId:id,result:contest});
 }
 if(k==='wind'&&verb==='invade'){
  const contest=ruleContest(weight(s,k),t.domainWeight);
  fact(s,k,'domain-contest',{targetId:id,result:contest});
  fact(s,k,contest==='failed'?'interference-resisted':'interfered',{targetId:id,result:contest});
 }
 if(k==='press'&&verb==='fall'){
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
  fact(s,k,'pressure-contest',{targetId:v.targetId,result:contest,amplified:true});
 }
 s.journal.push(g1cLabel(action)+'：实际行动已付费；未获得额外厉鬼或剧情资格。');return cost;
}
// Typed source action integration. The actual enemy initiative still belongs to combat.js.
export function g1cEnemy(s,r,intent,log){
 const c=contexts.get(s),x=s.g1c;
 if(!x||!g1cAllowed(s,c)||!s.combat||intent?.cancelled)return false;
 const t=sourceTarget(s,c);
 if(!t||t.id!==r.instanceId)return false;
 // Fire reports a contest only against an explicitly typed spirit medium; no HP bar, loot or automatic kill.
 if(inBattle(s,x.fire)&&x.fire.region===region(s)&&t.spirit===true){
  const contest=ruleContest(weight(s,'fire'),Math.max(t.ruleWeight,t.domainWeight));
  fact(s,'fire',contest==='failed'?'burn-resisted':'burned',{targetId:t.id,result:contest});
  if(t.domainWeight>0)fact(s,'fire','domain-contest',{targetId:t.id,result:contest});
 }
 if(inBattle(s,x.wind)&&x.wind.region===region(s)&&t.domainWeight>0){
  const contest=ruleContest(weight(s,'wind'),t.domainWeight);
  fact(s,'wind','domain-contest',{targetId:t.id,result:contest});
  fact(s,'wind',contest==='failed'?'interference-resisted':'interfered',{targetId:t.id,result:contest});
  if(contest==='blocked'){log('对抗','鬼风侵扰成功：阻断一次明确匹配的领域行动。');return true;}
 }
 if(inBattle(s,x.press)&&x.press.targetId===t.id){
  const contest=ruleContest(weight(s,'press'),t.ruleWeight);
  fact(s,'press','pressure-contest',{targetId:t.id,result:contest});
  if(contest==='blocked'){fact(s,'press','action-suppressed',{targetId:t.id,actionType:intent?.actionType||r.medium});log('对抗','鬼压人阻断一次真实源头行动，不等于关押。');return true;}
 }
 return false;
}
export function g1cMaintenance(s){
 const out={};if(!s.g1c||!s.combat)return out;
 for(const k of Object.keys(G1C_SOURCES))if(inBattle(s,s.g1c[k])&&own(s,k))out[own(s,k).id]=1;
 return out;
}
export function advanceG1C(before,s,action,c){
 if(!s.g1c||!g1cAllowed(s,c))return;
 if(c?.requestId&&!s.g1c.completed.includes(c.requestId))s.g1c.completed.push(c.requestId);
 if(s.tick===before.tick){sealState(s);return;}
 for(const k of Object.keys(G1C_SOURCES)){
  const v=s.g1c[k];if(v.state!=='CONTROLLED')continue;
  if(!s.combat||v.battleId!==battle(s)||!own(s,k)||revivalCrisisFor(s,own(s,k))||ruleBlocked(s,v.actorId)){
   v.state='UNCONTROLLED';fact(s,k,'lost-control',{lastTarget:v.targetId});continue;
  }
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
 const x=s?.g1c,keys=Object.keys(G1C_SOURCES),holders=s?.spirits?.some(g=>Object.values(G1C_SOURCES).includes(g.sourceId));
 if(x===undefined)return !holders&&!Object.values(G1C_SOURCES).some(id=>s?.systems?.sealed?.includes(id)||Object.hasOwn(s?.systems?.aids||{},id)||Object.hasOwn(s?.knowledge||{},id)||Object.hasOwn(s?.outcomes||{},id)||s?.scene===id);
 try{
  if(!g1cAllowed(s,c)||x.testOnly!==true||x.format!==1||x.seal!==seal(x)||x.ownerId!==c.ownerId||!integer(x.sequence)||!number(x.load)||!Array.isArray(x.events)||x.events.length!==x.sequence||x.events.length>4000||!distinct(x.completed)||x.completed.some(v=>typeof v!=='string'))return false;
  if(!distinct(c.ownership)||c.ownership.some(k=>!keys.includes(k))||!Array.isArray(c.targets)||!distinct(c.targets.map(t=>t.id))||!number(c.playerHeightCm,260)||!number(c.playerRuleWeight,10))return false;
  for(const t of c.targets)if(!t.id?.startsWith('source:')&&!t.id?.startsWith('test:')||!['enemy','ally'].includes(t.faction)||!['safe','exposed'].includes(t.region)||typeof t.body!=='boolean'||typeof t.spirit!=='boolean'||!number(t.heightCm,260)||!number(t.ruleWeight,10)||!number(t.domainWeight,10))return false;
  if(s.combat&&c.targets.filter(t=>t.id===s.combat.sourceId).length>1)return false;
  let lastTick=0;
  const legalTypes=['paid','researched','manifested','ceased','burned','burn-resisted','domain-contest','interfered','interference-resisted','tallest-verified','pressure-contest','action-suppressed','lost-control','backlash','host-burden'];
  for(const [i,e] of x.events.entries()){
   if(e.seq!==i+1||!integer(e.tick,s.tick)||e.tick<lastTick||!keys.includes(e.kind)||!legalTypes.includes(e.type)||!e.data||typeof e.data!=='object')return false;
   lastTick=e.tick;
   if(e.type==='paid'&&!same(e.data.cost,G1C_COSTS[e.data.verb]))return false;
  }
  let load=0;
  const requirements={fire:[['burned','burn-resisted'],['domain-contest']],wind:[['interfered','interference-resisted'],['domain-contest']],press:[['tallest-verified'],['action-suppressed']]};
  for(const k of keys){
   const v=x[k],g=own(s,k),records=x.events.filter(e=>e.kind===k);
   if(v.actorId!==(c.ownership.includes(k)?'player-'+G1C_SOURCES[k]:null)||v.actorId&&!g||!integer(v.stage,2)||!number(v.load)||!same(v.evidence,records)||!['CLOSED','CONTROLLED','UNCONTROLLED'].includes(v.state))return false;
   const paid=records.filter(e=>e.type==='paid'),spent=paid.reduce((a,e)=>a+e.data.cost[2],0);if(spent!==v.load)return false;load+=spent;
   const learned=records.filter(e=>e.type==='researched');if(learned.length!==v.stage||learned.some((e,i)=>e.data.stage!==i+1))return false;
   for(const e of learned){const observed=records.filter(r=>r.seq<e.seq).map(r=>r.type),needed=requirements[k][e.data.stage-1];if(e.data.stage===1?!needed.some(t=>observed.includes(t)):!needed.every(t=>observed.includes(t)))return false;}
   if(v.state==='CLOSED'&&(v.battleId!==null||v.region!==null||v.targetId!==null))return false;
   if(v.state==='CONTROLLED'&&(!v.actorId||typeof v.battleId!=='string'||!['safe','exposed'].includes(v.region)||k==='press'&&!v.targetId))return false;
  }
  if(load!==x.load)return false;
  return true;
 }catch{return false;}
}
