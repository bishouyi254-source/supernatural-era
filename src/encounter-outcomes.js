// Stable presentation codes derived from authoritative facts. Legacy prose is
// interpreted only at this compatibility boundary, never as an unlock rule.
export const RESULT_CODES=Object.freeze({SUPPRESSED:'suppressed',SEALED:'sealed',CONTROLLED:'controlled',OBJECTIVE:'objective',ESCAPED:'escaped',FAILED:'failed'});
export const RESULT_LABELS=Object.freeze({suppressed:'有效压制',sealed:'已封存',controlled:'驾驭成功',objective:'事件目标完成',escaped:'已撤离',failed:'挑战失败'});
const legacy=Object.freeze({'已封存':'sealed','封存':'sealed','紧急封存':'sealed','已驾驭':'controlled','已结合':'controlled','援助联系':'objective','已完成':'objective','有效压制':'suppressed','撤离':'escaped','已撤离':'escaped','失败':'failed'});
export function normalizeResult(value){return Object.hasOwn(RESULT_LABELS,value)?value:legacy[value]||null;}
export function recordedResult(s,id){const record=s?.settlement?.records?.filter(r=>r.eventId===id).at(-1);return normalizeResult(record?.resultCode||record?.outcome);}
export function genericResult(s,id){
 if(!s)return null;
 if(s.systems?.death==='committed'&&s.scene===id)return RESULT_CODES.FAILED;
 if(s.scene===id&&s.phase==='限制'&&s.restricted?.[id])return RESULT_CODES.SUPPRESSED;
 if(s.systems?.sealed?.includes(id))return RESULT_CODES.SEALED;
 if(s.spirits?.some(g=>g.sourceId===id))return RESULT_CODES.CONTROLLED;
 const fate=s.fate?.[id];
 if(fate?.result==='success')return {seal:'sealed',capture:'controlled',aid:'objective'}[fate.action]||null;
 const old=normalizeResult(s.outcomes?.[id]);if(old)return old;
 const recorded=recordedResult(s,id);if(recorded)return recorded;
 return null; // Missing old withdrawal history is not reconstructed from prose.
}
