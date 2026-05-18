// --- DATA SETUP ---
const canvas = document.getElementById('clusterCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// Visual Colors for clusters matches design standards
const COLORS = ['#EF4444', '#10B981', '#3B82F6']; // Soft Crimson Red, Emerald Green, Bright Blue
const LIGHT_COLORS = ['rgba(239, 68, 68, 0.15)', 'rgba(16, 185, 129, 0.15)', 'rgba(59, 130, 246, 0.15)'];
const GRAY = '#94A3B8'; // Modern slate color for unassigned

// Generate student points centered around 3 hidden student-performance archetypes
// X-axis: Linear Algebra Score (0 to 100 scaled to width)
// Y-axis: Python Programming Score (0 to 100 scaled to height)
const hiddenCenters = [
    { x: 120, y: 300 }, // High Linear Algebra, Low Python (The Theorists)
    { x: 380, y: 280 }, // Low Linear Algebra, Mid Python (The Coders)
    { x: 250, y: 100 }  // Mid Linear Algebra, High Python (The Architects)
];

let points = [];

// Simple normal distribution helper for realistic cluster spread
function randomNormal(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Initialize 75 students (25 per group profile)
function initDataset() {
    points = [];
    hiddenCenters.forEach((center) => {
        for (let i = 0; i < 25; i++) {
            points.push({
                x: Math.max(30, Math.min(width - 40, randomNormal(center.x, 32))),
                y: Math.max(40, Math.min(height - 40, randomNormal(center.y, 32))),
                cluster: -1 // Unassigned initial state
            });
        }
    });
}

initDataset();

// Fixed starting positions for centroids so the steps are highly clean and predictable
const initialCentroids = [
    { x: 80, y: 150 },
    { x: 420, y: 120 },
    { x: 200, y: 350 }
];

// --- CALCULATION HELPER FUNCTIONS ---
// Euclidean distance formula: sqrt((x2-x1)^2 + (y2-y1)^2)
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Minimizes individual distance (Assign phase)
function assignPointsToCentroids(pts, cents) {
    pts.forEach(p => {
        let minDist = Infinity;
        let closestIdx = -1;
        cents.forEach((c, idx) => {
            let dist = getDistance(p, c);
            if (dist < minDist) {
                minDist = dist;
                closestIdx = idx;
            }
        });
        p.cluster = closestIdx;
    });
}

// Updates centroid to mean coordinates of assigned points (Update phase)
function calculateNewCentroids(pts, cents) {
    let sums = [
        { x: 0, y: 0, count: 0 },
        { x: 0, y: 0, count: 0 },
        { x: 0, y: 0, count: 0 }
    ];
    pts.forEach(p => {
        if (p.cluster !== -1) {
            sums[p.cluster].x += p.x;
            sums[p.cluster].y += p.y;
            sums[p.cluster].count += 1;
        }
    });
    return sums.map((s, i) => {
        if (s.count === 0) return { x: cents[i].x, y: cents[i].y };
        return { x: s.x / s.count, y: s.y / s.count };
    });
}

// Objective Function Calculator (J value scoreboard tracker)
function computeObjectiveFunction(pts, cents) {
    let totalJ = 0;
    pts.forEach(p => {
        if (p.cluster !== -1) {
            let assignedCentroid = cents[p.cluster];
            // squared euclidean distance (using pixel scale converted to 0-100 values)
            let dx = (p.x - assignedCentroid.x) / width * 100;
            let dy = (p.y - assignedCentroid.y) / height * 100;
            totalJ += (dx * dx + dy * dy);
        }
    });
    return Math.round(totalJ);
}

const steps = [
    {
        title: "1. The Raw Classroom Data",
        desc: `<p>In Unsupervised Machine Learning, we start with <strong>unlabeled data</strong>. Imagine we have 75 computer science students. We plotted their scores on two assessments:</p>
                <ul class="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Linear Algebra Score ($X$-axis)</strong>: Scales from 0 to 100.</li>
                    <li><strong>Python Programming Score ($Y$-axis)</strong>: Scales from 0 to 100.</li>
                </ul>
                <p class="mt-3">We want to automatically group them into 3 optimized project teams ($K=3$), but currently, we don't know who belongs where. Every student is unassigned (colored Gray).</p>`,
        showEq: false,
        eqContent: "",
        action: () => {
            points.forEach(p => p.cluster = -1);
            drawState(points, [], false);
            updateScoreboard(null);
        }
    },
    {
        title: "2. Initialize Random Centroids",
        desc: `<p>The algorithm starts by dropping $K=3$ randomized target markers onto the graph. These are called <strong>Centroids</strong> ($\\mu_1, \\mu_2, \\mu_3$).</p>
                <p class="mt-3">Think of centroids as the "hypothetical group leaders" or target student profiles for Team A (Red), Team B (Green), and Team C (Blue). Right now, they are placed in random starting positions and have no assigned students yet.</p>`,
        showEq: false,
        eqContent: "",
        action: () => {
            points.forEach(p => p.cluster = -1);
            drawState(points, initialCentroids, false);
            updateScoreboard(null);
        }
    },
    {
        title: "3. Assign Students (Euclidean Distance)",
        desc: `<p>Next, the algorithm runs the <strong>Assignment Phase</strong>. Every single student calculates their straight-line distance to all 3 centroids. They automatically assign themselves to the nearest profile.</p>
                <p class="mt-3">We use the <strong>Euclidean Distance</strong> formula, which is the Pythagorean theorem in 2D space:</p>`,
        showEq: true,
        eqContent: `
            <p class="text-sm text-slate-500 mb-2 font-semibold">Distance Formula:</p>
            <div class="overflow-x-auto text-center font-serif text-lg py-2">
                $$d = \\sqrt{(x_{student} - \\mu_x)^2 + (y_{student} - \\mu_y)^2}$$
            </div>
            <p class="text-xs text-slate-500 mt-2"><strong>Example:</strong> If Student 1 has scores $(80, 60)$ and Centroid A is at $(50, 50)$, their distance is:
            $$d_A = \\sqrt{(80-50)^2 + (60-50)^2} = \\sqrt{30^2 + 10^2} \\approx 31.62$$</p>
        `,
        action: () => {
            assignPointsToCentroids(points, initialCentroids);
            drawState(points, initialCentroids, true);
            updateScoreboard(initialCentroids);
        }
    },
    {
        title: "4. Update Centroids (The Mean Formula)",
        desc: `<p>With teams temporarily formed, the initial random centroids are no longer optimal. The algorithm now runs the <strong>Update Phase</strong>, recalculating the center point of each team.</p>
                <p class="mt-3">It calculates the <strong>mathematical mean (average)</strong> of all student coordinates belonging to that team, and moves the centroid to that exact average coordinate.</p>`,
        showEq: true,
        eqContent: `
            <p class="text-sm text-slate-500 mb-2 font-semibold">The Centroid Mean Formula:</p>
            <div class="overflow-x-auto text-center font-serif text-lg py-2">
                $$\\mu_j = \\left( \\frac{1}{n_j} \\sum_{i \\in C_j} x_i, \\; \\frac{1}{n_j} \\sum_{i \\in C_j} y_i \\right)$$
            </div>
            <p class="text-xs text-slate-500 mt-2">Where $n_j$ is the total count of students in team $j$, and the summation calculates the sum of all their Linear Algebra ($x$) and Python ($y$) scores.</p>
        `,
        action: () => {
            assignPointsToCentroids(points, initialCentroids);
            const newCentroids = calculateNewCentroids(points, initialCentroids);
            drawState(points, newCentroids, true);
            updateScoreboard(newCentroids);
        }
    },
    {
        title: "5. Repeat Until Convergence",
        desc: `<p>The assignment and update loops repeat automatically. Because the centroids moved, some students are now closer to a different team leader than before. They swap teams, and the centroids recalculate again.</p>
                <p class="mt-3">This loop keeps going until the centroids <strong>stop moving</strong> entirely. This state of ultimate balance is called <strong>Convergence</strong>. The algorithm has successfully found our 3 optimized project teams!</p>`,
        showEq: false,
        eqContent: "",
        action: () => {
            let currentCentroids = JSON.parse(JSON.stringify(initialCentroids));
            let oldCentroids;
            // Run loop until coordinates converge (approx stable within 0.1 px)
            let iterations = 0;
            do {
                oldCentroids = JSON.parse(JSON.stringify(currentCentroids));
                assignPointsToCentroids(points, currentCentroids);
                currentCentroids = calculateNewCentroids(points, currentCentroids);
                iterations++;
            } while (iterations < 100 && getDistance(oldCentroids[0], currentCentroids[0]) > 0.1);

            drawState(points, currentCentroids, true);
            updateScoreboard(currentCentroids);
        }
    },
    {
        title: "6. The Scoreboard (Objective Function)",
        desc: `<p>How does the machine define mathematical "good clustering"? It evaluates your objective function, $J$. This measures the "tightness" of the teams.</p>
                <p class="mt-2">Our ultimate goal is to <strong>minimize $J$</strong>, reducing total variance within teams to make teammates as complementary and similarly-skilled as possible.</p>`,
        showEq: true,
        eqContent: `
            <p class="text-sm text-slate-500 mb-2 font-semibold">The Cost Objective Function (Inertia):</p>
            <div class="overflow-x-auto text-center font-serif text-lg py-1">
                $$J = \\sum_{j=1}^{K} \\sum_{i \\in C_j} || x_i - \\mu_j ||^2$$
            </div>
            <ul class="text-xs text-slate-600 space-y-1 mt-2 list-none">
                <li><span class="font-bold text-blue-600">$J$</span> = Total cost (lower is tighter/better)</li>
                <li><span class="font-bold">$K$</span> = Number of clusters (which is 3)</li>
                <li><span class="font-bold">$x_i - \\mu_j$</span> = Distance from student to team center</li>
            </ul>
        `,
        action: () => {
            let currentCentroids = JSON.parse(JSON.stringify(initialCentroids));
            let iterations = 0;
            while (iterations < 20) {
                assignPointsToCentroids(points, currentCentroids);
                currentCentroids = calculateNewCentroids(points, currentCentroids);
                iterations++;
            }
            drawState(points, currentCentroids, true, true); // draw explicit helper lines
            updateScoreboard(currentCentroids);
        }
    },
    {
        title: "7. The Mathematical Proof of Minimization",
        desc: `<p>To mathematically prove that updating centroids to the Mean <strong>guarantees</strong> that $J$ drops, let's look at a micro-classroom of <strong>4 students</strong> scoring from 0 to 10 in two subjects:</p>
                <ul class="list-disc pl-5 space-y-1 text-xs mt-2">
                    <li>Student 1: $(2, 2)$ | Student 2: $(3, 2)$ [Team 1]</li>
                    <li>Student 3: $(8, 8)$ | Student 4: $(9, 8)$ [Team 2]</li>
                </ul>
                <p class="mt-3 font-semibold text-slate-800 text-sm">Step A: Raw starting cost with random centroids at $\\mu_1(1,1)$ and $\\mu_2(7,7)$:</p>
                <p class="text-xs text-slate-600 bg-slate-100 p-2 rounded">
                    $J_{initial} = \\sum ||x_i - \\mu_j||^2$<br>
                    $J_{initial} = [(2-1)^2+(2-1)^2] + [(3-1)^2+(2-1)^2] + [(8-7)^2+(8-7)^2] + [(9-7)^2+(8-7)^2]$<br>
                    $J_{initial} = [1+1] + [4+1] + [1+1] + [4+1] = 2 + 5 + 2 + 5 = \\mathbf{14}$
                </p>`,
        showEq: true,
        eqContent: `
            <p class="text-sm text-slate-800 mb-2 font-semibold">Step B: Recalculating Centroids via the Mean:</p>
            <p class="text-xs text-slate-600 mb-3 bg-white p-2 border border-slate-200 rounded">
                New $\\mu_1 = \\left( \\frac{2+3}{2}, \\frac{2+2}{2} \\right) = (2.5, 2)$<br>
                New $\\mu_2 = \\left( \\frac{8+9}{2}, \\frac{8+8}{2} \\right) = (8.5, 8)$
            </p>
            <p class="text-sm text-slate-800 mb-2 font-semibold">Step C: Dynamic New Objective Cost ($J_{new}$):</p>
            <div class="text-xs text-slate-600 bg-emerald-50 border border-emerald-100 p-2 rounded overflow-x-auto my-2">
                $$J_{new} = [(2-2.5)^2 + 0] + [(3-2.5)^2 + 0] + [(8-8.5)^2 + 0] + [(9-8.5)^2 + 0]$$
                $$J_{new} = 0.25 + 0.25 + 0.25 + 0.25 = 1.00$$
            </div>
            <p class="text-xs text-emerald-700 font-bold mt-2">✔ Proof Complete: Cost $J$ dropped dramatically from 14 to 1!</p>
        `,
        action: () => {
            let currentCentroids = JSON.parse(JSON.stringify(initialCentroids));
            let iterations = 0;
            while (iterations < 20) {
                assignPointsToCentroids(points, currentCentroids);
                currentCentroids = calculateNewCentroids(points, currentCentroids);
                iterations++;
            }
            drawState(points, currentCentroids, true, true);
            updateScoreboard(currentCentroids);
        }
    },
    {
        title: "8. Python Implementation (Scikit-Learn)",
        desc: `<p>Now that you understand the raw mathematics, how do we actually do this in the real world? Data Scientists use a Python library called <strong>scikit-learn</strong>.</p>
                <p class="mt-3 mb-2">Instead of calculating distances and means manually, Python handles the entire loop in just three lines of code!</p>`,
        showEq: true,
        eqContent: `
            <div class="bg-slate-900 rounded-xl p-4 text-left overflow-x-auto text-xs text-slate-50 font-mono shadow-inner mb-4">
                <span class="text-rose-400">import</span> numpy <span class="text-rose-400">as</span> np<br>
                <span class="text-rose-400">from</span> sklearn.cluster <span class="text-rose-400">import</span> KMeans<br><br>
                <span class="text-slate-400"># 0. Sample Data: [Linear Algebra, Python] scores out of 100</span><br>
                student_scores = np.array([<br>
                &nbsp;&nbsp;&nbsp;&nbsp;[<span class="text-emerald-400">85</span>, <span class="text-emerald-400">92</span>], <span class="text-slate-400"># Student 1</span><br>
                &nbsp;&nbsp;&nbsp;&nbsp;[<span class="text-emerald-400">90</span>, <span class="text-emerald-400">88</span>], <span class="text-slate-400"># Student 2</span><br>
                &nbsp;&nbsp;&nbsp;&nbsp;[<span class="text-emerald-400">20</span>, <span class="text-emerald-400">35</span>], <span class="text-slate-400"># Student 3</span><br>
                &nbsp;&nbsp;&nbsp;&nbsp;[<span class="text-emerald-400">25</span>, <span class="text-emerald-400">40</span>]&nbsp; <span class="text-slate-400"># Student 4</span><br>
                ])<br><br>
                <span class="text-slate-400"># 1. Define we want 3 project teams (K=3)</span><br>
                kmeans = KMeans(n_clusters=<span class="text-emerald-400">3</span>)<br><br>
                <span class="text-slate-400"># 2. Do all the math (Assign, Mean, Converge) automatically!</span><br>
                kmeans.fit(student_scores)<br><br>
                <span class="text-slate-400"># 3. Get the final mathematical results</span><br>
                teams = kmeans.labels_ <span class="text-slate-400"># Which student is in which team?</span><br>
                centroids = kmeans.cluster_centers_ <span class="text-slate-400"># Where are the \\mu coordinates?</span><br>
                cost_J = kmeans.inertia_ <span class="text-slate-400"># What is our final J score?</span>
            </div>
            <ul class="text-xs text-slate-600 space-y-2 list-none">
                <li><span class="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">np.array([])</span> Converts our raw student pairs into a mathematical matrix format that scikit-learn understands.</li>
                <li><span class="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">.fit()</span> Executes the entire assignment & update loop until convergence.</li>
                <li><span class="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">.labels_</span> Gives the final Team A, B, or C assignment for each student.</li>
                <li><span class="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">.inertia_</span> Is exactly the Cost Function ($J$) we just proved!</li>
            </ul>
        `,
        action: () => {
            // Show final converged beautiful state without helper lines for a clean finish
            let currentCentroids = JSON.parse(JSON.stringify(initialCentroids));
            let iterations = 0;
            while (iterations < 20) {
                assignPointsToCentroids(points, currentCentroids);
                currentCentroids = calculateNewCentroids(points, currentCentroids);
                iterations++;
            }
            drawState(points, currentCentroids, true, false);
            updateScoreboard(currentCentroids);
        }
    }
];

let currentStep = 0;

// --- DRAWING LOGIC ON CANVAS ---
function drawState(pts, cents, showAssignedColors, showDistanceLines = false) {
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Axis & Gridlines to represent classroom Scores
    drawGrid();

    // 2. Optional: Draw mathematical distance-to-centroid helper lines
    if (showDistanceLines && cents.length > 0) {
        pts.forEach(p => {
            if (p.cluster !== -1) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(cents[p.cluster].x, cents[p.cluster].y);
                ctx.strokeStyle = COLORS[p.cluster] + '60'; // semi-transparent link lines
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                ctx.setLineDash([]); // Reset
            }
        });
    }

    // 3. Draw Students (Points)
    pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        if (!showAssignedColors || p.cluster === -1) {
            ctx.fillStyle = GRAY;
            ctx.strokeStyle = '#64748B';
        } else {
            ctx.fillStyle = COLORS[p.cluster];
            ctx.strokeStyle = '#FFFFFF';
        }
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    });

    // 4. Draw Group Target Centroids (Triangles for visible difference)
    cents.forEach((c, i) => {
        // outer radial glow ring
        ctx.beginPath();
        ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = LIGHT_COLORS[i];
        ctx.fill();
        ctx.closePath();

        // Draw central targeting icon
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[i];
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        // Draw symbol inside target to stand out
        ctx.beginPath();
        ctx.moveTo(c.x - 4, c.y);
        ctx.lineTo(c.x + 4, c.y);
        ctx.moveTo(c.x, c.y - 4);
        ctx.lineTo(c.x, c.y + 4);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });
}

// Draws beautiful grid coordinates for educational clarity
function drawGrid() {
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;

    // Horizontal & vertical lines
    for (let i = 50; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 40);
        ctx.lineTo(i, height - 30);
        ctx.stroke();
    }
    for (let j = 50; j < height; j += 50) {
        ctx.beginPath();
        ctx.moveTo(40, j);
        ctx.lineTo(width - 30, j);
        ctx.stroke();
    }

    // Draw axis lines
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(width - 20, height - 30); // X-axis
    ctx.moveTo(40, 20);
    ctx.lineTo(40, height - 30); // Y-axis
    ctx.stroke();

    // Label X & Y Axes directly based on student paradigm
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText("LINEAR ALGEBRA SCORE → (0 to 100)", width / 2 - 100, height - 10);

    ctx.save();
    ctx.translate(15, height / 2 + 80);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("PYTHON PROGRAMMING SCORE → (0 to 100)", 0, 0);
    ctx.restore();
}

// Updates live J value scoreboard elements dynamically
function updateScoreboard(centroids) {
    const countRedEl = document.getElementById('count-red');
    const countGreenEl = document.getElementById('count-green');
    const countBlueEl = document.getElementById('count-blue');
    const scoreJEl = document.getElementById('score-j');

    if (!centroids || points[0].cluster === -1) {
        countRedEl.innerText = "0";
        countGreenEl.innerText = "0";
        countBlueEl.innerText = "0";
        scoreJEl.innerText = "N/A";
        return;
    }

    // Calculate active counts
    let r = 0, g = 0, b = 0;
    points.forEach(p => {
        if (p.cluster === 0) r++;
        if (p.cluster === 1) g++;
        if (p.cluster === 2) b++;
    });

    countRedEl.innerText = r;
    countGreenEl.innerText = g;
    countBlueEl.innerText = b;

    // Compute objective function cost
    const currentJ = computeObjectiveFunction(points, centroids);
    scoreJEl.innerText = currentJ;
}

// --- UI STEP CONTROLS ---
const titleEl = document.getElementById('step-title');
const descEl = document.getElementById('step-desc');
const eqContainer = document.getElementById('equation-container');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const indicatorsContainer = document.getElementById('step-indicators');
const contentContainer = document.getElementById('step-content');

// Render dot indicator bar dynamically
function initIndicators() {
    indicatorsContainer.innerHTML = '';
    steps.forEach((_, idx) => {
        const indicator = document.createElement('div');
        indicator.className = `h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300'
            }`;
        indicatorsContainer.appendChild(indicator);
    });
}

function updateUI() {
    contentContainer.classList.remove('fade-enter-active');
    contentContainer.classList.add('fade-enter');

    // Force quick state fade-in timing
    setTimeout(() => {
        const step = steps[currentStep];
        titleEl.innerHTML = step.title;
        descEl.innerHTML = step.desc;

        if (step.showEq) {
            eqContainer.innerHTML = step.eqContent;
            eqContainer.classList.remove('hidden');
        } else {
            eqContainer.classList.add('hidden');
        }

        // Call step-specific visual update callback
        step.action();

        // Re-typeset the dynamically generated LaTeX formulas instantly using MathJax
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise();
        }

        contentContainer.classList.remove('fade-enter');
        contentContainer.classList.add('fade-enter-active');
    }, 50);

    // Update interactive button states
    btnPrev.disabled = currentStep === 0;
    btnNext.disabled = currentStep === steps.length - 1;

    // Redraw step dots
    initIndicators();
}

// Button Event Listeners
btnPrev.addEventListener('click', () => {
    if (currentStep > 0) {
        currentStep--;
        updateUI();
    }
});

btnNext.addEventListener('click', () => {
    if (currentStep < steps.length - 1) {
        currentStep++;
        updateUI();
    }
});

// Initialize display immediately on runtime
window.onload = () => {
    updateUI();
};