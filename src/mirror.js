import {mirrorKnown,mirrorFact,recordImprint,commitMirrorReturn} from './mirror-model.js';
import {regionalBusy} from './regional.js';
import {advancedBusy,ruleBlocked} from './evolution-model.js';
import {activeIds} from './v1.js';
export const mirrorReady=s=>s.dachang.started&&s.regional.world.chapter===183&&!regionalBusy(s)&&!s.reunion.active;
export const mirrorBusy=s=>!!s.ghostMirror?.active;
export const mirrorCrisis=s=>mirrorBusy(s)&&s.ghostMirror.phase==='E';
const log=(s,t)=>{s.ghostMirror.history.push(t);s.ghostMirror.history=s.ghostMirror.history.slice(-100);s.journal.push(t);};
export function mirrorAvailable(s){const x=s.ghostMirror;if(!x||s.systems.death!=='alive'||s.crisis||advancedBusy(s))return [];if(!x.started)return mirrorReady(s)?['gm:start','gm:decline']:[];if(!x.active)return [];
 const out=['gm:wait','gm:withdraw'];
 if(x.phase==='A'){if(!s.dachang.home.confirmed)out.push('gm:home');if(s.dachang.home.confirmed&&!x.home.prepared&&s.v1.cash>=60&&s.bags>0)out.push('gm:prepare');out.push('gm:enter');}
 if(x.phase==='B'){if(x.zone==='entrance')out.push('gm:corridor');if(x.zone==='corridor'&&!mirrorKnown(s,'HOUSE'))out.push('gm:survey');if(mirrorKnown(s,'HOUSE')&&!x.facility.access)out.push('gm:permission');if(x.facility.access&&x.zone==='corridor')out.push('gm:mirror');if(x.zone==='mirror-room'&&!mirrorKnown(s,'FACILITY'))out.push('gm:examine');if(mirrorKnown(s,'FACILITY')&&x.world.chapter>=191)out.push('gm:next');}
 if(x.phase==='C'){if(!mirrorKnown(s,'RECORD'))out.push('gm:record');if(!mirrorKnown(s,'LINK')&&mirrorKnown(s,'RECORD'))out.push('gm:link');if(s.reunion.case.observations.length>=2&&!mirrorKnown(s,'BRIDGE'))out.push('gm:bridge');if(mirrorKnown(s,'LINK')&&x.world.chapter>=195)out.push('gm:next');}
 if(x.phase==='D'){for(const [id,a] of [['DEATH','history'],['RETURN','identity'],['MEMORY','memory'],['PRICE','price']])if(!mirrorKnown(s,id))out.push('gm:'+a);if(mirrorKnown(s,'MEMORY')&&!x.identity.hearsay.length)out.push('gm:tell');if(mirrorKnown(s,'PRICE')){const r=x.releases[0];if(!r.reported)out.push('gm:report-release');if(r.status==='ACTIVE'&&s.bags>0)out.push('gm:isolate');if(r.status==='ISOLATED'&&r.reported)out.push('gm:refer');}if(['DEATH','RETURN','MEMORY','PRICE'].every(id=>mirrorKnown(s,id))&&x.world.chapter>=197)out.push('gm:next');}
 if(x.phase==='E'){if(!mirrorKnown(s,'SHROUD')&&x.world.chapter>=198)out.push('gm:shroud');if(!mirrorKnown(s,'TEETH')&&x.world.chapter>=199)out.push('gm:teeth');if(!mirrorKnown(s,'ROPE')&&x.world.chapter>=201)out.push('gm:rope');if(x.world.chapter>=203)out.push('gm:next');}
 if(x.phase==='F'){if(x.world.chapter>=207&&!mirrorKnown(s,'THEORY'))out.push('gm:theory');if(mirrorKnown(s,'THEORY')&&x.research.state==='PARTIALLY_SUPPORTED')out.push('gm:research');if(!x.report&&mirrorKnown(s,'THEORY'))out.push('gm:report');if(x.report)out.push('gm:finish');}
 for(const tag of Object.keys(x.privacy)){const fact={existence:'FACILITY',location:'HOUSE',function:'RETURN',cost:'PRICE',access:'FACILITY'}[tag];if(mirrorKnown(s,fact)&&!x.privacy[tag].length)out.push('gm:share:'+tag);}
 if(['C','D'].includes(x.phase)&&s.energy>0)for(const id of activeIds(s))if(!ruleBlocked(s,id))out.push('gm:probe:'+id);
 return out;}
export function applyMirror(s,a){const x=s.ghostMirror,k=a.slice(3);let used=null;
 if(k==='start'){x.started=true;x.active=true;x.phase='A';x.zone='road';log(s,'你来到古宅附近。先安排个人住所，再决定是否参与调查；这里不是你的房产。');}
 else if(k==='decline'){x.started=true;x.declined=true;x.outcome='REFUSED';log(s,'你拒绝参与古宅调查。正史继续，你没有取得镜面知识或资产。');}
 else if(k==='withdraw'){x.active=false;x.zone='outside';x.outcome='WITHDRAWN';log(s,'你退出这次调查。已发生的死亡、重构、释放与披露继续保留。');}
 else if(k==='home'){s.dachang.home={confirmed:true,kind:'OWN',level:0};log(s,'确认你原有的普通住处。它没有灵异隔离能力，也不是杨间的古宅。');}
 else if(k==='prepare'){s.v1.cash-=60;s.bags--;x.home={prepared:true,cost:60};log(s,'个人住所建立隔离物资与联络记录，消耗60现金及1隔离袋（游戏改编）。不降低复苏、不提供无敌保护。');}
 else if(k==='enter'){x.phase='B';x.zone='entrance';log(s,'到达古宅入口。封闭房间尚未取得进入许可。');}
 else if(k==='corridor'){x.zone='corridor';log(s,'你进入走廊。厚墙、封门和旧痕迹值得分别调查。');}
 else if(k==='survey'){mirrorFact(s,'HOUSE');log(s,'核验厚墙与限制痕迹；储存、限制、独立空间仍是三项未测试假设。');}
 else if(k==='permission'){x.facility.access=true;x.facility.contacts.push('player');log(s,'取得限定调查许可。所有权和控制权仍属杨间正史实例，许可也不能挡住物理闯入。');}
 else if(k==='mirror'){x.zone='mirror-room';log(s,'进入获准调查的封闭区域。未开放房间没有探索入口。');}
 else if(k==='examine'){mirrorFact(s,'FACILITY');x.facility.hypotheses.restriction='SUPPORTED';log(s,'镜面异常与封闭痕迹相互支持。尚未证明所有记录与返回机制。');}
 else if(k==='next'){x.phase={B:'C',C:'D',D:'E',E:'F'}[x.phase];if(x.phase==='E')x.zone='outside';log(s,({C:'开始核验镜面记录与人物联系。',D:'人物返回不代表历史回滚。现在分别查死亡记录、身份、记忆和释放代价。',E:'转到对抗外围，只观察可验证的保护与干涉；不接管正史对决。',F:'对抗结束，进入信息整理与驾驭理论研究。'})[x.phase]);}
 else if(k==='record'){mirrorFact(s,'RECORD','获准查验既存记录');log(s,'确认张伟的既存有效记录。首次形成时间未知，早于最近事件；查看不会刷新记录或变成存档。');}
 else if(k==='link'){mirrorFact(s,'LINK');log(s,'核验记录与张伟的联系。联系成立不等于可自由进出，镜内阻碍与外部返回条件仍独立存在。');}
 else if(k==='bridge'){mirrorFact(s,'BRIDGE','先前两处观察与本次联系交叉核验');log(s,'旧伴随案件的两处观察与本次镜面证据得到联系；普通镜子仍不是万能探鬼工具。旧调查历史未被改写。');}
 else if(k==='history'){mirrorFact(s,'DEATH','可靠事件记录','CONFIRMED');log(s,'张伟曾死亡：这一事件仍在世界历史中，没有被重构撤销。');}
 else if(k==='identity'){mirrorFact(s,'RETURN','身份记录与既有个人线索交叉核验');log(s,'外貌和既有身份线索相符，支持身份连续性；当前活动的是新重构实例，不是旧身体从未死亡。');}
 else if(k==='memory'){mirrorFact(s,'MEMORY','本人回答与世界事件记录对照');log(s,'人物回答停留在旧记录附近；记录后至重构前的世界事件构成记忆缺口。你的物品、复苏和世界历史均未回滚。');}
 else if(k==='tell'){x.identity.hearsay.push('HEARSAY_AFTER_RETURN');log(s,'你告知返回后的张伟部分事件，记为转述知识，不改写为亲身记忆。');}
 else if(k==='price'){mirrorFact(s,'PRICE','外围异常与重构记录交叉核验');log(s,'发现独立释放事件。返回成功、镜内阻碍与额外释放分别记录；该灵异完整规律仍未知。');}
 else if(k==='report-release'){x.releases[0].reported=true;log(s,'向接线员报告本次已确认的释放异常。已报告不等于关押。');}
 else if(k==='isolate'){s.bags--;x.releases[0].status='ISOLATED';log(s,'消耗1隔离袋布置外围媒介隔离（游戏改编），暂时限制接触，不是关押源头。');}
 else if(k==='refer'){x.releases[0].status='REFERRED';log(s,'将已隔离外围与真实记录移交官方调查。未确认源头关押。');}
 else if(['shroud','teeth','rope'].includes(k)){mirrorFact(s,k.toUpperCase());log(s,({shroud:'当前接触被鬼寿衣挡住，只确认这次保护有效；攻击源没有因此被关押或永久压制。',teeth:'鬼牙在当前对抗条件下干涉边界，不代表能咬破所有鬼域与封印。',rope:'确认鬼绳沿用王岳死亡后的同一正史源头。受控放出仍可能扩大危险，玩家不能召唤它。'})[k]);}
 else if(k==='theory'){mirrorFact(s,'THEORY','207阶段人皮纸理论转述');x.research={state:'PARTIALLY_SUPPORTED',source:'207阶段人皮纸理论转述',intent:'UNKNOWN',evidence:['theory']};log(s,'取得理论线索：部分事实可比对，但来源意图未知。双鬼和防护并不等于完美驾驭。');}
 else if(k==='research'){x.research.state='CANDIDATE_RESEARCH';x.research.evidence.push('cost-boundary');log(s,'建立候选研究：继续通过既有单鬼主导权与长期验证规则。没有获得完美驾驭，没有清空任何复苏。');}
 else if(k==='report'){x.report=true;log(s,'归档本人调查记录，区分已验证、支持与未知。未接触的后台事实不写入人物知识。');}
 else if(k==='finish'){x.active=false;x.phase='DONE';x.zone='outside';x.outcome='INVESTIGATED';log(s,'调查结束。记录、身份、记忆缺口、释放后果与五类披露保留；后续0.18尚未开放。');}
 else if(k.startsWith('share:')){const tag=k.slice(6);x.privacy[tag].push('operator');log(s,'仅向接线员披露“'+({existence:'设施存在',location:'设施位置',function:'已知功能',cost:'已知代价',access:'访问许可'})[tag]+'”，其他类别不自动同步。');}
 else if(k.startsWith('probe:')){used=k.slice(6);s.energy--;log(s,'调用所选厉鬼进行有限感知，消耗1能量并按该鬼公共规则增加复苏；未获得通行、注册或重构权限。');}
 else if(k==='wait')log(s,'保持距离，等候一次实际进展。世界时间与每只鬼的自然复苏正常结算。');
 return used;}
export function advanceMirror(s){const x=s.ghostMirror;if(x.lastTick===s.tick)return;x.lastTick=s.tick;if(x.startUnits===null&&mirrorReady(s))x.startUnits=s.dachang.timeUnits;if(x.startUnits===null)return;
 const chapter=Math.min(207,184+Math.floor((s.dachang.timeUnits-x.startUnits)/12));x.world.chapter=Math.max(x.world.chapter,chapter);
 const anchors=[184,189,191,193,195,195,197,199,200,201,207,207];anchors.forEach((at,n)=>{const id='CA-17'+String(n+1).padStart(2,'0');if(chapter>=at&&!x.world.anchors.includes(id))x.world.anchors.push(id);});
 if(chapter>=191)recordImprint(x,s.tick,'CANON_INDIRECT');
 if(chapter>=193)x.facility.returnConditions.obstruction='RESTRICTED';
 if(chapter>=195)x.facility.returnConditions.external='VERIFIED';
 if(chapter>=194&&x.identity.instances[0].status==='ALIVE'){x.identity.instances[0].status='DEAD';x.identity.activeInstance=null;x.identity.timeline.push({id:'GM-ZW-DEATH',kind:'DIED',tick:s.tick});}
 if(chapter>=195)commitMirrorReturn(x,s.tick);
 if(chapter>=198&&!x.ye.spirits[0].uses){x.ye.spirits[0].uses=1;x.ye.spirits[0].revivalProgress+=4;x.ye.spirits[0].activity='STIMULATED';x.ye.balanceBias+=2;x.ye.effects.push('Protected:contact');}
 if(chapter>=199&&!x.ye.spirits[1].uses){x.ye.spirits[1].uses=1;x.ye.spirits[1].revivalProgress+=4;x.ye.spirits[1].activity='STIMULATED';x.ye.balanceBias+=2;x.ye.effects.push('Interrupted:boundary');}
 if(chapter>=201&&x.rope.custody==='PRIOR_CONTAINED'){x.rope.custody='CANON_RELEASED';x.rope.history.push({tick:s.tick,event:'CONTROLLED_RELEASE',sourceId:x.rope.sourceId});}
 if(chapter>=203&&x.rope.custody==='CANON_RELEASED'){x.rope.custody='RESTRICTED';x.rope.history.push({tick:s.tick,event:'CANON_RESTRICTION',sourceId:x.rope.sourceId});}
 x.ye.ended=chapter>=203;for(const r of x.releases)if(r.status==='ACTIVE'&&chapter>=197)r.location='road-perimeter';
 if(s.crisis||s.systems.death!=='alive'){x.active=false;if(x.started&&!x.outcome)x.outcome='WITHDRAWN';}
}
