import { useTournament } from '../../state'
import type { Page } from '../../state'
import { useT } from '../../i18n'
import type { Locale } from '../../i18n'

const navItems: { page: Page; labelKey: string; requiresTournament: boolean }[] = [
  { page: 'setup', labelKey: 'nav.setup', requiresTournament: false },
  { page: 'round', labelKey: 'nav.rounds', requiresTournament: true },
  { page: 'leaderboard', labelKey: 'nav.leaderboard', requiresTournament: true },
  { page: 'players', labelKey: 'nav.players', requiresTournament: false },
  { page: 'playerGroups', labelKey: 'nav.playerGroups', requiresTournament: false },
  { page: 'simulator', labelKey: 'nav.simulator', requiresTournament: false },
]

export function Header() {
  const { state, dispatch } = useTournament()
  const { t, locale, setLocale } = useT()
  const hasTournament = state.tournament != null

  const toggleLocale = () => setLocale(locale === 'de' ? 'en' : 'de')
  const nextLocale: Locale = locale === 'de' ? 'en' : 'de'

  return (
    <header className="relative bg-surface/80 backdrop-blur-xl text-text border-b border-border shadow-lg shadow-black/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-lg font-bold tracking-tight text-accent-light">
            {state.tournament?.name ?? t('nav.fallbackTitle')}
          </h1>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1">
              {navItems.map(item => {
                if (item.requiresTournament && !hasTournament) return null
                if (item.page === 'leaderboard' && state.tournament?.phase !== 'finished') return null
                if (item.page === 'playerDetail') return null
                const isActive = state.currentPage === item.page || (item.page === 'players' && state.currentPage === 'playerDetail')
                return (
                  <button
                    key={item.page}
                    onClick={() => dispatch({ type: 'NAVIGATE_PAGE', payload: { page: item.page } })}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/15 text-accent-light shadow-[inset_0_-2px_0_theme(colors.accent)]'
                        : 'text-text-muted hover:text-text hover:bg-white/5'
                    }`}
                  >
                    {t(item.labelKey)}
                  </button>
                )
              })}
            </nav>
            <button
              onClick={toggleLocale}
              className="ml-1 px-2 py-1 rounded text-xs font-bold bg-white/8 hover:bg-white/15 border border-border transition-colors uppercase"
            >
              {nextLocale}
            </button>
          </div>
        </div>
      </div>
      {/* Decorative glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px opacity-40" style={{ background: 'linear-gradient(90deg, transparent, #10b068, #d4a017, #10b068, transparent)' }} />
    </header>
  )
}
