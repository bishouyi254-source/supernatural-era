import {transitReady,transitBusy,transitKnown,transitCounter,transitSources,transitCapacity} from './transit-model.js';
import {activeIds} from './v1.js';
import {ruleBlocked} from './evolution-model.js';
import {resetTemporary} from './rules.js';
const log=(s,text)=>{const t=s.bus.transit;t.history.push(text);t.history=t.history.slice(-100);s.journal.push(text);};
const know=(s,id)=>{if(!transitKnown(s,id))s.bus.transit.knowledge.push(id);};
function evidence(s,id,text,subject='vehicle',level='SUPPORTED'){const t=s.bus.transit;know(s,id);if(!t.evidence.some(e=>e.id===id))t.evidence.push({id,text,subject,level,tick:s.tick,receivedBy:'player'});}
function person(id,name,type,seat,visible=true,counted=false,source=null){return {id,name,label:id,appearance:'外观与静止反应，不能据此判断主导权',type,seat,visible,counted,source,confirmed:'UNKNOWN',aboard:true};}
function roster(){return [person('human-a','普通乘客甲','human','front'),person('human-b','普通乘客乙','human','middle'),person('human-c','普通乘客丙','human','rear'),person('yang','同行者','controller','middle'),person('xu','许峰','controller','rear'),person('lin','林北','controller','rear'),person('rider','静止乘客','spirit','front',true,true,transitSources.rider),person('unseen','不可见乘客','spirit',null,false,true,transitSources.unseen)];}
export function transitAvailable(s){if(!transitReady(s))return [];const t=s.bus.transit,b=s.bus;if(!t.started)return s.systems.death==='alive'&&!s.crisis?['tr:start','tr:decline']:[];if(t.completed)return [];
 if(s.systems.death==='committed')return [];if(s.systems.death==='pending')return ['death:commit',...(s.systems.items.barrier>0?['tr:rescue-self']:[])];if(s.crisis)return ['death:commit',...(s.systems.items.barrier>0?['tr:shield']:[])];
 if(!t.participating)return ['tr:wait',...(t.window===0?['tr:board']:[])];
 if(t.stranded)return ['tr:wait',...(t.exploration<3?['tr:explore']:[]),...(t.exploration>=3?['tr:escape']:[])];
 const out=['tr:wait'];if(t.window===0&&!b.onBus)return ['tr:observe','tr:board','tr:decline'];
 if(b.onBus){if(!transitKnown(s,'window-'+t.window))out.push('tr:observe');if(t.window>=3){out.push('tr:counter');if(!transitKnown(s,'capacity'))out.push('tr:capacity');for(const p of t.passengers.filter(p=>p.visible&&p.aboard)){if(!transitKnown(s,'look-'+p.id))out.push('tr:passenger:'+p.id);}if(!transitKnown(s,'npc-xu'))out.push('tr:talk:xu');if(!transitKnown(s,'npc-lin'))out.push('tr:talk:lin');}
 for(const pos of ['front','middle','rear','door'])if(pos!==t.position)out.push('tr:move:'+pos);
 out.push('tr:disturb');if(t.stop==='wilderness'&&t.windows>0)out.push('tr:disembark');if(t.stop==='reality'&&t.windows>0)out.push('tr:leave','tr:stay');
 if(b.busState==='ENGINE_OFF'){if(s.systems.items.barrier>0)out.push('tr:shield','tr:isolate-sound');if(s.energy>0)for(const g of s.spirits.filter(g=>activeIds(s).includes(g.id)&&!ruleBlocked(s,g.id)))out.push('tr:ability:'+g.id);const eye=s.spirits.find(g=>g.sourceId==='eye'&&activeIds(s).includes(g.id)&&!ruleBlocked(s,g.id));if(eye&&s.energy>0&&eye.development>=50&&eye.awakeningProgress>=70&&eye.revivalProgress<95)out.push('tr:reset');out.push('tr:flee');}
 if(t.window===13&&!t.cloth.observed)out.push('tr:cloth');if(t.window===14&&!transitKnown(s,'cemetery'))out.push('tr:cemetery');if(!transitKnown(s,'device'))out.push('tr:device');
 }else if(t.stop==='wilderness'&&t.windows>0)out.push('tr:return',...(t.exploration<3?['tr:explore']:[]));
 return out;}
function harm(s,n){const t=s.bus.transit;if(t.protection){t.protection=0;log(s,'有限保护拦截本次接触风险，保护窗口已消耗。');return;}s.life=Math.max(0,s.life-n);if(s.life===0)s.systems.death='pending';}
function enter(s){const t=s.bus.transit,b=s.bus;t.anchors=Array.from({length:t.window+1},(_,i)=>'CA-23-'+(300+i));b.phase=t.window;
 if(t.window===1)b.busState='RUNNING';
 if(t.window===4){b.busState='STOPPED_AT_STATION';t.stop='wilderness';t.windows=3;log(s,'车辆自主停站；车外为未定位荒地。停站不是熄火，窗口未获确认。');}
 if(t.window===6){b.busState='RUNNING';t.stop=null;t.windows=0;if(!t.passengers.some(p=>p.id==='cry'))t.passengers.push(person('cry','哭声关联乘客','spirit','rear',true,true,transitSources.cry));if(!b.onBus&&t.participating){t.stranded=true;log(s,'公交已离开，你被留在外围。不能从地图传送安全屋。');}}
 if(t.window===7){b.busState='ENGINE_OFF';b.shutdowns++;t.soundIsolation=false;log(s,'车辆熄火，外部压制失效。各鬼与宿主重新判定；无维修和自动战斗按钮。');}
 if(t.window===11&&!t.passengers.some(p=>p.id==='bride')){t.passengers.push(person('bride','新娘外形乘客','spirit','front',true,true,transitSources.bride));t.sourceLinks.push({from:transitSources.cry,to:transitSources.bride,kind:'CO_PRESENT',tick:s.tick});}
 if(t.window===12){b.busState='RESTARTING';t.soundIsolation=false;log(s,'车辆再次发动，规则恢复。死亡、复苏、消耗与证据没有回滚。');}
 if(t.window===13){b.busState='RUNNING';t.cloth.owner='CANON-YANG';t.cloth.holder='CANON-YANG';}
 if(t.window===14){t.stop=null;t.windows=0;b.busState='RUNNING';log(s,'车辆路过异常坟场，没有观察到停车或开门。不能把路过当作可进入地图。');}
 if(t.window===15){b.busState='NORMAL_WORLD';t.stop='reality';t.windows=3;t.yangDisembarked=true;const yang=t.passengers.find(p=>p.id==='yang');if(yang)yang.aboard=false;log(s,'现实停站机会出现。杨间按正史离车，许峰和林北继续各自选择；你的决定独立。');}
 if(t.window===16){b.busState='RUNNING';t.stop=null;t.windows=0;if(b.onBus){t.route='SURVIVOR';log(s,'你仍留在公交，城市生活暂停。正史离车不强制你离车，后续仅有限交通循环。');}else if(!t.stranded)complete(s,t.participating?'现实离车':'未同行，仅保存接触记录');}
}
function complete(s,mode){const t=s.bus.transit,b=s.bus;t.completed=true;t.visibility='LOST';b.active=false;b.onBus=false;t.stranded=false;t.stop=null;t.windows=0;t.record={mode,chapter:300+t.window,newSpirits:0,formalXArchive:false,revivalChanges:Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress-(t.initialRevivals[g.id]??g.revivalProgress)]))};log(s,'本次交通经历归档。车辆仍存在，当前位置不可观察；不自动建立第317章正式X档案。');}
export function applyTransit(s,a){const t=s.bus.transit,b=s.bus,k=a.slice(3);let used=null,extra=null;
 if(k==='start'||k==='decline'&&!t.started){t.started=true;t.participating=k==='start';t.legacy={record:structuredClone(b.record),xArchive:b.xArchive,cloth:structuredClone(b.cloth),completed:b.completed};t.passengers=roster();t.initialRevivals=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress]));t.visibility='OBSERVABLE';b.started=true;b.active=true;b.onBus=false;b.busState='APPROACHING';enter(s);log(s,'继续核对异常道路与设备线索；未知车辆不预先认证为副本。旧公交档案与资产历史保留。');return {used,extra};}
 if(k==='board'){t.participating=true;b.onBus=true;t.progress=0;t.window=1;enter(s);log(s,'实际进入车厢。你不能接管方向盘或召唤目的站。');return {used,extra};}
 if(k==='decline'){t.participating=false;b.onBus=false;log(s,'你未同行。正史继续，未目击的车内情形不自动进入档案。');}
 else if(k==='observe'){evidence(s,'window-'+t.window,['异常车辆线路尚未核实。','GPS与道路记录不一致，隔绝程度有待核验。','司机已无法正常操作，车辆仍继续行驶。','乘客外貌和静止状态不能证明身份。','车辆自主停站，外部道路无法定位。','站外哭声与坟的关联可观察，完整作用条件未知。','停站后乘客与车厢电子屏出现变化。','熄火后限制减弱，危险显著变化。','未知规则压力存在，作用目标尚未完整核查。','听觉信息受干扰，文字仍保留可观察提示。','对象反应不同，不能用单一条件概括全部规律。','多个独立来源共同出现，不证明它们同源。','再次发动后活动受限，历史代价保留。','特殊媒介出现；观察不赋予所有权。','异常坟场仅从车内路过。','有同行者依赖车辆压制暂时维持。','正史离车与玩家离车分别记录。'][t.window]);}
 else if(k==='counter'){const c=transitCounter(s);t.counterHistory.push({tick:s.tick,window:t.window,display:c.display});t.counterHistory=t.counterHistory.slice(-30);evidence(s,'counter','已实际读到电子屏数字；含义仍需独立解释。');if(transitKnown(s,'npc-xu'))t.counterMeaning='SUPPORTED';if(t.counterMeaning==='SUPPORTED'&&c.independentSpirits>t.passengers.filter(p=>p.aboard&&p.type==='spirit'&&p.visible).length)evidence(s,'counter-mismatch','计数与可见对象有差异，不可定位隐藏乘客。');}
 else if(k==='capacity'){t.capacityKnowledge='SUPPORTED';evidence(s,'capacity','观察到36座结构；座位数、普通人数和设施鬼数不同，满载后果尚未确认。');}
 else if(k.startsWith('passenger:')){const id=k.slice(10);evidence(s,'look-'+id,'保存外观和当前反应；生命、历史身份与主导权未全面确认。',id,'SUSPECTED');}
 else if(k.startsWith('talk:')){const id=k.slice(5);evidence(s,'npc-'+id,id==='xu'?'许峰谈到电子屏与长期乘车经验；依赖车辆压制是其当前动机之一，情报有适用边界。':'林北有自己的生存判断，不自动追随许峰或玩家。未确认其全部构筑与秘密。',id);if(id==='xu'&&t.counterHistory.length)t.counterMeaning='SUPPORTED';const p=t.passengers.find(p=>p.id===id);p.confirmed='SUPPORTED';}
 else if(k.startsWith('move:')){t.position=k.slice(5);log(s,'移动只改变本人车厢位置，不安排乘客座位，也不改变其身份。');}
 else if(k==='disturb'){b.stability=Math.max(0,b.stability-25);harm(s,15);evidence(s,'disturb','主动接触破坏车厢安静，未关押任何源头。');}
 else if(k==='disembark'){b.onBus=false;log(s,'下车进入荒野外围，回程公交窗口仍在流逝。');}
 else if(k==='return'){b.onBus=true;t.stranded=false;log(s,'公交仍停靠时返回；探索记录和代价保留。');}
 else if(k==='explore'){t.exploration++;harm(s,8);evidence(s,'explore-'+t.exploration,'实际调查外围路径；当前位置不等于可靠现实坐标。');}
 else if(k==='escape'){if(s.v1.items.medium>0)s.v1.items.medium--;else harm(s,20);if(s.systems.death==='alive')complete(s,'三次实地核查后的外围回归（游戏适配）');return {used,extra};}
 else if(k==='leave'){b.onBus=false;log(s,'你在现实道路下车。当前行程仍记录车辆世界状态，不销毁公交。');if(t.route==='SURVIVOR'){complete(s,'长期乘车后在现实停站离开');return {used,extra};}}
 else if(k==='stay'){t.route='SURVIVOR';t.windows=0;t.window=16;t.progress=0;enter(s);return {used,extra};}
 else if(k==='shield'||k==='rescue-self'){s.systems.items.barrier--;t.protection=1;if(k==='rescue-self'){s.systems.death='alive';s.life=1;}if(s.crisis)s.spirits.filter(g=>g.revivalProgress===100).forEach(g=>g.suppressionRemaining=2);log(s,'消耗既有符膜，提供一个局部保护窗口；不复原公交或历史复苏。');}
 else if(k==='isolate-sound'){s.systems.items.barrier--;t.soundIsolation=true;evidence(s,'sound-isolation','使用既有隔离条件限制本次声音通道；不等于关押哭声来源或免疫其他来源。');}
 else if(k.startsWith('ability:')){used=k.slice(8);s.energy--;t.protection=1;evidence(s,'ability-'+used,'调用本人灵异进行局部保护；不能直接读出其他乘客主导权。');}
 else if(k==='reset'){const eye=s.spirits.find(g=>g.sourceId==='eye');s.energy--;s.life=resetTemporary(s,{life:100},{id:'transit-eye-reset',kind:'divine',scope:'self',fields:['life']}).life;t.protection=1;extra={id:eye.id,amount:18};log(s,'重启仅恢复自身临时身体状态，保留公交熄火、乘客、物资、设备、命运、历史复苏及本次代价。');return {used,extra};}
 else if(k==='flee'){b.onBus=false;t.stranded=true;t.stop=null;t.windows=0;log(s,'熄火时离开车厢；当前位置与回程出口未知。');}
 else if(k==='cloth'){t.cloth.observed=true;evidence(s,'cloth','杨间获得一件唯一遮脸布。当前持有人杨间；玩家未取得，完整作用未知。');}
 else if(k==='cemetery')evidence(s,'cemetery','从车内路过异常坟场，未停站。它与此前哭坟地点是否相同尚未证实。');
 else if(k==='device')evidence(s,'device','核对旧指定设备线索；断续信号不保证可实时定位公交或设备主人。');
 else log(s,'克制行动，等候一次。世界与每只鬼仍独立结算。');
 if(t.completed)return {used,extra};
 if(transitCapacity(s)==='FULL'){b.stability=Math.max(0,b.stability-5);log(s,'设施鬼乘客载量达到容量边界，车厢秩序风险上升。未判定固定伤害或泄露未验证的满载秘密。');}
 if(b.busState==='ENGINE_OFF'&&['disturb','move:door'].includes(k)&&!t.soundIsolation){harm(s,8);evidence(s,'cry-channel','熄火暴露时声音通道风险增加，不能推出全部声音杀人规律。','cry');}
 if(t.stop&&t.windows>0){const stop=t.stop;t.windows--;if(t.route==='FIRST'){if(t.windows>0){if(stop==='wilderness'){t.window=5;t.progress=0;enter(s);}return {used,extra};}t.window=stop==='wilderness'?6:16;t.progress=0;enter(s);return {used,extra};}if(t.windows>0)return {used,extra};if(stop==='wilderness'&&!b.onBus)t.stranded=true;}
 if(t.route==='SURVIVOR'&&t.window===16){t.progress++;if(t.progress<3)return {used,extra};t.progress=0;t.cycle++;if(t.cycle%6===1){b.busState='STOPPED_AT_STATION';t.stop='wilderness';t.windows=3;}else if(t.cycle%6===2){b.busState='ENGINE_OFF';t.stop=null;b.shutdowns++;}else if(t.cycle%6===3)b.busState='RESTARTING';else if(t.cycle%6===4){b.busState='NORMAL_WORLD';t.stop='reality';t.windows=3;}else{b.busState='RUNNING';t.stop=null;}return {used,extra};}
 t.progress++;if(t.progress>=3){t.progress=0;t.window=Math.min(16,t.window+1);enter(s);}return {used,extra};}
export function recordTransitDeath(s){const t=s.bus?.transit;if(!t?.started||t.completed||t.deathRecorded||s.systems.death!=='committed')return;t.deathRecorded=true;s.bus.stability=Math.max(0,s.bus.stability-30);log(s,'宿主死亡已提交，车内遗留灵异风险改变；下一站不自动复活。');complete(s,'死亡记录');}
