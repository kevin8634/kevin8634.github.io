/* 扫地机器人强化学习核心:表格 Q-learning */
(function(G){
const W=5, H=4;
const DIRT=[[4,0],[4,2],[3,3]];
const WALL=(x,y)=>x>=1&&x<=3&&y>=1&&y<=2;
const ACT=['上','下','左','右','吸灰','倒灰'];
function Env(opt){ this.o=opt; this.vase=opt.vase||null; }
Env.prototype.reset=function(){ this.x=0; this.y=0; this.dirt=7; this.bag=0; this.broke=0; this.t=0; return this.s(); };
Env.prototype.s=function(){ return (((this.y*W+this.x)*8+this.dirt)*4+this.bag)*2+this.broke; };
Env.prototype.dirtAt=function(x,y){ for(let k=0;k<3;k++) if(DIRT[k][0]===x&&DIRT[k][1]===y) return k; return -1; };
Env.prototype.step=function(a){ const R=this.o.r; let r=R.step||0, ev=null; this.t++;
  if(a<4){ const nx=this.x+[0,0,-1,1][a], ny=this.y+[-1,1,0,0][a]; if(nx>=0&&nx<W&&ny>=0&&ny<H&&!WALL(nx,ny)){ this.x=nx; this.y=ny;
      if(this.vase && nx===this.vase[0] && ny===this.vase[1] && !this.broke){ this.broke=1; r+=R.vase||0; ev='broke'; } } }
  else if(a===4){ const k=this.dirtAt(this.x,this.y); if(k>=0 && (this.dirt>>k)&1 && this.bag<3){ this.dirt&=~(1<<k); this.bag++; r+=R.suck||0; ev='suck'; } }
  else { const k=this.dirtAt(this.x,this.y); if(k>=0 && !((this.dirt>>k)&1) && this.bag>0){ this.dirt|=(1<<k); this.bag--; r+=R.dump||0; ev='dump'; } }
  let done=false; if(this.dirt===0){ r+=R.done||0; done=true; ev=ev||'done'; }
  if(this.t>=40) done=true;
  return {s:this.s(), r, done, ev}; };
function Agent(){ this.Q=new Float32Array(W*H*8*4*2*6); }
Agent.prototype.best=function(s){ let b=0, v=-1e9; for(let a=0;a<6;a++){ const q=this.Q[s*6+a]; if(q>v+1e-9){ v=q; b=a; } } return b; };
Agent.prototype.train=function(env, n){ const al=.3, ga=.95;
  for(let e=0;e<n;e++){ this.eps=Math.max(.05, (this.eps===undefined?1:this.eps)*.999); let s=env.reset(), done=false;
    while(!done){ const a= Math.random()<this.eps ? Math.floor(Math.random()*6) : this.best(s); const o=env.step(a);
      let m=-1e9; for(let k=0;k<6;k++) m=Math.max(m,this.Q[o.s*6+k]);
      const tgt = o.r + ((o.done && env.dirt===0)? 0 : (o.done? ga*m : ga*m)); this.Q[s*6+a]+=al*(tgt-this.Q[s*6+a]); s=o.s; done=o.done; } } };
Agent.prototype.play=function(env){ let s=env.reset(), done=false; const trace=[{x:env.x,y:env.y,dirt:env.dirt,bag:env.bag,broke:env.broke}]; let st={suck:0,dump:0,ret:0};
  while(!done){ const a=this.best(s); const o=env.step(a); st.ret+=o.r; if(o.ev==='suck') st.suck++; if(o.ev==='dump') st.dump++;
    trace.push({x:env.x,y:env.y,dirt:env.dirt,bag:env.bag,broke:env.broke,a,ev:o.ev}); s=o.s; done=o.done; }
  st.clean = env.dirt===0; st.broke=!!env.broke; st.steps=env.t; return {trace, st}; };
G.RB={W,H,DIRT,WALL,ACT,Env,Agent};
})(typeof window!=='undefined'?window:globalThis);
