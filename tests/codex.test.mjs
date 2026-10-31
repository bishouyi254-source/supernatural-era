import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RATINGS,projectRecord,selectRecords} from '../src/codex/model.js';
import {createDemoRecords} from '../src/codex/demo-fixture.js';
import {card,detail} from '../src/codex/components.js';
const list=()=>createDemoRecords().map(projectRecord);
test('图鉴正式评级只有六档',()=>assert.deepEqual(RATINGS,['神灵异','S','A','B','C','D']));
test('未知身份、规律、插画和评级不泄露后台值',()=>{
 const raw={id:'opaque',name:'SECRET_IDENTITY',rating:'神灵异',art:'assets/secret.png',rules:['SECRET_RULE'],source:'SECRET_SOURCE',location:'SECRET_LOCATION',completeness:90,discovered:false,world:{name:'SECRET_WORLD'}};
 const r=projectRecord(raw),html=card(r,false)+detail(r,1);
 assert.equal(r.name,'未知档案');assert.equal(r.rating,null);assert.equal(r.art,null);assert.deepEqual(r.rules,[]);assert.equal(r.completeness,null);assert.doesNotMatch(html,/SECRET/);assert.match(html,/评级未知/);
});
test('未发现但已有评级情报的档案只公开获准评级',()=>{
 const r=projectRecord({id:'unknown',rating:'S',name:'SECRET',discovered:false,evidence:{rating:'公开评级依据'}});
 assert.equal(r.rating,'S');assert.equal(r.name,'未知档案');assert.equal(r.ratingEvidence,'公开评级依据');
});
test('发现不等于身份、规律和评级全部确认',()=>{
 const r=projectRecord({id:'found',discovered:true,name:'SECRET',rules:['SECRET'],rating:'A',contacted:true});
 assert.equal(r.name,'未知档案');assert.equal(r.rating,null);assert.deepEqual(r.rules,[]);assert.equal(r.contacted,false);
});
test('非法评级即便带证据也不加入正式等级',()=>{
 for(const rating of ['M','普通','史诗','神','灵','异'])assert.equal(projectRecord({rating,evidence:{rating:'证据'}}).rating,null);
});
test('风险与评级独立：低评级仍可高危',()=>{
 const r=projectRecord({id:'r',discovered:true,rating:'D',risk:'高危',evidence:{rating:'证据',risk:'证据'}});
 assert.equal(selectRecords([r],{state:'高危',rating:'D'}).total,1);
});
test('六档筛选不会包含无证据的未知评级',()=>{
 const records=list();for(const rating of RATINGS){const result=selectRecords(records,{rating});assert.equal(result.total,3);assert.ok(result.filtered.every(r=>r.rating===rating));}
 assert.equal(records.filter(r=>r.rating===null).length,6);
});
test('搜索不会匹配未公开身份或规则',()=>{
 const hidden=projectRecord({id:'u',name:'secret title',rules:['secret rule'],discovered:false});assert.equal(selectRecords([hidden],{query:'secret'}).total,0);
});
test('已发现/未发现/接触过滤及组合筛选',()=>{
 const records=list();assert.equal(selectRecords(records,{state:'已发现'}).total,12);assert.equal(selectRecords(records,{state:'未发现'}).total,12);assert.equal(selectRecords(records,{state:'已接触'}).total,4);assert.ok(selectRecords(records,{state:'高危',rating:'神灵异'}).filtered.every(r=>r.risk==='高危'&&r.rating==='神灵异'));
});
test('搜索覆盖公开线索、空态与分页边界',()=>{
 const records=list();assert.equal(selectRecords(records,{query:'不存在的条目'}).total,0);assert.equal(selectRecords(records,{query:'证据条目示例'}).total,12);assert.equal(selectRecords(records,{page:99}).page,2);assert.equal(selectRecords(records,{page:2}).items.length,9);assert.equal(selectRecords([]).page,1);
});
test('评级排序将无评级放最后，完整度排序不伪造未知进度',()=>{
 const records=list();assert.equal(selectRecords(records,{sort:'rating',pageSize:99}).filtered.at(-1).rating,null);assert.equal(selectRecords(records,{sort:'progress',pageSize:99}).filtered.at(-1).completeness,null);
});
test('输出转义档案内容与标识，拒绝外部/可执行插画地址',()=>{
 const r=projectRecord({id:'<script>',name:'<img onerror=alert(1)>',discovered:true,art:'javascript:alert(1)',evidence:{identity:'证据'}});assert.equal(r.art,null);const html=card(r,false);assert.doesNotMatch(html,/<script>|<img onerror/);assert.match(html,/&lt;img/);
});
test('组件演示依赖不导入引擎或存档读写模块',async()=>{
 for(const name of ['demo','demo-fixture','controller','components','model']){const source=await readFile(new URL('../src/codex/'+name+'.js',import.meta.url),'utf8');assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|engine\.js|snapshot-commit|newGame\(/);}
});
test('投影和筛选不改变输入，未知进度渲染0/???',()=>{
 const raw=createDemoRecords();const before=JSON.stringify(raw);const projected=raw.map(projectRecord);selectRecords(projected,{sort:'rating'});assert.equal(JSON.stringify(raw),before);assert.match(detail(projected.at(-1),0),/0\/\?\?\?/);
});
