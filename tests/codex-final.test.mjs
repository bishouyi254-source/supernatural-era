import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validate,upgrade} from '../src/engine.js';
import {events} from '../src/content.js';
import {gameRecords,readGameArchive,SAVE_KEY} from '../src/codex/live-adapter.js';
test('配置重排后已保存的档案编号不指向另一个实例',()=>{
 const entries=Object.entries(events),s=newGame(),before=Object.fromEntries(gameRecords(s).map(r=>[r.eventId,r.id]));
 try{for(const [id] of entries)delete events[id];for(const [id,e] of entries.reverse())events[id]=e;const after=Object.fromEntries(gameRecords(s).map(r=>[r.eventId,r.id]));assert.deepEqual(after,before);}
 finally{for(const id of Object.keys(events))delete events[id];for(const [id,e] of entries.reverse())events[id]=e;}
});
test('无存档只提示返回游戏，不创建或写入角色',()=>{let reads=0;const x=readGameArchive({getItem:k=>{assert.equal(k,SAVE_KEY);reads++;return null;}},validate,upgrade);assert.equal(reads,1);assert.equal(x.state,null);assert.ok(x.message.includes('没有游戏存档'));});
test('损坏JSON及无效schema安全保留原始存档',()=>{for(const raw of ['not json','{}','null','{"version":999}']){let writes=0;const x=readGameArchive({getItem:()=>raw,setItem:()=>writes++},validate,upgrade);assert.equal(x.state,null);assert.ok(x.message.includes('原始内容已保留'));assert.equal(writes,0);}});
test('读取被拒绝时维持空态与可恢复说明',()=>{const x=readGameArchive({getItem:()=>{throw Error('denied');}},validate,upgrade);assert.equal(x.state,null);assert.ok(x.message.includes('导出原始副本'));});
test('正常读取仅升级内存副本，不回写核心键',()=>{const raw=JSON.stringify(newGame('final')),storage={getItem:()=>raw,setItem:()=>assert.fail('must not write')};const x=readGameArchive(storage,validate,upgrade);assert.ok(validate(x.state));assert.equal(x.message,'');assert.equal(storage.getItem(SAVE_KEY),raw);});
