import {postwarAnchors,known21,fact21} from './postwar-model.js';
import {advancedBusy} from './evolution-model.js';
import {growthFor} from './spirits.js';
import {newGame} from './engine.js';
import {fateResult,ruleContest} from './rules.js';
export const postwarReady=s=>s.finale?.chapter===276&&s.finale.source.state==='CONTAINED'&&!!s.finale.resolution;
export const postwarBusy=s=>postwarReady(s)&&s.postwar?.started;
const log=(s,t)=>{s.postwar.history.push(t);s.postwar.history=s.postwar.history.slice(-100);s.journal.push(t);};
const once=(a,id)=>{if(!a.includes(id))a.push(id);};
export function reportable21(s){return [...s.finale.contributions.map(c=>({id:'finale-contribution:'+c.id,text:c.text,origin:'PLAYER-ACTION',level:'CONFIRMED',tick:c.tick})),...s.postwar.facts.filter(f=>f.origin==='PLAYER-OBSERVATION'&&f.id.startsWith('recovery-')).map(f=>({id:f.id,text:f.text,origin:f.origin,level:f.level,tick:f.tick}))];}
// A local, deterministic conditional preview. It does not advance, clone or mutate the world.
export function forecast21(s,{actor='xiong',scope='CURRENT_CONFERENCE_DISPUTE',horizon=6}={}){const x=s.postwar;if(actor!=='xiong'||scope!=='CURRENT_CONFERENCE_DISPUTE'||horizon!==6||x.chapter<285||x.conference.status!=='OPEN')throw Error('不符合预知能力的范围或当前条件');const conditions={disputeIntent:x.conference.disputeIntent,conferenceStatus:x.conference.status};return {id:'P21-FORECAST-01',actor,scope,horizon,generatedAt:s.tick,expiresAt:s.tick+6,baseWorldRevisionId:s.revision,dependencyKeys:['disputeIntent','conferenceStatus'],signature:fateResult(s.seed,'P21-FORECAST',conditions).signature,assumedIntent:'PRESS',knownConditions:['会议继续进行','相关争议者继续施压'],unknownConditions:true,outcome:conditions.disputeIntent==='PRESS'?'继续当前施压可能形成短暂灵异对抗。':'现有施压路径已改变，需重新判断。',validity:'VALID',reason:null,receivedBy:['xiong'],actualResult:null};}
export function resolveAudio21({supernatural=false,connected=false,targetEligible=false,isolated=false,ropeApplicable=false}={}){const applies=supernatural&&connected&&targetEligible&&!isolated;return {applies,conflict:applies&&ropeApplicable?ruleContest(2,2):'NOT_TESTED',effect:applies?(ropeApplicable?'局部媒介受到牵制，完整规律仍未知。':'观察到局部异常回应。'):'没有证据证明该声音规则对当前目标生效。'};}
export function postwarAvailable(s){if(!postwarReady(s)||s.crisis||s.systems.death!=='alive'||advancedBusy(s))return [];const x=s.postwar;if(!x.started)return ['pw:start','pw:decline'];const a=['pw:wait'];if(!x.participating)a.push('pw:resume');
 if(!known21(s,'recovery-report'))a.push('pw:news');
 if(x.participating){for(const z of Object.keys(s.finale.recovery.zones))if(!x.recovery.checked.includes(z))a.push('pw:check:'+z);if(!known21(s,'old-cases'))a.push('pw:cases');if(x.chapter>=278&&!known21(s,'zhao-report'))a.push('pw:zhao');
 if(x.chapter>=279&&!x.contacts.includes('luo'))a.push('pw:contact:luo');if(x.contacts.includes('luo')){if(!known21(s,'forum-identity'))a.push('pw:verify');if(!known21(s,'shared-recovery')&&known21(s,'recovery-report'))a.push('pw:share');if(!x.network.cooperativeActors.includes('luo')&&known21(s,'forum-identity'))a.push('pw:cooperate');if(x.negotiation.status==='NONE'&&s.systems.items.barrier>0)a.push('pw:trade:request');}
 if(x.chapter>=280&&x.contacts.includes('luo')&&!x.contacts.includes('huang'))a.push('pw:contact:huang');
 if(x.chapter>=280&&!known21(s,'sound-observed'))a.push('pw:sound');if(known21(s,'sound-observed')&&!known21(s,'sound-source')&&x.contacts.includes('luo'))a.push('pw:sound:verify');
 if(x.chapter>=283&&known21(s,'forum-identity')&&!known21(s,'ye-profile'))a.push('pw:ye');
 if(x.chapter>=284&&!known21(s,'conference-access'))a.push('pw:official');
 if(x.conference.status==='OPEN'&&x.conference.role!=='NONE'){if(!known21(s,'conference-material'))a.push('pw:material');if(!known21(s,'personal-report')&&reportable21(s).length)a.push('pw:report');if(x.conference.role==='INVITED'&&!x.conference.proposals.includes('QUESTION'))a.push('pw:question');if(!known21(s,'kept-private'))a.push('pw:private');if(!x.conference.commitments.length)a.push('pw:task:accept','pw:task:refuse');if(x.chapter>=285&&x.forecast&&!x.forecast.receivedBy.includes('player'))a.push('pw:forecast:receive');if(x.conference.role==='INVITED'&&x.chapter>=287&&x.chapter<288&&x.conference.disputeIntent==='PRESS')a.push('pw:deescalate');}
 if(x.chapter>=288&&x.forecast?.receivedBy.includes('player')&&!known21(s,'forecast-result'))a.push('pw:result');
 const n=x.negotiation;if(n.status==='REQUESTED')a.push('pw:trade:terms');if(n.status==='NEGOTIATING')a.push('pw:trade:agree','pw:trade:reject');if(n.status==='AGREED')a.push('pw:trade:authorize');if(n.status==='AUTHORIZED'&&s.systems.items.barrier>0)a.push('pw:trade:transfer');if(['REQUESTED','NEGOTIATING','AGREED','AUTHORIZED'].includes(n.status))a.push('pw:trade:cancel');}
 if(x.chapter===290&&!x.settled)a.push('pw:finish');return a;
}
export function applyPostwar(s,a){const x=s.postwar,k=a.slice(3);if(k==='start'||k==='decline'){x.started=true;x.participating=k==='start';x.startUnits=s.dachang.timeUnits;log(s,k==='start'?'进入战后大昌市。先核实恢复通报，再决定参与哪些社会活动。':'保持独立，不参与会议；世界正史继续推进。');}
 else if(k==='resume'){x.participating=true;log(s,'恢复个人社会活动；此前世界进度没有回退。');}
 else if(k==='news'){fact21(s,'recovery-report','官方通报：同一饿死鬼源头已关押，城市转入战后监测；独立异常尚待复查。','OFFICIAL-HQ','CONFIRMED');log(s,'已收到战后通报。交通、联系人和残余事件仍须分别核验。');}
 else if(k.startsWith('check:')){const z=k.slice(6);once(x.recovery.checked,z);once(x.recovery.contributions,z);fact21(s,'recovery-'+z,'本次'+z+'片区联络与通道核验完成；结论只覆盖本次观察，不保证全城安全。','PLAYER-OBSERVATION','CONFIRMED');once(x.reputation.community,'recovery-'+z);const duty=x.conference.commitments.find(c=>c.status==='ACCEPTED');if(duty){duty.status='COMPLETED';duty.completedAt=s.tick;duty.evidenceId='recovery-'+z;}log(s,'本片区核验记入个人恢复贡献，原救援名单与失联状态保留。');}
 else if(k==='cases'){fact21(s,'old-cases','旧七中证据、黄岗村鬼棺、鬼镜记录、独立敲门异常继续分别保存；没有合并为饿死鬼残余。','PLAYER-ARCHIVE','CONFIRMED');log(s,'整理历史遗留事项，不自动结案或复制资产。');}
 else if(k==='zhao'){fact21(s,'zhao-report','官方可靠死亡报告：赵开明已死亡，停止当前人物调度。许愿鬼为独立未解异常，其完整机制未知。','OFFICIAL-HQ','CONFIRMED');log(s,'死亡报告已接收；旧负责人身份保留为历史，不恢复其日常派遣。');}
 else if(k==='contact:luo'){once(x.contacts,'luo');once(x.network.contacts,'luo');x.personal.luo='CONTACTED';fact21(s,'met-luo','在同一观江小区的访问联络中结识罗素一；来意只依据其自述，真实目的未知。','DIRECT-CONTACT','CONFIRMED');log(s,'已建立私人联络，尚未确认组织合作，叶真没有因此认识你。');}
 else if(k==='contact:huang'){once(x.contacts,'huang');x.personal.huang='CONTACTED';fact21(s,'met-huang','通过罗素一的实际联络接触黄飞，只确认来访者身份；其私人能力与目的未知。','DIRECT-CONTACT','CONFIRMED');log(s,'黄飞已成为独立联系人，不自动获得其私有档案。');}
 else if(k==='verify'){x.forum.relationship='CONTACTED';fact21(s,'forum-identity','罗素一提供可核实的联络身份：灵异论坛，大海市民间组织；与小强俱乐部独立。','LUO-IDENTITY','CONFIRMED');log(s,'论坛身份已核验。成员资格仍为否。');}
 else if(k==='share'){fact21(s,'shared-recovery','玩家选择分享已接收的战后恢复通报；只传递该条资料，没有公开私有灵异。','PLAYER-DISCLOSURE','CONFIRMED',['player','luo']);x.messages.push({id:'P21-FORUM-RELAY',from:'luo',to:'ye',factIds:['shared-recovery'],due:s.dachang.timeUnits+12,delivered:false});x.facts.find(f=>f.id==='shared-recovery').authorizedReaders.push('ye');log(s,'罗素一已收到指定通报；后续转述有延迟，同源转述不会增加独立证据。');}
 else if(k==='cooperate'){x.forum.relationship='COOPERATING';x.forum.cooperation={scope:'已共享的战后道路情报',excluded:'私人灵异结构与总部限制资料',acceptedBy:'luo',validUntilChapter:290};x.personal.luo='COOPERATING';once(x.network.cooperativeActors,'luo');once(x.network.commitments,'P21-ROAD-INFO');once(x.reputation.forum,'forum-identity');log(s,'罗素一同意有限道路情报合作；你仍为独立人员，不能指挥论坛。');}
 else if(k==='sound'){const r=resolveAudio21({supernatural:true,connected:true,targetEligible:true,ropeApplicable:true});x.audio.push({id:'P21-SOUND-01',facilityId:'CANON-GUANJIANG-RESIDENCE',sourceSpiritId:'CANON-LIN-VOICE',carrier:'VOICE',targets:['CANON-YANG'],conditions:['现场有效媒介','合法目标','鬼绳局部对抗'],burdenModifier:0,result:r});fact21(s,'sound-observed','观江小区出现异常声音与局部媒介对抗；普通听闻不等于你已被能力影响，来源尚未确认。','PLAYER-OBSERVATION','SUPPORTED');log(s,'声音现象已记录。没有对玩家无条件造成伤害或复苏。');}
 else if(k==='sound:verify'){once(x.contacts,'lin');x.personal.lin='CONTACTED';fact21(s,'sound-source','通过现场对照与联络核实，异常声音关联林落梅；录音传播、完整触发条件与跨鬼域效果尚未验证。','OBSERVATION-AND-LUO','SUPPORTED');log(s,'只核实当前声音关联，不公开全部能力或隐藏目的。');}
 else if(k==='ye'){fact21(s,'ye-profile','叶真：大海市灵异论坛重要领导人物。完整灵异能力、复苏与后期资产未知；与你尚未直接接触。','LUO-ORGANIZATION-INTRODUCTION','SUPPORTED');log(s,'记录有限人物档案，没有开放挑战或领导权限。');}
 else if(k==='official'){const legitimate=s.finale.contributions.length>0||s.dachang.official.verified;x.conference.role=legitimate?'INVITED':'PERIPHERAL';x.conference.access=legitimate?['summary','agenda','forecast']:['summary'];fact21(s,'conference-access',legitimate?'官方确认有限协作参会资格，仅开放议程与允许摘要。':'官方允许外围提供资料与接收公开摘要，尚无内部参会权限。','OFFICIAL-HQ','CONFIRMED');if(legitimate)once(x.reputation.official,'conference-access');log(s,'资格根据已知贡献或已有核实身份决定，不由武力决定。');}
 else if(k==='material'){fact21(s,'conference-material','获准会议摘要：复盘S级事件、协调后续职责；研究假设与个人陈述仍需验证，限制资料未开放。','OFFICIAL-HQ','SUPPORTED');log(s,'资料已实际交付；获得访问权与收到内容分开记录。');}
 else if(k==='report'){x.conference.sharedEvidence=reportable21(s);fact21(s,'personal-report','提交本人既有调查记录，保留原事实、来源与推测等级；未提交私人灵异结构。','PLAYER-REPORT','CONFIRMED',['player','official']);once(x.reputation.official,'personal-report');x.conference.proposals.push('PERSONAL-EVIDENCE');log(s,'官方只知道实际提交的记录，没有自动获得你的完整构筑。');}
 else if(k==='question'){x.conference.proposals.push('QUESTION');log(s,'已质询研究结论的适用范围；发言进入会议履历，并未自动成为正式决议。');}
 else if(k==='private'){fact21(s,'kept-private','明确保留私人灵异结构；既有目击与披露不会被抹除，拒绝额外披露不撤销合法身份。','PLAYER-DECLARATION','CONFIRMED',['player','official']);log(s,'边界声明已交付；会议继续。');}
 else if(k.startsWith('task:')){x.conference.commitments.push({id:'P21-FOLLOWUP',to:'OFFICIAL-HQ',scope:'战后道路资料核验',status:k.endsWith('accept')?'ACCEPTED':'DECLINED',received:true,tick:s.tick});log(s,k.endsWith('accept')?'接受有限道路核验职责；对象、范围与履行状态持久保存。':'已拒绝额外任务；合法身份和既有知识继续保留。');}
 else if(k==='forecast:receive'){x.forecast.receivedBy.push('player');fact21(s,'forecast-summary','熊文文→王小明→允许交付的会议摘要：短期局部争议若继续施压，可能形成危险对抗。前提受行为改变影响，部分条件未知。','XIONG-WANG-HQ','CONDITIONAL');log(s,'收到条件性预知。它没有移动NPC、消耗未来资产或改变当前现实。');}
 else if(k==='result'){fact21(s,'forecast-result',x.forecast.actualResult,'OFFICIAL-OBSERVATION','SUPPORTED');log(s,'已接收获准实际结果，用于与原始条件性预测对照。');}
 else if(k==='deescalate'){x.conference.disputeIntent='WITHDRAW';x.conference.proposals.push('DEESCALATE');log(s,'玩家经有限协作渠道提出收束争议，当前议题负责人接受这一局部安排；其他正史分歧继续。');}
 else if(k==='trade:request'){x.negotiation.status='REQUESTED';x.negotiation.asset={id:'P21-PLAYER-BARRIER-01',origin:'systems.items.barrier',owner:'player',holder:'player',authorizedUser:null};log(s,'请求以本人已有隔绝媒介1份交换允许公开的道路摘要。物品尚未移交。');}
 else if(k==='trade:terms'){x.negotiation.status='NEGOTIATING';x.negotiation.terms='隔绝媒介1份 ↔ 罗素一获准共享的道路摘要；不包含厉鬼或限制资料';log(s,'进入条件协商；这是游戏改编的有限交易，不是取得杨间鬼烛。');}
 else if(k==='trade:agree'){x.negotiation.status='AGREED';log(s,'双方达成协议；媒介仍在玩家手中，尚未授权交付。');}
 else if(k==='trade:authorize'){x.negotiation.status='AUTHORIZED';x.negotiation.asset.authorizedUser='luo';log(s,'玩家作为物主授权指定交付，库存尚未扣除。');}
 else if(k==='trade:transfer'){s.systems.items.barrier--;x.negotiation.status='TRANSFERRED';x.negotiation.asset.holder='luo';x.negotiation.asset.owner='luo';x.negotiation.transfers.push({id:'P21-TRANSFER-01',from:'player',to:'luo',tick:s.tick});fact21(s,'trade-road-summary','已交付1份玩家隔绝媒介，收到罗素一允许共享的道路摘要：异地通道仍需现场核实。','LUO-TRADE','SUPPORTED');log(s,'实际交付完成：隔绝媒介−1。唯一交易回执保留，重复操作不再扣除。');}
 else if(k==='trade:reject'||k==='trade:cancel'){x.negotiation.status=k.endsWith('reject')?'REJECTED':'CANCELLED';x.negotiation.asset.authorizedUser=null;log(s,'交易终止，物品未移交。');}
 else if(k==='finish'){x.settled=true;fact21(s,'postwar-settlement','277—290阶段归档。新联系、实际披露、预测历史、会议承诺、资产与个人构筑继续保存。291赵磊线等待后续版本。','PLAYER-ARCHIVE','CONFIRMED');log(s,'本批完成，未提前开放赵磊与公交新章节。');}
 else log(s,'等候世界进展；逐鬼结算自然复苏，不提供免费恢复。');
 return null;
}
export function advancePostwar(s){const x=s.postwar;if(!x?.started)return;x.chapter=Math.min(290,277+Math.floor((s.dachang.timeUnits-x.startUnits)/12));for(const [at,id]of postwarAnchors)if(x.chapter>=at)once(x.anchors,id);
 if(x.chapter>=278)x.authority.zhao='DEAD';
 if(x.chapter>=281&&x.forum.relationship==='UNKNOWN')x.forum.relationship='KNOWN';
 if(x.chapter>=285&&x.conference.status==='NOT_STARTED')x.conference.status='OPEN';
 if(x.chapter>=285&&!x.forecast){const npc={id:'CANON-XIONG-PRECOGNITION',sourceId:'canon-precognition',burden:30,revivalProgress:35,naturalRevivalRate:0,usageRevivalRate:1,suppressionRemaining:0};const host=newGame('NPC成本结算');host.spirits=[npc];npc.revivalProgress+=growthFor(host,npc,true);x.npcUse.push({actor:'xiong',spirit:npc,before:35,uses:1,kind:'GAME_ADAPTATION',note:'内部测试参数，不是原著精确数值，不向玩家公开NPC复苏。'});x.forecast=forecast21(s);x.forecast.receivedBy.push('wang');}
 if(x.chapter>=287&&!x.canonCandleRequest)x.canonCandleRequest={status:'REQUESTED',holder:'CANON-YANG',instanceId:null,note:'正史鬼烛资源请求；未核实具体实例与授权，不创建玩家资产。'};
 if(x.forecast){const f=x.forecast;if(x.conference.disputeIntent!==f.assumedIntent&&f.validity!=='RESOLVED'){f.validity='INVALIDATED';f.reason='相关人员改变施压安排，原路径不再适用。';}else if(s.tick>f.expiresAt&&f.validity==='VALID'){f.validity='DEGRADED';f.reason='短期观察窗口已过，参考价值降低。';}if(x.chapter>=288&&f.actualResult===null){f.actualResult=x.conference.disputeIntent==='PRESS'?'局部争议形成短暂对抗，随后由议题主持方收束。':'局部施压已收束，未沿原预测路径升级。';f.resolutionValidity=f.validity;f.validity='RESOLVED';x.conference.actualResult=f.actualResult;}}
 if(x.chapter>=290&&x.conference.status!=='CLOSED'){x.conference.status='CLOSED';x.conference.decisions.push({id:'P21-REVIEW-CLOSED',scope:'S级事件复盘与有限后续核验',tick:s.tick});}
 for(const m of x.messages)if(!m.delivered&&s.dachang.timeUnits>=m.due){m.delivered=true;for(const id of m.factIds){once(x.knownBy[m.to],id);once(x.facts.find(f=>f.id===id).receivedBy,m.to);}}
}
