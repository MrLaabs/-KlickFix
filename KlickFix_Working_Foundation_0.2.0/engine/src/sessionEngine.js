// FixIQ conversation/session layer.
// Keeps diagnostic state separate from the AI chat layer.
const { diagnose, nextQuestion, canonicalSymptom } = require('./adaptiveDiagnosticEngine');

const MAX_QUESTIONS = 10;

function clean(v){ return String(v ?? '').trim(); }
function contradictionWarnings(appliance, answers){
  const w=[];
  if(appliance==='refrigerator' && answers.freezer_cold==='yes' && answers.heavy_frost==='yes') w.push('Freezer is reported cold while heavy frost is also present; verify whether frost blocks airflow.');
  if(appliance==='washer' && answers.water_remaining==='no' && answers.pump_hums==='yes') w.push('Pump sound was reported but no water remains; verify whether the sound is actually the drain pump.');
  if(appliance==='dryer' && answers.drum_turns==='no' && answers.motor_starts==='yes') w.push('Motor is reported running but drum is not turning; verify belt/drive behavior.');
  if(appliance==='dishwasher' && answers.water_standing==='no' && answers.pump_hums==='yes') w.push('Pump sound was reported but no standing water remains; verify which pump is running.');
  return w;
}

function startSession(appliance,symptom,initialAnswers={}){
  const app=clean(appliance).toLowerCase();
  const sym=canonicalSymptom(app,symptom);
  const answers={...initialAnswers};
  const result=diagnose(app,sym,answers);
  return {
    version:'2.0', appliance:app, symptom:sym, answers,
    questionCount:0, maxQuestions:MAX_QUESTIONS,
    history:[], warnings:contradictionWarnings(app,answers),
    result, nextQuestion: result.status==='safety_stop' ? null : (nextQuestion(app,sym,answers) || null)
  };
}

function answerSession(session,questionKey,answer){
  const s={...session, answers:{...(session.answers||{})}, history:[...(session.history||[])], warnings:[...(session.warnings||[])]};
  s.answers[questionKey]=answer;
  s.questionCount=(s.questionCount||0)+1;
  s.history.push({questionKey,answer});
  s.warnings=contradictionWarnings(s.appliance,s.answers);
  s.result=diagnose(s.appliance,s.symptom,s.answers);
  if(s.result.status==='safety_stop') { s.nextQuestion=null; return s; }
  if(s.result.status==='likely' || s.questionCount>=s.maxQuestions) {
    s.nextQuestion=null;
    if(s.questionCount>=s.maxQuestions && s.result.status==='undetermined') {
      s.result={...s.result, cause:'Insufficient evidence for a responsible part-level diagnosis', confidence:30,
        nextStep:'Perform the safest model-specific test listed in the result, record the measured outcome, and submit it to FixIQ. Do not replace parts based only on a guess.',
        escalation:'technician_or_service_manual',
        followUpQuestions:[]};
    }
    return s;
  }
  s.nextQuestion=nextQuestion(s.appliance,s.symptom,s.answers);
  return s;
}

module.exports={startSession,answerSession,MAX_QUESTIONS};
