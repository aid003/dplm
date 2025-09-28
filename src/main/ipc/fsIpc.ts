import { dialog, ipcMain } from 'electron'
import { log } from '../log/logger'

export function registerFsIpc(): void {
  ipcMain.handle('fs:chooseDirectory', async () => {
    try {
      const res = await dialog.showOpenDialog({ properties: ['openDirectory'] })
      if (res.canceled || res.filePaths.length === 0) return { canceled: true }
      return { path: res.filePaths[0] }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.error('[ipc] fs:chooseDirectory error', msg)
      return { error: msg }
    }
  })
}

