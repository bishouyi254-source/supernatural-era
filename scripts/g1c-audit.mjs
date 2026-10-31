import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {fixture,replay,step,cycle,target} from '../tests/g1c-helpers.mjs';
import {available,validate,act} from '../src/engine.js';import {hostState} from '../src/spirits.js';import {activeIds} from '../src/v1.js';
const out=process.env.G1C_OUTPUT||'../../outputs/g1-c';await fs.mkdir(out,{recursive:true});
const snap=s=>({tick:s.tick,life:s.life,energy:s.energy,bags:s.bags,cash:s.v1.cash,active:activeIds(s),load:s.g1c.load,loads:Object.fromEntries(['fire','wind','press'].map(k=>[k,s.g1c[k].load])),R:Object.fromEntries(s.spirits.map(g=>[g.sourceId,g.revivalProgress])),capacity:hostState(s).hostCapacity,burden:hostState(s).effectiveBurden,crisis:s.crisis,death:s.systems.death});
const fixtures={},report={boundary:'ISOLATED REPLAYS ONLY. Explicit test ownership and body/domain/height participants. Each new encounter uses shadow only as existing initiative clock, not a fictional formal enemy. No resource/R/load reset between battles; rest and slot changes use engine act. No normal-player acquisition.',runs:[]};
for(const k of ['fire','wind','press']){
 let {s,c}=fixture({ownership:[k]});fixtures[k]={state:replay(s,c),context:c};
 for(const stage of [1,2]){s=cycle(s,c,k);s=step(s,`g1cp:${k}:research:${stage}`,c);fixtures[k+'-'+stage]={state:replay(s,c),context:c};}
}
for(const [name,opts]of Object.entries({'press-ally':{ownership:['press'],targets:[target(),target({id:'test:ally',faction:'ally',heightCm:195,action:{type:'body',targetRegion:'exposed',damage:0,moveTo:'safe'}})]},'press-player':{ownership:['press'],playerHeightCm:200},'wind-body':{ownership:['wind'],targets:[target({action:{type:'body',targetRegion:'exposed',damage:8}})]},'fire-resist':{targets:[target({domainWeight:9})]},'pair':{ownership:['fire','wind']},'triple':{ownership:['fire','wind','press']}})){let {s,c}=fixture(opts);fixtures[name]={state:replay(s,c),context:c};}
if(!process.argv.includes('--stress-only')){await fs.writeFile('scripts/g1c-states.json',JSON.stringify(fixtures));await fs.writeFile(out+'/fixtures.json',JSON.stringify(fixtures,null,2));}
for(const ownership of [['fire'],['wind'],['press'],['fire','wind'],['fire','press'],['wind','press'],['fire','wind','press']])for(const strategy of ownership.length>1?['simultaneous','rotating']:['single'])for(const requested of [5,10,20]){
 let {s,c}=fixture({ownership});const run={ownership,strategy,requested,completed:0,battles:[],stop:null};
 for(let i=1;i<=requested;i++){
  const row={encounter:i,before:snap(s),actions:[],after:null,result:null};run.battles.push(row);
  const go=a=>{if(!available(s,c).includes(a)){run.stop='unavailable '+a;row.result=run.stop;return false;}const old=s;s=step(s,a,c);row.actions.push({action:a,before:snap(old),after:snap(s)});return true;};
  if(s.crisis||s.systems.death!=='alive'){run.stop='existing crisis/death';row.result=run.stop;row.after=snap(s);break;}
  if(ownership.length===3){const removed=i%2?'press':'fire',added=i%2?'fire':'press';if(activeIds(s).includes('player-ghost-'+removed)&&!go('v1:active:remove:player-ghost-'+removed))break;if(!activeIds(s).includes('player-ghost-'+added)&&!go('v1:active:add:player-ghost-'+added))break;}
  s=replay(s,c);let kinds=ownership.filter(k=>activeIds(s).includes('player-ghost-'+k));if(strategy==='rotating')kinds=[kinds[(i-1)%kinds.length]];
  let ok=true;for(const k of kinds){if(!go(`g1cp:${k}:${{fire:'ignite',wind:'raise',press:'fall'}[k]}`)){ok=false;break;}}
  if(ok)ok=go('combat:observe');
  for(const k of kinds)if(ok&&!go(`g1cp:${k}:${{fire:'quench',wind:'calm',press:'lift'}[k]}`))ok=false;
  if(ok)ok=go('combat:retreat');if(ok)ok=go('rest');row.after=snap(s);
  if(!ok)break;row.result='completed lawful action cycle';run.completed++;
 }
 run.stop??='requested count reached';report.runs.push(run);
}
await fs.writeFile(out+'/stress.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.runs.map(({ownership,requested,completed,stop})=>({ownership,requested,completed,stop})),null,2));
