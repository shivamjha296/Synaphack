'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  email: string
  name: string
  role: string
}

const JudgeDashboard = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === 'judge') {
        setUser(parsedUser)
      } else {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Build2Skill
              </Link>
              <span className="ml-4 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                Judge
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Judge Dashboard
          </h1>
          <p className="text-gray-600">
            Evaluate projects, provide feedback, and help select winners.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Events Judging</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projects Reviewed</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 bg-yellow-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Score Given</p>
                <p className="text-2xl font-bold text-gray-900">7.8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Projects</h3>
              <p className="text-gray-600 text-sm mb-4">
                Evaluate submitted projects and provide detailed feedback
              </p>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                Start Reviewing
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scoring Rubric</h3>
              <p className="text-gray-600 text-sm mb-4">
                View and understand the evaluation criteria for events
              </p>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                View Rubrics
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Judge Panel</h3>
              <p className="text-gray-600 text-sm mb-4">
                Collaborate with other judges and discuss evaluations
              </p>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700">
                Join Discussion
              </button>
            </div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Reviews</h2>
          <div className="space-y-4">
            {[
              { 
                project: 'AI-Powered Healthcare App', 
                event: 'AI Innovation Challenge', 
                team: 'Team Alpha',
                submitted: '2 hours ago',
                priority: 'High'
              },
              { 
                project: 'Blockchain Voting System', 
                event: 'Blockchain Hackathon', 
                team: 'CryptoDevs',
                submitted: '5 hours ago',
                priority: 'Medium'
              },
              { 
                project: 'Smart Energy Monitor', 
                event: 'Green Tech Challenge', 
                team: 'EcoTech',
                submitted: '1 day ago',
                priority: 'Low'
              },
            ].map((review, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{review.project}</h3>
                  <p className="text-sm text-gray-600">
                    Event: {review.event} • Team: {review.team} • Submitted: {review.submitted}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    review.priority === 'High' ? 'bg-red-100 text-red-800' :
                    review.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {review.priority} Priority
                  </span>
                  <button className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700">
                    Review Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Evaluations</h2>
          <div className="space-y-4">
            {[
              { 
                project: 'Social Media Analytics Tool', 
                event: 'Data Science Challenge', 
                score: 8.5,
                feedback: 'Excellent implementation with great UI/UX',
                date: 'Yesterday'
              },
              { 
                project: 'AR Shopping Experience', 
                event: 'Mobile App Challenge', 
                score: 7.2,
                feedback: 'Good concept but needs technical improvements',
                date: '2 days ago'
              },
              { 
                project: 'IoT Home Security System', 
                event: 'IoT Innovation Hack', 
                score: 9.1,
                feedback: 'Outstanding project with real-world applicability',
                date: '3 days ago'
              },
            ].map((evaluation, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{evaluation.project}</h3>
                  <span className="text-lg font-bold text-blue-600">{evaluation.score}/10</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">Event: {evaluation.event}</p>
                <p className="text-sm text-gray-700 mb-2">"{evaluation.feedback}"</p>
                <p className="text-xs text-gray-500">Evaluated {evaluation.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JudgeDashboard
