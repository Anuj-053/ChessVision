import React from 'react'

const RESULT_CONFIG = {
  checkmate: { icon: '♚', title: 'Checkmate!', color: 'text-amber-400' },
  stalemate: { icon: '⚖️', title: 'Stalemate', color: 'text-gray-400' },
  draw: { icon: '🤝', title: 'Draw', color: 'text-gray-400' },
  repetition: { icon: '🔄', title: 'Draw by Repetition', color: 'text-gray-400' },
  insufficient: { icon: '⚖️', title: 'Insufficient Material', color: 'text-gray-400' },
  resign: { icon: '🏳️', title: 'Resigned', color: 'text-red-400' },
}

const GameEndModal = ({ isOpen, gameOver, playerColor, onNewGame, onAnalyze, onClose }) => {
  if (!isOpen || !gameOver) return null

  const config = RESULT_CONFIG[gameOver.reason] || RESULT_CONFIG.draw
  const playerWon = gameOver.winner === playerColor
  const isDraw = !gameOver.winner

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="text-5xl mb-4">{config.icon}</div>
        <h2 className={`font-display text-3xl font-bold mb-2 ${config.color}`}>{config.title}</h2>
        {!isDraw && (
          <p className="text-xl text-gray-300 mb-6">
            {playerWon
              ? <span className="text-green-400 font-semibold">You Win! 🎉</span>
              : <span className="text-red-400 font-semibold">You Lose</span>}
          </p>
        )}
        {isDraw && <p className="text-gray-400 mb-6">The game is a draw</p>}
        <div className="flex flex-col gap-3">
          <button onClick={onNewGame} className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-gray-950 font-semibold rounded-lg transition-colors">
            New Game
          </button>
          {onAnalyze && (
            <button onClick={onAnalyze} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors">
              Analyze Game
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Close</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameEndModal
