/**
 * 《神秘复苏 RPG》通用结算 UI 第三步：隔离的 UI 数据契约。
 * 只转换已有结算数据，不执行战斗、计算奖励或写存档。
 */
export const OUTCOMES = Object.freeze({
  suppressed: { title: '战斗结算', label: '有效压制', tone: 'red' },
  sealed: { title: '灵异挑战完成', label: '合法关押', tone: 'green' },
  objective: { title: '灵异挑战完成', label: '事件目标达成', tone: 'green' },
  escaped: { title: '挑战已结束', label: '撤离成功', tone: 'neutral' },
  failed: { title: '挑战已结束', label: '挑战失败', tone: 'red' },
});
export const ICON_TYPES = Object.freeze(['archive', 'resource', 'growth', 'clue', 'success', 'target', 'rule', 'used', 'energy', 'revival', 'burden']);
const obj = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const label = (value, fallback = '未记录') => typeof value === 'string' && value.trim() ? value.trim().slice(0, 150) : fallback;
const num = (value, fallback = null) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const nonneg = (value, fallback = null) => {const n = num(value, fallback); return n === null ? null : Math.max(0, n);};
const fmtNum = n => n === null ? '—' : String(Number.isInteger(n) ? n : Number(n.toFixed(2)));
export const changeLabel = (before, after, suffix = '') => before === null || after === null ? '未记录' : `${after - before > 0 ? '+' : ''}${fmtNum(after - before)}${suffix}`;
export const rangeLabel = (before, after, suffix = '') => before === null || after === null ? '未记录' : `${fmtNum(before)}${suffix} → ${fmtNum(after)}${suffix}`;
export function normalizeSettlement(input = {}) {
  const raw = obj(input);
  const outcome = Object.hasOwn(OUTCOMES, raw.outcome) ? raw.outcome : 'failed';
  const missionCompleted = raw.missionCompleted === true;
  const basic = OUTCOMES[outcome];
  const cost = obj(raw.cost);
  const energy = obj(cost.energy); const burden = obj(cost.burden);
  const ghosts = Array.isArray(cost.ghosts) ? cost.ghosts : [];
  const rewards = Array.isArray(raw.rewards) ? raw.rewards : [];
  const abilities = Array.isArray(raw.abilitiesUsed) ? raw.abilitiesUsed : [];
  const log = Array.isArray(raw.log) ? raw.log : [];
  const actions = obj(raw.actions);
  const normalized = {
    id: label(raw.id, 'demo-battle'),
    outcome, tone: basic.tone,
    title: label(raw.title,(outcome === 'suppressed' && missionCompleted) ? '灵异挑战完成' : basic.title),
    resultLabel: label(raw.resultLabel, basic.label),
    encounter: label(raw.encounter, '未知副本'),
    missionLabel: missionCompleted ? '副本目标已达成' : '本次结算不代表副本全部完成',
    coverageLabel: label(raw.coverageLabel,''),
    missionCompleted,
    target: label(raw.target, '未记录'),
    ruleResult: label(raw.ruleResult, '未记录'),
    abilitiesUsed: abilities.map(a => label(typeof a === 'string' ? a : obj(a).name)).slice(0, 300),
    abilityCount: abilities.length,
    abilityCounts: [...abilities.reduce((counts,a)=>{const name=label(typeof a==='string'?a:obj(a).name);counts.set(name,(counts.get(name)||0)+1);return counts;},new Map())],
    energy: {before: nonneg(energy.before), after: nonneg(energy.after),consumed:energy.consumed??null,restored:energy.restored??null},
    burden: {before: nonneg(burden.before), after: nonneg(burden.after)},
    ghosts: ghosts.slice(0, 100).map((entry, index) => {
      const g = obj(entry);
      return {id: label(g.id, `ghost-${index}`), name: label(g.name, `厉鬼 ${index + 1}`), before: nonneg(g.before), after: nonneg(g.after),origin:g.origin==='acquired'?'acquired':'start',removed:g.removed===true};
    }),
    rewards: rewards.slice(0, 100).map((entry, index) => {
      const r = obj(entry);
      return {id: label(r.id, `reward-${index}`), icon: ICON_TYPES.includes(r.icon) ? r.icon : 'resource', kind: label(r.kind, '挑战收益'), name: label(r.name), quantity: label(r.quantity, '')};
    }),
    log: log.slice(0, 200).map((entry, index) => {
      const l = obj(entry);
      return {id: label(l.id, `log-${index}`), stage: label(l.stage, ''), text: label(l.text, '无详细记录')};
    }),
    actions: {returnToMap: actions.returnToMap === true, retry: actions.retry === true},
  };
  return normalized;
}
export function percent(before, after) {return before === null || after === null || before === 0 ? 0 : Math.min(100, Math.max(0, (before-after) * 100 / before));}
export function ghostFill(after) {return after === null ? 0 : Math.min(100, Math.max(0, after));}
