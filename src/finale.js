import {hungryEdges} from './hungry-model.js';
import {finaleAnchors,finaleFact,finaleKnown} from './finale-model.js';
import {exceptionalReversion,commitContainment} from './finale-causality.js';
import {activeIds} from './v1.js';
import {advancedBusy,ruleBlocked} from './evolution-model.js';
export const finaleReady=s=>!!s.finale&&s.hungry.world.chapter===249&&!s.hungry.active&&!!s.hungry.outcome&&s.dachang.started;
export const finaleBusy=s=>finaleReady(s)&&s.finale.started;
const log=(s,t)=>{s.finale.history.push(t);s.finale.history=s.finale.history.slice(-100);s.journal.push(t);};
const contribute=(s,id,text)=>{if(!s.finale.contributions.some(c=>c.id===id))s.finale.contributions.push({id,text,tick:s.tick});};
export function finaleAvailable(s){const x=s.finale;if(!finaleReady(s)||s.crisis||s.systems.death!=='alive'||advancedBusy(s))return [];
 if(!x.started)return ['ff:start','ff:decline'];
 const a=['ff:wait'];if(!finaleKnown(s,'consequences'))a.push('ff:consequences');if(!finaleKnown(s,'current-news')||x.facts.find(f=>f.id==='current-news')?.sourceState!==x.source.state)a.push('ff:news');
 if(!x.active){if(x.chapter<276)a.push('ff:resume');return a;}
 if(x.source.state!=='CONTAINED'){a.push('ff:pause');if(x.chapter>=254&&!x.strategy.received)a.push('ff:strategy');if(x.strategy.received){a.push('ff:contact');if(x.strategy.role==='NONE')a.push('ff:role','ff:refuse');if(x.strategy.communication==='CONNECTED'&&x.strategy.shared.length===0&&(x.facts.length+s.hungry.facts.length)>0)a.push('ff:share');if(x.strategy.role==='PERIPHERY'&&x.strategy.communication==='CONNECTED')a.push('ff:check');}
 if(x.chapter>=265&&!finaleKnown(s,'yang-return'))a.push('ff:yang');if(x.chapter>=269&&!finaleKnown(s,'school-revisit'))a.push('ff:school');if(x.chapter>=270&&finaleKnown(s,'school-revisit')&&!finaleKnown(s,'zhao-link'))a.push('ff:zhao');if(x.chapter>=271&&!finaleKnown(s,'nail'))a.push('ff:artifact');
 if(x.transactions.length&&!finaleKnown(s,'time-anomaly'))a.push('ff:time-report');
 if(x.current.attemptState==='REVISED'&&!finaleKnown(s,'revised-plan'))a.push('ff:revised');
 if(x.strategy.role==='PERIPHERY'&&x.strategy.checkedAt!==null&&s.tick-x.strategy.checkedAt<=6&&!x.contributions.some(c=>c.id==='perimeter'))a.push('ff:perimeter');
 if(s.energy>0&&x.contributions.length<24)for(const id of activeIds(s).filter(id=>!ruleBlocked(s,id)))a.push('ff:cast:'+id);
 }else{for(const z of [x.zone,...hungryEdges[x.zone]]){a.push('ff:route:'+z);if(x.recovery.zones[z].checkedAt!==null&&s.tick-x.recovery.zones[z].checkedAt<=4)a.push('ff:move:'+z);}
 if(!finaleKnown(s,'missing-request'))a.push('ff:missing');if(!finaleKnown(s,'survivors'))a.push('ff:survivors');if(x.chapter>=275&&!finaleKnown(s,'custody'))a.push('ff:custody');if(x.chapter>=276&&!finaleKnown(s,'zhao-followup'))a.push('ff:followup');if(x.chapter===276&&!finaleKnown(s,'settlement'))a.push('ff:finish');}
 return a;
}
export function applyFinale(s,a){const x=s.finale,k=a.slice(3);let used=null;
 if(k==='start'||k==='decline'){x.started=true;x.active=k==='start';x.declined=k==='decline';x.startRevival=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress]));s.hungry.candle.active=false;s.hungry.candle.coverage=[];log(s,k==='start'?'进入城市终局。先核对损失，再选择外围职责；杨间的核心行动不由你接管。':'不承担高危任务。世界继续推进，你仍可读取实际通报；不会凭空获得核心现场知识。');}
 else if(k==='resume'){x.active=true;log(s,'继续当前终局与恢复行动，不传送到核心现场。');}
 else if(k==='pause'){x.active=false;log(s,'暂停外围职责，仍在当前区域。正史与自然复苏继续。');}
 else if(k==='wait')log(s,'安静等候一次进展：时间与每只鬼的自然复苏继续结算。');
 else if(k==='consequences'){finaleFact(s,'consequences','历史救援和损失仍有效；失联人员存活未知，不能按环境变化推断','获准外围应急记录');log(s,'核对先前记录。未获得全城死亡总数；资源没有补满。');}
 else if(k==='news'){const text=x.source.state==='CONTAINED'?'官方确认核心源头已关押，未被消灭；城市正在恢复，事件仍在善后处理。':'官方仍在应对城市危机；核心源头尚未最终关押。';const old=x.facts.find(f=>f.id==='current-news');if(old){old.text=text;old.tick=s.tick;old.chapter=x.chapter;old.sourceState=x.source.state;}else{finaleFact(s,'current-news',text,'官方通报');x.facts.at(-1).chapter=x.chapter;x.facts.at(-1).sourceState=x.source.state;}log(s,text);}
 else if(k==='strategy'){x.strategy.received=true;finaleFact(s,'strategy','研究组需要实际证据、外围通道和通信支持；核心行动由独立人物执行','获准行动摘要');log(s,'收到有限战略摘要。请选择是否承担外围职责，不获得研究组全部私人知识。');}
 else if(k==='role'){x.strategy.role='PERIPHERY';log(s,'承担外围观察与通道核查，不取得源头或资产控制权限。');}
 else if(k==='refuse'){x.strategy.role='REFUSED';log(s,'拒绝外围职责，不阻止杨间独立行动。');}
 else if(k==='contact'){x.strategy.communication='CONNECTED';x.strategy.checkedAt=s.tick;finaleFact(s,'contact','本次通信窗口接通','实际通信');log(s,'实际接通一次通信；后续行动前仍需复核时效。');}
 else if(k==='share'){x.strategy.shared=[...new Set([...s.hungry.facts,...x.facts].map(f=>f.id))];contribute(s,'evidence-share','通过本次接通渠道提交本人已知证据及其可信等级');log(s,'已提交本人实际掌握的记录，不读取对方私人证据。');}
 else if(k==='check'){x.strategy.checkedAt=s.tick;finaleFact(s,'perimeter-check','已核查本次外围观察点、通信与撤离方向，未保证后续一直有效','本人外围核查');log(s,'本次外围行动条件已复核；最多保持6个行动窗口，环境改变会失效。');}
 else if(k==='perimeter'){contribute(s,'perimeter','在有效通信与撤离核查窗口内完成外围观察');log(s,'外围观察已完成。它不是源头关押，也不授予杨间资产。');}
 else if(k==='yang'){finaleFact(s,'yang-return','杨间重新返回行动；研究摘要提示其存在结构发生特殊变化，完整机制仍未知','获准正史行动摘要','SUPPORTED');log(s,'记录杨间返回与结构变化摘要，不复制给玩家，不把鬼镜当普通复活。');}
 else if(k==='school'){finaleFact(s,'school-revisit','再次核对七中外围，与早期地点相同；旧路线仅为历史参考，当前连接重新确认','本人外围观察');contribute(s,'school-record','对照早期七中记录，保存当前外围观察');log(s,'对照七中同一地点的原记录。敲门鬼与饿死鬼不是同一源头，旧地图未被覆盖。');}
 else if(k==='zhao'){finaleFact(s,'zhao-link','获准材料支持赵开明与另一灵异存在特殊联系，私人目的及完整规律尚未证实','行动材料与七中观察','SUPPORTED');x.zhao.exposure.push('zhao-link');log(s,'人物赵开明与关联灵异分别登记；不按身份直接判断其全部目的。');}
 else if(k==='artifact'){finaleFact(s,'nail','核心行动使用唯一棺材钉，是特定关押规则资产，不是通用攻击装备','获准核心行动摘要');log(s,'核对唯一资产用途；所有者仍未确认，实际使用者为杨间，不放入你的背包。');}
 else if(k==='time-report'){finaleFact(s,'time-anomaly',x.awareness.player.length?'本人外围观察出现局部位置重复，结合研究回报支持源头特殊时间干涉':'研究回报称首次行动遭遇局部时间干涉；本人未亲历重置前完整经过','获准研究组事后通信',x.awareness.player.length?'CONFIRMED':'SUPPORTED');log(s,'取得时间异常证据：保留有效旧证据，新增尚未掌握的干涉条件；不是普通读档。');}
 else if(k==='revised'){finaleFact(s,'revised-plan','研究组修订接触顺序与行动窗口，处理已发现时间干涉，仍须资产适用和稳定限制','获准修订方案');log(s,'收到修订方案；没有五秒操作题，也不默认任意高级能力无效。');}
 else if(k.startsWith('cast:')){used=k.slice(5);s.energy--;contribute(s,'cast-'+s.tick,'实际调用'+s.spirits.find(g=>g.id===used).name+'形成外围规则对抗');x.current.localThreat='LIMITED';log(s,'消耗能量1并承担对应鬼的调用复苏，作用于当前外围威胁。核心权柄对抗须进入独立IF规则；本版不冒充已实现IF。');}
 else if(k.startsWith('route:')){const z=k.slice(6);x.recovery.zones[z].transport='LOCALLY_VERIFIED';x.recovery.zones[z].checkedAt=s.tick;finaleFact(s,'route-'+z,'已在本次恢复阶段核验该区局部通道，其他道路未知','本人现场核查');contribute(s,'route-'+z,'核验恢复期局部道路');log(s,'该区局部通道核验通过，4行动内有效；不是全城交通恢复或快速旅行。');}
 else if(k.startsWith('move:')){x.zone=k.slice(5);log(s,'沿本次刚核验的局部通道移动。其余区域未自动恢复。');}
 else if(k==='missing'){finaleFact(s,'missing-request','已提交失联人员后续核查请求，尚无可靠存活回复','官方受理回执');log(s,'核查请求已受理。失联记录继续保留，不凭关押成功复活或宣判死亡。');}
 else if(k==='survivors'){finaleFact(s,'survivors','已核对本人既有救援联系人；真实救助和后续关系保留','本人救援历史');contribute(s,'survivor-followup','核对危机前后本人救援成果与联系人');log(s,'保留已救人物的个人历史；不重新生成救援奖励。');}
 else if(k==='custody'){finaleFact(s,'custody','支援方完成源头关押资产接收；接收不等于玩家获得所有权','正式接收回执');log(s,'取得正式接收回执。源头实体和唯一资产仍有各自流转记录。');}
 else if(k==='followup'){finaleFact(s,'zhao-followup','赵开明与诅咒关联仍有独立待查事项；饿死鬼关押不能当作这些问题全部消失','获准后续调查任务','SUPPORTED');log(s,'记录独立后续问题，不解锁0.21内容。');}
 else if(k==='finish'){finaleFact(s,'settlement','本次城市终局进入善后，个人贡献按实际历史归档','本人行动结算');log(s,'已归档终局；源头已关押但未消灭，城市继续恢复，独立灵异与失联调查仍在。');}
 return used;
}
export function advanceFinale(s,units){let x=s.finale;if(!finaleReady(s)||x.lastTick===s.tick)return;x.lastTick=s.tick;if(x.startUnits===null){x.startUnits=units;x.zone=s.hungry.zone;x.recovery.missing=s.hungry.teams.filter(t=>t.communication==='LOST').map(t=>({id:t.id,state:'LOST_CONTACT',lastKnown:t.lastKnown}));x.recovery.consequences=['先前已发生的损失和设施损坏不自动恢复','先前已消耗的资源不恢复'];}
 const n=Math.min(276,250+Math.floor((units-x.startUnits)/12));x.chapter=n;
 if(x.strategy.checkedAt!==null&&s.tick-x.strategy.checkedAt>6)x.strategy.communication='STALE';
 for(const [at,id]of finaleAnchors){if(n<at||x.anchors.includes(id))continue;if(id==='CA-2011'&&(units-x.startUnits)<268||id==='CA-2012'&&(units-x.startUnits)<272)continue;
 x.anchors.push(id);x.causal.push({id,chapter:at,tick:s.tick,kind:'CANON_ANCHOR'});
 if(id==='CA-2005')x.yang.transformation={id:'H20-YANG-STRUCTURE',facilityId:s.ghostMirror.facility.id,subject:'CANON-YANG',affectedSpirit:'CANON-HEADLESS',prior:'PRE_TRANSFORMATION',result:'SPECIAL_EXISTENCE',effects:['存在支撑结构改变'],unknown:['完整主导关系与代价'],tick:s.tick};
 if(id==='CA-2009'){Object.assign(x.artifact,{holder:'CANON-YANG',authorizedUser:'CANON-YANG',valid:true});x.artifact.transfers.push({id:'H20-NAIL-ACCESS',from:null,to:'CANON-YANG',tick:s.tick});}
 if(id==='CA-2010'){x.current={sourcePosition:'CONTACT_POINT',attemptState:'FAILED',localThreat:'LIMITED'};const result=exceptionalReversion(s,{id:'H20-TEMPORAL-01',sourceId:'H19-SOURCE',scope:'SCHOOL_CONTACT',referenceId:'H20-FIRST-CONTACT',fields:['sourcePosition','attemptState','localThreat']});s.finale=result.finale;x=s.finale;}
 if(id==='CA-2011'){x.awareness.wang.push('H20-TEMPORAL-01');x.source.state='RESTRICTED';x.source.restriction='TEMPORARY';x.current.attemptState='REVISED';x.current.sourcePosition='CONTACT_POINT';}
 if(id==='CA-2012'){s.finale=commitContainment(s).finale;x=s.finale;}
 if(id==='CA-2014'){x.custody.holder='OFFICIAL-RECEIPT';x.custody.custodian='OFFICIAL-RECEIPT';x.custody.transfers.push({id:'H20-RECEIPT',from:'CANON-YANG',to:'OFFICIAL-RECEIPT',tick:s.tick});}
 }
 // Expired roads remain a recorded observation, not a permanent travel unlock.
 for(const z of Object.values(x.recovery.zones))if(z.checkedAt!==null&&s.tick-z.checkedAt>4)z.transport='UNKNOWN';
}
