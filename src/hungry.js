import {activeIds} from './v1.js';
import {advancedBusy,ruleBlocked} from './evolution-model.js';
import {hungryAnchors,hungryEntities,hungryEdges,hungryFact,hungryKnown,hungryWindow} from './hungry-model.js';
import {currentHungryRoute,routeTruth,resolveHungryRules,protectionFor} from './hungry-rules.js';
export const hungryReady=s=>s.dachang.started&&s.cityCrisis.world.chapter===225&&!s.cityCrisis.active&&!s.ghostMirror.active&&!s.regional.active;
export const hungryBusy=s=>!!s.hungry?.active;
const log=(s,t)=>{s.hungry.history.push(t);s.hungry.history=s.hungry.history.slice(-100);s.journal.push(t);};
const usable=s=>activeIds(s).filter(id=>!ruleBlocked(s,id));
const routeCurrent=s=>s.hungry.routes.some(r=>r.from===s.hungry.zone&&currentHungryRoute(s,r.to));
export function hungryAvailable(s){const x=s.hungry;if(!x||!hungryReady(s)||s.crisis||s.systems.death!=='alive'||advancedBusy(s)||s.bus.active||s.journey.active||s.combat||s.social.inside||s.social.human.active||s.village.active||s.reunion.active||s.mall.active||s.investigation.active||s.school.active||s.doorCase.active)return [];if(!x.started)return ['he:start','he:decline'];if(!x.active)return ['he:resume','he:wait'];
 const n=x.world.chapter,a=['he:wait','he:observe','he:avoid','he:pause',...(!hungryKnown(s,'event')?['he:news']:[])];
 for(const to of hungryEdges[x.zone]){a.push('he:route:'+to);if(currentHungryRoute(s,to))a.push('he:move:'+to);}
 if(!x.historical.length)a.push('he:maps');if(x.routes.length&&!hungryKnown(s,'domain'))a.push('he:domain-theory');
 if(n>=230&&x.zone==='center'&&x.shelter.access==='UNKNOWN')a.push('he:shelter:request');
 if(x.shelter.access==='AUTHORIZED'&&x.zone==='center'){if(x.shelter.resources===0&&!hungryKnown(s,'supply'))a.push('he:shelter:stock');if(x.shelter.resources>0&&x.shelter.integrity>0)a.push('he:shelter:rest');}
 if(n>=231&&!x.digit)a.push('he:digit');if(n>=231&&!hungryKnown(s,'seven-witness')&&x.zone==='east')a.push('he:seven:witness');if(x.digit&&x.spatial.compared&&hungryKnown(s,'seven-witness'))a.push('he:seven:compare');
 if(n>=232&&!hungryKnown(s,'research'))a.push('he:research');if(n>=234&&hungryKnown(s,'research')&&!x.stageKnowledge.some(k=>k.stage===3))a.push('he:research:update');
 if(n>=235&&x.zone==='center'&&!x.spatial.observed)a.push('he:hospital:observe');if(x.spatial.observed&&!x.spatial.compared)a.push('he:hospital:compare');if(x.spatial.observed&&x.spatial.exposure<5)a.push('he:hospital:probe');
 for(const m of x.manifestations.filter(m=>m.zone===x.zone)){if(!m.knownByActors.includes('player'))a.push('he:entity:'+m.id);else{if(!x.relations.some(r=>r.entity===m.id))a.push('he:relation:'+m.id);if(m.state==='ACTIVE'&&s.bags>0&&x.stageKnowledge.some(k=>k.stage===m.currentStage&&k.confidence==='CONFIRMED'))a.push('he:isolate:'+m.id);}}
 if(x.task==='NONE')a.push('he:task:survey','he:task:rescue','he:task:refuse');
 if(x.task==='SURVEY'&&x.routes.length>=2||x.task==='RESCUE'&&x.people.some(p=>p.state==='SAVED'))a.push('he:task:submit');
 if(x.task==='RESCUE'&&n>=238&&!x.candle.holder)a.push('he:candle:loan');
 if(x.candle.holder==='player'&&x.candle.resource>0)a.push(x.candle.active?'he:candle:off':'he:candle:on');
 for(const p of x.people.filter(p=>p.zone===x.zone&&p.state==='WAITING')){if(!p.known)a.push('he:people:'+p.id);else if(x.shelter.access==='AUTHORIZED'&&x.shelter.resources>=p.members&&x.shelter.occupants.length+p.members<=x.shelter.capacity&&currentHungryRoute(s,'center'))a.push('he:rescue:'+p.id);}
 if(x.stageKnowledge.some(k=>k.stage===3&&k.confidence==='SUSPECTED')&&x.ruleResults.some(r=>r.triggers.includes('SOUND')&&r.result==='EXPOSED'&&x.manifestations.some(m=>m.id===r.entity&&m.knownByActors.includes('player'))))a.push('he:research:compare');
 if(n>=240){a.push('he:team:contact:research','he:team:contact:support');for(const t of x.teams)if(hungryKnown(s,'lost-'+t.id)&&!hungryKnown(s,'official-check-'+t.id))a.push('he:team:verify:'+t.id);for(const id of ['research','support'])if(x.facts.length&&x.messages.length<60&&!x.messages.some(m=>m.to===id&&m.state==='DELAYED'))a.push('he:team:share:'+id);}
 if(s.energy>0)for(const id of usable(s))a.push('he:cast:'+id);
 if(n===249)a.push('he:report');return a;
}
export function applyHungry(s,a){const x=s.hungry,k=a.slice(3);let used=null;x.protection=null;
 if(k==='start'||k==='resume'){x.started=true;x.active=true;if(!Object.keys(x.startRevival).length)x.startRevival=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress]));log(s,'进入城市危机。先看周围、核对道路；留下资料与接应市民同样有价值。');}
 else if(k==='decline'){x.started=true;x.declined=true;x.outcome={status:'REFUSED',source:'NOT_CONTAINED',saved:0,tick:s.tick};log(s,'拒绝高危任务，保留独立路线；世界事件仍继续。');}
 else if(k==='pause'){x.active=false;x.candle.active=false;x.candle.coverage=[];x.outcome={status:'PAUSED',source:'NOT_CONTAINED',saved:x.shelter.occupants.length,tick:s.tick};log(s,'暂停个人行动，仍在当前区域；没有跨越异常道路回到安全屋。');}
 else if(k==='wait')log(s,'等候一个实际行动窗口；世界时间和每只鬼的复苏分别结算。');
 else if(k==='avoid'){x.protection='AVOID';log(s,'遮挡暴露、保持距离并安静停留；这次不满足已建模的视线、接触与声音条件。');}
 else if(k==='observe'){x.zones[x.zone].lastObserved=s.tick;hungryFact(s,'haze-'+x.zone,'本区域阴霾与公共秩序异常','本人环境观察','CONFIRMED');log(s,'记录当前区域环境，尚不能据此确认源头或全城实例总数。');}
 else if(k==='news'){hungryFact(s,'event','官方将当前事件列为城市级饿死鬼危机；评级描述事件影响，不是单鬼战力','官方应急通报','CONFIRMED');log(s,'取得当前应急通报；城市源头尚未关押。');}
 else if(k==='maps'){x.historical=[{origin:'0.18城市路况档案',description:'保留此前核验记录，但不保证在当前危机仍然有效'},{origin:'0.16区域鬼域救援档案',description:'历史避险与出口经验仅为参考，不自动成为当前路线'}];log(s,'对照历史城市道路与区域鬼域资料；当前通行必须现场核验。');}
 else if(k==='domain-theory'){hungryFact(s,'domain','道路矛盾可能与灵异空间影响有关','路线对照','SUSPECTED');log(s,'记录空间影响假说，尚未找到源头出口。');}
 else if(k.startsWith('route:')){const to=k.slice(6),r={from:x.zone,to,observed:routeTruth(s,x.zone,to),validity:'CURRENT',tick:s.tick,chapter:x.world.chapter,origin:'当前现场道路观察'};const old=x.routes.findIndex(v=>v.from===r.from&&v.to===to);if(old<0)x.routes.push(r);else x.routes[old]=r;hungryFact(s,'route-'+x.zone+'-'+to,r.observed==='DISTORTED'?'道路连接与过去地图矛盾':'本次观察支持局部道路相通','当前现场道路观察','CONFIRMED');log(s,r.observed==='DISTORTED'?'道路连接异常，不能据此移动；过去地图仍保留。':'已核验相邻道路；有效期有限，变化后需要重查。');}
 else if(k.startsWith('move:')){x.zone=k.slice(5);log(s,'沿刚核验的道路进入相邻区域；没有离开城市鬼域。');}
 else if(k==='shelter:request'){Object.assign(x.shelter,{access:'AUTHORIZED',holder:'player',authorization:'TEMPORARY_GROUP'});log(s,'获得外围临时接应点使用许可；这不是观江花园，也不取得设施所有权。');}
 else if(k==='shelter:stock'){x.shelter.resources=6;hungryFact(s,'supply','接应组织配发一次应急接应物资6份','有限实物交接','CONFIRMED');log(s,'登记领取一次应急接应物资6份；用于休整与接应，不自动再生。');}
 else if(k==='shelter:rest'){x.shelter.resources--;x.protection='SHELTER';s.life=Math.min(100,s.life+18);s.energy=3;log(s,'使用临时庇护物资1份，恢复身体18与能量；仅隔绝已验证视线/接触，不降低复苏或免疫未知规律。');}
 else if(k==='digit'){x.digit={content:'7',origin:'特定人员失联前的信息',receivedAt:s.tick,confirmedMeaning:null,interpretations:['LOCATION','COUNT','RULE','MISDIRECTION'].map(id=>({id,level:'SUSPECTED'}))};log(s,'收到原始内容“7”。内容已确认，地点、数量、规律与误导四种解释同时保留。');}
 else if(k==='seven:witness'){hungryFact(s,'seven-witness','外围证词提到异常街道连接，不能等同普通地图第七条路','独立外围证词','SUPPORTED');log(s,'记录独立证词，需与时间和空间证据比较。');}
 else if(k==='seven:compare'){hungryFact(s,'seven-hypothesis','“7”可能关联一条隐藏街道，源头位置仍未确定','原始信息＋独立证词＋空间对照','SUPPORTED');x.digit.interpretations.find(h=>h.id==='LOCATION').level='SUPPORTED';log(s,'第七街道假说得到多来源支持；不是确定含义，也没有解锁源头快速传送。');}
 else if(k==='research'){hungryFact(s,'research','已实际读取王小明研究组的阶段研究摘要','获准研究材料','CONFIRMED');x.stageKnowledge=[{stage:1,confidence:'CONFIRMED',confirmed:['VISUAL'],suspected:[],evidence:['研究观察与对照摘要'],tick:s.tick},{stage:2,confidence:'CONFIRMED',confirmed:['VISUAL','CONTACT'],suspected:[],evidence:['研究观察与接触对照摘要'],tick:s.tick}];log(s,'读到前两阶段的视线与接触研究；被看见是触发风险，不等于立即死亡。后续阶段仍未知。');}
 else if(k==='research:update'){x.stageKnowledge.push({stage:3,confidence:'SUSPECTED',confirmed:[],suspected:['VISUAL','CONTACT','SOUND'],evidence:['第三阶段声音关联的初步研究'],tick:s.tick});log(s,'第三阶段的累积条件与声音关联仍是初步假说，第四阶段未明。');}
 else if(k==='research:compare'){const r=x.ruleResults.find(r=>r.triggers.includes('SOUND')&&r.result==='EXPOSED'&&x.manifestations.some(m=>m.id===r.entity&&m.knownByActors.includes('player')));hungryFact(s,'sound-comparison','现场存在声音伴随的受影响记录；与视线等条件尚未完全分离，支持声音假说但不足以确认','本人行动'+r.tick+'与获准研究对照','SUPPORTED');const study=x.stageKnowledge.find(k=>k.stage===3);study.confidence='SUPPORTED';study.tick=s.tick;study.evidence.push('本人实际声音伴随记录；尚存在混杂条件');log(s,'声音关联增加现场依据，仍是有支持的推测，未确认完整第三阶段规律。');}
 else if(k==='hospital:observe'){x.spatial.observed=true;hungryFact(s,'hospital','医院周边投影与正常道路的空间关系存在矛盾','医院外围实地观察','CONFIRMED');log(s,'从医院外围记录空间异常；未取得医院源头控制权。');}
 else if(k==='hospital:compare'){x.spatial.compared=true;x.spatial.hypothesis='SUPPORTED';hungryFact(s,'space','旧图、现场连接和时间记录支持隐藏空间连接假说','地图与现场对照','SUPPORTED');log(s,'对照正常地图与异常投影，支持隐藏连接而非已经定位源头。');}
 else if(k==='hospital:probe'){x.spatial.exposure++;log(s,'主动探测与特定空间表现建立反向暴露，当前观察者风险增加；不是所有鬼无条件反噬。');}
 else if(k.startsWith('entity:')){const m=x.manifestations.find(m=>m.id===k.slice(7));m.knownByActors.push('player');x.zones[x.zone].knownCases.push(m.id);hungryFact(s,'seen-'+m.id,'观察到一个独立异常表现，当前阶段与源头关联需另行核验','本次现场观察','CONFIRMED');log(s,'记录这一异常表现；外观相似不代表已经确认鬼婴或源头。');}
 else if(k.startsWith('relation:')){const id=k.slice(9);x.relations.push({entity:id,source:'UNKNOWN',confidence:'SUSPECTED',evidence:['外观与活动记录，尚未独立验证来源']});log(s,'登记疑似关联，不把后台来源写进角色档案。');}
 else if(k.startsWith('isolate:')){s.bags--;x.manifestations.find(m=>m.id===k.slice(8)).state='LIMITED';log(s,'消耗隔离袋1份限制这一表现；不是源头关押，不提供经验或新鬼。');}
 else if(k.startsWith('task:')){x.task=({survey:'SURVEY',rescue:'RESCUE',refuse:'DECLINED',submit:'COMPLETED'})[k.slice(5)];log(s,k==='task:submit'?'提交实际记录或接应成果，保留有限职责；城市事件没有因此结束。':'登记本人的独立职责；不指挥正史行动组。');}
 else if(k==='candle:loan'){Object.assign(x.candle,{holder:'player',authorization:'PERIPHERAL_RESCUE'});log(s,'借用外围物资库的一支36单位有限鬼烛（游戏改编配额）；独立实物，不复制旧救援鬼烛余量或杨间资产。');}
 else if(k==='candle:on'){x.candle.active=true;log(s,'点燃有限鬼烛：覆盖范围取决于当前触发规则，剩余燃料不保证安全。');}
 else if(k==='candle:off'){x.candle.active=false;x.candle.coverage=[];log(s,'主动熄灭鬼烛，原有覆盖立即结束。');}
 else if(k.startsWith('people:')){x.people.find(p=>p.id===k.slice(7)).known=true;log(s,'联系本区域可变求助群体；接应需要庇护容量、物资与核验道路。');}
 else if(k.startsWith('rescue:')){const p=x.people.find(p=>p.id===k.slice(7));const safe=x.manifestations.filter(m=>m.zone===x.zone&&m.state==='ACTIVE').every(m=>['PROTECTED','LIMITED'].includes(protectionFor(s,['VISUAL',...(m.currentStage>=3?['SOUND']:[])],m)))&&(!x.candle.active||x.candle.resource>=7);if(safe){p.state='SAVED';x.shelter.resources-=p.members;for(let i=0;i<p.members;i++)x.shelter.occupants.push(p.id+':'+i);log(s,'接应人员沿已核验道路将登记市民送入临时庇护；保存真实救援成果，玩家仍在原区域。');}else log(s,'现有覆盖不足以接应整个群体；未扣接应物资，没有将人员虚构为已救。');}
 else if(k.startsWith('team:contact:')){const t=x.teams.find(t=>t.id===k.slice(13));if(x.world.chapter>=242&&t.id==='support'){t.communication='LOST';hungryFact(s,'lost-'+t.id,'本次联络失败，当前存活未知','本人通信尝试','CONFIRMED');log(s,'外围支援组无法联系，最后位置保留；不能判定死亡。');}else{t.communication='CONNECTED';t.lastKnown={zone:t.zone,tick:s.tick};hungryFact(s,'contact-'+t.id,'获得一次实际联系；当时仍在行动','本人通信渠道','CONFIRMED');log(s,'取得该组当前联系记录；对方没有交出全部私人资料或行动控制权。');}}
 else if(k.startsWith('team:verify:')){const id=k.slice(12);hungryFact(s,'official-check-'+id,'已提交失联核查请求，尚无可靠位置或存活回复','官方联络请求回执','CONFIRMED');log(s,'请求官方核查最后记录；只取得请求回执，不编造实时位置或死亡结论。');}
 else if(k.startsWith('team:share:')){const to=k.slice(11);x.messages.push({to,facts:x.facts.map(f=>f.id),tick:s.tick,due:s.dachang.timeUnits+8,state:'DELAYED'});log(s,'通过当前通信渠道发送本人已知记录，延迟送达才更新对方共享知识。');}
 else if(k.startsWith('cast:')){used=k.slice(5);s.energy--;const g=s.spirits.find(g=>g.id===used);if(['eye','headless','shadow'].includes(g.sourceId))x.protection='SPIRIT';log(s,'调用一只实际灵异，能量−1并承担该鬼的独立调用复苏；仅形成有限局部对抗，不结束城市级事件。');}
 else if(k==='report'){x.active=false;x.candle.active=false;x.candle.coverage=[];x.outcome={status:'RECORDED',source:'NOT_CONTAINED',saved:x.shelter.occupants.length,tick:s.tick};log(s,'记录第226—249章行动：源头未最终关押。保存人员、物资消耗、知识与逐鬼复苏，不授予最终胜利。');}
 return used;
}
export function advanceHungryWorld(s,worldUnits){const x=s.hungry;if(x.lastTick===s.tick||!hungryReady(s))return;x.lastTick=s.tick;if(x.startUnits===null)x.startUnits=worldUnits;const old=x.world.chapter,n=Math.min(249,226+Math.floor((worldUnits-x.startUnits)/12));x.world.chapter=n;x.world.crisis='MAJOR_EVENT_ACTIVE';
 for(const [at,id] of hungryAnchors)if(n>=at&&!x.world.anchors.includes('CA-19'+String(id).padStart(2,'0'))){const key='CA-19'+String(id).padStart(2,'0');x.world.anchors.push(key);x.world.events.push({id:key,chapter:at,tick:s.tick});}
 if(hungryWindow(old)!==hungryWindow(n))for(const r of x.routes)r.validity='STALE';
 // Bounded local instances; five district summaries do not simulate unseen citizens every frame.
 for(const [at,id,stage,zone,kind] of hungryEntities)if(n>=at&&!x.manifestations.some(m=>m.id===id))x.manifestations.push({id,kind,originSourceId:'H19-SOURCE',currentStage:stage,zone,state:'ACTIVE',knownByActors:[]});
 if(n>=240){x.teams[0].objective='在研究与保护之间继续推进';x.teams[1].objective='独立处理外围接应';x.teams[1].zone='east';}
 if(n>=242){x.teams[1].communication='LOST';x.teams[1].risk='CRITICAL';if(!x.teams[1].outcomes.includes('CONTACT_LOST'))x.teams[1].outcomes.push('CONTACT_LOST');}
 for(const m of x.messages)if(m.state==='DELAYED'&&worldUnits>=m.due){const t=x.teams.find(t=>t.id===m.to);m.state=t.communication==='LOST'?'LOST':'DELIVERED';if(m.state==='DELIVERED')for(const id of m.facts)if(!t.known.includes(id))t.known.push(id);}
}
export function settleHungryAction(s,a,worldUnits){const x=s.hungry;if(!x.active||!a.startsWith('he:')){advanceHungryWorld(s,worldUnits);return;}const k=a.slice(3),visible=/^(entity:|hospital:probe|rescue:)/.test(k),contact=k.startsWith('isolate:'),sound=k.startsWith('rescue:')||k==='hospital:probe';const results=resolveHungryRules(s,{visible,contact,sound});if(results.some(r=>r.result==='EXPOSED'))log(s,'当前局部规律被触发，保护未覆盖全部条件，身体受到损害；重新评估距离、安静行动与撤离道路。');if(x.candle.effectiveness==='EXHAUSTED')log(s,'鬼烛已燃尽，原覆盖结束；区域异常仍存在，已重新判定保护。');if(s.systems.death!=='alive')x.active=false;advanceHungryWorld(s,worldUnits);
}
