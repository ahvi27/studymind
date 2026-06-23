/**
 * Notes management page: upload, list, search, delete.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Search, Trash2, Upload } from 'lucide-react'
import { notesAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)
  const searchTimeout = useRef(null)

  const fetchNotes = useCallback(async (query = '') => {
    setLoading(true)
    setError('')
    try {
      const { data } = await notesAPI.list(query)
      setNotes(data.notes)
    } catch {
      setError('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleSearch = (e) => {
    const value = e.target.value
    setSearch(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchNotes(value), 300)
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['txt', 'pdf'].includes(ext)) {
      setError('Only .txt and .pdf files are supported')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')
    try {
      await notesAPI.upload(file)
      setSuccess(`"${file.name}" uploaded successfully`)
      await fetchNotes(search)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (noteId, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return

    setDeletingId(noteId)
    setError('')
    try {
      await notesAPI.delete(noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      setSuccess('Note deleted')
    } catch {
      setError('Failed to delete note')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">My Notes</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Upload and manage your study materials
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            onChange={handleUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="btn-primary cursor-pointer">
            {uploading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Note
              </>
            )}
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search notes by title or content..."
          className="input-field pl-10"
        />
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : notes.length === 0 ? (
        <div className="card py-16 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            {search ? 'No notes match your search' : 'No notes uploaded yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <div key={note.id} className="card group relative flex flex-col">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {note.file_type}
                </span>
              </div>
              <h3 className="mb-1 truncate font-semibold text-gray-900 dark:text-white">
                {note.title}
              </h3>
              <p className="mb-4 line-clamp-3 flex-1 text-sm text-gray-500 dark:text-gray-400">
                {note.content_preview}
              </p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                <span className="text-xs text-gray-400">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(note.id, note.title)}
                  disabled={deletingId === note.id}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  aria-label="Delete note"
                >
                  {deletingId === note.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
