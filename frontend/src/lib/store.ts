import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface User {
  id: string
  email: string
  full_name: string
  role: 'participant' | 'organizer' | 'judge' | 'admin'
  bio?: string
  skills?: string[]
  social_links?: Record<string, string>
  profile_picture?: string
  is_active: boolean
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string
  short_description?: string
  banner_image?: string
  event_type: string
  mode: string
  venue?: string
  max_participants?: number
  max_team_size: number
  registration_start: string
  registration_end: string
  event_start: string
  event_end: string
  tracks?: string[]
  rules?: string
  judging_criteria?: Array<{ criteria: string; weight: number }>
  prizes?: Array<{ position: string; prize: string }>
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
  is_public: boolean
  organizer_id: string
  organizer: User
  participants_count: number
  teams_count: number
  created_at: string
}

export interface Team {
  id: string
  name: string
  description?: string
  track?: string
  event_id: string
  event_name?: string
  leader_id: string
  leader: User
  max_size: number
  members: Array<{
    id: string
    user: User
    role: string
    joined_at: string
  }>
  created_at: string
  // Frontend-specific computed properties
  is_member?: boolean
  is_full?: boolean
}

export interface Submission {
  id: string
  title: string
  description: string
  github_url?: string
  demo_url?: string
  video_url?: string
  track?: string
  technologies?: string[]
  event_id: string
  team_id: string
  submitter_id: string
  team: Team
  submitter: User
  presentation_file?: string
  additional_files?: string[]
  round_number: number
  status: 'draft' | 'submitted' | 'under_review' | 'reviewed'
  submitted_at?: string
  created_at: string
  average_score?: number
}

export interface Announcement {
  id: string
  title: string
  content: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  target_audience: 'all' | 'participants' | 'judges' | 'organizers'
  event_id: string
  author_id: string
  author_name: string
  created_at: string
  is_read?: boolean
}

// Auth Store
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  googleLogin: (token: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  updateProfile: (userData: any) => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      login: async (email: string, password: string) => {
        set({ loading: true })
        try {
          const { authAPI } = await import('./api')
          const response = await authAPI.login(email, password)
          const { access_token, refresh_token } = response.data

          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          // Get user profile
          const profileResponse = await authAPI.getProfile()
          const user = profileResponse.data

          set({ user, isAuthenticated: true, loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      googleLogin: async (token: string) => {
        set({ loading: true })
        try {
          const { authAPI } = await import('./api')
          const response = await authAPI.googleAuth(token)
          const { access_token, refresh_token } = response.data

          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          // Get user profile
          const profileResponse = await authAPI.getProfile()
          const user = profileResponse.data

          set({ user, isAuthenticated: true, loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      register: async (userData: any) => {
        set({ loading: true })
        try {
          const { authAPI } = await import('./api')
          await authAPI.register(userData)
          set({ loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, isAuthenticated: false })
      },

      updateProfile: async (userData: any) => {
        const { user } = get()
        if (!user) return

        try {
          const { usersAPI } = await import('./api')
          const response = await usersAPI.update(user.id, userData)
          set({ user: response.data })
        } catch (error) {
          throw error
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
      },

      setLoading: (loading: boolean) => {
        set({ loading })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// Events Store
interface EventsState {
  events: Event[]
  currentEvent: Event | null
  loading: boolean
  fetchEvents: () => Promise<void>
  fetchEvent: (id: string) => Promise<void>
  createEvent: (eventData: any) => Promise<Event>
  updateEvent: (id: string, eventData: any) => Promise<Event>
  deleteEvent: (id: string) => Promise<void>
  registerForEvent: (id: string) => Promise<void>
  setCurrentEvent: (event: Event | null) => void
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  currentEvent: null,
  loading: false,

  fetchEvents: async () => {
    set({ loading: true })
    try {
      const { eventsAPI } = await import('./api')
      const response = await eventsAPI.getAll()
      set({ events: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchEvent: async (id: string) => {
    set({ loading: true })
    try {
      const { eventsAPI } = await import('./api')
      const response = await eventsAPI.getById(id)
      set({ currentEvent: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  createEvent: async (eventData: any) => {
    try {
      console.log('Store: createEvent called with data:', eventData)
      const { eventsAPI } = await import('./api')
      console.log('Store: About to call eventsAPI.create')
      const response = await eventsAPI.create(eventData)
      console.log('Store: API response received:', response)
      const newEvent = response.data
      
      set(state => ({ events: [newEvent, ...state.events] }))
      console.log('Store: Event added to state successfully')
      return newEvent
    } catch (error) {
      console.error('Store: createEvent error:', error)
      throw error
    }
  },

  updateEvent: async (id: string, eventData: any) => {
    try {
      const { eventsAPI } = await import('./api')
      const response = await eventsAPI.update(id, eventData)
      const updatedEvent = response.data
      
      set(state => ({
        events: state.events.map(event => 
          event.id === id ? updatedEvent : event
        ),
        currentEvent: state.currentEvent?.id === id ? updatedEvent : state.currentEvent
      }))
      
      return updatedEvent
    } catch (error) {
      throw error
    }
  },

  deleteEvent: async (id: string) => {
    try {
      const { eventsAPI } = await import('./api')
      await eventsAPI.delete(id)
      
      set(state => ({
        events: state.events.filter(event => event.id !== id),
        currentEvent: state.currentEvent?.id === id ? null : state.currentEvent
      }))
    } catch (error) {
      throw error
    }
  },

  registerForEvent: async (id: string) => {
    try {
      const { eventsAPI } = await import('./api')
      await eventsAPI.register(id)
      
      // Refresh current event data
      const response = await eventsAPI.getById(id)
      const updatedEvent = response.data
      
      set(state => ({
        events: state.events.map(event => 
          event.id === id ? updatedEvent : event
        ),
        currentEvent: state.currentEvent?.id === id ? updatedEvent : state.currentEvent
      }))
    } catch (error) {
      throw error
    }
  },

  setCurrentEvent: (event: Event | null) => {
    set({ currentEvent: event })
  },
}))

// Teams Store
interface TeamsState {
  teams: Team[]
  currentTeam: Team | null
  loading: boolean
  fetchTeams: () => Promise<void>
  fetchEventTeams: (eventId: string) => Promise<void>
  fetchTeam: (id: string) => Promise<void>
  createTeam: (teamData: any) => Promise<Team>
  updateTeam: (id: string, teamData: any) => Promise<Team>
  deleteTeam: (id: string) => Promise<void>
  joinTeam: (id: string) => Promise<void>
  leaveTeam: (id: string) => Promise<void>
  setCurrentTeam: (team: Team | null) => void
}

export const useTeamsStore = create<TeamsState>((set, get) => ({
  teams: [],
  currentTeam: null,
  loading: false,

  fetchTeams: async () => {
    set({ loading: true })
    try {
      const { teamsAPI } = await import('./api')
      const response = await teamsAPI.getAll()
      set({ teams: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchEventTeams: async (eventId: string) => {
    set({ loading: true })
    try {
      const { teamsAPI } = await import('./api')
      const response = await teamsAPI.getEventTeams(eventId)
      set({ teams: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchTeam: async (id: string) => {
    set({ loading: true })
    try {
      const { teamsAPI } = await import('./api')
      const response = await teamsAPI.getById(id)
      set({ currentTeam: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  createTeam: async (teamData: any) => {
    try {
      const { teamsAPI } = await import('./api')
      const response = await teamsAPI.create(teamData)
      const newTeam = response.data
      
      set(state => ({ teams: [newTeam, ...state.teams] }))
      return newTeam
    } catch (error) {
      throw error
    }
  },

  updateTeam: async (id: string, teamData: any) => {
    try {
      const { teamsAPI } = await import('./api')
      const response = await teamsAPI.update(id, teamData)
      const updatedTeam = response.data
      
      set(state => ({
        teams: state.teams.map(team => 
          team.id === id ? updatedTeam : team
        ),
        currentTeam: state.currentTeam?.id === id ? updatedTeam : state.currentTeam
      }))
      
      return updatedTeam
    } catch (error) {
      throw error
    }
  },

  deleteTeam: async (id: string) => {
    try {
      const { teamsAPI } = await import('./api')
      await teamsAPI.delete(id)
      
      set(state => ({
        teams: state.teams.filter(team => team.id !== id),
        currentTeam: state.currentTeam?.id === id ? null : state.currentTeam
      }))
    } catch (error) {
      throw error
    }
  },

  joinTeam: async (id: string) => {
    try {
      const { teamsAPI } = await import('./api')
      await teamsAPI.join(id)
      
      // Refresh team data
      const response = await teamsAPI.getById(id)
      const updatedTeam = response.data
      
      set(state => ({
        teams: state.teams.map(team => 
          team.id === id ? updatedTeam : team
        ),
        currentTeam: state.currentTeam?.id === id ? updatedTeam : state.currentTeam
      }))
    } catch (error) {
      throw error
    }
  },

  leaveTeam: async (id: string) => {
    try {
      const { teamsAPI } = await import('./api')
      await teamsAPI.leave(id)
      
      // Remove team from current user's teams
      set(state => ({
        teams: state.teams.filter(team => team.id !== id),
        currentTeam: state.currentTeam?.id === id ? null : state.currentTeam
      }))
    } catch (error) {
      throw error
    }
  },

  setCurrentTeam: (team: Team | null) => {
    set({ currentTeam: team })
  },
}))

// Submissions Store
interface SubmissionsState {
  submissions: Submission[]
  currentSubmission: Submission | null
  loading: boolean
  fetchSubmissions: () => Promise<void>
  fetchSubmission: (id: string) => Promise<void>
  createSubmission: (submissionData: any) => Promise<Submission>
  updateSubmission: (id: string, submissionData: any) => Promise<Submission>
  deleteSubmission: (id: string) => Promise<void>
  submitForReview: (id: string) => Promise<void>
  setCurrentSubmission: (submission: Submission | null) => void
}

export const useSubmissionsStore = create<SubmissionsState>((set, get) => ({
  submissions: [],
  currentSubmission: null,
  loading: false,

  fetchSubmissions: async () => {
    set({ loading: true })
    try {
      const { submissionsAPI } = await import('./api')
      const response = await submissionsAPI.getAll()
      set({ submissions: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  fetchSubmission: async (id: string) => {
    set({ loading: true })
    try {
      const { submissionsAPI } = await import('./api')
      const response = await submissionsAPI.getById(id)
      set({ currentSubmission: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  createSubmission: async (submissionData: any) => {
    try {
      const { submissionsAPI } = await import('./api')
      const response = await submissionsAPI.create(submissionData)
      const newSubmission = response.data
      
      set(state => ({ submissions: [newSubmission, ...state.submissions] }))
      return newSubmission
    } catch (error) {
      throw error
    }
  },

  updateSubmission: async (id: string, submissionData: any) => {
    try {
      const { submissionsAPI } = await import('./api')
      const response = await submissionsAPI.update(id, submissionData)
      const updatedSubmission = response.data
      
      set(state => ({
        submissions: state.submissions.map(submission => 
          submission.id === id ? updatedSubmission : submission
        ),
        currentSubmission: state.currentSubmission?.id === id ? updatedSubmission : state.currentSubmission
      }))
      
      return updatedSubmission
    } catch (error) {
      throw error
    }
  },

  deleteSubmission: async (id: string) => {
    try {
      const { submissionsAPI } = await import('./api')
      await submissionsAPI.delete(id)
      
      set(state => ({
        submissions: state.submissions.filter(submission => submission.id !== id),
        currentSubmission: state.currentSubmission?.id === id ? null : state.currentSubmission
      }))
    } catch (error) {
      throw error
    }
  },

  submitForReview: async (id: string) => {
    try {
      const { submissionsAPI } = await import('./api')
      await submissionsAPI.submit(id)
      
      // Refresh submission data
      const response = await submissionsAPI.getById(id)
      const updatedSubmission = response.data
      
      set(state => ({
        submissions: state.submissions.map(submission => 
          submission.id === id ? updatedSubmission : submission
        ),
        currentSubmission: state.currentSubmission?.id === id ? updatedSubmission : state.currentSubmission
      }))
    } catch (error) {
      throw error
    }
  },

  setCurrentSubmission: (submission: Submission | null) => {
    set({ currentSubmission: submission })
  },
}))
