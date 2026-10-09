import {fateResult,develop} from './rules.js';
import {makeSpirit} from './progression.js';
import {hostState} from './spirits.js';
export function newAdvanced(){return {format:1,body:false,alienStage:0,mediaStudy:false,hungryFate:null,hungryDecision:null,consumed:0,servants:0};}
export function attachAdvanced(s){return s.advanced?s:{...s,advanced:newAdvanced()};}
const stable=s=>s.relations.length>0&&s.relations.every(r=>r.conflictAtoB+r.conflictBtoA===0&&Math.abs(r.bias||0)<30&&Math.min(r.suppressionAtoB,r.suppressionBtoA)>=.2);
export function hungryConditions(s){return {event:s.city.completed,archive:s.city.evidence.length>=3,two:s.spirits.length>=2,capacity:s.hostCapacity>=120,medium:s.city.resources.medium>=1&&s.city.residuals.some(r=>r.id==='building'&&r.stage===2),body:s.life>=60,balance:stable(s),contribution:s.city.contribution>=30};}
export function advancedAvailable(s){
 if(!s.city?.completed||s.scene!=='hub'||s.combat||s.journey.active||s.crisis||s.systems.death!=='alive'||s.systems.second?.stage==='unstable')return [];
 const x=s.advanced,c=s.city,out=[];
 if(!x.body&&c.resources.fragments>=2)out.push('advanced:body');
 if(!x.mediaStudy&&c.resources.fragments>=1)out.push('advanced:media');
 const shadow=s.spirits.find(g=>g.sourceId==='headless');
 if(x.alienStage===0&&shadow&&s.spirits.length>=2&&c.resources.fragments>0)out.push('advanced:alien:study');
 if(x.alienStage===1&&shadow?.development>=25&&x.body&&stable(s)&&s.life>=60&&c.resources.fragments>=1)out.push('advanced:alien:bind');
 if(x.hungryFate===null&&Object.values(hungryConditions(s)).every(Boolean))out.push('advanced:hungry:seek');
 if(x.hungryFate==='encounter')out.push('advanced:hungry:seal',...(s.spirits.length>=2&&s.life>=60&&stable(s)?['advanced:hungry:take']:[]));
 if(x.hungryFate==='sealed'&&s.systems.sealed.includes('hungry')&&s.spirits.length>=2&&s.life>=60&&stable(s))out.push('advanced:hungry:take');
 const hungry=s.spirits.find(g=>g.sourceId==='hungry');
 if(hungry&&s.energy>0&&x.consumed<3&&c.resources.fragments>0)out.push('advanced:hungry:feed');
 if(hungry?.development>=25&&s.energy>0&&x.servants<2)out.push('advanced:hungry:servant');
 return out;
}
export function applyAdvanced(s,action){const x=s.advanced,c=s.city,k=action.slice(9);let used=[];
 const log=t=>s.journal.push(t);
 if(k==='body'){c.resources.fragments-=2;x.body=true;s.hostCapacity+=20;log('高级承载方案完成：承载上限＋20；负荷、复苏原值保持。残余片段－2，不能重复升级。');}
 if(k==='media'){c.resources.fragments--;x.mediaStudy=true;log('媒介研究完成，后续调用的偏移幅度减为原来的75%；没有降低已有复苏。片段－1。');}
 if(k==='alien:study'){c.resources.fragments--;x.alienStage=1;log('无头鬼影身体拼图研究完成。下一步需要双向平衡、开发25与高级承载。尚未成为异类。');}
 if(k==='alien:bind'){c.resources.fragments--;x.alienStage=2;s.life-=20;s.hostCapacity+=20;log('身体拼图稳定路线完成（游戏改编）。承载＋20、身体－20；不是完美驾驭，不获得重启，累计复苏仍保留。');}
 if(k==='hungry:seek'){
  const context={archive:c.evidence.slice().sort(),contribution:c.contribution,capacity:s.hostCapacity,spirits:s.spirits.map(g=>({id:g.id,revival:g.revivalProgress})),medium:c.resources.medium};
  const f=fateResult(s.seed,'pool-II:hungry',context);x.hungryDecision=f;c.resources.medium--;
  x.hungryFate=f.roll<60?'encounter':'miss';
  log(x.hungryFate==='encounter'?'发现初生同源媒介；可尝试高风险第三鬼植入，或封存。不是城市源头的掉落。':'同源媒介未形成可驾驭实例；命运结果与消耗已提交，不重新抽签。');
 }
 if(k==='hungry:seal'){x.hungryFate='sealed';if(!s.systems.sealed.includes('hungry'))s.systems.sealed.push('hungry');s.restricted.hungry=true;s.outcomes.hungry='已封存';log('封存初生同源媒介，未植入身体。');}
 if(k==='hungry:take'){
  s.systems.sealed=s.systems.sealed.filter(id=>id!=='hungry');
  x.hungryFate='taken';const g=makeSpirit('hungry');g.development=3;
  for(const old of s.spirits)s.relations.push({spiritA:old.id,spiritB:g.id,compatibility:.45,suppressionAtoB:.25,suppressionBtoA:.25,conflictAtoB:0,conflictBtoA:0,burdenSynergy:0,specialInteraction:null,bias:0});
  s.spirits.push(g);s.outcomes.hungry='已驾驭';s.restricted.hungry=true;log('初生饿死鬼玩家实例植入：开发3%、鬼奴0；新增负荷50，复苏与未来冲突独立结算，NPC源头仍被关押。');
 }
 if(k==='hungry:feed'){c.resources.fragments--;s.energy--;x.consumed++;const g=s.spirits.find(g=>g.sourceId==='hungry');develop(g,10);used=[g.id];log('残余规则补全＋10开发；片段－1、能量－1，并承担独立调用复苏。最多补全3次。');}
 if(k==='hungry:servant'){s.energy--;x.servants++;used=['player-hungry'];log('建立有限鬼奴控制位；当前'+x.servants+'/2，承担饿死鬼调用复苏。不能突破控制上限或组成无限军队。');}
 return {used};
}
export function validAdvanced(s){const x=s.advanced;if(x===undefined)return true;
 const n=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max;
 if(!x||x.format!==1||typeof x.body!=='boolean'||typeof x.mediaStudy!=='boolean'||!n(x.alienStage,2)||!n(x.consumed,3)||!n(x.servants,2)||![null,'encounter','miss','taken','sealed'].includes(x.hungryFate))return false;
 if(x.hungryFate===null&&x.hungryDecision!==null||x.hungryFate!==null&&!x.hungryDecision)return false;
 if(x.hungryDecision){const d=x.hungryDecision;if(!d.context||typeof d.context!=='object')return false;const f=fateResult(s.seed,'pool-II:hungry',d.context);if(d.signature!==f.signature||d.roll!==f.roll||x.hungryFate==='miss'&&d.roll<60||x.hungryFate!=='miss'&&d.roll>=60)return false;}
 if(x.hungryFate==='taken'&&!s.outcomes.hungry||x.hungryFate==='sealed'&&!s.restricted.hungry)return false;
 if((x.body||x.mediaStudy||x.alienStage||x.hungryFate!==null)&&!s.city?.completed)return false;
 return true;
}
