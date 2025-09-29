import { useEffect, useState } from 'react'
import styles from './StatsChart.module.css'

interface StatsChartProps {
  metrics: {
    totalGenerations: number
    averageTokensPerSecond?: number
    lastGenerationTime?: number
    uptime?: number
  }
}

export function StatsChart({ metrics }: StatsChartProps) {
  const [chartData, setChartData] = useState<number[]>([])
  const [maxValue, setMaxValue] = useState(100)

  // Обновляем данные графика
  useEffect(() => {
    if (metrics.averageTokensPerSecond) {
      setChartData(prev => {
        const newData = [...prev, metrics.averageTokensPerSecond!].slice(-20) // Последние 20 точек
        setMaxValue(Math.max(...newData, 100))
        return newData
      })
    }
  }, [metrics.averageTokensPerSecond])

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className={styles.noData}>
          Нет данных для отображения
        </div>
      )
    }

    return (
      <div className={styles.chart}>
        {chartData.map((value, index) => {
          const height = (value / maxValue) * 100
          return (
            <div
              key={index}
              className={styles.bar}
              style={{
                height: `${height}%`,
                backgroundColor: value > maxValue * 0.8 ? '#10b981' : 
                                value > maxValue * 0.5 ? '#3b82f6' : '#6b7280'
              }}
              title={`${value.toFixed(1)} tok/s`}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Производительность в реальном времени</h4>
      
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Текущая скорость</div>
          <div className={styles.statValue}>
            {metrics.averageTokensPerSecond?.toFixed(1) || '0.0'} tok/s
          </div>
        </div>
        
        <div className={styles.stat}>
          <div className={styles.statLabel}>Всего генераций</div>
          <div className={styles.statValue}>
            {metrics.totalGenerations}
          </div>
        </div>
        
        <div className={styles.stat}>
          <div className={styles.statLabel}>Последняя генерация</div>
          <div className={styles.statValue}>
            {metrics.lastGenerationTime ? `${metrics.lastGenerationTime}ms` : 'N/A'}
          </div>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.chartLabel}>Скорость генерации (последние 20 запросов)</div>
        {renderChart()}
        <div className={styles.chartAxis}>
          <span>0</span>
          <span>{maxValue.toFixed(0)} tok/s</span>
        </div>
      </div>
    </div>
  )
}
