'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CreateEventForm from '../CreateEventForm'
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
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
              <span className="ml-4 px-2 py-1 bg-blue-900/30 text-blue-400 text-sm rounded-full">
                Organizer
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
            Organizer Dashboard
          </h1>
          <p className="text-slate-300">
            Manage your hackathons, track participants, and oversee events.
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
                <p className="text-sm font-medium text-slate-400">Total Events</p>
                <p className="text-2xl font-bold text-slate-100">{events.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Active Events</p>
                <p className="text-2xl font-bold text-slate-100">
                  {events.filter(e => e.status === 'ongoing' || e.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <div className="w-6 h-6 bg-purple-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Participants</p>
                <p className="text-2xl font-bold text-slate-100">
                  {events.reduce((sum, event) => sum + (event.currentParticipants || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-900/30 rounded-lg">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Submissions</p>
                <p className="text-2xl font-bold text-slate-100">89</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div 
            onClick={() => setShowCreateForm(true)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-all cursor-pointer"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-200 rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Create Event</h3>
              <p className="text-slate-400 text-sm mb-4">
                Start organizing a new hackathon or coding competition
              </p>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                Create New Event
              </button>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-green-500 transition-all cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-green-200 rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Manage Events</h3>
              <p className="text-slate-400 text-sm mb-4">
                View and edit your existing events and their settings
              </p>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                Manage Events
              </button>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition-all cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-purple-200 rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">View Analytics</h3>
              <p className="text-slate-400 text-sm mb-4">
                Track event performance and participant engagement
              </p>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* My Events */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-100">My Events</h2>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              + Create Event
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-400">Loading events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-slate-600 rounded"></div>
              </div>
              <h3 className="text-lg font-medium text-slate-100 mb-2">No events yet</h3>
              <p className="text-slate-400 mb-4">Create your first hackathon to get started</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.id} className="border border-slate-700 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors duration-200 overflow-hidden shadow-lg">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-xl text-slate-100 leading-tight">{event.title}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        event.status === 'ongoing' ? 'bg-green-900/30 text-green-400 border border-green-600' :
                        event.status === 'completed' ? 'bg-slate-700 text-slate-300 border border-slate-600' :
                        event.status === 'published' ? 'bg-blue-900/30 text-blue-400 border border-blue-600' :
                        'bg-yellow-900/30 text-yellow-400 border border-yellow-600'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-300 mb-4 line-clamp-2">{event.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded-md text-xs font-medium">{event.theme}</span>
                        <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded-md text-xs font-medium">{event.eventType}</span>
                      </div>
                      
                      <div className="text-sm text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Registered:</span>
                          <span className="text-slate-300 font-medium">
                            {eventParticipants[event.id!]?.length || 0} / {event.maxParticipants}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Event Date:</span>
                          <span className="text-slate-300">{new Date(event.timeline.eventStart).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Registration Fee:</span>
                          <span className="text-slate-300 font-medium">₹{event.registrationFee}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => setSelectedEvent(event)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          Details
                        </button>
                        <button 
                          onClick={() => handleViewParticipants(event.id!)}
                          className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                          disabled={participantsLoading === event.id}
                        >
                          {participantsLoading === event.id ? 'Loading...' : `Participants (${eventParticipants[event.id!]?.length || 0})`}
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditEvent(event)}
                          className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(event.id || '')}
                          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Confirm Delete</h3>
              <p className="text-slate-300 mb-6">
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteEvent(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-slate-100">{selectedEvent.title}</h2>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    selectedEvent.status === 'ongoing' ? 'bg-green-900/30 text-green-400 border border-green-600' :
                    selectedEvent.status === 'completed' ? 'bg-slate-700 text-slate-300 border border-slate-600' :
                    selectedEvent.status === 'published' ? 'bg-blue-900/30 text-blue-400 border border-blue-600' :
                    'bg-yellow-900/30 text-yellow-400 border border-yellow-600'
                  }`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-slate-400 hover:text-slate-100 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">About the Event</h3>
                  <p className="text-slate-300">{selectedEvent.description}</p>
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-100">Event Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Theme:</span>
                        <span className="text-slate-100">{selectedEvent.theme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type:</span>
                        <span className="text-slate-100 capitalize">{selectedEvent.eventType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="text-slate-100">{selectedEvent.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Participants:</span>
                        <span className="text-slate-100">{selectedEvent.maxParticipants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Registration Fee:</span>
                        <span className="text-slate-100">₹{selectedEvent.registrationFee}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-100">Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Registration Start:</span>
                        <span className="text-slate-100">{new Date(selectedEvent.timeline.registrationStart).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Registration End:</span>
                        <span className="text-slate-100">{new Date(selectedEvent.timeline.registrationEnd).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Event Start:</span>
                        <span className="text-slate-100">{new Date(selectedEvent.timeline.eventStart).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Event End:</span>
                        <span className="text-slate-100">{new Date(selectedEvent.timeline.eventEnd).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Submission Deadline:</span>
                        <span className="text-slate-100">{new Date(selectedEvent.timeline.submissionDeadline).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">Contact Information</h3>
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Organizer:</span>
                      <span className="text-slate-100">{selectedEvent.organizerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-blue-400">{selectedEvent.contactEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-6 py-2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleEditEvent(selectedEvent)
                      setSelectedEvent(null)
                    }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
            <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-100">Event Participants</h2>
                  <p className="text-slate-400 mt-1">
                    {events.find(e => e.id === showParticipants)?.title}
                  </p>
                  
                  {/* Participant Statistics */}
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-slate-300">
                        {eventParticipants[showParticipants]?.length || 0} Total Participants
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-slate-300">
                        {eventParticipants[showParticipants]?.filter(p => p.teamName).length || 0} Team Participants
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-slate-300">
                        {eventParticipants[showParticipants]?.filter(p => !p.teamName).length || 0} Individual Participants
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowParticipants(null)}
                  className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
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
                    <h3 className="text-lg font-medium text-slate-100 mb-2">No participants yet</h3>
                    <p className="text-slate-400">Participants will appear here once they register for this event</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {eventParticipants[showParticipants]?.map((participant, index) => (
                      <div key={participant.id} className="border border-slate-700 rounded-lg bg-slate-800/50 overflow-hidden">
                        {/* Participant Header */}
                        <div className="flex items-center justify-between p-4 bg-slate-700/30 border-b border-slate-600">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {participant.userProfile?.name ? participant.userProfile.name[0].toUpperCase() : participant.participantName[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-100 text-lg">
                                {participant.userProfile?.name || participant.participantName}
                              </h4>
                              <p className="text-sm text-slate-400">{participant.participantEmail}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900/30 text-green-400 border border-green-600">
                              Registered
                            </span>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(participant.registrationDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                              <h5 className="text-lg font-semibold text-slate-100 border-b border-slate-600 pb-2">
                                Personal Information
                              </h5>
                              
                              <div className="space-y-3">
                                {/* Show participant data from registration or profile */}
                                {(participant.participantPhone || participant.userProfile?.phone) && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Phone:</span>
                                    <span className="text-slate-300">{participant.participantPhone || participant.userProfile?.phone}</span>
                                  </div>
                                )}
                                
                                {(participant.participantCollege || participant.userProfile?.college) && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">College:</span>
                                    <span className="text-slate-300">{participant.participantCollege || participant.userProfile?.college}</span>
                                  </div>
                                )}
                                
                                {(participant.participantCourse || participant.userProfile?.course) && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Course:</span>
                                    <span className="text-slate-300">{participant.participantCourse || participant.userProfile?.course}</span>
                                  </div>
                                )}
                                
                                {(participant.participantYear || participant.userProfile?.year) && (
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Year:</span>
                                    <span className="text-slate-300">{participant.participantYear || participant.userProfile?.year}</span>
                                  </div>
                                )}
                                
                                {(participant.participantExperience || participant.userProfile?.experience) && (
                                  <div>
                                    <span className="text-slate-400 block mb-1">Experience:</span>
                                    <span className="text-slate-300 text-sm">{participant.participantExperience || participant.userProfile?.experience}</span>
                                  </div>
                                )}
                                
                                {(participant.participantBio || participant.userProfile?.bio) && (
                                  <div>
                                    <span className="text-slate-400 block mb-1">Bio:</span>
                                    <p className="text-slate-300 text-sm leading-relaxed">{participant.participantBio || participant.userProfile?.bio}</p>
                                  </div>
                                )}
                                
                                {/* Social Links */}
                                {((participant.participantGithub || participant.userProfile?.github) || 
                                  (participant.participantLinkedin || participant.userProfile?.linkedin) || 
                                  (participant.participantPortfolio || participant.userProfile?.portfolio)) && (
                                  <div>
                                    <span className="text-slate-400 block mb-2">Social Links:</span>
                                    <div className="space-y-2">
                                      {(participant.participantGithub || participant.userProfile?.github) && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">GitHub:</span>
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
                                          <span className="text-slate-400">LinkedIn:</span>
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
                                          <span className="text-slate-400">Portfolio:</span>
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
                                    <p className="text-slate-400 text-sm">No personal information available</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Skills & Team Information */}
                            <div className="space-y-4">
                              <h5 className="text-lg font-semibold text-slate-100 border-b border-slate-600 pb-2">
                                Skills & Team
                              </h5>
                              
                              {/* Skills */}
                              {((participant.participantSkills && participant.participantSkills.length > 0) || 
                                (participant.userProfile?.skills && participant.userProfile.skills.length > 0)) && (
                                <div>
                                  <span className="text-slate-400 block mb-2">Skills:</span>
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
                                  <span className="text-slate-400 block mb-2">Links:</span>
                                  <div className="space-y-2">
                                    {participant.userProfile.github && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-slate-400 text-sm">GitHub:</span>
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
                                        <span className="text-slate-400 text-sm">LinkedIn:</span>
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
                                        <span className="text-slate-400 text-sm">Portfolio:</span>
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
                              <h5 className="text-lg font-semibold text-slate-100 border-b border-slate-600 pb-2">
                                Team Information
                              </h5>
                              
                              {participant.teamName ? (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Team Name:</span>
                                    <span className="text-slate-100 font-medium">{participant.teamName}</span>
                                  </div>
                                  
                                  {participant.teamMembers && participant.teamMembers.length > 0 && (
                                    <div>
                                      <span className="text-slate-400 block mb-3">Team Members ({participant.teamMembers.length}):</span>
                                      <div className="space-y-3">
                                        {participant.teamMembers.map((member: any, memberIndex: number) => (
                                          <div key={memberIndex} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                              <span className="text-white font-medium text-sm">
                                                {member.name[0].toUpperCase()}
                                              </span>
                                            </div>
                                            <div className="flex-1">
                                              <p className="text-slate-100 font-medium">{member.name}</p>
                                              <p className="text-slate-400 text-sm">{member.email}</p>
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
                                  <div className="text-slate-400">
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
                                <span className="text-slate-400 block mb-2">Registration Details:</span>
                                <div className="space-y-2 bg-slate-700/30 rounded-lg p-3">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Status:</span>
                                    <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                                      participant.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                                      participant.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                                      'bg-yellow-900/30 text-yellow-400'
                                    }`}>
                                      {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Payment:</span>
                                    <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                                      participant.paymentStatus === 'paid' ? 'bg-green-900/30 text-green-400' :
                                      participant.paymentStatus === 'failed' ? 'bg-red-900/30 text-red-400' :
                                      'bg-yellow-900/30 text-yellow-400'
                                    }`}>
                                      {participant.paymentStatus.charAt(0).toUpperCase() + participant.paymentStatus.slice(1)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Registered:</span>
                                    <span className="text-slate-300 text-sm">
                                      {new Date(participant.registrationDate).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Additional Information */}
                              {participant.additionalInfo && Object.keys(participant.additionalInfo).length > 0 && (
                                <div>
                                  <span className="text-slate-400 block mb-2">Additional Information:</span>
                                  <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                                    {Object.entries(participant.additionalInfo).map(([key, value]) => (
                                      <div key={key} className="flex justify-between text-sm">
                                        <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                        <span className="text-slate-300 flex-1 text-right ml-2">{String(value)}</span>
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
              <div className="flex justify-between items-center p-6 border-t border-slate-700 bg-slate-800/50">
                <div className="text-sm text-slate-400">
                  Last updated: {new Date().toLocaleString()}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => exportParticipantsToCSV(showParticipants!)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
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
      </div>
    </div>
  )
}

export default OrganizerDashboard
