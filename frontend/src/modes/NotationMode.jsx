import React, { useState, useEffect, useCallback, useRef } from 'react'
import ChessBoard from '../components/Board/ChessBoard'
import MoveHistory from '../components/GameControls/MoveHistory'
import GameEndModal from '../components/Modals/GameEndModal'
import useChessGame from '../hooks/useChessGame'
import useStockfish from '../hooks/useStockfish'
import useBoardSize from '../hooks/useBoardSize'
import { detectOpening } from '../utils/openingDetector'
import { saveGame } from '../services/gameService'

const DIFFICULTIES = [
  { label: 'Beginner',     value: 'beginner',     depth: 1  },
  { label: 'Intermediate', value: 'intermediate', depth: 5  },
  { label: 'Advanced',     value: 'advanced',     depth: 10 },
  { label: 'Master',       value: 'master',       depth: 15 },
]

const NotationMode = () => {
  const [gameStarted, setGameStarted] = useState(false)
  const [playerColor, setPlayerColor] = useState('white')
  const [difficulty, setDifficulty]   = useState('intermediate')
  const [moveInput, setMoveInput]     = useState('')
  const [moveError, setMoveError]     = useState('')
  const [engineThinking, setEngineThinking] = useState(false)
  const [showModal, setShowModal]     = useState(false)
  const [gameSaved, setGameSaved]     = useState(false)
  const inputRef  = useRef(null)
  const startTime = useRef(Date.now())

  const chess = useChessGame()
  const { getBestMove } = useStockfish()
  const { ref: boardRef, boardWidth } = useBoardSize()

  const diffConfig = DIFFICULTIES.find(d => d.value === difficulty)

  const playEngineMove = useCallback(() => {
    if (chess.game.isGameOver()) return
    setEngineThinking(true)
    getBestMove(chess.game.fen(), diffConfig?.depth || 5, null, (bestMove) => {
      setEngineThinking(false)
      const move = bestMove
      if (!move || move === '(none)') return
      chess.makeMove({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] || 'q' })
    })
  }, [chess, diffConfig, getBestMove])

  useEffect(() => {
    if (!gameStarted || chess.gameOver || engineThinking) return
    const engineColor = playerColor === 'white' ? 'b' : 'w'
    if (chess.turn === engineColor) {
      const t = setTimeout(playEngineMove, 400)
      return () => clearTimeout(t)
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [chess.turn, gameStarted, playerColor, chess.gameOver, engineThinking, playEngineMove])

  useEffect(() => {
    if (chess.gameOver && !gameSaved) {
      setShowModal(true)
      const result = chess.gameOver.winner === playerColor ? 'win' : chess.gameOver.winner ? 'loss' : 'draw'
      saveGame({
        pgn: chess.pgn, fen: chess.fen, mode: 'notation', result,
        playerColor, opponentLevel: difficulty,
        opening: detectOpening(chess.moveHistory),
        moveCount: chess.moveHistory.length,
        duration: Math.round((Date.now() - startTime.current) / 1000),
      }).catch(() => {})
      setGameSaved(true)
    }
  }, [chess.gameOver])

  const handleMoveSubmit = (e) => {
    e.preventDefault()
    if (!moveInput.trim() || engineThinking) return
    const playerTurn = playerColor === 'white' ? 'w' : 'b'
    if (chess.turn !== playerTurn) { setMoveError('Not your turn!'); return }
    const move = chess.makeMove(moveInput.trim())
    if (move) { setMoveInput(''); setMoveError('') }
    else setMoveError(`Invalid move: "${moveInput.trim()}"`)
  }

  const startGame = () => {
    chess.reset()
    setShowModal(false)
    setGameSaved(false)
    setMoveInput('')
    setMoveError('')
    startTime.current = Date.now()
    setGameStarted(true)
  }

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <span className="text-6xl block mb-4">📋</span>
            <h1 className="font-display text-3xl font-bold text-white mb-2">Notation Mode</h1>
            <p className="text-gray-500 text-sm">
              The board and pieces are fully visible. Enter moves in algebraic notation to practise your notation reading.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
            <div>
              <label className="text-sm text-gray-400 uppercase tracking-wider block mb-3">Play as</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ value: 'white', icon: '♔', label: 'White' }, { value: 'black', icon: '♚', label: 'Black' }].map(({ value, icon, label }) => (
                  <button key={value} onClick={() => setPlayerColor(value)}
                    className={`py-3 rounded-xl border-2 transition-all ${playerColor === value ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-xs font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 uppercase tracking-wider block mb-3">Difficulty</label>
              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTIES.map(({ label, value }) => (
                  <button key={value} onClick={() => setDifficulty(value)}
                    className={`py-2.5 px-4 rounded-xl border-2 transition-all text-sm font-medium ${difficulty === value ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startGame}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold rounded-xl transition-colors text-lg">
              Start Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Game screen ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="border-b border-gray-800 bg-gray-900/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📋</span>
          <h1 className="font-display text-lg font-bold text-white">Notation Mode</h1>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full capitalize">{difficulty}</span>
        </div>
        <div className="flex items-center gap-3">
          {engineThinking && <span className="text-xs text-amber-400 animate-pulse">Engine thinking...</span>}
          <button onClick={() => { setGameStarted(false); chess.reset() }}
            className="text-sm text-gray-400 hover:text-amber-400 transition-colors">← New Game</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div ref={boardRef} className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-5">

            {/* Always-visible board with pieces */}
            <ChessBoard
              position={chess.position}
              orientation={playerColor}
              disabled={true}
              boardWidth={boardWidth}
            />

            {/* Notation input */}
            <div className="w-full max-w-[500px] space-y-3">
              {chess.isCheck && !chess.gameOver && (
                <div className="text-center text-red-400 font-semibold animate-pulse text-sm">⚠ Check!</div>
              )}

              <form onSubmit={handleMoveSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={moveInput}
                  onChange={e => { setMoveInput(e.target.value); setMoveError('') }}
                  className={`flex-1 bg-gray-800 border rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none transition-colors ${moveError ? 'border-red-500' : 'border-gray-700 focus:border-amber-400'}`}
                  placeholder={
                    chess.turn === (playerColor === 'white' ? 'w' : 'b')
                      ? 'Type your move: e4, Nf3, O-O...'
                      : 'Engine thinking...'
                  }
                  disabled={engineThinking || !!chess.gameOver}
                  autoComplete="off"
                />
                <button type="submit"
                  disabled={engineThinking || !moveInput.trim() || !!chess.gameOver}
                  className="px-5 py-3 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-950 font-bold rounded-xl transition-colors">
                  ↵
                </button>
              </form>

              {moveError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  {moveError}
                </div>
              )}

              <div className="text-center text-xs text-gray-600">
                Turn: <span className="text-amber-400">{chess.turn === 'w' ? 'White' : 'Black'}</span>
                {' · '}You play <span className="text-gray-400">{playerColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Opening</div>
            <div className="text-sm text-white font-medium">{detectOpening(chess.moveHistory) || 'Starting Position'}</div>
          </div>
          <div className="p-4 border-b border-gray-800 text-xs text-gray-500 space-y-1">
            <p><span className="text-gray-400">You:</span> {playerColor}</p>
            <p><span className="text-gray-400">Moves:</span> {chess.moveHistory.length}</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <MoveHistory moves={chess.moveHistory} currentIndex={chess.currentMoveIndex} />
          </div>
        </div>
      </div>

      <GameEndModal
        isOpen={showModal}
        gameOver={chess.gameOver}
        playerColor={playerColor}
        onNewGame={() => { setGameStarted(false); setShowModal(false) }}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}

export default NotationMode
