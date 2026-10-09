import { events, backgrounds } from './content.js';
export function validateLegacy(s) {
  if (!s || s.version !== 1 || !backgrounds.includes(s.background) || typeof s.name !== 'string' || s.name.length > 24 ||
      !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 4294967295 ||
      !['hub', ...Object.keys(events)].includes(s.scene) || !['异常', '调查', '规律暴露', '限制', '处理'].includes(s.phase) || typeof s.crisis !== 'boolean') return false;
  for (const [key, max] of Object.entries({ life: 100, pressure: 100, energy: 3, bags: 2, ward: 1, tick: 1e9, revision: 1e9 }))
    if (!Number.isInteger(s[key]) || s[key] < 0 || s[key] > max) return false;
  if (!Array.isArray(s.journal) || s.journal.length > 100 || s.journal.some(x => typeof x !== 'string' || x.length > 2000)) return false;
  if (s.ghost !== null && (!s.ghost || !events[s.ghost.sourceId] || s.ghost.instanceId !== 'player-' + s.ghost.sourceId || s.ghost.name !== events[s.ghost.sourceId].spirit)) return false;
  if (s.pressure < (s.ghost ? events[s.ghost.sourceId].load : 0) || (s.crisis && (!s.ghost || s.pressure !== 100)) || (!s.crisis && s.ghost && s.pressure === 100)) return false;
  for (const key of ['knowledge', 'restricted', 'outcomes', 'fate']) {
    if (!s[key] || typeof s[key] !== 'object' || Array.isArray(s[key]) || Object.keys(s[key]).some(id => !events[id])) return false;
  }
  if (Object.values(s.restricted).some(x => x !== true) || (s.scene !== 'hub' && s.phase === '限制' && !s.restricted[s.scene])) return false;
  for (const [id, k] of Object.entries(s.knowledge)) {
    if (!k || !Array.isArray(k.clues) || new Set(k.clues).size !== k.clues.length || k.clues.some(c => !events[id].clues.some(x => x.id === c)) ||
        !k.hypotheses || typeof k.hypotheses !== 'object' || Array.isArray(k.hypotheses) || Object.entries(k.hypotheses).some(([key, val]) => !['true','false'].includes(key) || !['confirmed','disproved'].includes(val))) return false;
  }
  if (Object.values(s.outcomes).some(x => !['已驾驭', '已封存', '援助联系', '紧急封存'].includes(x))) return false;
  for (const f of Object.values(s.fate)) if (!f || f.seed !== s.seed || !Number.isInteger(f.tick) || f.tick < 0 || f.tick > s.tick || !['capture','seal','aid'].includes(f.action) || f.result !== 'success') return false;
  return true;
}
