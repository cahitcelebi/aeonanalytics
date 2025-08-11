'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Line, Bar } from 'react-chartjs-2'
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

interface UserActivityProps {
  gameId: string | null
  dateRange: string
}

interface UserActivityData {
  dates: string[]
  activeUsers: number[]
  sessions: number[]
  avgSessionDuration: number[]
  platformDistribution: {
    platform: string
    count: number
  }[]
  deviceDistribution: {
    device: string
    count: number
  }[]
  dau: number
  wau: number
  mau: number
  newUsers: number[]
  userEngagementTime: number[]
  sessionFrequency: number[]
}

export default function UserActivity({ gameId, dateRange }: UserActivityProps) {
  const [data, setData] = useState<UserActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!gameId) return

      try {
        const response = await axios.get(`/api/user-activity?gameId=${gameId}&dateRange=${dateRange}`)
        setData(response.data)
      } catch (err) {
        setError('Failed to load user activity data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [gameId, dateRange])

  if (loading) {
    return <div className="loading-indicator">Loading user activity data...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!data) {
    return <div className="info-message">Select a game to view user activity</div>
  }

  const userChartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Active Users',
        data: data.activeUsers,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'New Users',
        data: data.newUsers,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.1
      }
    ]
  }

  const sessionChartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Sessions',
        data: data.sessions,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1
      },
      {
        label: 'Sessions per User',
        data: data.sessionFrequency,
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.1,
        yAxisID: 'y1',
      }
    ]
  }

  const engagementChartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Avg. Session Duration (min)',
        data: data.avgSessionDuration,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      },
      {
        label: 'Avg. Engagement Time (min)',
        data: data.userEngagementTime,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
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
        text: 'User Activity'
      }
    }
  }

  const sessionChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Session Metrics'
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    }
  }

  const engagementChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Engagement (minutes)'
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Daily Active Users (DAU)</h3>
          <p className="text-3xl font-bold text-indigo-600">{data.dau.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Daily active user count
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Weekly Active Users (WAU)</h3>
          <p className="text-3xl font-bold text-indigo-600">{data.wau.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Weekly active user count
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Monthly Active Users (MAU)</h3>
          <p className="text-3xl font-bold text-indigo-600">{data.mau.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Monthly active user count
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <Line data={userChartData} options={chartOptions} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <Line data={sessionChartData} options={sessionChartOptions} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <Bar data={engagementChartData} options={engagementChartOptions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Platform Distribution</h3>
          <div className="space-y-2">
            {data.platformDistribution.map((item) => (
              <div key={item.platform} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    item.platform === 'iOS' ? 'bg-blue-500' :
                    item.platform === 'Android' ? 'bg-green-500' :
                    item.platform === 'Windows' ? 'bg-purple-500' :
                    item.platform === 'MacOS' ? 'bg-gray-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <span className="text-gray-600">{item.platform}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold">{item.count.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm ml-2">({Math.round(
                    (item.count / data.platformDistribution.reduce((sum, curr) => sum + curr.count, 0)) * 100
                  )}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Device Distribution</h3>
          <div className="space-y-2">
            {data.deviceDistribution.map((item) => (
              <div key={item.device} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    item.device === 'Phone' ? 'bg-blue-500' :
                    item.device === 'Tablet' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}></div>
                  <span className="text-gray-600">{item.device}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold">{item.count.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm ml-2">({Math.round(
                    (item.count / data.deviceDistribution.reduce((sum, curr) => sum + curr.count, 0)) * 100
                  )}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 