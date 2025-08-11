export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import api from '@/lib/api'

export async function GET(request: Request) {
  try {
    // Extract authorization header
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    // Extract token
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 401 }
      )
    }

    // Verify token format (simple check, backend will do full validation)
    try {
      // Just decode without verification to check format
      jwt.decode(token)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 401 }
      )
    }
    
    try {
      // Use api utility from lib/api.ts
      const response = await api.get('/api/auth/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.data || !response.data.user) {
        return NextResponse.json(
          { success: false, error: 'Invalid user data from authentication service' },
          { status: 500 }
        )
      }

      // Map user information to the correct format
      const userData = {
        id: response.data.user.id,
        name: response.data.user.firstName 
          ? `${response.data.user.firstName} ${response.data.user.lastName || ''}`
          : response.data.user.username,
        email: response.data.user.email,
        company: response.data.user.company || '',
      }

      // Return successful response with user data
      return NextResponse.json({
        success: true,
        user: userData
      })
    } catch (error: any) {
      console.error('Backend API error:', error.message)
      
      // Invalid token or unauthorized
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
      
      // Network errors or other backend issues
      return NextResponse.json(
        { success: false, error: 'Authentication service error' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Auth /me route error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 