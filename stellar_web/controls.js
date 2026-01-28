// lil-gui is loaded as a script tag, so GUI is available globally
// No import needed - it creates a global 'lil' object

/**
 * Visual scheme presets
 */
export const visualSchemes = {
    cosmicWeb: {
        name: 'Cosmic Web',
        nodeColor: 0x00FFFF,
        edgeColor: 0x4488FF,
        nodeOpacity: 1.0,
        edgeOpacity: 1.0,
        nodeSize: 1.5,
        edgeThickness: 1.0
    },
    neuralNetwork: {
        name: 'Neural Network',
        nodeColor: 0xFF00FF,
        edgeColor: 0x00FFFF,
        nodeOpacity: 0.9,
        edgeOpacity: 1.0,
        nodeSize: 1.8,
        edgeThickness: 1.2
    },
    bioluminescent: {
        name: 'Bioluminescent Ocean',
        nodeColor: 0x00CED1,
        edgeColor: 0x00FF88,
        nodeOpacity: 0.85,
        edgeOpacity: 1.0,
        nodeSize: 1.2,
        edgeThickness: 0.8
    },
    fireNetwork: {
        name: 'Fire Network',
        nodeColor: 0xFF4500,
        edgeColor: 0xFFFF00,
        nodeOpacity: 0.95,
        edgeOpacity: 1.0,
        nodeSize: 1.6,
        edgeThickness: 1.1
    },
    crystalline: {
        name: 'Crystalline Matrix',
        nodeColor: 0xDDDDDD,
        edgeColor: 0xAAAAAA,
        nodeOpacity: 1.0,
        edgeOpacity: 1.0,
        nodeSize: 2.0,
        edgeThickness: 1.5
    }
};

/**
 * Create and configure GUI controls
 * @param {Object} params - Simulation parameters
 * @param {ParticleSystem} particleSystem - Particle system instance
 * @param {Function} onSchemeChange - Callback for scheme changes
 * @returns {Object} GUI instance
 */
export function createControls(params, particleSystem, onSchemeChange) {
    const gui = new lil.GUI({ title: 'Stellar Web Controls' });

    // Visual Schemes folder
    const schemesFolder = gui.addFolder('Visual Schemes');
    const schemeController = {
        currentScheme: 'Cosmic Web',
        applyScheme: function (schemeName) {
            let scheme;
            switch (schemeName) {
                case 'Cosmic Web':
                    scheme = visualSchemes.cosmicWeb;
                    break;
                case 'Neural Network':
                    scheme = visualSchemes.neuralNetwork;
                    break;
                case 'Bioluminescent Ocean':
                    scheme = visualSchemes.bioluminescent;
                    break;
                case 'Fire Network':
                    scheme = visualSchemes.fireNetwork;
                    break;
                case 'Crystalline Matrix':
                    scheme = visualSchemes.crystalline;
                    break;
                default:
                    scheme = visualSchemes.cosmicWeb;
            }

            // Apply scheme parameters
            params.nodeColor = scheme.nodeColor;
            params.edgeColor = scheme.edgeColor;
            params.nodeOpacity = scheme.nodeOpacity;
            params.edgeOpacity = scheme.edgeOpacity;
            params.nodeSize = scheme.nodeSize;
            params.edgeThickness = scheme.edgeThickness;

            // Update GUI controllers
            gui.controllersRecursive().forEach(controller => {
                controller.updateDisplay();
            });

            // Update particle system colors
            particleSystem.updateColors(params.nodeColor, params.edgeColor);

            // Callback for additional scheme changes
            if (onSchemeChange) {
                onSchemeChange(scheme);
            }
        }
    };

    schemesFolder.add(schemeController, 'currentScheme', [
        'Cosmic Web',
        'Neural Network',
        'Bioluminescent Ocean',
        'Fire Network',
        'Crystalline Matrix'
    ]).onChange((value) => {
        schemeController.applyScheme(value);
    });
    schemesFolder.open();

    // Node Parameters folder
    const nodeFolder = gui.addFolder('Node Properties');
    nodeFolder.add(params, 'nodeCount', 50, 1000, 10)
        .name('Node Count')
        .onChange((value) => {
            particleSystem.updateNodeCount(Math.floor(value));
        });
    nodeFolder.add(params, 'nodeSize', 0.5, 5.0, 0.1)
        .name('Node Size');
    nodeFolder.add(params, 'nodeOpacity', 0.0, 1.0, 0.01)
        .name('Node Opacity');
    nodeFolder.addColor(params, 'nodeColor')
        .name('Node Color')
        .onChange(() => {
            particleSystem.updateColors(params.nodeColor, params.edgeColor);
        });
    nodeFolder.open();

    // Edge Parameters folder
    const edgeFolder = gui.addFolder('Edge Properties');
    edgeFolder.add(params, 'edgeThickness', 0.1, 3.0, 0.1)
        .name('Edge Thickness');
    edgeFolder.add(params, 'edgeOpacity', 0.0, 1.0, 0.01)
        .name('Edge Opacity');
    edgeFolder.addColor(params, 'edgeColor')
        .name('Edge Color')
        .onChange(() => {
            particleSystem.updateColors(params.nodeColor, params.edgeColor);
        });
    edgeFolder.open();

    // Connection Parameters folder
    const connectionFolder = gui.addFolder('Connection Properties');
    connectionFolder.add(params, 'connectivityRadius', 10, 150, 1)
        .name('Connectivity Radius');
    connectionFolder.add(params, 'maxConnectionsPerNode', 1, 20, 1)
        .name('Max Connections');
    connectionFolder.open();

    // Space & Movement folder
    const spaceFolder = gui.addFolder('Space & Movement');
    spaceFolder.add(params, 'spaceBounds', 50, 500, 10)
        .name('Network Area Size')
        .onChange((value) => {
            particleSystem.updateBounds(value);
            if (onSchemeChange) {
                onSchemeChange({ boundaryUpdated: true });
            }
        });
    spaceFolder.add(params, 'showBoundary')
        .name('Show Boundary Box')
        .onChange((value) => {
            particleSystem.toggleBoundary(value);
        });
    spaceFolder.add(params, 'movementSpeed', 0.0, 40.0, 0.1)
        .name('Movement Speed');
    spaceFolder.add(params, 'paused')
        .name('Pause Animation');
    spaceFolder.open();

    // Camera Controls folder
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(params, 'autoRotate')
        .name('Auto Rotate');
    cameraFolder.add(params, 'autoRotateSpeed', 0.0, 2.0, 0.1)
        .name('Rotation Speed');
    cameraFolder.open();

    // Actions folder
    const actionsFolder = gui.addFolder('Actions');
    actionsFolder.add({ reset: () => particleSystem.initParticles() }, 'reset')
        .name('Reset Particles');
    actionsFolder.open();

    return gui;
}
