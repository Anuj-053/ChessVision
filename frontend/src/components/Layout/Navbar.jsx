import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const Navbar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/analyze', label: 'Analyzer' },
    { path: '/play', label: 'Play' },
    { path: '/blindfold', label: 'Blindfold' },
    { path: '/notation', label: 'Notation' },
    { path: '/history', label: 'History' },
  ]

  return (
    <nav className="bg-black-900 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-2">
        <span className="text-amber-400 text-2xl">♔</span>
        <span className="font-display text-xl font-bold text-white">Chess<span className="text-amber-400">Vision</span></span>
      </Link>
      
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              location.pathname === path
                ? 'bg-amber-400 text-gray-950'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <span className="text-gray-400 text-sm hidden md:block">
            <span className="text-amber-400">♙</span> {user.username}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
