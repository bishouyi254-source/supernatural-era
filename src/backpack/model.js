// Presentation model only. No engine, storage, save, or inferred rating rules.
export const GRADES = Object.freeze(['神灵异','S','A','B','C','D']);
export const GRADE_ASSETS = Object.freeze(['divine','s','a','b','c','d']);
export function gradeAsset(grade){return GRADE_ASSETS[GRADES.indexOf(grade)] || null;}
export function queryItems(items,{search='',grade='all',status='all',kind='all',origin='all',sort='grade'}={}){
 const q=search.trim().toLocaleLowerCase();
 return items.filter(x=>(!q||[x.name,...(x.keywords||[])].join(' ').toLocaleLowerCase().includes(q))&&(grade==='all'||x.visualGrade===grade)&&(status==='all'||status==='owned'&&x.owned||status==='equipped'&&x.equipped||status==='unequipped'&&x.owned&&!x.equipped)&&(kind==='all'||x.kind===kind)&&(origin==='all'||x.origin===origin)).sort((a,b)=>sort==='collection'?0:sort==='name'?a.name.localeCompare(b.name,'zh-CN'):GRADES.indexOf(a.visualGrade)-GRADES.indexOf(b.visualGrade)||a.name.localeCompare(b.name,'zh-CN'));
}
export function pageItems(items,page=1,pageSize=12){
 const pages=Math.max(1,Math.ceil(items.length/pageSize));const current=Math.max(1,Math.min(pages,page));
 return {items:items.slice((current-1)*pageSize,current*pageSize),page:current,pages,total:items.length};
}
export function validateItems(items){
 const ids=new Set();for(const x of items){if(!x.id||ids.has(x.id))throw new Error('实例 ID 必须唯一');ids.add(x.id);if(x.visualGrade!=null&&!GRADES.includes(x.visualGrade))throw new Error('不支持的视觉评级');if(x.equipped&&!x.owned)throw new Error('未持有实例不能标为装配');}return items;
}
// Fourth-step bridge: inject the existing engine functions. This function is not used by DEMO.
// No action business rules duplicated; supplied visualGrades are metadata, not save fields.
export function existingWorkshopSnapshot(state,{activeIds,available,label,visualGrades}){
 const active=new Set(activeIds(state)),legal=available(state);
 return state.spirits.map(g=>({id:g.id,name:g.name,owned:true,equipped:active.has(g.id),visualGrade:visualGrades[g.id]||null,development:g.development,revival:g.revivalProgress,burden:g.burden,actions:legal.filter(a=>['study:','practice:','v1:active:add:','v1:active:remove:'].some(p=>a===p+g.id)).map(id=>({id,label:label(id)}))}));
}



export function resolveExistingAction(item,type){const prefix={study:'study:',practice:'practice:',equip:'v1:active:add:',unequip:'v1:active:remove:'}[type];return prefix?item.actions?.find(a=>a.id===prefix+item.id)?.id||null:null;}
