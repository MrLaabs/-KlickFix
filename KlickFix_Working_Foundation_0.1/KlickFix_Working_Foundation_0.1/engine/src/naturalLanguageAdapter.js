// FixIQ v4.1 - Natural Language Intelligence Adapter
// Converts messy user language into conservative structured evidence. It never invents facts.
const VERSION='4.1.0';
const TERMS={
  'not heating':['no heat','not heating','cold','won’t heat','wont heat'],
  'not cooling':['not cooling','won’t cool','wont cool','warm refrigerator','too warm'],
  'won’t start':['won’t start','wont start','does nothing','dead','not starting'],
  'won’t drain':['won’t drain','wont drain','water left','standing water'],
  'leaking':['leak','leaking','water on floor','dripping'],
  'overheats':['too hot','overheating','gets extremely hot','hotter than normal'],
  'noise':['loud','grinding','squealing','rattling','thumping','scraping'],
  'not drying':['not drying','still wet','takes forever to dry'],
  'not cleaning':['not cleaning','dirty dishes','poor wash'],
  'won’t fill':['won’t fill','wont fill','no water entering'],
  'burning smell':['burning smell','burnt smell','smells burnt'],
  'odor':['bad smell','odor','odour','smells bad']
};
const YES=['yes','yeah','yep','works','does work','it does'];
const NO=['no','nope','doesn’t','doesnt','not','never'];
function norm(s){return String(s??'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim()}
function findSymptom(text){const t=norm(text);const hits=[];for(const [canonical,phrases] of Object.entries(TERMS)){for(const p of phrases)if(t.includes(p)){hits.push({canonical,phrase:p});break}}return hits}
function extract(text){
 const t=norm(text); const symptomHits=findSymptom(t);
 const danger=[];
 if(/gas smell|rotten egg|sulfur smell/.test(t)) danger.push('gas_leak_possible');
 if(/smoke|sparks|arcing|electric shock|shocked me|fire/.test(t)) danger.push('electrical_fire_or_shock_hazard');
 if(/carbon monoxide|co alarm/.test(t)) danger.push('carbon_monoxide_hazard');
 const appliance=(/refrigerator|fridge/.test(t)?'refrigerator':/washer|washing machine/.test(t)?'washer':/dryer/.test(t)?'dryer':/dishwasher/.test(t)?'dishwasher':/oven|range|stove/.test(t)?'oven':/microwave/.test(t)?'microwave':/furnace/.test(t)?'furnace':/water heater/.test(t)?'water_heater':null);
 const model=(t.match(/\b[A-Z0-9]{2,}[-/][A-Z0-9./-]+\b/i)||[])[0]||null;
 return {adapterVersion:VERSION,rawText:text,appliance,symptoms:[...new Set(symptomHits.map(x=>x.canonical))],symptomEvidence:symptomHits,dangerSignals:danger,modelNumber:model,ambiguities: symptomHits.length>1?['Multiple symptom branches detected; FixIQ should clarify the primary complaint.']:[],confidence:symptomHits.length?0.78:0.18};
}
function toDiagnosticInput(parsed){return {appliance:parsed.appliance||'',symptom:parsed.symptoms[0]||'',context:{modelNumber:parsed.modelNumber||undefined,naturalLanguage:{symptoms:parsed.symptoms,dangerSignals:parsed.dangerSignals}}};}
module.exports={VERSION,extract,toDiagnosticInput};
