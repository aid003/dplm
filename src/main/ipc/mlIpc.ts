import { ipcMain } from 'electron'
import { MLService } from '../ml'
import { log } from '../log/logger'

export function registerMlIpc(ml: MLService): void {
  ipcMain.handle('ml:status', async () => {
    log.info('[ipc] ml:status')
    try {
      return await ml.status()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.error('[ipc] ml:status error', msg)
      return { error: msg }
    }
  })

  ipcMain.handle('ml:listModels', async (_e, rootDir?: string) => {
    log.info('[ipc] ml:listModels', { rootDir })
    try {
      return ml.listModels(rootDir)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.error('[ipc] ml:listModels error', msg)
      return { error: msg }
    }
  })

  ipcMain.handle(
    'ml:run',
    async (
      _e,
      prompt: string,
      options?: { maxTokens?: number; temperature?: number; topP?: number; stop?: string[] }
    ) => {
      log.info('[ipc] ml:run', { promptLen: prompt?.length ?? 0, opts: options })
      try {
        const res = await ml.run(prompt, options)
        log.info('[ipc] ml:run ok', { outLen: res?.length ?? 0 })
        return res
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        log.error('[ipc] ml:run error', msg)
        return { error: msg }
      }
    }
  )

  ipcMain.handle(
    'ml:setModel',
    async (
      _e,
      modelPath: string,
      opts?: { nCtx?: number; gpuLayers?: number; threads?: number }
    ) => {
      log.info('[ipc] ml:setModel', { modelPath, opts })
      try {
        await ml.setModel(modelPath, opts)
        log.info('[ipc] ml:setModel ok')
        return { ok: true }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        log.error('[ipc] ml:setModel error', msg)
        return { error: msg }
      }
    }
  )
}
