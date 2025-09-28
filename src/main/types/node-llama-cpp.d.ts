declare module 'node-llama-cpp' {
  export class LlamaModel {
    constructor(opts: { modelPath: string })
  }
  export class LlamaContext {
    constructor(opts: {
      model: LlamaModel
      contextSize?: number
      gpuLayers?: number
      threads?: number
    })
  }
  export class LlamaCompletionSession {
    constructor(opts: { context: LlamaContext })
    generate(
      prompt: string,
      options?: { maxTokens?: number; temperature?: number; topP?: number; stop?: string[] }
    ): Promise<string>
  }
  export class LlamaChatSession {
    constructor(opts: { context: LlamaContext })
    prompt(
      messages: { role: 'system' | 'user' | 'assistant'; content: string }[] | string,
      options?: { maxTokens?: number; temperature?: number; topP?: number; stop?: string[] }
    ): Promise<string>
  }
}
