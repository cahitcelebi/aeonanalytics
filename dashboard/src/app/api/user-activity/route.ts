import { NextResponse } from 'next/server'
import { getDateRange } from '@/utils/date'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')
  const dateRange = searchParams.get('dateRange')

  if (!gameId) {
    return NextResponse.json({ error: 'Game ID is required' }, { status: 400 })
  }

  try {
    // Gerçek API'ye bağlanmaya çalış, başarısız olursa örnek veri kullan
    try {
      const response = await fetch(`http://backend:3001/api/metrics?gameId=${gameId}&dateRange=${dateRange}`, {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.error('Backend API connection failed, using sample data')
    }

    // Örnek veri oluştur
    const { startDate, endDate } = getDateRange(dateRange || '7d')
    const dates = []
    const activeUsers = []
    const sessions = []
    const avgSessionDuration = []
    const newUsers = []
    const userEngagementTime = []
    const sessionFrequency = []

    // Daily active users (DAU)
    const dau = Math.floor(Math.random() * 2000) + 1000
    
    // Weekly active users (WAU)
    const wau = Math.floor(Math.random() * 8000) + 4000
    
    // Monthly active users (MAU)
    const mau = Math.floor(Math.random() * 20000) + 10000

    // Tarih aralığındaki günler için örnek veri oluştur
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      dates.push(dateStr)
      
      // Rastgele değerler oluştur
      const dailyActiveUsers = Math.floor(Math.random() * 1000) + 500
      activeUsers.push(dailyActiveUsers)
      
      const dailySessions = Math.floor(Math.random() * 3000) + 1000
      sessions.push(dailySessions)
      
      avgSessionDuration.push(Math.floor(Math.random() * 10) + 5)
      
      newUsers.push(Math.floor(Math.random() * 300) + 100)
      
      userEngagementTime.push(Math.floor(Math.random() * 15) + 8) // dakika
      
      // Kullanıcı başına ortalama oturum sayısı
      sessionFrequency.push(parseFloat((dailySessions / dailyActiveUsers).toFixed(2)))
      
      // Sonraki güne geç
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Platform ve cihaz dağılımı için örnek veri
    const platformDistribution = [
      { platform: 'iOS', count: Math.floor(Math.random() * 5000) + 3000 },
      { platform: 'Android', count: Math.floor(Math.random() * 8000) + 5000 },
      { platform: 'Windows', count: Math.floor(Math.random() * 3000) + 1000 },
      { platform: 'MacOS', count: Math.floor(Math.random() * 1500) + 500 },
      { platform: 'Web', count: Math.floor(Math.random() * 1000) + 300 }
    ]

    const deviceDistribution = [
      { device: 'Phone', count: Math.floor(Math.random() * 10000) + 5000 },
      { device: 'Tablet', count: Math.floor(Math.random() * 3000) + 1000 },
      { device: 'Desktop', count: Math.floor(Math.random() * 5000) + 2000 }
    ]

    return NextResponse.json({
      dates,
      activeUsers,
      sessions,
      avgSessionDuration,
      platformDistribution,
      deviceDistribution,
      // Yeni metrikler
      dau,
      wau,
      mau,
      newUsers,
      userEngagementTime, 
      sessionFrequency
    })
  } catch (error) {
    console.error('Error fetching user activity data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user activity data' },
      { status: 500 }
    )
  }
} 