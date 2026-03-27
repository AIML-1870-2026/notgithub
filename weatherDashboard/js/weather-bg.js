const GRADIENTS = {
    clear: {
        night: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        dawn: 'linear-gradient(135deg, #2c1654 0%, #a13e3e 50%, #c47a15 100%)',
        day: 'linear-gradient(135deg, #1565a0 0%, #2d8bc9 50%, #5ab0e0 100%)',
        dusk: 'linear-gradient(135deg, #141e30 0%, #b8391d 40%, #c4791a 100%)'
    },
    clouds: {
        night: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)',
        dawn: 'linear-gradient(135deg, #2e1557 0%, #a8505e 50%, #c48a5e 100%)',
        day: 'linear-gradient(135deg, #3d4a5c 0%, #5c7089 50%, #7a8ea6 100%)',
        dusk: 'linear-gradient(135deg, #1a1a2e 0%, #7d4560 40%, #9e6048 100%)'
    },
    rain: {
        night: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1c2431 100%)',
        dawn: 'linear-gradient(135deg, #1e2d3d 0%, #3a5068 50%, #5c7080 100%)',
        day: 'linear-gradient(135deg, #344b60 0%, #506a80 50%, #6e8498 100%)',
        dusk: 'linear-gradient(135deg, #1e2a38 0%, #3a5068 40%, #5c7080 100%)'
    },
    snow: {
        night: 'linear-gradient(135deg, #1a1a2e 0%, #2d3748 50%, #4a5568 100%)',
        dawn: 'linear-gradient(135deg, #4a5f8a 0%, #7a90af 50%, #96a8c0 100%)',
        day: 'linear-gradient(135deg, #506888 0%, #7290ab 50%, #8aa4bc 100%)',
        dusk: 'linear-gradient(135deg, #2d3748 0%, #4a5f8a 40%, #7a90af 100%)'
    },
    thunderstorm: {
        night: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #2d1b4e 100%)',
        dawn: 'linear-gradient(135deg, #1a1a2e 0%, #4a3760 50%, #6a4c93 100%)',
        day: 'linear-gradient(135deg, #2c3e50 0%, #485563 50%, #6a4c93 100%)',
        dusk: 'linear-gradient(135deg, #0a0a0a 0%, #2c3e50 40%, #4a3760 100%)'
    },
    atmosphere: {
        night: 'linear-gradient(135deg, #1a1a2e 0%, #2d3748 50%, #4a5568 100%)',
        dawn: 'linear-gradient(135deg, #5a6a74 0%, #708090 50%, #607078 100%)',
        day: 'linear-gradient(135deg, #4a5a68 0%, #607888 50%, #7890a0 100%)',
        dusk: 'linear-gradient(135deg, #3a4e5a 0%, #607078 40%, #708090 100%)'
    }
};

function getConditionGroup(weatherCode) {
    if (weatherCode >= 200 && weatherCode < 300) return 'thunderstorm';
    if (weatherCode >= 300 && weatherCode < 400) return 'rain';
    if (weatherCode >= 500 && weatherCode < 600) return 'rain';
    if (weatherCode >= 600 && weatherCode < 700) return 'snow';
    if (weatherCode >= 700 && weatherCode < 800) return 'atmosphere';
    if (weatherCode === 800) return 'clear';
    return 'clouds';
}

function getTimePeriod(sunrise, sunset) {
    const now = Math.floor(Date.now() / 1000);
    const dawnStart = sunrise - 1800;
    const dawnEnd = sunrise + 1800;
    const duskStart = sunset - 1800;
    const duskEnd = sunset + 1800;

    if (now >= dawnStart && now <= dawnEnd) return 'dawn';
    if (now >= duskStart && now <= duskEnd) return 'dusk';
    if (now > dawnEnd && now < duskStart) return 'day';
    return 'night';
}

export function updateBackground(weatherCode, sunrise, sunset) {
    const group = getConditionGroup(weatherCode);
    const period = getTimePeriod(sunrise, sunset);
    const gradient = GRADIENTS[group]?.[period] || GRADIENTS.clear.day;

    document.body.style.background = gradient;
    document.body.style.backgroundAttachment = 'fixed';
}

export function getConditionName(weatherCode) {
    return getConditionGroup(weatherCode);
}
