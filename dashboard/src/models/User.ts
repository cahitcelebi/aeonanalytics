import api from '@/lib/api'

export interface User {
  id: string
  email: string
  username: string
  name: string
  company: string
  createdAt: string
}

export async function getUser(): Promise<User | null> {
  try {
    const response = await api.get('/api/auth/user')
    return response.data
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export async function updateUser(user: Partial<User>): Promise<User | null> {
  try {
    const response = await api.put('/api/auth/user', user)
    return response.data
  } catch (error) {
    console.error('Error updating user:', error)
    return null
  }
} 