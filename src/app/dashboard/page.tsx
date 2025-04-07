"use client"

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bell, MapPin, PackageCheck, BookOpen, Users } from "lucide-react";

export default function Dashboard() {
    const { user, loading} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
        router.push("/login");
        }
    }, [user, loading, router]);

    if (!user) {
        return null; 
    }

    if (loading) {
      return <p>Loading...</p>; 
    }

  return (
    <div className="p-6 bg-teal-100 space-y-6">
      <h1 className="text-3xl text-teal-800 font-bold">Dashboard</h1>
      <p>Welcome, {user.name || user.email || "User"}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-teal-800 to-teal-700 text-white shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Current Weather</h2>
                <p className="text-sm">Location: Bhubaneswar</p>
                <p className="text-sm">Wind: 45 km/h</p>
              </div>
              <MapPin className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-700 to-red-500 text-white shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Earthquake Alert</h2>
                <p className="text-sm">Magnitude: 6.4</p>
                <p className="text-sm">Depth: 10km</p>
              </div>
              <Bell className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-700 to-cyan-500 text-white shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Cyclone Warning</h2>
                <p className="text-sm">Category: Severe</p>
                <p className="text-sm">Direction: NE</p>
              </div>
              <MapPin className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="shadow-md">
          <div className="p-4 flex flex-col items-start">
            <PackageCheck className="text-teal-600 w-6 h-6 mb-2" />
            <h3 className="font-semibold mb-1">Inventory Status</h3>
            <p className="text-sm text-gray-600">Water: ✅ | First Aid: ❌</p>
            <button 
             onClick={() => router.push("/inventory")}
             className="mt-3">Update Inventory</button>
          </div>
        </div>

        <div className="shadow-md">
          <div className="p-4 flex flex-col items-start">
            <BookOpen className="text-yellow-600 w-6 h-6 mb-2" />
            <h3 className="font-semibold mb-1">Survival Guide</h3>
            <p className="text-sm text-gray-600">Get step-by-step instructions</p>
            <button 
              onClick={() => router.push("/guide")}
              className="mt-3">Read Guide</button>
          </div>
        </div>

        <div className="shadow-md">
          <div className="p-4 flex flex-col items-start">
            <Users className="text-indigo-600 w-6 h-6 mb-2" />
            <h3 className="font-semibold mb-1">Community News</h3>
            <button
              onClick={() => router.push("/community")} 
              className="mt-3">See Latest News</button>
          </div>
        </div>
      </div>
    </div>
  );
}
