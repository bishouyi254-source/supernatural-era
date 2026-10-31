// Isolated counterfactual arithmetic. Never patches src, engine state, save
// bindings, unlocks or live rules. Synthetic ownership/bias inputs are fixtures.
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
import {growthFor,suppressionFor,hostState,settleSpirits} from '../src/spirits.js';import {masteryStable,ruleBlocked} from '../src/evolution-model.js';import {EYE_V6} from '../src/ghost-eye-v6.js';
export function parts(s,g,{used=false,base=null,advance=true,stimulus=0,model='current'}={}){
 const incident=s.relations.filter(r=>r.spiritA===g.id||r.spiritB===g.id),staticConflict=incident.reduce((n,r)=>n+(r.spiritA===g.id?r.conflictBtoA:r.conflictAtoB),0);
 const extras=incident.map(r=>{const b=Math.abs(r.bias||0);return model==='ramp'?2*Math.max(0,Math.min(1,(b-60)/40)):b>=60?2:0;});
 const biasConflict=model==='node-cap'?Math.max(0,...extras):extras.reduce((a,b)=>a+b,0),over=hostState(s).burdenRatio>1;
 const natural=!advance||masteryStable(s,g.id)?0:(over?Math.max(.5,g.naturalRevivalRate)*1.25:g.naturalRevivalRate),build=({suppression:2,mind:1,rule:4}[s.v1?.build]||0)+(base!==null&&s.v1?.build==='domain'?3:0),usage=used&&!ruleBlocked(s,g.id)&&!masteryStable(s,g.id)?(base??g.usageRevivalRate)+build:0;
 const suppression=suppressionFor(s,g),conflict=advance?staticConflict+biasConflict:0;
 return {natural,usage,build,staticConflict:advance?staticConflict:0,biasConflict:advance?biasConflict:0,suppression,raw:natural+usage+stimulus+conflict,total:(natural+usage+stimulus+conflict)*(1-suppression)};
}
export function fixture(state,{ownership='three',bias=0,staticConflict=0}={}){const s=structuredClone(state);if(ownership==='single'){s.spirits=s.spirits.filter(g=>g.sourceId==='eye');s.relations=[];}else for(const r of s.relations){if(r.spiritB==='player-eye'||r.spiritA==='player-eye'){r.bias=r.spiritB==='player-eye'?-bias:bias;r.conflictAtoB=staticConflict;r.conflictBtoA=staticConflict;}}return s;}
async function main(){const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.resolve(root,'../../outputs/v64');await fs.mkdir(out,{recursive:true});const g=JSON.parse(await fs.readFile(path.join(out,'growth-3.json'),'utf8')),rows=[];let checked=0,maxError=0;
 for(const phase of ['eyeEight','mature'])for(const ownership of ['single','three'])for(const bias of [0,30,49.999,50,54,59.999,60,60.001,75,100])for(const action of ['idle','one','react3','eight']){
  const s=fixture(g.states[phase],{ownership,bias}),layer=action==='one'?1:action==='react3'?3:action==='eight'?8:0,advance=action!=='react3',used=layer?'player-eye':null,base=layer?EYE_V6[layer].revival:null;
  if(layer)s.ghostEyeV6.persistentLoad+=EYE_V6[layer].burden;
  const current=structuredClone(s);settleSpirits(current,used,null,layer?{[used]:base}:{},advance);
  for(const ghost of s.spirits){const p=parts(s,ghost,{used:ghost.id===used,base:ghost.id===used?base:null,advance});const expected=growthFor(s,ghost,ghost.id===used,0,ghost.id===used?base:null,advance);maxError=Math.max(maxError,Math.abs(p.total-expected));assert.ok(Math.abs(p.total-expected)<1e-10);assert.equal(Math.min(100,Math.round((ghost.revivalProgress+p.total)*10000)/10000),current.spirits.find(x=>x.id===ghost.id).revivalProgress);checked++;}
  for(const model of ['current','ramp','node-cap'])rows.push({phase,ownership,bias,action,model,simulation:true,notPlayerReachability:true,ghosts:s.spirits.map(ghost=>({id:ghost.id,before:ghost.revivalProgress,...parts(s,ghost,{used:ghost.id===used,base:ghost.id===used?base:null,advance,model})}))});
 }
 // Exact boundaries, directionality and permanent conflicts remain observable.
 const boundary=[];for(const value of [59.999,60,60.001,75,100]){const s=fixture(g.states.mature,{bias:value,staticConflict:1});for(const model of ['current','ramp','node-cap'])boundary.push({bias:value,model,eye:parts(s,s.spirits.find(g=>g.sourceId==='eye'),{used:true,base:1,model})});}
 await fs.writeFile(path.join(out,'kernel.json'),JSON.stringify({scope:'single-settlement kernel counterfactuals; not legal full-game candidate trajectories or balance approval',proposals:{ramp:'each drift edge: 2*clamp((abs(bias)-60)/40,0,1); static directional conflict unchanged',nodeCap:'sum static directional conflicts, plus maximum drift penalty across incident edges (0 or 2)'},checkedCurrentGhostSettlements:checked,maxCurrentError:maxError,rows,boundary},null,2));console.log(JSON.stringify({checked,maxError,cells:rows.length}));}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
