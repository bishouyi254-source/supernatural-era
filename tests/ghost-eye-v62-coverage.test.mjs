import test from 'node:test';
import assert from 'node:assert/strict';
import {legalEye,battle,step,available,act,validate,upgrade} from './ghost-eye-v6-helpers.mjs';
function formalSchool(lethal=false){let s=legalEye().state;s=step(s,'school:start');for(let n=0;s.school.window<1&&n<15;n++)s=step(s,'school:wait');s=step(s,'school:listen');if(lethal)for(let n=0;n<3;n++)s=step(s,'school:listen');return s;}

test('formal native enemy event authorizes only the documented propagation reaction',()=>{
 let s=step(formalSchool(),'school:engage-audio');s=step(s,'eye6:cast:1');
 for(let n=0;!s.combat.eyeV6.pending&&n<2;n++)s=step(s,'combat:observe');
 const i=s.combat.eyeV6.pending;
 assert.equal(i.simulation,false);assert.equal(i.kind,'propagation');assert.equal(i.scope,'external-audio-medium');
 assert.equal(i.damage,20);assert.equal(i.weight,2);assert.equal(i.interruptible,false);assert.equal(i.stoppable,false);
 assert.ok(available(s).includes('eye6:react:3'));
 for(const a of ['eye6:react:2','eye6:react:4','eye6:cast:5:self','eye6:cast:6']){
  const before=JSON.stringify(s);assert.equal(act(s,a),s,`${a} is not supported by this GDD event`);assert.equal(JSON.stringify(s),before);
 }
 assert.ok(validate(s));
});

test('A decision keeps persistent load append-only through retreat, rest, balance and portable reload',()=>{
 let s=step(battle(legalEye().state),'eye6:cast:1');
 const load=s.ghostEyeV6.persistentLoad;assert.ok(load>=1);
 s=step(s,'combat:retreat');
 const afterRetreat=s.ghostEyeV6.persistentLoad;
 s=step(s,'rest');assert.equal(s.ghostEyeV6.persistentLoad,afterRetreat);
 const balance=available(s).find(a=>a.startsWith('balance:'));
 if(balance)s=step(s,balance);
 assert.equal(s.ghostEyeV6.persistentLoad,load);
 const refreshed=JSON.parse(JSON.stringify(s));
 assert.equal(upgrade(refreshed).ghostEyeV6.persistentLoad,load);
});

test('conditional candidate budget scales linearly at 10, 20 and 30 encounters',()=>{
 for(const encounters of [10,20,30]){
  const low={energy:encounters,restored:0,revival:encounters,load:encounters};
 const occasional={energy:encounters+2*(encounters/10),restored:3*(encounters/10),revival:encounters+35*(encounters/10),load:encounters+15*(encounters/10)};
  assert.deepEqual(low,{energy:encounters,restored:0,revival:encounters,load:encounters});
  assert.deepEqual(occasional,{energy:encounters+2*(encounters/10),restored:3*(encounters/10),revival:encounters+35*(encounters/10),load:encounters+15*(encounters/10)});
 }
});
