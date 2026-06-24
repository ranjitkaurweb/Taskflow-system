import React, { useState, useRef } from 'react'
import TaskCard from './TaskCard'

const EMPTY_META = {
  todo:      { icon: '📋', text: 'No tasks yet',        sub: 'Add a task below to get started' },
  working:   { icon: '⚡', text: 'Nothing in progress',  sub: 'Move a task here to start working' },
  completed: { icon: '✅', text: 'Nothing completed',    sub: 'Completed tasks will appear here' },
  onhold:    { icon: '⏸️', text: 'Nothing on hold',      sub: 'Paused tasks will appear here' },
}

export default function Column({
  status, meta, tasks,
  draggingId, isDragOver,
  onMouseDragStart,
  onTouchDragStart, onTouchDragEnd,
  onTouchMove, onTouchDrop,
  onAdd, onDelete, onEdit, onView,
  commentCounts = {}, onMarkCommentRead,
}) {
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef(null)
  const empty = EMPTY_META[status] || EMPTY_META.todo

  const handleAdd = () => {
    if (inputVal.trim()) { onAdd(inputVal.trim()); setInputVal('') }
    else inputRef.current?.focus()
  }

  return (
    <div
      data-status={status}
      className={`bg-surface border rounded-[20px] p-5 transition-all duration-200
        ${isDragOver
          ? 'border-accent shadow-[0_0_0_1px_rgba(232,160,74,0.3),0_8px_30px_rgba(0,0,0,0.5)] bg-surface2'
          : 'border-white/[0.07] hover:border-white/[0.14]'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-[18px]" data-status={status}>
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} data-status={status} />
        <h2 className="font-display font-bold text-[0.95rem] text-text1 flex-1" data-status={status}>{meta.label}</h2>
        <span className="bg-surface3 text-text2 text-[0.7rem] font-semibold px-2 py-0.5 rounded-full" data-status={status}>
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <ul
        data-status={status}
        className="flex flex-col gap-2.5 mb-3.5 min-h-[80px] max-h-[calc(100vh-400px)] overflow-y-auto pr-0.5"
      >
        {tasks.length === 0 && !isDragOver ? (
          <li
            data-status={status}
            style={{
              listStyle: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: '120px', padding: '20px 16px',
              borderRadius: '12px',
              border: '1.5px dashed rgba(255,255,255,0.08)',
              textAlign: 'center', gap: '6px',
            }}
          >
            <span style={{ fontSize: '26px', opacity: 0.35, lineHeight: 1 }}>{empty.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t-text2)', fontFamily: 'DM Sans, sans-serif' }}>{empty.text}</span>
            <span style={{ fontSize: '11px', color: 'var(--t-text3)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>{empty.sub}</span>
          </li>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isDragging={draggingId === task.id}
              onMouseDragStart={onMouseDragStart}
              onTouchDragStart={onTouchDragStart}
              onTouchDragEnd={onTouchDragEnd}
              onTouchMove={onTouchMove}
              onTouchDrop={onTouchDrop}
              onDelete={() => onDelete(task.id)}
              onEdit={(updates) => onEdit(task.id, updates)}
              commentCount={commentCounts[task.id] || 0}
              onMarkCommentRead={onMarkCommentRead}
              employeeName={task.employeeName || ''}
              onView={onView}
            />
          ))
        )}
        {isDragOver && draggingId && (
          <li className="drop-ghost" aria-hidden="true" data-status={status} />
        )}
      </ul>

      {/* Add row */}
      <div className="flex gap-2 items-center" data-status={status}>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a task…"
          className="flex-1 bg-surface3 border border-white/[0.07] rounded-lg
            text-text1 text-[0.84rem] px-3 py-2 outline-none font-body placeholder:text-text3
            focus:border-accent focus:bg-surface2 focus:shadow-[0_0_0_3px_rgba(232,160,74,0.12)]
            transition-all duration-200"
        />
        <button
          onClick={handleAdd}
          className="w-[34px] h-[34px] rounded-lg bg-[rgba(232,160,74,0.12)] border border-[rgba(232,160,74,0.2)]
            text-accent flex-shrink-0 flex items-center justify-center cursor-pointer
            hover:bg-accent hover:text-[#1a1000] hover:shadow-accent transition-all duration-200"
          title="Add task"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
