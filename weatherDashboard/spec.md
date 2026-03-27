# Weather Dashboard

An Apple iOS Weather-inspired dashboard built with vanilla HTML, CSS, and JavaScript.

## Features

### City Search
- Debounced geocoding search (300ms) with dropdown results
- Displays city name, state, and country for disambiguation
- Click-outside dismissal

### Geolocation
- Auto-detects user location on first visit via browser geolocation
- Falls back to last viewed city (localStorage), then Omaha, NE as default
- Reverse geocoding resolves coordinates to city name

### Current Weather
- Large temperature display with weather icon and condition description
- Feels like, daily high/low range
- Favorite (heart) toggle to save city

### 3-Hour Forecast
- Horizontal scrollable row of 8 intervals (24 hours)
- Each card: time, icon, temperature, precipitation probability (when > 0%)
- Right-edge fade gradient hints at scrollability
- Tooltips with wind speed and expected precipitation amounts

### 5-Day Forecast
- Aggregated daily high/low from 3-hour API data
- Temperature range bar visualization scaled across all days
- Midday icon selection for representative condition
- Precipitation probability with accumulated totals in tooltips

### Air Quality Index
- Color-coded AQI badge (1-5 scale: Good to Very Poor)
- Health recommendation text per level
- Component breakdown: PM2.5, PM10, O3, NO2, SO2, CO

### Weather Details (3x3 Grid)
- **Wind** — Speed, compass direction, animated arrow, gust speed
- **Humidity** — Relative humidity percentage
- **Precipitation** — Last 1-hour rain/snow total
- **Pressure** — Atmospheric pressure in hPa
- **Visibility** — Distance in miles or kilometers
- **Cloudiness** — Sky cover percentage
- **Sunrise** — Local sunrise time
- **Sunset** — Local sunset time
- **Feels Like** — Adjusted temperature accounting for wind chill and humidity
- Hover tooltips on every tile explaining what each metric means

### Weather Map
- Leaflet.js with OpenStreetMap base tiles
- Toggle between Temperature and Precipitation overlay layers (OWM tile API)
- Temperature bubble markers on nearby cities (up to 6, spaced 40km+ apart via haversine filtering)
- Auto-centers on selected city at zoom level 8

### Imperial/Metric Toggle
- Full system toggle: temperature (°F/°C), wind speed (mph/m/s), visibility (mi/km), precipitation (in/mm)
- Re-fetches all data from API on switch
- Persisted in localStorage

### Favorite Cities
- Save/remove cities via heart button on current weather card
- Pill chip bar for quick switching between saved cities
- Inline remove (×) on each chip
- Deduplicated by lat/lon proximity (0.01° threshold)
- Persisted in localStorage

### Dynamic Backgrounds
- 24 gradient combinations: 6 weather conditions (clear, clouds, rain, snow, thunderstorm, atmosphere) × 4 time periods (night, dawn, day, dusk)
- Time period calculated from sunrise/sunset timestamps (±30 min transition windows)
- Dark-tinted gradients ensure white text contrast on all conditions

## Design System
- **Font**: Inter (Google Fonts CDN) with system font fallback
- **Cards**: Frosted glass — `rgba(0,0,0,0.25)` background, `blur(40px) saturate(180%)`, 18px border-radius, inset highlight border
- **Layout**: CSS Grid, 2-column desktop, single-column below 768px
- **Text**: White/translucent with text-shadow for legibility
- **Icons**: OpenWeatherMap 2x resolution, inline SVGs for UI elements
- **Scrolling**: Horizontal scroll-snap on forecast with thin visible scrollbar

## Tech
- ES Modules architecture (8 files: main, config, api, ui, utils, map, storage, weather-bg)
- OpenWeatherMap free-tier API (current, forecast, air pollution, geocoding, reverse geocoding, find nearby)
- Leaflet.js via CDN for map rendering
- localStorage for persistence (prefixed `weatherDash_`)
- No build tools, no frameworks, no dependencies beyond CDN links
