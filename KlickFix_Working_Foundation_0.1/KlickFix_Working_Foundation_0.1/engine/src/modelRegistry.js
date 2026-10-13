// FixIQ v3.3 - Model-Specific Intelligence Registry
//
// This layer identifies and contextualizes appliance models without inventing
// model-specific facts. A model record can be exact, family/series, or generic.
// Only VERIFIED model-specific evidence is allowed to influence diagnosis scores.

const MODEL_REGISTRY_VERSION = '3.3.0';

const MODEL_STATUSES = Object.freeze(['verified','provisional','unverified']);
const MATCH_TYPES = Object.freeze(['exact','alias','family','generic','none']);

function normalizeModelNumber(value){
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\u2010-\u2015\-\s_./\\]+/g,'')
    .replace(/[^A-Z0-9]/g,'');
}

function normalizeManufacturer(value){
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
}

function normalizeSeries(value){
  return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
}

// Seed records are deliberately conservative. These identifiers are included
// as development fixtures from known FixIQ cases, not as statistical claims.
// They carry no score modifiers until verified manufacturer/model evidence is added.
const models = Object.freeze([
  {
    id:'model:kenmore:79074423810', manufacturer:'Kenmore', applianceType:'oven',
    modelNumber:'79074423810', aliases:[], series:'790', status:'provisional',
    provenance:['user_supplied_model_identifier'], evidenceStatus:'identity_only',
    systems:['heat','controls','power'], components:[], failureModes:[], tests:[], safetyRequirements:[],
    errorCodes:[], compatibleParts:[], scoringModifiers:[]
  },
  {
    id:'model:thermador:dwhd650wfm', manufacturer:'Thermador', applianceType:'dishwasher',
    modelNumber:'DWHD650WFM', aliases:[], series:'DWHD650', status:'provisional',
    provenance:['user_supplied_model_identifier'], evidenceStatus:'identity_only',
    systems:['fill','wash','drain','heat','dry','leak','controls','power'], components:[], failureModes:[], tests:[], safetyRequirements:[],
    errorCodes:['E25'], compatibleParts:[], scoringModifiers:[]
  },
  {
    id:'model:bosch:b36cl80sns08', manufacturer:'Bosch', applianceType:'refrigerator',
    modelNumber:'B36CL80SNS/08', aliases:['B36CL80SNS08'], series:'B36CL80SNS', status:'provisional',
    provenance:['user_supplied_model_identifier'], evidenceStatus:'identity_only',
    systems:['cooling','defrost','airflow','water','ice','controls','power'], components:[], failureModes:[], tests:[], safetyRequirements:[],
    errorCodes:[], compatibleParts:[], scoringModifiers:[]
  },
  {
    id:'model:ge:pscs51gxcfss', manufacturer:'GE', applianceType:'refrigerator',
    modelNumber:'PSCS51GXCFSS', aliases:[], series:'PSCS51', status:'provisional',
    provenance:['user_supplied_model_identifier'], evidenceStatus:'identity_only',
    systems:['cooling','defrost','airflow','water','ice','controls','power'], components:[], failureModes:[], tests:[], safetyRequirements:[],
    errorCodes:[], compatibleParts:[], scoringModifiers:[]
  },
  {
    id:'model:speedqueen:awne92sp113tw01', manufacturer:'Speed Queen', applianceType:'washer',
    modelNumber:'AWNE92SP113TW01', aliases:[], series:'AWNE92SP113', status:'provisional',
    provenance:['user_supplied_model_identifier'], evidenceStatus:'identity_only',
    systems:['fill','drain','spin','agitation','drive','controls','power'], components:[], failureModes:[], tests:[], safetyRequirements:[],
    errorCodes:['D5 EL 05'], compatibleParts:[], scoringModifiers:[]
  },
  {
    id:'model:nodisco:env150', manufacturer:'Nespresso', applianceType:'coffee_machine',
    modelNumber:'ENV150', aliases:['VertuoPlus ENV150'], series:'ENV', status:'provisional',
    provenance:['user_supplied_model_identifier'], evidenceStatus:'identity_only',
    systems:['water','pump','controls','heating'], components:[], failureModes:[], tests:[], safetyRequirements:[],
    errorCodes:[], compatibleParts:[], scoringModifiers:[]
  }
]);

function validateRecord(record){
  const errors=[];
  if(!record.id) errors.push('missing id');
  if(!record.manufacturer) errors.push(`${record.id}: missing manufacturer`);
  if(!record.applianceType) errors.push(`${record.id}: missing applianceType`);
  if(!record.modelNumber) errors.push(`${record.id}: missing modelNumber`);
  if(!MODEL_STATUSES.includes(record.status)) errors.push(`${record.id}: invalid status`);
  if(!Array.isArray(record.provenance)) errors.push(`${record.id}: provenance must be array`);
  if(!Array.isArray(record.scoringModifiers)) errors.push(`${record.id}: scoringModifiers must be array`);
  return errors;
}

function validateModelRegistry(){
  const errors=[]; const seen=new Set();
  for(const m of models){
    errors.push(...validateRecord(m));
    if(seen.has(m.id)) errors.push(`duplicate id: ${m.id}`);
    seen.add(m.id);
    if(normalizeModelNumber(m.modelNumber)==='') errors.push(`${m.id}: modelNumber normalizes empty`);
  }
  return {ok:errors.length===0, errors, version:MODEL_REGISTRY_VERSION, modelCount:models.length};
}

function modelMatches(record, query){
  const q=normalizeModelNumber(query.modelNumber || query.model || '');
  if(!q) return {type:'none',score:0,reason:'No model number supplied'};
  const exact=normalizeModelNumber(record.modelNumber);
  if(q===exact) return {type:'exact',score:1,reason:'Exact normalized model match'};
  if((record.aliases||[]).some(a=>normalizeModelNumber(a)===q)) return {type:'alias',score:.98,reason:'Known model alias match'};
  const series=normalizeSeries(record.series);
  if(series && q.startsWith(series) && q.length>series.length) return {type:'family',score:.78,reason:'Series/family prefix match'};
  return {type:'none',score:0,reason:'No registry match'};
}

function findModel(query={}){
  const manufacturer=normalizeManufacturer(query.manufacturer);
  const candidates=models.filter(m=>!manufacturer || normalizeManufacturer(m.manufacturer)===manufacturer);
  let best=null;
  for(const m of candidates){
    const match=modelMatches(m,query);
    if(!best || match.score>best.match.score) best={model:m,match};
  }
  if(!best) return {model:null,match:{type:'none',score:0,reason:'No model registry match'}};
  return best;
}

function buildModelContext(query={}){
  const result=findModel(query);
  if(!result.model) return {
    registryVersion:MODEL_REGISTRY_VERSION, matchType:'none', matchScore:0, model:null,
    modelKnown:false, modelSpecificEvidenceTrusted:false, genericFallback:true,
    scoringEligible:false, explanation:'FixIQ could not match this model to its model registry, so it is using generic appliance knowledge.'
  };
  const trusted = result.match.type==='exact' || result.match.type==='alias';
  const scoreEligible = trusted && result.model.status==='verified' && result.model.evidenceStatus==='verified';
  return {
    registryVersion:MODEL_REGISTRY_VERSION,
    matchType:result.match.type, matchScore:result.match.score,
    model:{id:result.model.id,manufacturer:result.model.manufacturer,modelNumber:result.model.modelNumber,series:result.model.series,applianceType:result.model.applianceType,status:result.model.status},
    modelKnown:true, modelSpecificEvidenceTrusted:scoreEligible,
    genericFallback:false, scoringEligible:scoreEligible,
    systems:result.model.systems, components:result.model.components, failureModes:result.model.failureModes,
    tests:result.model.tests, safetyRequirements:result.model.safetyRequirements,
    errorCodes:result.model.errorCodes, compatibleParts:result.model.compatibleParts,
    explanation: scoreEligible
      ? `Exact model context matched for ${result.model.modelNumber}; verified model-specific evidence may influence ranking.`
      : `Model ${result.model.modelNumber} was identified, but model-specific evidence is not yet verified, so FixIQ will not invent or over-weight model-specific conclusions.`
  };
}

function getModelRecords(){ return [...models]; }

module.exports={MODEL_REGISTRY_VERSION,MODEL_STATUSES,MATCH_TYPES,models,normalizeModelNumber,normalizeManufacturer,normalizeSeries,findModel,buildModelContext,validateModelRegistry,getModelRecords};
