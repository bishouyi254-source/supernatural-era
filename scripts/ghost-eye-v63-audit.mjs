import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {newGame,available,act,validate,upgrade} from '../src/engine.js';
import {growthFor,hostState,suppressionFor} from '../src/spirits.js';
import {EYE_V6,eyeCost} from '../src/ghost-eye-v6.js';
import {legalEye} from '../tests/ghost-eye-v6-helpers.mjs';
import {earnedThirdSlotOptions} from '../tests/potential-prior-life.mjs';
const out=path.resolve(process.argv[2]||'../../outputs/v63-data');await fs.mkdir(out,{recursive:true});
export const snap=s=>({tick:s.tick,revision:s.revision,scene:s.scene,life:s.life,energy:s.energy,crisis:s.crisis,death:s.systems.death,host:hostState(s),ghosts:s.spirits.map(g=>({id:g.id,revival:g.revivalProgress,development:g.development,awakening:g.awakeningProgress,suppression:suppressionFor(s,g),naturalRate:g.naturalRevivalRate,temporary:g.suppressionRemaining})),relations:structuredClone(s.relations),load:s.ghostEyeV6.persistentLoad,energySpent:s.ghostEyeV6.energySpent,energyRestored:s.ghostEyeV6.energyRestored,casts:s.ghostEyeV6.sequence,cash:s.v1.cash,stock:s.v1.stock,items:s.v1.items,barrier:s.systems.items.barrier,bags:s.bags,resources:s.city.resources,build:s.v1.build,advanced:s.advanced,nodes:s.evolution.nodes,third:s.evolution.third,second:s.systems.second,legal:available(s)});
export function go(s,a,trace=[]){assert.ok(available(s).includes(a),'unavailable '+a);const before=snap(s),n=act(s,a);assert.ok(validate(n),'invalid '+a);trace.push({a,before,after:snap(n),receipt:n.actionReceipt,journal:n.journal.slice(-3),eyeEvent:n.ghostEyeV6.sequence>s.ghostEyeV6.sequence?n.ghostEyeV6.events.at(-1):null});return n;}
function journey(s,id,t){s=go(s,'journey:'+id,t);for(let i=0;s.journey.active&&i<30;i++){const av=available(s);s=go(s,['journey:intel','journey:observe','journey:finish','journey:avoid','journey:advance'].find(a=>av.includes(a)),t);}assert.ok(!s.journey.active);return s;}
export function generate(seed=3){const trace=[],states={};let s=newGame('V6.3合法成长','学生',seed,'v63-seed-'+seed,earnedThirdSlotOptions());
 for(const a of ['chapter:perimeter','chapter:advance','chapter:avoid','chapter:leave','chapter:finish','enter:shadow','clue:witness','clue:power','theory:true','restrict','capture'])s=go(s,a,trace);states.single=structuredClone(s);
 s=journey(journey(s,'mall',trace),'club',trace);states.beforeSecond=structuredClone(s);
 for(const a of ['enter:echo','clue:witness','clue:power','theory:true','restrict','second:begin','second:match:mutual','second:implant','second:stabilize'])s=go(s,a,trace);states.second=structuredClone(s);
 s=journey(s,'village',trace);
 for(const a of ['city:start','city:route','city:move:residential','city:observe','city:rescue','city:slaves:item','city:move:hospital','city:observe','city:cargo','city:move:control','city:observe','city:comms','city:move:school','city:observe'])s=go(s,a,trace);
 while(s.city.elapsed<18)s=go(s,'city:wait',trace);s=go(s,'city:final',trace);while(!s.city.completed)s=go(s,'city:window:perimeter',trace);
 for(const a of ['advanced:body','v1:contact:official','v1:mission:school','v1:mission:mall','v1:mission:village','v1:mission:city','v1:buy:record','v1:certify:shadow','v1:buy:record','v1:certify:echo','v1:eye:seek'])s=go(s,a,trace);
 if(s.v1.eye.fate!=='encounter')return {seed,miss:true,trace,states,end:snap(s)};
 for(const a of ['v1:eye:observe','v1:eye:verify','v1:eye:restrict','chapter:supply','v1:eye:capture','v1:active:remove:player-echo','v1:active:add:player-eye','rest'])s=go(s,a,trace);states.eyeAcquired=structuredClone(s);
 for(const a of ['v1:facility:intel','v1:certify:eye','study:player-eye','v1:resonance:eye'])s=go(s,a,trace);
 for(let i=0;i<7;i++)s=go(s,available(s).find(a=>a.startsWith('v1:eye:research:')),trace);s=go(s,'rest',trace);states.eyeEight=structuredClone(s);
 // All maturity actions remain conditional on the actual finite inventory and gates.
 // Resolve the three existing city residuals once. These finite rewards fund
 // media research (1), echo study (1), and structural transfer research (1).
 for(const id of ['street','building','missing'])for(const a of ['city:residual:inspect:'+id,'city:residual:official:'+id])s=go(s,a,trace);
 const matureActions=['evo:third:adopt','evo:third:stabilize','advanced:media','v1:build:body','evo:study:player-echo','study:player-echo','rest','evo:host:begin:mind','evo:host:transfer','evo:host:anchor:player-eye','evo:host:verify','rest'];
 const skipped=[];for(const a of matureActions){if(available(s).includes(a))s=go(s,a,trace);else skipped.push({a,at:snap(s)});}states.mature=structuredClone(s);
 return {seed,trace,states,skipped,miss:false};}
function reason(s,a){const g=s.spirits.find(g=>g.sourceId==='eye'),layer=Number(a.split(':')[2]),v=s.combat?.eyeV6,conf=[];if(s.crisis)conf.push('revival crisis: '+s.spirits.filter(g=>g.revivalProgress===100).map(g=>g.id).join(','));if(!s.combat)conf.push('no combat');if(!g)return ['no owned eye'];if(!s.ghostEyeV6.unlocks[g.id]?.some(e=>e.layer===layer))conf.push('layer locked');if(EYE_V6[layer]&&s.energy<EYE_V6[layer].energy)conf.push('insufficient energy');if(v&&layer>1&&(!v.domain||v.domain.remaining<=1))conf.push('domain missing/expiring');if(EYE_V6[layer]&&Math.round((g.revivalProgress+eyeCost(s,layer,a.includes(':react:')).total)*10000)/10000>=100)conf.push('eye projected revival >=100');if(layer===6&&!v?.scenario?.stoppable)conf.push('no defined stoppable enemy action');if(layer===3&&!v?.pending)conf.push('no propagation reaction');if(v?.restartUsed&&layer>=7)conf.push('shared restart used');return conf.length?conf:['other action timing/cooldown/qualification; consult saved legal actions'];}
export function run(initial,{pattern='one',management='rest',fixture=false,limit=30}={}){let s=structuredClone(initial);const trace=[],encounters=[],start=snap(s);let stop=null,complete=0;
 const attempt=a=>{if(!available(s).includes(a)){stop={encounter:encounters.length+1,action:a,reasons:reason(s,a),state:snap(s),cost:a.startsWith('eye6:')?eyeCost(s,Number(a.split(':')[2]),a.includes(':react:')):null};assert.equal(act(s,a),s,'illegal action is free');return false;}s=go(s,a,trace);if(s.crisis){stop={encounter:encounters.length+1,action:a,reasons:['post-action revival crisis'],state:snap(s)};return false;}return true;};
 for(let n=1;n<=limit;n++){
  if(!attempt('enter:blood')||!attempt('combat:start'))break;
  if(fixture){s.combat.eyeV6.scenario={simulation:true,kind:'propagation',weight:2,damage:0,observable:true,reactable:true,interruptible:false,stoppable:true};delete s.settlement;s=upgrade(s);assert.ok(validate(s));}
  const before=trace.length,castsBefore=s.ghostEyeV6.sequence;let ok=attempt('eye6:cast:1');
  // Optional explicit 1/3/2 coverage: provoke the declared simulation through
  // a legal risk action; a safe relocation alone never invents a reaction.
  if(ok&&pattern==='tactical123'&&!s.combat?.eyeV6.pending)ok=attempt('combat:risk');
  if(ok&&s.combat?.eyeV6.pending)ok=attempt(pattern.startsWith('tactical')?'eye6:react:3':'eye6:pass');
  if(ok&&pattern.startsWith('tactical'))ok=attempt('eye6:cast:2');
  if(ok&&pattern.startsWith('occasional')&&n%5===0)ok=attempt('eye6:cast:'+pattern.slice(10)+(pattern.endsWith('8')?':self':''));
  if(ok&&s.combat?.eyeV6.pending)ok=attempt(pattern.startsWith('tactical')&&available(s).includes('eye6:react:3')?'eye6:react:3':'eye6:pass');
  if(ok)ok=attempt('combat:retreat');
  if(ok&&management==='reciprocal'){
   const count=s.ghostEyeV6.sequence-castsBefore;
   for(const ghost of s.spirits.filter(g=>g.sourceId!=='eye')){
    const add='v1:active:add:'+ghost.id;if(available(s).includes(add))ok=attempt(add)&&ok;
    for(let i=0;i<count&&ok;i++){if(s.energy===0)ok=attempt('rest');if(ok)ok=attempt('practice:'+ghost.id);}
    if(!ok)break;
   }
  }
  if(ok&&management==='finite')for(const a of ['v1:buy:film','v1:item:film','balance:medium']){if(a==='v1:buy:film'&&available(s).includes('balance:medium'))continue;if(available(s).includes(a))ok=attempt(a)&&ok;}
  if(ok)ok=attempt('rest');
  encounters.push({n,completed:ok,actions:trace.slice(before).map(x=>x.a),end:snap(s)});if(!ok)break;complete++;
  s=upgrade(JSON.parse(JSON.stringify(s)));assert.ok(validate(s));
 }
 return {pattern,management,fixture,initial:start,completed:complete,checkpoints:[10,20,30].map(n=>({requested:n,completed:Math.min(n,complete)})),attempted:encounters.length,stop,end:snap(s),encounters,trace};}
function counterfactual(s,ids){s=structuredClone(s);s.spirits=s.spirits.filter(g=>ids.includes(g.id));s.relations=s.relations.filter(r=>ids.includes(r.spiritA)&&ids.includes(r.spiritB));s.v1.active=ids.slice(-2);s.systems.second=null;s.evolution.third=null;s.evolution.observed=[];delete s.settlement;s=upgrade(s);assert.ok(validate(s));return s;}
async function main(){const generated=[],runs=[];for(const seed of [1,3,7,11,19]){const g=generate(seed);generated.push(g);await fs.writeFile(path.join(out,'growth-seed-'+seed+'.json'),JSON.stringify(g,null,2));if(g.miss)continue;
 for(const phase of ['eyeAcquired','eyeEight','mature'])for(const management of ['rest','finite'])for(const pattern of ['one','tactical','occasional6','occasional7','occasional8']){const r=run(g.states[phase],{pattern,management,fixture:pattern==='tactical'});runs.push({seed,phase,...r});await fs.writeFile(path.join(out,`run-${seed}-${phase}-${management}-${pattern}.json`),JSON.stringify({seed,phase,...r}));}
 }
 const g=generated.find(g=>g.seed===3&&!g.miss),fixtureRuns=[];
 for(const [phase,ids] of [['eyeSingle',['player-eye']],['eyeDual',['player-eye','player-echo']],['eyeThree',['player-shadow','player-echo','player-eye']]])for(const management of ['rest','finite'])for(const pattern of ['one','tactical','occasional6','occasional7','occasional8'])fixtureRuns.push({phase,simulation:true,reason:'counterfactual ownership at identical eyeEight starting revival, resources and capacity; NOT lawful acquisition',...run(counterfactual(g.states.eyeEight,ids),{pattern,management,fixture:true})});
 const marginal=[];for(const phase of ['eyeAcquired','eyeEight','mature'])for(const layer of EYE_V6.slice(1)){const s=g.states[phase],eye=s.spirits.find(g=>g.sourceId==='eye');for(const factor of [.5,1,1.5])marginal.push({phase,layer:layer.layer,factor,method:'arithmetic marginal sensitivity, not executed candidate',energy:layer.energy,load:layer.burden,base:layer.revival*factor,growth:growthFor(s,eye,true,0,layer.revival*factor),currentCost:eyeCost(s,layer.layer)});}
 const secondComparison=['beforeSecond','second'].map(phase=>{const s=g.states[phase],ghost=s.spirits[0];return {phase,state:snap(s),sameExistingGhost:ghost.id,usageGrowth:growthFor(s,ghost,true),idleGrowth:growthFor(s,ghost),noRelationGrowth:growthFor({...s,relations:[]},ghost,true),note:'same existing ghost; initial revival unchanged by implantation. No claim of eye-first progression.'};});
 // Re-run the exact 28 old trajectories from their original lawful helper and settings.
 const cross=[];const base=legalEye().state;
 for(const build of [null,'body','stable','suppression','mind','domain','rule'])for(const pattern of ['one','one-eight'])for(const management of ['rest-only','finite-balance']){let s=build?go(base,'v1:build:'+build):structuredClone(base);let stop;for(let n=1;n<=60;n++){if(!available(s).includes('enter:blood')){stop={n,reason:'entry unavailable'};break;}s=go(go(s,'enter:blood'),'combat:start');let blocked=null;for(const a of pattern==='one'?['eye6:cast:1']:['eye6:cast:1','eye6:cast:8:self']){if(!available(s).includes(a)){blocked=a;break;}s=go(s,a);}if(available(s).includes('combat:retreat'))s=go(s,'combat:retreat');if(management==='finite-balance'&&!s.crisis)for(const a of ['v1:buy:film','v1:item:film','balance:medium'])if((a!=='v1:buy:film'||!available(s).includes('balance:medium'))&&available(s).includes(a))s=go(s,a);if(available(s).includes('rest'))s=go(s,'rest');s=upgrade(JSON.parse(JSON.stringify(s)));assert.ok(validate(s));if(blocked||s.crisis){stop={n,reason:blocked?'spell blocked':'revival crisis',blocked};break;}}cross.push({build,pattern,management,stop,end:snap(s)});}
 await fs.writeFile(path.join(out,'audit.json'),JSON.stringify({runtime:'unchanged V6.2',stages:{singleEye:'not an initial lawful acquisition: seek requires >=2 owned spirits; post-crisis abandonment is not initial progression',legalSecond:'shadow -> echo via club and second:*',mature:'conditional lawful actions; see per-seed skipped'},seeds:generated.map(g=>({seed:g.seed,miss:g.miss,skipped:g.skipped?.map(x=>x.a)})),secondComparison,runs,fixtureRuns,marginal,cross},null,2));
 for(const phase of ['single','beforeSecond','second','eyeAcquired','eyeEight','mature'])await fs.writeFile(path.join(out,phase+'.json'),JSON.stringify(g.states[phase],null,2));
 console.log(JSON.stringify({seeds:generated.map(g=>({seed:g.seed,miss:g.miss,skipped:g.skipped?.map(x=>x.a)})),runs:runs.map(r=>({seed:r.seed,phase:r.phase,p:r.pattern,m:r.management,c:r.completed,stop:r.stop?.reasons})),fixtures:fixtureRuns.map(r=>({phase:r.phase,p:r.pattern,m:r.management,c:r.completed,stop:r.stop?.reasons})),cross:cross.map(r=>({build:r.build,p:r.pattern,m:r.management,n:r.stop?.n}))},null,2));}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
