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
    eventType: 'online' as 'online' | 'offline' | 'hybrid',
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
    status: 'published' as 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled',
    // Default empty arrays for required fields
    tracks: [] as string[],
    rules: [] as string[],
    technologies: [] as string[],
    eligibility: [] as string[],
    prizes: [] as any[],
    sponsors: [] as any[],
    judgingCriteria: [] as any[],
    rounds: [] as any[]
  })

  // Initialize form data for editing
  useEffect(() => {
    if (editingEvent) {
      // Helper function to safely convert date
      const safeToDateString = (dateValue: any) => {
        if (!dateValue) return ''
        
        try {
          // If it's a Firestore Timestamp, convert to date
          if (dateValue && typeof dateValue.toDate === 'function') {
            return dateValue.toDate().toISOString().slice(0, 16)
          }
          // If it's already a Date object or date string
          const date = new Date(dateValue)
          if (!isNaN(date.getTime())) {
            return date.toISOString().slice(0, 16)
          }
        } catch (error) {
          console.warn('Invalid date value:', dateValue, error)
        }
        return ''
      }

      setFormData({
        title: editingEvent.title,
        description: editingEvent.description,
        theme: editingEvent.theme,
        eventType: editingEvent.eventType,
        location: editingEvent.location || '',
        maxParticipants: editingEvent.maxParticipants,
        registrationFee: editingEvent.registrationFee,
        timeline: {
          registrationStart: safeToDateString(editingEvent.timeline.registrationStart),
          registrationEnd: safeToDateString(editingEvent.timeline.registrationEnd),
          eventStart: safeToDateString(editingEvent.timeline.eventStart),
          eventEnd: safeToDateString(editingEvent.timeline.eventEnd),
          submissionDeadline: safeToDateString(editingEvent.timeline.submissionDeadline)
        },
        contactEmail: editingEvent.contactEmail,
        status: editingEvent.status,
        tracks: editingEvent.tracks || [],
        rules: editingEvent.rules || [],
        technologies: editingEvent.technologies || [],
        eligibility: editingEvent.eligibility || [],
        prizes: editingEvent.prizes || [],
        sponsors: editingEvent.sponsors || [],
        judgingCriteria: editingEvent.judgingCriteria || [],
        rounds: editingEvent.rounds?.map(round => ({
            id: round.id,
            name: round.name,
            description: round.description,
            startDate: safeToDateString(round.startDate),
            endDate: safeToDateString(round.endDate),
            submissionDeadline: safeToDateString(round.submissionDeadline),
            requirements: round.requirements,
            maxParticipants: round.maxParticipants?.toString() || '',
            eliminationCriteria: round.eliminationCriteria || ''
          })) || []
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
      
      // Process rounds with date conversion
      const processedRounds = formData.rounds.map((round: any) => ({
        id: round.id,
        name: round.name,
        description: round.description,
        startDate: round.startDate ? new Date(round.startDate) : new Date(),
        endDate: round.endDate ? new Date(round.endDate) : new Date(),
        submissionDeadline: round.submissionDeadline ? new Date(round.submissionDeadline) : new Date(),
        requirements: round.requirements,
        maxParticipants: round.maxParticipants ? parseInt(round.maxParticipants) : undefined,
        eliminationCriteria: round.eliminationCriteria
      }))
      
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
        judgingCriteria: formData.judgingCriteria || [],
        rounds: processedRounds
      }

      if (editingEvent && editingEvent.id) {
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

          {/* Hackathon Rounds */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-100">Hackathon Rounds</h3>
              <button
                type="button"
                onClick={() => {
                  const newRound = {
                    id: Date.now().toString(),
                    name: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    submissionDeadline: '',
                    requirements: '',
                    maxParticipants: '',
                    eliminationCriteria: ''
                  }
                  setFormData(prev => ({
                    ...prev,
                    rounds: [...prev.rounds, newRound]
                  }))
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Add Round
              </button>
            </div>
            
            {formData.rounds.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-600 rounded-lg">
                <p className="text-slate-400">No rounds added yet. Click "Add Round" to create your first hackathon round.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.rounds.map((round: any, index: number) => (
                  <div key={round.id} className="border border-slate-600 rounded-lg p-4 bg-slate-700/30">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-slate-100">Round {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            rounds: prev.rounds.filter((_: any, i: number) => i !== index)
                          }))
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Round Name *</label>
                        <input
                          type="text"
                          value={round.name}
                          onChange={(e) => {
                            const updatedRounds = [...formData.rounds]
                            updatedRounds[index] = { ...round, name: e.target.value }
                            setFormData(prev => ({ ...prev, rounds: updatedRounds }))
                          }}
                          placeholder="e.g., Ideation Round, Prototype Round, Final Round"
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Max Participants</label>
                        <input
                          type="number"
                          value={round.maxParticipants}
                          onChange={(e) => {
                            const updatedRounds = [...formData.rounds]
                            updatedRounds[index] = { ...round, maxParticipants: e.target.value }
                            setFormData(prev => ({ ...prev, rounds: updatedRounds }))
                          }}
                          placeholder="Leave empty for no limit"
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <textarea
                          value={round.description}
                          onChange={(e) => {
                            const updatedRounds = [...formData.rounds]
                            updatedRounds[index] = { ...round, description: e.target.value }
                            setFormData(prev => ({ ...prev, rounds: updatedRounds }))
                          }}
                          placeholder="Describe what participants need to do in this round..."
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Round Start *</label>
                        <input
                          type="datetime-local"
                          value={round.startDate}
                          onChange={(e) => {
                            const updatedRounds = [...formData.rounds]
                            updatedRounds[index] = { ...round, startDate: e.target.value }
                            setFormData(prev => ({ ...prev, rounds: updatedRounds }))
                          }}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Round End *</label>
                        <input
                          type="datetime-local"
                          value={round.endDate}
                          onChange={(e) => {
                            const updatedRounds = [...formData.rounds]
                            updatedRounds[index] = { ...round, endDate: e.target.value }
                            setFormData(prev => ({ ...prev, rounds: updatedRounds }))
                          }}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Submission Deadline *</label>
                        <input
                          type="datetime-local"
                          value={round.submissionDeadline}
                          onChange={(e) => {
                            const updatedRounds = [...formData.rounds]
                            updatedRounds[index] = { ...round, submissionDeadline: e.target.value }
                            setFormData(prev => ({ ...prev, rounds: updatedRounds }))
                          }}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Requirements</label>
                        <input
                          type="text"
                          value={round.requirements}
                          onChange={(e) => {
                            const updatedRounds = [...formData.rounds]
                            updatedRounds[index] = { ...round, requirements: e.target.value }
                            setFormData(prev => ({ ...prev, rounds: updatedRounds }))
                          }}
                          placeholder="e.g., PPT submission, Working prototype, Demo video"
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Elimination Criteria</label>
                        <textarea
                          value={round.eliminationCriteria}
                          onChange={(e) => {
                            const updatedRounds = [...formData.rounds]
                            updatedRounds[index] = { ...round, eliminationCriteria: e.target.value }
                            setFormData(prev => ({ ...prev, rounds: updatedRounds }))
                          }}
                          placeholder="Describe how participants will be eliminated or selected for the next round..."
                          rows={2}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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