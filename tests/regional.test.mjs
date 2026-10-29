import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,available,validate,upgrade} from '../src/engine.js';
import {makeSpirit,relationship} from '../src/progression.js';
import {regionalAvailable,advanceRegional,protectionView,planCheck,withdrawCheck} from '../src/regional.js';
import {regionalPages,regionalView,regionalLabel,regionalRiskPrompt,rescueUI,concurrentUI} from '../src/views-regional.js';
import {regionalKnown} from '../src/regional-model.js';
import {safeAutoAction} from '../src/v1.js';
import {schoolFact,schoolAssessment} from '../src/school-model.js';
import {resetTemporary} from '../src/rules.js';
function base(ids=[]){let s=newGame('救援测试','普通职员',16);for(const a of ['chapter:perimeter','chapter:advance','chapter:avoid','chapter:leave','chapter:finish','dc:start'])s=act(s,a);s.village.escaped=true;s.village.participated=true;s.village.phase='AFTERMATH';s.spirits=ids.map(makeSpirit);s.spirits.forEach(g=>{g.naturalRevivalRate=.01;g.usageRevivalRate=1;});if(ids.length===2)s.relations=[relationship(...s.spirits)];s=upgrade(s);for(let i=0;i<48&&s.reunion.world.nodes.at(-1)!==160;i++)s=act(s,'dc:wait');assert.ok(validate(s),'base valid');assert.ok(available(s).includes('reg:start'));return s;}
function step(s,a){assert.ok(available(s).includes(a),'available '+a+' got '+available(s));const n=act(s,a);assert.ok(validate(n),'valid '+a);return n;}
const seq=(s,as)=>as.reduce(step,s);
function at(s,n){for(let i=0;i<120&&s.regional.world.chapter<n;i++)s=step(s,'reg:wait');assert.ok(s.regional.world.chapter>=n);return s;}
const start=(ids=[])=>seq(base(ids),['reg:start','reg:observe','reg:contact','reg:choose:OFFICIAL','reg:authorize']);
function enter(ids=[]){let s=at(start(ids),165);s=step(s,'reg:next');s=at(s,170);return seq(s,['reg:next','reg:move:road','reg:map','reg:verify-rule']);}
function rescueBase(ids=[]){let s=enter(ids);s=at(s,172);s=step(s,'reg:next');s=seq(s,['reg:allocate','reg:move:shops','reg:candle:light','reg:candle:extinguish']);s=at(s,174);s=step(s,'reg:next');return seq(s,['reg:candle:light','reg:discover','reg:route']);}
function saved(){let s=rescueBase();s=seq(s,['reg:plan:shop:CANDLE','reg:execute','reg:execute']);return s;}

test('REG 新角色没有城市救援入口',()=>assert.deepEqual(regionalAvailable(newGame()),[]));
test('REG 普通人可在对应世界阶段选择参与',()=>{const s=start();assert.equal(s.spirits.length,0);assert.equal(s.regional.active,true);});
test('REG 旧城市样板不能绕过新城市时间线',()=>{const s=base();assert.equal(available(s).includes('city:start'),false);assert.equal(act(s,'city:start'),s);assert.equal(s.city.completed,false);});
test('REG 旧样板活动存档隔离但不清空历史',()=>{const s=base();s.city.started=true;s.city.active=true;s.city.history=['旧历史'];const n=upgrade(s);assert.equal(n.city.active,false);assert.deepEqual(n.city.history,['旧历史']);assert.equal(s.city.active,true);});
test('REG 拒绝参与正史仍到183且无现场知识',()=>{let s=step(base(),'reg:refuse');s=at(s,183);assert.equal(s.regional.world.chapter,183);assert.equal(s.regional.facts.length,0);assert.equal(s.regional.outcome.operation,'REFUSED');assert.equal(s.regional.world.anchors.length,11);});
test('REG 正史不能因个人next提前跳窗',()=>{const s=step(base(),'reg:start');assert.equal(available(s).includes('reg:next'),false);});
test('HIST 未参加七中不赠送历史完整规律',()=>{assert.deepEqual(start().regional.historical,[]);});
test('HIST 已支持声音假设自动引用，不需重刷线索',()=>{let s=base();schoolFact(s,'K-01');s.school.hypotheses=[schoolAssessment(s.school,'sound')];assert.ok(validate(s));s=step(s,'reg:start');assert.equal(s.regional.historical[0].id,'sound');assert.equal(s.regional.historical[0].currentValidity,'UNTESTED');});
test('HIST 当前对照独立支持并保留旧记录',()=>{let s=enter();assert.ok(regionalKnown(s,'AVOID'));assert.ok(regionalKnown(s,'MAP'));});
test('REG 观江花园不并入鬼域地图',()=>{assert.match(regionalView(enter(),'区域地图'),/独立居住资产线/);});
test('REG 未发现群体不显示名字或全城数量',()=>{const s=enter();assert.doesNotMatch(regionalView(s,'幸存者群'),/商业街求助群|建筑内求助群/);assert.equal(rescueUI(s).knownGroups.length,0);});
test('RESCUE 当前观察只发现一处群体',()=>{const s=rescueBase();assert.equal(s.regional.groups.filter(g=>g.known).length,1);});
test('CANDLE 授权之前不能领取，不拿杨间资产',()=>{let s=seq(base(),['reg:start','reg:choose:INDEPENDENT']);assert.equal(available(s).includes('reg:allocate'),false);assert.equal(s.regional.candle.holder,null);});
test('CANDLE 官方借用只有一份，来源显式游戏改编',()=>{const s=rescueBase();assert.equal(s.regional.candle.owner,'官方支援');assert.equal(s.regional.candle.adaptation,true);assert.equal(available(s).includes('reg:allocate'),false);});
test('CANDLE 燃料与已消耗守恒',()=>{const s=rescueBase(),c=s.regional.candle;assert.equal(c.resource+c.consumed,48);assert.ok(c.consumed>0);});
test('CANDLE 同一tick多次世界推进不会重复扣费',()=>{const s=rescueBase(),before=s.regional.candle.resource;advanceRegional(s,'reg:wait',1);advanceRegional(s,'reg:wait',1);assert.equal(s.regional.candle.resource,before);});
test('CANDLE 移动后原群体不在覆盖范围',()=>{let s=rescueBase();assert.ok(protectionView(s).coverage.includes('shop'));s=step(s,'reg:move:road');assert.equal(protectionView(s).coverage.includes('shop'),false);});
test('CANDLE 用烛不改变负荷、不减少复苏',()=>{let s=rescueBase(['echo']),b=s.spirits[0].burden,rev=s.spirits[0].revivalProgress;s=step(s,'reg:candle:extinguish');assert.equal(s.spirits[0].burden,b);assert.ok(s.spirits[0].revivalProgress>=rev);});
test('CANDLE 燃尽立即结束覆盖并保留成本',()=>{let s=rescueBase();while(s.regional.candle.active)s=step(s,'reg:wait');assert.equal(s.regional.candle.resource,0);assert.deepEqual(s.regional.candle.coverage,[]);assert.equal(s.regional.candle.consumed,48);});
test('CANDLE 并发未识别威胁时燃料有余仍非完全有效',()=>{let s=rescueBase();s=at(s,177);const v=protectionView(s);assert.equal(v.effectiveness,'OUT_OF_SCOPE');assert.equal(v.active,true);assert.equal(s.regional.facts.some(f=>f.id==='ROPE'),false);});
test('RESCUE 无路线不能准备或执行方案',()=>{const s=enter();assert.equal(available(s).some(a=>a.startsWith('reg:plan:')),false);assert.equal(planCheck(s).ok,false);});
test('RESCUE 实际两段护送提交存活而非Source关押',()=>{const s=saved();assert.deepEqual(s.regional.saved,['shop']);assert.equal(s.regional.groups[0].state,'SAVED');assert.equal(s.regional.world.knocking,'ACTIVE');assert.equal(s.spirits.length,0);});
test('RESCUE 已救群体不能重复刷救援',()=>{const s=saved();assert.equal(available(s).some(a=>a.startsWith('reg:plan:shop:')),false);});
test('RESCUE 移动暂停方案，不能远程带人',()=>{let s=seq(rescueBase(),['reg:plan:shop:CANDLE','reg:move:road']);assert.equal(s.regional.plan.status,'PAUSED');assert.equal(available(s).includes('reg:execute'),false);});
test('RESCUE 异常切换使路线过期，旧记录仍保留',()=>{let s=rescueBase();const count=s.regional.routes.length;s=at(s,177);assert.ok(s.regional.routes.some(r=>r.validity==='STALE'));assert.equal(s.regional.routes.length,count);});
test('RESCUE 取消/只读派生不结算时间和资源',()=>{const s=rescueBase(),before=JSON.stringify(s);for(const p of regionalPages)regionalView(s,p);rescueUI(s);protectionView(s);planCheck(s);withdrawCheck(s);assert.equal(JSON.stringify(s),before);});
test('TONG 未联络不泄露NPC能力和位置记录',()=>{const s=enter();assert.doesNotMatch(regionalView(s,'童倩协作'),/已实际交换|当前目标/);});
test('TONG 有自身目标，未知路线时拒绝不降低关系',()=>{let s=seq(enter(),['reg:move:hotpot','reg:tong:contact','reg:tong:ESCORT']);assert.equal(s.regional.tong.agreement,'DECLINED');assert.equal(s.regional.tong.status,'PROTECTING');});
test('TONG 核对路线才可护送自己群体',()=>{let s=at(enter(),174);s=seq(s,['reg:next','reg:move:hotpot','reg:tong:contact']);s=at(s,174);s=seq(s,['reg:candle:observe','reg:next','reg:route','reg:tong:ESCORT']);assert.equal(s.regional.tong.agreement,'ESCORT');assert.ok(available(s).includes('reg:plan:tong:TONG'));});
test('ROPE 王岳死亡只创建一次独立Source',()=>{let s=at(start(),180);assert.equal(s.regional.deaths.length,1);assert.equal(s.regional.deaths[0].released[0].sourceId,'rope');const id=s.regional.deaths[0].released[0].id;s=at(s,183);assert.equal(s.regional.deaths.length,1);assert.equal(s.regional.deaths[0].released[0].id,id);});
test('ROPE 后台死亡不自动变成角色确认',()=>{const s=at(start(),180);assert.equal(regionalKnown(s,'DEATH'),false);assert.doesNotMatch(regionalView(s,'鬼绳线索'),/可靠渠道确认王岳/);});
test('ROPE 关押鬼绳不关押敲门鬼也不赠送战利品',()=>{const s=at(start(),180);assert.equal(s.regional.world.rope,'CONTAINED');assert.equal(s.regional.world.knocking,'ACTIVE');assert.deepEqual(s.spirits,[]);});
test('ROPE 并发视图未知时不读取后台源头名',()=>{const s=at(start(),178);assert.match(concurrentUI(s).rope,/尚未确认/);});
test('BUILD 使用A只付A调用增长，B仅自然增长',()=>{let s=enter(['echo','shadow']);const a=s.spirits[0].revivalProgress,b=s.spirits[1].revivalProgress;s=step(s,'reg:cast:player-echo');assert.ok(s.spirits[0].revivalProgress-a>s.spirits[1].revivalProgress-b);assert.equal(s.energy,2);});
test('BUILD 现场不开放安全自动及远程训练',()=>{const s=enter(['echo']);assert.equal(safeAutoAction(s),null);assert.equal(available(s).includes('practice'),false);assert.equal(act(s,'dc:wait'),s);});
test('SAVE/Reload 确定且不复制借用品、死亡或救援',()=>{const s=rescueBase();assert.deepEqual(act(s,'reg:wait'),act(JSON.parse(JSON.stringify(s)),'reg:wait'));});
test('SAVE 模块缺失升级为空，不捏造剧情',()=>{const s=base();delete s.regional;assert.ok(validate(s));const n=upgrade(s);assert.equal(n.regional.started,false);assert.equal(n.regional.facts.length,0);});
test('SAVE 损坏燃料/位置/重复死亡/假救援拒绝',()=>{const good=rescueBase();for(const mutate of [s=>s.regional.candle.resource=99,s=>s.regional.zone='fake',s=>s.regional.saved.push('house'),s=>s.regional.world.rope='CONTAINED',s=>s.regional.facts.push({id:'fake'})]){const s=structuredClone(good);mutate(s);assert.equal(validate(s),false);}});
test('UI 十二页无未实现按钮标签，所有行动中文有名称',()=>{const s=rescueBase();assert.equal(regionalPages.length,12);for(const a of available(s)){assert.ok(regionalLabel(a,s));assert.doesNotMatch(regionalLabel(a,s),/undefined/);}for(const p of regionalPages)assert.doesNotMatch(regionalView(s,p),/undefined|NaN/);});
test('UX 预览提供真实调用成本，不更改状态',()=>{const s=enter(['echo']),before=JSON.stringify(s);assert.match(regionalRiskPrompt(s,'reg:cast:player-echo'),/能量−1/);assert.equal(JSON.stringify(s),before);});
test('TIME 救援阶段使用细时间片，普通行动4单位',()=>{let s=enter(),before=s.dachang.timeUnits;s=step(s,'reg:wait');assert.equal(s.dachang.timeUnits-before,4);s=rescueBase();before=s.dachang.timeUnits;s=step(s,'reg:wait');assert.equal(s.dachang.timeUnits-before,1);});
test('EXIT 不允许未核验保护的直接传送',()=>{const s=seq(enter(),['reg:move:shops','reg:move:building']);assert.equal(available(s).includes('reg:withdraw'),false);});
test('EXIT 已核验普通人可以提前离开，结果保留',()=>{let s=seq(enter(),['reg:route','reg:withdraw']);assert.equal(s.regional.outcome.player,'ESCAPED');assert.equal(s.regional.active,false);s=at(s,183);assert.equal(s.regional.outcome.player,'ESCAPED');assert.equal(s.regional.world.knocking,'ACTIVE');});
test('EXIT 完整七窗普通人流程与全部锚点',()=>{let s=saved();s=at(s,177);s=step(s,'reg:next');s=at(s,181);s=step(s,'reg:next');s=at(s,183);s=step(s,'reg:next');assert.equal(s.regional.phase,'DONE');assert.equal(s.regional.outcome.saved,3);assert.equal(s.regional.world.anchors.length,11);});

test('EXIT 异常路口可沿已核验后段撤离',()=>{let s=seq(rescueBase(),['reg:plan:shop:CANDLE','reg:execute']);assert.equal(withdrawCheck(s).ok,true);s=step(s,'reg:withdraw');assert.equal(s.regional.outcome.player,'ESCAPED');});
test('EXIT 普通移动也不能绕过撤离核验',()=>{const s=enter();assert.equal(available(s).includes('reg:move:cordon'),false);const n=seq(s,['reg:move:junction']);assert.equal(available(n).includes('reg:move:exit'),false);});
test('BUILD 未开发的任意灵异不能充当万能护送',()=>{const s=rescueBase(['echo']);assert.equal(available(s).includes('reg:plan:shop:SPIRIT'),false);});
test('KNOWLEDGE 未联络官方不私自同步童倩交换',()=>{let s=seq(base(),['reg:start','reg:observe','reg:choose:INDEPENDENT']);s=at(s,170);s=seq(s,['reg:next','reg:next','reg:move:road','reg:map','reg:verify-rule','reg:move:shops','reg:discover','reg:move:road','reg:move:hotpot','reg:tong:contact','reg:share:shop']);assert.ok(s.regional.tong.knowledge.includes('shop'));assert.equal(s.regional.official.shared.length,0);});
test('RESTART 白名单不回滚救援/燃料/死亡/世界',()=>{let s=saved();s=at(s,181);const before=structuredClone(s.regional);const n=resetTemporary(s,{life:100},{kind:'divine',id:'test-contract',scope:'self',fields:['life']});assert.deepEqual(n.regional,before);assert.deepEqual(n.spirits,s.spirits);});
test('CANDLE 识别鬼绳不等于验证保护适用',()=>{let s=at(rescueBase(),177);s=step(s,'reg:rope:observe');assert.equal(protectionView(s).effectiveness,'OUT_OF_SCOPE');assert.equal(available(s).includes('reg:plan:shop:CANDLE'),false);});

test('KNOWLEDGE 历史声音判断可直接避险，当前结论仍未确认',()=>{let s=base();schoolFact(s,'K-01');s.school.hypotheses=[schoolAssessment(s.school,'sound')];s=seq(s,['reg:start','reg:observe','reg:choose:INDEPENDENT']);s=at(s,174);s=seq(s,['reg:next','reg:next','reg:move:road','reg:map','reg:move:shops','reg:discover']);assert.equal(s.life,100);assert.equal(regionalKnown(s,'AVOID'),false);assert.equal(s.regional.historical[0].currentValidity,'UNTESTED');});
test('CRISIS 复苏危机暂停现场，解决后必须先恢复现场',()=>{let s=enter(['echo']);s.spirits[0].revivalProgress=99.9;s.spirits[0].naturalRevivalRate=1;s=step(s,'reg:wait');assert.equal(s.crisis,true);assert.equal(s.regional.active,false);s=step(s,'suppress');assert.equal(s.crisis,false);assert.ok(available(s).includes('reg:resume'));assert.equal(available(s).includes('dc:wait'),false);assert.ok(validate(s));});

test('BUILD 既有异类结构与完美驾驭不因入场被清空',()=>{let s=base(['echo','headless']);s.evolution.nodes['player-headless']={...s.evolution.nodes['player-headless'],structure:'STRUCTURAL',capacity:20};s.evolution.nodes['player-echo']={...s.evolution.nodes['player-echo'],mastery:4,verified:true};s.evolution.host={...s.evolution.host,form:3,route:'body',core:'player-headless',anchor:'player-echo',step:4};assert.ok(validate(s));const before=structuredClone(s.evolution);s=step(s,'reg:start');assert.equal(s.evolution.host.form,3);assert.equal(s.evolution.nodes['player-headless'].structure,'STRUCTURAL');assert.equal(s.evolution.nodes['player-echo'].mastery,4);assert.equal(s.evolution.nodes['player-echo'].verified,true);assert.deepEqual(s.evolution.host,before.host);});

test('REPORT 实际提交连接城市记录与幸存者联系人，只记一次',()=>{let s=seq(saved(),['reg:withdraw','reg:report']);assert.ok(s.dachang.official.reports.includes('REGIONAL_016'));assert.ok(s.dachang.contacts.some(c=>c.id==='rescue-shop'));assert.equal(s.dachang.facts.find(f=>f.id==='regional-016-report').level,'CONFIRMED');assert.equal(act(s,'reg:report'),s);});
test('RESIDENCE 查询独立资产线索不赠房产或鬼域区域',()=>{let s=at(start(),164),home=structuredClone(s.dachang.home);s=step(s,'reg:residence');assert.ok(regionalKnown(s,'RESIDENCE'));assert.deepEqual(s.dachang.home,home);assert.equal(s.regional.zone,'cordon');});
