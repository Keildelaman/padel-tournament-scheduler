import type { ReactNode } from 'react'

type BadgeColor = 'gray' | 'green' | 'blue' | 'red' | 'yellow' | 'gold' | 'silver' | 'bronze'

const colorClasses: Record<BadgeColor, string> = {
  gray: 'bg-gray-700/50 text-gray-300',
  green: 'bg-green-900/60 text-green-400',
  blue: 'bg-blue-900/60 text-blue-400',
  red: 'bg-red-900/60 text-red-400',
  yellow: 'bg-yellow-900/60 text-yellow-400',
  gold: 'bg-amber-900/60 text-amber-300',
  silver: 'bg-gray-600/60 text-gray-200',
  bronze: 'bg-orange-900/60 text-orange-400',
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
