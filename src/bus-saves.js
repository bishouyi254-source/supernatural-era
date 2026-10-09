// Full local checkpoint copies are separate from the engine's small milestone records.
export function busCheckpointKey(s){const first=s.bus?.checkpoints?.find(c=>c.id==='S1');return first?'supernatural-era.bus-anchors.v1.'+s.seed+'.'+first.tick:null;}
export function captureBusCheckpoint(s,previous={}){const copies={...previous};for(const c of s.bus?.checkpoints||[])if(c.tick===s.tick&&!copies[c.id])copies[c.id]=structuredClone(s);return copies;}
