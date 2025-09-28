// Keep empty imports removed; config uses process.env

// Environment variable keys
export const MODEL_DIR_ENV = 'MODEL_DIR'
export const LLAMA_MODEL_PATH_ENV = 'LLAMA_MODEL_PATH'

// Timeouts and durations (ms)
export const TIMEOUTS = {
  initSafetyMs: 8000,
  statusMs: 2000,
  runMs: 120000,
  setModelMs: 120000
} as const

// Control whether to auto-load the first model on startup
export const AUTO_LOAD_MODEL = false as const

// Models base path under resources
// Legacy helper: no longer used to force resources/models.
// Kept for compatibility if some code still imports it.
// Now returns MODEL_DIR from env when present, otherwise empty string.
export function modelsBasePath(): string {
  return process.env.MODEL_DIR || ''
}
