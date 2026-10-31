import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fixture,replay,step} from '../tests/g1c-helpers.mjs';
import {act,available,validate} from '../src/engine.js';
const rows=[];
for(const field of ['ruleWeight','domainWeight'])for(const value of [11,Infinity,-1,NaN]){
 let {s,c}=fixture({ownership:['fire','wind']});s=replay(s,c);
 c={...c,targets:c.targets.map(t=>({...t,[field]:value}))};const before=JSON.stringify(s);
 assert.equal(validate(s,c),false);assert.deepEqual(available(s,c),[]);assert.equal(act(s,'g1cp:fire:ignite',c),s);assert.equal(JSON.stringify(s),before);
 rows.push({field,value:String(value),result:'REJECTED_WITHOUT_MUTATION'});
}
for(const k of ['fire','wind','press']){
 let {s,c}=fixture({ownership:[k]});s=replay(s,c);s=step(s,`g1cp:${k}:${{fire:'ignite',wind:'raise',press:'fall'}[k]}`,c);
 c={...c,requestId:'round6-'+k};s=step(s,'combat:observe',c);const before=JSON.stringify(s);
 assert.equal(act(s,'combat:observe',c),s);assert.equal(JSON.stringify(s),before);rows.push({k,result:'DUPLICATE_REQUEST_NO_EXTRA_COST_OR_EVIDENCE'});
}
await fs.writeFile((process.env.G1C_OUTPUT||'docs/g1c-round6')+'/boundary.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify({checks:rows.length,pass:rows.length}));
