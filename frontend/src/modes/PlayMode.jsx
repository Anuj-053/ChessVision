import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ChessBoard from '../components/Board/ChessBoard'
import MoveHistory from '../components/GameControls/MoveHistory'
import CapturedPieces from '../components/GameControls/CapturedPieces'
import GameEndModal from '../components/Modals/GameEndModal'
import useChessGame from '../hooks/useChessGame'
import useStockfish from '../hooks/useStockfish'
import useBoardSize from '../hooks/useBoardSize'
import { detectOpening } from '../utils/openingDetector'
import { saveGame } from '../services/gameService'

/**
 * Difficulty levels.
 *
 * UCI_LimitStrength + UCI_Elo is the correct way to handicap Stockfish.
 * depth is a hard ceiling so the engine doesn't think indefinitely.
 *
 * Elo ranges Stockfish supports: ~1320–3190.
 * We spread our levels across that range meaningfully.
 */
const DIFFICULTIES = [
  {
    label:       'Beginner',
    value:       'beginner',
    elo:         1320,   // ~club beginner, makes clear tactical errors
    depth:       4,
    description: 'Misses tactics, makes positional errors',
  },
  {
    label:       'Intermediate',
    value:       'intermediate',
    elo:         1700,   // solid club player
    depth:       8,
    description: 'Plays sound moves, avoids blunders',
  },
  {
    label:       'Advanced',
    value:       'advanced',
    elo:         2200,   // expert / candidate master level
    depth:       12,
    description: 'Strong tactical and positional play',
  },
  {
    label:       'Master',
    value:       'master',
    elo:         null,   // no limit — full engine strength
    depth:       18,
    description: 'Near-perfect engine strength',
  },
]

const PlayMode = () => {
  const navigate = useNavigate()
  const [gameStarted,      setGameStarted]      = useState(false)
  const [playerColor,      setPlayerColor]      = useState('white')
  const [difficulty,       setDifficulty]       = useState('intermediate')
  const [engineThinking,   setEngineThinking]   = useState(false)
  const [showModal,        setShowModal]        = useState(false)
  const [highlightSquares, setHighlightSquares] = useState({})
  const [selectedSquare,   setSelectedSquare]   = useState(null)
  const [gameSaved,        setGameSaved]        = useState(false)
  const [savedGameId,      setSavedGameId]      = useState(null)
  const startTime = useRef(Date.now())

  const chess = useChessGame()
  const { getBestMove, stop } = useStockfish()
  const { ref: boardRef, boardWidth } = useBoardSize()

  const diffConfig = DIFFICULTIES.find(d => d.value === difficulty)

  // ── Engine move ────────────────────────────────────────────────────────────
  const playEngineMove = useCallback(() => {
    if (chess.game.isGameOver()) return
    setEngineThinking(true)

    getBestMove(
      chess.game.fen(),
      diffConfig?.depth ?? 8,
      diffConfig?.elo ?? null,       // ← Elo-based strength limiting
      (bestMove) => {
        setEngineThinking(false)
        if (!bestMove || bestMove === '(none)') return
        chess.makeMove({
          from:      bestMove.slice(0, 2),
          to:        bestMove.slice(2, 4),
          promotion: bestMove[4] || 'q',
        })
      }
    )
  }, [chess.game, diffConfig, getBestMove])

  useEffect(() => {
    if (!gameStarted || chess.gameOver || engineThinking) return
    const engineColor = playerColor === 'white' ? 'b' : 'w'
    if (chess.turn !== engineColor) return
    const t = setTimeout(playEngineMove, 300)
    return () => clearTimeout(t)
  }, [chess.turn, chess.gameOver, gameStarted, playerColor, engineThinking, playEngineMove])

  // ── Auto-save ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chess.gameOver || gameSaved) return
    setShowModal(true)
    const result = chess.gameOver.winner === playerColor ? 'win'
      : chess.gameOver.winner ? 'loss' : 'draw'
    saveGame({
      pgn:           chess.pgn,
      fen:           chess.fen,
      mode:          'play',
      result,
      playerColor,
      opponentLevel: difficulty,
      opening:       detectOpening(chess.moveHistory),
      moveCount:     chess.moveHistory.length,
      duration:      Math.round((Date.now() - startTime.current) / 1000),
    }).then(({ data }) => setSavedGameId(data.game._id)).catch(() => {})
    setGameSaved(true)
  }, [chess.gameOver])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const startGame = (color) => {
    const chosen = color === 'random'
      ? (Math.random() > 0.5 ? 'white' : 'black')
      : color
    setPlayerColor(chosen)
    chess.reset()
    setShowModal(false)
    setGameSaved(false)
    setSavedGameId(null)
    setHighlightSquares({})
    setSelectedSquare(null)
    setEngineThinking(false)
    startTime.current = Date.now()
    setGameStarted(true)
  }

  const onPieceDrop = (from, to, piece) => {
    if (engineThinking) return false
    if (chess.turn !== (playerColor === 'white' ? 'w' : 'b')) return false
    const isPromo = piece?.[1]?.toLowerCase() === 'p' && (to[1] === '8' || to[1] === '1')
    const move = chess.makeMove({ from, to, promotion: isPromo ? 'q' : undefined })
    if (!move) return false
    setHighlightSquares({
      [from]: { backgroundColor: 'rgba(251,191,36,0.3)' },
      [to]:   { backgroundColor: 'rgba(251,191,36,0.3)' },
    })
    setSelectedSquare(null)
    return true
  }

  const onSquareClick = (square) => {
    if (engineThinking) return
    if (chess.turn !== (playerColor === 'white' ? 'w' : 'b')) return

    if (selectedSquare) {
      const move = chess.makeMove({ from: selectedSquare, to: square, promotion: 'q' })
      setHighlightSquares(move ? {
        [selectedSquare]: { backgroundColor: 'rgba(251,191,36,0.3)' },
        [square]:         { backgroundColor: 'rgba(251,191,36,0.3)' },
      } : {})
      setSelectedSquare(null)
      return
    }

    const legal = chess.legalMoves(square)
    if (legal.length > 0) {
      setSelectedSquare(square)
      const hl = { [square]: { backgroundColor: 'rgba(251,191,36,0.4)' } }
      legal.forEach(m => { hl[m.to] = { backgroundColor: 'rgba(251,191,36,0.2)', borderRadius: '50%' } })
      setHighlightSquares(hl)
    }
  }

  const handleUndo = () => {
    stop()
    setEngineThinking(false)
    chess.undoMove()
    setHighlightSquares({})
    setSelectedSquare(null)
  }

  const handleResign = () => {
    if (gameSaved) return
    setShowModal(true)
    saveGame({
      pgn: chess.pgn, fen: chess.fen, mode: 'play', result: 'loss',
      playerColor, opponentLevel: difficulty,
      opening:   detectOpening(chess.moveHistory),
      moveCount: chess.moveHistory.length,
      duration:  Math.round((Date.now() - startTime.current) / 1000),
    }).then(({ data }) => setSavedGameId(data.game._id)).catch(() => {})
    setGameSaved(true)
  }

  // ── Setup screen ───────────────────────────────────────────────────────────
  if (!gameStarted) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-6xl block mb-4">⚔️</span>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Play vs Computer</h1>
          <p className="text-gray-500 text-sm">Choose your color and difficulty to begin.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
          {/* Color */}
          <div>
            <label className="text-sm text-gray-400 uppercase tracking-wider block mb-3">Play as</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'white',  icon: '♔', label: 'White'  },
                { value: 'black',  icon: '♚', label: 'Black'  },
                { value: 'random', icon: '🎲', label: 'Random' },
              ].map(({ value, icon, label }) => (
                <button key={value} onClick={() => setPlayerColor(value)}
                  className={`py-3 rounded-xl border-2 transition-all ${playerColor === value ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-sm text-gray-400 uppercase tracking-wider block mb-3">Difficulty</label>
            <div className="space-y-2">
              {DIFFICULTIES.map(({ label, value, elo, description }) => (
                <button key={value} onClick={() => setDifficulty(value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${difficulty === value ? 'border-amber-400 bg-amber-400/10' : 'border-gray-700 hover:border-gray-500'}`}>
                  <div>
                    <span className={`font-semibold text-sm ${difficulty === value ? 'text-amber-400' : 'text-white'}`}>
                      {label}
                    </span>
                    <span className="text-gray-600 text-xs ml-2">
                      {elo ? `~${elo} Elo` : 'Max strength'}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                  </div>
                  {difficulty === value && <span className="text-amber-400">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => startGame(playerColor)}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold rounded-xl transition-colors text-lg">
            Start Game
          </button>
        </div>
      </div>
    </div>
  )

  // ── Game screen ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="border-b border-gray-800 bg-gray-900/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 text-xl">⚔️</span>
          <h1 className="font-display text-lg font-bold text-white">Play vs Computer</h1>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full capitalize">
            {diffConfig?.label} {diffConfig?.elo ? `(~${diffConfig.elo} Elo)` : '(Max)'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {engineThinking && <span className="text-xs text-amber-400 animate-pulse">Engine thinking...</span>}
          <button onClick={() => { stop(); setGameStarted(false); chess.reset(); setEngineThinking(false) }}
            className="text-sm text-gray-400 hover:text-amber-400 transition-colors">← New Game</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div ref={boardRef} className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4">

            {/* Opponent */}
            <div className="w-full max-w-[500px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{playerColor === 'white' ? '♚' : '♔'}</span>
                <span className="text-gray-300 text-sm">
                  Stockfish ({diffConfig?.label}{diffConfig?.elo ? ` ~${diffConfig.elo}` : ''})
                </span>
                {engineThinking && <span className="text-xs text-amber-400 animate-pulse ml-1">thinking…</span>}
              </div>
              <CapturedPieces captured={{ white: [], black: chess.capturedPieces.black }} />
            </div>

            <ChessBoard
              position={chess.position}
              onPieceDrop={onPieceDrop}
              onSquareClick={onSquareClick}
              orientation={playerColor}
              customSquareStyles={highlightSquares}
              disabled={engineThinking || !!chess.gameOver}
              boardWidth={boardWidth}
            />

            {/* Player */}
            <div className="w-full max-w-[500px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{playerColor === 'white' ? '♔' : '♚'}</span>
                <span className="text-gray-300 text-sm">You ({playerColor})</span>
                {chess.isCheck && !chess.gameOver && (
                  <span className="text-xs text-red-400 font-semibold animate-pulse">CHECK!</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <CapturedPieces captured={{ white: chess.capturedPieces.white, black: [] }} />
                <button onClick={handleUndo}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors">
                  Undo
                </button>
                <button onClick={handleResign}
                  className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                  Resign
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Opening</div>
            <div className="text-sm text-white font-medium">
              {detectOpening(chess.moveHistory) || 'Starting Position'}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <MoveHistory moves={chess.moveHistory} currentIndex={chess.currentMoveIndex} />
          </div>
        </div>
      </div>

      <GameEndModal
        isOpen={showModal}
        gameOver={chess.gameOver || (gameSaved && !chess.gameOver ? { reason: 'resign', winner: null } : null)}
        playerColor={playerColor}
        onNewGame={() => { setGameStarted(false); setShowModal(false) }}
        onAnalyze={() => navigate(savedGameId ? `/analyze?gameId=${savedGameId}` : '/analyze')}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}

export default PlayMode
