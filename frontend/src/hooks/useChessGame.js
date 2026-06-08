import { useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'

const useChessGame = (initialFen) => {
  const [game, setGame] = useState(() => new Chess(initialFen))
  const [position, setPosition] = useState(initialFen || 'start')
  const [moveHistory, setMoveHistory] = useState([])
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] })
  const [gameOver, setGameOver] = useState(null)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const gameRef = useRef(game)

  const updateCaptures = useCallback((chess) => {
    const history = chess.history({ verbose: true })
    const white = [], black = []
    history.forEach(m => {
      if (m.captured) {
        if (m.color === 'w') black.push(m.captured)
        else white.push(m.captured)
      }
    })
    setCapturedPieces({ white, black })
  }, [])

  const checkGameOver = useCallback((chess) => {
    if (chess.isCheckmate()) return { reason: 'checkmate', winner: chess.turn() === 'w' ? 'black' : 'white' }
    if (chess.isStalemate()) return { reason: 'stalemate', winner: null }
    if (chess.isDraw()) return { reason: 'draw', winner: null }
    if (chess.isThreefoldRepetition()) return { reason: 'repetition', winner: null }
    if (chess.isInsufficientMaterial()) return { reason: 'insufficient', winner: null }
    return null
  }, [])

  const makeMove = useCallback((moveObj) => {
    const newGame = new Chess(game.fen())
    newGame.loadPgn(game.pgn())
    try {
      const move = newGame.move(moveObj)
      if (!move) return null
      gameRef.current = newGame
      setGame(newGame)
      setPosition(newGame.fen())
      setMoveHistory(newGame.history({ verbose: true }))
      updateCaptures(newGame)
      setCurrentMoveIndex(newGame.history().length - 1)
      const over = checkGameOver(newGame)
      if (over) setGameOver(over)
      return move
    } catch {
      return null
    }
  }, [game, updateCaptures, checkGameOver])

  const undoMove = useCallback(() => {
    const newGame = new Chess()
    newGame.loadPgn(game.pgn())
    newGame.undo()
    if (newGame.turn() !== game.turn()) newGame.undo() // undo opponent's move too
    gameRef.current = newGame
    setGame(newGame)
    setPosition(newGame.fen())
    setMoveHistory(newGame.history({ verbose: true }))
    updateCaptures(newGame)
    setGameOver(null)
    setCurrentMoveIndex(newGame.history().length - 1)
  }, [game, updateCaptures])

  const loadPgn = useCallback((pgn) => {
    const newGame = new Chess()
    newGame.loadPgn(pgn)
    gameRef.current = newGame
    setGame(newGame)
    setPosition(newGame.fen())
    setMoveHistory(newGame.history({ verbose: true }))
    updateCaptures(newGame)
    const over = checkGameOver(newGame)
    if (over) setGameOver(over)
    setCurrentMoveIndex(newGame.history().length - 1)
    return newGame
  }, [updateCaptures, checkGameOver])

  const reset = useCallback((fen) => {
    const newGame = fen ? new Chess(fen) : new Chess()
    gameRef.current = newGame
    setGame(newGame)
    setPosition(newGame.fen())
    setMoveHistory([])
    setCapturedPieces({ white: [], black: [] })
    setGameOver(null)
    setCurrentMoveIndex(-1)
  }, [])

  const goToMove = useCallback((index) => {
    const allMoves = game.history({ verbose: true })
    const newGame = new Chess()
    for (let i = 0; i <= index && i < allMoves.length; i++) {
      newGame.move(allMoves[i])
    }
    setPosition(newGame.fen())
    setCurrentMoveIndex(index)
  }, [game])

  return {
    game,
    position,
    moveHistory,
    capturedPieces,
    gameOver,
    currentMoveIndex,
    makeMove,
    undoMove,
    loadPgn,
    reset,
    goToMove,
    fen: game.fen(),
    pgn: game.pgn(),
    turn: game.turn(),
    isCheck: game.isCheck(),
    legalMoves: (square) => game.moves({ square, verbose: true }),
  }
}

export default useChessGame
