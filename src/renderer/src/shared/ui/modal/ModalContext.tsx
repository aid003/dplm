import React, { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ModalController, ModalEntry, ModalId, OpenModalParams } from './types'
import { ModalContext } from './context'
import styles from './ModalContext.module.css'

export function ModalProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [stack, setStack] = useState<ModalEntry[]>([])
  const idInc = useRef(0)

  const close = useCallback((id: ModalId) => {
    setStack((s) => s.filter((m) => m.id !== id))
  }, [])

  const open = useCallback(({ id, content, options }: OpenModalParams) => {
    const newId = id ?? `m_${Date.now()}_${idInc.current++}`
    const entry: ModalEntry = {
      id: newId,
      content,
      options: {
        closeOnBackdrop: options?.closeOnBackdrop ?? true,
        closeOnEsc: options?.closeOnEsc ?? true,
        ariaLabel: options?.ariaLabel,
        width: options?.width
      }
    }
    setStack((s) => [...s, entry])
    return newId
  }, [])

  const closeAll = useCallback(() => setStack([]), [])

  const setLoadingTopmost = useCallback<ModalController['setLoadingTopmost']>((loading, opts) => {
    setStack((s) => {
      if (s.length === 0) return s
      const last = s[s.length - 1]
      const nextLast: ModalEntry = {
        ...last,
        loading,
        showSpinner: opts?.showSpinner ?? last.showSpinner,
        loadingText: opts?.text ?? last.loadingText,
        fullscreenLoading: opts?.fullscreen ?? last.fullscreenLoading
      }
      return [...s.slice(0, -1), nextLast]
    })
  }, [])

  const confirm = useCallback<ModalController['confirm']>(
    (content, options) =>
      new Promise<boolean>((resolve) => {
        const id = open({ content: wrapConfirm(content, (v) => (resolve(v), close(id))), options })
      }),
    [open, close]
  )

  const value = useMemo<ModalController>(
    () => ({ open, close, closeAll, confirm, setLoadingTopmost }),
    [open, close, closeAll, confirm, setLoadingTopmost]
  )

  return (
    <ModalContext.Provider value={value}>
      {children}
      {createPortal(<ModalStack stack={stack} onClose={close} />, document.body)}
    </ModalContext.Provider>
  )
}

function ModalStack({
  stack,
  onClose
}: {
  stack: ModalEntry[]
  onClose: (id: ModalId) => void
}): React.JSX.Element {
  return (
    <>
      {stack.map((m, idx) => (
        <ModalShell
          key={m.id}
          entry={m}
          onClose={() => onClose(m.id)}
          topmost={idx === stack.length - 1}
        />
      ))}
    </>
  )
}

function ModalShell({
  entry,
  onClose,
  topmost
}: {
  entry: ModalEntry
  onClose: () => void
  topmost: boolean
}): React.JSX.Element {
  const { options } = entry
  const onBackdrop = (): void => {
    if (topmost && options.closeOnBackdrop && !entry.loading) onClose()
  }
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!topmost) return
    if (options.closeOnEsc && e.key === 'Escape' && !entry.loading) onClose()
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={options.ariaLabel || 'Modal'}
      onKeyDown={onKeyDown}
      className={styles.overlay}
      tabIndex={-1}
    >
      <div className={styles.backdrop} onMouseDown={onBackdrop} />
      <div
        className={styles.container}
        style={
          options.width
            ? ({
                ['--modal-width' as string]:
                  typeof options.width === 'number' ? `${options.width}px` : options.width
              } as React.CSSProperties)
            : undefined
        }
      >
        <button
          type="button"
          aria-label="Close"
          className={styles.closeButton}
          onClick={() => {
            if (!entry.loading) onClose()
          }}
        >
          ×
        </button>
        {entry.loading && entry.showSpinner ? (
          <div
            className={entry.fullscreenLoading ? styles.spinnerFullscreen : styles.spinnerOverlay}
            aria-busy
          >
            <div className={styles.spinnerBox}>
              <div className={styles.spinner} />
              {entry.loadingText ? (
                <div className={styles.spinnerText}>{entry.loadingText}</div>
              ) : null}
            </div>
          </div>
        ) : null}
        {entry.content}
      </div>
    </div>
  )
}

function wrapConfirm(content: React.ReactNode, done: (ok: boolean) => void): React.ReactNode {
  return (
    <div className={styles.confirm}>
      <div>{content}</div>
      <div className={styles.confirmActions}>
        <button onClick={() => done(false)}>Cancel</button>
        <button onClick={() => done(true)}>OK</button>
      </div>
    </div>
  )
}
