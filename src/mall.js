import {mallHas,mallFact,mallRecord,mallTime,mallNodes,mallZones} from './mall-model.js';
import {activeIds} from './v1.js';
import {advancedBusy,ruleBlocked} from './evolution-model.js';
import {busBusy} from './bus.js';
const log=(s,text)=>{s.mall.journal.push({tick:s.tick,text});s.mall.journal=s.mall.journal.slice(-60);s.journal.push('商场：'+text);};
const viable=s=>s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s)&&!s.combat&&!s.school.active&&!s.doorCase.active&&!s.investigation.active&&!s.journey.active&&!s.city.active&&!busBusy(s)&&!['restricted','matched','unstable'].includes(s.systems.second?.stage);
const ghosts=s=>s.energy>0?s.spirits.filter(g=>activeIds(s).includes(g.id)&&!ruleBlocked(s,g.id)):[];
const isolators=s=>ghosts(s).filter(g=>['eye','door','headless','shadow'].includes(g.sourceId)||s.v1.build==='domain');
const suppressors=s=>ghosts(s).filter(g=>['blood','headless','shadow','officer'].includes(g.sourceId)||s.v1.build==='suppression');
const aid=x=>x.npc.yanMet&&!x.npc.yanWithdrawn&&x.npc.yanUses<6;
export function mallAvailable(s){const x=s.mall;if(!x||!viable(s)||!s.dachang.started||!s.dachang.signal.known)return [];
 if(!x.active){const out=[];if(s.scene!=='hub')return out;if(x.sealed&&!x.handedOff)out.push('mall:resume-handoff');if(!x.canonContained&&s.dachang.zone==='commercial'){out.push('mall:enter');if(x.containerStock>0&&s.bags<2&&s.v1.cash>=120)out.push('mall:buy-container');}if(x.canonContained&&!x.observedFinal&&!x.sealed)out.push('mall:report-result');if(x.records.length&&!x.reported&&s.dachang.official.verified&&s.dachang.official.route!=='HIDDEN')out.push('mall:official-report');return out;}
 if(x.phase==='RESOLUTION')return ['mall:handoff'];
 if(x.phase==='POST_NEGOTIATION')return ['mall:negotiate:accept','mall:negotiate:claim'];
 if(x.sealed)return x.secured?['mall:open-negotiation']:['mall:secure'];
 const out=['mall:wait','mall:withdraw'];
 if(x.canonContained)return [...out,'mall:report-result'];
 if(x.phase==='CRISIS'){
  if(!x.exposed){if(x.plan.role==='LOCATOR'&&ghosts(s).length)out.push(...ghosts(s).map(g=>'mall:locate:'+g.id));else out.push('mall:expose');}
  if(x.exposed){for(const id of x.candidates)if(id!=='C'&&!x.excluded.includes(id))out.push('mall:exclude:'+id);if(x.excluded.length===2&&!mallHas(x,'M14'))out.push('mall:confirm');
   if(mallHas(x,'M14')&&!x.isolated){if(aid(x))out.push('mall:aid:isolate');out.push(...isolators(s).map(g=>'mall:use:isolate:'+g.id));}
   if(!x.suppressed){if(aid(x))out.push('mall:aid:suppress');out.push(...suppressors(s).map(g=>'mall:use:suppress:'+g.id));}
   if(x.isolated&&x.suppressed&&!x.containerStarted&&s.bags>0)out.push('mall:container');
   if(x.containerStarted)out.push('mall:seal');
   if(x.isolated||x.suppressed||x.containerStarted)out.push('mall:interrupt');
  }return out;
 }
 out.push(...Object.keys(mallZones).filter(z=>z!==x.zone).map(z=>'mall:move:'+z));
 if(x.elevator!=='UNRESPONSIVE'&&x.elevatorRides<4)out.push('mall:elevator');
 if(!x.searched.includes(x.zone))out.push('mall:search');
 if(x.zone==='entry'&&!x.npc.managerMet)out.push('mall:talk:manager');
 if(x.zone==='storage'&&!x.npc.yanMet)out.push('mall:talk:yan');
 if(x.zone==='staff'&&!x.npc.jiangMet)out.push('mall:talk:jiang');
 if(x.npc.jiangMet&&!x.rescued.includes('a')&&x.zone==='staff'&&x.victims.a==='FOUND_ALIVE')out.push('mall:rescue:a');
 if(mallHas(x,'M09')&&!x.rescued.includes('b')&&x.zone==='storage'&&x.victims.b==='FOUND_ALIVE')out.push('mall:rescue:b');
 if(x.zone==='monitor'&&x.npc.managerMet)for(const id of ['entry','clothing','storage'])if(!x.cameras.includes(id))out.push('mall:cctv:'+id);
 if(x.cameras.length===3&&!x.timeline)out.push('mall:timeline');
 if(mallHas(x,'M09')&&!x.ruleTested)out.push('mall:lie-down');
 if(x.ruleTested&&!x.counterexample)out.push('mall:counterexample');
 if(x.timeline&&['M02','M03','M06','M09'].every(id=>mallHas(x,id))&&x.counterexample&&!mallHas(x,'M12'))out.push('mall:reconstruct');
 if(mallHas(x,'M02')&&!mallHas(x,'M13')){if(aid(x))out.push('mall:aid:vessel');out.push(...suppressors(s).map(g=>'mall:use:vessel:'+g.id));}
 if(mallHas(x,'M12')&&x.npc.yanMet){if(x.plan.role!=='MONITOR')out.push('mall:plan:role:MONITOR');if(ghosts(s).length&&x.plan.role!=='LOCATOR')out.push('mall:plan:role:LOCATOR');if(isolators(s).length&&x.plan.role!=='ISOLATOR')out.push('mall:plan:role:ISOLATOR');if(suppressors(s).length&&x.plan.role!=='SUPPRESSOR')out.push('mall:plan:role:SUPPRESSOR');if(s.bags&&x.plan.role!=='CONTAINER')out.push('mall:plan:role:CONTAINER');for(const k of ['EARLY','RISK'])if(x.plan.retreat!==k)out.push('mall:plan:retreat:'+k);for(const k of ['CANON_CUSTODY','CONTRIBUTION'])if(x.plan.assets!==k)out.push('mall:plan:assets:'+k);if(x.plan.role&&x.plan.retreat&&x.plan.assets&&!x.npc.yanWithdrawn&&s.bags>0)out.push('mall:begin');}
 return out;
}
function transfer(s){const x=s.mall,from=x.vessel;x.vessel=from==='mannequin'?'corpse':from==='corpse'?'concealed':'corpse';x.vesselHistory.push({tick:s.tick,from,to:x.vessel});x.vesselHistory=x.vesselHistory.slice(-60);x.exposed=false;x.suppressed=false;x.isolated=false;x.containerStarted=false;x.candidates=[];x.excluded=[];x.evidence=x.evidence.filter(id=>id!=='M14');mallFact(x,'M13');log(s,'当前躯体受限，异常却转移了。既有消耗保留，需重新排除候选；限制躯体没有结束案件。');}
function useAid(s){const x=s.mall;x.npc.yanUses++;if(x.npc.yanUses>=6){x.npc.yanWithdrawn=true;log(s,'严力出现明显失控征兆，拒绝继续援助。可撤回重组方案，不能命令他牺牲。');}}
function record(s,result){const x=s.mall;x.records.push({tick:s.tick,result,evidence:[...x.evidence],rescued:[...x.rescued],revivalDelta:{}});x.records=x.records.slice(-10);}
function canonTo(s,n){const x=s.mall;for(let id=32+x.canonNodes.length;id<=Math.min(63,n);id++)x.canonNodes.push(id);
 const count=x.canonNodes.length;for(const [node,id]of [[32,1],[42,2],[45,3],[49,4],[57,5],[61,6],[62,7],[63,8]])if(count>=node-31&&!x.anchors.includes('CA-M0'+id))x.anchors.push('CA-M0'+id);
 if(n>=61)x.canonContained=true;if(n>=63)x.canonResolved=true;
}
export function applyMall(s,a){const x=s.mall,k=a.slice(5);let used=null;
 if(k==='buy-container'){s.v1.cash-=120;s.bags++;x.containerStock--;x.costs.cash+=120;log(s,'在商场外围核对实物后购入黄金隔离袋×1，现金−120；库存有限，容器不保证自动封存未知对象。');}
 else if(k==='resume-handoff'){x.active=true;log(s,'恢复尚未完成的现场交接，已关押状态与消耗保持。');}
 else if(k==='enter'){if(!x.started){x.started=true;x.startUnits=mallTime(s);x.startRevival=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress]));}x.active=true;x.status='SOURCE_ACTIVE';x.phase='INVESTIGATION';x.plan.ready=false;s.dachang.zone='commercial';mallFact(x,'M01');log(s,'登记失踪信息，进入歇业商场。你是并行调查者，不接管杨间与严力的正史经历。');}
 else if(k.startsWith('move:')){x.zone=k.slice(5);x.elevatorTrips++;x.elevator=['MOVING_WITHOUT_REQUEST','WRONG_FLOOR','UNRESPONSIVE','SUPERNATURAL_ACTIVE'][Math.min(3,x.elevatorTrips-1)];mallFact(x,'M04');log(s,'前往'+mallZones[x.zone]+'；根据楼梯与路标核对抵达区域。电梯状态异常，不能用按钮自由传送。');}
 else if(k==='elevator'){x.elevatorRides++;const target=['storage','staff','clothing','entry'][(s.seed+x.elevatorRides)%4];x.zone=target;x.elevator='WRONG_FLOOR';mallFact(x,'M04');s.life=Math.max(0,s.life-5);log(s,'电梯未经选择抵达'+mallZones[target]+'；门开启时的异常接触造成身体−5。结果由当前实例与次数固定，读档不重抽目的地。');}
 else if(k==='search'){x.searched.push(x.zone);const f={entry:'M01',clothing:'M02',storage:'M03',staff:'M09'}[x.zone];if(f)mallFact(x,f);if(x.zone==='staff'){x.victims.b='FOUND_ALIVE';x.victims.c='FOUND_DEAD';x.knownVictims.b='FOUND_ALIVE';x.knownVictims.c='FOUND_DEAD';}mallRecord(x,'evidence');log(s,x.zone==='monitor'?'监控存在盲区与丢帧，需要分别读取三组记录。':'只登记当前观察；尸臭、假模特与失踪者都不是自动确定的源头。');}
 else if(k==='talk:manager'){x.npc.managerMet=true;log(s,'管理方提供门禁权限，声称17:31以后无人进入。此证词保留为待核实，不自动成为事实。');if(x.timeline)mallFact(x,'M07');}
 else if(k==='talk:yan'){x.npc.yanMet=true;x.npc.relations.push('MET','SHARED_EVENT');mallFact(x,'M05');log(s,'见到严力。他愿意有限合作，能力完整规律与精确复苏仍未知。');}
 else if(k==='talk:jiang'){x.npc.jiangMet=true;x.victims.a='FOUND_ALIVE';x.knownVictims.a='FOUND_ALIVE';mallFact(x,'M06');log(s,'江艳提供目击与个人记录；正史关键幸存者路线保留，救援的是外围玩家实例。');}
 else if(k.startsWith('rescue:')){const id=k.slice(7);x.victims[id]='EVACUATED';x.knownVictims[id]='EVACUATED';x.rescued.push(id);mallRecord(x,'rescue');log(s,'带一名实际发现的外围幸存者撤至警戒线。获救记录持久保存，不附送体内灵异。');}
 else if(k.startsWith('cctv:')){x.cameras.push(k.slice(5));mallRecord(x,'evidence');log(s,'取得对应摄像头记录；丢帧期间发生什么仍未知，空白不等于无人经过。');}
 else if(k==='timeline'){x.timeline=true;mallFact(x,'M08');if(x.npc.managerMet)mallFact(x,'M07');log(s,'重建三段时间线，首先发生变化的是服装区。记录只支持区域，不直接标出源头身份。');}
 else if(k==='lie-down'){x.ruleTested=true;mallFact(x,'M10');mallRecord(x,'risk');log(s,'在退路与他人警戒下验证躺下：附近衍生体停止接近。只确认此对象的局部条件。');}
 else if(k==='counterexample'){x.counterexample=true;mallFact(x,'M11');s.life=Math.max(0,s.life-5);log(s,'另一轮廓继续接近躺下者，警戒者及时示警；身体−5。局部规律存在反例，不能据此无限安全。');}
 else if(k==='reconstruct'){mallFact(x,'M12');mallRecord(x,'location');x.phase='PLANNING';log(s,'四类证据共同支持转移源头假设。已经定位区域，但仍须找到实际载体。');}
 else if(k.startsWith('plan:')){const [,field,value]=k.split(':');x.plan[field]=value;log(s,'更新合作方案：'+({role:'只承担自己可实现的职责',retreat:'明确撤退边界',assets:'明确源头由正史合作方保管、玩家按贡献结算'}[field])+'。');}
 else if(k==='begin'){x.plan.ready=true;x.windowAtBegin=x.crisisWindows;x.phase='CRISIS';x.evidence=x.evidence.filter(id=>id!=='M14');if(!x.npc.relations.includes('SHARED_INFORMATION'))x.npc.relations.push('SHARED_INFORMATION');canonTo(s,57);log(s,'进入短行动窗口。杨间与严力承担各自核心职责；你的职责为'+x.plan.role+'。隔离、压制、容器必须分别完成。');}
 else if(k==='expose'||k.startsWith('locate:')){if(k.startsWith('locate:')){used=k.slice(7);s.energy--;x.costs.uses++;mallRecord(x,'location');}x.exposed=true;x.candidates=['A','B','C'];mallRecord(x,'monitor');log(s,'联合布置引出异常，出现三个候选躯体。外观不能区分源头，先排除可核实的对象。');}
 else if(k.startsWith('exclude:')){x.excluded.push(k.slice(8));log(s,'以连续录像与在场目击排除一个候选。排除其他躯体不等于击杀厉鬼。');}
 else if(k==='confirm'){mallFact(x,'M14');log(s,'当前载体在连续窗口中得到确认。源头仍能转移，先切断路径才可稳定压制。');}
 else if(k.startsWith('aid:')||k.startsWith('use:')){const parts=k.split(':'),duty=parts[1];if(parts[0]==='use'){used=parts.slice(2).join(':');s.energy--;x.costs.uses++;mallRecord(x,'risk');}else useAid(s);
  if(duty==='vessel'){if(!x.restrictedVessels.includes(x.vessel))x.restrictedVessels.push(x.vessel);transfer(s);}
  if(duty==='isolate'){x.isolated=true;mallRecord(x,'isolation');log(s,'转移路径被临时隔绝；源头仍有活动能力，隔离不等于压制。');}
  if(duty==='suppress'){if(!x.isolated){transfer(s);}else{x.suppressed=true;mallRecord(x,'suppression');log(s,'源头活动被压制，转移路径已切断；尚未封存，材料仍需实际投入。');}}
 }
 else if(k==='container'){x.containerStarted=true;log(s,'展开现有黄金隔离袋，建立接近窗口。此刻尚未封口，失败不能假装关押成功。');}
 else if(k==='seal'){s.bags--;x.costs.bags++;x.sealed=true;x.phase='INVESTIGATION';x.containerStarted=false;x.status='SOURCE_CONTAINED';canonTo(s,61);mallRecord(x,'container');mallRecord(x,'materials');if(!x.npc.relations.includes('COOPERATED'))x.npc.relations.push('COOPERATED');log(s,'消耗隔离袋×1，完成联合关押。封存源头由正史合作方保管，不进入玩家背包或驾驭名单。');}
 else if(k==='interrupt'){x.containerStarted=false;if(!x.sealed){transfer(s);}log(s,'窗口中断；未封口的容器保留，已经使用的能力、严力风险和伤势不回滚。');}
 else if(k==='secure'){x.secured=true;x.phase='INVESTIGATION';x.status='SCENE_SECURED';log(s,'逐区核对警戒线、已知人员与剩余躯体。源头关押没有复活死亡者，未确认人员仍未确认。');}
 else if(k==='open-negotiation'){x.phase='POST_NEGOTIATION';x.status='POST_NEGOTIATION';log(s,'进入合作收益与保管协商；此前约定不授予玩家正史源头所有权。');}
 else if(k.startsWith('negotiate:')){x.negotiated=true;const claim=k.endsWith('claim');const reward=Math.min(160,x.contribution.length*15+(x.plan.assets==='CONTRIBUTION'?10:0)+(claim?25:0));x.reward=reward;s.v1.cash=Math.min(100000,s.v1.cash+reward);if(claim&&!x.npc.relations.includes('DISPUTED_REWARD'))x.npc.relations.push('DISPUTED_REWARD');x.phase='RESOLUTION';canonTo(s,62);log(s,'按实际调查、救援与处理职责结算现金＋'+reward+'。'+(claim?'提出较高补偿，留下收益争议；合作不自动变成信任。':'接受贡献补偿，保留有限合作关系。'));}
 else if(k==='handoff'){x.handedOff=true;x.status='RESOLVED';x.active=false;canonTo(s,63);record(s,'RESOLVED');log(s,'完成现场交接与离场。档案仍有未知，城市留下调查记录与真实获救历史。');}
 else if(k==='withdraw'){x.active=false;x.containerStarted=false;x.exposed=false;x.evidence=x.evidence.filter(id=>id!=='M14');x.isolated=false;x.suppressed=false;x.plan.ready=false;x.phase='INVESTIGATION';x.status=x.canonContained?'SOURCE_CONTAINED':'INVESTIGATION_PAUSED';record(s,'WITHDRAWN');log(s,'战术撤离，调查暂缓；世界继续，已有证据、伤势、灵异复苏和材料消耗保留。');}
 else if(k==='report-result'){x.active=false;x.observedFinal=true;record(s,'OTHERS_CONTAINED');log(s,'收到商场已由正史合作方关押的结果通报。没有补写未参与的监控、目击或完整规律，也不授予战利品。');}
 else if(k==='official-report'){x.reported=true;s.dachang.official.reports.push('mall-player-report');log(s,'仅交接自己已记录的证据与人员结果，未获得证据的部分明确标为未知；不支付重复任务奖励。');}
 else if(k==='wait'){log(s,'观察当前变化；等待也推进世界，危机窗口不会永久停留。');}
 if(s.life===0)s.systems.death='pending';return used;
}
export function advanceMall(s,action,wasCrisis=false){const x=s.mall;if(!s.dachang.started)return;const units=mallTime(s);x.lastUnits=units;
 // Canon advances independently of participation, but crisis actions are quarter-size world-time windows.
 if(s.dachang.signal.stage!=='UNREVEALED'&&!x.canonResolved){const age=Math.max(0,units/4-18),node=Math.min(63,32+Math.floor(age/3));canonTo(s,node);}
 if(action.startsWith('mall:')&&x.started){if(wasCrisis)x.crisisWindows++;else x.normalActions++;}
 if(x.active&&x.canonContained&&!x.sealed){x.active=false;x.status='SOURCE_CONTAINED';x.phase='INVESTIGATION';x.containerStarted=false;x.exposed=false;x.evidence=x.evidence.filter(id=>id!=='M14');x.isolated=false;x.suppressed=false;log(s,'正史合作方已完成关押，现场窗口关闭。可领取结果通报，不能重生源头刷奖励。');}
 if(x.active&&x.phase==='CRISIS'&&!x.sealed&&(x.crisisWindows-x.windowAtBegin)%5===0&&x.crisisWindows>x.windowAtBegin){if(x.plan.retreat==='EARLY'){x.active=false;x.status='INVESTIGATION_PAUSED';x.containerStarted=false;x.exposed=false;x.evidence=x.evidence.filter(id=>id!=='M14');x.isolated=false;x.suppressed=false;x.phase='INVESTIGATION';record(s,'WITHDRAWN');log(s,'达到约定的五窗口撤退线，实际退出；可在外围重组方案。');}else{s.life=Math.max(0,s.life-8);log(s,'高风险窗口继续挤压退路，身体−8；可主动撤离。');}}
 if(s.life===0&&s.systems.death==='alive')s.systems.death='pending';
 if(x.active&&(s.crisis||s.systems.death!=='alive'||advancedBusy(s))){x.active=false;if(!x.sealed)x.status='INVESTIGATION_PAUSED';x.containerStarted=false;record(s,s.systems.death==='alive'?'WITHDRAWN':'DEATH');log(s,'宿主反应优先，停止常规商场行动；持久案件结果保留。');}
 for(const r of x.records)if(r.tick===s.tick)r.revivalDelta=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress-(x.startRevival[g.id]??g.revivalProgress)]));
}
