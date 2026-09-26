'use client'
// Fixed-pixel "stage" that scales to its container width — the Claude Design
// handoff lays out hero/banner art on a fixed canvas (e.g. 1600×640) and scales
// it with transform:scale(), so the composition keeps its exact proportions.
//
// Layout-shift free: the wrapper's height comes from CSS `aspect-ratio`
// (pass it in `className`), and the stage size from `stageClassName`, so the
// box is correct in the server HTML. JS only updates the transform scale,
// which never shifts surrounding content. Breakpoint variants (a narrower
// canvas, or no stage at all on phones) are plain Tailwind classes.
import { useEffect, useLayoutEffect, useRef } from 'react'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function ScaledStage({ className = '', stageClassName = '', stageStyle, initialScale = 0.7025, children }: {
  /** wrapper classes — must include the aspect ratio, e.g. `aspect-[1600/640]` */
  className?: string
  /** stage classes — must include the canvas size, e.g. `h-[640px] w-[1600px]` */
  stageClassName?: string
  stageStyle?: React.CSSProperties
  /** scale used before hydration (1124px container / 1600px canvas) */
  initialScale?: number
  children: React.ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const wrap = wrapRef.current, stage = stageRef.current
    if (!wrap || !stage) return
    const fit = () => {
      const cw = wrap.clientWidth, sw = stage.offsetWidth
      if (cw > 50 && sw > 0) wrap.style.setProperty('--stage-s', String(cw / sw))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`} style={{ ['--stage-s' as string]: initialScale }}>
      <div ref={stageRef} className={`absolute left-0 top-0 origin-top-left [transform:scale(var(--stage-s))] ${stageClassName}`} style={stageStyle}>
        {children}
      </div>
    </div>
  )
}
