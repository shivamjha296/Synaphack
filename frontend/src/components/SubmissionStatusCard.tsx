import { useState, useEffect } from 'react'
import { submissionService, RoundSubmission } from '../lib/submissionService'
import { certificateService, Certificate } from '../lib/certificateService'
import { Event } from '../lib/eventService'

interface SubmissionStatusCardProps {
  event: Event & { registrationData: any }
  submissions: RoundSubmission[]
  onOpenSubmissionForm: (event: Event, round: any) => void
  loading?: boolean
  userEmail?: string // Add user email to check team leadership
}

const SubmissionStatusCard = ({ 
  event, 
  submissions, 
  onOpenSubmissionForm, 
  loading = false,
  userEmail
}: SubmissionStatusCardProps) => {
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set())
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certificateLoading, setCertificateLoading] = useState(false)
  const [showCertificates, setShowCertificates] = useState(false)

  // Check if current user is team leader
  const isTeamLeader = () => {
    if (!event.registrationData?.teamName || !userEmail) return true // Solo or no team
    return event.registrationData?.teamCreator === userEmail
  }

  const isTeamMember = () => {
    return event.registrationData?.teamName && !isTeamLeader()
  }

  // Load certificates for this event
  useEffect(() => {
    if (event.id) {
      loadEventCertificates()
    }
  }, [event.id, submissions])

  const loadEventCertificates = async () => {
    try {
      setCertificateLoading(true)
      const userEmail = JSON.parse(localStorage.getItem('user') || '{}').email
      if (userEmail) {
        const allCerts = await certificateService.getParticipantCertificates(userEmail)
        const eventCerts = allCerts.filter(cert => cert.eventId === event.id)
        setCertificates(eventCerts)
      }
    } catch (error) {
      console.error('Error loading certificates:', error)
    } finally {
      setCertificateLoading(false)
    }
  }

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      await certificateService.downloadCertificateAsPDF(certificateId)
    } catch (error) {
      console.error('Error downloading certificate:', error)
      alert('Failed to download certificate.')
    }
  }

  const hasSuccessfulSubmissions = () => {
    return submissions.some(sub => 
      sub.status === 'approved' || 
      sub.status === 'reviewed'
    )
  }

  const toggleRoundExpansion = (roundId: string) => {
    const newExpanded = new Set(expandedRounds)
    if (newExpanded.has(roundId)) {
      newExpanded.delete(roundId)
    } else {
      newExpanded.add(roundId)
    }
    setExpandedRounds(newExpanded)
  }

  const getSubmissionForRound = (roundId: string): RoundSubmission | undefined => {
    return submissions.find(s => s.roundId === roundId)
  }

  // Create default round if event doesn't have rounds defined
  const eventRounds = event.rounds && event.rounds.length > 0 
    ? event.rounds 
    : [{
        id: 'main',
        name: 'Main Submission',
        description: 'Primary project submission',
        startDate: event.timeline?.eventStart || new Date(),
        endDate: event.timeline?.eventEnd || new Date(),
        submissionDeadline: event.timeline?.submissionDeadline || new Date(),
        requirements: 'Submit your project files and documentation'
      }]

  const isDeadlinePassed = (deadline: Date): boolean => {
    return new Date() > deadline
  }

  const getTimeUntilDeadline = (deadline: Date): string => {
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    
    if (diff < 0) return 'Deadline passed'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours === 0) return `${minutes}m left`
    if (hours < 24) return `${hours}h ${minutes}m left`
    
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}d ${remainingHours}h left`
  }

  const getSubmissionStatus = (roundId: string) => {
    const submission = getSubmissionForRound(roundId)
    if (!submission) return 'not_submitted'
    return submission.status
  }

  const getStatusColor = (status: string, isLate: boolean) => {
    if (isLate) return 'bg-red-900/30 text-red-400 border-red-600'
    
    switch (status) {
      case 'submitted': return 'bg-green-900/30 text-green-400 border-green-600'
      case 'late': return 'bg-yellow-900/30 text-yellow-400 border-yellow-600'
      case 'reviewed': return 'bg-blue-900/30 text-blue-400 border-blue-600'
      case 'approved': return 'bg-purple-900/30 text-purple-400 border-purple-600'
      case 'rejected': return 'bg-red-900/30 text-red-400 border-red-600'
      default: return 'bg-gray-900/30 text-gray-400 border-gray-600'
    }
  }

  const getStatusIcon = (status: string, isLate: boolean) => {
    if (isLate) return '❌'
    
    switch (status) {
      case 'submitted': return '✅'
      case 'late': return '⚠️'
      case 'reviewed': return '👁️'
      case 'approved': return '🎉'
      case 'rejected': return '❌'
      default: return '📝'
    }
  }

  const totalRounds = eventRounds.length
  const submittedRounds = eventRounds.filter(round => 
    getSubmissionStatus(round.id) !== 'not_submitted'
  ).length

  const overallProgress = totalRounds > 0 ? (submittedRounds / totalRounds) * 100 : 0

  return (
    <div className="border border-green-600/30 rounded-lg bg-green-900/10 overflow-hidden">
      {/* Event Header */}
      <div className="p-6 border-b border-green-600/30">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-100 mb-2">{event.title}</h3>
            <p className="text-slate-300 mb-3 line-clamp-2">{event.description}</p>
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-400">Submission Progress</span>
                <span className="text-sm text-green-400 font-medium">
                  {submittedRounds}/{totalRounds} rounds
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Event End:</span>
                <span className="ml-2 text-slate-200">
                  {event.timeline?.eventEnd ? new Date(event.timeline.eventEnd).toLocaleDateString() : 'TBD'}
                </span>
              </div>
              {event.timeline?.submissionDeadline && (
                <div>
                  <span className="text-slate-400">Main Deadline:</span>
                  <span className="ml-2 text-slate-200">
                    {new Date(event.timeline.submissionDeadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              event.status === 'ongoing' ? 'bg-green-900/30 text-green-400 border-green-600' :
              event.status === 'completed' ? 'bg-gray-900/30 text-gray-400 border-gray-600' :
              'bg-blue-900/30 text-blue-400 border-blue-600'
            }`}>
              {event.status}
            </span>
            
            {loading && (
              <div className="text-xs text-slate-400 flex items-center space-x-1">
                <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rounds/Submissions */}
      <div className="p-6">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-100 mb-3">
            {eventRounds.length === 1 && eventRounds[0].id === 'main' 
              ? 'Project Submission' 
              : 'Round Submissions'}
          </h4>
          
          {eventRounds.map((round, index) => {
              const submission = getSubmissionForRound(round.id)
              const status = getSubmissionStatus(round.id)
              const isLate = round.submissionDeadline && isDeadlinePassed(round.submissionDeadline)
              const isExpanded = expandedRounds.has(round.id)

              return (
                <div 
                  key={round.id}
                  className={`border rounded-lg transition-all ${
                    submission ? 'border-green-600/30 bg-green-900/10' : 
                    isLate ? 'border-red-600/30 bg-red-900/10' : 
                    'border-slate-600/30 bg-slate-800/50'
                  }`}
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                    onClick={() => toggleRoundExpansion(round.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {getStatusIcon(status, isLate || false)}
                        </span>
                        <div>
                          <h5 className="font-medium text-slate-100">
                            Round {index + 1}: {round.name}
                          </h5>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-slate-400">
                              Due: {round.submissionDeadline ? 
                                new Date(round.submissionDeadline).toLocaleDateString() : 
                                'No deadline'
                              }
                            </span>
                            {round.submissionDeadline && !isLate && (
                              <span className="text-yellow-400 font-medium">
                                {getTimeUntilDeadline(round.submissionDeadline)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(status, isLate || false)}`}>
                          {status === 'not_submitted' ? (isLate ? 'Missed' : 'Pending') : 
                           status === 'submitted' ? 'Submitted' :
                           status === 'late' ? 'Late' :
                           status === 'reviewed' ? 'Reviewed' :
                           status === 'approved' ? 'Approved' :
                           status === 'rejected' ? 'Rejected' : status
                          }
                        </span>
                        
                        {/* Team submission indicator */}
                        {submission?.isTeamSubmission && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900/30 border border-blue-500/30 text-blue-300">
                            👥 Team
                          </span>
                        )}
                        
                        <button className="text-slate-400 hover:text-slate-200">
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-600/30">
                      <div className="pt-4 space-y-3">
                        {round.description && (
                          <p className="text-sm text-slate-300">{round.description}</p>
                        )}
                        
                        {round.requirements && (
                          <div className="text-sm">
                            <span className="text-slate-400">Requirements: </span>
                            <span className="text-slate-200">{round.requirements}</span>
                          </div>
                        )}

                        {submission && (
                          <div className="bg-slate-800/50 rounded p-3 space-y-2">
                            {/* Team context indicator */}
                            {isTeamMember() && submission.isTeamSubmission && (
                              <div className="text-sm bg-blue-900/30 border border-blue-500/30 rounded p-2 mb-2">
                                <span className="text-blue-300">👥 Team Submission</span>
                                <span className="text-blue-200 ml-2">
                                  Submitted by your team leader ({submission.participantEmail})
                                </span>
                              </div>
                            )}
                            
                            <div className="text-sm">
                              <span className="text-slate-400">Submitted: </span>
                              <span className="text-slate-200">
                                {submission.submittedAt.toLocaleDateString()} at {submission.submittedAt.toLocaleTimeString()}
                              </span>
                            </div>
                            
                            {submission.feedback && (
                              <div className="text-sm">
                                <span className="text-slate-400">Feedback: </span>
                                <span className="text-slate-200">{submission.feedback}</span>
                              </div>
                            )}
                            
                            {submission.score && (
                              <div className="text-sm">
                                <span className="text-slate-400">Score: </span>
                                <span className="text-purple-300 font-medium">{submission.score}/100</span>
                              </div>
                            )}
                            
                            {/* Submission Content */}
                            <div className="pt-3 border-t border-slate-600/30">
                              <h6 className="text-sm font-medium text-slate-300 mb-2">Submission Details:</h6>
                              <div className="space-y-2">
                                {submission.submissionData.description && (
                                  <div className="text-sm">
                                    <span className="text-slate-400">Description: </span>
                                    <p className="text-slate-200 mt-1">{submission.submissionData.description}</p>
                                  </div>
                                )}
                                
                                {submission.submissionData.githubLink && (
                                  <div className="text-sm">
                                    <span className="text-slate-400">GitHub: </span>
                                    <a 
                                      href={submission.submissionData.githubLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 underline"
                                    >
                                      {submission.submissionData.githubLink}
                                    </a>
                                  </div>
                                )}
                                
                                {submission.submissionData.pptLink && (
                                  <div className="text-sm">
                                    <span className="text-slate-400">Presentation: </span>
                                    <a 
                                      href={submission.submissionData.pptLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 underline"
                                    >
                                      {submission.submissionData.pptLink}
                                    </a>
                                  </div>
                                )}
                                
                                {submission.submissionData.videoLink && (
                                  <div className="text-sm">
                                    <span className="text-slate-400">Video: </span>
                                    <a 
                                      href={submission.submissionData.videoLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 underline"
                                    >
                                      {submission.submissionData.videoLink}
                                    </a>
                                  </div>
                                )}
                                
                                {submission.submissionData.additionalLinks && submission.submissionData.additionalLinks.length > 0 && (
                                  <div className="text-sm">
                                    <span className="text-slate-400">Additional Links: </span>
                                    <div className="mt-1 space-y-1">
                                      {submission.submissionData.additionalLinks.map((link, index) => (
                                        <div key={index}>
                                          <span className="text-slate-300">{link.name}: </span>
                                          <a 
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 underline"
                                          >
                                            {link.url}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {submission.submissionData.tags && submission.submissionData.tags.length > 0 && (
                                  <div className="text-sm">
                                    <span className="text-slate-400">Tags: </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {submission.submissionData.tags.map((tag, index) => (
                                        <span key={index} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          {isTeamMember() ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-slate-400">Only team leader can submit</span>
                              {!submission && (
                                <div className="px-4 py-2 bg-slate-600 text-slate-300 rounded cursor-not-allowed text-sm font-medium">
                                  {isLate ? 'Submit Late' : 'Submit'}
                                </div>
                              )}
                            </div>
                          ) : submission ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenSubmissionForm(event, round)
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Update Submission
                            </button>
                          ) : isLate ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenSubmissionForm(event, round)
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                              Submit Late
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenSubmissionForm(event, round)
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              Submit Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Certificates Section */}
      {hasSuccessfulSubmissions() && (
        <div className="px-6 py-4 bg-yellow-900/10 border-t border-yellow-600/30">
          <div className="flex justify-between items-center">
            <div>
              <h5 className="font-semibold text-slate-100 mb-1">Certificates Available</h5>
              <p className="text-sm text-slate-400">Download your achievement certificates</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCertificates(!showCertificates)}
                className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded text-sm hover:bg-yellow-600/30 transition-colors"
              >
                {showCertificates ? 'Hide' : 'View'} Certificates
              </button>
            </div>
          </div>

          {showCertificates && (
            <div className="mt-4 space-y-3">
              {certificateLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
                  <span className="ml-2 text-sm text-slate-400">Loading certificates...</span>
                </div>
              ) : certificates.length > 0 ? (
                certificates.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {cert.template === 'winner' ? '🏆' :
                         cert.template === 'achievement' ? '🎖️' :
                         cert.template === 'completion' ? '✅' : '📜'}
                      </div>
                      <div>
                        <h6 className="font-medium text-slate-100 capitalize">
                          {cert.template} Certificate
                        </h6>
                        <p className="text-xs text-slate-400">
                          Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadCertificate(cert.id!)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      📥 Download
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-400">
                    Certificates are being processed. They will appear here once approved submissions are reviewed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions Footer */}
      <div className="px-6 py-4 bg-green-900/20 border-t border-green-600/30">
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <button 
              onClick={() => {/* View Details logic */}}
              className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
            >
              View Details
            </button>
            <button 
              onClick={() => {/* Join Chat logic */}}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
            >
              💬 Join Chat
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-green-400 font-medium">Registered</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubmissionStatusCard
