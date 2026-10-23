import {g1bEnemy} from './g1b-production.js';
import {productionEnemy,productionIntent} from './g1a-production.js';
import {candidateEnemy,candidateIntent} from './g1a-candidate.js';
import {recordBloodContest} from './g1a-archives.js';
import {resolveKnockerDamage} from './knocker-intents.js';
import {eyeGhost,newEyeCombat,beginEyeRound,completeEyeEffects,enemyIntent,eyeAvailable} from './ghost-eye-v6.js';
import { events } from './content.js';
import { ruleFor,ruleContest,developmentTier,develop } from './rules.js';
import {activeIds,v1Ward,knowledgeState} from './v1.js';
export function newCombat(id,s){return {eventId:id,ruleId:'rule:'+id,sourceId:'source:'+id,clock:0,playerGauge:100,sourceGauge:0,turn:0,position:'safe',wardWeight:0,wardMedium:null,cooldowns:{},logs:[],...(s?.ghostEyeV6&&eyeGhost(s)?{eyeV6:newEyeCombat(s)}:{}),snapshot:{life:s?.life||100,ward:0,combat:{position:'safe',playerGauge:100,sourceGauge:0,cooldowns:{}}}};}
export function combatAvailable(s){const c=s.combat;if(!c)return [];if(c.nativeSchool)return ['combat:observe','combat:avoid','combat:retreat'];
 const out=['combat:observe','combat:avoid','combat:force','combat:risk','combat:retreat'];
 for(const g of s.spirits.filter(g=>['watch','echo','shadow'].includes(g.sourceId)&&activeIds(s).includes(g.id)&&!s.systems.combinations.some(x=>x.disabledId===g.id)&&!c.cooldowns[g.id])){
  if(g.development>=25&&s.energy>=1)out.push('combat:focus:'+g.id);
  if(g.development>=50&&s.energy>=2)out.push('combat:cover:'+g.id);
 }
 if(s.energy>0)out.push(...s.spirits.filter(g=>(!c.eyeV6||g.sourceId!=='eye')&&activeIds(s).includes(g.id)&&!s.systems.combinations.some(x=>x.disabledId===g.id)&&!(c.cooldowns[g.id]>0)).map(g=>'combat:ability:'+g.id));
 if(s.systems.combinations.some(x=>x.ids.every(id=>activeIds(s).includes(id)))&&s.energy>=2&&!c.cooldowns.combo)out.push('combat:combo');
 if(s.systems.items.barrier>0)out.push('combat:item');
 out.push(...Object.keys(s.systems.aids).filter(id=>s.systems.aids[id].remaining>0).map(id=>'combat:aid:'+id));
 if(s.knowledge[c.eventId]?.hypotheses.true==='confirmed'&&s.bags>0)out.push('combat:restrict');return out;
}
export function applyCombat(s,action,roundStarted=false){const c=s.combat,r=ruleFor(c.eventId,events[c.eventId]),log=(phase,text)=>{c.logs.push({clock:c.clock,phase,source:r.instanceId,rule:r.id,text});s.journal.push(text);};let used=[];
 if(!roundStarted)beginEyeRound(s);
 const k=action.slice(7);
 // Provenance lasts only while this one ward remains in effect. Any replacement
 // invalidates it; observations and unrelated actions cannot manufacture contact.
 if(k.startsWith('ability:')||k.startsWith('focus:')||k.startsWith('cover:')||k==='combo'||k==='item'||k.startsWith('aid:'))delete c.bloodWard;
 if(k==='retreat'){s.scene='hub';s.combat=null;s.ward=0;s.journal.push('退出规则遭遇，现场、证据和消耗保留。');return {used};}
 if(k==='observe'){
  if(s.g1b?.tablet.location==='tablet'){s.journal.push('意识在灵位内观察已知占据关系；推进敌方行动，不恢复身体控制或获取外部真名。');}else if(s.g1b?.world.actors.length){s.journal.push('隔离参与者观察：只记录该参与者明确暴露的身份和现场边界，不取得作为计时外壳的普通关卡线索。');}else if(c.nativeSchool){s.journal.push('观察已记录的七中声音迹象，不自动认证源头全部规则。');}else{
  const e=events[c.eventId];s.knowledge[c.eventId]||={clues:[],hypotheses:{}};const known=s.knowledge[c.eventId];const clue=e.clues.find(v=>!known.clues.includes(v.id));
  if(clue){known.clues.push(clue.id);log('玩家','观察确认：'+clue.text);s.spirits.filter(g=>g.sourceId===c.eventId).forEach(g=>develop(g,5));}
  else log('玩家','已观察到全部现有证据；继续观察不重复获得开发度。');
  if(known.clues.includes('witness')&&known.clues.includes('power')){known.hypotheses.true='confirmed';s.phase='规律暴露';log('证据','记录与对照支持当前限制方案。');}
 }
 }
 if(k==='avoid'){c.position='safe';log('玩家','避开触发媒介；行为避险不要求证据认证。');}
 if(k==='force'){c.position='exposed';log('玩家','普通力量无法消灭厉鬼，源头没有气血或击杀经验。');}
 if(k==='risk'){c.position='exposed';log('玩家',events[c.eventId].riskText);}
 if(k.startsWith('ability:')){const g=s.spirits.find(v=>v.id===k.slice(8)),own=ruleFor(g.sourceId,events[g.sourceId]);s.energy--;used=[g.id];develop(g,3);c.wardWeight=v1Ward(s,g,c.eventId);c.wardMedium=own.medium;c.cooldowns[g.id]=2;log('玩家',g.name+'对抗媒介，开发度＋3；自身独立复苏照常结算。');}
 if(k.startsWith('focus:')||k.startsWith('cover:')){
  const cover=k.startsWith('cover:'),g=s.spirits.find(g=>g.id===k.slice(6)),own=ruleFor(g.sourceId,events[g.sourceId]);
  s.energy-=cover?2:1;used=[g.id];develop(g,3);c.wardWeight=Math.min(10,v1Ward(s,g,c.eventId)+(cover?0:1));c.wardMedium=own.medium;c.cooldowns[g.id]=3;
  if(cover)c.position='safe';
  log('玩家',g.name+(cover?'收束掩护：撤出触发区域，保留同媒介防护；能量－2。':'集中压制：同媒介权重＋1；能量－1。')+'开发＋3，调用复苏独立结算；不关押或消灭源头。');
 }
 if(k==='combo'){s.energy-=2;used=s.systems.combinations.find(x=>x.ids.every(id=>activeIds(s).includes(id))).ids;used.forEach(id=>develop(s.spirits.find(g=>g.id===id),2));c.wardWeight=4;c.wardMedium='all';c.cooldowns.combo=3;log('拼图','嵌套媒介阻断：两只鬼分别承担调用代价，次鬼独立按钮已被组合取代。');}
 if(k==='item'){s.systems.items.barrier--;c.wardWeight=5;c.wardMedium='all';log('物品','隔离符膜消耗×1，仅保护一次触发，不返还。');}
 if(k.startsWith('aid:')){const id=k.slice(4),a=s.systems.aids[id];a.remaining--;a.used++;c.wardWeight=3;c.wardMedium=ruleFor(id,events[id]).medium;log('援助',events[id].spirit+'援助调用，次数－1；未植入身体，不虚构负荷与复苏。');}
 if(k==='restrict'){s.bags--;s.restricted[c.eventId]=true;s.phase='限制';log('限制',events[c.eventId].restriction+'隔离袋×1已消耗，厉鬼被限制而非死亡。');s.combat=null;return {used};}
 if(k==='ability:player-blood')c.bloodWard={tick:s.tick,battleId:s.settlement.active?.encounterId||`${s.settlement.ownerId}:${s.settlement.nextEncounter}`};
 c.turn++;c.playerGauge-=100;resumeCombat(s);return {used};
}
export function resumeCombat(s){
 const c=s.combat,r=ruleFor(c.eventId,events[c.eventId]),log=(phase,text)=>{c.logs.push({clock:c.clock,phase,source:r.instanceId,rule:r.id,text});s.journal.push(text);};
  // Resolve initiative in bounded clock steps. Equal readiness gives the player priority.
 for(let guard=0;guard<64&&c.playerGauge<100&&s.systems.death==='alive';guard++){
  c.clock++;c.playerGauge+=25;c.sourceGauge=c.nativeSchool?0:c.sourceGauge+r.speed;
  if(c.sourceGauge>=100&&!c.nativeSchool){c.sourceGauge-=100;
   const v=c.eyeV6,intent=v?.deferred?{...v.deferred}:v?enemyIntent(s,r):null;
   if(v?.deferred)v.deferred=null;
   if(intent&&c.position==='exposed'&&intent.observable&&intent.reactable&&!v.reactionUsed&&!intent.cancelled){
    v.pending=intent;if(eyeAvailable(s).some(a=>a!=='eye6:pass')){s.journal.push('敌方宣告：'+intent.kind+(intent.simulation?'（模拟夹具）':''));c.logs=c.logs.slice(-60);return;}v.pending=null;
   }
   resolveEnemy(s,r,log,intent);
   log('环境','环境媒介检查结束，未创建递归反击链。');
  }
 }
 completeEyeEffects(s);
 for(const id of Object.keys(c.cooldowns))c.cooldowns[id]=Math.max(0,c.cooldowns[id]-1);
 log('持续','本行动的独立复苏由宿主结算；行动条与复苏百分比分离。');c.logs=c.logs.slice(-60);

}
function resolveEnemy(s,r,log,intent){const c=s.combat;
    if(g1bEnemy(s,r,log,intent))return;
    if(s.g1a?.production){intent=productionIntent(s,r,intent);if(c.position==='exposed'&&!intent?.cancelled&&productionEnemy(s,intent)){log('对抗','专属规则拦截本次已证明适用的行动；未关押源头。');return;}}
    intent=candidateIntent(s,r,intent);
    if(c.position==='exposed'&&!intent?.cancelled&&candidateEnemy(s,intent)){log('对抗','【模拟候选】当前已验证作用拦截本次适用行动；其他固有灵异继续。');return;}
    log('灵异','源头按媒介条件结算，不因玩家点击数随机更换规则。');
   if(!intent?.cancelled&&c.position==='exposed'){
    const matching=c.wardMedium===r.medium||c.wardMedium==='all';const outcome=ruleContest(matching?c.wardWeight:0,intent?.weight??r.weight);
    const rawDamage=outcome==='blocked'?0:outcome==='partial'?Math.ceil((intent?.damage??r.damage)/2):(intent?.damage??r.damage);
    const damage=Math.max(0,rawDamage-(s.v1?.build==='mind'&&knowledgeState(s,c.eventId).level==='CONFIRMED'?8:0));
    if(matching&&c.wardMedium==='body'&&!intent?.simulation&&(!intent?.kind||intent.kind==='ordinary'))recordBloodContest(s,r,outcome,c.bloodWard);
    delete c.bloodWard;
    s.life=Math.max(0,s.life-damage);log('对抗','规则对抗：'+({blocked:'成功阻断',partial:'同权重部分阻断',failed:'未能阻断'}[outcome])+'，身体损伤'+damage+'。');
    c.wardWeight=0;c.wardMedium=null;
    if(s.life===0){s.systems.death='pending';log('致死','进入死亡待定。仅剩已拥有的反应资源可拦截；提交后不可普通复活。');}
   }else log('灵异','未满足触发条件，不产生侵蚀。');

}
export function continueEyeReaction(s){
 const c=s.combat,v=c.eyeV6,p=v.pending;if(!p)return;
 v.pending=null;if(p.nativeSchool){resolveKnockerDamage(s,p);return;}const r=ruleFor(c.eventId,events[c.eventId]),log=(phase,text)=>{c.logs.push({clock:c.clock,phase,source:r.instanceId,rule:r.id,text});s.journal.push(text);};
 resolveEnemy(s,r,log,p);resumeCombat(s);
}
export function validCombat(s){const c=s.combat;if(c===undefined||c===null)return true;const n=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max;
 if(c.bloodWard&&(!n(c.bloodWard.tick,s.tick)||typeof c.bloodWard.battleId!=='string'||!c.bloodWard.battleId.startsWith(s.settlement?.ownerId+':')||c.wardMedium!=='body'||!s.spirits.some(g=>g.id==='player-blood')||Object.keys(c.bloodWard).sort().join()!=='battleId,tick'))return false;
 if(c.nativeSchool!==undefined&&typeof c.nativeSchool!=='boolean'||c.eventId==='knocker'&&(!c.nativeSchool||!s.school?.started||!s.school.participated)||c.nativeSchool&&c.eventId!=='knocker')return false;
 if(c.snapshot){const x=c.snapshot,b=x.combat;if(!n(x.life,100)||x.life===0||!b||!['safe','exposed'].includes(b.position)||!n(b.playerGauge,199)||!n(b.sourceGauge,199)||!b.cooldowns||typeof b.cooldowns!=='object'||Array.isArray(b.cooldowns)||Object.entries(b.cooldowns).some(([id,v])=>!(id==='combo'||s.spirits.some(g=>g.id===id))||!n(v,3)))return false;}
 if(!c||!events[c.eventId]||s.scene!==c.eventId||c.ruleId!=='rule:'+c.eventId||c.sourceId!=='source:'+c.eventId||!n(c.clock,1e9)||!n(c.turn,1e9)||!n(c.playerGauge,199)||!n(c.sourceGauge,199)||!['safe','exposed'].includes(c.position)||!n(c.wardWeight,10)||![null,'visual','audio','body','all'].includes(c.wardMedium)||!c.cooldowns||typeof c.cooldowns!=='object'||Array.isArray(c.cooldowns)||Object.entries(c.cooldowns).some(([id,v])=>!(id==='combo'||s.spirits.some(g=>g.id===id))||!n(v,3)))return false;
 return Array.isArray(c.logs)&&c.logs.length<=60&&c.logs.every(l=>l&&n(l.clock,c.clock)&&['玩家','证据','灵异','环境','对抗','致死','物品','援助','拼图','持续','限制'].includes(l.phase)&&l.source===c.sourceId&&l.rule===c.ruleId&&typeof l.text==='string'&&l.text.length<=2000);
}
