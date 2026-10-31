import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.env.G1C_OUTPUT||'docs/g1c-round4';
const sha=data=>createHash('sha256').update(data).digest('hex');
const logs={};
for(const file of ['node-full.log','g1c-focused.log','legacy-ghosts-final.log','character-compatibility.log']){
 const text=await fs.readFile(path.join(out,file),'utf8');const counts={};
 for(const key of ['tests','pass','fail','cancelled','skipped']){
  const found=text.match(new RegExp('(?:ℹ|#) '+key+' (\\d+)'));
  assert.ok(found,file+' missing final '+key);counts[key]=Number(found[1]);
 }
 assert.equal(counts.fail,0,file);assert.equal(counts.cancelled,0,file);assert.equal(counts.skipped,0,file);logs[file]=counts;
}
const {runs}=JSON.parse(await fs.readFile(path.join(out,'stress.json'),'utf8'));
const stress={groups:runs.length,groupsReached:0,groupsEnergyFailure:0,groupsProjectedRevivalStop:0,requested:0,safelyCompleted:0,energyFailureAttempts:0,projectedRevivalRejected:0,actualCrisisAttempts:0,unexecuted:0};
for(const r of runs){
 stress.requested+=r.requested;stress.safelyCompleted+=r.completed;
 if(r.completed===r.requested){stress.groupsReached++;continue;}
 const b=r.battles.at(-1),last=b.after||b.actions.at(-1)?.after||b.before;
 if(last.crisis)stress.actualCrisisAttempts++;
 else if(last.energy===0){stress.groupsEnergyFailure++;stress.energyFailureAttempts++;}
 else{assert.ok(Object.values(last.R).some(v=>v>=95));stress.groupsProjectedRevivalStop++;stress.projectedRevivalRejected++;}
}
stress.unexecuted=stress.requested-stress.safelyCompleted-stress.energyFailureAttempts-stress.projectedRevivalRejected-stress.actualCrisisAttempts;
const sourceHashes={};
for(const file of ['src/engine.js','src/app.js','src/combat.js','src/progression.js','src/g1c-production.js','src/character-potential.js'])sourceHashes[file]=sha(await fs.readFile(file));
const browser=JSON.parse(await fs.readFile(path.join(out,'browser-g1c/results.json'),'utf8'));
const edges=JSON.parse(await fs.readFile(path.join(out,'browser-edges/results.json'),'utf8'));
assert.equal(browser.errors.length,0);assert.equal(edges.errors.length,0);assert.ok(!browser.failure&&!edges.failure);
const summary={generatedAt:new Date().toISOString(),node:process.version,logs,stress,browser:{version:browser.browser,checks:browser.checks.length,actions:browser.actions.length,errors:0,edgeScenarios:edges.scenarios.length},sourceHashes};
await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(summary,null,2));
const manifest=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())await walk(file);else if(e.name!=='SHA256SUMS.txt')manifest.push(`${sha(await fs.readFile(file))}  ${path.relative(out,file).replaceAll('\\','/')}`);}}
await walk(out);await fs.writeFile(path.join(out,'SHA256SUMS.txt'),manifest.sort().join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));
