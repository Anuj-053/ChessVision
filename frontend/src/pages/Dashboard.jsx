import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getStats } from '../services/gameService'

const MODES = [
  {
    path: '/analyze',
    icon: '🔍',
    title: 'PGN Analyzer',
    desc: 'Upload or paste a PGN and get move-by-move Stockfish analysis with accuracy scores.',
    accent: 'from-amber-400/20 to-amber-600/5',
    border: 'border-amber-400/30',
    tag: 'Analysis',
  },
  {
    path: '/play',
    icon: '⚔️',
    title: 'Play vs Computer',
    desc: 'Challenge the engine from Beginner to Master difficulty. Track your progress.',
    accent: 'from-green-400/20 to-green-600/5',
    border: 'border-green-400/30',
    tag: 'Play',
  },
  {
    path: '/blindfold',
    icon: '🙈',
    title: 'Blindfold Training',
    desc: 'Play without seeing the board. Type moves in algebraic notation to sharpen visualization.',
    accent: 'from-purple-400/20 to-purple-600/5',
    border: 'border-purple-400/30',
    tag: 'Training',
  },
  {
    path: '/notation',
    icon: '📋',
    title: 'Notation Mode',
    desc: 'See the board coordinates but not the pieces. Reveal on demand to train spatial memory.',
    accent: 'from-cyan-400/20 to-cyan-600/5',
    border: 'border-cyan-400/30',
    tag: 'Training',
  },
]

const RESULT_BADGE = {
  win:       'bg-green-500/20 text-green-400 border border-green-500/30',
  loss:      'bg-red-500/20 text-red-400 border border-red-500/30',
  draw:      'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  white_win: 'bg-gray-100/20 text-gray-100 border border-gray-300/30',
  black_win: 'bg-gray-700/40 text-gray-300 border border-gray-600/30',
  incomplete:'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
}

const RESULT_LABEL = {
  win:       'Win',
  loss:      'Loss',
  draw:      'Draw',
  white_win: 'White Won',
  black_win: 'Black Won',
  incomplete:'Incomplete',
}

const MODE_LABEL = { analyzer: 'Analyzer', play: 'vs Bot', blindfold: 'Blindfold', notation: 'Notation' }

const Dashboard = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(({ data }) => {
        setStats(data.stats)
        setRecent(data.recent || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats
    ? [
        { label: 'Total Games', value: stats.total, icon: '♟', color: 'text-amber-400' },
        { label: 'Wins', value: stats.wins, icon: '🏆', color: 'text-green-400' },
        { label: 'Losses', value: stats.losses, icon: '💔', color: 'text-red-400' },
        {
          label: 'Win Rate',
          value: stats.total > 0
            ? `${Math.round((stats.wins / stats.total) * 100)}%`
            : 'N/A',
          icon: '📈',
          color: 'text-cyan-400',
        },
      ]
    : []

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Welcome back, <span className="text-amber-400">{user?.username}</span>
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Ready to improve your chess?</p>
          </div>
          <Link
            to="/history"
            className="text-sm text-gray-400 hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            View all games →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Stats */}
        {!loading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon, color }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 text-xs uppercase tracking-wider">{label}</span>
                  <span className="text-xl">{icon}</span>
                </div>
                <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        )}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
                <div className="h-3 bg-gray-800 rounded w-20 mb-4" />
                <div className="h-8 bg-gray-800 rounded w-12" />
              </div>
            ))}
          </div>
        )}

        {/* Mode Cards */}
        <div>
          <h2 className="font-display text-xl font-semibold text-white mb-4">Choose Your Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {MODES.map(({ path, icon, title, desc, accent, border, tag }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative text-left bg-gradient-to-br ${accent} border ${border} rounded-xl p-5 hover:scale-[1.02] transition-all duration-200 group`}
              >
                <div className="text-3xl mb-3">{icon}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{tag}</div>
                <h3 className="font-semibold text-white text-base mb-2 group-hover:text-amber-400 transition-colors">
                  {title}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Games */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-white">Recent Games</h2>
              <Link to="/history" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                See all →
              </Link>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase">Mode</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase">Opening</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase">Moves</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase">Color</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase">Result</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((game) => (
                    <tr key={game._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-gray-300">{MODE_LABEL[game.mode] || game.mode}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 max-w-[160px] truncate">{game.opening}</td>
                      <td className="px-4 py-3 text-gray-400">{game.moveCount}</td>
                      <td className="px-4 py-3 text-gray-400 capitalize">{game.playerColor}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RESULT_BADGE[game.result] || RESULT_BADGE.incomplete}`}>
                          {RESULT_LABEL[game.result] || game.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(game.playedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && recent.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <div className="text-5xl mb-4">♟</div>
            <p className="text-lg font-display">No games yet</p>
            <p className="text-sm mt-1">Play your first game to see stats here!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
