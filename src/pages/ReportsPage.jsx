import React, { useState, useMemo } from 'react'

/* ── helpers ── */
const DAY = 86400000
const startOfDay = (ts) => {
  const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime()
}
const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
const fmtFull = (ts) => new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })

const STATUS_COLOR = {
  todo:      { bar: '#6b7fff', label: 'To Do' },
  working:   { bar: '#e8a04a', label: 'Working' },
  completed: { bar: '#4ecb83', label: 'Completed' },
  onhold:    { bar: '#9b7fe8', label: 'On Hold' },
}
const PRIORITY_COLOR = {
  high:   '#ff5f6d',
  medium: '#e8a04a',
  low:    '#4ecb83',
}

/* ── bar chart component ── */
function BarChart({ data, maxVal }) {
  if (!data.length) return (
    <div style={{ textAlign:'center', padding:'40px 0', color:'var(--t-text2, #8b8a9b)', fontSize:'14px' }}>
      No data for this period
    </div>
  )
  const peak = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'180px', padding:'0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', height:'100%', justifyContent:'flex-end' }}>
          <span style={{ fontSize:'11px', color:'var(--t-text2, #8b8a9b)', fontWeight:500 }}>{d.value || ''}</span>
          <div
            style={{
              width:'100%', borderRadius:'5px 5px 2px 2px',
              background: d.color || 'var(--t-accent, #e8a04a)',
              height: `${Math.max(4, Math.round((d.value / peak) * 140))}px`,
              transition: 'height 0.5s ease',
              minHeight: d.value > 0 ? '6px' : '2px',
              opacity: d.value > 0 ? 1 : 0.25,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <span style={{ fontSize:'10px', color:'var(--t-text3, #5a5968)', whiteSpace:'nowrap', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis' }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── stat card ── */
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      background:'var(--t-surface, #16161d)', border:'1px solid var(--t-border, rgba(255,255,255,0.07))',
      borderRadius:'16px', padding:'18px 20px',
    }}>
      <div style={{ fontSize:'22px', marginBottom:'10px' }}>{icon}</div>
      <div style={{ fontSize:'28px', fontWeight:800, fontFamily:'Syne, sans-serif', color: color || 'var(--t-text1, #f0eff5)', lineHeight:1 }}>
        {value}
      </div>
      <div style={{ fontSize:'13px', color:'var(--t-text2, #8b8a9b)', marginTop:'4px' }}>{label}</div>
      {sub && <div style={{ fontSize:'11px', color:'var(--t-text3, #5a5968)', marginTop:'3px' }}>{sub}</div>}
    </div>
  )
}

export default function ReportsPage({ tasks }) {
  const today = startOfDay(Date.now())
  const [filter, setFilter]     = useState('week')   // today | week | month | year | custom
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')
  const [chartMode, setChartMode] = useState('status') // status | priority | daily

  /* ── compute date range ── */
  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    const end = today + DAY - 1
    if (filter === 'today')  return { rangeStart: today, rangeEnd: end, rangeLabel: 'Today' }
    if (filter === 'week')   return { rangeStart: today - 6 * DAY, rangeEnd: end, rangeLabel: 'Last 7 days' }
    if (filter === 'month')  return { rangeStart: today - 29 * DAY, rangeEnd: end, rangeLabel: 'Last 30 days' }
    if (filter === 'year')   return { rangeStart: today - 364 * DAY, rangeEnd: end, rangeLabel: 'This year' }
    if (filter === 'custom' && fromDate && toDate) {
      const s = new Date(fromDate + 'T00:00:00').getTime()
      const e = new Date(toDate   + 'T23:59:59').getTime()
      return { rangeStart: s, rangeEnd: e, rangeLabel: `${fmtDate(s)} – ${fmtDate(e)}` }
    }
    return { rangeStart: today - 6 * DAY, rangeEnd: end, rangeLabel: 'Last 7 days' }
  }, [filter, fromDate, toDate, today])

  /* ── tasks in range (based on created date) ── */
  const tasksInRange = useMemo(() =>
    tasks.filter(t => t.created >= rangeStart && t.created <= rangeEnd),
    [tasks, rangeStart, rangeEnd]
  )

  /* ── stats ── */
  const stats = useMemo(() => {
    const completed = tasksInRange.filter(t => t.status === 'completed')
    const avgDays = completed.length
      ? (completed.reduce((s, t) => s + (t.completedAt
          ? Math.round((t.completedAt - t.created) / DAY)
          : 0), 0) / completed.length).toFixed(1)
      : '—'
    const overdue = tasksInRange.filter(t =>
      t.due && new Date(t.due) < new Date() && t.status !== 'completed'
    ).length
    const completionRate = tasksInRange.length
      ? Math.round((completed.length / tasksInRange.length) * 100)
      : 0
    return { total: tasksInRange.length, completed: completed.length, overdue, avgDays, completionRate }
  }, [tasksInRange])

  /* ── chart data ── */
  const chartData = useMemo(() => {
    if (chartMode === 'status') {
      return ['todo','working','completed','onhold'].map(s => ({
        label: STATUS_COLOR[s].label,
        value: tasksInRange.filter(t => t.status === s).length,
        color: STATUS_COLOR[s].bar,
      }))
    }
    if (chartMode === 'priority') {
      return ['high','medium','low'].map(p => ({
        label: p.charAt(0).toUpperCase() + p.slice(1),
        value: tasksInRange.filter(t => t.priority === p).length,
        color: PRIORITY_COLOR[p],
      }))
    }
    // daily — last 14 days or range broken into days (max 30)
    const days = Math.min(30, Math.round((rangeEnd - rangeStart) / DAY) + 1)
    return Array.from({ length: days }, (_, i) => {
      const dayStart = rangeStart + i * DAY
      const dayEnd   = dayStart + DAY - 1
      const count    = tasksInRange.filter(t => t.created >= dayStart && t.created <= dayEnd).length
      return { label: fmtDate(dayStart), value: count, color: '#6b7fff' }
    })
  }, [chartMode, tasksInRange, rangeStart, rangeEnd])

  /* ── styles ── */
  const s = {
    page: { color:'var(--t-text1, #f0eff5)' },
    heading: { fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'22px', marginBottom:'6px' },
    sub: { fontSize:'13px', color:'var(--t-text2, #8b8a9b)', marginBottom:'28px' },
    filterRow: { display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'24px', alignItems:'center' },
    filterBtn: (active) => ({
      padding:'6px 16px', borderRadius:'100px', border:'1px solid',
      borderColor: active ? 'var(--t-accent, #e8a04a)' : 'var(--t-border, rgba(255,255,255,0.07))',
      background: active ? 'rgba(232,160,74,0.12)' : 'transparent',
      color: active ? 'var(--t-accent, #e8a04a)' : 'var(--t-text2, #8b8a9b)',
      fontSize:'13px', fontWeight: active ? 600 : 400, cursor:'pointer', transition:'all 0.15s',
    }),
    card: {
      background:'var(--t-surface, #16161d)', border:'1px solid var(--t-border, rgba(255,255,255,0.07))',
      borderRadius:'20px', padding:'24px',
    },
    cardTitle: { fontSize:'13px', fontWeight:600, color:'var(--t-text2, #8b8a9b)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'20px' },
    modeBtn: (active) => ({
      padding:'4px 12px', borderRadius:'8px', border:'none',
      background: active ? 'var(--t-surface3, #252532)' : 'transparent',
      color: active ? 'var(--t-text1, #f0eff5)' : 'var(--t-text2, #8b8a9b)',
      fontSize:'12px', cursor:'pointer', transition:'all 0.15s',
    }),
    dateInput: {
      background:'var(--t-surface2, #1e1e28)', border:'1px solid var(--t-border, rgba(255,255,255,0.07))',
      borderRadius:'8px', color:'var(--t-text1, #f0eff5)', padding:'6px 10px', fontSize:'13px',
    },
    listItem: {
      display:'flex', alignItems:'center', gap:'12px', padding:'11px 0',
      borderBottom:'1px solid var(--t-border, rgba(255,255,255,0.07))',
    },
  }

  return (
    <div style={s.page}>
      <div style={s.heading}>Reports</div>
      <div style={s.sub}>Analyse your tasks for <strong>{rangeLabel}</strong></div>

      {/* ── FILTER ROW ── */}
      <div style={s.filterRow}>
        {['today','week','month','year','custom'].map(f => (
          <button key={f} style={s.filterBtn(filter === f)} onClick={() => setFilter(f)}>
            {f === 'today' ? 'Today' : f === 'week' ? 'Last 7 days' : f === 'month' ? 'Last 30 days' : f === 'year' ? 'This year' : 'Custom range'}
          </button>
        ))}

        {filter === 'custom' && (
          <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={s.dateInput} />
            <span style={{ color:'var(--t-text3)', fontSize:'13px' }}>to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={s.dateInput} />
          </div>
        )}
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'12px', marginBottom:'24px' }}>
        <StatCard icon="📋" label="Total tasks" value={stats.total} />
        <StatCard icon="✅" label="Completed" value={stats.completed} color="#4ecb83" />
        <StatCard icon="📈" label="Completion rate" value={`${stats.completionRate}%`} color={stats.completionRate >= 70 ? '#4ecb83' : stats.completionRate >= 40 ? '#e8a04a' : '#ff5f6d'} />
        <StatCard icon="⏱️" label="Avg. days to complete" value={stats.avgDays} sub="days per task" />
        <StatCard icon="🚨" label="Overdue tasks" value={stats.overdue} color={stats.overdue > 0 ? '#ff5f6d' : '#4ecb83'} />
      </div>

      {/* ── BAR CHART ── */}
      <div style={{ ...s.card, marginBottom:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
          <div style={s.cardTitle}>Task breakdown</div>
          <div style={{ display:'flex', gap:'4px', background:'var(--t-surface2, #1e1e28)', borderRadius:'8px', padding:'3px' }}>
            {['status','priority','daily'].map(m => (
              <button key={m} style={s.modeBtn(chartMode === m)} onClick={() => setChartMode(m)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <BarChart data={chartData} />
        {/* legend */}
        <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginTop:'16px' }}>
          {chartData.map((d, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--t-text2, #8b8a9b)' }}>
              <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:d.color, flexShrink:0 }} />
              {d.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── TASK LIST IN RANGE ── */}
      <div style={s.card}>
        <div style={s.cardTitle}>Tasks created in this period ({tasksInRange.length})</div>
        {tasksInRange.length === 0 ? (
          <div style={{ color:'var(--t-text3)', fontSize:'13px', padding:'16px 0' }}>No tasks created in this period.</div>
        ) : (
          tasksInRange.map(t => {
            const sm = STATUS_COLOR[t.status]
            return (
              <div key={t.id} style={s.listItem}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:sm.bar, flexShrink:0, boxShadow:`0 0 6px ${sm.bar}` }} />
                <span style={{ flex:1, fontSize:'13px', color:'var(--t-text1, #f0eff5)' }}>{t.title}</span>
                <span style={{
                  fontSize:'11px', padding:'2px 8px', borderRadius:'20px',
                  background:`${PRIORITY_COLOR[t.priority]}20`, color:PRIORITY_COLOR[t.priority],
                  fontWeight:600,
                }}>
                  {t.priority}
                </span>
                <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'20px', background:`${sm.bar}20`, color:sm.bar }}>
                  {sm.label}
                </span>
                <span style={{ fontSize:'11px', color:'var(--t-text3, #5a5968)', whiteSpace:'nowrap' }}>
                  {fmtFull(t.created)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
