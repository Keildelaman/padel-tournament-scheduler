import { useState } from 'react'
import { useScout } from '../scout/useScout'
import type { ScoutTeam, ScoutPlayer, PlayerProfile } from '../scout/types'
import { getPlayerProfileUrl, getTournamentUrl } from '../scout/api'
import { useT } from '../i18n'

export function ScoutPage() {
  const { t } = useT()
  const { tournament, profile, loadingState, search, loadTournament, backToProfile, clear } = useScout()
  const [input, setInput] = useState('')
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)

  const isLoading = loadingState.phase !== 'idle' && loadingState.phase !== 'done' && loadingState.phase !== 'error'

  const handleSearch = () => {
    if (input.trim()) search(input.trim())
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-accent-light">{t('scout.title')}</h2>
      <p className="text-text-muted text-sm">{t('scout.description')}</p>

      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder={t('scout.placeholder')}
          className="flex-1 px-3 py-2 rounded-lg bg-surface-input border border-border text-text placeholder:text-text-muted/50 focus:border-border-focus focus:outline-none transition-colors"
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? t('scout.loading') : t('scout.loadBtn')}
        </button>
        {(tournament || profile) && (
          <button
            onClick={clear}
            className="px-3 py-2 rounded-lg bg-white/5 text-text-muted hover:text-text hover:bg-white/10 transition-colors"
          >
            {t('scout.clear')}
          </button>
        )}
      </div>

      {/* Loading indicators */}
      {loadingState.phase === 'loading-profile' && (
        <LoadingBar label={t('scout.loadingProfile')} />
      )}
      {loadingState.phase === 'loading-tournament' && (
        <LoadingBar label={t('scout.loadingTournament')} />
      )}
      {loadingState.phase === 'loading-players' && (
        <LoadingBar
          label={t('scout.loadingPlayers', { loaded: loadingState.loaded, total: loadingState.total })}
          progress={(loadingState.loaded / loadingState.total) * 100}
        />
      )}
      {loadingState.phase === 'error' && (
        <div className="p-3 rounded-lg bg-team-red/10 border border-team-red/30 text-team-red-light text-sm">
          {loadingState.message}
        </div>
      )}

      {/* Profile view: show upcoming tournaments */}
      {profile && !tournament && loadingState.phase !== 'loading-tournament' && loadingState.phase !== 'loading-players' && (
        <ProfileView profile={profile} onSelectTournament={loadTournament} />
      )}

      {/* Tournament data display */}
      {tournament && (
        <div className="space-y-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {/* Back button */}
          {profile && (
            <button
              onClick={backToProfile}
              className="text-sm text-text-muted hover:text-accent-light transition-colors"
            >
              &larr; {t('scout.backToProfile', { name: profile.name })}
            </button>
          )}

          {/* Tournament header */}
          <div className="p-4 rounded-xl bg-surface-alt border border-border">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-accent-light">{tournament.name}</h3>
              <a
                href={getTournamentUrl(tournament.uuid)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-accent-light shrink-0"
              >
                padel-austria.at &rarr;
              </a>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-text-muted">
              {tournament.date && <span>{tournament.date}</span>}
              {tournament.time && <span>{tournament.time}</span>}
              {tournament.location && <span>{tournament.location}</span>}
              {tournament.category && <Badge text={tournament.category} />}
              <span>{tournament.teams.length} Teams</span>
            </div>
          </div>

          {/* Quick stats overview */}
          <QuickStats teams={tournament.teams} />

          {/* Teams list */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-text">{t('scout.teamsTitle')}</h3>
            {tournament.teams.map(team => (
              <TeamCard
                key={team.rank}
                team={team}
                expanded={expandedTeam === team.rank}
                onToggle={() => setExpandedTeam(expandedTeam === team.rank ? null : team.rank)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Profile view with tournament selection ──────────────────────────

function ProfileView({ profile, onSelectTournament }: { profile: PlayerProfile; onSelectTournament: (uuid: string) => void }) {
  const { t } = useT()

  return (
    <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="p-4 rounded-xl bg-surface-alt border border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-accent-light">{profile.name}</h3>
          <a
            href={getPlayerProfileUrl(profile.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-accent-light"
          >
            {t('scout.viewProfile')} &rarr;
          </a>
        </div>
      </div>

      {profile.upcomingTournaments.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-text">{t('scout.upcomingTournaments')}</h3>
          {profile.upcomingTournaments.map(tourney => (
            <button
              key={tourney.uuid}
              onClick={() => onSelectTournament(tourney.uuid)}
              className="w-full p-4 rounded-xl bg-surface-alt border border-border hover:border-border-focus/50 transition-colors text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text group-hover:text-accent-light transition-colors">
                    {tourney.name}
                  </div>
                  {tourney.date && (
                    <div className="text-sm text-text-muted mt-0.5">{tourney.date}</div>
                  )}
                </div>
                <span className="text-text-muted group-hover:text-accent-light transition-colors">
                  {t('scout.scoutBtn')} &rarr;
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-surface-alt border border-border text-text-muted text-sm">
          {t('scout.noUpcoming')}
        </div>
      )}
    </div>
  )
}

// ── Quick stats ─────────────────────────────────────────────────────

function QuickStats({ teams }: { teams: ScoutTeam[] }) {
  const { t } = useT()
  const allPlayers = teams.flatMap(t => [t.player1, t.player2])
  const withMatches = allPlayers.filter(p => p.matchesPlayed > 0)

  const avgWinRate = withMatches.length > 0
    ? withMatches.reduce((sum, p) => sum + p.winRate, 0) / withMatches.length
    : 0
  const maxMatches = Math.max(...allPlayers.map(p => p.matchesPlayed), 0)
  const avgMatches = withMatches.length > 0
    ? withMatches.reduce((sum, p) => sum + p.matchesPlayed, 0) / withMatches.length
    : 0
  const noExpPlayers = allPlayers.filter(p => p.matchesPlayed === 0).length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label={t('scout.avgWinRate')} value={`${avgWinRate.toFixed(1)}%`} />
      <StatCard label={t('scout.avgMatches')} value={avgMatches.toFixed(0)} />
      <StatCard label={t('scout.maxMatches')} value={String(maxMatches)} />
      <StatCard label={t('scout.noExperience')} value={String(noExpPlayers)} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-surface-alt border border-border text-center">
      <div className="text-xl font-bold text-accent-light">{value}</div>
      <div className="text-xs text-text-muted mt-0.5">{label}</div>
    </div>
  )
}

// ── Team card ───────────────────────────────────────────────────────

function TeamCard({ team, expanded, onToggle }: { team: ScoutTeam; expanded: boolean; onToggle: () => void }) {
  const { t } = useT()
  const avgWinRate = getTeamAvgWinRate(team)
  const totalMatches = team.player1.matchesPlayed + team.player2.matchesPlayed
  const threatLevel = getThreatLevel(team)

  return (
    <div className="rounded-xl bg-surface-alt border border-border overflow-hidden transition-colors hover:border-border-focus/50">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/3 transition-colors"
      >
        <span className="text-text-muted text-sm font-mono w-6 text-right shrink-0">#{team.rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-text truncate">{team.player1.name}</span>
            <span className="text-text-muted">/</span>
            <span className="font-medium text-text truncate">{team.player2.name}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
            <span>{totalMatches} {t('scout.matches')}</span>
            <span>{avgWinRate.toFixed(0)}% {t('scout.winRateShort')}</span>
            {team.teamApn > 0 && <span>APN {team.teamApn.toFixed(3)}</span>}
          </div>
        </div>
        <ThreatBadge level={threatLevel} />
        <span className={`text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}>&#9662;</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PlayerDetail player={team.player1} />
            <PlayerDetail player={team.player2} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Player detail card ──────────────────────────────────────────────

function PlayerDetail({ player }: { player: ScoutPlayer }) {
  const { t } = useT()

  return (
    <div className="p-3 rounded-lg bg-surface border border-border space-y-2">
      <div className="flex items-center justify-between">
        <a
          href={getPlayerProfileUrl(player.profileSlug)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-accent-light hover:underline"
        >
          {player.name}
        </a>
        {player.playerId && <span className="text-xs text-text-muted">{player.playerId}</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="text-base font-bold text-text">{player.matchesPlayed}</div>
          <div className="text-text-muted">{t('scout.matchesLabel')}</div>
        </div>
        <div>
          <div className={`text-base font-bold ${getWinRateColor(player.winRate)}`}>
            {player.matchesPlayed > 0 ? `${player.winRate.toFixed(1)}%` : '-'}
          </div>
          <div className="text-text-muted">{t('scout.winRateLabel')}</div>
        </div>
        <div>
          <div className="text-base font-bold text-text">{player.matchesWon}-{player.matchesLost}</div>
          <div className="text-text-muted">{t('scout.record')}</div>
        </div>
      </div>

      {player.points > 0 && (
        <div className="flex justify-between text-xs text-text-muted">
          <span>{t('scout.points')}: {player.points}</span>
          {player.ranking && <span>{t('scout.ranking')}: #{player.ranking}</span>}
          {player.apn > 1 && <span>APN: {player.apn.toFixed(3)}</span>}
        </div>
      )}

      {player.tournamentHistory.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-text-muted mb-1">{t('scout.recentTournaments')}:</div>
          <div className="space-y-0.5">
            {player.tournamentHistory.slice(0, 5).map((th, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-text-muted truncate mr-2">{th.name}</span>
                <span className="text-accent shrink-0">{th.pointsEarned} Pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared components ───────────────────────────────────────────────

function ThreatBadge({ level }: { level: 'low' | 'medium' | 'high' | 'unknown' }) {
  const { t } = useT()
  const config = {
    low: { bg: 'bg-fair-good/15', text: 'text-fair-good', label: t('scout.threatLow') },
    medium: { bg: 'bg-fair-warn/15', text: 'text-fair-warn', label: t('scout.threatMedium') },
    high: { bg: 'bg-fair-bad/15', text: 'text-fair-bad', label: t('scout.threatHigh') },
    unknown: { bg: 'bg-white/10', text: 'text-text-muted', label: '?' },
  }
  const c = config[level]
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>
}

function Badge({ text }: { text: string }) {
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary-light">{text}</span>
}

function LoadingBar({ label, progress }: { label: string; progress?: number }) {
  return (
    <div className="p-3 rounded-lg bg-surface-alt border border-border">
      <div className="text-sm text-text-muted mb-2">{label}</div>
      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{
            width: progress != null ? `${progress}%` : '30%',
            animation: progress == null ? 'pulse 1.5s ease-in-out infinite' : undefined,
          }}
        />
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────

function getTeamAvgWinRate(team: ScoutTeam): number {
  const players = [team.player1, team.player2].filter(p => p.matchesPlayed > 0)
  if (players.length === 0) return 0
  return players.reduce((sum, p) => sum + p.winRate, 0) / players.length
}

function getThreatLevel(team: ScoutTeam): 'low' | 'medium' | 'high' | 'unknown' {
  const totalMatches = team.player1.matchesPlayed + team.player2.matchesPlayed
  if (totalMatches === 0) return 'unknown'

  const avgWinRate = getTeamAvgWinRate(team)

  if (avgWinRate >= 50 && totalMatches >= 40) return 'high'
  if (avgWinRate >= 55) return 'high'
  if (avgWinRate >= 38 && totalMatches >= 30) return 'medium'
  if (avgWinRate >= 45) return 'medium'

  return 'low'
}

function getWinRateColor(rate: number): string {
  if (rate >= 55) return 'text-fair-bad'
  if (rate >= 42) return 'text-fair-warn'
  return 'text-fair-good'
}
