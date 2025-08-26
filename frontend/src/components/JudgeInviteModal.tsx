'use client'

import { useState } from 'react'
import { judgeInviteService } from '../lib/judgeInviteService'

interface JudgeInviteModalProps {
  event: any
  onClose: () => void
  onInviteCreated: () => void
}

const JudgeInviteModal = ({ event, onClose, onInviteCreated }: JudgeInviteModalProps) => {
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [expiryDays, setExpiryDays] = useState(30)

  const generateInvite = async () => {
    if (!event || !event.id) return
    
    setLoading(true)
    setError('')
    
    try {
      // Get user from localStorage
      const userData = localStorage.getItem('user')
      if (!userData) {
        setError('User not found. Please log in again.')
        return
      }
      
      const user = JSON.parse(userData)
      
      // Create judge invite
      const invite = await judgeInviteService.createJudgeInvite(
        event.id,
        event.title,
        user.email,
        expiryDays
      )
      
      setInviteCode(invite.inviteCode)
      setInviteUrl(judgeInviteService.getInviteUrl(invite.inviteCode))
      onInviteCreated()
    } catch (error: any) {
      setError(error.message || 'Failed to generate invite code')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Invite Judge</h3>
          <button 
            onClick={onClose}
            className="text-purple-300 hover:text-white transition-colors bg-black/30 hover:bg-black/50 rounded-full p-2"
          >
            ✕
          </button>
        </div>
        
        <p className="text-purple-200 mb-6">
          Generate an invite code for judges to access and review submissions for <span className="text-fuchsia-400 font-medium">{event?.title}</span>.
        </p>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {!inviteCode ? (
          <>
            <div className="mb-4">
              <label className="block text-purple-200 mb-2 text-sm">Invite Expiry (Days)</label>
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
                min="1"
                max="365"
                className="w-full bg-slate-800/50 border border-fuchsia-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-purple-200 hover:text-white transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                onClick={generateInvite}
                disabled={loading}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white px-6 py-2 rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Generating...
                  </span>
                ) : (
                  'Generate Invite'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-sm border border-fuchsia-500/30 rounded-lg p-4 mb-4">
              <div className="mb-4">
                <label className="block text-purple-200 mb-2 text-sm">Invite Code</label>
                <div className="flex">
                  <input
                    type="text"
                    value={inviteCode}
                    readOnly
                    className="w-full bg-slate-800/50 border border-fuchsia-500/30 rounded-l-lg px-4 py-2 text-white focus:outline-none"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(inviteCode)}
                    className="bg-fuchsia-900/50 border border-fuchsia-500/30 border-l-0 rounded-r-lg px-3 text-fuchsia-300 hover:text-white transition-colors"
                    title="Copy code"
                  >
                    📋
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-purple-200 mb-2 text-sm">Invite URL</label>
                <div className="flex">
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="w-full bg-slate-800/50 border border-fuchsia-500/30 rounded-l-lg px-4 py-2 text-white focus:outline-none text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-fuchsia-900/50 border border-fuchsia-500/30 border-l-0 rounded-r-lg px-3 text-fuchsia-300 hover:text-white transition-colors"
                    title="Copy URL"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
            
            {copied && (
              <div className="bg-green-900/30 border border-green-500 text-green-300 px-4 py-2 rounded-lg mb-4 text-center">
                Copied to clipboard!
              </div>
            )}
            
            <p className="text-sm text-purple-200 mb-4">
              Share this invite code or URL with judges to grant them access to review submissions for this event.
              The invite will expire in {expiryDays} days.
            </p>
            
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white px-6 py-2 rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default JudgeInviteModal