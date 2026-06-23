/**
 * AI chat page — ask questions about uploaded notes with confidence scores.
 */

import { useEffect, useRef, useState } from 'react'
import { Brain, Send, Sparkles } from 'lucide-react'
import { chatAPI, notesAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

function ConfidenceBadge({ score }) {
  const pct = Math.round(score * 100)
  let color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (pct >= 70) color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  else if (pct >= 40) color = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      <Sparkles className="h-3 w-3" />
      {pct}% confidence
    </span>
  )
}

export default function Chat() {
  const [notes, setNotes] = useState([])
  const [selectedNoteId, setSelectedNoteId] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [notesRes, historyRes] = await Promise.all([notesAPI.list(), chatAPI.history()])
        setNotes(notesRes.data.notes)
        // Load recent history as messages (reversed to chronological)
        const history = historyRes.data
          .slice(0, 10)
          .reverse()
          .flatMap((item) => [
            { role: 'user', content: item.question },
            { role: 'assistant', content: item.answer, confidence: item.confidence, sources: [] },
          ])
        setMessages(history)
      } catch {
        // Continue with empty state
      } finally {
        setInitialLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim() || loading) return

    const userMessage = question.trim()
    setQuestion('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const noteId = selectedNoteId ? parseInt(selectedNoteId, 10) : null
      const { data } = await chatAPI.ask(userMessage, noteId)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          confidence: data.confidence,
          sources: data.sources,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.response?.data?.detail || 'Sorry, something went wrong. Please try again.',
          confidence: 0,
          sources: [],
          error: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">Ask AI</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Query your notes using hybrid BM25 + cosine similarity retrieval
        </p>
      </div>

      {/* Note filter */}
      <div className="mb-4">
        <select
          value={selectedNoteId}
          onChange={(e) => setSelectedNoteId(e.target.value)}
          className="input-field max-w-sm"
        >
          <option value="">All notes</option>
          {notes.map((note) => (
            <option key={note.id} value={note.id}>
              {note.title}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="card flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Brain className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              Ask a question about your study notes
            </p>
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              Try: &quot;What is mitosis?&quot; or &quot;Explain Big O notation&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : msg.error
                        ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  {msg.role === 'assistant' && !msg.error && (
                    <div className="mb-2">
                      <ConfidenceBadge score={msg.confidence || 0} />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  {msg.sources?.length > 0 && (
                    <div className="mt-3 border-t border-gray-200 pt-2 dark:border-gray-700">
                      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        Sources:
                      </p>
                      {msg.sources.slice(0, 3).map((src, j) => (
                        <div key={j} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{src.note_title}</span>
                          {' '}
                          ({Math.round(src.score * 100)}%)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your notes..."
          className="input-field flex-1"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !question.trim()} className="btn-primary !px-4">
          {loading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}
