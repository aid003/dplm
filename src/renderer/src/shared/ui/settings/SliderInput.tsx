import styles from './SliderInput.module.css'

interface SliderInputProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  disabled?: boolean
  showValue?: boolean
}

export function SliderInput({ 
  value, 
  onChange, 
  min, 
  max, 
  step = 0.01, 
  disabled = false, 
  showValue = true 
}: SliderInputProps) {
  return (
    <div className={styles.container}>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={styles.slider}
      />
      {showValue && (
        <span className={styles.value}>{value.toFixed(2)}</span>
      )}
    </div>
  )
}
