export const ipc = {
  // Example: simple ping to main process
  ping: (): void => window.electron.ipcRenderer.send('ping'),
  runCompletion: (
    prompt: string,
    options?: { maxTokens?: number; temperature?: number; topP?: number; stop?: string[] }
  ) => window.api.runCompletion(prompt, options),
  // legacy alias
  runInference: (input: unknown) => window.api.runInference(input),
  getMlStatus: () => window.api.getMlStatus(),
  listModels: (rootDir?: string) => window.api.listModels(rootDir),
  setModel: (modelPath: string, opts?: { nCtx?: number; gpuLayers?: number; threads?: number }) =>
    window.api.setModel(modelPath, opts),
  chooseDirectory: () => window.api.chooseDirectory(),
  getSystemInfo: () => window.api.getSystemInfo(),
  getSettings: () => window.api.getSettings(),
  setSettings: (settings: any) => window.api.setSettings(settings),
  resetSettings: () => window.api.resetSettings(),
  exportSettings: () => window.api.exportSettings(),
  importSettings: (settings: any) => window.api.importSettings(settings)
}

export type {} // keep as module for future shared API additions
