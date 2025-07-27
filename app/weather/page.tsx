'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
  };
  weather: [{
    main: string;
    description: string;
    icon: string;
  }];
  wind: {
    speed: number;
    deg: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
    country: string;
  };
  coord: {
    lat: number;
    lon: number;
  };
  visibility: number;
  rain?: {
    "1h": number;
  };
  snow?: {
    "1h": number;
  };
}

interface WeatherAlert {
  sender_name: string;
  event: string;
  description: string;
  start: number;
  end: number;
}

interface ForecastData {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: [{
    main: string;
    description: string;
    icon: string;
  }];
  wind: {
    speed: number;
  };
}

export default function WeatherPage() {
  const [cities, setCities] = useState<WeatherData[]>([]);
  const [forecasts, setForecasts] = useState<{ [key: string]: ForecastData[] }>({});
  const [newCity, setNewCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [uvIndex, setUvIndex] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<any[]>([]);
  const [mapView, setMapView] = useState<boolean>(false);

  const fetchWeatherData = async (city: string, isSearch: boolean = false) => {
    try {
      setError(null);
      setLoading(true);
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

      if (!apiKey) {
        throw new Error('Weather API key is not configured');
      }

      const encodedCity = encodeURIComponent(city.trim());
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'City not found. Please check the spelling and try again.');
      }

      const data = await response.json();

      // If it's a search, fetch additional data
      if (isSearch) {
        const { lat, lon } = data.coord;

        // Fetch all weather data in parallel
        const [forecastData, airQualityData, oneCallData] = await Promise.all([
          // Forecast data
          fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
            .then(res => res.json()),

          // Air quality data
          fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
            .then(res => res.json()),

          // One Call API for detailed data
          fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&exclude=minutely`)
            .then(res => res.json())
        ]);

        // Update forecasts
        setForecasts(prev => ({
          ...prev,
          [city]: forecastData.list.slice(0, 8)
        }));

        // Update air quality
        setAirQuality(airQualityData.list[0]);

        // Update UV Index
        if (oneCallData.current) {
          setUvIndex(oneCallData.current.uvi);
        }

        // Update weather alerts
        if (oneCallData.alerts) {
          setAlerts(oneCallData.alerts);
        } else {
          setAlerts([]);
        }

        // Update hourly forecast
        if (oneCallData.hourly) {
          setHourlyForecast(oneCallData.hourly.slice(0, 24));
        }

        setSearchResults(data);
        // Add to search history if not already present
        setSearchHistory(prev => {
          const newHistory = [city, ...prev.filter(h => h !== city)].slice(0, 5);
          return newHistory;
        });
      } else {
        // If not a search, just update forecasts
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
        );

        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json();
          setForecasts(prev => ({
            ...prev,
            [city]: forecastData.list.slice(0, 8)
          }));
        }
      }

      return data;
    } catch (error: any) {
      console.error('Error fetching weather:', error);
      let errorMessage = 'An error occurred while fetching weather data.';

      if (error.message.includes('Invalid API key') || error.message.includes('401')) {
        errorMessage = 'The weather service API key is not active yet. New API keys typically take 2-4 hours to activate. Please try again later or use a different API key.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'Weather service is not properly configured. Please check API key.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'City not found. Please check the spelling and try again.';
      } else if (error.message.includes('Nothing to geocode')) {
        errorMessage = 'Please enter a city name.';
      }

      setError(errorMessage);
      setSearchResults(null);
      setAirQuality(null);
      setUvIndex(null);
      setAlerts([]);
      setHourlyForecast([]);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAirQualityDescription = (aqi: number) => {
    const descriptions = {
      1: { text: 'Good', color: 'text-green-500' },
      2: { text: 'Fair', color: 'text-yellow-500' },
      3: { text: 'Moderate', color: 'text-orange-500' },
      4: { text: 'Poor', color: 'text-red-500' },
      5: { text: 'Very Poor', color: 'text-purple-500' }
    };
    return descriptions[aqi as keyof typeof descriptions] || { text: 'Unknown', color: 'text-gray-500' };
  };

  const getWeatherIcon = (code: string) => {
    return `https://openweathermap.org/img/wn/${code}@2x.png`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  }; const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault();
    const cityInput = newCity.trim();

    if (!cityInput) {
      setError('Please enter a city name.');
      return;
    }

    // Basic validation for city name format
    if (!/^[a-zA-Z\s,.-]+$/.test(cityInput)) {
      setError('Please enter a valid city name using letters, spaces, and common punctuation.');
      return;
    }

    await fetchWeatherData(cityInput, true);
    if (!error) {
      setNewCity('');
    }
  };

  const handleAddCity = async (cityName: string) => {
    if (!cityName.trim()) return;

    const weatherData = await fetchWeatherData(cityName);

    if (weatherData) {
      setCities(prev => {
        // Check if city already exists
        const exists = prev.some(city => city.name.toLowerCase() === weatherData.name.toLowerCase());
        if (exists) return prev;
        return [...prev, weatherData];
      });
    }
  };

  const removeCity = (cityName: string) => {
    setCities(prev => prev.filter(city => city.name !== cityName));
  };

  const getUVIndexDescription = (uvi: number) => {
    if (uvi <= 2) return { text: 'Low', color: 'text-green-500' };
    if (uvi <= 5) return { text: 'Moderate', color: 'text-yellow-500' };
    if (uvi <= 7) return { text: 'High', color: 'text-orange-500' };
    if (uvi <= 10) return { text: 'Very High', color: 'text-red-500' };
    return { text: 'Extreme', color: 'text-purple-500' };
  };

  const getPrecipitationChance = (pop: number) => {
    return Math.round(pop * 100);
  };

  const renderWindCompass = (degrees: number) => {
    return (
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-1 h-12 bg-primary origin-bottom transform transition-transform"
            style={{ transform: `rotate(${degrees}deg)` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs font-semibold">N</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs font-semibold rotate-90">E</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs font-semibold rotate-180">S</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs font-semibold -rotate-90">W</div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gradient-to-b from-background to-background/80">
      <h1 className="text-4xl font-bold mb-8 text-center text-gradient">Want to know Local Weather?</h1>
      <div className="max-w-4xl mx-auto mb-8">
        <form onSubmit={handleSearchCity} className="flex gap-4">
          <Input
            type="text"
            value={newCity}
            onChange={(e) => {
              setNewCity(e.target.value);
              if (error) setError(null); // Clear error when user starts typing
            }}
            placeholder="Enter city name (e.g., London, Paris, Tokyo)"
            className={`flex-1 ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
          <Button
            type="submit"
            disabled={loading || !newCity.trim()}
            className="min-w-[100px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching</span>
              </div>
            ) : (
              'Search'
            )}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4 bg-red-500/10 border-red-500/50">
            <AlertDescription className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </AlertDescription>
          </Alert>
        )}

        {searchHistory.length > 0 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Recent searches:</span>
            {searchHistory.map((city) => (
              <Button
                key={city}
                variant="outline"
                size="sm"
                onClick={() => fetchWeatherData(city, true)}
              >
                {city}
              </Button>
            ))}
          </div>
        )}

        {searchResults && (
          <Card className="mt-6 p-6 backdrop-blur-md bg-card/30 border border-border/50">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold">{searchResults.name}, {searchResults.sys.country}</h2>
                    <p className="text-muted-foreground">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                  </div>
                  <Button variant="outline" onClick={() => handleAddCity(searchResults.name)}>
                    Add to Dashboard
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <img
                        src={getWeatherIcon(searchResults.weather[0].icon)}
                        alt={searchResults.weather[0].description}
                        className="w-20 h-20"
                      />
                      <div>
                        <div className="text-5xl font-bold">{Math.round(searchResults.main.temp)}°C</div>
                        <div className="text-lg capitalize">{searchResults.weather[0].description}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Feels Like</div>
                        <div className="text-lg font-semibold">{Math.round(searchResults.main.feels_like)}°C</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">High/Low</div>
                        <div className="text-lg font-semibold">
                          {Math.round(searchResults.main.temp_max)}° / {Math.round(searchResults.main.temp_min)}°
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Wind</div>
                        <div className="text-lg font-semibold">
                          {searchResults.wind.speed} km/h {getWindDirection(searchResults.wind.deg)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Humidity</div>
                        <div className="text-lg font-semibold">{searchResults.main.humidity}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Pressure</div>
                        <div className="text-lg font-semibold">{searchResults.main.pressure} hPa</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Visibility</div>
                        <div className="text-lg font-semibold">{(searchResults.visibility / 1000).toFixed(1)} km</div>
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Sunrise</div>
                          <div className="text-lg font-semibold">{formatTime(searchResults.sys.sunrise)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Sunset</div>
                          <div className="text-lg font-semibold">{formatTime(searchResults.sys.sunset)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>                {alerts && alerts.length > 0 && (
                  <div className="mt-6 border-t border-border/50 pt-4">
                    <h3 className="text-xl font-semibold mb-4 text-yellow-500">Weather Alerts</h3>
                    <div className="space-y-4">
                      {alerts.map((alert, index) => (
                        <Alert key={index} className="bg-yellow-500/10 border-yellow-500/50">
                          <div className="flex flex-col space-y-2">
                            <div className="font-semibold">{alert.event}</div>
                            <div className="text-sm">{alert.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(alert.start * 1000).toLocaleString()} - {new Date(alert.end * 1000).toLocaleString()}
                            </div>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 border-t border-border/50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {airQuality && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Air Quality</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Air Quality Index</div>
                          <div className={`text-lg font-semibold ${getAirQualityDescription(airQuality.main.aqi).color}`}>
                            {getAirQualityDescription(airQuality.main.aqi).text}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">CO</div>
                          <div className="text-lg font-semibold">{airQuality.components.co.toFixed(2)} μg/m³</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">NO₂</div>
                          <div className="text-lg font-semibold">{airQuality.components.no2.toFixed(2)} μg/m³</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">O₃</div>
                          <div className="text-lg font-semibold">{airQuality.components.o3.toFixed(2)} μg/m³</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Wind Information</h3>
                    <div className="flex items-center justify-between">
                      {renderWindCompass(searchResults.wind.deg)}
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Wind Speed</div>
                          <div className="text-lg font-semibold">{searchResults.wind.speed} km/h</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Wind Direction</div>
                          <div className="text-lg font-semibold">{getWindDirection(searchResults.wind.deg)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {uvIndex !== null && (
                  <div className="mt-6 border-t border-border/50 pt-4">
                    <h3 className="text-xl font-semibold mb-4">UV Index</h3>
                    <div className="flex items-center space-x-4">
                      <div className={`text-4xl font-bold ${getUVIndexDescription(uvIndex).color}`}>
                        {uvIndex.toFixed(1)}
                      </div>
                      <div>
                        <div className={`font-semibold ${getUVIndexDescription(uvIndex).color}`}>
                          {getUVIndexDescription(uvIndex).text}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {uvIndex <= 2 ? 'No protection required' :
                            uvIndex <= 5 ? 'Protection required' :
                              'Extra protection required'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}                {hourlyForecast && hourlyForecast.length > 0 && (
                  <div className="mt-6 border-t border-border/50 pt-4">
                    <h3 className="text-xl font-semibold mb-4">Hourly Forecast</h3>
                    <div className="space-y-6">
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={hourlyForecast}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="dt"
                              tickFormatter={(value) => formatTime(value)}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(value) => formatTime(value)}
                              formatter={(value: number) => [`${Math.round(value)}°C`]}
                            />
                            <Line
                              type="monotone"
                              dataKey="temp"
                              stroke="#3b82f6"
                              activeDot={{ r: 8 }}
                              name="Temperature"
                            />
                            <Line
                              type="monotone"
                              dataKey="pop"
                              stroke="#22c55e"
                              activeDot={{ r: 8 }}
                              yAxisId={1}
                              name="Precipitation"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="overflow-x-auto">
                        <div className="inline-flex gap-4 pb-4">
                          {hourlyForecast.slice(0, 12).map((hour: any, index: number) => (
                            <div key={hour.dt} className="flex flex-col items-center space-y-2 min-w-[80px]">
                              <div className="text-sm text-muted-foreground">
                                {formatTime(hour.dt)}
                              </div>
                              <img
                                src={getWeatherIcon(hour.weather[0].icon)}
                                alt={hour.weather[0].description}
                                className="w-8 h-8"
                              />
                              <div className="font-medium">{Math.round(hour.temp)}°C</div>
                              <div className="text-xs text-muted-foreground">
                                {getPrecipitationChance(hour.pop)}% rain
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {cities.map((city) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-6 backdrop-blur-md bg-card/30 border border-border/50 relative group hover:shadow-lg transition-all">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeCity(city.name)}
                  >
                    ×
                  </Button>

                  <Tabs defaultValue="current" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="current">Current</TabsTrigger>
                      <TabsTrigger value="forecast">Forecast</TabsTrigger>
                    </TabsList>

                    <TabsContent value="current" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-semibold">{city.name}</h2>
                          <span className="text-sm text-muted-foreground">{city.sys.country}</span>
                        </div>
                        <img
                          src={getWeatherIcon(city.weather[0].icon)}
                          alt={city.weather[0].description}
                          className="w-16 h-16"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-4xl font-bold">{Math.round(city.main.temp)}°C</div>
                          <div className="text-sm text-muted-foreground">
                            Feels like {Math.round(city.main.feels_like)}°
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold capitalize">
                            {city.weather[0].main}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {city.weather[0].description}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Min/Max</div>
                          <div className="font-medium">
                            {Math.round(city.main.temp_min)}° / {Math.round(city.main.temp_max)}°
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Pressure</div>
                          <div className="font-medium">{city.main.pressure} hPa</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                          </svg>
                          <div>
                            <div className="text-sm text-muted-foreground">Humidity</div>
                            <div className="font-medium">{city.main.humidity}%</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <div>
                            <div className="text-sm text-muted-foreground">Wind</div>
                            <div className="font-medium">
                              {city.wind.speed} km/h {getWindDirection(city.wind.deg)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Sunrise</div>
                          <div className="font-medium">{formatTime(city.sys.sunrise)}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Sunset</div>
                          <div className="font-medium">{formatTime(city.sys.sunset)}</div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="forecast">
                      <div className="h-[200px] w-full">
                        {forecasts[city.name] && (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecasts[city.name]}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="dt"
                                tickFormatter={(value) => formatTime(value)}
                              />
                              <YAxis />
                              <Tooltip
                                labelFormatter={(value) => formatTime(value)}
                                formatter={(value: number) => [`${Math.round(value)}°C`]}
                              />
                              <Line
                                type="monotone"
                                dataKey="main.temp"
                                stroke="#3b82f6"
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {forecasts[city.name]?.slice(0, 4).map((forecast: ForecastData) => (
                          <div key={forecast.dt} className="text-center">
                            <div className="text-sm text-muted-foreground">
                              {formatTime(forecast.dt)}
                            </div>
                            <img
                              src={getWeatherIcon(forecast.weather[0].icon)}
                              alt={forecast.weather[0].description}
                              className="w-8 h-8 mx-auto"
                            />
                            <div className="text-sm font-medium">
                              {Math.round(forecast.main.temp)}°
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
