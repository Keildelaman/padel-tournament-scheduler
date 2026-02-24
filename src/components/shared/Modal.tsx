import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Button } from './Button'
import { useT } from '../../i18n'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  confirmText?: string
  confirmVariant?: 'primary' | 'destructive'
  onConfirm?: () => void
}

export function Modal({ open, onClose, title, children, confirmText, confirmVariant = 'primary', onConfirm }: ModalProps) {
  const { t } = useT()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface/95 backdrop-blur-xl rounded-2xl border border-border/60 shadow-2xl shadow-black/50 ring-1 ring-white/[0.05] max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="mb-6 text-text-muted">{children}</div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>{t('modal.cancel')}</Button>
          {onConfirm && (
            <Button variant={confirmVariant} onClick={onConfirm}>
              {confirmText ?? t('modal.confirm')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
