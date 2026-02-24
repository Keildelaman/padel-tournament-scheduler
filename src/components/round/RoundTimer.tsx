import { useState, useEffect, useRef, useCallback } from 'react'
import { useT } from '../../i18n'

interface RoundTimerProps {
  durationMinutes: number
  roundNumber: number
  disabled?: boolean
}

export function RoundTimer({ durationMinutes, roundNumber, disabled }: RoundTimerProps) {
  const { t } = useT()
  const totalMs = durationMinutes * 60 * 1000
  const [remainingMs, setRemainingMs] = useState(totalMs)
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle')
  const endTimeRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  // Reset timer when round changes
  useEffect(() => {
    clearInterval(intervalRef.current)
    setRemainingMs(totalMs)
    setTimerState('idle')
  }, [roundNumber, totalMs])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  const tick = useCallback(() => {
    const remaining = endTimeRef.current - Date.now()
    if (remaining <= 0) {
      setRemainingMs(0)
      setTimerState('finished')
      clearInterval(intervalRef.current)
    } else {
      setRemainingMs(remaining)
    }
  }, [])

  const handleStart = () => {
    endTimeRef.current = Date.now() + remainingMs
    setTimerState('running')
    intervalRef.current = setInterval(tick, 200)
  }

  const handlePause = () => {
    clearInterval(intervalRef.current)
    setRemainingMs(endTimeRef.current - Date.now())
    setTimerState('paused')
  }

  const handleResume = () => {
    endTimeRef.current = Date.now() + remainingMs
    setTimerState('running')
    intervalRef.current = setInterval(tick, 200)
  }

  const handleReset = () => {
    clearInterval(intervalRef.current)
    setRemainingMs(totalMs)
    setTimerState('idle')
  }

  const totalSeconds = Math.ceil(remainingMs / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const isFinished = timerState === 'finished'

  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={`font-mono text-2xl font-bold tabular-nums ${
          isFinished ? 'text-red-400 animate-pulse' : 'text-text'
        }`}
      >
        {display}
      </span>

      {isFinished && (
        <span className="text-sm text-red-400 font-medium">{t('timer.finished')}</span>
      )}

      <div className="flex gap-1.5">
        {timerState === 'idle' && (
          <TimerButton onClick={handleStart} disabled={disabled}>
            {t('timer.start')}
          </TimerButton>
        )}
        {timerState === 'running' && (
          <TimerButton onClick={handlePause}>
            {t('timer.pause')}
          </TimerButton>
        )}
        {timerState === 'paused' && (
          <>
            <TimerButton onClick={handleResume}>
              {t('timer.resume')}
            </TimerButton>
            <TimerButton onClick={handleReset} variant="secondary">
              {t('timer.reset')}
            </TimerButton>
          </>
        )}
        {isFinished && (
          <TimerButton onClick={handleReset} variant="secondary">
            {t('timer.reset')}
          </TimerButton>
        )}
      </div>
    </div>
  )
}

function TimerButton({ children, onClick, disabled, variant = 'primary' }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        variant === 'primary'
          ? 'bg-primary text-white hover:bg-primary-light'
          : 'bg-surface-alt text-text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}
