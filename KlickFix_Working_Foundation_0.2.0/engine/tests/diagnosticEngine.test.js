const assert = require("node:assert/strict");
const { diagnose } = require("../src/diagnosticEngine");

const cases = [
  ["refrigerator","not cooling",{compressor_running:"no",clicking:"yes"}],
  ["refrigerator","not cooling",{compressor_running:"yes",evaporator_fan:"no",condenser_fan:"yes"}],
  ["refrigerator","not cooling",{compressor_running:"yes",evaporator_fan:"yes",condenser_fan:"no"}],
  ["refrigerator","not cooling",{compressor_running:"yes",evaporator_fan:"yes",condenser_fan:"yes",heavy_frost:"yes"}],
  ["refrigerator","not cooling",{compressor_running:"yes",evaporator_fan:"yes",condenser_fan:"yes",heavy_frost:"no"}],
  ["refrigerator","not cooling",{}],
  ["refrigerator","water dispenser not working",{other_water_flow:"no"}],
  ["refrigerator","water dispenser not working",{other_water_flow:"yes"}],
  ["refrigerator","water dispenser not working",{}],
  ["refrigerator","not cooling",{smoke:"yes"}],

  ["washer","won't drain",{water_remaining:"yes",pump_hums:"yes",filter_blocked:"yes"}],
  ["washer","won't drain",{water_remaining:"yes",pump_hums:"yes",filter_blocked:"no"}],
  ["washer","won't drain",{water_remaining:"yes",pump_hums:"no",power_reaches_pump:"yes"}],
  ["washer","won't drain",{water_remaining:"yes",pump_hums:"no",power_reaches_pump:"no"}],
  ["washer","won't drain",{}],
  ["washer","won't spin",{water_remaining:"yes"}],
  ["washer","won't spin",{water_remaining:"no",lid_or_door_lock:"no"}],
  ["washer","won't spin",{water_remaining:"no",lid_or_door_lock:"yes",motor_runs:"yes"}],
  ["washer","won't spin",{}],
  ["washer","won't spin",{sparks:"yes"}],

  ["dryer","no heat",{dryer_type:"electric",drum_turns:"yes",airflow_good:"no"}],
  ["dryer","no heat",{dryer_type:"electric",drum_turns:"yes",airflow_good:"yes",heating_element:"no"}],
  ["dryer","no heat",{dryer_type:"electric",drum_turns:"yes",airflow_good:"yes",heating_element:"yes",heater_power:"no"}],
  ["dryer","no heat",{dryer_type:"gas",drum_turns:"yes",igniter_glows:"yes",flame_appears:"no"}],
  ["dryer","no heat",{dryer_type:"gas",drum_turns:"yes",igniter_glows:"no"}],
  ["dryer","no heat",{}],
  ["dryer","overheats",{airflow_good:"no"}],
  ["dryer","overheats",{airflow_good:"yes",heater_stays_on:"yes"}],
  ["dryer","overheats",{}],
  ["dryer","no heat",{gas_smell:"yes"}],

  ["dishwasher","won't drain",{water_standing:"yes",filter_blocked:"yes"}],
  ["dishwasher","won't drain",{water_standing:"yes",pump_hums:"yes",filter_blocked:"no"}],
  ["dishwasher","won't drain",{water_standing:"yes",pump_hums:"no",pump_receives_power:"yes"}],
  ["dishwasher","won't drain",{water_standing:"yes",pump_hums:"no",pump_receives_power:"no"}],
  ["dishwasher","won't drain",{}],
  ["dishwasher","not cleaning",{fills:"yes",water_spray:"no"}],
  ["dishwasher","not cleaning",{fills:"yes",water_spray:"yes",detergent_dispenses:"no"}],
  ["dishwasher","not cleaning",{fills:"yes",water_spray:"yes",detergent_dispenses:"yes"}],
  ["dishwasher","not cleaning",{}],
  ["dishwasher","not cleaning",{smoke:"yes"}],
];

let pass=0;
for (const [appliance,symptom,answers] of cases) {
  const r = diagnose(appliance,symptom,answers);
  assert.ok(["likely","undetermined","safety_stop"].includes(r.status));
  assert.ok(r.cause && r.nextStep && r.safety);
  assert.ok(r.confidence >= 0 && r.confidence <= 100);
  if (r.status === "undetermined") assert.ok(r.followUpQuestions.length > 0);
  pass++;
}
console.log(`PASS: ${pass}/${cases.length} diagnostic scenarios`);
