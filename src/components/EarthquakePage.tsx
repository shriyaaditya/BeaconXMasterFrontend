"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Shield,
  Siren,
  Zap,
  Waves,
  CloudLightning,
  Compass,
  Ruler,
  Activity,
  MapPin,
} from "lucide-react";
import GoogleMapBox from "@/components/GoogleMapBox";

interface EarthquakeData {
  magnitude: number;
  location: string;
  time: string;
  updated: string;
  coordinates: [number, number, number]; // [longitude, latitude, depth]
  tsunami: number;
  sig: number;
  nst: number | null;
  gap: number | null;
  status: string;
  magType: string;
  rms: number | null;
}

interface EarthquakeFeature {
  properties: EarthquakeData
  geometry?:{
    type: string;
    coordinates: [number, number, number?];
  };
}

interface TremorZones {
  low: number;
  moderate: number;
  high: number;
}

export default function EarthquakePage() {
  const [earthquake, setEarthquake] = useState<EarthquakeData | null>(null);
  const [tremorZones, setTremorZones] = useState<TremorZones>({
    low: 0,
    moderate: 0,
    high: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch a single earthquake (as in your original code)
  async function getEarthquakesNearLocation(
    lat: number,
    lon: number,
    radius = 100
  ) {
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradius=${radius}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features.length > 0) {
        const event = data.features[0]; // Taking the first earthquake event
        setEarthquake({
          magnitude: event.properties.mag,
          location: event.properties.place,
          time: new Date(event.properties.time).toLocaleString(),
          updated: new Date(event.properties.updated).toLocaleString(),
          coordinates: event.geometry.coordinates,
          tsunami: event.properties.tsunami,
          sig: event.properties.sig,
          nst: event.properties.nst || null,
          gap: event.properties.gap || null,
          status: event.properties.status,
          magType: event.properties.magType,
          rms: event.properties.rms || null,
        });
      }
    } catch (error) {
      console.error("Error fetching earthquake data:", error);
    }
  }

  // New function to fetch multiple earthquakes and calculate tremor zones
  async function getTremorZones(lat: number, lon: number, radius = 100) {
    setLoading(true);
    // Using a larger timeframe to get more data
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradius=${radius}&starttime=${getStartDate()}&minmagnitude=1`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        // Count earthquakes by magnitude category
        const zones = data.features.reduce(
          (acc: TremorZones, quake: EarthquakeFeature) => {
            const magnitude = quake.properties.magnitude;
            if (magnitude < 4.0) {
              acc.low += 1;
            } else if (magnitude >= 4.0 && magnitude < 6.0) {
              acc.moderate += 1;
            } else if (magnitude >= 6.0) {
              acc.high += 1;
            }
            return acc;
          },
          { low: 0, moderate: 0, high: 0 }
        );

        setTremorZones(zones);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tremor zone data:", error);
      setLoading(false);
    }
  }

  // Helper function to get the date for 30 days ago
  function getStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    // San Francisco coordinates
    const lat = 37.7749;
    const lon = -122.4194;
    const radius = 500; // Using a larger radius to capture more events
    
    // Fetch both single earthquake data and tremor zones
    getEarthquakesNearLocation(lat, lon, 50);
    getTremorZones(lat, lon, radius);
  }, []);

  const getMagnitudeTypeDescription = (magType: string) => {
    const types = {
      "md": "Duration Magnitude",
      "ml": "Local Magnitude (Richter)",
      "mb": "Body-wave Magnitude",
      "mw": "Moment Magnitude",
      "ms": "Surface-wave Magnitude",
    };
    return types[magType as keyof typeof types] || magType;
  };

  return (
    <main className="min-h-screen bg-gray-900 text-gray-200 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-400">Earthquake Monitoring Dashboard</h1>
        <div className="text-sm text-gray-400">
          {loading ? "Loading tremor data..." : "Showing tremors from the last 30 days"}
        </div>
      </div>

<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-3 gap-4 mb-4">
  
  {/* Left Column - Earthquake Data */}
  <div className="bg-gray-800 p-6 rounded-lg row-span-3 col-span-2 flex flex-col items-center justify-center h-full">
    {/* <MapPin className="w-10 h-10 text-gray-600 mb-4" /> */}
    <GoogleMapBox />
    <p className="text-gray-500">Map loading...</p>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Magnitude */}
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between mb-2">
        <h3 className="text-gray-400">Magnitude</h3>
        <Activity className="w-5 h-5 text-purple-400" />
      </div>
      <p className="text-4xl font-bold text-purple-300">
        {earthquake ? earthquake.magnitude.toFixed(2) : "—"}
      </p>
      <p className="text-sm text-gray-500 mt-1">Richter Scale</p>
    </div>

    {/* Location */}
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between mb-2">
        <h3 className="text-gray-400">Location</h3>
        <MapPin className="w-5 h-5 text-blue-400" />
      </div>
      <p className="text-xl font-medium text-blue-300">
        {earthquake ? earthquake.location : "—"}
      </p>
    </div>

    {/* Depth & Radius */}
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between mb-2">
        <h3 className="text-gray-400">Depth & Radius</h3>
        <Ruler className="w-5 h-5 text-green-400" />
      </div>
      <div className="mt-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Depth:</span>
          <span className="text-green-300">
            {earthquake ? `${earthquake.coordinates[2].toFixed(6)} km` : "—"}
          </span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-gray-400">Radius:</span>
          <span className="text-green-300">50 km</span>
        </div>
      </div>
    </div>

    {/* Seismic Data */}
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between mb-2">
        <h3 className="text-gray-400">Seismic</h3>
        <Waves className="w-5 h-5 text-blue-400" />
      </div>
      <p className="text-3xl font-bold text-blue-300">
        {earthquake ? earthquake.sig : "—"}
      </p>
      <p className="text-yellow-500">
        {earthquake
          ? earthquake.sig > 50
            ? "High"
            : "Moderate"
          : "—"}
      </p>
    </div>
  </div>

  {/* Map Section - Takes 1/2 Page Width */}
  

  {/* Tsunami */}
  <div className="bg-gray-800 p-6 rounded-lg">
    <div className="flex justify-between mb-2">
      <h3 className="text-gray-400">Tsunami</h3>
      <CloudLightning className="w-5 h-5 text-teal-400" />
    </div>
    <p className="text-3xl font-bold text-red-400">
      {earthquake ? (earthquake.tsunami ? "High" : "Low") : "—"}
    </p>
  </div>

  {/* Fault Angle */}
  <div className="bg-gray-800 p-6 rounded-lg">
    <div className="flex justify-between mb-2">
      <h3 className="text-gray-400">Fault Angle</h3>
      <Compass className="w-5 h-5 text-green-400" />
    </div>
    <p className="text-3xl font-bold text-green-300">
      {earthquake && earthquake.gap !== null ? `${earthquake.gap}°` : "—"}
    </p>
  </div>

  {/* Mag Type */}
  <div className="bg-gray-800 p-6 rounded-lg">
    <div className="flex justify-between mb-2">
      <h3 className="text-gray-400">Mag Type</h3>
      <Zap className="w-5 h-5 text-purple-400" />
    </div>
    <p className="text-purple-300">
      {earthquake ? getMagnitudeTypeDescription(earthquake.magType) : "—"}
    </p>
  </div>

  {/* Time */}
  <div className="bg-gray-800 p-6 rounded-lg">
    <div className="flex justify-between mb-2">
      <h3 className="text-gray-400">Time</h3>
      <Clock className="w-5 h-5 text-blue-400" />
    </div>
    <div className="mt-2">
      <div className="mb-2">
        <span className="text-gray-400 text-sm">Occurred:</span>
        <p className="text-blue-300">
          {earthquake ? earthquake.time : "—"}
        </p>
      </div>
      <div>
        <span className="text-gray-400 text-sm">Last Updated:</span>
        <p className="text-blue-300">
          {earthquake ? earthquake.updated : "—"}
        </p>
      </div>
    </div>
  </div>

  {/* Seismic Stations */}
  <div className="bg-gray-800 p-6 rounded-lg">
    <div className="flex justify-between mb-2">
      <h3 className="text-gray-400">Seismic Stations</h3>
      <Zap className="w-5 h-5 text-purple-400" />
    </div>
    <div className="mt-2">
      <div className="flex justify-between">
        <span className="text-gray-400">Count:</span>
        <span className="text-purple-300 font-medium">
          {earthquake && earthquake.nst !== null ? earthquake.nst : "—"}
        </span>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-gray-400">RMS:</span>
        <span className="text-purple-300 font-medium">
          {earthquake && earthquake.rms !== null ? earthquake.rms : "—"}
        </span>
      </div>
    </div>
  </div>
</div>

      {/* Alert zones section - Now dynamic based on USGS data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Low intensity tremor zones */}
        <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="w-8 h-8 text-green-500" />
            </motion.div>
            <div>
              <h2 className="text-4xl font-bold text-green-500">
                {loading ? "..." : tremorZones.low}
              </h2>
              <div>
                <p className="text-green-500">Tremor Zones</p>
                <p className="text-gray-500 text-sm">Low intensity (&lt;4.0)</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Moderate intensity tremor zones */}
        <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </motion.div>
            <div>
              <h2 className="text-4xl font-bold text-yellow-500">
                {loading ? "..." : tremorZones.moderate}
              </h2>
              <div>
                <p className="text-yellow-500">Tremor Zones</p>
                <p className="text-gray-500 text-sm">Moderate intensity (4.0-5.9)</p>
              </div>
            </div>
          </div>
        </div>

        {/* High alert zones */}
        <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Siren className="w-8 h-8 text-red-500" />
            </motion.div>
            <div>
              <h2 className="text-4xl font-bold text-red-500">
                {loading ? "..." : tremorZones.high}
              </h2>
              <div>
                <p className="text-red-500">High Alert Zones</p>
                <p className="text-gray-500 text-sm">Severe intensity (≥6.0)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}