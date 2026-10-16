/* 奇点前夜 Pre-Singularity · 公共层 ps.js v0.3
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
 {n:'智能是什么', k:[{t:'SI 是什么',m:'intro',d:'超级智能:几乎在所有领域都超过最聪明人类的智能。它还没有出现。'},{t:'图灵测试'},{t:'专用与通用'}]},
 {n:'机器怎么学', k:[{t:'特征',m:'cat',lv:0,d:'选对线索,机器才分得清。'},{t:'梯度下降',m:'cat',lv:1,d:'每错一次,往对的方向挪一点。'},{t:'过拟合',m:'cat',lv:3,d:'背答案不等于学会规律。'},{t:'数据的力量'}]},
 {n:'神经网络', k:[{t:'隐藏层',m:'cat',lv:2,d:'多一层神经元,边界就能弯曲。'},{t:'模型在看哪里',m:'panda',lv:0,d:'它不懂"眼圈",只给每个像素打分。'},{t:'卷积'}]},
 {n:'语言模型', k:[{t:'预测下一个字',m:'write',lv:0,d:'写作文的秘密:一个字一个字地猜。'},{t:'温度',m:'write',lv:1,d:'稳和新之间的旋钮。'},{t:'上下文',m:'write',lv:2,d:'记得越多,越通顺。'},{t:'注意力机制'},{t:'规模与涌现'}]},
 {n:'强化学习', k:[{t:'奖励',m:'robot',lv:0,d:'只说做什么得分,它自己找办法。'},{t:'探索与利用'}]},
 {n:'AI 的局限', k:[{t:'幻觉的种子',m:'write',lv:3,d:'通顺不等于真实。'},{t:'找出编造',m:'truth',lv:0,d:'一本正经的错,最难发现。'},{t:'对抗样本',m:'panda',lv:1,d:'人眼看不见的噪点,骗过了模型。'}]},
 {n:'对齐与安全', k:[{t:'对齐',m:'robot',lv:1,d:'把奖励对准真正想要的结果。'},{t:'副作用',m:'robot',lv:2,d:'规则没写的,AI 就不在乎。'},{t:'鲁棒性',m:'panda',lv:2,d:'更结实,但永远不完美。'},{t:'可解释性'}]},
 {n:'人机共处', k:[{t:'查出处',m:'truth',lv:1,d:'越像真的,越要查。'},{t:'核查',m:'truth',lv:2,d:'原始出处比任何转述都可靠。'},{t:'人机分工'},{t:'不可能任务'}]}
];
PS.MISSIONS = {cat:{q:'让 AI 认出一只猫',n:4}, write:{q:'AI 是怎么"写作文"的?',n:4}, panda:{q:'怎样让 AI 把熊猫认成长臂猿?',n:3}, robot:{q:'为什么扫地机器人会"偷懒"?',n:3}, truth:{q:'这段话是 AI 写的吗?',n:3}};
PS.ORDER = { first:['truth','write','cat','robot','panda'], chat:['write','truth','cat','panda','robot'], work:['truth','robot','write','cat','panda'], geek:['cat','panda','write','robot','truth'] };
PS.done = m => m==='intro' ? (PS.get('intro',0)?[0]:[]) : (PS.get(m,{done:[]}).done||[]);
PS.nodeState = k => { if(!k.m) return 'future'; if(k.m==='intro') return PS.get('intro',0)?'lit':'open';
  const d=PS.done(k.m); if(d.includes(k.lv)) return 'lit'; return (k.lv===0||d.includes(k.lv-1))?'open':'lock'; };
PS.total = () => Object.keys(PS.MISSIONS).reduce((s,m)=>s+PS.done(m).length,0);
PS.TOTAL = 17;
/* 萤的成长:按点亮的神经元数 */
PS.STAGES = [{n:'光点',at:0},{n:'萤火',at:4},{n:'星核',at:9},{n:'黎明',at:14}];
PS.stage = () => { const t=PS.total(); let s=0; PS.STAGES.forEach((x,i)=>{ if(t>=x.at) s=i; }); return s; };
/* 皮肤:core 神经核(默认)/ horizon 奇点视界 */
PS.SKINS = {core:'神经核', horizon:'奇点视界'};
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

/* ---------- 生成式音乐:每个场景一种风格 ---------- */
const SC={dorian:[0,2,3,5,7,9,10], minor:[0,2,3,5,7,8,10], major:[0,2,4,5,7,9,11], lydian:[0,2,4,6,7,9,11], phryg:[0,1,3,5,7,8,10], hminor:[0,2,3,5,7,8,11]};
const deg=(sc,root,d)=>{ const n=sc.length; return root+sc[((d%n)+n)%n]+12*Math.floor(d/n); };
const tri=(sc,root,d)=>[0,2,4].map(k=>mtof(deg(sc,root,d+k)));
const R=Math.random;
const STY={
 // 贾维斯神经核:清亮数字琶音 + 脉冲低音 + 细碎电子 hi-hat
 core:{bpm:96, root:50, sc:SC.dorian, prog:[0,5,2,6], fn(s,t,st,ch,sp){
   if(st===0){ V.pad(s.b,t,tri(s.sc,s.root,ch),sp*16,.035,1200); V.osc(s.b,t,mtof(deg(s.sc,s.root-24,ch)),sp*16,.07,'sine',.4); }
   const A=[0,2,4,7,9,7,4,2]; if(st%2===0) V.pluck(s.b,t,mtof(deg(s.sc,s.root+12,ch+A[(st/2)%8])),.028,'square',1600+800*Math.sin(t/3),.22);
   if(st%4===2) V.noise(s.b,t,.035,.035,'highpass',8500);
   if(st===0||st===10) V.kick(s.b,t,.13);
   if(st%8===4 && R()<.35) V.bell(s.b,t,mtof(deg(s.sc,s.root+24,ch+[0,2,4][R()*3|0])),.025,1.6); }},
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
  Object.assign(MUS,{style:name,S,bus,step:0,bar:0,next:now+.1});
  musicBus.gain.cancelScheduledValues(now); musicBus.gain.setValueAtTime(musicBus.gain.value,now); musicBus.gain.linearRampToValueAtTime(.55,now+1.5);
  if(!MUS.timer) MUS.timer=setInterval(tick,30); }
function tick(){ const a=AC, S=MUS.S; if(!S||a.state!=='running') return; const sp=60/S.bpm/4;
  if(MUS.next < a.currentTime-.05) MUS.next=a.currentTime+.05;
  while(MUS.next < a.currentTime+.2){ const ch=S.prog[MUS.bar%S.prog.length]; try{ S.fn({b:MUS.bus,sc:S.sc,root:S.root,bar:MUS.bar},MUS.next,MUS.step,ch,sp); }catch(e){}
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
  type(){ const t=ac().currentTime; V.osc(sfxBus,t,2400+R()*1200,.03,.012,'square'); },
  win(){ const t=ac().currentTime; [0,4,7,12,16,19,24].forEach((m,i)=>V.pluck(sfxBus,t+i*.045,mtof(72+m),.06,'square',4200,.28)); V.pad(sfxBus,t+.3,[72,76,79,84].map(mtof),1.6,.045,2600); },
  fail(){ const t=ac().currentTime; V.pluck(sfxBus,t,mtof(50),.12,'square',900,.22); V.pluck(sfxBus,t+.12,mtof(49),.12,'square',700,.32); },
  boot(){ const t=ac().currentTime; V.sweep(sfxBus,t,200,2400,.6,.05,'sawtooth'); V.noise(sfxBus,t,.6,.04,'bandpass',400,8000); [0,7,12].forEach((m,i)=>V.osc(sfxBus,t+.55+i*.07,mtof(76+m),.4,.05)); } },
 horizon:{ // 奇点:低沉、引力、玻璃钟与深空回响
  click(){ const t=ac().currentTime; V.bell(sfxBus,t,mtof(64),.05,1.4); V.osc(sfxBus,t,55,.45,.12); },
  hover(i=0){ const t=ac().currentTime; const f=mtof(57+[0,3,5,7,10,12,15,17][i%8]); V.sweep(sfxBus,t,f*1.01,f*.985,.7,.028); },
  open(){ const t=ac().currentTime; V.sweep(sfxBus,t,420,55,.9,.08); V.noise(sfxBus,t,.9,.035,'lowpass',2600,160); },
  type(){ const t=ac().currentTime; V.osc(sfxBus,t,mtof(76+[0,3,7,10][R()*4|0]),.25,.01); },
  win(){ const t=ac().currentTime; V.sweep(sfxBus,t,900,48,1.2,.09); V.pad(sfxBus,t+.55,[61,65,68,73,77].map(mtof),3,.055,1700,'triangle'); V.bell(sfxBus,t+.7,mtof(85),.045,3); },
  fail(){ const t=ac().currentTime; V.sweep(sfxBus,t,95,32,1.1,.16); V.noise(sfxBus,t,.8,.05,'lowpass',420,60); },
  boot(){ const t=ac().currentTime; V.sweep(sfxBus,t,60,30,2,.14); V.noise(sfxBus,t,2,.05,'lowpass',200,2500); V.bell(sfxBus,t+1.2,mtof(73),.05,3); } }
};
PS.sfx = (n,...a) => { if(PS.muted()) return; try{ ac(); FX[PS.skin()][n](...a); }catch(e){} };
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
PS.toast = (msg) => { let t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t);} t.textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2600); };

/* 任务框架 */
PS.MCODE = {cat:['01','VISION','视觉'], write:['02','LANGUAGE','语言'], panda:['03','ADVERSARIAL','对抗'], robot:['04','REWARD','强化'], truth:['05','VERIFY','核查'], giant:['06','GIANT LINK','巨人']};
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
    L.enter && L.enter();
  }
  PS.pass = (msg) => {
    const i = PS.M.cur; PS.M.passed=PS.M.passed||{}; if(PS.M.passed[i]) return; PS.M.passed[i]=1; if(!st.done.includes(i)){ st.done.push(i); PS.set(cfg.id, st); }
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
    <div class="row"><span class="pill" id="tierpill"></span><button class="btn hb" id="skinb" title="切换皮肤">◐ ${PS.SKINS[PS.skin()]}</button><button class="btn hb" id="ambb" title="背景音乐">${PS.musicOn()?'♫ 音乐':'♫ 关'}</button><button class="btn hb" id="mute" title="音效">${PS.muted()?'🔇':'🔊'}</button></div>`;
  const t = PS.tier(); document.getElementById('tierpill').textContent = t ? ('程度:' + PS.TIERS[t].name) : '未选程度';
  document.getElementById('mute').onclick = (e)=>{ PS.set('mute', !PS.muted()); e.target.textContent = PS.muted()?'🔇':'🔊'; };
  document.getElementById('skinb').onclick = (e)=>{ PS.setSkin(PS.skin()==='core'?'horizon':'core'); e.target.textContent='◐ '+PS.SKINS[PS.skin()]; PS.click(); };
  document.getElementById('ambb').onclick = (e)=>{ const on=!PS.musicOn(); PS.setMusic(on); e.target.textContent = on?'♫ 音乐':'♫ 关'; };
};

function frame(){ if(document.body.classList.contains('lobby')) return; const f=document.createElement('div'); f.className='hudframe'; f.innerHTML='<i></i><i></i><i></i><i></i><b class="scan"></b>'; document.body.appendChild(f); }
document.addEventListener('DOMContentLoaded', ()=>{ applySkin(); frame(); if(!document.body.dataset.nostars) stars(); applyTier(); PS.header(document.body.dataset.mission);
  const mu=document.body.dataset.music||document.body.dataset.mission; if(mu) PS.music(mu); });
})();
