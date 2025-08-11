import { NextResponse } from 'next/server'
import { getDateRange } from '@/utils/date'
import api from '@/lib/api'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to validate the token
const validateToken = async (request: Request) => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    return decoded.id
  } catch (error) {
    console.error('Token validation error:', error)
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')
  const dateRange = searchParams.get('dateRange')

  if (!gameId) {
    return NextResponse.json({ error: 'Game ID is required' }, { status: 400 })
  }

  // Validate the user is authorized
  const userId = await validateToken(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { startDate, endDate } = getDateRange(dateRange || '7d')
    
    // Fetch events data from backend API
    const response = await api.get(`/api/events`, {
      params: {
        gameId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })
    
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Error fetching events:', error.message || error)
    
    // Check for specific error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status || 500
      const message = error.response.data?.message || 'Failed to fetch events data'
      
      return NextResponse.json(
        { error: message },
        { status }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch events data' },
      { status: 500 }
    )
  }
} 