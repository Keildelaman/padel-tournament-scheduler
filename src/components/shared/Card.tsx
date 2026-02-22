import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-surface rounded-xl shadow-lg shadow-black/20 border border-border transition-shadow ${padding ? 'p-4 sm:p-6' : ''} ${className}`}>
      {children}
    </div>
  )
}
