'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface RevenueProps {
  gameId: string | null
  dateRange: string
}

interface RevenueData {
  dates: string[]
  revenue: number[]
  iap: number[]
  ads: number[]
  revenueByCountry: {
    country: string
    revenue: number
  }[]
}

export default function Revenue({ gameId, dateRange }: RevenueProps) {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!gameId) return

      try {
        const response = await axios.get(`/api/revenue?gameId=${gameId}&dateRange=${dateRange}`)
        setData(response.data)
      } catch (err) {
        setError('Failed to load revenue data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [gameId, dateRange])

  if (loading) {
    return <div className="loading-indicator">Loading revenue data...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!data) {
    return <div className="info-message">Select a game to view revenue</div>
  }

  const lineChartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Total Revenue',
        data: data.revenue,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'IAP Revenue',
        data: data.iap,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1
      },
      {
        label: 'Ad Revenue',
        data: data.ads,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      }
    ]
  }

  const barChartData = {
    labels: data.revenueByCountry.map(item => item.country),
    datasets: [
      {
        label: 'Revenue by Country',
        data: data.revenueByCountry.map(item => item.revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Revenue Over Time'
      }
    }
  }

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Revenue by Country'
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-4 rounded-lg shadow">
        <Line data={lineChartData} options={chartOptions} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <Bar data={barChartData} options={barChartOptions} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Revenue Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-500 uppercase">Total Revenue</h4>
            <p className="text-2xl font-bold">
              ${data.revenue.reduce((sum, curr) => sum + curr, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-500 uppercase">IAP Revenue</h4>
            <p className="text-2xl font-bold">
              ${data.iap.reduce((sum, curr) => sum + curr, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-500 uppercase">Ad Revenue</h4>
            <p className="text-2xl font-bold">
              ${data.ads.reduce((sum, curr) => sum + curr, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 