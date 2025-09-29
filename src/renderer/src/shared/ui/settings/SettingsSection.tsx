import { ReactNode } from 'react'
import styles from './SettingsSection.module.css'

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

export function SettingsSection({ 
  title, 
  description, 
  children, 
  collapsible = false, 
  defaultExpanded = true 
}: SettingsSectionProps) {
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {description && (
          <p className={styles.description}>{description}</p>
        )}
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
