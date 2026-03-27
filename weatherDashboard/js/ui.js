import { AQI_LEVELS } from './config.js';
import {
    formatTemp, formatWindSpeed, formatVisibility, formatPrecip,
    formatTime, formatHour, formatDay, formatDate,
    getIconUrl, capitalizeFirst, aggregateDailyForecast, degToCompass,
    getPrecipAmount, getCurrentPrecip
} from './utils.js';

export function renderCurrentWeather(data, units) {
    const container = document.getElementById('current-weather');
    const icon = getIconUrl(data.weather[0].icon);
    const description = capitalizeFirst(data.weather[0].description);

    container.innerHTML = `
        <div class="current-top">
            <div class="current-location">
                <h2 class="city-name">${data.name}</h2>
                <p class="current-date">${formatDate(data.dt)}</p>
            </div>
            <button class="fav-btn" id="fav-btn" title="Add to favorites">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
        </div>
        <div class="current-main">
            <div class="current-temp-group">
                <img class="current-icon" src="${icon}" alt="${description}">
                <span class="current-temp">${Math.round(data.main.temp)}°</span>
            </div>
            <p class="current-description">${description}</p>
            <p class="current-feels-like">Feels like ${formatTemp(data.main.feels_like, units)}</p>
        </div>
        <div class="current-range">
            <span class="temp-hi">H: ${formatTemp(data.main.temp_max, units)}</span>
            <span class="temp-lo">L: ${formatTemp(data.main.temp_min, units)}</span>
        </div>
    `;
}

export function renderWeatherDetails(data, units) {
    const grid = document.getElementById('details-grid');
    const sunrise = formatTime(data.sys.sunrise, data.timezone);
    const sunset = formatTime(data.sys.sunset, data.timezone);

    const windDir = degToCompass(data.wind.deg);
    const windDeg = data.wind.deg ?? 0;
    const gustLine = data.wind.gust
        ? `<span class="detail-sub">Gusts ${formatWindSpeed(data.wind.gust, units)}</span>`
        : '';

    const currentPrecip = getCurrentPrecip(data);
    const precipLabel = currentPrecip > 0 ? formatPrecip(currentPrecip, units) : 'None';
    const precipType = data.snow?.['1h'] ? 'snow' : 'rain';
    const cloudiness = data.clouds?.all ?? 0;

    grid.innerHTML = `
        <div class="detail-item" title="Current wind speed, direction, and gust intensity">
            <div class="detail-header">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
                <span class="detail-label">Wind</span>
            </div>
            <div class="wind-display">
                <svg class="wind-arrow" viewBox="0 0 24 24" width="20" height="20" style="transform: rotate(${windDeg + 180}deg)" title="Wind blowing from ${windDir}">
                    <path d="M12 2L6 18h12L12 2z" fill="currentColor"/>
                </svg>
                <div class="wind-text">
                    <span class="detail-value">${formatWindSpeed(data.wind.speed, units)}</span>
                    <span class="detail-sub">${windDir}</span>
                </div>
            </div>
            ${gustLine}
        </div>
        <div class="detail-item" title="Relative humidity — how saturated the air is with moisture">
            <div class="detail-header">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C12 2 5 11 5 15a7 7 0 0 0 14 0c0-4-7-13-7-13z"/></svg>
                <span class="detail-label">Humidity</span>
            </div>
            <span class="detail-value">${data.main.humidity}%</span>
        </div>
        <div class="detail-item" title="Total ${precipType} in the last hour">
            <div class="detail-header">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/><path d="M16 14l-4 6-4-6"/></svg>
                <span class="detail-label">Precipitation</span>
            </div>
            <span class="detail-value">${precipLabel}</span>
            <span class="detail-sub">Last 1 hr</span>
        </div>
        <div class="detail-item" title="Atmospheric pressure — high pressure often means clear skies, low pressure may bring storms">
            <div class="detail-header">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <span class="detail-label">Pressure</span>
            </div>
            <span class="detail-value">${data.main.pressure} <span class="detail-unit">hPa</span></span>
        </div>
        <div class="detail-item" title="How far you can see clearly — affected by fog, rain, and haze">
            <div class="detail-header">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span class="detail-label">Visibility</span>
            </div>
            <span class="detail-value">${formatVisibility(data.visibility, units)}</span>
        </div>
        <div class="detail-item" title="Percentage of sky covered by clouds">
            <div class="detail-header">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
                <span class="detail-label">Cloudiness</span>
            </div>
            <span class="detail-value">${cloudiness}%</span>
        </div>
        <div class="detail-item" title="Time of sunrise at this location today">
            <div class="detail-header">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/></svg>
                <span class="detail-label">Sunrise</span>
            </div>
            <span class="detail-value">${sunrise}</span>
        </div>
        <div class="detail-item" title="Time of sunset at this location today">
            <div class="detail-header">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="16 6 12 2 8 6"/></svg>
                <span class="detail-label">Sunset</span>
            </div>
            <span class="detail-value">${sunset}</span>
        </div>
        <div class="detail-item" title="What the temperature actually feels like, accounting for wind chill and humidity">
            <div class="detail-header">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
                <span class="detail-label">Feels Like</span>
            </div>
            <span class="detail-value">${formatTemp(data.main.feels_like, units)}</span>
        </div>
    `;
}

export function renderHourlyForecast(forecastData, units, timezoneOffset) {
    const container = document.getElementById('hourly-scroll');
    const items = forecastData.list.slice(0, 8);

    container.innerHTML = items.map(item => {
        const pop = Math.round((item.pop || 0) * 100);
        const desc = capitalizeFirst(item.weather[0].description);
        const precipAmt = getPrecipAmount(item);
        const precipTip = precipAmt > 0 ? `, ${formatPrecip(precipAmt, units)} expected` : '';
        const popHtml = pop > 0
            ? `<span class="hourly-pop" title="${pop}% chance of precipitation${precipTip}"><svg viewBox="0 0 24 24" width="10" height="10" fill="rgba(100,180,255,0.9)" stroke="none"><path d="M12 2C12 2 5 11 5 15a7 7 0 0 0 14 0c0-4-7-13-7-13z"/></svg>${pop}%</span>`
            : '';
        return `
            <div class="hourly-item" title="${desc} — ${formatTemp(item.main.temp, units)}, Wind ${formatWindSpeed(item.wind.speed, units)}${pop > 0 ? ', ' + pop + '% precip' : ''}${precipTip}">
                <span class="hourly-time">${formatHour(item.dt, timezoneOffset)}</span>
                <img class="hourly-icon" src="${getIconUrl(item.weather[0].icon)}" alt="${desc}">
                <span class="hourly-temp">${formatTemp(item.main.temp, units)}</span>
                ${popHtml}
            </div>
        `;
    }).join('');
}

export function renderDailyForecast(forecastData, units) {
    const container = document.getElementById('daily-forecast-list');
    const days = aggregateDailyForecast(forecastData.list);

    // Find overall min/max for the bar scale
    const overallMin = Math.min(...days.map(d => d.tempMin));
    const overallMax = Math.max(...days.map(d => d.tempMax));
    const range = overallMax - overallMin || 1;

    container.innerHTML = days.map(day => {
        const leftPct = ((day.tempMin - overallMin) / range) * 100;
        const widthPct = ((day.tempMax - day.tempMin) / range) * 100;
        const pop = Math.round((day.pop || 0) * 100);
        const desc = capitalizeFirst(day.description);
        const totalPrecip = day.precipTotal || 0;
        const precipTip = totalPrecip > 0
            ? `, Total: ${formatPrecip(totalPrecip, units)}`
            : '';
        const popHtml = pop > 0
            ? `<span class="daily-pop" title="${pop}% chance of precipitation${precipTip}"><svg viewBox="0 0 24 24" width="10" height="10" fill="rgba(100,180,255,0.9)" stroke="none"><path d="M12 2C12 2 5 11 5 15a7 7 0 0 0 14 0c0-4-7-13-7-13z"/></svg>${pop}%</span>`
            : `<span class="daily-pop"></span>`;

        return `
            <div class="daily-item" title="${desc} — H: ${Math.round(day.tempMax)}° L: ${Math.round(day.tempMin)}°${pop > 0 ? ', ' + pop + '% precip' : ''}${precipTip}">
                <span class="daily-day">${formatDay(day.dt)}</span>
                <img class="daily-icon" src="${getIconUrl(day.icon)}" alt="${desc}">
                ${popHtml}
                <span class="daily-lo" title="Low temperature">${Math.round(day.tempMin)}°</span>
                <div class="daily-bar-track" title="Temperature range for the day">
                    <div class="daily-bar-fill" style="left: ${leftPct}%; width: ${Math.max(widthPct, 4)}%"></div>
                </div>
                <span class="daily-hi" title="High temperature">${Math.round(day.tempMax)}°</span>
            </div>
        `;
    }).join('');
}

export function renderAirQuality(aqiData) {
    const container = document.getElementById('aqi-card');
    const aqi = aqiData.list[0];
    const level = AQI_LEVELS[aqi.main.aqi - 1] || AQI_LEVELS[0];
    const components = aqi.components;

    container.innerHTML = `
        <h3 class="card-title">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2h8l4 10H4L8 2z"/><path d="M12 12v6"/><path d="M8 22h8"/></svg>
            Air Quality
        </h3>
        <div class="aqi-header">
            <div class="aqi-badge" style="background: ${level.color}" title="Air Quality Index: ${aqi.main.aqi}/5 — ${level.label}">
                <span class="aqi-number">${aqi.main.aqi}</span>
                <span class="aqi-label">${level.label}</span>
            </div>
            <p class="aqi-advice">${level.advice}</p>
        </div>
        <div class="aqi-components">
            <div class="aqi-comp"><span class="comp-label">PM2.5</span><span class="comp-value">${components.pm2_5.toFixed(1)}</span></div>
            <div class="aqi-comp"><span class="comp-label">PM10</span><span class="comp-value">${components.pm10.toFixed(1)}</span></div>
            <div class="aqi-comp"><span class="comp-label">O₃</span><span class="comp-value">${components.o3.toFixed(1)}</span></div>
            <div class="aqi-comp"><span class="comp-label">NO₂</span><span class="comp-value">${components.no2.toFixed(1)}</span></div>
            <div class="aqi-comp"><span class="comp-label">SO₂</span><span class="comp-value">${components.so2.toFixed(1)}</span></div>
            <div class="aqi-comp"><span class="comp-label">CO</span><span class="comp-value">${components.co.toFixed(1)}</span></div>
        </div>
    `;
}

export function renderFavorites(favorites, currentCity) {
    const container = document.getElementById('favorites-scroll');
    const bar = document.getElementById('favorites-bar');

    if (favorites.length === 0) {
        bar.classList.add('hidden');
        return;
    }

    bar.classList.remove('hidden');
    container.innerHTML = favorites.map(city => {
        const isActive = currentCity &&
            Math.abs(city.lat - currentCity.lat) < 0.01 &&
            Math.abs(city.lon - currentCity.lon) < 0.01;
        return `
            <button class="fav-chip ${isActive ? 'active' : ''}"
                    data-lat="${city.lat}" data-lon="${city.lon}"
                    data-name="${city.name}" data-country="${city.country || ''}">
                ${city.name}
                <span class="fav-remove" data-lat="${city.lat}" data-lon="${city.lon}">&times;</span>
            </button>
        `;
    }).join('');
}

export function renderSearchResults(results) {
    const container = document.getElementById('search-results');

    if (!results || results.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = results.map(r => `
        <button class="search-result-item"
                data-lat="${r.lat}" data-lon="${r.lon}"
                data-name="${r.name}" data-country="${r.country || ''}" data-state="${r.state || ''}">
            <span class="result-city">${r.name}</span>
            <span class="result-region">${[r.state, r.country].filter(Boolean).join(', ')}</span>
        </button>
    `).join('');
}

export function hideSearchResults() {
    document.getElementById('search-results').classList.add('hidden');
}

export function showError(message) {
    const toast = document.getElementById('error-toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
}

export function setFavoriteActive(isFav) {
    const btn = document.getElementById('fav-btn');
    if (!btn) return;
    const svg = btn.querySelector('svg');
    if (isFav) {
        svg.setAttribute('fill', 'currentColor');
        btn.classList.add('is-fav');
    } else {
        svg.setAttribute('fill', 'none');
        btn.classList.remove('is-fav');
    }
}
