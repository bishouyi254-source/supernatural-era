import {readLive,submitLive,SAVE_KEY} from './live-model.js';
import {LivePuzzleBackpack} from './live-ui.js';
export function mountLiveBackpack(root,{navigate,onRefresh=()=>{}}={}){
const lifecycle=new AbortController();let snapshot,ui;
try{snapshot=readLive(localStorage);}catch(e){root.innerHTML='<main class="no-save"><h1>存档未通过校验</h1><p>没有覆盖原始内容。请返回游戏导出原始存档，再检查。</p><a href="index.html">返回游戏</a></main>';throw e;}
ui=new LivePuzzleBackpack(root,{items:snapshot.items,onAction(e){
 if(e.type==='navigate'){if(navigate){navigate(e.payload.target);return;}const urls={'驾驭厉鬼':'index.html?view=workshop','物资背包':'index.html?view=supplies','档案记录':'index.html?view=history','厉鬼图鉴':'index.html?view=archives','同步共鸣':'index.html?view=workshop#relations'};location.href=urls[e.payload.target]||'index.html';return;}
 const result=submitLive(localStorage,e.payload.token,e.payload.id,e.type);
 const texts={STALE:'其他页面更新了存档，本次未执行。已刷新，请重新确认。',NO_ACTION:'当前行动已不可用，本次未结算。',STORAGE_FAILED:'保存失败，本次未提交，原存档保持不变。',INVALID:'存档校验失败，本次未提交。',NO_SAVE:'本服务尚无游戏存档，请先返回游戏创建或导入。'};
 refresh();const feedback=root.querySelector('.feedback');feedback.textContent=result.committed?`已保存真实行动：${result.action}；${snapshot.state.journal.at(-1)}`:texts[result.reason]||'本次未提交。';
 const li=document.createElement('li');li.textContent=feedback.textContent;root.querySelector('.event-log ol').prepend(li);root.querySelector('.log-count').textContent=root.querySelectorAll('.event-log li').length;
}});
function refresh(){try{snapshot=readLive(localStorage);const selected=ui.selected;ui.items=snapshot.items;ui.selected=selected;ui.snapshotToken=snapshot.token;ui.render();const host=root.querySelector('.host');if(host){host.querySelector('strong').textContent=snapshot.state?.name||'尚无角色';host.querySelector('span').textContent=snapshot.state?`能量 ${snapshot.state.energy}/3 · 时间 ${snapshot.state.tick}`:'返回游戏创建或导入';}onRefresh(snapshot.state);}catch{ui.setError('存档校验失败；本页停止提交。');ui.snapshotToken=null;}}
ui.snapshotToken=snapshot.token;root.querySelector('.demo-note').insertAdjacentHTML('beforeend',' <a href="index.html?view=supplies">物资背包</a> · <a href="index.html">返回原游戏 / 导入存档</a>');
refresh();window.addEventListener('storage',e=>{if(e.key===SAVE_KEY)refresh();},{signal:lifecycle.signal});window.addEventListener('pageshow',refresh,{signal:lifecycle.signal});
root.addEventListener('click',e=>{const link=e.target.closest('a[href]');if(!navigate||!link)return;const url=new URL(link.href);if(url.origin!==location.origin)return;e.preventDefault();navigate(url.searchParams.get('view')==='supplies'?'物资背包':'首页');},{signal:lifecycle.signal});
return {refresh,destroy(){lifecycle.abort();ui.destroy();}};
}
