/**
 * Authentication context — manages user session and JWT token.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await authAPI.me()
      setUser(data)
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (email, password) => {
    const { data } = await authAPI.login(email, password)
    localStorage.setItem('token', data.access_token)
    const me = await authAPI.me()
    setUser(me.data)
    localStorage.setItem('user', JSON.stringify(me.data))
    return me.data
  }

  const register = async (email, username, password) => {
    await authAPI.register({ email, username, password })
    return login(email, password)
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch {
      // Ignore logout errors — clear local state regardless
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
