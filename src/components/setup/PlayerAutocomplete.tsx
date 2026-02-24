import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { RegisteredPlayer } from '../../types'
import { useT } from '../../i18n'

interface PlayerAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (player: RegisteredPlayer) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  registeredPlayers: RegisteredPlayer[]
  selectedPlayerIds: Set<string>
  placeholder: string
  inputRef?: React.Ref<HTMLInputElement>
  isAutoGrowSlot: boolean
}

export function PlayerAutocomplete({
  value, onChange, onSelect, onKeyDown,
  registeredPlayers, selectedPlayerIds,
  placeholder, inputRef, isAutoGrowSlot,
}: PlayerAutocompleteProps) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const internalRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Merge refs
  const setRefs = useCallback((el: HTMLInputElement | null) => {
    (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = el
    if (typeof inputRef === 'function') inputRef(el)
    else if (inputRef && typeof inputRef === 'object') (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el
  }, [inputRef])

  const query = value.trim().toLowerCase()
  const filtered = registeredPlayers.filter(p =>
    !query || p.name.toLowerCase().includes(query)
  )

  // Check if typed text exactly matches a registered player
  const exactMatch = query ? registeredPlayers.find(p => p.name.toLowerCase() === query) : undefined
  const showNewPlayerHint = query.length > 0 && !exactMatch && filtered.length === 0

  const updateRect = () => {
    if (internalRef.current) {
      setRect(internalRef.current.getBoundingClientRect())
    }
  }

  const handleFocus = () => {
    updateRect()
    setOpen(true)
    setHighlightIndex(-1)
  }

  const handleBlur = () => {
    // Delay to allow click on dropdown
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setOpen(false)
      }
    }, 150)
  }

  const handleSelect = (player: RegisteredPlayer) => {
    onSelect(player)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) {
      onKeyDown(e)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(i => {
        const selectableIndices = filtered.map((p, idx) => ({ idx, selectable: !selectedPlayerIds.has(p.id) })).filter(x => x.selectable).map(x => x.idx)
        if (selectableIndices.length === 0) return -1
        const currentPos = selectableIndices.indexOf(i)
        return selectableIndices[(currentPos + 1) % selectableIndices.length]
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(i => {
        const selectableIndices = filtered.map((p, idx) => ({ idx, selectable: !selectedPlayerIds.has(p.id) })).filter(x => x.selectable).map(x => x.idx)
        if (selectableIndices.length === 0) return -1
        const currentPos = selectableIndices.indexOf(i)
        return selectableIndices[(currentPos - 1 + selectableIndices.length) % selectableIndices.length]
      })
    } else if (e.key === 'Enter' && highlightIndex >= 0 && highlightIndex < filtered.length) {
      e.preventDefault()
      const player = filtered[highlightIndex]
      if (!selectedPlayerIds.has(player.id)) {
        handleSelect(player)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else {
      onKeyDown(e)
    }
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        internalRef.current && !internalRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return
    const handle = () => updateRect()
    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [open])

  const showDropdown = open && (filtered.length > 0 || showNewPlayerHint) && !isAutoGrowSlot

  return (
    <>
      <input
        ref={setRefs}
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value)
          if (!open) { updateRect(); setOpen(true) }
          setHighlightIndex(-1)
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`flex-1 px-4 py-3 border rounded-lg text-base bg-surface-input text-text focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus ${
          isAutoGrowSlot ? 'border-dashed border-border/50' : 'border-border'
        }`}
      />
      {showDropdown && rect && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
          }}
          className="bg-surface border border-border rounded-lg shadow-xl shadow-black/40 max-h-48 overflow-y-auto"
        >
          {filtered.length > 0 ? filtered.map((player, i) => {
            const isSelected = selectedPlayerIds.has(player.id)
            return (
              <button
                key={player.id}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => !isSelected && handleSelect(player)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'text-text-muted/40 cursor-default'
                    : i === highlightIndex
                    ? 'bg-primary/15 text-text'
                    : 'text-text hover:bg-white/5'
                }`}
              >
                <span>{player.name}</span>
                {player.archived && <span className="ml-2 text-xs text-text-muted">({t('players.archived')})</span>}
              </button>
            )
          }) : (
            <div className="px-3 py-2 text-sm text-accent-light">
              {t('setup.newPlayer', { name: value.trim() })}
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}
