import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-surface/70 backdrop-blur-sm rounded-xl shadow-lg shadow-black/30 border border-border/60 ring-1 ring-white/[0.03] transition-shadow ${padding ? 'p-4 sm:p-6' : ''} ${className}`}>
      {children}
    </div>
  )
}
