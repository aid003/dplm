import { useState } from 'react'
import styles from './TestGeneration.module.css'

interface TestGenerationProps {
  onRunCompletion: (prompt: string, options?: any) => Promise<string>
}

export function TestGeneration({ onRunCompletion }: TestGenerationProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState('')
  const [options, setOptions] = useState({
    maxTokens: 128,
    temperature: 0.7,
    topP: 0.9
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setResult('')

    try {
      const response = await onRunCompletion(prompt, options)
      setResult(response)
    } catch (error) {
      setResult(`Ошибка: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Тестовая генерация</h3>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Промпт:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Введите промпт для генерации..."
            className={styles.textarea}
            rows={3}
            disabled={isGenerating}
          />
        </div>

        <div className={styles.options}>
          <div className={styles.option}>
            <label className={styles.label}>Max Tokens:</label>
            <input
              type="number"
              value={options.maxTokens}
              onChange={(e) => setOptions(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 128 }))}
              className={styles.input}
              min="1"
              max="2048"
              disabled={isGenerating}
            />
          </div>

          <div className={styles.option}>
            <label className={styles.label}>Temperature:</label>
            <input
              type="number"
              value={options.temperature}
              onChange={(e) => setOptions(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
              className={styles.input}
              min="0"
              max="2"
              step="0.1"
              disabled={isGenerating}
            />
          </div>

          <div className={styles.option}>
            <label className={styles.label}>Top P:</label>
            <input
              type="number"
              value={options.topP}
              onChange={(e) => setOptions(prev => ({ ...prev, topP: parseFloat(e.target.value) || 0.9 }))}
              className={styles.input}
              min="0"
              max="1"
              step="0.1"
              disabled={isGenerating}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className={styles.button}
        >
          {isGenerating ? '🔄 Генерация...' : '🚀 Запустить генерацию'}
        </button>
      </form>

      {result && (
        <div className={styles.result}>
          <h4 className={styles.resultTitle}>Результат:</h4>
          <div className={styles.resultContent}>
            {result}
          </div>
        </div>
      )}
    </div>
  )
}
