import { MLMetrics } from '../../types/logs'
import styles from './MetricsPanel.module.css'

interface MetricsPanelProps {
  metrics: MLMetrics
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const formatTime = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatTokensPerSecond = (tps?: number) => {
    if (!tps) return 'N/A'
    return `${tps.toFixed(1)} tok/s`
  }

  const formatMemory = (mb?: number) => {
    if (!mb) return 'N/A'
    if (mb < 1024) return `${mb} MB`
    return `${(mb / 1024).toFixed(1)} GB`
  }

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Метрики ML</h3>
      
      <div className={styles.grid}>
        {/* Основные метрики */}
        <div className={styles.metric}>
          <div className={styles.label}>Статус модели</div>
          <div className={`${styles.value} ${metrics.modelLoaded ? styles.success : styles.error}`}>
            {metrics.modelLoaded ? 'Загружена' : 'Не загружена'}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Бэкенд</div>
          <div className={`${styles.value} ${metrics.backend === 'gpu' ? styles.gpu : styles.cpu}`}>
            {metrics.backend.toUpperCase()}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>GPU слои</div>
          <div className={styles.value}>
            {metrics.gpuLayers > 0 ? metrics.gpuLayers : 'CPU режим'}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Размер модели</div>
          <div className={styles.value}>
            {formatMemory(metrics.modelSize)}
          </div>
        </div>

        {/* Производительность */}
        <div className={styles.metric}>
          <div className={styles.label}>Время инициализации</div>
          <div className={styles.value}>
            {formatTime(metrics.initTime)}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Последняя генерация</div>
          <div className={styles.value}>
            {formatTime(metrics.lastGenerationTime)}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Всего генераций</div>
          <div className={styles.value}>
            {metrics.totalGenerations}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Скорость генерации</div>
          <div className={styles.value}>
            {formatTokensPerSecond(metrics.averageTokensPerSecond)}
          </div>
        </div>

        {/* Системные метрики */}
        <div className={styles.metric}>
          <div className={styles.label}>Системная память</div>
          <div className={styles.value}>
            {formatMemory(metrics.memoryUsage?.used)} / {formatMemory(metrics.memoryUsage?.total)}
          </div>
          <div className={styles.subValue}>
            {metrics.memoryUsage?.total ? 
              `${Math.round((metrics.memoryUsage.used / metrics.memoryUsage.total) * 100)}%` : 
              'N/A'
            }
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Память процесса (RSS)</div>
          <div className={styles.value}>
            {formatMemory(metrics.processMemory?.rss)}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Heap память</div>
          <div className={styles.value}>
            {formatMemory(metrics.processMemory?.heapUsed)} / {formatMemory(metrics.processMemory?.heapTotal)}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Внешняя память</div>
          <div className={styles.value}>
            {formatMemory(metrics.processMemory?.external)}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Время работы</div>
          <div className={styles.value}>
            {formatUptime(metrics.uptime)}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Платформа</div>
          <div className={styles.value}>
            {metrics.systemInfo?.platform} ({metrics.systemInfo?.arch})
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Node.js версия</div>
          <div className={styles.value}>
            {metrics.systemInfo?.nodeVersion}
          </div>
        </div>

        {/* Конфигурация */}
        <div className={styles.metric}>
          <div className={styles.label}>Размер контекста</div>
          <div className={styles.value}>
            {metrics.contextSize?.toLocaleString() || 'N/A'}
          </div>
        </div>

        <div className={styles.metric}>
          <div className={styles.label}>Потоки</div>
          <div className={styles.value}>
            {metrics.threads || 'N/A'}
          </div>
        </div>

        {/* Путь к модели */}
        <div className={styles.metric}>
          <div className={styles.label}>Путь к модели</div>
          <div className={styles.value} title={metrics.modelPath || 'Не установлена'}>
            {metrics.modelPath ? 
              metrics.modelPath.split('/').pop() || metrics.modelPath : 
              'Не установлена'
            }
          </div>
        </div>

        {/* Последняя ошибка */}
        {metrics.lastError && (
          <div className={styles.metric}>
            <div className={styles.label}>Последняя ошибка</div>
            <div className={`${styles.value} ${styles.error}`} title={metrics.lastError}>
              {metrics.lastError.length > 50 ? 
                metrics.lastError.substring(0, 50) + '...' : 
                metrics.lastError
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
