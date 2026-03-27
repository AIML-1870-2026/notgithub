import { API_KEY, BASE_URLS } from './config.js';

let map = null;
let weatherLayer = null;
let currentLayerType = 'temp_new';
let tempMarkers = [];

function createTempIcon(temp, iconCode, name) {
    const html = `
        <div class="map-temp-bubble">
            <img src="https://openweathermap.org/img/wn/${iconCode}.png" class="map-temp-icon" alt="">
            <span class="map-temp-value">${Math.round(temp)}°</span>
            <span class="map-temp-city">${name}</span>
        </div>
    `;
    return L.divIcon({
        html,
        className: 'map-temp-marker',
        iconSize: [60, 60],
        iconAnchor: [30, 30]
    });
}

export function initMap(containerId) {
    map = L.map(containerId, {
        zoomControl: false,
        attributionControl: false
    }).setView([41.2565, -95.9345], 8);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        opacity: 0.7
    }).addTo(map);

    setWeatherLayer('temp_new');

    return map;
}

export function setWeatherLayer(layerType) {
    currentLayerType = layerType;

    if (weatherLayer) {
        map.removeLayer(weatherLayer);
    }

    weatherLayer = L.tileLayer(
        `${BASE_URLS.mapTile}/${layerType}/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { maxZoom: 18, opacity: 0.6 }
    ).addTo(map);
}

export function updateMapCenter(lat, lon) {
    if (map) {
        map.setView([lat, lon], 8, { animate: true });
    }
}

export function setTempMarkers(cities) {
    clearTempMarkers();

    // Filter to larger cities only (population threshold)
    // Then enforce minimum distance between markers to avoid overlap
    const MIN_DISTANCE_KM = 40;
    const placed = [];

    const sorted = [...cities]
        .filter(c => c.id && c.name)
        .sort((a, b) => (b.main?.temp != null ? 1 : 0) - (a.main?.temp != null ? 1 : 0));

    for (const city of sorted) {
        const lat = city.coord.lat;
        const lon = city.coord.lon;

        // Skip if too close to an already-placed marker
        const tooClose = placed.some(p => haversineKm(p[0], p[1], lat, lon) < MIN_DISTANCE_KM);
        if (tooClose) continue;

        const marker = L.marker(
            [lat, lon],
            { icon: createTempIcon(city.main.temp, city.weather[0].icon, city.name) }
        ).addTo(map);
        tempMarkers.push(marker);
        placed.push([lat, lon]);

        if (placed.length >= 6) break;
    }
}

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clearTempMarkers() {
    for (const m of tempMarkers) {
        map.removeLayer(m);
    }
    tempMarkers = [];
}

export function getCurrentLayer() {
    return currentLayerType;
}

export function invalidateMapSize() {
    if (map) {
        setTimeout(() => map.invalidateSize(), 100);
    }
}
