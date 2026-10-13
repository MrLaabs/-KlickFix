// FixIQ v3.5 - Verified Parts & Compatibility Intelligence
const { diagnoseV3_4 } = require('./v3_4DiagnosticEngine');
const { PARTS_REGISTRY_VERSION, buildPartsContext, validatePartsRegistry } = require('./partsRegistry');

function buildPartsExplanation(ctx){
  if(!ctx.canRecommendVerifiedPart) return {status:'not_recommendable',message:'FixIQ did not find enough verified compatibility evidence to recommend a specific replacement part.',rule:'A part is never recommended as the correct replacement unless compatibility evidence is sufficient.',nextStep:'Continue diagnosis or verify the part against authoritative manufacturer/model documentation.'};
  const exact=ctx.verifiedCompatibleParts.filter(x=>x.matchType==='exact_model'||x.matchType==='alias_model');
  return {status:exact.length?'model_verified':'family_verified',message:exact.length?'At least one candidate is explicitly compatible with this model.':'A compatible family-level candidate exists, but exact-model verification should be preferred before purchase.',nextStep:'Compare the candidate part number against the appliance documentation and any supersession information before ordering.'};
}
function diagnoseV3_5(appliance,symptom,answers={},context={}){
  const base=diagnoseV3_4(appliance,symptom,answers,context);
  const modelNumber=context.modelNumber||context.model||answers.modelNumber||answers.model||'';
  const manufacturer=context.manufacturer||answers.manufacturer||'';
  const failureModeId=base?.probability?.topDiagnosis?.id||'';
  const partsContext=buildPartsContext({manufacturer,modelNumber,applianceType:appliance}, {failureModeId});
  return {...base,engineVersion:PARTS_REGISTRY_VERSION,partsCompatibilityVersion:PARTS_REGISTRY_VERSION,partsContext,partsExplanation:buildPartsExplanation(partsContext),reasoningUpgrade:partsContext.canRecommendVerifiedPart?'MODEL_ERROR_AND_PART_COMPATIBILITY_AWARE':'MODEL_ERROR_AWARE_WITH_PART_VERIFICATION_GUARD'};
}
module.exports={diagnoseV3_5,buildPartsContext,validatePartsRegistry,PARTS_REGISTRY_VERSION};
