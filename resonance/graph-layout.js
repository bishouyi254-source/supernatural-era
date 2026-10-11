// Data-driven concentric layout. The first five major nodes follow the approved
// composition; additional nodes occupy expandable rings, with no ownership cap.
export function layoutGraph(items){
 const nodes=new Map([['player',{x:400,y:260,r:96,ring:-1}]]);
 const primaryAngles=[-Math.PI/2,-2.83,-.38,2.36,.88];
 let index=0;
 for(let j=0;j<Math.min(5,items.length);j++){
  const a=primaryAngles[j];nodes.set(items[index++].id,{x:400+Math.cos(a)*188,y:260+Math.sin(a)*173,r:60,ring:0,angle:a});
 }
 let ring=1;
 while(index<items.length){
  const capacity=ring===1?14:ring===2?18:18+(ring-2)*8;
  const take=Math.min(capacity,items.length-index),rx=ring===1?278:334+(ring-2)*85,ry=ring===1?234:278+(ring-2)*78;
  for(let j=0;j<take;j++){
   const a=-Math.PI/2+(j/capacity)*Math.PI*2+(ring%2?.12:.03);
   nodes.set(items[index++].id,{x:400+Math.cos(a)*rx,y:310+Math.sin(a)*ry,r:ring===1?26:22,ring,angle:a});
  }ring++;
 }
 // Resolve local crowding around the asymmetrically raised character center.
 // Primary art stays in its approved quadrant; peripheral nodes can move.
 const values=[...nodes.values()];
 for(let pass=0;pass<24;pass++)for(let a=0;a<values.length;a++)for(let b=a+1;b<values.length;b++){
  const p=values[a],q=values[b],dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy),minimum=p.r+q.r+12;
  if(d>=minimum||p.ring<=0&&q.ring<=0)continue;
  const ux=d?dx/d:1,uy=d?dy/d:0,amount=minimum-d+.1;
  if(p.ring<=0){q.x+=ux*amount;q.y+=uy*amount;}
  else if(q.ring<=0){p.x-=ux*amount;p.y-=uy*amount;}
  else{p.x-=ux*amount/2;p.y-=uy*amount/2;q.x+=ux*amount/2;q.y+=uy*amount/2;}
 }
 return nodes;
}
export function boundsFor(nodes,ids=null){
 const values=[...nodes].filter(([id])=>!ids||ids.has(id)).map(([,p])=>p);
 if(!values.length)return{x:0,y:0,width:800,height:660};
 const x=Math.min(...values.map(p=>p.x-p.r-20)),y=Math.min(...values.map(p=>p.y-p.r-20));
 return{x,y,width:Math.max(...values.map(p=>p.x+p.r+20))-x,height:Math.max(...values.map(p=>p.y+p.r+43))-y};
}
export function branchIds(id,links){return new Set([id,...links.filter(e=>e.a===id||e.b===id).flatMap(e=>[e.a,e.b])]);}
