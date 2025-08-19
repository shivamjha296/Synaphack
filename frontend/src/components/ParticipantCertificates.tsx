import { useState, useEffect } from 'react'
import { certificateService, Certificate } from '../lib/certificateService'
import { useAuth } from '../hooks/useAuth'

const ParticipantCertificates = () => {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingCert, setVerifyingCert] = useState('')
  const [verificationResult, setVerificationResult] = useState<Certificate | null>(null)
  const [showVerification, setShowVerification] = useState(false)

  useEffect(() => {
    if (user?.email) {
      loadCertificates()
    }
  }, [user])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      const userCertificates = await certificateService.getParticipantCertificates(user!.email!)
      setCertificates(userCertificates)
    } catch (error) {
      console.error('Error loading certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      await certificateService.downloadCertificateAsPDF(certificateId)
    } catch (error) {
      console.error('Error downloading certificate:', error)
      alert('Failed to download certificate.')
    }
  }

  const handleVerifyCertificate = async () => {
    if (!verifyingCert.trim()) return
    
    try {
      const result = await certificateService.verifyCertificate(verifyingCert.trim())
      setVerificationResult(result)
    } catch (error) {
      console.error('Error verifying certificate:', error)
      setVerificationResult(null)
    }
  }

  const getCertificateTypeIcon = (template: string) => {
    switch (template) {
      case 'winner': return '🏆'
      case 'achievement': return '🎖️'
      case 'completion': return '✅'
      case 'participation': return '🎫'
      default: return '📜'
    }
  }

  const getCertificateTypeColor = (template: string) => {
    switch (template) {
      case 'winner': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'achievement': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'completion': return 'bg-green-100 text-green-800 border-green-300'
      case 'participation': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading your certificates...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
        <p className="text-gray-600">Your hackathon achievement certificates</p>
      </div>

      {/* Certificate Verification */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Certificate Verification</h3>
          <button
            onClick={() => setShowVerification(!showVerification)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showVerification ? 'Hide' : 'Verify Certificate'}
          </button>
        </div>

        {showVerification && (
          <div className="space-y-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={verifyingCert}
                onChange={(e) => setVerifyingCert(e.target.value)}
                placeholder="Enter certificate number to verify"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleVerifyCertificate}
                disabled={!verifyingCert.trim()}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Verify
              </button>
            </div>

            {verificationResult && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-600">✅</span>
                  <span className="font-medium text-green-800">Certificate Verified</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Participant:</strong> {verificationResult.participantName}</p>
                  <p><strong>Event:</strong> {verificationResult.eventTitle}</p>
                  <p><strong>Completion Date:</strong> {verificationResult.completionDate.toLocaleDateString()}</p>
                  <p><strong>Certificate Number:</strong> {verificationResult.certificateNumber}</p>
                </div>
              </div>
            )}

            {verifyingCert && verificationResult === null && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">❌</span>
                  <span className="font-medium text-red-800">Certificate Not Found</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  The certificate number you entered could not be verified.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificates List */}
      {certificates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
            📜
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
          <p className="text-gray-600">
            Complete hackathon submissions to earn certificates of completion.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Certificate Header */}
              <div className={`p-4 border-l-4 ${
                certificate.template === 'winner' ? 'border-yellow-400 bg-yellow-50' :
                certificate.template === 'achievement' ? 'border-purple-400 bg-purple-50' :
                certificate.template === 'completion' ? 'border-green-400 bg-green-50' :
                'border-blue-400 bg-blue-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCertificateTypeIcon(certificate.template)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {certificate.template} Certificate
                      </h4>
                      <p className="text-sm text-gray-600">{certificate.eventTitle}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getCertificateTypeColor(certificate.template)}`}>
                    {certificate.template}
                  </span>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Completion Date:</span>
                    <span className="text-sm text-gray-900">
                      {certificate.completionDate.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Certificate Number:</span>
                    <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                      {certificate.certificateNumber}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Issued Date:</span>
                    <span className="text-sm text-gray-900">
                      {certificate.issuedAt.toLocaleDateString()}
                    </span>
                  </div>

                  {certificate.additionalData?.teamName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Team:</span>
                      <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {certificate.additionalData.teamName}
                      </span>
                    </div>
                  )}

                  {certificate.additionalData?.position && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Achievement:</span>
                      <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded font-medium">
                        {certificate.additionalData.position}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDownloadCertificate(certificate.id!)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    Download
                  </button>
                  
                  {certificate.certificateBase64 && (
                    <a
                      href={certificate.certificateBase64}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-center"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Achievement Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{certificates.length}</div>
              <div className="text-sm text-gray-600">Total Certificates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {certificates.filter(c => c.template === 'completion').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {certificates.filter(c => c.template === 'achievement').length}
              </div>
              <div className="text-sm text-gray-600">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {certificates.filter(c => c.template === 'winner').length}
              </div>
              <div className="text-sm text-gray-600">Wins</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParticipantCertificates
