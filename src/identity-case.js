import {identityAnchors,identityRegistry,noteDefinitions,identityKnown,identityEvidence,identityConflicts} from './identity-case-model.js';
import {advancedBusy} from './evolution-model.js';
import {activeIds} from './v1.js';
export const identityReady=s=>!!(s.postwar?.settled&&s.postwar.chapter===290);
export const identityBusy=s=>!!s.identityCase?.started;
const log=(s,t)=>{s.identityCase.history.push(t);s.identityCase.history=s.identityCase.history.slice(-100);s.journal.push(t);};
const once=(a,id)=>{if(!a.includes(id))a.push(id);};
export function identityAvailable(s){if(!identityReady(s)||s.systems.death!=='alive'||s.crisis||advancedBusy(s))return [];const x=s.identityCase;if(!x.started)return ['ic:start','ic:decline'];if(x.closed)return [];const a=['ic:wait'];if(!x.participating)a.push('ic:resume');
 if(x.participating){const known=id=>identityKnown(s,id),add=(ok,k)=>{if(ok)a.push('ic:'+k);};
 add(!known('history'),'history');add(known('history')&&!known('appearance'),'meet');add(x.zone!=='old-home'&&x.chapter>=292,'old-home');add(x.zone==='old-home'&&!known('paper-observation'),'paper');
 if(x.zone==='old-home'&&x.chapter>=293)for(const d of noteDefinitions)add(!known(d.id),'note:'+d.id);
 add(identityConflicts(s).length&&!known('note-comparison'),'compare');add(known('note-comparison')&&!x.hypotheses.some(h=>h.id==='memory'),'hypothesis:memory');add(known('appearance')&&!x.hypotheses.some(h=>h.id==='agency'),'hypothesis:agency');
 for(const h of x.hypotheses)add(!h.withdrawn,'withdraw:'+h.id);
 add(x.chapter>=294&&!known('paper-offer'),'paper-offer');add(x.chapter>=295&&known('paper-offer')&&!x.house.routeKnown,'route');add(x.house.routeKnown&&x.zone!=='house'&&x.zone!=='room','house');add(x.zone==='house'&&!x.house.permission,'permission');add(x.chapter>=296&&x.zone==='house'&&x.house.permission,'room');
 add(x.zone==='room'&&!x.house.roomObserved,'room-observe');add(x.zone==='room'&&x.house.roomObserved&&!x.house.cupboardObserved,'cupboard');add(x.chapter>=297&&x.zone==='room'&&x.house.cupboardObserved&&!known('handwriting'),'handwriting');
 add(x.chapter>=298&&known('handwriting')&&!known('expert-contact'),'expert');add(known('expert-contact')&&x.zone!=='xiaochun','xiaochun');add(x.zone==='xiaochun'&&x.analysis.status==='NONE'&&known('handwriting'),'submit');add(x.analysis.status==='READY','receive');
 add(x.chapter>=299&&!x.tracking.permission,'tracking-permission');add(x.tracking.permission&&x.zone!=='road','road');add(x.zone==='road'&&x.tracking.permission&&x.tracking.observations.length<3,'signal');add(x.tracking.observations.length&&!x.tracking.verifications.length,'verify-device');add(x.tracking.verifications.length&&x.tracking.observations.length>=3&&!x.tracking.entryKnown,'lead');
 add(x.evidence.some(e=>['paper-observation','note-comparison','device-verified'].includes(e.id))&&!x.disclosures.some(d=>d.to==='official'),'share');
 if(x.zone==='old-home'&&!known('ability-observation')&&s.energy>0)for(const g of s.spirits.filter(g=>activeIds(s).includes(g.id)))a.push('ic:observe:'+g.id);
 }
 if(x.chapter===299&&(!x.participating||x.tracking.entryKnown))a.push('ic:finish');if(x.chapter===299&&x.participating)a.push('ic:defer');return a;}
export function applyIdentityCase(s,a){const x=s.identityCase,k=a.slice(3),e=(id,text,origin,level='SUPPORTED')=>identityEvidence(s,id,text,origin,level);
 if(k==='start'||k==='decline'){x.started=true;x.participating=k==='start';x.startUnits=s.dachang.timeUnits;log(s,x.participating?'收到新的身份异常调查线索。先核对赵磊的历史身份，再决定接触范围。':'暂不参与案件。正史继续，未收到的证据不会自动成为知识。');}
 else if(k==='resume'){x.participating=true;log(s,'恢复调查。世界时间和已经发生的事件没有回退。');}
 else if(k==='history'){e('history','赵磊属于七中同学历史；这只确认既有身份关系，不证明当前主体可信。','CANON-HISTORICAL-REFERENCE');log(s,'核对历史身份完成；未新增第二名赵磊，也没有补造你曾与他接触的经历。');}
 else if(k==='meet'){x.identity.appearance='MATCH';e('appearance','获准接触观察：外貌及部分共同经历与历史身份对应，当前行为主导者仍未知。','CURRENT-CONTACT');x.memories.push({id:'shared-experience',holder:identityRegistry.actor,origin:'CURRENT-TESTIMONY',truth:'UNVERIFIED',belief:'REPORTED',tick:s.tick});log(s,'熟悉的外貌与可疑的反应同时存在。态度变化不能单独证明灵异控制。');}
 else if(k==='old-home'){x.zone='old-home';log(s,'前往旧住所调查现场。本次通行仅用于现场核验，不取得房产或源头控制权。');}
 else if(k==='paper'){x.identity.influence='SUPPORTED';e('paper-observation','现场存在与红色报纸、面孔影像有关的异常表现；关联同一来源，完整作用条件未知。','OLD-HOME-OBSERVATION');log(s,'保存面孔异常观察。影像不是新的独立厉鬼，也没有确认全部身份变化。');}
 else if(k.startsWith('note:')){const def=noteDefinitions.find(d=>d.id===k.slice(5));x.documents.push({id:def.id,raw:def.text,origin:def.origin,time:def.time,physical:'CONFIRMED',authorship:'SUPPORTED',truth:'UNVERIFIED',interference:'SUSPECTED'});e(def.id,def.text,def.origin);log(s,'保存笔记片段。当前文本为游戏化摘要；实物、作者支持和内容可靠性分别记录。');}
 else if(k==='compare'){x.identity.memory='QUESTIONED';e('note-comparison','笔记之间存在矛盾；可能涉及事实、时间或主导状态差异，暂未确认唯一解释。','DOCUMENT-COMPARISON');log(s,'已列出矛盾和缺失条件，原始笔记保留。重复阅读不增加证据独立性。');}
 else if(k.startsWith('hypothesis:')){x.hypotheses.push({id:k.slice(11),withdrawn:false});log(s,'建立可修订的调查假设。支持与反例从实际证据派生，不用真相积分。');}
 else if(k.startsWith('withdraw:')){x.hypotheses.find(h=>h.id===k.slice(9)).withdrawn=true;log(s,'撤回当前解释；证据与旧记录仍保留，不会删除不利材料。');}
 else if(k==='paper-offer'){x.offer={objectId:identityRegistry.paper,holder:'CANON-YANG',intent:'UNKNOWN',verification:'UNVERIFIED'};e('paper-offer','获准的转述摘要：杨间再次接触既有人皮纸信息。地点指引有待核验，提供者目的未知。','AUTHORIZED-YANG-REPORT','CONDITIONAL');log(s,'收到有限转述；你未获得人皮纸、任意提问权限或安全保证。');}
 else if(k==='route'){x.house.routeKnown=true;e('house-route','获得通往此前古宅外围的可达路线信息，第二间密室仍需许可和现场核验。','AUTHORIZED-LOCATION-REPORT');log(s,'核对地点线索。线索有效性与提供者可信度分开。');}
 else if(k==='house'){x.zone='house';log(s,'实际前往同一古宅入口。鬼镜记录和原所有者保持，不能直接进入密室。');}
 else if(k==='permission'){x.house.permission=true;e('room-permission','获准有限观察第二间密室；不包括设施所有权、控制或交易。','LIMITED-SITE-PERMISSION','CONFIRMED');log(s,'获得限定调查许可，未取得鬼镜或鬼橱控制权。');}
 else if(k==='room'){x.zone='room';log(s,'进入获准的第二间密室。先观察结构，再接近异常橱柜。');}
 else if(k==='room-observe'){x.house.roomObserved=true;e('room','确认第二间密室属于此前古宅，鬼镜房间与本房间不是同一设施。','ROOM-OBSERVATION','CONFIRMED');log(s,'记录房间结构；未知区域仍不显示可用出口。');}
 else if(k==='cupboard'){x.house.cupboardObserved=true;e('cupboard','未知古旧橱柜存在异常；真实用途、内部状态和代价尚未完整确认。','CUPBOARD-OBSERVATION');log(s,'建立独立鬼橱设施观察，不开放愿望、商店或任意问答。');}
 else if(k==='handwriting'){e('handwriting','橱柜附近保存残留文字物证；存在难辨字符、缺失内容和不明书写时间。','PHYSICAL-HANDWRITING','CONFIRMED');log(s,'保存残留字迹。确认纸面痕迹不等于确认内容或书写目的。');}
 else if(k==='expert'){e('expert-contact','建立小春市专业文字分析联络；对方只接收你实际提交的材料。','PROFESSIONAL-CONTACT','CONFIRMED');log(s,'获得有限专业协作渠道，可选择实际前往并提交字迹。');}
 else if(k==='xiaochun'){x.zone='xiaochun';log(s,'实际前往小春市协作点，未向专家披露完整灵异构筑或案件秘密。');}
 else if(k==='submit'){x.analysis={status:'PENDING',submitted:['handwriting'],submittedAt:s.tick,dueUnits:s.dachang.timeUnits+12,readyAt:null,receivedAt:null,result:null};x.disclosures.push({id:'EXPERT22',to:'expert',evidenceIds:['handwriting'],tick:s.tick});log(s,'只提交残留字迹，等待专业分析；报告未完成，也尚未被你收到。');}
 else if(k==='receive'){x.analysis.status='RECEIVED';x.analysis.receivedAt=s.tick;e('analysis-result',x.analysis.result,'PROFESSIONAL-REPORT');log(s,'收到不完整分析：保留候选字符和未识别部分，不能据此确认鬼橱完整规则。');}
 else if(k==='tracking-permission'){x.tracking.permission=true;e('device-permission','经相关部门核实，获准定位一部登记在失踪刑警名下的通信设备；持有人和失踪者状态未知。','OFFICIAL-DEVICE-REGISTRATION','CONFIRMED');log(s,'获得指定设备追踪许可；不是定位任意NPC的接口。');}
 else if(k==='road'){x.zone='road';log(s,'前往获准的道路采样点，信号未覆盖路段仍为空白。');}
 else if(k==='signal'){const index=x.tracking.observations.length,states=['INTERMITTENT','LOST','UNRELIABLE'],places=['可核对的道路采样点','本次未收到定位信号','与此前道路记录不一致的移动采样'];const o={id:'SIG22-'+(index+1),tick:s.tick,state:states[index],location:places[index],confidence:index===0?'MEDIUM':'LOW',holder:null};x.tracking.observations.push(o);x.tracking.status=o.state;e(o.id,'设备采样：'+o.location+'。当前持有人及原主人状态未知。','DEVICE-SAMPLE','SUPPORTED');log(s,'记录一次真实信号采样；断点不补线，不把设备移动当成人物移动。');}
 else if(k==='verify-device'){x.tracking.verifications.push({id:'DEVICE22-VERIFIED',tick:s.tick});e('device-verified','登记信息与获准设备编号对应；信号异常不能证明原主人存活或在场。','OFFICIAL-REGISTRATION-CHECK','CONFIRMED');log(s,'登记与采样已交叉核验，人物生死和当前持有者仍未知。');}
 else if(k==='lead'){x.tracking.entryKnown=true;e('transit-lead','设备移动与异常道路形成后续调查线索；尚未确认车辆内部、乘客或停站规律。','TRACKING-CROSS-CHECK');log(s,'形成第300章接触入口。本批停在299章，不提前启动公交旅程。');}
 else if(k==='share'){const ids=x.evidence.filter(e=>['PUBLIC','PERSONAL'].includes(e.scope)&&['paper-observation','note-comparison','device-verified'].includes(e.id)).map(e=>e.id);x.disclosures.push({id:'OFFICIAL22',to:'official',evidenceIds:ids,tick:s.tick});log(s,'已向官方提交选定案件观察（'+ids.length+'项），未披露私人构筑或未获准的人皮纸信息。实际披露不会被重启撤回。');}
 else if(k.startsWith('observe:')){const id=k.slice(8);s.energy--;e('ability-observation','调用自身灵异后观察到现场异常仍存在；观察不证明目标Agency、完整记忆或后续真相。','PLAYER-ABILITY-OBSERVATION');log(s,'有限观察消耗能量1，并只向实际调用的鬼结算调用复苏。');return id;}
 else if(k==='defer'||k==='finish'){x.closed=true;x.outcome=x.tracking.entryKnown?'INVESTIGATED':'DEFERRED';log(s,x.outcome==='INVESTIGATED'?'291—299调查归档，合法设备线索保留。后续公交升级尚待下一批。':'暂缓个人调查并归档。正史继续，未确认的身份与未知设施保持未知。');}
 else log(s,'等候一次案件进展。世界时间与每只鬼的自然复苏照常结算，不恢复身体或物资。');return null;}
export function advanceIdentityCase(s){const x=s.identityCase;if(!x?.started)return;x.chapter=Math.min(299,291+Math.floor((s.dachang.timeUnits-x.startUnits)/12));for(const [at,id] of identityAnchors)if(x.chapter>=at)once(x.anchors,id);const a=x.analysis;if(a.status==='PENDING'&&s.dachang.timeUnits>=a.dueUnits){a.status='READY';a.readyAt=s.tick;a.result='专业分析恢复了部分文字结构，支持过去存在接触或交流的可能；关键字仍有多个解释，缺失内容无法复原。此为游戏化分析摘要，不是原著逐字引文。';}}
