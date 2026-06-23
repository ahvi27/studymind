/**
 * Registration page for new users.
 */

import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Register() {
  const { register, isAuthenticated, loading: authLoading } = useAuth()
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await register(form.email, form.username, form.password)
      window.location.href = '/dashboard'
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-white p-4 dark:from-gray-950 dark:to-gray-900">
      <div className="card w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Brain className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start organizing your study notes with AI
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              value={form.username}
              onChange={handleChange}
              className="input-field"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              className="input-field"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              value={form.confirm}
              onChange={handleChange}
              className="input-field"
              placeholder="Repeat password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <LoadingSpinner size="sm" /> : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
