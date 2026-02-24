import { useTournament } from '../../state'
import { Header } from './Header'
import { SetupPage } from '../../pages/SetupPage'
import { RoundPage } from '../../pages/RoundPage'
import { LeaderboardPage } from '../../pages/LeaderboardPage'
import { SimulatorPage } from '../../pages/SimulatorPage'
import { PlayersPage } from '../../pages/PlayersPage'
import { PlayerDetailPage } from '../../pages/PlayerDetailPage'
import { PlayerGroupsPage } from '../../pages/PlayerGroupsPage'

export function AppShell() {
  const { state } = useTournament()

  const renderPage = () => {
    switch (state.currentPage) {
      case 'setup': return <SetupPage />
      case 'round': return <RoundPage />
      case 'leaderboard': return <LeaderboardPage />
      case 'players': return <PlayersPage />
      case 'playerDetail': return <PlayerDetailPage />
      case 'playerGroups': return <PlayerGroupsPage />
      case 'simulator': return <SimulatorPage />
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {renderPage()}
      </main>
    </div>
  )
}
