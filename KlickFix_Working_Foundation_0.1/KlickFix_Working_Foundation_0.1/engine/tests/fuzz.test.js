const assert=require('node:assert/strict');
const {diagnose,finalAnswer}=require('../src/adaptiveDiagnosticEngine');
const axes={
 refrigerator:{'not cooling':['compressor_running','evaporator_fan','condenser_fan','heavy_frost','freezer_cold','fridge_cold','clicking','power_ok'], 'water dispenser not working':['water_flow_at_dispenser','ice_maker_working','power_ok'], 'leaking':['leak_source_door','leak_source_hose','leak_source_pump'], 'ice maker not working':['ice_maker_power','water_reaches_ice_maker','ice_maker_cycles'], 'frost buildup':['frost_back_wall','door_gasket_bad'], 'freezing food':['airflow_blocked','control_set_too_cold'], 'noise':['noise_changes_with_fan','noise_changes_with_compressor']},
 washer:{"won't drain":['water_remaining','filter_blocked','pump_hums','power_reaches_pump'], "won't spin":['water_remaining','lid_or_door_lock','motor_runs','basket_turns'], "won't start":['power_ok','display_or_controls','lid_or_door_lock'], 'leaking':['leak_source_door','leak_source_hose','leak_source_pump'], 'vibration':['unbalanced_load','level_ok','empty_still_vibrates'], "won't fill":['power_ok','water_supply','inlet_valve_opens','water_enters'], 'overfilling':['fills_when_off','pressure_system_suspect'], 'agitation':['motor_runs','agitator_moves'], 'noise':['noise_only_during_spin']},
 dryer:{'no heat':['dryer_type','drum_turns','airflow_good','heating_element','heater_power','igniter_glows','flame_appears'], 'overheats':['airflow_good','heater_stays_on'], 'long dry time':['dryer_type','drum_turns','airflow_good','heating_element','heater_power','igniter_glows','flame_appears'], "won't start":['power_ok','door_switch','motor_starts','motor_hums'], "won't tumble":['motor_starts','motor_hums','drum_turns'], 'burning smell':['airflow_good','smoke','severity'], 'noise':['noise_with_tumble'], 'leaking':['leak_source_door','leak_source_hose','leak_source_pump']},
 dishwasher:{"won't drain":['water_standing','filter_blocked','pump_hums','pump_receives_power'], 'not cleaning':['fills','water_spray','detergent_dispenses','water_hot'], "won't start":['power_ok','display_or_controls','door_latch'], 'leaking':['leak_source_door','leak_source_hose','leak_source_pump'], "won't fill":['water_supply','inlet_valve_opens','water_enters'], 'not drying':['water_hot','rinse_aid_low'], 'noise':['noise_only_drain','noise_only_wash'], 'odor':['filter_clean']}
};
const vals=['yes','no',"don't know"];
let cases=0;
function product(arr){let out=[{}]; for(const k of arr){const next=[]; for(const o of out) for(const v of vals) next.push({...o,[k]:v}); out=next;} return out;}
for(const [app,symptoms] of Object.entries(axes)){
  for(const [sym,keys] of Object.entries(symptoms)){
    // Exhaustively enumerate up to 3^7; cap only the largest symptom if needed.
    let combos=product(keys);
    if(combos.length>3000) combos=combos.slice(0,3000);
    for(const a of combos){
      const r=finalAnswer(app,sym,a);
      assert.ok(['likely','undetermined','safety_stop'].includes(r.status),`${app}/${sym}`);
      assert.equal(typeof r.confidence,'number',`${app}/${sym} confidence type`);
      assert.ok(r.confidence>=0 && r.confidence<=100);
      assert.ok(typeof r.cause==='string' && r.cause.length>0);
      assert.ok(typeof r.nextStep==='string' && r.nextStep.length>0);
      assert.ok(typeof r.safety==='string' && r.safety.length>0);
      if(r.status==='undetermined') assert.ok(Array.isArray(r.followUpQuestions) && r.followUpQuestions.length>0,`${app}/${sym} dead end`);
      cases++;
    }
  }
}
console.log(`PASS: ${cases} fuzzed answer combinations`);
