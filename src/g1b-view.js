import {g1bLabel,g1bCost,g1bRisk} from './g1b-production.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function g1bView(s,legal){
 if(!s.g1b)return '';
 return `<section aria-label="G1-B专属开发"><p role="note">${esc(g1bRisk(s))}</p>${[['tablet','006 灵位鬼','L'],['caller','007 喊人鬼','H'],['smoke','008 鬼烟','Y']].filter(([k])=>s.g1b[k].actorId).map(([k,name,prefix])=>{const v=s.g1b[k];return `<details><summary>${name} · ${prefix}${v.stage}</summary><p>本鬼实证 ${v.evidence.length} 条，专属持久负荷 ${v.load}；${prefix}3拼图锁定。</p>${k==='smoke'?'<p>Y1只识别与预览边界；Y2才允许实际扩张第二个相邻区。已发生侵蚀不因收拢消失。</p>':''}${v.evidence.slice(-10).map(e=>`<p>行动${e.tick} · ${esc(e.type)}</p>`).join('')}${legal.filter(a=>a.startsWith('g1bp:'+k+':research:')).map(a=>`<details><summary>${esc(g1bLabel(a))} · 预览</summary><p>${esc(g1bCost(a))}</p><button data-action="${esc(a)}">确认研究</button></details>`).join('')}</details>`;}).join('')}</section>`;
}
