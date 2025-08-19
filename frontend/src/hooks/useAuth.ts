import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { authService, UserData } from '@/lib/authService'

export const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('user')
      }
    }

    // Listen to auth state changes
    const unsubscribe = authService.onAuthStateChanged((firebaseUser: User | null) => {
      if (!firebaseUser) {
        // User signed out
        setUser(null)
        localStorage.removeItem('user')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await authService.signOut()
      setUser(null)
      localStorage.removeItem('user')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user
  }
}
