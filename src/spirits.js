import {villageEnvironment} from './village-model.js';
import {effectiveRelations,structureState,ruleBlocked,masteryStable} from './evolution-model.js';
import {busSuppression,busMaintains} from './bus.js';
import {transitSuppression} from './transit-model.js';
// Prototype tuning, not canonical novel statistics. Rates are per action node.
export const tuning = { hostCapacity: 100, overloadMultiplier: 1.25, suppression: 0.4, suppressionActions: 3 };
export const revivalCrisisFor=(s,g)=>g.revivalProgress===100&&g.suppressionRemaining===0&&!busMaintains(s,g)&&!ruleBlocked(s,g.id);
export function revivalStage(value) {
  if (!Number.isFinite(value) || value < 0 || value > 100) throw Error('无效复苏进度');
  return value < 20 ? '沉寂' : value < 40 ? '轻微躁动' : value < 60 ? '活跃' : value < 80 ? '高风险' : value < 95 ? '严重复苏' : value < 100 ? '临界' : '厉鬼复苏';
}
export function carryingStage(ratio) {
  return ratio <= .5 ? '轻度负担' : ratio <= .75 ? '中度负担' : ratio <= 1 ? '高负担' : ratio <= 1.25 ? '超载' : '承载崩溃';
}
export function suppressionFor(s, spirit) {
  const incoming = effectiveRelations(s).filter(r => r.spiritA === spirit.id || r.spiritB === spirit.id);
  const relational = Math.max(0, ...incoming.map(r => Math.max(0,Math.min(.9,r.spiritA === spirit.id ? r.suppressionBtoA-(r.bias||0)/200 : r.suppressionAtoB+(r.bias||0)/200))));
  return Math.max(ruleBlocked(s,spirit.id)?1:0,relational, spirit.suppressionRemaining > 0 ? tuning.suppression : 0, s.bus?.transit?.started?transitSuppression(s,spirit):busSuppression(s)?.85:0,villageEnvironment(s)?.25:0);
}
export function hostState(s) {
  const totalBurden = s.spirits.reduce((sum, g) => sum + g.burden, 0)+(s.ghostEyeV6?.persistentLoad||0)+(s.g1a?.candidate?.persistentLoad||0)+(s.g1a?.production?.load||0)+(s.g1b?.load||0)+(s.g1c?.load||0);
  // Ordinary compatibility/suppression never implies a burden discount.
  const structure=structureState(s);
  const effectiveBurden = structure.effective+(s.ghostEyeV6?.persistentLoad||0)+(s.g1a?.candidate?.persistentLoad||0)+(s.g1a?.production?.load||0)+(s.g1b?.load||0)+(s.g1c?.load||0);
  const burdenRatio = effectiveBurden / structure.capacity;
  const conflicts = s.relations.reduce((sum, r) => sum + r.conflictAtoB + r.conflictBtoA, 0);
  const bias=Math.max(0,...s.relations.map(r=>Math.abs(r.bias||0)));
  const pseudo=s.relations.some(r=>Math.min(r.suppressionAtoB,r.suppressionBtoA)<.2&&Math.max(r.suppressionAtoB,r.suppressionBtoA)>.5);
  let balanceState = conflicts > 0||bias>=60 ? '失衡' : pseudo?'伪平衡':s.systems?.second?.stage==='unstable'?'失衡期':s.spirits.length > 1 && !s.relations.length ? '未评估' : s.spirits.length>1?bias>=30?'偏移 / 勉强共存':'暂时平衡':'稳定';
  if(s.evolution?.cascade)balanceState='连锁失稳';
  const maxRevival = Math.max(0, ...s.spirits.map(g => g.revivalProgress));
  let severity = maxRevival >= 95 ? 4 : maxRevival >= 80 ? 3 : maxRevival >= 60 ? 2 : maxRevival >= 20 ? 1 : 0;
  if (burdenRatio > 1.25) severity = Math.max(severity, 4);
  else if (burdenRatio > 1) severity = Math.max(severity, 3);
  else if (burdenRatio > .75 || balanceState === '失衡' || s.life < 40) severity = Math.max(severity, 2);
  if(busSuppression(s))severity=Math.max(burdenRatio>1?3:0,severity-1);else if(s.bus?.active&&s.bus.onBus&&s.bus.busState==='ENGINE_OFF')severity=Math.min(4,severity+1);
  return { hostCapacity: structure.capacity, totalBurden, effectiveBurden, burdenRatio,
    carryingState: carryingStage(burdenRatio), balanceState, balanceBias: bias,
    bodyStress: Math.min(100,100-s.life+(burdenRatio>1?20:0)), consciousnessStress: conflicts+(burdenRatio>1?20:0), hostRisk: ['低','中','高','极高','临界'][severity] };
}
export function growthFor(s, g, usage = false, stimulus = 0, usageOverride = null, advanceNatural = true) {
  const suppression = suppressionFor(s, g);
  const conflict = s.relations.filter(r=>r.spiritA===g.id||r.spiritB===g.id).reduce((sum, r) => sum + (r.spiritA === g.id ? r.conflictBtoA : r.conflictAtoB)+(Math.abs(r.bias||0)>=60?2:0), 0);
  const overloaded=hostState(s).burdenRatio>1;
  const natural = !advanceNatural?0:(masteryStable(s,g.id)?0:(overloaded?Math.max(.5,g.naturalRevivalRate):g.naturalRevivalRate) * (overloaded ? tuning.overloadMultiplier : 1));
  const extra=({suppression:2,mind:1,rule:4}[s.v1?.build]||0)+(usageOverride!==null&&s.v1?.build==='domain'?3:0);
  return (natural + (usage && !ruleBlocked(s,g.id) && !masteryStable(s,g.id) ? (usageOverride??g.usageRevivalRate)+extra : 0) + stimulus + (advanceNatural?conflict:0)) * (1 - suppression);
}
export function settleSpirits(s, usedId = null, stimulusId = null, usageCosts = {}, advanceNatural = true, additionalRevival = {}) {
  const used=Array.isArray(usedId)?usedId:[usedId];
  const gains = s.spirits.map(g => growthFor(s, g, used.includes(g.id), (g.id === stimulusId ? 10 : 0)+(additionalRevival[g.id]||0),usageCosts[g.id]??null,advanceNatural));
  const drift=(s.advanced?.mediaStudy?9:12)*(s.v1?.build==='stable'?.75:1);
  for(const r of s.relations)r.bias=Math.max(-100,Math.min(100,(r.bias||0)+(used.includes(r.spiritA)?drift:0)-(used.includes(r.spiritB)?drift:0)));
  s.spirits.forEach((g, i) => {
    g.revivalProgress = Math.min(100, Math.round((g.revivalProgress + gains[i]) * 10000) / 10000);
    if (advanceNatural && g.suppressionRemaining > 0) g.suppressionRemaining--;
    g.suppressionReceived = suppressionFor(s, g);
    g.activityLevel = g.suppressionReceived > 0 ? '被压制' : '正常';
  });
  s.crisis = !!s.g1a?.candidate?.shroud.crisis || !!s.g1a?.production?.shroud.crisis || s.spirits.some(g => revivalCrisisFor(s,g));
}
export function validSpirits(s, events) {
  const n = (x, max = Number.MAX_SAFE_INTEGER) => Number.isFinite(x) && x >= 0 && x <= max;
  if (!n(s.hostCapacity) || s.hostCapacity === 0 || !Array.isArray(s.spirits) || !Array.isArray(s.relations)) return false;
  const ids = new Set();
  for (const g of s.spirits) {
    if (!g || ids.has(g.id) || !events[g.sourceId] || events[g.sourceId].playerOwnable===false || g.id !== 'player-' + g.sourceId || g.name !== events[g.sourceId].spirit ||
      g.ruleId!==undefined&&g.ruleId!=='rule-'+g.sourceId || g.instanceType!==undefined&&g.instanceType!=='player' || g.rank!==undefined&&g.rank!==(events[g.sourceId].grade==='S潜力'?'S':events[g.sourceId].grade) || !n(g.burden) || !n(g.revivalProgress, 100) || !n(g.naturalRevivalRate) || !n(g.usageRevivalRate) ||
      !n(g.suppressionReceived, 1) || !Number.isInteger(g.suppressionRemaining) || !n(g.suppressionRemaining, 3) ||
      !['正常','被压制'].includes(g.activityLevel) || !n(g.development,100) || !['稳定','不稳定'].includes(g.stability)) return false;
    ids.add(g.id);
  }
  const pairs = new Set();
  for (const r of s.relations) {
    if (!r || !ids.has(r.spiritA) || !ids.has(r.spiritB) || r.spiritA === r.spiritB ||
      !n(r.compatibility, 1) || !n(r.suppressionAtoB, 1) || !n(r.suppressionBtoA, 1) ||
      !n(r.conflictAtoB) || !n(r.conflictBtoA) ||r.bias!==undefined&&(!Number.isFinite(r.bias)||r.bias< -100||r.bias>100)|| r.burdenSynergy !== 0 || r.specialInteraction !== null) return false;
    const pair = [r.spiritA, r.spiritB].sort().join('|'); if (pairs.has(pair)) return false; pairs.add(pair);
  }
  return s.crisis === (!!s.g1a?.candidate?.shroud.crisis || !!s.g1a?.production?.shroud.crisis || s.spirits.some(g => revivalCrisisFor(s,g)));
}
