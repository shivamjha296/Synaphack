'use client'

import { useState, useEffect } from 'react'
import { submissionService, RoundSubmission } from '@/lib/submissionService'

interface SubmissionFormProps {
  event: any
  round: any
  participantEmail: string
  participantName: string
  teamName?: string
  teamMembers?: { name: string; email: string; role: string }[]
  onClose: () => void
  onSubmissionComplete: () => void
  existingSubmission?: RoundSubmission | null
}

const SubmissionForm = ({
  event,
  round,
  participantEmail,
  participantName,
  teamName,
  teamMembers,
  onClose,
  onSubmissionComplete,
  existingSubmission
}: SubmissionFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    pptLink: '',
    githubLink: '',
    videoLink: '',
    description: '',
    tags: [] as string[],
    additionalLinks: [] as { name: string; url: string }[]
  })

  // Initialize form with existing submission data
  useEffect(() => {
    if (existingSubmission) {
      setFormData({
        pptLink: existingSubmission.submissionData.pptLink || '',
        githubLink: existingSubmission.submissionData.githubLink || '',
        videoLink: existingSubmission.submissionData.videoLink || '',
        description: existingSubmission.submissionData.description || '',
        tags: existingSubmission.submissionData.tags || [],
        additionalLinks: existingSubmission.submissionData.additionalLinks || []
      })
    }
  }, [existingSubmission])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addAdditionalLink = () => {
    setFormData(prev => ({
      ...prev,
      additionalLinks: [...prev.additionalLinks, { name: '', url: '' }]
    }))
  }

  const removeAdditionalLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalLinks: prev.additionalLinks.filter((_, i) => i !== index)
    }))
  }

  const updateAdditionalLink = (index: number, field: 'name' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalLinks: prev.additionalLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }))
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Check if user can submit for team
      const permission = await submissionService.canUserSubmitForTeam(event.id!, participantEmail)
      if (!permission.canSubmit) {
        throw new Error(permission.reason || 'You do not have permission to submit for this team')
      }

      // Validate submission
      const validation = submissionService.validateSubmission(formData)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // Check if submission is late
      const isLate = submissionService.isSubmissionLate(new Date(round.submissionDeadline))
      
      const submissionDataObject = {
        ...formData,
        status: isLate ? 'late' : 'submitted'
      }

      const teamData = teamName ? {
        teamName,
        teamMembers
      } : undefined

      // Use the new GitMCP URL generation method
      await submissionService.submitForRoundWithGitMCP(
        event.id!,
        round.id,
        submissionDataObject,
        participantEmail,
        participantName,
        !!teamName, // isTeamSubmission
        teamData
      )
      
      console.log('Submission with GitMCP URL completed successfully')
      onSubmissionComplete()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isSubmissionLate = submissionService.isSubmissionLate(new Date(round.submissionDeadline))
  const timeUntilDeadline = new Date(round.submissionDeadline).getTime() - new Date().getTime()
  const hoursUntilDeadline = Math.floor(timeUntilDeadline / (1000 * 60 * 60))

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              {existingSubmission ? 'Update Submission' : 'Submit for Round'}
            </h2>
            <p className="text-slate-300 mt-1">
              {round.name} - {event.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-2xl bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Deadline Warning */}
        <div className={`p-4 border-b border-slate-700 ${
          isSubmissionLate 
            ? 'bg-red-900/20 border-red-800' 
            : hoursUntilDeadline < 24 
              ? 'bg-yellow-900/20 border-yellow-800' 
              : 'bg-blue-900/20 border-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isSubmissionLate ? 'bg-red-500' : hoursUntilDeadline < 24 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              isSubmissionLate ? 'text-red-400' : hoursUntilDeadline < 24 ? 'text-yellow-400' : 'text-blue-400'
            }`}>
              {isSubmissionLate 
                ? '⚠️ Deadline has passed - This will be marked as a late submission'
                : hoursUntilDeadline < 24
                  ? `⏰ Deadline in ${hoursUntilDeadline} hours - ${new Date(round.submissionDeadline).toLocaleString()}`
                  : `📅 Deadline: ${new Date(round.submissionDeadline).toLocaleString()}`
              }
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Main Submission Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Submission Links</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Presentation Link (PPT/PDF/Slides)
              </label>
              <input
                type="url"
                value={formData.pptLink}
                onChange={(e) => handleInputChange('pptLink', e.target.value)}
                placeholder="https://docs.google.com/presentation/... or https://drive.google.com/..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Google Slides, PowerPoint Online, or any shareable presentation link
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                GitHub Repository Link
              </label>
              <input
                type="url"
                value={formData.githubLink}
                onChange={(e) => handleInputChange('githubLink', e.target.value)}
                placeholder="https://github.com/username/repository"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Your project's source code repository
              </p>
              {formData.githubLink && (
                <div className="mt-2 p-2 bg-purple-900/20 border border-purple-500/30 rounded text-xs text-purple-200">
                  <span className="mr-1">�</span>
                  <strong>GitMCP URL:</strong> A direct link to GitMCP analysis will be automatically generated and visible to judges.
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Demo Video Link
              </label>
              <input
                type="url"
                value={formData.videoLink}
                onChange={(e) => handleInputChange('videoLink', e.target.value)}
                placeholder="https://youtube.com/... or https://drive.google.com/..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                YouTube, Google Drive, or any shareable video link
              </p>
            </div>
          </div>

          {/* Additional Links */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-100">Additional Links</h3>
              <button
                type="button"
                onClick={addAdditionalLink}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Add Link
              </button>
            </div>
            
            {formData.additionalLinks.map((link, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={link.name}
                  onChange={(e) => updateAdditionalLink(index, 'name', e.target.value)}
                  placeholder="Link name (e.g., Live Demo, Documentation)"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateAdditionalLink(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="flex-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeAdditionalLink(index)}
                  className="px-3 py-2 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Project Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              placeholder="Describe your project, what it does, how it works, and any special features..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Technologies/Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-400 hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add technology/framework (press Enter)"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag((e.target as HTMLInputElement).value)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
            />
            <p className="text-xs text-slate-400 mt-1">
              e.g., React, Node.js, Python, Machine Learning, etc.
            </p>
          </div>

          {/* Team Information Display */}
          {teamName && teamMembers && teamMembers.length > 0 && (
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Team Submission</h3>
              <p className="text-slate-300 mb-2">Team: {teamName}</p>
              <div className="space-y-1">
                {teamMembers.map((member, index) => (
                  <div key={index} className="text-sm text-slate-400">
                    {member.name} ({member.email}) - {member.role}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-300 border border-slate-600 rounded-md hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 rounded-md font-medium ${
                isSubmissionLate
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:opacity-50`}
            >
              {isLoading 
                ? (existingSubmission 
                    ? 'Updating...' 
                    : formData.githubLink 
                      ? 'Submitting & Generating GitMCP URL...' 
                      : 'Submitting...') 
                : existingSubmission 
                  ? 'Update Submission'
                  : isSubmissionLate 
                    ? 'Submit Late' 
                    : formData.githubLink
                      ? 'Submit & Generate GitMCP URL'
                      : 'Submit'
              }
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default SubmissionForm
