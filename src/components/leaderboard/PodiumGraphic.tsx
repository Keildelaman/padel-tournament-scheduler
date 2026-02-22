import type { LeaderboardEntry } from '../../types'

interface PodiumGraphicProps {
  top3: LeaderboardEntry[]
}

export function PodiumGraphic({ top3 }: PodiumGraphicProps) {
  if (top3.length < 3) return null

  const podiumData = [
    { entry: top3[1], place: 2, color: '#9ca3af', height: 60, x: 20 },
    { entry: top3[0], place: 1, color: '#f59e0b', height: 80, x: 95 },
    { entry: top3[2], place: 3, color: '#b45309', height: 45, x: 170 },
  ]

  return (
    <svg viewBox="0 0 260 140" className="w-full max-w-sm mx-auto" preserveAspectRatio="xMidYMid meet">
      {podiumData.map(({ entry, place, color, height, x }) => {
        const blockY = 140 - height
        const nameY = blockY - 8
        return (
          <g key={place}>
            {/* Podium block */}
            <rect x={x} y={blockY} width={70} height={height} rx={4} fill={color} fillOpacity={0.3} stroke={color} strokeWidth="2" />
            {/* Place number */}
            <text x={x + 35} y={blockY + height / 2 + 6} textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>
              {place}
            </text>
            {/* Name */}
            <text x={x + 35} y={nameY} textAnchor="middle" fontSize="11" fontWeight="600" fill="#e2e8f0">
              {entry.playerName.length > 10 ? entry.playerName.slice(0, 9) + '..' : entry.playerName}
            </text>
            {/* Points */}
            <text x={x + 35} y={nameY - 14} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {entry.points} pts
            </text>
          </g>
        )
      })}
    </svg>
  )
}
