import { useEffect, useRef } from 'react'
import { useLogs } from '../../../shared/hooks/useLogs'
import { LogEntry, MetricsPanel, LogFilters, TestGeneration, StatsChart } from '../../../shared/ui/logs'
import styles from './LogsPage.module.css'

export default function LogsPage(): React.JSX.Element {
  const {
    logs,
    metrics,
    filters,
    autoScroll,
    addLog,
    updateFilters,
    clearLogs,
    toggleAutoScroll,
    refreshMLStatus,
    runCompletionWithLogging
  } = useLogs()

  const logsContainerRef = useRef<HTMLDivElement>(null)

  // Автоскролл к последнему логу
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // Добавляем тестовые логи при загрузке
  useEffect(() => {
    addLog({
      level: 'info',
      source: 'system',
      message: 'Страница логов инициализирована',
      category: 'init'
    })

    addLog({
      level: 'info',
      source: 'ml',
      message: 'ML сервис готов к работе',
      data: { status: 'ready' }
    })
  }, [addLog])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Логи и метрики</h1>
        <button
          onClick={refreshMLStatus}
          className={styles.refreshButton}
          title="Обновить статус ML"
        >
          🔄 Обновить
        </button>
      </div>

      <MetricsPanel metrics={metrics} />

      <StatsChart metrics={metrics} />

      <TestGeneration onRunCompletion={runCompletionWithLogging} />

      <LogFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onClearLogs={clearLogs}
        onToggleAutoScroll={toggleAutoScroll}
        autoScroll={autoScroll}
      />

      <div className={styles.logsContainer} ref={logsContainerRef}>
        {logs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Логи не найдены</p>
            <p className={styles.emptyHint}>
              Попробуйте изменить фильтры или выполнить операцию с ML
            </p>
          </div>
        ) : (
          logs.map(entry => (
            <LogEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.count}>
          Показано {logs.length} логов
        </span>
        {autoScroll && (
          <span className={styles.autoScrollIndicator}>
            Автоскролл включен
          </span>
        )}
      </div>
    </div>
  )
}

