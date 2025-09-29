import { useState, useEffect, useCallback, useRef } from 'react'
import { LogEntry, LogLevel, MLMetrics, LogsState } from '../types/logs'
import { ipc } from '../api/ipc'

export function useLogs() {
  const [state, setState] = useState<LogsState>({
    entries: [],
    metrics: {
      modelPath: null,
      backend: 'cpu',
      modelLoaded: false,
      gpuLayers: 0,
      totalGenerations: 0,
      modelSize: 0,
      contextSize: 2048,
      threads: 4,
      memoryUsage: { used: 0, total: 0 },
      systemInfo: {
        platform: 'unknown',
        arch: 'unknown',
        nodeVersion: 'unknown'
      },
      uptime: 0
    },
    filters: {
      level: ['info', 'warn', 'error'],
      source: ['llama', 'ipc', 'ml', 'system'],
      search: ''
    },
    autoScroll: true
  })

  const logsRef = useRef<LogEntry[]>([])
  const metricsRef = useRef<MLMetrics>(state.metrics)

  // Добавить новый лог
  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    logsRef.current = [...logsRef.current, newEntry].slice(-1000) // Храним последние 1000 логов

    setState((prev) => ({
      ...prev,
      entries: logsRef.current
    }))
  }, [])

  // Обновить метрики
  const updateMetrics = useCallback((newMetrics: Partial<MLMetrics>) => {
    metricsRef.current = { ...metricsRef.current, ...newMetrics }
    setState((prev) => ({
      ...prev,
      metrics: metricsRef.current
    }))
  }, [])

  // Получить статус ML
  const refreshMLStatus = useCallback(async () => {
    try {
      const [status, systemInfo] = await Promise.all([ipc.getMlStatus(), ipc.getSystemInfo()])

      if (!status.error && !systemInfo.error) {
        updateMetrics({
          modelPath: status.modelPath || null,
          backend: (status.backend as 'cpu' | 'gpu') || 'cpu',
          modelLoaded: status.modelLoaded || false,
          memoryUsage: systemInfo.memoryUsage,
          processMemory: systemInfo.processMemory,
          uptime: systemInfo.uptime,
          systemInfo: {
            platform: systemInfo.platform,
            arch: systemInfo.arch,
            nodeVersion: systemInfo.nodeVersion
          }
        })

        // Если модель загружена, получаем дополнительную информацию
        if (status.modelLoaded && status.modelPath) {
          // В renderer процессе мы не можем получить размер файла напрямую
          // Это должно быть реализовано через IPC
          updateMetrics({
            modelSize: 0 // Будет заполнено через IPC
          })
        }
      } else {
        updateMetrics({
          lastError: status.error
        })
      }
    } catch (error) {
      addLog({
        level: 'error',
        source: 'system',
        message: 'Failed to get ML status',
        data: error
      })
    }
  }, [addLog, updateMetrics])

  // Фильтрованные логи
  const filteredLogs = state.entries.filter((entry) => {
    const levelMatch = state.filters.level.includes(entry.level)
    const sourceMatch = state.filters.source.includes(entry.source)
    const searchMatch =
      state.filters.search === '' ||
      entry.message.toLowerCase().includes(state.filters.search.toLowerCase()) ||
      (entry.data &&
        JSON.stringify(entry.data).toLowerCase().includes(state.filters.search.toLowerCase()))

    return levelMatch && sourceMatch && searchMatch
  })

  // Обновить фильтры
  const updateFilters = useCallback((filters: Partial<LogsState['filters']>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters }
    }))
  }, [])

  // Очистить логи
  const clearLogs = useCallback(() => {
    logsRef.current = []
    setState((prev) => ({
      ...prev,
      entries: []
    }))
  }, [])

  // Переключить автоскролл
  const toggleAutoScroll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      autoScroll: !prev.autoScroll
    }))
  }, [])

  // Запустить генерацию с логированием
  const runCompletionWithLogging = useCallback(
    async (
      prompt: string,
      options?: { maxTokens?: number; temperature?: number; topP?: number; stop?: string[] }
    ) => {
      const startTime = Date.now()

      addLog({
        level: 'info',
        source: 'ml',
        message: 'Starting text generation',
        data: { promptLength: prompt.length, options }
      })

      try {
        const result = await ipc.runCompletion(prompt, options)

        if (typeof result === 'string') {
          const generationTime = Date.now() - startTime
          const tokensPerSecond = result.length / (generationTime / 1000)

          updateMetrics({
            lastGenerationTime: generationTime,
            totalGenerations: metricsRef.current.totalGenerations + 1,
            averageTokensPerSecond: tokensPerSecond
          })

          addLog({
            level: 'info',
            source: 'ml',
            message: 'Text generation completed',
            data: {
              generationTime,
              resultLength: result.length,
              tokensPerSecond: tokensPerSecond.toFixed(2)
            }
          })

          return result
        } else {
          addLog({
            level: 'error',
            source: 'ml',
            message: 'Text generation failed',
            data: result
          })
          throw new Error(result.error || 'Unknown error')
        }
      } catch (error) {
        addLog({
          level: 'error',
          source: 'ml',
          message: 'Text generation error',
          data: error
        })
        throw error
      }
    },
    [addLog, updateMetrics]
  )

  // Инициализация - получение статуса
  useEffect(() => {
    refreshMLStatus()

    // Обновляем статус каждые 5 секунд
    const interval = setInterval(refreshMLStatus, 5000)
    return () => clearInterval(interval)
  }, [refreshMLStatus])

  return {
    logs: filteredLogs,
    metrics: state.metrics,
    filters: state.filters,
    autoScroll: state.autoScroll,
    addLog,
    updateMetrics,
    updateFilters,
    clearLogs,
    toggleAutoScroll,
    runCompletionWithLogging,
    refreshMLStatus
  }
}
