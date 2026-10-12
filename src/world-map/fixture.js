// Geographic positions and routes remain approved visual layout, not canonical distances.
export const cities=Object.freeze([
 {id:'dachang',name:'大昌市',x:27,y:44,art:'normal',summary:'第七高中 / 黄岗村 / 观江小区 / 弘法寺'},
 {id:'dahai',name:'大海市',x:73,y:29,art:'dahai',summary:'福寿园 / 明珠大厦'},
 {id:'dajing',name:'大京市',x:47,y:16,art:'dajing',summary:'总部 / 培训基地 / 平安大厦'},
 {id:'dadong',name:'大东市',x:58,y:53,art:'dadong',summary:'王家古宅 / 宁安大厦'},
 {id:'dahan',name:'大汉市',x:45,y:78,art:'dahan',summary:'鬼邮局'},
 {id:'dachuan',name:'大川市',x:16,y:78,art:'dachuan',summary:'明月小区 / 301室'},
 {id:'unknown',name:'未确认区域',x:86,y:76,unknown:true,summary:'区域情报尚未确认'}
]);
export const statuses=['可调查','调查中','已完成','已封存','未解锁','未确认'];
export const DEMO_NOTICE='当前游戏情报 · 地点插画不代表事件解锁';
export const dungeons=[];
export function setRecords(rows){dungeons.splice(0,dungeons.length,...rows);}
