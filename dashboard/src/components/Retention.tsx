'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface RetentionProps {
  gameId: string | null
  dateRange: string
}

interface RetentionData {
  dates: string[]
  dayOneRetention: number[]
  daySevenRetention: number[]
  dayThirtyRetention: number[]
  cohorts: {
    date: string
    day1: number
    day7: number
    day30: number
  }[]
}

export default function Retention({ gameId, dateRange }: RetentionProps) {
  const [data, setData] = useState<RetentionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!gameId) return

      try {
        const response = await axios.get(`/api/retention?gameId=${gameId}&dateRange=${dateRange}`)
        setData(response.data)
      } catch (err) {
        setError('Failed to load retention data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [gameId, dateRange])

  if (loading) {
    return <div className="loading-indicator">Loading retention data...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!data) {
    return <div className="info-message">Select a game to view retention</div>
  }

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Day 1 Retention',
        data: data.dayOneRetention,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Day 7 Retention',
        data: data.daySevenRetention,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Day 30 Retention',
        data: data.dayThirtyRetention,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
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
        text: 'User Retention Rate (%)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(tickValue: string | number) {
            return tickValue + '%'
          }
        }
      }
    }
  }

  // Dinamik olarak hangi dayX kolonları varsa onları bul
  const dayKeys = data.cohorts.length > 0
    ? Object.keys(data.cohorts[0]).filter(k => k.startsWith('day'))
    : [];

  return (
    <div className="space-y-8">
      <div className="bg-white p-4 rounded-lg shadow">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Retention by Cohort</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cohort Date
                </th>
                {dayKeys.map(dayKey => (
                  <th key={dayKey} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {dayKey.replace('day', 'Day ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.cohorts.map((cohort) => (
                <tr key={cohort.date}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cohort.date}
                  </td>
                  {dayKeys.map(dayKey => {
                    const value = cohort[dayKey as keyof typeof cohort];
                    console.log('Tabloya yazılan:', dayKey, value, typeof value);
                    return (
                      <td key={dayKey} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {value != null ? Number(value) + '%' : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 