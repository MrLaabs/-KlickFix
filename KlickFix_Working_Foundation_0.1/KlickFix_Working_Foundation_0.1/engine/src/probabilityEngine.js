// FixIQ Engine v3 - Explainable Probability Scoring Engine
// Scores candidates from bounded evidence. Values are decision-support scores until calibrated on real outcomes.
const { getFailureModes } = require('./knowledgeBase');

const YES = new Set(['yes','y','true','1','yeah','yep']);
const NO = new Set(['no','n','false','0','nope']);
function norm(v){ return String(v ?? '').trim().toLowerCase(); }
function bool(v){ const x=norm(v); if(YES.has(x)) return true; if(NO.has(x)) return false; return null; }
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }

function evidenceValue(answer, expected){
  const b=bool(answer);
  if (b===null) return null;
  return expected === 'yes' ? (b ? 1 : -1) : (b ? -1 : 1);
}

function scoreCandidate(candidate, symptom, answers={}, context={}){
  const prior=candidate.priors?.[symptom] ?? 0.05;
  let logit=Math.log(prior/(1-prior));
  const evidence=[];
  for (const [key, weights] of Object.entries(candidate.evidence || {})) {
    const answer=answers[key];
    const b=bool(answer);
    if (b===null) continue;
    const contribution = weights[b ? 'yes' : 'no'] ?? 0;
    logit += contribution;
    evidence.push({key,answer: b?'yes':'no',contribution,impact: contribution>0?'supports':contribution<0?'contradicts':'neutral'});
  }
  if (context.modelCompatibility === false) { logit -= 4; evidence.push({key:'model_compatibility',answer:'incompatible',contribution:-4,impact:'contradicts'}); }
  if (context.modelCompatibility === true) { logit += 1.5; evidence.push({key:'model_compatibility',answer:'compatible',contribution:1.5,impact:'supports'}); }
  if (context.errorCodeMatch === true) { logit += 2.5; evidence.push({key:'error_code',answer:'matched',contribution:2.5,impact:'supports'}); }
  if (context.errorCodeContradiction === true) { logit -= 3; evidence.push({key:'error_code',answer:'contradiction',contribution:-3,impact:'contradicts'}); }
  const raw=1/(1+Math.exp(-logit));
  return { id:candidate.id, component:candidate.component, system:candidate.system, score:raw, logit, evidence, tests:candidate.tests, safetyRisk:candidate.safetyRisk };
}

function confidenceFor(top, second, evidenceCount){
  if (!top) return 'UNKNOWN';
  const gap=top.score-(second?.score ?? 0);
  if (evidenceCount>=3 && top.score>=0.72 && gap>=0.20) return 'HIGH';
  if (evidenceCount>=1 && top.score>=0.55 && gap>=0.10) return 'MEDIUM';
  return 'LOW';
}

function rankDiagnoses({applianceType,symptom,answers={},context={}}){
  const candidates=getFailureModes({applianceType,symptom}).map(c=>scoreCandidate(c,symptom,answers,context)).sort((a,b)=>b.logit-a.logit);
  // Softmax over evidence-adjusted logits gives a coherent relative distribution across competing candidates.
  const maxLogit=candidates.length ? Math.max(...candidates.map(c=>c.logit)) : 0;
  const expScores=candidates.map(c=>Math.exp(c.logit-maxLogit));
  const total=expScores.reduce((s,c)=>s+c,0) || 1;
  const ranked=candidates.map((c,i)=>({...c,probability:Math.round((expScores[i]/total)*100)}));
  const top=ranked[0], second=ranked[1];
  const evidenceCount=ranked.reduce((n,c)=>n+c.evidence.filter(e=>e.impact!=='neutral').length,0);
  return { candidates:ranked, topDiagnosis:top || null, confidence:confidenceFor(top,second,evidenceCount), evidenceCount };
}

function chooseNextBestQuestion({rankedCandidates=[],availableQuestions=[]}){
  if (!availableQuestions.length || rankedCandidates.length<2) return availableQuestions[0] || null;
  // Expected separation heuristic: choose a question that is relevant to competing top candidates.
  const top=rankedCandidates.slice(0,Math.min(4,rankedCandidates.length));
  let best=null;
  for (const q of availableQuestions) {
    const key=q.key || q.id;
    let support=0;
    for (const c of top) {
      const ev=c.evidence?.find(e=>e.key===key);
      if (ev) support += Math.abs(ev.contribution);
    }
    const priority=(q.safetyPriority||0)*10 + support;
    if (!best || priority>best.priority) best={question:q,priority};
  }
  return best?.question || null;
}

function explainRanking(result){
  return result.candidates.map(c=>({component:c.component,probability:c.probability,confidence:result.confidence,why:c.evidence.filter(e=>e.impact!=='neutral').map(e=>`${e.key}: ${e.impact}`)}));
}

module.exports={rankDiagnoses,chooseNextBestQuestion,explainRanking,scoreCandidate};
