/**
 * Sidebar navigation for the dashboard layout.
 */

import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  Brain,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/notes', icon: BookOpen, label: 'My Notes' },
  { to: '/chat', icon: Brain, label: 'Ask AI' },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-5 dark:border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Brain className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-gray-900 dark:text-white">StudyMind</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="mb-3 truncate text-sm text-gray-500 dark:text-gray-400">
          {user?.username}
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleDarkMode}
            className="btn-secondary flex-1 !py-2"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={handleLogout} className="btn-secondary flex-1 !py-2" aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform dark:border-gray-800 dark:bg-gray-900 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-4 rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
        {sidebarContent}
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6" />
    </button>
  )
}
