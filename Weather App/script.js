class WeatherApp {
    constructor() {
        this.apiKey = "8eb77a58c87aafa25f6b045a938b5b73";
        this.currentUnit = 'metric';
        this.currentWeatherData = null;
        this.favorites = this.loadFavorites();
        this.isDarkMode = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateDateTime();
        this.displayFavorites();
        
        // Update date/time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    initializeElements() {
        // Input elements
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.locationBtn = document.getElementById('locationBtn');
        this.themeBtn = document.getElementById('themeBtn');
        this.unitBtn = document.getElementById('unitBtn');
        this.favoriteBtn = document.getElementById('favoriteBtn');
        
        // Display elements
        this.loading = document.getElementById('loading');
        this.errorMsg = document.getElementById('errorMsg');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        this.cityName = document.getElementById('cityName');
        this.dateTime = document.getElementById('dateTime');
        this.coordinates = document.getElementById('coordinates');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.fallbackIcon = document.getElementById('fallbackIcon');
        this.temperature = document.getElementById('temperature');
        this.description = document.getElementById('description');
        this.feelsLike = document.getElementById('feelsLike');
        
        // Weather details
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.visibility = document.getElementById('visibility');
        this.pressure = document.getElementById('pressure');
        this.uvIndex = document.getElementById('uvIndex');
        this.precipitation = document.getElementById('precipitation');
        
        // Forecast containers
        this.forecastContainer = document.getElementById('forecastContainer');
        this.hourlyContainer = document.getElementById('hourlyContainer');
        this.favoritesList = document.getElementById('favoritesList');
        this.favoritesSection = document.getElementById('favoritesSection');
    }

    attachEventListeners() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Location button
        this.locationBtn.addEventListener('click', () => this.getCurrentLocation());
        
        // Theme and unit toggles
        this.themeBtn.addEventListener('click', () => this.toggleTheme());
        this.unitBtn.addEventListener('click', () => this.toggleUnit());
        
        // Favorite button
        this.favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        
        // Popular city buttons
        document.querySelectorAll('.city-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const city = e.target.dataset.city;
                this.searchWeather(city);
            });
        });
    }

    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        if (this.dateTime) {
            this.dateTime.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    async handleSearch() {
        const city = this.cityInput.value.trim();
        if (!city) return;
        await this.searchWeather(city);
        this.cityInput.value = '';
    }

    async searchWeather(city) {
        this.showLoading();
        this.hideError();
        
        try {
            const weatherData = await this.fetchWeatherData(`q=${encodeURIComponent(city)}`);
            this.displayWeatherData(weatherData);
        } catch (error) {
            this.showError('City not found. Please check the spelling and try again.');
            console.error('Search error:', error);
        }
        
        this.hideLoading();
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser.');
            return;
        }

        this.showLoading();
        this.hideError();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const weatherData = await this.fetchWeatherData(`lat=${latitude}&lon=${longitude}`);
                    this.displayWeatherData(weatherData);
                } catch (error) {
                    this.showError('Failed to get weather for your location.');
                    console.error('Location error:', error);
                } finally {
                    this.hideLoading();
                }
            },
            (error) => {
                this.hideLoading();
                this.showError('Unable to access your location. Please search manually.');
                console.error('Geolocation error:', error);
            }
        );
    }

    async fetchWeatherData(query) {
        // Current weather
        const currentResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?${query}&units=${this.currentUnit}&appid=${this.apiKey}`
        );
        
        if (!currentResponse.ok) {
            throw new Error('Weather data not found');
        }
        
        const currentData = await currentResponse.json();
        
        // 5-day forecast
        let forecastData = null;
        try {
            const forecastResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?${query}&units=${this.currentUnit}&appid=${this.apiKey}`
            );
            if (forecastResponse.ok) {
                forecastData = await forecastResponse.json();
            }
        } catch (error) {
            console.warn('Forecast data unavailable:', error);
        }
        
        return { current: currentData, forecast: forecastData };
    }

    displayWeatherData({ current, forecast }) {
        this.currentWeatherData = current;
        
        // Update current weather display
        this.cityName.textContent = `${current.name}, ${current.sys.country}`;
        this.coordinates.textContent = `${current.coord.lat.toFixed(2)}°, ${current.coord.lon.toFixed(2)}°`;
        
        // Weather icon with fallback
        const iconCode = current.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
        
        this.weatherIcon.src = iconUrl;
        this.weatherIcon.style.display = 'block';
        this.fallbackIcon.style.display = 'none';
        
        // Set fallback icon based on weather condition
        this.setFallbackIcon(current.weather[0].main);
        
        // Temperature and description
        const tempUnit = this.currentUnit === 'metric' ? '°C' : '°F';
        this.temperature.textContent = `${Math.round(current.main.temp)}${tempUnit}`;
        this.description.textContent = current.weather[0].description;
        this.feelsLike.textContent = `${Math.round(current.main.feels_like)}${tempUnit}`;
        
        // Weather details
        this.humidity.textContent = `${current.main.humidity}%`;
        
        const windSpeedUnit = this.currentUnit === 'metric' ? 'km/h' : 'mph';
        const windSpeed = this.currentUnit === 'metric' 
            ? (current.wind.speed * 3.6).toFixed(1) 
            : current.wind.speed.toFixed(1);
        this.windSpeed.textContent = `${windSpeed} ${windSpeedUnit}`;
        
        this.visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
        this.pressure.textContent = `${current.main.pressure} hPa`;
        this.uvIndex.textContent = 'N/A'; // UV index requires different API call
        
        const precipitation = current.rain?.['1h'] || current.snow?.['1h'] || 0;
        this.precipitation.textContent = `${precipitation} mm`;
        
        // Update favorite button
        this.updateFavoriteButton();
        
        // Display forecast data
        if (forecast) {
            this.displayForecast(forecast);
            this.displayHourlyForecast(forecast);
        }
        
        // Update background and particles
        this.updateWeatherBackground(current.weather[0].main.toLowerCase());
        this.createWeatherParticles(current.weather[0].main.toLowerCase());
        
        // Show weather display
        this.weatherDisplay.classList.remove('hidden');
        
        // Show favorites section if there are favorites
        if (this.favorites.length > 0) {
            this.favoritesSection.classList.remove('hidden');
        }
    }

    setFallbackIcon(weatherMain) {
        const iconMap = {
            'Clear': 'fa-sun',
            'Clouds': 'fa-cloud',
            'Rain': 'fa-cloud-rain',
            'Drizzle': 'fa-cloud-drizzle',
            'Thunderstorm': 'fa-bolt',
            'Snow': 'fa-snowflake',
            'Mist': 'fa-smog',
            'Smoke': 'fa-smog',
            'Haze': 'fa-smog',
            'Dust': 'fa-smog',
            'Fog': 'fa-smog',
            'Sand': 'fa-smog',
            'Ash': 'fa-smog',
            'Squall': 'fa-wind',
            'Tornado': 'fa-tornado'
        };
        this.fallbackIcon.className = `fas ${iconMap[weatherMain] || 'fa-sun'}`;
    }

    displayForecast(forecastData) {
        this.forecastContainer.innerHTML = '';
        
        // Get daily forecasts (one per day for 5 days)
        const dailyForecasts = this.processDailyForecast(forecastData.list);
        
        dailyForecasts.forEach((day, index) => {
            const date = new Date(day.dt * 1000);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            
            const tempUnit = this.currentUnit === 'metric' ? '°' : '°F';
            const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
            
            forecastItem.innerHTML = `
                <div class="day">${dayName}</div>
                <div class="weather-icon">
                    <img src="${iconUrl}" alt="${day.weather[0].description}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <i class="fas ${this.getWeatherIcon(day.weather[0].main)}" style="display: none;"></i>
                </div>
                <div class="temps">
                    <span class="high">${Math.round(day.main.temp_max)}${tempUnit}</span>
                    <span class="low">${Math.round(day.main.temp_min)}${tempUnit}</span>
                </div>
                <div class="desc">${day.weather[0].description}</div>
            `;
            
            this.forecastContainer.appendChild(forecastItem);
        });
    }

    displayHourlyForecast(forecastData) {
        this.hourlyContainer.innerHTML = '';
        
        // Show next 24 hours (8 items, 3-hour intervals)
        const hourlyData = forecastData.list.slice(0, 8);
        
        hourlyData.forEach(hour => {
            const date = new Date(hour.dt * 1000);
            const hourVal = date.getHours();
            const time = hourVal === 0 ? '12 AM' : 
                        hourVal === 12 ? '12 PM' :
                        hourVal > 12 ? `${hourVal - 12} PM` : `${hourVal} AM`;
            
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            
            const tempUnit = this.currentUnit === 'metric' ? '°' : '°F';
            const iconUrl = `https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png`;
            
            hourlyItem.innerHTML = `
                <div class="time">${time}</div>
                <div class="weather-icon">
                    <img src="${iconUrl}" alt="${hour.weather[0].description}"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <i class="fas ${this.getWeatherIcon(hour.weather[0].main)}" style="display: none;"></i>
                </div>
                <div class="temp">${Math.round(hour.main.temp)}${tempUnit}</div>
                <div class="desc">${hour.weather[0].main}</div>
            `;
            
            this.hourlyContainer.appendChild(hourlyItem);
        });
    }

    processDailyForecast(forecastList) {
        const dailyData = {};
        
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            
            if (!dailyData[date]) {
                dailyData[date] = {
                    ...item,
                    main: {
                        ...item.main,
                        temp_min: item.main.temp,
                        temp_max: item.main.temp
                    }
                };
            } else {
                dailyData[date].main.temp_min = Math.min(dailyData[date].main.temp_min, item.main.temp);
                dailyData[date].main.temp_max = Math.max(dailyData[date].main.temp_max, item.main.temp);
            }
        });
        
        return Object.values(dailyData).slice(0, 5);
    }

    getWeatherIcon(weatherMain) {
        const iconMap = {
            'Clear': 'fa-sun',
            'Clouds': 'fa-cloud',
            'Rain': 'fa-cloud-rain',
            'Drizzle': 'fa-cloud-drizzle',
            'Thunderstorm': 'fa-bolt',
            'Snow': 'fa-snowflake',
            'Mist': 'fa-smog',
            'Smoke': 'fa-smog',
            'Haze': 'fa-smog',
            'Dust': 'fa-smog',
            'Fog': 'fa-smog',
            'Sand': 'fa-smog',
            'Ash': 'fa-smog',
            'Squall': 'fa-wind',
            'Tornado': 'fa-tornado'
        };
        return iconMap[weatherMain] || 'fa-sun';
    }

    updateWeatherBackground(weatherMain) {
        // Remove existing weather classes
        document.body.className = '';
        
        // Add weather-specific class
        switch(weatherMain) {
            case 'clear':
                document.body.classList.add('clear');
                break;
            case 'clouds':
                document.body.classList.add('clouds');
                break;
            case 'rain':
            case 'drizzle':
                document.body.classList.add('rain');
                break;
            case 'snow':
                document.body.classList.add('snow');
                break;
            case 'thunderstorm':
                document.body.classList.add('thunderstorm');
                break;
            case 'mist':
            case 'smoke':
            case 'haze':
            case 'dust':
            case 'fog':
            case 'sand':
            case 'ash':
                document.body.classList.add('mist');
                break;
        }
    }

    createWeatherParticles(weatherMain) {
        const particlesContainer = document.getElementById('weatherParticles');
        particlesContainer.innerHTML = '';
        
        if (weatherMain === 'rain' || weatherMain === 'drizzle') {
            this.createRainParticles(particlesContainer);
        } else if (weatherMain === 'snow') {
            this.createSnowParticles(particlesContainer);
        }
    }

    createRainParticles(container) {
        const numDrops = 100;
        
        for (let i = 0; i < numDrops; i++) {
            const drop = document.createElement('div');
            drop.style.cssText = `
                position: absolute;
                width: 2px;
                height: 20px;
                background: linear-gradient(to bottom, transparent, rgba(173, 216, 230, 0.8));
                left: ${Math.random() * 100}vw;
                animation: rainfall ${Math.random() * 1 + 0.5}s linear infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            container.appendChild(drop);
        }
        
        // Add rainfall animation if not exists
        if (!document.querySelector('#rainfall-style')) {
            const style = document.createElement('style');
            style.id = 'rainfall-style';
            style.textContent = `
                @keyframes rainfall {
                    0% { transform: translateY(-100vh) rotate(10deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(10deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    createSnowParticles(container) {
        const numFlakes = 50;
        
        for (let i = 0; i < numFlakes; i++) {
            const flake = document.createElement('div');
            const size = Math.random() * 8 + 4;
            flake.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: white;
                border-radius: 50%;
                left: ${Math.random() * 100}vw;
                animation: snowfall ${Math.random() * 4 + 3}s linear infinite;
                animation-delay: ${Math.random() * 2}s;
                opacity: ${Math.random() * 0.8 + 0.2};
            `;
            container.appendChild(flake);
        }
        
        // Add snowfall animation if not exists
        if (!document.querySelector('#snowfall-style')) {
            const style = document.createElement('style');
            style.id = 'snowfall-style';
            style.textContent = `
                @keyframes snowfall {
                    0% { transform: translateY(-100vh) rotate(0deg); }
                    100% { transform: translateY(100vh) rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        this.themeBtn.innerHTML = `<i class="fas fa-${this.isDarkMode ? 'sun' : 'moon'}"></i>`;
        localStorage.setItem('weatherTheme', this.isDarkMode ? 'dark' : 'light');
    }

    toggleUnit() {
        this.currentUnit = this.currentUnit === 'metric' ? 'imperial' : 'metric';
        this.unitBtn.textContent = this.currentUnit === 'metric' ? '°C' : '°F';
        
        if (this.currentWeatherData) {
            this.searchWeather(this.currentWeatherData.name);
        }
    }

    toggleFavorite() {
        if (!this.currentWeatherData) return;
        
        const cityKey = `${this.currentWeatherData.name}, ${this.currentWeatherData.sys.country}`;
        const index = this.favorites.indexOf(cityKey);
        
        if (index === -1) {
            this.favorites.push(cityKey);
        } else {
            this.favorites.splice(index, 1);
        }
        
        this.saveFavorites();
        this.updateFavoriteButton();
        this.displayFavorites();
    }

    updateFavoriteButton() {
        if (!this.currentWeatherData) return;
        
        const cityKey = `${this.currentWeatherData.name}, ${this.currentWeatherData.sys.country}`;
        const isFavorite = this.favorites.includes(cityKey);
        
        this.favoriteBtn.innerHTML = `<i class="fas fa-${isFavorite ? 'heart' : 'heart-broken'}"></i>`;
        this.favoriteBtn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
    }

    saveFavorites() {
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
    }

    loadFavorites() {
        const favorites = localStorage.getItem('weatherFavorites');
        return favorites ? JSON.parse(favorites) : [];
    }

    displayFavorites() {
        this.favoritesList.innerHTML = '';
        
        if (this.favorites.length === 0) {
            this.favoritesSection.classList.add('hidden');
            return;
        }
        
        this.favorites.forEach(city => {
            const favItem = document.createElement('div');
            favItem.className = 'favorite-item';
            
            favItem.innerHTML = `
                <span>${city}</span>
                <button class="remove-fav"><i class="fas fa-times"></i></button>
            `;
            
            favItem.querySelector('span').addEventListener('click', () => {
                this.searchWeather(city.split(',')[0]);
            });
            
            favItem.querySelector('.remove-fav').addEventListener('click', (e) => {
                e.stopPropagation();
                const index = this.favorites.indexOf(city);
                if (index > -1) {
                    this.favorites.splice(index, 1);
                    this.saveFavorites();
                    this.displayFavorites();
                }
            });
            
            this.favoritesList.appendChild(favItem);
        });
    }

    showLoading() {
        this.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.loading.classList.add('hidden');
    }

    showError(message) {
        this.errorMsg.textContent = message;
        this.errorMsg.classList.remove('hidden');
        this.weatherDisplay.classList.add('hidden');
    }

    hideError() {
        this.errorMsg.classList.add('hidden');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new WeatherApp();
    
    // Restore theme from localStorage
    const savedTheme = localStorage.getItem('weatherTheme');
    if (savedTheme) {
        app.isDarkMode = savedTheme === 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        app.themeBtn.innerHTML = `<i class="fas fa-${app.isDarkMode ? 'sun' : 'moon'}"></i>`;
    }
});
