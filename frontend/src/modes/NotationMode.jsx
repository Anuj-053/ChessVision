import { SetupScreen, SectionLabel, OptionButton, StartButton } from '../components/Layout/SetupScreen'
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
  { label:'Beginner',     value:'beginner',     depth:1  },
  { label:'Intermediate', value:'intermediate', depth:5  },
  { label:'Advanced',     value:'advanced',     depth:10 },
  { label:'Master',       value:'master',       depth:15 },
]

const NotationMode = () => {
  const [gameStarted,    setGameStarted]    = useState(false)
  const [playerColor,    setPlayerColor]    = useState('white')
  const [difficulty,     setDifficulty]     = useState('intermediate')
  const [moveInput,      setMoveInput]      = useState('')
  const [moveError,      setMoveError]      = useState('')
  const [engineThinking, setEngineThinking] = useState(false)
  const [showModal,      setShowModal]      = useState(false)
  const [gameSaved,      setGameSaved]      = useState(false)
  const inputRef  = useRef(null)
  const startTime = useRef(Date.now())

  const chess = useChessGame()
  const { getBestMove }               = useStockfish()
  const { ref: boardRef, boardWidth } = useBoardSize({ gutter: 24 })
  const diffConfig = DIFFICULTIES.find(d => d.value === difficulty)

  const playEngineMove = useCallback(() => {
    if (chess.game.isGameOver()) return
    setEngineThinking(true)
    getBestMove(chess.game.fen(), diffConfig?.depth || 5, null, (bestMove) => {
      setEngineThinking(false)
      if (!bestMove || bestMove === '(none)') return
      chess.makeMove({ from:bestMove.slice(0,2), to:bestMove.slice(2,4), promotion:bestMove[4]||'q' })
    })
  }, [chess.game, diffConfig, getBestMove])

  useEffect(() => {
    if (!gameStarted || chess.gameOver || engineThinking) return
    const engineColor = playerColor==='white'?'b':'w'
    if (chess.turn !== engineColor) { setTimeout(() => inputRef.current?.focus(), 100); return }
    const t = setTimeout(playEngineMove, 400); return () => clearTimeout(t)
  }, [chess.turn, gameStarted, playerColor, chess.gameOver, engineThinking, playEngineMove])

  useEffect(() => {
    if (!chess.gameOver || gameSaved) return
    setShowModal(true)
    const result = chess.gameOver.winner===playerColor?'win':chess.gameOver.winner?'loss':'draw'
    saveGame({ pgn:chess.pgn, fen:chess.fen, mode:'notation', result, playerColor,
      opponentLevel:difficulty, opening:detectOpening(chess.moveHistory),
      moveCount:chess.moveHistory.length, duration:Math.round((Date.now()-startTime.current)/1000) }).catch(()=>{})
    setGameSaved(true)
  }, [chess.gameOver])

  const handleMoveSubmit = (e) => {
    e.preventDefault()
    if (!moveInput.trim() || engineThinking) return
    if (chess.turn !== (playerColor==='white'?'w':'b')) { setMoveError('Not your turn!'); return }
    const move = chess.makeMove(moveInput.trim())
    if (move) { setMoveInput(''); setMoveError('') }
    else setMoveError(`Invalid: "${moveInput.trim()}"`)
  }

  const startGame = () => {
    chess.reset(); setShowModal(false); setGameSaved(false); setMoveInput(''); setMoveError('')
    setEngineThinking(false); startTime.current = Date.now(); setGameStarted(true)
  }

  if (!gameStarted) return (
    <SetupScreen
      icon="▤"
      title="Notation Mode"
      subtitle="Board and pieces fully visible. Enter every move by typing — build notation fluency through repetition."
      accent="#60A5FA"
    >
      <div>
        <SectionLabel>Play as</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[{value:'white',icon:'♔',label:'White'},{value:'black',icon:'♚',label:'Black'}].map(({value,icon,label}) => (
            <OptionButton key={value} selected={playerColor===value} accent="#60A5FA" onClick={() => setPlayerColor(value)}>
              <div style={{ fontSize:26, marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:playerColor===value?'#60A5FA':'var(--t2)' }}>{label}</div>
            </OptionButton>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Difficulty</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {DIFFICULTIES.map(({label,value}) => (
            <OptionButton key={value} selected={difficulty===value} accent="#60A5FA" onClick={() => setDifficulty(value)} style={{ flexDirection:'row', gap:8 }}>
              <span style={{ fontSize:13, fontWeight:700, color:difficulty===value?'#60A5FA':'var(--t2)' }}>{label}</span>
            </OptionButton>
          ))}
        </div>
      </div>
      <StartButton onClick={startGame} accent="#60A5FA">Start Game</StartButton>
    </SetupScreen>
  )

  return (
    <div className="flex flex-col" style={{ height:'calc(100vh - 56px)', background:'var(--bg-base)' }}>
      <div className="px-4 md:px-6 py-2.5 flex items-center justify-between shrink-0"
           style={{ background:'var(--bg-surface)', borderBottom:'1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-white">Notation Mode</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background:'rgba(96,165,250,0.1)', color:'#60A5FA', border:'1px solid rgba(96,165,250,0.2)' }}>
            {diffConfig?.label}
          </span>
          {engineThinking && <span className="text-xs animate-pulse" style={{ color:'var(--gold)' }}>thinking…</span>}
        </div>
        <button onClick={() => { setGameStarted(false); chess.reset() }}
          className="text-xs font-medium" style={{ color:'var(--text-3)' }}>← New</button>
      </div>

      <div className="flex-1 flex game-layout overflow-hidden">
        <div ref={boardRef} className="board-col flex-1 flex flex-col items-center justify-center p-3 md:p-6 gap-4 min-w-0">
          <ChessBoard position={chess.position} orientation={playerColor} disabled={true} boardWidth={boardWidth} />

          <div className="w-full space-y-2.5" style={{ maxWidth: boardWidth }}>
            {chess.isCheck && !chess.gameOver && (
              <p className="text-center text-xs font-bold animate-pulse" style={{ color:'var(--red)' }}>⚠ CHECK</p>
            )}
            <form onSubmit={handleMoveSubmit} className="flex gap-2">
              <input ref={inputRef} value={moveInput}
                onChange={e => { setMoveInput(e.target.value); setMoveError('') }}
                className="flex-1 rounded-xl px-4 py-3 font-mono text-base outline-none transition-all"
                style={{ background:'var(--bg-raised)', border:`1px solid ${moveError?'var(--red)':'var(--border)'}`, color:'var(--text-1)' }}
                onFocus={e => { if(!moveError) e.target.style.borderColor='var(--gold)' }}
                onBlur={e  => { if(!moveError) e.target.style.borderColor='var(--border)' }}
                placeholder={chess.turn===(playerColor==='white'?'w':'b')?'e4, Nf3, O-O…':'Engine thinking…'}
                disabled={engineThinking || !!chess.gameOver} autoComplete="off" />
              <button type="submit" disabled={engineThinking || !moveInput.trim() || !!chess.gameOver}
                className="btn-gold px-4 rounded-xl font-bold disabled:opacity-40">↵</button>
            </form>
            {moveError && (
              <p className="text-xs px-3 py-2 rounded-lg"
                 style={{ background:'rgba(239,68,68,0.08)', color:'#F87171', border:'1px solid rgba(239,68,68,0.15)' }}>{moveError}</p>
            )}
            <div className="text-center text-xs" style={{ color:'var(--text-3)' }}>
              Turn: <span style={{ color:'var(--text-2)' }}>{chess.turn==='w'?'White':'Black'}</span>
              {' · '}You play <span style={{ color:'var(--text-2)' }}>{playerColor}</span>
            </div>
          </div>
        </div>

        <div className="game-sidebar w-64 flex flex-col" style={{ background:'var(--bg-surface)', borderLeft:'1px solid var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor:'var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color:'var(--text-3)' }}>Opening</div>
            <div className="text-sm font-medium text-white">{detectOpening(chess.moveHistory)||'Starting Position'}</div>
          </div>
          <div className="flex-1 overflow-hidden">
            <MoveHistory moves={chess.moveHistory} currentIndex={chess.currentMoveIndex} />
          </div>
        </div>
      </div>

      <GameEndModal isOpen={showModal} gameOver={chess.gameOver} playerColor={playerColor}
        onNewGame={() => { setGameStarted(false); setShowModal(false) }}
        onClose={() => setShowModal(false)} />
    </div>
  )
}

export default NotationMode
