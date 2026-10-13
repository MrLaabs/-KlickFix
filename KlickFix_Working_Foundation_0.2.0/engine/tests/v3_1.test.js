const assert=require('assert');
const {diagnoseV3,validateKnowledgeBase,getFailureModes,getComponents,getTests}=require('../src/v3DiagnosticEngine');

const kb=validateKnowledgeBase();
assert.strictEqual(kb.ok,true,JSON.stringify(kb.errors));
assert.ok(kb.failureModeCount >= 45, `Expected 45+ failure modes, got ${kb.failureModeCount}`);

let r=diagnoseV3('dryer','no heat',{heater_glows:'no',thermal_cutoff_open:'yes'});
assert.strictEqual(r.engineVersion,'3.1.0');
assert.ok(r.probability.topDiagnosis);
assert.ok(r.probability.topDiagnosis.component.includes('Thermal'));
assert.ok(r.explanations[0].why.length>0);

r=diagnoseV3('refrigerator','not cooling',{heavy_frost:'yes'});
assert.strictEqual(r.probability.topDiagnosis.component,'Defrost system');

r=diagnoseV3('dishwasher','not drying',{water_hot:'no',element_continuity:'no'});
assert.ok(r.probability.topDiagnosis.component.includes('Heating element'));

r=diagnoseV3('washer',"won't drain",{water_remaining:'yes',pump_hums:'yes'});
assert.ok(r.probability.topDiagnosis.component.includes('Drain pump'));

assert.ok(getComponents({applianceType:'dryer',system:'heat'}).length >= 4);
assert.ok(getTests({applianceType:'dishwasher',symptom:'not cleaning'}).includes('spray_arm_check'));

console.log(`V3.1 tests passed with ${kb.failureModeCount} failure modes`);
