const assert=require('node:assert/strict');
const {startSession,answerSession}=require('../src/sessionEngine');

let s=startSession('dryer','no heat',{});
assert.equal(s.nextQuestion,'Is the dryer electric or gas?');
s=answerSession(s,'dryer_type','electric');
assert.ok(s.nextQuestion || s.result.status==='likely');
s=answerSession(s,'drum_turns','yes');
s=answerSession(s,'airflow_good','yes');
s=answerSession(s,'heating_element','no');
assert.equal(s.result.status,'likely');
assert.match(s.result.cause,/Heating element/);

const unsafe=startSession('refrigerator','not cooling',{smoke:'yes'});
assert.equal(unsafe.result.status,'safety_stop');
assert.equal(unsafe.nextQuestion,null);

let unknown=startSession('washer',"won't drain",{});
for(let i=0;i<10;i++) unknown=answerSession(unknown,`q${i}`,'unknown');
assert.equal(unknown.questionCount,10);
assert.ok(unknown.result.nextStep.length>10);
assert.equal(unknown.result.followUpQuestions.length,0);
console.log('PASS: session state, adaptive questioning, safety stop, and max-question escalation');
