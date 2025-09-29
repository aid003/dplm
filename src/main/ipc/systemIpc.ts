import { ipcMain } from 'electron'
import { log } from '../log/logger'
import { existsSync, statSync } from 'fs'

export function registerSystemIpc(): void {
  ipcMain.handle('system:info', async () => {
    log.info('[ipc] system:info')
    try {
      const memoryUsage = process.memoryUsage()

      // Получаем общую память системы
      let totalSystemMemory = 0
      let usedSystemMemory = 0

      if (process.platform === 'linux' && existsSync('/proc/meminfo')) {
        try {
          const meminfo = require('fs').readFileSync('/proc/meminfo', 'utf8')
          const lines = meminfo.split('\n')

          // MemTotal: общая память
          const memTotalLine = lines.find((line) => line.startsWith('MemTotal:'))
          if (memTotalLine) {
            const memTotal = parseInt(memTotalLine.split(/\s+/)[1]) * 1024 // KB to bytes
            totalSystemMemory = memTotal
          }

          // MemAvailable: доступная память (более точно чем MemFree)
          const memAvailableLine = lines.find((line) => line.startsWith('MemAvailable:'))
          if (memAvailableLine) {
            const memAvailable = parseInt(memAvailableLine.split(/\s+/)[1]) * 1024 // KB to bytes
            usedSystemMemory = totalSystemMemory - memAvailable
          } else {
            // Fallback к MemFree если MemAvailable нет
            const memFreeLine = lines.find((line) => line.startsWith('MemFree:'))
            if (memFreeLine) {
              const memFree = parseInt(memFreeLine.split(/\s+/)[1]) * 1024 // KB to bytes
              usedSystemMemory = totalSystemMemory - memFree
            }
          }
        } catch (e) {
          log.warn('[system] Failed to read /proc/meminfo:', e)
        }
      }

      // Fallback для других платформ или если не удалось прочитать /proc/meminfo
      if (totalSystemMemory === 0) {
        // Используем os.totalmem() и os.freemem() если доступны
        try {
          const os = require('os')
          totalSystemMemory = os.totalmem()
          usedSystemMemory = totalSystemMemory - os.freemem()
        } catch (e) {
          // Последний fallback - используем heap память * 10
          totalSystemMemory = memoryUsage.heapTotal * 10
          usedSystemMemory = memoryUsage.heapUsed * 10
        }
      }

      const result = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: Math.round(process.uptime()),
        memoryUsage: {
          used: Math.round(usedSystemMemory / 1024 / 1024), // MB
          total: Math.round(totalSystemMemory / 1024 / 1024) // MB
        },
        processMemory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
          rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
        }
      }

      log.info('[system] Memory info:', {
        systemMemory: `${result.memoryUsage.used}MB / ${result.memoryUsage.total}MB`,
        processRSS: `${result.processMemory.rss}MB`,
        processHeap: `${result.processMemory.heapUsed}MB / ${result.processMemory.heapTotal}MB`
      })

      return result
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.error('[ipc] system:info error', msg)
      return { error: msg }
    }
  })

  ipcMain.handle('system:getModelSize', async (_e, modelPath: string) => {
    log.info('[ipc] system:getModelSize', { modelPath })
    try {
      if (existsSync(modelPath)) {
        const stats = statSync(modelPath)
        return { size: Math.round(stats.size / 1024 / 1024) } // MB
      }
      return { error: 'Model file not found' }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.error('[ipc] system:getModelSize error', msg)
      return { error: msg }
    }
  })
}
