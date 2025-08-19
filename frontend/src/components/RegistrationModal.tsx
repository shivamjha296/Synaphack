'use client'

import { useState, useEffect } from 'react'
import { Event, UserProfile, eventService } from '../lib/eventService'

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
    teamName: '',
    teamMembers: [{ name: '', email: '', role: '' }]
  })
  const [additionalInfo, setAdditionalInfo] = useState<{[key: string]: any}>({})
  const [error, setError] = useState('')
  const [newSkill, setNewSkill] = useState('')

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

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleAddTeamMember = () => {
    setTeamForm(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: '', email: '', role: '' }]
    }))
  }

  const handleRemoveTeamMember = (index: number) => {
    setTeamForm(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }))
  }

  const handleTeamMemberChange = (index: number, field: string, value: string) => {
    setTeamForm(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }))
  }

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
      
      // Then register for the event with complete information
      await eventService.registerForEvent({
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
        teamName: teamForm.teamName || undefined,
        teamMembers: teamForm.teamName ? teamForm.teamMembers.filter(member => member.name) : undefined,
        additionalInfo,
        status: 'pending',
        paymentStatus: event.registrationFee > 0 ? 'pending' : 'paid'
      })
      
      onRegistrationComplete()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const renderProfileStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Complete Your Profile</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Phone *</label>
          <input
            type="tel"
            value={profileForm.phone}
            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your phone number"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">College/University *</label>
          <input
            type="text"
            value={profileForm.college}
            onChange={(e) => setProfileForm(prev => ({ ...prev, college: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your college or university"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Course</label>
          <input
            type="text"
            value={profileForm.course}
            onChange={(e) => setProfileForm(prev => ({ ...prev, course: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Computer Science"
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
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Skills</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            className="flex-1 px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a skill"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profileForm.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center gap-2"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="text-blue-300 hover:text-blue-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">GitHub</label>
          <input
            type="url"
            value={profileForm.github}
            onChange={(e) => setProfileForm(prev => ({ ...prev, github: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://github.com/yourusername"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">LinkedIn</label>
          <input
            type="url"
            value={profileForm.linkedin}
            onChange={(e) => setProfileForm(prev => ({ ...prev, linkedin: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://linkedin.com/in/yourusername"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Portfolio</label>
          <input
            type="url"
            value={profileForm.portfolio}
            onChange={(e) => setProfileForm(prev => ({ ...prev, portfolio: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://yourportfolio.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
          <textarea
            value={profileForm.bio}
            onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>
    </div>
  )

  const renderTeamStep = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Team Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Team Name (Optional)</label>
        <input
          type="text"
          value={teamForm.teamName}
          onChange={(e) => setTeamForm(prev => ({ ...prev, teamName: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Leave empty if participating solo"
        />
      </div>
      
      {teamForm.teamName && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-slate-300">Team Members</label>
            <button
              type="button"
              onClick={handleAddTeamMember}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Add Member
            </button>
          </div>
          
          <div className="space-y-4">
            {teamForm.teamMembers.map((member, index) => (
              <div key={index} className="border border-slate-600 rounded-lg p-4 bg-slate-700/50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-slate-300">Member {index + 1}</h4>
                  {teamForm.teamMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTeamMember(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                    className="px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    value={member.email}
                    onChange={(e) => handleTeamMemberChange(index, 'email', e.target.value)}
                    className="px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email"
                  />
                  <input
                    type="text"
                    value={member.role}
                    onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                    className="px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Role (e.g., Developer)"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
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
          {teamForm.teamName && (
            <div>
              <span className="text-slate-400">Team Name:</span>
              <span className="text-slate-100 ml-2">{teamForm.teamName}</span>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Register for {event.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-2xl"
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
