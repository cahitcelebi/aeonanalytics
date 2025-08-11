'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface EventsProps {
  gameId: string | null
  dateRange: string
}

interface EventData {
  eventTypes: {
    type: string
    count: number
  }[]
  eventTimeline: {
    date: string
    events: {
      type: string
      count: number
    }[]
  }[]
}

export default function Events({ gameId, dateRange }: EventsProps) {
  const [data, setData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!gameId) return

      try {
        const response = await axios.get(`/api/events?gameId=${gameId}&dateRange=${dateRange}`)
        setData(response.data)
      } catch (err) {
        setError('Failed to load events data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [gameId, dateRange])

  if (loading) {
    return <div className="loading-indicator">Loading events data...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!data) {
    return <div className="info-message">Select a game to view events</div>
  }

  const pieData = {
    labels: data.eventTypes.map(item => item.type),
    datasets: [
      {
        data: data.eventTypes.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
      }
    ]
  }

  const barData = {
    labels: data.eventTimeline.map(item => item.date),
    datasets: data.eventTypes.map((type, index) => ({
      label: type.type,
      data: data.eventTimeline.map(item => 
        item.events.find(e => e.type === type.type)?.count || 0
      ),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
      ][index],
    }))
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Event Distribution</h3>
          <Pie data={pieData} options={chartOptions} />
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Event Timeline</h3>
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Event Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.eventTypes.map((item) => (
                <tr key={item.type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 