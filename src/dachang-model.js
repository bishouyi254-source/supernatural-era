import {itemTypes} from './v1.js';
import {events} from './content.js';
import {schoolPeople} from './school-model.js';
export const cityPlaces={street:'现实街头',home:'普通住所',clinic:'社区诊所',commercial:'商业街外围'};
export const feedEntries={
 gold:{title:'黄金隔绝：一份未核实实验转述',source:'UNDERGROUND',origin:'underground-gold-01',level:'SUPPORTED',text:'有人称完整黄金封装可隔绝部分灵异接触；帖子没有提供你的目标测试结果。',location:'未核实实验地点'},
 repost:{title:'转发：黄金隔绝实验',source:'PUBLIC_RUMOR',origin:'underground-gold-01',level:'SUSPECTED',text:'转述同一实验，不能作为第二个独立来源。',location:'网络转述'},
 footsteps:{title:'求助：住宅中的异常脚步',source:'PUBLIC_RUMOR',origin:'residential-help-01',level:'SUSPECTED',text:'发帖者声称夜间听到脚步；真实性和源头均未知，不自动成为可驾驭事件。',location:'住址未确认'},
 trade:{title:'交易：普通记录工具',source:'UNDERGROUND',origin:'trader-offer-01',level:'SUSPECTED',text:'卖家提供记录工具一份，报价100现金。不是厉鬼或保证封存的媒介。',location:'商业街外围'}
};
export const canonCityTitles=['街头','接线员','代号','这辈子都不可能','登录网站','你哪来的爸？','不存在记忆中的人','红纸遮眼','借钱','浴室的手印','奸商','凉凉送给你'];
export function newDachang(){return {format:1,started:false,enteredAt:null,lastTick:0,elapsed:0,timeUnits:0,zone:'street',baseline:null,schoolHistory:null,contacts:[],official:{attempted:false,verified:false,relationship:'NONE',route:null,reports:[],knownSpirits:[],witnessed:[],knowledge:[],requested:[],supportUsed:false},codename:null,codeHistory:[],candidate:'',home:{confirmed:false,kind:null,level:0},storage:Object.fromEntries(Object.keys(itemTypes).map(id=>[id,0])),feeds:[],bookmarks:{},facts:[],rumors:[],residuals:[],intrusion:{eligible:null,state:'DORMANT',memory:null,checked:[],tension:0},clock:{day:1,period:'傍晚'},canonNodes:[],signal:{known:false,stage:'UNREVEALED',decision:null,inquired:false},trade:{sellerChecked:false,itemChecked:false,stock:1,completed:false},flashlight:false,balanceObservations:[],riskReviewed:false,setupCompleted:false,notes:'',history:[]};}
export function attachDachang(s){return s.dachang?{...s,dachang:{...s.dachang,balanceObservations:s.dachang.balanceObservations||[],timeUnits:s.dachang.timeUnits??s.dachang.elapsed*4}}:{...s,dachang:newDachang()};}
export const knownFact=(d,id)=>d.facts.some(f=>f.id===id);
export function cityFact(s,id,text,source,origin,level='SUPPORTED'){
 const d=s.dachang;if(knownFact(d,id))return;d.facts.push({id,text,source,origin,level,tick:s.tick});
}
export function citySetup(s){const d=s.dachang;return {home:d.home.confirmed,official:d.official.attempted,code:!s.spirits.length||!!d.codename||d.official.route==='HIDDEN'||d.official.requested.includes('code-declined'),intel:d.facts.some(f=>f.source==='PERSONAL_CONTACT'&&f.level==='CONFIRMED'||f.source==='OFFICIAL'&&f.level==='SUPPORTED'),risk:d.riskReviewed,contact:d.contacts.some(c=>c.id!=='operator')||d.official.attempted};}
export function codeCandidates(s){const g=s.spirits[0];return g?[g.name+'记录者',g.name+'接触者','大昌异常观察者']:[];}
export function editDachangUI(s,field,value){const next=structuredClone(s);if(field==='notes')next.dachang.notes=String(value).slice(0,2000);if(field==='candidate')next.dachang.candidate=String(value).trim().slice(0,16);if(field==='bookmark'&&Array.isArray(value)&&feedEntries[value[0]]&&['关注','存疑','相关','忽略','归档'].includes(value[1]))next.dachang.bookmarks[value[0]]=value[1];return next;}
const record=v=>v&&typeof v==='object'&&!Array.isArray(v),int=(v,max=1e9)=>Number.isInteger(v)&&v>=0&&v<=max;
const list=(v,max,fn)=>Array.isArray(v)&&v.length<=max&&v.every(x=>fn(x)),unique=(v,max,fn)=>list(v,max,fn)&&new Set(v).size===v.length;
const string=(v,max=2000)=>typeof v==='string'&&v.length<=max;
export function validDachang(s){try{
 const d=s.dachang;if(d===undefined)return true;if(!record(d)||d.format!==1||!Object.hasOwn(cityPlaces,d.zone)||!int(d.elapsed)||!int(d.lastTick)||d.lastTick>s.tick||!int(d.home?.level,0))return false;
 if(d.timeUnits!==undefined&&(!int(d.timeUnits,4e9)||d.timeUnits>d.elapsed*4||d.timeUnits<d.elapsed))return false;
 for(const k of ['started','flashlight','riskReviewed','setupCompleted'])if(typeof d[k]!=='boolean')return false;
 if(!record(d.home)||typeof d.home.confirmed!=='boolean'||![null,'OWN','RENTED'].includes(d.home.kind)||d.home.confirmed!==(d.home.kind!==null))return false;
 if(d.balanceObservations!==undefined&&!list(d.balanceObservations,30,o=>record(o)&&int(o.tick)&&o.tick<=s.tick&&string(o.state,30)&&typeof o.bias==='number'&&Number.isFinite(o.bias)&&o.bias>=0&&unique(o.spiritIds,20,id=>typeof id==='string'&&id.startsWith('player-')&&Object.hasOwn(events,id.slice(7)))&&o.verdict==='OBSERVED_ONLY'))return false;
 if(!record(d.storage)||Object.keys(d.storage).length!==Object.keys(itemTypes).length||Object.keys(itemTypes).some(id=>!int(d.storage[id],3)))return false;
 if(!string(d.candidate,16)||!string(d.notes)||!list(d.history,80,string))return false;
 if(!unique(d.canonNodes,12,n=>int(n,31)&&n>=20)||d.canonNodes.some((n,i)=>n!==20+i))return false;
 if(!unique(d.feeds,4,id=>Object.hasOwn(feedEntries,id))||!record(d.bookmarks)||Object.entries(d.bookmarks).some(([id,v])=>!feedEntries[id]||!['关注','存疑','相关','忽略','归档'].includes(v)))return false;
 if(!list(d.facts,40,f=>record(f)&&string(f.id,60)&&string(f.text)&&['OFFICIAL','UNDERGROUND','PUBLIC_RUMOR','PERSONAL_CONTACT','MEMORY','DIRECT','SUPERNATURAL_SOURCE'].includes(f.source)&&string(f.origin,100)&&['UNKNOWN','SUSPECTED','SUPPORTED','CONFIRMED','DISPROVEN'].includes(f.level)&&int(f.tick)&&f.tick<=s.tick)||new Set(d.facts.map(f=>f.id)).size!==d.facts.length)return false;
 if(d.feeds.some(id=>!d.facts.some(f=>f.id==='feed-'+id&&f.origin===feedEntries[id].origin)))return false;
 if(!list(d.contacts,10,c=>record(c)&&string(c.id,30)&&string(c.name,30)&&['OFFICIAL','SURVIVOR','LOCAL'].includes(c.type)&&['AVAILABLE','UNREACHABLE','UNKNOWN'].includes(c.availability)&&unique(c.flags,10,string))||new Set(d.contacts.map(c=>c.id)).size!==d.contacts.length)return false;
 const o=d.official;if(!record(o)||typeof o.attempted!=='boolean'||typeof o.verified!=='boolean'||typeof o.supportUsed!=='boolean'||!['NONE','CONTACT','LIMITED','REFUSED','COOPERATIVE'].includes(o.relationship)||![null,'COOPERATIVE','INDEPENDENT','HIDDEN'].includes(o.route))return false;
 if(!unique(o.knownSpirits,20,id=>typeof id==='string'&&Object.hasOwn(events,id.replace(/^player-/,''))&&id.startsWith('player-'))||!list(o.witnessed,40,w=>record(w)&&string(w.spiritId,40)&&string(w.phenomenon,40)&&int(w.tick)&&w.tick<=s.tick)||!unique(o.requested,20,string)||!unique(o.reports,40,string)||!list(o.knowledge,20,f=>record(f)&&string(f.id,40)&&string(f.text)&&['SUPPORTED','CONFIRMED','UNKNOWN'].includes(f.level)))return false;
 if(!list(d.codeHistory,20,c=>record(c)&&string(c.name,16)&&int(c.tick)&&c.tick<=s.tick))return false;
 if(d.codename!==null&&(!record(d.codename)||!string(d.codename.name,16)||!d.codename.name.trim()||!['REGISTERED','UNVERIFIED'].includes(d.codename.status)||!(typeof d.codename.basis==='string'&&d.codename.basis.startsWith('player-')&&Object.hasOwn(events,d.codename.basis.slice(7)))||!int(d.codename.tick)||d.codename.tick>s.tick))return false;
 if(!list(d.rumors,30,r=>record(r)&&string(r.id,60)&&string(r.text)&&string(r.origin,100)&&int(r.tick)&&r.tick<=s.tick))return false;
 if(!list(d.residuals,10,r=>record(r)&&string(r.id,50)&&string(r.source,60)&&string(r.attached,40)&&['ACTIVE','DORMANT','REFERRED','UNCONFIRMED'].includes(r.state)&&typeof r.known==='boolean'))return false;
 const x=d.intrusion;if(!record(x)||![null,true,false].includes(x.eligible)||!['DORMANT','CONFLICT','CHECKED','REFERRED','AVOIDED'].includes(x.state)||!unique(x.checked,3,k=>['external','contact','object'].includes(k))||!int(x.tension,6))return false;
 if(x.memory!==null&&(!record(x.memory)||!string(x.memory.text)||!['UNRELIABLE','CONFLICTING'].includes(x.memory.reliability)))return false;
 if(!int(d.clock?.day)||d.clock.day<1||!['清晨','白天','傍晚','深夜'].includes(d.clock.period))return false;
 if(!record(d.signal)||typeof d.signal.known!=='boolean'||typeof d.signal.inquired!=='boolean'||!['UNREVEALED','RUMOR','INVESTIGATING','OTHER_INTERVENTION'].includes(d.signal.stage)||![null,'WATCH','IGNORE','APPROACH'].includes(d.signal.decision))return false;
 if(!record(d.trade)||typeof d.trade.sellerChecked!=='boolean'||typeof d.trade.itemChecked!=='boolean'||typeof d.trade.completed!=='boolean'||!int(d.trade.stock,1)||d.trade.completed!==(d.trade.stock===0))return false;
 if(d.started){if(!int(d.enteredAt)||d.enteredAt>s.tick||d.elapsed!==s.tick-d.enteredAt||!record(d.baseline)||!unique(d.baseline.facilities,4,string)||!record(d.baseline.chapters)||!record(d.schoolHistory)||!unique(d.schoolHistory.saved,6,id=>Object.hasOwn(schoolPeople,id))||typeof d.schoolHistory.participated!=='boolean'||typeof d.schoolHistory.legacy!=='boolean'||!(d.schoolHistory.recordTick===null||int(d.schoolHistory.recordTick)&&d.schoolHistory.recordTick<=s.tick)||['mall','club','village'].some(id=>typeof d.baseline.chapters[id]!=='boolean')||d.contacts.some(c=>c.type==='SURVIVOR'&&!d.schoolHistory.saved.includes(c.id)&&!(c.id.startsWith('rescue-')&&s.regional?.official.reports.includes('RESULT')&&s.regional.saved.includes(c.id.slice(7)))))return false;}
 else if(d.enteredAt!==null||d.baseline!==null||d.schoolHistory!==null||d.elapsed||d.canonNodes.length||d.facts.length)return false;
 return true;
 }catch{return false;}}
