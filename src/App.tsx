import { TournamentProvider } from './state/TournamentContext'
import { PlayerGroupProvider } from './state/playerGroup'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { I18nProvider } from './i18n'

export function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <PlayerGroupProvider>
          <TournamentProvider>
            <AppShell />
          </TournamentProvider>
        </PlayerGroupProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}
