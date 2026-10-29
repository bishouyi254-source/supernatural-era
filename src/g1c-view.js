import {g1cLabel,g1cCost} from './g1c-production.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function g1cView(s,legal){
 if(!s.g1c)return '';
 return `<section aria-label="G1-C实证开发"><h3>G1-C · 独立实证成长（隔离候选）</h3><p role="note">获取路线锁定；鬼火焚烧、鬼风侵扰和鬼压人目标判定均须真实资格。</p>${[['fire','009 鬼火','F'],['wind','010 鬼风','W'],['press','011 鬼压人','P']].filter(([k])=>s.g1c[k].actorId).map(([k,name,p])=>{const v=s.g1c[k];return `<details><summary>${name} · ${p}${v.stage}</summary><p>独立实证 ${v.evidence.length} 条 · 负荷 ${v.load} · 控制状态 ${esc(v.state)} · ${p}3锁定。</p>${v.evidence.slice(-8).map(e=>`<p>行动${e.tick}：${esc(e.type)}</p>`).join('')}${legal.filter(a=>a.startsWith('g1cp:'+k+':research:')).map(a=>`<details><summary>${esc(g1cLabel(a))} · 预览</summary><p>${esc(g1cCost(a))}</p><button data-action="${esc(a)}">确认研究</button></details>`).join('')}</details>`;}).join('')}</section>`;
}
