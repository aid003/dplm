import { ReactNode } from 'react'
import styles from './SettingsField.module.css'

interface SettingsFieldProps {
  label: string
  description?: string
  children: ReactNode
  required?: boolean
}

export function SettingsField({ label, description, children, required = false }: SettingsFieldProps) {
  return (
    <div className={styles.field}>
      <div className={styles.label}>
        <label>{label}</label>
        {required && <span className={styles.required}>*</span>}
      </div>
      {description && (
        <div className={styles.description}>{description}</div>
      )}
      <div className={styles.input}>
        {children}
      </div>
    </div>
  )
}
