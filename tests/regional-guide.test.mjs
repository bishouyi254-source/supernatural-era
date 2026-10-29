import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {act,available,validate} from '../src/engine.js';
import {regionalScene} from '../src/regional-guide.js';
import {canWaitForNotice,waitForRegionalNotice} from '../src/regional-wait.js';
import {regionalView} from '../src/views-regional.js';
import {makeSpirit} from '../src/progression.js';
const fixture=()=>JSON.parse(readFileSync(new URL('../docs/fixtures/regional-ordinary.json',import.meta.url)));
function walk(route='OFFICIAL'){
 let s=fixture();const trail=[];
 for(let i=0;i<180;i++){
  const g=regionalScene(s);assert.ok(g.actions.length>0,JSON.stringify({g,phase:s.regional.phase,zone:s.regional.zone}));
  assert.ok(g.actions.length<=4);for(const a of g.actions)assert.ok(available(s).includes(a),a);
  if(s.regional.departed||s.regional.declined)return {s,trail};
  const a=!s.regional.route&&g.actions.includes('reg:choose:'+route)?'reg:choose:'+route:g.actions[0];
  trail.push(a);s=a==='reg:wait'&&canWaitForNotice(s)?waitForRegionalNotice(s).state:act(s,a);
  assert.ok(validate(s),a);
 }
 throw Error('Guide did not finish '+trail.join(','));
}
test('GUIDE ordinary current choices rescue and exit',()=>{const {s,trail}=walk();assert.equal(s.regional.outcome.saved,3);assert.equal(s.regional.outcome.player,'ESCAPED');assert.ok(trail.includes('reg:execute'));assert.equal(s.spirits.length,0);});
test('GUIDE independent rescue without official supplies',()=>{const {s}=walk('INDEPENDENT');assert.equal(s.regional.outcome.saved,4);assert.equal(s.regional.official.issued,false);});
test('GUIDE peripheral can finish without entering',()=>{const {s}=walk('PERIPHERAL');assert.equal(s.regional.zone,'cordon');assert.equal(s.regional.outcome.saved,0);});
test('GUIDE opening does not reveal undiscovered people',()=>{const s=fixture(),g=regionalScene(s);assert.doesNotMatch(JSON.stringify(g),/童倩|王岳|鬼绳|3人|4人/);const html=regionalView(s);assert.ok(html.indexOf('现在要做')<html.indexOf('查看地图、幸存者'));});
test('GUIDE wait equals normal settlement and does not mutate input',()=>{let s=act(fixture(),'reg:start');for(const a of ['reg:observe','reg:choose:OFFICIAL','reg:contact','reg:authorize'])s=act(s,a);const before=JSON.stringify(s),r=waitForRegionalNotice(s);assert.ok(r.count>0&&r.count<=12);let manual=s;for(let i=0;i<r.count;i++)manual=act(manual,'reg:wait');assert.deepEqual(r.state,manual);assert.equal(JSON.stringify(s),before);});
test('GUIDE wait stops on revival crisis',()=>{let s=act(fixture(),'reg:start');for(const a of ['reg:observe','reg:choose:INDEPENDENT'])s=act(s,a);s.spirits=[makeSpirit('echo')];s.spirits[0].revivalProgress=99.9;s.spirits[0].naturalRevivalRate=1;/* Synthetic rule fixture is not a legal acquisition: strict ledger rejects edits. */assert.equal(validate(s),false);delete s.settlement;assert.ok(validate(s));const r=waitForRegionalNotice(s);assert.equal(r.count,1);assert.equal(r.state.crisis,true);});
test('GUIDE late independent arrival misses demonstration without invented knowledge',()=>{let s=act(fixture(),'reg:start');for(const a of ['reg:observe','reg:choose:INDEPENDENT'])s=act(s,a);while(s.regional.world.chapter<181)s=act(s,'reg:wait');for(const a of ['reg:next','reg:next','reg:move:road','reg:map','reg:verify-rule','reg:next'])s=act(s,a);assert.equal(s.regional.phase,'D');assert.ok(available(s).includes('reg:next'));assert.equal(s.regional.facts.some(f=>f.id==='CANDLE'),false);assert.equal(regionalScene(s).actions[0],'reg:next');});
test('GUIDE waiting cannot skip an already available next step',()=>{let s=act(fixture(),'reg:start');for(const a of ['reg:observe','reg:choose:INDEPENDENT'])s=act(s,a);while(!available(s).includes('reg:next'))s=act(s,'reg:wait');assert.equal(canWaitForNotice(s),false);assert.deepEqual(waitForRegionalNotice(s),{state:s,count:0});});
test('GUIDE waiting never burns an active candle automatically',()=>{let s=act(fixture(),'reg:start');for(const a of ['reg:observe','reg:choose:OFFICIAL','reg:contact','reg:authorize'])s=act(s,a);while(s.regional.world.chapter<174)s=act(s,'reg:wait');for(const a of ['reg:next','reg:next','reg:move:road','reg:map','reg:verify-rule','reg:next','reg:allocate','reg:candle:light'])s=act(s,a);assert.ok(s.regional.candle.active);const before=JSON.stringify(s);assert.equal(waitForRegionalNotice(s).count,0);assert.equal(JSON.stringify(s),before);});
