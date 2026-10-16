/**
 * Reusable standalone settlement view. DOM and event callbacks only.
 * No combat engine, save writes, navigation side effects, or reward generation.
 */
import { normalizeSettlement, percent, ghostFill, changeLabel, rangeLabel } from './settlement-data.mjs';
const TEMPLATE = `
  <header class="result-hero">
    <img class="hero-crest" data-asset="svg/title_crest.svg" alt="" aria-hidden="true">
    <div class="hero-main">
      <div class="hero-titleline"><h1 data-role="title">战斗结算</h1><span class="small-vertical">结算</span></div>
      <div class="hero-sub">本次结果：<strong data-role="outcome">—</strong></div>
      <div class="location-line"><span class="thin-diamond"></span><span data-role="location">—</span><span class="thin-diamond"></span></div>
      <div class="mission-sub" data-role="mission"></div>
    </div>
    <img class="hero-rule" data-asset="svg/title_rule.svg" alt="" aria-hidden="true">
  </header>
  <div class="settlement-main">
    <section class="summary-grid" aria-label="结算摘要">
      <article class="panel panel-left"><h2><span class="red-pip">◇</span> 战斗表现</h2>
        <div class="performance-line"><img data-asset="icons/target.png" alt="" aria-hidden="true"><span>本次目标</span><strong data-role="target">—</strong></div>
        <div class="performance-line"><img data-asset="icons/rule.png" alt="" aria-hidden="true"><span>规则应对</span><strong data-role="rules">—</strong></div>
        <div class="performance-line"><img data-asset="icons/used.png" alt="" aria-hidden="true"><span>已使用能力</span><strong data-role="ability-count">—</strong></div>
        <button type="button" class="record-toggle" data-action="record" aria-expanded="false" aria-controls="settlement-record-details">
          <img data-asset="icons/clue.png" alt=""><span>查看详细战斗记录</span><span data-role="record-arrow">⌄</span>
        </button>
        <div class="record-details" data-role="record-details" id="settlement-record-details" hidden></div>
      </article>
      <article class="panel panel-right"><h2><span class="red-pip">◇</span> 灵异代价</h2>
        <div class="cost-energy"><img data-asset="icons/energy.png" alt=""><div class="cost-stack">
          <div class="cost-row-head"><span>能量变化</span><strong data-role="energy">—</strong></div>
          <div class="track"><div class="track-fill energy-fill" data-role="energy-fill"></div></div></div>
        </div>
        <div class="ghost-cost-group"><div class="group-heading"><img data-asset="icons/revival.png" alt=""><span>各鬼复苏变化</span><small>逐鬼独立记录</small></div><div class="ghost-rows" data-role="ghost-rows"></div></div>
        <div class="total-burden"><img data-asset="icons/burden.png" alt=""><span>总体灵异负荷</span><strong data-role="burden">—</strong><span class="burden-note">与逐鬼复苏分别计算</span></div>
      </article>
    </section>
    <section class="rewards-panel" aria-label="挑战收益与成长"><div class="rewards-heading"><h2><span class="red-pip">◇</span> 挑战收益与成长</h2><span>仅显示本次真实新增收益</span></div>
      <div class="reward-grid" data-role="rewards"></div>
    </section>
    <footer class="action-footer">
      <button class="main-action action-return" type="button" data-action="return"><img data-asset="svg/button_return_idle.svg" alt="" aria-hidden="true"><span>返回世界地图</span></button>
      <button class="main-action action-retry" type="button" data-action="retry"><img data-asset="svg/button_retry_idle.svg" alt="" aria-hidden="true"><span>再次挑战</span></button>
    </footer>
  </div>`;
let instanceSerial = 0;
const create = (tag, cls, text) => {const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
export function mountSettlement(root, options = {}) {
  if (!(root instanceof HTMLElement)) throw new TypeError('SettlementView requires an HTML element');
  const base=options.assetBaseUrl ?? './assets';
  const asset=path=>`${base.replace(/\/$/,'')}/${path}`;
  root.classList.add('settlement-ui'); root.innerHTML=TEMPLATE;
  const recordId=`settlement-record-${++instanceSerial}`;
  root.querySelector('[data-role=record-details]').id=recordId;
  root.querySelector('[data-action=record]').setAttribute('aria-controls',recordId);
  root.querySelectorAll('[data-asset]').forEach(img=>img.src=asset(img.dataset.asset));
  const el = name => root.querySelector(`[data-role="${name}"]`);
  const btn = name => root.querySelector(`[data-action="${name}"]`);
  let data=normalizeSettlement(options.initialData),expanded=false;
  function render() {
    root.dataset.outcome = data.outcome;
    el('title').textContent=data.title;
    el('outcome').textContent=data.resultLabel;
    el('location').textContent=data.encounter;
    el('mission').textContent=data.missionLabel+(data.coverageLabel?' · '+data.coverageLabel:'');
    el('target').textContent=data.target;
    el('rules').textContent=data.ruleResult;
    el('ability-count').textContent=`${data.abilityCount} 次 · ${data.abilityCounts.length} 项`;
    el('energy').textContent=`${rangeLabel(data.energy.before,data.energy.after)}（消耗 ${data.energy.before === null || data.energy.after === null ? '未记录':data.energy.consumed===null?'分项未记录':data.energy.consumed}；恢复 ${data.energy.restored??'分项未记录'}）`;
    el('energy-fill').style.width=`${percent(data.energy.before,data.energy.after)}%`;
    el('burden').textContent=rangeLabel(data.burden.before,data.burden.after);
    const ghostRows=el('ghost-rows'); ghostRows.replaceChildren();
    if(!data.ghosts.length){ghostRows.append(create('p','quiet-empty','没有记录到厉鬼复苏变化'));}
    data.ghosts.forEach(ghost=>{
      const row=create('div','ghost-row');row.dataset.ghostId=ghost.id;
      const head=create('div','ghost-row-top');head.append(create('span','ghost-name',ghost.name),create('b','ghost-change',changeLabel(ghost.before,ghost.after,'%')));
      const tr=create('div','track');const fill=create('div','track-fill revive-fill');fill.style.width=`${ghostFill(ghost.after)}%`;tr.append(fill);
      const values=create('div','ghost-before-after',(ghost.origin==='acquired'?'获得时 ':'')+rangeLabel(ghost.before,ghost.after,'%')+(ghost.removed?'（离体前末次记录）':''));
      row.append(head,values,tr); ghostRows.append(row);
      row.title=rangeLabel(ghost.before,ghost.after,'%');
    });
    const list=el('rewards');list.replaceChildren();
    if(!data.rewards.length){list.append(create('div','reward-card reward-empty','本次无新增收益'));}
    data.rewards.forEach(reward=>{
      const card=create('div','reward-card');card.dataset.rewardId=reward.id;
      const im=document.createElement('img');im.src=asset(`icons/${reward.icon}.png`);im.alt='';im.setAttribute('aria-hidden','true');
      const body=create('div');body.append(create('div','reward-name',reward.kind));
      const amount=create('div','reward-value',reward.name+' ');amount.append(create('b','',reward.quantity));body.append(amount);card.append(im,body);list.append(card);
    });
    const details=el('record-details'); details.replaceChildren();
    const counts=new Map(data.abilityCounts);
    const abilityLabel=create('div','record-intro',`实际能力使用：${counts.size ? [...counts].map(([name,count])=>name+' ×'+count).join('、') : '本次未使用能力'}`);
    details.append(abilityLabel);
    if(data.log.length) data.log.forEach(log=>details.append(create('div','record-entry',`${log.stage ? log.stage+' · ':''}${log.text}`)));
    else details.append(create('div','record-entry','没有可展示的详细战斗记录'));
    details.hidden=!expanded;
    btn('record').setAttribute('aria-expanded',String(expanded));el('record-arrow').textContent=expanded?'⌃':'⌄';
    btn('return').disabled=!data.actions.returnToMap;
    btn('retry').disabled=!data.actions.retry;
  }
  function handleClick(e) {
    const action=e.target.closest('[data-action]');
    if(!action || !root.contains(action) || action.disabled)return;
    switch(action.dataset.action){
      case 'record': expanded=!expanded;render(); if(expanded) options.onOpenRecord?.(data);break;
      case 'return':options.onReturnToMap?.(data);break;
      case 'retry':options.onRetry?.(data);break;
    }
  }
  root.addEventListener('click',handleClick);
  render();
  return {
    update(next) {const nextData=normalizeSettlement(next);if(nextData.id!==data.id)expanded=false;data=nextData;render();},
    getData(){return structuredClone(data);},
    destroy(){root.removeEventListener('click',handleClick);root.replaceChildren();root.classList.remove('settlement-ui');},
  };
}
