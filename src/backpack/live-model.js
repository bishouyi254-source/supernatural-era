import {available,act,validate,upgrade} from '../engine.js';
import {events} from '../content.js';
import {activeIds} from '../v1.js';
import {cdLabel} from '../views-cd.js';
import {v1Label} from '../views-v1.js';
import {growthFor} from '../spirits.js';
import {commitSnapshot} from '../snapshot-commit.js';
import {GRADES,resolveExistingAction} from './model.js';
export const SAVE_KEY='supernatural-era.prototype.v2';
export function liveItems(state){
 const active=activeIds(state),legal=available(state);
 return state.spirits.map(g=>{const e=events[g.sourceId];return {id:g.id,name:g.name,sourceId:g.sourceId,owned:true,equipped:active.includes(g.id),kind:null,slotLabel:active.includes(g.id)?'启用列表第'+(active.indexOf(g.id)+1)+'位':'未启用',origin:/原创|ORIGINAL/.test(e.source)?'原创':'原著',sourceNote:e.source,visualGrade:GRADES.includes(g.rank)?g.rank:null,development:g.development,revival:g.revivalProgress,burden:g.burden,stability:g.stability,keywords:[g.sourceId,e.medium,e.source],medium:e.medium,ability:e.ability,restriction:e.restriction,knowledge:state.knowledge[g.sourceId]?.hypotheses.true||'未认证',callGrowth:growthFor(state,g,true),combinationBlocked:state.systems.combinations.some(c=>c.disabledId===g.id),actions:legal.filter(a=>['study:','practice:','v1:active:add:','v1:active:remove:'].some(p=>a===p+g.id)).map(id=>({id,label:cdLabel(id,state)||v1Label(id,state)||id}))};});
}
export function readLive(storage){const raw=storage.getItem(SAVE_KEY);if(!raw)return {state:null,token:null,items:[]};const parsed=JSON.parse(raw);if(!validate(parsed))throw Error('存档校验失败，原始存档未覆盖');const state=upgrade(parsed);return {state,token:raw,items:liveItems(state)};}
export function submitLive(storage,expectedToken,id,type){
 let current;try{current=readLive(storage);}catch{return {committed:false,reason:'INVALID'};}
 if(!current.state)return {committed:false,reason:'NO_SAVE'};
 if(current.token!==expectedToken)return {committed:false,reason:'STALE'};
 const item=current.items.find(x=>x.id===id),action=item&&resolveExistingAction(item,type);
 if(!action||!available(current.state).includes(action))return {committed:false,reason:'NO_ACTION'};
 const result=commitSnapshot(current.state,act(current.state,action),value=>storage.setItem(SAVE_KEY,value),validate);
 return {...result,action};
}
