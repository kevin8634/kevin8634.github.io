/* 元素工坊 Element Forge · battery 任务 3D 玩法 ef-volt3d.js v0.7
   「怎样造一块会发电的电池?」:L0 柠檬电池(3D 水果电池台:柠檬、两片金属、串联导线、电压表、红色 LED)。
   状态与判定由页面里的 EF.BT.lemon 控制器负责(与平面版共用);低档或出错时回落 battery/index.html 平面版。
   减少动态:指针直接到位、柠檬不晃。 */
import { THREE } from './ef-gl.js?v=2';
const EF = window.EF, BT = EF.BT;
const RM = () => EF.reduced;
const c3 = h => new THREE.Color(h);

function stage3d(parent, opt = {}) {
  const h = opt.h || (EF.mobile ? 320 : 380);
  document.body.classList.add('stage3d');
  const wrap = document.createElement('div'); wrap.className = 's3d'; wrap.style.height = h + 'px'; parent.appendChild(wrap);
  const renderer = new THREE.WebGLRenderer({ antialias: EF.glTier === 'high', alpha: true });
  renderer.setPixelRatio(EF.dpr()); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
  wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(opt.fov || 40, 1, 0.05, 200);
  scene.add(new THREE.AmbientLight(0xc0b0c8, 0.8));
  const key = new THREE.DirectionalLight(0xfff0f6, 2.3); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb35c, 0.9); rim.position.set(-4, 1, -3); scene.add(rim);
  const o = { wrap, renderer, scene, camera, cbs: [], yaw: opt.yaw || 0, pitch: opt.pitch || 0.25, drag: opt.drag !== false, onPick: null, auto: false };
  function rs() { const w = wrap.clientWidth || 300, hh = wrap.clientHeight || h; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); }
  rs(); const ro = window.ResizeObserver ? new ResizeObserver(rs) : null; if (ro) ro.observe(wrap); else addEventListener('resize', rs);
  let down = null;
  wrap.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw: o.yaw, pitch: o.pitch, moved: 0 }; wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener('pointermove', e => {
    if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; down.moved = Math.max(down.moved, Math.hypot(dx, dy));
    if (o.drag && down.moved > 6) { o.auto = false; o.yaw = down.yaw + dx * 0.009; o.pitch = Math.max(-1.1, Math.min(1.1, down.pitch + dy * 0.007)); }
  });
  wrap.addEventListener('pointerup', e => {
    if (down && down.moved < 6 && o.onPick) {
      const r = wrap.getBoundingClientRect(), v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const rc = new THREE.Raycaster(); rc.setFromCamera(v, camera); o.onPick(rc);
    }
    down = null;
  });
  wrap.addEventListener('pointercancel', () => { down = null; });
  let last = performance.now();
  function frame(now) {
    if (!wrap.isConnected) { if (ro) ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); return; }
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (o.auto) o.yaw += dt * 0.25;
    for (const f of o.cbs) f(now / 1000, dt);
    renderer.render(scene, camera);
  }
  o.onFrame = f => o.cbs.push(f);
  o.orbit = (dist, ty = 0) => { camera.position.set(Math.sin(o.yaw) * Math.cos(o.pitch) * dist, Math.sin(o.pitch) * dist + ty, Math.cos(o.yaw) * Math.cos(o.pitch) * dist); camera.lookAt(0, ty, 0); };
  requestAnimationFrame(frame);
  return o;
}
function label(text, opt = {}) {
  const fs = 44, c = document.createElement('canvas'), x = c.getContext('2d'), F = '700 ' + fs + 'px system-ui,"PingFang SC","Noto Sans SC",sans-serif';
  x.font = F; const w = Math.ceil(x.measureText(text).width) + 30; c.width = w; c.height = fs + 22; x.font = F; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (opt.bg !== false) { x.fillStyle = 'rgba(14,10,26,.78)'; x.beginPath(); x.roundRect ? x.roundRect(1, 1, w - 2, c.height - 2, 14) : x.rect(1, 1, w - 2, c.height - 2); x.fill(); x.strokeStyle = 'rgba(255,179,92,.6)'; x.lineWidth = 2; x.stroke(); }
  x.fillStyle = opt.color || '#f4ede1'; x.fillText(text, w / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
  const k = (opt.size || 0.2) / c.height; s.scale.set(w * k, c.height * k, 1); s.renderOrder = 5; return s;
}

/* ---------- L0 柠檬电池 ---------- */
function L0(stage, api) {
  let S = null, st = { a: 'Cu', b: 'Cu', n: 1, V: 0, led: false }, needle = 0, built = '';
  const grp = new THREE.Group(), lemonGeo = new THREE.SphereGeometry(0.5, 40, 28), lemonMat = new THREE.MeshStandardMaterial({ color: 0xf2d33a, roughness: 0.55, emissive: 0x2a2000, emissiveIntensity: 0.3 });
  const plateGeo = new THREE.BoxGeometry(0.08, 0.7, 0.26), mats = {}; BT.FM.forEach(m => { mats[m.k] = new THREE.MeshStandardMaterial({ color: c3(m.c), metalness: 0.8, roughness: 0.32 }); });
  const wireBlk = new THREE.LineBasicMaterial({ color: 0x9aa3b0 }), wireRed = new THREE.LineBasicMaterial({ color: 0xff5a5a }), wireCu = new THREE.LineBasicMaterial({ color: 0xcfd8e6 });
  let meter, needleM, ledM, ledL, vLabel;
  const view = {
    mount(stage) {
      S = stage3d(stage, { yaw: 0, pitch: 0.42, drag: true, h: EF.mobile ? 320 : 380, fov: 42 });
      const table = new THREE.Mesh(new THREE.BoxGeometry(7, 0.16, 3.2), new THREE.MeshStandardMaterial({ color: 0x223044, roughness: 0.85 })); table.position.y = -0.62; S.scene.add(table);
      S.scene.add(grp);
      /* 电压表 */
      meter = new THREE.Group(); meter.position.set(0, 1.05, -0.6);
      meter.add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.14), new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.5 })));
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.5, 40, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xe8f0f8 })); face.position.set(0, -0.2, 0.08); meter.add(face);
      needleM = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.42, 0.01), new THREE.MeshBasicMaterial({ color: 0xd04020 })); needleM.geometry.translate(0, 0.21, 0); needleM.position.set(0, -0.2, 0.09); meter.add(needleM);
      S.scene.add(meter);
      /* LED */
      ledM = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), new THREE.MeshStandardMaterial({ color: 0x5a1a1a, emissive: 0xff2020, emissiveIntensity: 0, transparent: true, opacity: 0.92 }));
      ledM.position.set(1.15, 1.0, -0.6); S.scene.add(ledM);
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.04), new THREE.MeshStandardMaterial({ color: 0x8a8a90, metalness: 0.7 })); legs.position.set(1.15, 0.82, -0.6); S.scene.add(legs);
      ledL = new THREE.PointLight(0xff3030, 0, 3); ledL.position.copy(ledM.position); S.scene.add(ledL);
      const lt = label('红色 LED', { size: 0.13 }); lt.position.set(1.15, 0.62, -0.6); S.scene.add(lt);
      S.onFrame((t, dt) => {
        S.orbit(EF.mobile ? 6.4 : 5.2, 0.25);
        const tg = Math.max(-1, Math.min(3.2, st.V)) / 3.2; needle += (tg - needle) * (RM() ? 1 : Math.min(1, dt * 5));
        needleM.rotation.z = Math.PI / 2 - (needle * 3.2 + 1) / 4.2 * Math.PI;
        ledM.material.emissiveIntensity = st.led ? 1.6 + (RM() ? 0 : 0.2 * Math.sin(t * 6)) : 0; ledL.intensity = st.led ? 2.5 : 0;
        grp.children.forEach((o, i) => { if (o.userData.lemon && !RM()) o.position.y = -0.2 + Math.sin(t * 1.2 + i) * 0.01; });
      });
    },
    draw(s) {
      st = s; const key = s.a + s.b + s.n;
      if (vLabel) { meter.remove(vLabel); vLabel.material.map.dispose(); vLabel.material.dispose(); }
      vLabel = label((s.V < 0 ? '−' : '') + Math.abs(s.V).toFixed(2) + ' V', { size: 0.2, color: '#ffd27a' }); vLabel.position.set(0, 0.22, 0.1); meter.add(vLabel);
      if (key === built) return; built = key;
      while (grp.children.length) { const o = grp.children.pop(); if (o.geometry && o.geometry !== lemonGeo && o.geometry !== plateGeo) o.geometry.dispose(); }
      const n = s.n, gap = EF.mobile ? 1.1 : 1.35, x0 = -gap * (n - 1) / 2, tops = [];
      for (let i = 0; i < n; i++) {
        const cx = x0 + i * gap, L = new THREE.Mesh(lemonGeo, lemonMat); L.scale.set(1.1, 0.78, 0.82); L.position.set(cx, -0.2, 0); L.userData.lemon = 1; grp.add(L);
        const pa = new THREE.Mesh(plateGeo, mats[s.a]); pa.position.set(cx - 0.22, 0.2, 0); grp.add(pa);
        const pb = new THREE.Mesh(plateGeo, mats[s.b]); pb.position.set(cx + 0.22, 0.2, 0); grp.add(pb);
        tops.push([new THREE.Vector3(cx - 0.22, 0.55, 0), new THREE.Vector3(cx + 0.22, 0.55, 0)]);
      }
      const line = (pts, m) => { const g = new THREE.BufferGeometry().setFromPoints(pts); grp.add(new THREE.Line(g, m)); };
      for (let j = 0; j < n - 1; j++) { const a = tops[j][1], b = tops[j + 1][0], mid = a.clone().add(b).multiplyScalar(0.5); mid.y += 0.35; line(new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(16), wireCu); }
      const A0 = tops[0][0], B0 = tops[n - 1][1];
      line([A0, new THREE.Vector3(A0.x, 1.0, A0.z), new THREE.Vector3(-0.65, 1.0, -0.6)], wireBlk);
      line([B0, new THREE.Vector3(B0.x, 1.0, B0.z), new THREE.Vector3(0.65, 1.0, -0.6)], wireRed);
      const tag = label(BT.FBY[s.a].n + ' | 柠檬汁 | ' + BT.FBY[s.b].n + (n > 1 ? ' × ' + n + '(串联)' : ''), { size: 0.15 }); tag.position.set(0, -0.95, 0.9); grp.add(tag);
    }
  };
  BT.lemon(stage, api, view);
}

EF.V3 = { L0 };
