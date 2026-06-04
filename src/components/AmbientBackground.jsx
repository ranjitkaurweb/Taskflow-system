import React from 'react'

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Blue-violet orb — top left */}
      <div
        className="ambient-orb w-[600px] h-[600px] -top-48 -left-48"
        style={{
          background: 'radial-gradient(circle, #6b7fff, transparent 70%)',
          animationDelay: '0s',
        }}
      />
      {/* Amber orb — top right */}
      <div
        className="ambient-orb w-[500px] h-[500px] top-[20%] -right-36"
        style={{
          background: 'radial-gradient(circle, #e8a04a, transparent 70%)',
          animationDelay: '-4s',
        }}
      />
      {/* Green orb — bottom center */}
      <div
        className="ambient-orb w-[400px] h-[400px] -bottom-24 left-[40%]"
        style={{
          background: 'radial-gradient(circle, #4ecb83, transparent 70%)',
          animationDelay: '-8s',
        }}
      />
    </div>
  )
}
