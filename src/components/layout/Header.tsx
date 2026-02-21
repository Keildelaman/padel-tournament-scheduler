import { useTournament } from '../../state'
import type { Page } from '../../state'

const navItems: { page: Page; label: string; requiresTournament: boolean }[] = [
  { page: 'setup', label: 'Setup', requiresTournament: false },
  { page: 'round', label: 'Rounds', requiresTournament: true },
  { page: 'leaderboard', label: 'Leaderboard', requiresTournament: true },
  { page: 'simulator', label: 'Simulator', requiresTournament: false },
]

export function Header() {
  const { state, dispatch } = useTournament()
  const hasTournament = state.tournament != null

  return (
    <header className="bg-gradient-to-r from-primary to-primary-light text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <h1 className="text-lg font-bold tracking-tight">
            {state.tournament?.name ?? 'OidaPadel'}
          </h1>
          <nav className="flex gap-1">
            {navItems.map(item => {
              if (item.requiresTournament && !hasTournament) return null
              const isActive = state.currentPage === item.page
              return (
                <button
                  key={item.page}
                  onClick={() => dispatch({ type: 'NAVIGATE_PAGE', payload: { page: item.page } })}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white shadow-[inset_0_-2px_0_white]'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
