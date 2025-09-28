import { parentPort } from 'worker_threads'
import { join } from 'path'
import { existsSync, readdirSync, statSync } from 'fs'
import { MODEL_DIR_ENV, LLAMA_MODEL_PATH_ENV } from '../config'
import { log } from '../log/logger'

type InitMsg = {
  type: 'init'
  modelPath?: string
  nCtx?: number
  gpuLayers?: number
  threads?: number
}
type RunMsg = {
  type: 'run'
  prompt: string
  options?: { maxTokens?: number; temperature?: number; topP?: number; stop?: string[] }
}
type StatusMsg = { type: 'status' }
type AnyMsg = InitMsg | RunMsg | StatusMsg

type LlamaCompletionOptionsLite = {
  contextSequence: unknown
  autoDisposeSequence?: boolean
}

type LlamaModule = {
  getLlama: (...args: unknown[]) => Promise<LlamaRuntime>
  LlamaCompletion: new (options: LlamaCompletionOptionsLite) => LlamaCompletionInst
}

type LlamaRuntime = {
  loadModel: (options: { modelPath: string; gpuLayers?: number }) => Promise<LlamaModelInst>
}

type LlamaModelInst = {
  dispose: () => Promise<void>
  createContext: (options?: { contextSize?: number; threads?: number }) => Promise<LlamaContextInst>
  gpuLayers?: number | null
}

type LlamaContextInst = {
  dispose: () => Promise<void>
  getSequence: () => unknown
}

type LlamaCompletionInst = {
  dispose: (options?: { disposeSequence?: boolean }) => void
  readonly disposed?: boolean
  generateCompletion: (
    prompt: string,
    options?: {
      maxTokens?: number
      temperature?: number
      topP?: number
      customStopTriggers?: readonly string[]
    }
  ) => Promise<string>
}

let llamaModule: LlamaModule | null = null
let llamaRuntime: LlamaRuntime | null = null
let backend: 'cpu' | 'gpu' = 'cpu'
let modelPathResolved: string | null = null
let modelInst: LlamaModelInst | null = null
let contextInst: LlamaContextInst | null = null
let completionInst: LlamaCompletionInst | null = null

async function ensureLlama(): Promise<LlamaModule> {
  if (llamaModule) return llamaModule
  const imported = await import('node-llama-cpp')
  const mod = imported as unknown as LlamaModule
  if (typeof mod.getLlama !== 'function' || typeof mod.LlamaCompletion !== 'function') {
    throw new Error('node-llama-cpp module missing expected exports')
  }
  llamaModule = mod
  return mod
}

async function ensureLlamaRuntime(): Promise<{ mod: LlamaModule; runtime: LlamaRuntime }> {
  const mod = await ensureLlama()
  if (!llamaRuntime) {
    llamaRuntime = await mod.getLlama()
  }
  return { mod, runtime: llamaRuntime }
}

async function disposeModelResources(): Promise<void> {
  try {
    completionInst?.dispose({ disposeSequence: true })
  } catch (err) {
    log.warn('[llama] dispose completion failed', err)
  }
  completionInst = null

  if (contextInst) {
    try {
      await contextInst.dispose()
    } catch (err) {
      log.warn('[llama] dispose context failed', err)
    }
  }
  contextInst = null

  if (modelInst) {
    try {
      await modelInst.dispose()
    } catch (err) {
      log.warn('[llama] dispose model failed', err)
    }
  }
  modelInst = null
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

function statusPayload(): {
  ok: true
  type: 'status'
  backend: 'cpu' | 'gpu'
  modelLoaded: boolean
  modelPath: string | null
} {
  return {
    ok: true,
    type: 'status',
    backend,
    modelLoaded: Boolean(completionInst && !completionInst.disposed),
    modelPath: modelPathResolved
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'Object is disposed') {
      return (
        'Model initialization failed because the llama.cpp bindings disposed resources early. ' +
        'This often indicates the model is too large for the available memory. Try a smaller quantized .gguf file.'
      )
    }
    return error.message
  }
  return String(error)
}

parentPort!.on('message', async (msg: AnyMsg): Promise<void> => {
  try {
    if (msg.type === 'status') {
      parentPort!.postMessage(statusPayload())
      return
    }

    if (msg.type === 'init') {
      log.info('[llama] init start', msg.modelPath ?? '(auto)')
      const t0 = Date.now()
      const { mod, runtime } = await ensureLlamaRuntime()
      await disposeModelResources()
      const fromEnv = process.env[LLAMA_MODEL_PATH_ENV]
      const hintDir = process.env[MODEL_DIR_ENV]
      const provided = msg.modelPath
      const resolved = provided || fromEnv || (hintDir ? findPreferredGguf(hintDir) : null)
      if (!resolved)
        throw new Error(
          'LLAMA model not found. Provide modelPath or set LLAMA_MODEL_PATH or put .gguf under MODEL_DIR'
        )
      modelPathResolved = resolved

      try {
        const modelOptions: Parameters<typeof runtime.loadModel>[0] = { modelPath: resolved }
        if (typeof msg.gpuLayers === 'number') {
          modelOptions.gpuLayers = msg.gpuLayers
        }

        modelInst = await runtime.loadModel(modelOptions)

        const contextOptions: Parameters<typeof modelInst.createContext>[0] = {}
        if (typeof msg.nCtx === 'number') {
          contextOptions.contextSize = msg.nCtx
        }
        if (typeof msg.threads === 'number') {
          contextOptions.threads = msg.threads
        }

        contextInst = await modelInst.createContext(contextOptions)
        const sequence = contextInst.getSequence()
        completionInst = new mod.LlamaCompletion({
          contextSequence: sequence,
          autoDisposeSequence: true
        })
        const gpuLayerCount = Number(modelInst.gpuLayers ?? 0)
        backend = gpuLayerCount > 0 ? 'gpu' : 'cpu'
      } catch (err) {
        await disposeModelResources()
        throw err
      }
      const dt = ((Date.now() - t0) / 1000).toFixed(1)
      log.info(`[llama] init ok in ${dt}s: ${resolved}`)
      parentPort!.postMessage({ ok: true, type: 'init', backend, modelLoaded: true })
      return
    }

    if (msg.type === 'run') {
      if (!completionInst || completionInst.disposed)
        throw new Error('Model/session is not initialized')
      const text = await completionInst.generateCompletion(msg.prompt, {
        maxTokens: msg.options?.maxTokens ?? 128,
        temperature: msg.options?.temperature ?? 0.7,
        topP: msg.options?.topP ?? 0.9,
        customStopTriggers: msg.options?.stop
      })
      parentPort!.postMessage({ ok: true, type: 'run', text })
      return
    }
  } catch (e: unknown) {
    const message = describeError(e)
    log.error('[llama] worker error:', message)
    // include current msg type so main can react without timeouts
    parentPort!.postMessage({ ok: false, type: msg.type, error: message })
  }
})
