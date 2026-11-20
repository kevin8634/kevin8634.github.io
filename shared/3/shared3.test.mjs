// node shared/3/shared3.test.mjs —— /shared/3/ v0.1 纯函数单测(无 DOM)
import { mulberry32, sfc32, seedOf, rk4, verletStep } from './prng.js';
import { encode, decode, validate, GusError } from './gus.js';
import { createUndo } from './undo.js';
import { sci, mult, makeT, aria } from './i18n.js';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const throwsCode = async (f, code, m) => { try { await f(); ok(false, m + ' (no throw)'); } catch (e) { ok(e instanceof GusError && e.code === code, m + ' got ' + e.code); } };

// prng 确定性
{ const a = mulberry32(20261120), b = mulberry32(20261120); let same = true; for (let i = 0; i < 1000; i++) if (a() !== b()) same = false; ok(same, 'mulberry32 same seed'); }
{ const a = sfc32('nv'), b = sfc32('nv'), c = sfc32('ef'); let same = true, diff = false; for (let i = 0; i < 1000; i++) { const x = a(); if (x !== b()) same = false; if (x !== c()) diff = true; } ok(same && diff, 'sfc32 seed'); }
{ const r = mulberry32(1); let lo = 1, hi = 0, s = 0; for (let i = 0; i < 1e5; i++) { const x = r(); lo = Math.min(lo, x); hi = Math.max(hi, x); s += x; } ok(lo >= 0 && hi < 1 && Math.abs(s / 1e5 - 0.5) < 0.01, 'mulberry32 range/mean'); }
ok(seedOf('abc') === seedOf('abc') && seedOf('abc') !== seedOf('abd'), 'seedOf');
// rk4:y' = -y, y(1) = e^-1
{ let y = [1]; const h = 0.01; for (let i = 0; i < 100; i++) y = rk4((t, v) => [-v[0]], i * h, y, h); ok(Math.abs(y[0] - Math.exp(-1)) < 1e-9, 'rk4 exp ' + y[0]); }
// verlet:圆轨道一周,周期误差 ≤1%,能量漂移 ≤0.1%/千步
{ const GM = 1, pos = new Float64Array([1, 0, 0]), vel = new Float64Array([0, 1, 0]), acc = new Float64Array(3);
  const accel = (p, a) => { const r3 = Math.pow(p[0] * p[0] + p[1] * p[1] + p[2] * p[2], 1.5); a[0] = -GM * p[0] / r3; a[1] = -GM * p[1] / r3; a[2] = -GM * p[2] / r3; };
  const E = () => 0.5 * (vel[0] ** 2 + vel[1] ** 2) - GM / Math.hypot(pos[0], pos[1]);
  accel(pos, acc); const E0 = E(); const h = 2 * Math.PI / 1000; let tCross = 0, prevY = 0;
  for (let i = 1; i <= 1100; i++) { prevY = pos[1]; verletStep(pos, vel, acc, h, accel); if (i > 500 && prevY < 0 && pos[1] >= 0 && !tCross) tCross = (i - pos[1] / (pos[1] - prevY)) * h; }
  ok(Math.abs(tCross / (2 * Math.PI) - 1) < 0.01, 'verlet period ' + tCross);
  ok(Math.abs((E() - E0) / E0) < 1e-3, 'verlet energy drift'); // 1100 步
}
// GUS
const sample = { gus: '0.1', kind: 'universe', id: 'nv-7f3a9c21', name: { zh: '长明宇宙', en: 'Everlight' }, seed: 20261120,
  generator: { world: 'nv', app: 'nomoverse/3', model: 'cosmos3@1.0.0' },
  constants: { G: { k: 0.5, si: 3.33715e-11, unit: 'm^3 kg^-1 s^-2' }, c: { k: 1, si: 299792458, unit: 'm s^-1', alphaLinked: true } },
  derived: { status: 'ok', failures: [], fate: 'expand', age_s: 4.35e17, stages: { T1: 'ok', T7: 'warn' } },
  system: { star: { mass_kg: 1.989e30, lum_W: 2.4e25, radius_m: 6.96e8, teff_K: 5772, rgb: [1, 0.96, 0.9] },
    planets: [{ id: 'p1', a_m: 2.99e11, e: 0.02, mass_kg: 5.97e24, radius_m: 6.37e6, period_s: 1.262e8, teq_K: 90, kind: 'rocky', habitable: false, phase0_rad: 1.2 }] },
  render: { skyTint: [0.05, 0.06, 0.15], starDensity: 1, nebula: 0.4, quality: 'auto' }, simplified: true, sources: 'https://kevin8634.github.io/nomoverse/SOURCES.md' };
{ const s = await encode(sample); ok(/^[A-Za-z0-9_-]+$/.test(s) && s.length <= 1800, 'encode b64url len ' + s.length);
  const d = await decode(s); ok(d.name.zh === '长明宇宙' && d.system.planets[0].a_m === 2.99e11 && d.constants.G.k === 0.5 && d.derived.stages.T7 === 'warn', 'roundtrip');
  ok(JSON.stringify(await decode(await encode(sample))) === JSON.stringify(d), 'deterministic');
}
{ const j = 'j.' + Buffer.from(JSON.stringify(sample)).toString('base64url'); const d = await decode(j); ok(d.id === 'nv-7f3a9c21', 'j. fallback'); }
await throwsCode(() => validate({ ...sample, gus: '1.0' }), 'major_mismatch', 'major');
ok(validate({ ...sample, gus: '0.9', futureField: 1 }).gus === '0.9', 'minor higher ok');
await throwsCode(() => validate({ ...sample, kind: 'x' }), 'bad_kind', 'kind');
await throwsCode(() => validate({ ...sample, system: { ...sample.system, planets: [{ ...sample.system.planets[0], a_m: 1 }] } }), 'planet_range', 'a_m range');
await throwsCode(() => validate({ ...sample, system: { ...sample.system, planets: Array(9).fill(sample.system.planets[0]) } }), 'too_many_planets', '>8');
await throwsCode(() => validate({ ...sample, system: { ...sample.system, star: { ...sample.system.star, lum_W: NaN } } }), 'star_range', 'NaN');
await throwsCode(() => decode('j.' + Buffer.from('{oops').toString('base64url')), 'bad_json', 'bad json');
{ const v = validate({ ...sample, name: { zh: '<img src=x onerror=alert(1)>'.repeat(5) }, sources: 'https://evil.example/' }); ok(v.name.zh.length <= 40 && !v.sources, 'sanitize'); }
// 超长裁剪
{ const big = JSON.parse(JSON.stringify(sample)); big.derived.stages = {}; for (let i = 0; i < 12; i++) big.derived.stages['T' + i] = 'ok';
  big.system.planets = Array.from({ length: 8 }, (_, i) => ({ ...sample.system.planets[0], id: 'p' + i, a_m: 1e10 * (i + 1) + Math.random() }));
  const s = await encode(big); const d = await decode(s); ok(d.system.planets.length === 8, 'trim keeps planets ' + s.length); }
// undo
{ const changes = []; const u = createUndo({ G: 1 }, { onChange: (s) => changes.push(s) });
  u.push({ G: 2 }); u.begin(); for (let i = 3; i <= 9; i++) u.push({ G: i }); u.end();
  ok(u.state.G === 9, 'undo cur'); u.undo(); ok(u.state.G === 2, 'drag merged'); u.undo(); ok(u.state.G === 1, 'undo2'); ok(!u.undo(), 'empty');
  u.redo(); u.redo(); ok(u.state.G === 9, 'redo'); u.push({ G: 9 }); ok(u.canRedo === false, 'no-op push');
  const L = createUndo({ n: 0 }, { limit: 100 }); for (let i = 1; i <= 150; i++) L.push({ n: i }); let k = 0; while (L.undo()) k++; ok(k === 100 && L.state.n === 50, 'limit 100'); }
// i18n
ok(sci(3.33715e-11) === '3.34×10⁻¹¹', 'sci ' + sci(3.33715e-11)); ok(sci(299792458) === '3×10⁸', 'sci c ' + sci(299792458)); ok(sci(0.31) === '0.31', 'sci plain');
ok(mult(0.5) === '×0.5', 'mult');
{ const t = makeT({ hi: { zh: '你好 {n}', en: 'hi {n}', zhMore: '展开' } }, 'en'); ok(t('hi', { n: 2 }) === 'hi 2' && t('nope') === 'nope', 'makeT'); }
ok(/十的 -11 次方/.test(aria(3.3e-11, 'zh')), 'aria');
// ---- v0.2 ----
{ const { negotiate } = await import('./gus.js');
  ok(negotiate({ gus: '0.1' }).ok && negotiate({ gus: '0.9' }).newer && !negotiate({ gus: '1.0' }).ok && negotiate({}).reason === 'no_version', 'G7 negotiate');
  const zl = JSON.parse(JSON.stringify(sample)); zl.constants.Lambda = { k: 0 }; ok(validate(zl).constants.Lambda && validate(zl).constants.Lambda.k === 0, 'G1 Λ=0');
  zl.constants.Lambda = { k: -5 }; ok(validate(zl).constants.Lambda.k === -5, 'G1 Λ<0');
  zl.constants.G = { k: 0 }; ok(!validate(zl).constants.G, 'G1 G=0 still dropped');
  const dd = JSON.parse(JSON.stringify(sample)); Object.assign(dd.derived, { crunch_s: null, heliumY: 0.247, habitable: true, warnings: ['W_HOT'], starLife_s: 3e17 });
  const v = validate(dd).derived; ok(v.crunch_s === null && v.heliumY === 0.247 && v.habitable === true && v.warnings[0] === 'W_HOT' && v.starLife_s === 3e17, 'G2/G3 derived'); }
{ const { createStore } = await import('./store.js'); const seen = []; const st = createStore({ G: 1 }, { normalize: (x) => ({ G: Math.min(10, x.G) }) });
  st.subscribe((s) => seen.push(s.G)); st.set({ G: 2 }); st.beginGesture(); for (let i = 3; i < 20; i++) st.set((s) => ({ G: s.G + 1 })); st.endGesture();
  ok(st.get().G === 10, 'G5 normalize'); st.undo(); ok(st.get().G === 2, 'G5 gesture merged'); ok(seen.length > 3, 'G5 subscribe'); }
{ const T = await import('./tier.js'); ok(T.budget('low').particles === 4096 && T.budget('high').particles === 65536, 'G4 budget');
  const got = []; const off = T.onChange((t, p) => got.push(t)); T.set('low'); T.set('medium'); off(); T.set('high'); ok(got.join() === 'low,medium' && T.current() === 'high', 'G4 set/onChange'); }
{ const { two } = await import('./i18n.js'); const e = { zh: '直白', en: 'plain', zhMore: '展开', enMore: 'more' }; ok(two(e, 'en').more === 'more' && two(e, 'zh').short === '直白', 'G6 two'); }
console.log(`shared/3 v0.2: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
