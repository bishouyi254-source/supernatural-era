import {g1bLabel} from './g1b-production.js';
import {productionLabel} from './g1a-production.js';
import {historyRecord,settlementCoreToken} from './settlement-save.js';
import {chapterRetryAction} from './settlement-chapters.js';
import {migratePresentationCache} from './settlement-controller.js';
import {mountSettlement} from './settlement-ui/SettlementView.mjs';
import {beginBattleSettlement,advanceBattleSettlement,sessionForSavedGame,settlementForSavedGame} from './settlement-live-adapter.js';
let mountedSettlementUI=null,battleSession=null,recentSettlement=null;
const settlementKey='supernatural-era.settlement-ui.v2';
import {mountCombatUI} from './combat-stage4-ui.js';
import {buildRealCombatData} from './combat-stage4-adapter.js';
let mountedCombatUI=null;
import {installWorldMap} from './world-map/launcher.js';
import {installPublishedSidebar} from './published-sidebar.js';
import {readResonance} from './resonance-model.js';
import {openRelationPreview} from './relation-preview.js';
import {installResonance} from './resonance-launcher.js';
import {installGameCodex} from './codex/live.js';
import {mountLiveBackpack} from './backpack/live.js';
import {readLive} from './backpack/live-model.js';
import {captureWorkshopUI,restoreWorkshopUI} from './workshop-layout.js';
import {workshopView,tacticalView} from './rpg-workshop.js';
import {loopEnabled,loopPages,loopNav,investigationBoard,preparationView,questView,battleView,settlementView,buildControls} from './ui-loop.js';
import {guideView,feedbackView,newcomerView,encounterView,investigationSummary,compactHost,firstContact} from './views-gameplay.js';
import {sceneView,scenePosition,bindScene} from './exploration-scene.js';
import {commitSnapshot} from './snapshot-commit.js';
import {case24Ready} from './contract-case.js';
import {case24View,case24Pages,case24Labels} from './views-contract-case.js';
let case24Page='鬼橱首页';
try{const p=localStorage.getItem('supernatural-era.contract.ui.v1');if(case24Pages.includes(p))case24Page=p;}catch{}
import {transitView,transitPages,transitRisk,transitPrompt,transitLabel} from './views-transit.js';
import {transitReady} from './transit-model.js';
let transitPreview=null,transitPage='公交现场';
const transitUiKey='supernatural-era.transit.ui.v1';try{const p=localStorage.getItem(transitUiKey);if(transitPages.includes(p))transitPage=p;}catch{}
import {identityView,identityPages,identityLabel,identityRisk,identityPrompt} from './views-identity-case.js';
import {identityBusy} from './identity-case.js';
let identityPreview=null;
const identityUiKey='supernatural-era.identity.ui.v1';let identityPage='赵磊事件';try{const p=localStorage.getItem(identityUiKey);if(identityPages.includes(p))identityPage=p;}catch{}
import {postwarView,postwarPages,postwarLabel,postwarRisk,postwarPrompt} from './views-postwar.js';
import {postwarBusy,postwarReady} from './postwar.js';
let postwarPreview=null;
const postwarUiKey='supernatural-era.postwar.ui.v1';let postwarPage='战后大昌市';try{const p=localStorage.getItem(postwarUiKey);if(postwarPages.includes(p))postwarPage=p;}catch{}
import {waitForFinale} from './finale-wait.js';
let finaleWaitPreview=false;
import {finaleView,finalePages,finaleLabel,finaleRisk,finaleRiskPrompt} from './views-finale.js';
import {finaleReady,finaleBusy} from './finale.js';
let finalePreview=null;
const finaleUiKey='supernatural-era.finale.ui.v1';let finalePage='终局现场';try{const v=localStorage.getItem(finaleUiKey);if(finalePages.includes(v))finalePage=v;}catch{}
import {hungryView,hungryPages,hungryLabel,hungryRisk,hungryRiskPrompt} from './views-hungry.js';
import {hungryReady,hungryBusy} from './hungry.js';
import {waitForHungry} from './hungry-wait.js';
let hungryPreview=null,hungryWaitPreview=false;
const hungryUiKey='supernatural-era.hungry.ui.v1';let hungryUi={page:'危机现场',open:[]};try{const saved=JSON.parse(localStorage.getItem(hungryUiKey));if(saved&&hungryPages.includes(saved.page)&&Array.isArray(saved.open))hungryUi={page:saved.page,open:saved.open.filter(v=>typeof v==='string').slice(0,30)};}catch{}
function saveHungryUi(){try{localStorage.setItem(hungryUiKey,JSON.stringify(hungryUi));}catch{}}
import {waitForCityCrisis} from './city-crisis-wait.js';
let crisisWaitPreview=false;
import {crisisView,crisisPages,crisisLabel,crisisRisk,crisisRiskPrompt} from './views-city-crisis.js';
import {crisisReady,crisisBusy} from './city-crisis.js';
let crisisPreview=null;
import {mirrorView,mirrorPages,mirrorLabel,mirrorRisk,mirrorRiskPrompt} from './views-mirror.js';
import {mirrorBusy,mirrorReady} from './mirror.js';
import {canWaitForMirror,waitForMirror} from './mirror-wait.js';
import {canWaitForNotice,waitForRegionalNotice} from './regional-wait.js';
import {regionalView,regionalPages,regionalLabel,regionalRisk,regionalRiskPrompt} from './views-regional.js';
import {regionalBusy,regionalReady} from './regional.js';
import {reunionPages,reunionView,reunionLabel,reunionRisk,reunionRiskPrompt} from './views-reunion.js';
import {reunionReady,reunionBusy} from './reunion.js';
import {dualPages,dualLabel} from './views-dual.js';
import {villageView,villagePages,villageRiskPrompt,villageNeedsConfirm} from './views-village.js';
import {villageBusy} from './village.js';
import {socialView,socialPages,socialLabel} from './views-social.js';
import {socialBusy} from './social.js';
import {mallView,mallPages,mallLabel} from './views-mall.js';
import {dachangView,dachangPages,dachangLabel} from './views-dachang.js';
import {editDachangUI} from './dachang-model.js';
import {dachangReady} from './dachang.js';
import {schoolView,schoolPages,schoolLabel} from './views-school.js';
import {editSchoolUI} from './school-model.js';
import {doorView,doorLabel,doorPages} from './views-door.js';
import {editDoorUI,confirmed} from './investigation-model.js';
import {investigationView,investigationLabel} from './views-investigation.js';
import {evolutionLabel,evolutionView} from './views-evolution.js';
import {advancedBusy} from './evolution-model.js';
import {busCheckpointKey,captureBusCheckpoint} from './bus-saves.js';
import {busBusy} from './bus.js';
import {busLabel,busView,busArchiveView,busNetworkView} from './views-bus.js';
import { events, backgrounds } from './content.js';
import { newGame, act as engineAct, available, knowledge, validate, migrateLegacy,upgrade } from './engine.js';
import {spendDeathPoint,nextLifeOptions} from './character-potential.js';
import {fiveTraitInputs,characterPotentialView,deathPotentialView} from './character-potential-ui.js';
import { hostState, revivalStage, suppressionFor, growthFor } from './spirits.js';
import { attachChapter, chapterState, chapterTitle, stages, routes, chapterLabels, chapterDescription, backgroundHints } from './chapter.js';
import {eventUnlocked} from './journey.js';
import {cdLabel,journeyView,combatView,growthView,secondView,inventoryView,cdMap,deathView} from './views-cd.js';
import {efLabel,cityView,advancedView,releaseView} from './views-ef.js';
import {v1Label,buildView,resourcesView,domainView,combatMenu} from './views-v1.js';
import {knowledgeState,safeAutoAction,hostProfile,activeIds} from './v1.js';
const key = 'supernatural-era.prototype.v2', legacyKey = 'supernatural-era.prototype.v1';
let state = null, notice = '', tab = location.pathname.endsWith('/backpack-live.html')?'拼图背包':new URLSearchParams(location.search).get('view')==='workshop'?'技能工坊':new URLSearchParams(location.search).get('view')==='supplies'?'背包与装备':new URLSearchParams(location.search).get('view')==='archives'?'灵异档案':new URLSearchParams(location.search).get('view')==='history'?'历史':'首页', pendingImport=null, selectedSpiritId=null, workshopFilter='all';
let helpOpen=false,playPreview=null,viewingHistoryId=null,lastCommittedState=null;
function act(s,a){
 const next=engineAct(s,a);
 if(next===s){notice='该行动当前不可执行，未扣资源、未推进。请查看当前目标与合法选择。';return next;}
 viewingHistoryId=null;
 if(next.settlement?.latestId){tab='现场';window.scrollTo({top:0,left:0,behavior:'instant'});}
 return next;
}
let mirrorPreview=null,mirrorWaitPreview=false;
let regionalPreview=null, regionalWaitPreview=false;
let socialPerson='yan', socialPreview=null, hgPreview=null, reunionPreview=null;
let display={large:false,low:false};try{const p=JSON.parse(localStorage.getItem('supernatural-era.preferences.v1'));if(p&&typeof p.large==='boolean'&&typeof p.low==='boolean')display=p;}catch{}
const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
try {
  const saved = localStorage.getItem(key);
  if (saved) {
      const parsed = JSON.parse(saved);
      if (!validate(parsed)) throw Error('无效的原存档');
      state = upgrade(parsed);
      if (!parsed.settlement) {
        let cache=null;
        try{cache=JSON.parse(localStorage.getItem(settlementKey)||'null');}catch{}
        state=migratePresentationCache(state,cache);
      }
      if (!validate(state)) throw Error('升级后的存档无效');
      const needsUpgrade=!parsed.settlement||!parsed.traits&&!parsed.lineage;
      if(needsUpgrade){
        try {
          // The original v2 save is retained before the first Character V1 migration.
          const backupKey=key+'.before-character-v1';
          if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,saved);
          localStorage.setItem(key,JSON.stringify(state));
        }catch{notice='旧存档已读取，但自动升级未能完整保存。原始存档保留，请先导出副本。';}
      }
      lastCommittedState=state;
    }
  if (!saved && localStorage.getItem(legacyKey)) notice = '发现旧版混合字段存档。可保留原副本并明确转换；新复苏按试验初始值重建，不是无损恢复。';
} catch { notice = '现有存档无法读取，原始内容未覆盖。可先导出原始存档，再创建新角色。'; }
// Core save owns history and the unfinished session; cache is a disposable mirror.
function syncSettlementUi(){battleSession=state?.settlement?.active||null;recentSettlement=state?.settlement?.records.find(r=>r.id===state.settlement.latestId)||null;}
function saveSettlementUi(){syncSettlementUi();try{if(!state||localStorage.getItem(key)!==JSON.stringify(state))return;localStorage.setItem(settlementKey,JSON.stringify({session:battleSession,record:recentSettlement}));}catch{}}
function resetSettlement(){viewingHistoryId=null;syncSettlementUi();saveSettlementUi();}
syncSettlementUi();saveSettlementUi();
function liveSettlement(){
 if(!state||pendingImport)return null;
 try{if(localStorage.getItem(key)!==JSON.stringify(state))return null;}catch{return null;}
 if(viewingHistoryId)return historyRecord(state,viewingHistoryId);
 if(!recentSettlement?.chapterKey&&!['首页','现场','第二鬼'].includes(tab))return null;
 return settlementForSavedGame(recentSettlement,state);
}
function persist() {
  try { localStorage.setItem(key, JSON.stringify(state)); notice = '进度已保存到此浏览器。';lastCommittedState=state;saveSettlementUi(); const anchorKey=busCheckpointKey(state);if(anchorKey){try{let copies={};try{const old=JSON.parse(localStorage.getItem(anchorKey)||'{}');for(const id of ['S1','S2','S3','S4','S5','S6'])if(old?.[id]&&validate(old[id]))copies[id]=old[id];}catch{}localStorage.setItem(anchorKey,JSON.stringify(captureBusCheckpoint(state,copies)));}catch{notice='当前进度已保存，但公交锚点副本保存失败；请导出当前存档。';}} }
  catch {state=lastCommittedState;syncSettlementUi();notice = '保存失败：本次行动未提交，原存档保持；请导出副本。';}
}
function download(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type:'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function busAnchorTools(){const anchorKey=state&&busCheckpointKey(state);if(!anchorKey)return '';try{const copies=JSON.parse(localStorage.getItem(anchorKey)||'{}');return ['S1','S2','S3','S4','S5','S6'].filter(id=>copies[id]&&validate(copies[id])).map(id=>'<button data-bus-anchor="'+id+'">导出公交'+id+'完整存档</button>').join('');}catch{return '';}}
function exportSave() {
  try { download(state ? JSON.stringify(state, null, 2) : localStorage.getItem(key) || localStorage.getItem(legacyKey) || '{}', '灵异时代-存档副本.json'); }
  catch { notice = '无法访问浏览器存档，请检查存储权限。'; render(); }
}
document.addEventListener('click',e=>{if(e.target.closest('[data-g1a-open]'))document.querySelector('.g1a-dialog')?.showModal();if(e.target.closest('[data-g1a-close]'))document.querySelector('.g1a-dialog')?.close();});
function label(action) {
  if(action.startsWith('g1bp:'))return g1bLabel(action);
  if(action.startsWith('g1ap:'))return productionLabel(action);
  if(action.startsWith('g1a:'))return action==='g1a:review-blood-contest'?'研究 身体媒介对抗案例（能量1＋一次世界行动）':'研究已核实案例（一次世界行动）';
  if(action==='eye6:react:7')return '自身重启（紧急反应）';
  if(action.startsWith('cx:'))return case24Labels[action]||'当前鬼橱调查行动';
  if(action.startsWith('tr:'))return transitLabel(action);
  if(action.startsWith('ic:'))return identityLabel(action);
  if(action.startsWith('pw:'))return postwarLabel(action);
  if(action.startsWith('ff:'))return finaleLabel(action);
  if(action.startsWith('he:'))return hungryLabel(action);
  if(action.startsWith('cc:'))return crisisLabel(action);
  if(action.startsWith('gm:'))return mirrorLabel(action);
  if(action.startsWith('reg:'))return regionalLabel(action,state);
  if(action.startsWith('rj:'))return reunionLabel(action,state);
  if(action.startsWith('dual:'))return dualLabel(action,state);
  if(action.startsWith('social:'))return socialLabel(action,state);
  if(action.startsWith('mall:'))return mallLabel(action,state);
 if(action.startsWith('dc:'))return dachangLabel(action,state);
  if(action.startsWith('school:'))return schoolLabel(action,state);
  if(action.startsWith('door:'))return doorLabel(action,state);
  if(action.startsWith('inv:'))return investigationLabel(action);
  const evolution=evolutionLabel(action,state);if(evolution)return evolution;
  const busText=busLabel(action,state);if(busText)return busText;
  const v1=v1Label(action,state);if(v1)return v1;
  const ef=efLabel(action,state);if(ef)return ef;
  const cd=cdLabel(action,state);if(cd)return cd;
  if (action.startsWith('chapter:')) return chapterLabels[action.slice(8)];
  if (action.startsWith('enter:')) return events[action.slice(6)].title;
  if (action.startsWith('clue:')) return events[state.scene].clues.find(c => c.id === action.slice(5)).label;
  if (action === 'theory:true') return knowledge(state,state.scene).clues.includes('witness') && knowledge(state,state.scene).clues.includes('power') ? '推测：' + events[state.scene].hypothesis : '检验当前线索的推测';
  if (action === 'theory:false') return knowledge(state,state.scene).clues.includes('witness') && knowledge(state,state.scene).clues.includes('power') ? '推测：' + events[state.scene].falseHypothesis : '检验另一种可能';
  return { rest:'休整一次', practice:'尝试调用灵异', risk:events[state.scene]?.riskyLabel,
    ability:'调用灵异（复苏＋16）', restrict:'执行限制方案（消耗隔离袋×1）', capture:'驾驭：承担负荷与独立复苏',
    seal:'封存：交由安全屋保存', aid:'援助：建立联系（2次有限调用）', retreat:'撤回安全屋', suppress:'紧急压制（身体状态－20）', abandon:'放弃厉鬼并紧急封存' }[action];
}
function dossier() {
  return Object.entries(events).filter(([,e])=>!e.acquisitionLocked).map(([id, e]) => {
    const k = knowledge(state, id); if (!k.clues.length) return `<article><h3>未建立档案</h3><p>调查对应现场后获得信息。</p></article>`;
    return `<article><span class="stamp">${esc(e.source)}</span><h3>${esc(e.title)}</h3><p>知识状态：${knowledgeState(state,id).level} / ${k.clues.length}条线索</p><h4>已确认事实</h4><ul>${e.clues.filter(c => k.clues.includes(c.id)).map(c => `<li>${esc(c.text)}</li>`).join('')}</ul>${k.hypotheses.true === 'confirmed' ? `<h4>${state.v1.certified.includes(id)?'已对照认证':'高可信推测'}</h4><p>${esc(e.hypothesis)}；有记录与对照支持，仍不能视为全场景定律。</p>` : '<p>触发规律尚未通过对照确认。</p>'}${k.hypotheses.false === 'disproved' ? `<h4>已证明错误</h4><s>${esc(e.falseHypothesis)}</s>` : ''}<p>处理记录：${esc(state.outcomes[id] || '未处理')}</p></article>`;
  }).join('');
}
function navigation(className) {
  const items = [['首页','M3 11l9-8 9 8 M5 10v11h14V10'],['角色','M20 21v-2a7 7 0 0 0-14 0v2 M12 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8'],['地图','M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16'],['灵异档案','M5 3h11l3 3v15H5z M9 9h6 M9 13h6 M9 17h3'],['安全屋','M3 11l9-8 9 8 M5 9v12h14V9 M10 21v-7h4v7'],['历史','M4 5h16 M4 12h16 M4 19h16']];
  return `<nav class="${className}" aria-label="游戏导航">${items.map(([name,path]) => `<button data-tab="${name}" aria-pressed="${tab === name}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg><span>${name === '灵异档案' ? '档案' : name === '行动记录' ? '记录' : name}</span></button>`).join('')}</nav>`;
}
function spiritCards() {
  if (!state.spirits.length) return '<p class="muted">尚未驾驭灵异。</p>';
  return state.spirits.map(g => '<div class="spirit-card"><h3>' + esc(g.name) + '</h3><dl><dt>负荷</dt><dd>' + g.burden + '</dd><dt>复苏</dt><dd>' + g.revivalProgress + '%</dd><dt>状态</dt><dd>' + revivalStage(g.revivalProgress) + '</dd><dt>受到压制</dt><dd>' + Math.round(suppressionFor(state,g)*100) + '%</dd><dt>当前活动</dt><dd>' + esc(g.activityLevel) + '</dd><dt>自然增长</dt><dd>' + growthFor(state,g).toFixed(2) + ' / 节点</dd><dt>调用增长</dt><dd>' + growthFor(state,g,true).toFixed(2) + ' / 次</dd></dl></div>').join('') + (state.compatibility ? '<p class="muted">旧版转换档：复苏已按新试验值重建，旧混合值仅作兼容记录。</p>' : '');
}
function extraView() {
  if (tab === '角色') return `<article class="character-card"><h2>${esc(state.name)}</h2><p>${esc(hostProfile(state).stage)} · ${esc(state.background)}</p><div class="stat-grid"><div><span>身体状态</span><strong>${state.life} / 100</strong></div><div><span>灵异承载</span><strong>${hostState(state).effectiveBurden} / ${hostState(state).hostCapacity}</strong></div><div><span>综合风险</span><strong>${hostState(state).hostRisk}</strong></div><div><span>行动能量</span><strong>${state.energy} / 3</strong></div></div><button data-tab="双鬼结构">查看灵异结构与复核</button>${spiritCards()}<p>${esc(state.spirits[0] ? events[state.spirits[0].sourceId].ability : '通过现场调查、限制与驾驭，建立自己的灵异路线。')}</p>${characterPotentialView(state)}</article>`;
  const allowed = available(state).filter(a => ['rest','retreat','suppress','abandon','chapter:supply'].includes(a));
  return `<article><h2>街区安全屋</h2><p>${state.scene === 'hub' ? '封存与恢复设施仍可使用。休整恢复身体与行动能力，累计复苏不下降。' : '你仍在灵异现场。需要先撤回安全屋，才能休整。'}</p><div class="actions">${allowed.map(a => `<button data-action="${a}">${esc(label(a))}</button>`).join('')}</div><p>本章剩余补给额度：${chapterState(state).supplyCredits}；隔离袋最多持有2份。</p><h3>处理记录</h3>${Object.entries(state.outcomes).map(([id,result]) => `<p>${esc(events[id].spirit)}：${esc(result)}</p>`).join('') || '<p class="muted">暂无封存、驾驭或援助记录。</p>'}</article>`;
}

function buttons(actions) { return '<div class="actions">'+actions.map(a=>'<button data-action="'+a+'" class="'+(a==='risk'||a==='chapter:risk'||a==='abandon'?'danger':'')+'">'+esc(label(a))+'</button>').join('')+'</div>'; }
const cdButtons=prefix=>buttons(available(state).filter(a=>!prefix||a.startsWith(prefix)));
function chapterView() {
 if(state.school)return schoolView(state,'七中现场');
 const c=chapterState(state); return '<article class="chapter-detail"><span class="stamp">原著节点 / 玩家路线为游戏改编</span><h2>'+chapterTitle+'</h2><ol class="stages">'+stages.map((n,i)=>'<li class="'+(c.stage===i?'active':'')+'">'+n+'</li>').join('')+'</ol><p>'+esc(chapterDescription(state))+'</p><p class="muted">'+esc(backgroundHints[state.background])+'</p>'+buttons(available(state).filter(a=>a.startsWith('chapter:')&&a!=='chapter:supply'))+'<p>当前路线：'+esc(routes[c.route]||'尚未选择')+' · 救援：'+(c.rescued?'已接应':'未接应')+'</p></article>';
}
function mapView() {
 if(state.dachang.started)return dachangView(state,'城市生活')+'<article><h2>保留的历史与独立案例</h2><button data-tab="七中记录">七中历史地点</button><button data-tab="双鬼结构">双鬼结构与个人复核</button><button data-tab="城市回归">城市后续 · 同学联络与案件</button><button data-tab="黄岗村现场">黄岗村 · 现场与交接</button><button data-tab="公寓现场">C-017 · 无人应答</button><button data-tab="异常道路">交通记录（按已有条件）</button></article>';
 if(busBusy(state))return busView(state,cdButtons);
 const c=chapterState(state); return '<article><h2>城市与高级事件</h2><button data-tab="黄岗村现场">黄岗村 · 现场与交接</button><button data-tab="公寓现场">C-017 · 无人应答</button><button data-tab="异常道路">异常道路与交通记录</button><button data-tab="X档案">X档案</button><button data-tab="灵异网络">灵异网络</button><button data-tab="城市事件">饿死鬼城市事件</button><button data-tab="高级路线">高级路线</button></article>'+cdMap(state)+'<article><h2>大昌市 · 行动地图</h2><div class="map-grid"><button data-tab="剧情" class="map-node">七中 / '+stages[c.stage]+'</button><button data-tab="安全屋" class="map-node">街区安全屋 / 补给与恢复</button>'+Object.entries(events).filter(([id])=>!['watch','door'].includes(id)).map(([id,e])=>'<div class="map-node"><h3>'+esc(e.title)+'</h3><p>'+esc(state.outcomes[id]|| (eventUnlocked(state,id)?'可进入':'前置章节/节点尚未完成'))+'</p>'+buttons(available(state).filter(a=>a==='enter:'+id))+'</div>').join('')+'</div></article>';
}
function npcView() {
 if(state.school.started)return schoolView(state,'幸存小组');
 const c=chapterState(state);return '<article><h2>人物观察档案</h2><h3>周正</h3><p>'+(!c.npcObservations.includes('zhou')?'未建立观察档案。':c.route==='inside'?'已观察：临时安全讲课者。异常外观不等于已掌握完整能力。':'间接记录：讲课信息由通联点转交；身体状态未观察。')+'</p><h3>王珊珊 / 张伟</h3><p>原著人物，具体联系尚未观察；不凭玩家阅读知识生成能力或信任。</p><h3>杨间</h3><p>'+(c.npcObservations.includes('yang')?'已接触：学校脱离后的幸存者。其正史灵异实例与玩家分开。':'未建立观察档案；世界历史不自动认证为角色知识。')+'</p><p class="muted">能力详情只随观察与证据开放。</p></article>';
}
function settlementHistoryView(){
 const meta=state.settlement,rows=meta?.records||[];
 return '<article><h2>结算历史</h2><p>'+esc(state.name)+' · 已保存 '+rows.length+' 条</p>'+
 (meta?.legacyHistory==='unavailable'?'<p>旧存档未保存的历史不可恢复；这里只显示已有记录。</p>':'')+
 (meta?.prunedCount?'<p>较早的 '+meta.prunedCount+' 条摘要已按保存容量裁剪。</p>':'')+
 (meta?.active?'<p>当前遭遇仍在进行，尚未写入完成历史。</p>':'')+
 (rows.length?rows.slice().reverse().map(r=>'<button data-settlement-history="'+esc(r.id)+'">'+esc(r.encounter)+' · '+esc(r.resultLabel||r.outcome)+' · 行动 '+r.sourceTick+'</button>').join(''):'<p>暂无可恢复的结算历史。</p>')+
 '<button data-tab="历史">返回原行动记录</button></article>';
}
function historyView() {
 if(state.school.started)return schoolView(state,'七中记录')+'<article><h2>个人行动记录</h2>'+state.journal.map(t=>'<p>'+esc(t)+'</p>').join('')+'</article>';
 const c=chapterState(state);return '<div class="history-grid"><article><h2>世界历史</h2><p class="muted">叙事层记录，不代表角色已知信息。</p>'+ ([...c.worldHistory,...state.journey.worldHistory].map(x=>'<p>'+esc(x.text)+'</p>').join('')||'<p>世界节点尚未推进。</p>')+'</article><article><h2>个人历史</h2>'+([...c.personalHistory,...state.journey.personalHistory].map(x=>'<p>'+esc(x)+'</p>').join('')||'<p>尚未介入。</p>')+'</article></div><article><h2>行动记录</h2><ol class="journal">'+state.journal.map(j=>'<li>'+esc(j)+'</li>').join('')+'</ol></article>';
}
function homeView() {
 if(reunionReady(state)&&!reunionBusy(state)&&state.scene==='hub')return '<article><h2>黄岗村之后 · 大昌市</h2><button data-tab="城市回归">城市回归与同学联络</button><button data-tab="城市生活">原有城市生活</button></article>'+dachangView(state,'城市生活');
 if(dachangReady(state)&&state.scene==='hub'&&!state.school.active&&!state.doorCase.active&&!state.investigation.active&&!state.journey.active&&!state.city.active&&!busBusy(state)&&!state.combat&&!state.crisis&&!advancedBusy(state))return dachangView(state,'城市生活');
 const c=chapterState(state);const playable=available(state).filter(a=>a.startsWith('school:')||a==='chapter:supply');return '<div class="home-grid"><section class="home-left"><div class="game-title"><h1>神秘复苏</h1><p>灵异时代</p><small>当灵异再次苏醒，世界不再属于人类。</small></div><article class="chapter-cover"><span class="stamp">当前章节</span><h2>'+chapterTitle+'</h2><p>'+stages[c.stage]+'</p><p class="muted">'+esc(routes[c.route]||'校内旁观 / 校外接应')+'</p><progress value="'+c.stage+'" max="5"></progress><button data-tab="剧情">查看章节与行动</button></article><div class="locked-chapters"><p>第二章 · 街区调查 <span>'+(c.completed?'已开放':'本章结束后开放')+'</span></p><p>商场 / 黄岗村 <span>已接入 / 按章节开放</span></p></div></section><div class="hero-space" aria-label="灵异城市与调查者概念立绘"></div><section class="home-right"><article class="event-banner"><span>第一章</span><h2>七中之夜</h2><p>在黑暗中，先确认你知道什么。</p></article><article class="task-panel"><h2>当前行动</h2><p><span class="quest-tag">章节</span> '+stages[c.stage]+'</p><p><span class="quest-tag">个人</span> '+(state.spirits.length?'已驾驭 '+esc(state.spirits[0].name):'普通人 / 未驾驭灵异')+'</p><p><span class="quest-tag">档案</span> 人物观察 '+(state.school.started?Number(state.school.evidence.some(e=>e.id==='Z-01'))+Number(state.school.evidence.some(e=>['Y-01','Y-02'].includes(e.id))):c.npcObservations.length)+' / 2</p></article>'+ (busBusy(state)?'<button class="start-button" data-tab="异常道路">继续异常交通旅程</button>':state.combat?'<button class="start-button" data-tab="现场">继续规则遭遇</button>':state.journey.active?'<button class="start-button" data-tab="后续章节">继续当前章节</button>':state.crisis?buttons(available(state)):playable.length?'<button class="start-button" data-tab="'+(state.school.playerEscaped?'七中记录':'七中现场')+'">'+(state.school.playerEscaped?'查看七中记录':'进入七中调查')+'</button>':'<button class="start-button" data-tab="地图">进入街区调查</button>')+'<button data-tab="后续章节">商场 · 俱乐部 · 黄岗村</button><button data-tab="城市事件">饿死鬼 · 城市事件</button><button data-tab="更新与显示">版本与显示设置</button><button data-tab="安全屋">返回安全屋</button></section></div>';
}
function socialRiskPrompt(a){const id=a==='social:domain'?state.spirits.find(g=>g.sourceId==='eye')?.id:a.startsWith('social:asset:probe:')?a.slice(19):a.startsWith('social:cast:')?a.slice(12):null,g=state.spirits.find(g=>g.id===id);return g?g.name+'当前复苏 '+g.revivalProgress+'%【'+revivalStage(g.revivalProgress)+'】；本次调用按当前条件增长约 '+(growthFor(state,g,true)+(a==='social:domain'?6+state.v1.eye.layer*2:0)).toFixed(2)+'%，消耗能量1并留下目击，可能引起其他驭鬼者反应。是否实际调用？':'当面威胁可能引起对方灵异回应和失控，历史披露会保留。是否继续？';}
function hgConfirmation(){return hgPreview&&available(state).includes(hgPreview)?'<article class="danger" role="region" aria-label="高风险操作确认"><h2>确认本次高风险操作</h2><p>'+esc(hgPreview.startsWith('dual:stress:')?'高强度验证消耗能量2、身体4、对应鬼额外复苏4，另按实际调用增长；可能破坏平衡，是否执行？':villageRiskPrompt(state,hgPreview))+'</p><p>查看与取消不推进时间、不扣资源。</p><button data-hg-confirm>确认执行本次操作</button><button data-hg-cancel>取消，保持当前状态</button></article>':'';}
function workspaceView() {
  if(state?.systems?.death==='committed'&&tab!=='结算历史'&&!viewingHistoryId)return deathPotentialView(state)+'<details class="potential-death-legacy"><summary>查看原有死亡状态说明</summary>'+deathView(state,cdButtons)+'</details>';
 if(tab==='结算历史'&&!viewingHistoryId)return settlementHistoryView();
 if(liveSettlement())return '<div id="live-settlement-root" class="page" aria-label="真实战斗结算"></div>';
 if(state.combat&&state.systems.death!=='alive')return deathView(state,cdButtons);
 if(state?.combat&&['首页','现场'].includes(tab))return '<div class="real-combat-root" id="real-combat-root" aria-label="战斗中"></div>';
 if(sessionForSavedGame(battleSession,state)&&state.systems.second?.sourceId===battleSession.eventId&&['首页','现场','第二鬼'].includes(tab)&&!state.combat){
  return secondView(state,cdButtons)+buttons(available(state).filter(a=>['rest','chapter:supply','suppress','abandon'].includes(a)||a.startsWith('abandon:')));
 }
 if(loopEnabled(state)){
  if(tab==='调查板')return investigationBoard(state,label);
  if(tab==='出战准备')return preparationView(state,label);
  if(tab==='任务追踪')return questView(state,label);
  if(tab==='技能工坊')return workshopView(state,available(state),label,false,selectedSpiritId,workshopFilter);
  if(tab==='构筑')return workshopView(state,available(state),label,false,selectedSpiritId,workshopFilter)+buildControls(state,available(state),label);
  if(state.combat&&['首页','现场'].includes(tab))return battleView(state,label,playPreview);
  if(state.scene==='hub'&&state.outcomes.echo&&['首页','现场'].includes(tab))return settlementView(state,label);
 }
 if(state.scene==='hub'&&state.outcomes.echo&&['首页','现场'].includes(tab))return '<article><h2>接线室结算 · '+esc(state.outcomes.echo)+'</h2><p>现场证据 '+(state.knowledge.echo?.clues.length||0)+'条；剩余容器 '+state.bags+'；身体 '+state.life+'。限制与处置已经记录，厉鬼没有死亡，未获得击杀经验。</p><button data-tab="技能工坊">查看技能与逐鬼代价</button>'+buttons(available(state).filter(a=>['school:start','school:outside','rest'].includes(a)))+'</article>';

 if(tab==='技能工坊')return workshopView(state,available(state),label,false,selectedSpiritId,workshopFilter);
 if(tab==='背包与装备')return '<article><button data-tab="拼图背包">打开厉鬼拼图背包</button></article>'+workshopView(state,available(state),label,true);
 if(state.systems.death==='alive'&&!state.crisis&&state.scene==='echo'&&!state.combat&&state.phase!=='限制'&&['首页','现场'].includes(tab))return preparationView(state,label);
 if(state.systems.death==='alive'&&!state.crisis){
  if(!state.school.started&&!state.dachang.started&&!state.investigation.active&&tab==='角色')return '<article><h2>技能与装备</h2><button data-tab="技能工坊">技能工坊</button><button data-tab="背包与装备">背包与装备</button></article>'+ '<article><h2>当前身份与能力</h2><p>先学习调查、道具与撤离。驾驭必须由你主动选择；不会因为完成教程自动获得技能。</p></article>'+compactHost(state)+characterPotentialView(state)+spiritCards();
  if(firstContact(state)&&tab==='首页')return newcomerView(state,label);
  if(state.investigation.active&&tab==='调查现场')return encounterView(state,label,playPreview);
  if(state.scene==='hub'&&state.investigation.resolution&&!state.school.started&&['首页','调查现场','调查档案'].includes(tab))return investigationSummary(state,label)+'<details><summary>展开原有调查档案与历史</summary>'+investigationView(state,'调查档案')+'</details>';
  if(state.combat&&tab==='现场')return (playPreview?'':tacticalView(state,available(state),label))+encounterView(state,label,playPreview)+combatView(state,()=> '');
 }
 if(case24Ready(state))return case24View(state,case24Pages.includes(tab)?tab:'鬼橱首页');
 if(transitReady(state)&&state.bus.transit.completed&&!case24Ready(state))return '<article><h2>当前宿主需要处理</h2><p>档案与契约保留，先处理自身危机或失控。没有传送回公交。</p>'+buttons(available(state))+'</article>';
 if(transitReady(state))return transitPreview?'<article class="rescue-confirm"><h2>确认本次交通行动</h2><p>'+esc(transitPrompt(state,transitPreview))+'</p><button data-transit-confirm>确认执行</button><button data-transit-cancel>取消，保持原状</button></article>':transitView(state,transitPages.includes(tab)?tab:'公交现场');
 if(identityBusy(state)&&state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state))return identityPreview?'<article class="rescue-confirm"><h2>确认这次调查</h2><p>'+esc(identityPrompt(state,identityPreview))+'</p><p>预览和取消不推进时间、不消耗资源。</p><button data-identity-confirm>确认执行</button><button data-identity-cancel>取消，保持原状</button></article>':identityView(state,identityPages.includes(tab)?tab:'赵磊事件');
 if(postwarBusy(state)&&state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state))return postwarPreview?'<article class="rescue-confirm"><h2>确认这次行动</h2><p>'+esc(postwarPrompt(postwarPreview))+'</p><button data-postwar-confirm>确认执行</button><button data-postwar-cancel>取消，保持原状</button></article>':postwarView(state,postwarPages.includes(tab)?tab:'战后大昌市');

 if(finaleReady(state)&&state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(finaleBusy(state)||finalePages.includes(tab)))return finaleWaitPreview?'<article class="rescue-confirm"><h2>逐次等候进展？</h2><p>最多12次真实行动；新章节、方案、复苏阶段或风险变化时停止。每次结算世界时间与自然复苏。</p><button data-finale-wait-confirm>确认逐次等候</button><button data-finale-cancel>取消，保持原状</button></article>':finalePreview?'<article class="rescue-confirm"><h2>确认灵异调用</h2><p>'+esc(finaleRiskPrompt)+'</p><button data-finale-confirm>确认执行</button><button data-finale-cancel>取消，保持原状</button></article>':finaleView(state,finalePages.includes(tab)?tab:'终局现场');
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(hungryBusy(state)||hungryPages.includes(tab)))return hungryWaitPreview?'<article class="rescue-confirm"><h2>等候下一条进展？</h2><p>最多12次实际行动，逐次结算世界和每只鬼；新场景、消息、风险变化时停止。燃烛时不可自动等候。</p><button data-hungry-wait-confirm>确认逐次等候</button><button data-hungry-cancel>取消</button></article>':hungryPreview&&available(state).includes(hungryPreview)?'<article class="rescue-confirm"><h2>确认本次危机行动</h2><p>'+esc(hungryRiskPrompt(state,hungryPreview))+'</p><p>预览与取消不推进时间、不扣资源。</p><button data-hungry-confirm>确认执行</button><button data-hungry-cancel>取消，保持原状</button></article>':hungryView(state,hungryPages.includes(tab)?tab:'危机现场');
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(crisisBusy(state)||crisisPages.includes(tab)))return crisisWaitPreview?'<article class="rescue-confirm"><h2>等候下一条进展？</h2><p>最多12次真实行动，逐次结算世界时间与每只鬼的复苏；新进展或风险变化即停止。</p><button data-crisis-wait-confirm>确认逐次等候</button><button data-crisis-cancel>取消，保持当前状态</button></article>':crisisPreview&&available(state).includes(crisisPreview)?'<article class="rescue-confirm"><h2>确认本次城市行动</h2><p>'+esc(crisisRiskPrompt(state,crisisPreview))+'</p><p>查看和取消不推进时间、不扣材料。</p><button data-crisis-confirm>确认执行</button><button data-crisis-cancel>取消，保持当前状态</button></article>':crisisView(state,crisisPages.includes(tab)?tab:'城市态势');
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(mirrorBusy(state)||mirrorPages.includes(tab)))return mirrorWaitPreview?'<article class="rescue-confirm"><h2>等候下一条进展？</h2><p>最多12次实际行动，每次照常结算世界与单鬼复苏；新事件或危机会立即停止。</p><button data-mirror-wait-confirm>确认逐次等候</button><button data-mirror-cancel>取消，保持当前状态</button></article>':mirrorPreview&&available(state).includes(mirrorPreview)?'<article class="rescue-confirm"><h2>确认本次调查行动</h2><p>'+esc(mirrorLabel(mirrorPreview))+'</p><p>'+esc(mirrorRiskPrompt(mirrorPreview))+'</p><p>预览与取消不推进时间、不扣资源。</p><button data-mirror-confirm>确认执行调查行动</button><button data-mirror-cancel>取消，保持当前状态</button></article>':mirrorView(state,mirrorPages.includes(tab)?tab:'古宅现场');
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(regionalBusy(state)||regionalPages.includes(tab)))return (regionalWaitPreview?'<article class="rescue-confirm" role="region" aria-label="等候进展确认"><h2>等候现场进展？</h2><p>最多连续等候12次实际行动。每次都会推进世界并结算你体内厉鬼的自然复苏；不是休整，也不会回档。遇到新进展、风险升高或异常变化就停止。</p><button data-regional-wait-confirm>确认等候进展</button><button data-regional-cancel>取消，保持当前状态</button></article>':regionalPreview&&available(state).includes(regionalPreview)?'<article class="rescue-confirm" role="region" aria-label="区域救援操作确认"><h2>确认本次区域行动</h2><p>'+esc(regionalLabel(regionalPreview,state))+'</p><p>'+esc(regionalRiskPrompt(state,regionalPreview))+'</p><p>预览与取消不推进时间、不扣资源。</p><button data-regional-confirm>确认执行区域行动</button><button data-regional-cancel>取消，保持当前状态</button></article>':regionalView(state,regionalPages.includes(tab)?tab:'区域救援'));
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(reunionBusy(state)||reunionPages.includes(tab)))return (reunionPreview&&available(state).includes(reunionPreview)?'<article role="region" aria-label="城市高风险确认"><h2>确认本次对抗或保护</h2><p>'+esc(reunionLabel(reunionPreview,state))+'。'+esc(reunionRiskPrompt(state,reunionPreview))+'</p><button data-reunion-confirm>确认执行城市操作</button><button data-reunion-cancel>取消，保持当前状态</button></article>':'')+reunionView(state,reunionPages.includes(tab)?tab:'城市回归');
 if(dualPages.includes(tab)&&state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state))return hgConfirmation()+villageView(state,tab);
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(villageBusy(state)||villagePages.includes(tab)))return hgConfirmation()+villageView(state,villagePages.includes(tab)?tab:'黄岗村现场');
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(socialBusy(state)||socialPages.includes(tab)))return (state.cityCrisis.organization.leader==='DEAD'?'<article><h2>旧俱乐部经营已中断</h2><p>旧交易停止；既有联系人和已成交历史保留。具体变动需核实。</p><button data-tab="组织变更">查看组织变更</button></article>':'')+socialView(state,socialPages.includes(tab)?tab:'小强俱乐部',{person:socialPerson,preview:socialPreview});
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(state.mall.active||mallPages.includes(tab)))return mallView(state,mallPages.includes(tab)?tab:'商场现场');
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&!state.school.active&&!state.doorCase.active&&!state.investigation.active&&!state.journey.active&&!state.city.active&&!busBusy(state)&&!state.combat&&(dachangPages.includes(tab)||state.dachang.started&&tab==='安全屋'))return dachangView(state,dachangPages.includes(tab)?tab:'城市生活');
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(state.school.active||schoolPages.includes(tab)))return schoolView(state,schoolPages.includes(tab)?tab:'七中现场');
 if(state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)&&(state.doorCase.active||doorPages.includes(tab)))return doorView(state,doorPages.includes(tab)?tab:'公寓现场');
 if(state.systems.death!=='alive')return deathView(state,cdButtons)+buttons(available(state).filter(a=>a.startsWith('evo:host:')));
 if(['规则压制','平衡网络','宿主结构','主导与驾驭'].includes(tab)||advancedBusy(state))return evolutionView(state,cdButtons,['规则压制','平衡网络','宿主结构','主导与驾驭'].includes(tab)?tab:'规则压制');
 if(state.investigation.active||['调查现场','调查推理','调查档案','调查人物','调查灵异'].includes(tab))return investigationView(state,['调查现场','调查推理','调查档案','调查人物','调查灵异'].includes(tab)?tab:'调查现场');
 if(tab==='X档案')return busArchiveView(state);
 if(tab==='灵异网络')return busNetworkView(state);
 if(tab==='异常道路'||busBusy(state))return busView(state,cdButtons);
 if(state.systems.death!=='alive')return deathView(state,cdButtons);
 if(tab==='构筑')return workshopView(state,available(state),label)+buildView(state,cdButtons);
 if(tab==='阵营与物品')return resourcesView(state,cdButtons);
 if(tab==='鬼域')return domainView(state,cdButtons);
 if(tab==='城市事件')return cityView(state,cdButtons);
 if(tab==='高级路线')return advancedView(state,cdButtons);
 if(tab==='更新与显示')return releaseView();
 if(tab==='后续章节')return state.dachang.started?dachangView(state,'城市生活'):journeyView(state,cdButtons);
 if(tab==='第二鬼')return secondView(state,cdButtons);
 if(state.combat&&tab==='现场')return combatView(state,()=> '')+combatMenu(state,cdButtons);
 if(tab==='首页') return homeView();
 if(tab==='剧情') return chapterView();
 if(tab==='地图') return mapView();
 if(tab==='灵异档案') return npcView()+'<article><h2>后续人物观察</h2><p>严力：'+(state.journey.npcObservations.includes('yan')?'已观察商场合作，完整能力仍需证据。':'未建立直接观察。')+'</p><p>俱乐部：'+(state.journey.npcObservations.includes('club')?'已观察不同驭鬼者的生存策略，未读取后台复苏。':'未建立观察。')+'</p><p>高危情报：'+(state.journey.npcObservations.includes('paper')?'已记录GDD改编交易信息，来源动机不能与事实混同。':'未建立记录。')+'</p></article>'+dossier();
 if(tab==='角色')return '<article><h2>技能与装备</h2><button data-tab="技能工坊">技能工坊</button><button data-tab="背包与装备">背包与装备</button></article><article><h2>生存与信息</h2><button data-tab="生存与复盘">个人生存判断</button><button data-tab="信息暴露">暴露</button></article><article><h2>构筑与鬼域</h2><button data-tab="构筑">构筑与主动规则</button><button data-tab="鬼域">鬼域</button></article>'+extraView()+growthView(state,cdButtons)+'<article><h2>高级成长</h2><button data-tab="规则压制">高级灵异研究</button><button data-tab="高级路线">命运池II与高级路线</button></article>';
 if(tab==='安全屋')return '<article><h2>安全屋管理</h2><button data-tab="阵营与物品">阵营、物品与设施</button><button data-tab="构筑">调整构筑</button></article>'+extraView()+inventoryView(state,cdButtons)+secondView(state,cdButtons);
 if(tab==='历史') return settlementHistoryView()+historyView();
 if(tab==='结算历史')return settlementHistoryView();
 const e=events[state.scene];return '<article><span class="stamp">'+esc(e?.source||'个人路线')+'</span><h2>'+esc(state.crisis?'复苏危机':e?.title||'街区安全屋')+'</h2><p>'+esc(e?.intro||'从地图选择街区调查。')+'</p>'+buttons(available(state))+'</article>';
}

let liveBackpack=null,backpackRoot=null,backpackToken=null;
const worldMapUI=installWorldMap({getState:()=>tab==='拼图背包'?readLive(localStorage).state:state,navigate:page=>{if(page==='厉鬼图鉴'){document.getElementById('game-codex-launcher').click();return;}if(page==='同步共鸣'){resonanceUI.open();return;}tab=page;render();window.scrollTo(0,0);}});
const codexUI=installGameCodex({getState:()=>tab==='拼图背包'?readLive(localStorage).state:state,navigate:page=>{if(page==='地图'){worldMapUI.open();return;}if(page==='同步共鸣'){resonanceUI.open();return;}if(page==='厉鬼图鉴'){document.getElementById('game-codex-launcher').click();return;}tab=page==='背包与装备'?'拼图背包':page;render();window.scrollTo(0,0);}});
const resonanceUI=installResonance({refreshGame:()=>{const current=readResonance(localStorage);state=current.state;notice=current.error||notice;render();},navigate:page=>{if(page==='地图'){worldMapUI.open();return;}if(page==='厉鬼图鉴'){document.getElementById('game-codex-launcher').click();return;}tab=page;render();window.scrollTo(0,0);},onCommitted:next=>{state=next;}});
const publishedSidebar=installPublishedSidebar({navigate:page=>{if(page==='地图'){worldMapUI.open();return;}if(page==='厉鬼图鉴'){document.getElementById('game-codex-launcher').click();return;}if(page==='同步共鸣'){resonanceUI.open();return;}tab=page;render();window.scrollTo(0,0);}});
function render() {
 syncSettlementUi();
 if(mountedSettlementUI){mountedSettlementUI.destroy();mountedSettlementUI=null;}
 if(mountedCombatUI){mountedCombatUI.destroy();mountedCombatUI=null;}
 if(liveBackpack){try{state=readLive(localStorage).state;}catch{notice='存档无法读取，原始内容未覆盖。';}if(tab!=='拼图背包')backpackRoot.remove();}
 codexUI.refresh();
 const isBackpack=tab==='拼图背包';
 document.querySelectorAll('link[data-game-style]').forEach(link=>{if(link.sheet)link.sheet.disabled=isBackpack||state?.systems?.death!=='committed'&&!!liveSettlement();});
 document.querySelectorAll('link[data-backpack-style]').forEach(link=>{if(link.sheet)link.sheet.disabled=!isBackpack;});
 if(isBackpack){
  const root=document.querySelector('#app');root.removeAttribute('data-loop');root.dataset.view=tab;root.dataset.page=tab;
  if(!liveBackpack){backpackRoot=document.createElement('div');backpackRoot.id='live-backpack-root';root.replaceChildren(backpackRoot);liveBackpack=mountLiveBackpack(backpackRoot,{onRefresh(){publishedSidebar.refresh();},navigate(target){if(target==='地图'){worldMapUI.open();return;}if(target==='同步共鸣'){resonanceUI.open();return;}if(target==='厉鬼图鉴'){document.getElementById('game-codex-launcher').click();return;}tab=({'驾驭厉鬼':'技能工坊','物资背包':'背包与装备','档案记录':'历史','厉鬼图鉴':'灵异档案','同步共鸣':'技能工坊'})[target]||'首页';render();window.scrollTo(0,0);if(target==='同步共鸣')document.getElementById('relations')?.scrollIntoView();}});backpackToken=localStorage.getItem(key);}else{root.replaceChildren(backpackRoot);const raw=localStorage.getItem(key);if(raw!==backpackToken){liveBackpack.refresh();backpackToken=raw;}}
  publishedSidebar.refresh();resonanceUI.preload();return;
 }

 const workshopUI=captureWorkshopUI(document.querySelector('#app'));
 document.onkeydown=null;
 if((state?.settlement?.active?.chapterKey==='village'||!state?.settlement?.active&&state?.settlement?.pending?.village)&&state.village.escaped&&!state.village.aftermath.submitted&&['首页','现场'].includes(tab)&&available(state).includes('hg:submit'))tab='撤离与交接';
 if(tab!=='结算历史'&&!viewingHistoryId&&!liveSettlement()){
 if(state&&case24Ready(state)){tab=({'首页':case24Page,'地图':'鬼橱所在地','角色':'尚未完成义务','安全屋':'合法退出规则','灵异档案':'X档案登记','历史':'版本结算'})[tab]||tab;if(!case24Pages.includes(tab))tab='鬼橱首页';}
 if(state&&!case24Ready(state)&&transitReady(state)){tab=({'首页':transitPage,'地图':'当前停站','角色':'宿主维持','安全屋':'离车判断','灵异档案':'车辆规则','历史':'旅程归档'})[tab]||tab;if(!transitPages.includes(tab))tab='公交现场';}
 if(state&&!case24Ready(state)&&!transitReady(state)&&identityBusy(state)&&state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)){tab=({'首页':identityPage,'地图':'古宅地图','角色':'身份五维','安全屋':'本次归档','灵异档案':'红色报纸','历史':'案件时间线'})[tab]||tab;if(!identityPages.includes(tab))tab='赵磊事件';}
 if(state&&!case24Ready(state)&&!identityBusy(state)&&postwarBusy(state)&&state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)){tab=({'首页':postwarPage,'地图':'城市恢复核验','安全屋':'特殊资产交易','角色':'战后构筑','灵异档案':'历史遗留异常','历史':'战后结算'})[tab]||tab;if(!postwarPages.includes(tab))tab='战后大昌市';}

 if(state&&!case24Ready(state)&&!identityBusy(state)&&!postwarBusy(state)&&finaleReady(state)&&state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state)){if(tab==='首页')tab=finalePage;tab=({'地图':'恢复地图','安全屋':'资产结算','角色':'当前构筑','灵异档案':'事件总档案','历史':'因果记录'})[tab]||tab;if(!finalePages.includes(tab))tab='终局现场';}
 if(state&&!case24Ready(state)&&hungryReady(state)&&state.hungry.started&&tab==='首页')tab=hungryUi.page;
 if(state&&!case24Ready(state)&&hungryReady(state)&&state.hungry.started&&state.systems.death==='alive'&&!state.crisis&&!advancedBusy(state))tab=({'首页':'危机现场','地图':'危机地图','安全屋':'临时庇护','角色':'个人灵异','灵异档案':'阶段规律','历史':'危机时间线'})[tab]||tab;
 if(state&&!case24Ready(state)&&hungryBusy(state)&&!hungryPages.includes(tab))tab='危机现场';
 if(state&&!case24Ready(state)&&!hungryBusy(state)&&crisisBusy(state)&&!crisisPages.includes(tab))tab='城市态势';
 if(state&&!case24Ready(state)&&mirrorBusy(state)&&!mirrorPages.includes(tab))tab='古宅现场';
 if(state&&!case24Ready(state)&&regionalBusy(state)&&!regionalPages.includes(tab))tab='区域救援';
 if(state&&!case24Ready(state)&&reunionBusy(state)&&!reunionPages.includes(tab))tab='城市回归';
 if(state&&!case24Ready(state)&&villageBusy(state)&&!villagePages.includes(tab))tab=state.village.phase==='LOST'||state.village.phase==='ESCAPE'?'撤离与交接':'黄岗村现场';
 if(state&&!case24Ready(state)&&socialBusy(state)&&!socialPages.includes(tab))tab=state.social.human.active?'人为传播调查':'小强俱乐部';
 if(state?.mall.active&&!mallPages.includes(tab))tab='商场现场';
 if(state?.school.active&&!state.combat?.nativeSchool&&!schoolPages.includes(tab))tab='七中现场';
  if(state?.doorCase.active&&!doorPages.includes(tab))tab='公寓现场';
  if(state?.investigation.active&&!['调查现场','调查推理','调查档案','调查人物','调查灵异',...loopPages,'技能工坊','背包与装备','构筑'].includes(tab))tab='调查现场';
 }
  document.documentElement.classList.toggle('large-text',display.large);document.documentElement.classList.toggle('low-effects',display.low);
  document.querySelector('#app').dataset.view = tab;
    document.querySelector('#app').dataset.loop = state&&loopEnabled(state)?'true':'false';
    document.querySelector('#app').dataset.page = tab;
  document.querySelector('#app').dataset.settlement = state?.systems?.death!=='committed'&&liveSettlement()?'true':'false';
  document.body.classList.toggle('settlement-active',state?.systems?.death!=='committed'&&!!liveSettlement());
  document.querySelector('#app').dataset.battle = state?.combat&&state.systems.death==='alive'&&['首页','现场'].includes(tab)?'true':'false';
  const header = `<header><span>大昌市 · 灵异调查</span><h1>神秘复苏<span>灵异时代</span></h1><p>0.24.6 · 鬼眼 V6.5.1 · G1-B机制接入 · 探索、战术与技能研究</p></header>`;
  if(pendingImport){document.querySelector('#app').innerHTML=header+'<main class="registration rescue-confirm"><h2>确认导入存档副本</h2><p>将导入：'+esc(pendingImport.name)+'。这会替换本地当前进度；已有进度会先导出备份。</p><button data-import-confirm>确认导入</button><button data-import-cancel>取消，保留当前进度</button></main>';document.querySelector('[data-import-confirm]').onclick=()=>{if(state)download(JSON.stringify(state,null,2),'灵异时代-导入前备份.json');state=upgrade(pendingImport);pendingImport=null;resetSettlement();tab='首页';persist();render();};document.querySelector('[data-import-cancel]').onclick=()=>{pendingImport=null;render();};return;}
  if (!state) {
    document.querySelector('#app').innerHTML = `${header}<main class="registration"><h2>建立接触者档案</h2><p>你还没有驾驭任何厉鬼。背景只影响调查提示。</p><form id="create"><label>称呼<input name="name" maxlength="24" placeholder="未登记"></label><label>此前身份<select name="background">${backgrounds.map(b => `<option>${b}</option>`).join('')}</select></label>${fiveTraitInputs()}<button>建立档案，选择第一起事件</button></form><label class="file">导入已备份的存档<input id="import" type="file" accept=".json,application/json"></label><button data-command="export">导出原始存档副本</button><button data-command="migrate">明确转换旧版存档（保留原副本）</button><p role="status">${esc(notice)}</p></main>`;
    document.querySelector('#create').onsubmit = e => {
      e.preventDefault();
      if (notice.includes('无法读取') && !confirm('原始存档无法读取。创建新角色会替换此原型的本地存档，请先导出副本。是否创建？')) return;
      const data = new FormData(e.target); const bytes = new Uint32Array(1); crypto.getRandomValues(bytes);
      state = newGame(data.get('name'), data.get('background'), bytes[0],crypto.randomUUID(),{heightCm:Number(data.get('heightCm')),weightKg:Number(data.get('weightKg')),age:Number(data.get('age'))});resetSettlement(); persist(); render();
    };
  } else {
    const h=hostState(state);
    document.querySelector('#app').innerHTML = `<div class="topbar"><div class="identity"><span class="avatar" aria-hidden="true"></span><strong>${esc(state.name)}</strong><span>${state.spirits.length?'驭鬼者':'普通人'} / ${esc(state.background)}</span></div><div class="resource-bar"><span>身体 ${state.life}/100</span><span>能量 ${state.energy}/3</span><span>隔离袋 ${state.bags}</span><span>0.24.6 · G1-B机制接入</span><span>风险 ${h.hostRisk}</span></div></div><main class="layout ${tab==='首页'?'home-layout':''}"><aside>${navigation("side-menu")}<h2>宿主状态</h2><dl><dt>灵异承载</dt><dd>${h.effectiveBurden} / ${hostState(state).hostCapacity}</dd><dt>承载状态</dt><dd>${h.carryingState}</dd><dt>总体平衡</dt><dd>${h.balanceState}</dd><dt>综合风险</dt><dd>${h.hostRisk}</dd></dl></aside><section class="workspace"><div class="view-heading">${esc(tab)}</div>${tab==='首页'&&state.village.escaped&&state.spirits.length===2?'<article><h2>个人事务 · 验证新的双鬼平衡</h2><button data-tab="长期复核">查看观察与未验证条件</button></article>':''}${!finaleReady(state)&&hungryReady(state)&&!hungryBusy(state)&&!hungryPages.includes(tab)?'<article><h2>大昌市 · 城市危机</h2><p>先查看当前位置、当前目标与合法行动。</p><button data-tab="危机现场">查看城市危机</button></article>':''}${!hungryReady(state)&&crisisReady(state)&&!crisisBusy(state)&&!crisisPages.includes(tab)?'<article><h2>大昌市 · 地区行动与城市异常</h2><p>查看当前态势、独立协作与外围调查。</p><button data-tab="城市态势">查看城市当前事务</button></article>':''}${!hungryReady(state)&&!crisisBusy(state)&&!crisisPages.includes(tab)&&mirrorReady(state)&&!mirrorBusy(state)&&!mirrorPages.includes(tab)?'<article><h2>古宅与特殊镜面调查</h2><p>新的调查涉及记录、身份与记忆。先查看当前目标。</p><button data-tab="古宅现场">查看古宅调查</button></article>':''}${!hungryReady(state)&&!crisisBusy(state)&&!crisisPages.includes(tab)&&regionalReady(state)&&!regionalBusy(state)&&!regionalPages.includes(tab)&&!mirrorPages.includes(tab)?'<article><h2>城市事务与紧急救援</h2><p>观江花园：独立居住与资产线索；敲门异常：另一区域的应急救援。个人普通住所继续保留。</p><button data-tab="区域救援">查看城市救援行动</button></article>':''}${(case24Pages.includes(tab)||transitPages.includes(tab)||identityPages.includes(tab)||postwarPages.includes(tab)||finalePages.includes(tab)||hungryPages.includes(tab)||crisisPages.includes(tab)||regionalPages.includes(tab)||mirrorPages.includes(tab))?`<p role="status" class="status rescue-feedback">${esc(notice)}</p>`:""}${state.investigation.active&&tab==='调查现场'&&!playPreview?sceneView(state,scenePosition(state.investigation.zone),available(state),label):''}${loopEnabled(state)?loopNav(state,tab):""}${guideView(state,label,helpOpen)}${compactHost(state)}${workspaceView()}${feedbackView(state,label)}${!case24Pages.includes(tab)&&!transitPages.includes(tab)&&!identityPages.includes(tab)&&!postwarPages.includes(tab)&&!finalePages.includes(tab)&&!hungryPages.includes(tab)&&!crisisPages.includes(tab)&&!regionalPages.includes(tab)&&!mirrorPages.includes(tab)?`<p role="status" class="status">${esc(notice)}</p>`:""}</section></main><section class="save-tools"><button data-command="low-effects" aria-pressed="${display.low}">低特效：${display.low?"已开启":"已关闭"}</button><button data-command="export">复制导出存档</button><button data-open-settlement-history>结算历史</button><label class="file">导入存档副本<input id="import" type="file" accept=".json,application/json"></label>${busAnchorTools()}<small>进度仅保存在当前浏览器，请保留备份。公交锚点先导出，再通过导入恢复；会返回整份存档，不是鬼眼重启。</small></section>${navigation("bottom-menu")}`;

  }
  document.querySelectorAll('[data-action]').forEach(b => b.onclick = () => { if(b.dataset.action==='balance:medium'){openRelationPreview({storage:localStorage,action:'balance:medium',title:'修正平衡偏移',className:'rescue-confirm relation-preview',onUnavailable:()=>{notice='当前不能制衡，未扣资源、未推进。';render();},onCommitted:next=>{state=next;lastCommittedState=next;viewingHistoryId=null;saveSettlementUi();notice='制衡已按预览结算并保存。';render();}});return;} if(['inv:respond','inv:capture'].includes(b.dataset.action)||b.dataset.action.startsWith('inv:probe:')||/^combat:(ability|focus|cover):/.test(b.dataset.action)||b.dataset.action==='combat:combo'){playPreview=b.dataset.action;tab=state.investigation.active?'调查现场':state.combat?'现场':tab;render();return;} if(b.dataset.action.startsWith('cx:')){const r=commitSnapshot(state,act(state,b.dataset.action),v=>localStorage.setItem(key,v),validate);state=r.state;if(r.committed){lastCommittedState=state;saveSettlementUi();}notice=r.committed?(state.contractCase.history.at(-1)||'本次行动已保存。'):r.reason==='INVALID'?'校验失败，本次行动未提交。':'保存失败，本次行动未提交；原进度和交付状态保持不变。';render();return;} if(b.dataset.action.startsWith('tr:')&&transitRisk(b.dataset.action)){transitPreview=b.dataset.action;render();return;} if(b.dataset.action.startsWith('ic:')&&identityRisk(b.dataset.action)){identityPreview=b.dataset.action;render();return;} if(b.dataset.action.startsWith('pw:')&&postwarRisk(b.dataset.action)){postwarPreview=b.dataset.action;render();return;} if(b.dataset.action.startsWith('ff:')&&finaleRisk(b.dataset.action)){finalePreview=b.dataset.action;render();return;} if(b.dataset.action.startsWith('he:')&&hungryRisk(b.dataset.action)){hungryPreview=b.dataset.action;render();return;} if(b.dataset.action.startsWith('cc:')&&crisisRisk(b.dataset.action)){crisisPreview=b.dataset.action;render();return;} if(b.dataset.action.startsWith('gm:')&&mirrorRisk(b.dataset.action)){mirrorPreview=b.dataset.action;render();return;} if(b.dataset.action.startsWith('reg:')&&regionalRisk(b.dataset.action)){regionalPreview=b.dataset.action;render();return;} if(b.dataset.action.startsWith('rj:')&&reunionRisk(b.dataset.action)){reunionPreview=b.dataset.action;render();return;} if(['door:experiment:self','door:experiment:knock'].includes(b.dataset.action)&&!confirm('你正在主动满足一个尚未确认的灵异条件，可能产生永久事件结果。是否继续？'))return; if(b.dataset.action==='door:drive'&&!confirm('主动植入将新增负荷24、初始复苏18%。这不会复制源头完整杀人规律。是否继续？'))return; if(b.dataset.action.startsWith('door:share:')&&!confirmed(state.doorCase,b.dataset.action.split(':')[3])&&!confirm('这条判断尚未确认，可能误导对方。仍要明确告知这是推测吗？'))return; if((b.dataset.action.startsWith('social:cast:')||b.dataset.action.startsWith('social:asset:probe:')||b.dataset.action==='social:domain'||b.dataset.action==='social:conflict:threaten')&&!confirm(socialRiskPrompt(b.dataset.action)))return; if(villageNeedsConfirm(state,b.dataset.action)||b.dataset.action.startsWith('dual:stress:')){hgPreview=b.dataset.action;render();return;}hgPreview=null; state = act(state, b.dataset.action);if(b.dataset.action==='school:engage-audio')tab='现场';if(b.dataset.action.startsWith('tr:')){transitPreview=null;if(!transitPages.includes(tab))tab='公交现场';}if(b.dataset.action.startsWith('ic:')){identityPreview=null;if(!identityPages.includes(tab))tab='赵磊事件';}if(b.dataset.action.startsWith('pw:')){postwarPreview=null;notice=state.postwar.history.at(-1)||'行动已结算。';}if(b.dataset.action.startsWith('ff:'))finalePreview=null;if(b.dataset.action.startsWith('he:')){hungryPreview=null;if(!hungryPages.includes(tab))tab='危机现场';}if(b.dataset.action.startsWith('cc:')){crisisPreview=null;tab='城市态势';}if(b.dataset.action.startsWith('gm:')){mirrorPreview=null;tab='古宅现场';}if(b.dataset.action.startsWith('reg:')){regionalPreview=null;tab='区域救援';}if(['rj:start','rj:next','rj:resume'].includes(b.dataset.action))tab=({A:'城市回归',B:'日常偶遇',C:'同学聚会',D:'营救方案',E:'会议与联络',F:'驭鬼者对抗',G:'伴随调查',DONE:'持续案件'}[state.reunion.phase]);if(b.dataset.action==='hg:balance')tab='双鬼结构';if(b.dataset.action.startsWith('hg:'))tab=state.village.phase==='ESCAPE'||state.village.phase==='LOST'||state.village.phase==='AFTERMATH'||state.village.phase==='DONE'?'撤离与交接':villagePages.includes(tab)?tab:'黄岗村现场'; if(b.dataset.action.startsWith('social:')){socialPreview=null;tab=state.social.conflict.active?'冲突意图':socialPages.includes(tab)?tab:'生存与复盘';} if(b.dataset.action.startsWith('mall:'))tab=state.mall.active?(mallPages.includes(tab)?tab:'商场现场'):'商场档案'; if(b.dataset.action.startsWith('dc:')&&(b.dataset.action==='dc:start'||b.dataset.action.startsWith('dc:signal:')))tab='城市生活'; if(b.dataset.action.startsWith('school:')&&b.dataset.action!=='school:engage-audio')tab=state.school.active?(schoolPages.includes(tab)?tab:'七中现场'):'七中记录'; if(b.dataset.action.startsWith('door:'))tab=state.doorCase.active?tab===''?'公寓现场':doorPages.includes(tab)?tab:'公寓现场':'公寓档案'; if(b.dataset.action.startsWith('enter:')||b.dataset.action.startsWith('combat:')) tab='现场';if(b.dataset.action.startsWith('journey:'))tab='后续章节';if(b.dataset.action.startsWith('second:'))tab='第二鬼';if(b.dataset.action.startsWith('city:'))tab='城市事件';if(b.dataset.action.startsWith('advanced:'))tab='高级路线';if(b.dataset.action.startsWith('bus:'))tab='异常道路';if(b.dataset.action.startsWith('inv:'))tab=state.investigation.active?'调查现场':'调查档案'; persist();if(b.dataset.action.startsWith('tr:')&&notice==='进度已保存到此浏览器。')notice=state.bus.transit.history.at(-1)||'本次观察已记录。';if(b.dataset.action.startsWith('ic:')&&notice==='进度已保存到此浏览器。')notice='行动结果：'+state.identityCase.history.at(-1);if(b.dataset.action.startsWith('pw:')&&notice==='进度已保存到此浏览器。')notice='行动结果：'+state.postwar.history.at(-1);if(b.dataset.action.startsWith('ff:')&&notice==='进度已保存到此浏览器。')notice='行动结果：'+state.finale.history.at(-1);if(b.dataset.action.startsWith('he:')&&notice==='进度已保存到此浏览器。')notice='行动结果：'+state.hungry.history.at(-1);if(b.dataset.action.startsWith('cc:')&&notice==='进度已保存到此浏览器。')notice='行动结果：'+state.cityCrisis.history.at(-1);if(b.dataset.action.startsWith('gm:')&&notice==='进度已保存到此浏览器。')notice='行动结果：'+(state.ghostMirror.history.at(-1)||'已完成'); if(b.dataset.action.startsWith('reg:')&&notice==='进度已保存到此浏览器。')notice=b.dataset.action==='reg:wait'?'已等候一次，时间与自身复苏已结算。':'行动结果：'+(state.regional.history.at(-1)||'本次行动已完成。');render(); });
  document.querySelectorAll('[data-potential-allocate]').forEach(b=>b.onclick=()=>{
    const updated=spendDeathPoint(state,b.dataset.potentialAllocate);
    if(updated===state){notice='没有可分配潜质点，或本项已达到上限。';render();return;}
    for(const session of [updated.settlement?.active,...Object.values(updated.settlement?.pending||{})])
      if(session)session.binding=settlementCoreToken(updated);
    if(!validate(updated)){notice='成长校验未通过；原存档保持不变。';render();return;}
    state=updated;persist();render();
  });
  const nextLifeForm=document.querySelector('#potential-next-life');
  if(nextLifeForm)nextLifeForm.onsubmit=e=>{
    e.preventDefault();
    const form=new FormData(nextLifeForm);
    if(!confirm('开始下一轮会重置当前角色的厉鬼、剧情及背包；只继承死亡评价的体质和精神潜质。确认？'))return;
    try{
      const options=nextLifeOptions(state,{heightCm:Number(form.get('heightCm')),weightKg:Number(form.get('weightKg')),age:Number(form.get('age'))});
      const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);
      const next=newGame(form.get('name'),state.background,bytes[0],crypto.randomUUID(),options);
      if(!validate(next))throw Error('下一轮角色未通过校验');
      state=next;resetSettlement();tab='首页';persist();render();
    }catch{notice='创建下一轮失败。死亡存档保持不变，请先导出备份。';render();}
  };
  document.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>{helpOpen=!helpOpen;render();});
  document.querySelectorAll('[data-play-current]').forEach(b=>b.onclick=()=>{tab=state.combat||events[state.scene]?'现场':state.investigation.active||state.investigation.resolution&&!state.school.started?'调查现场':'首页';render();});
  document.querySelectorAll('[data-play-confirm]').forEach(b=>b.onclick=()=>{const a=playPreview;playPreview=null;if(available(state).includes(a)){state=act(state,a);persist();}else notice='条件已经变化，此次操作未执行。';render();});
  document.querySelectorAll('[data-play-cancel]').forEach(b=>b.onclick=()=>{playPreview=null;render();});
  document.querySelectorAll('[data-finale-wait]').forEach(b=>b.onclick=()=>{finaleWaitPreview=true;render();});
  document.querySelectorAll('[data-finale-wait-confirm]').forEach(b=>b.onclick=()=>{finaleWaitPreview=false;const r=waitForFinale(state);state=r.state;persist();notice='已逐次等候'+r.count+'次实际行动；请查看当前进展。';render();});
  document.querySelectorAll('[data-finale-confirm]').forEach(b=>b.onclick=()=>{const a=finalePreview;finalePreview=null;if(a&&available(state).includes(a)){state=act(state,a);persist();notice='行动结果：'+state.finale.history.at(-1);}render();});
  document.querySelectorAll('[data-finale-cancel]').forEach(b=>b.onclick=()=>{finalePreview=null;finaleWaitPreview=false;render();});
  document.querySelectorAll('[data-hungry-wait]').forEach(b=>b.onclick=()=>{hungryWaitPreview=true;render();});
  document.querySelectorAll('[data-hungry-wait-confirm]').forEach(b=>b.onclick=()=>{hungryWaitPreview=false;const r=waitForHungry(state);state=r.state;persist();notice='已逐次等候'+r.count+'次行动；请查看当前目标。';render();});
  document.querySelectorAll('[data-hungry-confirm]').forEach(b=>b.onclick=()=>{const a=hungryPreview;hungryPreview=null;if(a&&available(state).includes(a)){state=act(state,a);persist();if(notice==='进度已保存到此浏览器。')notice='行动结果：'+state.hungry.history.at(-1);}render();});
  document.querySelectorAll('[data-hungry-cancel]').forEach(b=>b.onclick=()=>{hungryPreview=null;hungryWaitPreview=false;render();});
  document.querySelectorAll('[data-hungry-detail]').forEach(d=>{d.open=hungryUi.open.includes(d.dataset.hungryDetail);d.ontoggle=()=>{hungryUi.open=hungryUi.open.filter(v=>v!==d.dataset.hungryDetail);if(d.open)hungryUi.open.push(d.dataset.hungryDetail);saveHungryUi();};});
  document.querySelectorAll('[data-transit-confirm]').forEach(b=>b.onclick=()=>{const a=transitPreview;transitPreview=null;if(a&&available(state).includes(a)){state=act(state,a);persist();notice=state.bus.transit.history.at(-1)||'本次行动已记录。';}render();});
  document.querySelectorAll('[data-transit-cancel]').forEach(b=>b.onclick=()=>{transitPreview=null;render();});
  document.querySelectorAll('[data-identity-confirm]').forEach(b=>b.onclick=()=>{const a=identityPreview;identityPreview=null;if(a&&available(state).includes(a)){state=act(state,a);persist();if(notice==='进度已保存到此浏览器。')notice=state.identityCase.history.at(-1);}render();});
  document.querySelectorAll('[data-identity-cancel]').forEach(b=>b.onclick=()=>{identityPreview=null;render();});
  document.querySelectorAll('[data-postwar-confirm]').forEach(b=>b.onclick=()=>{const a=postwarPreview;postwarPreview=null;if(a&&available(state).includes(a)){state=act(state,a);persist();if(notice==='进度已保存到此浏览器。')notice=state.postwar.history.at(-1);}render();});
  document.querySelectorAll('[data-postwar-cancel]').forEach(b=>b.onclick=()=>{postwarPreview=null;render();});
  document.querySelectorAll('[data-workshop-filter]').forEach(b=>b.onclick=()=>{workshopFilter=b.dataset.workshopFilter;render();});
  document.querySelectorAll('[data-select-spirit]').forEach(b=>b.onclick=()=>{selectedSpiritId=b.dataset.selectSpirit;render();});
  document.querySelectorAll('[data-workshop-next]').forEach(b=>b.onclick=()=>{const spirits=state?.spirits||[];if(spirits.length){const index=spirits.findIndex(g=>g.id===(selectedSpiritId||activeIds(state)[0]));selectedSpiritId=spirits[(index+1+spirits.length)%spirits.length].id;render();document.querySelector('#mosaic')?.scrollIntoView({block:'nearest',behavior:'smooth'});}});
  document.querySelectorAll('[data-scroll-target]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.scrollTarget)?.scrollIntoView({block:'center',behavior:'smooth'}));
  document.querySelectorAll('[data-open-settlement-history]').forEach(b=>b.onclick=()=>{viewingHistoryId=null;tab='结算历史';render();window.scrollTo(0,0);});
  document.querySelectorAll('[data-settlement-history]').forEach(b=>b.onclick=()=>{viewingHistoryId=b.dataset.settlementHistory;tab='结算历史';render();window.scrollTo(0,0);});
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { if(b.dataset.tab==='拼图背包'){tab='拼图背包';render();window.scrollTo(0,0);return;}tab = b.dataset.tab;if(tab==='技能工坊'&&!state.spirits.some(g=>g.id===selectedSpiritId))selectedSpiritId=activeIds(state)[0]||state.spirits[0]?.id||null;if(case24Pages.includes(tab)){case24Page=tab;try{localStorage.setItem('supernatural-era.contract.ui.v1',tab);}catch{}}transitPreview=null;if(transitPages.includes(tab)){transitPage=tab;try{localStorage.setItem(transitUiKey,tab);}catch{}}identityPreview=null;if(identityPages.includes(tab)){identityPage=tab;try{localStorage.setItem(identityUiKey,tab);}catch{}}postwarPreview=null;if(postwarPages.includes(tab)){postwarPage=tab;try{localStorage.setItem(postwarUiKey,tab);}catch{}}finalePreview=null;finaleWaitPreview=false;if(finalePages.includes(tab)){finalePage=tab;try{localStorage.setItem(finaleUiKey,tab);}catch{}}if(hungryPages.includes(tab)){hungryUi.page=tab;saveHungryUi();}hungryPreview=null;hungryWaitPreview=false;crisisWaitPreview=false;crisisPreview=null;mirrorPreview=null;mirrorWaitPreview=false;regionalWaitPreview=false;regionalPreview=null;hgPreview=null;if(b.dataset.person)socialPerson=b.dataset.person;socialPreview=null;render();if(case24Pages.includes(tab)||transitPages.includes(tab)||identityPages.includes(tab)||postwarPages.includes(tab)||finalePages.includes(tab)||hungryPages.includes(tab))window.scrollTo({top:0,behavior:'instant'}); });
  document.querySelectorAll('[data-crisis-wait]').forEach(b=>b.onclick=()=>{crisisWaitPreview=true;render();});
  document.querySelectorAll('[data-crisis-wait-confirm]').forEach(b=>b.onclick=()=>{crisisWaitPreview=false;const r=waitForCityCrisis(state);state=r.state;tab='城市态势';persist();notice='已等候'+r.count+'次实际行动，请重新判断当前情况。';render();});
  document.querySelectorAll('[data-crisis-confirm]').forEach(b=>b.onclick=()=>{const a=crisisPreview;crisisPreview=null;if(a&&available(state).includes(a)){state=act(state,a);tab='城市态势';persist();notice='行动结果：'+state.cityCrisis.history.at(-1);}render();});
  document.querySelectorAll('[data-crisis-cancel]').forEach(b=>b.onclick=()=>{crisisWaitPreview=false;crisisPreview=null;render();});
  document.querySelectorAll('[data-mirror-wait]').forEach(b=>b.onclick=()=>{if(canWaitForMirror(state)){mirrorWaitPreview=true;render();}});
  document.querySelectorAll('[data-mirror-wait-confirm]').forEach(b=>b.onclick=()=>{mirrorWaitPreview=false;const r=waitForMirror(state);state=r.state;tab='古宅现场';persist();notice='已等候'+r.count+'次行动，每次代价均已结算。';render();});
  document.querySelectorAll('[data-mirror-confirm]').forEach(b=>b.onclick=()=>{const a=mirrorPreview;mirrorPreview=null;if(a&&available(state).includes(a)){state=act(state,a);tab='古宅现场';persist();notice='行动结果：'+state.ghostMirror.history.at(-1);}render();});
  document.querySelectorAll('[data-mirror-cancel]').forEach(b=>b.onclick=()=>{mirrorPreview=null;mirrorWaitPreview=false;render();});
  document.querySelectorAll('[data-regional-wait]').forEach(b=>b.onclick=()=>{if(canWaitForNotice(state)){regionalPreview=null;regionalWaitPreview=true;render();}});
  document.querySelectorAll('[data-regional-wait-confirm]').forEach(b=>b.onclick=()=>{regionalWaitPreview=false;const result=waitForRegionalNotice(state);state=result.state;tab='区域救援';persist();if(notice==='进度已保存到此浏览器。')notice='已等候'+result.count+'次行动。请查看当前目标；每次代价均已结算。';render();});
  document.querySelectorAll('[data-regional-confirm]').forEach(b=>b.onclick=()=>{const a=regionalPreview;regionalPreview=null;if(a&&available(state).includes(a)){state=act(state,a);tab='区域救援';persist();if(notice==='进度已保存到此浏览器。')notice='行动结果：'+state.regional.history.at(-1);}render();});
  document.querySelectorAll('[data-regional-cancel]').forEach(b=>b.onclick=()=>{regionalPreview=null;regionalWaitPreview=false;render();});
  document.querySelectorAll('[data-regional-teach]').forEach(b=>b.onclick=()=>{const id=b.dataset.regionalTeach;if(['RESCUE','CANDLE','CONCURRENT','WITHDRAW'].includes(id)&&!state.regional.teachings.includes(id)){state=structuredClone(state);state.regional.teachings.push(id);persist();}render();});
  document.querySelectorAll('[data-hg-confirm]').forEach(b=>b.onclick=()=>{const a=hgPreview;hgPreview=null;if(!a||!available(state).includes(a))return;state=act(state,a);persist();render();});
  document.querySelectorAll('[data-reunion-confirm]').forEach(b=>b.onclick=()=>{if(reunionPreview&&available(state).includes(reunionPreview)){state=act(state,reunionPreview);persist();}reunionPreview=null;render();});
  document.querySelectorAll('[data-reunion-cancel]').forEach(b=>b.onclick=()=>{reunionPreview=null;render();});
  document.querySelectorAll('[data-dual-teaching]').forEach(b=>b.onclick=()=>{state.dual[b.dataset.dualTeaching]=true;persist();render();});
  document.querySelectorAll('[data-hg-cancel]').forEach(b=>b.onclick=()=>{hgPreview=null;render();});
  document.querySelectorAll('[data-social-preview]').forEach(b=>b.onclick=()=>{socialPreview=b.dataset.socialPreview;tab='交易详情';render();});
  document.querySelectorAll('[data-social-confirm]').forEach(b=>b.onclick=()=>{if(b.dataset.socialConfirm!==socialPreview)return;state=act(state,socialPreview);socialPreview=null;persist();render();});
  document.querySelectorAll('[data-social-cancel]').forEach(b=>b.onclick=()=>{socialPreview=null;render();});
  const dcNotes=document.querySelector('#dc-notes');if(dcNotes)dcNotes.onsubmit=e=>{e.preventDefault();state=editDachangUI(state,'notes',new FormData(dcNotes).get('notes'));persist();render();};
  const dcCode=document.querySelector('#dc-code');if(dcCode)dcCode.onsubmit=e=>{e.preventDefault();state=editDachangUI(state,'candidate',new FormData(dcCode).get('candidate'));persist();render();};
  document.querySelectorAll('[data-dc-bookmark]').forEach(b=>b.onchange=()=>{if(b.value)state=editDachangUI(state,'bookmark',[b.dataset.dcBookmark,b.value]);persist();render();});
  const schoolHint=document.querySelector('#school-hint');if(schoolHint)schoolHint.onchange=()=>{state=editSchoolUI(state,'hint',schoolHint.value);persist();render();};
  const schoolNotes=document.querySelector('#school-notes');if(schoolNotes)schoolNotes.onsubmit=e=>{e.preventDefault();state=editSchoolUI(state,'notes',new FormData(schoolNotes).get('notes'));persist();render();};
  document.querySelectorAll('[data-door-teaching]').forEach(b=>b.onclick=()=>{state=editDoorUI(state,'teaching',b.dataset.doorTeaching);persist();render();});
  document.querySelectorAll('[data-door-focus]').forEach(b=>b.onclick=()=>{state=editDoorUI(state,'focus',b.dataset.doorFocus);persist();render();});
  const hints=document.querySelector('#door-hint');if(hints)hints.onchange=()=>{state=editDoorUI(state,'hint',hints.value);persist();render();};
  const notes=document.querySelector('#door-notes');if(notes)notes.onsubmit=e=>{e.preventDefault();state=editDoorUI(state,'notes',new FormData(notes).get('notes'));persist();render();};
  const theory=document.querySelector('#door-theory');if(theory){
    const pair=()=>{const c=theory.elements.condition.value;theory.elements.subject.value=c==='boundary'?'房门结构':'回应行为';theory.elements.result.value=c==='boundary'?'阻止接近':'被追踪';};theory.elements.condition.onchange=pair;pair();
    theory.onsubmit=e=>{e.preventDefault();const d=new FormData(theory),c=d.get('condition');if(d.get('subject')!==(c==='boundary'?'房门结构':'回应行为')||d.get('result')!==(c==='boundary'?'阻止接近':'被追踪')){notice='该组合含义不一致，请修改条件或主体与结果。';render();return;}state=act(state,'door:theory:'+c);persist();render();};
  }
  document.querySelectorAll('[data-command="export"]').forEach(b => b.onclick = exportSave);
  document.querySelectorAll('[data-bus-anchor]').forEach(b=>b.onclick=()=>{try{const copies=JSON.parse(localStorage.getItem(busCheckpointKey(state))||'{}'),copy=copies[b.dataset.busAnchor];if(!copy||!validate(copy))throw Error();download(JSON.stringify(copy,null,2),'灵异时代-公交'+b.dataset.busAnchor+'-完整锚点.json');}catch{notice='该锚点副本不可读取，当前存档未修改。';render();}});
  document.querySelectorAll('[data-command="safe-auto"]').forEach(b=>b.onclick=()=>{const a=safeAutoAction(state);if(a){state=act(state,a);persist();}else notice='自动暂停，没有可执行的低风险已知动作。';render();});
  for(const [command,field] of [['large-text','large'],['low-effects','low']])document.querySelectorAll('[data-command="'+command+'"]').forEach(b=>b.onclick=()=>{display[field]=!display[field];try{localStorage.setItem('supernatural-era.preferences.v1',JSON.stringify(display));notice='显示设置已保存。';}catch{notice='显示已调整，本浏览器无法保存设置。';}render();});
  document.querySelectorAll('[data-command="migrate"]').forEach(b => b.onclick = () => {
    try {
      const raw = localStorage.getItem(legacyKey); if (!raw) { notice = '没有可转换的旧版存档。'; render(); return; }
      const converted = migrateLegacy(JSON.parse(raw));
      if (!confirm('转换会保留旧版存储与历史进度，但旧混合压力无法还原：负荷取内容配置，复苏重新设为18%或22%。是否按此规则转换？')) return;
      download(raw, '灵异时代-v1原始副本.json'); state = upgrade(converted);resetSettlement(); persist(); render();
    } catch { notice = '旧版存档验证失败，原副本未修改。'; render(); }
  });
  const upload = document.querySelector('#import');
  if (upload) upload.onchange = async () => {
    const f = upload.files[0]; if (!f) return;
    try {
      if (f.size > 8 * 1024 * 1024) throw Error(); const raw = await f.text(); let imported = JSON.parse(raw);
      if (imported.version === 1) { if (!confirm('这是旧版混合字段存档。转换将按新试验初始值重建复苏，并保留兼容标记。是否继续？')) return; imported = migrateLegacy(imported); download(raw, '灵异时代-v1导入原始副本.json'); }
      if (!validate(imported)) throw Error();
      pendingImport=imported;render();
    } catch { notice = '导入失败：文件格式、版本或状态无效，当前进度未修改。'; render(); }
  };
 const settlementRoot=document.getElementById('live-settlement-root');
 if(settlementRoot){mountedSettlementUI=mountSettlement(settlementRoot,{
  assetBaseUrl:'./assets/settlement-ui',initialData:liveSettlement(),
  onReturnToMap:()=>{viewingHistoryId=null;state={...state,settlement:{...state.settlement,latestId:null}};persist();tab='地图';render();worldMapUI.open();},
  onRetry:()=>{
   const record=liveSettlement();if(!record?.actions.retry)return;
   const action=record.chapterKey?chapterRetryAction(record,available(state)):'enter:'+record.eventId;if(!action||!available(state).includes(action))return;
   const next=act(state,action);if(next===state)return;state=next;persist();tab='现场';render();
  }
 });}
 const realBattleMount=document.getElementById('real-combat-root');
 if(realBattleMount&&state?.combat){
  mountedCombatUI=mountCombatUI(realBattleMount,{
   mode:'live',initialData:buildRealCombatData(state),
   onAction:({skillId})=>{
    if(!state?.combat||!available(state).includes(skillId)){
     notice='条件已变化：行动未执行、没有扣除资源。';render();return {message:notice};
    }
    const before=state;
    state=act(state,skillId);
    if(state===before){notice='引擎拒绝了当前行动，状态未改变。';render();return {message:notice};}
    persist();tab='现场';render();return {message:'真实规则行动已结算并保存。'};
   },
   onRetreat:()=>{
    if(!state?.combat||!available(state).includes('combat:retreat')){
     notice='当前不允许撤离；不会改变存档。';render();return {message:notice};
    }
    const before=state;state=act(state,'combat:retreat');
    if(state!==before)persist();
    tab='现场';render();return {message:'撤离已由真实引擎执行并保存。'};
   }
  });
 }
 bindScene({getState:()=>state,legal:()=>available(state),label,storage:localStorage,root:document.querySelector('#app')});
 publishedSidebar.refresh();if(state)resonanceUI.preload();
 restoreWorkshopUI(document.querySelector('#app'),workshopUI);
}
const codexRoute=location.hash.startsWith('#codex-route=')?decodeURIComponent(location.hash.slice(13)):null;
if(['地图','技能工坊','背包与装备','双鬼结构','灵异档案'].includes(codexRoute)){tab=codexRoute==='背包与装备'?'拼图背包':codexRoute;history.replaceState(null,'',location.pathname+location.search);}
render();







