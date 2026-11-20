// Optional format-2 extension. Never fabricates knowledge, sources or ownership.
import {newCombat} from './combat.js';
import {hostState} from './spirits.js';
export const raidNodes=['接近接线室','接线室对抗','物资岔路','背影对抗','撤收结算'];
export const raidLabels={'raid:start':'进入住宅区短挑战','raid:silent':'保持沉默，稳步进入','raid:rush':'抢运物资，承受暴露风险','raid:contain':'维持隔离并消耗容器封锁','raid:leave':'撤离，保留已取得成果','raid:salvage':'取走一份符膜，继续挑战','raid:recover':'放弃物资，短歇恢复能量1／身体8','raid:finish':'带回物资，领取现金','raid:kit':'用一份物资换符膜入背包，再结算'};
const sample=s=>({life:s.life,energy:s.energy,cash:s.v1.cash,bags:s.bags,burden:hostState(s).effectiveBurden,spirits:s.spirits.map(g=>({id:g.id,name:g.name,revival:g.revivalProgress,development:g.development}))});
export function raidReady(s){return s.scene==='hub'&&!s.combat&&!s.crisis&&s.systems.death==='alive'&&!s.investigation.active&&!s.school.started&&!s.dachang.started&&!s.journey.active&&!s.city.active&&!s.bus.active&&!s.doorCase.active&&!s.evolution.encounter?.active&&!s.evolution.cascade&&!s.systems.second&&!s.g1c?.events.some(e=>e.type==='lost-control')&&!s.g1d?.events.some(e=>e.type==='lost-control')&&(!s.raid||s.raid.status==='done')&&(s.raid?.serial||0)<3;}
export function raidActions(s,legal){
 const r=s.raid;
 if(!r||r.status==='done')return raidReady(s)?[...legal,'raid:start']:legal;
 // Crisis/death/reaction handlers remain authoritative; never give an escape
 // button that clears their persistent consequences.
 if(s.crisis||s.systems.death!=='alive'||s.combat?.eyeV6?.pending)return legal.filter(a=>!a.startsWith('raid:'));
 if(r.receipts.length>=500)return ['raid:leave'];
 if(r.node===0)return ['raid:silent','raid:rush','raid:leave'];
 if([1,3].includes(r.node)&&s.combat)return [...legal.filter(a=>/^(g1ap:|g1bp:|g1cp:|g1dp:|eye6:|combat:(avoid$|risk$|item$|ability:|focus:|cover:|combo$|aid:)|v1:(domain:cast$|seal:cast$|reset:))/.test(a)),...(s.combat.turn>=2&&s.combat.position==='safe'&&s.bags>0?['raid:contain']:[]),'raid:leave'];
 if(r.node===2)return [...(s.systems.items.barrier<2?['raid:salvage']:[]),'raid:recover','raid:leave'];
 if(r.node===4)return ['raid:finish',...(s.v1.items.film<2?['raid:kit']:[])];
 return legal;
}
function encounter(s,id,exposed=false){s.scene=id;s.phase='异常';s.combat=newCombat(id,s);s.combat.position=exposed?'exposed':'safe';if(s.raid.history.some(h=>h.contained<2)){s.combat.sourceGauge=40;s.journal.push('此前存在未封锁区域：本次源头行动窗口已推进40，危险状态沿用。');}}
export function applyRaid(s,a){
 if(a==='raid:start'){
  const old=s.raid;s.raid={format:1,serial:(old?.serial||0)+1,status:'active',node:0,cargo:0,contained:0,choice:null,receipts:old?.receipts||[],mastery:{},history:old?.history||[],start:sample(s),result:null};
  s.journal.push('住宅区短挑战开始：无需调查认证。目标是运输、隔离与撤离；源头没有生命值。');return;
 }
 const r=s.raid;
 if(a==='raid:silent'||a==='raid:rush'){r.choice=a==='raid:rush'?'rush':'silent';r.cargo+=r.choice==='rush'?1:0;r.node=1;encounter(s,'echo',r.choice==='rush');}
 if(a==='raid:contain'){
  s.bags--;r.contained++;r.cargo++;s.combat=null;s.scene='hub';s.phase='异常';r.node=r.node===1?2:4;
  s.journal.push('实际保持避险位置并完成两个战斗行动窗口，以黄金容器封锁本次运输路径的媒介。未认证源头、未取得厉鬼所有权。');
 }
 if(a==='raid:salvage'||a==='raid:recover'){
  if(a==='raid:salvage')s.systems.items.barrier=Math.min(2,s.systems.items.barrier+1);
  else {s.energy=Math.min(3,s.energy+1);s.life=Math.min(100,s.life+8);}
  r.node=3;encounter(s,'shadow');
 }
 if(a==='raid:leave'||a==='raid:finish')finish(s,a==='raid:finish'?'complete':'withdraw');
 if(a==='raid:kit'){r.cargo--;s.v1.items.film++;finish(s,'complete');s.journal.push('一份运输物资换为隔离符膜入背包；现金少40。需要按原背包规则部署，不自动装备。');}
}
function finish(s,why){
 const r=s.raid;if(r.status==='done')return;
 const ending=why==='dead'?'死亡':why==='crisis'?'失控中断':r.contained===2?'双区封锁':r.cargo>0?'带回部分物资':'空手撤离';
 const reward=['dead','crisis'].includes(why)?0:r.cargo*40;
 s.v1.cash+=reward;r.status='done';r.result={ending,reward,after:sample(s),world:why==='crisis'?'失控后果保留，未解决区域继续危险':why==='dead'?'死亡已发生，运输失败':r.contained===2?'两处运输路径已封锁，源头仍存在':'未封锁区域继续危险'};
 r.history=[...r.history,{serial:r.serial,ending,reward,contained:r.contained,world:r.result.world}].slice(-3);
 if(!['dead','crisis'].includes(why)){s.combat=null;s.scene='hub';s.phase='异常';}
 s.journal.push('挑战结算：'+ending+'；现金＋'+reward+'。'+r.result.world+'。');
}
export function advanceRaid(before,s,a,used,context){
 const r=s.raid;if(!r||before.raid?.status!=='active'&&!a.startsWith('raid:'))return;
 // Engine action identity, not a UI-generated certificate. No new skill or
 // candidate stage is granted here; existing actual casts own development.
 if(before.raid?.status==='active'||context?.actionId){
  const id=context?.actionId||`${s.settlement.ownerId}:${r.serial}:${s.tick}`;
  if(!r.receipts.includes(id)){
   r.receipts.push(id);
   for(const key of (before.combat?[used].flat().filter(Boolean):[]))r.mastery[key]=(r.mastery[key]||0)+1;
  }
 }
 const lost=s.crisis||s.g1c?.events.some(e=>e.type==='lost-control')||s.g1d?.events.some(e=>e.type==='lost-control');
 // The route choice and ghost maintenance are one atomic action. A late
 // loss-of-control receipt must replace the provisional successful payout.
 if(before.raid?.status==='active'&&r.status==='done'&&(lost||s.systems.death!=='alive')){
  s.v1.cash-=r.result.reward;r.history=r.history.filter(h=>h.serial!==r.serial);r.status='active';
 }
 if(r.status==='active'){if(s.systems.death!=='alive')finish(s,'dead');else if(lost)finish(s,'crisis');}
}
export function raidDuplicate(s,context){return !!context?.actionId&&!!s.raid?.receipts.includes(context.actionId);}
export function validRaid(s){
 const r=s?.raid;if(r===undefined)return true;
 const int=(v,max=1e9)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
 const snap=x=>x&&int(x.life,100)&&int(x.energy,3)&&int(x.cash)&&int(x.bags,2)&&Number.isFinite(x.burden)&&x.burden>=0&&Array.isArray(x.spirits)&&x.spirits.every(g=>typeof g.id==='string'&&typeof g.name==='string'&&Number.isFinite(g.revival)&&g.revival>=0&&g.revival<=100&&int(g.development,100));
 return !!r&&r.format===1&&int(r.serial,3)&&r.serial>0&&['active','done'].includes(r.status)&&int(r.node,4)&&int(r.cargo,3)&&int(r.contained,2)&&[null,'rush','silent'].includes(r.choice)&&Array.isArray(r.receipts)&&r.receipts.length<=512&&new Set(r.receipts).size===r.receipts.length&&r.receipts.every(x=>typeof x==='string'&&x.length<250)&&r.mastery&&typeof r.mastery==='object'&&!Array.isArray(r.mastery)&&Object.entries(r.mastery).every(([id,n])=>typeof id==='string'&&int(n,512))&&snap(r.start)&&Array.isArray(r.history)&&r.history.length<=3&&r.history.every(h=>int(h.serial,3)&&typeof h.ending==='string'&&int(h.reward,120)&&int(h.contained,2)&&typeof h.world==='string')&&(r.status==='active'?r.result===null:!!r.result&&typeof r.result.ending==='string'&&int(r.result.reward,120)&&snap(r.result.after)&&typeof r.result.world==='string');
}
