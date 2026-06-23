/**
 * Axios API client with JWT interceptors.
 */

import axios from 'axios'

// In dev, use Vite proxy (/api) so registration works from localhost and LAN IP.
// Set VITE_API_URL only for production builds pointing at a remote API.
const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// Notes API
export const notesAPI = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/notes/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: (search = '') => api.get('/notes/list', { params: search ? { search } : {} }),
  delete: (noteId) => api.delete(`/notes/delete/${noteId}`),
}

// Chat API
export const chatAPI = {
  ask: (question, noteId = null) =>
    api.post('/chat/ask', { question, note_id: noteId }),
  history: () => api.get('/chat/history'),
}

export default api
