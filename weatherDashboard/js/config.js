// NOTE: On GitHub Pages this key is exposed in client-side JS.
// Set usage caps in your OpenWeatherMap dashboard to prevent abuse.
export const API_KEY = '11b3c1dbec3ded5f9d2062f15633fc24';

export const BASE_URLS = {
    current: 'https://api.openweathermap.org/data/2.5/weather',
    forecast: 'https://api.openweathermap.org/data/2.5/forecast',
    airPollution: 'https://api.openweathermap.org/data/2.5/air_pollution',
    geocoding: 'https://api.openweathermap.org/geo/1.0/direct',
    reverseGeo: 'https://api.openweathermap.org/geo/1.0/reverse',
    mapTile: 'https://tile.openweathermap.org/map'
};

export const UNIT_LABELS = {
    imperial: {
        temp: '\u00b0F',
        wind: 'mph',
        pressure: 'hPa',
        visibility: 'mi'
    },
    metric: {
        temp: '\u00b0C',
        wind: 'm/s',
        pressure: 'hPa',
        visibility: 'km'
    }
};

export const DEFAULT_CITY = {
    name: 'Omaha',
    lat: 41.2565,
    lon: -95.9345,
    country: 'US',
    state: 'Nebraska'
};

export const AQI_LEVELS = [
    { label: 'Good', color: '#4CAF50', advice: 'Air quality is satisfactory. Enjoy your outdoor activities.' },
    { label: 'Fair', color: '#FFC107', advice: 'Air quality is acceptable. Sensitive individuals should limit prolonged outdoor exertion.' },
    { label: 'Moderate', color: '#FF9800', advice: 'Members of sensitive groups may experience health effects. Limit prolonged outdoor exertion.' },
    { label: 'Poor', color: '#F44336', advice: 'Everyone may begin to experience health effects. Avoid prolonged outdoor exertion.' },
    { label: 'Very Poor', color: '#9C27B0', advice: 'Health alert: everyone may experience serious health effects. Avoid all outdoor exertion.' }
];
