import {productionCost} from './g1a-production-view.js';
import {available,upgrade} from './engine.js';
import {schoolSituation,schoolZones} from './school-model.js';
import {events} from './content.js';
import {growthFor} from './spirits.js';
import {case24Scene} from './views-contract-case.js';
import {transitScene} from './views-transit.js';
import {identityScene} from './views-identity-case.js';
import {postwarScene} from './views-postwar.js';
import {finaleScene} from './views-finale.js';
import {hungryScene} from './views-hungry.js';
import {crisisScene} from './views-city-crisis.js';
import {mirrorScene} from './mirror-guide.js';
import {regionalScene} from './regional-guide.js';

export function actionCost(s,a) {
  if(a.startsWith('g1ap:'))return productionCost(a);
  if(/^combat:(focus|cover):/.test(a)){const g=s.spirits.find(g=>g.id===a.slice(13));return '能量 '+(a.includes(':cover:')?2:1)+'；'+g.name+'预计复苏 +'+growthFor(s,g,true).toFixed(2)+'%；共用该鬼冷却3（本行动结束递减）；仅原创实例技巧。';}
  const id=a.startsWith('inv:probe:')?a.slice(10):a.startsWith('combat:ability:')?a.slice(15):null;
  const g=s.spirits.find(g=>g.id===id);
  if(g)return `能量 1；${g.name}本次预计复苏 +${growthFor(s,g,true).toFixed(2)}%，以实际结算为准；其他鬼仍按各自条件结算。`;
  if(a==='inv:capture')return '隔离袋 1；新增负荷 28、初始复苏 20%；第二鬼另需相容评估与防护符膜。驾驭后不自动消除历史风险。';
  if(a==='inv:contain'||a==='combat:restrict')return '隔离袋 1；建立限制，不消灭厉鬼。';
  if(a==='inv:protect'||a==='combat:item')return '防护符膜 1；有限防护，不删除既有标记或累计复苏。';
  if(a==='combat:combo')return '能量 2；组合中两只厉鬼分别结算调用代价与冷却。';
  if(a==='inv:respond')return '危险行为：主动回应未知广播，可能留下不可逆后果。';
  if(a==='inv:leave'||a==='combat:retreat')return '撤离推进一次行动；证据与消耗保留，已有异常后果不会自动解除。';
  if(a.startsWith('inv:hypothesis:'))return '一次调查行动；只评价现有证据，不凭推测获得能力。';
  return '执行后推进一次实际行动；世界与每只鬼照常结算。翻页、查看提示与取消不推进。';
}

export function firstContact(s){return !s.school.started&&!s.investigation.started&&!s.doorCase.started&&s.tick===0&&s.scene==='hub';}

// Recommendations reference real legal actions. Unknown source rules are never read here.
export function taskGuide(input) {
  const s=upgrade(input),legal=available(s),x=s.investigation;
  const pick=(...a)=>a.flat().find(a=>legal.includes(a))||null;
  let location='当前现场',goal='查看当前现场目标并选择合法行动',reason='只执行当前允许的行动；资料翻页不会推进世界。',recommended=null,blockers=[],completed=[],clues=[];
  if(s.systems.death!=='alive') {
    location='生存反应窗口';goal=s.systems.death==='pending'?'处理致死后的已有反应资源，或确认结局':'查看已经提交的个人结局';
    recommended=pick(legal.filter(a=>a.startsWith('reaction:')),'death:commit');
    blockers=['没有免费复活；存档恢复与灵异重启是不同操作。'];
  } else if(s.crisis) {location='宿主复苏危机';goal='先处理体内灵异失控';recommended=pick('suppress',legal);blockers=['常规事件行动暂停；每只鬼的复苏分别保留。'];}
  else if(x.active) {
    location=x.zone==='hall'?'废弃值班室 · 走廊':'废弃值班室 · 室内';
    const has=id=>x.evidence.some(e=>e.id===id);
    clues=x.evidence.map(e=>({text:e.fact,confidence:e.reliability==='UNVERIFIED'?'证词，未证实':'已观察事实'}));
    completed=[...(x.evidence.length?['已收集 '+x.evidence.length+' 条材料']:[]),...(x.hypotheses.sound?.status==='DISPROVEN'?['已用对照推翻“只要听见就触发”']:[]),...(x.hypotheses.response?.status==='CONFIRMED'?['点名与回应假设已获现有证据确认']:[]),...(x.medium==='INACTIVE'?['已隔离广播接线']:[]),...(x.source==='CONTAINED'?['已限制异常磁带']:[])];
    if(x.source==='CONTAINED') {goal='提交事件结算，或自主评估驾驭';recommended=pick('inv:seal','inv:leave');reason='关押已完成。提交封存记录即可结束，不必驾驭新鬼。';}
    else if(x.playerMark&&x.medium==='ACTIVE') {goal='优先停止危险继续加深，或撤离并承担后续风险';recommended=pick(x.zone==='office'?'inv:cut':'inv:move:office','inv:leave');reason='你已观察到自己的黑痕。撤离不会自动清除标记。';}
    else if(x.zone==='hall'&&!has('testimony')) {goal='先询问现场人员，记录待验证的说法';recommended=pick('inv:question');reason='陈宁就在走廊；证词不等于已确认规律。';}
    else if(has('testimony')&&!x.hypotheses.sound&&!has('control')&&x.elapsed<4) {goal='把证词整理成一个可检验的假设';recommended=pick('inv:hypothesis:sound');reason='记录“听声是否足以触发”的假设，随后用现场变化检验。';}
    else if(x.zone==='hall'&&legal.includes('inv:compare')) {goal='比较同一现场不同人的变化';recommended='inv:compare';reason='已出现可观察差异；对照事实可以支持或否定证词。';}
    else if(legal.includes('inv:protect')) {goal='保护出现黑痕的陆安';recommended='inv:protect';reason='你持有符膜，可暂时阻断其标记后果；不是治愈或复活。';}
    else if(x.zone==='hall'&&x.elapsed<4&&!x.evacuated&&x.medium==='ACTIVE') {goal='保持沉默，观察一次现场变化';recommended=pick('inv:wait');reason='这是一次真实行动。不要主动回应未知广播；也可选择引导人员离场。';}
    else if(x.zone==='hall') {goal='进入值班室检查设备与记录';recommended=pick('inv:move:office');reason='走廊现有观察已整理，下一步可调查设备。';}
    else if(!has('record')) {goal='检查值班室的录像与接线盒';recommended=pick('inv:search');reason='先获得实物与记录，不能凭感知读取答案。';}
    else if(x.medium==='ACTIVE') {goal='隔离可接触的广播接线';recommended=pick('inv:cut');reason='停止媒介后继续核对磁带；停止声音不等于源头消失。';}
    else if(has('mark')&&has('control')&&!x.hypotheses.response) {goal='整理点名、回应与黑痕的关联';recommended=pick('inv:hypothesis:response');reason='只按已经收集的录像、直接观察、对照与媒介检查评价。';}
    else {goal='使用黄金容器限制异常磁带，或带着记录撤离';recommended=pick('inv:contain','inv:leave');reason='物理关押条件与是否知道完整规律分开。';}
    if(!s.bags&&x.source!=='CONTAINED')blockers.push('隔离袋不足，不能执行关押；可合法撤离，保留现场与证据。');
    if(!s.spirits.length)blockers.push('当前是普通人；可用环境、道具和撤离，无灵异能力或鬼域。');
  } else if(s.combat) {
    location=events[s.combat.eventId].title;goal='观察触发媒介，选择避险、限制或撤离';
    recommended=pick('combat:restrict','combat:observe','combat:avoid','combat:retreat');
    reason='这里没有厉鬼生命值。普通力量不能消灭源头；限制方案依赖已有证据与容器。';
    clues=events[s.scene].clues.filter(c=>s.knowledge[s.scene]?.clues.includes(c.id)).map(c=>({text:c.text,confidence:'已记录'}));
    if(!legal.includes('combat:restrict'))blockers.push('限制尚未开放：需要方案证据及隔离袋。');
  } else if(s.school.active) {
    const q=schoolSituation(s),k=s.school,has=id=>k.evidence.some(e=>e.id===id);
    location='七中 · '+schoolZones[k.zone];goal=q.objective;reason=q.reason;clues=k.evidence.map(e=>({text:e.fact,confidence:e.reliability==='HIGH'?'高可信观察':'需核对来源'}));
    completed=k.visited.map(z=>'已到过 '+schoolZones[z]);
    if(k.window>=5)recommended=pick('school:escape',k.group.followState==='HESITANT'?'school:calm':null,!has('M-04')?'school:check-exit':null,'school:move:'+({classroom:'stairs',office:'stairs',stairs:'yard',hall:'stairs',lecture:'hall',toilet:'hall',yard:'exit',tree:'yard',exit:'yard'}[k.zone]));
    else recommended=pick(!k.audioStopped?'school:stop-audio':null,!k.earsCovered?'school:cover':null,k.search[k.zone]!==k.window?'school:search':null,!has('F-01')&&k.window===0?'school:observe':null,!has('K-01')&&['hall','lecture'].includes(k.zone)&&k.window>=1?'school:observe':null,!has('M-02')?'school:compare-map':null,k.zone==='stairs'&&!k.tools.marks?'school:mark-route':null,k.zone==='classroom'?'school:move:office':null,k.zone==='office'?'school:move:stairs':null,k.zone==='stairs'?'school:move:hall':null,'school:avoid','school:wait');
    blockers=[k.window<5?'当前外部连接仍异常，先调查与避险，等待实际离开机会。':'离开需当前出口连接、现场复核及可行动的小组；旧地图不保证仍有效。'];
  } else if(s.scene==='echo') {
    location=events.echo.title;goal=s.phase==='限制'?'提交限制成果，选择封存或自主驾驭':'进入接线室战术现场';
    recommended=pick(s.phase==='限制'?'seal':'combat:start','retreat');
    reason='先观察与对照，确认媒介后使用真实容器；限制不等于消灭厉鬼。';
  } else if(s.scene==='hub'&&s.outcomes.echo&&!s.school.started) {
    location='住宅区 · 接线室结算';goal='查看处置与代价，选择七中主线';recommended=pick('school:start','school:outside');
    completed=['接线室：'+s.outcomes.echo];reason='证据、容器消耗与逐鬼复苏已经保留。';
  } else if(firstContact(s)) {
    location='住宅区 · 联系点';goal='选择第一起事件';recommended=pick('inv:enter');
    reason='推荐先玩现有原创短调查：询问、对照、保护、隔离与结算。也可直接选择七中主线。';
  } else if(x.resolution&&!s.school.started) {
    location='住宅区 · 事件归档';goal='查看调查结算，选择下一段七中主线';recommended=pick(x.resolution==='Escaped'?'inv:enter':null,'school:start','school:outside');
    completed=['调查记录已保留：'+({Contained:'源头已封存',Resolved:'已主动驾驭',Escaped:'已撤离，源头仍需处理',PartiallyContained:'局部限制后离场'}[x.resolution])];
    reason=x.resolution==='Escaped'?'可重返未完成现场，或独立选择主线；不洗掉既有伤亡与标记。':'封存、驾驭与撤离是不同结果。知识与实例成长按真实结果保留，不发击杀经验。';
  }
  if(!recommended&&s.systems.death==='alive'&&!s.crisis) {
    // Reuse existing chapter guides, not a second quest progression model.
    const adapters=[['cx:',case24Scene,'X档案与鬼橱调查'],['tr:',transitScene,'公交道路与车厢'],['ic:',identityScene,'身份调查现场'],['pw:',postwarScene,'战后大昌市'],['ff:',finaleScene,'大昌市终局现场'],['he:',hungryScene,'封锁中的大昌市'],['cc:',crisisScene,'大昌市城市事务'],['gm:',mirrorScene,'古宅调查现场'],['reg:',regionalScene,'城市救援现场']];
    const adapter=adapters.find(([prefix])=>legal.some(a=>a.startsWith(prefix)));
    if(adapter){const [,scene,fallback]=adapter,q=scene(s);location=q.title||fallback;goal=q.goal;reason=q.scene||q.text||'沿当前现场指引行动，许可与角色知识保持现有约束。';recommended=pick(q.actions);}
    else if(s.dachang.started){location='大昌市 · 当前个人事务';goal='处理当前城市事务或打开案件现场';}
    else if(s.school.playerEscaped){location='七中 · 现实封锁点';goal='核对离场记录，进入大昌市生活';recommended=pick('school:report','dc:start');}
    else if(s.scene!=='hub'){location=events[s.scene]?.title||location;goal='调查现场，验证限制条件或合法撤离';}
  }
  if(!recommended)recommended=pick(legal.filter(a=>!/(:wait$|:listen$|:respond$|:force$|:risk$|:hostile:|:drive:)/.test(a)),legal);
  return {location,goal,reason,recommended,legal,completed,clues,blockers};
}
