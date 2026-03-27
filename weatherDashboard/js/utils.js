import { UNIT_LABELS } from './config.js';

export function formatTemp(value, units) {
    return `${Math.round(value)}${UNIT_LABELS[units].temp}`;
}

export function formatWindSpeed(value, units) {
    return `${Math.round(value)} ${UNIT_LABELS[units].wind}`;
}

export function formatVisibility(meters, units) {
    if (units === 'imperial') {
        return `${(meters / 1609.34).toFixed(1)} ${UNIT_LABELS[units].visibility}`;
    }
    return `${(meters / 1000).toFixed(1)} ${UNIT_LABELS[units].visibility}`;
}

export function formatPrecip(mm, units) {
    if (mm === 0) return '0';
    if (units === 'imperial') {
        const inches = mm / 25.4;
        return inches < 0.1 ? `<0.1 in` : `${inches.toFixed(1)} in`;
    }
    return mm < 0.1 ? `<0.1 mm` : `${mm.toFixed(1)} mm`;
}

export function getPrecipAmount(item) {
    return (item.rain?.['3h'] || 0) + (item.snow?.['3h'] || 0);
}

export function getCurrentPrecip(data) {
    return (data.rain?.['1h'] || 0) + (data.snow?.['1h'] || 0);
}

export function formatTime(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC'
    });
}

export function formatHour(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        timeZone: 'UTC'
    });
}

export function formatDay(timestamp) {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
}

export function getIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export function capitalizeFirst(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

export function degToCompass(deg) {
    if (deg == null) return '';
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
}

export function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function aggregateDailyForecast(forecastList) {
    const days = {};

    for (const item of forecastList) {
        const date = new Date(item.dt * 1000).toDateString();
        if (!days[date]) {
            days[date] = {
                dt: item.dt,
                tempMin: item.main.temp_min,
                tempMax: item.main.temp_max,
                icon: item.weather[0].icon,
                description: item.weather[0].description,
                pop: 0,
                precipTotal: 0,
                items: []
            };
        }
        days[date].tempMin = Math.min(days[date].tempMin, item.main.temp_min);
        days[date].tempMax = Math.max(days[date].tempMax, item.main.temp_max);
        days[date].pop = Math.max(days[date].pop, item.pop || 0);
        days[date].precipTotal += getPrecipAmount(item);
        days[date].items.push(item);

        // Use midday icon as representative
        const hour = new Date(item.dt * 1000).getUTCHours();
        if (hour >= 11 && hour <= 14) {
            days[date].icon = item.weather[0].icon;
            days[date].description = item.weather[0].description;
        }
    }

    return Object.values(days).slice(0, 5);
}
