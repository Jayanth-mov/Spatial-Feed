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
  const speed = useRef(0) // smoothed speed in px/ms

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

    let lastX = 0, lastY = 0, lastT = 0

    function onMove(e: MouseEvent) {
      const nowMs = performance.now()
      pos.current = { x: e.clientX, y: e.clientY }

      // Calculate instantaneous speed
      if (lastT > 0) {
        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        const dt = Math.max(1, nowMs - lastT)
        const instantSpeed = Math.hypot(dx, dy) / dt // px/ms
        // Smooth it (lerp toward instant, fast attack / slower decay)
        const factor = instantSpeed > speed.current ? 0.3 : 0.08
        speed.current += (instantSpeed - speed.current) * factor
      }
      lastX = e.clientX
      lastY = e.clientY
      lastT = nowMs

      const pts = trail.current
      if (pts.length > 0) {
        const last = pts[pts.length - 1]
        const ddx = e.clientX - last.x
        const ddy = e.clientY - last.y
        if (ddx * ddx + ddy * ddy < 4) return
      }
      pts.push({ x: e.clientX, y: e.clientY, t: nowMs })
    }
    window.addEventListener('mousemove', onMove)

    function draw() {
      rafId.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

      const now = performance.now()
      trail.current = trail.current.filter(p => now - p.t < TRAIL_DURATION)

      // Decay speed when mouse stops
      if (now - lastT > 50) {
        speed.current *= 0.92
      }

      // Intensity: 0 at rest, 1 at fast movement (~2+ px/ms = ~120+ px per frame)
      const intensity = Math.min(1, speed.current / 2)

      const pts = trail.current

      // Draw smooth trail with glow that scales with speed
      if (pts.length >= 2) {
        // Trail glow pass — draw with shadowBlur for real bloom
        const trailGlowBlur = 10 + intensity * 300
        ctx.save()
        ctx.shadowColor = `rgba(255, 20, 20, ${0.4 + intensity * 0.9})`
        ctx.shadowBlur = trailGlowBlur
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        for (let i = 1; i < pts.length; i++) {
          const prev = pts[i - 1]
          const curr = pts[i]
          const life = 1 - (now - curr.t) / TRAIL_DURATION
          const eased = life * life
          const width = Math.max(0.5, DOT_RADIUS * 1.8 * eased)
          const alpha = eased * (0.6 + intensity * 0.4)

          ctx.beginPath()
          if (i >= 2) {
            const prevPrev = pts[i - 2]
            const mx0 = (prevPrev.x + prev.x) / 2
            const my0 = (prevPrev.y + prev.y) / 2
            const mx1 = (prev.x + curr.x) / 2
            const my1 = (prev.y + curr.y) / 2
            ctx.moveTo(mx0, my0)
            ctx.quadraticCurveTo(prev.x, prev.y, mx1, my1)
          } else {
            ctx.moveTo(prev.x, prev.y)
            ctx.lineTo(curr.x, curr.y)
          }
          ctx.strokeStyle = `rgba(255, 30, 30, ${alpha})`
          ctx.lineWidth = width
          ctx.stroke()
        }
        ctx.restore()
      }

      // Main dot with layered real glow
      if (pos.current) {
        const { x, y } = pos.current

        // Layer 1: Wide soft bloom (real glow via shadowBlur)
        // Draw multiple passes with additive composite for bloom buildup
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'

        // Outermost haze — big, soft
        const hazeRadius = 2 + intensity * 4
        const hazeBlur = 40 + intensity * 80
        ctx.shadowColor = `rgba(255, 20, 0, ${0.3 + intensity * 0.5})`
        ctx.shadowBlur = hazeBlur
        ctx.beginPath()
        ctx.arc(x, y, hazeRadius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 30, 10, ${0.15 + intensity * 0.25})`
        ctx.fill()

        // Mid glow layer
        ctx.shadowColor = `rgba(255, 50, 30, ${0.5 + intensity * 0.4})`
        ctx.shadowBlur = 20 + intensity * 40
        ctx.beginPath()
        ctx.arc(x, y, DOT_RADIUS * 0.7, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 40, 20, ${0.4 + intensity * 0.4})`
        ctx.fill()

        // Inner hot core
        ctx.shadowColor = `rgba(255, 100, 60, ${0.7 + intensity * 0.3})`
        ctx.shadowBlur = 8 + intensity * 15
        ctx.beginPath()
        ctx.arc(x, y, DOT_RADIUS * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 80, 40, ${0.8 + intensity * 0.2})`
        ctx.fill()

        ctx.restore()

        // Layer 2: Solid core dot (normal blending, on top)
        ctx.save()
        ctx.shadowColor = `rgba(255, 40, 40, ${0.6 + intensity * 0.4})`
        ctx.shadowBlur = 15 + intensity * 25
        ctx.beginPath()
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 50, 50, 0.95)`
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
