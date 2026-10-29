import fs from 'node:fs/promises';import {fileURLToPath} from 'node:url';
import {generate,go} from './ghost-eye-v63-audit.mjs';import {noIntelSecond} from './ghost-eye-v65-audit.mjs';
export const out='../../outputs/v651';
export function createCases(){const growth=generate(3),trace=[];let drifted=structuredClone(growth.states.mature);for(let i=0;i<7;i++)for(const a of ['enter:blood','combat:start','eye6:cast:1','combat:retreat','rest'])drifted=go(drifted,a,trace);
 let exhausted=structuredClone(growth.states.mature);const exhaustedTrace=[];for(const a of ['v1:buy:film','balance:medium','v1:item:film','balance:medium'])exhausted=go(exhausted,a,exhaustedTrace);
 const illegalTrace=[];const combat=go(go(growth.states.mature,'enter:blood',illegalTrace),'combat:start',illegalTrace);
 return {growth,noIntel:noIntelSecond(),drifted:{state:drifted,trace},exhausted:{state:exhausted,trace:exhaustedTrace},combat:{state:combat,trace:illegalTrace}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){await fs.mkdir(out,{recursive:true});await fs.writeFile(out+'/legal-cases.json',JSON.stringify(createCases()));console.log('fresh newGame/available/act/validate cases generated');}
