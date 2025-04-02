"use client"

import { useEffect, useRef, useState } from "react"
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar, Line, Doughnut, Radar } from "react-chartjs-2"
import * as XLSX from "xlsx"

// Register ChartJS components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
)

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
}

interface CurrentInventory {
  [key: string]: {
    [key: string]: CurrentInventoryItem
  }
}

// Function to parse Excel data
const parseExcelData = (data: any[]): InventoryData => {
  const result: InventoryData = {}

  data.forEach((row) => {
    const category = row.Category
    const item = row.Item

    if (!category || !item) return

    const categoryKey = category.replace(/[^a-zA-Z0-9]/g, "");

    if (!result[categoryKey]) {
      result[categoryKey] = {
        title: category,
        icon: categoryIcons[category as keyof typeof categoryIcons] || "📦",
        items: [],
      };
    }
    

    // Parse numeric values, handling different formats
    const per1000Value = row["Per 1,000 People"]
    let per1000 = 0

    if (typeof per1000Value === "number") {
      per1000 = per1000Value
    } else if (typeof per1000Value === "string") {
      // Extract numeric part from strings like "500 units" or "5 liters/day/person"
      const match = per1000Value.match(/^([\d,]+)/)
      if (match) {
        per1000 = Number.parseFloat(match[1].replace(/,/g, ""))
      }
    }

    result[categoryKey].items.push({
      name: item,
      per1000: per1000,
      min: Number.parseFloat(row["Minimum Level"]),
      reorder: Number.parseFloat(row["Reorder Level"]),
      max: Number.parseFloat(row["Maximum Level"]),
    })
  })

  return result
}

// Generate mock current inventory levels (random values between min and max)
const generateCurrentInventory = (inventoryData: InventoryData): CurrentInventory => {
  const result: CurrentInventory = {}

  Object.keys(inventoryData).forEach((category) => {
    result[category] = {}
    inventoryData[category].items.forEach((item) => {
      // Generate a random value between min and max
      const current = Math.floor(Math.random() * (item.max - item.min) + item.min)

      // Calculate percentage of max
      const percentage = Math.round((current / item.max) * 100)

      // Determine status based on levels
      let status: "critical" | "warning" | "optimal" = "optimal"
      if (current <= item.min) {
        status = "critical"
      } else if (current <= item.reorder) {
        status = "warning"
      }

      result[category][item.name] = { current, percentage, status }
    })
  })

  return result
}

export default function Home() {
  const [inventoryData, setInventoryData] = useState<InventoryData>({})
  const [currentInventory, setCurrentInventory] = useState<CurrentInventory>({})
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [timeRange, setTimeRange] = useState<string>("week")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const lineChartRef = useRef(null)

  // Load XLSX data
  useEffect(() => {
    const loadXLSXData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/Disaster_Inventory.xlsx")

        if (!response.ok) {
          throw new Error(`Failed to load XLSX file: ${response.status} ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const data = new Uint8Array(arrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Parse the data
        const parsedData = parseExcelData(jsonData)

        setInventoryData(parsedData)

        // Select the first category
        if (Object.keys(parsedData).length > 0) {
          setSelectedCategory(Object.keys(parsedData)[0])
        }

        // Generate current inventory levels
        setCurrentInventory(generateCurrentInventory(parsedData))
      } catch (err) {
        console.error("Error loading XLSX data:", err)
        setError("Failed to load inventory data. Please check if the XLSX file exists and is accessible.")

        // Load fallback data if XLSX fails
      } finally {
        setIsLoading(false)
      }
    }

    loadXLSXData()
  }, [])

  // Load fallback data if XLSX fails

  // Refresh inventory data
  const refreshInventory = () => {
    setCurrentInventory(generateCurrentInventory(inventoryData))
  }

  // Generate line chart data for inventory trends
  const getLineChartData = () => {
    if (!selectedCategory || !inventoryData[selectedCategory]) {
      return { labels: [], datasets: [] }
    }

    const labels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]

    const datasets = inventoryData[selectedCategory].items.map((item, index) => {
      // Generate random data points that trend downward
      const data = Array(7).fill(null).map((_, i) => { 

        
          const max = item.max
          const min = item.min
          const randomFactor = Math.random() * 0.2 + 0.9 - i * 0.05
          return Math.floor((max - min) * randomFactor + min)
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

  // Generate radar chart data for category coverage
  const getRadarData = () => {
    if (!Object.keys(currentInventory).length) {
      return { labels: [], datasets: [] }
    }

    const labels = Object.keys(inventoryData).map((key) => inventoryData[key].title)

    // Calculate average percentage for each category
    const data = Object.keys(inventoryData).map((category) => {
      const items = Object.keys(currentInventory[category] || {})
      if (items.length === 0) return 0

      const sum = items.reduce((acc, item) => {
        return acc + (currentInventory[category][item]?.percentage || 0)
      }, 0)

      return Math.round(sum / items.length)
    })

    return {
      labels,
      datasets: [
        {
          label: "Coverage %",
          data,
          backgroundColor: "rgba(45, 212, 191, 0.2)",
          borderColor: "rgba(45, 212, 191, 1)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(45, 212, 191, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(45, 212, 191, 1)",
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

  const radarOptions = {
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
      r: {
        angleLines: {
          color: "rgba(255, 255, 255, 0.2)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
        pointLabels: {
          color: "rgba(255, 255, 255, 0.8)",
        },
        ticks: {
          backdropColor: "transparent",
          color: "rgba(255, 255, 255, 0.8)",
        },
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-teal-400">Emergency Supplies Dashboard</h1>
          <div className="flex space-x-4">
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
              className="bg-teal-500 hover:bg-teal-600 px-4 py-1 rounded"
              onClick={refreshInventory}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                </span>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
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
            <div className="bg-red-500/20 p-4 rounded-full mb-4">
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
            <p className="text-gray-400 mb-6 text-center max-w-md">Using fallback data instead.</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inventory Trend Line Chart */}
              <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-teal-400">
                  {selectedCategory && inventoryData[selectedCategory]
                    ? inventoryData[selectedCategory].title
                    : "Loading..."}{" "}
                  - Inventory Trend
                </h2>
                <div className="h-80">
                  <Line data={getLineChartData()} options={lineOptions} ref={lineChartRef} />
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
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Coverage Radar Chart */}
              <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-teal-400">Category Coverage</h2>
                <div className="h-64">
                  <Radar data={getRadarData()} options={radarOptions} />
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
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData[selectedCategory].items.map((item, index) => {
                        const current = currentInventory[selectedCategory]?.[item.name]?.current || 0
                        const status = currentInventory[selectedCategory]?.[item.name]?.status || "unknown"

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

