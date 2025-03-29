'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Wind, Map, MapPin } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
}

interface AirQualityData {
  aqi: number;
  category: string;
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
  };
  location: string;
  timestamp: string;
}

interface HotspotCity {
  name: string;
  country: string;
}

interface GuardianArticle {
  id: string;
  webTitle: string;
  fields?: {
    trailText?: string;
  };
  webUrl: string;
  webPublicationDate: string;
}

interface GuardianResponse {
  response?: {
    results: GuardianArticle[];
  };
}

const NewsDashboard = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [isLoadingAQ, setIsLoadingAQ] = useState<boolean>(true);
  const [aqError, setAQError] = useState<string | null>(null);
  
  const [location, setLocation] = useState<string>('London');
  const [debouncedLocation, setDebouncedLocation] = useState<string>(location);
  const [newsCategory, setNewsCategory] = useState<string>('environment');
  const prevAqi = useRef<number | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [showMap, setShowMap] = useState<boolean>(true);
  
  // Refs for intervals to ensure proper cleanup
  const aqIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const newsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hotspot cities
  const hotspotCities: HotspotCity[] = [
    { name: 'Delhi', country: 'India' },
    { name: 'London', country: 'UK' },
    { name: 'Beijing', country: 'China' },
    { name: 'New York', country: 'USA' },
    { name: 'Los Angeles', country: 'USA' },
    { name: 'Mexico City', country: 'Mexico' },
    { name: 'Cairo', country: 'Egypt' },
    { name: 'Lahore', country: 'Pakistan' },
    { name: 'Jakarta', country: 'Indonesia' },
    { name: 'Paris', country: 'France' },
  ];

  // Guardian API section mapping - Moved outside component or memoized
  const guardianSectionMap: { [key: string]: string } = {
    general: '',
    environment: 'environment',
    health: 'society',
    technology: 'technology'
  };

  // Get user's location on initial load - runs only once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Reverse geocoding to get location name
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const userLocationName = data.city || data.locality || 'Unknown';
            setUserLocation(userLocationName);
            setLocation(userLocationName);
          } catch (error) {
            console.error("Error getting location name:", error);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  }, []);

  // Debounce location input with increased delay to reduce API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(location);
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [location]);

  // Calculate US AQI from PM2.5 value - memoized to prevent recreating on every render
  const calculateUSAQI = useCallback((pm25: number): number => {
    const breakpoints = [
      [0.0, 12.0, 0, 50],
      [12.1, 35.4, 51, 100],
      [35.5, 55.4, 101, 150],
      [55.5, 150.4, 151, 200],
      [150.5, 250.4, 201, 300],
      [250.5, 500.4, 301, 500],
    ];

    for (const [clow, chigh, ilow, ihigh] of breakpoints) {
      if (pm25 >= clow && pm25 <= chigh) {
        return Math.round(((ihigh - ilow) / (chigh - clow)) * (pm25 - clow) + ilow);
      }
    }
    return 500;
  }, []);

  // Generate mock map data - memoized
  const generateMockMapData = useCallback((cityName: string, baseAqi: number) => {
    // Generate 5 points around the city with slight AQI variations
    const points = [];
    for (let i = 0; i < 5; i++) {
      const variation = Math.floor(Math.random() * 20) - 10; // -10 to +10
      points.push({
        id: `point-${i}`,
        location: `${cityName} Area ${i+1}`,
        aqi: Math.max(0, Math.min(500, baseAqi + variation)),
        lat: 0, // Would be actual coordinates in real implementation
        lng: 0
      });
    }
    return points;
  }, []);

  // AQI helper functions - memoized
  const getAQICategory = useCallback((aqi: number): string => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }, []);

  // Fetch air quality data function - extracted to be reusable
  const fetchAirQuality = useCallback(async () => {
    if (!debouncedLocation) return;
    
    setIsLoadingAQ(true);
    try {
      // Use a fallback key if environment variable is not available
      const apiKey = process.env.NEXT_PUBLIC_WAQI_API_KEY || 'demo';
      
      const response = await fetch(
        `https://api.waqi.info/feed/${encodeURIComponent(debouncedLocation)}/?token=${apiKey}`
      );
      const data = await response.json();
      
      if (data.status !== 'ok') throw new Error('Invalid location or API error');
      
      const pm25 = data.data.iaqi.pm25?.v || 0;
      const aqi = calculateUSAQI(pm25);
      const category = getAQICategory(aqi);

      const newAQData: AirQualityData = {
        aqi,
        category,
        pollutants: {
          pm25: pm25,
          pm10: data.data.iaqi.pm10?.v || 0,
          o3: data.data.iaqi.o3?.v || 0,
          no2: data.data.iaqi.no2?.v || 0,
        },
        location: debouncedLocation,
        timestamp: new Date().toISOString()
      };

      setAirQuality(prev => {
        prevAqi.current = prev?.aqi || null;
        return newAQData;
      });
      setAQError(null);
    } catch (error) {
      console.error("Air quality fetch error:", error);
      setAQError('Failed to fetch air quality data. Please try a different location.');
    } finally {
      setIsLoadingAQ(false);
    }
  }, [debouncedLocation, calculateUSAQI, getAQICategory]);

  // Fetch news function - extracted to be reusable
  const fetchNews = useCallback(async () => {
    if (!debouncedLocation) return;
    
    setIsLoadingNews(true);
    try {
      // Use a fallback key if environment variable is not available
      const apiKey = process.env.NEXT_PUBLIC_GUARDIAN_API_KEY || '';
      if (!apiKey) {
        throw new Error('Guardian API key is missing');
      }
      
      const section = guardianSectionMap[newsCategory];
      const apiUrl = `https://content.guardianapis.com/search?${
        section ? `section=${section}&` : ''
      }q=${encodeURIComponent(debouncedLocation)}&order-by=newest&show-fields=trailText&page-size=5&api-key=${apiKey}`;

      const response = await fetch(apiUrl);
      const data = await response.json() as GuardianResponse;
      
      if (!data.response?.results) throw new Error('Invalid API response');

      const guardianNews = data.response.results.map((article: GuardianArticle) => ({
        id: article.id,
        title: article.webTitle,
        description: article.fields?.trailText || 'No description available',
        source: 'The Guardian',
        url: article.webUrl,
        publishedAt: article.webPublicationDate,
        category: newsCategory,
      }));

      // Add air quality update as first item
      const airQualityNews: NewsItem = {
        id: `aq-${Date.now()}`,
        title: `${debouncedLocation} Air Quality - ${new Date().toLocaleTimeString()}`,
        description: airQuality 
          ? `Current AQI: ${airQuality.aqi} (${airQuality.category})`
          : 'Monitoring air quality...',
        source: 'Air Quality Monitor',
        url: '#',
        publishedAt: new Date().toISOString(),
        category: 'environment'
      };

      setNews([airQualityNews, ...guardianNews]);
      setNewsError(null);
    } catch (error) {
      console.error("News fetch error:", error);
      setNewsError('Failed to load news. Please check your API key and try again.');
    } finally {
      setIsLoadingNews(false);
    }
  }, [debouncedLocation, newsCategory, airQuality]);

  // Use effect for air quality - properly handles cleanup
  useEffect(() => {
    // Clear any existing interval when location changes
    if (aqIntervalRef.current) {
      clearInterval(aqIntervalRef.current);
      aqIntervalRef.current = null;
    }

    // Fetch immediately
    fetchAirQuality();
    
    // Then set up polling
    aqIntervalRef.current = setInterval(fetchAirQuality, 300000); // Every 5 minutes
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (aqIntervalRef.current) {
        clearInterval(aqIntervalRef.current);
        aqIntervalRef.current = null;
      }
    };
  }, [fetchAirQuality]);

  // Use effect for news - properly handles cleanup
  useEffect(() => {
    // Clear any existing interval when location or category changes
    if (newsIntervalRef.current) {
      clearInterval(newsIntervalRef.current);
      newsIntervalRef.current = null;
    }

    // Fetch immediately
    fetchNews();
    
    // Then set up polling
    newsIntervalRef.current = setInterval(fetchNews, 1800000); // 30 minutes
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (newsIntervalRef.current) {
        clearInterval(newsIntervalRef.current);
        newsIntervalRef.current = null;
      }
    };
  }, [fetchNews]);

  const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return 'bg-green-100 text-green-800';
    if (aqi <= 100) return 'bg-yellow-100 text-yellow-800';
    if (aqi <= 150) return 'bg-orange-100 text-orange-800';
    if (aqi <= 200) return 'bg-red-100 text-red-800';
    if (aqi <= 300) return 'bg-purple-100 text-purple-800';
    return 'bg-rose-100 text-rose-800';
  };
  
  const getMapPinColor = (aqi: number): string => {
    if (aqi <= 50) return 'text-green-500';
    if (aqi <= 100) return 'text-yellow-500';
    if (aqi <= 150) return 'text-orange-500';
    if (aqi <= 200) return 'text-red-500';
    if (aqi <= 300) return 'text-purple-500';
    return 'text-rose-500';
  };

  const getHealthRecommendation = (aqi: number): string => {
    if (aqi <= 50) return 'Good air quality - safe for outdoor activities';
    if (aqi <= 100) return 'Moderate air quality - acceptable for most people, but sensitive individuals should consider reducing prolonged outdoor exertion';
    if (aqi <= 150) return 'Unhealthy for sensitive groups - People with respiratory or heart disease, the elderly and children should limit prolonged outdoor exertion';
    if (aqi <= 200) return 'Unhealthy - Everyone may begin to experience health effects; sensitive groups should avoid outdoor exertion';
    if (aqi <= 300) return 'Very Unhealthy - Health alert: everyone may experience more serious health effects. Avoid outdoor activities';
    return 'Hazardous - Health warnings of emergency conditions. Everyone should avoid all outdoor activities';
  };

  const formatTime = (isoString: string): string => {
    return new Date(isoString).toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const handleHotspotSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      setLocation(e.target.value);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">Environmental Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
              className="p-2 border rounded bg-white w-48"
            />
            {userLocation && (
              <button 
                onClick={() => setLocation(userLocation)}
                className="text-sm text-blue-600 hover:underline"
              >
                Use my location
              </button>
            )}
          </div>
          
          {/* Hotspot Cities Dropdown */}
          <select 
            onChange={handleHotspotSelect}
            className="p-2 border rounded bg-white"
            value=""
          >
            <option value="" disabled>Pollution Hotspots</option>
            {hotspotCities.map(city => (
              <option key={`${city.name}-${city.country}`} value={city.name}>
                {city.name}, {city.country}
              </option>
            ))}
          </select>
          
          <select 
            value={newsCategory} 
            onChange={(e) => setNewsCategory(e.target.value)}
            className="p-2 border rounded bg-white"
          >
            {['general', 'environment', 'health', 'technology'].map(opt => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Air Quality Card */}
      <div className="border rounded-lg overflow-hidden shadow-lg bg-white">
        <div className="bg-blue-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wind className="h-5 w-5 text-blue-600" /> 
            Live Air Quality - {debouncedLocation}
            {airQuality && (
              <span className="ml-2 text-sm text-blue-600">
                Updated {formatTime(airQuality.timestamp)}
              </span>
            )}
          </h2>
        </div>
        <div className="p-6">
          {isLoadingAQ ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : aqError ? (
            <div className="flex items-center justify-center p-6 text-red-500">
              <AlertCircle className="mr-2 h-5 w-5" /> {aqError}
            </div>
          ) : airQuality ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center">
                  <div className={`text-4xl font-bold px-4 py-2 rounded-lg ${getAQIColor(airQuality.aqi)}`}>
                    {airQuality.aqi}
                    {prevAqi.current !== null && (
                      <span className="ml-2 text-lg">
                        {airQuality.aqi > prevAqi.current ? '↑' : 
                         airQuality.aqi < prevAqi.current ? '↓' : '→'}
                      </span>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-xl font-medium">{airQuality.category}</div>
                    <div className="text-sm text-gray-500">
                      {airQuality.location}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {Object.entries(airQuality.pollutants).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        key === 'pm25' ? 'bg-blue-500' :
                        key === 'pm10' ? 'bg-green-500' :
                        key === 'o3' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm">
                        {key.toUpperCase()}: {value} µg/m³
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium mb-2">Health Guidance</h3>
                <p>{getHealthRecommendation(airQuality.aqi)}</p>
              </div>
              
              {/* Map visualization */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">AQI Map for {airQuality.location}</h3>
                  <button 
                    onClick={() => setShowMap(!showMap)} 
                    className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                  >
                    <Map className="h-4 w-4" /> 
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </button>
                </div>
                
                {showMap && (
                  <div className="relative">
                    <div
                      className="w-full h-64 object-cover rounded bg-gray-100" 
                    />
                    
                    {/* Map markers - positioned absolutely over the map */}
                    <div className="absolute inset-0">
                      {/* Main city marker */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <MapPin className={`h-8 w-8 ${getMapPinColor(airQuality.aqi)}`} />
                        <div className={`px-2 py-1 rounded ${getAQIColor(airQuality.aqi)} text-xs font-bold mt-1`}>
                          {airQuality.aqi}
                        </div>
                        <div className="text-xs font-medium mt-1 bg-white px-2 py-1 rounded shadow">
                          {airQuality.location}
                        </div>
                      </div>
                      
                      {/* Generate surrounding area markers */}
                      {generateMockMapData(airQuality.location, airQuality.aqi).map((point, index) => {
                        // Calculate positions in a circle around the main marker
                        const angle = (index / 5) * 2 * Math.PI;
                        const radius = 100; // pixels from center
                        const top = `calc(50% + ${Math.sin(angle) * radius}px)`;
                        const left = `calc(50% + ${Math.cos(angle) * radius}px)`;
                        
                        return (
                          <div 
                            key={point.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                            style={{ top, left }}
                          >
                            <MapPin className={`h-6 w-6 ${getMapPinColor(point.aqi)}`} />
                            <div className={`px-1.5 py-0.5 rounded ${getAQIColor(point.aqi)} text-xs font-bold`}>
                              {point.aqi}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Map overlay */}
                    <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow text-xs">
                      <div className="font-bold mb-1">AQI Legend</div>
                      <div className="flex gap-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                          <span>0-50</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                          <span>51-100</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
                          <span>101-150</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                          <span>151+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-gray-500">No air quality data</div>
          )}
        </div>
      </div>

      {/* News Feed */}
      <div className="border rounded-lg overflow-hidden shadow-lg bg-white">
        <div className="bg-blue-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" /> 
            Latest News for {debouncedLocation}
          </h2>
        </div>
        <div className="p-6">
          {isLoadingNews ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : newsError ? (
            <div className="flex items-center justify-center p-6 text-red-500">
              <AlertCircle className="mr-2 h-5 w-5" /> {newsError}
            </div>
          ) : news.length > 0 ? (
            <div className="space-y-4">
              {news.map((item) => (
                <a 
                  key={item.id} 
                  href={item.url === '#' ? undefined : item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`block border rounded-lg p-4 ${item.url === '#' ? '' : 'hover:bg-blue-50'} transition-colors`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{item.title}</h3>
                        {item.id.startsWith('aq') && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{item.source}</span>
                        <div className="text-xs text-gray-400">
                          {formatTime(item.publishedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 text-gray-500">No news available</div>
          )}
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-500 mt-4">
        Data sources: WAQI for air quality, The Guardian for news. Refresh rate: AQI - 5 minutes, News - 30 minutes.
      </div>
    </div>
  );
};

export default NewsDashboard;