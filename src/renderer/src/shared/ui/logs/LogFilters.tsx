import { LogLevel } from '../../types/logs'
import styles from './LogFilters.module.css'

interface LogFiltersProps {
  filters: {
    level: LogLevel[]
    source: string[]
    search: string
  }
  onFiltersChange: (filters: { level?: LogLevel[]; source?: string[]; search?: string }) => void
  onClearLogs: () => void
  onToggleAutoScroll: () => void
  autoScroll: boolean
}

const LOG_LEVELS: LogLevel[] = ['info', 'warn', 'error', 'debug']
const LOG_SOURCES = ['llama', 'ipc', 'ml', 'system']

export function LogFilters({ 
  filters, 
  onFiltersChange, 
  onClearLogs, 
  onToggleAutoScroll, 
  autoScroll 
}: LogFiltersProps) {
  const toggleLevel = (level: LogLevel) => {
    const newLevels = filters.level.includes(level)
      ? filters.level.filter(l => l !== level)
      : [...filters.level, level]
    onFiltersChange({ level: newLevels })
  }

  const toggleSource = (source: string) => {
    const newSources = filters.source.includes(source)
      ? filters.source.filter(s => s !== source)
      : [...filters.source, source]
    onFiltersChange({ source: newSources })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value })
  }

  return (
    <div className={styles.filters}>
      <div className={styles.row}>
        <div className={styles.group}>
          <label className={styles.label}>Уровни логов:</label>
          <div className={styles.checkboxes}>
            {LOG_LEVELS.map(level => (
              <label key={level} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={filters.level.includes(level)}
                  onChange={() => toggleLevel(level)}
                />
                <span className={styles.checkboxLabel}>{level}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Источники:</label>
          <div className={styles.checkboxes}>
            {LOG_SOURCES.map(source => (
              <label key={source} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={filters.source.includes(source)}
                  onChange={() => toggleSource(source)}
                />
                <span className={styles.checkboxLabel}>{source}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.searchGroup}>
          <label className={styles.label}>Поиск:</label>
          <input
            type="text"
            placeholder="Поиск по сообщениям..."
            value={filters.search}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.actions}>
          <button
            onClick={onToggleAutoScroll}
            className={`${styles.button} ${autoScroll ? styles.active : ''}`}
            title={autoScroll ? 'Отключить автоскролл' : 'Включить автоскролл'}
          >
            {autoScroll ? '⏸️' : '▶️'} Автоскролл
          </button>
          
          <button
            onClick={onClearLogs}
            className={`${styles.button} ${styles.danger}`}
            title="Очистить все логи"
          >
            🗑️ Очистить
          </button>
        </div>
      </div>
    </div>
  )
}
