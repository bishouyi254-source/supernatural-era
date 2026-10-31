/**
 * Character potential and death-to-next-life progression.
 * Game tuning only; no ghost kill condition or canonical ghost statistics are inferred.
 * No dynamic height, posture or position tracking in this version.
 */
const isInt=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const safe=(value,minimum,maximum,fallback)=>isInt(Number(value),minimum,maximum)?Number(value):fallback;
export const TRAIT_DEFAULTS=Object.freeze({heightCm:175,weightKg:65,age:20,constitution:2,mentalBase:50});
export const POTENTIAL_LIMITS=Object.freeze({constitution:6,mentalBase:150,history:24});

export function spiritSlotLimit(s){
  return Math.min(POTENTIAL_LIMITS.constitution,s?.traits?.constitution??TRAIT_DEFAULTS.constitution);
}
export function mentalChargeLimit(s){
  const base=s?.traits?.mentalBase??TRAIT_DEFAULTS.mentalBase;
  return Math.min(4,Math.max(0,Math.floor((base-50)/10)));
}
export function mentalRuleBonus(s){
  return Math.min(3,Math.max(0,Math.floor(((s?.traits?.mentalBase??50)-50)/20)));
}
export function developmentPotential(s){
  return Math.min(100,60+Math.max(0,Math.floor(((s?.traits?.mentalBase??50)-50)/10))*4);
}
export function initialTraits(input={},lineage=null){
  const prev=lineage?.potential;
  return {
    heightCm:safe(input.heightCm,140,210,175),
    weightKg:safe(input.weightKg,40,150,65),
    age:safe(input.age,18,65,20),
    constitution:prev?.constitution??TRAIT_DEFAULTS.constitution,
    mentalBase:prev?.mentalBase??TRAIT_DEFAULTS.mentalBase,
    mentalCharges:Math.min(4,Math.floor(Math.max(0,(prev?.mentalBase??50)-50)/10))
  };
}
export function initialLineage(previous=null){
  if(previous&&validLineage(previous)){
    return {...structuredClone(previous),generation:previous.generation+1};
  }
  return {generation:1,pointsEarned:0,pointsSpent:0,unspent:0,
    potential:{constitution:TRAIT_DEFAULTS.constitution,mentalBase:TRAIT_DEFAULTS.mentalBase},
    deaths:[]};
}
export function attachPotential(s){
  if(s.traits!==undefined||s.lineage!==undefined)return s;
  return {...s,traits:initialTraits(),lineage:initialLineage()};
}
export function validLineage(l){
  return !!l&&isInt(l.generation,1,100000)&&isInt(l.pointsEarned,0,100000)&&
    isInt(l.pointsSpent,0,100000)&&isInt(l.unspent,0,100000)&&
    l.pointsEarned===l.pointsSpent+l.unspent&&
    !!l.potential&&isInt(l.potential.constitution,2,6)&&
    isInt(l.potential.mentalBase,50,150)&&
    Array.isArray(l.deaths)&&l.deaths.length<=POTENTIAL_LIMITS.history&&
    l.deaths.every(d=>d&&typeof d.runId==='string'&&d.runId.length>0&&d.runId.length<=160&&
      isInt(d.generation,1,100000)&&isInt(d.tick,0,1e9)&&isInt(d.score,0,100)&&
      ['D','C','B','A','S'].includes(d.grade)&&isInt(d.points,0,4)&&
      isInt(d.ghosts,0,100)&&isInt(d.objectives,0,1000))&&
    new Set(l.deaths.map(d=>d.runId)).size===l.deaths.length;
}
export function validPotential(s){
  if(s.traits===undefined&&s.lineage===undefined)return true; // read-only legacy save support
  const t=s.traits,l=s.lineage;
  return !!t&&validLineage(l)&&
    isInt(t.heightCm,140,210)&&isInt(t.weightKg,40,150)&&isInt(t.age,18,65)&&
    isInt(t.constitution,2,6)&&isInt(t.mentalBase,50,150)&&
    t.constitution===l.potential.constitution&&t.mentalBase===l.potential.mentalBase&&
    isInt(t.mentalCharges,0,mentalChargeLimit(s));
}

/** Evaluate recorded achievements, never time alone. No reward for immediate death farming. */
export function evaluateDeath(s){
  const ghosts=Math.min(100,s.spirits?.length??0);
  const outcomeCount=Object.keys(s.outcomes||{}).length;
  const completed=Object.values(s.journey?.chapters||{}).filter(c=>c?.completed).length;
  const investigation=(s.investigation?.records||[]).filter(r=>r?.result==='Contained'||r?.result==='Resolved').length;
  const researched=s.systems?.research?.length||0;
  const battles=(s.settlement?.records||[]).filter(r=>r?.outcome==='objective').length;
  const objectives=Math.min(1000,outcomeCount+completed+investigation+battles);
  const meaningful=ghosts>0||objectives>0||researched>0;
  const score=!meaningful||s.tick<10?0:Math.min(100,
    Math.min(20,Math.floor(s.tick/8))+
    Math.min(28,ghosts*14)+
    Math.min(36,objectives*9)+
    Math.min(16,researched*4));
  const grade=score>=80?'S':score>=60?'A':score>=40?'B':score>=20?'C':'D';
  const points={D:0,C:1,B:2,A:3,S:4}[grade];
  return {score,grade,points,ghosts,objectives};
}
export function grantDeathReward(s){
  if(s.systems?.death!=='committed')return s;
  const runId=s.settlement?.ownerId||('seed-'+s.seed+'-generation-'+s.lineage.generation);
  if(s.lineage.deaths.some(r=>r.runId===runId))return s; // idempotent
  const result=evaluateDeath(s);
  s.lineage.deaths=[...s.lineage.deaths,{
    runId,generation:s.lineage.generation,tick:s.tick,...result
  }].slice(-POTENTIAL_LIMITS.history);
  s.lineage.pointsEarned+=result.points;
  s.lineage.unspent+=result.points;
  s.journal.push('死亡评价 '+result.grade+'（'+result.score+'分），获得潜质点 '+result.points+'；下一轮可继承。');
  return s;
}
export function spendDeathPoint(input,trait){
  if(input?.systems?.death!=='committed'||!['constitution','mentalBase'].includes(trait)||
    !input.lineage?.deaths?.some(d=>d.generation===input.lineage.generation)||
    input.lineage.unspent<1)return input;
  const s=structuredClone(input),potential=s.lineage.potential;
  if(trait==='constitution'){
    if(potential.constitution>=POTENTIAL_LIMITS.constitution)return input;
    potential.constitution++;
  }else{
    if(potential.mentalBase>=POTENTIAL_LIMITS.mentalBase)return input;
    potential.mentalBase+=10;
  }
  s.lineage.unspent--;s.lineage.pointsSpent++;
  s.traits.constitution=potential.constitution;
  s.traits.mentalBase=potential.mentalBase;
  s.traits.mentalCharges=Math.min(s.traits.mentalCharges,mentalChargeLimit(s));
  return s;
}
export function nextLifeOptions(s,fields){
  if(s.systems?.death!=='committed'||!s.lineage.deaths.some(d=>d.generation===s.lineage.generation))
    throw Error('当前角色未完成死亡结算，不能进行轮回');
  return {heightCm:fields.heightCm,weightKg:fields.weightKg,age:fields.age,
    lineage:structuredClone(s.lineage)};
}
export function restrictDevelopment(before,s){
  const cap=developmentPotential(s);
  for(const g of s.spirits||[]){
    const prior=before.spirits?.find(old=>old.id===g.id)?.development??0;
    if(g.development>cap&&g.development>prior){
      g.development=Math.max(prior,cap);
      s.journal.push('精神潜质限制：'+g.name+'的开发度达到当前上限 '+Math.max(prior,cap)+'%。');
    }
  }
}
export function applyMentalCastBonus(before,s,action,usedId){
  if(!usedId||!s.traits?.mentalCharges||s.energy>=before.energy)return;
  const recognized=action==='ability'||action==='practice'||action.startsWith('practice:')||
    action.startsWith('combat:ability:')||action.startsWith('combat:focus:')||
    action.startsWith('combat:cover:')||action==='combat:combo'||action.startsWith('eye6:cast:')||
    /^g1cp:(fire|wind|press):(ignite|concentrate|quench|raise|invade|calm|fall|intensify|lift)(:|$)/.test(action);
  if(!recognized)return;
  s.energy=Math.min(3,s.energy+1);
  s.traits.mentalCharges--;
  s.journal.push('精神基础值加成：本次灵异调用返还 1 点行动能量，剩余额外次数 '+s.traits.mentalCharges+'。');
}
