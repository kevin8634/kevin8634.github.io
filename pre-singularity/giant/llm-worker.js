// 离线巨人:在浏览器里运行 Qwen2.5-0.5B-Instruct(WebGPU)。输入不离开本机。
// v0.6.2:已下载过的模型直接从浏览器缓存唤醒(按缓存来源选源、跳过探测)。
// v0.6.1 修复:①原用 transformers.web.min.js,内含裸模块导入 onnxruntime-web/webgpu,浏览器直接 import 必失败(根因);改用自带 ORT 的 transformers.min.js。②国内网络:推理引擎、ONNX Runtime WASM、模型文件三段全部优先走国内可达的源,并逐个探测。
const VER = '4.3.1', ORT = '1.31.0-dev.20260914-8d85527a0';
const NPM = ['https://cdn.jsdmirror.com/npm/', 'https://s4.zstatic.net/npm/', 'https://jsd.onmicrosoft.cn/npm/',
             'https://cdn.jsdelivr.net/npm/', 'https://fastly.jsdelivr.net/npm/', 'https://unpkg.com/'];
// 模型源:魔搭 ModelScope(国内,支持跨域)→ hf-mirror → huggingface.co
const HOSTS = [
  { name:'魔搭 ModelScope', host:'https://modelscope.cn/models/', tpl:'{model}/resolve/master/' },
  { name:'hf-mirror 镜像', host:'https://hf-mirror.com/', tpl:'{model}/resolve/{revision}/' },
  { name:'huggingface.co', host:'https://huggingface.co/', tpl:'{model}/resolve/{revision}/' }];
const MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct';
let pipeline, env, TextStreamer, npmBase = null, gen = null;

function withTimeout(p, ms, what){ return Promise.race([p, new Promise((_,j)=>setTimeout(()=>j(new Error(what+' 超时')), ms))]); }
async function probe(url, ms=8000){ const c = new AbortController(); const t = setTimeout(()=>c.abort(), ms);
  try{ const r = await fetch(url, { signal:c.signal, cache:'no-store' }); return r.ok; } catch(e){ return false; } finally{ clearTimeout(t); } }

async function lib(){
  if(pipeline) return;
  for(const b of NPM){
    try{
      postMessage({t:'info', m:'载入推理引擎:'+new URL(b).host+' …'});
      ({pipeline, env, TextStreamer} = await withTimeout(import(b+'@huggingface/transformers@'+VER+'/dist/transformers.min.js'), 25000, '推理引擎'));
      npmBase = b; break;
    }catch(e){ postMessage({t:'warn', m:new URL(b).host+' 不通'}); }
  }
  if(!pipeline) throw new Error('推理引擎下载失败(所有 CDN 都不通)');
  env.allowLocalModels = false;
  rawFetch = env.fetch || fetch.bind(self); env.fetch = msFetch;
  // 默认 WASM 走 cdn.jsdelivr.net,国内常被拦 → 改为同一可达 CDN;再探测,不通就换下一个
  const onnx = env.backends && env.backends.onnx;
  if(onnx && onnx.wasm){
    const cands = [npmBase, ...NPM.filter(b=>b!==npmBase)];
    for(const b of cands){
      const v = (onnx.versions && onnx.versions.web) || ORT; const dir = b+'onnxruntime-web@'+v+'/dist/';
      if(await probe(dir+'ort-wasm-simd-threaded.asyncify.mjs')){
        onnx.wasm.wasmPaths = { mjs: dir+'ort-wasm-simd-threaded.asyncify.mjs', wasm: dir+'ort-wasm-simd-threaded.asyncify.wasm' };
        postMessage({t:'info', m:'运行时:'+new URL(b).host}); break;
      }
    }
  }
}
// 魔搭的小文件在 Range 请求(206)和 404 时不带跨域头,浏览器会报 Failed to fetch。
// 对魔搭:只请求仓库里真实存在的文件;小文件去掉 Range 头;.onnx 会 302 到 cdn-lfs-cn(带跨域头,可保留 Range)。
const MS_FILES = new Set(['config.json','generation_config.json','tokenizer.json','tokenizer_config.json','special_tokens_map.json','vocab.json','added_tokens.json',
  'onnx/model.onnx','onnx/model_bnb4.onnx','onnx/model_fp16.onnx','onnx/model_int8.onnx','onnx/model_q4.onnx','onnx/model_q4f16.onnx','onnx/model_quantized.onnx','onnx/model_uint8.onnx']);
const LOCAL = new Set(['config.json','generation_config.json','tokenizer_config.json','special_tokens_map.json']);
let rawFetch = null;
function msFetch(url, init={}){
  const u = String(url && url.url || url);
  if(u.startsWith('https://modelscope.cn/models/')){
    const f = decodeURIComponent((u.split('/resolve/master/')[1]||'').split('?')[0]);
    if(!MS_FILES.has(f)) return Promise.resolve(new Response(null, {status:404, statusText:'Not Found'}));
    if(LOCAL.has(f)) return rawFetch(new URL('./qwen/'+f, self.location.href).href);  // 这几个小文件魔搭不带跨域头,随网站自带
    if(!f.endsWith('.onnx') && init && init.headers){ const h = new Headers(init.headers); h.delete('Range'); init = {...init, headers:h}; }
  }
  return rawFetch(url, init);
}
async function load(h, dtype){
  env.remoteHost = h.host; env.remotePathTemplate = h.tpl;
  gen = await pipeline('text-generation', MODEL, { dtype, device:'webgpu', progress_callback: p => postMessage({t:'prog', p}) });
}
onmessage = async (e) => { const d = e.data;
  if(d.t === 'load'){
    try{ await lib(); }catch(err){ postMessage({t:'err', m:String(err.message||err)}); return; }
    // v0.6.2:本机已缓存时,优先用当初下载的那个源(缓存按网址存),并跳过联网探测,避免换源导致重复下载
    const order = d.prefer ? [...HOSTS.filter(h=>h.name===d.prefer), ...HOSTS.filter(h=>h.name!==d.prefer)] : HOSTS;
    for(const h of order){
      if(d.cached && h.name===d.prefer){
        try{ postMessage({t:'info', m:'从本机缓存唤醒('+h.name+')…'}); await load(h, d.dtype); postMessage({t:'ready', src:'本机缓存'}); return; }
        catch(err){ postMessage({t:'warn', m:'本机缓存载入失败,改为联网:'+String(err && err.message || err)}); }
      }
      const cfg = h.host + h.tpl.replace('{model}', MODEL).replace('{revision}', 'main') + 'config.json';
      postMessage({t:'info', m:'检测模型源:'+h.name+' …'});
      if(!(await probe(cfg))){ postMessage({t:'warn', m:h.name+' 不通,换下一个'}); continue; }
      try{ postMessage({t:'info', m:'从 '+h.name+' 下载…'}); await load(h, d.dtype); postMessage({t:'ready', src:h.name}); return; }
      catch(err){ postMessage({t:'warn', m:h.name+':'+String(err && err.message || err)}); }
    }
    postMessage({t:'err', m:'模型下载失败:三个模型源都不通。请换个网络(或关掉代理)后重试。'}); return; }
  if(d.t === 'gen' && gen){
    const t0 = performance.now(); let n = 0;
    const streamer = new TextStreamer(gen.tokenizer, { skip_prompt:true, skip_special_tokens:true,
      callback_function: s => postMessage({t:'txt', s}),
      token_callback_function: ids => { for(const id of ids){ n++; postMessage({t:'tok', s: gen.tokenizer.decode([Number(id)], {skip_special_tokens:true})}); } } });
    try{ await gen(d.messages, { max_new_tokens: d.max || 200, do_sample:true, temperature:.7, top_p:.9, streamer }); postMessage({t:'done', n, ms: performance.now()-t0}); }
    catch(err){ postMessage({t:'err', m:String(err && err.message || err)}); } }
};
