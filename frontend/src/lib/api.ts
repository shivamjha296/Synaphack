import axios, { AxiosInstance, AxiosResponse } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          })

          const { access_token, refresh_token } = response.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/api/auth/register', userData),
  
  googleAuth: (token: string) =>
    api.post('/api/auth/google', { token }),
  
  refresh: () =>
    api.post('/api/auth/refresh'),
  
  getProfile: () =>
    api.get('/api/auth/me'),
  
  logout: () =>
    api.post('/api/auth/logout'),
}

// Events API
export const eventsAPI = {
  getAll: (params?: any) =>
    api.get('/api/events', { params }),
  
  getById: (id: string) =>
    api.get(`/api/events/${id}`),
  
  create: (eventData: any) =>
    api.post('/api/events', eventData),
  
  update: (id: string, eventData: any) =>
    api.put(`/api/events/${id}`, eventData),
  
  delete: (id: string) =>
    api.delete(`/api/events/${id}`),
  
  register: (id: string) =>
    api.post(`/api/events/${id}/register`),
  
  unregister: (id: string) =>
    api.delete(`/api/events/${id}/register`),
  
  getMyEvents: () =>
    api.get('/api/events/my-events'),
  
  getAnalytics: (id: string) =>
    api.get(`/api/events/${id}/analytics`),
}

// Teams API
export const teamsAPI = {
  getAll: (params?: any) =>
    api.get('/api/teams', { params }),
  
  create: (teamData: any) =>
    api.post('/api/teams', teamData),
  
  getById: (id: string) =>
    api.get(`/api/teams/${id}`),
  
  update: (id: string, teamData: any) =>
    api.put(`/api/teams/${id}`, teamData),
  
  delete: (id: string) =>
    api.delete(`/api/teams/${id}`),
  
  join: (id: string) =>
    api.post(`/api/teams/${id}/join`),
  
  leave: (id: string) =>
    api.post(`/api/teams/${id}/leave`),
  
  invite: (id: string, inviteData: any) =>
    api.post(`/api/teams/${id}/invite`, inviteData),
  
  transferLeadership: (id: string, userId: string) =>
    api.post(`/api/teams/${id}/transfer-leadership/${userId}`),
  
  getEventTeams: (eventId: string) =>
    api.get(`/api/teams/event/${eventId}`),
}

// Submissions API
export const submissionsAPI = {
  getAll: (params?: any) =>
    api.get('/api/submissions', { params }),
  
  create: (submissionData: any) =>
    api.post('/api/submissions', submissionData),
  
  getById: (id: string) =>
    api.get(`/api/submissions/${id}`),
  
  update: (id: string, submissionData: any) =>
    api.put(`/api/submissions/${id}`, submissionData),
  
  delete: (id: string) =>
    api.delete(`/api/submissions/${id}`),
  
  submit: (id: string) =>
    api.post(`/api/submissions/${id}/submit`),
  
  getEventSubmissions: (eventId: string) =>
    api.get(`/api/submissions/event/${eventId}`),
  
  getTeamSubmissions: (teamId: string) =>
    api.get(`/api/submissions/team/${teamId}`),
}

// Scores API
export const scoresAPI = {
  create: (scoreData: any) =>
    api.post('/api/scores', scoreData),
  
  getById: (id: string) =>
    api.get(`/api/scores/${id}`),
  
  update: (id: string, scoreData: any) =>
    api.put(`/api/scores/${id}`, scoreData),
  
  getSubmissionScores: (submissionId: string) =>
    api.get(`/api/scores/submission/${submissionId}`),
}

// Announcements API
export const announcementsAPI = {
  create: (announcementData: any) =>
    api.post('/api/announcements', announcementData),
  
  getById: (id: string) =>
    api.get(`/api/announcements/${id}`),
  
  delete: (id: string) =>
    api.delete(`/api/announcements/${id}`),
  
  getEventAnnouncements: (eventId: string) =>
    api.get(`/api/announcements/event/${eventId}`),
}

// Sponsors API
export const sponsorsAPI = {
  getAll: () =>
    api.get('/api/sponsors'),
  
  getById: (id: string) =>
    api.get(`/api/sponsors/${id}`),
  
  create: (sponsorData: any) =>
    api.post('/api/sponsors', sponsorData),
  
  update: (id: string, sponsorData: any) =>
    api.put(`/api/sponsors/${id}`, sponsorData),
  
  delete: (id: string) =>
    api.delete(`/api/sponsors/${id}`),
  
  getEventSponsors: (eventId: string) =>
    api.get(`/api/sponsors/event/${eventId}`),
}

// Certificates API
export const certificatesAPI = {
  generate: (certificateData: any) =>
    api.post('/api/certificates/generate', certificateData),
  
  getUserCertificate: (userId: string, eventId: string, type: string = 'participation') =>
    api.get(`/api/certificates/user/${userId}/event/${eventId}?certificate_type=${type}`),
}

// Users API
export const usersAPI = {
  getAll: (params?: any) =>
    api.get('/api/users', { params }),
  
  getById: (id: string) =>
    api.get(`/api/users/${id}`),
  
  update: (id: string, userData: any) =>
    api.put(`/api/users/${id}`, userData),
  
  delete: (id: string) =>
    api.delete(`/api/users/${id}`),
  
  deactivate: (id: string) =>
    api.post(`/api/users/${id}/deactivate`),
  
  activate: (id: string) =>
    api.post(`/api/users/${id}/activate`),
}

export default api
