import React from 'react'

const EvalBar = ({ evaluation = 0, orientation = 'white' }) => {
  // Clamp eval to -1000..1000 cp, convert to percentage
  const clamped = Math.max(-1000, Math.min(1000, evaluation))
  const whitePct = Math.round(50 + (clamped / 1000) * 50)
  const blackPct = 100 - whitePct

  const displayEval = Math.abs(evaluation) > 9000
    ? `M${Math.abs(evaluation) === 10000 ? '' : Math.round((10000 - Math.abs(evaluation)) / 100)}`
    : evaluation > 0
    ? `+${(evaluation / 100).toFixed(1)}`
    : (evaluation / 100).toFixed(1)

  return (
    <div className="flex flex-col h-full w-8 rounded overflow-hidden" title={`Evaluation: ${displayEval}`}>
      {orientation === 'white' ? (
        <>
          <div
            className="bg-gray-900 transition-all duration-500"
            style={{ height: `${blackPct}%` }}
          />
          <div
            className="bg-gray-100 transition-all duration-500 flex items-end justify-center pb-1"
            style={{ height: `${whitePct}%` }}
          />
        </>
      ) : (
        <>
          <div
            className="bg-gray-100 transition-all duration-500"
            style={{ height: `${whitePct}%` }}
          />
          <div
            className="bg-gray-900 transition-all duration-500"
            style={{ height: `${blackPct}%` }}
          />
        </>
      )}
      <div className="absolute bottom-1 left-0 right-0 text-center text-xs font-mono text-gray-400 pointer-events-none">
        {displayEval}
      </div>
    </div>
  )
}

export default EvalBar
