/**
 * Dashboard overview with stats and quick actions.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Brain, FileText, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { chatAPI, notesAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ notes: 0, chats: 0 })
  const [recentNotes, setRecentNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [notesRes, chatRes] = await Promise.all([notesAPI.list(), chatAPI.history()])
        setStats({ notes: notesRes.data.total, chats: chatRes.data.length })
        setRecentNotes(notesRes.data.notes.slice(0, 5))
      } catch {
        // Silently handle — dashboard still renders
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
          Welcome back, {user?.username}!
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Upload notes and ask AI questions about your study materials.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.notes}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Notes uploaded</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.chats}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Questions asked</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Hybrid Retrieval</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">BM25 + Cosine Similarity</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/notes"
          className="card group flex items-center gap-4 transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white transition group-hover:scale-105">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Upload Notes</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Add .txt or .pdf files</p>
          </div>
        </Link>
        <Link
          to="/chat"
          className="card group flex items-center gap-4 transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white transition group-hover:scale-105">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Ask AI</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Query your study materials</p>
          </div>
        </Link>
      </div>

      {/* Recent notes */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Notes</h2>
        {recentNotes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No notes yet.{' '}
            <Link to="/notes" className="text-brand-600 hover:underline">
              Upload your first note
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentNotes.map((note) => (
              <li key={note.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-white">{note.title}</p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {note.content_preview}
                  </p>
                </div>
                <span className="ml-4 shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {note.file_type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
