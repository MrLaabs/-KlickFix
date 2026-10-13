// FixIQ v3.5 - Verified Parts & Compatibility Intelligence
// A part recommendation is never treated as compatible merely because the
// symptom looks familiar. Compatibility must be established at the strongest
// available evidence level, and uncertain parts are explicitly labeled.
const PARTS_REGISTRY_VERSION = '3.5.0';
const PART_STATUSES = Object.freeze(['verified','manufacturer_confirmed','provisional','unverified','incompatible']);
const PART_MATCH_TYPES = Object.freeze(['exact_model','alias_model','family','appliance_type','none']);

function normalizePartNumber(value){
  return String(value ?? '').trim().toUpperCase().replace(/[\u2010-\u2015\-\s_./\\]+/g,'').replace(/[^A-Z0-9]/g,'');
}
function normalizeModelNumber(value){
  return String(value ?? '').trim().toUpperCase().replace(/[\u2010-\u2015\-\s_./\\]+/g,'').replace(/[^A-Z0-9]/g,'');
}
function normalizeManufacturer(value){ return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,''); }
function normalizeType(value){ return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_'); }

// Development fixtures only. No record below is presented as a live retail
// catalog or statistical failure-rate claim. Real compatibility authority is
// added only after manufacturer/catalog evidence is verified.
const parts = Object.freeze([
  {id:'part:fixture:dryer:heating-element',partNumber:'FIX-DRY-HEAT-001',manufacturer:'FixIQ Fixture',componentType:'heating_element',applianceTypes:['dryer'],modelNumbers:[],modelAliases:[],series:[],status:'provisional',provenance:['development_fixture'],evidenceStatus:'identity_only',supersedes:[],supersededBy:[],diagnosticFailureModes:[],notes:'Fixture used to validate compatibility architecture; not a purchasable part.'},
  {id:'part:fixture:washer:drain-pump',partNumber:'FIX-WASH-DRAIN-001',manufacturer:'FixIQ Fixture',componentType:'drain_pump',applianceTypes:['washer'],modelNumbers:[],modelAliases:[],series:[],status:'provisional',provenance:['development_fixture'],evidenceStatus:'identity_only',supersedes:[],supersededBy:[],diagnosticFailureModes:[],notes:'Fixture used to validate compatibility architecture; not a purchasable part.'}
]);

function matchPart(part, query={}){
  const model=normalizeModelNumber(query.modelNumber||query.model||'');
  const manufacturer=normalizeManufacturer(query.manufacturer);
  const type=normalizeType(query.applianceType||query.appliance);
  if(model && (part.modelNumbers||[]).some(x=>normalizeModelNumber(x)===model)) return {type:'exact_model',score:1,reason:'Exact normalized model is explicitly listed.'};
  if(model && (part.modelAliases||[]).some(x=>normalizeModelNumber(x)===model)) return {type:'alias_model',score:.98,reason:'Known model alias is explicitly listed.'};
  if(model && (part.series||[]).some(x=>model.startsWith(normalizeModelNumber(x)))) return {type:'family',score:.78,reason:'Model belongs to an explicitly listed series/family.'};
  if(type && (part.applianceTypes||[]).map(normalizeType).includes(type)) return {type:'appliance_type',score:.35,reason:'Part is listed for this appliance type, but model compatibility is not established.'};
  return {type:'none',score:0,reason:'No compatibility evidence matched the supplied appliance.'};
}
function findParts(query={}){
  const pn=normalizePartNumber(query.partNumber||query.part||'');
  const type=normalizeType(query.applianceType||query.appliance);
  return parts.filter(p=>!pn || normalizePartNumber(p.partNumber)===pn)
    .filter(p=>!type || p.applianceTypes.map(normalizeType).includes(type))
    .map(p=>({part:p,match:matchPart(p,query)}))
    .filter(x=>x.match.type!=='none')
    .sort((a,b)=>b.match.score-a.match.score);
}
function compatibilityDecision(part, query={}, diagnosticContext={}){
  const match=matchPart(part,query);
  const status=part.status;
  const modelConfirmed=['exact_model','alias_model'].includes(match.type) && ['verified','manufacturer_confirmed'].includes(status);
  const familyConfirmed=match.type==='family' && ['verified','manufacturer_confirmed'].includes(status);
  const explicitlyIncompatible=status==='incompatible';
  const canRecommend=modelConfirmed || familyConfirmed;
  const reason=explicitlyIncompatible ? 'This part is explicitly marked incompatible.' : canRecommend
    ? (modelConfirmed ? 'Compatibility is established for this model.' : 'Compatibility is established for the model family, but exact-model verification is not present.')
    : 'Compatibility is not sufficiently verified, so FixIQ will not present this part as the correct replacement.';
  return {partId:part.id,partNumber:part.partNumber,matchType:match.type,matchScore:match.score,status,compatible:canRecommend,recommendationEligible:canRecommend && !explicitlyIncompatible,reason,diagnosticFailureModes:part.diagnosticFailureModes||[],diagnosisSupportsPart:diagnosticContext.failureModeId ? (part.diagnosticFailureModes||[]).includes(diagnosticContext.failureModeId) : null};
}
function buildPartsContext(query={}, diagnosticContext={}){
  const matches=findParts(query);
  const evaluated=matches.map(x=>compatibilityDecision(x.part,query,diagnosticContext));
  const eligible=evaluated.filter(x=>x.recommendationEligible);
  return {registryVersion:PARTS_REGISTRY_VERSION,query:{manufacturer:query.manufacturer||null,modelNumber:query.modelNumber||query.model||null,applianceType:query.applianceType||query.appliance||null},matchedParts:evaluated,verifiedCompatibleParts:eligible,canRecommendVerifiedPart:eligible.length>0,explanation:eligible.length?`FixIQ found ${eligible.length} part candidate(s) with established compatibility evidence.`:'No part has sufficient compatibility evidence to be recommended as the correct replacement yet. FixIQ will not guess.'};
}
function validatePartRecord(p){
  const errors=[]; for(const k of ['id','partNumber','manufacturer','componentType','status']) if(!p[k]) errors.push(`${p.id||'record'}: missing ${k}`);
  if(p.status&&!PART_STATUSES.includes(p.status)) errors.push(`${p.id}: invalid status`);
  for(const k of ['applianceTypes','modelNumbers','modelAliases','series','provenance','supersedes','supersededBy','diagnosticFailureModes']) if(!Array.isArray(p[k])) errors.push(`${p.id}: ${k} must be array`);
  if(!normalizePartNumber(p.partNumber)) errors.push(`${p.id}: part number normalizes empty`);
  return errors;
}
function validatePartsRegistry(){const errors=[];const seen=new Set();for(const p of parts){errors.push(...validatePartRecord(p));if(seen.has(p.id))errors.push(`duplicate id: ${p.id}`);seen.add(p.id);}return {ok:errors.length===0,errors,version:PARTS_REGISTRY_VERSION,partCount:parts.length};}
function getPartRecords(){return [...parts];}
module.exports={PARTS_REGISTRY_VERSION,PART_STATUSES,PART_MATCH_TYPES,parts,normalizePartNumber,normalizeModelNumber,matchPart,findParts,compatibilityDecision,buildPartsContext,validatePartsRegistry,getPartRecords};
