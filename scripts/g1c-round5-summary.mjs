import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const dir=process.env.G1C_OUTPUT||'docs/g1c-round5';
const read=async f=>JSON.parse(await fs.readFile(`${dir}/${f}`,'utf8'));
const node={};
for(const file of ['node-full.log','g1c-focused.log','legacy-ghosts.log','potential-death.log']){
 const text=await fs.readFile(`${dir}/${file}`,'utf8');
 const r=Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k=>[k,Number(text.match(new RegExp(`(?:ℹ|#) ${k} (\\d+)`))?.[1]??NaN)]));
 assert.ok(r.tests>0&&r.pass===r.tests&&r.fail===0&&r.cancelled===0&&r.skipped===0,file);node[file]=r;
}
const browser=await read('browser-g1c/results.json'),edges=await read('browser-edges-final/results.json'),stress=await read('stress.json'),source=await read('source-audit.json');
assert.equal(browser.errors.length,0);assert.equal(edges.errors.length,0);assert.equal(edges.scenarios.length,6);assert.equal(browser.failure,undefined);assert.equal(edges.failure,undefined);
const s=stress.runs.reduce((a,r)=>{
 a.requested+=r.requested;a.completed+=r.completed;
 if(r.stop==='requested count reached')a.groupsReached++;else if(/unavailable.*(quench|calm|lift)/.test(r.stop))a.energyFailureAttempts++;else a.predictedRevivalRejections++;
 return a;
},{groups:stress.runs.length,requested:0,completed:0,groupsReached:0,energyFailureAttempts:0,predictedRevivalRejections:0});
s.unexecuted=s.requested-s.completed-s.energyFailureAttempts-s.predictedRevivalRejections;
const character=await fs.readFile(`${dir}/browser-character.log`,'utf8');assert.equal((character.match(/: PASS/g)||[]).length,4);
const summary={
 baseline:'9b2f68bb347fc1e6d7775144c2c1cfb5584ac656',main:'f4c326f0df1bf1a38052ac865f28b722a8f88664',
 date:'2026-10-30',timezone:'America/New_York',nodeVersion:process.version,gitVersion:execFileSync('git',['--version'],{encoding:'utf8'}).trim(),
 node,countsOverlap:'Focused suites are subsets of full Node; do not sum.',
 browser:{version:browser.browser,checks:browser.checks.length,actualActions:browser.actions.length,errors:browser.errors.length,edgeScenarios:edges.scenarios.length,edgeErrors:edges.errors.length,characterViewports:4,realPhone:false},
 stress:s,source:{events:source.matrix.length,records:source.records.length,formalEligible:0,compatibility:source.compatibility},
 formalAcceptance:'BLOCKED_MISSING_APPROVED_GDD_AND_REAL_SOURCE',acquisition:'LOCKED',
 observedFailures:['Initial Node test incorrectly expected combat:start on hub to target shadow; corrected targeted-scene assertion.','Initial browser ledger locator matched QA research and workshop sections; scoped to research and reran.'],
 remoteRound4:{run:41163026806,status:'completed',conclusion:'success'},remoteRound5:'See current candidate GitHub checks; local results are not remote success.'
};
await fs.writeFile(`${dir}/summary.json`,JSON.stringify(summary,null,2));
// Exclude this command's redirected output (still being written) and the manifest itself.
async function walk(d){const out=[];for(const e of await fs.readdir(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())out.push(...await walk(p));else if(!['sha256.json','summary.log'].includes(e.name))out.push(p);}return out;}
const hashes=[];for(const file of await walk(dir)){const data=await fs.readFile(file);hashes.push({path:path.relative(dir,file).replaceAll('\\','/'),bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});}
await fs.writeFile(`${dir}/sha256.json`,JSON.stringify(hashes,null,2));
console.log(JSON.stringify(summary,null,2));
