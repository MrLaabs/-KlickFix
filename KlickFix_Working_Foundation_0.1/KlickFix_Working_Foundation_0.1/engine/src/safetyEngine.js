// FixIQ v4.3 - Safety Intelligence 2.0
const VERSION='4.3.0';
const RULES=[
 {id:'gas_leak',patterns:/gas smell|smell gas|rotten egg|sulfur smell|propane smell/i,action:'stop_gas',message:'Possible gas leak. Stop using the appliance, avoid ignition sources, and contact the appropriate qualified gas professional/emergency service.'},
 {id:'fire_smoke',patterns:/smoke|fire|flames|sparks|arcing|burning wire/i,action:'power_off',message:'Possible fire/electrical hazard. Stop operation and disconnect power only if it can be done safely.'},
 {id:'shock',patterns:/electric shock|shocked me|tingling.*appliance/i,action:'power_off',message:'Possible electrical shock hazard. Do not continue testing energized components.'},
 {id:'co',patterns:/carbon monoxide|co alarm/i,action:'evacuate',message:'Possible carbon-monoxide hazard. Leave the area and follow local emergency guidance; do not continue appliance diagnostics.'},
 {id:'refrigerant',patterns:/refrigerant leak|hissing.*refrigerator|oil.*refrigerant/i,action:'professional',message:'Possible sealed-system/refrigerant issue. Do not puncture or open the sealed system.'},
 {id:'water_electric',patterns:/water.*outlet|water.*electrical|electrical.*water/i,action:'power_off',message:'Water and electricity may create a shock hazard. Stop use and de-energize safely.'}
];
function evaluate(input={}){const text=String([input.symptom,input.rawText,input.errorCode,input.description].filter(Boolean).join(' '));const matches=RULES.filter(r=>r.patterns.test(text));return {version:VERSION,status:matches.length?'professional_required':'clear',blocked:!!matches.length,matchedRules:matches.map(r=>r.id),actions:matches.map(r=>r.action),messages:matches.map(r=>r.message),hardStop:matches.length>0};}
module.exports={VERSION,RULES,evaluate};
