/**
 * Classify a move based on centipawn evaluation change.
 *
 * Both prevEval and currentEval are centipawns from WHITE's perspective
 * (positive = White ahead). parseEval() in useStockfish always returns White POV.
 *
 * @param {number}  prevEval     - eval BEFORE the move (White POV, centipawns)
 * @param {number}  currentEval  - eval AFTER  the move (White POV, centipawns)
 * @param {boolean} movedByWhite - true if it was White's move
 */
export const classifyMove = (prevEval, currentEval, movedByWhite) => {
  // Cap extreme values (mate scores) so they don't blow up the thresholds
  const cap = (v) => Math.max(-2000, Math.min(2000, v))
  const prev = cap(prevEval)
  const cur  = cap(currentEval)

  // centipawn loss from the perspective of the side that just moved
  // White: good move = eval goes UP → loss = prev - cur (negative = improvement)
  // Black: good move = eval goes DOWN → loss = cur - prev (negative = improvement)
  const cpLoss = movedByWhite ? (prev - cur) : (cur - prev)

  if (cpLoss <= -50)  return 'brilliant'   // significantly improved eval
  if (cpLoss <=  10)  return 'good'        // maintained or tiny slip
  if (cpLoss <=  50)  return 'inaccuracy'  // noticeable slip
  if (cpLoss <= 150)  return 'mistake'     // serious error
  return 'blunder'                          // game-changing blunder (150+ cp)
}

export const getMoveSymbol = (classification) => ({
  brilliant:  '!!',
  good:       '',
  book:       '',
  inaccuracy: '?!',
  mistake:    '?',
  blunder:    '??',
}[classification] ?? '')

export const getMoveColor = (classification) => ({
  brilliant:  '#06b6d4',
  good:       '#22c55e',
  book:       '#a78bfa',
  inaccuracy: '#eab308',
  mistake:    '#f97316',
  blunder:    '#ef4444',
}[classification] || '#9CA3AF')

/**
 * Calculate accuracy for ONE player's moves only.
 *
 * @param {string[]} allClassifications - classification for every move in game order
 * @param {'white'|'black'} playerColor - which player to score
 * @returns {number} 0-100 accuracy percentage
 *
 * Move indices: White plays moves 0,2,4,… (even), Black plays 1,3,5,… (odd)
 */
export const calculateAccuracy = (allClassifications, playerColor = null) => {
  // Filter to only the player's moves when playerColor is provided
  let relevant = allClassifications
  if (playerColor === 'white') {
    relevant = allClassifications.filter((_, i) => i % 2 === 0)
  } else if (playerColor === 'black') {
    relevant = allClassifications.filter((_, i) => i % 2 === 1)
  }

  if (!relevant.length) return 100

  const weights = {
    brilliant:  100,
    good:       100,
    book:       100,
    inaccuracy:  80,
    mistake:     50,
    blunder:     10,
  }
  const total = relevant.reduce((acc, c) => acc + (weights[c] ?? 75), 0)
  return Math.round(total / relevant.length)
}
