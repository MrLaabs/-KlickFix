const assert=require('assert');
const {diagnoseV3,validateKnowledgeBase,getFailureModes}=require('../src/v3DiagnosticEngine');

const kb=validateKnowledgeBase();
assert.strictEqual(kb.ok,true,JSON.stringify(kb.errors));
assert.ok(kb.failureModeCount >= 10);

let r=diagnoseV3('dryer','no heat',{heater_glows:'no',thermal_cutoff_open:'yes'});
assert.strictEqual(r.engineVersion,'3.1.0');
assert.ok(r.probability.topDiagnosis);
assert.ok(r.probability.topDiagnosis.component.includes('Thermal'));
assert.ok(r.probability.topDiagnosis.probability >= 20);
assert.ok(r.explanations[0].why.length>0);

r=diagnoseV3('refrigerator','not cooling',{heavy_frost:'yes'});
assert.ok(r.probability.topDiagnosis);
assert.strictEqual(r.probability.topDiagnosis.component,'Defrost system');

r=diagnoseV3('dryer','no heat',{gas_smell:'yes'});
assert.strictEqual(r.status,'safety_stop');
assert.strictEqual(r.probability,null);

assert.strictEqual(getFailureModes({applianceType:'dishwasher',symptom:"won't drain"}).length,2);
console.log('V3 tests passed');
