"use client";

import DotGrid from "@/components/Backgrounds/DotGrid/DotGrid";
import { useTheme } from "next-themes";
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  NewspaperIcon, 
  CloudSunIcon, 
  CarIcon, 
  ArrowRightIcon, 
  RssIcon, 
  GlobeIcon, 
  TrendingUpIcon,
  ThermometerIcon,
  MapPinIcon,
  WindIcon,
  CloudRainIcon,
  SunIcon,
  MoonIcon,
  DropletIcon,
  Clock,
  CalendarIcon,
  MapIcon,
  LayersIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import Carousel from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { GoogleMap, LoadScript, TrafficLayer, Marker } from '@react-google-maps/api';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock news data for carousel


// Weather icon mapping
const weatherIcons: {[key: string]: React.ReactNode} = {
  Clear: <SunIcon className="h-8 w-8 text-yellow-500" />,
  Clouds: <CloudSunIcon className="h-8 w-8 text-gray-500" />,
  Rain: <CloudRainIcon className="h-8 w-8 text-blue-500" />,
  Drizzle: <CloudRainIcon className="h-8 w-8 text-blue-400" />,
  Thunderstorm: <CloudRainIcon className="h-8 w-8 text-purple-500" />,
  Snow: <CloudRainIcon className="h-8 w-8 text-blue-200" />,
  Mist: <CloudSunIcon className="h-8 w-8 text-gray-400" />,
  Fog: <CloudSunIcon className="h-8 w-8 text-gray-400" />,
  Haze: <CloudSunIcon className="h-8 w-8 text-gray-400" />,
  Night: <MoonIcon className="h-8 w-8 text-indigo-600" />
};

// Weather component
function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(latitude, longitude);
        },
        (err) => {
          console.error("Error getting location:", err);
          setError("Location access denied. Using default location.");
          // Use default location (New York)
          fetchWeather(40.7128, -74.0060);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser. Using default location.");
      // Use default location (New York)
      fetchWeather(40.7128, -74.0060);
    }
  }, []);
  
  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=1&aqi=no&alerts=no`
      );
      
      if (!res.ok) {
        throw new Error("Weather data could not be fetched");
      }
      
      const data = await res.json();
      setWeather(data);
      setLocation(data.location.name);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather:", error);
      setError("Unable to fetch weather data");
      setLoading(false);
    }
  };
  
  // Helper to get the appropriate weather icon
  const getWeatherIcon = (condition: string, isDay: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    let icon;
    const sizeMap = {
      sm: "h-5 w-5",
      md: "h-8 w-8",
      lg: "h-16 w-16"
    };
    
    if (isDay === 0) {
      icon = <MoonIcon className={`${sizeMap[size]} text-indigo-600`} />;
    } else {
      for (const [key, value] of Object.entries(weatherIcons)) {
        if (condition.toLowerCase().includes(key.toLowerCase())) {
          const IconComponent = value as React.ReactNode;
          return React.cloneElement(IconComponent as React.ReactElement, { 
            className: `${sizeMap[size]} ${(IconComponent as React.ReactElement).props.className.split(' ').filter((c: string) => !c.includes('h-') && !c.includes('w-')).join(' ')}` 
          });
        }
      }
      
      // Default sunny icon if no match
      icon = <SunIcon className={`${sizeMap[size]} text-yellow-500`} />;
    }
    
    return icon;
  };

  // Get time of day description
  const getTimeOfDay = () => {
    if (!weather) return '';
    
    const hour = new Date().getHours();
    const isDay = weather.current.is_day;
    
    if (isDay === 0) {
      return hour < 4 ? 'night' : 'evening';
    } else {
      if (hour < 12) return 'morning';
      if (hour < 17) return 'afternoon';
      return 'evening';
    }
  };
  
  if (loading) {
    return (
      <Card className="w-full overflow-hidden border-border">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6">
            <div className="flex flex-col space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="p-6 bg-card">
            <div className="grid grid-cols-2 gap-6 animate-pulse">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-8">
            <div className="text-center py-4">
              <CloudRainIcon className="h-12 w-12 text-red-500/70 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">Weather Unavailable</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!weather) return null;

  // Get forecast data
  const forecastToday = weather.forecast?.forecastday?.[0]?.day;
  const isDay = weather.current.is_day;
  const timeOfDay = getTimeOfDay();
  
  return (
    <Card className="w-full overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-0">
        {/* Weather Header with Gradient */}
        <div className={`relative p-6 ${
          isDay 
            ? 'dark:from-blue-900/20 dark:to-indigo-900/20' 
            : 'dark:from-indigo-950/30 dark:to-purple-900/30'
        }`}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-start"
          >
            {/* Left Side - Location and Temperature */}
            <div>
              <div className="flex items-center mb-1">
                <MapPinIcon className="h-4 w-4 text-primary/70 mr-1" />
                <p className="text-sm font-medium text-foreground/80">{location}</p>
                {isDay === 1 ? (
                  <SunIcon className="h-4 w-4 text-yellow-500 ml-2" />
                ) : (
                  <MoonIcon className="h-4 w-4 text-indigo-600 ml-2" />
                )}
              </div>
              <div className="flex items-end">
                <h3 className="text-4xl font-bold">{weather.current.temp_c}°</h3>
                <div className="text-sm text-foreground/70 ml-2 mb-1.5">
                  <span>Feels like {weather.current.feelslike_c}°</span>
                </div>
              </div>
              <p className="text-lg font-medium mt-1">{weather.current.condition.text}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Good {timeOfDay}!
              </p>
            </div>
            
            {/* Right Side - Weather Icon */}
            <div className="rounded-full bg-white/30 dark:bg-black/10 backdrop-blur-sm p-3 shadow-sm">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  type: "spring", 
                  stiffness: 100 
                }}
              >
                {getWeatherIcon(weather.current.condition.text, isDay, 'lg')}
              </motion.div>
            </div>
          </motion.div>
          
          {/* Min/Max Temp Bar */}
          {forecastToday && (
            <div className="mt-4 bg-white/40 dark:bg-black/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-orange-500 transition-all duration-300" 
                style={{ 
                  width: `${Math.round(((weather.current.temp_c - forecastToday.mintemp_c) / (forecastToday.maxtemp_c - forecastToday.mintemp_c)) * 100)}%` 
                }} 
              />
            </div>
          )}
          
          {/* Min/Max Indicators */}
          {forecastToday && (
            <div className="flex justify-between mt-1 text-xs text-foreground/70">
              <div>{Math.round(forecastToday.mintemp_c)}°</div>
              <div>{Math.round(forecastToday.maxtemp_c)}°</div>
            </div>
          )}
        </div>
        
        {/* Weather Details Grid */}
        <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex items-center">
            <WindIcon className="h-5 w-5 text-blue-500/80 mr-3" />
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Wind</div>
              <div className="font-medium">{weather.current.wind_kph} km/h</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <DropletIcon className="h-5 w-5 text-blue-500/80 mr-3" />
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Humidity</div>
              <div className="font-medium">{weather.current.humidity}%</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <ThermometerIcon className="h-5 w-5 text-red-500/80 mr-3" />
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Feels Like</div>
              <div className="font-medium">{weather.current.feelslike_c}°C</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <CloudRainIcon className="h-5 w-5 text-primary/80 mr-3" />
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Precipitation</div>
              <div className="font-medium">{weather.current.precip_mm} mm</div>
            </div>
          </div>
        </div>
        
        {/* Forecast Summary */}
        {forecastToday && (
          <div className="px-5 pb-5 pt-1">
            <div className="flex items-center space-x-1 mb-2">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Today's Forecast</span>
            </div>
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div className="flex items-center">
                {getWeatherIcon(forecastToday.condition.text, 1, 'sm')}
                <span className="ml-2 text-sm">{forecastToday.condition.text}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-blue-500 font-medium">{Math.round(forecastToday.mintemp_c)}°</span>
                <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"></div>
                <span className="text-orange-500 font-medium">{Math.round(forecastToday.maxtemp_c)}°</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Traffic Map Component
function TrafficMapWidget() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [googleMaps, setGoogleMaps] = useState<any>(null);
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  
  // Map container style
  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.5rem'
  };
  
  // Map options
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
  };
  
  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          setLoading(false);
        },
        (err) => {
          console.error("Error getting location:", err);
          setError("Location access denied. Using default location.");
          // Use default location (New York)
          setLocation({ lat: 40.7128, lng: -74.0060 });
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser. Using default location.");
      // Use default location (New York)
      setLocation({ lat: 40.7128, lng: -74.0060 });
      setLoading(false);
    }
  }, []);
  
  // Handle map load completion
  const onMapLoad = useCallback((map: any) => {
    setMapLoaded(true);
    setGoogleMaps(window.google);
  }, []);

  // Toggle traffic layer
  const toggleTraffic = useCallback(() => {
    setShowTraffic(prev => !prev);
  }, []);
  
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-6 flex items-center justify-center" style={{ height: '400px' }}>
            <div className="flex flex-col items-center animate-pulse">
              <MapIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error && !location) {
    return (
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-8">
            <div className="text-center py-4">
              <MapIcon className="h-12 w-12 text-red-500/70 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">Traffic Map Unavailable</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="relative">
      <Card className="w-full overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-0">
          <MapComponent />
        </CardContent>
      </Card>
      
      {/* Traffic Toggle Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant={showTraffic ? "default" : "outline"} 
          size="sm" 
          className="flex items-center space-x-1 rounded-full px-3 shadow-md"
          onClick={toggleTraffic}
        >
          <CarIcon className="h-4 w-4 mr-1" />
          <span>{showTraffic ? "Hide Traffic" : "Show Traffic"}</span>
        </Button>
      </div>
    </div>
  );
}

// Map Component
const MapComponent = () => {
  const [mapError, setMapError] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Default center coordinates (Faridabad)
  const center = {
    lat: 28.4089,
    lng: 77.3178
  };

  if (!apiKey) {
    return (
      <Alert className="mb-4">
        <MapIcon className="h-4 w-4" />
        <AlertTitle>Map Unavailable - API not working</AlertTitle>
        <AlertDescription>
          Google Maps functionality is currently unavailable. Will use API later
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      onError={(error) => {
        console.error('Google Maps loading error:', error);
        setMapError(true);
      }}
      onLoad={() => setMapError(false)}
    >
      {mapError ? (
        <Alert className="mb-4" variant="destructive">
          <MapIcon className="h-4 w-4" />
          <AlertTitle>Map Error</AlertTitle>
          <AlertDescription>
            Unable to load Google Maps. Please try again later.
          </AlertDescription>
        </Alert>
      ) : (
        <GoogleMap
          mapContainerStyle={{
            width: '100%',
            height: '400px',
            borderRadius: '0.5rem'
          }}
          center={center}
          zoom={13}
        >
          <TrafficLayer />
          <Marker position={center} />
        </GoogleMap>
      )}
    </LoadScript>
  );
};

const slideData  = [
  {
    title: "OpenAI launches its latest flagship model GPT-5.",
    src: "https://www.zdnet.com/a/img/resize/f730ae9ef6bb8121467b965f4d19f99c30395df4/2025/08/07/cbf00d7a-4ca2-4899-a620-5d996308ee68/gpt-5-flagship-hero.png?auto=webp&fit=crop&height=1200&width=1200",
    button: "Technology"
  },
  {
    title: "OpenAI releases two open-weight AI reasoning models optimized for personal computers.",
    src: "https://fireworks.ai/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fpv37i0yn%2Fproduction%2F358dab50acd43631870b847b4347df7191d02eac-2160x1244.png%3Fauto%3Dformat&w=3840&q=75",
    button: "Environment",
  },
  {
    title: "Space Exploration Company Announces Lunar Base Plans",
    src: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?q=80&w=1000&auto=format&fit=crop",
    button: "Space",
  },
  {
    title: "Major Breakthrough in Quantum Computing Announced.",
    src: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop",
    button: "Technology",
  }
];


export default function Home() {
  const router = useRouter();
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true }) as any
  );
  const { theme } = useTheme();

  const navigateToNews = () => {
    router.push('/news');
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <main className="min-h-screen bg-background">

      {/* Hero Section - Update background to match navbar */}
  <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-orange-800 dark:bg-neutral-950">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <DotGrid
            dotSize={10}
            gap={15}
            baseColor="#0D0C0D"
            activeColor= "#11A8E8"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-background dark:to-background dark:bg-opacity-100"></div>
        <motion.div 
          className="max-w-7xl mx-auto relative z-10"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="text-center">
            <Badge className="mb-6 px-4 py-2 text-sm font-medium bg-primary/10 text-white dark:bg-primary/20">
              Powered by AI
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 cursor-default">
              Stay Informed with <span className="text-cyan-400 cursor-default">AI-Powered</span> News
            </h1>
            <p className="text-xl text-white mb-8 max-w-2xl mx-auto cursor-default">
              Get personalized news summaries, real-time updates, and local information
              all in one place.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 bg-primary hover:bg-primary/90 text-white flex items-center group mx-auto rounded-full"
              onClick={navigateToNews}
            >
              Get Started
              <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1.5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Top News Carousel Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="text-center md:text-left">
              <Badge className="mb-4 px-3 py-1 text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 cursor-default">
                Top Stories
              </Badge>
              <h2 className="text-3xl font-semibold text-sky-500 underline cursor-default">Today's Headlines</h2>
            </div>
            <Button
              variant="destructive"
              className="mt-4 md:mt-0 rounded-full"
              onClick={navigateToNews}
            >
              View All News
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative overflow-hidden w-full h-full py-20">
      <Carousel slides={slideData} />
    </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50 dark:bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="text-center">
              <Badge className="mb-4 px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 hover:bg-green-200 dark:hover:bg-blue-800 cursor-default">
                Local Weather
              </Badge>
              <h2 className="text-2xl font-semibold mb-4">Current Conditions</h2>
            </div>
            
            <div className="max-w-md mx-auto lg:max-w-full">
              <WeatherWidget />
            </div>
          </div>
          
          <div className="mb-12">
            <div className="text-center">
              <Badge className="mb-4 px-3 py-1 text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 cursor-default">
                Live Traffic
              </Badge>
              <h2 className="text-2xl font-semibold mb-4">Traffic Around You</h2>
            </div>
            
            <div className="lg:max-w-full">
              <TrafficMapWidget />
            </div>
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="text-center mb-8">
              <Badge className="mb-4 px-3 py-1 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-green-200 dark:hover:bg-green-800 cursor-default">
                Features
              </Badge>
              <h2 className="text-2xl font-semibold">Enhance Your News Experience</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div variants={fadeIn}>
                <Card className="h-full border-border hover:border-primary/50 hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="text-center">
                      <div className="bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <NewspaperIcon className="h-8 w-8 text-primary" />
                      </div>
                  <h3 className="text-xl font-semibold mb-2">AI News Summarization</h3>
                  <p className="text-muted-foreground">
                        Get concise, AI-generated summaries of the latest news articles from trusted sources
                  </p>
                </div>
              </CardContent>
            </Card>
              </motion.div>

              <motion.div variants={fadeIn}>
                <Card className="h-full border-border hover:border-primary/50 hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="text-center">
                      <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <GlobeIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Global Coverage</h3>
                  <p className="text-muted-foreground">
                        Comprehensive news from around the world, with customizable categories and topics
                  </p>
                </div>
              </CardContent>
            </Card>
              </motion.div>

              <motion.div variants={fadeIn}>
                <Card className="h-full border-border hover:border-primary/50 hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="text-center">
                      <div className="bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <TrendingUpIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Trending Topics</h3>
                  <p className="text-muted-foreground">
                        Stay on top of the most discussed topics and trending news stories in real-time
                  </p>
                </div>
              </CardContent>
            </Card>
              </motion.div>
            </div>
          </motion.div>
          </div>
      </section>

      {/* CTA Section - Update background */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary/5 dark:bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join us to stay updated.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 bg-primary hover:bg-primary/90 text-yellow-100 flex items-center mx-auto group rounded-full"
            onClick={navigateToNews}
          >
            Browse News
            <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-3 py-1 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-green-200 dark:hover:bg-green-800 cursor-default">
              About Us
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Newzy World leverages artificial intelligence to deliver personalized,
              concise news summaries while keeping you informed about what matters most.
              Our mission is to make news consumption more efficient and meaningful.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12 px-4 sm:px-6 lg:px-8 dark:bg-background dark:border-t dark:border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <NewspaperIcon className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold ml-2">AI NEWS HUB</h3>
              </div>
              <p className="text-muted-foreground">
                AI-powered news platform delivering personalized summaries and global updates.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/news" className="text-muted-foreground hover:text-primary transition-colors">
                    News
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Me</h3>
              <ul className="space-y-2">
                <li>
                  <a href="https://www.linkedin.com/in/himanshuverma192005/" className="text-muted-foreground hover:text-primary transition-colors">
                    Linkedin
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/himanshu._.verma2005/" className="text-muted-foreground hover:text-primary transition-colors">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-muted-foreground">
                Have questions? Reach out to me at himslash2005@gmail.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Newzy World. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}