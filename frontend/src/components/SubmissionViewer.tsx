'use client'

import { useState, useEffect } from 'react'
import { submissionService, RoundSubmission, SubmissionStats } from '@/lib/submissionService'
import { judgeInviteService } from '@/lib/judgeInviteService'

interface SubmissionViewerProps {
  event: any
  onClose: () => void
}

const SubmissionViewer = ({ event, onClose }: SubmissionViewerProps) => {
  const [submissions, setSubmissions] = useState<RoundSubmission[]>([])
  const [stats, setStats] = useState<SubmissionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRound, setSelectedRound] = useState<string>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<RoundSubmission | null>(null)
  const [reviewMode, setReviewMode] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    checkUserAuthorization()
  }, [event.id])
  
  const checkUserAuthorization = async () => {
    try {
      setAuthChecking(true)
      // Get the current user from localStorage
      const userData = localStorage.getItem('user')
      if (!userData) {
        setIsAuthorized(false)
        setAuthChecking(false)
        return
      }
      
      const user = JSON.parse(userData)
      
      // Organizers always have access
      if (user.role === 'organizer') {
        setIsAuthorized(true)
        loadSubmissions()
        loadStats()
        setAuthChecking(false)
        return
      }
      
      // For judges, check if they're assigned to this event
      if (user.role === 'judge') {
        const isAssigned = await judgeInviteService.isJudgeAssignedToEvent(user.email, event.id)
        setIsAuthorized(isAssigned)
        
        if (isAssigned) {
          // If authorized, load submissions and stats
          loadSubmissions()
          loadStats()
        }
      } else {
        // Other roles are not authorized
        setIsAuthorized(false)
      }
    } catch (error) {
      console.error('Error checking user authorization:', error)
      setIsAuthorized(false)
    } finally {
      setAuthChecking(false)
    }
  }

  const loadSubmissions = async () => {
    try {
      console.log('Loading submissions for event:', event.id)
      const eventSubmissions = await submissionService.getEventSubmissions(event.id!)
      console.log('Found submissions:', eventSubmissions)
      setSubmissions(eventSubmissions)
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const submissionStats = await submissionService.getSubmissionStats(event.id!)
      setStats(submissionStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const filteredSubmissions = selectedRound === 'all' 
    ? submissions 
    : submissions.filter(s => s.roundId === selectedRound)

  const handleReviewSubmission = (submission: RoundSubmission) => {
    setSelectedSubmission(submission)
    setReviewMode(true)
    setFeedback(submission.feedback || '')
    setScore(submission.score?.toString() || '')
  }

  const submitReview = async () => {
    if (!selectedSubmission) return
    
    try {
      await submissionService.updateSubmission(selectedSubmission.id!, {
        feedback,
        score: score ? parseFloat(score) : undefined,
        status: 'reviewed'
      })
      
      // Refresh submissions
      await loadSubmissions()
      await loadStats()
      
      setReviewMode(false)
      setSelectedSubmission(null)
    } catch (error) {
      console.error('Error submitting review:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-green-400 bg-green-900/30'
      case 'late': return 'text-yellow-400 bg-yellow-900/30'
      case 'reviewed': return 'text-blue-400 bg-blue-900/30'
      case 'approved': return 'text-purple-400 bg-purple-900/30'
      case 'rejected': return 'text-red-400 bg-red-900/30'
      default: return 'text-slate-400 bg-slate-700'
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  const getRoundName = (roundId: string) => {
    const round = event.rounds?.find((r: any) => r.id === roundId)
    return round ? round.name : 'Unknown Round'
  }

  if (authChecking) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-fuchsia-500/30 rounded-xl p-8 w-full max-w-md shadow-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto mb-4"></div>
          <p className="text-fuchsia-300 font-medium">Verifying access...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-fuchsia-500/30 rounded-xl p-8 w-full max-w-md shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-purple-200 mb-6">You are not authorized to view submissions for this event. Please use a valid judge invite code to gain access.</p>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white px-6 py-2 rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-400">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Event Submissions</h2>
            <p className="text-slate-300 mt-1">{event.title}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                loadSubmissions()
                loadStats()
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="p-6 border-b border-slate-700 bg-slate-700/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalSubmissions}</div>
                <div className="text-sm text-slate-400">Total Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.onTimeSubmissions}</div>
                <div className="text-sm text-slate-400">On Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.lateSubmissions}</div>
                <div className="text-sm text-slate-400">Late</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {stats.averageScore ? stats.averageScore.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-slate-400">Avg Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-slate-300">Filter by Round:</label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Rounds</option>
              {event.rounds?.map((round: any) => (
                <option key={round.id} value={round.id}>
                  {round.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submissions List */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700 rounded-lg mx-auto mb-4 flex items-center justify-center text-2xl">
                📝
              </div>
              <h3 className="text-lg font-medium text-slate-100 mb-2">No submissions yet</h3>
              <p className="text-slate-400 mb-4">
                {selectedRound === 'all' 
                  ? 'No submissions have been made for this event yet. Participants can submit through their dashboard.'
                  : 'No submissions for the selected round'
                }
              </p>
              <button
                onClick={() => {
                  loadSubmissions()
                  loadStats()
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                🔄 Check for New Submissions
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-100">
                          {submission.participantName}
                          {submission.teamName && (
                            <span className="text-slate-400 ml-2">({submission.teamName})</span>
                          )}
                        </h4>
                        <p className="text-sm text-slate-400">{submission.participantEmail}</p>
                        <p className="text-sm text-slate-300 mt-1">{getRoundName(submission.roundId)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status.toUpperCase()}
                        </span>
                        {submission.score && (
                          <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs">
                            Score: {submission.score}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      {submission.submissionData.pptLink && (
                        <a
                          href={submission.submissionData.pptLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-900/30 text-blue-300 rounded hover:bg-blue-800/30 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z"/>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74zM14 9h-1V4l5 5h-4z"/>
                          </svg>
                          <span>Presentation</span>
                        </a>
                      )}
                      {submission.submissionData.githubLink && (
                        <a
                          href={submission.submissionData.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-3 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          <span>GitHub</span>
                        </a>
                      )}
                      {submission.submissionData.videoLink && (
                        <a
                          href={submission.submissionData.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-3 py-2 bg-red-900/30 text-red-300 rounded hover:bg-red-800/30 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          <span>Demo Video</span>
                        </a>
                      )}
                    </div>

                    {submission.submissionData.additionalLinks && submission.submissionData.additionalLinks.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-slate-300 mb-2">Additional Links:</p>
                        <div className="flex flex-wrap gap-2">
                          {submission.submissionData.additionalLinks.map((link, index) => (
                            <a
                              key={index}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-xs hover:bg-green-800/30 transition-colors"
                            >
                              {link.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {submission.submissionData.description && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-slate-300 mb-1">Description:</p>
                        <p className="text-sm text-slate-400">{submission.submissionData.description}</p>
                      </div>
                    )}

                    {submission.submissionData.tags && submission.submissionData.tags.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {submission.submissionData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {submission.isTeamSubmission && submission.teamMembers && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-slate-300 mb-1">Team Members:</p>
                        <div className="text-xs text-slate-400 space-y-1">
                          {submission.teamMembers.map((member, index) => (
                            <div key={index}>
                              {member.name} ({member.email}) - {member.role}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-700 pt-3">
                      <span>Submitted: {formatDate(submission.submittedAt)}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReviewSubmission(submission)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          {submission.status === 'reviewed' ? 'Update Review' : 'Review'}
                        </button>
                      </div>
                    </div>

                    {submission.feedback && (
                      <div className="mt-3 p-3 bg-slate-700/50 rounded">
                        <p className="text-sm font-medium text-slate-300 mb-1">Feedback:</p>
                        <p className="text-sm text-slate-400">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {reviewMode && selectedSubmission && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">
                  Review Submission
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Feedback
                    </label>
                    <textarea
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide feedback on the submission..."
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setReviewMode(false)}
                    className="px-4 py-2 text-slate-400 hover:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReview}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Submit Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SubmissionViewer
