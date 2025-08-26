'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import FloatingParticles from '../components/FloatingParticles'
import TypingAnimation from '../components/TypingAnimation'
import AnimatedCounter from '../components/AnimatedCounter'
import BackgroundGrid from '../components/BackgroundGrid'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setIsLoaded(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-gray-100 relative overflow-hidden">
      {/* Background Grid */}
      <BackgroundGrid />
      
      {/* Floating Particles */}
      <FloatingParticles />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/15 to-rose-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-48 h-48 bg-gray-300/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(156,163,175,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(156,163,175,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Mouse Follower */}
        <div 
          className="absolute w-64 h-64 bg-gray-400/5 rounded-full blur-3xl transition-all duration-1000 ease-out pointer-events-none"
          style={{
            left: mousePosition.x - 128,
            top: mousePosition.y - 128,
          }}
        ></div>
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
            <div className="flex items-center space-x-4">
              <Link href="/login" className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-gray-500/25">
                Login
              </Link>
              <Link href="/login" className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-gray-500/25">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className={`text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center px-4 py-2 bg-gray-500/10 border border-gray-500/20 rounded-full text-sm text-gray-300 mb-8 backdrop-blur-sm">
            ✨ Introducing the future of hackathons
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-space-grotesk">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              <TypingAnimation 
                words={['Innovation', 'Collaboration', 'Creation', 'Excellence']}
                className="inline-block"
              />
            </span>
            <br />
            <span className="text-white">Starts Here</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-poppins">
            The most advanced platform for hosting, participating, and judging hackathons. 
            <br />
            <span className="text-gray-400">Where brilliant minds collaborate to build the future.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link href="/login" className="group relative bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 text-white text-lg px-8 py-4 rounded-full hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 transition-all duration-300 shadow-xl hover:shadow-gray-500/25 transform hover:scale-105">
              <span className="relative z-10">🚀 Start Your Hackathon</span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </Link>
            <Link href="/login" className="group border-2 border-gray-400/50 text-gray-400 text-lg px-8 py-4 rounded-full hover:bg-gray-400/10 transition-all duration-300 backdrop-blur-sm transform hover:scale-105">
              🎯 Explore Events
            </Link>
          </div>

          {/* Stats Counter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-500/20 rounded-2xl p-6 hover:bg-gray-800/50 transition-all group">
              <AnimatedCounter 
                end={1200} 
                suffix="+"
                className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform"
              />
              <div className="text-gray-300">Hackathons Hosted</div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-500/20 rounded-2xl p-6 hover:bg-gray-800/50 transition-all group">
              <AnimatedCounter 
                end={50000} 
                suffix="+"
                className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform"
              />
              <div className="text-gray-300">Active Developers</div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-500/20 rounded-2xl p-6 hover:bg-gray-800/50 transition-all group">
              <AnimatedCounter 
                end={15000} 
                suffix="+"
                className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform"
              />
              <div className="text-gray-300">Projects Built</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className={`mt-32 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-space-grotesk">
              <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto font-poppins">
              Everything you need to run successful hackathons, from ideation to celebration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Enhanced Feature Cards with 3D effects */}
            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-500/20 rounded-2xl p-6 hover:border-gray-400/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 perspective-1000">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <span className="text-2xl group-hover:animate-pulse">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-gray-300 transition-colors font-space-grotesk">Lightning Setup</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors font-poppins">Create and launch your hackathon in under 5 minutes with our intuitive builder</p>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-500/20 rounded-2xl p-6 hover:border-gray-400/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <span className="text-2xl group-hover:animate-pulse">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-gray-300 transition-colors font-space-grotesk">Smart Teams</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors font-poppins">AI-powered team formation and advanced collaboration tools for seamless teamwork</p>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-500/20 rounded-2xl p-6 hover:border-gray-400/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <span className="text-2xl group-hover:animate-pulse">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-gray-300 transition-colors font-space-grotesk">Fair Judging</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors font-poppins">Transparent evaluation system with real-time scoring and automated analytics</p>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-500/20 rounded-2xl p-6 hover:border-gray-400/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <span className="text-2xl group-hover:animate-pulse">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-gray-300 transition-colors font-space-grotesk">Live Analytics</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors font-poppins">Real-time insights and engagement metrics to optimize your event experience</p>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={`mt-32 text-center transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative bg-gradient-to-r from-gray-800/50 via-gray-900/30 to-gray-800/50 backdrop-blur-sm border border-gray-500/20 rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 via-transparent to-gray-700/10"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-space-grotesk">
                <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                  Ready to Innovate?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-poppins">
                Join thousands of developers, designers, and entrepreneurs building the next big thing
              </p>
              <Link href="/login" className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xl px-10 py-5 rounded-full hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105">
                <span>🚀</span>
                Launch Your Journey
                <span className="text-lg">→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-32 bg-gray-900/50 backdrop-blur-sm border-t border-gray-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent mb-4 font-space-grotesk">
              🚀 Build2Skill
            </h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto font-poppins">
              Empowering innovation through collaborative hackathons. Where brilliant minds meet cutting-edge technology.
            </p>
            <div className="flex justify-center space-x-6 text-gray-400">
              <span className="hover:text-gray-300 transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-gray-300 transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-gray-300 transition-colors cursor-pointer">Support</span>
              <span className="hover:text-gray-300 transition-colors cursor-pointer">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
