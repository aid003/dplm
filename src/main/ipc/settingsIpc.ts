import { ipcMain } from 'electron'
import { loadSettings, saveSettings, AppSettings } from '../settings/appSettings'
import { log } from '../log/logger'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', async () => {
    const s = loadSettings()
    log.info('[ipc] settings:get')
    return s
  })

  ipcMain.handle('settings:set', async (_e, payload: Partial<AppSettings>) => {
    const s = saveSettings(payload)
    log.info('[ipc] settings:set', { keys: Object.keys(payload) })
    return s
  })

  ipcMain.handle(
    'settings:setModelPrefs',
    async (_e, payload: { modelDir?: string; modelPath?: string }) => {
      const s = saveSettings({ modelDir: payload?.modelDir, modelPath: payload?.modelPath })
      log.info('[ipc] settings:setModelPrefs', s)
      return s
    }
  )

  ipcMain.handle('settings:reset', async () => {
    const s = saveSettings({})
    log.info('[ipc] settings:reset')
    return s
  })

  ipcMain.handle('settings:export', async () => {
    const s = loadSettings()
    log.info('[ipc] settings:export')
    return s
  })

  ipcMain.handle('settings:import', async (_e, settings: AppSettings) => {
    const s = saveSettings(settings)
    log.info('[ipc] settings:import')
    return s
  })
}
