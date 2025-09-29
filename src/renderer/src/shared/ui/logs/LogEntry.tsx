import { LogEntry as LogEntryType } from '../../types/logs'
import styles from './LogEntry.module.css'

interface LogEntryProps {
  entry: LogEntryType
}

export function LogEntry({ entry }: LogEntryProps) {
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌'
      case 'warn': return '⚠️'
      case 'info': return 'ℹ️'
      case 'debug': return '🐛'
      default: return '📝'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'llama': return '🦙'
      case 'ipc': return '🔗'
      case 'ml': return '🤖'
      case 'system': return '⚙️'
      default: return '📋'
    }
  }

  return (
    <div className={`${styles.entry} ${styles[entry.level]}`}>
      <div className={styles.header}>
        <span className={styles.timestamp}>
          {formatTimestamp(entry.timestamp)}
        </span>
        <span className={styles.level}>
          {getLevelIcon(entry.level)} {entry.level.toUpperCase()}
        </span>
        <span className={styles.source}>
          {getSourceIcon(entry.source)} {entry.source}
        </span>
        {entry.category && (
          <span className={styles.category}>
            {entry.category}
          </span>
        )}
      </div>
      
      <div className={styles.message}>
        {entry.message}
      </div>
      
      {entry.data && (
        <details className={styles.data}>
          <summary>Данные</summary>
          <pre className={styles.dataContent}>
            {JSON.stringify(entry.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
