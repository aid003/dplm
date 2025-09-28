import { ipcMain } from 'electron'
import { loadSettings, saveSettings } from '../settings/appSettings'
import { log } from '../log/logger'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', async () => {
    const s = loadSettings()
    log.info('[ipc] settings:get', s)
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
}

