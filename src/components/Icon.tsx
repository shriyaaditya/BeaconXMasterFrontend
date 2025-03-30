"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Landmark, Wind } from "lucide-react";

export default function DisasterIcons({
  type,
  count,
}: {
  type: string;
  count: number;
}) {
  const [disasterType, setDisasterType] = useState<string | null>(null);
  const [disasterCount, setDisasterCount] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Simulating API response (can be replaced with real API)
    setTimeout(() => {
      setDisasterType(type);
      setDisasterCount(count);
    }, 1000);
  }, [type, count]);

  // Function to navigate programmatically
  
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip Message */}
      {isHovered && disasterType && (
        <div className="absolute bottom-16 right-0 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg shadow-lg">
          {disasterType === "earthquake" ? "Earthquake Alert!" : "Cyclone Warning!"}
        </div>
      )}

      {/* Link-Based Navigation */}
      <Link
        href={`/${disasterType}`} 
        className="relative flex h-14 w-14 items-center justify-center rounded-full 
                   bg-red-600 shadow-xl hover:bg-red-700 transition-all focus:ring-2 
                   focus:ring-red-900"
        aria-label={`${disasterType || "Loading"} alert - Click for details`}
      >
        {/* Ripple Effect */}
        <span className="absolute inset-0 animate-ripple rounded-full border-2 border-white opacity-70"></span>
        <span className="absolute inset-0 animate-ripple2 rounded-full border-2 border-white opacity-40"></span>

        {/* Icon */}
        {disasterType === "earthquake" ? (
          <Landmark className="h-6 w-6 text-white relative" />
        ) : disasterType === "cyclone" ? (
          <Wind className="h-6 w-6 text-white relative" />
        ) : (
          <span className="text-white text-sm">...</span> // Placeholder for loading
        )}

        {/* Notification Badge */}
        {disasterCount > 0 && disasterType && (
          <span className="absolute top-0 right-0 h-5 w-5 text-xs bg-white text-red-600 font-bold 
                         rounded-full flex items-center justify-center border-2 border-red-600 shadow-lg">
            {disasterCount}
          </span>
        )}
      </Link>

      {/* Button-Based Navigation (Alternative) */}
      
    </div>
  );
}
