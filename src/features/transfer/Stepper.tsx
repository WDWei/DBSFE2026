import styles from './Stepper.module.css'

export type StepId = 'recipient' | 'amount' | 'review'

const STEPS: { id: StepId; label: string }[] = [
  { id: 'recipient', label: 'Recipient' },
  { id: 'amount', label: 'Amount' },
  { id: 'review', label: 'Review' },
]

export function Stepper({ current }: { current: StepId }) {
  return (
    <ol aria-label="Transfer progress" className={styles.stepper}>
      {STEPS.map((step, index) => (
        <li
          key={step.id}
          className={styles.step}
          aria-current={step.id === current ? 'step' : undefined}
        >
          <span aria-hidden="true" className={styles.number}>
            {index + 1}
          </span>
          {step.label}
        </li>
      ))}
    </ol>
  )
}
