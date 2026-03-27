import { API_KEY, BASE_URLS } from './config.js';

async function apiCall(url) {
    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 401) throw new Error('Invalid API key. Please check your config.');
        if (response.status === 404) throw new Error('Location not found.');
        if (response.status === 429) throw new Error('Too many requests. Please wait a moment.');
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
}

export async function fetchCurrentWeather(lat, lon, units = 'imperial') {
    const url = `${BASE_URLS.current}?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    return apiCall(url);
}

export async function fetchForecast(lat, lon, units = 'imperial') {
    const url = `${BASE_URLS.forecast}?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    return apiCall(url);
}

export async function fetchAirQuality(lat, lon) {
    const url = `${BASE_URLS.airPollution}?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    return apiCall(url);
}

export async function geocodeCity(query) {
    const url = `${BASE_URLS.geocoding}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
    return apiCall(url);
}

export async function reverseGeocode(lat, lon) {
    const url = `${BASE_URLS.reverseGeo}?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
    return apiCall(url);
}

export async function fetchNearbyCities(lat, lon, units = 'imperial', count = 15) {
    const url = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=${count}&units=${units}&appid=${API_KEY}`;
    return apiCall(url);
}
