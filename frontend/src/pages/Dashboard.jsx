import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getStats } from '../services/gameService'

const MODES = [
  {
    path: '/analyze',
    title: 'PGN Analyzer',
    desc: 'Deep engine analysis on any game. See every mistake, blunder, and brilliant move.',
    icon: '◈',
    accent: '#E8A020',
    glow: 'rgba(232,160,32,0.18)',
    border: 'rgba(232,160,32,0.25)',
    tag: 'ANALYSIS',
    bg: 'linear-gradient(135deg, rgba(232,160,32,0.10) 0%, rgba(232,160,32,0.02) 100%)',
  },
  {
    path: '/play',
    title: 'Play vs Computer',
    desc: 'From 1320 Elo beginner to full Stockfish power. Test your skills at any level.',
    icon: '♟',
    accent: '#34D399',
    glow: 'rgba(52,211,153,0.18)',
    border: 'rgba(52,211,153,0.25)',
    tag: 'PLAY',
    bg: 'linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(52,211,153,0.02) 100%)',
  },
  {
    path: '/blindfold',
    title: 'Blindfold Training',
    desc: 'No board. Pure visualization. Type every move from memory to sharpen your mind.',
    icon: '◉',
    accent: '#A78BFA',
    glow: 'rgba(167,139,250,0.18)',
    border: 'rgba(167,139,250,0.25)',
    tag: 'TRAINING',
    bg: 'linear-gradient(135deg, rgba(167,139,250,0.10) 0%, rgba(167,139,250,0.02) 100%)',
  },
  {
    path: '/notation',
    title: 'Notation Mode',
    desc: 'Board visible, moves typed. Build the habit of reading algebraic notation fluently.',
    icon: '▤',
    accent: '#60A5FA',
    glow: 'rgba(96,165,250,0.18)',
    border: 'rgba(96,165,250,0.25)',
    tag: 'TRAINING',
    bg: 'linear-gradient(135deg, rgba(96,165,250,0.10) 0%, rgba(96,165,250,0.02) 100%)',
  },
]

const RESULT_BADGE = {
  win:       { bg:'rgba(52,211,153,0.12)',  border:'rgba(52,211,153,0.3)',   color:'#34D399',  label:'Win'       },
  loss:      { bg:'rgba(248,113,113,0.12)', border:'rgba(248,113,113,0.3)',  color:'#F87171',  label:'Loss'      },
  draw:      { bg:'rgba(148,163,184,0.1)',  border:'rgba(148,163,184,0.25)', color:'#94A3B8',  label:'Draw'      },
  white_win: { bg:'rgba(240,240,240,0.06)', border:'rgba(240,240,240,0.15)', color:'#D4D4D8',  label:'White Won' },
  black_win: { bg:'rgba(60,60,80,0.2)',     border:'rgba(100,100,130,0.3)',  color:'#8888A0',  label:'Black Won' },
  incomplete:{ bg:'rgba(232,160,32,0.08)',  border:'rgba(232,160,32,0.2)',   color:'#E8A020',  label:'Incomplete'},
}

const MODE_LABEL = { analyzer:'Analyzer', play:'vs Bot', blindfold:'Blindfold', notation:'Notation' }

const Dashboard = () => {
  const { user }  = useAuthStore()
  const navigate  = useNavigate()
  const [stats,   setStats]   = useState(null)
  const [recent,  setRecent]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(({ data }) => { setStats(data.stats); setRecent(data.recent || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const winRate = stats?.total > 0 ? Math.round((stats.wins / stats.total) * 100) : null
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const STAT_CARDS = stats ? [
    { label: 'Games',    value: stats.total,  color: '#EEEEF0', sub: 'played'        },
    { label: 'Wins',     value: stats.wins,   color: '#34D399', sub: 'victories'     },
    { label: 'Losses',   value: stats.losses, color: '#F87171', sub: 'defeats'       },
    { label: 'Win Rate', value: winRate !== null ? `${winRate}%` : '—', color: '#E8A020', sub: 'of games' },
  ] : []

  return (
    <div style={{ minHeight:'100%', background:'var(--bg-0)' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '40px 24px 36px',
        background: 'linear-gradient(180deg, rgba(232,160,32,0.05) 0%, transparent 100%)',
        borderBottom: '1px solid var(--line)',
      }}>
        {/* Decorative orbs */}
        <div style={{ position:'absolute', top:-80, right:-40, width:320, height:320, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(232,160,32,0.08) 0%, transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 65%)', pointerEvents:'none' }} />

        <div style={{ maxWidth:960, margin:'0 auto', position:'relative' }}>
          <p style={{ fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--t3)', marginBottom:8 }}>
            {greeting}
          </p>
          <h1 className="display" style={{ fontSize:32, lineHeight:1.15, marginBottom:10 }}>
            <span style={{ color:'var(--t1)' }}>Hey, </span>
            <span style={{
              background: 'linear-gradient(120deg, #F5B840 0%, #E8A020 60%, #D4820A 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{user?.username}</span>
            <span style={{ color:'var(--t1)' }}> 👋</span>
          </h1>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <p style={{ fontSize:14, color:'var(--t3)' }}>
              {stats?.total
                ? <><span style={{ color:'var(--t2)' }}>{stats.total} game{stats.total !== 1 ? 's' : ''} played</span>{winRate !== null ? <> · <span style={{ color:'#E8A020' }}>{winRate}% win rate</span></> : ''}</>
                : 'Ready to play your first game?'}
            </p>
            <Link to="/history" style={{
              display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8,
              border:'1px solid var(--line)', background:'var(--bg-2)',
              fontSize:12, fontWeight:600, color:'var(--t3)', textDecoration:'none',
              transition:'all 0.15s', flexShrink:0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color='var(--gold)'; e.currentTarget.style.borderColor='rgba(232,160,32,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--t3)';   e.currentTarget.style.borderColor='var(--line)' }}>
              All games →
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 20px', display:'flex', flexDirection:'column', gap:40 }}>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            {[...Array(4)].map((_,i) => (
              <div key={i} className="skeleton" style={{ borderRadius:16, height:100 }} />
            ))}
          </div>
        ) : stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            {STAT_CARDS.map(({ label, value, color, sub }, i) => (
              <div key={label} className="anim-fade-up" style={{
                background: 'var(--bg-1)', border: '1px solid var(--line)',
                borderRadius: 16, padding: '20px 22px',
                position: 'relative', overflow: 'hidden',
                animationDelay: `${i * 55}ms`,
              }}>
                {/* subtle color bar on left */}
                <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:'0 3px 3px 0', background:color, opacity:0.7 }} />
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em', color:'var(--t3)', marginBottom:14 }}>
                  {label}
                </div>
                <div className="display" style={{ fontSize:36, lineHeight:1, color, marginBottom:4 }}>{value}</div>
                <div style={{ fontSize:11, color:'var(--t3)' }}>{sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Mode Cards ────────────────────────────────────────────────── */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <h2 className="display" style={{ fontSize:20, color:'var(--t1)', whiteSpace:'nowrap' }}>Choose Mode</h2>
            <div style={{ flex:1, height:1, background:'linear-gradient(90deg, var(--line) 0%, transparent 100%)' }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:14 }}>
            {MODES.map(({ path, icon, title, desc, accent, glow, border, tag, bg }, i) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="anim-fade-up"
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 18,
                  padding: '22px 20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
                  position: 'relative',
                  overflow: 'hidden',
                  animationDelay: `${i * 60}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = `0 12px 40px ${glow}`
                  e.currentTarget.style.borderColor = accent
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = border
                }}
              >
                {/* Glow behind icon */}
                <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%',
                  background:`radial-gradient(circle, ${glow} 0%, transparent 70%)`, pointerEvents:'none' }} />

                <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.12em', color:accent, marginBottom:16, opacity:0.9 }}>
                  {tag}
                </div>
                <div style={{ fontSize:32, marginBottom:14, color:accent, filter:`drop-shadow(0 0 12px ${glow})`, lineHeight:1 }}>
                  {icon}
                </div>
                <div className="display" style={{ fontSize:15, fontWeight:700, color:'var(--t1)', marginBottom:8, lineHeight:1.3 }}>
                  {title}
                </div>
                <div style={{ fontSize:12, color:'var(--t3)', lineHeight:1.65, marginBottom:18 }}>
                  {desc}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:accent }}>
                  Open <span style={{ transition:'transform 0.15s' }}>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Recent Games ──────────────────────────────────────────────── */}
        {recent.length > 0 && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <h2 className="display" style={{ fontSize:20, color:'var(--t1)', whiteSpace:'nowrap' }}>Recent Games</h2>
              <div style={{ flex:1, height:1, background:'linear-gradient(90deg, var(--line) 0%, transparent 100%)' }} />
              <Link to="/history" style={{ fontSize:12, fontWeight:700, color:'var(--gold)', textDecoration:'none', flexShrink:0 }}>
                See all →
              </Link>
            </div>

            <div style={{ background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:16, overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:440 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid var(--line)' }}>
                      {['Mode','Opening','Moves','Color','Result','Date'].map(h => (
                        <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, fontWeight:700,
                          textTransform:'uppercase', letterSpacing:'0.09em', color:'var(--t3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((game) => {
                      const badge = RESULT_BADGE[game.result] || RESULT_BADGE.incomplete
                      return (
                        <tr key={game._id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'12px 16px', fontSize:13, color:'var(--t2)', fontWeight:600 }}>
                            {MODE_LABEL[game.mode] || game.mode}
                          </td>
                          <td style={{ padding:'12px 16px', fontSize:12, color:'var(--t3)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                            title={game.opening}>{game.opening}</td>
                          <td style={{ padding:'12px 16px', fontSize:12, color:'var(--t3)', fontFamily:'monospace' }}>{game.moveCount}</td>
                          <td style={{ padding:'12px 16px', fontSize:12, color:'var(--t3)', textTransform:'capitalize' }}>{game.playerColor}</td>
                          <td style={{ padding:'12px 16px' }}>
                            <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20,
                              fontSize:11, fontWeight:700, background:badge.bg, border:`1px solid ${badge.border}`, color:badge.color }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding:'12px 16px', fontSize:11, color:'var(--t3)', fontFamily:'monospace' }}>
                            {new Date(game.playedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && recent.length === 0 && (
          <div className="anim-fade-up" style={{ textAlign:'center', padding:'64px 0' }}>
            <div style={{ fontSize:56, opacity:0.07, marginBottom:16, lineHeight:1 }}>♟</div>
            <p className="display" style={{ fontSize:20, color:'var(--t2)', marginBottom:8 }}>No games yet</p>
            <p style={{ fontSize:13, color:'var(--t3)' }}>Pick a mode above to get started</p>
          </div>
        )}

      </div>
    </div>
  )
}

export default Dashboard
