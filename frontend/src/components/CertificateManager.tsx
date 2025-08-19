import { useState, useEffect } from 'react'
import { certificateService, Certificate } from '../lib/certificateService'
import { useAuth } from '../hooks/useAuth'

interface CertificateManagerProps {
  eventId: string
  eventTitle: string
}

const CertificateManager = ({ eventId, eventTitle }: CertificateManagerProps) => {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([])

  useEffect(() => {
    loadCertificates()
  }, [eventId])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      const eventCertificates = await certificateService.getEventCertificates(eventId)
      setCertificates(eventCertificates)
    } catch (error) {
      console.error('Error loading certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAllCertificates = async () => {
    try {
      setGenerating(true)
      const newCertificates = await certificateService.generateCertificatesForEvent(eventId)
      
      if (newCertificates.length > 0) {
        await loadCertificates() // Reload to get updated list
        alert(`Successfully generated ${newCertificates.length} certificates!`)
      } else {
        alert('No new certificates to generate. All eligible participants already have certificates.')
      }
    } catch (error) {
      console.error('Error generating certificates:', error)
      alert('Failed to generate certificates. Please try again.')
    } finally {
      setGenerating(false)
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

  const handleSelectAll = () => {
    if (selectedCertificates.length === certificates.length) {
      setSelectedCertificates([])
    } else {
      setSelectedCertificates(certificates.map(cert => cert.id!))
    }
  }

  const handleDownloadSelected = async () => {
    for (const certId of selectedCertificates) {
      await handleDownloadCertificate(certId)
      // Small delay to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading certificates...</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Certificate Management</h3>
          <p className="text-gray-600 mt-1">Generate and manage completion certificates</p>
        </div>
        
        <div className="flex space-x-3">
          {certificates.length > 0 && (
            <>
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {selectedCertificates.length === certificates.length ? 'Deselect All' : 'Select All'}
              </button>
              
              {selectedCertificates.length > 0 && (
                <button
                  onClick={handleDownloadSelected}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                >
                  Download Selected ({selectedCertificates.length})
                </button>
              )}
            </>
          )}
          
          <button
            onClick={handleGenerateAllCertificates}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {generating ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              'Generate Certificates'
            )}
          </button>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            📜
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Certificates Generated</h4>
          <p className="text-gray-600 mb-4">
            Generate certificates for participants who successfully completed their submissions.
          </p>
          <button
            onClick={handleGenerateAllCertificates}
            disabled={generating}
            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Certificates'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <span>Total certificates: {certificates.length}</span>
            <span>{selectedCertificates.length} selected</span>
          </div>

          <div className="grid gap-4">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedCertificates.includes(certificate.id!)
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedCertificates.includes(certificate.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCertificates([...selectedCertificates, certificate.id!])
                        } else {
                          setSelectedCertificates(selectedCertificates.filter(id => id !== certificate.id))
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    
                    <div>
                      <h4 className="font-medium text-gray-900">{certificate.participantName}</h4>
                      <p className="text-sm text-gray-600">{certificate.participantEmail}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          Certificate: {certificate.certificateNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          Issued: {certificate.issuedAt.toLocaleDateString()}
                        </span>
                        {certificate.additionalData?.teamName && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                            Team: {certificate.additionalData.teamName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      certificate.status === 'issued' 
                        ? 'bg-green-100 text-green-700'
                        : certificate.status === 'generated'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {certificate.status}
                    </span>
                    
                    <button
                      onClick={() => handleDownloadCertificate(certificate.id!)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                    >
                      Download
                    </button>
                    
                    {certificate.certificateBase64 && (
                      <a
                        href={certificate.certificateBase64}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CertificateManager
