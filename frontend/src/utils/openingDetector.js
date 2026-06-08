const OPENINGS = [
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], name: 'Italian Game' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], name: 'Ruy Lopez' },
  { moves: ['e4', 'c5'], name: 'Sicilian Defense' },
  { moves: ['e4', 'c5', 'Nf3', 'd6', 'd4'], name: 'Sicilian Defense, Open' },
  { moves: ['e4', 'e6'], name: 'French Defense' },
  { moves: ['e4', 'c6'], name: 'Caro-Kann Defense' },
  { moves: ['d4', 'd5'], name: "Queen's Pawn Game" },
  { moves: ['d4', 'd5', 'c4'], name: "Queen's Gambit" },
  { moves: ['d4', 'd5', 'c4', 'e6'], name: "Queen's Gambit Declined" },
  { moves: ['d4', 'd5', 'c4', 'dxc4'], name: "Queen's Gambit Accepted" },
  { moves: ['d4', 'Nf6', 'c4', 'g6'], name: "King's Indian Defense" },
  { moves: ['d4', 'Nf6', 'c4', 'e6'], name: "Nimzo-Indian Defense" },
  { moves: ['Nf3', 'd5', 'c4'], name: "Reti Opening" },
  { moves: ['c4'], name: 'English Opening' },
  { moves: ['e4', 'e5', 'f4'], name: "King's Gambit" },
  { moves: ['e4', 'e5', 'Nf3', 'Nf6'], name: 'Petrov Defense' },
  { moves: ['e4', 'd5'], name: 'Scandinavian Defense' },
  { moves: ['e4', 'Nf6'], name: "Alekhine's Defense" },
  { moves: ['g3'], name: "King's Fianchetto Opening" },
  { moves: ['b3'], name: "Nimzowitsch-Larsen Attack" },
]

export const detectOpening = (moves) => {
  if (!moves || moves.length === 0) return 'Unknown Opening'

  const moveSANs = moves.map(m => typeof m === 'string' ? m : m.san)
  let bestMatch = { name: 'Unknown Opening', length: 0 }

  for (const opening of OPENINGS) {
    const matchLen = opening.moves.length
    const slice = moveSANs.slice(0, matchLen)
    if (opening.moves.every((m, i) => slice[i] === m)) {
      if (matchLen > bestMatch.length) {
        bestMatch = { name: opening.name, length: matchLen }
      }
    }
  }

  return bestMatch.name
}
