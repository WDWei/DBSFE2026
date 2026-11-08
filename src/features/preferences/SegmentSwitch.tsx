import type { Segment } from '../../api/types'
import styles from './SegmentSwitch.module.css'

const OPTIONS: { value: Segment; label: string }[] = [
  { value: 'retail', label: 'Retail' },
  { value: 'premium', label: 'Premium' },
]

interface SegmentSwitchProps {
  segment: Segment
  onChange: (segment: Segment) => void
  className?: string
}

export function SegmentSwitch({ segment, onChange, className }: SegmentSwitchProps) {

  return (
    <div role="group" aria-label="Customer segment"       
    className={[styles.segmentSwitch, className].filter(Boolean).join(' ')}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.segmentOption}
          aria-pressed={segment === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}