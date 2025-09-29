import { useState } from 'react'
import styles from './AppLayout.module.css'
import {
  LuSettings,
  LuChevronFirst,
  LuChevronLast
} from 'react-icons/lu'

type TabKey = 'home' | 'editor' | 'analysis' | 'docs' | 'logs' | 'settings'

interface Tab {
  key: TabKey
  label: string
  icon: React.ReactNode
}

interface AppLayoutProps {
  tabs: Tab[]
  currentTab: TabKey
  onTabChange: (tab: TabKey) => void
  Content: React.ComponentType
}

export function AppLayout({
  tabs,
  currentTab,
  onTabChange,
  Content
}: AppLayoutProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false)

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
              className={`${styles.navBtn} ${currentTab === t.key ? styles.active : ''}`}
              onClick={() => onTabChange(t.key)}
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
          onClick={() => onTabChange('settings')}
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
