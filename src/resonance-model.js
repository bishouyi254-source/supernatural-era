import {available,act,validate,upgrade} from './engine.js';
import {events} from './content.js';
import {activeIds} from './v1.js';
import {hostState,growthFor,revivalStage} from './spirits.js';
import {effectiveRelations} from './evolution-model.js';
import {reviewVerdict} from './dual.js';
import {commitSnapshot} from './snapshot-commit.js';
export const SAVE_KEY='supernatural-era.prototype.v2';
export const TIERS=['神灵异','S','A','B','C','D'];
export const familyTypes=[['host','宿主关联'],['mutual','双向制约'],['directional','单向制约'],['conflict','冲突与偏移'],['unknown','未验证关系'],['neutral','已观察关系']].map(([id,name])=>({id,name,color:id==='unknown'?'#9ea7b0':id==='conflict'?'#b677ff':'#ff3044',status:'当前记录',note:'仅显示已有持有实例与关系记录'}));
export const pairKey=(a,b)=>[a,b].sort().join('|');
const artKeys={eye:'eye',watch:'cassette',headless:'shadow',shadow:'shadow'};
export function projectResonance(s){
 if(!s)return {name:'尚未载入角色',ghosts:[],links:[],host:null,review:null,actions:[]};
 const active=new Set(activeIds(s)),effective=effectiveRelations(s),legal=available(s),observed=new Set(s.evolution.observed);
 const ghosts=s.spirits.map((g,i)=>({id:g.id,name:g.name,rank:TIERS.includes(g.rank)?g.rank:null,status:active.has(g.id)?'participating':'available',major:i<5,core:s.evolution.host.core===g.id,artKey:artKeys[g.sourceId]||null,sourceId:g.sourceId,source:events[g.sourceId].source,revival:g.revivalProgress,revivalStage:revivalStage(g.revivalProgress),burden:g.burden,development:g.development,naturalGrowth:growthFor(s,g),callGrowth:growthFor(s,g,true),rule:s.v1.certified.includes(g.sourceId)?events[g.sourceId].ability:null,condition:s.knowledge[g.sourceId]?.hypotheses.true==='confirmed'?events[g.sourceId].restriction:null}));
 const links=ghosts.map(g=>({id:'host:'+g.id,a:'player',b:g.id,type:'resonance',family:'host',label:'宿主持有关联',known:true,values:null,rule:null}));
 // Only actual recorded relations are drawn; never infer all pairs or new powers.
 for(const r of s.relations){const key=pairKey(r.spiritA,r.spiritB),known=observed.has(key),e=effective.find(v=>pairKey(v.spiritA,v.spiritB)===key),conflict=known&&(r.conflictAtoB+r.conflictBtoA>0||Math.abs(r.bias||0)>=60),a=known&&e.suppressionAtoB>0,b=known&&e.suppressionBtoA>0;
 links.push({id:'relation:'+key,a:r.spiritA,b:r.spiritB,type:known?(conflict?'conflict':'resonance'):'clue',family:!known?'unknown':conflict?'conflict':a&&b?'mutual':a||b?'directional':'neutral',label:known?'已观察关系':'尚未完成关系对照',known,values:known?{compatibility:r.compatibility,suppressionAtoB:e.suppressionAtoB,suppressionBtoA:e.suppressionBtoA,conflictAtoB:r.conflictAtoB,conflictBtoA:r.conflictBtoA,bias:r.bias||0}:null,observeAction:legal.includes('evo:graph:observe:'+key)?'evo:graph:observe:'+key:null,rule:null});
 }
 return {name:s.name,ghosts,links,host:hostState(s),review:{verdict:reviewVerdict(s.spirits.length===2&&s.dual.review.pair.slice().sort().join('|')===s.spirits.map(g=>g.id).sort().join('|')?s.dual.review.verdict:'UNVERIFIED'),samples:structuredClone(s.dual.review.samples),history:s.evolution.history.slice(-10)},actions:legal.filter(a=>/^dual:(observe|evaluate|cycle|use:|stress:)/.test(a)||a.startsWith('evo:graph:observe:'))};
}
export function readResonance(storage){try{const token=storage.getItem(SAVE_KEY);if(!token)return {state:null,token:null,error:'当前来源没有游戏存档。请返回游戏建立角色或导入已有副本。'};const parsed=JSON.parse(token);if(!validate(parsed))throw Error();return {state:upgrade(parsed),token,error:null};}catch{return {state:null,token:null,error:'存档无法读取或校验，原始内容未修改。'};}}
const previewAllowed=(s,a)=>(a==='balance:medium'||projectResonance(s).actions.includes(a))&&available(s).includes(a);
export function previewResonance(storage,action){const read=readResonance(storage);if(!read.state)return {ok:false,reason:'NO_SAVE'};if(!previewAllowed(read.state,action))return {ok:false,reason:'NO_ACTION'};const next=act(read.state,action);if(next===read.state||!validate(next))return {ok:false,reason:'INVALID'};
 const beforeHost=hostState(read.state),afterHost=hostState(next);
 return {ok:true,token:read.token,action,life:next.life-read.state.life,energy:next.energy-read.state.energy,time:next.dachang.timeUnits-read.state.dachang.timeUnits,ticks:next.tick-read.state.tick,barrierBefore:read.state.systems.items.barrier,barrierAfter:next.systems.items.barrier,persistentLoadBefore:read.state.ghostEyeV6.persistentLoad,persistentLoadAfter:next.ghostEyeV6.persistentLoad,burdenBefore:beforeHost.effectiveBurden,burdenAfter:afterHost.effectiveBurden,capacityBefore:beforeHost.hostCapacity,capacityAfter:afterHost.hostCapacity,ghosts:read.state.spirits.map(g=>{const n=next.spirits.find(v=>v.id===g.id);return{id:g.id,name:g.name,revivalBefore:g.revivalProgress,revivalAfter:n.revivalProgress,revivalDelta:n.revivalProgress-g.revivalProgress,burdenBefore:g.burden,burdenAfter:n.burden,burdenDelta:n.burden-g.burden};})};}
export function submitResonance(storage,preview){if(!preview?.ok)return {committed:false,reason:'NO_PREVIEW'};const current=readResonance(storage);if(!current.state)return {committed:false,reason:'NO_SAVE'};if(current.token!==preview.token)return {committed:false,reason:'STALE'};if(!previewAllowed(current.state,preview.action))return {committed:false,reason:'NO_ACTION'};const next=act(current.state,preview.action);return {...commitSnapshot(current.state,next,value=>storage.setItem(SAVE_KEY,value),validate),action:preview.action};}
