import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {act,validate,available} from '../src/engine.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'C:/Users/ziho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fixtures=JSON.parse(await fs.readFile('scripts/g1c-states.json','utf8'));
const out=process.env.G1C_OUTPUT||'docs/g1c-round6';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const report={boundary:'ISOLATED typed/static fixtures only; mobile viewport emulation, no ordinary acquisition',browser:browser.version(),rows:[],errors:[]};
try{for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto((process.env.G1C_URL||'http://127.0.0.1:8765')+'/scripts/qa-g1c.html');
 for(const k of ['fire','wind','press'])for(const mode of ['base','focus','cap','body','nonspirit']){
  let {state:s,context:c}=structuredClone(fixtures[k+'-2']);
  const t=c.targets[0];t.domainWeight=5;t.ruleWeight=k==='press'?2:5;t.action.damage=9;
  if(mode==='body')t.action.type='body';if(mode==='nonspirit')t.spirit=false;
  if(mode==='cap'){s.spirits[0].development=100;s.v1.build='suppression';s.traits.mentalBase=150;s.lineage.potential.mentalBase=150;s.traits.mentalCharges=4;t.domainWeight=10;}
  const actions=[`g1cp:${k}:${{fire:'ignite',wind:'raise',press:'fall'}[k]}`];
  if(['focus','cap'].includes(mode))actions.push(`g1cp:${k}:${{fire:'concentrate:source:shadow',wind:'invade:source:shadow',press:'intensify'}[k]}`);else actions.push('combat:observe');
  const row={viewport,k,mode,trace:[],initial:structuredClone(s),context:structuredClone(c)};
  for(const a of actions){
   assert.ok(available(s,c).includes(a),a);const expected=act(s,a,c);
   const actual=await page.evaluate(async({s,c,a})=>{const engine=await import('../src/engine.js');const next=engine.act(s,a,c);return {state:next,valid:engine.validate(next,c),legal:engine.available(s,c)};},{s,c,a});
   assert.ok(actual.valid);assert.deepEqual(actual.state,expected);assert.ok(actual.legal.includes(a));row.trace.push({a,state:actual.state});s=expected;
  }
  const start=row.initial.g1c.sequence,e=s.g1c[k].evidence.findLast(e=>e.seq>start&&e.data.attack!==undefined);
  if(mode==='cap'){assert.equal(e.data.attack,10);if(k!=='press')assert.equal(e.data.result,'partial');}
  if(k==='wind'&&mode==='body'||k==='fire'&&mode==='nonspirit')assert.equal(e,undefined);
  row.lastContest=e;assert.ok(validate(s,c));report.rows.push(row);
 }
 await context.close();
}assert.equal(report.errors.length,0);
}finally{await browser.close();await fs.writeFile(out+'/browser-v1.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify({scenarios:report.rows.length,actions:report.rows.reduce((n,r)=>n+r.trace.length,0),errors:report.errors.length,browser:report.browser}));
