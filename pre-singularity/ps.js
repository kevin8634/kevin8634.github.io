/* 奇点前夜 Pre-Singularity · 公共层 ps.js v0.2
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

/* 声音:Web Audio 实时合成,星空感玻璃音色 */
let AC=null, master=null;
PS.muted = () => PS.get('mute', false);
function ac(){ if(!AC){ AC = new (window.AudioContext||window.webkitAudioContext)(); master = AC.createGain(); master.gain.value=.5;
  const d = AC.createDelay(1.5); d.delayTime.value=.33; const fb = AC.createGain(); fb.gain.value=.35; const wet=AC.createGain(); wet.gain.value=.35;
  master.connect(AC.destination); master.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(AC.destination);} if(AC.state==='suspended') AC.resume(); return AC; }
PS.tone = (f, dur=1.2, vol=.15, type='sine', when=0) => {
  if(PS.muted()) return; const a=ac(), t=a.currentTime+when;
  const o=a.createOscillator(), g=a.createGain(); o.type=type; o.frequency.value=f;
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+.05);
  const o2=a.createOscillator(), g2=a.createGain(); o2.frequency.value=f*2.76; g2.gain.setValueAtTime(vol*.25,t); g2.gain.exponentialRampToValueAtTime(.0001,t+dur*.5);
  o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t+dur);
};
/* 专注音:低频星空长音 */
let amb=null;
PS.ambOn = () => PS.get('amb', false);
PS.ambient = (on) => { PS.set('amb', on); if(on && !amb){ const a=ac(); const g=a.createGain(); g.gain.value=0; g.gain.linearRampToValueAtTime(.05,a.currentTime+3);
    const lp=a.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=600; const lfo=a.createOscillator(), lg=a.createGain(); lfo.frequency.value=.05; lg.gain.value=250; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    const os=[110,164.81,220.5,329.6].map((f,i)=>{ const o=a.createOscillator(); o.type=i%2?'triangle':'sine'; o.frequency.value=f; o.detune.value=(i-1.5)*4; o.connect(lp); o.start(); return o; });
    lp.connect(g); g.connect(master); amb={g,os,lfo}; }
  else if(!on && amb){ const a=ac(); amb.g.gain.linearRampToValueAtTime(0,a.currentTime+1.5); const k=amb; setTimeout(()=>{ k.os.forEach(o=>o.stop()); k.lfo.stop(); },1700); amb=null; } };
PS.click = () => PS.tone(1320,.25,.06);
PS.win = () => [523.25,659.25,783.99,1046.5].forEach((f,i)=>PS.tone(f,1.6,.12,'sine',i*.09));
PS.fail = () => { PS.tone(220,.6,.08,'triangle'); PS.tone(233,.6,.08,'triangle'); };
/* 声音即智能:loss 越小越和谐。loss∈[0,1] */
PS.lossChord = (loss) => {
  const l = Math.max(0, Math.min(1, loss)); const base = 392;
  const ratios = [1, 5/4, 3/2]; ratios.forEach((r,i)=>{ const det = 1 + l*(i? (i===1? .07 : -.11) : 0); PS.tone(base*r*det, .5, .05, 'sine', i*.02); });
};

/* 提示条 */
PS.toast = (msg) => { let t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t);} t.textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2600); };

/* 任务框架 */
PS.mission = (cfg) => {
  const st = PS.get(cfg.id, {done:[]}); PS.M = {cfg, st, cur:0};
  const lv = document.getElementById('levels');
  function draw(){
    lv.innerHTML=''; cfg.levels.forEach((L,i)=>{ const b=document.createElement('button'); b.className='lv';
      const unlocked = i===0 || st.done.includes(i-1) || st.done.includes(i);
      if(i===PS.M.cur) b.classList.add('on'); if(st.done.includes(i)) b.classList.add('done'); if(!unlocked) b.classList.add('lock');
      b.textContent = `第${i+1}关 · ${L.name}`; b.onclick=()=>{ if(unlocked){ PS.click(); go(i);} else PS.toast('先完成上一关'); }; lv.appendChild(b); });
  }
  function go(i){
    PS.M.cur=i; if(PS.M.passed) delete PS.M.passed[i]; const L=cfg.levels[i]; draw(); const nx=document.getElementById('next'); if(nx) nx.style.display='none';
    document.getElementById('goal').innerHTML = '🎯 ' + L.goal;
    const g = L.guide || {}; const raven = (g.who||cfg.guide)==='raven';
    document.getElementById('guide').innerHTML = `<div class="guide">${raven?'<div class="avatar raven">🐦‍⬛</div>':'<canvas class="ying" width="92" height="92"></canvas>'}
      <div class="bubble"><div class="who">${raven?'渡鸦博士':'萤 · '+PS.STAGES[PS.stage()].n+'期'}</div><div>${g.q||''}</div>
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
    <div class="row"><span class="pill" id="tierpill"></span><button class="btn hb" id="skinb" title="切换皮肤">◐ ${PS.SKINS[PS.skin()]}</button><button class="btn hb" id="ambb" title="专注音">${PS.ambOn()?'🎧 专注音开':'🎧 专注音'}</button><button class="btn hb" id="mute" title="音效">${PS.muted()?'🔇':'🔊'}</button></div>`;
  const t = PS.tier(); document.getElementById('tierpill').textContent = t ? ('程度:' + PS.TIERS[t].name) : '未选程度';
  document.getElementById('mute').onclick = (e)=>{ PS.set('mute', !PS.muted()); e.target.textContent = PS.muted()?'🔇':'🔊'; };
  document.getElementById('skinb').onclick = (e)=>{ PS.setSkin(PS.skin()==='core'?'horizon':'core'); e.target.textContent='◐ '+PS.SKINS[PS.skin()]; PS.click(); };
  document.getElementById('ambb').onclick = (e)=>{ const on=!PS.ambOn(); PS.ambient(on); e.target.textContent = on?'🎧 专注音开':'🎧 专注音'; };
};

document.addEventListener('DOMContentLoaded', ()=>{ applySkin(); if(!document.body.dataset.nostars) stars(); applyTier(); PS.header(document.body.dataset.mission);
  if(PS.ambOn()){ const go=()=>{ PS.set('amb',false); PS.ambient(true); removeEventListener('pointerdown',go); }; addEventListener('pointerdown',go); } });
})();
