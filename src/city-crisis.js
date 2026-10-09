import {advancedBusy,ruleBlocked} from './evolution-model.js';
import {activeIds} from './v1.js';
import {crisisFact,crisisKnown,crisisPhases,caseNames,roadNames} from './city-crisis-model.js';
export const crisisReady=s=>s.dachang.started&&s.ghostMirror.world.chapter===207&&!s.ghostMirror.active;
export const crisisBusy=s=>!!s.cityCrisis?.active;
const log=(s,t)=>{s.cityCrisis.history.push(t);s.cityCrisis.history=s.cityCrisis.history.slice(-100);s.journal.push(t);};
const once=(a,v)=>{if(!a.includes(v))a.push(v);};
export function crisisAvailable(s){const x=s.cityCrisis;if(!x||s.crisis||s.systems.death!=='alive'||advancedBusy(s))return [];const free=s.scene==='hub'&&!s.bus.active&&!s.journey.active&&!s.combat&&!s.social.inside&&!s.social.conflict.active&&!s.social.human.active&&!s.village.active&&!s.reunion.active&&!s.regional.active&&!s.mall.active&&!s.investigation.active&&!s.school.active&&!s.doorCase.active;if(!x.started)return crisisReady(s)&&free?['cc:start','cc:decline']:[];if(!x.active)return crisisReady(s)&&free?['cc:resume']:[];
 const n=x.world.chapter,out=['cc:wait','cc:withdraw','cc:observe','cc:news'];
 if(!x.familyContact)out.push('cc:family');if(!s.dachang.home.confirmed)out.push('cc:home');else if(!x.prepared&&s.v1.cash>=40)out.push('cc:prepare');
 for(const id of Object.keys(x.roads)){if(x.roads[id].evidence.length<30)out.push('cc:route:'+id);out.push('cc:travel:'+id);}
 if(n>=210&&!crisisKnown(s,'appointment'))out.push('cc:official');
 if(crisisKnown(s,'appointment')&&!x.authority.assessment)out.push('cc:assessment');
 if(x.authority.assessment&&x.authority.playerRole==='INDEPENDENT')out.push('cc:cooperate');
 if(n>=213&&!crisisKnown(s,'death'))out.push('cc:club');if(crisisKnown(s,'death'))for(const id of x.organization.contacts)if(!x.organization.contacted.includes(id))out.push('cc:contact:'+id);
 if(n>=216&&!crisisKnown(s,'protection'))out.push('cc:requests');
 for(const t of x.authority.tasks){if(t.state==='REQUESTED')out.push('cc:accept:'+t.id,'cc:refuse:'+t.id);if(t.state==='ACCEPTED'&&t.id==='protection'&&x.roads.local.evidence.length)out.push('cc:assist:protection');if(t.state==='ACCEPTED'&&t.id==='rescue'&&x.familyContact)out.push('cc:assist:rescue');if(t.state==='ACCEPTED'&&t.id==='survey'&&x.cases.some(c=>c.id!=='zhang'))out.push('cc:assist:survey');}
 if(x.authority.tasks.some(t=>t.state==='ACCEPTED')&&!x.authority.allocations.length)out.push('cc:allocation');
 if(n>=221&&!crisisKnown(s,'zhang'))out.push('cc:case:zhang');if(n>=218&&!crisisKnown(s,'east'))out.push('cc:case:east');if(n>=222&&!crisisKnown(s,'west'))out.push('cc:case:west');
 for(const c of x.cases){if(!c.observations.includes('INTERVIEW'))out.push('cc:interview:'+c.id);if(c.id!=='zhang'&&c.state==='OBSERVED'){out.push('cc:refer:'+c.id);if(s.bags>0||x.authority.allocations.some(a=>a.valid&&a.consumed<a.quantity))out.push('cc:isolate:'+c.id);}if(!c.observations.includes('REPOST'))out.push('cc:repost:'+c.id);}
 if(x.cases.length>=2)out.push('cc:compare');
 const ids=activeIds(s).filter(id=>!ruleBlocked(s,id));if(n>=220&&x.cases.some(c=>c.id!=='zhang')&&ids.length>=2&&s.energy>=2&&x.cooperation.trials.length<8)out.push('cc:joint:'+ids.slice(0,2).join('+'));
 const eye=s.spirits.find(g=>g.sourceId==='eye');if(eye&&ids.includes(eye.id)&&s.v1.eye.layer>0&&s.energy>0)out.push('cc:domain:'+eye.id);
 for(const target of ['operator','research','private'])if(x.facts.length&&!x.communications.some(m=>m.receiver===target&&m.state==='DELAYED')&&x.communications.length<60&&x.facts.some(f=>!x.audiences[target].includes(f.id)))out.push('cc:send:'+target);
 if(n>=224&&!x.conference)out.push('cc:conference');if(n===225&&x.conference)out.push('cc:finish');return out;}
const evidence=(s,c,originId,text,level='CONFIRMED')=>c.evidence.push({originId,text,level,occurredAt:s.dachang.timeUnits,learnedAt:s.dachang.timeUnits});
export function applyCrisis(s,a){const x=s.cityCrisis,k=a.slice(3);let used=null;
 if(k==='start'||k==='resume'){x.started=true;x.active=true;log(s,'进入大昌市危机观察。先查看态势，再选择协作或独立调查；城市不会等待你的对话。');}
 else if(k==='decline'){x.started=true;x.outcome='REFUSED';log(s,'暂不参与地区行动。城市继续发展，既有身份与个人能力保留。');}
 else if(k==='withdraw'){x.active=false;x.outcome='WITHDRAWN';log(s,'回到个人城市生活；已救人员、已知证据与城市危机不会回滚。');}
 else if(k==='wait')log(s,'等候一次实际行动，世界时间与每只鬼的自然复苏照常结算。');
 else if(k==='observe'){if(x.world.chapter>=214)crisisFact(s,'haze','本人环境观察');log(s,x.world.chapter>=214?'异常阴霾遮蔽部分白昼，源头尚未确定。':'目前观察不到新的环境异常；未提前获得未来消息。');}
 else if(k==='news'){if(x.world.chapter>=222)crisisFact(s,'notice','公开应急通报');log(s,'核对公开消息；已公开的封锁与研究中的源头解释分开，未获得内部全档案。');}
 else if(k==='home'){s.dachang.home={confirmed:true,kind:'OWN',level:0};log(s,'确认原有普通住所；没有灵异隔离功能。');}
 else if(k==='prepare'){s.v1.cash-=40;x.prepared=true;log(s,'40现金用于普通生活物资与联络准备（游戏改编），不降低复苏，不免疫城市灵异。');}
 else if(k==='family'){x.familyContact=true;log(s,'确认身边联系人及居住区接应约定；不保证离城，也不虚构其他失联者死亡。');}
 else if(k.startsWith('route:')){const id=k.slice(6),r=x.roads[id],n=x.world.chapter;r.official=n>=222&&id==='airport'?'BLOCKED':n>=216&&id==='north'?'RESTRICTED':'NORMAL';r.observed=n>=222&&id==='north'?'SUPERNATURALLY_DISTORTED':n>=215&&id==='airport'?'UNRELIABLE':'NORMAL';r.evidence.push({units:s.dachang.timeUnits,origin:'本人路线核验',level:'CONFIRMED',official:r.official,observed:r.observed});log(s,roadNames[id]+'：官方 '+r.official+'；实地 '+r.observed+'。基础道路记录保留，旧观察可能过期。');}
 else if(k.startsWith('travel:')){const id=k.slice(7),r=x.roads[id],last=r.evidence.at(-1),fresh=last&&s.dachang.timeUnits-last.units<=12;if(!fresh)log(s,'这条路线缺少近期可靠核验。可先查交通、联系现场人员或改走居住区；未执行盲目通行。');else if(id==='local'){s.dachang.zone='home';log(s,'沿已核验的本地路线到达普通住处；这不是离城或安全屋免疫。');}else log(s,r.official!=='NORMAL'?'官方管制限制本次离城；可申请协调，未改写灵异空间。':r.observed!=='NORMAL'?'路线连接不可靠，放弃强行穿越；没有免费传送。':'到达城市内的交通接点。离城目的地和接收条件未确认，保留本地回程。');}
 else if(k==='official'){crisisFact(s,'appointment','官方身份通联');log(s,'核验两位正史负责人。你可以申请独立协作，不替代杨间或赵开明。');}
 else if(k==='assessment'){const o=s.dachang.official;x.authority.assessment={tick:s.tick,reportedCases:[...o.reports],knownSpirits:[...o.knownSpirits],reliability:o.verified?'VERIFIED_CONTACT':'LIMITED',history:{mall:s.mall.costs.uses,village:s.village.escaped,regional:s.regional.reported??false},scope:'仅采用已上报记录；隐藏能力不进入官方考核',acceptedDuties:[]};log(s,'完成有限资料考核：身份联络、实际上报履历及保密责任分别保存；两只鬼不等于自动任命。');}
 else if(k==='cooperate'){x.authority.playerRole='COOPERATOR';log(s,'登记独立地区协作者。获得限定协作入口，同时承担报告与保密责任；没有全城指挥权。');}
 else if(k==='club'){const known=s.social.knownBy.wang.includes('MET');crisisFact(s,'death',known?'旧俱乐部联系人核实':'官方许可组织变更摘要');log(s,'王小强死亡已核实。旧交易停止，部分人员离开与资产争议并存；已成交历史保留。王小明的亲属关系不等于放弃研究职责。');}
 else if(k.startsWith('contact:')){const id=k.slice(8);x.organization.contacted.push(id);log(s,({informant:'情报联系人转为分散联络；只谈已有消息，没有新俱乐部任务。',trader:'交易联系人确认旧组织资产争议；原有实物归属保留，新库存暂不出售。',volatile:'原高危联系人近况仍需独立核实；停业不等于所有成员死亡。'})[id]);}
 else if(k==='requests'){crisisFact(s,'protection','官方协作请求');for(const id of ['protection','rescue','survey'])x.authority.tasks.push({id,type:'COOPERATION_REQUEST',state:'REQUESTED',tick:s.tick});log(s,'三个独立请求：研究外围保护、市民接应、异常调查。均可拒绝，不扣除既有身份。');}
 else if(k.startsWith('accept:')||k.startsWith('refuse:')){const accept=k.startsWith('accept:'),t=x.authority.tasks.find(t=>t.id===k.split(':')[1]);t.state=accept?'ACCEPTED':'DECLINED';if(accept)t.type='AUTHORIZED_ASSIGNMENT';log(s,accept?'接受限定任务：需提交实际结果，不获得NPC控制权。':'拒绝这项自愿请求；未撤销既有身份，正史继续。');}
 else if(k==='allocation'){x.authority.allocations.push({id:'perimeter-bag',issuer:'regional-desk',scope:'peripheral-isolation',holder:'player',quantity:1,consumed:0,valid:true,tick:s.tick});log(s,'批准一份外围隔离额度。实物限于本批外围个案使用，不能换成无限黄金。');}
 else if(k.startsWith('assist:')){const t=x.authority.tasks.find(t=>t.id===k.slice(7));t.state='COMPLETED';log(s,({protection:'提交已核验的本地接应路线，完成研究外围保护；王小明正史核心行动保留。',rescue:'接应两名原创外围市民至已确认本地联系点，救援结果持久保存。',survey:'提交外围个案观察摘要，源头仍待研究。'})[t.id]);}
 else if(k.startsWith('case:')){const id=k.slice(5);crisisFact(s,id,id==='zhang'?'获准读取的正史处理摘要':'本人外围接触',id==='zhang'?'SUPPORTED':'CONFIRMED');x.cases.push({id,hostActorId:id==='zhang'?'zhang-liqin-canon':'peripheral-'+id,manifestationId:'manifestation-'+id,zone:id==='zhang'?'private':id,observations:['MANIFESTATION'],evidence:[{originId:'original-'+id,text:id==='west'?'外观不同，来源关系仍需对比':'观察到侵入异常；表现相近不证明源头',level:'SUPPORTED',occurredAt:s.dachang.timeUnits,learnedAt:s.dachang.timeUnits}],state:id==='zhang'?'RESOLVED_CANON':'OBSERVED',sourceLinkConfidence:'UNKNOWN',tick:s.tick});log(s,'记录'+caseNames[id]+'。张丽琴与王珊珊是独立人物线；玩家不接管正史核心处理。');}
 else if(k.startsWith('interview:')){const c=x.cases.find(c=>c.id===k.slice(10));c.observations.push('INTERVIEW');evidence(s,c,'witness-'+c.id,'独立接触记录：异常先后与阴霾时段部分吻合','SUPPORTED');log(s,'取得独立接触与时间线材料。共同时间只能支持假设，不能证明完整传播规则。');}
 else if(k.startsWith('repost:')){const c=x.cases.find(c=>c.id===k.slice(7));c.observations.push('REPOST');evidence(s,c,'original-'+c.id,'网络转述，原始出处与既有材料相同','SUPPORTED');log(s,'追溯转载到既有原始出处，不增加独立来源数量。');}
 else if(k.startsWith('refer:')||k.startsWith('isolate:')){const id=k.split(':')[1],c=x.cases.find(c=>c.id===id);if(k.startsWith('isolate:')){const allocation=x.authority.allocations.find(a=>a.valid&&a.consumed<a.quantity);if(allocation)allocation.consumed++;else s.bags--;c.state='ISOLATED';log(s,'消耗一份隔离物资限制外围接触，未关押完整源头。');}else{c.state='REFERRED';log(s,'将外围人员与已有记录转交本地专业接应。局部风险降低；城市源头仍未知。');}}
 else if(k==='compare'){const es=x.cases.flatMap(c=>c.evidence),origins=[...new Set(es.map(e=>e.originId))],verified=x.cases.filter(c=>c.observations.includes('INTERVIEW')).length;x.graph.links=[{id:'common-origin',level:verified>=2?'SUPPORTED':'SUSPECTED',origins,contradictions:x.cases.some(c=>c.id==='west')?['西部表现与东部不一致；尚不能据此排除同源']:[],gaps:['缺少源头直接证据','传播触发条件未确认']}];for(const c of x.cases)c.sourceLinkConfidence=verified>=2?'SUPPORTED':'UNKNOWN';log(s,'更新同源假设与反例、缺口。没有把相似实例自动合并成源头。');}
 else if(k.startsWith('joint:')){used=k.slice(6).split('+');s.energy-=2;const gs=used.map(id=>s.spirits.find(g=>g.id===id)),supported=gs.every(g=>g.development>=25)&&s.v1.eye.layer>=1&&gs.some(g=>g.sourceId==='eye')&&gs.some(g=>g.sourceId==='shadow')&&x.cases.some(c=>c.id!=='zhang'&&c.observations.includes('INTERVIEW'));x.cooperation.trials.push({tick:s.tick,spirits:used,result:supported?'CONDITIONAL':'FAILED'});x.cooperation.state=supported?'CONDITIONAL':'FAILED';x.cooperation.scope=supported?'仅当前已知外围边界，空间观察与实体限制的条件配合':'现有规则证据不足，未合成新能力';log(s,'两只鬼各自调用、消耗能量2，复苏独立结算。协同结果不等于宿主长期平衡，未掌握完整源头规则。');}
 else if(k.startsWith('domain:')){used=k.slice(7);s.energy--;log(s,'鬼域尝试：只确认本地边界存在干涉，缺少城市源头权柄与出口证据；未穿越城市边界。对应鬼照常承担调用复苏。');}
 else if(k.startsWith('send:')){const receiver=k.slice(5),ids=x.facts.filter(f=>!x.audiences[receiver].includes(f.id)).map(f=>f.id),state=x.dimensions.communication==='INTERRUPTED'?'LOST':x.dimensions.communication==='CONNECTED'?'DELIVERED':'DELAYED';x.communications.push({id:'cc-message-'+s.tick,sender:'player',receiver,tick:s.tick,sentAt:s.dachang.timeUnits,due:s.dachang.timeUnits+8,state,informationIds:ids,reliability:'原始来源随消息保存'});if(state==='DELIVERED')for(const id of ids)once(x.audiences[receiver],id);log(s,'发送至'+receiver+'：'+state+'。发送与接收是两个状态，未到达不共享知识。');}
 else if(k==='conference'){x.conference=true;crisisFact(s,'meeting',x.authority.playerRole==='COOPERATOR'?'限定协作会议摘要':'允许公开的会议摘要','SUPPORTED');log(s,'获得会议摘要：观察、同源研究假设与行动决策分别保留。初步理论没有变成确认真相。');}
 else if(k==='finish'){x.active=false;x.outcome='PREPARED';log(s,'本批结束于第225章。保留城市封锁、个人选择与调查缺口；第226章正式事件等待下一批。');}
 return used;}
export function advanceCrisis(s){const x=s.cityCrisis;if(!crisisReady(s)||x.lastTick===s.tick)return;x.lastTick=s.tick;x.startUnits??=s.dachang.timeUnits;const n=Math.min(225,208+Math.floor((s.dachang.timeUnits-x.startUnits)/12));x.world.chapter=n;
 const events=[['appointment',210],['death',213],['haze',214],['protection',216],['zhang',221],['notice',222],['meeting',224]];
 for(const [id,ch]of events)if(n>=ch&&!x.world.events.some(e=>e.id===id))x.world.events.push({id,chapter:ch,units:x.startUnits+(ch-208)*12});
 const thresholds=[210,210,210,213,213,214,216,216,221,222,225];x.world.anchors=thresholds.flatMap((ch,i)=>n>=ch?['CA-18'+String(i+1).padStart(2,'0')]:[]);
 if(n>=210){x.authority.controllers=['zhao-kaiming','yang-jian'];x.authority.scopes['yang-jian']=['地区负责人','独立应急行动'];}
 if(n>=213){x.organization.deathRecord??={id:'wang-xiaoqiang-canon:death',tick:s.tick,carried:'UNVERIFIED',released:'UNVERIFIED'};Object.assign(x.organization,{leader:'DEAD',state:'TRANSITION',transactions:'INTERRUPTED',assetDispute:true});s.social.inside=false;}
 x.phase=crisisPhases[n>=222?4:n>=216?3:n>=215?2:n>=214?1:0];
 Object.assign(x.dimensions,{environment:n>=222?'阴霾持续扩大':n>=214?'部分区域异常阴霾':'普通光照',mobility:n>=222?'外部交通严重受限':n>=216?'北侧管制与机场异常并存':n>=215?'机场路线不可靠':'区域正常',communication:n>=222?'DELAYED':'CONNECTED',publicSafety:n>=218?'出现待核实的分散个案':'尚无新个案记录',officialResponse:n>=222?'封锁与研究协调':n>=216?'外围保护与应急调查':n>=210?'两位负责人并任':'常规联络'});
 for(const m of x.communications)if(m.state==='DELAYED'&&s.dachang.timeUnits>=m.due){m.state='DELIVERED';m.deliveredAt=s.dachang.timeUnits;for(const id of m.informationIds)once(x.audiences[m.receiver],id);log(s,'一条延迟消息实际到达，接收方知识现在更新。');}
 if(s.crisis||s.systems.death!=='alive')x.active=false;
}
