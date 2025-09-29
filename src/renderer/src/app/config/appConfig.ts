export const appConfig = {
  name: 'DPLM',
  version: '1.0.0',
  defaultTab: 'home' as const,
  tabs: [
    { key: 'home', label: 'Главная' },
    { key: 'editor', label: 'Редактор кода' },
    { key: 'analysis', label: 'Анализ кода' },
    { key: 'docs', label: 'Документация' },
    { key: 'logs', label: 'Логи и метрики' },
    { key: 'settings', label: 'Настройки' }
  ]
} as const
