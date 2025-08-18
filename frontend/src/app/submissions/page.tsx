'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Upload, 
  Github, 
  ExternalLink, 
  Video, 
  Trophy, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

import { useAuthStore, useSubmissionsStore } from '@/lib/store'

const submissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  github_url: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  demo_url: z.string().url('Invalid demo URL').optional().or(z.literal('')),
  video_url: z.string().url('Invalid video URL').optional().or(z.literal('')),
  track: z.string().optional(),
  technologies: z.string().optional(),
  team_id: z.string().min(1, 'Please select a team'),
})

type SubmissionFormData = z.infer<typeof submissionSchema>

export default function SubmissionsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSubmission, setEditingSubmission] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('my-submissions')
  const { user } = useAuthStore()
  const { submissions, fetchSubmissions, createSubmission, updateSubmission, deleteSubmission, loading } = useSubmissionsStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchSubmissions()
  }, [user, router, fetchSubmissions])

  const handleCreateSubmission = () => {
    setEditingSubmission(null)
    setShowCreateModal(true)
  }

  const handleEditSubmission = (submission: any) => {
    setEditingSubmission(submission)
    setShowCreateModal(true)
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    if (confirm('Are you sure you want to delete this submission?')) {
      await deleteSubmission(submissionId)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const tabs = [
    { id: 'my-submissions', name: 'My Submissions' },
    { id: 'team-submissions', name: 'Team Submissions' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submissions</h1>
              <p className="text-gray-600">Submit and manage your project submissions</p>
            </div>
            <button
              onClick={handleCreateSubmission}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>New Submission</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Submissions Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Submit your first project to get started.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateSubmission}
                className="btn-primary"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Submission
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onEdit={() => handleEditSubmission(submission)}
                onDelete={() => handleDeleteSubmission(submission.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <SubmissionModal
          submission={editingSubmission}
          onClose={() => setShowCreateModal(false)}
          onSave={async (data) => {
            if (editingSubmission) {
              await updateSubmission(editingSubmission.id, data)
            } else {
              await createSubmission(data)
            }
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

// Submission Card Component
function SubmissionCard({ 
  submission, 
  onEdit, 
  onDelete 
}: { 
  submission: any; 
  onEdit: () => void; 
  onDelete: () => void 
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-500" />
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'reviewed':
        return <Trophy className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'submitted':
        return 'bg-green-100 text-green-800'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{submission.title}</h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                {getStatusIcon(submission.status)}
                <span className="ml-1 capitalize">{submission.status.replace('_', ' ')}</span>
              </span>
              {submission.average_score && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Trophy className="h-3 w-3 mr-1" />
                  {submission.average_score.toFixed(1)}/10
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{submission.description}</p>

        {/* Technologies */}
        {submission.technologies && submission.technologies.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {submission.technologies.slice(0, 3).map((tech: string) => (
                <span key={tech} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  {tech}
                </span>
              ))}
              {submission.technologies.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  +{submission.technologies.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="space-y-2 mb-4">
          {submission.github_url && (
            <a
              href={submission.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-gray-600 hover:text-primary-600"
            >
              <Github className="h-4 w-4 mr-2" />
              View Code
            </a>
          )}
          {submission.demo_url && (
            <a
              href={submission.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-gray-600 hover:text-primary-600"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Live Demo
            </a>
          )}
          {submission.video_url && (
            <a
              href={submission.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-gray-600 hover:text-primary-600"
            >
              <Video className="h-4 w-4 mr-2" />
              Demo Video
            </a>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 mb-4">
          <div>Team: {submission.team?.name}</div>
          <div>Event: {submission.team?.event_name}</div>
          <div>Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Not submitted'}</div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button className="btn-secondary text-sm flex-1">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </button>
          {submission.status === 'draft' && (
            <button className="btn-primary text-sm">
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Submission Modal
function SubmissionModal({ 
  submission, 
  onClose, 
  onSave 
}: { 
  submission?: any; 
  onClose: () => void; 
  onSave: (data: SubmissionFormData) => void 
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: submission ? {
      title: submission.title,
      description: submission.description,
      github_url: submission.github_url || '',
      demo_url: submission.demo_url || '',
      video_url: submission.video_url || '',
      track: submission.track || '',
      technologies: submission.technologies?.join(', ') || '',
      team_id: submission.team_id,
    } : {},
  })

  // Mock teams for now - this would come from the teams store
  const mockTeams = [
    { id: '1', name: 'Team Alpha', event_name: 'Web3 Hackathon 2024' },
    { id: '2', name: 'Team Beta', event_name: 'AI Innovation Challenge' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {submission ? 'Edit Submission' : 'Create New Submission'}
          </h2>

          <form onSubmit={handleSubmit(onSave)} className="space-y-6">
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <select
                {...register('team_id')}
                className="input-field"
              >
                <option value="">Select a team</option>
                {mockTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.event_name})
                  </option>
                ))}
              </select>
              {errors.team_id && (
                <p className="mt-1 text-sm text-red-600">{errors.team_id.message}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title
              </label>
              <input
                {...register('title')}
                type="text"
                className="input-field"
                placeholder="Enter project title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                {...register('description')}
                rows={5}
                className="input-field"
                placeholder="Describe your project, what it does, how it works..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Track */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Track (Optional)
              </label>
              <input
                {...register('track')}
                type="text"
                className="input-field"
                placeholder="e.g., Web3, AI/ML, Climate Tech"
              />
            </div>

            {/* Technologies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technologies Used (Optional)
              </label>
              <input
                {...register('technologies')}
                type="text"
                className="input-field"
                placeholder="e.g., React, Python, PostgreSQL, AWS (comma-separated)"
              />
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    {...register('github_url')}
                    type="url"
                    className="input-field pl-10"
                    placeholder="https://github.com/username/repo"
                  />
                </div>
                {errors.github_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.github_url.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Live Demo URL (Optional)
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    {...register('demo_url')}
                    type="url"
                    className="input-field pl-10"
                    placeholder="https://your-demo-site.com"
                  />
                </div>
                {errors.demo_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.demo_url.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Demo Video URL (Optional)
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    {...register('video_url')}
                    type="url"
                    className="input-field pl-10"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                {errors.video_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.video_url.message}</p>
                )}
              </div>
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Files (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Upload presentation slides, documentation, or other files
                </p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.zip"
                />
                <button
                  type="button"
                  className="mt-2 btn-secondary text-sm"
                >
                  Choose Files
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-secondary"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {submission ? 'Update Submission' : 'Submit Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
