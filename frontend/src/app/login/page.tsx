'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type UserRole = 'organizer' | 'participant' | 'judge'

interface LoginCredentials {
  email: string
  password: string
  role: UserRole
}

// Dummy user data for authentication
const dummyUsers = {
  organizer: {
    email: 'organizer@hackplatform.com',
    password: 'organizer123',
    name: 'John Organizer'
  },
  participant: {
    email: 'participant@hackplatform.com',
    password: 'participant123',
    name: 'Jane Participant'
  },
  judge: {
    email: 'judge@hackplatform.com',
    password: 'judge123',
    name: 'Mike Judge'
  }
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check credentials against dummy data
    const user = dummyUsers[selectedRole]
    if (credentials.email === user.email && credentials.password === user.password) {
      // Store user data in localStorage (in real app, use proper auth)
      localStorage.setItem('user', JSON.stringify({
        email: user.email,
        name: user.name,
        role: selectedRole
      }))

      // Redirect to unified dashboard
      router.push('/dashboard')
    } else {
      setError('Invalid email or password')
    }
    
    setIsLoading(false)
  }

  const fillDummyCredentials = () => {
    const user = dummyUsers[selectedRole]
    setCredentials({
      email: user.email,
      password: user.password
    })
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
        <form className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-6" onSubmit={handleLogin}>
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

          {/* Demo Credentials Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={fillDummyCredentials}
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Fill demo credentials for {selectedRole}
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Demo Credentials Info */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-200 mb-2">Demo Credentials:</h4>
          <div className="text-xs text-slate-400 space-y-1">
            <div><strong>Participant:</strong> participant@hackplatform.com / participant123</div>
            <div><strong>Organizer:</strong> organizer@hackplatform.com / organizer123</div>
            <div><strong>Judge:</strong> judge@hackplatform.com / judge123</div>
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
