'use client'

import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  delay: number
  size: number
  color: string
}

export default function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const particleCount = 15
    const colors = [
      'rgba(156, 163, 175, 0.6)',   // gray-400
      'rgba(107, 114, 128, 0.6)',   // gray-500  
      'rgba(75, 85, 99, 0.6)',      // gray-600
      'rgba(209, 213, 219, 0.6)',   // gray-300
    ]

    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 15,
      size: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))

    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full opacity-60"
          style={{
            left: `${particle.x}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animation: 'float-particle 20s infinite linear',
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
        />
      ))}
    </div>
  )
}
