import {transitPages,transitProjection,transitKnown,transitSuppression,transitMaintains,transitCapacity} from './transit-model.js';
import {transitAvailable} from './transit.js';
import {hostState,revivalStage,growthFor} from './spirits.js';
import {ruleBlocked} from './evolution-model.js';
export {transitPages};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const p=v=>'<p>'+esc(v)+'</p>';
const labels={start:'追踪下一段异常道路',decline:'暂不登车，保存未完成记录',board:'进入未知车辆',observe:'观察当前现象',wait:'保持克制，等候一次',counter:'读取车厢电子屏',capacity:'核对座位结构','talk:xu':'听取后排同行者经验','talk:lin':'向另一名同行者询问',disturb:'主动接触可疑乘客（高危）',disembark:'下车调查荒野外围',return:'返回仍停靠的公交',explore:'实地核查外围路径（身体−8）',escape:'沿已核查路径脱离（媒介或身体代价）',leave:'在现实停站下车',stay:'继续留车（暂停城市生活）',shield:'使用符膜保护（消耗1）','rescue-self':'使用既有符膜拦截待定死亡（消耗1）','isolate-sound':'隔离当前声音通道（符膜−1）',reset:'七层重启自身（能量−1，复苏＋18）',flee:'熄火时离开车厢（回程未知）',cloth:'观察获准的遮脸布记录',cemetery:'记录路过的异常坟场',device:'核对之前的指定设备线索','death:commit':'确认死亡结算'};
export function transitLabel(a){const k=a.slice(3);return a==='death:commit'?labels[a]:labels[k]|| (k.startsWith('move:')?'移动到'+({front:'前排',middle:'中排',rear:'后排',door:'车门边'})[k.slice(5)]:k.startsWith('passenger:')?'观察可见乘客 '+k.slice(10):k.startsWith('ability:')?'调用本人灵异 · 局部保护（能量−1）':'当前行动');}
export const transitRisk=a=>['tr:disturb','tr:disembark','tr:flee','tr:stay','tr:escape','tr:reset','tr:shield','tr:isolate-sound','tr:rescue-self','tr:leave'].includes(a)||a.startsWith('tr:ability:');
export function transitPrompt(s,a){return transitLabel(a)+'。'+(a==='tr:disembark'||a==='tr:flee'?'回程依赖当前车辆；车辆不会等待。错过后需实际核查出口，没有安全屋传送。':a==='tr:leave'?'离开后车辆压制不再作用于你；逐鬼重新判定宿主维持，已累计复苏不会清零。':a==='tr:stay'?'目的地不受控制，城市生活暂停，仍可能熄火和错过现实出口。':'物品、身体、调用复苏和实际后果会保留。')+' 预览和取消不推进时间。';}
export function transitScene(s){const t=s.bus.transit,b=s.bus,legal=transitAvailable(s);let goal='先确认异常车辆，再决定是否登车。',preferred=['tr:observe','tr:board'];
 if(t.completed)return {goal:'本次经历已归档。公交仍存在，当前位置未知；第317章正式X档案留待后续。',actions:[]};
 if(!t.started)return {goal:'第299章调查已归档。继续核对异常道路；没有设备线索也不伪造追踪结果。',actions:legal};
 if(!t.participating){goal='你尚未同行。世界继续，不会自动授予车内知识。';preferred=['tr:board'];}
 else if(t.stranded){goal='公交已离开。先核查三段外围路径，再选择有代价的回归方式。';preferred=['tr:explore','tr:escape'];}
 else if(!b.onBus&&t.stop==='wilderness'){goal='你在站外。公交仍停靠时可以立即返回，调查会消耗窗口。';preferred=['tr:return','tr:explore'];}
 else if(!b.onBus&&t.stop==='reality'){goal='你已在现实道路离车。等待车辆离开后归档；旧设备不保证实时定位。';preferred=[];}
 else if(t.window===0){}
 else if(t.stop==='reality'){goal='现实道路出现。先评估离车后的宿主状态，选择下车或继续留车。';preferred=['tr:leave','tr:stay','tr:observe'];}
 else if(b.busState==='ENGINE_OFF'){goal='车辆熄火。克制行动、核查当前威胁；保护和声音隔离各有限制。';preferred=['tr:observe','tr:shield','tr:isolate-sound'];}
 else if(t.window===13){goal='车辆恢复后可观察特殊媒介。正史物品不进入你的背包。';preferred=['tr:cloth','tr:observe'];}
 else if(t.window===14){goal='车辆路过坟场，没有停车。记录所见，不能直接进入。';preferred=['tr:cemetery','tr:observe'];}
 else if(t.window>=3&&!transitKnown(s,'npc-xu')){goal='核对电子屏和可见乘客；同行者解释需要实际听取，不能当作绝对真相。';preferred=['tr:counter','tr:talk:xu','tr:observe'];}
 else{goal='观察当前变化，按需展开乘客或停站档案；等待同样推进世界与复苏。';preferred=['tr:observe','tr:counter','tr:talk:lin'];}
 return {goal,actions:[...preferred.filter(a=>legal.includes(a)).slice(0,3),...(legal.includes('tr:wait')?['tr:wait']:[])]};}
const stateNames={APPROACHING:'未知车辆',RUNNING:'运行',STOPPED_AT_STATION:'正常停站',ENGINE_OFF:'熄火 · 车辆限制失效',RESTARTING:'再次发动',NORMAL_WORLD:'现实道路停站',DISAPPEARED:'当前不可观察'};
export function transitView(s,page='公交现场'){const t=s.bus.transit,b=s.bus,v=transitProjection(s),legal=transitAvailable(s),button=a=>legal.includes(a)?'<button data-action="'+esc(a)+'">'+esc(transitLabel(a))+'</button>':'',buttons=as=>'<div class="actions">'+as.map(button).join('')+'</div>',fact=id=>t.evidence.filter(e=>e.id===id).map(e=>p(e.text+' · '+({CONFIRMED:'已确认',SUPPORTED:'有依据支持',SUSPECTED:'推测'})[e.level])).join('');let body='<h2>'+esc(page)+'</h2>';
 if(page==='公交现场'){const scene=transitScene(s);body+=p(scene.goal)+p(t.started?'当前章节 '+v.chapter+' / '+v.title:'下一阶段 · 异常交通')+p('车辆：'+(t.visibility==='LOST'?'无法继续观察':stateNames[b.busState]||'未知'))+buttons(scene.actions);}
 if(page==='电子屏计数')body+=p(v.display===null?'电子屏尚未实际读取。':'最近实际读数 '+v.display+'；当前数字须再次观察。')+p(t.counterMeaning==='SUPPORTED'?'同行者经验支持数字与独立灵异乘客有关；不直接定位或识别个体。':'数字含义未确认，不能将其当作总人数。')+p(v.unseen)+p(v.capacity)+t.counterHistory.map(c=>p('行动 '+c.tick+' / 章节 '+(300+c.window)+'：显示 '+c.display)).join('')+buttons(['tr:counter','tr:capacity']);
 if(page==='乘客观察')body+=v.passengers.map(c=>'<section><h3>'+esc(c.name)+'</h3>'+p('外观：'+c.appearance)+p('历史身份：'+(c.identity==='SUPPORTED'?'本人已得到有限支持':'未知')+'；记忆与主导权：未知')+c.evidence.map(e=>p(e.text)).join('')+buttons(['tr:passenger:'+c.id])+'</section>').join('')+p(v.unseen);
 if(page==='车厢位置')body+=p('本人位置：'+({front:'前排',middle:'中排',rear:'后排',door:'车门边'})[t.position])+p('只显示实际可见对象的大致区域。未知乘客不标精确座位；位置不等于身份或安全等级。')+buttons(['tr:move:front','tr:move:middle','tr:move:rear','tr:move:door']);
 if(page==='车辆规则')body+=p('车辆是独立特殊设施。压制、保护、空间隔离与源头关押分别成立；运行不保证安全。')+p(v.capacity)+p('满载由设施鬼乘客计数判定，不由普通人坐满座位判定；具体后果未确认。')+fact('window-2')+buttons(['tr:capacity','tr:observe','tr:disturb']);
 if(['外部压制','宿主维持'].includes(page))body+=s.spirits.map(g=>'<section><h3>'+esc(g.name)+'</h3>'+p('负荷 '+g.burden+'；历史复苏 '+g.revivalProgress+'%【'+revivalStage(g.revivalProgress)+'】')+p('车辆外部压制：'+Math.round(transitSuppression(s,g)*100)+'%（游戏适配）')+p('宿主维持：'+(g.revivalProgress<100?'尚可维持':transitMaintains(s,g)||g.suppressionRemaining>0||ruleBlocked(s,g.id)?'依赖当前有效条件暂时维持':'缺少有效维持条件，进入危机'))+p('自然增长 '+growthFor(s,g).toFixed(2)+' / 节点；离车和熄火重新评估。')+'</section>').join('')+(!s.spirits.length?p('普通人没有体内复苏负担；仍会受外部规律影响。'):'')+p('暂时维持不等于完美驾驭，承载和历史复苏不降低。');
 if(['当前停站','离车判断'].includes(page))body+=p(t.stop==='wilderness'?'车门开启；外部荒地无法定位，停车时间未获确认。':t.stop==='reality'?'当前可观察现实停站，车门开放。':'没有观察到可用停站；不能强行从地图下车。')+p('回程：依赖公交或实际核查的条件出口。所在环境不等于可靠地图；当前停靠不保证车辆会等待。')+p('外围核查 '+t.exploration+' / 3（游戏行动预算）')+buttons(['tr:disembark','tr:return','tr:explore','tr:escape','tr:leave','tr:stay']);
 if(page==='熄火危机')body+=p(b.busState==='ENGINE_OFF'?'车辆压制当前失效。保护、声音隔离和每只鬼调用分别结算。':'当前未处于熄火危机。')+p('没有安全自动战斗或修车方案。是否接触、使用能力或离车需自行判断。')+buttons(legal.filter(a=>a==='tr:observe'||a==='tr:wait'||a==='tr:shield'||a==='tr:isolate-sound'||a==='tr:flee'||a==='tr:reset'||a==='tr:rescue-self'||a==='death:commit'||a.startsWith('tr:ability:')));
 if(page==='哭声观察')body+=fact('window-5')+fact('cry-channel')+fact('sound-isolation')+p('哭声关联Source与林落梅声音不同；关闭音量不能规避游戏规则。隔离一种通道不保证压制其他来源。')+buttons(['tr:observe','tr:isolate-sound']);
 if(page==='不同来源')body+=p('调查关系不等于Source同源；公交设施与此前红色报纸不是同一来源。')+fact('window-11')+p('未实际观察到的跨源关系不在前台展开，完整吸引条件仍待核实。');
 if(page==='许峰情报'||page==='林北情报')body+=fact('npc-'+(page==='许峰情报'?'xu':'lin'))+p('独立人物动机；不因玩家下车而强制其下车，不披露全部私有构筑。')+buttons(['tr:talk:'+(page==='许峰情报'?'xu':'lin')]);
 if(page==='遮脸布记录')body+=v.cloth?fact('cloth')+p('本次唯一物品持有人：杨间；玩家获得：否；完整作用：未知。'):p('本次尚未观察获准的物品记录。')+buttons(['tr:cloth']);
 if(page==='坟场观察')body+=fact('cemetery')+p('路过、停靠、可进入和已探索分别判断。未观察坟场不会生成完整地图。')+buttons(['tr:cemetery']);
 if(page==='设备线索')body+=p(v.device)+s.identityCase.tracking.observations.map(o=>p('历史设备采样：'+o.location+'；当前持有人未知。')).join('')+buttons(['tr:device']);
 if(page==='旅程归档')body+=p(t.completed?'本次记录已归档。车辆仍存在，玩家已失去当前观察连接。':'当前旅程尚未归档。')+p('第317章正式X档案未在本批开放。旧版已获得的X档案和玩家媒介历史不删除。')+t.history.slice(-12).map(p).join('');
 if(s.systems.death==='pending'||s.crisis)body+=buttons(['tr:rescue-self','tr:shield','death:commit']);const h=hostState(s);const nav=['公交现场','电子屏计数','乘客观察','当前停站'];return '<section class="hungry-workspace transit-workspace"><article>'+body+'</article><article><h3>你的宿主状态</h3>'+p('灵异承载 '+h.effectiveBurden+' / '+h.hostCapacity+'；总体平衡 '+h.balanceState+'；综合风险 '+h.hostRisk)+'</article><nav class="actions">'+nav.map(n=>'<button data-tab="'+n+'">'+n+'</button>').join('')+'</nav><details><summary>更多乘客、设施与生存档案</summary><nav class="actions">'+transitPages.map(n=>'<button data-tab="'+n+'">'+n+'</button>').join('')+'</nav></details>'+p('阅读与切页不耗时；实际观察、移动与等待推进时间。保护效力、窗口和外围回归为游戏适配。')+'</section>';}
