import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {newGame,validate,upgrade} from '../src/engine.js';
import {g1cSceneConsequences} from '../src/g1c-consequences.js';
import {newCombat} from '../src/combat.js';
import {events} from '../src/content.js';
import {inspectG1CFormalSource,registerG1CEvidence,auditG1CSourceAction} from '../src/g1c-formal-source.js';
const out=process.env.G1C_OUTPUT||'work/g1c-source-audit';await fs.mkdir(out,{recursive:true});
const records=[];
for(const [ghost,classification,locator,claim] of [
 ['fire','NOVEL_LEAD','https://www.hetushu.com/book/7491/5210368.html','Third-party chapter 481 lines 90,141,147 support ghost-fire domain and host burning motifs; no numeric threshold or formal source authorization.'],
 ['press','NOVEL_LEAD','https://www.xbiquge345.com/chapter/9643/95029971.html','Third-party chapter 597 lines 113,129-141 support seated posture and tallest-body trigger motifs; initial find results were incomplete and corrected by reading full text. No heights, tie rule or formal authorization.'],
 ['wind','UNKNOWN_SOURCE','docs/g1c-acceptance/formal-source-gate.md','Independent primary chapter proof and formal domain intent remain missing.'],
 ...['fire','wind','press'].map(k=>[k,'CANDIDATE_PARAMETER','docs/g1c-acceptance/rules-boundary-candidate.md','Isolated engineering parameters only; no production balance or acquisition approval.'])
]){const r=registerG1CEvidence({id:`round5-${records.length+1}`,ghost,classification,locator,claim,revision:'round5',reviewer:'Codex source audit'});assert.ok(r.ok);records.push(r);}
const matrix=Object.keys(events).map(id=>{
 const s=newGame();s.scene=id;s.combat=newCombat(id,s);
 const inspection=inspectG1CFormalSource(s);
 const gates=Object.fromEntries(['fire','wind','press'].map(k=>[k,auditG1CSourceAction(s,null,k)]));
 assert.deepEqual(inspection.eligible,{fire:false,wind:false,press:false});
 return {eventId:id,inspection,gates};
});
const files=['src/content.js','src/combat.js','src/knocker-intents.js','src/ghost-eye-v6.js','src/g1c-source-registry.js','src/g1c-production.js','src/g1c-consequences.js'];
// Read the actual prior-round persisted loss, not a reconstructed migration mock.
const old=JSON.parse(await fs.readFile('docs/g1c-round4/edge-scenarios.json','utf8'));
const oldLoss=old.find(r=>r.name==='round4-zero-retreat').after;
const oldContext=old.find(r=>r.name==='round4-zero-pair').context;
const oldBytes=JSON.stringify(oldLoss);assert.ok(validate(oldLoss,oldContext));
const upgraded=upgrade(JSON.parse(oldBytes));assert.ok(validate(upgraded,oldContext));
assert.equal(JSON.stringify(oldLoss),oldBytes);assert.equal(g1cSceneConsequences(upgraded)[0].reason,'LEGACY_UNKNOWN');
const compatibility={priorRoundLossValid:true,roundtripValid:true,sourceUnchanged:true,unknownLocationFailClosed:true};
const sources=[];for(const path of files)sources.push({path,sha256:crypto.createHash('sha256').update(await fs.readFile(path)).digest('hex')});
await fs.writeFile(out+'/source-audit.json',JSON.stringify({boundary:'READ-ONLY AUDIT; NO FORMAL BINDINGS; NO ACQUISITION GRANTS',records,matrix,sources,compatibility},null,2));
console.log(JSON.stringify({events:matrix.length,evidenceRecords:records.length,formalEligible:0}));
