import type { ReactNode } from 'react'

type BadgeColor = 'gray' | 'green' | 'blue' | 'red' | 'yellow' | 'gold' | 'silver' | 'bronze'

const colorClasses: Record<BadgeColor, string> = {
  gray: 'bg-gray-700/50 text-gray-300 ring-1 ring-gray-600/30',
  green: 'bg-emerald-900/50 text-emerald-400 ring-1 ring-emerald-600/30',
  blue: 'bg-blue-900/50 text-blue-400 ring-1 ring-blue-600/30',
  red: 'bg-red-900/50 text-red-400 ring-1 ring-red-600/30',
  yellow: 'bg-amber-900/50 text-amber-300 ring-1 ring-amber-600/30',
  gold: 'bg-amber-900/60 text-accent-light ring-1 ring-accent-muted/40',
  silver: 'bg-gray-600/50 text-gray-200 ring-1 ring-gray-500/30',
  bronze: 'bg-orange-900/50 text-orange-400 ring-1 ring-orange-600/30',
}

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  className?: string
}

export function Badge({ children, color = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  )
}
