import {cities,dungeons} from './fixture.js';
export const PAGE_SIZE=4;
export const pageSize=s=>[4,6].includes(s.pageSize)?s.pageSize:6;
export const enterable=r=>!!r&&r.canOpen===true;
export function initialState(){return {city:'dachang',selected:'school',query:'',type:'全部',status:'全部',danger:'全部',sort:'默认',page:0,pageSize:6,zoom:1,panX:0,panY:0,modal:null,archiveIndex:null,notice:'选择城市与地点，查看当前游戏情报',lastEvent:null};}
export function filtered(s){let list=dungeons.filter(r=>r.city===s.city&&(s.type==='全部'||r.type===s.type)&&(s.status==='全部'||r.status===s.status)&&(s.danger==='全部'||r.danger===s.danger)&&r.name.includes(s.query.trim()));if(s.sort==='名称')list=[...list].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));return list;}
export function visible(s){return filtered(s).slice(s.page*pageSize(s),(s.page+1)*pageSize(s));}
export function selectedRecord(s){return filtered(s).find(r=>r.id===s.selected)||null;}
export function archiveView(a){if(a.disclosure==='confirmed')return {label:a.name,rating:a.rating};if(a.disclosure==='rating-only')return {label:'身份未确认',rating:a.rating};return {label:'未知档案',rating:null};}
export function archiveDetails(s){const r=selectedRecord(s),a=r?.archives[s.archiveIndex];if(!a)return null;return {...archiveView(a),disclosure:a.disclosure,location:r.name,art:'archive-unknown',description:a.description||'尚无已公开关联情报。'};}
function reconcile(s){const list=filtered(s);s.page=Math.min(s.page,Math.max(0,Math.ceil(list.length/pageSize(s))-1));const page=visible(s);if(!page.some(r=>r.id===s.selected))s.selected=page[0]?.id??null;return s;}
export function reduce(state,action){let s={...state};switch(action.type){
 case 'CITY':if(!cities.some(c=>c.id===action.id))return state;s.city=action.id;s.page=0;s.selected=null;s.modal=null;s.notice=`已切换至${cities.find(c=>c.id===s.city).name}`;return reconcile(s);
 case 'FILTER':if(!['query','type','status','danger','sort'].includes(action.key))return state;s[action.key]=action.value;s.page=0;return reconcile(s);
 case 'RESET_FILTERS':return reconcile({...s,query:'',type:'全部',status:'全部',danger:'全部',sort:'默认',page:0});
 case 'SELECT':if(filtered(s).some(r=>r.id===action.id)){s.selected=action.id;s.notice=`已选择${selectedRecord(s).name}`;}return s;
 case 'PAGE':s.page=Math.max(0,Math.min(Math.ceil(filtered(s).length/pageSize(s))-1,s.page+action.delta));return reconcile(s);
 case 'PAGE_SIZE':if(![4,6].includes(Number(action.value)))return state;return reconcile({...s,pageSize:Number(action.value),page:0});
 case 'ZOOM':s.zoom=Math.max(1,Math.min(2.2,s.zoom+action.delta));return s;
 case 'PAN':s.panX=Math.max(-500,Math.min(500,action.x));s.panY=Math.max(-300,Math.min(300,action.y));return s;
 case 'RESET_MAP':return {...s,zoom:1,panX:0,panY:0};
 case 'INFO':s.modal='info';return s;
 case 'ARCHIVE':if(!Number.isInteger(action.index)||!selectedRecord(s)?.archives[action.index])return state;s.modal='archive';s.archiveIndex=action.index;return s;
 case 'CLOSE':s.modal=null;s.archiveIndex=null;return s;
 case 'ENTER':{const r=selectedRecord(s);if(!enterable(r))return {...s,notice:'当前没有可用现场入口；请查看条件。'};s.lastEvent={type:'map:open-request',city:s.city,dungeon:r.id,target:r.target};s.notice=`正在打开${r.name}的已有现场或记录页面`;return s;}
 case 'NAV':return {...s,notice:action.name==='地图探索'?'地图探索已打开':`正在切换至${action.name}`};
 default:return state;
}}
