import {act,available} from './engine.js';
import {mirrorScene} from './mirror-guide.js';
import {hostState,revivalStage} from './spirits.js';
export function canWaitForMirror(s){return mirrorScene(s).actions[0]==='gm:wait'&&available(s).includes('gm:wait');}
// All iterations go through the public engine. A source/identity transition is a stop.
export function waitForMirror(s){if(!canWaitForMirror(s))return {state:s,count:0};const signature=v=>JSON.stringify([mirrorScene(v).actions,v.ghostMirror.identity.activeInstance,v.ghostMirror.releases.map(r=>r.status),v.ghostMirror.rope.custody,v.ghostMirror.ye.effects,hostState(v).hostRisk,v.spirits.map(g=>revivalStage(g.revivalProgress))]);const before=signature(s);let state=s,count=0;while(count<12&&canWaitForMirror(state)){state=act(state,'gm:wait');count++;if(state.crisis||state.systems.death!=='alive'||signature(state)!==before)break;}return {state,count};}
