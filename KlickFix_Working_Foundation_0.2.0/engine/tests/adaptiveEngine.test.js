const assert=require('node:assert/strict');
const {diagnose,finalAnswer,nextQuestion,canonicalSymptom}=require('../src/adaptiveDiagnosticEngine');

const appliances={
 refrigerator:["not cooling","water dispenser not working","leaking","ice maker not working","frost buildup","freezing food","noise"],
 washer:["won't drain","won't spin","won't start","leaking","vibration","won't fill","overfilling","agitation","noise"],
 dryer:["no heat","overheats","long dry time","won't start","won't tumble","burning smell","noise","leaking"],
 dishwasher:["won't drain","not cleaning","won't start","leaking","won't fill","not drying","noise","odor"]
};

let total=0;
function check(app,sym,answers={}){
  const r=finalAnswer(app,sym,answers);
  assert.ok(["likely","undetermined","safety_stop"].includes(r.status),`${app}/${sym}`);
  assert.ok(r.cause && r.nextStep && r.safety,`${app}/${sym} missing answer`);
  assert.ok(r.confidence>=0 && r.confidence<=100,`${app}/${sym} confidence`);
  if(r.status!=="safety_stop") assert.ok(r.nextStep.length>10);
  total++;
}

for(const [app,syms] of Object.entries(appliances)) for(const s of syms) check(app,s,{});

// Known high-value paths
check('refrigerator','not cooling',{freezer_cold:'yes',fridge_cold:'no'});
check('refrigerator','not cooling',{compressor_running:'no',clicking:'yes'});
check('refrigerator','not cooling',{compressor_running:'yes',evaporator_fan:'no'});
check('refrigerator','ice maker not working',{ice_maker_power:'yes',water_reaches_ice_maker:'no'});
check('washer',"won't drain",{water_remaining:'yes',filter_blocked:'yes'});
check('washer',"won't spin",{water_remaining:'no',lid_or_door_lock:'yes',motor_runs:'yes',basket_turns:'no'});
check('washer',"overfilling",{fills_when_off:'yes'});
check('dryer','no heat',{dryer_type:'electric',drum_turns:'yes',airflow_good:'no'});
check('dryer','no heat',{dryer_type:'gas',drum_turns:'yes',igniter_glows:'yes',flame_appears:'no'});
check('dryer','overheats',{airflow_good:'no'});
check('dishwasher',"won't drain",{water_standing:'yes',filter_blocked:'yes'});
check('dishwasher','not cleaning',{fills:'yes',water_spray:'yes',detergent_dispenses:'yes',water_hot:'no'});
check('dishwasher',"won't fill",{water_supply:'yes',inlet_valve_opens:'yes',water_enters:'no'});

// Safety is absolute.
for(const app of Object.keys(appliances)){
  const r=diagnose(app,'noise',{smoke:'yes'}); assert.equal(r.status,'safety_stop'); total++;
  const g=diagnose(app,'noise',{gas_smell:'yes'}); assert.equal(g.status,'safety_stop'); total++;
}

// Unknown/"don't know" answers never crash or dead-end.
for(const [app,syms] of Object.entries(appliances)) for(const s of syms){
  const r=finalAnswer(app,s,{compressor_running:"don't know",power_ok:"don't know",error_code:"unknown"});
  assert.ok(r.nextStep && r.safety); total++;
}

assert.equal(canonicalSymptom('dryer','not heating'),'no heat');
assert.equal(canonicalSymptom('washer','not draining'),"won't drain");
assert.equal(nextQuestion('dryer','no heat',{}),'Is the dryer electric or gas?');
console.log(`PASS: ${total} adaptive diagnostic scenarios`);
