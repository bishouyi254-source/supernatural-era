import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,upgrade,validate,available,act} from '../src/engine.js';
import {
  spiritSlotLimit,mentalChargeLimit,mentalRuleBonus,developmentPotential,
  evaluateDeath,grantDeathReward,spendDeathPoint,nextLifeOptions,
  applyMentalCastBonus,restrictDevelopment
} from '../src/character-potential.js';

const fresh=(id='save-candidate')=>newGame('候选玩家','普通职员',101,id,{heightCm:182,weightKg:70,age:22});
const dead=(id='save-deceased')=>{
  const s=fresh(id);s.systems.death='committed';s.life=0;
  s.tick=240;s.outcomes.echo='已封存';s.spirits=[{id:'player-test',name:'试验鬼',development:5}];
  return grantDeathReward(s);
};

test('new character retains five independent creation fields and a valid v2 save',()=>{
  const s=fresh();assert.equal(s.traits.heightCm,182);assert.equal(s.traits.weightKg,70);
  assert.equal(s.traits.age,22);assert.equal(s.traits.constitution,2);
  assert.equal(s.traits.mentalBase,50);assert.equal(spiritSlotLimit(s),2);
  assert.equal(mentalChargeLimit(s),0);assert.equal(developmentPotential(s),60);
  assert.ok(validate(s));
});

test('legacy v2 without traits upgrades without erasing existing save fields',()=>{
  const old=fresh('save-old');delete old.traits;delete old.lineage;
  assert.ok(validate(old));
  const upgraded=upgrade(old);
  assert.ok(validate(upgraded));assert.equal(upgraded.settlement.ownerId,old.settlement.ownerId);
  assert.equal(upgraded.lineage.generation,1);assert.equal(upgraded.traits.constitution,2);
});

test('immediate deaths with no recorded progress never award potential',()=>{
  const s=fresh('save-farm');s.systems.death='committed';s.life=0;s.tick=8;
  grantDeathReward(s);
  assert.equal(s.lineage.deaths[0].grade,'D');
  assert.equal(s.lineage.unspent,0);
});

test('death evaluation counts existing progression evidence, not UI claims',()=>{
  const s=dead();const result=evaluateDeath(s);
  assert.ok(result.score>=40);assert.equal(result.grade,'B');
  assert.equal(s.lineage.deaths[0].points,2);
  assert.equal(s.lineage.unspent,2);
});

test('same finalized run never awards death points twice',()=>{
  const s=dead('save-once');grantDeathReward(s);grantDeathReward(s);
  assert.equal(s.lineage.deaths.length,1);assert.equal(s.lineage.pointsEarned,2);
});

test('points separately increase host slots and mental potential',()=>{
  const s=dead('save-spend');const first=spendDeathPoint(s,'constitution');
  assert.equal(first.traits.constitution,3);assert.equal(spiritSlotLimit(first),3);
  const second=spendDeathPoint(first,'mentalBase');
  assert.equal(second.traits.mentalBase,60);
  assert.equal(second.lineage.unspent,0);
  assert.equal(mentalChargeLimit(second),1);
  assert.equal(developmentPotential(second),64);
  assert.strictEqual(spendDeathPoint(second,'mentalBase'),second);
});

test('next life resets ghosts and story but inherits paid potential',()=>{
  const s=spendDeathPoint(spendDeathPoint(dead('save-next'),'constitution'),'mentalBase');
  const fields=nextLifeOptions(s,{heightCm:168,weightKg:62,age:19});
  const next=newGame('新轮回','普通职员',102,'save-next-new',fields);
  assert.ok(validate(next));assert.equal(next.spirits.length,0);
  assert.equal(next.tick,0);assert.equal(next.lineage.generation,2);
  assert.equal(next.traits.heightCm,168);assert.equal(next.traits.constitution,3);
  assert.equal(next.traits.mentalBase,60);assert.equal(next.traits.mentalCharges,1);
  assert.equal(next.lineage.deaths.length,1);
});

test('mental casts refund energy at most once per remaining charge without suppressing revival',()=>{
  const before=fresh('save-mental');before.traits.mentalBase=70;
  before.lineage.potential.mentalBase=70;before.traits.mentalCharges=2;
  before.energy=3;
  const after=structuredClone(before);after.energy=2;
  applyMentalCastBonus(before,after,'practice:player-eye','player-eye');
  assert.equal(after.energy,3);assert.equal(after.traits.mentalCharges,1);
  applyMentalCastBonus(before,after,'rest','player-eye');
  assert.equal(after.traits.mentalCharges,1);
  assert.equal(mentalRuleBonus(after),1);
});

test('development potential never reduces legacy development that was already earned',()=>{
  const before=fresh('save-cap');
  before.spirits=[{id:'player-eye',name:'鬼眼',development:88}];
  const after=structuredClone(before);after.spirits[0].development=91;
  restrictDevelopment(before,after);
  assert.equal(after.spirits[0].development,88);
  assert.ok(after.journal.some(x=>x.includes('精神潜质限制')));
});

test('death allocation cannot occur before death is finalized',()=>{
  const s=fresh('save-alive');
  assert.strictEqual(spendDeathPoint(s,'constitution'),s);
  assert.throws(()=>nextLifeOptions(s,{heightCm:180,weightKg:70,age:22}));
});


test('real engine death:commit grants exactly one reward with no free resurrection',()=>{
  const s=fresh('save-engine-death');s.tick=240;s.life=0;s.systems.death='pending';s.outcomes.echo='已封存';
  assert.ok(validate(s),'pending death fixture must be a valid original engine state');
  assert.ok(available(s).includes('death:commit'));
  const result=act(s,'death:commit');
  assert.notStrictEqual(result,s);
  assert.equal(result.systems.death,'committed');
  assert.equal(result.life,0);
  assert.equal(result.lineage.deaths.length,1);
  assert.ok(result.lineage.unspent>0);
  assert.ok(validate(result),'death reward must remain a valid real game save');
  const repeated=act(result,'death:commit');
  assert.strictEqual(repeated,result);
  assert.equal(repeated.lineage.deaths.length,1);
});
