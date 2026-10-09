import {act,available} from './engine.js';
import {hungryWindow} from './hungry-model.js';
import {revivalStage,hostState} from './spirits.js';
const signature=s=>JSON.stringify([hungryWindow(s.hungry.world.chapter),s.hungry.world.chapter===249,s.hungry.messages.map(m=>m.state),s.hungry.teams.map(t=>t.communication),s.hungry.manifestations.length,available(s).filter(a=>/^he:(digit$|research|hospital:observe|candle:loan|team:contact|report$)/.test(a)),s.crisis,s.systems.death,hostState(s).hostRisk,s.spirits.map(g=>revivalStage(g.revivalProgress))]);
export function waitForHungry(input){let state=input,count=0;const initial=signature(input);if(input.hungry.candle.active||!input.hungry.active)return {state,count};while(count<12&&available(state).includes('he:wait')){state=act(state,'he:wait');count++;if(signature(state)!==initial)break;}return {state,count};}
