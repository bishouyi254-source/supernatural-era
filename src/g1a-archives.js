// Evidence adapters only. Missing source rules never become selectable powers.
import {events} from './content.js';
export const newG1A=()=>({format:1,rope:{studied:[]},blood:{contacts:[],studied:[]},shroud:{studied:[]}});
export const attachG1A=s=>s.g1a?s:{...s,g1a:newG1A()};
const fact=(s,section,id)=>s[section]?.facts?.find(f=>f.id===id);
const row=(id,sourceId,text,tick,kind)=>({id,sourceId,text,tick,kind});
// Player knowledge is projected from existing permanent facts, not hidden world state.
export function ropeArchive(s){
 const evidence=[];
 for(const [id,text] of [['ROPE','已核对独立鬼绳源头'],['SEALED','可靠通报确认正史实例已关押']]){const f=fact(s,'regional',id);if(f)evidence.push(row('regional:'+id,'wang-yue-canon:rope',text,f.tick,'report'));}
 const f=fact(s,'ghostMirror','ROPE');if(f)evidence.push(row('mirror:ROPE','wang-yue-canon:rope','核验同一源头履历；受控放出仍有危险，玩家不能召唤',f.tick,'observation'));
 return {id:'003',title:'束缚谱',identity:evidence.length?'已核实独立危险源；没有玩家获取路线':'尚无本人核实的源头资料；获取路线未开放',evidence,contacts:[],stage:'R0',
  locks:['R1：缺少玩家合法接触行动及控制条件','R2：缺少合法束缚、到期与解除规则','R3：没有核实玩家高阶压制或拼图关系'],
  lifecycle:'受控、显现与失控的条件尚待核实；目前不可接触、束缚或收绳'};
}
export function bloodArchive(s){
 const evidence=[];const f=fact(s,'reunion','YAN_DEATH');if(f)evidence.push(row('reunion:YAN_DEATH','yan-canon:blood','经可靠渠道核对严力死亡及鬼血失去约束；不是玩家媒介',f.tick,'report'));
 // Only after locate, the player knows a release location/status. Never mutate that object.
 if(f)for(const d of s.reunion.deaths.filter(d=>d.id==='yan-canon'))for(const m of d.released.filter(m=>m.sourceId==='blood'&&m.located))evidence.push(row('release:'+m.id,m.id,'已定位独立释放媒介；处置状态 '+m.status,d.tick,'release'));
 for(const c of s.g1a?.blood.contacts||[])evidence.push(row(c.id,'player-blood',c.outcome==='failed'?'身体媒介对抗未阻断袭击':'身体媒介对抗得到'+(c.outcome==='blocked'?'阻断':'部分阻断')+'结果',c.tick,'contact'));
 const studied=s.g1a?.blood.studied.includes('contact-review');
 return {id:'004',title:'外放记录',identity:s.spirits.some(g=>g.id==='player-blood')?'独立同源玩家实例；与严力源头分开':'未持有玩家鬼血；原有商场候选路线保留',evidence,
  media:[],stage:'B0',locks:['B2：外放持续、风险触发和跨场边界未定义','B3：媒介特殊应用无合法事件核实','媒介回收：可控及可撤回条件未定义，不能处理失控源头'],
  lifecycle:'外放媒介的受控、风险与失控条件尚待核实；当前没有可操作的外放媒介'};
}
export function shroudArchive(s){
 const f=fact(s,'ghostMirror','SHROUD'),evidence=f?[row('mirror:SHROUD','ye-shroud','仅观察到叶枫本次特定接触受到保护；不代表所有袭击均适用',f.tick,'protection')]:[];
 return {id:'005',title:'寿衣护持档案',identity:f?'已观察到叶枫的寿衣保护；未证明可转移为玩家衣物':'尚无本人核验的穿戴资料',evidence,wearing:null,stage:'S0',
  locks:['S1：衣物、本体与穿戴者关系尚未核实','S2：没有玩家袭击资格与防护结算规则','S3：没有持续侵蚀触发及合法处理规则','S4：没有真正压制或拼图证据'],
  lifecycle:'当前没有合法穿戴关系；已发生的侵蚀只能按合法方式处理'};
}
export const archives=s=>[ropeArchive(s),bloodArchive(s),shroudArchive(s)];
export function g1aAvailable(s){
 if(s.scene!=='hub'||s.combat||s.systems.death!=='alive'||s.crisis)return [];
 const out=[],x=s.g1a||newG1A();
 for(const [key,view] of [['rope',ropeArchive(s)],['blood',bloodArchive(s)],['shroud',shroudArchive(s)]])for(const e of view.evidence.filter(e=>e.kind!=='contact'))if(!x[key].studied.includes(e.id))out.push('g1a:review:'+key+':'+e.id);
 if(s.energy>0&&s.spirits.some(g=>g.id==='player-blood')&&!x.blood.studied.includes('contact-review')&&x.blood.contacts.some(c=>c.outcome!=='failed'))out.push('g1a:review-blood-contest');
 return out;
}
export function applyG1A(s,action){
 if(action==='g1a:review-blood-contest'){s.energy--;s.g1a.blood.studied.push('contact-review');s.journal.push('鬼血案例：研究实际身体媒介对抗结果。能量1，时间和自然复苏按公共行动结算；没有解锁外放或回收。');return;}
 const [, ,key,...parts]=action.split(':'),id=parts.join(':');s.g1a[key].studied.push(id);s.journal.push('研究已核实案例：'+archives(s).find(v=>v.id===({rope:'003',blood:'004',shroud:'005'}[key])).evidence.find(e=>e.id===id).text+'。知识归档不转移源头、不发奖、不授予能力。');
}
// Called by the existing enemy resolver, after its typed body-medium contest.
export function recordBloodContest(s,r,outcome,provenance){
 if(!s.g1a||!provenance||r.medium!=='body'||!s.spirits.some(g=>g.id==='player-blood'))return;
 const id='blood:body:'+r.instanceId+':'+outcome;
 if(!s.g1a.blood.contacts.some(c=>c.id===id))s.g1a.blood.contacts.push({id,actorId:'player-blood',targetId:r.instanceId,eventId:s.combat.eventId,battleId:provenance.battleId,contactTick:provenance.tick,tick:s.tick,outcome});
}
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===keys.split(',').sort().join('|');
const unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
export function validG1A(s){
 if(s.g1a===undefined)return true;
 try{const x=s.g1a;if(!exact(x,'format,rope,blood,shroud'+(x.candidate===undefined?'':',candidate')+(x.production===undefined?'':',production'))||x.format!==1||!exact(x.rope,'studied')||!exact(x.shroud,'studied')||!exact(x.blood,'studied,contacts'))return false;
  for(const [key,view] of [['rope',ropeArchive(s)],['blood',bloodArchive(s)],['shroud',shroudArchive(s)]])if(!unique(x[key].studied)||x[key].studied.some(id=>!(key==='blood'&&id==='contact-review')&&!view.evidence.some(e=>e.kind!=='contact'&&e.id===id)))return false;
  if(!Array.isArray(x.blood.contacts)||x.blood.contacts.length>Object.keys(events).length*3||new Set(x.blood.contacts.map(c=>c.id)).size!==x.blood.contacts.length)return false;
  for(const c of x.blood.contacts)if(!exact(c,'id,actorId,targetId,eventId,battleId,contactTick,tick,outcome')||!events[c.eventId]||events[c.eventId].medium!=='body'||c.actorId!=='player-blood'||c.targetId!=='source:'+c.eventId||!['blocked','partial','failed'].includes(c.outcome)||c.id!=='blood:body:'+c.targetId+':'+c.outcome||typeof c.battleId!=='string'||!c.battleId.startsWith(s.settlement.ownerId+':')||!Number.isInteger(c.contactTick)||c.contactTick<0||c.contactTick>c.tick||!Number.isInteger(c.tick)||c.tick>s.tick)return false;
  return !x.blood.studied.includes('B1')||x.blood.contacts.some(c=>c.outcome!=='failed');
 }catch{return false;}
}
