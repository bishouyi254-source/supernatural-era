// Hidden event truth. Views must consume evidence/last-known NPC data, not these fields.
export function doorTrigger({queryThroughDoor=false,personInside=false,confirmation=false,functionalBoundary=true}){return queryThroughDoor&&personInside&&confirmation&&functionalBoundary;}
export function applyDoorTrigger(x,target,context){if(!doorTrigger(context))return false;const mark={depth:0,age:0};if(target==='player')x.playerMark ||= mark;else x.npcs[target].mark ||= mark;return true;}
export const doorPursuitSuppressed=x=>x.removedDoors||x.sealed||x.restricted;
export function advanceDoorMark(mark,suppressed){if(!mark||suppressed)return false;mark.age++;if(mark.age%8===0)mark.depth=Math.min(4,mark.depth+1);return mark.depth>=4&&mark.age>=40;}
export function doorManifest(x,tick){x.source='MANIFEST';x.manifestUntil=tick+3;}
