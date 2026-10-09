// Persistent NPC consequences; no experience, player spirit or resurrection reward.
export function commitControllerDeath(s,store,id,actor,carried,structural=[]){
 if(store.deaths.some(d=>d.id===id))return false;
 const released=carried.map(sourceId=>({id:id+':'+sourceId,sourceId,status:'ACTIVE',located:false,limited:false,archived:false}));
 store.deaths.push({id,actor,tick:s.tick,committed:true,carried:[...carried],structural:[...structural],released});
 return true;
}
