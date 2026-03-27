const PREFIX = 'weatherDash_';

function get(key) {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function getFavorites() {
    return get('favorites') || [];
}

export function saveFavorites(cities) {
    set('favorites', cities);
}

export function addFavorite(city) {
    const favs = getFavorites();
    const exists = favs.some(f => Math.abs(f.lat - city.lat) < 0.01 && Math.abs(f.lon - city.lon) < 0.01);
    if (!exists) {
        favs.push(city);
        saveFavorites(favs);
    }
    return favs;
}

export function removeFavorite(city) {
    const favs = getFavorites().filter(
        f => !(Math.abs(f.lat - city.lat) < 0.01 && Math.abs(f.lon - city.lon) < 0.01)
    );
    saveFavorites(favs);
    return favs;
}

export function isFavorite(city) {
    return getFavorites().some(f => Math.abs(f.lat - city.lat) < 0.01 && Math.abs(f.lon - city.lon) < 0.01);
}

export function getUnits() {
    return get('units') || 'imperial';
}

export function saveUnits(unit) {
    set('units', unit);
}

export function getLastCity() {
    return get('lastCity');
}

export function saveLastCity(city) {
    set('lastCity', city);
}
