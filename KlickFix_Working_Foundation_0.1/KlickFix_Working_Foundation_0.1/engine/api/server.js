// Minimal production API adapter. Connect these handlers to Supabase/Vercel when credentials are configured.
const {orchestrate}=require('../src/v4Orchestrator');
const {start}=require('../src/conversationEngine');
function handle(req){try{if(req.method==='POST'&&req.path==='/diagnose')return {status:200,body:orchestrate(req.body||{})};if(req.method==='POST'&&req.path==='/conversation')return {status:200,body:start(req.body?.message||'')};return {status:404,body:{error:'Not found'}};}catch(e){return {status:400,body:{error:e.message}};}}
module.exports={handle};
