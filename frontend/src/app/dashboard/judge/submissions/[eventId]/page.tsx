"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { eventService } from '@/lib/eventService'
import { submissionService } from '@/lib/submissionService'
import { judgeInviteService } from '@/lib/judgeInviteService'
import type { Event } from '@/lib/eventService'
import type { RoundSubmission } from '@/lib/submissionService'

interface GitMCPInfo {
  gitmcpUrl: string
}

export default function EventSubmissions({ params }: { params: { eventId: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [submissions, setSubmissions] = useState<RoundSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<RoundSubmission | null>(null)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [scoringSubmissionId, setScoringSubmissionId] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    if (user) {
      checkAccessAndLoadData()
    }
  }, [user, params.eventId])

  const checkAccessAndLoadData = async () => {
    try {
      setCheckingAccess(true)
      setAccessDenied(false)
      
      // Check if judge is assigned to this event
      const isAssigned = await judgeInviteService.isJudgeAssignedToEvent(user!.email, params.eventId)
      
      if (!isAssigned) {
        setAccessDenied(true)
        setCheckingAccess(false)
        return
      }
      
      // If assigned, load event and submissions
      await loadEventAndSubmissions()
      
    } catch (error) {
      console.error('Error checking access:', error)
      setAccessDenied(true)
    } finally {
      setCheckingAccess(false)
    }
  }

  const loadEventAndSubmissions = async () => {
    try {
      setLoading(true)
      
      // Load event details
      const eventData = await eventService.getEvent(params.eventId)
      setEvent(eventData)
      
      // Load submissions 
      const submissionsData = await submissionService.getEventSubmissions(params.eventId)
      setSubmissions(submissionsData)
      
    } catch (error) {
      console.error('Error loading event and submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreSubmission = async (submissionId: string) => {
    if (!user) return
    
    try {
      setScoringSubmissionId(submissionId)
      
      // Update submission with score and feedback
      await submissionService.updateSubmission(submissionId, {
        score: score,
        feedback: feedback,
        status: 'reviewed'
      })
      
      // Refresh submissions
      await loadEventAndSubmissions()
      
      // Reset form
      setScore(0)
      setFeedback('')
      setSelectedSubmission(null)
      
      alert('Submission scored successfully!')
    } catch (error) {
      console.error('Error scoring submission:', error)
      alert('Error scoring submission. Please try again.')
    } finally {
      setScoringSubmissionId(null)
    }
  }

  const renderGitMCPUrl = (gitmcpUrl: string) => {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
        <h4 className="text-lg font-semibold text-purple-300 mb-3 flex items-center">
          <span className="mr-2">�</span>
          GitMCP Analysis
        </h4>
        
        <div>
          <p className="text-sm text-slate-300 mb-2">
            <strong>Repository Analysis:</strong> View detailed code analysis on GitMCP
          </p>
          <a 
            href={gitmcpUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            <span className="mr-2">🔍</span>
            View GitMCP Analysis →
          </a>
        </div>
      </div>
    )
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg text-slate-300">Checking access permissions...</div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">🚫</span>
          </div>
          <h2 className="text-2xl text-slate-200 font-semibold mb-4">Access Denied</h2>
          <p className="text-slate-400 mb-6">
            You need to be invited as a judge for this event to view submissions. 
            Please contact the event organizer for an invite code.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/judge-dashboard')}
              className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white px-6 py-3 rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-lg text-slate-300">Loading event and submissions...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-2xl text-slate-400 font-semibold">Event not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold mb-2">Judge Submissions</h1>
          <h2 className="text-xl text-slate-300">{event.title}</h2>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-2xl text-slate-400 font-semibold">No submissions yet</div>
            <p className="text-slate-500 mt-2">Check back later for participant submissions.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                {/* Submission Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{submission.teamName || 'Individual Submission'}</h3>
                    <p className="text-slate-300">by {submission.participantName}</p>
                    <p className="text-sm text-slate-400">
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      submission.status === 'submitted' ? 'bg-green-900/30 text-green-300' :
                      submission.status === 'late' ? 'bg-red-900/30 text-red-300' :
                      submission.status === 'reviewed' ? 'bg-blue-900/30 text-blue-300' :
                      'bg-gray-900/30 text-gray-300'
                    }`}>
                      {submission.status}
                    </span>
                    {submission.score && (
                      <span className="px-3 py-1 bg-yellow-900/30 text-yellow-300 rounded-full text-sm font-medium">
                        Score: {submission.score}/100
                      </span>
                    )}
                  </div>
                </div>

                {/* Submission Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Submission Details</h4>
                    
                    {submission.submissionData.description && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-300"><strong>Description:</strong></p>
                        <p className="text-sm text-slate-400">{submission.submissionData.description}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {submission.submissionData.githubLink && (
                        <div className="space-y-2">
                          <div>
                            <strong className="text-sm">GitHub Repository:</strong>
                            <a 
                              href={submission.submissionData.githubLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-400 hover:text-blue-300 underline text-sm"
                            >
                              {submission.submissionData.githubLink}
                            </a>
                          </div>
                          <div>
                            <strong className="text-sm">Code Analysis:</strong>
                            {(() => {
                              // Generate GitMCP URL
                              let gitmcpUrl = submission.submissionData.gitmcpUrl;
                              if (!gitmcpUrl) {
                                const githubUrl = submission.submissionData.githubLink;
                                const cleanUrl = githubUrl.endsWith('/') ? githubUrl.slice(0, -1) : githubUrl;
                                const match = cleanUrl.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+(?:\.git)?)$/);
                                if (match) {
                                  const [, owner, repo] = match;
                                  gitmcpUrl = `https://gitmcp.io/${owner}/${repo}/chat`;
                                }
                              }
                              return gitmcpUrl ? (
                                <a 
                                  href={gitmcpUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="ml-2 inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                                >
                                  <span className="mr-2">🔍</span>
                                  View GitMCP Analysis →
                                </a>
                              ) : (
                                <span className="ml-2 text-slate-500 text-sm">No analysis available</span>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      
                      {submission.submissionData.pptLink && (
                        <div>
                          <strong className="text-sm">Presentation:</strong>
                          <a 
                            href={submission.submissionData.pptLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-green-400 hover:text-green-300 underline text-sm"
                          >
                            View Presentation
                          </a>
                        </div>
                      )}
                      
                      {submission.submissionData.videoLink && (
                        <div>
                          <strong className="text-sm">Demo Video:</strong>
                          <a 
                            href={submission.submissionData.videoLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-purple-400 hover:text-purple-300 underline text-sm"
                          >
                            Watch Demo
                          </a>
                        </div>
                      )}
                    </div>

                    {submission.submissionData.tags && submission.submissionData.tags.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-slate-300 mb-1"><strong>Tags:</strong></p>
                        <div className="flex flex-wrap gap-1">
                          {submission.submissionData.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Scoring Section */}
                    <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                      <h4 className="font-semibold mb-3">Judge Scoring</h4>
                      
                      {submission.feedback && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-300"><strong>Previous Feedback:</strong></p>
                          <p className="text-sm text-slate-400">{submission.feedback}</p>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Score (0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={selectedSubmission?.id === submission.id ? score : submission.score || 0}
                            onChange={(e) => {
                              setScore(parseInt(e.target.value) || 0)
                              setSelectedSubmission(submission)
                            }}
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Feedback</label>
                          <textarea
                            value={selectedSubmission?.id === submission.id ? feedback : submission.feedback || ''}
                            onChange={(e) => {
                              setFeedback(e.target.value)
                              setSelectedSubmission(submission)
                            }}
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            placeholder="Provide feedback for this submission..."
                          />
                        </div>
                        
                        <button
                          onClick={() => handleScoreSubmission(submission.id!)}
                          disabled={scoringSubmissionId === submission.id || selectedSubmission?.id !== submission.id}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          {scoringSubmissionId === submission.id ? 'Saving...' : 'Save Score & Feedback'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
