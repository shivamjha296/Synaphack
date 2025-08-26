'use client'

import { useState } from 'react'
import { Event } from '../lib/eventService'
import SponsorShowcase from './SponsorShowcase'
import Leaderboard from './Leaderboard'

interface EventDetailsModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  userRole?: 'participant' | 'organizer' | 'judge'
  userEmail?: string
}

const EventDetailsModal = ({ event, isOpen, onClose, userRole, userEmail }: EventDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'sponsors' | 'leaderboard'>('details')

  if (!isOpen) return null

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    
    let dateObj: Date
    if (typeof date === 'string') {
      dateObj = new Date(date)
    } else if (date.toDate) {
      dateObj = date.toDate()
    } else {
      dateObj = date
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventStatus = () => {
    const now = new Date()
    const startDate = event.timeline?.eventStart ? new Date(event.timeline.eventStart) : new Date()
    const endDate = event.timeline?.eventEnd ? new Date(event.timeline.eventEnd) : new Date()

    if (now < startDate) {
      return { status: 'upcoming', color: 'text-blue-400', text: 'Upcoming' }
    } else if (now >= startDate && now <= endDate) {
      return { status: 'live', color: 'text-green-400', text: 'Live' }
    } else {
      return { status: 'completed', color: 'text-gray-400', text: 'Completed' }
    }
  }

  const eventStatus = getEventStatus()

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="relative">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-purple-600" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Event title and status */}
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{event.title}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border ${eventStatus.color}`}>
                {eventStatus.text}
              </span>
            </div>
            <p className="text-slate-300 text-sm">{event.description}</p>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-slate-700 bg-slate-800/50">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Details', icon: '📋' },
              { id: 'sponsors', label: 'Sponsors', icon: '🤝' },
              { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content area */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Event Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">📅 Event Schedule</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Registration Start:</span>
                        <span className="text-white">{formatDate(event.timeline?.registrationStart)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Registration End:</span>
                        <span className="text-white">{formatDate(event.timeline?.registrationEnd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Event Start:</span>
                        <span className="text-white">{formatDate(event.timeline?.eventStart)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Event End:</span>
                        <span className="text-white">{formatDate(event.timeline?.eventEnd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Submission Deadline:</span>
                        <span className="text-white">{formatDate(event.timeline?.submissionDeadline)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">🎯 Event Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Event Type:</span>
                        <span className="text-white capitalize">{event.eventType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Participants:</span>
                        <span className="text-white">{event.maxParticipants || 'No limit'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Registration Fee:</span>
                        <span className="text-white">₹{event.registrationFee}</span>
                      </div>
                      {event.location && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Location:</span>
                          <span className="text-white">{event.location}</span>
                        </div>
                      )}
                      {event.posterImage && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Event Poster:</span>
                          <a
                            href={event.posterImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline text-sm font-medium flex items-center space-x-1"
                          >
                            <span>View Poster</span>
                            <span>🖼️</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {event.prizes && event.prizes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">🏆 Prizes</h3>
                      <div className="space-y-2">
                        {event.prizes.map((prize: any, index: number) => (
                          <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-green-400">{prize.position}</span>
                              <span className="text-white font-semibold">{prize.amount}</span>
                            </div>
                            {prize.description && (
                              <p className="text-sm text-slate-300 mt-1">{prize.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.rules && event.rules.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">📋 Rules</h3>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {event.rules.map((rule: any, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Description */}
              {event.description && (
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-600">
                  <h3 className="text-lg font-semibold text-white mb-2">📖 About This Event</h3>
                  <p className="text-slate-300 leading-relaxed">{event.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sponsors' && (
            <SponsorShowcase 
              sponsors={event.sponsors || []} 
              title="Event Sponsors"
              compact={false}
            />
          )}

          {activeTab === 'leaderboard' && (
            <div className="mt-4">
              <Leaderboard 
                eventId={event.id || ''} 
                userRole={userRole || 'participant'}
                userEmail={userEmail || ''}
                onClose={() => {}}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventDetailsModal
