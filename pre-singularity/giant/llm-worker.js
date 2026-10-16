// 离线巨人:在浏览器里运行 Qwen2.5-0.5B-Instruct(WebGPU)。输入不离开本机。
const CDNS = ['https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.web.min.js',
  'https://fastly.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.web.min.js',
  'https://unpkg.com/@huggingface/transformers@4.3.1/dist/transformers.web.min.js'];
let pipeline, env, TextStreamer;
async function lib(){ if(pipeline) return; for(const u of CDNS){ try{ ({pipeline, env, TextStreamer} = await import(u)); env.allowLocalModels=false; return; }catch(e){} } throw new Error('推理引擎下载失败'); }
const MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct';
let gen = null;
async function load(host, dtype){
  await lib();
  env.remoteHost = host;
  gen = await pipeline('text-generation', MODEL, { dtype, device:'webgpu', progress_callback: p => postMessage({t:'prog', p}) });
}
onmessage = async (e) => { const d = e.data;
  if(d.t === 'load'){
    const hosts = ['https://hf-mirror.com/', 'https://huggingface.co/'];
    for(const h of hosts){ try{ postMessage({t:'info', m: h.includes('mirror')? '从国内镜像下载…' : '镜像不通,改从 huggingface.co 下载…'}); await load(h, d.dtype); postMessage({t:'ready'}); return; }
      catch(err){ postMessage({t:'warn', m:String(err && err.message || err)}); } }
    postMessage({t:'err', m:'模型下载失败,请检查网络后重试。'}); return; }
  if(d.t === 'gen' && gen){
    const t0 = performance.now(); let n = 0;
    const streamer = new TextStreamer(gen.tokenizer, { skip_prompt:true, skip_special_tokens:true,
      callback_function: s => postMessage({t:'txt', s}),
      token_callback_function: ids => { for(const id of ids){ n++; postMessage({t:'tok', s: gen.tokenizer.decode([Number(id)], {skip_special_tokens:true})}); } } });
    try{ await gen(d.messages, { max_new_tokens: d.max || 200, do_sample:true, temperature:.7, top_p:.9, streamer }); postMessage({t:'done', n, ms: performance.now()-t0}); }
    catch(err){ postMessage({t:'err', m:String(err && err.message || err)}); } }
};
