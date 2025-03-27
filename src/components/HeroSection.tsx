"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlertCircle, ArrowRight, MapPin, Navigation, Loader } from "lucide-react"

export default function HeroSection() {
  // State for the alert sliders
  const [topAlertIndex, setTopAlertIndex] = useState(0)
  const [bottomAlertIndex, setBottomAlertIndex] = useState(0)

  // State for geolocation
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Alert messages
  const topAlerts = [
    "ALERT: Heavy rainfall expected in coastal areas. Stay prepared.",
    "UPDATE: Evacuation routes have been updated for northern districts.",
    "WARNING: High winds forecasted for tomorrow. Secure loose items.",
  ]

  const bottomAlerts = [
    "RESOURCES: Emergency supply kits available at community centers.",
    "SHELTER: Temporary shelters open at Lincoln High and Central Stadium.",
    "MEDICAL: Mobile clinics deployed to affected neighborhoods.",
  ]

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setIsLoadingLocation(false)
        },
        (error) => {
          setLocationError("Unable to retrieve your location")
          setIsLoadingLocation(false)
          console.error("Error getting location:", error)
        },
      )
    } else {
      setLocationError("Geolocation is not supported by your browser")
    }
  }, [])

  // Animation for alert sliders
  useEffect(() => {
    const topInterval = setInterval(() => {
      setTopAlertIndex((prevIndex) => (prevIndex + 1) % topAlerts.length)
    }, 5000)

    const bottomInterval = setInterval(() => {
      setBottomAlertIndex((prevIndex) => (prevIndex + 1) % bottomAlerts.length)
    }, 5000)

    return () => {
      clearInterval(topInterval)
      clearInterval(bottomInterval)
    }
  }, [])

  return (
    <div className="w-screen overflow-hidden relative">

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-900 to-green-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-block bg-teal-400 text-teal-900 px-4 py-1 rounded-full text-sm font-semibold mb-2">
                Your Beacon of Hope
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Guiding Light Through <span className="text-green-400">Difficult Times</span>
              </h1>

              <p className="text-lg md:text-xl text-teal-100 max-w-xl">
                BeaconX provides critical guidance, resources, and real-time updates during natural disasters to help
                you and your loved ones stay safe.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">

                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center bg-green-700 hover:bg-green-600 text-white font-medium px-6 py-3 rounded-lg border border-green-600 transition-all duration-200"
                >
                  <span>Find Resources</span>
                </Link>
              </div>

              <div className="flex items-center text-teal-300 pt-4">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-sm">Location-based guidance available</span>
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-teal-800 rounded-xl overflow-hidden shadow-2xl h-[300px] md:h-[400px]">
              <div className="p-4 bg-teal-700 flex items-center justify-between">
                <h3 className="font-semibold text-teal-100 flex items-center">
                  <Navigation className="h-4 w-4 mr-2" />
                  Your Current Location
                </h3>
                {isLoadingLocation && (
                  <div className="flex items-center text-teal-200 text-sm">
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Locating you...
                  </div>
                )}
              </div>

              <div className="relative h-full">
                {locationError ? (
                  <div className="absolute inset-0 flex items-center justify-center flex-col p-6 text-center">
                    <AlertCircle className="h-10 w-10 text-red-400 mb-2" />
                    <p className="text-teal-100">{locationError}</p>
                    <button
                      className="mt-4 px-4 py-2 bg-teal-600 rounded-md text-sm"
                      onClick={() => window.location.reload()}
                    >
                      Try Again
                    </button>
                  </div>
                ) : isLoadingLocation ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : location ? (
                  <>
                    {/* Simple map representation with coordinates */}
                    <div className="absolute inset-0 bg-teal-800 bg-opacity-50 flex items-center justify-center">
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Map grid lines */}
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`col-${i}`} className="border-r border-teal-600/30 h-full"></div>
                          ))}
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`row-${i}`} className="border-b border-teal-600/30 w-full"></div>
                          ))}
                        </div>

                        {/* User location marker */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="relative">
                            <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center z-10 animate-pulse">
                              <div className="h-3 w-3 bg-white rounded-full"></div>
                            </div>
                            <div className="absolute -inset-4 border-2 border-red-500/50 rounded-full animate-ping"></div>
                          </div>
                        </div>

                        {/* Nearby resources markers */}
                        <div className="absolute top-1/4 left-1/3 h-4 w-4 bg-green-400 rounded-full"></div>
                        <div className="absolute bottom-1/3 right-1/4 h-4 w-4 bg-green-400 rounded-full"></div>
                        <div className="absolute top-2/3 right-1/3 h-4 w-4 bg-green-400 rounded-full"></div>
                      </div>
                    </div>

                    {/* Coordinates display */}
                    <div className="absolute bottom-0 left-0 right-0 bg-teal-900/80 text-teal-100 p-2 text-xs flex justify-between">
                      <span>Lat: {location.lat.toFixed(6)}</span>
                      <span>Long: {location.lng.toFixed(6)}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Safety status indicator */}
          <div className="mt-8 bg-teal-800/50 rounded-lg p-4 max-w-3xl mx-auto">
            <h3 className="text-teal-100 font-medium mb-2">Your Area Safety Status</h3>
            <div className="h-2 bg-teal-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-3/4"></div>
            </div>
            <div className="flex justify-between text-xs text-teal-300 mt-1">
              <span>High Risk</span>
              <span>Moderate</span>
              <span>Safe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Alert Slider */}
      <div className="bg-red-700 text-white py-2 relative overflow-hidden">
        <div className="flex items-center justify-center animate-marquee whitespace-nowrap">
          <AlertCircle className="h-4 w-4 mr-2" />
          <p className="text-sm font-medium">{bottomAlerts[bottomAlertIndex]}</p>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        @keyframes pulseSubtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        
        .animate-pulse-subtle {
          animation: pulseSubtle 2s infinite;
        }
      `}</style>
    </div>
  )
}

