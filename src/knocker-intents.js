// First formal source: existing school Canon adapter, not a synthetic encounter.
// GDD_0_10_0 §§60-65 (lines1069-1155), school-model C-02/K-03/K-04.
// Weight2 is the existing ruleFor default medium budget, NOT the S-source rank.
import {newCombat} from './combat.js';
import {eyeAvailable} from './ghost-eye-v6.js';
export const KNOCKER_DECLARATION=Object.freeze({kind:'propagation',observable:true,reactable:true,interruptible:false,stoppable:false,simulation:false,weight:2,damage:20,scope:'external-audio-medium',gdd:'GDD_0_10_0:60-65',engine:'school-model:C-02,K-03,K-04;school:advanceSchool'});
export function knockerEntry(s){const x=s.school;return x?.active&&x.window>=1&&x.window<=4&&x.pressure>0&&!s.combat&&s.systems.death==='alive'&&!s.crisis&&s.spirits.some(g=>g.sourceId==='eye')?'school:engage-audio':null;}
export function enterKnocker(s){s.scene='knocker';s.combat=newCombat('knocker',s);s.combat.nativeSchool=true;s.combat.position='exposed';s.journal.push('处理七中当前声音威胁：仅阻断本次外部传播，原七中时间与源头结果继续保留。');}
export function queueKnockerDamage(s){
 const c=s.combat,v=c?.eyeV6;if(!c?.nativeSchool||!v)return false;
 const p={...KNOCKER_DECLARATION,id:`school-audio:${s.tick}:${c.clock}`,delayed:false,nativeSchool:true};
 s.journal.push('敌方宣告：外部敲门音频传播带来接近侵蚀；不是源头准备行动。');
 if(v.domain&&!v.reactionUsed){v.pending=p;if(eyeAvailable(s).some(a=>a!=='eye6:pass'))return true;v.pending=null;}
 return false;
}
export function resolveKnockerDamage(s,p){
 if(p.cancelled){s.journal.push('隔绝了本次外部声音侵蚀；接近压力、永久记录与正史源头均保留。');return;}
 s.life=Math.max(0,s.life-p.damage);s.journal.push('七中原接近侵蚀：身体损伤'+p.damage+'。');if(s.life===0)s.systems.death='pending';
}
