// Observes completed engine transitions. It cannot grant gameplay resources.
import {initialSettlement,appendHistory,sealHistoryRecord,validSettlement,settlementCoreToken} from './settlement-save.js';
import {beginBattleSettlement,advanceBattleSettlement,sessionForSavedGame,settlementForSavedGame} from './settlement-live-adapter.js';
import {hostState} from './spirits.js';
import {beginChapterSettlement,advanceChapterSettlement,chapterSessionForSavedGame} from './settlement-chapters.js';

function allocate(meta,session){
 if(!session)return null;
 const encounterId=`${meta.ownerId}:${meta.nextEncounter++}`;
 return {...session,id:encounterId,encounterId,ownerId:meta.ownerId};
}
function boundedSession(session){
 if(!session)return null;
 while(new TextEncoder().encode(JSON.stringify(session)).length>120*1024&&session.log.length)session.log.shift();
 return session;
}
export function observeSettlement(before,after,action,usedId=null){
 let meta=structuredClone(after.settlement||initialSettlement(after,{legacy:true}));
 meta.latestId=null;after.settlement=meta;
 let active=chapterSessionForSavedGame(meta.active,before)||sessionForSavedGame(meta.active,before);
 const pending=Object.values(meta.pending||{}).filter(v=>chapterSessionForSavedGame(v,before));
 let chapterStart=beginChapterSettlement(before,after,action);
 if(active&&!active.chapterKey&&chapterStart?.resumed)chapterStart=null;
 const continuing=active?.chapterKey===chapterStart?.chapterKey;
 if(chapterStart&&!continuing){
  if(active?.chapterKey)pending.push({...active,overlap:true});
  const resume=pending.findIndex(v=>v.chapterKey===chapterStart.chapterKey);
  active=resume>=0?pending.splice(resume,1)[0]:allocate(meta,chapterStart);
 }
 if(chapterStart||active?.chapterKey){
  if(!active&&chapterStart)active=allocate(meta,chapterStart);
  if(active?.chapterKey){const update=advanceChapterSettlement(active,before,after,action,usedId);if(update.record){const record=sealHistoryRecord({...update.record,startTick:active.startedAt},meta.ownerId,active.encounterId);meta=appendHistory(meta,record);}active=update.session;}
 }
 else if(action==='combat:start'||action.startsWith('enter:')&&after.phase==='限制')active=allocate(meta,beginBattleSettlement(after,{before}));
 else{
  if(!active)active=allocate(meta,beginBattleSettlement(before,{resumed:true}));
  if(active){
   const update=advanceBattleSettlement(active,before,after,action);active=update.session;
   if(update.record){
    const resultCode=update.record.outcome==='objective'&&update.record.rewards.some(r=>r.kind==='实际驾驭')?'controlled':update.record.outcome;
    const record=sealHistoryRecord({...update.record,resultCode,startTick:active?.startedAt??meta.active?.startedAt??before.tick},meta.ownerId,meta.active?.encounterId||active?.encounterId||`${meta.ownerId}:${meta.nextEncounter-1}`);
    meta=appendHistory(meta,record);meta.latestId=record.id;
   }
  }
 }
 meta.pending={};for(const session of pending){const update=advanceChapterSettlement(session,before,after,action,usedId);if(update.record)meta=appendHistory(meta,sealHistoryRecord({...update.record,startTick:session.startedAt},meta.ownerId,session.encounterId));if(update.session)meta.pending[session.chapterKey]=boundedSession(update.session);}
 meta.active=boundedSession(active);after.settlement=meta;return after;
}

const oldToken=s=>{
 const ordered=v=>Array.isArray(v)?v.map(ordered):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,ordered(v[k])])):v;
 const {settlement,...core}=s;return JSON.stringify(ordered(core));
};
// Only the exact old core/cache pair can migrate. Missing historical data is
// left unavailable; this never replays an engine action or a reward grant.
export function migratePresentationCache(s,cached){
 let meta=structuredClone(s.settlement||initialSettlement(s,{legacy:true}));
 if(meta.records.length||meta.active||Object.keys(meta.pending||{}).length)return s;
 const token=oldToken(s),session=cached?.session,record=cached?.record;
 if(session?.format===2&&session.seed===s.seed&&session.binding===token){
  const migrated={...structuredClone(session),binding:settlementCoreToken(s)};
  if(sessionForSavedGame(migrated,s))meta.active=allocate(meta,migrated);
 }
 if(record?.format===2&&record.sourceSeed===s.seed&&record.sourceTick===s.tick&&record.sourceAction===s.actionReceipt?.action&&record.sourceState===token&&record.cost?.energy?.after===s.energy&&record.cost?.burden?.after===hostState(s).effectiveBurden){
  const encounterId=`${meta.ownerId}:${meta.nextEncounter++}`;
  try{const migrated=sealHistoryRecord({...structuredClone(record),sourceState:settlementCoreToken(s),startTick:record.sourceTick,migration:'exact-core-cache'},meta.ownerId,encounterId);meta=appendHistory(meta,migrated);meta.latestId=migrated.id;}catch{}
 }
 const candidate={...s,settlement:meta};return validSettlement(candidate)?candidate:s;
}
export function currentSettlement(s){
 if(!s?.settlement?.latestId)return null;
 const record=s.settlement.records.find(r=>r.id===s.settlement.latestId);
 return record?settlementForSavedGame(record,s):null;
}
