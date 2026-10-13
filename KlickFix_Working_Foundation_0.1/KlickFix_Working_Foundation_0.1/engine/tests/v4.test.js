const assert = require('assert');
const { orchestrate, createSession, applyAnswer, ORCHESTRATOR_VERSION } = require('../src/v4Orchestrator');

let r = orchestrate({});
assert.equal(r.status, 'needs_intake');

r = orchestrate({appliance:'dryer', symptom:'no heat'});
assert.equal(r.engineVersion, ORCHESTRATOR_VERSION);
assert.ok(r.diagnosis);
assert.ok(r.evidenceSummary);
assert.ok(Array.isArray(r.rankedQuestions));
assert.ok(r.orchestrationRules.length >= 5);
assert.equal(r.parts.canRecommendVerifiedPart, false);

r = orchestrate({appliance:'dryer', symptom:'no heat', answers:{dryerType:'electric', drumTumbles:true, airflow:'strong'}});
assert.ok(r.diagnosis);
assert.ok(r.safety);
assert.ok(r.explanation.length > 20);

const s = createSession({appliance:'dryer', symptom:'no heat'});
assert.equal(s.questionCount,0);
const s2 = applyAnswer(s,{key:'dryerType',answer:'electric',question:'Is it electric or gas?'});
assert.equal(s2.questionCount,1);
assert.equal(s2.input.answers.dryerType,'electric');
assert.equal(s.questionCount,0);

console.log('v4 orchestration tests: PASS');
