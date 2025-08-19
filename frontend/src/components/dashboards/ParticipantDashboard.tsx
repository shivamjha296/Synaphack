'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Event } from '../../lib/eventService'
import RegistrationModal from '../RegistrationModal'
import EventCommunication from '../EventCommunication'

interface User {
  email: string
  name: string
  role: string
}

const ParticipantDashboard = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [registrationEvent, setRegistrationEvent] = useState<Event | null>(null)
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([])
  const [registeredEventsDetails, setRegisteredEventsDetails] = useState<(Event & { registrationData: any })[]>([])
  const [registeredEventsLoading, setRegisteredEventsLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showCommunication, setShowCommunication] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in and ensure Firebase auth state
    const userData = localStorage.getItem('user')
    console.log('ParticipantDashboard: Raw user data from localStorage:', userData)
    if (userData) {
      const parsedUser = JSON.parse(userData)
      console.log('ParticipantDashboard: Parsed user:', parsedUser)
      if (parsedUser.role === 'participant') {
        setUser(parsedUser)
        console.log('ParticipantDashboard: Loading data for participant email:', parsedUser.email)
        loadAvailableEvents()
        loadUserRegistrations(parsedUser.email)
        loadRegisteredEventsDetails(parsedUser.email)
      } else {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router, refreshTrigger])

  const loadUserRegistrations = async (email: string) => {
    try {
      console.log('Loading user registrations for email:', email)
      
      // Use direct Firebase query like the organizer's dashboard
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase')
      
      const q = query(
        collection(db, 'registrations'),
        where('participantEmail', '==', email)
      )
      const registrationsSnap = await getDocs(q)
      
      const eventIds = registrationsSnap.docs.map(doc => doc.data().eventId)
      console.log('Found registrations for events:', eventIds)
      
      setRegisteredEvents(eventIds)
    } catch (error) {
      console.error('Error loading user registrations:', error)
    }
  }

  const loadRegisteredEventsDetails = async (email: string) => {
    setRegisteredEventsLoading(true)
    try {
      console.log('Loading registered events for email:', email)
      const { eventService } = await import('../../lib/eventService')
      
      // Use the same logic as organizer's getEventParticipants but query by participant
      const { collection, query, where, getDocs, getDoc, doc } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase')
      
      // Query registrations by participant email
      const q = query(
        collection(db, 'registrations'),
        where('participantEmail', '==', email)
      )
      const registrationsSnap = await getDocs(q)
      
      console.log('Found registrations:', registrationsSnap.docs.length)
      
      const registeredEventsData = []
      
      for (const regDoc of registrationsSnap.docs) {
        const registrationData = regDoc.data()
        const registration = { 
          id: regDoc.id, 
          ...registrationData,
          registrationDate: registrationData.registrationDate?.toDate(),
        }
        
        console.log('Processing registration:', registration.id, 'for event:', registrationData.eventId)
        
        // Get the event details
        const eventDoc = await getDoc(doc(db, 'events', registrationData.eventId))
        
        if (eventDoc.exists()) {
          const eventData = eventDoc.data()
          const event = { 
            id: eventDoc.id, 
            ...eventData,
            createdAt: eventData.createdAt?.toDate(),
            updatedAt: eventData.updatedAt?.toDate(),
            timeline: {
              ...eventData.timeline,
              registrationStart: eventData.timeline?.registrationStart?.toDate(),
              registrationEnd: eventData.timeline?.registrationEnd?.toDate(),
              eventStart: eventData.timeline?.eventStart?.toDate(),
              eventEnd: eventData.timeline?.eventEnd?.toDate(),
              submissionDeadline: eventData.timeline?.submissionDeadline?.toDate(),
            }
          } as any
          
          console.log('Found event:', eventData.title)
          
          registeredEventsData.push({
            ...event,
            registrationData: registration
          })
        } else {
          console.log('Event not found for eventId:', registrationData.eventId)
        }
      }
      
      console.log('Final registered events:', registeredEventsData.length)
      setRegisteredEventsDetails(registeredEventsData)
    } catch (error) {
      console.error('Error loading registered events details:', error)
    } finally {
      setRegisteredEventsLoading(false)
    }
  }

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

  const loadAvailableEvents = async () => {
    console.log('ParticipantDashboard: Loading available events...')
    try {
      const { eventService } = await import('../../lib/eventService')
      // Show only published events for participants (not drafts)
      const publishedEvents = await eventService.getPublishedEvents()
      console.log('ParticipantDashboard: Loaded events:', publishedEvents.length)
      setEvents(publishedEvents)
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

  const handleRegistrationComplete = () => {
    setRefreshTrigger(prev => prev + 1)
    alert('Registration successful! You will receive a confirmation email shortly.')
  }

  const handleRegisterClick = (event: Event) => {
    setRegistrationEvent(event)
  }

  const isRegistered = (eventId: string) => {
    return registeredEvents.includes(eventId)
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
      <nav className="bg-slate-800 shadow-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-400">
                HackPlatform
              </Link>
              <span className="ml-4 px-2 py-1 bg-green-900/30 text-green-400 text-sm rounded-full border border-green-600">
                Participant
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-300">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
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
            Participant Dashboard
          </h1>
          <p className="text-slate-300">
            Join events, manage your team, and submit your amazing projects.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Events Joined</p>
                <p className="text-2xl font-bold text-slate-100">{registeredEventsDetails.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Submissions</p>
                <p className="text-2xl font-bold text-slate-100">3</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <div className="w-6 h-6 bg-purple-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Team Members</p>
                <p className="text-2xl font-bold text-slate-100">4</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Browse Events</h3>
              <p className="text-slate-400 text-sm mb-4">
                Discover new hackathons and competitions to join
              </p>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                Browse Events
              </button>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-green-500 transition-colors cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">My Team</h3>
              <p className="text-slate-400 text-sm mb-4">
                Manage your team members and collaborate
              </p>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                View Team
              </button>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition-colors cursor-pointer">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Submit Project</h3>
              <p className="text-slate-400 text-sm mb-4">
                Upload your project and submit to competitions
              </p>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700">
                Submit Project
              </button>
            </div>
          </div>
        </div>

        {/* Available Events */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Available Events</h2>
          
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
              <h3 className="text-lg font-medium text-slate-100 mb-2">No events available</h3>
              <p className="text-slate-400">Check back later for new hackathons and competitions</p>
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
                          <span>Registration Fee:</span>
                          <span className="text-slate-300 font-medium">₹{event.registrationFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Event Date:</span>
                          <span className="text-slate-300">{new Date(event.timeline.eventStart).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Organizer:</span>
                          <span className="text-blue-400">{event.organizerName}</span>
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
                          View Details
                        </button>
                        {isRegistered(event.id!) && (
                          <button 
                            onClick={() => setShowCommunication(event.id!)}
                            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                          >
                            💬 Chat
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => handleRegisterClick(event)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          event.status === 'completed'
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : isRegistered(event.id!)
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        disabled={event.status === 'completed' || isRegistered(event.id!)}
                      >
                        {event.status === 'completed' 
                          ? 'Event Completed' 
                          : isRegistered(event.id!)
                          ? 'Registered ✓' 
                          : 'Register'
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registered Events */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">My Registered Events</h2>
          
          {registeredEventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-400">Loading registered events...</span>
            </div>
          ) : registeredEventsDetails.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-slate-600 rounded"></div>
              </div>
              <h3 className="text-lg font-medium text-slate-100 mb-2">No registered events</h3>
              <p className="text-slate-400">Register for events above to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredEventsDetails.map((eventWithReg) => (
                <div key={eventWithReg.id} className="border border-green-600/30 rounded-lg bg-green-900/10 hover:bg-green-800/20 transition-colors duration-200 overflow-hidden shadow-lg">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-xl text-slate-100 leading-tight">{eventWithReg.title}</h3>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-900/30 text-green-400 border border-green-600">
                        Registered ✓
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-300 mb-4 line-clamp-2">{eventWithReg.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded-md text-xs font-medium">{eventWithReg.theme}</span>
                        <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded-md text-xs font-medium">{eventWithReg.eventType}</span>
                      </div>
                      
                      <div className="text-sm text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Event Date:</span>
                          <span className="text-slate-300">{new Date(eventWithReg.timeline.eventStart).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Registered On:</span>
                          <span className="text-green-400">{new Date(eventWithReg.registrationData.registrationDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className={`font-medium ${
                            eventWithReg.status === 'ongoing' ? 'text-green-400' :
                            eventWithReg.status === 'completed' ? 'text-slate-400' :
                            eventWithReg.status === 'published' ? 'text-blue-400' :
                            'text-yellow-400'
                          }`}>{eventWithReg.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-green-900/20 border-t border-green-600/30">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => setSelectedEvent(eventWithReg)}
                          className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => setShowCommunication(eventWithReg.id!)}
                          className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                        >
                          💬 Join Chat
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-green-400 font-medium">Active Registration</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { action: 'Joined AI Innovation Challenge', time: '2 hours ago' },
              { action: 'Submitted project to Blockchain Hackathon', time: '1 day ago' },
              { action: 'Added new team member to Eco Warriors', time: '3 days ago' },
              { action: 'Registered for Green Tech Challenge', time: '1 week ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-600 last:border-b-0">
                <span className="text-slate-100">{activity.action}</span>
                <span className="text-sm text-slate-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                    setSelectedEvent(null)
                    handleRegisterClick(selectedEvent)
                  }}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    selectedEvent.status === 'completed'
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : isRegistered(selectedEvent.id!)
                      ? 'bg-green-600 text-white cursor-default'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  disabled={selectedEvent.status === 'completed' || isRegistered(selectedEvent.id!)}
                >
                  {selectedEvent.status === 'completed' 
                    ? 'Event Completed' 
                    : isRegistered(selectedEvent.id!)
                    ? 'Already Registered ✓'
                    : 'Register for Event'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {registrationEvent && user && (
        <RegistrationModal
          event={registrationEvent}
          userEmail={user.email}
          userName={user.name}
          onClose={() => setRegistrationEvent(null)}
          onRegistrationComplete={handleRegistrationComplete}
        />
      )}

      {/* Communication Modal */}
      {showCommunication && user && (
        <EventCommunication
          eventId={showCommunication}
          userId={user.email}
          userName={user.name}
          userRole="participant"
          onClose={() => setShowCommunication(null)}
        />
      )}
    </div>
  )
}

export default ParticipantDashboard
