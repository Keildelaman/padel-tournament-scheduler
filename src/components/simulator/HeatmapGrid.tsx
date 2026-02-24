import { useState } from 'react'

interface HeatmapGridProps {
  matrix: number[][]
  labels: string[]
  colorLow: string
  colorHigh: string
  title: string
}

export function HeatmapGrid({ matrix, labels, colorLow, colorHigh, title }: HeatmapGridProps) {
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null)
  const n = labels.length
  const maxVal = Math.max(1, ...matrix.flat())

  const cellColor = (val: number): string => {
    if (val === 0) return '#161e1a'
    const t = val / maxVal
    return interpolateColor(colorLow, colorHigh, t)
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-text mb-2">{title}</h4>
      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-px"
          style={{
            gridTemplateColumns: `auto repeat(${n}, minmax(28px, 1fr))`,
            gridTemplateRows: `auto repeat(${n}, minmax(28px, 1fr))`,
          }}
        >
          {/* Empty corner */}
          <div />
          {/* Column headers */}
          {labels.map((l, i) => (
            <div key={`ch-${i}`} className="text-[10px] text-text-muted text-center font-medium truncate px-0.5">
              {l.slice(0, 3)}
            </div>
          ))}
          {/* Rows */}
          {labels.map((rowLabel, i) => (
            <>
              <div key={`rh-${i}`} className="text-[10px] text-text-muted text-right pr-1 font-medium flex items-center justify-end">
                {rowLabel.slice(0, 5)}
              </div>
              {labels.map((colLabel, j) => {
                const val = i === j ? 0 : matrix[i][j]
                return (
                  <div
                    key={`c-${i}-${j}`}
                    className="rounded-sm flex items-center justify-center text-[10px] font-medium cursor-default relative"
                    style={{
                      backgroundColor: i === j ? '#1e2b24' : cellColor(val),
                      color: val > maxVal * 0.6 ? 'white' : '#e8ece9',
                      minWidth: 28,
                      minHeight: 28,
                    }}
                    onMouseEnter={(e) => {
                      if (i !== j) {
                        setTooltip({ label: `${rowLabel} & ${colLabel}: ${val}`, x: e.clientX, y: e.clientY })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {i === j ? '-' : val}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  )
}

function interpolateColor(low: string, high: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const [r1, g1, b1] = parse(low)
  const [r2, g2, b2] = parse(high)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}
