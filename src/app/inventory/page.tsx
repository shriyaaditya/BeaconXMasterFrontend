"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  TooltipItem,
  Legend
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"
import { useSearchParams } from 'next/navigation';

// Register ChartJS components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
)

// Disaster severity levels
// const DISASTER_SEVERITY = {
//   LOW: { level: 1, label: "Mild", color: "bg-green-500" },
//   MODERATE: { level: 2, label: "Moderate", color: "bg-yellow-500" },
//   HIGH: { level: 3, label: "High", color: "bg-orange-500" },
//   EXTREME: { level: 4, label: "Catastrophic", color: "bg-red-500" },
// }

// Category icons mapping
const categoryIcons = {
  "Medical Supplies": "⚕️",
  "Food & Water": "🍲",
  "Shelter & Clothing": "🏕️",
  "Rescue Equipment": "⛑️",
  "Communication & Power": "📡",
  "Sanitation & Hygiene": "🚰",
  "Fuel & Power Backup": "⚡",
}

// Type definitions
interface InventoryItem {
  name: string
  per1000: number
  min: number
  reorder: number
  max: number
  depletionRate?: number 
}

interface CategoryData {
  title: string
  icon: string
  items: InventoryItem[]
}

interface InventoryData {
  [key: string]: CategoryData
}

interface CurrentInventoryItem {
  current: number
  percentage: number
  status: "critical" | "warning" | "optimal"
  depletionRate: number
}

interface CurrentInventory {
  [key: string]: {
    [key: string]: CurrentInventoryItem
  }
}

interface AllocationRecommendation {
  item: string
  current: number
  recommended: number
  reason: string
  priority: "high" | "medium" | "low"
}

// Function to fetch data from Google Sheets using the API route
const fetchGoogleSheetData = async () => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : '');
    const response = await fetch(`${baseUrl}/api/sheets`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export default function Home() {
const searchParams = useSearchParams();
  
  // Get earthquake parameters from URL
  const earthquakeMagnitude = parseFloat(searchParams.get('magnitude') ?? '0');
  const earthquakeDepth = parseFloat(searchParams.get('depth') ?? '0');
  const earthquakeLatitude = parseFloat(searchParams.get('latitude') ?? '0');
  const earthquakeLongitude = parseFloat(searchParams.get('longitude') ?? '0');


// Function to fetch disaster severity from ML model
const fetchDisasterSeverity = useCallback(async (): Promise<SeverityLevel> => {
  try {

    const response = await fetch("https://df51-103-196-217-233.ngrok-free.app/combined/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        magnitude: earthquakeMagnitude,
        depth: earthquakeDepth,
        latitude: earthquakeLatitude,
        longitude: earthquakeLongitude
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data.severity)
    return data.severity ?? "Low"; 
  } catch (error) {
    console.error("Error fetching disaster severity:", error);
    return "Low"; // Default to low severity on error
  }
},[earthquakeMagnitude, earthquakeDepth, earthquakeLatitude, earthquakeLongitude]);

// Function to parse Google Sheets data
const parseSheetData = (data: string[][], severityLevel: number): InventoryData => {
  const result: InventoryData = {}
  
  // Skip header row and process data
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const category = row[0]
    const item = row[1]

    if (!category || !item) continue

    const categoryKey = category.replace(/[^a-zA-Z0-9]/g, "")

    if (!result[categoryKey]) {
      result[categoryKey] = {
        title: category,
        icon: categoryIcons[category as keyof typeof categoryIcons] || "📦",
        items: [],
      }
    }

    // Parse numeric values from columns
    const per1000 = parseFloat(row[2] || "0")
    const min = parseFloat(row[3] || "0")
    const reorder = parseFloat(row[4] || "0")
    const max = parseFloat(row[5] || "0")
    
    // Calculate depletion rate based on severity (higher severity = faster depletion)
    // Base depletion rate is 1-5% per day, multiplied by severity factor
    const baseDepletionRate = 0.01 + (Math.random() * 0.04); // 1-5%
    const severityFactor = 0.5 + (severityLevel * 0.5); // 1x for low, 2.5x for extreme
    const depletionRate = baseDepletionRate * severityFactor;

    result[categoryKey].items.push({
      name: item,
      per1000,
      min,
      reorder,
      max,
      depletionRate,
    })
  }

  return result
}

// Generate current inventory levels with severity-based depletion
const generateCurrentInventory = (inventoryData: InventoryData, severityLevel: number): CurrentInventory => {
  const result: CurrentInventory = {}

  Object.keys(inventoryData).forEach((category) => {
    result[category] = {}
    inventoryData[category].items.forEach((item) => {
      // Generate a random value between min and max
      let current = Math.floor(Math.random() * (item.max - item.min) + item.min)
      
      // Adjust based on severity - more severe = lower starting inventory
      current = Math.max(item.min, current * (1 - (severityLevel * 0.1)))

      // Calculate percentage of max
      const percentage = Math.round((current / item.max) * 100)

      // Determine status based on levels
      let status: "critical" | "warning" | "optimal" = "optimal"
      if (current <= item.min) {
        status = "critical"
      } else if (current <= item.reorder) {
        status = "warning"
      }

      result[category][item.name] = { 
        current, 
        percentage, 
        status,
        depletionRate: item.depletionRate || 0.02 // Default 2% if not set
      }
    })
  })

  return result
}

// Generate allocation recommendations based on trends and severity
const generateAllocationRecommendations = (
  inventoryData: InventoryData,
  currentInventory: CurrentInventory,
  selectedCategory: string,
  severityLevel: number
): AllocationRecommendation[] => {
  if (!selectedCategory || !inventoryData[selectedCategory]) return []

  const recommendations: AllocationRecommendation[] = []
  const categoryItems = inventoryData[selectedCategory].items

  categoryItems.forEach((item) => {
    const current = currentInventory[selectedCategory]?.[item.name]?.current || 0
    const status = currentInventory[selectedCategory]?.[item.name]?.status || "optimal"
    const depletionRate = currentInventory[selectedCategory]?.[item.name]?.depletionRate || 0.02

    // Base recommendation logic
    let recommended = current
    let reason = "No change needed"
    let priority: "high" | "medium" | "low" = "low"

    // Calculate projected depletion based on severity
    const daysUntilCritical = status === "critical" ? 0 : 
      Math.floor((current - item.min) / (current * depletionRate))
    
    // Adjust recommendations based on severity
    const severityMultiplier = 1 + (severityLevel * 0.5) // 1.5x for low, 3x for extreme

    if (status === "critical") {
      recommended = Math.min(item.max, Math.ceil(item.max * 0.8 * severityMultiplier))
      reason = `Critical levels - urgent replenishment needed (projected to last ${daysUntilCritical} days)`
      priority = "high"
    } else if (status === "warning") {
      recommended = Math.min(item.max, Math.ceil(item.reorder * 1.5 * severityMultiplier))
      reason = `Warning levels - recommend increased allocation (projected to last ${daysUntilCritical} days)`
      priority = daysUntilCritical < 3 ? "high" : "medium"
    } else if (current < item.max * 0.8) {
      // For optimal items, increase recommendation based on severity
      const severityAdjustment = 1 + (severityLevel * 0.1) // 10% increase per severity level
      recommended = Math.min(item.max, Math.ceil(current * 1.2 * severityAdjustment))
      reason = `Below optimal levels - increase recommended due to disaster severity ${severityLevel}`
      priority = daysUntilCritical < 7 ? "medium" : "low"
    }

    // Ensure we're not recommending less than current
    recommended = Math.max(recommended, current)

    recommendations.push({
      item: item.name,
      current,
      recommended,
      reason,
      priority
    })
  })

  // Sort by priority (high to low)
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

  const [inventoryData, setInventoryData] = useState<InventoryData>({})
  const [currentInventory, setCurrentInventory] = useState<CurrentInventory>({})
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [timeRange, setTimeRange] = useState<string>("week")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [allocationRecs, setAllocationRecs] = useState<AllocationRecommendation[]>([])
  const [isAllocating, setIsAllocating] = useState<boolean>(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [disasterSeverity, setDisasterSeverity] = useState<SeverityLevel>("Low")
  const lineChartRef = useRef(null)

  type SeverityLevel = "Low" | "Moderate" | "Severe" | "Catastrophic";

  const severityMap: Record<SeverityLevel, number> = useMemo(() => ({
    "Low": 1,
    "Moderate": 2,
    "Severe": 3,
    "Catastrophic": 4
  }), []);
    
  // Load Google Sheets data and disaster severity
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch disaster severity first
        const severity = await fetchDisasterSeverity();
        setDisasterSeverity(severity);
        
        const currentNumericSeverity = severityMap[severity] ?? 1;

        // Then fetch inventory data with severity context
        const fetchedData = await fetchGoogleSheetData();
        if (!fetchedData || !fetchedData.values || fetchedData.values.length === 0) {
          throw new Error("No data received from Google Sheets API");
        }
        
        const parsedData = parseSheetData(fetchedData.values, currentNumericSeverity);
        setInventoryData(parsedData);
        
        // Select the first category (if available)
        if (Object.keys(parsedData).length > 0) {
          setSelectedCategory(Object.keys(parsedData)[0]);
        }
        
        // Generate current inventory levels with severity context
        setCurrentInventory(generateCurrentInventory(parsedData, currentNumericSeverity));
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load inventory data.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchDisasterSeverity, severityMap]);
  
  const numericSeverity = severityMap[disasterSeverity as keyof typeof severityMap] ?? 1;
  // Update allocation recommendations when category or severity changes
  useEffect(() => {
    if (selectedCategory && Object.keys(currentInventory).length > 0) {
      setAllocationRecs(
        generateAllocationRecommendations(
          inventoryData, 
          currentInventory, 
          selectedCategory,
          numericSeverity
        )
      )
    }
  }, [selectedCategory, currentInventory, inventoryData, numericSeverity])

  // Refresh inventory data
  const refreshInventory = async () => {
    try {
      setIsLoading(true)
      const severity = await fetchDisasterSeverity()
      setDisasterSeverity(severity)
      
      const sheetData = await fetchGoogleSheetData()
      const parsedData = parseSheetData(sheetData, numericSeverity)
      
      setInventoryData(parsedData)
      setLastUpdated(new Date().toLocaleString())
      
      const currentInv = generateCurrentInventory(parsedData, numericSeverity)
      setCurrentInventory(currentInv)
    } catch (err) {
      console.error("Error refreshing data:", err)
      setError("Failed to refresh data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle allocation action
  const handleAllocate = () => {
    setIsAllocating(true)
    
    // Simulate allocation process
    setTimeout(() => {
      // Update inventory with recommended values
      const updatedInventory = { ...currentInventory }
      
      allocationRecs.forEach(rec => {
        if (updatedInventory[selectedCategory] && updatedInventory[selectedCategory][rec.item]) {
          updatedInventory[selectedCategory][rec.item].current = rec.recommended
          
          // Update status based on new value
          const itemSpec = inventoryData[selectedCategory].items.find(i => i.name === rec.item)
          if (itemSpec) {
            let status: "critical" | "warning" | "optimal" = "optimal"
            if (rec.recommended <= itemSpec.min) {
              status = "critical"
            } else if (rec.recommended <= itemSpec.reorder) {
              status = "warning"
            }
            updatedInventory[selectedCategory][rec.item].status = status
            updatedInventory[selectedCategory][rec.item].percentage = Math.round((rec.recommended / itemSpec.max) * 100)
          }
        }
      })
      
      setCurrentInventory(updatedInventory)
      setIsAllocating(false)
      
      // Show success message
      alert("Resource allocation request has been sent successfully based on recommendations!")
    }, 1500)
  }

  // Generate line chart data for inventory trends with severity impact
  const getLineChartData = () => {
    if (!selectedCategory || !inventoryData[selectedCategory]) {
      return { labels: [], datasets: [] }
    }

    const labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]

    const datasets = inventoryData[selectedCategory].items.map((item, index) => {
      // Generate data points that trend downward based on depletion rate and severity
      const baseDepletionRate = item.depletionRate || 0.02
      const severityImpact = 1 + (numericSeverity * 0.3) // 30% increase per severity level
      const effectiveDepletionRate = baseDepletionRate * severityImpact

      // Start from a random point between min and max
      const startValue = Math.floor(
        Math.random() * (item.max - item.min) + item.min * (1 - (numericSeverity * 0.1)))
      
      const data = Array(7).fill(null).map((_, i) => {
        // Calculate depletion with some randomness
        const randomFactor = 0.9 + Math.random() * 0.2
        const depletedValue = startValue * Math.pow(1 - effectiveDepletionRate * randomFactor, i)
        return Math.max(item.min, Math.floor(depletedValue))
      })

      return {
        label: item.name,
        data,
        borderColor: `hsl(${170 + index * 15}, 70%, ${60 - index * 5}%)`,
        backgroundColor: `hsla(${170 + index * 15}, 70%, ${60 - index * 5}%, 0.5)`,
        tension: 0.4,
        fill: false,
      }
    })

    return { labels, datasets }
  }

  // Generate bar chart data for inventory levels
  const getBarChartData = () => {
    if (!selectedCategory || !inventoryData[selectedCategory] || !currentInventory[selectedCategory]) {
      return { labels: [], datasets: [] }
    }

    const category = inventoryData[selectedCategory]
    const labels = category.items.map((item) => item.name)

    const currentValues = category.items.map((item) => currentInventory[selectedCategory]?.[item.name]?.current || 0)

    const minValues = category.items.map((item) => item.min)
    const reorderValues = category.items.map((item) => item.reorder)
    const maxValues = category.items.map((item) => item.max)

    return {
      labels,
      datasets: [
        {
          label: "Current",
          data: currentValues,
          backgroundColor: "rgba(45, 212, 191, 0.8)",
          borderColor: "rgba(45, 212, 191, 1)",
          borderWidth: 1,
        },
        {
          label: "Minimum",
          data: minValues,
          backgroundColor: "rgba(239, 68, 68, 0.5)",
          borderColor: "rgba(239, 68, 68, 0.8)",
          borderWidth: 1,
        },
        {
          label: "Reorder",
          data: reorderValues,
          backgroundColor: "rgba(251, 191, 36, 0.5)",
          borderColor: "rgba(251, 191, 36, 0.8)",
          borderWidth: 1,
        },
        {
          label: "Maximum",
          data: maxValues,
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          borderColor: "rgba(16, 185, 129, 0.8)",
          borderWidth: 1,
        },
      ],
    }
  }

  // Generate doughnut chart data for status overview
  const getDoughnutData = () => {
    if (!Object.keys(currentInventory).length) {
      return { labels: [], datasets: [] }
    }

    let critical = 0
    let warning = 0
    let optimal = 0

    Object.keys(currentInventory).forEach((category) => {
      Object.keys(currentInventory[category]).forEach((item) => {
        const status = currentInventory[category][item].status
        if (status === "critical") critical++
        else if (status === "warning") warning++
        else if (status === "optimal") optimal++
      })
    })

    return {
      labels: ["Critical", "Warning", "Optimal"],
      datasets: [
        {
          data: [critical, warning, optimal],
          backgroundColor: ["rgba(239, 68, 68, 0.8)", "rgba(251, 191, 36, 0.8)", "rgba(16, 185, 129, 0.8)"],
          borderColor: ["rgba(239, 68, 68, 1)", "rgba(251, 191, 36, 1)", "rgba(16, 185, 129, 1)"],
          borderWidth: 1,
        },
      ],
    }
  }

  // Chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y || 0
            if (!selectedCategory || !inventoryData[selectedCategory]) {
              return `${label}: ${value}`;
            }
            const item = inventoryData[selectedCategory]?.items.find((i: InventoryItem) => i.name === label)
            const percentage = item ? Math.round((value / item.max) * 100) : 0
            return `${label}: ${value} (${percentage}% of max)`
          }
        }
      },
    },
    scales: {
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.8)",
        },
      },
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.8)",
        },
      },
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.8)",
        },
      },
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.8)",
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
        },
      },
    },
  }

  // Get severity display info
  const getSeverityInfo = (severity: string) => {
    switch (severity) {
      case "Moderate":
        return { color: "bg-yellow-400 text-yellow-900", label: "Moderate" };
      case "Severe":
        return { color: "bg-orange-500 text-white", label: "Severe" };
      case "Catastrophic":
        return { color: "bg-red-600 text-white", label: "Catastrophic" };
      case "Low":
      default:
        return { color: "bg-green-400 text-green-900", label: "Low" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-teal-400">Emergency Supplies Dashboard</h1>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">Last updated: {lastUpdated}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <span className="mr-2">Disaster Severity:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getSeverityInfo(disasterSeverity).color}`}>
                {getSeverityInfo(disasterSeverity).label}
              </span>
            </div>
            <select
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <button
              className="bg-teal-500 hover:bg-teal-600 px-4 py-1 rounded flex items-center gap-2"
              onClick={refreshInventory}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="containers p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-800 rounded-lg">
            <svg
              className="animate-spin h-12 w-12 text-teal-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <h2 className="text-xl font-semibold mt-4">Loading inventory data...</h2>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-800 rounded-lg">
            <div className="bg-red-500/20 p-2 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-500">Error Loading Data</h2>
            <p className="text-gray-400 mb-6 text-center max-w-md">{error}</p>
          </div>
        ) : (
          <>
            {/* Category Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
              {Object.keys(inventoryData).map((category) => (
                <button
                  key={category}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                    selectedCategory === category
                      ? "bg-teal-500 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className="text-xl">{inventoryData[category].icon}</span>
                  <span className="text-xs mt-1">{inventoryData[category].title}</span>
                </button>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 mx-1/2 gap-6">
              {/* Inventory Trend Line Chart */}
              <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-teal-400">
                  {selectedCategory && inventoryData[selectedCategory]
                    ? inventoryData[selectedCategory].title
                    : "Loading..."}{" "}
                  - Inventory Trend
                </h2>
                <div className="h-80">
                  <Line 
                    data={getLineChartData()} 
                    options={lineOptions} 
                    ref={lineChartRef} 
                  />
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  <p>Trends adjusted for disaster severity level {disasterSeverity} ({getSeverityInfo(disasterSeverity).label})</p>
                </div>
              </div>

              {/* Inventory Levels Bar Chart */}
              <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-teal-400">
                  {selectedCategory && inventoryData[selectedCategory]
                    ? inventoryData[selectedCategory].title
                    : "Loading..."}{" "}
                  - Inventory Levels
                </h2>
                <div className="h-80">
                  <Bar data={getBarChartData()} options={barOptions} />
                </div>
              </div>

              {/* Status Overview */}
              <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-teal-400">Inventory Status Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-64">
                    <Doughnut data={getDoughnutData()} options={doughnutOptions} />
                  </div>
                  <div className="flex flex-col justify-center space-y-4">
                    {Object.keys(currentInventory).length > 0 && (
                      <>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                          <span>
                            Critical Items:{" "}
                            {Object.keys(currentInventory).reduce((acc, category) => {
                              return (
                                acc +
                                Object.values(currentInventory[category]).filter((item) => item.status === "critical")
                                  .length
                              )
                            }, 0)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                          <span>
                            Warning Items:{" "}
                            {Object.keys(currentInventory).reduce((acc, category) => {
                              return (
                                acc +
                                Object.values(currentInventory[category]).filter((item) => item.status === "warning")
                                  .length
                              )
                            }, 0)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                          <span>
                            Optimal Items:{" "}
                            {Object.keys(currentInventory).reduce((acc, category) => {
                              return (
                                acc +
                                Object.values(currentInventory[category]).filter((item) => item.status === "optimal")
                                  .length
                              )
                            }, 0)}
                          </span>
                        </div>
                        <div className="mt-4 p-2 bg-gray-700 rounded">
                          <p className="text-sm">
                            <span className="font-semibold">Disaster Severity Impact:</span> 
                            <br />
                            Higher severity increases depletion rates by {numericSeverity * 30}% and allocation recommendations.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Resource Allocation */}
              <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-teal-400">Resource Allocation</h2>
                  <button
                    onClick={handleAllocate}
                    disabled={isAllocating || allocationRecs.length === 0}
                    className={`px-4 py-2 rounded flex items-center gap-2 ${
                      isAllocating || allocationRecs.length === 0
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-teal-500 hover:bg-teal-600"
                    }`}
                  >
                    {isAllocating ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Allocating...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Allocate
                      </>
                    )}
                  </button>
                </div>
                <div className="overflow-y-auto max-h-96">
                  <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
                    <thead className="bg-gray-700 sticky top-0">
                      <tr>
                        <th className="py-2 px-4 text-left">Priority</th>
                        <th className="py-2 px-4 text-left">Item</th>
                        <th className="py-2 px-4 text-left">Current</th>
                        <th className="py-2 px-4 text-left">Recommended</th>
                        <th className="py-2 px-4 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocationRecs.map((rec, index) => {
                        let priorityColor = "bg-gray-500"
                        if (rec.priority === "high") priorityColor = "bg-red-500"
                        else if (rec.priority === "medium") priorityColor = "bg-yellow-500"
                        
                        return (
                          <tr key={index} className={index % 2 === 0 ? "bg-gray-800" : "bg-gray-900"}>
                            <td className="py-2 px-4">
                              <span className={`inline-block w-3 h-3 rounded-full ${priorityColor} mr-2`}></span>
                              <span className="capitalize">{rec.priority}</span>
                            </td>
                            <td className="py-2 px-4">{rec.item}</td>
                            <td className="py-2 px-4">{rec.current}</td>
                            <td className="py-2 px-4">
                              <span className={`font-bold ${
                                rec.recommended > rec.current ? "text-green-400" : 
                                rec.recommended < rec.current ? "text-yellow-400" : "text-gray-400"
                              }`}>
                                {rec.recommended}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-sm text-gray-300">{rec.reason}</td>
                          </tr>
                        )
                      })}
                      {allocationRecs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-gray-400">
                            No allocation recommendations available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Detailed Inventory Table */}
            {selectedCategory && inventoryData[selectedCategory] && (
              <div className="mt-6 bg-gray-800 rounded-lg p-4 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-teal-400">
                  {inventoryData[selectedCategory].title} - Detailed Inventory
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="py-2 px-4 text-left">Item</th>
                        <th className="py-2 px-4 text-left">Per 1,000 People</th>
                        <th className="py-2 px-4 text-left">Current</th>
                        <th className="py-2 px-4 text-left">Minimum</th>
                        <th className="py-2 px-4 text-left">Reorder</th>
                        <th className="py-2 px-4 text-left">Maximum</th>
                        <th className="py-2 px-4 text-left">Status</th>
                        <th className="py-2 px-4 text-left">Depletion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData[selectedCategory].items.map((item, index) => {
                        const current = currentInventory[selectedCategory]?.[item.name]?.current || 0
                        const status = currentInventory[selectedCategory]?.[item.name]?.status || "unknown"
                        const depletionRate = currentInventory[selectedCategory]?.[item.name]?.depletionRate || 0.02

                        let statusColor = "bg-gray-500"
                        if (status === "critical") statusColor = "bg-red-500"
                        else if (status === "warning") statusColor = "bg-yellow-500"
                        else if (status === "optimal") statusColor = "bg-green-500"

                        return (
                          <tr key={index} className={index % 2 === 0 ? "bg-gray-800" : "bg-gray-900"}>
                            <td className="py-2 px-4">{item.name}</td>
                            <td className="py-2 px-4">{item.per1000}</td>
                            <td className="py-2 px-4">{current}</td>
                            <td className="py-2 px-4">{item.min}</td>
                            <td className="py-2 px-4">{item.reorder}</td>
                            <td className="py-2 px-4">{item.max}</td>
                            <td className="py-2 px-4">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${statusColor} mr-2`}></div>
                                <span className="capitalize">{status}</span>
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              {(depletionRate * 100).toFixed(1)}% per day
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}