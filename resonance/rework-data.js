import {TIERS,familyTypes} from '../src/resonance-model.js';
export {TIERS};
export const GHOSTS=[],LINKS=[],FAMILIES=familyTypes;
export const ART={eye:true,cassette:true,shadow:true};
export const STATUS={participating:'已启用',available:'未启用',conflict:'冲突',research:'待观察',locked:'未解锁',unknown:'未知'};
export const TYPES={resonance:'已有关联',conflict:'已观察冲突',clue:'未验证关系'};
export const visibleRating=g=>TIERS.includes(g.rank)?g.rank:null;
export function filteredGhosts(items,state){return items.filter(g=>(state.filter==='all'||state.filter==='core'&&g.core||state.filter===g.status)&&(!state.query||g.name.includes(state.query)));}
export function demoFixture(){throw Error('正式数据入口不提供演示节点注入');}
