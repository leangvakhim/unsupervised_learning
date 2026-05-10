// <!-- Application Logic -->
// --- 1. Data and State Setup ---

// Generate correlated 2D data
const numPoints = 100;
let points = [];
let projectedPoints = []; // For animation
let animationProgress = 0;
let animationFrameId;

function generateData() {
    points = [];
    // Create a diagonal spread of points (y ≈ x)
    for (let i = 0; i < numPoints; i++) {
        // x goes roughly from -150 to 150
        let x = (Math.random() - 0.5) * 300;
        // y is tightly correlated to x plus some noise
        let noise = (Math.random() - 0.5) * 60;
        let y = x * 0.8 + noise;
        points.push({ x: x, y: y });
    }
}
generateData();

// Step Definitions
const steps = [
    {
        title: "What is Dimensionality Reduction?",
        text: `<p>Imagine you have a detailed 3D object, like a teapot. If you shine a light on it from the perfect angle, the 2D shadow it casts on the wall still looks exactly like a teapot!</p>
                <p>In Unsupervised Machine Learning, <b>Dimensionality Reduction</b> is exactly that: finding the "perfect angle" to squash highly complex data into fewer dimensions (e.g., from 100D to 2D), while preserving the most important underlying patterns.</p>`,
        view: 'intro'
    },
    {
        title: "The Problem: Too Many Dimensions",
        text: `<p>Let's look at a simpler example. Here is a dataset with <b>two dimensions</b> (Features X and Y).</p>
                <p>Notice how the data forms a diagonal band? The two features are highly correlated. They move together. This means we are using two variables to store information that essentially follows one main path.</p>
                <p>Can we represent this data using just <b>one dimension</b> to save memory and compute power?</p>`,
        view: 'canvas',
        drawPhase: 'scatter'
    },
    {
        title: "Finding the Principal Components",
        text: `<p>To reduce the data, we use <b>Principal Component Analysis (PCA)</b>.</p>
                <p>PCA looks for new "axes" (lines) where the data varies the most.</p>
                <ul class="list-disc pl-5 mt-2 space-y-2">
                    <li><span class="text-rose-600 font-bold">PC1 (Red Line):</span> The direction of maximum variance. It captures the main shape of the data.</li>
                    <li><span class="text-emerald-500 font-bold">PC2 (Green Line):</span> The direction perpendicular to PC1, capturing the remaining variance (noise).</li>
                </ul>`,
        view: 'canvas',
        drawPhase: 'pca'
    },
    {
        title: "The Mathematical Equation",
        text: `<p>How does the computer actually find these lines and reduce the data?</p>
                <p>It relies on Linear Algebra, specifically analyzing the <b>Covariance Matrix</b> of the data.</p>
                <p>By finding the <i>Eigenvectors</i> of this matrix, we find the directions of our Principal Components. The corresponding <i>Eigenvalues</i> tell us how much "information" is kept in that direction.</p>`,
        view: 'math',
        mathContent: `
            <div class="text-left w-full max-w-sm">
                <p class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">1. Covariance Matrix ($\\Sigma$)</p>
                <p class="mb-6 bg-white p-4 rounded shadow-sm border border-gray-100">$$ \\Sigma = \\frac{1}{n-1} X^T X $$</p>

                <p class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">2. Eigendecomposition</p>
                <p class="mb-6 bg-white p-4 rounded shadow-sm border border-gray-100">$$ \\Sigma \\mathbf{v} = \\lambda \\mathbf{v} $$</p>

                <p class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">3. Projection (Dimensionality Reduction)</p>
                <p class="bg-white p-4 rounded shadow-sm border border-indigo-100 border-l-4 border-l-indigo-500">$$ Z = X \\cdot W $$</p>
                <p class="text-xs text-slate-500 mt-2 italic">Where $Z$ is the new lower-dimensional data, $X$ is the original data, and $W$ is the matrix of top eigenvectors.</p>
            </div>
        `
    },
    {
        title: "The Result: Projection",
        text: `<p>Now, we drop the less important dimension (PC2) and keep only our most important vector (PC1).</p>
                <p>Watch as we <b>project</b> (squish) our 2D points directly onto the 1D red line using our equation $Z = X \\cdot W$.</p>
                <p><b>Result:</b> We successfully compressed our 2D dataset into a 1D dataset without losing the core structure of the information!</p>`,
        view: 'canvas',
        drawPhase: 'project'
    }
];

let currentStep = 0;

// DOM Elements
const titleEl = document.getElementById('step-title');
const descEl = document.getElementById('step-description');
const badgeEl = document.getElementById('step-badge');
const btnNext = document.getElementById('btn-next');
const btnBack = document.getElementById('btn-back');
const dotsContainer = document.getElementById('step-dots');

const canvasEl = document.getElementById('viz-canvas');
const ctx = canvasEl.getContext('2d');
const mathContainer = document.getElementById('math-container');
const introContainer = document.getElementById('intro-container');

// --- 2. Canvas Drawing Logic ---
const width = canvasEl.width;
const height = canvasEl.height;
const centerX = width / 2;
const centerY = height / 2;

function clearCanvas() {
    ctx.clearRect(0, 0, width, height);
}

function drawAxes() {
    ctx.beginPath();
    ctx.strokeStyle = '#e2e8f0'; // slate-200
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    // X axis
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    // Y axis
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawPoints(dataPoints, opacity = 1) {
    ctx.fillStyle = `rgba(14, 165, 233, ${opacity})`; // sky-500
    dataPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(centerX + p.x, centerY - p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPrincipalComponents() {
    // Hardcoded PC lines based on our data generation (y = 0.8x)
    const angle = Math.atan(0.8);
    const length1 = 200;
    const length2 = 50;

    // PC1 (Red Line) - Main variance
    ctx.beginPath();
    ctx.strokeStyle = '#e11d48'; // rose-600
    ctx.lineWidth = 4;
    ctx.moveTo(centerX - Math.cos(angle) * length1, centerY + Math.sin(angle) * length1);
    ctx.lineTo(centerX + Math.cos(angle) * length1, centerY - Math.sin(angle) * length1);
    ctx.stroke();

    // PC2 (Green Line) - Orthogonal variance
    ctx.beginPath();
    ctx.strokeStyle = '#10b981'; // emerald-500
    ctx.lineWidth = 3;
    let orthAngle = angle + Math.PI / 2;
    ctx.moveTo(centerX - Math.cos(orthAngle) * length2, centerY + Math.sin(orthAngle) * length2);
    ctx.lineTo(centerX + Math.cos(orthAngle) * length2, centerY - Math.sin(orthAngle) * length2);
    ctx.stroke();
}

// Calculate projected points onto PC1
function calculateProjections() {
    const angle = Math.atan(0.8);
    const slope = 0.8;
    projectedPoints = points.map(p => {
        // Projection of point (px, py) onto line y = mx
        const px = p.x;
        const py = p.y;
        const m = slope;
        const projX = (px + m * py) / (1 + m * m);
        const projY = m * projX;
        return { x: projX, y: projY, origX: px, origY: py };
    });
}

function animateProjection() {
    clearCanvas();
    drawAxes();
    drawPrincipalComponents();

    // Progress goes from 0 to 1 over time
    animationProgress += 0.015;
    if (animationProgress > 1) animationProgress = 1;

    // Easing function for smooth drop
    const ease = 1 - Math.pow(1 - animationProgress, 3);

    const currentPoints = projectedPoints.map(p => {
        return {
            x: p.origX + (p.x - p.origX) * ease,
            y: p.origY + (p.y - p.origY) * ease
        };
    });

    // Draw faint trailing lines
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)'; // slate-300
    ctx.lineWidth = 1;
    projectedPoints.forEach(p => {
        ctx.beginPath();
        ctx.moveTo(centerX + p.origX, centerY - p.origY);
        ctx.lineTo(centerX + p.origX + (p.x - p.origX) * ease, centerY - (p.origY + (p.y - p.origY) * ease));
        ctx.stroke();
    });

    drawPoints(currentPoints);

    if (animationProgress < 1 && currentStep === 4) {
        animationFrameId = requestAnimationFrame(animateProjection);
    }
}

// --- 3. View Management ---

function updateUI() {
    const step = steps[currentStep];

    // 1. Text Content Updates with simple animation reset
    titleEl.parentNode.classList.remove('fade-enter-active');
    titleEl.parentNode.classList.add('fade-enter');

    // Force reflow
    void titleEl.parentNode.offsetWidth;

    titleEl.innerText = step.title;
    descEl.innerHTML = step.text;
    badgeEl.innerText = `Step ${currentStep + 1} of ${steps.length}`;

    titleEl.parentNode.classList.add('fade-enter-active');

    // --- CRITICAL FIX HERE ---
    // We must tell MathJax to render the inline math that was just injected into descEl.
    // Using window.MathJax.typesetPromise ensures we only call it if it has fully loaded.
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([descEl]).catch(function (err) {
            console.error('MathJax processing error on description text:', err);
        });
    }

    // 2. Buttons and Dots Update
    btnBack.disabled = currentStep === 0;
    btnNext.disabled = currentStep === steps.length - 1;

    dotsContainer.innerHTML = '';
    for (let i = 0; i < steps.length; i++) {
        const dot = document.createElement('div');
        dot.className = `w-2 h-2 rounded-full ${i === currentStep ? 'bg-indigo-600 w-6' : 'bg-gray-300'} transition-all duration-300`;
        dotsContainer.appendChild(dot);
    }

    // 3. View Panel Update (Right Side)
    canvasEl.classList.add('hidden');
    mathContainer.classList.add('hidden');
    introContainer.classList.add('hidden');

    cancelAnimationFrame(animationFrameId);

    if (step.view === 'intro') {
        introContainer.classList.remove('hidden');
        introContainer.classList.add('flex');
    }
    else if (step.view === 'math') {
        mathContainer.classList.remove('hidden');
        mathContainer.innerHTML = step.mathContent;
        // Tell MathJax to process the new HTML equations for the right side
        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([mathContainer]).catch(function (err) {
                console.error('MathJax processing error', err);
            });
        }
    }
    else if (step.view === 'canvas') {
        canvasEl.classList.remove('hidden');
        clearCanvas();
        drawAxes();

        if (step.drawPhase === 'scatter') {
            generateData(); // Reset data so it looks fresh if navigating back
            drawPoints(points);
        }
        else if (step.drawPhase === 'pca') {
            drawPoints(points, 0.4); // Draw points a bit transparently
            drawPrincipalComponents();
        }
        else if (step.drawPhase === 'project') {
            calculateProjections();
            animationProgress = 0;
            animateProjection();
        }
    }
}

// --- 4. Event Listeners ---
btnNext.addEventListener('click', () => {
    if (currentStep < steps.length - 1) {
        currentStep++;
        updateUI();
    }
});

btnBack.addEventListener('click', () => {
    if (currentStep > 0) {
        currentStep--;
        updateUI();
    }
});

// Initialize the first view
updateUI();