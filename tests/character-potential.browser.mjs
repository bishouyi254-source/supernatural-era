import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const BASE='http://127.0.0.1:8765/';
await mkdir('candidate-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  for(const [name,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
    const context=await browser.newContext({viewport,acceptDownloads:true});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',dialog=>dialog.accept());
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await page.locator('#create').waitFor({timeout:20000});
    await page.locator('#create [name="name"]').fill('开发测试员');
    await page.locator('#create [name="heightCm"]').fill('182');
    await page.locator('#create [name="weightKg"]').fill('70');
    await page.locator('#create [name="age"]').fill('22');
    await page.locator('#create button').click();
    await page.locator('.topbar .identity').waitFor({timeout:20000});
    await page.locator('[data-tab="角色"]').first().click();
    await page.locator('.potential-profile').waitFor({timeout:20000});
    const profile=await page.locator('.potential-profile').textContent();
    assert.match(profile,/182 cm/);assert.match(profile,/体质/);
    await page.screenshot({path:'candidate-artifacts/'+name+'-character.png',fullPage:true});

    // Browser-only final-death fixture. Verified against the real engine's save validator.
    // This is NOT ordinary player progression and does not grant access to locked ghosts.
    await page.evaluate(async()=>{
      const {validate}=await import('/src/engine.js');
      const {grantDeathReward}=await import('/src/character-potential.js');
      const key='supernatural-era.prototype.v2';
      const s=JSON.parse(localStorage.getItem(key));
      s.systems.death='committed';s.life=0;s.tick=240;s.outcomes.echo='已封存';
      grantDeathReward(s);
      if(!validate(s))throw Error('death fixture failed save validation');
      localStorage.setItem(key,JSON.stringify(s));
    });
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('.potential-death').waitFor({timeout:20000});
    const panel=await page.locator('.potential-death').textContent();
    assert.match(panel,/死亡评价/);assert.match(panel,/潜质/);
    await page.screenshot({path:'candidate-artifacts/'+name+'-death.png',fullPage:true});
    await page.locator('[data-potential-allocate="mentalBase"]').click();
    const afterAllocate=await page.evaluate(()=>JSON.parse(localStorage.getItem('supernatural-era.prototype.v2')));
    assert.equal(afterAllocate.traits.mentalBase,60);
    assert.equal(afterAllocate.lineage.unspent,0);

    await page.locator('#potential-next-life [name="name"]').fill('第二轮角色');
    await page.locator('#potential-next-life [name="heightCm"]').fill('168');
    await page.locator('#potential-next-life button[type="submit"]').click();
    await page.locator('.topbar .identity').waitFor({timeout:20000});
    const next=await page.evaluate(()=>JSON.parse(localStorage.getItem('supernatural-era.prototype.v2')));
    assert.equal(next.name,'第二轮角色');assert.equal(next.traits.heightCm,168);
    assert.equal(next.traits.mentalBase,60);assert.equal(next.lineage.generation,2);
    assert.equal(next.spirits.length,0);assert.equal(next.tick,0);
    assert.deepEqual(errors,[],name+' browser page errors');
    await page.screenshot({path:'candidate-artifacts/'+name+'-next-life.png',fullPage:true});
    console.log(name+': character → death evaluation → allocation → next life: PASS');
    await context.close();
  }
}finally{await browser.close();}
