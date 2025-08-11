'use client'

import React from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'react-hot-toast'

export default function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthProvider>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gray-100">
          {children}
        </div>
      </AuthProvider>
    </>
  )
} 