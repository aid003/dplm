import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export type AppSettings = {
  // Модель и пути
  modelDir?: string
  modelPath?: string

  // Параметры генерации
  generation: {
    maxTokens: number
    temperature: number
    topP: number
    topK: number
    repeatPenalty: number
    repeatPenaltyWindow: number
    stopSequences: string[]
  }

  // Параметры производительности
  performance: {
    contextSize: number
    threads: number
    gpuLayers: number
    batchSize: number
    useMmap: boolean
    useMlock: boolean
    lowVram: boolean
  }

  // Настройки интерфейса
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

  // Настройки логирования
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    maxLogEntries: number
    enableFileLogging: boolean
    logToConsole: boolean
    logPerformance: boolean
  }

  // Настройки приложения
  app: {
    autoStart: boolean
    minimizeToTray: boolean
    checkUpdates: boolean
    telemetry: boolean
    crashReporting: boolean
  }
}

const settingsFilePath = (): string => {
  const dir = app.getPath('userData')
  return join(dir, 'settings.json')
}

export const defaultSettings: AppSettings = {
  generation: {
    maxTokens: 512,
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    repeatPenalty: 1.1,
    repeatPenaltyWindow: 64,
    stopSequences: ['\n\n', 'Human:', 'Assistant:']
  },
  performance: {
    contextSize: 2048,
    threads: 4,
    gpuLayers: 0,
    batchSize: 512,
    useMmap: true,
    useMlock: false,
    lowVram: false
  },
  ui: {
    theme: 'dark',
    language: 'ru',
    fontSize: 14,
    autoSave: true,
    autoSaveInterval: 30,
    showLineNumbers: true,
    wordWrap: true,
    minimap: false
  },
  logging: {
    level: 'info',
    maxLogEntries: 1000,
    enableFileLogging: true,
    logToConsole: true,
    logPerformance: true
  },
  app: {
    autoStart: false,
    minimizeToTray: true,
    checkUpdates: true,
    telemetry: false,
    crashReporting: true
  }
}

export function loadSettings(): AppSettings {
  try {
    const file = settingsFilePath()
    if (!existsSync(file)) return defaultSettings
    const raw = readFileSync(file, 'utf-8')
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed) {
      // Мержим с настройками по умолчанию для новых полей
      return mergeSettings(defaultSettings, parsed as AppSettings)
    }
    return defaultSettings
  } catch {
    return defaultSettings
  }
}

function mergeSettings(defaults: AppSettings, loaded: AppSettings): AppSettings {
  return {
    ...defaults,
    ...loaded,
    generation: { ...defaults.generation, ...loaded.generation },
    performance: { ...defaults.performance, ...loaded.performance },
    ui: { ...defaults.ui, ...loaded.ui },
    logging: { ...defaults.logging, ...loaded.logging },
    app: { ...defaults.app, ...loaded.app }
  }
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  const file = settingsFilePath()
  const dir = file.substring(0, file.lastIndexOf('/'))
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const current = loadSettings()

  // Правильно мержим настройки, сохраняя структуру
  const next: AppSettings = {
    ...current,
    ...patch,
    generation: { ...current.generation, ...patch.generation },
    performance: { ...current.performance, ...patch.performance },
    ui: { ...current.ui, ...patch.ui },
    logging: { ...current.logging, ...patch.logging },
    app: { ...current.app, ...patch.app }
  }

  writeFileSync(file, JSON.stringify(next, null, 2), 'utf-8')
  return next
}
