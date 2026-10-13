// FixIQ Engine v3 - Canonical Knowledge Base
// Data is deliberately model-agnostic. Model-specific records can be layered on top later.

const KB_VERSION = '3.1.0';

const APPLIANCE_TYPES = Object.freeze(['refrigerator','washer','dryer','dishwasher']);

const appliances = Object.freeze({
  refrigerator: { id:'refrigerator', name:'Refrigerator', systems:['cooling','defrost','airflow','water','ice','controls','power'] },
  washer: { id:'washer', name:'Washer', systems:['fill','drain','spin','agitation','drive','controls','power'] },
  dryer: { id:'dryer', name:'Dryer', systems:['heat','airflow','drive','motor','controls','power','gas'] },
  dishwasher: { id:'dishwasher', name:'Dishwasher', systems:['fill','wash','drain','heat','dry','leak','controls','power'] }
});

const symptoms = Object.freeze({
  'not cooling': { id:'not_cooling', label:'Not cooling', applianceTypes:['refrigerator'] },
  'water dispenser not working': { id:'water_dispenser_not_working', label:'Water dispenser not working', applianceTypes:['refrigerator'] },
  'ice maker not working': { id:'ice_maker_not_working', label:'Ice maker not working', applianceTypes:['refrigerator'] },
  'leaking': { id:'leaking', label:'Leaking', applianceTypes:APPLIANCE_TYPES },
  'no heat': { id:'no_heat', label:'No heat', applianceTypes:['dryer'] },
  'overheats': { id:'overheats', label:'Overheats', applianceTypes:['dryer'] },
  'long dry time': { id:'long_dry_time', label:'Long dry time', applianceTypes:['dryer'] },
  'won\'t drain': { id:'wont_drain', label:'Won\'t drain', applianceTypes:['washer','dishwasher'] },
  'won\'t spin': { id:'wont_spin', label:'Won\'t spin', applianceTypes:['washer'] },
  'won\'t start': { id:'wont_start', label:'Won\'t start', applianceTypes:['washer','dryer','dishwasher'] },
  'won\'t fill': { id:'wont_fill', label:'Won\'t fill', applianceTypes:['washer','dishwasher'] },
  'not cleaning': { id:'not_cleaning', label:'Not cleaning', applianceTypes:['dishwasher'] },
  'not drying': { id:'not_drying', label:'Not drying', applianceTypes:['dishwasher'] },
  'noise': { id:'noise', label:'Noise', applianceTypes:APPLIANCE_TYPES },
  'odor': { id:'odor', label:'Odor', applianceTypes:['dishwasher'] },
  'burning smell': { id:'burning_smell', label:'Burning smell', applianceTypes:['dryer','washer','dishwasher','refrigerator'] }
});

// Evidence weights are bounded and explainable. They are not claimed real-world frequencies.
// Future calibrated production values should be learned from verified repair outcomes.
const failureModes = Object.freeze([
  // DRYER
  { id:'dryer_heating_element', applianceType:'dryer', component:'Heating element', system:'heat', priors:{'no heat':0.30,'long dry time':0.18}, evidence:{heater_glows:{yes:0.40,no:-0.30},airflow_strong:{yes:0.10,no:-0.10},element_continuity:{no:0.85,yes:-0.35}}, tests:['continuity_test','voltage_to_heater'], safetyRisk:'electrical' },
  { id:'dryer_thermal_cutoff', applianceType:'dryer', component:'Thermal cutoff / thermal fuse', system:'heat', priors:{'no heat':0.18,'overheats':0.08}, evidence:{heater_glows:{no:0.10,yes:-0.05},thermal_cutoff_open:{yes:0.65,no:-0.25}}, tests:['continuity_test'], safetyRisk:'electrical' },
  { id:'dryer_high_limit_thermostat', applianceType:'dryer', component:'High-limit thermostat', system:'heat', priors:{'no heat':0.10,'overheats':0.16}, evidence:{high_limit_open:{yes:0.65,no:-0.20},overheats:{yes:0.20,no:-0.05}}, tests:['thermostat_continuity_test'], safetyRisk:'electrical' },
  { id:'dryer_cycling_thermostat', applianceType:'dryer', component:'Cycling thermostat', system:'heat', priors:{'no heat':0.08,'long dry time':0.14,'overheats':0.12}, evidence:{temperature_cycles:{no:0.45,yes:-0.20},airflow_strong:{yes:0.05,no:0.10}}, tests:['temperature_cycle_check'], safetyRisk:'electrical' },
  { id:'dryer_vent_restriction', applianceType:'dryer', component:'Vent restriction / airflow path', system:'airflow', priors:{'long dry time':0.28,'overheats':0.22,'no heat':0.06}, evidence:{airflow_strong:{no:0.65,yes:-0.35},outside_flap_opens:{no:0.45,yes:-0.20}}, tests:['airflow_check'], safetyRisk:'fire' },
  { id:'dryer_motor_switch', applianceType:'dryer', component:'Motor / centrifugal switch', system:'motor', priors:{'no heat':0.08,'wont_start':0.18}, evidence:{motor_runs:{no:0.65,yes:-0.35},drum_turns:{no:0.45,yes:-0.20}}, tests:['motor_operation_check'], safetyRisk:'electrical' },
  { id:'dryer_terminal_block', applianceType:'dryer', component:'Terminal block / power connection', system:'power', priors:{'wont_start':0.16,'no heat':0.08}, evidence:{voltage_present:{no:0.80,yes:-0.40},burning_smell:{yes:0.45,no:-0.05}}, tests:['supply_voltage_check'], safetyRisk:'electrical' },
  { id:'dryer_gas_igniter', applianceType:'dryer', component:'Gas igniter', system:'gas', priors:{'no heat':0.24}, evidence:{igniter_glows:{no:0.55,yes:-0.25},gas_flame:{no:0.35,yes:-0.20}}, tests:['igniter_observation','igniter_test'], safetyRisk:'gas' },
  { id:'dryer_gas_coils', applianceType:'dryer', component:'Gas valve coils', system:'gas', priors:{'no heat':0.16,'long dry time':0.08}, evidence:{igniter_glows:{yes:0.20,no:-0.10},flame_starts_then_stops:{yes:0.70,no:-0.20}}, tests:['flame_cycle_observation'], safetyRisk:'gas' },
  { id:'dryer_flame_sensor', applianceType:'dryer', component:'Flame sensor', system:'gas', priors:{'no heat':0.08}, evidence:{igniter_glows:{yes:0.10,no:-0.05},flame_starts_then_stops:{yes:0.45,no:-0.10}}, tests:['flame_sensor_test'], safetyRisk:'gas' },
  { id:'dryer_blower_wheel', applianceType:'dryer', component:'Blower wheel / airflow assembly', system:'airflow', priors:{'long dry time':0.12,'noise':0.10}, evidence:{airflow_strong:{no:0.55,yes:-0.20},rattling_noise:{yes:0.40,no:-0.05}}, tests:['blower_inspection'], safetyRisk:'mechanical' },

  // REFRIGERATOR
  { id:'refrigerator_evaporator_fan', applianceType:'refrigerator', component:'Evaporator fan motor/circuit', system:'airflow', priors:{'not cooling':0.20,'noise':0.10}, evidence:{freezer_cold:{yes:0.10,no:-0.10},evaporator_fan:{no:0.70,yes:-0.45}}, tests:['fan_observation','wiring_check'], safetyRisk:'electrical' },
  { id:'refrigerator_condenser_fan', applianceType:'refrigerator', component:'Condenser fan motor/circuit', system:'cooling', priors:{'not cooling':0.14,'overheats':0.12,'noise':0.08}, evidence:{condenser_fan:{no:0.70,yes:-0.30},compressor_running:{yes:0.15,no:-0.05}}, tests:['fan_observation','wiring_check'], safetyRisk:'electrical' },
  { id:'refrigerator_defrost_system', applianceType:'refrigerator', component:'Defrost system', system:'defrost', priors:{'not cooling':0.16}, evidence:{heavy_frost:{yes:0.75,no:-0.35}}, tests:['frost_pattern_check','heater_continuity'], safetyRisk:'electrical' },
  { id:'refrigerator_start_device', applianceType:'refrigerator', component:'Compressor start device/overload', system:'cooling', priors:{'not cooling':0.13,'noise':0.10}, evidence:{compressor_running:{no:0.25,yes:-0.20},clicking:{yes:0.65,no:-0.20}}, tests:['start_device_test'], safetyRisk:'electrical' },
  { id:'refrigerator_compressor', applianceType:'refrigerator', component:'Compressor', system:'cooling', priors:{'not cooling':0.10}, evidence:{compressor_running:{no:0.30,yes:-0.15},clicking:{yes:0.20,no:0.0},high_temperature:{yes:0.25,no:-0.05}}, tests:['compressor_electrical_test','sealed_system_evaluation'], safetyRisk:'electrical' },
  { id:'refrigerator_condenser_coils', applianceType:'refrigerator', component:'Condenser coil airflow/soil', system:'cooling', priors:{'not cooling':0.09,'overheats':0.14}, evidence:{dirty_coils:{yes:0.60,no:-0.25},condenser_fan:{yes:0.10,no:0.05}}, tests:['coil_inspection'], safetyRisk:'electrical' },
  { id:'refrigerator_damper', applianceType:'refrigerator', component:'Air damper / diffuser', system:'airflow', priors:{'not cooling':0.08}, evidence:{freezer_cold:{yes:0.20,no:-0.10},fresh_food_airflow:{no:0.65,yes:-0.25}}, tests:['airflow_observation','damper_test'], safetyRisk:'mechanical' },
  { id:'refrigerator_thermistor', applianceType:'refrigerator', component:'Temperature sensor / thermistor', system:'controls', priors:{'not cooling':0.07}, evidence:{temperature_reading_wrong:{yes:0.60,no:-0.15},compressor_running:{no:0.15,yes:-0.05}}, tests:['sensor_resistance_test'], safetyRisk:'electrical' },
  { id:'refrigerator_water_inlet_valve', applianceType:'refrigerator', component:'Water inlet valve', system:'water', priors:{'water dispenser not working':0.25,'ice maker not working':0.18}, evidence:{water_supply:{yes:0.10,no:-0.65},valve_receives_power:{no:0.20,yes:0.10}}, tests:['supply_check','valve_test'], safetyRisk:'water' },
  { id:'refrigerator_filter_restriction', applianceType:'refrigerator', component:'Water filter / filter head restriction', system:'water', priors:{'water dispenser not working':0.22,'ice maker not working':0.10}, evidence:{flow_improves_without_filter:{yes:0.75,no:-0.20},low_water_flow:{yes:0.35,no:-0.05}}, tests:['filter_bypass_check'], safetyRisk:'water' },
  { id:'refrigerator_ice_maker', applianceType:'refrigerator', component:'Ice maker assembly', system:'ice', priors:{'ice maker not working':0.30}, evidence:{ice_maker_cycle:{no:0.60,yes:-0.20},water_supply:{yes:0.10,no:-0.20}}, tests:['ice_maker_cycle_test'], safetyRisk:'electrical' },

  // WASHER
  { id:'washer_drain_pump', applianceType:'washer', component:'Drain pump / obstruction', system:'drain', priors:{'won\'t drain':0.30}, evidence:{water_remaining:{yes:0.45,no:-0.15},pump_hums:{yes:0.25,no:0.10},pump_receives_power:{no:0.20,yes:0.10}}, tests:['pump_obstruction_check','pump_electrical_test'], safetyRisk:'electrical' },
  { id:'washer_drain_hose', applianceType:'washer', component:'Drain hose / standpipe restriction', system:'drain', priors:{'won\'t drain':0.18,'leaking':0.10}, evidence:{water_remaining:{yes:0.30,no:-0.05},hose_kinked:{yes:0.70,no:-0.20}}, tests:['drain_path_check'], safetyRisk:'water' },
  { id:'washer_door_lid_lock', applianceType:'washer', component:'Door/lid lock', system:'controls', priors:{'won\'t start':0.20,'won\'t spin':0.10}, evidence:{lock_engages:{no:0.70,yes:-0.35}}, tests:['lock_observation'], safetyRisk:'mechanical' },
  { id:'washer_inlet_valve', applianceType:'washer', component:'Water inlet valve', system:'fill', priors:{'won\'t fill':0.28}, evidence:{water_supply:{no:0.60,yes:0.10},valve_receives_power:{no:0.30,yes:0.05}}, tests:['supply_check','valve_test'], safetyRisk:'water' },
  { id:'washer_pressure_system', applianceType:'washer', component:'Pressure switch / pressure hose', system:'fill', priors:{'won\'t fill':0.10,'leaking':0.06}, evidence:{water_level_sense:{no:0.60,yes:-0.10},pressure_hose_blocked:{yes:0.55,no:-0.15}}, tests:['pressure_system_check'], safetyRisk:'water' },
  { id:'washer_motor', applianceType:'washer', component:'Drive motor', system:'drive', priors:{'won\'t spin':0.18,'noise':0.12}, evidence:{motor_hums:{yes:0.30,no:-0.10},drum_turns:{no:0.40,yes:-0.15}}, tests:['motor_test'], safetyRisk:'electrical' },
  { id:'washer_drive_belt', applianceType:'washer', component:'Drive belt / pulley', system:'drive', priors:{'won\'t spin':0.16,'noise':0.10}, evidence:{motor_runs:{yes:0.25,no:-0.10},drum_turns:{no:0.45,yes:-0.15}}, tests:['belt_inspection'], safetyRisk:'mechanical' },
  { id:'washer_shifter', applianceType:'washer', component:'Shift actuator / shifter', system:'drive', priors:{'won\'t spin':0.12,'noise':0.08}, evidence:{agitate_works:{yes:0.20,no:-0.10},spin_works:{no:0.60,yes:-0.20}}, tests:['actuator_test'], safetyRisk:'mechanical' },
  { id:'washer_suspension', applianceType:'washer', component:'Suspension / shock absorbers', system:'spin', priors:{'noise':0.18,'leaking':0.06}, evidence:{violent_vibration:{yes:0.75,no:-0.20},load_balanced:{no:0.20,yes:-0.05}}, tests:['suspension_inspection'], safetyRisk:'mechanical' },
  { id:'washer_water_level_overfill', applianceType:'washer', component:'Water-level control / inlet valve stuck open', system:'fill', priors:{'leaking':0.16}, evidence:{continues_filling:{yes:0.75,no:-0.10},water_level_high:{yes:0.50,no:-0.05}}, tests:['inlet_valve_test','pressure_system_check'], safetyRisk:'water' },

  // DISHWASHER
  { id:'dishwasher_drain_pump', applianceType:'dishwasher', component:'Drain pump / obstruction', system:'drain', priors:{'won\'t drain':0.30}, evidence:{water_standing:{yes:0.45,no:-0.10},pump_hums:{yes:0.25,no:0.05}}, tests:['pump_obstruction_check','drain_path_check'], safetyRisk:'electrical' },
  { id:'dishwasher_drain_hose', applianceType:'dishwasher', component:'Drain hose / air-gap / disposer connection', system:'drain', priors:{'won\'t drain':0.18,'leaking':0.08}, evidence:{water_standing:{yes:0.25,no:-0.05},hose_restricted:{yes:0.65,no:-0.15}}, tests:['drain_path_check'], safetyRisk:'water' },
  { id:'dishwasher_circulation_pump', applianceType:'dishwasher', component:'Circulation pump / wash system', system:'wash', priors:{'not cleaning':0.28,'noise':0.12}, evidence:{fills:{yes:0.20,no:-0.10},water_spray:{no:0.70,yes:-0.30}}, tests:['spray_arm_check','circulation_pump_check'], safetyRisk:'electrical' },
  { id:'dishwasher_inlet_valve', applianceType:'dishwasher', component:'Water inlet valve / supply', system:'fill', priors:{'won\'t fill':0.28}, evidence:{water_supply:{yes:0.15,no:-0.65},inlet_valve_opens:{no:0.55,yes:-0.20}}, tests:['supply_check','valve_test'], safetyRisk:'water' },
  { id:'dishwasher_float_switch', applianceType:'dishwasher', component:'Float / overfill switch', system:'fill', priors:{'won\'t fill':0.12,'leaking':0.10}, evidence:{float_stuck_up:{yes:0.70,no:-0.15},fills:{no:0.15,yes:-0.05}}, tests:['float_inspection','switch_test'], safetyRisk:'water' },
  { id:'dishwasher_heater', applianceType:'dishwasher', component:'Heating element / heater circuit', system:'heat', priors:{'not drying':0.24,'not cleaning':0.10}, evidence:{water_hot:{no:0.55,yes:-0.15},element_continuity:{no:0.70,yes:-0.20}}, tests:['heater_continuity','heater_voltage_test'], safetyRisk:'electrical' },
  { id:'dishwasher_thermostat', applianceType:'dishwasher', component:'High-limit thermostat / temperature sensor', system:'heat', priors:{'not drying':0.10,'not cleaning':0.08}, evidence:{water_hot:{no:0.35,yes:-0.10},temperature_reading_wrong:{yes:0.55,no:-0.10}}, tests:['sensor_test','thermostat_test'], safetyRisk:'electrical' },
  { id:'dishwasher_door_latch', applianceType:'dishwasher', component:'Door latch / door switch', system:'controls', priors:{'won\'t start':0.22}, evidence:{door_latch_engages:{no:0.70,yes:-0.25}}, tests:['latch_observation','switch_test'], safetyRisk:'mechanical' },
  { id:'dishwasher_control_board', applianceType:'dishwasher', component:'Control board / control system', system:'controls', priors:{'won\'t start':0.10,'not cleaning':0.05}, evidence:{power_present:{yes:0.10,no:-0.10},latch_engages:{yes:0.10,no:-0.10}}, tests:['power_check','control_output_test'], safetyRisk:'electrical' },
  { id:'dishwasher_spray_arm', applianceType:'dishwasher', component:'Spray arm / spray path obstruction', system:'wash', priors:{'not cleaning':0.18}, evidence:{water_spray:{no:0.45,yes:-0.10},spray_arm_blocked:{yes:0.70,no:-0.15}}, tests:['spray_arm_check'], safetyRisk:'mechanical' },
  { id:'dishwasher_leak_door_seal', applianceType:'dishwasher', component:'Door gasket / door seal', system:'leak', priors:{'leaking':0.22}, evidence:{leak_at_door:{yes:0.70,no:-0.10},gasket_damaged:{yes:0.65,no:-0.10}}, tests:['gasket_inspection'], safetyRisk:'water' },
  { id:'dishwasher_sump_seal', applianceType:'dishwasher', component:'Sump / pump seal assembly', system:'leak', priors:{'leaking':0.16}, evidence:{leak_under_center:{yes:0.60,no:-0.05},pump_noise:{yes:0.10,no:-0.05}}, tests:['sump_inspection'], safetyRisk:'water' },

  // CROSS-APPLIANCE
  { id:'common_power_supply', applianceType:'dryer', component:'Household power supply / breaker', system:'power', priors:{'wont_start':0.12}, evidence:{voltage_present:{no:0.85,yes:-0.30}}, tests:['supply_voltage_check'], safetyRisk:'electrical' },
  { id:'washer_power_supply', applianceType:'washer', component:'Household power supply / breaker', system:'power', priors:{'wont_start':0.12}, evidence:{voltage_present:{no:0.85,yes:-0.30}}, tests:['supply_voltage_check'], safetyRisk:'electrical' },
  { id:'dishwasher_power_supply', applianceType:'dishwasher', component:'Household power supply / breaker', system:'power', priors:{'wont_start':0.12}, evidence:{power_present:{no:0.85,yes:-0.30}}, tests:['supply_voltage_check'], safetyRisk:'electrical' },
  { id:'refrigerator_power_supply', applianceType:'refrigerator', component:'Household power supply / outlet', system:'power', priors:{'not cooling':0.08}, evidence:{power_present:{no:0.85,yes:-0.30}}, tests:['outlet_power_check'], safetyRisk:'electrical' }
]);

function getFailureModes({applianceType,symptom}={}) {
  return failureModes.filter(f => (!applianceType || f.applianceType===applianceType) && (!symptom || Object.prototype.hasOwnProperty.call(f.priors,symptom)));
}

function validateKnowledgeBase() {
  const errors=[];
  for (const f of failureModes) {
    if (!APPLIANCE_TYPES.includes(f.applianceType)) errors.push(`${f.id}: invalid applianceType`);
    if (!f.component || !f.system) errors.push(`${f.id}: missing component/system`);
    if (!f.priors || Object.keys(f.priors).length===0) errors.push(`${f.id}: missing prior`);
    for (const p of Object.values(f.priors)) if (p <= 0 || p >= 1) errors.push(`${f.id}: prior must be between 0 and 1`);
  }
  return {ok:errors.length===0, errors, kbVersion:KB_VERSION, failureModeCount:failureModes.length};
}

const symptomTaxonomy = Object.freeze(Object.fromEntries(Object.entries(symptoms).map(([label, value]) => [value.id, { ...value, label, normalized: label.toLowerCase() }])));

function getComponents({applianceType,system}={}) {
  return [...new Set(failureModes.filter(f => (!applianceType || f.applianceType===applianceType) && (!system || f.system===system)).map(f => f.component))];
}

function getTests({applianceType,symptom}={}) {
  return [...new Set(getFailureModes({applianceType,symptom}).flatMap(f => f.tests || []))];
}

module.exports={KB_VERSION,APPLIANCE_TYPES,appliances,symptoms,symptomTaxonomy,failureModes,getFailureModes,getComponents,getTests,validateKnowledgeBase};
