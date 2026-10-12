import {workshopSidebar} from './rpg-workshop.js';
import {readResonance} from './resonance-model.js';
const pages=['厉鬼装配','拼图背包','厉鬼图鉴','同步共鸣','档案记录'];
let cachedToken=null,cachedMarkup='';
const routes=['技能工坊','拼图背包','厉鬼图鉴','同步共鸣','历史'];
export function mountPublishedSidebar(root,{active,navigate}){
 if(!root)return;const token=localStorage.getItem('supernatural-era.prototype.v2');if(!token)return;
 if(cachedToken!==token){const state=readResonance(localStorage).state;if(!state)return;const html=workshopSidebar(state);cachedMarkup=html.slice(html.indexOf('>')+1,html.lastIndexOf('</aside>'));cachedToken=token;}
 const scope=root.getRootNode(),doc=root.ownerDocument;
 if(!scope.querySelector('link[data-published-sidebar]')){const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('./published-sidebar.css',import.meta.url).href;link.dataset.publishedSidebar='';(scope===doc?doc.head:scope).append(link);}
 root.classList.add('published-sidebar');root.dataset.publishedSidebar='';
 if(root.__sidebarToken!==token){root.innerHTML=cachedMarkup;root.__sidebarToken=token;if(root.classList.contains('game-menu')){const anchor=doc.createElement('span');anchor.id='live-player-name';anchor.hidden=true;root.append(anchor);}}
 for(const img of root.querySelectorAll('img')){const src=img.getAttribute('src');if(src?.startsWith('assets/'))img.src=new URL('../'+src,import.meta.url).href;}
 root.querySelectorAll('.workshop-leftnav>button:not([data-published-page="地图探索"])').forEach((b,i)=>{b.classList.toggle('nav-selected',pages[i]===active);b.dataset.publishedPage=pages[i];if(pages[i]===active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 root.dataset.publishedActive=active;const omitMap=['厉鬼装配','拼图背包','厉鬼图鉴','同步共鸣'].includes(active);if(omitMap){root.querySelector('[data-published-page="地图探索"]')?.remove();}else{const mapButton=root.querySelector('[data-published-page="地图探索"]')||doc.createElement('button');mapButton.dataset.publishedPage='地图探索';mapButton.className=active==='地图探索'?'nav-selected':'';mapButton.innerHTML='<b>⌖</b><span>地图探索</span>';if(active==='地图探索')mapButton.setAttribute('aria-current','page');root.querySelector('.workshop-leftnav')?.prepend(mapButton);}
 if(doc.defaultView.innerWidth<768&&root.getClientRects().length)root.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});
 if(root.__publishedClick)return;root.__publishedClick=true;
 root.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||!root.contains(b))return;e.preventDefault();e.stopImmediatePropagation();if(b.dataset.publishedPage){if(b.dataset.publishedPage==='地图探索'){navigate('地图');return;}if(b.dataset.publishedPage===root.dataset.publishedActive)return;navigate(routes[pages.indexOf(b.dataset.publishedPage)]);return;}if(b.dataset.tab){navigate(b.dataset.tab);return;}if(b.dataset.command==='export'){try{await navigator.clipboard.writeText(localStorage.getItem('supernatural-era.prototype.v2')||'');b.textContent='已复制存档副本';}catch{b.textContent='请在角色页导出';navigate('角色');}}},{capture:true});
}
export function installPublishedSidebar({navigate}){
 const app=document.getElementById('app');let pending=false;
 function refresh(){for(const root of app.querySelectorAll('.game-nav,.workshop-sidebar'))mountPublishedSidebar(root,{active:root.classList.contains('game-nav')?'拼图背包':'厉鬼装配',navigate});}
 new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;if([...app.querySelectorAll('.game-nav,.workshop-sidebar')].some(root=>!root.hasAttribute('data-published-sidebar')))refresh();});}}).observe(app,{subtree:true,childList:true});refresh();return{refresh};
}
