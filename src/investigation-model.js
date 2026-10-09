// C-017 is an original, bounded investigation, not a claim about novel canon.
export const zones={hall:'五楼走廊',r501:'501',r502:'502',r503:'503',elevator:'电梯厅',stairs:'消防楼梯',management:'物业管理室',access:'门禁设备间',storage:'废弃储藏室',open:'开放设备区',adjacent:'邻栋连接廊'};
export const people={lin:'林阿姨',chen:'陈浩',manager:'物业管理员',li:'李文',observer:'外围观察员'};
export const statuses={UNTESTED:'证据不足',WEAK:'有一定支持',SUPPORTED:'有一定支持',STRONGLY_SUPPORTED:'支持较强',CONFIRMED:'已确认',DISPROVEN:'已推翻'};
export const facts={
 E01:['三名失踪者都听过询问','林阿姨说，三名失踪居民都听见过门外询问。','林阿姨','MEDIUM'],
 E02:['没有对应访客记录','门禁记录没有与异常询问对应的访客。','门禁记录','HIGH'],
 E03:['502失踪前的回应','室内录音记录了门外询问，随后住户说了“谁啊”。','502录音','HIGH'],
 E04:['听见但未回应的对照','林阿姨说，她多次听见询问而没有回应，也没有后续追踪。','林阿姨','MEDIUM'],
 E05:['李文没有说话','李文说自己没有说话，但相同的敲门声越来越近。','李文','MEDIUM'],
 E06:['敲门也曾是回应','房门内侧有两处新敲击痕；李文承认在询问后从屋内敲了两下。','现场与李文复核','HIGH'],
 E07:['失效的检修门','物业管理员说，无法形成内外边界的破损检修门从未传来异常敲门声。','物业管理员','MEDIUM'],
 E08:['无人房间的声音实验','无人房间遥控播放“有人”，没有出现追踪；没有活人在门内。','遥控实验','HIGH'],
 E09:['走廊回应的对照','有人在走廊回应屋内普通询问，没有后续追踪；并非门内回应门外异常询问。','走廊对照','HIGH'],
 E10:['跨门的空间痕迹','有代价的媒介探查发现，相同痕迹在不同房门重复出现，不能用普通移动解释。','灵异探查','HIGH'],
 E11:['开放区阻止接近','移除开放设备区全部有效门后，已有追踪未再接近；原有痕迹仍在。','隔离验证','HIGH'],
 E12:['换房没有摆脱敲门','陈浩说，一名失踪者换房后仍遭同样敲门声；他认为是被记住了脸，这一解释未获证实。','陈浩','MEDIUM'],
 E13:['隔墙接近的敲门声','李文失踪前，敲门声连续出现在相邻门结构上。','现场复核','HIGH'],
 E14:['邻栋收到同样的报告','物业通联收到邻栋住户关于同样门外询问的报告；原楼栋地图不能保证覆盖新区域。','物业通联报告','MEDIUM']
};
export const conditions={heard:'听见询问',spoken:'说话回应',knocked:'敲门回应',inside:'经门回应并确认自己在门内',boundary:'门失去内外边界功能',face:'被记住面容'};
export function newDoorCase(){return {format:1,started:false,active:false,seed:null,elapsed:0,zone:'hall',phase:'ARRIVAL',worldStatus:'DORMANT',grade:'C',source:'HIDDEN',manifestUntil:0,restricted:false,sealed:false,driven:false,removedDoors:false,evacuated:false,locked:false,official:false,rewarded:false,fragment:0,permission:0,experiments:[],evidence:[],hypotheses:[],search:{},npcs:Object.fromEntries(Object.keys(people).map(id=>[id,{state:'ALIVE',mark:id==='li'?{depth:0,age:0}:null,warned:false,knowledge:[],supportUsed:0}])),knownNPC:{},playerMark:null,observerRevival:63,journal:[],records:[],hint:'standard',notes:'',focus:null,tutorial:[],startRevival:{}};}
export const attachDoorCase=s=>s.doorCase?s:{...s,doorCase:newDoorCase()};
export function addFact(s,id){const x=s.doorCase;if(x.evidence.some(e=>e.id===id))return;const f=facts[id];x.evidence.push({id,title:f[0],fact:f[1],source:f[2],reliability:f[3],tick:s.tick,location:x.zone});reconcile(x);}
export function conditionPool(x){return ['heard',...(has(x,'E03')?['spoken']:[]),...(has(x,'E06')?['knocked','inside']:[]),...(has(x,'E07')?['boundary']:[]),...(has(x,'E12')?['face']:[])];}
export const has=(x,id)=>x.evidence.some(e=>e.id===id);
export function assess(x,c){
 const support={heard:['E01'],spoken:['E03'],knocked:['E06'],inside:['E01','E03','E06','E08','E09'],boundary:['E07','E10','E11'],face:['E12']}[c].filter(id=>has(x,id));
 const against={heard:['E04'],spoken:['E05','E06'],knocked:[],inside:[],boundary:[],face:[]}[c].filter(id=>has(x,id));
 let status=against.length?(c==='spoken'&&against.length<2?'WEAK':'DISPROVEN'):support.length===0?'UNTESTED':support.length===1?'WEAK':support.length===2?'SUPPORTED':'STRONGLY_SUPPORTED';
 if(c==='inside'&&['E01','E03','E04','E05','E06','E08','E09'].every(id=>has(x,id)))status='CONFIRMED';
 if(c==='boundary'&&support.length===3)status='CONFIRMED';
 return {status,support,against};
}
export function reconcile(x){for(const h of x.hypotheses)Object.assign(h,assess(x,h.condition));}
export const confirmed=(x,c)=>x.hypotheses.some(h=>h.condition===c&&h.status==='CONFIRMED');
export function doorUI(s){
 const x=s.doorCase;
 const questions=[{id:'trigger',text:'什么行为会招来追踪？',ids:['E01','E03','E04','E05','E06','E08','E09'],answered:confirmed(x,'inside')},
 {id:'pursuit',text:'换房为什么没有摆脱追踪？',ids:['E12','E10'],answered:has(x,'E10')&&has(x,'E12')},
 {id:'media',text:'有效房门和破损门有什么区别？',ids:['E07','E10','E11'],answered:confirmed(x,'boundary')}];
 const visible=questions.filter(q=>q.id==='trigger'||q.id==='pursuit'&&has(x,'E12')||q.id==='media'&&has(x,'E07'));
 const focus=visible.find(q=>q.id===x.focus)||visible.find(q=>!q.answered)||visible[0];
 const relevant=x.evidence.filter(e=>focus?.ids.includes(e.id)).slice(-5);
 const urgent=[];const li=x.knownNPC.li;if(li?.state==='ALIVE'&&has(x,'E05')&&!x.removedDoors&&!x.evacuated)urgent.push('李文报告敲门声正在接近；是否改变他的处境？');
 if(x.playerMark&&!x.removedDoors&&!x.sealed)urgent.push('你曾主动回应，已见异常痕迹；换房是否有效仍需对照。');
 if(s.spirits.some(g=>g.revivalProgress>=80))urgent.push('体内灵异已严重复苏，使用前检查对应代价。');
 let gap,source;
 if(!has(x,'E04')){gap='需要未回应者的对照。';source='幸存居民 / 林阿姨';}
 else if(!has(x,'E06')){gap='需要核对未说话者的实际行为。';source='当事人和现场 / 李文与502';}
 else if(!has(x,'E08')||!has(x,'E09')){gap='需要区分声音、人在何处和回应方向的对照。';source='无人的房间与走廊实验';}
 else if(!has(x,'E07')){gap='需要门结构异常的记录。';source='设施人员 / 物业管理员';}
 else if(!has(x,'E11')){gap='需要媒介失效后的观察。';source='可改变门结构的开放区域';}
 else {gap='可复核已有假设和处理条件。';source='调查档案';}
 const hint=x.hint==='off'?'':x.hint==='low'?gap:x.hint==='high'?gap+' 来源：'+source:gap+' 可查看'+source.split(' / ')[0]+'。';
 return {questions:visible.map(q=>({...q,state:q.answered?'ANSWERED':x.focus===q.id?'INVESTIGATING':'OPEN'})),focus,relevant,urgent:urgent.slice(0,3),hint,recent:x.journal.slice(-5),resume:x.started?{objective:x.sealed?'复核封存档案与独立驾驭条件':questions.every(q=>q.answered)?'选择处理方式：隔离、疏散或封存':focus?.text||'继续现场调查',latest:x.evidence.at(-1)?.title||'尚未获得现场证据',location:zones[x.zone]}:null};
}
// Preferences are non-world edits: drafts/notes/hint toggles never consume action windows.
export function editDoorUI(input,field,value){const s=structuredClone(attachDoorCase(input)),x=s.doorCase;
 if(field==='hint'&&['off','low','standard','high'].includes(value))x.hint=value;
 else if(field==='notes'&&typeof value==='string'&&value.length<=2000)x.notes=value;
 else if(field==='focus'&&doorUI(s).questions.some(q=>q.id===value))x.focus=value;
 else if(field==='teaching'&&['evidence','hypothesis','resolution'].includes(value)&&!x.tutorial.includes(value))x.tutorial.push(value);
 else return input;return s;
}
export function validDoorCase(s){try{return checkDoorCase(s);}catch{return false;}}
function checkDoorCase(s){
 const x=s.doorCase;if(x===undefined)return true;const int=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;const mark=m=>m===null||m&&int(m.depth,4)&&int(m.age,1e9);
 if(!x||x.format!==1||!Object.keys(zones).includes(x.zone)||!['ARRIVAL','EVIDENCE','PRESSURE','RESTRICTION','RESOLUTION'].includes(x.phase)||!['DORMANT','ACTIVE','PARTIALLY_CONTAINED','RESOLVED'].includes(x.worldStatus)||!['C','B'].includes(x.grade)||!['HIDDEN','MANIFEST','RESTRICTED','SEALED'].includes(x.source)||!int(x.elapsed,1e9)||!int(x.manifestUntil,1e9)||!int(x.observerRevival,100)||!int(x.fragment,1)||!int(x.permission,1)||!mark(x.playerMark)||x.seed!==null&&!int(x.seed,4294967295))return false;
 if(['started','active','restricted','sealed','driven','removedDoors','evacuated','locked','official','rewarded'].some(k=>typeof x[k]!=='boolean')||x.active&&!x.started||x.started&&x.seed!==((s.seed^0xc017)>>>0)||x.sealed&&!x.restricted||x.driven&&!x.sealed||x.sealed!==(x.source==='SEALED')||x.restricted!==['RESTRICTED','SEALED'].includes(x.source)||x.sealed!==(x.worldStatus==='RESOLVED'))return false;
 if(!['off','low','standard','high'].includes(x.hint)||typeof x.notes!=='string'||x.notes.length>2000||x.focus!==null&&!['trigger','pursuit','media'].includes(x.focus))return false;
 const unique=(a,allowed)=>Array.isArray(a)&&new Set(a).size===a.length&&a.every(id=>allowed.includes(id));
 if(!unique(x.experiments,['empty','hall','self','knock','open'])||!unique(x.tutorial,['evidence','hypothesis','resolution'])||!Array.isArray(x.evidence)||x.evidence.length>14||new Set(x.evidence.map(e=>e.id)).size!==x.evidence.length||x.evidence.some(e=>!facts[e.id]||e.title!==facts[e.id][0]||e.fact!==facts[e.id][1]||e.source!==facts[e.id][2]||e.reliability!==facts[e.id][3]||!int(e.tick,s.tick)||!zones[e.location]))return false;
 if(!Array.isArray(x.hypotheses)||x.hypotheses.length>6||new Set(x.hypotheses.map(h=>h.condition)).size!==x.hypotheses.length||x.hypotheses.some(h=>!conditionPool(x).includes(h.condition)||h.subject!==(h.condition==='boundary'?'房门结构':'回应行为')||h.result!==(h.condition==='boundary'?'阻止接近':'被追踪')||!int(h.tick,s.tick)||JSON.stringify(assess(x,h.condition))!==JSON.stringify({status:h.status,support:h.support,against:h.against})))return false;
 if(!x.npcs||Object.keys(x.npcs).length!==5||Object.keys(people).some(id=>{const n=x.npcs[id];return !n||!['ALIVE','EVACUATED','MISSING'].includes(n.state)||!mark(n.mark)||typeof n.warned!=='boolean'||!unique(n.knowledge,['heard','spoken','knocked','inside','boundary','face'])||!int(n.supportUsed,1);}))return false;
 if(!x.knownNPC||Object.entries(x.knownNPC).some(([id,n])=>!people[id]||!['ALIVE','EVACUATED','MISSING'].includes(n.state)||!int(n.tick,s.tick)))return false;
 if(!x.search||Object.entries(x.search).some(([id,n])=>!zones[id]||!int(n,1))||!Array.isArray(x.journal)||x.journal.length>60||x.journal.some(j=>!int(j.tick,s.tick)||typeof j.action!=='string'||j.action.length>200||typeof j.result!=='string'||j.result.length>500)||!Array.isArray(x.records)||x.records.length>30||!x.startRevival||Object.entries(x.startRevival).some(([id,v])=>typeof id!=='string'||!Number.isFinite(v)||v<0||v>100))return false;
 return x.records.every(r=>int(r.tick,s.tick)&&['ESCAPED','PARTIALLY_CONTAINED','RESOLVED'].includes(r.result)&&int(r.observedSurvivors,5)&&int(r.facts,14)&&typeof r.official==='boolean'&&r.revivalDelta&&Object.values(r.revivalDelta).every(v=>Number.isFinite(v)&&v>=-100&&v<=100));
}

