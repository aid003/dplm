import { useCallback, useEffect, useMemo, useState } from 'react'
import { ipc } from '../../../shared/api/ipc'
import { useModal } from '../../../shared/ui/modal'
import styles from './ModelSelectModal.module.css'

type ModelInfo = { name: string; path: string }

export function ModelSelectModal({ onClose }: { onClose?: () => void }): React.JSX.Element {
  const modal = useModal()
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
    async (dirOverride?: string): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        modal.setLoadingTopmost(true, { showSpinner: true, text: 'Loading models…' })
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
        modal.setLoadingTopmost(false)
      }
    },
    [dir, modal]
  )

  useEffect(() => {
    ;(async () => {
      try {
        const s = await window.api.getSettings()
        if (s.modelDir) setDir(s.modelDir)
        await refresh(s.modelDir)
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
    try {
      modal.setLoadingTopmost(true, { showSpinner: true, text: 'Applying model…' })
      const res = await ipc.setModel(selectedPath)
      if ('error' in res && res.error) setError(res.error)
      else {
        setUsingPath(selectedPath)
        await window.api.setModelPrefs({ modelDir: dir || undefined, modelPath: selectedPath })
        onClose?.()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
      modal.setLoadingTopmost(false)
    }
  }

  return (
    <div className={styles.root}>
      <h3 className={styles.header}>Select Model</h3>
      <div className={styles.row}>
        <input
          type="text"
          value={dir}
          onChange={(e) => setDir(e.target.value)}
          placeholder="Models directory (optional)"
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
  )
}
