const assert=require('assert');const {extract}=require('../src/naturalLanguageAdapter');const {evaluate}=require('../src/safetyEngine');const {start}=require('../src/conversationEngine');
const p=extract('My dryer is not heating and takes forever to dry');assert(p.appliance==='dryer');assert(p.symptoms.includes('not heating')||p.symptoms.includes('not drying'));
assert(evaluate({rawText:'I smell gas from the dryer'}).blocked===true);
assert(start('My refrigerator is not cooling').status==='diagnostic');
console.log('v4.1-v4.4 tests: PASS');
