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

// Direct orchestration/API calls must not bypass the shared safety screen.
for (const symptom of ['I smell gas near the dryer', 'the carbon monoxide alarm is sounding', 'smoke is coming from the appliance']) {
  const unsafe = orchestrate({appliance:'dryer', symptom});
  assert.equal(unsafe.status, 'blocked', `expected hard stop for: ${symptom}`);
  assert.equal(unsafe.safety.blocked, true, `expected safety.blocked for: ${symptom}`);
  assert.equal(unsafe.nextBestQuestion, null, `unsafe intake must not receive follow-up questions: ${symptom}`);
  assert.equal(unsafe.rankedQuestions.length, 0, `unsafe intake must not receive ranked questions: ${symptom}`);
}

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
