/** Character profile and finalized death growth panel; only engine actions write game state. */
import {spiritSlotLimit,mentalChargeLimit,mentalRuleBonus,developmentPotential,POTENTIAL_LIMITS} from './character-potential.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function fiveTraitInputs(fields={}) {
  const t={heightCm:175,weightKg:65,age:20,...fields};
  return '<fieldset class="potential-inputs"><legend>基础特征 · 静态规律档案</legend>'+
   '<label>身高（厘米）<input required type="number" name="heightCm" min="140" max="210" step="1" value="'+esc(t.heightCm)+'"></label>'+
   '<label>体重（公斤）<input required type="number" name="weightKg" min="40" max="150" step="1" value="'+esc(t.weightKg)+'"></label>'+
   '<label>年龄（岁）<input required type="number" name="age" min="18" max="65" step="1" value="'+esc(t.age)+'"></label>'+
   '</fieldset>';
}
export function characterPotentialView(s){
  const t=s.traits;
  if(!t)return '';
  return '<section class="potential-profile" aria-label="五维角色档案">'+
   '<h3>角色五维档案</h3><div class="potential-stats">'+
   [['身高',t.heightCm+' cm'],['体重',t.weightKg+' kg'],['年龄',t.age+' 岁'],
    ['体质',t.constitution+' 阶'],['初始精神基础值',String(t.mentalBase)]]
    .map(([k,v])=>'<div><span>'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>').join('')+
   '</div><div class="potential-caps"><p>驾驭上限：<strong>'+s.spirits.length+' / '+spiritSlotLimit(s)+' 只</strong>（体质决定）</p>'+
   '<p>精神额外调用：<strong>'+t.mentalCharges+' / '+mentalChargeLimit(s)+' 次</strong>（仅抵扣现有能量，不豁免复苏）</p>'+
   '<p>规则对抗加成：<strong>+'+mentalRuleBonus(s)+'</strong> · 开发潜质上限：<strong>'+developmentPotential(s)+'%</strong></p>'+
   '<p class="muted">身高、体重与年龄仅保存为静态档案。厉鬼专属触发规律须待权威 GDD 验收后逐鬼接入；不模拟姿态或实时身高。</p></div></section>';
}
export function deathPotentialView(s){
  if(s?.systems?.death!=='committed')return '';
  const l=s.lineage, last=l?.deaths?.find(d=>d.generation===l.generation);
  if(!last)return '<article class="potential-death"><h2>死亡结算资料不可用</h2><p>保留当前存档，不允许无结算记录发放奖励。</p></article>';
  const t=s.traits,constitutionMax=l.potential.constitution>=POTENTIAL_LIMITS.constitution,
    mentalMax=l.potential.mentalBase>=POTENTIAL_LIMITS.mentalBase;
  return '<section class="potential-death" aria-label="死亡潜质结算">'+
    '<div class="potential-result-heading"><div><span class="stamp">第 '+l.generation+' 轮 · 死亡评价</span><h2>本轮结算</h2></div><strong class="potential-grade">'+last.grade+'</strong></div>'+
    '<div class="potential-score"><span>表现评分</span><strong>'+last.score+' / 100</strong></div>'+
    '<div class="potential-stats"><div><span>真实行动</span><strong>'+last.tick+'</strong></div>'+
    '<div><span>最终持鬼</span><strong>'+last.ghosts+'</strong></div>'+
    '<div><span>已完成目标记录</span><strong>'+last.objectives+'</strong></div>'+
    '<div><span>本次潜质点</span><strong>+'+last.points+'</strong></div></div>'+
    '<h3>永久潜质分配</h3><p>当前可分配 <strong>'+l.unspent+'</strong> 点；累计获得 '+l.pointsEarned+' 点。先分配，再开启下一轮。</p>'+
    '<div class="potential-allocations">'+
    '<div><span>体质 '+t.constitution+' 阶 · 容纳 '+spiritSlotLimit(s)+' 只厉鬼</span><button type="button" data-potential-allocate="constitution" '+(l.unspent<1||constitutionMax?'disabled':'')+'>体质 +1（1点）</button></div>'+
    '<div><span>精神基础值 '+t.mentalBase+' · 开发潜质 '+developmentPotential(s)+'%</span><button type="button" data-potential-allocate="mentalBase" '+(l.unspent<1||mentalMax?'disabled':'')+'>精神 +10（1点）</button></div></div>'+
    '<h3>下一轮角色</h3><p class="muted">下一轮继承体质和精神基础值；重新开始剧情，厉鬼、技能开发、战斗资源和本轮事件不会无条件继承。</p>'+
    '<form id="potential-next-life" class="potential-next-life">'+
    '<label>新角色称呼<input required name="name" maxlength="24" value="'+esc(s.name)+'"></label>'+
    fiveTraitInputs(t)+
    '<button type="submit">确认创建下一轮角色</button></form>'+
    '<p class="muted">评分数值为独立候选平衡规则；D=0、C=1、B=2、A=3、S=4 潜质点。必须完成实际进度才能获得奖励。</p>'+
    '</section>';
}
