// 七中 Canon adapter. Window thresholds, routes and mutable students are game adaptation.
export const schoolZones={classroom:'B楼开放教室',office:'B楼办公室',stairs:'备用楼梯',hall:'A楼走廊',lecture:'临时讲课教室',toilet:'厕所外侧',yard:'操场',tree:'异常树区域',exit:'校门出口'};
export const normalEdges={classroom:['office','stairs'],office:['classroom','stairs'],stairs:['classroom','office','hall','yard'],hall:['stairs','lecture','toilet'],lecture:['hall'],toilet:['hall'],yard:['stairs','tree','exit'],tree:['yard'],exit:['yard']};
export const canonTitles=['论坛里的故事','临时讲课','老人','敲门','迷路','厕所中的手','身后的脚步','奇怪的树','周正','生命倒计时','逐渐复苏','寂静的周围','羊皮纸','诡异的纸','老人出现的条件','被接通的电话','可怕的电话','死亡逼近','离开的八人'];
export const windows=[
 {id:'NORMAL_WORLD',min:4,hard:9,nodes:[1,2]},
 {id:'FIRST_ANOMALY',min:5,hard:12,nodes:[3,4]},
 {id:'DOMAIN_DISTORTION',min:7,hard:16,nodes:[5,6,7,8]},
 {id:'GHOST_CONTROLLER_REVEAL',min:6,hard:14,nodes:[9,10,11,12]},
 {id:'SURVIVAL_KNOWLEDGE',min:9,hard:20,nodes:[13,14,15,16,17]},
 {id:'ESCAPE',min:6,hard:18,nodes:[18,19]}
];
export const schoolPeople={he:{name:'何宁',zone:'classroom',role:'信息型'},lu:{name:'陆远',zone:'office',role:'路线型'},xu:{name:'许泽',zone:'hall',role:'冲突型'},qiao:{name:'乔雨',zone:'toilet',role:'高风险型'},su:{name:'苏晴',zone:'stairs',role:'普通型'},lin:{name:'林越',zone:'yard',role:'普通型'}};
export const schoolFacts={
 'F-01':['论坛信息','网上出现老人和敲门的异常故事；真假尚未确认。','INTERNET','LOW'],
 'M-00':['正常校园','照明、通信和消防平面图均与当前校园相符。','DOCUMENT','HIGH'],
 'K-01':['敲门现象','走廊出现间歇敲门声。来源不能仅凭声音确定。','DIRECT','HIGH'],
 'K-02':['未知老人','敲门出现后，走廊尽头出现一位行动异常的老人。','DIRECT','HIGH'],
 'M-01':['出口错位','沿原消防图移动，却返回原楼层。正常路线已经失效。','DIRECT','HIGH'],
 'M-02':['路线对照','标记和消防图对照显示空间连接改变；标记本身未消失。','DOCUMENT','HIGH'],
 'M-03':['异常地标','树所在区域的边界与正常校园图不符。它不是普通物资点。','DIRECT','HIGH'],
 'S-01':['厕所异常','厕所门内出现不属于在场学生的手部轮廓。与老人是否同源仍未知。','DIRECT','HIGH'],
 'S-02':['身后脚步','在相同空间状态下，绕开厕所后，身后脚步逐渐减弱。','DIRECT','HIGH'],
 'Z-01':['周正现场','周正在应对真实灵异，普通手段无法解决当前异常。','CANON_ACTOR','HIGH'],
 'Z-02':['能力的代价','周正使用力量后身体状况继续恶化；驭鬼者并非没有生存代价。','DIRECT','HIGH'],
 'Z-03':['幸存者转述','幸存者描述周正曾使用灵异应对异常，之后身体出现恶化。','NPC_TESTIMONY','MEDIUM'],
 'P-01':['特殊来源提示','现场转述的羊皮纸信息指向声音与老人活动的联系，但没有给出全部规律。','SUPERNATURAL_SOURCE','HIGH'],
 'P-02':['来源动机','特殊纸张的信息可能促使人接近危险；内容与来源意图不能混同。','INFERENCE','MEDIUM'],
 'C-01':['通信异常','手机显示有信号，却无法正常完成定位与通话。','DIRECT','HIGH'],
 'C-02':['危险通信','接通的异常电话带来相同敲门音频，随后出现接近迹象。','SUPERNATURAL_COMMUNICATION','HIGH'],
 'K-03':['行为对照','未接触音频的学生未出现同样接近迹象；主动播放者身后出现异常。','NPC_TESTIMONY','MEDIUM'],
 'K-04':['隔离观察','停止音频并隔离声音后，短时接近压力下降；源头并未消失。','DIRECT','HIGH'],
 'M-04':['出口复核','操场标记和出口现场复核形成当前阶段的一段有效路线。','DIRECT','HIGH'],
 'Y-01':['短暂交汇','与杨间短暂交换了空间异常的信息，随后各自行动。','CANON_ACTOR','HIGH'],
 'Y-02':['目击灵异','远处杨间表现出异常视野能力；具体能力与归属需另行核实。','DIRECT','HIGH'],
 'R-01':['事后信息','现实封锁点公布七中存在八名正史队伍幸存者；你的小组另记。','OFFICIAL_ARCHIVE','HIGH'],
 'O-01':['留白异常','B楼照明熄灭时墙影与人体动作不符；保持应急照明时接近停止。','DIRECT','HIGH'],
 'O-02':['声音媒介','一段脱离正常通话的回声沿播放媒介重复；封闭听筒后影响减弱。','DIRECT','HIGH'],
 'O-03':['命运视野','树旁出现仅在你的视野中存在的空间裂隙；它与正史人物的经历分开。','DIRECT','HIGH']
};
export const schoolHypotheses={sound:'声音媒介与老人接近有关',random:'老人只会随机出现',space:'正常地图已失效',source:'所有异常来自同一个源头',paper:'特殊纸张的建议永远安全'};
export function schoolSeedRoll(seed){let n=(seed^0x710019)>>>0;n=Math.imul(n^(n>>>16),0x45d9f3b)>>>0;return (n^(n>>>16))>>>0;}
export function newSchool(){return {format:1,started:false,active:false,participated:false,zone:'classroom',window:0,windowTicks:0,elapsed:0,canonResolved:false,playerEscaped:false,result:null,residual:false,residualTicks:0,nodes:[],anchors:[],canonInstances:[],actors:{yang:{zone:'lecture',goal:'应对异常'},zhou:{zone:'lecture',goal:'临时讲课'}},missedScenes:[],contacts:[],relationships:{yang:[],zhou:[]},convergence:{state:'NONE',routes:[]},evidence:[],hypotheses:[],mapEdges:[],search:{},visited:[],tools:{map:false,key:false,cotton:false,light:false,marks:false},earsCovered:false,audioStopped:false,pressure:0,shield:0,group:{members:[],trust:1,panic:0,knownRules:[],zone:'classroom',followState:'FOLLOWING'},npcs:Object.fromEntries(Object.entries(schoolPeople).map(([id,p])=>[id,{zone:p.zone,state:'ALIVE',warned:false}])),knownNPC:{},opportunities:[],fate:null,drivingCount:0,startOwned:0,startResources:null,startRevival:{},records:[],history:[],hint:'standard',notes:''};}
export function attachSchool(s){return s.school?s:{...s,school:newSchool()};}
export const hasSchool=(x,id)=>x.evidence.some(e=>e.id===id);
export function schoolAssessment(x,id){
 const support={sound:['K-01','K-02','C-02','K-03','K-04','P-01'],random:['K-02'],space:['M-01','M-02'],source:['K-02','S-01'],paper:['P-01']}[id].filter(k=>hasSchool(x,k));
 const against={sound:[],random:['K-03','K-04'],space:['M-04'],source:[],paper:['P-02']}[id].filter(k=>hasSchool(x,k));
 let status=against.length&&['random','paper'].includes(id)?'DISPROVEN':support.length?'SUPPORTED':'UNVERIFIED';
 if(id==='sound'&&['K-01','K-02','K-03','K-04'].every(k=>hasSchool(x,k)))status='CONFIRMED';
 if(id==='space'&&['M-01','M-02'].every(k=>hasSchool(x,k)))status='CONFIRMED';
 // An available exit refutes “no exits exist”, not the observed prior distortion.
 return {id,status,support,against:id==='space'?[]:against};
}
export function schoolFact(s,id){const x=s.school;if(hasSchool(x,id))return;const [title,fact,source,reliability]=schoolFacts[id];x.evidence.push({id,title,fact,source,reliability,tick:s.tick,location:x.zone,...(id.startsWith('P-')?{motiveReliability:'UNTRUSTED'}:{})});x.hypotheses=x.hypotheses.map(h=>schoolAssessment(x,h.id));}
export function schoolRoute(x,from,to){if(x.window>=1&&x.window<=4){if(from==='stairs'&&to==='yard')return x.window===4&&x.tools.marks?'yard':'hall';if(from==='yard'&&to==='exit')return 'stairs';if(x.window===4&&from==='hall'&&to==='stairs')return 'office';}return to;}
export function schoolSituation(s){const x=s.school;let objective=!x.started?'核对七中现场':x.playerEscaped?'整理个人七中记录':x.residual?'复核残余出口，尽快离开':x.window===0?'记录正常地图与通信':x.window===1?'观察异常并避开来源':x.window===2?'比较实际路径与消防图':x.window===3?'保护小组，核对力量的代价':x.window===4?'比较声音与接近的独立案例':'沿当前有效路线撤离';
 return {objective,reason:x.evidence.at(-1)?.fact||'你尚未获得现场证据，不能凭故事确定规则。',map:x.window<2?'正常':x.window===5?'出口需现场复核':'连接不可靠',risk:x.pressure?'身后接近迹象正在增强':x.window>=4?'环境再次恶化':'暂未确认直接追踪',hint:x.hint==='off'?'':x.window>=5?'出口需要当下复核；旧连接可能已过期。':!hasSchool(x,'M-02')?'消防图与实际移动是两个可比较的来源。':!hasSchool(x,'K-03')?'你仍缺少敲门前后行为差异的独立案例。':'已经记录的事实可以支持或否定假设，但不能解释全部源头。'};
}
export function editSchoolUI(s,field,value){if(!s.school?.started)return s;if(field==='hint'&&!['off','low','standard','high'].includes(value)||field==='notes'&&(typeof value!=='string'||value.length>2000)||!['hint','notes'].includes(field))return s;const out=structuredClone(s);out.school[field]=value;return out;}
export function validSchool(s){if(s.school===undefined)return true;try{const x=s.school,integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max,unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
 if(!x||x.format!==1||!integer(x.window,0,5)||!integer(x.windowTicks,0,1e9)||!integer(x.elapsed,0,1e9)||!integer(x.residualTicks,0,1e9)||!Object.hasOwn(schoolZones,x.zone)||!integer(x.pressure,0,12)||!integer(x.shield,0,3)||!integer(x.drivingCount,0,1)||!integer(x.startOwned,0,20))return false;
 for(const k of ['started','active','participated','canonResolved','playerEscaped','residual','earsCovered','audioStopped'])if(typeof x[k]!=='boolean')return false;
 if(x.active&&(!x.started||!x.participated||x.playerEscaped)||x.canonResolved&&!x.nodes.includes(19)||x.playerEscaped&&x.result!=='ESCAPED'||!['ESCAPED','OUTSIDE','TRAPPED','PLAYER_DEATH','SPIRIT_REVIVAL',null].includes(x.result))return false;
 if(!unique(x.nodes)||x.nodes.some((v,i)=>v!==i+1)||!unique(x.anchors)||x.anchors.some(v=>!/^CA-(0[1-9]|10)$/.test(v))||x.anchors.length>10)return false;
 if(!Array.isArray(x.evidence)||!unique(x.evidence.map(e=>e.id))||x.evidence.length>Object.keys(schoolFacts).length)return false;
 for(const e of x.evidence){const f=schoolFacts[e.id];if(!f||e.title!==f[0]||e.fact!==f[1]||e.source!==f[2]||e.reliability!==f[3]||!integer(e.tick,0,s.tick)||!Object.hasOwn(schoolZones,e.location)||e.id.startsWith('P-')&&e.motiveReliability!=='UNTRUSTED')return false;}
 if(!unique(x.hypotheses.map(h=>h.id))||x.hypotheses.some(h=>!schoolHypotheses[h.id]||JSON.stringify(h)!==JSON.stringify(schoolAssessment(x,h.id))))return false;
 if(Object.keys(x.npcs).length!==6||Object.entries(x.npcs).some(([id,n])=>!schoolPeople[id]||!schoolZones[n.zone]||!['ALIVE','MISSING','ESCAPED'].includes(n.state)||typeof n.warned!=='boolean'))return false;
 if(!unique(x.group.members)||x.group.members.some(id=>!schoolPeople[id])||!integer(x.group.trust,0,5)||!integer(x.group.panic,0,5)||!['FOLLOWING','HESITANT','DISPERSED'].includes(x.group.followState)||!unique(x.group.knownRules)||x.group.knownRules.some(k=>!schoolHypotheses[k]))return false;
 if(Object.keys(x.knownNPC).some(id=>!schoolPeople[id])||Object.values(x.knownNPC).some(n=>!['ALIVE','MISSING','ESCAPED'].includes(n.state)||!integer(n.tick,0,s.tick)||!schoolZones[n.zone]))return false;
 if(Object.values(x.tools).some(v=>typeof v!=='boolean')||Object.keys(x.tools).join(',')!=='map,key,cotton,light,marks')return false;
 if(!Array.isArray(x.mapEdges)||x.mapEdges.length>40||x.mapEdges.some(e=>!normalEdges[e.from]?.includes(e.to)||!schoolZones[e.actual]||!integer(e.window,0,5)||!integer(e.tick,0,s.tick)||!['CURRENT','STALE'].includes(e.status)))return false;
 if(!unique(x.visited)||x.visited.some(z=>!schoolZones[z])||Object.entries(x.search).some(([k,v])=>!schoolZones[k]||!integer(v,0,5)))return false;
 if(!['NONE','PENDING','ACTIVE','RESOLVED'].includes(x.convergence.state)||!Array.isArray(x.convergence.routes)||x.convergence.routes.length>100||x.convergence.routes.some(r=>!['MANIFESTATION_ONLY','ACTOR_ALTERNATE_ROUTE','INFORMATION_REROUTE'].includes(r.type)||!integer(r.tick,0,s.tick)))return false;
 if(!Array.isArray(x.contacts)||x.contacts.length>12||x.contacts.some(c=>!['yang','zhou'].includes(c.actor)||!integer(c.window,0,5)||!integer(c.tick,0,s.tick))||Object.values(x.relationships).some(a=>!unique(a)||a.some(f=>!['MET','SHARED_INFORMATION','COOPERATED','CONFLICTED','WITNESSED_SPIRIT'].includes(f))))return false;
 if(x.canonInstances.length>1||x.canonInstances.some(g=>g.id!=='canon-yang-eye'||g.owner!=='杨间'||g.name!=='鬼眼'))return false;
 if(!Array.isArray(x.missedScenes)||x.missedScenes.length>19||x.missedScenes.some(n=>!x.nodes.includes(n.sceneId)||typeof n.observed!=='boolean'||typeof n.secondhandKnown!=='boolean'))return false;
 if(x.started&&(x.fate?.seed!==s.seed||x.fate?.roll!==schoolSeedRoll(s.seed)%10000||!integer(x.fate?.roll,0,9999)||typeof x.fate?.eyeEligible!=='boolean'||typeof x.fate?.rareEligible!=='boolean'||x.fate.eyeEligible!==(x.fate.roll<20)||x.fate.rareEligible!==(x.fate.roll<2500)))return false;
 if(!Array.isArray(x.opportunities)||x.opportunities.length>3||!unique(x.opportunities.map(o=>o.id))||x.opportunities.some(o=>!['shadow','echo','eye'].includes(o.id)||!['COMMON','RARE','FATE'].includes(o.tier)||o.canonSafe!==true||typeof o.attempted!=='boolean'||typeof o.discovered!=='boolean'||typeof o.resolved!=='boolean'||!['UNKNOWN','INVESTIGATED','PREPARED','SUCCESS','FAILED','ARCHIVE'].includes(o.stage)))return false;
 if(x.drivingCount!==x.opportunities.filter(o=>o.stage==='SUCCESS').length)return false;
 if(!['off','low','standard','high'].includes(x.hint)||typeof x.notes!=='string'||x.notes.length>2000||!Array.isArray(x.history)||x.history.length>100||x.history.some(t=>typeof t!=='string'||t.length>1000)||!Array.isArray(x.records)||x.records.length>1)return false;
 if(Object.keys(x.actors).join(',')!=='yang,zhou'||Object.values(x.actors).some(a=>!schoolZones[a.zone]||typeof a.goal!=='string'||a.goal.length>100))return false;
 if(Object.keys(x.relationships).join(',')!=='yang,zhou')return false;
 if(x.started&&(!x.startResources||Object.entries(x.startResources).some(([k,v])=>!['life','energy','bags','barrier'].includes(k)||!integer(v,0,100))||Object.keys(x.startResources).length!==4))return false;
 if(!x.startRevival||Array.isArray(x.startRevival)||Object.values(x.startRevival).some(v=>!Number.isFinite(v)||v<0||v>100))return false;
 if(x.nodes.includes(13)!==(x.canonInstances.length===1)||x.canonResolved!==(x.nodes.includes(19)))return false;
 for(const r of x.records){if(!r||!['ESCAPED','PLAYER_DEATH','SPIRIT_REVIVAL','TRAPPED'].includes(r.result)||!integer(r.tick,0,s.tick)||!integer(r.elapsed,0,x.elapsed)||!['普通人','驭鬼者'].includes(r.entered)||!['普通人','驭鬼者'].includes(r.departed)||!unique(r.survivors)||r.survivors.some(id=>!schoolPeople[id])||!integer(r.archive,0,60)||!['shadow','echo','eye',null].includes(r.spirit))return false;
  if(!r.cost||Object.keys(r.cost).length!==4||Object.values(r.cost).some(v=>!Number.isFinite(v)||Math.abs(v)>100)||!r.revivalDelta||Object.values(r.revivalDelta).some(v=>!Number.isFinite(v)||Math.abs(v)>100))return false;
  if(!Array.isArray(r.evidence)||r.evidence.some(e=>!x.evidence.some(actual=>JSON.stringify(actual)===JSON.stringify(e)))||!Array.isArray(r.hypotheses)||r.hypotheses.some(h=>!schoolHypotheses[h.id]||!['UNVERIFIED','SUPPORTED','CONFIRMED','DISPROVEN'].includes(h.status)))return false;
  if(!r.knownNPC||Object.entries(r.knownNPC).some(([id,n])=>!schoolPeople[id]||!schoolZones[n.zone]||!integer(n.tick,0,r.tick)||!['ALIVE','MISSING','ESCAPED'].includes(n.state))||!unique(r.canonKnown)||r.canonKnown.some(id=>!r.evidence.some(e=>e.id===id)))return false;
 }
 return true;
 }catch{return false;}}
