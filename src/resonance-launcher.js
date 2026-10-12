import {mountPublishedSidebar} from './published-sidebar.js';
export function installResonance({refreshGame,navigate,onCommitted}){
 const button=document.createElement('button');button.id='game-resonance-launcher';button.textContent='同步共鸣';button.style.cssText='position:fixed;right:16px;bottom:138px;z-index:80;border:1px solid #f43b53;color:#fff;background:#260610;padding:10px 16px;font:16px Microsoft YaHei;min-height:44px';document.body.append(button);
 let overlay=null,frame=null,previous='',ready=null,lastSnapshot=null,loading=null;
 function close({render=true}={}){if(!overlay||overlay.hidden)return;overlay.hidden=true;document.body.removeAttribute('data-system-panel');document.querySelector('#app')?.removeAttribute('inert');document.body.style.overflow=previous;if(render)refreshGame();button.focus();}
 function refresh(){const raw=localStorage.getItem('supernatural-era.prototype.v2');if(raw!==lastSnapshot){frame.contentWindow.resonanceLive?.refresh();lastSnapshot=raw;}mountPublishedSidebar(frame.contentDocument.querySelector('.game-menu'),{active:'同步共鸣',navigate:p=>{close({render:false});navigate(p);}});}
 function preload(){if(ready)return ready;
 overlay=document.createElement('div');overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','同步共鸣');overlay.style.cssText='position:fixed;inset:0;z-index:200;background:#030408';
 loading=document.createElement('p');loading.setAttribute('role','status');loading.textContent='正在准备共鸣图谱…';loading.style.cssText='position:absolute;inset:45% 0 auto;text-align:center;color:#eeeae4;font:18px Microsoft YaHei';
 frame=document.createElement('iframe');frame.title='同步共鸣 · 当前游戏数据';frame.style.cssText='width:100%;height:100%;border:0;visibility:hidden';overlay.append(loading,frame);document.body.append(overlay);
 ready=new Promise(resolve=>frame.addEventListener('load',()=>{frame.contentWindow.resonanceBridge={close,navigate:p=>{close({render:false});navigate(p);},onCommitted};refresh();loading.hidden=true;frame.style.visibility='visible';resolve();},{once:true}));frame.src='resonance/index.html';return ready;
 }
 async function open(){if(overlay&&!overlay.hidden)return;previous=document.body.style.overflow;document.body.style.overflow='hidden';document.body.dataset.systemPanel='resonance';document.querySelector('#app')?.setAttribute('inert','');const loaded=preload();overlay.hidden=false;await loaded;if(overlay.hidden)return;refresh();frame.focus();}
 button.onclick=open;
 document.addEventListener('click',e=>{const b=e.target.closest('button[data-scroll-target="relations"]');if(b&&b.textContent.trim()==='同步共鸣'){e.preventDefault();e.stopImmediatePropagation();open();}},true);
 return {open,close,preload};
}
