import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import type { AxiosError } from 'axios'

interface SignupRequest {
  name: string
  email: string
  password: string
  companyName: string
}

interface SignupResponse {
  success: boolean
  user?: {
    id: string
    name: string
    email: string
    companyName: string
    role: string
  }
  token?: string
  error?: string
}

interface BackendUser {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  company?: string
}

interface BackendResponse {
  user: BackendUser
  token: string
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, companyName } = await req.json()
    console.log('Signup API route called with:', { name, email, companyName })
    
    // Validation
    if (!name || !email || !password || !companyName) {
      return NextResponse.json<SignupResponse>(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Email validation (basic format check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json<SignupResponse>(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json<SignupResponse>(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Get backend URL from environment variables
    const backendUrl = process.env.BACKEND_URL || 'http://backend:3001'
    console.log('Using backend URL:', backendUrl)
    
    try {
      console.log(`Signing up user with email: ${email}`);
      console.log(`Using backend URL: ${backendUrl}`);
      
      // Direct request to backend with absolute URL
      const response = await axios.post<BackendResponse>(`${backendUrl}/api/auth/signup`, {
        name,
        email,
        password,
        companyName
      })

      console.log('Backend signup response:', response.data)

      // Map user data to expected format
      const userData = {
        id: response.data.user.id,
        name: name,
        email: response.data.user.email,
        companyName: companyName,
        role: 'developer' // Default value if not provided by backend
      }

      // Successful response from backend
      return NextResponse.json<SignupResponse>({
        success: true,
        user: userData,
        token: response.data.token
      })
    } catch (error) {
      const axiosError = error as AxiosError<{message: string}>
      console.error('Backend API error:', axiosError.message)
      console.error('Error details:', axiosError.response?.data || 'No response data')
      
      // Network error - provide more information about Docker connection issues
      if (axiosError.message === 'Network Error' || !axiosError.response) {
        return NextResponse.json<SignupResponse>(
          { 
            success: false, 
            error: `Could not connect to authentication service at ${backendUrl}. Please check Docker container network and backend service.` 
          },
          { status: 500 }
        )
      }
      
      // Email already exists error
      if (axiosError.response?.status === 409) {
        return NextResponse.json<SignupResponse>(
          { 
            success: false, 
            error: 'An account with this email already exists' 
          },
          { status: 409 }
        )
      }
      
      // Forward error messages from backend
      if (axiosError.response) {
        const errorMessage = (axiosError.response.data as any)?.message || 'Signup failed'
        return NextResponse.json<SignupResponse>(
          { 
            success: false, 
            error: errorMessage
          },
          { status: axiosError.response.status }
        )
      }

      // Other errors
      return NextResponse.json<SignupResponse>(
        { 
          success: false, 
          error: 'Authentication service error' 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Signup route error:', error)
    return NextResponse.json<SignupResponse>(
      { 
        success: false, 
        error: 'Internal server error: ' + ((error as Error)?.message || 'Unknown error')
      },
      { status: 500 }
    )
  }
} 