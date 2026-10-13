// FixIQ MVP deterministic diagnostic engine.
// Safe default: never invent a diagnosis when required evidence is missing.

function norm(v) { return String(v ?? "").toLowerCase(); }
function yes(a,k) { return norm(a[k]) === "yes"; }
function no(a,k) { return norm(a[k]) === "no"; }

function make(status, cause, confidence, nextStep, safety, followUpQuestions=[]) {
  return { status, cause, confidence, nextStep, safety, followUpQuestions };
}

function diagnose(appliance, symptom, answers={}) {
  const a = answers || {};
  const s = norm(symptom);

  if (yes(a,"smoke") || yes(a,"sparks") || yes(a,"gas_smell")) {
    return make("safety_stop","Potentially unsafe operating condition",99,
      "Stop using the appliance. Disconnect power only if safe. For a strong gas smell, leave the area and follow local gas-emergency guidance.",
      "Do not continue diagnostic testing under these conditions.");
  }

  if (appliance === "refrigerator") {
    if (s === "not cooling") {
      if (no(a,"compressor_running") && yes(a,"clicking"))
        return make("likely","Compressor start device / overload circuit",86,
          "Inspect the start device and verify compressor supply voltage using the model-specific service procedure.",
          "Disconnect power before accessing electrical components.",
          ["Is the compressor completely silent between clicks?","Is the cabinet receiving normal power?"]);
      if (no(a,"evaporator_fan"))
        return make("likely","Evaporator fan or fan circuit",84,
          "Check for ice obstruction, wiring issues, and fan motor operation.",
          "Disconnect power before accessing the fan.",
          ["Is there heavy ice around the evaporator?","Does the fan turn freely with power removed?"]);
      if (no(a,"condenser_fan"))
        return make("likely","Condenser fan or fan circuit",84,
          "Check the condenser fan for obstruction, wiring, and motor failure.",
          "Disconnect power before service.",
          ["Is the compressor running?","Is the condenser unusually hot?"]);
      if (yes(a,"compressor_running") && yes(a,"evaporator_fan") && yes(a,"condenser_fan") && yes(a,"heavy_frost"))
        return make("likely","Defrost system / airflow restriction",82,
          "Inspect the evaporator frost pattern and defrost components using the model service procedure.",
          "Disconnect power before accessing internal components.",
          ["Is the frost covering most of the evaporator?","Has the unit been manually defrosted recently?"]);
      if (yes(a,"compressor_running") && yes(a,"evaporator_fan") && yes(a,"condenser_fan") && no(a,"heavy_frost"))
        return make("likely","Possible sealed-system / refrigeration performance issue",68,
          "Measure temperature performance and have a qualified technician evaluate the sealed system if needed.",
          "Refrigerant/sealed-system work may require qualified service.",
          ["What are the refrigerator and freezer temperatures?","Is there a normal frost pattern on the evaporator?"]);
      return make("undetermined","Not enough information yet",40,
        "Collect compressor, fan, frost, and temperature observations before choosing a repair.",
        "Do not bypass safety devices.",
        ["Is the compressor running?","Is the evaporator fan running?","Is the condenser fan running?","Is there heavy frost?"]);
    }
    if (s === "water dispenser not working") {
      if (no(a,"other_water_flow"))
        return make("likely","Water supply / filter / inlet-valve restriction",78,
          "Verify household water supply, filter condition, tubing, and inlet valve.",
          "Shut off water before disconnecting tubing.",
          ["Does the ice maker also fail to receive water?","When was the filter last replaced?"]);
      if (yes(a,"other_water_flow"))
        return make("likely","Dispenser valve / actuator / control issue",72,
          "Inspect the dispenser actuator and model-specific valve/control circuit.",
          "Disconnect power before electrical service.",
          ["Does the dispenser make a clicking sound?","Does water flow directly from the filter housing?"]);
    }
  }

  if (appliance === "washer") {
    if (s === "won't drain") {
      if (yes(a,"filter_blocked"))
        return make("likely","Blocked drain filter / pump trap",94,
          "Remove the obstruction, clean the filter/trap, and retest the drain.",
          "Unplug the washer first and expect water to escape.",
          ["After cleaning, does the washer drain normally?"]);
      if (yes(a,"water_remaining") && yes(a,"pump_hums") && no(a,"filter_blocked"))
        return make("likely","Drain pump obstruction or failing drain pump",83,
          "Inspect the pump impeller and drain path; test the pump according to the model procedure.",
          "Unplug before opening the pump/filter area.",
          ["Does the impeller turn freely?","Is the drain hose clear?"]);
      if (yes(a,"water_remaining") && no(a,"pump_hums") && yes(a,"power_reaches_pump"))
        return make("likely","Drain pump failure",88,
          "Test the drain pump according to the model procedure and replace it if it fails.",
          "Disconnect power before electrical testing.",
          ["What resistance does the pump measure?","Is the pump mechanically obstructed?"]);
      if (yes(a,"water_remaining") && no(a,"power_reaches_pump"))
        return make("likely","Wiring/control issue to drain pump",79,
          "Trace the pump harness and control output using the model-specific service procedure.",
          "Electrical testing should be performed safely.",
          ["Is the harness damaged or corroded?","Does the control provide the specified output?"]);
      return make("undetermined","Not enough information yet",40,
        "Determine whether water remains, whether the pump runs, and whether the filter/hose is blocked.",
        "Do not bypass lid/door safety systems.",
        ["Is water remaining?","Does the drain pump hum/run?","Is the filter blocked?","Does the pump receive power?"]);
    }
    if (s === "won't spin") {
      if (yes(a,"water_remaining"))
        return make("likely","Drain problem preventing spin",78,
          "Resolve the drain problem before diagnosing the spin system.",
          "Unplug before service.",
          ["Does the washer now drain after clearing the drain path?"]);
      if (no(a,"lid_or_door_lock"))
        return make("likely","Lid/door lock circuit",86,
          "Inspect the lock/latch and wiring and run the model-specific diagnostics.",
          "Do not bypass safety interlocks.",
          ["Does the lock engage at the start of the cycle?"]);
      if (yes(a,"lid_or_door_lock") && yes(a,"motor_runs"))
        return make("likely","Drive system / coupling / belt / transmission issue",73,
          "Inspect the model-specific drive components.",
          "Unplug before mechanical inspection.",
          ["Does the basket turn freely by hand?","Is the belt/coupling damaged?"]);
      return make("undetermined","Not enough information yet",42,
        "Check drain completion, lock status, and motor behavior.",
        "Do not bypass safety interlocks.",
        ["Is water remaining?","Does the lid/door lock engage?","Does the motor run?"]);
    }
  }

  if (appliance === "dryer") {
    if (s === "no heat") {
      const type = norm(a.dryer_type);
      if (type === "electric") {
        if (yes(a,"drum_turns") && no(a,"airflow_good"))
          return make("likely","Vent restriction / poor airflow",90,
            "Clean the lint path and exhaust vent, then verify airflow.",
            "Stop use if the dryer overheats or produces a burning odor.",
            ["Does the vent hood outside have strong airflow?","When was the vent last cleaned?"]);
        if (yes(a,"drum_turns") && yes(a,"airflow_good") && no(a,"heating_element"))
          return make("likely","Heating element or heater circuit",88,
            "Test the element and heater circuit using the model-specific procedure.",
            "Disconnect power before opening the dryer.",
            ["Does the element show continuity?","Are thermal cutoffs intact?"]);
        if (yes(a,"drum_turns") && yes(a,"airflow_good") && yes(a,"heating_element") && no(a,"heater_power"))
          return make("likely","Heater control / power circuit",84,
            "Check thermostats, thermal cutoffs, wiring, and control output.",
            "High-voltage appliance: use qualified service if unsure.",
            ["Are the thermal cutoffs intact?","Does the control send the specified voltage?"]);
      }
      if (type === "gas") {
        if (yes(a,"drum_turns") && yes(a,"igniter_glows") && no(a,"flame_appears"))
          return make("likely","Gas valve coil / ignition circuit",88,
            "Follow the model-specific gas ignition diagnostic procedure.",
            "Gas appliance: do not disturb gas connections unless qualified.",
            ["Does the igniter stay glowing?","Do the coils receive the specified power?"]);
        if (no(a,"igniter_glows"))
          return make("likely","Igniter or ignition safety circuit",82,
            "Test the igniter, thermal fuse, and related circuit.",
            "Disconnect power before service.",
            ["Does the igniter have continuity?","Is the thermal fuse intact?"]);
      }
      return make("undetermined","Not enough information yet",40,
        "Identify dryer type, drum operation, airflow, and heating behavior.",
        "Stop use for smoke, sparks, or burning odor.",
        ["Is the dryer electric or gas?","Does the drum turn?","Is airflow strong?","Does the heater/igniter operate?"]);
    }
    if (s === "overheats") {
      if (no(a,"airflow_good"))
        return make("likely","Restricted exhaust airflow",96,
          "Clean the lint filter, exhaust path, and vent immediately and verify airflow.",
          "Do not operate with restricted venting.",
          ["Is airflow strong at the exterior vent?","Is the vent hose crushed or kinked?"]);
      if (yes(a,"airflow_good") && yes(a,"heater_stays_on"))
        return make("likely","Temperature control / heater switching fault",86,
          "Test thermostats, sensors, heater relay/control, and related components.",
          "Disconnect power before service.",
          ["Does heat ever cycle off?","What temperatures are observed?"]);
      return make("undetermined","Not enough information yet",42,
        "Check airflow and whether the heater cycles off normally.",
        "Stop use if the cabinet becomes excessively hot.",
        ["Is airflow strong?","Does the heater cycle off?","Is the lint path clean?"]);
    }
  }

  if (appliance === "dishwasher") {
    if (s === "won't drain") {
      if (yes(a,"water_standing") && yes(a,"filter_blocked"))
        return make("likely","Blocked filter / sump area",95,
          "Clean the filter and sump area, then retest.",
          "Disconnect power before accessing internal components.",
          ["Does the dishwasher drain after cleaning the filter?"]);
      if (yes(a,"water_standing") && yes(a,"pump_hums") && no(a,"filter_blocked"))
        return make("likely","Drain pump obstruction or failing drain pump",84,
          "Inspect the pump/impeller and drain path.",
          "Disconnect power before pump access.",
          ["Does the impeller turn freely?","Is the drain hose clear?"]);
      if (yes(a,"water_standing") && no(a,"pump_hums") && yes(a,"pump_receives_power"))
        return make("likely","Drain pump failure",90,
          "Test the pump according to the model service procedure.",
          "Disconnect power before replacing the pump.",
          ["Does the pump have the correct resistance?","Is the impeller obstructed?"]);
      if (no(a,"pump_receives_power"))
        return make("likely","Control / wiring issue to drain pump",80,
          "Trace the drain-pump circuit using model-specific diagnostics.",
          "Electrical testing requires caution.",
          ["Is the pump harness damaged?","Does the control provide the specified output?"]);
      return make("undetermined","Not enough information yet",40,
        "Determine water level, filter condition, pump sound, and pump power.",
        "Do not bypass door/safety systems.",
        ["Is water standing in the tub?","Is the filter blocked?","Does the pump hum?","Does the pump receive power?"]);
    }
    if (s === "not cleaning") {
      if (yes(a,"fills") && no(a,"water_spray"))
        return make("likely","Circulation pump / spray-arm water delivery problem",84,
          "Check spray arms, sump/filter, and circulation pump.",
          "Disconnect power before inspection.",
          ["Are the spray arms blocked?","Can you hear the circulation pump?"]);
      if (yes(a,"fills") && yes(a,"water_spray") && no(a,"detergent_dispenses"))
        return make("likely","Detergent dispenser problem",79,
          "Inspect the dispenser latch, actuator, and detergent condition.",
          "Disconnect power before mechanical service.",
          ["Does the dispenser door open?","Is detergent caked inside?"]);
      if (yes(a,"fills") && yes(a,"water_spray") && yes(a,"detergent_dispenses"))
        return make("likely","Wash-system performance / loading / water-temperature issue",66,
          "Check spray-arm blockage, water temperature, filter condition, and wash-system performance.",
          "Use the manufacturer's cleaning/service procedure.",
          ["Is incoming water hot enough?","Are filters and spray arms clean?"]);
      return make("undetermined","Not enough information yet",40,
        "Confirm fill, spray action, detergent dispensing, and filter condition.",
        "Do not operate with leaks.",
        ["Does the dishwasher fill?","Do the spray arms receive water?","Does detergent dispense?","Are filters clean?"]);
    }
  }

  return make("undetermined","No complete diagnostic path exists yet",20,
    "Collect appliance type, model, error code, symptom, and observations.",
    "Follow manufacturer safety instructions.",
    ["What is the appliance type?","What is the model number?","What exactly is it doing?"]);
}

module.exports = { diagnose };
