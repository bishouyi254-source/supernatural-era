import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const BASE='http://127.0.0.1:8765/';
await mkdir('candidate-artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  for(const [name,viewport] of [['desktop',{width:1440,height:900}],['tablet',{width:768,height:1024}],['mobile',{width:390,height:844}],['compact',{width:320,height:720}]]){
    const context=await browser.newContext({viewport,acceptDownloads:true});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const evidence={viewport,stages:{}};
    async function checkVisual(stage,selector){
      const snapshot=await page.locator(selector).evaluate(el=>{
        const all=[el,...el.querySelectorAll('.potential-inputs,.potential-static-inputs,.potential-create-core,.potential-profile,.potential-stats,.potential-death,.potential-allocations,.potential-allocation-card,.potential-next-actions')];
        return all.filter(n=>n.getClientRects().length).map(n=>{
          const b=n.getBoundingClientRect();
          return {tag:n.tagName,className:n.className,clientWidth:n.clientWidth,scrollWidth:n.scrollWidth,left:Math.round(b.left),right:Math.round(b.right),width:Math.round(b.width)};
        });
      });
      evidence.stages[stage]=snapshot;
      for(const item of snapshot){
        assert.ok(item.scrollWidth-item.clientWidth<=3,name+' '+stage+' horizontal clipping in '+item.className+': '+JSON.stringify(item));
        assert.ok(item.width>0&&item.left>=-3&&item.right<=viewport.width+3,
          name+' '+stage+' rendered outside viewport: '+JSON.stringify(item));
      }
    }
    page.on('dialog',dialog=>dialog.accept());
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await page.locator('#create').waitFor({timeout:20000});
    assert.equal(await page.locator('#create .potential-create-core-card').count(),2,name+' must show both core potential cards');
    assert.equal(await page.locator('#create .potential-static-inputs input').count(),3,name+' must show three editable physical traits');
    await checkVisual('creation','#create .potential-inputs');
    await page.screenshot({path:'candidate-artifacts/'+name+'-creation.png',fullPage:true});
    await page.locator('#create [name="name"]').fill('开发测试员');
    await page.locator('#create [name="heightCm"]').fill('182');
    await page.locator('#create [name="weightKg"]').fill('70');
    await page.locator('#create [name="age"]').fill('22');
    await page.locator('#create button').click();
    await page.locator('.topbar .identity').waitFor({timeout:20000});
    await page.locator('[data-tab="角色"]:visible').first().click();
    await page.locator('.potential-profile').waitFor({timeout:20000});
    const profile=await page.locator('.potential-profile').textContent();
    assert.match(profile,/182 cm/);assert.match(profile,/体质/);
    await checkVisual('character','.potential-profile');
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
    assert.match(panel,/死亡结算/);assert.match(panel,/潜质/);
    assert.equal(await page.locator('.potential-grade').textContent(),'C');
    assert.ok(await page.locator('.potential-death').evaluate(n=>n.getBoundingClientRect().top<=document.querySelector('.potential-death-legacy').getBoundingClientRect().top),'grade must precede legacy warning');
    assert.equal(await page.locator('.potential-allocations button').count(),2);
    const taps=await page.locator('.potential-allocations button').evaluateAll(nodes=>nodes.map(n=>Math.round(n.getBoundingClientRect().height)));
    assert.ok(taps.every(n=>n>=44),name+' allocation buttons must meet 44px hit target');
    await checkVisual('death','.potential-death');
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
    await writeFile('candidate-artifacts/'+name+'-visual-metrics.json',JSON.stringify(evidence,null,2),'utf8');
    console.log(name+': five-trait creation → character → grade/layout → allocation → next life: PASS');
    await context.close();
  }
}finally{await browser.close();}
