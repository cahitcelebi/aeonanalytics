'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface GameMetricsProps {
  onGameSelect: (gameId: string) => void
  selectedGame: string | null
}

interface Game {
  id: string
  name: string
  platform: string
  metrics: {
    dau: number
    mau: number
    wau: number
    sessions: number
    avgSessionDuration: number
  }
}

export default function GameMetrics({ onGameSelect, selectedGame }: GameMetricsProps) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await axios.get('/api/games')
        setGames(response.data)
        if (response.data.length > 0 && !selectedGame) {
          onGameSelect(response.data[0].id)
        }
      } catch (err) {
        setError('Failed to load games')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [onGameSelect, selectedGame])

  if (loading) {
    return <div className="loading-indicator">Loading games...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {games.map((game) => (
        <div
          key={game.id}
          className={`game-card cursor-pointer ${
            selectedGame === game.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onGameSelect(game.id)}
        >
          <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
          <p className="text-gray-600 mb-4">{game.platform}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="metric-card">
              <p className="text-sm text-gray-500">DAU</p>
              <p className="text-2xl font-bold">{game.metrics.dau.toLocaleString()}</p>
            </div>
            <div className="metric-card">
              <p className="text-sm text-gray-500">MAU</p>
              <p className="text-2xl font-bold">{game.metrics.mau.toLocaleString()}</p>
            </div>
            <div className="metric-card">
              <p className="text-sm text-gray-500">Sessions</p>
              <p className="text-2xl font-bold">{game.metrics.sessions.toLocaleString()}</p>
            </div>
            <div className="metric-card">
              <p className="text-sm text-gray-500">Avg. Duration</p>
              <p className="text-2xl font-bold">{game.metrics.avgSessionDuration}m</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 