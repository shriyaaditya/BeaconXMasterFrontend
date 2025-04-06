"use client";
import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
import {
  Clock,
  Compass,
  Wind,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { getLatestCyclone , fetchCyclonePredictions , cycloneData} from "@/lib/cyclones";
import GoogleMapBox from "@/components/GoogleMapBox";


export default function CyclonePage() {
  const [cyclone, setCyclone] = useState<cycloneData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

    const fetchCycloneData = async () => {
        setLoading(true);
        try {
          const data = await getLatestCyclone();
          const predictions = await fetchCyclonePredictions(data);
          setCyclone({ ...data, ...predictions });
          setLastUpdated(new Date().toLocaleString());
        } catch (err) {
          console.error("Error fetching cyclone data:", err);
        } finally {
          setLoading(false);
        }
      };
      
      useEffect(() => {
        fetchCycloneData();
      }, []);
      

  return (
    <main className="min-h-screen bg-gray-900 text-gray-200 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-400">Cyclone Monitoring Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {loading ? "Loading data..." : `Last updated: ${lastUpdated}`}
          </div>

          <button 
            onClick={fetchCycloneData} // Call the function to fetch data
            className="p-1 rounded-full hover:bg-gray-800 transition"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        </div>

    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-3 gap-4 mb-4">

        <div className="bg-gray-800 p-6 rounded-lg row-span-3 col-span-2 flex flex-col items-center justify-center h-full">
          {/* <MapPin className="w-10 h-10 text-gray-600 mb-4" /> */}
          <GoogleMapBox
            // center={{ lat: item.lat, lng: item.lng }}
            zoom={10}
            mapTypeId="hybrid"
            />
        </div>

      {cyclone ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-120">
          {/* Time */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between mb-2">
              <h3 className="text-gray-400">ISO Time</h3>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-blue-300">{cyclone.isoTime}</p>
          </div>

          {/* Coordinates */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between mb-2">
              <h3 className="text-gray-400">Coordinates</h3>
              <MapPin className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-green-300">
              Lat: {cyclone.lat}, Lon: {cyclone.lon}
            </p>
          </div>

          {/* Storm Direction */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between mb-2">
              <h3 className="text-gray-400">Storm Direction</h3>
              <Compass className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-purple-300">{cyclone.stormDir}</p>
          </div>

          {/* Storm Speed */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between mb-2">
              <h3 className="text-gray-400">Storm Speed</h3>
              <Wind className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-cyan-300">{cyclone.stormSpeed} knots</p>
          </div>

          {/* Severity */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between mb-2">
              <h3 className="text-gray-400">Predicted Severity</h3>
              <Compass className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-red-300">{cyclone.severity}</p>
          </div>

          {/* Predicted Wind Speed */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between mb-2">
              <h3 className="text-gray-400">Predicted Wind Speed</h3>
              <Wind className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-pink-300">{cyclone.predictedSpeed} knots</p>
          </div>

        </div>
      ) : (
        <p className="text-center text-gray-400 mt-10">
          No cyclone data found.
        </p>
      )} 
  
    </div>
    </main>
  );
}