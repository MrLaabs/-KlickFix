// FixIQ Engine v3.3 - Model-Specific Intelligence
// v3.2 remains available and is used as the diagnostic baseline.
const { diagnoseV3_2 } = require('./v3_2DiagnosticEngine');
const { canonicalSymptom } = require('./adaptiveDiagnosticEngine');
const { MODEL_REGISTRY_VERSION, buildModelContext, validateModelRegistry } = require('./modelRegistry');

function applyModelContext(base, modelContext){
  const probability=base.probability;
  if(!probability?.candidates?.length) return probability;
  // v3.3 deliberately does not alter probabilities for provisional identity-only records.
  // Verified model-specific modifiers can be applied here in a future registry revision.
  const candidates=probability.candidates.map(c=>({
    ...c,
    modelContext:{
      matchType:modelContext.matchType,
      modelKnown:modelContext.modelKnown,
      scoringEligible:modelContext.scoringEligible,
      influence:'none'
    }
  }));
  return {...probability,candidates,topDiagnosis:candidates[0]||null};
}

function buildModelExplanation(modelContext){
  return {
    status:modelContext.matchType,
    message:modelContext.explanation,
    whatFixIQKnows:modelContext.model ? {
      manufacturer:modelContext.model.manufacturer,
      model:modelContext.model.modelNumber,
      series:modelContext.model.series,
      applianceType:modelContext.model.applianceType
    } : null,
    whatFixIQWillNotAssume:modelContext.scoringEligible ? [] : [
      'model-specific failure frequency',
      'model-specific part compatibility',
      'model-specific repair procedure',
      'model-specific safety requirement'
    ],
    fallback:'Generic diagnostic knowledge remains active until model-specific evidence is verified.'
  };
}

function diagnoseV3_3(appliance,symptom,answers={},context={}){
  const normalizedAppliance=String(appliance||'').trim().toLowerCase();
  const normalizedSymptom=canonicalSymptom(normalizedAppliance,symptom);
  const modelInput={
    modelNumber:context.modelNumber || context.model || '',
    manufacturer:context.manufacturer || ''
  };
  const modelContext=buildModelContext(modelInput);
  const base=diagnoseV3_2(normalizedAppliance,normalizedSymptom,answers,context);
  if(base.status==='safety_stop') return {
    ...base, engineVersion:MODEL_REGISTRY_VERSION, modelIntelligenceVersion:MODEL_REGISTRY_VERSION,
    modelContext, modelExplanation:buildModelExplanation(modelContext)
  };
  const probability=applyModelContext(base,modelContext);
  return {
    ...base,
    engineVersion:MODEL_REGISTRY_VERSION,
    modelIntelligenceVersion:MODEL_REGISTRY_VERSION,
    probability,
    modelContext,
    modelExplanation:buildModelExplanation(modelContext),
    reasoningUpgrade:modelContext.modelKnown ? 'MODEL_AWARE_REASONING' : 'GENERIC_MODEL_FALLBACK'
  };
}

module.exports={diagnoseV3_3,buildModelContext,validateModelRegistry,MODEL_REGISTRY_VERSION};
