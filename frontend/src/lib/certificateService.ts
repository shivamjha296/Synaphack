import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where,
  Timestamp,
  getDoc
} from 'firebase/firestore'
import { db } from './firebase'

export interface Certificate {
  id?: string
  eventId: string
  participantId: string
  participantName: string
  participantEmail: string
  eventTitle: string
  completionDate: Date
  certificateBase64?: string
  certificateNumber: string
  issuedAt: Date
  template: 'participation' | 'completion' | 'achievement' | 'winner'
  additionalData?: {
    position?: string
    score?: number
    teamName?: string
    specialMention?: string
  }
  status: 'generated' | 'issued' | 'revoked'
}

export interface CertificateTemplate {
  id: string
  name: string
  type: 'participation' | 'completion' | 'achievement' | 'winner'
  backgroundImageUrl?: string
  layout: {
    participantName: { x: number; y: number; fontSize: number; color: string }
    eventTitle: { x: number; y: number; fontSize: number; color: string }
    completionDate: { x: number; y: number; fontSize: number; color: string }
    certificateNumber: { x: number; y: number; fontSize: number; color: string }
    organizerSignature?: { x: number; y: number; width: number; height: number }
  }
  dimensions: { width: number; height: number }
  fonts: {
    primary: string
    secondary: string
  }
}

class CertificateService {
  private readonly certificatesCollection = 'certificates'
  private readonly templatesCollection = 'certificateTemplates'

  // Generate certificate number
  private generateCertificateNumber(eventId: string): string {
    const timestamp = new Date().getTime()
    const eventPrefix = eventId.substring(0, 4).toUpperCase()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${eventPrefix}-${timestamp}-${random}`
  }

  // Create certificate canvas
  private async createCertificateCanvas(
    certificate: Certificate,
    template: CertificateTemplate
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = template.dimensions.width
    canvas.height = template.dimensions.height

    // Load background image if exists
    if (template.backgroundImageUrl) {
      const bgImage = new Image()
      await new Promise((resolve) => {
        bgImage.onload = resolve
        bgImage.src = template.backgroundImageUrl!
      })
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height)
    } else {
      // Default gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#f8fafc')
      gradient.addColorStop(1, '#e2e8f0')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Add border
    ctx.strokeStyle = '#gold'
    ctx.lineWidth = 8
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    // Draw certificate content
    const { layout } = template

    // Participant name
    ctx.font = `${layout.participantName.fontSize}px ${template.fonts.primary}`
    ctx.fillStyle = layout.participantName.color
    ctx.textAlign = 'center'
    ctx.fillText(
      certificate.participantName,
      layout.participantName.x,
      layout.participantName.y
    )

    // Event title
    ctx.font = `${layout.eventTitle.fontSize}px ${template.fonts.secondary}`
    ctx.fillStyle = layout.eventTitle.color
    ctx.fillText(
      certificate.eventTitle,
      layout.eventTitle.x,
      layout.eventTitle.y
    )

    // Completion date
    ctx.font = `${layout.completionDate.fontSize}px ${template.fonts.secondary}`
    ctx.fillStyle = layout.completionDate.color
    ctx.fillText(
      `Completed on ${certificate.completionDate.toLocaleDateString()}`,
      layout.completionDate.x,
      layout.completionDate.y
    )

    // Certificate number
    ctx.font = `${layout.certificateNumber.fontSize}px ${template.fonts.secondary}`
    ctx.fillStyle = layout.certificateNumber.color
    ctx.textAlign = 'left'
    ctx.fillText(
      `Certificate No: ${certificate.certificateNumber}`,
      layout.certificateNumber.x,
      layout.certificateNumber.y
    )

    // Add certificate title
    ctx.font = `48px ${template.fonts.primary}`
    ctx.fillStyle = '#1e40af'
    ctx.textAlign = 'center'
    ctx.fillText(
      'CERTIFICATE OF COMPLETION',
      canvas.width / 2,
      150
    )

    // Add achievement text
    ctx.font = `24px ${template.fonts.secondary}`
    ctx.fillStyle = '#374151'
    ctx.fillText(
      'This is to certify that',
      canvas.width / 2,
      200
    )

    ctx.fillText(
      'has successfully completed the hackathon',
      canvas.width / 2,
      layout.participantName.y + 60
    )

    // Add additional data if present
    if (certificate.additionalData) {
      let yOffset = layout.eventTitle.y + 80
      
      if (certificate.additionalData.position) {
        ctx.font = `32px ${template.fonts.primary}`
        ctx.fillStyle = '#dc2626'
        ctx.fillText(
          `${certificate.additionalData.position} Position`,
          canvas.width / 2,
          yOffset
        )
        yOffset += 50
      }

      if (certificate.additionalData.teamName) {
        ctx.font = `20px ${template.fonts.secondary}`
        ctx.fillStyle = '#374151'
        ctx.fillText(
          `Team: ${certificate.additionalData.teamName}`,
          canvas.width / 2,
          yOffset
        )
      }
    }

    return canvas
  }

  // Convert canvas to blob
  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, 'image/png')
    })
  }

  // Convert blob to base64 string
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Get default template
  private getDefaultTemplate(): CertificateTemplate {
    return {
      id: 'default',
      name: 'Default Certificate',
      type: 'completion',
      layout: {
        participantName: { x: 400, y: 280, fontSize: 40, color: '#1e40af' },
        eventTitle: { x: 400, y: 380, fontSize: 28, color: '#374151' },
        completionDate: { x: 400, y: 480, fontSize: 20, color: '#6b7280' },
        certificateNumber: { x: 50, y: 550, fontSize: 16, color: '#9ca3af' }
      },
      dimensions: { width: 800, height: 600 },
      fonts: {
        primary: 'serif',
        secondary: 'sans-serif'
      }
    }
  }

  // Generate certificate for participant
  async generateCertificate(
    eventId: string,
    participantId: string,
    participantName: string,
    participantEmail: string,
    eventTitle: string,
    template: 'participation' | 'completion' | 'achievement' | 'winner' = 'completion',
    additionalData?: Certificate['additionalData']
  ): Promise<Certificate> {
    try {
      const certificateNumber = this.generateCertificateNumber(eventId)
      
      const certificate: Certificate = {
        eventId,
        participantId,
        participantName,
        participantEmail,
        eventTitle,
        completionDate: new Date(),
        certificateNumber,
        issuedAt: new Date(),
        template,
        additionalData,
        status: 'generated'
      }

      // Get template (for now using default, can be extended to fetch from DB)
      const templateData = this.getDefaultTemplate()

      // Generate certificate canvas
      const canvas = await this.createCertificateCanvas(certificate, templateData)
      
      // Convert to blob and then to base64
      const blob = await this.canvasToBlob(canvas)
      const certificateBase64 = await this.blobToBase64(blob)
      
      certificate.certificateBase64 = certificateBase64
      certificate.status = 'issued'

      // Save certificate to database
      const docRef = await addDoc(collection(db, this.certificatesCollection), {
        ...certificate,
        completionDate: Timestamp.fromDate(certificate.completionDate),
        issuedAt: Timestamp.fromDate(certificate.issuedAt)
      })

      certificate.id = docRef.id
      return certificate

    } catch (error) {
      console.error('Error generating certificate:', error)
      throw new Error('Failed to generate certificate')
    }
  }

  // Generate certificates for all successful participants of an event
  async generateCertificatesForEvent(eventId: string): Promise<Certificate[]> {
    try {
      // Get event details
      const eventDoc = await getDoc(doc(db, 'events', eventId))
      if (!eventDoc.exists()) {
        throw new Error('Event not found')
      }
      
      const event = eventDoc.data()
      
      // Import submission service to check for actual submissions
      const { submissionService } = await import('./submissionService')
      
      // Get all submissions for this event
      const allSubmissions = await submissionService.getEventSubmissions(eventId)
      console.log('Found submissions for certificate generation:', allSubmissions.length)
      
      // Filter for successful submissions (approved or reviewed submissions)
      const successfulSubmissions = allSubmissions.filter(submission => 
        submission.status === 'approved' || 
        submission.status === 'reviewed' ||
        (submission.status === 'submitted' && submission.score && submission.score >= 0)
      )
      
      console.log('Successful submissions eligible for certificates:', successfulSubmissions.length)
      
      if (successfulSubmissions.length === 0) {
        console.log('No successful submissions found for certificate generation')
        return []
      }

      const certificates: Certificate[] = []

      // Generate certificate for each successful participant (avoid duplicates by email)
      const processedEmails = new Set<string>()
      
      for (const submission of successfulSubmissions) {
        if (processedEmails.has(submission.participantEmail)) {
          continue // Skip duplicate participants
        }
        
        processedEmails.add(submission.participantEmail)
        
        // Check if certificate already exists
        const existingCertQuery = query(
          collection(db, this.certificatesCollection),
          where('eventId', '==', eventId),
          where('participantEmail', '==', submission.participantEmail)
        )
        
        const existingCerts = await getDocs(existingCertQuery)
        
        if (existingCerts.empty) {
          // Determine certificate type based on submission performance
          let certificateType: Certificate['template'] = 'completion'
          let additionalData: Certificate['additionalData'] = {
            teamName: submission.teamName
          }
          
          if (submission.score !== undefined) {
            additionalData.score = submission.score
            if (submission.score >= 90) {
              certificateType = 'achievement'
            }
          }

          const certificate = await this.generateCertificate(
            eventId,
            submission.participantEmail,
            submission.participantName,
            submission.participantEmail,
            event.title,
            certificateType,
            additionalData
          )
          
          certificates.push(certificate)
          console.log('Generated certificate for:', submission.participantName)
        } else {
          console.log('Certificate already exists for:', submission.participantName)
        }
      }

      return certificates
    } catch (error) {
      console.error('Error generating certificates for event:', error)
      throw new Error('Failed to generate certificates for event')
    }
  }

  // Get participant certificates
  async getParticipantCertificates(participantEmail: string): Promise<Certificate[]> {
    try {
      const certificatesQuery = query(
        collection(db, this.certificatesCollection),
        where('participantEmail', '==', participantEmail)
      )
      
      const snapshot = await getDocs(certificatesQuery)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completionDate: doc.data().completionDate.toDate(),
        issuedAt: doc.data().issuedAt.toDate()
      })) as Certificate[]
    } catch (error) {
      console.error('Error fetching participant certificates:', error)
      throw new Error('Failed to fetch certificates')
    }
  }

  // Get event certificates
  async getEventCertificates(eventId: string): Promise<Certificate[]> {
    try {
      const certificatesQuery = query(
        collection(db, this.certificatesCollection),
        where('eventId', '==', eventId)
      )
      
      const snapshot = await getDocs(certificatesQuery)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completionDate: doc.data().completionDate.toDate(),
        issuedAt: doc.data().issuedAt.toDate()
      })) as Certificate[]
    } catch (error) {
      console.error('Error fetching event certificates:', error)
      throw new Error('Failed to fetch certificates')
    }
  }

  // Download certificate as PDF
  async downloadCertificateAsPDF(certificateId: string): Promise<void> {
    try {
      const certificateDoc = await getDoc(doc(db, this.certificatesCollection, certificateId))
      
      if (!certificateDoc.exists()) {
        throw new Error('Certificate not found')
      }
      
      const certificate = certificateDoc.data() as Certificate
      
      if (certificate.certificateBase64) {
        // Create a download link from the base64 data
        const link = document.createElement('a')
        link.href = certificate.certificateBase64
        link.download = `Certificate-${certificate.certificateNumber}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
      throw new Error('Failed to download certificate')
    }
  }

  // Verify certificate
  async verifyCertificate(certificateNumber: string): Promise<Certificate | null> {
    try {
      const certificatesQuery = query(
        collection(db, this.certificatesCollection),
        where('certificateNumber', '==', certificateNumber),
        where('status', '==', 'issued')
      )
      
      const snapshot = await getDocs(certificatesQuery)
      
      if (snapshot.empty) {
        return null
      }
      
      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        completionDate: doc.data().completionDate.toDate(),
        issuedAt: doc.data().issuedAt.toDate()
      } as Certificate
    } catch (error) {
      console.error('Error verifying certificate:', error)
      return null
    }
  }

  // Check if participant is eligible for certificate based on submissions
  async isEligibleForCertificate(eventId: string, participantEmail: string): Promise<boolean> {
    try {
      const { submissionService } = await import('./submissionService')
      
      // Get participant's submissions for this event
      const participantSubmissions = await submissionService.getParticipantSubmissions(participantEmail, eventId)
      
      // Check if there are any successful submissions
      const successfulSubmissions = participantSubmissions.filter(submission => 
        submission.status === 'approved' || 
        submission.status === 'reviewed' ||
        (submission.status === 'submitted' && submission.score !== undefined && submission.score >= 0)
      )
      
      return successfulSubmissions.length > 0
    } catch (error) {
      console.error('Error checking certificate eligibility:', error)
      return false
    }
  }

  // Get participant's certificate for a specific event (if eligible)
  async getParticipantEventCertificate(eventId: string, participantEmail: string): Promise<Certificate | null> {
    try {
      // First check if eligible
      const isEligible = await this.isEligibleForCertificate(eventId, participantEmail)
      if (!isEligible) {
        return null
      }

      // Check if certificate exists
      const certificatesQuery = query(
        collection(db, this.certificatesCollection),
        where('eventId', '==', eventId),
        where('participantEmail', '==', participantEmail),
        where('status', '==', 'issued')
      )
      
      const snapshot = await getDocs(certificatesQuery)
      
      if (snapshot.empty) {
        return null
      }
      
      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        completionDate: doc.data().completionDate.toDate(),
        issuedAt: doc.data().issuedAt.toDate()
      } as Certificate
    } catch (error) {
      console.error('Error getting participant event certificate:', error)
      return null
    }
  }
}

export const certificateService = new CertificateService()
