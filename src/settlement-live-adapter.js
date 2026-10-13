import {settlementCoreToken} from './settlement-save.js';
import {chapterRetryAction} from './settlement-chapters.js';
/** Read-only encounter ledger. Engine state owns all costs, outcomes and rewards. */
import {events} from './content.js';
import {hostState} from './spirits.js';
import {available} from './engine.js';

// Exact state binding, including identity, revision and all imported state fields.
// A seed/tick pair alone is not sufficient to distinguish different saves.
export function settlementStateToken(s) {return settlementCoreToken(s);}
const snapshot=(s,id)=>({energy:s.energy,burden:hostState(s).effectiveBurden,
 ghosts:s.spirits.map(g=>({id:g.id,name:g.name,revival:g.revivalProgress,development:g.development})),
 resources:{bags:s.bags,barrier:s.systems.items.barrier},aids:structuredClone(s.systems.aids),
 clues:[...(s.knowledge[id]?.clues||[])],outcome:s.outcomes[id]??null});
// Newly acquired instances have no pre-encounter player value. Start their range
// at the first real post-acquisition save, never at a fabricated zero.
const initialGhostLedger=start=>start.ghosts.map(g=>({...g,before:g.revival,origin:'start',removed:false}));
function updateGhostLedger(session,before,after) {
 const ledger=(session.ghostLedger||initialGhostLedger(session.baseline)).map(g=>({...g}));
 for(const state of [before,after])for(const g of state.spirits){
  let entry=ledger.find(v=>v.id===g.id);
  if(!entry){entry={id:g.id,name:g.name,before:g.revivalProgress,origin:'acquired',joinedAtTick:state.tick};ledger.push(entry);}
  entry.revival=g.revivalProgress;entry.development=g.development;
 }
 for(const g of ledger)g.removed=!after.spirits.some(v=>v.id===g.id);
 return ledger;
}
export function beginBattleSettlement(s,{resumed=false,before=null}={}) {
 const eventId=s?.combat?.eventId||(s?.scene!=='hub'&&s?.phase==='限制'&&events[s?.scene]?s.scene:null)||(resumed&&s?.scene==='hub'&&s?.systems.second?.stage==='unstable'?s.systems.second.sourceId:null);
 if(!eventId)return null;
 const baseline=snapshot(before||s,eventId);
 return {format:2,eventId,seed:s.seed,startedAt:before?.tick??s.tick,lastTick:s.tick,
  binding:settlementStateToken(s),baseline,ghostLedger:initialGhostLedger(baseline),used:[],
  log:before?s.actionReceipt.facts.map(text=>({stage:`行动 ${s.tick}`,text})):[],resumed};
}
export function sessionForSavedGame(session,s) {
 if(!session||session.format!==2||!s||session.binding!==settlementStateToken(s))return null;
 const id=session.eventId;
 if(s.combat?.eventId===id||s.scene===id&&s.phase==='限制'||s.scene===id&&s.systems.death==='pending')return session;
 // Returning to the hub after implantation is an observation phase, not an end.
 // Scope it to this exact encounter and unfinished second-spirit attempt.
 if(s.scene==='hub'&&s.systems.second?.sourceId===id&&s.systems.second.stage==='unstable')return session;
 return null;
}
function terminal(session,before,after,action) {
 const id=session.eventId;
 if(action==='death:commit'&&before.systems.death==='pending'&&after.systems.death==='committed')return 'failed';
 const second=before.systems.second;
 if(second?.sourceId===id){
  if(action==='second:exit'&&after.scene==='hub'&&!after.systems.second)return 'escaped';
  if(action==='second:remove'&&second.stage==='unstable'&&after.systems.sealed.includes(id)&&!after.systems.second)return 'sealed';
  if(action==='second:stabilize'&&second.stage==='unstable'&&after.systems.second?.stage==='balanced'){
   return second.result==='success'&&hostState(after).balanceState==='暂时平衡'&&!after.crisis?'objective':'suppressed';
  }
  if((action==='abandon'||action.startsWith('abandon:'))&&!after.systems.second)return 'suppressed';
 }
 if((action==='combat:retreat'||action==='retreat'||action.startsWith('reaction:'))&&before.scene===id&&after.scene==='hub'&&!after.combat&&after.systems.death==='alive')return 'escaped';
 if(['capture','seal','aid'].includes(action)&&before.scene===id&&before.phase==='限制'&&after.scene==='hub'&&after.outcomes[id]!==before.outcomes[id])return action==='seal'?'sealed':'objective';
 return null;
}
export function advanceBattleSettlement(session,before,after,action) {
 if(!session||!sessionForSavedGame(session,before))return {session:null,record:null};
 if(after===before)return {session,record:null};
 if(after.seed!==before.seed||after.tick!==before.tick+1||after.actionReceipt?.action!==action||after.actionReceipt.tick!==after.tick||!available(before).includes(action))return {session:null,record:null};
 const id=session.eventId;
 const next={...session,lastTick:after.tick,binding:settlementStateToken(after),ghostLedger:updateGhostLedger(session,before,after),used:[...session.used],log:[...session.log]};
 if(/^(combat:(ability:|focus:|cover:|combo$)|ability$|v1:(domain:cast|seal:cast|reset:))/.test(action))next.used.push(action);
 for(const text of [...after.actionReceipt.facts,...after.actionReceipt.changes])next.log.push({stage:`行动 ${after.tick}`,text});
 next.log=next.log.slice(-200); // Presentation log is bounded; exact ability count is retained.
 const outcome=terminal(session,before,after,action);
 if(!outcome)return {session:sessionForSavedGame(next,after),record:null};
 const start=session.baseline,current=snapshot(after,id),original=new Map(start.ghosts.map(g=>[g.id,g])),last=new Map(current.ghosts.map(g=>[g.id,g]));
 const ghosts=next.ghostLedger.map(g=>({id:g.id,name:g.name,before:g.before,after:last.get(g.id)?.revival??g.revival,origin:g.origin,removed:g.removed,joinedAtTick:g.joinedAtTick}));
 const rewards=[];
 const discoveries=current.clues.filter(c=>!start.clues.includes(c));
 if(discoveries.length)rewards.push({id:`clues-${id}`,icon:'clue',kind:'档案进展',name:'新增已确认线索',quantity:`${discoveries.length} 条`});
 if(current.outcome&&current.outcome!==start.outcome)rewards.push({id:`outcome-${id}`,icon:'archive',kind:'事件处理记录',name:current.outcome,quantity:'已归档'});
 for(const [key,name] of [['bags','隔离袋'],['barrier','隔离符膜']]){
  const gain=current.resources[key]-(start.resources?.[key]??current.resources[key]);
  if(gain>0)rewards.push({id:`resource-${key}`,icon:'resource',kind:'实际资源增量',name,quantity:`+${gain}`});
 }
 for(const [aid,value] of Object.entries(current.aids))if(!start.aids?.[aid]&&start.aids)rewards.push({id:`aid-${aid}`,icon:'growth',kind:'实际援助联系',name:events[aid]?.spirit||aid,quantity:`剩余 ${value.remaining} 次`});
 for(const g of current.ghosts){
  const old=original.get(g.id);
  if(!old)rewards.push({id:`new-${g.id}`,icon:'growth',kind:'实际驾驭',name:g.name,quantity:'已驾驭'});
  else if(g.development>old.development)rewards.push({id:`growth-${g.id}`,icon:'growth',kind:'能力成长',name:`${g.name}开发度`,quantity:`+${Number((g.development-old.development).toFixed(2))}`});
 }
 const abilitiesUsed=next.used.map(a=>{
  if(/^combat:(ability|focus|cover):/.test(a)){
   const parts=a.split(':'),name=next.ghostLedger.find(g=>g.id===parts.at(-1))?.name||'已调用厉鬼';
   return name+'·'+({ability:'基础调用',focus:'集中压制',cover:'收束掩护'}[parts[1]]);
  }
  return a==='combat:combo'?'拼图共鸣':a==='ability'?(start.ghosts[0]?.name||'已调用厉鬼')+'·基础调用':({'v1:domain:cast':'鬼域调用','v1:seal:cast':'封印媒介','v1:reset:self':'自身重启','v1:reset:range':'范围重启'}[a]||'已调用规则技能');
 });
 const second=before.systems.second?.sourceId===id?before.systems.second:null;
 const observed=action==='second:stabilize',removed=action==='second:remove',cancelled=action==='second:exit';
 const interrupted=second&&(action==='abandon'||action.startsWith('abandon:'));
 const secondResolution=second?{stage:after.systems.second?.stage||'closed',plan:second.plan,mode:second.mode,result:second.result,balance:hostState(after).balanceState}:null;
 const record={format:2,id:`${session.seed}-${session.startedAt}-${after.tick}-${action}`,sourceTick:after.tick,sourceSeed:after.seed,sourceAction:action,sourceState:settlementStateToken(after),eventId:id,outcome,
  missionCompleted:['sealed','objective'].includes(outcome)&&!removed,encounter:events[id]?.title||id,secondResolution,
  ...(observed?{resultLabel:`观察完成 · ${secondResolution.balance}`} :removed?{resultLabel:'放弃驾驭 · 已封存',title:'挑战已结束'}:cancelled?{resultLabel:'取消第二鬼方案'}:interrupted?{resultLabel:'复苏危机处置 · 流程中止'}:{}),
  coverageLabel:session.resumed?'代价与次数仅覆盖本次载入后的行动':'',
  target:observed?(second.mode==='combine'?'结合已记录，失衡观察完成':'第二鬼已驾驭，失衡观察完成'):removed?'放弃第二鬼并合法封存':cancelled?'取消匹配，退出本次遭遇':interrupted?'处置复苏危机，中止第二鬼流程':outcome==='sealed'?'满足限制后完成合法封存':outcome==='objective'?'提交合法事件处置':outcome==='failed'?'死亡已提交，挑战终止':'从规则遭遇撤离',
  ruleResult:observed?`实际状态：${secondResolution.balance}；不代表长期稳定`:removed?'封存已提交，驾驭目标未完成':cancelled?'限制与代价保留，未完成驾驭':interrupted?(after.crisis?'复苏危机未解除；剩余厉鬼复苏保留':`实际状态：${hostState(after).balanceState}；剩余复苏保留`):outcome==='sealed'||outcome==='objective'?'证据支持限制方案，处置已提交':outcome==='failed'?'未能脱离致死后果':'已撤离，源头未关押',
  abilitiesUsed,cost:{energy:{before:start.energy,after:current.energy},burden:{before:start.burden,after:current.burden},ghosts},rewards,
  log:[...(session.resumed?[{stage:'记录范围',text:'原存档缺少战斗起点，仅记录本次载入后的行动与代价。'}]:[]),...next.log],actions:{returnToMap:true,retry:false}};
 return {session:null,record};
}
export function settlementForSavedGame(record,s) {
 if(!record||record.format!==2||!s||record.sourceState!==settlementStateToken(s)||record.sourceTick!==s.tick||record.sourceSeed!==s.seed||record.sourceAction!==s.actionReceipt?.action)return null;
 const legal=available(s);return {...record,actions:{returnToMap:true,retry:s.scene==='hub'&&s.systems.death==='alive'&&(record.chapterKey?!!chapterRetryAction(record,legal):legal.includes('enter:'+record.eventId))}};
}
