// FixIQ Adaptive Diagnostic Engine v2
// Deterministic diagnostic core: AI may phrase questions, but must not invent evidence.

const YES = new Set(["yes","y","true","1","yeah","yep","correct"]);
const NO = new Set(["no","n","false","0","nope"]);
const UNKNOWN = new Set(["unknown","dont know","don't know","not sure","unsure","skip","cant tell","can't tell","na","n/a",""]);

function norm(v) { return String(v ?? "").trim().toLowerCase().replace(/[’']/g, "'"); }
function bool(v) { const x=norm(v); if(YES.has(x)) return true; if(NO.has(x)) return false; return null; }
function val(a,k) { return norm(a[k]); }
function known(a,k) { return bool(a[k]) !== null || (a[k] !== undefined && val(a,k) !== ""); }
function yes(a,k) { return bool(a[k]) === true; }
function no(a,k) { return bool(a[k]) === false; }
function make(status,cause,confidence,nextStep,safety,questions=[],meta={}) {
  return { status, cause, confidence: Number(confidence), nextStep, safety, followUpQuestions:questions, ...meta };
}

const SYMPTOMS = {
  refrigerator: {
    "not cooling":"not cooling", "warm":"not cooling", "not cold":"not cooling", "fridge warm":"not cooling",
    "freezer warm":"not cooling", "too warm":"not cooling", "water dispenser":"water dispenser not working", "no water":"water dispenser not working",
    "leaking":"leaking", "leak":"leaking", "ice maker":"ice maker not working", "ice maker not making ice":"ice maker not working",
    "noisy":"noise", "loud":"noise", "noise":"noise", "frost":"frost buildup", "freezing food":"freezing food"
  },
  washer: {
    "won't drain":"won't drain", "will not drain":"won't drain", "not draining":"won't drain", "water left":"won't drain",
    "won't spin":"won't spin", "will not spin":"won't spin", "not spinning":"won't spin", "won't start":"won't start", "no start":"won't start",
    "leaking":"leaking", "leak":"leaking", "shaking":"vibration", "vibrating":"vibration", "loud":"noise", "noise":"noise",
    "not filling":"won't fill", "won't fill":"won't fill", "overfilling":"overfilling", "doesn't agitate":"agitation", "not agitating":"agitation"
  },
  dryer: {
    "no heat":"no heat", "not heating":"no heat", "no hot air":"no heat", "overheats":"overheats", "too hot":"overheats",
    "takes too long":"long dry time", "long dry time":"long dry time", "not drying":"long dry time", "won't start":"won't start",
    "won't tumble":"won't tumble", "not tumbling":"won't tumble", "squealing":"noise", "noise":"noise", "loud":"noise",
    "burning smell":"burning smell", "leaking":"leaking"
  },
  dishwasher: {
    "won't drain":"won't drain", "will not drain":"won't drain", "not draining":"won't drain", "water left":"won't drain",
    "not cleaning":"not cleaning", "dirty dishes":"not cleaning", "won't start":"won't start", "no start":"won't start",
    "leaking":"leaking", "leak":"leaking", "not filling":"won't fill", "won't fill":"won't fill", "not drying":"not drying",
    "spots":"not drying", "cloudy dishes":"not cleaning", "noise":"noise", "loud":"noise", "bad smell":"odor", "odor":"odor"
  }
};

function canonicalSymptom(appliance,symptom) {
  const s=norm(symptom); return SYMPTOMS[appliance]?.[s] || s;
}

function safetyGate(a) {
  if (yes(a,"gas_smell")) return make("safety_stop","Possible gas leak","99","Leave the area if the odor is strong. Do not create sparks or operate switches. Follow local gas-emergency guidance.","Do not continue appliance testing until the gas concern is resolved.");
  if (yes(a,"smoke") || yes(a,"sparks")) return make("safety_stop","Electrical/fire hazard","99","Stop using the appliance. Disconnect power only if it is safe to do so and arrange qualified inspection.","Do not energize the appliance again until the hazard is resolved.");
  if (yes(a,"burning_smell") && (a.severity === "strong" || yes(a,"smoke"))) return make("safety_stop","Possible overheating/fire hazard","98","Stop using the appliance and disconnect power if safe. Inspect before further operation.","Do not continue testing while a strong burning odor is present.");
  if (yes(a,"water_near_electrical")) return make("safety_stop","Water/electrical hazard","99","Stop using the appliance and keep power isolated until the water source and electrical hazard are addressed.","Do not reach into standing water around energized equipment.");
  return null;
}

const Q = {
  model: "What is the appliance brand and full model number?",
  error: "Is there an error code or flashing light pattern? If yes, what exactly does it show?",
  power: "Does the appliance have normal power? For example, display/lights respond or another test confirms the outlet has power.",
  recent: "Did this problem begin suddenly, or did performance get worse over time?",
};

function genericIntake(appliance,symptom,a) {
  const qs=[];
  if (!known(a,"model")) qs.push(Q.model);
  if (!known(a,"error_code")) qs.push(Q.error);
  if (!known(a,"power_ok")) qs.push(Q.power);
  if (!known(a,"onset")) qs.push(Q.recent);
  return qs;
}

function refrigerator(sym,a) {
  if (sym === "not cooling") {
    if (yes(a,"freezer_cold") && no(a,"fridge_cold")) return make("likely","Airflow/damper problem between freezer and refrigerator",88,"Check evaporator airflow, return-air passages, damper operation, and ice blockage.","Disconnect power before accessing internal components.",["Is the evaporator fan running?","Is the air damper opening?","Is there ice blocking vents?"]);
    if (no(a,"compressor_running") && yes(a,"clicking")) return make("likely","Compressor start device / overload circuit","90","Inspect the compressor start device and verify model-specific compressor circuit measurements.","Disconnect power before electrical service.",["Does it click every few minutes?","Is the compressor hot to the touch?"]);
    if (no(a,"compressor_running") && no(a,"clicking") && yes(a,"power_ok")) return make("likely","Compressor control/power circuit","75","Check control output, wiring, and compressor circuit using the model-specific service procedure.","High-voltage/electrical testing should be performed safely.",["Does the condenser fan run?","Does the compressor receive the specified voltage?"]);
    if (no(a,"evaporator_fan")) return make("likely","Evaporator fan or fan circuit","90","Inspect the fan blade, ice obstruction, wiring, and motor.","Disconnect power before accessing the fan.",["Is there heavy ice around the evaporator?","Does the fan turn freely with power removed?"]);
    if (no(a,"condenser_fan")) return make("likely","Condenser fan or fan circuit","89","Inspect condenser fan obstruction, wiring, and motor.","Disconnect power before service.",["Is the compressor running?","Is the condenser area excessively hot?"]);
    if (yes(a,"heavy_frost")) return make("likely","Defrost system / evaporator airflow restriction","87","Inspect defrost heater, thermostat/sensor, control, and frost pattern using the service procedure.","Disconnect power before accessing the evaporator area.",["Is the entire evaporator packed with frost?","Does the refrigerator work temporarily after a full manual defrost?"]);
    if (yes(a,"compressor_running") && yes(a,"evaporator_fan") && yes(a,"condenser_fan") && no(a,"heavy_frost")) return make("likely","Possible sealed-system/refrigeration performance issue","70","Measure actual compartment temperatures and inspect the evaporator frost pattern; escalate to sealed-system service if abnormal.","Refrigerant/sealed-system work may require qualified service.",["What are the freezer and refrigerator temperatures?","Is there a normal partial frost pattern on the evaporator?"]);
    return make("undetermined","Cooling failure needs one more evidence set","45","FixIQ cannot safely name a failed part yet. Answer the targeted questions below; the next round will narrow the fault path.","Do not bypass thermostats, controls, or safety devices.",["Is the freezer cold, warm, or also not cooling?","Is the compressor running?","Is the evaporator fan running?","Is the condenser fan running?","Is there heavy frost?","What are the actual freezer and refrigerator temperatures?" ]);
  }
  if (sym === "water dispenser not working") {
    if (no(a,"water_flow_at_dispenser") && no(a,"ice_maker_working")) return make("likely","Water supply/filter/inlet valve restriction","84","Verify household water supply, filter installation/condition, frozen tubing, and inlet valve operation.","Shut off water before disconnecting tubing.",["Does water reach the refrigerator inlet valve?","Is the filter bypassed or recently replaced?","Is the water line frozen?"]);
    if (no(a,"water_flow_at_dispenser") && yes(a,"ice_maker_working")) return make("likely","Dispenser-side valve/actuator/control or frozen dispenser line","82","Check dispenser actuator, dispenser valve path, and tubing for freezing.","Disconnect power before electrical service.",["Do you hear a valve click when the dispenser is pressed?","Is the dispenser line frozen?"]);
    if (yes(a,"water_flow_at_dispenser")) return make("likely","Dispenser actuator/control path or incorrect symptom classification","68","Verify the exact flow point and inspect the dispenser switch/control circuit.","Disconnect power before electrical access.",["Does the paddle/switch register when pressed?","Does the valve click?"]);
  }
  if (sym === "leaking") return leakResult(a,"refrigerator");
  if (sym === "ice maker not working") {
    if (no(a,"ice_maker_power")) return make("likely","Ice-maker power/control issue","82","Verify the ice-maker switch, harness, and model-specific power/control circuit.","Disconnect power before electrical service.",["Is the ice maker switched on?","Does the ice maker have the specified supply?"]);
    if (yes(a,"ice_maker_power") && no(a,"water_reaches_ice_maker")) return make("likely","Ice-maker water supply/valve/tube restriction",88,"Check inlet valve, tubing, filter, and frozen fill tube.","Shut off water before disconnecting tubing.",["Is the fill tube frozen?","Does the refrigerator water dispenser work?"]);
    if (yes(a,"water_reaches_ice_maker") && no(a,"ice_maker_cycles")) return make("likely","Ice-maker module/thermostat/control problem","85","Run the model-specific ice-maker diagnostic cycle and inspect the module.","Disconnect power before mechanical/electrical service.",["Does the ice maker harvest when manually tested according to the service procedure?"]);
  }
  if (sym === "frost buildup") {
    if (yes(a,"frost_back_wall")) return make("likely","Defrost/airflow problem",86,"Inspect defrost system, evaporator fan, door sealing, and airflow passages.","Disconnect power before accessing the evaporator.",["Is the evaporator fan running?","Does the door gasket seal evenly?"]);
    if (yes(a,"door_gasket_bad")) return make("likely","Door gasket/air leakage",86,"Inspect and correct the door gasket seal and door alignment.","Avoid damaging the gasket during inspection.",["Is there condensation around the gasket?","Does a paper test show an uneven seal?"]);
  }
  if (sym === "freezing food") {
    if (yes(a,"airflow_blocked")) return make("likely","Blocked/incorrect airflow","82","Clear vents and verify damper/airflow operation.","Disconnect power before moving internal airflow components.",["Are food items blocking vents?","Is the damper stuck open?"]);
    if (yes(a,"control_set_too_cold")) return make("likely","Temperature setting/control issue","78","Verify temperature settings and sensor/control operation.","Do not bypass temperature controls.",["What are actual measured temperatures?"]);
  }
  if (sym === "noise") {
    if (yes(a,"noise_changes_with_fan")) return make("likely","Fan/blade/ice interference","80","Identify the fan making the noise and inspect for ice, debris, or worn bearings.","Disconnect power before fan inspection.",["Does the noise stop when a fan is not running?"]);
    if (yes(a,"noise_changes_with_compressor")) return make("likely","Compressor/start-system or vibration noise","68","Check compressor mounting and start-system behavior; use model-specific service data.","Do not open the sealed system.",["Is the noise a click, buzz, rattle, or hard vibration?"]);
  }
  return make("undetermined","No unique refrigerator fault can be established yet","35","Use the targeted questions below. If the answers still do not isolate a component, FixIQ will provide the safest next test rather than guessing a part.","Follow manufacturer safety instructions.",[...genericIntake("refrigerator",sym,a),"What changed immediately before the problem started?","What exactly happens from the moment you start the appliance?"]);
}

function washer(sym,a) {
  if (sym === "won't drain") {
    if (yes(a,"water_remaining") && yes(a,"filter_blocked")) return make("likely","Blocked drain filter/pump trap","95","Clean the filter/trap and retest the drain.","Unplug first and expect water to escape.",["Does it drain normally after cleaning?"]);
    if (yes(a,"water_remaining") && yes(a,"pump_hums") && no(a,"filter_blocked")) return make("likely","Drain pump obstruction or failing pump","87","Inspect pump impeller, drain hose, and pump housing.","Unplug before pump access.",["Does the impeller turn freely?","Is the drain hose clear?"]);
    if (yes(a,"water_remaining") && no(a,"pump_hums") && yes(a,"power_reaches_pump")) return make("likely","Drain pump failure","91","Test the pump against model specifications and replace if it fails.","Disconnect power before electrical testing.",["Does the pump have the specified resistance?"]);
    if (yes(a,"water_remaining") && no(a,"power_reaches_pump")) return make("likely","Drain pump wiring/control output issue","83","Trace the pump harness and control output using model-specific diagnostics.","Electrical testing should be performed safely.",["Is the harness damaged/corroded?","Does the control output match specification?"]);
  }
  if (sym === "won't spin") {
    if (yes(a,"water_remaining")) return make("likely","Drain problem preventing spin","80","Resolve the drain fault first, then retest spin.","Unplug before service.",["Does it spin after it drains completely?"]);
    if (no(a,"lid_or_door_lock")) return make("likely","Lid/door lock circuit","91","Inspect latch/lock, wiring, and model-specific lock diagnostics.","Never bypass the safety interlock.",["Does the lock engage and stay locked?"]);
    if (yes(a,"lid_or_door_lock") && no(a,"motor_runs")) return make("likely","Motor/drive/control problem","78","Check motor supply, motor components, belt/coupling, and control output.","Disconnect power before mechanical inspection.",["Does the motor receive the specified voltage?","Is the belt/coupling intact?"]);
    if (yes(a,"motor_runs") && no(a,"basket_turns")) return make("likely","Drive system/coupling/belt/transmission problem",88,"Inspect the mechanical drive system for broken, seized, or slipping components.","Disconnect power before mechanical service.",["Does the basket turn freely by hand with power removed?"]);
  }
  if (sym === "won't start") {
    if (no(a,"power_ok")) return make("likely","Power supply/outlet/breaker issue","94","Verify outlet, breaker/fuse, cord, and incoming power.","Do not work inside energized equipment.",["Does another device work from the same outlet?"]);
    if (no(a,"display_or_controls")) return make("likely","Control/display power issue","82","Check line supply, control power path, and user-interface/control connection.","Disconnect power before opening the console.",["Is the outlet voltage correct?","Are there signs of water or corrosion?"]);
    if (yes(a,"display_or_controls") && no(a,"lid_or_door_lock")) return make("likely","Lid/door lock preventing start","90","Inspect lock/latch and run model diagnostics.","Do not bypass the interlock.",["Does the lock engage when Start is pressed?"]);
  }
  if (sym === "won't fill") {
    if (yes(a,"power_ok") && no(a,"water_supply")) return make("likely","Household water supply/closed valve","95","Verify both supply valves are fully open and household water pressure is present.","Shut water off before disconnecting hoses.",["Do both hot/cold supply valves have flow?"]);
    if (yes(a,"water_supply") && no(a,"inlet_valve_opens")) return make("likely","Water inlet valve/filter/screen problem",88,"Inspect inlet screens and test the inlet valve.","Shut water off before hose service.",["Do you hear the valve energize?","Are inlet screens blocked?"]);
    if (yes(a,"inlet_valve_opens") && no(a,"water_enters")) return make("likely","Blocked inlet path/pressure issue","84","Inspect screens, hoses, pressure, and internal inlet path.","Shut water off before service.",["Is water pressure normal at the hose?"]);
  }
  if (sym === "overfilling") {
    if (yes(a,"fills_when_off")) return make("likely","Water inlet valve stuck open","96","Shut off the water supply and replace/test the inlet valve according to model procedure.","Turn off water immediately; flooding can occur.",["Does water continue entering with the washer unplugged?"]);
    if (yes(a,"fills_when_off") === false && yes(a,"pressure_system_suspect")) return make("likely","Water-level pressure sensing/control issue","82","Inspect pressure hose, pressure sensor, and control logic.","Disconnect power before service.",["Is the pressure hose kinked, blocked, or disconnected?"]);
  }
  if (sym === "leaking") return leakResult(a,"washer");
  if (sym === "vibration") {
    if (yes(a,"unbalanced_load")) return make("likely","Unbalanced/incorrectly loaded washer","90","Redistribute the load and verify leveling.","Keep hands clear during spin.",["Does it vibrate with a balanced small load?"]);
    if (yes(a,"level_ok") && yes(a,"empty_still_vibrates")) return make("likely","Suspension/shock/bearing/mechanical issue","83","Inspect suspension, tub bearings, and mechanical mounting components.","Disconnect power before mechanical inspection.",["Is there tub play or grinding by hand?"]);
  }
  if (sym === "agitation") {
    if (yes(a,"motor_runs") && no(a,"agitator_moves")) return make("likely","Agitator/coupling/drive mechanism",88,"Inspect the model-specific agitator and drive components.","Disconnect power before mechanical service.",["Does the basket spin normally?"]);
  }
  if (sym === "noise") {
    if (yes(a,"noise_only_during_spin")) return make("likely","Spin-related mechanical/bearing/suspension issue","76","Identify whether the noise is grinding, banging, squealing, or rubbing and inspect the corresponding system.","Stop use if grinding is severe or the tub is unstable.",["What type of noise is it?","Does the tub have excessive play?"]);
  }
  return make("undetermined","No unique washer fault can be established yet","35","Answer the targeted questions. FixIQ will continue narrowing the fault or select the safest next physical test instead of guessing.","Do not bypass lid/door safety systems.",[...genericIntake("washer",sym,a),"Is water entering the machine?","What happens immediately after Start is pressed?","Does the motor make any sound?"]);
}

function dryer(sym,a) {
  if (sym === "no heat" || sym === "long dry time") {
    const type=val(a,"dryer_type");
    if (!type || type === "unknown") return make("undetermined","Dryer type must be identified before selecting the heating circuit","45","Tell FixIQ whether the dryer is electric or gas, then it will use the correct branch.","Do not open a gas appliance if you are not qualified.",["Is the dryer electric or gas?","Does the drum tumble?","Is airflow strong at the outside vent?"]);
    if (yes(a,"drum_turns") && no(a,"airflow_good")) return make("likely","Restricted exhaust airflow","96","Clean the lint path and exhaust vent, then verify strong airflow outside.","Stop use if the dryer overheats or airflow is severely restricted.",["Is the outside vent hood opening fully?","Is the vent hose crushed/kinked?"]);
    if (type === "electric") {
      if (yes(a,"drum_turns") && yes(a,"airflow_good") && no(a,"heating_element")) return make("likely","Heating element/open heater circuit",92,"Test the heating element and thermal cutoffs against model specifications.","Disconnect power; electric dryers contain high-voltage circuits.",["Does the element have continuity?","Are thermal cutoffs intact?"]);
      if (yes(a,"heating_element") && no(a,"heater_power")) return make("likely","Heater control/power circuit",86,"Check thermostats, thermal cutoff circuit, wiring, and control output.","Electrical testing should be performed safely.",["Does the heater receive the specified voltage during a heat call?"]);
    }
    if (type === "gas") {
      if (no(a,"igniter_glows")) return make("likely","Igniter/thermal safety/ignition circuit",88,"Test igniter, thermal fuse/cutoff, wiring, and control signal.","Do not disturb gas connections unless qualified.",["Does the igniter have continuity?","Is the thermal fuse intact?"]);
      if (yes(a,"igniter_glows") && no(a,"flame_appears")) return make("likely","Gas valve coils / gas ignition circuit","91","Follow the model-specific gas ignition sequence and test coils/valve safely.","Gas service requires appropriate qualifications and leak checks.",["Does the igniter glow brightly and then shut off?","Do the coils receive the specified power?"]);
    }
  }
  if (sym === "overheats") {
    if (no(a,"airflow_good")) return make("likely","Restricted exhaust airflow","98","Stop using the dryer and clean the lint filter, internal lint path, hose, and exterior vent.","Restricted venting is a fire hazard.",["Is airflow strong outside?","Is the vent hose crushed?"]);
    if (yes(a,"airflow_good") && yes(a,"heater_stays_on")) return make("likely","Temperature control/heater switching fault","90","Test thermostats, sensors, heater relay/control, and cycling temperatures.","Disconnect power before service.",["Does heat ever cycle off?","What temperature is measured at the exhaust?"]);
    if (yes(a,"airflow_good") && no(a,"heater_stays_on")) return make("likely","Temperature-sensing/airflow/load condition","70","Verify sensor operation, drum airflow, load size, and exhaust temperature.","Stop use if cabinet temperatures are abnormal.",["Does it overheat empty as well as loaded?"]);
  }
  if (sym === "won't start") {
    if (no(a,"power_ok")) return make("likely","Power supply/breaker/outlet issue","95","Verify the outlet, breaker/fuses, cord, and supply.","Do not service energized equipment.",["Does another appliance work from the outlet?"]);
    if (yes(a,"power_ok") && no(a,"door_switch")) return make("likely","Door switch/latch circuit","90","Inspect door switch/latch and wiring.","Disconnect power before service.",["Does the interior light or switch behavior change when the door is moved?"]);
    if (yes(a,"power_ok") && yes(a,"door_switch") && no(a,"motor_starts")) return make("likely","Start circuit/motor/control issue","78","Check motor circuit, start components, belt switch if equipped, and control output.","Disconnect power before mechanical/electrical service.",["Does the motor hum?","Is the drum hard to turn by hand?"]);
  }
  if (sym === "won't tumble") {
    if (no(a,"motor_starts") && yes(a,"motor_hums")) return make("likely","Motor/start component or seized load","82","Check blower/drum for obstruction and test motor/start circuit.","Disconnect power before inspection.",["Does the drum turn freely by hand?","Is the blower wheel obstructed?"]);
    if (yes(a,"motor_starts") && no(a,"drum_turns")) return make("likely","Broken/slipped belt or drum drive problem","93","Inspect belt, idler, drum support, and motor pulley.","Disconnect power before opening the cabinet.",["Is the belt intact?"]);
  }
  if (sym === "burning smell") return make("likely","Overheating, lint/airflow, belt, motor, or electrical fault","62","Stop operation and inspect airflow and visible lint/belt/electrical damage before further use.","A burning odor can indicate a fire hazard; do not continue running the dryer until inspected.",["Is airflow strong outside?","Is the smell electrical, rubber/belt-like, or lint-like?","Is there visible lint buildup?"]);
  if (sym === "noise") {
    if (yes(a,"noise_with_tumble")) return make("likely","Drum support/belt/idler/blower/motor noise","74","Identify the noise source and inspect the rotating components.","Disconnect power before opening the cabinet.",["Is it squealing, thumping, scraping, or rattling?","Does the noise change with drum speed?"]);
  }
  if (sym === "leaking") return leakResult(a,"dryer");
  return make("undetermined","No unique dryer fault can be established yet","35","Answer the targeted questions; FixIQ will select the next safest observation or test rather than guessing.","Stop use for smoke, sparks, gas smell, or strong burning odor.",[...genericIntake("dryer",sym,a),"Is it electric or gas?","Does the drum turn?","How strong is airflow at the exterior vent?","Does the heater/igniter operate?"]);
}

function dishwasher(sym,a) {
  if (sym === "won't drain") {
    if (yes(a,"water_standing") && yes(a,"filter_blocked")) return make("likely","Blocked filter/sump area","96","Clean filters and sump area and retest drain.","Disconnect power before internal inspection.",["Does it drain after cleaning?"]);
    if (yes(a,"water_standing") && yes(a,"pump_hums") && no(a,"filter_blocked")) return make("likely","Drain pump obstruction/failing pump",88,"Inspect impeller, pump housing, drain hose, and disposal connection if applicable.","Disconnect power before pump access.",["Does the impeller turn freely?","Is the drain hose clear?"]);
    if (yes(a,"water_standing") && no(a,"pump_hums") && yes(a,"pump_receives_power")) return make("likely","Drain pump failure",92,"Test the drain pump to model specifications and replace if defective.","Disconnect power before replacement.",["Does pump resistance match specification?"]);
    if (no(a,"pump_receives_power") && known(a,"pump_receives_power")) return make("likely","Drain pump wiring/control output issue","84","Trace pump wiring and control output using model-specific diagnostics.","Electrical testing requires caution.",["Is the pump harness damaged?","Does the control output match specification?"]);
  }
  if (sym === "not cleaning") {
    if (yes(a,"fills") && no(a,"water_spray")) return make("likely","Circulation pump/spray-arm water delivery problem","90","Inspect spray arms, filters, sump, and circulation pump.","Disconnect power before internal inspection.",["Are spray-arm holes blocked?","Can you hear the circulation pump?"]);
    if (yes(a,"fills") && yes(a,"water_spray") && no(a,"detergent_dispenses")) return make("likely","Detergent dispenser problem","83","Inspect dispenser latch, actuator, and detergent condition.","Disconnect power before service.",["Does the dispenser door open?","Is detergent caked inside?"]);
    if (yes(a,"fills") && yes(a,"water_spray") && yes(a,"detergent_dispenses") && no(a,"water_hot")) return make("likely","Water-temperature/heating issue","82","Verify incoming water temperature and heating element/control operation.","Avoid contact with hot water and energized heater components.",["Does the dishwasher heat during the cycle?","Is incoming water hot at the sink?"]);
    if (yes(a,"fills") && yes(a,"water_spray") && yes(a,"detergent_dispenses")) return make("likely","Wash performance/load/filter issue","70","Clean filters and spray arms, verify loading, detergent, water temperature, and cycle selection.","Follow manufacturer cleaning instructions.",["Are filters clean?","Are spray arms unobstructed?","Is water hot enough?"]);
  }
  if (sym === "won't start") {
    if (no(a,"power_ok")) return make("likely","Power supply/breaker issue","95","Verify breaker, outlet/supply, and appliance power connection.","Do not service energized equipment.",["Does the control panel have any lights?"]);
    if (yes(a,"power_ok") && no(a,"display_or_controls")) return make("likely","Control/interface power problem","83","Check control power path, user interface connection, and model diagnostics.","Disconnect power before opening controls.",["Is the unit receiving the specified supply voltage?"]);
    if (yes(a,"display_or_controls") && no(a,"door_latch")) return make("likely","Door latch/safety interlock issue",92,"Inspect latch and door alignment and run model diagnostics.","Do not bypass the door interlock.",["Does the latch click/engage firmly?"]);
  }
  if (sym === "won't fill") {
    if (no(a,"water_supply")) return make("likely","Water supply/closed valve issue","95","Verify household water supply and inlet valve are open.","Shut water off before disconnecting hoses.",["Is water pressure normal at the inlet?"]);
    if (yes(a,"water_supply") && no(a,"inlet_valve_opens")) return make("likely","Inlet valve/control issue",86,"Test inlet valve, wiring, and control signal.","Disconnect power before electrical testing.",["Do you hear the inlet valve energize?"]);
    if (yes(a,"inlet_valve_opens") && no(a,"water_enters")) return make("likely","Blocked inlet path/valve screen/pressure issue","84","Inspect inlet screen, hose, valve, and water pressure.","Shut water off before service.",["Is the inlet screen blocked?"]);
  }
  if (sym === "not drying") {
    if (no(a,"water_hot")) return make("likely","Heating system/water-temperature issue","84","Verify incoming hot water, heater operation, and drying system components for the model.","Avoid hot-water burns and energized heater components.",["Is the incoming water hot?","Does the unit heat during the cycle?"]);
    if (yes(a,"rinse_aid_low")) return make("likely","Rinse-aid/drying performance issue","72","Refill rinse aid if the model uses it and verify drying option/settings.","Follow manufacturer instructions.",["Is heated-dry enabled?"]);
  }
  if (sym === "leaking") return leakResult(a,"dishwasher");
  if (sym === "noise") {
    if (yes(a,"noise_only_drain")) return make("likely","Drain pump/debris issue","78","Inspect drain pump area for debris and abnormal impeller noise.","Disconnect power before pump inspection.",["Is the noise a grinding/rattling sound?"]);
    if (yes(a,"noise_only_wash")) return make("likely","Circulation pump/spray-arm/debris issue","76","Inspect spray arms, sump, and circulation pump.","Disconnect power before internal inspection.",["Are spray arms hitting dishes?","Is there debris in the sump?"]);
  }
  if (sym === "odor") return make("likely","Filter/sump/food debris or drain-path odor","80","Clean filters and sump, inspect drain hose routing, and run the manufacturer cleaning cycle if available.","Disconnect power before internal cleaning beyond user-accessible areas.",["Are filters clean?","Does the odor remain after a cleaning cycle?"]);
  return make("undetermined","No unique dishwasher fault can be established yet","35","Answer the targeted questions; FixIQ will keep narrowing the fault or select a safe next test.","Do not operate with leaks or electrical hazards.",[...genericIntake("dishwasher",sym,a),"Does it fill with water?","Do you hear the circulation pump?","Do you hear the drain pump?","Does the water get hot?"]);
}

function leakResult(a,appliance) {
  if (yes(a,"leak_source_door")) return make("likely",`${appliance === "dishwasher" ? "Door seal/latch" : "Door/gasket"} leak`,86,"Inspect the door/gasket alignment and seal for damage, debris, or misalignment.","Disconnect power if water can reach electrical components.",["Does the leak start immediately or only during fill/wash?"]);
  if (yes(a,"leak_source_hose")) return make("likely","Hose/connection leak",92,"Inspect the identified hose, clamp, fitting, and connection; repair/replace as appropriate.","Shut off water before disconnecting a hose.",["Does it leak when the appliance is filling or even when idle?"]);
  if (yes(a,"leak_source_pump")) return make("likely","Pump/housing leak",88,"Inspect pump housing, seals, and connections.","Disconnect power and isolate water before service.",["Is the pump housing cracked or wet at a seal?"]);
  return make("undetermined","Leak source not yet localized",48,"Do not guess the failed part. First identify where the water originates and when it begins; that observation sharply narrows the repair.","Stop use if water can reach electrical components.",["Does the leak occur while filling, washing, draining, or even while idle?","Is the water coming from the door, a hose/connection, underneath, or the rear?","Is the water clean, soapy, or dirty?"]);
}

function diagnose(appliance,symptom,answers={},options={}) {
  const a={...(answers||{})};
  const app=norm(appliance); const sym=canonicalSymptom(app,symptom);
  const safe=safetyGate(a); if (safe) return {...safe, appliance:app, symptom:sym, mode:"diagnostic"};
  let r;
  if (app === "refrigerator") r=refrigerator(sym,a);
  else if (app === "washer") r=washer(sym,a);
  else if (app === "dryer") r=dryer(sym,a);
  else if (app === "dishwasher") r=dishwasher(sym,a);
  else r=make("undetermined","Unsupported appliance category","10","Select one of the supported appliance types or provide the appliance type for a new diagnostic tree.","Follow manufacturer safety instructions.",["What type of appliance is this?",Q.model,Q.error]);
  return {...r, appliance:app, symptom:sym, mode:"diagnostic"};
}

// Chooses the next question. Priority is safety -> high branching value -> missing evidence.
function nextQuestion(appliance,symptom,answers={}) {
  const r=diagnose(appliance,symptom,answers);
  if (r.status === "safety_stop") return null;
  const qs=r.followUpQuestions || [];
  const first=qs.find(q=>q && !Object.values(answers||{}).some(v=>norm(v)===norm(q)));
  return first || null;
}

// Guarantees a useful terminal object: even when a component cannot be named, the answer is a concrete next test/inspection.
function finalAnswer(appliance,symptom,answers={}) {
  const r=diagnose(appliance,symptom,answers);
  if (r.status === "undetermined" && (!r.nextStep || !r.followUpQuestions?.length)) {
    return {...r, nextStep:"Collect the model number, error code, power status, and the exact sequence of events. Then perform the safest manufacturer-approved observation/test before selecting a part."};
  }
  return r;
}

module.exports={diagnose,finalAnswer,nextQuestion,canonicalSymptom};
