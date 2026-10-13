// FixIQ v3.2 - Diagnostic Evidence Graph
// Turns isolated KB records into a connected reasoning graph.
// The graph is derived from canonical failure modes and enriched with a small
// set of explicit causal/diagnostic relationships. It is not a replacement
// for the deterministic safety engine.

const { failureModes, getFailureModes } = require('./knowledgeBase');

const GRAPH_VERSION = '3.2.0';

function idFor(prefix, value) {
  return `${prefix}:${String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
}

function addNode(nodes, id, type, label, meta={}) {
  if (!nodes.has(id)) nodes.set(id, { id, type, label, ...meta });
}
function addEdge(edges, from, to, relation, weight=1, meta={}) {
  edges.push({ from, to, relation, weight, ...meta });
}

function buildEvidenceGraph() {
  const nodes = new Map();
  const edges = [];

  for (const f of failureModes) {
    const failureId = `failure:${f.id}`;
    addNode(nodes, failureId, 'failure', f.component, { applianceType:f.applianceType, system:f.system, safetyRisk:f.safetyRisk });
    addNode(nodes, `component:${idFor('', f.component)}`, 'component', f.component);
    addEdge(edges, failureId, `component:${idFor('', f.component)}`, 'has_component', 1);

    addNode(nodes, `system:${idFor('', f.system)}`, 'system', f.system);
    addEdge(edges, failureId, `system:${idFor('', f.system)}`, 'belongs_to_system', 1);

    for (const symptom of Object.keys(f.priors || {})) {
      const symptomId = `symptom:${idFor('', symptom)}`;
      addNode(nodes, symptomId, 'symptom', symptom);
      addEdge(edges, symptomId, failureId, 'supports', f.priors[symptom], { source:'prior' });
    }
    for (const [key, weights] of Object.entries(f.evidence || {})) {
      const evidenceId = `evidence:${idFor('', key)}`;
      addNode(nodes, evidenceId, 'evidence', key);
      for (const answer of ['yes','no']) {
        if (weights[answer] === undefined) continue;
        const answerId = `${evidenceId}:${answer}`;
        addNode(nodes, answerId, 'observation', `${key} = ${answer}`, { key, answer });
        addEdge(edges, answerId, failureId, weights[answer] >= 0 ? 'supports' : 'contradicts', Math.abs(weights[answer]), { source:'evidence', contribution:weights[answer] });
      }
    }
    for (const test of (f.tests || [])) {
      const testId = `test:${idFor('', test)}`;
      addNode(nodes, testId, 'test', test);
      addEdge(edges, failureId, testId, 'validated_by', 1);
    }
  }

  // Explicit causal relationships: these encode diagnostic dependencies, not
  // statistical frequencies. They help FixIQ avoid treating a failed part as
  // the entire diagnosis when another condition may have caused it.
  const causal = [
    ['dryer_vent_restriction','dryer_thermal_cutoff','can_cause_or_contribute_to',0.90],
    ['dryer_vent_restriction','dryer_high_limit_thermostat','can_cause_or_contribute_to',0.80],
    ['dryer_vent_restriction','dryer_cycling_thermostat','can_cause_or_contribute_to',0.65],
    ['dryer_blower_wheel','dryer_vent_restriction','can_cause_or_contribute_to',0.45],
    ['dryer_thermal_cutoff','dryer_heating_element','should_trigger_root_cause_check',0.75],
    ['refrigerator_defrost_system','refrigerator_evaporator_fan','can_contribute_to',0.70],
    ['refrigerator_condenser_coils','refrigerator_condenser_fan','can_contribute_to',0.55],
    ['washer_drain_hose','washer_drain_pump','can_mimic_or_contribute_to',0.55],
    ['dishwasher_filter_sump','dishwasher_drain_pump','can_mimic_or_contribute_to',0.55]
  ];
  for (const [a,b,relation,weight] of causal) {
    if (nodes.has(`failure:${a}`) && nodes.has(`failure:${b}`)) addEdge(edges, `failure:${a}`, `failure:${b}`, relation, weight, { source:'causal_rule' });
  }

  return { version:GRAPH_VERSION, nodes:[...nodes.values()], edges };
}

const graph = buildEvidenceGraph();

function getGraphStats() {
  const byType = {};
  for (const n of graph.nodes) byType[n.type] = (byType[n.type] || 0) + 1;
  const byRelation = {};
  for (const e of graph.edges) byRelation[e.relation] = (byRelation[e.relation] || 0) + 1;
  return { version:graph.version, nodeCount:graph.nodes.length, edgeCount:graph.edges.length, nodesByType:byType, edgesByRelation:byRelation };
}

function getFailureEvidence(failureId) {
  const id = failureId.startsWith('failure:') ? failureId : `failure:${failureId}`;
  return graph.edges.filter(e => e.to === id || e.from === id);
}

function getCausalNeighbors(failureId) {
  const id = failureId.startsWith('failure:') ? failureId : `failure:${failureId}`;
  return graph.edges
    .filter(e => e.source === 'causal_rule' && (e.from === id || e.to === id))
    .map(e => ({ failureId:(e.from === id ? e.to : e.from).replace(/^failure:/,''), relation:e.relation, weight:e.weight, direction:e.to === id ? 'incoming' : 'outgoing' }));
}

function buildCandidateGraphContext({applianceType, symptom, answers={}}={}) {
  const candidates = getFailureModes({applianceType, symptom});
  const observations = [];
  for (const [key, raw] of Object.entries(answers || {})) {
    const value = String(raw ?? '').trim().toLowerCase();
    if (!['yes','no','y','n','true','false','1','0'].includes(value)) continue;
    const answer = ['yes','y','true','1'].includes(value) ? 'yes' : 'no';
    observations.push(`${key}:${answer}`);
  }

  return candidates.map(c => {
    const id = `failure:${c.id}`;
    const direct = graph.edges.filter(e => e.to === id && e.source === 'evidence' && observations.includes(e.from.replace(/^evidence:/,'').replace(/:(yes|no)$/,'') + ':' + e.from.match(/:(yes|no)$/)?.[1]));
    const causal = getCausalNeighbors(c.id);
    return { failureId:c.id, directEvidenceLinks:direct.length, causalNeighbors:causal, connected:direct.length > 0 || causal.length > 0 };
  });
}

function graphCausalAdjustments({applianceType, symptom, answers={}}={}) {
  const candidates = new Set(getFailureModes({applianceType, symptom}).map(f=>f.id));
  const adjustments = new Map();
  for (const e of graph.edges.filter(x=>x.source==='causal_rule' && x.relation !== 'should_trigger_root_cause_check')) {
    const upstream = e.from.replace(/^failure:/,'');
    const downstream = e.to.replace(/^failure:/,'');
    if (!candidates.has(upstream) || !candidates.has(downstream)) continue;
    const upstreamFailure = failureModes.find(f=>f.id===upstream);
    if (!upstreamFailure) continue;
    let support=0;
    for (const [key, raw] of Object.entries(answers || {})) {
      const value=String(raw ?? '').trim().toLowerCase();
      const answer=['yes','y','true','1'].includes(value) ? 'yes' : ['no','n','false','0'].includes(value) ? 'no' : null;
      if (!answer) continue;
      const w=upstreamFailure.evidence?.[key]?.[answer];
      if (w !== undefined) support += w;
    }
    if (support !== 0) adjustments.set(upstream, Math.max(adjustments.get(upstream)||0, support * e.weight * 0.35));
  }
  return Object.fromEntries(adjustments);
}

function validateEvidenceGraph() {
  const errors=[];
  const failureIds=new Set(failureModes.map(f=>`failure:${f.id}`));
  for (const e of graph.edges) {
    if (!graph.nodes.some(n=>n.id===e.from)) errors.push(`missing from node: ${e.from}`);
    if (!graph.nodes.some(n=>n.id===e.to)) errors.push(`missing to node: ${e.to}`);
    if (!(e.weight >= 0)) errors.push(`invalid weight: ${e.from} -> ${e.to}`);
  }
  for (const f of failureIds) if (!graph.edges.some(e=>e.from===f || e.to===f)) errors.push(`isolated failure node: ${f}`);
  return { ok:errors.length===0, errors, ...getGraphStats() };
}

module.exports={GRAPH_VERSION,graph,buildEvidenceGraph,getGraphStats,getFailureEvidence,getCausalNeighbors,buildCandidateGraphContext,graphCausalAdjustments,validateEvidenceGraph};
