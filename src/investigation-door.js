import {zones,people,has,addFact,confirmed,conditionPool,assess,reconcile} from './investigation-model.js';
import {applyDoorTrigger,advanceDoorMark,doorPursuitSuppressed,doorManifest} from './event-rules.js';
import {hostState} from './spirits.js';
import {activeIds} from './v1.js';
import {ruleBlocked} from './evolution-model.js';
import {makeSpirit,relationship,canSecond} from './progression.js';

const at={lin:'r501',chen:'hall',manager:'management',li:'r502',observer:'stairs'};
const npcLocation=(x,id)=>x.npcs[id].state==='EVACUATED'||id==='li'&&x.removedDoors?'open':at[id];
const enabled=s=>s.systems.death==='alive'&&!s.crisis&&!s.combat&&!s.bus?.active&&!s.city.active&&!s.journey.active&&!['restricted','matched','unstable'].includes(s.systems.second?.stage);
const actors=s=>s.spirits.filter(g=>activeIds(s).includes(g.id)&&!ruleBlocked(s,g.id));
const usable=s=>s.energy>0?actors(s):[];
const restrictors=s=>usable(s).filter(g=>['blood','headless','shadow','officer','eye','door'].includes(g.sourceId)||s.v1.build==='suppression');
const log=(s,action,result)=>{const x=s.doorCase;x.journal.push({tick:s.tick,action,result});x.journal=x.journal.slice(-60);s.journal.push(action+'：'+result);};
function remember(s,id){s.doorCase.knownNPC[id]={state:s.doorCase.npcs[id].state,tick:s.tick};}
function reward(s){const x=s.doorCase;if(!x.rewarded){x.rewarded=true;x.fragment=1;x.permission=1;s.city.resources.fragments++;s.v1.trust.official=Math.min(100,s.v1.trust.official+1);}}
function record(s,result){const x=s.doorCase;x.records.push({tick:s.tick,result,observedSurvivors:Object.values(x.knownNPC).filter(n=>n.state!=='MISSING').length,facts:x.evidence.length,official:x.official,revivalDelta:{}});x.records=x.records.slice(-30);x.active=false;s.scene='hub';}
export function drivingGaps(s){const x=s.doorCase,h=hostState(s),gaps=[];
 if(!x.sealed||!s.systems.sealed.includes('door'))gaps.push('玩家独立封存实例');
 if(!confirmed(x,'inside'))gaps.push('触发规律已确认');if(!confirmed(x,'boundary'))gaps.push('媒介规律已确认');
 if(h.effectiveBurden+24>h.hostCapacity)gaps.push('承载余量24');
 if(s.spirits.some(g=>g.sourceId==='door'))gaps.push('不能重复获得实例');
 if(s.spirits.length>=2)gaps.push('三鬼以上请使用既有高级匹配路线');
 if(s.spirits.length===1&&(!canSecond(s)||!x.experiments.includes('open')||s.systems.items.barrier<1||relationship(s.spirits[0],makeSpirit('door')).compatibility<.5))gaps.push('俱乐部二鬼权限、关系评估与隔离符膜');
 if(h.balanceBias>=30||s.spirits.some(g=>g.revivalProgress>=95))gaps.push('先处理已有高风险构筑');return gaps;
}
export function doorPlans(s){const x=s.doorCase;return [
 {name:'媒介隔离',text:'移除开放设备区全部有效门并转移目标；保留原标记，停止未来接近。',gaps:x.removedDoors?[]:['在开放设备区移除门结构'],status:x.removedDoors?'局部限制已验证':'可实施结构调整'},
 {name:'完整封存',text:'观察显现窗口 → 限制源头 → 黄金容器封存。',gaps:[...(!confirmed(x,'inside')?['确认触发规律']:[]),...(!has(x,'E10')?['门网络探查']:[]),...(s.bags<1?['隔离袋×1']:[]),...(!restrictors(s).length&&x.npcs.observer.supportUsed>0?['有效压制能力 / 观察员援助已用尽']:[])],status:x.sealed?'已封存':x.restricted?'限制已建立':'尚未封存'},
 {name:'疏散并封锁',text:'通过物业疏散居民，封闭楼栋；源头保留，结果为部分控制。',gaps:[...(!x.evacuated?['完成居民疏散']:[]),...(!x.locked?['封锁楼栋']:[])],status:x.evacuated&&x.locked?'可以提交':'可先实施疏散'},
 {name:'独立驾驭',text:'封存不自动掉落灵异。主动植入应门玩家实例，负荷24、初始复苏18%、每次使用＋5（测试预算）。',gaps:drivingGaps(s),status:x.driven?'已主动驾驭':'独立机会'}];}
export function doorAvailable(s){const x=s.doorCase;if(!x||!enabled(s))return [];
 if(!x.active){if(s.scene!=='hub'||s.investigation.active)return [];return [...(!x.sealed?['door:enter']:[]),...(x.sealed&&!x.driven&&drivingGaps(s).length===0?['door:drive']:[])];}
 const out=['door:wait','door:leave',...Object.keys(zones).filter(id=>id!==x.zone&&(id!=='adjacent'||has(x,'E14'))).map(id=>'door:move:'+id)];
 if(x.search[x.zone]!==1)out.push('door:search');
 if(x.official)return out;
 for(const id of Object.keys(at))if(npcLocation(x,id)===x.zone&&x.npcs[id].state!=='MISSING'){
  if(!x.knownNPC[id]||!has(x,{lin:'E04',chen:'E12',manager:'E07',li:'E06',observer:'E10'}[id])||id==='manager'&&x.grade==='B'&&!has(x,'E14'))out.push('door:question:'+id);
  for(const h of x.hypotheses)if(['SUPPORTED','STRONGLY_SUPPORTED','CONFIRMED'].includes(h.status)&&!x.npcs[id].knowledge.includes(h.condition))out.push('door:share:'+id+':'+h.condition);
 }
 for(const c of conditionPool(x))if(!x.hypotheses.some(h=>h.condition===c))out.push('door:theory:'+c);
 if(x.zone==='r503'&&!x.experiments.includes('empty'))out.push('door:experiment:empty');
 if(x.zone==='hall'&&!x.experiments.includes('hall'))out.push('door:experiment:hall');
 if(['r501','r502','r503','storage'].includes(x.zone)){if(!x.experiments.includes('self'))out.push('door:experiment:self');if(!x.experiments.includes('knock'))out.push('door:experiment:knock');}
 if(x.zone==='open'&&!x.removedDoors)out.push('door:remove');
 if(x.removedDoors&&!x.experiments.includes('open'))out.push('door:experiment:open');
 if(x.zone==='management'&&!x.evacuated)out.push('door:evacuate');
 if(x.evacuated&&!x.locked&&x.zone==='management')out.push('door:lock');
 if(x.evacuated&&x.locked)out.push('door:partial');
 if(!has(x,'E10'))out.push(...usable(s).map(g=>'door:probe:'+g.id));
 const observer=x.npcs.observer;
 if(x.zone===npcLocation(x,'observer')&&!has(x,'E10')&&observer.supportUsed===0&&observerRevivalSafe(x)&&s.systems.items.barrier>0)out.push('door:survey');
 if(confirmed(x,'inside')&&has(x,'E10')&&x.source==='HIDDEN')out.push('door:window');
 if(x.source==='MANIFEST'){
  out.push(...restrictors(s).map(g=>'door:restrict:'+g.id));
  if(observer.supportUsed===0&&observer.knowledge.includes('inside')&&observer.knowledge.includes('boundary')&&observerRevivalSafe(x)&&s.systems.items.barrier>0)out.push('door:support');
 }
 if(x.restricted&&s.bags>0&&confirmed(x,'inside')&&has(x,'E10'))out.push('door:seal');return out;
}
const observerRevivalSafe=x=>x.observerRevival<80;
export function applyDoor(s,a){const x=s.doorCase;let used=null;const key=a.slice(5);
 if(key==='enter'){
  if(!x.started){x.started=true;x.seed=(s.seed^0xc017)>>>0;x.worldStatus='ACTIVE';x.startRevival=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress]));}
  x.active=true;s.scene='hub';x.phase='EVIDENCE';log(s,'抵达和平公寓B栋','五名人员可接触。门外传来询问，先核对现场。');
  if(x.official){log(s,'现场复核','已由其他处理人员限制；你尚无完整封存资料。');}
 }else if(key.startsWith('move:')){x.zone=key.slice(5);log(s,'移动至'+zones[x.zone],'移动本身不等于解除既有异常。');}
 else if(key==='search'){
  x.search[x.zone]=1;const id={access:'E02',r502:'E03',storage:'E07'}[x.zone];if(id)addFact(s,id);
  if(x.zone==='r502'&&has(x,'E05')&&x.npcs.li.state!=='MISSING'&&!x.removedDoors&&!x.evacuated)addFact(s,'E06');
  for(const [id,z] of Object.entries(at))if(x.zone===z&&x.npcs[id].state==='MISSING'){remember(s,id);if(id==='li')addFact(s,'E13');}
  log(s,'搜索'+zones[x.zone],id?'取得可核对的记录。':'完成一次有效检查；没有新的明确线索。');
 }else if(key.startsWith('question:')){
  const id=key.slice(9);remember(s,id);const list={lin:['E01','E04'],chen:['E12'],manager:['E07'],li:['E05',...(x.search.r502===1?['E06']:[])],observer:[]}[id];for(const e of list)addFact(s,e);
  if(id==='manager'&&x.grade==='B')addFact(s,'E14');
  log(s,'询问'+people[id],id==='observer'?'只确认异常可能与房门有关；其复苏严重，援助有限。':'证词已记录；证词中的解释仍需对照验证。');
 }else if(key.startsWith('theory:')){
  const c=key.slice(7);x.hypotheses.push({subject:c==='boundary'?'房门结构':'回应行为',condition:c,result:c==='boundary'?'阻止接近':'被追踪',tick:s.tick,...assess(x,c)});log(s,'提出结构化假设','仅根据已有证据检验，不改变真实规律。');
 }else if(key.startsWith('share:')){
  const [,id,c]=key.split(':');x.npcs[id].knowledge.push(c);x.npcs[id].warned=confirmed(x,c);remember(s,id);log(s,'向'+people[id]+'共享判断',confirmed(x,c)?'已确认规则已告知；对方仍有自己的行为。':'这是尚未确认的推测，对方不会把它当作已确认规律。');
 }else if(key.startsWith('experiment:')){
  const e=key.slice(11);x.experiments.push(e);
  if(e==='empty')addFact(s,'E08');if(e==='hall')addFact(s,'E09');if(e==='open')addFact(s,'E11');
  if(e==='self'||e==='knock')applyDoorTrigger(x,'player',{queryThroughDoor:true,personInside:true,confirmation:true,functionalBoundary:true});
  log(s,'进行对照实验',e==='self'||e==='knock'?'门内回应后，手腕出现淡淡门形痕迹。':'结果已记录；没有把未观察到的结果推成全知结论。');
 }else if(key==='remove'){
  x.removedDoors=true;if(x.npcs.li.state==='ALIVE')remember(s,'li');log(s,'移除设备区所有有效门并转移目标','李文移入开放设备区，追踪暂不再接近，原标记保留。打开或固定一扇门不等于此方案。');
 }else if(key==='evacuate'){
  x.evacuated=true;for(const id of Object.keys(people))if(x.npcs[id].state==='ALIVE'){x.npcs[id].state='EVACUATED';remember(s,id);}log(s,'协调物业疏散','幸存者移至无门开放区域。源头尚未封存。');
 }else if(key==='lock'){x.locked=true;log(s,'封锁楼栋','阻止新住户进入，封锁不等于封存。');}
 else if(key==='partial'){x.worldStatus='PARTIALLY_CONTAINED';reward(s);record(s,'PARTIALLY_CONTAINED');log(s,'提交疏散封锁记录','事件部分控制。未获得源头实例。');}
 else if(key==='survey'){s.systems.items.barrier--;x.observerRevival+=2;addFact(s,'E10');log(s,'有限联合探查','消耗隔离符膜×1；观察员自身复苏＋2，仅建立空间痕迹证据。');}
 else if(key.startsWith('probe:')){used=key.slice(6);s.energy--;addFact(s,'E10');log(s,'调用已有灵异探查','能量−1；仅被调用灵异产生使用复苏。');}
 else if(key==='window'){doorManifest(x,s.tick);x.phase='RESTRICTION';log(s,'构造单门规则窗口','以已有异常痕迹构造有限观察窗口；门后出现模糊轮廓，不是可击杀的目标。');}
 else if(key==='support'){s.systems.items.barrier--;x.observerRevival+=5;x.npcs.observer.supportUsed=1;x.restricted=true;x.source='RESTRICTED';log(s,'请求已沟通的观察员限制','消耗符膜×1；观察员复苏＋5，援助用尽。压制没有杀死源头。');}
 else if(key.startsWith('restrict:')){used=key.slice(9);s.energy--;x.restricted=true;x.source='RESTRICTED';log(s,'调用压制规则','能量−1、对应灵异使用代价；源头暂受限制。');}
 else if(key==='seal'){
  s.bags--;x.sealed=true;x.source='SEALED';x.worldStatus='RESOLVED';x.phase='RESOLUTION';s.restricted.door=true;s.outcomes.door='已封存';if(!s.systems.sealed.includes('door'))s.systems.sealed.push('door');reward(s);record(s,'RESOLVED');log(s,'黄金容器封存','消耗隔离袋×1。源头入库；没有自动驾驭或装备奖励。');
 }else if(key==='drive'){
  const g=makeSpirit('door');if(s.spirits.length){s.systems.items.barrier--;s.relations.push(relationship(s.spirits[0],g));g.stability='不稳定';s.systems.second={sourceId:'door',stage:'unstable',plan:'medium',mode:'capture',result:'success'};}
  s.spirits.push(g);x.driven=true;s.systems.sealed=s.systems.sealed.filter(id=>id!=='door');s.outcomes.door='已驾驭';log(s,'主动驾驭玩家实例','已建立媒介的门另一侧短暂感知。未复制源头完整杀人规则。');
 }else if(key==='leave'){record(s,'ESCAPED');log(s,'沿现实出口撤离','证据和自身异常保留，事件继续在世界中发展。');}
 else if(key==='wait')log(s,'保持沉默观察','等待一个行动窗口。沉默本身不会新增回应标记。');
 reconcile(x);return used;
}
export function advanceDoor(s,a){const x=s.doorCase;if(!x?.started)return;
 if(x.worldStatus==='ACTIVE'){
  x.elapsed++;
  if(x.source==='MANIFEST'&&s.tick>x.manifestUntil){x.source='HIDDEN';if(x.active)log(s,'窗口消失','源头不再可见，已有调查和代价保留。');}
  for(const [id,n] of Object.entries(x.npcs)){
   const suppressed=x.sealed||x.restricted||n.state==='EVACUATED'||x.removedDoors&&id==='li';const missing=advanceDoorMark(n.mark,suppressed);
   if(!suppressed&&n.mark?.age===32&&n.state==='ALIVE'&&x.source==='HIDDEN')doorManifest(x,s.tick);
   if(n.state==='ALIVE'&&missing){n.state='MISSING';x.search[at[id]]=0;if(x.active&&(at[id]===x.zone||x.zone==='open')){remember(s,id);if(id==='li')addFact(s,'E13');log(s,'现场变化',people[id]+'失踪，已见事实进入档案。');}}
  }
  // Unwarned residents can make bad choices; no omniscient UI update while the player is absent.
  for(const [id,t] of [['chen',44],['manager',52],['lin',60]])if(x.elapsed===t&&x.npcs[id].state==='ALIVE'&&!x.npcs[id].warned)applyDoorTrigger(x,id,{queryThroughDoor:true,personInside:true,confirmation:true});
  const newlyMarked=Object.entries(x.npcs).filter(([id,n])=>id!=='li'&&n.mark).length;const completed=Object.values(x.npcs).filter(n=>n.state==='MISSING').length;if(newlyMarked>=3||completed>=2)x.grade='B';
  if(x.elapsed>=96&&!x.active){x.official=true;x.worldStatus='PARTIALLY_CONTAINED';}
 }
 // Player pursuit persists outside the event. Changing rooms/leaving doesn't erase it.
 if(!['door:experiment:self','door:experiment:knock'].includes(a)&&advanceDoorMark(x.playerMark,x.sealed||x.restricted||x.removedDoors&&x.zone==='open')&&s.systems.death==='alive'){
  s.life=0;s.systems.death='pending';x.active=false;s.journal.push('已有异常在门结构之间接近，触发致死反应窗口。事件历史保留。');
 }
 if(x.active){if(Object.values(x.knownNPC).some(n=>n.state==='MISSING')||x.playerMark)x.phase='PRESSURE';if(x.restricted)x.phase='RESTRICTION';}
 if(s.systems.death!=='alive'||s.crisis)x.active=false;
 const r=x.records.at(-1);if(r?.tick===s.tick)r.revivalDelta=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress-(x.startRevival[g.id]??g.revivalProgress)]));
}
export function syncDoorKnowledge(s){const x=s.doorCase;if(!x?.started)return;const clues=[];if(has(x,'E10'))clues.push('movement');if(confirmed(x,'inside'))clues.push('witness');if(confirmed(x,'boundary'))clues.push('power');s.knowledge.door={clues,hypotheses:confirmed(x,'inside')&&confirmed(x,'boundary')?{true:'confirmed'}:{}};}

