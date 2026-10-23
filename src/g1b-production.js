// G1-B production rules. No acquisition, story grants or simulated combat resolver.
// The only current holders are quarantined, explicitly typed integration fixtures.
import {activeIds,v1Ward} from './v1.js';
import {growthFor,revivalCrisisFor,settleSpirits} from './spirits.js';
import {ruleBlocked} from './evolution-model.js';
import {ruleContest} from './rules.js';

export const G1B_SOURCES=Object.freeze({tablet:'tablet',caller:'caller',smoke:'smoke'});
export const G1B_COSTS=Object.freeze({inspect:[1,2,1],shift:[1,5,3],return:[1,3,2],call:[1,4,2],release:[1,3,2],gather:[1,2,1],expand:[1,4,2]});
const contexts=new WeakMap();
const own=(s,k)=>s.spirits.find(g=>g.id===s.g1b?.[k]?.actorId&&g.sourceId===G1B_SOURCES[k]);
const has=(v,type)=>v.evidence.some(e=>e.type===type);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// Corruption detection, not an anti-cheat signature: local users can edit saves.
function seal(x){let h=2166136261;const {seal:ignored,...body}=x;for(const ch of JSON.stringify(body))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h.toString(16);}
const sealState=s=>{s.g1b.seal=seal(s.g1b);};
export const g1bAllowed=(s,c)=>!s.g1b||s.g1b.testOnly===true&&c?.g1bIntegration==='G1B-PRODUCTION'&&c.ownerId===s.settlement?.ownerId&&s.g1b.ownerId===c.ownerId;
export function newG1B(s,c){
 const record=k=>({actorId:s.spirits.find(g=>g.sourceId===k)?.id||null,stage:0,load:0,evidence:[]});
 const x={format:1,testOnly:true,ownerId:c.ownerId,load:0,sequence:0,events:[],completed:[],
  tablet:{...record('tablet'),location:'body',bodyId:c.tablet?.bodyId||null,occupant:'player',session:0},
  caller:{...record('caller'),pending:null,calls:[],lastCall:null},
  smoke:{...record('smoke'),state:'CLOSED',regions:[],battleId:null,exposures:[]},
  world:{battleId:null,enemyStep:0,knownIdentities:[],actors:[]}};
 x.seal=seal(x);return x;
}
const battle=s=>s.combat?.g1bBattleId||null;
export function prepareG1B(s,c){
 if(!s.g1b||!g1bAllowed(s,c))return;contexts.set(s,c);
 if(s.combat&&!s.combat.g1bBattleId)s.combat.g1bBattleId=`${s.settlement.ownerId}:g1b:${s.settlement.nextEncounter}:${s.tick}`;
 const w=s.g1b.world;
 if(s.combat&&w.battleId!==battle(s)){
  w.battleId=battle(s);w.enemyStep=0;w.knownIdentities=[];w.actors=structuredClone(c.participants||[]);
 }
 sealState(s);
}
function fact(s,k,type,data={}){
 const x=s.g1b,e={seq:++x.sequence,tick:s.tick,battleId:battle(s),kind:k,type,data:structuredClone(data)};
 x.events.push(e);if(k in G1B_SOURCES)x[k].evidence.push(structuredClone(e));return e;
}
function enabled(s,k){const g=own(s,k);return !!g&&activeIds(s).includes(g.id)&&!revivalCrisisFor(s,g)&&!ruleBlocked(s,g.id)&&!s.systems.combinations.some(v=>v.disabledId===g.id);}
const region=s=>s.combat?.position||null;
const alive=s=>s.systems.death==='alive'&&s.life>0;
const source=(s,c)=>c?.tablet?.sourceId==='test:tablet:006'&&c.tablet.exists===true&&c.tablet.ownerId===s.settlement.ownerId&&c.tablet.bodyId===s.g1b.tablet.bodyId&&!s.evolution.host.shellDestroyed&&s.evolution.host.integrity>0&&s.evolution.host.continuity!=='失去自我';
const returnPath=(s,c)=>source(s,c)&&c.tablet.returnQualification==='TEST_ONLY_RETURN_CONTEST'&&c.tablet.returnReachable===true&&Number.isFinite(c.tablet.returnWeight)&&c.tablet.returnWeight>=0&&Number.isFinite(c.tablet.opposition)&&c.tablet.opposition>=0;
export function g1bWeight(s,k){const g=own(s,k);return g?Math.min(10,v1Ward(s,g,s.combat?.eventId||'blood')+(k==='smoke'&&s.v1.build==='domain'?1:0)):0;}
function affordable(s,k,verb){if(!enabled(s,k)||s.energy<G1B_COSTS[verb][0])return false;const p=structuredClone(s);p.g1b.load+=G1B_COSTS[verb][2];const g=own(p,k);return g.revivalProgress+growthFor(p,g,true,0,G1B_COSTS[verb][1])<100;}
function safeFirstTrial(s,c){
 if(s.energy<2||!returnPath(s,c)||Math.min(g1bWeight(s,'tablet'),c.tablet.returnWeight)<=c.tablet.opposition)return false;
 const p=structuredClone(s),id=own(p,'tablet')?.id;if(!id)return false;
 for(const verb of ['shift','return']){p.g1b.load+=G1B_COSTS[verb][2];settleSpirits(p,id,null,{[id]:G1B_COSTS[verb][1]},true,g1bMaintenance(p));if(p.crisis)return false;}
 return true;
}
function graph(c){return c?.regions?.length===2&&same([...c.regions].sort(),['exposed','safe'])&&c.links?.some(p=>same([...p].sort(),['exposed','safe']));}
const adjacent=(c,a,b)=>graph(c)&&c.links.some(p=>p.includes(a)&&p.includes(b)&&a!==b);
const participants=(s,c)=>s.combat&&s.g1b.world.battleId===battle(s)?s.g1b.world.actors:c.participants||[];
function callable(s,c,t){const w=s.g1b.world,p=region(s);return t&&t.faction==='enemy'&&t.identity!==null&&w.knownIdentities.some(v=>v.id===t.id&&v.identity===t.identity)&&t.hearing===true&&['turn','hold','resist'].includes(t.behavior)&&t.facing==='away-from-player'&&t.region==='exposed'&&p==='safe'&&adjacent(c,p,t.region);}
export function g1bFilter(s,legal){
 if(!s.g1b)return legal;const ids=Object.keys(G1B_SOURCES).map(k=>s.g1b[k].actorId).filter(Boolean);
 let out=legal.filter(a=>!ids.some(id=>['combat:ability:','practice:','study:'].some(p=>a===p+id))&&!(ids.includes(s.spirits[0]?.id)&&['ability','practice'].includes(a))&&a!=='combat:combo');
 if(s.combat&&s.g1b.world.actors.length)out=out.filter(a=>!['combat:restrict','v1:seal:cast'].includes(a)&&!a.startsWith('combat:aid:')&&!a.startsWith('g1ap:'));
 if(s.g1b.tablet.location==='tablet')out=out.filter(a=>['combat:observe','suppress','death:commit'].includes(a)||a.startsWith('reaction:')||a.startsWith('abandon:')&&a!=='abandon:'+s.g1b.tablet.actorId);
 return out;
}
export function g1bAvailable(s,c){
 if(!s.g1b||!g1bAllowed(s,c)||!validG1B(s,c)||!alive(s))return [];
 const x=s.g1b,out=[],t=x.tablet,b=!!s.combat&&!s.combat.eyeV6?.pending;
 // Return is a consciousness operation; suppression/crisis never gives free bodily actions.
 if(t.location==='tablet'){
  if(returnPath(s,c)&&affordable(s,'tablet','return'))out.push('g1bp:tablet:return');
  return out;
 }
 if(s.crisis||s.combat?.eyeV6?.pending)return out;
 if(b){
  if(source(s,c)&&affordable(s,'tablet','inspect'))out.push('g1bp:tablet:inspect');
  // L0 observation opens the first safe trial. L1 is evidence of completing it.
  if(source(s,c)&&safeFirstTrial(s,c)&&has(t,'observed-occupancy')&&affordable(s,'tablet','shift'))out.push('g1bp:tablet:shift');
  for(const actor of participants(s,c))if(callable(s,c,actor)&&!x.caller.pending&&affordable(s,'caller','call')){
   const last=x.caller.calls.filter(v=>v.battleId===battle(s)&&v.targetId===actor.id).at(-1);
   if(!last||x.caller.stage>=2&&x.caller.lastCall?.targetId===actor.id)out.push('g1bp:caller:call:'+actor.id);
  }
  if(graph(c)&&x.smoke.state==='CLOSED'&&affordable(s,'smoke','release'))out.push('g1bp:smoke:release');
  if(x.smoke.state==='CONTROLLED'&&x.smoke.battleId===battle(s)){
   if(affordable(s,'smoke','gather'))out.push('g1bp:smoke:gather');
   if(x.smoke.stage>=2&&x.smoke.regions.length===1&&affordable(s,'smoke','expand'))for(const r of c.regions)if(adjacent(c,x.smoke.regions[0],r))out.push('g1bp:smoke:expand:'+r);
  }
 }
 if(!s.combat&&s.scene==='hub'){
  const requirements={tablet:[['observed-occupancy','shifted','returned'],['body-hit','mind-hit','early-return']],caller:[['turned','resisted'],['continuous-call','risk-changed']],smoke:[['entered','stayed','left'],['domain-contest','boundary-observed']]};
  for(const k of Object.keys(G1B_SOURCES)){
   const v=x[k];if(!enabled(s,k)||v.stage>=2)continue;
   const req=requirements[k][v.stage];const ok=k==='caller'&&v.stage===0?req.some(a=>has(v,a)):req.every(a=>has(v,a));
   if(ok)out.push(`g1bp:${k}:research:${v.stage+1}`);
  }
 }
 return out;
}
function pay(s,k,verb){const v=s.g1b[k],cost=G1B_COSTS[verb];s.energy-=cost[0];v.load+=cost[2];s.g1b.load+=cost[2];fact(s,k,'paid',{verb,cost});return {used:v.actorId,usage:cost[1]};}
export function applyG1B(s,a,c){
 const [,k,verb,...tail]=a.split(':'),v=s.g1b[k],id=tail.join(':');
 if(verb==='research'){v.stage++;fact(s,k,'researched',{stage:v.stage});s.journal.push(g1bLabel(a)+'：仅核实真实行动证据，高阶拼图继续锁定。');return {used:null,usage:0};}
 const cost=pay(s,k,verb);
 if(k==='tablet'){
  if(verb==='inspect')fact(s,k,'observed-occupancy',{sourceId:c.tablet.sourceId,bodyId:v.bodyId,occupant:v.occupant});
  if(verb==='shift'){
   const result=ruleContest(g1bWeight(s,k),c.tablet.opposition);
   if(result==='blocked'){v.location='tablet';v.occupant='tablet-consciousness';v.session++;fact(s,k,'shifted',{session:v.session,bodyId:v.bodyId,enemyStep:s.g1b.world.enemyStep});}
   else fact(s,k,'shift-resisted',{result});
  }
  if(verb==='return'){
   const result=ruleContest(Math.min(g1bWeight(s,k),c.tablet.returnWeight),c.tablet.opposition);
   if(result==='blocked'){
    const session=v.session,shift=v.evidence.find(e=>e.type==='shifted'&&e.data.session===session),early=shift?.data.enemyStep===s.g1b.world.enemyStep&&c.participants.some(a=>a.attackTarget==='body'&&a.damage>0);
    v.location='body';v.occupant='player';fact(s,k,'returned',{session,bodyId:v.bodyId});if(early)fact(s,k,'early-return',{session});
   }else fact(s,k,'return-resisted',{session:v.session,result});
  }
 }
 if(k==='caller'){
  const target=participants(s,c).find(v=>v.id===id);v.pending={targetId:id,identity:target.identity,region:target.region,battleId:battle(s),tick:s.tick};
  const call={targetId:id,battleId:battle(s),tick:s.tick,R:own(s,k).revivalProgress};
  if(v.lastCall&&v.lastCall.battleId===battle(s)&&v.lastCall.tick===s.tick-1)fact(s,k,'continuous-call',{previous:v.lastCall.tick,targetId:id});
  v.calls.push(call);v.lastCall=call;fact(s,k,'called',{targetId:id,identity:target.identity,from:region(s)});
 }
 if(k==='smoke'){
  if(verb==='release'){v.state='CONTROLLED';v.regions=[region(s)];v.battleId=battle(s);fact(s,k,'released',{regions:v.regions});}
  if(verb==='gather'){fact(s,k,'gathered',{regions:v.regions});v.state='CLOSED';v.regions=[];v.battleId=null;}
  if(verb==='expand'){v.regions.push(id);fact(s,k,'expanded',{regions:v.regions});}
 }
 s.journal.push(g1bLabel(a)+'：已付调用代价，合法抵抗不退款。');return cost;
}
// Called by the real initiative resolver, only for explicitly typed test participants.
export function g1bEnemy(s,r,log,intent=null){
 const c=contexts.get(s),x=s.g1b;if(!x||!g1bAllowed(s,c)||!c.participants?.length||x.world.battleId!==battle(s))return false;
 if(intent?.cancelled)return true;
 x.world.enemyStep++;const pending=x.caller.pending;
 for(const actor of x.world.actors.filter(v=>v.faction==='enemy')){
  if(pending?.targetId===actor.id){
   const eligible=pending.battleId===battle(s)&&pending.identity===actor.identity&&callable(s,c,actor);
   if(eligible){
    fact(s,'caller','heard',{targetId:actor.id,identity:actor.identity});
    if(actor.behavior==='turn'){
     actor.facing='toward-player';fact(s,'caller','turned',{targetId:actor.id});const result=ruleContest(g1bWeight(s,'caller'),actor.ruleWeight);
     if(result==='blocked'){actor.ruleStrikes++;fact(s,'caller','struck',{targetId:actor.id,result});}else fact(s,'caller','resisted',{targetId:actor.id,result});
    }else fact(s,'caller',actor.behavior==='resist'?'resisted':'not-turned',{targetId:actor.id,result:'no-rule-strike'});
   }else fact(s,'caller','opportunity-lost',{targetId:actor.id});
   x.caller.pending=null;
  }
  // A typed participant may actually turn away/move; smoke never creates turning.
  if(actor.resetFacing)actor.facing='away-from-player';
  if(actor.route?.length){actor.region=actor.route[(x.world.enemyStep-1)%actor.route.length];fact(s,'world','moved',{actorId:actor.id,region:actor.region});}
  if(s.combat.position==='exposed'||x.tablet.location==='tablet'){
   const target=actor.attackTarget;
   if(target==='tablet-mind'&&x.tablet.location!=='tablet')continue;
   if(target==='body-mind'&&x.tablet.location==='tablet'){fact(s,'tablet','mind-missed-body',{session:x.tablet.session});continue;}
   const outcome=ruleContest(s.combat.wardMedium==='all'?s.combat.wardWeight:0,actor.ruleWeight);
   const damage=outcome==='blocked'?0:outcome==='partial'?Math.ceil(actor.damage/2):actor.damage;
   s.life=Math.max(0,s.life-damage);s.combat.wardWeight=0;s.combat.wardMedium=null;
   if(x.tablet.location==='tablet')fact(s,'tablet',target==='body'?'body-hit':'mind-hit',{session:x.tablet.session,target,damage,bodyId:x.tablet.bodyId});
   log('对抗',`隔离类型参与者 ${actor.id} → ${target}，实际损伤${damage}；意识与身体分别判定。`);
   if(s.life===0)s.systems.death='pending';
  }
 }
 return true;
}
export function observeG1B(s,a,c){
 if(a!=='combat:observe'||!s.g1b||!g1bAllowed(s,c))return;
 if(s.g1b.tablet.location==='tablet')return;
 for(const actor of participants(s,c))if(actor.disclosed&&actor.identity!==null&&!s.g1b.world.knownIdentities.some(v=>v.id===actor.id)){
  s.g1b.world.knownIdentities.push({id:actor.id,identity:actor.identity});fact(s,'caller','identity-disclosed',{targetId:actor.id,identity:actor.identity});
 }
 if(s.g1b.smoke.state==='CONTROLLED')fact(s,'smoke','boundary-observed',{regions:s.g1b.smoke.regions});
}
export function g1bMaintenance(s){return s.g1b?.smoke.state==='CONTROLLED'&&own(s,'smoke')?{[own(s,'smoke').id]:1}:{};}
export function advanceG1B(before,s,a,c){
 const x=s.g1b;if(!x||!g1bAllowed(s,c))return;contexts.set(s,c);
 if(c?.requestId)x.completed.push(c.requestId);
 if(s.tick===before.tick){sealState(s);return;}
 if(x.caller.pending&&(!s.combat||x.caller.pending.battleId!==battle(s))){fact(s,'caller','opportunity-lost',{targetId:x.caller.pending.targetId});x.caller.pending=null;}
 const cr=x.caller,g=own(s,'caller'),old=own(before,'caller');
 if(g&&old&&g.revivalProgress>old.revivalProgress&&cr.calls.some(v=>v.tick===s.tick||v.tick===s.tick-1))fact(s,'caller','risk-changed',{before:old.revivalProgress,after:g.revivalProgress});
 const v=x.smoke;
 if(v.state==='CONTROLLED'){
  if(!own(s,'smoke')||revivalCrisisFor(s,own(s,'smoke'))||ruleBlocked(s,v.actorId)){v.state='UNCONTROLLED';fact(s,'smoke','lost-control',{regions:v.regions});}
  else if(!s.combat||v.battleId!==battle(s)){v.state='UNCONTROLLED';fact(s,'smoke','left-maintained-area',{regions:v.regions});}
  else for(const actor of [{id:'player-body',region:region(s),body:true,bodyResistance:c.playerBodyResistance??0,domainWeight:0,faction:'player'},...x.world.actors]){
   const previous=v.exposures.filter(e=>e.actorId===actor.id&&e.battleId===battle(s)).at(-1),inside=v.regions.includes(actor.region);
   if(!inside){if(previous?.inside){fact(s,'smoke','left',{actorId:actor.id,region:actor.region});v.exposures.push({actorId:actor.id,battleId:battle(s),tick:s.tick,inside:false,damage:0});}continue;}
   const type=previous?.inside?'stayed':'entered';fact(s,'smoke',type,{actorId:actor.id,region:actor.region});
   if(!actor.body){fact(s,'smoke','no-body-medium',{actorId:actor.id});continue;}
   const domain=ruleContest(g1bWeight(s,'smoke'),actor.domainWeight);if(actor.domainWeight>0)fact(s,'smoke','domain-contest',{actorId:actor.id,attack:g1bWeight(s,'smoke'),defense:actor.domainWeight,result:domain});
   const result=ruleContest(domain==='failed'?0:g1bWeight(s,'smoke'),actor.bodyResistance),damage=domain==='failed'||result==='failed'?0:domain==='partial'||result==='partial'?3:6;
   v.exposures.push({actorId:actor.id,battleId:battle(s),tick:s.tick,inside:true,damage});
   if(actor.id==='player-body'){s.life=Math.max(0,s.life-damage);if(s.life===0)s.systems.death='pending';}else actor.bodyDamage+=damage;
   fact(s,'smoke','eroded',{actorId:actor.id,faction:actor.faction,damage,result});
  }
 }
 if(x.tablet.location==='tablet'&&!own(s,'tablet'))throw Error('cannot silently erase detached consciousness');
 sealState(s);
}
export function g1bRisk(s){if(!s.g1b)return '';const x=s.g1b,g=own(s,'caller');return [x.testOnly?'隔离测试持有：非普通获取。':'',x.tablet.location==='tablet'?'意识在灵位；原身体由灵位意识占据，身体仍会受袭。':'',g?(g.revivalProgress<40?'声音尚远':g.revivalProgress<80?'逐渐接近':'就在身后'):'',x.smoke.state==='UNCONTROLLED'?'鬼烟已失控：遗留后果待处置。':x.smoke.state==='CONTROLLED'?'鬼烟持续侵蚀范围内合法身体，友方不豁免。':''].filter(Boolean).join(' ');}
export function g1bLabel(a){const [,k,v,n]=a.split(':');return v==='research'?`${{tablet:'灵位',caller:'呼名',smoke:'鬼烟'}[k]}实证研究 ${n}`:({inspect:'察看灵位',shift:'意识转位',return:'归位',call:'呼名',release:'放烟',gather:'收拢',expand:'扩张'}[v]||'专属行动');}
export function g1bCost(a){const cost=G1B_COSTS[a.split(':')[2]];return cost?`能量${cost[0]}；本鬼基础复苏+${cost[1]}pp，持久负荷+${cost[2]}。Build、方向压制及自然复苏照常结算；合法失败付费。鬼烟维持每有效行动额外本鬼+1pp。`:'依据本鬼真实证据研究；推进一次行动，持续风险照常结算。';}

export function validG1B(s,c){
 const x=s?.g1b,ids=Object.values(G1B_SOURCES),holders=Array.isArray(s?.spirits)&&s.spirits.some(g=>ids.includes(g?.sourceId));
 if(x===undefined)return !holders&&!ids.some(id=>s?.systems?.sealed?.includes?.(id)||Object.hasOwn(s?.systems?.aids||{},id)||Object.hasOwn(s?.knowledge||{},id)||Object.hasOwn(s?.outcomes||{},id)||s?.scene===id);
 try{
  const n=(v,max=1e9)=>Number.isFinite(v)&&v>=0&&v<=max,integer=(v,max=1e9)=>Number.isInteger(v)&&n(v,max),unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
  if(x.seal!==seal(x)||Object.keys(x).sort().join()!==['format','testOnly','ownerId','load','sequence','events','completed','tablet','caller','smoke','world','seal'].sort().join())return false;
  if(!g1bAllowed(s,c)||x.format!==1||!integer(x.sequence)||!n(x.load)||!unique(x.completed)||x.completed.some(v=>typeof v!=='string')||!Array.isArray(x.events)||x.events.length!==x.sequence||x.events.length>4000)return false;
  if(!c.ownership||!graph(c)||!Array.isArray(c.participants))return false;
  if(!unique(c.ownership)||c.ownership.some(k=>!(k in G1B_SOURCES))||!unique(c.participants.map(a=>a.id)))return false;
  for(const a of c.participants)if(!a.id?.startsWith('test:')||!['enemy','ally'].includes(a.faction)||!(a.identity===null||typeof a.identity==='string'&&a.identity.length>0&&a.identity.length<=100)||typeof a.disclosed!=='boolean'||typeof a.hearing!=='boolean'||typeof a.body!=='boolean'||!['turn','hold','resist',null].includes(a.behavior)||!['away-from-player','toward-player'].includes(a.facing)||!['safe','exposed'].includes(a.region)||!n(a.bodyResistance,100)||!n(a.domainWeight,10)||!n(a.ruleWeight,10)||!n(a.damage,100)||!['body','body-mind','tablet-mind'].includes(a.attackTarget)||typeof a.resetFacing!=='boolean'||!Array.isArray(a.route)||a.route.some(r=>!c.regions.includes(r)))return false;
  const types={tablet:['paid','observed-occupancy','shifted','shift-resisted','returned','early-return','return-resisted','body-hit','mind-hit','mind-missed-body'],caller:['paid','called','continuous-call','identity-disclosed','heard','turned','struck','resisted','not-turned','opportunity-lost','risk-changed'],smoke:['paid','released','gathered','expanded','boundary-observed','entered','stayed','left','domain-contest','no-body-medium','eroded','lost-control','left-maintained-area'],world:['moved']};
  let lastTick=0;
  for(const [i,e] of x.events.entries()){
   if(e.seq!==i+1||!integer(e.tick,s.tick)||e.tick<lastTick||!types[e.kind]||!(e.type==='researched'&&e.kind!=='world'||types[e.kind].includes(e.type))||!e.data||!['string','object'].includes(typeof e.battleId))return false;
   lastTick=e.tick;
   if(e.type==='paid'&&!same(e.data.cost,G1B_COSTS[e.data.verb]))return false;
   if(e.type==='risk-changed'&&!(n(e.data.before,100)&&n(e.data.after,100)&&e.data.after>e.data.before))return false;
  }
  let total=0;
  for(const k of Object.keys(G1B_SOURCES)){
   const v=x[k],g=own(s,k),ledger=x.events.filter(e=>e.kind===k);
   if(![0,1,2].includes(v.stage)||!n(v.load)||!same(v.evidence,ledger)||v.actorId!== (c.ownership.includes(k)?'player-'+k:null)||v.actorId&&!g&&!s.systems.sealed.includes(k))return false;
   const paid=ledger.filter(e=>e.type==='paid');if(v.load!==paid.reduce((a,e)=>a+e.data.cost[2],0))return false;total+=v.load;
   const learned=ledger.filter(e=>e.type==='researched');if(learned.length!==v.stage||learned.some((e,i)=>e.data.stage!==i+1))return false;
   for(const e of learned){const earlier=ledger.filter(v=>v.seq<e.seq),hasEarly=t=>earlier.some(v=>v.type===t);
    const req={tablet:[['observed-occupancy','shifted','returned'],['body-hit','mind-hit','early-return']],caller:[['turned','resisted'],['continuous-call','risk-changed']],smoke:[['entered','stayed','left'],['domain-contest','boundary-observed']]}[k][e.data.stage-1];
    if(k==='caller'&&e.data.stage===1?!req.some(hasEarly):!req.every(hasEarly))return false;
   }
  }
  if(total!==x.load||!['body','tablet'].includes(x.tablet.location)||x.tablet.occupant!==(x.tablet.location==='body'?'player':'tablet-consciousness')||!integer(x.tablet.session)||x.tablet.bodyId!==(c.tablet?.bodyId||null))return false;
  const shifted=x.tablet.evidence.filter(e=>e.type==='shifted');if(shifted.length!==x.tablet.session||shifted.some((e,i)=>e.data.session!==i+1))return false;
  const lastOccupancy=x.tablet.evidence.filter(e=>['shifted','returned'].includes(e.type)).at(-1);if((lastOccupancy?.type==='shifted')!==(x.tablet.location==='tablet'))return false;
  if(!['CLOSED','CONTROLLED','UNCONTROLLED'].includes(x.smoke.state)||!unique(x.smoke.regions)||x.smoke.regions.some(r=>!c.regions.includes(r))||x.smoke.regions.length>(x.smoke.stage>=2?2:1)||x.smoke.state==='CLOSED'&&x.smoke.regions.length!==0||x.smoke.state!=='CLOSED'&&!x.smoke.regions.length||!Array.isArray(x.smoke.exposures))return false;
  if(!Array.isArray(x.caller.calls)||!same(x.caller.calls.at(-1)||null,x.caller.lastCall)||x.caller.calls.length!==x.caller.evidence.filter(e=>e.type==='called').length)return false;
  const w=x.world;
  if(!integer(w.enemyStep)||!Array.isArray(w.actors)||!unique(w.actors.map(a=>a.id))||!Array.isArray(w.knownIdentities)||!unique(w.knownIdentities.map(a=>a.id)))return false;
  if(w.actors.length&&w.actors.length!==c.participants.length)return false;
  for(const actor of w.actors){const original=c.participants.find(a=>a.id===actor.id);if(!original||!['safe','exposed'].includes(actor.region)||!['away-from-player','toward-player'].includes(actor.facing)||!n(actor.bodyDamage)||!integer(actor.ruleStrikes))return false;for(const key of ['identity','disclosed','hearing','behavior','body','bodyResistance','domainWeight','faction','ruleWeight','damage','attackTarget','resetFacing','route'])if(!same(actor[key],original[key]))return false;}
  if(w.knownIdentities.some(v=>!c.participants.some(a=>a.id===v.id&&a.disclosed&&a.identity===v.identity)||!has(x.caller,'identity-disclosed')))return false;
  if(x.caller.pending&&(!x.caller.calls.length||!w.actors.some(v=>v.id===x.caller.pending.targetId&&v.identity===x.caller.pending.identity)))return false;
  return true;
 }catch{return false;}
}
