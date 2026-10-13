const assert=require('assert');
const {validatePartsRegistry,buildPartsContext,compatibilityDecision,parts,PARTS_REGISTRY_VERSION}=require('../src/partsRegistry');
const {diagnoseV3_5}=require('../src/v3_5DiagnosticEngine');
assert.equal(PARTS_REGISTRY_VERSION,'3.5.0');
assert.equal(validatePartsRegistry().ok,true);
assert.equal(compatibilityDecision(parts[0],{applianceType:'dryer'}).recommendationEligible,false);
assert.equal(buildPartsContext({manufacturer:'Whirlpool',modelNumber:'XYZ123',applianceType:'dryer'}).canRecommendVerifiedPart,false);
const r=diagnoseV3_5('dryer','no_heat',{},{}); assert.ok(r.partsContext); assert.equal(r.partsContext.canRecommendVerifiedPart,false);
console.log('FixIQ v3.5 parts compatibility tests passed.');
