import { DEFAULT_CITY } from './config.js';
import { fetchCurrentWeather, fetchForecast, fetchAirQuality, geocodeCity, reverseGeocode, fetchNearbyCities } from './api.js';
import { getUnits, saveUnits, getLastCity, saveLastCity, getFavorites, addFavorite, removeFavorite, isFavorite } from './storage.js';
import { debounce } from './utils.js';
import { updateBackground } from './weather-bg.js';
import { initMap, updateMapCenter, setWeatherLayer, invalidateMapSize, setTempMarkers } from './map.js';
import {
    renderCurrentWeather, renderWeatherDetails, renderHourlyForecast,
    renderDailyForecast, renderAirQuality, renderFavorites,
    renderSearchResults, hideSearchResults, showError, setFavoriteActive
} from './ui.js';

let currentCity = null;
let currentUnits = getUnits();

async function loadWeather(lat, lon, name, country) {
    currentCity = { lat, lon, name, country };
    saveLastCity(currentCity);

    try {
        const [current, forecast, aqi] = await Promise.all([
            fetchCurrentWeather(lat, lon, currentUnits),
            fetchForecast(lat, lon, currentUnits),
            fetchAirQuality(lat, lon)
        ]);

        // Use the name from the API if we didn't have one
        if (!name && current.name) {
            currentCity.name = current.name;
            saveLastCity(currentCity);
        }

        renderCurrentWeather(current, currentUnits);
        renderWeatherDetails(current, currentUnits);
        renderHourlyForecast(forecast, currentUnits, current.timezone);
        renderDailyForecast(forecast, currentUnits);
        renderAirQuality(aqi);
        updateBackground(current.weather[0].id, current.sys.sunrise, current.sys.sunset);
        updateMapCenter(lat, lon);
        invalidateMapSize();

        // Load nearby city temps for map bubbles
        fetchNearbyCities(lat, lon, currentUnits).then(data => {
            if (data && data.list) setTempMarkers(data.list);
        }).catch(() => {});

        setFavoriteActive(isFavorite(currentCity));
        renderFavorites(getFavorites(), currentCity);

    } catch (err) {
        showError(err.message);
    }
}

function setupSearch() {
    const input = document.getElementById('city-search');

    const doSearch = debounce(async (query) => {
        if (query.length < 2) {
            hideSearchResults();
            return;
        }
        try {
            const results = await geocodeCity(query);
            renderSearchResults(results);
        } catch {
            hideSearchResults();
        }
    }, 300);

    input.addEventListener('input', (e) => doSearch(e.target.value.trim()));

    // Handle clicking a search result
    document.getElementById('search-results').addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (!item) return;
        const { lat, lon, name, country } = item.dataset;
        input.value = '';
        hideSearchResults();
        loadWeather(parseFloat(lat), parseFloat(lon), name, country);
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideSearchResults();
        }
    });
}

function setupUnitToggle() {
    const toggle = document.getElementById('unit-toggle');

    // Set initial active state
    toggle.querySelectorAll('.unit-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === currentUnits);
    });

    toggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.unit-btn');
        if (!btn || btn.dataset.unit === currentUnits) return;

        currentUnits = btn.dataset.unit;
        saveUnits(currentUnits);

        toggle.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (currentCity) {
            loadWeather(currentCity.lat, currentCity.lon, currentCity.name, currentCity.country);
        }
    });
}

function setupFavorites() {
    // Favorite button in current weather card
    document.getElementById('current-weather').addEventListener('click', (e) => {
        const btn = e.target.closest('#fav-btn');
        if (!btn || !currentCity) return;

        if (isFavorite(currentCity)) {
            removeFavorite(currentCity);
            setFavoriteActive(false);
        } else {
            addFavorite(currentCity);
            setFavoriteActive(true);
        }
        renderFavorites(getFavorites(), currentCity);
    });

    // Clicking a favorite chip
    document.getElementById('favorites-scroll').addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.fav-remove');
        if (removeBtn) {
            e.stopPropagation();
            const { lat, lon } = removeBtn.dataset;
            removeFavorite({ lat: parseFloat(lat), lon: parseFloat(lon) });
            renderFavorites(getFavorites(), currentCity);
            if (currentCity) setFavoriteActive(isFavorite(currentCity));
            return;
        }

        const chip = e.target.closest('.fav-chip');
        if (!chip) return;
        const { lat, lon, name, country } = chip.dataset;
        loadWeather(parseFloat(lat), parseFloat(lon), name, country);
    });
}

function setupMapLayerToggle() {
    document.getElementById('map-layer-toggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.layer-btn');
        if (!btn) return;

        document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setWeatherLayer(btn.dataset.layer);
    });
}

async function getInitialLocation() {
    // Try last saved city first
    const lastCity = getLastCity();
    if (lastCity) {
        return lastCity;
    }

    // Try geolocation
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(DEFAULT_CITY);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const results = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                    if (results && results.length > 0) {
                        resolve({
                            lat: pos.coords.latitude,
                            lon: pos.coords.longitude,
                            name: results[0].name,
                            country: results[0].country
                        });
                    } else {
                        resolve({
                            lat: pos.coords.latitude,
                            lon: pos.coords.longitude,
                            name: '',
                            country: ''
                        });
                    }
                } catch {
                    resolve({
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        name: '',
                        country: ''
                    });
                }
            },
            () => resolve(DEFAULT_CITY),
            { timeout: 8000 }
        );
    });
}

async function init() {
    initMap('weather-map');
    setupSearch();
    setupUnitToggle();
    setupFavorites();
    setupMapLayerToggle();

    const location = await getInitialLocation();
    loadWeather(location.lat, location.lon, location.name, location.country);
}

document.addEventListener('DOMContentLoaded', init);
