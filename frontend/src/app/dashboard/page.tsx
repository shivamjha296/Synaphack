'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OrganizerDashboard from '@/components/dashboards/OrganizerDashboard'
import ParticipantDashboard from '@/components/dashboards/ParticipantDashboard'
import JudgeDashboard from '@/components/dashboards/JudgeDashboard'

interface User {
  email: string
  name: string
  role: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } else {
      router.push('/login')
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Render the appropriate dashboard based on user role
  switch (user.role) {
    case 'organizer':
      return <OrganizerDashboard />
    case 'participant':
      return <ParticipantDashboard />
    case 'judge':
      return <JudgeDashboard />
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Role</h1>
            <p className="text-gray-600 mb-4">Your account role is not recognized.</p>
            <button
              onClick={() => {
                localStorage.removeItem('user')
                router.push('/login')
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      )
  }
}
