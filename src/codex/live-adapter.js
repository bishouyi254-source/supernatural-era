import {events} from '../content.js';
import {RATINGS,projectRecord} from './model.js';
// No world registry enumeration, Canon actors, rewards, or engine actions.
const proof=(label,ids)=>ids.length?label+': '+ids.join(', '):'';
// Published IDs are persistent personal-note references; never derive them from content order.
export const ARCHIVE_IDS=Object.freeze({door:'FILE-001',watch:'FILE-002',officer:'FILE-003',eye:'FILE-004',hungry:'FILE-005',blood:'FILE-006',headless:'FILE-007',shadow:'FILE-008',echo:'FILE-009'});
export function readGameArchive(storage,validate,upgrade){
 try{const raw=storage.getItem(SAVE_KEY);if(!raw)return {state:null,message:'当前来源没有游戏存档。请返回游戏建立角色或导入已有副本。'};
  const parsed=JSON.parse(raw);if(!validate(parsed))throw Error('INVALID');return {state:upgrade(parsed),message:''};
 }catch{return {state:null,message:'当前存档无法读取或验证，原始内容已保留。请返回游戏导出原始副本。'};}
}
export function gameRecords(s){
 if(!s)return [];
 const rows=Object.entries(events).filter(([id])=>Object.hasOwn(ARCHIVE_IDS,id)).map(([id,e])=>{
  const k=s.knowledge?.[id]||{clues:[],hypotheses:{}},held=s.spirits.filter(g=>g.sourceId===id);
  const clues=e.clues.filter(c=>k.clues.includes(c.id));
  const inv=id==='watch'?s.investigation:id==='door'?s.doorCase:null;
  const facts=(inv?.evidence||[]).map(f=>`${f.id} · ${f.fact}【${f.source} / ${f.reliability} / 行动 ${f.timestamp??f.tick}】`);
  const outcome=s.outcomes[id],discovered=!!(clues.length||facts.length||held.length||outcome||inv?.started||s.scene===id);
  const identified=!!(held.length||outcome||id==='watch'&&inv?.evidence.some(f=>f.id==='medium'));
  const rating=held.find(g=>RATINGS.includes(g.rank))?.rank||null;
  const certified=s.v1.certified.includes(id);
  const rules=k.hypotheses.true==='confirmed'?[`${certified?'已对照认证':'有证据支持的推测'}：${e.hypothesis}（仅限当前实例与条件）`]:[];
  if(k.hypotheses.false==='disproved')rules.push('已推翻：'+e.falseHypothesis);
  const encounters=[...(outcome?['已有处理记录：'+outcome]:[]),...(inv?.records||[]).map(r=>'行动 '+r.tick+' · '+(r.result||r.resolution||'已记录结果'))];
  const known=clues.map(c=>c.id),source=discovered?e.source:'';
  const location=discovered?(id==='watch'?'废弃值班室':id==='door'?'C-017 公寓调查现场':e.title):'';
  const art=identified&&({watch:'assets/workshop-cassette-art-v1.png',eye:'assets/workshop-reference-extracted/card-eye-art-tight.png',blood:'assets/workshop-reference-extracted/card-blood-art-tight.png',headless:'assets/workshop-reference-extracted/card-shadow-art-tight.png'}[id])||null;
  return {id:ARCHIVE_IDS[id],eventId:id,name:identified?(held[0]?.name||e.spirit):'未知档案',discovered,contacted:!!(inv?.started||s.scene===id||outcome||held.length),rating,source,location,art,
   progressEvidence:discovered?`基础线索 ${clues.length}/${e.clues.length}；只统计已有基础线索，不表示所有规律已确认。`:'',
   rules,encounters,clues:[...facts,...(facts.length?[]:clues.map(c=>'现场线索 '+c.id+'：'+c.text))],
   completeness:discovered?Math.round(clues.length/e.clues.length*100):null,investigation:null,
   evidence:{identity:identified?'已有媒介辨认或处理/持有记录':'',contact:discovered?'当前现场或已有处理/持有记录':'',rating:rating?'持有实例 rank 字段（游戏评级）':'',source:discovered?'玩家已有现场记录':'',location:discovered?'玩家已接触场景':'',rules:proof('玩家假设验证',rules),encounters:proof('已有处理记录',encounters),clues:proof('玩家已有证据',facts.length?facts:known),progress:discovered?'已获得基础线索 / 该实例基础线索总数':''}};
 });
 // Evidence archives have no guessed spirit identity or inferred rank.
 const dossiers=[['school','七中调查'],['mall','商场调查'],['village','黄岗村调查'],['regional','区域救援'],['reunion','城市回归'],['identityCase','身份案件'],['postwar','战后调查'],['finale','终局调查'],['hungry','城市危机调查']];
 for(const [key,label] of dossiers){const x=s[key];const visible=(x?.evidence||[]).filter(f=>typeof f==='object'&&typeof(f.fact??f.text)==='string');if(!visible.length)continue;
  const clues=visible.map(f=>`${f.id} · ${f.fact??f.text}【${f.source??f.origin??'已有玩家档案'} / ${f.level??f.reliability??'未核实'} / 行动 ${f.tick??f.timestamp??'未记录'}】`);
  rows.push({id:'CASE-'+key,eventId:null,discovered:true,name:'未知档案',source:label+' · 已有证据档案',location:'区域信息待核实',clues,evidence:{source:'已有案件证据',clues:visible.map(f=>f.id).join(', ')}});
 }
 const transit=(s.bus?.transit?.evidence||[]).filter(e=>e.receivedBy==='player');
 const authorized=Object.values(s.worldRegistry?.evidence||{}).filter(e=>e.knownBy?.includes('player'));
 for(const [id,label,list] of [['TRANSIT','公交观察',transit],['RECEIVED','已接收调查资料',authorized]])if(list.length)rows.push({id:'CASE-'+id,discovered:true,name:'未知档案',source:label,clues:list.map(e=>`${e.id} · ${e.text}【${e.origin??'玩家现场观察'} / ${e.level} / 行动 ${e.tick}】`),evidence:{source:'已接收证据',clues:list.map(e=>e.id).join(', ')}});
 return rows;
}
export function publicRecords(s){return gameRecords(s).map(projectRecord);}
export const SAVE_KEY='supernatural-era.prototype.v2';
export function preferenceKey(s){return 'supernatural-era.codex.ui.v1:'+encodeURIComponent(JSON.stringify([s.seed,s.name,s.background]));}
export function loadPreferences(storage,s){try{const x=JSON.parse(storage.getItem(preferenceKey(s))||'{}');return {target:typeof x.target==='string'?x.target:null,notes:x.notes&&typeof x.notes==='object'&&!Array.isArray(x.notes)?x.notes:{}};}catch{return {target:null,notes:{}};}}
export function savePreference(storage,s,id,type,value){
 const visible=publicRecords(s).find(r=>r.id===id&&r.discovered);if(!visible)throw Error('该档案尚未发现，不能标记');
 const x=loadPreferences(storage,s);if(type==='target')x.target=id;else if(type==='note')x.notes={...x.notes,[id]:String(value).slice(0,2000)};else throw Error('未知标记操作');
 storage.setItem(preferenceKey(s),JSON.stringify(x));return x;
}
