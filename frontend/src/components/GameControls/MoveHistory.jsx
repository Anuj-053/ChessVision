import React from 'react'
import { getMoveSymbol, getMoveColor } from '../../utils/moveClassifier'

const MoveHistory = ({ moves = [], currentIndex = -1, onMoveClick, classifications = [] }) => {
  const pairs = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ number: Math.floor(i / 2) + 1, white: moves[i], black: moves[i + 1] })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 border-b border-gray-800">
        Move History
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-sm">
        {pairs.length === 0 ? (
          <p className="text-gray-600 text-xs px-3 py-4 text-center">No moves yet</p>
        ) : (
          pairs.map(({ number, white, black }) => {
            const wi = (number - 1) * 2
            const bi = wi + 1
            const wClass = classifications[wi]
            const bClass = classifications[bi]
            return (
              <div key={number} className="flex items-center hover:bg-gray-800/50 transition-colors">
                <span className="w-8 text-gray-600 text-right pr-2 py-1 text-xs shrink-0">{number}.</span>
                <button
                  onClick={() => onMoveClick?.(wi)}
                  className={`flex-1 text-left px-2 py-1 rounded transition-colors ${
                    currentIndex === wi ? 'bg-amber-400/20 text-amber-400' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <span>{white?.san || (typeof white === 'string' ? white : '')}</span>
                  {wClass && (
                    <span style={{ color: getMoveColor(wClass) }} className="ml-1 text-xs">
                      {getMoveSymbol(wClass)}
                    </span>
                  )}
                </button>
                {black && (
                  <button
                    onClick={() => onMoveClick?.(bi)}
                    className={`flex-1 text-left px-2 py-1 rounded transition-colors ${
                      currentIndex === bi ? 'bg-amber-400/20 text-amber-400' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>{black?.san || (typeof black === 'string' ? black : '')}</span>
                    {bClass && (
                      <span style={{ color: getMoveColor(bClass) }} className="ml-1 text-xs">
                        {getMoveSymbol(bClass)}
                      </span>
                    )}
                  </button>
                )}
                {!black && <div className="flex-1" />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default MoveHistory
