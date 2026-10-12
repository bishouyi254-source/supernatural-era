import {mountMap} from './controller.js';import {setRecords} from './fixture.js';import {liveRecords,openTarget} from './live-adapter.js';
let root=document.getElementById('map-demo'),view=null;
function refresh(){const bridge=window.worldMapBridge,s=bridge?.getState()||null;view?.destroy();const replacement=root.cloneNode(false);root.replaceWith(replacement);root=replacement;setRecords(liveRecords(s));view=mountMap(root,{onOpen:event=>{const target=openTarget(bridge?.getState(),event.dungeon);if(target)bridge.navigate(target);else refresh();}});
root.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='back'){if(bridge)bridge.close();else location.href='index.html';}if(action==='legacy'){if(bridge)bridge.navigate('地图');else location.href='index.html';}});
}
window.worldMapLive={refresh};refresh();
document.addEventListener('keydown',e=>{if(e.defaultPrevented||root.querySelector('dialog'))return;if(e.key==='Escape'){e.preventDefault();window.worldMapBridge?.close();}if(e.key==='Tab'){const items=[...root.querySelectorAll('button:not(:disabled),input,select,[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
