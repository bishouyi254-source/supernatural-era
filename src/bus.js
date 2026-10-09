// V1.5 / V1.5.1 supplied GDD. Numeric budgets and peripheral threats are game adaptations.
import {fateResult,resetTemporary} from './rules.js';
import {newTransit,transitMaintains,transitRunning,validTransit} from './transit-model.js';
export const busPhases=['追踪异常信号','未知公交车辆','隔绝的车厢','死去的司机','车上的乘客','第一次停站','哭坟与站外观察','荒野与新乘客','熄火','小心眼 · 未知规则压力','失聪 · 感知干扰','不受影响 · 对照验证','招鬼 · 连锁压力','再次发动','遮脸布 · 高危媒介','路过的坟场','特殊的生存方式','正常世界重新出现','消失的车','X档案'];
export const busStates=['APPROACHING','BOARDING','RUNNING','STOPPING','STOPPED_AT_STATION','ENGINE_OFF','RESTARTING','NORMAL_WORLD','TRANSITION','DISAPPEARED'];
export const busFlags=['BUS_IS_SUPERNATURAL','BUS_CAN_RUN_WITHOUT_DRIVER','BUS_CAN_CARRY_SPIRITS','BUS_STOPS_AT_SUPERNATURAL_LOCATIONS','BUS_SUPPRESSES_SPIRITS','ENGINE_OFF_IS_HIGH_RISK','NORMAL_CITY_STOP_IS_EXIT_OPPORTUNITY','BUS_CANNOT_BE_SUMMONED_NORMALLY'];
const stages=['UNKNOWN','SUSPECTED','SUPPORTED','CONFIRMED'];
const activeIds=s=>(s.v1?.active||s.spirits.slice(0,2).map(g=>g.id));
const clamp=n=>Math.max(0,Math.min(100,n));
const alive=s=>s.systems.death==='alive';
export function newBus(){return {transit:newTransit(),format:1,started:false,active:false,completed:false,onBus:false,phase:0,canonProgress:0,busState:'APPROACHING',stability:85,stopWindows:0,currentStop:null,previousStops:[],route:'first',cycle:0,cycleStep:0,traceCount:0,traceDecision:null,seat:'middle',observations:[],flags:Object.fromEntries(busFlags.map(id=>[id,'UNKNOWN'])),passengers:[],locations:{},location:null,stranded:false,survey:0,cover:0,debuff:null,cloth:{stage:0,result:null,decision:null},xArchive:0,shutdowns:0,stops:0,checkpoints:[],snapshot:null,worldAnchors:[],history:[],initialRevivals:{},record:null,knowledgeGraph:[],deathRecorded:false};}
export function attachBus(s){const b=s.bus||newBus();return {...s,bus:b.transit?b:{...b,transit:newTransit()}};}
export function busBusy(s){return !!s.bus?.active;}
export function busSuppression(s){if(s.bus?.transit?.started)return transitRunning(s);return !!(s.bus?.active&&s.bus.onBus&&['RUNNING','STOPPED_AT_STATION','NORMAL_WORLD','RESTARTING'].includes(s.bus.busState));}
export const busMaintains=(s,g)=>s.bus?.transit?.started?transitMaintains(s,g):busSuppression(s);
export function busStability(s){const n=s.bus.stability;return n>=75?'稳定':n>=60?'轻微异常':n>=40?'不稳定':n>=20?'高危':'即将失控';}
function log(b,text){b.history.push(text);b.history=b.history.slice(-80);}
function flag(b,id,level){if(stages.indexOf(level)>stages.indexOf(b.flags[id]))b.flags[id]=level;}
function anchor(b,id){if(!b.worldAnchors.includes(id))b.worldAnchors.push(id);}
function checkpoint(s,id){const b=s.bus;if(!b.checkpoints.some(c=>c.id===id))b.checkpoints.push({id,tick:s.tick,phase:b.phase,life:s.life,revivals:Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress]))});}
function passenger(id,kind,seat,canon=false){return {id,kind,seat,canonProtected:canon,knowledge:'UNKNOWN',evidence:[],status:'静止',boardedAt:0,exitedAt:null,rescueAttempted:false};}
function initialPassengers(){return [passenger('P01','human','front'),passenger('P02','human','middle'),passenger('P03','human','rear'),passenger('P04','controller','rear'),passenger('P05','spirit','front'),passenger('canon-yang','controller','middle',true)];}
function archiveLocation(b,id){if(!b.locations[id])b.locations[id]={id,name:id==='wilderness'?'未知荒野 · 停靠点':'异常坟场 · 外围',coordinateReliability:0,mapReliability:0,archiveProgress:0,knownRules:[],suspectedRules:[],explored:[],entrances:['公交停靠点'],exits:[{type:'bus',historical:true,current:true},{type:'conditional',historical:false,current:false}],visits:0};const l=b.locations[id];l.visits++;l.mapReliability=Math.max(0,l.mapReliability-20);l.exits[0].current=true;l.exits[1].current=false;b.location=id;b.survey=0;return l;}
function stop(s,id){const b=s.bus;b.busState='STOPPED_AT_STATION';b.currentStop=id;b.stopWindows=3;b.stops++;b.previousStops.push(id);b.previousStops=b.previousStops.slice(-12);archiveLocation(b,id);log(b,'车辆自行停靠；车门外无法匹配现实地图，停车时间未确认。');}
function depart(b){b.busState='RUNNING';b.stopWindows=0;b.currentStop=null;if(!b.onBus){b.stranded=true;log(b,'车辆驶离。回程公交不再是当前有效出口；无法传送安全屋。');b.locations[b.location].exits[0].current=false;}else b.location=null;}
function harm(s,n){const b=s.bus;if(b.cover>0){b.cover--;log(b,'既有临时保护阻断本次侵蚀，保护已经消耗。');return;}s.life=Math.max(0,s.life-n);if(s.life===0)s.systems.death='pending';}
function observe(s){const b=s.bus,key='phase-'+b.phase;if(b.observations.includes(key))return;b.observations.push(key);
 if(b.phase===1){flag(b,'BUS_IS_SUPERNATURAL','SUSPECTED');log(b,'车辆线路无法核实；目标信号疑似在车内，不把未知车辆直接认证为鬼公交。');}
 if(b.phase===2){flag(b,'BUS_IS_SUPERNATURAL','SUPPORTED');log(b,'GPS记录互相冲突，普通窗口与门不能可靠脱离；空间隔绝得到证据支持。');}
 if(b.phase===3){flag(b,'BUS_CAN_RUN_WITHOUT_DRIVER','CONFIRMED');flag(b,'BUS_IS_SUPERNATURAL','CONFIRMED');log(b,'驾驶位失去正常驾驶反应，车辆仍自行行驶。');}
 if(b.phase===4||b.phase===7){flag(b,'BUS_CAN_CARRY_SPIRITS','SUPPORTED');log(b,'观察到静止个体与普通乘客有差异，尚未直接认证所有身份。');}
 if([5,6,15].includes(b.phase)){flag(b,'BUS_STOPS_AT_SUPERNATURAL_LOCATIONS','CONFIRMED');const l=b.locations[b.location||'wilderness'];if(l){l.archiveProgress=Math.min(60,l.archiveProgress+15);l.mapReliability=Math.min(60,l.mapReliability+15);if(!l.explored.includes('停靠点'))l.explored.push('停靠点');}log(b,'记录停靠点、荒野/坟场痕迹；哭声等完整杀人规律仍待图鉴专项核实。');}
 if(b.phase===8){flag(b,'ENGINE_OFF_IS_HIGH_RISK','CONFIRMED');log(b,'车灯与规则压制失效，风险骤变；复苏数字没有被车辆清零。');}
 if(b.phase===9){b.debuff='感知受扰';log(b,'眼前压力来自未认证的活动规则。此外围威胁为游戏适配，非完整原著杀人规律。');}
 if(b.phase===10){b.debuff='听觉信息不完整';log(b,'听觉提示不完整；文字保留可观察事实，不依赖玩家开启音频。');}
 if(b.phase===11){flag(b,'BUS_SUPPRESSES_SPIRITS','SUPPORTED');log(b,'不同对象受影响程度不同，对车厢压制形成对照推测，尚不解释所有规则。');}
 if(b.phase===13||b.phase===16){flag(b,'BUS_SUPPRESSES_SPIRITS','CONFIRMED');log(b,'重新运行与活动下降形成对照；某同行者利用这种压制生存，已累计复苏不回退。');}
 if(b.phase===14){b.cloth.stage=Math.max(1,b.cloth.stage);log(b,'发现遮脸布同源媒介；玩家候选与杨间正史物品分开，完整能力未认证。');}
 if(b.phase===17){flag(b,'NORMAL_CITY_STOP_IS_EXIT_OPPORTUNITY','CONFIRMED');log(b,'普通车辆与路灯重新出现。现实停站是当前可观察的离车机会。');}
 b.xArchive=Math.min(b.completed?80:60,b.xArchive+3);
}
function phaseEntry(s){const b=s.bus;
 if(b.phase===2){b.busState='RUNNING';b.onBus=true;anchor(b,'boarding');checkpoint(s,'S2');}
 if(b.phase===5){checkpoint(s,'S3');stop(s,'wilderness');}
 if(b.phase===7){depart(b);if(b.passengers.length<9){const p=passenger('P07','spirit','rear');p.boardedAt=b.stops;b.passengers.push(p);}anchor(b,'abnormal-road');log(b,'荒野登车记录改变了车内风险，未直接显示厉鬼品质。');}
 if(b.phase===8){checkpoint(s,'S4');b.busState='ENGINE_OFF';b.shutdowns++;b.snapshot={life:Math.max(1,s.life),ward:0,combat:{position:'safe',playerGauge:100,sourceGauge:0,cooldowns:{}}};anchor(b,'shutdown');b.passengers.filter(p=>p.kind==='spirit').forEach(p=>p.status='出现异常');log(b,'车辆熄火。压制失效，无法靠修发动机或自动行动解决。');}
 if(b.phase===12&&b.stability<40){const p=b.passengers.find(p=>p.kind==='human'&&p.status!=='确认死亡'&&!p.canonProtected);if(p){if(b.cover>0){b.cover--;p.status='获保护';log(b,'有限保护拦截一名普通乘客的致死侵蚀。');}else{p.status='确认死亡';log(b,'一名非正史核心乘客死亡已提交；再发动和重启都不复活他。');}}}
 if(b.phase===13){b.busState='RESTARTING';b.debuff=null;b.stability=Math.max(30,b.stability);anchor(b,'restart');checkpoint(s,'S5');log(b,'公交恢复自身规则；物品、乘客死亡、玩家复苏和命运结果均保留。');}
 if(b.phase===14)b.busState='RUNNING';
 if(b.phase===15)stop(s,'cemetery');
 if(b.phase===16){depart(b);log(b,'长期留车可以暂借规则压制，但必须继续承担停站、熄火与未知道路。');}
 if(b.phase===17){b.busState='NORMAL_WORLD';b.currentStop='reality';b.stopWindows=3;checkpoint(s,'S6');anchor(b,'reality-opportunity');log(b,'车外出现正常道路；可以下车，也可以继续未知旅程。');}
 if(b.phase===18){b.busState='DISAPPEARED';anchor(b,'departure');}
}
function finish(s,mode){const b=s.bus;b.completed=true;b.active=false;b.onBus=false;b.stranded=false;b.location=null;b.currentStop=null;b.stopWindows=0;b.phase=19;b.busState='DISAPPEARED';s.scene='hub';flag(b,'BUS_CANNOT_BE_SUMMONED_NORMALLY','CONFIRMED');anchor(b,'departure');
 const experienced=b.shutdowns>0&&b.stops>0;b.xArchive=Math.min(60,Math.max(b.xArchive,experienced?30:10));
 b.knowledgeGraph=['现实世界','未知车辆记录',...Object.keys(b.locations)];if(experienced)b.knowledgeGraph[1]='X-001 · 鬼公交';
 b.record={mode,alive:alive(s),stops:b.stops,shutdowns:b.shutdowns,xArchive:b.xArchive,survivors:b.passengers.filter(p=>p.kind==='human'&&p.status!=='确认死亡').length,totalHumans:b.passengers.filter(p=>p.kind==='human').length,newSpirits:0,cloth:b.cloth.result==='sealed',revivalChanges:Object.fromEntries(s.spirits.map(g=>[g.id,Math.max(0,g.revivalProgress-(b.initialRevivals[g.id]??g.revivalProgress))]))};
 log(b,'旅程记录提交：'+mode+'。X类是设施档案分类，不是S或神灵异以上的品质。');
}
function advance(s){const b=s.bus;
 if(b.route!=='first'){
  b.cycleStep++;if(b.cycleStep<3)return;b.cycleStep=0;b.cycle=(b.cycle+1)%5;
  if(b.cycle===0){depart(b);b.busState='RUNNING';}
  if(b.cycle===1)stop(s,b.stops%2?'cemetery':'wilderness');
  if(b.cycle===2){depart(b);b.busState='ENGINE_OFF';b.shutdowns++;b.snapshot={life:Math.max(1,s.life),ward:0,combat:{position:'safe',playerGauge:100,sourceGauge:0,cooldowns:{}}};log(b,'长期旅程再次熄火，压制失效。');}
  if(b.cycle===3){b.busState='RESTARTING';b.debuff=null;log(b,'车辆再次恢复；消耗与后果没有回滚。');}
  if(b.cycle===4){b.busState='NORMAL_WORLD';b.currentStop='reality';b.stopWindows=3;log(b,'正常道路再次出现，不保证下一站仍属于现实。');}
  return;
 }
 if([5,6,15,17].includes(b.phase)&&b.stopWindows>0){b.stopWindows--;if(b.stopWindows>0){if(b.phase===5){b.phase=6;phaseEntry(s);}return;}}
 b.phase=Math.min(18,b.phase+1);phaseEntry(s);
 if(b.phase===18&&b.onBus){b.route=b.flags.BUS_SUPPRESSES_SPIRITS==='CONFIRMED'&&s.spirits.some(g=>g.revivalProgress>=80)?'survivor':'explorer';b.phase=16;b.busState='RUNNING';b.currentStop=null;b.stopWindows=0;b.cycle=0;b.cycleStep=0;log(b,'你错过现实离车窗口，城市安全屋生活暂停。');}
}
export function busAvailable(s){const b=s.bus;if(!b||s.systems.death==='committed')return [];
 if(!b.active){if(s.scene!=='hub'||s.combat||s.city.active||s.journey.active||s.crisis||!alive(s))return [];if(!b.started&&s.city.completed)return ['bus:signal'];if(b.started&&b.traceCount<3&&s.v1.cash>=50)return ['bus:track'];return [];}
 const out=[];
 const eye=s.spirits.find(g=>g.sourceId==='eye');if(b.busState==='ENGINE_OFF'&&b.onBus&&eye&&b.snapshot&&eye.development>=50&&eye.awakeningProgress>=70&&eye.awakeningProgress<100&&eye.revivalProgress<95&&activeIds(s).includes(eye.id)&&s.energy>0)out.push('bus:reset:self',...(eye.awakeningProgress>=90?['bus:reset:range']:[]));
 if(s.systems.death==='pending')return [...out,...(s.systems.items.barrier>0?['bus:reaction']:[]),'death:commit'];
 if(s.crisis)return [...out,...(s.systems.items.barrier>0?['bus:protect']:[]),'bus:wait'];
 if(b.phase===0)return ['bus:trace'];
 if(b.phase===1&&!b.onBus)return [...(b.observations.includes('phase-1')?[]:['bus:observe']),'bus:board','bus:decline'];
 if(b.stranded){out.push('bus:survey','bus:wait');if(b.survey>=2&&(s.v1.items.medium>0||eye&&eye.awakeningProgress>=5&&s.energy>0&&activeIds(s).includes(eye.id)))out.push('bus:exit');if(b.survey>=3)out.push('bus:follow-route');return out;}
 out.push('bus:wait');if(!b.observations.includes('phase-'+b.phase))out.push('bus:observe');
 if(b.onBus){out.push(...['front','middle','rear'].filter(id=>id!==b.seat).map(id=>'bus:seat:'+id));for(const p of b.passengers.filter(p=>p.exitedAt===null&&p.status!=='确认死亡')){if(p.evidence.length<2)out.push('bus:passenger:'+p.id);if(p.knowledge!=='UNKNOWN'&&!p.rescueAttempted)out.push('bus:rescue:'+p.id);}out.push('bus:disturb','bus:talk');}
 if(b.busState==='STOPPED_AT_STATION'){if(b.onBus)out.push('bus:door','bus:disembark');else out.push('bus:survey','bus:return');}
 if(b.busState==='NORMAL_WORLD'&&b.onBus)out.push('bus:leave','bus:stay');
 if(b.onBus&&b.busState==='ENGINE_OFF'){if(s.systems.items.barrier>0)out.push('bus:protect');if(s.energy>0)out.push(...s.spirits.filter(g=>activeIds(s).includes(g.id)).map(g=>'bus:ability:'+g.id));out.push('bus:flee');}
 if(b.onBus&&b.phase===14&&b.cloth.result===null){if(b.cloth.stage===1)out.push('bus:cloth:approach');if(b.cloth.stage===2&&s.bags>0)out.push('bus:cloth:contain');}
 return out;
}
export function applyBus(s,a){const b=s.bus,k=a.slice(4);let used=null,spendWindow=true,extra=null;
 if(k==='signal'){b.started=true;b.active=true;b.phase=0;b.busState='APPROACHING';b.passengers=initialPassengers();b.initialRevivals=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress]));checkpoint(s,'S1');anchor(b,'appearance');log(b,'追踪城市后失踪信号，最后位置在道路移动中。并非召唤公交。');return {used,extra};}
 if(k==='track'){s.v1.cash-=50;b.traceCount++;const f=fateResult(s.seed,'bus-road-'+b.traceCount,{archive:b.xArchive,clues:b.observations,locations:Object.keys(b.locations),build:s.v1.build});b.traceDecision=f;if(f.roll<Math.min(65,30+Math.floor(b.xArchive/2))){b.active=true;b.onBus=false;b.phase=1;b.busState='APPROACHING';b.route=b.completed?'explorer':'first';b.passengers=initialPassengers();b.cloth.stage=0;log(b,'新的异常道路记录形成接触机会；不是固定召车按钮。');}else log(b,'新道路记录没有找到车辆；现金消耗与命运结果提交。');return {used,extra};}
 if(k==='trace'){b.phase=1;log(b,'异常信号来自未知公交车辆，线路无法核实。');return {used,extra};}
 if(k==='decline'){b.active=false;b.onBus=false;b.busState='DISAPPEARED';b.xArchive=Math.max(b.xArchive,3);anchor(b,'yang-first-route');log(b,'你拒绝登车，留下未完成车辆记录；杨间正史旅程继续。');return {used,extra};}
 if(k==='board'){b.onBus=true;if(b.route==='first'){b.phase=2;phaseEntry(s);}else{b.phase=16;b.busState='RUNNING';b.cycle=0;b.cycleStep=0;log(b,'后续旅程仅重用已接触荒野/坟场外围，不开放后期地图。');}return {used,extra};}
 const wasOff=b.busState==='ENGINE_OFF';
 if(k==='observe'){observe(s);if(b.phase===1||b.phase===14)spendWindow=false;}
 if(k==='wait')log(b,'你克制行动，等待规则变化；安静也是一种生存选择。');
 if(k==='talk'){flag(b,'BUS_SUPPRESSES_SPIRITS','SUSPECTED');log(b,'同行者提醒“车辆停下不等于安全”。该消息有动机，暂记SUSPECTED而非百分百规律。');}
 if(k.startsWith('seat:')){b.seat=k.slice(5);log(b,'改变自身座位，不能给其他乘客重新排座。');}
 if(k.startsWith('passenger:')){const p=b.passengers.find(p=>p.id===k.slice(10));p.evidence.push(p.evidence.length?'对照反应':'观察外观');p.knowledge=p.evidence.length===2?'SUPPORTED':'SUSPECTED';if(p.evidence.length===2&&p.kind==='spirit')flag(b,'BUS_CAN_CARRY_SPIRITS','SUPPORTED');log(b,'记录'+p.id+'的外观与反应差异；不保证外貌等于真实身份。');}
 if(k.startsWith('rescue:')){const p=b.passengers.find(p=>p.id===k.slice(7));p.rescueAttempted=true;if(p.kind!=='human'){b.stability=clamp(b.stability-15);harm(s,20);log(b,'保护尝试没有普通乘客应答；目标身份仍未确认，接触反而刺激车厢规则。');}else if(s.systems.items.barrier>0){s.systems.items.barrier--;p.status='获保护';p.knowledge='CONFIRMED';log(b,'保护一名原创普通乘客，符膜消耗1，其个人生存结果保留。');}else{harm(s,10);p.status='获保护';p.knowledge='CONFIRMED';log(b,'以身体暴露接应一名普通乘客，承担侵蚀10；不是无成本救援。');}}
 if(k==='disturb'){b.stability=clamp(b.stability-25);harm(s,15);log(b,'主动攻击/触碰可疑乘客打破安静；车内秩序恶化，不提供击杀经验。');}
 if(k==='door'){harm(s,8);observe(s);log(b,'车门边观察承担站外媒介暴露，不能用普通车门逃离行驶车辆。');}
 if(k==='disembark'){b.onBus=false;log(b,'你进入站外外围。唯一已知当前出口是公交，不能返回Hub。');}
 if(k==='return'){b.onBus=true;b.stranded=false;b.location=null;log(b,'在车辆仍停靠时返回，站外已探索区域保存。');}
 if(k==='survey'){const l=b.locations[b.location];b.survey=Math.min(3,b.survey+1);l.archiveProgress=Math.min(60,l.archiveProgress+10);l.mapReliability=Math.min(60,l.mapReliability+15);const id=['东侧小路','墓碑/边界区域','条件出口对照'][b.survey-1];if(!l.explored.includes(id))l.explored.push(id);if(b.survey>=2){l.exits[1].historical=true;l.exits[1].current=true;}harm(s,b.stranded?12:8);log(b,'外围调查改善本次路线可靠度；历史出口不自动保证下一次有效。');}
 if(k==='exit'||k==='follow-route'){if(k==='exit'){if(s.v1.items.medium>0)s.v1.items.medium--;else{const eye=s.spirits.find(g=>g.sourceId==='eye');s.energy--;used=eye.id;}log(b,'已验证的条件出口配合既有媒介/空间能力返回现实；不是随时传送。');}else{harm(s,20);log(b,'沿本次三次调查确认的外围归路脱离，承担身体20；不能套用于未开放高级地点。');}if(alive(s)){finish(s,'被困外围后条件回归');spendWindow=false;}}
 if(k==='protect'){s.systems.items.barrier--;b.cover=1;if(s.crisis)s.spirits.forEach(g=>g.suppressionRemaining=Math.max(g.suppressionRemaining,2));log(b,'消耗已持有符膜，建立一个临时保护窗口；不降低累计复苏。');}
 if(k.startsWith('ability:')){s.energy--;used=k.slice(8);const g=s.spirits.find(g=>g.id===used);g.development=Math.min(100,g.development+3);b.cover=1;log(b,g.name+'建立一次局部保护，仅该鬼承担调用；没有修好公交。');}
 if(k==='flee'){b.onBus=false;b.stranded=true;archiveLocation(b,'wilderness');b.locations.wilderness.exits[0].current=false;log(b,'熄火时逃出车厢，进入未知荒野；公交世界节点仍继续。');}
 if(k==='reaction'){s.systems.items.barrier--;s.systems.death='alive';s.life=1;b.cover=1;if(s.crisis)s.spirits.forEach(g=>g.suppressionRemaining=Math.max(g.suppressionRemaining,2));spendWindow=false;log(b,'既有符膜拦截死亡待定，仍在当前车厢/地点，没有免费传回安全屋。');}
 if(k.startsWith('reset:')){const eye=s.spirits.find(g=>g.sourceId==='eye');s.energy--;const local={...s,combat:b.snapshot.combat};const restored=resetTemporary(local,b.snapshot,{id:'bus-eye-reset',kind:'divine',scope:'self',fields:['life']});s.life=restored.life;s.systems.death='alive';b.debuff=null;b.cover=1;extra={id:eye.id,amount:k==='reset:range'?24:18};spendWindow=false;log(b,k==='reset:range'?'八层尝试仅阻断局部临时威胁；X设施规则对抗不允许重置公交、乘客、站点或熄火。':'七层恢复自身临时身体/感知；公交状态、乘客、物品、命运和复苏代价保留。');}
 if(k==='cloth:approach'){b.cloth.stage=2;harm(s,12);spendWindow=false;log(b,'接近同源遮脸布媒介，承担侵蚀12；尚未取得。');}
 if(k==='cloth:contain'){s.bags--;const f=fateResult(s.seed,'bus-cloth',{archive:b.xArchive,observed:b.observations.filter(x=>['phase-6','phase-11','phase-13','phase-14'].includes(x)),build:s.v1.build,capacity:s.hostCapacity});b.cloth.decision=f;b.cloth.result=f.roll<65?'sealed':'miss';b.cloth.stage=3;log(b,b.cloth.result==='sealed'?'独立玩家遮脸布媒介已隔离保存；不夺取杨间实例，完整作用待图鉴认证。':'同源媒介无法完整隔离，机会与隔离袋消耗均已提交。');}
 if(k==='leave'){finish(s,'正常现实站点离车');spendWindow=false;}
 if(k==='stay'){b.route=b.flags.BUS_SUPPRESSES_SPIRITS==='CONFIRMED'&&s.spirits.some(g=>g.revivalProgress>=80)?'survivor':'explorer';b.phase=16;b.busState='RUNNING';b.currentStop=null;b.stopWindows=0;b.cycle=0;b.cycleStep=0;spendWindow=false;log(b,'主动留车，城市生活暂停；车辆不会保证下一站或永久安全。');}
 if(wasOff&&spendWindow&&b.onBus){const severity=b.stability<40?20:8;const resistance=s.v1.build==='suppression'?4:s.v1.build==='mind'&&b.debuff?4:s.advanced.alienStage===2?3:0;harm(s,Math.max(1,severity-resistance));b.stability=clamp(b.stability-3);}
 if(spendWindow&&b.active)advance(s);
 return {used,extra};
}
export function recordBusDeath(s){const b=s.bus;if(b?.transit?.started)return;if(!b?.active||s.systems.death!=='committed'||b.deathRecorded)return;b.deathRecorded=true;b.stability=clamp(b.stability-30);for(const g of s.spirits)if(b.passengers.length<12){const p=passenger('legacy-'+g.sourceId,'spirit',b.seat);p.knowledge='SUPPORTED';p.status='遗留活动';p.boardedAt=b.stops;b.passengers.push(p);}log(b,'玩家死亡已提交，遗留灵异成为规则载体的新风险，不随下一站复活。');}
export function validBus(s){const b=s.bus;if(b===undefined)return true;if(!validTransit(s))return false;const n=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max,arr=(x,max)=>Array.isArray(x)&&x.length<=max,str=(x,max)=>typeof x==='string'&&x.length<=max;
 if(!b||b.format!==1||!['started','active','completed','onBus','stranded','deathRecorded'].every(k=>typeof b[k]==='boolean')||!busStates.includes(b.busState)||!n(b.phase,19)||!n(b.canonProgress,19)||!n(b.stability,100)||!n(b.stopWindows,3)||!n(b.cycle,4)||!n(b.cycleStep,2)||!n(b.traceCount,3)||!n(b.cover,1)||!n(b.survey,3)||!n(b.xArchive,80)||!n(b.shutdowns,1e9)||!n(b.stops,1e9)||!['first','survivor','explorer'].includes(b.route)||!['front','middle','rear'].includes(b.seat)||![null,'wilderness','cemetery','reality'].includes(b.currentStop)||![null,'wilderness','cemetery'].includes(b.location)||![null,'感知受扰','听觉信息不完整'].includes(b.debuff))return false;
 if(b.active&&!b.started||b.onBus&&!b.active||b.stranded&&(b.onBus||!b.location)||!b.active&&b.onBus||!arr(b.passengers,12)||!b.flags||busFlags.some(id=>!stages.includes(b.flags[id])))return false;
 if(new Set(b.passengers.map(p=>p?.id)).size!==b.passengers.length||b.passengers.some(p=>!p||!str(p.id,40)||!['human','controller','spirit'].includes(p.kind)||!['front','middle','rear'].includes(p.seat)||typeof p.canonProtected!=='boolean'||typeof p.rescueAttempted!=='boolean'||!stages.includes(p.knowledge)||!['静止','出现异常','确认死亡','获保护','遗留活动'].includes(p.status)||!arr(p.evidence,2)||p.evidence.some(x=>!['观察外观','对照反应'].includes(x))||!n(p.boardedAt,1e9)||!(p.exitedAt===null||n(p.exitedAt,1e9))||p.canonProtected&&p.status==='确认死亡'))return false;
 if(!b.locations||typeof b.locations!=='object'||Array.isArray(b.locations)||Object.keys(b.locations).some(id=>!['wilderness','cemetery'].includes(id)))return false;
 for(const [id,l] of Object.entries(b.locations))if(!l||l.id!==id||!str(l.name,80)||!n(l.coordinateReliability,100)||!n(l.mapReliability,100)||!n(l.archiveProgress,60)||!n(l.visits,1e9)||!arr(l.explored,4)||!arr(l.knownRules,10)||!arr(l.suspectedRules,10)||!arr(l.entrances,4)||!arr(l.exits,2)||l.exits.length!==2||l.exits[0]?.type!=='bus'||l.exits[1]?.type!=='conditional'||[l.explored,l.knownRules,l.suspectedRules,l.entrances].some(a=>a.some(x=>!str(x,200)))||l.exits.some(e=>!e||!['bus','conditional'].includes(e.type)||typeof e.current!=='boolean'||typeof e.historical!=='boolean'))return false;
 if(b.location&&!b.locations[b.location]||!arr(b.previousStops,12)||b.previousStops.some(x=>!['wilderness','cemetery'].includes(x))||!arr(b.observations,20)||new Set(b.observations).size!==b.observations.length||b.observations.some(x=>!/^phase-(?:[0-9]|1[0-9])$/.test(x))||!arr(b.history,80)||b.history.some(x=>!str(x,2000))||!arr(b.worldAnchors,8)||new Set(b.worldAnchors).size!==b.worldAnchors.length||b.worldAnchors.some(x=>!['appearance','boarding','abnormal-road','shutdown','restart','reality-opportunity','departure','yang-first-route'].includes(x))||!arr(b.knowledgeGraph,4)||b.knowledgeGraph.some(x=>!str(x,60)))return false;
 if(!arr(b.checkpoints,6)||new Set(b.checkpoints.map(c=>c?.id)).size!==b.checkpoints.length||b.checkpoints.some(c=>!c||!/^S[1-6]$/.test(c.id)||!n(c.tick,1e9)||!n(c.phase,19)||!n(c.life,100)||!c.revivals||Object.values(c.revivals).some(x=>!Number.isFinite(x)||x<0||x>100)))return false;
 if(b.snapshot&&(!n(b.snapshot.life,100)||b.snapshot.life===0||!b.snapshot.combat||b.snapshot.combat.position!=='safe'||b.snapshot.combat.playerGauge!==100||b.snapshot.combat.sourceGauge!==0))return false;
 const c=b.cloth;if(!c||!n(c.stage,3)||![null,'sealed','miss'].includes(c.result)||c.result!==null&&!c.decision||c.decision&&(!c.decision.context||typeof c.decision.context!=='object'))return false;
 if(c.decision){const f=fateResult(s.seed,'bus-cloth',c.decision.context);if(f.roll!==c.decision.roll||f.signature!==c.decision.signature||(c.result==='sealed')!==(f.roll<65))return false;}
 if(b.traceDecision){if(!b.traceDecision.context||typeof b.traceDecision.context!=='object')return false;const f=fateResult(s.seed,'bus-road-'+b.traceCount,b.traceDecision.context);if(f.roll!==b.traceDecision.roll||f.signature!==b.traceDecision.signature)return false;}
 if(!b.initialRevivals||Object.values(b.initialRevivals).some(x=>!Number.isFinite(x)||x<0||x>100))return false;
 if(b.record&&(!str(b.record.mode,80)||typeof b.record.alive!=='boolean'||!n(b.record.stops,1e9)||!n(b.record.shutdowns,1e9)||!n(b.record.xArchive,80)||!n(b.record.survivors,3)||b.record.totalHumans!==3||b.record.survivors>b.record.totalHumans||b.record.newSpirits!==0||typeof b.record.cloth!=='boolean'||!b.record.revivalChanges||Object.values(b.record.revivalChanges).some(x=>!Number.isFinite(x)||x<0||x>100)))return false;
 return true;
}

// Personal departure does not stop the canonical bus journey. This is not player knowledge.
export function advanceBusWorld(s){const b=s.bus;if(!b?.started||b.transit?.started)return;if(b.active)b.canonProgress=Math.max(b.canonProgress,b.phase);else b.canonProgress=Math.min(19,b.canonProgress+1);if(b.canonProgress>=8)anchor(b,'shutdown');if(b.canonProgress>=13)anchor(b,'restart');if(b.canonProgress>=17)anchor(b,'reality-opportunity');if(b.canonProgress>=18)anchor(b,'departure');}
