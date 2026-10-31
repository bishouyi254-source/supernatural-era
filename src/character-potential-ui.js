/**
 * Editable character/settlement presentation; all authoritative actions remain in the engine.
 * No posture, dynamic-height, or unapproved ghost trigger logic lives in this UI.
 */
import {spiritSlotLimit,mentalChargeLimit,mentalRuleBonus,developmentPotential,POTENTIAL_LIMITS} from './character-potential.js';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cap=value=>Number.isFinite(Number(value))?String(value):'—';
const traitsOf=fields=>({heightCm:175,weightKg:65,age:20,constitution:2,mentalBase:50,...fields});

/** Three editable physical attributes plus two clearly visible inherited/core attributes. */
export function fiveTraitInputs(fields={}){
  const t=traitsOf(fields),inherited=Number(t.constitution)>2||Number(t.mentalBase)>50;
  return '<fieldset class="potential-inputs" aria-label="角色五维属性">'+
    '<legend>角色五维属性</legend>'+
    '<div class="potential-section-heading"><span class="potential-eyebrow">01 · 基础特征</span><span class="potential-section-note">可在本轮创建时调整</span></div>'+
    '<div class="potential-static-inputs">'+
      '<label>身高 <small>厘米 · Height</small><input required type="number" inputmode="numeric" name="heightCm" min="140" max="210" step="1" value="'+esc(t.heightCm)+'"></label>'+
      '<label>体重 <small>公斤 · Weight</small><input required type="number" inputmode="numeric" name="weightKg" min="40" max="150" step="1" value="'+esc(t.weightKg)+'"></label>'+
      '<label>年龄 <small>岁 · Age</small><input required type="number" inputmode="numeric" name="age" min="18" max="65" step="1" value="'+esc(t.age)+'"></label>'+
    '</div>'+
    '<div class="potential-section-heading potential-core-heading"><span class="potential-eyebrow">02 · 核心潜质</span><span class="potential-section-note">'+(inherited?'继承上一轮成长':'死亡评价后可永久提升')+'</span></div>'+
    '<div class="potential-create-core">'+
      '<div class="potential-create-core-card" data-core-trait="constitution"><div class="potential-core-label"><strong>体质</strong><small>Constitution</small></div><output aria-label="体质">'+esc(t.constitution)+' <small>阶</small></output><p>决定可以驾驭多少只厉鬼；初始容纳 '+esc(t.constitution)+' 只。</p></div>'+
      '<div class="potential-create-core-card" data-core-trait="mentalBase"><div class="potential-core-label"><strong>初始精神基础值</strong><small>Mental Potential</small></div><output aria-label="初始精神基础值">'+esc(t.mentalBase)+'</output><p>影响灵异调用、规则加成和技能开发潜质。</p></div>'+
    '</div>'+
    '<p class="potential-help">核心潜质在开局时不可自由加点，只能通过完成死亡评价获得成长。静态特征暂不接入未验收的厉鬼规律。</p>'+
    '</fieldset>';
}

export function characterPotentialView(s){
  if(!s.traits)return '';
  const t=s.traits,slots=spiritSlotLimit(s),charges=mentalChargeLimit(s);
  return '<section class="potential-profile" aria-label="五维角色档案">'+
    '<div class="potential-section-heading"><div><span class="potential-eyebrow">角色档案 · CHARACTER</span><h3>五维属性</h3></div><span class="potential-status">第 '+esc(s.lineage?.generation??1)+' 轮</span></div>'+
    '<div class="potential-profile-groups">'+
      '<div class="potential-physical-group"><h4>基础特征 <small>静态资料</small></h4><dl class="potential-stats potential-physical">'+
        [['身高',t.heightCm+' cm'],['体重',t.weightKg+' kg'],['年龄',t.age+' 岁']]
        .map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+
      '</dl></div>'+
      '<div class="potential-core-group"><h4>核心潜质 <small>跨轮回成长</small></h4><dl class="potential-stats potential-core">'+
        '<div><dt>体质</dt><dd>'+esc(t.constitution)+' <small>阶</small></dd><span>驾驭 '+s.spirits.length+' / '+slots+' 只</span></div>'+
        '<div><dt>初始精神基础值</dt><dd>'+esc(t.mentalBase)+'</dd><span>额外调用 '+t.mentalCharges+' / '+charges+' 次</span></div>'+
      '</dl></div>'+
    '</div>'+
    '<div class="potential-rule-detail"><strong>精神潜质效果</strong><span>规则对抗 +'+mentalRuleBonus(s)+' · 开发上限 '+developmentPotential(s)+'%</span></div>'+
    '<p class="potential-help">当前五维资料不执行站立、坐下、蹲下等实时状态判定。特定厉鬼的属性触发条件仍须正式 GDD 验证。</p>'+
    '</section>';
}

export function deathPotentialView(s){
  if(s?.systems?.death!=='committed')return '';
  const l=s.lineage,last=l?.deaths?.find(d=>d.generation===l.generation);
  if(!last)return '<article class="potential-death"><h2>死亡结算资料不可用</h2><p>当前存档已保留；无有效结算记录时不发放潜质点。</p></article>';
  const t=s.traits,cMax=l.potential.constitution>=POTENTIAL_LIMITS.constitution,
    mMax=l.potential.mentalBase>=POTENTIAL_LIMITS.mentalBase;
  const exhausted=l.unspent===0||(cMax&&mMax);
  return '<section class="potential-death" aria-label="死亡潜质结算">'+
    '<div class="potential-result-hero"><div><span class="potential-eyebrow">第 '+l.generation+' 轮 · DEATH REPORT</span><h2>死亡结算</h2><p>本轮旅程已经结束，以下奖励来自已记录的实际行动。</p></div>'+
      '<div class="potential-grade-block" aria-label="本轮评价 '+esc(last.grade)+'"><small>本轮评价</small><strong class="potential-grade">'+esc(last.grade)+'</strong><span>'+last.score+' / 100 分</span></div></div>'+
    '<div class="potential-score-track" role="img" aria-label="表现评分 '+last.score+' 分，满分 100 分"><span style="width:'+Math.max(0,Math.min(100,last.score))+'%"></span></div>'+
    '<div class="potential-section-heading"><div><span class="potential-eyebrow">01 · 评价依据</span><h3>本轮表现</h3></div><span class="potential-status">系统记录</span></div>'+
    '<dl class="potential-stats potential-death-stats">'+
      [['实际行动',last.tick],['最终持鬼',last.ghosts+' 只'],['完成目标记录',last.objectives],['本轮潜质奖励','+'+last.points+' 点']]
        .map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+
    '</dl>'+
    '<div class="potential-section-heading"><div><span class="potential-eyebrow">02 · 永久成长</span><h3>分配潜质点</h3></div>'+
      '<span class="potential-point-balance" role="status" aria-live="polite">剩余 <strong>'+l.unspent+'</strong> 点</span></div>'+
    '<div class="potential-allocations">'+
      '<div class="potential-allocation-card"><div class="potential-allocation-top"><span class="potential-allocation-icon" aria-hidden="true">Ⅰ</span><div><strong>体质</strong><small>CONSTITUTION</small></div><strong class="potential-current-value">'+t.constitution+' 阶</strong></div>'+
      '<p>驾驭数量上限：'+spiritSlotLimit(s)+' 只</p>'+
      '<button type="button" data-potential-allocate="constitution" '+(l.unspent<1||cMax?'disabled':'')+' aria-label="消耗一点潜质提升一阶体质">'+(cMax?'已达到当前上限':'体质 +1 · 消耗 1 点')+'</button></div>'+
      '<div class="potential-allocation-card"><div class="potential-allocation-top"><span class="potential-allocation-icon" aria-hidden="true">Ⅱ</span><div><strong>精神基础值</strong><small>MENTAL POTENTIAL</small></div><strong class="potential-current-value">'+t.mentalBase+'</strong></div>'+
      '<p>额外调用：'+mentalChargeLimit(s)+' 次 · 开发上限：'+developmentPotential(s)+'%</p>'+
      '<button type="button" data-potential-allocate="mentalBase" '+(l.unspent<1||mMax?'disabled':'')+' aria-label="消耗一点潜质提升十点精神基础值">'+(mMax?'已达到当前上限':'精神 +10 · 消耗 1 点')+'</button></div></div>'+
    '<p class="potential-help">累计获得 '+l.pointsEarned+' 点，已分配 '+l.pointsSpent+' 点。未使用的点数可留到之后的轮回。</p>'+
    '<div class="potential-section-heading"><div><span class="potential-eyebrow">03 · 新的开始</span><h3>创建下一轮角色</h3></div><span class="potential-status">永久潜质继承</span></div>'+
    '<p class="potential-inheritance-note">保留体质、初始精神基础值与潜质历史；厉鬼、资源、剧情和当前角色的开发进度不自动继承。</p>'+
    '<form id="potential-next-life" class="potential-next-life">'+
      '<label>新角色称呼<input required name="name" maxlength="24" value="'+esc(s.name)+'" autocomplete="off"></label>'+
      fiveTraitInputs(t)+
      '<div class="potential-next-actions"><p>开启新一轮将重置当前角色进度。建议先导出死亡结算存档备份。</p>'+
        '<button type="submit">确认开启下一轮</button></div></form>'+
    '<details class="potential-evaluation-guide"><summary>查看评价与潜质点规则</summary>'+
      '<p>评分依据真实行动和已记录的进展。D=0、C=1、B=2、A=3、S=4 潜质点；无有效进展时不能反复死亡刷取奖励。数值仍属于待平衡的候选设计。</p>'+
    '</details></section>';
}
