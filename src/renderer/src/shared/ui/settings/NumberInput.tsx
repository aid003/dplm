import styles from './NumberInput.module.css'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  placeholder?: string
}

export function NumberInput({ 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  disabled = false, 
  placeholder 
}: NumberInputProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      placeholder={placeholder}
      className={styles.input}
    />
  )
}
