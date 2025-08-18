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
  Search
} from 'lucide-react'

import { useAuthStore, useEventsStore } from '@/lib/store'

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

  useEffect(() => {
    setIsClient(true)
  }, [])

  const tabs = [
    { id: 'events', name: 'My Events', icon: Calendar },
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
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'settings' && <Settings />}
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
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">No events created yet. Create your first event to get started!</p>
      </div>
    </div>
  )
}

function AvailableEvents() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Available Events</h3>
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            className="input-field"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Event cards would be rendered here */}
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
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
