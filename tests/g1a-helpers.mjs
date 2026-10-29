import {ready,step} from './v1-helpers.mjs';
import {upgrade,validate} from '../src/engine.js';
import {newCombat} from '../src/combat.js';
import assert from 'node:assert/strict';
export function legalBlood(){let s=ready(3,false);for(const a of ['enter:blood','clue:witness','clue:power','theory:true','restrict','capture','rest'])s=step(s,a);return s;}
export function bodySimulation(){
 // EXPLICIT SIMULATION: there is no repeatable body-medium foe after this
 // lawful acquisition. This creates a rule fixture, never a formal story path.
 let s=structuredClone(legalBlood());s.scene='blood';s.combat=newCombat('blood',s);delete s.settlement;s=upgrade(s);assert.ok(validate(s));return s;
}
export {step};
