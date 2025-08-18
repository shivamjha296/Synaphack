import { NextPage } from 'next'
import Link from 'next/link'
import { Calendar, Users, Trophy, Rocket } from 'lucide-react'

const HomePage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                HackPlatform
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/events" className="text-gray-700 hover:text-primary-600">
                Events
              </Link>
              <Link href="/auth/login" className="btn-outline">
                Login
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Host Amazing
            <span className="text-primary-600"> Hackathons</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The modern platform for organizing, participating in, and judging hackathons. 
            Streamlined workflows for organizers, seamless experience for participants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
              Start Your Hackathon
            </Link>
            <Link href="/events" className="btn-outline text-lg px-8 py-3">
              Browse Events
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card text-center">
            <Calendar className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Event Management</h3>
            <p className="text-gray-600">
              Create and manage events with ease. Set timelines, tracks, and prizes.
            </p>
          </div>
          
          <div className="card text-center">
            <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Team Formation</h3>
            <p className="text-gray-600">
              Form teams, invite members, and collaborate seamlessly.
            </p>
          </div>
          
          <div className="card text-center">
            <Trophy className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Judging System</h3>
            <p className="text-gray-600">
              Multi-round scoring with detailed rubrics and feedback.
            </p>
          </div>
          
          <div className="card text-center">
            <Rocket className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Submissions</h3>
            <p className="text-gray-600">
              Upload presentations, link GitHub repos, and showcase demos.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600">500+</div>
              <div className="text-gray-600">Events Hosted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600">10,000+</div>
              <div className="text-gray-600">Participants</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600">$2M+</div>
              <div className="text-gray-600">Prizes Awarded</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-primary-600 rounded-lg text-white p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Host Your Event?</h2>
          <p className="text-xl mb-6 opacity-90">
            Join thousands of organizers who trust our platform for their hackathons.
          </p>
          <Link href="/auth/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Get Started Today
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">HackPlatform</h3>
              <p className="text-gray-400">
                The modern solution for hackathon management and event hosting.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/events">Browse Events</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/features">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
                <li><Link href="/api-docs">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 HackPlatform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
