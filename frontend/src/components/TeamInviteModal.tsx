'use client'

import { useState, useEffect } from 'react'
import { teamInviteService, TeamInvite } from '../lib/teamInviteService'

interface TeamInviteModalProps {
  eventId: string
  teamName: string
  creatorEmail: string
  onClose: () => void
  onInviteCreated: (invite: TeamInvite) => void
}

const TeamInviteModal = ({
  eventId,
  teamName,
  creatorEmail,
  onClose,
  onInviteCreated
}: TeamInviteModalProps) => {
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [expiryDays, setExpiryDays] = useState(7)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handleCreateInvite = async () => {
    setLoading(true)
    setError('')
    try {
      const invite = await teamInviteService.createTeamInvite(
        eventId,
        teamName,
        creatorEmail,
        expiryDays
      )
      setInviteCode(invite.inviteCode)
      setInviteUrl(teamInviteService.getInviteUrl(invite.inviteCode))
      onInviteCreated(invite)
    } catch (err: any) {
      setError(err.message || 'Failed to create invite')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-slate-100 mb-4">Create Team Invite</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Team Name</label>
            <div className="px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md">
              {teamName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Invite Expiry</label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          {!inviteCode ? (
            <button
              onClick={handleCreateInvite}
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Invite Link'}
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Invite Link</label>
                <div className="flex">
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-l-md focus:outline-none"
                  />
                  <button
                    onClick={handleCopyInvite}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="text-sm text-slate-400 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <h5 className="text-blue-300 font-medium mb-2">How to use:</h5>
                <ul className="space-y-1">
                  <li>• Share this link with your team members</li>
                  <li>• They can click the link to join your team</li>
                  <li>• No need for them to create a new team</li>
                  <li>• Link expires in {expiryDays} day{expiryDays > 1 ? 's' : ''}</li>
                </ul>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamInviteModal