import {act,available} from './engine.js';
import {regionalScene} from './regional-guide.js';
import {revivalStage,hostState} from './spirits.js';

export function canWaitForNotice(s){return !!s.regional.active&&!s.regional.candle.active&&!s.regional.departed&&available(s).includes('reg:wait')&&regionalScene(s).actions[0]==='reg:wait';}
// A player-selected wait, never combat automation. Every step uses normal settlement.
// Stop at changed options/world threats/host risk, rather than skipping to a chapter.
export function waitForRegionalNotice(input){
 let s=input,count=0;
 if(!canWaitForNotice(s))return {state:s,count};
 const options=JSON.stringify(regionalScene(s).actions),rope=s.regional.world.rope;
 const risk=hostState(s).hostRisk,stages=s.spirits.map(g=>revivalStage(g.revivalProgress)).join('|');
 while(count<12&&canWaitForNotice(s)){
  const n=act(s,'reg:wait');if(n===s)break;s=n;count++;
  if(JSON.stringify(regionalScene(s).actions)!==options||s.regional.world.rope!==rope||hostState(s).hostRisk!==risk||s.spirits.map(g=>revivalStage(g.revivalProgress)).join('|')!==stages||s.crisis||s.systems.death!=='alive')break;
 }
 return {state:s,count};
}
