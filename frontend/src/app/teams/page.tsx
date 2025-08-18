'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  UserPlus, 
  UserMinus, 
  Crown,
  Calendar,
  Award,
  ExternalLink
} from 'lucide-react'

import { useAuthStore, useTeamsStore } from '@/lib/store'

const teamSchema = z.object({
  name: z.string().min(3, 'Team name must be at least 3 characters'),
  description: z.string().optional(),
  event_id: z.string().min(1, 'Please select an event'),
})

type TeamFormData = z.infer<typeof teamSchema>

export default function TeamsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('my-teams')
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuthStore()
  const { teams, fetchTeams, createTeam, joinTeam, leaveTeam, loading } = useTeamsStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchTeams()
  }, [user, router, fetchTeams])

  const tabs = [
    { id: 'my-teams', name: 'My Teams', count: teams.filter(t => t.is_member).length },
    { id: 'discover', name: 'Discover Teams', count: teams.filter(t => !t.is_member && !t.is_full).length },
    { id: 'invitations', name: 'Invitations', count: 0 }, // TODO: Add invitation system
  ]

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    switch (activeTab) {
      case 'my-teams':
        return matchesSearch && team.is_member
      case 'discover':
        return matchesSearch && !team.is_member && !team.is_full
      default:
        return matchesSearch
    }
  })

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
              <p className="text-gray-600">Form teams and collaborate on projects</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading teams...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {activeTab === 'my-teams' ? 'No teams yet' : 'No teams found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'my-teams' 
                ? 'Create a team or join an existing one to get started.' 
                : 'Try adjusting your search or create a new team.'}
            </p>
            {activeTab === 'my-teams' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Team
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                currentUser={user}
                activeTab={activeTab}
                onJoin={() => joinTeam(team.id)}
                onLeave={() => leaveTeam(team.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            await createTeam(data)
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

// Team Card Component
function TeamCard({ 
  team, 
  currentUser, 
  activeTab, 
  onJoin, 
  onLeave 
}: { 
  team: any; 
  currentUser: any; 
  activeTab: string;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const isLeader = team.leader_id === currentUser.id
  const memberCount = team.members?.length || 0
  const isAtCapacity = memberCount >= team.max_size

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Team Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.name}</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              {team.event_name}
            </div>
          </div>
          {isLeader && (
            <Crown className="h-5 w-5 text-yellow-500" title="Team Leader" />
          )}
        </div>

        {/* Description */}
        {team.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{team.description}</p>
        )}

        {/* Team Stats */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Members</span>
            <span className="font-medium">
              {memberCount} / {team.max_size}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${(memberCount / team.max_size) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Team Members */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Members</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {team.members?.slice(0, 3).map((member: any) => (
              <div
                key={member.id}
                className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1"
              >
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs">
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-gray-700">{member.full_name}</span>
                {member.id === team.leader_id && (
                  <Crown className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            ))}
            {memberCount > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{memberCount - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {activeTab === 'my-teams' ? (
            <>
              {isLeader ? (
                <button className="btn-secondary text-sm flex-1">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite Members
                </button>
              ) : (
                <button
                  onClick={onLeave}
                  className="btn-secondary text-sm flex-1 text-red-600 hover:text-red-700"
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Leave Team
                </button>
              )}
              <button className="btn-secondary text-sm">
                <ExternalLink className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onJoin}
              disabled={isAtCapacity}
              className={`flex-1 text-sm ${
                isAtCapacity 
                  ? 'btn-secondary opacity-50 cursor-not-allowed' 
                  : 'btn-primary'
              }`}
            >
              {isAtCapacity ? 'Team Full' : 'Join Team'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Create Team Modal
function CreateTeamModal({ 
  onClose, 
  onSave 
}: { 
  onClose: () => void; 
  onSave: (data: TeamFormData) => void 
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
  })

  // Mock events for now - this would come from the events store
  const mockEvents = [
    { id: '1', name: 'Web3 Hackathon 2024' },
    { id: '2', name: 'AI Innovation Challenge' },
    { id: '3', name: 'Climate Tech Hackathon' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Team</h2>

          <form onSubmit={handleSubmit(onSave)} className="space-y-6">
            {/* Team Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name
              </label>
              <input
                {...register('name')}
                type="text"
                className="input-field"
                placeholder="Enter team name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Event Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event
              </label>
              <select
                {...register('event_id')}
                className="input-field"
              >
                <option value="">Select an event</option>
                {mockEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
              {errors.event_id && (
                <p className="mt-1 text-sm text-red-600">{errors.event_id.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="input-field"
                placeholder="Describe your team's goals, skills needed, etc."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Create Team
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Team Detail Component (when clicking on a team)
function TeamDetail({ teamId }: { teamId: string }) {
  // This would be a separate page/modal showing detailed team information
  // Including member management, submissions, etc.
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Team Details</h3>
      <p className="text-gray-600">Detailed team view would be implemented here.</p>
    </div>
  )
}
