import { useState, useEffect, useRef } from 'react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  className?: string
}

export function NumberInput({ value, onChange, min, max, label, className = '' }: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(String(value))
  const isFocusedRef = useRef(false)

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDisplayValue(String(value))
    }
  }, [value])

  const clamp = (v: number) => {
    if (min != null && v < min) return min
    if (max != null && v > max) return max
    return v
  }

  const decrement = () => {
    if (min != null && value <= min) return
    onChange(value - 1)
  }

  const increment = () => {
    if (max != null && value >= max) return
    onChange(value + 1)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setDisplayValue(raw)
    if (raw === '') return
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed)) onChange(clamp(parsed))
  }

  const handleFocus = () => {
    isFocusedRef.current = true
  }

  const handleBlur = () => {
    isFocusedRef.current = false
    const clamped = clamp(displayValue === '' ? (min ?? 0) : value)
    onChange(clamped)
    setDisplayValue(String(clamped))
  }

  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-text mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={min != null && value <= min}
          className="w-10 h-10 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-lg font-bold text-text hover:bg-[#2a3a30] hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          -
        </button>
        <input
          type="number"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          min={min}
          max={max}
          className="w-16 h-10 text-center text-lg font-semibold tabular-nums border border-border rounded-lg bg-surface-input text-text focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={increment}
          disabled={max != null && value >= max}
          className="w-10 h-10 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-lg font-bold text-text hover:bg-[#2a3a30] hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}
