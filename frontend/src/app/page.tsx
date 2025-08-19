import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-400">
                HackPlatform
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="px-4 py-2 border border-blue-500 text-blue-400 rounded-md hover:bg-slate-700 transition-colors">
                Login
              </Link>
              <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-100 mb-6">
            Host Amazing
            <span className="text-blue-400"> Hackathons</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            The modern platform for organizing, participating in, and judging hackathons. 
            Streamlined workflows for organizers, seamless experience for participants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="bg-blue-600 text-white text-lg px-8 py-3 rounded-md hover:bg-blue-700 text-center transition-colors">
              Start Your Hackathon
            </Link>
            <Link href="/login" className="border border-blue-500 text-blue-400 text-lg px-8 py-3 rounded-md hover:bg-slate-800 text-center transition-colors">
              Browse Events
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-200 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Easy Setup</h3>
            <p className="text-slate-400">Create your hackathon in minutes with our intuitive interface</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-green-200 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Team Management</h3>
            <p className="text-slate-400">Advanced tools for managing participants and teams</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-purple-200 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Smart Judging</h3>
            <p className="text-slate-400">Fair and transparent evaluation system for all projects</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-orange-200 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Real-time Analytics</h3>
            <p className="text-slate-400">Track progress and engagement throughout your event</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-slate-800 rounded-2xl p-8 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">1,200+</div>
              <div className="text-slate-300">Hackathons Hosted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">50,000+</div>
              <div className="text-slate-300">Participants</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">15,000+</div>
              <div className="text-slate-300">Projects Submitted</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300 mb-8">Join thousands of innovators building the future</p>
          <Link href="/login" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
            Launch Your Event Today
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-blue-400 mb-2">HackPlatform</h3>
            <p className="text-slate-400">Empowering innovation through collaborative hackathons</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
