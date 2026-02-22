interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  className?: string
}

export function NumberInput({ value, onChange, min, max, label, className = '' }: NumberInputProps) {
  const decrement = () => {
    if (min != null && value <= min) return
    onChange(value - 1)
  }

  const increment = () => {
    if (max != null && value >= max) return
    onChange(value + 1)
  }

  const clamp = (v: number) => {
    if (min != null && v < min) return min
    if (max != null && v > max) return max
    return v
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') return
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed)) onChange(clamp(parsed))
  }

  const handleBlur = () => {
    onChange(clamp(value))
  }

  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-text mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={min != null && value <= min}
          className="w-10 h-10 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-lg font-bold text-text hover:bg-[#475569] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          -
        </button>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          className="w-16 h-10 text-center text-lg font-semibold tabular-nums border border-border rounded-lg bg-surface-input text-text focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={increment}
          disabled={max != null && value >= max}
          className="w-10 h-10 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-lg font-bold text-text hover:bg-[#475569] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  )
}
