import {act,available} from './engine.js';
import {hostState,revivalStage} from './spirits.js';
const signature=s=>JSON.stringify({chapter:s.cityCrisis.world.chapter,phase:s.cityCrisis.phase,messages:s.cityCrisis.communications.map(m=>m.state),risk:hostState(s).hostRisk,stages:s.spirits.map(g=>revivalStage(g.revivalProgress)),crisis:s.crisis,death:s.systems.death});
export function waitForCityCrisis(input){let state=input,count=0;const before=signature(input);while(count<12&&available(state).includes('cc:wait')){state=act(state,'cc:wait');count++;if(signature(state)!==before||state.cityCrisis.world.chapter===225)break;}return {state,count};}
