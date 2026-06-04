import React, { useMemo } from 'react'

const STATUSES = ['todo', 'working', 'completed', 'onhold']

const STAT_META = {
  todo:      { label: 'To Do',     icon: '📝', accent: '#6b7fff', border: 'border-l-[#6b7fff]',  bg: 'bg-[rgba(107,127,255,0.12)]' },
  working:   { label: 'Working',   icon: '⚡', accent: '#e8a04a', border: 'border-l-[#e8a04a]',  bg: 'bg-[rgba(232,160,74,0.12)]' },
  completed: { label: 'Completed', icon: '✓',  accent: '#4ecb83', border: 'border-l-[#4ecb83]',  bg: 'bg-[rgba(78,203,131,0.12)]' },
  onhold:    { label: 'On Hold',   icon: '⏸',  accent: '#9b7fe8', border: 'border-l-[#9b7fe8]',  bg: 'bg-[rgba(155,127,232,0.12)]' },
}

// Deterministic weekly velocity data — only today's bar is live
const makeVelocityData = (completedCount) => {
  const day = new Date().getDay()
  const todayIdx = day === 0 ? 6 : day - 1
  return Array.from({ length: 7 }, (_, i) => {
    if (i < todayIdx) return Math.floor(((i + 1) * 31) % 7) + 2
    if (i === todayIdx) return completedCount
    return 0
  })
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const CIRCUMFERENCE = 314

export default function Dashboard({ tasks }) {
  const counts = useMemo(() => {
    const c = {}
    STATUSES.forEach(s => { c[s] = tasks.filter(t => t.status === s).length })
    return c
  }, [tasks])

  const total = tasks.length
  const done  = counts.completed
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100)
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE

  const velocityData = useMemo(() => makeVelocityData(done), [done])
  const maxVel = Math.max(...velocityData, 1)
  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()

  return (
    <section className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 mb-9">

      {/* Progress ring */}
      <div className="bg-surface border border-white/[0.07] rounded-[20px] p-6
        flex items-center gap-5 min-w-[230px] hover:border-white/[0.14] transition-all duration-200">
        <div className="relative w-[100px] h-[100px] flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#252532" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke="#e8a04a" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="ring-fill"
              style={{ filter: 'drop-shadow(0 0 6px rgba(232,160,74,0.4))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-extrabold text-[1.4rem] text-text1 leading-none">
              {pct}%
            </span>
            <span className="text-[0.62rem] text-text3 mt-0.5">Done</span>
          </div>
        </div>
        <div>
          <p className="font-display font-bold text-[0.95rem] text-text1 mb-1">Overall Progress</p>
          <p className="text-sm text-text2">{done} of {total} task{total !== 1 ? 's' : ''} complete</p>
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 gap-3">
        {STATUSES.map(status => {
          const m = STAT_META[status]
          return (
            <div
              key={status}
              className={`bg-surface border border-white/[0.07] border-l-2 ${m.border}
                rounded-2xl p-4 flex items-center gap-3
                hover:-translate-y-0.5 hover:border-white/[0.14] transition-all duration-200 cursor-default`}
            >
              <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center text-base flex-shrink-0`}>
                {m.icon}
              </div>
              <div>
                <div className="font-display font-extrabold text-2xl text-text1 leading-none">
                  {counts[status]}
                </div>
                <div className="text-xs text-text2 mt-0.5">{m.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Velocity chart */}
      <div className="hidden lg:flex bg-surface border border-white/[0.07] rounded-[20px] p-6
        min-w-[180px] flex-col gap-3 hover:border-white/[0.14] transition-all duration-200">
        <p className="text-[0.72rem] font-medium text-text2 uppercase tracking-widest">
          Weekly Completion
        </p>
        <div className="flex items-end gap-1.5 flex-1">
          {velocityData.map((val, i) => {
            const h = Math.max(4, Math.round((val / maxVel) * 60))
            const isToday = i === todayIdx
            const isPast  = i < todayIdx
            return (
              <div key={i} className="flex-1 flex flex-col justify-end" title={`${val} completed`}>
                <div
                  className={`rounded-t-sm transition-all duration-500 ${
                    isToday ? 'bg-accent' : isPast ? 'bg-[#4ecb83]' : 'bg-surface3'
                  }`}
                  style={{
                    height: `${h}px`,
                    boxShadow: isToday ? '0 0 10px rgba(232,160,74,0.5)' : undefined,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex gap-1.5">
          {DAYS.map((d, i) => (
            <span key={i} className="flex-1 text-center text-[0.62rem] text-text3">{d}</span>
          ))}
        </div>
      </div>

    </section>
  )
}
