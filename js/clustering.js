// --- DATA SETUP ---
const canvas = document.getElementById('clusterCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// Colors for clusters
const COLORS = ['#EF4444', '#10B981', '#3B82F6']; // Red, Green, Blue
const GRAY = '#D1D5DB';

// Generate synthetic data around 3 hidden centers
const hiddenCenters = [
    { x: 120, y: 120 },
    { x: 380, y: 160 },
    { x: 250, y: 320 }
];

const points = [];
// Helper to generate random number with normal-ish distribution
function randomNormal(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Create 20 points per cluster
hiddenCenters.forEach(center => {
    for (let i = 0; i < 25; i++) {
        points.push({
            x: Math.max(20, Math.min(width - 20, randomNormal(center.x, 35))),
            y: Math.max(20, Math.min(height - 20, randomNormal(center.y, 35))),
            cluster: -1 // Unassigned initially
        });
    }
});

// Fixed initial positions for centroids to make the demo clear
const initialCentroids = [
    { x: 80, y: 80 },
    { x: 400, y: 80 },
    { x: 150, y: 350 }
];

// --- STEP DEFINITIONS ---
const steps = [
    {
        title: "1. Raw Data",
        desc: "In unsupervised learning, we start with unlabeled data. We want the computer to find patterns on its own. Notice how these points naturally form groups.",
        showEq: false,
        action: () => drawState(points, [], -1) // Unassigned, no centroids
    },
    {
        title: "2. Initialize Centroids",
        desc: "We randomly drop 'K' number of points onto the graph (here, K=3). These are called 'Centroids'. They will act as the initial centers of our future clusters.",
        showEq: false,
        action: () => drawState(points, initialCentroids, -1) // Unassigned, show init centroids
    },
    {
        title: "3. Assign Points",
        desc: "Every gray data point calculates its distance to the 3 centroids and assigns itself to the closest one. The points are now colored!",
        showEq: false,
        action: () => {
            assignPointsToCentroids(points, initialCentroids);
            drawState(points, initialCentroids, 1);
        }
    },
    {
        title: "4. Update Centroids",
        desc: "Now, the centroids look at all the points in their cluster and move themselves exactly to the middle (the average position) of their points.",
        showEq: false,
        action: () => {
            const newCentroids = calculateNewCentroids(points, initialCentroids);
            drawState(points, newCentroids, 1);
        }
    },
    {
        title: "5. Converged",
        desc: "Steps 3 and 4 repeat automatically. Points are reassigned, centroids move again. This stops when centroids no longer move. The data is now perfectly clustered!",
        showEq: false,
        action: () => {
            let currentCentroids = calculateNewCentroids(points, initialCentroids);
            assignPointsToCentroids(points, currentCentroids);
            let finalCentroids = calculateNewCentroids(points, currentCentroids);
            drawState(points, finalCentroids, 1);
        }
    },
    {
        title: "6. The Mathematics",
        desc: "How does the algorithm know it's done? It uses this equation to measure how 'tight' the clusters are. It tries to make the sum of the squared distances as small as possible.",
        showEq: true,
        action: () => {
            // Same visual state as step 5
            let currentCentroids = calculateNewCentroids(points, initialCentroids);
            assignPointsToCentroids(points, currentCentroids);
            let finalCentroids = calculateNewCentroids(points, currentCentroids);
            drawState(points, finalCentroids, 1);
        }
    }
];

let currentStep = 0;

// --- ALGORITHM LOGIC ---
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

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

function calculateNewCentroids(pts, cents) {
    let sums = [{ x: 0, y: 0, count: 0 }, { x: 0, y: 0, count: 0 }, { x: 0, y: 0, count: 0 }];
    pts.forEach(p => {
        if (p.cluster !== -1) {
            sums[p.cluster].x += p.x;
            sums[p.cluster].y += p.y;
            sums[p.cluster].count += 1;
        }
    });
    return sums.map((s, i) => {
        if (s.count === 0) return { x: cents[i].x, y: cents[i].y }; // Don't move if empty
        return { x: s.x / s.count, y: s.y / s.count };
    });
}

// --- DRAWING LOGIC ---
function drawState(pts, cents, assignmentLevel) {
    ctx.clearRect(0, 0, width, height);

    // Draw points
    pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        if (assignmentLevel === -1 || p.cluster === -1) {
            ctx.fillStyle = GRAY;
        } else {
            ctx.fillStyle = COLORS[p.cluster];
        }
        ctx.fill();
        ctx.closePath();
    });

    // Draw centroids
    cents.forEach((c, i) => {
        // Outer glow
        ctx.beginPath();
        ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[i] + '40'; // Add transparency
        ctx.fill();
        ctx.closePath();

        // Inner star/cross
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[i];
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    });
}

// --- UI INTERACTION ---
const titleEl = document.getElementById('step-title');
const descEl = document.getElementById('step-desc');
const eqContainer = document.getElementById('equation-container');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const indicators = document.querySelectorAll('.indicator');
const contentContainer = document.getElementById('step-content');

function updateUI() {
    // Content animation
    contentContainer.classList.remove('fade-enter-active');
    contentContainer.classList.add('fade-enter');

    setTimeout(() => {
        const step = steps[currentStep];
        titleEl.innerText = step.title;
        descEl.innerText = step.desc;

        if (step.showEq) {
            eqContainer.classList.remove('hidden');
        } else {
            eqContainer.classList.add('hidden');
        }

        step.action();

        contentContainer.classList.remove('fade-enter');
        contentContainer.classList.add('fade-enter-active');
    }, 50);

    // Update buttons
    btnPrev.disabled = currentStep === 0;
    btnNext.disabled = currentStep === steps.length - 1;

    // Update indicators
    indicators.forEach((ind, i) => {
        if (i === currentStep) {
            ind.className = 'h-2 w-8 rounded-full bg-blue-600 indicator transition-all duration-300';
        } else {
            ind.className = 'h-2 w-2 rounded-full bg-gray-300 indicator transition-all duration-300';
        }
    });
}

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

// Initial render
updateUI();