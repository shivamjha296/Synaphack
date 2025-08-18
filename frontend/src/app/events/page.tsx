'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download
} from 'lucide-react'

import { useAuthStore, useEventsStore } from '@/lib/store'

const eventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  start_date: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Invalid start date',
  }),
  end_date: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Invalid end date',
  }),
  registration_deadline: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: 'Invalid registration deadline',
  }),
  max_participants: z.number().min(1, 'Must allow at least 1 participant'),
  max_team_size: z.number().min(1, 'Team size must be at least 1'),
  location: z.string().min(3, 'Location is required'),
  is_virtual: z.boolean(),
  entry_fee: z.number().min(0, 'Entry fee cannot be negative'),
  prizes: z.string().optional(),
  rules: z.string().min(10, 'Rules must be at least 10 characters'),
})

type EventFormData = z.infer<typeof eventSchema>

export default function EventsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const { user } = useAuthStore()
  const { events, fetchEvents, createEvent, updateEvent, deleteEvent, loading } = useEventsStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (user.role !== 'organizer' && user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchEvents()
  }, [user, router, fetchEvents])

  const handleCreateEvent = () => {
    setEditingEvent(null)
    setShowCreateModal(true)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setShowCreateModal(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(eventId)
    }
  }

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return <div>Access denied. Only organizers can manage events.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
              <p className="text-gray-600">Create and manage your hackathons</p>
            </div>
            <button
              onClick={handleCreateEvent}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
            <div className="mt-6">
              <button
                onClick={handleCreateEvent}
                className="btn-primary"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Event
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => handleEditEvent(event)}
                onDelete={() => handleDeleteEvent(event.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <EventModal
          event={editingEvent}
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            if (editingEvent) {
              await updateEvent(editingEvent.id, data)
            } else {
              await createEvent(data)
            }
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

// Event Card Component
function EventCard({ event, onEdit, onDelete }: { 
  event: any; 
  onEdit: () => void; 
  onDelete: () => void 
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
              {event.status}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2" />
            {event.location}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-2" />
            {event.registered_count || 0} / {event.max_participants} participants
          </div>
          {event.entry_fee > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <DollarSign className="h-4 w-4 mr-2" />
              ${event.entry_fee}
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button className="btn-secondary text-sm flex-1">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </button>
          <button className="btn-secondary text-sm">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Event Modal Component
function EventModal({ 
  event, 
  onClose, 
  onSave 
}: { 
  event?: any; 
  onClose: () => void; 
  onSave: (data: EventFormData) => void 
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event ? {
      name: event.name,
      description: event.description,
      start_date: event.start_date?.slice(0, 16),
      end_date: event.end_date?.slice(0, 16),
      registration_deadline: event.registration_deadline?.slice(0, 16),
      max_participants: event.max_participants,
      max_team_size: event.max_team_size,
      location: event.location,
      is_virtual: event.is_virtual,
      entry_fee: event.entry_fee,
      prizes: event.prizes,
      rules: event.rules,
    } : {
      max_participants: 100,
      max_team_size: 4,
      entry_fee: 0,
      is_virtual: false,
    },
  })

  const isVirtual = watch('is_virtual')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>

          <form onSubmit={handleSubmit(onSave)} className="space-y-6">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name
              </label>
              <input
                {...register('name')}
                type="text"
                className="input-field"
                placeholder="Enter event name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-field"
                placeholder="Describe your event..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time
                </label>
                <input
                  {...register('start_date')}
                  type="datetime-local"
                  className="input-field"
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time
                </label>
                <input
                  {...register('end_date')}
                  type="datetime-local"
                  className="input-field"
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            {/* Registration Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Deadline
              </label>
              <input
                {...register('registration_deadline')}
                type="datetime-local"
                className="input-field"
              />
              {errors.registration_deadline && (
                <p className="mt-1 text-sm text-red-600">{errors.registration_deadline.message}</p>
              )}
            </div>

            {/* Virtual Event Toggle */}
            <div className="flex items-center">
              <input
                {...register('is_virtual')}
                type="checkbox"
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="ml-3 text-sm text-gray-700">
                This is a virtual event
              </label>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isVirtual ? 'Virtual Platform/Link' : 'Location'}
              </label>
              <input
                {...register('location')}
                type="text"
                className="input-field"
                placeholder={isVirtual ? "e.g., Zoom, Discord, etc." : "Event venue address"}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            {/* Participant & Team Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Participants
                </label>
                <input
                  {...register('max_participants', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="input-field"
                />
                {errors.max_participants && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_participants.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Team Size
                </label>
                <input
                  {...register('max_team_size', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="input-field"
                />
                {errors.max_team_size && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_team_size.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Fee ($)
                </label>
                <input
                  {...register('entry_fee', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                />
                {errors.entry_fee && (
                  <p className="mt-1 text-sm text-red-600">{errors.entry_fee.message}</p>
                )}
              </div>
            </div>

            {/* Prizes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prizes (Optional)
              </label>
              <textarea
                {...register('prizes')}
                rows={3}
                className="input-field"
                placeholder="Describe the prizes for winners..."
              />
            </div>

            {/* Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rules & Guidelines
              </label>
              <textarea
                {...register('rules')}
                rows={4}
                className="input-field"
                placeholder="Event rules and guidelines..."
              />
              {errors.rules && (
                <p className="mt-1 text-sm text-red-600">{errors.rules.message}</p>
              )}
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
                {event ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
