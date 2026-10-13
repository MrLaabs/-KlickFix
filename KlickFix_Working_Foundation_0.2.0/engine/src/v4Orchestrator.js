// FixIQ v4 - AI Orchestration Layer
// Orchestrates deterministic diagnostic intelligence. External LLMs are adapters only;
// they never bypass safety, evidence, compatibility, or calibration rules.
const { diagnoseV3_6, buildReliabilityReport } = require('./v3_6DiagnosticEngine');
const { findParts } = require('./partsRegistry');
const { evaluate: evaluateSafetyInput } = require('./safetyEngine');

const ORCHESTRATOR_VERSION = '4.0.0';
const MAX_QUESTIONS = 12;
const MIN_CONFIDENCE_TO_FINALIZE = 80;
const SAFETY_BLOCK_STATUSES = new Set(['stop', 'blocked', 'professional_required']);

function text(v){ return String(v ?? '').trim(); }
function uniq(a){ return [...new Set((a || []).filter(Boolean))]; }
function clamp(n,a,b){ return Math.max(a,Math.min(b,n)); }

function normalizeInput(input = {}) {
  return {
    appliance: text(input.appliance || input.applianceType).toLowerCase(),
    manufacturer: text(input.manufacturer),
    modelNumber: text(input.modelNumber || input.model),
    symptom: text(input.symptom || input.primarySymptom),
    answers: { ...(input.answers || {}) },
    errorCode: text(input.errorCode || input.error_code),
    context: { ...(input.context || {}) },
    session: { ...(input.session || {}) },
    outcomeRecords: Array.isArray(input.outcomeRecords) ? input.outcomeRecords : []
  };
}

function safetyGate(result, input = {}){
  // Apply the shared keyword safety screen to raw intake as well as engine output.
  // This protects direct /diagnose calls, which do not pass through conversationEngine.start().
  const intakeSafety = evaluateSafetyInput({
    symptom: input.symptom || input.primarySymptom,
    rawText: input.rawText || input.description || input.symptom || input.primarySymptom,
    errorCode: input.errorCode || input.error_code,
    description: input.description
  });
  if (intakeSafety.blocked) {
    return {
      status: 'professional_required',
      blocked: true,
      message: intakeSafety.messages[0] || 'A possible safety hazard was identified. Stop diagnosis and seek qualified help.',
      reasons: intakeSafety.matchedRules,
      matchedRules: intakeSafety.matchedRules,
      actions: intakeSafety.actions,
      hardStop: true
    };
  }
  const safetyText = `${text(result?.safety)} ${text(result?.cause)}`.toLowerCase();
  const hard = /gas leak|smoke|burning|fire|electrocution|sparks|live voltage|carbon monoxide|refrigerant leak|explosion/.test(safetyText);
  const explicit = result?.safetyStatus && SAFETY_BLOCK_STATUSES.has(result.safetyStatus);
  if (hard || explicit) {
    return {
      status: 'professional_required',
      blocked: true,
      message: 'Safety takes priority. Stop the diagnostic procedure and use a qualified professional when the condition may involve an immediate hazard.',
      reasons: uniq([result?.safety, result?.cause])
    };
  }
  return { status:'clear', blocked:false, message:'No orchestration-level hard stop was triggered.' };
}

function candidateSet(result){ return result?.probability?.candidates || []; }

function contradictionCount(candidate){
  const evidence = candidate?.evidence || [];
  return evidence.filter(e => e && (e.type === 'negative' || e.polarity === 'negative' || e.contradiction === true)).length;
}

function rankQuestions(result, answers = {}) {
  const candidates = candidateSet(result);
  const questions = result?.followUpQuestions || [];
  if (!questions.length) return [];
  const unanswered = questions.filter(q => !Object.keys(answers).some(k => text(answers[k]).toLowerCase() && q.toLowerCase().includes(k.toLowerCase())));
  const top = candidates.slice(0,5);
  return unanswered.map((question, index) => {
    const q = question.toLowerCase();
    let coverage = 0;
    for (const c of top) {
      const blob = JSON.stringify(c).toLowerCase();
      if (q.split(/\W+/).filter(Boolean).some(token => token.length > 3 && blob.includes(token))) coverage += 1;
    }
    const safetyBoost = /gas|voltage|leak|smoke|fire|electrical|burn/.test(q) ? 2 : 0;
    return {
      question,
      informationValue: clamp(coverage + safetyBoost + (questions.length-index)*0.01,0,10),
      rationale: coverage ? 'This question can separate multiple leading diagnostic candidates.' : 'This question narrows the diagnostic branch before a component recommendation is made.'
    };
  }).sort((a,b)=>b.informationValue-a.informationValue);
}

function buildEvidenceSummary(result){
  const top = candidateSet(result).slice(0,3);
  return top.map(c => ({
    failureModeId:c.id,
    component:c.component,
    probability:c.probability,
    supportingEvidence:(c.evidence||[]).filter(e=>e && e.polarity !== 'negative').slice(0,5),
    contradictions:contradictionCount(c),
    recommendedTests:c.tests || [],
    safetyRisk:c.safetyRisk || 'unknown'
  }));
}

function buildCustomerExplanation(result, safety, nextQuestion){
  const top = candidateSet(result)[0];
  if (safety.blocked) return safety.message;
  if (!top) return 'FixIQ does not yet have enough information to identify the most likely cause. The next question is intended to narrow the diagnosis safely.';
  const probability = top.probability ?? 0;
  const certainty = result.confidence >= MIN_CONFIDENCE_TO_FINALIZE ? 'strong' : 'working';
  const test = (top.tests || [])[0];
  return `FixIQ's ${certainty} leading possibility is ${top.component || top.id} (${probability}% provisional/calibrated probability). This is a diagnostic lead, not proof that the part has failed. ${test ? `The next best confirmation is ${test.replace(/_/g,' ')}.` : nextQuestion ? `The next best question is: ${nextQuestion}.` : 'Additional evidence is recommended before replacing a part.'}`;
}

function orchestrate(input = {}) {
  const normalized = normalizeInput(input);
  if (!normalized.appliance || !normalized.symptom) {
    return {
      engineVersion: ORCHESTRATOR_VERSION,
      status:'needs_intake',
      requiredFields:['appliance','symptom'].filter(k => !normalized[k]),
      message:'Tell FixIQ what appliance you are diagnosing and what it is doing wrong.'
    };
  }

  const context = {
    ...normalized.context,
    manufacturer: normalized.manufacturer || normalized.context.manufacturer,
    modelNumber: normalized.modelNumber || normalized.context.modelNumber,
    errorCode: normalized.errorCode || normalized.context.errorCode
  };

  const diagnosis = diagnoseV3_6(normalized.appliance, normalized.symptom, normalized.answers, context, normalized.outcomeRecords);
  const safety = safetyGate(diagnosis, normalized);
  const questions = safety.blocked ? [] : rankQuestions(diagnosis, normalized.answers);
  const topQuestion = safety.blocked ? null : (questions[0]?.question || diagnosis.followUpQuestions?.[0] || null);
  const evidence = buildEvidenceSummary(diagnosis);
  const parts = diagnosis.partsContext || { canRecommendVerifiedPart:false, verifiedCompatibleParts:[] };
  const finality = safety.blocked ? 'blocked' : (diagnosis.status === 'diagnosed' && diagnosis.confidence >= MIN_CONFIDENCE_TO_FINALIZE ? 'diagnosis_ready' : 'continue_questions_or_testing');

  return {
    engineVersion: ORCHESTRATOR_VERSION,
    status: finality,
    session: {
      questionCount: Number(normalized.session.questionCount || 0),
      maxQuestions: MAX_QUESTIONS,
      canContinue: !safety.blocked && Number(normalized.session.questionCount || 0) < MAX_QUESTIONS
    },
    intake: normalized,
    safety,
    diagnosis,
    evidenceSummary:evidence,
    nextBestQuestion: topQuestion,
    rankedQuestions:questions,
    parts: {
      canRecommendVerifiedPart:!!parts.canRecommendVerifiedPart,
      verifiedCompatibleParts:parts.verifiedCompatibleParts || [],
      explanation:diagnosis.partsExplanation
    },
    explanation:buildCustomerExplanation(diagnosis,safety,topQuestion),
    orchestrationRules:[
      'Deterministic diagnostic evidence remains authoritative over language-model wording.',
      'Safety gates cannot be overridden by probability or AI-generated suggestions.',
      'A diagnosis does not automatically establish part compatibility.',
      'Calibrated probabilities require verified completed repair outcomes; otherwise scores remain provisional.',
      'Unknown model/error-code information must not be fabricated.'
    ],
    audit: {
      calibrationStatus:diagnosis.probabilityCalibration?.status || 'unavailable',
      modelMatch:diagnosis.modelContext || null,
      errorCode:diagnosis.errorCodeContext || null,
      timestamp:new Date().toISOString()
    }
  };
}

function createSession(initialInput = {}) {
  return {
    id: text(initialInput.sessionId) || `fixiq_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    questionCount:0,
    history:[],
    input:normalizeInput(initialInput),
    createdAt:new Date().toISOString(),
    version:ORCHESTRATOR_VERSION
  };
}

function applyAnswer(session, answer = {}) {
  if (!session || typeof session !== 'object') throw new Error('session is required');
  const next = JSON.parse(JSON.stringify(session));
  next.questionCount = Number(next.questionCount || 0) + 1;
  next.history.push({ question:answer.question || null, answer:answer.answer, at:new Date().toISOString() });
  const key = text(answer.key || answer.field || answer.questionKey);
  if (key) next.input.answers[key] = answer.answer;
  return next;
}

function getReliabilityReport(outcomeRecords = [], options = {}) { return buildReliabilityReport(outcomeRecords, options); }

module.exports = { ORCHESTRATOR_VERSION, MAX_QUESTIONS, MIN_CONFIDENCE_TO_FINALIZE, normalizeInput, safetyGate, rankQuestions, buildEvidenceSummary, orchestrate, createSession, applyAnswer, getReliabilityReport };
