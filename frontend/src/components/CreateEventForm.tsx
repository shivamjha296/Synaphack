'use client'

import { useState, useEffect } from 'react'
import { Event } from '@/lib/eventService'

interface CreateEventFormProps {
  onClose: () => void
  onEventCreated: () => void
  organizerId: string
  organizerName: string
  editingEvent?: Event | null
}

const CreateEventForm = ({ onClose, onEventCreated, organizerId, organizerName, editingEvent }: CreateEventFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    theme: '',
    eventType: 'online' as const,
    location: '',
    maxParticipants: 100,
    registrationFee: 0,
    timeline: {
      registrationStart: '',
      registrationEnd: '',
      eventStart: '',
      eventEnd: '',
      submissionDeadline: ''
    },
    contactEmail: '',
    status: 'published' as const,
    // Default empty arrays for required fields
    tracks: [] as string[],
    rules: [] as string[],
    technologies: [] as string[],
    eligibility: [] as string[],
    prizes: [] as any[],
    sponsors: [] as any[],
    judgingCriteria: [] as any[]
  })

  // Initialize form data for editing
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description,
        theme: editingEvent.theme,
        eventType: editingEvent.eventType,
        location: editingEvent.location,
        maxParticipants: editingEvent.maxParticipants,
        registrationFee: editingEvent.registrationFee,
        timeline: {
          registrationStart: new Date(editingEvent.timeline.registrationStart).toISOString().slice(0, 16),
          registrationEnd: new Date(editingEvent.timeline.registrationEnd).toISOString().slice(0, 16),
          eventStart: new Date(editingEvent.timeline.eventStart).toISOString().slice(0, 16),
          eventEnd: new Date(editingEvent.timeline.eventEnd).toISOString().slice(0, 16),
          submissionDeadline: new Date(editingEvent.timeline.submissionDeadline).toISOString().slice(0, 16)
        },
        contactEmail: editingEvent.contactEmail,
        status: editingEvent.status,
        tracks: editingEvent.tracks || [],
        rules: editingEvent.rules || [],
        technologies: editingEvent.technologies || [],
        eligibility: editingEvent.eligibility || [],
        prizes: editingEvent.prizes || [],
        sponsors: editingEvent.sponsors || [],
        judgingCriteria: editingEvent.judgingCriteria || []
      })
    }
  }, [editingEvent])

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Event title is required')
      }
      if (!formData.contactEmail.trim()) {
        throw new Error('Contact email is required')
      }
      if (!organizerId) {
        throw new Error('Organizer ID is missing')
      }
      
      // Validate timeline dates
      const validateTimelineDate = (dateStr: string, fieldName: string) => {
        if (!dateStr) {
          throw new Error(`${fieldName} is required`)
        }
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid ${fieldName} date`)
        }
        return date
      }
      
      const timelineDates = {
        registrationStart: validateTimelineDate(formData.timeline.registrationStart, 'Registration Start'),
        registrationEnd: validateTimelineDate(formData.timeline.registrationEnd, 'Registration End'),
        eventStart: validateTimelineDate(formData.timeline.eventStart, 'Event Start'),
        eventEnd: validateTimelineDate(formData.timeline.eventEnd, 'Event End'),
        submissionDeadline: validateTimelineDate(formData.timeline.submissionDeadline, 'Submission Deadline')
      }
      
      // Dynamic import to avoid SSR issues
      const { eventService } = await import('@/lib/eventService')
      
      const eventData = {
        ...formData,
        timeline: timelineDates,
        organizerId,
        organizerName,
        tracks: formData.tracks || [],
        rules: formData.rules || [],
        technologies: formData.technologies || [],
        eligibility: formData.eligibility || [],
        prizes: formData.prizes || [],
        sponsors: formData.sponsors || [],
        judgingCriteria: formData.judgingCriteria || []
      }

      if (editingEvent) {
        // Update existing event
        await eventService.updateEvent(editingEvent.id, eventData)
      } else {
        // Create new event
        await eventService.createEvent(eventData)
      }
      
      onEventCreated()
      onClose()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create event. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-slate-100">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Event Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
              <input
                type="text"
                value={formData.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                placeholder="e.g., AI & Machine Learning, Web Development"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => handleInputChange('eventType', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter venue/location"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Event Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft (Not visible to participants)</option>
                  <option value="published">Published (Available for registration)</option>
                  <option value="ongoing">Ongoing (Event is happening)</option>
                  <option value="completed">Completed (Event finished)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Participants</label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Registration Fee ($)</label>
                <input
                  type="number"
                  value={formData.registrationFee}
                  onChange={(e) => handleInputChange('registrationFee', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contact Email *</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Event Timeline</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Registration Start *</label>
                <input
                  type="datetime-local"
                  value={formData.timeline.registrationStart}
                  onChange={(e) => handleInputChange('timeline.registrationStart', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Registration End *</label>
                <input
                  type="datetime-local"
                  value={formData.timeline.registrationEnd}
                  onChange={(e) => handleInputChange('timeline.registrationEnd', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Event Start *</label>
                <input
                  type="datetime-local"
                  value={formData.timeline.eventStart}
                  onChange={(e) => handleInputChange('timeline.eventStart', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Event End *</label>
                <input
                  type="datetime-local"
                  value={formData.timeline.eventEnd}
                  onChange={(e) => handleInputChange('timeline.eventEnd', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Submission Deadline *</label>
                <input
                  type="datetime-local"
                  value={formData.timeline.submissionDeadline}
                  onChange={(e) => handleInputChange('timeline.submissionDeadline', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-300 border border-slate-600 rounded-md hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading 
                ? (editingEvent ? 'Updating...' : 'Creating...') 
                : (editingEvent ? 'Update Event' : 'Create Event')
              }
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default CreateEventForm