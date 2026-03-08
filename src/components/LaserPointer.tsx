import { useEffect, useRef } from 'react'

interface Point {
  x: number
  y: number
  t: number
}

const TRAIL_DURATION = 150
const DOT_RADIUS = 10

export function LaserPointer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pos = useRef<{ x: number; y: number } | null>(null)
  const trail = useRef<Point[]>([])
  const rafId = useRef(0)

  useEffect(() => {
    document.body.style.cursor = 'none'

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    let dpr = window.devicePixelRatio || 1

    function resize() {
      dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    function onMove(e: MouseEvent) {
      pos.current = { x: e.clientX, y: e.clientY }
      const pts = trail.current
      // Skip if barely moved
      if (pts.length > 0) {
        const last = pts[pts.length - 1]
        const dx = e.clientX - last.x
        const dy = e.clientY - last.y
        if (dx * dx + dy * dy < 4) return
      }
      pts.push({ x: e.clientX, y: e.clientY, t: performance.now() })
    }
    window.addEventListener('mousemove', onMove)

    function draw() {
      rafId.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

      const now = performance.now()
      trail.current = trail.current.filter(p => now - p.t < TRAIL_DURATION)

      const pts = trail.current

      // Draw smooth trail using quadratic bezier through midpoints
      if (pts.length >= 2) {
        for (let i = 1; i < pts.length; i++) {
          const prev = pts[i - 1]
          const curr = pts[i]

          const life = 1 - (now - curr.t) / TRAIL_DURATION
          const eased = life * life
          const width = Math.max(0.5, DOT_RADIUS * 1.8 * eased)
          const alpha = eased * 0.8

          // Use midpoints + quadratic bezier for smoothing
          if (i >= 2) {
            const prevPrev = pts[i - 2]
            const mx0 = (prevPrev.x + prev.x) / 2
            const my0 = (prevPrev.y + prev.y) / 2
            const mx1 = (prev.x + curr.x) / 2
            const my1 = (prev.y + curr.y) / 2

            ctx.beginPath()
            ctx.moveTo(mx0, my0)
            ctx.quadraticCurveTo(prev.x, prev.y, mx1, my1)
            ctx.strokeStyle = `rgba(255, 30, 30, ${alpha})`
            ctx.lineWidth = width
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.stroke()
          } else {
            // First segment: just a straight line
            ctx.beginPath()
            ctx.moveTo(prev.x, prev.y)
            ctx.lineTo(curr.x, curr.y)
            ctx.strokeStyle = `rgba(255, 30, 30, ${alpha})`
            ctx.lineWidth = width
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.stroke()
          }
        }
      }

      // Main dot
      if (pos.current) {
        const { x, y } = pos.current

        // Outer glow
        ctx.save()
        ctx.shadowColor = 'rgba(255, 40, 40, 0.7)'
        ctx.shadowBlur = 60
        ctx.beginPath()
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 50, 50, 0.95)'
        ctx.fill()
        ctx.restore()

        // Soft radial glow
        ctx.save()
        ctx.globalAlpha = 0.5
        const r = DOT_RADIUS * 2.5
        const grad = ctx.createRadialGradient(x, y, DOT_RADIUS * 0.5, x, y, r)
        grad.addColorStop(0, 'rgba(255,60,60,0.35)')
        grad.addColorStop(1, 'rgba(255,40,40,0)')
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()

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
