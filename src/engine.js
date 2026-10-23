import {g1bAllowed,g1bAvailable,g1bFilter,prepareG1B,applyG1B,advanceG1B,observeG1B,g1bMaintenance,validG1B} from './g1b-production.js';
import {productionAllowed,productionAvailable,prepareProduction,applyProduction,advanceProduction,validProduction,integrationAllowed} from './g1a-production.js';
import {candidateEnabled,candidateAvailable,applyCandidate,advanceCandidate,useCandidateContext,prepareCandidateAction,recordCandidateRequest,validCandidate} from './g1a-candidate.js';
import {attachG1A,g1aAvailable,applyG1A,validG1A} from './g1a-archives.js';
import {enterKnocker} from './knocker-intents.js';
import {newEyeV6,attachEyeV6,syncEyeUnlocks,eyeAvailable,applyEye,finishEyeCost,beginEyeRound,validEyeV6} from './ghost-eye-v6.js';
import {continueEyeReaction} from './combat.js';
import {settlementCoreToken} from './settlement-save.js';
import {initialSettlement,attachSettlement,validSettlement} from './settlement-save.js';
import {observeSettlement} from './settlement-controller.js';
import {actionReceipt,validReceipt} from './action-feedback.js';
import {attachCase24,case24Ready,case24Available,applyCase24,advanceCase24,validCase24} from './contract-case.js';
import {validCalendar} from './world-time.js';
import {validWorldRegistry} from './world-registry.js';
import {validContracts} from './contracts.js';
import {validXArchives} from './x-archives.js';
import {transitReady} from './transit-model.js';
import {transitAvailable,applyTransit,recordTransitDeath} from './transit.js';
import {newIdentityCase,attachIdentityCase,validIdentityCase} from './identity-case-model.js';
import {identityAvailable,identityBusy,applyIdentityCase,advanceIdentityCase} from './identity-case.js';
import {newPostwar,attachPostwar,validPostwar} from './postwar-model.js';
import {postwarAvailable,postwarBusy,applyPostwar,advancePostwar} from './postwar.js';
import {newFinale,attachFinale,validFinale} from './finale-model.js';
import {finaleAvailable,finaleReady,applyFinale,advanceFinale} from './finale.js';
import {newHungry,attachHungry,validHungry} from './hungry-model.js';
import {hungryAvailable,hungryReady,applyHungry,settleHungryAction} from './hungry.js';
import {newCityCrisis,attachCityCrisis,validCityCrisis} from './city-crisis-model.js';
import {crisisAvailable,applyCrisis,advanceCrisis,crisisBusy} from './city-crisis.js';
import {newMirror,attachMirror,validMirror} from './mirror-model.js';
import {mirrorAvailable,applyMirror,advanceMirror,mirrorBusy,mirrorCrisis} from './mirror.js';
import {newRegional,attachRegional,validRegional} from './regional-model.js';
import {regionalAvailable,applyRegional,advanceRegional,postRegional,regionalBusy,regionalCrisis} from './regional.js';
import {newReunion,attachReunion,validReunion} from './reunion-model.js';
import {reunionAvailable,applyReunion,advanceReunion,reunionBusy} from './reunion.js';
import {newDual,attachDual,validDual,dualAvailable,applyDual,advanceDual} from './dual.js';
import {newVillage,attachVillage,validVillage} from './village-model.js';
import {villageAvailable,applyVillage,advanceVillage,villageBusy} from './village.js';
import {newSocial,attachSocial,validSocial} from './social-model.js';
import {socialAvailable,applySocial,advanceSocial,socialAllows,socialBusy} from './social.js';
import {newMall,attachMall,validMall} from './mall-model.js';
import {mallAvailable,applyMall,advanceMall} from './mall.js';
import {newDachang,attachDachang,validDachang} from './dachang-model.js';
import {dachangAvailable,applyDachang,advanceDachang,dachangAllows} from './dachang.js';
import {newSchool,attachSchool,validSchool} from './school-model.js';
import {schoolAvailable,applySchool,advanceSchool,finishSchoolRecord,finishSchoolWorldAfterDeath} from './school.js';
import {newDoorCase,attachDoorCase,validDoorCase} from './investigation-model.js';
import {doorAvailable,applyDoor,advanceDoor,syncDoorKnowledge} from './investigation-door.js';
import {newInvestigation,attachInvestigation,investigationAvailable,applyInvestigation,advanceInvestigation,validInvestigation,syncInvestigationKnowledge} from './investigation.js';
import {newEvolution,attachEvolution,validEvolution,advancedBusy,ruleBlocked} from './evolution-model.js';
import {evolutionAvailable,applyEvolution,advanceEvolution,postEvolution} from './evolution.js';
import {newBus,attachBus,busBusy,busAvailable,applyBus,validBus,recordBusDeath,advanceBusWorld} from './bus.js';
import { events, backgrounds } from './content.js';
import { tuning, settleSpirits, validSpirits, suppressionFor } from './spirits.js';
import { validateLegacy } from './legacy.js';
import { newChapter, attachChapter, chapterState, chapterAvailable, applyChapter, validChapter } from './chapter.js';
import {newSystems,attachSystems,makeSpirit,canSecond,systemsAvailable,applySystems,validSystems} from './progression.js';
import {newJourney,attachJourney,eventUnlocked,journeyAvailable,applyJourney,validJourney} from './journey.js';
import {newCombat,combatAvailable,applyCombat,validCombat} from './combat.js';
import {develop} from './rules.js';
import {newCity,attachCity,cityAvailable,applyCity,advanceCity,validCity} from './city.js';
import {newAdvanced,attachAdvanced,advancedAvailable,applyAdvanced,validAdvanced} from './advanced.js';
import {newV1,attachV1,v1Available,applyV1,validV1,eyeMax,activeIds} from './v1.js';
export const VERSION = 2;
const clone = value => structuredClone(value);
export function newGame(name = '未登记', background = '普通职员', seed = 1, saveId = undefined) {
  if (!backgrounds.includes(background)) throw Error('未知背景');
  const s=attachCase24({ version: VERSION, name: String(name).trim().slice(0, 24) || '未登记', background, seed: seed >>> 0,
    tick: 0, revision: 0, life: 100, energy: 3, bags: 2, ward: 0, scene: 'hub', phase: '异常', crisis: false,
    ghostEyeV6:newEyeV6(),contentVersion:1,identityCase:newIdentityCase(),postwar:newPostwar(),finale:newFinale(),hungry:newHungry(),cityCrisis:newCityCrisis(),ghostMirror:newMirror(),regional:newRegional(),reunion:newReunion(),dual:newDual(),village:newVillage(),social:newSocial(),mall:newMall(),dachang:newDachang(),school:newSchool(),doorCase:newDoorCase(),investigation:newInvestigation(),evolution:newEvolution(),bus:newBus(),v1:newV1(),city:newCity(),advanced:newAdvanced(),chapter: newChapter(), journey:newJourney(), systems:newSystems(),combat:null, hostCapacity: tuning.hostCapacity, spirits: [], relations: [], compatibility: null, knowledge: {}, restricted: {}, outcomes: {}, fate: {}, journal: ['你作为普通人抵达住宅区。档案尚未建立。'] });
  const current=attachG1A(s);return {...current,settlement:initialSettlement(current,{id:saveId})};
}
const upgradeCore = s=>attachSchool(attachDoorCase(attachInvestigation(attachEvolution({...attachBus(attachV1(attachAdvanced(attachCity(attachJourney(attachSystems(attachChapter(s))))))),contentVersion:1}))));
export const upgrade=s=>{const n=attachIdentityCase(attachPostwar(attachFinale(attachHungry(attachCityCrisis(attachMirror(attachRegional(attachReunion(attachDual(attachVillage(attachSocial(attachMall(attachDachang(upgradeCore(s))))))))))))));const core=attachSettlement(attachCase24(n.dachang.started&&n.city.active?{...n,city:{...n.city,active:false}}:n));const migrated=attachG1A(attachEyeV6(core));if(migrated!==core&&validSettlement(core)){migrated.settlement=structuredClone(core.settlement);for(const session of [migrated.settlement.active,...Object.values(migrated.settlement.pending||{})])if(session)session.binding=settlementCoreToken(migrated);}return migrated;};
export function knowledge(s, id) { return s.knowledge[id] || { clues: [], hypotheses: {} }; }
function baseAvailable(s) {
  s=upgrade(s);if(s.investigation.active&&s.systems.death==='alive'&&!s.crisis)return investigationAvailable(s);if(busBusy(s))return busAvailable(s);const system=systemsAvailable(s);
  if(s.systems.death!=='alive')return [...system,...v1Available(s)];
  if (s.crisis) return [...system,...v1Available(s),'abandon'];
  if(s.combat)return [...combatAvailable(s),...v1Available(s)];
  if(s.systems.second&&['restricted','matched','unstable'].includes(s.systems.second.stage))return [...system,...(s.scene==='hub'?['rest',...chapterAvailable(s).filter(a=>a==='chapter:supply')]:['retreat'])];
  const city=cityAvailable(s);if(s.city.active)return city;
  system.push(...doorAvailable(s),...investigationAvailable(s),...busAvailable(s),...city,...advancedAvailable(s),...v1Available(s));
  if (s.scene === 'hub') return [...(s.investigation.records.some(r=>['Contained','Resolved'].includes(r.result))&&!s.school.started&&!s.outcomes.echo?['enter:echo']:[]),...system,...journeyAvailable(s),...(!s.journey.active?chapterAvailable(s):[]), ...(chapterState(s).completed ? Object.keys(events).filter(id => eventUnlocked(s,id)&&!s.outcomes[id]).map(id => 'enter:' + id) : []), ...(!s.journey.active?['rest']:[]), ...(s.spirits[0] && s.energy > 0&&!s.journey.active ? ['practice',...s.spirits.filter(g=>!s.systems.combinations.some(c=>c.disabledId===g.id)).map(g=>'practice:'+g.id)] : [])];
  const k = knowledge(s, s.scene);
  if (s.phase === '限制') return [...system,...(!s.spirits[0] ? ['capture'] :canSecond(s)?['second:begin']:[]), 'seal',...(!Object.hasOwn(s.systems.aids,s.scene)&&Object.keys(s.systems.aids).length<2?['aid']:[]),'retreat'];
  return [...events[s.scene].clues.filter(c => !k.clues.includes(c.id)).map(c => 'clue:' + c.id),
    ...(!Object.hasOwn(k.hypotheses, 'true') ? ['theory:true'] : []),
    ...(!Object.hasOwn(k.hypotheses, 'false') ? ['theory:false'] : []),
    'combat:start','risk', ...(s.spirits[0] && activeIds(s).includes(s.spirits[0].id) && s.energy > 0 ? ['ability'] : []),
    ...(k.hypotheses.true === 'confirmed' && s.bags > 0 ? ['restrict'] : []), 'retreat'];
}
function existingAvailable(input){
 if(input.investigation?.active&&input.systems.death==='alive'&&!input.crisis)return investigationAvailable(upgrade(input));
 const s=upgrade(input);if(s.combat?.nativeSchool&&!s.combat.eyeV6?.pending&&s.systems.death==='alive'&&!s.crisis)return [...combatAvailable(s),...eyeAvailable(s)];if(s.combat?.eyeV6?.pending||s.combat?.eyeV6&&s.systems.death==='pending')return [...eyeAvailable(s),...(s.systems.death==='pending'?['death:commit']:[])];if(case24Ready(s))return case24Available(s);if(transitReady(s)&&!s.bus.transit.completed)return transitAvailable(s);const ia=identityAvailable(s);if(identityBusy(s)&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s))return ia;const pa=postwarAvailable(s);if(postwarBusy(s)&&pa.length)return [...pa,...ia];const fa=finaleAvailable(s);if(fa.length)return [...fa,...pa];const ha=hungryAvailable(s);if(hungryReady(s)&&s.hungry.startUnits!==null&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s)&&ha.length)return ha;if(crisisBusy(s)&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s))return crisisAvailable(s);if(mirrorBusy(s)&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s))return mirrorAvailable(s);if(regionalBusy(s)&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s))return regionalAvailable(s);if(reunionBusy(s)&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s))return reunionAvailable(s);if(villageBusy(s)&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s))return [...villageAvailable(s),...dualAvailable(s)];if(socialBusy(s)&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s))return socialAvailable(s);if(s.mall.active&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s))return mallAvailable(s);if(s.school.active&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s))return schoolAvailable(s);if(s.doorCase.active&&s.systems.death==='alive'&&!s.crisis&&!advancedBusy(s))return doorAvailable(s);if(s.systems.death==='pending'&&s.evolution.host.form===3)return ['death:commit',...evolutionAvailable(s)];if(s.evolution.host.continuity==='失去自我')return s.systems.death==='pending'?['death:commit']:[];let actions=advancedBusy(s)&&s.systems.death==='alive'?evolutionAvailable(s):[...baseAvailable(s),...evolutionAvailable(s)];
 if(advancedBusy(s)&&!s.evolution.encounter?.active&&!s.evolution.cascade&&s.systems.death==='alive'&&s.life>0)actions.push('rest');
 if(s.evolution.host.shellDestroyed&&s.evolution.host.integrity>5&&s.energy<3&&!s.evolution.encounter?.active&&!s.evolution.cascade&&s.systems.death==='alive')actions.push('evo:host:focus');
 actions.push(...hungryAvailable(s),...crisisAvailable(s),...mirrorAvailable(s),...regionalAvailable(s),...reunionAvailable(s),...schoolAvailable(s),...dachangAvailable(s),...mallAvailable(s),...socialAvailable(s),...villageAvailable(s),...dualAvailable(s));actions.push(...eyeAvailable(s));return [...new Set(actions)].filter(a=>{if(!socialAllows(s,a)||!dachangAllows(s,a))return false;if(s.school.started&&a.startsWith('chapter:')&&a!=='chapter:supply')return false;if(a==='evo:third:begin:door'&&!s.doorCase?.sealed)return false;if(a==='evo:third:begin:door'&&s.knowledge.door?.clues.length!==3)return false;if(s.combat?.eyeV6&&a==='ability')return false;const id=a.startsWith('practice:')?a.slice(9):a.startsWith('combat:ability:')?a.slice(15):null;if(id&&ruleBlocked(s,id))return false;if(a==='practice')return activeIds(s).includes(s.spirits[0]?.id)&&!ruleBlocked(s,s.spirits[0]?.id);if(a.startsWith('practice:'))return activeIds(s).includes(id);if(a==='rest'&&s.evolution.host.shellDestroyed)return false;if(a==='abandon'&&!s.spirits.some(g=>s.evolution.nodes[g.id]?.structure!=='STRUCTURAL'))return false;if(a.startsWith('abandon:')&&s.evolution.nodes[a.slice(8)]?.structure==='STRUCTURAL')return false;return true;});
}
export function available(input,context=null){
 if(!g1bAllowed(input,context)||!validG1B(input,context))return [];
 if(!productionAllowed(input,context))return [];
 if(input.g1a?.production?.shroud.crisis)return [];
 if(input.g1a?.candidate&&!candidateEnabled(context))return [];
 if(input.g1a?.candidate?.shroud.crisis)return candidateAvailable(input,context);
 let legal=existingAvailable(input);const s=upgrade(input),x=s.g1a?.candidate;
 if(x&&candidateEnabled(context)){const ids=[x.rope.actorId,x.blood.actorId].filter(Boolean);legal=legal.filter(a=>!(a==='practice'||a==='ability'||a==='abandon'||ids.some(id=>['practice:','study:','combat:ability:'].some(p=>a===p+id))||a==='abandon:'+x.rope.actorId));}
 if(s.g1a?.production?.rope.actorId){const id=s.g1a.production.rope.actorId;legal=legal.filter(a=>!['ability','practice'].includes(a)&&!['combat:ability:','practice:','study:','abandon:'].some(p=>a===p+id));}
 return [...g1bFilter(s,[...legal,...(legal.includes('rest')?g1aAvailable(s):[]),...(s.combat||legal.includes('rest')?candidateAvailable(s,context):[]),...(s.combat||legal.includes('rest')||legal.includes('combat:start')?productionAvailable(s,context):[])]),...g1bAvailable(s,context)];
}
export function act(input, action,context=null) {
  if(input.g1b?.completed.includes(context?.requestId))return input;
  if(input.g1a?.production?.completed.includes(context?.requestId))return input;
  if (input.g1a?.candidate?.completed.includes(context?.requestId)||!available(input,context).includes(action)) return input;
  const before=upgrade(input), s = clone(before); const log = text => s.journal.push(text);
  prepareProduction(s,context);
  prepareG1B(s,context);
  useCandidateContext(s,context);
  prepareCandidateAction(s,context);
  recordCandidateRequest(s,context);
  let eyeResult=null,candidateResult=null;
  if(action.startsWith('eye6:react:')||action==='eye6:pass'){
   eyeResult=applyEye(s,action);if(eyeResult.used)settleSpirits(s,eyeResult.used,null,{[eyeResult.used]:eyeResult.usage},false);
   finishEyeCost(s);continueEyeReaction(s);advanceCandidate(before,s,action,context);advanceProduction(before,s,action,context);advanceG1B(before,s,action,context);s.revision=before.revision+1;s.actionReceipt=actionReceipt(before,s,action);s.journal=s.journal.slice(-100);return observeSettlement(before,s,action,eyeResult.used);
  }
  s.tick++; let usedId = null, stimulusId = null;
  const wasMirrorCrisis=mirrorCrisis(s);
  const wasRegionalCrisis=regionalCrisis(s);
  const mallCrisis=s.mall.active&&s.mall.phase==='CRISIS';
  const reunionCrisis=s.reunion.active&&['D','F'].includes(s.reunion.phase);
  const reunionWindow=s.reunion.active&&s.reunion.phase==='D'&&s.reunion.party.state==='TRAPPED';
  if(action.startsWith('g1bp:')){candidateResult=applyG1B(s,action,context);usedId=candidateResult.used;if(s.combat)applyCombat(s,'combat:eye-action');}
  else if(action.startsWith('g1ap:')){candidateResult=applyProduction(s,action,context);usedId=candidateResult.used;if(s.combat)applyCombat(s,'combat:eye-action');}
  else if(action.startsWith('g1ac:')){candidateResult=applyCandidate(s,action,context);usedId=candidateResult.used;if(s.combat)applyCombat(s,'combat:eye-action');}
  else if(action.startsWith('g1a:'))applyG1A(s,action);
  else if(action==='school:engage-audio'){enterKnocker(s);}
  else if(action.startsWith('eye6:cast:')){beginEyeRound(s);eyeResult=applyEye(s,action);usedId=eyeResult.used;applyCombat(s,'combat:eye-action',true);}
  else if(action.startsWith('cx:'))applyCase24(s,action);
  else if(action.startsWith('tr:')){const r=applyTransit(s,action);usedId=r.used;if(r.extra){const g=s.spirits.find(g=>g.id===r.extra.id);g.revivalProgress=Math.min(100,g.revivalProgress+r.extra.amount);}}
  else if(action.startsWith('ic:'))usedId=applyIdentityCase(s,action);
  else if(action.startsWith('pw:'))usedId=applyPostwar(s,action);
  else if(action.startsWith('ff:'))usedId=applyFinale(s,action);
  else if(action.startsWith('he:'))usedId=applyHungry(s,action);
  else if(action.startsWith('cc:'))usedId=applyCrisis(s,action);
  else if(action.startsWith('gm:'))usedId=applyMirror(s,action);
  else if(action.startsWith('reg:'))usedId=applyRegional(s,action);
  else if(action.startsWith('rj:'))usedId=applyReunion(s,action);
  else if(action.startsWith('dual:'))usedId=applyDual(s,action);
  else if(action.startsWith('hg:'))usedId=applyVillage(s,action);
  else if(action.startsWith('social:'))usedId=applySocial(s,action);
  else if(action.startsWith('mall:'))usedId=applyMall(s,action);
  else if(action.startsWith('dc:'))applyDachang(s,action);
  else if(action.startsWith('school:'))usedId=applySchool(s,action);
  else if(action.startsWith('door:'))usedId=applyDoor(s,action);
  else if(action.startsWith('inv:'))usedId=applyInvestigation(s,action);
  else if(action.startsWith('evo:'))usedId=applyEvolution(s,action).used;
  else if(action.startsWith('bus:')){const result=applyBus(s,action);usedId=result.used;if(result.extra){const g=s.spirits.find(g=>g.id===result.extra.id);g.revivalProgress=Math.min(100,g.revivalProgress+result.extra.amount);}}
  else if(action.startsWith('v1:')){const result=applyV1(s,action);if(result.extra){const g=s.spirits.find(g=>g.id===result.extra.id);g.revivalProgress=Math.min(100,g.revivalProgress+result.extra.amount);}if(['v1:domain:cast','v1:seal:cast'].includes(action))applyCombat(s,'combat:domain');}
  else if(action.startsWith('city:'))usedId=applyCity(s,action).used;
  else if(action.startsWith('advanced:'))usedId=applyAdvanced(s,action).used;
  else if(action==='second:begin'){s.systems.second={sourceId:s.scene,stage:'restricted',plan:null,mode:null,result:null};log('候选与限制已完成，进入第二鬼匹配阶段。');}
  else if(action==='combat:start'){s.combat=newCombat(s.scene,s);log('规则遭遇开始：行动条决定源头结算时机，厉鬼没有气血。');}
  else if(action.startsWith('combat:')){if(s.combat?.nativeSchool&&action==='combat:avoid')applySchool(s,'school:avoid');usedId=applyCombat(s,action).used;}
  else if(action.startsWith('journey:')){applyJourney(s,action);}
  else if(systemAction(action)){applySystems(s,action);}
  else if (action.startsWith('chapter:')) { applyChapter(s,action); } else if (action.startsWith('enter:')) {
    s.scene = action.slice(6); s.phase = s.restricted[s.scene] ? '限制' : '异常'; log(events[s.scene].intro);
    if(canSecond(s))s.systems.second={sourceId:s.scene,stage:'candidate',plan:null,mode:null,result:null};
    if (s.background === '安保') log('背景线索：可从值班记录开始调查。');
    if (s.background === '医疗相关') log('背景线索：侵蚀可能同时影响身体与意识。');
  } else if (action === 'rest') {
    s.life = Math.min(100, s.life + (s.v1.build==='body'||s.advanced.alienStage===2||s.evolution.host.form===3?10:20)); s.energy = 3;
    log('安全屋恢复身体和行动能力；累计复苏不下降。');
  } else if (action === 'practice' || action.startsWith('practice:') || action === 'ability') {
    const spirit=action.startsWith('practice:')?s.spirits.find(g=>g.id===action.slice(9)):s.spirits[0];
    usedId = spirit.id; s.energy = Math.max(0, s.energy - 1);develop(spirit,3);
    if (action === 'ability') s.ward = 1;
    log(`${spirit.name}能力被调用，开发度＋3。对应厉鬼的复苏增长；这不会杀死厉鬼。`);
  } else if (action === 'suppress') {
    for (const g of s.spirits) { g.suppressionRemaining = tuning.suppressionActions + 1; } s.life = Math.max(1, s.life - 20); s.crisis = false;
    log('紧急压制以身体损伤为代价，暂时结束复苏危机。厉鬼仍在体内。');
  } else if (action === 'abandon') {
    const danger=s.spirits.filter(g=>s.evolution.nodes[g.id]?.structure!=='STRUCTURAL').sort((a,b)=>b.revivalProgress-a.revivalProgress)[0];applySystems(s,'abandon:'+danger.id);
  } else if (action === 'retreat') {
    log(s.dachang.started?'返回城市联系点，不代表附着异常解除或自动进入隔离安全屋。':'撤回安全屋。已获得的证据与事件状态保留。');if(s.dachang.started)s.dachang.zone='street'; s.scene = 'hub'; s.ward = 0;
  } else {
    const id = s.scene; const event = events[id];
    s.knowledge[id] ||= { clues: [], hypotheses: {} }; const k = s.knowledge[id];
    if (action.startsWith('clue:')) {
      const c = event.clues.find(c => c.id === action.slice(5)); k.clues.push(c.id); log('已确认事实：' + c.text); s.phase = '调查';
      s.spirits.filter(g=>g.sourceId===id).forEach(g=>develop(g,5));
    } else if (action.startsWith('theory:')) {
      const key = action.slice(7);
      const enough = k.clues.includes('witness') && k.clues.includes('power');
      k.hypotheses[key] = enough ? (key === 'true' ? 'confirmed' : 'disproved') : 'unverified';
      log(enough ? (key === 'true' ? '规律得到证据支持，限制方案已开放。' : '现有证据否定了这条推测。') : '未验证信息：缺少记录与对照观察。继续调查后可复核。');
      if (!enough) delete k.hypotheses[key]; // Insufficient evidence must not permanently lock a hypothesis.
      if (enough && key === 'true') s.phase = '规律暴露';
    } else if (action === 'risk') {
      if (s.ward) { s.ward = 0; log('灵异暂时阻断了本次触发媒介。保护已经消耗，厉鬼并未消失。'); }
      else { s.life = Math.max(0, s.life - 45); stimulusId = s.spirits[0]?.id || null; log(event.riskText); }
      if (s.life === 0) { s.systems.death='pending';log('致死进入反应窗口，必须使用已有反应资源；没有免费救援。事件与档案保留。'); }
    } else if (action === 'restrict') {
      s.bags--; s.restricted[id] = true; s.phase = '限制'; log(event.restriction + '隔离袋已经消耗。');
    } else if (['capture', 'seal', 'aid'].includes(action)) {
      // Fate decision is committed in the same state transition as the outcome.
      s.fate[id] = { seed: s.seed, tick: s.tick, action, result: 'success' };
      s.outcomes[id] = { capture: '已驾驭', seal: '已封存', aid: '援助联系' }[action];
      if (action === 'capture') s.spirits.push(makeSpirit(id));
      if(action==='seal'&&!s.systems.sealed.includes(id))s.systems.sealed.push(id);
      if(action==='aid')s.systems.aids[id]={remaining:2,used:0};
      log(s.outcomes[id] + '：' + event.spirit + '。玩家实例不影响任何正史角色。');
      s.phase = '处理'; s.scene = 'hub';
    }
  }
  advanceInvestigation(s,action);
  syncInvestigationKnowledge(s);
  if(!s.dachang.started&&!action.startsWith('city:'))advanceCity(s,1);
  advanceBusWorld(s);
  advanceRegional(s,action,wasRegionalCrisis?1:4,s.dachang.timeUnits+(wasMirrorCrisis||wasRegionalCrisis||reunionCrisis||mallCrisis||s.village.active&&['F','ESCAPE'].includes(s.village.phase)&&action.startsWith('dual:')?1:4));
  settleHungryAction(s,action,s.dachang.timeUnits+(wasMirrorCrisis||wasRegionalCrisis||reunionCrisis||mallCrisis||s.village.active&&['F','ESCAPE'].includes(s.village.phase)&&action.startsWith('dual:')?1:4));
  s.evolution=attachEvolution(s).evolution;
  advanceEvolution(s,usedId);
  observeG1B(s,action,context);
  settleSpirits(s, usedId, stimulusId,eyeResult?{[usedId]:eyeResult.usage}:candidateResult?.used?{[usedId]:candidateResult.usage}:{},true,g1bMaintenance(s));finishEyeCost(s);syncEyeUnlocks(s,action);
  postEvolution(s);
  if(s.doorCase.sealed&&s.spirits.some(g=>g.sourceId==='door'))s.doorCase.driven=true;
  advanceDoor(s,action);
  syncDoorKnowledge(s);
  advanceSchool(s,action);finishSchoolRecord(s);if(action==='death:commit')finishSchoolWorldAfterDeath(s);
  if(s.crisis&&busBusy(s)&&s.systems.death==='alive'){s.life=0;s.systems.death='pending';}
  recordBusDeath(s);recordTransitDeath(s);
  s.v1.eye.layer=Math.min(s.v1.eye.layer,eyeMax(s));
  if(s.v1.active!==null)s.v1.active=s.v1.active.filter(id=>s.spirits.some(g=>g.id===id));
  if (s.crisis&&!busBusy(s)) { s.scene = 'hub';s.combat=null;s.ward=0; log('复苏危机：常规行动暂停。请选择压制或逐只放弃厉鬼。'); }
  if(action.startsWith('inv:')&&s.investigation.records.at(-1)?.tick===s.tick){const r=s.investigation.records.at(-1);r.revivalDelta=Object.fromEntries(s.spirits.map(g=>[g.id,g.revivalProgress-(s.investigation.startRevival[g.id]??g.revivalProgress)]));}
  if(s.investigation.active&&(s.crisis||s.systems.death!=='alive'))s.investigation.active=false;
  advanceDachang(s,action,usedId,wasMirrorCrisis||wasRegionalCrisis||reunionCrisis||mallCrisis||s.village.active&&['F','ESCAPE'].includes(s.village.phase)&&action.startsWith('dual:')?1:4);
  advanceCase24(s);
  advanceFinale(s,s.dachang.timeUnits);
  advancePostwar(s);
  advanceIdentityCase(s);
  advanceMirror(s);
  advanceCrisis(s);
  advanceMall(s,action,mallCrisis);
  advanceSocial(s,action,usedId);
  advanceVillage(s,action);
  advanceDual(s,action,usedId);
  advanceReunion(s,action,reunionWindow);

  postRegional(s);
  advanceCandidate(before,s,action,context);
  advanceProduction(before,s,action,context);
  advanceG1B(before,s,action,context);
  // Persist the same existing compatibility defaults that a reload/available()
  // would attach, before binding the completed encounter snapshot.
  Object.assign(s,attachCase24(s));
  s.revision++;
  if(!eyeResult){s.ghostEyeV6.energySpent+=Math.max(0,before.energy-s.energy);s.ghostEyeV6.energyRestored+=Math.max(0,s.energy-before.energy);}
  s.actionReceipt=actionReceipt(before,s,action);
  s.journal = s.journal.slice(-100); return observeSettlement(before,s,action,usedId);
}
function systemAction(a){return ['second:','release:','abandon:','reaction:','death:','balance:','study:'].some(p=>a.startsWith(p));}

export function validate(s,context=null) {
  if(!validG1B(s,context))return false;
  if(!s||!validG1A(s)||!validCandidate(s,context)||!validProduction(s,context)||!validEyeV6(s)||!validReceipt(s)||!validSettlement(s))return false;
  if(s.spirits.some(g=>g.sourceId==='g1a-rope-candidate')&&!candidateEnabled(context)&&!(s.g1a?.production?.testOnly&&integrationAllowed(s,context)))return false;
  if(!s||!Array.isArray(s.spirits)||!Array.isArray(s.relations))return false;
  if(!validCase24(s)||!validCalendar(s)||!validWorldRegistry(s)||!validContracts(s)||!validXArchives(s)||!validIdentityCase(s)||!validPostwar(s)||!validFinale(s)||!validHungry(s)||!validCityCrisis(s)||!validMirror(s)||!validRegional(s)||!validReunion(s)||!validDual(s)||!validVillage(s)||!validSocial(s)||!validMall(s)||!validDachang(s)||!validSchool(s)||!validDoorCase(s)||!validInvestigation(s)||!validEvolution(s))return false;
  if (s && (Object.hasOwn(s, 'pressure') || Object.hasOwn(s, 'ghost') || Object.hasOwn(s, 'totalRevival'))) return false;
  if (!s || !validSpirits(s, events) || !validBus(s)||!validCity(s)||!validAdvanced(s)||!validV1(s)||s.contentVersion!==undefined&&s.contentVersion!==1 || !validChapter(s.chapter) || !validJourney(s.journey)||!validSystems(s)||!validCombat(s) || s.version !== VERSION || !backgrounds.includes(s.background) || typeof s.name !== 'string' || s.name.length > 24 ||
      !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 4294967295 ||
      !['hub', ...Object.keys(events)].includes(s.scene) || !['异常', '调查', '规律暴露', '限制', '处理'].includes(s.phase) || typeof s.crisis !== 'boolean') return false;
  for (const [key, max] of Object.entries({ life: 100, energy: 3, bags: 2, ward: 1, tick: 1e9, revision: 1e9 }))
    if (!Number.isInteger(s[key]) || s[key] < 0 || s[key] > max) return false;
  if (!Array.isArray(s.journal) || s.journal.length > 100 || s.journal.some(x => typeof x !== 'string' || x.length > 2000)) return false;
  for (const key of ['knowledge', 'restricted', 'outcomes', 'fate']) {
    if (!s[key] || typeof s[key] !== 'object' || Array.isArray(s[key]) || Object.keys(s[key]).some(id => !events[id])) return false;
  }
  if (Object.values(s.restricted).some(x => x !== true) || (s.scene !== 'hub' && s.phase === '限制' && !s.restricted[s.scene])) return false;
  for (const [id, k] of Object.entries(s.knowledge)) {
    if (!k || !Array.isArray(k.clues) || new Set(k.clues).size !== k.clues.length || k.clues.some(c => !events[id].clues.some(x => x.id === c)) ||
        !k.hypotheses || typeof k.hypotheses !== 'object' || Array.isArray(k.hypotheses) || Object.entries(k.hypotheses).some(([key, val]) => !['true','false'].includes(key) || !['confirmed','disproved'].includes(val))) return false;
  }
  if (Object.values(s.outcomes).some(x => !['已驾驭', '已结合', '已封存', '援助联系', '紧急封存'].includes(x))) return false;
  for (const f of Object.values(s.fate)) if (!f || f.seed !== s.seed || !Number.isInteger(f.tick) || f.tick < 0 || f.tick > s.tick || !['capture','seal','aid'].includes(f.action) || f.result !== 'success') return false;
  if (s.compatibility !== null && (!s.compatibility || s.compatibility.sourceVersion !== 1 || s.compatibility.strategy !== 'restart-revival-from-fixture' || !Number.isFinite(s.compatibility.legacyMixedPressure) || s.compatibility.legacyMixedPressure < 0 || s.compatibility.legacyMixedPressure > 100)) return false;
  return true;
}

export function migrateLegacy(old) {
  if (!validateLegacy(old)) throw Error('旧存档无效');
  const s = clone(old); s.version = VERSION; s.chapter = newChapter(); s.hostCapacity = tuning.hostCapacity; s.spirits = []; s.relations = [];
  s.compatibility = { sourceVersion: 1, strategy: 'restart-revival-from-fixture', legacyMixedPressure: old.pressure };
  if (old.ghost) { const e = events[old.ghost.sourceId]; s.spirits.push({ id: old.ghost.instanceId, sourceId: old.ghost.sourceId, name: old.ghost.name, burden: e.load, revivalProgress: e.initialRevival, naturalRevivalRate: e.naturalRevivalRate, usageRevivalRate: e.usageRevivalRate, suppressionRemaining: 0, suppressionReceived: 0, activityLevel: '正常', development: 0, stability: '稳定' }); }
  delete s.ghost; delete s.pressure; s.crisis = false;
  s.journal.push('明确版本迁移：旧混合压力仅作兼容记录；负荷取内容表，复苏按新试验初始值重新建立，不视为无损恢复。'); s.journal = s.journal.slice(-100);
  if (!validate(s)) throw Error('迁移失败'); return s;
}

