'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authService, UserRole } from '@/lib/authService'
import FloatingParticles from '../../components/FloatingParticles'
import BackgroundGrid from '../../components/BackgroundGrid'

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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-gray-100 relative overflow-hidden">
      {/* Background Grid */}
      <BackgroundGrid />
      
      {/* Floating Particles */}
      <FloatingParticles />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/15 to-rose-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-48 h-48 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(156,163,175,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(156,163,175,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Liquid Glass Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-pink-400/10 to-rose-600/10 rounded-full blur-2xl animate-float-delay"></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-gradient-to-br from-cyan-400/10 to-teal-600/10 rounded-full blur-xl animate-float-slow"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-md bg-gray-900/50 border-b border-gray-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:scale-105 transition-transform font-space-grotesk">
                🚀 Build2Skill
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/" className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Glassmorphism Container */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Welcome Back
              </h2>
            </div>

            {/* Role Selection */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
              <div className="grid grid-cols-3 gap-2">
                {(['participant', 'organizer', 'judge'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role)
                      setCredentials({ email: '', password: '' })
                      setError('')
                    }}
                    className={`p-2 rounded-xl border backdrop-blur-sm text-center transition-all duration-300 transform hover:scale-105 ${
                      selectedRole === role
                        ? 'border-blue-500/50 bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-300 shadow-lg'
                        : 'border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="text-lg mb-1">
                      {role === 'participant' && '👨‍💻'}
                      {role === 'organizer' && '🎯'}
                      {role === 'judge' && '⚖️'}
                    </div>
                    <div className="text-xs font-medium capitalize">{role}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form className="space-y-4" onSubmit={handleEmailLogin}>
              {/* Sign Up/Sign In Toggle */}
              <div className="flex justify-center">
                <div className="flex bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      !isSignUp
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isSignUp
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Name field for sign up */}
              {isSignUp && (
                <div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-300"
                    placeholder="Full name"
                  />
                </div>
              )}

              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-300"
                  placeholder="Email address"
                />
              </div>

              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-400 transition-all duration-300"
                  placeholder="Password"
                />
              </div>

              {error && (
                <div className="text-red-300 text-sm text-center bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-3">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 text-gray-900 py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:from-gray-400 hover:via-gray-200 hover:to-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/50 shadow-lg ${
                    isLoading ? 'opacity-50 cursor-not-allowed transform-none' : ''
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                      {isSignUp ? 'Creating...' : 'Signing in...'}
                    </div>
                  ) : (
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-r from-black/50 to-black/50 backdrop-blur-sm text-gray-400">
                    Or
                  </span>
                </div>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 text-gray-900 rounded-xl font-medium hover:from-gray-400 hover:via-gray-200 hover:to-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/50 transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  isLoading ? 'opacity-50 cursor-not-allowed transform-none' : ''
                }`}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes float-delay {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-180deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(90deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float-delay 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default LoginPage
