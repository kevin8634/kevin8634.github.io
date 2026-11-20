# 宙律 Nomoverse 3.0 · 出处与教学简化

全部为教学简化模型(标度律 + 阈值),界面上每处简化须标「简化」角标。标 *inferred* 的数值为数量级示意,待物理复核。

| 模型 | 用法 | 出处 | 简化 |
|---|---|---|---|
| 常数 | G、c、α、M☉、L☉、R☉、T☉、AU | CODATA 2018;IAU 2015 Resolution B3;IAU 2012 B2 | — |
| 宇宙学参数 | H0 = 67.4 km/s/Mpc,Ωm = 0.315,ΩΛ = 0.685,年龄 13.797 Gyr | Planck 2018 results VI(A&A 641, A6) | 忽略辐射期 |
| T1 弗里德曼方程 | E² = Ωm/a³ + Ωk/a² + ΩΛ;在 a_i = 0.1 固定起跑速率与物理密度,Ωm ∝ G | 标准宇宙学教材(如 Ryden《Introduction to Cosmology》) | a_i 取 0.1 为可玩性,真实敏感度更高(平直性问题) *inferred* |
| T2 核效率 ε | ε < 0.006 无氘;ε > 0.008 无自由氢 | Rees, *Just Six Numbers*(1999)第 4 章 | 氦比例线性插值 *inferred* |
| T3 原子 | a₀ ∝ 1/α,电离能 ∝ α²,Hα ∝ α⁻²(沿用 2.0);最重稳定核 Z ≈ 82/α倍数 | CODATA 2018;Barrow & Tipler(1986);Tegmark, Ann. Phys. 270:1(1998) | Z_max 标度 *inferred* |
| T4 结构形成 | Q < 1e-6 冷寂,Q > 1e-4 黑洞汤;Λ ≳ 200 倍来不及成团 | Rees(1999)第 8 章;Weinberg, PRL 59:2607(1987) | 阈值与警告带 *inferred* |
| T5 点燃窗口 | 最小点燃质量 0.08 M☉、最大稳定质量 150 M☉,均 ∝ G^-1.5;Salpeter IMF(斜率 2.35) | Kippenhahn & Weigert《Stellar Structure and Evolution》;Salpeter, ApJ 121:161(1955) | 只用标度律 |
| 主序星 | L ∝ G⁴M³(沿用 2.0),R ∝ M^0.8·G,寿命 ∝ ε·M/L | 同上(同调关系,电子散射不透明度) | 不做演化 |
| T7 行星 | 平衡温度 255 K·L^¼/√a(Bond 反照率 0.3);开普勒第三定律 | NASA 地球概况 | 宜居带 200–310 K *inferred* |
| T7 化学 | 键能 4.3 eV·α²,键能/热运动能 < 40 视为化学冻结 | 典型 C–H 键能 | 阈值 *inferred* |
| 黑体颜色 | 色温 → sRGB | Tanner Helland 拟合(公开算法) | 近似 |
| 种子 PRNG | mulberry32 | 公有领域算法 | — |
| c 的诚实开关 | 只改 c 而 e、ħ 不变时 α ∝ 1/c | Duff, Okun & Veneziano, JHEP 2002 | — |
