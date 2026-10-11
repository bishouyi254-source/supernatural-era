// A bounded receipt of committed engine facts. No prose generator changes state.
export function actionReceipt(before, after, action) {
  // Some adapters trim their journal during settlement. Match the retained prefix
  // rather than treating array length as an append-only cursor.
  const previous=before.journal, current=after.journal;
  let shared=0;
  for(let n=Math.min(previous.length,current.length);n>0;n--) {
    if(previous.slice(-n).every((line,i)=>line===current[i])){shared=n;break;}
  }
  const facts=current.slice(shared);
  let discoveries;
  const caseKey=action.startsWith('inv:')?'investigation':action.startsWith('school:')?'school':null;
  if(caseKey)discoveries=after[caseKey].evidence.filter(e=>!before[caseKey].evidence.some(old=>old.id===e.id)).map(e=>e.title);
  const changes = [];
  for (const [key, title] of [['life','身体'],['energy','行动能量'],['bags','隔离袋']]) {
    if (before[key] !== after[key]) changes.push(`${title}：${before[key]} → ${after[key]}`);
  }
  if (before.systems.items.barrier !== after.systems.items.barrier)
    changes.push(`防护符膜：${before.systems.items.barrier} → ${after.systems.items.barrier}`);
  for (const ghost of after.spirits) {
    const old = before.spirits.find(g => g.id === ghost.id);
    if (!old) changes.push(`新增驾驭：${ghost.name}；负荷 ${ghost.burden}；复苏 ${ghost.revivalProgress.toFixed(2)}%`);
    else {
      if (old.revivalProgress !== ghost.revivalProgress) changes.push(`${ghost.name}复苏：${old.revivalProgress.toFixed(2)}% → ${ghost.revivalProgress.toFixed(2)}%`);
      if (old.burden !== ghost.burden) changes.push(`${ghost.name}负荷：${old.burden} → ${ghost.burden}`);
    }
  }
  for (const old of before.spirits) if (!after.spirits.some(g=>g.id===old.id)) changes.push(`已不再驾驭：${old.name}；相关历史保留`);
  if (before.systems.death !== after.systems.death) changes.push('生存状态发生变化，请处理当前反应窗口或查看结局。');
  return {format:1, action, tick:after.tick, legal:true, facts:facts.slice(-16), changes:changes.slice(0,32),...(discoveries?{discoveries}: {})};
}
export function validReceipt(s) {
  const r=s.actionReceipt;
  if(r===undefined)return true; // Old saves are not assigned invented actions.
  return !!r && r.format===1 && r.legal===true && typeof r.action==='string' && r.action.length<=200 &&
    Number.isInteger(r.tick)&&r.tick>=0&&r.tick<=s.tick &&
    ['facts','changes'].every(k=>Array.isArray(r[k])&&r[k].length<=(k==='facts'?16:32)&&r[k].every(v=>typeof v==='string'&&v.length<=2000))&&
    (r.discoveries===undefined||Array.isArray(r.discoveries)&&r.discoveries.length<=32&&r.discoveries.every(t=>typeof t==='string'&&t.length<=2000));
}
