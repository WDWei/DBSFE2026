import { useQuery } from '@tanstack/react-query'
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type SyntheticEvent,
} from 'react'
import { payeesQuery, useCreateTransfer } from '../../api/queries'
import type { Account, Customer } from '../../api/types'
import { CloseIcon } from '../../components/Icons'
import { depositAccounts } from '../../lib/accounts'
import { formatMoney } from '../../lib/format'
import { AmountStep } from './AmountStep'
import {
  buildTransferRequest,
  EMPTY_RECIPIENT,
  summariseRecipient,
  type AmountValues,
} from './draft'
import { RecipientStep } from './RecipientStep'
import { ReviewStep } from './ReviewStep'
import { Stepper, type StepId } from './Stepper'
import { SuccessPanel } from './SuccessPanel'
import styles from './TransferDialog.module.css'

interface TransferDialogProps {
  customer: Customer
  accounts: Account[]
  onClose: () => void
  /** Gets focus back when the dialog closes. */
  returnFocusRef: RefObject<HTMLElement | null>
}

export function TransferDialog({
  customer,
  accounts,
  onClose,
  returnFocusRef,
}: TransferDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  const [step, setStep] = useState<StepId>('recipient')
  const [recipient, setRecipient] = useState(EMPTY_RECIPIENT)
  const [amount, setAmount] = useState<AmountValues>({
    fromAccountId: depositAccounts(accounts)[0]?.id ?? '',
    amount: '',
    note: '',
  })

  const payees = useQuery(payeesQuery)
  const transfer = useCreateTransfer()
  const isSendingRef = useRef(false)

  // A layout effect, so the dialog is open before the steps' effects move focus
  // into it (child effects run before parent ones).
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const opener = returnFocusRef.current
    dialog?.showModal()
    return () => {
      dialog?.close()
      opener?.focus()
    }
  }, [returnFocusRef])

  const requestClose = () => {
    // Closing mid-send would hide whether the money moved.
    if (!transfer.isPending) onClose()
  }

  const handleCancel = (event: SyntheticEvent) => {
    // Esc: closing is up to us, so that it unmounts and can be blocked.
    event.preventDefault()
    requestClose()
  }

  const handleNativeClose = () => {
    const dialog = dialogRef.current
    // The event is queued, so it can arrive after StrictMode's remount reopened
    // the dialog. Only an actually closed dialog needs handling.
    if (!dialog || dialog.open) return
    // Browsers force-close on a repeated Esc, even when `cancel` is prevented.
    if (transfer.isPending) dialog.showModal()
    else onClose()
  }

  const send = () => {
    // Sending twice moves the money twice. `disabled` only applies after the
    // next render, so guard the gap between the click and that render.
    if (isSendingRef.current) return
    isSendingRef.current = true
    transfer.mutate(buildTransferRequest(recipient, amount), {
      onSettled: () => {
        isSendingRef.current = false
      },
    })
  }

  const sent = transfer.data?.transfer
  const summary = summariseRecipient(recipient, payees.data ?? [])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={handleNativeClose}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          New transfer
        </h2>
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          disabled={transfer.isPending}
          onClick={requestClose}
        >
          <CloseIcon />
        </button>
      </header>

      {!sent && <Stepper current={step} />}

      {/* Stays mounted so that screen readers announce the change. */}
      <div role="status" aria-live="polite" className="visually-hidden">
        {sent &&
          `Transfer sent: ${formatMoney(sent.amount)} to ${sent.recipient.name}.`}
      </div>

      {sent ? (
        <SuccessPanel transfer={sent} onDone={onClose} />
      ) : step === 'recipient' ? (
        <RecipientStep
          values={recipient}
          onCancel={requestClose}
          onContinue={(values) => {
            setRecipient(values)
            setStep('amount')
          }}
        />
      ) : step === 'amount' ? (
        <AmountStep
          values={amount}
          accounts={depositAccounts(accounts)}
          customer={customer}
          onBack={(values) => {
            setAmount(values)
            setStep('recipient')
          }}
          onContinue={(values) => {
            setAmount(values)
            setStep('review')
          }}
        />
      ) : (
        <ReviewStep
          amount={amount}
          fromAccount={accounts.find((a) => a.id === amount.fromAccountId)}
          recipient={summary}
          isSending={transfer.isPending}
          error={transfer.error}
          onBack={() => {
            transfer.reset()
            setStep('amount')
          }}
          onConfirm={send}
        />
      )}
    </dialog>
  )
}
