'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Users, 
  Trophy, 
  FileText, 
  Settings, 
  LogOut,
  Plus,
  Search,
  Megaphone,
  CheckCircle
} from 'lucide-react'

import { useAuthStore, useEventsStore, useAnnouncementsStore } from '@/lib/store'

// Dashboard Component for different user roles
export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const { events, fetchEvents, loading } = useEventsStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchEvents()
  }, [user, router, fetchEvents, isClient])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isClient) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Redirecting to login...</div>
    </div>
  }

  // Role-specific dashboard content
  const getDashboardContent = () => {
    switch (user.role) {
      case 'organizer':
        return <OrganizerDashboard />
      case 'judge':
        return <JudgeDashboard />
      case 'admin':
        return <AdminDashboard />
      default:
        return <ParticipantDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">HackPlatform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.full_name}</span>
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {getDashboardContent()}
      </div>
    </div>
  )
}

// Organizer Dashboard
function OrganizerDashboard() {
  const [activeTab, setActiveTab] = useState('events')
  const [isClient, setIsClient] = useState(false)
  const { announcements, fetchAnnouncements } = useAnnouncementsStore()

  useEffect(() => {
    setIsClient(true)
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const tabs = [
    { id: 'events', name: 'My Events', icon: Calendar },
    { id: 'announcements', name: 'Announcements', icon: Megaphone },
    { id: 'analytics', name: 'Analytics', icon: Trophy },
    { id: 'settings', name: 'Settings', icon: Settings },
  ]

  if (!isClient) {
    return <div className="text-gray-600">Loading dashboard...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h2>
        <p className="text-gray-600">Manage your hackathons and events</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'events' && <EventsManagement />}
        {activeTab === 'announcements' && <AnnouncementsManagement />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'settings' && <UserSettings />}
      </div>
    </div>
  )
}

// Participant Dashboard
function ParticipantDashboard() {
  const [activeTab, setActiveTab] = useState('events')

  const tabs = [
    { id: 'events', name: 'Available Events', icon: Calendar },
    { id: 'teams', name: 'My Teams', icon: Users },
    { id: 'submissions', name: 'Submissions', icon: FileText },
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Participant Dashboard</h2>
        <p className="text-gray-600">Join events, form teams, and submit your projects</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'events' && <AvailableEvents />}
        {activeTab === 'teams' && <MyTeams />}
        {activeTab === 'submissions' && <MySubmissions />}
      </div>
    </div>
  )
}

// Judge Dashboard
function JudgeDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Judge Dashboard</h2>
        <p className="text-gray-600">Review and score submissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PendingSubmissions />
        </div>
        <div>
          <JudgingStats />
        </div>
      </div>
    </div>
  )
}

// Admin Dashboard
function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600">Manage platform users and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value="1,234" icon={Users} />
        <StatCard title="Active Events" value="23" icon={Calendar} />
        <StatCard title="Total Submissions" value="456" icon={FileText} />
        <StatCard title="Completed Events" value="89" icon={Trophy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity />
        <SystemHealth />
      </div>
    </div>
  )
}

// Shared Components
function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-primary-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function EventsManagement() {
  const router = useRouter()
  const { events, fetchEvents, loading } = useEventsStore()

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleCreateEvent = () => {
    router.push('/events')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">My Events</h3>
        <button 
          onClick={handleCreateEvent}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Event</span>
        </button>
      </div>

      <div>
        {loading ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">No events created yet. Create your first event to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev: any) => (
              <div key={ev.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-md font-semibold text-gray-900">{ev.title || ev.name}</h4>
                    <span className="text-sm text-gray-500">{ev.status}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ev.description}</p>
                <div className="text-sm text-gray-500">
                  <div>{new Date(ev.event_start || ev.start_date).toLocaleDateString()} - {new Date(ev.event_end || ev.end_date).toLocaleDateString()}</div>
                  <div className="mt-2">{ev.venue || ev.location}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AvailableEvents() {
  const { events, fetchEvents, loading, registerForEvent } = useEventsStore()
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const filtered = events.filter(e => {
    const text = `${(e as any).title || (e as any).name || ''} ${(e as any).description || ''}`
    return text.toLowerCase().includes(query.toLowerCase())
  })

  const handleJoin = async (id: string) => {
    try {
      await registerForEvent(id)
      alert('Successfully registered for the event')
    } catch (err: any) {
      console.error('Join failed', err)
      
      // Extract error message from the response
      let errorMessage = 'Failed to register for event'
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      alert(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Available Events</h3>
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search events..."
            className="input-field"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event: any) => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-md font-semibold text-gray-900">{event.title || event.name}</h4>
                    {event.is_registered && (
                      <div title="You are registered for this event">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{event.status}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
              <div className="text-sm text-gray-500 mb-4">
                <div>{new Date(event.event_start || event.start_date).toLocaleDateString()} - {new Date(event.event_end || event.end_date).toLocaleDateString()}</div>
                <div className="mt-2">{event.venue || event.location}</div>
              </div>
              <div className="flex space-x-2">
                {event.is_registered ? (
                  <button className="btn-secondary text-sm flex-1" disabled>
                    Already Registered
                  </button>
                ) : (
                  <button className="btn-primary text-sm flex-1" onClick={() => handleJoin(event.id)}>
                    Join
                  </button>
                )}
                <button className="btn-secondary text-sm">View</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MyTeams() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">My Teams</h3>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">You are not part of any teams yet.</p>
      </div>
    </div>
  )
}

function MySubmissions() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">My Submissions</h3>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">No submissions yet.</p>
      </div>
    </div>
  )
}

function PendingSubmissions() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Reviews</h3>
      <p className="text-gray-500">No submissions pending review.</p>
    </div>
  )
}

function JudgingStats() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Judging Statistics</h3>
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Reviews Completed</span>
          <span className="font-semibold">0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Average Score Given</span>
          <span className="font-semibold">N/A</span>
        </div>
      </div>
    </div>
  )
}

function Analytics() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Event Analytics</h3>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Analytics data will be displayed here.</p>
      </div>
    </div>
  )
}

function RecentActivity() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      <p className="text-gray-500">No recent activity.</p>
    </div>
  )
}

function SystemHealth() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">API Status</span>
          <span className="text-green-600 font-medium">Healthy</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Database</span>
          <span className="text-green-600 font-medium">Connected</span>
        </div>
      </div>
    </div>
  )
}

function UserSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Settings</h3>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">Settings panel will be implemented here.</p>
      </div>
    </div>
  )
}

function AnnouncementsManagement() {
  const router = useRouter()
  const { announcements, fetchAnnouncements, loading } = useAnnouncementsStore()

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const handleCreateAnnouncement = () => {
    router.push('/announcements')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Recent Announcements</h3>
        <button 
          onClick={handleCreateAnnouncement}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Announcement</span>
        </button>
      </div>

      <div>
        {loading ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">No announcements yet. Create your first announcement to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.slice(0, 5).map((announcement: any) => (
              <div key={announcement.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-md font-semibold text-gray-900">{announcement.title}</h4>
                    <span className="text-sm text-gray-500">{announcement.priority}</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
              </div>
            ))}
            <div className="text-center">
              <button 
                onClick={handleCreateAnnouncement}
                className="btn-secondary text-sm"
              >
                View All Announcements
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
