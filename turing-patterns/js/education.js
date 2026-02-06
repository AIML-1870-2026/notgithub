// Educational overlay content about Turing patterns and reaction-diffusion models

export function initEducation() {
    const body = document.getElementById('education-body');
    body.innerHTML = CONTENT;
}

const CONTENT = `
<h2>Understanding Turing Patterns</h2>

<div class="edu-section">
    <h3>What Are Turing Patterns?</h3>
    <p>In 1952, Alan Turing published <em>"The Chemical Basis of Morphogenesis,"</em>
    proposing that patterns in nature &mdash; spots on a leopard, stripes on a
    zebrafish, ridges on sand dunes &mdash; could arise spontaneously from the
    interaction of just two diffusing chemicals. This was a radical idea:
    complex spatial order emerging from simple local rules.</p>
    <p>The key insight is that when an <strong>activator</strong> chemical
    promotes its own production and also promotes an <strong>inhibitor</strong>
    that suppresses the activator, and the inhibitor diffuses faster than the
    activator, stable patterns emerge. This is called
    <strong>diffusion-driven instability</strong> (or Turing instability).</p>
</div>

<div class="edu-section">
    <h3>How It Works</h3>
    <p>All models in this simulation follow the same principle: two chemicals
    react and diffuse on a 2D grid. Each cell updates based on:</p>
    <div class="equation">
    d[Chemical]/dt = Diffusion &times; Laplacian + Reaction Terms
    </div>
    <p>The <strong>Laplacian</strong> (&#8711;&sup2;) measures the difference between
    a cell's concentration and its neighbors &mdash; it drives diffusion.
    The <strong>reaction terms</strong> describe how the chemicals interact locally.
    Together, they create feedback loops that break spatial symmetry.</p>
</div>

<div class="edu-section">
    <h3>Gray-Scott Model</h3>
    <p>The most popular reaction-diffusion model for generating diverse patterns.
    Two chemicals U and V react on a grid fed with fresh U and drained of V:</p>
    <div class="equation">
    dU/dt = D<sub>u</sub> &#8711;&sup2;U &minus; UV&sup2; + f(1 &minus; U)<br>
    dV/dt = D<sub>v</sub> &#8711;&sup2;V + UV&sup2; &minus; (f + k)V
    </div>
    <p><strong>f</strong> (feed rate) controls how fast U is replenished.
    <strong>k</strong> (kill rate) controls how fast V is removed.
    Tiny changes in f and k produce dramatically different patterns:
    spots, stripes, spirals, moving blobs, and chaotic turbulence.</p>
</div>

<div class="edu-section">
    <h3>FitzHugh-Nagumo Model</h3>
    <p>Originally developed to model nerve impulse propagation (a simplification
    of the Hodgkin-Huxley neuron model). It produces excitable media behavior
    &mdash; spiral waves, target patterns, and traveling pulses:</p>
    <div class="equation">
    dv/dt = D<sub>v</sub> &#8711;&sup2;v + v &minus; v&sup3; &minus; w + I<br>
    dw/dt = D<sub>w</sub> &#8711;&sup2;w + &epsilon;(v &minus; a<sub>1</sub>w &minus; a<sub>0</sub>)
    </div>
    <p><strong>v</strong> is a fast activator (like membrane voltage),
    <strong>w</strong> is a slow recovery variable.
    <strong>&epsilon;</strong> controls the time-scale separation between them.
    The model produces beautiful spiral waves when perturbed from equilibrium.</p>
</div>

<div class="edu-section">
    <h3>Gierer-Meinhardt Model</h3>
    <p>A foundational activator-inhibitor model for biological pattern formation,
    proposed in 1972:</p>
    <div class="equation">
    da/dt = D<sub>a</sub> &#8711;&sup2;a + &rho; &middot; a&sup2;/h &minus; &mu;<sub>a</sub> &middot; a + &rho;<sub>a</sub><br>
    dh/dt = D<sub>h</sub> &#8711;&sup2;h + &rho; &middot; a&sup2; &minus; &mu;<sub>h</sub> &middot; h
    </div>
    <p>The activator <strong>a</strong> catalyzes its own production (via a&sup2;/h)
    and also drives production of the inhibitor <strong>h</strong>.
    Because h diffuses much faster (D<sub>h</sub> >> D<sub>a</sub>), it creates
    long-range suppression that confines activator peaks into spots or stripes.</p>
</div>

<div class="edu-section">
    <h3>Brusselator Model</h3>
    <p>Named after Brussels where it was developed by Prigogine and Lefever in 1968.
    A trimolecular reaction model that exhibits Turing instability:</p>
    <div class="equation">
    du/dt = D<sub>u</sub> &#8711;&sup2;u + A &minus; (B + 1)u + u&sup2;v<br>
    dv/dt = D<sub>v</sub> &#8711;&sup2;v + Bu &minus; u&sup2;v
    </div>
    <p>The homogeneous steady state (u = A, v = B/A) becomes unstable when
    <strong>B > 1 + A&sup2;</strong> (the Turing condition). Above this threshold,
    spatial patterns spontaneously emerge. The Brusselator is notable for being
    one of the first theoretical models to demonstrate Turing instability.</p>
</div>

<div class="edu-section">
    <h3>Schnakenberg Model</h3>
    <p>A minimal activator-substrate model proposed in 1979, sometimes called
    the "minimal Turing system":</p>
    <div class="equation">
    du/dt = D<sub>u</sub> &#8711;&sup2;u + a &minus; u + u&sup2;v<br>
    dv/dt = D<sub>v</sub> &#8711;&sup2;v + b &minus; u&sup2;v
    </div>
    <p>With only two parameters (a, b) controlling the kinetics, it produces
    clean spot and stripe patterns. The simplicity makes it ideal for studying
    the mathematical conditions for Turing pattern formation.</p>
</div>

<div class="edu-section">
    <h3>Turing Patterns in Nature</h3>
    <ul>
        <li><strong>Animal coat patterns</strong> &mdash; leopard spots, zebra stripes, giraffe patches, jaguar rosettes</li>
        <li><strong>Fish pigmentation</strong> &mdash; angel fish, zebrafish, pufferfish, clown triggerfish</li>
        <li><strong>Seashell patterns</strong> &mdash; cone snails, cowries, textile cones</li>
        <li><strong>Fingerprints</strong> &mdash; ridge patterns on human skin</li>
        <li><strong>Vegetation patterns</strong> &mdash; fairy circles in Namibia, tiger bush, patterned peatlands</li>
        <li><strong>Chemical reactions</strong> &mdash; Belousov-Zhabotinsky oscillating reaction</li>
        <li><strong>Coral growth</strong> &mdash; branching morphology of reef-building corals</li>
        <li><strong>Hair follicle spacing</strong> &mdash; regular arrangement of hair follicles in mammalian skin</li>
    </ul>
</div>

<div class="edu-section">
    <h3>The GPU Simulation</h3>
    <p>This simulation runs the reaction-diffusion equations directly on your GPU
    using WebGL2 fragment shaders. The "ping-pong" technique alternates between
    two textures &mdash; reading chemical concentrations from one and writing
    updated values to the other. This allows hundreds of simulation steps per
    second at 512&times;512 resolution.</p>
    <p>Each pixel in the simulation texture stores two chemical concentrations
    in its red and green channels. The color you see is produced by mapping
    one of these concentrations through a color palette (the "color map").</p>
</div>
`;
