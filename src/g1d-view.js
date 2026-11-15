import {g1dLabel,g1dCost} from './g1d.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function g1dView(s,legal){
 if(!s.g1d)return '';
 return `<section aria-label="G1-D候选实证成长"><h3>G1-D · 隔离候选，编号未批准</h3><p>012鬼手／013鬼报纸／014鬼童为工程候选编号。普通获取锁定，正式来源与拼图绑定为0。鬼童为独立行动者，不占作体内持鬼。</p>${[['hand','鬼手','H'],['paper','鬼报纸','N'],['child','鬼童','T']].filter(([k])=>s.g1d[k].owned).map(([k,name,prefix])=>{const v=s.g1d[k];return `<details open><summary>${name} ${prefix}${v.stage}</summary><p>负荷 ${v.load} · ${esc(v.state)}${k==='child'?` · 独立复苏 ${v.revival}pp · 拼图 ${esc(v.puzzle?.id||'无')}`:''} · ${prefix}3锁定</p>${legal.filter(a=>a.startsWith(`g1dp:${k}:research:`)).map(a=>`<button data-action="${esc(a)}">${esc(g1dLabel(a))}</button><p>${esc(g1dCost(a))}</p>`).join('')}</details>`;}).join('')}${s.g1d.events.filter(e=>e.type==='lost-control').map(e=>`<p role="alert">${esc(e.kind)}：失控后果待处理，来源场景 ${esc(e.data.eventId)}。重载与休整不消除后果；重返遭遇锁定。</p>`).join('')}</section>`;
}
