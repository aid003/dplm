import { useEffect, useState } from 'react'
import { ipc } from '../../../shared/api/ipc'
import styles from './ModelSelect.module.css'

type ModelInfo = { name: string; path: string }

export function ModelSelect(): React.JSX.Element {
  const [models, setModels] = useState<ModelInfo[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [usingPath, setUsingPath] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | ''>('')
  const [error, setError] = useState<string | null>(null)

  const refresh = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const list = await ipc.listModels()
      if (Array.isArray(list)) {
        setModels(list)
      } else {
        setError(list?.error || 'Failed to list models')
      }
      const status = await ipc.getMlStatus()
      if (!('error' in status)) {
        setUsingPath(status.modelPath ?? null)
      }
      // set default selected
      const first = Array.isArray(list) && list.length > 0 ? list[0].path : ''
      setSelectedPath(status && 'error' in status ? first : status.modelPath || first || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const selectModel = async (m: ModelInfo): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res = await ipc.setModel(m.path)
      if ('error' in res && res.error) setError(res.error)
      else setUsingPath(m.path)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <strong>Models</strong>
        {usingPath ? (
          <span className={styles.muted}>Active: {usingPath.split('/').pop()}</span>
        ) : (
          <span className={styles.muted}>Active: none</span>
        )}
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
      {models && models.length > 0 ? (
        <div className={styles.row}>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            disabled={loading}
            className={styles.select}
          >
            {models.map((m) => (
              <option key={m.path} value={m.path}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const m = (models || []).find((x) => x.path === selectedPath)
              if (m) void selectModel(m)
            }}
            disabled={loading || !selectedPath || selectedPath === usingPath}
          >
            {selectedPath === usingPath ? 'Using' : 'Use'}
          </button>
        </div>
      ) : (
        !loading && <div className={styles.muted}>No .gguf models found in selected directory</div>
      )}
    </div>
  )
}
