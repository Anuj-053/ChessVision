import { useEffect, useRef, useCallback } from 'react'

/**
 * useStockfish
 *
 * Loads /public/stockfish.js as a classic Web Worker.
 * Communicates via plain UCI strings.
 *
 * Difficulty is controlled via UCI_LimitStrength + UCI_Elo, NOT just depth.
 * Depth is still set as a ceiling so the engine doesn't think forever.
 */
const useStockfish = () => {
  const worker      = useRef(null)
  const currentReq  = useRef(null)
  const cmdBuffer   = useRef([])
  const engineReady = useRef(false)

  useEffect(() => {
    const w = new Worker('/stockfish.js')
    worker.current = w

    w.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data.trim() : ''
      if (!line) return

      if (line === 'uciok') {
        w.postMessage('isready')
        return
      }
      if (line === 'readyok') {
        engineReady.current = true
        cmdBuffer.current.forEach(cmd => w.postMessage(cmd))
        cmdBuffer.current = []
        return
      }

      const req = currentReq.current
      if (!req) return

      if (line.startsWith('info') && (line.includes('score cp') || line.includes('score mate'))) {
        req.lastInfoLine = line
        req.onInfo?.(line)
      }

      if (line.startsWith('bestmove')) {
        const m = line.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/)
        const bestMove = m ? m[1] : null
        const saved = currentReq.current
        currentReq.current = null
        saved?.onBestMove?.(bestMove, saved.lastInfoLine)
      }
    }

    w.onerror = (e) => console.error('[Stockfish] error:', e.message)
    w.postMessage('uci')

    return () => {
      w.terminate()
      worker.current = null
      engineReady.current = false
    }
  }, [])

  const post = useCallback((cmd) => {
    if (!engineReady.current) {
      cmdBuffer.current.push(cmd)
    } else {
      worker.current?.postMessage(cmd)
    }
  }, [])

  /** Convert stockfish score to centipawns from White's POV. */
  const parseEval = useCallback((infoLine, sideToMove = 'w') => {
    if (!infoLine) return 0
    const mate = infoLine.match(/score mate (-?\d+)/)
    if (mate) {
      const n = parseInt(mate[1])
      const whiteWins = sideToMove === 'w' ? n > 0 : n < 0
      return whiteWins ? 10000 : -10000
    }
    const cp = infoLine.match(/score cp (-?\d+)/)
    if (!cp) return 0
    const val = parseInt(cp[1])
    return sideToMove === 'w' ? val : -val
  }, [])

  /**
   * getBestMove — for gameplay.
   *
   * @param {string}   fen
   * @param {number}   depth   - search depth ceiling
   * @param {number|null} elo  - if set, enables UCI_LimitStrength at this Elo
   * @param {Function} callback(bestMove: string)
   */
  const getBestMove = useCallback((fen, depth, elo, callback) => {
    if (currentReq.current) {
      currentReq.current = null
      post('stop')
    }

    // Apply strength limiting BEFORE searching
    if (elo !== null && elo !== undefined) {
      post('setoption name UCI_LimitStrength value true')
      post(`setoption name UCI_Elo value ${elo}`)
    } else {
      post('setoption name UCI_LimitStrength value false')
    }

    currentReq.current = {
      onBestMove: (bestMove) => callback(bestMove),
      onInfo: null,
      lastInfoLine: null,
    }
    post('ucinewgame')
    post(`position fen ${fen}`)
    post(`go depth ${depth}`)
  }, [post])

  /** analyzePosition — for PGN analysis, sequential use only. */
  const analyzePosition = useCallback((fen, depth, onInfo, onBestMove) => {
    if (currentReq.current) {
      currentReq.current = null
      post('stop')
    }
    // Make sure strength limiting is OFF for analysis
    post('setoption name UCI_LimitStrength value false')
    currentReq.current = { onBestMove, onInfo, lastInfoLine: null }
    post(`position fen ${fen}`)
    post(`go depth ${depth}`)
  }, [post])

  const stop = useCallback(() => {
    currentReq.current = null
    post('stop')
  }, [post])

  return { getBestMove, analyzePosition, stop, parseEval }
}

export default useStockfish
