import { SetupScreen, SectionLabel, OptionButton, StartButton } from '../components/Layout/SetupScreen'
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

const DIFFICULTIES = [
  { label:'Beginner',     value:'beginner',     elo:1320, depth:4,  desc:'Misses tactics, drops pieces'       },
  { label:'Intermediate', value:'intermediate', elo:1700, depth:8,  desc:'Solid club play, occasional slip'   },
  { label:'Advanced',     value:'advanced',     elo:2200, depth:12, desc:'Expert strength, rare errors'       },
  { label:'Master',       value:'master',       elo:null, depth:18, desc:'Full engine strength'               },
]

const PlayMode = () => {
  const navigate = useNavigate()
  const [gameStarted,      setGameStarted]    = useState(false)
  const [playerColor,      setPlayerColor]    = useState('white')
  const [difficulty,       setDifficulty]     = useState('intermediate')
  const [engineThinking,   setEngineThinking] = useState(false)
  const [showModal,        setShowModal]      = useState(false)
  const [highlightSquares, setHighlight]      = useState({})
  const [selectedSquare,   setSelected]       = useState(null)
  const [gameSaved,        setGameSaved]      = useState(false)
  const [savedGameId,      setSavedGameId]    = useState(null)
  const startTime = useRef(Date.now())

  const chess = useChessGame()
  const { getBestMove, stop } = useStockfish()
  const { ref: boardRef, boardWidth } = useBoardSize({ gutter: 40 })

  const diffConfig = DIFFICULTIES.find(d => d.value === difficulty)

  const playEngineMove = useCallback(() => {
    if (chess.game.isGameOver()) return
    setEngineThinking(true)
    getBestMove(chess.game.fen(), diffConfig?.depth ?? 8, diffConfig?.elo ?? null, (bestMove) => {
      setEngineThinking(false)
      if (!bestMove || bestMove === '(none)') return
      chess.makeMove({ from: bestMove.slice(0,2), to: bestMove.slice(2,4), promotion: bestMove[4]||'q' })
    })
  }, [chess.game, diffConfig, getBestMove])

  useEffect(() => {
    if (!gameStarted || chess.gameOver || engineThinking) return
    if (chess.turn !== (playerColor === 'white' ? 'b' : 'w')) return
    const t = setTimeout(playEngineMove, 300)
    return () => clearTimeout(t)
  }, [chess.turn, chess.gameOver, gameStarted, playerColor, engineThinking, playEngineMove])

  useEffect(() => {
    if (!chess.gameOver || gameSaved) return
    setShowModal(true)
    const result = chess.gameOver.winner === playerColor ? 'win' : chess.gameOver.winner ? 'loss' : 'draw'
    saveGame({
      pgn: chess.pgn, fen: chess.fen, mode: 'play', result, playerColor,
      opponentLevel: difficulty, opening: detectOpening(chess.moveHistory),
      moveCount: chess.moveHistory.length,
      duration: Math.round((Date.now() - startTime.current) / 1000),
    }).then(({ data }) => setSavedGameId(data.game._id)).catch(() => {})
    setGameSaved(true)
  }, [chess.gameOver])

  const startGame = (color) => {
    const chosen = color === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : color
    setPlayerColor(chosen)
    chess.reset()
    setShowModal(false); setGameSaved(false); setSavedGameId(null)
    setHighlight({}); setSelected(null); setEngineThinking(false)
    startTime.current = Date.now()
    setGameStarted(true)
  }

  const onPieceDrop = (from, to, piece) => {
    if (engineThinking) return false
    if (chess.turn !== (playerColor === 'white' ? 'w' : 'b')) return false
    const isPromo = piece?.[1]?.toLowerCase() === 'p' && (to[1]==='8'||to[1]==='1')
    const move = chess.makeMove({ from, to, promotion: isPromo ? 'q' : undefined })
    if (!move) return false
    setHighlight({ [from]:{ backgroundColor:'rgba(232,160,32,0.3)' }, [to]:{ backgroundColor:'rgba(232,160,32,0.3)' } })
    setSelected(null)
    return true
  }

  const onSquareClick = (sq) => {
    if (engineThinking) return
    if (chess.turn !== (playerColor === 'white' ? 'w' : 'b')) return
    if (selectedSquare) {
      const move = chess.makeMove({ from: selectedSquare, to: sq, promotion: 'q' })
      setHighlight(move ? { [selectedSquare]:{ backgroundColor:'rgba(232,160,32,0.3)' }, [sq]:{ backgroundColor:'rgba(232,160,32,0.3)' } } : {})
      setSelected(null)
      return
    }
    const legal = chess.legalMoves(sq)
    if (legal.length > 0) {
      setSelected(sq)
      const hl = { [sq]: { backgroundColor: 'rgba(232,160,32,0.4)' } }
      legal.forEach(m => { hl[m.to] = { backgroundColor: 'rgba(232,160,32,0.18)', borderRadius: '50%' } })
      setHighlight(hl)
    }
  }

  const handleUndo = () => { stop(); setEngineThinking(false); chess.undoMove(); setHighlight({}); setSelected(null) }

  const handleResign = () => {
    if (gameSaved) return
    setShowModal(true)
    saveGame({
      pgn: chess.pgn, fen: chess.fen, mode: 'play', result: 'loss', playerColor,
      opponentLevel: difficulty, opening: detectOpening(chess.moveHistory),
      moveCount: chess.moveHistory.length,
      duration: Math.round((Date.now() - startTime.current) / 1000),
    }).then(({ data }) => setSavedGameId(data.game._id)).catch(() => {})
    setGameSaved(true)
  }

  /* ── Setup screen ─────────────────────────────────────────────────────── */
  if (!gameStarted) return (
    <SetupScreen
      icon="♟"
      title="Play vs Computer"
      subtitle="Challenge Stockfish at any level — from friendly beginner to near-perfect engine strength."
      accent="#34D399"
    >
      {/* Color */}
      <div>
        <SectionLabel>Play as</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {[{v:'white',i:'♔',l:'White'},{v:'black',i:'♚',l:'Black'},{v:'random',i:'🎲',l:'Random'}].map(({v,i,l}) => (
            <OptionButton key={v} selected={playerColor===v} accent="#34D399" onClick={() => setPlayerColor(v)}>
              <div style={{ fontSize:26, marginBottom:6, lineHeight:1 }}>{i}</div>
              <div style={{ fontSize:12, fontWeight:700, color: playerColor===v ? '#34D399' : 'var(--t2)' }}>{l}</div>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <SectionLabel>Difficulty</SectionLabel>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {DIFFICULTIES.map(({ label, value, elo, desc }) => (
            <button key={value} onClick={() => setDifficulty(value)} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'13px 16px', borderRadius:12, cursor:'pointer', outline:'none',
              border:`2px solid ${difficulty===value ? '#34D399' : 'var(--line)'}`,
              background: difficulty===value ? 'rgba(52,211,153,0.08)' : 'var(--bg-2)',
              transition:'all 0.15s',
            }}
            onMouseEnter={e => { if (difficulty!==value) e.currentTarget.style.borderColor='var(--line-hi)' }}
            onMouseLeave={e => { if (difficulty!==value) e.currentTarget.style.borderColor='var(--line)' }}>
              <div style={{ textAlign:'left' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color: difficulty===value ? '#34D399' : 'var(--t1)' }}>{label}</span>
                  {elo && <span style={{ fontSize:11, color:'var(--t3)', background:'var(--bg-3)', padding:'2px 7px', borderRadius:6 }}>~{elo} Elo</span>}
                  {!elo && <span style={{ fontSize:11, color:'var(--t3)', background:'var(--bg-3)', padding:'2px 7px', borderRadius:6 }}>Max</span>}
                </div>
                <p style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>{desc}</p>
              </div>
              {difficulty===value && <span style={{ color:'#34D399', fontSize:16, flexShrink:0 }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <StartButton onClick={() => startGame(playerColor)} accent="#34D399">
        Start Game
      </StartButton>
    </SetupScreen>
  )

  /* ── Game screen ──────────────────────────────────────────────────────── */
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Top bar */}
      <div className="topbar">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color:'var(--gold)' }}>⚔️</span>
          <span className="display" style={{ fontSize:15 }}>Play vs Computer</span>
          <span style={{ fontSize:11, color:'var(--t3)', background:'var(--bg-3)', border:'1px solid var(--line)', borderRadius:6, padding:'2px 8px' }}>
            {diffConfig?.label} {diffConfig?.elo ? `· ~${diffConfig.elo}` : '· Max'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {engineThinking && <span style={{ fontSize:11, color:'var(--gold)' }} className="anim-fade-in">● thinking</span>}
          <button onClick={() => { stop(); setGameStarted(false); chess.reset(); setEngineThinking(false) }}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--t3)' }}
            onMouseEnter={e => e.target.style.color='var(--gold)'}
            onMouseLeave={e => e.target.style.color='var(--t3)'}>
            ← New Game
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="game-wrap">
        {/* Board column */}
        <div ref={boardRef} className="board-col" style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20, gap:10, minWidth:0 }}>
          {/* Opponent nameplate */}
          <div className="nameplate" style={{ width: boardWidth }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:18 }}>{playerColor==='white'?'♚':'♔'}</span>
              <span style={{ fontSize:13, color:'var(--t2)', fontWeight:500 }}>Stockfish</span>
              {engineThinking && <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--gold)' }} className="anim-fade-in" />}
            </div>
            <CapturedPieces captured={{ white:[], black:chess.capturedPieces.black }} />
          </div>

          <ChessBoard
            position={chess.position} onPieceDrop={onPieceDrop} onSquareClick={onSquareClick}
            orientation={playerColor} customSquareStyles={highlightSquares}
            disabled={engineThinking || !!chess.gameOver} boardWidth={boardWidth}
          />

          {/* Player nameplate */}
          <div className="nameplate" style={{ width: boardWidth }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:18 }}>{playerColor==='white'?'♔':'♚'}</span>
              <span style={{ fontSize:13, color:'var(--t2)', fontWeight:500 }}>You</span>
              {chess.isCheck && !chess.gameOver && (
                <span style={{ fontSize:11, fontWeight:700, color:'var(--red)' }} className="anim-fade-in">CHECK</span>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <CapturedPieces captured={{ white:chess.capturedPieces.white, black:[] }} />
              <button onClick={handleUndo} className="btn btn-ghost" style={{ padding:'4px 10px', fontSize:12 }}>Undo</button>
              <button onClick={handleResign} className="btn btn-danger" style={{ padding:'4px 10px', fontSize:12 }}>Resign</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="game-sidebar" style={{ width:220, display:'flex', flexDirection:'column', background:'var(--bg-1)', borderLeft:'1px solid var(--line)' }}>
          <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--line)', flexShrink:0 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--t3)', marginBottom:3 }}>Opening</div>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--t1)' }}>{detectOpening(chess.moveHistory) || 'Starting Position'}</div>
          </div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <MoveHistory moves={chess.moveHistory} currentIndex={chess.currentMoveIndex} />
          </div>
        </div>
      </div>

      <GameEndModal
        isOpen={showModal}
        gameOver={chess.gameOver || (gameSaved && !chess.gameOver ? { reason:'resign', winner:null } : null)}
        playerColor={playerColor}
        onNewGame={() => { setGameStarted(false); setShowModal(false) }}
        onAnalyze={() => navigate(savedGameId ? `/analyze?gameId=${savedGameId}` : '/analyze')}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}

export default PlayMode
