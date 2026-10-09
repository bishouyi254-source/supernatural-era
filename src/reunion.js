import {reunionFact,reunionKnown,witnesses,perceptionProfile} from './reunion-model.js';
import {commitControllerDeath} from './controller-death.js';
import {activeIds,v1Ward} from './v1.js';
import {advancedBusy,ruleBlocked} from './evolution-model.js';
import {hostState} from './spirits.js';
import {develop,ruleContest} from './rules.js';
const log=(s,t)=>{s.reunion.history.push(t);s.reunion.history=s.reunion.history.slice(-80);s.journal.push(t);};
const once=(a,v)=>{if(!a.includes(v))a.push(v);};
export const reunionReady=s=>s.dachang.started&&(s.village.escaped||s.village.world.vanished)&&!s.village.active;
export const reunionBusy=s=>!!s.reunion?.active;
const free=s=>s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s)&&s.scene==='hub'&&!s.combat&&!s.school.active&&!s.doorCase.active&&!s.investigation.active&&!s.mall.active&&!s.bus.active&&!s.city.active&&!s.journey.active&&!s.village.active&&!s.social.inside&&!s.social.conflict.active&&!s.social.human.active&&!['restricted','matched','unstable'].includes(s.systems.second?.stage);
const usableIds=s=>activeIds(s).filter(id=>!ruleBlocked(s,id));
const meetingAccess=s=>['MEMBER','COOPERATIVE'].includes(s.social.affiliation)||s.reunion.reputation.club.includes('SURVIVED_HUANGGANG');
const rescueReady=s=>['REFLECTION','RECORD','ROUTE'].every(f=>reunionKnown(s,f));
export function protectionCapacity(s){const x=s.reunion,h=hostState(s),id=x.operational,g=s.spirits.find(g=>g.id===id);if(!g||!usableIds(s).includes(id)||h.burdenRatio>1||h.balanceBias>=30)return 0;return s.spirits.length>=2&&['eye','shadow','headless','blood','door'].includes(g.sourceId)?2:1;}
export function reunionAvailable(s){if(!free(s))return [];const x=s.reunion;if(!reunionReady(s))return [];if(!x.started)return ['rj:start','rj:decline'];
 const out=['rj:leave'];
 if(!x.active){out.push('rj:wait');if(x.phase!=='DONE')out.push('rj:resume');if(x.assessed){if(s.dachang.official.verified)out.push('rj:report:official');if(s.social.started)out.push('rj:report:club');out.push(...usableIds(s).map(id=>'rj:role:'+id));if(s.spirits.length>=2)out.push('rj:disclose:rumor');if(s.dachang.official.verified&&x.responsibilityDecision===null)out.push('rj:responsibility:accept','rj:responsibility:refuse');}}
 if(!x.active&&['B','C','D','E','F'].includes(x.phase))return [...new Set(out)];
 if(x.phase==='A'){if(!x.assessed)out.push('rj:assess');else out.push('rj:next');}
 if(x.phase==='B'){if(!x.encounter.observed)out.push('rj:street:observe');else{if(!x.encounter.protected)out.push('rj:street:protect');out.push('rj:next');}if(x.encounter.observed&&s.energy>0)out.push(...usableIds(s).map(id=>'rj:street:probe:'+id));}
 if(x.phase==='C'){
  if(!x.party.inviteSeen)out.push('rj:invite');else if(x.party.declined)out.push('rj:next');else if(x.baseline===null)out.push('rj:party:baseline','rj:party:decline');else{
   if(!x.party.talked)out.push('rj:party:talk');if(!reunionKnown(s,'SHAN'))out.push('rj:classmate');if(!reunionKnown(s,'FIFTH'))out.push('rj:party:dishes');
   if(reunionKnown(s,'FIFTH')){if(!reunionKnown(s,'RECORD'))out.push('rj:identity:record');if(!reunionKnown(s,'RECOGNITION'))out.push('rj:identity:memory');out.push('rj:identity:talk');for(const c of ['directVision','reflection','camera','sound','physicalTrace'])if(!Object.hasOwn(x.perception,c))out.push('rj:observe:'+c);if(s.energy>0&&!Object.hasOwn(x.perception,'supernaturalSense'))out.push(...usableIds(s).map(id=>'rj:sense:'+id));if(reunionKnown(s,'REFLECTION')&&reunionKnown(s,'RECORD')){out.push('rj:next');if(!reunionKnown(s,'ROUTE'))out.push('rj:route');}}
  }
 }
 if(x.phase==='D'&&x.party.resolution)out.push('rj:next');
 if(x.phase==='D'&&!x.party.resolution){if(!reunionKnown(s,'ROUTE'))out.push('rj:route');if(rescueReady(s)){if(!x.party.protectionRule){out.push('rj:protect:cooperate');if(s.energy>0&&protectionCapacity(s)>0)out.push('rj:protect:spirit');}else if(x.party.rescued.length<3)out.push('rj:rescue');}out.push('rj:withdraw');if(x.party.resolution)out.push('rj:next');}
 if(x.phase==='E'){out.push('rj:wait');
  if(x.contact.yan==='UNKNOWN')out.push('rj:yan:call');if(x.world.yanDead&&!x.contact.verified&&(s.dachang.official.verified||meetingAccess(s)))out.push('rj:yan:verify');
  if(!x.decision.outcome){if(x.world.meeting&&meetingAccess(s)&&!x.decision.attended)out.push('rj:meeting:attend');out.push('rj:meeting:decline');if(x.decision.attended)out.push('rj:meeting:WITHDRAW','rj:meeting:COOPERATE','rj:meeting:OBJECT');}else out.push('rj:next');
  if(x.contact.verified)out.push(...releasedActions(s,'yan-canon'));
 }
 if(x.phase==='F'){const c=x.conflict;if(c.stage==='ENDED')out.push('rj:next',...releasedActions(s,'conflict-player-instance'));else{out.push('rj:conflict:leave','rj:conflict:negotiate');if(s.dachang.official.verified)out.push('rj:conflict:official');if(c.stage==='THREAT')out.push('rj:conflict:ready');if(c.stage==='READY')out.push('rj:conflict:threat');if(['READY','DISPLAY','RULE','LETHAL'].includes(c.stage)&&s.energy>0)out.push(...usableIds(s).map(id=>'rj:conflict:cast:'+id));if(['DISPLAY','RULE'].includes(c.stage))out.push('rj:conflict:escalate');if(c.stage==='LETHAL'){out.push('rj:conflict:provoke');if(s.energy>=2&&usableIds(s).length>=2)out.push('rj:conflict:both');}}}
 if(x.phase==='G'||x.phase==='DONE'){out.push('rj:wait');if(!x.case.opened)out.push('rj:case:open');else{out.push('rj:case:observe',...['城市街头','普通住所','商业街外围'].filter(z=>z!==x.case.location&&(z!=='普通住所'||s.dachang.home.confirmed)).map(z=>'rj:case:move:'+z));if(!x.case.observations.length)out.push('rj:case:vision');}if(x.case.opened&&x.phase==='G')out.push('rj:finish');}
 return [...new Set(out)];}
function releasedActions(s,id){const r=s.reunion.deaths.find(d=>d.id===id)?.released[0];if(!r||r.archived)return [];return !r.located?['rj:released:locate:'+id]:!r.limited?s.bags>0?['rj:released:limit:'+id]:[]:r.status==='LIMITED'?[...(s.v1.items.gold>0?['rj:released:seal:'+id]:[]),...(s.dachang.official.verified||s.reunion.decision.attended?['rj:released:refer:'+id]:[])]:['rj:released:archive:'+id];}
function end(s,result){const c=s.reunion.conflict;c.stage='ENDED';c.active=false;c.result=result;log(s,result+'；披露与实际复苏代价保留。');}
function progress(s){const x=s.reunion;if(x.phase==='C'&&x.party.declined){x.phase='E';x.active=true;log(s,'本人未入场，不补造现场与营救结果；进入后续联络。');return;}const i=['A','B','C','D','E','F','G','DONE'].indexOf(x.phase);x.phase=['A','B','C','D','E','F','G','DONE'][Math.min(7,i+1)];x.active=['B','C','D','E','F'].includes(x.phase);if(x.phase==='D'){x.party.state='TRAPPED';x.party.windows=4;}if(x.phase==='F'){x.conflict.active=true;x.conflict.knownAbilities=s.social.knownBy.wang.filter(f=>f.startsWith('ABILITY:')).map(f=>f.slice(8));x.conflict.secondRumor=x.reputation.club.includes('SECOND_SPIRIT_RUMORED');}log(s,'进入下一段个人经历；正史进度独立。');}
function publish(s,group,fact){once(s.reunion.reputation[group],fact);}
export function applyReunion(s,a){const x=s.reunion,k=a.slice(3);let used=null;
 if(k==='start'){x.started=true;x.declined=false;x.phase='A';log(s,'回到城市，先整理身体、结构、联系人与经历。没有获得新的鬼。');}
 else if(k==='decline'){x.declined=true;log(s,'暂不开始个人路线；世界阶段继续。');}
 else if(k==='leave'){if(x.phase==='D'&&!x.party.resolution){x.party.left=witnesses.filter(id=>!x.party.rescued.includes(id));x.party.resolution=x.party.rescued.length?'PARTIAL_RESCUE':'WITHDRAWN';x.party.state='DEPARTED';}x.active=false;log(s,'暂离当前现场；未解案件和世界后果保留。');}
 else if(k==='resume'){x.active=['B','C','D','E','F'].includes(x.phase);log(s,'返回尚未完成的个人现场；不会重置时间、营救窗口或证据。');}
 else if(k==='wait')log(s,'在现实城市等待并整理；世界时间与逐鬼复苏继续。');
 else if(k==='assess'){x.assessed=true;if(!x.operational)x.operational=usableIds(s)[0]||null;x.stabilizer=s.spirits.find(g=>g.id!==x.operational)?.id||null;log(s,'按本人亲历和已知披露评估；暂时平衡不等于稳定认证。');}
 else if(k.startsWith('role:')){x.operational=k.slice(5);x.stabilizer=s.spirits.find(g=>g.id!==x.operational)?.id||null;log(s,'调整主要操作与支撑职责；不改变主动位、不降低历史复苏。');}
 else if(k.startsWith('report:')){const group=k.slice(7);if(s.village.escaped){publish(s,group,'SURVIVED_HUANGGANG');if(s.village.participated)publish(s,group,'PARTICIPATED_MAJOR_EVENT');}if(group==='official'&&s.spirits.length>=2&&s.spirits.every(g=>s.dachang.official.knownSpirits.includes(g.id)))publish(s,group,'SECOND_SPIRIT_CONFIRMED');log(s,'实际联系并报告可核实经历；未公开能力不会凭空进入对方知识。');}
 else if(k==='disclose:rumor'){publish(s,'club','SECOND_SPIRIT_RUMORED');once(s.social.knownBy.wang,'DUAL_RUMOR');log(s,'主动透露疑似双鬼的消息，不公布第二鬼完整规律。');}
 else if(k.startsWith('responsibility:')){x.responsibilityDecision=k.endsWith('accept')?'ACCEPT':'REFUSE';log(s,x.responsibilityDecision==='REFUSE'?'拒绝官方职责，仍保留自由调查路线。':'接受有限协作职责，不取代正史负责人。');}
 else if(k==='street:observe'){x.encounter.observed=true;log(s,'日常街区出现位置与物理痕迹不一致，原因未确认。');}
 else if(k==='street:protect'){x.encounter.protected=true;log(s,'带路人远离未知痕迹；没有宣称关押源头。');}
 else if(k.startsWith('street:probe:')||k.startsWith('sense:')){used=k.startsWith('sense:')?k.slice(6):k.slice(13);s.energy--;develop(s.spirits.find(g=>g.id===used),3);if(k.startsWith('sense:')){x.perception.supernaturalSense='PARTIAL';reunionFact(s,'SENSE','玩家实例实际调用','supernaturalSense');}log(s,'低强度调用只得到异常线索；另一节点维持原有制约，不自动揭示规律。');}
 else if(k==='invite'){x.party.inviteSeen=true;log(s,'收到同学聚会邀请，可以参加或拒绝。');}
 else if(k==='party:decline'){x.party.declined=true;log(s,'拒绝聚会，不补造现场证据；正史同学路线继续。');}
 else if(k==='party:baseline'){x.baseline={attendees:['你',...witnesses],seats:4,dishes:4,tick:s.tick};reunionFact(s,'BASELINE','入场点名与餐桌记录',null,'CONFIRMED');log(s,'与三位原创同学到场，四席四套餐具；这是玩家并行席位，不复制正史人物结局。');}
 else if(k==='party:talk'){x.party.talked=true;log(s,'正常交流七中以后的生活；未公开体内鬼的详细规则。');}
 else if(k==='classmate'){reunionFact(s,'SHAN','有限同学联络',null,'SUSPECTED');log(s,'联络提及王珊珊仍有变化；本人的七中幸存记录与残余保持原样。');}
 else if(k==='party:dishes'){x.party.state='ANOMALY';x.identity.apparentIdentity='自称同学的来客';x.identity.claimedIdentity='一直在场的同学';reunionFact(s,'FIFTH','餐具与已保存人数基线','physicalTrace', 'CONFIRMED');log(s,'第五套餐具无法对应原到场记录；尚不能得出多了一只鬼。');}
 else if(k==='identity:record'){x.identity.worldRecordState='MISMATCH';once(x.identity.contradictions,'RECORD');reunionFact(s,'RECORD','入场原始联络记录','memory');x.identity.confidence='CONFLICTED';}
 else if(k==='identity:memory'){x.identity.socialRecognitionState='RECOGNIZED';once(x.identity.contradictions,'RECOGNITION');x.perception.memory='DISTORTED';reunionFact(s,'RECOGNITION','现场同学声称认识来客','memory');x.identity.confidence='CONFLICTED';}
 else if(k==='identity:talk')log(s,'继续询问身份矛盾者；声称一直在场，证词不改写原始名单，也不自动进入战斗。');
 else if(k.startsWith('observe:')){const ch=k.slice(8);x.perception[ch]=perceptionProfile[ch];if(ch==='reflection'){x.identity.reflectionState='ANOMALOUS';x.identity.confidence='CONFLICTED';once(x.identity.contradictions,'REFLECTION');reunionFact(s,'REFLECTION','反射规则-1501',ch);log(s,'镜中出现额外实体；这只确认此环境的观察价值，攻击与转移条件未知。');}else if(ch==='sound')reunionFact(s,'SOUND','反射规则-1501',ch,'SUSPECTED');else if(ch==='physicalTrace')reunionFact(s,'TRACE','独立地面痕迹',ch);else log(s,ch==='camera'?'影像无法提供稳定结论，不是电子识鬼器。':'肉眼没有捕捉对应实体；不是证明它不存在。');}
 else if(k==='route'){reunionFact(s,'ROUTE','现场出口核对','physicalTrace');log(s,'确认有限协作通道；营救不是灵异全图光环。');}
 else if(k==='protect:cooperate'){x.party.protectionRule='COOPERATE';x.party.protected=[...witnesses];log(s,'约定逐人依记录移动，每行动最多一人；不用灵异，但仍消耗危险窗口。');}
 else if(k==='protect:spirit'){used=x.operational;s.energy--;x.party.protectionRule='SPIRIT';x.party.protected=[...witnesses];log(s,'以已配置节点暂时支撑撤离；对应鬼正常付调用代价，最多'+protectionCapacity(s)+'人/行动，不永久隔绝源头。');}
 else if(k==='rescue'){const n=x.party.protectionRule==='SPIRIT'?Math.max(1,protectionCapacity(s)):1;const saved=witnesses.filter(id=>!x.party.rescued.includes(id)).slice(0,n);x.party.rescued.push(...saved);reunionFact(s,'RESCUED','本人实际分批营救',null,'CONFIRMED');log(s,'已带离'+saved.join('、')+'；源头仍未关押。');if(x.party.rescued.length===3){x.party.resolution='RESCUE_COMPLETED';x.party.state='DEPARTED';}}
 else if(k==='withdraw'){x.party.left=witnesses.filter(id=>!x.party.rescued.includes(id));x.party.resolution=x.party.rescued.length?'PARTIAL_RESCUE':'WITHDRAWN';x.party.state='DEPARTED';log(s,'撤离，未带出者只记录留在现场，不凭空宣告死亡。');}
 else if(k==='yan:call'){x.contact.yan='UNREACHABLE';reunionFact(s,'YAN_MISSING','本人联络没有回应',null,'CONFIRMED');log(s,'严力无法联系；失联不是死亡证据。');}
 else if(k==='yan:verify'){x.contact.yan='DEAD_CONFIRMED';x.contact.verified=true;reunionFact(s,'YAN_DEATH',s.dachang.official.verified?'已验证官方联络':'实际俱乐部可靠核对',null,'CONFIRMED');log(s,'核对到严力死亡与鬼血后果；死亡释放已通过持久事件登记，不生成玩家奖励。');}
 else if(k==='meeting:attend'){x.decision.access=true;x.decision.attended=true;x.decision.issue='黄岗村损失与人员失联后的处置';x.decision.participants=['王小强','邵临（原创驭鬼者）','你'];x.decision.knownFacts=x.facts.filter(f=>['YAN_DEATH','YAN_MISSING'].includes(f.id)).map(f=>f.id);x.decision.proposals=['组织配合核对','减少自身暴露','继续追究责任'];reunionFact(s,'MEETING','本人实际参会',null,'CONFIRMED');log(s,'组织提出责任判断，不等于世界事实。非会员仅凭实际邀请事实可进入。');}
 else if(k==='meeting:decline'){x.decision.outcome='DECLINED';log(s,'拒绝内部会议；仍可通过联系人得知有限消息。');}
 else if(k.startsWith('meeting:')){x.decision.position=k.slice(8);x.decision.outcome=x.decision.position;log(s,'提交会议立场：'+x.decision.position+'；不读取隐藏动机。');}
 else if(k==='conflict:ready'){x.conflict.stage='READY';log(s,'准备对抗，不等于调用灵异。');}
 else if(k==='conflict:threat'){x.conflict.stage='DISPLAY';x.conflict.revival=Math.min(100,x.conflict.revival+6);log(s,'语言威慑引发对方有限灵异回应；对方也承担复苏。');}
 else if(k==='conflict:escalate'){x.conflict.stage=x.conflict.stage==='DISPLAY'?'RULE':'LETHAL';log(s,'主动升级对抗，死亡可能产生独立灵异后果。');}
 else if(k==='conflict:provoke'){x.conflict.revival=Math.min(100,x.conflict.revival+10);s.life=Math.max(0,s.life-8);log(s,'致命阶段继续刺激对方回应，身体受损8；不是安全刷取奖励。');}
 else if(k==='conflict:both'){used=usableIds(s).slice(0,2);s.energy-=2;for(const id of used){const g=s.spirits.find(g=>g.id===id);g.revivalProgress=Math.min(100,g.revivalProgress+4);once(x.conflict.knownAbilities,id);once(s.social.knownBy.wang,'ABILITY:'+id);}for(const r of s.relations)if(used.includes(r.spiritA)&&used.includes(r.spiritB))r.bias=Math.max(-100,Math.min(100,(r.bias||0)+60));x.conflict.secondRumor=true;x.conflict.revival=Math.min(100,x.conflict.revival+10);x.conflict.uses++;log(s,'双节点高强度同时调用：能量2、各额外复苏4及关系偏移60，再按公共调用增长；此为游戏改编压力，不是无限输出。');}
 else if(k.startsWith('conflict:cast:')){used=k.slice(14);const c=x.conflict,g=s.spirits.find(g=>g.id===used),prior=c.knownAbilities.includes(used),result=ruleContest(v1Ward(s,g,'echo'),2+(prior?1:0));c.counter=prior?'对方防备此前已见媒介':'对方没有该媒介的既有针对证据';once(c.knownAbilities,used);once(s.social.knownBy.wang,'ABILITY:'+used);if(c.knownAbilities.length>=2)c.secondRumor=true;s.energy--;develop(g,3);c.uses++;c.revival=Math.min(100,c.revival+(result==='blocked'?6:8));if(result==='failed'){s.life=Math.max(0,s.life-10);}c.stage=c.stage==='LETHAL'?'LETHAL':'RULE';log(s,'规则对抗：'+result+'；仅实际调用节点支付复苏，目击永久保留。');if(result==='blocked'&&c.stage!=='LETHAL')end(s,'对方谨慎退让');}
 else if(k==='conflict:leave')end(s,'撤退降级，不要求打到死亡');
 else if(k==='conflict:negotiate')end(s,x.conflict.secondRumor?'疑似双鬼消息提高谨慎，对方接受有限停手':'以实际经历协商停手，不假造能力克制');
 else if(k==='conflict:official')end(s,'使用已核实的官方协调渠道降级');
 else if(k.startsWith('released:')){const [,verb,id]=k.split(':'),r=x.deaths.find(d=>d.id===id).released[0];if(verb==='locate')r.located=true;else if(verb==='limit'){s.bags--;r.limited=true;r.status='LIMITED';}else if(verb==='seal'){s.v1.items.gold--;r.status='SEALED';}else if(verb==='refer')r.status='REFERRED';else r.archived=true;log(s,'死亡释放处理：'+verb+'；独立实例一次提交，无经验、复制或新鬼奖励。');}
 else if(k==='case:open'){x.case.opened=true;x.case.followState='SUSPECTED';reunionFact(s,'FOLLOW_HINT','张伟有限异常联络',null,'SUSPECTED');log(s,'建立持续个人案件：张伟身边的异常，未宣告安全或解除。');}
 else if(k.startsWith('case:move:')){x.case.location=k.slice(10);log(s,'伴随对象换场景；灵异实体与旧证据仍保留，不变成门口标记。');}
 else if(k==='case:vision')log(s,'肉眼没有找到伴随实体，不能据此销案。');
 else if(k==='case:observe'){const p=x.case;for(const o of p.observations)o.freshness='STALE';p.observations.push({tick:s.tick,location:p.location,channel:'reflection',freshness:'CURRENT'});p.observations=p.observations.slice(-20);if(p.lastObservationLocation!==null&&p.lastObservationLocation!==p.location){p.followState='CONFIRMED';reunionFact(s,'FOLLOW','两处地点的实际反射观察','reflection');}p.lastObservationLocation=p.location;p.lastEvidenceTick=s.tick;log(s,'本次反射可见伴随实体，发动与转移规则仍未知；不是万能测鬼器。');}
 else if(k==='finish'){x.phase='DONE';x.active=false;log(s,'本阶段个人记录完成，持续案件未解决，真正鬼镜未开放。');}
 else if(k==='next')progress(s);
 if(x.conflict.revival>=100&&x.conflict.stage!=='ENDED'){commitControllerDeath(s,x,'conflict-player-instance',x.conflict.opponent,['echo']);end(s,'原创对抗者失控死亡，携带媒介形成新的独立处置案件');}
 if(s.life===0)s.systems.death='pending';return used;
}
export function advanceReunion(s,a,wasTrapped=false){const x=s.reunion;if(x.lastTick===s.tick)return;x.lastTick=s.tick;if(!reunionReady(s)&&x.startUnits===null)return;if(x.startUnits===null)x.startUnits=s.dachang.timeUnits;
 const count=Math.min(41,Math.floor((s.dachang.timeUnits-x.startUnits)/4)+1);while(x.world.nodes.length<count)x.world.nodes.push(120+x.world.nodes.length);
 const n=x.world.nodes.at(-1)||119;for(const [threshold,id] of [[120,1],[128,2],[135,3],[140,4],[143,5],[146,6],[150,7],[155,8],[159,9],[160,10]])if(n>=threshold)once(x.world.anchors,'CA-15'+String(id).padStart(2,'0'));
 if(n>=143&&!x.world.yanDead){commitControllerDeath(s,x,'yan-canon','严力',['blood']);x.world.yanDead=true;log(s,'世界历史：正史阶段发生人员死亡与独立灵异后果；角色须通过可靠来源确认具体信息。');}
 x.world.meeting=n>=145;
 if(s.village.aftermath.submitted){publish(s,'official','SURVIVED_HUANGGANG');publish(s,'official','PARTICIPATED_MAJOR_EVENT');}
 if(x.started&&x.responsibilityDecision==='ACCEPT'&&s.spirits.length&&x.reputation.official.includes('SURVIVED_HUANGGANG'))x.responsibility=s.mall.status==='RESOLVED'&&x.party.rescued.length?'INDEPENDENT_HANDLER':'COOPERATING_CONTROLLER';
 if(wasTrapped&&a.startsWith('rj:')&&a!=='rj:next'&&a!=='rj:leave'&&a!=='rj:resume'){x.party.windows=Math.max(0,x.party.windows-1);if(x.party.windows===0&&!x.party.resolution){x.party.left=witnesses.filter(id=>!x.party.rescued.includes(id));x.party.resolution=x.party.rescued.length?'PARTIAL_RESCUE':'MISSED';x.party.state='DEPARTED';log(s,'脱离窗口结束；尚未带出的同学只记留在现场，源头未关押。');}}
 if(s.crisis||s.systems.death!=='alive'){x.active=false;x.conflict.active=false;}
 if(x.operational&&!s.spirits.some(g=>g.id===x.operational))x.operational=null;if(x.stabilizer&&!s.spirits.some(g=>g.id===x.stabilizer))x.stabilizer=null;
}
