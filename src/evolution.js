import {activeIds} from './v1.js';
import {events} from './content.js';
import {makeSpirit,relationship} from './progression.js';
import {hostState} from './spirits.js';
import {node,nodeDefaults,ruleBlocked,quotaContest,regionCount,graphState,masteryStable,advancedBusy} from './evolution-model.js';
const free=s=>s.scene==='hub'&&!s.bus?.active&&!s.city.active&&!s.combat&&!s.journey.active&&!s.crisis&&s.systems.death==='alive'&&!['restricted','matched','unstable'].includes(s.systems.second?.stage);
const resource=s=>s.city.resources.fragments;
const ready=s=>hostState(s).burdenRatio<=1&&s.life>=60&&s.spirits.every(g=>g.revivalProgress<80)&&graphState(s).stable;
const pairKey=(a,b)=>[a,b].sort().join('|');
export function evolutionAvailable(s){const e=s.evolution,out=[];if(!e||s.systems.death==='committed')return out;
 if(e.cascade){if(s.systems.items.barrier>0)out.push('evo:cascade:shield');if(s.energy>0&&e.host.anchor&&!ruleBlocked(s,e.host.anchor))out.push('evo:cascade:anchor');if(s.bags>0&&e.cascade.affected.some(id=>node(s,id).structure!=='STRUCTURAL'))out.push('evo:cascade:seal');out.push('evo:cascade:wait');return out;}
 if(s.systems.death!=='alive'){if(s.systems.death==='pending'&&e.host.form===3&&e.host.integrity>=60&&e.host.continuity!=='失去自我'&&e.host.anchor&&!ruleBlocked(s,e.host.anchor)&&e.host.core&&!ruleBlocked(s,e.host.core)&&s.energy>0)out.push('evo:host:survive');return out;}
 if(e.encounter?.active){const x=e.encounter;out.push('evo:officer:observe','evo:officer:gather','evo:officer:split','evo:officer:retreat');if(x.evidence>=2&&x.step<3)out.push('evo:officer:advance');if(x.step>=3&&x.evidence>=3&&x.gathered&&s.bags>0)out.push('evo:officer:restrict');if(s.energy>0)out.push(...s.spirits.filter(g=>activeIds(s).includes(g.id)&&!ruleBlocked(s,g.id)).map(g=>'evo:officer:resist:'+g.id));return out;}
 if(!free(s))return out;
 if(e.third&&e.third.stage<5){const t=e.third;if(t.stage===0)out.push(...s.spirits.filter(g=>!t.tests.includes(g.id)).map(g=>'evo:third:test:'+g.id));if(t.stage===1)out.push('evo:third:capacity');if(t.stage===2)out.push('evo:third:role:STABILIZER','evo:third:role:BRIDGE','evo:third:role:ANCHOR');if(t.stage===3&&s.systems.items.barrier>0&&ready(s))out.push('evo:third:implant');if(t.stage===4&&s.energy>0)out.push('evo:third:stabilize');if(t.stage<4)out.push('evo:third:cancel');return out;}
 if(e.host.step>0&&e.host.step<4){if(e.host.step===1&&s.systems.items.barrier>0&&ready(s))out.push('evo:host:transfer');if(e.host.step===2&&s.energy>0)out.push(...s.spirits.filter(g=>g.id!==e.host.core&&g.development>=25&&!ruleBlocked(s,g.id)).map(g=>'evo:host:anchor:'+g.id));if(e.host.step===3&&ready(s)&&e.host.integrity>=70)out.push('evo:host:verify');if(e.host.step===1)out.push('evo:host:cancel');return out;}
 if(e.mastery){const m=e.mastery,g=s.spirits.find(g=>g.id===m.id);if(m.step===0&&resource(s)>0)out.push('evo:mastery:prepare');if(m.step===1&&s.energy>0)out.push('evo:mastery:control');if(m.step===2&&s.systems.items.barrier>0)out.push('evo:mastery:integrate');if(m.step===3&&s.energy>0&&g.revivalProgress<90)out.push('evo:mastery:independent');if(m.step===4&&s.energy>0)out.push('evo:mastery:stress');if(m.step===5&&node(s,g.id).stress<=30&&e.host.integrity>=70)out.push('evo:mastery:verify');if(m.step===5&&node(s,m.id).stress>0)out.push('evo:mastery:recover');out.push('evo:mastery:withdraw');return out;}
 if(e.encounter&&!e.encounter.active&&e.encounter.step<5)out.push('evo:officer:resume');
 if(s.city.completed&&!e.encounter)out.push('evo:officer:start');
 if(e.encounter&&!e.encounter.active&&e.encounter.step===5&&e.officer.stage<3&&resource(s)>0)out.push('evo:officer:research');
 if(e.officer.stage===3&&s.bags>0&&s.spirits.length>=2&&s.spirits.length<3&&ready(s)&&hostState(s).effectiveBurden+38<=hostState(s).hostCapacity)out.push('evo:officer:acquire');
 if(s.spirits.length>=3&&!e.third&&ready(s))out.push('evo:third:adopt');
 if(s.spirits.length===2&&ready(s)&&!e.third)out.push(...s.systems.sealed.filter(id=>!['eye','hungry','officer'].includes(id)&&s.knowledge[id]?.clues.length>=2).map(id=>'evo:third:begin:'+id));
 for(const r of s.relations)if(!e.observed.includes(pairKey(r.spiritA,r.spiritB)))out.push('evo:graph:observe:'+pairKey(r.spiritA,r.spiritB));
 if(s.spirits.length>=2&&resource(s)>0&&ready(s)&&e.host.form<3&&e.host.step===0){if(s.spirits.some(g=>g.sourceId==='headless'&&g.development>=25))out.push('evo:host:begin:body');if(s.spirits.some(g=>g.sourceId==='echo'&&g.development>=25))out.push('evo:host:begin:mind');if(s.spirits.some(g=>g.sourceId==='headless'&&g.development>=25)&&s.spirits.some(g=>g.sourceId==='echo'&&g.development>=25))out.push('evo:host:begin:hybrid');}
 for(const g of s.spirits){if(!node(s,g.id).studied&&s.v1.certified.includes(g.sourceId)&&resource(s)>0)out.push('evo:study:'+g.id);if(activeIds(s).includes(g.id)&&g.sourceId!=='eye'&&g.development>=35&&s.v1.certified.includes(g.sourceId)&&resource(s)>0&&ready(s)&&node(s,g.id).mastery<4)out.push('evo:mastery:begin:'+g.id);if(activeIds(s).includes(g.id)&&masteryStable(s,g.id)&&s.energy>0)out.push('evo:mastery:call:'+g.id);}
 if(s.spirits.some(g=>node(s,g.id).stress>0))out.push('evo:mastery:recover');
 if(e.host.form===3&&resource(s)>0&&e.host.integrity<100)out.push('evo:host:repair');
 return out;
}
export function applyEvolution(s,a){const e=s.evolution,k=a.slice(4),log=t=>{s.journal.push(t);e.history.push(t);e.history=e.history.slice(-60);};let used=null;
 if(k.startsWith('study:')){const g=s.spirits.find(g=>g.id===k.slice(6));s.city.resources.fragments--;e.nodes[g.id].studied=true;g.development=Math.min(100,g.development+20);log('消耗片段1进行一次有证据的规则实验，开发＋20；不能重复研究或把开发等同完美驾驭。');}
 if(k==='officer:start'){e.encounter={active:true,step:0,quota:2,slice:s.tick,gathered:false,blocked:[],evidence:0,lower:0,upper:null,damage:0};log('鬼差相关规则调查开始：当前压制数量未知。队员仅为原创外围观察者，不替代正史人物。');}
 const x=e.encounter;
 if(k==='officer:resume'){x.active=true;log('重新进入此前规则区域；已有证据与时间片保留，不重置已提交结果。');}
 if(k==='officer:observe'){x.evidence=Math.min(3,x.evidence+1);if(x.evidence>=2)x.lower=x.quota;if(x.evidence===3)x.upper=x.quota;log(x.evidence<2?'观察到规则停顿；单次迹象不能确定数量。':'对照人数、驾驭数量与规则表现，获得本时间片数量边界。');}
 if(k==='officer:gather'){x.gathered=true;log('两名外围驭鬼者进入同一规则区域，共携带三只灵异。隔离袋和未配置鬼不改变实际计数。');}
 if(k==='officer:split'){x.gathered=false;log('外围队员退至隔离区域；你的全部驾驭实例重新计入当前区域。');}
 if(k==='officer:advance'){x.step++;if(x.step===2){x.quota=3;x.evidence=0;x.lower=0;x.upper=null;log('事件出现新的规则时间片。此前上界不再可靠，需要重新观察。');}else log('规律窗口推进。原著鬼差的归属和后续世界节点不被玩家调查替代。');}
 if(k==='officer:restrict'){s.bags--;x.active=false;x.blocked=[];x.step=5;e.officer.stage=1;log('在聚集与数量对照的窗口中完成外围限制记录；源头没有被杀死，鬼差也不是掉落奖励。');}
 if(k==='officer:retreat'){x.active=false;x.blocked=[];x.step=Math.min(x.step,4);log('退出规则区域；受压制规则恢复，累计复苏、档案、消耗与正史结果保留。');}
 if(k.startsWith('officer:resist:')){const id=k.slice(15),g=s.spirits.find(g=>g.id===id);s.energy--;used=id;x.damage=Math.max(0,x.damage-8);log(g.name+'争取一个撤离窗口；未改变鬼差数量配额。');}
 if(k==='officer:research'){s.city.resources.fragments--;e.officer.stage++;log('独立同源玩家方案研究推进，消耗片段1；不是夺取黄岗村或正史鬼差。');}
 if(k==='officer:acquire'){s.bags--;const g=makeSpirit('officer');for(const old of s.spirits)s.relations.push({...relationship(old,g),compatibility:.7,suppressionAtoB:.3,suppressionBtoA:.3,conflictAtoB:0,conflictBtoA:0});s.spirits.push(g);e.nodes[g.id]=nodeDefaults();s.outcomes.officer='已驾驭';s.restricted.officer=true;e.officer.stage=4;log('取得独立S级鬼差玩家实例，初始数量配额1（游戏改编）。新增负荷38、复苏28；吞并成长未考据，不开放无限吞鬼。');}
 if(k.startsWith('graph:observe:')){e.observed.push(k.slice(14));log('完成一次关系对照，档案只公开已经观察的有向关系。');}
 if(k==='third:adopt'){e.third={sourceId:s.spirits[2].sourceId,stage:4,tests:s.spirits.slice(0,2).map(g=>g.id),role:'STABILIZER'};log('既有第三鬼进入网络重新观察，不重复取得实例、收费植入或重置复苏。');}
 if(k.startsWith('third:begin:')){e.third={sourceId:k.slice(12),stage:0,tests:[],role:'STABILIZER'};log('第三鬼方案锁定已封存实例，先独立测试A↔C与B↔C，不重新抽取候选。');}
 if(k.startsWith('third:test:')){const t=e.third,id=k.slice(11);t.tests.push(id);if(t.tests.length===2)t.stage=1;log('候选关系实验完成；相容不等于植入成功，也不直接降低复苏。');}
 if(k==='third:capacity'){const t=e.third,c=makeSpirit(t.sourceId);if(hostState(s).effectiveBurden+c.burden<=hostState(s).hostCapacity)t.stage=2;else log('承载不足，不能植入；可取消方案后完善结构。');}
 if(k.startsWith('third:role:')){e.third.role=k.slice(11);e.third.stage=3;log('选择结构用途：'+e.third.role+'。用途不是额外增益，实际关系仍需结算。');}
 if(k==='third:implant'){const t=e.third,g=makeSpirit(t.sourceId),relations=s.spirits.map(old=>relationship(old,g));s.systems.items.barrier--;if(relations.some(r=>r.compatibility<.4)){t.stage=5;log('植入方案不满足结构相容，媒介已消耗；候选仍封存，不能凭用途标签强行成功。');}else{for(const r of relations){r.conflictAtoB=Math.max(0,r.conflictAtoB-1);r.conflictBtoA=Math.max(0,r.conflictBtoA-1);r.suppressionAtoB=Math.max(.25,r.suppressionAtoB);r.suppressionBtoA=Math.max(.25,r.suppressionBtoA);}s.relations.push(...relations);s.spirits.push(g);e.nodes[g.id]={...nodeDefaults(),role:t.role};s.systems.sealed=s.systems.sealed.filter(id=>id!==g.sourceId);s.outcomes[g.sourceId]='已驾驭';g.stability='不稳定';t.stage=4;log('第三鬼植入成功，进入网络观察期；不赠送容量或完美驾驭。');}}
 if(k==='third:stabilize'){s.energy--;e.third.stage=5;s.spirits.at(-1).stability='稳定';log('三鬼网络观察完成；三个主动规则位开放，未配置鬼仍计数、负荷与自然复苏。');}
 if(k==='third:cancel')e.third=null;
 if(k.startsWith('host:begin:')){const route=k.slice(11),g=s.spirits.find(g=>g.sourceId===(route==='mind'?'echo':'headless'));s.city.resources.fragments--;e.host={...e.host,route,form:2,step:1,core:null,anchor:null};e.host.candidate=g.id;log((route==='mind'?'回声原创意识媒介':'无头鬼影身体拼图')+'进入结构转移方案；仍是候选，不是选择职业。');}
 if(k==='host:transfer'){s.systems.items.barrier--;const h=e.host,id=h.candidate;e.nodes[id].structure='STRUCTURAL';e.nodes[id].role='CORE';e.nodes[id].capacity=20;h.core=id;h.step=2;h.integrity-=10;if(h.route==='hybrid'){const g=s.spirits.find(g=>g.sourceId==='echo');e.nodes[g.id].structure='STRUCTURAL';e.nodes[g.id].capacity=10;}log('存在支撑转移至灵异结构。基础负荷保留，承载与有效负荷由结构派生；医疗不能逆转永久结构。');}
 if(k.startsWith('host:anchor:')){s.energy--;e.host.anchor=k.slice(12);e.nodes[e.host.anchor].role='ANCHOR';e.host.step=3;log('建立自我锚点，下一步必须验证意识连续性和独立结构支撑。');}
 if(k==='host:verify'){e.host.form=3;e.host.step=4;log('异类验证完成：生物身体不再是唯一支撑，意识和结构仍能被规则破坏；并未完美驾驭所有鬼。');}
 if(k==='host:cancel'){e.host.form=1;e.host.route=null;e.host.step=0;}
 if(k==='host:focus'){s.energy=3;e.host.integrity-=5;log('依靠灵异结构恢复行动能力，自我完整性－5；毁损生物身体没有被医疗恢复。');}
 if(k==='host:survive'){s.energy--;s.life=1;s.systems.death='alive';s.combat=null;s.scene='hub';e.host.integrity-=20;e.host.continuity='动摇';e.host.shellDestroyed=true;log('有效结构核心与自我锚点延续意识，生物身体损毁仍保留；不是免费恢复身体或复活。');}
 if(k==='host:repair'){s.city.resources.fragments--;if(e.host.shellDestroyed)s.life=Math.min(100,s.life+15);e.host.integrity=Math.min(100,e.host.integrity+15);for(const n of Object.values(e.nodes))if(n.structure==='STRUCTURAL')n.integrity=Math.min(100,n.integrity+15);log('消耗结构片段修补灵异支撑；不恢复复苏、不复活死亡锚点。');}
 if(k.startsWith('mastery:begin:')){const id=k.slice(14),g=s.spirits.find(g=>g.id===id);e.mastery={id,step:0,route:g.sourceId==='headless'||g.sourceId==='blood'?'body':g.sourceId==='echo'?'mind':'medium',tests:0,previous:node(s,id).mastery};log(g.name+'开启专属整合事件：先复核规则，再控制、整合、脱离外部支撑、高强度测试和观察验证。');}
 if(k==='mastery:prepare'){s.city.resources.fragments--;e.mastery.step=1;log({body:'核对身体媒介接管边界与不可逆结构损伤。',mind:'核对原创意识媒介与自我记忆锚点。',medium:'重建媒介触发链与封装边界。'}[e.mastery.route]);}
 if(k==='mastery:control'){s.energy--;e.mastery.step=2;used=e.mastery.id;e.nodes[used].mastery=3;log('主动控制实验完成：宿主占优不等于完美。');}
 if(k==='mastery:integrate'){s.systems.items.barrier--;e.mastery.step=3;e.nodes[e.mastery.id].structure=e.nodes[e.mastery.id].structure==='STRUCTURAL'?'STRUCTURAL':'EMBEDDED';log('整合媒介提交，结构状态与驾驭状态分别保存。');}
 if(k==='mastery:independent'){const m=e.mastery,g=s.spirits.find(g=>g.id===m.id),n=e.nodes[m.id];s.energy--;const independentCost=g.naturalRevivalRate+g.usageRevivalRate;g.revivalProgress=Math.min(100,g.revivalProgress+independentCost);m.tests++;if(g.revivalProgress<95&&g.development>=35&&s.life>=60){m.step=4;log('临时撤去关系与外部压制，独立调用实验通过；对应复苏代价保留。');}else{m.step=5;n.mastery=2;log('脱离支撑后不稳定，判定为不完全整合；不能获得完美奖励。');}}
 if(k==='mastery:stress'){const m=e.mastery,n=e.nodes[m.id];s.energy--;n.stress=Math.min(100,n.stress+20);m.tests++;m.step=5;log('高强度结构测试完成，产生整合压力20；需观察恢复而非立即发放无代价驾驭。');}
 if(k==='mastery:verify'){const m=e.mastery,n=e.nodes[m.id];if(m.tests===2&&n.mastery===3){n.mastery=4;n.verified=true;log('该灵异独立稳定验证通过，完美整合。历史复苏数值不归零；高强度调用转为整合压力。');}else log('验证结束：不完全整合，保留研究成果，尚未完美。');e.mastery=null;}
 if(k==='mastery:withdraw'){const n=e.nodes[e.mastery.id];n.mastery=Math.min(3,n.mastery);n.verified=false;e.mastery=null;log('停止验证；已消耗媒介和累计代价不返还，候选成果保留。');}
 if(k.startsWith('mastery:call:')){const id=k.slice(13);s.energy--;used=id;log('调用已整合规则：承担整合压力，仍计入鬼差数量。');}
 if(k==='mastery:recover'){for(const n of Object.values(e.nodes))n.stress=Math.max(0,n.stress-15);log('主动观察与降压，整合压力下降15；历史复苏不下降。');}
 if(k==='cascade:shield'){s.systems.items.barrier--;for(const g of s.spirits)if(e.cascade.affected.includes(g.id))g.suppressionRemaining=3;if(e.encounter)e.encounter.active=false;for(const n of Object.values(e.nodes)){n.stress=Math.min(50,n.stress);n.integrity=Math.max(60,n.integrity);}e.host.integrity=Math.max(60,e.host.integrity);e.host.continuity='动摇';e.cascade=null;log('媒介隔离争取回稳；敌对压制解除，历史复苏与永久结构仍保留。');}
 if(k==='cascade:anchor'){s.energy--;e.host.integrity=Math.min(100,e.host.integrity+20);for(const n of Object.values(e.nodes))n.stress=Math.max(0,n.stress-20);for(const g of s.spirits)if(e.cascade.affected.includes(g.id))g.suppressionRemaining=3;e.cascade=null;log('有效锚点维持自我连续性；未让断裂规则自动恢复。');}
 if(k==='cascade:seal'){const id=e.cascade.affected.find(id=>node(s,id).structure!=='STRUCTURAL'),g=s.spirits.find(g=>g.id===id);s.bags--;s.systems.sealed.push(g.sourceId);s.outcomes[g.sourceId]='紧急封存';s.spirits=s.spirits.filter(g=>g.id!==id);s.relations=s.relations.filter(r=>r.spiritA!==id&&r.spiritB!==id);delete e.nodes[id];e.observed=e.observed.filter(key=>!key.split('|').includes(id));s.systems.combinations=s.systems.combinations.filter(c=>!c.ids.includes(id));e.cascade=null;log('封存非结构节点，移除所有依赖关系；不能像装备一样卸下存在核心。');}
 if(k==='cascade:wait'){e.cascade.windows--;if(e.cascade.windows===0){e.host.integrity=Math.max(0,e.host.integrity-40);e.host.continuity='失去自我';s.life=0;s.systems.death='pending';e.cascade=null;log('错过反应窗口，自我连续性断裂，进入死亡提交窗口；身体仍存在不代表角色还存活。');}}
 return {used};
}
export function advanceEvolution(s,used){const e=s.evolution;if(!e)return;for(const g of s.spirits)e.nodes[g.id]??=nodeDefaults();const x=e.encounter;if(x?.active){x.slice=s.tick;x.blocked=quotaContest(regionCount(s),x.quota,5,Math.max(1,...s.spirits.map(g=>(events[g.sourceId].ruleWeight||2)+Math.floor(g.development/25)+(g.sourceId==='eye'&&g.awakeningProgress>=70?2:0))))==='完全规则压制'?s.spirits.map(g=>g.id):[];if(x.blocked.length){x.damage=Math.min(100,x.damage+8);s.life=Math.max(0,s.life-8);s.journal.push('数量条件与规则权重均成立，主动规则被压制；基础负荷与历史复苏不变。');}}
 const ids=Array.isArray(used)?used:[used];for(const g of s.spirits){const n=e.nodes[g.id];if(n.mastery===4&&ids.includes(g.id))n.stress=Math.min(100,n.stress+18);if(n.stress>=60){n.verified=false;n.mastery=1;n.integrity=Math.max(0,n.integrity-20);if(!e.cascade)e.cascade={cause:'主导反转',windows:2,affected:[g.id]};}}
 const invalid=s.spirits.filter(g=>node(s,g.id).structure==='STRUCTURAL'&&ruleBlocked(s,g.id));if(invalid.length&&!e.cascade)e.cascade={cause:'结构失效',windows:2,affected:invalid.map(g=>g.id)};
 if(x?.blocked.length&&x.blocked.length<s.spirits.length&&graphState(s).isolated.length&&!e.cascade)e.cascade={cause:'规则断连',windows:2,affected:graphState(s).isolated};
 if(s.life===0&&s.systems.death==='alive')s.systems.death='pending';
 if(s.systems.death==='committed'&&!e.history.includes('角色死亡后留下玩家实例灵异残余。'))e.history.push('角色死亡后留下玩家实例灵异残余。');
}

export function postEvolution(s){const e=s.evolution;if(!e)return;const endangered=s.spirits.filter(g=>g.revivalProgress===100&&node(s,g.id).structure==='STRUCTURAL'&&g.suppressionRemaining===0&&!ruleBlocked(s,g.id));if(endangered.length&&!e.cascade)e.cascade={cause:'厉鬼夺取结构',windows:2,affected:endangered.map(g=>g.id)};}
