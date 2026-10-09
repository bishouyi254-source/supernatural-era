export const mallZones={entry:'1F · 大门与中庭',clothing:'2F · 服装区',storage:'3F · 封闭仓储',staff:'4F · 员工通道',monitor:'5F · 监控室'};
export const mallNodes=['歇业的商场','假模特','上门','车技','成长之中','摆脱','印记','目标更改','运作的电梯','再次出现的尸臭','严力','消失的尸体','诡异的商场','江艳','真实的身份','行动','监控室','商场真相','换头','所有失踪的人','躺下','羞耻的逃离','滑出商场','请开始你的表演','源头','第一次合作','涌入','隐藏当中的鬼','抓捕','成功关押','合作愉快','离开'];
export const mallFacts={
 M01:['多人失踪，离场记录不能解释去向。','现场登记','EVENT'],
 M02:['假模特的位置与上次记录不同。','前后照片','VESSEL'],
 M03:['仓库存在尸臭，原记录中的尸体不在原处。','仓库检查','VESSEL'],
 M04:['电梯未收到呼叫却自行运行；普通楼层指示不可靠。','现场观察','ZONE'],
 M05:['严力愿意交换有限现场情报，但不接受无条件冒险。','当面交流','EVENT'],
 M06:['江艳提供失踪前记录，并说明服装区最先出现异常。','幸存者证词','EVENT'],
 M07:['管理方称17:31之后无人进入；监控中却仍有进入者。','管理方证词与录像冲突','EVENT'],
 M08:['时间线：17:12正常；17:31进入服装区；17:38未见离场；17:42轮廓变化。','三段录像交叉对照','EVENT'],
 M09:['多具躯体先后异常，接触者外观正常不等于真实身份正常。','人员与躯体登记','DERIVATIVE'],
 M10:['躺下后衍生体暂时停止接近，仅验证了这一类目标。','受控行为对照','DERIVATIVE'],
 M11:['另一具躯体仍接近躺下者；前一条安全条件不能覆盖所有目标。','反例观察','UNKNOWN'],
 M12:['服装区起始记录、失踪分布、躯体变化与时间线共同支持源头转移假设。','多来源重建','SOURCE'],
 M13:['限制当前躯体后，异常转移至另一具躯体；原躯体不是整个源头。','限制后的连续观察','VESSEL'],
 M14:['连续显现、切断转移路径和排除候选后，当前源头载体得到确认。','联合窗口观察','SOURCE']
};
export const mallHas=(x,id)=>x.evidence.includes(id);
export const mallKnowledge=x=>mallHas(x,'M14')?'CONFIRMED':mallHas(x,'M12')?'SUPPORTED':mallHas(x,'M02')?'SUSPECTED':'UNKNOWN';
export function newMall(){return {format:1,started:false,active:false,zone:'entry',phase:'INVESTIGATION',status:'UNREVEALED',startUnits:null,lastUnits:0,canonNodes:[],anchors:[],canonContained:false,canonResolved:false,observedFinal:false,evidence:[],searched:[],cameras:[],timeline:false,elevator:'NORMAL',elevatorTrips:0,elevatorRides:0,containerStock:1,vessel:'mannequin',vesselHistory:[],restrictedVessels:[],exposed:false,isolated:false,suppressed:false,containerStarted:false,sealed:false,secured:false,negotiated:false,handedOff:false,plan:{role:null,retreat:null,assets:null,ready:false},npc:{yanMet:false,yanUses:0,yanWithdrawn:false,relations:[],jiangMet:false,managerMet:false},victims:{a:'MISSING',b:'MISSING',c:'UNKNOWN'},knownVictims:{},rescued:[],candidates:[],excluded:[],ruleTested:false,counterexample:false,crisisWindows:0,windowAtBegin:0,normalActions:0,contribution:[],costs:{bags:0,cash:0,uses:0},startRevival:{},records:[],reward:0,reported:false,notes:[],journal:[]};}
export function attachMall(s){return {...s,mall:s.mall?{...s.mall,containerStock:s.mall.containerStock??1,elevatorRides:s.mall.elevatorRides??0}: {...newMall(),containerStock:1,elevatorRides:0}};}
export function mallRecord(x,key){if(!x.contribution.includes(key))x.contribution.push(key);}
export function mallFact(x,id){if(!x.evidence.includes(id))x.evidence.push(id);}
export const mallTime=s=>s.dachang?.timeUnits??(s.dachang?.elapsed??0)*4;
export function validMall(s){if(s.mall===undefined)return true;try{const x=s.mall,rec=v=>v&&typeof v==='object'&&!Array.isArray(v),int=(v,max=1e9)=>Number.isInteger(v)&&v>=0&&v<=max,str=(v,max=1000)=>typeof v==='string'&&v.length<=max,arr=(v,max,fn)=>Array.isArray(v)&&v.length<=max&&v.every(fn),uniq=(v,max,fn)=>arr(v,max,fn)&&new Set(v).size===v.length;
 if(!rec(x)||x.format!==1||!Object.hasOwn(mallZones,x.zone)||!['INVESTIGATION','PLANNING','CRISIS','POST_NEGOTIATION','RESOLUTION'].includes(x.phase)||!['UNREVEALED','SOURCE_ACTIVE','INVESTIGATION_PAUSED','SOURCE_CONTAINED','SCENE_SECURED','POST_NEGOTIATION','RESOLVED'].includes(x.status))return false;
 for(const k of ['started','active','canonContained','canonResolved','observedFinal','timeline','exposed','isolated','suppressed','containerStarted','sealed','secured','negotiated','handedOff','ruleTested','counterexample','reported'])if(typeof x[k]!=='boolean')return false;
 for(const k of ['lastUnits','elevatorTrips','crisisWindows','windowAtBegin','normalActions'])if(!int(x[k]))return false;
 if(x.containerStock!==undefined&&!int(x.containerStock,1)||x.elevatorRides!==undefined&&!int(x.elevatorRides,4))return false;
 if(x.timeline&&x.cameras.length!==3||x.evidence.includes('M08')&&!x.timeline||x.evidence.includes('M12')&&(!x.timeline||!x.counterexample||!['M02','M03','M06','M09'].every(id=>x.evidence.includes(id)))||x.evidence.includes('M14')&&(!x.exposed||x.excluded.length!==2)||x.plan.ready&&(!x.plan.role||!x.plan.retreat||!x.plan.assets))return false;
 if(x.windowAtBegin>x.crisisWindows)return false;
 if(x.startUnits!==null&&!int(x.startUnits)||!['NORMAL','UNRESPONSIVE','MOVING_WITHOUT_REQUEST','WRONG_FLOOR','SUPERNATURAL_ACTIVE'].includes(x.elevator)||!['mannequin','corpse','concealed'].includes(x.vessel))return false;
 if(!uniq(x.canonNodes,32,n=>int(n,63)&&n>=32)||x.canonNodes.some((n,i)=>n!==32+i)||!uniq(x.anchors,8,n=>str(n,10)&&/^CA-M0[1-8]$/.test(n)))return false;
 for(const [key,max,pred]of [['evidence',14,id=>Object.hasOwn(mallFacts,id)],['searched',5,id=>Object.hasOwn(mallZones,id)],['cameras',3,id=>['entry','clothing','storage'].includes(id)],['restrictedVessels',3,id=>['mannequin','corpse','concealed'].includes(id)],['rescued',2,id=>['a','b'].includes(id)],['candidates',3,id=>['A','B','C'].includes(id)],['excluded',3,id=>['A','B','C'].includes(id)],['contribution',10,id=>['evidence','location','rescue','isolation','suppression','container','monitor','risk','materials'].includes(id)]])if(!uniq(x[key],max,pred))return false;
 if(!arr(x.vesselHistory,60,v=>rec(v)&&int(v.tick)&&v.tick<=s.tick&&['mannequin','corpse','concealed'].includes(v.from)&&['mannequin','corpse','concealed'].includes(v.to))||!arr(x.journal,60,v=>rec(v)&&int(v.tick)&&v.tick<=s.tick&&str(v.text))||!arr(x.notes,20,v=>str(v)))return false;
 const p=x.plan;if(!rec(p)||![null,'MONITOR','LOCATOR','ISOLATOR','SUPPRESSOR','CONTAINER'].includes(p.role)||![null,'EARLY','RISK'].includes(p.retreat)||![null,'CANON_CUSTODY','CONTRIBUTION'].includes(p.assets)||typeof p.ready!=='boolean')return false;
 const n=x.npc;if(!rec(n)||['yanMet','yanWithdrawn','jiangMet','managerMet'].some(k=>typeof n[k]!=='boolean')||!int(n.yanUses,6)||!uniq(n.relations,6,k=>['MET','SHARED_EVENT','COOPERATED','SHARED_INFORMATION','TRUSTED_IN_COMBAT','DISPUTED_REWARD'].includes(k)))return false;
 if(!rec(x.victims)||!rec(x.knownVictims)||Object.keys(x.victims).join(',')!=='a,b,c'||Object.keys(x.knownVictims).some(k=>!['a','b','c'].includes(k))||[...Object.values(x.victims),...Object.values(x.knownVictims)].some(v=>!['MISSING','FOUND_ALIVE','EVACUATED','FOUND_DEAD','DERIVATIVE','VESSEL','UNKNOWN'].includes(v))||x.rescued.some(id=>x.victims[id]!=='EVACUATED'||x.knownVictims[id]!=='EVACUATED'))return false;
 if(x.reward!==undefined&&(!int(x.reward,160)||!x.negotiated&&x.reward!==0))return false;
 if(!rec(x.costs)||!int(x.costs.bags,2)||!int(x.costs.cash,1000)||!int(x.costs.uses,1000)||!rec(x.startRevival)||Object.entries(x.startRevival).some(([k,v])=>!/^player-/.test(k)||!Number.isFinite(v)||v<0||v>100))return false;
 if(!arr(x.records,10,r=>rec(r)&&int(r.tick)&&r.tick<=s.tick&&['RESOLVED','OTHERS_CONTAINED','WITHDRAWN','DEATH'].includes(r.result)&&uniq(r.evidence,14,id=>Object.hasOwn(mallFacts,id))&&uniq(r.rescued,2,id=>['a','b'].includes(id))&&rec(r.revivalDelta)&&Object.values(r.revivalDelta).every(Number.isFinite)))return false;
 if(x.suppressed&&!x.exposed||x.containerStarted&&(!x.isolated||!x.suppressed)||x.sealed&&(!x.canonContained||!x.isolated||!x.suppressed)||x.secured&&!x.sealed||x.negotiated&&!x.secured||x.handedOff&&!x.negotiated||x.status==='RESOLVED'&&!x.handedOff||x.active&&!x.started||x.started&&x.startUnits===null||!x.started&&(x.evidence.length||x.records.some(r=>r.result!=='OTHERS_CONTAINED')||x.active))return false;
 return true;
 }catch{return false;}}
