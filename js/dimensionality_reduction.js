// <!-- Embedded JavaScript -->
// --- 1. Data and State Setup ---

// Our specific 3-student scenario
// Student 1: 2 hours, 3 score
// Student 2: 4 hours, 5 score
// Student 3: 6 hours, 4 score
const rawPoints = [
    { id: 1, x: 2, y: 3 },
    { id: 2, x: 4, y: 5 },
    { id: 3, x: 6, y: 4 }
];

// Means
const meanX = (2 + 4 + 6) / 3; // 4
const meanY = (3 + 5 + 4) / 3; // 4

// Centered points
const centeredPoints = rawPoints.map(p => ({
    id: p.id,
    x: p.x - meanX,
    y: p.y - meanY
}));

// Final Normalized Eigenvector (PC1)
const eigenvector = { x: 0.96, y: 0.29 };

// State variables for canvas animations
let currentDrawPoints = [];
let projectedPoints = [];
let animationProgress = 0;
let animationFrameId;

// Step Definitions (Content and logic)
const steps = [
    {
        title: "What is Dimensionality Reduction?",
        text: `<p>Dimensionality reduction sounds intimidating, but it is simply a mathematical way to distill information down to its most important elements.</p>
                <p>Imagine you are tracking two metrics for three students:</p>
                <ul class="list-disc pl-5 mt-2 space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <li><b>X:</b> Hours studied</li>
                    <li><b>Y:</b> Quiz score</li>
                </ul>
                <p class="mt-4">Our raw dataset is:<br>
                Student 1: (2 hours, 3 points)<br>
                Student 2: (4 hours, 5 points)<br>
                Student 3: (6 hours, 4 points)</p>
                <p>Let's walk through the math to compress these two variables (2D) into one summary score (1D).</p>`,
        view: 'intro'
    },
    {
        title: "Visualizing the Raw Data",
        text: `<p>First, let's look at our 3 students plotted on a standard 2D graph.</p>
                <p>The X-axis represents <b>Hours Studied</b> and the Y-axis represents <b>Quiz Score</b>.</p>
                <p>Right now, we need two separate numbers (coordinates) to describe the performance of any single student.</p>`,
        view: 'canvas',
        drawPhase: 'raw'
    },
    {
        title: "Step 1: Mean Centering",
        text: `<p>Before analyzing relationships, we must center our data around zero. This puts everything on an even playing field.</p>
                <p>We calculate the mean (average) of both metrics:</p>
                <ul class="list-disc pl-5 space-y-1">
                    <li>Mean of X ($\\mu_x$) = $\\frac{2 + 4 + 6}{3} = 4$</li>
                    <li>Mean of Y ($\\mu_y$) = $\\frac{3 + 5 + 4}{3} = 4$</li>
                </ul>
                <p class="mt-3">We subtract the mean from each point:</p>
                <ul class="list-none space-y-1 font-mono text-sm bg-slate-50 p-3 rounded">
                    <li>S1: (2-4, 3-4) = (-2, -1)</li>
                    <li>S2: (4-4, 5-4) = (0, 1)</li>
                    <li>S3: (6-4, 4-4) = (2, 0)</li>
                </ul>
                <p class="mt-3">Watch the graph shift so the center of the data is perfectly at (0,0).</p>`,
        view: 'canvas',
        drawPhase: 'centering'
    },
    {
        title: "Step 2: Calculating Variances & Covariance",
        text: `<p>Using our newly centered data: <b>S1(-2, -1), S2(0, 1), S3(2, 0)</b>, we can calculate how the data varies.</p>
                <p>Because this is a sample of students ($n = 3$), we divide our sums by $n - 1$ (which is $2$).</p>
                <ul class="list-disc pl-5 mt-3 space-y-2">
                    <li><b>Variance of X:</b> How much does study time vary?</li>
                    <li><b>Variance of Y:</b> How much do quiz scores vary?</li>
                    <li><b>Covariance (X,Y):</b> How do they move <i>together</i>?</li>
                </ul>`,
        view: 'math',
        mathContent: `
            <div class="w-full max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 class="text-lg font-bold text-slate-700 mb-6 text-center">The Math Behind the Relationships</h3>
                <div class="space-y-6">
                    <!-- Var(X) -->
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p class="font-semibold text-slate-700 mb-2">1. Variance of X</p>
                        <div class="overflow-x-auto text-sm sm:text-base">
                            $$Var(X) = \\frac{(-2)^2 + (0)^2 + (2)^2}{3 - 1} = \\frac{4 + 0 + 4}{2} = \\mathbf{4}$$
                        </div>
                    </div>
                    <!-- Var(Y) -->
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p class="font-semibold text-slate-700 mb-2">2. Variance of Y</p>
                        <div class="overflow-x-auto text-sm sm:text-base">
                            $$Var(Y) = \\frac{(-1)^2 + (1)^2 + (0)^2}{3 - 1} = \\frac{1 + 1 + 0}{2} = \\mathbf{1}$$
                        </div>
                    </div>
                    <!-- Cov(X,Y) -->
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p class="font-semibold text-slate-700 mb-2">3. Covariance of X and Y</p>
                        <div class="overflow-x-auto text-sm sm:text-base">
                            $$Cov(X,Y) = \\frac{(-2)(-1) + (0)(1) + (2)(0)}{3 - 1} = \\frac{2 + 0 + 0}{2} = \\mathbf{1}$$
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: "Step 3: Building the Covariance Matrix",
        text: `<p>Now we organize the variance and covariance values we just calculated into the <b>Covariance Matrix ($S$)</b>.</p>
                <p>Think of this matrix like a distance chart on a map, where the rows and columns are your variables (X and Y).</p>
                <ul class="list-disc pl-5 mt-2 space-y-1">
                    <li>Variance of X = <b>4</b> (Top-Left)</li>
                    <li>Variance of Y = <b>1</b> (Bottom-Right)</li>
                    <li>Covariance of X & Y = <b>1</b> (Top-Right & Bottom-Left)</li>
                </ul>
                <p class="mt-4">This perfectly organizes our data's relationships into a compact $2 \\times 2$ mathematical grid.</p>`,
        view: 'math',
        mathContent: `
            <div class="w-full max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 class="text-lg font-bold text-slate-700 mb-4 text-center">Building the Matrix</h3>
                <table class="w-full text-left border-collapse mb-8">
                    <thead>
                        <tr>
                            <th class="border-b-2 p-2"></th>
                            <th class="border-b-2 p-2 font-semibold text-indigo-600">Against X</th>
                            <th class="border-b-2 p-2 font-semibold text-indigo-600">Against Y</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="bg-slate-50">
                            <td class="border-b p-3 font-semibold">Variable X</td>
                            <td class="border-b p-3">Var(X) = <b>4</b></td>
                            <td class="border-b p-3">Cov(X,Y) = <b>1</b></td>
                        </tr>
                        <tr>
                            <td class="border-b p-3 font-semibold">Variable Y</td>
                            <td class="border-b p-3">Cov(Y,X) = <b>1</b></td>
                            <td class="border-b p-3">Var(Y) = <b>1</b></td>
                        </tr>
                    </tbody>
                </table>
                <p class="text-center text-slate-500 font-medium mb-2">Resulting Covariance Matrix ($S$):</p>
                <div class="flex justify-center text-2xl font-bold">
                    $$ S = \\begin{bmatrix} 4 & 1 \\\\ 1 & 1 \\end{bmatrix} $$
                </div>
            </div>
        `
    },
    {
        title: "Step 4: Finding Eigenvalues",
        text: `<p>To find the new "best angle" for our data, we extract <b>Eigenvectors</b> (directions) and <b>Eigenvalues</b> (importance/variance) from our matrix.</p>
                <p>We solve the determinant equation: $\\det(S - \\lambda I) = 0$</p>
                <p>This results in the quadratic equation: $\\lambda^2 - 5\\lambda + 3 = 0$</p>
                <p>Using the quadratic formula, we find two eigenvalues:</p>
                <ul class="list-disc pl-5 mt-2 space-y-2">
                    <li>$\\lambda_1 \\approx 4.30$ <span class="text-sm text-indigo-600 font-bold">(Our Principal Component!)</span></li>
                    <li>$\\lambda_2 \\approx 0.70$</li>
                </ul>
                <p class="mt-4 text-sm text-slate-500 italic">Notice $4.30 + 0.70 = 5$, exactly the sum of the variances $4+1$. Information is preserved!</p>`,
        view: 'math',
        mathContent: `
            <div class="w-full max-w-lg bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <p class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Characteristic Equation</p>
                <div class="overflow-x-auto text-lg mb-6">
                    $$ \\det \\left( \\begin{bmatrix} 4 & 1 \\\\ 1 & 1 \\end{bmatrix} - \\begin{bmatrix} \\lambda & 0 \\\\ 0 & \\lambda \\end{bmatrix} \\right) = 0 $$
                </div>
                <div class="overflow-x-auto text-lg">
                    $$ \\det \\begin{bmatrix} 4 - \\lambda & 1 \\\\ 1 & 1 - \\lambda \\end{bmatrix} = 0 $$
                </div>
            </div>
        `
    },
    {
        title: "Step 5: Finding the Raw Vector",
        text: `<p>To find our actual direction (the <b>Eigenvector</b> $\\mathbf{v}$), we plug our top eigenvalue ($\\lambda = 4.30$) back into the standard equation: $(S - \\lambda I)\\mathbf{v} = 0$.</p>
                <p>This translates to subtracting $4.30$ from the diagonal of our Covariance Matrix, resulting in a system of linear equations.</p>
                <ul class="list-disc pl-5 mt-2 space-y-1">
                    <li>This gives us: $-0.30x + y = 0$, which simplifies to $y = 0.30x$.</li>
                </ul>
                <p class="mt-3">An eigenvector defines a <i>direction</i>, not a specific length. This means there are infinitely many vectors that point along this line (they are scaled versions of each other).</p>
                <p>To get a concrete "raw" vector, we pick an arbitrary value for $x$. The standard practice is to simply set $\\mathbf{x = 1}$.</p>
                <ul class="list-none space-y-1 font-mono text-sm bg-slate-50 p-3 rounded mt-2">
                    <li>If $x = 1$, then $y = 0.30(1) = 0.30$.</li>
                </ul>
                <p class="mt-3">This gives us our raw vector: $\\mathbf{v} = [1, 0.30]^T$.</p>`,
        view: 'math',
        mathContent: `
            <div class="w-full max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 class="text-lg font-bold text-slate-700 mb-4 text-center">Solving the Equation</h3>
                <div class="overflow-x-auto text-sm sm:text-base mb-6 text-center">
                    $$ \\begin{bmatrix} 4 - 4.30 & 1 \\\\ 1 & 1 - 4.30 \\end{bmatrix} \\begin{bmatrix} x \\\\ y \\end{bmatrix} = \\begin{bmatrix} 0 \\\\ 0 \\end{bmatrix} $$
                </div>
                <div class="overflow-x-auto text-sm sm:text-base mb-4 text-center text-slate-600">
                    $$ \\begin{bmatrix} -0.30 & 1 \\\\ 1 & -3.30 \\end{bmatrix} \\begin{bmatrix} x \\\\ y \\end{bmatrix} = \\begin{bmatrix} 0 \\\\ 0 \\end{bmatrix} $$
                </div>
                <div class="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-4">
                    <p class="font-semibold text-slate-700 mb-2">System of Equations:</p>
                    <p class="font-mono text-center mb-2">1) $-0.30x + y = 0 \\implies \\mathbf{y = 0.30x}$</p>
                    <p class="font-mono text-center text-slate-400 text-sm">2) $1x - 3.30y = 0$ <span class="italic">(Yields the same ratio)</span></p>
                    <div class="mt-4 pt-4 border-t border-slate-200">
                        <p class="text-center font-semibold text-indigo-700">Set $x = 1$ to find the raw vector:</p>
                        <div class="text-xl font-bold text-center mt-2">
                            $$ \\mathbf{v}_{raw} = \\begin{bmatrix} 1 \\\\ 0.30 \\end{bmatrix} $$
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: "Step 6: The Magic 1.04 (Normalization)",
        text: `<p>Now that we have our raw directional vector of $(1, 0.30)$, we must <b>Normalize</b> it. We need a "Unit Vector" with a length of exactly 1.0 so we don't accidentally multiply and stretch our data later.</p>
                <p>We use the Pythagorean theorem ($a^2 + b^2 = c^2$) to find the raw length (hypotenuse):</p>
                <p class="bg-slate-50 p-3 rounded font-mono text-center">$\\sqrt{1^2 + 0.30^2} \\approx \\sqrt{1.09} \\approx 1.04$</p>
                <p>Finally, we divide our raw coordinates by 1.04 to shrink the vector's length to exactly 1.0 without changing its direction.</p>
                <ul class="list-disc pl-5 mt-2">
                    <li>$x_{new} = 1 \\div 1.04 = 0.96$</li>
                    <li>$y_{new} = 0.30 \\div 1.04 = 0.29$</li>
                </ul>`,
        view: 'math',
        mathContent: `
            <div class="w-full max-w-lg bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
                <p class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Normalized Principal Component</p>
                <div class="text-2xl font-bold mb-6">
                    $$ \\mathbf{v} = \\begin{bmatrix} 0.96 \\\\ 0.29 \\end{bmatrix} $$
                </div>
                <div class="relative w-48 h-48 border-l-2 border-b-2 border-slate-300 mt-4">
                    <!-- Draw a quick CSS triangle to represent the vector -->
                    <div class="absolute bottom-0 left-0 border-t-2 border-r-2 border-indigo-500 w-full h-[30%] opacity-20"></div>
                    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                        <line x1="0" y1="100" x2="99" y2="70" stroke="#4f46e5" stroke-width="3"/>
                        <polygon points="99,70 91,75 94,70 91,65" fill="#4f46e5" transform="rotate(-16.8, 98, 60)" />

                        <text x="50" y="95" class="text-[10px]" fill="#64748b">x = 0.96</text>
                        <text x="1" y="80" class="text-[10px]" fill="#64748b">y = 0.29</text>
                    </svg>
                </div>
                <p class="text-xs text-slate-400 mt-4">Length is exactly 1.0</p>
            </div>
        `
    },
    {
        title: "Visualizing the Principal Component",
        text: `<p>Let's go back to our centered student data.</p>
                <p>We will now draw our new Normalized Principal Component (the red line) spanning through the data.</p>
                <p>This line represents the direction of maximum variance. It is the "perfect angle" that captures the essence of both Hours Studied and Quiz Scores simultaneously.</p>`,
        view: 'canvas',
        drawPhase: 'pca_line'
    },
    {
        title: "Step 7: The Final Projection",
        text: `<p>Finally, we map our original 3 students onto this new single axis by calculating the dot product of their centered data and our eigenvector.</p>
                <ul class="list-disc pl-5 mt-2 space-y-2 text-sm">
                    <li><b>S1:</b> $(-2 \\times 0.96) + (-1 \\times 0.29) = \\mathbf{-2.21}$</li>
                    <li><b>S2:</b> $(0 \\times 0.96) + (1 \\times 0.29) = \\mathbf{0.29}$</li>
                    <li><b>S3:</b> $(2 \\times 0.96) + (0 \\times 0.29) = \\mathbf{1.92}$</li>
                </ul>
                <p class="mt-4 font-semibold text-indigo-700">Watch the points project onto the line!</p>
                <p>Instead of needing an X and Y axis, we can now rank our students on a single number line. We successfully reduced the dimensionality from 2D to 1D while preserving 86% of the variance!</p>`,
        view: 'canvas',
        drawPhase: 'projection'
    },
    {
        title: "Step 8: Explained Variance",
        text: `<p>We previously mentioned that our 1D projection preserved <b>86%</b> of the original data's variance. But where did that number come from?</p>
                <p>We calculate this using the <b>Eigenvalues ($\\lambda$)</b> from Step 4. An eigenvalue tells us exactly how much "story" or information its corresponding principal component captures.</p>
                <ul class="list-disc pl-5 mt-4 space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <li><b>PC1 (Kept):</b> $\\lambda_1 = 4.30$</li>
                    <li><b>PC2 (Dropped):</b> $\\lambda_2 = 0.70$</li>
                </ul>
                <p class="mt-4">By dividing the eigenvalue we kept by the total of all eigenvalues, we get our exact success rate!</p>`,
        view: 'math',
        mathContent: `
            <div class="w-full max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h3 class="text-xl font-bold text-slate-700 mb-6 text-center">Calculating Preserved Information</h3>

                <div class="flex flex-col space-y-6">
                    <!-- Total Variance -->
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-100 relative">
                        <div class="absolute -left-3 -top-3 bg-slate-200 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm">1</div>
                        <p class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Total Variance</p>
                        <div class="text-xl text-center overflow-x-auto">
                            $$ \\text{Total} = \\lambda_1 + \\lambda_2 = 4.30 + 0.70 = \\mathbf{5.00} $$
                        </div>
                        <p class="text-xs text-center text-slate-400 mt-2 italic">Notice 5.00 is exactly Var(X) + Var(Y) from our initial Covariance Matrix!</p>
                    </div>

                    <!-- Variance Preserved -->
                    <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100 relative">
                        <div class="absolute -left-3 -top-3 bg-indigo-200 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm">2</div>
                        <p class="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-2 text-center">Variance Preserved</p>
                        <div class="text-2xl font-bold text-center text-indigo-700 mt-2 overflow-x-auto">
                            $$ \\frac{\\lambda_1}{\\text{Total}} = \\frac{4.30}{5.00} = \\mathbf{0.86} $$
                        </div>
                    </div>

                    <!-- Final Percentage -->
                    <div class="text-center mt-6 pt-6 border-t border-slate-100">
                        <p class="text-4xl font-extrabold text-emerald-500 drop-shadow-sm mb-2">86%</p>
                        <p class="text-base text-slate-600 font-medium">We dropped <span class="text-rose-500 font-bold">50%</span> of the dimensions (2D to 1D),<br>but kept <span class="text-emerald-600 font-bold">86%</span> of the mathematical story!</p>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: "Step 9: The Python Shortcut",
        text: `<p>In the real world, Data Scientists rarely calculate eigenvalues by hand. Instead, we use a powerful machine learning library in Python called <b>scikit-learn</b>.</p>
                <p>What took us 8 detailed mathematical steps can be executed in just a few lines of code!</p>
                <ul class="list-disc pl-5 mt-4 space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                    <li><b><code class="text-indigo-600 bg-indigo-50 px-1 rounded">PCA(n_components=1)</code>:</b> Tells the algorithm we want to drop from 2D down to 1D.</li>
                    <li><b><code class="text-indigo-600 bg-indigo-50 px-1 rounded">fit_transform(X)</code>:</b> This one function does everything automatically: mean centering, building the covariance matrix, finding eigenvectors, and projecting the data!</li>
                    <li><b><code class="text-indigo-600 bg-indigo-50 px-1 rounded">explained_variance_ratio_</code>:</b> Automatically gives us our <b>86%</b> success rate.</li>
                </ul>
                <p class="mt-4 font-semibold text-slate-700">Because you learned the math first, this code is no longer a "black box" to you. You know exactly how the engine works!</p>`,
        view: 'math',
        mathContent: `
            <div class="w-full max-w-2xl bg-slate-900 rounded-xl shadow-2xl flex flex-col border border-slate-700 text-left max-h-[60vh] sm:max-h-[80vh]">
                <!-- Mac style window header -->
                <div class="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center space-x-2 shrink-0 rounded-t-xl">
                    <div class="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span class="text-slate-400 text-xs font-mono ml-3 font-semibold tracking-wider">reduce_dimensions.py</span>
                </div>
                <!-- Code container -->
                <div class="p-6 overflow-auto custom-scrollbar text-[15px] font-mono leading-relaxed text-slate-300">
                    <span class="text-rose-400 font-bold">from</span> sklearn.decomposition <span class="text-rose-400 font-bold">import</span> PCA<br>
                    <span class="text-rose-400 font-bold">import</span> numpy <span class="text-rose-400 font-bold">as</span> np<br>
                    <br>
                    <span class="text-slate-500 italic"># 1. Our raw 2D student data (Hours, Score)</span><br>
                    X = np.array([<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;[<span class="text-purple-400">2</span>, <span class="text-purple-400">3</span>], <span class="text-slate-500 italic"># Student 1</span><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;[<span class="text-purple-400">4</span>, <span class="text-purple-400">5</span>], <span class="text-slate-500 italic"># Student 2</span><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;[<span class="text-purple-400">6</span>, <span class="text-purple-400">4</span>]  <span class="text-slate-500 italic"># Student 3</span><br>
                    ])<br>
                    <br>
                    <span class="text-slate-500 italic"># 2. Tell the computer we only want 1 Dimension back</span><br>
                    pca = PCA(n_components=<span class="text-purple-400">1</span>)<br>
                    <br>
                    <span class="text-slate-500 italic"># 3. Do the math (Mean Centering, Matrix, Vectors, Projection)</span><br>
                    X_reduced = pca.fit_transform(X)<br>
                    <br>
                    <span class="text-sky-400">print</span>(<span class="text-emerald-400">"New 1D Coordinates:"</span>)<br>
                    <span class="text-sky-400">print</span>(X_reduced)<br>
                    <br>
                    <span class="text-sky-400">print</span>(<span class="text-emerald-400">"\\nVariance Preserved:"</span>)<br>
                    <span class="text-sky-400">print</span>(pca.explained_variance_ratio_[<span class="text-purple-400">0</span>])<br>
                </div>
            </div>
        `
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
// Origin is roughly bottom-left but shifted up for centered view
const originX = width / 2;
const originY = height / 2;
const scale = 40; // 40 pixels = 1 unit

function clearCanvas() {
    ctx.clearRect(0, 0, width, height);
}

// Convert math coordinates to canvas pixels
function toPx(mathX, mathY) {
    return {
        x: originX + (mathX * scale),
        y: originY - (mathY * scale) // Canvas Y goes down, math Y goes up
    };
}

function drawGridAndAxes() {
    ctx.beginPath();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    // Grid
    for (let i = -10; i <= 10; i++) {
        let pxLine = toPx(i, 0).x;
        ctx.moveTo(pxLine, 0); ctx.lineTo(pxLine, height);
        let pyLine = toPx(0, i).y;
        ctx.moveTo(0, pyLine); ctx.lineTo(width, pyLine);
    }
    ctx.stroke();

    // Axes
    ctx.beginPath();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.moveTo(0, originY); ctx.lineTo(width, originY); // X
    ctx.moveTo(originX, 0); ctx.lineTo(originX, height); // Y
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText('Hours Studied (X)', width - 120, originY - 10);
    ctx.fillText('Quiz Score (Y)', originX + 10, 20);
}

function drawPoints(pointsToDraw, colors = ['#0ea5e9', '#3b82f6', '#6366f1']) {
    pointsToDraw.forEach((p, index) => {
        const px = toPx(p.x, p.y);

        // Draw circle
        ctx.beginPath();
        ctx.arc(px.x, px.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Label
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`S${p.id}`, px.x + 12, px.y - 12);
    });
}

function drawPCALine() {
    // Our eigenvector is (0.96, 0.29). Let's extend it to draw a long line
    const m = eigenvector.y / eigenvector.x; // slope

    // Draw a line from x = -10 to x = 10
    const p1 = toPx(-10, -10 * m);
    const p2 = toPx(10, 10 * m);

    ctx.beginPath();
    ctx.strokeStyle = '#e11d48'; // Rose red
    ctx.lineWidth = 3;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
}

function animateCentering() {
    clearCanvas();
    drawGridAndAxes();

    animationProgress += 0.02;
    if (animationProgress > 1) animationProgress = 1;

    // Easing function
    const ease = 1 - Math.pow(1 - animationProgress, 3);

    const transitionPoints = rawPoints.map((p, i) => {
        const target = centeredPoints[i];
        return {
            id: p.id,
            x: p.x + (target.x - p.x) * ease,
            y: p.y + (target.y - p.y) * ease
        };
    });

    // Draw faint original mean
    const meanPx = toPx(meanX, meanY);
    ctx.beginPath();
    ctx.arc(meanPx.x, meanPx.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();

    drawPoints(transitionPoints);

    if (animationProgress < 1 && steps[currentStep].drawPhase === 'centering') {
        animationFrameId = requestAnimationFrame(animateCentering);
    }
}

function setupProjectionAnimation() {
    const slope = eigenvector.y / eigenvector.x;
    projectedPoints = centeredPoints.map(p => {
        // Math for projecting point onto a line y = mx
        const projX = (p.x + slope * p.y) / (1 + slope * slope);
        const projY = slope * projX;
        return { id: p.id, x: projX, y: projY, origX: p.x, origY: p.y };
    });
}

function animateProjection() {
    clearCanvas();
    drawGridAndAxes();
    drawPCALine();

    animationProgress += 0.015;
    if (animationProgress > 1) animationProgress = 1;
    const ease = 1 - Math.pow(1 - animationProgress, 3);

    const currentPoints = projectedPoints.map(p => {
        return {
            id: p.id,
            x: p.origX + (p.x - p.origX) * ease,
            y: p.origY + (p.y - p.origY) * ease
        };
    });

    // Draw dashed projection lines
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    projectedPoints.forEach(p => {
        const origPx = toPx(p.origX, p.origY);
        const curPx = toPx(currentPoints[p.id - 1].x, currentPoints[p.id - 1].y);
        ctx.beginPath();
        ctx.moveTo(origPx.x, origPx.y);
        ctx.lineTo(curPx.x, curPx.y);
        ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw faded original centered points
    drawPoints(centeredPoints, ['rgba(14,165,233,0.3)', 'rgba(59,130,246,0.3)', 'rgba(99,102,241,0.3)']);

    // Draw moving points
    drawPoints(currentPoints, ['#0284c7', '#2563eb', '#4f46e5']);

    if (animationProgress < 1 && steps[currentStep].drawPhase === 'projection') {
        animationFrameId = requestAnimationFrame(animateProjection);
    }
}

// --- 3. View Management ---
function updateUI() {
    const step = steps[currentStep];

    // Setup Text Content Animation
    const textContainer = titleEl.parentNode;
    textContainer.classList.remove('fade-enter-active');
    textContainer.classList.add('fade-enter');

    // Force DOM reflow to restart animation
    void textContainer.offsetWidth;

    // Update Text Data
    titleEl.innerText = step.title;
    descEl.innerHTML = step.text;
    badgeEl.innerText = `Step ${currentStep + 1} of ${steps.length}`;

    textContainer.classList.add('fade-enter-active');

    // Trigger MathJax for Left Panel
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([descEl]).catch(err => console.error(err));
    }

    // Update Navigation
    btnBack.disabled = currentStep === 0;
    btnNext.disabled = currentStep === steps.length - 1;

    dotsContainer.innerHTML = '';
    for (let i = 0; i < steps.length; i++) {
        const dot = document.createElement('div');
        dot.className = `h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-indigo-600 w-6' : 'bg-slate-300 w-2'}`;
        dotsContainer.appendChild(dot);
    }

    // Update Right Panel View
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
        // Trigger MathJax for Right Panel
        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([mathContainer]).catch(err => console.error(err));
        }
    }
    else if (step.view === 'canvas') {
        canvasEl.classList.remove('hidden');
        clearCanvas();
        drawGridAndAxes();

        if (step.drawPhase === 'raw') {
            // Temporarily shift origin for raw data so it fits nicely
            const oldOriginX = originX;
            const oldOriginY = originY;
            drawPoints(rawPoints);
        }
        else if (step.drawPhase === 'centering') {
            animationProgress = 0;
            animateCentering();
        }
        else if (step.drawPhase === 'pca_line') {
            drawPCALine();
            drawPoints(centeredPoints);
        }
        else if (step.drawPhase === 'projection') {
            setupProjectionAnimation();
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

// Initialize on load
window.addEventListener('load', () => {
    // Brief timeout to ensure MathJax is ready before first render
    setTimeout(() => {
        updateUI();
    }, 100);
});