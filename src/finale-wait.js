import {act,available} from './engine.js';
import {hostState,revivalStage} from './spirits.js';
const signature=s=>JSON.stringify([s.finale.chapter,s.finale.source.state,s.finale.current.attemptState,s.finale.strategy.communication,s.finale.anchors.length,hostState(s).hostRisk,s.spirits.map(g=>revivalStage(g.revivalProgress)),s.systems.death,s.crisis]);
export function waitForFinale(input){let state=input,count=0;const old=signature(input);for(;count<12&&available(state).includes('ff:wait');){state=act(state,'ff:wait');count++;if(signature(state)!==old||state.finale.chapter===276)break;}return {state,count};}
