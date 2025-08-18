'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { 
  Trophy, 
  Star, 
  FileText, 
  Github, 
  ExternalLink, 
  Video, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  MessageSquare
} from 'lucide-react'

import { useAuthStore } from '@/lib/store'

const scoreSchema = z.object({
  innovation: z.number().min(1).max(10),
  technical_quality: z.number().min(1).max(10),
  design: z.number().min(1).max(10),
  presentation: z.number().min(1).max(10),
  business_value: z.number().min(1).max(10),
  comments: z.string().min(10, 'Comments must be at least 10 characters'),
})

type ScoreFormData = z.infer<typeof scoreSchema>

export default function JudgingPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [currentSubmission, setCurrentSubmission] = useState<any>(null)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [loading, setLoading] = useState(false)
  
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (user.role !== 'judge' && user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchSubmissions()
  }, [user, router])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      // Mock data for now - would connect to actual API
      const mockSubmissions = [
        {
          id: '1',
          title: 'EcoTrack - Carbon Footprint Tracker',
          description: 'A mobile app that helps users track and reduce their carbon footprint through gamification and social features.',
          team: { name: 'Green Coders', members: ['Alice', 'Bob', 'Charlie'] },
          event: { name: 'Climate Tech Hackathon 2024' },
          github_url: 'https://github.com/team/ecotrack',
          demo_url: 'https://ecotrack-demo.vercel.app',
          video_url: 'https://youtube.com/watch?v=demo',
          technologies: ['React Native', 'Node.js', 'MongoDB', 'AI/ML'],
          status: 'submitted',
          submitted_at: '2024-01-15T10:00:00Z',
          my_score: null,
          average_score: null,
        },
        {
          id: '2',
          title: 'HealthAI - Medical Diagnosis Assistant',
          description: 'An AI-powered medical diagnosis assistant that helps doctors make faster and more accurate diagnoses.',
          team: { name: 'MedTech Innovators', members: ['Dr. Smith', 'Jane Doe'] },
          event: { name: 'AI Innovation Challenge' },
          github_url: 'https://github.com/team/healthai',
          demo_url: 'https://healthai-demo.com',
          technologies: ['Python', 'TensorFlow', 'FastAPI', 'React'],
          status: 'submitted',
          submitted_at: '2024-01-14T15:30:00Z',
          my_score: { total: 8.5, innovation: 9, technical_quality: 8, design: 8, presentation: 9, business_value: 8 },
          average_score: 8.2,
        },
      ]
      setSubmissions(mockSubmissions)
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScore = (submission: any) => {
    setCurrentSubmission(submission)
    setShowScoreModal(true)
  }

  const submitScore = async (scoreData: ScoreFormData) => {
    try {
      // Would submit to actual API
      console.log('Submitting score for submission:', currentSubmission.id, scoreData)
      setShowScoreModal(false)
      setCurrentSubmission(null)
      // Refresh submissions to show updated scores
      await fetchSubmissions()
    } catch (error) {
      console.error('Failed to submit score:', error)
    }
  }

  if (!user || (user.role !== 'judge' && user.role !== 'admin')) {
    return <div>Access denied. Only judges can access this page.</div>
  }

  const filteredSubmissions = submissions.filter(submission => {
    switch (filterStatus) {
      case 'pending':
        return !submission.my_score
      case 'completed':
        return !!submission.my_score
      default:
        return true
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Judging Dashboard</h1>
            <p className="text-gray-600">Review and score hackathon submissions</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{submissions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {submissions.filter(s => !s.my_score).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Reviewed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {submissions.filter(s => !!s.my_score).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-primary-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Score Given</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {submissions.filter(s => s.my_score).length > 0 
                    ? (submissions.filter(s => s.my_score).reduce((acc, s) => acc + s.my_score.total, 0) / submissions.filter(s => s.my_score).length).toFixed(1)
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'pending', name: 'Pending Review', count: submissions.filter(s => !s.my_score).length },
              { id: 'completed', name: 'Completed', count: submissions.filter(s => !!s.my_score).length },
              { id: 'all', name: 'All Submissions', count: submissions.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  filterStatus === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.name}</span>
                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterStatus === 'pending' 
                ? 'All submissions have been reviewed.' 
                : 'No submissions match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onScore={() => handleScore(submission)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Score Modal */}
      {showScoreModal && currentSubmission && (
        <ScoreModal
          submission={currentSubmission}
          onClose={() => {
            setShowScoreModal(false)
            setCurrentSubmission(null)
          }}
          onSubmit={submitScore}
        />
      )}
    </div>
  )
}

// Submission Card for Judging
function SubmissionCard({ 
  submission, 
  onScore 
}: { 
  submission: any; 
  onScore: () => void;
}) {
  const hasMyScore = !!submission.my_score

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{submission.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
              <span>Team: {submission.team.name}</span>
              <span>Event: {submission.event.name}</span>
              <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              {hasMyScore ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Scored ({submission.my_score.total}/10)
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Review
                </span>
              )}
              {submission.average_score && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Avg: {submission.average_score}/10
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onScore}
            className={hasMyScore ? 'btn-secondary' : 'btn-primary'}
          >
            {hasMyScore ? 'Update Score' : 'Score Now'}
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4">{submission.description}</p>

        {/* Technologies */}
        {submission.technologies && submission.technologies.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {submission.technologies.map((tech: string) => (
                <span key={tech} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex space-x-4 mb-4">
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

        {/* My Previous Score (if exists) */}
        {hasMyScore && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Your Previous Score</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Innovation</span>
                <div className="font-medium">{submission.my_score.innovation}/10</div>
              </div>
              <div>
                <span className="text-gray-500">Technical</span>
                <div className="font-medium">{submission.my_score.technical_quality}/10</div>
              </div>
              <div>
                <span className="text-gray-500">Design</span>
                <div className="font-medium">{submission.my_score.design}/10</div>
              </div>
              <div>
                <span className="text-gray-500">Presentation</span>
                <div className="font-medium">{submission.my_score.presentation}/10</div>
              </div>
              <div>
                <span className="text-gray-500">Business</span>
                <div className="font-medium">{submission.my_score.business_value}/10</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Score Modal
function ScoreModal({ 
  submission, 
  onClose, 
  onSubmit 
}: { 
  submission: any; 
  onClose: () => void; 
  onSubmit: (data: ScoreFormData) => void 
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ScoreFormData>({
    resolver: zodResolver(scoreSchema),
    defaultValues: submission.my_score ? {
      innovation: submission.my_score.innovation,
      technical_quality: submission.my_score.technical_quality,
      design: submission.my_score.design,
      presentation: submission.my_score.presentation,
      business_value: submission.my_score.business_value,
      comments: submission.my_score.comments || '',
    } : {
      innovation: 5,
      technical_quality: 5,
      design: 5,
      presentation: 5,
      business_value: 5,
      comments: '',
    },
  })

  const watchedValues = watch()
  const totalScore = (
    watchedValues.innovation +
    watchedValues.technical_quality +
    watchedValues.design +
    watchedValues.presentation +
    watchedValues.business_value
  ) / 5

  const criteria = [
    { key: 'innovation', label: 'Innovation & Creativity', description: 'How novel and creative is the solution?' },
    { key: 'technical_quality', label: 'Technical Quality', description: 'Code quality, architecture, and technical implementation' },
    { key: 'design', label: 'Design & UX', description: 'User interface, user experience, and visual design' },
    { key: 'presentation', label: 'Presentation', description: 'How well is the project presented and explained?' },
    { key: 'business_value', label: 'Business Value', description: 'Commercial viability and potential impact' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Score Submission</h2>
            <h3 className="text-lg text-gray-700">{submission.title}</h3>
            <p className="text-sm text-gray-500">Team: {submission.team.name}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Submission Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Submission Details</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Description</h5>
                  <p className="text-sm text-gray-600">{submission.description}</p>
                </div>

                {submission.technologies && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Technologies</h5>
                    <div className="flex flex-wrap gap-1">
                      {submission.technologies.map((tech: string) => (
                        <span key={tech} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {submission.github_url && (
                    <a
                      href={submission.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      View Source Code
                    </a>
                  )}
                  {submission.demo_url && (
                    <a
                      href={submission.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Try Live Demo
                    </a>
                  )}
                  {submission.video_url && (
                    <a
                      href={submission.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Watch Demo Video
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Scoring Form */}
            <div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Scoring Criteria</h4>
                    <div className="text-lg font-semibold text-primary-600">
                      Total: {totalScore.toFixed(1)}/10
                    </div>
                  </div>

                  {/* Scoring Criteria */}
                  <div className="space-y-4">
                    {criteria.map((criterion) => (
                      <div key={criterion.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {criterion.label}
                        </label>
                        <p className="text-xs text-gray-500 mb-2">{criterion.description}</p>
                        <div className="flex items-center space-x-4">
                          <input
                            {...register(criterion.key as keyof ScoreFormData, { valueAsNumber: true })}
                            type="range"
                            min="1"
                            max="10"
                            className="flex-1"
                          />
                          <span className="text-sm font-medium text-gray-900 w-8">
                            {watchedValues[criterion.key as keyof ScoreFormData]}/10
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments & Feedback
                  </label>
                  <textarea
                    {...register('comments')}
                    rows={4}
                    className="input-field"
                    placeholder="Provide constructive feedback for the team..."
                  />
                  {errors.comments && (
                    <p className="mt-1 text-sm text-red-600">{errors.comments.message}</p>
                  )}
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
                    className="btn-primary"
                  >
                    Submit Score
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
