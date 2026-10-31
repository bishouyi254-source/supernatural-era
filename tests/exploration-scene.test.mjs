import test from 'node:test';
import assert from 'node:assert/strict';
import {rooms,anchors,walkable,pathTo,scenePosition,nearbyActions,sceneView} from '../src/exploration-scene.js';
import {newGame,act,available,validate} from '../src/engine.js';
import {taskGuide} from '../src/gameplay-guide.js';
test('两个房间锚点均可从安全出生点沿有效地面到达',()=>{
 for(const zone of Object.keys(rooms))for(const a of anchors[zone]){assert.ok(walkable(zone,a));const p=scenePosition(zone);const path=pathTo(zone,p,a);assert.ok(path.length||p.x===a.x&&p.y===a.y);let prev=p;for(const n of path){assert.ok(walkable(zone,n));assert.equal(Math.abs(prev.x-n.x)+Math.abs(prev.y-n.y),1);prev=n;}}
});
test('越界、墙体、非整数位置均无法行走，坏UI档恢复安全点',()=>{
 for(const zone of Object.keys(rooms)){for(const p of [{x:0,y:0},{x:-1,y:3},{x:12,y:3},{x:1.5,y:2},{x:2,y:99},null]){assert.equal(walkable(zone,p),false);assert.deepEqual(scenePosition(zone,p),{x:2,y:6});}assert.deepEqual(pathTo(zone,{x:2,y:6},{x:0,y:0}),[]);}
});
test('附近交互同时要求距离和引擎合法性，普通人无伪能力',()=>{
 const s=act(newGame(),'inv:enter'),a=available(s);assert.deepEqual(nearbyActions('hall',{x:2,y:2},a).map(o=>o.action),['inv:question']);assert.equal(nearbyActions('hall',{x:5,y:5},a).length,0);assert.equal(nearbyActions('hall',{x:2,y:2},[]).length,0);assert.ok(!sceneView(s,{x:2,y:2},a,x=>x).includes('inv:probe:'));
});
test('地图移动、寻路、展示与帮助不改核心时间/复苏/事实',()=>{
 const s=act(newGame(),'inv:enter'),raw=JSON.stringify(s);for(const zone of Object.keys(rooms)){pathTo(zone,scenePosition(zone),{x:10,y:6});nearbyActions(zone,{x:2,y:2},available(s));}sceneView(s,{x:2,y:2},available(s),x=>x);taskGuide(s);assert.equal(JSON.stringify(s),raw);
});
test('整个新手路线每个地图对象动作可达且按原规则单次结算',()=>{
 let s=newGame();for(let i=0;i<12;i++){const action=taskGuide(s).recommended;if(s.investigation.active){const z=s.investigation.zone,o=anchors[z].find(o=>o.actions.includes(action));if(o){assert.ok(walkable(z,o));assert.ok(nearbyActions(z,o,available(s)).some(v=>v.action===action));}}const n=act(s,action);assert.equal(n.tick,s.tick+1);assert.ok(validate(n));s=n;}assert.equal(s.investigation.resolution,'Contained');assert.equal(s.spirits.length,0);
});
test('地图可视变化只投影已经发生的接线和源头状态',()=>{
 let s=newGame();for(let i=0;i<10;i++)s=act(s,taskGuide(s).recommended);const html=sceneView(s,scenePosition('office'),available(s),x=>x);assert.ok(html.includes('接线：已隔离'));assert.ok(html.includes('磁带：已定位'));assert.ok(!html.includes('NAMED_RESPONDER'));s=act(s,'inv:contain');assert.ok(sceneView(s,scenePosition('office'),available(s),x=>x).includes('磁带：已关押'));
});
