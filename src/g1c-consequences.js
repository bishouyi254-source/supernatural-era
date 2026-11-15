// Persistent projection of the existing sealed append-only G1-C event ledger.
// No second mutable ledger, recovery command, invented world event, or rewards.
export function g1cSceneConsequences(s,eventId=null){
 return (s?.g1c?.events||[]).filter(e=>e.type==='lost-control').map(e=>({
  id:`${s.g1c.ownerId}:consequence:${e.seq}`,kind:e.kind,state:'UNRESOLVED',
  provenance:'ISOLATED_CANDIDATE',tick:e.tick,
  encounterId:e.data.consequence?.encounterId??e.battleId??null,
  eventId:e.data.consequence?.eventId??null,
  sourceInstanceId:e.data.consequence?.sourceInstanceId??null,
  region:e.data.consequence?.region??null,targetId:e.data.lastTarget??null,
  reason:e.data.consequence?.reason??'LEGACY_UNKNOWN',
  authority:'DISPOSITION_NOT_AUTHORIZED'
 })).filter(e=>eventId===null||e.eventId===eventId||e.eventId===null);
}
