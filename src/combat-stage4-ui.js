/**
 * Stage-3 editable battle UI. No combat engine, savegame, network, or rule checks.
 * Callback bridge (onAction/onRetreat) intentionally does NOT settle battles.
 */
const base='../assets/combat-ui/';
const path=(s)=>new URL(base+s, import.meta.url).href;
const svg=(s)=>path('svg/'+s);
const playerArt=path('png/sprites/player_chibi_masked_preview.png');
const ghostArt=path('png/sprites/ghost_old_man_masked_preview.png');
// Clean independent environment art from the project, not the blurred flattened UI screenshot.
const scene = new URL('../assets/workshop-corridor-refined.png', import.meta.url).href;
const safe=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(s)=>`<img src="${svg(`icons/icon_${s}.svg`)}" alt="" aria-hidden="true">`;
const pct=(v,m)=> Math.max(0, Math.min(100, Math.round(100*(+v||0)/(+m||1))));
const GHOST_LABELS={eye:'鬼眼',hand:'鬼手',cassette:'点名磁带',shadow:'其他厉鬼',resonance:'共鸣'};
function meter(title,val,max,kind){return `<div class="stat-row"><span>${safe(title)}</span><div class="meter ${safe(kind)}" role="progressbar" aria-label="${safe(title)}" aria-valuenow="${val}" aria-valuemax="${max}"><span style="width:${pct(val,max)}%"></span></div><span class="stat-num">${val}/${max}</span></div>`;}
export function mountCombatUI(root, config={}){
 if(!root)throw Error('mountCombatUI needs a root element');
 let data=config.initialData||{skills:[],ghosts:[],player:{},enemy:{}};
 const live=config.mode==='live';
 const ghostLabel=id=>id==='utility'?'普通行动':data.ghosts.find(g=>g.id===id)?.name||GHOST_LABELS[id]||id;
 const initialSkill=()=>data.skills?.find(s=>s.ghostId!=='utility'&&s.status==='available')?.id??data.skills?.find(s=>s.status==='available')?.id??null;
 let state={tab:'all', selected: initialSkill(), query:'', view:'battle', dialog:null, notice:'', events:[], sort:'default',toolsOpen:false,ordinaryOpen:false};
 const getVisible=()=>{
  let list=(data.skills||[]).filter(s=> s.ghostId!=='utility'&&(state.tab==='all'||s.ghostId===state.tab));
  if(state.query.trim())list=list.filter(s=>(s.name+' '+ghostLabel(s.ghostId)).toLowerCase().includes(state.query.trim().toLowerCase()));
  if(state.sort==='source')list=list.slice().sort((a,b)=>String(a.ghostId).localeCompare(String(b.ghostId)));
  return list;
 };
 const selected=()=>data.skills.find(x=>x.id===state.selected)||null;
 const showDialog=(type)=>{state.dialog=type;render();root.querySelector('.dialog-x')?.focus();};
 function render(){
  const p=data.player,e=data.enemy, s=selected();
  const tabs=[{id:'all',label:'全部'},...data.ghosts.filter(g=>!['utility','aid','resonance'].includes(g.id)).map(g=>({id:g.id,label:g.name})),...(data.skills.some(s=>s.ghostId==='resonance')?[{id:'resonance',label:'共鸣'}]:[])];
  const list=getVisible();
  root.innerHTML=`<main class="combat-app">
    <header class="combat-top" style="--frame:url('${svg('panels/combat_header.svg')}')">
      <div class="heading"><span class="battle-name">灵异战斗</span><span class="mission-name">${safe(data.location)}</span></div>
      <div class="round-line"><span>回合 ${safe(String(data.round).padStart(2,'0'))}</span><span class="phase">${safe(data.phase)}</span></div>
      <div class="header-tools">${live?'<span class="demo-pill">真实游戏数据 · 规则结算</span>':`<button type="button" data-do="toggle-expanded" class="quiet-button" aria-label="切换演示技能数量">测试 ${data.skills.length} 项能力 <span aria-hidden="true">↻</span></button><span class="demo-pill">独立 DEMO · 不接存档</span>`}</div>
    </header>
    <section class="battle-stage" aria-label="灵异战斗场景" style="--scene:url('${scene}')">
      <div class="stage-caption" style="--bar:url('${svg('panels/battle_state.svg')}')">
       <span>当前区域：${safe(data.room)}</span><span>战场状态：<b>${safe(data.stageState)}</b></span><span class="risk">${icon('warning')}${safe(data.stageRisk)}</span>
      </div>
      <div class="stage-spotlight" aria-hidden="true"></div>
      <div class="figure fighter-left"><img src="${playerArt}" alt="玩家 Q 版战斗立绘" draggable="false"></div>
      <div class="figure fighter-right"><img src="${ghostArt}" alt="灵异对手立绘（不代表已确认身份）" draggable="false"></div>
      <div class="battle-line" aria-hidden="true"><img src="${svg('effects/fx_suppress_link.svg')}" alt=""></div>
      <div class="battle-feedback" aria-live="polite">${safe(state.notice||data.feedback||(live?'规则遭遇 · 以实际结算日志为准':'当前压制有效（仅视觉示例）'))}</div>
      <article class="battle-hud player-hud" style="--hud:url('${svg('panels/player_hud.svg')}')" aria-label="玩家状态">
       <h2>${safe(p.name)} <span>玩家</span></h2>
       ${meter('生命',p.hp,p.hpMax,'health')}${meter('能量',p.energy,p.energyMax,'energy')}${meter('灵异负荷',p.burden,p.burdenMax,'burden')}
       <div class="hud-note">当前核心鬼：<strong>${safe(p.coreGhost)}</strong></div>${live&&p.spirits?.length?`<details class="revival-list"><summary>逐鬼复苏（${p.spirits.length}）</summary>${p.spirits.map(g=>`<div>${safe(g.name)}：${safe(g.revival)}% · 负荷 ${safe(g.burden)}</div>`).join('')}</details>`:''}
      </article>
      <article class="battle-hud ghost-hud" style="--hud:url('${svg('panels/ghost_hud.svg')}')" aria-label="灵异目标状态">
       <h2>${safe(e.displayName)} <span>${safe(e.risk)}</span></h2>
       <div class="ghost-line">当前状态 <b>${safe(e.status)}</b></div>
       <div class="ghost-line">战斗目标 <b>${safe(e.goal)}</b></div>
       <div class="hud-note">厉鬼不以生命值归零判定击败</div>
      </article>
    </section>
    <section class="battle-console" aria-label="技能与操作区">
      <div class="console-bar">
       <h2>动态厉鬼能力库</h2>
       <nav class="skill-tabs" aria-label="按驾驭厉鬼筛选技能">${tabs.map(t=>`<button type="button" class="skill-tab ${state.tab===t.id?'active':''}" data-tab="${safe(t.id)}" aria-pressed="${state.tab===t.id}">${safe(t.label)}</button>`).join('')}</nav>
       <details class="console-tools" ${state.toolsOpen?'open':''}><summary>筛选</summary><div class="secondary-toolbar"><label><span class="sr-only">搜索能力名称</span><input name="skillSearch" placeholder="搜索技能名称…" value="${safe(state.query)}" autocomplete="off"></label><button type="button" data-do="sort" class="sort-button">排序：${state.sort==='default'?'原顺序':'按来源'}</button></div></details>
       ${data.skills.some(s=>s.ghostId==='utility')?`<details class="ordinary-choice" ${state.ordinaryOpen?'open':''}><summary>普通行动</summary><div class="ordinary-list">${data.skills.filter(s=>s.ghostId==='utility').map(sk=>`<button type="button" data-skill="${safe(sk.id)}" aria-pressed="${state.selected===sk.id}">${safe(sk.name)}${sk.status==='available'?'':' · 条件未满足'}</button>`).join('')}</div></details>`:''}
       <div class="aux-actions"><button type="button" data-do="rules">${icon('rule_book')}查看规律</button><button type="button" data-do="items">${icon('briefcase')}物品</button><button type="button" data-do="retreat">${icon('retreat')}撤离</button></div>
      </div>
      <div class="skills-panel">
       <div class="scroll-frame"><div class="skill-scroll" role="group" aria-label="可选择技能卡">${list.length?list.map(sk=>{
        const inactive=sk.status!=='available';
        const selectedState=state.selected===sk.id;
        return `<button type="button" class="skill-card ${selectedState?'selected':''} ${inactive?'not-ready':''}" data-skill="${safe(sk.id)}" aria-pressed="${selectedState}" aria-label="${safe(sk.name)}, ${inactive?safe(sk.reason):(live?'当前合法':'示例可用')}">
         <b>${safe(sk.name)}</b><small class="skill-source">来源：${safe(ghostLabel(sk.ghostId))}</small>
         <p class="card-description">${safe(sk.description)}</p>
         <div class="card-meta">${safe((live?'能量 ':'演示能量 ')+sk.energy)}</div>
         <span class="card-state ${inactive?'bad':'good'}">${sk.status==='available'?(live?'可使用':'演示可选'):sk.status==='cooldown'?'冷却中':safe(sk.reason.split('；')[0])}</span>
        </button>`;}).join(''):`<div class="empty">${data.ghosts.length?'没有匹配的技能，请调整筛选条件。':'尚未驾驭厉鬼，可从「普通行动」选择观察、避险或物品。'}</div>`}</div></div>
      </div>
      <aside class="skill-inspector" style="--detail:url('${svg('panels/skill_detail.svg')}')" aria-label="选中的技能与操作">
       ${s?`<div class="skill-info"><div><h3>${safe(s.name)}</h3><p>来源：${safe(ghostLabel(s.ghostId))} · ${live?'<span class="demo-inline">主动能力</span>':'<span class="demo-inline">演示占位</span>'}</p><p class="desc">${safe(s.description)}</p></div></div>
        <div class="cost-grid"><span>能量消耗</span><b>${safe(s.energy)}</b><span>${live?'承载负荷变化':'灵异负荷（示例）'}</span><b>${safe('+'+s.burden)}</b><span>${live?'本行动逐鬼预计增长':'逐鬼复苏（分别计算）'}</span><div class="per-ghost">${Object.entries(s.revivalByGhost).map(([id,n])=>`<span>${safe(ghostLabel(id))} <strong>+${n}</strong></span>`).join('')}</div></div>
        <p class="eligibility ${s.status!=='available'?'bad':''}">${safe(s.status==='available'?(live?'使用条件已满足': '组件演示允许选择；正式使用条件由第四步校验'):s.reason)}</p>`
       :`<div class="empty detail-empty">请选择技能以查看其来源、条件及逐鬼代价。</div>`}
      </aside>
      <div class="control-zone"><button class="execute-button" type="button" data-do="execute" ${(!s||s.status!=='available')?'disabled':''}>${icon('blade')}执行行动</button></div>
    </section>
    <div class="legal-footer">${live?'第四步集成 · 能力与消耗读取正式游戏状态；厉鬼不通过生命值归零消灭':'第三步可编辑组件演示 · 本页中的能力、数值、状态与战斗结果均不是游戏正式规则'}</div>
    ${state.dialog?`<div class="modal-backdrop" data-do="close-modal" role="presentation"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button type="button" class="dialog-x" data-do="close-modal" aria-label="关闭弹窗">×</button>${state.dialog==='rules'?`<h2 id="dialog-title">${live?'当前已记录线索':'已确认规律 · 演示'}</h2><p>${live?'只显示角色已经取得的材料，推测不等于已确认的规则。':'本页仅提供战斗界面的资料展开效果，无法验证具体原著规则。'}</p><ul>${e.rules.length?e.rules.map(r=>`<li>${safe(r)}</li>`).join(''):'<li>目前没有已取得的规则材料。</li>'}</ul>`:state.dialog==='items'?`<h2 id="dialog-title">${live?'当前可用物品':'携带物品 · 演示'}</h2><p>${live?safe(data.itemsText||'目前没有可使用物品'):'正式物品清单将在第四步从游戏背包读取。本阶段没有可消耗物品。'}</p>`:`<h2 id="dialog-title">${live?'确认真实撤离':'撤离确认 · 演示'}</h2><p>${live?'撤离会推进真实规则行动并保存证据、消耗和已发生的后果。':'这只会触发预览回调，不会退出副本或修改存档。'}</p><button type="button" data-do="confirm-retreat" class="confirm-btn">${live?'确认撤离':'确认演示撤离'}</button>`}</section></div>`:''}
  </main>`;
 }
 function selectSkill(id){const s=data.skills.find(x=>x.id===id); if(!s)return;state.selected=s.id;state.ordinaryOpen=false;state.notice=s.status==='available'?`已选中「${s.name}」${live?'':'（演示）'}`:`「${s.name}」不可执行：${s.reason}`;render();(root.querySelector(`.skill-card[data-skill="${CSS.escape(id)}"]`)||root.querySelector('[data-do="execute"]'))?.focus();}
 function handleClick(event){
  const summary=event.target.closest('.console-tools>summary,.ordinary-choice>summary');
  if(summary&&root.contains(summary)){event.preventDefault();const tools=summary.parentElement.classList.contains('console-tools');if(tools)state.toolsOpen=!state.toolsOpen;else state.ordinaryOpen=!state.ordinaryOpen;render();root.querySelector(tools?'.console-tools>summary':'.ordinary-choice>summary')?.focus();return;}
  const el=event.target.closest('[data-do],[data-tab],[data-skill]');if(!el||!root.contains(el))return;
  if(el.dataset.tab){state.tab=el.dataset.tab;state.selected=getVisible().find(s=>s.status==='available')?.id??getVisible()[0]?.id??null;render();root.querySelector(`.skill-tab[data-tab="${CSS.escape(state.tab)}"]`)?.focus();return;}
  if(el.dataset.skill){selectSkill(el.dataset.skill);return;}
  const action=el.dataset.do;
  if(action==='toggle-expanded'){if(live)return;data=config.demoToggle?.(data)||data;state.selected=data.skills.find(s=>s.status==='available')?.id||null;state.tab='all';state.query='';state.notice='已切换演示技能数据';render();return;}
  if(action==='sort'){state.sort=state.sort==='default'?'source':'default';render();return;}
  if(action==='rules'||action==='items'||action==='retreat'){showDialog(action);return;}
  if(action==='close-modal'){if(el===event.target||el.classList.contains('dialog-x')){state.dialog=null;render();}return;}
  if(action==='confirm-retreat'){let result=config.onRetreat?.({demo:!live});if(live)return;state.notice=result?.message||'撤离回调已触发（预览）';state.dialog=null;state.events.push({type:'retreat',demo:true});render();return;}
  if(action==='execute'){
   const s=selected();if(!s||s.status!=='available')return;
   const payload={demo:!live, skillId:s.id,skillName:s.name,sourceGhostId:s.ghostId, revivalByGhost:{...s.revivalByGhost},energyCost:s.energy,burdenDelta:s.burden,targetId:live?data.enemy?.id:'demo-target',intent:live?'real-commit':'action-preview'};
   const result=config.onAction?.(payload);
   if(live)return;
   state.events.push({type:'action',payload});state.notice=result?.message||'已生成演示行动事件，未发生真实战斗结算';render();return;
  }
 }
 function onInput(event){if(event.target.matches('[name="skillSearch"]')){
  const sel=event.target.selectionStart;state.query=event.target.value;render();const input=root.querySelector('[name="skillSearch"]');input?.focus();input?.setSelectionRange(sel,sel);
 }}
 function onKeyDown(event){if(event.key==='Escape'&&state.dialog){state.dialog=null;render();}}

 root.addEventListener('click',handleClick);root.addEventListener('input',onInput);document.addEventListener('keydown',onKeyDown);
 render();
 return {getState:()=>({data,state:{...state,events:[...state.events]}}),setData(next){data=next;state.selected=initialSkill();state.tab='all';state.query='';state.notice='';render();},destroy(){root.removeEventListener('click',handleClick);root.removeEventListener('input',onInput);document.removeEventListener('keydown',onKeyDown);root.innerHTML='';}};
}
