import { useState, useEffect, useCallback } from 'react'
import { useSettings } from '../../../shared/hooks/useSettings'
import { SettingsSection, SettingsField, NumberInput, SliderInput, ToggleSwitch } from '../../../shared/ui/settings'
import { useModal } from '../../../shared/ui/modal'
import { ipc } from '../../../shared/api/ipc'
import styles from './SettingsPage.module.css'

type ModelInfo = { name: string; path: string }

export default function SettingsPage(): React.JSX.Element {
  const { settings, loading, error, updateSection, saveSettings } = useSettings()
  const modal = useModal()
  const [models, setModels] = useState<ModelInfo[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [applyingModel, setApplyingModel] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Загрузить модели
  const loadModels = useCallback(async () => {
    if (!settings?.modelDir) return
    
    setModelsLoading(true)
    setModelsError(null)
    try {
      const list = await ipc.listModels(settings.modelDir)
      if (Array.isArray(list)) {
        setModels(list)
      } else {
        setModelsError(list?.error || 'Failed to list models')
        setModels([])
      }
    } catch (e) {
      setModelsError(e instanceof Error ? e.message : String(e))
    } finally {
      setModelsLoading(false)
    }
  }, [settings?.modelDir])

  useEffect(() => {
    if (settings?.modelDir) {
      loadModels()
    }
  }, [settings?.modelDir, loadModels])

  // Выбрать папку с моделями
  const chooseModelDir = async () => {
    try {
      const res = await ipc.chooseDirectory()
      console.log('Directory selection result:', res)
      if ('path' in res) {
        console.log('Saving modelDir:', res.path)
        await saveSettings({ modelDir: res.path })
        console.log('ModelDir saved successfully')
      }
    } catch (error) {
      console.error('Error choosing directory:', error)
      setModelsError(error instanceof Error ? error.message : String(error))
    }
  }

  // Применить модель
  const applyModel = async (modelPath: string) => {
    setApplyingModel(true)
    setModelsError(null)
    try {
      modal.setLoadingTopmost(true, { showSpinner: true, text: 'Загрузка модели...' })
      const res = await ipc.setModel(modelPath)
      if ('error' in res && res.error) {
        setModelsError(res.error)
        modal.setLoadingTopmost(false)
      } else {
        await saveSettings({ modelPath: modelPath })
        setModelsError(null)
        modal.setLoadingTopmost(false)
        setSuccessMessage('Модель успешно загружена!')
        // Скрываем сообщение об успехе через 3 секунды
        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      }
    } catch (e) {
      setModelsError(e instanceof Error ? e.message : String(e))
      modal.setLoadingTopmost(false)
    } finally {
      setApplyingModel(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка настроек...</div>
      </div>
    )
  }

  console.log('Current settings:', settings)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
        {error && <div className={styles.error}>Ошибка: {error}</div>}
      </div>

      {/* Модель и пути */}
      <SettingsSection 
        title="Модель и пути" 
        description="Настройки модели и путей к файлам"
      >
        <SettingsField 
          label="Папка с моделями" 
          description="Выберите папку, содержащую модели .gguf"
        >
          <div className={styles.pathInput}>
            <input
              type="text"
              value={settings.modelDir || ''}
              onChange={(e) => saveSettings({ modelDir: e.target.value })}
              placeholder="Путь к папке с моделями"
              className={styles.input}
            />
            <button onClick={chooseModelDir} className={styles.browseButton}>
              Обзор...
            </button>
          </div>
        </SettingsField>

        <SettingsField 
          label="Текущая модель" 
          description="Выберите модель для использования"
        >
          <div className={styles.modelSelect}>
            <select
              value={settings.modelPath || ''}
              onChange={(e) => saveSettings({ modelPath: e.target.value })}
              disabled={modelsLoading}
              className={styles.select}
            >
              <option value="">Выберите модель</option>
              {models.map((m) => (
                <option key={m.path} value={m.path}>
                  {m.name}
                </option>
              ))}
            </select>
            <button 
              onClick={() => settings.modelPath && applyModel(settings.modelPath)}
              disabled={!settings.modelPath || modelsLoading || applyingModel}
              className={styles.applyButton}
            >
              {applyingModel ? 'Загрузка...' : 'Применить'}
            </button>
          </div>
        </SettingsField>

        {modelsError && (
          <div className={styles.error}>Ошибка моделей: {modelsError}</div>
        )}

        {successMessage && (
          <div className={styles.success}>{successMessage}</div>
        )}

        {/* Отображение текущих значений для отладки */}
        <div className={styles.debugInfo}>
          <div><strong>Текущая папка:</strong> {settings.modelDir || 'Не установлена'}</div>
          <div><strong>Текущая модель:</strong> {settings.modelPath || 'Не выбрана'}</div>
          <div><strong>Загружено моделей:</strong> {models.length}</div>
        </div>
      </SettingsSection>

      {/* Параметры генерации */}
      <SettingsSection 
        title="Параметры генерации" 
        description="Настройки для генерации текста"
      >
        <SettingsField 
          label="Максимум токенов" 
          description="Максимальное количество токенов для генерации"
        >
          <NumberInput
            value={settings.generation.maxTokens}
            onChange={(value) => updateSection('generation', { maxTokens: value })}
            min={1}
            max={4096}
          />
        </SettingsField>

        <SettingsField 
          label="Температура" 
          description="Контролирует случайность генерации (0.0 = детерминированно, 2.0 = очень случайно)"
        >
          <SliderInput
            value={settings.generation.temperature}
            onChange={(value) => updateSection('generation', { temperature: value })}
            min={0}
            max={2}
            step={0.01}
          />
        </SettingsField>

        <SettingsField 
          label="Top P" 
          description="Ядерная выборка - учитывает только токены с суммарной вероятностью до этого значения"
        >
          <SliderInput
            value={settings.generation.topP}
            onChange={(value) => updateSection('generation', { topP: value })}
            min={0}
            max={1}
            step={0.01}
          />
        </SettingsField>

        <SettingsField 
          label="Top K" 
          description="Ограничивает выборку топ-K токенами"
        >
          <NumberInput
            value={settings.generation.topK}
            onChange={(value) => updateSection('generation', { topK: value })}
            min={1}
            max={100}
          />
        </SettingsField>

        <SettingsField 
          label="Штраф за повторение" 
          description="Уменьшает вероятность повторения недавних токенов"
        >
          <SliderInput
            value={settings.generation.repeatPenalty}
            onChange={(value) => updateSection('generation', { repeatPenalty: value })}
            min={0.5}
            max={2.0}
            step={0.01}
          />
        </SettingsField>

        <SettingsField 
          label="Окно штрафа за повторение" 
          description="Количество последних токенов для учета при штрафе за повторение"
        >
          <NumberInput
            value={settings.generation.repeatPenaltyWindow}
            onChange={(value) => updateSection('generation', { repeatPenaltyWindow: value })}
            min={1}
            max={512}
          />
        </SettingsField>
      </SettingsSection>

      {/* Производительность */}
      <SettingsSection 
        title="Производительность" 
        description="Настройки производительности и ресурсов"
      >
        <SettingsField 
          label="Размер контекста" 
          description="Максимальное количество токенов в контексте"
        >
          <NumberInput
            value={settings.performance.contextSize}
            onChange={(value) => updateSection('performance', { contextSize: value })}
            min={512}
            max={8192}
          />
        </SettingsField>

        <SettingsField 
          label="Количество потоков" 
          description="Количество CPU потоков для обработки"
        >
          <NumberInput
            value={settings.performance.threads}
            onChange={(value) => updateSection('performance', { threads: value })}
            min={1}
            max={16}
          />
        </SettingsField>

        <SettingsField 
          label="GPU слои" 
          description="Количество слоев для обработки на GPU (0 = только CPU)"
        >
          <NumberInput
            value={settings.performance.gpuLayers}
            onChange={(value) => updateSection('performance', { gpuLayers: value })}
            min={0}
            max={100}
          />
        </SettingsField>

        <SettingsField 
          label="Размер батча" 
          description="Размер батча для обработки"
        >
          <NumberInput
            value={settings.performance.batchSize}
            onChange={(value) => updateSection('performance', { batchSize: value })}
            min={32}
            max={2048}
          />
        </SettingsField>

        <SettingsField 
          label="Использовать mmap" 
          description="Использовать memory mapping для загрузки модели"
        >
          <ToggleSwitch
            checked={settings.performance.useMmap}
            onChange={(checked) => updateSection('performance', { useMmap: checked })}
          />
        </SettingsField>

        <SettingsField 
          label="Использовать mlock" 
          description="Заблокировать память модели в RAM"
        >
          <ToggleSwitch
            checked={settings.performance.useMlock}
            onChange={(checked) => updateSection('performance', { useMlock: checked })}
          />
        </SettingsField>

        <SettingsField 
          label="Режим низкой VRAM" 
          description="Оптимизация для видеокарт с малым объемом памяти"
        >
          <ToggleSwitch
            checked={settings.performance.lowVram}
            onChange={(checked) => updateSection('performance', { lowVram: checked })}
          />
        </SettingsField>
      </SettingsSection>

    </div>
  )
}
