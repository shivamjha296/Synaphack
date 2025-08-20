'use client'

import { useState } from 'react'

interface Feature3DCardProps {
  title: string
  description: string
  icon: string
  color: string
  index: number
}

function Feature3DCard({ title, description, icon, color, index }: Feature3DCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className="group perspective-1000 h-80"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`
          relative w-full h-full preserve-3d transition-all duration-700 cursor-pointer
          ${isHovered ? 'rotate-y-180' : ''}
        `}
      >
        {/* Front of card */}
        <div 
          className={`
            absolute inset-0 w-full h-full backface-hidden rounded-2xl
            bg-gradient-to-br from-slate-800/60 to-slate-900/80 backdrop-blur-xl
            border border-${color}-500/30 p-8 flex flex-col items-center justify-center
            shadow-2xl hover:shadow-${color}-500/20 transition-all duration-500
          `}
          style={{
            background: `linear-gradient(135deg, 
              rgba(15, 23, 42, 0.8) 0%, 
              rgba(30, 41, 59, 0.6) 50%, 
              rgba(51, 65, 85, 0.8) 100%)`,
            boxShadow: `0 25px 50px rgba(0, 0, 0, 0.4), 
                       0 0 0 1px rgba(${color === 'blue' ? '59, 130, 246' : 
                                     color === 'purple' ? '147, 51, 234' : 
                                     color === 'cyan' ? '6, 182, 212' : 
                                     color === 'emerald' ? '16, 185, 129' : '239, 68, 68'}, 0.3)`
          }}
        >
          {/* Icon */}
          <div 
            className={`
              text-6xl mb-6 transform transition-all duration-500 group-hover:scale-110
              filter drop-shadow-lg
            `}
            style={{
              filter: `drop-shadow(0 0 20px rgba(${
                color === 'blue' ? '59, 130, 246' : 
                color === 'purple' ? '147, 51, 234' : 
                color === 'cyan' ? '6, 182, 212' : 
                color === 'emerald' ? '16, 185, 129' : '239, 68, 68'
              }, 0.5))`
            }}
          >
            {icon}
          </div>

          {/* Title */}
          <h3 
            className={`
              text-2xl font-bold text-center mb-4
              bg-gradient-to-r from-${color}-300 to-${color}-500 bg-clip-text text-transparent
            `}
          >
            {title}
          </h3>

          {/* Hover Indicator */}
          <div className="text-slate-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Hover to learn more
          </div>

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`
                  absolute w-1 h-1 bg-${color}-400 rounded-full opacity-40
                  animate-float
                `}
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${4 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Back of card */}
        <div 
          className={`
            absolute inset-0 w-full h-full backface-hidden rounded-2xl rotate-y-180
            bg-gradient-to-br from-${color}-900/80 to-slate-900/90 backdrop-blur-xl
            border border-${color}-400/50 p-8 flex flex-col justify-center
            shadow-2xl
          `}
          style={{
            background: `linear-gradient(135deg, 
              rgba(${color === 'blue' ? '30, 58, 138' : 
                    color === 'purple' ? '88, 28, 135' : 
                    color === 'cyan' ? '22, 78, 99' : 
                    color === 'emerald' ? '6, 78, 59' : '127, 29, 29'}, 0.8) 0%, 
              rgba(15, 23, 42, 0.9) 100%)`,
            transform: 'rotateY(180deg)'
          }}
        >
          <p className="text-slate-200 text-lg leading-relaxed text-center">
            {description}
          </p>
          
          {/* Decorative Elements */}
          <div className="flex justify-center mt-6">
            <div 
              className={`
                w-12 h-1 bg-gradient-to-r from-${color}-400 to-${color}-600 rounded-full
              `}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Features3D() {
  const features = [
    {
      title: "Smart Submissions",
      description: "Advanced submission management with real-time collaboration, version control, and automated evaluation pipelines.",
      icon: "📝",
      color: "blue"
    },
    {
      title: "Team Management", 
      description: "Intelligent team formation with skill matching, role assignment, and seamless communication tools.",
      icon: "👥",
      color: "purple"
    },
    {
      title: "Live Judging",
      description: "Real-time evaluation system with transparent scoring, instant feedback, and comprehensive analytics.",
      icon: "⚡",
      color: "cyan"
    },
    {
      title: "Event Analytics",
      description: "Deep insights into hackathon performance with engagement metrics, success patterns, and growth tracking.",
      icon: "📊",
      color: "emerald"
    }
  ]

  return (
    <div className="py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Experience the next generation of hackathon management with cutting-edge tools designed for modern developers.
          </p>
        </div>

        {/* 3D Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Feature3DCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
