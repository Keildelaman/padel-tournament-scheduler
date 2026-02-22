import { useTournament, getLeaderboard } from '../state'
import { Card, Button } from '../components/shared'
import { PodiumGraphic } from '../components/leaderboard/PodiumGraphic'
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable'
import { leaderboardToCsv, leaderboardToText, downloadFile } from '../utils/export'
import { useT } from '../i18n'

export function LeaderboardPage() {
  const { state, dispatch } = useTournament()
  const { t } = useT()
  const tournament = state.tournament

  if (!tournament) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>{t('leaderboard.noData')}</p>
        <button
          className="mt-3 text-primary hover:underline"
          onClick={() => dispatch({ type: 'NAVIGATE_PAGE', payload: { page: 'setup' } })}
        >
          {t('leaderboard.goToSetup')}
        </button>
      </div>
    )
  }

  const leaderboard = getLeaderboard(tournament)
  const top3 = leaderboard.slice(0, 3)
  const completedRounds = tournament.rounds.filter(r => r.completed).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold border-l-4 border-primary pl-3">
          {tournament.phase === 'finished' ? t('leaderboard.finalResults') : t('leaderboard.currentStandings')}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="text-xs !px-3 !py-1.5"
            onClick={() => downloadFile(leaderboardToCsv(leaderboard, t), `${tournament.name}-results.csv`, 'text/csv')}
          >
            {t('leaderboard.exportCsv')}
          </Button>
          <Button
            variant="secondary"
            className="text-xs !px-3 !py-1.5"
            onClick={() => {
              const text = leaderboardToText(leaderboard, t)
              navigator.clipboard.writeText(text)
            }}
          >
            {t('leaderboard.copyText')}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-surface">{tournament.players.length}</div>
            <div className="text-xs text-text-muted">{t('leaderboard.players')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-surface">{completedRounds}</div>
            <div className="text-xs text-text-muted">{t('leaderboard.roundsPlayed')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-surface">{tournament.courts}</div>
            <div className="text-xs text-text-muted">{t('leaderboard.courts')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-surface">
              {tournament.scoringConfig.mode === 'points' ? t('leaderboard.pts', { n: tournament.scoringConfig.pointsPerMatch }) : t('leaderboard.wl')}
            </div>
            <div className="text-xs text-text-muted">{t('leaderboard.scoring')}</div>
          </div>
        </div>
      </Card>

      {/* Podium */}
      {tournament.phase === 'finished' && top3.length >= 3 && (
        <Card>
          <PodiumGraphic top3={top3} />
        </Card>
      )}

      {/* Table */}
      <Card padding={false}>
        <LeaderboardTable entries={leaderboard} tournament={tournament} />
      </Card>

      {/* Actions */}
      {tournament.phase === 'finished' && (
        <div className="flex justify-center">
          <Button variant="destructive" onClick={() => dispatch({ type: 'RESET_TOURNAMENT' })}>
            {t('leaderboard.newTournament')}
          </Button>
        </div>
      )}
    </div>
  )
}
