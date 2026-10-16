export type EyeLayer = 1|2|3|4|5|6|7|8;
export type IntentKind = 'position'|'propagation'|'preparation'|'ordinary';
export interface EyeSkill {readonly layer:EyeLayer;readonly name:string;readonly energy:number;readonly revival:number;readonly burden:number;readonly cooldown:number;readonly timing:'active'|'reaction'|'both';}
export interface EyeUnlock {layer:EyeLayer;origin:'legacy-permission'|'acquisition'|'development';evidence:string;}
export interface EnemyIntent {id:string;kind:IntentKind;observable:boolean;reactable:boolean;interruptible:boolean;stoppable:boolean;weight:number;damage:number;delayed:boolean;simulation:boolean;cancelled?:boolean;nativeSchool?:boolean;scope?:'external-audio-medium';gdd?:string;engine?:string;}
export interface ReversibleEffect {id:string;target:'self'|'enemy';beneficial:boolean;reversible:boolean;suspendedUntil:number;kind?:'periodic-damage'|'empowerment';value?:number;}
export interface EyeCost {base:number;build:number;suppression:number;suppressionReduction:number;usage:number;natural:number;total:number;}
export interface EyeCostEvent extends EyeCost {id:number;round:number;layer:EyeLayer;ghostId:string;action:string;success:boolean;energySpent:number;energyRestored:number;burden:number;revivalBefore:number;revivalAfter:number|null;}
export interface EyeCampaign {format:1;unlocks:Record<string,EyeUnlock[]>;persistentLoad:number;sequence:number;energySpent:number;energyRestored:number;events:EyeCostEvent[];testDomainRounds?:2|3;}
export interface EyeCombat {round:number;completedRound?:number;domain:{remaining:number;owner:string}|null;cooldowns:Partial<Record<EyeLayer,number>>;reactionUsed:boolean;restartUsed:boolean;stasisUsed:boolean;pending:EnemyIntent|null;deferred:EnemyIntent|null;stasis:boolean;effects:ReversibleEffect[];scenario:({simulation:true}&Omit<EnemyIntent,'id'|'delayed'>)|null;snapshot:{life:number;energy:number;cooldowns:Record<string,number>;effects:ReversibleEffect[]};}
export const EYE_V6:ReadonlyArray<EyeSkill|null>;
export function newEyeV6():EyeCampaign;
