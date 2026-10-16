/* 奇点前夜 Pre-Singularity · 公共层 ps.js v0.1
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
    document.getElementById('guide').innerHTML = `<div class="guide"><div class="avatar ${raven?'raven':''}">${raven?'🐦‍⬛':'✨'}</div>
      <div class="bubble"><div class="who">${raven?'渡鸦博士':'萤 · 会长大的 AI'}</div><div>${g.q||''}</div>
      <div class="row" style="margin-top:8px">${(g.hints||[]).map((h,k)=>`<button class="btn" data-h="${k}" style="padding:3px 10px;font-size:12px">提示 ${k+1}</button>`).join('')}</div>
      ${(g.hints||[]).map((h,k)=>`<div class="hint" id="h${k}">💡 ${h}</div>`).join('')}</div></div>`;
    document.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{ const k=+b.dataset.h; for(let j=0;j<=k;j++) document.getElementById('h'+j).style.display='block'; });
    L.enter && L.enter();
  }
  PS.pass = (msg) => {
    const i = PS.M.cur; PS.M.passed=PS.M.passed||{}; if(PS.M.passed[i]) return; PS.M.passed[i]=1; if(!st.done.includes(i)){ st.done.push(i); PS.set(cfg.id, st); }
    PS.win(); PS.toast('★ ' + (msg || '过关!')); draw();
    const n = document.getElementById('next'); if(n){ n.style.display='block';
      n.innerHTML = i+1<cfg.levels.length ? `<button class="btn pri">进入第${i+2}关 →</button>` : `<div class="ok">全部通关!这颗知识星已点亮。<a href="../">回到黎明线</a></div>`;
      const b=n.querySelector('button'); if(b) b.onclick=()=>{ n.style.display='none'; go(i+1); }; }
  };
  draw(); go(Math.min(st.done.length, cfg.levels.length-1));
};

/* 顶栏 */
PS.header = (title) => {
  const h = document.querySelector('header.top'); if(!h) return;
  h.innerHTML = `<a class="brand" href="${(document.querySelector('script[src$="ps.js"]').getAttribute('src').replace('ps.js',''))||'./'}">奇点前夜 <b>Pre-Singularity</b><small>超级智能 SI</small></a>
    <div class="row"><span class="pill" id="tierpill"></span><button class="btn" id="mute" style="padding:4px 10px">${PS.muted()?'🔇':'🔊'}</button></div>`;
  const t = PS.tier(); document.getElementById('tierpill').textContent = t ? ('程度:' + PS.TIERS[t].name) : '未选程度';
  document.getElementById('mute').onclick = (e)=>{ PS.set('mute', !PS.muted()); e.target.textContent = PS.muted()?'🔇':'🔊'; };
};

document.addEventListener('DOMContentLoaded', ()=>{ stars(); applyTier(); PS.header(document.body.dataset.mission); });
})();
