"use server"

import NextAuth, { type DefaultSession, NextAuthOptions, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from "axios"

// NextAuth yapılandırması
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Aeon Analytic",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email ve şifre gereklidir")
        }

        try {
          const response = await axios.post(`${process.env.API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password
          })

          if (response.data && response.data.token) {
            // Token'i kullanıcı nesnesi içinde dön
            return {
              id: response.data.userId,
              name: response.data.name,
              email: credentials.email,
              token: response.data.token,
              role: response.data.role,
            } as User
          }
          return null
        } catch (error: any) {
          if (error.response) {
            // API'den dönen hata
            const errorMessage = error.response.data?.message || "Giriş yapılamadı"
            throw new Error(errorMessage)
          }
          throw new Error("Giriş işlemi sırasında bir hata oluştu")
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT, user?: User }) {
      if (user) {
        // User nesnesindeki token ve role bilgisini JWT'ye ekle
        token.token = user.token
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: any, token: JWT }) {
      // Token'dan session'a bilgileri aktar
      session.user.token = token.token
      session.user.role = token.role
      session.user.id = token.id
      
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true",
    signOut: "/login"
  },
  debug: process.env.NODE_ENV === "development",
}

// NextAuth handler
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 