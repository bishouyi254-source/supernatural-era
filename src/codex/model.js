// Adapter contract: accept ONLY player-authorized evidence, never world/Canon state.
export const RATINGS = Object.freeze(['神灵异','S','A','B','C','D']);
export const STATES = Object.freeze(['全部','已发现','未发现','已接触','高危']);
const text = v => typeof v === 'string' ? v : '';
const lines = v => Array.isArray(v) ? v.filter(x=>typeof x==='string') : [];
const percent = v => Number.isFinite(v) ? Math.max(0,Math.min(100,v)) : null;
const hasEvidence = v => typeof v==='string' && v.trim().length>0;
export function projectRecord(raw) {
  const e=raw.evidence || {};
  const discovered=raw.discovered===true;
  const rating=hasEvidence(e.rating) && RATINGS.includes(raw.rating) ? raw.rating : null;
  const identified=discovered && hasEvidence(e.identity);
  const authorizedArt=identified && /^assets\/[\w/.-]+\.(png|svg)$/.test(raw.art || '');
  return Object.freeze({id:text(raw.id),name:identified ? text(raw.name)||'未知档案' : '未知档案',
    discovered,contacted:discovered && raw.contacted===true && hasEvidence(e.contact),rating,
    ratingEvidence:rating ? text(e.rating) : '',
    risk:hasEvidence(e.risk) && ['高危','中危','低危'].includes(raw.risk) ? raw.risk : null,
    source:discovered && hasEvidence(e.source) ? text(raw.source) : '来源待核实',
    location:discovered && hasEvidence(e.location) ? text(raw.location) : '活动区域未知',
    art:authorizedArt ? raw.art : null,
    rules:discovered && hasEvidence(e.rules) ? lines(raw.rules) : [],
    encounters:discovered && hasEvidence(e.encounters) ? lines(raw.encounters) : [],
    clues:discovered && hasEvidence(e.clues) ? lines(raw.clues) : [],
    completeness:discovered && hasEvidence(e.progress) ? percent(raw.completeness) : null,
    investigation:discovered && hasEvidence(e.progress) ? percent(raw.investigation) : null,
    progressEvidence:discovered && hasEvidence(e.progress) ? text(raw.progressEvidence) : '',
    warning:discovered && hasEvidence(e.risk) ? text(raw.warning) : '',demo:raw.demo===true});
}
export function selectRecords(records,{query='',state='全部',rating='全部',sort='archive',page=1,pageSize=15}={}) {
  const q=query.trim().toLocaleLowerCase();
  const filtered=records.filter(r=>(!q || [r.name,r.id,r.source,r.location,...r.rules,...r.clues].join(' ').toLocaleLowerCase().includes(q))
    && (rating==='全部' || r.rating===rating)
    && (state==='全部' || state==='已发现' && r.discovered || state==='未发现' && !r.discovered || state==='已接触' && r.contacted || state==='高危' && r.risk==='高危'));
  filtered.sort((a,b)=>sort==='rating' ? (a.rating ? RATINGS.indexOf(a.rating) : 6)-(b.rating ? RATINGS.indexOf(b.rating) : 6) || a.id.localeCompare(b.id)
    : sort==='progress' ? (b.completeness ?? -1)-(a.completeness ?? -1) || a.id.localeCompare(b.id) : a.id.localeCompare(b.id));
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const current=Math.max(1,Math.min(pages,page));
  return {items:filtered.slice((current-1)*pageSize,current*pageSize),filtered,total:filtered.length,pages,page:current};
}
