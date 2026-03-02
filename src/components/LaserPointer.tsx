import { useEffect, useRef } from 'react'

interface Point {
  x: number
  y: number
  t: number
}

const TRAIL_DURATION = 100  // ms trail fades over
const DOT_RADIUS = 10        // px, main dot

export function LaserPointer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pos = useRef<{ x: number; y: number } | null>(null)
  const trail = useRef<Point[]>([])
  const rafId = useRef(0)

  useEffect(() => {
    // Hide cursor globally
    document.body.style.cursor = 'none'

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function onMove(e: MouseEvent) {
      pos.current = { x: e.clientX, y: e.clientY }
      trail.current.push({ x: e.clientX, y: e.clientY, t: performance.now() })
    }
    window.addEventListener('mousemove', onMove)

    function draw() {
      rafId.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const now = performance.now()
      trail.current = trail.current.filter(p => now - p.t < TRAIL_DURATION)

      // Draw smooth tapered trail as a series of line segments
      // Each segment fades and thins toward the tail
      if (trail.current.length > 1) {
        for (let i = 1; i < trail.current.length; i++) {
          const p0 = trail.current[i - 1]
          const p1 = trail.current[i]
          // Use p1's age for this segment's style (newer = brighter/thicker)
          const life = 1 - (now - p1.t) / TRAIL_DURATION
          const width = Math.max(0.5, DOT_RADIUS * 1.5 * life)
          const alpha = life * 0.9

          ctx.beginPath()
          ctx.moveTo(p0.x, p0.y)
          ctx.lineTo(p1.x, p1.y)
          ctx.strokeStyle = `rgba(255, 30, 30, ${alpha})`
          ctx.lineWidth = width
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.stroke()
        }
      }

      // Main dot
      if (pos.current) {
        const { x, y } = pos.current

        // Soft glow — a single large blurred circle via shadow
        ctx.save()
        ctx.shadowColor = 'rgba(255, 60, 60, 0.8)'
        ctx.shadowBlur = 80
        ctx.beginPath()
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = 'rgb(255, 50, 50)'
        ctx.fill()
        ctx.restore()

                // extra glow ring
        ctx.save()
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        const r = DOT_RADIUS * 2
        const grad = ctx.createRadialGradient(x, y, DOT_RADIUS, x, y, r)
        grad.addColorStop(0, 'rgba(255,50,50,0.4)')
        grad.addColorStop(1, 'rgba(255,50,50,0)')
        ctx.fillStyle = grad
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Bright white center pinpoint
        // ctx.beginPath()
        // ctx.arc(x, y, DOT_RADIUS * 0.45, 0, Math.PI * 2)
        // ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        // ctx.fill()
      }
    }

    draw()

    return () => {
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    />
  )
}
