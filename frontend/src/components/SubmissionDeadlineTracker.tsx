import { useState, useEffect } from 'react'
import { submissionService, RoundSubmission } from '../lib/submissionService'
import { Event } from '../lib/eventService'

interface SubmissionDeadlineTrackerProps {
  events: (Event & { registrationData: any })[]
  userSubmissions: { [eventId: string]: RoundSubmission[] }
  onOpenSubmissionForm: (event: Event, round: any) => void
}

interface DeadlineAlert {
  eventId: string
  eventTitle: string
  roundId: string
  roundName: string
  deadline: Date
  hoursLeft: number
  hasSubmission: boolean
  status: 'urgent' | 'warning' | 'normal' | 'passed'
}

const SubmissionDeadlineTracker = ({
  events = [],
  userSubmissions = {},
  onOpenSubmissionForm
}: SubmissionDeadlineTrackerProps) => {

  const [deadlineAlerts, setDeadlineAlerts] = useState<DeadlineAlert[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const alerts: DeadlineAlert[] = []
    const now = new Date()

    events.forEach(event => {
      const eventSubmissions = userSubmissions[event.id!] || []
      
      // Check main event deadline
      if (event.timeline?.submissionDeadline) {
        const deadline = typeof event.timeline.submissionDeadline === 'string'
          ? new Date(event.timeline.submissionDeadline)
          : event.timeline.submissionDeadline;
        // Ensure deadline is a valid Date
        if (deadline instanceof Date && !isNaN(deadline.getTime())) {
          const hoursLeft = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
          const hasSubmission = eventSubmissions.some(s => s.eventId === event.id);
          let status: DeadlineAlert['status'] = 'normal';
          if (hoursLeft < 0) status = 'passed';
          else if (hoursLeft <= 6) status = 'urgent';
          else if (hoursLeft <= 24) status = 'warning';
          alerts.push({
            eventId: event.id!,
            eventTitle: event.title,
            roundId: 'main',
            roundName: 'Main Submission',
            deadline,
            hoursLeft,
            hasSubmission,
            status
          });
        } else {
          console.error("Invalid deadline for event:", event);
        }
      }

      // Check round deadlines
      if (event.rounds) {
        event.rounds.forEach(round => {
          if (round.submissionDeadline) {
            const deadline =
              round.submissionDeadline && typeof (round.submissionDeadline as any).toDate === 'function'
                ? (round.submissionDeadline as any).toDate()
                : typeof round.submissionDeadline === 'string'
                ? new Date(round.submissionDeadline)
                : round.submissionDeadline;
            // Ensure deadline is a valid Date
            if (deadline instanceof Date && !isNaN(deadline.getTime())) {
              const hoursLeft = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
              const hasSubmission = eventSubmissions.some(s => s.roundId === round.id);
              let status: DeadlineAlert['status'] = 'normal';
              if (hoursLeft < 0) status = 'passed';
              else if (hoursLeft <= 6) status = 'urgent';
              else if (hoursLeft <= 24) status = 'warning';
              alerts.push({
                eventId: event.id!,
                eventTitle: event.title,
                roundId: round.id,
                roundName: round.name,
                deadline,
                hoursLeft,
                hasSubmission,
                status
              });
            } else {
              console.error("Invalid deadline for round:", round);
            }
          }
        });
      }
    })

    // Sort by urgency and time left
    alerts.sort((a, b) => {
      const statusOrder = { urgent: 0, warning: 1, normal: 2, passed: 3 }
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status]
      }
      return a.hoursLeft - b.hoursLeft
    })

    setDeadlineAlerts(alerts)
  }, [events, userSubmissions])

  const getStatusColor = (status: DeadlineAlert['status']) => {
    switch (status) {
      case 'urgent': return 'bg-red-500/20 border-red-500/30 text-red-300'
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
      case 'normal': return 'bg-green-500/20 border-green-500/30 text-green-300'
      case 'passed': return 'bg-gray-500/20 border-gray-500/30 text-gray-300'
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-300'
    }
  }

  const getStatusIcon = (status: DeadlineAlert['status']) => {
    switch (status) {
      case 'urgent': return '🚨'
      case 'warning': return '⚠️'
      case 'normal': return '⏰'
      case 'passed': return '❌'
      default: return '⏰'
    }
  }

  const formatTimeLeft = (hoursLeft: number) => {
    if (hoursLeft < 0) return 'Deadline passed'
    if (hoursLeft === 0) return 'Less than 1 hour left'
    if (hoursLeft < 24) return `${hoursLeft}h left`
    const days = Math.floor(hoursLeft / 24)
    const hours = hoursLeft % 24
    return `${days}d ${hours}h left`
  }

  const urgentAlerts = deadlineAlerts.filter(a => a.status === 'urgent' && !a.hasSubmission)
  const displayAlerts = showAll ? deadlineAlerts : deadlineAlerts.slice(0, 5)

  if (deadlineAlerts.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 mb-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-xl font-semibold text-white drop-shadow-lg">Submission Deadlines</h3>
          {urgentAlerts.length > 0 && (
            <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs font-medium rounded-full border border-red-500/30">
              {urgentAlerts.length} Urgent
            </span>
          )}
        </div>
        {deadlineAlerts.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-green-300 hover:text-green-200 text-sm font-medium transition-colors"
          >
            {showAll ? 'Show Less' : `Show All (${deadlineAlerts.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayAlerts.map((alert, index) => {
          const event = events.find(e => e.id === alert.eventId)
          const round = event?.rounds?.find(r => r.id === alert.roundId)

          return (
            <div
              key={`${alert.eventId}-${alert.roundId}`}
              className={`border rounded-xl p-4 transition-all backdrop-blur-sm shadow-lg hover:shadow-xl ${getStatusColor(alert.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(alert.status)}</span>
                  <div>
                    <h4 className="font-medium text-white drop-shadow-lg">
                      {alert.eventTitle} - {alert.roundName}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm">
                      <span className="text-green-200">
                        Deadline: {alert.deadline.toLocaleDateString()} at {alert.deadline.toLocaleTimeString()}
                      </span>
                      <span className={`font-medium ${
                        alert.status === 'urgent' ? 'text-red-300' :
                        alert.status === 'warning' ? 'text-yellow-300' :
                        'text-green-300'
                      }`}>
                        {formatTimeLeft(alert.hoursLeft)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {alert.hasSubmission ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm font-medium rounded-lg border border-green-500/30 shadow-md">
                      ✓ Submitted
                    </span>
                  ) : alert.status === 'passed' ? (
                    <span className="px-3 py-1 bg-gray-500/20 text-gray-300 text-sm font-medium rounded-lg border border-gray-500/30 shadow-md">
                      Missed
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (event && round) {
                          onOpenSubmissionForm(event, round)
                        } else if (event) {
                          onOpenSubmissionForm(event, { 
                            id: 'main', 
                            name: 'Main Submission',
                            submissionDeadline: alert.deadline 
                          })
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-lg hover:shadow-xl ${
                        alert.status === 'urgent' 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white'
                          : alert.status === 'warning'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white'
                      }`}
                    >
                      Submit Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {urgentAlerts.length > 0 && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm shadow-lg">
          <div className="flex items-center space-x-2 text-red-300">
            <span>🚨</span>
            <span className="font-medium">
              You have {urgentAlerts.length} urgent submission{urgentAlerts.length > 1 ? 's' : ''} due within 6 hours!
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubmissionDeadlineTracker
