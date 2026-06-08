import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGames, deleteGame } from '../services/gameService'

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

const GameHistory = () => {
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ mode: '', result: '' })
  const [deleting, setDeleting] = useState(null)

  const fetchGames = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 10, ...filters }
      if (!params.mode) delete params.mode
      if (!params.result) delete params.result
      const { data } = await getGames(params)
      setGames(data.games)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setGames([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGames() }, [page, filters])

  const handleDelete = async (id) => {
    if (!confirm('Delete this game?')) return
    setDeleting(id)
    try {
      await deleteGame(id)
      setGames(g => g.filter(x => x._id !== id))
      setTotal(t => t - 1)
    } catch {}
    setDeleting(null)
  }

  const handleAnalyze = (game) => {
    navigate(`/analyze?gameId=${game._id}`)
  }

  const FilterSelect = ({ name, options, label }) => (
    <select
      value={filters[name]}
      onChange={e => { setFilters(f => ({ ...f, [name]: e.target.value })); setPage(1) }}
      className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400 transition-colors"
    >
      <option value="">{label}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="border-b border-gray-800 bg-gray-900/50 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Game History</h1>
            <p className="text-gray-500 text-sm mt-0.5">{total} games total</p>
          </div>
          <div className="flex items-center gap-3">
            <FilterSelect
              name="mode"
              label="All Modes"
              options={[
                { value: 'analyzer', label: 'Analyzer' },
                { value: 'play', label: 'vs Bot' },
                { value: 'blindfold', label: 'Blindfold' },
                { value: 'notation', label: 'Notation' },
              ]}
            />
            <FilterSelect
              name="result"
              label="All Results"
              options={[
                { value: 'win',       label: 'Win'       },
                { value: 'loss',      label: 'Loss'      },
                { value: 'draw',      label: 'Draw'      },
                { value: 'white_win', label: 'White Won' },
                { value: 'black_win', label: 'Black Won' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-14 animate-pulse" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <div className="text-5xl mb-4">♜</div>
            <p className="font-display text-lg">No games found</p>
            <p className="text-sm mt-1">Try adjusting your filters or play some games first!</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Mode', 'Opening', 'Moves', 'Color', 'Level', 'Accuracy', 'Result', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game._id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                      <td className="px-4 py-3 text-gray-300">{MODE_LABEL[game.mode] || game.mode}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[140px] truncate" title={game.opening}>
                        {game.opening}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{game.moveCount}</td>
                      <td className="px-4 py-3 text-gray-400 capitalize">{game.playerColor}</td>
                      <td className="px-4 py-3 text-gray-400 capitalize">{game.opponentLevel || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {game.accuracy ? `${Math.round(game.accuracy)}%` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RESULT_BADGE[game.result] || RESULT_BADGE.incomplete}`}>
                          {RESULT_LABEL[game.result] || game.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(game.playedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {game.pgn && (
                            <button
                              onClick={() => handleAnalyze(game)}
                              className="text-xs px-2 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 rounded transition-colors"
                            >
                              Analyze
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(game._id)}
                            disabled={deleting === game._id}
                            className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors disabled:opacity-50"
                          >
                            {deleting === game._id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-gray-500 text-sm px-2">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default GameHistory
