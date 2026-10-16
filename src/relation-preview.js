import {previewResonance,submitResonance} from './resonance-model.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const relationRecordNote='基础有向压制与静态冲突是关系记录；实时偏移会影响实际压制和逐鬼复苏，请结合当前状态与行动预览判断。';
export const eyeUsageScope='鬼眼V6分层费用以所选已解锁技能预检为准；普通练习另计。';
export function relationPreviewMarkup(p,title){
 const delta=n=>(n>=0?'+':'')+Number(n.toFixed(4));
 return '<h3>'+esc(title)+' · 实际结算预览</h3><p>身体变化 '+p.life+'；能量变化 '+p.energy+'；世界时间 '+delta(p.time)+'；行动节点 '+delta(p.ticks)+'</p><p>可用符膜 '+p.barrierBefore+' → '+p.barrierAfter+'（消耗 '+(p.barrierBefore-p.barrierAfter)+'）</p><table class="cost-table"><thead><tr><th>厉鬼</th><th>复苏变化</th><th>负荷变化</th></tr></thead><tbody>'+p.ghosts.map(g=>'<tr><td>'+esc(g.name)+'</td><td>'+g.revivalBefore+' → '+g.revivalAfter+'（'+delta(g.revivalDelta)+'）</td><td>'+g.burdenBefore+' → '+g.burdenAfter+'</td></tr>').join('')+'</tbody></table><p>有效负荷／容量 '+p.burdenBefore+'/'+p.capacityBefore+' → '+p.burdenAfter+'/'+p.capacityAfter+'；持久负荷 '+p.persistentLoadBefore+' → '+p.persistentLoadAfter+'</p><p>'+(p.action==='balance:medium'?'制衡不会回退历史复苏或持久负荷；本次仍按当前环境结算已持有厉鬼。':'包含当前环境与公共逐鬼结算；观察不保证永久安全。')+'确认前不会扣资源，取消不会推进时间。</p><p role="status"></p><button data-confirm>确认执行并保存</button><button data-cancel>取消</button>';
}
// Both the existing graph observation and manual balance use this same flow.
export function openRelationPreview({storage,action,title,onCommitted,onUnavailable,document:doc=globalThis.document,className='live-confirm'}){
 const preview=previewResonance(storage,action);if(!preview.ok){onUnavailable?.(preview);return null;}
 const dialog=doc.createElement('dialog');dialog.className=className;dialog.setAttribute('aria-label',title+' · 实际结算预览');dialog.innerHTML=relationPreviewMarkup(preview,title);doc.body.append(dialog);
 const dispose=()=>dialog.remove();dialog.querySelector('[data-cancel]').onclick=dispose;dialog.addEventListener('cancel',dispose);
 dialog.querySelector('[data-confirm]').onclick=()=>{const result=submitResonance(storage,preview);if(!result.committed){dialog.querySelector('[role="status"]').textContent=({STALE:'存档已变化，本次未执行。取消后重新预览。',STORAGE_FAILED:'保存失败，未提交本次行动。',NO_ACTION:'当前行动不合法，本次未执行。'})[result.reason]||'本次未提交，原进度保留。';dialog.querySelector('[data-confirm]').disabled=true;return;}dispose();onCommitted?.(result.state);};
 dialog.showModal();return dialog;
}
