import React from 'react'

const PIECE_UNICODE = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔',
}

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

const CapturedPieces = ({ captured = { white: [], black: [] } }) => {
  const whiteCaptures = captured.white || []
  const blackCaptures = captured.black || []

  const scoreWhite = whiteCaptures.reduce((s, p) => s + (PIECE_VALUES[p] || 0), 0)
  const scoreBlack = blackCaptures.reduce((s, p) => s + (PIECE_VALUES[p] || 0), 0)
  const diff = scoreWhite - scoreBlack

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 min-h-5">
        {blackCaptures.map((p, i) => (
          <span key={i} className="text-gray-800 text-sm leading-none" title={`Black's ${p}`}>
            {PIECE_UNICODE[p] || p}
          </span>
        ))}
        {diff < 0 && <span className="text-xs text-gray-500 ml-1">+{Math.abs(diff)}</span>}
      </div>
      <div className="flex items-center gap-1 min-h-5">
        {whiteCaptures.map((p, i) => (
          <span key={i} className="text-gray-300 text-sm leading-none" title={`White's ${p}`}>
            {PIECE_UNICODE[p.toUpperCase()] || p}
          </span>
        ))}
        {diff > 0 && <span className="text-xs text-gray-500 ml-1">+{diff}</span>}
      </div>
    </div>
  )
}

export default CapturedPieces
