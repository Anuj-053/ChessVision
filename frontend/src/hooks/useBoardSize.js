import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useBoardSize
 *
 * Returns { ref, boardWidth }.
 * Attach `ref` to the div that directly contains the board.
 *
 * Strategy:
 *  - Use ResizeObserver on the container for accurate ongoing measurement.
 *  - Seed the initial value from window.innerWidth (always available,
 *    matches the container on mobile where the board fills the viewport).
 *  - `gutter` is the total horizontal space INSIDE the container that
 *    the board cannot use (left padding + right padding of that div).
 */
const useBoardSize = ({ max = 500, min = 260, gutter = 24 } = {}) => {
  const ref = useRef(null)

  const clamp = useCallback((px) =>
    Math.floor(Math.max(min, Math.min(max, px)))
  , [max, min])

  // Seed from viewport width immediately — no flash on mobile
  const [boardWidth, setBoardWidth] = useState(() => {
    if (typeof window === 'undefined') return max
    return clamp(window.innerWidth - gutter)
  })

  useEffect(() => {
    const measure = () => {
      if (!ref.current) {
        setBoardWidth(clamp(window.innerWidth - gutter))
        return
      }
      const { width } = ref.current.getBoundingClientRect()
      // width of 0 means layout hasn't happened yet — fall back to viewport
      const usable = (width > 0 ? width : window.innerWidth) - gutter
      setBoardWidth(clamp(usable))
    }

    // Measure now (ref is attached at this point)
    measure()

    const ro = new ResizeObserver(measure)
    if (ref.current) ro.observe(ref.current)
    window.addEventListener('resize', measure, { passive: true })

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [clamp, gutter])

  return { ref, boardWidth }
}

export default useBoardSize
