const assert=require('assert');
const {diagnoseV3_3,buildModelContext,validateModelRegistry}=require('../src/v3_3DiagnosticEngine');
const {normalizeModelNumber}=require('../src/modelRegistry');

assert.strictEqual(normalizeModelNumber('DWHD-650 WFM'),'DWHD650WFM');
assert.strictEqual(normalizeModelNumber('B36CL80SNS/08'),'B36CL80SNS08');

let r=buildModelContext({manufacturer:'Thermador',modelNumber:'DWHD-650 WFM'});
assert.strictEqual(r.matchType,'exact');
assert.strictEqual(r.modelKnown,true);
assert.strictEqual(r.scoringEligible,false);

r=buildModelContext({manufacturer:'Bosch',modelNumber:'B36CL80SNS/08'});
assert.strictEqual(r.matchType,'exact');
assert.strictEqual(r.model.modelNumber,'B36CL80SNS/08');

r=buildModelContext({manufacturer:'Bosch',modelNumber:'B36CL80SNS/09'});
assert.strictEqual(r.matchType,'family');
assert.strictEqual(r.scoringEligible,false);

r=buildModelContext({manufacturer:'Unknown',modelNumber:'XYZ123'});
assert.strictEqual(r.matchType,'none');
assert.strictEqual(r.genericFallback,true);

const bad=validateModelRegistry();
assert.strictEqual(bad.ok,true,JSON.stringify(bad.errors));

let d=diagnoseV3_3('dryer','no heat',{heater_glows:'no',thermal_cutoff_open:'yes'},{manufacturer:'Unknown',modelNumber:'UNKNOWN'});
assert.ok(d.probability);
assert.strictEqual(d.reasoningUpgrade,'GENERIC_MODEL_FALLBACK');
assert.ok(d.modelExplanation.message);

// Exact model identity must be visible but must not receive invented statistical weight.
d=diagnoseV3_3('dishwasher','won\'t drain',{water_standing:'yes',pump_hums:'yes'},{manufacturer:'Thermador',modelNumber:'DWHD650WFM'});
assert.strictEqual(d.modelContext.matchType,'exact');
assert.strictEqual(d.modelContext.scoringEligible,false);
assert.strictEqual(d.probability.candidates[0].modelContext.influence,'none');
assert.ok(d.modelExplanation.whatFixIQWillNotAssume.length>=1);

console.log('v3.3 model intelligence tests: PASS');
