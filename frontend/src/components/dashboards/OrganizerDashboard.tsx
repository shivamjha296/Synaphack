'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CreateEventForm from '../CreateEventForm'
import EventCommunication from '../EventCommunication'
import SubmissionViewer from '../SubmissionViewer'
import CertificateManager from '../CertificateManager'
import JudgeInviteModal from '../JudgeInviteModal'
import { Event } from '../../lib/eventService'

interface User {
  uid?: string
  email: string
  name: string
  role: string
}

const OrganizerDashboard = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventParticipants, setEventParticipants] = useState<{ [eventId: string]: any[] }>({})
  const [showParticipants, setShowParticipants] = useState<string | null>(null)
  const [participantsLoading, setParticipantsLoading] = useState<string | null>(null)
  const [showCommunication, setShowCommunication] = useState<string | null>(null)
  const [showSubmissions, setShowSubmissions] = useState<Event | null>(null)
  const [showCertificates, setShowCertificates] = useState<Event | null>(null)
  const [showJudgeInvite, setShowJudgeInvite] = useState<Event | null>(null)

  useEffect(() => {
    // Check if user is logged in and ensure Firebase auth state
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === 'organizer') {
        setUser(parsedUser)
        // Ensure Firebase auth state is maintained
        maintainFirebaseAuth(parsedUser)
      } else {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const maintainFirebaseAuth = async (user: any) => {
    try {
      const { onAuthStateChanged } = await import('firebase/auth')
      const { auth } = await import('../../lib/firebase')
      
      // Check if user is already authenticated
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) {
          // User not authenticated with Firebase, redirect to login
          console.warn('User not authenticated with Firebase, redirecting to login')
          localStorage.removeItem('user')
          router.push('/login')
        }
      })
      
      return unsubscribe
    } catch (error) {
      console.error('Error checking Firebase auth:', error)
    }
  }

  // Load events when user is set
  useEffect(() => {
    if (user) {
      loadEvents()
    }
  }, [user])

  const loadEvents = async () => {
    if (!user) return
    
    console.log('OrganizerDashboard: Loading events for user:', user)
    console.log('OrganizerDashboard: Using organizerId:', user.uid || user.email)
    
    try {
      const { eventService } = await import('../../lib/eventService')
      // Only load events created by this organizer
      const organizerEvents = await eventService.getEventsByOrganizer(user.uid || user.email)
      console.log('OrganizerDashboard: Loaded events:', organizerEvents.length)
      
      // TEMPORARY: Also load all events to see if there are any events at all
      const allEvents = await eventService.getAllEvents()
      console.log('OrganizerDashboard: Total events in database:', allEvents.length)
      
      setEvents(organizerEvents)
      // Load participant counts for organizer's events only
      for (const event of organizerEvents) {
        if (event.id) {
          loadEventParticipants(event.id)
        }
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEventParticipants = async (eventId: string) => {
    try {
      const { eventService } = await import('../../lib/eventService')
      const participants = await eventService.getEventParticipants(eventId)
      setEventParticipants(prev => ({
        ...prev,
        [eventId]: participants
      }))
    } catch (error) {
      console.error('Error loading event participants:', error)
    }
  }

  const handleViewParticipants = async (eventId: string) => {
    setParticipantsLoading(eventId)
    if (!eventParticipants[eventId]) {
      await loadEventParticipants(eventId)
    }
    setShowParticipants(eventId)
    setParticipantsLoading(null)
  }

  const handleInitializeCommunication = async (eventId: string) => {
    try {
      const { communicationService } = await import('../../lib/communicationService')
      await communicationService.initializeEventCommunication(eventId, user?.uid || user?.email || '')
      setShowCommunication(eventId)
    } catch (error) {
      console.error('Error initializing communication:', error)
      // Show communication even if initialization fails (channels might already exist)
      setShowCommunication(eventId)
    }
  }

  const exportParticipantsToCSV = (eventId: string) => {
    const participants = eventParticipants[eventId] || []
    const event = events.find(e => e.id === eventId)
    
    if (participants.length === 0) {
      alert('No participants to export')
      return
    }

    // Define CSV headers
    const headers = [
      'Name', 'Email', 'Phone', 'College', 'Course', 'Year', 'Experience',
      'Skills', 'GitHub', 'LinkedIn', 'Portfolio', 'Bio',
      'Team Name', 'Team Members', 'Registration Date', 'Status', 'Payment Status'
    ]

    // Convert participants to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...participants.map(participant => {
        const skills = (participant.participantSkills || participant.userProfile?.skills || []).join(';')
        const teamMembers = participant.teamMembers ? 
          participant.teamMembers.map((m: any) => `${m.name} (${m.email})`).join(';') : ''
        
        return [
          `"${participant.userProfile?.name || participant.participantName || ''}"`,
          `"${participant.participantEmail || ''}"`,
          `"${participant.participantPhone || participant.userProfile?.phone || ''}"`,
          `"${participant.participantCollege || participant.userProfile?.college || ''}"`,
          `"${participant.participantCourse || participant.userProfile?.course || ''}"`,
          `"${participant.participantYear || participant.userProfile?.year || ''}"`,
          `"${participant.participantExperience || participant.userProfile?.experience || ''}"`,
          `"${skills}"`,
          `"${participant.participantGithub || participant.userProfile?.github || ''}"`,
          `"${participant.participantLinkedin || participant.userProfile?.linkedin || ''}"`,
          `"${participant.participantPortfolio || participant.userProfile?.portfolio || ''}"`,
          `"${participant.participantBio || participant.userProfile?.bio || ''}"`,
          `"${participant.teamName || ''}"`,
          `"${teamMembers}"`,
          `"${new Date(participant.registrationDate).toLocaleDateString()}"`,
          `"${participant.status}"`,
          `"${participant.paymentStatus}"`
        ].join(',')
      })
    ]

    // Create and download CSV file
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${event?.title.replace(/[^a-z0-9]/gi, '_')}_participants_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleEventCreated = () => {
    setShowCreateForm(false)
    setEditingEvent(null)
    loadEvents()
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setShowCreateForm(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { eventService } = await import('../../lib/eventService')
      await eventService.deleteEvent(eventId)
      setShowDeleteConfirm(null)
      loadEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event. Please try again.')
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
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-green-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400 mx-auto"></div>
          <p className="mt-4 text-green-300 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-green-950">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-black/95 via-slate-900/95 to-green-950/95 backdrop-blur-sm shadow-lg border-b border-green-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-400 drop-shadow-[0_0_10px_rgb(34,197,94)]">
                HackPlatform
              </Link>
              <span className="ml-4 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-sm rounded-full border border-green-400 drop-shadow-[0_0_8px_rgb(34,197,94)]">
                Organizer
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-green-200 font-medium">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-green-300 hover:text-white transition-colors"
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
        <div className="bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 mb-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Organizer Dashboard
          </h1>
          <p className="text-green-200 font-medium">
            Manage your hackathons, track participants, and oversee events.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-300">Total Events</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">{events.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-300">Active Events</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">
                  {events.filter(e => e.status === 'ongoing' || e.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-300">Total Participants</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">
                  {events.reduce((sum, event) => sum + (event.currentParticipants || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg shadow-lg">
                <div className="w-6 h-6 bg-white rounded shadow-sm"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-300">Submissions</p>
                <p className="text-2xl font-bold text-white drop-shadow-md">89</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 hover:border-green-400 hover:shadow-2xl transition-all cursor-pointer group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Create Event</h3>
              <p className="text-green-200 text-sm mb-4">
                Start organizing a new hackathon or coding competition
              </p>
              <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all font-medium shadow-lg hover:shadow-xl">
                Create New Event
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 hover:border-emerald-400 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Manage Events</h3>
              <p className="text-green-200 text-sm mb-4">
                View and edit your existing events and their settings
              </p>
              <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2 px-4 rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all font-medium shadow-lg hover:shadow-xl">
                Manage Events
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 hover:border-purple-400 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">View Analytics</h3>
              <p className="text-green-200 text-sm mb-4">
                Track event performance and participant engagement
              </p>
              <button className="w-full bg-gradient-to-r from-purple-500 to-violet-500 text-white py-2 px-4 rounded-lg hover:from-purple-400 hover:to-violet-400 transition-all font-medium shadow-lg hover:shadow-xl">
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* My Events */}
        <div className="bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white drop-shadow-lg">My Events</h2>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              + Create Event
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-2 text-green-200">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg mx-auto mb-4 flex items-center justify-center shadow-lg">
                <div className="w-8 h-8 bg-white rounded"></div>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No events yet</h3>
              <p className="text-green-200 mb-4">Create your first hackathon to get started</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all font-medium shadow-lg hover:shadow-xl"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.id} className="border border-green-500/30 rounded-xl bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-200 overflow-hidden shadow-xl hover:shadow-2xl">
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="font-semibold text-xl text-white leading-tight mb-2 drop-shadow-lg">{event.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-200">
                          Created: {new Date(event.createdAt).toLocaleDateString()}
                        </span>
                        {event.rounds && event.rounds.length > 0 && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg text-xs font-medium">
                            {event.rounds.length} Rounds
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-green-200 mb-4 line-clamp-2">{event.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded-md text-xs font-medium">{event.theme}</span>
                        <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded-md text-xs font-medium">{event.eventType}</span>
                        {event.registrationFee === 0 && (
                          <span className="px-2 py-1 bg-gradient-to-br from-slate-800/70 to-green-800/70 backdrop-blur-sm00/30 text-green-20000 rounded-md text-xs font-medium">Free</span>
                        )}
                      </div>
                      
                      <div className="text-sm text-green-200 space-y-1">
                        <div className="flex justify-between">
                          <span>Registered:</span>
                          <span className="text-green-300 font-medium">
                            {eventParticipants[event.id!]?.length || 0} / {event.maxParticipants}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Event Date:</span>
                          <span className="text-green-300">{new Date(event.timeline.eventStart).toLocaleDateString()}</span>
                        </div>
                        {event.registrationFee > 0 && (
                          <div className="flex justify-between">
                            <span>Registration Fee:</span>
                            <span className="text-green-300 font-medium">₹{event.registrationFee}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-black/50 border-t border-green-500/30">
                    <div className="space-y-3">
                      {/* First Row - View/Info Actions */}
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => setSelectedEvent(event)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                        >
                          <span>📋</span>
                          <span>View Details</span>
                        </button>
                        <button 
                          onClick={() => handleViewParticipants(event.id!)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                          disabled={participantsLoading === event.id}
                        >
                          <span>👥</span>
                          <span>
                            {participantsLoading === event.id 
                              ? 'Loading...' 
                              : `Participants (${eventParticipants[event.id!]?.length || 0})`
                            }
                          </span>
                        </button>
                        <button 
                          onClick={() => setShowSubmissions(event)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                        >
                          <span>📝</span>
                          <span>Submissions</span>
                        </button>
                        <button 
                          onClick={() => handleInitializeCommunication(event.id!)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                        >
                          <span>💬</span>
                          <span>Chat</span>
                        </button>
                        <button 
                          onClick={() => setShowCertificates(event)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                        >
                          <span>📜</span>
                          <span>Certificates</span>
                        </button>
                        <button 
                          onClick={() => setShowJudgeInvite(event)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                        >
                          <span>👨‍⚖️</span>
                          <span>Invite Judge</span>
                        </button>
                      </div>
                      
                      {/* Second Row - Edit/Management Actions */}
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditEvent(event)}
                            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                          >
                            <span>✏️</span>
                            <span>Edit Event</span>
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirm(event.id || '')}
                            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
                          </button>
                        </div>
                        
                        {/* Event Status Indicator */}
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            event.status === 'ongoing' ? 'bg-green-400' :
                            event.status === 'completed' ? 'bg-gray-400' :
                            event.status === 'published' ? 'bg-blue-400' :
                            event.status === 'draft' ? 'bg-yellow-400' :
                            'bg-red-400'
                          }`}></div>
                          <span className={`text-xs font-medium capitalize ${
                            event.status === 'ongoing' ? 'text-green-400' :
                            event.status === 'completed' ? 'text-gray-400' :
                            event.status === 'published' ? 'text-blue-400' :
                            event.status === 'draft' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Event Form Modal */}
        {showCreateForm && user && (
          <CreateEventForm
            organizerId={user.uid || user.email}
            organizerName={user.name}
            editingEvent={editingEvent}
            onClose={() => {
              setShowCreateForm(false)
              setEditingEvent(null)
            }}
            onEventCreated={handleEventCreated}
          />
        )}

        {/* Judge Invite Modal */}
        {showJudgeInvite && (
          <JudgeInviteModal
            event={showJudgeInvite}
            onClose={() => setShowJudgeInvite(null)}
            onInviteCreated={() => {}}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-black/95 to-slate-900/95 backdrop-blur-sm rounded-xl p-6 max-w-md w-full mx-4 border border-green-500/30 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4 drop-shadow-lg">Confirm Delete</h3>
              <p className="text-green-200 mb-6">
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-green-200 hover:text-green-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteEvent(showDeleteConfirm)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-black/95 to-slate-900/95 backdrop-blur-sm rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-green-500/30 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-green-500/30">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-white00">{selectedEvent.title}</h2>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    selectedEvent.status === 'ongoing' ? 'bg-gradient-to-br from-slate-800/70 to-green-800/70 backdrop-blur-sm00/30 text-green-400 border border-green-600' :
                    selectedEvent.status === 'completed' ? 'bg-slate-700 text-green-20000 border border-slate-600' :
                    selectedEvent.status === 'published' ? 'bg-blue-900/30 text-blue-400 border border-blue-600' :
                    'bg-yellow-900/30 text-yellow-400 border border-yellow-600'
                  }`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-green-20000 hover:text-white00 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white00 mb-2">About the Event</h3>
                  <p className="text-green-20000">{selectedEvent.description}</p>
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white00">Event Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-green-20000">Theme:</span>
                        <span className="text-white00">{selectedEvent.theme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-20000">Type:</span>
                        <span className="text-white00 capitalize">{selectedEvent.eventType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-20000">Location:</span>
                        <span className="text-white00">{selectedEvent.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-20000">Max Participants:</span>
                        <span className="text-white00">{selectedEvent.maxParticipants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-20000">Registration Fee:</span>
                        <span className="text-white00">₹{selectedEvent.registrationFee}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white00">Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-green-20000">Registration Start:</span>
                        <span className="text-white00">{new Date(selectedEvent.timeline.registrationStart).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-20000">Registration End:</span>
                        <span className="text-white00">{new Date(selectedEvent.timeline.registrationEnd).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-20000">Event Start:</span>
                        <span className="text-white00">{new Date(selectedEvent.timeline.eventStart).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-20000">Event End:</span>
                        <span className="text-white00">{new Date(selectedEvent.timeline.eventEnd).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-20000">Submission Deadline:</span>
                        <span className="text-white00">{new Date(selectedEvent.timeline.submissionDeadline).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rounds Information */}
                {selectedEvent.rounds && selectedEvent.rounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white00 mb-3">Hackathon Rounds</h3>
                    <div className="space-y-4">
                      {selectedEvent.rounds.map((round, index) => (
                        <div key={round.id} className="bg-slate-700/50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-white00">Round {index + 1}: {round.name}</h4>
                            {round.maxParticipants && (
                              <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                                Max: {round.maxParticipants}
                              </span>
                            )}
                          </div>
                          <p className="text-green-20000 text-sm mb-3">{round.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-green-20000">Start:</span>
                              <span className="text-green-20000 ml-1">{(() => {
                                if (!round.startDate) return 'Not set';
                                const d = new Date(round.startDate);
                                return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
                              })()}</span>
                            </div>
                            <div>
                              <span className="text-green-20000">End:</span>
                              <span className="text-green-20000 ml-1">{(() => {
                                if (!round.endDate) return 'Not set';
                                const d = new Date(round.endDate);
                                return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
                              })()}</span>
                            </div>
                            <div>
                              <span className="text-green-20000">Submission:</span>
                              <span className="text-green-20000 ml-1">{(() => {
                                if (!round.submissionDeadline) return 'Not set';
                                const d = new Date(round.submissionDeadline);
                                return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
                              })()}</span>
                            </div>
                          </div>
                          {round.requirements && (
                            <div className="mt-2">
                              <span className="text-green-20000 text-xs">Requirements:</span>
                              <span className="text-green-20000 text-xs ml-1">{round.requirements}</span>
                            </div>
                          )}
                          {round.eliminationCriteria && (
                            <div className="mt-2">
                              <span className="text-green-20000 text-xs">Elimination Criteria:</span>
                              <span className="text-green-20000 text-xs ml-1">{round.eliminationCriteria}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white00 mb-3">Contact Information</h3>
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-20000">Organizer:</span>
                      <span className="text-white00">{selectedEvent.organizerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-20000">Email:</span>
                      <span className="text-blue-400">{selectedEvent.contactEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-lime-500/3000">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-6 py-2 text-green-20000 hover:text-green-20000 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleEditEvent(selectedEvent)
                      setSelectedEvent(null)
                    }}
                    className="px-6 py-2 bg-cyan-40000 hover:bg-cyan-400 text-white rounded-lg transition-colors"
                  >
                    Edit Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participants Modal */}
        {showParticipants && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800/70 to-green-800/70 backdrop-blur-sm00 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-lime-500/3000">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-lime-500/3000">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white00">Event Participants</h2>
                  <p className="text-green-20000 mt-1">
                    {events.find(e => e.id === showParticipants)?.title}
                  </p>
                  
                  {/* Participant Statistics */}
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-20000">
                        {eventParticipants[showParticipants]?.length || 0} Total Participants
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-green-20000">
                        {eventParticipants[showParticipants]?.filter(p => p.teamName).length || 0} Team Participants
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-green-20000">
                        {eventParticipants[showParticipants]?.filter(p => !p.teamName).length || 0} Individual Participants
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowParticipants(null)}
                  className="p-2 text-green-20000 hover:text-slate-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Participants List */}
              <div className="p-6">
                {eventParticipants[showParticipants]?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 bg-slate-600 rounded"></div>
                    </div>
                    <h3 className="text-lg font-medium text-white00 mb-2">No participants yet</h3>
                    <p className="text-green-20000">Participants will appear here once they register for this event</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {eventParticipants[showParticipants]?.map((participant, index) => (
                      <div key={participant.id} className="border border-lime-500/3000 rounded-lg bg-gradient-to-br from-slate-800/70 to-green-800/70 backdrop-blur-sm00/50 overflow-hidden">
                        {/* Participant Header */}
                        <div className="flex items-center justify-between p-4 bg-slate-700/30 border-b border-slate-600">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-cyan-40000 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {participant.userProfile?.name ? participant.userProfile.name[0].toUpperCase() : participant.participantName[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-white00 text-lg">
                                {participant.userProfile?.name || participant.participantName}
                              </h4>
                              <p className="text-sm text-green-20000">{participant.participantEmail}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-br from-slate-800/70 to-green-800/70 backdrop-blur-sm00/30 text-green-400 border border-green-600">
                              Registered
                            </span>
                            <p className="text-xs text-green-20000 mt-1">
                              {new Date(participant.registrationDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                              <h5 className="text-lg font-semibold text-white00 border-b border-slate-600 pb-2">
                                Personal Information
                              </h5>
                              
                              <div className="space-y-3">
                                {/* Show participant data from registration or profile */}
                                {(participant.participantPhone || participant.userProfile?.phone) && (
                                  <div className="flex justify-between">
                                    <span className="text-green-20000">Phone:</span>
                                    <span className="text-green-20000">{participant.participantPhone || participant.userProfile?.phone}</span>
                                  </div>
                                )}
                                
                                {(participant.participantCollege || participant.userProfile?.college) && (
                                  <div className="flex justify-between">
                                    <span className="text-green-20000">College:</span>
                                    <span className="text-green-20000">{participant.participantCollege || participant.userProfile?.college}</span>
                                  </div>
                                )}
                                
                                {(participant.participantCourse || participant.userProfile?.course) && (
                                  <div className="flex justify-between">
                                    <span className="text-green-20000">Course:</span>
                                    <span className="text-green-20000">{participant.participantCourse || participant.userProfile?.course}</span>
                                  </div>
                                )}
                                
                                {(participant.participantYear || participant.userProfile?.year) && (
                                  <div className="flex justify-between">
                                    <span className="text-green-20000">Year:</span>
                                    <span className="text-green-20000">{participant.participantYear || participant.userProfile?.year}</span>
                                  </div>
                                )}
                                
                                {(participant.participantExperience || participant.userProfile?.experience) && (
                                  <div>
                                    <span className="text-green-20000 block mb-1">Experience:</span>
                                    <span className="text-green-20000 text-sm">{participant.participantExperience || participant.userProfile?.experience}</span>
                                  </div>
                                )}
                                
                                {(participant.participantBio || participant.userProfile?.bio) && (
                                  <div>
                                    <span className="text-green-20000 block mb-1">Bio:</span>
                                    <p className="text-green-20000 text-sm leading-relaxed">{participant.participantBio || participant.userProfile?.bio}</p>
                                  </div>
                                )}
                                
                                {/* Social Links */}
                                {((participant.participantGithub || participant.userProfile?.github) || 
                                  (participant.participantLinkedin || participant.userProfile?.linkedin) || 
                                  (participant.participantPortfolio || participant.userProfile?.portfolio)) && (
                                  <div>
                                    <span className="text-green-20000 block mb-2">Social Links:</span>
                                    <div className="space-y-2">
                                      {(participant.participantGithub || participant.userProfile?.github) && (
                                        <div className="flex justify-between">
                                          <span className="text-green-20000">GitHub:</span>
                                          <a 
                                            href={participant.participantGithub || participant.userProfile?.github} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-sm truncate max-w-48"
                                          >
                                            {participant.participantGithub || participant.userProfile?.github}
                                          </a>
                                        </div>
                                      )}
                                      
                                      {(participant.participantLinkedin || participant.userProfile?.linkedin) && (
                                        <div className="flex justify-between">
                                          <span className="text-green-20000">LinkedIn:</span>
                                          <a 
                                            href={participant.participantLinkedin || participant.userProfile?.linkedin} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-sm truncate max-w-48"
                                          >
                                            {participant.participantLinkedin || participant.userProfile?.linkedin}
                                          </a>
                                        </div>
                                      )}
                                      
                                      {(participant.participantPortfolio || participant.userProfile?.portfolio) && (
                                        <div className="flex justify-between">
                                          <span className="text-green-20000">Portfolio:</span>
                                          <a 
                                            href={participant.participantPortfolio || participant.userProfile?.portfolio} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-sm truncate max-w-48"
                                          >
                                            {participant.participantPortfolio || participant.userProfile?.portfolio}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* If no data is available */}
                                {!participant.participantPhone && !participant.userProfile?.phone &&
                                 !participant.participantCollege && !participant.userProfile?.college &&
                                 !participant.participantCourse && !participant.userProfile?.course && (
                                  <div className="text-center py-4">
                                    <p className="text-green-20000 text-sm">No personal information available</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Skills & Team Information */}
                            <div className="space-y-4">
                              <h5 className="text-lg font-semibold text-white00 border-b border-slate-600 pb-2">
                                Skills & Team
                              </h5>
                              
                              {/* Skills */}
                              {((participant.participantSkills && participant.participantSkills.length > 0) || 
                                (participant.userProfile?.skills && participant.userProfile.skills.length > 0)) && (
                                <div>
                                  <span className="text-green-20000 block mb-2">Skills:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {(participant.participantSkills || participant.userProfile?.skills || []).map((skill: string, skillIndex: number) => (
                                      <span key={skillIndex} className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm border border-blue-600/30">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Social Links */}
                              {(participant.userProfile?.github || participant.userProfile?.linkedin || participant.userProfile?.portfolio) && (
                                <div>
                                  <span className="text-green-20000 block mb-2">Links:</span>
                                  <div className="space-y-2">
                                    {participant.userProfile.github && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-green-20000 text-sm">GitHub:</span>
                                        <a 
                                          href={participant.userProfile.github}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 text-sm underline"
                                        >
                                          {participant.userProfile.github}
                                        </a>
                                      </div>
                                    )}
                                    
                                    {participant.userProfile.linkedin && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-green-20000 text-sm">LinkedIn:</span>
                                        <a 
                                          href={participant.userProfile.linkedin}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 text-sm underline"
                                        >
                                          {participant.userProfile.linkedin}
                                        </a>
                                      </div>
                                    )}
                                    
                                    {participant.userProfile.portfolio && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-green-20000 text-sm">Portfolio:</span>
                                        <a 
                                          href={participant.userProfile.portfolio}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 text-sm underline"
                                        >
                                          {participant.userProfile.portfolio}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Team Information */}
                            <div className="space-y-4">
                              <h5 className="text-lg font-semibold text-white00 border-b border-slate-600 pb-2">
                                Team Information
                              </h5>
                              
                              {participant.teamName ? (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <span className="text-green-20000">Team Name:</span>
                                    <span className="text-white00 font-medium">{participant.teamName}</span>
                                  </div>
                                  
                                  {participant.teamMembers && participant.teamMembers.length > 0 && (
                                    <div>
                                      <span className="text-green-20000 block mb-3">Team Members ({participant.teamMembers.length}):</span>
                                      <div className="space-y-3">
                                        {participant.teamMembers.map((member: any, memberIndex: number) => (
                                          <div key={memberIndex} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                              <span className="text-white font-medium text-sm">
                                                {member.name[0].toUpperCase()}
                                              </span>
                                            </div>
                                            <div className="flex-1">
                                              <p className="text-white00 font-medium">{member.name}</p>
                                              <p className="text-green-20000 text-sm">{member.email}</p>
                                              {member.role && (
                                                <span className="inline-block mt-1 px-2 py-1 bg-purple-900/30 text-purple-300 rounded-md text-xs">
                                                  {member.role}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-6 border-2 border-dashed border-slate-600 rounded-lg">
                                  <div className="text-green-20000">
                                    <div className="w-12 h-12 bg-slate-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                      <div className="w-6 h-6 bg-slate-600 rounded"></div>
                                    </div>
                                    <p className="text-sm">Individual Participant</p>
                                    <p className="text-xs text-slate-500">No team information provided</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Registration Status & Payment */}
                              <div>
                                <span className="text-green-20000 block mb-2">Registration Details:</span>
                                <div className="space-y-2 bg-slate-700/30 rounded-lg p-3">
                                  <div className="flex justify-between">
                                    <span className="text-green-20000 text-sm">Status:</span>
                                    <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                                      participant.status === 'approved' ? 'bg-gradient-to-br from-slate-800/70 to-green-800/70 backdrop-blur-sm00/30 text-green-400' :
                                      participant.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                                      'bg-yellow-900/30 text-yellow-400'
                                    }`}>
                                      {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-green-20000 text-sm">Payment:</span>
                                    <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                                      participant.paymentStatus === 'paid' ? 'bg-gradient-to-br from-slate-800/70 to-green-800/70 backdrop-blur-sm00/30 text-green-400' :
                                      participant.paymentStatus === 'failed' ? 'bg-red-900/30 text-red-400' :
                                      'bg-yellow-900/30 text-yellow-400'
                                    }`}>
                                      {participant.paymentStatus.charAt(0).toUpperCase() + participant.paymentStatus.slice(1)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-green-20000 text-sm">Registered:</span>
                                    <span className="text-green-20000 text-sm">
                                      {new Date(participant.registrationDate).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Additional Information */}
                              {participant.additionalInfo && Object.keys(participant.additionalInfo).length > 0 && (
                                <div>
                                  <span className="text-green-20000 block mb-2">Additional Information:</span>
                                  <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                                    {Object.entries(participant.additionalInfo).map(([key, value]) => (
                                      <div key={key} className="flex justify-between text-sm">
                                        <span className="text-green-20000 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                        <span className="text-green-20000 flex-1 text-right ml-2">{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center p-6 border-t border-lime-500/3000 bg-gradient-to-br from-slate-800/70 to-green-800/70 backdrop-blur-sm00/50">
                <div className="text-sm text-green-20000">
                  Last updated: {new Date().toLocaleString()}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => exportParticipantsToCSV(showParticipants!)}
                    className="px-4 py-2 bg-cyan-40000 hover:bg-cyan-400 text-white rounded-lg transition-colors text-sm"
                    disabled={!eventParticipants[showParticipants!] || eventParticipants[showParticipants!].length === 0}
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => setShowParticipants(null)}
                    className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Communication Modal */}
        {showCommunication && user && (
          <EventCommunication
            eventId={showCommunication}
            userId={user.uid || user.email}
            userName={user.name}
            userRole="organizer"
            onClose={() => setShowCommunication(null)}
          />
        )}

        {/* Submissions Viewer Modal */}
        {showSubmissions && (
          <SubmissionViewer
            key={showSubmissions.id}
            event={showSubmissions}
            onClose={() => setShowSubmissions(null)}
          />
        )}

        {/* Certificate Manager Modal */}
        {showCertificates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Certificate Management - {showCertificates.title}
                </h2>
                <button
                  onClick={() => setShowCertificates(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                <CertificateManager
                  eventId={showCertificates.id!}
                  eventTitle={showCertificates.title}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrganizerDashboard
