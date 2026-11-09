import { useEffect, useRef } from 'react'
import type { Transfer } from '../../api/types'
import { Button } from '../../components/Button'
import { CheckIcon } from '../../components/Icons'
import { formatMoney } from '../../lib/format'
import styles from './SuccessPanel.module.css'

interface SuccessPanelProps {
  transfer: Transfer
  onDone: () => void
}

export function SuccessPanel({ transfer, onDone }: SuccessPanelProps) {
  const doneRef = useRef<HTMLButtonElement>(null)

  // The button that sent the transfer is gone, so focus needs a new home.
  useEffect(() => {
    doneRef.current?.focus()
  }, [])

  const { recipient } = transfer

  return (
    <div className={styles.panel}>
      <span className={styles.icon}>
        <CheckIcon />
      </span>
      <h3 className={styles.title}>Transfer sent</h3>
      <p className={`${styles.amount} amount`}>{formatMoney(transfer.amount)}</p>
      <p className={styles.recipient}>
        to {recipient.name} · {recipient.bank} · {recipient.accountNumberMasked}
      </p>
      <p>
        Reference <strong className="amount">{transfer.reference}</strong>
      </p>
      <p className={styles.recipient}>The money should arrive within minutes.</p>
      <Button ref={doneRef} className={styles.done} onClick={onDone}>
        Back to dashboard
      </Button>
    </div>
  )
}
