import React, { useMemo } from 'react'
import { Chessboard } from 'react-chessboard'

const ChessBoard = ({
  position,
  onPieceDrop,
  orientation = 'white',
  arrowsArr = [],
  customSquareStyles = {},
  disabled = false,
  hidden = false,
  onSquareClick,
  boardWidth = 500,
}) => {
  const boardStyle = useMemo(() => ({
    borderRadius: '4px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
  }), [])

  if (hidden) {
    return (
      <div
        style={{ width: boardWidth, height: boardWidth }}
        className="rounded bg-gray-900 border-2 border-gray-700 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">♟</div>
          <p className="text-gray-500 font-body">Board Hidden</p>
          <p className="text-gray-600 text-sm">Blindfold Mode Active</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chess-board-wrapper">
      <Chessboard
        id="chessvision-board"
        position={position}
        onPieceDrop={onPieceDrop}
        boardOrientation={orientation}
        boardWidth={boardWidth}
        customBoardStyle={boardStyle}
        customDarkSquareStyle={{ backgroundColor: '#4a7c59' }}
        customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
        customSquareStyles={customSquareStyles}
        arePiecesDraggable={!disabled}
        onSquareClick={onSquareClick}
        customArrows={arrowsArr}
        animationDuration={200}
      />
    </div>
  )
}

export default ChessBoard
