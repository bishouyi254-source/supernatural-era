/** Portable, read-only settlement metadata. This module never executes game actions. */
export const SETTLEMENT_LIMITS=Object.freeze({records:32,historyBytes:256*1024,activeBytes:128*1024});
const outcomes=new Set(['suppressed','sealed','objective','escaped','failed']);
const chapterKeys=new Set(['school','mall','bus','transit','contract','investigation','door','doorDrive','village','reunion','regional','mirror','crisis','hungry','finale','postwar','identity','legacyChapter','legacyJourney']);
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const str=(v,max=2000,min=0)=>typeof v==='string'&&v.length>=min&&v.length<=max;
const int=(v,max=1e9,min=0)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const num=(v,max=1e6,min=0)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const list=(v,max,check)=>Array.isArray(v)&&v.length<=max&&v.every(check);
const unique=v=>new Set(v).size===v.length;
const encoder=new TextEncoder();
function ordered(value){
 if(Array.isArray(value))return value.map(ordered);
 if(plain(value))return Object.fromEntries(Object.keys(value).sort().map(k=>[k,ordered(value[k])]));
 return value;
}
function canonical(value){return JSON.stringify(ordered(value));}
function bytes(value){return encoder.encode(JSON.stringify(value)).length;}
// Two independent 32-bit accumulators detect accidental edits/corruption. This is
// a checksum, not a signature or a claim of protection from deliberate forgery.
function checksum(value){
 const data=encoder.encode(canonical(value));let a=0x811c9dc5,b=0x9e3779b9;
 for(const v of data){a=Math.imul(a^v,0x01000193)>>>0;b=Math.imul(b^v,0x85ebca6b)>>>0;}
 return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');
}
const owner=s=>({seed:s.seed,name:s.name,background:s.background});
// Existing v2 validation permits an empty imported display name. Keep that
// backward-compatible rather than rejecting an otherwise valid old core save.
const ownerValid=o=>plain(o)&&int(o.seed,4294967295)&&str(o.name,24)&&str(o.background,100,1);
const idValid=id=>str(id,128,1)&&/^[A-Za-z0-9:_-]+$/.test(id);
function sequence(id,ownerId){
 if(!str(id,150,1)||!id.startsWith(ownerId+':'))return null;
 const suffix=id.slice(ownerId.length+1);
 return /^[1-9]\d*$/.test(suffix)&&int(Number(suffix),1e9,1)?Number(suffix):null;
}
const tokenValid=v=>str(v,60,1)&&/^core-v1:[a-f0-9]{16}:\d+$/.test(v);
const ghost=g=>plain(g)&&str(g.id,150,1)&&str(g.name,150,1)&&num(g.before,100)&&num(g.after,100)&&
 (g.origin===undefined||['start','acquired'].includes(g.origin))&&(g.removed===undefined||typeof g.removed==='boolean')&&
 (g.joinedAtTick===undefined||int(g.joinedAtTick));
const log=l=>plain(l)&&str(l.text,2000)&&str(l.stage,150)&& (l.id===undefined||str(l.id,150));
const reward=r=>plain(r)&&['id','icon','kind','name','quantity'].every(k=>str(r[k],150,k==='quantity'?0:1));
function recordShape(r){
 return plain(r)&&r.format===2&&idValid(r.ownerId)&&sequence(r.encounterId,r.ownerId)!==null&&r.id===r.encounterId&&
  int(r.sourceTick)&&int(r.sourceSeed,4294967295)&&str(r.sourceAction,200,1)&&tokenValid(r.sourceState)&&
  str(r.eventId,150,1)&&outcomes.has(r.outcome)&&typeof r.missionCompleted==='boolean'&&
  ['encounter','target','ruleResult'].every(k=>str(r[k],2000,1))&&
  ['title','resultLabel','coverageLabel'].every(k=>r[k]===undefined||str(r[k],2000))&&
  plain(r.cost)&&['energy','burden'].every(k=>plain(r.cost[k])&&num(r.cost[k].before,k==='energy'?3:1e6)&&num(r.cost[k].after,k==='energy'?3:1e6))&&
  list(r.cost.ghosts,100,ghost)&&unique(r.cost.ghosts.map(g=>g.id))&&list(r.abilitiesUsed,4096,v=>str(v,200,1))&&
  list(r.log,200,log)&&list(r.rewards,100,reward)&&unique(r.rewards.map(v=>v.id))&&
  plain(r.actions)&&typeof r.actions.returnToMap==='boolean'&&typeof r.actions.retry==='boolean';
}
function intact(r){
 if(!recordShape(r)||!str(r.checksum,16,16)||!/^[a-f0-9]{16}$/.test(r.checksum))return false;
 const {checksum:stored,...value}=r;return stored===checksum(value);
}
function metaShape(m){
 return plain(m)&&m.format===1&&idValid(m.ownerId)&&ownerValid(m.owner)&&int(m.nextEncounter,1e9,1)&&
  ['available','unavailable'].includes(m.legacyHistory)&&int(m.prunedCount)&&
  (m.latestId===null||sequence(m.latestId,m.ownerId)!==null)&&Array.isArray(m.records)&&m.records.length<=SETTLEMENT_LIMITS.records&&
  bytes(m.records)<=SETTLEMENT_LIMITS.historyBytes;
}
function activeValid(a,m,s){
 if(a===null)return true;
 if(!plain(a)||a.format!==2||a.id!==a.encounterId||sequence(a.encounterId,m.ownerId)===null||
  sequence(a.encounterId,m.ownerId)>=m.nextEncounter||(a.ownerId!==undefined&&a.ownerId!==m.ownerId)||
  a.seed!==m.owner.seed||!str(a.eventId,150,1)||!int(a.startedAt,s.tick)||!int(a.lastTick,s.tick,a.startedAt)||a.lastTick!==s.tick||
  typeof a.resumed!=='boolean'||a.binding!==settlementCoreToken(s)||bytes(a)>SETTLEMENT_LIMITS.activeBytes)return false;
 if(a.chapterKey!==undefined&&!chapterKeys.has(a.chapterKey))return false;
 for(const key of ['resourcesBefore','earnedResources','earnedGrowth'])if(a[key]!==undefined&&(!plain(a[key])||Object.keys(a[key]).length>100||Object.entries(a[key]).some(([k,v])=>!str(k,150,1)||!num(v,1e9))))return false;
 if(a.earnedGhosts!==undefined&&(!list(a.earnedGhosts,100,v=>str(v,150,1))||!unique(a.earnedGhosts)))return false;
 const b=a.baseline;
 if(!plain(b)||!num(b.energy,3)||!num(b.burden)||!list(b.ghosts,100,g=>plain(g)&&str(g.id,150,1)&&str(g.name,150,1)&&num(g.revival,100)&&num(g.development,100))||
  !unique(b.ghosts.map(g=>g.id))||!list(b.clues,100,v=>str(v,150,1))||!(b.outcome===null||str(b.outcome,150)))return false;
 if(b.resources!==undefined&&(!plain(b.resources)||!int(b.resources.bags,2)||!int(b.resources.barrier,2)))return false;
 if(b.aids!==undefined&&(!plain(b.aids)||Object.entries(b.aids).length>100||Object.entries(b.aids).some(([id,v])=>!str(id,150,1)||!plain(v)||!int(v.remaining,2)||!int(v.used,2)||v.remaining+v.used!==2)))return false;
 return list(a.ghostLedger,100,g=>plain(g)&&str(g.id,150,1)&&str(g.name,150,1)&&num(g.before,100)&&num(g.revival,100)&&num(g.development,100)&&['start','acquired'].includes(g.origin)&&typeof g.removed==='boolean'&&(g.joinedAtTick===undefined||int(g.joinedAtTick,s.tick)))&&
  unique(a.ghostLedger.map(g=>g.id))&&list(a.used,4096,v=>str(v,200,1))&&list(a.log,200,log);
}
export function initialSettlement(s,{id,legacy=false}={}){
 if(!ownerValid(owner(s)))throw Error('结算存档身份无效');
 const ownerId=id??'save-'+checksum(owner(s));if(!idValid(ownerId))throw Error('结算存档 ID 无效');
 return {format:1,ownerId,owner:owner(s),nextEncounter:1,active:null,pending:{},latestId:null,records:[],legacyHistory:legacy?'unavailable':'available',prunedCount:0};
}
export function attachSettlement(s){
 return Object.hasOwn(s,'settlement')?s:{...s,settlement:initialSettlement(s,{legacy:true})};
}
export function settlementCoreToken(s){
 if(!plain(s))return 'core-v1:'+checksum(null)+':4';
 const {settlement,...core}=s,value={ownerId:settlement?.ownerId??null,core};
 return 'core-v1:'+checksum(value)+':'+encoder.encode(canonical(value)).length;
}
export function sealHistoryRecord(record,ownerId,encounterId){
 const value={...structuredClone(record),id:encounterId,ownerId,encounterId};delete value.checksum;
 if(!recordShape(value))throw Error('结算历史快照无效');
 // Persist exactly the portable JSON representation (e.g. optional undefined
 // joinedAtTick fields are omitted in both memory and an exported save).
 return JSON.parse(JSON.stringify({...value,checksum:checksum(value)}));
}
export function appendHistory(meta,record){
 if(!metaShape(meta)||!intact(record)||record.ownerId!==meta.ownerId||record.sourceSeed!==meta.owner.seed)throw Error('结算历史绑定或完整性无效');
 if(meta.records.some(r=>!intact(r)||r.ownerId!==meta.ownerId||r.sourceSeed!==meta.owner.seed)||!unique(meta.records.map(r=>r.id)))throw Error('既有结算历史已损坏');
 const old=meta.records.find(r=>r.encounterId===record.encounterId);
 if(old){if(old.checksum!==record.checksum)throw Error('同一遭遇存在冲突结算');return structuredClone(meta);}
 if(bytes([record])>SETTLEMENT_LIMITS.historyBytes)throw Error('单条结算超过历史容量');
 const records=[...structuredClone(meta.records),structuredClone(record)];let removed=0;
 while(records.length>SETTLEMENT_LIMITS.records||bytes(records)>SETTLEMENT_LIMITS.historyBytes){records.shift();removed++;}
 return {...structuredClone(meta),records,latestId:record.id,nextEncounter:Math.max(meta.nextEncounter,sequence(record.encounterId,meta.ownerId)+1),prunedCount:meta.prunedCount+removed};
}
export function validSettlement(s){
 try{
  if(!Object.hasOwn(s,'settlement'))return true;
  const m=s.settlement;if(!metaShape(m)||canonical(m.owner)!==canonical(owner(s)))return false;
  if(!m.records.every(r=>intact(r)&&r.ownerId===m.ownerId&&r.sourceSeed===s.seed&&r.sourceTick<=s.tick&&sequence(r.encounterId,m.ownerId)<m.nextEncounter)||!unique(m.records.map(r=>r.id)))return false;
  if(m.latestId!==null&&!m.records.some(r=>r.id===m.latestId))return false;
  if(m.active!==null&&m.records.some(r=>r.id===m.active?.encounterId))return false;
  const pending=m.pending??{};if(!plain(pending)||Object.keys(pending).length>20||bytes(pending)>1024*1024)return false;
  const sessions=[m.active,...Object.values(pending)].filter(Boolean);if(!unique(sessions.map(v=>v.encounterId))||sessions.some(v=>m.records.some(r=>r.id===v.encounterId)))return false;
  if(Object.entries(pending).some(([key,v])=>key!==v?.chapterKey||!activeValid(v,m,s)))return false;
  return activeValid(m.active,m,s);
 }catch{return false;}
}
export function historyRecord(s,id){
 if(!validSettlement(s))return null;
 const record=s.settlement?.records.find(r=>r.id===id);if(!record)return null;
 return {...structuredClone(record),actions:{returnToMap:true,retry:false}};
}
// Existing note/hint editors are legitimate non-action changes. Rebind only
// after proving that every authoritative field and the old ledger are intact.
export function rebindSettlementPresentation(before,after){
 if(!before.settlement?.active&&!Object.keys(before.settlement?.pending||{}).length||!validSettlement(before))return after;
 const cleaned=s=>{const v=structuredClone(s);delete v.settlement;for(const [key,fields] of Object.entries({school:['notes','hint'],doorCase:['notes','hint','focus','tutorial'],dachang:['notes','candidate','bookmarks']}))for(const f of fields)if(v[key])delete v[key][f];return v;};
 if(canonical(cleaned(before))!==canonical(cleaned(after)))return after;
 const binding=settlementCoreToken(after);return {...after,settlement:{...after.settlement,active:after.settlement.active?{...after.settlement.active,binding}:null,pending:Object.fromEntries(Object.entries(after.settlement.pending||{}).map(([key,v])=>[key,{...v,binding}]))}};
}
