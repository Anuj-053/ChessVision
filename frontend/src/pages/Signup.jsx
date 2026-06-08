import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../services/authService'
import useAuthStore from '../store/authStore'

const Signup = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    if (form.username.length < 3) return 'Username must be at least 3 characters'
    if (!form.email.includes('@')) return 'Please enter a valid email'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    if (form.password !== form.confirm) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)
    try {
      const { data } = await signup({
        username: form.username,
        email: form.email,
        password: form.password,
      })
      setAuth(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { label: 'Username', name: 'username', type: 'text', placeholder: 'grandmaster42' },
    { label: 'Email', name: 'email', type: 'email', placeholder: 'you@example.com' },
    { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
    { label: 'Confirm Password', name: 'confirm', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div
      className="min-h-screen bg-gray-950 flex items-center justify-center px-4"
      style={{ backgroundImage: 'radial-gradient(ellipse at 40% 70%, rgba(251,191,36,0.06) 0%, transparent 60%)' }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-amber-400 text-5xl block mb-3">♔</span>
          <h1 className="font-display text-4xl font-bold text-white">
            Chess<span className="text-amber-400">Vision</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Begin your chess journey.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Create account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[name]}
                  onChange={e => setForm({ ...form, [name]: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-gray-950 font-semibold rounded-lg transition-colors mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
