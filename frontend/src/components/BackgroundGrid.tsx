'use client'

import { useEffect, useRef } from 'react'

export default function BackgroundGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const gridSize = 50
    const dots: { x: number; y: number; opacity: number; glowing: boolean }[] = []

    // Create grid dots
    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
        dots.push({
          x,
          y,
          opacity: Math.random() * 0.5 + 0.1,
          glowing: Math.random() > 0.95
        })
      }
    }

    let animationFrame: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Update and draw dots
      dots.forEach(dot => {
        // Randomly change glow state
        if (Math.random() > 0.999) {
          dot.glowing = !dot.glowing
        }
        
        // Animate opacity
        if (dot.glowing) {
          dot.opacity = Math.min(1, dot.opacity + 0.02)
        } else {
          dot.opacity = Math.max(0.1, dot.opacity - 0.01)
        }
        
        // Draw dot
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 1, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(156, 163, 175, ${dot.opacity})`
        ctx.fill()
        
        // Draw glow effect
        if (dot.glowing && dot.opacity > 0.7) {
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, 8, 0, Math.PI * 2)
          const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, 8)
          gradient.addColorStop(0, `rgba(156, 163, 175, ${dot.opacity * 0.3})`)
          gradient.addColorStop(1, 'rgba(156, 163, 175, 0)')
          ctx.fillStyle = gradient
          ctx.fill()
        }
      })
      
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
