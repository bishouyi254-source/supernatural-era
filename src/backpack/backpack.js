import {GRADES,gradeAsset,queryItems,pageItems,validateItems} from './model.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset=n=>new URL(`../../assets/backpack/${n}.png`,import.meta.url).href;
const tabs=['基础信息','能力与限制','开发进度'];
export class PuzzleBackpack{
 constructor(root,{items=[],onAction=()=>{},demo=true,pageSize=12}={}){
  this.abort=new AbortController();
  this.root=root;this.items=validateItems(structuredClone(items));this.onAction=onAction;this.demo=demo;this.pageSize=pageSize;this.selected=this.items[0]?.id;this.tab=tabs[0];this.loading=false;this.error='';this.page=1;this.filters={search:'',grade:'all',status:'all',kind:'all',origin:'all',sort:'collection'};
  this.root.innerHTML=`<aside class="game-nav"><div class="brand"><img src="${asset('grade-divine')}" alt=""><div><h1>神秘复苏</h1><span>灵异拼图管理</span></div></div><div class="host"><img src="${asset('host')}" alt="素材板中的演示调查者"><strong>组件预览</strong><span>第三步 · DEMO</span></div><nav aria-label="游戏导航"><button data-nav="驾驭厉鬼"><img src="${asset('nav-sync')}" alt="">驾驭厉鬼</button><button class="nav-selected" aria-current="page"><img src="${asset('nav-bag')}" alt="">拼图背包</button><button data-nav="厉鬼图鉴"><img src="${asset('nav-book')}" alt="">厉鬼图鉴</button><button data-nav="同步共鸣"><img src="${asset('nav-sync')}" alt="">同步共鸣</button><button data-nav="档案记录"><img src="${asset('nav-record')}" alt="">档案记录</button></nav><p class="nav-note">人死不灭<br>厉鬼可用</p></aside><main class="backpack-main"><header class="page-header"><div><h2>厉鬼拼图背包</h2><p>已获得的厉鬼拼图与可用构筑素材</p></div><span class="demo-stamp">DEMO · 独立演示</span></header><div class="demo-note">六阶标签仅作展示；本页不连接正式存档。操作只影响演示会话。</div><div class="workspace"><section class="collection" aria-label="拼图收藏"><div class="search-row"><label class="search-box"><span aria-hidden="true">⌕</span><input type="search" aria-label="搜索拼图名称、关键词" placeholder="搜索拼图名称、关键词…"></label><label class="sort-label">排序<select aria-label="排序"><option value="collection">收藏顺序</option><option value="grade">按评级</option><option value="name">按名称</option></select></label></div><div class="filter-row" data-filter-group="status" aria-label="持有状态筛选"></div><div class="filter-row grades" data-filter-group="grade" aria-label="六阶评级筛选"></div><div class="filter-secondary"><label>类型<select data-filter="kind" aria-label="类型筛选"><option value="all">全部</option><option>核心</option><option>辅助</option></select></label><label>来源<select data-filter="origin" aria-label="来源筛选"><option value="all">全部</option><option>原著</option><option>原创</option></select></label><button data-reset>清空筛选</button><button data-loading>演示加载</button></div><p class="collection-help">方向键移动焦点，Enter / 空格选中卡牌。</p><div class="card-grid" aria-label="拼图卡牌"></div><footer class="collection-footer"><span class="result-count" role="status"></span><nav class="pagination" aria-label="翻页"></nav></footer></section><aside class="details" aria-label="选中拼图详情"></aside></div><div class="feedback" role="status" aria-live="polite">请选择卡牌查看详情。</div><section class="event-log"><details><summary>DEMO 事件回执 <span class="log-count">0</span></summary><ol></ol></details></section></main><dialog class="action-dialog"><h2>演示操作</h2><p></p><div><button data-cancel>取消</button><button class="primary" data-confirm>确认演示</button></div></dialog>`;
  this.bind();this.render();
 }
 bind(){
  this.root.querySelector('input').addEventListener('input',e=>{this.filters.search=e.target.value;this.page=1;this.render();});
  this.root.querySelector('[aria-label="排序"]').addEventListener('change',e=>{this.filters.sort=e.target.value;this.render();});
  this.root.querySelectorAll('[data-filter]').forEach(e=>e.addEventListener('change',()=>{this.filters[e.dataset.filter]=e.value;this.page=1;this.render();}));
  this.root.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.dataset.value!==undefined){const group=b.closest('[data-filter-group]').dataset.filterGroup;this.filters[group]=b.dataset.value;this.page=1;this.render();this.root.querySelector(`[data-filter-group="${group}"] [aria-pressed="true"]`)?.focus();}
   else if(b.dataset.select){this.selected=b.dataset.select;this.renderDetail();this.renderCards();this.root.querySelector(`[data-select="${CSS.escape(this.selected)}"]`)?.focus({preventScroll:true});if(matchMedia('(max-width:600px)').matches)this.root.querySelector('.details').scrollIntoView({block:'start'});}
   else if(b.hasAttribute('data-show-collection')){this.root.querySelector('.collection').scrollIntoView({block:'start'});}
   else if(b.dataset.page){this.page=Number(b.dataset.page);this.render();this.root.querySelector('.card-grid button')?.focus();this.root.querySelector('.card-grid').scrollTop=0;}
   else if(b.dataset.tab){this.tab=b.dataset.tab;this.renderDetail();this.root.querySelector(`[data-tab="${this.tab}"]`)?.focus();}
   else if(b.hasAttribute('data-reset')){this.resetFilters();}
   else if(b.hasAttribute('data-loading')){this.setLoading(true);clearTimeout(this.loadingTimer);this.loadingTimer=setTimeout(()=>this.setLoading(false),900);}
   else if(b.dataset.nav){this.emit('navigate',{target:b.dataset.nav});}
   else if(b.dataset.action){this.pending={id:this.selected,action:b.dataset.action,token:this.snapshotToken};const d=this.root.querySelector('dialog');d.querySelector('p').textContent=`DEMO：${b.textContent.trim()}。仅产生演示事件，不执行真实游戏行动。`;d.showModal();}
   else if(b.hasAttribute('data-cancel')){this.root.querySelector('dialog').close();}
   else if(b.hasAttribute('data-confirm')){this.root.querySelector('dialog').close();this.emit(this.pending.action,{id:this.pending.id,token:this.pending.token});}
  },{signal:this.abort.signal});
  this.root.querySelector('.card-grid').addEventListener('keydown',e=>{
   const btn=e.target.closest('[data-select]');if(!btn)return;const buttons=[...this.root.querySelectorAll('.card-grid button')],i=buttons.indexOf(btn),cols=getComputedStyle(this.root.querySelector('.card-grid')).gridTemplateColumns.split(' ').length;
   const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:cols,ArrowUp:-cols,Home:-i,End:buttons.length-i-1}[e.key];
   if(delta!==undefined){e.preventDefault();buttons[Math.max(0,Math.min(buttons.length-1,i+delta))]?.focus();}
  });
  this.root.querySelector('.details').addEventListener('keydown',e=>{if(!e.target.matches('[role="tab"]')||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();this.tab=tabs[(tabs.indexOf(this.tab)+(e.key==='ArrowRight'?1:2))%3];this.renderDetail();this.root.querySelector(`[data-tab="${this.tab}"]`).focus();});
 }
 resetFilters(){this.filters={search:'',grade:'all',status:'all',kind:'all',origin:'all',sort:'collection'};this.page=1;this.root.querySelector('input').value='';this.root.querySelectorAll('select').forEach(s=>s.value=s.hasAttribute('data-filter')?'all':'collection');this.render();this.root.querySelector('input').focus();}
 setItems(items){this.items=validateItems(structuredClone(items));this.selected=this.items[0]?.id;this.render();}
 setLoading(value){this.loading=value;this.render();}
 setError(message){this.error=message;this.render();}
 render(){
  const groups={status:[['all','全部'],['owned','已持有'],['equipped','已装配'],['unequipped','未装配']],grade:[['all','全部'],...GRADES.map(g=>[g,g])]};
  Object.entries(groups).forEach(([key,values])=>{this.root.querySelector(`[data-filter-group="${key}"]`).innerHTML=values.map(([v,label])=>`<button data-value="${v}" aria-pressed="${this.filters[key]===v}" ${key==='grade'&&v!=='all'?`class="grade-filter grade-${gradeAsset(v)}"`:''}>${key==='grade'&&v!=='all'?`<img src="${asset('grade-'+gradeAsset(v))}" alt="">`:''}${label}</button>`).join('');});
  this.current=pageItems(queryItems(this.items,this.filters),this.page,this.pageSize);this.page=this.current.page;
  if(!this.current.items.some(x=>x.id===this.selected))this.selected=this.current.items[0]?.id;
  this.renderCards();this.renderDetail();
  this.root.querySelector('.result-count').textContent=`${this.current.total} 张匹配 · 演示持有 ${this.items.filter(x=>x.owned).length}/${this.items.length}`;
  this.root.querySelector('.pagination').innerHTML=`<button data-page="${this.page-1}" ${this.page===1?'disabled':''} aria-label="上一页">‹</button><span>${this.page} / ${this.current.pages}</span><button data-page="${this.page+1}" ${this.page===this.current.pages?'disabled':''} aria-label="下一页">›</button>`;
 }
 renderCards(){
  const grid=this.root.querySelector('.card-grid');grid.setAttribute('aria-busy',String(this.loading));
  if(this.loading){grid.innerHTML='<div class="empty-state loading"><i></i><h3>正在读取演示拼图…</h3><p>载入结束后恢复当前筛选。</p></div>';return;}
  if(this.error){grid.innerHTML=`<div class="empty-state"><h3>载入未完成</h3><p>${esc(this.error)}</p></div>`;return;}
  if(!this.current.items.length){grid.innerHTML='<div class="empty-state"><h3>没有符合条件的拼图</h3><p>试试其他评级、持有状态，或清空筛选。</p><button data-reset>清空筛选</button></div>';return;}
  grid.innerHTML=this.current.items.map(x=>{const a=gradeAsset(x.visualGrade)||'divine';return `<button class="puzzle-card grade-${a} ${x.id===this.selected?'selected':''} ${x.owned?'':'unowned'}" data-select="${esc(x.id)}" aria-pressed="${x.id===this.selected}" aria-label="${esc(x.name)}，${x.visualGrade??'未配置评级'}，${x.equipped?'已装配':x.owned?'未装配':'未持有'}" style="--frame:url('${asset('frame-'+a)}')"><span class="card-art"><img src="${asset('art-'+a)}" alt=""><span class="grade-badge">${x.visualGrade?`<img src="${asset('grade-'+a)}" alt="">`:''}${x.visualGrade??'未配置评级'}</span>${!x.owned?`<span class="lock-overlay"><img src="${asset('lock')}" alt="">未持有</span>`:''}</span><span class="card-copy"><strong>${esc(x.name)}</strong><small>${x.kind} · ${x.origin}</small><span class="card-state">${x.equipped?'已装配':x.owned?'已持有 · 未装配':'未持有 · 演示样本'}</span><span class="card-development">演示开发 ${x.development}</span></span></button>`;}).join('');
 }
 renderDetail(){
  const panel=this.root.querySelector('.details');const x=this.items.find(x=>x.id===this.selected);
  if(this.loading||this.error||!x){panel.innerHTML='<div class="empty-detail"><h3>拼图详情</h3><p>选中一张卡牌后，在这里查看媒介、限制与操作入口。</p></div>';return;}
  const a=gradeAsset(x.visualGrade)||'divine';
  panel.innerHTML=`<button class="back-to-cards" data-show-collection>返回卡牌收藏</button><div class="detail-heading"><h3>${esc(x.name)}</h3><span class="detail-grade grade-${a}">${x.visualGrade??'未配置评级'}</span></div><div class="detail-portrait"><img src="${asset('art-'+a)}" alt="${esc(x.name)}演示插画"><div><span>${x.kind}</span><span>${x.origin}</span><strong>${x.equipped?'已装配':x.owned?'已持有 · 未装配':'未持有'}</strong><small>DEMO 视觉标签</small></div></div><div class="detail-tabs" role="tablist" aria-label="详情分类">${tabs.map(t=>`<button data-tab="${t}" role="tab" aria-selected="${this.tab===t}" tabindex="${this.tab===t?0:-1}" aria-controls="detail-body">${t}</button>`).join('')}</div><div class="detail-body" id="detail-body" role="tabpanel"><h4>${this.tab}</h4>${this.tab===tabs[0]?`<dl><dt>评级</dt><dd>${x.visualGrade??'未配置评级'} · 仅作视觉展示</dd><dt>状态</dt><dd>${x.equipped?'演示装配':x.owned?'演示持有':'演示未持有'}</dd><dt>类型</dt><dd>${x.kind} · 演示标签</dd><dt>来源</dt><dd>${x.origin} · 插画样本</dd></dl><h4>规则边界</h4><p>${esc(x.restriction)}</p>`:this.tab===tabs[1]?`<h4>能力说明</h4><p>${esc(x.rules)}</p><h4>媒介条件</h4><p>${esc(x.medium)}</p><h4>驾驭限制</h4><p>${esc(x.restriction)}</p>`:`<div class="development-meter"><span>演示开发</span><strong>${x.development} / 100</strong><progress value="${x.development}" max="100"></progress></div><div class="development-nodes"><span>资料</span><i></i><span>研究</span><i></i><span>练习</span></div><p>节点展示交互样式，不声明解锁门槛。真实研究路线与技能条件将在第四步复用已有工坊规则。</p>`}<div class="independent-rules"><span><img src="${asset('revival')}" alt="">逐鬼复苏：未绑定</span><span><img src="${asset('burden')}" alt="">灵异负荷：未绑定</span></div></div><section class="action-entry"><h4>行动入口 <small>DEMO</small></h4><div><button data-action="study" ${!x.owned?'disabled':''}>研究</button><button data-action="practice" ${!x.owned?'disabled':''}>练习</button><button class="primary" data-action="${x.equipped?'unequip':'equip'}" ${!x.owned?'disabled':''}>${x.equipped?'模拟卸下':'模拟装配'}</button></div><button data-nav="驾驭厉鬼">前往驾驭界面 · 事件预览</button><small>${x.owned?'点击后显示演示确认与事件回执。':'未持有样本：研究、练习和装配入口不可用。'}</small></section>`;
 }
 emit(type,payload){const event={type,payload,mode:this.demo?'DEMO':'adapter'};this.onAction(event);this.root.querySelector('.feedback').textContent=`DEMO 事件：${type} ${payload.target||payload.id||''}。未执行正式游戏行动。`;const li=document.createElement('li');li.textContent=JSON.stringify(event);this.root.querySelector('.event-log ol').prepend(li);this.root.querySelector('.log-count').textContent=this.root.querySelectorAll('.event-log li').length;}
 destroy(){clearTimeout(this.loadingTimer);this.abort.abort();this.root.replaceChildren();}
}






