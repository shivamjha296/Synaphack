'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService, UserRole } from '@/lib/authService'

interface LoginCredentials {
  email: string
  password: string
}

const LoginPage = () => {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole>('participant')
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      let userData
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Name is required for sign up')
        }
        userData = await authService.signUpWithEmail(credentials.email, credentials.password, name, selectedRole)
      } else {
        userData = await authService.signInWithEmail(credentials.email, credentials.password)
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    }
    
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')

    try {
      const userData = await authService.signInWithGoogle(selectedRole)
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-blue-400">
            HackPlatform
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-100">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Choose your role and access your dashboard
          </p>
        </div>

        {/* Role Selection */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-medium text-slate-100 mb-4">Select Your Role</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['participant', 'organizer', 'judge'] as UserRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setSelectedRole(role)
                  setCredentials({ email: '', password: '' })
                  setError('')
                }}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  selectedRole === role
                    ? 'border-blue-500 bg-blue-900/30 text-blue-400'
                    : 'border-slate-600 hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="font-medium capitalize">{role}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {role === 'participant' && 'Join events'}
                  {role === 'organizer' && 'Host events'}
                  {role === 'judge' && 'Evaluate projects'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-6" onSubmit={handleEmailLogin}>
          {/* Sign Up/Sign In Toggle */}
          <div className="flex justify-center space-x-1 bg-slate-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !isSignUp
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isSignUp
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Name field for sign up */}
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-slate-600 bg-slate-700 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-md p-3">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign in')}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full flex justify-center items-center py-2 px-4 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Info Section */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-200 mb-2">Getting Started:</h4>
          <div className="text-xs text-slate-400 space-y-1">
            <div>• <strong>Participants:</strong> Join exciting hackathons and showcase your skills</div>
            <div>• <strong>Organizers:</strong> Create and manage amazing events</div>
            <div>• <strong>Judges:</strong> Evaluate projects and provide valuable feedback</div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
