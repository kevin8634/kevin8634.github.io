/* 宙律 3.0 · 新手层教学数据与纯函数(3-3)
 * snap1:×1 吸附;REAL:真实宇宙对照值(每条带出处与许可);explain:失败/警告卡两层文本;
 * guideStep:引导三步状态机;STAGE:每关一句讲解。全部纯函数,node 可测,不碰 DOM。 */

/* ---------- ×1 吸附:对数距离在 tol 内(默认 ±4%)吸到 1 ---------- */
export const SNAP_TOL = 0.04;
export function snap1(v, tol = SNAP_TOL) {
  if (!(v > 0)) return v;
  return Math.abs(Math.log(v)) <= Math.log(1 + tol) ? 1 : v;
}

/* ---------- 真实宇宙对照值:观测/定义值,非模型输出 ---------- */
export const REAL = {
  ageGyr: { v: 13.8, src: 'Planck 2018 results VI, A&A 641, A6 (2020)', lic: 'facts; A&A open access — cite source' },
  teffK: { v: 5772, src: 'NASA NSSDCA Sun Fact Sheet (upd. 2024-05-09); IAU 2015 Resolution B3', lic: 'NASA: US Gov work, public domain' },
  zMax: { v: 82, src: 'Lead (Z=82); Bi-209 half-life 1.9×10¹⁹ yr — de Marcillac et al., Nature 422, 876 (2003)', lic: 'facts — cite source' },
  planets: { v: 8, src: 'IAU 2006 Resolution B5; NASA Planetary Fact Sheet', lic: 'NASA: public domain' },
  water: { v: 1, src: 'NASA Planetary Fact Sheet (Earth: surface liquid water)', lic: 'NASA: public domain' },
  alpha: { v: 7.2973525693e-3, src: 'CODATA 2018 (NIST)', lic: 'NIST: US Gov work, public domain' }
};
export const REAL_CREDIT = {
  zh: '真实宇宙数据:Planck 2018(A&A 开放获取)· NASA 太阳与行星概况(公有领域)· IAU 2006/2015 决议 · CODATA 2018(NIST,公有领域)· de Marcillac 2003。数值为科学事实,注明出处使用。',
  en: 'Real-universe data: Planck 2018 (A&A open access) · NASA Sun & Planetary Fact Sheets (public domain) · IAU 2006/2015 resolutions · CODATA 2018 (NIST, public domain) · de Marcillac 2003. Values are scientific facts, used with attribution.'
};

/* 对照表行:真实值 vs 你的宇宙(模型输出) */
export function compareRows(res, lang = 'zh') {
  const zh = lang !== 'en', st = res.stages;
  const pre = ['T1', 'T2', 'T3', 'T4'].some((t) => st[t] === 'fail');          // 没有星系/原子:没有恒星可谈
  const lit = !pre && res.ignition.frac > 0 && st.T5 !== 'fail';
  const sys = lit && st.T6 !== 'fail' && st.T7 !== 'fail' || (lit && st.T6 !== 'fail' && res.failures.every((c) => c === 'chem_freeze'));
  const gyr = (g) => (g == null ? '—' : zh ? `${Math.round(g * 10)} 亿年` : `${g.toFixed(1)} Gyr`);
  const age = res.cosmos.fate === 'crunch' ? (zh ? `${gyr(res.cosmos.crunchGyr)}塌缩` : `${gyr(res.cosmos.crunchGyr)} ↺`) : gyr(res.cosmos.ageGyr);
  const hz = res.planets.filter((p) => p.habitable).length;
  return [
    { k: zh ? '宇宙年龄' : 'Age', real: gyr(REAL.ageGyr.v), yours: age },
    { k: zh ? '恒星表面温度' : 'Star surface', real: REAL.teffK.v.toLocaleString('en') + ' K', yours: lit ? Math.round(res.star.teff).toLocaleString('en') + ' K' : pre ? (zh ? '没有恒星' : 'no stars') : (zh ? '没点燃' : 'unlit') },
    { k: zh ? '最重稳定元素' : 'Heaviest stable', real: 'Z = 82', yours: 'Z ≈ ' + Math.max(0, Math.round(res.atoms.zMax)) },
    { k: zh ? '行星' : 'Planets', real: String(REAL.planets.v), yours: String(sys ? res.planets.length : 0) },
    { k: zh ? '可能有液态水' : 'Liquid water', real: zh ? '1(地球)' : '1 (Earth)', yours: String(sys && !res.failures.length ? hz : 0) }
  ];
}

/* ---------- 失败/警告卡:第一层一句话,第二层讲因果 + 数字 + 往哪拧 ---------- */
const f1 = (x, d = 2) => (+x).toPrecision(d).replace(/\.?0+e/, 'e');
const mul = (x) => '×' + (+(+x).toPrecision(x < 0.1 ? 2 : 3));
const T = {
  crunch: {
    zh: (r) => [`引力 ${mul(r.recipe.kG)},物质的拉力太强(Ωm ≈ ${f1(r.cosmos.Om, 3)},真实 0.315),膨胀被拉回来${r.cosmos.crunchGyr != null ? `,约 ${Math.round(r.cosmos.crunchGyr * 10)} 亿年塌回一点` : ''}。`, '把 G 往 ×1 拧回去,或在探索层加大 Λ(暗能量)。'],
    en: (r) => [`Gravity ${mul(r.recipe.kG)} makes matter pull too hard (Ωm ≈ ${f1(r.cosmos.Om, 3)}, real 0.315), so expansion turns around${r.cosmos.crunchGyr != null ? ` and collapses at about ${r.cosmos.crunchGyr.toFixed(1)} Gyr` : ''}.`, 'Turn G back toward ×1, or raise Λ (dark energy) in Explore.']
  },
  helium_only: {
    zh: (r) => [`核效率 ε = ${r.recipe.eps}(真实 0.007)太高,质子在最初三分钟全被焊进氦,没有留下氢做恒星燃料。`, '把 ε 调回 0.006–0.008。'],
    en: (r) => [`Nuclear efficiency ε = ${r.recipe.eps} (real 0.007) is too high: every proton is fused into helium in the first minutes, no hydrogen is left as star fuel.`, 'Bring ε back to 0.006–0.008.']
  },
  hydrogen_only: {
    zh: (r) => [`核效率 ε = ${r.recipe.eps}(真实 0.007)太低,氘核粘不住,核合成第一步就停了,只剩氢。`, '把 ε 调回 0.006–0.008。'],
    en: (r) => [`Nuclear efficiency ε = ${r.recipe.eps} (real 0.007) is too low: deuterium cannot hold together, fusion stalls at step one.`, 'Bring ε back to 0.006–0.008.']
  },
  no_atoms: {
    zh: (r) => [`有效 α ${mul(r.alphaEff)}。电磁力太强时,重原子核里的质子互相排斥得撑不住:最重的稳定核只到 Z ≈ ${Math.round(r.atoms.zMax)},连碳(Z=6)都没有。`, '把 α 往 ×1 拧;只改光速 c 也会改 α(α ∝ 1/c)。'],
    en: (r) => [`Effective α ${mul(r.alphaEff)}. With electromagnetism this strong, protons in heavy nuclei push each other apart: the heaviest stable nucleus is only Z ≈ ${Math.round(r.atoms.zMax)}, not even carbon (Z=6).`, 'Turn α toward ×1; changing c alone also changes α (α ∝ 1/c).']
  },
  few_elements: {
    zh: (r) => [`有效 α ${mul(r.alphaEff)},最重稳定核只到 Z ≈ ${Math.round(r.atoms.zMax)},没有铁(Z=26),行星核与很多化学都缺料。`, '把 α 往 ×1 拧一点。'],
    en: (r) => [`Effective α ${mul(r.alphaEff)}: the heaviest stable nucleus is Z ≈ ${Math.round(r.atoms.zMax)}, no iron (Z=26), so planet cores and much chemistry are missing.`, 'Turn α a little toward ×1.']
  },
  cold: {
    zh: (r) => [`初始涟漪 Q = ${f1(r.recipe.Q)}(真实 1e-5)太弱,或暗能量 Λ ×${f1(r.recipe.kL)} 太强,物质还没聚成团就被摊开,宇宙成了一片冷雾。`, '把 Q 调回 1e-5 附近,或减小 Λ。'],
    en: (r) => [`Primordial ripples Q = ${f1(r.recipe.Q)} (real 1e-5) are too weak, or dark energy Λ ×${f1(r.recipe.kL)} too strong: matter spreads out before it clumps.`, 'Bring Q back near 1e-5, or lower Λ.']
  },
  bh_soup: {
    zh: (r) => [`初始涟漪 Q = ${f1(r.recipe.Q)}(真实 1e-5)太强,物质直接塌成黑洞,来不及形成星系与恒星。`, '把 Q 调回 1e-5 附近。'],
    en: (r) => [`Primordial ripples Q = ${f1(r.recipe.Q)} (real 1e-5) are too strong: matter collapses straight into black holes.`, 'Bring Q back near 1e-5.']
  },
  no_ignition: {
    zh: (r) => [`引力 ${mul(r.recipe.kG)} 改变了能点燃的恒星质量窗口:${f1(r.ignition.mMin)}–${f1(r.ignition.mMax)} 个太阳质量,只有 ${(r.ignition.frac * 100).toFixed(1)}% 的气体云落在窗口里。`, '把 G 往 ×1 拧,窗口会回到 0.08–150 个太阳质量。'],
    en: (r) => [`Gravity ${mul(r.recipe.kG)} shifts the ignition window to ${f1(r.ignition.mMin)}–${f1(r.ignition.mMax)} solar masses; only ${(r.ignition.frac * 100).toFixed(1)}% of gas clouds fall inside it.`, 'Turn G toward ×1; the window returns to 0.08–150 solar masses.']
  },
  flash: {
    zh: (r) => [`引力 ${mul(r.recipe.kG)} 让恒星烧得太猛:亮度 ∝ G⁴,代表恒星只活约 ${Math.max(1, Math.round(r.star.lifeGyr * 1000))} 百万年(太阳约 100 亿年),行星还没长好它就熄了。`, '把 G 往 ×1 拧。'],
    en: (r) => [`Gravity ${mul(r.recipe.kG)} makes stars burn too fast (luminosity ∝ G⁴): the star lives about ${Math.max(1, Math.round(r.star.lifeGyr * 1000))} Myr (the Sun: ~10 Gyr), gone before planets settle.`, 'Turn G toward ×1.']
  },
  orbit_break: {
    zh: (r) => [`涟漪 Q = ${f1(r.recipe.Q)} 太强,星团太挤,路过的邻星把行星轨道扯散。`, '把 Q 调回 1e-5 附近。'],
    en: (r) => [`Ripples Q = ${f1(r.recipe.Q)} are too strong: crowded clusters, passing stars tear the orbits apart.`, 'Bring Q back near 1e-5.']
  },
  chem_freeze: {
    zh: (r) => [`有效 α ${mul(r.alphaEff)},化学键只有约 ${f1(r.atoms.bondEV)} eV(真实 C–H 键约 4.3 eV)。在行星的温度下,这么弱的键刚连上就被热运动拆开,长不出复杂分子。`, '把 α 往 ×1 拧。'],
    en: (r) => [`Effective α ${mul(r.alphaEff)}: chemical bonds are about ${f1(r.atoms.bondEV)} eV (real C–H ~4.3 eV). At planet temperatures heat breaks them as fast as they form, so no complex molecules.`, 'Turn α toward ×1.']
  }
};
export const CODES = Object.keys(T);
/* 返回 { code, level:'fail'|'warn', stage, why, fix } 或 null(走通) */
export function explain(res, U, lang = 'zh') {
  const code = res.failures[0] || res.warnings[0];
  if (!code || !T[code]) return null;
  const [why, fix] = T[code][lang === 'en' ? 'en' : 'zh'](res);
  return { code, level: res.failures.length ? 'fail' : 'warn', stage: U.FAILURES[code], why, fix };
}

/* ---------- 每关一句讲解 ---------- */
export const STAGE = {
  T1: { zh: '膨胀:引力想把宇宙拉回来,暗能量把它推开。拉赢了,宇宙会塌回一点。', en: 'Expand: gravity pulls the universe back, dark energy pushes it apart. If gravity wins, it collapses.' },
  T2: { zh: '核合成:最初三分钟,质子和中子焊成氦。要剩下足够的氢,恒星才有燃料。', en: 'Nuclei: in the first three minutes protons and neutrons fuse into helium. Enough hydrogen must be left as star fuel.' },
  T3: { zh: '原子:电磁力 α 决定电子绕核多紧、原子核能多重。', en: 'Atoms: electromagnetism α sets how tightly electrons hold and how heavy nuclei can get.' },
  T4: { zh: '成团:初始涟漪 Q 太弱就是冷雾,太强就塌成黑洞。', en: 'Clumps: ripples Q too weak gives a cold fog, too strong gives black holes.' },
  T5: { zh: '点燃:气体云要够重才能点燃核聚变,又不能太重炸掉。引力 G 挪动这个窗口。', en: 'Ignition: a cloud must be heavy enough to ignite fusion but not so heavy it blows apart. G moves this window.' },
  T6: { zh: '时间:恒星要烧得够久,行星才来得及长好。', en: 'Time: the star must burn long enough for planets to form.' },
  T7: { zh: '恒星系:行星要站稳轨道,温度和化学键要刚好能造分子。', en: 'System: planets need stable orbits, and the right temperature and bonds to build molecules.' }
};

/* ---------- 引导三步状态机 ----------
 * 0 拧 G(偏离 ×1 至少 2 倍) → 1 按大爆炸 → 2 看卡在哪关(点「知道了」) → 3 完成 */
export const GUIDE = {
  zh: [
    { t: '1/3 拧一拧引力 G', d: '把「引力 G」往右或往左拖远一点(至少 2 倍)。旁边的小曲线会提前告诉你后果。' },
    { t: '2/3 按「大爆炸」', d: '宇宙会沿 138 亿年走 7 关,一关一关揭晓。' },
    { t: '3/3 看它卡在哪', d: '红色那关就是卡住的地方。点开失败卡看原因,拖中间的竖条对比真实宇宙。', ok: '这次走通了!再拧狠一点,看看哪一关先撑不住。' }
  ],
  en: [
    { t: '1/3 Turn gravity G', d: 'Drag Gravity G well away from ×1 (at least 2×). The little curve shows the consequence ahead of time.' },
    { t: '2/3 Press Big Bang', d: 'Your universe walks 7 stages over 13.8 billion years, revealed one by one.' },
    { t: '3/3 See where it stops', d: 'The red stage is where it got stuck. Open the card for the cause, drag the bar to compare with our universe.', ok: 'It made it! Turn harder and see which stage breaks first.' }
  ]
};
export function guideStep(step, ev) {
  if (step === 0 && ev.type === 'knob' && ev.key === 'kG' && Math.abs(Math.log(ev.v)) >= Math.log(2)) return 1;
  if (step === 1 && ev.type === 'bang') return 2;
  if (step === 2 && ev.type === 'done') return 3;
  if (ev.type === 'skip') return 3;
  return step;
}
