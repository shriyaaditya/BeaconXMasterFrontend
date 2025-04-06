import EarthquakePage from "@/components/Earthquake"
import EarthquakeInvertory from "@/app/inventory/page"

export default function DisasterPage(){
    return (
        <div>
            <EarthquakePage />
            <EarthquakeInvertory />
        </div>
    )
}