// FixIQ v4.4 - Diagnostic Conversation Engine
const {orchestrate}=require('./v4Orchestrator');
const {extract}=require('./naturalLanguageAdapter');
const {evaluate}=require('./safetyEngine');
const VERSION='4.4.0';
function start(userText=''){const parsed=extract(userText);const safety=evaluate({rawText:userText,symptom:parsed.symptoms.join(' ')});if(safety.blocked)return {version:VERSION,status:'safety_stop',parsed,safety,assistantMessage:safety.messages[0]};const input=parsed.symptoms.length?{...require('./naturalLanguageAdapter').toDiagnosticInput(parsed),symptom:parsed.symptoms[0]}:null;if(!input)return {version:VERSION,status:'clarify',parsed,assistantMessage:'Tell me the appliance and describe exactly what it is doing, including what happens when you start a cycle.'};const result=orchestrate(input);return {version:VERSION,status:'diagnostic',parsed,safety,result,assistantMessage:result.explanation,nextQuestion:result.nextBestQuestion};}
function answer(state,answer){const session=state.result?.sessionState||state.session||null;return {version:VERSION,status:'continue',state,answer};}
module.exports={VERSION,start,answer};
