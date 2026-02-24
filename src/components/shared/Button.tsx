import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'destructive'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-primary to-primary-light text-white hover:from-primary-light hover:to-[#18d47e] shadow-lg shadow-primary/30 hover:shadow-primary-light/40',
  secondary: 'bg-surface-alt/80 text-text border border-border hover:bg-[#2a3a30] hover:border-primary/30',
  destructive: 'bg-red-700 text-white hover:bg-red-600 shadow-lg shadow-red-900/30',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

export function Button({ variant = 'primary', fullWidth, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
