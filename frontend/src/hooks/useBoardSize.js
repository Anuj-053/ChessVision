import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useBoardSize
 *
 * Returns a { ref, boardWidth } pair.
 * Attach `ref` to the container div that wraps the board.
 * `boardWidth` will be the largest square that fits inside it,
 * capped at `maxSize` and floored at `minSize`.
 *
 * On desktop the board fills up to 500px.
 * On narrow mobile screens it shrinks to fit the viewport.
 */
const useBoardSize = ({ maxSize = 500, minSize = 280, padding = 0 } = {}) => {
  const ref = useRef(null)
  const [boardWidth, setBoardWidth] = useState(maxSize)

  const measure = useCallback(() => {
    if (!ref.current) return
    const { width, height } = ref.current.getBoundingClientRect()
    const available = Math.min(width, height) - padding
    const clamped = Math.max(minSize, Math.min(maxSize, available))
    setBoardWidth(Math.floor(clamped))
  }, [maxSize, minSize, padding])

  useEffect(() => {
    measure()

    const observer = new ResizeObserver(measure)
    if (ref.current) observer.observe(ref.current)

    return () => observer.disconnect()
  }, [measure])

  return { ref, boardWidth }
}

export default useBoardSize
