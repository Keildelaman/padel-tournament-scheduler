import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../../i18n'
import { DEFAULT_TARGET_SCORE } from '../../constants'
import type { MatchAssignment, ScoringConfig } from '../../types'

interface CourtCardProps {
  match: MatchAssignment
  scoringConfig: ScoringConfig
  playerNames: Record<string, string>
  courtLabel: string
  onSetScore: (score1: number, score2: number) => void
  onSetWinner: (winner: 1 | 2) => void
  onClearScore: () => void
  disabled?: boolean
}

export function CourtCard({
  match, scoringConfig, playerNames, courtLabel,
  onSetScore, onSetWinner, onClearScore, disabled,
}: CourtCardProps) {
  const team1Name1 = playerNames[match.team1[0]] ?? '?'
  const team1Name2 = playerNames[match.team1[1]] ?? '?'
  const team2Name1 = playerNames[match.team2[0]] ?? '?'
  const team2Name2 = playerNames[match.team2[1]] ?? '?'

  if (scoringConfig.mode === 'winloss') {
    return (
      <WinLossCourtLayout
        team1Name1={team1Name1}
        team1Name2={team1Name2}
        team2Name1={team2Name1}
        team2Name2={team2Name2}
        courtLabel={courtLabel}
        winner={match.winner}
        onSetWinner={onSetWinner}
        onClearScore={onClearScore}
        disabled={disabled}
      />
    )
  }

  if (scoringConfig.mode === 'pointsToWin' || scoringConfig.mode === 'timed') {
    const pickerMax = scoringConfig.mode === 'pointsToWin'
      ? (scoringConfig.targetScore ?? DEFAULT_TARGET_SCORE)
      : 50
    return (
      <IndependentScoreCourtLayout
        team1Name1={team1Name1}
        team1Name2={team1Name2}
        team2Name1={team2Name1}
        team2Name2={team2Name2}
        courtLabel={courtLabel}
        score1={match.score1}
        score2={match.score2}
        pickerMax={pickerMax}
        onSetScore={onSetScore}
        onClearScore={onClearScore}
        disabled={disabled}
      />
    )
  }

  return (
    <PointsCourtLayout
      team1Name1={team1Name1}
      team1Name2={team1Name2}
      team2Name1={team2Name1}
      team2Name2={team2Name2}
      courtLabel={courtLabel}
      score1={match.score1}
      score2={match.score2}
      max={scoringConfig.pointsPerMatch}
      onSetScore={onSetScore}
      onClearScore={onClearScore}
      disabled={disabled}
    />
  )
}

/* ─── Horizontal SVG Court Background ─── */

function CourtBackground({ courtLabel }: { courtLabel: string }) {
  return (
    <svg viewBox="0 0 300 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      {/* Court surface — padel green */}
      <rect x="0" y="0" width="300" height="200" rx="8" fill="#1a6b3c" />

      {/* Team 1 half (left) - blue tint */}
      <rect x="0" y="0" width="150" height="200" rx="8" fill="#1a73e8" fillOpacity="0.20" />

      {/* Team 2 half (right) - red tint */}
      <rect x="150" y="0" width="150" height="200" rx="8" fill="#e53935" fillOpacity="0.18" />

      {/* Net line (vertical center, dashed) */}
      <line x1="150" y1="6" x2="150" y2="194" stroke="white" strokeWidth="2" strokeDasharray="6 4" />

      {/* Left service line (vertical) */}
      <line x1="80" y1="6" x2="80" y2="194" stroke="white" strokeWidth="1" strokeOpacity="0.4" />

      {/* Right service line (vertical) */}
      <line x1="220" y1="6" x2="220" y2="194" stroke="white" strokeWidth="1" strokeOpacity="0.4" />

      {/* Center service divider (horizontal, service area only) */}
      <line x1="80" y1="100" x2="220" y2="100" stroke="white" strokeWidth="1" strokeOpacity="0.4" />

      {/* Court border */}
      <rect x="6" y="6" width="288" height="188" rx="4" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />

      {/* Corner brackets */}
      <path d="M12 12 L12 24 M12 12 L24 12" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
      <path d="M288 12 L288 24 M288 12 L276 12" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
      <path d="M12 188 L12 176 M12 188 L24 188" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
      <path d="M288 188 L288 176 M288 188 L276 188" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>

      {/* Court label background pill */}
      <rect x="110" y="6" width="80" height="22" rx="4" fill="black" fillOpacity="0.40" />
      {/* Court label */}
      <text x="150" y="22" textAnchor="middle" fill="white" fontWeight="bold" fontSize="16" letterSpacing="0.5" style={{ pointerEvents: 'none' }}>{courtLabel}</text>
    </svg>
  )
}

/* ─── Win/Loss Layout ─── */

function WinLossCourtLayout({
  team1Name1, team1Name2, team2Name1, team2Name2,
  courtLabel, winner, onSetWinner, onClearScore, disabled,
}: {
  team1Name1: string; team1Name2: string
  team2Name1: string; team2Name2: string
  courtLabel: string
  winner?: 1 | 2
  onSetWinner: (winner: 1 | 2) => void
  onClearScore: () => void
  disabled?: boolean
}) {
  const { t } = useT()

  const handleClick = (team: 1 | 2) => {
    if (disabled) return
    if (winner === team) {
      onClearScore()
    } else {
      onSetWinner(team)
    }
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg shadow-primary/10 ring-1 ring-white/10" style={{ aspectRatio: '300 / 200' }}>
      <CourtBackground courtLabel={courtLabel} />

      {/* Overlay: two clickable halves */}
      <div className="absolute inset-0 flex">
        {/* Team 1 (blue) */}
        <button
          type="button"
          onClick={() => handleClick(1)}
          disabled={disabled}
          className={`flex-1 flex flex-col items-center justify-around transition-colors rounded-l-lg ${
            winner === 1
              ? 'bg-white/30'
              : 'hover:bg-white/10'
          } disabled:cursor-not-allowed`}
        >
          <PlayerPill name={team1Name1} color="blue" />
          {winner === 1 && <span className="text-[11px] font-bold text-white bg-team-blue/80 px-2 py-0.5 rounded-full">{t('court.win')}</span>}
          <PlayerPill name={team1Name2} color="blue" />
        </button>

        {/* Team 2 (red) */}
        <button
          type="button"
          onClick={() => handleClick(2)}
          disabled={disabled}
          className={`flex-1 flex flex-col items-center justify-around transition-colors rounded-r-lg ${
            winner === 2
              ? 'bg-white/30'
              : 'hover:bg-white/10'
          } disabled:cursor-not-allowed`}
        >
          <PlayerPill name={team2Name1} color="red" />
          {winner === 2 && <span className="text-[11px] font-bold text-white bg-team-red/80 px-2 py-0.5 rounded-full">{t('court.win')}</span>}
          <PlayerPill name={team2Name2} color="red" />
        </button>
      </div>
    </div>
  )
}

/* ─── Points Layout ─── */

function PointsCourtLayout({
  team1Name1, team1Name2, team2Name1, team2Name2,
  courtLabel, score1, score2, max,
  onSetScore, onClearScore, disabled,
}: {
  team1Name1: string; team1Name2: string
  team2Name1: string; team2Name2: string
  courtLabel: string
  score1?: number; score2?: number
  max: number
  onSetScore: (score1: number, score2: number) => void
  onClearScore: () => void
  disabled?: boolean
}) {
  const [text1, setText1] = useState(score1 != null ? String(score1) : '')
  const [text2, setText2] = useState(score2 != null ? String(score2) : '')

  useEffect(() => {
    setText1(score1 != null ? String(score1) : '')
    setText2(score2 != null ? String(score2) : '')
  }, [score1, score2])

  const handleChange1 = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '')
    if (digits === '') {
      setText1('')
      setText2('')
      onClearScore()
      return
    }
    const s1 = Math.max(0, Math.min(max, parseInt(digits, 10)))
    const s2 = max - s1
    setText1(String(s1))
    onSetScore(s1, s2)
  }

  const handleChange2 = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '')
    if (digits === '') {
      setText1('')
      setText2('')
      onClearScore()
      return
    }
    const s2 = Math.max(0, Math.min(max, parseInt(digits, 10)))
    const s1 = max - s2
    setText2(String(s2))
    onSetScore(s1, s2)
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg shadow-primary/10 ring-1 ring-white/10" style={{ aspectRatio: '300 / 200' }}>
      <CourtBackground courtLabel={courtLabel} />

      {/* Overlay: players + score */}
      <div className="absolute inset-0 flex">
        {/* Team 1 (left): names spread vertically, score centered near net */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="flex flex-col items-center justify-around h-full">
            <PlayerPill name={team1Name1} color="blue" />
            <PlayerPill name={team1Name2} color="blue" />
          </div>
          <ScoreInput
            value={text1}
            max={max}
            color="blue"
            disabled={disabled}
            onChange={handleChange1}
            onSelect={s1 => { onSetScore(s1, max - s1) }}
            onClear={onClearScore}
          />
        </div>

        {/* Team 2 (right): score centered near net, names spread vertically */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <ScoreInput
            value={text2}
            max={max}
            color="red"
            disabled={disabled}
            onChange={handleChange2}
            onSelect={s2 => { onSetScore(max - s2, s2) }}
            onClear={onClearScore}
          />
          <div className="flex flex-col items-center justify-around h-full">
            <PlayerPill name={team2Name1} color="red" />
            <PlayerPill name={team2Name2} color="red" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Independent Score Layout (pointsToWin / timed) ─── */

function IndependentScoreCourtLayout({
  team1Name1, team1Name2, team2Name1, team2Name2,
  courtLabel, score1, score2, pickerMax,
  onSetScore, onClearScore, disabled,
}: {
  team1Name1: string; team1Name2: string
  team2Name1: string; team2Name2: string
  courtLabel: string
  score1?: number; score2?: number
  pickerMax: number
  onSetScore: (score1: number, score2: number) => void
  onClearScore: () => void
  disabled?: boolean
}) {
  const [text1, setText1] = useState(score1 != null ? String(score1) : '')
  const [text2, setText2] = useState(score2 != null ? String(score2) : '')

  useEffect(() => {
    setText1(score1 != null ? String(score1) : '')
    setText2(score2 != null ? String(score2) : '')
  }, [score1, score2])

  const handleChange1 = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '')
    if (digits === '') {
      setText1('')
      setText2('')
      onClearScore()
      return
    }
    const s1 = Math.max(0, parseInt(digits, 10))
    setText1(String(s1))
    onSetScore(s1, score2 ?? 0)
  }

  const handleChange2 = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '')
    if (digits === '') {
      setText1('')
      setText2('')
      onClearScore()
      return
    }
    const s2 = Math.max(0, parseInt(digits, 10))
    setText2(String(s2))
    onSetScore(score1 ?? 0, s2)
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg shadow-primary/10 ring-1 ring-white/10" style={{ aspectRatio: '300 / 200' }}>
      <CourtBackground courtLabel={courtLabel} />

      <div className="absolute inset-0 flex">
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="flex flex-col items-center justify-around h-full">
            <PlayerPill name={team1Name1} color="blue" />
            <PlayerPill name={team1Name2} color="blue" />
          </div>
          <ScoreInput
            value={text1}
            max={pickerMax}
            color="blue"
            disabled={disabled}
            onChange={handleChange1}
            onSelect={s1 => { onSetScore(s1, score2 ?? 0) }}
            onClear={onClearScore}
          />
        </div>

        <div className="flex-1 flex items-center justify-center gap-2">
          <ScoreInput
            value={text2}
            max={pickerMax}
            color="red"
            disabled={disabled}
            onChange={handleChange2}
            onSelect={s2 => { onSetScore(score1 ?? 0, s2) }}
            onClear={onClearScore}
          />
          <div className="flex flex-col items-center justify-around h-full">
            <PlayerPill name={team2Name1} color="red" />
            <PlayerPill name={team2Name2} color="red" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Score Input with Number Picker ─── */

function ScoreInput({ value, max, color, disabled, onChange, onSelect, onClear }: {
  value: string
  max: number
  color: 'blue' | 'red'
  disabled?: boolean
  onChange: (raw: string) => void
  onSelect: (n: number) => void
  onClear: () => void
}) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePos = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left + rect.width / 2 })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePos()
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (inputRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const handleScroll = () => updatePos()
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, updatePos])

  const textColor = color === 'blue' ? 'text-team-blue' : 'text-team-red'
  const currentNum = value === '' ? null : parseInt(value, 10)

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => !disabled && setOpen(true)}
        disabled={disabled}
        placeholder="–"
        className={`w-10 h-8 border-2 border-white/60 rounded text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 bg-white/95 cursor-pointer hover:bg-white hover:border-white hover:shadow-lg transition-all ${textColor}`}
      />
      {open && !disabled && createPortal(
        <div
          ref={panelRef}
          className="fixed z-50 bg-surface/95 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/40 border border-border/60 ring-1 ring-white/[0.05] p-2 w-max max-w-48 -translate-x-1/2"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: max + 1 }, (_, n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  onSelect(n)
                  setOpen(false)
                }}
                className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                  currentNum === n
                    ? color === 'blue'
                      ? 'bg-team-blue text-white'
                      : 'bg-team-red text-white'
                    : 'bg-surface-alt text-text hover:bg-gray-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {currentNum != null && (
            <button
              type="button"
              onClick={() => {
                onClear()
                setOpen(false)
              }}
              className="mt-1.5 w-full text-xs text-text-muted hover:text-red-400 py-1"
            >
              {t('court.clear')}
            </button>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}

/* ─── Player Pill ─── */

function PlayerPill({ name, color }: { name: string; color: 'blue' | 'red' }) {
  const colors = color === 'blue'
    ? 'border-team-blue text-team-blue'
    : 'border-team-red text-team-red'

  return (
    <span className={`inline-block px-3 py-1 bg-white/95 rounded-full border-2 text-sm font-semibold shadow-md ${colors}`}>
      {name}
    </span>
  )
}
