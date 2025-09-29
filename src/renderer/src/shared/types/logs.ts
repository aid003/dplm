export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  source: 'llama' | 'ipc' | 'ml' | 'system'
  message: string
  data?: unknown
  category?: string
}

export interface MLMetrics {
  modelPath: string | null
  backend: 'cpu' | 'gpu'
  modelLoaded: boolean
  gpuLayers: number
  initTime?: number
  lastGenerationTime?: number
  totalGenerations: number
  averageTokensPerSecond?: number
  modelSize?: number
  contextSize?: number
  threads?: number
  memoryUsage?: {
    used: number
    total: number
  }
  processMemory?: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }
  systemInfo?: {
    platform: string
    arch: string
    nodeVersion: string
  }
  lastError?: string
  uptime?: number
}

export interface LogsState {
  entries: LogEntry[]
  metrics: MLMetrics
  filters: {
    level: LogLevel[]
    source: string[]
    search: string
  }
  autoScroll: boolean
}
