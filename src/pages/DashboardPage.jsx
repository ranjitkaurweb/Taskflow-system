import React, { useMemo, useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'

const DAY = 86400000

const fmtDate = (ts) => {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const STATUS_META = {
  todo:      { label: 'To Do',      color: '#6b7fff', bg: 'rgba(107,127,255,0.12)', grad: 'linear-gradient(135deg,#6b7fff,#8b97ff)' },
  working:   { label: 'In Progress',color: '#e8a04a', bg: 'rgba(232,160,74,0.12)',  grad: 'linear-gradient(135deg,#e8a04a,#f0b060)' },
  completed: { label: 'Completed',  color: '#4ecb83', bg: 'rgba(78,203,131,0.12)',  grad: 'linear-gradient(135deg,#4ecb83,#6ddbaa)' },
  onhold:    { label: 'On Hold',    color: '#9b7fe8', bg: 'rgba(155,127,232,0.12)', grad: 'linear-gradient(135deg,#9b7fe8,#b49cf0)' },
}

const PRIORITY_META = {
  high:   { color: '#ff5f6d', bg: 'rgba(255,95,109,0.12)', label: 'High' },
  medium: { color: '#e8a04a', bg: 'rgba(232,160,74,0.12)', label: 'Medium' },
  low:    { color: '#4ecb83', bg: 'rgba(78,203,131,0.12)', label: 'Low' },
}

function DonutRing({ pct, color, size = 56, stroke = 6 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease', filter:`drop-shadow(0 0 4px ${color}88)` }}
      />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="11" fontWeight="700" fontFamily="Montserrat, sans-serif">{pct}%</text>
    </svg>
  )
}

function Sparkline({ data, color }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const w = 80, h = 28
  const step = w / (data.length - 1)
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter:`drop-shadow(0 2px 4px ${color}66)` }} />
      {data.map((v, i) => v > 0 && <circle key={i} cx={i * step} cy={h - (v / max) * h} r="2.5" fill={color} />)}
    </svg>
  )
}

export default function DashboardPage({ tasks, profile, onNavigate }) {
  const now = Date.now()
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const { pendingTasks } = useNotifications(tasks, profile)

  const stats = useMemo(() => {
    const counts = { todo: 0, working: 0, completed: 0, onhold: 0 }
    tasks.forEach(t => counts[t.status]++)
    const total = tasks.length
    const completionPct = total ? Math.round((counts.completed / total) * 100) : 0
    const overdue = tasks.filter(t => t.due && new Date(t.due) < new Date() && t.status !== 'completed').length
    const highPri = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length
    const doneThisWeek = tasks.filter(t => t.completedAt && (now - t.completedAt) < 7 * DAY).length
    const recentTasks = [...tasks].sort((a,b) => b.created - a.created).slice(0, 5)
    const dueSoon = tasks.filter(t => {
      if (!t.due || t.status === 'completed') return false
      const diff = (new Date(t.due + 'T23:59:59').getTime() - now) / DAY
      return diff >= 0 && diff <= 3
    }).sort((a,b) => new Date(a.due) - new Date(b.due)).slice(0, 5)
    const sparkline = Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (6 - i) * DAY
      const dayEnd = dayStart + DAY
      return tasks.filter(t => t.completedAt && t.completedAt >= dayStart && t.completedAt < dayEnd).length
    })
    return { counts, total, completionPct, overdue, highPri, doneThisWeek, recentTasks, dueSoon, sparkline }
  }, [tasks, now])

  const v = (x) => `var(--t-${x})`
  const card = (extra = {}) => ({ background: v('surface'), border: `1px solid ${v('border')}`, borderRadius: '18px', padding: '20px 22px', ...extra })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div style={{ color: v('text1'), fontFamily: 'DM Sans, sans-serif' }}>
   <style>{`
  .dash-stat-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:14px; margin-bottom:20px; }
  .dash-dist-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
  .dash-bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px; }
  .dash-actions-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; }
  .dash-greeting { font-size:26px; }
  .dash-card { padding:20px 22px; }
@media (max-width: 1024px) {
  .dash-stat-grid { grid-template-columns:repeat(2, 1fr); gap:12px; }
}
  @media (max-width: 768px) {
    .dash-stat-grid { grid-template-columns:repeat(2, 1fr); gap:12px; }
    .dash-dist-grid { grid-template-columns:repeat(2, 1fr); gap:10px; }
    .dash-bottom-grid { grid-template-columns:1fr; gap:12px; }
    .dash-actions-grid { grid-template-columns:1fr; gap:8px; }
    .dash-greeting { font-size:20px; }
    .dash-card { padding:16px 14px !important; }
    .dash-quote { display:none; }
  }
  @media (max-width: 480px) {
  .dash-stat-grid { grid-template-columns:1fr; }
  .dash-actions-grid { grid-template-columns:1fr; }
  .dash-greeting { font-size:18px; }
  .dash-dist-grid { grid-template-columns:repeat(2, 1fr); gap:8px; }
  .dash-card { padding:14px 12px !important; }
}
@media (max-width: 380px) {
  .dash-stat-grid { grid-template-columns:1fr; gap:8px; }
  .dash-actions-grid { grid-template-columns:1fr; }
  .dash-dist-grid { grid-template-columns:1fr 1fr; gap:6px; }
  .dash-greeting { font-size:16px; }
  .dash-card { padding:12px 10px !important; }
  .dash-bottom-grid { gap:10px; }
}
@media (max-width: 320px) {
  .dash-stat-grid { grid-template-columns:1fr; gap:6px; }
  .dash-dist-grid { grid-template-columns:1fr; gap:6px; }
  .dash-actions-grid { grid-template-columns:1fr; }
  .dash-greeting { font-size:15px; }
  .dash-card { padding:10px 8px !important; }
}
`}</style>
      {/* PENDING BANNER */}
      {!bannerDismissed && pendingTasks.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', background: 'rgba(232,160,74,0.10)', border: '1px solid rgba(232,160,74,0.30)', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>⏰</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8a04a', marginBottom: '4px' }}>
                {pendingTasks.length} task{pendingTasks.length > 1 ? 's are' : ' is'} pending with no due date
              </div>
              <div style={{ fontSize: '12px', color: '#b07830', lineHeight: 1.6 }}>
                {pendingTasks.slice(0, 3).map(t => t.title).join(', ')}
                {pendingTasks.length > 3 && ` +${pendingTasks.length - 3} more`}
              </div>
            </div>
          </div>
          <button onClick={() => setBannerDismissed(true)} style={{ background: 'none', border: 'none', color: '#e8a04a', cursor: 'pointer', fontSize: '16px', padding: '0', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* GREETING */}
      <div style={{ marginBottom: '24px' }}>
        <div className="dash-greeting" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>
          Good {greeting}, {firstName} 👋
        </div>
        <div style={{ fontSize: '13px', color: v('text2'), marginBottom: '8px' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div className="dash-quote" style={{ fontSize: '13px', color: v('text3'), fontStyle: 'italic', borderLeft: '3px solid rgba(232,160,74,0.4)', paddingLeft: '10px', lineHeight: 1.6 }}>
          {["The secret of getting ahead is getting started.", "Focus on being productive instead of busy.", "Small progress is still progress.", "Done is better than perfect.", "Your only limit is your mind.", "Work hard in silence, let success make the noise.", "Push yourself, because no one else is going to do it for you."][new Date().getDay() % 7]}
        </div>
      </div>

      {/* TOP STAT CARDS */}
      <div className="dash-stat-grid">
        <div className="dash-card" style={{ ...card(), background: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '1px solid rgba(107,127,255,0.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(107,127,255,0.08)' }} />
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7fff', marginBottom: '12px' }}>Completion</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <DonutRing pct={stats.completionPct} color="#6b7fff" />
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Montserrat, sans-serif', color: '#fff', lineHeight: 1 }}>{stats.total}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>total tasks</div>
            </div>
          </div>
        </div>

        <div className="dash-card" style={{ ...card(), background: 'linear-gradient(135deg,#0d2818,#0a2010)', border: '1px solid rgba(78,203,131,0.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(78,203,131,0.07)' }} />
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4ecb83', marginBottom: '12px' }}>Done This Week</div>
          <div style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'Montserrat, sans-serif', color: '#fff', lineHeight: 1, marginBottom: '8px' }}>{stats.doneThisWeek}</div>
          <Sparkline data={stats.sparkline} color="#4ecb83" />
        </div>

        <div className="dash-card" style={{ ...card(), background: stats.overdue > 0 ? 'linear-gradient(135deg,#2e0d0d,#200a0a)' : card().background, border: `1px solid ${stats.overdue > 0 ? 'rgba(255,95,109,0.25)' : v('border')}`, position: 'relative', overflow: 'hidden' }}>
          {stats.overdue > 0 && <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,95,109,0.07)' }} />}
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: stats.overdue > 0 ? '#ff5f6d' : v('text3'), marginBottom: '12px' }}>Overdue</div>
          <div style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'Montserrat, sans-serif', color: stats.overdue > 0 ? '#ff5f6d' : v('text1'), lineHeight: 1, marginBottom: '6px' }}>{stats.overdue}</div>
          <div style={{ fontSize: '12px', color: v('text3') }}>{stats.overdue === 0 ? 'All on track ✓' : 'need attention'}</div>
        </div>

        <div className="dash-card" style={{ ...card(), background: 'linear-gradient(135deg,#2a1a10,#1e1208)', border: '1px solid rgba(232,160,74,0.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(232,160,74,0.07)' }} />
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e8a04a', marginBottom: '12px' }}>High Priority</div>
          <div style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'Montserrat, sans-serif', color: '#fff', lineHeight: 1, marginBottom: '6px' }}>{stats.highPri}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>pending tasks</div>
        </div>
      </div>

      {/* TASK DISTRIBUTION */}
      <div className="dash-card" style={{ ...card(), marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: v('text2'), textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '18px' }}>Task distribution</div>
        <div className="dash-dist-grid">
          {Object.entries(STATUS_META).map(([key, meta]) => {
            const count = stats.counts[key]
            const pct = stats.total ? Math.round((count / stats.total) * 100) : 0
            return (
              <div key={key} style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
                onClick={() => onNavigate('Board')}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'Montserrat, sans-serif', color: v('text1') }}>{count}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '6px', background: v('surface3'), overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '6px', background: meta.grad, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize: '11px', color: v('text3'), marginTop: '5px' }}>{pct}% of all</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RECENT + DUE SOON */}
      <div className="dash-bottom-grid">
        <div className="dash-card" style={card()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: v('text2'), textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recent tasks</div>
            <button onClick={() => onNavigate('Board')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#e8a04a', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {stats.recentTasks.length === 0 ? (
              <div style={{ fontSize: '13px', color: v('text3'), padding: '12px 0' }}>No tasks yet. Create one!</div>
            ) : stats.recentTasks.map(t => {
              const sm = STATUS_META[t.status]
              const pm = PRIORITY_META[t.priority]
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: `1px solid ${v('border')}` }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: sm?.color, flexShrink: 0, boxShadow: `0 0 5px ${sm?.color}` }} />
                  <span style={{ flex: 1, fontSize: '13px', color: t.status === 'completed' ? v('text3') : v('text1'), textDecoration: t.status === 'completed' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: pm?.bg, color: pm?.color, fontWeight: 600, flexShrink: 0 }}>{pm?.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="dash-card" style={card()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: v('text2'), textTransform: 'uppercase', letterSpacing: '0.07em' }}>Due soon</div>
            <button onClick={() => onNavigate('Timeline')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#e8a04a', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>Timeline →</button>
          </div>
          {stats.dueSoon.length === 0 ? (
            <div style={{ fontSize: '13px', color: v('text3'), padding: '12px 0' }}>Nothing due in the next 3 days ✓</div>
          ) : stats.dueSoon.map(t => {
            const dueTs = new Date(t.due + 'T23:59:59').getTime()
            const diff = Math.ceil((dueTs - now) / DAY)
            const isToday = diff === 0
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: `1px solid ${v('border')}` }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isToday ? '#ff5f6d' : '#e8a04a', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '13px', color: v('text1'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, flexShrink: 0, background: isToday ? 'rgba(255,95,109,0.15)' : 'rgba(232,160,74,0.15)', color: isToday ? '#ff5f6d' : '#e8a04a' }}>
                  {isToday ? 'Today' : `${diff}d`}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="dash-card" style={card()}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: v('text2'), textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px' }}>Quick actions</div>
        <div className="dash-actions-grid">
          {[
            { label: 'Open Board', icon: '📋', page: 'Board',    color: '#6b7fff' },
            { label: 'Timeline',   icon: '⏱️',  page: 'Timeline', color: '#9b7fe8' },
            { label: 'Reports',    icon: '📊',  page: 'Reports',  color: '#4ecb83' },
          ].map(a => (
            <button key={a.page} onClick={() => onNavigate(a.page)}
              style={{ background: `${a.color}12`, border: `1px solid ${a.color}30`, borderRadius: '12px', padding: '14px 12px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', fontFamily: 'DM Sans, sans-serif', width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${a.color}22`; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = `${a.color}12`; e.currentTarget.style.transform = 'translateY(0)' }}>
              <span style={{ fontSize: '20px' }}>{a.icon}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: a.color }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
