# Stellar Web Simulation - Quick Start

## How to Run

### Option 1: Local Web Server (Recommended)
ES6 modules require a web server to avoid CORS issues. Run one of these commands in the `stellar_web` directory:

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have npx)
npx serve

# PHP
php -S localhost:8000
```

Then open your browser to: `http://localhost:8000`

### Option 2: VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Troubleshooting

### "I can't see anything!"

1. **Open Browser Console** (F12 or Cmd+Option+I)
   - Look for error messages
   - You should see: "=== Stellar Web Simulation Initialized ==="
   - Check for "Initialized X particles"

2. **Check WebGL Support**
   - Visit: https://get.webgl.org/
   - Your browser must support WebGL

3. **Try zooming out**
   - Scroll your mouse wheel backward
   - The particles spawn in a 200-unit radius

4. **Check if controls are working**
   - Try dragging your mouse to rotate the view
   - You should see the GUI panel on the right

5. **Increase node brightness**
   - In the GUI, set "Node Opacity" to 1.0
   - Try increasing "Node Size" to 5.0
   - Change "Node Color" to something bright

6. **Check connectivity**
   - Set "Connectivity Radius" to 100 or higher
   - Lower "Max Connections" won't help if nodes are far apart

### Common Issues

**CORS Error / Module Loading Error**
- Must use a web server (see Option 1 above)
- Opening `index.html` directly (file://) won't work

**Black Screen**
- Nodes might be too small or transparent
- Try the "Fire Network" visual scheme (bright colors)
- Increase Node Size to 5.0

**No GUI Panel**
- Check console for lil-gui loading errors
- Make sure internet connection is working (loads from CDN)

**Poor Performance**
- Reduce "Node Count" to 100-200
- Lower "Max Connections" to 5
- Disable "Auto Rotate Camera"

## Quick Test

After starting the web server and opening the page:

1. Open browser console (F12)
2. You should see initialization messages
3. GUI panel should appear on the right
4. Click the visual scheme dropdown
5. Select "Fire Network" (brightest scheme)
6. If you still see nothing, scroll out with mouse wheel
7. Try dragging the mouse to rotate the view

## Default Controls

- **Mouse Drag**: Rotate camera
- **Mouse Wheel**: Zoom in/out
- **Right Click + Drag**: Pan camera
- **SPACE**: Pause/Resume animation
- **R**: Reset camera position
- **A**: Toggle auto-rotate

## System Requirements

- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- WebGL support
- JavaScript enabled
- Internet connection (for Three.js and lil-gui CDN)

## Still Having Issues?

Check the browser console for specific error messages and refer to the [Three.js documentation](https://threejs.org/docs/) for WebGL troubleshooting.
