import {schoolZones,normalEdges,schoolPeople,windows,newSchool,schoolFact,hasSchool,schoolAssessment,schoolRoute,schoolSeedRoll} from './school-model.js';
import {makeSpirit} from './progression.js';
import {activeIds} from './v1.js';
import {hostState} from './spirits.js';
import {ruleBlocked,advancedBusy} from './evolution-model.js';
export const schoolRoll=schoolSeedRoll;
const once=(a,v)=>{if(!a.includes(v))a.push(v);};
const alive=s=>s.systems.death==='alive'&&!s.crisis;
const usable=s=>s.spirits.filter(g=>activeIds(s).includes(g.id)&&!ruleBlocked(s,g.id));
const say=(s,t)=>{s.school.history.push(t);s.school.history=s.school.history.slice(-100);s.journal.push(t);};
function locationObserved(s){const x=s.school;for(const [id,n] of Object.entries(x.npcs))if(n.zone===x.zone)x.knownNPC[id]={state:n.state,zone:n.zone,tick:s.tick};}
function encounterActor(x,actor){const node=actor==='zhou'?9:13;return x.nodes.includes(node)&&!x.canonResolved&&x.actors[actor].zone===x.zone&&!x.contacts.some(c=>c.actor===actor&&c.window===x.window);}
function opportunityZone(id){return {shadow:'office',echo:'toilet',eye:'tree'}[id];}
export function schoolAvailable(s){const x=s.school;if(!x)return [];
 if(!x.started)return alive(s)&&s.scene==='hub'&&!s.combat&&!s.bus.active&&!s.journey.active&&!s.city.active&&!s.doorCase.active&&!s.investigation.active&&!advancedBusy(s)?['school:start','school:outside']:[];
 if(!x.participated&&!x.canonResolved&&x.window<=2&&alive(s))return ['school:join'];
 if(!x.active||!alive(s)||advancedBusy(s))return x.playerEscaped&&!hasSchool(x,'R-01')&&alive(s)?['school:report']:[];
 const out=['school:observe','school:search','school:wait',...(x.group.followState==='HESITANT'?[]:normalEdges[x.zone].map(z=>'school:move:'+z))];
 if(x.tools.cotton&&!x.earsCovered)out.push('school:cover');
 if(x.window>=1&&!x.audioStopped)out.push('school:stop-audio');
 if(x.window>=1)out.push('school:avoid','school:listen');
 if(x.tools.map&&!hasSchool(x,'M-02')&&x.window>=2)out.push('school:compare-map');
 if(x.tools.light&&x.window>=2)out.push('school:light');
 if(x.tools.key&&x.zone==='stairs'&&!x.tools.marks)out.push('school:mark-route');
 for(const [id,n] of Object.entries(x.npcs))if(n.zone===x.zone&&n.state==='ALIVE'){
  out.push('school:talk:'+id);
  if(!x.group.members.includes(id))out.push('school:invite:'+id);
 }
 if(x.group.members.length){out.push('school:calm');if(x.hypotheses.some(h=>h.status==='CONFIRMED'))out.push('school:share');if(x.hypotheses.some(h=>h.status==='SUPPORTED'))out.push('school:share-guess');}
 for(const id of ['sound','random','space','source','paper'])if(!x.hypotheses.some(h=>h.id===id)&&(id==='space'?hasSchool(x,'M-01'):id==='paper'?hasSchool(x,'P-01'):id==='source'?hasSchool(x,'S-01'):hasSchool(x,'K-01')))out.push('school:theory:'+id);
 for(const actor of ['zhou','yang'])if(encounterActor(x,actor))out.push('school:contact:'+actor,'school:hostile:'+actor);
 if(x.zone==='hall'&&x.window===4&&hasSchool(x,'Y-01')&&!hasSchool(x,'P-01'))out.push('school:paper');
 if(x.window>=4&&hasSchool(x,'C-01'))out.push('school:answer-phone');
 if(x.window>=2)for(const g of usable(s))if(s.energy>0)out.push('school:probe:'+g.id,'school:interfere:'+g.id);
 if(x.zone==='yard'&&x.window>=5||x.residual&&x.zone==='exit')out.push('school:check-exit');
 if(x.zone==='exit'&&x.window>=5&&hasSchool(x,'M-04')&&x.mapEdges.some(e=>e.from==='yard'&&e.to==='exit'&&e.window===x.window&&e.status==='CURRENT')&&x.group.followState!=='HESITANT')out.push('school:escape');
 for(const o of x.opportunities.filter(o=>opportunityZone(o.id)===x.zone&&!o.resolved)){
  if(o.stage==='UNKNOWN')out.push('school:investigate:'+o.id);
  if(o.stage==='INVESTIGATED')out.push('school:prepare:'+o.id);
  if(['INVESTIGATED','PREPARED'].includes(o.stage)&&!o.attempted&&x.drivingCount===0&&x.startOwned===0&&s.spirits.length===0)out.push('school:drive:'+o.id);
 }
 return out;
}
function start(s,participated){s.school=newSchool();const x=s.school;x.started=true;x.participated=participated;x.active=participated;x.startOwned=s.spirits.length;x.startRevival=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress]));x.startResources={life:s.life,energy:s.energy,bags:s.bags,barrier:s.systems.items.barrier};const roll=schoolRoll(s.seed)%10000;x.fate={seed:s.seed,roll,eyeEligible:roll<20,rareEligible:roll<2500};x.visited=['classroom'];say(s,participated?'来到七中B楼。照明与通话仍正常，先核对环境。':'你留在学校之外。学校仍有自己的事件进程，未参与不等于世界暂停。');}
function converge(s,type,actor=null){const x=s.school;x.convergence.state='PENDING';x.convergence.routes.push({type,tick:s.tick,actor});x.convergence.state='ACTIVE';if(type==='ACTOR_ALTERNATE_ROUTE'){x.actors[actor].zone=actor==='yang'?'tree':'lecture';say(s,'对方拒绝敌对接近，转向另一条走廊；你未能接管他的行动。');}else if(type==='MANIFESTATION_ONLY')say(s,'眼前显现短时受限，远处异常仍在。此次干涉没有解决完整源头。');else say(s,'你的小组继续存活，其他目击渠道承接未见到的现场信息。');x.convergence.state='RESOLVED';}
function record(s,result){const x=s.school;if(x.records.length)return;x.result=result;
 x.records.push({result,tick:s.tick,elapsed:x.elapsed,entered:x.startOwned?'驭鬼者':'普通人',departed:s.spirits.length?'驭鬼者':'普通人',survivors:x.group.members.filter(id=>x.npcs[id].state==='ESCAPED'),knownNPC:structuredClone(x.knownNPC),evidence:structuredClone(x.evidence),hypotheses:structuredClone(x.hypotheses),cost:{life:x.startResources.life-s.life,energy:x.startResources.energy-s.energy,bags:x.startResources.bags-s.bags,barrier:x.startResources.barrier-s.systems.items.barrier},revivalDelta:{},canonKnown:x.evidence.filter(e=>['Z-01','Z-02','Z-03','Y-01','Y-02','P-01'].includes(e.id)).map(e=>e.id),archive:Math.min(60,15+x.evidence.length*2),spirit:x.opportunities.find(o=>o.stage==='SUCCESS')?.id||null});
}
function legacyComplete(s){const x=s.school,c=s.chapter;c.route||=x.participated?'inside':'elsewhere';c.stage=5;c.completed=true;c.failed=x.participated&&!x.playerEscaped;c.rescued=x.group.members.some(id=>x.npcs[id].state==='ESCAPED');c.personalHistory.push(x.participated?'七中个人路线：'+(x.playerEscaped?'成功离开':'未完成撤离'):'七中：无直接经历');c.personalHistory=c.personalHistory.slice(-60);
 // Legacy gate uses world outcomes. UI must never render these as character knowledge.
 c.worldHistory=[{id:'lecture',text:'七中事件已发生。'},...(x.nodes.includes(13)?[{id:'yang-eye',text:'杨间正史鬼眼实例保留。'}]:[]),...(x.canonResolved?[{id:'escape',text:'正史队伍八人离开；个人小组另记。'}]:[])];c.canonInstances=x.canonInstances.map(g=>({...g}));
}
export function applySchool(s,a){const k=a.slice(7);if(k==='start'||k==='outside'){start(s,k==='start');return null;}const x=s.school;let used=null;
 if(k==='join'){x.participated=true;x.active=true;x.visited=['classroom'];say(s,'从外围进入B楼；之前的世界进程不会重新开始。');return null;}
 if(k==='observe'){
  if(x.window===0)schoolFact(s,'F-01');
  if(x.window>=1&&['hall','lecture'].includes(x.zone)){schoolFact(s,'K-01');schoolFact(s,'K-02');}
  if(x.window>=2&&x.zone==='toilet')schoolFact(s,'S-01');
  if(x.window>=2&&x.zone==='tree')schoolFact(s,'M-03');
  if(x.window===3&&x.zone==='lecture'){schoolFact(s,'Z-01');schoolFact(s,'Z-02');once(x.relationships.zhou,'WITNESSED_SPIRIT');const m=x.missedScenes.find(m=>m.sceneId===9);if(m)m.observed=true;}
  if(x.window===4&&x.zone==='tree'){schoolFact(s,'Y-02');once(x.relationships.yang,'WITNESSED_SPIRIT');const m=x.missedScenes.find(m=>m.sceneId===13);if(m)m.observed=true;}
  locationObserved(s);say(s,'核对当前位置的现象，记录事实而非直接确认解释。');
 }else if(k==='search'){
  x.search[x.zone]=x.window;if(x.window===0)schoolFact(s,'M-00');
  if(x.zone==='office'){x.tools.map=true;x.tools.key=true;x.tools.light=true;say(s,'找到消防平面图、备用楼梯钥匙与应急灯。普通工具不能封存灵异源头。');}
  if(x.zone==='stairs'){x.tools.cotton=true;say(s,'取得隔音棉，必要时可隔离声音媒介。');}
  if(x.window>=2)schoolFact(s,'C-01');
  if(x.window>=2&&x.zone==='office'&&!x.opportunities.some(o=>o.id==='shadow'))x.opportunities.push({id:'shadow',tier:'COMMON',canonSafe:true,discovered:true,attempted:false,resolved:false,stage:x.startOwned?'ARCHIVE':'UNKNOWN'});
  if(x.window>=2&&x.zone==='toilet'&&x.fate.rareEligible&&!x.opportunities.some(o=>o.id==='echo'))x.opportunities.push({id:'echo',tier:'RARE',canonSafe:true,discovered:true,attempted:false,resolved:false,stage:x.startOwned?'ARCHIVE':'UNKNOWN'});
  if(x.window===4&&x.zone==='tree'&&x.tools.marks&&hasSchool(x,'M-03')&&x.fate.eyeEligible&&!x.opportunities.some(o=>o.id==='eye'))x.opportunities.push({id:'eye',tier:'FATE',canonSafe:true,discovered:true,attempted:false,resolved:false,stage:x.startOwned?'ARCHIVE':'UNKNOWN'});
  locationObserved(s);say(s,'完成一次现场搜索；重复检查也消耗真实行动。');
 }else if(k.startsWith('move:')){
  const from=x.zone,to=k.slice(5),actual=schoolRoute(x,from,to);x.zone=actual;x.group.zone=actual;once(x.visited,actual);
  const prev=x.mapEdges.find(e=>e.from===from&&e.to===to);const edge={from,to,actual,window:x.window,status:'CURRENT',tick:s.tick};if(prev)Object.assign(prev,edge);else x.mapEdges.push(edge);
  if(actual!==to){schoolFact(s,'M-01');say(s,'空间异常：原路线没有抵达预期位置。旧地图连接已标记为不可靠。');}
  else say(s,'抵达'+schoolZones[actual]+'；本段连接已复核，不代表整个地图恢复。');
  if(x.pressure&&['office','stairs','yard'].includes(actual))x.pressure=Math.max(0,x.pressure-2);locationObserved(s);
  for(const id of x.group.members)if(x.npcs[id].state==='ALIVE'&&x.group.followState==='FOLLOWING')x.npcs[id].zone=actual;
 }else if(k==='cover'){x.earsCovered=true;say(s,'隔离当前声音接触。行为有效，但这并不自动认证音频规律。');}
 else if(k==='stop-audio'){x.audioStopped=true;say(s,'关闭所有本机播放，不再主动扩散未知音频。');}
 else if(k==='avoid'){x.pressure=Math.max(0,x.pressure-3);if(x.window>=2)schoolFact(s,'S-02');if(x.earsCovered&&x.audioStopped)schoolFact(s,'K-04');say(s,'远离声音方向，借当前位置避让；没有永久解决源头。');}
 else if(k==='listen'||k==='answer-phone'){
  schoolFact(s,'K-01');if(k==='answer-phone')schoolFact(s,'C-02');
  if(!x.earsCovered){x.pressure=Math.min(12,x.pressure+5);say(s,'接触敲门音频后，脚步与老人接近迹象增强。你仍有避让和隔离的行动机会。');}else{schoolFact(s,'K-04');say(s,'隔离阻断了本次声音接触；通信信息不因此变成可信来源。');}
 }else if(k==='compare-map'){schoolFact(s,'M-02');say(s,'对照消防图与现场标记，确认此前地图失效；不能用普通地图解释全部鬼域。');}
 else if(k==='mark-route'){x.tools.marks=true;say(s,'用钥匙打开备用通道并建立手工标记；后续必须重新核对。');}
 else if(k==='light'){x.pressure=Math.max(0,x.pressure-1);say(s,'应急照明帮助辨认地标，不保证驱散老人。');}
 else if(k.startsWith('talk:')){
  const id=k.slice(5);locationObserved(s);if(x.window>=3){schoolFact(s,'Z-03');for(const m of x.missedScenes.filter(m=>[9,10,11].includes(m.sceneId)))m.secondhandKnown=true;}if(x.window>=4)schoolFact(s,'K-03');x.npcs[id].warned=true;say(s,schoolPeople[id].name+'描述了自己的经历。转述不等于你亲眼看见。');
 }else if(k.startsWith('invite:')){const id=k.slice(7);once(x.group.members,id);x.npcs[id].warned=true;x.group.trust=Math.min(5,x.group.trust+1);locationObserved(s);say(s,schoolPeople[id].name+'加入临时幸存小组，正史队伍不属于你的成员。');}
 else if(k==='calm'){x.group.panic=Math.max(0,x.group.panic-2);x.group.followState='FOLLOWING';say(s,'确认小组位置并分配引导，减少慌乱；世界仍继续推进。');}
 else if(k==='share'){for(const h of x.hypotheses.filter(h=>h.status==='CONFIRMED'))once(x.group.knownRules,h.id);x.group.panic=Math.max(0,x.group.panic-2);x.group.followState='FOLLOWING';say(s,'共享有对照证据的判断，降低小组错误行动。');}
 else if(k==='share-guess'){x.group.panic=Math.min(5,x.group.panic+2);x.group.trust=Math.max(0,x.group.trust-1);if(x.group.panic>=4)x.group.followState='HESITANT';say(s,'你将未验证判断交给小组。信息矛盾使他们犹豫，需核对证据或安抚。');}
 else if(k.startsWith('theory:')){x.hypotheses.push(schoolAssessment(x,k.slice(7)));say(s,'推测按已获得支持与反例复核；猜测不会改变真实规律。');}
 else if(k.startsWith('contact:')){const actor=k.slice(8);x.contacts.push({actor,window:x.window,tick:s.tick});once(x.relationships[actor],'MET');once(x.relationships[actor],'SHARED_INFORMATION');if(actor==='zhou'){schoolFact(s,'Z-01');schoolFact(s,'Z-02');}else schoolFact(s,'Y-01');say(s,'与'+(actor==='yang'?'杨间':'周正')+'交换有限信息后分开。他有自己的行动目标。');}
 else if(k.startsWith('hostile:')){const actor=k.slice(8);x.contacts.push({actor,window:x.window,tick:s.tick});once(x.relationships[actor],'CONFLICTED');s.life=Math.max(1,s.life-15);converge(s,'ACTOR_ALTERNATE_ROUTE',actor);}
 else if(k==='paper'){schoolFact(s,'P-01');schoolFact(s,'P-02');say(s,'记录特殊来源线索：事实仍要验证，来源动机始终不可信。正史羊皮纸没有转交给你。');}
 else if(k.startsWith('probe:')||k.startsWith('interfere:')){used=k.split(':')[1];s.energy--;if(k.startsWith('probe:')){schoolFact(s,'M-01');schoolFact(s,'M-02');say(s,'借体内灵异辨认空间异常；本次仅对应实例增长复苏。');}else{x.shield=3;x.pressure=Math.max(0,x.pressure-4);converge(s,'MANIFESTATION_ONLY');}}
 else if(k==='check-exit'){schoolFact(s,'M-04');x.mapEdges=x.mapEdges.filter(e=>!(e.from==='yard'&&e.to==='exit'));x.mapEdges.push({from:'yard',to:'exit',actual:'exit',window:x.window,status:'CURRENT',tick:s.tick});say(s,'重新观察出口连接：此刻路线可用。需要抵达出口才能真正离开。');}
 else if(k==='escape'){x.active=false;x.playerEscaped=true;x.residual=false;for(const id of x.group.members)if(x.npcs[id].state==='ALIVE'){x.npcs[id].state='ESCAPED';x.npcs[id].zone='exit';x.knownNPC[id]={state:'ESCAPED',zone:'exit',tick:s.tick};}record(s,'ESCAPED');legacyComplete(s);converge(s,'INFORMATION_REROUTE');say(s,'个人小组成功离开七中。救下的人保留存活结果，不计入正史八人。');}
 else if(k==='report'){schoolFact(s,'R-01');say(s,'获得事后封锁点信息。未目击的鬼眼与羊皮纸细节仍不自动认证。');}
 else if(k.startsWith('investigate:')){const id=k.slice(12),o=x.opportunities.find(o=>o.id===id);o.stage='INVESTIGATED';schoolFact(s,{shadow:'O-01',echo:'O-02',eye:'O-03'}[id]);say(s,'观察独立玩家媒介。'+(id==='eye'?'同源不等于正史实例转移。':'此机会属于游戏原创留白内容。'));}
 else if(k.startsWith('prepare:')){const id=k.slice(8),o=x.opportunities.find(o=>o.id===id);if(id==='shadow'&&x.tools.light||id==='echo'&&x.audioStopped&&x.earsCovered||id==='eye'&&x.tools.marks&&hasSchool(x,'M-02')){o.stage='PREPARED';say(s,'已经建立局部限制条件；仍需独立容器与身体承载。');}else say(s,'当前工具或行为未建立有效限制，不能只凭看见就安全驾驭。');}
 else if(k.startsWith('drive:')){const id=k.slice(6),o=x.opportunities.find(o=>o.id===id);o.attempted=true;o.resolved=true;const g=makeSpirit(id);if(o.stage!=='PREPARED'||s.bags===0||s.life<40||hostState(s).effectiveBurden+g.burden>hostState(s).hostCapacity){o.stage='FAILED';x.pressure=Math.min(12,x.pressure+3);s.life=Math.max(1,s.life-25);say(s,'驾驭条件不足，机会丢失并受到侵蚀。没有获得灵异，也没有强制死亡。');}else{s.bags--;o.stage='SUCCESS';x.drivingCount++;s.spirits.push(g);s.outcomes[id]='已驾驭';s.knowledge[id]={clues:['movement','witness','power'],hypotheses:{true:'confirmed'}};say(s,'主动驾驭'+g.name+'，消耗隔离袋×1。负荷与单鬼初始复苏按既有配置建立，开发度仍为0。');}}
 else if(k==='wait')say(s,'保持克制观察。等待也是一次有效行动，世界不会停住。');
 return used;
}
function softReady(x){return [hasSchool(x,'M-00')&&x.tools.map,hasSchool(x,'K-01')&&hasSchool(x,'M-01'),hasSchool(x,'M-02')&&(hasSchool(x,'S-01')||hasSchool(x,'M-03')),hasSchool(x,'Z-01')||hasSchool(x,'Z-03'),hasSchool(x,'K-03')&&x.tools.marks,x.playerEscaped][x.window];}
function commitNode(s,id){const x=s.school;if(x.nodes.includes(id))return;x.nodes.push(id);x.missedScenes.push({sceneId:id,occurred:true,observed:false,secondhandKnown:false});
 const anchor={1:['CA-01','CA-10'],3:['CA-02'],5:['CA-03'],9:['CA-04'],11:['CA-05'],13:['CA-06','CA-07','CA-08'],19:['CA-09']}[id]||[];for(const a of anchor)once(x.anchors,a);
 if(id===13)x.canonInstances=[{id:'canon-yang-eye',owner:'杨间',name:'鬼眼'}];if(id===19)x.canonResolved=true;
}
export function advanceSchool(s,action){const x=s.school;if(!x?.started)return;const justStarted=['school:start','school:outside'].includes(action);if(!justStarted){x.elapsed++;x.windowTicks++;}
 const w=windows[x.window];for(let i=0;i<w.nodes.length;i++)if(x.windowTicks>=(w.nodes[i]===19?6:i*2))commitNode(s,w.nodes[i]);
 if(!x.canonResolved&&x.window<5&&x.windowTicks>=w.min&&(softReady(x)||x.windowTicks>=w.hard)&&w.nodes.every(id=>x.nodes.includes(id))){
  x.window++;x.windowTicks=0;for(const e of x.mapEdges)e.status='STALE';
  x.actors.yang={zone:x.window===4?'hall':x.window===5?'exit':x.window===2?'tree':'lecture',goal:x.window>=5?'寻找离开路径':'调查并求生'};x.actors.zhou={zone:'lecture',goal:x.window>=3?'应对灵异与自身代价':'临时讲课'};commitNode(s,windows[x.window].nodes[0]);
  if(x.active)say(s,['','灯光开始不稳定。走廊有人停下，敲门声方向无法确定。','按照熟悉的路线移动，也可能无法抵达原来的位置。','远处出现力量干涉后的痕迹，环境短时趋于安静。','通信与声音再次异常。不能把任何来源当作安全保证。','操场方向短时出现更清楚的边界，旧路线需要现场复核。'][x.window]);
 }
 if(x.window===5&&x.windowTicks>=6&&!x.canonResolved)for(const id of windows[5].nodes)commitNode(s,id);
 if(x.canonResolved&&(!x.participated||x.playerEscaped)&&!s.chapter.worldHistory.some(n=>n.id==='escape')){legacyComplete(s);if(!x.participated)x.result='OUTSIDE';}
 if(x.canonResolved&&x.active&&!x.residual&&x.windowTicks>=windows[5].hard){x.residual=true;x.result='TRAPPED';say(s,'正常撤离人群已经远去。你仍在残余异常区域，可继续寻找出口，不能直接传送安全屋。');}
 if(!x.active){if(x.records[0]?.tick===s.tick)finishSchoolRecord(s);return;}
 if(x.shield)x.shield--;
 if(x.pressure&&x.shield===0){if(x.earsCovered&&x.audioStopped)x.pressure=Math.max(0,x.pressure-1);else{x.pressure=Math.min(12,x.pressure+1);if(x.pressure>=8){s.life=Math.max(0,s.life-20);say(s,'身后脚步近得难以辨认方向，身体受到侵蚀。');}}}
 if(x.window>=4&&x.windowTicks%6===0&&x.group.members.length){x.group.panic=Math.min(5,x.group.panic+1);if(x.group.panic>=4)x.group.followState='HESITANT';}
 for(const [id,n] of Object.entries(x.npcs)){if(n.state==='ALIVE'&&!n.warned&&!x.group.members.includes(id)&&x.window>=4&&x.elapsed>=45+Object.keys(schoolPeople).indexOf(id)*4)n.state='MISSING';}
 if(x.residual){x.residualTicks++;if(x.residualTicks>=12){s.life=Math.max(0,s.life-20);say(s,'长期停留在残余区域持续受到侵蚀。');}}
 if(s.life===0||s.systems.death!=='alive'||s.crisis){x.active=false;record(s,s.crisis?'SPIRIT_REVIVAL':'PLAYER_DEATH');if(s.life===0)s.systems.death='pending';say(s,'个人路线中断。正史与已有证据不会回滚；已有致死反应资源仍按原规则处理。');finishSchoolRecord(s);}
}
export function finishSchoolRecord(s){const x=s.school,r=x?.records[0];if(r&&r.tick===s.tick)r.revivalDelta=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress-(x.startRevival[g.id]??0)]));}
// A committed personal ending advances only the remaining school world ledger.
// It grants no player observations, resources, rescue or revival rollback.
export function finishSchoolWorldAfterDeath(s){const x=s.school;if(!x?.started||s.systems.death!=='committed')return;for(let i=0;!x.canonResolved&&i<120;i++){s.tick++;advanceSchool(s,'world:school');}}
