// FixIQ v3.4 - Error-Code Intelligence
// v3.3 remains the model-aware baseline. Error codes add bounded evidence only.
const { diagnoseV3_3, MODEL_REGISTRY_VERSION } = require('./v3_3DiagnosticEngine');
const { ERROR_CODE_REGISTRY_VERSION, buildErrorCodeContext, validateErrorCodeRegistry, normalizeErrorCode } = require('./errorCodeRegistry');

function applyErrorCodeContext(probability, errorContext){
  if(!probability?.candidates?.length) return probability;
  const candidates=probability.candidates.map(c=>{
    let adjustment=0; let impact='none';
    if(errorContext.scoringEligible){
      if(errorContext.failureModeHints?.includes(c.id)){ adjustment+=2.5; impact='supports'; }
      else if(errorContext.componentHints?.some(x=>String(c.component).toLowerCase().includes(String(x).toLowerCase()))){ adjustment+=1.5; impact='supports'; }
      else if(errorContext.systemHints?.includes(c.system)){ adjustment+=0.5; impact='supports'; }
    }
    return {...c,errorCodeContext:{code:errorContext.code,matched:errorContext.matched,scoringEligible:errorContext.scoringEligible,impact},errorCodeAdjustment:adjustment,logit:(c.logit||0)+adjustment};
  }).sort((a,b)=>b.logit-a.logit);
  const max=Math.max(...candidates.map(c=>c.logit));
  const exps=candidates.map(c=>Math.exp(c.logit-max)); const total=exps.reduce((a,b)=>a+b,0)||1;
  const ranked=candidates.map((c,i)=>({...c,probability:Math.round(exps[i]/total*100)}));
  const top=ranked[0], second=ranked[1];
  const confidence=top&&top.probability>=72&&(top.probability-(second?.probability||0))>=20?'HIGH':top&&top.probability>=55&&(top.probability-(second?.probability||0))>=10?'MEDIUM':'LOW';
  return {...probability,candidates:ranked,topDiagnosis:top||null,confidence};
}
function buildErrorCodeExplanation(ctx){
  if(!ctx.provided) return {status:'not_provided',message:'No error code was supplied, so FixIQ is relying on symptoms, observations, tests, model context, and the evidence graph.'};
  return {status:ctx.matched?'matched':'unmatched',code:ctx.code,message:ctx.explanation,whatItCanDo:ctx.scoringEligible?'A verified code may influence ranking and next-step selection.':'It can provide context, but it will not be allowed to create a diagnosis from an unverified mapping.',whatItCannotDo:'An error code alone does not prove that a particular component has failed.'};
}
function diagnoseV3_4(appliance,symptom,answers={},context={}){
  const base=diagnoseV3_3(appliance,symptom,answers,context);
  const errorCode=context.errorCode||context.error_code||answers.errorCode||answers.error_code||'';
  const errorContext=buildErrorCodeContext({code:errorCode,manufacturer:context.manufacturer,modelNumber:context.modelNumber||context.model,applianceType:appliance});
  if(base.status==='safety_stop') return {...base,engineVersion:ERROR_CODE_REGISTRY_VERSION,errorCodeIntelligenceVersion:ERROR_CODE_REGISTRY_VERSION,errorCodeContext:errorContext,errorCodeExplanation:buildErrorCodeExplanation(errorContext)};
  const probability=applyErrorCodeContext(base.probability,errorContext);
  return {...base,engineVersion:ERROR_CODE_REGISTRY_VERSION,errorCodeIntelligenceVersion:ERROR_CODE_REGISTRY_VERSION,probability,errorCodeContext:errorContext,errorCodeExplanation:buildErrorCodeExplanation(errorContext),reasoningUpgrade:errorContext.scoringEligible?'MODEL_AND_ERROR_CODE_AWARE_REASONING':(errorContext.matched?'MODEL_AWARE_WITH_UNVERIFIED_ERROR_CODE':'MODEL_AWARE_WITH_ERROR_CODE_FALLBACK')};
}
module.exports={diagnoseV3_4,buildErrorCodeContext,validateErrorCodeRegistry,normalizeErrorCode,ERROR_CODE_REGISTRY_VERSION,MODEL_REGISTRY_VERSION};
