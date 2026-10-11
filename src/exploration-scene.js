// Scene presentation only. Macro actions remain authoritative in engine.js.
// Walking inside a room never evades a rule, advances time, or rewinds history.
import {taskGuide} from './gameplay-guide.js';
import {actorArt} from './ui-loop.js';
export const rooms={
 hall:['############','#..........#','#..##......#','#..##......#','#..........#','#..........#','#..........#','############'],
 office:['############','#..........#','#......##..#','#......##..#','#..........#','#..##......#','#..........#','############']
};
const spawn={hall:{x:2,y:6},office:{x:2,y:6}};
export const anchors={
 hall:[{id:'chen',x:2,y:2,title:'陈宁',actions:['inv:question']},{id:'lu',x:7,y:3,title:'陆安',actions:['inv:compare','inv:protect']},{id:'search',x:9,y:5,title:'现场痕迹',actions:['inv:search']},{id:'door',x:10,y:6,title:'值班室门',actions:['inv:move:office']},{id:'exit',x:1,y:6,title:'现实出口',actions:['inv:evacuate','inv:leave']}],
 office:[{id:'record',x:3,y:2,title:'录像设备',actions:['inv:search']},{id:'wire',x:9,y:3,title:'广播接线盒',actions:['inv:cut','inv:contain','inv:seal','inv:pair','inv:capture']},{id:'door',x:1,y:6,title:'走廊门',actions:['inv:move:hall']},{id:'exit',x:2,y:6,title:'撤离通道',actions:['inv:leave','inv:evacuate']}]
};
export function walkable(zone,p){return Number.isInteger(p?.x)&&Number.isInteger(p?.y)&&rooms[zone]?.[p.y]?.[p.x]==='.';}
export function scenePosition(zone,p){return walkable(zone,p)?{x:p.x,y:p.y}:{...spawn[zone]};}
export function pathTo(zone,start,end){
 if(!walkable(zone,start)||!walkable(zone,end))return [];
 const key=p=>p.x+','+p.y,queue=[[start]],seen=new Set([key(start)]);
 while(queue.length){const path=queue.shift(),p=path.at(-1);if(key(p)===key(end))return path.slice(1);
  for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+x,y:p.y+y};if(walkable(zone,n)&&!seen.has(key(n))){seen.add(key(n));queue.push([...path,n]);}}
 }return [];
}
export function nearbyActions(zone,p,legal){return (anchors[zone]||[]).filter(o=>Math.abs(o.x-p.x)+Math.abs(o.y-p.y)<=1).flatMap(o=>o.actions.filter(a=>legal.includes(a)).map(action=>({action,title:o.title})));}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sceneView(s,p,legal,label){
 const x=s.investigation,zone=x.zone,objects=anchors[zone],near=nearbyActions(zone,p,legal);
 return `<article class="exploration"><h2>探索现场 · ${zone==='hall'?'走廊':'值班室'}</h2><p>当前目标：${esc(taskGuide(s).goal)}</p><p>方向键 / WASD移动，点击地面寻路；靠近人物或物体后交互。手机可用下方方向按钮。</p><div class="scene-grid" role="group" aria-label="可移动调查场景">${rooms[zone].flatMap((row,y)=>[...row].map((tile,i)=>{
 const o=objects.find(o=>o.x===i&&o.y===y),player=p.x===i&&p.y===y;
 const marked=o?.id==='lu'&&x.npcKnowledge.lu==='MARKED';
 const title=player?'你':o?.title||'地面';
 return `<button type="button" class="scene-tile ${tile==='#'?'wall':''} ${o?'object':''} ${player?'player':''} ${marked?'marked':''}" data-scene-cell="${i},${y}" ${tile==='#'?'disabled':''} aria-label="${esc(title)}，${i},${y}" ${player?'aria-current="location"':''}><span aria-hidden="true">${player?actorArt():o?.id==='chen'||o?.id==='lu'?actorArt():o?.id==='wire'?'▣':o?.id==='record'?'▤':o?.id==='door'||o?.id==='exit'?'门':o?'◇':''}</span>${o?`<small>${esc(o.title)}</small>`:''}</button>`;
 })).join('')}</div><p class="scene-status" role="status">位置：${p.x},${p.y} · 广播：${x.broadcast&&x.medium==='ACTIVE'?'有声音':'无声音'} · 接线：${x.medium==='INACTIVE'?'已隔离':'未隔离'} · 磁带：${x.source==='CONTAINED'?'已关押':x.source==='LOCATED'?'已定位':'未定位'}</p><div class="scene-controls" aria-label="移动控制"><button data-scene-step="0,-1" aria-label="向上移动">↑</button><button data-scene-step="-1,0" aria-label="向左移动">←</button><button data-scene-step="0,1" aria-label="向下移动">↓</button><button data-scene-step="1,0" aria-label="向右移动">→</button></div><div class="scene-nearby"><h3>附近可交互</h3>${near.map(o=>`<button data-action="${esc(o.action)}">${esc(o.title)} · ${esc(label(o.action))}</button>`).join('')||'<p>靠近陈宁、陆安、现场痕迹或房门。也可使用下方行动面板的快捷操作。</p>'}</div><p class="muted">房间内走动不消耗行动窗口；换房间、调查与使用能力按原规则结算。走位不能躲避已经触发的规律。</p></article>`;
}
export function bindScene({getState,legal,label,storage,root}){
 const s=getState();if(!s?.investigation.active||!root.querySelector('.exploration'))return;
 const zone=s.investigation.zone,k='supernatural-era.exploration.ui.v1',identity=[s.seed,s.investigation.records.length,zone].join(':');
 let saved;try{saved=JSON.parse(storage.getItem(k));}catch{}
 let p=scenePosition(zone,saved?.identity===identity?saved.position:null);
 const paint=()=>{const el=root.querySelector('.exploration');el.outerHTML=sceneView(getState(),p,legal(),label);wire();};
 const save=()=>{try{storage.setItem(k,JSON.stringify({identity,position:p}));}catch{}};
 const move=(dx,dy)=>{const n={x:p.x+dx,y:p.y+dy};if(walkable(zone,n)){p=n;save();paint();}};
 function wire(){
  root.querySelectorAll('[data-scene-step]').forEach(b=>b.onclick=()=>move(...b.dataset.sceneStep.split(',').map(Number)));
  root.querySelectorAll('[data-scene-cell]').forEach(b=>b.onclick=()=>{const [x,y]=b.dataset.sceneCell.split(',').map(Number),path=pathTo(zone,p,{x,y});if(path.length){p=path.at(-1);save();paint();}});
  // Reuse the existing action handler; never dispatch a direct state mutation.
  root.querySelectorAll('.scene-nearby [data-action]').forEach(b=>b.onclick=()=>{const proxy=[...root.querySelectorAll('[data-action]')].find(v=>!v.closest('.exploration')&&v.dataset.action===b.dataset.action);proxy?.click();});
 }
 paint();
 root.ownerDocument.onkeydown=e=>{if(e.target.closest('input,textarea,select,[contenteditable="true"]')||e.ctrlKey||e.metaKey||e.altKey)return;const dir={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}[e.key];if(dir){e.preventDefault();move(...dir);}};
}
