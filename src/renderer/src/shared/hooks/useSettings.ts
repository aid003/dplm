import { useState, useEffect, useCallback } from 'react'
import { ipc } from '../api/ipc'

export interface AppSettings {
  modelDir?: string
  modelPath?: string
  generation: {
    maxTokens: number
    temperature: number
    topP: number
    topK: number
    repeatPenalty: number
    repeatPenaltyWindow: number
    stopSequences: string[]
  }
  performance: {
    contextSize: number
    threads: number
    gpuLayers: number
    batchSize: number
    useMmap: boolean
    useMlock: boolean
    lowVram: boolean
  }
  ui: {
    theme: 'dark' | 'light' | 'auto'
    language: 'ru' | 'en'
    fontSize: number
    autoSave: boolean
    autoSaveInterval: number
    showLineNumbers: boolean
    wordWrap: boolean
    minimap: boolean
  }
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    maxLogEntries: number
    enableFileLogging: boolean
    logToConsole: boolean
    logPerformance: boolean
  }
  app: {
    autoStart: boolean
    minimizeToTray: boolean
    checkUpdates: boolean
    telemetry: boolean
    crashReporting: boolean
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузить настройки
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const loadedSettings = await ipc.getSettings()
      setSettings(loadedSettings)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // Сохранить настройки
  const saveSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      setError(null)
      const savedSettings = await ipc.setSettings(newSettings)
      setSettings(savedSettings)
      return savedSettings
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    }
  }, [])

  // Сбросить настройки
  const resetSettings = useCallback(async () => {
    try {
      setError(null)
      const defaultSettings = await ipc.resetSettings()
      setSettings(defaultSettings)
      return defaultSettings
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    }
  }, [])

  // Экспорт настроек
  const exportSettings = useCallback(async () => {
    try {
      setError(null)
      return await ipc.exportSettings()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    }
  }, [])

  // Импорт настроек
  const importSettings = useCallback(async (settingsToImport: AppSettings) => {
    try {
      setError(null)
      const importedSettings = await ipc.importSettings(settingsToImport)
      setSettings(importedSettings)
      return importedSettings
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    }
  }, [])

  // Обновить конкретную секцию настроек
  const updateSection = useCallback(
    async <K extends keyof AppSettings>(section: K, values: Partial<AppSettings[K]>) => {
      if (!settings) return

      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          ...values
        }
      }

      return await saveSettings(newSettings)
    },
    [settings, saveSettings]
  )

  // Загрузить настройки при инициализации
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,
    updateSection
  }
}
