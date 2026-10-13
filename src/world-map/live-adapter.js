import {available,validate} from '../engine.js';
import {publicRecords,ARCHIVE_IDS} from '../codex/live-adapter.js';
import {genericResult,recordedResult,RESULT_LABELS} from '../encounter-outcomes.js';
const catalog=[
 ['school','dachang','第七高中 · 旧教学楼','school','school','七中现场','七中记录',['school:start','school:outside','school:join']],
 ['village','dachang','黄岗村','village','village','黄岗村现场','撤离与交接',['hg:enter']],
 ['estate','dachang','观江小区','estate'],['temple','dachang','弘法寺','temple'],
 ['cemetery','dahai','福寿园','cemetery'],['pearl','dahai','明珠大厦','pearl'],
 ['headquarters','dajing','总部',null],['training','dajing','培训基地','training'],['peace','dajing','平安大厦','peace'],
 ['house','dadong','王家古宅','house'],['ningan','dadong','宁安大厦',null],
 ['post','dahan','鬼邮局','post'],['moon','dachuan','明月小区','moon'],['room301','dachuan','301室','room301'],
 // Preserve released original cases; never relabel them as canonical locations.
 ['watch','dachang','废弃值班室 · 游戏原创',null,'investigation','调查现场','调查档案',['inv:enter']],
 ['door','dachang','C-017 公寓 · 游戏原创',null,'doorCase','公寓现场','公寓档案',['door:enter']],
 ['echo','dachang','接线室 · 游戏原创',null,'echo','现场','现场',['enter:echo']],
 ['mall','dachang','歇业商场 · 已有案件',null,'mall','商场现场','商场档案',['mall:enter']]
];
export function liveRecords(input){
 const s=input&&validate(input)?input:null,legal=s?available(s):[],publicRows=s?publicRecords(s):[];
 return catalog.map(([id,city,name,art,key,scenePage,historyPage,startActions=[]])=>{
 const supported=!!key,x=s?.[key],resultCode=genericResult(s,id)||recordedResult(s,id);
 const lastRecord=s?.settlement?.records?.slice().reverse().find(r=>r.eventId===id);
 const stageArchive=resultCode==='objective'&&lastRecord?.missionCompleted===false;
 const active=!!(x?.active||id==='echo'&&s?.scene==='echo')&&resultCode!=='failed';
 const startable=!!s&&startActions.some(a=>legal.includes(a));
 const archive=publicRows.find(a=>a.id===(ARCHIVE_IDS[id]||'CASE-'+key)&&a.discovered);
 const clues=archive?.clues||[];
 const participated=!!(resultCode||x?.participated||['investigation','doorCase','mall'].includes(key)&&x?.started||id==='echo'&&(s?.knowledge.echo||s?.outcomes.echo));
 const finished=participated&&!active&&!!(x?.playerEscaped||x?.aftermath?.submitted||x?.resolution||x?.sealed||s?.outcomes[id]||id==='mall'&&x?.result);
 const sealed=finished&&!!(x?.sealed||x?.resolution==='Contained'||resultCode==='sealed');
 const observation=s?.systems.second?.sourceId===id&&s.systems.second.stage==='unstable';
 const status=observation?'失衡观察中':resultCode==='failed'?'挑战失败':resultCode==='suppressed'?'有效压制':active?'调查中':resultCode==='controlled'?RESULT_LABELS.controlled:sealed?'已封存':stageArchive?'阶段记录已归档':resultCode?RESULT_LABELS[resultCode]:finished?(x?.playerEscaped?'已撤离':'已完成'):startable?'可调查':supported?'未解锁':'未确认';
 const canOpen=!!s&&supported&&(startable||active||participated||!!archive);
 const target=finished?historyPage:scenePage;
 const archives=archive?[{disclosure:archive.name!=='未知档案'?'confirmed':archive.rating?'rating-only':'unknown',name:archive.name,rating:archive.rating,description:[archive.source,...archive.clues,...archive.rules,...archive.encounters].join('；')||'尚无公开内容。'}]:[{disclosure:'unknown',description:'当前没有此地点的已公开关联档案。身份和评级保持未知。'}];
 return {id,city,name,art,type:'未知',danger:'未知',status,resultCode:resultCode||(sealed?'sealed':finished?(x?.playerEscaped?'escaped':'objective'):null),canOpen,target,clues,archives,
 progress:supported&&s?(participated||active||archive?`已有线索 ${clues.length} 条${finished?' · 已有处理记录':''}`:'尚无本人调查记录'):'未接入可玩事件',
 description:!s?'尚未载入有效角色存档。请返回游戏创建角色或导入已有副本。':!supported?'地点插画来自批准参考。此地点的正式事件尚待开发，不能进入。':active?'你仍在此事件中。地图查看与切换不推进时间；继续现场时遵守现有行动规则。':finished?'显示本人已有处理记录；完成不自动代表源头永久关押。':'打开现有现场或记录页面；实际进入仍需选择该页面中合法行动。',
 condition:!s?'需要先载入有效角色存档。':!supported?'待开发，暂不可进入。':canOpen?'已有现场或记录入口；不会直接传送、重开事件或跳过原有行动条件。':'现有引擎尚未开放此事件入口。请继续当前事件并核对其进入条件。',
 lockdown:'封锁信息未公开',preparation:supported?['查看已有现场准备清单']:[]};
 });
}
export function openTarget(s,id){const row=liveRecords(s).find(r=>r.id===id);return row?.canOpen?row.target:null;}
