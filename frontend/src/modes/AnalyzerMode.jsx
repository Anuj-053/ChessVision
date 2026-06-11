import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import ChessBoard from '../components/Board/ChessBoard'
import EvalBar from '../components/Board/EvalBar'
import MoveHistory from '../components/GameControls/MoveHistory'
import useChessGame from '../hooks/useChessGame'
import useStockfish from '../hooks/useStockfish'
import useBoardSize from '../hooks/useBoardSize'
import { classifyMove, getMoveColor, getMoveSymbol, calculateAccuracy } from '../utils/moveClassifier'
import { detectOpening } from '../utils/openingDetector'
import { getGame, saveGame, updateGame } from '../services/gameService'

const DEPTH = 12

const AnalyzerMode = () => {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const gameId         = searchParams.get('gameId')   // set when opened from history/play

  const [pgnInput,         setPgnInput]         = useState('')
  const [loaded,           setLoaded]           = useState(false)
  const [analyzing,        setAnalyzing]        = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisData,     setAnalysisData]     = useState([])
  const [currentEval,      setCurrentEval]      = useState(0)
  const [bestMoveArrow,    setBestMoveArrow]    = useState([])
  const [error,            setError]            = useState('')
  const [savedId,          setSavedId]          = useState(null)  // DB _id of this game record

  const chess = useChessGame()
  const { analyzePosition, parseEval } = useStockfish()
  const { ref: boardRef, boardWidth } = useBoardSize({ gutter: 48 })

  const allMovesRef = useRef([])
  const analysisRef = useRef([])
  const abortRef    = useRef(false)

  // When opened with ?gameId=, load that game's PGN automatically
  useEffect(() => {
    if (!gameId) return
    setSavedId(gameId)   // we already have a record — don't create a duplicate
    getGame(gameId)
      .then(({ data }) => {
        if (!data.game?.pgn) return
        setPgnInput(data.game.pgn)
        // Auto-load the PGN so the user can hit "Run Analysis" straight away
        try {
          const g = new Chess()
          g.loadPgn(data.game.pgn)
          allMovesRef.current = g.history({ verbose: true })
          chess.loadPgn(data.game.pgn)
          chess.goToMove(-1)
          setLoaded(true)

          // If the game already has analysis, restore it
          if (data.game.analysis?.length) {
            setAnalysisData(data.game.analysis)
            analysisRef.current = data.game.analysis
            setAnalysisProgress(100)
          }
        } catch {}
      })
      .catch(() => {})
  }, [gameId])

  const handleLoadPgn = () => {
    setError('')
    if (!pgnInput.trim()) { setError('Please enter a PGN.'); return }
    try {
      const g = new Chess()
      g.loadPgn(pgnInput.trim())
      allMovesRef.current = g.history({ verbose: true })
      if (!allMovesRef.current.length) { setError('PGN has no moves.'); return }
      chess.loadPgn(pgnInput.trim())
      chess.goToMove(-1)
      setLoaded(true)
      setAnalysisData([])
      setAnalysisProgress(0)
      setCurrentEval(0)
      setBestMoveArrow([])
      setSavedId(null)   // fresh paste — new record on save
    } catch {
      setError('Could not parse PGN. Check the format and try again.')
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPgnInput(ev.target.result)
    reader.readAsText(file)
  }

  const runAnalysis = useCallback(async () => {
    const moves = allMovesRef.current
    if (!moves.length) return
    setAnalyzing(true)
    setAnalysisData([])
    analysisRef.current = []
    abortRef.current = false

    const tempGame = new Chess()
    let prevEval = 0

    for (let i = 0; i < moves.length; i++) {
      if (abortRef.current) break

      const move        = moves[i]
      const movedByW    = move.color === 'w'
      tempGame.move(move)
      const fen         = tempGame.fen()
      const sideToMove  = movedByW ? 'b' : 'w'   // after the move, opposite side to move

      const result = await new Promise((resolve) => {
        let settled = false
        const t = setTimeout(() => {
          if (settled) return
          settled = true
          resolve({ evaluation: prevEval, bestMove: null, classification: 'good' })
        }, 12000)

        analyzePosition(fen, DEPTH, null, (bestMove, lastInfoLine) => {
          if (settled) return
          clearTimeout(t)
          settled = true
          const evalNow        = parseEval(lastInfoLine, sideToMove)
          const classification = classifyMove(prevEval, evalNow, movedByW)
          prevEval = evalNow
          resolve({ evaluation: evalNow, bestMove, classification })
        })
      })

      if (abortRef.current) break

      analysisRef.current.push({
        moveNumber:     i,
        move:           move.san,
        fen,
        evaluation:     result.evaluation,
        bestMove:       result.bestMove,
        classification: result.classification,
      })
      setAnalysisData([...analysisRef.current])
      setAnalysisProgress(Math.round(((i + 1) / moves.length) * 100))
    }

    setAnalyzing(false)
    if (abortRef.current) return

    try {
      const cls           = analysisRef.current.map(a => a.classification)
      const opening       = detectOpening(moves)
      const whiteAccuracy = calculateAccuracy(cls, 'white')
      const accuracy      = whiteAccuracy

      // Determine the actual game result from the final position
      const finalGame  = new Chess()
      moves.forEach(m => finalGame.move(m))
      let result = 'incomplete'
      if (finalGame.isCheckmate()) {
        // The side that just moved delivered checkmate; turn() is the loser
        result = finalGame.turn() === 'b' ? 'white_win' : 'black_win'
      } else if (finalGame.isStalemate() || finalGame.isDraw() ||
                 finalGame.isThreefoldRepetition() || finalGame.isInsufficientMaterial()) {
        result = 'draw'
      } else {
        // Check PGN header tags for result (1-0, 0-1, 1/2-1/2)
        const header = pgnInput.match(/\[Result\s+"([^"]+)"\]/)
        if (header) {
          if (header[1] === '1-0')     result = 'white_win'
          else if (header[1] === '0-1') result = 'black_win'
          else if (header[1] === '1/2-1/2') result = 'draw'
        }
      }

      if (savedId) {
        await updateGame(savedId, {
          analysis:  analysisRef.current,
          accuracy,
          opening,
          moveCount: moves.length,
          result,
        })
      } else {
        const { data } = await saveGame({
          pgn:         pgnInput,
          mode:        'analyzer',
          result,
          playerColor: 'white',
          opening,
          moveCount:   moves.length,
          accuracy,
          analysis:    analysisRef.current,
        })
        setSavedId(data.game._id)
      }
    } catch {}
  }, [analyzePosition, parseEval, pgnInput, savedId])

  const handleMoveClick = (index) => {
    chess.goToMove(index)
    const d = analysisData[index]
    if (!d) { setCurrentEval(0); setBestMoveArrow([]); return }
    setCurrentEval(d.evaluation)
    if (d.bestMove?.length >= 4) {
      setBestMoveArrow([[d.bestMove.slice(0, 2), d.bestMove.slice(2, 4), 'rgba(251,191,36,0.8)']])
    } else {
      setBestMoveArrow([])
    }
  }

  const nav = (dir) => {
    const len = allMovesRef.current.length
    const cur = chess.currentMoveIndex
    if      (dir === 'start')                   handleMoveClick(-1)
    else if (dir === 'end')                     handleMoveClick(len - 1)
    else if (dir === 'prev' && cur > -1)        handleMoveClick(cur - 1)
    else if (dir === 'next' && cur < len - 1)   handleMoveClick(cur + 1)
  }

  const cls             = analysisData.map(a => a.classification)
  const whiteAccuracy   = calculateAccuracy(cls, 'white')
  const blackAccuracy   = calculateAccuracy(cls, 'black')
  const currentAnalysis = analysisData[chess.currentMoveIndex]
  const isSaved         = !!savedId

  // ── PGN Input ────────────────────────────────────────────────────────────
  if (!loaded) return (
    <div style={{ minHeight:'100%', background:'var(--bg-0)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      {/* Background glow */}
      <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:400, borderRadius:'50%',
        background:'radial-gradient(ellipse, rgba(232,160,32,0.06) 0%, transparent 65%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, right:0, width:280, height:280,
        backgroundImage:'radial-gradient(rgba(232,160,32,0.12) 1px, transparent 1px)', backgroundSize:'22px 22px',
        opacity:0.5, pointerEvents:'none',
        maskImage:'radial-gradient(ellipse 55% 55% at 100% 0%, black 20%, transparent 75%)',
        WebkitMaskImage:'radial-gradient(ellipse 55% 55% at 100% 0%, black 20%, transparent 75%)',
      }} />

      <div className="anim-fade-up" style={{ width:'100%', maxWidth:600, position:'relative' }}>
        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:72, height:72, borderRadius:20, marginBottom:20,
            background:'linear-gradient(135deg, rgba(232,160,32,0.18) 0%, rgba(232,160,32,0.06) 100%)',
            border:'1px solid rgba(232,160,32,0.35)',
            fontSize:30, color:'#E8A020',
            boxShadow:'0 8px 32px rgba(232,160,32,0.18)',
          }}>◈</div>
          <h1 className="display" style={{ fontSize:28, color:'var(--t1)', marginBottom:8 }}>Analyze a Game</h1>
          <p style={{ fontSize:13, color:'var(--t3)', lineHeight:1.6 }}>
            Paste a PGN or upload a file — Stockfish analyses every move at depth 12.
          </p>
        </div>

        {/* Card */}
        <div style={{ background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:20, padding:'28px 24px',
          boxShadow:'0 24px 80px rgba(0,0,0,0.4)', display:'flex', flexDirection:'column', gap:16 }}>

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(248,113,113,0.08)',
              border:'1px solid rgba(248,113,113,0.25)', color:'#F87171', fontSize:13 }}>{error}</div>
          )}

          <textarea
            value={pgnInput}
            onChange={e => setPgnInput(e.target.value)}
            style={{
              width:'100%', height:200, background:'var(--bg-2)', border:'1px solid var(--line)',
              borderRadius:12, padding:'14px 16px', color:'var(--t2)', fontFamily:'monospace',
              fontSize:12, lineHeight:1.7, resize:'none', outline:'none', transition:'border-color 0.15s',
              boxSizing:'border-box',
            }}
            onFocus={e => e.target.style.borderColor='rgba(232,160,32,0.5)'}
            onBlur={e => e.target.style.borderColor='var(--line)'}
            placeholder={'[Event "Game"]\n[White "Player1"]\n[Black "Player2"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 ...'}
          />

          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <button onClick={handleLoadPgn} style={{
              padding:'11px 22px', borderRadius:12, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg, #E8A020 0%, #D4820A 100%)',
              color:'#0C0C0E', fontSize:14, fontWeight:800, transition:'all 0.15s',
              boxShadow:'0 4px 20px rgba(232,160,32,0.35)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(232,160,32,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 20px rgba(232,160,32,0.35)' }}>
              Load PGN
            </button>

            <label style={{
              padding:'11px 18px', borderRadius:12, border:'1px solid var(--line)', cursor:'pointer',
              background:'var(--bg-2)', color:'var(--t2)', fontSize:13, fontWeight:600, transition:'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--line-hi)'; e.currentTarget.style.color='var(--t1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color='var(--t2)' }}>
              Upload .pgn
              <input type="file" accept=".pgn,.txt" onChange={handleFileUpload} style={{ display:'none' }} />
            </label>

            <button onClick={() => setPgnInput('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. a4 c5 16. d5')}
              style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--t3)', transition:'color 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--t2)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--t3)'}>
              Load sample ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Analysis View ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="border-b border-gray-800 bg-gray-900/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 text-xl">🔍</span>
          <h1 className="font-display text-lg font-bold text-white">PGN Analyzer</h1>
          {isSaved && !analyzing && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">✓ Saved</span>
          )}
          {analyzing && (
            <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full animate-pulse">
              Analysing…
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {analyzing && (
            <button onClick={() => { abortRef.current = true }}
              className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
              Cancel
            </button>
          )}
          <button
            onClick={() => { setLoaded(false); setAnalysisData([]); abortRef.current = true; navigate('/analyze') }}
            className="text-sm text-gray-400 hover:text-amber-400 transition-colors">
            ← New Analysis
          </button>
        </div>
      </div>

      <div className="game-wrap">
        {/* Eval Bar */}
        <div className="eval-col relative bg-gray-900 border-r border-gray-800" style={{ width: 40 }}>
          <EvalBar evaluation={currentEval} />
        </div>

        {/* Board */}
        <div ref={boardRef} className="board-col flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4">
            {currentAnalysis && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">Move {chess.currentMoveIndex + 1}:</span>
                <span className="font-mono text-white font-semibold">{currentAnalysis.move}</span>
                <span style={{ color: getMoveColor(currentAnalysis.classification) }} className="font-semibold">
                  {currentAnalysis.classification} {getMoveSymbol(currentAnalysis.classification)}
                </span>
                <span className="text-gray-500 font-mono text-xs">
                  {currentEval > 0 ? '+' : ''}{(currentEval / 100).toFixed(2)}
                </span>
              </div>
            )}

            <ChessBoard
              position={chess.position}
              disabled={true}
              arrowsArr={bestMoveArrow}
              boardWidth={boardWidth}
            />

            <div className="flex items-center gap-2">
              {[['start','|◀'],['prev','◀'],['next','▶'],['end','▶|']].map(([dir, label]) => (
                <button key={dir} onClick={() => nav(dir)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-mono transition-colors">
                  {label}
                </button>
              ))}
            </div>

            {!analyzing && analysisData.length === 0 && (
              <button onClick={runAnalysis}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-950 font-semibold rounded-lg transition-colors">
                ✦ Run Engine Analysis
              </button>
            )}

            {analyzing && (
              <div className="w-full max-w-sm">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Analysing move {analysisRef.current.length} of {allMovesRef.current.length}…</span>
                  <span>{analysisProgress}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${analysisProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="game-sidebar flex flex-col" style={{ width: 280, background: 'var(--bg-1)', borderLeft: '1px solid var(--line)' }}>
          <div className="p-4 border-b border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Opening</div>
            <div className="text-sm text-white font-medium">{detectOpening(allMovesRef.current)}</div>
          </div>

          {analysisData.length > 0 && (
            <div className="p-4 border-b border-gray-800 space-y-4">
              {/* Accuracy — separate for White and Black */}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Accuracy</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gray-100">{whiteAccuracy}%</div>
                    <div className="text-xs text-gray-500 mt-0.5">♔ White</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gray-100">{blackAccuracy}%</div>
                    <div className="text-xs text-gray-500 mt-0.5">♚ Black</div>
                  </div>
                </div>
              </div>

              {/* Move quality breakdown */}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Move Quality</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    ['Brilliant', 'brilliant', '#06b6d4'],
                    ['Good',      'good',      '#22c55e'],
                    ['Inaccuracy','inaccuracy','#eab308'],
                    ['Mistake',   'mistake',   '#f97316'],
                    ['Blunder',   'blunder',   '#ef4444'],
                  ].map(([label, key, color]) => (
                    <div key={key} className="bg-gray-800 rounded-lg p-2 text-center">
                      <div className="text-base font-bold" style={{ color }}>
                        {cls.filter(c => c === key).length}
                      </div>
                      <div className="text-xs text-gray-600 leading-tight">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <MoveHistory
              moves={allMovesRef.current}
              currentIndex={chess.currentMoveIndex}
              onMoveClick={handleMoveClick}
              classifications={cls}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyzerMode
