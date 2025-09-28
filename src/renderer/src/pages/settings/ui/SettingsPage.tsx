import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ipc } from '../../../shared/api/ipc'
import styles from '../../../features/model-select/ui/ModelSelectModal.module.css'
import { useModal } from '../../../shared/ui/modal'

type ModelInfo = { name: string; path: string }

export default function SettingsPage(): React.JSX.Element {
  const modal = useModal()
  const loadingModalId = useRef<string | null>(null)
  const [dir, setDir] = useState<string>('')
  const [models, setModels] = useState<ModelInfo[] | null>(null)
  const [selectedPath, setSelectedPath] = useState<string>('')
  const [usingPath, setUsingPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canUse = useMemo(
    () => !!selectedPath && selectedPath !== usingPath,
    [selectedPath, usingPath]
  )

  const refresh = useCallback(
    async (dirOverride?: string, opts?: { silent?: boolean }): Promise<void> => {
      setLoading(true)
      setError(null)
      let startedAt = Date.now()
      try {
        const silent = opts?.silent === true
        if (!silent) {
          if (!loadingModalId.current) {
            loadingModalId.current = modal.open({
              content: <></>,
              options: { closeOnBackdrop: false, closeOnEsc: false, ariaLabel: 'Loading' }
            })
          }
          startedAt = Date.now()
          modal.setLoadingTopmost(true, {
            showSpinner: true,
            text: 'Loading models…',
            fullscreen: true
          })
        }
        const root = (dirOverride ?? dir)?.trim()
        const list = await ipc.listModels(root ? root : undefined)
        if (Array.isArray(list)) {
          setModels(list)
        } else {
          setError(list?.error || 'Failed to list models')
          setModels([])
        }
        const status = await ipc.getMlStatus()
        if (!('error' in status)) setUsingPath(status.modelPath ?? null)
        const first = Array.isArray(list) && list.length > 0 ? list[0].path : ''
        setSelectedPath(status && 'error' in status ? first : status.modelPath || first || '')
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
        const elapsed = Date.now() - startedAt
        const delay = elapsed < 3000 ? 3000 - elapsed : 0
        // Only enforce minimum delay and overlay when not silent
        if (!(opts?.silent === true)) {
          if (delay > 0) await new Promise((r) => setTimeout(r, delay))
          modal.setLoadingTopmost(false)
          if (loadingModalId.current) {
            modal.close(loadingModalId.current)
            loadingModalId.current = null
          }
        }
      }
    },
    [dir, modal]
  )

  useEffect(() => {
    ;(async () => {
      try {
        const s = await window.api.getSettings()
        if (s.modelDir) setDir(s.modelDir)
        await refresh(s.modelDir, { silent: true })
        if (s.modelPath) setSelectedPath(s.modelPath)
      } catch {
        // ignore settings load errors
      }
    })()
  }, [refresh])

  const browseDir = async (): Promise<void> => {
    const res = await window.api.chooseDirectory()
    if ('path' in res) {
      setDir(res.path)
      await window.api.setModelPrefs({ modelDir: res.path })
      void refresh(res.path)
    }
  }

  const applySelected = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    let startedAt = Date.now()
    try {
      if (!loadingModalId.current) {
        loadingModalId.current = modal.open({
          content: <></>,
          options: { closeOnBackdrop: false, closeOnEsc: false, ariaLabel: 'Applying model' }
        })
      }
      startedAt = Date.now()
      modal.setLoadingTopmost(true, {
        showSpinner: true,
        text: 'Applying model…',
        fullscreen: true
      })
      const res = await ipc.setModel(selectedPath)
      if ('error' in res && res.error) setError(res.error)
      else {
        setUsingPath(selectedPath)
        await window.api.setModelPrefs({ modelDir: dir || undefined, modelPath: selectedPath })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
      const elapsed = Date.now() - startedAt
      const delay = elapsed < 3000 ? 3000 - elapsed : 0
      if (delay > 0) await new Promise((r) => setTimeout(r, delay))
      modal.setLoadingTopmost(false)
      if (loadingModalId.current) {
        modal.close(loadingModalId.current)
        loadingModalId.current = null
      }
    }
  }

  return (
    <div>
      <h2>Настройки</h2>
      <div className={styles.root}>
        <h3 className={styles.header}>Папка и модель</h3>
        <div className={styles.row}>
          <input
            type="text"
            value={dir}
            onChange={(e) => setDir(e.target.value)}
            placeholder="Models directory"
            className={styles.input}
          />
          <button onClick={() => void browseDir()} disabled={loading}>
            Browse…
          </button>
        </div>
        {usingPath ? (
          <div className={styles.muted}>Active: {usingPath.split('/').pop()}</div>
        ) : (
          <div className={styles.muted}>Active: none</div>
        )}
        {error ? <div className={styles.error}>{error}</div> : null}
        <div className={styles.row}>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            disabled={loading}
            className={styles.select}
          >
            {(models || []).map((m) => (
              <option key={m.path} value={m.path}>
                {m.name}
              </option>
            ))}
          </select>
          <button onClick={() => void applySelected()} disabled={loading || !canUse}>
            {usingPath === selectedPath ? 'Using' : 'Use'}
          </button>
        </div>
      </div>
    </div>
  )
}
