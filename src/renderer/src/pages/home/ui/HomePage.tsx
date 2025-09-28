import { useState } from 'react'
import { ipc } from '../../../shared/api/ipc'
import styles from './HomePage.module.css'

function HomePage(): React.JSX.Element {
  const [testing, setTesting] = useState(false)
  const [testOutput, setTestOutput] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  return (
    <div style={{ padding: 16 }}>
      <button
        onClick={async () => {
          setTesting(true)
          setTestError(null)
          setTestOutput(null)
          try {
            const status = await ipc.getMlStatus()
            if (!status) {
              setTestError('Failed to get ML status')
              return
            }
            if ('error' in status && status.error) {
              setTestError(status.error)
              return
            }
            if (!status.modelLoaded) {
              setTestError('Model is not initialized yet')
              return
            }
            const res = await ipc.runCompletion('Hello from Electron!')
            if (typeof res === 'string') setTestOutput(res)
            else if (res && typeof res === 'object' && 'error' in res) setTestError(res.error)
            else setTestError('Unknown response from model')
          } finally {
            setTesting(false)
          }
        }}
        disabled={testing}
      >
        {testing ? 'Testing…' : 'Test LLM'}
      </button>
      {testError ? <div className={styles.errorText}>{testError}</div> : null}
      {testOutput ? <pre className={styles.outputPre}>{testOutput}</pre> : null}
    </div>
  )
}

export default HomePage
