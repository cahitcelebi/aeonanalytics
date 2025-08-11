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
      const response = await fetch(`http://backend:3001/api/retention?gameId=${gameId}&dateRange=${dateRange}`, {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const backendData = await response.json();
        // Eğer backend'den array geliyorsa, frontend'in beklediği formata dönüştür
        if (Array.isArray(backendData)) {
          const dates = backendData.map(row => row.date)
          const dayOneRetention = backendData.map(row => row.day1)
          const dayTwoRetention = backendData.map(row => row.day2)
          const dayThreeRetention = backendData.map(row => row.day3)
          const dayFourRetention = backendData.map(row => row.day4)
          const dayFiveRetention = backendData.map(row => row.day5)
          const daySixRetention = backendData.map(row => row.day6)
          const daySevenRetention = backendData.map(row => row.day7)
          const dayFifteenRetention = backendData.map(row => row.day15)
          const dayThirtyRetention = backendData.map(row => row.day30)
          const cohorts = backendData.map(row => ({
            date: row.date,
            day1: row.day1,
            day2: row.day2,
            day3: row.day3,
            day4: row.day4,
            day5: row.day5,
            day6: row.day6,
            day7: row.day7,
            day15: row.day15,
            day30: row.day30
          }))
          return NextResponse.json({ dates, dayOneRetention, dayTwoRetention, dayThreeRetention, dayFourRetention, dayFiveRetention, daySixRetention, daySevenRetention, dayFifteenRetention, dayThirtyRetention, cohorts })
        }
        // Eski format gelirse olduğu gibi dön
        return NextResponse.json(backendData)
      }
    } catch (error) {
      console.error('Backend API connection failed, using sample data')
    }

    // Örnek veri oluştur
    const { startDate, endDate } = getDateRange(dateRange || '7d')
    const dates = []
    const dayOneRetention = []
    const dayTwoRetention = []
    const dayThreeRetention = []
    const dayFourRetention = []
    const dayFiveRetention = []
    const daySixRetention = []
    const daySevenRetention = []
    const dayFifteenRetention = []
    const dayThirtyRetention = []
    const cohorts = []

    // Tarih aralığındaki günler için örnek veri oluştur
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      dates.push(dateStr)
      
      // Günlük retention verilerini oluştur (yüzde olarak)
      dayOneRetention.push(Math.floor(Math.random() * 30) + 40) // 40-70%
      dayTwoRetention.push(Math.floor(Math.random() * 30) + 40) // 40-70%
      dayThreeRetention.push(Math.floor(Math.random() * 30) + 40) // 40-70%
      dayFourRetention.push(Math.floor(Math.random() * 30) + 40) // 40-70%
      dayFiveRetention.push(Math.floor(Math.random() * 30) + 40) // 40-70%
      daySixRetention.push(Math.floor(Math.random() * 30) + 40) // 40-70%
      daySevenRetention.push(Math.floor(Math.random() * 25) + 20) // 20-45%
      dayFifteenRetention.push(Math.floor(Math.random() * 15) + 5)  // 5-20%
      dayThirtyRetention.push(Math.floor(Math.random() * 15) + 5)  // 5-20%
      
      // Cohort verileri
      cohorts.push({
        date: dateStr,
        day1: Math.floor(Math.random() * 30) + 40, // 40-70%
        day2: Math.floor(Math.random() * 30) + 40, // 40-70%
        day3: Math.floor(Math.random() * 30) + 40, // 40-70%
        day4: Math.floor(Math.random() * 30) + 40, // 40-70%
        day5: Math.floor(Math.random() * 30) + 40, // 40-70%
        day6: Math.floor(Math.random() * 30) + 40, // 40-70%
        day7: Math.floor(Math.random() * 25) + 20, // 20-45%
        day15: Math.floor(Math.random() * 15) + 5,  // 5-20%
        day30: Math.floor(Math.random() * 15) + 5  // 5-20%
      })
      
      // Sonraki güne geç
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json({
      dates,
      dayOneRetention,
      dayTwoRetention,
      dayThreeRetention,
      dayFourRetention,
      dayFiveRetention,
      daySixRetention,
      daySevenRetention,
      dayFifteenRetention,
      dayThirtyRetention,
      cohorts
    })
  } catch (error) {
    console.error('Error fetching retention data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch retention data' },
      { status: 500 }
    )
  }
} 