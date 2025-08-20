'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { judgeInviteService } from '../../../lib/judgeInviteService'
import { useAuth } from '../../../hooks/useAuth'

export default function JoinJudgePage({ params }: { params: { inviteCode: string } }) {
  const { inviteCode } = params
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventInfo, setEventInfo] = useState<{
    eventId: string
    eventName: string
    createdBy: string
    expiresAt: Date
  } | null>(null)
  const [joining, setJoining] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        const invite = await judgeInviteService.getJudgeInviteByCode(inviteCode)
        if (!invite) {
          setError('Invalid or expired invite code')
        } else {
          setEventInfo({
            eventId: invite.eventId,
            eventName: invite.eventName,
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

  const handleAcceptInvite = async () => {
    if (!user || !eventInfo) return
    
    setJoining(true)
    setError('')
    
    try {
      await judgeInviteService.acceptJudgeInvite(
        inviteCode,
        user.email,
        user.name
      )
      setSuccess(true)
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/judge-dashboard')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to accept judge invitation')
    } finally {
      setJoining(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-950 flex items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Login Required</h1>
          <p className="text-purple-200 mb-6">You need to be logged in as a judge to accept this invitation.</p>
          <button
            onClick={() => router.push(`/login?redirect=/join-judge/${inviteCode}`)} 
            className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
          >
            Login to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl shadow-2xl p-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-purple-200">Loading invitation details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Invitation Error</h2>
            <p className="text-purple-200 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
            >
              Return Home
            </button>
          </div>
        ) : success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-400 text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Success!</h2>
            <p className="text-purple-200 mb-6">
              You have successfully accepted the invitation to judge {eventInfo?.eventName}. Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Judge Invitation</h1>
            <p className="text-purple-200 mb-6">You have been invited to judge the following event:</p>
            
            <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">{eventInfo?.eventName}</h2>
              <div className="space-y-2 text-sm text-purple-200">
                <div className="flex justify-between">
                  <span>Organizer:</span>
                  <span className="text-fuchsia-400">{eventInfo?.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expires:</span>
                  <span>{eventInfo?.expiresAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-purple-200 hover:text-white transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptInvite}
                disabled={joining}
                className="px-6 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Accepting...
                  </span>
                ) : (
                  'Accept Invitation'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}