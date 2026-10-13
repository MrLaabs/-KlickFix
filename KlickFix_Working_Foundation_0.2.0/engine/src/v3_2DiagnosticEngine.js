// FixIQ v3.2 facade: v3.1 scoring + connected evidence graph.
const { diagnoseV3 } = require('./v3DiagnosticEngine');
const { canonicalSymptom } = require('./adaptiveDiagnosticEngine');
const { GRAPH_VERSION, buildCandidateGraphContext, graphCausalAdjustments, getCausalNeighbors, validateEvidenceGraph } = require('./evidenceGraph');

function enhanceRanking(ranking, graphContext) {
  if (!ranking) return ranking;
  return {
    ...ranking,
    candidates: ranking.candidates.map(c => {
      const g = graphContext.find(x => x.failureId === c.id);
      return { ...c, graph:{ connected:!!g?.connected, directEvidenceLinks:g?.directEvidenceLinks || 0, causalNeighbors:g?.causalNeighbors || [] } };
    })
  };
}

function rootCauseWarnings(topCandidate) {
  if (!topCandidate?.graph?.causalNeighbors?.length) return [];
  return topCandidate.graph.causalNeighbors.filter(n => n.direction === 'incoming').map(n => ({
    failureId:n.failureId,
    relation:n.relation,
    message:'A related condition may contribute to this finding. Investigate it before declaring the identified part the root cause.'
  }));
}

function diagnoseV3_2(appliance,symptom,answers={},context={}) {
  const base = diagnoseV3(appliance,symptom,answers,context);
  if (base.status === 'safety_stop') return { ...base, engineVersion:GRAPH_VERSION, evidenceGraphVersion:GRAPH_VERSION, graph:null };

  const normalizedAppliance=String(appliance).trim().toLowerCase();
  const normalizedSymptom=canonicalSymptom(normalizedAppliance,symptom);
  const graphContext = buildCandidateGraphContext({applianceType:normalizedAppliance, symptom:normalizedSymptom, answers});
  let probability = enhanceRanking(base.probability, graphContext);
  const adjustments = graphCausalAdjustments({applianceType:normalizedAppliance, symptom:normalizedSymptom, answers});
  if (probability?.candidates?.length) {
    const adjusted = probability.candidates.map(c => ({...c, graphAdjustment:Math.round((adjustments[c.id] || 0) * 1000) / 1000, logit:c.logit + (adjustments[c.id] || 0)})).sort((a,b)=>b.logit-a.logit);
    const maxLogit=Math.max(...adjusted.map(c=>c.logit));
    const exps=adjusted.map(c=>Math.exp(c.logit-maxLogit));
    const total=exps.reduce((a,b)=>a+b,0)||1;
    probability={...probability,candidates:adjusted.map((c,i)=>({...c,probability:Math.round(exps[i]/total*100)}))};
    const top=probability.candidates[0], second=probability.candidates[1];
    probability={...probability,topDiagnosis:top||null,confidence:(top&&top.probability>=72&&(top.probability-(second?.probability||0))>=20)?'HIGH':(top&&top.probability>=55&&(top.probability-(second?.probability||0))>=10)?'MEDIUM':'LOW'};
  }
  if (probability?.topDiagnosis) {
    const tg = graphContext.find(x => x.failureId === probability.topDiagnosis.id);
    probability = { ...probability, topDiagnosis:{ ...probability.topDiagnosis, graph:{ connected:!!tg?.connected, directEvidenceLinks:tg?.directEvidenceLinks || 0, causalNeighbors:tg?.causalNeighbors || [] } } };
  }
  const top = probability?.topDiagnosis;
  const topGraph = top ? graphContext.find(x => x.failureId === top.id) : null;
  const rootCause = rootCauseWarnings(top ? { ...top, graph:topGraph } : null);

  return {
    ...base,
    engineVersion:GRAPH_VERSION,
    evidenceGraphVersion:GRAPH_VERSION,
    probability,
    graphSummary:{ connectedCandidates:graphContext.filter(x=>x.connected).length, candidateCount:graphContext.length },
    rootCauseWarnings:rootCause,
    reasoningUpgrade: rootCause.length ? 'CONNECTED_CAUSAL_REASONING' : 'CONNECTED_EVIDENCE_REASONING',
    graphAdjustments:probability.candidates.filter(c=>c.graphAdjustment).map(c=>({failureId:c.id,logitAdjustment:c.graphAdjustment}))
  };
}

module.exports={diagnoseV3_2,validateEvidenceGraph,getCausalNeighbors};
