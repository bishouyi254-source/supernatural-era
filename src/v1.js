import {ruleBlocked,advancedBusy,forms} from './evolution-model.js';
// V1 mother-document systems. All budgets are game tuning, not novel statistics.
import {events} from './content.js';
import {hostState,suppressionFor} from './spirits.js';
import {makeSpirit} from './progression.js';
import {fateResult,resetTemporary,ruleContest,developmentTier} from './rules.js';
export const builds={
 suppression:{name:'镇压',benefit:'直接规则对抗权重＋1',cost:'调用额外增长2复苏'},
 body:{name:'躯体',benefit:'承载上限＋15',cost:'普通休整只恢复10身体'},
 mind:{name:'意识',benefit:'已认证媒介的规则侵蚀减伤8',cost:'调用额外增长1复苏'},
 domain:{name:'鬼域',benefit:'鬼域调用对抗权重＋1',cost:'鬼域额外增长3复苏'},
 stable:{name:'稳定',benefit:'调用平衡偏移减为75%',cost:'主动规则对抗权重－1'},
 rule:{name:'规则',benefit:'已认证目标对抗权重＋2',cost:'调用额外增长4复苏'}
};
export const facilities={isolation:{name:'灵异隔离',cash:200,benefit:'备置隔离符膜1'},intel:{name:'情报中心',cash:200,benefit:'可购买有出处的官方对照档案'},warehouse:{name:'媒介仓库',cash:200,benefit:'物品容量由2升为3'},emergency:{name:'紧急压制室',cash:300,benefit:'媒介1换一次临时压制，身体仍损伤10'}};
export const itemTypes={record:{name:'对照记录仪',type:'情报',cash:100},gold:{name:'黄金隔离容器',type:'容器',cash:120},film:{name:'隔离符膜',type:'保护',cash:150},medium:{name:'定位媒介',type:'媒介',cash:100},seal:{name:'限制封条',type:'限制',cash:120},voucher:{name:'封装交易凭证',type:'交易',cash:100}};
export const factions={official:{name:'官方通联',note:'接线员与代号登记，不代替原著人物'},civil:{name:'民间合作',note:'俱乐部外围联系人，资料有动机'},trader:{name:'特殊交易',note:'未知交易者，不把高危承诺当事实'},survivors:{name:'幸存者网络',note:'第一手记录需要交叉验证'}};
const stageThresholds=[1,5,10,20,35,50,70,90];
export const domainNames=['收束','空间隔离','携带与移动','灵异感知','深层鬼域','现实干涉','灵异停滞','重启自身','范围重启'];
export function newV1(){return {format:1,cash:500,build:null,active:null,facilities:[],items:Object.fromEntries(Object.keys(itemTypes).map(id=>[id,0])),stock:Object.fromEntries(Object.keys(itemTypes).map(id=>[id,2])),trust:Object.fromEntries(Object.keys(factions).map(id=>[id,0])),missions:[],contacts:[],certified:[],insights:[],eye:{fate:null,decision:null,step:0,layer:0},worldRecords:[]};}
export function attachV1(s){return {...s,v1:s.v1||newV1(),spirits:s.spirits.map(g=>({...g,ruleId:g.ruleId||'rule-'+g.sourceId,instanceType:g.instanceType||'player',rank:g.rank||(events[g.sourceId].grade==='S潜力'?'S':events[g.sourceId].grade)}))};}
export function activeIds(s){return (s.v1?.active||s.spirits.slice(0,s.evolution?.third?.stage===5?3:2).map(g=>g.id)).filter(id=>s.spirits.some(g=>g.id===id)&&!ruleBlocked(s,id));}
export function knowledgeState(s,id){const k=s.knowledge[id]||{clues:[],hypotheses:{}};const certified=s.v1?.certified.includes(id);return {subjectId:'rule:'+id,level:certified?'CONFIRMED':k.hypotheses.true==='confirmed'?'SUPPORTED':k.clues.length?'SUSPECTED':'UNKNOWN',evidence:k.clues.map(c=>({id:c,source:'现场观察',reliability:75})),sourceReliability:certified?95:k.clues.length?75:0,disproved:k.hypotheses.false==='disproved'};}
export function hostProfile(s){const h=hostState(s),eye=s.spirits.find(g=>g.sourceId==='eye');let stage='接触者';if(s.spirits.length)stage='驭鬼者';if(s.spirits.length>=2&&h.balanceState==='暂时平衡')stage='双鬼驭鬼者';if(s.spirits.length>=2&&s.spirits.filter(g=>g.development>=25).length>=2&&h.balanceBias<30)stage='资深驭鬼者';if(stage==='资深驭鬼者'&&s.city.completed&&s.city.contribution>=60)stage='顶尖驭鬼者';if(!s.evolution&&s.advanced.alienStage===2)stage=s.city.completed&&s.city.contribution>=60?'顶尖异类':'异类';if(eye?.awakeningProgress>=70&&eye.development>=50)stage='神灵异宿主';if(s.evolution?.host.form>=2)stage=forms[s.evolution.host.form];return {stage,consciousness:Math.max(0,100-h.consciousnessStress-(h.burdenRatio>1?20:0)),spiritStrength:s.spirits.reduce((n,g)=>n+developmentTier(g),0),puzzle:s.systems.combinations.length*25+(s.advanced.alienStage===2?50:0),alienation:s.advanced.alienStage===2?60:s.advanced.alienStage===1?20:0};}
export function eyeMax(s){const g=s.spirits.find(g=>g.sourceId==='eye');if(!g||g.awakeningProgress>=100)return 0;return stageThresholds.filter(n=>n<=g.awakeningProgress).length;}
export function safeAutoAction(s){const h=hostState(s);if(s.hungry?.started||s.cityCrisis?.active||s.ghostMirror?.active||s.regional?.active||s.reunion?.active||s.village?.active||s.spirits.length===2&&s.dual?.review.verdict!=='STABLE'||s.social?.inside||s.social?.conflict.active||s.social?.human.active||s.mall?.active||s.dachang?.started&&(!s.dachang.home.confirmed||s.dachang.zone!=='home'||!s.v1.facilities.includes('isolation'))||s.school?.active||s.doorCase?.active||s.investigation?.active||advancedBusy(s)||s.bus?.active||s.crisis||s.systems.death!=='alive'||s.spirits.some(g=>g.sourceId==='eye'||g.revivalProgress>=60)||h.burdenRatio>1||h.balanceBias>=30||s.city.active||s.journey.active)return null;if(s.combat)return s.combat.position==='safe'&&knowledgeState(s,s.scene).level==='CONFIRMED'?'combat:avoid':null;return s.scene==='hub'&&s.life>=60&&(s.energy<3||s.life<100)?'rest':null;}
const free=s=>!s.bus?.active&&s.scene==='hub'&&!s.combat&&!s.city.active&&!s.journey.active&&!s.crisis&&s.systems.death==='alive'&&s.systems.second?.stage!=='unstable';
const peaceful=s=>hostState(s).balanceBias<30&&s.relations.every(r=>!r.conflictAtoB&&!r.conflictBtoA);
export function v1Available(s){const v=s.v1,out=[],g=s.spirits.find(g=>g.sourceId==='eye'),max=eyeMax(s);
 if(s.systems.death==='committed')return [];
 if(v.items.medium>0&&v.facilities.includes('emergency')&&s.life>10&&s.spirits.length&&s.systems.death==='alive'&&s.scene==='hub')out.push('v1:emergency');
 if(s.crisis)return out;
 if(!s.combat?.eyeV6&&g&&s.combat?.snapshot&&g.development>=50&&s.energy>0&&activeIds(s).includes(g.id)&&g.revivalProgress<95){if(max>=7)out.push('v1:reset:self');if(max>=8)out.push('v1:reset:range');}
 if(s.systems.death==='pending')return out;
 if(s.combat&&!s.combat.eyeV6&&g&&activeIds(s).includes(g.id)&&s.energy>0&&v.eye.layer>0&&v.eye.layer<=max&&!s.combat.cooldowns[g.id])out.push('v1:domain:cast');
 if(s.combat&&v.items.seal>0&&knowledgeState(s,s.scene).level==='CONFIRMED')out.push('v1:seal:cast');
 if(!free(s))return out;
 if(v.build===null||v.cash>=100)out.push(...Object.keys(builds).filter(id=>id!==v.build).map(id=>'v1:build:'+id));
 for(const a of s.spirits){if(!activeIds(s).includes(a.id)&&activeIds(s).length<(s.evolution?.third?.stage===5?3:2))out.push('v1:active:add:'+a.id);if(activeIds(s).includes(a.id))out.push('v1:active:remove:'+a.id);}
 for(const [id,f] of Object.entries(facilities))if(!v.facilities.includes(id)&&v.cash>=f.cash)out.push('v1:facility:'+id);
 for(const [id,f] of Object.entries(itemTypes))if(v.stock[id]>0&&v.items[id]<(v.facilities.includes('warehouse')?3:2)&&v.cash>=f.cash)out.push('v1:buy:'+id);
 for(const a of s.spirits)if(!v.insights.includes('resonance-'+a.sourceId)&&(a.sourceId==='blood'&&s.journey.npcObservations.includes('yan')||a.sourceId==='headless'&&s.journey.chapters.village.completed||a.sourceId==='eye'&&s.chapter.npcObservations.includes('yang')))out.push('v1:resonance:'+a.sourceId);
 if(v.items.gold>0&&s.bags<2)out.push('v1:item:gold');
 if(v.items.film>0&&s.systems.items.barrier<2)out.push('v1:item:film');
 if(v.items.voucher>0)out.push('v1:item:voucher');
 for(const id of Object.keys(factions))if(!v.contacts.includes(id)&&(id!=='civil'||s.journey.chapters.club.completed)&&(id!=='trader'||s.journey.chapters.village.completed))out.push('v1:contact:'+id);
 for(const id of Object.keys(events)){const k=s.knowledge[id];if(k?.clues.includes('witness')&&k.clues.includes('power')&&k.hypotheses.true==='confirmed'&&!v.certified.includes(id)&&(v.items.record>0||v.facilities.includes('intel')&&v.cash>=50))out.push('v1:certify:'+id);}
 const tasks={school:s.chapter.completed,mall:s.journey.chapters.mall.completed,village:s.journey.chapters.village.completed,city:s.city.completed&&s.city.contribution>=30};
 if(v.contacts.includes('official'))for(const [id,ready] of Object.entries(tasks))if(ready&&!v.missions.includes(id))out.push('v1:mission:'+id);
 if(v.eye.fate===null&&s.city.completed&&v.certified.length>=2&&s.spirits.length>=2&&s.hostCapacity>=120&&s.life>=60&&peaceful(s)&&v.cash>=100)out.push('v1:eye:seek');
 if(v.eye.fate==='encounter'&&v.eye.step<3)out.push(['v1:eye:observe','v1:eye:verify','v1:eye:restrict'][v.eye.step]);
 if(v.eye.fate==='encounter'&&v.eye.step===3&&s.bags>0&&s.life>=60&&!g)out.push('v1:eye:capture');
 if(g){if(v.eye.layer<max)out.push('v1:domain:deepen');if(v.eye.layer>0)out.push('v1:domain:contract');if(g.awakeningProgress<100&&v.cash>=100){const insight=nextInsight(s);if(insight)out.push('v1:eye:research:'+insight);}}
 return out;
}
export function nextInsight(s){return [...s.v1.certified.map(id=>'archive-'+id),...(s.city.windowHistory.length===5?['window-location','window-suppression','window-contact','window-restriction']:[]),...(s.advanced.alienStage===2?['body-puzzle']:[])].find(id=>!s.v1.insights.includes(id))||null;}
export function applyV1(s,action){const v=s.v1,k=action.slice(3),log=t=>s.journal.push(t);let extra=null;const eye=s.spirits.find(g=>g.sourceId==='eye');
 if(k.startsWith('build:')){if(v.build!==null)v.cash-=100;if(v.build==='body')s.hostCapacity-=15;v.build=k.slice(6);if(v.build==='body')s.hostCapacity+=15;log('配置'+builds[v.build].name+'方向：'+builds[v.build].benefit+'；代价：'+builds[v.build].cost+'。改配费用100，旧收益先移除。');}
 if(k.startsWith('active:')){v.active=activeIds(s);const [,mode,id]=k.split(':');if(mode==='add')v.active.push(id);else v.active=v.active.filter(x=>x!==id);log('主动规则配置更新；未配置厉鬼仍承担负荷、自然复苏与关系。');}
 if(k.startsWith('facility:')){const id=k.slice(9);v.cash-=facilities[id].cash;v.facilities.push(id);if(id==='isolation')v.items.film=Math.min(3,v.items.film+1);log('安全屋'+facilities[id].name+'已建设；费用不返还。');}
 if(k.startsWith('buy:')){const id=k.slice(4);v.cash-=itemTypes[id].cash;v.stock[id]--;v.items[id]++;log('购入'+itemTypes[id].name+'；库存和现金同步提交，不能无限购买。');}
 if(k==='item:gold'){v.items.gold--;s.bags++;}
 if(k==='item:film'){v.items.film--;s.systems.items.barrier++;}
 if(k==='seal:cast'){v.items.seal--;s.combat.wardWeight=5;s.combat.wardMedium='all';log('限制封条作用已认证媒介，仅阻断本次触发，不关押源头或返还消耗。');}
 if(k==='item:voucher'){v.items.voucher--;v.cash+=50;v.trust.trader=Math.min(100,v.trust.trader+5);log('封装凭证完成一次交易，仅回收50现金；不是赚钱循环。');}
 if(k==='emergency'){v.items.medium--;s.life-=10;s.spirits.forEach(g=>g.suppressionRemaining=3);log('压制室消耗媒介1、身体10，只暂停活动，不回退累计复苏。');}
 if(k.startsWith('contact:')){const id=k.slice(8);v.contacts.push(id);v.trust[id]+=10;log(factions[id].name+'联系建立；来源动机单独记录。');}
 if(k.startsWith('mission:')){const id=k.slice(8);v.missions.push(id);v.cash+=250;v.trust.official=Math.min(100,v.trust.official+10);v.worldRecords.push('提交'+id+'外围行动记录，官方保留封锁与组织约束。');log('阶段记录交接，现金＋250；重复提交不领奖。');}
 if(k.startsWith('resonance:')){const id=k.slice(10),g=s.spirits.find(g=>g.sourceId===id);v.insights.push('resonance-'+id);g.development=Math.min(100,g.development+5);g.revivalProgress=Math.min(100,g.revivalProgress+10);log('同源刺激：开发＋5、该鬼复苏＋10；正史归属不转移。');}
 if(k.startsWith('certify:')){const id=k.slice(8);if(v.items.record>0)v.items.record--;else v.cash-=50;v.certified.push(id);log(events[id].title+'：已有现场记录通过对照复核，角色档案从SUPPORTED升为CONFIRMED。');}
 if(k==='eye:seek'){const context={city:s.city.settlement,certified:[...v.certified].sort(),spirits:s.spirits.map(g=>({id:g.id,revival:g.revivalProgress})),capacity:s.hostCapacity,build:v.build};const f=fateResult(s.seed,'divine-eye-opportunity',context);v.cash-=100;v.eye.decision=f;v.eye.fate=f.roll<60?'encounter':'miss';log(v.eye.fate==='encounter'?'发现鬼眼同源规则线索，必须调查、验证、限制才能尝试驾驭。':'本次命运没有形成机会；结果已提交，不重新抽签。');}
 if(k==='eye:observe'){v.eye.step=1;log('观察同源痕迹；不读取杨间正史实例或自动认证其全部能力。');}
 if(k==='eye:verify'){v.eye.step=2;s.knowledge.eye={clues:['movement','witness','power'],hypotheses:{true:'confirmed'}};log('对照确认本玩家媒介边界；成长、成本均按V1游戏模型。');}
 if(k==='eye:restrict'){v.eye.step=3;log('源头限制方案准备完成，需要隔离袋与宿主承载。');}
 if(k==='eye:capture'){s.bags--;const g=makeSpirit('eye');g.awakeningProgress=1;for(const old of s.spirits)s.relations.push({spiritA:old.id,spiritB:g.id,compatibility:.65,suppressionAtoB:.25,suppressionBtoA:.25,conflictAtoB:0,conflictBtoA:0,burdenSynergy:0,specialInteraction:null,bias:0});s.spirits.push(g);s.outcomes.eye='已驾驭';s.restricted.eye=true;v.eye.fate='taken';log('鬼眼玩家实例初醒1%；新增负荷45、复苏25，杨间正史实例不变。需要在主动规则中配置后才能战斗调用。');}
 if(k==='domain:deepen')v.eye.layer++;
 if(k==='domain:contract')v.eye.layer--;
 if(k.startsWith('eye:research:')){const id=k.slice(13);v.cash-=100;v.insights.push(id);eye.development=Math.min(100,eye.development+5);const old=eye.awakeningProgress;eye.awakeningProgress=stageThresholds.find(n=>n>old)??100;log('独立苏醒度提升至'+eye.awakeningProgress+'%；这不是复苏进度，研究开发＋5，依据'+id+'不可重复使用。');if(eye.awakeningProgress===100){eye.revivalProgress=100;v.eye.layer=0;log('完全苏醒触发厉鬼复苏危机；不是免费解锁无敌。');}}
 if(k.startsWith('reset:')){s.energy--;const range=k==='reset:range';const snapshot=s.combat.snapshot;const fields=['life','position','playerGauge','cooldowns'];if(range&&ruleContest(6,events[s.scene].ruleWeight||2)==='blocked')fields.push('sourceGauge');const restored=resetTemporary(s,snapshot,{id:'eye-reset',kind:'divine',scope:range?'combat':'self',fields});s.life=restored.life;s.combat=restored.combat;s.systems.death='alive';extra={id:eye.id,amount:range?24:18};log('重启'+(range?'当前遭遇临时范围':'自身临时状态')+'；物品、能量、复苏代价、命运、Build、城市与NPC结果不回滚。');}
 if(k==='domain:cast'){s.energy--;eye.development=Math.min(100,eye.development+3);const layer=v.eye.layer;s.combat.wardWeight=layer+(v.build==='domain'?1:0);s.combat.wardMedium='all';s.combat.cooldowns[eye.id]=2;if(layer<=2)s.combat.position='safe';if(layer===3&&!s.knowledge[s.scene]?.clues.includes('movement')){s.knowledge[s.scene]??={clues:[],hypotheses:{}};s.knowledge[s.scene].clues.push('movement');log('灵异感知发现一条现场迹象；仍需交叉验证，不自动认证档案。');}if(layer>=5&&ruleContest(layer,events[s.scene].ruleWeight||2)==='blocked')s.combat.sourceGauge=0;extra={id:eye.id,amount:6+layer*2+(v.build==='domain'?3:0)};log(domainNames[layer]+'：规则对抗与行动窗口改变，承担独立复苏，不消灭源头。');}
 return {extra};
}
export function v1Ward(s,g,id){let weight=(events[g.sourceId].ruleWeight||2)+developmentTier(g);const b=s.v1?.build;if(b==='suppression')weight++;if(b==='stable')weight=Math.max(0,weight-1);if(b==='rule'&&knowledgeState(s,id).level==='CONFIRMED')weight+=2;return Math.min(10,weight);}
export function v1ExtraUsage(s){return {suppression:2,mind:1,rule:4}[s.v1?.build]||0;}
export function validV1(s){const v=s.v1;if(v===undefined)return true;const integer=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max;const unique=(x,allowed)=>Array.isArray(x)&&new Set(x).size===x.length&&x.every(id=>allowed.includes(id));if(!v||v.format!==1||!integer(v.cash,100000)||!(v.build===null||Object.hasOwn(builds,v.build))||!(v.active===null||unique(v.active,s.spirits.map(g=>g.id))&&v.active.length<=(s.evolution?.third?.stage===5?3:2))||!unique(v.facilities,Object.keys(facilities))||!unique(v.contacts,Object.keys(factions))||!unique(v.missions,['school','mall','village','city'])||!unique(v.certified,Object.keys(events))||!unique(v.insights,[...Object.keys(events).flatMap(id=>['archive-'+id,'resonance-'+id]),'window-location','window-suppression','window-contact','window-restriction','body-puzzle'])||!v.items||!v.stock||!v.trust)return false;
 for(const id of Object.keys(itemTypes))if(!integer(v.items[id],3)||!integer(v.stock[id],2))return false;for(const id of Object.keys(factions))if(!Number.isInteger(v.trust[id])||Math.abs(v.trust[id])>100)return false;
 if(!Array.isArray(v.worldRecords)||v.worldRecords.length>20||v.worldRecords.some(t=>typeof t!=='string'||t.length>500))return false;
 const e=v.eye;if(!e||![null,'encounter','miss','taken'].includes(e.fate)||!integer(e.step,3)||!integer(e.layer,8)||e.layer>eyeMax(s))return false;if(e.fate===null&&e.decision!==null||e.fate!==null&&!e.decision)return false;if(e.decision){const d=e.decision;if(!d.context||typeof d.context!=='object')return false;const f=fateResult(s.seed,'divine-eye-opportunity',d.context);if(d.roll!==f.roll||d.signature!==f.signature||(e.fate==='miss')!==(d.roll>=60))return false;}if(e.fate==='taken'&&!s.outcomes.eye)return false;
 return s.spirits.every(g=>g.sourceId!=='eye'||Number.isInteger(g.awakeningProgress)&&g.awakeningProgress>=1&&g.awakeningProgress<=100);
}

