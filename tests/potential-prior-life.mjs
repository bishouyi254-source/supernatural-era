// Reproducible earned constitution for old three-ghost regression routes.
// This uses only engine actions. It grants no ghost, G1-C source, or fixture ownership.
import assert from 'node:assert/strict';
import {newGame,act,validate,available} from '../src/engine.js';
import {spendDeathPoint,nextLifeOptions} from '../src/character-potential.js';
let cached;
export function earnedThirdSlotOptions(){
 if(cached)return structuredClone(cached);
 let s=newGame('潜质前世回归','学生',3,'round4-prior-life');
 const go=a=>{assert.ok(available(s).includes(a),a);const n=act(s,a);assert.notStrictEqual(n,s,a);assert.ok(validate(n),a);s=n;};
 for(const a of ['chapter:perimeter','chapter:advance','chapter:avoid','chapter:leave','chapter:finish','enter:shadow','clue:witness','clue:power','theory:true','restrict','seal'])go(a);
 for(let i=0;i<80;i++)go('rest');
 for(const a of ['enter:echo','risk','risk','risk','death:commit'])go(a);
 assert.ok(s.lineage.unspent>=1);s=spendDeathPoint(s,'constitution');assert.ok(validate(s));
 cached=nextLifeOptions(s,{heightCm:175,weightKg:65,age:20});
 return structuredClone(cached);
}
