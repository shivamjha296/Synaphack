import { useState, useEffect } from 'react'
import { certificateService, Certificate } from '../lib/certificateService'

export const useCertificates = (participantEmail?: string) => {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (participantEmail) {
      loadCertificates()
    }
  }, [participantEmail])

  const loadCertificates = async () => {
    try {
      setLoading(true)
      setError(null)
      const userCertificates = await certificateService.getParticipantCertificates(participantEmail!)
      setCertificates(userCertificates)
    } catch (err) {
      console.error('Error loading certificates:', err)
      setError('Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = async (certificateId: string) => {
    try {
      await certificateService.downloadCertificateAsPDF(certificateId)
    } catch (err) {
      console.error('Error downloading certificate:', err)
      setError('Failed to download certificate')
    }
  }

  const verifyCertificate = async (certificateNumber: string) => {
    try {
      return await certificateService.verifyCertificate(certificateNumber)
    } catch (err) {
      console.error('Error verifying certificate:', err)
      setError('Failed to verify certificate')
      return null
    }
  }

  return {
    certificates,
    loading,
    error,
    loadCertificates,
    downloadCertificate,
    verifyCertificate
  }
}

export const useEventCertificates = (eventId: string) => {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (eventId) {
      loadEventCertificates()
    }
  }, [eventId])

  const loadEventCertificates = async () => {
    try {
      setLoading(true)
      setError(null)
      const eventCertificates = await certificateService.getEventCertificates(eventId)
      setCertificates(eventCertificates)
    } catch (err) {
      console.error('Error loading event certificates:', err)
      setError('Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }

  const generateAllCertificates = async () => {
    try {
      setGenerating(true)
      setError(null)
      const newCertificates = await certificateService.generateCertificatesForEvent(eventId)
      if (newCertificates.length > 0) {
        await loadEventCertificates() // Reload certificates
      }
      return newCertificates
    } catch (err) {
      console.error('Error generating certificates:', err)
      setError('Failed to generate certificates')
      return []
    } finally {
      setGenerating(false)
    }
  }

  const downloadCertificate = async (certificateId: string) => {
    try {
      await certificateService.downloadCertificateAsPDF(certificateId)
    } catch (err) {
      console.error('Error downloading certificate:', err)
      setError('Failed to download certificate')
    }
  }

  return {
    certificates,
    loading,
    generating,
    error,
    loadEventCertificates,
    generateAllCertificates,
    downloadCertificate
  }
}
