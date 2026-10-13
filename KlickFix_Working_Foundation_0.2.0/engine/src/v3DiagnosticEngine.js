// FixIQ Engine v3 facade. v2 remains untouched and is still available for regression comparison.
const { diagnose: diagnoseV2, canonicalSymptom } = require('./adaptiveDiagnosticEngine');
const { rankDiagnoses, chooseNextBestQuestion, explainRanking } = require('./probabilityEngine');
const { getFailureModes, getComponents, getTests, validateKnowledgeBase, KB_VERSION } = require('./knowledgeBase');

function buildQuestionObjects(v2Result){
  return (v2Result.followUpQuestions || []).map((text,i)=>({id:`q_${i+1}`,key:inferKey(text),text,safetyPriority:/gas|smoke|spark|water|power|electrical/i.test(text)?2:0}));
}
function inferKey(text){
  const t=String(text).toLowerCase();
  if(t.includes('compressor')) return 'compressor_running';
  if(t.includes('evaporator fan')) return 'evaporator_fan';
  if(t.includes('frost')) return 'heavy_frost';
  if(t.includes('airflow')) return 'airflow_strong';
  if(t.includes('water')) return 'water_standing';
  if(t.includes('pump')) return 'pump_hums';
  if(t.includes('lock') || t.includes('latch')) return 'lock_engages';
  if(t.includes('fill')) return 'fills';
  if(t.includes('spray')) return 'water_spray';
  if(t.includes('heat') || t.includes('hot')) return 'water_hot';
  return text;
}

function diagnoseV3(appliance,symptom,answers={},context={}){
  const app=String(appliance||'').trim().toLowerCase();
  const sym=canonicalSymptom(app,symptom);
  const v2=diagnoseV2(app,sym,answers);
  if(v2.status==='safety_stop') return {...v2, engineVersion:'3.1.0', probability:null, knowledgeBaseVersion:KB_VERSION};
  const ranking=rankDiagnoses({applianceType:app,symptom:sym,answers,context});
  const questions=buildQuestionObjects(v2);
  const next=chooseNextBestQuestion({rankedCandidates:ranking.candidates,availableQuestions:questions});
  const fallback=ranking.candidates.length===0;
  return {
    ...v2,
    engineVersion:'3.1.0',
    knowledgeBaseVersion:KB_VERSION,
    probability: ranking,
    explanations: explainRanking(ranking),
    nextBestQuestion: next?.text || v2.nextQuestion || null,
    nextBestQuestionId: next?.id || null,
    scoringStatus: fallback ? 'NO_KB_MATCH' : 'PROVISIONAL',
    disclaimer:'Probabilities are provisional decision-support scores until FixIQ is calibrated against verified repair outcomes.'
  };
}

module.exports={diagnoseV3,getFailureModes,getComponents,getTests,validateKnowledgeBase};
