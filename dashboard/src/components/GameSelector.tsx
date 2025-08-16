import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { ChevronDown, Gamepad2, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Game {
  id: string
  name: string
  platform?: string
}

interface GameSelectorProps {
  selectedGame: string
  onGameSelect: (gameId: string) => void
  className?: string
}

export const GameSelector = ({ selectedGame, onGameSelect, className }: GameSelectorProps) => {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  // Aktif seçili oyunun adını bul
  const selectedGameName = games.find(game => game.id === selectedGame)?.name || ''

  const fetchGames = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Oturum bilgisi bulunamadı. Lütfen yeniden giriş yapın.')
      }

      const response = await axios.get('/games', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (Array.isArray(response.data)) {
        setGames(response.data)
        if (!selectedGame && response.data.length > 0) {
          onGameSelect(response.data[0].id)
        }
      } else {
        console.error('Invalid data format received from /games:', response.data)
        setError('Oyunlar yüklenirken geçersiz veri formatı alındı.')
        setGames([])
      }
    } catch (error: any) {
      console.error('Error fetching games:', error)
      setError(error.message || 'Oyunlar yüklenemedi.')
      
      // Oturum hatası varsa kullanıcıyı login sayfasına yönlendir
      if (error.message?.includes('Oturum bilgisi bulunamadı') || 
          error.response?.status === 401 || 
          error.response?.status === 403) {
        toast.error('Oturumunuz sona ermiş. Lütfen yeniden giriş yapın.')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedGame, onGameSelect, router])

  // Dışarıya tıklama kontrolü
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    fetchGames()

    const handleFocus = () => {
      fetchGames()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchGames])

  // Filtrelenmiş oyunlar
  const filteredGames = searchQuery.trim() === '' 
    ? games 
    : games.filter(game => game.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Platform ikonu
  const getPlatformIcon = (platform?: string) => {
    return <Gamepad2 className="h-4 w-4 text-gray-400" />
  }

  // Yeniden yükleme işlevi
  const handleRetry = () => {
    fetchGames()
  }

  if (loading) {
    return (
      <div className={cn("flex items-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm w-64 px-3 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300", className)}>
        <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" />
        <span className="text-sm">Oyunlar yükleniyor...</span>
      </div>
    )
  }
  
  if (error) {
    const isAuthError = error.includes('Oturum bilgisi bulunamadı') || error.includes('token')
    
    return (
      <div className={cn(
        "flex flex-col rounded-md border shadow-sm w-64 p-3 gap-2",
        isAuthError 
          ? "border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-400" 
          : "border-red-300 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400", 
        className
      )}>
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm truncate font-medium">{error}</span>
        </div>
        
        <button
          onClick={handleRetry}
          className={cn(
            "flex items-center justify-center gap-1 text-xs py-1 px-2 rounded-md transition-colors",
            isAuthError 
              ? "bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-800/30 dark:hover:bg-orange-800/50 dark:text-orange-400"
              : "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800/30 dark:hover:bg-red-800/50 dark:text-red-400"
          )}
        >
          <RefreshCw className="h-3 w-3" />
          Yeniden Dene
        </button>
        
        {isAuthError && (
          <button
            onClick={() => router.push('/login')}
            className="flex items-center justify-center gap-1 text-xs py-1 px-2 rounded-md transition-colors bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-800/30 dark:hover:bg-blue-800/50 dark:text-blue-400"
          >
            Giriş Yap
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative w-64", className)} ref={dropdownRef}>
      {/* Seçici buton */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={games.length === 0}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-750",
          games.length === 0 && "opacity-60 cursor-not-allowed"
        )}
      >
        <div className="flex items-center overflow-hidden">
          {selectedGameName ? (
            <>
              <Gamepad2 className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              <span className="truncate text-sm">{selectedGameName}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {games.length === 0 ? 'Oyun bulunamadı' : 'Oyun Seçin'}
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menüsü */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700">
          {/* Arama kutusu */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Oyun ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Oyun listesi */}
          <ul className="max-h-60 overflow-auto py-2">
            {filteredGames.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                Sonuç bulunamadı
              </li>
            ) : (
              filteredGames.map((game) => (
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onGameSelect(game.id)
                      setIsOpen(false)
                      setSearchQuery('')
                    }}
                    className={cn(
                      "flex w-full items-center px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700",
                      selectedGame === game.id && "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    )}
                  >
                    {getPlatformIcon(game.platform)}
                    <span className="ml-2 truncate">{game.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          
          {/* Alt bilgi */}
          <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {filteredGames.length} oyun listeleniyor
          </div>
        </div>
      )}
    </div>
  )
} 