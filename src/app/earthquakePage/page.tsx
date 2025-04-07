import { Suspense } from 'react';
import EarthquakePage from "@/components/Earthquake"
import EarthquakeInvertory from "@/app/inventory/page"

export default function DisasterPage(){
    return (
        <Suspense fallback={<p>Loading earthquake data...</p>}>
            <EarthquakePage />
            <EarthquakeInvertory />
        </Suspense>
    )
}