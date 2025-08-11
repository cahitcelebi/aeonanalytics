import jwt, { SignOptions } from 'jsonwebtoken'

// JWT secret key (should match the one in the login route)
const JWT_SECRET = process.env.JWT_SECRET || 'aeon-analytics-secure-secret-key-123'

interface User {
  id: string
  email: string
  username?: string
  name?: string
  company?: string
}

interface DecodedToken {
  user: User
  iat?: number
  exp?: number
}

/**
 * Verify a JWT token and return the decoded payload
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Generate a JWT token for a user
 * @param user The user object to encode in the token
 * @param expiresIn Token expiration time (default: 1 day)
 * @returns The generated JWT token
 */
export function generateToken(user: User, expiresIn: SignOptions['expiresIn'] = '1d'): string {
  const payload = {
    user: {
      id: user.id,
      email: user.email,
      ...(user.username && { username: user.username }),
      ...(user.name && { name: user.name }),
      ...(user.company && { company: user.company })
    }
  }
  
  const options: SignOptions = { expiresIn }
  return jwt.sign(payload, JWT_SECRET, options)
} 