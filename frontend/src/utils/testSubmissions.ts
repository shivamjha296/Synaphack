// Test submission creation
// This can be run in the browser console to test if submissions work

import { submissionService, RoundSubmission } from '../lib/submissionService'

export const testSubmission = async (eventId: string) => {
  try {
    console.log('Testing submission for event:', eventId)
    
    const testSubmissionData = {
      eventId: eventId,
      roundId: 'round1', // Default round
      participantEmail: 'test@example.com',
      participantName: 'Test Participant',
      teamName: 'Test Team',
      submissionData: {
        pptLink: 'https://example.com/presentation.pptx',
        githubLink: 'https://github.com/test/project',
        videoLink: 'https://youtube.com/watch?v=test',
        description: 'This is a test submission',
        tags: ['test', 'demo'],
        additionalLinks: [
          { name: 'Live Demo', url: 'https://example.com/demo' }
        ]
      },
      status: 'submitted' as const,
      isTeamSubmission: true,
      teamMembers: [
        { name: 'Test Participant', email: 'test@example.com', role: 'Lead Developer' }
      ]
    }

    const submissionId = await submissionService.submitForRound(testSubmissionData)
    console.log('Test submission created with ID:', submissionId)
    
    // Try to retrieve it
    const submissions = await submissionService.getEventSubmissions(eventId)
    console.log('Retrieved submissions:', submissions)
    
    return submissionId
  } catch (error) {
    console.error('Test submission failed:', error)
    throw error
  }
}

// Function to clear test submissions (for cleanup)
export const clearTestSubmissions = async (eventId: string) => {
  try {
    const submissions = await submissionService.getEventSubmissions(eventId)
    const testSubmissions = submissions.filter((s: RoundSubmission) => s.participantEmail === 'test@example.com')
    
    console.log('Found test submissions to delete:', testSubmissions.length)
    
    for (const submission of testSubmissions) {
      if (submission.id) {
        await submissionService.deleteSubmission(submission.id)
        console.log('Deleted test submission:', submission.id)
      }
    }
  } catch (error) {
    console.error('Error clearing test submissions:', error)
  }
}
