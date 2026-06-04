import React from 'react'
import { useTheme } from '../components/ThemeContext'

const NAV_ITEMS = ['Board', 'Timeline', 'Reports']

export default function Header({ onNewTask, activePage, onNavigate }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className="relative flex items-center py-[18px] border-b border-white/[0.07] mb-9">

      {/* ── LEFT — Logo ── */}
      <div
        className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
        onClick={() => onNavigate('Board')}
      >
        <div className="w-9 h-9 bg-surface2 border border-white/[0.07] rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1"  y="1"  width="9" height="9" rx="2" fill="#e8a04a" />
            <rect x="12" y="1"  width="9" height="9" rx="2" fill="#e8a04a" opacity=".4" />
            <rect x="1"  y="12" width="9" height="9" rx="2" fill="#e8a04a" opacity=".2" />
            <rect x="12" y="12" width="9" height="9" rx="2" fill="#e8a04a" opacity=".7" />
          </svg>
        </div>
        <span className="font-display font-extrabold text-xl tracking-tight text-text1 hidden sm:block">
          Taskflow
        </span>
      </div>

      {/* ── CENTER — Nav (absolutely centered so it's always in middle) ── */}
      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-1 bg-surface2/50 rounded-xl p-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            onClick={() => onNavigate(item)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activePage === item
                ? 'bg-surface text-text1 shadow-sm'
                : 'text-text2 hover:text-text1 hover:bg-surface/60'
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* ── RIGHT — Actions ── */}
      <div className="ml-auto flex items-center gap-3">

        {/* Mobile nav pills — only visible below md */}
        <nav className="flex md:hidden gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => onNavigate(item)}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                activePage === item
                  ? 'bg-surface2 text-text1 font-medium'
                  : 'text-text2 hover:bg-surface2 hover:text-text1'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="theme-toggle-track">
            <span className="theme-icon-sun" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <path
                  d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="theme-icon-moon" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
              </svg>
            </span>
            <span className="theme-toggle-thumb" />
          </span>
        </button>

        {/* New Task — only on Board page */}
        {activePage === 'Board' && (
          <button
            onClick={onNewTask}
            className="px-4 py-2 rounded-lg bg-[#f0b060] text-[#1a1000] font-semibold text-sm
              shadow-accent transition-all duration-200
              hover:bg-[#f0b060] hover:-translate-y-px hover:shadow-lg active:translate-y-0"
          >
            + New Task
          </button>
        )}

        {/* Avatar */}
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#6b7fff] to-[#e8a04a]
          flex items-center justify-center text-[0.68rem] font-bold text-white
          border-2 border-white/[0.07] cursor-pointer hover:border-accent transition-all duration-200"
        >
          JD
        </div>
      </div>

    </header>
  )
}
