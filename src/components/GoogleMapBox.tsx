// 'use client';

// import { useEffect, useRef, useState } from 'react';

//     type EarthquakeLocation = {
//     lat: number;
//     lng: number;
//   };
  
//   const earthquakeData: EarthquakeLocation[] = [
//     { lat: 28.6139, lng: 77.2090 },
//     { lat: 19.0760, lng: 72.8777 },
//     { lat: 34.0836, lng: 74.7973 },
//   ];
  

// const GoogleMapBox = () => {
//     const mapRef = useRef<HTMLDivElement | null>(null);
//     const [mapLoaded, setMapLoaded] = useState(false);
  
//     useEffect(() => {

//         const loadGoogleMaps = () => {
//             return new Promise((resolve, reject) => {
//               if (typeof window.google === 'object' && typeof window.google.maps === 'object') {
//                 resolve(true);
//                 return;
//               }
      
//               const script = document.createElement('script');
//               script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
//               script.async = true;
//               script.defer = true;
//               script.onload = () => resolve(true);
//               script.onerror = () => reject(new Error('Google Maps failed to load'));
//               document.head.appendChild(script);
//             });
//           };

//       const initMap = async () => {
//       try {
//         await loadGoogleMaps();
//         if (mapRef.current) {
//             const center = { lat: 23.2599, lng: 77.4126 }; // Center of India

//             const map = new google.maps.Map(mapRef.current, {
//               center,
//               zoom: 5,
//           });

//           earthquakeData.forEach(location => {
//             new google.maps.Marker({
//               position: location,
//               map,
//               icon: {
//                 url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
//               },
//               title: `Earthquake at (${location.lat}, ${location.lng})`,
//             });
//           });

//           setMapLoaded(true);
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     }; 

//     initMap();
//   }, []);

//   return (
//     <div className="w-full h-full rounded-lg">
//       {!mapLoaded && <p className="text-gray-500 text-center">Loading map...</p>}
//       <div ref={mapRef} className="w-full h-full" />
//     </div>
//   );
// };

// export default GoogleMapBox;

"use client";
import React from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

type Props = {
  center?: { lat: number; lng: number };
  markers?: { lat: number; lng: number }[];
  mapTypeId?: "roadmap" | "satellite" | "hybrid" | "terrain";
  zoom?: number;
};

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629, // India default
};

const GoogleMapBox: React.FC<Props> = ({ center = defaultCenter, markers = [], mapTypeId = "roadmap", zoom = 5 }) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", // Add key in .env
  });

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      mapTypeId={mapTypeId}
    >
      <Marker position={center} />
      {markers.map((marker, index) => (
        <Marker key={index} position={marker} />
      ))}
    </GoogleMap>
  ) : (
    <div className="text-white text-sm p-4">Loading Map...</div>
  );
};

export default GoogleMapBox;
