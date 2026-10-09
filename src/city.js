import {activeIds} from './v1.js';
// V1.4 game abstraction. All numeric budgets and original support characters are game tuning.
export const districts={shelter:'临时安全屋',residential:'失联住宅区',hospital:'医院运输点',control:'通讯中继点',school:'七中外围'};
export const cityPhases=['孕育','扩散','灾难','源头完全活动'];
export const windows=['定位源头','压制鬼域','清理干扰','关键接触','完成限制'];
export const support={locator:{name:'周岑（原创）',role:'定位',initial:35,usage:14},suppressor:{name:'许岚（原创）',role:'压制',initial:50,usage:18},protector:{name:'田宁（原创）',role:'保护',initial:45,usage:16}};
export const evidence={residential:'目击报告支持初生衍生单位通过看见寻找目标；仍需区分个体。',hospital:'接触记录出现共同印记，支持接触媒介已扩展。',control:'声音媒介是高级衍生单位的可疑线索；当前仍为推测。',school:'核心行动需定位、压制与特殊限制物，常规力量不能杀死源头。'};
export function newCity(){return {format:1,started:false,active:false,completed:false,elapsed:0,phase:0,location:'shelter',pollution:20,domain:25,communication:75,transport:70,reliability:70,survivors:'正常',growth:15,slaves:[{id:'slave-1',kind:'初生',restricted:false},{id:'slave-2',kind:'成熟',restricted:false},{id:'slave-3',kind:'高级',restricted:false}],safehouse:{seal:70,supplies:3,internal:false},resources:{protection:3,medium:2,fragments:0},tasks:[],evidence:[],contribution:0,team:[],npcs:Object.fromEntries(Object.entries(support).map(([id,n])=>[id,{revivalProgress:n.initial,status:'可行动',calls:0}])),window:null,windowHistory:[],milestones:[],residuals:[],history:[],settlement:null};}
export function attachCity(s){return s.city?s:{...s,city:newCity()};}
export function cityUnlocked(s){return !!(s.journey?.chapters.village.completed||s.village?.aftermath.submitted&&s.village.world.vanished);}
const clamp=n=>Math.max(0,Math.min(100,n));
const has=(c,id)=>c.tasks.includes(id);
export function sourceKnowledge(c){return c.evidence.length*25;}
export function cityThreat(c){return c.completed?'源头已限制，残余危险仍在':sourceKnowledge(c)<50?'未知':c.growth>=70?'源头完全活动':c.phase>=2?'城市级威胁':'持续成长';}
export function teamAvailable(c,role){return c.team.includes(role)&&c.npcs[role].status==='可行动'&&c.npcs[role].revivalProgress<80;}
function record(c,text){c.history.push(text);c.history=c.history.slice(-80);}
function task(c,id,points){if(!has(c,id)){c.tasks.push(id);c.contribution+=points;}}
function addResidual(c,id,title,kind){if(!c.residuals.some(r=>r.id===id))c.residuals.push({id,title,kind,stage:0,method:null});}
function finishCity(c,mode){
 if(c.completed)return;
 c.completed=true;c.active=false;c.window=null;c.phase=3;
 if(!c.milestones.includes('restriction'))c.milestones.push('restriction');
 c.resources.fragments+=2;
 addResidual(c,'street','封锁街区 · 残余鬼奴','derivative');
 addResidual(c,'building','异常建筑 · 同源媒介','medium');
 addResidual(c,'missing','失联记录 · 遗留规则','archive');
 c.settlement={mode,contribution:c.contribution,grade:c.contribution>=60?'A':c.contribution>=30?'B':c.contribution>0?'C':'生存撤离',tasks:[...c.tasks]};
 record(c,'源头由正史行动队完成限制。城市污染、失联记录与残余事件仍在；玩家贡献独立结算。');
}
export function advanceCity(s,cost=1){
 const c=s.city;if(!c.started||c.completed)return;
 for(let i=0;i<cost&&!c.completed;i++){
  c.elapsed++;c.phase=Math.max(c.phase,Math.min(3,Math.floor(c.elapsed/6)));
  for(const [at,id,kind] of [[6,'slave-4','成熟'],[12,'slave-5','高级'],[18,'slave-6','特殊']])if(c.elapsed>=at&&!c.slaves.some(g=>g.id===id)){c.slaves.push({id,kind,restricted:false});record(c,'新增'+kind+'衍生单位，源头生态持续扩散。');}
  c.pollution=clamp(c.pollution+(has(c,'slaves')?1:2));c.domain=clamp(c.domain+2);c.growth=clamp(c.growth+(has(c,'slaves')?1:3));
  c.communication=clamp(c.communication-(c.domain>=60?3:1));c.transport=clamp(c.transport-(c.domain>=70?3:1));c.reliability=clamp(c.reliability-(has(c,'route')?0:2));
  c.safehouse.seal=clamp(c.safehouse.seal-(c.pollution>=60?3:1));c.safehouse.internal=c.safehouse.seal<35&&c.pollution>=60;
  c.survivors=has(c,'rescue')?(c.phase>=3?'危急（局部已救援）':'大量失联（局部已救援）'):c.phase>=3?'极低':c.phase>=2?'危急':c.phase>=1?'大量失联':'正常';
  for(const [id,n] of Object.entries(c.npcs))if(c.team.includes(id)&&n.status==='可行动'){
   if(c.domain>=70&&c.pollution>=60)n.revivalProgress=clamp(n.revivalProgress+5);
   if(n.revivalProgress===100){n.status='确认死亡';addResidual(c,'npc-'+id,support[id].name+'遗留厉鬼','legacy');record(c,support[id].name+'死亡已提交，遗留厉鬼形成独立残余事件。');}
   else if(n.revivalProgress>=80)n.status='高复苏退出';
  }
  for(const [at,id,text] of [[6,'disaster','城市灾难开始，通讯与道路异常扩大（GDD锚点）。'],[12,'yang-missing','杨间暂时离开行动网络；不把失联认证为玩家已知死亡。'],[18,'yang-return','正史核心人物重新接入，重返七中与源头方案继续（GDD锚点）。']])if(c.elapsed>=at&&!c.milestones.includes(id)){c.milestones.push(id);record(c,text);}
  if(c.elapsed>=36)finishCity(c,'正史行动队收束');
 }
}
export function cityAvailable(s){const c=s.city;
 if(s.dachang?.started||!c||!cityUnlocked(s)||s.scene!=='hub'||s.combat||s.journey.active||s.systems.death!=='alive'||s.crisis||s.systems.second?.stage==='unstable')return [];
 if(!c.started)return ['city:start'];
 if(c.completed){const out=[];for(const r of c.residuals){if(r.stage===0)out.push('city:residual:inspect:'+r.id);if(r.stage===1){out.push('city:residual:official:'+r.id);if(c.resources.medium>0)out.push('city:residual:seal:'+r.id);}}return out;}
 if(!c.active)return ['city:return','city:world'];
 if(c.window!==null){const w=c.window,out=['city:withdraw','city:window:perimeter'];
  if(w===0&&(has(c,'route')||c.evidence.includes('school')))out.push('city:window:locate');
  if(w===1){if(s.energy>0)out.push(...s.spirits.filter(g=>activeIds(s).includes(g.id)&&g.development>=25&&!s.systems.combinations.some(x=>x.disabledId===g.id)).map(g=>'city:window:ability:'+g.id));}
  if(w===2&&has(c,'slaves'))out.push('city:window:clear');
  if(w===3&&has(c,'cargo')&&c.resources.protection>0)out.push('city:window:contact');
  if(w===4)out.push('city:window:restrict');
  const role=w===0?'locator':w===1?'suppressor':w===3?'protector':null;
  if(role&&teamAvailable(c,role))out.push('city:window:ally:'+role);
  return out;
 }
 const out=['city:wait','city:withdraw'];
 out.push(...Object.keys(districts).filter(id=>id!==c.location).map(id=>'city:move:'+id));
 if(evidence[c.location]&&!c.evidence.includes(c.location))out.push('city:observe');
 if(c.location==='shelter'){
  if(c.safehouse.supplies>0)out.push('city:rest');
  if(!has(c,'safehouse')&&c.resources.medium>0)out.push('city:seal');
  if(c.communication>=30&&c.team.length<2)out.push(...Object.keys(support).filter(id=>!c.team.includes(id)&&c.npcs[id].status==='可行动').map(id=>'city:assign:'+id));
 }
 if(!has(c,'route'))out.push('city:route');
 if(c.location==='residential'){
  if(!has(c,'rescue'))out.push('city:rescue');
  if(!has(c,'slaves')){if(c.resources.protection>0)out.push('city:slaves:item');if(teamAvailable(c,'suppressor'))out.push('city:slaves:ally');if(s.energy>0)out.push(...s.spirits.filter(g=>activeIds(s).includes(g.id)&&!s.systems.combinations.some(x=>x.disabledId===g.id)).map(g=>'city:slaves:ability:'+g.id));}
 }
 if(c.location==='control'&&!has(c,'comms'))out.push('city:comms');
 if(c.location==='hospital'&&!has(c,'cargo'))out.push('city:cargo');
 if(c.location==='school'&&c.elapsed>=12&&c.elapsed<18&&sourceKnowledge(c)>=75&&has(c,'cargo')&&s.spirits.filter(g=>g.development>=50).length>=2)out.push('city:converge');
 if(c.location==='school'&&c.elapsed>=18&&sourceKnowledge(c)>=50)out.push('city:final');
 return out;
}
function callAlly(c,id){const n=c.npcs[id];n.calls++;n.revivalProgress=clamp(n.revivalProgress+support[id].usage);record(c,support[id].name+'执行'+support[id].role+'；其独立复苏增加，不能无限调用。');}
export function applyCity(s,a){const c=s.city,k=a.slice(5);let cost=1,used=[];
 if(k==='start'){c.started=true;c.active=true;record(c,'进入大昌市城市事件；普通人与驭鬼者均可承担外围任务。');}
 else if(k==='return'){c.active=true;record(c,'重新进入城市，先前污染、资源、NPC与行动窗口保持。');}
 else if(k==='world')record(c,'你在外围等待行动报告。世界按节点推进，不依赖在线时长。');
 else if(k==='withdraw'){c.active=false;cost=c.domain>=70&&!has(c,'route')?2:1;if(cost===2){s.life=Math.max(0,s.life-15);record(c,'鬼域阻碍撤离，消耗2节点并受侵蚀15；离开不重置城市。');}else record(c,'经已知路线撤出，城市事件继续。');}
 else if(k.startsWith('move:')){const id=k.slice(5);cost=c.transport<35?2:1;
  const lost=c.reliability<30&&!has(c,'route')&&!teamAvailable(c,'locator');
  if(lost){cost=2;record(c,'道路环回，位置未改变。可先校核路线或邀请定位队员。');}else {c.location=id;record(c,'移动至'+districts[id]+'，消耗'+cost+'行动节点。');}}
 else if(k==='observe'){c.evidence.push(c.location);record(c,evidence[c.location]);}
 else if(k==='route'){cost=1;c.reliability=clamp(c.reliability+35);c.transport=clamp(c.transport+20);task(c,'route',8);record(c,'校核安全路线，地图可信度与运输条件改善。');}
 else if(k==='rescue'){cost=2;task(c,'rescue',20);record(c,'一批原创外围幸存者送往安全屋；不虚构全城精确人口。');}
 else if(k==='comms'){cost=2;c.communication=clamp(c.communication+40);task(c,'comms',12);record(c,'修复中继点，恢复协作联络与行动队安排。');}
 else if(k==='cargo'){cost=2;c.resources.protection++;c.resources.medium++;task(c,'cargo',12);record(c,'护送有限防护与隔离媒介；运输任务不可重复领取。');}
 else if(k==='seal'){cost=2;c.resources.medium--;c.safehouse.seal=clamp(c.safehouse.seal+25);task(c,'safehouse',10);record(c,'补齐隔离边界，耗用媒介1。');}
 else if(k==='rest'){c.safehouse.supplies--;s.energy=3;s.life=Math.min(100,s.life+20);if(c.safehouse.internal)s.life=Math.max(0,s.life-10);record(c,'安全屋物资－1，恢复行动能力；内部异常侵蚀另计，复苏不减少。');}
 else if(k.startsWith('assign:')){const id=k.slice(7);c.team.push(id);record(c,'临时行动队加入'+support[id].name+'，角色为'+support[id].role+'。');}
 else if(k.startsWith('slaves:')){
  cost=2;if(k==='slaves:item')c.resources.protection--;else if(k==='slaves:ally')callAlly(c,'suppressor');else {s.energy--;used=[k.slice(15)];}
  c.slaves[0].restricted=true;c.slaves[1].restricted=true;task(c,'slaves',16);c.pollution=clamp(c.pollution-12);record(c,'关键鬼奴媒介被限制，获得通行条件与样本，不提供经验或击杀奖励。');
 }
 else if(k==='final'||k==='converge'){c.window=0;record(c,k==='converge'?'玩家高阶双规则提前定位五窗口方案；城市核心锚点继续推进，杨间正史实例不删除。':'正史核心队伍执行源头方案。玩家可支援五个行动窗口，或承担外围工作。');}
 else if(k.startsWith('window:')){
  const w=c.window;
  if(k==='window:perimeter'){record(c,'你维持外围通道；核心队伍承担'+windows[w]+'，不抢走NPC的正史作用。');}
  else {
   if(k.startsWith('window:ability:')){s.energy--;used=[k.slice(15)];}
   if(k.startsWith('window:ally:'))callAlly(c,k.slice(12));
   if(k==='window:contact')c.resources.protection--;
   task(c,'window-'+w,5);record(c,'玩家支援完成：'+windows[w]+'。');
  }
  c.windowHistory.push({index:w,method:k});c.window++;
  if(c.window===5)finishCity(c,'协作五窗口');
 }
 else if(k.startsWith('residual:')){
  const parts=k.split(':'),r=c.residuals.find(r=>r.id===parts[2]);
  if(parts[1]==='inspect'){r.stage=1;record(c,'已调查'+r.title+'；该残余尚未解决。');}
  else {cost=parts[1]==='seal'?2:3;if(parts[1]==='seal')c.resources.medium--;r.stage=2;r.method=parts[1];c.resources.fragments++;record(c,r.title+'已'+(parts[1]==='seal'?'隔离':'交接官方封锁')+'，获得残余规则片段1。');}
 }
 if(s.life===0)s.systems.death='pending';
 advanceCity(s,cost);return {used,cost};
}
export function validCity(s){const c=s.city;if(c===undefined)return true;
 const n=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max,unique=(a,allow)=>Array.isArray(a)&&new Set(a).size===a.length&&a.every(x=>allow.includes(x));
 if(!c||c.format!==1||!['started','active','completed'].every(k=>typeof c[k]==='boolean')||!n(c.elapsed,1e9)||!n(c.phase,3)||!districts[c.location]||c.active&&(!c.started||c.completed)||c.completed&&!c.started)return false;
 if(!['pollution','domain','communication','transport','reliability','growth'].every(k=>n(c[k],100))||!['正常','大量失联','危急','极低','大量失联（局部已救援）','危急（局部已救援）'].includes(c.survivors))return false;
 if(!c.safehouse||!n(c.safehouse.seal,100)||!n(c.safehouse.supplies,3)||typeof c.safehouse.internal!=='boolean'||!c.resources||!n(c.resources.protection,4)||!n(c.resources.medium,3)||!n(c.resources.fragments,20))return false;
 if(!unique(c.tasks,['route','rescue','comms','cargo','safehouse','slaves',...windows.map((_,i)=>'window-'+i)])||!unique(c.evidence,Object.keys(evidence))||!n(c.contribution,103)||!unique(c.team,Object.keys(support))||c.team.length>2)return false;
 if(!c.npcs||Object.keys(c.npcs).length!==3||Object.entries(support).some(([id])=>!c.npcs[id]||!n(c.npcs[id].revivalProgress,100)||!n(c.npcs[id].calls,10)||!['可行动','高复苏退出','确认死亡'].includes(c.npcs[id].status)||c.npcs[id].status==='确认死亡'&&c.npcs[id].revivalProgress!==100))return false;
 if(!Array.isArray(c.slaves)||c.slaves.length<3||c.slaves.length>6||c.slaves.some((v,i)=>!v||v.id!=='slave-'+(i+1)||v.kind!==['初生','成熟','高级','成熟','高级','特殊'][i]||typeof v.restricted!=='boolean'))return false;
 if(![null,0,1,2,3,4].includes(c.window)||c.window!==null&&(!c.started||c.completed)||!Array.isArray(c.windowHistory)||c.windowHistory.length>5||c.windowHistory.some((v,i)=>!v||v.index!==i||typeof v.method!=='string'||!v.method.startsWith('window:')))return false;
 if(!unique(c.milestones,['disaster','yang-missing','yang-return','restriction'])||!Array.isArray(c.history)||c.history.length>80||c.history.some(x=>typeof x!=='string'||x.length>2000)||!Array.isArray(c.residuals)||c.residuals.length>6||new Set(c.residuals.map(r=>r?.id)).size!==c.residuals.length)return false;
 if(c.residuals.some(r=>!r||!['street','building','missing',...Object.keys(support).map(id=>'npc-'+id)].includes(r.id)||typeof r.title!=='string'||r.title.length>100||!['derivative','medium','archive','legacy'].includes(r.kind)||!n(r.stage,2)||![null,'seal','official'].includes(r.method)||r.stage===2&&r.method===null))return false;
 if(c.completed&&(!c.settlement||!c.milestones.includes('restriction')||c.window!==null)||!c.completed&&c.settlement!==null)return false;
 if(c.settlement&&(!['协作五窗口','正史行动队收束'].includes(c.settlement.mode)||!n(c.settlement.contribution,103)||!['A','B','C','生存撤离'].includes(c.settlement.grade)||!unique(c.settlement.tasks,c.tasks)))return false;
 return true;
}
