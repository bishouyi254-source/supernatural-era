import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,replay,step,target} from './g1c-helpers.mjs';
import {newGame,upgrade,validate,available,act} from '../src/engine.js';
import {spendDeathPoint,nextLifeOptions,grantDeathReward,spiritSlotLimit} from '../src/character-potential.js';
import {growthFor} from '../src/spirits.js';

function mental(s,value){s.traits.mentalBase=value;s.lineage.potential.mentalBase=value;s.traits.mentalCharges=Math.min(4,Math.floor((value-50)/10));return s;}

for(const kind of ['fire','wind','press'])test(`round4 ${kind}: mental refund follows full independent revival and load cost`,()=>{
 let {s,c}=fixture({ownership:[kind]});mental(s,70);s=replay(s,c);
 const before=structuredClone(s),verb={fire:'ignite',wind:'raise',press:'fall'}[kind];
 const predicted=structuredClone(s);predicted.g1c.load+=2;
 const expected=growthFor(predicted,predicted.spirits[0],true,1,kind==='press'?4:3);
 s=step(s,`g1cp:${kind}:${verb}`,c);
 assert.equal(s.energy,before.energy);assert.equal(s.traits.mentalCharges,1);
 assert.equal(s.spirits[0].revivalProgress,expected);assert.equal(s.g1c.load,2);
 assert.equal(act(s,`g1cp:${kind}:research:3`,c),s);
});

test('round4 mental rule bonus affects actual domain contest but pays revival',()=>{
 for(const [value,life] of [[50,96],[70,100]]){
  let {s,c}=fixture({targets:[target({domainWeight:3})]});mental(s,value);s=replay(s,c);
  s=step(s,'g1cp:fire:ignite',c);s=step(s,'combat:observe',c);
  assert.equal(s.life,life);assert.ok(s.spirits[0].revivalProgress>0);
 }
});

test('round4 maximum mental potential never bypasses fire backlash or revival crisis',()=>{
 let {s,c}=fixture();mental(s,150);s.spirits[0].revivalProgress=94;s=replay(s,c);
 s=step(s,'g1cp:fire:ignite',c);assert.equal(s.life,98);assert.equal(s.energy,3);
 s=step(s,'combat:observe',c);s=step(s,'combat:observe',c);
 assert.equal(s.crisis,true);assert.equal(s.spirits[0].revivalProgress,100);
 assert.equal(s.g1c.fire.state,'UNCONTROLLED');assert.equal(act(s,'g1cp:fire:ignite',c),s);
});

test('round4 G1-C death commits once, survives reload, allocates points and inherits no ghosts',()=>{
 let {s,c}=fixture({ownership:['fire','wind']});s.tick=240;s.life=0;s.systems.death='pending';
 assert.ok(validate(s,c));s=step(s,'death:commit',c);
 assert.equal(s.systems.death,'committed');assert.equal(s.lineage.deaths.length,1);
 assert.ok(s.lineage.unspent>=2);const earned=s.lineage.pointsEarned;
 s=upgrade(JSON.parse(JSON.stringify(s)));assert.ok(validate(s,c));
 assert.strictEqual(act(s,'death:commit',c),s);grantDeathReward(s);assert.equal(s.lineage.pointsEarned,earned);
 s=spendDeathPoint(spendDeathPoint(s,'constitution'),'mentalBase');assert.ok(validate(s,c));
 const next=newGame('下一轮','学生',4,'round4-next',nextLifeOptions(s,{heightCm:180,age:22,weightKg:70}));
 assert.ok(validate(next));assert.equal(next.lineage.generation,2);assert.equal(next.traits.constitution,3);
 assert.equal(next.traits.mentalBase,60);assert.equal(next.spirits.length,0);assert.equal(next.g1c,undefined);
 for(const kind of ['fire','wind','press'])assert.strictEqual(act(next,`enter:ghost-${kind}`),next);
 assert.equal(validate(s),false);
});

test('round4 legacy isolated holder above default slots remains valid without ordinary eligibility',()=>{
 let {s,c}=fixture({ownership:['fire','wind','press']});delete s.traits;delete s.lineage;
 assert.ok(validate(s,c));s=upgrade(JSON.parse(JSON.stringify(s)));
 assert.equal(spiritSlotLimit(s),2);assert.equal(s.spirits.length,3);assert.ok(validate(s,c));
 assert.equal(validate(s),false);s=replay(s,c);s=step(s,'g1cp:fire:ignite',c);
 assert.equal(s.spirits.length,3);
});

test('round4 maximum constitution grants no G1-C ownership or ordinary actions',()=>{
 const s=newGame();s.traits.constitution=6;s.lineage.potential.constitution=6;assert.ok(validate(s));
 assert.equal(spiritSlotLimit(s),6);assert.equal(s.spirits.length,0);
 assert.ok(!available(s).some(a=>a.startsWith('g1cp:')||/ghost-(fire|wind|press)/.test(a)));
});
