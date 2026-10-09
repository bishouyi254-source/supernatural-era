// V2.0 vertical slice. ORIGINAL content; never a claim about novel rules.
import {makeSpirit,relationship} from './progression.js';
import {hostState} from './spirits.js';
import {activeIds} from './v1.js';
import {ruleBlocked} from './evolution-model.js';
export const eventBlueprint={id:'watch',rank:'C',origin:'ORIGINAL',source:'异常磁带',medium:'广播接线',zones:['hall','office'],rule:{id:'named-response',triggerConditions:['听见广播叫到本人的姓名','本人作出回应'],targetSelector:'NAMED_RESPONDER',effect:'DELAYED_MARK',restrictionConditions:['接线隔离停止后续加深','黄金容器关押源头']}};
export const hypotheses={sound:'听到广播就会被标记',room:'进入值班室就会被标记',response:'被叫到姓名并回应，才会被标记'};
const facts={
 record:['录像记录','记录中，进入值班室但保持沉默的人没有出现颈部黑痕。','录像','office'],
 testimony:['证词','陈宁说：“昨晚只要听见广播就会死。”这是其说法，尚未证实。','陈宁','hall'],
 mark:['现场观察','广播叫到陆安后，陆安回应；随后其颈部出现黑痕。','直接观察','hall'],
 control:['对照观察','同处广播范围的沉默者没有新黑痕；陆安回应后出现黑痕。','同窗口对照','hall'],
 medium:['媒介检查','隔离广播接线后声音停止；接线盒内的异常磁带仍然存在。','接线与对象对照','office']
};
const statuses=['UNTESTED','WEAK','SUPPORTED','STRONGLY_SUPPORTED','CONFIRMED','DISPROVEN'];
export function newInvestigation(){return {format:1,eventSeed:null,started:false,active:false,elapsed:0,zone:'hall',medium:'ACTIVE',source:'HIDDEN',broadcast:false,heard:false,playerMark:null,escalation:'DORMANT',resolution:null,evidence:[],hypotheses:{},contradictions:[],search:{hall:'UNSEARCHED',office:'UNSEARCHED'},npcKnowledge:{lu:'ALIVE',chen:'ALIVE',lin:'ALIVE',wu:'ALIVE'},npcs:[{id:'lu',name:'陆安',state:'ALIVE',mark:null},{id:'chen',name:'陈宁',state:'ALIVE',mark:null},{id:'lin',name:'林岚',state:'ALIVE',mark:null},{id:'wu',name:'吴叔',state:'ALIVE',mark:null}],evacuated:false,protected:false,pairTest:false,records:[],startRevival:{}};}
export function attachInvestigation(s){return s.investigation?s:{...s,investigation:newInvestigation()};}
const evidence=(s,id)=>{const x=s.investigation;if(x.evidence.some(e=>e.id===id))return;const [title,fact,source,location]=facts[id];x.evidence.push({id,title,fact,source,location,timestamp:s.tick,reliability:id==='testimony'?'UNVERIFIED':'CONFIRMED'});s.journal.push('调查记录：'+fact);reconcile(x);};
export function syncInvestigationKnowledge(s){const x=s.investigation,ids=x.evidence.map(e=>e.id);if(!ids.length)return;const clues=[...(ids.includes('record')?['movement']:[]),...(ids.includes('mark')&&ids.includes('control')?['witness']:[]),...(ids.includes('medium')?['power']:[])];const k=s.knowledge.watch||{clues:[],hypotheses:{}};k.clues=[...new Set([...k.clues,...clues])];if(x.hypotheses.response?.status==='CONFIRMED')k.hypotheses.true='confirmed';s.knowledge.watch=k;}
function reconcile(x){const ids=x.evidence.map(e=>e.id);for(const key of Object.keys(x.hypotheses)){const h=x.hypotheses[key];h.supportingEvidence=[];h.contradictoryEvidence=[];if(key==='sound'){if(ids.includes('testimony'))h.supportingEvidence=['testimony'];if(ids.includes('control'))h.contradictoryEvidence=['control'];}if(key==='room'&&ids.includes('record'))h.contradictoryEvidence=['record'];if(key==='response')h.supportingEvidence=['record','mark','control','medium'].filter(id=>ids.includes(id));h.status=h.contradictoryEvidence.length?'DISPROVEN':h.supportingEvidence.length>=4?'CONFIRMED':h.supportingEvidence.length===3?'STRONGLY_SUPPORTED':h.supportingEvidence.length===2?'SUPPORTED':h.supportingEvidence.length?'WEAK':'UNTESTED';}x.contradictions=[...(ids.includes('control')?['仅听到声音并不必然产生黑痕。']:[]),...(ids.includes('record')?['进入房间并不必然产生黑痕。']:[])];}
function captureAllowed(s){const x=s.investigation;if(x.source!=='CONTAINED'||s.spirits.some(g=>g.sourceId==='watch')||s.spirits.length>=2||s.bags<1||hostState(s).effectiveBurden+28>hostState(s).hostCapacity||hostState(s).balanceBias>=30)return false;if(!s.spirits.length)return true;return x.pairTest&&s.systems.items.barrier>0&&relationship(s.spirits[0],makeSpirit('watch')).compatibility>=.5;}
export function investigationAvailable(s){const x=s.investigation||newInvestigation();if(s.systems.death!=='alive'||s.crisis)return [];if(!x.active){return s.scene==='hub'&&!s.combat&&!s.bus.active&&!s.city.active&&!s.journey.active&&!s.systems.second&&(!x.resolution||x.resolution==='Escaped')?['inv:enter']:[];}
 const out=['inv:wait','inv:leave'];if(x.source!=='CONTAINED'){
 out.push('inv:move:'+ (x.zone==='hall'?'office':'hall'));
 if(['UNSEARCHED','CHANGED'].includes(x.search[x.zone]))out.push('inv:search');
 if(x.zone==='hall'&&!x.evidence.some(e=>e.id==='testimony'))out.push('inv:question');
 if(x.broadcast&&x.medium==='ACTIVE'&&x.npcs[0].state!=='ALIVE'&&!x.evidence.some(e=>e.id==='control'))out.push('inv:compare');
 if(x.broadcast&&x.medium==='ACTIVE')out.push('inv:respond');
 if(x.zone==='office'&&x.medium==='ACTIVE')out.push('inv:cut');
 if(x.zone==='office'&&x.medium==='INACTIVE'&&x.source==='LOCATED'&&s.bags>0)out.push('inv:contain');
 if(!x.evacuated)out.push('inv:evacuate');
 if(x.npcs[0].state==='MARKED'&&!x.protected&&s.systems.items.barrier>0)out.push('inv:protect');
 if(s.energy>0)out.push(...s.spirits.filter(g=>activeIds(s).includes(g.id)&&!ruleBlocked(s,g.id)).map(g=>'inv:probe:'+g.id));
 }
 for(const key of Object.keys(hypotheses))if(!x.hypotheses[key])out.push('inv:hypothesis:'+key);
 if(x.source==='CONTAINED'){
 out.push('inv:seal');if(s.spirits.length===1&&!x.pairTest)out.push('inv:pair');if(captureAllowed(s))out.push('inv:capture');
 }
 return out;
}
function finish(s,result){const x=s.investigation;x.active=false;x.resolution=result;s.scene='hub';x.records.push({tick:s.tick,result,survivors:x.npcs.filter(n=>n.state!=='DEAD_COMMITTED').map(n=>n.id),revivalDelta:Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress-(x.startRevival[g.id]??g.revivalProgress)])),evidenceCount:x.evidence.length});x.records=x.records.slice(-50);s.journal.push('调查结算：'+({Escaped:'已撤离',Contained:'已关押',Resolved:'玩家实例已处理',PartiallyContained:'局部限制'}[result])+'。证据、伤亡和残余保留；并非源头必然消失。');}
export function applyInvestigation(s,a){const x=s.investigation;let used=null;
 if(a==='inv:enter'){x.started=true;x.active=true;x.resolution=null;x.eventSeed=s.seed;s.scene='hub';if(x.elapsed===0)x.escalation='EMERGING';x.startRevival=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress]));s.journal.push('原创调查：废弃值班室。广播设备仍通电，走廊有四名滞留人员。');}
 else if(a.startsWith('inv:move:')){x.zone=a.slice(9);s.journal.push('未撤离的调查队伍跟随转移，观察位置更新。');if(x.zone==='hall'&&x.npcs[0].state!=='ALIVE'&&!x.evidence.some(e=>e.id==='mark'))s.journal.push('陆安身上已有黑痕；你错过了其形成的直接观察，不能补造过去的证据。');}
 else if(a==='inv:search'){x.search[x.zone]='SEARCHED';if(x.zone==='office'){evidence(s,'record');x.source='LOCATED';s.journal.push('找到接线盒后面的异常磁带；这不等于确认完整规律。');}else s.journal.push('走廊搜索没有新发现；这次有效搜索消耗了一个行动窗口。');}
 else if(a==='inv:question')evidence(s,'testimony');
 else if(a==='inv:compare'){if(x.npcs[0].state!=='ALIVE')evidence(s,'control');else s.journal.push('广播已经出现，但当前尚没有足够对象变化可供对照。');}
 else if(a.startsWith('inv:hypothesis:')){const key=a.slice(15);x.hypotheses[key]={status:'UNTESTED',supportingEvidence:[],contradictoryEvidence:[]};reconcile(x);}
 else if(a==='inv:respond'){x.heard=true;x.playerMark??={remaining:3};s.journal.push('你回应了广播中的姓名，颈部出现黑痕。回应立即触发，后果延迟结算。');}
 else if(a==='inv:cut'){x.medium='INACTIVE';x.search.office='CHANGED';evidence(s,'medium');s.journal.push('接线被隔离；源头没有死亡。已经发生的标记不会删除。');}
 else if(a==='inv:contain'){s.bags--;x.source='CONTAINED';x.escalation='CONTAINED';s.journal.push('黄金隔离袋关押异常磁带，媒介与源头被限制。');}
 else if(a==='inv:evacuate'){x.evacuated=true;s.journal.push('愿意跟随的沉默者沿现实出口撤离；已标记者的危险仍需处理。');}
 else if(a==='inv:protect'){s.systems.items.barrier--;x.protected=true;s.journal.push('符膜暂时阻断陆安的标记后果；已产生的黑痕仍留作记录。');}
 else if(a.startsWith('inv:probe:')){used=a.slice(10);s.energy--;s.journal.push('灵异感知确认异常来自接线盒附近；不能凭感知直接读取触发答案。');x.source='LOCATED';}
 else if(a==='inv:pair'){x.pairTest=true;s.journal.push('对照现有灵异与封存磁带媒介，完成相容评估。低相容或承载不足方案不会开放植入。');}
 else if(a==='inv:seal'){s.outcomes.watch='已封存';s.restricted.watch=true;if(!s.systems.sealed.includes('watch'))s.systems.sealed.push('watch');finish(s,'Contained');}
 else if(a==='inv:capture'){const g=makeSpirit('watch');if(s.spirits.length){s.systems.items.barrier--;s.relations.push(relationship(s.spirits[0],g));}s.bags--;s.spirits.push(g);s.outcomes.watch='已驾驭';s.restricted.watch=true;finish(s,'Resolved');}
 else if(a==='inv:leave')finish(s,x.source==='CONTAINED'?'PartiallyContained':'Escaped');
 return used;
}
// One world advancement per accepted engine action, including actions after departure.
export function advanceInvestigation(s,action){const x=s.investigation;if(!x.started||x.source==='CONTAINED')return;x.elapsed++;
 if(x.elapsed>=2&&!x.broadcast&&x.medium==='ACTIVE'){x.broadcast=true;x.heard=x.active;s.journal.push('广播中响起现场人员的姓名。听到声音本身没有立即造成伤害。');}
 const lu=x.npcs[0];if(x.elapsed===4&&lu.state==='ALIVE'&&!x.evacuated&&x.medium==='ACTIVE'){lu.state='MARKED';lu.mark={remaining:4};if(x.active){evidence(s,'mark');x.search[x.zone]='CHANGED';}}
 for(const n of x.npcs)if(n.state==='MARKED'&&x.medium==='ACTIVE'&&!(n.id==='lu'&&x.protected)){n.mark.remaining=Math.max(0,n.mark.remaining-1);if(!n.mark.remaining){n.state='DEAD_COMMITTED';if(x.active)s.journal.push(n.name+'的标记后果已经提交；普通重启不会使其复活。');}}
 if(x.playerMark&&x.playerMark.remaining>0&&x.medium==='ACTIVE'&&action!=='inv:respond'){x.playerMark.remaining=Math.max(0,x.playerMark.remaining-1);if(!x.playerMark.remaining){s.life=0;s.systems.death='pending';x.active=false;s.journal.push('延迟规律导致致死，进入已有反应窗口；事件事实和伤亡不回滚。');}}
 if(x.active)for(const n of x.npcs)x.npcKnowledge[n.id]=n.state;
 x.escalation=x.medium==='INACTIVE'?'RESIDUAL':x.npcs.some(n=>n.state==='DEAD_COMMITTED')?'CRITICAL':x.elapsed>=4?'ACTIVE':'EMERGING';
}
export function validInvestigation(s){try{const x=s.investigation;if(x===undefined)return true;const integer=(n,max=1e9)=>Number.isInteger(n)&&n>=0&&n<=max,mark=m=>m===null||m&&integer(m.remaining,4);if(!x||x.eventSeed!==null&&x.eventSeed!==s.seed||x.started&&x.eventSeed!==s.seed||x.format!==1||!['hall','office'].includes(x.zone)||!['ACTIVE','INACTIVE'].includes(x.medium)||!['HIDDEN','LOCATED','CONTAINED'].includes(x.source)||!integer(x.elapsed)||!['DORMANT','EMERGING','ACTIVE','CRITICAL','CONTAINED','RESIDUAL'].includes(x.escalation)||![null,'Escaped','Contained','Resolved','PartiallyContained'].includes(x.resolution))return false;
 if(x.source==='CONTAINED'&&x.medium!=='INACTIVE')return false;
 if(['started','active','broadcast','heard','evacuated','protected','pairTest'].some(k=>typeof x[k]!=='boolean')||x.active&&(!x.started||x.resolution!==null)||!mark(x.playerMark))return false;
 if(!x.search||Object.keys(x.search).length!==2||['hall','office'].some(k=>!['UNSEARCHED','SEARCHED','CHANGED'].includes(x.search[k])))return false;
 if(!x.npcKnowledge||Object.keys(x.npcKnowledge).length!==4||['lu','chen','lin','wu'].some(id=>!['ALIVE','MARKED','DEAD_COMMITTED'].includes(x.npcKnowledge[id])))return false;
 if(!Array.isArray(x.npcs)||x.npcs.length!==4||x.npcs.some((n,i)=>n.id!==['lu','chen','lin','wu'][i]||n.name!==['陆安','陈宁','林岚','吴叔'][i]||!['ALIVE','MARKED','DEAD_COMMITTED'].includes(n.state)||!mark(n.mark)||n.state==='MARKED'&&!n.mark))return false;
 if(!Array.isArray(x.evidence)||x.evidence.length>5||new Set(x.evidence.map(e=>e.id)).size!==x.evidence.length||x.evidence.some(e=>!facts[e.id]||e.title!==facts[e.id][0]||e.fact!==facts[e.id][1]||e.source!==facts[e.id][2]||e.location!==facts[e.id][3]||!integer(e.timestamp,s.tick)||e.reliability!==(e.id==='testimony'?'UNVERIFIED':'CONFIRMED')))return false;
 if(!x.hypotheses||Array.isArray(x.hypotheses)||Object.entries(x.hypotheses).some(([k,h])=>!hypotheses[k]||!h||!statuses.includes(h.status)||!['supportingEvidence','contradictoryEvidence'].every(field=>Array.isArray(h[field])&&h[field].every(id=>x.evidence.some(e=>e.id===id)))))return false;
 const derived=structuredClone(x);reconcile(derived);if(JSON.stringify(derived.hypotheses)!==JSON.stringify(x.hypotheses)||JSON.stringify(derived.contradictions)!==JSON.stringify(x.contradictions))return false;
 return Array.isArray(x.records)&&x.records.length<=50&&x.records.every(r=>integer(r.tick,s.tick)&&['Escaped','Contained','Resolved','PartiallyContained'].includes(r.result)&&Array.isArray(r.survivors)&&r.survivors.every(id=>x.npcs.some(n=>n.id===id))&&integer(r.evidenceCount,5)&&r.revivalDelta&&Object.values(r.revivalDelta).every(n=>Number.isFinite(n)&&n>=0&&n<=100))&&x.startRevival&&typeof x.startRevival==='object'&&!Array.isArray(x.startRevival)&&Object.values(x.startRevival).every(n=>Number.isFinite(n)&&n>=0&&n<=100);
 }catch{return false;}}
