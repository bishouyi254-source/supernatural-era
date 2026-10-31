import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {act,validate} from '../src/engine.js';
const out=path.resolve(process.env.G1C_BROWSER_OUTPUT||'../../outputs/g1-c/browser-g1c'),base=process.env.G1C_URL||'http://127.0.0.1:4353';await fs.mkdir(out,{recursive:true});
const fixtures=JSON.parse(await fs.readFile('scripts/g1c-states.json','utf8'));
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'C:/Users/ziho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const report={scope:'G1-C explicit isolated holders. Actual production engine, existing battle skill cards/workshop/settlement components. Fresh desktop Chromium contexts; 390x844 viewport emulation, not a phone. Ordinary app acquisition remains unavailable.',browser:browser.version(),checks:[],actions:[],errors:[],screenshots:[]};
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
const scenarios={fire:['g1cp:fire:ignite','combat:observe','g1cp:fire:quench','combat:retreat','g1cp:fire:research:1'],wind:['g1cp:wind:raise','combat:observe','g1cp:wind:calm','combat:retreat','g1cp:wind:research:1'],press:['g1cp:press:fall','combat:observe','g1cp:press:lift','combat:retreat','g1cp:press:research:1'],
 'fire-1':['g1cp:fire:ignite','g1cp:fire:concentrate:source:shadow','g1cp:fire:quench','combat:retreat','g1cp:fire:research:2'],
 'wind-2':['g1cp:wind:raise','g1cp:wind:invade:source:shadow','g1cp:wind:calm','combat:retreat'],
 'press-2':['g1cp:press:fall','g1cp:press:intensify','g1cp:press:lift','combat:retreat'],
 'press-ally':['g1cp:press:fall','combat:observe','g1cp:press:lift','combat:retreat'],
 'press-player':['g1cp:press:fall','combat:force','g1cp:press:lift','combat:retreat'],
 'wind-body':['g1cp:wind:raise','combat:observe','g1cp:wind:calm','combat:retreat'],
 'fire-resist':['g1cp:fire:ignite','combat:observe','g1cp:fire:quench','combat:retreat'],
 pair:['g1cp:fire:ignite','g1cp:wind:raise','combat:observe','g1cp:fire:quench','combat:retreat']};
try{for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:390,height:844}]){
 const tag=''+viewport.width,ctx=await browser.newContext({viewport,acceptDownloads:true}),p=await ctx.newPage();p.setDefaultTimeout(25000);p.on('pageerror',e=>report.errors.push({tag,error:e.stack}));
 const read=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('G1C-PRODUCTION:state')));
 const shot=async label=>{const f=out+'/'+tag+'-'+label+'.png';await p.screenshot({path:f});report.screenshots.push(f);};
 await p.goto(base+'/scripts/qa-g1c.html');
 for(const [label,actions]of Object.entries(scenarios)){
  await p.locator('#fixture').selectOption(label);await p.locator('#load').click();let expected=fixtures[label].state,c=fixtures[label].context;
  check(tag+' '+label+' loaded exact qualified state',JSON.stringify(await read())===JSON.stringify(expected));await p.locator('#combat').evaluate(e=>e.scrollIntoView());await shot(label+'-combat');
  for(const a of actions){const before=JSON.stringify(await read());
   if(a==='combat:retreat'){await p.locator('[data-do="retreat"]:visible').click();check(tag+' retreat preview no cost',JSON.stringify(await read())===before);await p.locator('[data-do="confirm-retreat"]:visible').click();}
   else if(a.includes(':research:')){const b=p.locator('#research [data-action="'+a+'"]'),d=b.locator('../..');await d.locator(':scope > summary').click();await b.locator('..').locator(':scope > summary').click();check(tag+' growth preview no cost',JSON.stringify(await read())===before);await b.click();}
   else{let card=p.locator('[data-skill="'+a+'"]:visible');if(!await card.count())await p.locator('.ordinary-choice > summary').click();await card.click();check(tag+' '+label+' preview '+a+' no cost',JSON.stringify(await read())===before);await p.locator('[data-do="execute"]:visible').click();}
   expected=act(expected,a,c);await p.waitForFunction(s=>localStorage.getItem('G1C-PRODUCTION:state')===s,JSON.stringify(expected));check(tag+' '+label+' exact available/act/resolve/serialization '+a,validate(expected,c)&&JSON.stringify(await read())===JSON.stringify(expected));report.actions.push({tag,label,action:a,state:await read()});
   if(a==='combat:retreat'){check(tag+' '+label+' existing settlement component visible',await p.locator('#result [data-role="title"]').isVisible());await p.locator('#result [data-action="record"]').click();check(tag+' '+label+' actual cost record',await p.locator('#result [data-role="record-details"]').innerText().then(t=>t.includes('实际能力使用')));await p.locator('#result').evaluate(e=>e.scrollIntoView());await shot(label+'-settlement');}
  }
  check(tag+' '+label+' no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.locator('#workshop').evaluate(e=>e.scrollIntoView());await shot(label+'-workshop');await p.reload();check(tag+' '+label+' refresh exact',JSON.stringify(await read())===JSON.stringify(expected));
  const dl=p.waitForEvent('download');await p.locator('#export').click();const file=out+'/'+tag+'-'+label+'.json';await(await dl).saveAs(file);check(tag+' '+label+' exported exact state',JSON.stringify(JSON.parse(await fs.readFile(file,'utf8')))===JSON.stringify(expected));await p.locator('#test-import').setInputFiles(file);check(tag+' '+label+' imported exact state',JSON.stringify(await read())===JSON.stringify(expected));
 }
 const before=JSON.stringify(await read()),bad=JSON.parse(before);bad.g1c.fire.stage=3;const f=out+'/'+tag+'-bad.json';await fs.writeFile(f,JSON.stringify(bad));await p.locator('#test-import').setInputFiles(f);await p.getByText('拒绝无效测试副本，原状态保留。').waitFor();check(tag+' corrupted import leaves prior state',JSON.stringify(await read())===before);
 await p.goto(base+'/');for(const kind of ['fire','wind','press']){await p.locator('#import').setInputFiles(out+'/'+tag+'-'+kind+'.json');await p.getByText('导入失败：文件格式、版本或状态无效，当前进度未修改。',{exact:true}).first().waitFor({state:'attached'});check(tag+' ordinary app rejects '+kind+' isolated owner',await p.locator('[data-import-confirm]').count()===0);}
 await p.locator('#create [name="name"]').fill('G1-C普通新档兼容');await p.locator('#create button').click();await p.locator('[data-tab="角色"]:visible').first().click();check(tag+' actual character page no ghosts',await p.locator('#app').getAttribute('data-page')==='角色'&&await p.locator('body').innerText().then(t=>t.includes('当前身份与能力'))&&await p.evaluate(()=>JSON.parse(localStorage.getItem('supernatural-era.prototype.v2')).spirits.length===0));await shot('ordinary-character');await ctx.close();
 }}catch(e){report.failure=e.stack;throw e;}finally{await fs.writeFile(out+'/results.json',JSON.stringify(report,null,2));await browser.close();}
assert.equal(report.errors.length,0);console.log(JSON.stringify({checks:report.checks.length,actions:report.actions.length,errors:report.errors.length,browser:report.browser}));
