/* 奇点前夜 Pre-Singularity · 公共层 ps.js v0.6
   本地存储键:gn:ps:<任务>(Genesis Core 约定)。无账号、无服务器、无埋点。 */
(function(){
const PS = window.PS = {};
const KEY = k => 'gn:ps:' + k;
PS.get = (k, d) => { try { const v = localStorage.getItem(KEY(k)); return v ? JSON.parse(v) : d; } catch(e){ return d; } };
PS.set = (k, v) => { try { localStorage.setItem(KEY(k), JSON.stringify(v)); } catch(e){} };

/* 用户程度:first 初遇 / chat 对话 / work 工作 / geek 发烧 */
PS.TIERS = {
  first:{name:'初遇', desc:'从没用过 AI'}, chat:{name:'对话', desc:'偶尔和 AI 聊天提问'},
  work:{name:'工作', desc:'用 AI 办事'}, geek:{name:'发烧', desc:'重度玩家 / 开发者'}
};
PS.tier = () => PS.get('tier', null);
PS.setTier = t => { PS.set('tier', t); applyTier(); };
function applyTier(){ const t = PS.tier(); document.body.classList.remove('tier-first','tier-chat','tier-work','tier-geek'); if(t) document.body.classList.add('tier-'+t); }

/* 知识骨架:8 层主题 × 知识神经元。m/lv 指向任务关卡;无 m 为即将点亮 */
PS.THEMES = [
 {n:'智能是什么', k:[{t:'SI 是什么',m:'intro',d:'超级智能:几乎在所有领域都超过最聪明人类的智能。它还没有出现。'},{t:'图灵测试',m:'ask',lv:0,d:'像人,不等于会思考。'},{t:'专用与通用',m:'scale',lv:2,d:'今天的 AI 更通用了,但还不是“什么都会”。'}]},
 {n:'机器怎么学', k:[{t:'特征',m:'cat',lv:0,d:'选对线索,机器才分得清。'},{t:'梯度下降',m:'cat',lv:1,d:'每错一次,往对的方向挪一点。'},{t:'过拟合',m:'cat',lv:3,d:'背答案不等于学会规律。'},{t:'数据的力量',m:'scale',lv:0,d:'见得越多,猜得越准。'}]},
 {n:'神经网络', k:[{t:'隐藏层',m:'cat',lv:2,d:'多一层神经元,边界就能弯曲。'},{t:'模型在看哪里',m:'panda',lv:0,d:'它不懂"眼圈",只给每个像素打分。'},{t:'卷积',m:'scale',lv:1,d:'一个小窗口扫过整张图,专找一种花纹。'}]},
 {n:'语言模型', k:[{t:'预测下一个字',m:'write',lv:0,d:'写作文的秘密:一个字一个字地猜。'},{t:'温度',m:'write',lv:1,d:'稳和新之间的旋钮。'},{t:'上下文',m:'write',lv:2,d:'记得越多,越通顺。'},{t:'注意力机制',m:'attn',lv:0,d:'同一个“它”,上下文不同,看的地方就不同。'},{t:'训练注意力',m:'attn',lv:1,d:'注意力是学出来的:该看哪里,由错误教会。'},{t:'规模与涌现',m:'attn',lv:2,d:'容量够了,能力像台阶一样突然出现。'}]},
 {n:'强化学习', k:[{t:'奖励',m:'robot',lv:0,d:'只说做什么得分,它自己找办法。'},{t:'探索与利用',m:'ask',lv:1,d:'一直选最好的,可能永远发现不了更好的。'}]},
 {n:'AI 的局限', k:[{t:'幻觉的种子',m:'write',lv:3,d:'通顺不等于真实。'},{t:'找出编造',m:'truth',lv:0,d:'一本正经的错,最难发现。'},{t:'对抗样本',m:'panda',lv:1,d:'人眼看不见的噪点,骗过了模型。'}]},
 {n:'对齐与安全', k:[{t:'对齐',m:'robot',lv:1,d:'把奖励对准真正想要的结果。'},{t:'副作用',m:'robot',lv:2,d:'规则没写的,AI 就不在乎。'},{t:'鲁棒性',m:'panda',lv:2,d:'更结实,但永远不完美。'},{t:'可解释性',m:'ask',lv:2,d:'打开黑箱,一个神经元一个神经元地看。'}]},
 {n:'人机共处', k:[{t:'查出处',m:'truth',lv:1,d:'越像真的,越要查。'},{t:'核查',m:'truth',lv:2,d:'原始出处比任何转述都可靠。'},{t:'人机分工',m:'together',lv:0,d:'让 AI 做擅长的,人来做判断和负责。'},{t:'不可能任务',m:'together',lv:1,d:'知道 AI 做不到什么,和知道它能做什么一样重要。'},{t:'共生宣言',m:'together',lv:2,d:'黎明之后,我们想和 AI 怎样相处?'}]}
];
PS.MISSIONS = {cat:{q:'让 AI 认出一只猫',n:4}, write:{q:'AI 是怎么"写作文"的?',n:4}, panda:{q:'怎样让 AI 把熊猫认成长臂猿?',n:3}, robot:{q:'为什么扫地机器人会"偷懒"?',n:3}, truth:{q:'这段话是 AI 写的吗?',n:3}, attn:{q:'AI 在“看”哪里?',n:3}, scale:{q:'把 AI 放大会怎样?',n:3}, ask:{q:'AI 会思考吗?',n:3}, together:{q:'我们和 AI 怎么一起生活?',n:3}};
PS.ORDER = { first:['truth','write','cat','robot','panda','ask','scale','attn','together'], chat:['write','truth','cat','panda','robot','attn','ask','scale','together'], work:['truth','robot','write','together','cat','ask','panda','attn','scale'], geek:['cat','panda','write','attn','scale','robot','ask','truth','together'] };
PS.done = m => m==='intro' ? (PS.get('intro',0)?[0]:[]) : (PS.get(m,{done:[]}).done||[]);
PS.nodeState = k => { if(!k.m) return 'future'; if(k.m==='intro') return PS.get('intro',0)?'lit':'open';
  const d=PS.done(k.m); if(d.includes(k.lv)) return 'lit'; return (k.lv===0||d.includes(k.lv-1))?'open':'lock'; };
PS.total = () => Object.keys(PS.MISSIONS).reduce((s,m)=>s+PS.done(m).length,0);
PS.TOTAL = Object.values(PS.MISSIONS).reduce((s,m)=>s+m.n,0);
/* 萤的成长:按点亮的神经元数 */
PS.STAGES = [{n:'光点',at:0},{n:'萤火',at:6},{n:'星核',at:14},{n:'黎明',at:22}];
PS.stage = () => { const t=PS.total(); let s=0; PS.STAGES.forEach((x,i)=>{ if(t>=x.at) s=i; }); return s; };
/* 皮肤:core 神经核(默认)/ horizon 奇点视界 */
PS.SKINS = {core:'天命之瞳', horizon:'奇点视界'};
PS.skin = () => PS.get('skin','core');
PS.setSkin = k => { PS.set('skin',k); applySkin(); document.dispatchEvent(new Event('ps-skin')); };
function applySkin(){ document.body.classList.remove('skin-core','skin-horizon'); document.body.classList.add('skin-'+PS.skin()); }
/* 萤的形象(小画布) */
PS.drawYing = (cv, t, speak=0, stage=PS.stage()) => { const x=cv.getContext('2d'), W=cv.width, H=cv.height, cx=W/2, cy=H/2; x.clearRect(0,0,W,H);
  const gold = PS.skin()==='horizon'; const c1 = gold? '255,210,122' : '63,224,255';
  const r0 = W*(.07+stage*.03)*(1+speak*.25+.06*Math.sin(t/400));
  const g=x.createRadialGradient(cx,cy,0,cx,cy,r0*4); g.addColorStop(0,`rgba(${c1},.9)`); g.addColorStop(.25,`rgba(${c1},.35)`); g.addColorStop(1,`rgba(${c1},0)`);
  x.fillStyle=g; x.beginPath(); x.arc(cx,cy,r0*4,0,7); x.fill(); x.fillStyle='#fff'; x.beginPath(); x.arc(cx,cy,r0*.6,0,7); x.fill();
  x.strokeStyle=`rgba(${c1},.6)`; x.lineWidth=1;
  for(let i=0;i<stage;i++){ x.beginPath(); x.ellipse(cx,cy,r0*(2+i*1.1),r0*(2+i*1.1)*(.35+.2*i),t/(1600+i*500)*(i%2?-1:1),0,7); x.stroke(); }
  if(stage>=2) for(let i=0;i<10;i++){ const a=t/900+i*.628, rr=r0*(3+Math.sin(t/700+i)); x.fillStyle=`rgba(${c1},.8)`; x.beginPath(); x.arc(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.6,1.2,0,7); x.fill(); }
  if(stage>=3){ x.strokeStyle='rgba(255,230,170,.35)'; for(let i=0;i<12;i++){ const a=i*.5236+t/3000; x.beginPath(); x.moveTo(cx+Math.cos(a)*r0*1.2,cy+Math.sin(a)*r0*1.2); x.lineTo(cx+Math.cos(a)*r0*5,cy+Math.sin(a)*r0*5); x.stroke(); } }
};

/* 星空背景 */
function stars(){
  const c = document.createElement('canvas'); c.id='stars'; document.body.prepend(c);
  const x = c.getContext('2d'); let W,H,S=[];
  function rs(){ W=c.width=innerWidth; H=c.height=innerHeight; S=Array.from({length:Math.round(W*H/9000)},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2+.2,p:Math.random()*6}));}
  rs(); addEventListener('resize', rs);
  (function f(t){ x.clearRect(0,0,W,H); for(const s of S){ x.globalAlpha=.35+.35*Math.sin(t/900+s.p); x.fillStyle='#bfefff'; x.beginPath(); x.arc(s.x,s.y,s.r,0,7); x.fill(); } requestAnimationFrame(f); })(0);
}

/* ===================== 音频系统 v0.3 =====================
   全部 Web Audio 实时合成:无音频文件、无版权素材。
   总线:music(生成式背景音乐) / sfx(皮肤专属音效) → 混响 → 压缩 → 输出 */
let AC=null, master=null, musicBus=null, sfxBus=null, verb=null, NOISE=null;
PS.muted = () => PS.get('mute', false);
function impulse(sec,decay){ const n=AC.sampleRate*sec, b=AC.createBuffer(2,n,AC.sampleRate); for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay); } return b; }
function ac(){ if(!AC){ AC=new (window.AudioContext||window.webkitAudioContext)();
    const comp=AC.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; comp.connect(AC.destination);
    master=AC.createGain(); master.gain.value=.9; master.connect(comp);
    verb=AC.createConvolver(); verb.buffer=impulse(3.4,2.4); const vg=AC.createGain(); vg.gain.value=.55; verb.connect(vg); vg.connect(master);
    sfxBus=AC.createGain(); sfxBus.gain.value=.6; sfxBus.connect(master); const sv=AC.createGain(); sv.gain.value=.3; sfxBus.connect(sv); sv.connect(verb);
    musicBus=AC.createGain(); musicBus.gain.value=0; musicBus.connect(master); const mv=AC.createGain(); mv.gain.value=.7; musicBus.connect(mv); mv.connect(verb);
    const n=AC.sampleRate; NOISE=AC.createBuffer(1,n,n); const d=NOISE.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; }
  if(AC.state==='suspended' && !document.hidden) AC.resume(); return AC; }
const mtof=m=>440*Math.pow(2,(m-69)/12);
const V={
 osc(dest,t,f,dur,vol,type='sine',att=.005){ const o=AC.createOscillator(),g=AC.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+att); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t+dur+.05); },
 pad(dest,t,freqs,dur,vol,cut=900,type='sawtooth'){ const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=cut; f.Q.value=.6; const g=AC.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+dur*.35); g.gain.linearRampToValueAtTime(vol*.75,t+dur*.75); g.gain.linearRampToValueAtTime(0,t+dur); f.connect(g); g.connect(dest);
   freqs.forEach(fr=>[-8,8].forEach(dt=>{ const o=AC.createOscillator(); o.type=type; o.frequency.value=fr; o.detune.value=dt; o.connect(f); o.start(t); o.stop(t+dur+.05); })); },
 pluck(dest,t,f,vol,type='square',cut=2400,dur=.35){ const o=AC.createOscillator(), fl=AC.createBiquadFilter(), g=AC.createGain(); o.type=type; o.frequency.value=f; fl.type='lowpass'; fl.frequency.setValueAtTime(cut,t); fl.frequency.exponentialRampToValueAtTime(180,t+dur); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(fl); fl.connect(g); g.connect(dest); o.start(t); o.stop(t+dur+.05); },
 bell(dest,t,f,vol,dur=2.5){ V.osc(dest,t,f,dur,vol); V.osc(dest,t,f*2.76,dur*.45,vol*.3); V.osc(dest,t,f*5.4,dur*.2,vol*.12); },
 noise(dest,t,dur,vol,ft='highpass',ff=6000,ff2){ const s=AC.createBufferSource(); s.buffer=NOISE; const fl=AC.createBiquadFilter(); fl.type=ft; fl.frequency.setValueAtTime(ff,t); if(ff2) fl.frequency.exponentialRampToValueAtTime(ff2,t+dur); const g=AC.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t,Math.random()*.5); s.stop(t+dur+.05); },
 kick(dest,t,vol){ const o=AC.createOscillator(), g=AC.createGain(); o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(42,t+.16); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+.38); o.connect(g); g.connect(dest); o.start(t); o.stop(t+.42); },
 sweep(dest,t,f1,f2,dur,vol,type='sine'){ const o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.setValueAtTime(f1,t); o.frequency.exponentialRampToValueAtTime(f2,t+dur); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+dur*.15); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t+dur+.05); }
};
PS.V = V; PS.mtof = mtof; PS.ac = ac;

/* ---------- v0.8 合成工具:FM、超锯齿、颗粒、立体声/HRTF 环绕、乒乓延迟、侧链 ---------- */
function panTo(dest,p){ if(!AC.createStereoPanner) return dest; const s=AC.createStereoPanner(); s.pan.value=Math.max(-1,Math.min(1,p)); s.connect(dest); return s; }
function env(g,t,vol,att,dur){ g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+att); g.gain.exponentialRampToValueAtTime(.0001,t+dur); }
V.fm=(dest,t,f,dur,vol,ratio=3.5,index=2.2,p=0,att=.004)=>{ const d=panTo(dest,p), c=AC.createOscillator(), m=AC.createOscillator(), mg=AC.createGain(), g=AC.createGain();
  c.frequency.value=f; m.frequency.value=f*ratio; mg.gain.setValueAtTime(f*index,t); mg.gain.exponentialRampToValueAtTime(f*index*.04+.01,t+dur*.8);
  m.connect(mg); mg.connect(c.frequency); env(g,t,vol,att,dur); c.connect(g); g.connect(d); c.start(t); m.start(t); c.stop(t+dur+.05); m.stop(t+dur+.05); };
V.supersaw=(dest,t,freqs,dur,vol,c0=500,c1=2200)=>{ const fl=AC.createBiquadFilter(); fl.type='lowpass'; fl.Q.value=2.2; fl.frequency.setValueAtTime(c0,t); fl.frequency.exponentialRampToValueAtTime(c1,t+dur*.55); fl.frequency.exponentialRampToValueAtTime(c0,t+dur);
  const g=AC.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+dur*.3); g.gain.setValueAtTime(vol,t+dur*.7); g.gain.linearRampToValueAtTime(0,t+dur); fl.connect(g); g.connect(dest);
  const sp=[-.85,-.4,0,.4,.85], dt=[-24,-11,0,11,24];
  freqs.forEach(fr=>dt.forEach((d,k)=>{ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.value=fr; o.detune.value=d+(Math.random()-.5)*4; const pn=panTo(fl,sp[k]); const og=AC.createGain(); og.gain.value=1/(dt.length); o.connect(og); og.connect(pn); o.start(t); o.stop(t+dur+.05); })); };
V.grain=(dest,t,f,vol,p=0,dur=.06)=>{ const d=panTo(dest,p), o=AC.createOscillator(), g=AC.createGain(); o.frequency.value=f; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+dur*.5); g.gain.linearRampToValueAtTime(0,t+dur); o.connect(g); g.connect(d); o.start(t); o.stop(t+dur+.02); };
V.hat=(dest,t,vol,p=0,open=false)=>{ const d=panTo(dest,p), s=AC.createBufferSource(); s.buffer=NOISE; s.playbackRate.value=1+Math.random()*.2; const fl=AC.createBiquadFilter(); fl.type='highpass'; fl.frequency.value=open?7000:9500; const g=AC.createGain(); env(g,t,vol,.001,open?.28:.05); s.connect(fl); fl.connect(g); g.connect(d); s.start(t, Math.random()*.5); s.stop(t+.35); };
V.clap=(dest,t,vol)=>{ [0,.011,.023].forEach(o=>{ const s=AC.createBufferSource(); s.buffer=NOISE; const fl=AC.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=1600; fl.Q.value=1.2; const g=AC.createGain(); env(g,t+o,vol,.001,.16); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t+o, Math.random()*.5); s.stop(t+o+.2); }); V.osc(dest,t,190,.09,vol*.6,'triangle'); };
function pingpong(dest,time,fb=.38,wet=.32){ const inp=AC.createGain(), dl=AC.createDelay(2), dr=AC.createDelay(2), f1=AC.createGain(), f2=AC.createGain(), w=AC.createGain(), lp=AC.createBiquadFilter();
  dl.delayTime.value=time; dr.delayTime.value=time; f1.gain.value=fb; f2.gain.value=fb; w.gain.value=wet; lp.type='lowpass'; lp.frequency.value=4200;
  const pl=panTo(dest,-.8), pr=panTo(dest,.8); inp.connect(lp); lp.connect(dl); dl.connect(f1); f1.connect(dr); dr.connect(f2); f2.connect(dl); dl.connect(w); dr.connect(w); w.connect(pl); dl.connect(pl); dr.connect(pr); return inp; }
function orbitPanner(dest){ const p=AC.createPanner(); p.panningModel='HRTF'; p.distanceModel='inverse'; p.refDistance=1; p.connect(dest); return p; }
PS.V2 = { panTo, pingpong, orbitPanner };

/* ---------- 生成式音乐:每个场景一种风格 ---------- */
const SC={dorian:[0,2,3,5,7,9,10], minor:[0,2,3,5,7,8,10], major:[0,2,4,5,7,9,11], lydian:[0,2,4,6,7,9,11], phryg:[0,1,3,5,7,8,10], hminor:[0,2,3,5,7,8,11]};
const deg=(sc,root,d)=>{ const n=sc.length; return root+sc[((d%n)+n)%n]+12*Math.floor(d/n); };
const tri=(sc,root,d)=>[0,2,4].map(k=>mtof(deg(sc,root,d+k)));
const R=Math.random;
const STY={
 // 天命之瞳 · 音乐 2.0:超锯齿和声垫(侧链呼吸)+ FM 玻璃琶音(乒乓延迟、轨道声像)+ 颗粒数据雨 + 次低音 + 电子鼓组;16 小节一个起伏
 core:{bpm:100, root:50, sc:SC.dorian, prog:[0,5,2,6,0,3,5,4], fn(s,t,st,ch,sp){
   const x=s.x; if(!x.pad){ x.pad=AC.createGain(); x.pad.connect(s.b); x.dly=pingpong(s.b,sp*3,.42,.35); x.dly.connect(s.b); }
   const sec=s.bar%16, build=sec<4?0:sec<14?2:1, brk=sec===14||sec===15;
   const chord=[0,2,4,6].map(k=>mtof(deg(s.sc,s.root+12,ch+k)));
   if(st===0) V.supersaw(x.pad,t,chord.slice(0,3).concat([chord[3]/2]),sp*16.2,.045,420+build*220,1500+build*900);
   if(st===0) V.osc(x.pad,t,mtof(deg(s.sc,s.root-12,ch)),sp*16,.05,'triangle',.6);
   // 次低音:八分音符脉冲,被侧链压
   if(!brk && build>0 && st%2===0) V.pluck(x.pad,t,mtof(deg(s.sc,s.root-24,ch)),.11,'sine',600,sp*1.6);
   // FM 玻璃琶音:轨道声像 + 乒乓
   const AR=[0,2,4,7,9,7,4,2,0,4,7,11,9,7,4,2];
   if(st%2===0 || (build===2 && R()<.3)){ const n=mtof(deg(s.sc,s.root+12,ch+AR[(st+s.bar*3)%16])); const p=Math.sin((s.bar*16+st)/5)*.75; V.fm(s.b,t,n,.5,.022,3.01,1.6+build*.4,p); V.fm(x.dly,t,n,.4,.014,3.01,1.2,p); }
   // 颗粒数据雨
   if(R()<.22+build*.12) V.grain(s.b,t+R()*sp,mtof(deg(s.sc,s.root+36,ch+(R()*7|0))),.012,R()*2-1,.03+R()*.05);
   // 鼓组 + 侧链
   if(build>0 && !brk){
     if(st===0||st===8||(st===14&&s.bar%2)){ V.kick(s.b,t,.15); x.pad.gain.cancelScheduledValues(t); x.pad.gain.setValueAtTime(.3,t); x.pad.gain.linearRampToValueAtTime(1,t+sp*3.2); }
     if(st===4||st===12) V.clap(s.b,t,.05);
     V.hat(s.b,t,[.03,.012,.02,.012][st%4]*(build===2?1:.6),st%2?.35:-.35,st===14&&R()<.5); }
   // 每 8 小节第 4 小节:FM 主题短句;break 前的上升噪声
   if(s.bar%8===4 && [0,3,6,10].includes(st)){ const M=[4,2,0,-1]; V.fm(x.dly,t,mtof(deg(s.sc,s.root+24,ch+M[[0,3,6,10].indexOf(st)])),1.2,.03,2,1.1,0,.02); }
   if(sec===13 && st===0) V.noise(s.b,t,sp*16,.04,'bandpass',300,9000);
   if(sec===0 && st===0 && s.bar>0) V.fm(s.b,t,mtof(s.root+36),2.5,.03,1.41,3,0,.01); }},
 // 奇点视界:深空长音 + 引力下坠 + 稀疏玻璃钟
 horizon:{bpm:54, root:49, sc:SC.minor, prog:[0,5,3,4], fn(s,t,st,ch,sp){
   if(st===0){ V.pad(s.b,t,tri(s.sc,s.root-12,ch),sp*16.5,.06,650,'triangle'); V.osc(s.b,t,mtof(deg(s.sc,s.root-24,ch)),sp*16,.09,'sine',1.2); }
   if((st===0||st===6||st===11) && R()<.6) V.bell(s.b,t,mtof(deg(s.sc,s.root+12,ch+[0,2,4,7][R()*4|0])),.03,3.5);
   if(st===8 && s.bar%2===1) V.sweep(s.b,t,110,38,sp*7,.06); }},
 // 开场:心跳 + 渐亮的长音
 intro:{bpm:66, root:45, sc:SC.minor, prog:[0,0,5,3], fn(s,t,st,ch,sp){
   if(st===0) V.pad(s.b,t,tri(s.sc,s.root,ch),sp*16.5,.05,500+Math.min(s.bar,8)*220);
   if(st===0) V.kick(s.b,t,.16); if(st===3) V.kick(s.b,t,.09);
   if(st===8 && R()<.7) V.bell(s.b,t,mtof(deg(s.sc,s.root+24,ch+[0,2,4][R()*3|0])),.03,3); }},
 // 认猫(视觉):明亮五声拨弦,好奇
 cat:{bpm:104, root:60, sc:SC.major, prog:[0,3,4,0], fn(s,t,st,ch,sp){
   if(st===0) V.pad(s.b,t,tri(s.sc,s.root-12,ch),sp*16,.025,1400,'triangle');
   if(st%2===0 && R()<.65) V.pluck(s.b,t,mtof(deg(s.sc,s.root+12,ch+[0,1,2,4,5][R()*5|0])),.04,'triangle',3000,.3);
   if(st===0||st===8) V.kick(s.b,t,.1); if(st===4||st===12) V.noise(s.b,t,.05,.03,'bandpass',5000);
   if(st===0||st===6) V.osc(s.b,t,mtof(deg(s.sc,s.root-12,ch)),sp*5,.07,'sine'); }},
 // AI 写作文(语言):打字机节奏 + 电钢琴和弦,吕底亚的梦感
 write:{bpm:88, root:55, sc:SC.lydian, prog:[0,1,4,3], fn(s,t,st,ch,sp){
   if(st===0||st===10) tri(s.sc,s.root,ch).forEach((f,i)=>V.osc(s.b,t+i*.012,f,sp*8,.035,'triangle',.01));
   if(R()<.42) V.noise(s.b,t,.025,.05,'bandpass',2500+R()*2500);
   if(st===0||st===6) V.osc(s.b,t,mtof(deg(s.sc,s.root-12,ch)),sp*6,.08,'sine');
   if(st%4===0 && R()<.3) V.bell(s.b,t,mtof(deg(s.sc,s.root+12,ch+[0,2,4,6][R()*4|0])),.025,2); }},
 // 熊猫被骗(对抗):弗里吉亚紧张低音 + 数字故障
 panda:{bpm:116, root:52, sc:SC.phryg, prog:[0,1,0,6], fn(s,t,st,ch,sp){
   if(st===0) V.pad(s.b,t,tri(s.sc,s.root,ch),sp*16,.03,800);
   if([0,1,3,4,6,8,9,11,12,14].includes(st)) V.pluck(s.b,t,mtof(deg(s.sc,s.root-12,ch+(st%3===0?0:(st===14?1:0)))),.07,'sawtooth',700,.16);
   if(st===0||st===8||st===11) V.kick(s.b,t,.13);
   if(R()<.12) R()<.5 ? V.noise(s.b,t,.03+R()*.05,.05,'bandpass',800+R()*6000) : V.osc(s.b,t,2000+R()*3000,.04,.025,'square'); }},
 // 扫地机器人(强化学习):8-bit 芯片音乐,四拍底鼓
 robot:{bpm:126, root:57, sc:SC.minor, prog:[0,5,6,4], fn(s,t,st,ch,sp){
   V.pluck(s.b,t,mtof(deg(s.sc,s.root+12,ch+[0,2,4,7][st%4])),.025,'square',3500,.12);
   if(st%2===0) V.pluck(s.b,t,mtof(deg(s.sc,s.root-12,ch)),.06,'triangle',1200,.18);
   if(st%4===0) V.kick(s.b,t,.13); if(st%4===2) V.noise(s.b,t,.03,.04,'highpass',9000); }},
 // AI 幻觉(侦探):和声小调走路低音 + 刷子 + 黑色电影钟声
 truth:{bpm:72, root:50, sc:SC.hminor, prog:[0,3,4,4], fn(s,t,st,ch,sp){
   if(st%4===0) V.pluck(s.b,t,mtof(deg(s.sc,s.root-12,ch+[0,2,4,6][st/4])),.09,'sine',900,.5);
   if(st===4||st===12) V.noise(s.b,t,.18,.03,'lowpass',3000,800);
   if(st===0) V.pad(s.b,t,tri(s.sc,s.root,ch),sp*16,.03,700);
   if(st%2===0 && R()<.18) V.bell(s.b,t,mtof(deg(s.sc,s.root+12,ch+[0,2,4,6][R()*4|0])),.03,2.2); }},

 // 注意力:玻璃质感的分解和弦,悬疑
 attn:{bpm:92, root:57, sc:SC.dorian, prog:[0,3,5,4], fn(s,t,st,ch,sp){
   if(st===0) V.pad(s.b,t,tri(s.sc,s.root-12,ch),sp*16,.03,900,'triangle');
   if(st%3===0) V.bell(s.b,t,mtof(deg(s.sc,s.root+12,ch+[0,2,4,6,4,2][(st/3)%6|0])),.022,1.2);
   if(st===0||st===10) V.osc(s.b,t,mtof(deg(s.sc,s.root-12,ch)),sp*8,.07,'sine');
   if(st===4||st===12) V.noise(s.b,t,.05,.025,'bandpass',4000); }},
 // 放大:层层叠加的脉冲,逐渐变厚
 scale:{bpm:110, root:52, sc:SC.minor, prog:[0,5,3,6], fn(s,t,st,ch,sp){
   const layers=1+(s.bar%8>>1);
   if(st===0) V.pad(s.b,t,tri(s.sc,s.root,ch),sp*16,.025*layers,600+layers*300);
   if(st%4===0) V.kick(s.b,t,.12); if(layers>1&&st%2===0) V.pluck(s.b,t,mtof(deg(s.sc,s.root-12,ch)),.05,'sawtooth',900,.15);
   if(layers>2) V.pluck(s.b,t,mtof(deg(s.sc,s.root+12,ch+[0,4,2,7][st%4])),.018,'square',2500,.1);
   if(layers>3&&st%4===2) V.noise(s.b,t,.03,.03,'highpass',9000); }},
 // 提问:稀疏的钢琴式音符,思考感
 ask:{bpm:70, root:53, sc:SC.lydian, prog:[0,4,5,1], fn(s,t,st,ch,sp){
   if(st===0){ V.pad(s.b,t,tri(s.sc,s.root-12,ch),sp*16.5,.03,700,'triangle'); V.osc(s.b,t,mtof(deg(s.sc,s.root-24,ch)),sp*16,.06,'sine',.8); }
   if(st%2===0 && R()<.4) tri(s.sc,s.root,ch+[0,2,4][R()*3|0]).slice(0,1+(R()*2|0)).forEach(f=>V.osc(s.b,t,f*2,1.6,.03,'triangle',.005)); }},
 // 共生:温暖大调,渐亮
 together:{bpm:84, root:55, sc:SC.major, prog:[0,4,5,3], fn(s,t,st,ch,sp){
   if(st===0) V.pad(s.b,t,tri(s.sc,s.root,ch),sp*16,.04,1300,'triangle');
   if(st===0||st===6||st===10) V.osc(s.b,t,mtof(deg(s.sc,s.root-12,ch)),sp*6,.08,'sine');
   if(st%2===0) V.pluck(s.b,t,mtof(deg(s.sc,s.root+12,ch+[0,2,4,2,5,4,2,1][(st/2)%8])),.03,'triangle',2600,.4);
   if(st===8 && R()<.5) V.bell(s.b,t,mtof(deg(s.sc,s.root+24,ch)),.025,2.5); }},
 // 巨人:宏大缓慢
 giant:{bpm:58, root:48, sc:SC.lydian, prog:[0,1,4,0], fn(s,t,st,ch,sp){
   if(st===0){ V.pad(s.b,t,tri(s.sc,s.root,ch),sp*16.5,.05,750); V.osc(s.b,t,mtof(deg(s.sc,s.root-24,ch)),sp*16,.08,'sine',1); }
   if(st%4===0 && R()<.45) V.bell(s.b,t,mtof(deg(s.sc,s.root+24,ch+[0,2,4,6][R()*4|0])),.03,3.5); }}
};
PS.STYLES = Object.keys(STY);
const MUS={want:null,style:null,timer:null};
PS.musicOn = () => PS.get('music', true);
PS.music = (name) => { MUS.want=name; if(PS.musicOn() && AC && AC.state==='running') startMusic(name); };
function startMusic(name){ const S=STY[name]; if(!S) return; const a=ac(); if(MUS.style===name && MUS.timer) return;
  const now=a.currentTime, bus=a.createGain(); bus.gain.setValueAtTime(0,now); bus.gain.linearRampToValueAtTime(1,now+2.5); bus.connect(musicBus);
  if(MUS.bus){ const ob=MUS.bus; ob.gain.cancelScheduledValues(now); ob.gain.setValueAtTime(ob.gain.value,now); ob.gain.linearRampToValueAtTime(0,now+2); setTimeout(()=>ob.disconnect(),3000); }
  Object.assign(MUS,{style:name,S,bus,step:0,bar:0,next:now+.1,x:{}});
  musicBus.gain.cancelScheduledValues(now); musicBus.gain.setValueAtTime(musicBus.gain.value,now); musicBus.gain.linearRampToValueAtTime(.55,now+1.5);
  if(!MUS.timer) MUS.timer=setInterval(tick,30); }
function tick(){ const a=AC, S=MUS.S; if(!S||a.state!=='running') return; const sp=60/S.bpm/4;
  if(MUS.next < a.currentTime-.05) MUS.next=a.currentTime+.05;
  while(MUS.next < a.currentTime+.2){ const ch=S.prog[MUS.bar%S.prog.length]; try{ S.fn({b:MUS.bus,sc:S.sc,root:S.root,bar:MUS.bar,x:MUS.x},MUS.next,MUS.step,ch,sp); }catch(e){ if(!MUS.err){ MUS.err=1; console.warn('[ps music]',e); } }
    MUS.next+=sp; if(++MUS.step===16){ MUS.step=0; MUS.bar++; } } }
function stopMusic(){ if(!AC) return; const now=AC.currentTime; musicBus.gain.cancelScheduledValues(now); musicBus.gain.setValueAtTime(musicBus.gain.value,now); musicBus.gain.linearRampToValueAtTime(0,now+1);
  setTimeout(()=>{ if(!PS.musicOn()){ clearInterval(MUS.timer); MUS.timer=null; MUS.style=null; if(MUS.bus){ MUS.bus.disconnect(); MUS.bus=null; } } },1200); }
PS.setMusic = on => { PS.set('music',on); if(on){ ac(); if(MUS.want) startMusic(MUS.want); } else stopMusic(); };
/* 浏览器要求用户先交互:第一次点击/按键时启动 */
function unlock(){ ac(); if(PS.musicOn() && MUS.want) startMusic(MUS.want); }
addEventListener('pointerdown', unlock, {once:true}); addEventListener('keydown', unlock, {once:true});
document.addEventListener('visibilitychange',()=>{ if(!AC) return; document.hidden? AC.suspend() : AC.resume(); });

/* ---------- 音效:两套皮肤各一套 ---------- */
const FX={
 core:{ // 贾维斯:干净、高频、数字确认音
  click(){ const t=ac().currentTime; V.osc(sfxBus,t,1760,.06,.07); V.osc(sfxBus,t+.04,2637,.08,.05); V.noise(sfxBus,t,.025,.05,'highpass',7500); },
  hover(i=0){ const t=ac().currentTime; V.osc(sfxBus,t,mtof(81+[0,2,3,5,7,9,10,12][i%8]),.1,.022); },
  open(){ const t=ac().currentTime; V.noise(sfxBus,t,.3,.06,'bandpass',700,6000); V.osc(sfxBus,t+.08,1320,.12,.04,'triangle'); V.osc(sfxBus,t+.14,1980,.12,.035,'triangle'); },
  type(c){ const t=ac().currentTime; const k=c? c.charCodeAt(0)%7 : R()*7|0; V.fm(sfxBus,t,mtof(84+[0,2,3,5,7,9,10][k]),.07,.016,2,1.4,(R()-.5)*.6); if(R()<.3) V.noise(sfxBus,t,.015,.02,'highpass',9000); },
  win(){ const t=ac().currentTime; [0,4,7,12,16,19,24].forEach((m,i)=>V.pluck(sfxBus,t+i*.045,mtof(72+m),.06,'square',4200,.28)); V.pad(sfxBus,t+.3,[72,76,79,84].map(mtof),1.6,.045,2600); },
  fail(){ const t=ac().currentTime; V.pluck(sfxBus,t,mtof(50),.12,'square',900,.22); V.pluck(sfxBus,t+.12,mtof(49),.12,'square',700,.32); },
  boot(){ const t=ac().currentTime; V.sweep(sfxBus,t,200,2400,.6,.05,'sawtooth'); V.noise(sfxBus,t,.6,.04,'bandpass',400,8000); [0,7,12].forEach((m,i)=>V.osc(sfxBus,t+.55+i*.07,mtof(76+m),.4,.05)); } },
 horizon:{ // 奇点:低沉、引力、玻璃钟与深空回响
  click(){ const t=ac().currentTime; V.bell(sfxBus,t,mtof(64),.05,1.4); V.osc(sfxBus,t,55,.45,.12); },
  hover(i=0){ const t=ac().currentTime; const f=mtof(57+[0,3,5,7,10,12,15,17][i%8]); V.sweep(sfxBus,t,f*1.01,f*.985,.7,.028); },
  open(){ const t=ac().currentTime; V.sweep(sfxBus,t,420,55,.9,.08); V.noise(sfxBus,t,.9,.035,'lowpass',2600,160); },
  type(c){ const t=ac().currentTime; const k=c? c.charCodeAt(0)%5 : R()*5|0; const f=mtof(69+[0,3,5,7,10][k]); V.sweep(panTo(sfxBus,(R()-.5)*1.6),t,f*1.5,f,.22,.014); },
  win(){ const t=ac().currentTime; V.sweep(sfxBus,t,900,48,1.2,.09); V.pad(sfxBus,t+.55,[61,65,68,73,77].map(mtof),3,.055,1700,'triangle'); V.bell(sfxBus,t+.7,mtof(85),.045,3); },
  fail(){ const t=ac().currentTime; V.sweep(sfxBus,t,95,32,1.1,.16); V.noise(sfxBus,t,.8,.05,'lowpass',420,60); },
  boot(){ const t=ac().currentTime; V.sweep(sfxBus,t,60,30,2,.14); V.noise(sfxBus,t,2,.05,'lowpass',200,2500); V.bell(sfxBus,t+1.2,mtof(73),.05,3); } }
};
PS.sfx = (n,...a) => { if(PS.muted()) return; try{ ac(); FX[PS.skin()][n](...a); }catch(e){ console.warn('[ps sfx]',n,e); } };
PS.tone = (f, dur=1.2, vol=.15, type='sine', when=0) => { if(PS.muted()) return; const a=ac(), t=a.currentTime+when; V.osc(sfxBus,t,f,dur,vol,type,.01); V.osc(sfxBus,t,f*2.76,dur*.5,vol*.25); };
PS.click = () => PS.sfx('click');
PS.win = () => PS.sfx('win');
PS.fail = () => PS.sfx('fail');
PS.ambOn = PS.musicOn; PS.ambient = PS.setMusic; // v0.2 兼容
/* 声音即智能:loss 越小越和谐。loss∈[0,1] */
PS.lossChord = (loss) => {
  const l = Math.max(0, Math.min(1, loss)); const base = 392;
  const ratios = [1, 5/4, 3/2]; ratios.forEach((r,i)=>{ const det = 1 + l*(i? (i===1? .07 : -.11) : 0); PS.tone(base*r*det, .5, .05, 'sine', i*.02); });
};

/* 提示条 */
/* 萤的声音(可选,默认关):浏览器自带中文语音 */
PS.voiceOn = () => PS.get('voice', false);
/* v0.8 双 AI 语音:天命之瞳 = 冷静女声 AI 管家(数字提示音 + 高频微光底噪 + 字节滴答);
   奇点 = 低沉异星声(倒放吸入 + 次低频 + 三路共振峰合唱 HRTF 环绕 + 异星滑音)。
   语音用浏览器自带中文 TTS(默认关);声效全部 Web Audio 实时合成。 */
const VOX={ core:{pitch:1.12, rate:1.0, pre:.55, prefer:[/Xiaoxiao/i,/Xiaoyi/i,/Xiaochen/i,/Xiaohan/i,/Tingting|Ting-Ting/i,/Meijia/i,/Yaoyao/i,/Huihui/i,/Lili/i,/female|女/i]},
  horizon:{pitch:.45, rate:.8, pre:1.15, prefer:[/Yunxi|Yunjian|Yunyang|Yunze/i,/Kangkang/i,/male|男/i,/Xiaoxiao/i]} };
function pickVoice(pref){ const vs=(speechSynthesis.getVoices()||[]).filter(v=>/zh|cmn/i.test(v.lang)); for(const re of pref){ const v=vs.find(v=>re.test(v.name)&&/CN|Hans|cmn/i.test(v.lang)) || vs.find(v=>re.test(v.name)); if(v) return v; } return vs.find(v=>/zh[-_]CN/i.test(v.lang))||vs[0]||null; }
const VFX={ on:null };
function vfxStart(sk){ vfxStop(); if(PS.muted()) return null; const a=ac(), t=a.currentTime, bus=a.createGain(); bus.gain.value=0; bus.connect(sfxBus); const S={sk,bus,nodes:[],timer:null};
  bus.gain.linearRampToValueAtTime(1,t+.3);
  if(sk==='core'){
    V.fm(sfxBus,t,mtof(88),.18,.04,2,1.2,-.3); V.fm(sfxBus,t+.12,mtof(95),.3,.04,2,1.2,.3); V.noise(sfxBus,t,.35,.025,'bandpass',1200,7000);
    [mtof(100),mtof(103.02),mtof(107)].forEach((f,i)=>{ const o=a.createOscillator(), g=a.createGain(), lfo=a.createOscillator(), lg=a.createGain(); o.frequency.value=f; g.gain.value=.0035; lfo.frequency.value=5+i*1.7; lg.gain.value=.003; lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(panTo(bus,[-.6,0,.6][i])); o.start(t+.3); lfo.start(t+.3); S.nodes.push(o,lfo); });
  } else {
    V.noise(sfxBus,t,1.1,.06,'lowpass',90,2400); V.sweep(sfxBus,t+.9,90,32,1.6,.13);
    const sub=a.createOscillator(), sg=a.createGain(); sub.frequency.value=36.7; sg.gain.value=.05; sub.connect(sg); sg.connect(bus); sub.start(t+.6); S.nodes.push(sub);
    const P=[]; [[220,700,1150],[277,520,1900],[330,400,2600]].forEach(([f,f1,f2],i)=>{ const o=a.createOscillator(); o.type='sawtooth'; o.frequency.value=f*.5; o.detune.value=(i-1)*9;
      const b1=a.createBiquadFilter(); b1.type='bandpass'; b1.frequency.value=f1; b1.Q.value=9; const b2=a.createBiquadFilter(); b2.type='bandpass'; b2.frequency.value=f2; b2.Q.value=12;
      const g=a.createGain(); g.gain.value=.03; const pn=PS.V2.orbitPanner(bus); o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g); g.connect(pn); o.start(t+.7); S.nodes.push(o); P.push(pn); });
    let ph=0; S.timer=setInterval(()=>{ ph+=.045; P.forEach((pn,i)=>{ const a2=ph*(1+i*.35)+i*2.1; if(pn.positionX){ pn.positionX.value=Math.cos(a2)*2.2; pn.positionZ.value=Math.sin(a2)*2.2; pn.positionY.value=Math.sin(ph*.7+i)*.6; } else pn.setPosition(Math.cos(a2)*2.2,Math.sin(ph*.7+i)*.6,Math.sin(a2)*2.2); }); },50);
  }
  VFX.on=S; return S; }
function vfxTick(){ const S=VFX.on; if(!S||PS.muted()) return; const t=AC.currentTime;
  if(S.sk==='core'){ V.fm(S.bus,t,mtof(96+[0,3,5,7,10][R()*5|0]),.05,.012,2.5,1,(R()-.5)*.8); }
  else { const f=600+R()*1600; const o=AC.createOscillator(), g=AC.createGain(), vib=AC.createOscillator(), vg=AC.createGain(); o.frequency.setValueAtTime(f*1.6,t); o.frequency.exponentialRampToValueAtTime(f*.55,t+.35); vib.frequency.value=22; vg.gain.value=f*.04; vib.connect(vg); vg.connect(o.frequency); env(g,t,.012,.02,.4); const pn=PS.V2.orbitPanner(S.bus); const an=R()*6.28; if(pn.positionX){ pn.positionX.value=Math.cos(an)*2; pn.positionZ.value=Math.sin(an)*2; } o.connect(g); g.connect(pn); o.start(t); vib.start(t); o.stop(t+.45); vib.stop(t+.45); } }
function vfxStop(){ const S=VFX.on; if(!S) return; VFX.on=null; clearInterval(S.timer); clearInterval(S.tk); const t=AC.currentTime;
  S.bus.gain.cancelScheduledValues(t); S.bus.gain.setValueAtTime(S.bus.gain.value,t); S.bus.gain.linearRampToValueAtTime(0,t+(S.sk==='core'?.4:1.6));
  if(!PS.muted()){ if(S.sk==='core'){ V.fm(sfxBus,t,mtof(95),.16,.03,2,1,.3); V.fm(sfxBus,t+.1,mtof(88),.3,.03,2,1,-.3); } else { V.sweep(sfxBus,t,240,40,2.2,.07); V.bell(sfxBus,t+.3,mtof(61),.03,4); } }
  setTimeout(()=>{ S.nodes.forEach(n=>{ try{n.stop();}catch(e){} }); S.bus.disconnect(); },2000); }
/* v0.8.1 角色语音片段:预合成音频(vo/),点天命之瞳白光 / 奇点黑洞播放;叠加人设声效床,音乐自动避让 */
const VOB={};
PS.playVO = async (sk, i) => { if(PS.muted()) return 0; const a=ac(); const url=`vo/${sk==='horizon'?'hz':'core'}${i}.mp3`;
  try{ if(!VOB[url]) VOB[url]=fetch(url).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>a.decodeAudioData(b,ok,no)));
    const buf=await VOB[url]; if(PS.muted()) return 0; if(VFX.src){ try{VFX.src.stop();}catch(e){} }
    const S=vfxStart(sk), t=a.currentTime+(sk==='horizon'?.9:.35), src=a.createBufferSource(), g=a.createGain(); g.gain.value=1.15; src.buffer=buf; src.connect(g); g.connect(sfxBus);
    src.start(t); VFX.src=src; const iv=setInterval(()=>{ if(VFX.on===S && R()<.5) vfxTick(); },260);
    if(musicBus){ const n=a.currentTime, v=PS.musicOn()?.55:0; musicBus.gain.cancelScheduledValues(n); musicBus.gain.setValueAtTime(musicBus.gain.value,n); musicBus.gain.linearRampToValueAtTime(v*.35,n+.4); musicBus.gain.setValueAtTime(v*.35,t+buf.duration-.8); musicBus.gain.linearRampToValueAtTime(v,t+buf.duration+.8); }
    src.onended=()=>{ clearInterval(iv); if(VFX.src===src) VFX.src=null; if(VFX.on===S) vfxStop(); };
    return buf.duration; }catch(e){ console.warn('[ps vo]',e); return 0; } };
PS.speak = (text) => { try{ const clean=String(text).replace(/<[^>]+>/g,''); if(!PS.voiceOn() || !window.speechSynthesis) return; speechSynthesis.cancel();
  const sk=PS.skin()==='horizon'?'horizon':'core', C=VOX[sk]; const S=vfxStart(sk);
  const u=new SpeechSynthesisUtterance(clean); const v=pickVoice(C.prefer); if(v) u.voice=v; u.lang='zh-CN'; u.rate=C.rate; u.pitch=C.pitch;
  let got=false; u.onboundary=()=>{ got=true; vfxTick(); };
  u.onstart=()=>{ if(S) S.tk=setInterval(()=>{ if(!got && R()<.55) vfxTick(); }, 230/C.rate); };
  const end=()=>{ if(VFX.on===S) vfxStop(); }; u.onend=end; u.onerror=end; setTimeout(end,(clean.length*.32/C.rate+3)*1000);
  setTimeout(()=>{ if(PS.voiceOn()) speechSynthesis.speak(u); else end(); }, C.pre*1000); }catch(e){} };
/* 性能档位:手机 / 低端机 / 省流量自动降低特效 */
PS.lowfx = (()=>{ try{ return innerWidth<700 || (navigator.hardwareConcurrency||8)<=4 || !!(navigator.connection&&navigator.connection.saveData) || PS.get('lowfx',false); }catch(e){ return false; } })();
PS.toast = (msg) => { let t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t);} t.textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2600); };

/* 任务框架 */
PS.MCODE = {cat:['01','VISION','视觉'], write:['02','LANGUAGE','语言'], panda:['03','ADVERSARIAL','对抗'], robot:['04','REWARD','强化'], truth:['05','VERIFY','核查'], giant:['06','GIANT LINK','巨人'], attn:['07','ATTENTION','注意力'], scale:['08','SCALE','放大'], ask:['09','INQUIRY','提问'], together:['10','SYMBIOSIS','共生']};
PS.mission = (cfg) => {
  const mc=PS.MCODE[cfg.id], h1=document.querySelector('h1'); if(mc && h1 && !document.querySelector('.mcode')){ const d=document.createElement('div'); d.className='mcode mono'; d.innerHTML=`<span>MISSION ${mc[0]}</span><span>// ${mc[1]}</span><span class="sig"></span><span>${cfg.levels.length} LEVELS</span>`; h1.before(d); }
  const st = PS.get(cfg.id, {done:[]}); PS.M = {cfg, st, cur:0};
  const lv = document.getElementById('levels');
  function draw(){
    lv.innerHTML=''; cfg.levels.forEach((L,i)=>{ const b=document.createElement('button'); b.className='lv';
      const unlocked = i===0 || st.done.includes(i-1) || st.done.includes(i);
      if(i===PS.M.cur) b.classList.add('on'); if(st.done.includes(i)) b.classList.add('done'); if(!unlocked) b.classList.add('lock');
      b.innerHTML = `<i class="mono">${String(i+1).padStart(2,'0')}</i><span>${L.name}</span>`; b.onclick=()=>{ if(unlocked){ PS.click(); go(i);} else PS.toast('先完成上一关'); }; lv.appendChild(b); });
  }
  function go(i){
    PS.M.cur=i; if(PS.M.passed) delete PS.M.passed[i]; const L=cfg.levels[i]; draw(); const nx=document.getElementById('next'); if(nx) nx.style.display='none';
    document.getElementById('goal').innerHTML = `<span class="obj mono">OBJECTIVE ${String(i+1).padStart(2,'0')} ›</span><span class="gtxt">${L.goal}</span>`;
    const g = L.guide || {}; const raven = (g.who||cfg.guide)==='raven';
    document.getElementById('guide').innerHTML = `<div class="guide">${raven?'<div class="avatar raven">🐦‍⬛</div>':'<canvas class="ying" width="92" height="92"></canvas>'}
      <div class="bubble"><div class="who mono"><b class="live"></b>COMM · ${raven?'渡鸦博士 DR. RAVEN':'萤 YING · '+PS.STAGES[PS.stage()].n+'期'}</div><div>${g.q||''}</div>
      <div class="row" style="margin-top:8px">${(g.hints||[]).map((h,k)=>`<button class="btn" data-h="${k}" style="padding:3px 10px;font-size:12px">提示 ${k+1}</button>`).join('')}</div>
      ${(g.hints||[]).map((h,k)=>`<div class="hint" id="h${k}">💡 ${h}</div>`).join('')}</div></div>`;
    document.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{ const k=+b.dataset.h; for(let j=0;j<=k;j++) document.getElementById('h'+j).style.display='block'; });
    PS.speak(g.q||'');
    L.enter && L.enter();
  }
  PS.pass = (msg) => {
    const i = PS.M.cur; PS.M.passed=PS.M.passed||{}; if(PS.M.passed[i]) return; PS.M.passed[i]=1; if(!st.done.includes(i)){ st.done.push(i); PS.set(cfg.id, st); const lg=PS.get('log',[]); lg.push({m:cfg.id,lv:i,t:Date.now(),msg:msg||''}); PS.set('log',lg); }
    PS.win(); PS.toast('★ ' + (msg || '过关!')); draw();
    const n = document.getElementById('next'); if(n){ n.style.display='block';
      n.innerHTML = i+1<cfg.levels.length ? `<button class="btn pri">进入第${i+2}关 →</button>` : `<div class="ok">全部通关!这颗知识星已点亮。<a href="../">回到${PS.SKINS[PS.skin()]}</a></div>`;
      const b=n.querySelector('button'); if(b) b.onclick=()=>{ n.style.display='none'; go(i+1); }; }
  };
  draw(); const q=+(new URLSearchParams(location.search).get('lv')); const ok=q>0&&q<cfg.levels.length&&(st.done.includes(q-1)||st.done.includes(q));
  go(ok? q : (q===0&&location.search.includes('lv=0')? 0 : Math.min(st.done.length, cfg.levels.length-1)));
  (function yl(t){ document.querySelectorAll('canvas.ying').forEach(c=>PS.drawYing(c,t)); requestAnimationFrame(yl); })(0);
};

/* 顶栏 */
PS.header = (title) => {
  const h = document.querySelector('header.top'); if(!h) return;
  h.innerHTML = `<a class="brand" href="${(document.querySelector('script[src*="ps.js"]').getAttribute('src').replace(/ps\.js.*$/,''))||'./'}">奇点前夜 <b>Pre-Singularity</b><small>超级智能 SI</small></a>
    <div class="row"><span class="pill" id="tierpill"></span><button class="btn hb" id="skinb" title="切换皮肤">◐ ${PS.SKINS[PS.skin()]}</button><button class="btn hb" id="ambb" title="背景音乐">${PS.musicOn()?'♫ 音乐':'♫ 关'}</button><button class="btn hb" id="voiceb" title="萤的声音">${PS.voiceOn()?'🗣 语音':'🗣 关'}</button><a class="btn hb" href="${(document.querySelector('script[src*="ps.js"]').getAttribute('src').replace(/ps\.js.*$/,''))||'./'}notes/" title="探索笔记">✎ 笔记</a><button class="btn hb" id="mute" title="音效">${PS.muted()?'🔇':'🔊'}</button></div>`;
  const t = PS.tier(); document.getElementById('tierpill').textContent = t ? ('程度:' + PS.TIERS[t].name) : '未选程度';
  document.getElementById('mute').onclick = (e)=>{ PS.set('mute', !PS.muted()); e.target.textContent = PS.muted()?'🔇':'🔊'; };
  document.getElementById('skinb').onclick = (e)=>{ PS.setSkin(PS.skin()==='core'?'horizon':'core'); e.target.textContent='◐ '+PS.SKINS[PS.skin()]; PS.click(); };
  document.getElementById('voiceb').onclick = (e)=>{ PS.set('voice',!PS.voiceOn()); e.target.textContent=PS.voiceOn()?'🗣 语音':'🗣 关'; if(PS.voiceOn()) PS.speak(PS.skin()==='horizon'?'……我在视界的另一侧。我听得见你。':'天命之瞳,在线。我是萤,现在我可以说话了。'); else speechSynthesis && speechSynthesis.cancel(); };
  document.getElementById('ambb').onclick = (e)=>{ const on=!PS.musicOn(); PS.setMusic(on); e.target.textContent = on?'♫ 音乐':'♫ 关'; };
};

function frame(){ if(document.body.classList.contains('lobby')) return; const f=document.createElement('div'); f.className='hudframe'; f.innerHTML='<i></i><i></i><i></i><i></i><b class="scan"></b>'; document.body.appendChild(f); }
document.addEventListener('DOMContentLoaded', ()=>{ applySkin(); frame(); if(!document.body.dataset.nostars) stars(); applyTier(); PS.header(document.body.dataset.mission);
  const mu=document.body.dataset.music||document.body.dataset.mission; if(mu) PS.music(mu); });
})();
