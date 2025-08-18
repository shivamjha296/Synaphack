'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Clock,
  Filter
} from 'lucide-react'

import { useAuthStore, useAnnouncementsStore, useEventsStore } from '@/lib/store'

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  priority: z.enum(['urgent', 'high', 'normal', 'low']),
  target_audience: z.enum(['all', 'participants', 'judges', 'organizers']),
  event_id: z.string().min(1, 'Please select an event'),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

export default function AnnouncementsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const { user } = useAuthStore()
  const { announcements, fetchAnnouncements, createAnnouncement, deleteAnnouncement, markAsRead, loading } = useAnnouncementsStore()
  const { events, fetchEvents } = useEventsStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchAnnouncements()
    if ((user.role === 'organizer' || user.role === 'admin') && events.length === 0) {
      fetchEvents()
    }
  }, [user, router, fetchAnnouncements, fetchEvents, events.length])

  const handleCreateAnnouncement = () => {
    setShowCreateModal(true)
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      await deleteAnnouncement(announcementId)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'normal':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    if (priorityFilter === 'all') return true
    return announcement.priority === priorityFilter
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
              <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
              <p className="text-gray-600">Stay updated with important notifications</p>
            </div>
            {(user.role === 'organizer' || user.role === 'admin') && (
              <button
                onClick={handleCreateAnnouncement}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>New Announcement</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
            <p className="mt-1 text-sm text-gray-500">
              {priorityFilter === 'all' 
                ? 'No announcements have been posted yet.' 
                : `No ${priorityFilter} priority announcements.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onDelete={handleDeleteAnnouncement}
                onMarkRead={markAsRead}
                canDelete={user.role === 'organizer' || user.role === 'admin'}
                getPriorityIcon={getPriorityIcon}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <AnnouncementModal
          events={events}
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            try {
              await createAnnouncement(data)
              setShowCreateModal(false)
            } catch (error) {
              alert(`Error: ${(error as any)?.message || error}`)
            }
          }}
        />
      )}
    </div>
  )
}

// Announcement Card Component
function AnnouncementCard({ 
  announcement, 
  onDelete, 
  onMarkRead, 
  canDelete,
  getPriorityIcon,
  getPriorityColor
}: { 
  announcement: any
  onDelete: (id: string) => void
  onMarkRead: (id: string) => void
  canDelete: boolean
  getPriorityIcon: (priority: string) => JSX.Element
  getPriorityColor: (priority: string) => string
}) {
  const handleMarkRead = () => {
    if (!announcement.is_read) {
      onMarkRead(announcement.id)
    }
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border p-6 ${
        !announcement.is_read ? 'border-l-4 border-l-primary-500' : ''
      }`}
      onClick={handleMarkRead}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          {getPriorityIcon(announcement.priority)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(announcement.priority)}`}>
                {announcement.priority}
              </span>
              <span className="text-sm text-gray-500">
                {announcement.target_audience}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {new Date(announcement.created_at).toLocaleDateString()}
          </div>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(announcement.id)
              }}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
      <div className="mt-4 text-sm text-gray-500">
        By {announcement.author_name}
      </div>
    </div>
  )
}

// Announcement Modal Component
function AnnouncementModal({ 
  events,
  onClose, 
  onSave 
}: { 
  events: any[]
  onClose: () => void
  onSave: (data: AnnouncementFormData) => void 
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      priority: 'normal',
      target_audience: 'all',
    },
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Create New Announcement
          </h2>

          <form onSubmit={handleSubmit(onSave)} className="space-y-6">
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
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title || event.name}
                  </option>
                ))}
              </select>
              {errors.event_id && (
                <p className="mt-1 text-sm text-red-600">{errors.event_id.message}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                {...register('title')}
                type="text"
                className="input-field"
                placeholder="Enter announcement title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                {...register('content')}
                rows={6}
                className="input-field"
                placeholder="Write your announcement content..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>

            {/* Priority and Target Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  {...register('target_audience')}
                  className="input-field"
                >
                  <option value="all">All Users</option>
                  <option value="participants">Participants</option>
                  <option value="judges">Judges</option>
                  <option value="organizers">Organizers</option>
                </select>
              </div>
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
                Create Announcement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
