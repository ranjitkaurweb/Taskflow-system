import React, { useState, useRef } from 'react'
import TaskCard from './TaskCard'

export default function Column({
  status, meta, tasks,
  draggingId, isDragOver,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onTouchMove, onTouchDrop,
  onAdd, onDelete, onEdit, onView,
}) {
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef(null)

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
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={e => { e.preventDefault(); onDrop() }}
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
      <ul data-status={status}
        className="flex flex-col gap-2.5 mb-3.5 min-h-[80px] max-h-[calc(100vh-400px)] overflow-y-auto pr-0.5">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            isDragging={draggingId === task.id}
            onDragStart={() => onDragStart(task.id)}
            onDragEnd={onDragEnd}
            onTouchMove={onTouchMove}
            onTouchDrop={onTouchDrop}
            onDelete={() => onDelete(task.id)}
            onEdit={(newTitle) => onEdit(task.id, newTitle)}
            onView={onView}
          />
        ))}
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
        <button onClick={handleAdd}
          className="w-[34px] h-[34px] rounded-lg bg-[rgba(232,160,74,0.12)] border border-[rgba(232,160,74,0.2)]
            text-accent flex-shrink-0 flex items-center justify-center cursor-pointer
            hover:bg-accent hover:text-[#1a1000] hover:shadow-accent transition-all duration-200"
          title="Add task">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
