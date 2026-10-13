const assert=require('assert');
const {diagnoseV3_4,buildErrorCodeContext,validateErrorCodeRegistry,normalizeErrorCode}=require('../src/v3_4DiagnosticEngine');

assert.strictEqual(normalizeErrorCode(' e-25 '),'E25');
assert.strictEqual(normalizeErrorCode('D5/EL-05'),'D5EL05');
assert.strictEqual(validateErrorCodeRegistry().ok,true);

let c=buildErrorCodeContext({code:'E25',manufacturer:'Thermador',modelNumber:'DWHD650WFM',applianceType:'dishwasher'});
assert.strictEqual(c.matched,true); assert.strictEqual(c.matchType,'exact_model'); assert.strictEqual(c.scoringEligible,false);

c=buildErrorCodeContext({code:'E99',manufacturer:'Thermador',modelNumber:'DWHD650WFM',applianceType:'dishwasher'});
assert.strictEqual(c.matched,false); assert.strictEqual(c.scoringEligible,false);

let r=diagnoseV3_4('dishwasher','won\'t drain',{water_standing:'yes',pump_hums:'yes'},{manufacturer:'Thermador',modelNumber:'DWHD650WFM',errorCode:'E25'});
assert.strictEqual(r.errorCodeContext.code,'E25'); assert.strictEqual(r.errorCodeContext.scoringEligible,false);
assert.ok(r.probability && r.probability.candidates.length>0);
assert.ok(r.errorCodeExplanation.whatItCannotDo.includes('does not prove'));

r=diagnoseV3_4('dishwasher','won\'t drain',{water_standing:'yes'},{manufacturer:'Thermador',modelNumber:'DWHD650WFM',errorCode:'E99'});
assert.strictEqual(r.errorCodeContext.matched,false); assert.ok(r.probability);

r=diagnoseV3_4('dryer','no heat',{heater_glows:'no'},{errorCode:'E25'});
assert.strictEqual(r.errorCodeContext.matched,false); assert.ok(r.probability);

console.log('v3.4 tests passed');
