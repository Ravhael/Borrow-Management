import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      name: string
      phone?: string | null
      email: string
      role?: any
      directorate?: any
      entitas?: any
      isActive: boolean
    }
  }

  interface User {
    id: string
    username: string
    name: string
    phone?: string | null
    email: string
    role?: any
    directorate?: any
    entitas?: any
    isActive: boolean
  }

  interface JWT {
    role?: any
    directorate?: any
    entitas?: any
    phone?: string | null
    isActive: boolean
  }
}