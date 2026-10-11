import {mountCodex} from './controller.js';
import {gameRecords,SAVE_KEY,savePreference,loadPreferences,readGameArchive} from './live-adapter.js';
import {validate,upgrade} from '../engine.js';
export function mountLive(root,{getState,storage=localStorage,navigate=()=>{},close=()=>{}}){
 const adapter={list:()=>gameRecords(getState()),action(id,action){
  const s=getState(),row=gameRecords(s).find(r=>r.id===id);
  if(!s)return {title:'尚未载入游戏存档',text:'返回游戏建立角色或使用已有导入流程。图鉴不会创建角色或覆盖存档。'};
  if(!row?.discovered)return {title:'未知档案',text:'尚无可用情报，不能定位、标记或指定目标。'};
  if(action==='查看地图')return {title:'来源与地图关联',text:row.location+'。地图查看不会传送、进入事件或推进时间。',go:()=>navigate('地图'),goLabel:'打开当前游戏地图'};
  if(action==='前往驾驭界面')return {title:'驾驭与持有分开',text:'图鉴记录不代表持有。将打开现有驾驭页面；获取与植入仍需完成现场调查并满足原有条件。',go:()=>navigate('技能工坊'),goLabel:'打开驾驭页面'};
  if(action==='查看关联')return {title:'已有记录关联',text:[row.source,...row.clues,...row.encounters,...s.spirits.filter(g=>g.sourceId===row.eventId).map(g=>'同源持有实例：'+g.id+' · '+g.name),'同源不等于正史源头归属，未取得的关联保持未知。'].join('\n')};
  if(action==='标记记录')return {title:'私人档案笔记',text:'笔记不会成为调查证据或改变规律验证。',value:String(loadPreferences(storage,s).notes[id]||''),save:value=>savePreference(storage,getState(),id,'note',value)};
  if(action==='设为最终目标')return {title:'设为最终目标',text:'仅保存为你的调查关注目标。不会创建任务、奖励、获取资格或解锁地图。',go:()=>{savePreference(storage,getState(),id,'target');status();return '关注目标已保存';},goLabel:'保存关注目标'};
  return {title:'功能尚未接入',text:'当前没有对应业务操作。'};
 }};
 const view=mountCodex(root,{adapter,mode:'live'});
 root.querySelector('.cx-host>strong').textContent=getState()?.name||'尚未载入角色';
 root.querySelector('.cx-host>span').textContent='当前游戏档案 · 玩家已获情报';
 root.querySelector('.cx-demo-flag').textContent='真实存档 · 档案与持有分离';
 root.querySelector('.cx-page-note').innerHTML='从当前游戏读取已有调查情报。<span role="status" id="cx-live-status"></span>';
 function status(){const s=getState();const target=s&&loadPreferences(storage,s).target;const row=adapter.list().find(r=>r.id===target&&r.discovered);root.querySelector('#cx-live-status').textContent=row?' 关注目标：'+(row.name==='未知档案'?row.id:row.name):' 未设调查关注目标';}
 status();
 const nav=root.querySelector('.cx-sidebar nav');for(const [index,page] of [[0,'技能工坊'],[1,'背包与装备'],[3,'双鬼结构'],[4,'灵异档案']]){const old=nav.children[index],b=document.createElement('button');b.innerHTML=old.innerHTML;b.addEventListener('click',()=>navigate(page));old.replaceWith(b);}
 const back=document.createElement('button');back.textContent='返回游戏';back.addEventListener('click',close);root.querySelector('.cx-sidebar-foot').prepend(back);
 const mobileBack=back.cloneNode(true);mobileBack.className='cx-live-back';mobileBack.addEventListener('click',close);root.querySelector('.cx-header').append(mobileBack);
 root.querySelector('.cx-brand').href='index.html';root.querySelector('.cx-brand').addEventListener('click',e=>{e.preventDefault();close();});
 return {refresh(){view.refresh();root.querySelector('.cx-host>strong').textContent=getState()?.name||'尚未载入角色';status();},destroy:()=>view.destroy()};
}
export function installGameCodex({getState,navigate}){
 let host=null,view=null,previous=null;
 const link=document.createElement('link');link.rel='stylesheet';link.href='src/codex/launcher.css';document.head.append(link);
 const font=document.createElement('style');font.textContent="@font-face{font-family:CodexBrush;src:url('assets/fonts/MaShanZheng-Regular.ttf')}";document.head.append(font);
 const launcher=document.createElement('button');launcher.id='game-codex-launcher';launcher.textContent='厉鬼图鉴';launcher.setAttribute('aria-label','打开厉鬼图鉴');document.body.append(launcher);
 document.addEventListener('click',e=>{const b=e.target.closest('button[data-scroll-target="spirit-detail"]');if(b&&b.textContent.trim()==='厉鬼图鉴'){e.preventDefault();e.stopImmediatePropagation();launcher.click();}},true);
 const close=()=>{view?.destroy();host?.remove();host=null;view=null;document.querySelector('#app')?.removeAttribute('inert');launcher.removeAttribute('inert');document.body.style.overflow=previous??'';launcher.focus();};
 launcher.addEventListener('click',()=>{if(host)return;previous=document.body.style.overflow;document.body.style.overflow='hidden';document.querySelector('#app')?.setAttribute('inert','');host=document.createElement('div');host.id='game-codex-overlay';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','厉鬼图鉴');launcher.setAttribute('inert','');document.body.append(host);const shadow=host.attachShadow({mode:'open'});shadow.innerHTML='<link rel="stylesheet" href="src/codex/codex.css"><style>:host{--paper:#eeeae4;--muted:#b5bdc7;--red:#a91422;--ink:#08090b;color:#eeeae4;font:15px/1.5 "Microsoft YaHei",sans-serif;color-scheme:dark}</style><div id="codex-root"></div>';view=mountLive(shadow.querySelector('#codex-root'),{getState,close,navigate:page=>{close();navigate(page);}});shadow.querySelector('input').focus();shadow.addEventListener('keydown',e=>{if(e.key==='Escape'&&!shadow.querySelector('dialog').open)close();});});
 return {refresh(){launcher.hidden=!getState();view?.refresh();}};
}
// Separate live entry reads the same origin's save; never migrates/writes it on open.
export function startStandalone(root){
 let state=null,loadError='';
 function read(){const result=readGameArchive(localStorage,validate,upgrade);state=result.state;loadError=result.message;}
 read();
 const view=mountLive(root,{getState:()=>state,close:()=>location.assign('index.html'),navigate:page=>location.assign('index.html#codex-route='+encodeURIComponent(page))});
 function showReadState(){if(loadError){root.querySelector('#cx-live-status').textContent=loadError;root.querySelector('.cx-demo-flag').textContent='未载入有效存档';}else root.querySelector('.cx-demo-flag').textContent='真实存档 · 档案与持有分离';}
 showReadState();
 const refresh=document.createElement('button');refresh.textContent='重新读取游戏档案';refresh.addEventListener('click',()=>{read();view.refresh();showReadState();});root.querySelector('.cx-header').append(refresh);
 window.addEventListener('storage',e=>{if(e.key===SAVE_KEY){read();view.refresh();showReadState();}});
}
