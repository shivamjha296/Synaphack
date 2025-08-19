'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { teamInviteService } from '../../../lib/teamInviteService'
import { useAuth } from '../../../hooks/useAuth'

export default function JoinTeamPage({ params }: { params: { inviteCode: string } }) {
  const { inviteCode } = params
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teamInfo, setTeamInfo] = useState<{
    eventId: string
    teamName: string
    createdBy: string
    expiresAt: Date
  } | null>(null)
  const [joining, setJoining] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        const invite = await teamInviteService.getTeamInviteByCode(inviteCode)
        if (!invite) {
          setError('Invalid or expired invite code')
        } else {
          setTeamInfo({
            eventId: invite.eventId,
            teamName: invite.teamName,
            createdBy: invite.createdBy,
            expiresAt: invite.expiresAt
          })
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invite information')
      } finally {
        setLoading(false)
      }
    }

    if (inviteCode) {
      fetchInviteInfo()
    }
  }, [inviteCode])

  const handleJoinTeam = async () => {
    if (!user || !teamInfo) return
    
    setJoining(true)
    setError('')
    
    try {
      await teamInviteService.joinTeamWithInvite(
        inviteCode,
        user.email,
        user.name
      )
      setSuccess(true)
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/participant-dashboard')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to join team')
    } finally {
      setJoining(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">Login Required</h1>
          <p className="text-slate-300 mb-6">You need to be logged in to join a team.</p>
          <button
            onClick={() => router.push(`/login?redirect=/join-team/${inviteCode}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Login to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Join Team</h1>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={() => router.push('/participant-dashboard')}
              className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 focus:outline-none"
            >
              Go to Dashboard
            </button>
          </div>
        ) : success ? (
          <div className="text-center py-8">
            <div className="text-green-400 text-xl mb-2">Successfully joined team!</div>
            <p className="text-slate-300 mb-4">You are now a member of {teamInfo?.teamName}.</p>
            <p className="text-slate-400 text-sm mb-6">Redirecting to dashboard...</p>
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : teamInfo ? (
          <div className="space-y-6">
            <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
              <div>
                <span className="text-slate-400">Team Name:</span>
                <span className="text-slate-100 ml-2">{teamInfo.teamName}</span>
              </div>
              <div>
                <span className="text-slate-400">Created By:</span>
                <span className="text-slate-100 ml-2">{teamInfo.createdBy}</span>
              </div>
              <div>
                <span className="text-slate-400">Expires On:</span>
                <span className="text-slate-100 ml-2">{teamInfo.expiresAt.toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="text-sm text-slate-400 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <h5 className="text-blue-300 font-medium mb-2">What happens when you join:</h5>
              <ul className="space-y-1">
                <li>• You'll be added to this team for the event</li>
                <li>• You'll have access to the team's submissions</li>
                <li>• You'll be able to collaborate with team members</li>
              </ul>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleJoinTeam}
                disabled={joining}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? 'Joining...' : 'Join Team'}
              </button>
              
              <button
                onClick={() => router.push('/participant-dashboard')}
                className="py-2 px-4 bg-slate-700 text-white rounded-md hover:bg-slate-600 focus:outline-none"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}