export function installWorldMap({getState,navigate}){
 let host=null,frame=null,previous='',returnFocus=null;
 function close(){if(!host||host.hidden)return;host.hidden=true;document.getElementById('app').removeAttribute('inert');document.body.style.overflow=previous;returnFocus?.focus({preventScroll:true});}
 function open(){if(host&&!host.hidden)return;returnFocus=document.activeElement;previous=document.body.style.overflow;document.body.style.overflow='hidden';document.getElementById('app').setAttribute('inert','');
 if(!host){host=document.createElement('div');host.id='world-map-overlay';host.style.cssText='position:fixed;inset:0;z-index:220;background:#030408';host.setAttribute('role','dialog');host.setAttribute('aria-label','世界地图与副本选择');host.setAttribute('aria-modal','true');frame=document.createElement('iframe');frame.title='世界地图 · 当前游戏数据';frame.style.cssText='width:100%;height:100%;border:0';frame.src='world-map.html';host.append(frame);document.body.append(host);frame.addEventListener('load',()=>{frame.contentWindow.worldMapBridge={getState:()=>structuredClone(getState()),close,navigate:page=>{close();navigate(page);}};frame.contentWindow.worldMapLive?.refresh();});}
 host.hidden=false;frame.contentWindow.worldMapLive?.refresh();frame.focus();}
 document.addEventListener('click',e=>{const b=e.target.closest('button[data-tab="地图"]');if(b){e.preventDefault();e.stopImmediatePropagation();open();}},true);
 return{open,close};
}
