import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  runCompletion: (
    prompt: string,
    options?: { maxTokens?: number; temperature?: number; topP?: number; stop?: string[] }
  ) => ipcRenderer.invoke('ml:run', prompt, options) as Promise<string | { error: string }>,
  // Backward-compatible alias
  runInference: (input: unknown) =>
    typeof input === 'string'
      ? (ipcRenderer.invoke('ml:run', input) as Promise<string | { error: string }>)
      : Promise.resolve({
          error: 'runInference expects a string prompt after migrating to llama.cpp'
        }),
  getMlStatus: () =>
    ipcRenderer.invoke('ml:status') as Promise<{
      backend?: string
      modelLoaded?: boolean
      modelPath?: string | null
      error?: string
    }>,
  listModels: (rootDir?: string) =>
    ipcRenderer.invoke('ml:listModels', rootDir) as Promise<
      { name: string; path: string }[] | { error: string }
    >,
  setModel: (modelPath: string, opts?: { nCtx?: number; gpuLayers?: number; threads?: number }) =>
    ipcRenderer.invoke('ml:setModel', modelPath, opts) as Promise<{ ok?: true; error?: string }>,
  chooseDirectory: () =>
    ipcRenderer.invoke('fs:chooseDirectory') as Promise<
      | { path: string }
      | { canceled: true }
      | { error: string }
    >,
  getSettings: () => ipcRenderer.invoke('settings:get') as Promise<{ modelDir?: string; modelPath?: string }>,
  setModelPrefs: (prefs: { modelDir?: string; modelPath?: string }) =>
    ipcRenderer.invoke('settings:setModelPrefs', prefs) as Promise<{ modelDir?: string; modelPath?: string }>
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
