'use client'

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface User {
  id: string
  name: string
  email: string
  username?: string
  company?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string, company?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => ({ success: false, error: 'Not initialized' }),
  register: async () => ({ success: false, error: 'Not initialized' }),
  logout: () => {},
  loading: true,
  error: null
})

// Mock user data for development
const MOCK_USERS = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password', // In a real app, passwords would be hashed
    companyName: 'Demo Company',
    role: 'admin'
  }
]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUserLoggedIn()
  }, [])

  const checkUserLoggedIn = async () => {
    setLoading(true)
    try {
      // Check if we're on the client side before accessing localStorage
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        if (token) {
          const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          if (res.data.user) {
            setUser(res.data.user)
          } else {
            localStorage.removeItem('token')
            router.push('/login')
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      console.log('Attempting login request to:', loginUrl);
      const res = await axios.post(loginUrl, { email, password })
      if (res.data.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', res.data.token)
        }
        setUser(res.data.user)
        router.push('/dashboard')
        return { success: true }
      } else {
        // Bu durum normalde olmamalı, token yoksa hata döner
        return { success: false, error: 'Login failed: No token received' }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.'
      setError(errorMessage)
      console.error('Login error:', error)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string, company?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    setError(null)
    try {
      const registerUrl = `${API_BASE_URL}/api/auth/signup`;
      console.log('Attempting register request to:', registerUrl);
      const res = await axios.post(registerUrl, { name, email, password, companyName: company })
      // Başarılı kayıt sonrası token veya kullanıcı bilgisi dönmeyebilir,
      // sadece success durumu yeterli olabilir.
      if (res.data.success) {
         return { success: true }
      } else {
         // API'den hata mesajı gelirse onu kullanalım
         return { success: false, error: res.data.error || 'Registration failed' }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.'
      setError(errorMessage)
      console.error('Registration error:', error)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext 