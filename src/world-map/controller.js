import {initialState,reduce,selectedRecord,visible,filtered,pageSize} from './model.js';import {cities} from './fixture.js';import {view} from './components.js';
export function mountMap(root,{onOpen=()=>{},onRender=()=>{}}={}){
 let state=initialState(),drag=null,restoreFocus=null,lastSelection=null;
 const focusSelector=()=>{const e=document.activeElement;if(!root.contains(e))return null;for(const key of ['name','data-city','data-dungeon','data-action','data-nav'])if(e.hasAttribute(key))return `[${key}="${CSS.escape(e.getAttribute(key))}"]`;return e.classList.contains('map-viewport')?'.map-viewport':null;};
 function sizeWorld(){const viewport=root.querySelector('.map-viewport'),world=root.querySelector('.map-world');if(!viewport||!world)return;const w=Math.min(viewport.clientWidth,viewport.clientHeight*754/412),h=w*412/754;world.style.width=w+'px';world.style.height=h+'px';world.style.left=(viewport.clientWidth-w)/2+'px';world.style.top=(viewport.clientHeight-h)/2+'px';}
 const observer=new ResizeObserver(()=>sizeWorld());observer.observe(root);
 function render(){const selector=focusSelector(),cursor=document.activeElement?.selectionStart,detailScroll=root.querySelector('.detail-information')?.scrollTop||0;root.innerHTML=view(state);onRender(root);sizeWorld();if(lastSelection===state.selected){const info=root.querySelector('.detail-information');if(info)info.scrollTop=detailScroll;}lastSelection=state.selected;if(state.modal){root.querySelector('main').inert=true;root.querySelector('aside').inert=true;root.querySelector('dialog button').focus();}else if(restoreFocus){root.querySelector(restoreFocus)?.focus({preventScroll:true});restoreFocus=null;}else if(selector){const e=root.querySelector(selector);e?.focus({preventScroll:true});if(e?.tagName==='INPUT'&&Number.isInteger(cursor))e.setSelectionRange(cursor,cursor);} }
 function dispatch(action){if(['INFO','ARCHIVE'].includes(action.type))restoreFocus=focusSelector();const before=state.lastEvent;state=reduce(state,action);render();if(state.lastEvent!==before){const event=structuredClone(state.lastEvent);root.dispatchEvent(new CustomEvent('map:open-request',{detail:event,bubbles:true}));onOpen(event);}}
 root.addEventListener('click',e=>{const b=e.target.closest('button,[data-action]');if(!b||!root.contains(b)||b.disabled)return;
  if(b.dataset.city){dispatch({type:'CITY',id:b.dataset.city});return;}
  if(b.dataset.dungeon){dispatch({type:'SELECT',id:b.dataset.dungeon});if(matchMedia('(max-width:767px)').matches)root.querySelector('.detail')?.scrollIntoView({block:'start',behavior:'auto'});return;}
  if(b.dataset.nav){dispatch({type:'NAV',name:b.dataset.nav});return;}
  const action=b.dataset.action;
  const actions={'zoom-in':{type:'ZOOM',delta:.2},'zoom-out':{type:'ZOOM',delta:-.2},'reset-map':{type:'RESET_MAP'},'prev':{type:'PAGE',delta:-1},'next':{type:'PAGE',delta:1},'clear-search':{type:'FILTER',key:'query',value:''},'reset-filters':{type:'RESET_FILTERS'},'info':{type:'INFO'},'archive':{type:'ARCHIVE',index:Number(b.dataset.archiveIndex)},'enter':{type:'ENTER'},'close':{type:'CLOSE'}};
  if(actions[action])dispatch(actions[action]);
  if(action==='switch-city'){root.querySelector(`[data-city="${state.city}"]`)?.focus();state={...state,notice:'请选择地图据点或下方城市标签。'};root.querySelector('.feedback').textContent=state.notice;}
  if(action==='help'){state={...state,notice:'拖动地图平移；＋/−缩放；Home复位。Tab进入控件，方向键切换城市/卡牌，Enter选择，Esc关闭情报。'};root.querySelector('.feedback').textContent=state.notice;}
 });
 root.addEventListener('input',e=>{if(e.target.name==='query')dispatch({type:'FILTER',key:'query',value:e.target.value});});
 root.addEventListener('change',e=>{if(e.target.name==='pageSize'){dispatch({type:'PAGE_SIZE',value:e.target.value});return;}if(e.target.matches('select[name]'))dispatch({type:'FILTER',key:e.target.name,value:e.target.value});});
 function transform(){const world=root.querySelector('.map-world');if(world)world.style.transform=`translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;}
 root.addEventListener('pointerdown',e=>{if(e.button!==0||!e.target.closest('.map-viewport')||e.target.closest('button'))return;const v=root.querySelector('.map-viewport');drag={x:e.clientX,y:e.clientY,px:state.panX,py:state.panY};v.setPointerCapture(e.pointerId);v.classList.add('dragging');});
 root.addEventListener('pointermove',e=>{if(!drag)return;state=reduce(state,{type:'PAN',x:drag.px+e.clientX-drag.x,y:drag.py+e.clientY-drag.y});transform();});
 const endDrag=()=>{drag=null;root.querySelector('.map-viewport')?.classList.remove('dragging');};root.addEventListener('pointerup',endDrag);root.addEventListener('pointercancel',endDrag);
 root.addEventListener('wheel',e=>{if(!e.target.closest('.map-viewport')||!e.ctrlKey)return;e.preventDefault();dispatch({type:'ZOOM',delta:e.deltaY<0?.1:-.1});},{passive:false});
 root.addEventListener('keydown',e=>{
  if(state.modal){if(e.key==='Escape'){e.preventDefault();dispatch({type:'CLOSE'});}if(e.key==='Tab'){const elements=[...root.querySelectorAll('dialog button')];e.preventDefault();elements[0]?.focus();}return;}
  const city=e.target.closest('[data-city]'),card=e.target.closest('[data-dungeon]');
  if(city&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();let index=cities.findIndex(c=>c.id===city.dataset.city);const next=cities[(index+(['ArrowRight','ArrowDown'].includes(e.key)?1:cities.length-1))%cities.length];dispatch({type:'CITY',id:next.id});root.querySelector(`[data-city="${next.id}"]`)?.focus();return;}
  if(card&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const all=filtered(state);const index=all.findIndex(r=>r.id===card.dataset.dungeon);const next=all[Math.max(0,Math.min(all.length-1,index+(e.key==='ArrowRight'?1:-1)))];if(next){state={...state,page:Math.floor(all.indexOf(next)/pageSize(state))};dispatch({type:'SELECT',id:next.id});root.querySelector(`[data-dungeon="${next.id}"]`)?.focus();}return;}
  if(e.target.classList.contains('map-viewport')){const delta={'ArrowLeft':[-30,0],'ArrowRight':[30,0],'ArrowUp':[0,-30],'ArrowDown':[0,30]};if(delta[e.key]){e.preventDefault();state=reduce(state,{type:'PAN',x:state.panX+delta[e.key][0],y:state.panY+delta[e.key][1]});transform();}if(['+','=','-','Home'].includes(e.key)){e.preventDefault();dispatch(e.key==='Home'?{type:'RESET_MAP'}:{type:'ZOOM',delta:e.key==='-'?-.2:.2});}}
 });
 render();return {getState:()=>structuredClone(state),dispatch,destroy(){observer.disconnect();}};
}
