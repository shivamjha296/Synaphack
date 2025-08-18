'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Shield, 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Edit, 
  Trash2,
  Download,
  Calendar,
  FileText,
  Trophy,
  Activity
} from 'lucide-react'

import { useAuthStore } from '@/lib/store'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [user, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Mock data - would connect to actual API
      const mockUsers = [
        {
          id: '1',
          email: 'alice@example.com',
          full_name: 'Alice Johnson',
          role: 'organizer',
          is_active: true,
          created_at: '2024-01-10T10:00:00Z',
          last_login: '2024-01-20T14:30:00Z',
          events_count: 3,
          teams_count: 0,
        },
        {
          id: '2',
          email: 'bob@example.com',
          full_name: 'Bob Smith',
          role: 'participant',
          is_active: true,
          created_at: '2024-01-12T08:00:00Z',
          last_login: '2024-01-21T09:15:00Z',
          events_count: 0,
          teams_count: 2,
        },
        {
          id: '3',
          email: 'charlie@example.com',
          full_name: 'Charlie Brown',
          role: 'judge',
          is_active: false,
          created_at: '2024-01-08T16:00:00Z',
          last_login: '2024-01-18T11:45:00Z',
          events_count: 0,
          teams_count: 0,
        },
      ]

      const mockEvents = [
        {
          id: '1',
          name: 'Web3 Hackathon 2024',
          organizer: 'Alice Johnson',
          status: 'active',
          participants_count: 45,
          teams_count: 12,
          submissions_count: 8,
          start_date: '2024-02-01',
          end_date: '2024-02-03',
        },
        {
          id: '2',
          name: 'AI Innovation Challenge',
          organizer: 'Alice Johnson',
          status: 'upcoming',
          participants_count: 23,
          teams_count: 6,
          submissions_count: 0,
          start_date: '2024-03-15',
          end_date: '2024-03-17',
        },
      ]

      const mockStats = {
        total_users: 1234,
        active_users: 890,
        total_events: 45,
        active_events: 8,
        total_submissions: 456,
        pending_reviews: 23,
      }

      setUsers(mockUsers)
      setEvents(mockEvents)
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      console.log(`Performing ${action} on user ${userId}`)
      // Would connect to actual API
      await fetchData() // Refresh data
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
    }
  }

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin access required.</div>
  }

  const tabs = [
    { id: 'users', name: 'Users', icon: Users, count: stats.total_users },
    { id: 'events', name: 'Events', icon: Calendar, count: stats.total_events },
    { id: 'analytics', name: 'Analytics', icon: Activity },
    { id: 'settings', name: 'Settings', icon: Shield },
  ]

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage platform users, events, and settings</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Users" value={stats.total_users?.toLocaleString() || '0'} subtitle={`${stats.active_users || 0} active`} icon={Users} />
          <StatCard title="Total Events" value={stats.total_events?.toString() || '0'} subtitle={`${stats.active_events || 0} active`} icon={Calendar} />
          <StatCard title="Submissions" value={stats.total_submissions?.toLocaleString() || '0'} subtitle={`${stats.pending_reviews || 0} pending`} icon={FileText} />
          <StatCard title="Platform Health" value="99.9%" subtitle="Uptime this month" icon={Activity} />
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
                {tab.count !== undefined && (
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'users' && (
            <UsersManagement 
              users={filteredUsers}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterRole={filterRole}
              setFilterRole={setFilterRole}
              onUserAction={handleUserAction}
            />
          )}
          {activeTab === 'events' && (
            <EventsOverview events={events} loading={loading} />
          )}
          {activeTab === 'analytics' && <PlatformAnalytics />}
          {activeTab === 'settings' && <PlatformSettings />}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: any 
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-primary-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

// Users Management Component
function UsersManagement({ 
  users, 
  loading, 
  searchQuery, 
  setSearchQuery, 
  filterRole, 
  setFilterRole, 
  onUserAction 
}: any) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="input-field"
        >
          <option value="all">All Roles</option>
          <option value="participant">Participants</option>
          <option value="organizer">Organizers</option>
          <option value="judge">Judges</option>
          <option value="admin">Administrators</option>
        </select>
        <button className="btn-secondary flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  <p className="mt-2 text-gray-600">Loading users...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'organizer' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'judge' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Events: {user.events_count}</div>
                    <div>Teams: {user.teams_count}</div>
                    <div>Last login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onUserAction(user.id, user.is_active ? 'deactivate' : 'activate')}
                        className={`text-sm ${user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {user.is_active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => onUserAction(user.id, 'delete')}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Events Overview Component
function EventsOverview({ events, loading }: { events: any[]; loading: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">All Events</h3>
        <button className="btn-secondary flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export Data</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organizer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participants
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  <p className="mt-2 text-gray-600">Loading events...</p>
                </td>
              </tr>
            ) : events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{event.name}</div>
                  <div className="text-sm text-gray-500">{event.participants_count} participants, {event.teams_count} teams</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {event.organizer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.status === 'active' ? 'bg-green-100 text-green-800' :
                    event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{event.participants_count} registered</div>
                  <div>{event.submissions_count} submissions</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{new Date(event.start_date).toLocaleDateString()}</div>
                  <div>to {new Date(event.end_date).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-700 mr-4">
                    View Details
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Platform Analytics Component
function PlatformAnalytics() {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-medium text-gray-900">Platform Analytics</h3>
      
      {/* Charts would go here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-md font-medium text-gray-900 mb-4">User Growth</h4>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart placeholder - User registration over time</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-md font-medium text-gray-900 mb-4">Event Activity</h4>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart placeholder - Events created and completed</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-md font-medium text-gray-900 mb-4">Submission Trends</h4>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart placeholder - Submissions per event</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-md font-medium text-gray-900 mb-4">Platform Usage</h4>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart placeholder - Daily active users</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Platform Settings Component
function PlatformSettings() {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-medium text-gray-900">Platform Settings</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-md font-medium text-gray-900 mb-4">General Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                defaultValue="HackPlatform"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                defaultValue="support@hackplatform.com"
                className="input-field"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-md font-medium text-gray-900 mb-4">Security Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Require Email Verification</div>
                <div className="text-sm text-gray-500">Users must verify email before accessing platform</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Enable Google OAuth</div>
                <div className="text-sm text-gray-500">Allow users to sign in with Google</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button className="btn-primary">Save Settings</button>
      </div>
    </div>
  )
}
