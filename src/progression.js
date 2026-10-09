import { events } from './content.js';
import { fateResult } from './rules.js';
export function newSystems(){return {death:'alive',sealed:[],aids:{},items:{barrier:2},combinations:[],second:null,decisions:{},research:[]};}
export function attachSystems(s){return s.systems?s:{...s,systems:newSystems(),combat:null};}
export function makeSpirit(id){const e=events[id];return {id:'player-'+id,sourceId:id,ruleId:'rule-'+id,instanceType:'player',rank:e.grade==='S潜力'?'S':e.grade,name:e.spirit,burden:e.load,revivalProgress:e.initialRevival,naturalRevivalRate:e.naturalRevivalRate,usageRevivalRate:e.usageRevivalRate,activityLevel:'正常',suppressionReceived:0,suppressionRemaining:0,development:0,stability:'稳定',...(id==='eye'?{awakeningProgress:1}:{})};}
// Traits/medium relationships, independent from rarity/grade. Legacy compatibility fraction maps to -100..100.
const pairs={
 'door|echo':[.65,.3,.3,0,0], 'door|eye':[.6,.3,.3,0,0], 'door|shadow':[.6,.3,.3,0,0],
 'echo|watch':[.6,.3,.3,0,0], 'shadow|watch':[.65,.3,.3,0,0],
 'echo|shadow':[.85,.4,.35,0,0], 'blood|shadow':[.8,.35,.45,0,0],
 'echo|headless':[.75,.4,.45,0,0], 'headless|shadow':[.65,.7,.12,0,0],
 'blood|echo':[.6,.6,.1,0,1], 'blood|headless':[.2,.1,.15,2,2]
};
export function relationship(a,b){const sorted=[a.sourceId,b.sourceId].sort(),p=pairs[sorted.join('|')]||[.35,.1,.1,1,1];const direct=a.sourceId===sorted[0];
 return {spiritA:a.id,spiritB:b.id,compatibility:p[0],suppressionAtoB:p[direct?1:2],suppressionBtoA:p[direct?2:1],conflictAtoB:p[direct?3:4],conflictBtoA:p[direct?4:3],burdenSynergy:0,specialInteraction:null,bias:0};}
export function canSecond(s){return !!s.journey?.chapters.club.completed&&s.spirits.length===1;}
export function systemsAvailable(s){
 const x=s.systems||newSystems(); if(x.death==='committed')return [];
 if(x.death==='pending')return [...(x.items.barrier>0?['reaction:item']:[]),...Object.keys(x.aids).filter(id=>x.aids[id].remaining>0).map(id=>'reaction:aid:'+id), 'death:commit'];
 if(s.crisis)return ['suppress',...s.spirits.map(g=>'abandon:'+g.id)];
 const out=[];const attempt=x.second;
 if(attempt?.stage==='restricted'&&s.scene===attempt.sourceId)out.push('second:match:mutual','second:match:partition',...(x.items.barrier>0?['second:match:medium']:[]),'second:exit');
 if(attempt?.stage==='matched'&&s.scene===attempt.sourceId)out.push(...(attempt.plan!=='medium'||x.items.barrier>0?['second:implant','second:combine']:[]),'second:exit');
 if(attempt?.stage==='unstable'&&s.scene==='hub')out.push(...(s.energy>0&&s.life>=40?['second:stabilize']:[]),...(s.bags>0?['second:remove']:[]));
 if(s.scene==='hub'&&!s.combat&&!s.journey?.active&&attempt?.stage!=='unstable'){
  out.push(...x.sealed.filter(id=>id!=='door'||s.doorCase?.sealed&&s.doorCase?.driven).map(id=>'release:'+id));
  if(s.relations.length&&x.items.barrier>0)out.push('balance:medium');
  if(s.energy>0)out.push(...s.spirits.filter(g=>!x.research.includes(g.id)&&s.knowledge[g.sourceId]?.hypotheses.true==='confirmed').map(g=>'study:'+g.id));
 }
 return out;
}
export function combineAllowed(s,id){return canSecond(s)&&s.spirits[0].sourceId!==id;}
export function applySystems(s,action){
 const x=s.systems;let used=null;
 if(action.startsWith('study:')){const g=s.spirits.find(g=>g.id===action.slice(6));s.energy--;g.development=Math.min(100,g.development+5);x.research.push(g.id);s.journal.push('复核'+g.name+'已有调查记录，开发度＋5；同一实例档案不可重复刷成长。');return used;}
 if(action==='death:commit'){x.death='committed';s.combat=null;s.journal.push('死亡已提交。该角色不能普通休整或重启复活；存档与历史保留，可导出副本。');return used;}
 if(action==='reaction:item'||action.startsWith('reaction:aid:')){if(action==='reaction:item')x.items.barrier--;else{x.aids[action.slice(13)].remaining--;x.aids[action.slice(13)].used++;}x.death='alive';s.life=1;s.combat=null;s.scene='hub';s.ward=0;s.journal.push('致死反应拦截成功，紧急撤离；消耗、伤势、复苏与证据保留。');return used;}
 if(action.startsWith('release:')){const id=action.slice(8);x.sealed=x.sealed.filter(v=>v!==id);s.scene=id;s.phase='限制';if(canSecond(s))x.second={sourceId:id,stage:'restricted',plan:null,mode:null,result:null};s.journal.push('从安全屋取回已封存实例；此前隔离袋不返还。');return used;}
 if(action.startsWith('abandon:')){const id=action.slice(8),g=s.spirits.find(g=>g.id===id);s.outcomes[g.sourceId]='紧急封存';if(!x.sealed.includes(g.sourceId))x.sealed.push(g.sourceId);s.spirits=s.spirits.filter(g=>g.id!==id);s.relations=s.relations.filter(r=>r.spiritA!==id&&r.spiritB!==id);x.combinations=x.combinations.filter(c=>!c.ids.includes(id));x.second=null;s.combat=null;s.ward=0;s.scene='hub';s.journal.push('舍弃并封存'+g.name+'，其余实例复苏不回退。');return used;}
 if(action==='balance:medium'){x.items.barrier--;for(const r of s.relations)r.bias=0;s.journal.push('消耗隔离符膜，修正平衡偏移。累计复苏没有下降。');return used;}
 if(action==='second:exit'){x.second=null;s.scene='hub';s.journal.push('取消第二鬼方案，限制记录保留。');return used;}
 if(action.startsWith('second:match:')){x.second.plan=action.slice(13);x.second.stage='matched';s.journal.push('匹配方案：'+({mutual:'相互压制',partition:'宿主分区',medium:'外部媒介'}[x.second.plan])+'。评级不能证明相容。');return used;}
 if(action==='second:implant'||action==='second:combine'){
  const a=s.spirits[0],id=x.second.sourceId,b=makeSpirit(id),r=relationship(a,b),plan=x.second.plan;
  const node='second:'+id+':'+plan;const context={first:a.sourceId,second:id,plan,life:s.life,capacity:s.hostCapacity,firstRevival:a.revivalProgress,development:a.development};
  const f=fateResult(s.seed,node,context);const cacheKey=node+':'+f.signature;
  let result=x.decisions[cacheKey]?.result;
  if(!result){result=s.life<40||a.burden+b.burden>s.hostCapacity*1.25?'blocked':a.revivalProgress>=95?'dual':r.compatibility<.4?(f.roll<50?'blocked':'takeover'):Math.min(r.suppressionAtoB,r.suppressionBtoA)<.2?'dominated':'success';x.decisions[cacheKey]={...f,node,result};}
  x.second.mode=action==='second:combine'?'combine':'capture';x.second.result=result;
  if(result==='blocked'){x.second.stage='restricted';x.second.plan=null;s.journal.push('植入被拒：身体/承载或规则嵌套不满足，未获得第二鬼，也没有退还已用隔离袋。');return used;}
  if(plan==='medium'){x.items.barrier--;r.suppressionAtoB=Math.max(.35,r.suppressionAtoB);r.suppressionBtoA=Math.max(.35,r.suppressionBtoA);}
  if(plan==='partition'){r.conflictAtoB=Math.max(0,r.conflictAtoB-1);r.conflictBtoA=Math.max(0,r.conflictBtoA-1);}
  if(result==='dominated'){if(r.suppressionAtoB>=r.suppressionBtoA)r.suppressionBtoA=.05;else r.suppressionAtoB=.05;}
  if(result==='takeover'){r.bias=-75;b.revivalProgress=80;a.stability='不稳定';}
  if(result==='dual'){a.revivalProgress=100;b.revivalProgress=100;r.suppressionAtoB=0;r.suppressionBtoA=0;r.bias=0;}
  s.spirits.push(b);s.relations.push(r);b.stability='不稳定';x.second.stage='unstable';
  s.outcomes[id]=x.second.mode==='combine'?'已结合':'已驾驭';
  if(x.second.mode==='combine')x.combinations.push({ids:[a.id,b.id],name:'嵌套媒介',disabledId:b.id});
  s.scene='hub';s.phase='处理';s.journal.push('第二鬼已植入，进入失衡期（'+({success:'可建立平衡',dominated:'单向压制 / 伪平衡',takeover:'反客为主',dual:'双鬼复苏'}[result])+'）。原有复苏不降低。');return used;
 }
 if(action==='second:stabilize'){s.energy--;x.second.stage='balanced';for(const g of s.spirits)g.stability='稳定';s.journal.push('完成植入观察。实际平衡仍按有向压制、冲突和偏移判定，伪平衡不会被包装成成功。');return used;}
 if(action==='second:remove'){const g=s.spirits.at(-1);s.bags--;x.sealed.push(g.sourceId);s.outcomes[g.sourceId]='已封存';s.spirits.pop();s.relations=[];x.combinations=[];x.second=null;s.journal.push('放弃第二鬼并消耗隔离袋封存；第一鬼累计复苏保留。');}
 return used;
}
export function validSystems(s){
 const x=s.systems;if(x===undefined)return true;const unique=(a,allowed)=>Array.isArray(a)&&new Set(a).size===a.length&&a.every(id=>allowed.includes(id));
 if(!x||!['alive','pending','committed'].includes(x.death)||!unique(x.research,Object.keys(events).map(id=>'player-'+id))||!unique(x.sealed,Object.keys(events))||!x.aids||typeof x.aids!=='object'||Array.isArray(x.aids)||!x.items||!Number.isInteger(x.items.barrier)||x.items.barrier<0||x.items.barrier>2)return false;
 if(x.death==='alive'&&s.life===0||x.death!=='alive'&&s.life!==0)return false;
 if(Object.keys(x.aids).length>2)return false;
 for(const [id,a] of Object.entries(x.aids))if(!events[id]||!a||!Number.isInteger(a.remaining)||!Number.isInteger(a.used)||a.remaining<0||a.used<0||a.remaining+a.used!==2)return false;
 if(!Array.isArray(x.combinations)||x.combinations.length>1||x.combinations.some(c=>!c||c.name!=='嵌套媒介'||!unique(c.ids,s.spirits.map(g=>g.id))||c.ids.length!==2||!c.ids.includes(c.disabledId)))return false;
 for(const id of x.sealed)if(s.spirits.some(g=>g.sourceId===id))return false;
 const a=x.second;if(a!==null&&(!a||!events[a.sourceId]||!['candidate','restricted','matched','unstable','balanced'].includes(a.stage)||![null,'mutual','partition','medium'].includes(a.plan)||![null,'capture','combine'].includes(a.mode)||![null,'success','blocked','dominated','takeover','dual'].includes(a.result)))return false;
 if(a&&['unstable','balanced'].includes(a.stage)&&!s.spirits.some(g=>g.sourceId===a.sourceId)||a?.stage==='matched'&&a.plan===null)return false;
 if(!x.decisions||typeof x.decisions!=='object'||Array.isArray(x.decisions)||Object.keys(x.decisions).length>100)return false;
 for(const [key,d] of Object.entries(x.decisions)){if(!d||!d.context||typeof d.node!=='string'||!['success','blocked','dominated','takeover','dual'].includes(d.result))return false;const f=fateResult(s.seed,d.node,d.context);if(d.roll!==f.roll||d.signature!==f.signature||key!==d.node+':'+d.signature)return false;}
 return true;
}
