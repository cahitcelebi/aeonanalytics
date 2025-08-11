import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import api from '@/lib/api'

const JWT_SECRET = process.env.JWT_SECRET || 'aeon-analytics-secret-key'

// Basit bir token doğrulama fonksiyonu (Daha güvenli bir middleware yapısı daha iyi olur)
const validateToken = (req: Request) => {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No authorization header or not Bearer token')
    return null
  }
  
  const token = authHeader.split(' ')[1]
  if (!token || token.trim() === '') {
    console.log('Empty token provided')
    return null
  }
  
  try {
    // Handle different possible JWT structures
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('JWT decoded successfully:', JSON.stringify(decoded, null, 2))
    
    // Check if the decoded token has user property (typical structure)
    if (typeof decoded === 'object' && decoded !== null) {
      if ('user' in decoded) {
        console.log('Found user property in token')
        return (decoded as { user: any }).user
      }
      // Some JWT implementations put the data directly in the root
      console.log('No user property, returning decoded token directly')
      return decoded
    }
    console.log('Decoded token is not an object:', typeof decoded)
    return null
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export async function GET(request: Request) {
  try {
    console.log('GET /api/games - Request received')
    const user = validateToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await api.get('/games', {
      headers: {
        Authorization: `Bearer ${request.headers.get('authorization')?.split(' ')[1]}`
      }
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/games - Request received')
    const user = validateToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const response = await api.post('/games', body, {
      headers: {
        Authorization: `Bearer ${request.headers.get('authorization')?.split(' ')[1]}`
      }
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// İleride POST (yeni oyun ekleme), PUT (güncelleme), DELETE (silme) metodları da eklenebilir. 
// İleride POST (yeni oyun ekleme), PUT (güncelleme), DELETE (silme) metodları da eklenebilir. 
