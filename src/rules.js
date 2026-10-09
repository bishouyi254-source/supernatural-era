// Game tuning, not canon statistics. Source IDs are never NPC instance IDs.
export function ruleFor(id, event) {
  return { id:'rule:'+id, instanceId:'source:'+id, medium:event.medium || (id==='echo'?'audio':'visual'),
    weight:event.ruleWeight || 2, speed:20, damage:45 };
}
export function ruleContest(attack, defense) {
  if (![attack,defense].every(x=>Number.isFinite(x)&&x>=0)) throw Error('无效规则权重');
  return attack>defense?'blocked':attack===defense?'partial':'failed';
}
export function developmentTier(g) { return Math.floor(g.development/25); }
export function develop(g, amount) { g.development=Math.min(100,g.development+amount); }
export function fateResult(seed, node, context) {
  const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
  const text=stable({seed,node,context}); let hash=2166136261;
  for(const c of text) hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
  return {roll:hash%100,signature:hash.toString(16),context:structuredClone(context)};
}
// Contract only: no player reset/divine power is granted in C/D.
export function validateAuthority(a) {
  return !!a&&a.kind==='divine'&&typeof a.id==='string'&&['combat','self'].includes(a.scope)&&Array.isArray(a.fields)&&a.fields.length>0&&new Set(a.fields).size===a.fields.length&&a.fields.every(x=>['life','position','playerGauge','sourceGauge','ward','cooldowns'].includes(x));
}
export function resetTemporary(state, snapshot, authority) {
  if(!validateAuthority(authority)||state.systems?.death==='committed') throw Error('不允许重启');
  const s=structuredClone(state);
  for(const field of authority.fields) {
    if(field==='life') {if(!Number.isFinite(snapshot.life)||snapshot.life<=0||snapshot.life>100) throw Error('无效快照');s.life=snapshot.life;}
    else if(field==='ward') {if(![0,1].includes(snapshot.ward)) throw Error('无效快照');s.ward=snapshot.ward;}
    else {if(!s.combat||!snapshot.combat) throw Error('缺少战斗快照');
      const v=snapshot.combat[field];
      if(field==='position'&&!['safe','exposed'].includes(v)||['playerGauge','sourceGauge'].includes(field)&&(!Number.isFinite(v)||v<0||v>199)||field==='cooldowns'&&(!v||typeof v!=='object'||Object.values(v).some(n=>!Number.isInteger(n)||n<0||n>3))) throw Error('无效快照');
      s.combat[field]=structuredClone(v);
    }
  }
  return s;
}
