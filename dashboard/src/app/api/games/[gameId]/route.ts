import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import api from '@/lib/api'

const JWT_SECRET = process.env.JWT_SECRET || 'aeon-analytics-secret-key'

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
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('JWT decoded successfully:', JSON.stringify(decoded, null, 2))
    
    if (typeof decoded === 'object' && decoded !== null) {
      if ('user' in decoded) {
        console.log('Found user property in token')
        return (decoded as { user: any }).user
      }
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

export async function GET(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    console.log('GET /games/[gameId] - Request received')
    const user = validateToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await api.get(`/games/${params.gameId}`, {
      headers: {
        Authorization: `Bearer ${request.headers.get('authorization')?.split(' ')[1]}`
      }
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    console.log('PUT /games/[gameId] - Request received')
    const user = validateToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const response = await api.put(`/games/${params.gameId}`, body, {
      headers: {
        Authorization: `Bearer ${request.headers.get('authorization')?.split(' ')[1]}`
      }
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    console.log('DELETE /games/[gameId] - Request received')
    const user = validateToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await api.delete(`/games/${params.gameId}`, {
      headers: {
        Authorization: `Bearer ${request.headers.get('authorization')?.split(' ')[1]}`
      }
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 