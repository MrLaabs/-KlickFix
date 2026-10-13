// FixIQ v3.4 - Error-Code Intelligence Registry
// Error codes are evidence, not diagnoses. Only VERIFIED records can alter scores.
const ERROR_CODE_REGISTRY_VERSION = '3.4.0';
const ERROR_CODE_STATUSES = Object.freeze(['verified','provisional','unverified']);
const ERROR_MATCH_TYPES = Object.freeze(['exact_model','model_alias','family','generic','none']);

function normalizeErrorCode(value){
  return String(value ?? '')
    .trim().toUpperCase()
    .replace(/[\u2010-\u2015\-_/\\]+/g,'')
    .replace(/\s+/g,' ')
    .trim();
}
function normalizeManufacturer(value){ return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,''); }
function normalizeApplianceType(value){ return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_'); }

// Conservative seed records. These are intentionally NOT scoring-authoritative.
// They preserve known FixIQ case identifiers while requiring verified manufacturer
// documentation before the code can change a diagnosis probability.
const errorCodes = Object.freeze([
  {
    id:'error:thermador:dwhd650wfm:e25', manufacturer:'Thermador', applianceType:'dishwasher',
    modelNumbers:['DWHD650WFM'], code:'E25', status:'provisional', provenance:['user_supplied_case_identifier'],
    evidenceStatus:'identity_only', systemHints:['drain'], componentHints:[], failureModeHints:[],
    symptoms:['won\'t drain'], diagnosticTests:['drain_path_check','pump_obstruction_check'],
    safetyRequirements:['water_isolation_before_service'], scoringModifiers:[],
    explanation:'The code is associated with a known FixIQ case, but its model-specific meaning has not been verified from authoritative documentation.'
  },
  {
    id:'error:speedqueen:awne92sp113tw01:d5el05', manufacturer:'Speed Queen', applianceType:'washer',
    modelNumbers:['AWNE92SP113TW01'], code:'D5 EL 05', status:'provisional', provenance:['user_supplied_case_identifier'],
    evidenceStatus:'identity_only', systemHints:['controls'], componentHints:[], failureModeHints:[],
    symptoms:['won\'t start'], diagnosticTests:[], safetyRequirements:['power_isolation_before_service'], scoringModifiers:[],
    explanation:'The code is associated with a known FixIQ case, but its model-specific meaning has not been verified from authoritative documentation.'
  }
]);

function validateRecord(r){
  const errors=[];
  for(const k of ['id','manufacturer','applianceType','code','status']) if(!r[k]) errors.push(`${r.id||'record'}: missing ${k}`);
  if(r.status && !ERROR_CODE_STATUSES.includes(r.status)) errors.push(`${r.id}: invalid status`);
  if(!Array.isArray(r.modelNumbers)) errors.push(`${r.id}: modelNumbers must be array`);
  if(!Array.isArray(r.provenance)) errors.push(`${r.id}: provenance must be array`);
  if(!Array.isArray(r.scoringModifiers)) errors.push(`${r.id}: scoringModifiers must be array`);
  if(!normalizeErrorCode(r.code)) errors.push(`${r.id}: code normalizes empty`);
  return errors;
}
function validateErrorCodeRegistry(){
  const errors=[]; const seen=new Set();
  for(const r of errorCodes){
    errors.push(...validateRecord(r));
    if(seen.has(r.id)) errors.push(`duplicate id: ${r.id}`); seen.add(r.id);
  }
  return {ok:errors.length===0,errors,version:ERROR_CODE_REGISTRY_VERSION,errorCodeCount:errorCodes.length};
}
function matchesModel(record, query={}){
  const q=String(query.modelNumber||query.model||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!q) return 'generic';
  const models=(record.modelNumbers||[]).map(x=>String(x).toUpperCase().replace(/[^A-Z0-9]/g,''));
  if(models.includes(q)) return 'exact_model';
  return 'none';
}
function findErrorCodes(query={}){
  const code=normalizeErrorCode(query.code||query.errorCode||'');
  if(!code) return [];
  const manufacturer=normalizeManufacturer(query.manufacturer);
  const appliance=normalizeApplianceType(query.applianceType||query.appliance);
  return errorCodes.filter(r=>normalizeErrorCode(r.code)===code)
    .filter(r=>!manufacturer || normalizeManufacturer(r.manufacturer)===manufacturer)
    .filter(r=>!appliance || normalizeApplianceType(r.applianceType)===appliance)
    .map(r=>({record:r,matchType:matchesModel(r,query)}))
    .filter(x=>x.matchType!=='none')
    .sort((a,b)=>({exact_model:4,model_alias:3,family:2,generic:1}[b.matchType]||0)-({exact_model:4,model_alias:3,family:2,generic:1}[a.matchType]||0));
}
function buildErrorCodeContext(query={}){
  const code=normalizeErrorCode(query.code||query.errorCode||'');
  if(!code) return {registryVersion:ERROR_CODE_REGISTRY_VERSION,provided:false,matched:false,matchType:'none',code:null,scoringEligible:false,explanation:'No error code was supplied.'};
  const matches=findErrorCodes(query);
  if(!matches.length) return {registryVersion:ERROR_CODE_REGISTRY_VERSION,provided:true,matched:false,matchType:'none',code,scoringEligible:false,records:[],explanation:`FixIQ received error code ${code}, but it has no verified registry match for this appliance/model. The code will not be guessed.`};
  const best=matches[0]; const r=best.record;
  const eligible=r.status==='verified' && r.evidenceStatus==='verified' && ['exact_model','model_alias','family','generic'].includes(best.matchType);
  return {
    registryVersion:ERROR_CODE_REGISTRY_VERSION,provided:true,matched:true,matchType:best.matchType,code,
    scoringEligible:eligible,status:r.status,evidenceStatus:r.evidenceStatus,recordId:r.id,
    manufacturer:r.manufacturer,applianceType:r.applianceType,systemHints:r.systemHints,
    componentHints:r.componentHints,failureModeHints:r.failureModeHints,symptoms:r.symptoms,
    diagnosticTests:r.diagnosticTests,safetyRequirements:r.safetyRequirements,
    explanation:eligible ? `Verified error-code context matched ${code}; it may influence the diagnostic ranking.` : `${r.explanation} FixIQ will use the code as contextual information only until the evidence is verified.`
  };
}
function getErrorCodeRecords(){ return [...errorCodes]; }
module.exports={ERROR_CODE_REGISTRY_VERSION,ERROR_CODE_STATUSES,ERROR_MATCH_TYPES,errorCodes,normalizeErrorCode,findErrorCodes,buildErrorCodeContext,validateErrorCodeRegistry,getErrorCodeRecords};
