/* ══════════════════════════════════════════════════════
   globe.js — 3D Earth globe (globe.gl)
   Globe is loaded as a UMD global (window.Globe) from CDN.
══════════════════════════════════════════════════════ */

import { CONFIG } from './config.js';
import { STATE }  from './state.js';
import { fmtAU, fmtLD, fmtNum, fmtDiam, cardDateStr } from './utils.js';

// ── Initialization ───────────────────────────────────

export function initGlobe() {
  const container = document.getElementById('globe-container');
  if (!container || STATE.ui.globeInstance) return;

  // Globe() is the UMD global exposed by globe.gl's CDN bundle
  const globe = Globe()(container)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .atmosphereColor(CONFIG.GLOBE_ATMOSPHERE)
    .atmosphereAltitude(0.18)
    .backgroundColor(CONFIG.GLOBE_BG)
    .width(container.clientWidth)
    .height(container.clientHeight);

  const controls = globe.controls();
  controls.autoRotate      = true;
  controls.autoRotateSpeed = 0.35;
  controls.enableZoom      = true;
  controls.enableDamping   = true;

  // Start over the Atlantic for a clean first impression
  globe.pointOfView({ lat: 20, lng: -30, altitude: 2.2 }, 0);

  STATE.ui.globeInstance = globe;

  window.addEventListener('resize', () => {
    globe.width(container.clientWidth).height(container.clientHeight);
  });

  if (STATE.data.todayNeos.length > 0) {
    updateGlobePoints(STATE.data.todayNeos);
  }
}

// ── Distance → altitude (non-linear compression) ─────
// Moon sits at altitude 0.25; objects further scale logarithmically
// so that all asteroids remain visible on the globe.

function distToAltitude(distAU) {
  const normalized = distAU / CONFIG.MOON_ORBIT_AU; // 1 = 1 lunar distance
  return 0.25 + Math.log10(normalized + 1) * 0.75;
}

// ── Deterministic lat/lng seeded from object ID ───────
// Uses the golden angle to spread points evenly across the ecliptic band (±23.5°)

function neoToLatLng(neo) {
  const seed = parseInt(neo.id, 10) || 0;
  return {
    lat: ((seed * 23.437) % 47) - 23.5,
    lng: ((seed * 137.508) % 360) - 180,
  };
}

// ── Point rendering ──────────────────────────────────

export function updateGlobePoints(neos) {
  const globe = STATE.ui.globeInstance;
  if (!globe || !neos.length) return;

  const points = neos.map(neo => {
    const { lat, lng } = neoToLatLng(neo);
    return {
      ...neo,
      lat,
      lng,
      altitude:  distToAltitude(neo.distAU),
      dotColor:  neo.hazardous ? CONFIG.HAZARD_COLOR : CONFIG.SAFE_COLOR,
      dotRadius: neo.hazardous ? 0.55 : 0.38,
    };
  });

  globe
    .customLayerData(points)
    .customThreeObject(d => {
      // Globe.gl uses a globe radius of 100 Three.js units.
      // Sphere radii must be in that same world-unit scale to be visible.
      const r = d.hazardous ? 2.5 : 1.8;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 16, 16),
        new THREE.MeshBasicMaterial({ color: d.dotColor })
      );
      if (d.hazardous) {
        // soft glow halo
        mesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(r * 1.8, 16, 16),
          new THREE.MeshBasicMaterial({ color: d.dotColor, transparent: true, opacity: 0.2 })
        ));
      }
      return mesh;
    })
    .customThreeObjectUpdate((obj, d) => {
      Object.assign(obj.position, globe.getCoords(d.lat, d.lng, d.altitude));
    })
    .customLayerLabel(d => buildTooltipHtml(d))
    .onCustomLayerClick(d => showGlobeInfoPanel(d))
    .onCustomLayerHover(d => {
      // Pause auto-rotation while user hovers over a dot
      globe.controls().autoRotate = !d;
    });
}

function buildTooltipHtml(d) {
  return `
    <div style="
      background: rgba(10,14,26,0.93);
      border: 1px solid ${d.hazardous ? '#ff4757' : '#00d4ff'};
      border-radius: 10px;
      padding: 9px 13px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      color: #f0f4ff;
      max-width: 200px;
      line-height: 1.6;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    ">
      <strong style="color:${d.hazardous ? '#ff4757' : '#00d4ff'}">${d.name}</strong><br/>
      <span style="color:#8892a4">Distance: </span>${fmtLD(d.distAU)}<br/>
      <span style="color:#8892a4">Speed: </span>${fmtNum(d.velKmS, 1)} km/s<br/>
      <span style="color:#8892a4">${d.date}</span>
    </div>
  `;
}

// ── Info panel ───────────────────────────────────────

export function showGlobeInfoPanel(neo) {
  STATE.ui.selectedNeo = neo;

  document.getElementById('info-hazard-badge').textContent = neo.hazardous
    ? 'Potentially Hazardous' : 'Safe Approach';
  document.getElementById('info-hazard-badge').className = `info-badge ${
    neo.hazardous ? 'badge-danger' : 'badge-safe'
  }`;

  document.getElementById('info-name').textContent = neo.name || neo.fullName || '—';
  document.getElementById('info-dist').textContent =
    `${fmtAU(neo.distAU)}  ·  ${fmtLD(neo.distAU)}`;
  document.getElementById('info-vel').textContent  = `${fmtNum(neo.velKmS, 2)} km/s`;
  document.getElementById('info-diam').textContent = fmtDiam(neo.diamAvgM);
  document.getElementById('info-date').textContent = cardDateStr(neo.date);

  const link = document.getElementById('info-jpl-link');
  link.href = neo.jplUrl || `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${
    encodeURIComponent(neo.name)
  }`;

  document.getElementById('globe-info-panel').classList.remove('hidden');

  // Pause rotation while panel is open
  if (STATE.ui.globeInstance) {
    STATE.ui.globeInstance.controls().autoRotate = false;
  }
}
