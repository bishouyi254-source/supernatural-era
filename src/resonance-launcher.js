export function installResonance({refreshGame,navigate,onCommitted}){
 const button=document.createElement('button');button.id='game-resonance-launcher';button.textContent='同步共鸣';button.style.cssText='position:fixed;right:16px;bottom:138px;z-index:80;border:1px solid #f43b53;color:#fff;background:#260610;padding:10px 16px;font:16px Microsoft YaHei;min-height:44px';document.body.append(button);
 let overlay=null,frame=null,previous='';
 function close(){if(!overlay)return;overlay.hidden=true;document.querySelector('#app')?.removeAttribute('inert');document.body.style.overflow=previous;refreshGame();button.focus();}
 function open(){previous=document.body.style.overflow;document.body.style.overflow='hidden';document.querySelector('#app')?.setAttribute('inert','');if(!overlay){overlay=document.createElement('div');overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','同步共鸣');overlay.style.cssText='position:fixed;inset:0;z-index:200;background:#030408';frame=document.createElement('iframe');frame.title='同步共鸣 · 当前游戏数据';frame.style.cssText='width:100%;height:100%;border:0';frame.src='resonance/index.html';overlay.append(frame);document.body.append(overlay);frame.addEventListener('load',()=>{frame.contentWindow.resonanceBridge={close,navigate:p=>{close();navigate(p);},onCommitted};frame.contentWindow.resonanceLive?.refresh();});}overlay.hidden=false;frame.contentWindow.resonanceLive?.refresh();}
 button.onclick=open;
 document.addEventListener('click',e=>{const b=e.target.closest('button[data-scroll-target="relations"]');if(b&&b.textContent.trim()==='同步共鸣'){e.preventDefault();e.stopImmediatePropagation();open();}},true);
 return {open,close};
}
