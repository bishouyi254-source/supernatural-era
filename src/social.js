import {socialUXAvailable,applySocialUX,advanceSocialUX} from './social-ux.js';
import {socialPeople,offers,newSocial} from './social-model.js';
import {activeIds,v1Ward,eyeMax} from './v1.js';
import {advancedBusy,masteryStable} from './evolution-model.js';
import {ruleFor,ruleContest,develop} from './rules.js';
import {events} from './content.js';
const log=(s,t)=>{s.social.history.push(t);s.social.history=s.social.history.slice(-80);s.journal.push(t);};
const once=(a,v)=>{if(!a.includes(v))a.push(v);};
export const socialBusy=s=>!!(s.social?.inside||s.social?.conflict.active||s.social?.human.active);
export const socialReady=s=>!!(s.dachang?.started&&s.mall?.canonResolved&&!s.mall.active);
const free=s=>s.scene==='hub'&&!s.school.active&&!s.doorCase.active&&!s.investigation.active&&!s.mall.active&&!s.journey.active&&!s.city.active&&!s.bus.active&&!s.combat&&!s.crisis&&s.systems.death==='alive'&&!advancedBusy(s)&&!['restricted','matched','unstable'].includes(s.systems.second?.stage);
export function socialAvailable(s){const out=socialAvailableCore(s);return s.cityCrisis?.organization.leader==='DEAD'?out.filter(a=>!/^social:(club:|contact:wang|buy:|item:|asset:|sell:|ask:|seller:)/.test(a)):out;}
function socialAvailableCore(s){if(!free(s))return [];const x=s.social;if(!x?.started)return socialReady(s)?['social:start']:[];const out=socialUXAvailable(s);
 if(x.human.active){out.push('social:human:withdraw');for(const e of ['AUDIO','SILENT','LOG','ROUTE'])if(!x.human.evidence.includes(e))out.push('social:human:'+e);if(['AUDIO','SILENT','LOG','ROUTE'].every(e=>x.human.evidence.includes(e))&&!x.human.distributionStopped)out.push('social:human:stop');if(x.human.distributionStopped&&!x.human.isolated)out.push('social:human:isolate');if(!x.human.warned)out.push('social:human:warn');if(x.human.isolated&&x.human.warned)out.push('social:human:refer');return out;}
 if(x.conflict.active){out.push('social:conflict:withdraw','social:conflict:probe');if(!x.conflict.leverage)out.push('social:conflict:leverage');else out.push('social:conflict:negotiate');out.push('social:conflict:threaten');if(s.energy>0)out.push(...activeIds(s).map(id=>'social:cast:'+id));return out;}
 if(!x.reviewed)out.push('social:review');if(!x.yanContact)out.push('social:contact:yan');else if(!x.yanConsulted)out.push('social:consult:yan');
 if(!x.rulesRead)out.push('social:club:rules');else if(!x.inside&&x.affiliation!=='HOSTILE')out.push('social:club:enter');
 if(x.inside){out.push('social:club:leave');for(const p of ['wang','informant','trader','volatile'])if(!x.knownBy[p].includes('MET'))out.push('social:contact:'+p);if(!x.declined&&x.affiliation!=='MEMBER')out.push('social:club:decline');if(x.affiliation!=='MEMBER'&&x.affiliation!=='HOSTILE')out.push('social:club:join');
 if(x.knownBy.informant.includes('MET')){for(const [id,o]of Object.entries(offers))if(!x.ux?.refused&&!x.bought.includes(id)&&s.v1.cash>=o.price)out.push('social:buy:'+id);if(s.mall.evidence.length&&!x.sales.includes('CASE'))out.push('social:sell:case');for(const g of s.spirits)if(!x.sales.includes(g.id))out.push('social:sell:'+g.id);}
 if(x.knownBy.trader.includes('MET')){for(const [id,cost]of Object.entries({gold:120,medium:100,record:100}))if(x.trade.stock[id]>0&&s.v1.cash>=cost&&Object.values(s.v1.items).reduce((a,b)=>a+b,0)<(s.v1.facilities.includes('warehouse')?3:2))out.push('social:item:'+id);if(!x.trade.checked)out.push('social:asset:check');else if(!x.trade.sealedBought&&s.v1.cash>=180)out.push('social:asset:buy');if(x.trade.sealedBought&&!x.trade.sourceChecked)out.push('social:asset:investigate');}
 if(x.knownBy.volatile.includes('MET')&&!x.controller.dead&&x.conflict.records.length<20)out.push('social:conflict:start');if(s.energy>0)out.push(...activeIds(s).map(id=>'social:cast:'+id));const eye=s.spirits.find(g=>g.sourceId==='eye');if(eye&&activeIds(s).includes(eye.id)&&s.energy>0&&s.v1.eye.layer>0&&s.v1.eye.layer<=eyeMax(s))out.push('social:domain');
 }
 for(const id of x.bought)if(!x.verified.includes(id))out.push('social:verify:'+id);
 if(!x.human.discovered)out.push('social:human:lead');else if(!x.human.referred&&!x.inside)out.push('social:human:enter');
 if(x.officialChanged&&!x.officialRead)out.push('social:official');if(x.villageSignal&&!x.villageKnown)out.push('social:village:query');if(x.villageKnown){for(const p of ['contact','resources','risk','retreat'])if(!x.preparation[p])out.push('social:prep:'+p);for(const v of ['PREPARE','WAIT','DECLINE'])if(x.preparation.intent!==v)out.push('social:intent:'+v);}
 for(const r of x.residuals)if(r.status==='ACTIVE'){if(s.bags>0)out.push('social:residual:isolate');out.push('social:residual:refer');}
 return [...new Set(out)];}
export function socialAllows(s,a){if(!socialBusy(s)||s.crisis||s.systems.death!=='alive'||advancedBusy(s))return true;return a.startsWith('social:')||a.startsWith('reaction:')||a.startsWith('death:')||a==='suppress'||a.startsWith('abandon');}
function expose(s,fact,audiences,source){const x=s.social;for(const p of audiences)once(x.knownBy[p],fact);x.exposures.push({fact,audiences,source,tick:s.tick});x.exposures=x.exposures.slice(-60);if(!x.spread.some(e=>e.fact===fact&&e.target==='volatile'))x.spread.push({fact,target:'volatile',due:s.dachang.timeUnits+12,done:false});x.spread=x.spread.slice(-60);}
const flag=(s,f)=>once(s.social.conflict.flags,f);
function endConflict(s,result){const c=s.social.conflict;c.active=false;c.result=result;c.records.push({result,flags:[...c.flags],tick:s.tick});c.records=c.records.slice(-20);log(s,'冲突结果：'+result+'；实际披露、消耗与世界后果保留。');}
function releaseController(s){const x=s.social;x.controller.dead=true;x.controller.revival=100;x.controller.structuralSpirits=x.controller.spirits.filter(g=>g.structure==='STRUCTURAL').map(g=>g.id);x.residuals.push({id:'social-controller-release',sourceId:'echo',ruleId:'rule:echo',status:'ACTIVE',tick:s.tick});flag(s,'CONTROLLER_CRISIS');flag(s,'SUPERNATURAL_ESCALATION');x.affiliation='HOSTILE';endConflict(s,'原创驭鬼者失控死亡，携带的回声媒介形成独立残余事件');}
export function applySocial(s,a){const x=s.social,k=a.slice(7);let used=null;const uxResult=applySocialUX(s,a);if(uxResult)return uxResult.used;
 if(k==='start'){x.started=true;x.startUnits??=s.dachang.timeUnits;x.lastTick=s.tick-1;log(s,'商场后的民间社会路线开放。复盘以本人的真实参与记录为准。');}
 else if(k==='review'){x.reviewed=true;log(s,'复盘商场真实成本：隔离袋 '+s.mall.costs.bags+'、调用 '+s.mall.costs.uses+'；没有参与的经过仍是未知。');}
 else if(k==='contact:yan'){x.yanContact=true;once(x.knownBy.yan,'MET');log(s,s.mall.npc.yanMet?'联系曾实际接触的严力；合作不等于无条件信任。':'通过民间渠道初次联系严力，没有补造商场友情。');}
 else if(k==='consult:yan'){x.yanConsulted=true;once(x.knowledge,'BALANCE_THEORY');log(s,'严力谈及驭鬼者生存压力与多鬼平衡理论【得到支持】；未读取他的后台复苏，也未获得免费技能。');}
 else if(k==='club:rules'){x.rulesRead=true;if(x.affiliation==='NONE')x.affiliation='KNOWN';log(s,'阅读小强俱乐部的身份与交易约定。它是民间联系点，没有灵异免疫保证。');}
 else if(k==='club:enter'){x.inside=true;s.dachang.zone='commercial';if(x.affiliation==='KNOWN')x.affiliation='GUEST';log(s,'以访客身份进入小强俱乐部，普通人也能联系和交易。');}
 else if(k==='club:leave'){x.inside=false;s.dachang.zone='street';log(s,'离开俱乐部，实际观测与披露记录不会消失。');}
 else if(k==='club:decline'){x.declined=true;log(s,'拒绝长期加入；世界与村庄信号继续发展。');}
 else if(k==='club:join'){x.affiliation='MEMBER';expose(s,'IDENTITY',[ 'wang' ],'本人会员登记');log(s,'接受会员联系条件，公开登记身份；无能力加成，不取代王小强。');}
 else if(k.startsWith('contact:')){const p=k.slice(8);once(x.knownBy[p],'MET');log(s,'与'+socialPeople[p]+'建立实际联系；能力仍只按观察与披露判断。');}
 else if(k.startsWith('buy:')){const id=k.slice(4),o=offers[id];s.v1.cash-=o.price;x.bought.push(id);x.claims.push({id,claim:o.claim,root:o.root,level:'SUSPECTED',tick:s.tick});if(['GUEST','KNOWN'].includes(x.affiliation))x.affiliation='TRADING_CONTACT';log(s,'买入有出处的说法【疑似】，现金 −'+o.price+'；购买不等于确认。');}
 else if(k.startsWith('verify:')){const id=k.slice(7);x.verified.push(id);if(id==='false'){x.claims.find(c=>c.id===id).level='DISPROVEN';log(s,'将招揽承诺与现有复苏观察对照：会员身份不能阻止复苏，承诺被否定。');}else{const roots=new Set(x.claims.filter(c=>c.id!=='false'&&x.verified.includes(c.id)).map(c=>c.root));if(roots.size>=2)for(const c of x.claims)if(c.id!=='false')c.level='SUPPORTED';log(s,roots.size>=2?'两条独立来源支持存在异常报告，具体杀人规律仍未知。':'核对出处后只有一个原始来源，转述数量不是独立证据。');}}
 else if(k.startsWith('sell:')){const id=k.slice(5),fact=id==='case'?'MALL_PERSONAL_RECORD':'ABILITY:'+id;x.sales.push(id==='case'?'CASE':id);s.v1.cash+=id==='case'?35:20;expose(s,fact,['informant'],'本人售出真实记录');log(s,'实际情报已售出；接收者立即获知，后续转述需要世界时间。');}
 else if(k.startsWith('item:')){const id=k.slice(5);s.v1.cash-=id==='gold'?120:100;s.v1.items[id]++;x.trade.stock[id]--;log(s,'有限库存实物成交：'+id+'。没有自动植入灵异。');}
 else if(k==='asset:check'){x.trade.checked=true;log(s,'验看未知封存物：外层黄金容器完整，内部身份与来源未确认，交易极高风险。');}
 else if(k==='asset:buy'){s.v1.cash-=180;x.trade.sealedBought=true;x.trade.assetStock=0;log(s,'未知封存物已交付独立隔离保管，现金 −180；不计入体内灵异，不得直接开启或驾驭。');}
 else if(k==='asset:investigate'){x.trade.sourceChecked=true;x.trade.candidate=true;log(s,'调查获得候选线索，但内部身份、实际负荷与兼容关系仍缺证据；只标记候选待核实。');}
 else if(k==='conflict:start'){x.conflict={...x.conflict,active:true,stage:1,probed:false,leverage:null,flags:[],result:null};log(s,'原创程默质疑交易信息：先辨明意图、可知信息与筹码，不是生命条决斗。');}
 else if(k==='conflict:probe'){x.conflict.probed=true;x.conflict.stage=Math.min(5,x.conflict.stage+1);x.controller.reaction=x.knownBy.volatile.some(f=>f.startsWith('ABILITY:'))?'已知能力现象，对方准备避免对应媒介':'没有已知能力现象，对方仅按现场行为试探';log(s,x.controller.reaction);}
 else if(k==='conflict:leverage'){x.conflict.leverage=s.mall.evidence.length?'CASE':x.claims.length?'INFO':'NONE';log(s,x.conflict.leverage==='NONE'?'没有可核实筹码，仍可撤退或以有限补偿协商。':'提出本人实际持有的记录作为筹码，不公开隐藏后台属性。');}
 else if(k==='conflict:negotiate'){if(x.conflict.leverage==='NONE'){flag(s,'SOCIAL_DEFEAT');if(s.v1.cash>=20){s.v1.cash-=20;flag(s,'RESOURCE_LOSS');}endConflict(s,'暂避争执');}else{if(x.affiliation!=='MEMBER')x.affiliation='COOPERATIVE';endConflict(s,'有限合作，未发生灵异调用');}}
 else if(k==='conflict:withdraw')endConflict(s,'主动离场');
 else if(k==='conflict:threaten'){flag(s,'SOCIAL_DEFEAT');expose(s,'HOSTILE_INTENT',['volatile','wang'],'当面威胁');x.controller.revival=Math.min(100,x.controller.revival+6);log(s,'威胁引发对方以灵异回应，其自身也承担复苏压力；王小强要求停止。');if(x.controller.revival>=100)releaseController(s);}
 else if(k.startsWith('cast:')||k==='domain'){const id=k==='domain'?s.spirits.find(g=>g.sourceId==='eye').id:k.slice(5),g=s.spirits.find(g=>g.id===id);used=id;s.energy--;develop(g,3);if(k==='domain')g.revivalProgress=Math.min(100,g.revivalProgress+6+s.v1.eye.layer*2);const alreadyKnown=x.knownBy.volatile.includes('ABILITY:'+id);expose(s,'ABILITY:'+id,['wang','volatile'],'现场能力观察');flag(s,'EXPOSURE');const defense=ruleFor('echo',events.echo).weight+(alreadyKnown?1:0),result=ruleContest(v1Ward(s,g),defense);once(x.knownBy.volatile,'COUNTER:'+id);x.controller.reaction=result==='blocked'?'对应媒介暂被压制，对方退让':'未建立完整压制；对方避免已见媒介并反制';x.controller.revival=Math.min(100,x.controller.revival+(result==='blocked'?2:8));if(result==='failed'){s.life=Math.max(0,s.life-12);flag(s,'RESOURCE_LOSS');}if(x.controller.revival>=100)releaseController(s);else if(x.conflict.active)endConflict(s,'规则互动：'+x.controller.reaction);else log(s,'大厅主动释放引起警戒，王小强干预；各观测者记住该现象，未来会针对已知媒介。');if(s.life===0)s.systems.death='pending';}
 else if(k==='human:lead'){x.human.discovered=true;log(s,'获得人为传播线索：有人有目的地把异常听筒的呼喊转接给筛选的联系人【原创并行事件，使用既有回声规则】。');}
 else if(k==='human:enter'){x.human.active=true;x.human.status='ACTIVE';log(s,'进入听筒转接传播调查；灵异规律证据和人为分发证据分开收集。');}
 else if(k==='human:withdraw'){x.human.active=false;x.human.status='PAUSED';log(s,'离开调查，已发生传播与事实保留。');}
 else if(k.startsWith('human:')&&['AUDIO','SILENT','LOG','ROUTE'].includes(k.slice(6))){const e=k.slice(6);once(x.human.evidence,e);log(s,{AUDIO:'对照记录：通过转接听筒回应“在”后发生异常；只听到尚不足以确认致命。',SILENT:'沉默对照没有新增痕迹；与既有回声媒介规则一致。',LOG:'分发日志显示人工筛选联系人，不是随机受害。',ROUTE:'核对两条发送路径的同一操作端，支持存在人为传播。'}[e]);}
 else if(k==='human:stop'){x.human.distributionStopped=true;x.human.status='PROPAGATION_STOPPED';log(s,'停止当前人工分发路径，既有灵异规则未被改写，已传播记录没有消失。');}
 else if(k==='human:isolate'){x.human.isolated=true;log(s,'断开当前听筒转接媒介；是局部传播隔离，不宣称关押完整源头。');}
 else if(k==='human:warn'){x.human.warned=true;log(s,'向已取得分发路径中的联系人示警，不自动救活既有受害者。');}
 else if(k==='human:refer'){x.human.active=false;x.human.referred=true;x.human.status='REFERRED';log(s,'移交人工日志与灵异对照证据，两组证据保留；事件进入持续核查。');}
 else if(k==='official'){x.officialRead=true;log(s,'查询官方通联：大昌市负责人交接正在推进。你不因此替代正史负责人，私密能力未被自动报告。');}
 else if(k==='village:query'){x.villageKnown=true;log(s,'新线索：黄岗村出现异常死亡，评级与规律未知；不保证存在可驾驭奖励。');}
 else if(k.startsWith('prep:')){const p=k.slice(5);x.preparation[p]=true;log(s,{contact:'记录可用联系渠道与实际认识的人，不自动生成队友。',resources:'核查当前随身材料和现金；没有免费补给。',risk:'复核逐鬼复苏与承载，准备不改变已有数值。',retreat:'设定条件撤退与失联通报计划，未知区域不保证回程。'}[p]);}
 else if(k.startsWith('intent:')){x.preparation.intent=k.slice(7);log(s,'记录个人选择；本批仅到黄岗村准备，正式现场属于0.14.0。');}
 else if(k==='residual:isolate'){s.bags--;for(const r of x.residuals)if(r.status==='ACTIVE')r.status='ISOLATED';log(s,'消耗隔离袋限制死亡驭鬼者释放的回声媒介；不是继承灵异。');}
 else if(k==='residual:refer'){for(const r of x.residuals)if(r.status==='ACTIVE')r.status='REFERRED';log(s,'报告独立残余事件，需要后续处理；不视为永久关押。');}
 return used;}
export function advanceSocial(s,a,used){const x=s.social;if(!x||!socialReady(s)||x.lastTick===s.tick)return;x.startUnits??=s.dachang.timeUnits;x.lastTick=s.tick;const elapsed=(s.dachang.timeUnits-x.startUnits)/4,limit=Math.min(18,1+Math.floor(elapsed/2));for(let i=x.canonNodes.length;i<limit;i++)x.canonNodes.push(64+i);for(let i=x.anchors.length;i<Math.min(8,Math.floor(limit*8/18));i++)x.anchors.push('CA-130'+(i+1));x.officialChanged=limit===18;x.villageSignal=limit===18;
 if(x.started&&s.spirits.length)once(x.knowledge,'REVIVAL_RISK');if(s.evolution.host.form>=2)once(x.knowledge,'ALIEN');if(s.spirits.some(g=>masteryStable(s,g.id)))once(x.knowledge,'PERFECT');x.samples.push({tick:s.tick,used:!!used,values:Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress]))});x.samples=x.samples.slice(-20);
 for(const e of x.spread)if(!e.done&&s.dachang.timeUnits>=e.due){e.done=true;once(x.knownBy[e.target],e.fact);log(s,'已售出/展示的实际信息经过民间渠道转述，传播记录保留。');}
 const u=x.human;if(u.discovered&&!u.distributionStopped&&!u.referred&&s.tick%3===0){u.spread=Math.min(30,u.spread+1);if(u.evidence.includes('LOG')&&u.evidence.includes('ROUTE'))u.operatorExposed=true;if(u.spread>=3){u.operatorCaught=true;if(u.active)log(s,'操作者自身也受听筒回应规则牵连，不能控制已扩散的异常。');}}
 if(x.residuals.some(r=>r.status==='ACTIVE')&&x.inside&&a!=='social:residual:refer'){log(s,'未隔离的回声媒介继续发出呼喊，回应者面临意识侵蚀；可隔离、报告或离开，不能当成战利品。');}
 advanceSocialUX(s,a);
 if(s.crisis||s.systems.death!=='alive'){if(x.conflict.active){flag(s,'CONTROLLER_CRISIS');endConflict(s,'宿主反应窗口中断冲突');}x.inside=false;u.active=false;}
}
