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
  Navigation,
} from "lucide-react";

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

export default function EarthquakePage() {
  const [earthquake, setEarthquake] = useState<EarthquakeData | null>(null);

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
        const event = data.features[6]; // Taking the first earthquake event
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

  useEffect(() => {
    getEarthquakesNearLocation(37.7749, -122.4194, 50);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row p-4 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-2 mb-8">
          {/* Magnitude */}
          <div className="bg-white p-6 rounded-4xl h-40 w-50 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">Magnitude</h3>
            </div>
            <p className="text-3xl font-bold text-purple-700">
              {earthquake ? earthquake.magnitude : "Loading..."}
            </p>
            <p className="text-sm text-gray-500 mt-1">Richter Scale</p>
          </div>

          {/* Location */}
          <div className="bg-white p-6 rounded-4xl h-40 w-50 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Navigation className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Location</h3>
            </div>
            <p className="text-sm text-gray-600">
              {earthquake ? earthquake.location : "Fetching location..."}
            </p>
          </div>

          {/* Depth & Radius */}
          <div className="bg-white p-6 rounded-4xl h-40 w-50 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Ruler className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Depth & Radius
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Depth:{" "}
              <span className="font-semibold">
                {earthquake ? `${earthquake.coordinates[2]} km` : "Loading..."}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Radius: <span className="font-semibold">50 km</span>
            </p>
          </div>

          {/* Tsunami Potential */}
          <div className="bg-white p-6 rounded-4xl h-40 w-50 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <CloudLightning className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Tsunami Potential
              </h3>
            </div>
            <p className="text-2xl font-bold text-red-500">
              {earthquake
                ? earthquake.tsunami
                  ? "High"
                  : "Low"
                : "Loading..."}
            </p>
          </div>

          {/* Seismic Movement */}
          <div className="bg-white p-6 rounded-4xl h-40 w-50 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Waves className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Seismic Movement
              </h3>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {earthquake ? earthquake.sig : "Loading..."}
            </p>
            <p className="text-1xl font-bold text-orange-400">
              {earthquake
                ? earthquake.sig > 50
                  ? "High"
                  : "Moderate"
                : "Loading..."}
            </p>
          </div>

          {/* Fault Orientation (Gap) */}
          <div className="bg-white p-6 rounded-4xl h-40 w-50 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Compass className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Fault Orientation
              </h3>
            </div>
            <p className="text-2xl font-bold text-emerald-700">
              {earthquake && earthquake.gap !== null ? `${earthquake.gap}°` : "N/A"}
            </p>
          </div>

          {/* Seismic Stations */}
          <div className="bg-white p-6 rounded-4xl h-40 w-50 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Seismic Stations
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Count:{" "}
              <span className="font-semibold">
                {earthquake && earthquake.nst !== null ? earthquake.nst : "N/A"}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              RMS:{" "}
              <span className="font-semibold">
                {earthquake && earthquake.rms !== null ? earthquake.rms : "N/A"}
              </span>
            </p>
          </div>

          {/* Time */}
          <div className="bg-white p-6 rounded-4xl h-40 w-50 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-black" />
              <h3 className="text-lg font-semibold text-gray-800">Time</h3>
            </div>
            <p className="text-sm text-gray-600">
              <strong>Occurred:</strong>{" "}
              {earthquake ? earthquake.time : "Loading..."}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Last Updated:</strong>{" "}
              {earthquake ? earthquake.updated : "Loading..."}
            </p>
          </div>

          {/* Magnitude Type */}
          <div className="bg-white p-6 rounded-4xl h-40 w-50 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">Magnitude Type</h3>
            </div>
            <p className="text-3xl font-bold text-purple-700">
              {earthquake ? earthquake.magType : "Loading..."}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {earthquake ? (earthquake.magType === "ml" ? "Local Magnitude (Richter)" : "Duration Magnitude") : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-row p-4 gap-4">
        {/* Safety Status */}
        <div className="bg-green-50 p-6 h-27 w-100 rounded-lg shadow-sm border border-green-100">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="w-8 h-8 text-green-600" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-green-700">5</h2>
              <p className="text-green-600">Tremor Zones</p>
            </div>
          </div>
        </div>
        
        {/* Warning Status */}
        <div className="bg-yellow-50 p-6 h-27 w-100 rounded-lg shadow-sm border border-yellow-100">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-700">5</h2>
              <p className="text-yellow-600">Warning Zones</p>
            </div>
          </div>
        </div>

        {/* Alert Status */}
        <div className="bg-red-50 p-6 h-27 w-100 rounded-lg shadow-sm border border-red-100">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1], rotate: [0, 10, -10, 0], opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Siren className="w-8 h-8 text-red-600" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-red-700">3</h2>
              <p className="text-red-600">High Alert Zones</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}