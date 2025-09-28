import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export type AppSettings = {
  modelDir?: string
  modelPath?: string
}

const settingsFilePath = (): string => {
  const dir = app.getPath('userData')
  return join(dir, 'settings.json')
}

export function loadSettings(): AppSettings {
  try {
    const file = settingsFilePath()
    if (!existsSync(file)) return {}
    const raw = readFileSync(file, 'utf-8')
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed ? (parsed as AppSettings) : {}
  } catch {
    return {}
  }
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  const file = settingsFilePath()
  const dir = file.substring(0, file.lastIndexOf('/'))
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const current = loadSettings()
  const next: AppSettings = { ...current, ...patch }
  writeFileSync(file, JSON.stringify(next, null, 2), 'utf-8')
  return next
}

