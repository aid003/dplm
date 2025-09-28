import { Worker } from 'worker_threads'
import { join } from 'path'
import { existsSync, readdirSync, statSync } from 'fs'
// electron app imported in config.modelsBasePath
import { TIMEOUTS, AUTO_LOAD_MODEL } from '../config'

type InitResponse = {
  type: 'init'
  ok?: boolean
  backend?: string
  modelLoaded?: boolean
  error?: string
}
type StatusResponse = {
  type: 'status'
  ok?: boolean
  backend: string
  modelLoaded: boolean
  modelPath?: string | null
  error?: string
}
type RunResponse = { type: 'run'; ok?: boolean; text?: string; error?: string }

export class MLService {
  private worker: Worker

  constructor() {
    // electron-vite builds worker entry as out/main/ml_worker.js (by our rollup input name)
    // Fallback path (ml/worker.js) kept for flexibility.
    const candidates = [join(__dirname, 'ml_worker.js'), join(__dirname, 'ml', 'worker.js')]
    const workerPath = candidates.find((p) => existsSync(p)) || candidates[0]
    // Pass through MODEL_DIR if present in environment; do not force resources/models
    const env: NodeJS.Dict<string> = {}
    if (process.env.MODEL_DIR) env.MODEL_DIR = process.env.MODEL_DIR
    if (process.env.LLAMA_MODEL_PATH) env.LLAMA_MODEL_PATH = process.env.LLAMA_MODEL_PATH
    this.worker = new Worker(workerPath, { env })
  }

  init(customModelDir?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const onMsg = (m: InitResponse): void => {
        if (m && m.type === 'init' && m.ok === false) {
          off()
          reject(new Error(m.error || 'ML init failed'))
          return
        }
        if (m?.type === 'init') {
          off()
          if (m.ok) {
            resolve()
          } else {
            reject(new Error(m.error || 'ML init failed'))
          }
        }
      }
      const off = (): void => {
        this.worker.off('message', onMsg)
      }
      this.worker.on('message', onMsg)
      if (AUTO_LOAD_MODEL) {
        const dir = customModelDir ?? process.env.MODEL_DIR
        const modelPath = dir ? findPreferredGguf(dir) : process.env.LLAMA_MODEL_PATH || null
        this.worker.postMessage({ type: 'init', modelPath })
      }
      // Safety timeout for init (does not reject app flow)
      setTimeout(() => {
        off()
        // non-fatal: let app continue; status() will reveal readiness later
        resolve()
      }, TIMEOUTS.initSafetyMs)
    })
  }

  status(): Promise<{ backend: string; modelLoaded: boolean; modelPath?: string | null }> {
    return new Promise((resolve, reject) => {
      const onMsg = (m: StatusResponse): void => {
        if (m?.type === 'status') {
          off()
          m.ok
            ? resolve({ backend: m.backend, modelLoaded: m.modelLoaded, modelPath: m.modelPath })
            : reject(new Error(m.error))
        }
      }
      const off = (): void => {
        this.worker.off('message', onMsg)
      }
      this.worker.on('message', onMsg)
      this.worker.postMessage({ type: 'status' })
      // Timeout to prevent UI hangs
      setTimeout(() => {
        off()
        resolve({ backend: 'cpu', modelLoaded: false, modelPath: null })
      }, TIMEOUTS.statusMs)
    })
  }

  run(
    prompt: string,
    options?: { maxTokens?: number; temperature?: number; topP?: number; stop?: string[] }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const onMsg = (m: RunResponse): void => {
        if (m?.type === 'run') {
          off()
          m.ok && typeof m.text === 'string'
            ? resolve(m.text)
            : reject(new Error(m.error || 'LLM run failed'))
        }
      }
      const off = (): void => {
        this.worker.off('message', onMsg)
      }
      this.worker.on('message', onMsg)
      this.worker.postMessage({ type: 'run', prompt, options })
      // Long timeout for generation
      setTimeout(() => {
        off()
        reject(new Error('Generation timeout'))
      }, TIMEOUTS.runMs)
    })
  }

  terminate(): void {
    this.worker.terminate().catch(() => {
      /* ignore terminate errors */
    })
  }

  listModels(rootDir?: string): { name: string; path: string }[] {
    const dir = rootDir ?? process.env.MODEL_DIR ?? ''
    const out: { name: string; path: string }[] = []
    const walk = (d: string): void => {
      if (!existsSync(d)) return
      for (const name of readdirSync(d)) {
        const p = join(d, name)
        const st = statSync(p)
        if (st.isDirectory()) {
          walk(p)
        } else if (name.toLowerCase().endsWith('.gguf')) {
          out.push({ name, path: p })
        }
      }
    }
    walk(dir)
    return out
  }

  async setModel(
    modelPath: string,
    opts?: { nCtx?: number; gpuLayers?: number; threads?: number }
  ): Promise<void> {
    // Re-initialize within the same worker to avoid downtime
    await new Promise<void>((resolve, reject) => {
      const onMsg = (m: InitResponse): void => {
        if (m && m.type === 'init' && m.ok === false) {
          off()
          reject(new Error(m.error || 'Model switch failed'))
          return
        }
        if (m?.type === 'init') {
          off()
          m.ok ? resolve() : reject(new Error(m.error || 'Model switch failed'))
        }
      }
      const off = (): void => {
        this.worker.off('message', onMsg)
      }
      this.worker.on('message', onMsg)
      this.worker.postMessage({ type: 'init', modelPath, ...opts })
      setTimeout(() => {
        off()
        reject(new Error('Model init timeout'))
      }, TIMEOUTS.setModelMs)
    })
  }
}

function findPreferredGguf(dir: string): string | null {
  if (!existsSync(dir)) return null
  const found: { path: string; size: number; name: string }[] = []
  const stack = [dir]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (!existsSync(current)) continue
    for (const entry of readdirSync(current)) {
      const full = join(current, entry)
      const st = statSync(full)
      if (st.isDirectory()) {
        stack.push(full)
      } else if (entry.toLowerCase().endsWith('.gguf')) {
        found.push({ path: full, size: st.size, name: entry.toLowerCase() })
      }
    }
  }
  if (!found.length) return null
  found.sort((a, b) => {
    const aScore = quantRank(a.name)
    const bScore = quantRank(b.name)
    if (aScore !== bScore) return aScore - bScore
    if (a.size !== b.size) return a.size - b.size
    return a.path.localeCompare(b.path)
  })
  return found[0]?.path ?? null
}

function quantRank(name: string): number {
  const order = [
    'q4_k_m',
    'q4_0',
    'q4',
    'q5',
    'q3',
    'q6',
    'q8',
    'q2',
    'q1',
    'int4',
    'int5',
    'int8'
  ] as const
  for (let i = 0; i < order.length; i += 1) {
    if (name.includes(order[i])) return i
  }
  if (name.includes('fp16') || name.includes('f16')) return 50
  if (name.includes('fp32') || name.includes('f32')) return 60
  return 40
}
