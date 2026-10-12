/**
 * Real engine -> approved Stage-3 battle UI. This module is read-only.
 * All actions are engine IDs; buttons never calculate or commit battles here.
 * Art is visual, not evidence of ghost identity or of owned powers.
 */
import {available} from './engine.js';
import {events} from './content.js';
import {activeIds} from './v1.js';
import {hostState,growthFor} from './spirits.js';
import {actionCost} from './gameplay-guide.js';

const knownActionNames={
 'combat:observe':'观察现象','combat:avoid':'避开媒介',
 'combat:restrict':'限制并封存','combat:item':'使用隔离符膜',
 'combat:force':'普通力量试探','combat:risk':'主动承担风险',
 'combat:combo':'组合媒介防护',
 'v1:domain:cast':'鬼域调用','v1:seal:cast':'封印媒介',
 'v1:reset:self':'自身重启','v1:reset:range':'范围重启'
};
const iconFor = action => /combo|aid:/.test(action)?'resonance_rule.png':/observe/.test(action)?'eye_rule.png':/domain|reset|focus/.test(action)?'eye_rule.png':/item|seal/.test(action)?'cassette_rule.png':/avoid|cover|restrict/.test(action)?'hand_rule.png':/force|risk/.test(action)?'door_rule.png':'cassette_rule.png';
const num = n => Number.isFinite(n)? +n.toFixed(2):0;

export function buildRealCombatData(s) {
 if(!s?.combat)throw Error('仅在真实战斗中生成接线数据');
 const c=s.combat,e=events[c.eventId],legal=new Set(available(s));
 const active=activeIds(s), h=hostState(s);
 const visibleIds=new Set(active);
 const ghostMap=new Map(s.spirits.map(g=>[g.id,g]));
 const resonance=s.systems.combinations.find(x=>x.ids.every(id=>visibleIds.has(id)));
 const participating=a=>{
  if(a.startsWith('combat:ability:'))return [a.slice('combat:ability:'.length)];
  if(a.startsWith('combat:focus:'))return [a.slice('combat:focus:'.length)];
  if(a.startsWith('combat:cover:'))return [a.slice('combat:cover:'.length)];
  if(a==='combat:combo')return resonance?.ids||[];
  if(a==='v1:domain:cast'||a.startsWith('v1:reset:'))return s.spirits.filter(g=>g.sourceId==='eye').map(g=>g.id);
  return [];
 };
 const candidates=new Set([
  'combat:observe','combat:avoid','combat:restrict','combat:item',
  ...s.spirits.flatMap(g=>[`combat:ability:${g.id}`,...(['watch','echo','shadow'].includes(g.sourceId)?[`combat:focus:${g.id}`,`combat:cover:${g.id}`]:[])]),
  ...(s.systems.combinations.length?['combat:combo']:[]),
  ...(s.spirits.some(g=>g.sourceId==='eye')?['v1:domain:cast','v1:reset:self','v1:reset:range']:[]),
  ...Object.keys(s.systems.aids).map(id=>'combat:aid:'+id),
  ...[...legal].filter(a=>['v1:domain:cast','v1:seal:cast','v1:reset:self','v1:reset:range'].includes(a))
 ]);
 const skills=[...candidates].filter(a=>a!=='combat:restrict'||legal.has(a)||s.bags>0).map(a=>{
  const gId=participating(a)[0],g=ghostMap.get(gId),ownAction=/^combat:(ability|focus|cover):/.test(a),used=participating(a);
  const disabled=!legal.has(a),cooldown=!!g&&c.cooldowns[g.id]>0;
  const energy=a==='combat:combo'||a==='combat:cover:'+gId?2:
    a==='combat:item'||a==='combat:avoid'||a==='combat:observe'||a==='combat:restrict'||a.startsWith('combat:aid:')||a==='v1:seal:cast'?0:1;
  const ghostId=a==='combat:combo'?'resonance':gId||'utility';
  let name=knownActionNames[a]||
   (a.startsWith('combat:ability:')?(g?.name||'未知')+'·基础调用':
    a.startsWith('combat:focus:')?(g?.name||'未知')+'·集中压制':
    a.startsWith('combat:cover:')?(g?.name||'未知')+'·收束掩护':
    a.startsWith('combat:aid:')?'有限援助 · '+(events[a.slice(11)]?.spirit||'辅助媒介'):'规则行动');
  const reasons=[];
  if(disabled){
   if(ownAction&&!visibleIds.has(gId))reasons.push('该厉鬼未启用');
   if(ownAction&&s.systems.combinations.some(x=>x.disabledId===gId))reasons.push('独立调用已被组合取代');
   if(a.startsWith('combat:focus:')&&g.development<25)reasons.push('需开发25');
   if(a.startsWith('combat:cover:')&&g.development<50)reasons.push('需开发50');
   if(cooldown)reasons.push('该厉鬼尚在冷却');if(ownAction&&s.energy<energy)reasons.push('能量不足');if(a==='combat:restrict')reasons.push('需要已认证的方案和隔离袋');if(a==='combat:item')reasons.push('没有隔离符膜');
  }
  // Every carried ghost experiences its own ongoing revival settlement each real action.
  const revivalByGhost={};
  for(const ghost of s.spirits)revivalByGhost[ghost.id]=num(growthFor(s,ghost,used.includes(ghost.id)));
  const cDescription=actionCost(s,a);
  return {id:a,name,ghostId,icon:iconFor(a),energy,burden:0,
   revivalByGhost,description:cDescription,status:disabled?(cooldown?'cooldown':'locked'):'available',
   reason:reasons.join('；')||'当前引擎合法行动清单不包含该动作；可能未启用、开发不足、组合取代或资源不足。',
   code:a,participating:used};
 });
 const knowledge=s.knowledge[c.eventId],clues=(e?.clues||[]).filter(x=>knowledge?.clues?.includes(x.id)).map(x=>x.text);
 if(knowledge?.hypotheses?.true==='confirmed')clues.push('现有记录与对照支持限制方案；不代表了解源头全部规则。');
 const last=c.logs?.at(-1)?.text||'本回合尚未执行行动。';
 return {mode:'live',location:e?.title||'规则遭遇',room:e?.title||'当前现场',round:c.turn+1,phase:'我方行动',
  stageState:c.wardWeight>0?'防护已部署':'媒介规则持续结算',stageRisk:c.position==='exposed'?'已处于触发范围':'当前避开触发媒介',
  feedback:last,player:{name:s.name,hp:s.life,hpMax:100,energy:s.energy,energyMax:3,
   burden:h.effectiveBurden,burdenMax:h.hostCapacity,coreGhost:ghostMap.get(active[0])?.name||'无',
   spirits:s.spirits.map(g=>({id:g.id,name:g.name,revival:g.revivalProgress,burden:g.burden}))},
  enemy:{id:c.eventId,displayName:knowledge?.hypotheses?.true==='confirmed'?e.spirit:'未识别异常',
   status:c.wardWeight>0?'防护部署中，效果需经规则验证':'尚未建立防护',
   risk:'评级未确认',goal:legal.has('combat:restrict')?'可以尝试合法限制':'取得证据、避险或撤离',rules:clues},
  ghosts:s.spirits.map(g=>({id:g.id,name:g.name,activated:visibleIds.has(g.id)})),
  skills,itemsText:`隔离符膜 ${s.systems.items.barrier} 份；隔离袋 ${s.bags} 个。物品动作严格按引擎当前合法清单执行。`,
  knownRules:clues,legalActions:[...legal],log:c.logs.slice(-5).map(l=>l.text)};
}
