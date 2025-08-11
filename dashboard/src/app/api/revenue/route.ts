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
      const response = await fetch(`http://backend:3001/api/revenue?gameId=${gameId}&dateRange=${dateRange}`, {
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
    const revenue = []
    const iap = []
    const ads = []

    // Tarih aralığındaki günler için örnek veri oluştur
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      dates.push(dateStr)
      
      // Önce IAP ve ad gelirlerini oluştur
      const iapValue = Math.floor(Math.random() * 5000) + 1000
      const adValue = Math.floor(Math.random() * 2000) + 500
      
      // Toplam gelir, IAP + ads
      const revValue = iapValue + adValue
      
      iap.push(iapValue)
      ads.push(adValue)
      revenue.push(revValue)
      
      // Sonraki güne geç
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Ülkelere göre gelir dağılımı için örnek veri
    const revenueByCountry = [
      { country: 'United States', revenue: Math.floor(Math.random() * 50000) + 20000 },
      { country: 'Japan', revenue: Math.floor(Math.random() * 30000) + 15000 },
      { country: 'Germany', revenue: Math.floor(Math.random() * 20000) + 10000 },
      { country: 'United Kingdom', revenue: Math.floor(Math.random() * 15000) + 8000 },
      { country: 'China', revenue: Math.floor(Math.random() * 25000) + 12000 },
      { country: 'Brazil', revenue: Math.floor(Math.random() * 10000) + 5000 },
      { country: 'France', revenue: Math.floor(Math.random() * 12000) + 6000 },
      { country: 'South Korea', revenue: Math.floor(Math.random() * 18000) + 9000 },
      { country: 'Canada', revenue: Math.floor(Math.random() * 10000) + 5000 },
      { country: 'Australia', revenue: Math.floor(Math.random() * 8000) + 4000 }
    ]

    return NextResponse.json({
      dates,
      revenue,
      iap,
      ads,
      revenueByCountry
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
} 