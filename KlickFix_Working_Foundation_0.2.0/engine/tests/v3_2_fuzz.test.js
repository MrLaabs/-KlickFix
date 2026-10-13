const assert=require('assert');
const {diagnoseV3_2}=require('../src/v3_2DiagnosticEngine');
const {getFailureModes}=require('../src/knowledgeBase');

const appliances=['refrigerator','washer','dryer','dishwasher'];
const answers=['yes','no','unknown'];
let cases=0;
for(let i=0;i<10000;i++){
  const appliance=appliances[i%appliances.length];
  const modes=getFailureModes({applianceType:appliance});
  const symptoms=[...new Set(modes.flatMap(f=>Object.keys(f.priors)))];
  const symptom=symptoms[i%symptoms.length];
  const keys=['heater_glows','thermal_cutoff_open','airflow_strong','freezer_cold','compressor_running','heavy_frost','water_remaining','pump_hums','pump_receives_power','fills','water_spray','water_hot','power_ok','door_switch','motor_starts','drum_turns','water_supply','inlet_valve_opens','water_enters','filter_blocked','burning_smell'];
  const a={};
  for(let k=0;k<4;k++) a[keys[(i+k*7)%keys.length]]=answers[(i+k)%answers.length];
  const r=diagnoseV3_2(appliance,symptom,a);
  assert.ok(r && typeof r==='object');
  if(r.status!=='safety_stop') assert.ok(r.probability && Array.isArray(r.probability.candidates));
  cases++;
}
console.log(`V3.2 fuzz passed: ${cases} generated cases`);
