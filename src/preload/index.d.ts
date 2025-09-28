import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      runCompletion(
        prompt: string,
        options?: { maxTokens?: number; temperature?: number; topP?: number; stop?: string[] }
      ): Promise<string | { error: string }>
      // Backward-compatible alias; now expects prompt string
      runInference(input: unknown): Promise<string | { error: string }>
      getMlStatus(): Promise<{ backend?: string; modelLoaded?: boolean; modelPath?: string | null; error?: string }>
      listModels(rootDir?: string): Promise<{ name: string; path: string }[] | { error: string }>
      setModel(
        modelPath: string,
        opts?: { nCtx?: number; gpuLayers?: number; threads?: number }
      ): Promise<{ ok?: true; error?: string }>
      chooseDirectory(): Promise<{ path: string } | { canceled: true } | { error: string }>
      getSettings(): Promise<{ modelDir?: string; modelPath?: string }>
      setModelPrefs(prefs: { modelDir?: string; modelPath?: string }): Promise<{ modelDir?: string; modelPath?: string }>
    }
  }
}
