const assert=require('assert');
const {diagnoseV3_2,validateEvidenceGraph,getCausalNeighbors}=require('../src/v3_2DiagnosticEngine');
const {getGraphStats}=require('../src/evidenceGraph');

const valid=validateEvidenceGraph();
assert.strictEqual(valid.ok,true,JSON.stringify(valid.errors));
assert.ok(valid.nodeCount >= 100, `Expected 100+ graph nodes, got ${valid.nodeCount}`);
assert.ok(valid.edgeCount >= 250, `Expected 250+ graph edges, got ${valid.edgeCount}`);
assert.ok(getGraphStats().nodesByType.failure >= 48);

let r=diagnoseV3_2('dryer','no heat',{heater_glows:'no',thermal_cutoff_open:'yes'});
assert.strictEqual(r.engineVersion,'3.2.0');
assert.strictEqual(r.evidenceGraphVersion,'3.2.0');
assert.ok(r.probability.topDiagnosis);
assert.ok(r.probability.topDiagnosis.graph.connected);
assert.ok(r.probability.topDiagnosis.graph.causalNeighbors.length >= 1);
assert.ok(r.rootCauseWarnings.length >= 1);

r=diagnoseV3_2('dryer','no heat',{heater_glows:'no',thermal_cutoff_open:'yes',airflow_strong:'no'});
assert.ok(r.graphAdjustments.some(x=>x.failureId==='dryer_vent_restriction'), 'Expected causal airflow adjustment');

r=diagnoseV3_2('refrigerator','not cooling',{heavy_frost:'yes'});
assert.strictEqual(r.probability.topDiagnosis.component,'Defrost system');
assert.ok(r.graphSummary.connectedCandidates > 0);

assert.ok(getCausalNeighbors('dryer_thermal_cutoff').some(x=>x.failureId==='dryer_heating_element'));
console.log(`V3.2 tests passed: ${valid.nodeCount} nodes, ${valid.edgeCount} edges`);
