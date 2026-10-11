import {projectRecord,selectRecords,RATINGS,STATES} from './model.js';
import {icon,card,detail,escapeHtml} from './components.js';
// Public mount interface. adapter.list() supplies an evidence-scoped view, never save/world objects.
export function mountCodex(root,{adapter,mode='demo'}={}){
 if(!adapter?.list)throw new TypeError('A read-only evidence adapter is required');
 const mobile=matchMedia('(max-width: 760px)');
 let records=adapter.list().map(projectRecord),ui={query:'',state:'全部',rating:'全部',sort:'archive',page:1,pageSize:mobile.matches?6:15},selected=null,tab=0;
 root.innerHTML=`<div class="cx-app"><aside class="cx-sidebar"><a class="cx-brand" href="codex-demo.html"><img src="assets/codex/shared/grade-divine.png" alt=""><span>神秘复苏<small>灵异时代 · 档案调查</small></span></a><div class="cx-host"><img src="assets/codex/shared/host.png" alt="沿用背包页面的演示角色插画"><strong>图鉴组件演示</strong><span>独立 DEMO · 未接入存档</span></div><nav aria-label="图鉴导航"><span><img src="assets/codex/shared/nav-equip.png" alt="">驾驭厉鬼</span><span><img src="assets/codex/shared/nav-bag.png" alt="">拼图背包</span><a href="#catalog" aria-current="page"><img src="assets/codex/shared/nav-book.png" alt="">厉鬼图鉴</a><span><img src="assets/codex/shared/nav-sync.png" alt="">同步共鸣</span><span><img src="assets/codex/shared/nav-record.png" alt="">档案记录</span></nav><div class="cx-sidebar-foot"><p>人死不灭<br>厉鬼可用</p></div></aside><main class="cx-main" id="catalog"><header class="cx-header"><div><h1>厉鬼图鉴</h1><p>已发现档案与灵异规律记录</p></div><span class="cx-demo-flag">${mode==='demo'?'组件演示 · 独立 DEMO':'只读档案'}</span></header><p class="cx-page-note">${mode==='demo'?'记录档案、调查证据与遭遇线索。图鉴与持有拼图分开管理；当前演示不读写正式存档。':'读取当前游戏已有的玩家情报；私人笔记与关注目标不改变证据、进度或持有资产。'}</p><div class="cx-content"><section class="cx-library cx-panel" aria-label="档案列表"><div class="cx-search-row"><div class="cx-search">${icon('search')}<input type="search" aria-label="搜索档案" placeholder="搜索档案名称、情报、来源…" autocomplete="off"></div><label class="cx-sort">排序<select aria-label="排序方式"><option value="archive">档案编号</option><option value="rating">评级优先</option><option value="progress">完整度优先</option></select></label></div><div class="cx-filters"><div class="cx-filter-row" aria-label="状态筛选">${STATES.map(v=>`<button data-state="${v}" aria-pressed="${v==='全部'}">${v}</button>`).join('')}</div><div class="cx-filter-row cx-rating-row" aria-label="评级筛选">${['全部',...RATINGS].map(v=>`<button data-rating="${v}" aria-pressed="${v==='全部'}">${v==='全部'?'全部':`<img src="assets/codex/shared/grade-${v==='神灵异'?'divine':v.toLowerCase()}.png" alt="">${v}`}</button>`).join('')}</div></div><div class="cx-list-heading"><span>方向键移动焦点，Enter / 空格选中档案。</span><span id="cx-count" role="status" aria-live="polite"></span></div><div id="cx-grid" class="cx-grid"></div><footer class="cx-list-footer"><span id="cx-summary"></span><nav id="cx-pagination" aria-label="档案分页"></nav></footer><p class="cx-library-note">未知评级不参与六档筛选；高危为独立风险标签。</p></section><div id="cx-detail-host"></div></div></main><dialog class="cx-dialog" aria-labelledby="cx-dialog-title"><h2 id="cx-dialog-title"></h2><p>这是第三步按钮组件预览。真实地图、记录、驾驭和目标业务将在第四步接入；本次点击不会更改正式存档或创建任务。</p><button data-close-dialog>关闭预览</button></dialog></div>`;
 const grid=root.querySelector('#cx-grid'),host=root.querySelector('#cx-detail-host');
 function render(){
   const result=selectRecords(records,ui);ui.page=result.page;
   if(!result.items.some(r=>r.id===selected)){selected=result.items[0]?.id??null;tab=0;}
   root.querySelectorAll('[data-state]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.state===ui.state)));
   root.querySelectorAll('[data-rating]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rating===ui.rating)));
   root.querySelector('#cx-count').textContent=result.total+' 条匹配档案';
   grid.innerHTML=result.items.length ? result.items.map(r=>card(r,r.id===selected)).join('') : `<div class="cx-empty">${icon('search')}<h2>没有匹配的档案</h2><p>试试其他关键词，或清除当前筛选。</p><button data-reset>清除筛选</button></div>`;
   root.querySelector('#cx-summary').textContent='已发现 '+records.filter(r=>r.discovered).length+' / '+records.length+(mode==='demo'?' · 演示档案':'');
   root.querySelector('#cx-pagination').innerHTML=`<button data-page="${result.page-1}" aria-label="上一页" ${result.page===1?'disabled':''}>‹</button>${Array.from({length:result.pages},(_,i)=>`<button data-page="${i+1}" ${i+1===result.page?'aria-current="page"':''} aria-label="第 ${i+1} 页">${i+1}</button>`).join('')}<button data-page="${result.page+1}" aria-label="下一页" ${result.page===result.pages?'disabled':''}>›</button>`;
   host.innerHTML=detail(result.items.find(r=>r.id===selected),tab);
 }
 const input=root.querySelector('input'),sort=root.querySelector('select');
 const inputHandler=()=>{ui.query=input.value;ui.page=1;render();grid.scrollTop=0;};
 const sortHandler=()=>{ui.sort=sort.value;ui.page=1;render();grid.scrollTop=0;};
 input.addEventListener('input',inputHandler);sort.addEventListener('change',sortHandler);
 function click(e){
   const b=e.target.closest('button');if(!b||!root.contains(b))return;
   if(b.dataset.state){ui.state=b.dataset.state;ui.page=1;render();}
   else if(b.dataset.rating){ui.rating=b.dataset.rating;ui.page=1;render();}
   else if(b.dataset.record){selected=b.dataset.record;tab=0;render();[...grid.querySelectorAll('[data-record]')].find(c=>c.dataset.record===selected)?.focus({preventScroll:true});if(matchMedia('(max-width: 760px)').matches){root.querySelector('#archive-detail').focus({preventScroll:true});root.querySelector('#archive-detail').scrollIntoView({block:'start'});}}
   else if(b.dataset.detailTab!==undefined){tab=Number(b.dataset.detailTab);host.innerHTML=detail(records.find(r=>r.id===selected),tab);root.querySelector(`[data-detail-tab="${tab}"]`).focus({preventScroll:true});}
   else if(b.dataset.page){ui.page=Number(b.dataset.page);render();root.querySelector('#cx-pagination [aria-current]')?.focus({preventScroll:true});}
   else if(b.hasAttribute('data-reset')){ui={...ui,query:'',state:'全部',rating:'全部',page:1};input.value='';render();input.focus();}
   else if(b.dataset.preview){
     const dialog=root.querySelector('dialog');
     if(mode==='live'&&adapter.action){
       const result=adapter.action(selected,b.dataset.preview);
       dialog.innerHTML=`<h2 id="cx-dialog-title">${escapeHtml(result.title)}</h2><p style="white-space:pre-wrap">${escapeHtml(result.text)}</p>${result.save?'<label>私人笔记<textarea aria-label="私人档案笔记" maxlength="2000" rows="6"></textarea></label><button data-note-save>保存笔记</button>':''}${result.go?`<button data-live-go>${escapeHtml(result.goLabel)}</button>`:''}<p role="status" data-action-result></p><button data-close-dialog>关闭</button>`;
       if(result.save){const area=dialog.querySelector('textarea');area.value=result.value;dialog.querySelector('[data-note-save]').onclick=()=>{try{result.save(area.value);dialog.querySelector('[data-action-result]').textContent='私人笔记已保存；不会变为调查证据。';}catch(err){dialog.querySelector('[data-action-result]').textContent='保存失败：'+err.message;}};}
       if(result.go)dialog.querySelector('[data-live-go]').onclick=()=>{try{const message=result.go();if(message&&dialog.isConnected)dialog.querySelector('[data-action-result]').textContent=message;}catch(err){dialog.querySelector('[data-action-result]').textContent='操作未完成：'+err.message;}};
     }else{dialog.innerHTML='<h2 id="cx-dialog-title"></h2><p>这是第三步按钮组件预览。真实地图、记录、驾驭和目标业务将在第四步接入；本次点击不会更改正式存档或创建任务。</p><button data-close-dialog>关闭预览</button>';dialog.querySelector('h2').textContent=b.dataset.preview;}
     dialog.showModal();
   }
   else if(b.hasAttribute('data-close-dialog'))root.querySelector('dialog').close();
   if(b.dataset.state||b.dataset.rating||b.dataset.page||b.hasAttribute('data-reset'))grid.scrollTop=0;
 }
 function key(e){
   const t=e.target.closest('[role="tab"]');
   if(t&&['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();tab=e.key==='Home'?0:e.key==='End'?3:(tab+(e.key==='ArrowRight'?1:3))%4;host.innerHTML=detail(records.find(r=>r.id===selected),tab);root.querySelector(`[data-detail-tab="${tab}"]`).focus({preventScroll:true});}
   const c=e.target.closest('[data-record]');
   if(c&&['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const cards=[...grid.querySelectorAll('[data-record]')],index=cards.indexOf(c),columns=getComputedStyle(grid).gridTemplateColumns.split(' ').length;const next=e.key==='Home'?0:e.key==='End'?cards.length-1:Math.max(0,Math.min(cards.length-1,index+({ArrowLeft:-1,ArrowRight:1,ArrowDown:columns,ArrowUp:-columns}[e.key])));cards[next]?.focus();}
 }
 const resize=()=>{ui.pageSize=mobile.matches?6:15;ui.page=1;render();};
 mobile.addEventListener('change',resize);
 root.addEventListener('click',click);root.addEventListener('keydown',key);render();
 return {refresh(){const dialog=root.querySelector('dialog');if(dialog.open)dialog.close();records=adapter.list().map(projectRecord);render();},destroy(){mobile.removeEventListener('change',resize);input.removeEventListener('input',inputHandler);sort.removeEventListener('change',sortHandler);root.removeEventListener('click',click);root.removeEventListener('keydown',key);root.replaceChildren();}};
}
