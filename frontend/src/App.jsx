import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Navbar from './components/Layout/Navbar'

// Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import GameHistory from './pages/GameHistory'

// Modes
import AnalyzerMode from './modes/AnalyzerMode'
import PlayMode from './modes/PlayMode'
import BlindfoldMode from './modes/BlindfoldMode'
import NotationMode from './modes/NotationMode'

const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore()
  const location = useLocation()
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { token } = useAuthStore()
  if (token) return <Navigate to="/dashboard" replace />
  return children
}

const Layout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
  </div>
)

const App = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Protected */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/analyze" element={
        <ProtectedRoute>
          <Layout><AnalyzerMode /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/play" element={
        <ProtectedRoute>
          <Layout><PlayMode /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/blindfold" element={
        <ProtectedRoute>
          <Layout><BlindfoldMode /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/notation" element={
        <ProtectedRoute>
          <Layout><NotationMode /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <Layout><GameHistory /></Layout>
        </ProtectedRoute>
      } />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
