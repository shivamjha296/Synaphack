'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EventCommunication from '../EventCommunication'
import { Event } from '../../lib/eventService'

interface User {
  email: string
  name: string
  role: string
}

const JudgeDashboard = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCommunication, setShowCommunication] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === 'judge') {
        setUser(parsedUser)
        loadOngoingEvents()
      } else {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const loadOngoingEvents = async () => {
    try {
      const { eventService } = await import('../../lib/eventService')
      const allEvents = await eventService.getPublishedEvents()
      // Filter for ongoing events where judges can participate
      const ongoingEvents = allEvents.filter(event => 
        event.status === 'ongoing' || event.status === 'published'
      )
      setEvents(ongoingEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const { authService } = await import('../../lib/authService')
      await authService.signOut()
      localStorage.removeItem('user')
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Fallback: just clear localStorage and redirect
      localStorage.removeItem('user')
      router.push('/')
    }
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
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-400">
                HackPlatform
              </Link>
              <span className="ml-4 px-2 py-1 bg-purple-900/30 text-purple-400 text-sm rounded-full">
                Judge
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-300">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100"
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Judge Dashboard
          </h1>
          <p className="text-slate-300">
            Review submissions, score projects, and provide valuable feedback to participants.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Events to Judge</p>
                <p className="text-2xl font-bold text-slate-100">3</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Projects Reviewed</p>
                <p className="text-2xl font-bold text-slate-100">27</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <div className="w-6 h-6 bg-purple-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Pending Reviews</p>
                <p className="text-2xl font-bold text-slate-100">8</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-900/30 rounded-lg">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Average Score</p>
                <p className="text-2xl font-bold text-slate-100">8.3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Review Projects</h3>
              <p className="text-slate-400 text-sm mb-4">
                Evaluate and score submitted projects
              </p>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                Start Reviewing
              </button>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-green-500 transition-colors cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">My Events</h3>
              <p className="text-slate-400 text-sm mb-4">
                View events you&apos;re assigned to judge
              </p>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                View Events
              </button>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition-colors cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Scoring History</h3>
              <p className="text-slate-400 text-sm mb-4">
                Review your past evaluations and scores
              </p>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700">
                View History
              </button>
            </div>
          </div>
        </div>

        {/* Events Available for Judging */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Events Available for Judging</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-slate-400">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-400">
                <div className="w-12 h-12 bg-slate-600 rounded-lg mx-auto mb-4"></div>
                <p>No events available for judging at the moment</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div key={event.id} className="border border-slate-700 rounded-lg bg-slate-700/50 p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-xl text-slate-100">{event.title}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      event.status === 'ongoing' ? 'bg-green-900/30 text-green-400 border border-green-600' :
                      'bg-blue-900/30 text-blue-400 border border-blue-600'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-300 mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm text-slate-400">
                    <div className="flex justify-between">
                      <span>Theme:</span>
                      <span className="text-slate-300">{event.theme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Organizer:</span>
                      <span className="text-blue-400">{event.organizerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Event Date:</span>
                      <span className="text-slate-300">{new Date(event.timeline.eventStart).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-600">
                    <button 
                      onClick={() => setShowCommunication(event.id!)}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                    >
                      💬 Join Discussion
                    </button>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      onClick={() => router.push(`/dashboard/judge/submissions/${event.id}`)}
                    >
                      View Submissions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Reviews */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Pending Reviews</h2>
          <div className="space-y-4">
            {[
              { 
                project: 'AI-Powered Healthcare Assistant', 
                team: 'MedTech Innovators', 
                event: 'AI Innovation Challenge',
                submitted: '2 hours ago',
                priority: 'High'
              },
              { 
                project: 'Blockchain Voting System', 
                team: 'Crypto Democrats', 
                event: 'Blockchain Hackathon',
                submitted: '1 day ago',
                priority: 'Medium'
              },
              { 
                project: 'Smart Waste Management', 
                team: 'Green Solutions', 
                event: 'Green Tech Challenge',
                submitted: '3 days ago',
                priority: 'Low'
              },
            ].map((review, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-slate-600 bg-slate-700 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-100">{review.project}</h3>
                  <p className="text-sm text-slate-400">
                    Team: {review.team} • Event: {review.event} • Submitted: {review.submitted}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full border ${
                    review.priority === 'High' ? 'bg-red-900/30 text-red-400 border-red-600' :
                    review.priority === 'Medium' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-600' :
                    'bg-green-900/30 text-green-400 border-green-600'
                  }`}>
                    {review.priority} Priority
                  </span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                    Review Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Recent Evaluations</h2>
          <div className="space-y-3">
            {[
              { project: 'Smart City Traffic Optimizer', score: 9.2, date: '2 hours ago' },
              { project: 'Mental Health Chatbot', score: 8.7, date: '1 day ago' },
              { project: 'Renewable Energy Monitor', score: 8.9, date: '2 days ago' },
              { project: 'Food Waste Reduction App', score: 7.8, date: '3 days ago' },
            ].map((evaluation, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-slate-600 last:border-b-0">
                <div>
                  <span className="font-medium text-slate-100">{evaluation.project}</span>
                  <span className="text-sm text-slate-400 ml-2">• {evaluation.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-blue-400">{evaluation.score}/10</span>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Communication Modal */}
      {showCommunication && user && (
        <EventCommunication
          eventId={showCommunication}
          userId={user.email}
          userName={user.name}
          userRole="judge"
          onClose={() => setShowCommunication(null)}
        />
      )}
    </div>
  )
}

export default JudgeDashboard
