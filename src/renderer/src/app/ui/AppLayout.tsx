import { useState } from 'react'
import styles from './AppLayout.module.css'
// import { useModal } from '../../shared/ui/modal'
// import { ModelSelectModal } from '../../features/model-select/ui/ModelSelectModal'
import {
  LuHome,
  LuFileCode,
  LuSearchCheck,
  LuBookOpen,
  LuActivity,
  LuSettings,
  LuChevronFirst,
  LuChevronLast
} from 'react-icons/lu'

type TabKey = 'home' | 'editor' | 'analysis' | 'docs' | 'logs' | 'settings'

export function AppLayout({
  Home,
  Editor,
  Analysis,
  Docs,
  Logs,
  Settings
}: {
  Home: React.ComponentType
  Editor: React.ComponentType
  Analysis: React.ComponentType
  Docs: React.ComponentType
  Logs: React.ComponentType
  Settings: React.ComponentType
}): React.JSX.Element {
  const [tab, setTab] = useState<TabKey>('home')
  const [collapsed, setCollapsed] = useState(false)

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Главная', icon: <LuHome /> },
    { key: 'editor', label: 'Редактор кода', icon: <LuFileCode /> },
    { key: 'analysis', label: 'Анализ кода', icon: <LuSearchCheck /> },
    { key: 'docs', label: 'Документация', icon: <LuBookOpen /> },
    { key: 'logs', label: 'Логи и метрики', icon: <LuActivity /> }
  ]

  const Content =
    tab === 'home'
      ? Home
      : tab === 'editor'
        ? Editor
        : tab === 'analysis'
          ? Analysis
          : tab === 'docs'
            ? Docs
            : tab === 'logs'
              ? Logs
              : Settings

  return (
    <div className={`${styles.root} ${collapsed ? styles.collapsed : ''}`}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandText}>{'\u00A0'}</span>
        </div>
        <nav className={styles.nav}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`${styles.navBtn} ${tab === t.key ? styles.active : ''}`}
              onClick={() => setTab(t.key)}
            >
              <span aria-hidden style={{ fontSize: '20px' }}>
                {t.icon}
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <button
          type="button"
          className={styles.collapseBtn}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? <LuChevronLast /> : <LuChevronFirst />}
        </button>
      </aside>
      <header className={styles.header}>
        <button
          className={styles.gearBtn}
          aria-label="Settings"
          onClick={() => setTab('settings')}
          title="Настройки"
        >
          <LuSettings />
        </button>
      </header>
      <main className={styles.content}>
        <Content />
      </main>
    </div>
  )
}
