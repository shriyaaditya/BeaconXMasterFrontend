"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlertCircle, MapPin, Navigation, Loader } from "lucide-react"

export default function HeroSection() {
  const [topAlertIndex, setTopAlertIndex] = useState(0)
  const [bottomAlertIndex, setBottomAlertIndex] = useState(0)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

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

  const getLocation = () => {
    if (typeof navigator === "undefined") return

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
      }
    )
  }

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      getLocation()
    } else {
      setLocationError("Geolocation is not supported by your browser")
    }
  }, [])

  useEffect(() => {
    let topInterval: NodeJS.Timeout
    let bottomInterval: NodeJS.Timeout

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    
    if (!reducedMotion) {
      topInterval = setInterval(() => {
        setTopAlertIndex((prev) => (prev + 1) % topAlerts.length)
      }, 5000)

      bottomInterval = setInterval(() => {
        setBottomAlertIndex((prev) => (prev + 1) % bottomAlerts.length)
      }, 5000)
    }

    return () => {
      clearInterval(topInterval)
      clearInterval(bottomInterval)
    }
  }, [topAlerts.length, bottomAlerts.length])

  return (
    <div className="w-screen overflow-hidden relative">
      {/* Top Alert Banner */}
      <div 
        className="bg-amber-700 text-white py-2 relative overflow-hidden"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-center justify-center animate-marquee whitespace-nowrap">
          <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
          <p className="text-sm font-medium truncate">{topAlerts[topAlertIndex]}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-teal-100 to-teal-300">
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 animate-fade-in">
              <div className="inline-block bg-teal-400/90 text-teal-900 px-4 py-1 rounded-full text-sm font-semibold mb-2">
                Your Beacon of Hope
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Guiding Light Through{" "}
                <span className="text-teal-800">Difficult Times</span>
              </h1>

              <p className="text-lg md:text-x max-w-xl">
                BeaconX provides critical guidance, resources, and real-time updates
                during natural disasters to help you and your loved ones stay safe.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center bg-teal-800 hover:bg-teal-700 text-white font-medium px-6 py-3 rounded-lg border border-teal-700 transition-colors duration-200"
                >
                  Find Resources
                </Link>
              </div>

              <div className="flex items-center pt-4">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-sm">Location-based guidance available</span>
              </div>
            </div>

            {/* Map Section */}
            <div className="rounded-xl overflow-hidden shadow-2xl h-[300px] md:h-[400px]">
              <div className="p-4 bg-teal-700 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center">
                  <Navigation className="h-4 w-4 mr-2" />
                  Your Current Location
                </h3>
                {isLoadingLocation && (
                  <div className="flex items-center text-white text-sm">
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Locating...
                  </div>
                )}
              </div>

              <div className="relative h-full">
                {locationError ? (
                  <div className="absolute inset-0 flex items-center justify-center flex-col p-6 text-center">
                    <AlertCircle className="h-10 w-10 text-red-400 mb-2" />
                    <p className="text-teal-50">{locationError}</p>
                    <button
                      className="mt-4 px-4 py-2 bg-teal-800 rounded-md text-sm hover:bg-teal-600 transition-colors"
                      onClick={getLocation}
                    >
                      Try Again
                    </button>
                  </div>
                ) : isLoadingLocation ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : location ? (
                  <>
                    <div className="absolute inset-0 bg-teal-800/50 flex items-center justify-center">
                      <div className="relative w-full h-full overflow-hidden">
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={`col-${i}`}
                              className="border-r border-teal-600/30 h-full"
                            />
                          ))}
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={`row-${i}`}
                              className="border-b border-teal-600/30 w-full"
                            />
                          ))}
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="relative">
                            <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center z-10 animate-pulse">
                              <div className="h-3 w-3 bg-white rounded-full" />
                            </div>
                            <div className="absolute -inset-4 border-2 border-red-500/50 rounded-full animate-ping" />
                          </div>
                        </div>

                        <div className="absolute top-1/4 left-1/3 h-4 w-4 bg-green-400 rounded-full" />
                        <div className="absolute bottom-1/3 right-1/4 h-4 w-4 bg-green-400 rounded-full" />
                        <div className="absolute top-2/3 right-1/3 h-4 w-4 bg-green-400 rounded-full" />
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-teal-900/80 text-teal-100 p-2 text-xs flex justify-between">
                      <span>Lat: {location.lat.toFixed(6)}</span>
                      <span>Long: {location.lng.toFixed(6)}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Safety Status */}
          <div className="mt-8 rounded-lg p-4 max-w-3xl mx-auto">
            <h3 className="text-teal-800 font-medium mb-2">Your Area Safety Status</h3>
            <div className="h-2 bg-teal-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-3/4" />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>High Risk</span>
              <span>Moderate</span>
              <span>Safe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Alert Banner */}
      <div 
        className="bg-red-700 text-white py-2 relative overflow-hidden"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-center justify-center animate-marquee whitespace-nowrap">
          <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
          <p className="text-sm font-medium truncate">{bottomAlerts[bottomAlertIndex]}</p>
        </div>
      </div>
    </div>
  )
}