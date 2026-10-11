import {projectResonance,readResonance,previewResonance,submitResonance} from '../src/resonance-model.js';
let liveData=projectResonance(null),liveError='',pendingPreview=null;
import {GHOSTS,LINKS,ART,FAMILIES,STATUS,TYPES,visibleRating,filteredGhosts,demoFixture} from './rework-data.js';
import {layoutGraph,boundsFor,branchIds} from './graph-layout.js';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const graph=$('resonance-graph'),content=$('graph-content');
const mobile=()=>matchMedia('(max-width:760px)').matches;
const colors={resonance:'#ff2e40',conflict:'#b677ff',clue:'#aab6c0'};
let ghosts=[...GHOSTS],links=[...LINKS],nodePos=layoutGraph(ghosts),ghostMap=new Map(ghosts.map(g=>[g.id,g]));
const state={selection:'player',query:'',filter:'all',type:'all',family:null,familyFilter:'all',branch:null,tab:'overview',zoom:1,px:400,py:320,baseW:800,baseH:660,panMode:false};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=id=>id==='player'?'共鸣核心':ghostMap.get(id)?.name||'未知档案';
function svgEl(tag,attrs={},parent=content){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));parent.append(n);return n;}
function textAt(parent,s,x,y,size=15,attrs={}){const n=svgEl('text',{x,y,'text-anchor':'middle',fill:'#eff6ff','font-size':size,...attrs},parent);n.textContent=s;return n;}
function imageArt(g){return g.artKey?`assets/source-faithful/${g.artKey}.svg`:'assets/approved/portrait-pending.svg';}
function artMarkup(g){return ART[g.artKey]?`<image href="${imageArt(g)}" x="9" y="6" width="62" height="64"/>`:`<svg x="9" y="6" width="62" height="64" viewBox="10 8 80 80"><image href="${imageArt(g)}" width="100" height="100"/></svg>`;}
function selectedEdge(){return state.selection.startsWith('edge:')?links.find(e=>e.id===state.selection.slice(5)):null;}
function matchingGhosts(){
 const direct=filteredGhosts(ghosts,state),query=state.query.trim();if(!query)return direct;
 const familyIds=new Set(FAMILIES.filter(f=>f.name.includes(query)||f.id==='echo'&&'回响注视'.includes(query)).map(f=>f.id));
 if(!familyIds.size)return direct;
 const ids=new Set([...direct.map(g=>g.id),...links.filter(e=>familyIds.has(e.family)).flatMap(e=>[e.a,e.b])]);
 return filteredGhosts(ghosts,{...state,query:''}).filter(g=>ids.has(g.id));
}
function relevant(e){return(state.type==='all'||e.type===state.type)&&(!state.family||e.family===state.family)&&(!state.branch||state.branch.has(e.a)&&state.branch.has(e.b));}
function setSelection(id){state.selection=id;state.tab='overview';if(state.branch)state.branch=null;$('edge-choice').hidden=true;renderAll();if(mobile()){const e=selectedEdge(),p=nodePos.get(e?e.a:id);if(p){state.px=p.x;state.py=p.y;readableZoom();updateView();}}}
function activate(el,fn){el.addEventListener('click',e=>{e.stopPropagation();fn(e);});el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();fn(e);}});}
function renderOrbits(){
 const decoration=svgEl('g',{class:'orbit-art'});
 svgEl('circle',{cx:400,cy:260,r:330,fill:'url(#red-aura)'},decoration);
 for(const [rx,ry,opacity]of[[107,101,.75],[128,120,.7],[165,155,.6],[192,181,.55],[238,226,.4],[269,248,.4],[309,274,.38]]){
  svgEl('ellipse',{cx:400,cy:260,rx,ry,fill:'none',stroke:'#ef1631','stroke-width':1,'stroke-opacity':opacity},decoration);
  svgEl('ellipse',{cx:400,cy:260,rx:rx+4,ry:ry+4,fill:'none',stroke:'#de1b2c','stroke-width':.7,'stroke-dasharray':'2 5','stroke-opacity':opacity*.75},decoration);
 }
 for(let j=0;j<64;j++){
  const a=j*Math.PI/32,c=Math.cos(a),s=Math.sin(a),r1=j%4===0?112:264,r2=j%4===0?291:273;
  svgEl('line',{x1:400+c*r1,y1:260+s*r1*.89,x2:400+c*r2,y2:260+s*r2*.89,stroke:'#e91c37','stroke-width':j%4===0?1:.8,opacity:j%4===0?.3:.6},decoration);
  if(j%4===0){const x=400+c*229,y=260+s*211;const rune=svgEl('g',{transform:`translate(${x} ${y}) rotate(${j*5.625})`,stroke:'#e42742',fill:'none',opacity:.6},decoration);svgEl('path',{d:'M-8-12H8V12H-8ZM-6-6H6M0-12V12M-6 6H6','stroke-width':1.1},rune);}
 }
 for(let j=0;j<10;j++){const a=j*Math.PI/5;svgEl('path',{d:`M${400+Math.cos(a)*129} ${260+Math.sin(a)*121}L${400+Math.cos(a+.13)*165} ${260+Math.sin(a+.13)*155}L${400+Math.cos(a+.07)*190} ${260+Math.sin(a+.07)*180}`,fill:'none',stroke:'#f52946','stroke-width':1.2,opacity:.6},decoration);}
}
function linkPath(a,b){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;const x1=a.x+ux*(a.r+3),y1=a.y+uy*(a.r+3),x2=b.x-ux*(b.r+3),y2=b.y-uy*(b.r+3);const bend=len>250?15:7,cx=(x1+x2)/2-uy*bend,cy=(y1+y2)/2+ux*bend;return{d:`M${x1},${y1}Q${cx},${cy} ${x2},${y2}`,x:(x1+x2+2*cx)/4,y:(y1+y2+2*cy)/4};}
function drawNode(id,p,matching,connected){
 const player=id==='player',g=ghostMap.get(id),edge=selectedEdge();
 const inFamily=!state.family||links.some(e=>e.family===state.family&&(e.a===id||e.b===id));
 const inType=state.type==='all'||links.some(e=>e.type===state.type&&(e.a===id||e.b===id));
 const faded=!player&&(!matching.has(id)||!inFamily||!inType||state.branch&&!state.branch.has(id));
 const selected=state.selection===id||edge&&(edge.a===id||edge.b===id);
 const group=svgEl('g',{class:`graph-node${selected?' selected':''}${faded?' filtered':''}`,role:'button',tabindex:0,'data-node':id,'aria-label':player?'选择共鸣核心':`选择${g.name}，${STATUS[g.status]}`});
 const color=player||g.major?'#ff2036':g.status==='conflict'||g.status==='research'?'#b676ff':['unknown','locked'].includes(g.status)?'#99abb8':'#fe4252';
 svgEl('circle',{cx:p.x,cy:p.y,r:p.r,fill:player?'#20040abb':'#010608dd',stroke:color,'stroke-width':2.2,filter:player||g.major?'url(#red-glow)':'none'},group);
 svgEl('circle',{cx:p.x,cy:p.y,r:p.r+5,fill:'none',stroke:color,'stroke-width':.8,'stroke-opacity':.8},group);
 if(player||g.major){
  svgEl('circle',{cx:p.x,cy:p.y,r:p.r+9,fill:'none',stroke:color,'stroke-width':1,'stroke-dasharray':'17 4 4 7',filter:'url(#red-glow)'},group);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=p.x+Math.cos(a)*(p.r+8),y=p.y+Math.sin(a)*(p.r+8);svgEl('path',{d:`M${x-3},${y}L${x},${y-3}L${x+3},${y}L${x},${y+3}Z`,fill:i%3===0?'#ffe5df':color,filter:'url(#red-glow)'},group);}
 }
 if(player){svgEl('image',{href:'assets/approved/player.svg',x:p.x-90,y:p.y-100,width:180,height:166},group);textAt(group,'共鸣核心',p.x,p.y+82,21);textAt(group,liveData.name,p.x,p.y+105,20);}
 else if(ART[g.artKey]){svgEl('image',{href:imageArt(g),x:p.x-p.r*.86,y:p.y-p.r*.9,width:p.r*1.72,height:p.r*1.55,'preserveAspectRatio':'xMidYMid meet'},group);}
 else{
  const defs=svgEl('defs',{},group);const clip=svgEl('clipPath',{id:`clip-${id.replace(/[^\w-]/g,'')}`},defs);svgEl('circle',{cx:p.x,cy:p.y-2,r:p.r*.78},clip);
  svgEl('image',{href:imageArt(g),x:p.x-p.r,y:p.y-p.r-3,width:p.r*2,height:p.r*2,'clip-path':`url(#clip-${id.replace(/[^\w-]/g,'')})`},group);
 }
 svgEl('circle',{cx:p.x,cy:p.y,r:p.r+13,fill:'none',stroke:'#fff0db','stroke-width':2.3,class:'focus-ring'},group);
 if(!player&&(g.major||selected||state.zoom>1.5)){
  const scale=graph.clientWidth/state.baseW*state.zoom,labelSize=mobile()?Math.max(12/scale,g.major?18:12):(g.major?18:12);
  const y=g.major?p.y+p.r*.65:p.y+p.r+15;textAt(group,g.status==='unknown'?'未知档案':g.name,p.x,y,labelSize);
  if(g.major){svgEl('rect',{x:p.x-29,y:p.y+p.r+3,width:58,height:18,rx:3,fill:'#01080b',stroke:g.id==='eye'?'#dc1838':'#278879','stroke-width':1},group);textAt(group,g.id==='eye'?'核心':STATUS[g.status],p.x,p.y+p.r+16,12,{fill:g.id==='eye'?'#ff6b78':'#68ebd2',stroke:'none'});}
 }
 activate(group,()=>setSelection(id));
}
function renderGraph(){
 content.replaceChildren();renderOrbits();
 const matching=new Set(matchingGhosts().map(g=>g.id)),edge=selectedEdge(),connected=branchIds(state.selection,links);
 for(const e of links){const a=nodePos.get(e.a),b=nodePos.get(e.b);if(!a||!b)continue;const faded=!relevant(e)||(!matching.has(e.a)&&e.a!=='player'&&!matching.has(e.b));const emphasis=edge?.id===e.id||(!edge&&(state.selection===e.a||state.selection===e.b));const group=svgEl('g',{class:`graph-link${faded?' faded':''}${emphasis?' emphasis':''}`,'data-edge-group':e.id});const p=linkPath(a,b),color=colors[e.type]||colors.clue;
  svgEl('path',{d:p.d,class:'edge-stroke',fill:'none',stroke:color,'stroke-width':e.type==='resonance'?2.2:1.7,'stroke-dasharray':e.type==='clue'?'7 6':'none',opacity:e.type==='clue'?.65:.95,filter:e.type==='resonance'?'url(#red-glow)':'none'},group);
  if(e.type!=='clue'){const badge=svgEl('g',{transform:`translate(${p.x} ${p.y})`,stroke:color,fill:'#14030c','stroke-width':1.5,filter:'url(#red-glow)'},group);svgEl('path',{d:e.type==='conflict'?'M-5 0L0-5L5 0L0 5ZM-3-3L3 3M-3 3L3-3':'M-6 0L-2-3L2 0L-2 3ZM0 0L4-3L8 0L4 3Z'},badge);}
  const hit=svgEl('path',{d:p.d,class:'edge-hit',tabindex:0,role:'button','data-edge':e.id,'aria-label':`${name(e.a)}与${name(e.b)}：${TYPES[e.type]}`},group);activate(hit,()=>setSelection('edge:'+e.id));
 }
 for(const [id,p]of nodePos)if(id!=='player')drawNode(id,p,matching,connected);
 drawNode('player',nodePos.get('player'),matching,connected);updateView();renderMiniMap();
 $('branch-banner').hidden=!state.branch;$('branch-banner').textContent=state.branch?`聚焦相连分支 · ${state.branch.size} 个节点 · 点击「查看全图」返回`:'';
}
function updateView(){const w=state.baseW/state.zoom,h=state.baseH/state.zoom;graph.setAttribute('viewBox',`${state.px-w/2} ${state.py-h/2} ${w} ${h}`);$('zoom-level').textContent=`${Math.round(state.zoom*100)}%`;}
function fit(ids=null){
 const actual=boundsFor(nodePos,ids),bounds=!ids&&ghosts.length<=5?{x:30,y:-30,width:740,height:650}:actual,rect=graph.getBoundingClientRect(),aspect=rect.width/Math.max(1,rect.height);state.baseH=Math.max(bounds.height+32,(bounds.width+26)/aspect);state.baseW=state.baseH*aspect;state.px=bounds.x+bounds.width/2;state.py=bounds.y+bounds.height/2-8;state.zoom=1;if(mobile()&&!state.overview){state.px=nodePos.get('player').x;state.py=nodePos.get('player').y;readableZoom();}updateView();
}
function renderList(){const list=matchingGhosts();$('ghost-count').textContent=`(${list.length})`;
 $('ghost-list').innerHTML=list.length?list.map(g=>`<button class="ghost-row${state.selection===g.id?' selected':''}" data-ghost="${esc(g.id)}" aria-pressed="${state.selection===g.id}"><svg viewBox="0 0 80 76" aria-hidden="true">${artMarkup(g)}</svg><span class="ghost-label"><b>${esc(g.status==='unknown'?'未知档案':g.name)}</b><small><span class="tier ${visibleRating(g)==='神灵异'?'shen':esc(visibleRating(g)||'')}">${esc(visibleRating(g)||'评级未知')}</span><span class="state-chip ${g.status}">${STATUS[g.status]}</span></small></span></button>`).join(''):'<p class="empty">当前没有匹配的持有实例。尚未驾驭时不会补入演示厉鬼。</p>';
 $('ghost-list').querySelectorAll('[data-ghost]').forEach(el=>el.onclick=()=>setSelection(el.dataset.ghost));
 const related=selectedEdge()?.a;if(related&&related!=='player')$('ghost-list').querySelector(`[data-ghost="${CSS.escape(related)}"]`)?.classList.add('selected');
 document.querySelectorAll('[data-filter]').forEach(b=>{const count=b.dataset.filter==='core'?ghosts.filter(g=>g.core).length:filteredGhosts(ghosts,{query:'',filter:b.dataset.filter}).length;b.textContent=({all:'全部',core:'核心',participating:'已启用',available:'未启用',conflict:'冲突',locked:'未解锁'})[b.dataset.filter]+` (${count})`;b.classList.toggle('active',state.filter===b.dataset.filter);b.setAttribute('aria-pressed',String(state.filter===b.dataset.filter));});
 $('status-filter').value=state.filter;
}
function info(k,v,pending=false){return`<div class="detail-line"><span class="label">${k}</span><span${pending?' class="pending"':''}>${v}</span></div>`;}
function heroArt(a,b=null){
 const left=a?`<image href="${imageArt(a)}" x="2" y="2" width="105" height="100"/>`:'<image href="assets/approved/player.svg" x="6" y="0" width="100" height="105"/>';
 const right=b?`<image href="${imageArt(b)}" x="235" y="0" width="100" height="105"/>`:'';
 return`<svg viewBox="0 0 340 150" aria-hidden="true"><circle cx="57" cy="52" r="47" stroke="#fd2442" stroke-width="1.5" fill="#29031188"/><circle cx="57" cy="52" r="51" stroke="#aa1430" fill="none"/>${left}${right}<path d="M10 120H330M12 122L24 128H314L328 122" fill="none" stroke="#ed1239" opacity=".7"/></svg>`;
}
const tabs=[['overview','概览'],['conditions','条件'],['effects','效果'],['conflicts','冲突'],['research','研究记录']];
function actionLabel(a){if(a.startsWith('evo:graph:observe:'))return '观察这条关系';return ({'dual:observe':'静止观察','dual:evaluate':'评估已有复核记录','dual:cycle':'开始新的观察周期'})[a]||(a.startsWith('dual:stress:')?'高强度验证：':'普通验证：')+name(a.split(':').slice(2).join(':'));}
function renderDetails(){
 const edge=selectedEdge(),g=ghostMap.get(state.selection),ids=edge?[edge.a,edge.b]:g?[g.id]:[],participants=ids.map(id=>ghostMap.get(id)).filter(Boolean),player=state.selection==='player',title=edge?edge.label:g?.name||'共鸣核心';
 let detail='';
 const costTable='<h4>逐鬼状态 · 来自当前存档</h4><table class="cost-table"><thead><tr><th>实例</th><th>历史复苏</th><th>灵异负荷</th></tr></thead><tbody>'+participants.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.revival+'%<br>'+esc(x.revivalStage)+'</td><td>'+x.burden+'</td></tr>').join('')+'</tbody></table><p>复苏与负荷分别记录，不能相加。实际调用代价请先预览已有行动。</p>';
 const relation=edge?.values?info('相容记录',edge.values.compatibility)+info('有向压制',edge.values.suppressionAtoB+' / '+edge.values.suppressionBtoA)+info('有向冲突',edge.values.conflictAtoB+' / '+edge.values.conflictBtoA)+info('关系偏移',edge.values.bias):edge?.family==='host'?info('关系含义','玩家持有；不表示已激活共鸣能力'):edge?info('关系记录','未完成关系对照，不公开后台强度'):g?info('启用状态',STATUS[g.status]):info('关系记录','选择已有关系查看观察结果');
 const abilities=participants.map(x=>'<p>'+esc(x.name)+'：'+esc(x.rule||'能力规则尚未认证／接入；不从参考图推导')+'</p>').join('');
 if(state.tab==='overview')detail=info('关系类别',esc(edge?.label||'持有实例'))+info('参与实例',esc(ids.map(name).join(' ＋ ')||liveData.name))+relation+costTable;
 if(state.tab==='conditions')detail=participants.map(x=>info(esc(x.name),esc(x.condition||'尚无已验证条件'))).join('')+info('操作合法性','按钮仅来自当前 engine.available；提交时重新检查')+info('正式共鸣规则','原图的组合技能未定义，待开发');
 if(state.tab==='effects')detail=abilities+relation+info('能力边界','制约／冲突记录不自动生成新的组合能力');
 if(state.tab==='conflicts')detail=(edge?.known?relation:info('冲突记录','未验证关系不公开冲突参数'))+'<h4>已观察关联</h4>'+links.filter(e=>e.known&&e.type==='conflict'&&(!ids.length||ids.includes(e.a)||ids.includes(e.b))).map(e=>'<button data-detail-edge="'+esc(e.id)+'">'+esc(name(e.a)+' ＋ '+name(e.b))+'</button>').join('');
 if(state.tab==='research')detail=info('长期复核',esc(liveData.review?.verdict||'暂无记录'))+'<p>'+esc((liveData.review?.history||[]).join('；')||'暂无已记录的关系研究')+'</p>'+info('已有复核样本',liveData.review?.samples.length||0);
 if(player&&state.tab==='overview')detail=info('实际持有',ghosts.length+' 个实例')+info('实际关系',links.filter(e=>e.family!=='host').length+' 条记录')+(liveData.host?info('宿主承载',liveData.host.effectiveBurden+' / '+liveData.host.hostCapacity)+info('总体平衡',esc(liveData.host.balanceState))+info('长期复核',esc(liveData.review.verdict)):'<p>'+esc(liveError||'尚未载入有效存档')+'</p>')+'<p>没有持鬼时，保留角色核心，不补入演示数据。</p>';
 const actions=liveData.actions.filter(a=>a.startsWith('evo:graph:observe:')?edge?.observeAction===a:/^dual:(use|stress):/.test(a)?!ids.length||ids.includes(a.split(':').slice(2).join(':')):true);
 $('detail-area').innerHTML='<div class="detail-hero">'+heroArt(participants[0],participants[1])+'<h3>'+esc(title)+'</h3><span class="subtitle">当前游戏记录</span><div class="hero-participants">'+esc(ids.map(name).join(' ＋ ')||liveData.name)+'</div></div><div class="detail-tabs" role="tablist">'+tabs.map(([id,label])=>'<button data-tab="'+id+'" role="tab" aria-selected="'+(state.tab===id)+'" class="'+(state.tab===id?'active':'')+'">'+label+'</button>').join('')+'</div>'+detail+'<h4>已有引擎行动 · 先预览，再确认</h4><div class="live-actions">'+(actions.map(a=>'<button data-live-action="'+esc(a)+'">预览 '+esc(actionLabel(a))+'</button>').join('')||'<p>当前没有合法的关系行动。查看与缩放不推进时间。</p>')+'</div><div class="read-only">第四步：持有、评级、复苏、负荷及关系来自现有引擎。原图中的回响注视等新技能尚未定义。</div>';
 $('detail-area').querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;renderDetails();});$('detail-area').querySelectorAll('[data-detail-edge]').forEach(b=>b.onclick=()=>setSelection('edge:'+b.dataset.detailEdge));$('detail-area').querySelectorAll('[data-live-action]').forEach(b=>b.onclick=()=>previewAction(b.dataset.liveAction));$('view-neighbors').disabled=player;$('detail-area').scrollTop=0;
}
function previewAction(action){pendingPreview=previewResonance(localStorage,action);if(!pendingPreview.ok){liveError='当前行动已不合法，请刷新后重试。';refreshLive();return;}const p=pendingPreview;const dialog=document.createElement('dialog');dialog.className='live-confirm';dialog.innerHTML='<h3>'+esc(actionLabel(action))+' · 实际结算预览</h3><p>身体变化 '+p.life+'；能量变化 '+p.energy+'；世界时间 +'+p.time+'；行动节点 +'+p.ticks+'</p><table class="cost-table"><thead><tr><th>厉鬼</th><th>复苏变化</th><th>负荷变化</th></tr></thead><tbody>'+p.ghosts.map(g=>'<tr><td>'+esc(g.name)+'</td><td>'+g.revivalBefore+' → '+g.revivalAfter+'（+'+Number(g.revivalDelta.toFixed(4))+'）</td><td>'+g.burdenBefore+' → '+g.burdenAfter+'</td></tr>').join('')+'</tbody></table><p>包含当前环境与公共逐鬼结算；确认前不会扣资源。复核不保证永久安全。</p><p role="status"></p><button data-confirm>确认执行并保存</button><button data-cancel>取消</button>';document.body.append(dialog);dialog.showModal();const dispose=()=>{pendingPreview=null;dialog.remove();};dialog.querySelector('[data-cancel]').onclick=dispose;dialog.addEventListener('cancel',dispose);dialog.querySelector('[data-confirm]').onclick=()=>{const result=submitResonance(localStorage,pendingPreview);if(!result.committed){dialog.querySelector('[role="status"]').textContent=({STALE:'存档已变化，本次未执行。取消后重新预览。',STORAGE_FAILED:'保存失败，未提交本次行动。',NO_ACTION:'当前行动不合法，本次未执行。'})[result.reason]||'本次未提交，原进度保留。';dialog.querySelector('[data-confirm]').disabled=true;return;}window.resonanceBridge?.onCommitted(result.state);dispose();refreshLive();};}
function familyMini(f){
 const edges=links.filter(e=>e.family===f.id),ids=[...new Set(edges.flatMap(e=>[e.a,e.b]))];
 if(!ids.length)return '<svg viewBox="0 0 210 76"><text x="105" y="45" fill="#bbc4cd" text-anchor="middle">暂无已有关系</text></svg>';
 const positions=ids.map(id=>nodePos.get(id)),xs=positions.map(p=>p.x),ys=positions.map(p=>p.y),minX=Math.min(...xs),minY=Math.min(...ys),sx=178/Math.max(1,Math.max(...xs)-minX),sy=48/Math.max(1,Math.max(...ys)-minY);
 const coords=new Map(ids.map(id=>{const p=nodePos.get(id);return[id,{x:16+(p.x-minX)*sx,y:13+(p.y-minY)*sy}];}));
 return '<svg viewBox="0 0 210 76" aria-hidden="true">'+edges.map(e=>{const a=coords.get(e.a),b=coords.get(e.b);return '<path data-mini-edge="'+e.id+'" data-a="'+e.a+'" data-b="'+e.b+'" d="M'+a.x+' '+a.y+'L'+b.x+' '+b.y+'" stroke="'+colors[e.type]+'" stroke-width="1.2" '+(e.type==='clue'?'stroke-dasharray="3 2"':'')+'/>';}).join('')+ids.map(id=>{const p=coords.get(id),g=ghostMap.get(id),r=id==='player'||g?.major?11:6;return '<g data-mini-node="'+id+'"><circle cx="'+p.x+'" cy="'+p.y+'" r="'+r+'" fill="#05070c" stroke="'+f.color+'"/>'+(f.id==='unknown'?'<text x="'+p.x+'" y="'+(p.y+4)+'" text-anchor="middle" fill="#cbd1d5" font-size="12">?</text>':'<image href="'+(id==='player'?'assets/approved/player.svg':imageArt(g))+'" x="'+(p.x-r*.8)+'" y="'+(p.y-r*.85)+'" width="'+r*1.6+'" height="'+r*1.6+'"/>')+'</g>';}).join('')+'</svg>';
}
function renderFamilies(){
 const active=state.family?links.filter(e=>e.family===state.family):links;$('family-meta').textContent=`实际 ${ghosts.length} 持有实例 · ${active.length} 条关系`;
 $('families').innerHTML=FAMILIES.map((f,i)=>{const excluded=state.familyFilter!=='all'&&!links.some(e=>e.family===f.id&&e.type===state.familyFilter);return`<button class="family-card${state.family===f.id?' active':''}${excluded?' filtered-family':''}" data-family="${f.id}" aria-pressed="${state.family===f.id}" style="--family-color:${f.color}"><span class="family-title">${f.name}</span><span class="family-status">${f.status}</span>${familyMini(f,i)}<span class="family-caption">${links.filter(e=>e.family===f.id).length} 条实际关联 · ${f.note}</span></button>`;}).join('');
 $('families').querySelectorAll('[data-family]').forEach(el=>el.onclick=()=>{state.family=state.family===el.dataset.family?null:el.dataset.family;state.branch=null;renderAll();if(state.family){const ids=new Set(links.filter(e=>e.family===state.family).flatMap(e=>[e.a,e.b]));ids.add('player');fit(ids);}else fit();});
 document.querySelectorAll('[data-family-filter]').forEach(el=>el.classList.toggle('active',el.dataset.familyFilter===state.familyFilter));
}
function renderAll(){renderList();renderGraph();renderDetails();renderFamilies();}
function syncQuery(value){state.query=value;$('search').value=value;$('list-search').value=value;renderAll();}
for(const id of['search','list-search'])$(id).addEventListener('input',e=>syncQuery(e.target.value));
$('status-filter').onchange=e=>{state.filter=e.target.value;renderAll();};$('type-filter').onchange=e=>{state.type=e.target.value;renderGraph();};
document.querySelectorAll('[data-filter]').forEach(el=>el.onclick=()=>{state.filter=el.dataset.filter;renderAll();});
document.querySelectorAll('[data-family-filter]').forEach(el=>el.onclick=()=>{state.familyFilter=el.dataset.familyFilter;state.type=state.familyFilter;$('type-filter').value=state.type;renderAll();});
function clearView(clearFilters=false){state.overview=false;state.branch=null;state.family=null;state.selection='player';state.tab='overview';if(clearFilters){state.filter='all';state.type='all';state.query='';state.familyFilter='all';$('search').value='';$('list-search').value='';$('type-filter').value='all';}renderAll();fit();}
$('reset-all').onclick=()=>clearView(true);$('clear-selection').onclick=()=>clearView();
$('fit-map').onclick=()=>{state.overview=true;state.branch=null;state.family=null;renderAll();fit();};
$('layout-reset').onclick=()=>{nodePos=layoutGraph(ghosts);clearView();};
$('center-player').onclick=()=>{state.overview=false;state.px=nodePos.get('player').x;state.py=nodePos.get('player').y;state.zoom=Math.min(4,1.7);if(mobile())readableZoom();renderGraph();};
function zoomBy(factor){state.zoom=Math.max(.15,Math.min(6,state.zoom*factor));renderGraph();}
$('zoom-in').onclick=()=>zoomBy(1.2);$('zoom-out').onclick=()=>zoomBy(1/1.2);
$('pan-mode').onclick=()=>{state.panMode=!state.panMode;$('pan-mode').setAttribute('aria-pressed',String(state.panMode));};
$('view-neighbors').onclick=()=>{const e=selectedEdge();state.branch=e?new Set([...branchIds(e.a,links),...branchIds(e.b,links)]):branchIds(state.selection,links);state.family=null;renderAll();fit(state.branch);};
graph.addEventListener('wheel',e=>{e.preventDefault();const before=screenPoint(e.clientX,e.clientY),oldZoom=state.zoom;state.zoom=Math.max(.15,Math.min(6,state.zoom*(e.deltaY<0?1.12:1/1.12)));updateView();const after=screenPoint(e.clientX,e.clientY);state.px+=before.x-after.x;state.py+=before.y-after.y;if(oldZoom!==state.zoom)renderGraph();},{passive:false});
function screenPoint(x,y){const m=graph.getScreenCTM();return m?new DOMPoint(x,y).matrixTransform(m.inverse()):{x,y};}
let drag=null,pinch=null,suppressClick=false;const pointers=new Map();
graph.addEventListener('pointerdown',e=>{
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:state.zoom};drag=null;graph.setPointerCapture(e.pointerId);e.preventDefault();return;}
 if(e.target.closest('.graph-node,.edge-hit')&&!state.panMode)return;
 drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,px:state.px,py:state.py};graph.setPointerCapture(e.pointerId);graph.classList.add('dragging');
});
graph.addEventListener('pointermove',e=>{
 if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&pointers.size>=2){const[a,b]=[...pointers.values()];state.zoom=Math.max(.15,Math.min(6,pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance)));updateView();return;}
 if(!drag||drag.pointer!==e.pointerId)return;const rect=graph.getBoundingClientRect();state.px=drag.px-(e.clientX-drag.x)*state.baseW/(Math.max(1,rect.width)*state.zoom);state.py=drag.py-(e.clientY-drag.y)*state.baseH/(Math.max(1,rect.height)*state.zoom);drag.moved=Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4;updateView();
});
function endPointer(e){if(drag?.moved||pinch){suppressClick=true;setTimeout(()=>suppressClick=false,250);}pointers.delete(e.pointerId);if(pointers.size<2)pinch=null;drag=null;graph.classList.remove('dragging');}
graph.addEventListener('pointerup',endPointer);graph.addEventListener('pointercancel',endPointer);
graph.addEventListener('keydown',e=>{if(e.target!==graph)return;if(e.key==='+'||e.key==='='){e.preventDefault();zoomBy(1.2);}if(e.key==='-'){e.preventDefault();zoomBy(1/1.2);}});graph.setAttribute('tabindex','0');
let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{fit(state.branch);renderGraph();},80);}).observe($('graph-viewport'));
// Live adapter reads the existing validated archive; no demo injection API.
renderAll();requestAnimationFrame(()=>{fit();renderGraph();});


function segmentDistance(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);}
function curveCandidates(x,y){return [...graph.querySelectorAll('.graph-link:not(.faded) .edge-hit')].map(path=>{const m=path.getScreenCTM(),len=path.getTotalLength();let d=Infinity,a=path.getPointAtLength(0).matrixTransform(m);for(let i=1;i<=64;i++){const b=path.getPointAtLength(len*i/64).matrixTransform(m);d=Math.min(d,segmentDistance(x,y,a,b));a=b;}return{id:path.dataset.edge,d};}).filter(e=>e.d<8).sort((a,b)=>a.d-b.d);}
graph.addEventListener('click',e=>{if(suppressClick){e.stopImmediatePropagation();e.preventDefault();return;}if(e.detail===0||e.target.closest('.graph-node'))return;const candidates=curveCandidates(e.clientX,e.clientY);if(!candidates.length)return;e.stopImmediatePropagation();e.preventDefault();const close=candidates.filter(c=>c.d-candidates[0].d<.7);if(close.length===1){setSelection('edge:'+close[0].id);return;}const box=$('edge-choice');box.innerHTML='<b>此处有多条关系，请选择</b>'+close.map(c=>{const edge=links.find(e=>e.id===c.id);return '<button data-choice="'+c.id+'">'+esc(name(edge.a))+' ＋ '+esc(name(edge.b))+' · '+TYPES[edge.type]+'</button>';}).join('')+'<button data-cancel>取消</button>';box.hidden=false;box.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>setSelection('edge:'+b.dataset.choice));box.querySelector('[data-cancel]').onclick=()=>box.hidden=true;},true);
function readableZoom(){state.overview=false;state.zoom=Math.max(state.zoom,50*state.baseW/(44*Math.max(1,graph.clientWidth)));$('browse-mode').textContent='全图定位';}
function renderMiniMap(){
 $('mobile-node').innerHTML='<option value="">选择厉鬼 · 放大浏览</option><option value="player">共鸣核心</option>'+ghosts.map(g=>'<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>').join('');const b=boundsFor(nodePos),mini=$('mini-map');mini.setAttribute('viewBox',[b.x-20,b.y-20,b.width+40,b.height+40].join(' '));mini.innerHTML=links.map(e=>{const a=nodePos.get(e.a),b=nodePos.get(e.b);return '<path d="M'+a.x+' '+a.y+'L'+b.x+' '+b.y+'" stroke="'+colors[e.type]+'" stroke-width="2"/>';}).join('')+[...nodePos].map(([id,p])=>'<circle data-locate="'+id+'" cx="'+p.x+'" cy="'+p.y+'" r="'+(id==='player'?20:12)+'" fill="'+(ghostMap.get(id)?.major?'#ff5264':'#b6bdca')+'"/>').join('');mini.querySelectorAll('[data-locate]').forEach(c=>c.onclick=()=>setSelection(c.dataset.locate));}
$('browse-mode').onclick=()=>{if(state.overview){state.overview=false;state.px=nodePos.get('player').x;state.py=nodePos.get('player').y;readableZoom();renderGraph();}else{state.overview=true;fit();$('browse-mode').textContent='放大浏览';renderGraph();}};

$('mobile-node').onchange=e=>{if(e.target.value)setSelection(e.target.value);};

function refreshLive(){const read=readResonance(localStorage),previousCount=ghosts.length;liveError=read.error||'';liveData=projectResonance(read.state);ghosts=liveData.ghosts;links=liveData.links;ghostMap=new Map(ghosts.map(g=>[g.id,g]));nodePos=layoutGraph(ghosts);if(state.selection!=='player'&&!ghostMap.has(state.selection)&&!links.some(e=>'edge:'+e.id===state.selection))state.selection='player';$('live-player-name').textContent=liveData.name;renderAll();if(previousCount!==ghosts.length)fit();}
window.resonanceLive={refresh:refreshLive,snapshot:()=>({ghosts:ghosts.length,links:links.length,selection:state.selection,zoom:state.zoom,query:state.query,family:state.family})};
$('return-game').onclick=()=>window.resonanceBridge?window.resonanceBridge.close():location.assign('../index.html');
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog'))window.resonanceBridge?.close();});window.addEventListener('storage',e=>{if(e.key==='supernatural-era.prototype.v2')refreshLive();});
const routes=['首页','技能工坊','拼图背包','厉鬼图鉴',null,'历史','地图','更新与显示'];document.querySelectorAll('.nav-item').forEach((item,i)=>{if(!routes[i])return;item.setAttribute('role','button');item.tabIndex=0;item.onclick=()=>window.resonanceBridge?window.resonanceBridge.navigate(routes[i]):location.assign('../index.html');item.onkeydown=e=>{if(e.key==='Enter')item.click();};});
refreshLive();
