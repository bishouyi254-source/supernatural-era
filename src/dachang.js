import {newDachang,cityPlaces,feedEntries,cityFact,knownFact,citySetup,codeCandidates} from './dachang-model.js';
import {schoolPeople} from './school-model.js';
import {hostState} from './spirits.js';
import {itemTypes} from './v1.js';
import {advancedBusy} from './evolution-model.js';
const log=(s,t)=>{s.dachang.history.push(t);s.dachang.history=s.dachang.history.slice(-80);s.journal.push(t);};
const free=s=>!s.mall?.active&&s.scene==='hub'&&!s.school.active&&!s.doorCase.active&&!s.investigation.active&&!s.journey.active&&!s.city.active&&!s.bus.active&&!s.combat&&!s.crisis&&s.systems.death==='alive'&&!advancedBusy(s)&&!['restricted','matched','unstable'].includes(s.systems.second?.stage);
export function dachangReady(s){return !!s.chapter?.completed&&(!s.school.started||s.school.playerEscaped||s.school.canonResolved&&!s.school.participated);}
export function dachangAvailable(s){if(!free(s))return [];const d=s.dachang;if(!d?.started)return dachangReady(s)?['dc:start']:[];
 const out=['dc:wait','dc:review-risk',...Object.keys(cityPlaces).filter(z=>z!==d.zone&&(z!=='home'||d.home.confirmed)).map(z=>'dc:move:'+z)];
 if(d.riskReviewed&&s.tick-(d.balanceObservations.at(-1)?.tick??d.enteredAt)<4)out.splice(out.indexOf('dc:review-risk'),1);
 if(!d.home.confirmed)out.push('dc:home:own',...(s.v1.cash>=80?['dc:home:rent']:[]));
 if(!d.contacts.some(c=>c.id==='local'))out.push('dc:local');
 if(!d.official.attempted||d.official.relationship==='REFUSED')out.push('dc:call');
 if(d.official.attempted&&d.official.relationship!=='REFUSED'){
  if(!d.official.verified)out.push('dc:verify');
  for(const r of ['COOPERATIVE','INDEPENDENT','HIDDEN'])if(d.official.route!==r)out.push('dc:route:'+r);
  if(!d.official.reports.includes('school'))out.push('dc:report:school');
  if(s.spirits.some(g=>!d.official.knownSpirits.includes(g.id)))out.push('dc:report:spirits','dc:report:partial');
  if(!d.official.requested.includes('safety'))out.push('dc:ask:safety');
  if(!d.official.requested.includes('unknown-rule'))out.push('dc:ask:unknown-rule');
  if(s.spirits.length&&d.official.verified&&d.codeHistory.length<20){out.push(...codeCandidates(s).filter(name=>name!==d.codename?.name).map((name)=>'dc:code:'+codeCandidates(s).indexOf(name)));if(d.candidate&&d.candidate!==d.codename?.name&&d.codeHistory.length<20)out.push('dc:code:custom');if(!d.official.requested.includes('code-declined'))out.push('dc:code:decline');}
  out.push('dc:refuse');
 }
 for(const id of Object.keys(feedEntries))if(!d.feeds.includes(id))out.push('dc:feed:'+id);
 if(d.feeds.includes('gold')&&!knownFact(d,'gold-boundary'))out.push('dc:verify-gold');
 for(const c of d.contacts)if(c.type==='SURVIVOR'&&!knownFact(d,'survivor-'+c.id))out.push('dc:contact:'+c.id);
 if(d.contacts.some(c=>c.id==='local')&&!knownFact(d,'local-route'))out.push('dc:contact:local');
 if(d.zone==='clinic'&&!s.evolution.host.shellDestroyed&&s.v1.cash>=40&&(s.life<100||s.energy<3))out.push('dc:care');
 if(d.zone==='home'&&!s.evolution.host.shellDestroyed&&(s.life<100||s.energy<3))out.push('dc:rest');
 if(d.zone==='home'&&d.home.confirmed)for(const id of Object.keys(itemTypes)){if(s.v1.items[id]>0&&d.storage[id]<3)out.push('dc:store:'+id);if(d.storage[id]>0&&s.v1.items[id]<(s.v1.facilities.includes('warehouse')?3:2))out.push('dc:take:'+id);}
 if(!d.flashlight&&d.zone==='commercial'&&s.v1.cash>=40)out.push('dc:buy-light');
 if(d.feeds.includes('trade')&&d.zone==='commercial'&&!d.trade.completed){if(!d.trade.sellerChecked)out.push('dc:trade:seller');if(!d.trade.itemChecked)out.push('dc:trade:item');if(d.trade.sellerChecked&&d.trade.itemChecked&&s.v1.cash>=100&&s.v1.items.record<2)out.push('dc:trade:buy');}
 if(d.intrusion.state==='CONFLICT'){
  if(!d.intrusion.checked.includes('external'))out.push('dc:memory:external');
  if(!d.intrusion.checked.includes('contact')&&d.contacts.some(c=>c.type!=='OFFICIAL'))out.push('dc:memory:contact');
  if(!d.intrusion.checked.includes('object')&&d.zone==='home')out.push('dc:memory:object');
  out.push('dc:memory:avoid');
 }
 if(['CONFLICT','CHECKED'].includes(d.intrusion.state)&&d.official.verified&&d.official.route!=='HIDDEN')out.push('dc:memory:refer');
 if(d.residuals.some(r=>r.known&&r.state==='ACTIVE')&&d.official.verified&&d.official.route!=='HIDDEN')out.push('dc:residual:refer');
 if(d.signal.known){if(!d.signal.inquired)out.push('dc:signal:query');for(const k of ['WATCH','IGNORE','APPROACH'])if(d.signal.decision!==k)out.push('dc:signal:'+k);}
 return out;
}
export function startDachang(s){const d=s.dachang=newDachang();d.started=true;d.enteredAt=s.tick;d.lastTick=s.tick;
 d.baseline={facilities:[...s.v1.facilities],chapters:Object.fromEntries(Object.entries(s.journey.chapters).map(([id,c])=>[id,c.completed]))};
 const saved=s.school.records.find(r=>r.result==='ESCAPED')?.survivors||[];
 d.schoolHistory={participated:s.school.participated,saved:[...saved],recordTick:s.school.records.at(-1)?.tick??null,legacy:!s.school.started};
 for(const id of saved)d.contacts.push({id,name:schoolPeople[id].name,type:'SURVIVOR',availability:'UNKNOWN',flags:['SAVED_AT_SCHOOL']});
 if(s.school.pressure>0)d.residuals.push({id:'school-trace',source:'七中个人路线',attached:'player',state:'ACTIVE',known:true});
 if(s.school.pressure>0&&saved.length)d.residuals.push({id:'survivor-trace-'+saved[0],source:'七中同行接触痕迹（玩家并行改编）',attached:saved[0],state:'DORMANT',known:false});
 d.intrusion.eligible=(s.seed%3!==0)||d.residuals.length>0;
 cityFact(s,'street','正常道路与手机通信已经恢复；七中个人历史保留。','DIRECT','city-arrival','CONFIRMED');
 log(s,'你回到大昌市现实街头。先安排居住与联系，不必立刻接下另一个案件。');
}
export function applyDachang(s,a){const d=s.dachang,k=a.slice(3);if(k==='start'){startDachang(s);return;}
 if(k.startsWith('move:')){d.zone=k.slice(5);log(s,'实际前往'+cityPlaces[d.zone]+'。移动推进世界，旧异常不自动清除。');}
 else if(k==='wait')log(s,'留意城市变化；时间继续流逝，翻页则不会推进。');
 else if(k==='review-risk'){d.riskReviewed=true;const h=hostState(s);d.balanceObservations.push({tick:s.tick,state:h.balanceState,bias:h.balanceBias,spiritIds:s.spirits.map(g=>g.id),verdict:'OBSERVED_ONLY'});d.balanceObservations=d.balanceObservations.slice(-30);log(s,s.spirits.length?'逐鬼复苏、承载与平衡已核对；最高复苏并不是总复苏，现有压力不代表精确寿命。':'你仍是普通人，没有体内鬼的复苏负担；外部灵异规则仍然危险。');cityFact(s,'host-review','已核对自己实际拥有的灵异与承载；风险摘要不能替代底层状态。','DIRECT','host-self-review','CONFIRMED');}
 else if(k.startsWith('home:')){const rent=k.endsWith('rent');if(rent)s.v1.cash-=80;d.home={confirmed:true,kind:rent?'RENTED':'OWN',level:0};log(s,rent?'确认临时租住点，支付80现金。Level0住所没有灵异隔离。':'确认个人普通住处。Level0住所不是绝对安全区。');}
 else if(k==='local'){d.contacts.push({id:'local',name:'社区联络员（原创）',type:'LOCAL',availability:'AVAILABLE',flags:['CONTACT_ESTABLISHED']});log(s,'建立社区联络渠道，可核对普通道路、住所记录和记忆矛盾。');}
 else if(k==='call'){d.official.attempted=true;d.official.relationship='CONTACT';const existing=d.contacts.find(c=>c.id==='operator');if(existing)existing.availability='AVAILABLE';else d.contacts.push({id:'operator',name:'官方值班接线员（玩家通联）',type:'OFFICIAL',availability:'AVAILABLE',flags:['CONTACT_ESTABLISHED']});log(s,'首次联系以身份和安全状态核对为主。接线员不会远程看见现场，也不是杨间专属联系人关系的自动转移。');}
 else if(k==='verify'){d.official.verified=true;d.official.relationship='LIMITED';log(s,'完成本人身份核对；普通人登记为特殊事件幸存者，有鬼者登记为待评估灵异人员。未报告的能力仍未知。');}
 else if(k.startsWith('route:')){d.official.route=k.slice(6);d.official.relationship=d.official.route==='COOPERATIVE'?'COOPERATIVE':'LIMITED';log(s,{COOPERATIVE:'选择合作联系，增加可申请信息范围，不自动成为城市负责人。',INDEPENDENT:'保持独立，仅维持基础联系；路线以后可改变。',HIDDEN:'减少长期联系，保留既有目击与报告事实；并非删除官方档案。'}[d.official.route]);}
 else if(k==='refuse'){d.official.route='HIDDEN';d.official.relationship='REFUSED';d.contacts.find(c=>c.id==='operator').flags.push(...(d.contacts.find(c=>c.id==='operator').flags.includes('REFUSED')?[]:['REFUSED']));log(s,'拒绝长期官方合作，仍可通过社区和网站生活、调查。已报告及目击事实不会被删除。');}
 else if(k==='report:school'){d.official.reports.push('school');for(const f of s.school.evidence)if(!d.official.reports.includes(f.id))d.official.reports.push(f.id);log(s,s.school.evidence.length?'仅提交你实际记录的七中证据，未经历部分不补成目击。':'提交身份与校外/历史状态，没有声称目击未参与事件。');}
 else if(k==='report:spirits'||k==='report:partial'){const ids=k==='report:partial'?s.spirits.slice(0,1):s.spirits;for(const g of ids)if(!d.official.knownSpirits.includes(g.id))d.official.knownSpirits.push(g.id);log(s,'主动说明'+(k==='report:partial'?'第一项能力现象':'现有能力现象')+'；官方保存披露记录，不因此掌握完整杀人规律。');}
 else if(k.startsWith('ask:')){const id=k.slice(4);d.official.requested.push(id);const fact=id==='safety'?{id:'basic-safety',text:'官方基础建议：保留记录、避免未知媒介、封存需匹配容器；不保证所有目标适用。',level:'SUPPORTED'}:{id:'unknown-rule',text:'当前未知对象没有足够官方档案；接线员不能提供其规律答案。',level:'UNKNOWN'};d.official.knowledge.push(fact);cityFact(s,fact.id,fact.text,'OFFICIAL','official-basic-briefing',fact.level);log(s,fact.text);}
 else if(k.startsWith('code:')){const id=k.slice(5);if(id==='decline'){d.official.requested.push('code-declined');log(s,'暂不登记代号，保留以后登记的选择。');}else{const name=id==='custom'?d.candidate:codeCandidates(s)[Number(id)];if(d.codename)d.codeHistory.push({name:d.codename.name,tick:s.tick});d.codename={name,basis:s.spirits[0].id,status:'REGISTERED',tick:s.tick};log(s,'登记档案索引“'+name+'”，不改变游戏昵称、武力或正史角色代号。');}}
 else if(k.startsWith('feed:')){const id=k.slice(5),f=feedEntries[id];d.feeds.push(id);cityFact(s,'feed-'+id,f.text,f.source,f.origin,f.level);log(s,'调查信息来源：“'+f.title+'”。重复查看不再消耗时间，转发仍归属原始来源。');}
 else if(k==='verify-gold'){cityFact(s,'gold-boundary','通过公开材料封装规范的独立对照，完整黄金容器的材料条件得到支持；你的未知目标尚未现场验证。','DIRECT','material-specification-review','SUPPORTED');log(s,'对照的是封装材料规范，不是亲自封存未知厉鬼。该规律仍为支持，不能自动认证全部目标。');}
 else if(k.startsWith('contact:')){const id=k.slice(8),c=d.contacts.find(c=>c.id===id);if(!c.flags.includes('CALLED'))c.flags.push('CALLED');if(c.type==='SURVIVOR'&&d.clock.period==='深夜'){c.availability='UNREACHABLE';log(s,c.name+'当前无法接通；拨打没有远程传送或补全未知情报。');}else{c.availability='AVAILABLE';if(id==='local')cityFact(s,'local-route','社区联络员核实正常道路与居住联系渠道；普通住宅并不具备灵异隔离。','PERSONAL_CONTACT','local-contact','CONFIRMED');else cityFact(s,'survivor-'+id,c.name+(id.startsWith('rescue-')?'确认曾受你协助脱离城市救援区域。':'确认曾与你一起离开七中。')+'其余人物状态仍未知。','PERSONAL_CONTACT','saved-'+id,'CONFIRMED');const trace=d.residuals.find(r=>r.attached===id);if(trace){trace.known=true;trace.state='ACTIVE';cityFact(s,'trace-'+id,c.name+'报告离校后的异常接近迹象，关联源头尚未确认；获救事实保持。','PERSONAL_CONTACT','survivor-report-'+id,'SUPPORTED');}log(s,'完成与'+c.name+'的实际联系，只交换其能够确认的事实。');}}
 else if(k==='care'){s.v1.cash-=40;s.life=Math.min(100,s.life+20);s.energy=Math.min(3,s.energy+1);log(s,'普通医疗支付40，身体最多恢复20、行动能量1；不治疗灵异复苏或不可逆宿主结构。');}
 else if(k==='rest'){s.life=Math.min(100,s.life+10);s.energy=Math.min(3,s.energy+1);log(s,'在Level0住处短暂休息，最多恢复身体10、行动能量1。附着异常、累计复苏与世界时间仍继续。');}
 else if(k.startsWith('store:')){const id=k.slice(6);s.v1.items[id]--;d.storage[id]++;log(s,'把'+itemTypes[id].name+'存放于普通住处；仅转移物品位置，不获得灵异隔离。');}
 else if(k.startsWith('take:')){const id=k.slice(5);d.storage[id]--;s.v1.items[id]++;log(s,'从住处取回'+itemTypes[id].name+'，没有生成新物品。');}
 else if(k==='buy-light'){s.v1.cash-=40;d.flashlight=true;log(s,'购买普通手电，支付40；不会照出所有不可见灵异。');}
 else if(k==='trade:seller'){d.trade.sellerChecked=true;cityFact(s,'seller-check','卖家公开记录对应同一位普通工具交易者，无法证明其高级灵异知识。','UNDERGROUND','trader-offer-01','SUPPORTED');log(s,'核对卖家身份与报价出处，不把卖家声明变为世界真相。');}
 else if(k==='trade:item'){d.trade.itemChecked=true;cityFact(s,'item-check','现场测试录音与时间标记可用；没有证明工具具有灵异封存或驱逐能力。','DIRECT','tool-live-test','CONFIRMED');log(s,'实物验货完成，确认普通记录功能。');}
 else if(k==='trade:buy'){s.v1.cash-=100;s.v1.items.record++;d.trade.stock=0;d.trade.completed=true;log(s,'成交记录工具1，现金−100，卖家库存结束；刷新不能复制资产。');}
 else if(k.startsWith('memory:')){const id=k.slice(7),x=d.intrusion;if(['external','contact','object'].includes(id)){x.checked.push(id);const text={external:'近期住所登记没有记忆中陌生常住者的记录。',contact:'实际联系人无法确认记忆中的共同生活经历。',object:'物品位置与此前客观记录存在矛盾，未知红纸线索尚不能解释完整规则。'}[id];cityFact(s,'memory-'+id,text,id==='contact'?'PERSONAL_CONTACT':'DIRECT','memory-check-'+id,'CONFIRMED');if(x.checked.length>=2){x.state='CHECKED';x.memory.reliability='CONFLICTING';cityFact(s,'memory-conflict','多个独立外部来源与当前记忆冲突；异常来源未确认，真实七中历史未改写。','DIRECT','memory-cross-check','CONFIRMED');}log(s,text+' 这是矛盾证据，不是完整源头答案。');}else if(id==='refer'){x.state='REFERRED';log(s,'提交记忆矛盾，官方登记后续核查；不是远程解除异常。');}else{x.state='AVOIDED';d.zone='street';log(s,'暂避异常住处。危险可能仍存在，记忆记录与持久来源不删除。');}}
 else if(k==='residual:refer'){for(const r of d.residuals)if(r.known&&r.state==='ACTIVE')r.state='REFERRED';log(s,'把已知持续痕迹转交核查，不声称已封存源头或治愈附着者。');}
 else if(k==='signal:query'){d.signal.inquired=true;cityFact(s,'mall-query','商业区域人员失踪与店铺异常有待现场核实；目前没有源头身份。','PERSONAL_CONTACT','mall-incident-report','SUPPORTED');log(s,'查询商场线索，记录调查缺口。可前往外围进入正式职业案件。');}
 else if(k.startsWith('signal:')){d.signal.decision=k.slice(7);if(d.signal.decision==='APPROACH'){d.zone='commercial';log(s,'抵达商场外围入口。可开始正式调查，旧简化商场不会自动启动。');}else log(s,d.signal.decision==='IGNORE'?'暂不介入商业区域异常；其他人仍可能继续调查。':'持续关注异常，事件不永久等候玩家。');}
}
export function advanceDachang(s,action,usedId,timeCost=4){const d=s.dachang;if(!d?.started)return;d.elapsed=s.tick-d.enteredAt;const delta=s.tick-d.lastTick;if(delta<=0)return;d.lastTick=s.tick;d.timeUnits=(d.timeUnits??(d.elapsed-delta)*4)+delta*timeCost;
 const worldElapsed=d.timeUnits/4;
 d.clock={day:Math.floor(worldElapsed/16)+1,period:['清晨','白天','傍晚','深夜'][(Math.floor(worldElapsed/4)+2)%4]};
 const nodeCount=Math.min(12,1+Math.floor(d.elapsed/2));for(let i=d.canonNodes.length;i<nodeCount;i++)d.canonNodes.push(20+i);
 // Canon titles are background ledger, never copied to character evidence.
 const o=d.official;if(usedId&&['street','commercial'].includes(d.zone)&&!action.startsWith('dc:')&&s.scene==='hub'&&!action.startsWith('mall:')&&!action.startsWith('social:')&&!action.startsWith('hg:')){
  for(const id of Array.isArray(usedId)?usedId:[usedId]){const g=s.spirits.find(g=>g.id===id);if(g){o.witnessed.push({spiritId:id,phenomenon:g.name,tick:s.tick});o.witnessed=o.witnessed.slice(-40);if(!o.knownSpirits.includes(id))o.knownSpirits.push(id);if(!d.rumors.some(r=>r.id==='seen-'+id))d.rumors.push({id:'seen-'+id,text:'公众曾观察到一次异常能力表现，具体规律未知。',origin:'witness-'+s.tick,tick:s.tick});}}
 }
 if(d.intrusion.state==='DORMANT'&&d.intrusion.eligible&&d.zone==='home'&&d.elapsed>=6){d.intrusion.state='CONFLICT';d.intrusion.memory={text:'你记得一位陌生人一直生活在此，近期登记却没有对应条目。',reliability:'UNRELIABLE'};d.residuals.push({id:'memory-source',source:'住所记忆矛盾（玩家并行改编）',attached:'player',state:'UNCONFIRMED',known:true});log(s,'住所出现记忆与客观记录的矛盾。旧世界事实没有改变，不要只依赖当前记忆。');}
 if(d.intrusion.state==='CONFLICT'&&d.zone==='home'&&!action.startsWith('dc:memory:')){d.intrusion.tension=Math.min(6,d.intrusion.tension+1);if(d.intrusion.tension>=4){s.life=Math.max(1,s.life-5);log(s,'继续停留使认知干扰增强。可以核对外部资料、联络或暂避；休息没有解除来源。');}}
 if(worldElapsed>=18){if(d.signal.stage==='UNREVEALED')d.signal.stage='RUMOR';if(worldElapsed>=26)d.signal.stage='INVESTIGATING';if(worldElapsed>=34)d.signal.stage='OTHER_INTERVENTION';}
 if(!d.signal.known&&d.signal.stage!=='UNREVEALED'&&(action==='dc:wait'||action.startsWith('dc:feed:')||action.startsWith('dc:contact:')||action==='dc:call')){d.signal.known=true;cityFact(s,'mall-signal','商业区域出现失踪/店铺异常报告；来源为民间报警，源头未确认。','PUBLIC_RUMOR','mall-incident-report','SUSPECTED');log(s,'新增城市异常线索：商业区域。可关注、查询、暂不介入或前往外围。');}
 d.setupCompleted=Object.values(citySetup(s)).every(Boolean);
}
export function dachangAllows(s,a){const d=s.dachang;if(!d?.started)return true;
 if(a==='rest')return d.home.confirmed&&d.zone==='home'&&s.v1.facilities.includes('isolation');
 if(a==='chapter:supply')return false;
 if(a.startsWith('journey:'))return false; // 0.11 stops at the formal mall entrance.
 if(a.startsWith('v1:facility:'))return false;
 if(a.startsWith('v1:contact:')||a.startsWith('v1:mission:')||a.startsWith('v1:buy:'))return false;
 if(a.startsWith('dc:')||a.startsWith('reaction:')||a.startsWith('death:')||a==='suppress'||a.startsWith('abandon'))return true;
 if(a==='retreat')return true;
 if(a.startsWith('enter:')&&['blood','headless'].includes(a.slice(6)))return d.baseline.chapters[a.endsWith('blood')?'mall':'village'];
 if(a.startsWith('practice')&&d.intrusion.state==='CONFLICT'&&d.zone==='home')return false;
 return true;
}
