import React, { useState, useMemo } from 'react'

const DAY = 86400000

const fmtDate = (ts) => {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
}
const fmtTime = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
}
const daysBetween = (a, b) => Math.max(0, Math.floor((b - a) / DAY))

const STATUS_META = {
  todo:      { color:'#6b7fff', bg:'rgba(107,127,255,0.12)', label:'To Do' },
  working:   { color:'#e8a04a', bg:'rgba(232,160,74,0.12)',  label:'Working' },
  completed: { color:'#4ecb83', bg:'rgba(78,203,131,0.12)',  label:'Completed' },
  onhold:    { color:'#9b7fe8', bg:'rgba(155,127,232,0.12)', label:'On Hold' },
}
const PRI_COLOR = { high:'#ff5f6d', medium:'#e8a04a', low:'#4ecb83' }

/* ── timeline bar for one task ── */
function TimelineBar({ task, minTs, totalMs }) {
  const now       = Date.now()
  const sm        = STATUS_META[task.status]
  const start     = task.created
  const end       = task.completedAt || (task.due ? new Date(task.due + 'T23:59:59').getTime() : now)
  const leftPct   = Math.max(0, Math.min(100, ((start - minTs) / totalMs) * 100))
  const widthPct  = Math.max(1, Math.min(100 - leftPct, ((end - start) / totalMs) * 100))
  const daysTaken = task.completedAt
    ? daysBetween(task.created, task.completedAt)
    : daysBetween(task.created, now)
  const isDone    = task.status === 'completed'
  const isOverdue = task.due && now > new Date(task.due + 'T23:59:59').getTime() && !isDone

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'12px', padding:'10px 0',
      borderBottom:'1px solid var(--t-border, rgba(255,255,255,0.06))',
    }}>
      {/* task name */}
      <div style={{ width:'200px', flexShrink:0 }}>
        <div style={{ fontSize:'13px', fontWeight:500, color: isDone ? 'var(--t-text3)' : 'var(--t-text1, #f0eff5)',
          textDecoration: isDone ? 'line-through' : 'none',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>{task.title}</div>
        <div style={{ fontSize:'11px', color:'var(--t-text3, #5a5968)', marginTop:'2px' }}>
          {isDone ? `✅ ${daysTaken}d` : isOverdue ? `🚨 ${daysTaken}d pending` : `⏳ ${daysTaken}d`}
        </div>
      </div>

      {/* bar track */}
      <div style={{ flex:1, height:'28px', background:'var(--t-surface3, #252532)', borderRadius:'6px', position:'relative', overflow:'hidden', minWidth:'80px' }}>
        <div style={{
          position:'absolute', top:'4px', bottom:'4px',
          left:`${leftPct}%`, width:`${widthPct}%`,
          borderRadius:'4px',
          background: isDone ? sm.color
            : isOverdue ? '#ff5f6d'
            : sm.color,
          opacity: isDone ? 1 : 0.7,
          transition:'all 0.4s ease',
        }} title={`${fmtDate(start)} → ${fmtDate(end)}`} />
      </div>

      {/* status pill */}
      <div style={{
        flexShrink:0, padding:'2px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:600,
        background: isOverdue ? 'rgba(255,95,109,0.15)' : sm.bg,
        color: isOverdue ? '#ff5f6d' : sm.color,
      }}>
        {isOverdue ? 'Overdue' : sm.label}
      </div>
    </div>
  )
}

export default function TimelinePage({ tasks }) {
  const [sortBy,   setSortBy]   = useState('created')   // created | due | priority
  const [filterSt, setFilterSt] = useState('all')       // all | todo | working | completed | onhold | pending
  const [search,   setSearch]   = useState('')
  const now = Date.now()

  /* ── pending = not completed ── */
  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== 'completed'), [tasks])
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks])

  /* ── filtered + sorted timeline tasks ── */
  const timelineTasks = useMemo(() => {
    let list = [...tasks]
    if (filterSt !== 'all') {
      if (filterSt === 'pending') list = list.filter(t => t.status !== 'completed')
      else list = list.filter(t => t.status === filterSt)
    }
    if (search.trim()) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    list.sort((a, b) => {
      if (sortBy === 'created') return a.created - b.created
      if (sortBy === 'due') {
        if (!a.due && !b.due) return 0
        if (!a.due) return 1
        if (!b.due) return -1
        return new Date(a.due) - new Date(b.due)
      }
      if (sortBy === 'priority') {
        const pOrd = { high:0, medium:1, low:2 }
        return pOrd[a.priority] - pOrd[b.priority]
      }
      return 0
    })
    return list
  }, [tasks, filterSt, sortBy, search])

  /* ── timeline scale ── */
  const { minTs, totalMs } = useMemo(() => {
    if (!timelineTasks.length) return { minTs: now - 7 * DAY, totalMs: 7 * DAY }
    const min = Math.min(...timelineTasks.map(t => t.created))
    const maxTs = Math.max(
      ...timelineTasks.map(t => t.completedAt || (t.due ? new Date(t.due+'T23:59:59').getTime() : now)),
      now
    )
    const pad = Math.max((maxTs - min) * 0.05, DAY)
    return { minTs: min - pad, totalMs: maxTs - min + pad * 2 }
  }, [timelineTasks, now])

  /* ── avg completion time ── */
  const avgCompletionDays = useMemo(() => {
    const done = tasks.filter(t => t.completedAt)
    if (!done.length) return null
    const avg = done.reduce((s, t) => s + daysBetween(t.created, t.completedAt), 0) / done.length
    return avg.toFixed(1)
  }, [tasks])

  const s = {
    page: { color:'var(--t-text1, #f0eff5)' },
    heading: { fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'22px', marginBottom:'6px' },
    sub: { fontSize:'13px', color:'var(--t-text2, #8b8a9b)', marginBottom:'24px' },
    card: {
      background:'var(--t-surface, #16161d)',
      border:'1px solid var(--t-border, rgba(255,255,255,0.07))',
      borderRadius:'20px', padding:'22px', marginBottom:'18px',
    },
    cardTitle: { fontSize:'12px', fontWeight:600, color:'var(--t-text2, #8b8a9b)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'16px' },
    filterBtn: (active) => ({
      padding:'5px 14px', borderRadius:'100px', border:'1px solid',
      borderColor: active ? 'var(--t-accent, #e8a04a)' : 'var(--t-border, rgba(255,255,255,0.07))',
      background: active ? 'rgba(232,160,74,0.12)' : 'transparent',
      color: active ? 'var(--t-accent, #e8a04a)' : 'var(--t-text2, #8b8a9b)',
      fontSize:'12px', fontWeight: active ? 600 : 400, cursor:'pointer', transition:'all 0.15s',
    }),
    sortBtn: (active) => ({
      padding:'4px 12px', borderRadius:'8px', border:'none',
      background: active ? 'var(--t-surface3, #252532)' : 'transparent',
      color: active ? 'var(--t-text1, #f0eff5)' : 'var(--t-text2, #8b8a9b)',
      fontSize:'12px', cursor:'pointer',
    }),
    input: {
      background:'var(--t-surface2, #1e1e28)', border:'1px solid var(--t-border, rgba(255,255,255,0.07))',
      borderRadius:'8px', color:'var(--t-text1, #f0eff5)', padding:'6px 12px', fontSize:'13px',
      outline:'none', width:'180px',
    },
    pendingRow: {
      display:'flex', alignItems:'center', gap:'12px', padding:'11px 0',
      borderBottom:'1px solid var(--t-border, rgba(255,255,255,0.06))',
    },
  }

  return (
    <div style={s.page}>
      <div style={s.heading}>Timeline</div>
      <div style={s.sub}>Track when tasks were created, their deadlines, and how long they took.</div>

      {/* ── SUMMARY CHIPS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:'12px', marginBottom:'22px' }}>
        {[
          { icon:'📋', val: tasks.length,           lbl:'Total tasks',   color: null },
          { icon:'✅', val: completedTasks.length,  lbl:'Completed',     color:'#4ecb83' },
          { icon:'⏳', val: pendingTasks.length,    lbl:'Pending',       color:'#e8a04a' },
          { icon:'⚡', val: avgCompletionDays ?? '—', lbl:'Avg days to complete', color:'#6b7fff' },
        ].map((c,i) => (
          <div key={i} style={{ background:'var(--t-surface, #16161d)', border:'1px solid var(--t-border, rgba(255,255,255,0.07))', borderRadius:'16px', padding:'16px 18px' }}>
            <div style={{ fontSize:'20px', marginBottom:'8px' }}>{c.icon}</div>
            <div style={{ fontSize:'26px', fontWeight:800, fontFamily:'Syne, sans-serif', color: c.color || 'var(--t-text1, #f0eff5)', lineHeight:1 }}>{c.val}</div>
            <div style={{ fontSize:'12px', color:'var(--t-text2, #8b8a9b)', marginTop:'4px' }}>{c.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── TIMELINE CHART ── */}
      <div style={s.card}>
        {/* controls */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
          <div style={s.cardTitle}>Timeline chart</div>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
            <input
              type="text" placeholder="Search tasks…" value={search}
              onChange={e => setSearch(e.target.value)} style={s.input}
            />
            <div style={{ display:'flex', gap:'4px', background:'var(--t-surface2, #1e1e28)', borderRadius:'8px', padding:'3px' }}>
              {['created','due','priority'].map(m => (
                <button key={m} style={s.sortBtn(sortBy === m)} onClick={() => setSortBy(m)}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* filter pills */}
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'16px' }}>
          {['all','todo','working','completed','onhold','pending'].map(f => (
            <button key={f} style={s.filterBtn(filterSt === f)} onClick={() => setFilterSt(f)}>
              {f === 'all' ? 'All' : f === 'pending' ? 'Pending only' : STATUS_META[f]?.label || f}
            </button>
          ))}
        </div>

        {/* date scale labels */}
        {timelineTasks.length > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px', paddingLeft:'212px' }}>
            <span style={{ fontSize:'10px', color:'var(--t-text3, #5a5968)' }}>{fmtDate(minTs)}</span>
            <span style={{ fontSize:'10px', color:'var(--t-text3, #5a5968)' }}>{fmtDate(minTs + totalMs)}</span>
          </div>
        )}

        {/* bars */}
        {timelineTasks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--t-text3, #5a5968)', fontSize:'14px' }}>
            No tasks match this filter.
          </div>
        ) : (
          <div style={{ maxHeight:'420px', overflowY:'auto' }}>
            {timelineTasks.map(t => (
              <TimelineBar key={t.id} task={t} minTs={minTs} totalMs={totalMs} />
            ))}
          </div>
        )}
      </div>

      {/* ── PENDING TASKS LIST ── */}
      <div style={s.card}>
        <div style={s.cardTitle}>All pending tasks ({pendingTasks.length})</div>
        {pendingTasks.length === 0 ? (
          <div style={{ color:'var(--t-text3)', fontSize:'13px', padding:'12px 0' }}>All tasks are completed! 🎉</div>
        ) : (
          pendingTasks
            .sort((a,b) => {
              if (!a.due && !b.due) return 0
              if (!a.due) return 1
              if (!b.due) return -1
              return new Date(a.due) - new Date(b.due)
            })
            .map(t => {
              const sm = STATUS_META[t.status]
              const daysOld = daysBetween(t.created, now)
              const dueTs = t.due ? new Date(t.due + 'T23:59:59').getTime() : null
              const isOverdue = dueTs && now > dueTs
              const daysUntilDue = dueTs ? Math.floor((dueTs - now) / DAY) : null

              return (
                <div key={t.id} style={s.pendingRow}>
                  {/* status dot */}
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:sm.color, flexShrink:0 }} />

                  {/* title */}
                  <span style={{ flex:1, fontSize:'13px', color:'var(--t-text1, #f0eff5)', minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {t.title}
                  </span>

                  {/* age */}
                  <span style={{ fontSize:'11px', color:'var(--t-text3)', whiteSpace:'nowrap', flexShrink:0 }}>
                    {daysOld === 0 ? 'Created today' : `${daysOld}d old`}
                  </span>

                  {/* due */}
                  {dueTs && (
                    <span style={{
                      fontSize:'11px', padding:'2px 8px', borderRadius:'20px', flexShrink:0,
                      background: isOverdue ? 'rgba(255,95,109,0.15)' : daysUntilDue <= 2 ? 'rgba(232,160,74,0.15)' : 'var(--t-surface3, #252532)',
                      color: isOverdue ? '#ff5f6d' : daysUntilDue <= 2 ? '#e8a04a' : 'var(--t-text3)',
                    }}>
                      {isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : daysUntilDue === 0 ? 'Due today' : `${daysUntilDue}d left`}
                    </span>
                  )}

                  {/* priority */}
                  <span style={{
                    fontSize:'11px', padding:'2px 8px', borderRadius:'20px', flexShrink:0, fontWeight:600,
                    background:`${PRI_COLOR[t.priority]}20`, color:PRI_COLOR[t.priority],
                  }}>
                    {t.priority}
                  </span>

                  {/* status */}
                  <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'20px', flexShrink:0, background:sm.bg, color:sm.color }}>
                    {sm.label}
                  </span>
                </div>
              )
            })
        )}
      </div>

      {/* ── COMPLETED TASKS ── */}
      {completedTasks.length > 0 && (
        <div style={s.card}>
          <div style={s.cardTitle}>Completed tasks ({completedTasks.length})</div>
          {completedTasks.map(t => {
            const daysTaken = t.completedAt ? daysBetween(t.created, t.completedAt) : '—'
            return (
              <div key={t.id} style={s.pendingRow}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#4ecb83', flexShrink:0 }} />
                <span style={{ flex:1, fontSize:'13px', color:'var(--t-text3, #5a5968)', textDecoration:'line-through', minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {t.title}
                </span>
                <span style={{ fontSize:'11px', color:'var(--t-text3)', whiteSpace:'nowrap', flexShrink:0 }}>
                  Created {fmtDate(t.created)}
                </span>
                {t.completedAt && (
                  <span style={{ fontSize:'11px', color:'#4ecb83', whiteSpace:'nowrap', flexShrink:0 }}>
                    ✅ {fmtDate(t.completedAt)}
                  </span>
                )}
                <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'20px', background:'rgba(78,203,131,0.12)', color:'#4ecb83', flexShrink:0 }}>
                  {daysTaken}d
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
