import { useState } from 'react'
import {
  LuHome,
  LuFileCode,
  LuSearchCheck,
  LuBookOpen,
  LuActivity
} from 'react-icons/lu'
import { HomePage } from '../../pages/home'
import { CodeEditorPage } from '../../pages/code-editor'
import { CodeAnalysisPage } from '../../pages/code-analysis'
import { DocsPage } from '../../pages/docs'
import { LogsPage } from '../../pages/logs'
import { SettingsPage } from '../../pages/settings'
import { AppLayout } from '../../shared/ui/layout/AppLayout'

type TabKey = 'home' | 'editor' | 'analysis' | 'docs' | 'logs' | 'settings'

export function AppRouter() {
  const [tab, setTab] = useState<TabKey>('home')

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Главная', icon: <LuHome /> },
    { key: 'editor', label: 'Редактор кода', icon: <LuFileCode /> },
    { key: 'analysis', label: 'Анализ кода', icon: <LuSearchCheck /> },
    { key: 'docs', label: 'Документация', icon: <LuBookOpen /> },
    { key: 'logs', label: 'Логи и метрики', icon: <LuActivity /> }
  ]

  const Content =
    tab === 'home'
      ? HomePage
      : tab === 'editor'
        ? CodeEditorPage
        : tab === 'analysis'
          ? CodeAnalysisPage
          : tab === 'docs'
            ? DocsPage
            : tab === 'logs'
              ? LogsPage
              : SettingsPage

  return (
    <AppLayout
      tabs={tabs}
      currentTab={tab}
      onTabChange={setTab}
      Content={Content}
    />
  )
}
