import {createDemoRecords} from './demo-fixture.js';
import {mountCodex} from './controller.js';
const records=createDemoRecords();
mountCodex(document.querySelector('#codex-root'),{adapter:{list:()=>structuredClone(records)},mode:'demo'});
