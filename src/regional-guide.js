import {regionalAvailable,currentRoute,planCheck} from './regional.js';
import {regionalKnown,regionalZones} from './regional-model.js';

// Presentation only: never grants evidence, routes, resources or safe actions.
export function regionalScene(s){
 const x=s.regional,available=regionalAvailable(s);
 const pick=(...items)=>items.flat(Infinity).filter(a=>available.includes(a)).slice(0,4);
 const scene=(title,text,goal,items)=>({title,text,goal,actions:pick(items)});
 const next=(title,text,goal)=>scene(title,text,goal,['reg:next','reg:wait','reg:withdraw']);
 if(!x.started&&!x.declined)return scene('街区传来求救消息','封锁线内再次出现敲门异常。你可以协助救人，也可以留在外围。','决定是否参加这次行动。',['reg:start','reg:refuse']);
 if(x.departed||x.declined)return scene('你已离开这次行动',x.outcome?.saved?'你带出了'+x.outcome.saved+'人。救援结果已经保存，敲门异常仍未永久解决。':'你没有继续留在现场。未带出者的生死不会被凭空确定。','提交行动记录，或返回城市处理个人事务。',['reg:report','reg:residence']);
 if(!x.active)return scene('行动暂时中断','先处理自身危机。恢复行动后，已经消耗的物品与现场变化仍然保留。','确认身体状态后继续。',['reg:resume']);
 if(!regionalKnown(s,'RECUR'))return scene('封锁线外','街道深处传来异常动静。你还没有足够的现场信息。','先观察，不急着走进街区。',['reg:observe','reg:withdraw']);
 if(!x.route)return scene('你准备怎样参与？','官方正在组织应急联络。独立调查不会自动获得官方物资；外围联络无需进入现场。','选择你的参与方式。',['reg:choose:OFFICIAL','reg:choose:INDEPENDENT','reg:choose:PERIPHERAL']);
 if(x.route==='OFFICIAL'&&!x.official.contacted)return scene('先与救援人员取得联系','你还没有接入应急渠道，不能直接领取物资。','联系官方。',['reg:contact','reg:withdraw']);
 if(x.route==='OFFICIAL'&&!x.official.authorized)return scene('接线员等待你的答复','对方请你协助寻找幸存者，再把人带到撤离口。','接受有限救援职责。',['reg:authorize','reg:withdraw']);
 if(x.route==='PERIPHERAL')return next('留守外围','你可以观察、联系官方；街区内的救援会继续推进。','等候现场消息，或结束外围协助。');
 if(['A','B'].includes(x.phase))return next('等待进入街区的时机','现场正在确认封锁范围。此时等待仍会推进世界，你体内厉鬼的复苏也照常结算。','收到下一步消息后继续。');
 if(x.zone==='cordon')return scene('进入街区','主干道连接着商业街与火锅店附近。地图上的道路还没有经过现场核对。','先到主干道查看。',['reg:move:road','reg:withdraw']);
 if(!regionalKnown(s,'MAP'))return scene('地图与街道对不上','你站在'+regionalZones[x.zone]+'。先确认身边的道路，避免照着失真的地图行动。','核对当前现场。',['reg:map','reg:withdraw']);
 if(!regionalKnown(s,'AVOID'))return scene('先弄清怎样避险','主动呼叫可能招来异常。你可以先对照声音线索，再尝试联系幸存者。','核验声音与异常接近的关系。',['reg:verify-rule','reg:withdraw']);
 if(x.phase==='C')return next('现场情况初步确认','你已核对地图和声音线索。它们只能支持有限避险，不能保证抵御所有灵异。','继续了解现场保护手段。');
 if(x.phase==='D'){
  if(!regionalKnown(s,'CANDLE')&&x.world.chapter<181){
   if(available.includes('reg:allocate'))return scene('救援物资可以领取','官方愿意借出一份有限的保护资源。领取不等于点燃，也不会减少已有复苏。','领取借用鬼烛，或前往现场观察保护方式。',['reg:allocate','reg:move:hotpot','reg:wait']);
   if(x.official.issued&&available.includes('reg:candle:light'))return scene('试用借来的鬼烛','点燃后会持续消耗燃料；随后可以熄灭，留给真正的护送。','确认这份保护的用途。',['reg:candle:light','reg:withdraw']);
   if(x.zone!=='hotpot')return scene('寻找现场保护线索','火锅店附近仍有行动迹象。前往观察不会自动获得对方的物品或能力。','前往火锅店附近。',['reg:move:hotpot','reg:move:road','reg:withdraw']);
   return scene('局部绿焰','现场出现了局部保护迹象。先观察它限制了什么。','了解保护范围。',['reg:candle:observe','reg:tong:contact','reg:withdraw']);
  }
  if(x.candle.active)return scene('把燃料留给护送','你已了解鬼烛用途。现在还没有带着群体移动，继续燃烧会消耗借用品。','可以先熄灭，等护送前再点燃。',['reg:candle:extinguish','reg:next','reg:wait']);
  return next('准备展开救援',x.world.chapter>=181&&!regionalKnown(s,'CANDLE')?'你错过了现场保护演示，不能补造观察记录。仍可检查当前路线并决定撤出。':'保护有范围与代价。接下来要找到具体的人，再决定如何带他们出去。','进入群体救援。');
 }
 const p=x.plan,group=x.groups.find(g=>g.known&&g.zone===x.zone&&!['SAVED','LEFT'].includes(g.state));
 if(p&&['READY','MOVING'].includes(p.status)&&planCheck(s).ok)return scene('带着幸存者撤离',p.step?'你们已到异常路口。再走完通往撤离口的一段，才能真正把人带出去。':'你将护送'+x.groups.find(g=>g.id===p.groupId).members+'人。方案已准备，但还没有开始移动；每一段都会重新检查路线和保护。',p.step?'护送到撤离口。':'带人前往异常路口。',['reg:execute','reg:pause']);
 if(x.saved.length&&x.zone==='exit')return scene('这批人已经安全抵达','已带出'+x.saved.reduce((n,id)=>n+x.groups.find(g=>g.id===id).members,0)+'人。你可以结束本次行动，也可以冒险返回街区。','决定是否结束救援。',['reg:withdraw','reg:move:junction']);
 if(x.world.rope==='ACTIVE'){
  if(x.candle.active)return scene('保护出现了盲区','另一种异常正在干扰现场。剩余燃料不能证明保护仍然适用。','先停止无效消耗，再核实变化。',['reg:candle:extinguish','reg:rope:observe','reg:death:verify']);
  return scene('现场出现新的异常','当前护送条件不再可靠。你可以核实消息，或保持隐蔽等候变化；等待仍有自身复苏代价。','重新评估现场，不继续执行失效方案。',[!regionalKnown(s,'ROPE')?'reg:rope:observe':null,!regionalKnown(s,'DEATH')?'reg:death:verify':null,'reg:wait','reg:withdraw']);
 }
 if(group){
  if(!currentRoute(s,x.zone,x.zone==='junction'?'exit':'junction'))return scene('先找好回程','你已经接触到'+group.members+'人，但尚无当前有效的撤离路线。','核验通向撤离口的两段道路。',['reg:route','reg:withdraw']);
  const plans=available.filter(a=>a.startsWith('reg:plan:'+group.id+':'));
  if(plans.length)return scene('选择怎样保护这批人','对象：'+group.name+'。准备方案不等于完成救援，之后还需要逐段护送。','选一个当前可用的护送方式。',[plans,'reg:candle:light','reg:withdraw']);
  if(available.includes('reg:candle:light'))return scene('建立护送保护','回程已核验。点燃后请尽快护送，燃料会随实际行动消耗。','点燃借用鬼烛。',['reg:candle:light','reg:withdraw']);
  if(group.id==='tong'&&available.includes('reg:tong:ESCORT'))return scene('请求童倩协助','她优先保护自己的群体，不会自动接受陌生群体的指令。','提出护送请求。',['reg:tong:ESCORT','reg:withdraw']);
  return scene('当前没有可执行的护送方案','路线或保护条件不足。地图与保护详情中可以查看原因，不能把准备当作已经救出。','核对条件，或选择撤出。',['reg:route','reg:wait','reg:withdraw']);
 }
 if(x.zone==='road')return scene('前往哪里寻找求助者？','商业街和火锅店附近都还需要实际查看。尚未接触的人不会出现在你的名单里。','选择一个地点调查。',['reg:move:shops','reg:move:hotpot','reg:withdraw']);
 if(x.zone==='junction')return scene('重新选择方向','这里连接着主干道和撤离口。没有跟随你的群体不会被自动带走。','返回主干道，或按有效路线撤出。',['reg:move:road','reg:route','reg:withdraw']);
 if(x.zone==='hotpot'&&!x.tong.contacted)return scene('火锅店附近有人在行动','先实际交流，才能确认对方正在保护谁。','与现场救援者取得联系。',['reg:tong:contact','reg:discover','reg:withdraw']);
 return scene('寻找仍留在现场的人','你站在'+regionalZones[x.zone]+'。保持避险条件，观察并联系这一带的求助者。','确认这里是否有需要护送的人。',['reg:discover','reg:move:road','reg:withdraw']);
}

export function regionalEffect(a){
 if(a==='reg:start')return '接下这次求救，先在外围观察；尚未进入街区。';
 if(a==='reg:observe')return '取得外围现场线索，不直接揭示完整规律。';
 if(a==='reg:contact')return '接入应急联络，之后可确认职责与借用物资。';
 if(a==='reg:authorize')return '承担有限救援职责，不自动获得物资或完成救援。';
 if(a==='reg:allocate')return '领取一份借用品，尚未点燃；不能重复领取。';
 if(a==='reg:route')return '检查当前位置到路口、路口到撤离口的连接。';
 if(a==='reg:pause')return '暂停护送，已移动的群体和已付代价保留。';
 if(a==='reg:verify-rule')return '通过当前现场对照取得有限避险依据。';
 if(a==='reg:map')return '记录当前位置与实际道路，不揭示未知群体。';
 if(a?.startsWith('reg:choose:'))return ({OFFICIAL:'联络官方并申请有限授权，可借用救援物资。',INDEPENDENT:'自行核验现场，未授权时没有官方物资。',PERIPHERAL:'留在封锁线，观察与联络，不深入街区。'})[a.slice(11)];
 if(a==='reg:wait')return '等候期间世界继续变化；不会恢复物品或减少已累计复苏。';
 if(a==='reg:execute')return '实际护送一段；检查路线与保护，并结算时间和资源。';
 if(a==='reg:withdraw')return '结束本次行动，保留已救结果；未带出者仍留在现场。';
 if(a==='reg:refuse')return '不进入现场；世界中的应急行动继续。';
 if(a==='reg:discover')return '只调查当前地点；缺少有效避险时，主动呼叫可能受伤。';
 if(a==='reg:candle:light')return '开始燃烧有限借用品；不降低复苏，也不解决源头。';
 if(a==='reg:candle:extinguish')return '立即结束鬼烛保护，保留剩余燃料。';
 if(a?.startsWith('reg:plan:'))return ({CANDLE:'消耗借用鬼烛，逐段检查覆盖与效力。',AVOIDANCE:'遵循已有依据的声音避险条件；不免疫其他异常。',TONG:'请求童倩保护她自己的群体；由她承担对应代价。',SPIRIT:'调用已开发鬼域；每段消耗能量并增加对应鬼的复苏。'})[a.split(':')[3]];
 if(a?.startsWith('reg:move:'))return '实际移动并推进时间，不会自动带走未护送的群体。';
 if(a==='reg:next')return '根据已取得的信息继续行动，不自动完成救援。';
 return '执行一次实际行动；查看档案和取消预览不推进时间。';
}
