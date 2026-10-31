import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {act,available,validate} from '../src/engine.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.G1C_EDGE_OUTPUT||'docs/g1c-round4/browser-edges';await fs.mkdir(out,{recursive:true});
const fixtures=JSON.parse(await fs.readFile('scripts/g1c-states.json','utf8'));
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const report={boundary:'Real Chromium; isolated holders and static heights; mobile viewport emulation, not a real phone',browser:browser.version(),scenarios:[],errors:[]};
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const ctx=await browser.newContext({viewport}),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.stack));
  for(const [label,actions] of Object.entries({
   'round4-zero-pair':['g1cp:fire:ignite','g1cp:wind:raise','combat:observe','g1cp:fire:quench','combat:retreat'],
   'round4-zero-pinned':['g1cp:fire:ignite','g1cp:fire:quench','g1cp:press:fall','combat:force'],
   'round4-mental-crisis':['g1cp:fire:ignite','combat:observe','combat:observe']
  })){
   await p.goto((process.env.G1C_URL||'http://127.0.0.1:8765')+'/scripts/qa-g1c.html');
   await p.locator('#fixture').selectOption(label);await p.locator('#load').click();
   let expected=fixtures[label].state;const c=fixtures[label].context;
   const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('G1C-PRODUCTION:state')));
   assert.deepEqual(await read(),expected);
   for(const action of actions){
    const before=JSON.stringify(expected);
    if(action==='combat:retreat'){
     assert.equal(expected.energy,0);assert.ok(!available(expected,c).includes('g1cp:wind:calm'));
     assert.match(await p.locator('body').innerText(),/能量已耗尽/);
     await p.screenshot({path:`${out}/${viewport.width}-${label}-warning.png`,fullPage:true});
     await p.locator('[data-do="retreat"]:visible').click();assert.equal(JSON.stringify(await read()),before);
     await p.locator('[data-do="confirm-retreat"]:visible').click();
    }else{
     let card=p.locator(`[data-skill="${action}"]:visible`);if(!await card.count())await p.locator('.ordinary-choice > summary').click();
     await card.click();assert.equal(JSON.stringify(await read()),before);await p.locator('[data-do="execute"]:visible').click();
    }
    expected=act(expected,action,c);assert.ok(validate(expected,c));
    await p.waitForFunction(s=>localStorage.getItem('G1C-PRODUCTION:state')===s,JSON.stringify(expected));
   }
   if(label==='round4-zero-pair')assert.equal(expected.g1c.wind.state,'UNCONTROLLED');
   if(label==='round4-zero-pinned'){
    assert.equal(expected.energy,0);assert.ok(!available(expected,c).includes('combat:retreat'));
    assert.match(await p.locator('body').innerText(),/不能免费解除或撤离/);
   }
   if(label==='round4-mental-crisis')assert.equal(expected.crisis,true);
   const shot=`${out}/${viewport.width}-${label}.png`;await p.screenshot({path:shot,fullPage:true});
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.reload();assert.deepEqual(await read(),expected);
   report.scenarios.push({viewport,label,actions,final:expected,screenshot:shot});
  }
  await ctx.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;throw e;}finally{await fs.writeFile(out+'/results.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({scenarios:report.scenarios.length,errors:report.errors.length,browser:report.browser}));
