'use client'

import { useState, useEffect } from 'react'
import { Event, UserProfile, eventService, EventRegistration } from '../lib/eventService'
import TeamInviteModal from './TeamInviteModal'
import { TeamInvite, teamInviteService } from '../lib/teamInviteService'

interface RegistrationModalProps {
  event: Event
  userEmail: string
  userName: string
  onClose: () => void
  onRegistrationComplete: () => void
}

const RegistrationModal = ({ event, userEmail, userName, onClose, onRegistrationComplete }: RegistrationModalProps) => {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'profile' | 'team' | 'additional' | 'confirm'>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileForm, setProfileForm] = useState({
    phone: '',
    college: '',
    course: '',
    year: '',
    skills: [] as string[],
    experience: '',
    github: '',
    linkedin: '',
    portfolio: '',
    bio: ''
  })
  const [teamForm, setTeamForm] = useState({
    teamName: ''
  })
  const [teamOption, setTeamOption] = useState<'create' | 'join' | 'solo'>('solo')
  const [inviteCode, setInviteCode] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState<{[key: string]: any}>({})
  const [error, setError] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [teamInvite, setTeamInvite] = useState<TeamInvite | null>(null)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const userProfile = await eventService.getProfileByEmail(userEmail)
      if (userProfile) {
        setProfile(userProfile)
        setProfileForm({
          phone: userProfile.phone || '',
          college: userProfile.college || '',
          course: userProfile.course || '',
          year: userProfile.year || '',
          skills: userProfile.skills || [],
          experience: userProfile.experience || '',
          github: userProfile.github || '',
          linkedin: userProfile.linkedin || '',
          portfolio: userProfile.portfolio || '',
          bio: userProfile.bio || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileForm.skills.includes(newSkill.trim())) {
      setProfileForm(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  // Team member functions removed as members will join using invite code

  const handleNext = async () => {
    setError('')
    
    if (step === 'profile') {
      // Validate and save profile
      if (!profileForm.phone || !profileForm.college) {
        setError('Phone and college are required')
        return
      }
      
      try {
        setLoading(true)
        await eventService.createOrUpdateProfile({
          email: userEmail,
          name: userName,
          role: 'participant',
          ...profileForm
        })
        setStep('team')
      } catch (error) {
        setError('Failed to save profile')
      } finally {
        setLoading(false)
      }
    } else if (step === 'team') {
      // Validate team information
      if (teamOption === 'create' && !teamForm.teamName) {
        setError('Please enter a team name')
        return
      }
      
      if (teamOption === 'join' && !inviteCode.trim()) {
        setError('Please enter a valid invite code')
        return
      }
      
      setStep('additional')
    } else if (step === 'additional') {
      setStep('confirm')
    }
  }

  const handlePrevious = () => {
    if (step === 'team') {
      setStep('profile')
    } else if (step === 'additional') {
      setStep('team')
    } else if (step === 'confirm') {
      setStep('additional')
    }
  }

  const handleRegister = async () => {
    setError('')
    setLoading(true)
    
    try {
      // First, save/update user profile with complete information
      const profileData = {
        email: userEmail,
        name: userName,
        role: 'participant' as const,
        phone: profileForm.phone,
        college: profileForm.college,
        course: profileForm.course,
        year: profileForm.year,
        skills: profileForm.skills,
        experience: profileForm.experience,
        github: profileForm.github,
        linkedin: profileForm.linkedin,
        portfolio: profileForm.portfolio,
        bio: profileForm.bio,
      }
      
      const profileId = await eventService.saveProfile(profileData)
      
      // Handle different team options
      if (teamOption === 'join') {
        // Validate invite code
        if (!inviteCode.trim()) {
          setError('Please enter a valid invite code')
          setLoading(false)
          return
        }
        
        try {
          // Join team with invite code
          const joined = await teamInviteService.joinTeamWithInvite(
            inviteCode,
            userEmail,
            userName
          )
          
          if (joined) {
            onRegistrationComplete()
            onClose()
          } else {
            setError('Failed to join team. The invite may be invalid or expired.')
          }
        } catch (joinError: any) {
          setError(joinError.message || 'Failed to join team')
        }
      } else {
        // For solo or create team options
        // Then register for the event with complete information
        const registrationData = {
          eventId: event.id!,
          participantId: profileId || userEmail,
          participantEmail: userEmail,
          participantName: userName,
          participantPhone: profileForm.phone,
          participantCollege: profileForm.college,
          participantCourse: profileForm.course,
          participantYear: profileForm.year,
          participantSkills: profileForm.skills,
          participantExperience: profileForm.experience,
          participantGithub: profileForm.github,
          participantLinkedin: profileForm.linkedin,
          participantPortfolio: profileForm.portfolio,
          participantBio: profileForm.bio,
          teamName: teamOption === 'create' ? teamForm.teamName : undefined,
          teamMembers: teamOption === 'create' ? [] : undefined, // Empty array for team creation, undefined for solo
          teamCreator: teamOption === 'create' && teamForm.teamName ? userEmail : undefined,
          additionalInfo,
          status: 'pending' as 'pending' | 'approved' | 'rejected',
          paymentStatus: event.registrationFee > 0 ? 'pending' as const : 'paid' as const
        }
        
        await eventService.registerForEvent(registrationData)
        
        if (teamOption === 'create' && teamForm.teamName) {
          setShowInviteModal(true)
        } else {
          onRegistrationComplete()
          onClose()
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Failed to register for the event')
      setLoading(false)
    }
  }

  const handleInviteCreated = (invite: TeamInvite) => {
    setTeamInvite(invite)
  }

  const handleCloseInviteModal = () => {
    setShowInviteModal(false)
    onRegistrationComplete()
    onClose()
  }

  const renderProfileStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
          <input
            type="text"
            value={userName}
            disabled
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700/50 text-slate-400 rounded-md focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input
            type="email"
            value={userEmail}
            disabled
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700/50 text-slate-400 rounded-md focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
          <input
            type="tel"
            value={profileForm.phone}
            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your phone number"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">College/University</label>
          <input
            type="text"
            value={profileForm.college}
            onChange={(e) => setProfileForm(prev => ({ ...prev, college: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your college/university"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Course/Degree</label>
          <input
            type="text"
            value={profileForm.course}
            onChange={(e) => setProfileForm(prev => ({ ...prev, course: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="E.g., B.Tech Computer Science"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
          <select
            value={profileForm.year}
            onChange={(e) => setProfileForm(prev => ({ ...prev, year: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select year</option>
            <option value="1st">1st Year</option>
            <option value="2nd">2nd Year</option>
            <option value="3rd">3rd Year</option>
            <option value="4th">4th Year</option>
            <option value="graduated">Graduated</option>
            <option value="working">Working Professional</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderTeamStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Team Information</h3>
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-300 mb-3">How would you like to participate?</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => setTeamOption('solo')}
            className={`border ${teamOption === 'solo' ? 'border-blue-500 bg-blue-900/20' : 'border-slate-600 bg-slate-700/50'} rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors`}
          >
            <div className="font-medium text-slate-100 mb-1">Participate Solo</div>
            <div className="text-xs text-slate-400">Register as an individual participant</div>
          </div>
          
          <div 
            onClick={() => setTeamOption('create')}
            className={`border ${teamOption === 'create' ? 'border-blue-500 bg-blue-900/20' : 'border-slate-600 bg-slate-700/50'} rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors`}
          >
            <div className="font-medium text-slate-100 mb-1">Create a Team</div>
            <div className="text-xs text-slate-400">Start a new team and invite others</div>
          </div>
          
          <div 
            onClick={() => setTeamOption('join')}
            className={`border ${teamOption === 'join' ? 'border-blue-500 bg-blue-900/20' : 'border-slate-600 bg-slate-700/50'} rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors`}
          >
            <div className="font-medium text-slate-100 mb-1">Join a Team</div>
            <div className="text-xs text-slate-400">Join an existing team with an invite code</div>
          </div>
        </div>
      </div>
      
      {teamOption === 'join' && (
        <div className="border border-slate-600 rounded-lg p-4 bg-slate-700/50">
          <label className="block text-sm font-medium text-slate-300 mb-2">Enter Team Invite Code</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the invite code provided by the team creator"
          />
          <div className="text-xs text-slate-400 mt-2">
            The team creator will provide you with an invite code. Enter it here to join their team.  
          </div>
        </div>
      )}
      
      {teamOption === 'create' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Team Name</label>
            <input
              type="text"
              value={teamForm.teamName}
              onChange={(e) => setTeamForm(prev => ({ ...prev, teamName: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your team name"
            />
          </div>
          
          {teamForm.teamName && (
            <div className="border border-slate-600 rounded-lg p-4 bg-slate-700/50">
              <div className="text-sm text-slate-300 mb-2">
                <p className="font-medium">Team members will join using invite code</p>
                <p className="text-xs text-slate-400 mt-1">After creating your team, you'll receive an invite code that you can share with your team members.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderAdditionalStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Additional Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Why do you want to participate in this event?
        </label>
        <textarea
          value={additionalInfo.motivation || ''}
          onChange={(e) => setAdditionalInfo(prev => ({ ...prev, motivation: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Share your motivation..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Do you have any previous hackathon experience?
        </label>
        <textarea
          value={additionalInfo.experience || ''}
          onChange={(e) => setAdditionalInfo(prev => ({ ...prev, experience: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your experience..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Any dietary restrictions or special requirements?
        </label>
        <input
          type="text"
          value={additionalInfo.requirements || ''}
          onChange={(e) => setAdditionalInfo(prev => ({ ...prev, requirements: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Any special requirements..."
        />
      </div>
    </div>
  )

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Confirm Registration</h3>
      
      <div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-medium text-slate-100">Event: {event.title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Registration Fee:</span>
            <span className="text-slate-100 ml-2">₹{event.registrationFee}</span>
          </div>
          <div>
            <span className="text-slate-400">Event Date:</span>
            <span className="text-slate-100 ml-2">{new Date(event.timeline.eventStart).toLocaleDateString()}</span>
          </div>
          {teamOption === 'create' && teamForm.teamName && (
            <div>
              <span className="text-slate-400">Team Name:</span>
              <span className="text-slate-100 ml-2">{teamForm.teamName}</span>
              <span className="text-green-400 ml-2">(Creating New Team)</span>
            </div>
          )}
          {teamOption === 'join' && inviteCode && (
            <div>
              <span className="text-slate-400">Joining Team:</span>
              <span className="text-slate-100 ml-2">With invite code {inviteCode}</span>
            </div>
          )}
          {teamOption === 'solo' && (
            <div>
              <span className="text-slate-400">Participation:</span>
              <span className="text-slate-100 ml-2">Individual (Solo)</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-sm text-slate-400 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <h5 className="text-blue-300 font-medium mb-2">Registration Process:</h5>
        <ul className="space-y-1">
          <li>• Your registration will be submitted for review</li>
          {event.registrationFee > 0 && <li>• Payment instructions will be sent to your email</li>}
          <li>• You'll receive confirmation once approved</li>
          <li>• Check your email for further updates</li>
        </ul>
      </div>
    </div>
  )

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Team Invite Modal */}
        {showInviteModal && teamForm.teamName && (
          <TeamInviteModal
            eventId={event.id!}
            teamName={teamForm.teamName}
            creatorEmail={userEmail}
            onClose={handleCloseInviteModal}
            onInviteCreated={handleInviteCreated}
          />
        )}
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Register for {event.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-2xl bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            {['profile', 'team', 'additional', 'confirm'].map((s, index) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step ? 'bg-blue-600 text-white' :
                  ['profile', 'team', 'additional', 'confirm'].indexOf(step) > index ? 'bg-green-600 text-white' :
                  'bg-slate-600 text-slate-400'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && <div className="w-12 h-0.5 bg-slate-600 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'profile' && renderProfileStep()}
          {step === 'team' && renderTeamStep()}
          {step === 'additional' && renderAdditionalStep()}
          {step === 'confirm' && renderConfirmStep()}

          {error && (
            <div className="mt-4 text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-md p-3">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-slate-700">
          <button
            onClick={step === 'profile' ? onClose : handlePrevious}
            className="px-6 py-2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            {step === 'profile' ? 'Cancel' : 'Previous'}
          </button>
          
          {step === 'confirm' ? (
            <button
              onClick={handleRegister}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Complete Registration'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegistrationModal
