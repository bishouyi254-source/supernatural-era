import {g1cLabel,g1cCost} from './g1c-production.js';
import {g1cSceneConsequences} from './g1c-consequences.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function g1cView(s,legal){
 return g1cConsequenceView(s)+g1cGrowthView(s,legal);
}
export function g1cConsequenceView(s){
 const unresolved=g1cSceneConsequences(s);
 return unresolved.length?`<section aria-label="G1-C场景后果"><h3>未解决的失控后果（隔离候选）</h3><p>处置剧情尚未授权；重返对应场景关闭。休息、重载与切换不会结清此账本。</p>${unresolved.map(e=>`<p>${esc(e.kind)} · ${esc(e.eventId??'旧记录位置未知')} · ${esc(e.region??'作用区未知')} · ${esc(e.state)} · ${esc(e.encounterId??'遭遇未知')}</p>`).join('')}</section>`:'';
}
function g1cGrowthView(s,legal){
 if(!s.g1c)return '';
 return `<section aria-label="G1-C实证开发"><h3>G1-C · 独立实证成长（隔离候选）</h3><p role="note">获取路线锁定；鬼火焚烧、鬼风侵扰和鬼压人目标判定均须真实资格。</p>${[['fire','009 鬼火','F'],['wind','010 鬼风','W'],['press','011 鬼压人','P']].filter(([k])=>s.g1c[k].actorId).map(([k,name,p])=>{const v=s.g1c[k];return `<details><summary>${name} · ${p}${v.stage}</summary><p>独立实证 ${v.evidence.length} 条 · 负荷 ${v.load} · 控制状态 ${esc(v.state)} · ${p}3锁定。</p>${v.evidence.slice(-8).map(e=>`<p>行动${e.tick}：${esc(e.type)}</p>`).join('')}${legal.filter(a=>a.startsWith('g1cp:'+k+':research:')).map(a=>`<details><summary>${esc(g1cLabel(a))} · 预览</summary><p>${esc(g1cCost(a))}</p><button data-action="${esc(a)}">确认研究</button></details>`).join('')}</details>`;}).join('')}</section>`;
}
