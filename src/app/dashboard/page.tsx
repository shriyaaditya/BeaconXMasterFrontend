"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p>Welcome, {user.name || user.email || "User"}</p>        
    </div>
  );
}
