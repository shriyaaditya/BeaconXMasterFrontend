import { Suspense } from "react"
import CyclonePage from "@/components/Cyclones"
import CycloneInvertory from "@/app/inventory/page"

export default function DisasterPage(){
    return (
        <Suspense fallback={<p>Loading cyclone data...</p>}>
            <CyclonePage />
            <CycloneInvertory />
        </Suspense>
    )
}