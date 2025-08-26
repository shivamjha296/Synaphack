'use client'

import { useState, useEffect } from 'react'
import { leaderboardService } from '../lib/leaderboardService'
import type { EventLeaderboard, LeaderboardEntry } from '../lib/leaderboardService'

interface LeaderboardProps {
  eventId: string
  userEmail?: string
  userRole: 'participant' | 'organizer' | 'judge'
  onClose?: () => void
}

const Leaderboard = ({ eventId, userEmail, userRole, onClose }: LeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<EventLeaderboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [viewMode, setViewMode] = useState<'top10' | 'all'>('top10')

  useEffect(() => {
    loadLeaderboard()
  }, [eventId])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await leaderboardService.getEventLeaderboard(eventId)
      setLeaderboard(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!leaderboard) return
    
    const csvData = leaderboardService.exportLeaderboardData(leaderboard)
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${leaderboard.eventTitle}_leaderboard.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getParticipantRank = () => {
    if (!leaderboard || !userEmail) return null
    return leaderboard.entries.find(entry => entry.participantEmail === userEmail)
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-orange-900'
    if (rank <= 10) return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
    return 'bg-gradient-to-r from-slate-500 to-slate-700 text-white'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-fuchsia-500/30 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-red-500/30 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">❌</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Leaderboard</h3>
            <p className="text-red-300 mb-4">{error}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={loadLeaderboard}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white px-4 py-2 rounded-lg transition-all font-medium"
              >
                Retry
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!leaderboard) return null

  const stats = leaderboardService.getLeaderboardStats(leaderboard)
  const displayEntries = viewMode === 'top10' ? leaderboard.entries.slice(0, 10) : leaderboard.entries
  const userRank = getParticipantRank()

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose()
        }
      }}
    >
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-fuchsia-500/30 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-fuchsia-500/30">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">🏆 Leaderboard</h2>
              <p className="text-purple-200">{leaderboard.eventTitle}</p>
              <p className="text-sm text-slate-400 mt-1">
                Last updated: {leaderboard.lastUpdated.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {userRole === 'organizer' && (
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-all text-sm"
                >
                  <span>📊</span>
                  <span>Export CSV</span>
                </button>
              )}
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all text-sm"
              >
                <span>📈</span>
                <span>{showStats ? 'Hide' : 'Show'} Stats</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-purple-300 hover:text-white transition-colors text-xl bg-black/30 hover:bg-black/50 rounded-full p-2"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Stats Panel */}
          {showStats && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">Total Participants</p>
                <p className="text-lg font-bold text-white">{leaderboard.totalParticipants}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">Reviewed</p>
                <p className="text-lg font-bold text-green-400">{leaderboard.reviewedSubmissions}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">Avg Score</p>
                <p className="text-lg font-bold text-blue-400">{stats.averageScore}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">Highest</p>
                <p className="text-lg font-bold text-yellow-400">{stats.highestScore}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">Progress</p>
                <p className="text-lg font-bold text-purple-400">{stats.reviewProgress}%</p>
              </div>
            </div>
          )}

          {/* User's Rank (for participants) */}
          {userRole === 'participant' && userRank && (
            <div className="mt-4 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">Your Current Ranking</p>
                  <p className="text-xl font-bold text-white">
                    {getRankIcon(userRank.rank)} Rank #{userRank.rank}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-200">Your Score</p>
                  <p className="text-2xl font-bold text-fuchsia-400">{userRank.score}/10</p>
                </div>
              </div>
            </div>
          )}

          {/* View Toggle */}
          <div className="mt-4 flex justify-center">
            <div className="bg-slate-800/50 rounded-lg p-1 flex">
              <button
                onClick={() => setViewMode('top10')}
                className={`px-4 py-2 rounded-md text-sm transition-all ${
                  viewMode === 'top10'
                    ? 'bg-fuchsia-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Top 10
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-md text-sm transition-all ${
                  viewMode === 'all'
                    ? 'bg-fuchsia-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                All ({leaderboard.entries.length})
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {displayEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Scores Available</h3>
              <p className="text-slate-400">Submissions are still being reviewed by judges.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`bg-slate-800/50 rounded-lg p-4 border transition-all hover:border-fuchsia-500/50 ${
                    userEmail === entry.participantEmail
                      ? 'border-fuchsia-500/50 bg-fuchsia-500/10'
                      : 'border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRankBadgeColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {entry.teamName !== 'Individual' ? entry.teamName : entry.participantName}
                        </h4>
                        <p className="text-sm text-slate-400">{entry.participantEmail}</p>
                        {entry.projectTitle && (
                          <p className="text-sm text-purple-300 mt-1">"{entry.projectTitle}"</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-fuchsia-400 mb-1">
                        {entry.score}/10
                      </div>
                      <div className="text-xs text-slate-400">
                        {entry.submissionDate.toLocaleDateString()}
                      </div>
                      {userRole !== 'participant' && entry.githubUrl && (
                        <a
                          href={entry.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-2 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <span className="mr-1">🔗</span>
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                  {userRole !== 'participant' && entry.feedback && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <p className="text-sm text-slate-300">
                        <span className="font-medium text-purple-300">Feedback:</span> {entry.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
