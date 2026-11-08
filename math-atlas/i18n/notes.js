/* 星图 Math Atlas · 知识笔记 英文语言包(v0.8.7,英文第三期;仅英文模式加载)
 * 笔记正文整份替换为 MA_NOTES_EN(按任务 id),界面短句走词典。数学术语按标准英文教材用法。
 */
window.MA_NOTES_EN = {
  meta: {
    nim: { g: "Grades 1–3", pre: "Counting to 20, adding and subtracting" },
    bee: { g: "Grade 4+", pre: "Knowing polygons" },
    nav: { g: "Grades 5–7", pre: "Addition, comparing sizes" },
    secret: { g: "Grade 5–6+", pre: "Multiplication, division, remainders" },
    chord: { g: "Grade 6+", pre: "Fractions and ratios" },
    cat: { g: "Grade 7–8+", pre: "Coordinate plane, linear functions" },
    casino: { g: "Grades 7–9", pre: "Fractions, percentages" },
    epidemic: { g: "Grades 9–10", pre: "Powers, percentages" },
    rocket: { g: "Grades 10–12", pre: "Linear functions, powers" },
    cube: { g: "High school–university", pre: "Rotation and symmetry, multiplication" }
  },
  notes: {
    nim: {
      nav: "Pinecones", eyebrow: "Quest 5 · ★☆☆ Beginner",
      title: "Does the first player always win? (Pinecone grab · combinatorial games)",
      must: [
        "Winning and losing positions: a position where you are sure to lose when it is your turn is a losing position.",
        "Backward induction (think in reverse): work back from the final position 0 and check where each position can move.",
        "Taking 1 to m each turn: the losing positions are multiples of (m+1); on the first move, take the remainder of N ÷ (m+1).",
        "Pairing strategy: if your opponent takes k, you take (m+1−k), so each round adds up to m+1.",
        "Reasoning and counterexamples: explain why something is true; a single counterexample is enough to disprove a claim.",
        "Mirror strategy: when two piles are equal, the second player wins by copying every move."
      ],
      formulas: [
        ["First player wins", "⇔ N mod (m+1) ≠ 0"],
        ["First move", "take N mod (m+1)"],
        ["Two-pile Nim", "first player wins ⇔ the piles are unequal (in general: the binary XOR of all pile sizes ≠ 0)"]
      ],
      lit: [
        "Charles L. Bouton, \"Nim, a Game with a Complete Mathematical Theory\", Annals of Mathematics, 1901–1902",
        "R. Sprague (1935), P. M. Grundy (1939): the Sprague–Grundy theorem reduces every impartial combinatorial game to Nim",
        "Berlekamp, Conway, Guy, Winning Ways for Your Mathematical Plays, 1982",
        "Traditional Chinese game \"Race to 30\" and Bash's game"
      ],
      apps: [
        "Strategy analysis in game theory and economics",
        "Computer chess: game-tree search and backward induction (endgame tablebases)",
        "Programming: dynamic programming and recursion",
        "Stone-taking problems in math competitions"
      ]
    },
    bee: {
      nav: "Bees", eyebrow: "Quest 3 · ★☆☆ Beginner",
      title: "Why do bees choose hexagons",
      must: [
        "Each interior angle of a regular n-gon = (n−2)×180°/n: triangle 60°, square 90°, regular hexagon 120°.",
        "The angles around a vertex must add up to 360°, so only 3 regular polygons tile the plane on their own: the equilateral triangle, the square and the regular hexagon.",
        "For the same area, more sides means closer to a circle and a shorter perimeter; the circle is the most efficient but cannot tile.",
        "Honeycomb conjecture: when the plane is divided into cells of equal area, the regular hexagonal grid has the least total perimeter (proved in 1999).",
        "Voronoi diagram: every point belongs to its nearest \"seed\"; keep moving each seed to the centre of its region (Lloyd relaxation) and the cells drift toward hexagons.",
        "Nature is often optimizing: doing the job with the least material."
      ],
      formulas: [
        ["Interior angle", "(n−2)×180°/n; angle sum of a polygon (n−2)×180°"],
        ["Tiling condition", "360° ÷ interior angle must be a whole number"],
        ["Perimeter for area A", "triangle ≈ 4.559√A, square = 4√A, hexagon ≈ 3.722√A, circle ≈ 3.545√A"],
        ["Isoperimetric inequality", "L² ≥ 4πA (equality for the circle)"],
        ["Area of a regular hexagon", "A = (3√3/2)·a²"],
        ["Centroid", "x̄ = the mean x-coordinate of all points in the region"]
      ],
      lit: [
        "Varro (36 BC) first stated the honeycomb conjecture",
        "Pappus (c. 4th century), Collection, praised the bees' \"geometric foresight\"",
        "Kepler, On the Six-Cornered Snowflake (1611)",
        "Lord Kelvin (1887), the 3D foam problem; Weaire & Phelan (1993) found a better structure",
        "Lloyd (1982) \"Least squares quantization in PCM\", IEEE Trans. Information Theory",
        "Thomas C. Hales (2001) \"The Honeycomb Conjecture\", Discrete & Computational Geometry 25:1–22 (released 1999)",
        "Karihaloo et al. (2013) J. R. Soc. Interface: warmed beeswax flows, turning round cells into rounded hexagons"
      ],
      apps: [
        "The Beijing Olympic \"Water Cube\" facade: Weaire–Phelan foam",
        "Graphene and carbon nanotubes: hexagonal lattices of carbon atoms",
        "Honeycomb sandwich panels in aircraft and high-speed trains: light and stiff",
        "Planning base-station coverage for \"cellular\" phone networks",
        "Uber H3 hexagonal map grid, delivery zones (Voronoi)"
      ]
    },
    nav: {
      nav: "Navigation", eyebrow: "Quest 6 · ★★☆ Intermediate",
      title: "How does navigation find the shortest route? (Graph theory · algorithms)",
      must: [
        "Graph = vertices + edges; edges can carry weights (distance, time, cost).",
        "Only \"who is connected to whom\" matters; the shape does not.",
        "Euler paths: a figure can be drawn in one stroke when it has 0 or 2 odd vertices.",
        "Dijkstra's algorithm: spread out from the start like a ripple, fixing the nearest vertex at each step.",
        "Algorithm complexity: checking every route grows explosively; a good algorithm is far faster.",
        "Greedy vs optimal: always taking the nearest next step does not always give the shortest total route (the travelling salesman problem).",
        "Trees: connected with no cycles; n vertices have n−1 edges, and the \"came from\" arrows of shortest paths form a tree."
      ],
      formulas: [
        ["One-stroke drawing", "⇔ connected and the number of odd-degree vertices ∈ {0, 2}"],
        ["Sum of all vertex degrees", "= 2 × number of edges"],
        ["Dijkstra", "dist(v) = min(dist(v), dist(u) + w(u,v))"],
        ["Tours through n cities", "= (n−1)!/2"],
        ["Edges in a tree", "= vertices − 1; shortest routes on an n×n grid = C(2n, n)"]
      ],
      lit: [
        "Euler, \"Solutio problematis ad geometriam situs pertinentis\", 1736 (the Seven Bridges of Königsberg)",
        "E. W. Dijkstra, \"A note on two problems in connexion with graphs\", Numerische Mathematik, 1959",
        "Hart, Nilsson, Raphael, the A* algorithm, 1968",
        "Karp, 1972, NP-completeness of the travelling salesman problem",
        "Dorigo, ant colony optimization, 1992"
      ],
      apps: [
        "Phone navigation and ride-hailing dispatch",
        "Route planning for parcels and food delivery",
        "Internet routing (OSPF uses Dijkstra)",
        "Metro transfer planners",
        "Pathfinding in game AI (A*)",
        "Social network analysis"
      ]
    },
    secret: {
      nav: "Codes", eyebrow: "Quest 4 · ★★☆ Intermediate",
      title: "How do you hide a secret in numbers",
      must: [
        "Modular arithmetic means \"take the remainder\" and wraps around like a clock: a ≡ b (mod n) means a and b leave the same remainder when divided by n.",
        "A Caesar cipher has only 25 keys, so you can try them all (brute force).",
        "Frequency analysis: E, T, A and O are the most common letters in English, but statistics can mislead when the sample is short.",
        "A multiplicative cipher needs a coprime to 26, otherwise it cannot be decrypted; decryption uses the modular inverse.",
        "Every integer greater than 1 factors uniquely into primes (the fundamental theorem of arithmetic).",
        "Multiplying two large primes is easy, but factoring the product back is extremely hard: the foundation of modern cryptography.",
        "A public key can be shared with everyone for encryption; only the private key can decrypt.",
        "Security mindset: the algorithm is public and only the key is secret (Kerckhoffs's principle)."
      ],
      formulas: [
        ["Caesar", "C = (P + k) mod 26; P = (C − k) mod 26"],
        ["Multiplicative cipher", "C = a·P mod 26, with gcd(a, 26) = 1; e.g. 3 × 9 = 27 ≡ 1, so the inverse of 3 is 9"],
        ["Euclidean algorithm", "gcd(a, b) = gcd(b, a mod b)"],
        ["RSA", "n = p·q; φ(n) = (p−1)(q−1); choose e coprime to φ(n); d ≡ e⁻¹ (mod φ(n))"],
        ["", "encrypt c = mᵉ mod n; decrypt m = cᵈ mod n"],
        ["Level 5", "p=5, q=11, n=55, φ=40, e=3, d=27 (3×27=81≡1 mod 40)"],
        ["BOSS", "n=91=7×13, φ=72, e=5, d=29 (5×29=145≡1 mod 72)"],
        ["Euler's theorem", "if gcd(m,n)=1 then m^φ(n) ≡ 1 (mod n), which is why RSA recovers the message"]
      ],
      lit: [
        "Suetonius, The Twelve Caesars, records Caesar's shift cipher",
        "Al-Kindi (9th century), A Manuscript on Deciphering Cryptographic Messages: the earliest frequency analysis",
        "Turing and Bletchley Park break Enigma (World War II)",
        "Shannon (1949) \"Communication Theory of Secrecy Systems\"",
        "Diffie & Hellman (1976) \"New Directions in Cryptography\": the idea of public keys",
        "Rivest, Shamir & Adleman (1978) CACM \"A Method for Obtaining Digital Signatures and Public-Key Cryptosystems\"",
        "Shor (1994): quantum computers could factor large numbers quickly → post-quantum cryptography (NIST published FIPS 203 in 2024)"
      ],
      apps: [
        "The padlock in your browser's address bar (HTTPS/TLS)",
        "Mobile payments and digital certificates",
        "Digital signatures: proving a file really came from you",
        "Chips in bank cards and ID cards, blockchain wallets",
        "China's commercial cryptography standards: SM2 (public key), SM4 (block cipher)"
      ]
    },
    chord: {
      nav: "Chords", eyebrow: "Quest 1 · ★★☆ Intermediate",
      title: "Why do some chords sound good",
      must: [
        "Pitch is set by frequency (in Hz); the standard pitch A4 = 440 Hz.",
        "String length is inversely proportional to frequency: halve the string and the frequency doubles, one octave higher.",
        "Simpler frequency ratios sound more consonant: octave 2:1, perfect fifth 3:2, perfect fourth 4:3, major third 5:4, minor third 6:5; the minor second 16:15 is harsh.",
        "Two notes combined repeat on their \"least common multiple\": the simpler the ratio, the sooner the wave repeats and the easier it is for the brain to \"read\".",
        "We hear pitch logarithmically: every time the frequency doubles, it sounds the same step higher.",
        "Any periodic sound can be split into sine waves (a fundamental plus overtones); the strength of the overtones sets the timbre."
      ],
      formulas: [
        ["Mersenne's laws", "f = (1/2L)·√(T/μ) (L string length, T tension, μ linear density)"],
        ["Twelve-tone equal temperament", "semitone ratio r = 2^(1/12) ≈ 1.05946; n semitones up f = f₀·2^(n/12)"],
        ["", "equal-tempered fifth 2^(7/12) ≈ 1.4983 vs the just fifth 1.5, about 2 cents apart"],
        ["Cents", "cents = 1200·log₂(f₂/f₁)"],
        ["Beat frequency", "f_beat = |f₁ − f₂|"],
        ["Fourier series", "f(t) = a₀ + Σ [aₙcos(nωt) + bₙsin(nωt)]; a square wave has only odd harmonics, amplitude ∝ 1/n"]
      ],
      lit: [
        "The Pythagoreans (c. 6th century BC): the legend of string ratios and harmony",
        "Zhu Zaiyu, A New Account of the Science of the Pitch-Pipes (1584): the first exact calculation of equal temperament",
        "Mersenne, Harmonie universelle (1636): the laws of vibrating strings",
        "Fourier, The Analytical Theory of Heat (1822): functions can be expanded in trigonometric series",
        "Helmholtz, On the Sensations of Tone (1863): explained consonance with overtones and beats",
        "Plomp & Levelt (1965) \"Tonal consonance and critical bandwidth\", JASA 38:548–560",
        "Avery Wang (2003) \"An Industrial-Strength Audio Search Algorithm\" (Shazam song recognition)"
      ],
      apps: [
        "Phone tuners and song recognition: real-time spectrum analysis (FFT)",
        "MP3/AAC audio compression: dropping what the ear cannot hear in the frequency domain",
        "Noise-cancelling headphones: an opposite-phase wave cancels the noise",
        "Hospital MRI scans and seismic analysis: both rely on the Fourier transform",
        "Piano tuning: equal temperament lets you play in any key"
      ]
    },
    cat: {
      nav: "Cat", eyebrow: "Quest 2 · ★★★ Challenge",
      title: "Teach an AI to spot a cat",
      must: [
        "Images are numbers: grayscale pixels run 0–255, color has three RGB layers; a 28×28 image is a vector of 784 numbers.",
        "Each sample is a point in space, and its features are the coordinates.",
        "A linear classifier separates two classes with a line (a \"hyperplane\" in higher dimensions).",
        "A loss function measures \"how wrong\"; learning means making the loss smaller.",
        "Gradient descent: take a small step in the steepest downhill direction, again and again. Too large a learning rate oscillates; too small is slow.",
        "When no straight line separates the data, you can \"lift to a higher dimension\" or stack layers of neurons.",
        "Neural network = many \"weighted sum + activation function\" units stacked together; backpropagation is the chain rule.",
        "Biased data makes a biased model: an AI only learns what you feed it."
      ],
      formulas: [
        ["Decision boundary", "w₁x₁ + w₂x₂ + b = 0; > 0 means cat, < 0 means dog"],
        ["Mean squared error", "L = (1/n)·Σ(ŷᵢ − yᵢ)²"],
        ["Gradient descent", "θ ← θ − η·∇L (η is the learning rate)"],
        ["Perceptron rule", "when wrong, w ← w + η·y·x"],
        ["Lifting example", "(x₁, x₂) → (x₁, x₂, x₁² + x₂²) makes ring-shaped data separable by a plane"],
        ["Neuron", "a = σ(w·x + b); sigmoid σ(z) = 1/(1+e^(−z)); ReLU(z) = max(0, z)"]
      ],
      lit: [
        "McCulloch & Pitts (1943) \"A Logical Calculus of the Ideas Immanent in Nervous Activity\"",
        "Rosenblatt (1958) \"The Perceptron\"",
        "Minsky & Papert (1969), Perceptrons: a single-layer perceptron cannot learn XOR",
        "Rumelhart, Hinton & Williams (1986) Nature \"Learning representations by back-propagating errors\"",
        "Cybenko (1989): the universal approximation theorem",
        "Cortes & Vapnik (1995), support vector machines (the kernel trick = lifting to a higher dimension)",
        "LeCun et al. (1998) \"Gradient-based learning applied to document recognition\" (LeNet, MNIST handwritten digits)",
        "Le et al. (2012) Google Brain \"Building high-level features using large scale unsupervised learning\": a \"cat-face neuron\" learned on its own from YouTube videos",
        "Krizhevsky, Sutskever & Hinton (2012) AlexNet: deep learning wins ImageNet"
      ],
      apps: [
        "Face unlock on phones, photo albums sorted by person or pet",
        "Computer-aided medical imaging (lung nodules, retinal disease)",
        "Self-driving cars recognizing pedestrians and traffic lights",
        "Spam filtering, identifying objects from a photo, photo-based homework search"
      ]
    },
    casino: {
      nav: "Casino", eyebrow: "Quest 7 · ★★★ Challenge",
      title: "Why does the casino always win? (Probability · statistics)",
      must: [
        "Frequency and probability: the more you flip, the closer the frequency gets to the probability; a few trials can swing wildly.",
        "Classical probability: two dice have 6×6 = 36 equally likely outcomes, and 6 of them sum to 7, the most common total.",
        "Expected value: the average you get per play after very, very many plays.",
        "House edge: betting red on European roulette has expected value −1/37 ≈ −2.7%; the green 0 is the casino's profit.",
        "Law of large numbers: the more plays, the closer the average result gets to the expected value.",
        "Gambler's fallacy: after 5 blacks in a row, the chance of red next is still 18/37.",
        "Random walks and gambler's ruin: with a negative expectation against unlimited funds, playing on almost surely loses everything.",
        "Monte Carlo simulation: estimating hard-to-compute probabilities with many random trials."
      ],
      formulas: [
        ["Classical probability", "P = favourable outcomes ÷ all equally likely outcomes"],
        ["Expected value", "E = Σ xᵢ·pᵢ"],
        ["Betting 1 on red", "E = 1×18/37 − 1×19/37 = −1/37"],
        ["House edge", "= (ticket price − E) ÷ ticket price"],
        ["Gambler's ruin (from i to N, r = q/p)", "P(success) = (1 − rⁱ) ÷ (1 − rᴺ)"]
      ],
      lit: [
        "Letters between Pascal and Fermat, 1654 (the problem of points)",
        "Jakob Bernoulli, Ars Conjectandi, 1713 (the law of large numbers)",
        "W. Feller, An Introduction to Probability Theory and Its Applications, 1950"
      ],
      apps: ["Insurance pricing", "Lotteries and gacha draws in games", "Weather forecasts", "Financial risk management"]
    },
    epidemic: {
      nav: "Epidemics", eyebrow: "Quest 8 · ★★★★ Intermediate",
      title: "Why do epidemics break out? (Exponentials · logarithms · networks · SIR modeling)",
      must: [
        "Rⁿ is the number of new cases in generation n: R>1 an outbreak, R=1 steady, R<1 it dies out on its own.",
        "Sum of a geometric series: 1+R+…+Rⁿ = (Rⁿ⁺¹−1)/(R−1).",
        "Doubling time T = ln2/ln(1+r) ≈ 70/growth rate in %.",
        "Logarithms turn multiplication into addition: on a log scale, exponential growth is a straight line.",
        "Populations are networks: dots are people, lines are contacts, degree is the number of contacts; hubs (superspreaders) speed up spread.",
        "Herd immunity threshold = 1 − 1/R₀: about 67% when R₀=3, about 93% for measles with R₀≈15.",
        "SIR model: susceptible S → infected I → recovered R, R₀ = β/γ; infections start to fall once S/N < 1/R₀.",
        "Flattening the curve: lower and delay the peak so cases stay below hospital capacity. Modeling = assume → equations → simulate → test → improve."
      ],
      formulas: [
        ["Generation n", "Rⁿ"],
        ["Geometric sum", "Sₙ = (Rⁿ⁺¹ − 1) ÷ (R − 1)"],
        ["Doubling time", "T = ln2 ÷ ln(1 + r) ≈ 70 ÷ r%"],
        ["Herd immunity threshold", "H = 1 − 1/R₀"],
        ["SIR", "dS/dt = −βSI/N, dI/dt = βSI/N − γI, dR/dt = γI"],
        ["Basic reproduction number", "R₀ = β ÷ γ"]
      ],
      lit: [
        "Kermack & McKendrick, A Contribution to the Mathematical Theory of Epidemics, 1927 (the SIR model)",
        "Anderson & May, Infectious Diseases of Humans, 1991",
        "Barabási & Albert, Emergence of Scaling in Random Networks, 1999 (scale-free networks)",
        "R₀ values are common estimated ranges: influenza about 1–2, measles about 12–18 (public WHO / US CDC material)"
      ],
      apps: ["Public health and vaccination strategy", "How rumours and information spread", "Adoption of products and new technology", "Protecting against computer viruses", "Staggered commuting and power-grid load"],
      note: "This quest uses simplified mathematical models to understand spread; it does not give medical advice."
    },
    rocket: {
      nav: "Rocket", eyebrow: "Quest 9 · ★★★★ Intermediate",
      title: "How does a rocket reach the Moon? (Derivatives · integrals · the rocket equation · differential equations)",
      must: [
        "Average velocity = Δh ÷ Δt, the slope of a secant line on the height–time graph.",
        "Shrink the time window to 0 and the secant becomes a tangent: the slope of the tangent is the instantaneous velocity.",
        "Derivative h′(t) = lim (h(t+Δt) − h(t)) ÷ Δt; h = 5t² → v = 10t.",
        "Power rule: the derivative of tⁿ is n·tⁿ⁻¹; differentiate velocity again to get acceleration.",
        "Area under the velocity–time graph = distance; slice the rectangles ever thinner and the Riemann sum → the integral.",
        "Fundamental theorem of calculus: differentiation and integration undo each other.",
        "Rocket equation Δv = vₑ · ln(m₀/m_f): split the fuel infinitely finely and the sum becomes the natural logarithm ln.",
        "Lunar trajectory: gravity sets the acceleration, and a computer solves the differential equation numerically in tiny steps; the burn timing is the lead angle."
      ],
      formulas: [
        ["Average velocity", "v̄ = Δh ÷ Δt"],
        ["Derivative", "h′(t) = lim(Δt→0) [h(t+Δt) − h(t)] ÷ Δt"],
        ["Power rule", "(tⁿ)′ = n·tⁿ⁻¹"],
        ["Integral", "∫₀ᵀ 10t dt = 5T²"],
        ["Rocket equation", "Δv = vₑ · ln(m₀ / m_f)"],
        ["Universal gravitation", "a = −GM·r / |r|³"]
      ],
      lit: [
        "Newton, Philosophiæ Naturalis Principia Mathematica, 1687",
        "Leibniz, Nova Methodus pro Maximis et Minimis, 1684 (differential calculus)",
        "Tsiolkovsky, The Exploration of Cosmic Space by Means of Reaction Devices, 1903 (the rocket equation)",
        "Apollo 11's trans-lunar burn added about 3.1 km/s and the trip took about 3 days (public NASA material, approximate)"
      ],
      apps: ["Spacecraft trajectory design", "Car speed measurement and navigation", "Kinematics in physics", "Marginal and cumulative quantities in economics", "Numerical weather prediction"],
      note: "This quest uses a simplified model (a plane, with only Earth's and the Moon's gravity) to understand calculus; figures are approximate."
    },
    cube: {
      nav: "Cube", eyebrow: "Quest 10 · ★★★★★ Challenge",
      title: "Why can a Rubik's cube be solved? (Symmetry · permutations · commutators · groups)",
      must: [
        "Symmetry = a transformation that leaves a shape looking the same; a square has 8 symmetries (D₄).",
        "Moves can be \"multiplied\" like numbers: doing one after another is composition, and e means doing nothing.",
        "Group: closure, associativity, an identity e, and an inverse for every element; it need not be commutative.",
        "Order matters: rf ≠ fr; to undo, go in reverse, (AB)⁻¹ = B⁻¹A⁻¹.",
        "A permutation splits into disjoint cycles; its order = the least common multiple of the cycle lengths.",
        "n objects can be arranged in n! ways; 7 cards in 5040 ways.",
        "The commutator [A,B] = A B A⁻¹ B⁻¹ changes only a few pieces and is the heart of cube algorithms.",
        "Cube turns preserve \"parity\": a randomly reassembled 3×3 cube is solvable only 1/12 of the time; God's number is 20."
      ],
      formulas: [
        ["Symmetries of a square", "r⁴ = e, f² = e, 8 in all"],
        ["Order of inverses", "(AB)⁻¹ = B⁻¹A⁻¹"],
        ["Order", "lcm(cycle lengths)"],
        ["Permutations", "n! = n × (n−1) × … × 1"],
        ["Commutator", "[A, B] = A B A⁻¹ B⁻¹"],
        ["Number of states", "2×2×2: 3,674,160; 3×3: about 4.3×10¹⁹"]
      ],
      lit: [
        "Joyner, Adventures in Group Theory: Rubik's Cube, Merlin's Machine, and Other Mathematical Toys, 2008",
        "Rokicki, Kociemba, Davidson & Dethridge, The Diameter of the Rubik's Cube Group Is Twenty, 2010/2013",
        "Singmaster, Notes on Rubik's Magic Cube, 1981"
      ],
      apps: ["Symmetry of crystals and molecules", "Permutations in cryptography", "Card-shuffle magic", "Robot motion planning", "Symmetry in quantum physics"],
      note: "The number of cube states and \"God's number\" come from published mathematical literature."
    }
  }
};
MA_I18N.add({
  "星图知识笔记": "Math Atlas · Knowledge notes",
  "🏠 主页": "🏠 Home", "✦ 知识星图": "✦ Knowledge map", "🎵": "🎵", "🎨 主题": "🎨 Theme", "💬 反馈": "💬 Feedback",
  "知识笔记": "Knowledge notes",
  "每个任务一页：先看必须掌握，再记公式。点一下卡片，标记“我懂了”。": "One page per quest: start with the must-knows, then the formulas. Tap a card to mark it \"Got it\".",
  "@选择任务": "Choose a quest",
  "星图 Math Atlas 测试版 · 最近更新 2026-10-22 · 年级与难度为估算": "Math Atlas beta · last updated 2026-10-22 · grades and difficulty are estimates",
  "© 2026 星图 Math Atlas · 创世计划 Genesis ·": "© 2026 Math Atlas · Genesis ·",
  "·": "·", "许可": "License", "已复制到剪贴板": "Copied to clipboard"
});
